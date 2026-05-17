// ============================================
// post-typo-silhouette.js — typo left, bodysuit silhouette right.
// Hero presentation of a single edition. The silhouette is rendered
// inline (brand.bodyShape) so it can be tinted by edition color.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, bodyShape,
} from './brand.js';

const SILHOUETTE_COLORS = {
  yellow: PALETTE.yellow,
  blue:   PALETTE.blue,
  red:    PALETTE.red,
  ink:    PALETTE.ink,
  cream:  PALETTE.bg,
};

export function render(descriptor, { size = 1080 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const silhouetteColor = SILHOUETTE_COLORS[descriptor.silhouette || descriptor.accent || 'yellow'] || PALETTE.yellow;
  const onDark = isDark(bg);
  const stroke = onDark ? PALETTE.bg : PALETTE.ink;

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

    // Main split — typo column (left), silhouette column (right)
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        padding: '56px 64px',
        alignItems: 'stretch',
      },
    },
      // Left column: eyebrow + headline + subline
      el('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '58%',
        },
      },
        el('div', {
          style: { display: 'flex', flexDirection: 'column' },
        },
          descriptor.eyebrow
            ? starLabel(descriptor.eyebrow, { color: accent, size: 26 })
            : null,
        ),
        el('div', {
          style: { display: 'flex', flexDirection: 'column' },
        },
          el('div', {
            style: {
              fontFamily: 'Anton',
              fontSize: 140,
              lineHeight: 0.88,
              letterSpacing: '-0.02em',
              color: onDark ? PALETTE.bg : PALETTE.ink,
              textTransform: 'uppercase',
              textShadow: `5px 5px 0 ${accent}`,
            },
          }, descriptor.headline || ''),
          descriptor.subline
            ? el('div', {
                style: {
                  marginTop: 28,
                  fontFamily: 'Bebas Neue',
                  fontSize: 38,
                  letterSpacing: '0.1em',
                  color: onDark ? 'rgba(240,235,224,0.78)' : PALETTE.inkSoft,
                  textTransform: 'uppercase',
                },
              }, descriptor.subline)
            : null,
        ),
        logoTricolor({ size: 'md', onDark }),
      ),
      // Right column: silhouette
      el('div', {
        style: {
          display: 'flex',
          width: '42%',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
        bodyShape({
          width: 380, height: 540,
          color: silhouetteColor,
          stroke,
          strokeWidth: 8,
          number: descriptor.number,
          numberColor: silhouetteColor === PALETTE.ink ? PALETTE.yellow : PALETTE.ink,
        }),
      ),
    ),

    flagBar({ height: 18, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
