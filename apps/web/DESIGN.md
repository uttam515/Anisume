# ANISUME DESIGN SYSTEM (DESIGN.md)

> **Single Source of Truth** for the visual identity, UI components, typography, layout rules, and motion language of Anisume.

---

## 1. Visual Philosophy & Identity

**Anime Culture × Japanese Street Aesthetics × Colourful Editorial Design × Layered Motion**

Anisume is an energetic, immersive anime portal that breaks away from generic, dark-purple SaaS monotony. The interface feels alive through saturated Japanese color blocking, atmospheric landscapes (Torii gates, Kyoto streetscapes, cherry blossom twilights), expressive typography with Japanese Kanji/Katakana sub-headers, and asymmetric editorial layouts.

### Core Principles
1. **Colour-Led, Not Dark-Dominant**: Light editorial surfaces (Cream `#FFF5E8`) and bold saturated blocks (Sky Blue `#55BCEB`, Electric Pink `#F16AAB`, Sunset Orange `#FF8A3D`) have equal prominence with cinematic Deep Ink (`#171B1A`).
2. **Asymmetry & Distribution**: Stop centering everything. Use left-aligned hero titles, offset banners, bento-style editorial discovery grids, and full-bleed image spreads.
3. **Integrated Artwork (Not a Showcase Gallery)**: High-resolution anime artwork is integrated directly into hero backdrops, editorial banners, and discovery cards with gradient readability masks.
4. **Selective, Purposeful Motion**: Animation must serve context and tactile feedback (spring bounces, fluid layout shifts, floating sakura petals), not excessive glowing neon borders everywhere.

---

## 2. Color System

### Primary & Accent Palette

| Token Name | Hex Code | Purpose & Application |
|---|---|---|
| `brand-red` | `#E50914` | Core Anisume red; primary CTA buttons, Torii gate vermilion, active indicators |
| `brand-emerald` | `#20B486` | Watched / completed watch status, library success chips, positive signals |
| `brand-sky` | `#55BCEB` | Atmospheric skies, movie tags, seasonal exploration highlights, light hero cards |
| `brand-pink` | `#F16AAB` | Editorial highlights, Japanese street neon, trending stickers, loved hearts |
| `brand-yellow` | `#F4C95D` | Star ratings, community awards, energetic badges, ranking indicators |
| `brand-orange` | `#FF8A3D` | Sunset hour gradients, Japanese sun accents, warm action chips |
| `brand-cream` | `#FFF5E8` | Warm light editorial sections, readable tag surfaces, high-contrast light blocks |
| `brand-ink` | `#171B1A` | Deep cinematic foundation, rich typography, sharp contrasting cards |
| `brand-surface` | `#222725` | Subtle elevated panels, dark action bars, input fields |
| `brand-border` | `#333B38` | Structural card borders and dividers with crisp definition |

---

## 3. Typography & Text Hierarchy

### Typeface Stack
- **Display & Headings**: Heavy bold sans-serif with tracked caps for visual punch, paired with Japanese Katakana/Kanji decorative sub-headers (`新しいアニメの世界へ`, `発見`, `推薦`).
- **Body & Data**: High-legibility sans-serif with fluid scaling (`clamp()`) to ensure readability across mobile and 4K displays.
- **Accents & Badges**: Monospace or condensed uppercase for metadata (`TV • 24 EPS`, `8.8 ★`).

### Scale
- **Display 1 (Hero Title)**: `text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]`
- **Heading 1 (Section Titles)**: `text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight`
- **Heading 2 (Card / Sub-section Titles)**: `text-base sm:text-lg font-bold leading-snug`
- **Body Regular**: `text-sm sm:text-base text-slate-300 leading-relaxed`
- **Metadata & Tags**: `text-[11px] sm:text-xs font-semibold tracking-wide`

---

## 4. Layout & Grid Architecture

### 1. Asymmetrical Hero
- **Left Column (60%)**: Bold typography, Japanese badge accent, editorial description, primary action buttons, quick metadata pills.
- **Right Column (40%)**: Atmospheric Torii gate depth with integrated character artwork and layered sakura canvas, extending toward the screen edge.

### 2. Editorial Bento Discovery Grid
- Breaks monotonous 6-column rows with asymmetrical bento cards:
  - **Hero Feature Tile (2×2 span)**: Large anime artwork with cinematic title overlay.
  - **Character / Quote Tile (1×2 span)**: High-contrast typography and artwork cutout.
  - **Seasonal / Studio Wide Tile (2×1 span)**: Horizontal banners with studio emblems.
  - **Standard Card Tiles (1×1 span)**: Clean anime posters.

### 3. Alternating Theme Blocks
- **Section A (Cinematic Deep Ink)**: Trending and Continue Your Journey.
- **Section B (Warm Cream / Saturated Editorial)**: Genre Discovery, Studio Spotlights, Seasonal Themes.
- **Section C (Sky / Sunset Contrast)**: Top Rated Masterpieces and Surprise Me banners.

---

## 5. Anime Artwork Treatment

### Prioritized Character Roster
- **Monkey D. Luffy** (One Piece) — Adventure, High Energy, Hero companion.
- **Roronoa Zoro** (One Piece) — Action, Swordplay, Epic focus.
- **Vinsmoke Sanji** (One Piece) — Culinary, Style, Seasonal curation.
- **Naruto Uzumaki** (Naruto Shippuden) — Shounen, Perseverance, Discover hub.
- **Ichigo Kurosaki** (Bleach) — Supernatural, Bankai power, Recommendation sets.
- **Light Yagami** (Death Note) — Psychological, Mystery, Thriller spotlight.

### Integration Standards
- Assets are stored locally in `/assets/art/` to prevent external broken links.
- Rendered with gradient masks (`from-black/80 via-transparent to-transparent`) to guarantee legible typography.
- Never displayed as a standalone "look at these characters" gallery; artwork serves as atmospheric environment backdrops and editorial dividers.

---

## 6. Selective Magic UI & Motion Conventions

- **Atmospheric Depth**: Procedural sakura petal canvas in hero sections.
- **Dynamic Marquee**: Infinite smooth scrolling ticker for animation studios (`MAPPA`, `Ufotable`, `Madhouse`, `Bones`, `Wit Studio`).
- **Card Shifts**: Tactile spring transitions (`stiffness: 350, damping: 28`) for card insertions and feedback replacements.
- **Buttons**: Subtle high-energy vermilion shine on primary actions (`ShimmerButton`), avoiding excessive neon outlines.
- **Accessibility**: Automatic detection of `prefers-reduced-motion` with graceful instant-display fallbacks.

---

## 7. Responsive & Accessibility Standards

- **Mobile First**: All touch targets meet minimum 44×44px standards.
- **Fluid Layout**: Grid shifts gracefully from 1-column on mobile, 2-column on small tablets, 3-4 on desktop, to 5-6 on wide screens.
- **Contrast Ratios**: Body text meets WCAG AAA standards (minimum 7:1) against background surfaces.

