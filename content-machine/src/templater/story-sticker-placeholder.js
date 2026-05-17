// ============================================
// story-sticker-placeholder.js — leaves a circle slot in the lower
// third so the publisher can drop an IG sticker (poll, question,
// emoji slider) without colliding with the type.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel,
} from './brand.js';

export function render(descriptor, { width = 1080, height = 1920 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = isDark(bg);

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
    flagBar({ height: 20 }),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 80,
      },
    },
      descriptor.eyebrow
        ? starLabel(descriptor.eyebrow, { color: accent, size: 32 })
        : null,
    ),

    // Headline, upper-middle
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 0.9,
        padding: '40px 60px',
        textAlign: 'center',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 170,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `7px 7px 0 ${accent}`,
        },
      }, descriptor.headline || ''),
      descriptor.subline
        ? el('div', {
            style: {
              marginTop: 30,
              fontFamily: 'Bebas Neue',
              fontSize: 40,
              letterSpacing: '0.12em',
              color: onDark ? 'rgba(240,235,224,0.7)' : PALETTE.muted,
              textTransform: 'uppercase',
            },
          }, descriptor.subline)
        : null,
    ),

    // Sticker placeholder zone — circle hint in lower middle
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 0.8,
      },
    },
      el('div', {
        style: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 360, height: 360,
          borderRadius: 180,
          border: `5px dashed ${onDark ? 'rgba(240,235,224,0.45)' : 'rgba(10,10,10,0.25)'}`,
          backgroundColor: onDark ? 'rgba(240,235,224,0.05)' : 'rgba(10,10,10,0.03)',
        },
      },
        el('div', {
          style: {
            display: 'flex',
            fontFamily: 'Bebas Neue',
            fontSize: 32,
            letterSpacing: '0.3em',
            color: onDark ? 'rgba(240,235,224,0.55)' : PALETTE.muted,
            textTransform: 'uppercase',
          },
        }, descriptor.stickerLabel || 'STICKER'),
      ),
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
    flagBar({ height: 20, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
