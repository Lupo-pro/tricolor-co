// ============================================
// carousel-comparison.js — antes/después across slides. Each middle
// slide shows a split pair (left=before / right=after).
//
// Slide variants: 'cover', 'split' (left/right pair), 'cta'.
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
  const bg = bgColor(slide.bg || 'cream');
  const accent = accentColor(slide.accent || 'red');
  const onDark = pickOnDark(bg);
  return el('div', {
    style: { display: 'flex', flexDirection: 'column', width: SIZE, height: SIZE, backgroundColor: bg, position: 'relative', overflow: 'hidden', fontFamily: 'Inter' },
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
          letterSpacing: '-0.02em', color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase', textShadow: `5px 5px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, slide.headline || ''),
      slide.subline
        ? el('div', {
            style: {
              marginTop: 24, fontFamily: 'Bebas Neue', fontSize: 36,
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

function panel(side, alignRight = false) {
  const bg = bgColor(side.bg || 'cream');
  const onDark = pickOnDark(bg);
  const accent = onDark ? PALETTE.yellow : PALETTE.red;
  return el('div', {
    style: {
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: alignRight ? 'flex-end' : 'flex-start',
      backgroundColor: bg, flex: 1, padding: '60px 40px',
      position: 'relative',
    },
  },
    grainOverlay({ opacity: 0.06 }),
    el('div', {
      style: {
        display: 'flex', fontFamily: 'Bebas Neue', fontSize: 32,
        letterSpacing: '0.3em', color: accent, textTransform: 'uppercase',
      },
    }, side.label || ''),
    el('div', {
      style: {
        display: 'flex', fontFamily: 'Anton', fontSize: 110, lineHeight: 0.88,
        letterSpacing: '-0.02em', color: onDark ? PALETTE.bg : PALETTE.ink,
        textTransform: 'uppercase', textShadow: `4px 4px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        textAlign: alignRight ? 'right' : 'left',
      },
    }, side.headline || ''),
  );
}

function renderSplit(slide, idx, total) {
  return el('div', {
    style: { display: 'flex', flexDirection: 'column', width: SIZE, height: SIZE, position: 'relative', overflow: 'hidden', fontFamily: 'Inter', backgroundColor: PALETTE.ink },
  },
    flagBar({ height: 16 }),
    el('div', {
      style: { display: 'flex', justifyContent: 'flex-end', padding: '24px 56px 0', backgroundColor: PALETTE.ink },
    }, dots(total, idx, true)),
    el('div', {
      style: { display: 'flex', flexDirection: 'row', flex: 1 },
    },
      panel(slide.left || { label: 'ANTES', headline: '?', bg: 'cream' }),
      el('div', {
        style: { display: 'flex', flexDirection: 'column', width: 14 },
      },
        el('div', { style: { display: 'flex', flex: 1, backgroundColor: PALETTE.yellow } }),
        el('div', { style: { display: 'flex', flex: 1, backgroundColor: PALETTE.blue } }),
        el('div', { style: { display: 'flex', flex: 1, backgroundColor: PALETTE.red } }),
      ),
      panel(slide.right || { label: 'AHORA', headline: '?', bg: 'red' }, true),
    ),
    el('div', {
      style: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 48px', backgroundColor: PALETTE.ink,
      },
    },
      logoTricolor({ size: 'sm', onDark: true }),
      starLabel('LATRICOLOR.CO', { color: 'rgba(240,235,224,0.55)', size: 18 }),
    ),
    flagBar({ height: 16, reversed: true }),
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
          fontFamily: 'Anton', fontSize: 130, lineHeight: 0.9,
          letterSpacing: '-0.02em', color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase', textShadow: `5px 5px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, slide.headline || ''),
      slide.cta
        ? el('div', {
            style: {
              display: 'flex', alignItems: 'center', gap: 18,
              marginTop: 40, alignSelf: 'flex-start',
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

const RENDERERS = { cover: renderCover, split: renderSplit, cta: renderCta };

export function renderSlide(slide, idx, total) {
  const variant = slide.variant || 'split';
  const fn = RENDERERS[variant] || renderSplit;
  return fn(slide, idx, total);
}
