// ============================================
// post-typo-pure.js — V5 square post, pure typography.
// The "default" layout — big Anton headline, eyebrow with stars,
// Bebas subline, tricolor flag bands top/bottom.
//
// Honours descriptor.composition when present:
//   titleAlign   left | center | right    (text-align of the body)
//   titlePos     top | center | bottom    (vertical anchor)
//   bgStyle      solid | gradient-diag | gradient-vert | tri-band
//   logoCorner   bottom-center | bottom-left | bottom-right | top-right
// If composition is absent the layout falls back to its original
// look so any caller that doesn't set composition still works.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, getShadowColor,
  gradientOverlay, triBand,
} from './brand.js';

function justifyFor(pos) {
  if (pos === 'top')    return 'flex-start';
  if (pos === 'bottom') return 'flex-end';
  return 'center';
}
function alignFor(side) {
  if (side === 'center') return 'center';
  if (side === 'right')  return 'flex-end';
  return 'flex-start';
}

function logoContainer(corner, onDark, footer, footerColor) {
  // Returns the positioned logo + optional footer block.
  // "top-right" lives in the outer wrap at position:absolute so it
  // doesn't fight with the rest of the column.
  if (corner === 'top-right') {
    return el('div', {
      style: {
        display: 'flex', position: 'absolute',
        top: 30, right: 30, alignItems: 'flex-start',
      },
    }, logoTricolor({ size: 'sm', onDark }));
  }
  const justify =
    corner === 'bottom-left'  ? 'flex-start' :
    corner === 'bottom-right' ? 'flex-end'   : 'space-between';
  return el('div', {
    style: {
      display: 'flex',
      justifyContent: justify,
      alignItems: 'flex-end',
      padding: '0 64px 56px',
    },
  },
    logoTricolor({ size: 'md', onDark }),
    footer
      ? el('div', {
          style: {
            fontFamily: 'Bebas Neue', fontSize: 22,
            letterSpacing: '0.18em', color: footerColor,
            textTransform: 'uppercase', textAlign: 'right',
          },
        }, footer)
      : null,
  );
}

export function render(descriptor, { size = 1080 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = isDark(bg);
  const text = onDark ? PALETTE.bg : PALETTE.ink;
  const composition = descriptor.composition || {};
  const titleAlign = composition.titleAlign || 'left';
  const titlePos   = composition.titlePos   || 'center';
  const bgStyle    = composition.bgStyle    || 'solid';
  const logoCorner = composition.logoCorner || 'bottom-center';
  const footerColor = onDark ? 'rgba(240,235,224,0.6)' : PALETTE.muted;

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
    // Background variation — sits under everything except flagBar.
    bgStyle === 'gradient-diag'
      ? gradientOverlay({ from: bg, to: accent, direction: 'diag', opacity: 0.18 })
      : bgStyle === 'gradient-vert'
        ? gradientOverlay({ from: bg, to: PALETTE.bgWarm, direction: 'vert', opacity: 0.45 })
        : null,
    bgStyle === 'tri-band' ? triBand({ edge: 'left', thickness: 32 }) : null,

    grainOverlay({ opacity: 0.07 }),
    flagBar({ height: 18 }),

    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        alignItems: alignFor(titleAlign),
        paddingTop: 56,
        paddingLeft:  bgStyle === 'tri-band' ? 96 : 64,
        paddingRight: 64,
      },
    },
      descriptor.eyebrow
        ? starLabel(descriptor.eyebrow, { color: accent, size: 28 })
        : null,
    ),

    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        justifyContent: justifyFor(titlePos),
        alignItems: alignFor(titleAlign),
        flex: 1,
        padding: '0 64px',
        paddingLeft: bgStyle === 'tri-band' ? 96 : 64,
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 156,
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          color: text,
          textTransform: 'uppercase',
          textAlign: titleAlign,
          textShadow: `6px 6px 0 ${getShadowColor(text, accent)}`,
        },
      }, descriptor.headline || ''),
      descriptor.subline
        ? el('div', {
            style: {
              marginTop: 36,
              fontFamily: 'Bebas Neue', fontSize: 44,
              letterSpacing: '0.1em',
              color: onDark ? 'rgba(240,235,224,0.78)' : PALETTE.inkSoft,
              textTransform: 'uppercase',
              textAlign: titleAlign,
            },
          }, descriptor.subline)
        : null,
    ),

    logoContainer(logoCorner, onDark, descriptor.footer, footerColor),
    flagBar({ height: 18, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
