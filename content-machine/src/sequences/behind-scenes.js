// ============================================
// behind-scenes.js — 5-story BTS arc.
//
// Humanizes the brand — small-business / Eje Cafetero / hand-packed.
// Trust-building, not sales-y.
// ============================================

// Layout rotation enforced — never the same layout two stories in a
// row. Mixes hook-center → bts (photo placeholder) → numbers
// (counts/stats) → bts → hook-split (cta block).
export function generate({ ediciones = ['La Capitana', 'La Portera', 'Oro Negro', 'La Cafetera'] } = {}) {
  return [
    {
      step: 1,
      role: 'hook',
      layout: 'hook-center',
      offsetMin: 0,
      tag: 'PRÉPA DROP',
      headline: 'EMPIEZA EL DÍA',
      subline: 'Pereira · 7am · llegan las cajas',
      bg: 'cream',
      accent: 'yellow',
      sticker: null,
    },
    {
      step: 2,
      role: 'reveal',
      layout: 'bts',
      offsetMin: 60,
      eyebrow: 'BACKSTAGE',
      headline: 'STOCK ARMADO',
      subline: `${ediciones.length} ediciones · 200 unidades`,
      photoLabel: 'CAJAS APILADAS',
      bg: 'yellow',
      accent: 'red',
      sticker: null,
    },
    {
      step: 3,
      role: 'reveal',
      layout: 'numbers',
      offsetMin: 180,
      eyebrow: 'HECHO A MANO',
      value: '200',
      label: 'BODIES EMPACADOS',
      subline: 'Uno por uno · sin fábrica',
      bg: 'cream',
      accent: 'red',
      sticker: null,
    },
    {
      step: 4,
      role: 'reveal',
      layout: 'bts',
      offsetMin: 300,
      eyebrow: 'CAMINO A TI',
      headline: 'LISTAS PA\' SALIR',
      subline: 'Interrapidísimo · 24-72h',
      photoLabel: 'PAQUETES LISTOS',
      bg: 'blue',
      accent: 'yellow',
      sticker: null,
    },
    {
      step: 5,
      role: 'cta',
      layout: 'hook-split',
      offsetMin: 420,
      headline: 'TU PEDIDO LA PRÓXIMA',
      subline: 'Escríbenos · WhatsApp en bio',
      bg: 'cream',
      accent: 'red',
      cta: 'Pedir Ahora',
      sticker: { type: 'link', url: 'https://latricolor.co/#collection', label: 'Pedir Ahora' },
    },
  ];
}

export const NAME = 'behind-scenes';
export const DESCRIPTION = '5-story BTS arc — trust + small-business cred.';
