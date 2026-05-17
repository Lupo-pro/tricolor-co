// ============================================
// mini-documental.js — 7-story narrative arc told in pieces.
// Beats: opening (year/context) → setup → tension → turn → resolution
//        → reflection → outro CTA. Works well for brand storytelling
// (founder, manifesto deep-cut, single-product origin).
//
// Args:
//   { theme, founderName, opener }
// Default theme: "Cómo nació LATRICOLOR.CO".
// ============================================

const DEFAULTS = {
  theme: 'CÓMO NACIÓ LATRICOLOR.CO',
  founderName: 'Nay',
  opener: '2024 · Eje Cafetero',
};

export function generate({ theme, founderName, opener } = {}) {
  const t = theme || DEFAULTS.theme;
  const name = founderName || DEFAULTS.founderName;
  const o = opener || DEFAULTS.opener;

  return [
    {
      step: 1,
      role: 'hook',
      layout: 'hook-center',
      offsetMin: 0,
      tag: 'MINI DOCU',
      headline: t,
      subline: o,
      bg: 'cream', accent: 'red',
    },
    {
      step: 2,
      role: 'tease',
      layout: 'quote-center',
      offsetMin: 90,
      headline: 'NO HABÍA UN BODY DECENTE PARA NOSOTRAS',
      subline: name,
      bg: 'yellow', accent: 'red',
      quoteSize: 130,
    },
    {
      step: 3,
      role: 'reveal',
      layout: 'bts',
      offsetMin: 180,
      eyebrow: 'BTS',
      headline: 'PRIMER PROTOTIPO',
      subline: 'Costura · molde · prueba',
      photoLabel: 'FIRST PROTOTYPE',
      bg: 'cream', accent: 'red',
    },
    {
      step: 4,
      role: 'urgency',
      layout: 'hook-split',
      offsetMin: 270,
      headline: 'NOS DIJERON QUE NO IBA A FUNCIONAR',
      subline: 'Pero ya estábamos en otra',
      bg: 'ink', accent: 'yellow',
    },
    {
      step: 5,
      role: 'reveal',
      layout: 'numbers',
      offsetMin: 360,
      eyebrow: 'PRIMER MES',
      value: '127',
      label: 'CAFETERAS',
      subline: 'Que confiaron en nosotras',
      bg: 'red', accent: 'yellow',
      valueSize: 460,
    },
    {
      step: 6,
      role: 'reveal',
      layout: 'quote-center',
      offsetMin: 450,
      headline: 'NACIMOS PARA EL MUNDIAL',
      subline: 'Mundial 2026 · 4 ediciones',
      bg: 'blue', accent: 'yellow',
      quoteSize: 130,
    },
    {
      step: 7,
      role: 'cta',
      layout: 'hook-split',
      offsetMin: 540,
      headline: 'AHORA TE TOCA A TI',
      subline: 'Hacé parte de la historia',
      bg: 'cream', accent: 'red',
      cta: 'Pedir Ahora',
    },
  ];
}

export const NAME = 'mini-documental';
export const DESCRIPTION = '7-story narrative arc · founder / brand origin / manifesto deep-cut.';
