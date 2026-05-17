// ============================================
// story-hook-split.js — top 55% text, bottom 45% accent color block.
// Punchy hook layout with negative space at the top and a hard
// color block beneath. Bottom block hosts the logo + optional CTA.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, pillTag, getShadowColor,} from './brand.js';

export function render(descriptor, { width = 1080, height = 1920 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = isDark(bg);
  const accentOnDark = isDark(accent);

  return el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width, height,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter',
    },
  },
    flagBar({ height: 20 }),

    // Top — bg color, text
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: bg,
        flex: 1.2,
        padding: '120px 80px 80px',
        position: 'relative',
      },
    },
      grainOverlay({ opacity: 0.07 }),
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 200,
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `8px 8px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, descriptor.headline || ''),
      descriptor.subline
        ? el('div', {
            style: {
              marginTop: 50,
              fontFamily: 'Bebas Neue',
              fontSize: 52,
              letterSpacing: '0.1em',
              color: onDark ? 'rgba(240,235,224,0.7)' : PALETTE.inkSoft,
              textTransform: 'uppercase',
            },
          }, descriptor.subline)
        : null,
    ),

    // Bottom — accent block, logo + cta
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: accent,
        flex: 1,
        padding: '80px 80px 100px',
        position: 'relative',
      },
    },
      grainOverlay({ opacity: 0.06 }),
      descriptor.cta
        ? pillTag(descriptor.cta, {
            bg: PALETTE.yellow,
            color: PALETTE.ink,
            border: PALETTE.ink,
            shadow: PALETTE.ink,
            fontSize: 48,
            pad: '20px 36px',
          })
        : el('div', { style: { display: 'flex' } }, ''),
      logoTricolor({ size: 'lg', onDark: accentOnDark }),
    ),

    flagBar({ height: 20, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
