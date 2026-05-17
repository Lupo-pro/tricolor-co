// ============================================
// post-quote-attributed.js — single big quote, attribution, optional
// date in the corner. Used by the tribute / origin angles.
//
// descriptor: { headline (the quote), attribution, date, bg, accent }
// ============================================

import {
  PALETTE, el, grainOverlay,
  logoTricolor, bgColor, accentColor, getShadowColor,
} from './brand.js';

export function render(descriptor, { size = 1080 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = isDark(bg);
  const text = onDark ? PALETTE.bg : PALETTE.ink;

  return el('div', {
    style: {
      display: 'flex', flexDirection: 'column',
      width: size, height: size,
      backgroundColor: bg, position: 'relative',
      overflow: 'hidden', fontFamily: 'Inter',
    },
  },
    grainOverlay({ opacity: 0.07 }),

    // Date chip in the top-right corner.
    descriptor.date
      ? el('div', {
          style: {
            display: 'flex', position: 'absolute',
            top: 28, right: 28,
            fontFamily: 'Bebas Neue', fontSize: 22,
            letterSpacing: '0.22em',
            color: onDark ? 'rgba(240,235,224,0.6)' : PALETTE.muted,
            textTransform: 'uppercase',
          },
        }, descriptor.date)
      : null,

    // Tall left quote mark (visual anchor)
    el('div', {
      style: {
        display: 'flex', position: 'absolute',
        top: 36, left: 56,
        fontFamily: 'Archivo Black', fontSize: 360,
        lineHeight: 0.7, color: accent, opacity: 0.92,
      },
    }, '"'),

    // The quote
    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        flex: 1, padding: '180px 80px 60px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: descriptor.quoteSize || 110,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: text,
          textTransform: 'uppercase',
          textShadow: `5px 5px 0 ${getShadowColor(text, accent)}`,
        },
      }, descriptor.headline || ''),
      // Attribution line — "— Nay, fundadora"
      descriptor.attribution
        ? el('div', {
            style: {
              display: 'flex', marginTop: 40,
              fontFamily: 'Bebas Neue', fontSize: 32,
              letterSpacing: '0.2em',
              color: onDark ? 'rgba(240,235,224,0.7)' : PALETTE.muted,
              textTransform: 'uppercase',
            },
          }, '— ' + descriptor.attribution)
        : null,
    ),

    el('div', {
      style: {
        display: 'flex', justifyContent: 'flex-end',
        alignItems: 'flex-end', padding: '0 56px 48px',
      },
    },
      logoTricolor({ size: 'md', onDark }),
    ),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
