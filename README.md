# Azimuth Energy Solutions — Marketing Site

Single-page marketing website for **Azimuth Energy Solutions Pvt Ltd**, an independent
deepwater / shallow-water / onshore well engineering and drilling project management
consultancy (Pune HQ · Perth · Houston opening).

> *Drilling in the right direction.*

## Design system — "Depth & Precision"

Dark-mode-first industrial design language derived from drilling trajectory schematics,
subsurface cross-sections and offshore engineering drawings — built for an audience of
operators (ExxonMobil, NOCs) evaluating technical credibility.

| Token | Value | Use |
|-------|-------|-----|
| `--ink` | `#0B0E11` | Base — deep water, night rig operations |
| `--steel` / `--steel-hi` | `#3E7CB1` / `#6DA5D5` | Azimuth blue — trajectory lines, accents |
| `--amber` | `#C97B3D` | Drill-bit amber — CTAs, data highlights |
| `--grey-hi` | `#C4CBD4` | Body text (WCAG AA on dark) |

**Typography:** Archivo (engineered grotesk headlines) · Inter (body) ·
IBM Plex Mono (data labels, coordinates, regulatory codes).

## Highlights

- **Hero** — animated well-trajectory line art (vertical → KOP → 90° lateral, with
  sidetracks), depth rail, mono data cells.
- **Trust bar** — API / OGUK / NORSOK D-10 / NOPSEMA / DGH / ONHYM styled as
  certification stamps; 100+ years stat counter; world-graticule map with
  Pune / Perth / Houston pins at true coordinates.
- **Our Forte** — Onshore / Shallow Water / Deepwater as a literal depth cross-section
  with a surface-to-reservoir ruler and line-art rig illustrations (derrick, jack-up,
  drillship + riser).
- **Capabilities** — accessible accordion (Well Engineering / Project Management /
  Liaisoning & BD) with the full technical line-item lists; Reservoir & Borehole
  Characterization as a mono chip grid.
- **Track record** — project-log index treatment; ExxonMobil Bass Strait and PNG
  P&A scopes featured.
- Scroll reveals, stat counters and SVG draw-ins are subtle and fully
  **`prefers-reduced-motion`** aware. WCAG AA contrast throughout.

## Structure

```
index.html    Self-contained single file — markup, design system CSS, and JS
              (reveals, accordion, counters, trajectory draw-in, mailto form)
```

No build step. All content is real company copy — no fabricated stats, logos or
testimonials.
