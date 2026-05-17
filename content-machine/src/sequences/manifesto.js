// ============================================
// manifesto.js — 4-story brand-storytelling sequence.
//
// One manifesto line per story, paced for a slow read.
// Pure brand content — no CTA, no sticker, no urgency.
// ============================================

export function generate() {
  return [
    {
      step: 1,
      role: 'tease',
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
      offsetMin: 240,
      headline: 'LLORAMOS · GRITAMOS',
      subline: 'Cuando ganamos. Cuando perdemos.',
      bg: 'red',
      accent: 'cream',
      sticker: null,
    },
    {
      step: 4,
      role: 'reveal',
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
