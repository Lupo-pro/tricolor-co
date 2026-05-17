// ============================================
// post.js — Instagram square feed post (1080×1080).
// Use cases (per spec):
//   - Hero drop post
//   - Single edition presentation
//   - Bundle "El Once Inicial" promo
//   - Manifesto quote
//   - Match day announcement
//   - Customer testimonial (with photo)
// ============================================

import satori from 'satori';
import sharp from 'sharp';
import {
  PALETTE, loadFonts, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel,
} from './brand.js';

const SIZE = 1080;

function pickOnDark(bg) {
  if (bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow) return false;
  return true;
}

/**
 * Generic square post.
 *   { variant, headline, subline, bg, accent, eyebrow, footer }
 * variant ∈ 'hero' | 'quote' | 'announce'
 */
export async function renderPost(descriptor) {
  const fonts = await loadFonts();
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = pickOnDark(bg);

  const node = el('div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: SIZE, height: SIZE,
        backgroundColor: bg,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter',
      },
    },
    grainOverlay({ opacity: 0.07 }),
    flagBar({ height: 18 }),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingTop: 56, paddingLeft: 64, paddingRight: 64,
      },
    },
      descriptor.eyebrow
        ? starLabel(descriptor.eyebrow, { color: accent, size: 28 })
        : null,
    ),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        padding: '0 64px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 156,
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
              marginTop: 36,
              fontFamily: 'Bebas Neue',
              fontSize: 44,
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
        padding: '0 64px 56px',
      },
    },
      logoTricolor({ size: 'md', onDark }),
      descriptor.footer
        ? el('div', {
            style: {
              fontFamily: 'Bebas Neue',
              fontSize: 22,
              letterSpacing: '0.18em',
              color: onDark ? 'rgba(240,235,224,0.6)' : PALETTE.muted,
              textTransform: 'uppercase',
              textAlign: 'right',
            },
          }, descriptor.footer)
        : null,
    ),

    flagBar({ height: 18, reversed: true }),
  );

  const svg = await satori(node, { width: SIZE, height: SIZE, fonts });
  return await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export const POST_SIZE = SIZE;
