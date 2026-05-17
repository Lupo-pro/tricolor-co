// ============================================
// Local admin server — runs at http://localhost:3001
// Routes:
//   GET  /                       → redirects to /influencers
//   GET  /influencers            → swipe validation UI
//   GET  /dashboard              → outreach stats (added in commit 8)
//   GET  /api/enriched           → returns data/enriched.json
//   POST /api/save-validation    → writes data/validated.json
//   GET  /api/validated          → returns data/validated.json (if any)
//   GET  /api/stats              → aggregated stats (added in commit 8)
//   POST /api/mark-replied       → updates data/responses.json (commit 8)
// ============================================

import 'dotenv/config';
import express from 'express';
import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');

const PORT = parseInt(process.env.ADMIN_PORT || '3001', 10);

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

// ============================================
// Helpers
// ============================================
async function readJson(filename, fallback = null) {
  try {
    const txt = await readFile(join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(txt);
  } catch (e) {
    if (fallback !== null) return fallback;
    throw e;
  }
}
async function writeJson(filename, data) {
  await writeFile(join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}
async function exists(filename) {
  try { await access(join(DATA_DIR, filename)); return true; }
  catch { return false; }
}

// ============================================
// Pages
// ============================================
app.get('/', (req, res) => res.redirect('/influencers'));

app.get('/influencers', (req, res) => {
  res.sendFile(join(__dirname, 'influencers.html'));
});

// Dashboard is added in commit 8; route handler stays here so it
// returns a 404 with a friendly hint until then.
app.get('/dashboard', (req, res) => {
  res.sendFile(join(__dirname, 'dashboard.html'), (err) => {
    if (err) res.status(404).send('Dashboard not yet provisioned. Run later commits.');
  });
});

// ============================================
// API
// ============================================
app.get('/api/enriched', async (req, res) => {
  try {
    const data = await readJson('enriched.json', []);
    res.json({ ok: true, count: data.length, profiles: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/save-validation', async (req, res) => {
  try {
    const body = req.body || {};
    const payload = {
      approved: Array.isArray(body.approved) ? body.approved : [],
      premium:  Array.isArray(body.premium)  ? body.premium  : [],
      skipped:  Array.isArray(body.skipped)  ? body.skipped  : [],
      timestamp: new Date().toISOString(),
    };
    await writeJson('validated.json', payload);
    console.log(`✓ Saved validation: ${payload.approved.length} approved, ${payload.premium.length} premium, ${payload.skipped.length} skipped`);
    res.json({ ok: true, ...Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, Array.isArray(v) ? v.length : v])) });
  } catch (e) {
    console.error('save-validation failed:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/validated', async (req, res) => {
  const data = await readJson('validated.json', null);
  res.json({ ok: true, data });
});

// ============================================
// Boot
// ============================================
app.listen(PORT, () => {
  console.log(`\n══════════════════════════════════════`);
  console.log(`✓ Outreach admin running`);
  console.log(`  http://localhost:${PORT}/influencers   (validate scraped profiles)`);
  console.log(`  http://localhost:${PORT}/dashboard     (stats — once commits 7-8 land)`);
  console.log(`══════════════════════════════════════\n`);
});
