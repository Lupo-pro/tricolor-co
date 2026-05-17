// ============================================
// daily-drop.js — 5-story sequence for a daily product drop.
//
// Run pattern (over ~4h):
//   hook    → tease    → reveal   → urgency  → cta
//   0min      +60min     +120min    +180min    +240min
//
// generate({ edition, stockLeft, price }) → Story[]
// ============================================

const EDITION_DEFAULTS = {
  'la-capitana': { name: 'La Capitana', color: 'yellow', priceK: 99 },
  'la-portera':  { name: 'La Portera',  color: 'blue',   priceK: 99 },
  'oro-negro':   { name: 'Oro Negro',   color: 'ink',    priceK: 99 },
  'la-cafetera': { name: 'La Cafetera', color: 'red',    priceK: 99 },
};

export function generate({ edition = 'la-capitana', stockLeft = 47, price } = {}) {
  const e = EDITION_DEFAULTS[edition] || EDITION_DEFAULTS['la-capitana'];
  const priceK = price ?? e.priceK;

  return [
    {
      step: 1,
      role: 'hook',
      offsetMin: 0,
      headline: '¿SABES QUÉ PASA HOY?',
      subline: 'A las 7pm exacto · No te lo pierdas',
      bg: 'cream',
      accent: 'yellow',
      sticker: null,
    },
    {
      step: 2,
      role: 'tease',
      offsetMin: 60,
      headline: 'NUEVA EDICIÓN',
      subline: 'Adivina cuál...',
      bg: 'ink',
      accent: 'blue',
      sticker: { type: 'poll', question: '¿Cuál crees que es?', options: ['Amarilla', 'Azul', 'Negra', 'Roja'] },
    },
    {
      step: 3,
      role: 'reveal',
      offsetMin: 120,
      headline: e.name.toUpperCase(),
      subline: `Edición Mundial · $${priceK}K`,
      bg: e.color,
      accent: 'ink',
      sticker: { type: 'link', url: 'https://latricolor.co/#collection', label: 'Pedir Ahora' },
    },
    {
      step: 4,
      role: 'urgency',
      offsetMin: 180,
      headline: 'STOCK LIMITADO',
      subline: `Quedan ${stockLeft} unidades`,
      bg: 'red',
      accent: 'cream',
      sticker: { type: 'countdown', endsInHours: 1, label: 'Cierra en' },
    },
    {
      step: 5,
      role: 'cta',
      offsetMin: 240,
      headline: 'ÚLTIMA HORA',
      subline: 'Pedir ahora · Link en bio',
      bg: 'cream',
      accent: 'red',
      sticker: { type: 'link', url: 'https://latricolor.co/#collection', label: 'Pedir →' },
    },
  ];
}

export const NAME = 'daily-drop';
export const DESCRIPTION = '5-story countdown to a product drop · ~4h end-to-end.';
