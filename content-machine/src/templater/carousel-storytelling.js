// ============================================
// carousel-storytelling.js — narrative arc. No numbers, just a
// sequence of typo slides building tension toward a final CTA.
//
// Slide variants: 'cover', 'narrative' (color block + headline), 'cta'.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, arrowIcon, getShadowColor,} from './brand.js';

const SIZE = 1080;

function pickOnDark(bg) {
  if (bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow) return false;
  return true;
}

function dots(total, current, onDark) {
  return el('div', { style: { display: 'flex' } },
    ...Array.from({ length: total }, (_, i) =>
      el('div', {
        style: {
          display: 'flex', width: 14, height: 14, marginLeft: 8, borderRadius: 7,
          backgroundColor: i === current ? PALETTE.red
            : (onDark ? 'rgba(240,235,224,0.3)' : 'rgba(10,10,10,0.18)'),
        },
      })
    ),
  );
}

function renderCover(slide, idx, total) {
  const bg = bgColor(slide.bg || 'ink');
  const accent = accentColor(slide.accent || 'yellow');
  const onDark = pickOnDark(bg);
  return el('div', {
    style: { display: 'flex', flexDirection: 'column', width: SIZE, height: SIZE, backgroundColor: bg, position: 'relative', overflow: 'hidden', fontFamily: 'Inter' },
  },
    grainOverlay({ opacity: 0.08 }),
    flagBar({ height: 18 }),
    // Giant pulled-quote feel
    el('div', {
      style: { display: 'flex', justifyContent: 'flex-end', padding: '40px 56px 0' },
    }, dots(total, idx, onDark)),
    el('div', {
      style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '0 80px' },
    },
      el('div', {
        style: {
          display: 'flex',
          fontFamily: 'Archivo Black', fontSize: 220, lineHeight: 0.7,
          color: accent, opacity: 0.95,
        },
      }, '"'),
      el('div', {
        style: {
          marginTop: 10, fontFamily: 'Anton', fontSize: 160, lineHeight: 0.92,
          letterSpacing: '-0.02em', color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase', textShadow: `6px 6px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, slide.headline || ''),
      slide.subline
        ? el('div', {
            style: {
              marginTop: 28, fontFamily: 'Bebas Neue', fontSize: 42,
              letterSpacing: '0.18em', color: onDark ? 'rgba(240,235,224,0.85)' : PALETTE.inkSoft,
              textTransform: 'uppercase',
            },
          }, slide.subline)
        : null,
    ),
    el('div', { style: { display: 'flex', padding: '0 56px 40px' } }, logoTricolor({ size: 'md', onDark })),
    flagBar({ height: 18, reversed: true }),
  );
}

function renderNarrative(slide, idx, total) {
  const bg = bgColor(slide.bg || 'yellow');
  const accent = accentColor(slide.accent || 'red');
  const onDark = pickOnDark(bg);
  return el('div', {
    style: { display: 'flex', flexDirection: 'column', width: SIZE, height: SIZE, backgroundColor: bg, position: 'relative', overflow: 'hidden', fontFamily: 'Inter' },
  },
    grainOverlay({ opacity: 0.07 }),
    flagBar({ height: 18 }),
    el('div', {
      style: { display: 'flex', justifyContent: 'flex-end', padding: '40px 56px 0' },
    }, dots(total, idx, onDark)),
    el('div', {
      style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '0 80px' },
    },
      el('div', {
        style: {
          fontFamily: 'Anton', fontSize: 200, lineHeight: 0.92,
          letterSpacing: '-0.02em', color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase', textShadow: `7px 7px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, slide.headline || ''),
      slide.subline
        ? el('div', {
            style: {
              marginTop: 36, fontFamily: 'Bebas Neue', fontSize: 50,
              letterSpacing: '0.12em', color: onDark ? 'rgba(240,235,224,0.78)' : PALETTE.inkSoft,
              textTransform: 'uppercase',
            },
          }, slide.subline)
        : null,
    ),
    el('div', {
      style: { display: 'flex', justifyContent: 'flex-start', padding: '0 56px 40px' },
    },
      starLabel('LATRICOLOR.CO', { color: onDark ? 'rgba(240,235,224,0.55)' : PALETTE.muted, size: 20 }),
    ),
    flagBar({ height: 18, reversed: true }),
  );
}

function renderCta(slide, idx, total) {
  const bg = bgColor(slide.bg || 'cream');
  const accent = accentColor(slide.accent || 'red');
  const onDark = pickOnDark(bg);
  return el('div', {
    style: { display: 'flex', flexDirection: 'column', width: SIZE, height: SIZE, backgroundColor: bg, position: 'relative', overflow: 'hidden', fontFamily: 'Inter' },
  },
    grainOverlay({ opacity: 0.07 }),
    flagBar({ height: 18 }),
    el('div', {
      style: { display: 'flex', justifyContent: 'flex-end', padding: '40px 56px 0' },
    }, dots(total, idx, onDark)),
    el('div', {
      style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '0 56px' },
    },
      el('div', {
        style: {
          fontFamily: 'Anton', fontSize: 150, lineHeight: 0.9,
          letterSpacing: '-0.02em', color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase', textShadow: `5px 5px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, slide.headline || ''),
      slide.subline
        ? el('div', {
            style: {
              marginTop: 24, fontFamily: 'Bebas Neue', fontSize: 38,
              letterSpacing: '0.1em', color: onDark ? 'rgba(240,235,224,0.78)' : PALETTE.inkSoft,
              textTransform: 'uppercase',
            },
          }, slide.subline)
        : null,
      slide.cta
        ? el('div', {
            style: {
              display: 'flex', alignItems: 'center', gap: 18,
              marginTop: 48, alignSelf: 'flex-start',
              padding: '20px 36px',
              backgroundColor: PALETTE.yellow, color: PALETTE.ink,
              border: `4px solid ${PALETTE.ink}`, boxShadow: `6px 6px 0 ${PALETTE.red}`,
              fontFamily: 'Anton', fontSize: 40,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            },
          },
            el('div', { style: { display: 'flex' } }, slide.cta),
            arrowIcon({ size: 40, color: PALETTE.ink }),
          )
        : null,
    ),
    el('div', { style: { display: 'flex', padding: '0 56px 40px' } }, logoTricolor({ size: 'md', onDark })),
    flagBar({ height: 18, reversed: true }),
  );
}

const RENDERERS = { cover: renderCover, narrative: renderNarrative, cta: renderCta };

export function renderSlide(slide, idx, total) {
  const variant = slide.variant || 'narrative';
  const fn = RENDERERS[variant] || renderNarrative;
  return fn(slide, idx, total);
}
