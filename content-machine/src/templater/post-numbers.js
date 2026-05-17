// ============================================
// post-numbers.js — single GIANT stat as the hero ("127 CAFETERAS").
// Use for social-proof, milestones, countdown numbers.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, statNumber,
} from './brand.js';

export function render(descriptor, { size = 1080 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = isDark(bg);
  const value = descriptor.value ?? descriptor.headline ?? '0';
  const label = descriptor.label ?? descriptor.subline ?? '';

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
        alignItems: 'center',
        paddingTop: 56,
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
        alignItems: 'center',
        flex: 1,
        padding: '0 48px',
      },
    },
      statNumber({
        value,
        label,
        color: onDark ? PALETTE.bg : PALETTE.ink,
        accent,
        fontSize: descriptor.valueSize || 380,
        labelSize: descriptor.labelSize || 52,
      }),
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
