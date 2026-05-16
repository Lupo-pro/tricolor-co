# TRICOLOR.CO

Bodysuits Selección Colombia · Edición Mundial 2026.

> **Sé Fuerte. Sé Fiera. Sé Tricolor.**

Site vitrine maximaliste avec funnel WhatsApp (pas de paiement en ligne — vente directe + contraentrega).

## Direction artistique : V5 HINCHADA CHAOS

Le site actuel est un rebuild radical depuis la V1 minimaliste-premium. La V5 vise une énergie **stadium-luxe** : tribune, fumigènes, banderoles, cartes Panini, fanzines de foot. Maximaliste, brut, chaotique mais magnifique.

L'ancienne version est conservée dans `/archive-v1/` pour référence.

## Stack
- HTML / CSS / JS vanilla — zero dependency, zero framework
- Hébergement : Vercel (`vercel.json` pour les en-têtes de cache + Permissions-Policy)
- Domaine cible : `tricolor.co`

## Brand (V5)
- **Tagline** : Sé Tricolor.
- **Palette** :
  - Crema estadio `#F0EBE0` (fond principal)
  - Negro hinchada `#0A0A0A` (texte, manifesto)
  - Amarillo Bandera `#FFD300` (highlights drapeau)
  - Azul Cancha `#0033A0` (bleu drapeau officiel)
  - Rojo Bengala `#E63946` (CTAs, urgence)
  - Verde Césped `#2D5016` (détails terrain)
- **Typographie** :
  - Display : **Anton** (compact, stadium signage)
  - Accent italique : **Bebas Neue**
  - Poster : **Archivo Black**
  - Body : **Inter**
- **Tone** : Patriotique, fier, énergique, *grita-más*. Toujours en espagnol colombien.

## Produits
4 éditions limitées (Mundial 2026, 200 unidades total) :

| Ref | Nom commercial | Posición | # | Edition |
|-----|---------------|----------|---|---------|
| 01 | **La Capitana** | Titular | 10 | Home Capitana |
| 02 | **La Portera** | Arquera | 01 | Away Vintage |
| 03 | **Oro Negro** | Estrella | 07 | Premium Nocturna |
| 04 | **La Cafetera** | Goleadora | 09 | Alterna Cafetera |

Pack complet : **El Once Inicial** (clin d'œil aux 11 titulaires), 4 éditions à `$329.000` (économie de `$267.000`).

## Sections
1. Announce bar défilante (Mundial 26, stock, envío)
2. Nav noire avec border rouge
3. Tribune bar (live · countdown Mundial)
4. Hero — titre vibrant + banderoles inclinées
5. Chant marquee jaune
6. Manifesto noir avec barres tricolor top + bottom
7. La Convocatoria — 4 cartes Panini player
8. El Once Inicial — bundle
9. Beneficios — 4 cards style "ticket de stade"
10. Cómo Comprar — 3 pasos sur fond noir
11. Guía de Tallas — calculatrice interactive
12. La Tribuna — reviews marquee
13. FAQ accordéon
14. CTA Final avec glow radial
15. Footer marquee rouge + footer noir
16. Sticky WhatsApp float + Sticky buy bar (mobile)
17. Modal produit + Lightbox galerie

## Interactions JS
- Countdown live → `2026-06-11 16:00 COL` (kickoff Mundial)
- Reveal-on-scroll staggered (IntersectionObserver, opt-out reduced-motion)
- Modal produit slide-up mobile / centered desktop, focus-trap, ESC
- Lightbox galerie 3 vues SVG (clavier ←/→, swipe touch, ESC)
- Guía de tallas — calcul S/M/L à partir de busto/cintura/cadera
- Sticky buy bar mobile qui suit le produit le plus visible
- WA float caché quand un CTA WA inline est visible
- Haptique 8ms sur les boutons (`navigator.vibrate`)

## WhatsApp
Single source of truth : `WHATSAPP_NUMBER = '573000000000'` dans `app.js` (⚠️ placeholder).
Tous les CTAs utilisent `data-wa data-wa-msg="..."` — `app.js` injecte le href au load.
Messages pré-remplis selon le contexte (générique, produit, taille, pack, mayoreo).

## Performance
- Pas de bitmap (tout SVG inline + CSS gradients)
- Fonts via Google preconnect, `display=swap`, 4 familles
- Grain texture en data-URI inline (pas de fetch)
- Zero JS library, ~10KB vanilla
- Mobile-first, breakpoints 640 / 1024 / 1280

## Dev
```bash
# Local dev (any static server)
python3 -m http.server 8765
# Open http://localhost:8765/
```

## Déploiement
Vercel-ready (`vercel.json`). Voir `DEPLOY.md` pour la procédure complète + DNS.

## Status
✅ V5 HINCHADA CHAOS shipped — prêt pour preview Vercel.

## Owner
Lupo Antonucci · Pereira / Armenia, Colombia 🇨🇴
