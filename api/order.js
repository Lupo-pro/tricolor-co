/* ============================================================
   /api/order — embedded COD (contra entrega) order intake.

   POST JSON: {
     variant, offer (1|2|3), items:[{color}], gorras:[color],
     priorityShipping:bool, recoveryDiscount:bool,
     whatsapp, nombre, apellidos, departamento, ciudad, direccion,
     barrio, email
   }

   - Recomputes the total SERVER-SIDE from offer + priority + recovery
     (never trusts the client total — anti-tamper).
   - Mints a unique reference: LTC-<base36 ts>-<4 hex>.
   - Persists to Upstash KV (key order:<reference>) — fail-soft.
   - Fires TWO instant notifications, each independently fail-soft:
       (a) Telegram sendMessage (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)
       (b) Resend email to lupo24fit@gmail.com (RESEND_API_KEY)
     Both carry a tappable wa.me/57<whatsapp> link prefilled so the
     merchant confirms the order with the customer.
   - Returns { ok:true, reference } or { ok:false, error }.

   Phase 1 = COD only. Prepaid (Wompi −5%) comes later.
   ============================================================ */

const crypto = require('crypto');

const OFFER_PRICE = { '1': 79000, '2': 149000, '3': 199000 };
const OFFER_NAME  = { '1': '1 Body', '2': '2 Bodies + 1 gorra', '3': '3 Bodies + 2 gorras' };
const PRIORITY_FEE = 5000;
const RECOVERY_DISCOUNT = 10000;

const COD_FROM = 'La Tricolor <hola@latricolor.co>';
const ORDER_EMAIL_TO = 'lupo24fit@gmail.com';

function kvEnv() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

async function kvSet(key, value) {
  const kv = kvEnv();
  if (!kv) return false;
  // Upstash REST single-command form: POST <url> with ["SET", key, value].
  const resp = await fetch(kv.url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + kv.token, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', key, value]),
  });
  if (!resp.ok) throw new Error('kv_http_' + resp.status);
  return true;
}

const COP = (n) => '$' + Number(n).toLocaleString('es-CO');

const clean = (s, max) => String(s == null ? '' : s).trim().slice(0, max || 200);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};

  // ---- Validate ----
  const offer = String(body.offer || '');
  if (!OFFER_PRICE[offer]) return res.status(400).json({ ok: false, error: 'invalid_offer' });

  const whatsapp = String(body.whatsapp || '').replace(/\D/g, '');
  const nombre = clean(body.nombre, 80);
  const apellidos = clean(body.apellidos, 80);
  const departamento = clean(body.departamento, 80);
  const ciudad = clean(body.ciudad, 120);
  const direccion = clean(body.direccion, 200);
  const barrio = clean(body.barrio, 120);
  const email = clean(body.email, 254);

  if (whatsapp.length < 10 || whatsapp.length > 12) return res.status(400).json({ ok: false, error: 'invalid_whatsapp' });
  if (!nombre || !apellidos || !departamento || !ciudad || !direccion) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  const items = Array.isArray(body.items) ? body.items.slice(0, 3).map((it) => ({
    color: clean(it && it.color, 20),
  })) : [];
  const gorras = Array.isArray(body.gorras) ? body.gorras.slice(0, 2).map((g) => clean(g, 20)) : [];
  const priorityShipping = !!body.priorityShipping;
  const recoveryDiscount = !!body.recoveryDiscount;
  const variant = clean(body.variant, 8) || 'HOME';

  // ---- Recompute total (anti-tamper) ----
  let total = OFFER_PRICE[offer];
  if (priorityShipping) total += PRIORITY_FEE;
  if (recoveryDiscount) total -= RECOVERY_DISCOUNT;
  if (total < 0) total = 0;

  // ---- Reference ----
  const reference = 'LTC-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex');
  const createdAt = new Date().toISOString();

  const order = {
    reference, status: 'cod_pending', createdAt, variant,
    offer, offerName: OFFER_NAME[offer], items, gorras,
    priorityShipping, recoveryDiscount, total,
    whatsapp, nombre, apellidos, departamento, ciudad, direccion, barrio, email,
  };

  // ---- Persist (fail-soft) ----
  try { await kvSet('order:' + reference, JSON.stringify(order)); }
  catch (err) { console.warn(JSON.stringify({ event: 'order_kv_error', reference, msg: String(err) })); }

  // ---- Prefilled customer-confirm WhatsApp link (for the merchant) ----
  const confirmText = 'Hola! Confirmamos tu pedido LATRICOLOR ' + reference + ' (' + OFFER_NAME[offer] +
    ') por ' + COP(total) + ' contra entrega. Coordinamos la entrega?';
  const waConfirm = 'https://wa.me/57' + whatsapp + '?text=' + encodeURIComponent(confirmText);

  // Richer, scannable line items (shared by Telegram + email).
  const bodyLines = items.map((it, i) => '   👕 Body ' + (i + 1) + ': ' + (it.color || '?')).join('\n');
  const gorraLines = gorras.length ? gorras.map((g, i) => '   🧢 Gorra ' + (i + 1) + ': ' + g).join('\n') : '';
  const DIV = '━━━━━━━━━━━━━━';
  const payLine = 'contra entrega' + (recoveryDiscount ? ' · descuento -' + COP(RECOVERY_DISCOUNT) : '');
  const prioLine = priorityShipping ? 'SÍ' : 'NO';

  // ---- Telegram (fail-soft) ----
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    const tgText =
      '🔥🇨🇴 <b>NUEVO PEDIDO LATRICOLOR</b> 🇨🇴🔥\n' +
      '🧾 <b>' + reference + '</b>\n' +
      '💰 <b>' + COP(total) + '</b> · ' + payLine + '\n' +
      DIV + '\n' +
      '📦 <b>' + OFFER_NAME[offer] + '</b>\n' +
      bodyLines + (gorraLines ? '\n' + gorraLines : '') + '\n' +
      DIV + '\n' +
      '👤 ' + nombre + ' ' + apellidos + '\n' +
      '📍 ' + ciudad + ', ' + departamento + '\n' +
      '🏠 ' + direccion + (barrio ? ' ' + barrio : '') + '\n' +
      '📱 <a href="' + waConfirm + '">' + whatsapp + ' — escribir por WhatsApp</a>' + (email ? '\n✉️ ' + email : '') + '\n' +
      '🚚 Envío prioritario: ' + prioLine + '\n' +
      '🎯 Variante ' + variant;
    try {
      const r = await fetch('https://api.telegram.org/bot' + tgToken + '/sendMessage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChat, text: tgText, parse_mode: 'HTML', disable_web_page_preview: false }),
      });
      if (!r.ok) throw new Error('tg_http_' + r.status);
    } catch (err) { console.warn(JSON.stringify({ event: 'order_telegram_error', reference, msg: String(err) })); }
  } else {
    console.log('order_telegram_skipped — TELEGRAM_BOT_TOKEN/CHAT_ID not set');
  }

  // ---- Resend email (fail-soft) ----
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const bodyLinesHtml = items.map((it, i) => '👕 Body ' + (i + 1) + ': ' + (it.color || '?')).join('<br>');
    const gorraLinesHtml = gorras.length ? gorras.map((g, i) => '🧢 Gorra ' + (i + 1) + ': ' + g).join('<br>') : '';
    const html =
      '<h2>🔥🇨🇴 NUEVO PEDIDO LATRICOLOR 🇨🇴🔥</h2>' +
      '<p>🧾 <strong>' + reference + '</strong><br>' +
      '💰 <strong>' + COP(total) + '</strong> · ' + payLine + ' · estado: cod_pending</p>' +
      '<hr>' +
      '<p>📦 <strong>' + OFFER_NAME[offer] + '</strong><br>' +
      bodyLinesHtml + (gorraLinesHtml ? '<br>' + gorraLinesHtml : '') + '</p>' +
      '<hr>' +
      '<p>👤 ' + nombre + ' ' + apellidos + '<br>' +
      '📍 ' + ciudad + ', ' + departamento + '<br>' +
      '🏠 ' + direccion + (barrio ? ' ' + barrio : '') + '<br>' +
      '📱 ' + whatsapp + (email ? '<br>✉️ ' + email : '') + '<br>' +
      '🚚 Envío prioritario: ' + prioLine + '<br>' +
      '🎯 Variante ' + variant + '</p>' +
      '<p><a href="' + waConfirm + '" style="background:#25D366;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:700">📱 Escribir al cliente por WhatsApp</a></p>';
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: COD_FROM, to: ORDER_EMAIL_TO,
          subject: 'Nuevo pedido LATRICOLOR ' + reference + ' — ' + COP(total),
          html,
        }),
      });
      if (!r.ok) throw new Error('resend_http_' + r.status);
    } catch (err) { console.warn(JSON.stringify({ event: 'order_resend_error', reference, msg: String(err) })); }
  } else {
    console.log('order_resend_skipped — RESEND_API_KEY not set');
  }

  console.log(JSON.stringify({ event: 'order', reference, variant, offer, total, ciudad, createdAt }));
  return res.status(200).json({ ok: true, reference });
};
