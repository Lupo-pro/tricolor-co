// ============================================
// brand.js — V5 visual primitives shared by every template.
//
// Single source of truth for:
//   - palette (mirror of /styles.css :root vars)
//   - font buffers (loaded from @fontsource/* once, reused everywhere)
//   - grain overlay (SVG data-URI baked in to avoid filesystem reads)
//   - tricolor flag strip
//   - the TRICOLOR 3-syllable logo as a satori JSX node
//
// All builders below return satori-friendly objects ({type, props})
// so templater files don't need a JSX transformer.
// ============================================

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// ───────────────────────────────────────────
// Palette — mirror of styles.css :root
// ───────────────────────────────────────────
export const PALETTE = {
  bg:        '#F0EBE0',  // crema
  bgWarm:    '#E8E0CF',
  ink:       '#0A0A0A',
  inkSoft:   '#2A2A28',
  muted:     '#8A867E',
  yellow:    '#FFD300',
  yellowDeep:'#D9B400',
  blue:      '#0033A0',
  red:       '#E63946',
  green:     '#2D5016',
  cream:     '#F0EBE0',
};

// ───────────────────────────────────────────
// Font loader
// Each font is loaded once and memoized. Satori requires raw buffers,
// not URLs.
// ───────────────────────────────────────────
const FONT_PATHS = {
  anton: '@fontsource/anton/files/anton-latin-400-normal.woff',
  bebas: '@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff',
  inter400: '@fontsource/inter/files/inter-latin-400-normal.woff',
  inter600: '@fontsource/inter/files/inter-latin-600-normal.woff',
  inter700: '@fontsource/inter/files/inter-latin-700-normal.woff',
  archivoBlack: '@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff',
  // Noto Sans Symbols — fallback so ★ (U+2605), → (U+2192), and the
  // other glyph not present in the latin-subset of our display fonts
  // render properly instead of as tofu / □ boxes.
  symbols: '@fontsource/noto-sans-symbols/files/noto-sans-symbols-latin-400-normal.woff',
};

const fontCache = new Map();

async function readFontBuffer(pkgPath) {
  if (fontCache.has(pkgPath)) return fontCache.get(pkgPath);
  // resolve through require so we get the absolute path inside node_modules
  const abs = require.resolve(pkgPath);
  const buf = await readFile(abs);
  fontCache.set(pkgPath, buf);
  return buf;
}

export async function loadFonts() {
  const [anton, bebas, inter400, inter600, inter700, archivoBlack, symbols] = await Promise.all([
    readFontBuffer(FONT_PATHS.anton),
    readFontBuffer(FONT_PATHS.bebas),
    readFontBuffer(FONT_PATHS.inter400),
    readFontBuffer(FONT_PATHS.inter600),
    readFontBuffer(FONT_PATHS.inter700),
    readFontBuffer(FONT_PATHS.archivoBlack),
    readFontBuffer(FONT_PATHS.symbols),
  ]);
  // satori cascades through the font list per-glyph. Display fonts
  // (Anton / Bebas / Inter / Archivo Black) come first; the Symbols
  // font is appended last as a catch-all so ★ / → / etc. render as
  // real glyphs even though the display fonts only ship latin.
  return [
    { name: 'Anton',         data: anton,        weight: 400, style: 'normal' },
    { name: 'Bebas Neue',    data: bebas,        weight: 400, style: 'normal' },
    { name: 'Inter',         data: inter400,     weight: 400, style: 'normal' },
    { name: 'Inter',         data: inter600,     weight: 600, style: 'normal' },
    { name: 'Inter',         data: inter700,     weight: 700, style: 'normal' },
    { name: 'Archivo Black', data: archivoBlack, weight: 900, style: 'normal' },
    { name: 'Symbols',       data: symbols,      weight: 400, style: 'normal' },
  ];
}

// ───────────────────────────────────────────
// Element builders
// ───────────────────────────────────────────
function el(type, props = {}, ...children) {
  // Flatten + filter; satori expects children inline in props.
  const flat = children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false);
  return { type, props: { ...props, children: flat.length === 1 ? flat[0] : flat } };
}

// Tricolor flag strip — 3-color band (yellow / blue / red).
// Usage: at top or bottom of a layout for V5 framing.
// Each inner div must declare display: flex too — satori is strict.
export function flagBar({ height = 16, reversed = false } = {}) {
  const colors = reversed
    ? [PALETTE.red, PALETTE.blue, PALETTE.yellow]
    : [PALETTE.yellow, PALETTE.blue, PALETTE.red];
  return el('div',
    { style: { display: 'flex', flexDirection: 'row', width: '100%', height } },
    colors.map((c) =>
      el('div', { style: { display: 'flex', flexGrow: 1, height: '100%', backgroundColor: c } })
    )
  );
}

// Grain noise overlay — embedded as SVG data URI so no disk read.
// Sized to the parent element via 100% width/height. Empty leaf div.
export function grainOverlay({ opacity = 0.06 } = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.75"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return el('div', {
    style: {
      display: 'flex',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundImage: `url('${dataUri}')`,
      backgroundSize: '200px 200px',
      backgroundRepeat: 'repeat',
      opacity,
      mixBlendMode: 'multiply',
      pointerEvents: 'none',
    },
  });
}

// ───────────────────────────────────────────
// TRICOLOR logo — stacked layers approach
// Each syllable gets rendered TWICE:
//   1. larger, in black (simulated stroke / contour)
//   2. on top, in the flag color (actual fill)
// Plus a real text-shadow underneath for the hard-shadow V5 look.
//
// Satori doesn't support -webkit-text-stroke, so this is the
// pixel-perfect equivalent. Each syllable becomes a positioned
// stack: black-stroke layer + colored fill layer + dropped shadow
// is handled via textShadow on the colored layer (satori supports
// it natively).
// ───────────────────────────────────────────
const LOGO_VARIANTS = {
  // sizeKey → { fontSize, strokeOffset (px the black layer pokes out
  // around the fill), shadow (offset of the hard drop shadow) }
  xs: { fontSize: 36,  strokeOffset: 1.5, shadow: 2 },
  sm: { fontSize: 64,  strokeOffset: 2.0, shadow: 3 },
  md: { fontSize: 96,  strokeOffset: 2.5, shadow: 4 },
  lg: { fontSize: 140, strokeOffset: 3.0, shadow: 5 },
  xl: { fontSize: 200, strokeOffset: 4.0, shadow: 7 },
};

function syllable({ text, color, strokeColor, shadowColor, fontSize, strokeOffset, shadow }) {
  // Satori only supports display: flex / none / block. Every node
  // with text content gets display: flex too. The stroke is faked
  // by rendering a slightly larger black copy behind the colored
  // fill (8-direction textShadow trick). The outer wrapper uses
  // position: relative; the stroke layer is absolutely positioned
  // so it overlays without taking layout space.
  return el('div',
    { style: {
        position: 'relative',
        display: 'flex',
        lineHeight: 1,
      } },
    // Stroke layer (slightly thickened, behind the fill)
    el('div', {
      style: {
        display: 'flex',
        position: 'absolute',
        top: 0, left: 0,
        fontFamily: 'Anton',
        fontSize,
        letterSpacing: '-0.03em',
        color: strokeColor,
        // 8-direction textShadow simulates a uniform stroke.
        textShadow: [
          `${strokeOffset}px 0 0 ${strokeColor}`,
          `-${strokeOffset}px 0 0 ${strokeColor}`,
          `0 ${strokeOffset}px 0 ${strokeColor}`,
          `0 -${strokeOffset}px 0 ${strokeColor}`,
          `${strokeOffset}px ${strokeOffset}px 0 ${strokeColor}`,
          `-${strokeOffset}px ${strokeOffset}px 0 ${strokeColor}`,
          `${strokeOffset}px -${strokeOffset}px 0 ${strokeColor}`,
          `-${strokeOffset}px -${strokeOffset}px 0 ${strokeColor}`,
        ].join(', '),
      },
    }, text),
    // Fill layer (colored, on top, takes layout)
    el('div', {
      style: {
        display: 'flex',
        position: 'relative',
        fontFamily: 'Anton',
        fontSize,
        letterSpacing: '-0.03em',
        color,
        textShadow: `${shadow}px ${shadow}px 0 ${shadowColor}`,
      },
    }, text),
  );
}

/**
 * Tricolor logo, satori JSX node.
 *   size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 *   onDark: when true, the syllable contour switches from #0A0A0A
 *           to cream so the logo reads on a black bg.
 *   withLa: prepends "★ La ★" Bebas eyebrow above the wordmark.
 */
export function logoTricolor({ size = 'md', onDark = false, withLa = false } = {}) {
  const v = LOGO_VARIANTS[size] || LOGO_VARIANTS.md;
  const strokeColor = onDark ? PALETTE.cream : PALETTE.ink;
  const shadowColor = onDark ? 'rgba(0,0,0,0.55)' : PALETTE.ink;
  const baseProps = { fontSize: v.fontSize, strokeOffset: v.strokeOffset, shadow: v.shadow, strokeColor, shadowColor };

  const word = el('div',
    { style: { display: 'flex', alignItems: 'baseline' } },
    syllable({ ...baseProps, text: 'Tri', color: PALETTE.yellow }),
    syllable({ ...baseProps, text: 'co',  color: PALETTE.blue }),
    syllable({ ...baseProps, text: 'lor', color: PALETTE.red }),
  );

  if (!withLa) return word;

  const laFontSize = Math.round(v.fontSize * 0.28);
  const laColor = onDark ? PALETTE.cream : PALETTE.ink;
  return el('div',
    { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 } },
    // "★ La ★" eyebrow rendered with SVG stars + a centered "La" label.
    el('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: Math.round(laFontSize * 0.4),
        fontFamily: 'Bebas Neue',
        fontSize: laFontSize,
        letterSpacing: '0.4em',
        color: laColor,
        marginBottom: Math.round(v.fontSize * 0.05),
      },
    },
      starIcon({ size: Math.round(laFontSize * 0.85), color: laColor }),
      el('div', { style: { display: 'flex' } }, 'La'),
      starIcon({ size: Math.round(laFontSize * 0.85), color: laColor }),
    ),
    word,
  );
}

// ───────────────────────────────────────────
// Star + arrow icons rendered as inline SVG.
// Satori's font fallback chain doesn't cover U+2605 (★) or U+2192 (→)
// even with @fontsource/noto-sans-symbols loaded — neither char ships
// in fontsource's latin-only subsets. Going SVG bypasses that.
// ───────────────────────────────────────────
export function starIcon({ size = 16, color = PALETTE.red } = {}) {
  // 5-point star. The viewBox is 24×24 so size in px = the rendered
  // square dimension. Satori supports inline <svg>.
  return el('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    style: { display: 'flex' },
  }, el('path', {
    d: 'M12 1.5l3 7.5 8 .5-6 5.5 2 8-7-4-7 4 2-8-6-5.5 8-.5z',
    fill: color,
  }));
}

export function arrowIcon({ size = 16, color = PALETTE.ink } = {}) {
  return el('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    style: { display: 'flex' },
  }, el('path', {
    d: 'M5 12h14m-4-4l4 4-4 4',
    stroke: color,
    strokeWidth: 2.5,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }));
}

// ───────────────────────────────────────────
// getShadowColor — picks a text-shadow color that contrasts with the
// text. The shadow color must NEVER match the text color, otherwise
// the shadow vanishes and the headline reads as flat type with no
// depth (e.g. cream text + cream shadow on a red bg).
//
// Rule:
//   text === accent → fall back to ink, except when text is itself
//                     ink, in which case bounce to yellow.
//   otherwise       → trust the accent (the layout intent).
//
// Pass the helper everywhere a textShadow drop-shadow uses an
// edition-driven color.
// ───────────────────────────────────────────
export function getShadowColor(textColor, accentColor) {
  if (textColor === accentColor) {
    return textColor === PALETTE.ink ? PALETTE.yellow : PALETTE.ink;
  }
  return accentColor;
}

// "★ TEXT ★" eyebrow — uses real SVG stars instead of the U+2605
// character which isn't in any of our loaded fonts.
export function starLabel(text, { color = PALETTE.red, size = 18 } = {}) {
  const iconSize = Math.round(size * 0.85);
  return el('div',
    { style: {
        display: 'flex',
        alignItems: 'center',
        gap: Math.round(size * 0.4),
        fontFamily: 'Bebas Neue',
        fontSize: size,
        letterSpacing: '0.2em',
        color,
        textTransform: 'uppercase',
      } },
    starIcon({ size: iconSize, color }),
    el('div', { style: { display: 'flex' } }, text),
    starIcon({ size: iconSize, color }),
  );
}

// ───────────────────────────────────────────
// Pill / chip — small inline tag used across layouts.
// ───────────────────────────────────────────
export function pillTag(text, {
  bg = PALETTE.yellow,
  color = PALETTE.ink,
  border = PALETTE.ink,
  shadow = PALETTE.red,
  fontSize = 28,
  pad = '10px 22px',
} = {}) {
  return el('div', {
    style: {
      display: 'flex',
      padding: pad,
      backgroundColor: bg,
      color,
      border: `3px solid ${border}`,
      boxShadow: `4px 4px 0 ${shadow}`,
      fontFamily: 'Anton',
      fontSize,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
    },
  }, text);
}

// ───────────────────────────────────────────
// statNumber — huge number with caption underneath.
// For "127 cafeteras" style posts/stories.
// ───────────────────────────────────────────
export function statNumber({
  value,
  label,
  color = PALETTE.ink,
  accent = PALETTE.red,
  fontSize = 320,
  labelSize = 44,
}) {
  return el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
  },
    el('div', {
      style: {
        display: 'flex',
        fontFamily: 'Anton',
        fontSize,
        lineHeight: 0.85,
        letterSpacing: '-0.04em',
        color,
        textShadow: `${Math.round(fontSize * 0.04)}px ${Math.round(fontSize * 0.04)}px 0 ${accent}`,
      },
    }, String(value)),
    label
      ? el('div', {
          style: {
            display: 'flex',
            marginTop: Math.round(fontSize * 0.05),
            fontFamily: 'Bebas Neue',
            fontSize: labelSize,
            letterSpacing: '0.18em',
            color,
            textTransform: 'uppercase',
          },
        }, label)
      : null,
  );
}

// ───────────────────────────────────────────
// photoFrame — dashed-border placeholder zone for future photos.
// Renders an "X" diagonal so designers know what to drop in.
// ───────────────────────────────────────────
export function photoFrame({
  width = '100%',
  height = '100%',
  label = 'PHOTO',
  borderColor = PALETTE.ink,
  bg = 'rgba(10,10,10,0.04)',
} = {}) {
  return el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width, height,
      backgroundColor: bg,
      border: `4px dashed ${borderColor}`,
    },
  },
    el('div', {
      style: {
        display: 'flex',
        fontFamily: 'Bebas Neue',
        fontSize: 28,
        letterSpacing: '0.3em',
        color: borderColor,
        opacity: 0.6,
        textTransform: 'uppercase',
      },
    }, label),
  );
}

// ───────────────────────────────────────────
// bodyShape — stylized bodysuit silhouette as inline SVG.
// Used by post-typo-silhouette / mood / comparison layouts.
// For richer per-edition assets see src/assets/silhouettes/*.svg.
// ───────────────────────────────────────────
export function bodyShape({
  width = 300,
  height = 420,
  color = PALETTE.yellow,
  stroke = PALETTE.ink,
  strokeWidth = 6,
  number,
  numberColor,
} = {}) {
  // viewBox 100×140. One-piece bodysuit outline: shoulders → V-neck →
  // narrow waist → high-cut legs.
  const path = 'M22 14 Q28 6 38 8 L50 12 L62 8 Q72 6 78 14 L82 36 Q80 50 76 60 L72 88 Q72 110 66 122 L62 134 Q56 138 50 132 Q44 138 38 134 L34 122 Q28 110 28 88 L24 60 Q20 50 18 36 Z';
  // V-neck cut (inner shape, subtracts visually via a same-bg fill).
  const neckPath = 'M40 12 L50 28 L60 12';
  const svg = el('svg', {
    width, height,
    viewBox: '0 0 100 140',
    style: { display: 'flex' },
  },
    el('path', { d: path, fill: color, stroke, strokeWidth, strokeLinejoin: 'round' }),
    el('path', { d: neckPath, fill: stroke, stroke, strokeWidth: 0 }),
  );
  if (!number) return svg;
  // Satori doesn't support <text> SVG. Overlay the jersey number as an
  // HTML div using absolute positioning instead.
  const numberSize = Math.round(width * 0.22);
  const numberTop = Math.round(height * 0.45) - Math.round(numberSize * 0.55);
  return el('div', {
    style: {
      display: 'flex',
      position: 'relative',
      width, height,
    },
  },
    svg,
    el('div', {
      style: {
        display: 'flex',
        position: 'absolute',
        top: numberTop, left: 0, right: 0,
        justifyContent: 'center',
        fontFamily: 'Anton',
        fontSize: numberSize,
        lineHeight: 1,
        color: numberColor || stroke,
      },
    }, String(number)),
  );
}

// ───────────────────────────────────────────
// Common bg helpers
// ───────────────────────────────────────────
export function bgColor(name) {
  const map = {
    cream:  PALETTE.bg,
    ink:    PALETTE.ink,
    yellow: PALETTE.yellow,
    blue:   PALETTE.blue,
    red:    PALETTE.red,
    black:  PALETTE.ink,
    crema:  PALETTE.bg, // alias used in sequences
  };
  return map[name] || name; // pass-through if it's a hex
}

export function accentColor(name) {
  // Same alias map — accent and bg use the same palette
  return bgColor(name);
}

// Re-export el for templater files that want to build raw nodes
export { el };
