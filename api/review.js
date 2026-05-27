/* ============================================
   /api/review — POST { name, city, rating, comment, email?, photo?, source? }
   Forwards a customer review submitted from /tribu to
   hola@latricolor.co via Resend. No database — review lands in
   the inbox plus the function logs for backfill.

   Gracefully degrades: if RESEND_API_KEY is unset or Resend
   errors out, we still log + return 200 so the UI confirms to
   the user. The review is recoverable from the log line.
   ============================================ */

const { addContactToAudience } = require('./_resend-audience');

const TO = 'hola@latricolor.co';
const FROM = 'La Tricolor <hola@latricolor.co>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clip(s, n) {
  s = String(s == null ? '' : s);
  return s.length > n ? s.slice(0, n) : s;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmail(r) {
  const stars = '★'.repeat(r.rating) + '☆'.repeat(Math.max(0, 5 - r.rating));
  const photoLine = r.photo
    ? `<tr><td><strong>Foto adjunta:</strong></td><td>${escapeHtml(r.photo.name)} (${Math.round(r.photo.size / 1024)} KB, ${escapeHtml(r.photo.type || 'image')})<br><em style="color:#8A867E;font-size:12px">El archivo no se sube — pedir a la clienta que lo mande por WhatsApp si lo quieren publicar.</em></td></tr>`
    : '';
  const emailLine = r.email
    ? `<tr><td><strong>Email:</strong></td><td><a href="mailto:${escapeHtml(r.email)}" style="color:#0033A0">${escapeHtml(r.email)}</a></td></tr>`
    : '';

  return `<!doctype html>
<html lang="es-CO"><head><meta charset="utf-8"><title>Nueva reseña</title></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#F5EFE0;color:#0A0A0A;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#FAF7F2;border:3px solid #0A0A0A;box-shadow:5px 5px 0 #E63946;padding:20px">
    <p style="font-family:Anton,Impact,sans-serif;color:#E63946;letter-spacing:.1em;margin:0 0 8px;text-transform:uppercase">★ Nueva reseña · Tribu ★</p>
    <h1 style="font-family:Anton,Impact,sans-serif;font-size:28px;line-height:1;margin:0 0 16px;letter-spacing:.02em">${escapeHtml(r.name)} · ${escapeHtml(r.city)}</h1>
    <p style="font-size:24px;color:#FFD300;-webkit-text-stroke:1px #0A0A0A;letter-spacing:.1em;margin:0 0 16px">${stars} <span style="color:#0A0A0A;font-size:14px;-webkit-text-stroke:0">(${r.rating}/5)</span></p>
    <blockquote style="border-left:4px solid #0033A0;margin:0 0 20px;padding:6px 14px;font-style:italic;background:#FFFFFF;font-size:15px;line-height:1.5">${escapeHtml(r.comment).replace(/\n/g, '<br>')}</blockquote>
    <table style="font-size:13px;width:100%;border-collapse:collapse">
      ${emailLine}
      ${photoLine}
      <tr><td><strong>Origen:</strong></td><td>${escapeHtml(r.source || 'tribu')}</td></tr>
      <tr><td><strong>Fecha:</strong></td><td>${escapeHtml(r.ts)}</td></tr>
    </table>
  </div>
  <p style="text-align:center;color:#8A867E;font-size:11px;margin-top:16px">LATRICOLOR.CO · /api/review</p>
</body></html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};

  const name = clip((body.name || '').toString().trim(), 60);
  const city = clip((body.city || '').toString().trim(), 60);
  const comment = clip((body.comment || '').toString().trim(), 800);
  const rating = parseInt(body.rating, 10);
  const email = clip((body.email || '').toString().trim().toLowerCase(), 254);
  const source = clip((body.source || 'tribu').toString(), 32);
  const photo = body.photo && typeof body.photo === 'object' ? {
    name: clip(body.photo.name, 120),
    size: parseInt(body.photo.size, 10) || 0,
    type: clip(body.photo.type, 60)
  } : null;

  if (!name || !city || !comment || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'invalid', detail: 'name, city, comment, rating(1-5) required' });
  }
  if (email && !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }

  const ts = new Date().toISOString();
  const record = { event: 'review', name, city, rating, email, comment, photo, source, ts };
  console.log(JSON.stringify(record));

  // If the reviewer left an email, persist them to the Resend Audience
  // tagged with their name + city (Resend's first_name / last_name fields
  // are the only structured metadata available on a contact).
  if (email) {
    await addContactToAudience({ email, firstName: name, lastName: city });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const subject = `★ Nueva reseña · ${name} (${city}) · ${rating}/5`;
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: TO,
          reply_to: email || undefined,
          subject,
          html: renderEmail(record),
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
