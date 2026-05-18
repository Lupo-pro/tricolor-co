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
import { listStockpile, itemFacets, getItem, pngPath } from '../src/stockpile/index.js';
import { loadFavorites, toggleFavorite, isFavorite } from '../src/stockpile/favorites.js';
import { createRequire } from 'node:module';
import { createReadStream } from 'node:fs';
const _require = createRequire(import.meta.url);
const archiver = _require('archiver');

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

// runScript can hand the spawned ChildProcess back to the caller via
// `onChild` so the SSE handler keeps a reference and can SIGTERM it on
// a client disconnect — otherwise a long Claude-backed build keeps
// running even after the operator hit Cancel.
function runScript(scriptPath, args = [], { onChild } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    if (onChild) onChild(child);
    let out = '', err = '';
    child.stdout.on('data', (chunk) => out += chunk.toString());
    child.stderr.on('data', (chunk) => err += chunk.toString());
    child.on('close', (code, signal) => {
      if (code === 0) resolve({ ok: true, stdout: out });
      else if (signal === 'SIGTERM') reject(new Error('aborted'));
      else reject(new Error(err || `exit ${code}`));
    });
  });
}

// Single source of truth for the date format we accept anywhere user
// input touches a filesystem path or a child-process argument.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function isValidDateKey(s) { return typeof s === 'string' && DATE_RE.test(s); }

// ────── pages ──────
app.get('/', (_req, res) => res.redirect('/swipe'));
app.get('/swipe',    (_req, res) => res.sendFile(join(__dirname, 'public', 'swipe.html')));
app.get('/calendar', (_req, res) => res.sendFile(join(__dirname, 'public', 'calendar.html')));
app.get('/insights', (_req, res) => res.sendFile(join(__dirname, 'public', 'insights.html')));
app.get('/stockpile', (_req, res) => res.sendFile(join(__dirname, 'public', 'stockpile.html')));

// Serve draft PNGs through a controlled route so the dashboard can
// embed them without exposing the whole filesystem.
app.get('/assets/png/:date/:filename', async (req, res) => {
  const { date, filename } = req.params;
  // basename() rejects both `../foo` and `..\foo` (Windows-style) by
  // comparing against the cleaned form. Stricter than .includes('..').
  if (!isValidDateKey(date) || basename(filename) !== filename) {
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

// /api/days — list every date that has built drafts (looks at
// data/drafts/*) plus a per-day count of pending/approved/rejected so
// the day-tab strip in /swipe can render without N round-trips.
app.get('/api/days', async (_req, res) => {
  try {
    const { readdir } = await import('node:fs/promises');
    let entries = [];
    try {
      entries = await readdir(join(DATA_DIR, 'drafts'));
    } catch { /* drafts dir may not exist yet */ }
    const days = [];
    for (const name of entries.sort()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(name)) continue;
      const manifest = await readJson(join(DATA_DIR, 'drafts', name, 'manifest.json'), null);
      if (!manifest) continue;
      const approvedManifest = await readJson(join(DATA_DIR, 'approved', name, 'manifest.json'), { items: [] });
      const approvedIds = new Set(approvedManifest.items.map((i) => i.id));
      const total = manifest.items.length;
      const approved = manifest.items.filter((i) => approvedIds.has(i.id)).length;
      const rejected = manifest.items.filter((i) => i.rejected_at).length;
      const pending = total - approved - rejected;
      days.push({ date: name, total, approved, rejected, pending, theme: manifest.theme });
    }
    res.json({ ok: true, days });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
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
//
// Registered on BOTH GET and POST so:
//   - The browser fetch() with method:'POST' still works as before.
//   - `curl -N "http://localhost:3002/api/build-week?..."` (which
//     defaults to GET) also works for quick endpoint verification.
//   - A future EventSource client would also work (EventSource is
//     GET-only).
async function buildWeekHandler(req, res) {
  const count = Math.max(1, Math.min(60, parseInt(req.query.count, 10) || 7));
  const wantClaude = req.query.claude === '1' || req.query.claude === 'true';
  // `startDate` lets the client target "next week" without recomputing
  // here; defaults to today. `skipExisting` (default ON) makes
  // already-built days emit a `day-skipped` event instead of being
  // rebuilt — without this, hitting Build week on a fully-built week
  // would silently rebuild everything and look indistinguishable from
  // a hang.
  const startDate = req.query.startDate && isValidDateKey(req.query.startDate)
    ? req.query.startDate
    : todayKey();
  const skipExisting = req.query.skipExisting !== '0' && req.query.skipExisting !== 'false';

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
  if (res.socket && typeof res.socket.setNoDelay === 'function') {
    res.socket.setNoDelay(true);
  }
  res.flushHeaders();

  const emit = (obj) => {
    try { res.write(`data: ${JSON.stringify(obj)}\n\n`); }
    catch (e) { console.error('✗ SSE write failed:', e.message); }
  };

  // Detect a client that walked away mid-stream so we stop spending
  // CPU on builds for a dead connection. We also keep a handle to the
  // currently-running child so we can SIGTERM it immediately — without
  // this, a 30-day Build-month run ignores cancel for up to a full
  // day's build (~15 s without Claude, much longer with).
  let aborted = false;
  let currentChild = null;
  req.on('close', () => {
    if (!res.writableEnded) {
      aborted = true;
      console.warn('⚠ Client disconnected mid-stream — aborting batch.');
      if (currentChild && !currentChild.killed) {
        try { currentChild.kill('SIGTERM'); }
        catch (e) { console.error('  could not SIGTERM child:', e.message); }
      }
    }
  });

  // Wrap the whole sequence in a try/catch so a thrown exception in a
  // helper bubbles up as a `fatal` event and a stack trace in the
  // server console — instead of a silent hang.
  try {
    const start = new Date(startDate);
    const dates = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    console.log(`→ Build week started, count=${count} start=${startDate} skipExisting=${skipExisting} claude=${wantClaude}`);
    emit({ type: 'start', total: count, claude: wantClaude, dates, startDate, skipExisting });

    let totalDrafts = 0;
    let okDays = 0;
    let skippedDays = 0;
    const batchT0 = Date.now();

    for (let i = 0; i < dates.length; i++) {
      if (aborted) break;
      const date = dates[i];

      // Already built? Skip if requested. The skipped event keeps the
      // SSE stream flowing so the client never sees "no response".
      if (skipExisting) {
        const manifestPath = join(DATA_DIR, 'drafts', date, 'manifest.json');
        if (await exists(manifestPath)) {
          skippedDays++;
          console.log(`→ Day ${i + 1}/${count}: ${date} already built, skipping`);
          emit({ type: 'day-skipped', date, index: i + 1, total: count });
          continue;
        }
      }

      console.log(`→ Day ${i + 1}/${count}: building ${date}...`);
      emit({ type: 'day-start', date, index: i + 1, total: count });
      const args = [`--date=${date}`];
      if (!wantClaude) args.push('--no-claude');
      const dayT0 = Date.now();
      try {
        const r = await runScript(join(ROOT, 'src', 'build-day.js'), args, {
          onChild: (c) => { currentChild = c; },
        });
        currentChild = null;
        const m = r.stdout.match(/✓ (\d+) drafts/);
        const items = m ? parseInt(m[1], 10) : 0;
        totalDrafts += items;
        okDays++;
        const elapsed = Date.now() - dayT0;
        console.log(`→ Day ${i + 1}/${count}: done in ${elapsed}ms (${items} drafts)`);
        emit({ type: 'day-ok', date, items, elapsedMs: elapsed, index: i + 1, total: count });
      } catch (e) {
        currentChild = null;
        const elapsed = Date.now() - dayT0;
        if (aborted && /aborted|SIGTERM/i.test(e.message)) {
          console.log(`→ Day ${i + 1}/${count} (${date}) aborted after ${elapsed}ms`);
          break;
        }
        console.error(`✗ Day ${i + 1}/${count} (${date}) failed in ${elapsed}ms: ${e.message}`);
        emit({ type: 'day-error', date, error: e.message, elapsedMs: elapsed, index: i + 1, total: count });
      }
    }

    const totalElapsed = Date.now() - batchT0;
    console.log(`→ Build week complete: ${okDays}/${count} built · ${skippedDays} skipped · ${totalDrafts} drafts · ${totalElapsed}ms (aborted=${aborted})`);
    emit({ type: 'done', days: okDays, skipped: skippedDays, total_drafts: totalDrafts, elapsedMs: totalElapsed, aborted });
    res.end();
  } catch (e) {
    console.error('✗ Build week handler crashed:', e);
    try { emit({ type: 'fatal', error: e.message }); res.end(); } catch {}
  }
}

app.get ('/api/build-week', buildWeekHandler);
app.post('/api/build-week', buildWeekHandler);

app.post('/api/build-day', async (req, res) => {
  const date = (req.body && req.body.date) || todayKey();
  if (!isValidDateKey(date)) {
    return res.status(400).json({ ok: false, error: 'bad date — expected YYYY-MM-DD' });
  }
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

// /api/stockpile — flat aggregated view. Supports query filters:
// ?kind=story&angle=rebellion&edition=la-capitana&color=red
// facets are computed over the UNFILTERED set so the filter chips
// always show every option, with current-filter counts in `subset`.
app.get('/api/stockpile', async (req, res) => {
  try {
    const favoritesOnly = req.query.favorites === '1' || req.query.favorites === 'true';
    const filters = {
      kind:    req.query.kind    || null,
      angle:   req.query.angle   || null,
      edition: req.query.edition || null,
      color:   req.query.color   || null,
    };
    const all = await listStockpile({});
    let filtered = await listStockpile({ filters });
    const favs = new Set(await loadFavorites());
    if (favoritesOnly) filtered = filtered.filter((it) => favs.has(it.globalId));
    // Inline the favorite flag so the grid doesn't need a second round-trip
    for (const it of filtered) it.favorite = favs.has(it.globalId);
    res.json({
      ok: true,
      total: all.length,
      shown: filtered.length,
      favorites_total: favs.size,
      filters: { ...filters, favorites: favoritesOnly },
      facets: itemFacets(all),
      items: filtered,
    });
  } catch (e) {
    console.error('stockpile error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Detail endpoint for a single item — used when the operator opens
// the preview panel. Returns the same shape as one item in
// /api/stockpile but includes the full caption + all slide files.
app.get('/api/stockpile/item/:globalId(*)', async (req, res) => {
  try {
    const it = await getItem(req.params.globalId);
    if (!it) return res.status(404).json({ ok: false, error: 'not found' });
    const favs = new Set(await loadFavorites());
    it.favorite = favs.has(it.globalId);
    res.json({ ok: true, item: it });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ───── Favorites ─────
// Toggle is POST (state change), list is GET. The toggle endpoint
// returns the new boolean so the UI doesn't need to refetch.
app.get('/api/favorites', async (_req, res) => {
  try { res.json({ ok: true, ids: await loadFavorites() }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/favorites/toggle', async (req, res) => {
  const { globalId } = req.body || {};
  if (!globalId || typeof globalId !== 'string') {
    return res.status(400).json({ ok: false, error: 'globalId required' });
  }
  try {
    const favorite = await toggleFavorite(globalId);
    res.json({ ok: true, globalId, favorite });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Stream a ZIP of every favorited PNG (+ caption .txt) so the
// operator can drop the whole pile into their publishing tool. ZIP
// entries are named "<kind>/<safe-id>.png" + ".txt" so they're
// organized by type inside the archive.
app.get('/api/favorites/zip', async (_req, res) => {
  try {
    const ids = await loadFavorites();
    if (ids.length === 0) {
      return res.status(404).json({ ok: false, error: 'No favorites to download yet.' });
    }
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="latricolor-favorites-${todayKey()}.zip"`,
    });
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('warning', (w) => console.warn('zip warning:', w.message));
    archive.on('error', (e) => { console.error('zip error:', e); try { res.status(500).end(); } catch {} });
    archive.pipe(res);

    for (const globalId of ids) {
      const it = await getItem(globalId);
      if (!it) continue;
      const safe = it.id.replace(/[^a-z0-9_-]/gi, '_');
      const subdir = it.kind === 'carousel' ? 'carousels' : `${it.kind}s`;

      if (it.kind === 'carousel' && Array.isArray(it.files)) {
        for (let i = 0; i < it.files.length; i++) {
          const p = pngPath(it, i);
          archive.append(createReadStream(p), { name: `${subdir}/${safe}/${String(i + 1).padStart(2, '0')}.png` });
        }
      } else if (it.file) {
        archive.append(createReadStream(pngPath(it)), { name: `${subdir}/${safe}.png` });
      }

      if (it.caption) {
        archive.append(it.caption, { name: `${subdir}/${safe}.txt` });
      }
    }
    await archive.finalize();
  } catch (e) {
    console.error('favorites zip error:', e);
    try { res.status(500).json({ ok: false, error: e.message }); } catch {}
  }
});

app.post('/api/build-pack', async (req, res) => {
  const date = (req.body && req.body.date) || todayKey();
  if (!isValidDateKey(date)) {
    return res.status(400).json({ ok: false, error: 'bad date — expected YYYY-MM-DD' });
  }
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
