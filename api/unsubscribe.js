/* ============================================
   /api/unsubscribe
   Accepts either GET (from email link: ?id=xxx&email=yyy) or POST
   (from the confirmation page form). Logs the unsubscribe and
   returns a small V5-styled confirmation page.

   Storage: log-only for now (Vercel KV later). The /outreach/
   send.js layer should consult the unsubscribe list before sending
   future touches — the simplest pull is to grep Vercel logs at
   cron time, or move to KV when the volume justifies it.
   ============================================ */

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
}

function confirmationPage({ email }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Suscripción cancelada · LATRICOLOR.CO</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{
  background:#F0EBE0;color:#0A0A0A;
  font-family:'Inter',sans-serif;
  display:flex;align-items:center;justify-content:center;
  padding:2rem 1rem;min-height:100vh;
}
.card{
  width:100%;max-width:480px;
  background:#fff;border:4px solid #0A0A0A;
  box-shadow:8px 8px 0 #FFD300;
  padding:2rem 1.5rem 1.6rem;text-align:center;position:relative;
}
.bars{
  position:absolute;top:0;left:0;right:0;height:8px;
  background:linear-gradient(90deg,
    #FFD300 0%,#FFD300 33.33%,
    #0033A0 33.33%,#0033A0 66.66%,
    #E63946 66.66%,#E63946 100%);
}
.tag{
  display:inline-block;background:#0A0A0A;color:#FFD300;
  padding:0.35rem 0.9rem;font-family:'Anton',sans-serif;
  font-size:0.8rem;letter-spacing:0.2em;text-transform:uppercase;
  margin:1rem 0 1.2rem;border:2px solid #FFD300;
}
h1{
  font-family:'Anton',sans-serif;font-size:clamp(1.6rem,5vw,2.4rem);
  line-height:1.05;text-transform:uppercase;letter-spacing:-0.01em;
  margin-bottom:0.5rem;
}
h1 em{font-family:'Bebas Neue',sans-serif;color:#E63946;font-style:italic;letter-spacing:0;}
p.lead{font-family:'Bebas Neue',sans-serif;font-size:0.95rem;letter-spacing:0.12em;
  text-transform:uppercase;color:#4A4A48;margin-bottom:1.4rem;}
.email-box{
  background:#F0EBE0;border:2px dashed #0A0A0A;padding:0.7rem;
  font-family:'Bebas Neue',sans-serif;letter-spacing:0.08em;
  color:#0A0A0A;margin-bottom:1.4rem;word-break:break-all;
}
.back{
  display:inline-block;background:#FFD300;color:#0A0A0A;
  padding:0.85rem 1.4rem;font-family:'Anton',sans-serif;
  font-size:0.95rem;letter-spacing:0.13em;text-transform:uppercase;
  text-decoration:none;border:2px solid #0A0A0A;
  box-shadow:4px 4px 0 #E63946;transition:transform 0.12s,box-shadow 0.12s;
}
.back:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #E63946;}
.fine{margin-top:1rem;font-size:0.78rem;color:#8A867E;}
</style>
</head>
<body>
<div class="card">
  <div class="bars" aria-hidden="true"></div>
  <span class="tag">★ Suscripción Cancelada ★</span>
  <h1>Listo. <em>No</em> me oirás más.</h1>
  <p class="lead">Tu email fue removido de la lista.</p>
  <div class="email-box">${email ? escapeHtml(email) : '(sin email)'}</div>
  <a class="back" href="https://latricolor.co">Volver a latricolor.co →</a>
  <p class="fine">¿Te equivocaste? Solo respondé al último mensaje y volvemos a sumarte.</p>
</div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

module.exports = async function handler(req, res) {
  const ts = new Date().toISOString();
  let email = '';
  let id = '';

  if (req.method === 'GET') {
    email = (req.query && req.query.email) || '';
    id = (req.query && req.query.id) || '';
  } else if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};
    email = body.email || '';
    id = body.id || '';
  } else {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  email = String(email || '').trim().toLowerCase();

  if (!isEmail(email)) {
    console.warn(JSON.stringify({ event: 'unsubscribe_bad_email', id, email, ts }));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(confirmationPage({ email: '' }));
  }

  console.log(JSON.stringify({ event: 'unsubscribe', id, email, ts }));

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(confirmationPage({ email }));
};
