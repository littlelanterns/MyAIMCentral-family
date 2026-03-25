# PRD-03 Repair — Design System & Themes

> **Build type:** Repair session
> **PRD:** PRD-03-Design-System-Themes.md
> **Addenda read:** PRD-Audit-Readiness-Addendum.md, PRD-22-Cross-PRD-Impact-Addendum.md
> **Created:** 2026-03-25

---

## What Is Being Repaired

The initial PRD-03 build established the CSS variable architecture, 4 vibes, 38 themes in tokens.ts, gradient/dark mode toggles, shell token overrides, and core shared components. This repair addresses 13 audit findings: wrong implementations (4), missing features (8), and partial implementations (1).

---

## Founder Design Decisions (Applied This Session)

### A. Nautical → Professional rename
- Display name changes to "Professional" everywhere in UI
- Code key stays `'nautical'` to avoid breaking stored preferences
- Affects: vibes object display name in tokens.ts, ThemeSelector vibe UI

### B. Theme swatches: 3-segment split circles
- Show bgPrimary, btnPrimaryBg, accent as 3 pie segments
- Gradient toggle responsive: gradient OFF = solid segments, gradient ON = smooth gradient arc

### C. Collapsible mood category sections
- 6 mood categories in ThemeSelector, each collapsible
- Default: category containing active theme is expanded, all others collapsed

### D. Full brand palette for member ColorPicker
- ALL brand colors + member_colors.ts palette available
- No subset limitation

---

## Issues to Fix (13 total)

### WRONG (4)
1. ThemeSelector shows only 9 of 39 themes → show all 39 + 6 seasonal = 45 total
2. Single-color swatch circles → 3-segment split circles with gradient responsiveness
3. Card hover translateY(-2px) → PRD says translateY(-8px) scale(1.02)
4. Themes not organized by mood category → collapsible sections

### MISSING (8)
5. 6 seasonal themes not in tokens.ts
6. 8 shared components: LockedOverlay, UpgradeCard, RoleBadge, ShiftBanner, TransparencyIndicator, VisibilityToggle, IconButton, Toast
7. Vibe selector UI (commented out as "hidden for Vibeathon")
8. Font size selector UI
9. Member ColorPicker with full brand palette
10. Missing semantic CSS tokens (brand colors, shadows, transitions, radii, fonts)
11. Firefox scrollbar theming
12. Member color auto-assignment algorithm

### PARTIAL (1)
13. Vibe selector wired to setVibe (function exists, no UI)

---

## Seasonal Themes to Add (from PRD-03)

| Theme Key | Display Name | Primary | Secondary | Accent | Background | Flag |
|-----------|-------------|---------|-----------|--------|------------|------|
| fresh_spring | Fresh Spring | #b2d3c0 | #fff6d5 | #fce8e3 | #dcefe3 | seasonal |
| sunny_summer | Sunny Summer | #b99c34 | #f9c396 | #a8cfc8 | #fff6d5 | seasonal |
| cozy_autumn | Cozy Autumn | #b86432 | #c8ad9d | #b25a58 | #fde3c7 | seasonal |
| winter_wonderland | Winter Wonderland | #805a82 | #68a395 | #d4e3d9 | #c8d1d6 | seasonal |
| christmas_joy | Christmas Joy | #b25a58 | #4b7c66 | #fae49b | #f8d6d0 | holiday |
| fall_fun | Fall Fun | #b86432 | #805a82 | #b99c34 | #fde3c7 | seasonal |

---

## What Is NOT Being Built (Stubs)

- Name Packs (removed from platform per PRD-22 addendum)
- Tooltip "What's this?" link to LiLa contextual help (PRD-18 dependency)
- Floating timer bubble CSS spec (PRD-36 dependency)
- Gamification visual world themes (PRD-24A dependency)

---

## Cross-Feature Connections

- ThemeProvider is consumed by every shell and every component
- member_colors.ts already exists and is used by family member setup
- useThemePersistence already syncs to family_members.theme_preferences
- No new database migrations needed

---

## Post-Build Verification

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | All 45 themes in selector | Wired | 7 collapsible categories, all 45 themes (39 + 6 seasonal) |
| 2 | 3-segment split circle swatches + gradient response | Wired | SVG arcs (gradient OFF) / conic-gradient (gradient ON) |
| 3 | Card hover translateY(-8px) scale(1.02) | Wired | App.css .card-hover and .card-hover-lg corrected |
| 4 | Collapsible mood category sections | Wired | Active theme category auto-expanded |
| 5 | 6 seasonal themes added to tokens.ts | Wired | fresh_spring, sunny_summer, cozy_autumn, winter_wonderland, christmas_joy, fall_fun |
| 6 | 8 shared components built | Wired | LockedOverlay, UpgradeCard, RoleBadge, ShiftBanner, TransparencyIndicator, VisibilityToggle, IconButton, Toast |
| 7 | Vibe selector UI + Professional rename | Wired | 2x2 grid, nautical key displays as "Professional" |
| 8 | Font size selector UI | Wired | S/M/L/XL (small/default/large/extra-large) |
| 9 | ColorPicker + full brand palette | Wired | 8 brand + 44 member colors, grouped by hue |
| 10 | Missing semantic CSS tokens | Wired | Brand colors, transitions, radii, fonts added to ThemeProvider |
| 11 | Firefox scrollbar theming | Wired | scrollbar-color + scrollbar-width + WebKit ::-webkit-scrollbar |
| 12 | Member color auto-assignment | Wired | getNextMemberColor() in lib/member-color-assignment.ts |
| 13 | Vibe selector wired | Wired | Completed by item 7 (vibe selector UI wired to setVibe) |
