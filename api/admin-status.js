/* ============================================================
   /api/admin-status — auth-required. POST { reference, status }.
   Updates that order's status in KV. Allowed:
     pendiente | confirmada | enviada | entregada | rechazada
   ============================================================ */

const { isAuthed, kvEnv, kvCmd } = require('./_admin');

const ALLOWED = new Set(['pendiente', 'confirmada', 'enviada', 'entregada', 'rechazada']);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!isAuthed(req)) return res.status(401).json({ ok: false, error: 'unauthorized' });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  if (!kvEnv()) return res.status(200).json({ ok: false, error: 'kv' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};

  const reference = String(body.reference || '');
  const status = String(body.status || '');
  if (!/^LTC-[A-Z0-9-]+$/i.test(reference)) return res.status(400).json({ ok: false, error: 'bad_reference' });
  if (!ALLOWED.has(status)) return res.status(400).json({ ok: false, error: 'bad_status' });

  try {
    const key = 'order:' + reference;
    const raw = await kvCmd(['GET', key]);
    if (!raw) return res.status(404).json({ ok: false, error: 'not_found' });
    const order = typeof raw === 'string' ? JSON.parse(raw) : raw;
    order.status = status;
    order.statusUpdatedAt = new Date().toISOString();
    await kvCmd(['SET', key, JSON.stringify(order)]);
    return res.status(200).json({ ok: true, reference: reference, status: status });
  } catch (err) {
    console.warn(JSON.stringify({ event: 'admin_status_error', msg: String(err) }));
    return res.status(200).json({ ok: false, error: 'kv' });
  }
};
