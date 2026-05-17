// ============================================
// scrape.js — Run Instagram + TikTok scrapers via Apify.
// Outputs /data/raw-instagram.json and /data/raw-tiktok.json
// (normalized to a common shape).
//
// Platform selection:
//   node src/scrape.js                    → both (default)
//   node src/scrape.js --only=instagram   → IG only
//   node src/scrape.js --only=tiktok      → TT only
//
// Instagram is a TWO-STAGE pipeline:
//   Stage 1 — apify/instagram-hashtag-scraper extracts unique
//             ownerUsernames from public posts under each hashtag.
//   Stage 2 — apify/instagram-profile-scraper enriches those
//             usernames with followers, bio, posts_count, latest
//             posts (for engagement rate calc).
//
// This is necessary because instagram-hashtag-scraper returns
// post-shape objects with NO follower or bio data (that's not its
// job). The previously used apify/instagram-search-scraper is
// deprecated / behind paid tier and was failing silently.
//
// Apify actor input schemas drift; the inputs below match the docs
// as of mid-2026. If your run returns 0 items, open the actor page
// on apify.com, check the latest input spec, and tweak the INPUTS
// constants near each scrape function.
// ============================================

import 'dotenv/config';
import { ApifyClient } from 'apify-client';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const TOKEN = process.env.APIFY_API_TOKEN;
const TARGET = parseInt(process.env.TARGET_PROFILES || '200', 10);

if (!TOKEN || TOKEN.startsWith('apify_api_xxx')) {
  console.error('✗ APIFY_API_TOKEN missing or placeholder. Fill /outreach/.env first.');
  process.exit(1);
}

const client = new ApifyClient({ token: TOKEN });

const HASHTAGS_IG = [
  'mujercolombiana', 'paisas', 'cafeteras', 'hinchadafemenina',
  'mundial2026', 'colombianasbellas', 'tricolor',
  'modacolombiana', 'fitnesscolombia', 'beautycolombia',
];

const HASHTAGS_TT = [
  'mujercolombiana', 'paisas', 'cafeteras', 'hinchadafemenina',
  'mundial2026', 'colombianas', 'fypcolombia',
];

const LOCATIONS_IG = [
  'Pereira', 'Armenia', 'Medellín', 'Cali', 'Bogotá', 'Bucaramanga', 'Manizales',
];

// Per-platform target — split the global TARGET across the two so
// dedup can pull a fuller list later.
const PER_PLATFORM = Math.ceil(TARGET * 0.7); // request ~70% on each side, dedup trims

// ============================================
// Helpers
// ============================================
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

function extractEmailFromBio(bio) {
  if (!bio) return null;
  const match = String(bio).match(EMAIL_RE);
  return match ? match[0].toLowerCase() : null;
}

function detectLanguage(bio) {
  if (!bio) return 'unknown';
  const es = /[áéíóúñ¿¡]|colombia|mujer|paisa|hola|gracias|bello|amor/i.test(bio);
  return es ? 'es' : 'en';
}

function calcEngagementRate(profile) {
  // Heuristic: average likes per recent post / followers * 100.
  // Field names vary across actors — try a few well-known shapes.
  const followers = Number(profile.followersCount || profile.followers || 0);
  if (!followers) return 0;
  const posts = profile.latestPosts || profile.posts || profile.lastPosts || [];
  if (!Array.isArray(posts) || posts.length === 0) return 0;
  const slice = posts.slice(0, 10);
  let totalLikes = 0;
  let n = 0;
  for (const p of slice) {
    const likes = Number(p.likesCount || p.likes || p.diggCount || p.heartCount || 0);
    if (likes > 0) { totalLikes += likes; n++; }
  }
  if (!n) return 0;
  const avgLikes = totalLikes / n;
  return Math.round((avgLikes / followers) * 10000) / 100; // 2 decimals %
}

function lastPostDate(profile) {
  const posts = profile.latestPosts || profile.posts || profile.lastPosts || [];
  if (!posts.length) return null;
  const ts = posts[0].timestamp || posts[0].createTime || posts[0].takenAtTimestamp;
  if (!ts) return null;
  if (typeof ts === 'number') {
    // Some actors use unix seconds, some milliseconds.
    return new Date(ts < 1e12 ? ts * 1000 : ts).toISOString();
  }
  return new Date(ts).toISOString();
}

// ============================================
// Instagram scraper — two-stage
// ============================================
async function scrapeInstagram() {
  console.log('\n▶ Instagram scrape (two-stage)');

  // ───────────────────────────────────────────
  // STAGE 1 — hashtag-scraper: extract usernames
  // ───────────────────────────────────────────
  const stage1Input = {
    hashtags: HASHTAGS_IG,
    resultsLimit: 50,
  };
  console.log('  → Stage 1: apify/instagram-hashtag-scraper');
  console.log('    input:', JSON.stringify(stage1Input));

  let stage1Run;
  try {
    stage1Run = await client.actor('apify/instagram-hashtag-scraper').call(stage1Input);
  } catch (err) {
    console.error('  ✗ Stage 1 actor call failed:', err.message || err);
    if (err.statusCode) console.error('    statusCode:', err.statusCode);
    if (err.type) console.error('    type:', err.type);
    throw err;
  }
  console.log(`    runId: ${stage1Run.id} · status: ${stage1Run.status}`);

  const { items: posts } = await client.dataset(stage1Run.defaultDatasetId).listItems();
  console.log(`    → Got ${posts.length} posts from Instagram`);

  if (posts.length === 0) {
    console.warn('  ⚠ Stage 1 returned 0 posts — bailing on Instagram.');
    return 0;
  }

  // Dedupe by ownerUsername; cache per-post likes/comments/timestamp
  // so we can recover an engagement signal if Stage 2 profile data
  // doesn't include latestPosts.
  const usernameCache = new Map();
  for (const p of posts) {
    const u = p.ownerUsername;
    if (!u) continue;
    if (!usernameCache.has(u)) {
      usernameCache.set(u, {
        fullName: p.ownerFullName || null,
        ownerId: p.ownerId || null,
        hashtagPosts: [],
      });
    }
    usernameCache.get(u).hashtagPosts.push({
      likesCount: Number(p.likesCount || 0),
      commentsCount: Number(p.commentsCount || 0),
      timestamp: p.timestamp || null,
      caption: p.caption || '',
      url: p.url || null,
      type: p.type || null,
    });
  }
  const uniqueUsernames = [...usernameCache.keys()];
  console.log(`    → ${uniqueUsernames.length} unique usernames extracted`);

  if (uniqueUsernames.length === 0) {
    console.warn('  ⚠ Zero usernames after dedup — bailing.');
    return 0;
  }

  // ───────────────────────────────────────────
  // STAGE 2 — profile-scraper: enrich each username
  // ───────────────────────────────────────────
  const stage2Input = {
    usernames: uniqueUsernames,
    resultsType: 'details',
    resultsLimit: uniqueUsernames.length,
  };
  console.log(`  → Stage 2: apify/instagram-profile-scraper`);
  console.log(`    input: { usernames: [${uniqueUsernames.length} items], resultsType: 'details' }`);

  let stage2Run;
  try {
    stage2Run = await client.actor('apify/instagram-profile-scraper').call(stage2Input);
  } catch (err) {
    console.error('  ✗ Stage 2 actor call failed:', err.message || err);
    if (err.statusCode) console.error('    statusCode:', err.statusCode);
    if (err.type) console.error('    type:', err.type);
    throw err;
  }
  console.log(`    runId: ${stage2Run.id} · status: ${stage2Run.status}`);

  const { items: rawProfiles } = await client.dataset(stage2Run.defaultDatasetId).listItems();
  console.log(`    → Got ${rawProfiles.length} profiles enriched`);

  // ───────────────────────────────────────────
  // Normalize to the shape enrich.js expects
  // ───────────────────────────────────────────
  const profiles = rawProfiles.map((p) => {
    const username = p.username || p.ownerUsername;
    const cached = usernameCache.get(username);
    const bio = p.biography || p.bio || '';
    // Prefer profile-scraper's latestPosts (richer); fall back to the
    // hashtag posts we already have cached if absent.
    const postsForER = (Array.isArray(p.latestPosts) && p.latestPosts.length > 0)
      ? p.latestPosts
      : (cached?.hashtagPosts || []);
    const profileForER = {
      followersCount: Number(p.followersCount || 0),
      latestPosts: postsForER,
    };
    return {
      username,
      platform: 'instagram',
      followers: Number(p.followersCount || 0),
      following: Number(p.followsCount || p.followingCount || 0),
      posts_count: Number(p.postsCount || 0),
      bio,
      email_from_bio: extractEmailFromBio(bio) || extractEmailFromBio(p.businessEmail || ''),
      engagement_rate: calcEngagementRate(profileForER),
      last_post_date: lastPostDate(p)
        || (cached?.hashtagPosts?.[0]?.timestamp
            ? new Date(cached.hashtagPosts[0].timestamp).toISOString()
            : null),
      location: p.businessAddressJson?.city_name || p.businessCategoryName || null,
      profile_url: `https://instagram.com/${username}`,
      avatar_url: p.profilePicUrlHD || p.profilePicUrl || null,
      detected_language: detectLanguage(bio),
      full_name: p.fullName || cached?.fullName || null,
      verified: !!p.verified,
      private: !!p.private,
      _source: 'apify/instagram-hashtag+profile-scraper',
    };
  });

  // Drop any with no username (shouldn't happen but safe-guard)
  const valid = profiles.filter((x) => x.username);

  console.log(`\n  ✓ Instagram done: ${valid.length} normalized profiles`);
  await writeFile(join(DATA_DIR, 'raw-instagram.json'), JSON.stringify(valid, null, 2));
  return valid.length;
}

// ============================================
// TikTok scraper
// ============================================
async function scrapeTikTok() {
  console.log('▶ TikTok scrape starting (~5-10 min)...');
  const INPUT = {
    hashtags: HASHTAGS_TT,
    resultsPerPage: 50,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    profileScrapeSections: ['videos'],
    maxProfilesPerQuery: Math.ceil(PER_PLATFORM / HASHTAGS_TT.length),
  };
  console.log('  input:', JSON.stringify(INPUT, null, 2));

  const run = await client.actor('clockworks/tiktok-scraper').call(INPUT);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  const seen = new Map();
  for (const it of items) {
    const username = it.authorMeta?.name || it.author?.uniqueId || it.username;
    if (!username) continue;
    if (seen.has(username)) continue;
    seen.set(username, it);
  }

  const profiles = [...seen.values()].map((it) => {
    const a = it.authorMeta || it.author || {};
    const username = a.name || a.uniqueId || it.username;
    const bio = a.signature || a.bio || '';
    return {
      username,
      platform: 'tiktok',
      followers: Number(a.fans || a.followerCount || 0),
      following: Number(a.following || a.followingCount || 0),
      posts_count: Number(a.video || a.videoCount || 0),
      bio,
      email_from_bio: extractEmailFromBio(bio),
      engagement_rate: calcEngagementRate(it),
      last_post_date: lastPostDate(it) || (it.createTime ? new Date(it.createTime * 1000).toISOString() : null),
      location: a.region || null,
      profile_url: `https://tiktok.com/@${username}`,
      avatar_url: a.avatar || a.avatarLarger || null,
      detected_language: detectLanguage(bio),
      _source: 'clockworks/tiktok-scraper',
    };
  });

  console.log(`✓ Scraped ${profiles.length} unique TikTok profiles`);
  await writeFile(join(DATA_DIR, 'raw-tiktok.json'), JSON.stringify(profiles, null, 2));
  return profiles.length;
}

// ============================================
// Main — CLI:
//   node src/scrape.js                    → both platforms
//   node src/scrape.js --only=instagram   → IG only
//   node src/scrape.js --only=tiktok      → TT only
// ============================================
function parseOnly() {
  const arg = process.argv.slice(2).find((a) => a.startsWith('--only='));
  if (!arg) return null;
  const value = arg.split('=')[1]?.toLowerCase();
  if (!['instagram', 'tiktok'].includes(value)) {
    console.error(`✗ --only must be 'instagram' or 'tiktok' (got: ${value})`);
    process.exit(1);
  }
  return value;
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  const only = parseOnly();
  const runIG = !only || only === 'instagram';
  const runTT = !only || only === 'tiktok';

  console.log('══════════════════════════════════════');
  console.log(`Scrape plan · Instagram: ${runIG ? 'YES' : 'skip'} · TikTok: ${runTT ? 'YES' : 'skip'}`);
  console.log('══════════════════════════════════════');

  const started = Date.now();
  // Each scrape errors loudly now — failure halts the pipeline so a
  // silent zero-result run can't go unnoticed. If you want resilient
  // batch behavior in the future, wrap individual calls here.
  let ig = 0, tt = 0;
  if (runIG) ig = await scrapeInstagram();
  if (runTT) tt = await scrapeTikTok();

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n══════════════════════════════════════`);
  console.log(`✓ Scrape complete in ${secs}s`);
  if (runIG) console.log(`  Instagram: ${ig} profiles → data/raw-instagram.json`);
  if (runTT) console.log(`  TikTok:    ${tt} profiles → data/raw-tiktok.json`);
  console.log(`  Total raw: ${ig + tt} (target ${TARGET}; dedup happens in enrich.js)`);
  console.log(`══════════════════════════════════════`);
}

main().catch((err) => {
  console.error('\n✗ Scrape pipeline error:', err.message || err);
  process.exit(1);
});
