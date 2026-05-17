// ============================================
// generate.js — CLI entry for content generation.
//
// Examples:
//   node src/generate.js --type=story --headline="VAMOS COLOMBIA" --bg=red
//   node src/generate.js --type=post  --headline="OFERTA" --subline="Solo hoy"
//   node src/generate.js --type=sequence --sequence=daily-drop --edition=la-capitana --out=test
//   node src/generate.js --type=carousel --slides=5 --edition=la-capitana
//
// Output: PNG file(s) under data/drafts/<out>/
//   where <out> defaults to today's YYYY-MM-DD, or whatever --out= says.
// ============================================

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderStory }        from './templater/story.js';
import { renderPost }         from './templater/post.js';
import { renderPostPortrait } from './templater/post-portrait.js';
import { renderCarousel }     from './templater/carousel.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');

// ────── arg parsing ──────
function parseArgs() {
  const args = {};
  for (const raw of process.argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    if (eq === -1) {
      args[raw.slice(2)] = true;
    } else {
      args[raw.slice(2, eq)] = raw.slice(eq + 1);
    }
  }
  return args;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function ensureOutDir(outName) {
  const dir = join(DATA_DIR, 'drafts', outName || todayKey());
  await mkdir(dir, { recursive: true });
  return dir;
}

async function loadSequence(name) {
  // Dynamic import — sequence module either exists (commit 4) or
  // we fall back to a minimal inline daily-drop so the smoke test
  // works even before commit 4.
  try {
    const mod = await import(`./sequences/${name}.js`);
    return mod;
  } catch (_) {
    if (name !== 'daily-drop') {
      throw new Error(`Sequence '${name}' not found. Available after commit 4.`);
    }
    // Inline fallback — same shape as the real daily-drop.js will use.
    return {
      generate: (ctx) => [
        { step: 1, role: 'hook',    headline: '¿SABES QUÉ PASA HOY?',  subline: 'A las 7pm exacto · No te lo pierdas', bg: 'cream', accent: 'yellow' },
        { step: 2, role: 'tease',   headline: 'NUEVA EDICIÓN',          subline: 'Adivina cuál...',                    bg: 'ink',   accent: 'blue' },
        { step: 3, role: 'reveal',  headline: (ctx.editionName || 'LA CAPITANA').toUpperCase(),
                                    subline: `Edición Mundial · $${ctx.price || 99}K`,
                                    bg: ctx.editionColor || 'yellow', accent: 'ink' },
        { step: 4, role: 'urgency', headline: 'STOCK LIMITADO',         subline: `Quedan ${ctx.stockLeft || 14} unidades`, bg: 'red',   accent: 'cream' },
        { step: 5, role: 'cta',     headline: 'ÚLTIMA HORA',            subline: 'Pedir ahora · Link en bio',         bg: 'cream', accent: 'red' },
      ],
    };
  }
}

const EDITION_DEFAULTS = {
  'la-capitana': { editionName: 'La Capitana', editionColor: 'yellow', price: 99 },
  'la-portera':  { editionName: 'La Portera',  editionColor: 'blue',   price: 99 },
  'oro-negro':   { editionName: 'Oro Negro',   editionColor: 'ink',    price: 99 },
  'la-cafetera': { editionName: 'La Cafetera', editionColor: 'red',    price: 99 },
};

// ────── main ──────
async function main() {
  const args = parseArgs();
  const type = args.type || 'story';
  const outName = args.out || todayKey();
  const outDir = await ensureOutDir(outName);

  console.log(`▶ content-machine · generate`);
  console.log(`  type:   ${type}`);
  console.log(`  out:    data/drafts/${outName}/`);

  const started = Date.now();
  let produced = 0;

  if (type === 'story') {
    const descriptor = {
      role:     args.role     || 'reveal',
      headline: args.headline || 'VAMOS COLOMBIA',
      subline:  args.subline  || '★ Mundial 2026 ★',
      bg:       args.bg       || 'cream',
      accent:   args.accent   || 'red',
    };
    const png = await renderStory(descriptor);
    const file = join(outDir, `story-${descriptor.role}.png`);
    await writeFile(file, png);
    console.log(`  ✓ ${file} (${(png.length / 1024).toFixed(1)} KB)`);
    produced = 1;

  } else if (type === 'post') {
    const png = await renderPost({
      headline: args.headline || 'OFERTA EXCLUSIVA',
      subline:  args.subline  || 'Edición Mundial 2026',
      eyebrow:  args.eyebrow  || 'LATRICOLOR.CO',
      bg:       args.bg       || 'cream',
      accent:   args.accent   || 'red',
    });
    const file = join(outDir, `post.png`);
    await writeFile(file, png);
    console.log(`  ✓ ${file} (${(png.length / 1024).toFixed(1)} KB)`);
    produced = 1;

  } else if (type === 'post-portrait') {
    const png = await renderPostPortrait({
      headline: args.headline || 'NO TE QUEDES SIN EL TUYO',
      subline:  args.subline  || 'Stock limitado · Mundial 2026',
      eyebrow:  args.eyebrow  || 'LATRICOLOR.CO',
      bg:       args.bg       || 'cream',
      accent:   args.accent   || 'red',
    });
    const file = join(outDir, `post-portrait.png`);
    await writeFile(file, png);
    console.log(`  ✓ ${file} (${(png.length / 1024).toFixed(1)} KB)`);
    produced = 1;

  } else if (type === 'sequence') {
    const seqName = args.sequence || 'daily-drop';
    const editionKey = args.edition || 'la-capitana';
    const ctx = {
      edition: editionKey,
      ...(EDITION_DEFAULTS[editionKey] || {}),
      stockLeft: args.stockLeft ? Number(args.stockLeft) : undefined,
    };
    const seq = await loadSequence(seqName);
    const stories = await seq.generate(ctx);
    console.log(`  seq:    ${seqName} (${stories.length} stories)`);

    for (const story of stories) {
      const png = await renderStory(story);
      const file = join(outDir, `${seqName}-${String(story.step).padStart(2, '0')}-${story.role}.png`);
      await writeFile(file, png);
      console.log(`  ✓ step ${story.step} · ${story.role.padEnd(8)} · ${file.split('/').pop()} (${(png.length / 1024).toFixed(1)} KB)`);
      produced += 1;
    }

  } else if (type === 'carousel') {
    const numSlides = Number(args.slides) || 4;
    const edition = args.edition || 'la-capitana';
    const ed = EDITION_DEFAULTS[edition] || EDITION_DEFAULTS['la-capitana'];
    const slides = [
      { variant: 'cover',  eyebrow: 'Edición Mundial 2026',  headline: ed.editionName.toUpperCase(), subline: '4 ediciones · 1 colección',     bg: ed.editionColor, accent: 'ink' },
      { variant: 'middle', headline: 'Tela técnica',         subline: 'AEROREADY · Costuras planas reforzadas', bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: 'Hecho en Colombia',    subline: 'Eje Cafetero · Pereira',                 bg: 'cream', accent: 'blue' },
      { variant: 'cta',    headline: 'Asegura el tuyo',      subline: 'Stock limitado',                         cta: 'Pedir Ahora →',           bg: 'cream', accent: 'red' },
    ].slice(0, numSlides);

    const buffers = await renderCarousel({ slides });
    for (let i = 0; i < buffers.length; i++) {
      const file = join(outDir, `carousel-${String(i + 1).padStart(2, '0')}.png`);
      await writeFile(file, buffers[i]);
      console.log(`  ✓ slide ${i + 1}/${buffers.length} · ${file.split('/').pop()} (${(buffers[i].length / 1024).toFixed(1)} KB)`);
      produced += 1;
    }

  } else {
    throw new Error(`Unknown --type=${type}. Use story | post | post-portrait | sequence | carousel.`);
  }

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n✓ Produced ${produced} asset(s) in ${secs}s`);
}

main().catch((err) => {
  console.error('\n✗ generate failed:', err.message || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
