// ============================================
// match-prep-day.js — 6-story arc for the day of a Selección match.
//
// Beat structure:
//   wake-up → outfit → camino al estadio → kickoff → gol → after
//   ~14h (06:00 → 23:30 Colombia time on match day).
//
// Args:
//   { opponent, kickoff, stadium, edition }
// ============================================

const EDITION_LABEL = {
  'la-capitana': 'La Capitana',
  'la-portera':  'La Portera',
  'oro-negro':   'Oro Negro',
  'la-cafetera': 'La Cafetera',
};

export function generate({
  opponent = 'Uzbekistán',
  kickoff = '22:00',
  stadium = 'Estadio Azteca · CDMX',
  edition = 'la-capitana',
} = {}) {
  const editionName = EDITION_LABEL[edition] || 'La Capitana';

  return [
    {
      step: 1,
      role: 'hook',
      layout: 'hook-center',
      offsetMin: 0,
      tag: 'MATCH DAY',
      headline: 'HOY ES HOY',
      subline: `Colombia vs ${opponent} · ${kickoff}`,
      bg: 'yellow', accent: 'red',
      sticker: null,
    },
    {
      step: 2,
      role: 'tease',
      layout: 'hook-split',
      offsetMin: 240, // 10:00
      headline: 'EL OUTFIT YA ESTÁ LISTO',
      subline: `${editionName} · gorra · trapo`,
      bg: 'cream', accent: 'yellow',
      cta: 'Ver Ediciones',
    },
    {
      step: 3,
      role: 'reveal',
      layout: 'bts',
      offsetMin: 720, // 18:00
      eyebrow: 'Camino al Parche',
      headline: 'CALENTANDO LA TRIBUNA',
      subline: 'En sala · en bar · donde sea',
      photoLabel: 'PARCHE BTS',
      bg: 'cream', accent: 'red',
    },
    {
      step: 4,
      role: 'urgency',
      layout: 'hook-center',
      offsetMin: 960, // 22:00 kickoff
      tag: 'EN VIVO',
      headline: '¡VAMOS COLOMBIA!',
      subline: `vs ${opponent} · ${stadium}`,
      bg: 'red', accent: 'yellow',
      sticker: { type: 'countdown', endsInHours: 2, label: 'Termina en' },
    },
    {
      step: 5,
      role: 'urgency',
      layout: 'match-score',
      offsetMin: 1020, // 23:00 — assume mid-match
      eyebrow: 'MINUTO 67',
      home: { name: 'COL', score: 1, color: 'yellow' },
      away: { name: opponent.slice(0, 3).toUpperCase(), score: 0, color: 'cream' },
      subline: '¡GOL DE COLOMBIA!',
    },
    {
      step: 6,
      role: 'cta',
      layout: 'quote-center',
      offsetMin: 1110, // 00:30 next day post-match
      headline: 'LA TRICOLOR NO SE RINDE',
      subline: 'Hasta la próxima · sé Tricolor',
      bg: 'ink', accent: 'yellow',
      quoteSize: 130,
    },
  ];
}

export const NAME = 'match-prep-day';
export const DESCRIPTION = '6-story match-day arc · wake-up → outfit → kickoff → gol → after.';
