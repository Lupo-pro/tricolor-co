// ============================================
// manifesto.js — 4-story brand-storytelling sequence.
//
// One manifesto line per story, paced for a slow read.
// Pure brand content — no CTA, no sticker, no urgency.
// ============================================

// Layout rotation — quote-center → hook-split → hook-center →
// quote-center. The manifesto is by nature a quote sequence so it
// leans on quote-center, but breaks the pattern in slots 2/3 so the
// audience doesn't see four identical centered quotes.
export function generate() {
  return [
    {
      step: 1,
      role: 'tease',
      layout: 'quote-center',
      offsetMin: 0,
      headline: 'NACIMOS AMARILLAS',
      subline: 'Azules y rojas',
      bg: 'yellow',
      accent: 'red',
      sticker: null,
    },
    {
      step: 2,
      role: 'tease',
      layout: 'hook-split',
      offsetMin: 120,
      headline: 'CRECIMOS CANTANDO',
      subline: 'El himno con la mano en el pecho',
      bg: 'blue',
      accent: 'yellow',
      sticker: null,
    },
    {
      step: 3,
      role: 'tease',
      layout: 'hook-center',
      offsetMin: 240,
      tag: 'MANIFIESTO',
      headline: 'LLORAMOS · GRITAMOS',
      subline: 'Cuando ganamos. Cuando perdemos.',
      bg: 'red',
      accent: 'cream',
      sticker: null,
    },
    {
      step: 4,
      role: 'reveal',
      layout: 'quote-center',
      offsetMin: 360,
      headline: 'ES BANDERA',
      subline: 'Este body no es ropa.',
      bg: 'ink',
      accent: 'yellow',
      sticker: { type: 'link', url: 'https://latricolor.co/#manifesto', label: 'Leer el Manifesto' },
    },
  ];
}

export const NAME = 'manifesto';
export const DESCRIPTION = '4-story brand storytelling — one line per beat.';
