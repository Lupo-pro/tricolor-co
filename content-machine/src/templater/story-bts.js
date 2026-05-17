// ============================================
// story-bts.js — Behind the Scenes layout.
// Diagonal-feeling split: crema top, ink chunk bottom with a small
// photo placeholder block + headline. Editorial / raw feel.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, photoFrame,
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
    grainOverlay({ opacity: 0.08 }),
    flagBar({ height: 18 }),

    // Eyebrow top
    el('div', {
      style: {
        display: 'flex',
        paddingTop: 70,
        paddingLeft: 70,
      },
    },
      starLabel(descriptor.eyebrow || 'BEHIND THE SCENES', { color: accent, size: 30 }),
    ),

    // Photo placeholder zone — large rectangle, off-center
    el('div', {
      style: {
        display: 'flex',
        padding: '40px 80px 0',
        flex: 1,
      },
    },
      descriptor.photoUrl
        ? el('img', {
            src: descriptor.photoUrl,
            style: { width: '100%', height: '100%', objectFit: 'cover' },
          })
        : photoFrame({
            label: descriptor.photoLabel || 'BTS PHOTO',
            borderColor: onDark ? PALETTE.bg : PALETTE.ink,
          }),
    ),

    // Headline block at bottom
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 70px 0',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 140,
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
              marginTop: 24,
              fontFamily: 'Bebas Neue',
              fontSize: 40,
              letterSpacing: '0.1em',
              color: onDark ? 'rgba(240,235,224,0.7)' : PALETTE.inkSoft,
              textTransform: 'uppercase',
            },
          }, descriptor.subline)
        : null,
    ),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 80,
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
