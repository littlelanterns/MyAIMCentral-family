> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-03: Design System & Themes

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup — shell definitions, member roles, family structure), PRD-02 (Permissions & Access Control — PermissionGate, role badges, shift banners, transparency panel)
**Created:** March 2, 2026
**Last Updated:** March 2, 2026

---

## Overview

> **Depends on:** PRD-01 (Auth & Family Setup) — shell definitions, member roles, family structure. Defined in PRD-01, Screens and Data Schema sections.
> **Depends on:** PRD-02 (Permissions & Access Control) — PermissionGate component, role badges, shift banners, transparency panel. Defined in PRD-02, Visibility & Permissions section.

This PRD defines the complete visual identity system for MyAIM Family v2. It covers how every pixel looks and feels — from the CSS variable architecture that makes theming possible, to the shared component library that every feature imports, to the vibes system that lets users change the entire aesthetic personality of their experience.

> **Mom experience goal:** The app should feel like opening a beautifully designed journal — warm, intentional, and personal. Not a corporate dashboard. Not a generic app. A space that feels like it was made for her, with care.

The visual identity lands between StewardShip's refined structure and MyAIM v1's warm approachability. StewardShip was polished but austere; MyAIM v1 was warm but loose. v2 aims for warm, beautiful, and polished — a space that feels like opening a beautifully designed journal, not a corporate dashboard. Every element uses CSS variables exclusively. Every scrollbar, focus ring, and selection highlight is themed. Every theme works in light and dark mode. Every shell (Mom, Adult, Independent, Guided, Play) has its own visual token overrides that adjust typography, animation, spacing, and color intensity to match the needs of that experience.

The design system serves a family with members ranging from a 2-year-old to adults, so it must simultaneously feel sophisticated enough for mom's personal growth space and delightful enough for a child tapping through their task list with sticker rewards.

---

## User Stories

### Theme & Personalization
- As a mom, I want to choose a color theme that feels like "me" so my personal space feels peaceful and intentional.
- As a mom, I want to toggle gradients on or off because sometimes I want a cleaner look.
- As a mom, I want to assign each child a unique color from the approved palette so I can quickly identify who's who on family dashboards, calendars, and charts.
- As a teen, I want to pick my own theme from the full catalog so my dashboard feels like my space.
- As any user, I want the app to respect my phone's dark mode setting so it's comfortable at night.
- As any user, I want to override the dark mode setting in my preferences if I always want light or dark.

### Vibes
- As a mom, I want to choose a visual "vibe" (Classic, Clean, Nautical, Cozy Journal) that changes the overall personality of the app without affecting my color choices.
- As a user, I want vibes and themes to be independent so I can mix and match freely.

### Consistency & Quality
- As a developer, I want every component to use CSS variables so themes apply automatically everywhere — including scrollbars, tooltips, and modals.
- As a user, I want the app to look polished and intentional on every screen, in every theme, in light and dark mode.

### Shell-Specific
- As a young child in Play mode, I want big buttons, bright colors, and fun animations so the app feels exciting and easy to use.
- As a parent of a child with special needs, I want the Guided/Play interface to support visual chart and routine display patterns so my child can follow along independently.

### Accessibility
- As a user with visual needs, I want to increase the font size so everything is comfortable to read.
- As any user, I want sufficient color contrast in every theme so text is always readable.

---

## Design System Architecture

### Three-Layer Color System

**Layer 1: Primary Brand Colors (8 colors)**
The brandboard palette. Used for branding, marketing, defaults, and the Classic MyAIM theme. These exist as a separate tier above the extended palette.

| Name | Hex | Usage |
|------|-----|-------|
| Warm Cream | #fff4ec | Default background, base canvas |
| Warm Earth | #5a4033 | Default text, grounding dark |
| Sage Teal | #68a395 | Primary brand, interactive elements |
| Soft Sage | #d4e3d9 | Secondary backgrounds, subtle accents |
| Golden Honey | #d6a461 | CTAs, warm accents |
| Dusty Rose | #d69a84 | Tertiary accent, gentle warmth |
| Soft Gold | #f4dcb7 | Warm backgrounds, card tints |
| Deep Ocean | #2c5d60 | Deep accents, navigation backgrounds |

**Layer 2: Extended Palette (11 families, 44 colors)**
The complete approved color set. Every color in the system — themes, member colors, status indicators — must come from this palette. No off-palette colors are permitted.

| Family | Light | Medium | Dark | Deepest |
|--------|-------|--------|------|---------|
| Red | Light Blush #f8d6d0 | Coral Pink #f3a6a0 | Rustic Rose #b25a58 | Deep Brick #8e3e3c |
| Orange | Soft Apricot #fde3c7 | Peach Nectar #f9c396 | Burnt Sienna #b86432 | Chestnut Clay #8a4a25 |
| Gold | Champagne Linen #fdf4db | Honey Butter #f3d188 | Golden Wheat #d4b063 | Burnished Bronze #8c6b3f |
| Yellow | Buttercream #fff6d5 | Sunbeam Gold #fae49b | Mustard Grove #b99c34 | Ochre Earth #8a7220 |
| Sage | Silver Sage #d8e3da | Misty Eucalyptus #aebfb4 | Dusty Sage #889a8d | Weathered Pine #5e7164 |
| Green | Misty Mint #dcefe3 | Herb Garden #b2d3c0 | Forest Sage #4b7c66 | Pine Shadow #355f50 |
| Teal | Seafoam #d7eae2 | Cool Sage #a8cfc8 | AIMfM Sage Teal #68a395 | Deep Ocean #2c5d60 |
| Blue | Storm Cloud #c8d1d6 | Coastal Blue #7d98a5 | Evening Indigo #4a5f6a | Inkwell #2f3e48 |
| Purple | Lilac Whisper #e9daec | Mauve Fog #d2b9d7 | Vintage Plum #805a82 | Eggplant Night #5d3e60 |
| Brown | Pale Mocha #e5d5ca | Cinnamon Milk #c8ad9d | Coffee Bean #6f4f3a | Dark Walnut #4e3426 |
| Pink | Petal Blush #fce8e3 | Rose Dust #f5c1ba | Muted Berry #b4716d | Mulberry Clay #8e4e4a |

**Layer 3: Semantic Tokens**
CSS custom properties that map palette colors to UI purposes. Themes override these mappings. Components only reference semantic tokens, never raw palette values.

```
/* Background tokens */
--color-bg-primary          /* Main page background */
--color-bg-secondary         /* Card backgrounds, sections */
--color-bg-card              /* Elevated card surfaces */
--color-bg-nav               /* Navigation backgrounds */
--color-bg-input             /* Form input backgrounds */
--color-bg-input-focus       /* Input background on focus */
--color-bg-overlay           /* Modal/drawer overlays */

/* Text tokens */
--color-text-primary         /* Body text */
--color-text-secondary       /* Muted/helper text */
--color-text-heading         /* Headings */
--color-text-on-dark         /* Text on dark backgrounds */
--color-text-link            /* Links */
--color-text-disabled        /* Disabled state text */

/* Interactive tokens */
--color-btn-primary-bg       /* Primary button background */
--color-btn-primary-text     /* Primary button text */
--color-btn-primary-hover    /* Primary button hover */
--color-btn-secondary-bg     /* Secondary button background */
--color-btn-secondary-text   /* Secondary button text */
--color-btn-secondary-border /* Secondary button border */
--color-btn-secondary-hover  /* Secondary button hover */

/* Border & focus tokens */
--color-border               /* Default borders */
--color-border-focus         /* Focused input borders */
--color-border-error         /* Error state borders */
--color-focus-ring           /* Focus ring glow */
--color-error-ring           /* Error ring glow */

/* Status tokens (universal across all themes) */
--color-success              /* Success states */
--color-warning              /* Warning states */
--color-error                /* Error states */
--color-info                 /* Informational states */
--color-accent               /* General accent */

/* Celebration tokens */
--color-victory              /* Gold celebration effects */

/* Gradient tokens */
--gradient-primary           /* Primary gradient (buttons, nav accents) */
--gradient-background        /* Page background gradient (when gradient toggle ON) */
--gradient-card              /* Card accent gradient */
```

### Status Colors (Universal)
These remain consistent across all themes for accessibility and recognition:

| Status | Color Source | Usage |
|--------|------------|-------|
| Success | Forest Sage #4b7c66 | Completed, saved, confirmed |
| Warning | Mustard Grove #b99c34 | Caution, approaching limits |
| Error | Rustic Rose #b25a58 | Errors, failures, destructive actions |
| Info | AIMfM Sage Teal #68a395 | Informational, neutral alerts |
| Pending | Peach Nectar #f9c396 | In progress, awaiting action |

### Gold Celebratory Effects Rule
Gold as a *color* (Golden Honey, Honey Butter, Golden Wheat, Burnished Bronze, Champagne Linen) is unrestricted — it can appear in themes, member assignments, backgrounds, accents, anywhere color is used. Gold celebratory *effects* — confetti animations, fireworks, sparkles, shimmer overlays — are reserved exclusively for victory celebrations and achievement moments. This rule applies across all themes, all shells.

> **Decision rationale:** Gold effects reserved for victories to preserve their emotional impact. If gold sparkles appear on routine interactions, they lose their magic. Gold as a palette color is unrestricted because restricting it would eliminate beautiful theme options unnecessarily.

---

## Typography System

### Font Stack

| Role | Classic MyAIM Vibe | Clean & Modern | Nautical | Cozy Journal |
|------|-------------------|----------------|----------|--------------|
| Headings | The Seasons (serif) | HK Grotesk (sans) | Georgia (serif) | Handwriting-style* |
| Body | HK Grotesk (sans) | HK Grotesk (sans) | Arial/system sans | HK Grotesk (sans) |

*Cozy Journal heading font TBD during build — candidates include a warm script or handwritten-style font from the approved web font list.

### CSS Custom Properties

```
--font-heading              /* Current vibe's heading font */
--font-body                 /* Current vibe's body font */

--font-size-xs: 0.75rem     /* 12px — captions, fine print */
--font-size-sm: 0.875rem    /* 14px — secondary text, labels */
--font-size-base: 1rem      /* 16px — body text */
--font-size-md: 1.125rem    /* 18px — emphasized body */
--font-size-lg: 1.25rem     /* 20px — small headings, h4 */
--font-size-xl: 1.5rem      /* 24px — h3 */
--font-size-2xl: 1.875rem   /* 30px — h2 */
--font-size-3xl: 2.25rem    /* 36px — h1 */

--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-bold: 700

--line-height-tight: 1.25   /* Headings */
--line-height-normal: 1.5   /* Body text */
--line-height-relaxed: 1.75 /* Reading-heavy content, journaling */
```

### Font Scale Accessibility
Users can increase the base font size via Settings. This scales all rem-based sizes proportionally.

```
html                        /* 16px default */
html.font-scale-large       /* 18px base */
html.font-scale-extra-large /* 20px base */
```

---

## Spacing & Layout Tokens

```
--spacing-xs: 0.25rem       /* 4px */
--spacing-sm: 0.5rem        /* 8px */
--spacing-md: 1rem          /* 16px */
--spacing-lg: 1.5rem        /* 24px */
--spacing-xl: 2rem          /* 32px */
--spacing-2xl: 3rem         /* 48px */
--spacing-3xl: 4rem         /* 64px */

--radius-sm: 4px            /* Subtle rounding */
--radius-md: 8px            /* Cards, inputs */
--radius-lg: 12px           /* Prominent cards */
--radius-xl: 16px           /* Modal corners, large cards */
--radius-full: 9999px       /* Pills, avatars */

--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06)
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12)

--transition-fast: 150ms ease
--transition-normal: 250ms ease

--touch-target-min: 44px
--content-max-width: 600px
--nav-height: 56px
--sidebar-width: 240px
```

---

## Vibes System

Vibes control the structural aesthetic personality of the app — fonts, border-radius style, shadow warmth, spacing density, textures, and decorative elements. Vibes are independent from color themes, gradient toggle, and name packs. Any combination is valid.

### Vibe 1: Classic MyAIM (Default)
- **Headings:** The Seasons (elegant serif)
- **Body:** HK Grotesk (clean sans-serif)
- **Border-radius:** Soft, generous (12-16px on cards, 8px on inputs)
- **Shadows:** Warm-tinted, soft spread
- **Spacing:** Comfortable, breathing room
- **Personality:** Warm, inviting, designed-for-moms. Like opening a beautifully designed journal.
- **Decorative elements:** Optional scrapbook touches (paper clips, washi tape, thumbtacks from decoration library) — subtle, never cluttered.

### Vibe 2: Clean & Modern
- **Headings:** HK Grotesk (all sans-serif)
- **Body:** HK Grotesk
- **Border-radius:** Tighter (6-8px on cards, 4px on inputs)
- **Shadows:** Neutral, crisp
- **Spacing:** Tighter, more information density
- **Personality:** Professional, efficient. For moms who prefer clean lines over warmth.
- **Decorative elements:** None.

### Vibe 3: Nautical
- **Headings:** Georgia (literary serif)
- **Body:** Arial/system sans-serif
- **Border-radius:** Medium (8-12px)
- **Shadows:** Slightly deeper, structured
- **Spacing:** Moderate
- **Personality:** StewardShip-inspired. Captain's quarters aesthetic — warm wood tones, brass accents. Contemplative, purposeful. Nautical without being cartoonish.
- **Decorative elements:** Subtle nautical textures (rope borders, wave patterns) — optional, never kitschy.

### Vibe 4: Cozy Journal
- **Headings:** Handwriting-style font (TBD)
- **Body:** HK Grotesk
- **Border-radius:** Extra soft (16-20px on cards)
- **Shadows:** Warm, diffused
- **Spacing:** Generous, journal-like breathing room
- **Personality:** Scrapbook meets bullet journal. Paper textures, sticker-like tags, the warmest possible feel.
- **Decorative elements:** Paper textures, torn edges, polaroid frames, star clusters from decoration library — can be prominent.

### Vibe CSS Variables

```
--vibe-radius-card           /* Card corner radius */
--vibe-radius-input          /* Input/button corner radius */
--vibe-radius-modal          /* Modal corner radius */
--vibe-shadow-color          /* Shadow tint (warm vs neutral) */
--vibe-shadow-spread         /* Shadow diffusion */
--vibe-spacing-density       /* Multiplier for default spacing */
--vibe-texture-enabled       /* Whether background textures are active */
--vibe-decoration-level      /* none | subtle | prominent */
```

### Vibe + Theme + Gradient + Name Pack Independence
All four systems are fully independent. A user can have:
- Classic MyAIM vibe + Rose Gold theme + gradients ON + Nautical name pack
- Nautical vibe + Classic MyAIM theme + gradients OFF + default names
- Any other combination. The system must support all permutations.

> **Decision rationale:** Independence between vibes, themes, gradients, and name packs maximizes personalization options without exponential design work. Each axis is orthogonal — they compose cleanly.

---

## Gradient System

Gradients are a loved feature from MyAIM v1 and central to the visual identity. The gradient toggle is a per-user setting (on/off) that controls whether gradients appear in backgrounds, buttons, and accent areas.

### Gradient Types
Each theme defines three gradient types, generated from its color palette:

**`--gradient-primary`** — Primary interactive gradient. Used on primary buttons, nav accents, and prominent UI elements.
- Formula: `linear-gradient(135deg, [theme.primary] 0%, [theme.secondary] 100%)`
- Example (Classic MyAIM): `linear-gradient(135deg, #68a395 0%, #d6a461 100%)`

**`--gradient-background`** — Subtle page background wash. Adds warmth and depth to the canvas without competing with content.
- Formula: `linear-gradient(135deg, [theme.background] 0%, [theme.accent + 20% opacity] 100%)`
- Example (Classic MyAIM): `linear-gradient(135deg, #fff4ec 0%, rgba(214,154,132,0.2) 100%)`

**`--gradient-card`** — Card and section accent gradient. Subtle tint applied to card backgrounds or section dividers for visual depth.
- Formula: `linear-gradient(135deg, [theme.bg-secondary] 0%, [theme.accent + 10% opacity] 100%)`
- Example (Classic MyAIM): `linear-gradient(135deg, #d4e3d9 0%, rgba(214,154,132,0.1) 100%)`

### Gradient Generation Utility
```
createGradient(color1, color2, angle = 135) → 
  linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)
```

Each theme's `createThemeVariables()` function generates all three gradients from the theme's primary, secondary, accent, and background colors. The angle (135deg) is consistent across all themes for visual harmony.

### Gradient Toggle Behavior
The gradient toggle is per-member (`theme_preferences.gradient_enabled`, default: `true`).

**When ON (default):**
- Primary buttons: `background: var(--gradient-primary)` with hover lift effect (translateY -2px + increased shadow)
- Page backgrounds: `background: var(--gradient-background)` — subtle wash visible behind content
- Card accents: optional `background: var(--gradient-card)` on elevated cards
- Scrollbar thumbs: `background: var(--gradient-primary)` 
- Login/welcome screens: gradient background for premium feel

**When OFF:**
- Primary buttons: `background: var(--color-btn-primary-bg)` (solid primary color), hover darkens
- Page backgrounds: `background: var(--color-bg-primary)` (solid)
- Card accents: `background: var(--color-bg-card)` (solid)
- Scrollbar thumbs: `background: var(--color-btn-primary-bg)` (solid)
- Login/welcome screens: solid background

**CSS Class Approach:**
- `<html class="gradient-on">` or `<html class="gradient-off">`
- Components use conditional selectors: `.gradient-on .btn-primary { background: var(--gradient-primary); }`
- Or components check via a CSS custom property: `--gradient-enabled: 1` (on) or `--gradient-enabled: 0` (off)

### Gradient in Dark Mode
When dark mode is active, gradient endpoint colors shift to dark-appropriate tones following the same transformation rules as the rest of the theme. The gradient structure (angle, spread) stays the same. If a gradient produces insufficient contrast against dark backgrounds, the system falls back to the solid dark-mode button color.

---

## Theme Catalog

### Theme Structure
Every theme is a CSS file that overrides the semantic token layer. Each theme provides:
- All semantic color tokens (backgrounds, text, buttons, borders, status)
- Gradient source colors (primary, secondary, and accent for gradient generation)
- A `preview` array of 3 colors for the theme picker swatch
- A `category` for organizing in the picker (see Mood-Based Organization below)
- Optional `seasonal` or `holiday` flag

### Theme Contract
Every theme file MUST define all semantic tokens listed in the Three-Layer Color System above. Themes that skip tokens will inherit from the default Classic MyAIM theme as fallback. All colors MUST come from the approved 44-color extended palette plus the 8 brand colors.

### Mood-Based Organization
Themes are organized by the feeling they evoke, not by demographic. Anyone can choose any theme from any category. No theme is labeled as being "for" a particular age, gender, or role.

> **Decision rationale:** Demographic labels (feminine, masculine, teen, kid) make people feel they're picking from the "wrong" section. Mood-based categories (Warm & Cozy, Bold & Rich, etc.) let anyone choose what resonates without judgment.

**Categories:**

- **Warm & Cozy** — Themes that feel like a hug, a latte, a cozy blanket. Warm-toned, inviting, grounded.
- **Cool & Calm** — Themes that feel like a deep breath, ocean air, quiet mornings. Cool-toned, serene, refreshing.
- **Bold & Rich** — Themes with depth and confidence. Deep primaries, dramatic contrast, sophisticated.
- **Soft & Light** — Airy, gentle, pastel-leaning. Peaceful and bright without being intense.
- **Bright & Fun** — High-readability, energetic palettes with lighter backgrounds and saturated accents. Designed for clarity and delight. *(These are optimized for Guided/Play shells but available to anyone.)*
- **Seasonal** — Themes tied to time of year or holiday celebrations.

### Launch Catalog (~38 themes)

**Warm & Cozy**

| Theme | Primary | Secondary | Accent | Background |
|-------|---------|-----------|--------|------------|
| Classic MyAIM *(default)* | Sage Teal #68a395 | Golden Honey #d6a461 | Dusty Rose #d69a84 | Warm Cream #fff4ec |
| Rose Gold | Muted Berry #b4716d | Rose Dust #f5c1ba | Golden Wheat #d4b063 | Petal Blush #fce8e3 |
| Honey & Linen | Burnished Bronze #8c6b3f | Honey Butter #f3d188 | Dusty Rose #d69a84 | Champagne Linen #fdf4db |
| Warm Sunset | Burnt Sienna #b86432 | Sunbeam Gold #fae49b | Coral Pink #f3a6a0 | Soft Apricot #fde3c7 |
| Dusty Blush | Mulberry Clay #8e4e4a | Rose Dust #f5c1ba | Honey Butter #f3d188 | Petal Blush #fce8e3 |
| Earthy Comfort | Coffee Bean #6f4f3a | Cinnamon Milk #c8ad9d | Peach Nectar #f9c396 | Pale Mocha #e5d5ca |
| Champagne | Golden Wheat #d4b063 | Champagne Linen #fdf4db | Rose Dust #f5c1ba | Buttercream #fff6d5 |
| Hearthstone | Weathered Pine #5e7164 | Misty Eucalyptus #aebfb4 | Coffee Bean #6f4f3a | Silver Sage #d8e3da |
| Timber & Iron | Dark Walnut #4e3426 | Coffee Bean #6f4f3a | Burnt Sienna #b86432 | Pale Mocha #e5d5ca |
| Golden Hour | Chestnut Clay #8a4a25 | Honey Butter #f3d188 | Dusty Rose #d69a84 | Champagne Linen #fdf4db |

**Cool & Calm**

| Theme | Primary | Secondary | Accent | Background |
|-------|---------|-----------|--------|------------|
| Ocean Breeze | AIMfM Sage Teal #68a395 | Cool Sage #a8cfc8 | Herb Garden #b2d3c0 | Seafoam #d7eae2 |
| Forest Calm | Forest Sage #4b7c66 | Herb Garden #b2d3c0 | Cinnamon Milk #c8ad9d | Misty Mint #dcefe3 |
| Sage & Cream | Dusty Sage #889a8d | Silver Sage #d8e3da | Golden Wheat #d4b063 | Warm Cream #fff4ec |
| Pine & Stone | Pine Shadow #355f50 | Misty Eucalyptus #aebfb4 | Weathered Pine #5e7164 | Silver Sage #d8e3da |
| Coastal Slate | Evening Indigo #4a5f6a | Coastal Blue #7d98a5 | Dusty Sage #889a8d | Storm Cloud #c8d1d6 |
| Teal Storm | Deep Ocean #2c5d60 | Cool Sage #a8cfc8 | Sunbeam Gold #fae49b | Seafoam #d7eae2 |
| Lavender Dreams | Vintage Plum #805a82 | Mauve Fog #d2b9d7 | Muted Berry #b4716d | Lilac Whisper #e9daec |

**Bold & Rich**

| Theme | Primary | Secondary | Accent | Background |
|-------|---------|-----------|--------|------------|
| Captain's Quarters | Deep Ocean #2c5d60 | AIMfM Sage Teal #68a395 | Burnished Bronze #8c6b3f | Seafoam #d7eae2 |
| Inkwell & Bronze | Inkwell #2f3e48 | Coastal Blue #7d98a5 | Burnished Bronze #8c6b3f | Storm Cloud #c8d1d6 |
| Evening Indigo | Evening Indigo #4a5f6a | Storm Cloud #c8d1d6 | Golden Wheat #d4b063 | Storm Cloud #c8d1d6 |
| Plum Electric | Eggplant Night #5d3e60 | Mauve Fog #d2b9d7 | Coral Pink #f3a6a0 | Lilac Whisper #e9daec |
| Midnight Berry | Eggplant Night #5d3e60 | Muted Berry #b4716d | Mauve Fog #d2b9d7 | Lilac Whisper #e9daec |
| Sunset Blaze | Deep Brick #8e3e3c | Coral Pink #f3a6a0 | Sunbeam Gold #fae49b | Light Blush #f8d6d0 |
| Ocean Depth | Inkwell #2f3e48 | AIMfM Sage Teal #68a395 | Golden Wheat #d4b063 | Storm Cloud #c8d1d6 |

**Soft & Light**

| Theme | Primary | Secondary | Accent | Background |
|-------|---------|-----------|--------|------------|
| Peach Garden | Burnt Sienna #b86432 | Peach Nectar #f9c396 | Herb Garden #b2d3c0 | Soft Apricot #fde3c7 |
| Berry Soft | Muted Berry #b4716d | Rose Dust #f5c1ba | Mauve Fog #d2b9d7 | Petal Blush #fce8e3 |
| Morning Mist | Dusty Sage #889a8d | Silver Sage #d8e3da | Rose Dust #f5c1ba | Warm Cream #fff4ec |
| Petal & Honey | Muted Berry #b4716d | Petal Blush #fce8e3 | Honey Butter #f3d188 | Champagne Linen #fdf4db |
| Cloud Nine | Coastal Blue #7d98a5 | Storm Cloud #c8d1d6 | Lilac Whisper #e9daec | Storm Cloud #c8d1d6 |

**Bright & Fun**
High-readability palettes with lighter backgrounds and vibrant accents. Optimized for Guided and Play shells but available to anyone who loves a cheerful, energetic look.

| Theme | Primary | Secondary | Accent | Background |
|-------|---------|-----------|--------|------------|
| Sunshine Day | Mustard Grove #b99c34 | Sunbeam Gold #fae49b | Coral Pink #f3a6a0 | Buttercream #fff6d5 |
| Garden Party | Forest Sage #4b7c66 | Herb Garden #b2d3c0 | Rose Dust #f5c1ba | Misty Mint #dcefe3 |
| Ocean Adventure | AIMfM Sage Teal #68a395 | Cool Sage #a8cfc8 | Sunbeam Gold #fae49b | Seafoam #d7eae2 |
| Berry Bright | Rustic Rose #b25a58 | Rose Dust #f5c1ba | Sunbeam Gold #fae49b | Petal Blush #fce8e3 |
| Minty Fresh | Forest Sage #4b7c66 | Misty Mint #dcefe3 | Peach Nectar #f9c396 | Misty Mint #dcefe3 |
| Peachy Keen | Burnt Sienna #b86432 | Peach Nectar #f9c396 | Herb Garden #b2d3c0 | Soft Apricot #fde3c7 |

**Seasonal**

| Theme | Primary | Secondary | Accent | Background | Flag |
|-------|---------|-----------|--------|------------|------|
| Fresh Spring | Herb Garden #b2d3c0 | Buttercream #fff6d5 | Petal Blush #fce8e3 | Misty Mint #dcefe3 | seasonal |
| Sunny Summer | Mustard Grove #b99c34 | Peach Nectar #f9c396 | Cool Sage #a8cfc8 | Buttercream #fff6d5 | seasonal |
| Cozy Autumn | Burnt Sienna #b86432 | Cinnamon Milk #c8ad9d | Rustic Rose #b25a58 | Soft Apricot #fde3c7 | seasonal |
| Winter Wonderland | Vintage Plum #805a82 | AIMfM Sage Teal #68a395 | Soft Sage #d4e3d9 | Storm Cloud #c8d1d6 | seasonal |
| Christmas Joy | Rustic Rose #b25a58 | Forest Sage #4b7c66 | Sunbeam Gold #fae49b | Light Blush #f8d6d0 | holiday |
| Fall Fun | Burnt Sienna #b86432 | Vintage Plum #805a82 | Mustard Grove #b99c34 | Soft Apricot #fde3c7 | seasonal |

### Theme Picker Behavior
- Themes displayed in a scrollable grid grouped by mood category
- Category headers: Warm & Cozy, Cool & Calm, Bold & Rich, Soft & Light, Bright & Fun, Seasonal
- Each swatch shows a 3-color preview (primary, secondary, accent) with theme name below
- Active theme has a highlighted border
- All categories visible to all users regardless of role or shell — any member can pick any theme (subject to permission rules in Visibility & Permissions)
- Mom can assign themes from the "Bright & Fun" category (or any category) to Guided/Play members from Family Management

### Extensibility
The theme catalog is a living collection. New themes can be added at any time by creating a CSS file in `src/styles/themes/` that overrides the semantic tokens and assigning it to a mood category. The architecture supports unlimited themes. Future additions include themes requested by family members, community-suggested themes, and additional seasonal/event themes. All new themes must draw exclusively from the approved 44-color extended palette plus the 8 brand colors.

---

## Dark Mode

### Approach: Auto-Generated Dark Variants
Every theme in the catalog gets an automatic dark mode counterpart. Rather than hand-crafting 70+ dark themes, the system applies transformation rules that map light palette values to dark equivalents.

> **Decision rationale:** Auto-generation from transformation rules means every new theme gets dark mode for free. Hand-crafting 70+ dark variants is unsustainable. Hand-tuning specific themes that don't auto-generate well is supported as a fallback.

> **Forward note:** Initial auto-generation may produce imperfect results for some themes. The system supports hand-crafted dark variant overrides for any theme that needs manual tuning post-launch.

### User Control
Dark mode defaults to the user's OS preference (`prefers-color-scheme: dark`). Each member can override this in their Settings with a three-way toggle: Light / Dark / System (default).

The override is stored per-member in `family_members.theme_preferences`:
```
{ "dark_mode": "system" | "light" | "dark" }
```

### Transformation Rules
When dark mode is active, the ThemeProvider applies these transformations to the active theme's semantic tokens:

- **Backgrounds:** Light backgrounds become deep, desaturated versions of the theme's darkest color. `--color-bg-primary` shifts to a dark tone derived from the theme's primary color family.
- **Cards/surfaces:** Slightly lighter than the background to maintain elevation hierarchy. Never pure black — always tinted with the theme's hue.
- **Text:** Primary text becomes warm off-white (derived from the theme's lightest tone). Secondary text lightens proportionally. Heading text may keep a tinted light version of the theme's primary color.
- **Interactive elements:** Button backgrounds may lighten slightly for visibility. Hover states become lighter (not darker). Border colors lighten to remain visible against dark backgrounds.
- **Accent colors:** Primary, secondary, and accent colors stay recognizable but may adjust saturation/lightness for contrast against dark backgrounds. They should still "feel like" the same theme.
- **Status colors:** Success, warning, error, info colors may lighten slightly for dark backgrounds but remain recognizable.
- **Gradients:** Gradient angle and structure preserved; endpoint colors shift to dark-appropriate tones.
- **Shadows:** Become darker and more prominent (dark surfaces need deeper shadows for elevation cues).
- **Scrollbars, focus rings, overlays:** All adapt to dark mode. Overlay opacity may increase for dark backgrounds.

### Contrast Requirements
All dark mode transformations must maintain a minimum 4.5:1 contrast ratio for body text and 3:1 for large text (WCAG AA). The `getContrastColor()` utility function validates this during theme generation.

### Deep Waters Reference
The existing StewardShip "Deep Waters" theme serves as a quality reference for what a well-crafted dark theme looks like. Auto-generated dark themes should aim for comparable quality. Specific themes can be hand-tuned if the auto-generation doesn't produce satisfactory results — the system supports both auto-generated and hand-crafted dark variants.

---

## Themed Scrollbars

Every scrollbar in the application must be themed. No default browser scrollbar styling is acceptable.

### Scrollbar Styling

```
/* Themed scrollbar — adapts to active theme */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-full);
}
::-webkit-scrollbar-thumb {
  background: var(--gradient-primary);  /* Gradient when toggle ON */
  border-radius: var(--radius-full);
  border: 2px solid var(--color-bg-secondary);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-btn-primary-hover);
}

/* Gradient OFF fallback */
.gradient-off ::-webkit-scrollbar-thumb {
  background: var(--color-btn-primary-bg);  /* Solid when gradient OFF */
}
```

### Firefox Scrollbar Support
```
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-btn-primary-bg) var(--color-bg-secondary);
}
```

---

## Member Color System

### Assignment
Mom assigns each family member a unique color from the full 44-color extended palette. This color becomes that member's visual identifier across the platform.

### Where Member Colors Appear
- Avatar rings/borders on family dashboards and tablet hub
- Calendar event markers and day labels
- Task assignment indicators
- Chart/progress lines and bars
- Family dashboard cards and sections
- Any multi-member view where individuals need visual distinction

### Storage
Member color stored in `family_members.assigned_color` (TEXT, hex value). Default: system auto-assigns from a spread of visually distinct colors when member is created. Mom can change any member's color at any time.

### Color Picker UI
Colors displayed grouped by family (Red, Orange, Gold, Yellow, Sage, Green, Teal, Blue, Purple, Brown, Pink) with all 4 shades per family visible. Color swatches show the color name on hover/tap. Already-assigned colors show the member's name/avatar on the swatch. Mom can assign the same color to multiple members if desired (no uniqueness enforcement), but a subtle "already used by [name]" indicator appears.

---

## Shell Visual Token Overrides

PRD-03 defines the visual design tokens per shell. PRD-04 defines layouts, navigation, routing, and drawer behavior.

### Mom Shell / Adult Shell / Independent Shell
These three shells share the same base visual tokens. The user's chosen theme and vibe apply directly.

- **Typography:** Standard scale (16px base body, The Seasons or vibe-appropriate heading font)
- **Animation:** Subtle. Transitions at `--transition-fast` (150ms) and `--transition-normal` (250ms). No bouncy or playful motion. Smooth ease curves.
- **Spacing:** Standard `--spacing-*` scale
- **Emoji policy:** No Unicode emoji. Lucide React icons for all visual indicators.
- **Border-radius:** Per vibe defaults
- **Touch targets:** Minimum 44px

### Guided Shell
Guided shell uses token overrides that simplify and clarify the visual experience for members who can read and follow instructions but benefit from reduced complexity.

- **Typography:** Slightly larger. Base body text at 17-18px (`--font-size-base` override). Headings proportionally larger. Line height at `--line-height-relaxed` (1.75) for easier reading.
- **Animation:** Gentle. Same timing as adult shells but with slightly more visual feedback on interactions (brief color pulse on tap, gentle scale on press).
- **Spacing:** More generous. `--spacing-density` multiplier increases padding and gaps by ~20%.
- **Emoji policy:** No Unicode emoji (same as adult). Lucide icons, but may use slightly larger icon sizes.
- **Border-radius:** Softer than adult defaults. Minimum `--radius-md` (8px) on interactive elements.
- **Touch targets:** Minimum 48px (larger than adult shells)
- **Visual chart support:** Component patterns must accommodate visual routine displays — large icon slots, image placeholders, step-by-step visual layouts. Full visual chart feature (library, upload, generation) deferred to future PRD, but the design system accommodates the patterns from day one.

> **Deferred:** Full visual chart feature (icon/image library, upload custom visuals, AI generation, routine builder UI) — to be resolved in future Guided/Play Features PRD or Accessibility PRD. Design system token accommodations are built now.

### Play Shell
Play shell has the most dramatic token overrides. Everything is bigger, brighter, rounder, and more animated. This is the shell where emoji are permitted.

- **Typography:** Large. Base body text at 20-22px. Headings large and bold. Font weights lean heavier. Line height generous.
- **Animation:** Playful. Bouncy ease curves (`cubic-bezier(0.34, 1.56, 0.64, 1)`), longer durations (300-400ms), scale-up on tap, wobble on completion, celebratory bursts on achievements.
- **Spacing:** Very generous. Large padding, wide gaps, plenty of breathing room for small fingers.
- **Emoji policy:** Unicode emoji PERMITTED in Play shell only. Can appear in labels, buttons, celebrations, task names, sticker rewards.
- **Border-radius:** Maximum softness. `--radius-xl` (16px) minimum on cards and buttons. Pill shapes on tags and badges.
- **Touch targets:** Minimum 56px (extra-large for small fingers)
- **Color intensity:** Themes shift toward lighter backgrounds with more saturated interactive elements. Kid themes use the brightest approved palette colors.
- **Visual chart support:** Same as Guided — must support visual routine displays, large icons, image-based task representations.
- **Gamification visuals:** The design system provides the tokens and animation infrastructure. Specific gamification theme visuals (Flower Garden, Ocean Aquarium, Dragon Academy, etc.) are defined in the gamification PRD.

### Shell Token Override Table

| Token | Mom/Adult/Independent | Guided | Play |
|-------|----------------------|--------|------|
| `--font-size-base` | 1rem (16px) | 1.0625-1.125rem (17-18px) | 1.25-1.375rem (20-22px) |
| `--touch-target-min` | 44px | 48px | 56px |
| `--line-height-normal` | 1.5 | 1.75 | 1.75 |
| `--transition-normal` | 250ms ease | 250ms ease | 350ms cubic-bezier(0.34,1.56,0.64,1) |
| `--spacing-density` | 1 | 1.2 | 1.4 |
| `--vibe-radius-card` | per vibe | min 8px | min 16px |
| Emoji | Prohibited | Prohibited | Permitted |
| Icon size | 18-20px | 22-24px | 28-32px |

---

## Permission Visual States

PRD-02 defines the permission logic (PermissionGate, permission engine, RLS). PRD-03 defines how restricted states *look*. These are standardized visual patterns that any feature can use when content is gated.

### LockedOverlay
Used when a feature or section is visible but not accessible to the current role.
- Semi-transparent overlay (theme-aware opacity)
- Centered lock icon (Lucide `Lock`) with brief explanation text
- Background content visible but blurred (CSS `filter: blur(4px)`)
- No interaction possible through the overlay

### UpgradeCard
Used when a feature is gated by subscription tier (via `useCanAccess()`).
- Card with theme border, subtle background tint
- Feature name and brief description of what it unlocks
- "Available with [Tier Name]" label
- Optional CTA button (styled secondary, never aggressive)
- Warm, encouraging tone — never punitive or guilt-inducing

### RoleBadge
Visual indicator of the current member's role, shown in navigation and profile areas.
- Small pill-shaped badge with role name
- Color derived from theme accent colors (not hardcoded)
- Roles: Mom, Dad, Special Adult, Independent, Guided, Play
- Badge uses `--color-accent` background with appropriate contrast text

### ShiftBanner
Displayed when a Special Adult (caregiver) is logged in during an active shift.
- Subtle banner at top of content area (not blocking navigation)
- Shows: caregiver name, which children they're caring for, shift duration
- Theme-colored background (uses `--color-bg-secondary`)
- Dismissible but re-appears on page navigation

### TransparencyIndicator
Used in Independent (teen) shell when mom has transparency enabled — teen can see that mom has visibility into certain areas.
- Small, non-intrusive icon (Lucide `Eye`) in the corner of relevant sections
- Tooltip on hover/tap: "Your parent can see this section"
- Uses `--color-text-secondary` — visible but not alarming
- Never hidden or obfuscated from the teen

### PermissionGate Fallback Patterns
Standard fallback components for `<PermissionGate fallback={...}>`:
- **Hidden:** `fallback={null}` — feature simply doesn't render
- **Locked:** `fallback={<LockedOverlay message="..." />}`
- **Upgrade:** `fallback={<UpgradeCard feature="..." tier="..." />}`
- **Simplified:** `fallback={<SimplifiedView />}` — reduced version of the feature (Guided/Play shells)

---

## Shared Component Library

All components live in `src/components/shared/` and consume CSS variables exclusively. Zero hardcoded colors, fonts, or spacing values. Every component automatically adapts to any theme + vibe + dark mode combination.

### Core Components

| Component | Description | Theme-Aware Properties |
|-----------|-------------|----------------------|
| Button | Primary, secondary, ghost, destructive variants | Background, text, border, hover, gradient (when ON) |
| Card | Elevated surface with optional header, footer | Background, border, shadow, radius (per vibe) |
| Input | Text, email, password, textarea, select | Background, border, focus ring, placeholder text |
| Modal | Centered overlay dialog with backdrop | Background, overlay, border, shadow |
| Tooltip | Contextual hover/focus information | Background (dark), text (light), border |
| Toast | Ephemeral notification | Background, text, border, auto-dismiss timing |
| Badge | Small status/label indicator | Background, text, border-radius |
| EmptyState | Placeholder for sections with no data | Illustration style, text color, CTA button |
| LoadingSpinner | Activity indicator | Color derived from `--color-btn-primary-bg` |
| IconButton | Button with icon only, no text | Same as Button but circular/square with icon centering |
| FeatureGuide | First-use tooltip/card for feature discovery | Background tint, accent border, dismiss styling |
| DrawerChat | LiLa chat drawer interface | All drawer chrome themed |
| VisibilityToggle | Eye icon toggle for show/hide | Icon color, toggle state colors |
| LockedOverlay | Permission-gated overlay | Blur, overlay tint, lock icon |
| UpgradeCard | Tier-gated feature placeholder | Card styling, badge, CTA |
| RoleBadge | Member role indicator | Accent-derived colors |
| ShiftBanner | Caregiver shift indicator | Secondary background, text |
| ColorPicker | Member color assignment picker | Displays all 44 palette colors grouped by family |

### Component Rules
- Every component MUST use CSS variables for all visual properties
- Every component MUST work in light and dark mode
- Every component MUST respect the active vibe's radius, shadow, and spacing overrides
- Every component MUST meet touch target minimums for the active shell
- Components MUST NOT use Unicode emoji in Mom/Adult/Independent shells (use Lucide icons)
- Components MUST support the gradient toggle (gradient vs solid variants where applicable)

---

## Responsive Behavior

PRD-03 defines the responsive *design tokens* and *breakpoint system*. PRD-04 defines the responsive *layouts* (sidebar collapse, bottom nav, drawer behavior).

### Breakpoints

```
--breakpoint-sm: 640px      /* Small phones → larger phones */
--breakpoint-md: 768px      /* Phones → tablets */
--breakpoint-lg: 1024px     /* Tablets → laptops */
--breakpoint-xl: 1280px     /* Laptops → desktops */
```

### Mobile-First Principles
- All CSS written mobile-first (base styles for smallest screens, `min-width` media queries for larger)
- Touch targets never below `--touch-target-min` on any screen size
- Font sizes never below `--font-size-sm` (14px) for readable text
- Content width capped at `--content-max-width` (600px) for readability on wide screens
- Spacing may tighten slightly on small screens but never below `--spacing-xs`

### Tablet Hub
The family tablet runs in a special always-on mode (defined in PRD-01). Design system considerations:
- Hub uses the family's default theme (not a specific member's theme)
- Larger UI elements appropriate for wall-mounted/countertop viewing distance
- Higher contrast for visibility from across the room
- Widget grid adapts to tablet aspect ratios

---

## Borders & Card Interactions

### Border System

```
--border-width-default: 1px
--border-width-focus: 2px
--border-width-active: 2px
--border-style: solid

/* Border colors from semantic tokens */
--color-border                /* Default card/section borders */
--color-border-focus           /* Input focus state */
--color-border-error           /* Error state */
--color-border-hover           /* Hover state (slightly stronger than default) */
```

### Card Interaction Patterns
Cards throughout the app use a layered interaction system that creates the "premium" feel. These are the standardized patterns:

**Interactive Cards (tappable — Command Center nav cards, feature cards, dashboard widgets):**
- **Default:** `background: var(--gradient-background)` (or `var(--color-bg-card)` when gradient OFF), `border: 1px solid var(--color-border)`, `border-radius: var(--vibe-radius-card)`, `box-shadow: var(--shadow-md)`, `transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease`
- **Hover:** `transform: translateY(-8px) scale(1.02)`, `box-shadow: var(--shadow-lg)` deepened, `background: var(--gradient-primary)` — the card color shifts to the primary gradient, text inverts to `var(--color-text-on-dark)`. This is the signature MyAIM interaction that makes navigation feel alive and rewarding.
- **Active/Press:** `transform: translateY(-2px) scale(0.98)`, shadow reduces — a brief "press in" before the action fires.
- **Gradient OFF variant:** Hover shifts background from `var(--color-bg-card)` to `var(--color-btn-primary-bg)` (solid primary). Same lift and shadow behavior.

**Static Cards (display only — info cards, stats, read-only content):**
- **Default:** Same border and shadow as interactive cards
- **Hover:** `box-shadow: var(--shadow-lg)` only — subtle shadow increase, no lift, no color shift. Signals the card is readable but not a navigation target.

**Input Cards (forms, text entry areas):**
- **Default:** `border: 2px solid var(--color-border)`, `background: var(--color-bg-input)`
- **Focus:** `border-color: var(--color-border-focus)`, `box-shadow: 0 0 0 3px var(--color-focus-ring)` — a glowing ring effect using a semi-transparent version of the primary color. The glow makes the focused input feel premium and clear.
- **Error:** `border-color: var(--color-border-error)`, `box-shadow: 0 0 0 3px var(--color-error-ring)`

**List Item Cards (entries, task items, journal entries):**
- **Default:** Minimal border or none, subtle separator lines
- **Hover:** `box-shadow: var(--shadow-lg)` — pops forward slightly
- **Dragging:** `box-shadow: var(--shadow-lg)`, `opacity: 0.9` — lifted appearance while being repositioned

### Border Radius Per Vibe
Each vibe overrides the card and input radius to match its personality:

| Element | Classic | Clean & Modern | Nautical | Cozy Journal |
|---------|---------|----------------|----------|--------------|
| Cards | 16px | 8px | 12px | 20px |
| Inputs | 8px | 4px | 8px | 12px |
| Buttons | 8px | 4px | 8px | 12px |
| Modals | 16px | 8px | 12px | 20px |
| Badges/Pills | 9999px | 9999px | 9999px | 9999px |
| Avatars | 9999px | 9999px | 9999px | 9999px |

---

## Animation & Motion Guidelines

### Interaction Patterns (Premium Feel)
These specific patterns make the app feel polished and responsive. They apply across adult shells and scale up in expressiveness for Guided/Play.

**Button Hover & Press:**
- Primary buttons: hover lifts 2px (`translateY(-2px)`) + shadow deepens + optional gradient shimmer. Press sinks 1px.
- Secondary buttons: hover background fills from transparent to `var(--color-btn-secondary-hover)`. Border color may shift to primary.
- Icon buttons: hover background fills with `var(--color-bg-secondary)` circle/rounded-rect behind the icon.
- FAB (Floating Action Button): hover scales to 1.05x, press scales to 0.95x.

**Card Hover (the signature pattern):**
- Interactive cards lift + scale + change background color on hover (described in Borders & Card Interactions above). This is the most important interaction pattern — it makes navigation cards, feature tiles, and dashboard widgets feel alive.
- The color shift from background gradient to primary gradient on hover creates a "spotlight" effect that rewards exploration.

**Input Focus Glow:**
- Inputs get a 3px focus ring in a semi-transparent version of the primary color (`rgba(primary, 0.1-0.15)`). Border transitions to primary color. This makes form interactions feel intentional and clear.

**Toggle & Switch Animations:**
- Toggle switches: smooth slide (200ms) with background color transition from muted to primary.
- Checkbox: brief scale bounce (1.1x → 1.0x) on check with checkmark draw animation.
- Radio: fill animation from center outward (150ms).

**Drawer & Panel Animations:**
- Slide-up drawers (LiLa, more menu): `translateY(100%) → translateY(0)`, 200ms ease-out.
- Side panels: `translateX(100%) → translateX(0)`, 250ms ease.
- Drawer handle: subtle visual affordance (gradient bar or notch) indicating draggability.

**Navigation Transitions:**
- Page transitions: subtle opacity fade (0→1, 150ms). Content area only — navigation chrome stays stable.
- Tab switches: content crossfade with optional horizontal slide direction hint (left-tab → right-tab slides content left).

**Completion & Success:**
- Task completion: brief checkmark draw animation (Lucide Check icon animate-in, 300ms).
- Save confirmation: subtle green flash on the save button or a brief "Saved" text swap (1s, then revert).
- In Play shell: completion triggers SparkleOverlay (gold particles, expanding ring) — see Gold Celebratory Effects below.

**Loading States:**
- Spinner: smooth rotation of themed LoadingSpinner component, using `var(--color-btn-primary-bg)`.
- Skeleton screens: pulsing placeholder blocks (`background: var(--color-bg-secondary)`, opacity oscillation 0.5→1.0, 1.5s).
- Progress bars: smooth fill with gradient (when gradient ON) or solid primary (when OFF).

### Gold Celebratory Effects (Victory Only)
The SparkleOverlay from v1 carries forward. Gold particle effects are reserved exclusively for victories and celebrations:

- **Quick burst (task completion in Play shell):** 8-12 gold particles explode outward from completion point, 0.8s duration. Expanding gold ring (0.7s).
- **Full celebration (achievement unlocked, streak milestone):** 16-24 particles, larger radius, 1.6s duration. Expanding ring. Particles include shape variations (circles + rotated squares). Gold shade variations for depth (#D4AF37, #E8C547, #B8942A).
- **These effects NEVER appear** in response to routine interactions (button clicks, navigation, data entry). They are earned moments only.

### Per-Shell Motion Profiles

**Mom / Adult / Independent:**
- Transitions: `var(--transition-fast)` (150ms) and `var(--transition-normal)` (250ms) with `ease` timing
- Card hover: lift + scale + color shift (the signature pattern described above)
- Button hover: lift 2px + shadow deepen
- Page transitions: subtle opacity fade (150ms)
- Drawer open/close: smooth slide (250ms)
- No bouncing, wobbling, or elastic effects
- Celebratory effects: none (adult shells celebrate through visual state changes, not particle effects)

**Guided:**
- Same base timing as adult shells but slightly more visible feedback
- Card hover: same lift + color shift pattern
- Tap confirmation: brief color pulse (background flashes 10% lighter, 100ms in, 200ms out)
- Completion: gentle checkmark draw animation (400ms, slightly slower for visibility)
- Transitions may be slightly slower (200-300ms) for clarity
- No particle effects or bouncy motion

**Play:**
- Bouncy timing function: `cubic-bezier(0.34, 1.56, 0.64, 1)` — overshoots slightly then settles
- Durations: 300-400ms for interactions
- Card hover/tap: scale up 1.05x with bounce, shadow deepens, color shifts (same pattern but bouncier)
- Tap: elements briefly scale up then bounce back (1.05x → 1.0x, 200ms)
- Completion: bouncy checkmark + SparkleOverlay gold burst
- Achievement: full celebratory animation (SparkleOverlay full mode)
- Page transitions: playful slide with slight bounce at destination
- Idle animations: subtle breathing/floating on key elements (gamification creatures, avatar pulse) — `transform: translateY(-2px) → translateY(2px)`, 3s ease-in-out infinite

### Reduced Motion
When the user's OS has `prefers-reduced-motion: reduce` enabled:
- All transitions become instant or extremely brief (≤100ms)
- Card hover: shadow change only, no lift or scale
- No bouncing, wobbling, scaling, or elastic effects in any shell
- Loading spinners may remain but at reduced speed
- SparkleOverlay effects replaced with static visual feedback (gold checkmark icon, no particles)
- Idle animations disabled entirely

---

## Emoji Policy

| Shell | Unicode Emoji | Lucide Icons | Notes |
|-------|--------------|-------------|-------|
| Mom | Prohibited | Required | Text-based labels, icon indicators only |
| Adult | Prohibited | Required | Same as Mom |
| Independent | Prohibited | Required | Same as Mom |
| Guided | Prohibited | Required (larger) | Same policy, larger icon sizes |
| Play | Permitted | Also used | Emoji in labels, buttons, celebrations, stickers, task names |

Emoji prohibition means no Unicode emoji characters in component labels, button text, section headers, or decorative elements. This creates a professional, polished feel for adult interfaces. Lucide React icons provide all necessary visual indicators.

> **Decision rationale:** Emoji in adult interfaces reads as casual/toy-like. Lucide icons maintain a professional, designed feel while providing equivalent visual communication. Play shell permits emoji because that's where delight and playfulness are appropriate for young children.

---

## Screens

### Screen 1: Theme Settings (within Settings page)

**What the user sees:**
- "Appearance" section in Settings
- Current theme preview (3-color swatch + name)
- Theme picker: grid of theme swatches organized by category (Core, Masculine, Teen, Kid, Seasonal)
- Each swatch shows 3-color preview and theme name
- Currently active theme has a highlighted border
- Below themes: Vibe selector (4 options with visual preview)
- Below vibes: Gradient toggle (on/off switch with live preview)
- Below gradient: Dark mode selector (Light / Dark / System)
- Below dark mode: Font size selector (Normal / Large / Extra Large)

**Interactions:**
- Tap any theme swatch → theme applies instantly (no page reload). Uses `setThemeWithTransition()` for smooth 300ms crossfade.
- Tap any vibe → vibe applies instantly. Typography, radius, shadows shift.
- Toggle gradient → gradients appear/disappear on buttons and backgrounds.
- Change dark mode → screen transitions to light/dark immediately.
- Change font size → all text scales proportionally.
- All changes persist to `family_members.theme_preferences` immediately (auto-save, no "Save" button).

**Data created/updated:**
- `family_members.theme_preferences` JSONB updated with: `theme`, `vibe`, `gradient_enabled`, `dark_mode`, `font_scale`

---

### Screen 2: Member Color Assignment (within Family Management)

**What the user sees:**
- List of family members with current assigned color swatch next to each name
- Tap a member → color picker opens
- Color picker shows all 44 colors grouped by family (11 rows of 4 swatches)
- Each swatch shows color name on hover/long-press
- Colors already assigned to other members show a small avatar/initial overlay
- "Already used by [name]" helper text when selecting an in-use color (not blocking — mom can assign duplicates)

**Interactions:**
- Tap color swatch → assigns to that member, picker closes, swatch updates
- Change is immediate and auto-saved

**Data created/updated:**
- `family_members.assigned_color` TEXT field updated

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | Can change any member's theme, vibe, color assignment. Controls her own appearance settings. |
| Dad / Additional Adult | Partial | Can change their own theme, vibe, gradient, dark mode, font size. Cannot change other members' settings or color assignments. |
| Special Adult | Partial | Can change their own appearance settings only. |
| Independent (Teen) | Partial | Can change their own theme (full adult catalog + teen themes), vibe, gradient, dark mode, font size. Cannot change others' settings. |
| Guided | Limited | Mom pre-selects theme from kid themes. Child may toggle dark mode and font size only (if mom permits). |
| Play | None | Mom selects theme. No user-facing appearance settings in Play shell. |

### Shell Behavior
- Theme Settings screen appears in Mom, Adult, Independent shells
- Guided shell: simplified appearance section (dark mode toggle + font size only, if mom permits)
- Play shell: no appearance settings visible. Mom sets theme from Family Management.
- All shells render using the member's assigned theme + vibe + gradient + dark mode preferences

### Privacy & Transparency
- Teen can see their own full appearance settings
- Mom can see (and override) any member's theme settings from Family Management
- No transparency considerations — appearance preferences are not sensitive data

---

## Data Schema

### Updates to Existing Table: `family_members` (from PRD-01)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| assigned_color | TEXT | null | NULL | Hex value from approved palette. Auto-assigned on member creation, mom can change. |
| theme_preferences | JSONB | '{}' | NOT NULL | Theme settings for this member |

**`theme_preferences` JSONB structure:**
```json
{
  "theme": "classic-myaim",
  "vibe": "classic",
  "gradient_enabled": true,
  "dark_mode": "system",
  "font_scale": "normal"
}
```

**Defaults when empty/missing:**
- `theme`: "classic-myaim"
- `vibe`: "classic"
- `gradient_enabled`: true
- `dark_mode`: "system"
- `font_scale`: "normal"

**RLS:** Same as PRD-01 — members can read/update their own record. Mom can read/update all members. Dad can read/update own only.

### No New Tables
The design system stores all preferences in the existing `family_members` table. Theme CSS files are static assets, not database records.

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| PRD-01 (Auth & Family Setup) | Member creation triggers auto-assignment of a default color from the palette. `theme_preferences` initialized to defaults. |
| PRD-02 (Permissions) | Permission states determine which visual patterns to show (LockedOverlay, UpgradeCard, etc.) |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| Every feature | All features consume the CSS variable system. Theme, vibe, dark mode, and gradient preferences affect every screen. |
| PRD-04 (Shell Routing) | Shell visual token overrides are applied based on the member's `dashboard_mode`. |
| Family Dashboard / Calendar / Charts | Member `assigned_color` used for visual identification in multi-member views. |
| Gamification (future PRD) | Play shell animation tokens and color intensity overrides feed into gamification visual systems. |

---

## AI Integration

No direct AI integration. LiLa does not control or recommend themes. Theme and appearance settings are purely user-driven.

---

## Edge Cases

### Theme File Missing or Corrupt
- If a member's saved theme doesn't match any theme file, fall back to Classic MyAIM.
- If the CSS file fails to load, semantic tokens inherit from `:root` defaults (Classic MyAIM).

### Dark Mode + Gradient Interaction
- Gradients must look good in dark mode. The gradient transformation rules adjust endpoint colors for dark backgrounds.
- If a gradient produces insufficient contrast in dark mode, the system falls back to a solid dark-appropriate version of the primary color.

### Member Color Conflicts
- Multiple members CAN have the same assigned color. The system does not enforce uniqueness.
- When two members share a color on the same view (e.g., calendar), the system distinguishes them by initials/avatars overlaid on the color — never by color alone.

### Play Shell + Adult Theme
- If a member in Play mode has somehow been assigned an adult theme (e.g., mom changed their mode but not their theme), the system should apply the Play shell token overrides on top of whatever theme is active. The theme colors still work; the spacing, radius, and animation overrides ensure Play shell feels appropriate.

### Accessibility: Contrast Failures
- If any theme + dark mode combination produces a contrast ratio below WCAG AA (4.5:1 body, 3:1 large text), the build-time theme validation tool should flag it. The ThemeProvider can include a runtime contrast check that subtly adjusts text color if needed.

### First-Time User (No Preferences Set)
- Classic MyAIM theme, Classic vibe, gradients ON, dark mode follows system, normal font scale.
- Member color auto-assigned from a spread algorithm that maximizes visual distinction across the palette.

### Large Family (9+ Members)
- The 44-color palette provides sufficient variety for large families.
- Auto-assignment algorithm starts with the most visually distinct colors (one from each family's medium shade) before reusing families.
- Color picker shows all 44 regardless of family size.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `theme_selection` | Access to full theme catalog (all 30+ themes) | Essential (all users) |
| `vibe_selection` | Access to all 4 vibes | Essential (all users) |
| `custom_themes` | Ability to create custom themes from palette colors (future) | Full Magic |

Note: Theme and appearance customization is available at all tiers during beta and likely at launch. Custom theme creation (picking your own primary/secondary/accent from the palette) is a potential Full Magic feature for the future. The catalog of curated themes is always available.

> **Tier rationale:** Personalization is a core value proposition — restricting theme selection would make the free tier feel punishing. Custom theme *creation* (designing your own) adds enough value to justify a premium tier without gating the curated experience.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Visual chart/routine display patterns in Guided/Play component library | Visual routine builder, icon library, upload/generate | Future PRD (Guided/Play features or Accessibility) |
| Scrapbook decoration library integration points (Cozy Journal vibe) | Full decoration component library | Future PRD or asset expansion |
| Custom theme creator (pick palette colors, preview, save) | Custom theme UI in Settings | Future PRD or feature expansion |
| Gamification animation infrastructure in Play shell | Gamification visual themes (Flower Garden, Dragon Academy, etc.) | Future PRD (Gamification) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Shell routing placeholder (returns dashboard_mode) | PRD-01 | Shell visual token overrides applied based on `dashboard_mode` value |
| Permission check placeholder (useCanAccess returns true) | PRD-01 | UpgradeCard and LockedOverlay visual patterns defined for future tier gating |
| PermissionGate component with fallback prop | PRD-02 | Standardized fallback visual components (LockedOverlay, UpgradeCard, SimplifiedView) defined |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] CSS variable architecture established with all three layers (brand, palette, semantic tokens)
- [ ] Classic MyAIM theme implemented as default
- [ ] At least 15 themes from the launch catalog implemented and functional
- [ ] All 4 vibes implemented with correct typography, radius, shadow, and spacing overrides
- [ ] Gradient toggle works (on/off) with live preview
- [ ] Dark mode auto-generation working for all implemented themes
- [ ] Dark mode toggle (Light / Dark / System) functional and persisting per member
- [ ] Font scale (Normal / Large / Extra Large) working
- [ ] Theme switching is instant (no page reload), uses transition animation
- [ ] Themed scrollbars on all scrollable areas (WebKit + Firefox)
- [ ] All shared components (Button, Card, Input, Modal, Tooltip, Toast, Badge, EmptyState, LoadingSpinner) implemented with full theme/vibe/dark mode support
- [ ] Member color assignment: all 44 colors available, picker grouped by family, auto-assignment on member creation
- [ ] Shell visual token overrides applied: Mom/Adult/Independent (standard), Guided (larger/gentler), Play (largest/bounciest)
- [ ] Play shell permits emoji; all other shells use Lucide icons only
- [ ] LockedOverlay, UpgradeCard, RoleBadge, ShiftBanner, TransparencyIndicator components built
- [ ] All components pass WCAG AA contrast in light and dark mode
- [ ] `prefers-reduced-motion` respected in all shells
- [ ] No hardcoded colors anywhere in the codebase — all components use CSS variables
- [ ] Theme preferences persist to `family_members.theme_preferences` JSONB

### MVP When Dependency Is Ready
- [ ] Shell token overrides applied dynamically based on `dashboard_mode` routing (requires PRD-04)
- [ ] PermissionGate fallback components render correctly in context (requires PRD-02 built)
- [ ] Member colors display in calendar, charts, family dashboard (requires those feature PRDs)

### Post-MVP
- [ ] Remaining themes from launch catalog (all 30-35)
- [ ] Custom theme creator (pick palette colors → generate theme → save)
- [ ] Visual routine/chart display components for Guided/Play
- [ ] Seasonal theme auto-suggestion (app suggests seasonal theme when season changes)
- [ ] Theme preview mode (try a theme without committing)
- [ ] Scrapbook decoration library for Cozy Journal vibe
- [ ] Hand-tuned dark variants for specific themes that don't auto-generate well
- [ ] Community theme submissions process

---

## CLAUDE.md Additions from This PRD

- [ ] All components MUST use CSS variables (`var(--*)`) — zero hardcoded colors, fonts, or spacing
- [ ] Three-layer color system: brand (8) → palette (44) → semantic tokens. All theme colors from approved palette only.
- [ ] Emoji policy: No Unicode emoji in Mom/Adult/Independent shells. Emoji permitted in Play shell only. Use Lucide React icons everywhere else.
- [ ] Gold celebratory effects (confetti, sparkles, fireworks, shimmer) reserved for victories only. Gold as a color in themes/palettes is unrestricted.
- [ ] Gradient toggle: check `theme_preferences.gradient_enabled`. Use `--gradient-primary` when ON, `--color-btn-primary-bg` (solid) when OFF.
- [ ] Dark mode: check `theme_preferences.dark_mode` (system/light/dark). ThemeProvider handles OS detection and transformation.
- [ ] Vibes: check `theme_preferences.vibe`. Vibe overrides `--font-heading`, `--vibe-radius-*`, `--vibe-shadow-*`, `--vibe-spacing-density`, `--vibe-decoration-level`.
- [ ] Shell token overrides: Play shell gets larger fonts, bigger touch targets, bouncier animations, rounder corners. Guided shell gets moderately larger. Adult shells use standard tokens.
- [ ] Themed scrollbars required on all scrollable elements (8px width, gradient-matched thumb, theme track).
- [ ] Member color from `family_members.assigned_color` — use for avatars, calendar markers, chart lines, task badges.
- [ ] Shared components in `src/components/shared/`: Button, Card, Input, Modal, Tooltip, Toast, Badge, EmptyState, LoadingSpinner, IconButton, FeatureGuide, DrawerChat, VisibilityToggle, LockedOverlay, UpgradeCard, RoleBadge, ShiftBanner, TransparencyIndicator, ColorPicker
- [ ] Permission fallback patterns: `<PermissionGate fallback={<LockedOverlay />}>`, `<PermissionGate fallback={<UpgradeCard />}>`, `<PermissionGate fallback={null}>` (hidden)
- [ ] Interactive card hover pattern: `translateY(-8px) scale(1.02)` + shadow deepen + background shifts from `var(--gradient-background)` to `var(--gradient-primary)` + text inverts to `var(--color-text-on-dark)`. This is the signature MyAIM interaction — never skip it on navigation/feature cards.
- [ ] Static cards: hover increases shadow only (no lift, no color shift)
- [ ] Input focus: `border-color: var(--color-border-focus)` + `box-shadow: 0 0 0 3px var(--color-focus-ring)` glow ring
- [ ] Primary button hover: `translateY(-2px)` lift + shadow deepen. Press: `translateY(-1px)` sink.
- [ ] FAB: hover `scale(1.05)`, press `scale(0.95)`
- [ ] SparkleOverlay gold particle effects for victories only (Play shell). Never on routine interactions.
- [ ] `prefers-reduced-motion`: no lift, no scale, no bounce, no particles. Shadow changes and color changes only.
- [ ] Status colors are universal (never change with theme): Success #4b7c66, Warning #b99c34, Error #b25a58, Info #68a395, Pending #f9c396
- [ ] `prefers-reduced-motion` must be respected in all shells — no bounce/wobble/scale when reduced motion is active
- [ ] Touch targets: 44px min (adult), 48px min (guided), 56px min (play)

---

## DATABASE_SCHEMA.md Additions from This PRD

**Tables modified:** `family_members` (added `assigned_color` TEXT, `theme_preferences` JSONB)

**No new tables defined.** Design system preferences stored in existing `family_members` table.

**No new enums defined.** Theme names and vibe names are referenced as string values in the JSONB, not database enums (allows adding new themes without migrations).

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Classic MyAIM as default theme** | Warm, inviting, uses full brandboard palette. Establishes brand identity from first interaction. |
| 2 | **3-tier color system (brand → palette → semantic tokens)** | Brand colors exist as a separate tier for branding/defaults. Extended palette provides all available colors. Semantic tokens decouple components from specific colors. |
| 3 | **44-color extended palette, all pre-approved** | No off-palette colors permitted. Ensures visual coherence across all themes. 11 families × 4 shades provides variety without chaos. |
| 4 | **4 vibes independent from themes** | Classic, Clean & Modern, Nautical, Cozy Journal. Each controls structural aesthetics (fonts, radius, shadows, textures) independently from color. |
| 5 | **Mood-based theme organization** | Warm & Cozy, Cool & Calm, Bold & Rich, Soft & Light, Bright & Fun, Seasonal. No demographic labels. |
| 6 | **"Bright & Fun" as kid theme category name** | Describes the visual energy, not the audience. Available to anyone but optimized for Guided/Play readability. |
| 7 | **Auto-generated dark mode for all themes** | Transformation rules applied to light themes. Hand-tuned overrides supported as fallback. |
| 8 | **Dark mode default follows OS preference** | Three-way toggle: Light / Dark / System. Per-member preference stored. |
| 9 | **Gradient toggle per user (on by default)** | Gradients are a loved v1 feature. Toggle provides clean option for those who prefer it. |
| 10 | **Three gradient types carried from v1** | gradient-primary (buttons/nav), gradient-background (page wash), gradient-card (card tints). All with explicit generation formulas. |
| 11 | **Gold effects vs gold color distinction** | Gold celebratory effects (confetti, sparkles) reserved for victories only. Gold as a palette color is unrestricted in themes. |
| 12 | **"Fall Fun" not "Halloween"** | Inclusive naming for families who avoid Halloween. Uses autumn purples/oranges/browns palette. |
| 13 | **Emoji prohibited in Mom/Adult/Independent shells** | Lucide React icons only. Creates professional, polished feel. Emoji permitted in Play shell only. |
| 14 | **No hardcoded colors anywhere** | All components use CSS variables exclusively. Zero exceptions. |
| 15 | **Interactive card hover: lift + scale + color shift** | The signature MyAIM interaction pattern from v1. Cards lift 8px, scale 1.02x, shift background to primary gradient, text inverts. |
| 16 | **Visual chart design accommodation from day one** | Guided/Play shells include large icon slots, image placeholders, step-by-step visual layouts in token system. Important for accessibility community. |
| 17 | **Member color assignment from full 44-color palette** | Mom picks, no uniqueness enforcement, auto-assigned on member creation for visual distinction. |
| 18 | **Status colors universal across all themes** | Success, Warning, Error, Info, Pending colors never change with theme. Accessibility and recognition priority. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Full visual chart feature (icon library, upload, generation, routine builder) | Future Guided/Play Features PRD or Accessibility PRD |
| 2 | Custom theme creator (pick palette colors → generate → save) | Future feature expansion or Full Magic tier feature |
| 3 | Scrapbook decoration library for Cozy Journal vibe | Future asset expansion |
| 4 | Gamification visual themes (Flower Garden, Dragon Academy, etc.) | Gamification PRD |
| 5 | Seasonal theme auto-suggestion | Post-MVP enhancement |
| 6 | Theme preview mode (try without committing) | Post-MVP enhancement |
| 7 | Community theme submissions | Post-MVP process |
| 8 | Cozy Journal heading font selection | Build phase — evaluate web font candidates during implementation |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-01 (Auth & Family Setup) | `family_members` table extended with `assigned_color` TEXT and `theme_preferences` JSONB | No structural changes to PRD-01 needed — columns added here as table extension |
| PRD-02 (Permissions & Access Control) | PermissionGate fallback visual components (LockedOverlay, UpgradeCard, etc.) now fully defined | PRD-02 can reference PRD-03 for visual patterns. No edits needed. |
| PRD-04 (Shell Routing) | Shell visual token overrides defined per dashboard_mode. Responsive breakpoints defined. | PRD-04 should consume these tokens and apply them based on routing. Reference PRD-03 for breakpoint values. |
| All future PRDs | Shared component library defined. All components must use CSS variables. Emoji policy. Gold effects rule. | Convention documented in CLAUDE.md additions. |

---

*End of PRD-03*
