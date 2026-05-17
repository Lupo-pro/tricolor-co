// ============================================
// post-quote-fullbg.js — manifesto quote on full-color background.
// Large pull-quote, attribution line below. No flag bars (full bleed).
// ============================================

import {
  PALETTE, el, grainOverlay,
  logoTricolor, bgColor, accentColor,
} from './brand.js';

export function render(descriptor, { size = 1080 } = {}) {
  const bg = bgColor(descriptor.bg || 'red');
  const accent = accentColor(descriptor.accent || 'yellow');
  const onDark = isDark(bg);
  const ink = onDark ? PALETTE.bg : PALETTE.ink;

  return el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: size, height: size,
      backgroundColor: bg,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter',
    },
  },
    grainOverlay({ opacity: 0.08 }),

    // Giant left quote mark
    el('div', {
      style: {
        display: 'flex',
        position: 'absolute',
        top: 40, left: 60,
        fontFamily: 'Archivo Black',
        fontSize: 360,
        lineHeight: 0.7,
        color: accent,
        opacity: 0.9,
      },
    }, '"'),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flex: 1,
        padding: '180px 80px 80px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: descriptor.quoteSize || 120,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: ink,
          textTransform: 'uppercase',
          textShadow: `5px 5px 0 ${accent}`,
        },
      }, descriptor.headline || ''),
      descriptor.subline
        ? el('div', {
            style: {
              display: 'flex',
              marginTop: 40,
              fontFamily: 'Bebas Neue',
              fontSize: 36,
              letterSpacing: '0.18em',
              color: ink,
              textTransform: 'uppercase',
            },
          }, '— ' + descriptor.subline)
        : null,
    ),

    el('div', {
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: '0 80px 56px',
      },
    },
      logoTricolor({ size: 'md', onDark }),
    ),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
