// ============================================
// post-typo-pure.js — V5 square post, pure typography.
// The "default" layout — big Anton headline, eyebrow with stars,
// Bebas subline, tricolor flag bands top/bottom, logo bottom-left.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel,
} from './brand.js';

export function render(descriptor, { size = 1080 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = isDark(bg);

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
    grainOverlay({ opacity: 0.07 }),
    flagBar({ height: 18 }),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingTop: 56, paddingLeft: 64, paddingRight: 64,
      },
    },
      descriptor.eyebrow
        ? starLabel(descriptor.eyebrow, { color: accent, size: 28 })
        : null,
    ),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        padding: '0 64px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 156,
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `6px 6px 0 ${accent}`,
        },
      }, descriptor.headline || ''),
      descriptor.subline
        ? el('div', {
            style: {
              marginTop: 36,
              fontFamily: 'Bebas Neue',
              fontSize: 44,
              letterSpacing: '0.1em',
              color: onDark ? 'rgba(240,235,224,0.78)' : PALETTE.inkSoft,
              textTransform: 'uppercase',
            },
          }, descriptor.subline)
        : null,
    ),

    el('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '0 64px 56px',
      },
    },
      logoTricolor({ size: 'md', onDark }),
      descriptor.footer
        ? el('div', {
            style: {
              fontFamily: 'Bebas Neue',
              fontSize: 22,
              letterSpacing: '0.18em',
              color: onDark ? 'rgba(240,235,224,0.6)' : PALETTE.muted,
              textTransform: 'uppercase',
              textAlign: 'right',
            },
          }, descriptor.footer)
        : null,
    ),

    flagBar({ height: 18, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
