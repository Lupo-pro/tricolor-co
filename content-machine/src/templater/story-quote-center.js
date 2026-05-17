// ============================================
// story-quote-center.js — manifesto quote, story format.
// Giant quotation mark, multiline quote text, attribution.
// ============================================

import {
  PALETTE, el, grainOverlay,
  logoTricolor, bgColor, accentColor, getShadowColor,} from './brand.js';

export function render(descriptor, { width = 1080, height = 1920 } = {}) {
  const bg = bgColor(descriptor.bg || 'red');
  const accent = accentColor(descriptor.accent || 'yellow');
  const onDark = isDark(bg);
  const ink = onDark ? PALETTE.bg : PALETTE.ink;

  return el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width, height,
      backgroundColor: bg,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter',
    },
  },
    grainOverlay({ opacity: 0.08 }),

    // Giant left quote
    el('div', {
      style: {
        display: 'flex',
        position: 'absolute',
        top: 80, left: 70,
        fontFamily: 'Archivo Black',
        fontSize: 480,
        lineHeight: 0.7,
        color: accent,
        opacity: 0.92,
      },
    }, '"'),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        padding: '320px 80px 200px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: descriptor.quoteSize || 150,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: ink,
          textTransform: 'uppercase',
          textShadow: `6px 6px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, descriptor.headline || ''),
      descriptor.subline
        ? el('div', {
            style: {
              display: 'flex',
              marginTop: 60,
              fontFamily: 'Bebas Neue',
              fontSize: 42,
              letterSpacing: '0.2em',
              color: ink,
              textTransform: 'uppercase',
            },
          }, '— ' + descriptor.subline)
        : null,
    ),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 100,
      },
    },
      logoTricolor({ size: 'lg', onDark }),
    ),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
