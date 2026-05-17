// ============================================
// match-day.js — 8-story sequence around a Colombia match.
//
// Run pattern:
//   -30min  hook   "Game day — mi outfit del partido"
//   0min    hook   "VAMOS COLOMBIA · Tribuna live"
//   +20min  tease  "Gol o no gol? · Poll"
//   +HT     tease  "Mejor jugador del primer tiempo"
//   +60min  reveal "Stock relámpago · 20% en pack 2"
//   +85min  reveal "Score final · ¿qué seguís sintiendo?"
//   +95min  cta    "Compartí tu look del partido · Etiquetá @latricolor.co"
//   next-day cta   "Repost UGC del partido"
// ============================================

export function generate({ opponent = 'Uzbekistán', kickoff = '22:00', stadium = 'Estadio Azteca, CDMX' } = {}) {
  return [
    {
      step: 1,
      role: 'hook',
      offsetMin: -30,
      headline: 'GAME DAY',
      subline: `Mi outfit del partido · Kickoff ${kickoff}`,
      bg: 'yellow',
      accent: 'ink',
      sticker: null,
    },
    {
      step: 2,
      role: 'hook',
      offsetMin: 0,
      headline: '¡VAMOS COLOMBIA!',
      subline: `vs ${opponent} · ${stadium}`,
      bg: 'red',
      accent: 'cream',
      sticker: { type: 'live', label: '● EN VIVO' },
    },
    {
      step: 3,
      role: 'tease',
      offsetMin: 20,
      headline: '¿GOL O NO GOL?',
      subline: 'Tu predicción cuenta',
      bg: 'ink',
      accent: 'yellow',
      sticker: { type: 'poll', question: '¿Marcamos en los primeros 30?', options: ['Sí', 'No'] },
    },
    {
      step: 4,
      role: 'tease',
      offsetMin: 45,
      headline: 'PRIMER TIEMPO',
      subline: 'Mejor jugadora · Sondage',
      bg: 'blue',
      accent: 'yellow',
      sticker: { type: 'poll', question: 'MVP del primer tiempo', options: ['Catalina', 'Linda', 'Mayra', 'Otra'] },
    },
    {
      step: 5,
      role: 'reveal',
      offsetMin: 60,
      headline: 'STOCK RELÁMPAGO',
      subline: '20% extra en pack de 2 — solo durante el partido',
      bg: 'cream',
      accent: 'red',
      sticker: { type: 'link', url: 'https://latricolor.co/#collection', label: 'Pedir Ahora' },
    },
    {
      step: 6,
      role: 'reveal',
      offsetMin: 85,
      headline: 'SCORE FINAL',
      subline: '¿Qué seguís sintiendo?',
      bg: 'red',
      accent: 'cream',
      sticker: { type: 'poll', question: '¿Cómo te sentís?', options: ['Orgullosa', 'Brava', 'Lista pa\' la próxima'] },
    },
    {
      step: 7,
      role: 'cta',
      offsetMin: 95,
      headline: 'COMPARTÍ TU LOOK',
      subline: 'Etiquetá @latricolor.co · Te reposteamos',
      bg: 'cream',
      accent: 'yellow',
      sticker: { type: 'mention', handle: '@latricolor.co' },
    },
    {
      step: 8,
      role: 'cta',
      offsetMin: 24 * 60, // next-day
      headline: 'LA HINCHADA HABLÓ',
      subline: 'Repost UGC · Gracias cafeteras',
      bg: 'cream',
      accent: 'red',
      sticker: { type: 'link', url: 'https://latricolor.co', label: 'Ver más' },
    },
  ];
}

export const NAME = 'match-day';
export const DESCRIPTION = '8-story arc around a Colombia match · -30min to +24h.';
