// ============================================
// favorites.js — Persistent star/⭐ list for stockpile items.
//
// Storage: data/favorites.json
//   { _meta: { updated_at }, ids: ["<date>/<id>", ...] }
//
// Public surface:
//   loadFavorites()                 — current Set of globalIds
//   toggleFavorite(globalId)        — flip; returns the new state (bool)
//   isFavorite(globalId)            — quick check
// ============================================

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const FAVS_PATH = join(ROOT, 'data', 'favorites.json');

let _cache = null;

async function load() {
  if (_cache) return _cache;
  try {
    const txt = await readFile(FAVS_PATH, 'utf-8');
    const doc = JSON.parse(txt);
    _cache = {
      ids: new Set(Array.isArray(doc.ids) ? doc.ids : []),
      _meta: doc._meta || { updated_at: null },
    };
  } catch {
    _cache = { ids: new Set(), _meta: { updated_at: null } };
  }
  return _cache;
}

async function persist() {
  if (!_cache) return;
  _cache._meta.updated_at = new Date().toISOString();
  await mkdir(dirname(FAVS_PATH), { recursive: true });
  await writeFile(FAVS_PATH, JSON.stringify({
    _meta: _cache._meta,
    ids:   [..._cache.ids].sort(),
  }, null, 2));
}

export async function loadFavorites() {
  const doc = await load();
  return [...doc.ids];
}

export async function isFavorite(globalId) {
  const doc = await load();
  return doc.ids.has(globalId);
}

/** Toggle the favorite state — returns the new boolean. */
export async function toggleFavorite(globalId) {
  if (!globalId) throw new Error('globalId required');
  const doc = await load();
  if (doc.ids.has(globalId)) doc.ids.delete(globalId);
  else doc.ids.add(globalId);
  await persist();
  return doc.ids.has(globalId);
}
