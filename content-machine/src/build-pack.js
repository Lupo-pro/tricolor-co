// ============================================
// build-pack.js — Build a "daily pack" ZIP from approved drafts.
//
// CLI:
//   node src/build-pack.js                  → today
//   node src/build-pack.js --date=2026-05-18
//
// Reads data/approved/{date}/manifest.json (populated by the admin
// dashboard's /api/approve endpoint), then writes a structured ZIP at
// data/daily-packs/{date}.zip with everything needed to publish the
// day manually from an iPhone:
//
//   /{date}/
//     README.md            chronological schedule + captions copy-paste
//     posts/
//       11-30-key.png
//       11-30-key.caption.txt
//     stories/
//       09-00-daily-drop-01-hook.png
//       09-00-daily-drop-01-hook.caption.txt
//     carousels/
//       12-00-las-4-ediciones/
//         01-slide.png  02-slide.png  ...
//         caption.txt
//
// Schedule defaults (Colombia time):
//   First sequence anchors at 09:00
//   Second sequence anchors at 15:00
//   Feed posts:   11:30, 18:30
//   Carousels:    12:00
//   (Nothing between 22:00 and 08:00)
// ============================================

import { mkdir, writeFile, readFile, copyFile, access, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// archiver is CommonJS; createRequire bridges it into our ESM module.
const require = createRequire(import.meta.url);
const archiver = require('archiver');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');

function todayKey() { return new Date().toISOString().slice(0, 10); }

function parseArgs() {
  const args = {};
  for (const raw of process.argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    if (eq === -1) args[raw.slice(2)] = true;
    else args[raw.slice(2, eq)] = raw.slice(eq + 1);
  }
  return args;
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

function fmtTime(minutesFromMidnight) {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function fmtTimeSlug(minutesFromMidnight) {
  return fmtTime(minutesFromMidnight).replace(':', '-');
}

// Anchors per sequence so the first story posts at a sensible hour
// and the rest fall out from each story's offsetMin.
const SEQUENCE_ANCHORS_MIN = [9 * 60, 15 * 60, 19 * 60]; // 09:00, 15:00, 19:00

// Schedule items by category.
// Returns:
//   posts: [{ item, timeMin }]
//   stories: [{ item, timeMin, sequence, sequenceIdx }]
//   carousels: [{ item, timeMin }]
function buildSchedule(items) {
  const stories = [];
  const posts = [];
  const carousels = [];

  // Group stories by sequence, preserving insertion order.
  const sequenceMap = new Map();
  for (const it of items) {
    if (it.kind !== 'story') continue;
    if (!sequenceMap.has(it.sequence)) sequenceMap.set(it.sequence, []);
    sequenceMap.get(it.sequence).push(it);
  }

  let seqIdx = 0;
  for (const [seqName, seqItems] of sequenceMap) {
    const anchor = SEQUENCE_ANCHORS_MIN[Math.min(seqIdx, SEQUENCE_ANCHORS_MIN.length - 1)];
    // Sort by step (which should == ascending offsetMin already, but
    // be defensive).
    const sorted = seqItems.slice().sort((a, b) => (a.step || 0) - (b.step || 0));
    // Each story's offsetMin is RELATIVE to the sequence start.
    const firstOffset = sorted[0]?.offsetMin || 0;
    for (const story of sorted) {
      const relMin = (story.offsetMin ?? 0) - firstOffset;
      let timeMin = anchor + relMin;
      // Clamp out of allowed window (22:00–08:00) — push next day's
      // stories to 08:00. The match-day sequence intentionally
      // spans across midnight; we cap silently.
      while (timeMin < 8 * 60)  timeMin += 24 * 60;
      while (timeMin > 22 * 60) timeMin = 22 * 60;
      stories.push({ item: story, timeMin, sequence: seqName, sequenceIdx: seqIdx });
    }
    seqIdx += 1;
  }

  // Posts: 11:30 first, 18:30 second.
  const postTimes = [11 * 60 + 30, 18 * 60 + 30];
  let pi = 0;
  for (const it of items) {
    if (it.kind !== 'post') continue;
    const timeMin = postTimes[Math.min(pi, postTimes.length - 1)];
    posts.push({ item: it, timeMin });
    pi += 1;
  }

  // Carousels: 12:00.
  let ci = 0;
  for (const it of items) {
    if (it.kind !== 'carousel') continue;
    posts.length; // no-op
    carousels.push({ item: it, timeMin: 12 * 60 + ci * 30 });
    ci += 1;
  }

  return { stories, posts, carousels };
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function renderReadme({ date, manifest, schedule }) {
  const lines = [];
  lines.push(`# LATRICOLOR.CO · Daily Pack · ${date}`);
  lines.push('');
  lines.push(`> Theme: **${manifest.theme || '—'}**  ·  Edition focus: **${manifest.edition_focus || '—'}**${manifest.special ? `  ·  Special: **${manifest.special}**` : ''}`);
  lines.push('');
  lines.push(`Pack généré à ${new Date().toISOString()}. Heures en **Colombia time (COT, UTC-5)**.`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Combine everything into a single chronological timeline.
  const timeline = [
    ...schedule.stories.map((x) => ({ ...x, kind: 'story' })),
    ...schedule.posts.map((x) => ({ ...x, kind: 'post' })),
    ...schedule.carousels.map((x) => ({ ...x, kind: 'carousel' })),
  ].sort((a, b) => a.timeMin - b.timeMin);

  lines.push('## ⏱ Planning chronologique');
  lines.push('');
  lines.push('| Hora | Tipo | Item | Archivo |');
  lines.push('|---:|---|---|---|');
  for (const entry of timeline) {
    const time = fmtTime(entry.timeMin);
    if (entry.kind === 'story') {
      lines.push(`| **${time}** | 📱 Story | ${entry.item.sequence} · #${entry.item.step} ${entry.item.role} | stories/${fmtTimeSlug(entry.timeMin)}-${entry.item.sequence}-${String(entry.item.step).padStart(2, '0')}-${entry.item.role}.png |`);
    } else if (entry.kind === 'post') {
      lines.push(`| **${time}** | 📰 Post | ${entry.item.key || entry.item.id} | posts/${fmtTimeSlug(entry.timeMin)}-${slugify(entry.item.key || entry.item.id)}.png |`);
    } else {
      lines.push(`| **${time}** | 🎠 Carousel | ${entry.item.theme} (${entry.item.slideCount} slides) | carousels/${fmtTimeSlug(entry.timeMin)}-${slugify(entry.item.theme)}/ |`);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## 📋 Captions copy-paste');
  lines.push('');
  lines.push('Para cada item, copia el caption y pégalo en Instagram al subir el archivo correspondiente.');
  lines.push('');

  for (const entry of timeline) {
    const time = fmtTime(entry.timeMin);
    const caption = (entry.item.caption || '').trim() || '_(sin caption — generar manualmente)_';
    if (entry.kind === 'story') {
      lines.push(`### ${time} · 📱 Story · ${entry.item.sequence} · #${entry.item.step} ${entry.item.role}`);
      lines.push('');
      lines.push(`**Archivo:** \`stories/${fmtTimeSlug(entry.timeMin)}-${entry.item.sequence}-${String(entry.item.step).padStart(2, '0')}-${entry.item.role}.png\``);
      if (entry.item.sticker && entry.item.sticker.type) {
        const s = entry.item.sticker;
        lines.push(`**Sticker recomendado:** \`${s.type}\`${s.label ? ` "${s.label}"` : ''}${s.url ? ` → ${s.url}` : ''}${s.question ? ` "${s.question}"` : ''}${s.options ? ' (opciones: ' + s.options.join(' / ') + ')' : ''}`);
      }
    } else if (entry.kind === 'post') {
      lines.push(`### ${time} · 📰 Post · ${entry.item.key || entry.item.id}`);
      lines.push('');
      lines.push(`**Archivo:** \`posts/${fmtTimeSlug(entry.timeMin)}-${slugify(entry.item.key || entry.item.id)}.png\``);
    } else {
      lines.push(`### ${time} · 🎠 Carousel · ${entry.item.theme}`);
      lines.push('');
      lines.push(`**Carpeta:** \`carousels/${fmtTimeSlug(entry.timeMin)}-${slugify(entry.item.theme)}/\` (${entry.item.slideCount} slides — sube en orden 01 → ${String(entry.item.slideCount).padStart(2, '0')})`);
    }
    lines.push('');
    lines.push('```');
    lines.push(caption);
    lines.push('```');
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 📲 Workflow iPhone');
  lines.push('');
  lines.push('1. AirDrop ce ZIP du Mac vers ton iPhone (ou télécharge depuis le dashboard).');
  lines.push('2. iPhone → Files → ouvre le ZIP → Décompresse.');
  lines.push('3. À chaque heure planifiée :');
  lines.push('   - Ouvre Instagram');
  lines.push('   - Stories : Crear story → Galería → sélectionne le PNG');
  lines.push('   - Posts : + → Publicación → sélectionne le PNG');
  lines.push('   - Carousels : + → Publicación → "Seleccionar varios" → sélectionne en ordre 01 → N');
  lines.push('4. Caption : retourne au README → copie le bloc correspondant → colle dans IG.');
  lines.push('5. Ajoute le sticker recommandé si applicable (link, poll, countdown).');
  lines.push('');
  lines.push('Sé Fuerte. Sé Fiera. Sé Tricolor 🇨🇴');

  return lines.join('\n');
}

async function main() {
  const args = parseArgs();
  const date = args.date || todayKey();
  console.log(`▶ build-pack · ${date}`);

  const approvedDir = join(DATA_DIR, 'approved', date);
  const manifestPath = join(approvedDir, 'manifest.json');
  if (!(await exists(manifestPath))) {
    console.error(`✗ No approved manifest at ${manifestPath}.`);
    console.error('  Approve at least one item in the dashboard first.');
    process.exit(1);
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  const items = manifest.items || [];
  if (!items.length) {
    console.error('✗ Approved manifest is empty.');
    process.exit(1);
  }
  console.log(`  ${items.length} approved items`);

  const schedule = buildSchedule(items);
  console.log(`  → ${schedule.stories.length} stories · ${schedule.posts.length} posts · ${schedule.carousels.length} carousels`);

  // Build the temp folder tree, then ZIP it.
  const stagingDir = join(DATA_DIR, 'daily-packs', `_staging-${date}`);
  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });
  await mkdir(join(stagingDir, 'stories'), { recursive: true });
  await mkdir(join(stagingDir, 'posts'), { recursive: true });
  await mkdir(join(stagingDir, 'carousels'), { recursive: true });

  // Stories
  for (const { item, timeMin } of schedule.stories) {
    const fn = `${fmtTimeSlug(timeMin)}-${item.sequence}-${String(item.step).padStart(2, '0')}-${item.role}.png`;
    await copyFile(join(approvedDir, item.file), join(stagingDir, 'stories', fn));
    await writeFile(join(stagingDir, 'stories', fn.replace(/\.png$/, '.caption.txt')), item.caption || '');
  }

  // Posts
  for (const { item, timeMin } of schedule.posts) {
    const slug = slugify(item.key || item.id);
    const fn = `${fmtTimeSlug(timeMin)}-${slug}.png`;
    await copyFile(join(approvedDir, item.file), join(stagingDir, 'posts', fn));
    await writeFile(join(stagingDir, 'posts', fn.replace(/\.png$/, '.caption.txt')), item.caption || '');
  }

  // Carousels — each goes into a subfolder so the order is clear.
  for (const { item, timeMin } of schedule.carousels) {
    const sub = `${fmtTimeSlug(timeMin)}-${slugify(item.theme)}`;
    const subDir = join(stagingDir, 'carousels', sub);
    await mkdir(subDir, { recursive: true });
    let n = 1;
    for (const f of item.files) {
      const dest = join(subDir, `${String(n).padStart(2, '0')}-slide.png`);
      await copyFile(join(approvedDir, f), dest);
      n += 1;
    }
    await writeFile(join(subDir, 'caption.txt'), item.caption || '');
  }

  // README at the root of the staging dir.
  const readme = renderReadme({ date, manifest, schedule });
  await writeFile(join(stagingDir, 'README.md'), readme);

  // ZIP it.
  const outDir = join(DATA_DIR, 'daily-packs');
  await mkdir(outDir, { recursive: true });
  const zipPath = join(outDir, `${date}.zip`);
  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(stagingDir, date); // archive contents under /{date}/
    archive.finalize();
  });

  // Clean staging
  await rm(stagingDir, { recursive: true, force: true });

  const stats = await import('node:fs/promises').then((fs) => fs.stat(zipPath));
  console.log(`\n✓ ZIP ready: data/daily-packs/${date}.zip (${(stats.size / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error('\n✗ build-pack failed:', err.message || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
