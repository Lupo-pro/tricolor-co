# Deploy · LATRICOLOR.CO

Step-by-step pour déployer le site sur Vercel et brancher le domaine `latricolor.co`.

---

## 0. Prérequis

- Compte GitHub (le repo est sur `Lupo-pro/tricolor-co`)
- Compte Vercel (gratuit, plan Hobby suffit pour un site statique)
- Le domaine `latricolor.co` acheté chez ton registrar (Namecheap, GoDaddy, Cloudflare Registrar…)
- `vercel` CLI optionnel mais pratique : `npm i -g vercel@latest`

---

## 1. Connecter le repo à Vercel

### Option A — via le dashboard (recommandé pour la première fois)

1. Va sur https://vercel.com/new
2. Clique **Import Git Repository**
3. Authorize Vercel sur GitHub si c'est ta première fois
4. Sélectionne `Lupo-pro/tricolor-co`
5. Sur l'écran de config :
   - **Framework Preset** : `Other` (ou `Static HTML`)
   - **Root Directory** : `./` (par défaut)
   - **Build Command** : *laisser vide* (site 100 % statique, rien à builder)
   - **Output Directory** : *laisser vide* (sert depuis la racine)
   - **Install Command** : *laisser vide*
6. Clique **Deploy**

Premier déploiement : ~30 secondes. Tu obtiens une URL preview type `tricolor-co-xxx.vercel.app`.

### Option B — via la CLI

```bash
cd ~/projects/tricolor-co
vercel login
vercel link          # lie le dossier au projet Vercel
vercel               # deploy preview
vercel --prod        # deploy en production
```

Sur le prompt `Set up and deploy?`, accepte les défauts (Vercel détectera `vercel.json` à la racine et fera le bon thing).

---

## 2. Vérifier la prod

Une fois le premier deploy en prod terminé :

```bash
# Check rapide
curl -sI https://tricolor-co.vercel.app/ | head -8
```

Tu dois voir :
- `HTTP/2 200`
- `content-encoding: br` (Brotli ✅)
- `cache-control: public, max-age=…` (selon les règles de `vercel.json`)
- Les security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, etc.)

Audit Lighthouse une fois en prod :

```bash
npx lighthouse https://tricolor-co.vercel.app/ \
  --quiet --emulated-form-factor=mobile \
  --output html --output-path /tmp/lh.html \
  --chrome-flags="--headless"
open /tmp/lh.html
```

Attendu : Performance 90+, A11y 100, Best Practices 100, SEO 100.

---

## 3. Brancher le domaine `latricolor.co`

### a) Dans le dashboard Vercel

1. Va sur le projet → **Settings → Domains**
2. Ajoute `latricolor.co` puis `www.latricolor.co`
3. Vercel te montre les enregistrements DNS à créer

### b) Côté registrar (DNS records)

Connecte-toi à ton registrar (Namecheap, etc.) et configure :

| Type | Hôte | Valeur | TTL |
|------|------|---------|-----|
| **A** | `@` | `76.76.21.21` | Auto |
| **CNAME** | `www` | `cname.vercel-dns.com.` | Auto |

> Note : la valeur exacte du CNAME et le `A` peuvent évoluer côté Vercel. **Toujours utiliser ce que le dashboard Vercel affiche** dans Settings → Domains au moment du setup. Les valeurs ci-dessus sont celles standard fin 2025.

Si ton registrar est **Namecheap** :
- Domain List → Manage → **Advanced DNS**
- Supprime les records par défaut (Parking redirect, etc.)
- Add new record → choisis A Record et CNAME selon le tableau

Si ton registrar est **Cloudflare** :
- ⚠️ Mettre les records en mode **DNS only** (nuage gris), pas Proxied (orange). Vercel a son propre CDN ; le double-proxy casse les caches et les certs.

### c) Attendre la propagation

DNS prend de 5 min à 48h pour se propager. Vérifie :

```bash
dig latricolor.co +short        # doit retourner 76.76.21.21
dig www.latricolor.co +short    # doit retourner cname.vercel-dns.com puis l'IP
```

Quand c'est OK, Vercel délivre automatiquement le certificat Let's Encrypt — généralement < 1 minute après la résolution DNS.

### d) Redirect www → apex (ou l'inverse)

Dans Settings → Domains, sur Vercel :
- Choisis ton **primary domain** : `latricolor.co` (apex sans www, recommandé pour la marque)
- L'autre (`www.latricolor.co`) sera configuré comme redirect 308 vers le primary

---

## 4. Remplacer le placeholder WhatsApp

Le numéro WhatsApp est centralisé dans **un seul endroit** : `app.js`, première constante.

```js
// app.js — ligne ~9
const WHATSAPP_NUMBER = '573000000000';   // ← placeholder
```

Pour le remplacer :

1. Édite `app.js` localement
2. Remplace `573000000000` par le vrai numéro au format **`57XXXXXXXXXX`** :
   - Préfixe `57` (Colombie)
   - 10 chiffres du numéro mobile (sans le `0` initial, sans le `+`, sans espaces)
   - Ex. : un numéro `+57 300 123 4567` → `573001234567`
3. Commit + push sur `main` :

```bash
git add app.js
git commit -m "config: set production WhatsApp number"
git push
```

Vercel redéploie automatiquement en prod (~30 s).

**Pour vérifier que c'est appliqué partout** :

```bash
grep -nR "wa.me\|573000000000" index.html app.js styles.css
```

Tu ne dois voir que **les deux lignes dans `app.js`** (la constante + la fonction `buildWaUrl`). Tous les liens HTML utilisent `data-wa` et `app.js` injecte le bon href au load.

> 🇨🇴 Bon à savoir : sur mobile, `wa.me/<numero>` ouvre directement l'app WhatsApp. Sur desktop, ça ouvre `web.whatsapp.com` ou Desktop selon ce que l'utilisateur a. Aucune config supplémentaire requise.

---

## 5. Tests post-déploiement

### Check liste

- [ ] `https://latricolor.co/` → 200, page rendu correctement
- [ ] `https://www.latricolor.co/` → redirect 308 vers `latricolor.co` (ou l'inverse selon choix)
- [ ] Cert HTTPS valide (Let's Encrypt, vert dans le navigateur)
- [ ] OG image OK : tester sur https://www.opengraph.xyz/url/https%3A%2F%2Flatricolor.co
- [ ] Twitter card OK : tester sur https://cards-dev.twitter.com/validator
- [ ] Rich results OK (JSON-LD Product schemas) : https://search.google.com/test/rich-results
- [ ] Tous les CTA WhatsApp ouvrent une conversation avec le bon numéro pré-rempli
- [ ] Sticky mobile bar apparaît dans `.collection`, disparaît à `.footer`
- [ ] Lightbox s'ouvre depuis chaque produit
- [ ] Size calculator donne des recos cohérentes pour S (busto 82 / cintura 64 / cadera 90), M (92/72/100), L (100/80/106)
- [ ] 404 personnalisé : `https://latricolor.co/n-existe-pas` → ta page 404 brandée

### Soumettre le sitemap à Google

1. Va sur https://search.google.com/search-console
2. Add property → `https://latricolor.co/`
3. Vérifie via DNS TXT record ou HTML tag (le DNS est plus simple, ajoute-le chez ton registrar)
4. Sitemaps → ajoute `https://latricolor.co/sitemap.xml`

---

## 6. Workflow de déploiement continu

À partir de maintenant, **chaque push sur `main` redéploie en prod**, chaque push sur une autre branche crée un preview deploy unique :

```bash
# Tu bosses sur une feature
git checkout -b feat/photos-reelles
# … modifs …
git commit -m "feat: real product photos"
git push -u origin feat/photos-reelles
# → Vercel crée automatiquement un preview deployment
# → Tu testes l'URL preview
# → Quand c'est OK, merge sur main → deploy prod
```

Si tu veux **rollback** un deploy raté :
- Dashboard Vercel → Project → Deployments
- Trouve un deploy précédent qui marche
- Clique `…` → **Promote to Production**
- Rollback instantané (en quelques secondes)

---

## 7. Variables d'environnement (futur)

Le site n'utilise actuellement **aucune variable d'environnement** (tout est statique). Si plus tard on ajoute :
- Analytics (Vercel Analytics, Plausible) → variables Vercel
- Webhook Stripe/PayPal pour le checkout en ligne → ajouter via `vercel env add`
- API pour vraiment lire un stock dynamique → idem

Référence : `vercel env --help` ou le skill `vercel:env-vars` dans `.claude/skills/`.

---

## 8. Monitoring & alertes

Plan Hobby gratuit :
- **Vercel Analytics** : activable en 1 clic depuis Settings → Analytics. Donne les Core Web Vitals en field data (LCP, INP, CLS de vrais utilisateurs).
- **Speed Insights** : idem, gratuit jusqu'à 25 000 vues/mois.

Si on dépasse ou pour des features avancées (uptime monitoring, alertes Slack/Discord), passer en plan Pro (~$20/mois).

---

## 9. Bilan rapide

Si tout est OK, en pratique, le déploiement complet (depuis le commit jusqu'au site en prod sur `latricolor.co`) prend :
- Premier setup : 10-30 minutes (mostly waiting on DNS propagation)
- Push suivant : < 1 minute end-to-end

🇨🇴 *Sé Fuerte. Sé Fiera. Sé Tricolor.*
