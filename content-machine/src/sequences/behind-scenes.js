// ============================================
// behind-scenes.js — 5-story BTS arc.
//
// Humanizes the brand — small-business / Eje Cafetero / hand-packed.
// Trust-building, not sales-y.
// ============================================

export function generate({ ediciones = ['La Capitana', 'La Portera', 'Oro Negro', 'La Cafetera'] } = {}) {
  return [
    {
      step: 1,
      role: 'hook',
      offsetMin: 0,
      headline: 'PRÉPA DROP',
      subline: 'Recién llegan las cajas · Pereira, 7am',
      bg: 'cream',
      accent: 'yellow',
      sticker: null,
    },
    {
      step: 2,
      role: 'reveal',
      offsetMin: 60,
      headline: 'STOCK ARMADO',
      subline: `${ediciones.length} ediciones · 200 unidades en total`,
      bg: 'yellow',
      accent: 'ink',
      sticker: null,
    },
    {
      step: 3,
      role: 'reveal',
      offsetMin: 180,
      headline: 'PACKAGING FIRMA',
      subline: 'Cada pedido · empacado a mano',
      bg: 'cream',
      accent: 'red',
      sticker: null,
    },
    {
      step: 4,
      role: 'reveal',
      offsetMin: 300,
      headline: 'LISTAS PA\' SALIR',
      subline: 'Interrapidísimo se las lleva · Envío 24-72h',
      bg: 'blue',
      accent: 'yellow',
      sticker: null,
    },
    {
      step: 5,
      role: 'cta',
      offsetMin: 420,
      headline: 'TU PEDIDO LA PRÓXIMA',
      subline: 'Escríbenos · WhatsApp en bio',
      bg: 'cream',
      accent: 'red',
      sticker: { type: 'link', url: 'https://latricolor.co/#collection', label: 'Pedir →' },
    },
  ];
}

export const NAME = 'behind-scenes';
export const DESCRIPTION = '5-story BTS arc — trust + small-business cred.';
