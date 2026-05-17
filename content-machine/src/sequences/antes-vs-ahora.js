// ============================================
// antes-vs-ahora.js — 3-story transformation arc.
//   1. "Antes" (the pain point)
//   2. "Ahora" (the new state)
//   3. CTA bridging the two
//
// Args:
//   { antes: { headline, subline }, ahora: { headline, subline }, cta }
// ============================================

const DEFAULTS = {
  antes: { headline: 'CAMISETA UNISEX', subline: 'Talla única · queda enorme' },
  ahora: { headline: 'BODY HECHO PARA TI', subline: 'S · M · L · abraza, no aprieta' },
  cta:   'Pedir Ahora',
};

export function generate({ antes, ahora, cta } = {}) {
  const a = antes || DEFAULTS.antes;
  const b = ahora || DEFAULTS.ahora;
  const c = cta || DEFAULTS.cta;

  return [
    {
      step: 1,
      role: 'tease',
      layout: 'hook-center',
      offsetMin: 0,
      tag: 'ANTES',
      headline: a.headline,
      subline: a.subline,
      bg: 'cream', accent: 'red',
    },
    {
      step: 2,
      role: 'reveal',
      layout: 'hook-split',
      offsetMin: 120,
      headline: b.headline,
      subline: b.subline,
      bg: 'yellow', accent: 'red',
      cta: 'Verlo Ya',
    },
    {
      step: 3,
      role: 'cta',
      layout: 'hook-split',
      offsetMin: 240,
      headline: 'BIENVENIDA AL FUTURO',
      subline: 'Mundial 2026 · ya estás lista',
      bg: 'red', accent: 'yellow',
      cta: c,
    },
  ];
}

export const NAME = 'antes-vs-ahora';
export const DESCRIPTION = '3-story transformation arc · antes / ahora / cta.';
