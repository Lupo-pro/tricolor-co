---
name: tricolor-brand
description: Enforce TRICOLOR.CO brand bible (colors, typography, tone of voice, do/don't). Use BEFORE editing any HTML, CSS, copy, or visual asset. The full source of truth is BRIEF.md at the project root — this skill is a fast index over it. Trigger when modifying visual design, copywriting, color choices, typography, CTAs, or any user-facing string.
---

# TRICOLOR.CO Brand Bible — Quick Index

> **Sé Fuerte. Sé Fiera. Sé Tricolor.**

**Authoritative source**: always read `BRIEF.md` at the project root for full context. This file is a one-screen quick reference.

## Hard rules — non-negotiable

### Colors (use CSS variables, never hex inline except brand swatches)
| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#FAF7F2` (Crema) | Background — **NEVER pure white `#FFF`** |
| `--bg-warm` | `#F2EDE4` | Secondary cards |
| `--ink` | `#0A0A0A` (Tinta) | Text, dark sections |
| `--ink-soft` | `#2A2A28` | Body text |
| `--muted` | `#8A867E` | Captions only |
| `--yellow` | `#FCD116` (Amarillo) | Accents, celebration |
| `--blue` | `#003893` (Azul) | Trust, depth |
| `--red` | `#CE1126` (Rojo) | CTAs, urgency, italic accents |
| `--gold` | `#C9A961` (Oro) | Premium edition only (5% usage) |
| `--wa` | `#25D366` | WhatsApp CTAs only |

**Usage ratio**: 80% neutrals (crema + tinta), 15% one tricolor per section, 5% gold for premium moments.

### Typography
- **Fraunces** (serif) — titles, manifesto, prices, italics for emotional accents
- **Inter** (sans) — UI, CTAs, body paragraphs
- **Never** all-sans (= generic e-com) or all-serif (= too fashion)

### Tone of voice
- Tutoyer in Spanish colombien: `tú`, `tuyo`, `mía`
- Use cafetero vocabulary: `tribuna`, `hinchada`, `cafetera`, `Tricolor`, `Selección`
- Short, punchy phrases. Poetic where emotional.
- ✅ `Pedir por WhatsApp`, `Asegura el tuyo`, `Únete a la Tribuna`
- ❌ Anglicismes inutiles (`trendy`, `must-have`, `click here`, `buy now`)
- ❌ `Réplica`, `fake`, `copia` → say **`edición inspirada`**
- ❌ `Cheap`, `barato` → say **`precio especial Mundial`**

### Visual NEVER
- 🚫 Pure white `#FFFFFF` — always `--bg`
- 🚫 Purple gradients (AI slop)
- 🚫 Colombian flag fullscreen aplat (kitsch)
- 🚫 adidas / FCF logos visible (legal risk)
- 🚫 Emojis in headlines (only 🇨🇴 in manifesto/footer)
- 🚫 `click here`, `buy now` CTAs

### Visual ALWAYS
- ✅ Grain overlay 3-4% opacity on body
- ✅ Rounded: 12-16px on cards, 999px (pill) on CTAs
- ✅ Diagonal sport-mesh patterns on product cards
- ✅ Radial glow gradients (yellow + red) for CTA emphasis
- ✅ Italic Fraunces on emotional accents
- ✅ 3-stripe flag mark in logo (yellow, blue, red)

## Product catalog reference

| Ref | Name | Edition | Tag | Color class |
|-----|------|---------|-----|-------------|
| 01 | La Capitana | Home | Más Vendido | `.card-yellow` |
| 02 | La Portera | Away vintage | Vintage | `.card-blue` |
| 03 | Oro Negro | Premium | Premium | `.card-black` |
| 04 | La Cafetera | Alterna | Pasión | `.card-red` |
| Pack | El Once Inicial | All 4 | ★ El Once Inicial | dark + tricolor stripe |

**Prices**: 99k COP unit (vs 149k crossed), 329k COP pack (vs 596k, -45%). **Sizes**: S (32-34), M (36-38), L (40-42).

## Taglines
- **Main**: `Sé Tricolor.`
- **Manifesto**: `Sé Fuerte. Sé Fiera. Sé Tricolor.`
- **Hero hook**: `No es un body. Es tu bandera.`
- **Section accent**: `<em>` in red italic Fraunces light

## When in doubt
Read `BRIEF.md` (≈ 400 lines, sections 1–17). The README.md has the public summary; the BRIEF.md has the unabridged law.
