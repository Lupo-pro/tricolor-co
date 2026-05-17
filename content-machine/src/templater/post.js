// ============================================
// post.js — Instagram square feed post dispatcher (1080×1080).
//
// Picks a layout based on descriptor.layout. Default is 'typo-pure'
// which preserves the v1 behavior. Each layout module exports a
// `render(descriptor, { size })` that returns a satori JSX node.
//
// Available layouts:
//   typo-pure         — big Anton headline, eyebrow, subline (default)
//   typo-silhouette   — typo left, bodysuit SVG right
//   split-screen      — 50/50 color/ink split
//   photo-placeholder — top 65% photo zone, bottom typo
//   quote-fullbg      — manifesto quote, full color background
//   quote-crema       — manifesto quote on crema with tricolor band
//   numbers           — giant stat as hero ("127 CAFETERAS")
//   comparison        — antes/después split
// ============================================

import satori from 'satori';
import sharp from 'sharp';
import { loadFonts } from './brand.js';

import { render as renderTypoPure }        from './post-typo-pure.js';
import { render as renderTypoSilhouette }  from './post-typo-silhouette.js';
import { render as renderSplitScreen }     from './post-split-screen.js';
import { render as renderPhotoPlaceholder } from './post-photo-placeholder.js';
import { render as renderQuoteFullbg }     from './post-quote-fullbg.js';
import { render as renderQuoteCrema }      from './post-quote-crema.js';
import { render as renderNumbers }         from './post-numbers.js';
import { render as renderComparison }      from './post-comparison.js';
import { render as renderQuoteAttributed } from './post-quote-attributed.js';

const SIZE = 1080;

const LAYOUTS = {
  'typo-pure':         renderTypoPure,
  'typo-silhouette':   renderTypoSilhouette,
  'split-screen':      renderSplitScreen,
  'photo-placeholder': renderPhotoPlaceholder,
  'quote-fullbg':      renderQuoteFullbg,
  'quote-crema':       renderQuoteCrema,
  'numbers':           renderNumbers,
  'comparison':        renderComparison,
  'quote-attributed':  renderQuoteAttributed,
};

export async function renderPost(descriptor) {
  const fonts = await loadFonts();
  const layoutName = descriptor.layout || 'typo-pure';
  const layoutFn = LAYOUTS[layoutName] || LAYOUTS['typo-pure'];
  const node = layoutFn(descriptor, { size: SIZE });
  const svg = await satori(node, { width: SIZE, height: SIZE, fonts });
  return await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export const POST_SIZE = SIZE;
export const POST_LAYOUTS = Object.keys(LAYOUTS);
