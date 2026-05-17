// ============================================
// enrich.js — Reads raw-instagram.json + raw-tiktok.json, dedups,
// filters, scores, extracts emails, writes data/enriched.json sorted
// by score DESC.
//
// Filter contract (everything below is OR-rejected):
//   - 2_000 ≤ followers ≤ 150_000  (relaxed from 3K-100K)
//   - bio not empty
//   - bio has none of the BLACKLIST keywords (onlyfans, agency, etc.)
//   - recent activity: last_post_date within 30d (IG) / 14d (TikTok)
//
// Engagement is NO LONGER a hard filter: the TikTok actor doesn't
// expose ER, so every TikTok-only profile reported ER=0 and was
// rejected wholesale. ER still factors into scoring; the final
// triage happens in the swipe admin UI.
//
// Scoring (out of 110, capped at 100):
//   40  engagement rate         (4%+ = full; 0% = 20 fallback; linear in between)
//   25  follower sweet spot     (5K-30K = full; degraded outside)
//   15  niche bio keywords      (5 pts/match, capped)
//   10  email present in bio
//   10  multi-platform (IG + TikTok)
//   10  activity bonus          (≥200 posts = 10, ≥50 = 5 — tie-breaker
//                                when ER is unknown)
// ============================================

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const BLACKLIST = [
  'onlyfans', 'only fans', 'agency', 'agencia', 'marketing manager',
  'press@', 'collab@', 'manager', 'representante', 'premium content',
];

const NICHE_KEYWORDS = [
  'fútbol', 'futbol', 'tricolor', 'colombia', 'moda', 'estilo',
  'fitness', 'paisa', 'cafetera', 'bogotá', 'bogota', 'medellín',
  'medellin', 'cali', 'pereira', 'mundial', 'selección', 'seleccion',
];

const COLOMBIA_LOCATIONS = [
  'colombia', 'pereira', 'armenia', 'medellín', 'medellin',
  'cali', 'bogotá', 'bogota', 'bucaramanga', 'manizales', 'cartagena',
  'barranquilla', 'eje cafetero', 'caldas', 'risaralda', 'quindío',
  'quindio', 'antioquia',
];

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;

// ============================================
// Scoring
// ============================================
function scoreEngagement(er) {
  // ER ≥ 4% → 40; ER 2-4% → linear ramp 0..40.
  // When er is 0 (TikTok scraper doesn't compute ER), give a neutral
  // baseline of 20 so TikTok-only profiles don't get systematically
  // demoted vs Instagram profiles where we DO have the metric.
  if (!Number.isFinite(er) || er === 0) return 20;
  if (er >= 4) return 40;
  if (er >= 2) return Math.round((er - 2) * 20); // 2 → 0, 4 → 40
  // Low but non-zero ER (0 < er < 2) — keep it small so a real low-
  // engagement signal still scores below an unknown one.
  return Math.max(0, Math.round(er * 5));
}

function scoreFollowers(n) {
  // Sweet spot 5K-30K = 25 pts.
  // Below: linear ramp from 2K (5pts) → 5K (25pts).
  // Above: linear decay from 30K (25pts) → 150K (3pts).
  if (n >= 5_000 && n <= 30_000) return 25;
  if (n >= 2_000 && n < 5_000) {
    return Math.round(5 + (n - 2_000) * (20 / 3_000));
  }
  if (n > 30_000 && n <= 150_000) {
    return Math.round(25 - (n - 30_000) * (22 / 120_000));
  }
  return 0; // out of range — filter should have caught this anyway
}

function scoreNiche(bio) {
  if (!bio) return 0;
  const lower = String(bio).toLowerCase();
  let hits = 0;
  for (const kw of NICHE_KEYWORDS) {
    if (lower.includes(kw)) hits += 1;
  }
  return Math.min(15, hits * 5);
}

function nicheMatches(bio) {
  if (!bio) return [];
  const lower = String(bio).toLowerCase();
  return NICHE_KEYWORDS.filter((kw) => lower.includes(kw));
}

// Activity bonus — used as a tie-breaker when engagement is unknown
// (TikTok). Up to +10 if the account is clearly active.
function scoreActivity(posts) {
  const n = Number(posts) || 0;
  if (n >= 200) return 10;
  if (n >= 50)  return 5;
  return 0;
}

function scoreOverall(record) {
  const sER       = scoreEngagement(record.engagement_rate);
  const sFollow   = scoreFollowers(record.followers);
  const sNiche    = scoreNiche(record.bio);
  const sEmail    = record.email ? 10 : 0;
  const sMulti    = record.platforms.length > 1 ? 10 : 0;
  const sActivity = scoreActivity(record.posts_count);
  return Math.min(100, sER + sFollow + sNiche + sEmail + sMulti + sActivity);
}

// ============================================
// Filtering
// ============================================
function withinRecentWindow(iso, days) {
  if (!iso) return false; // missing date → reject (be conservative)
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= days * 86_400_000;
}

function bioHasBlacklist(bio) {
  if (!bio) return false;
  const lower = String(bio).toLowerCase();
  return BLACKLIST.some((kw) => lower.includes(kw));
}

function looksColombian(record) {
  if (record.detected_language === 'es') return true;
  const loc = (record.location || '').toLowerCase();
  return COLOMBIA_LOCATIONS.some((c) => loc.includes(c));
}

function shouldKeep(record) {
  if (!record.bio || record.bio.trim().length === 0) return { keep: false, reason: 'no-bio' };
  if (bioHasBlacklist(record.bio)) return { keep: false, reason: 'blacklist' };
  if (record.followers < 2_000 || record.followers > 150_000) {
    return { keep: false, reason: 'followers-out-of-range' };
  }
  // Engagement-rate gate removed: the TikTok actor doesn't compute ER
  // so every TikTok profile reports 0 and was being rejected wholesale.
  // ER still feeds scoring; final triage happens in the swipe admin UI.
  //
  // if (record.engagement_rate < 2) {
  //   return { keep: false, reason: 'low-engagement' };
  // }
  const recencyDays = record.platforms.includes('instagram') ? 30 : 14;
  if (!withinRecentWindow(record.last_post_date, recencyDays)) {
    return { keep: false, reason: 'stale' };
  }
  if (!looksColombian(record)) {
    // Soft-reject — not ES + not in Colombia.
    return { keep: false, reason: 'not-colombia' };
  }
  return { keep: true };
}

// ============================================
// Dedup — same handle on IG + TikTok merges into one record.
// ============================================
function normalizeKey(username) {
  return String(username || '').trim().toLowerCase().replace(/^@/, '');
}

function mergeProfiles(igRaw, ttRaw) {
  const map = new Map();

  function pushIntoMap(raw, platform) {
    for (const r of raw) {
      const key = normalizeKey(r.username);
      if (!key) continue;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          id: key,
          username: r.username,
          platforms: [platform],
          followers: r.followers || 0,
          engagement_rate: r.engagement_rate || 0,
          posts_count: r.posts_count || 0,
          bio: r.bio || '',
          email: r.email_from_bio || null,
          dm_only: !r.email_from_bio,
          location: r.location || null,
          detected_language: r.detected_language || 'unknown',
          last_post_date: r.last_post_date || null,
          avatar_url: r.avatar_url || null,
          profile_urls: { [platform === 'instagram' ? 'ig' : 'tt']: r.profile_url },
        });
      } else {
        if (!existing.platforms.includes(platform)) existing.platforms.push(platform);
        existing.followers = Math.max(existing.followers, r.followers || 0);
        existing.engagement_rate = Math.max(existing.engagement_rate, r.engagement_rate || 0);
        existing.posts_count = Math.max(existing.posts_count || 0, r.posts_count || 0);
        if (!existing.bio && r.bio) existing.bio = r.bio;
        if (!existing.email && r.email_from_bio) {
          existing.email = r.email_from_bio;
          existing.dm_only = false;
        }
        if (!existing.location && r.location) existing.location = r.location;
        if (!existing.avatar_url && r.avatar_url) existing.avatar_url = r.avatar_url;
        if (r.last_post_date && (!existing.last_post_date || r.last_post_date > existing.last_post_date)) {
          existing.last_post_date = r.last_post_date;
        }
        existing.profile_urls[platform === 'instagram' ? 'ig' : 'tt'] = r.profile_url;
      }
    }
  }

  pushIntoMap(igRaw, 'instagram');
  pushIntoMap(ttRaw, 'tiktok');
  return [...map.values()];
}

// ============================================
// Main
// ============================================
async function safeReadJson(path) {
  try {
    const t = await readFile(path, 'utf-8');
    return JSON.parse(t);
  } catch (e) {
    console.warn(`  · Could not read ${path}: ${e.code || e.message}`);
    return [];
  }
}

async function main() {
  console.log('▶ Enrich starting...');
  const ig = await safeReadJson(join(DATA_DIR, 'raw-instagram.json'));
  const tt = await safeReadJson(join(DATA_DIR, 'raw-tiktok.json'));
  console.log(`  raw IG: ${ig.length}, raw TikTok: ${tt.length}`);

  const merged = mergeProfiles(ig, tt);
  console.log(`  after dedup: ${merged.length}`);

  const rejected = { 'no-bio': 0, blacklist: 0, 'followers-out-of-range': 0,
                     stale: 0, 'not-colombia': 0 };
  const kept = [];

  for (const r of merged) {
    const verdict = shouldKeep(r);
    if (!verdict.keep) {
      rejected[verdict.reason] = (rejected[verdict.reason] || 0) + 1;
      continue;
    }
    r.niches = nicheMatches(r.bio);
    r.score = scoreOverall(r);
    kept.push(r);
  }

  kept.sort((a, b) => b.score - a.score);

  await writeFile(join(DATA_DIR, 'enriched.json'), JSON.stringify(kept, null, 2));

  const withEmail = kept.filter((k) => k.email).length;
  const dmOnly = kept.length - withEmail;
  console.log('\n══════════════════════════════════════');
  console.log(`✓ Enriched ${kept.length} profiles → data/enriched.json`);
  console.log(`  With email:   ${withEmail}`);
  console.log(`  DM-only:      ${dmOnly}`);
  console.log(`  Multi-platform: ${kept.filter((k) => k.platforms.length > 1).length}`);
  console.log('\nRejected breakdown:');
  for (const [reason, n] of Object.entries(rejected)) {
    if (n > 0) console.log(`  ${reason.padEnd(24)} ${n}`);
  }
  if (kept.length > 0) {
    console.log(`\nTop 5 by score:`);
    for (const k of kept.slice(0, 5)) {
      console.log(`  ${String(k.score).padStart(3)} · @${k.username.padEnd(20)} · ${k.followers.toLocaleString()} followers · ER ${k.engagement_rate}%`);
    }
  }
  console.log('══════════════════════════════════════');
}

main().catch((e) => { console.error('enrich failed:', e); process.exit(1); });
