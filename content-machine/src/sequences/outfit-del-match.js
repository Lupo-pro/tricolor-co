// ============================================
// outfit-del-match.js — 4-story outfit-vote sequence.
//   1. Intro: "Outfit del Match" question
//   2-3. Two outfit options shown with sticker-placeholder layout
//   4. Vote result + CTA
//
// Args:
//   { opponent, optionA, optionB }
// ============================================

const DEFAULTS = {
  opponent: 'Uzbekistán',
  optionA: { edition: 'la-capitana', headline: 'LA CAPITANA',  subline: 'Amarilla · clásica · #10' },
  optionB: { edition: 'la-cafetera', headline: 'LA CAFETERA',  subline: 'Roja · pasión · #09' },
};

export function generate({ opponent, optionA, optionB } = {}) {
  const opp = opponent || DEFAULTS.opponent;
  const a = optionA || DEFAULTS.optionA;
  const b = optionB || DEFAULTS.optionB;

  return [
    {
      step: 1,
      role: 'hook',
      layout: 'hook-center',
      offsetMin: 0,
      tag: 'OUTFIT DEL MATCH',
      headline: `QUÉ TE PONÉS HOY?`,
      subline: `Colombia vs ${opp}`,
      bg: 'cream', accent: 'red',
    },
    {
      step: 2,
      role: 'tease',
      layout: 'sticker-placeholder',
      offsetMin: 60,
      eyebrow: 'OPCIÓN A',
      headline: a.headline,
      subline: a.subline,
      stickerLabel: 'VOTA A',
      bg: 'yellow', accent: 'red',
    },
    {
      step: 3,
      role: 'tease',
      layout: 'sticker-placeholder',
      offsetMin: 120,
      eyebrow: 'OPCIÓN B',
      headline: b.headline,
      subline: b.subline,
      stickerLabel: 'VOTA B',
      bg: 'red', accent: 'cream',
    },
    {
      step: 4,
      role: 'cta',
      layout: 'numbers',
      offsetMin: 240,
      eyebrow: 'EL GANADOR',
      value: 'A · 62%',
      label: a.headline,
      subline: 'Hoy todas vestimos así',
      bg: 'yellow', accent: 'red',
      valueSize: 380,
    },
  ];
}

export const NAME = 'outfit-del-match';
export const DESCRIPTION = '4-story outfit vote · 2 options + sticker vote + result.';
