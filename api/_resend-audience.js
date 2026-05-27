/* ============================================
   _resend-audience — POST a contact into a Resend Audience.

   Underscore prefix keeps this helper out of Vercel's auto-route
   detection (same convention as _welcome-email.js).

   Reads RESEND_API_KEY + RESEND_AUDIENCE_ID from the environment.
   No-ops silently if either is missing — keeps prod safe even when
   audience capture hasn't been provisioned yet.

   Resend returns 200 on new contacts, 422 when the email already
   exists in the audience. Both are treated as success; anything
   else is logged and swallowed (we never want to fail the caller's
   request because of a downstream audience write).
   ============================================ */

async function addContactToAudience({ email, firstName, lastName }) {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    console.log('audience_skipped — RESEND_API_KEY or RESEND_AUDIENCE_ID not set');
    return { ok: false, reason: 'not_configured' };
  }

  try {
    const r = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        unsubscribed: false,
      }),
    });
    if (r.ok || r.status === 422) return { ok: true, status: r.status };
    const txt = await r.text().catch(() => '');
    console.error('audience_failed', r.status, txt);
    return { ok: false, status: r.status };
  } catch (err) {
    console.error('audience_error', err && err.message);
    return { ok: false, reason: 'exception' };
  }
}

module.exports = { addContactToAudience };
