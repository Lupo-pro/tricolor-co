# A/B test: `/o` splitter + `/api/track` conversion logging

Three landing variants are live, split by a single ad entry point and
measured by a KV-backed counter endpoint.

| Variant | URL          | Angle                  | `window.LANDING_VARIANT` |
|---------|--------------|------------------------|--------------------------|
| A       | `/oferta`    | Aggressive funnel      | `'A'`                    |
| B       | `/oferta-2`  | Emotional / pride      | `'B'`                    |
| C       | `/oferta-3`  | Social proof / trust   | `'C'`                    |

## Point ads here: `latricolor.co/o`

`o.html` runs a synchronous `<head>` script (before paint) that:

1. Reads the `latricolor_variant` cookie. If set & valid → reuse it
   (returning visitors never re-randomize → clean test, no flicker).
2. Otherwise assigns A/B/C at ~33/33/33 via `Math.random()`.
3. Writes/refreshes the cookie (`path=/`, `SameSite=Lax`, 30-day expiry).
4. `location.replace()` to the variant, **preserving all incoming query
   params** (utm_source, utm_medium, utm_campaign, ttclid, …) and
   **appending `?v=<A|B|C>`** so the variant is visible in analytics.

No-JS fallback: `<noscript>` meta-refresh to `/oferta`.

## Conversion logging — `POST /api/track`

Body: `{ variant: 'A'|'B'|'C', event: 'visit'|'whatsapp_click'|'price_cta_click', meta?: {} }`

Fired from every variant page (`track()` helper in the page script):

- **visit** — once on load.
- **whatsapp_click** — every WhatsApp CTA click (alongside the existing
  TikTok pixel event — the pixel is untouched).
- **price_cta_click** — additionally on the X1/X2/X3 `COMPRAR` buttons
  (`data-label` starting with `pack-`).

Clicks use `navigator.sendBeacon()` (reliable even as the tab navigates
to WhatsApp), falling back to `fetch(..., {keepalive:true})`.

### KV storage model (Upstash Redis / Vercel KV REST API)

Each event does a one-round-trip pipeline of two `INCR`s:

```
stats:<V>:<event>                 # all-time total      e.g. stats:A:visit
stats:<V>:<event>:<YYYY-MM-DD>    # daily breakdown     e.g. stats:A:visit:2026-06-03
```

The endpoint talks to KV over plain `fetch` against its REST API — no
`@vercel/kv` dependency, so it ships with no install/build step. If KV is
unconfigured or unreachable it logs to the function log and returns `204`
anyway — **tracking never blocks the user or throws**.

## Environment variables to add in the Vercel dashboard

Provision a Redis store: **Vercel dashboard → Storage → Create → Upstash
for Redis** (this is the current replacement for the old Vercel KV), then
connect it to this project. Connecting auto-injects these into the
project's env (Production + Preview):

| Variable             | Required | Notes                                              |
|----------------------|----------|----------------------------------------------------|
| `KV_REST_API_URL`    | yes      | REST endpoint of the store. Auto-added on connect. |
| `KV_REST_API_TOKEN`  | yes      | REST bearer token. Auto-added on connect.          |
| `STATS_READ_TOKEN`   | no       | If set, enables the read endpoint below.           |

After connecting the store, **redeploy** so the function picks up the env
vars. Nothing is hardcoded — `api/track.js` reads `process.env`.

## Confirming data is flowing

**Option 1 — Vercel function logs (works immediately, even before KV):**
Open the project → Logs, filter for `api/track`. Each call logs a line
like `{"event":"track","variant":"A","name":"visit",...}`.

**Option 2 — Upstash data browser:** open the store in the Vercel
dashboard → Data Browser, look for keys `stats:A:visit`, etc.

**Option 3 — built-in read endpoint (optional):** set `STATS_READ_TOKEN`
to any secret, redeploy, then:

```
curl "https://latricolor.co/api/track?stats=1&token=YOUR_STATS_READ_TOKEN"
```

returns `{ ok:true, stats:{ "stats:A:visit":N, "stats:A:whatsapp_click":N, ... } }`.
Without the token (or if it's unset) the read endpoint 404s — it is never
public by default.

**Smoke test from the terminal:**

```
curl -XPOST https://latricolor.co/api/track \
  -H 'content-type: application/json' \
  -d '{"variant":"A","event":"visit"}'      # → 204, increments stats:A:visit
```

## Reading results

Compare per-variant rates, e.g. conversion = `whatsapp_click / visit`:

```
stats:A:whatsapp_click / stats:A:visit
stats:B:whatsapp_click / stats:B:visit
stats:C:whatsapp_click / stats:C:visit
```

`price_cta_click` is the higher-intent signal. The `(ref: A|B|C)` tag
appended to every WhatsApp pre-filled message ties the actual sales
conversation back to the variant.
