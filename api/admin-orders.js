/* ============================================================
   /api/admin-orders — auth-required. Returns all orders from KV
   (order:* keys), newest first by createdAt.
   Responses:
     401 { ok:false, error:'unauthorized' }
     200 { ok:true, orders:[...] }
     200 { ok:false, error:'kv' }   when KV is unreachable/unconfigured
   ============================================================ */

const { isAuthed, kvEnv, kvCmd } = require('./_admin');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!isAuthed(req)) return res.status(401).json({ ok: false, error: 'unauthorized' });
  if (!kvEnv()) return res.status(200).json({ ok: false, error: 'kv' });

  try {
    const keys = (await kvCmd(['KEYS', 'order:*'])) || [];
    if (!keys.length) return res.status(200).json({ ok: true, orders: [] });

    const vals = (await kvCmd(['MGET'].concat(keys))) || [];
    const orders = [];
    vals.forEach((v) => {
      if (!v) return;
      try { orders.push(typeof v === 'string' ? JSON.parse(v) : v); } catch (_) {}
    });
    orders.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

    return res.status(200).json({ ok: true, orders: orders });
  } catch (err) {
    console.warn(JSON.stringify({ event: 'admin_orders_error', msg: String(err) }));
    return res.status(200).json({ ok: false, error: 'kv' });
  }
};
