// ============================================
// post-photo-placeholder.js — top 65% reserved for a product photo,
// bottom 35% typo block. Use until Nay's photoshoots ship.
// Replace the photoFrame with descriptor.photoUrl in the future.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, photoFrame, getShadowColor,} from './brand.js';

export function render(descriptor, { size = 1080 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = isDark(bg);

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
    grainOverlay({ opacity: 0.06 }),
    flagBar({ height: 16 }),

    // Photo zone — 65% of the height. Either a real <img> if photoUrl
    // is provided, or a dashed placeholder otherwise.
    el('div', {
      style: {
        display: 'flex',
        flex: 1,
        padding: '32px 48px 16px',
      },
    },
      descriptor.photoUrl
        ? el('img', {
            src: descriptor.photoUrl,
            style: { width: '100%', height: '100%', objectFit: 'cover' },
          })
        : photoFrame({
            label: descriptor.photoLabel || 'PRODUCT PHOTO',
            borderColor: onDark ? PALETTE.bg : PALETTE.ink,
          }),
    ),

    // Bottom typo block
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 48px 40px',
      },
    },
      descriptor.eyebrow
        ? el('div', {
            style: { display: 'flex', marginBottom: 18 },
          }, starLabel(descriptor.eyebrow, { color: accent, size: 24 }))
        : null,
      el('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        },
      },
        el('div', {
          style: { display: 'flex', flexDirection: 'column', flex: 1 },
        },
          el('div', {
            style: {
              fontFamily: 'Anton',
              fontSize: 96,
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              color: onDark ? PALETTE.bg : PALETTE.ink,
              textTransform: 'uppercase',
              textShadow: `4px 4px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
            },
          }, descriptor.headline || ''),
          descriptor.subline
            ? el('div', {
                style: {
                  marginTop: 14,
                  fontFamily: 'Bebas Neue',
                  fontSize: 30,
                  letterSpacing: '0.12em',
                  color: onDark ? 'rgba(240,235,224,0.7)' : PALETTE.muted,
                  textTransform: 'uppercase',
                },
              }, descriptor.subline)
            : null,
        ),
        logoTricolor({ size: 'sm', onDark }),
      ),
    ),

    flagBar({ height: 16, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
