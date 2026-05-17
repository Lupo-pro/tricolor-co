// ============================================
// silhouettes/index.js — registry of per-edition body SVG assets.
// Returns absolute filesystem paths so callers can readFile or pass
// the path to <img src="..."> equivalents.
// ============================================

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const SILHOUETTE_PATHS = {
  'la-capitana': join(__dirname, 'body-amarilla.svg'),
  'la-portera':  join(__dirname, 'body-azul.svg'),
  'oro-negro':   join(__dirname, 'body-negra.svg'),
  'la-cafetera': join(__dirname, 'body-roja.svg'),
};

export function silhouettePath(edition) {
  return SILHOUETTE_PATHS[edition] || null;
}
