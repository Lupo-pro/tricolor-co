// ============================================
// carousel-educational.js — info carousel. Each slide is one fact.
// Slide variants: 'cover', 'stat' (big number + label), 'cta'.
//
// descriptor: {
//   slides: [
//     { variant: 'cover',  headline, subline, bg, accent },
//     { variant: 'stat',   value, label, subline, bg, accent },
//     { variant: 'stat',   value, label, subline, bg, accent },
//     ...
//     { variant: 'cta',    headline, subline, cta, bg, accent },
//   ]
// }
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, statNumber,
  arrowIcon, getShadowColor,} from './brand.js';

const SIZE = 1080;

function pickOnDark(bg) {
  if (bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow) return false;
  return true;
}

function paginationDots(total, current, onDark) {
  return el('div', { style: { display: 'flex' } },
    ...Array.from({ length: total }, (_, i) =>
      el('div', {
        style: {
          display: 'flex',
          width: 14, height: 14,
          marginLeft: 8,
          borderRadius: 7,
          backgroundColor: i === current
            ? PALETTE.red
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
      paginationDots(total, idx, onDark),
    ),
    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', flex: 1, padding: '0 56px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton', fontSize: 140, lineHeight: 0.9,
          letterSpacing: '-0.02em', color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase', textShadow: `5px 5px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
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
    el('div', {
      style: { display: 'flex', padding: '0 56px 40px' },
    },
      logoTricolor({ size: 'md', onDark }),
    ),
    flagBar({ height: 18, reversed: true }),
  );
}

function renderStat(slide, idx, total) {
  const bg = bgColor(slide.bg || 'cream');
  const accent = accentColor(slide.accent || 'red');
  const onDark = pickOnDark(bg);
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
    },
      paginationDots(total, idx, onDark),
    ),
    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        flex: 1, padding: '0 48px',
      },
    },
      statNumber({
        value: slide.value, label: slide.label || '',
        color: onDark ? PALETTE.bg : PALETTE.ink,
        accent, fontSize: 360, labelSize: 44,
      }),
      slide.subline
        ? el('div', {
            style: {
              marginTop: 36, fontFamily: 'Bebas Neue', fontSize: 32,
              letterSpacing: '0.15em', color: onDark ? 'rgba(240,235,224,0.7)' : PALETTE.muted,
              textTransform: 'uppercase', textAlign: 'center',
            },
          }, slide.subline)
        : null,
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
    },
      paginationDots(total, idx, onDark),
    ),
    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', flex: 1, padding: '0 56px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton', fontSize: 130, lineHeight: 0.9,
          letterSpacing: '-0.02em', color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase', textShadow: `5px 5px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, slide.headline || ''),
      slide.subline
        ? el('div', {
            style: {
              marginTop: 24, fontFamily: 'Bebas Neue', fontSize: 36,
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
    el('div', {
      style: { display: 'flex', padding: '0 56px 40px' },
    },
      logoTricolor({ size: 'md', onDark }),
    ),
    flagBar({ height: 18, reversed: true }),
  );
}

const RENDERERS = { cover: renderCover, stat: renderStat, cta: renderCta };

export function renderSlide(slide, idx, total) {
  const variant = slide.variant || 'stat';
  const fn = RENDERERS[variant] || renderStat;
  return fn(slide, idx, total);
}
