// ============================================
// post-portrait.js — Instagram portrait post (1080×1350).
// Same primitives as post.js, taller canvas, slightly larger type.
// ============================================

import satori from 'satori';
import sharp from 'sharp';
import {
  PALETTE, loadFonts, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel,
} from './brand.js';

const W = 1080;
const H = 1350;

function pickOnDark(bg) {
  if (bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow) return false;
  return true;
}

export async function renderPostPortrait(descriptor) {
  const fonts = await loadFonts();
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = pickOnDark(bg);

  const node = el('div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: W, height: H,
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
        alignItems: 'flex-start',
        paddingTop: 64, paddingLeft: 72, paddingRight: 72,
      },
    },
      descriptor.eyebrow ? starLabel(descriptor.eyebrow, { color: accent, size: 32 }) : null,
    ),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        padding: '0 72px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 180,
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `7px 7px 0 ${accent}`,
        },
      }, descriptor.headline || ''),
      descriptor.subline
        ? el('div', {
            style: {
              marginTop: 42,
              fontFamily: 'Bebas Neue',
              fontSize: 48,
              letterSpacing: '0.1em',
              color: onDark ? 'rgba(240,235,224,0.78)' : PALETTE.inkSoft,
              textTransform: 'uppercase',
            },
          }, descriptor.subline)
        : null,
    ),

    el('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '0 72px 64px',
      },
    },
      logoTricolor({ size: 'lg', onDark }),
      descriptor.footer
        ? el('div', {
            style: {
              fontFamily: 'Bebas Neue',
              fontSize: 24,
              letterSpacing: '0.18em',
              color: onDark ? 'rgba(240,235,224,0.6)' : PALETTE.muted,
              textTransform: 'uppercase',
              textAlign: 'right',
            },
          }, descriptor.footer)
        : null,
    ),

    flagBar({ height: 20, reversed: true }),
  );

  const svg = await satori(node, { width: W, height: H, fonts });
  return await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export const POST_PORTRAIT_WIDTH = W;
export const POST_PORTRAIT_HEIGHT = H;
