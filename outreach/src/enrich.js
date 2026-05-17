// ============================================
// enrich.js — Reads raw-instagram.json + raw-tiktok.json, dedups,
// filters, scores, extracts emails, writes data/enriched.json sorted
// by score DESC.
//
// Filter contract (everything below is OR-rejected):
//   - 3_000 ≤ followers ≤ 50_000  (true micro sweet spot — above 50K
//                                 the account usually has an agency
//                                 or PR contact and isn't reachable
//                                 with our DM-first cold outreach)
//   - bio not empty
//   - bio has none of the BLACKLIST keywords (onlyfans, agency, etc.)
//   - bio or location has NO Brazilian signal (São Paulo / Fluminense
//     / Bahia / SP / RJ / etc. — #tricolor pulls a lot of BR fan
//     accounts that have nothing to do with the Selección Colombia)
//   - recent activity: last_post_date within 30d (IG) / 14d (TikTok)
//
// Engagement is NO LONGER a hard filter: the TikTok actor doesn't
// expose ER, so every TikTok-only profile reported ER=0 and was
// rejected wholesale. ER still factors into scoring; the final
// triage happens in the swipe admin UI.
//
// Colombia attribution is now SOFT, not a hard filter:
//   - explicit signal in bio/location ("Colombia", "paisa", a city)
//     → +5 score bonus
//   - no signal but not Brazilian → -20 score penalty (kept in the
//     dataset, sorted to the bottom for manual swipe review)
//
// Scoring (raw out of 120, capped at [0, 100]):
//   40  engagement rate         (4%+ = full; 0% = 20 fallback)
//   25  follower sweet spot     (5K-30K = full; degraded outside)
//   15  niche bio keywords      (5 pts/match, capped)
//   10  email present in bio
//   10  multi-platform (IG + TikTok)
//   10  activity bonus          (≥200 posts = 10, ≥50 = 5)
//   10  target persona signal   (model / fit / dance / lifestyle /
//                                hincha / student keywords in bio)
//   +5  Colombia-explicit modifier
//  -20  Colombia-soft modifier
// ============================================

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// Bio blacklist — reject anyone whose bio screams "wrong persona":
// B2B sellers, journalists / media, political accounts, agencies.
// Target = individual women in lifestyle / fitness / dance / fashion,
// not businesses or institutional voices.
const BLACKLIST = [
  // Adult / OF / agency
  'onlyfans', 'only fans', 'agency', 'agencia', 'marketing manager',
  'press@', 'collab@', 'manager', 'representante', 'premium content',

  // B2B / wholesale / resellers
  'mayorista', 'mayoreo', 'mayoristas', 'distribuidor', 'distribuidora',
  'distribuidores', 'ventas al por mayor', 'wholesale',
  'envíos al por mayor', 'envios al por mayor', 'compras al por mayor',

  // Media / journalism
  'periodista', 'reportera', 'reportero', 'redactora', 'redactor',
  'comunicadora social', 'comunicador social', 'noticias', 'noticiero',
  'medios', 'media outlet',

  // Politics / civic
  'política', 'político', 'politica', 'politico', 'concejal', 'concejala',
  'candidata', 'candidato', 'partido político', 'partido politico',
  'gobierno', 'ministerio', 'alcaldía', 'alcaldia', 'gobernación',
  'gobernacion',
];

// Brazilian content — hashtags like #tricolor pick up São Paulo FC,
// Fluminense, Bahia FC, Grêmio fan accounts that have nothing to do
// with the Selección Colombia. Hard-reject anyone whose bio or
// location matches any of these tokens.
const BRAZILIAN_KEYWORDS = [
  'são paulo', 'sao paulo', ' sp ', ' sp,', ' sp/', ' sp.', '/sp', '#sp',
  'brasil', 'brasileiro', 'brasileira',
  'fluminense', 'palmeiras', 'corinthians', 'bahia', 'grêmio', 'gremio',
  'flamengo', 'santos fc',
  'rio de janeiro', ' rj ', ' rj,', ' rj/', '/rj', '#rj',
  'belo horizonte', ' bh ', ' bh,', '/bh',
  'porto alegre', 'curitiba', 'fortaleza',
];

const NICHE_KEYWORDS = [
  'fútbol', 'futbol', 'tricolor', 'colombia', 'moda', 'estilo',
  'fitness', 'paisa', 'cafetera', 'bogotá', 'bogota', 'medellín',
  'medellin', 'cali', 'pereira', 'mundial', 'selección', 'seleccion',
];

// Target persona signals — bios that mention any of these get a +10
// score boost. Designed to surface the actual target audience
// (Colombian women 20-35, lifestyle / fitness / dance / fashion /
// student) above the broader Colombia-explicit pool.
const TARGET_SIGNALS = [
  // Creator identity
  'modelo', 'influencer', 'creator', 'creadora', 'content creator',
  // Fitness / wellness
  'fit', 'fitness', 'gym', 'training', 'entrenadora', 'crossfit',
  'yoga', 'pilates',
  // Dance / nightlife
  'baile', 'bailarina', 'dancer', 'salsa', 'rumba', 'reggaeton',
  // Lifestyle / fashion
  'lifestyle', 'ootd', 'estilo', 'fashion', 'streetwear',
  // Football connection (very on-brand for Tricolor)
  'amante del fútbol', 'amante del futbol', 'futbolera', 'hincha',
  'futbol femenino', 'fútbol femenino',
  // Student / young
  'estudiante', 'universidad', 'universitaria', 'uni ',
];

// Cities, departments, and unambiguous Colombian-Spanish words. Used
// to confirm Colombia attribution — separated from NICHE_KEYWORDS
// because they answer "is this person Colombian" rather than "is this
// person on-brand". A bio just saying "fitness" hits niche but isn't
// a Colombia signal.
const COLOMBIA_KEYWORDS = [
  'colombia', 'colombian', 'colombiana', 'colombiano',
  'paisa', 'paisas', 'cafetera', 'cafetero',
  'bogotá', 'bogota', 'medellín', 'medellin', 'cali', 'pereira',
  'armenia', 'bucaramanga', 'manizales', 'cartagena', 'barranquilla',
  'cúcuta', 'cucuta', 'santa marta', 'villavicencio', 'ibagué', 'ibague',
  'eje cafetero', 'antioquia', 'valle del cauca', 'cundinamarca',
  'quindío', 'quindio', 'caldas', 'risaralda', 'boyacá', 'boyaca',
  'santander', 'tolima',
  '🇨🇴',
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
  // Sweet spot 5K-25K = 25 pts (tightened from 5K-30K).
  // Below: linear ramp from 3K (8pts) → 5K (25pts).
  // Above: linear decay from 25K (25pts) → 50K (10pts).
  if (n >= 5_000 && n <= 25_000) return 25;
  if (n >= 3_000 && n < 5_000) {
    return Math.round(8 + (n - 3_000) * (17 / 2_000));
  }
  if (n > 25_000 && n <= 50_000) {
    return Math.round(25 - (n - 25_000) * (15 / 25_000));
  }
  return 0; // out of range — the filter in shouldKeep() will reject
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

function hasTargetSignal(bio) {
  if (!bio) return false;
  const lower = String(bio).toLowerCase();
  return TARGET_SIGNALS.some((kw) => lower.includes(kw));
}

function targetMatches(bio) {
  if (!bio) return [];
  const lower = String(bio).toLowerCase();
  return TARGET_SIGNALS.filter((kw) => lower.includes(kw));
}

function scoreOverall(record) {
  const sER       = scoreEngagement(record.engagement_rate);
  const sFollow   = scoreFollowers(record.followers);
  const sNiche    = scoreNiche(record.bio);
  const sEmail    = record.email ? 10 : 0;
  const sMulti    = record.platforms.length > 1 ? 10 : 0;
  const sActivity = scoreActivity(record.posts_count);
  const sTarget   = record.target_match ? 10 : 0;

  // Colombia confidence modifiers — set during filtering.
  //   colombia_explicit: +5  (bio/location names a Colombian city,
  //                          dept, or "Colombia"/"paisa"/"cafetera")
  //   colombia_soft:     -20 (no explicit signal AND not Brazilian —
  //                          kept but pushed to the bottom of the swipe
  //                          queue so the user can re-confirm manually)
  let mods = 0;
  if (record.colombia_explicit) mods += 5;
  if (record.colombia_soft)     mods -= 20;

  return Math.max(0, Math.min(100, sER + sFollow + sNiche + sEmail + sMulti + sActivity + sTarget + mods));
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

// Scans the bio AND location together — Brazilian football accounts
// frequently put "SP" or "RJ" only in the location field.
function hasBrazilianSignal(record) {
  const haystack = ((record.bio || '') + ' ' + (record.location || '')).toLowerCase();
  // Pad with leading + trailing space so " sp " / " rj " word-boundary
  // matchers actually fire at the start/end of the string too.
  const padded = ' ' + haystack + ' ';
  return BRAZILIAN_KEYWORDS.some((kw) => padded.includes(kw));
}

function hasColombianExplicit(record) {
  const haystack = ((record.bio || '') + ' ' + (record.location || '')).toLowerCase();
  return COLOMBIA_KEYWORDS.some((kw) => haystack.includes(kw));
}

function shouldKeep(record) {
  if (!record.bio || record.bio.trim().length === 0) return { keep: false, reason: 'no-bio' };
  if (bioHasBlacklist(record.bio)) return { keep: false, reason: 'blacklist' };
  if (record.followers < 3_000 || record.followers > 50_000) {
    return { keep: false, reason: 'followers-out-of-range' };
  }
  // Hard-reject Brazilian content — #tricolor is heavily used by SP,
  // Fluminense, Bahia, Grêmio fans.
  if (hasBrazilianSignal(record)) {
    return { keep: false, reason: 'brazilian-content' };
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
  // Colombia attribution: explicit hit → +5 score bonus; no hit
  // (but not Brazilian, since that was already rejected) → soft
  // -20 score penalty applied in scoreOverall(). We keep the record
  // either way so the swipe admin can do the final read.
  if (hasColombianExplicit(record)) {
    record.colombia_explicit = true;
    record.colombia_soft = false;
  } else {
    record.colombia_explicit = false;
    record.colombia_soft = true;
  }
  // Target persona signal — +10 score bonus in scoreOverall().
  record.target_match = hasTargetSignal(record.bio);
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
                     'brazilian-content': 0, stale: 0 };
  const kept = [];

  for (const r of merged) {
    const verdict = shouldKeep(r);
    if (!verdict.keep) {
      rejected[verdict.reason] = (rejected[verdict.reason] || 0) + 1;
      continue;
    }
    r.niches = nicheMatches(r.bio);
    r.target_signals = targetMatches(r.bio);
    r.score = scoreOverall(r);
    kept.push(r);
  }

  kept.sort((a, b) => b.score - a.score);

  await writeFile(join(DATA_DIR, 'enriched.json'), JSON.stringify(kept, null, 2));

  const withEmail = kept.filter((k) => k.email).length;
  const dmOnly = kept.length - withEmail;
  const explicitCO = kept.filter((k) => k.colombia_explicit).length;
  const softCO = kept.filter((k) => k.colombia_soft).length;
  const targetHits = kept.filter((k) => k.target_match).length;
  console.log('\n══════════════════════════════════════');
  console.log(`✓ Enriched ${kept.length} profiles → data/enriched.json`);
  console.log(`  With email:        ${withEmail}`);
  console.log(`  DM-only:           ${dmOnly}`);
  console.log(`  Multi-platform:    ${kept.filter((k) => k.platforms.length > 1).length}`);
  console.log(`  Colombia explicit: ${explicitCO}  (+5 score bonus)`);
  console.log(`  Colombia soft:     ${softCO}  (-20 score penalty, sorted to bottom)`);
  console.log(`  Target signals:    ${targetHits}  (+10 score bonus — model/fit/dance/student/etc.)`);
  console.log('\nRejected breakdown:');
  for (const [reason, n] of Object.entries(rejected)) {
    if (n > 0) console.log(`  ${reason.padEnd(24)} ${n}`);
  }
  if (kept.length > 0) {
    console.log(`\nTop 5 by score:`);
    for (const k of kept.slice(0, 5)) {
      const tag = k.colombia_explicit ? '🇨🇴' : (k.colombia_soft ? '? ' : '  ');
      console.log(`  ${tag} ${String(k.score).padStart(3)} · @${k.username.padEnd(22)} · ${String(k.followers.toLocaleString()).padStart(8)} followers · ER ${k.engagement_rate}%`);
    }
  }
  console.log('══════════════════════════════════════');
}

main().catch((e) => { console.error('enrich failed:', e); process.exit(1); });
