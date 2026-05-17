// ============================================
// story-pov.js — IG POV-meme format.
// "POV:" chip top-left, scene-text in the middle, optional reaction
// line at the bottom. Comedy / self-deprecating tone.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, pillTag, getShadowColor,
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
    grainOverlay({ opacity: 0.07 }),
    flagBar({ height: 18 }),

    // POV: chip in the top-left, hard-stroke style.
    el('div', {
      style: {
        display: 'flex', paddingTop: 90, paddingLeft: 70,
      },
    },
      pillTag(descriptor.povLabel || 'POV:', {
        bg: PALETTE.red, color: PALETTE.bg,
        border: PALETTE.ink, shadow: PALETTE.ink,
        fontSize: 44, pad: '14px 32px',
      }),
    ),

    // Scene text — what's happening, written like a meme caption.
    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', flex: 1,
        padding: '40px 80px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: descriptor.sceneSize || 130,
          lineHeight: 1.0,
          letterSpacing: '-0.01em',
          color: text,
          textTransform: 'uppercase',
          textShadow: `5px 5px 0 ${getShadowColor(text, accent)}`,
        },
      }, descriptor.scene || descriptor.headline || ''),
    ),

    // Reaction line — single emoji-style line OR a punchline. Optional.
    descriptor.reaction
      ? el('div', {
          style: {
            display: 'flex', justifyContent: 'center',
            paddingBottom: 30,
          },
        },
          el('div', {
            style: {
              display: 'flex',
              padding: '16px 36px',
              backgroundColor: PALETTE.yellow, color: PALETTE.ink,
              border: `4px solid ${PALETTE.ink}`,
              boxShadow: `6px 6px 0 ${PALETTE.ink}`,
              fontFamily: 'Anton', fontSize: 56,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            },
          }, descriptor.reaction),
        )
      : null,

    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingBottom: 90,
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
