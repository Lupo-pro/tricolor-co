// ============================================
// story-numbers.js — fullscreen stat. One huge number, a caption,
// optional eyebrow.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, statNumber,
} from './brand.js';

export function render(descriptor, { width = 1080, height = 1920 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = isDark(bg);
  const value = descriptor.value ?? descriptor.headline ?? '0';
  const label = descriptor.label ?? descriptor.subline ?? '';

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
    grainOverlay({ opacity: 0.07 }),
    flagBar({ height: 24 }),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 100,
      },
    },
      descriptor.eyebrow
        ? starLabel(descriptor.eyebrow, { color: accent, size: 36 })
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
        fontSize: descriptor.valueSize || 560,
        labelSize: descriptor.labelSize || 64,
      }),
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
    flagBar({ height: 24, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
