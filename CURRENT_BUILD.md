# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.

## Status: ACTIVE

## PRD: PRD-10 — Widgets, Trackers & Dashboard Layout (Phase A)

**PRD File:** `prds/personal-growth/PRD-10-Widgets-Trackers-Dashboard-Layout.md`

**Addenda Read:**
- `PRD-Audit-Readiness-Addendum.md` (universal)
- `PRD-Template-and-Audit-Updates.md` (universal)
- No PRD-10-specific addenda exist

**Feature Decision File:** `claude/feature-decisions/PRD-10-Widgets-Trackers-Dashboard-Layout.md`

---

## Phase A Scope (Founder-Approved 2026-03-25)

### Database (7 new tables + 1 update)
1. `dashboard_widgets` — widget instances on dashboards
2. `dashboard_widget_folders` — folder groupings
3. `widget_data_points` — time-series tracking data (append-only)
4. `widget_templates` — system + user-customized templates
5. `coloring_image_library` — color-reveal image catalog (table only, no seed data yet)
6. `color_reveal_progress` — per-zone reveal tracking
7. `coloring_gallery` — completed color-reveal images
8. `dashboard_configs` — add columns: `layout_mode`, `decorations`, `grid_columns`
- `widget_starter_configs` already exists (migration 100032)

### Screens (6 of 8)
1. **Dashboard Grid Layout (Screen 1)** — snap-to-grid, S/M/L, auto-arrange, long-press edit mode with wiggle, drag-to-reorder, resize handles
2. **Widget Folder Overlay (Screen 2)** — modal showing folder contents, rename, drag in/out
3. **Widget Picker (Screen 3)** — full-height modal: Your Widgets, Create New (8 categories), Info Widgets, Quick Actions
4. **Widget Configuration (Screen 4)** — adaptive form per tracker type, live preview, Deploy to Dashboard, Save as Template
5. **Special Adult Child-Widget View (Screen 6)** — shift-scoped, child's theme, celebrations fire on caregiver screen
6. **Widget Detail View (Screen 7)** — full-size rendering + history (7/14/30/all), edit, remove

### Tracker Types (6 of 17)
1. `tally` — count things (books, glasses of water, etc.)
2. `streak` — consecutive day tracking with flame counter
3. `percentage` — completion percentage (donut ring, progress bar)
4. `checklist` — daily checklist with checkboxes
5. `multi_habit_grid` — bullet-journal-style monthly habit grid
6. Star chart — `tally` type with `star_chart` visual variant

### NOT in Phase A (deferred)
- Track This flow (Screen 5) — Phase B
- Decorative Layer (Screen 8) — Post-MVP
- Remaining 11 tracker types — Phase B
- Multiplayer layer — Phase B
- Color-reveal with image library — Phase C
- Gameboard tracker — Phase C
- Linked pair deployment — Phase C
- LiLa/Notepad Track This integration — Phase C

### Stubs to Wire
- Studio [Customize] → Trackers/Widgets (PRD-09B) → opens Widget Configuration
- Timer → widget data points (PRD-36) → connect time_sessions to widget_data_points
- Hub widget content (PRD-04 Repair) → replace PlannedExpansionCard with real widgets

### New Stubs to Create
- Widget milestone → Victory Record (PRD-11)
- Widget completion → Gamification progress (PRD-24)
- Allowance Calculator → payment tracking (PRD-28)
- Widget pinning from Lists (PRD-14)

### Icon Strategy
- All Lucide icons in adult shells (Calendar, Target, TrendingUp, Coins, Trophy, Eye, Users, BookOpen)
- SVG/CSS animations for visual indicators (flames, stars)
- Platform assets for rich imagery where Lucide insufficient
- Zero emoji in Mom/Adult/Independent shells
- Emoji permitted in Play shell only

### Role Behaviors
| Role | Edit Mode | Resize | Folders | Create | Interact |
|------|-----------|--------|---------|--------|----------|
| Mom | Full | Yes | Yes | Self + any member | Full |
| Dad/Adult | Full | Yes | Yes | Self (+ kids if permitted) | Own + View As |
| Special Adult | No | No | No | No | Permitted child widgets during shift |
| Independent Teen | Full | Yes | Yes | Self | Own |
| Guided Child | Reorder only | No | No | No | Own |
| Play Child | None | No | No | No | Own (tap) |

### Grid Breakpoints
| Breakpoint | Columns | S | M | L |
|-----------|---------|---|---|---|
| Desktop (>1024px) | 4 | 1x1 | 2x1 | 2x2 |
| Tablet (768-1024px) | 3 | 1x1 | 2x1 | 3x1 |
| Mobile (<768px) | 2 | 1x1 | 2x1 (full) | 2x2 (full) |

### Edge Cases
1. Empty dashboard → pre-populated with Welcome + Best Intentions + Quick Add + Library Shortcut
2. Widget with no data → encouraging empty state at 0%
3. Widget linked to deleted task → "tasks archived" message with restore action
4. Folder with one widget → auto-unfolder
5. Shift ends mid-interaction → gentle notification, data preserved
6. 50 widget limit → warning at 40+, lazy-load below fold
7. Theme change → CSS variable swap, real-time re-render
8. Co-parent always-on → skip shift start/end

---

## Post-Build Verification Table

*(To be filled after build)*
