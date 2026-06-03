# Embedded COD checkout (Phase 1)

Cold TikTok traffic orders directly in `#pedido` (contra entrega) — WhatsApp
is now the merchant's confirmation step, not the customer's order step.

## Pieces
- `order-form.css` + `order-form.js` — shared, loaded by index + oferta(-2/-3).
  `order-form.js` injects the `#pedido` form, the unified `.lt-sticky` CTA
  ("LO QUIERO YA 🇨🇴"), and the exit-recovery popup; it reads
  `data/colombia-municipios.json` (32 deptos / 1104 municipios, local — no
  runtime API) for the dependent departamento→municipio dropdowns.
- `api/order.js` — POST endpoint. Recomputes the total server-side
  (anti-tamper), mints `LTC-<ts>-<hex>`, stores `order:<ref>` in KV, and
  fires Telegram + Resend notifications (both fail-soft).
- `gracias.html` — confirmation page (`/gracias`, cleanUrls).

## Pricing (server-authoritative)
1 Body $79.000 · 2 Bodies $149.000 (+1 gorra) · 3 Bodies $199.000 (+2 gorras).
Order bump: +$5.000 priority shipping. Exit-recovery: −$10.000 (honest
10-min countdown persisted in localStorage; truly expires & reverts).

## Environment variables (Vercel dashboard → Settings → Environment Variables)
| Variable | Used for | Required |
|---|---|---|
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Store `order:<ref>` in Upstash KV (already used by /api/track) | recommended (fail-soft if absent) |
| `RESEND_API_KEY` | Order email to lupo24fit@gmail.com (already used by /api/subscribe) | recommended |
| `TELEGRAM_BOT_TOKEN` | Instant Telegram order ping | optional |
| `TELEGRAM_CHAT_ID` | Telegram chat to notify | optional |

To set up Telegram: message @BotFather → `/newbot` → copy the token into
`TELEGRAM_BOT_TOKEN`; then get your chat id (message the bot, open
`https://api.telegram.org/bot<token>/getUpdates`, read `chat.id`) into
`TELEGRAM_CHAT_ID`. Redeploy after adding env vars.

If KV / Resend / Telegram are unset or fail, the order still succeeds and
returns `{ ok:true, reference }` — notifications never block checkout.

## Verify in production
- `curl -XPOST https://latricolor.co/api/order -H 'content-type: application/json' -d '{"variant":"A","offer":"1","items":[{"color":"Amarilla","talla":"M"}],"whatsapp":"3001234567","nombre":"Test","apellidos":"Test","departamento":"Antioquia","ciudad":"Medellín","direccion":"Calle 1 #2-3"}'`
  → `{"ok":true,"reference":"LTC-..."}`, a Telegram ping + email arrive, and the KV key `order:<ref>` exists.

## Phase 2 (not built)
Prepaid Wompi (tarjeta/PSE −5%) — placeholder marked in `order-form.js`
(after the COD button) and `order.js` total logic. The −5% will NOT stack
with the −$10.000 recovery discount.
