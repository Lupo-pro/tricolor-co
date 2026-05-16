/* ============================================
   /api/subscribe — POST { email, source? }
   Validates the email, logs the subscription to Vercel function logs,
   and sends the welcome email through Resend if RESEND_API_KEY is set
   in the environment.

   Gracefully degrades: if the key is absent or Resend fails, the
   endpoint still returns 200 so the UI doesn't error out — the
   subscription log line is captured either way for backfill.
   ============================================ */

const { renderWelcomeEmail } = require('./_welcome-email');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM = 'La Tricolor <hola@latricolor.co>';
const SUBJECT = '🇨🇴 Bienvenida a La Tribuna · Tu calendario Mundial';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // Vercel parses JSON bodies for application/json automatically; in
  // any other path we read manually as a defensive fallback.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};

  const email = String(body.email || '').trim().toLowerCase();
  const source = String(body.source || 'unknown').slice(0, 32);

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'invalid' });
  }

  const ts = new Date().toISOString();
  // Single-line JSON keeps the log searchable in Vercel's UI.
  console.log(JSON.stringify({ event: 'subscribe', email, source, ts }));

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: email,
          subject: SUBJECT,
          html: renderWelcomeEmail({ email }),
        }),
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        console.error('resend_failed', r.status, txt);
      }
    } catch (err) {
      console.error('resend_error', err && err.message);
    }
  } else {
    console.log('resend_skipped — RESEND_API_KEY not set');
  }

  return res.status(200).json({ ok: true });
};

// renderWelcomeEmail lives in ./_welcome-email.js — the underscore
// prefix keeps it out of Vercel's auto-route detection.
