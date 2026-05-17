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

import { recordEvent, getInsights } from '../src/strategy/preferences.js';
import { planForDay } from '../src/strategy/content-mix.js';

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
app.get('/insights', (_req, res) => res.sendFile(join(__dirname, 'public', 'insights.html')));

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

// /api/plan/:date — returns the calendar-resolved plan (what WILL be
// generated). Used by the calendar view so days are never visually
// empty just because their drafts haven't been built yet.
app.get('/api/plan/:date', async (req, res) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.date)) return res.status(400).json({ ok: false, error: 'bad date' });
  try {
    const plan = await planForDay(req.params.date);
    // Also flag whether drafts have been built yet (saves the caller
    // a second round-trip).
    const draftDir = join(DATA_DIR, 'drafts', req.params.date);
    const built = await exists(join(draftDir, 'manifest.json'));
    res.json({ ok: true, plan, built });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
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

function claudeConfigured() {
  const k = process.env.ANTHROPIC_API_KEY;
  return Boolean(k && !k.startsWith('sk_xxx'));
}

// Lightweight status — used by the UI to know whether Claude is wired
// up so it can show the right label on the Build buttons.
app.get('/api/status', async (_req, res) => {
  res.json({
    ok: true,
    claude_configured: claudeConfigured(),
    today: todayKey(),
  });
});

// SSE streaming batch builder — used by Build week (7) and Build
// month (30). Each line emits a JSON event the client renders into a
// progress panel. Days run sequentially so a slow Claude doesn't pile
// up parallel calls; the SSE stream keeps the connection alive so the
// browser doesn't hit any default timeout.
app.post('/api/build-week', async (req, res) => {
  const count = Math.max(1, Math.min(60, parseInt(req.query.count, 10) || 7));
  const wantClaude = req.query.claude === '1' || req.query.claude === 'true';

  if (wantClaude && !claudeConfigured()) {
    return res.status(400).json({
      ok: false,
      error: 'ANTHROPIC_API_KEY is missing or placeholder. Untoggle "Use Claude" or fill content-machine/.env.',
      code: 'no-claude-key',
    });
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const emit = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  // Build the date list starting from today
  const today = new Date(todayKey());
  const dates = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  emit({ type: 'start', total: count, claude: wantClaude, dates });

  let totalDrafts = 0;
  let okDays = 0;

  for (const date of dates) {
    emit({ type: 'day-start', date });
    const args = [`--date=${date}`];
    if (!wantClaude) args.push('--no-claude');
    try {
      const r = await runScript(join(ROOT, 'src', 'build-day.js'), args);
      const m = r.stdout.match(/✓ (\d+) drafts/);
      const items = m ? parseInt(m[1], 10) : 0;
      totalDrafts += items;
      okDays++;
      emit({ type: 'day-ok', date, items });
    } catch (e) {
      console.error(`✗ build-week ${date}: ${e.message}`);
      emit({ type: 'day-error', date, error: e.message });
    }
  }

  emit({ type: 'done', days: okDays, total_drafts: totalDrafts });
  res.end();
});

app.post('/api/build-day', async (req, res) => {
  const date = (req.body && req.body.date) || todayKey();
  const wantClaude = !!(req.body && req.body.claude);
  // If the caller wants Claude but the server has no key, fail loudly
  // instead of silently degrading — the UI surfaces this in a toast.
  if (wantClaude && !claudeConfigured()) {
    return res.status(400).json({
      ok: false,
      error: 'ANTHROPIC_API_KEY is missing or placeholder. Fill content-machine/.env and restart, or untoggle "Use Claude".',
      code: 'no-claude-key',
    });
  }
  const args = [`--date=${date}`];
  if (!wantClaude) args.push('--no-claude');
  try {
    console.log(`▶ Triggering build-day for ${date} (claude=${wantClaude})...`);
    const r = await runScript(join(ROOT, 'src', 'build-day.js'), args);
    res.json({ ok: true, date, claude: wantClaude, stdout: r.stdout });
  } catch (e) {
    console.error(`✗ build-day ${date} failed: ${e.message}`);
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

  // Append/replace into approved manifest. First time around, copy the
  // day-level metadata (theme / edition_focus / special) from the
  // drafts manifest so the daily-pack README has it.
  const approvedManifest = await readJson(join(approvedDir, 'manifest.json'), { date, items: [] });
  approvedManifest.date = date;
  approvedManifest.theme = approvedManifest.theme || manifest.theme;
  approvedManifest.edition_focus = approvedManifest.edition_focus || manifest.edition_focus;
  approvedManifest.special = approvedManifest.special || manifest.special;
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
    // Record preference event — failure here must not fail the
    // approve action, only log.
    try { await recordEvent(approved, 'approved', approved.caption || ''); }
    catch (e) { console.warn(`  ⚠ recordEvent (approve): ${e.message}`); }
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
    for (const it of items) {
      const enriched = await copyApproved(date, it.id);
      approved.push(enriched);
      try { await recordEvent(enriched, 'approved', enriched.caption || ''); }
      catch (e) { console.warn(`  ⚠ recordEvent (approve-sequence): ${e.message}`); }
    }
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
    let rejectedItem = null;
    if (idx >= 0) {
      manifest.items[idx].rejected_at = new Date().toISOString();
      rejectedItem = manifest.items[idx];
      await writeJson(join(draftDir, 'manifest.json'), manifest);
    }
    if (rejectedItem) {
      const captions = await readJson(join(draftDir, 'captions.json'), {});
      const caption = captions[rejectedItem.caption_key] || '';
      try { await recordEvent(rejectedItem, 'rejected', caption); }
      catch (e) { console.warn(`  ⚠ recordEvent (reject): ${e.message}`); }
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

app.get('/api/insights', async (_req, res) => {
  try {
    const data = await getInsights();
    res.json({ ok: true, ...data });
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
