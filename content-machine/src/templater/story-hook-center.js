// ============================================
// story-hook-center.js — V5 story, hook layout, centered.
// Live tag top-left, big headline center, subline below, logo bottom.
// Mirrors the original renderHook in story.js so the layout is
// addressable by name, not just role.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, getShadowColor,} from './brand.js';

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
    flagBar({ height: 24 }),

    // Live tag
    el('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        alignSelf: 'flex-start',
        marginTop: 60, marginLeft: 60,
        padding: '14px 24px',
        backgroundColor: PALETTE.red,
        color: PALETTE.bg,
        fontFamily: 'Anton',
        fontSize: 32,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        boxShadow: `5px 5px 0 ${PALETTE.ink}`,
        border: `3px solid ${PALETTE.ink}`,
      },
    },
      el('div', { style: { display: 'flex', width: 18, height: 18, borderRadius: 9, backgroundColor: PALETTE.bg } }),
      el('div', { style: { display: 'flex' } }, descriptor.tag || 'EN VIVO'),
    ),

    // Headline + subline
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        padding: '0 60px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 180,
          lineHeight: 0.92,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `7px 7px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, descriptor.headline || ''),
      descriptor.subline
        ? el('div', {
            style: {
              marginTop: 40,
              fontFamily: 'Bebas Neue',
              fontSize: 48,
              letterSpacing: '0.1em',
              color: onDark ? 'rgba(240,235,224,0.75)' : PALETTE.inkSoft,
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
        paddingBottom: 80,
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
