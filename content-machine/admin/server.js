// ============================================
// admin/server.js — Local Express dashboard on :3002.
//
// Routes:
//   GET  /                              redirect → /swipe
//   GET  /swipe                         Tinder-style validation UI
//   GET  /calendar                      7-day plan view
//   GET  /assets/...                    static (admin/public/assets/)
//   GET  /assets/png/:date/:filename    serves draft PNGs
//
// API:
//   GET  /api/today                     manifest + captions for today
//   GET  /api/day/:date                 same for an arbitrary date
//   POST /api/build-day                 trigger build-day.js for today
//   POST /api/approve                   approve one item → copies PNG to data/approved/{date}/
//   POST /api/approve-sequence          approve every item of a sequence in one call
//   POST /api/reject                    drop the item from the queue (marks rejected in manifest)
//   POST /api/edit-caption              update captions.json
//   POST /api/build-pack                trigger pack builder (commit 7)
// ============================================

import 'dotenv/config';
import express from 'express';
import { spawn } from 'node:child_process';
import { readFile, writeFile, copyFile, mkdir, access } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');

const PORT = parseInt(process.env.DASHBOARD_PORT || '3002', 10);

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use('/assets', express.static(join(__dirname, 'public', 'assets')));

// ────── helpers ──────
const todayKey = () => new Date().toISOString().slice(0, 10);

const NO_FALLBACK = Symbol('no-fallback');
async function readJson(filePath, fallback = NO_FALLBACK) {
  try {
    const txt = await readFile(filePath, 'utf-8');
    return JSON.parse(txt);
  } catch (e) {
    if (fallback !== NO_FALLBACK) return fallback;
    throw e;
  }
}
async function writeJson(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2));
}
async function exists(p) { try { await access(p); return true; } catch { return false; } }

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', (chunk) => out += chunk.toString());
    child.stderr.on('data', (chunk) => err += chunk.toString());
    child.on('close', (code) => {
      if (code === 0) resolve({ ok: true, stdout: out });
      else reject(new Error(err || `exit ${code}`));
    });
  });
}

// ────── pages ──────
app.get('/', (_req, res) => res.redirect('/swipe'));
app.get('/swipe',    (_req, res) => res.sendFile(join(__dirname, 'public', 'swipe.html')));
app.get('/calendar', (_req, res) => res.sendFile(join(__dirname, 'public', 'calendar.html')));

// Serve draft PNGs through a controlled route so the dashboard can
// embed them without exposing the whole filesystem.
app.get('/assets/png/:date/:filename', async (req, res) => {
  const { date, filename } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || filename.includes('..')) {
    return res.status(400).end();
  }
  const path = join(DATA_DIR, 'drafts', date, filename);
  if (!(await exists(path))) return res.status(404).end();
  res.sendFile(path);
});

// ────── api ──────
app.get('/api/today', async (_req, res) => {
  const date = todayKey();
  await respondWithDay(res, date);
});

app.get('/api/day/:date', async (req, res) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.date)) return res.status(400).json({ ok: false, error: 'bad date' });
  await respondWithDay(res, req.params.date);
});

async function respondWithDay(res, date) {
  const draftDir = join(DATA_DIR, 'drafts', date);
  const manifest = await readJson(join(draftDir, 'manifest.json'), null);
  const captions = await readJson(join(draftDir, 'captions.json'), {});
  const approvedDir = join(DATA_DIR, 'approved', date);
  const approvedManifest = await readJson(join(approvedDir, 'manifest.json'), { items: [] });
  const approvedIds = new Set(approvedManifest.items.map((i) => i.id));
  res.json({ ok: true, date, manifest, captions, approvedIds: [...approvedIds] });
}

app.post('/api/build-day', async (req, res) => {
  const date = (req.body && req.body.date) || todayKey();
  const noClaude = req.body && req.body.noClaude;
  const args = [`--date=${date}`];
  if (noClaude) args.push('--no-claude');
  try {
    console.log(`▶ Triggering build-day for ${date}...`);
    const r = await runScript(join(ROOT, 'src', 'build-day.js'), args);
    res.json({ ok: true, stdout: r.stdout });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

async function copyApproved(date, itemId) {
  const draftDir = join(DATA_DIR, 'drafts', date);
  const approvedDir = join(DATA_DIR, 'approved', date);
  await mkdir(approvedDir, { recursive: true });

  const manifest = await readJson(join(draftDir, 'manifest.json'));
  const captions = await readJson(join(draftDir, 'captions.json'), {});
  const item = manifest.items.find((i) => i.id === itemId);
  if (!item) throw new Error(`unknown item ${itemId}`);

  // Copy the PNG(s) — single for posts/stories, multi for carousels.
  const files = item.kind === 'carousel' ? item.files : [item.file];
  for (const f of files) {
    await copyFile(join(draftDir, f), join(approvedDir, f));
  }

  // Append/replace into approved manifest.
  const approvedManifest = await readJson(join(approvedDir, 'manifest.json'), { date, items: [] });
  approvedManifest.date = date;
  const exIdx = approvedManifest.items.findIndex((i) => i.id === itemId);
  const enriched = { ...item, caption: captions[item.caption_key] || '', approved_at: new Date().toISOString() };
  if (exIdx >= 0) approvedManifest.items[exIdx] = enriched;
  else approvedManifest.items.push(enriched);
  await writeJson(join(approvedDir, 'manifest.json'), approvedManifest);

  return enriched;
}

app.post('/api/approve', async (req, res) => {
  const { date, id } = req.body || {};
  if (!date || !id) return res.status(400).json({ ok: false, error: 'date + id required' });
  try {
    const approved = await copyApproved(date, id);
    res.json({ ok: true, approved });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/approve-sequence', async (req, res) => {
  const { date, sequence } = req.body || {};
  if (!date || !sequence) return res.status(400).json({ ok: false, error: 'date + sequence required' });
  try {
    const draftDir = join(DATA_DIR, 'drafts', date);
    const manifest = await readJson(join(draftDir, 'manifest.json'));
    const items = manifest.items.filter((i) => i.kind === 'story' && i.sequence === sequence);
    const approved = [];
    for (const it of items) approved.push(await copyApproved(date, it.id));
    res.json({ ok: true, count: approved.length, approved });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/reject', async (req, res) => {
  const { date, id } = req.body || {};
  if (!date || !id) return res.status(400).json({ ok: false, error: 'date + id required' });
  try {
    const draftDir = join(DATA_DIR, 'drafts', date);
    const manifest = await readJson(join(draftDir, 'manifest.json'));
    const idx = manifest.items.findIndex((i) => i.id === id);
    if (idx >= 0) {
      manifest.items[idx].rejected_at = new Date().toISOString();
      await writeJson(join(draftDir, 'manifest.json'), manifest);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/edit-caption', async (req, res) => {
  const { date, id, caption } = req.body || {};
  if (!date || !id || typeof caption !== 'string') {
    return res.status(400).json({ ok: false, error: 'date + id + caption required' });
  }
  try {
    const draftDir = join(DATA_DIR, 'drafts', date);
    const captions = await readJson(join(draftDir, 'captions.json'), {});
    captions[id] = caption;
    await writeJson(join(draftDir, 'captions.json'), captions);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/build-pack', async (req, res) => {
  const date = (req.body && req.body.date) || todayKey();
  try {
    console.log(`▶ Triggering pack builder for ${date}...`);
    const r = await runScript(join(ROOT, 'src', 'build-pack.js'), [`--date=${date}`]);
    res.json({ ok: true, stdout: r.stdout, zipUrl: `/assets/pack/${date}.zip` });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Serve the built ZIP if it exists
app.get('/assets/pack/:date.zip', async (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).end();
  const path = join(DATA_DIR, 'daily-packs', `${date}.zip`);
  if (!(await exists(path))) return res.status(404).send('Pack not generated yet. POST /api/build-pack first.');
  res.download(path, `latricolor-${date}.zip`);
});

// ────── boot ──────
app.listen(PORT, () => {
  console.log(`\n══════════════════════════════════════`);
  console.log(`✓ Content-machine admin running`);
  console.log(`  http://localhost:${PORT}/swipe      (validate drafts)`);
  console.log(`  http://localhost:${PORT}/calendar   (7-day plan)`);
  console.log(`══════════════════════════════════════\n`);
});
