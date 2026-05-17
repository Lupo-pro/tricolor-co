// ============================================
// story-confession.js — vulnerable, first-person reveal.
// Small "TE CUENTO ALGO..." eyebrow up top, the confession itself as
// a large centered quote, signature line below.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, getShadowColor,
} from './brand.js';

export function render(descriptor, { width = 1080, height = 1920 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = isDark(bg);
  const text = onDark ? PALETTE.bg : PALETTE.ink;

  return el('div', {
    style: {
      display: 'flex', flexDirection: 'column',
      width, height, backgroundColor: bg,
      position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter',
    },
  },
    grainOverlay({ opacity: 0.08 }),
    flagBar({ height: 18 }),

    // Eyebrow — small, like a whispered intro
    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        paddingTop: 110, paddingLeft: 80,
      },
    },
      starLabel(descriptor.eyebrow || 'TE CUENTO ALGO...', { color: accent, size: 28 }),
    ),

    // The confession itself — centered, oversized, with a tall left-quote
    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', flex: 1,
        padding: '40px 80px 40px',
      },
    },
      el('div', {
        style: {
          display: 'flex',
          fontFamily: 'Archivo Black', fontSize: 280,
          lineHeight: 0.7, color: accent, opacity: 0.9,
          marginBottom: -50,
        },
      }, '"'),
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: descriptor.headlineSize || 140,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: text,
          textTransform: 'uppercase',
          textShadow: `6px 6px 0 ${getShadowColor(text, accent)}`,
        },
      }, descriptor.headline || ''),
      // Signature line — "— Nay" / "— Una cafetera de Pereira"
      descriptor.signature
        ? el('div', {
            style: {
              display: 'flex',
              marginTop: 48,
              fontFamily: 'Bebas Neue', fontSize: 36,
              letterSpacing: '0.22em',
              color: onDark ? 'rgba(240,235,224,0.7)' : PALETTE.muted,
              textTransform: 'uppercase',
            },
          }, '— ' + descriptor.signature)
        : null,
    ),

    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingBottom: 100,
      },
    },
      logoTricolor({ size: 'lg', onDark }),
    ),
    flagBar({ height: 18, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
