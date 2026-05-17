// ============================================
// story.js — Instagram Story dispatcher (1080×1920).
//
// Picks a layout by `descriptor.layout` first; if absent, falls back
// to the legacy `descriptor.role` (hook/tease/reveal/urgency/cta) so
// existing sequences keep working.
//
// Layouts (descriptor.layout):
//   hook-center, hook-split, sticker-placeholder, quote-center,
//   numbers, question, bts, match-score
//
// Roles (descriptor.role, legacy):
//   hook, tease, reveal, urgency, cta
// ============================================

import satori from 'satori';
import sharp from 'sharp';
import {
  PALETTE, loadFonts, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel, getShadowColor,
} from './brand.js';

import { render as renderHookCenter }         from './story-hook-center.js';
import { render as renderHookSplit }          from './story-hook-split.js';
import { render as renderStickerPlaceholder } from './story-sticker-placeholder.js';
import { render as renderQuoteCenter }        from './story-quote-center.js';
import { render as renderNumbers }            from './story-numbers.js';
import { render as renderQuestion }           from './story-question.js';
import { render as renderBts }                from './story-bts.js';
import { render as renderMatchScore }         from './story-match-score.js';

const WIDTH = 1080;
const HEIGHT = 1920;

const LAYOUTS = {
  'hook-center':         renderHookCenter,
  'hook-split':          renderHookSplit,
  'sticker-placeholder': renderStickerPlaceholder,
  'quote-center':        renderQuoteCenter,
  'numbers':             renderNumbers,
  'question':            renderQuestion,
  'bts':                 renderBts,
  'match-score':         renderMatchScore,
};

function pickInkOnBg(bg) {
  if (bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow) return false;
  return true;
}

// ───────────────────────────────────────────
// Legacy role-based renderers (still used by sequences that pass
// `role: 'hook' | 'tease' | 'reveal' | 'urgency' | 'cta'`).
// ───────────────────────────────────────────

function renderTease({ headline, subline, bg, accent }) {
  const onDark = pickInkOnBg(bg);
  return el('div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: WIDTH, height: HEIGHT,
        backgroundColor: bg,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter',
      },
    },
    grainOverlay({ opacity: 0.08 }),
    flagBar({ height: 16 }),
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        padding: '80px 80px 40px',
        textAlign: 'center',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 180,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `8px 8px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, headline),
      el('div', {
        style: {
          marginTop: 50,
          fontFamily: 'Bebas Neue',
          fontSize: 44,
          letterSpacing: '0.13em',
          color: onDark ? 'rgba(240,235,224,0.65)' : PALETTE.inkMid,
          textTransform: 'uppercase',
        },
      }, subline),
    ),
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 100,
      },
    },
      logoTricolor({ size: 'lg', onDark }),
    ),
  );
}

function renderReveal({ headline, subline, bg, accent }) {
  const onDark = pickInkOnBg(bg);
  return el('div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: WIDTH, height: HEIGHT,
        backgroundColor: bg,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter',
      },
    },
    grainOverlay({ opacity: 0.06 }),
    flagBar({ height: 20 }),
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 80,
      },
    },
      starLabel('Edición Mundial', { color: onDark ? PALETTE.yellow : PALETTE.red, size: 36 }),
    ),
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        padding: '60px 60px 40px',
        textAlign: 'center',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 170,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `8px 8px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, headline),
      el('div', {
        style: {
          marginTop: 50,
          fontFamily: 'Anton',
          fontSize: 80,
          letterSpacing: '0.04em',
          color: onDark ? PALETTE.yellow : PALETTE.red,
        },
      }, subline),
    ),
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 100,
      },
    },
      logoTricolor({ size: 'lg', onDark }),
    ),
  );
}

function renderUrgency({ headline, subline, bg, accent }) {
  const onDark = pickInkOnBg(bg);
  return el('div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: WIDTH, height: HEIGHT,
        backgroundColor: bg,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter',
      },
    },
    grainOverlay({ opacity: 0.08 }),
    flagBar({ height: 24 }),
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        padding: '80px 60px 40px',
        textAlign: 'center',
      },
    },
      el('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          padding: '14px 28px',
          backgroundColor: onDark ? PALETTE.yellow : PALETTE.ink,
          color: onDark ? PALETTE.ink : PALETTE.yellow,
          border: `4px solid ${onDark ? PALETTE.ink : PALETTE.bg}`,
          fontFamily: 'Anton',
          fontSize: 52,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginBottom: 40,
        },
      }, 'ATENCIÓN'),
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 180,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `9px 9px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, headline),
      el('div', {
        style: {
          marginTop: 60,
          fontFamily: 'Bebas Neue',
          fontSize: 56,
          letterSpacing: '0.12em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
        },
      }, subline),
    ),
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 100,
      },
    },
      logoTricolor({ size: 'lg', onDark }),
    ),
    flagBar({ height: 24, reversed: true }),
  );
}

function renderCta({ headline, subline, bg, accent }) {
  const onDark = pickInkOnBg(bg);
  return el('div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: WIDTH, height: HEIGHT,
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
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        padding: '80px 60px 40px',
        textAlign: 'center',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 170,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `8px 8px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, headline),
      el('div', {
        style: {
          marginTop: 60,
          padding: '24px 48px',
          backgroundColor: PALETTE.yellow,
          color: PALETTE.ink,
          border: `4px solid ${PALETTE.ink}`,
          boxShadow: `8px 8px 0 ${PALETTE.red}`,
          fontFamily: 'Anton',
          fontSize: 56,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        },
      }, subline),
    ),
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 100,
      },
    },
      logoTricolor({ size: 'lg', onDark }),
    ),
    flagBar({ height: 20, reversed: true }),
  );
}

const ROLE_RENDERERS = {
  hook: (d) => renderHookCenter(d, { width: WIDTH, height: HEIGHT }),
  tease: renderTease,
  reveal: renderReveal,
  urgency: renderUrgency,
  cta: renderCta,
};

/**
 * Renders a single story to a PNG Buffer. Dispatches by `layout` first,
 * then falls back to `role` for legacy sequence descriptors.
 */
export async function renderStory(descriptor) {
  const fonts = await loadFonts();

  let node;
  if (descriptor.layout && LAYOUTS[descriptor.layout]) {
    node = LAYOUTS[descriptor.layout](descriptor, { width: WIDTH, height: HEIGHT });
  } else {
    const role = descriptor.role || 'reveal';
    const renderer = ROLE_RENDERERS[role] || renderReveal;
    node = renderer({
      headline: descriptor.headline || '',
      subline: descriptor.subline || '',
      bg: bgColor(descriptor.bg || 'cream'),
      accent: accentColor(descriptor.accent || 'red'),
      image: descriptor.image,
      sticker: descriptor.sticker,
    });
  }

  const svg = await satori(node, { width: WIDTH, height: HEIGHT, fonts });
  return await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export const STORY_WIDTH = WIDTH;
export const STORY_HEIGHT = HEIGHT;
export const STORY_LAYOUTS = Object.keys(LAYOUTS);
