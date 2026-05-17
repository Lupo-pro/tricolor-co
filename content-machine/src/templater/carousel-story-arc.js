// ============================================
// carousel-story-arc.js — 5-slide narrative arc.
//   1 hook       "TE VOY A CONTAR..."
//   2 setup      "MI ABUELA VIO EL 90..."
//   3 conflict   "PERO ESTA VEZ..."
//   4 resolution "POR ESO CREÉ..."
//   5 cta        "ÚNETE A LA TRIBUNA"
//
// Slide variants: 'hook' | 'setup' | 'conflict' | 'resolution' | 'cta'
// (or fall back to the slide.beat field, then idx).
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

// Beat → eyebrow label so the operator knows where they are in the arc.
const BEAT_LABEL = {
  hook:        'EMPIEZO',
  setup:       'CONTEXTO',
  conflict:    'PERO',
  resolution:  'POR ESO',
  cta:         'AHORA',
};

function narrativeSlide(slide, idx, total, beat) {
  const bg = bgColor(slide.bg || 'cream');
  const accent = accentColor(slide.accent || 'red');
  const onDark = pickOnDark(bg);
  const text = onDark ? PALETTE.bg : PALETTE.ink;
  const isCta = beat === 'cta';

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
      style: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '40px 56px 0',
      },
    },
      starLabel(slide.eyebrow || BEAT_LABEL[beat] || '·', { color: accent, size: 24 }),
      dots(total, idx, onDark),
    ),

    el('div', {
      style: {
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', flex: 1,
        padding: '0 64px',
      },
    },
      // Optional opening quote glyph on the hook slide.
      beat === 'hook'
        ? el('div', {
            style: {
              display: 'flex',
              fontFamily: 'Archivo Black', fontSize: 200, lineHeight: 0.7,
              color: accent, opacity: 0.85, marginBottom: -20,
            },
          }, '"')
        : null,
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: isCta ? 150 : 140, lineHeight: 0.92,
          letterSpacing: '-0.02em',
          color: text,
          textTransform: 'uppercase',
          textShadow: `6px 6px 0 ${getShadowColor(text, accent)}`,
        },
      }, slide.headline || ''),
      slide.subline
        ? el('div', {
            style: {
              marginTop: 30, fontFamily: 'Bebas Neue', fontSize: 38,
              letterSpacing: '0.12em',
              color: onDark ? 'rgba(240,235,224,0.78)' : PALETTE.inkSoft,
              textTransform: 'uppercase',
            },
          }, slide.subline)
        : null,
      isCta && slide.cta
        ? el('div', {
            style: {
              display: 'flex', alignItems: 'center', gap: 18,
              marginTop: 44, alignSelf: 'flex-start',
              padding: '20px 36px',
              backgroundColor: PALETTE.yellow, color: PALETTE.ink,
              border: `4px solid ${PALETTE.ink}`,
              boxShadow: `6px 6px 0 ${PALETTE.red}`,
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

const BEATS = ['hook', 'setup', 'conflict', 'resolution', 'cta'];

export function renderSlide(slide, idx, total) {
  // Pick the beat: explicit slide.variant > slide.beat > index map.
  const beat = slide.variant || slide.beat || BEATS[Math.min(idx, BEATS.length - 1)];
  return narrativeSlide(slide, idx, total, beat);
}
