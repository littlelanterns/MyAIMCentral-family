# Feature Decision File: PRD-10 — Widgets, Trackers & Dashboard Layout

**PRD Source:** `prds/personal-growth/PRD-10-Widgets-Trackers-Dashboard-Layout.md`
**Addenda Read:**
- `PRD-Audit-Readiness-Addendum.md` (universal)
- `PRD-Template-and-Audit-Updates.md` (universal)
- No PRD-10-specific addenda exist

**Created:** 2026-03-25
**Status:** Pre-build — awaiting founder approval

---

## Scope Summary

PRD-10 defines THREE interconnected systems:
1. **Dashboard Grid Layout** — snap-to-grid widget placement with auto-arrange, drag-to-reorder, folders, edit mode (wiggle + resize), responsive breakpoints
2. **Widget Template Library** — 17 tracker types, 75+ visual variants, 95+ starter configs, multiplayer layer, color-reveal, gameboard
3. **Track This** — quick-creation pipeline from idea to deployed widget in 3-4 taps

---

## Screens (8 total)

| # | Screen | Description |
|---|--------|-------------|
| 1 | Dashboard Grid Layout | Snap-to-grid, S/M/L sizing, auto-arrange default, long-press edit mode with wiggle |
| 2 | Widget Folder Overlay | Modal showing folder contents, drag in/out, rename |
| 3 | Widget Picker | Full-height modal: Your Widgets, Create New (8 categories), Info Widgets, Quick Actions |
| 4 | Widget Configuration | Adaptive form per tracker type, live preview, multiplayer section, Save as Template |
| 5 | Track This | Streamlined 4-step flow: What → Pick visualization → Quick config → Deploy |
| 6 | Special Adult Child-Widget View | Shift-scoped, child's theme, celebrations fire on caregiver screen |
| 7 | Widget Detail View | Full-size rendering + history (7/14/30/all), edit, remove |
| 8 | Decorative Layer (Cozy Journal) | POST-MVP — stickers, washi tape, thumbtacks, paper textures |

---

## Database Tables Needed

### New Tables (6)
| Table | Purpose | Exists? |
|-------|---------|---------|
| `dashboard_widgets` | Widget instances on dashboards | No |
| `dashboard_widget_folders` | Folder groupings | No |
| `widget_data_points` | Time-series tracking data (append-only) | No |
| `widget_templates` | System + user-customized templates | No |
| `coloring_image_library` | Color-reveal image catalog | No |
| `color_reveal_progress` | Per-zone reveal tracking | No |
| `coloring_gallery` | Completed color-reveal images | No |

### Existing Tables
| Table | Status | Notes |
|-------|--------|-------|
| `widget_starter_configs` | EXISTS (migration 100032) | 10 seed configs already in DB |
| `dashboard_configs` | EXISTS | Needs columns: `layout_mode`, `decorations`, `grid_columns` |

---

## 17 Tracker Types (Data Engines)

1. tally
2. boolean_checkin
3. streak
4. multi_habit_grid
5. checklist
6. percentage
7. sequential_path
8. achievement_badge
9. xp_level
10. allowance_calculator
11. leaderboard
12. mood_rating
13. countdown
14. timer_duration
15. snapshot_comparison
16. color_reveal
17. gameboard

---

## Cross-Feature Connections

### Incoming
| Source | What |
|--------|------|
| PRD-09A Task completions | Auto-create widget data points for linked widgets |
| PRD-09B Studio | [Customize] → Trackers/Widgets opens Widget Configuration |
| PRD-06 Best Intentions | Iterations can trigger linked widget progress |
| PRD-08 Notepad | "Send to → Track This" routing destination |
| PRD-05 LiLa | "Track This" action chip |
| PRD-02 Special Adult shifts | Load child's widgets for caregiver view |
| PRD-03 Themes | Widget re-render on theme change |

### Outgoing
| Destination | What |
|-------------|------|
| PRD-11 Victory | Widget milestones → victory records (STUB) |
| PRD-24 Gamification | Widget completions → gamification progress (STUB) |
| PRD-28 Allowance | Completion % → allowance calculations (STUB) |
| PRD-05 LiLa | Widget data in AI context (is_included_in_ai) |

---

## Stubs to Wire (from existing registry)

| Stub | From | Notes |
|------|------|-------|
| Dashboard widget containers | PRD-06 | Marked "Wired" but needs real widget components |
| Hub widget content | PRD-04 Repair | Replace PlannedExpansionCard with real widgets |
| Timer → widget data points | PRD-36 | Connect timer sessions to widget_data_points |
| Studio [Customize] → Trackers/Widgets | PRD-09B | Replace PlannedExpansionCard with Widget Config flow |

---

## New Stubs Created by This PRD

| Stub | Wires To |
|------|----------|
| Widget milestone → Victory Record | PRD-11 |
| Widget completion → Gamification progress | PRD-24 |
| Allowance Calculator → payment tracking | PRD-28 |
| Widget pinning from Lists | PRD-14 |
| Decorative layer (Cozy Journal) | Post-MVP |

---

## Role Permissions Matrix

| Role | Edit Mode | Resize | Folders | Create | Interact | Decorations |
|------|-----------|--------|---------|--------|----------|-------------|
| Mom | Full | Yes | Yes | For self + any member | Full | Yes (vibe) |
| Dad/Adult | Full | Yes | Yes | Self (+ kids if permitted) | Own + View As | Yes |
| Special Adult | No | No | No | No | Permitted child widgets during shift | No |
| Independent Teen | Full | Yes | Yes | Self | Own | Yes |
| Guided Child | Reorder only | No | No | No | Own | No |
| Play Child | None | No | No | No | Own (tap) | No |

---

## Key Edge Cases

1. **Empty dashboard** — pre-populated with Welcome, Best Intentions, Quick Add, Library Shortcut widgets
2. **Widget with no data** — encouraging empty state, 0% visualization
3. **Widget linked to deleted task** — show "tasks archived" message with restore action
4. **Folder with one widget** — auto-unfolder
5. **Shift ends mid-interaction** — gentle notification, data preserved
6. **50 widget limit** — warning at 40+, lazy-load below fold
7. **Theme change** — CSS variable swap, real-time re-render
8. **Co-parent always-on** — skip shift start/end, immediate widget access

---

## Icon Strategy (Founder Preference: No Emoji)

Per founder direction and Convention #18 (Lucide icons only in adult shells):
- **All widget category icons**: Lucide icons (Calendar, Target, TrendingUp, Coins, Trophy, Eye, Users, BookOpen)
- **Visual indicators** (streak flame, stars, etc.): SVG/CSS animations consuming theme tokens
- **Platform assets**: Use embedded images from `platform_assets` table where Lucide doesn't capture the visual
- **Play shell only**: Emoji permitted per convention

---

## Phasing Recommendation

Given the massive scope (17 tracker types, 75+ visual variants, 8 screens, multiplayer, color-reveal, gameboard), this should be built in sub-phases:

### Phase A: Grid Layout + Core Infrastructure ✅ APPROVED
- Dashboard grid (Screen 1) with S/M/L sizing, auto-arrange, edit mode
- All 7 database tables + dashboard_configs updates
- Widget folders (Screen 2)
- Widget Picker (Screen 3) — browsing only
- Widget Configuration (Screen 4) — common fields
- 6 core tracker types: tally, streak, percentage, checklist, multi_habit_grid, star_chart (tally/star_chart variant)
- Widget Detail View (Screen 7)
- Special Adult shift view (Screen 6) with child theme rendering
- Studio [Customize] wiring for trackers

### Phase B: Full Tracker Type Library
- Remaining 12 tracker types
- All 75+ visual variants for built types
- Track This flow (Screen 5) from QuickTasks
- Timer → widget data points integration
- Multiplayer layer (enable, participants, modes, visual styles)

### Phase C: Advanced Features
- Color-Reveal tracker with image library + gallery
- Gameboard tracker with path rendering + special spaces
- Linked pair deployment
- Family/personal view toggle
- LiLa Track This action chip + Notepad routing

### Post-MVP
- Decorative layer (Screen 8) for Cozy Journal vibe
- Seasonal decoration packs

---

## Post-Build Verification Table

*(To be filled after build)*

---

*End of feature decision file*
