/* ============================================================
   _admin.js — shared helpers for the /admin endpoints.
   - Single-password auth: an httpOnly cookie holds a token derived from
     ADMIN_PASSWORD (sha256), so it can be validated server-side without
     storing sessions and cannot be forged without the password.
   - Thin Upstash KV REST client (plain fetch, same env as /api/order).
   Not a route (underscore prefix) — imported by admin-* endpoints.
   ============================================================ */

const crypto = require('crypto');

const COOKIE = 'ltc_admin';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function kvEnv() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

/* Run one Redis command via the Upstash REST API, e.g. ['GET','order:x'].
   Returns the `result` field. Throws if KV unconfigured or HTTP fails. */
async function kvCmd(command) {
  const kv = kvEnv();
  if (!kv) throw new Error('kv_unconfigured');
  const resp = await fetch(kv.url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + kv.token, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!resp.ok) throw new Error('kv_http_' + resp.status);
  const data = await resp.json();
  return data.result;
}

// Token = sha256("ltc-admin:" + ADMIN_PASSWORD). Stored in the httpOnly cookie.
function adminToken() {
  return crypto.createHash('sha256')
    .update('ltc-admin:' + (process.env.ADMIN_PASSWORD || ''))
    .digest('hex');
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers && req.headers.cookie;
  if (!raw) return out;
  raw.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  try { return crypto.timingSafeEqual(ba, bb); } catch (_) { return false; }
}

// Authenticated only if ADMIN_PASSWORD is set AND the cookie token matches.
function isAuthed(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const c = parseCookies(req)[COOKIE];
  return !!c && safeEqual(c, adminToken());
}

function sessionCookie() {
  return COOKIE + '=' + adminToken() +
    '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=' + COOKIE_MAX_AGE;
}
function clearCookie() {
  return COOKIE + '=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

module.exports = { kvEnv, kvCmd, adminToken, parseCookies, safeEqual, isAuthed, sessionCookie, clearCookie, COOKIE };
