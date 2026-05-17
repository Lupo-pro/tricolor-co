# Outreach System · LATRICOLOR.CO

Closed-loop influencer outreach for the brand. Scrapes Colombian micro-influencers from Instagram + TikTok via Apify, filters + scores them, lets you swipe-validate via a local admin UI, then runs a 3-touch email sequence through Resend signed by **Nay** (brand owner).

```
Apify scrape  →  Filter + score  →  Swipe validation  →  Send sequence  →  Track + reply
   raw-*.json     enriched.json      validated.json     sent.json        responses.json
```

Everything except the three `/api/track-*.js` endpoints runs locally. Data files in `/outreach/data/*.json` are gitignored — no PII ever ends up on a public branch.

---

## Setup (one time)

### 1. ImprovMX aliases

The campaign emails are signed `Nay - La Tricolor <nay@latricolor.co>`. ImprovMX needs to route the reply mail to your real inbox.

In your [ImprovMX](https://improvmx.com) dashboard for `latricolor.co`:

| Alias | Forwards to |
|---|---|
| `hola@latricolor.co` | your Gmail |
| `nay@latricolor.co` | your Gmail |
| `colaboraciones@latricolor.co` | your Gmail |
| `lupo@latricolor.co` | your Gmail |

Then in **Resend** → Domains → add `latricolor.co` and add the SPF / DKIM / DMARC TXT records ImprovMX shows you to GoDaddy DNS. Wait for "Verified" status.

### 2. Apify

Sign up at [apify.com](https://apify.com), load **at least $10** of credit (each scrape run costs ~$1-3). Open Settings → Integrations → API tokens and copy the token.

### 3. `.env`

```bash
cd outreach
cp .env.example .env
```

Fill in the real values. **Never commit `.env`** — it's already in `outreach/.gitignore`.

```env
APIFY_API_TOKEN=apify_api_xxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxx          # same key the main /api/ uses
SENDER_EMAIL=nay@latricolor.co        # send.js falls back to hola@ if nay@ bounces
SENDER_NAME=Nay - La Tricolor
REPLY_TO_EMAIL=nay@latricolor.co
DAILY_SEND_LIMIT=10                   # warm-up curve overrides this if lower
TARGET_PROFILES=200
PUBLIC_SITE_URL=https://latricolor.co
ADMIN_PORT=3001
```

### 4. Install

```bash
cd outreach
npm install
```

---

## Weekly workflow

### Lunes — Scrape (~10 min wall time)

```bash
cd outreach
npm run scrape
```

Hits Apify with the Instagram + TikTok hashtag/location search defined in `src/scrape.js`. Outputs:
- `data/raw-instagram.json`
- `data/raw-tiktok.json`

CLI prints `✓ Scraped X / Y` summary at the end.

### Lunes — Enrich (~1 min)

```bash
npm run enrich
```

Reads the two raw files, dedupes across platforms, filters out anyone failing the contract (followers 3K-100K, ER ≥ 2%, recent posts, ES + Colombia, no blacklist keywords), scores 0-100, and writes `data/enriched.json` sorted by score DESC. Prints rejection breakdown + top-5 leads.

### Lunes — Validation (~20 min, manual)

```bash
npm run admin
```

Opens an Express server on `http://localhost:3001`. Go to **/influencers**.

Swipe-style UI:
- `←` skip
- `→` aprobar
- `↑` premium (priority queue)
- `↓` undo last action

Save & Quit when done. Writes `data/validated.json`.

### Lunes onwards — Send

```bash
npm run send
```

Run this once per day Monday-Friday. The script:
1. Looks up every validated contact's send history in `data/sent.json`
2. Decides which email is next:
   - Never sent → email #1
   - Sent #1, ≥3 days ago, no reply → email #2
   - Sent #2, ≥7 days from #1, no reply → email #3
3. Caps the daily batch with the **warm-up curve**:
   - Day 1-2 → 10/day
   - Day 3-4 → 15/day
   - Day 5-6 → 20/day
   - Day 7+  → 40/day
4. Sleeps 60-180s (random) between sends so the pattern looks human.
5. Tries `nay@latricolor.co` first; if Resend rejects it (domain not verified, etc.) falls back to `hola@latricolor.co` with a clear log.
6. Appends each send to `data/sent.json` after every attempt — crash-safe.

### Diario — Dashboard

```bash
npm run admin
```

Open **http://localhost:3001/dashboard**.

- KPI cards: total / today / week sends, response rate, bounce rate, warm-up day.
- Funnel bar chart: Scraped → Enriched → Approved → Sent → Replied.
- Top 30 active leads with action buttons:
  - **Marcar respondió** → adds a row to `responses.json` with timestamp.
  - **Envié body** (appears after respondió) → marks fulfilled, drops out of the "needs action" queue.

When a girl replies, the reply arrives in your Gmail via ImprovMX. Open the dashboard, hit **Marcar respondió**, fulfill the order in WhatsApp, then **Envié body**.

---

## File layout

```
/outreach/
├── README.md             this file
├── package.json          npm scripts + deps (apify-client, resend, express, dotenv)
├── .env.example          template — fill .env locally, never commit
├── .gitignore            keeps .env, node_modules, data/*.json out of git
├── /src/
│   ├── scrape.js         Apify IG + TikTok parallel scraper
│   ├── enrich.js         dedup + filter + score + email extract
│   ├── send.js           Resend sender with warm-up + nay→hola fallback
│   └── templates/
│       ├── email-1-pitch.html
│       ├── email-2-relance.html
│       └── email-3-lastcall.html
├── /data/                runtime state — local only
│   ├── raw-instagram.json
│   ├── raw-tiktok.json
│   ├── enriched.json
│   ├── validated.json    { approved, premium, skipped, timestamp }
│   ├── sent.json         append-only log of every send attempt
│   ├── warmup-day.json   curve state (auto-managed by send.js)
│   └── responses.json    manual reply log (mark via dashboard)
└── /admin/
    ├── server.js         Express on :3001
    ├── influencers.html  swipe validation UI
    └── dashboard.html    stats + leads + actions
```

The **public** site's `/api/` (separate from `/outreach/`) hosts the tracking endpoints:
- `/api/track-open?id=…` → 1×1 GIF + log
- `/api/track-click?id=…&url=…` → 302 + log
- `/api/unsubscribe?id=…&email=…` → log + confirmation page

These deploy with the main site via Vercel — no extra config.

---

## Scoring formula (out of 100)

| Component | Max | Rule |
|---|---|---|
| Engagement rate | 40 | 4%+ → 40; 2-4% linear ramp 0→40 |
| Followers | 25 | 5K-30K → 25; 3K-5K ramps 10→25; 30K-100K decays 25→5 |
| Niche keywords | 15 | fútbol / tricolor / colombia / moda / estilo / fitness / paisa / [city]: 5 pts each, capped |
| Email in bio | 10 | binary |
| Multi-platform | 10 | both IG + TikTok → 10 |

Tweak the weights in `src/enrich.js` if your batch needs different prioritization.

---

## Tracking — what's tracked, what's NOT

The `/api/track-*.js` endpoints run on Vercel (because email clients need a public URL). Vercel serverless functions don't have a persistent filesystem, so the events go to **stdout** — visible in:

- `vercel logs` CLI
- Vercel Dashboard → Project → Logs

The local `outreach` dashboard reports what we DO have locally:
- Total sends / per-day / per-week (from `sent.json`)
- Failed sends, bounce rate (from `sent.json` records with status="failed")
- Reply rate (from `responses.json` — you mark replies manually)

For **opens** and **clicks** at the campaign level: open the **Resend dashboard** — they track natively per email and the analytics view is richer than what we'd hand-roll.

**Want opens/clicks in the local dashboard?** Wire Vercel KV (or Upstash Redis):

```js
// /api/track-open.js, replace the console.log with:
import { kv } from '@vercel/kv';
await kv.hincrby(`open:${id}`, 'count', 1);
await kv.zadd(`opens:${today}`, { score: Date.now(), member: id });
```

…then add a `/api/local-stats` proxy that admin/server.js polls. ~30 LoC.

---

## Security + Legal

- **`.env` is gitignored.** Don't override.
- **`data/*.json` is gitignored.** Same.
- **`/outreach/` is in `/.vercelignore`** at the repo root — the outreach toolchain never ships to the public site.
- Every email has a working `unsubscribe` URL and a postal line (`Pereira, Risaralda · Colombia`) → CAN-SPAM / GDPR-Lite compliant.
- The 3-touch cap is hard-coded — `send.js` never sends a 4th to the same handle.
- **If bounces > 5%, stop and investigate.** Most likely cause: an outdated email list or the `from:` address losing its DKIM/SPF alignment. Pause sends, fix domain auth in Resend, then resume.

---

## Troubleshooting

| Symptom | Likely fix |
|---|---|
| `✗ APIFY_API_TOKEN missing or placeholder` | Fill `outreach/.env` from `.env.example` |
| `✗ No validated.json yet` | Run `npm run admin`, go to `/influencers`, swipe + Save before sending |
| `Primary sender nay@... rejected` warning | Domain not yet verified in Resend → falls back to `hola@` automatically; verify the domain to silence |
| Apify run returns 0 items | Actor input schema changed → open the actor page on apify.com, compare to the `INPUT` constant in `src/scrape.js`, adjust |
| `Rate limit hit. Stopping.` | Daily Resend cap → retry tomorrow. Lower `DAILY_SEND_LIMIT` if it persists. |
| Bounces > 5% | Stop. Verify domain auth (SPF/DKIM/DMARC). Consider warming up with a smaller daily cap. |

---

## Reset / start over

```bash
# Clear everything but keep the dir structure
rm outreach/data/*.json
touch outreach/data/.gitkeep

# Re-run scrape → enrich → admin → send
```

Sé Fuerte. Sé Fiera. Sé Tricolor 🇨🇴
