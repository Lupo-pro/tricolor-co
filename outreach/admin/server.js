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
// Dashboard support endpoints
// ============================================
function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function startOfWeekIso() {
  const d = new Date();
  const dow = d.getDay() || 7;
  d.setDate(d.getDate() - (dow - 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

app.get('/api/stats', async (req, res) => {
  try {
    const enriched = await readJson('enriched.json', []);
    const validated = await readJson('validated.json', null);
    const sent = await readJson('sent.json', []);
    const responses = await readJson('responses.json', []);
    const warm = await readJson('warmup-day.json', null);

    const today = startOfTodayIso();
    const week = startOfWeekIso();

    const sentOk = sent.filter((s) => s.status === 'sent');
    const sentToday = sentOk.filter((s) => s.sent_at >= today).length;
    const sentWeek  = sentOk.filter((s) => s.sent_at >= week).length;
    const failed = sent.filter((s) => s.status === 'failed').length;
    const bounceRate = sent.length ? Math.round((failed / sent.length) * 1000) / 10 : 0;

    const repliedHandles = new Set(responses.map((r) => r.username));
    const sentHandles = new Set(sentOk.map((s) => s.username));
    const repliedCount = [...repliedHandles].filter((h) => sentHandles.has(h)).length;
    const replyRate = sentHandles.size ? Math.round((repliedCount / sentHandles.size) * 1000) / 10 : 0;

    const approvedCount = (validated?.approved?.length || 0) + (validated?.premium?.length || 0);
    const skippedCount = validated?.skipped?.length || 0;
    const scrapedCount = enriched.length + skippedCount; // rough proxy
    const filteredCount = enriched.length;

    res.json({
      ok: true,
      stats: {
        emails: {
          total: sentOk.length,
          today: sentToday,
          week: sentWeek,
          failed,
          bounce_rate: bounceRate,
        },
        responses: { count: repliedCount, rate: replyRate },
        funnel: {
          scraped: scrapedCount,
          filtered: filteredCount,
          approved: approvedCount,
          sent: sentHandles.size,
          replied: repliedCount,
        },
        warmup: warm || null,
      },
    });
  } catch (e) {
    console.error('stats failed:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/leads', async (req, res) => {
  try {
    const validated = await readJson('validated.json', { approved: [], premium: [] });
    const sent = await readJson('sent.json', []);
    const responses = await readJson('responses.json', []);

    const pool = [
      ...(validated.premium || []).map((c) => ({ ...c, tier: 'premium' })),
      ...(validated.approved || []).map((c) => ({ ...c, tier: 'approved' })),
    ];
    const sentByHandle = new Map();
    for (const s of sent) {
      const arr = sentByHandle.get(s.username) || [];
      arr.push(s);
      sentByHandle.set(s.username, arr);
    }
    const repliedSet = new Set(responses.map((r) => r.username));

    const leads = pool
      .filter((c) => sentByHandle.has(c.username))
      .map((c) => {
        const history = sentByHandle.get(c.username) || [];
        const lastSent = history.reduce(
          (acc, x) => (!acc || x.sent_at > acc.sent_at ? x : acc),
          null
        );
        return {
          username: c.username,
          tier: c.tier,
          score: c.score,
          platforms: c.platforms,
          followers: c.followers,
          engagement_rate: c.engagement_rate,
          email: c.email,
          email_count: history.length,
          last_sent_at: lastSent?.sent_at,
          last_email_number: lastSent?.email_number,
          replied: repliedSet.has(c.username),
          fulfilled: !!(responses.find((r) => r.username === c.username && r.fulfilled)),
          profile_urls: c.profile_urls || {},
          avatar_url: c.avatar_url || null,
        };
      });

    // Sort: replied + not-fulfilled first (action needed), then premium,
    // then by number of emails sent (more touches first), then score.
    leads.sort((a, b) => {
      const aReady = a.replied && !a.fulfilled ? 1 : 0;
      const bReady = b.replied && !b.fulfilled ? 1 : 0;
      if (aReady !== bReady) return bReady - aReady;
      if (a.tier !== b.tier) return a.tier === 'premium' ? -1 : 1;
      if (a.email_count !== b.email_count) return b.email_count - a.email_count;
      return (b.score || 0) - (a.score || 0);
    });

    res.json({ ok: true, count: leads.length, leads: leads.slice(0, 30) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/mark-replied', async (req, res) => {
  try {
    const { username, note } = req.body || {};
    if (!username) return res.status(400).json({ ok: false, error: 'missing_username' });
    const responses = await readJson('responses.json', []);
    const idx = responses.findIndex((r) => r.username === username);
    const record = idx >= 0 ? responses[idx] : { username };
    record.replied_at = record.replied_at || new Date().toISOString();
    record.note = note || record.note || '';
    record.fulfilled = record.fulfilled || false;
    if (idx >= 0) responses[idx] = record; else responses.push(record);
    await writeJson('responses.json', responses);
    res.json({ ok: true, record });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/mark-fulfilled', async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) return res.status(400).json({ ok: false, error: 'missing_username' });
    const responses = await readJson('responses.json', []);
    const idx = responses.findIndex((r) => r.username === username);
    const record = idx >= 0 ? responses[idx] : { username, replied_at: new Date().toISOString() };
    record.fulfilled = true;
    record.fulfilled_at = new Date().toISOString();
    if (idx >= 0) responses[idx] = record; else responses.push(record);
    await writeJson('responses.json', responses);
    res.json({ ok: true, record });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
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
