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

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { planForDay, todayKey } from './strategy/content-mix.js';
import { renderStory } from './templater/story.js';
import { renderPost } from './templater/post.js';
import { renderCarousel } from './templater/carousel.js';
import { generateCaption } from './ai/claude.js';
import { PROMPTS } from './ai/prompts.js';

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

  const plans = {
    'hero-launch':       { promptName: 'drop',      promptArgs: { edition }, post: { eyebrow: '★ LAUNCH ★',           headline: 'SÉ TRICOLOR',                 subline: '4 ediciones · Edición Mundial 2026', bg: 'cream', accent: 'red' } },
    'drop-capitana':     { promptName: 'drop',      promptArgs: { edition: 'la-capitana' }, post: { eyebrow: '★ Edición Home ★',  headline: 'LA CAPITANA',             subline: 'Amarilla · $99K',                    bg: 'yellow', accent: 'ink' } },
    'drop-portera':      { promptName: 'drop',      promptArgs: { edition: 'la-portera'  }, post: { eyebrow: '★ Edición Away ★',  headline: 'LA PORTERA',              subline: 'Azul vintage · $99K',                bg: 'blue',   accent: 'yellow' } },
    'drop-oronegro':     { promptName: 'drop',      promptArgs: { edition: 'oro-negro'   }, post: { eyebrow: '★ Edición Premium ★', headline: 'ORO NEGRO',             subline: 'Negro + dorado · $99K',              bg: 'ink',    accent: 'yellow' } },
    'drop-cafetera':     { promptName: 'drop',      promptArgs: { edition: 'la-cafetera' }, post: { eyebrow: '★ Edición Alterna ★', headline: 'LA CAFETERA',           subline: 'Rojo pasión · $99K',                 bg: 'red',    accent: 'cream' } },
    'manifesto-quote':   { promptName: 'manifesto', promptArgs: {}, post: { eyebrow: '★ Manifiesto ★',  headline: 'ES BANDERA',               subline: 'Este body no es ropa',                bg: 'ink',    accent: 'yellow' } },
    'testimonial':       { promptName: 'review',    promptArgs: {}, post: { eyebrow: '★ La Tribuna ★',  headline: '★★★★★',                   subline: '500+ cafeteras esta semana',          bg: 'cream',  accent: 'red' } },
    'bundle-push':       { promptName: 'bundle',    promptArgs: {}, post: { eyebrow: '★ El Once Inicial ★', headline: '4 EDICIONES',         subline: 'Ahorra $267.000 · 2 gorras gratis',   bg: 'cream',  accent: 'red' } },
    'countdown-mundial': { promptName: 'countdown', promptArgs: {}, post: { eyebrow: '★ Mundial 2026 ★', headline: 'CUENTA REGRESIVA',        subline: 'Tu outfit · tu energía · tu día',     bg: 'red',    accent: 'yellow' } },
    'countdown-match':   { promptName: 'countdown', promptArgs: {}, post: { eyebrow: '★ Próximo Partido ★', headline: 'GAME WEEK',           subline: editionLabel + ' · listas para el partido', bg: editionColor, accent: 'ink' } },
    'match-day-hero':    { promptName: 'matchDay',  promptArgs: { opponent: day.match?.opponent || 'Uzbekistán', kickoffTime: day.match?.kickoff || '22:00', stadium: day.match?.stadium || '' }, post: { eyebrow: '★ Match Day ★',  headline: '¡VAMOS COLOMBIA!', subline: `vs ${day.match?.opponent || 'Uzbekistán'} · ${day.match?.kickoff || '22:00'}`, bg: 'red', accent: 'yellow' } },
    'ugc-recap':         { promptName: 'ugc',       promptArgs: {}, post: { eyebrow: '★ La Hinchada ★',  headline: 'TU LOOK NOS MATÓ',         subline: 'Repost de la semana',                 bg: 'cream',  accent: 'red' } },
    'mundial-opens':     { promptName: 'countdown', promptArgs: { daysToMundial: 0 }, post: { eyebrow: '★ HOY EMPIEZA ★', headline: 'MUNDIAL 2026',     subline: 'Sé Tricolor desde el silbatazo',      bg: 'yellow', accent: 'red' } },
    'group-stage-recap': { promptName: 'countdown', promptArgs: {}, post: { eyebrow: '★ Fase de Grupos ★', headline: 'GRUPO K',                subline: 'Lo que viene · knockouts',           bg: 'cream',  accent: 'blue' } },
  };
  return plans[postKey] || plans['drop-capitana'];
}

function carouselPlan(theme, day) {
  const slidesByTheme = {
    'las-4-ediciones': [
      { variant: 'cover',  eyebrow: '★ Mundial 2026 ★',  headline: 'LAS 4 EDICIONES',     subline: 'Una para cada estado de ánimo', bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: 'LA CAPITANA',      subline: 'Home · #10 Amarilla',  bg: 'yellow', accent: 'ink' },
      { variant: 'middle', headline: 'LA PORTERA',       subline: 'Away · #01 Azul',      bg: 'blue',   accent: 'yellow' },
      { variant: 'middle', headline: 'ORO NEGRO',        subline: 'Premium · #07',        bg: 'ink',    accent: 'yellow' },
      { variant: 'middle', headline: 'LA CAFETERA',      subline: 'Alterna · #09 Roja',   bg: 'red',    accent: 'yellow' },
      { variant: 'cta',    headline: 'ELEGÍ LA TUYA',    subline: '$99K · Contraentrega', cta: 'Pedir Ahora →', bg: 'cream', accent: 'red' },
    ],
    'guia-tallas': [
      { variant: 'cover',  eyebrow: '★ Guía de Tallas ★', headline: 'TU TALLA · S/M/L', subline: 'Sin adivinar', bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: 'TALLA S',          subline: '32-34 · Busto 80-87 cm', bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: 'TALLA M',          subline: '36-38 · Busto 88-95 cm', bg: 'yellow', accent: 'ink' },
      { variant: 'middle', headline: 'TALLA L',          subline: '40-42 · Busto 96-104 cm', bg: 'red', accent: 'cream' },
      { variant: 'cta',    headline: 'ENTRE DOS · LA MÁS AMPLIA', subline: 'El body abraza, no aprieta', cta: 'Asesoría Talla →', bg: 'cream', accent: 'red' },
    ],
    'como-funciona': [
      { variant: 'cover',  eyebrow: '★ Cómo Comprar ★',  headline: 'TRES PASOS',          subline: 'Cero drama',   bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: '01 · ESCRÍBENOS',  subline: 'WhatsApp con mensaje listo', bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: '02 · CONFIRMÁS',   subline: 'Asesoría de talla + dirección', bg: 'yellow', accent: 'ink' },
      { variant: 'cta',    headline: '03 · RECIBÍS Y PAGÁS', subline: '24-72h · Efectivo, Nequi, Daviplata', cta: 'Empezar →', bg: 'cream', accent: 'red' },
    ],
    'por-que-tricolor': [
      { variant: 'cover',  eyebrow: '★ Manifiesto ★',    headline: 'NACIMOS AMARILLAS', subline: 'Azules y rojas', bg: 'yellow', accent: 'red' },
      { variant: 'middle', headline: 'CANTANDO',         subline: 'El himno con la mano en el pecho', bg: 'blue', accent: 'yellow' },
      { variant: 'middle', headline: 'GRITAMOS',         subline: 'Cuando perdemos', bg: 'red', accent: 'cream' },
      { variant: 'middle', headline: 'TRIBUNA · SALA · CALLE', subline: 'Donde sea estás Tricolor', bg: 'cream', accent: 'red' },
      { variant: 'cta',    headline: 'ES BANDERA',       subline: 'Este body no es ropa', cta: 'Leer Más →', bg: 'ink', accent: 'yellow' },
    ],
    'once-inicial': [
      { variant: 'cover',  eyebrow: '★ El Once Inicial ★', headline: '4 BODIES · 1 PACK', subline: 'Las 4 ediciones del Mundial', bg: 'cream', accent: 'red' },
      { variant: 'middle', headline: 'AHORRAS $267.000', subline: '$329K en vez de $596K', bg: 'yellow', accent: 'ink' },
      { variant: 'cta',    headline: '+ 2 GORRAS GRATIS', subline: 'Tricolor oficial FCF', cta: 'Lo Quiero →', bg: 'red', accent: 'cream' },
    ],
  };
  return slidesByTheme[theme] || slidesByTheme['las-4-ediciones'];
}

async function maybeCaption({ promptName, promptArgs }, options) {
  if (options.noClaude) {
    return `[caption — generar después · ${promptName}]`;
  }
  try {
    const promptFn = PROMPTS[promptName];
    if (!promptFn) return `[no prompt mapped for ${promptName}]`;
    const prompt = promptFn(promptArgs || {});
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

  const manifest = { date, theme: plan.theme, edition_focus: plan.edition_focus, special: plan.special, items: [] };
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
      const caption = await maybeCaption(
        { promptName: seq.name === 'match-day' ? 'matchDay' : seq.name.replace(/-(\w)/g, (_, c) => c.toUpperCase()), promptArgs: seq.args },
        options
      );
      captions[id] = caption;
      manifest.items.push({
        id, kind: 'story', sequence: seq.name, step: story.step, role: story.role,
        offsetMin: story.offsetMin, headline: story.headline, subline: story.subline,
        bg: story.bg, accent: story.accent, sticker: story.sticker || null,
        file: filename, caption_key: id,
      });
      console.log(`  ✓ ${id} (${(png.length / 1024).toFixed(0)} KB)`);
    }
  }

  // ─── Feed posts ───
  for (const postKey of plan.posts) {
    const p = postPlan(postKey, plan);
    const id = `post-${postKey}`;
    const png = await renderPost(p.post);
    const filename = `${id}.png`;
    await writeFile(join(outDir, filename), png);
    const caption = await maybeCaption({ promptName: p.promptName, promptArgs: p.promptArgs }, options);
    captions[id] = caption;
    manifest.items.push({
      id, kind: 'post', key: postKey, ...p.post, file: filename, caption_key: id,
    });
    console.log(`  ✓ ${id} (${(png.length / 1024).toFixed(0)} KB)`);
  }

  // ─── Carousel ───
  if (plan.carousel) {
    const slides = carouselPlan(plan.carousel, plan);
    const buffers = await renderCarousel({ slides });
    const id = `carousel-${plan.carousel}`;
    const fileNames = [];
    for (let i = 0; i < buffers.length; i++) {
      const fn = `${id}-${String(i + 1).padStart(2, '0')}.png`;
      await writeFile(join(outDir, fn), buffers[i]);
      fileNames.push(fn);
    }
    const caption = await maybeCaption({ promptName: 'carousel', promptArgs: { type: plan.carousel } }, options);
    captions[id] = caption;
    manifest.items.push({
      id, kind: 'carousel', theme: plan.carousel, slideCount: buffers.length, files: fileNames, caption_key: id,
    });
    console.log(`  ✓ ${id} (${buffers.length} slides)`);
  }

  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(join(outDir, 'captions.json'), JSON.stringify(captions, null, 2));

  console.log(`\n✓ ${manifest.items.length} drafts → data/drafts/${date}/`);
}

main().catch((err) => {
  console.error('\n✗ build-day failed:', err.message || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
