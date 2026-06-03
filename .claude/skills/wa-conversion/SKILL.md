---
name: wa-conversion
description: WhatsApp funnel patterns for TRICOLOR.CO. Use when adding or modifying any WhatsApp CTA, message template, or conversion flow. Covers wa.me URL format, pre-filled message templates per context, contraentrega messaging, single-source-of-truth for the phone number, and Spanish/Colombian phrasing.
---

# WhatsApp Conversion Skill — TRICOLOR.CO

The site has **no checkout**. Every order conversion flows through WhatsApp. Get the WA pattern right or you break the funnel.

## Phone number — single source of truth

- Placeholder: `573000000000` (format: country code 57 + 10-digit national, **no `+`, no spaces**).
- Defined as `WHATSAPP_NUMBER` constant in `app.js`.
- **All `wa.me` URLs in HTML should use `data-wa` attribute** (with optional `data-wa-msg`) and let `app.js` inject the final href on load. This avoids drift when the real number replaces the placeholder.
- The placeholder is **intentional** — do not invent a real number. Coordinate with Lupo before changing.

## URL format

```
https://wa.me/<NUMBER>?text=<URL_ENCODED_MESSAGE>
```

Always `encodeURIComponent()` the message. Newlines: use `\n` then encode (becomes `%0A`).

## Message templates per context

Use these verbatim phrasings. They're Colombian Spanish, warm but professional, and match the brand voice.

### Generic CTA (hero, sticky button, CTA final)
```
Hola! Quiero pedir mi body Tricolor 🇨🇴
```

### Product card click (no size yet)
```
Hola! Me interesa {PRODUCT_NAME} 🇨🇴

Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?
```

### Modal CTA (size + price known)
```
Hola! Quiero pedir el body {PRODUCT_NAME} 🇨🇴

Talla: {SIZE}
Precio: {PRICE}

Está disponible?
```

### Bundle (El Once Inicial)
```
Hola! Quiero pedir el Once Inicial (Pack 4 ediciones) 🇨🇴 Está disponible?
```

### Mass / wholesale (10+ units, mentioned in FAQ)
```
Hola! Quiero hacer un pedido al por mayor 🇨🇴

Cantidad estimada: {QTY}
Ciudad: {CITY}

Me cuentan condiciones?
```

## Implementation pattern

In HTML:
```html
<a href="#" data-wa data-wa-msg="Hola! Quiero pedir mi body Tricolor 🇨🇴" class="btn btn-wa">Pedir</a>
```

In `app.js` (already wired):
```js
document.querySelectorAll('[data-wa]').forEach(el => {
  const msg = el.dataset.waMsg || 'Hola! Quiero pedir mi body Tricolor 🇨🇴';
  el.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  el.target = '_blank';
  el.rel = 'noopener';
});
```

## CTA copy standards (per `BRIEF.md` §11)

| Action | CTA text |
|--------|----------|
| Pedir produit | `Pedir por WhatsApp` |
| Voir la collec | `Ver la Colección` |
| Bundle | `Lo Quiero Completo` / `Llévate el Once Inicial` |
| Newsletter | `Únete a la Tribuna` |
| Urgence stock | `Asegura el tuyo` |
| Generic | `Pedir el Mío` |

Never use English CTAs. Never use generic `Buy now` / `Add to cart` — there's no cart.

## Trust signals to repeat near every WhatsApp CTA

- ✅ `Pago contraentrega` (pay on delivery, removes payment friction)
- ✅ `Envío nacional 24-72h`
- ✅ `Garantía 7 días`
- ✅ Carriers: `Interrapidísimo` or `Servientrega`
- ✅ Pay methods at delivery: `efectivo, Nequi, Daviplata, transferencia`

These are the Colombian e-com trust triumvirate. Mention at least 2 within any conversion-critical section.

## Conversion psychology

- Add **soft urgency** without lying: `Stock limitado · Solo hasta el Mundial` (true), countdown to `2026-06-11`.
- Pre-fill messages so the user just hits send — zero friction.
- Open WA in new tab/window (`target="_blank"`, `rel="noopener"`) so they can come back.
- On mobile, `wa.me` auto-launches the app — preferred over `web.whatsapp.com`.

## What NOT to do
- ❌ Hardcode the phone number multiple times — one source in `app.js`.
- ❌ Send users to a contact form first — direct WhatsApp link only.
- ❌ Email or phone number alternatives in primary CTAs (it dilutes the funnel).
- ❌ Generic message text — always personalize with product / size.
