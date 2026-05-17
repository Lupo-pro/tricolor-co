// ============================================
// preferences.js — Persistent preference learning for the content
// machine. Each approve/reject in the swipe UI feeds counts into
// data/preferences.json; the generator and the insights dashboard
// read from the same file.
//
// Schema (data/preferences.json):
// {
//   "_meta": { "version": 1, "last_updated": ISO, "total_events": N },
//   "layouts": {
//     "post":     { "<layout-id>": { approved, rejected } },
//     "story":    { "<layout-id>": { approved, rejected } },
//     "carousel": { "<layout-id>": { approved, rejected } }
//   },
//   "hooks": {
//     "by_category": { "<cat>": { approved, rejected } },
//     "by_text":     { "<TEXT>": { approved, rejected } }
//   },
//   "themes": {
//     "carousel_themes": { "<theme>": { approved, rejected } },
//     "sequences":       { "<seq-name>": { approved, rejected } },
//     "post_keys":       { "<post-key>": { approved, rejected } }
//   },
//   "caption_keywords": {
//     "approved": { "<word>": count },
//     "rejected": { "<word>": count }
//   },
//   "engagement": {
//     // P3 — filled by the PostEverywhere webhook handler:
//     // "<asset-id>": { likes, saves, shares, comments, reach, fetched_at }
//   }
// }
//
// Counter semantics: approved + rejected = total feedback events seen
// for that key. "approval rate" = approved / (approved + rejected).
// Smoothed approval rate (Laplace) = (approved + 1) / (total + 2) —
// the generator uses this so a single rejection doesn't ban a brand
// new layout outright.
// ============================================

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const PREFS_PATH = join(ROOT, 'data', 'preferences.json');

// Naive Spanish/English stopword list. We're not building a search
// engine — just stripping connector words that show up in every
// caption so the keyword tally surfaces real signal.
const STOPWORDS = new Set([
  'a','al','algo','algun','alguna','algunas','alguno','algunos','ante','antes','aqui','asi',
  'aun','aunque','bien','cada','casi','como','con','contra','cual','cuales','cuando','de',
  'del','desde','donde','dos','el','ella','ellas','ellos','en','entre','era','eran','eres',
  'es','esa','esas','ese','eso','esos','esta','estas','este','esto','estos','estoy','fue',
  'fueron','gracias','hace','hacer','han','hasta','hay','hola','la','las','le','les','lo',
  'los','mas','mi','mis','mismo','muy','nada','ni','no','nos','nosotras','nosotros','o',
  'os','otra','otras','otro','otros','para','pero','poco','por','porque','que','queda',
  'quedan','quien','quienes','sabes','se','sea','sin','sobre','solo','son','soy','su',
  'sus','tan','tanto','te','tener','ti','toda','todas','todo','todos','tu','tus','un',
  'una','uno','unos','usted','ustedes','va','van','ver','vos','y','ya','yo',
  'and','are','but','for','from','have','here','just','like','more','not','now','our',
  'out','that','the','this','was','were','what','when','where','will','with','you','your',
]);

function emptyDoc() {
  return {
    _meta: { version: 1, last_updated: null, total_events: 0 },
    layouts:  { post: {}, story: {}, carousel: {} },
    hooks:    { by_category: {}, by_text: {} },
    themes:   { carousel_themes: {}, sequences: {}, post_keys: {} },
    caption_keywords: { approved: {}, rejected: {} },
    engagement: {},
  };
}

let _cache = null;

export async function loadPreferences() {
  if (_cache) return _cache;
  try {
    const txt = await readFile(PREFS_PATH, 'utf-8');
    _cache = JSON.parse(txt);
    // Cheap migration — fill in any missing buckets so older files
    // upgrade silently as the schema grows.
    const fresh = emptyDoc();
    for (const k of Object.keys(fresh)) {
      if (_cache[k] === undefined) _cache[k] = fresh[k];
    }
    for (const sub of ['post', 'story', 'carousel']) {
      _cache.layouts[sub] = _cache.layouts[sub] || {};
    }
    _cache.hooks.by_category = _cache.hooks.by_category || {};
    _cache.hooks.by_text     = _cache.hooks.by_text     || {};
    for (const sub of ['carousel_themes', 'sequences', 'post_keys']) {
      _cache.themes[sub] = _cache.themes[sub] || {};
    }
    _cache.caption_keywords.approved = _cache.caption_keywords.approved || {};
    _cache.caption_keywords.rejected = _cache.caption_keywords.rejected || {};
    _cache.engagement = _cache.engagement || {};
  } catch {
    _cache = emptyDoc();
  }
  return _cache;
}

async function savePreferences(doc) {
  doc._meta.last_updated = new Date().toISOString();
  await mkdir(dirname(PREFS_PATH), { recursive: true });
  await writeFile(PREFS_PATH, JSON.stringify(doc, null, 2));
  _cache = doc;
}

function bump(bucket, key, status) {
  if (!key) return;
  const cell = bucket[key] || { approved: 0, rejected: 0 };
  cell[status] = (cell[status] || 0) + 1;
  bucket[key] = cell;
}

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')                  // strip accents
    .replace(/[^a-z0-9\s]/g, ' ')                     // drop punctuation
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

/**
 * Record a single feedback event from the swipe UI.
 * @param {object} item    — manifest item (must have kind; optionally layout/hook/...)
 * @param {'approved'|'rejected'} status
 * @param {string} caption — caption text for keyword mining
 */
export async function recordEvent(item, status, caption = '') {
  if (status !== 'approved' && status !== 'rejected') return;
  const prefs = await loadPreferences();

  // Layouts
  if (item.kind && item.layout) {
    const sub = prefs.layouts[item.kind] || (prefs.layouts[item.kind] = {});
    bump(sub, item.layout, status);
  }

  // Hooks
  if (item.hook)         bump(prefs.hooks.by_text,     item.hook,         status);
  if (item.hookCategory) bump(prefs.hooks.by_category, item.hookCategory, status);

  // Themes / sequences / post keys
  if (item.kind === 'carousel' && item.theme) bump(prefs.themes.carousel_themes, item.theme, status);
  if (item.kind === 'story'    && item.sequence) bump(prefs.themes.sequences, item.sequence, status);
  if (item.kind === 'post'     && item.key)   bump(prefs.themes.post_keys, item.key, status);

  // Caption keywords
  const tokens = tokenize(caption);
  const kwBucket = prefs.caption_keywords[status];
  for (const t of tokens) kwBucket[t] = (kwBucket[t] || 0) + 1;

  prefs._meta.total_events = (prefs._meta.total_events || 0) + 1;
  await savePreferences(prefs);
}

/**
 * Approval rate with Laplace smoothing — (approved+1)/(total+2).
 * Returns 0.5 for an empty cell so a brand new layout/hook isn't
 * penalised before it's been used.
 */
export function approvalRate(cell) {
  if (!cell) return 0.5;
  const a = cell.approved || 0;
  const r = cell.rejected || 0;
  return (a + 1) / (a + r + 2);
}

export function rawRate(cell) {
  if (!cell) return null;
  const a = cell.approved || 0;
  const r = cell.rejected || 0;
  if (a + r === 0) return null;
  return a / (a + r);
}

/**
 * Returns an array of [key, cell, rate] tuples for a bucket, sorted by
 * smoothed approval rate descending. Min sample threshold filters out
 * keys with too little data — useful for "top N" displays.
 */
export function rankedBucket(bucket, { minSamples = 0 } = {}) {
  const out = [];
  for (const [key, cell] of Object.entries(bucket || {})) {
    const total = (cell.approved || 0) + (cell.rejected || 0);
    if (total < minSamples) continue;
    out.push([key, cell, approvalRate(cell)]);
  }
  out.sort((a, b) => b[2] - a[2]);
  return out;
}

/**
 * Aggregated insights — top picks per dimension + flagged rejected
 * patterns + a few auto-tuning suggestions.
 *
 * Tunables:
 *   minSamplesTop        N samples to qualify for the top-N lists
 *   rejectThresholdRate  approval rate below which a key is "flagged"
 *   rejectThresholdN     ...and only if it has at least this many rejections
 */
export async function getInsights({
  minSamplesTop = 2,
  rejectThresholdRate = 0.3,
  rejectThresholdN = 3,
} = {}) {
  const prefs = await loadPreferences();

  const layoutsTop = {};
  for (const kind of ['post', 'story', 'carousel']) {
    layoutsTop[kind] = rankedBucket(prefs.layouts[kind], { minSamples: minSamplesTop }).slice(0, 3);
  }

  const hooksTopByText     = rankedBucket(prefs.hooks.by_text,     { minSamples: minSamplesTop }).slice(0, 3);
  const hooksTopByCategory = rankedBucket(prefs.hooks.by_category, { minSamples: minSamplesTop }).slice(0, 3);

  const themesTop = {
    carousel: rankedBucket(prefs.themes.carousel_themes, { minSamples: minSamplesTop }).slice(0, 3),
    sequence: rankedBucket(prefs.themes.sequences,       { minSamples: minSamplesTop }).slice(0, 3),
    post_key: rankedBucket(prefs.themes.post_keys,       { minSamples: minSamplesTop }).slice(0, 3),
  };

  // Anything with raw rate < rejectThresholdRate AND >= rejectThresholdN rejections
  // is "flagged" — these should drop out of the generator pool.
  const flagged = [];
  for (const [bucketName, bucket] of [
    ['layout.post',           prefs.layouts.post],
    ['layout.story',          prefs.layouts.story],
    ['layout.carousel',       prefs.layouts.carousel],
    ['hook.by_text',          prefs.hooks.by_text],
    ['hook.by_category',      prefs.hooks.by_category],
    ['theme.carousel',        prefs.themes.carousel_themes],
    ['theme.sequence',        prefs.themes.sequences],
    ['theme.post_key',        prefs.themes.post_keys],
  ]) {
    for (const [key, cell] of Object.entries(bucket || {})) {
      const rejected = cell.rejected || 0;
      if (rejected < rejectThresholdN) continue;
      const rate = rawRate(cell);
      if (rate === null || rate >= rejectThresholdRate) continue;
      flagged.push({ bucket: bucketName, key, cell, rate });
    }
  }
  flagged.sort((a, b) => a.rate - b.rate);

  // Keyword leaderboards
  const topKeywords = (obj) =>
    Object.entries(obj || {}).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Auto-suggestions — translate the flagged patterns into actionable
  // strings the dashboard can show without re-deriving them client side.
  const suggestions = flagged.slice(0, 5).map(({ bucket, key, rate }) => {
    const pct = Math.round(rate * 100);
    if (bucket.startsWith('layout.')) {
      const kind = bucket.split('.')[1];
      return `Drop layout "${key}" for ${kind} posts — ${pct}% approval.`;
    }
    if (bucket === 'hook.by_text') {
      return `Stop suggesting the hook "${key}" — ${pct}% approval.`;
    }
    if (bucket === 'hook.by_category') {
      return `Bias away from category "${key}" hooks — ${pct}% approval.`;
    }
    if (bucket.startsWith('theme.')) {
      return `Reconsider the "${key}" theme — ${pct}% approval.`;
    }
    return `Pattern "${key}" in ${bucket} underperforming (${pct}%).`;
  });

  return {
    _meta: prefs._meta,
    layouts: layoutsTop,
    hooks: { by_text: hooksTopByText, by_category: hooksTopByCategory },
    themes: themesTop,
    flagged,
    suggestions,
    keywords: {
      approved: topKeywords(prefs.caption_keywords.approved),
      rejected: topKeywords(prefs.caption_keywords.rejected),
    },
    engagement_count: Object.keys(prefs.engagement || {}).length,
  };
}

/**
 * Set of keys (full string form) flagged for exclusion. The generator
 * consults this to skip an option entirely.
 */
export async function flaggedSet({ rejectThresholdRate = 0.3, rejectThresholdN = 3 } = {}) {
  const prefs = await loadPreferences();
  const out = {
    layouts:        { post: new Set(), story: new Set(), carousel: new Set() },
    hooks_text:     new Set(),
    hooks_category: new Set(),
  };
  const scan = (bucket, target) => {
    for (const [key, cell] of Object.entries(bucket || {})) {
      const rejected = cell.rejected || 0;
      if (rejected < rejectThresholdN) continue;
      const rate = rawRate(cell);
      if (rate !== null && rate < rejectThresholdRate) target.add(key);
    }
  };
  scan(prefs.layouts.post,        out.layouts.post);
  scan(prefs.layouts.story,       out.layouts.story);
  scan(prefs.layouts.carousel,    out.layouts.carousel);
  scan(prefs.hooks.by_text,       out.hooks_text);
  scan(prefs.hooks.by_category,   out.hooks_category);
  return out;
}

/**
 * Record an engagement metric blob (P3 hook for the PostEverywhere
 * webhook). Stored under the asset id; merges with anything already
 * recorded for that asset.
 */
export async function recordEngagement(assetId, metrics = {}) {
  if (!assetId) return;
  const prefs = await loadPreferences();
  const prior = prefs.engagement[assetId] || {};
  prefs.engagement[assetId] = { ...prior, ...metrics, fetched_at: new Date().toISOString() };
  await savePreferences(prefs);
}
