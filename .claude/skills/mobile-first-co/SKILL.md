---
name: mobile-first-co
description: Mobile-first UX patterns tuned for the Colombian market on TRICOLOR.CO. Use when designing or modifying responsive layouts, touch targets, viewport handling, performance budgets, or anything user-facing on mobile. Reflects local network conditions, device mix, and iOS Safari quirks.
---

# Mobile-First for Colombia — TRICOLOR.CO

The target audience accesses primarily on **Android mid-range** (Samsung A-series, Xiaomi Redmi) and **iPhone SE/12** over **4G**, often outside major cities. Mobile is 80%+ of traffic. Design for that, not for a MacBook.

## Hard rules

### Breakpoints
- **Default**: 375px+ (iPhone SE baseline — never break below)
- **640px**: small tablets / large phones landscape
- **1024px**: desktop
- **1440px**: wide

Always write CSS mobile-first; desktop styles live inside `@media (min-width: …)`.

### Touch targets
- **Minimum 44×44 px** on any interactive element (Apple HIG + WCAG 2.5.5).
- Buttons use `padding`, not fixed `height`, so they grow with font scaling.
- Spacing between adjacent tappables: **≥ 8 px**.

### Viewport
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0A0A0A">
```
- `viewport-fit=cover` + `env(safe-area-inset-*)` for iPhone notch / dynamic island.
- Use `100dvh` (with `100vh` fallback) for full-height layouts — iOS Safari URL bar workaround.

### Safe areas
Apply to fixed bottom elements (sticky WA button, mobile menu):
```css
.wa-float { bottom: calc(1rem + env(safe-area-inset-bottom, 0)); }
```

## Performance budget (4G median)

- **HTML**: < 50 KB gzipped
- **CSS**: < 60 KB gzipped (current ~45 KB raw)
- **JS**: < 20 KB gzipped (current ~10 KB raw, vanilla)
- **Fonts**: 2 families max, subset Latin, `display=swap`
- **Images**: SVG inline preferred (no bitmap on Tricolor — all visuals are CSS+SVG). If bitmaps are added later, use `loading="lazy"`, `decoding="async"`, AVIF/WebP, `srcset`.
- **Zero external JS libraries**. Vanilla only.

## Network resilience
- `preconnect` to fonts.googleapis.com + fonts.gstatic.com (already done).
- All critical CSS inline-able if needed (currently external is fine).
- `font-display: swap` so text renders without waiting for webfonts.

## iOS Safari gotchas
- `-webkit-backdrop-filter` alongside `backdrop-filter` (used in `nav`, `modal-close`).
- `-webkit-tap-highlight-color: transparent` on interactive elements if highlight is distracting.
- `touch-action: manipulation` on buttons to disable double-tap-to-zoom.
- `overflow: hidden` on `<body>` when mobile menu / modal open (already done in `app.js`).
- Modal: slide-up from bottom (bottom sheet pattern) on mobile, centered on desktop (already implemented).

## Android Chrome gotchas
- `100vh` includes URL bar — use `100dvh` or JS `--vh` workaround.
- `theme-color` paints the URL bar — set to `#0A0A0A` for brand consistency.
- Pull-to-refresh: leave default (Colombian users rely on it).

## Haptic feedback
```js
if ('vibrate' in navigator) navigator.vibrate(8);
```
8 ms is barely perceptible but reassuring. Already wired on `.btn`, `.product-cta`, `.size-btn`, `.nav-cta`. Don't overuse — users on older Androids may find 50+ ms annoying.

## Colombian payment / data context
- **No checkout** = no card forms = no 3DS friction. Funnel is WhatsApp + contraentrega.
- Mention these trust markers near every CTA on mobile (visible without scroll): `contraentrega`, `24-72h`, `Nequi`, `Daviplata`.
- Major carriers: **Interrapidísimo** (king for last-mile), **Servientrega**.

## Reduced motion
Always honor `prefers-reduced-motion: reduce`. Already in `styles.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  .reveal { opacity: 1; transform: none; }
}
```
Also disable JS-driven animations (counter, etc.) when this is set — check with `matchMedia('(prefers-reduced-motion: reduce)').matches`.

## What NOT to do on mobile
- ❌ Fixed-height heroes — use `min-height` with `dvh`.
- ❌ Horizontal scroll anywhere except intentional marquees.
- ❌ Hover-only interactions — pair with focus-within / tap.
- ❌ Dropdown menus that need precise hover.
- ❌ Modal dialogs that don't allow tap-outside to close.
- ❌ Auto-playing video with sound (the brand is sensoriel, but not invasive).
- ❌ Geolocation prompts (Permissions-Policy in `vercel.json` already disables them).
- ❌ Banner ads / popups / newsletter modal on first load — kills trust on first visit in this market.
