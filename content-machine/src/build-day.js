// ============================================
// build-day.js — Generate every visual + caption planned for a day.
//
// CLI:
//   node src/build-day.js                  → today
//   node src/build-day.js --date=2026-05-18
//   node src/build-day.js --date=today --no-claude   (skip caption API call)
//
// Writes:
//   data/drafts/{date}/manifest.json       (everything that was made)
//   data/drafts/{date}/<seq>-NN-role.png   (story PNGs)
//   data/drafts/{date}/post-XX.png         (feed posts)
//   data/drafts/{date}/carousel-XX.png     (carousel slides)
//   data/drafts/{date}/captions.json       (caption per asset)
//
// Each asset gets a stable id so the dashboard can approve/reject
// individually OR approve an entire sequence in one click.
// ============================================

import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { planForDay, todayKey } from './strategy/content-mix.js';
import { renderStory } from './templater/story.js';
import { renderPost } from './templater/post.js';
import { renderCarousel } from './templater/carousel.js';
import { generateCaption } from './ai/claude.js';
import { PROMPTS } from './ai/prompts.js';
import { getEducationalDeck, EDUCATIONAL_THEME_KEYS } from './strategy/educational.js';
import { pickHook, pickHookWeighted, categoryForContentType } from './strategy/hooks.js';
import { anglesForDay, suggestAngleFor } from './strategy/angles.js';
import { flaggedSet } from './strategy/preferences.js';
import { POST_LAYOUTS } from './templater/post.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');

function parseArgs() {
  const out = {};
  for (const raw of process.argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    if (eq === -1) out[raw.slice(2)] = true;
    else out[raw.slice(2, eq)] = raw.slice(eq + 1);
  }
  return out;
}

// Map a "post key" from the calendar to the right Claude prompt
// template + a renderable post descriptor. Anything we don't have an
// explicit mapping for falls back to a generic drop announcement.
function postPlan(postKey, day) {
  const edition = day.edition_focus || 'la-capitana';
  const editionLabel = {
    'la-capitana': 'La Capitana',
    'la-portera':  'La Portera',
    'oro-negro':   'Oro Negro',
    'la-cafetera': 'La Cafetera',
  }[edition] || 'La Capitana';
  const editionColor = {
    'la-capitana': 'yellow',
    'la-portera':  'blue',
    'oro-negro':   'ink',
    'la-cafetera': 'red',
  }[edition] || 'yellow';

  // post.layout is the new dispatcher key — different post types use
  // different visual templates so the feed doesn't look monotonous.
  const plans = {
    'hero-launch':       { promptName: 'drop',      promptArgs: { edition }, post: { layout: 'quote-fullbg',       eyebrow: "LAUNCH",           headline: 'SÉ TRICOLOR',                 subline: '4 ediciones · Edición Mundial 2026', bg: 'red',    accent: 'yellow' } },
    'drop-capitana':     { promptName: 'drop',      promptArgs: { edition: 'la-capitana' }, post: { layout: 'typo-silhouette', eyebrow: "Edición Home",  headline: 'LA CAPITANA',     subline: 'Amarilla · #10 · $99K',              bg: 'cream',  accent: 'red',    silhouette: 'yellow', number: 10 } },
    'drop-portera':      { promptName: 'drop',      promptArgs: { edition: 'la-portera'  }, post: { layout: 'typo-silhouette', eyebrow: "Edición Away",  headline: 'LA PORTERA',      subline: 'Azul vintage · #01 · $99K',          bg: 'cream',  accent: 'yellow', silhouette: 'blue', number: 1 } },
    'drop-oronegro':     { promptName: 'drop',      promptArgs: { edition: 'oro-negro'   }, post: { layout: 'typo-silhouette', eyebrow: "Edición Premium", headline: 'ORO NEGRO',     subline: 'Negro + dorado · #07 · $99K',        bg: 'cream',  accent: 'red',    silhouette: 'ink', number: 7 } },
    'drop-cafetera':     { promptName: 'drop',      promptArgs: { edition: 'la-cafetera' }, post: { layout: 'typo-silhouette', eyebrow: "Edición Alterna", headline: 'LA CAFETERA',   subline: 'Rojo pasión · #09 · $99K',           bg: 'cream',  accent: 'red',    silhouette: 'red', number: 9 } },
    'manifesto-quote':   { promptName: 'manifesto', promptArgs: {}, post: { layout: 'quote-crema',     eyebrow: "Manifiesto",     headline: 'ES BANDERA',                   subline: 'Este body no es ropa',                bg: 'cream',  footer: 'LATRICOLOR.CO' } },
    'manifesto-bold':    { promptName: 'manifesto', promptArgs: {}, post: { layout: 'quote-fullbg',    eyebrow: "Manifiesto",     headline: 'NACIMOS AMARILLAS',            subline: 'Azules y rojas',                       bg: 'yellow', accent: 'red' } },
    'testimonial':       { promptName: 'review',    promptArgs: {}, post: { layout: 'numbers',         eyebrow: "La Tribuna",     value: '500',  label: 'CAFETERAS ESTA SEMANA',       subline: 'Y todas con la suya',                  bg: 'cream',  accent: 'red' } },
    'bundle-push':       { promptName: 'bundle',    promptArgs: {}, post: { layout: 'split-screen',    eyebrow: "El Once Inicial", headline: '4 BODIES · 1 PACK',           subline: 'Ahorra $267.000 · 2 gorras gratis',    bg: 'yellow', bottom: 'ink', accent: 'red' } },
    'countdown-mundial': { promptName: 'countdown', promptArgs: {}, post: { layout: 'numbers',         eyebrow: "Mundial 2026",    value: '25',   label: 'DÍAS AL MUNDIAL',             subline: 'Tu outfit · tu energía · tu día',      bg: 'red',    accent: 'yellow' } },
    'countdown-match':   { promptName: 'countdown', promptArgs: {}, post: { layout: 'numbers',         eyebrow: "Próximo Partido", value: '3',    label: 'DÍAS AL PARTIDO',             subline: editionLabel + ' · listas para el partido', bg: editionColor, accent: 'ink' } },
    'match-day-hero':    { promptName: 'matchDay',  promptArgs: { opponent: day.match?.opponent || 'Uzbekistán', kickoffTime: day.match?.kickoff || '22:00', stadium: day.match?.stadium || '' }, post: { layout: 'split-screen', eyebrow: "Match Day", headline: '¡VAMOS COLOMBIA!', subline: `vs ${day.match?.opponent || 'Uzbekistán'} · ${day.match?.kickoff || '22:00'}`, bg: 'yellow', bottom: 'red', accent: 'yellow' } },
    'ugc-recap':         { promptName: 'ugc',       promptArgs: {}, post: { layout: 'photo-placeholder', eyebrow: "La Hinchada",   headline: 'TU LOOK NOS MATÓ',             subline: 'Repost de la semana',                  bg: 'cream',  accent: 'red',    photoLabel: 'UGC · @cliente' } },
    'mundial-opens':     { promptName: 'countdown', promptArgs: { daysToMundial: 0 }, post: { layout: 'quote-fullbg',   eyebrow: "HOY EMPIEZA",     headline: 'MUNDIAL 2026',                 subline: 'Sé Tricolor desde el silbatazo',       bg: 'yellow', accent: 'red' } },
    'group-stage-recap': { promptName: 'countdown', promptArgs: {}, post: { layout: 'comparison',      left: { label: 'GRUPO',     headline: 'CERRADO',   bg: 'cream' },   right: { label: 'KNOCKOUTS', headline: 'EMPIEZAN', bg: 'red' }, footer: 'COLOMBIA AVANZA' } },
    // Educational post — single big stat from the brief.
    'mundial-stat':      { promptName: 'countdown', promptArgs: {}, post: { layout: 'numbers',         eyebrow: "Mundial 2026",    value: '48',   label: 'SELECCIONES',                 subline: 'La edición más grande de la historia', bg: 'blue',   accent: 'yellow' } },
    'sedes-stat':        { promptName: 'countdown', promptArgs: {}, post: { layout: 'numbers',         eyebrow: "Las Sedes",       value: '3',    label: 'PAÍSES SEDES',                subline: 'México · USA · Canadá',                 bg: 'cream',  accent: 'red' } },
  };
  return plans[postKey] || plans['drop-capitana'];
}

function carouselPlan(theme, day) {
  // Educational decks ship with their own layout — return both so the
  // renderer dispatches correctly.
  const edu = getEducationalDeck(theme);
  if (edu) return { slides: edu.slides, layout: edu.layout };

  const slidesByTheme = {
    'las-4-ediciones': [
      { variant: 'cover',  eyebrow: "Mundial 2026",  headline: 'LAS 4 EDICIONES',     subline: 'Una para cada estado de ánimo', bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: 'LA CAPITANA',      subline: 'Home · #10 Amarilla',  bg: 'yellow', accent: 'ink' },
      { variant: 'middle', headline: 'LA PORTERA',       subline: 'Away · #01 Azul',      bg: 'blue',   accent: 'yellow' },
      { variant: 'middle', headline: 'ORO NEGRO',        subline: 'Premium · #07',        bg: 'ink',    accent: 'yellow' },
      { variant: 'middle', headline: 'LA CAFETERA',      subline: 'Alterna · #09 Roja',   bg: 'red',    accent: 'yellow' },
      { variant: 'cta',    headline: 'ELEGÍ LA TUYA',    subline: '$99K · Contraentrega', cta: 'Pedir Ahora', bg: 'cream', accent: 'red' },
    ],
    'guia-tallas': [
      { variant: 'cover',  eyebrow: "Guía de Tallas", headline: 'TU TALLA · S/M/L', subline: 'Sin adivinar', bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: 'TALLA S',          subline: '32-34 · Busto 80-87 cm', bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: 'TALLA M',          subline: '36-38 · Busto 88-95 cm', bg: 'yellow', accent: 'ink' },
      { variant: 'middle', headline: 'TALLA L',          subline: '40-42 · Busto 96-104 cm', bg: 'red', accent: 'cream' },
      { variant: 'cta',    headline: 'ENTRE DOS · LA MÁS AMPLIA', subline: 'El body abraza, no aprieta', cta: 'Asesoría Talla', bg: 'cream', accent: 'red' },
    ],
    'como-funciona': [
      { variant: 'cover',  eyebrow: "Cómo Comprar",  headline: 'TRES PASOS',          subline: 'Cero drama',   bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: '01 · ESCRÍBENOS',  subline: 'WhatsApp con mensaje listo', bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: '02 · CONFIRMÁS',   subline: 'Asesoría de talla + dirección', bg: 'yellow', accent: 'ink' },
      { variant: 'cta',    headline: '03 · RECIBÍS Y PAGÁS', subline: '24-72h · Efectivo, Nequi, Daviplata', cta: 'Empezar', bg: 'cream', accent: 'red' },
    ],
    'por-que-tricolor': [
      { variant: 'cover',  eyebrow: "Manifiesto",    headline: 'NACIMOS AMARILLAS', subline: 'Azules y rojas', bg: 'yellow', accent: 'red' },
      { variant: 'middle', headline: 'CANTANDO',         subline: 'El himno con la mano en el pecho', bg: 'blue', accent: 'yellow' },
      { variant: 'middle', headline: 'GRITAMOS',         subline: 'Cuando perdemos', bg: 'red', accent: 'cream' },
      { variant: 'middle', headline: 'TRIBUNA · SALA · CALLE', subline: 'Donde sea estás Tricolor', bg: 'cream', accent: 'red' },
      { variant: 'cta',    headline: 'ES BANDERA',       subline: 'Este body no es ropa', cta: 'Leer Más', bg: 'ink', accent: 'yellow' },
    ],
    'once-inicial': [
      { variant: 'cover',  eyebrow: "El Once Inicial", headline: '4 BODIES · 1 PACK', subline: 'Las 4 ediciones del Mundial', bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: 'AHORRAS $267.000', subline: '$329K en vez de $596K', bg: 'yellow', accent: 'ink' },
      { variant: 'cta',    headline: '+ 2 GORRAS GRATIS', subline: 'Tricolor oficial FCF', cta: 'Lo Quiero', bg: 'red', accent: 'cream' },
    ],
  };
  const slides = slidesByTheme[theme] || slidesByTheme['las-4-ediciones'];
  return { slides, layout: 'default' };
}

// Map a content surface (prompt name + theme) to the hook category
// strategy/hooks.js exposes. Mirrors the routing inside prompts.js so
// the manifest record matches what Claude actually saw.
function hookCategoryFor({ promptName, carouselTheme }) {
  if (promptName === 'carousel') {
    return EDUCATIONAL_THEME_KEYS.includes(carouselTheme) ? 'valeur' : 'interrogatifs';
  }
  const promptToType = {
    drop: 'daily-drop', manifesto: 'manifesto', matchDay: 'match-day',
    review: 'review', bundle: 'carousel', fomo: 'fomo', ugc: 'review',
    bts: 'bts', countdown: 'countdown', poll: 'poll', qa: 'educational',
  };
  return categoryForContentType(promptToType[promptName] || promptName);
}

function resolveHook({ promptName, carouselTheme, seed, flagged }) {
  const category = hookCategoryFor({ promptName, carouselTheme });
  const text = flagged
    ? pickHookWeighted(category, { seed, flagged: flagged.hooks_text })
    : pickHook(category, { seed });
  return { hook: text, hookCategory: category };
}

// If the post layout originally picked by postPlan is flagged, swap it
// for the first non-flagged sibling. We keep the rest of the post
// descriptor (bg, accent, eyebrow, headline, ...) intact — only the
// visual template changes. Falls through if nothing's flagged.
function maybeSwapPostLayout(plan, flagged) {
  if (!flagged || !plan?.post?.layout) return plan;
  const originalLayout = plan.post.layout;
  if (!flagged.layouts.post.has(originalLayout)) return plan;
  const replacement = POST_LAYOUTS.find((l) => !flagged.layouts.post.has(l));
  if (!replacement || replacement === originalLayout) return plan;
  console.log(`  ↺ swapping post layout: ${originalLayout} → ${replacement} (preferences)`);
  return { ...plan, post: { ...plan.post, layout: replacement } };
}

async function maybeCaption({ promptName, promptArgs, angle }, options, seed) {
  if (options.noClaude) {
    return `[caption — generar después · ${promptName}${angle ? ' · ' + angle : ''}]`;
  }
  try {
    const promptFn = PROMPTS[promptName];
    if (!promptFn) return `[no prompt mapped for ${promptName}]`;
    // seed (dateKey) lets prompts pick a stable hook per day from
    // strategy/hooks.js. `angle` carries the narrative lens the prompt
    // should adopt (rebellion, confession, comedy, …). Both fall
    // through harmlessly if the prompt doesn't read them.
    const prompt = promptFn({ ...(promptArgs || {}), seed, angle });
    return await generateCaption(prompt);
  } catch (err) {
    console.warn(`  ⚠ Claude failed for ${promptName}: ${err.message}`);
    return `[caption skipped — Claude error: ${err.message}]`;
  }
}

async function main() {
  const args = parseArgs();
  const date = args.date === 'today' || !args.date ? todayKey() : args.date;
  const options = { noClaude: !!args['no-claude'] };

  console.log(`▶ build-day · ${date}`);
  const plan = await planForDay(date);
  console.log(`  theme:    ${plan.theme}`);
  console.log(`  edition:  ${plan.edition_focus || '—'}`);
  console.log(`  match:    ${plan.match ? `vs ${plan.match.opponent} · ${plan.match.kickoff}` : '—'}`);
  console.log(`  posts:    ${plan.posts.length}`);
  console.log(`  carousel: ${plan.carousel || '—'}`);
  console.log(`  sequences: ${plan.sequences.map((s) => s.name).join(', ') || '—'}`);
  if (options.noClaude) console.log('  --no-claude → captions are placeholders\n');

  const outDir = join(DATA_DIR, 'drafts', date);
  await mkdir(outDir, { recursive: true });

  // Flat-by-type mirror — every PNG also lands under
  // data/stockpile/{stories,posts,carousels}/<date>__<id>.png so the
  // operator can browse the whole pile by type on the filesystem
  // (and tools like Finder / image-viewer plugins work without
  // crawling per-day directories). The per-day manifest.json under
  // data/drafts stays the source of metadata; the stockpile dirs are
  // just file mirrors.
  const stockDirs = {
    story:    join(DATA_DIR, 'stockpile', 'stories'),
    post:     join(DATA_DIR, 'stockpile', 'posts'),
    carousel: join(DATA_DIR, 'stockpile', 'carousels'),
  };
  for (const p of Object.values(stockDirs)) await mkdir(p, { recursive: true });
  async function mirror(kind, filename, captionKey) {
    const src = join(outDir, filename);
    const dst = join(stockDirs[kind], `${date}__${filename}`);
    try { await copyFile(src, dst); }
    catch (e) { console.warn(`  ⚠ mirror failed (${dst}):`, e.message); }
  }

  // Pull the current flagged set so the generator can avoid hooks /
  // layouts that have been rejected enough times to count as signal.
  const flagged = await flaggedSet();
  const flaggedSummary = [
    flagged.layouts.post.size, flagged.layouts.story.size, flagged.layouts.carousel.size,
    flagged.hooks_text.size, flagged.hooks_category.size,
  ].reduce((a, b) => a + b, 0);
  if (flaggedSummary > 0) {
    console.log(`  prefs:    ${flaggedSummary} flagged patterns will be skipped`);
  }

  // Pick 4 distinct narrative angles for this day. Each item rotates
  // through them so the batch reads as varied perspectives on the
  // same theme, not three copies of the same voice. Deterministic
  // per date — same date → same angle order → same caption seeds.
  const dayAngles = anglesForDay(date, 4);
  console.log(`  angles:   ${dayAngles.map((a) => a.id).join(' · ')}`);
  let angleIdx = 0;
  const nextAngle = () => {
    const a = dayAngles[angleIdx % dayAngles.length];
    angleIdx++;
    return a.id;
  };

  const manifest = {
    date, theme: plan.theme, edition_focus: plan.edition_focus, special: plan.special,
    angles: dayAngles.map((a) => a.id),
    items: [],
  };
  const captions = {};

  // ─── Stories per sequence ───
  for (const seq of plan.sequences) {
    let mod;
    try {
      mod = await import(`./sequences/${seq.name}.js`);
    } catch (e) {
      console.warn(`  ⚠ sequence ${seq.name} not found, skipping`);
      continue;
    }
    const stories = await mod.generate(seq.args || {});
    for (const story of stories) {
      const id = `seq-${seq.name}-${String(story.step).padStart(2, '0')}-${story.role}`;
      const png = await renderStory(story);
      const filename = `${id}.png`;
      await writeFile(join(outDir, filename), png);
      await mirror('story', filename);
      const promptName = seq.name === 'match-day' ? 'matchDay' : seq.name.replace(/-(\w)/g, (_, c) => c.toUpperCase());
      const seed = `${date}:${seq.name}:${story.step}`;
      const angle = nextAngle();
      const { hook, hookCategory } = resolveHook({ promptName, seed, flagged });
      const caption = await maybeCaption({ promptName, promptArgs: seq.args, angle }, options, seed);
      captions[id] = caption;
      // Fall back to the role-based renderer if no explicit layout —
      // the manifest records what was actually rendered for prefs.
      const layout = story.layout || `role-${story.role}`;
      manifest.items.push({
        id, kind: 'story', sequence: seq.name, step: story.step, role: story.role,
        layout, hook, hookCategory, angle,
        offsetMin: story.offsetMin, headline: story.headline, subline: story.subline,
        bg: story.bg, accent: story.accent, sticker: story.sticker || null,
        file: filename, caption_key: id,
      });
      console.log(`  ✓ ${id} (${(png.length / 1024).toFixed(0)} KB · ${angle})`);
    }
  }

  // ─── Feed posts ───
  for (const postKey of plan.posts) {
    const rawPlan = postPlan(postKey, plan);
    const p = maybeSwapPostLayout(rawPlan, flagged);
    const id = `post-${postKey}`;
    // Pass the picked angle into the renderer so a composition seed
    // and the prompt see the same lens.
    const angle = nextAngle();
    const png = await renderPost({ ...p.post, compositionSeed: `${id}:${angle}` });
    const filename = `${id}.png`;
    await writeFile(join(outDir, filename), png);
    await mirror('post', filename);
    const seed = `${date}:post:${postKey}`;
    const { hook, hookCategory } = resolveHook({ promptName: p.promptName, seed, flagged });
    const caption = await maybeCaption({ promptName: p.promptName, promptArgs: p.promptArgs, angle }, options, seed);
    captions[id] = caption;
    manifest.items.push({
      id, kind: 'post', key: postKey, hook, hookCategory, angle, ...p.post,
      file: filename, caption_key: id,
    });
    console.log(`  ✓ ${id} (${(png.length / 1024).toFixed(0)} KB · ${angle})`);
  }

  // ─── Carousel ───
  if (plan.carousel) {
    const { slides, layout } = carouselPlan(plan.carousel, plan);
    const buffers = await renderCarousel({ slides, layout });
    const id = `carousel-${plan.carousel}`;
    const fileNames = [];
    for (let i = 0; i < buffers.length; i++) {
      const fn = `${id}-${String(i + 1).padStart(2, '0')}.png`;
      await writeFile(join(outDir, fn), buffers[i]);
      await mirror('carousel', fn);
      fileNames.push(fn);
    }
    const seed = `${date}:carousel:${plan.carousel}`;
    const angle = nextAngle();
    const { hook, hookCategory } = resolveHook({ promptName: 'carousel', carouselTheme: plan.carousel, seed, flagged });
    const caption = await maybeCaption({ promptName: 'carousel', promptArgs: { type: plan.carousel }, angle }, options, seed);
    captions[id] = caption;
    manifest.items.push({
      id, kind: 'carousel', theme: plan.carousel, layout, hook, hookCategory, angle,
      slideCount: buffers.length, files: fileNames, caption_key: id,
    });
    console.log(`  ✓ ${id} (${buffers.length} slides · ${angle})`);
  }

  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(join(outDir, 'captions.json'), JSON.stringify(captions, null, 2));

  console.log(`\n✓ ${manifest.items.length} drafts → data/drafts/${date}/`);

  // Variety audit — surfaces a layout-distribution histogram + warns
  // when fewer than 3 distinct layouts are in the batch, which means
  // the feed will look monotonous. This is informational only; the
  // build doesn't fail on a low count.
  const layoutCounts = {};
  for (const it of manifest.items) {
    const l = it.layout || 'unknown';
    layoutCounts[l] = (layoutCounts[l] || 0) + 1;
  }
  const distinct = Object.keys(layoutCounts).length;
  const top = Object.entries(layoutCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([l, n]) => `${l}×${n}`)
    .join('  ');
  console.log(`  variety: ${distinct} distinct layouts · ${top}`);
  if (distinct < 3) {
    console.log(`  ⚠ batch has <3 distinct layouts — consider adding a sequence/post variant`);
  }
}

main().catch((err) => {
  console.error('\n✗ build-day failed:', err.message || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
