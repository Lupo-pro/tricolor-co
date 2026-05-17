// ============================================
// post-comparison.js — antes/después split. Left half = before,
// right half = after. Each side has its own bg + headline.
// descriptor: { left: { label, headline, bg }, right: { label, headline, bg }, footer }
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, getShadowColor,} from './brand.js';

function panel({ label, headline, bg, accent = PALETTE.red, alignRight = false }) {
  const onDark = isDark(bg);
  return el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      backgroundColor: bg,
      padding: '72px 56px',
      position: 'relative',
      justifyContent: 'space-between',
      alignItems: alignRight ? 'flex-end' : 'flex-start',
    },
  },
    grainOverlay({ opacity: 0.06 }),
    el('div', {
      style: {
        display: 'flex',
        fontFamily: 'Bebas Neue',
        fontSize: 36,
        letterSpacing: '0.3em',
        color: onDark ? PALETTE.yellow : PALETTE.red,
        textTransform: 'uppercase',
      },
    }, label || ''),
    el('div', {
      style: {
        display: 'flex',
        fontFamily: 'Anton',
        fontSize: 140,
        lineHeight: 0.88,
        letterSpacing: '-0.02em',
        color: onDark ? PALETTE.bg : PALETTE.ink,
        textTransform: 'uppercase',
        textShadow: `5px 5px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        textAlign: alignRight ? 'right' : 'left',
      },
    }, headline || ''),
  );
}

export function render(descriptor, { size = 1080 } = {}) {
  const left = descriptor.left || { label: 'ANTES', headline: 'CAMISETA', bg: 'cream' };
  const right = descriptor.right || { label: 'AHORA', headline: 'BODY', bg: 'red' };
  const leftBg = bgColor(left.bg || 'cream');
  const rightBg = bgColor(right.bg || 'red');

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

    el('div', {
      style: { display: 'flex', flexDirection: 'row', flex: 1 },
    },
      panel({ label: left.label, headline: left.headline, bg: leftBg, accent: PALETTE.red }),
      // Vertical divider — 3-color stripe band
      el('div', {
        style: {
          display: 'flex', flexDirection: 'column',
          width: 16, height: '100%',
        },
      },
        el('div', { style: { display: 'flex', flex: 1, backgroundColor: PALETTE.yellow } }),
        el('div', { style: { display: 'flex', flex: 1, backgroundColor: PALETTE.blue } }),
        el('div', { style: { display: 'flex', flex: 1, backgroundColor: PALETTE.red } }),
      ),
      panel({ label: right.label, headline: right.headline, bg: rightBg, accent: PALETTE.yellow, alignRight: true }),
    ),

    // Footer bar
    el('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 48px',
        backgroundColor: PALETTE.ink,
      },
    },
      logoTricolor({ size: 'sm', onDark: true }),
      el('div', {
        style: {
          fontFamily: 'Bebas Neue',
          fontSize: 22,
          letterSpacing: '0.2em',
          color: PALETTE.bg,
          textTransform: 'uppercase',
        },
      }, descriptor.footer || 'LA EVOLUCIÓN'),
    ),

    flagBar({ height: 16, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
