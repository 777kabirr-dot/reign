---
name: ui-ux-pro-max
description: UI/UX design intelligence. 67 styles, 161 palettes, 57 font pairings, 25 charts, 16 stacks. Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design.
---

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide. Searchable database with priority-based recommendations.

## How to Use

Run design intelligence from `.claude/skills/ui-ux-pro-max/scripts/`:

```bash
# Full design system for a project
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "product keywords" --design-system -p "Project Name"

# Search specific domain
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "query" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "query" --domain color
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "query" --domain typography
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "query" --domain ux

# Stack-specific best practices
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "query" --stack html-tailwind
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "query" --stack threejs
```

## ELYPHANT Design System (Generated)

### Style: Liquid Glass
- Flowing glass, morphing, smooth transitions, fluid effects, translucent, animated blur, iridescent
- Best for premium branding, luxury portfolios, high-end experiences
- Animations: 400–600ms curves (not fast)

### Typography
- **Heading:** Bodoni Moda (luxury, high-end serif)
- **Body:** Jost (clean, geometric, modern)

### Colors
| Role | Hex |
|------|-----|
| Primary | `#1C1917` |
| Secondary | `#44403C` |
| Accent/CTA | `#A16207` (gold) |
| Background | `#FAFAF9` |
| Border | `#D6D3D1` |

### Pre-Delivery Checklist
- [ ] No emojis as icons (SVG only)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states 150-300ms transitions
- [ ] Text contrast 4.5:1 minimum
- [ ] Focus states visible
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375 / 768 / 1024 / 1440px
