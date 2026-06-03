/* ============================================================
   /api/admin-login — single-password gate for /admin.
   POST { password }  → validates against ADMIN_PASSWORD (server-side,
   constant-time) and sets the httpOnly session cookie (~7 days).
   GET  ?logout=1     → clears the cookie.
   The password is NEVER checked in client JS.
   ============================================================ */

const { isAuthed, safeEqual, sessionCookie, clearCookie } = require('./_admin');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // Logout (or a simple auth probe via GET).
  if (req.method === 'GET') {
    if (req.query && req.query.logout) {
      res.setHeader('Set-Cookie', clearCookie());
      return res.status(200).json({ ok: true, loggedOut: true });
    }
    return res.status(200).json({ ok: true, authed: isAuthed(req) });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};

  const password = String(body.password || '');
  if (!password || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ ok: false, error: 'invalid_password' });
  }

  res.setHeader('Set-Cookie', sessionCookie());
  return res.status(200).json({ ok: true });
};
