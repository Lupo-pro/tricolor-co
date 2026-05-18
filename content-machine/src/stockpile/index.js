// ============================================
// stockpile/index.js — Flat-indexed view of every generated draft.
//
// The day-based output structure (data/drafts/{date}/manifest.json)
// stays as the on-disk source of truth. This module aggregates every
// per-day manifest into a single flat list so the new /stockpile UI
// can browse by kind / angle / edition / color across the whole sprint
// instead of one day at a time.
//
// Public surface:
//   listStockpile({ filters })    — flat array of indexed items
//   itemFacets(items)             — facet counts for filter chips
//   getItem(globalId)             — single-item lookup
//   pngPath(item, slideIdx)       — absolute path on disk
//   captionFor(item)              — caption text (lazy-loaded)
// ============================================

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const DRAFTS_DIR = join(ROOT, 'data', 'drafts');

// post.key → edition mapping. Stories + carousels inherit from the
// day's edition_focus.
const POST_KEY_EDITION = {
  'drop-capitana':  'la-capitana',
  'drop-portera':   'la-portera',
  'drop-oronegro':  'oro-negro',
  'drop-cafetera':  'la-cafetera',
};

// All known colour tokens — used to dedupe the color facet so we
// don't emit "red, red, RED" for slightly different bg/accent specs.
const KNOWN_COLORS = new Set(['cream', 'yellow', 'blue', 'red', 'ink', 'green']);

async function readJsonSafe(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf-8')); }
  catch { return fallback; }
}

async function* iterDayManifests() {
  let entries = [];
  try { entries = await readdir(DRAFTS_DIR); }
  catch { return; }
  for (const name of entries.sort()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(name)) continue;
    const m = await readJsonSafe(join(DRAFTS_DIR, name, 'manifest.json'), null);
    if (!m) continue;
    const c = await readJsonSafe(join(DRAFTS_DIR, name, 'captions.json'), {});
    yield { date: name, manifest: m, captions: c };
  }
}

function deriveEdition(item, dayEditionFocus) {
  if (item.kind === 'post' && POST_KEY_EDITION[item.key]) return POST_KEY_EDITION[item.key];
  // Use the day's focus as fallback for stories/carousels.
  return dayEditionFocus || null;
}

function deriveColors(item) {
  // For posts and stories we have `bg` and `accent` directly. For
  // carousels (top-level manifest doesn't carry the slide colours)
  // we return an empty list — the color filter just won't match them.
  const out = new Set();
  if (item.bg && KNOWN_COLORS.has(item.bg)) out.add(item.bg);
  if (item.accent && KNOWN_COLORS.has(item.accent)) out.add(item.accent);
  return [...out];
}

function indexItem(rawItem, day) {
  const globalId = `${day.date}/${rawItem.id}`;
  const edition = deriveEdition(rawItem, day.manifest.edition_focus);
  const colors = deriveColors(rawItem);
  const caption = day.captions[rawItem.caption_key] || '';
  return {
    globalId,
    date: day.date,
    id: rawItem.id,
    kind: rawItem.kind,
    layout: rawItem.layout || null,
    angle: rawItem.angle || null,
    edition,
    colors,
    headline: rawItem.headline || rawItem.scene || rawItem.question || null,
    subline: rawItem.subline || null,
    sequence: rawItem.sequence || null,
    step: rawItem.step ?? null,
    role: rawItem.role || null,
    theme: rawItem.theme || null,
    bg: rawItem.bg || null,
    accent: rawItem.accent || null,
    file: rawItem.file || null,
    files: rawItem.files || null,
    slideCount: rawItem.slideCount ?? null,
    captionKey: rawItem.caption_key || null,
    caption,
    rejectedAt: rawItem.rejected_at || null,
    // The raw item ships in case a caller needs an obscure field —
    // never expose it as the canonical shape, indexers must add
    // explicit fields above instead.
    _raw: rawItem,
  };
}

/**
 * Walks every per-day manifest and emits a flat list. Optional
 * filters narrow the result without re-reading the disk.
 *
 * filters: { kind?, angle?, edition?, color?, includeRejected? }
 */
export async function listStockpile({ filters = {} } = {}) {
  const out = [];
  for await (const day of iterDayManifests()) {
    for (const rawItem of day.manifest.items || []) {
      const it = indexItem(rawItem, day);
      if (it.rejectedAt && !filters.includeRejected) continue;
      if (filters.kind    && it.kind    !== filters.kind)    continue;
      if (filters.angle   && it.angle   !== filters.angle)   continue;
      if (filters.edition && it.edition !== filters.edition) continue;
      if (filters.color   && !it.colors.includes(filters.color)) continue;
      out.push(it);
    }
  }
  return out;
}

/**
 * For the filter chip row — counts per facet value, useful so the UI
 * can show "Stories (45)" / "Rebellion (12)" etc.
 */
export function itemFacets(items) {
  const facets = {
    kind:    new Map(),
    angle:   new Map(),
    edition: new Map(),
    color:   new Map(),
    layout:  new Map(),
  };
  for (const it of items) {
    bumpFacet(facets.kind,    it.kind);
    bumpFacet(facets.angle,   it.angle);
    bumpFacet(facets.edition, it.edition);
    bumpFacet(facets.layout,  it.layout);
    for (const c of it.colors) bumpFacet(facets.color, c);
  }
  return {
    kind:    mapToSortedArray(facets.kind),
    angle:   mapToSortedArray(facets.angle),
    edition: mapToSortedArray(facets.edition),
    color:   mapToSortedArray(facets.color),
    layout:  mapToSortedArray(facets.layout),
  };
}

function bumpFacet(map, key) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + 1);
}
function mapToSortedArray(map) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));
}

/** Single-item lookup by globalId (`<date>/<id>`). Returns null when unknown. */
export async function getItem(globalId) {
  const [date, ...rest] = globalId.split('/');
  if (!date || rest.length === 0) return null;
  const id = rest.join('/'); // ids never contain a slash today, but cheap to be safe
  const manifestPath = join(DRAFTS_DIR, date, 'manifest.json');
  const manifest = await readJsonSafe(manifestPath, null);
  if (!manifest) return null;
  const raw = (manifest.items || []).find((i) => i.id === id);
  if (!raw) return null;
  const captions = await readJsonSafe(join(DRAFTS_DIR, date, 'captions.json'), {});
  return indexItem(raw, { date, manifest, captions });
}

/**
 * Absolute on-disk path to the PNG for the item (or specific
 * carousel slide via slideIdx).
 */
export function pngPath(item, slideIdx = 0) {
  if (item.kind === 'carousel' && Array.isArray(item.files)) {
    return join(DRAFTS_DIR, item.date, item.files[Math.min(slideIdx, item.files.length - 1)]);
  }
  return join(DRAFTS_DIR, item.date, item.file);
}

export const STOCKPILE_PATH = DRAFTS_DIR;
