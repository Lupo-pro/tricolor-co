// ============================================
// carousel-listicle.js — 3-N item value carousel.
// Slide 1: hook (e.g. "3 RAZONES POR LAS QUE..."). Slides 2..N-1:
// one item each (giant number + title + body). Slide N: CTA.
//
// Slide variants: 'cover' | 'item' | 'cta'
// Item slide expects { value (the number), headline (item title),
// subline (body), bg, accent }.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, arrowIcon, getShadowColor,
} from './brand.js';

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
  const bg = bgColor(slide.bg || 'cream');
  const accent = accentColor(slide.accent || 'red');
  const onDark = pickOnDark(bg);
  const text = onDark ? PALETTE.bg : PALETTE.ink;
  return el('div', {
    style: {
      display: 'flex', flexDirection: 'column',
      width: SIZE, height: SIZE,
      backgroundColor: bg, position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter',
    },
  },
    grainOverlay({ opacity: 0.07 }),
    flagBar({ height: 18 }),
    el('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '40px 56px 0' },
    },
      slide.eyebrow ? starLabel(slide.eyebrow, { color: accent, size: 24 }) : el('div', { style: { display: 'flex' } }, ''),
      dots(total, idx, onDark),
    ),
    el('div', {
      style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '0 56px' },
    },
      el('div', {
        style: {
          fontFamily: 'Anton', fontSize: 150, lineHeight: 0.9,
          letterSpacing: '-0.02em', color: text,
          textTransform: 'uppercase', textShadow: `6px 6px 0 ${getShadowColor(text, accent)}`,
        },
      }, slide.headline || ''),
      slide.subline
        ? el('div', {
            style: {
              marginTop: 28, fontFamily: 'Bebas Neue', fontSize: 38,
              letterSpacing: '0.12em', color: onDark ? 'rgba(240,235,224,0.78)' : PALETTE.inkSoft,
              textTransform: 'uppercase',
            },
          }, slide.subline)
        : null,
    ),
    el('div', { style: { display: 'flex', padding: '0 56px 40px' } }, logoTricolor({ size: 'md', onDark })),
    flagBar({ height: 18, reversed: true }),
  );
}

function renderItem(slide, idx, total) {
  const bg = bgColor(slide.bg || 'cream');
  const accent = accentColor(slide.accent || 'red');
  const onDark = pickOnDark(bg);
  const text = onDark ? PALETTE.bg : PALETTE.ink;
  return el('div', {
    style: {
      display: 'flex', flexDirection: 'column',
      width: SIZE, height: SIZE,
      backgroundColor: bg, position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter',
    },
  },
    grainOverlay({ opacity: 0.07 }),
    flagBar({ height: 18 }),
    el('div', {
      style: { display: 'flex', justifyContent: 'flex-end', padding: '40px 56px 0' },
    }, dots(total, idx, onDark)),
    el('div', {
      style: {
        display: 'flex', flexDirection: 'row', flex: 1,
        alignItems: 'center', padding: '0 56px',
      },
    },
      // Giant number on the left
      el('div', {
        style: {
          display: 'flex', width: '38%', justifyContent: 'center',
        },
      },
        el('div', {
          style: {
            display: 'flex',
            fontFamily: 'Anton',
            fontSize: 380, lineHeight: 0.85,
            letterSpacing: '-0.04em',
            color: accent,
            textShadow: `10px 10px 0 ${getShadowColor(accent, text)}`,
          },
        }, String(slide.value ?? (idx))),
      ),
      // Title + body on the right
      el('div', {
        style: { display: 'flex', flexDirection: 'column', width: '62%' },
      },
        el('div', {
          style: {
            fontFamily: 'Anton', fontSize: 110, lineHeight: 0.95,
            letterSpacing: '-0.02em', color: text,
            textTransform: 'uppercase',
            textShadow: `4px 4px 0 ${getShadowColor(text, accent)}`,
          },
        }, slide.headline || ''),
        slide.subline
          ? el('div', {
              style: {
                marginTop: 22, fontFamily: 'Bebas Neue', fontSize: 32,
                letterSpacing: '0.12em',
                color: onDark ? 'rgba(240,235,224,0.78)' : PALETTE.inkSoft,
                textTransform: 'uppercase',
              },
            }, slide.subline)
          : null,
      ),
    ),
    el('div', {
      style: { display: 'flex', justifyContent: 'flex-start', padding: '0 56px 40px' },
    },
      starLabel('LATRICOLOR.CO', {
        color: onDark ? 'rgba(240,235,224,0.55)' : PALETTE.muted,
        size: 20,
      }),
    ),
    flagBar({ height: 18, reversed: true }),
  );
}

function renderCta(slide, idx, total) {
  const bg = bgColor(slide.bg || 'cream');
  const accent = accentColor(slide.accent || 'red');
  const onDark = pickOnDark(bg);
  const text = onDark ? PALETTE.bg : PALETTE.ink;
  return el('div', {
    style: {
      display: 'flex', flexDirection: 'column',
      width: SIZE, height: SIZE,
      backgroundColor: bg, position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter',
    },
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
          fontFamily: 'Anton', fontSize: 140, lineHeight: 0.9,
          letterSpacing: '-0.02em', color: text,
          textTransform: 'uppercase', textShadow: `5px 5px 0 ${getShadowColor(text, accent)}`,
        },
      }, slide.headline || ''),
      slide.cta
        ? el('div', {
            style: {
              display: 'flex', alignItems: 'center', gap: 18,
              marginTop: 42, alignSelf: 'flex-start',
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

const RENDERERS = { cover: renderCover, item: renderItem, cta: renderCta };

export function renderSlide(slide, idx, total) {
  const variant = slide.variant || 'item';
  const fn = RENDERERS[variant] || renderItem;
  return fn(slide, idx, total);
}
