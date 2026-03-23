# MyAIM Family: Widget Template Catalog v3 (Final)
## Tracker Types → Visual Variants → Starter Configurations
## + Multiplayer Layer + Color-Reveal + Gameboard + Family Collaboration Widgets

**Purpose:** Master catalog of the Widget Template Library. Organized by the three-level architecture (Tracker Type → Visual Variant → Starter Configuration) plus the cross-cutting Multiplayer Layer and the Info/Quick Action widget categories.

**Architecture recap:**
```
Tracker Type (data behavior — how it stores and calculates)
  └─ Visual Variant (rendering pattern — how it looks)
       └─ Starter Configuration (pre-filled example in Studio)

Multiplayer Layer (cross-cutting — rendering option on any numeric tracker type)
  └─ Mode: Collaborative / Competitive / Both
  └─ Visual Style: Colored Bars / Segments / Markers / Stars / Game Pieces
  └─ View Toggle: Family View / Personal View
```

**Browsing paths:**
- **Studio browse:** Starter Configurations organized by life-area category → tap [Customize] → Widget Configuration
- **Build from scratch:** Tracker Types as cards → pick visual variant → configure → deploy
- **Track This shortcut:** Quick entry → auto-suggested template → simplified configure → deploy

---

## PART 1: TRACKER TYPES (Data Behavior Engines)

These define *how data is stored, calculated, and what configuration fields are available*. Each is a distinct data engine. Visual rendering is separate.

---

### Type 1: Tally / Accumulator
**What it does:** Counts occurrences or accumulates a numeric value toward an optional goal. Each entry adds to the running total.
**Configuration:** Title, unit (glasses, minutes, pages, successes, dollars, etc.), goal (optional), reset period (daily / weekly / monthly / never), assigned to, multiplayer toggle.
**Data:** Each entry is a numeric value + timestamp. Supports "+1" quick-tap and custom amount entry.
**Multiplayer compatible:** Yes — individual tallies aggregate into shared pool or compare side-by-side.

### Type 2: Boolean Check-In
**What it does:** Yes/no daily check-in. Did you do the thing today? Binary per day.
**Configuration:** Title, check-in frequency (daily / specific days), assigned to, multiplayer toggle.
**Data:** One boolean per day per check-in item.
**Multiplayer compatible:** Yes — shows each participant's check-in status.

### Type 3: Streak
**What it does:** Tracks consecutive completions. Breaks on a missed day/period. Stores current streak + longest streak + streak history.
**Configuration:** Title, streak source (linked tasks, linked check-in, manual), what counts as "complete" (any task, all tasks, specific percentage), grace period (0 or 1 day, mom configures), assigned to, multiplayer toggle.
**Data:** Current streak count, longest streak, last completed date, streak history array.
**Multiplayer compatible:** Yes — shows each participant's streak side-by-side.

### Type 4: Multi-Habit Grid
**What it does:** Tracks multiple boolean habits across a week (or custom period). Each habit is a row, each day is a column. Cell = done/not done.
**Configuration:** Title, habit names (ordered list), tracked days (default M–S), assigned to, multiplayer toggle.
**Data:** Per-habit, per-day boolean matrix.
**Multiplayer compatible:** Yes — each participant's grid shown in their member color, or overlaid on shared grid.

### Type 5: Checklist
**What it does:** Ordered list of items to check off. Can be daily-resetting (routine) or one-time (project steps). Checked items show strikethrough.
**Configuration:** Title, items (ordered list), reset frequency (daily / weekly / one-time / never), assigned to, link to task source (optional).
**Data:** Per-item completion status + completion timestamp.
**Multiplayer compatible:** Limited — works as individual view with family comparison on completion percentage.

### Type 6: Percentage / Completion
**What it does:** Calculates and displays a completion percentage from a data source. Can auto-calculate from linked tasks or accept manual percentage entries.
**Configuration:** Title, calculation source (linked tasks, linked routines, manual entry), goal percentage (optional, default 100%), assigned to, multiplayer toggle.
**Data:** Calculated or entered percentage per period.
**Multiplayer compatible:** Yes — each participant's percentage shown as colored segments or bars.

### Type 7: Sequential Path
**What it does:** Ordered steps that unlock in sequence. Step N+1 unlocks when Step N is complete. Each step can have a label, description, and completion condition.
**Configuration:** Title, steps (ordered list with labels and optional descriptions), completion condition per step (manual check, linked task, time-based), prize/reward at end (optional), assigned to, multiplayer toggle.
**Data:** Per-step completion status + completion date. Current step pointer.
**Multiplayer compatible:** Yes — each participant shown as a colored marker at their current position on the shared path.

### Type 8: Achievement / Badge Collection
**What it does:** Defines unlockable badges/achievements with criteria. Displays earned vs. locked. Criteria can be automatic (reach streak of 7) or manual (mom awards).
**Configuration:** Title, badge definitions (name, icon/image, unlock criteria, description), assigned to.
**Data:** Per-badge: locked/unlocked status + unlock date.
**Multiplayer compatible:** Limited — shared badge wall showing which members have earned which badges.

### Type 9: XP / Level
**What it does:** Awards experience points for actions. Points accumulate toward level thresholds. Level number increases at thresholds.
**Configuration:** Title, XP sources (linked tasks with point values, manual awards), level thresholds (configurable or auto-calculated), assigned to, multiplayer toggle.
**Data:** Total XP, current level, XP toward next level, XP history.
**Multiplayer compatible:** Yes — each participant's level and XP shown in their member color.

### Type 10: Allowance Calculator
**What it does:** Calculates earned allowance from task completion. Three structural approaches (Fixed Grid, Dynamic Pool, Points-Weighted). Shows tasks completed, percentage, base amount × percentage = earned. This is a real-money system, entirely separate from gamification points.
**Configuration:** Title, base amount, calculation approach (fixed/dynamic/weighted), linked tasks with optional point values and categories, pay period (weekly/biweekly/monthly), assigned to.
**Data:** Per-period: tasks completed, total possible, percentage, calculated amount.
**Multiplayer compatible:** No — allowance is always individual per child. (Mom can see all children's allowance data in Mom's Overview.)

### Type 11: Leaderboard / Ranking
**What it does:** Ranks multiple family members on a single metric. Updates in real time. Crown on #1. Inherently multiplayer — this type exists only in multi-member mode.
**Configuration:** Title, participating members, ranked metric (completion %, total tasks, streak length, XP, etc.), time period, display format.
**Data:** Per-member: current value, rank, trend (up/down/same).
**Multiplayer compatible:** Always multiplayer (it IS multiplayer).
**Important:** Must be opt-in and explicitly enabled by mom. Never default. Never shown to Play-mode children.

### Type 12: Mood / Rating Scale
**What it does:** Daily (or configurable frequency) check-in on a scale. Can be emoji-based (5 faces), numeric (1–10), or custom labels. Tracks trends over time.
**Configuration:** Title, scale type (emoji 5-point, numeric 1–5, numeric 1–10, custom labels, weather metaphor), check-in frequency, assigned to.
**Data:** Per-entry: scale value + timestamp + optional note.
**Multiplayer compatible:** Limited — family mood board showing everyone's mood today (collaborative visibility only, never competitive).

### Type 13: Countdown
**What it does:** Counts days (or hours) until a target date. Progress bar drains as the date approaches. Can trigger a celebration or event on arrival.
**Configuration:** Title, target date, what happens at zero (celebration, unlock reward, display message), assigned to.
**Data:** Target date, current days remaining. No historical data — single live value.
**Multiplayer compatible:** No — countdowns are shared by nature (same date for everyone). Displays on family hub automatically.

### Type 14: Timer / Duration Logger
**What it does:** Logs time spent on an activity. Can be manual entry ("I practiced 30 minutes") or integrated timer (start/stop). Accumulates toward optional goal.
**Configuration:** Title, unit (minutes/hours), goal per period (optional), period (daily/weekly/monthly), timer mode (manual entry / start-stop / both), assigned to, multiplayer toggle.
**Data:** Per-entry: duration value + timestamp + optional activity label. Aggregated totals per period.
**Multiplayer compatible:** Yes — individual durations aggregate into shared pool or compare side-by-side.

### Type 15: Snapshot / Comparison
**What it does:** Captures periodic snapshots of a metric for before/after comparison. Shows starting value, current value, and growth/change.
**Configuration:** Title, metric name, unit, snapshot frequency (weekly/monthly/quarterly), assigned to.
**Data:** Per-snapshot: value + date. Calculates delta and percentage change.
**Multiplayer compatible:** Limited — family comparison showing each member's growth trajectory.

### Type 16: Color-Reveal
**What it does:** Child starts with a grayscale image from a curated library. As achievements are completed, color zones progressively reveal. When fully revealed, the completed image is saved to the Achievement Gallery and can be downloaded/printed.
**Configuration:** Title, image selection (from curated library — large catalog), total achievements needed (5–100+), reveal strategy (automatic / gradual light-to-dark / random), achievement source (linked tasks, linked tracker, manual), assigned to.
**Data:** Image ID, total achievements needed, achievements completed, reveal steps generated (JSONB mapping steps to color zones with gradient splitting for counts > zones), per-step reveal timestamp.
**Special behavior:** Dynamic color splitting — if achievements > color zones, system splits colors into gradient families (lightest → light → medium → dark). Completion triggers gallery save + celebration.
**Multiplayer compatible:** Yes (collaborative) — each member's achievements contribute to revealing the shared image. Each revealed zone can show which member's achievement unlocked it.

### Type 17: Gameboard
**What it does:** Board-game-style path where a character/game piece moves forward with each task completed or point earned. Spaces can have special events (bonus, shortcut, celebration, mystery). Highly visual and narrative.
**Configuration:** Title, total spaces, board theme (styled by active Visual World — space route, garden path, castle road, ocean voyage, etc.), what moves the piece forward (task completions, points earned, percentage complete, manual advance), special space frequency and types, prize at end (optional), assigned to, multiplayer toggle.
**Data:** Current position, spaces visited, special spaces triggered, completion status.
**Multiplayer compatible:** Yes — each participant has a game piece in their member color (and optionally a distinct shape) moving along the shared board. Family race or collaborative journey where everyone needs to reach the end.

### Type 18: Info Display
**What it does:** Pulls and displays data from another feature. No tracking of its own — pure read-only visualization.
**Configuration:** Data source, display format, refresh frequency.
**Data:** None of its own. Reads from source feature.
**Multiplayer compatible:** N/A — displays whatever the source provides.

### Type 19: Quick Action
**What it does:** Single-tap shortcut button. No data, no tracking — just a fast link to a feature or action.
**Configuration:** Action target, icon, label.
**Data:** None.
**Multiplayer compatible:** N/A.

---

## PART 2: THE MULTIPLAYER LAYER (Cross-Cutting Configuration)

The Multiplayer Layer is not a tracker type — it is a rendering option available on any tracker type marked "Multiplayer compatible: Yes" above. When enabled, the widget shows data for multiple family members within the same widget, with each member's data rendered in their assigned member color.

### Member Color System

Every family member is assigned a member color — a theme token that resolves to a specific color value based on the active theme. Colors are consistent across every widget, every view, and every context.

**Palette architecture:**
- **Member colors draw from the existing PRD-03 brand palette** (44+ colors across 9 families: Sage/Teal, Gold/Honey, Blush/Rose, Cream/Neutral, Earth/Brown, Blue/Storm, Green/Forest, Purple/Mauve, Peach/Coral). All palette colors are already designed for cross-theme compatibility.
- **No hard cap on members.** The `family_members.assigned_color_token` column is a TEXT field referencing a palette color, not an enum. With 44+ palette colors, even the largest families have plenty of visually distinct options.
- **Shape modifiers on game pieces** — each member also has an optional `game_piece_shape` (circle, star, diamond, heart, hexagon, triangle, square, octagon, plus, crescent). Shape provides additional distinctness and accessibility for color-blind family members.
- Mom assigns colors during family setup from the palette. Members can request a color change; mom approves. Changes propagate to all widgets automatically via token resolution.

### Three Multiplayer Modes

| Mode | Behavior | Default For | Best For |
|------|----------|-------------|----------|
| **Collaborative** | Individual contributions pool toward a shared target. Widget shows combined total prominently + colored breakdown of who contributed what. | Play-mode children (always collaborative, never competitive) | Young children, mixed-age families, goals where ability varies widely |
| **Competitive** | Each participant works toward the same individual target. Progress shown side-by-side in member colors. | Never default — always opt-in | Older kids/teens motivated by friendly competition, similar-ability participants |
| **Both** | Shared pool target + individual contributions visible and comparable. Everyone wins together; individual effort recognized. | Recommended default when mom enables multiplayer without choosing | Most families with mixed-age children |

### Multiplayer Visual Styles

Available visual styles depend on the widget's base visual variant, but the core multi-member rendering patterns are:

| Style | Description | Works Best With |
|-------|-------------|----------------|
| **Colored Bars (side-by-side)** | Each member's value as a bar in their color, grouped for comparison. | Tally, streak, percentage, timer |
| **Colored Bars (stacked)** | Bars stacked to show individual contribution + combined total simultaneously. | Tally (collaborative), timer |
| **Colored Segments (pie/donut)** | Each member's contribution as a colored slice of a shared circle. | Donut ring, coin jar, savings goals |
| **Colored Markers on Shared Track** | Each member as a colored dot/piece on a shared progress path. | Sequential path, gameboard, mastery path |
| **Colored Stars / Tiles** | Each member's stars or tiles shown in their color on a shared grid. Creates a mosaic effect. | Star chart, habit grid, multi-habit grid |
| **Game Pieces** | Each member as a colored game piece (color + optional shape) on a board. | Gameboard, sequential path, race track |

### Family View / Personal View Toggle

Multiplayer widgets support two views:

- **Family View:** Shows all participants' data. Default on Family Hub / Shared Dashboard / Tablet Hub.
- **Personal View (My View):** Shows only the current member's data within the shared context (e.g., "I've contributed 23 of our family's 67 books"). Default on personal dashboards.

**Deployment options (mom chooses):**
- **Linked Pair:** One widget instance, auto-deployed to both the family hub (family view) AND each participant's personal dashboard (personal view). Both views read from the same data. Toggle available on either view to switch.
- **Standalone:** Widget deployed to one location only (family hub OR a personal dashboard). Toggle still available but only shows the view for wherever it's deployed.

### Multiplayer Configuration Fields

When mom enables multiplayer on any widget, the Widget Configuration screen (PRD-10, Screen 4) shows a collapsible "Multiplayer" section:

1. **Enable Multiplayer** — toggle
2. **Participants** — multi-select of family members (shown as avatars with member colors)
3. **Mode** — Collaborative / Competitive / Both (with descriptions, "Recommended" label on Both)
4. **Visual Style** — thumbnail picker of available multi-member rendering styles for this widget type
5. **Shared Target** (collaborative/both modes) — combined goal number. System suggests default based on participants × individual target.
6. **Privacy** — "All see each other's values" (default) / "See only own + combined total" / "Only mom sees breakdown"
7. **Deploy As** — Linked Pair (family hub + personal dashboards) / Standalone
8. **Preview** — live preview with sample data in member colors

### Age-Appropriate Defaults

- **Play mode (ages ~3–7):** Always sees collaborative view only. No individual comparison shown. Sees combined total + their own contribution highlighted.
- **Guided mode (ages ~7–12):** Sees "Both" mode by default. Individual contributions visible but framed as "everyone helped." Mom can enable pure competitive if she chooses.
- **Independent mode (ages 13+):** All modes available. Competitive mode selectable.
- **Adults:** All modes available.

---

## PART 3: VISUAL VARIANTS PER TRACKER TYPE

Each tracker type supports multiple visual renderings. Users pick their preferred look during configuration. The data behavior is identical across variants of the same type.

### Tally / Accumulator — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 1a | **Progress Bar** | Horizontal bar filling left-to-right. Percentage label. | S, M | **[M] #1** |
| 1b | **Donut Ring** | Circular ring filling clockwise. Center shows count or %. Single or multi-ring. | S, M | **[M] #2** |
| 1c | **Star Chart** | Grid of stars filling in. Total count at top. Configurable stars per row. | S, M | **[M] #3** |
| 1d | **Animated Star Chart** | Same as Star Chart but with emotionally optimized animation: tap → confetti fires → star generates and flies into grid → settles with bounce + sparkle. The animation IS the feature. Designed for young children in Play/Guided modes. | S, M | Manuscript §9 |
| 1e | **Thermometer** | Vertical tube filling from bottom. Star/goal marker at top. | S, M | **[M] #6** |
| 1f | **Coin Jar** | Glass jar filling with animated coins. Dollar/point amount display. | S, M | **[M] #7** |
| 1g | **Bar Chart + History** | Primary: large number + unit + bar toward goal. Toggle: bar chart over time. | M, L | **[M] #21** |
| 1h | **Bubble Fill** | Container filling with colored bubbles/circles. Playful, organic. | S, M | **[N]** |
| 1i | **Tally Marks** | Classic hand-drawn tally marks (||||  ̶). Groups of 5. Cozy Journal vibe. | S, M | **[N]** |
| 1j | **Pixel Art Grid** | Grid of pixels filling in as count increases. Fun for kids. | S, M | **[N]** |
| 1k | **Garden / Plant Growth** | Plant growing: seed → sprout → bud → bloom → full garden. | S, M | **[N]** |
| 1l | **Fuel Gauge** | Car-style gauge filling E to F. Satisfying needle movement. | S, M | **[N]** |

### Boolean Check-In — Visual Variants

| # | Variant Name | Visual Description | Best Sizes |
|---|-------------|-------------------|-----------|
| 2a | **Simple Toggle** | Large checkbox or switch. Today's status. | S |
| 2b | **Calendar Dots** | Month view with colored dots on completed days. | M, L |
| 2c | **Stamp Card** | Coffee-shop punch card — circles stamped each day. | S, M |
| 2d | **Heatmap** | GitHub-style intensity grid over weeks/months. | M, L |

### Streak — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 3a | **Flame Counter** | Fire icon + large bold number + "days." Flame grows with longer streaks. | S, M | **[M] #4** |
| 3b | **Chain Links** | Visual chain growing link by link. Break = chain breaks. | S, M | **[N]** |
| 3c | **Mountain Climb** | Climber ascending. Each day = higher altitude. Peak = personal best. | M | **[N]** |
| 3d | **Streak Calendar** | Mini calendar with highlighted consecutive days. | M | **[N]** |
| 3e | **Growing Tree** | Tree grows taller/fuller. Loses leaves on break. Recovers on restart. | S, M | **[N]** |

### Multi-Habit Grid — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 4a | **Classic Grid** | Rows = habits, columns = days. Filled squares. | M, L | **[M] #5** |
| 4b | **Color-Coded Grid** | Each habit has its own color. Creates mosaic over time. | M, L | **[N]** |
| 4c | **Icon Grid** | Cells show small icons per habit when completed. | M, L | **[N]** |
| 4d | **Sticker Board** | Completed days get stickers. Stickers vary by habit. Kid-friendly. | M, L | **[N]** |

### Checklist — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 5a | **Standard Checklist** | Checkboxes + strikethrough. Counter at top (3/5). | S, M | **[M] #10** |
| 5b | **Card Stack** | Mini cards that flip/slide away on completion. | M | **[N]** |
| 5c | **Scroll Unfurl** | Parchment scroll unfurling as items complete. | M | **[N]** |

### Percentage / Completion — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 6a | **Donut Ring** | Same component as 1b, fed by percentage. | S, M | **[M] #2** |
| 6b | **Responsibility Gauge** | Speedometer: red/yellow/green zones, needle. | S, M | **[M] #13** |
| 6c | **Battery** | Phone-battery fill. Green/yellow/red by level. | S | **[N]** |
| 6d | **Pie Chart** | Standard pie for distribution across categories. | S, M | **[N]** |
| 6e | **Multi-Bar Comparison** | Multiple horizontal bars side by side. | M, L | **[N]** |

### Sequential Path — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 7a | **Winding Path** | Curved path, numbered nodes, checkmarks/locks, star at end. | M, L | **[M] #20** |
| 7b | **Mastery Path** | Similar with branching possibility, stars at milestones. | M, L | **[M] #14** |
| 7c | **Staircase** | Steps ascending. Current step highlighted. Prize at top. | M | **[N]** |
| 7d | **Game Board** | Board-game spaces, current position marked. Special spaces. | M, L | **[N]** |
| 7e | **Skill Tree** | Branching tree. User chooses paths. Filled/dimmed branches. | L | **[N]** |
| 7f | **Map Journey** | Treasure-map path across landscape. Landmarks at milestones. | L | **[N]** |

### Achievement / Badge Collection — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 8a | **Badge Wall** | Grid of circular badges. Earned = color. Locked = grey + lock. | M, L | **[M] #9** |
| 8b | **Trophy Shelf** | 3D-feel shelf. Trophies/objects for earned. Empty slots. | M, L | **[N]** |
| 8c | **Sticker Album** | Album page with sticker outlines. Earned placed; missing dotted. | M, L | **[N]** |
| 8d | **Medal Ribbon** | Medals hanging on ribbon display. | M | **[N]** |

### XP / Level — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 9a | **Shield + Bar** | Shield/crest with level number. XP bar below. Total XP. | S, M | **[M] #8** |
| 9b | **Character Level-Up** | Avatar changing appearance at each level. Bar to next. | M | **[N]** |
| 9c | **Rank Badge** | Scout/military rank insignia upgrading at each level. | S | **[N]** |

### Allowance Calculator — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 10a | **Summary Card** | Tasks / total, %, base × % = earned. All-in-one. | M | **[M] #11** |
| 10b | **Fixed Task Grid** | Weekly grid: task rows × day columns, bottom total. | L | **[M] Approach A** |
| 10c | **Dynamic Category Rings** | Category donuts with counts. Total below. | L | **[M] Approach B** |
| 10d | **Points List** | Weighted tasks with point badges. Total earned. | L | **[M] Approach C** |

### Leaderboard / Ranking — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 11a | **Classic Leaderboard** | Numbered list, scores, crown on #1. Member colors. | S, M | **[M] #16** |
| 11b | **Podium** | 1st/2nd/3rd podium with avatars. Rest listed below. | M | **[N]** |
| 11c | **Race Track** | Members as dots on track. Further = higher score. | M, L | **[N]** |

### Mood / Rating Scale — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 12a | **Emoji Row + Trend** | 5 emoji faces to tap. Mini line chart below. | S, M | **[M] #17** |
| 12b | **Color Gradient** | Slider on gradient (red → green). Color dots over time. | M | **[N]** |
| 12c | **Weather Metaphor** | Stormy → sunny → radiant. Kid-friendly. | S, M | **[N]** |
| 12d | **Number Scale** | 1–10 with tap input. Clean, no metaphor. | S | **[N]** |

### Countdown — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 13a | **Big Number** | Large number + "days until" + draining progress bar. | S, M | **[M] #12** |
| 13b | **Calendar Tearaway** | Calendar pages tearing off day by day. | S, M | **[N]** |
| 13c | **Advent Calendar** | Grid of doors opening as days pass. Final door = event. | M, L | **[N]** |

### Timer / Duration Logger — Visual Variants

| # | Variant Name | Visual Description | Best Sizes |
|---|-------------|-------------------|-----------|
| 14a | **Stopwatch + Bar** | Stopwatch display + progress bar toward goal. | S, M |
| 14b | **Clock Fill** | Analog clock face filling as time logged. | S, M |
| 14c | **Time Bar Chart** | Daily bars + goal line. Shows weekly pattern. | M, L |

### Snapshot / Comparison — Visual Variants

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| 15a | **Before/After Card** | Two columns: start vs. current. Growth arrow + %. | M | **[N]** |
| 15b | **Trend Line** | Line graph over time. Start and current highlighted. | M, L | **[N]** |
| 15c | **Record Board** | Personal bests: Best Week, Longest Streak, Most Tasks. | S, M | **[M] #15** |

### Color-Reveal — Visual Variants

| # | Variant Name | Visual Description | Best Sizes |
|---|-------------|-------------------|-----------|
| 16a | **Standard Reveal** | Grayscale image with color zones revealing progressively. Soft glow on newly revealed area. | M, L |
| 16b | **Mosaic Reveal** | Image divided into tile-like sections that reveal in mosaic pattern. | M, L |
| 16c | **Spotlight Reveal** | Color "spotlight" expands outward from center of each new zone. | M, L |

### Gameboard — Visual Variants

| # | Variant Name | Visual Description | Best Sizes |
|---|-------------|-------------------|-----------|
| 17a | **Road Trip** | Winding road across a landscape. Car/character game piece. Themed by Visual World. | M, L |
| 17b | **Space Route** | Path between planets/stars. Rocket game piece. | M, L |
| 17c | **Garden Path** | Meandering garden path with flower landmarks. | M, L |
| 17d | **Castle Quest** | Path to a castle through forest and village. Medieval feel. | M, L |
| 17e | **Ocean Voyage** | Sailing route between islands. Ship game piece. | M, L |
| 17f | **Custom Path** | Mom defines the path aesthetic + milestone labels. | M, L |

### Celebration / Summary — Visual Variants

(These are display-only templates that render data from other sources)

| # | Variant Name | Visual Description | Best Sizes | Mockup Ref |
|---|-------------|-------------------|-----------|-----------|
| S-1 | **Weekly Celebration Card** | "You Did It!" + confetti. Tasks, streak, earnings. | S, M | **[M] #18** |
| S-2 | **Custom Reward Reveal** | Image + lock that unlocks when goal met. Progress below. | M, L | **[M] #19** |
| S-3 | **Victory Wall** | Scrollable feed of recent victories. | M, L | **[N]** |
| S-4 | **Milestone Timeline** | Horizontal timeline of major milestones with dates. | M, L | **[N]** |

---

## PART 4: INFO DISPLAY WIDGETS

Read-only widgets that pull data from other features. No tracking of their own.

### Core Info Displays

| # | Name | Data Source | Best Sizes |
|---|------|-----------|-----------|
| I-1 | **Best Intentions Summary** | PRD-06 — Active intentions + iteration counts. Tap-to-celebrate. | S, M |
| I-2 | **Guiding Stars Reminder** | PRD-06 — Rotating display of active stars. | S |
| I-3 | **Family Overview** | Family data — All members: avatar, today's %, streak. | M, L |
| I-4 | **Week at a Glance** | Calendar — Family week, color-coded by member. | M, L |
| I-5 | **Upcoming Events** | Calendar — Next 3–5 events. | S, M |
| I-6 | **Today's Schedule** | Tasks + Calendar — Chronological personal agenda. | M, L |
| I-7 | **Recent Archive Updates** | Archives — Latest context items. | S, M |
| I-8 | **Meal Plan This Week** | Meal planner — 7-day grid. | M, L |
| I-9 | **Grocery List Quick View** | Lists (PRD-09B) — Active list count + preview. | S, M |
| I-10 | **Packing List Progress** | Lists (PRD-09B) — Completion bar. | S, M |
| I-11 | **Family Task Board** | Tasks (PRD-09A) — Who has what today, all members. | L |
| I-12 | **Birthdays Coming Up** | Calendar/People — Upcoming 30 days. | S |
| I-13 | **Quote of the Day** | System/curated — Rotating quote, configurable source. | S |
| I-14 | **Self-Knowledge Snapshot** | PRD-07 — Rotating InnerWorkings insight. | S, M |
| I-15 | **Family Announcement Board** | Manual — Mom posts message visible to all dashboards. | M |

### Gamification Info Displays (Stubs for PRD-24)

| # | Name | Data Source | Best Sizes | Notes |
|---|------|-----------|-----------|-------|
| I-16 | **Visual World Progress** | PRD-24 — Current theme state + progress to next unlock. | M, L | Shows garden/dragon lair/etc. |
| I-17 | **Overlay Collection Display** | PRD-24 — Current overlay state (ingredients, creatures, etc.). | M, L | Theme-aware rendering |
| I-18 | **Rewards Menu / Points Balance** | PRD-24 — Points balance + available rewards + "Request Reward" button. | M, L | Child-facing |
| I-19 | **Coloring Gallery** | PRD-24 — Completed color-reveal images. Scrollable, downloadable. | M, L | Achievement gallery |
| I-20 | **Progress Dashboard** | Aggregated — Total tasks, streaks, completion rate, points, badges. | M, L | Analytics overview |

### Family Collaboration Info Displays (Stubs for PRD-24)

| # | Name | Data Source | Best Sizes | Notes |
|---|------|-----------|-----------|-------|
| I-21 | **Family Quest Progress** | PRD-24 — Shared quest progress (collection counter, boss health bar, milestone path). | M, L | Lives on Family Hub |
| I-22 | **Family Milestone Board** | PRD-24 — Recent family wins, quest completions, achievements. Scrollable. | M, L | Celebration wall |
| I-23 | **Family Cheer** | PRD-24 — Recent cheers received. Tap to send a cheer. | S, M | Lightweight encouragement |
| I-24 | **Family Season** | PRD-24 — Current season theme, shared progress, days remaining. | M, L | Periodic themed events |
| I-25 | **Family Crest** | Family Settings — Family emblem/crest. Decorative + identity. | S, M | Configurated in settings |

---

## PART 5: QUICK ACTION WIDGETS

Single-tap shortcuts. No data, no tracking.

| # | Name | Action | Size |
|---|------|--------|------|
| Q-1 | **Quick Add Task** | Opens task creation | S |
| Q-2 | **Quick Mind Sweep** | Opens Smart Notepad | S |
| Q-3 | **Quick Add Intention** | Opens Best Intention creation | S |
| Q-4 | **Track This** | Opens Track This flow | S |
| Q-5 | **LiLa Quick Chat** | Mini chat input to LiLa | M |
| Q-6 | **Quick Log Activity** | Opens activity log (caregivers) | S |
| Q-7 | **Quick Family Cheer** | Opens cheer sending UI | S |

---

## PART 6: STARTER CONFIGURATION LIBRARY

Pre-built "just customize and deploy" configurations in Studio. Organized by life area. Each entry shows the tracker type, default visual variant, and key pre-filled fields.

### 🏠 Daily Life & Routines
| Starter Config | Type | Default Visual | Pre-filled |
|---------------|------|---------------|------------|
| Morning Routine | Checklist | Standard Checklist | Brush teeth, Make bed, Get dressed, Breakfast |
| Bedtime Routine | Checklist | Standard Checklist | Brush teeth, Bath, PJs, Story, Lights out |
| After School Routine | Checklist | Standard Checklist | Homework, Snack, Chores, Free time |
| Daily Chores | Multi-Habit Grid | Classic Grid | Make bed, Tidy room, Set table, Help cook |
| Weekly Chores | Multi-Habit Grid | Classic Grid | Vacuum, Laundry, Bathroom, Yard |
| Morning Routine Streak | Streak | Flame Counter | Source: morning checklist |
| Self-Care Daily | Checklist | Standard Checklist | Vitamins, Water, Exercise, Journal |
| Screen Time Limit | Tally | Fuel Gauge | Unit: minutes, Goal: daily limit |
| Medication Tracker | Boolean Check-In | Stamp Card | Daily check |

### 📚 Learning & School
| Starter Config | Type | Default Visual | Pre-filled |
|---------------|------|---------------|------------|
| Reading Log (Pages) | Tally | Bar Chart + History | Unit: pages |
| Reading Log (Books) | Tally | Star Chart | Unit: books |
| Homework Streak | Streak | Flame Counter | Source: homework tasks |
| Homeschool Hours by Subject | Timer/Duration | Time Bar Chart | Unit: hours, per subject |
| Music Practice | Timer/Duration | Stopwatch + Bar | Unit: minutes, Goal: 30/day |
| Study Session | Timer/Duration | Time Bar Chart | Unit: minutes |
| Typing Speed | Snapshot/Comparison | Record Board | Metric: WPM |
| Color-Reveal Reading Challenge | Color-Reveal | Standard Reveal | Source: books finished |
| Learn to [Skill] | Sequential Path | Mastery Path | Steps: mom defines |

### 🧹 Chores & Responsibility
| Starter Config | Type | Default Visual | Pre-filled |
|---------------|------|---------------|------------|
| Chore Completion This Week | Percentage | Responsibility Gauge | Source: chore tasks |
| Chore Streak | Streak | Growing Tree | Source: daily chores |
| Responsibility Score | Percentage | Donut Ring | Source: all assigned tasks |
| No-Reminders-Needed | Tally | Star Chart | Unit: tasks without reminder |
| Helping Others | Tally | Garden / Plant Growth | Unit: kind acts |
| Independence Ladder | Sequential Path | Staircase | Learning → Help → Mostly alone → Independent |

### 💰 Money & Allowance
| Starter Config | Type | Default Visual | Pre-filled |
|---------------|------|---------------|------------|
| Weekly Allowance | Allowance Calculator | Summary Card | Configurable approach |
| Fixed Task Allowance | Allowance Calculator | Fixed Task Grid | Approach A |
| Category-Based Allowance | Allowance Calculator | Dynamic Category Rings | Approach B |
| Points-Based Allowance | Allowance Calculator | Points List | Approach C |
| Savings Goal | Tally | Thermometer | Unit: dollars |
| Earnings This Week | Tally | Coin Jar | Unit: dollars, Reset: weekly |

### 🎯 Goals & Milestones
| Starter Config | Type | Default Visual | Pre-filled |
|---------------|------|---------------|------------|
| Custom Reward Goal | Sequential Path | Winding Path | Prize at end |
| 30-Day Challenge | Boolean Check-In | Calendar Dots | 30 days |
| Summer Reading Challenge | Tally | Garden / Plant Growth | Unit: books, Goal: 20 |
| Birthday Countdown | Countdown | Big Number | Target: date |
| Vacation Countdown | Countdown | Advent Calendar | Target: date |
| Earn a Reward | Tally | Custom Reward Reveal | Threshold-based |
| Color-Reveal Chore Challenge | Color-Reveal | Standard Reveal | Source: chore tasks |
| Color-Reveal Custom Goal | Color-Reveal | Standard Reveal | Source: configurable |

### 🏆 Gamification & Achievements
| Starter Config | Type | Default Visual | Pre-filled |
|---------------|------|---------------|------------|
| Achievement Badges | Achievement/Badge | Badge Wall | Configurable |
| XP & Leveling | XP/Level | Shield + Bar | Sources: linked tasks |
| Family Leaderboard | Leaderboard | Classic Leaderboard | All kids, weekly % |
| Personal Records | Snapshot/Comparison | Record Board | Best Week, Streak, Most Tasks |
| Family Race | Leaderboard | Race Track | All members, weekly |
| Sticker Collection | Achievement/Badge | Sticker Album | Configurable |

### 🌿 Health & Wellness
| Starter Config | Type | Default Visual | Pre-filled |
|---------------|------|---------------|------------|
| Water Intake | Tally | Bubble Fill | Unit: glasses, Goal: 8, Reset: daily |
| Exercise Minutes | Timer/Duration | Time Bar Chart | Unit: minutes, Goal: 30/day |
| Sleep Log | Tally | Bar Chart + History | Unit: hours |
| Fruits & Veggies | Tally | Garden / Plant Growth | Unit: servings, Goal: 5/day |
| Mood Tracker | Mood/Rating | Emoji Row + Trend | 5-point, daily |
| Energy Level | Mood/Rating | Battery (Percentage) | Daily |
| Gratitude Journal Streak | Boolean Check-In | Calendar Dots | Daily |
| Daily Reflection | Mood/Rating | Number Scale | 1–5, daily |

### 👶 Young Kids & Developmental
| Starter Config | Type | Default Visual | Pre-filled |
|---------------|------|---------------|------------|
| Potty Training | Tally | Animated Star Chart | Unit: successes |
| Potty Streak | Streak | Flame Counter | Source: potty tally |
| Sticker Reward Chart | Tally | Star Chart | Unit: stickers, Goal: configurable |
| Behavior Chart | Mood/Rating | Weather Metaphor | 3-point, daily |
| Nap Tracker | Boolean Check-In | Simple Toggle | Daily |
| New Words Learned | Tally | Tally Marks | Unit: words |
| Good Listener Stars | Tally | Animated Star Chart | Unit: stars |
| Color-Reveal Potty Chart | Color-Reveal | Standard Reveal | Source: potty successes |

### 🧩 Special Needs & Therapy
| Starter Config | Type | Default Visual | Pre-filled |
|---------------|------|---------------|------------|
| IEP Goal Progress | Tally | Progress Bar | Per goal, multiple instances |
| Therapy Session Log | Tally | Bar Chart + History | Unit: sessions |
| Speech Practice | Timer/Duration | Stopwatch + Bar | Unit: minutes |
| Sensory Diet Checklist | Checklist | Standard Checklist | Per OT recommendation |
| Social Skills Practice | Tally | Star Chart | Unit: interactions |
| Independence Skills | Sequential Path | Staircase | Per skill |
| Hand Washing Tracker | Tally | Bubble Fill | Unit: times |
| ISP Goal Tracking | Tally | Multi-Bar Comparison | Per goal |

### 👨‍👩‍👧 Family & Multiplayer
| Starter Config | Type | Default Visual | Multiplayer Mode | Pre-filled |
|---------------|------|---------------|-----------------|------------|
| Family Reading Race | Tally | Colored Bars (competitive) | Competitive | Unit: books, all members |
| Family Chore Team | Tally | Stacked Bar (collaborative) | Collaborative | Unit: tasks, shared goal |
| Family Star Mosaic | Tally | Colored Stars | Both | Shared star grid, member-colored stars |
| Family Game Board Race | Gameboard | Road Trip | Competitive | All members, game pieces in member colors |
| Family Collection Quest | Tally | Coin Jar + Colored Segments | Collaborative | Shared goal, member contributions visible |
| Family Streak Challenge | Streak | Colored Bars | Competitive | All members, who can streak longest |
| Family Habit Grid | Multi-Habit Grid | Color-Coded Grid | Both | Shared habits, member-colored cells |
| Sibling Challenge | Tally | Race Track | Competitive | Guided+ age members only |
| Family Journey Together | Gameboard | Custom Path | Collaborative | All members on same board, must all reach end |
| Family Color-Reveal | Color-Reveal | Standard Reveal | Collaborative | Family achievements reveal shared image |

---

## SUMMARY COUNTS

| Category | Count |
|----------|-------|
| **Tracker Types** | 19 (17 tracking + Info Display + Quick Action) |
| **Visual Variants** | 75+ across all tracker types |
| **Starter Configurations** | 95+ across 10 life-area categories |
| **Info Display Widgets** | 25 (15 core + 5 gamification + 5 collaboration) |
| **Quick Action Widgets** | 7 |
| **Multiplayer Visual Styles** | 6 cross-cutting rendering patterns |

---

## RELATIONSHIP TO OTHER PRDs

| PRD | What It Defines | What This Catalog Provides |
|-----|----------------|--------------------------|
| **PRD-10 (Widgets & Dashboard)** | Grid layout, widget configuration, Track This, Special Adult view, folders, deployment | The tracker types, visual variants, and info/quick-action widgets that render inside the grid |
| **PRD-24 (Rewards & Gamification)** | Points system, Visual Worlds, Overlays, Victory Recorder, Family Quests, Family Challenges, Seasons | The gamification info display widgets (I-16 through I-25) are stubs until PRD-24 is built |
| **PRD-28 (Tracking & Financial)** | Allowance pools, payment tracking, homeschool tracking | Allowance Calculator widget type + task-linked tracker data flows |
| **PRD-09B (Studio & Templates)** | Studio page structure, template browsing, "Coming Soon" cards | Starter configs are what populate the Studio browsing experience for trackers/widgets |
| **PRD-03 (Design System)** | Theme tokens, vibes, member colors | Member color tokens, theme-aware widget rendering, vibe-specific decorative layer |

---

*This catalog is a living document. Adding a new starter configuration = one JSON preset (no code). Adding a new visual variant = one React component accepting standard props. Adding a new tracker type = schema + data engine (real engineering). The system scales toward "more is more" with minimal marginal cost per addition.*
