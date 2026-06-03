// ============================================
// test-layouts.js — Renders one sample of every templater layout
// to data/layout-tests/ for visual verification.
//   node src/test-layouts.js
// ============================================

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderPost, POST_LAYOUTS } from './templater/post.js';
import { renderStory, STORY_LAYOUTS } from './templater/story.js';
import { renderCarousel, CAROUSEL_LAYOUTS } from './templater/carousel.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'data', 'layout-tests');

const postSamples = {
  'typo-pure':         { eyebrow: 'EDICIÓN HOME', headline: 'LA CAPITANA', subline: 'Amarilla · $99K', bg: 'yellow', accent: 'red' },
  'typo-silhouette':   { eyebrow: '#10 AMARILLA', headline: 'LA CAPITANA', subline: 'Edición Home', bg: 'cream', accent: 'red', silhouette: 'yellow', number: 10 },
  'split-screen':      { eyebrow: 'MUNDIAL 2026', subline: 'Sé Tricolor desde hoy', headline: 'ES BANDERA', bg: 'yellow', bottom: 'ink', accent: 'red' },
  'photo-placeholder': { eyebrow: 'NEW DROP', headline: 'ORO NEGRO', subline: 'Negro + dorado · $99K', bg: 'cream', accent: 'red', photoLabel: 'NAY · ORO NEGRO' },
  'quote-fullbg':      { headline: 'ESTO NO ES ROPA · ES BANDERA', subline: 'Manifiesto Tricolor', bg: 'red', accent: 'yellow' },
  'quote-crema':       { headline: 'NACIDOS PARA CELEBRAR', subline: 'Las hinchas cafeteras', bg: 'cream', footer: 'LATRICOLOR.CO' },
  'numbers':           { eyebrow: 'LA TRIBUNA', value: '127', label: 'CAFETERAS ESTA SEMANA', bg: 'cream', accent: 'red' },
  'comparison':        { left: { label: 'ANTES', headline: 'CAMISETA', bg: 'cream' }, right: { label: 'AHORA', headline: 'BODY', bg: 'red' }, footer: 'LA EVOLUCIÓN' },
};

const storySamples = {
  'hook-center':         { headline: 'SABES QUÉ PASA HOY?', subline: 'A las 7pm exacto', bg: 'cream', accent: 'yellow' },
  'hook-split':          { headline: 'LISTA PARA EL MUNDIAL?', subline: 'Sólo 25 días', bg: 'cream', accent: 'red' },
  'sticker-placeholder': { headline: 'PREGÚNTANOS', subline: 'Toca el sticker abajo', bg: 'ink', accent: 'yellow' },
  'quote-center':        { headline: 'ESTO NO ES ROPA · ES BANDERA', subline: 'Manifiesto', bg: 'red', accent: 'yellow' },
  'numbers':             { eyebrow: 'CONTANDO LOS DÍAS', value: '25', label: 'DÍAS AL MUNDIAL', bg: 'yellow', accent: 'ink' },
  'question':            { question: 'CUÁL EDICIÓN ERES?', answers: ['LA CAPITANA', 'LA PORTERA', 'ORO NEGRO', 'LA CAFETERA'], bg: 'cream', accent: 'red' },
  'bts':                 { eyebrow: 'BEHIND THE SCENES', headline: 'CONFECCIÓN A MANO', subline: 'Bogotá · 5am', bg: 'cream', accent: 'red' },
  'match-score':         { home: { name: 'COL', score: 1, color: 'yellow' }, away: { name: 'UZB', score: 0, color: 'cream' }, eyebrow: 'MINUTO 67', subline: 'James · gol al ángulo' },
};

const carouselSamples = {
  'educational': { slides: [
    { variant: 'cover', headline: 'EL MUNDIAL EN 5 DATOS', subline: 'Lo que tenés que saber', bg: 'cream', accent: 'red' },
    { variant: 'stat',  value: '3', label: 'PAÍSES SEDES', subline: 'México · USA · Canadá', bg: 'yellow', accent: 'red' },
    { variant: 'stat',  value: '48', label: 'SELECCIONES', subline: 'Por primera vez', bg: 'blue', accent: 'yellow' },
    { variant: 'stat',  value: '104', label: 'PARTIDOS', subline: 'Más que nunca', bg: 'red', accent: 'yellow' },
    { variant: 'cta',   headline: 'ESTÁ MÁS CERCA QUE NUNCA', subline: 'Sé Tricolor', cta: 'Pedir Ahora', bg: 'cream', accent: 'red' },
  ] },
  'guide': { slides: [
    { variant: 'cover', headline: 'CÓMO COMPRAR', subline: 'Tres pasos · cero drama', bg: 'cream', accent: 'red' },
    { variant: 'step', step: '01', headline: 'ESCRÍBENOS', subline: 'WhatsApp con mensaje listo', bg: 'cream', accent: 'red' },
    { variant: 'step', step: '02', headline: 'CONFIRMÁS', subline: 'Asesoría talla + dirección', bg: 'yellow', accent: 'ink' },
    { variant: 'step', step: '03', headline: 'RECIBÍS', subline: 'Contraentrega 24-48h', bg: 'red', accent: 'cream' },
    { variant: 'cta', headline: 'YA ESTÁS LISTA', cta: 'Pedir Ahora', bg: 'cream', accent: 'red' },
  ] },
  'mood': { slides: [
    { variant: 'cover', headline: 'CUÁL ERES TÚ', subline: '4 ediciones · 4 estados de ánimo', bg: 'cream', accent: 'red' },
    { variant: 'mood', headline: 'LA CAPITANA', subline: 'Vos liderás', bg: 'yellow', accent: 'ink', silhouette: 'yellow', number: 10 },
    { variant: 'mood', headline: 'LA PORTERA', subline: 'Vos defendés', bg: 'blue', accent: 'yellow', silhouette: 'blue', number: 1 },
    { variant: 'mood', headline: 'ORO NEGRO', subline: 'Vos brillás', bg: 'ink', accent: 'yellow', silhouette: 'ink', number: 7 },
    { variant: 'mood', headline: 'LA CAFETERA', subline: 'Vos hervís', bg: 'red', accent: 'cream', silhouette: 'red', number: 9 },
  ] },
  'storytelling': { slides: [
    { variant: 'cover', headline: 'ESTO NO ES ROPA', subline: 'Es bandera', bg: 'ink', accent: 'yellow' },
    { variant: 'narrative', headline: 'CADA EDICIÓN', subline: 'Cuenta una historia', bg: 'yellow', accent: 'red' },
    { variant: 'narrative', headline: 'CADA HINCHA', subline: 'Es una sede', bg: 'red', accent: 'yellow' },
    { variant: 'narrative', headline: 'CADA PARTIDO', subline: 'Es un manifiesto', bg: 'blue', accent: 'yellow' },
    { variant: 'cta', headline: 'SÉ TRICOLOR', subline: '4 ediciones · Mundial 2026', cta: 'Empezar', bg: 'cream', accent: 'red' },
  ] },
  'comparison': { slides: [
    { variant: 'cover', headline: 'ANTES VS AHORA', subline: 'La evolución de la hincha', bg: 'cream', accent: 'red' },
    { variant: 'split', left: { label: 'ANTES', headline: 'TALLA UNI', bg: 'cream' }, right: { label: 'AHORA', headline: 'S · M · L', bg: 'red' } },
    { variant: 'split', left: { label: 'ANTES', headline: 'CAMISETA', bg: 'cream' }, right: { label: 'AHORA', headline: 'BODY', bg: 'yellow' } },
    { variant: 'split', left: { label: 'ANTES', headline: 'GENÉRICO', bg: 'cream' }, right: { label: 'AHORA', headline: '4 EDICIONES', bg: 'ink' } },
    { variant: 'cta', headline: 'BIENVENIDA AL FUTURO', cta: 'Pedir Ahora', bg: 'cream', accent: 'red' },
  ] },
};

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`▶ test-layouts → ${OUT}\n`);

  for (const layout of POST_LAYOUTS) {
    const desc = { ...postSamples[layout], layout };
    const buf = await renderPost(desc);
    await writeFile(join(OUT, `post-${layout}.png`), buf);
    console.log(`  ✓ post-${layout}.png`);
  }

  for (const layout of STORY_LAYOUTS) {
    const desc = { ...storySamples[layout], layout };
    const buf = await renderStory(desc);
    await writeFile(join(OUT, `story-${layout}.png`), buf);
    console.log(`  ✓ story-${layout}.png`);
  }

  for (const layout of CAROUSEL_LAYOUTS) {
    const desc = { ...carouselSamples[layout], layout };
    const bufs = await renderCarousel(desc);
    for (let i = 0; i < bufs.length; i++) {
      await writeFile(join(OUT, `carousel-${layout}-${String(i + 1).padStart(2, '0')}.png`), bufs[i]);
    }
    console.log(`  ✓ carousel-${layout} (${bufs.length} slides)`);
  }

  console.log(`\n✓ wrote ${OUT}`);
}

main().catch((err) => {
  console.error('✗ test-layouts failed:', err);
  process.exit(1);
});
