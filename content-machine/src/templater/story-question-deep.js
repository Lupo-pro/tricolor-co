// ============================================
// story-question-deep.js — open-ended question, big mark, teaser.
// Huge "¿..." up top, the question fills the centre, a small
// "Mañana te respondo →" teaser at the bottom for the next story.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, arrowIcon, getShadowColor,
} from './brand.js';

export function render(descriptor, { width = 1080, height = 1920 } = {}) {
  const bg = bgColor(descriptor.bg || 'ink');
  const accent = accentColor(descriptor.accent || 'yellow');
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
    flagBar({ height: 20 }),

    // Huge "¿..." mark — visually carries the question
    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: 100,
      },
    },
      el('div', {
        style: {
          display: 'flex',
          fontFamily: 'Archivo Black',
          fontSize: 360, lineHeight: 0.85,
          color: accent,
          letterSpacing: '-0.05em',
        },
      }, '¿...'),
    ),

    // The question itself
    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        flex: 1, padding: '40px 80px', textAlign: 'center',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: descriptor.questionSize || 130,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: text,
          textTransform: 'uppercase',
          textShadow: `7px 7px 0 ${getShadowColor(text, accent)}`,
        },
      }, descriptor.question || descriptor.headline || ''),
    ),

    // Teaser footer — "Mañana te respondo →"
    el('div', {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 18, paddingBottom: 60,
      },
    },
      el('div', {
        style: {
          display: 'flex',
          fontFamily: 'Bebas Neue', fontSize: 44,
          letterSpacing: '0.18em',
          color: onDark ? PALETTE.yellow : PALETTE.red,
          textTransform: 'uppercase',
        },
      }, descriptor.teaser || 'Mañana te respondo'),
      arrowIcon({ size: 40, color: onDark ? PALETTE.yellow : PALETTE.red }),
    ),

    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingBottom: 60,
      },
    },
      logoTricolor({ size: 'lg', onDark }),
    ),
    flagBar({ height: 20, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
