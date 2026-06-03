/* ============================================================
   /api/track — per-variant A/B conversion logging (Vercel KV)

   POST JSON body:  { variant: 'A'|'B'|'C',
                      event: 'visit'|'whatsapp_click'|'price_cta_click',
                      meta?: {...} }

   Increments aggregate counters in Vercel KV (Upstash Redis):
     stats:<V>:<event>                  (all-time total)
     stats:<V>:<event>:<YYYY-MM-DD>     (daily breakdown)

   Talks to KV over its REST API with plain fetch — no @vercel/kv
   dependency, so the function ships with zero install/build step.
   Reads creds from process.env (KV_REST_API_URL / KV_REST_API_TOKEN);
   nothing is hardcoded.

   Resilient by design: if KV is unconfigured or unreachable, it logs
   to the function log and returns 204 anyway — tracking must NEVER
   block the user or surface an error. Everything is wrapped in
   try/catch.

   Optional read mode for verification (does not expose anything unless
   you opt in by setting STATS_READ_TOKEN):
     GET /api/track?stats=1&token=<STATS_READ_TOKEN>
   ============================================================ */

const VARIANTS = new Set(['A', 'B', 'C']);
const EVENTS   = new Set(['visit', 'whatsapp_click', 'price_cta_click']);

function kvEnv() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

/* Run one or more Redis commands through the Upstash/Vercel KV REST API.
   `commands` is an array of arrays, e.g. [["INCR","k"], ["INCR","k2"]].
   Uses the /pipeline endpoint so it's a single round-trip. */
async function kvPipeline(commands) {
  const kv = kvEnv();
  if (!kv) return null;
  const resp = await fetch(kv.url + '/pipeline', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + kv.token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  if (!resp.ok) throw new Error('kv_http_' + resp.status);
  return resp.json();
}

function today() {
  return new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  /* ---- Optional read mode for verification ---- */
  if (req.method === 'GET') {
    const q = req.query || {};
    const readToken = process.env.STATS_READ_TOKEN;
    if (!q.stats || !readToken || q.token !== readToken) {
      return res.status(404).json({ error: 'not_found' });
    }
    try {
      const keys = [];
      for (const v of ['A', 'B', 'C']) {
        for (const e of EVENTS) keys.push('stats:' + v + ':' + e);
      }
      const out = await kvPipeline([['MGET', ...keys]]);
      const values = (out && out[0] && out[0].result) || [];
      const stats = {};
      keys.forEach((k, i) => { stats[k] = Number(values[i] || 0); });
      return res.status(200).json({ ok: true, stats });
    } catch (err) {
      console.warn(JSON.stringify({ event: 'track_read_error', msg: String(err) }));
      return res.status(200).json({ ok: false, stats: {} });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // Parse body defensively. sendBeacon/fetch may send application/json
  // (auto-parsed by Vercel) or a raw string — handle both.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};

  const variant = String(body.variant || '').toUpperCase();
  const event   = String(body.event || '');

  if (!VARIANTS.has(variant) || !EVENTS.has(event)) {
    return res.status(400).json({ error: 'invalid_payload' });
  }

  const totalKey = 'stats:' + variant + ':' + event;
  const dailyKey = totalKey + ':' + today();

  // Always log to the function log too — gives a backfill trail and lets
  // verification happen even before KV is wired up.
  console.log(JSON.stringify({ event: 'track', variant, name: event, ts: new Date().toISOString() }));

  try {
    await kvPipeline([['INCR', totalKey], ['INCR', dailyKey]]);
  } catch (err) {
    // Fail silently — never block the user.
    console.warn(JSON.stringify({ event: 'track_kv_error', msg: String(err) }));
  }

  return res.status(204).end();
};
