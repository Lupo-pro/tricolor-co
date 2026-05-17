// ============================================
// carousel-guide.js — numbered how-to. Each middle slide shows a
// big step number (01, 02, 03, ...) plus the action title.
//
// Slide variants: 'cover', 'step' (number + headline), 'cta'.
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, arrowIcon,
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
          textTransform: 'uppercase', textShadow: `6px 6px 0 ${accent}`,
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

function renderStep(slide, idx, total) {
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
      // Huge step number
      el('div', {
        style: {
          display: 'flex',
          fontFamily: 'Anton', fontSize: 280, lineHeight: 0.85,
          letterSpacing: '-0.04em', color: accent,
          textShadow: `8px 8px 0 ${onDark ? PALETTE.bg : PALETTE.ink}`,
        },
      }, slide.step || '01'),
      el('div', {
        style: {
          marginTop: 30, fontFamily: 'Anton', fontSize: 110, lineHeight: 0.9,
          letterSpacing: '-0.02em', color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
        },
      }, slide.headline || ''),
      slide.subline
        ? el('div', {
            style: {
              marginTop: 18, fontFamily: 'Bebas Neue', fontSize: 36,
              letterSpacing: '0.12em', color: onDark ? 'rgba(240,235,224,0.7)' : PALETTE.inkSoft,
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
          fontFamily: 'Anton', fontSize: 130, lineHeight: 0.9,
          letterSpacing: '-0.02em', color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase', textShadow: `5px 5px 0 ${accent}`,
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

const RENDERERS = { cover: renderCover, step: renderStep, cta: renderCta };

export function renderSlide(slide, idx, total) {
  const variant = slide.variant || 'step';
  const fn = RENDERERS[variant] || renderStep;
  return fn(slide, idx, total);
}
