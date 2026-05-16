// ============================================
// scrape.js — Run Instagram + TikTok scrapers in parallel via Apify.
// Outputs /data/raw-instagram.json and /data/raw-tiktok.json
// (normalized to a common shape).
//
// Apify actor input schemas drift; the inputs below match the docs
// as of late 2025. If your run returns 0 items, open the actor page
// on apify.com, check the latest input spec, and tweak the INPUTS
// constants near the top of each function.
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
// Instagram scraper
// ============================================
async function scrapeInstagram() {
  console.log('▶ Instagram scrape starting (~5-10 min)...');
  // Actor: apify/instagram-search-scraper
  // We do BOTH hashtag and location searches in one call.
  const INPUT = {
    search: [...HASHTAGS_IG.map((h) => '#' + h), ...LOCATIONS_IG],
    searchType: 'hashtag', // most reliable for finding accounts via post authors
    searchLimit: 60, // posts per query — actor will return up to this many
    resultsLimit: PER_PLATFORM,
  };
  console.log('  input:', JSON.stringify(INPUT, null, 2));

  const run = await client.actor('apify/instagram-search-scraper').call(INPUT);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  // Items here are typically posts; pull the unique owner profiles out.
  const seen = new Map();
  for (const it of items) {
    const owner = it.ownerUsername || it.username || it.owner?.username;
    if (!owner) continue;
    if (seen.has(owner)) continue;
    seen.set(owner, it);
  }

  const profiles = [...seen.values()].map((it) => {
    const username = it.ownerUsername || it.username || it.owner?.username;
    const bio = it.ownerBiography || it.biography || it.bio || '';
    return {
      username,
      platform: 'instagram',
      followers: Number(it.ownerFollowersCount || it.followersCount || 0),
      following: Number(it.ownerFollowingCount || it.followingCount || 0),
      posts_count: Number(it.ownerPostsCount || it.postsCount || 0),
      bio,
      email_from_bio: extractEmailFromBio(bio),
      engagement_rate: calcEngagementRate(it),
      last_post_date: lastPostDate(it) || (it.timestamp ? new Date(it.timestamp).toISOString() : null),
      location: it.locationName || it.locationCity || null,
      profile_url: `https://instagram.com/${username}`,
      avatar_url: it.ownerProfilePicUrl || it.profilePicUrl || null,
      detected_language: detectLanguage(bio),
      _source: 'apify/instagram-search-scraper',
    };
  });

  console.log(`✓ Scraped ${profiles.length} unique Instagram profiles`);
  await writeFile(join(DATA_DIR, 'raw-instagram.json'), JSON.stringify(profiles, null, 2));
  return profiles.length;
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
// Main
// ============================================
async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  const started = Date.now();
  try {
    const [ig, tt] = await Promise.all([
      scrapeInstagram().catch((e) => { console.error('IG scrape failed:', e.message); return 0; }),
      scrapeTikTok().catch((e) => { console.error('TikTok scrape failed:', e.message); return 0; }),
    ]);
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`\n══════════════════════════════════════`);
    console.log(`✓ Scrape complete in ${secs}s`);
    console.log(`  Instagram: ${ig} profiles → data/raw-instagram.json`);
    console.log(`  TikTok:    ${tt} profiles → data/raw-tiktok.json`);
    console.log(`  Total raw: ${ig + tt} (target ${TARGET}; dedup happens in enrich.js)`);
    console.log(`══════════════════════════════════════`);
  } catch (err) {
    console.error('Scrape pipeline error:', err);
    process.exit(1);
  }
}

main();
