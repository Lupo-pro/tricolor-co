// ============================================
// carousel.js — N×1080×1080 carousel slides.
//
// Usage:
//   const buffers = await renderCarousel({ slides: [...] });
// Each slide descriptor:
//   { variant, headline, subline, footer, bg, accent }
//   variant ∈ 'cover' | 'middle' | 'cta'
//
// Slide 0 should usually be a 'cover' (logo prominent, hook headline).
// Middle slides 'middle' (minimal branding, focus on content).
// Last slide 'cta' (call to action).
// ============================================

import satori from 'satori';
import sharp from 'sharp';
import {
  PALETTE, loadFonts, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, arrowIcon,
} from './brand.js';

const SIZE = 1080;

function pickOnDark(bg) {
  if (bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow) return false;
  return true;
}

function nodeForSlide(slide, slideIndex, totalSlides) {
  const bg = bgColor(slide.bg || 'cream');
  const accent = accentColor(slide.accent || 'red');
  const onDark = pickOnDark(bg);
  const variant = slide.variant || (slideIndex === 0 ? 'cover' : slideIndex === totalSlides - 1 ? 'cta' : 'middle');

  // Pagination dot row (top right) — gives the carousel a clear "N of M"
  // signal at a glance.
  const dots = Array.from({ length: totalSlides }, (_, i) => {
    const active = i === slideIndex;
    return el('div', {
      style: {
        display: 'flex',
        width: 14, height: 14,
        marginLeft: 8,
        borderRadius: 7,
        backgroundColor: active ? PALETTE.red : (onDark ? 'rgba(240,235,224,0.3)' : 'rgba(10,10,10,0.18)'),
      },
    });
  });

  const isCover = variant === 'cover';
  const isCta = variant === 'cta';

  return el('div',
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
    flagBar({ height: 16 }),

    // Top row: eyebrow (left) + pagination dots (right)
    el('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '40px 56px 0',
      },
    },
      slide.eyebrow
        ? starLabel(slide.eyebrow, { color: accent, size: 24 })
        : el('div', { style: { display: 'flex' } }, ''),
      el('div', { style: { display: 'flex' } }, ...dots),
    ),

    // Headline + subline center stack
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        padding: '0 56px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: isCover ? 140 : 110,
          lineHeight: 0.92,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `5px 5px 0 ${accent}`,
        },
      }, slide.headline || ''),
      slide.subline
        ? el('div', {
            style: {
              marginTop: 28,
              fontFamily: 'Bebas Neue',
              fontSize: 36,
              letterSpacing: '0.1em',
              color: onDark ? 'rgba(240,235,224,0.78)' : PALETTE.inkSoft,
              textTransform: 'uppercase',
            },
          }, slide.subline)
        : null,
      isCta && slide.cta
        ? el('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginTop: 56,
              alignSelf: 'flex-start',
              padding: '20px 36px',
              backgroundColor: PALETTE.yellow,
              color: PALETTE.ink,
              border: `4px solid ${PALETTE.ink}`,
              boxShadow: `6px 6px 0 ${PALETTE.red}`,
              fontFamily: 'Anton',
              fontSize: 40,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            },
          },
            el('div', { style: { display: 'flex' } }, slide.cta),
            arrowIcon({ size: 40, color: PALETTE.ink }),
          )
        : null,
    ),

    // Bottom: logo on cover + cta slides, signature on middle slides
    el('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '0 56px 40px',
      },
    },
      (isCover || isCta)
        ? logoTricolor({ size: 'md', onDark })
        : starLabel('LATRICOLOR.CO', {
            color: onDark ? 'rgba(240,235,224,0.6)' : PALETTE.muted,
            size: 20,
          }),
      slide.footer
        ? el('div', {
            style: {
              fontFamily: 'Bebas Neue',
              fontSize: 20,
              letterSpacing: '0.18em',
              color: onDark ? 'rgba(240,235,224,0.5)' : PALETTE.muted,
              textTransform: 'uppercase',
              textAlign: 'right',
            },
          }, slide.footer)
        : null,
    ),

    flagBar({ height: 16, reversed: true }),
  );
}

/**
 * Render every slide of a carousel.
 * @param {{slides: Array}} descriptor
 * @returns {Promise<Buffer[]>}
 */
export async function renderCarousel(descriptor) {
  const fonts = await loadFonts();
  const slides = Array.isArray(descriptor.slides) ? descriptor.slides : [];
  const buffers = [];
  for (let i = 0; i < slides.length; i++) {
    const node = nodeForSlide(slides[i], i, slides.length);
    const svg = await satori(node, { width: SIZE, height: SIZE, fonts });
    const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
    buffers.push(buf);
  }
  return buffers;
}

export const CAROUSEL_SLIDE_SIZE = SIZE;
