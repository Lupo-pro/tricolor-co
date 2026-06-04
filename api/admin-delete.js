/* ============================================================
   /api/admin-delete — auth-required. POST { reference }.
   Deletes the KV key order:<reference> (e.g. to remove test orders).
   ============================================================ */

const { isAuthed, kvEnv, kvCmd } = require('./_admin');

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
  if (!/^LTC-[A-Z0-9-]+$/i.test(reference)) return res.status(400).json({ ok: false, error: 'bad_reference' });

  try {
    const deleted = await kvCmd(['DEL', 'order:' + reference]);
    return res.status(200).json({ ok: true, reference: reference, deleted: deleted });
  } catch (err) {
    console.warn(JSON.stringify({ event: 'admin_delete_error', msg: String(err) }));
    return res.status(200).json({ ok: false, error: 'kv' });
  }
};
