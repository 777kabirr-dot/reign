# Azimuth Energy Solutions — Marketing Site

Single-page marketing website for **Azimuth Energy Solutions Pvt Ltd**, an independent
international well engineering and drilling project management consultancy
(Pune HQ · Perth · Houston opening).

> *Drilling in the right direction.*

## Design system — "Network & Void"

A near-black, premium-tech visual language. The signature element is an animated
**node-and-line network** where every node maps to something real about the business —
office locations (Pune / Perth / Houston), well-trajectory stages, project types — with
light pulses travelling the edges like live data. Restraint is the brand: a single
controlled glow, deep petrol-teal atmospheric accents used sparingly, geometric sans
throughout, no serif.

| Token | Value | Use |
|-------|-------|-----|
| `--void` | `#0A0A0B` | Primary background |
| `--void-soft` / `--graphite` | `#121316` / `#1C1E22` | Cards, nav capsule |
| `--node` | `#E8E8E6` | Node dots, pulses, primary CTA |
| `--text` / `--text-2` | `#F2F1ED` / `#8B8D91` | Headlines / body |
| `--depth` | `#2A4A47` | Deep petrol-teal accents (<5% of frame) |

**Typography:** Inter Tight (display + body, 400–600) · IBM Plex Mono (data labels,
coordinates, node IDs).

## Highlights

- **Hero** — a real 3D node constellation (three.js): office nodes carry live HTML
  labels, neighbours are linked by thin lines, and light pulses travel the edges.
  Two-tone headline, a floating "live data" glass card cycling Deepwater / Shallow Water
  / Onshore with a green live pulse and a sweeping progress bar.
- **Trust strip** — API · OGUK · NORSOK D-10 · NOPSEMA · DGH India · ONHYM rendered as a
  monochrome regulatory wordmark row (SaaS logo-bar pattern, brightening on hover) +
  the 100+ years stat.
- **Our Forte** — three glass cards (Deepwater / Shallow Water / Onshore) joined by an
  animated connector line with a travelling pulse — one continuous seabed-to-surface chain.
- **Capabilities** — a sequential node chain: each discipline is a connected node with a
  glowing connector dot, its full scope shown as mono tag pills; Reservoir & Borehole
  Characterization nests as a dashed supporting node.
- **Projects** — the largest type moment on the page: "Trusted on *ExxonMobil* wells",
  with the Bass Strait & Papua New Guinea P&A scopes featured and the full project log.
- **Top-tier layer** — branded "calibrating bearing" preloader with masked word-by-word
  headline reveal, cursor light that faintly illuminates the void, magnetic pill buttons,
  a live ops ticker of real services, live office clocks (Pune / Perth / Houston via
  `Intl.DateTimeFormat`), section indexing (01–06) with drawn rules, scroll-progress
  hairline, and a giant outlined AZIMUTH footer wordmark.
- Scroll reveals (blur-up), nav frost, stat counters, glass-card tilt and the network are
  all subtle and **`prefers-reduced-motion`** aware; the network degrades gracefully if
  WebGL is unavailable.

## Structure

```
index.html              Markup + content (real company data)
assets/css/main.css     "Network & Void" design system
assets/js/scene3d.js    three.js 3D node-and-line network (hero)
assets/js/app.js        Reveals, nav frost, data-card rotation, counters, tilt, mailto
assets/js/vendor/       three.js (vendored, no CDN)
```

No build step. All content is real company copy — no fabricated stats, logos or
testimonials.
