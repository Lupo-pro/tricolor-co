// ============================================
// story.js — Instagram Story format (1080×1920).
// Each call returns a PNG buffer for one story.
//
// Story descriptor shape (per the sequence spec):
//   { step, role, headline, subline, bg, accent, image?, sticker? }
//   role: 'hook' | 'tease' | 'reveal' | 'urgency' | 'cta' | 'poll' | ...
//
// The role drives layout; the headline/subline/bg/accent fill it.
// ============================================

import satori from 'satori';
import sharp from 'sharp';
import { PALETTE, loadFonts, el, flagBar, grainOverlay, logoTricolor, bgColor, accentColor, starLabel } from './brand.js';

const WIDTH = 1080;
const HEIGHT = 1920;

function pickInkOnBg(bg) {
  // Choose readable contour color based on the bg lightness.
  if (bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow) return false; // light bg → onDark = false
  return true; // dark bg → onDark = true
}

function renderHook({ headline, subline, bg, accent }) {
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
    // Top flag bar
    flagBar({ height: 24 }),
    // Tribune live tag
    el('div', {
      style: {
        display: 'flex',
        alignSelf: 'flex-start',
        marginTop: 60, marginLeft: 60,
        padding: '14px 24px',
        backgroundColor: PALETTE.red,
        color: PALETTE.bg,
        fontFamily: 'Anton',
        fontSize: 32,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        boxShadow: `5px 5px 0 ${PALETTE.ink}`,
        border: `3px solid ${PALETTE.ink}`,
      },
    }, '● EN VIVO'),
    // Headline
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        padding: '0 60px',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 180,
          lineHeight: 0.92,
          letterSpacing: '-0.02em',
          color: PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `7px 7px 0 ${accent}`,
        },
      }, headline),
      el('div', {
        style: {
          marginTop: 40,
          fontFamily: 'Bebas Neue',
          fontSize: 48,
          letterSpacing: '0.1em',
          color: PALETTE.inkSoft,
          textTransform: 'uppercase',
        },
      }, subline),
    ),
    // Bottom: logo + flag bar
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 80,
      },
    },
      logoTricolor({ size: 'sm', onDark: pickInkOnBg(bg) }),
    ),
    flagBar({ height: 24, reversed: true }),
  );
}

function renderTease({ headline, subline, bg, accent }) {
  // Mostly dark, mysterious — keep type tight.
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
        padding: '0 80px',
        textAlign: 'center',
      },
    },
      starLabel('Adivina cuál...', { color: PALETTE.yellow, size: 32 }),
      el('div', {
        style: {
          marginTop: 60,
          fontFamily: 'Anton',
          fontSize: 220,
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `8px 8px 0 ${accent}`,
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
      logoTricolor({ size: 'sm', onDark }),
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
        padding: '0 60px',
        textAlign: 'center',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 200,
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `8px 8px 0 ${accent}`,
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
      logoTricolor({ size: 'sm', onDark }),
    ),
  );
}

function renderUrgency({ headline, subline, bg, accent }) {
  // Default: red bg, cream type. Hard high-contrast.
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
        padding: '0 60px',
        textAlign: 'center',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 56,
          letterSpacing: '0.22em',
          color: onDark ? PALETTE.yellow : PALETTE.ink,
          textTransform: 'uppercase',
          marginBottom: 40,
        },
      }, '⚠ ATENCIÓN ⚠'),
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 220,
          lineHeight: 0.88,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `9px 9px 0 ${accent}`,
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
      logoTricolor({ size: 'sm', onDark }),
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
        padding: '0 60px',
        textAlign: 'center',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 200,
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `8px 8px 0 ${accent}`,
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
      logoTricolor({ size: 'sm', onDark }),
    ),
    flagBar({ height: 20, reversed: true }),
  );
}

// ───────────────────────────────────────────
// Role → renderer map
// ───────────────────────────────────────────
const ROLE_RENDERERS = {
  hook: renderHook,
  tease: renderTease,
  reveal: renderReveal,
  urgency: renderUrgency,
  cta: renderCta,
};

/**
 * Renders a single story to a PNG Buffer.
 * @param {object} descriptor - {role, headline, subline, bg, accent, ...}
 * @returns {Promise<Buffer>}
 */
export async function renderStory(descriptor) {
  const fonts = await loadFonts();
  const role = descriptor.role || 'reveal';
  const renderer = ROLE_RENDERERS[role] || renderReveal;
  const node = renderer({
    headline: descriptor.headline || '',
    subline: descriptor.subline || '',
    bg: bgColor(descriptor.bg || 'cream'),
    accent: accentColor(descriptor.accent || 'red'),
    image: descriptor.image,
    sticker: descriptor.sticker,
  });

  const svg = await satori(node, { width: WIDTH, height: HEIGHT, fonts });
  return await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export const STORY_WIDTH = WIDTH;
export const STORY_HEIGHT = HEIGHT;
