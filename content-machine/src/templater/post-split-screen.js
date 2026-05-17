// ============================================
// post-split-screen.js — 50/50 horizontal split. Top half color block
// with eyebrow, bottom half ink with headline. Heavy contrast.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, getShadowColor,} from './brand.js';

export function render(descriptor, { size = 1080 } = {}) {
  const topBg = bgColor(descriptor.bg || 'yellow');
  const bottomBg = bgColor(descriptor.bottom || 'ink');
  const accent = accentColor(descriptor.accent || 'red');
  const topOnDark = isDark(topBg);
  const bottomOnDark = isDark(bottomBg);

  return el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: size, height: size,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter',
    },
  },
    flagBar({ height: 16 }),

    // Top half — color block with eyebrow + subline up
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: topBg,
        flex: 1,
        padding: '64px',
        justifyContent: 'space-between',
      },
    },
      grainOverlay({ opacity: 0.06 }),
      descriptor.eyebrow
        ? starLabel(descriptor.eyebrow, { color: accent, size: 28 })
        : el('div', { style: { display: 'flex' } }, ''),
      descriptor.subline
        ? el('div', {
            style: {
              display: 'flex',
              fontFamily: 'Bebas Neue',
              fontSize: 44,
              letterSpacing: '0.12em',
              color: topOnDark ? PALETTE.bg : PALETTE.ink,
              textTransform: 'uppercase',
            },
          }, descriptor.subline)
        : el('div', { style: { display: 'flex' } }, ''),
    ),

    // Bottom half — ink (or specified) with the big headline
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: bottomBg,
        flex: 1,
        padding: '64px',
        justifyContent: 'space-between',
      },
    },
      grainOverlay({ opacity: 0.06 }),
      el('div', {
        style: {
          display: 'flex',
          fontFamily: 'Anton',
          fontSize: 180,
          lineHeight: 0.88,
          letterSpacing: '-0.03em',
          color: bottomOnDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `7px 7px 0 ${getShadowColor(bottomOnDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, descriptor.headline || ''),
      el('div', {
        style: {
          display: 'flex',
          justifyContent: 'flex-start',
        },
      },
        logoTricolor({ size: 'md', onDark: bottomOnDark }),
      ),
    ),

    flagBar({ height: 16, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
