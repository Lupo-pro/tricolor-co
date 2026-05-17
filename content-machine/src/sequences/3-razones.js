// ============================================
// 3-razones.js — 4-story sequence: intro + 3 reasons.
// Story 1 = the promise ("3 razones por las que..."). Stories 2-4 =
// one giant numbered reason each. Useful for educational drops,
// value posts, and convincing-the-undecided arcs.
//
// Args:
//   { topic, reasons: [{ number, headline, subline }] }
// Defaults to "Por qué Tricolor" if no topic is given.
// ============================================

const DEFAULTS = {
  topic: 'POR QUÉ TRICOLOR',
  reasons: [
    { headline: 'NO ES ROPA', subline: 'Es bandera · es identidad' },
    { headline: 'HECHO ACÁ',  subline: 'Eje Cafetero · a mano · contraentrega' },
    { headline: '4 EDICIONES', subline: 'Una para cada estado de ánimo' },
  ],
};

export function generate({ topic, reasons } = {}) {
  const t = topic || DEFAULTS.topic;
  const r = reasons && reasons.length === 3 ? reasons : DEFAULTS.reasons;

  return [
    {
      step: 1,
      role: 'hook',
      layout: 'hook-center',
      offsetMin: 0,
      headline: `3 RAZONES`,
      subline: t,
      bg: 'yellow', accent: 'red',
    },
    {
      step: 2,
      role: 'reveal',
      layout: 'numbers',
      offsetMin: 60,
      eyebrow: 'RAZÓN 1',
      value: '01',
      label: r[0].headline,
      subline: r[0].subline,
      bg: 'cream', accent: 'red',
      valueSize: 500,
    },
    {
      step: 3,
      role: 'reveal',
      layout: 'numbers',
      offsetMin: 180,
      eyebrow: 'RAZÓN 2',
      value: '02',
      label: r[1].headline,
      subline: r[1].subline,
      bg: 'blue', accent: 'yellow',
      valueSize: 500,
    },
    {
      step: 4,
      role: 'cta',
      layout: 'numbers',
      offsetMin: 300,
      eyebrow: 'RAZÓN 3',
      value: '03',
      label: r[2].headline,
      subline: r[2].subline,
      bg: 'red', accent: 'yellow',
      valueSize: 500,
    },
  ];
}

export const NAME = '3-razones';
export const DESCRIPTION = '4-story value sequence · intro + 3 numbered reasons.';
