// ============================================
// hooks.js — Library of punchy opening lines, grouped by category.
//
// Captions and templater eyebrows draw from these so we never reuse
// the same hook two days in a row. Each category serves a distinct
// content type:
//
//   interrogatifs → daily-drop teases, hooks, ask-me stories
//   provocateurs  → manifesto posts, mini-documental, contrarian POVs
//   fomo          → urgency stories, countdowns, stock-limited posts
//   valeur        → educational carousels, 3-razones sequences, BTS
//   comparatif    → comparison posts, antes-vs-ahora stories
//
// Each hook string is short enough to fit an Anton 180pt headline
// (~28 chars), or to anchor a caption opener. Variants exist so the
// content machine can rotate without sounding repetitive.
//
// Usage:
//   import { HOOKS, pickHook } from './hooks.js';
//   const hook = pickHook('interrogatifs', { seed: '2026-05-17' });
// ============================================

export const HOOKS_INTERROGATIFS = [
  '¿SABES QUÉ PASA HOY?',
  '¿CUÁL ERES TÚ?',
  '¿POR QUÉ NADIE TE DIJO ESTO?',
  '¿LISTA PARA EL MUNDIAL?',
  '¿SABÍAS QUE EL 17 DE JUNIO...?',
  '¿CUÁL ES TU EDICIÓN?',
  '¿YA VISTE ESTO?',
  '¿TE ANIMÁS?',
  '¿QUIÉN VA A ESTAR ESE DÍA?',
  '¿VAS A FALTAR AL PARTIDO?',
];

export const HOOKS_PROVOCATEURS = [
  'ESTO NO ES ROPA · ES BANDERA',
  'LA CAMISETA QUE NO QUERÍAS · HASTA AHORA',
  'NOS DIJERON QUE NO ÍBAMOS A PODER',
  'POV: TE DIJERON QUE IBAS A FALLAR',
  'EL ERROR QUE COMETÍ AL LANZAR ESTA MARCA',
  'NACIDAS AMARILLAS · AZULES Y ROJAS',
  'SI TE GANA EL MIEDO · NO ENTRA',
  'LA MODA NO SABE NADA DEL MUNDIAL',
  'TU OUTFIT NO ES NEUTRO',
  'NO ES UNIFORME · ES UNIFORME',
];

export const HOOKS_FOMO = [
  'SOLO 50 CAFETERAS LO TENDRÁN',
  'QUEDAN 12 UNIDADES',
  'ÚLTIMA OPORTUNIDAD',
  'ANTES QUE SE AGOTE',
  'STOCK LIMITADO',
  'A PUNTO DE AGOTARSE',
  'HOY · O NUNCA',
  'NO QUIERO QUE TE PILLE TARDE',
  'CIERRA EN HORAS',
  'ESTAMOS POR CERRAR EDICIÓN',
];

export const HOOKS_VALEUR = [
  'LO QUE NO TE DICEN DEL MUNDIAL 2026',
  '3 RAZONES POR LAS QUE...',
  'LAS 3 SEDES QUE DEBES CONOCER',
  'CÓMO PREPARARSE PARA EL PARTIDO',
  'EL MUNDIAL EN 5 DATOS',
  'GUÍA RÁPIDA · NUEVA ERA',
  'TODO LO QUE TENÉS QUE SABER',
  'LO QUE APRENDIMOS HACIENDO ESTO',
  'DETRÁS DE CADA EDICIÓN',
  'COSAS QUE NADIE TE CUENTA',
];

export const HOOKS_COMPARATIF = [
  'ANTES VS AHORA',
  'CAMISETA VS BODY',
  'ANTES DEL 2026 · DESPUÉS DEL 2026',
  'OTROS BODIES · VS LOS NUESTROS',
  'CÓMO ERA · CÓMO SERÁ',
  'TALLA ÚNICA · VS 3 TALLAS',
  'GENÉRICO · VS HECHO PARA TI',
  'IMPORTADO · VS COLOMBIA',
];

export const HOOKS = {
  interrogatifs: HOOKS_INTERROGATIFS,
  provocateurs:  HOOKS_PROVOCATEURS,
  fomo:          HOOKS_FOMO,
  valeur:        HOOKS_VALEUR,
  comparatif:    HOOKS_COMPARATIF,
};

// ───────────────────────────────────────────
// Deterministic picker — same (category, seed) always returns the
// same hook so a given calendar day doesn't oscillate between runs.
// seed is typically the dateKey ('2026-05-17') or a sequence id.
// ───────────────────────────────────────────
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Pick a hook from the given category. Deterministic w.r.t. seed.
 * @param {keyof HOOKS} category
 * @param {{ seed?: string }} opts
 * @returns {string}
 */
export function pickHook(category, { seed = '' } = {}) {
  const bucket = HOOKS[category];
  if (!bucket || bucket.length === 0) return '';
  if (!seed) return bucket[Math.floor(Math.random() * bucket.length)];
  return bucket[hash(seed + ':' + category) % bucket.length];
}

/**
 * Pick N distinct hooks from a category (no repeats). Deterministic.
 */
export function pickHooks(category, n, { seed = '' } = {}) {
  const bucket = HOOKS[category];
  if (!bucket || bucket.length === 0) return [];
  const idxs = new Set();
  let i = 0;
  while (idxs.size < Math.min(n, bucket.length) && i < bucket.length * 4) {
    const idx = hash(seed + ':' + category + ':' + i) % bucket.length;
    idxs.add(idx);
    i++;
  }
  return Array.from(idxs).map((idx) => bucket[idx]);
}

/**
 * Preference-aware variant of pickHook. Drops any hook flagged in
 * `flagged` (a Set of hook texts to exclude) before applying the
 * deterministic seed pick. Falls back to the unfiltered bucket if
 * every option got flagged.
 */
export function pickHookWeighted(category, { seed = '', flagged } = {}) {
  const bucket = HOOKS[category];
  if (!bucket || bucket.length === 0) return '';
  const filtered = flagged && flagged.size > 0
    ? bucket.filter((h) => !flagged.has(h))
    : bucket;
  const pool = filtered.length > 0 ? filtered : bucket;
  if (!seed) return pool[Math.floor(Math.random() * pool.length)];
  return pool[hash(seed + ':' + category) % pool.length];
}

/**
 * Suggest a hook category for a given content type. The matching is
 * intentionally loose so callers can override.
 */
export function categoryForContentType(type) {
  const map = {
    'daily-drop':       'interrogatifs',
    'tease':            'interrogatifs',
    'manifesto':        'provocateurs',
    'manifesto-quote':  'provocateurs',
    'fomo-countdown':   'fomo',
    'urgency':          'fomo',
    'educational':      'valeur',
    'carousel':         'valeur',
    'comparison':       'comparatif',
    'antes-vs-ahora':   'comparatif',
    'bts':              'valeur',
    'behind-scenes':    'valeur',
    'review':           'provocateurs',
    'testimonial':      'provocateurs',
    'match-day':        'interrogatifs',
    'countdown':        'fomo',
  };
  return map[type] || 'interrogatifs';
}
