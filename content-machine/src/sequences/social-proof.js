// ============================================
// social-proof.js — 6-story social proof loop.
//
// Mixes customer reviews + unboxing + stats + UGC repost + CTA.
// Spread over a day; each story has its own role.
// ============================================

export function generate({ reviews = [], stats = {} } = {}) {
  const r = (i, fallback) => reviews[i] || fallback;
  const stat = {
    weekly: stats.weekly || '127',
    rating: stats.rating || '4.9',
    pct:    stats.pct    || '98%',
  };

  return [
    {
      step: 1,
      role: 'reveal',
      offsetMin: 0,
      headline: '"ESTOY ENAMORADA"',
      subline: r(0, '— Valentina · Bogotá · La Capitana'),
      bg: 'cream',
      accent: 'red',
      sticker: { type: 'mention', handle: r(0)?.handle },
    },
    {
      step: 2,
      role: 'reveal',
      offsetMin: 120,
      headline: '"LA TELA ES BRUTAL"',
      subline: r(1, '— María · Medellín · La Cafetera'),
      bg: 'yellow',
      accent: 'ink',
      sticker: null,
    },
    {
      step: 3,
      role: 'reveal',
      offsetMin: 240,
      headline: 'UNBOXING',
      subline: 'Hecho en el Eje Cafetero · Empacado a mano',
      bg: 'cream',
      accent: 'blue',
      sticker: null,
    },
    {
      step: 4,
      role: 'urgency',
      offsetMin: 360,
      headline: `${stat.weekly} CAFETERAS`,
      subline: `Pidieron esta semana · ${stat.rating}/5 · ${stat.pct} recomienda`,
      bg: 'ink',
      accent: 'yellow',
      sticker: null,
    },
    {
      step: 5,
      role: 'reveal',
      offsetMin: 480,
      headline: 'TU LOOK NOS MATA',
      subline: 'Repost de @cliente · Gracias mi vida',
      bg: 'red',
      accent: 'cream',
      sticker: { type: 'mention', handle: '@cliente_handle' },
    },
    {
      step: 6,
      role: 'cta',
      offsetMin: 600,
      headline: 'ÚNETE A LA TRIBUNA',
      subline: 'Link en bio · Tu body te espera',
      bg: 'cream',
      accent: 'red',
      sticker: { type: 'link', url: 'https://latricolor.co/#collection', label: 'Pedir →' },
    },
  ];
}

export const NAME = 'social-proof';
export const DESCRIPTION = '6-story social proof loop over a day.';
