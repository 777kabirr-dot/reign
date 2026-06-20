# ELYPHANT — Premium Mineral Water

A premium, minimalist brand website for **ELYPHANT** mineral water, built around the
product's real design language: pure white, deep navy blue, aluminium and a lot of
breathing room.

> *Naturally Pure · Rich in Minerals · Balanced pH · Nothing added, nothing removed.*

## Highlights

- **Interactive 3D can** — a procedural aluminium can rendered with [three.js](https://threejs.org).
  The ELYPHANT label is painted onto a canvas texture at runtime, lit with key/rim/fill lights
  and real reflections. Auto-rotates, and you can **drag to spin it**. Falls back to an elegant
  CSS can if WebGL is unavailable.
- **Glassmorphism** — frosted glass panels for pillars, the mineral table, gallery and CTA.
- **Background animation** — drifting gradient orbs + a rising-bubbles canvas, with a film-grain overlay.
- **Animated mineral table** — counters and bars animate to the real values printed on the can.
- **Scroll reveals, tilt cards, marquee, parallax** and an active-section nav.
- **Premium typography** — Cormorant Garamond (display serif), Oswald (condensed display),
  Manrope (body).
- Fully **responsive**, accessible, and **`prefers-reduced-motion`** aware.

## Design tokens

| Token | Value | Use |
|-------|-------|-----|
| `--navy` | `#1b2c5b` | Wordmark / primary text |
| `--navy-soft` | `#45598f` | Secondary text |
| `--paper` | `#f6f4ef` | Warm off-white background |
| `--white` | `#ffffff` | Surfaces |
| `--silver` | `#c9ccd3` | Aluminium accents |

## Structure

```
index.html              Markup + content (real values from the can)
assets/css/main.css     Design system, glassmorphism, animations, responsive
assets/js/can3d.js      three.js 3D can + canvas label + interaction
assets/js/app.js        Reveals, counters, nav, tilt, bubbles, form
```

## Run it

No build step. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

three.js is loaded from a CDN, so an internet connection is needed for the 3D can
(the CSS fallback works offline).

## Brand

- Instagram — [@elyphant.co](https://instagram.com/elyphant.co)
- Elyphant Beverages Pvt. Ltd., Wai Region, Satara — Maharashtra, India · Made in India.
