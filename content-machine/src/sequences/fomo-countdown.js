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

  return [
    {
      step: 1,
      role: 'urgency',
      offsetMin: 0,
      headline: 'STOCK BAJANDO',
      subline: `${name} · Quedan ${stockStart} unidades`,
      bg: 'cream',
      accent: 'red',
      sticker: { type: 'countdown', endsInHours: 4, label: 'Cierra en' },
    },
    {
      step: 2,
      role: 'urgency',
      offsetMin: 120,
      headline: 'ÚLTIMA OPORTUNIDAD',
      subline: `${name} · Quedan ${stockMid1} unidades`,
      bg: 'red',
      accent: 'cream',
      sticker: { type: 'countdown', endsInHours: 2, label: 'Cierra en' },
    },
    {
      step: 3,
      role: 'urgency',
      offsetMin: 180,
      headline: 'A PUNTO DE AGOTARSE',
      subline: `Quedan ${stockMid2} unidades ⚠️`,
      bg: 'red',
      accent: 'yellow',
      sticker: { type: 'countdown', endsInHours: 1, label: 'Cierra en' },
    },
    {
      step: 4,
      role: 'cta',
      offsetMin: 240,
      headline: 'AGOTADO',
      subline: 'Próximo drop mañana · Activá alertas',
      bg: 'ink',
      accent: 'red',
      sticker: { type: 'link', url: 'https://latricolor.co/mundial', label: 'Activar alertas' },
    },
  ];
}

export const NAME = 'fomo-countdown';
export const DESCRIPTION = '4-story urgency arc over 4h — stock relámpago.';
