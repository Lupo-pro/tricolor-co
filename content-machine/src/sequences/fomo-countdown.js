// ============================================
// fomo-countdown.js — 4-story urgency arc over 4h.
//
// Counts the stock down on a single edition in real time.
//   H-4  "Quedan 23 unidades"
//   H-2  "Quedan 12 unidades · Última oportunidad"
//   H-1  "Quedan 5 unidades · ⚠️"
//   H-0  "AGOTADO · Próximo drop mañana"
// ============================================

export function generate({ edition = 'la-capitana', stockStart = 23, stockMid1 = 12, stockMid2 = 5 } = {}) {
  const name = {
    'la-capitana': 'La Capitana',
    'la-portera':  'La Portera',
    'oro-negro':   'Oro Negro',
    'la-cafetera': 'La Cafetera',
  }[edition] || 'La Capitana';

  // Layout rotation — numbers → hook-center → numbers (with the very
  // last stat) → hook-split (cta). The big-number layout lets the
  // stock count itself become the headline, which carries more
  // urgency than the original blocky urgency role.
  return [
    {
      step: 1,
      role: 'urgency',
      layout: 'numbers',
      offsetMin: 0,
      eyebrow: 'STOCK BAJANDO',
      value: stockStart,
      label: `UNIDADES · ${name}`,
      subline: 'Cierra al final del día',
      bg: 'cream',
      accent: 'red',
      sticker: { type: 'countdown', endsInHours: 4, label: 'Cierra en' },
    },
    {
      step: 2,
      role: 'urgency',
      layout: 'hook-center',
      offsetMin: 120,
      tag: 'ÚLTIMA OPORTUNIDAD',
      headline: `QUEDAN ${stockMid1}`,
      subline: `${name} · 2 horas para cerrar`,
      bg: 'red',
      accent: 'yellow',
      sticker: { type: 'countdown', endsInHours: 2, label: 'Cierra en' },
    },
    {
      step: 3,
      role: 'urgency',
      layout: 'numbers',
      offsetMin: 180,
      eyebrow: 'A PUNTO DE AGOTARSE',
      value: stockMid2,
      label: 'UNIDADES',
      subline: `${name} · cierra en 1h`,
      bg: 'red',
      accent: 'yellow',
      sticker: { type: 'countdown', endsInHours: 1, label: 'Cierra en' },
    },
    {
      step: 4,
      role: 'cta',
      layout: 'hook-split',
      offsetMin: 240,
      headline: 'AGOTADO',
      subline: 'Próximo drop mañana · Activá alertas',
      bg: 'ink',
      accent: 'red',
      cta: 'Activar Alertas',
      sticker: { type: 'link', url: 'https://latricolor.co/mundial', label: 'Activar alertas' },
    },
  ];
}

export const NAME = 'fomo-countdown';
export const DESCRIPTION = '4-story urgency arc over 4h — stock relámpago.';
