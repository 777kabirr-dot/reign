# ELYPHANT — Premium Mineral Water

A premium, single-page brand site for **ELYPHANT** — a luxury bottled mineral
water. Dark-luxury glassmorphism: restrained, slow, heritage. Built to feel like
Aesop × Glenfiddich × Apple, never like a template.

> *Naturally Pure · Rich in Minerals · Balanced pH · Nothing added, nothing removed.*

## Locked palette (navy / cream / gold only)

| Token | Value | Use |
|-------|-------|-----|
| `--navy` | `#1B2A4A` | Hero, nav, dominant panels — stands in for "dark" |
| `--cream` | `#F4F1EA` | Alternating sections, body text on navy — stands in for "light" |
| `--gold` | `#9C7A3C` | CTAs, hairline borders, icon strokes, hover — used sparingly |

No black, no white, no grey, no secondary accent. Shadows are navy-tinted, never black.

## Glassmorphism signature

- On navy → `backdrop-filter: blur(20px)`, `background: rgba(244,241,234,0.06)` (`.glass-d`)
- On cream → `backdrop-filter: blur(20px)`, `background: rgba(27,42,74,0.05)` (`.glass-l`)
- 1px gold hairline border at `rgba(156,122,60,0.25)` defines every glass edge
- Drop shadows sit *underneath* the glass; bottle shots sit *inside* glass plinths with light bleeding through

## Sections

1. **Hero** — full-bleed navy, vertical bottle placeholder on a glass plinth, slow light-dust particle field, typed/faded headline, pinned glass nav that grows opaque on scroll.
2. **The Bottle** — scroll-linked zoom + gentle rotate; hover callouts open glass tooltips (cap material, label embossing, vessel weight).
3. **Origin / Story** — two-column, ambient media placeholder, line-by-line stagger reveals.
4. **Craft / Process** — stacked glass cards (sourcing, bottling, QC) that lift with a shadow bloom on hover.
5. **Range / Variants** — glass cards for Still / Sparkling / Trace; bottle floats up on hover.
6. **Where to Find** — single gold CTA + glass waitlist card.
7. **Footer** — logo mark, line-style social icons, legal line, same blurred glass treatment as nav.

## Animation principles

- Everything slow: 600–900ms, `cubic-bezier(0.16, 1, 0.3, 1)`. No bounce, no spring.
- Page load: logo mark animates in alone (~1.5s), *then* content reveals.
- Scroll-triggered fade + slight upward translate via `IntersectionObserver`, staggered for groups.
- Cursor-reactive gold radial glow over dark sections.
- Fully `prefers-reduced-motion` aware.

## Asset placeholders (to be supplied)

Logo and product photography are supplied separately. Clearly marked, correctly
sized placeholder zones are in place:

- **Vertical bottle hero shot** — min 2000px tall, transparent PNG (hero + The Bottle).
- **Variant bottle shots** — Still / Sparkling / Trace.
- **Ambient origin media** — looping film or 4:5 still.

Replace the `.placeholder` blocks in `index.html` with the supplied assets.

## Typography

- **Display:** Cormorant Garamond (high-contrast serif) — large, tracked-out, slow.
- **Body / labels:** Jost (clean geometric grotesque) at light weight, all-caps tracking on labels.

## Structure

```
index.html              Markup + content + marked placeholder zones
assets/css/main.css     Design system, glass, animations, responsive
assets/js/app.js        Preloader, reveals, nav, scroll-linked bottle, dust field, cursor glow, form
```

## Run it

No build step. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

Tailwind / React / Framer Motion are the brief's recommended stack; this build
delivers the same behaviour as a dependency-free static site so it deploys
straight to GitHub Pages.

## Brand

- Instagram — [@elyphant.co](https://instagram.com/elyphant.co)
- Elyphant Beverages Pvt. Ltd., Wai Region, Satara — Maharashtra, India · Made in India.
