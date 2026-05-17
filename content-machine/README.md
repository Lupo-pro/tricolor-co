# LATRICOLOR.CO · Content Machine

Generación automática de contenido Instagram para el sprint Mundial 2026.

```
satori (HTML/JSX → SVG)  →  sharp (SVG → PNG 1080×…)
            ↓                            ↓
   Claude API (captions)          /data/drafts/{date}/
            ↓                            ↓
     /admin/swipe          (validation Tinder · 5 min/día)
            ↓                            ↓
   /data/approved/{date}/    →    Daily Pack ZIP
            ↓
   AirDrop → iPhone → Instagram (manuel)
```

**Current mode: manual posting** — le système génère + valide + emballe un ZIP, tu publies depuis ton iPhone. PostEverywhere automation reportée à P3 (voir bas de page).

---

## 🚀 Setup une seule fois

### 1. Dépendances
```bash
cd content-machine
npm install
```

### 2. .env
```bash
cp .env.example .env
nano .env
```

Champs obligatoires :
- `ANTHROPIC_API_KEY` — depuis https://console.anthropic.com → API Keys. Pour `claude-sonnet-4-6`. **~$0.012 par jour** (génère ~11 captions).
- `RESEND_API_KEY` — réutilise celle du projet principal (pas encore utilisée mais bientôt pour les notifs).
- `DASHBOARD_PORT` — laisser à `3002` sauf conflit.
- `TIMEZONE` — `America/Bogota` (utilisé pour le scheduling).

Champs reportés à P3 (laisser placeholders) :
- `POSTEVERYWHERE_API_KEY`
- `POSTEVERYWHERE_INSTAGRAM_ACCOUNT_ID`

### 3. Vérification visuelle
```bash
# Génère 5 stories de test (gratuit, pas d'appel Claude)
npm run test:story

# Ouvre data/drafts/test/ → tu dois voir 5 PNG 1080×1920 avec :
# - bandes drapeau top/bottom
# - logo TRICOLOR 3-couleurs
# - typo Anton + Bebas Neue
# - hard shadows offset
```

Si OK → tu es prêt.

---

## 📅 Workflow quotidien (5 minutes)

### Matin (5 min)
```bash
cd content-machine
npm run admin
```
→ ouvre http://localhost:3002/swipe

1. **`↻ Build day`** (header) → génère tous les visuels + captions du jour (~30s, ~$0.012 de Claude).
2. **Swipe** chaque card :
   - `✓ Approve` (vert) → copie le PNG dans `data/approved/{date}/`
   - `✗ Reject` (rouge) → marque rejected
   - `✎ Edit` (jaune) → modifie le caption inline (Ctrl+Enter pour save)
   - `⏭ Skip` (gris) → reporté à demain
3. **`Approve all`** sur une sequence bar → approuve les 5/8 stories d'un sequence d'un seul clic.

### Avant publication
```bash
# Bouton "📦 Build pack" dans le header
# OU en ligne de commande :
npm run pack
```
→ génère `data/daily-packs/{date}.zip`

### Sur l'iPhone
**Option A — AirDrop depuis Mac (recommandé)**
1. Finder → `data/daily-packs/{date}.zip`
2. Right-click → Share → AirDrop → ton iPhone
3. iPhone → Files → Téléchargements → tape sur le ZIP → Décompresse

**Option B — Téléchargement direct (si Mac + iPhone pas dispo simultanément)**
1. Sur l'iPhone, ouvre http://192.168.X.X:3002/swipe (ton IP locale Mac)
2. Tape `📦 Build pack` → le ZIP se télécharge sur l'iPhone
3. Files → Téléchargements → décompresse

**Pour trouver ton IP Mac** :
```bash
ipconfig getifaddr en0
# ou en1 si Wi-Fi
```

### Publication chronologique
Dans le ZIP : ouvre `README.md` → tu vois le planning :
```
| Hora  | Tipo     | Item                    | Archivo                                |
|-------|----------|-------------------------|----------------------------------------|
| 09:00 | 📱 Story | daily-drop · #1 hook    | stories/09-00-daily-drop-01-hook.png   |
| 10:00 | 📱 Story | daily-drop · #2 tease   | stories/10-00-daily-drop-02-tease.png  |
| 11:30 | 📰 Post  | hero-launch             | posts/11-30-hero-launch.png            |
| 12:00 | 🎠 Caro. | las-4-ediciones         | carousels/12-00-las-4-ediciones/       |
...
```

À chaque heure :
1. Instagram → Crear story / Publicación
2. Sélectionne le PNG correspondant
3. Retourne au README → copie le caption (bloc ``` ``` correspondant) → colle dans IG
4. Ajoute le sticker recommandé (poll / countdown / link) si applicable
5. Publie

---

## 📂 Structure du projet

```
content-machine/
├── README.md                ← ce fichier
├── package.json             apify-client, resend, archiver, satori, sharp
├── .env.example             template (placeholders only)
├── .env                     local secrets — NEVER commit
│
├── src/
│   ├── generate.js          CLI: --type=story|post|sequence|carousel
│   ├── build-day.js         Build tous les drafts du jour selon calendar.json
│   ├── build-pack.js        Build le ZIP daily-pack depuis approved/
│   ├── templater/
│   │   ├── brand.js         palette V5 · fonts · logo TRICOLOR · flagBar · grain
│   │   ├── post.js          1080×1080
│   │   ├── post-portrait.js 1080×1350
│   │   ├── story.js         1080×1920 (5 role renderers: hook/tease/reveal/urgency/cta)
│   │   └── carousel.js      N×1080×1080 (cover/middle/cta variants)
│   ├── sequences/
│   │   ├── daily-drop.js        5 stories · 4h drop arc
│   │   ├── match-day.js         8 stories autour d'un match Colombia
│   │   ├── fomo-countdown.js    4 stories urgency
│   │   ├── social-proof.js      6 stories reviews+UGC+stats
│   │   ├── behind-scenes.js     5 stories BTS Eje Cafetero
│   │   └── manifesto.js         4 stories brand storytelling
│   ├── ai/
│   │   ├── claude.js        SDK wrapper, SYSTEM_PROMPT V5 (es-CO, fanzine, IG constraints)
│   │   └── prompts.js       12 templates (drop, manifesto, matchDay, review, bundle, fomo, ugc, bts, countdown, poll, carousel, qa)
│   └── strategy/
│       ├── calendar.json    plan 17-mai → 30-juin + 3 match days
│       └── content-mix.js   day → plan resolver (calendar + DOW fallback)
│
├── admin/
│   ├── server.js            Express :3002 + API endpoints
│   └── public/
│       ├── swipe.html       Tinder validation UI (V5 styled)
│       ├── calendar.html    7-day plan view
│       └── assets/
│           └── styles.css   V5 palette + Anton/Bebas/Inter + hard shadows
│
└── data/                    (gitignored — local only)
    ├── drafts/{date}/       PNGs + manifest.json + captions.json
    ├── approved/{date}/     PNGs + manifest (with captions baked in)
    └── daily-packs/{date}.zip
```

---

## 🎨 Branding V5 (single source of truth)

`src/templater/brand.js` exporte :

| Export | Description |
|---|---|
| `PALETTE` | mirror of `/styles.css` :root vars |
| `loadFonts()` | Anton, Bebas Neue, Inter, Archivo Black (fontsource) |
| `el(type, props, ...children)` | satori-friendly factory (no JSX transformer) |
| `flagBar({ height, reversed })` | 3-color band yellow/blue/red |
| `grainOverlay({ opacity })` | SVG-data-URI noise pattern |
| `logoTricolor({ size, onDark, withLa })` | wordmark 3-syllabes |
| `starLabel(text, { color, size })` | "★ TEXT ★" Bebas eyebrow |

Le logo TRICOLOR utilise la technique **stacked layers** : chaque syllabe est rendue 2 fois — une fois en noir (8-direction textShadow → simulates stroke) + une fois en couleur drapeau. Donne un contour pixel-perfect même au scale.

`onDark: true` flip le contour en crème pour les fonds noirs.

---

## 📊 Scoring + ratio de contenu

`src/strategy/calendar.json` fixe le plan jour par jour avec un override pour les 3 match days Colombia (17/6, 23/6, 27/6).

Rotation par défaut quand calendar.json n'a pas d'entrée :

| Jour | Sequence primary | Notes |
|---|---|---|
| Lun | daily-drop | rotation édition par semaine |
| Mar | manifesto + social-proof | |
| Mer | daily-drop | autre édition |
| Jeu | behind-scenes + carousel | |
| Ven | social-proof | reviews / UGC |
| Sam | fomo-countdown | urgency |
| Dim | manifesto | brand content |

---

## 🛠️ CLI commands de référence

```bash
# Génération unitaire
npm run generate -- --type=story --headline="VAMOS COLOMBIA" --bg=red
npm run generate -- --type=post --headline="OFERTA" --subline="Solo hoy"
npm run generate -- --type=sequence --sequence=daily-drop --edition=la-capitana
npm run generate -- --type=carousel --slides=4 --edition=la-capitana

# Build du jour complet
node src/build-day.js                  # aujourd'hui
node src/build-day.js --date=2026-05-25 # date spécifique
node src/build-day.js --no-claude       # skip Claude (placeholder captions)

# Build du ZIP de publication
node src/build-pack.js                 # aujourd'hui
node src/build-pack.js --date=2026-05-25

# Dashboard
npm run admin                          # http://localhost:3002/swipe
```

---

## 🚧 Troubleshooting

| Symptôme | Cause probable | Fix |
|---|---|---|
| Dashboard ne charge pas | Port 3002 occupé | `lsof -ti:3002 \| xargs kill -9` ou change `DASHBOARD_PORT` dans .env |
| `Build day` échoue avec "ANTHROPIC_API_KEY missing" | .env pas rempli | `nano .env` et fill |
| Captions reviennent vides | Quota Claude dépassé | Vérifie sur console.anthropic.com → Usage |
| Visuels ont du texte écrasé | satori font cache stale | `rm -rf node_modules/.cache` puis `npm install` |
| ZIP incomplet | Pas d'approbations | Approuve au moins 1 item dans le swipe avant `Build pack` |
| satori "Expected display flex" | nouvel élément sans `display: flex` | Tous les divs satori doivent avoir `display: flex` explicite |

---

## 💰 Coûts mensuels estimés

| Service | Usage | Coût |
|---|---|---|
| Claude API (sonnet-4-6) | ~11 captions/jour × 30 jours | **~$0.40/mois** |
| satori + sharp + archiver | tout local | $0 |
| Tout le reste | local-only | $0 |

**Total : <$1/mois** pour la phase manuelle.

À ajouter quand on passe à PostEverywhere (P3) : ~$19/mois.

---

## 🗺️ Roadmap (P3)

Quand workflow manuel est rodé (post 1-2 semaines de manual posting), migration vers automation :

1. **PostEverywhere publisher** (`src/publish/posteverywhere.js`)
   - Upload media → create post draft → schedule
   - Reuse les approved manifest comme source
   - Mode draft-then-approve pour le filet de sécurité humain

2. **Cron daily generator** (Vercel cron ou GitHub Actions)
   - 7am Colombia time → build-day.js → notify via Resend
   - Email "✓ Drafts ready · http://localhost:3002/swipe"

3. **Webhook PostEverywhere → /api/posteverywhere/webhook**
   - Update status: scheduled → posted
   - Capture engagement metrics

4. **Dashboard stats**
   - Open rate / click rate par post (PE webhook)
   - Top-performing posts week-over-week
   - Mark-as-replied flow pour les DMs entrantes

---

## 🇨🇴 Le manifeste

> Nacimos amarillas, azules y rojas.
> Crecimos cantando el himno con la mano en el pecho.
> Lloramos cuando ganamos. Gritamos cuando perdemos.
> Somos tribuna, somos sala, somos calle.
>
> **Este body no es ropa. Es bandera.**
>
> Sé Fuerte. Sé Fiera. Sé Tricolor.
