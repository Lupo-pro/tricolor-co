// ============================================
// post-quote-crema.js — manifesto quote on crema. Three tricolor
// vertical bands at left as visual anchor (yellow/blue/red).
// Calmer, more editorial than post-quote-fullbg.
// ============================================

import {
  PALETTE, el, grainOverlay,
  logoTricolor, bgColor, accentColor,
} from './brand.js';

export function render(descriptor, { size = 1080 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const onDark = isDark(bg);
  const ink = onDark ? PALETTE.bg : PALETTE.ink;

  return el('div', {
    style: {
      display: 'flex',
      flexDirection: 'row',
      width: size, height: size,
      backgroundColor: bg,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter',
    },
  },
    grainOverlay({ opacity: 0.06 }),

    // Vertical tricolor band column — left edge
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: 64,
        height: '100%',
      },
    },
      el('div', { style: { display: 'flex', flex: 1, backgroundColor: PALETTE.yellow } }),
      el('div', { style: { display: 'flex', flex: 1, backgroundColor: PALETTE.blue } }),
      el('div', { style: { display: 'flex', flex: 1, backgroundColor: PALETTE.red } }),
    ),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        padding: '64px 72px',
      },
    },
      el('div', {
        style: {
          display: 'flex',
          fontFamily: 'Archivo Black',
          fontSize: 120,
          lineHeight: 0.7,
          color: PALETTE.red,
        },
      }, '"'),
      el('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
        },
      },
        el('div', {
          style: {
            fontFamily: 'Anton',
            fontSize: descriptor.quoteSize || 116,
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            color: ink,
            textTransform: 'uppercase',
            textShadow: `4px 4px 0 ${PALETTE.red}`,
          },
        }, descriptor.headline || ''),
        descriptor.subline
          ? el('div', {
              style: {
                display: 'flex',
                marginTop: 28,
                fontFamily: 'Bebas Neue',
                fontSize: 32,
                letterSpacing: '0.18em',
                color: PALETTE.muted,
                textTransform: 'uppercase',
              },
            }, '— ' + descriptor.subline)
          : null,
      ),
      el('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        },
      },
        logoTricolor({ size: 'md', onDark }),
        descriptor.footer
          ? el('div', {
              style: {
                fontFamily: 'Bebas Neue',
                fontSize: 22,
                letterSpacing: '0.2em',
                color: PALETTE.muted,
                textTransform: 'uppercase',
              },
            }, descriptor.footer)
          : null,
      ),
    ),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
