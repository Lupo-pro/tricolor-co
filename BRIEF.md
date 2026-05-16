# 🇨🇴 TRICOLOR.CO — Project Brief

> **Sé Fuerte. Sé Fiera. Sé Tricolor.**

Ce document est la **bible du projet**. Claude Code doit le lire en référence avant chaque décision de design, copywriting ou architecture. En cas de doute, ce document fait foi.

---

## 1. CONTEXTE BUSINESS

**Marque** : TRICOLOR.CO  
**Catégorie** : Mode féminine football lifestyle  
**Produit** : Bodysuits inspirés de la Selección Colombia  
**Timing** : Edición Mundial 2026 (Mundial commence le 11 juin 2026)  
**Localisation** : Colombia, basé dans l'Eje Cafetero (Pereira/Armenia)  
**Modèle** : Vente directe WhatsApp + contraentrega (PAS de paiement en ligne)  
**Domaine cible** : tricolor.co  
**Stack** : HTML + CSS + JS vanilla, déployé sur Vercel

---

## 2. POSITIONNEMENT

> **TRICOLOR.CO est la première marque de bodywear féminin colombien qui transforme la fierté patriotique en pièce mode collector — pour la hinchada qui veut porter la Selección sur sa peau, pas seulement dans son cœur.**

**Différenciation** :
- Pas un maillot de foot féminisé
- Pas une réplique adidas générique
- Le premier body conçu pour la femme colombienne qui veut être TRICOLOR — fière, fière de l'être, et fière de le montrer

---

## 3. BIG IDEA

> **"Sois fière. Sois forte. Sois Tricolor."**

3 angles combinés en une promesse triple :
- **Fière** d'être colombienne (patriotisme)
- **Forte** dans sa féminité (empowerment)
- **Unique** avec une pièce limitée Mundial 2026 (collector)

---

## 4. MANIFESTO (texte à intégrer textuellement)

```
Nacimos amarillas, azules y rojas.
Crecimos cantando el himno con la mano en el pecho.
Lloramos cuando ganamos. Gritamos cuando perdemos.
Somos tribuna, somos sala, somos calle.

Este body no es ropa. Es bandera.
No lo usas. Lo llevas puesto como llevas tu apellido.

Sé Fuerte. Sé Fiera. Sé Tricolor.
```

**Mots à mettre en accent** :
- "amarillas" → jaune
- "Gritamos" → rouge italique
- "Es bandera." → rouge gras
- "Sé Tricolor." → jaune

---

## 5. ARCHÉTYPE DE MARQUE

**The Patriot Hero** (mix Hero + Everyman) — la marque qui rassemble une nation autour d'une fierté partagée, accessible à toutes, mais portée avec force.

**Référence culturelle** : Si Juanes, Karol G et Shakira créaient une marque ensemble pour le Mundial.

---

## 6. PERSONAS (3 segments, message universel)

### 👩 Manuela — 22 ans, Bogotá, étudiante
- *"Lo quiero para los partidos con las amigas y para el TikTok."*
- Use case : stade, bars sportifs, fiestas Mundial, contenus social
- Acheteuse via : TikTok / Instagram Reels
- Prix sensible : OUI — cherche le drop limité

### 👩 Catalina — 31 ans, Medellín, marketing manager
- *"Quiero algo elegante pero patriótico. Que se vea bien con jeans o falda."*
- Use case : afters travail, brunchs, soirées privées Mundial
- Acheteuse via : Instagram / Facebook Marketplace
- Prix sensible : MOYEN — paie pour la qualité

### 👩 Diana — 38 ans, Cali, mère & supportrice
- *"Para vivir cada partido en familia y sentirme parte."*
- Use case : matchs à domicile, restos, terrasses
- Acheteuse via : WhatsApp / recommandation amies
- Prix sensible : NON — achète émotionnel

**→ Le site doit parler aux 3** sans jamais exclure aucune. L'angle "fierté nationale" est universel — c'est le liant.

---

## 7. PALETTE COULEURS (CSS variables exactes)

```css
:root {
  /* Neutres - 80% du design */
  --bg: #FAF7F2;           /* Crema - fond principal, JAMAIS blanc pur */
  --bg-warm: #F2EDE4;       /* Crema Cálida - cards secondaires */
  --bg-cream: #EDE7DA;      /* Crema profond */
  --ink: #0A0A0A;           /* Tinta - texte, headers */
  --ink-soft: #2A2A28;      /* Tinta Suave - body text */
  --ink-mid: #4A4A48;       /* Texte secondaire */
  --muted: #8A867E;         /* Tierra - captions, muted */
  --line: rgba(10,10,10,0.08);
  --line-strong: rgba(10,10,10,0.15);

  /* Tricolor - 15% du design */
  --yellow: #FCD116;        /* Amarillo Tricolor - highlights, accents énergie */
  --yellow-deep: #E8B800;
  --blue: #003893;          /* Azul Marino - profondeur, trust */
  --blue-light: #4FB8E8;
  --red: #CE1126;           /* Rojo Pasión - CTAs principaux, urgence */
  --red-deep: #8A0E1F;

  /* Premium accent - 5% du design */
  --gold: #C9A961;          /* Oro Cafetero - édition Premium */

  /* Service */
  --wa: #25D366;            /* WhatsApp green */
  --wa-dark: #1FB855;
}
```

**Règles d'usage strictes** :
- **80% neutres** (crème + tinta) pour la sophistication
- **15% UN SEUL tricolor** par section (jamais les 3 ensemble en aplat — kitsch)
- **5% accent oro** pour les moments premium
- **Rouge = action**, jaune = celebration, bleu = trust
- **JAMAIS** de blanc pur #FFFFFF
- **JAMAIS** de purple gradients (AI slop générique)

---

## 8. TYPOGRAPHIE

### Display (titres, manifesto, prix)
**Fraunces** (Google Fonts) — serif moderne avec personnalité, italique élégant
- Light 300 italique : pour les "em" et accents poétiques
- Regular 400 : titres principaux
- Medium 500 : sous-titres importants
- Bold 700 : numéros, statistiques
- Black 900 : logo

### Body (paragraphes, navigation, CTAs)
**Inter** (Google Fonts) — sans-serif neutre, ultra lisible
- Regular 400 : paragraphes
- Medium 500 : labels
- SemiBold 600 : CTAs, navigation
- Bold 700 : emphasis

### Règle d'or
Toujours **mixer un serif élégant + un sans-serif moderne**. Jamais 100% sans-serif (générique e-commerce). Jamais 100% serif (trop fashion).

### Import
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

---

## 9. PRODUITS (4 éditions + 1 pack)

| Ref | Couleur | Nom commercial | Sous-titre | Description courte |
|-----|---------|---------------|------------|---------------------|
| 01 | 🟡 Jaune | **La Capitana** | Edición Home | "El amarillo eterno de la Tricolor." |
| 02 | 🔵 Bleu | **La Portera** | Edición Away | "El azul retro que todas quieren." |
| 03 | ⚫ Noir/Or | **Oro Negro** | Edición Premium | "Negro con detalles dorados." |
| 04 | 🔴 Rouge | **La Cafetera** | Edición Alterna | "Rojo pasión cafetera." |

**Bundle** : **El Once Inicial** — Pack des 4 éditions (clin d'œil aux 11 joueurs de départ d'une équipe de foot)

### Prix
- **Unitaire** : $99.000 COP (ancien prix barré : $149.000)
- **Pack El Once Inicial** : $329.000 COP (au lieu de $596.000, économie de $267.000)
- **Discounts** : 2 unités = -10%, 3 unités = -15%, 4 unités (pack) = -45%

### Tailles
- S (32-34)
- M (36-38) — taille par défaut, la plus demandée
- L (40-42)

### Tags par produit (pour cards)
- La Capitana → "Más Vendido"
- La Portera → "Vintage"
- Oro Negro → "Premium"
- La Cafetera → "Pasión"

---

## 10. TONE OF VOICE

### ✅ Mots à utiliser
- **Tricolor, Selección, La Tribuna, La Cafetera, La Patria, La Hinchada**
- **Fuerza, pasión, hermandad, garra, fiera**
- **Tuya, nuestra, mía, juntas, cafeteras**
- Énergie : *"Sé fuerte", "Únete a la Tribuna", "Asegura el tuyo"*

### ❌ Mots interdits
- "Réplica", "fake", "copia", "imitación" → **on dit "edición inspirada"**
- "Cheap", "barato" → **on dit "precio especial Mundial"**
- "Body sexy" trop direct → **on dit "body que potencia tu silueta"**
- Anglicismes inutiles ("trendy", "must-have") → reste en espagnol
- "Click here", "buy now" → toujours du contextuel en espagnol

### Tone matrix
| Contexte | Tone |
|----------|------|
| Site (headlines) | Fier, poétique, court |
| Site (descriptions produit) | Sensoriel, premium |
| Instagram caption | Émotionnel, sororité |
| TikTok | Énergique, hype, drôle |
| WhatsApp client | Chaleureux, *"mi amor", "linda"* |
| Email confirmation | Pro mais humain |

---

## 11. CTA STANDARDS

| Action | Texte CTA |
|--------|-----------|
| Pédir produit | **"Pedir por WhatsApp"** |
| Voir collection | **"Ver la Colección"** |
| Bundle | **"Lo Quiero Completo"** ou **"Llévate el Once Inicial"** |
| Newsletter (futur) | **"Únete a la Tribuna"** |
| Urgence stock | **"Asegura el tuyo"** |
| Generic action | **"Pedir el Mío"** |

### URLs WhatsApp
Format : `https://wa.me/573000000000?text=ENCODED_MESSAGE`  
⚠️ Numéro **573000000000** est un placeholder — sera remplacé plus tard.

### Messages pré-remplis selon contexte
- **CTA général** : `¡Hola! Quiero pedir mi body Tricolor 🇨🇴`
- **Card produit** : `¡Hola! Me interesa [NOM] 🇨🇴 ¿Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?`
- **Modal avec taille** : `¡Hola! Quiero pedir el body [NOM] 🇨🇴\n\nTalla: [SIZE]\nPrecio: [PRICE]\n\n¿Está disponible?`
- **Pack** : `¡Hola! Quiero pedir el Once Inicial (Pack 4 ediciones) 🇨🇴 ¿Está disponible?`

---

## 12. STRUCTURE DU SITE (single page)

1. **Announce bar** (sticky top, défilante) — Slogans Mundial
2. **Nav** (sticky, blur backdrop) — Logo + liens + CTA + burger mobile
3. **Hero** — Titre 3 lignes animées + visuel + 3 float cards + countdown bar
4. **Marquee** — "Sé Fuerte · Sé Fiera · Sé Tricolor" défilant
5. **Manifesto** — Fond noir, manifeste en italic Fraunces
6. **La Colección** — Grid 2x2 (mobile) / 4x1 (desktop) + bundle El Once Inicial
7. **Benefits** — 4 cards (Envío, Contraentrega, Garantía, Hecho con Pasión)
8. **Cómo Comprar** — 3 pasos sur fond noir
9. **La Tribuna** — Reviews marquee infinie + stats card
10. **FAQ** — Accordéon
11. **CTA Final** — Glow background + gros bouton WhatsApp
12. **Footer** — Manifesto signature + cols + social + copyright
13. **Sticky WhatsApp button** — Fixed bottom-right avec pulse
14. **Product modal** — Slide-up mobile, centered desktop

---

## 13. SPECS TECHNIQUES

### Mobile-first OBLIGATOIRE
- Breakpoints : default 375px+, 640px tablet, 1024px desktop, 1440px wide
- Touch targets : min 44x44px
- Vibration haptique : `navigator.vibrate(8)` sur les boutons
- `viewport-fit=cover` + safe areas iOS
- `theme-color` meta tag `#0A0A0A`

### Performance
- Pas d'images bitmap (tout en SVG inline + CSS gradients)
- Google Fonts en preconnect + `display=swap`
- Pas de librairies externes (vanilla JS pur)
- CSS variables pour tout
- Animations CSS only (pas de JS pour les anims)

### Interactions JS
- Countdown live mis à jour chaque seconde (date cible : `2026-06-11T16:00:00-05:00`)
- Smooth scroll sur anchor links avec offset de la nav
- Intersection Observer pour reveal animations (`.reveal` class, staggered 80ms)
- Burger menu toggle
- Modal open/close (ESC, click outside, X button)
- Size selector qui update le href WhatsApp dynamiquement
- FAQ accordéon (un seul ouvert à la fois)
- Sticky WA button apparaît après 300px scroll
- Counter animation sur "500+" avec easeOutCubic
- Console easter egg en jaune Tricolor

### Animations CSS clés
- Hero title : 3 lignes staggered fadeUp delay 0.1/0.25/0.4s
- Float cards : translateY(-10px) loop 5-7s
- Marquee : translateX scroll 30-45s infinite
- Pulse rouge sur dot d'urgence
- Pulse WhatsApp green sur sticky button
- Hover product cards : translateY(-4px) + scale body SVG
- Reveal class : opacity 0 + translateY(30px) → visible

### Accessibility
- `aria-label` sur tous les boutons icon-only
- `prefers-reduced-motion` : réduit toutes les animations
- Contrast WCAG AA minimum
- Focus visible sur tous les interactifs

### SEO + Meta
```html
<title>TRICOLOR.CO — Sé Tricolor · Mundial 2026</title>
<meta name="description" content="Bodysuits Selección Colombia · Edición Mundial 2026. No es un body. Es tu bandera. Envío contraentrega a toda Colombia.">
<meta property="og:title" content="TRICOLOR.CO · Sé Tricolor">
<meta property="og:description" content="No es un body. Es tu bandera. Edición Mundial 2026.">
<meta property="og:type" content="website">
<html lang="es">
```

---

## 14. DESIGN DETAILS NON-NÉGOCIABLES

### ✅ À FAIRE
- **Grain texture overlay** subtle 3-4% opacity sur tout le body (feeling tactile)
- **Coins arrondis** 12-16px sur cards, 999px sur CTAs (pills)
- **Patterns diagonaux** subtils sur cards produit (rappel mesh sportif)
- **Gradients radiaux** pour glow effects (jaune + rouge derrière CTA final)
- **Shadows soft + colorées** (jaune sur card jaune, rouge sur CTA dark)
- **Italic Fraunces** partout sur les accents émotionnels
- **3-stripes flag mark** dans le logo (jaune, bleu, rouge)

### 🚫 NE JAMAIS FAIRE
- 🚫 PAS de drapeau colombien en aplat fullscreen (= kitsch)
- 🚫 PAS de logos adidas / FCF en gros (= problème légal)
- 🚫 PAS de pose mannequin "sexy maillot foot" (= cliché)
- 🚫 PAS de "réplica AAA" écrit sur le site (= cheap branding)
- 🚫 PAS de fonds blancs purs (= générique Shein)
- 🚫 PAS de purple gradients (= AI slop générique)
- 🚫 PAS de "click here", "buy now" (= e-com basique)
- 🚫 PAS d'emojis dans les headlines (sauf 🇨🇴 dans manifeste/footer)

---

## 15. RÉFÉRENCES VISUELLES

**Mood board inspiration** (NE PAS copier, juste s'inspirer) :
- **Skims** (skims.com) — minimalisme luxe féminin, photographie soft
- **Aimé Leon Dore** (aimeleondore.com) — editorial sportswear premium
- **Telfar** (telfar.net) — drop culture, exclusivity
- **Diesel** (diesel.com) — éditorial mode + énergie

**Différence** : on garde le minimalisme luxe MAIS on injecte la chaleur latine et la fierté colombienne via les accents tricolor, les mots espagnols, et le manifesto émotionnel.

---

## 16. RÉSUMÉ EN 1 PHRASE

> **TRICOLOR.CO est la première marque de bodywear féminin colombien qui transforme la fierté patriotique en pièce mode collector — pour la hinchada qui veut porter la Selección sur sa peau, pas seulement dans son cœur.**

---

## 17. WORKFLOW GIT (commits suggérés)

Si tu construis from scratch, commit par étapes logiques :

1. `feat: scaffold HTML structure with semantic sections`
2. `feat: CSS variables, reset, typography system`
3. `feat: announce bar + sticky nav with mobile menu`
4. `feat: hero section with animated title and countdown`
5. `feat: manifesto section with editorial typography`
6. `feat: collection grid with 4 product cards`
7. `feat: bundle El Once Inicial card`
8. `feat: benefits, how-to-buy, tribuna sections`
9. `feat: FAQ accordion and CTA final`
10. `feat: footer with manifesto signature`
11. `feat: sticky WhatsApp button and product modal`
12. `feat: JS interactions - countdown, modal, smooth scroll, reveals`
13. `polish: responsive breakpoints and mobile optimizations`
14. `polish: accessibility, SEO, meta tags`
15. `docs: update README with deploy instructions`

Push vers `main` après chaque commit ou groupe logique.

---

**Owner** : Lupo (Pereira/Armenia, Colombia)  
**Project** : TRICOLOR.CO  
**Last updated** : May 2026  

🇨🇴 *Con orgullo cafetero.*