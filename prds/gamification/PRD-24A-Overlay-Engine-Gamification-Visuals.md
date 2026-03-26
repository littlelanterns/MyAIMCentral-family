> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-24A: Overlay Engine & Gamification Visuals

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-09A (Tasks, Routines & Opportunities), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-11 (Victory Recorder & Daily Celebration), PRD-14 (Personal Dashboard), PRD-22 (Settings), PRD-24 (Gamification System — Overview & Foundation)
**Created:** March 16, 2026
**Last Updated:** March 16, 2026
**Parent PRD:** PRD-24 (Gamification System — Overview & Foundation)
**Sibling PRDs:** PRD-24B (Gamification Visuals & Interactions), PRD-24C (Family Challenges & Multiplayer Gamification)

---

## Overview

PRD-24A defines the two visual systems that bring gamification to life for kids: **dashboard backgrounds** (themed images with matched celebration animations that personalize a child's space) and the **overlay engine** (a config-driven game layer that transforms task completions into collectible creatures, brewed potions, quest loot, or any other narrative reward system).

Dashboard backgrounds are a library of 13 themed images (Ocean Deep, Outer Space, Spring Garden, etc.) that a child can display behind their dashboard content. They work independently of the PRD-03 color theme system. But backgrounds are more than wallpaper — each one comes with **matched micro-celebration animations** that fire on task completion. Ocean background → a dolphin arcs across the screen. Space → a rocket launches. Garden → a butterfly flutters by. Every task completion triggers a small themed animation; milestones (3rd task, 5th task, routine complete) trigger a bigger, more dramatic version. This makes the background feel alive and responsive to the child's effort.

The overlay engine is the heart of this PRD. An overlay is a narrative game that runs on top of the normal task flow. Each overlay defines its own **collectible mode** — how task completions translate into game items. Pet Collector uses **effort mode**: one pet per day, sized by how many tasks were completed (big day = big pet, light day = small pet). Apothecary Workshop uses **category mode**: completing all tasks in a category for the day earns a specific collectible (all schoolwork done = red round bottle, all chores done = tall blue bottle), and those collectibles combine into recipes that unlock rewards. Over weeks, the overlay's environment evolves through 4 stages — a pet shelter growing into a legendary kingdom, a corner workbench evolving into a master alchemist's hall.

The architecture supports **both single and multiple active overlays per child** — the multi-overlay configuration flag determines whether a child can have one or several active simultaneously. This decision can be toggled without schema changes, allowing the product to launch either way and adjust based on user feedback.

The overlay engine is config-driven. Adding a new overlay — Robot Builder, Dragon Collection, Kingdom Builder — is a content task (create a config object + generate images), not a code change. The engine reads an `OverlayConfig` and renders the stages, collectibles, progress, and celebrations. Three overlays launch with the platform: **Pet Collector** (simple, ages 4–10, effort mode), **Apothecary Workshop** (complex, ages 10–16, category mode with recipe combinations), and **Video Game Quest** (8-bit pixel retro aesthetic, ages 7–14, category mode with quest completion).

> **Note:** The above references the original 3 overlay names for backward compatibility with PRD-24 language. Under the modular architecture, there are 5 launch **visual themes** (Pets, Apothecary Bottles, Dragons, Pixel Loot, Mythical Creatures) × 3 **game modes** (Effort, Category, Recipe/Quest). Any theme works with any mode.

PRD-24A also wires **DailyCelebration Step 4** — the "main event" of the kid celebration sequence (PRD-11). This is where today's earned collectibles are revealed, stage evolutions are animated, and the child sees the tangible result of their effort. Step 4 was stubbed in PRD-11 and data-sourced in PRD-24; this PRD specifies exactly what happens visually and interactively.

Finally, PRD-24A includes the **Visual Asset Manifest** (a complete inventory of every image, video, and icon the gamification system needs across all sub-PRDs) and the **Content Creation Pipeline** specification (the repeatable three-step process for batch-generating these assets using AI image tools).

> **Mom experience goal:** My kid should open the app and feel like they're stepping into their own world. The background makes it feel personal. The overlay game makes tasks feel meaningful — not "do your chores," but "earn a new pet" or "brew a potion." Setting it up should take me 2 minutes: pick a background, pick an overlay (or two), assign task categories, done. The system handles the rest.

> **Kid experience goal:** Every task I complete gives me something cool. I can see my pets grow. I can watch my workshop evolve. At the end of the day, the celebration shows me what I earned. I want to do more tasks tomorrow because I want to see what happens next.

> **Depends on:** PRD-24 (Foundation) defines the points engine, reward economy, gamification event pipeline, streak system, and all base data tables. PRD-24A does NOT redefine any of that — it builds the visual and narrative systems on top of PRD-24's foundation.

---

## Architectural Boundaries

### What PRD-24A Owns

| System | Scope |
|--------|-------|
| Dashboard backgrounds | Background image library, selection UI, per-member background assignment, permission model for self-selection, **background-matched celebration animations** (small on every task, big on milestones) |
| Overlay Engine | `OverlayConfig` and `OverlayInstance` data model, config-driven renderer, multi-overlay-per-member support (configurable flag), task-category-to-overlay routing |
| Overlay stage progression | 4-stage visual evolution system, point threshold mapping, stage image display, evolution animations |
| Daily collectible system | **Two collectible modes:** Effort mode (one collectible per day, sized by task count) and Category mode (one collectible per completed task category, type determined by category). Mode selected per overlay via config. |
| Collection view | Browsable gallery of all earned collectibles per overlay, with size or type reflecting daily effort/completion |
| Recipe combination system | Collectible-type counting, recipe definitions (collect X bottles of type A + Y of type B → unlock reward), brew/combine UI, reward unlock on recipe completion |
| 3 launch overlay configs | Pet Collector (effort mode), Apothecary Workshop (category mode with recipes), Video Game Quest (category mode with quests) |
| DailyCelebration Step 4 wiring | Daily collectible reveal, stage evolution animation, overlay progress display, points earned sparkle |
| Overlay Settings UI | Overlay selector, task-category mapping, per-overlay configuration, within PRD-22 Settings framework |
| Visual Asset Manifest | Complete inventory of all gamification images/videos across PRD-24, 24A, 24B, 24C |
| Content Creation Pipeline | Documented process for batch-generating visual assets using AI tools |

### What Other PRDs Own (Not Duplicated Here)

| PRD | What It Owns | How PRD-24A Connects |
|-----|-------------|---------------------|
| PRD-03 (Design System) | Color themes, vibes, CSS variable architecture | Dashboard backgrounds are independent of color themes. Overlay UI elements use PRD-03 theme tokens for progress bars, text, borders. |
| PRD-10 (Widgets) | Dashboard grid, widget types, tracker infrastructure | Collection view and overlay progress display render as PRD-10 widgets (I-16: Visual World Progress → Overlay Progress, I-17: Overlay Collection Display) |
| PRD-11 (Victory Recorder) | DailyCelebration 5-step structure, celebration narrative generation | PRD-24A specifies Step 4 content. PRD-11 owns the sequence container and steps 1, 2, 3, 5. |
| PRD-22 (Settings) | Settings overlay container, category navigation | PRD-24A defines overlay settings screens hosted within PRD-22's framework |
| PRD-24 (Foundation) | Points engine, rewards, streaks, treasure boxes, gamification event pipeline, gamification_configs table | PRD-24A reads points from the pipeline. Overlay progress is updated as part of the pipeline's step 8. |
| PRD-24B (Visuals) | Star Chart animation, Color-Reveal system, CSS/SVG interactive reveal animations, pre-rendered treasure box videos | PRD-24A defines the asset manifest entries for PRD-24B assets. PRD-24B defines how they animate. |

---

## User Stories

### Dashboard Backgrounds (Mom)
- As a mom, I want to choose a dashboard background for my child from a library of themed images (ocean, space, garden, forest, etc.) so their app feels personal and exciting.
- As a mom, I want to decide whether my child can change their own background or whether I control it, because my 12-year-old can choose for herself but I want to pick for my 4-year-old.
- As a mom, I want the background to feel alive — when my kid completes a task, I want a little themed animation (a dolphin, a rocket, a butterfly) to make the moment feel special.

### Dashboard Backgrounds (Children)
- As a child (if mom allows), I want to pick my own background from the library so my dashboard feels like my space.
- As a child, I want the background to match my personality — ocean for me, space for my brother, candy world for my little sister.
- As a child, I want to see something fun happen when I finish a task — a dolphin jumping across my ocean screen, or a rocket launching on my space screen — so every task feels rewarding.

### Background Celebrations
- As a child, I want a small themed animation every time I complete a task (a fish swimming by, a star shooting across) so the background feels responsive to my effort.
- As a child, I want a bigger, more dramatic animation on milestones (completing my 3rd task, 5th task, or finishing a whole routine) — a whale breaching, a constellation forming, a garden blooming — so the big moments feel extra special.
- As a mom, I want these animations to be brief and non-disruptive — a few seconds of delight, not something that interrupts the workflow.

### Overlays (Mom)
- As a mom, I want to assign overlays to my children — Pet Collector for my 6-year-old, Apothecary for my 13-year-old, Video Game Quest for my 11-year-old — so each child has a game that matches their age and interests.
- As a mom, I want to map task categories to overlays — "chores feed Pet Collector, schoolwork feeds Apothecary" — so different responsibilities drive different games.
- As a mom, I want to disable or change overlays without losing my child's progress so they can take a break and come back later.
- As a mom, I want overlay setup to be quick — pick the overlay, map the categories, done. Smart defaults should handle the rest.

### Overlays (Children)
- As a child, I want to see something cool happen every time I complete a task — not just points going up, but a new pet appearing or a new ingredient collected.
- As a child, I want to watch my overlay world grow over time — my pet shelter getting bigger, my workshop evolving — so I can see weeks of effort adding up.
- As a child, I want to browse my collection — all my pets, all my potions, all my loot — and feel proud of what I've built.
- As a child with the Apothecary overlay, I want completing all my schoolwork in a day to earn me a red round bottle, and completing all my chores to earn a tall blue bottle — so I can see exactly what I accomplished.
- As a child with the Apothecary overlay, I want to combine my collected bottles into recipes that unlock rewards — 10 red + 10 blue + 15 green = a real reward from mom.
- As a child with the Video Game Quest overlay, I want to collect swords, coins, potions, and relics from my tasks and combine them to complete quests — like playing a real RPG.

### Daily Collectible
- As a child, I want the pet/creature/item I earn each day to reflect how much I did — a big pet for a big day, a small one for a lighter day — so I can see the difference effort makes.
- As a child, I want to see my new collectible revealed during my daily celebration so the end of the day feels exciting.

### DailyCelebration Step 4
- As a child, I want Step 4 to show me what I earned today — my new pet, my new ingredients, my stage evolution — with fun animations.
- As a parent watching my child's celebration, I want Step 4 to feel like the highlight — the moment that makes my kid want to do it again tomorrow.

### Collection View
- As a child, I want to see all my pets (or potions, or creatures) from this month arranged so I can see which days were big and which were small.
- As a child, I want to tap on a collectible and see details — "Goldie the Golden Retriever, earned Tuesday, you completed 7 tasks that day!"
- As a teen, I want my collection view to feel clean and organized, not babyish.

---

## Screens

### Screen 1: Dashboard with Background

**What the user sees:**

The child's dashboard (PRD-14) with a themed background image displayed behind the content. The background is a full-bleed image with a subtle overlay gradient to ensure text/card readability. Dashboard cards, widgets, and navigation render on top of the background with their normal PRD-03 theme styling.

**Background rendering:**
- Image fills the viewport behind all dashboard content
- Semi-transparent gradient overlay (dark or light depending on theme light/dark mode) ensures readability
- Background does not scroll with content — fixed position, slight parallax on mobile optional
- If no background selected, the dashboard renders with the standard PRD-03 theme background (no image)

**Background celebration animations:**

Each background has matched CSS/SVG micro-celebration animations that fire on task completion. These are lightweight, non-blocking animations that play over the dashboard content for 2–4 seconds.

| Event | Animation Size | Duration | Example (Ocean) | Example (Space) | Example (Garden) |
|-------|---------------|----------|-----------------|-----------------|-------------------|
| Any task completion | Small | 2 sec | Small fish swims across | Shooting star arcs across | Butterfly flutters past |
| 3rd task (daily bonus) | Medium | 3 sec | School of fish swirls | Comet trail with sparkles | Flowers bloom in a wave |
| 5th+ task (Perfect Day) | Large | 4 sec | Whale breaches across screen | Constellation forms and glows | Entire garden bursts into bloom |
| Routine complete | Medium | 3 sec | Dolphin leaps in an arc | Rocket launches upward | Bird takes flight |

**Animation implementation:**
- CSS/SVG animations rendered as absolutely-positioned overlays on the dashboard
- Animations are non-blocking — user can continue interacting during playback
- Animations respect shell animation tokens: Play shell uses bouncier timing (cubic-bezier(0.34, 1.56, 0.64, 1), 350ms), Guided uses standard (250ms ease), Independent uses subtle (200ms)
- Each background defines its celebration config in the `background_library` table as a JSONB field
- Post-MVP: these could be upgraded to richer animations (Lottie, sprite sheets)

**Shell rendering:**

| Shell | Background Behavior | Celebration Behavior |
|-------|-------------------|---------------------|
| Play | Background visible with lighter overlay gradient. Cards have more opaque backgrounds to ensure readability with large text. | Maximum animation — biggest, bounciest celebrations with sparkle trails |
| Guided | Background visible. Standard overlay gradient. | Full animation with moderate intensity |
| Independent | Background visible if enabled. Member can toggle background visibility. | Subtle animation — clean, brief |
| Adult | Background available but defaults to OFF. Adult dashboards default to the clean PRD-03 theme. | Micro-celebrations OFF by default (can enable in settings) |

---

### Screen 2: Background Selector (Settings)

> **Hosted within:** PRD-22 Settings overlay → Family Members → [Child Name] → Gamification → Dashboard Background

**What the user sees:**

A visual picker showing all 13 background thumbnails in a grid. Each thumbnail shows a small preview of the background image with the background name below it.

```
┌──────────────────────────────────────────────────┐
│  Dashboard Background for Emma                    │
│  ─────────────────────────────────────────────── │
│                                                   │
│  [None]  [🌸 Spring   [🚀 Outer   [🌊 Ocean    │
│          Garden]       Space]       Deep]         │
│                                                   │
│  [🌲 Enchanted [⚙️ Steampunk [🏜️ Desert  [❄️ Arctic │
│   Forest]       Workshop]    Adventure] Tundra]   │
│                                                   │
│  [🌋 Volcano [🍬 Candy  [🏰 Medieval [🏙️ City   │
│   Isle]       Land]      Kingdom]    Skyline]     │
│                                                   │
│  [🦕 Prehistoric [🏡 Enchanted                   │
│   Jungle]         Cottage]                        │
│                                                   │
│  ─────────────────────────────────────────────── │
│  Self-selection: ○ Mom assigns  ● Child chooses   │
│                  (requires my approval)            │
└──────────────────────────────────────────────────┘
```

**Interactions:**
- Tap a thumbnail → preview modal shows full-screen background with sample dashboard content overlaid, so mom sees how it looks with real cards
- Tap [Select] in preview → background applied. Immediate.
- "Self-selection" toggle at bottom: when set to "Child chooses," the background selector appears in the child's own Settings (simplified version, just the grid — no other settings). When set to "Mom assigns," child sees the background but cannot change it.

**Data updated:**
- `dashboard_backgrounds.background_key` on the member's record
- `dashboard_backgrounds.self_select_enabled` boolean

---

### Screen 3: Overlay Selector (Settings)

> **Hosted within:** PRD-22 Settings overlay → Family Members → [Child Name] → Gamification → Overlays

**What the user sees:**

A list of available overlays with descriptions, age recommendations, and an "Activate" button. Active overlays are shown at the top with their configuration. Inactive (available) overlays below.

```
┌──────────────────────────────────────────────────┐
│  Overlays for Jake                                │
│  ─────────────────────────────────────────────── │
│                                                   │
│  ACTIVE OVERLAYS                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🧪 Apothecary Workshop          Stage 2     │ │
│  │ Ages 10–16 · Complex                        │ │
│  │ Fed by: Homework, Reading                    │ │
│  │ 47 / 80 points to Stage 3                   │ │
│  │ [Configure] [Pause]                          │ │
│  ├─────────────────────────────────────────────┤ │
│  │ 🐾 Pet Collector                 Stage 1     │ │
│  │ Ages 4–10 · Simple                           │ │
│  │ Fed by: Chores, Kindness                     │ │
│  │ 12 / 30 points to Stage 2                    │ │
│  │ [Configure] [Pause]                          │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  AVAILABLE OVERLAYS                               │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🐉 Dragon Collection          Ages 6–12     │ │
│  │ Hatch and grow dragons from tasks            │ │
│  │ [Preview] [Activate]                         │ │
│  ├─────────────────────────────────────────────┤ │
│  │ 🏰 Kingdom Builder            Ages 9–15     │ │
│  │ Build a kingdom from scratch                 │ │
│  │ [Preview] [Activate]                         │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  PAUSED OVERLAYS                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ 👾 Monster Army (Paused)       Stage 3      │ │
│  │ Progress saved. [Resume] [Reset & Remove]    │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└──────────────────────────────────────────────────┘
```

**States for each overlay:**
- **Active:** Running, receiving points from mapped task categories, stage progressing
- **Paused:** Not receiving points, progress saved, can resume anytime
- **Available:** Not yet activated for this child, no progress

**Interactions:**
- [Activate] → opens Overlay Setup flow (Screen 4)
- [Configure] → opens Overlay Configuration (Screen 5)
- [Pause] → overlay stops receiving points, progress frozen, status changes to Paused
- [Resume] → overlay becomes Active again, starts receiving points for mapped categories
- [Reset & Remove] → confirmation dialog: "This will erase all progress for this overlay. Points and streaks are not affected." → on confirm, overlay instance deleted
- [Preview] → modal showing the 4 stage images, the overlay's narrative description, and example collectibles

---

### Screen 4: Overlay Setup Flow (New Overlay Activation)

**What the user sees:**

A brief 2-step setup flow when mom activates a new overlay for a child.

**Step 1 — Category Mapping:**

```
┌──────────────────────────────────────────────────┐
│  Set up Pet Collector for Emma                    │
│  ─────────────────────────────────────────────── │
│                                                   │
│  Which task categories earn pets?                  │
│                                                   │
│  ☑ Chores                                         │
│  ☑ Kindness                                       │
│  ☐ Homework                                       │
│  ☐ Reading                                        │
│  ☐ Exercise                                       │
│  ☐ All categories                                 │
│                                                   │
│  Note: Categories already mapped to another        │
│  overlay won't double-count. Each task feeds       │
│  one overlay.                                      │
│                                                   │
│  [Next]                                            │
└──────────────────────────────────────────────────┘
```

**Category conflict rule:** A task category can only feed ONE overlay per child. If "Homework" already feeds Apothecary, it's shown as unavailable for Pet Collector (greyed out with "→ Apothecary Workshop" label). Mom can reassign by going to the other overlay's configuration. This prevents double-counting and keeps the economy clean.

**Step 2 — Confirmation:**

```
┌──────────────────────────────────────────────────┐
│  Pet Collector is ready!                          │
│  ─────────────────────────────────────────────── │
│                                                   │
│  Emma will earn pets when she completes:           │
│    • Chores                                        │
│    • Kindness tasks                                │
│                                                   │
│  Pets grow bigger on days she does more!           │
│                                                   │
│  Stage 1: Small Pet Shelter                        │
│  [thumbnail of Stage 1 image]                      │
│                                                   │
│  [Activate] [Back]                                 │
└──────────────────────────────────────────────────┘
```

**Data created:**
- `overlay_instances` record with status='active', overlay_config_key, mapped categories, initial stage=1
- `overlay_progress` record initialized at 0 points, stage 1

---

### Screen 5: Overlay Configuration (Active Overlay Settings)

> **Hosted within:** Settings → Family Members → [Child Name] → Gamification → Overlays → [Overlay Name]

**What the user sees:**

Configuration panel for a single active overlay.

**Sections:**

**Section A — Category Mapping:**
- Checkboxes for which task categories feed this overlay (same as setup Step 1, but editable)
- Reassigning a category from another overlay automatically unmaps it from the previous one (with confirmation)

**Section B — Stage Thresholds (Advanced, collapsed by default):**
- Shows current stage point ranges
- Mom can adjust thresholds: "My kid progresses faster/slower than default"
- Preset options: Relaxed (50% of default thresholds), Standard (default), Ambitious (150% of default)
- Custom option: mom enters exact point values per stage

**Section C — Daily Collectible Display:**
- Toggle: Show daily collectible in DailyCelebration Step 4 (default: ON)
- Toggle: Show daily collectible size label (e.g., "Small," "Medium," "Big!") (default: ON for Play/Guided, OFF for Independent)

**Section D — Collection View:**
- Toggle: Show collection widget on dashboard (default: ON)
- Widget size preference: S / M / L

**Section E — Recipe Combinations (Apothecary only):**
- Shows available recipes and their ingredient requirements
- Mom can create custom recipes: pick ingredient types + quantities → set reward description
- Mom can link recipe completion to a reward from the reward menu (PRD-24) or a custom one-time reward

---

### Screen 6: Overlay Collection View Widget (Dashboard)

**What the user sees:**

A dashboard widget (PRD-10 grid, deployable in M/L sizes) showing the child's collectible gallery for one overlay.

**Medium size:**
```
┌──────────────────────────────────────────────────┐
│  🐾 My Pets · March 2026            Stage 2 🏠  │
│  ─────────────────────────────────────────────── │
│                                                   │
│  Today: 🐕 Goldie (Big!)                         │
│                                                   │
│  This week:                                       │
│  [🐹sm] [🐕lg] [🐱md] [🐛sm] [🐕lg] [ ] [ ]   │
│   Mon    Tue    Wed    Thu    Fri                  │
│                                                   │
│  [View Full Collection]                           │
└──────────────────────────────────────────────────┘
```

**Large size:**
- Shows current month's collectibles in a calendar-style grid
- Each day's collectible displayed at relative size
- Today's collectible highlighted
- Stage progress bar at the top
- "View Full Collection" → opens Collection Detail Modal (Screen 7)

**Shell rendering:**

| Shell | Display |
|-------|---------|
| Play | Large icons, simple labels ("Big pet! Small pet!"), bright colors, animated bounce on today's collectible |
| Guided | Medium icons, descriptive labels, stage progress visible |
| Independent | Clean grid, minimal labels, more data-focused |

---

### Screen 7: Collection Detail Modal

**What the user sees:**

A full modal showing the complete collectible history for one overlay.

**Layout:**
- Header: Overlay name, current stage with stage image, total collectibles earned
- Month selector (arrows to navigate months)
- Calendar grid showing collectibles per day
- Tap any collectible → detail card

**Display varies by collectible mode:**

**Effort mode (Pet Collector):** One collectible per day, sized by daily effort. Calendar shows one pet per day at relative size. Big pets for big days, small pets for light days. The month's collection is a visual landscape of effort.

**Category mode (Apothecary, Video Game Quest):** Multiple collectibles per day, one per completed task category. Calendar shows a row of small icons per day — red bottle, blue bottle, green bottle. Days with more completed categories show more icons. The collection doubles as an inventory for the recipe/quest system.

**Tap detail card shows:**
- Collectible name and image
- Date earned
- For effort mode: tasks completed that day (count and list), size category
- For category mode: which category it represents, whether the full category was completed
- Optional: rarity tier badge

**Size categories (effort mode only):**

| Daily Tasks Completed (for this overlay's categories) | Size | Visual Multiplier |
|-------------------------------------------------------|------|-------------------|
| 1 task | Small | 0.5x base image size |
| 2–3 tasks | Medium | 0.75x |
| 4–5 tasks | Large | 1.0x |
| 6+ tasks (or Perfect Day) | Legendary | 1.25x + glow effect |

**Category completion (category mode):**

A category collectible is earned when ALL tasks assigned for that category on that day are completed. Partial completion does not earn the collectible. This makes each bottle/item feel earned — you finished ALL your schoolwork, not just some of it.

> **Decision rationale:** Category mode rewards completion of a full responsibility area. This is more meaningful than dripping individual ingredients per task — "I finished ALL my schoolwork" earns a whole bottle. The recipe system then uses bottle counts, making the math intuitive: "10 red bottles + 10 blue bottles = reward."

**Data read:**
- `overlay_collectibles` for this member + overlay
- `gamification_daily_summaries` for task counts
- `overlay_instances` for stage info

---

### Screen 8: Apothecary Recipe Book (Apothecary Overlay Only)

**What the user sees:**

A themed modal styled like an old book/grimoire. This is the recipe combination interface for the Apothecary overlay.

```
┌──────────────────────────────────────────────────┐
│  📖 Apothecary Recipe Book          Jake's       │
│  ─────────────────────────────────────────────── │
│                                                   │
│  AVAILABLE RECIPES                                │
│  ┌─────────────────────────────────────────────┐ │
│  │ ⚗️ Focus Draught                            │ │
│  │ Combine: 3🧠 Intelligence + 2💪 Energy      │ │
│  │ You have: 5🧠 + 4💪 — Ready to brew!        │ │
│  │ Reward: Pick the movie for family night      │ │
│  │ [Brew!]                                      │ │
│  ├─────────────────────────────────────────────┤ │
│  │ ⚗️ Compassionate Teacher Elixir             │ │
│  │ Combine: 2💚 Healing + 3📚 Wisdom           │ │
│  │ You have: 1💚 + 3📚 — Need 1 more Healing   │ │
│  │ Reward: Choose dinner menu one night         │ │
│  │ [locked]                                     │ │
│  ├─────────────────────────────────────────────┤ │
│  │ ⚗️ Rainbow Elixir (Legendary)               │ │
│  │ Combine: 3 Perfect Days this month           │ │
│  │ You have: 1 / 3 Perfect Days                 │ │
│  │ Reward: Family outing of your choice         │ │
│  │ [locked]                                     │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  BREWED ELIXIRS (this month)                      │
│  ⚗️ Memory Elixir — brewed March 8               │
│  ⚗️ Strength Tonic — brewed March 11              │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Interactions:**
- [Brew!] when ingredients are sufficient → brief brewing animation (cauldron bubbles, steam, sparkle) → potion appears → reward unlocked
- If reward is auto-approve: reward immediately granted, celebration micro-animation
- If reward requires approval: creates PRD-15 request, child sees "Awaiting mom's approval"
- Recipe book is also accessible from the Collection View widget via a "Recipe Book" button (Apothecary only)

**Data created on brew:**
- `recipe_completions` record
- `reward_redemptions` record (PRD-24) if linked to a reward
- `overlay_collectibles` record for the brewed potion (goes into collection)
- Ingredient counts decremented from `overlay_progress.ingredient_counts`

---

### Screen 9: DailyCelebration Step 4 — Overlay Reveal

> **Hosted within:** PRD-11 DailyCelebration sequence, Step 4

**What the user sees:**

Step 4 of the DailyCelebration is "THE MAIN EVENT" — gold bordered, 15–20 seconds, the climax of the celebration sequence. PRD-24A defines what renders inside this step.

**Sub-sequence (plays in order, each sub-step is skippable):**

**Sub-step A — Daily Collectible Reveal (per active overlay):**

For each overlay that received points today, show the collectible earned:

```
[Overlay icon + name fades in]
"Your Pet Collector earned something today!"

[Egg/mystery silhouette appears, bounces]
[Egg cracks / silhouette reveals → pet appears with sparkle]

"Meet Goldie the Golden Retriever!"
"🐕 Big! (You completed 5 chores today!)"

[If multiple overlays, brief transition, then next overlay's reveal]

"Your Apothecary Workshop:"
"You collected 2 Intelligence ingredients and 1 Energy ingredient!"
[Ingredient icons float into view]
```

**Sub-step B — Stage Evolution (if applicable):**

If any overlay crossed a stage threshold today:

```
[Current stage image displayed]
[Dramatic transition: image morphs/crossfades to new stage image]
"Your Pet Shelter grew into a Pet House! 🏠"
[Confetti burst + stage name in gold text]
"Keep going — Pet Sanctuary is next!"
```

If no stage evolution today, Sub-step B is skipped.

**Sub-step C — Points Summary:**

```
"Today you earned: +35 ⭐"
[Points counter animates from 0 to 35 with sparkle]
"Total: 287 ⭐"
[Brief pause, then auto-advance to Step 5]
```

**Per-shell rendering:**

| Element | Play | Guided |
|---------|------|--------|
| Collectible reveal | Maximum animation — egg crack, bouncing, sparkle explosion, 3-5 seconds per reveal | Moderate animation — smooth fade-in, sparkle, 2-3 seconds |
| Size label | "Big!" "Small!" "Legendary!" in huge text | "Large" "Medium" with task count |
| Stage evolution | Full dramatic crossfade with confetti rain, 5+ seconds | Clean transition with subtle confetti, 3 seconds |
| Points summary | Big animated counter with bouncing numbers | Standard animated counter |
| Multiple overlays | Each gets full reveal with transition | Condensed — both shown together if 2, sequential if 3+ |

**Data read:**
- `overlay_collectibles` earned today
- `overlay_instances` for stage status (did a stage change today?)
- `gamification_daily_summaries.points_earned_today`
- `overlay_progress` for current stage images and progress

---


## Overlay Engine Architecture

The overlay engine uses a **modular architecture** that separates visual identity from game mechanics. Mom picks a **Visual Theme** (what things look like — pets, bottles, dragons, pixel loot) independently from a **Game Mode** (how the game works — effort sizing, category completion, recipe/quest combining). Any visual theme works with any game mode.

This means a child who loves Apothecary bottles can play the effort game (one bottle per day, sized by how much they did) OR the category game (specific bottle types earned by completing each category) OR the recipe game (collect bottles and combine them toward rewards). Mom picks the combination. The engine handles the rest.

### Visual Theme × Game Mode

```
Visual Theme (what it looks like)        Game Mode (how the game works)
├── Pets (cute animals)                  ├── Effort (one per day, sized by volume)
├── Apothecary Bottles (potion bottles)  ├── Category (one per completed category)
├── Dragons (cute OR ornate variants)    └── Recipe/Quest (combine toward goals)
└── Pixel Loot (8-bit retro items)

Mom picks: 1 Visual Theme + 1 Game Mode + maps categories → overlay created
```

### VisualThemeConfig Interface

Defines a visual theme — the art, collectible images, stage images, and variants. Stored as static TypeScript config files.

```typescript
interface VisualThemeConfig {
  // Identity
  id: string;                           // 'pets', 'apothecary_bottles', 'dragons', 'pixel_loot'
  name: string;                         // "Pets", "Apothecary Bottles"
  description: string;                  // Short description for mom
  icon: string;                         // Emoji
  ageRange: { min: number; max: number };

  // Art Variants (mom picks per child)
  artVariants: ArtVariant[];
  // e.g., Dragons has "cute_pixar" and "ornate_mythical"
  // Pets might just have one: "default"

  // Stages (4 visual stages — environment evolves over time)
  stages: ThemeStage[];

  // Collectible Palette — the set of collectible visuals available in this theme
  // Mom (or smart defaults) maps these to the child's actual task categories
  collectibles: ThemeCollectible[];

  // Default recipe templates (pre-populated when Recipe/Quest mode is selected)
  defaultRecipes?: RecipeCombination[];

  // Reveal Containers — themed treasure boxes, eggs, gift boxes, slot machines
  // These replace PRD-24's generic reveal templates with theme-consistent versions
  revealContainers: RevealContainer[];

  // Assets
  assets: {
    stageImages: {
      [variantId: string]: {             // Per art variant
        [stageNumber: number]: string;   // URL/path per stage
      };
    };
    thumbnailImage: string;
    collectibleIconSheet?: string;
    revealVideos?: {                      // Per reveal container type
      [containerId: string]: {
        posterFrame: string;              // Static image (from grid generation)
        videoWebM: string;               // Reveal animation video
        videoMP4: string;                // Fallback
      };
    };
  };
}

interface RevealContainer {
  id: string;                           // 'pet_carrier', 'potion_crate', 'dragon_egg', 'pixel_chest'
  name: string;                         // "Pet Carrier", "Sealed Potion Crate"
  description: string;                  // Flavor text for the container
  imageKey: string;                     // Poster frame / idle state image
  videoKey: string;                     // Reveal animation video key
  bestFor: string;                      // "treasure_box" | "randomizer" | "both"
}

interface ArtVariant {
  id: string;                           // 'cute_pixar', 'ornate_mythical', 'default'
  name: string;                         // "Cute & Cuddly", "Ornate & Mythical"
  description: string;                  // "Adorable Pixar-style baby dragons"
  ageRecommendation: string;            // "Ages 4–10", "Ages 10–16"
}

interface ThemeStage {
  stageNumber: number;                  // 1–4
  name: string;                         // "Small Pet Shelter" / "Dragon's Nest"
  defaultPointsRequired: number;        // Cumulative (mom can override)
  description: string;
  keyFeatures: string[];
  imageKeyPerVariant: {                 // Stage image differs by art variant
    [variantId: string]: string;
  };
}

interface ThemeCollectible {
  id: string;                           // 'golden_retriever', 'red_round_bottle', 'fire_dragon'
  name: string;                         // "Golden Retriever", "Red Round Bottle"
  icon: string;
  imageKey: string;
  visual: {
    shape?: string;                     // 'round', 'tall', 'dragon', 'sword'
    color?: string;                     // CSS variable or hex
  };
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  artVariant?: string;                  // Which art variant this belongs to (null = all variants)
}
```

### GameModeConfig Interface

Defines a game mode — how task completions translate into collectibles and progress. Stored as static TypeScript config files.

```typescript
interface GameModeConfig {
  id: string;                           // 'effort', 'category', 'recipe_quest'
  name: string;                         // "Daily Growth", "Category Collection", "Recipe & Quest"
  description: string;                  // Description for mom during setup
  icon: string;

  // How collectibles are earned
  collectibleMode: 'effort' | 'category';

  // Effort mode settings (when collectibleMode = 'effort')
  effortSettings?: {
    sizeThresholds: DailySizeThreshold[];
    nameGenerator: 'random_from_list' | 'sequential';
  };

  // Category mode settings (when collectibleMode = 'category')
  categorySettings?: {
    requireFullCategoryCompletion: boolean;  // Must ALL tasks in category be done?
  };

  // Recipe/Quest system (optional — works with either collectible mode)
  recipeSystem?: {
    enabled: boolean;
    uiLabel: string;                    // "Recipe Book" for Apothecary, "Quest Log" for Pixel Loot, "auto" to derive from theme
    combineVerb: string;                // "Brew", "Complete", "auto" to derive from theme
  };
}

interface DailySizeThreshold {
  minTasks: number;
  size: 'small' | 'medium' | 'large' | 'legendary';
  visualMultiplier: number;             // 0.5, 0.75, 1.0, 1.25
  label: string;                        // "Tiny!", "Big!", "LEGENDARY!"
}

interface RecipeCombination {
  id: string;                           // 'focus_draught', 'dungeon_raid'
  name: string;                         // "Focus Draught", "Dungeon Raid"
  description: string;
  ingredients: RecipeIngredient[];      // What collectibles are needed
  result: {
    rewardId?: string;                  // Link to gamification_rewards (PRD-24)
    rewardDescription?: string;         // Or inline reward description
  };
  isRepeatable: boolean;
  cooldownDays?: number;
}

interface RecipeIngredient {
  collectibleId: string;                // References ThemeCollectible.id
  quantity: number;
}
```

### OverlayInstance (Per-Member Runtime State)

When mom sets up an overlay for a child, she combines one Visual Theme + one Game Mode + category mapping. This creates an `OverlayInstance`.

```typescript
interface OverlayInstanceState {
  // What this overlay is
  visualThemeId: string;                // 'pets', 'apothecary_bottles', 'dragons', 'pixel_loot'
  gameModeId: string;                   // 'effort', 'category', 'recipe_quest'
  artVariantId: string;                 // 'cute_pixar', 'ornate_mythical', 'default'
  status: 'active' | 'paused';

  // Stage progress
  currentStage: number;                 // 1–4
  totalPoints: number;                  // Cumulative points in this overlay
  stageThresholdOverrides?: number[];   // If mom customized

  // Category-to-collectible mapping (auto-populated from kid's categories, mom adjusts)
  categoryMapping: {
    [taskCategory: string]: string;     // Maps kid's actual category → ThemeCollectible.id
  };
  // e.g., { "Math": "red_round_bottle", "Chores": "blue_tall_bottle", "Piano": "green_flask" }

  // Collectible counts (for recipe/quest system)
  collectibleCounts: {
    [collectibleId: string]: number;    // Running totals
  };

  // Recipes/Quests (pre-populated from theme defaults, mom can customize)
  recipes: RecipeCombination[];

  // Timestamps
  activatedAt: string;
  pausedAt?: string;
}
```

### How Category Mapping Works

When mom activates an overlay for a child, the system auto-populates the category mapping:

1. **Read the child's actual task categories** from their assigned tasks (e.g., "Math," "Reading," "Chores," "Piano," "Exercise")
2. **Present the visual theme's collectible palette** (e.g., for Apothecary: red round bottle, blue tall bottle, green flask, pink heart, gold star, purple spiral)
3. **Auto-assign using round-robin** — first category → first collectible, second → second, etc.
4. **Mom reviews and adjusts** — she can reassign any category to any collectible from the palette

No hardcoded "red = schoolwork." If a homeschool family has categories like "Latin," "Nature Study," and "Math Drills," those categories map to whichever collectibles mom wants. The collectible palette is the theme's visual vocabulary; the categories are the child's actual life.

### Recipe/Quest System

Recipes (Apothecary) and Quests (Pixel Loot, Dragons) use the same engine. Each visual theme provides default recipe templates that are pre-populated when Recipe/Quest mode is selected. Mom can edit, delete, or create custom recipes.

**Recipe setup flow for mom:**
1. Pick collectible types from the theme's palette and set quantities: "10 red bottles + 10 blue bottles + 15 green bottles"
2. Set the reward: link to an existing reward from the reward menu, or type a custom one
3. Set repeatability and cooldown

### Gamification Event Pipeline Extension

PRD-24's gamification event pipeline Step 8 is currently a stub: "CHECK OVERLAY PROGRESS." PRD-24A wires this step:

```
8. CHECK OVERLAY PROGRESS:
   - What task category was this completion? (from task record)
   - Find active overlay_instances for this member where this category is mapped
   - For EACH matching overlay instance:
     a. Calculate overlay points earned (same as gamification points — uses member's base rate)
     b. Increment overlay_instances.total_points
     c. Determine collectible from categoryMapping
     d. Increment collectibleCounts for that collectible type

     e. GAME MODE CHECK:
        IF effort mode:
          - Check if a daily collectible already exists for this overlay + today
          - If yes: upgrade size if new task count crosses a size threshold
          - If no: create new daily collectible, assign random variant from theme, determine size

        IF category mode:
          - Check: are ALL tasks in this task category for today now complete?
          - If yes AND no collectible for this category today: create category collectible record
          - If no: no collectible yet — partial completion doesn't earn anything

     f. Check stage progression:
        - Does new total_points cross the next stage threshold?
        - If yes: update current_stage, add to gamification_daily_summaries.overlay_progress_today

     g. Check recipe/quest completion:
        - Do current collectibleCounts satisfy any recipe's requirements?
        - If yes: flag recipe as completable (child initiates the combine action)
```

PRD-24's pipeline Step 9 was "CHECK THEME PROGRESS." With the Visual Worlds simplification, **Step 9 is removed.** Dashboard backgrounds are cosmetic and have no progress tracking.

---

## Launch Visual Themes

Five visual themes ship at launch. The engine supports unlimited additional themes via new `VisualThemeConfig` objects + generated image assets.

### Pets

```typescript
const PetsTheme: VisualThemeConfig = {
  id: 'pets', name: 'Pets', icon: '🐾',
  description: 'Adopt and collect adorable pets!',
  ageRange: { min: 4, max: 12 },
  artVariants: [
    { id: 'default', name: 'Adorable Pets', description: 'Cute Pixar-style animals', ageRecommendation: 'All ages' },
  ],
  stages: [
    { stageNumber: 1, name: 'Small Pet Shelter', defaultPointsRequired: 0, description: 'A cozy corner with a few pet beds.', keyFeatures: ['3 pet beds', 'food bowl'], imageKeyPerVariant: { default: 'pets_stage_1' } },
    { stageNumber: 2, name: 'Pet House', defaultPointsRequired: 30, description: 'A proper pet house with a yard.', keyFeatures: ['8 pet beds', 'fenced yard', 'play area'], imageKeyPerVariant: { default: 'pets_stage_2' } },
    { stageNumber: 3, name: 'Pet Sanctuary', defaultPointsRequired: 80, description: 'A beautiful sanctuary with gardens.', keyFeatures: ['20+ spaces', 'gardens', 'fish pond'], imageKeyPerVariant: { default: 'pets_stage_3' } },
    { stageNumber: 4, name: 'Legendary Pet Kingdom', defaultPointsRequired: 150, description: 'A magical kingdom for all creatures.', keyFeatures: ['Unlimited capacity', 'magical habitats', 'rainbow bridge'], imageKeyPerVariant: { default: 'pets_stage_4' } },
  ],
  collectibles: [
    { id: 'golden_retriever', name: 'Golden Retriever', icon: '🐕', imageKey: 'pet_golden_retriever', visual: {}, rarity: 'common' },
    { id: 'hamster', name: 'Hamster', icon: '🐹', imageKey: 'pet_hamster', visual: {}, rarity: 'common' },
    { id: 'tabby_cat', name: 'Tabby Cat', icon: '🐱', imageKey: 'pet_tabby_cat', visual: {}, rarity: 'common' },
    { id: 'ladybug', name: 'Ladybug', icon: '🐛', imageKey: 'pet_ladybug', visual: {}, rarity: 'common' },
    { id: 'bunny', name: 'Bunny', icon: '🐰', imageKey: 'pet_bunny', visual: {}, rarity: 'common' },
    { id: 'parrot', name: 'Parrot', icon: '🦜', imageKey: 'pet_parrot', visual: {}, rarity: 'uncommon' },
    { id: 'hedgehog', name: 'Hedgehog', icon: '🦔', imageKey: 'pet_hedgehog', visual: {}, rarity: 'uncommon' },
    { id: 'turtle', name: 'Turtle', icon: '🐢', imageKey: 'pet_turtle', visual: {}, rarity: 'uncommon' },
    { id: 'fox', name: 'Fox', icon: '🦊', imageKey: 'pet_fox', visual: {}, rarity: 'rare' },
    { id: 'owl', name: 'Owl', icon: '🦉', imageKey: 'pet_owl', visual: {}, rarity: 'rare' },
    { id: 'otter', name: 'Otter', icon: '🦦', imageKey: 'pet_otter', visual: {}, rarity: 'rare' },
    { id: 'red_panda', name: 'Red Panda', icon: '🐾', imageKey: 'pet_red_panda', visual: {}, rarity: 'legendary' },
  ],
  revealContainers: [
    { id: 'pet_carrier', name: 'Pet Carrier', description: 'A cozy carrier — who\'s inside?', imageKey: 'pets_reveal_carrier', videoKey: 'pets_reveal_carrier', bestFor: 'treasure_box' },
    { id: 'pet_egg', name: 'Mystery Egg', description: 'A warm, speckled egg is hatching!', imageKey: 'pets_reveal_egg', videoKey: 'pets_reveal_egg', bestFor: 'both' },
    { id: 'pet_gift_box', name: 'Paw Print Gift Box', description: 'A gift wrapped with paw print ribbon', imageKey: 'pets_reveal_gift', videoKey: 'pets_reveal_gift', bestFor: 'both' },
  ],
  assets: {
    stageImages: { default: { 1: '/assets/themes/pets/stage_1.png', 2: '/assets/themes/pets/stage_2.png', 3: '/assets/themes/pets/stage_3.png', 4: '/assets/themes/pets/stage_4.png' } },
    thumbnailImage: '/assets/themes/pets/thumbnail.png',
    collectibleIconSheet: '/assets/themes/pets/pets_grid.png',
  },
};
```

### Apothecary Bottles

```typescript
const ApothecaryBottlesTheme: VisualThemeConfig = {
  id: 'apothecary_bottles', name: 'Apothecary Bottles', icon: '🧪',
  description: 'Collect magical potion bottles! Each shape and color represents a different accomplishment.',
  ageRange: { min: 8, max: 16 },
  artVariants: [
    { id: 'default', name: 'Classic Apothecary', description: 'Fantasy potion bottles with warm candlelight', ageRecommendation: 'All ages' },
  ],
  stages: [
    { stageNumber: 1, name: 'Basic Corner', defaultPointsRequired: 0, description: 'A small corner table with a single cauldron.', keyFeatures: ['1 cauldron', '3 bottles', 'oil lamp'], imageKeyPerVariant: { default: 'apothecary_stage_1' } },
    { stageNumber: 2, name: 'Workbench', defaultPointsRequired: 80, description: 'A dedicated workspace.', keyFeatures: ['3 cauldrons', '12 bottles', 'herb rack'], imageKeyPerVariant: { default: 'apothecary_stage_2' } },
    { stageNumber: 3, name: 'Full Workshop', defaultPointsRequired: 200, description: 'A complete laboratory.', keyFeatures: ['6 cauldrons', '30+ bottles', 'distillation equipment'], imageKeyPerVariant: { default: 'apothecary_stage_3' } },
    { stageNumber: 4, name: 'Master Apothecary', defaultPointsRequired: 400, description: "A grand alchemist's hall.", keyFeatures: ['Floor-to-ceiling shelves', 'secret vault'], imageKeyPerVariant: { default: 'apothecary_stage_4' } },
  ],
  collectibles: [
    { id: 'red_round_bottle', name: 'Red Round Bottle', icon: '🔴', imageKey: 'bottle_red_round', visual: { shape: 'round', color: 'var(--color-error)' } },
    { id: 'blue_tall_bottle', name: 'Blue Tall Bottle', icon: '🔵', imageKey: 'bottle_blue_tall', visual: { shape: 'tall', color: 'var(--color-accent)' } },
    { id: 'green_flask', name: 'Green Flask', icon: '🟢', imageKey: 'bottle_green_flask', visual: { shape: 'flask', color: 'var(--color-success)' } },
    { id: 'pink_heart_bottle', name: 'Pink Heart Bottle', icon: '💗', imageKey: 'bottle_pink_heart', visual: { shape: 'heart', color: '#d69a84' } },
    { id: 'gold_star_bottle', name: 'Gold Star Bottle', icon: '⭐', imageKey: 'bottle_gold_star', visual: { shape: 'star', color: 'var(--color-gold)' } },
    { id: 'purple_spiral', name: 'Purple Spiral Bottle', icon: '🟣', imageKey: 'bottle_purple_spiral', visual: { shape: 'spiral', color: '#8e6ab2' } },
  ],
  revealContainers: [
    { id: 'potion_crate', name: 'Sealed Potion Crate', description: 'A wooden crate stamped with alchemical symbols', imageKey: 'apothecary_reveal_crate', videoKey: 'apothecary_reveal_crate', bestFor: 'treasure_box' },
    { id: 'bubbling_cauldron', name: 'Bubbling Cauldron', description: 'The cauldron is bubbling — what will emerge?', imageKey: 'apothecary_reveal_cauldron', videoKey: 'apothecary_reveal_cauldron', bestFor: 'both' },
    { id: 'mystery_bottle', name: 'Mystery Bottle', description: 'A sealed bottle glowing with unknown contents', imageKey: 'apothecary_reveal_bottle', videoKey: 'apothecary_reveal_bottle', bestFor: 'both' },
  ],
  defaultRecipes: [
    { id: 'focus_draught', name: 'Focus Draught', description: 'Sharpen your mind.', ingredients: [{ collectibleId: 'red_round_bottle', quantity: 3 }, { collectibleId: 'blue_tall_bottle', quantity: 2 }], result: { rewardDescription: 'Pick the movie for family night' }, isRepeatable: true, cooldownDays: 7 },
    { id: 'compassionate_teacher', name: 'Compassionate Teacher Elixir', description: 'Blend kindness with knowledge.', ingredients: [{ collectibleId: 'pink_heart_bottle', quantity: 2 }, { collectibleId: 'green_flask', quantity: 3 }], result: { rewardDescription: 'Choose dinner menu one night' }, isRepeatable: true, cooldownDays: 7 },
    { id: 'rainbow_elixir', name: 'Rainbow Elixir', description: 'The ultimate creation.', ingredients: [{ collectibleId: 'red_round_bottle', quantity: 10 }, { collectibleId: 'blue_tall_bottle', quantity: 10 }, { collectibleId: 'green_flask', quantity: 15 }, { collectibleId: 'pink_heart_bottle', quantity: 5 }, { collectibleId: 'gold_star_bottle', quantity: 5 }], result: { rewardDescription: 'Family outing of your choice' }, isRepeatable: true, cooldownDays: 30 },
  ],
  assets: {
    stageImages: { default: { 1: '/assets/themes/apothecary/stage_1.png', 2: '/assets/themes/apothecary/stage_2.png', 3: '/assets/themes/apothecary/stage_3.png', 4: '/assets/themes/apothecary/stage_4.png' } },
    thumbnailImage: '/assets/themes/apothecary/thumbnail.png',
    collectibleIconSheet: '/assets/themes/apothecary/bottles_grid.png',
  },
};
```

### Dragons

```typescript
const DragonsTheme: VisualThemeConfig = {
  id: 'dragons', name: 'Dragons', icon: '🐉',
  description: 'Hatch and collect dragons! Mom picks cute baby dragons or ornate mythical beasts.',
  ageRange: { min: 4, max: 16 },
  artVariants: [
    { id: 'cute_pixar', name: 'Cute & Cuddly', description: 'Adorable Pixar-style baby dragons with big eyes', ageRecommendation: 'Ages 4–10' },
    { id: 'ornate_mythical', name: 'Ornate & Mythical', description: 'Detailed, majestic dragons with scales and fire', ageRecommendation: 'Ages 10–16' },
  ],
  stages: [
    { stageNumber: 1, name: "Dragon's Nest", defaultPointsRequired: 0, description: 'A small cave with a single nest.', keyFeatures: ['1 nest', 'warm stones', 'flickering fire'], imageKeyPerVariant: { cute_pixar: 'dragon_cute_stage_1', ornate_mythical: 'dragon_ornate_stage_1' } },
    { stageNumber: 2, name: 'Dragon Den', defaultPointsRequired: 50, description: 'A proper den with multiple nests.', keyFeatures: ['3 nests', 'treasure pile', 'perching ledge'], imageKeyPerVariant: { cute_pixar: 'dragon_cute_stage_2', ornate_mythical: 'dragon_ornate_stage_2' } },
    { stageNumber: 3, name: 'Dragon Roost', defaultPointsRequired: 120, description: 'A mountain roost with sweeping views.', keyFeatures: ['Mountain perch', 'multiple caves', 'flight training'], imageKeyPerVariant: { cute_pixar: 'dragon_cute_stage_3', ornate_mythical: 'dragon_ornate_stage_3' } },
    { stageNumber: 4, name: 'Legendary Aerie', defaultPointsRequired: 250, description: 'A legendary floating aerie.', keyFeatures: ['Floating islands', 'crystal caves', 'elder council'], imageKeyPerVariant: { cute_pixar: 'dragon_cute_stage_4', ornate_mythical: 'dragon_ornate_stage_4' } },
  ],
  collectibles: [
    { id: 'fire_dragon', name: 'Fire Dragon', icon: '🔥', imageKey: 'dragon_fire', visual: { color: 'var(--color-error)' }, rarity: 'common' },
    { id: 'water_dragon', name: 'Water Dragon', icon: '💧', imageKey: 'dragon_water', visual: { color: 'var(--color-accent)' }, rarity: 'common' },
    { id: 'earth_dragon', name: 'Earth Dragon', icon: '🌿', imageKey: 'dragon_earth', visual: { color: 'var(--color-success)' }, rarity: 'common' },
    { id: 'wind_dragon', name: 'Wind Dragon', icon: '💨', imageKey: 'dragon_wind', visual: { color: '#aebfb4' }, rarity: 'uncommon' },
    { id: 'light_dragon', name: 'Light Dragon', icon: '✨', imageKey: 'dragon_light', visual: { color: 'var(--color-gold)' }, rarity: 'uncommon' },
    { id: 'shadow_dragon', name: 'Shadow Dragon', icon: '🌑', imageKey: 'dragon_shadow', visual: { color: '#5e7164' }, rarity: 'rare' },
    { id: 'crystal_dragon', name: 'Crystal Dragon', icon: '💎', imageKey: 'dragon_crystal', visual: { color: '#8e6ab2' }, rarity: 'rare' },
    { id: 'cosmic_dragon', name: 'Cosmic Dragon', icon: '🌌', imageKey: 'dragon_cosmic', visual: { color: '#2c5d60' }, rarity: 'legendary' },
  ],
  revealContainers: [
    { id: 'dragon_egg', name: 'Dragon Egg', description: 'A glowing, scaled egg — it\'s warm to the touch!', imageKey: 'dragons_reveal_egg', videoKey: 'dragons_reveal_egg', bestFor: 'both' },
    { id: 'treasure_hoard', name: 'Dragon\'s Treasure Hoard', description: 'A pile of gold and gems guarded by dragon fire', imageKey: 'dragons_reveal_hoard', videoKey: 'dragons_reveal_hoard', bestFor: 'treasure_box' },
    { id: 'dragon_gift', name: 'Dragon-Wrapped Gift', description: 'A gift wrapped in dragon scales with a flame-sealed ribbon', imageKey: 'dragons_reveal_gift', videoKey: 'dragons_reveal_gift', bestFor: 'both' },
  ],
  defaultRecipes: [
    { id: 'dragon_taming', name: 'Dragon Taming', description: 'Tame a wild dragon.', ingredients: [{ collectibleId: 'fire_dragon', quantity: 3 }, { collectibleId: 'water_dragon', quantity: 2 }], result: { rewardDescription: 'Pick a special treat' }, isRepeatable: true, cooldownDays: 7 },
    { id: 'elder_council', name: 'Elder Dragon Council', description: 'Summon the ancient council.', ingredients: [{ collectibleId: 'fire_dragon', quantity: 5 }, { collectibleId: 'water_dragon', quantity: 5 }, { collectibleId: 'earth_dragon', quantity: 5 }, { collectibleId: 'wind_dragon', quantity: 3 }, { collectibleId: 'light_dragon', quantity: 3 }], result: { rewardDescription: 'Family outing of your choice' }, isRepeatable: true, cooldownDays: 30 },
  ],
  assets: {
    stageImages: {
      cute_pixar: { 1: '/assets/themes/dragons/cute/stage_1.png', 2: '/assets/themes/dragons/cute/stage_2.png', 3: '/assets/themes/dragons/cute/stage_3.png', 4: '/assets/themes/dragons/cute/stage_4.png' },
      ornate_mythical: { 1: '/assets/themes/dragons/ornate/stage_1.png', 2: '/assets/themes/dragons/ornate/stage_2.png', 3: '/assets/themes/dragons/ornate/stage_3.png', 4: '/assets/themes/dragons/ornate/stage_4.png' },
    },
    thumbnailImage: '/assets/themes/dragons/thumbnail.png',
    collectibleIconSheet: '/assets/themes/dragons/dragons_grid.png',
  },
};
```

### Pixel Loot (8-Bit Retro)

```typescript
const PixelLootTheme: VisualThemeConfig = {
  id: 'pixel_loot', name: 'Pixel Loot', icon: '🎮',
  description: 'Collect legendary 8-bit loot! Retro RPG adventure.',
  ageRange: { min: 7, max: 14 },
  artVariants: [
    { id: 'default', name: '8-Bit Classic', description: 'Zelda/Mario-style pixel art', ageRecommendation: 'Ages 7–14' },
  ],
  stages: [
    { stageNumber: 1, name: 'Village Outpost', defaultPointsRequired: 0, description: 'A humble starting camp.', keyFeatures: ['Campfire', 'wooden sword', 'torn map'], imageKeyPerVariant: { default: 'pixel_stage_1' } },
    { stageNumber: 2, name: 'Forest Dungeon', defaultPointsRequired: 50, description: 'A base near the dungeon.', keyFeatures: ['Iron sword', 'shield', 'treasure chest'], imageKeyPerVariant: { default: 'pixel_stage_2' } },
    { stageNumber: 3, name: 'Castle Stronghold', defaultPointsRequired: 150, description: 'A fortified castle.', keyFeatures: ['Diamond sword', 'full armor', 'trophy hall'], imageKeyPerVariant: { default: 'pixel_stage_3' } },
    { stageNumber: 4, name: "Legendary Hero's Hall", defaultPointsRequired: 350, description: 'A legendary hall of fame.', keyFeatures: ['Mythical weapons', 'dragon mount', 'portal'], imageKeyPerVariant: { default: 'pixel_stage_4' } },
  ],
  collectibles: [
    { id: 'quest_scroll', name: 'Quest Scroll', icon: '📜', imageKey: 'loot_scroll', visual: { shape: 'scroll', color: '#d6a461' }, rarity: 'common' },
    { id: 'gold_coin', name: 'Gold Coin', icon: '🪙', imageKey: 'loot_coin', visual: { shape: 'coin', color: 'var(--color-gold)' }, rarity: 'common' },
    { id: 'magic_potion', name: 'Magic Potion', icon: '🧪', imageKey: 'loot_potion', visual: { shape: 'potion', color: 'var(--color-accent)' }, rarity: 'uncommon' },
    { id: 'heart_crystal', name: 'Heart Crystal', icon: '💎', imageKey: 'loot_crystal', visual: { shape: 'crystal', color: '#d69a84' }, rarity: 'uncommon' },
    { id: 'power_sword', name: 'Power Sword', icon: '⚔️', imageKey: 'loot_sword', visual: { shape: 'sword', color: '#aebfb4' }, rarity: 'rare' },
    { id: 'magic_mushroom', name: 'Magic Mushroom', icon: '🍄', imageKey: 'loot_mushroom', visual: { shape: 'mushroom', color: 'var(--color-error)' }, rarity: 'rare' },
    { id: 'ancient_relic', name: 'Ancient Relic', icon: '🏺', imageKey: 'loot_relic', visual: { shape: 'relic', color: '#8e6ab2' }, rarity: 'legendary' },
  ],
  revealContainers: [
    { id: 'pixel_chest', name: '8-Bit Treasure Chest', description: 'A classic pixel art treasure chest', imageKey: 'pixel_reveal_chest', videoKey: 'pixel_reveal_chest', bestFor: 'treasure_box' },
    { id: 'pixel_mystery_box', name: 'Mystery Block', description: 'A flashing ? block — hit it to see what\'s inside!', imageKey: 'pixel_reveal_mystery', videoKey: 'pixel_reveal_mystery', bestFor: 'both' },
    { id: 'pixel_slot_machine', name: 'Pixel Slot Machine', description: '8-bit reels spinning...', imageKey: 'pixel_reveal_slots', videoKey: 'pixel_reveal_slots', bestFor: 'both' },
  ],
  defaultRecipes: [
    { id: 'dungeon_raid', name: 'Dungeon Raid', description: 'Storm the dungeon!', ingredients: [{ collectibleId: 'power_sword', quantity: 3 }, { collectibleId: 'magic_potion', quantity: 2 }, { collectibleId: 'gold_coin', quantity: 5 }], result: { rewardDescription: '30 min extra gaming time' }, isRepeatable: true, cooldownDays: 7 },
    { id: 'dragon_slayer', name: 'Dragon Slayer Quest', description: 'Only the bravest heroes attempt this.', ingredients: [{ collectibleId: 'power_sword', quantity: 5 }, { collectibleId: 'heart_crystal', quantity: 3 }, { collectibleId: 'magic_potion', quantity: 5 }, { collectibleId: 'quest_scroll', quantity: 5 }], result: { rewardDescription: 'Pick a new game or book' }, isRepeatable: true, cooldownDays: 14 },
    { id: 'legendary_hero', name: 'Legendary Hero Quest', description: 'The ultimate quest.', ingredients: [{ collectibleId: 'quest_scroll', quantity: 10 }, { collectibleId: 'gold_coin', quantity: 10 }, { collectibleId: 'magic_potion', quantity: 10 }, { collectibleId: 'heart_crystal', quantity: 5 }, { collectibleId: 'power_sword', quantity: 5 }], result: { rewardDescription: 'Family outing of your choice' }, isRepeatable: true, cooldownDays: 30 },
  ],
  assets: {
    stageImages: { default: { 1: '/assets/themes/pixel_loot/stage_1.png', 2: '/assets/themes/pixel_loot/stage_2.png', 3: '/assets/themes/pixel_loot/stage_3.png', 4: '/assets/themes/pixel_loot/stage_4.png' } },
    thumbnailImage: '/assets/themes/pixel_loot/thumbnail.png',
    collectibleIconSheet: '/assets/themes/pixel_loot/loot_grid.png',
  },
};
```

### Mythical Creatures

```typescript
const MythicalCreaturesTheme: VisualThemeConfig = {
  id: 'mythical_creatures', name: 'Mythical Creatures', icon: '🦄',
  description: 'Collect unicorns, phoenixes, griffins, and other legendary beings from the realm of myth and magic!',
  ageRange: { min: 6, max: 14 },
  artVariants: [
    { id: 'default', name: 'Enchanted Fantasy', description: 'Magical creatures with soft glow and sparkle effects', ageRecommendation: 'All ages' },
  ],
  stages: [
    { stageNumber: 1, name: 'Enchanted Grove', defaultPointsRequired: 0, description: 'A small clearing in a magical forest with a glowing fairy ring.', keyFeatures: ['Fairy ring', 'glowing mushrooms', 'crystal pool'], imageKeyPerVariant: { default: 'mythical_stage_1' } },
    { stageNumber: 2, name: 'Crystal Cave', defaultPointsRequired: 40, description: 'A shimmering cave with crystal formations and floating lights.', keyFeatures: ['Crystal formations', 'floating lanterns', 'waterfall entrance'], imageKeyPerVariant: { default: 'mythical_stage_2' } },
    { stageNumber: 3, name: 'Floating Island', defaultPointsRequired: 100, description: 'An island suspended in the clouds with rainbow bridges.', keyFeatures: ['Cloud platforms', 'rainbow bridges', 'star garden', 'aurora canopy'], imageKeyPerVariant: { default: 'mythical_stage_3' } },
    { stageNumber: 4, name: 'Legendary Realm', defaultPointsRequired: 200, description: 'A magnificent realm where myth becomes reality.', keyFeatures: ['Celestial palace', 'eternal garden', 'constellation map', 'portal nexus'], imageKeyPerVariant: { default: 'mythical_stage_4' } },
  ],
  collectibles: [
    { id: 'fairy', name: 'Fairy', icon: '🧚', imageKey: 'mythical_fairy', visual: { color: '#f3a6a0' }, rarity: 'common' },
    { id: 'pixie', name: 'Pixie', icon: '✨', imageKey: 'mythical_pixie', visual: { color: 'var(--color-gold)' }, rarity: 'common' },
    { id: 'mermaid', name: 'Mermaid', icon: '🧜', imageKey: 'mythical_mermaid', visual: { color: 'var(--color-accent)' }, rarity: 'common' },
    { id: 'centaur', name: 'Centaur', icon: '🏹', imageKey: 'mythical_centaur', visual: { color: '#8a4a25' }, rarity: 'uncommon' },
    { id: 'pegasus', name: 'Pegasus', icon: '🐴', imageKey: 'mythical_pegasus', visual: { color: '#aebfb4' }, rarity: 'uncommon' },
    { id: 'griffin', name: 'Griffin', icon: '🦅', imageKey: 'mythical_griffin', visual: { color: '#d6a461' }, rarity: 'rare' },
    { id: 'kitsune', name: 'Kitsune', icon: '🦊', imageKey: 'mythical_kitsune', visual: { color: '#f9c396' }, rarity: 'rare' },
    { id: 'unicorn', name: 'Unicorn', icon: '🦄', imageKey: 'mythical_unicorn', visual: { color: '#d69a84' }, rarity: 'rare' },
    { id: 'phoenix', name: 'Phoenix', icon: '🔥', imageKey: 'mythical_phoenix', visual: { color: 'var(--color-error)' }, rarity: 'legendary' },
    { id: 'cosmic_serpent', name: 'Cosmic Serpent', icon: '🐍', imageKey: 'mythical_cosmic_serpent', visual: { color: '#2c5d60' }, rarity: 'legendary' },
  ],
  revealContainers: [
    { id: 'enchanted_egg', name: 'Enchanted Egg', description: 'A glowing egg swirling with starlight — what mythical being will emerge?', imageKey: 'mythical_reveal_egg', videoKey: 'mythical_reveal_egg', bestFor: 'both' },
    { id: 'crystal_chest', name: 'Crystal Chest', description: 'A chest made of living crystal, pulsing with ancient magic', imageKey: 'mythical_reveal_crystal', videoKey: 'mythical_reveal_crystal', bestFor: 'treasure_box' },
    { id: 'portal_gift', name: 'Portal Gift', description: 'A gift wrapped in a swirling dimensional portal', imageKey: 'mythical_reveal_portal', videoKey: 'mythical_reveal_portal', bestFor: 'both' },
  ],
  defaultRecipes: [
    { id: 'fairy_circle', name: 'Fairy Circle Ritual', description: 'Summon the fairy circle for a blessing.', ingredients: [{ collectibleId: 'fairy', quantity: 3 }, { collectibleId: 'pixie', quantity: 2 }], result: { rewardDescription: 'Pick a special treat' }, isRepeatable: true, cooldownDays: 7 },
    { id: 'mythical_convergence', name: 'Mythical Convergence', description: 'The great convergence of all mythical beings.', ingredients: [{ collectibleId: 'unicorn', quantity: 3 }, { collectibleId: 'phoenix', quantity: 2 }, { collectibleId: 'griffin', quantity: 3 }, { collectibleId: 'pegasus', quantity: 3 }, { collectibleId: 'mermaid', quantity: 5 }], result: { rewardDescription: 'Family outing of your choice' }, isRepeatable: true, cooldownDays: 30 },
  ],
  assets: {
    stageImages: { default: { 1: '/assets/themes/mythical/stage_1.png', 2: '/assets/themes/mythical/stage_2.png', 3: '/assets/themes/mythical/stage_3.png', 4: '/assets/themes/mythical/stage_4.png' } },
    thumbnailImage: '/assets/themes/mythical/thumbnail.png',
    collectibleIconSheet: '/assets/themes/mythical/creatures_grid.png',
  },
};
```

## Launch Game Modes

```typescript
const EffortMode: GameModeConfig = {
  id: 'effort', name: 'Daily Growth', icon: '📈',
  description: 'Earn one collectible per day. The more tasks you do, the bigger it grows!',
  collectibleMode: 'effort',
  effortSettings: {
    sizeThresholds: [
      { minTasks: 1, size: 'small', visualMultiplier: 0.5, label: 'Tiny!' },
      { minTasks: 2, size: 'medium', visualMultiplier: 0.75, label: 'Medium' },
      { minTasks: 4, size: 'large', visualMultiplier: 1.0, label: 'Big!' },
      { minTasks: 6, size: 'legendary', visualMultiplier: 1.25, label: 'LEGENDARY!' },
    ],
    nameGenerator: 'random_from_list',
  },
};

const CategoryMode: GameModeConfig = {
  id: 'category', name: 'Category Collection', icon: '🏆',
  description: 'Earn a specific collectible for each task category you fully complete each day.',
  collectibleMode: 'category',
  categorySettings: { requireFullCategoryCompletion: true },
};

const RecipeQuestMode: GameModeConfig = {
  id: 'recipe_quest', name: 'Recipe & Quest', icon: '⚗️',
  description: 'Collect items by category and combine them into recipes or quests to earn rewards!',
  collectibleMode: 'category',
  categorySettings: { requireFullCategoryCompletion: true },
  recipeSystem: { enabled: true, uiLabel: 'auto', combineVerb: 'auto' },
};
```

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full configuration: background selection, overlay activation/configuration, category mapping, recipe reward linking, stage threshold overrides. Full visibility into all children's overlay progress and collections. | Mom is the overlay administrator. |
| Dad / Additional Adult | Self-configuration for own backgrounds/overlays (if gamification enabled). View children's overlay progress if mom grants permission. Cannot configure children's overlays without permission. | Follows PRD-02 permission model. |
| Special Adult | View overlay progress for assigned children during active shift. Task completions trigger overlay points. Cannot configure overlays. | Shift-scoped per PRD-02. |
| Independent (Teen) | Sees own overlay progress, collection, recipes. Can browse and tap in collection view. Can initiate recipe brews. Can choose own background if mom permits. Cannot modify category mappings or stage thresholds. | Mom controls whether teen can self-select background. |
| Guided | Sees own collection in age-appropriate display. DailyCelebration Step 4 reveals today's collectibles. Can view collection widget. Recipe book accessible with simplified UI (just shows progress toward recipes, mom handles brew-to-reward linking). | All configuration by mom. |
| Play | Sees daily collectible reveal in DailyCelebration Step 4 with maximum animation. Collection widget shows big, colorful pet/creature icons. No recipe interaction — too complex for this shell. | Mom or caregiver assists. Maximum delight. |

### Shell Behavior

| Feature | Mom/Adult | Independent | Guided | Play |
|---------|-----------|-------------|--------|------|
| Dashboard background | Available, defaults OFF | Available if mom enables | Mom assigns or child chooses (per config) | Mom assigns |
| Overlay collection widget | Standard grid | Clean grid, data-focused | Large icons, descriptive labels | Biggest icons, animated, simple labels |
| DailyCelebration Step 4 | N/A (adults use VictoryRecorder) | Moderate animation | Full animation with size labels | Maximum animation, biggest reveals, sound hooks |
| Recipe book (Apothecary) | Configure recipes + rewards | Full access, can initiate brews | Simplified view, mom-assisted brewing | Not shown |
| Overlay Settings | Full configuration | Background choice only (if permitted) | Not accessible | Not accessible |

---

## Data Schema

### Table: `dashboard_backgrounds`

Per-member background configuration.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (UNIQUE) |
| background_key | TEXT | | NULL | 'spring_garden', 'outer_space', etc. NULL = no background |
| self_select_enabled | BOOLEAN | false | NOT NULL | Whether member can change their own background |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom reads/writes all. Members read own.

**Indexes:**
- `(family_member_id)` UNIQUE — one background config per member

---

### Table: `overlay_instances`

One record per active or paused overlay per member. A member can have multiple active overlay instances.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| overlay_config_id | TEXT | | NOT NULL | DEPRECATED — replaced by visual_theme_id + game_mode_id |
| visual_theme_id | TEXT | | NOT NULL | References VisualThemeConfig.id ('pets', 'apothecary_bottles', 'dragons', 'pixel_loot') |
| game_mode_id | TEXT | | NOT NULL | References GameModeConfig.id ('effort', 'category', 'recipe_quest') |
| art_variant_id | TEXT | 'default' | NOT NULL | References ArtVariant.id ('default', 'cute_pixar', 'ornate_mythical') |
| status | TEXT | 'active' | NOT NULL | 'active', 'paused' |
| current_stage | INTEGER | 1 | NOT NULL | 1–4 |
| total_points | INTEGER | 0 | NOT NULL | Cumulative points in this overlay |
| category_mapping | JSONB | '{}' | NOT NULL | { "chores": "pet_treat", "kindness": "pet_toy" } |
| collectible_counts | JSONB | '{}' | NOT NULL | { "red_round_bottle": 12, "blue_tall_bottle": 5 } — running totals for recipe system |
| stage_threshold_overrides | JSONB | | NULL | Custom thresholds if mom adjusted: [0, 25, 60, 120] |
| activated_at | TIMESTAMPTZ | now() | NOT NULL | When first activated |
| paused_at | TIMESTAMPTZ | | NULL | When paused (if status='paused') |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. Members read own.

**Indexes:**
- `(family_member_id, visual_theme_id, game_mode_id)` UNIQUE — one instance per theme+mode combination per member
- `(family_member_id, status)` — find active overlays for a member
- `(family_id)` — family-level queries

---

### Table: `overlay_collectibles`

Daily collectibles earned. One record per overlay per day per member.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| overlay_instance_id | UUID | | NOT NULL | FK → overlay_instances |
| collectible_date | DATE | CURRENT_DATE | NOT NULL | |
| variant_id | TEXT | | NOT NULL | References DailyCollectibleVariant.id ('golden_retriever', 'memory_elixir') |
| variant_name | TEXT | | NOT NULL | Snapshot: "Goldie the Golden Retriever" |
| size | TEXT | 'small' | NOT NULL | 'small', 'medium', 'large', 'legendary' |
| task_count | INTEGER | 0 | NOT NULL | How many tasks fed this overlay today |
| rarity | TEXT | 'common' | NOT NULL | 'common', 'uncommon', 'rare', 'legendary' |
| is_revealed | BOOLEAN | false | NOT NULL | Whether shown in DailyCelebration Step 4 |
| revealed_at | TIMESTAMPTZ | | NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom reads all. Members read own. Append-mostly — size can upgrade during the day as tasks complete.

**Indexes:**
- `(family_member_id, overlay_instance_id, collectible_date)` UNIQUE — one collectible per overlay per day
- `(family_member_id, collectible_date)` — daily queries across all overlays
- `(overlay_instance_id, collectible_date DESC)` — overlay collection history

---

### Table: `recipe_completions`

Log of every recipe brew. Append-only.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| overlay_instance_id | UUID | | NOT NULL | FK → overlay_instances |
| recipe_id | TEXT | | NOT NULL | References RecipeCombination.id |
| recipe_name | TEXT | | NOT NULL | Snapshot |
| ingredients_used | JSONB | '{}' | NOT NULL | Snapshot of what was consumed |
| reward_description | TEXT | | NULL | What was unlocked |
| reward_redemption_id | UUID | | NULL | FK → reward_redemptions (PRD-24) if linked to reward menu |
| brewed_at | TIMESTAMPTZ | now() | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped. Mom reads all. Members read own.

**Indexes:**
- `(family_member_id, overlay_instance_id)` — per-member per-overlay history
- `(family_member_id, brewed_at DESC)` — recent brews

---

### Table: `background_library` (Static/Seed Data)

Reference table for available dashboard backgrounds. Seeded on deployment, not user-created.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | TEXT | | NOT NULL | PK. 'spring_garden', 'outer_space', etc. |
| name | TEXT | | NOT NULL | "Spring Garden" |
| description | TEXT | | NOT NULL | "Soft florals, pastels, watercolor" |
| aesthetic | TEXT | | NOT NULL | For search/filtering |
| age_range_min | INTEGER | 3 | NOT NULL | |
| age_range_max | INTEGER | 16 | NOT NULL | |
| image_desktop | TEXT | | NOT NULL | Asset path for desktop background |
| image_mobile | TEXT | | NOT NULL | Asset path for mobile background |
| image_thumbnail | TEXT | | NOT NULL | Asset path for selector thumbnail |
| celebration_config | JSONB | '{}' | NOT NULL | Background-matched celebration animation definitions. Shape: { small: { element, animation_class, duration_ms }, medium: { ... }, large: { ... } } |
| sort_order | INTEGER | 0 | NOT NULL | Display order in selector |
| is_active | BOOLEAN | true | NOT NULL | Can disable backgrounds without removing |

**RLS Policy:** Read-only for all authenticated users. Admin-only writes (seed data).

---

### Column Additions to Existing Tables

**`gamification_configs` table (PRD-24) — column updates:**

| Column | Change | Notes |
|--------|--------|-------|
| `visual_world_theme` | RENAME to `dashboard_background_key` | Now references background_library.id instead of a Visual World theme |
| `overlay_id` | REMOVE | Replaced by overlay_instances table (supports multiple overlays). Legacy single-overlay column no longer needed. |

**`gamification_daily_summaries` table (PRD-24) — column updates:**

| Column | Change | Notes |
|--------|--------|-------|
| `theme_unlocks_today` | RENAME to `background_change_today` | Simplified — just tracks if background was changed |
| `overlay_progress_today` | No change | JSONB now populated by PRD-24A: `{ overlay_id: { points_earned, stage_changed, collectible_earned, recipes_brewable } }` |

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| PRD-24 (Gamification Event Pipeline, Step 8) | Task completion → pipeline checks for active overlay_instances → routes to overlay engine → points, collectibles, stage checks |
| PRD-09A (Tasks) | Task completion provides task_category which determines which overlay(s) receive credit |
| PRD-22 (Settings) | Overlay configuration changes (category mapping, thresholds, activation/pause) flow from Settings into overlay_instances |
| PRD-24 (Gamification Rewards) | Recipe completion can link to a gamification_reward for the redemption flow |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| PRD-11 (DailyCelebration Step 4) | overlay_collectibles earned today + overlay stage changes feed Step 4 content |
| PRD-10 (Widgets) | Overlay Collection widget (I-17) and Overlay Progress widget (I-16) read from overlay_instances and overlay_collectibles |
| PRD-15 (Requests) | Recipe brews that link to requires-approval rewards create PRD-15 requests |
| PRD-24 (Daily Summaries) | Overlay progress data updates gamification_daily_summaries.overlay_progress_today |

---

## AI Integration

### LiLa Context

When overlays are active for a member, LiLa's context assembly (PRD-05) includes:
- Active overlay names and current stages
- Recent collectibles earned (last 3 days)
- Brewable recipes (if ingredients are sufficient)
- Stage progress (how close to next stage)

This allows LiLa to naturally reference overlays:
- "Your Apothecary is almost at Stage 3 — just 15 more points!"
- "You've collected enough ingredients to brew a Focus Draught. Want to check your recipe book?"
- "Goldie the Golden Retriever was your biggest pet this week — that was a great chore day!"

### No Guided Mode

PRD-24A does not introduce a new LiLa guided mode. Overlay configuration is through Settings UI. LiLa references overlay data contextually.

---

## Edge Cases

### Task Category Mapped to No Overlay
- If a task's category isn't mapped to any active overlay, no overlay points are earned. The task still earns regular gamification points (PRD-24 pipeline Steps 1–7 run normally).

### Task Category Mapped to Multiple Overlays
- Not possible by design. Category conflict rule: each task category can feed exactly one overlay per member. The Setup flow (Screen 4) and Configuration (Screen 5) enforce this.

### All Active Overlays Paused
- If all overlays are paused, no overlay processing happens. The gamification pipeline Step 8 checks for active instances and skips if none found. Points, streaks, and other PRD-24 features continue normally.

### Overlay Activated Mid-Day
- Any tasks completed earlier today (before activation) do NOT retroactively feed the new overlay. The overlay starts earning from the next task completion forward.
- The daily collectible for today is created on the first qualifying task after activation. Its size reflects only the tasks completed after activation.

### Mom Reassigns a Category From One Overlay to Another
- Confirmation dialog: "Moving 'Homework' from Apothecary Workshop to Pet Collector. Future homework tasks will earn pets instead of ingredients. Existing ingredients are kept."
- The change takes effect on the next task completion. No retroactive recalculation.
- Ingredient counts in the old overlay are preserved (they don't disappear).

### Child Has More Overlays Than Task Categories
- Possible but not useful. If a child has 5 overlays but only 5 task categories, each category feeds one overlay. If they activate a 6th overlay, there are no categories left to map. The setup flow shows "No categories available" and suggests pausing another overlay first.

### Recipe Ingredients Insufficient After Category Reassignment
- If mom moves "Homework" away from Apothecary, the child can no longer earn Intelligence ingredients. Existing ingredients remain. Recipes that need Intelligence ingredients become harder to complete but are still achievable if the child already has enough.

### Stage Threshold Override Creates Impossible Progression
- Validation: Stage 2 threshold must be > 0, Stage 3 > Stage 2, Stage 4 > Stage 3. Minimum gap: 10 points per stage.

### Daily Collectible Size Upgrade
- If a child completes 1 task at 9am (Small pet) and 3 more tasks at 3pm (now 4 tasks = Large), the existing daily collectible record is upgraded from Small to Large. The variant (which pet) stays the same — just the size changes.
- The final size shown in DailyCelebration Step 4 reflects the end-of-day state.

### Member Removed
- Cascade delete overlay_instances, overlay_collectibles, recipe_completions, dashboard_backgrounds for that member.

---

## Tier Gating

All features are gated with `useCanAccess()` hooks from day one. No tier assignments are made at this time — all keys return true during beta. Tier assignments will be determined before public launch.

| Feature Key | Description |
|-------------|-------------|
| `gamification_dashboard_backgrounds` | Dashboard background images and celebration animations |
| `gamification_overlays` | Overlay engine, collectibles, stages, collection view |
| `gamification_overlay_recipes` | Recipe/quest combination system |
| `gamification_overlay_theme_{themeId}` | Per-theme gating (e.g., `gamification_overlay_theme_dragons`). Allows individual visual themes to be tier-gated independently. |
| `gamification_mode_{modeId}` | Per-game-mode gating (e.g., `gamification_mode_streak_evolution`). Allows individual game modes to be tier-gated independently. |
| `gamification_boss_battle` | Boss Battle / Party Quest mode |
| `gamification_family_bingo` | Family Bingo mode |
| `gamification_stamp_passport` | Stamp Passport mode |
| `gamification_streak_evolution` | Streak Evolution mode |

All keys return true during beta. The per-theme and per-mode keys allow maximum flexibility at launch — any theme or mode can be moved to any tier without code changes.

---

## Per-Theme Asset Checklist

This is the definitive checklist of every image asset needed per visual theme for all 7 game modes to function. Use this checklist when generating the 8×8 grid manifest for each theme. Some themes may need two grids (128 cells) if the count exceeds 64.

### Required Assets Per Theme (All Game Modes)

**Collectible Icons (for Daily Growth, Category Collection, Recipe/Quest modes):**

| Asset | Count | Notes |
|-------|-------|-------|
| Collectible icons (the items kids earn) | 6–12 | Each theme needs enough variety for mom to map to the child's task categories. Minimum 6 (one per common category). Pets has 12 for variety. |
| Collectible growth progressions (4 stages: baby → toddler → kid → teen) | 4 × per key collectible | For effort mode size display AND for overlays where items visually "age." A small pet is a baby version, a large pet is a teen version. Apothecary: small bottle → medium → large → ornate. Dragons: egg → hatchling → juvenile → elder. |

> **Growth progression detail:** Each collectible can be rendered at 4 maturity levels. These serve double duty — they represent the effort-mode size tiers (small/medium/large/legendary maps to baby/toddler/kid/teen) AND they enable the Streak Evolution mode where a single creature visually grows over time. Not every collectible needs all 4 levels — key collectibles (3–4 per theme) get full growth progressions; the rest use a single image at all sizes (just scaled via CSS multiplier).

**Environment Stage Images (for 4-stage progression):**

| Asset | Count | Notes |
|-------|-------|-------|
| Stage 1 — Starter environment | 1 per art variant | Small, cozy, just beginning |
| Stage 2 — Growing environment | 1 per art variant | Expanded, more features |
| Stage 3 — Thriving environment | 1 per art variant | Impressive, well-developed |
| Stage 4 — Legendary environment | 1 per art variant | Epic, fully realized |
| **Total** | **4 per art variant** | Dragons need 4 cute + 4 ornate = 8 |

**Reveal Containers (for Treasure Box ceremonies):**

| Asset | Count | Notes |
|-------|-------|-------|
| Container type 1 — closed state | 1 | Idle/locked appearance |
| Container type 1 — open state | 1 | Burst open, light streaming out |
| Container type 2 — closed state | 1 | Different container shape |
| Container type 2 — open state | 1 | |
| Container type 3 — closed state | 1 | |
| Container type 3 — open state | 1 | |
| **Total** | **6** | 3 containers × 2 states. Videos generated from closed frames. |

**Boss Battle Assets:**

| Asset | Count | Notes |
|-------|-------|-------|
| Mega boss — healthy phase | 1 | Full HP appearance |
| Mega boss — damaged phase | 1 | Mid-HP, showing wear |
| Mega boss — near-defeat phase | 1 | Low HP, vulnerable |
| Mini boss 1 | 1 | Shorter/easier challenges |
| Mini boss 2 | 1 | |
| Mini boss 3 | 1 | |
| Defeated mega boss | 0 | CSS effect (grayscale + trophy overlay) — no separate image |
| **Total** | **6** | |

> **Positive framing per theme:** Pets bosses are "lost mega-pets to rescue." Dragons are "elder dragons to prove worthy to." Apothecary are "rogue potions to contain." Pixel Loot are classic video game bosses. Never violent/scary for young themes.

**Streak Evolution Assets:**

| Asset | Count | Notes |
|-------|-------|-------|
| Evolution phase 1 — Egg/seed/cocoon | 1 per creature variant | Day 1 appearance |
| Evolution phase 2 — Hatchling/sprout | 1 per creature variant | Day 3 appearance |
| Evolution phase 3 — Juvenile/growing | 1 per creature variant | Day 7 appearance |
| Evolution phase 4 — Adult/mature | 1 per creature variant | Day 14 appearance |
| Evolution phase 5 — Legendary/epic | 1 per creature variant | Day 21 appearance |
| Golden legendary variant | 0 | CSS gold shimmer on phase 5 — no separate image |
| **Total** | **5 per creature variant** | 3–4 variants per theme = 15–20 images |

> **Evolution celebration animation:** The 5 phase images play as a flipbook sequence (CSS animation cycling frames at ~0.5s per frame with a dramatic pause and sparkle on phase 5). No video generation needed — it's CSS over the sliced static images.

**Stamp Passport Assets:**

| Asset | Count | Notes |
|-------|-------|-------|
| Stamp icons (themed) | 6–8 | Paw stamps (Pets), wax seals (Apothecary), claw marks (Dragons), pixel badges (Pixel Loot) |
| **Total** | **6–8** | |

**General Assets:**

| Asset | Count | Notes |
|-------|-------|-------|
| Theme thumbnail | 1 | For the overlay/theme selector UI |
| Spare/expansion cells | Variable | Buffer for future additions |

### Per-Theme Total Cell Count

| Theme | Collectibles | Growth Progressions | Stages | Reveals | Bosses | Evolution | Stamps | Misc | **Total** | **Grids Needed** |
|-------|-------------|-------------------|--------|---------|--------|-----------|--------|------|-----------|-----------------|
| Pets | 12 | 4×4 key = 16 | 4 | 6 | 6 | 5×3 = 15 | 8 | 2 | **69** | **2 grids** |
| Apothecary | 6 | 4×3 key = 12 | 4 | 6 | 6 | 5×3 = 15 | 8 | 2 | **59** | **1 grid** |
| Dragons (cute) | 8 | 4×4 key = 16 | 4 | 6 | 6 | 5×3 = 15 | 8 | 2 | **65** | **2 grids** |
| Dragons (ornate) | 8 | 4×4 key = 16 | 4 | 6 | 6 | 5×3 = 15 | 8 | 2 | **65** | **2 grids** |
| Pixel Loot | 7 | 4×3 key = 12 | 4 | 6 | 6 | 5×3 = 15 | 8 | 2 | **60** | **1 grid** |
| Mythical Creatures | 10 | 4×4 key = 16 | 4 | 6 | 6 | 5×3 = 15 | 8 | 2 | **67** | **2 grids** |
| **Totals** | | | | | | | | | **385 images** | **10 grids** |

> **Multiple grids per theme:** Themes that exceed 64 cells get 2 grids. The second grid uses the same style prompt to maintain consistency. Claude's manifest splits assets across Grid A and Grid B. Pets, Dragons (both variants), and Mythical Creatures need 2 grids; Apothecary and Pixel Loot fit in 1 each.

### Rarity Visual Treatment (Deferred to Asset Generation Phase)

Each `ThemeCollectible` has a `rarity` field ('common', 'uncommon', 'rare', 'legendary') that the engine reads. The **visual treatment** of rarity — how a common vs. legendary collectible looks different — is deferred to the asset generation phase when grids are actually being created. Options include:

- **CSS-only:** All collectibles have one image; rarity is indicated by a colored border/glow effect (common = no border, uncommon = green glow, rare = blue glow, legendary = gold glow + sparkle)
- **Rarity variant images:** Key collectibles get separate images per rarity tier (a common dragon vs. a legendary dragon with crystalline scales)
- **Hybrid:** Most collectibles use CSS glow; a few flagship collectibles per theme get unique rarity art

The grid manifests will account for whichever approach is chosen at generation time. If rarity variants are included, they increase the grid count per theme. The engine supports all three approaches — it reads the rarity field and applies the configured visual treatment.

### Post-MVP: User-Created Theme Content

> **Future vision:** A Manus skill that lets family members create their own visual theme content. The workflow: member generates a 8×8 grid following a template prompt structure → uploads the grid → Manus validates format, slices, and organizes → content goes through quality screening (automated basic checks + admin review) → approved content becomes available for that family → after further screening, high-quality content is added to the public library for other families. This turns the gamification system into a creative platform where artistic kids can contribute to the product. This is firmly post-MVP but the modular architecture (VisualThemeConfig as static config objects + grid-based assets) makes it architecturally feasible.

---

## Visual Asset Manifest

This is the complete inventory of visual assets needed across the entire gamification system (PRD-24, 24A, 24B, 24C). PRD-24A is the authoritative location for this manifest. Each sub-PRD references it rather than maintaining its own partial list.

### Dashboard Backgrounds (PRD-24A Scope)

| Asset | Dimensions | Format | Count | Creation Tool |
|-------|-----------|--------|-------|--------------|
| Desktop background | 2048 × 1024 | PNG/WebP | 13 | Nano Banana Pro / Midjourney |
| Mobile background | 1024 × 2048 | PNG/WebP | 13 | Nano Banana Pro / Midjourney |
| Selector thumbnail | 256 × 256 | PNG | 13 | Cropped from desktop |
| **Subtotal** | | | **39 images** | |

**Background List (all 13):** Spring Garden, Outer Space, Ocean Deep, Enchanted Forest, Steampunk Workshop, Desert Adventure, Arctic Tundra, Volcano Isle, Candy Land, Medieval Kingdom, City Skyline, Prehistoric Jungle, Enchanted Cottage.

### Overlay Stage Images (PRD-24A Scope)

| Asset | Dimensions | Format | Count | Creation Tool |
|-------|-----------|--------|-------|--------------|
| Stage image (per theme, 4 stages) | 512 × 512 | PNG (transparent background) | 4 per theme per art variant | Nano Banana Pro / Midjourney |
| Overlay thumbnail | 256 × 256 | PNG | 1 per theme | Cropped from Stage 2 |
| **Launch (4 themes: Pets 4, Apothecary 4, Dragons cute 4 + ornate 4, Pixel Loot 4)** | | | **24 images** | |
| **All 10 overlays (future)** | | | **50 images** | |

### Overlay Collectible Icons (PRD-24A Scope)

| Asset | Dimensions | Format | Count | Creation Tool |
|-------|-----------|--------|-------|--------------|
| Pet icons | 128 × 128 | PNG (transparent) | 12 | Nano Banana grid (4×3) → Image Cutter |
| Apothecary bottle icons | 128 × 128 | PNG (transparent) | 6 | Nano Banana grid (3×2) → Image Cutter |
| Dragon icons — cute variant | 128 × 128 | PNG (transparent) | 8 | Nano Banana grid (4×2) → Image Cutter |
| Dragon icons — ornate variant | 128 × 128 | PNG (transparent) | 8 | Nano Banana grid (4×2) → Image Cutter |
| Pixel Loot icons (8-bit style) | 128 × 128 | PNG (transparent) | 7 | Nano Banana grid (4×2) → Image Cutter |
| **Launch subtotal** | | | **41 icons** | |
| **Future overlays (estimated)** | | | **~80 more icons** | |

### Background Celebration Animation Assets (PRD-24A Scope)

| Asset | Type | Count | Creation Tool |
|-------|------|-------|--------------|
| Per-background SVG animation elements (3 per background × 3 tiers = 9 per background) | SVG path data + CSS keyframes | 13 backgrounds × 3 small + 3 medium + 3 large = **117 animation variants** (39 unique elements × 3 tiers) | Code-built (CSS/SVG). Simple silhouette/outline shapes animated via CSS keyframes. |
| Particle/sparkle sprites for milestone celebrations | SVG/CSS | 4 sets (ocean, space, nature, fantasy) | Code-built |
| **Subtotal** | | **~43 animation definitions** | |

> **Note:** Background celebrations are CSS/SVG code, not raster images. Each is a small SVG element + CSS keyframe animation. The 39 count represents unique animation definitions, not image files. These are authored by the developer, not generated by the image pipeline.

### Themed Reveal Container Assets (PRD-24 + PRD-24A — Replaces Generic Templates)

PRD-24 originally defined 10 generic treasure box animation templates (pirate, princess, medieval, etc.). These are now **replaced by per-theme reveal containers** that match the child's active visual theme. Each visual theme defines 3 reveal container types. The poster frame (idle/closed state) is generated as part of the theme's image grid and serves as frame 1 of the reveal video.

| Asset | Resolution | Format | Count | Creation Tool |
|-------|-----------|--------|-------|--------------|
| Poster frame / idle state (per container) | 512×512 | PNG | 3 per theme × 4 themes = **12** | Nano Banana grid (3×4 grid: all 4 themes' containers in one batch) → Image Cutter |
| Reveal video (per container) | 1080p | WebM + MP4 | 12 (poster frame → AI video gen) | Manus: poster frame as input → AI video generation |
| **Subtotal** | | | **12 images + 24 videos = 36 files** | |

**Per-theme container types:**

| Theme | Container 1 | Container 2 | Container 3 |
|-------|------------|------------|------------|
| Pets | Pet Carrier (opens, pet jumps out) | Mystery Egg (cracks, hatches) | Paw Print Gift Box (unwraps) |
| Apothecary | Sealed Potion Crate (lid bursts) | Bubbling Cauldron (erupts) | Mystery Bottle (uncorks, glows) |
| Dragons | Dragon Egg (cracks, baby emerges) | Treasure Hoard (gold avalanche reveals) | Dragon-Wrapped Gift (flame-melts ribbon) |
| Pixel Loot | 8-Bit Treasure Chest (classic open) | Mystery Block (hit, item pops out) | Pixel Slot Machine (reels spin, land) |

**Pipeline:** Generate a 3×4 grid of all 12 poster frames in one Nano Banana batch (consistent lighting/style). Slice into individual images. Feed each as the starting frame to AI video generation for the reveal animation. Each video is 3–5 seconds: idle → anticipation wobble → dramatic open → sparkle burst → reward reveal space.

> **PRD-24 impact:** The `treasure_box_template` field on `gamification_configs` (PRD-24 Screen 8, Section I) changes from a fixed list (pirate, princess, medieval...) to **auto-derived from the active visual theme**. Mom still picks which of the theme's 3 container types to use for each treasure box, but the options are always theme-consistent. If no overlay is active, a set of 3 generic containers is available as fallback.

### CSS/SVG Interactive Reveal Assets (PRD-24B Scope — Manifest Only)

| Asset | Type | Count | Creation Tool |
|-------|------|-------|--------------|
| Spinner wheel SVG template | SVG path data | 1 base + color tokens | Code-built (CSS/SVG) |
| Three doors SVG template | SVG path data | 1 base + color tokens | Code-built (CSS/SVG) |
| Card flip CSS template | CSS animation | 1 base + color tokens | Code-built (CSS) |
| Scratch-off canvas texture | PNG pattern | 4 (one per aesthetic set) | Nano Banana |
| **Subtotal** | | **~8 assets** | |

### Achievement Badge Icons (PRD-24 Scope — Manifest Only)

| Asset | Dimensions | Format | Count | Creation Tool |
|-------|-----------|--------|-------|--------------|
| Streak milestone badges (7, 14, 21, 30, 60, 90) | 64 × 64 | PNG | 6 | Nano Banana grid (3×2) → Cutter |
| Task milestone badges (10, 50, 100, 500, 1000) | 64 × 64 | PNG | 5 | Nano Banana grid (3×2) → Cutter |
| Perfect week/month badges | 64 × 64 | PNG | 2 | Nano Banana grid |
| Overlay stage completion badges (per overlay) | 64 × 64 | PNG | 4 per overlay (8 launch) | Nano Banana grid |
| Level-up badges | 64 × 64 | PNG | 10 (levels 1–10) | Nano Banana grid |
| **Launch subtotal** | | | **31 badges** | |

### Color-Reveal Library (PRD-24B Scope — Manifest Only)

| Asset | Dimensions | Format | Count | Creation Tool |
|-------|-----------|--------|-------|--------------|
| Full-color source image | 1024 × 1024 | PNG | 20 minimum | Nano Banana / Midjourney |
| Color zone map | JSON | JSON | 20 | Claude-generated from source image analysis |
| Line art version (printable) | 1024 × 1024 | PNG | 20 | AI generation or edge detection |
| **Subtotal** | | | **60 files** | |

### Grand Total (Launch)

| Category | Source | Count |
|----------|--------|-------|
| Theme asset grids (10 grids across 5 themes + variants) | 8×8 grid gen + slice | ~385 usable images |
| Dashboard backgrounds | Individual prompts / Midjourney | 39 images (13 × 3 sizes) |
| Achievement badges | 8×8 grid gen + slice | 31 badges |
| Background celebration animations | Code-built CSS/SVG | ~39 elements × 3 tiers |
| CSS/SVG reveal assets | Code-built | 8 definitions |
| Reveal container videos | AI video from poster frames | ~18 videos |
| Color-reveal library (PRD-24B) | Nano Banana / Midjourney | 60 files |
| **TOTAL** | **11 grids + individual prompts + video gen** | **~455 images + ~18 videos + ~125 CSS/animation defs** |

> **Pipeline time estimate: ~4 hours** for all image assets. The 8×8 grid approach means 10 theme grids + 1 badge grid = 11 total grid generations, plus dashboard backgrounds and video generation.

---

## Content Creation Pipeline

The Content Creation Pipeline is the repeatable process for batch-generating visual assets. It was validated during PRD-24 development when 7 treasure box animation templates were successfully batch-created in one session.

### Core Principle: One 8×8 Grid Per Visual Theme

Each visual theme's entire asset set is generated in a **single 8×8 grid** (64 images). This grid contains every visual element the theme needs: all collectible icons, all stage images, all reveal container states (closed + open), all boss images, all evolution phases, and any supplementary elements. One prompt, one generation, one consistent style across all 64 assets.

After generation, the grid is sliced into 64 individual images using the Image Cutter. Each image is named and filed into the theme's asset folder. Any image that needs animation (reveal containers opening, evolution sequences) can be animated later — either via AI video generation from the poster frame, or manually by a human animator.

### Four-Step Pipeline

**Step 1 — Claude Generates a 64-Image Manifest Per Theme**

For each visual theme, Claude generates a structured JSON manifest that maps every cell in the 8×8 grid to a specific asset. The manifest includes the cell position (row, column), the asset name, a detailed prompt description for that cell, and the destination filename after slicing.

```json
{
  "theme": "pets",
  "grid_size": "8x8",
  "style_prompt": "Cute Pixar-style, soft lighting, transparent background, consistent cartoon style across all cells",
  "cells": [
    { "row": 1, "col": 1, "asset_id": "pet_golden_retriever", "prompt": "Golden retriever puppy, sitting, happy face, wagging tail", "filename": "pets/collectibles/golden_retriever.png" },
    { "row": 1, "col": 2, "asset_id": "pet_hamster", "prompt": "Hamster, chubby cheeks, holding a seed, cute eyes", "filename": "pets/collectibles/hamster.png" },
    { "row": 1, "col": 3, "asset_id": "pet_tabby_cat", "prompt": "Tabby cat, sitting, curled tail, gentle expression", "filename": "pets/collectibles/tabby_cat.png" },
    "... (rows 1-2: 12 collectible pet icons)",
    { "row": 2, "col": 5, "asset_id": "pets_stage_1", "prompt": "Small pet shelter, 3 pet beds, food bowl, cozy corner, aerial view", "filename": "pets/stages/stage_1.png" },
    "... (row 2 cols 5-8: 4 stage images)",
    { "row": 3, "col": 1, "asset_id": "pets_reveal_carrier_closed", "prompt": "Pet carrier, closed, paw print decorations, slightly glowing", "filename": "pets/reveals/carrier_closed.png" },
    { "row": 3, "col": 2, "asset_id": "pets_reveal_carrier_open", "prompt": "Pet carrier, lid open, golden light streaming out, sparkles", "filename": "pets/reveals/carrier_open.png" },
    "... (row 3: 3 containers × 2 states = 6 reveal images)",
    { "row": 4, "col": 1, "asset_id": "pets_boss_mega_healthy", "prompt": "Giant adorable lost puppy, big sad eyes, holding a map upside down", "filename": "pets/bosses/mega_healthy.png" },
    "... (rows 4-5: boss images + stamps)",
    { "row": 6, "col": 1, "asset_id": "pets_evolution_egg", "prompt": "Warm speckled egg in a nest, glowing softly", "filename": "pets/evolution/phase_1_egg.png" },
    "... (rows 6-7: evolution phases × creature variants)",
    { "row": 8, "col": 1, "asset_id": "pets_thumbnail", "prompt": "Pets theme logo/icon, group of cute animals together", "filename": "pets/thumbnail.png" },
    "... (row 8: thumbnail + spare cells for future expansion)"
  ]
}
```

**Example grid layout for the Pets theme (8×8 = 64 cells):**

| Row | Cells 1–8 | Purpose |
|-----|-----------|---------|
| 1 | Pet collectible icons 1–8 | Daily collectibles, collection view |
| 2 | Pet collectible icons 9–12 + 4 stage images | Collectibles + environment evolution |
| 3 | 3 reveal containers × 2 states (closed + open) + 2 spare | Treasure box ceremonies |
| 4 | 3 boss images (mega phases) + 3 mini bosses + 2 spare | Boss Battle mode |
| 5 | Defeated boss + 7 stamp icons | Boss victory + Stamp Passport |
| 6 | Evolution phases: 5 phases × ~1.5 creature variants (8 cells) | Streak Evolution mode |
| 7 | Evolution phases continued (8 more cells) | Streak Evolution mode |
| 8 | Theme thumbnail + spare cells for future expansion | Selector UI + buffer |

> **Note:** The exact cell layout is optimized per theme by Claude when generating the manifest. Some themes need more collectible slots (Pets has 12), some need evolution phases for two art variants (Dragons requires two full grids — cute and ornate). The 8×8 grid provides 64 cells, and most themes use 45–55 of them, leaving room for future additions without regenerating the entire grid.

**Step 2 — Manus Batch-Executes**

Manus receives the manifest and for each theme:
1. Constructs the full 8×8 grid prompt from the style prompt + all 64 cell descriptions
2. Generates the grid via Nano Banana Pro (or ChatGPT image gen)
3. Runs the Image Cutter (Hugging Face: `airabbitX/image-cutter`) with 8×8 grid selection to slice into 64 individual images
4. Names each sliced image according to the manifest's filename mapping
5. Organizes into the theme's folder structure

**Step 3 — Animate Reveal Containers**

For each reveal container's "closed" poster frame image:
- Feed the poster frame into AI video generation (via Manus)
- Generate a 3–5 second reveal animation: idle → wobble → dramatic open → sparkle burst
- Output as WebM (primary) + MP4 (fallback)

> **Future option:** Instead of AI video generation, a human animator (one of Tenise's kids) can create the animations from the sliced static images — hand-animating the open sequence using the closed and open state images as key frames. This produces higher quality results and is a fun project.

**Step 4 — Manus Packages and Uploads**

Manus organizes the complete asset package and uploads to the project repository via Claude Code:
1. All sliced images filed into the correct folder structure
2. All generated videos filed alongside their poster frames
3. An asset manifest JSON generated listing every file, its dimensions, and its purpose
4. The original 8×8 grid source images preserved for reference
5. Package uploaded to VS Code project via Claude Code

```
/assets/
  /themes/
    /pets/
      grid_source.png              ← The original 8×8 grid (kept for reference)
      manifest.json                ← Maps cell positions to asset files
      /collectibles/
        golden_retriever.png
        hamster.png
        tabby_cat.png
        ...                        ← 12 pet icons
      /stages/
        stage_1.png
        stage_2.png
        stage_3.png
        stage_4.png
      /reveals/
        carrier_closed.png
        carrier_open.png
        carrier_reveal.webm
        carrier_reveal.mp4
        egg_closed.png
        egg_open.png
        egg_reveal.webm
        egg_reveal.mp4
        gift_closed.png
        gift_open.png
        gift_reveal.webm
        gift_reveal.mp4
      /bosses/
        mega_healthy.png
        mega_damaged.png
        mega_near_defeat.png
        mini_1.png
        mini_2.png
        mini_3.png
      /evolution/
        phase_1_egg.png
        phase_2_hatchling.png
        phase_3_juvenile.png
        phase_4_adult.png
        phase_5_legendary.png
        ... (× creature variants)
      /stamps/
        stamp_1.png through stamp_8.png
      thumbnail.png
    /apothecary_bottles/
      grid_source.png
      manifest.json
      ...                          ← Same structure
    /dragons/
      /cute/
        grid_source.png            ← Cute variant gets its own 8×8 grid
        manifest.json
        ...
      /ornate/
        grid_source.png            ← Ornate variant gets its own 8×8 grid
        manifest.json
        ...
    /pixel_loot/
      grid_source.png
      manifest.json
      ...
  /backgrounds/
    spring_garden_desktop.png
    spring_garden_mobile.png
    spring_garden_thumb.png
    ...                            ← 13 backgrounds × 3 sizes = 39
  /badges/
    grid_source.png                ← Achievement badges as one 8×8 grid
    streak_7.png through streak_90.png
    task_10.png through task_1000.png
    ...                            ← 31 badge icons
```

### Pipeline Tools

| Tool | Use Case | Access |
|------|----------|--------|
| Nano Banana Pro | 8×8 grid generation per theme. One prompt produces all 64 assets with consistent style. | Subscription — direct use or via Manus |
| ChatGPT Image Gen | Alternative grid generation. Similar quality for structured grids. | ChatGPT Plus subscription |
| Midjourney | Hero assets (dashboard backgrounds) where artistic quality matters most. | Subscription |
| Image Cutter (Hugging Face) | Grid slicing. Free tool at `airabbitX/image-cutter`. Upload 8×8 grid, select 8×8, download 64 individual tiles. | Free — web tool |
| Manus | Full pipeline orchestration: prompt construction → grid generation → slicing → naming → video generation → folder organization → Claude Code upload. | Existing access |
| Claude Code | Receives the packaged assets from Manus and integrates into the VS Code project repository. | Existing access |

### Batch Summary

| Batch | Type | Items Produced | Estimated Time |
|-------|------|---------------|---------------|
| Pets theme — Grid A + B | Grid gen + slice | ~69 images | ~20 min |
| Apothecary theme — one grid | Grid gen + slice | ~59 images | ~10 min |
| Dragons cute — Grid A + B | Grid gen + slice | ~65 images | ~20 min |
| Dragons ornate — Grid A + B | Grid gen + slice | ~65 images | ~20 min |
| Pixel Loot theme — one grid | Grid gen + slice | ~60 images | ~10 min |
| Mythical Creatures — Grid A + B | Grid gen + slice | ~67 images | ~20 min |
| Achievement badges — one grid | Grid gen + slice | 31 badges | ~10 min |
| Dashboard backgrounds (13 desktop) | Individual prompts | 13 | ~30 min |
| Dashboard backgrounds (13 mobile) | Individual prompts | 13 | ~30 min |
| Reveal container videos (from poster frames) | AI video gen | ~18 videos | ~60 min |
| **Total pipeline** | **10 theme grids + 1 badge grid + backgrounds + videos** | **~385 theme images + 31 badges + 39 backgrounds + ~18 videos** | **~4 hours** |

> **Key advantage:** Style consistency. Every image in a theme's grid is generated in one prompt with the same style instructions. A pet collectible, a stage image, a boss, and an evolution phase all share identical lighting, line weight, color palette, and artistic style because they were born in the same generation. This is impossible to achieve across separate prompts.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Additional overlay configs (Dragon Collection, Kingdom Builder, Monster Army, etc.) | New OverlayConfig objects + generated assets | Post-MVP content expansion |
| Random events in OverlayConfig.advancedFeatures | Streak-triggered narrative events within overlays | Post-MVP |
| Upgrade chains in OverlayConfig.advancedFeatures | Building upgrade paths (Kingdom Builder) | Post-MVP |
| Color-reveal images tied to overlay themes | Overlay-themed color-reveal image library | PRD-24B |
| Family challenge overlay contribution tracking | Overlay collectible counts as challenge contributions | PRD-24C |
| Overlay-to-Visual-World visual adaptation (brass cauldrons on Steampunk, wooden on Forest) | Per-background overlay art variants | Post-MVP content expansion (documented as future vision) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Visual World theme selection in Settings Screen 8, Section H | PRD-24 | Replaced by Dashboard Background selector (Screen 2) + Overlay selector (Screen 3) in the gamification Settings panel |
| Overlay selection in Settings Screen 8 | PRD-24 | Wired as the Overlay Selector (Screen 3) with multi-overlay support and category mapping |
| `visual_world_theme` and `overlay_id` columns on gamification_configs | PRD-24 | `visual_world_theme` renamed to `dashboard_background_key`. `overlay_id` removed, replaced by `overlay_instances` table. |
| `theme_unlocks_today` and `overlay_progress_today` on daily summaries | PRD-24 | `theme_unlocks_today` renamed to `background_change_today`. `overlay_progress_today` populated with per-overlay progress JSONB. |
| Event pipeline steps 8-9 (overlay progress, theme progress) | PRD-24 | Step 8 fully specified: category → overlay routing → points → collectible → stage check → recipe check. Step 9 removed (no theme progress tracking). |
| DailyCelebration Step 4 theme progress display | PRD-24 / PRD-11 | Fully specified: Sub-step A (collectible reveal per overlay), Sub-step B (stage evolution if applicable), Sub-step C (points summary). |
| Gamification approach modules (Dragon, Star Jar, Achievement Board) | PRD-11 | The overlay engine IS the approach module system. Each overlay is a "module." Pet Collector = the "Star Jar" equivalent. Apothecary = the "Achievement Board" equivalent. The engine replaces the need for separately coded approach modules. |
| Gamification system templates in Studio "Coming Soon" | PRD-09B | Overlay configs are the "templates." Studio can display available overlays as template cards. Activation goes through the overlay setup flow. |
| Widget Catalog I-16 (Visual World Progress) | Widget Catalog | Now "Overlay Progress" — shows current stage + progress bar for an active overlay |
| Widget Catalog I-17 (Overlay Collection Display) | Widget Catalog | Wired as the Collection View Widget (Screen 6) — daily collectible gallery per overlay |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `dashboard_backgrounds` table created with per-member background config
- [ ] `background_library` table seeded with all 13 backgrounds
- [ ] `overlay_instances` table created with multi-overlay-per-member support
- [ ] `overlay_collectibles` table created with daily collectible records
- [ ] `recipe_completions` table created
- [ ] `gamification_configs.visual_world_theme` renamed to `dashboard_background_key`
- [ ] `gamification_configs.overlay_id` column removed
- [ ] `gamification_daily_summaries.theme_unlocks_today` renamed to `background_change_today`
- [ ] Background selector (Screen 2) renders all 13 backgrounds with preview
- [ ] Background applied to dashboard with readability gradient overlay
- [ ] Self-select toggle working (mom-assigned vs child-chooses)
- [ ] Background celebration animations: 13 backgrounds × 3 tiers (small/medium/large) = 39 CSS/SVG animation definitions
- [ ] Background celebrations fire on task completion (small), 3rd task (medium), 5th+ task (large), routine complete (medium)
- [ ] Background celebrations respect shell animation tokens (Play bounciest, Guided moderate, Independent subtle, Adult off by default)
- [ ] Overlay selector (Screen 3) showing active, available, and paused overlays
- [ ] Overlay setup flow (Screen 4) with category mapping and conflict prevention
- [ ] Overlay configuration (Screen 5) with all sections
- [ ] Category conflict rule enforced: one category → one overlay per member
- [ ] Multi-overlay configuration flag: architecture supports both single and multiple active overlays, togglable without schema change
- [ ] Overlay pause/resume preserving all progress
- [ ] Overlay reset with confirmation deleting instance data
- [ ] Gamification event pipeline Step 8 wired: task → category → overlay → points → collectible → stage check
- [ ] Pipeline Step 9 removed (no theme progress)
- [ ] **Effort mode collectibles** (Pet Collector): daily collectible created on first qualifying task, upgraded on subsequent tasks, sized by task count
- [ ] **Category mode collectibles** (Apothecary, Video Game Quest): collectible earned when ALL tasks in a mapped category are completed for the day
- [ ] Category mode: partial completion does NOT earn a collectible
- [ ] Collection View Widget (Screen 6) in M/L sizes — effort mode shows sized calendar, category mode shows icon rows
- [ ] Collection Detail Modal (Screen 7) with tap-to-inspect, month navigation
- [ ] Overlay stage progression: 4 stages, point-threshold-based, stage image displayed
- [ ] Stage threshold override (Relaxed/Standard/Ambitious/Custom) working
- [ ] Pet Collector overlay config fully implemented with 12 pet variants (effort mode)
- [ ] Apothecary Workshop overlay config fully implemented with 6 bottle types (category mode)
- [ ] Dragons overlay config fully implemented with 8 dragon variants × 2 art variants (cute + ornate)
- [ ] Pixel Loot overlay config fully implemented with 7 loot types (category mode, 8-bit pixel aesthetic)
- [ ] VisualThemeConfig and GameModeConfig interfaces implemented as static TypeScript config files
- [ ] Any visual theme works with any game mode — modular combination at overlay creation time
- [ ] Category mapping auto-populates from child's actual task categories, mom reviews and adjusts
- [ ] Dragon art variant selection (cute vs. ornate) working — mom picks per child
- [ ] Recipe/quest combination system: collectible tracking, recipe book / quest log UI, brew/complete action
- [ ] Recipe brew creates reward_redemptions record when linked to reward
- [ ] Recipe cooldown enforcement
- [ ] DailyCelebration Step 4 wired: Sub-step A (collectible reveal), B (stage evolution), C (points summary)
- [ ] Step 4 renders per-shell (Play maximum animation, Guided moderate, Independent clean)
- [ ] Step 4 handles multiple active overlays (sequential reveals)
- [ ] Step 4 skips Sub-step B when no stage change occurred
- [ ] All 13 dashboard background images generated and deployed (desktop + mobile + thumbnail = 39 files)
- [ ] Pet Collector stage images (4) and pet icons (12) generated and deployed
- [ ] Apothecary stage images (4) and bottle icons (5) + brewed potion icons (3) generated and deployed
- [ ] Video Game Quest stage images (4, 8-bit pixel style) and loot icons (5) + quest badge icons (3, 8-bit pixel style) generated and deployed
- [ ] RLS on all tables: family-scoped, mom reads all, members read own
- [ ] `useCanAccess()` hooks wired for `gamification_dashboard_backgrounds`, `gamification_overlays`, `gamification_overlay_recipes` (all return true during beta)

### MVP When Dependency Is Ready
- [ ] Collection View Widget registered in PRD-10 widget type registry (requires PRD-10)
- [ ] Overlay Progress Widget (I-16) wired to overlay_instances (requires PRD-10)
- [ ] Recipe brew linked to PRD-24 reward_redemptions creates PRD-15 request when requires_approval (requires PRD-15)

### Post-MVP
- [ ] Additional overlay configs: Dragon Collection, Kingdom Builder, Monster Army, Garden Grower, etc.
- [ ] Random events (streak-triggered overlay narrative events)
- [ ] Upgrade chains (building progression in Kingdom Builder)
- [ ] Overlay-to-background visual adaptation (per-background overlay art variants)
- [ ] Color-reveal images themed to overlay aesthetics
- [ ] Custom overlay creation by mom (pick collectible types, set stages, upload images)
- [ ] Overlay sharing between families (export/import overlay configs)
- [ ] Recipe templates for family challenges (combined family ingredient collection → family reward)
- [ ] Animated stage evolution (smooth morph between stage images rather than crossfade)
- [ ] Background parallax scrolling effect on mobile
- [ ] Seasonal backgrounds (holiday-themed additions to the library)

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: Dashboard backgrounds are cosmetic images with readability gradient overlays AND matched celebration animations. Each background defines 3 tiers of CSS/SVG celebration (small/medium/large) that fire on task completion events.
- [ ] Convention: Background celebrations: small animation fires on every task completion, medium on 3rd daily task and routine completion, large on 5th+ task (Perfect Day). Animations are non-blocking, 2–4 seconds, respect shell animation tokens.
- [ ] Convention: Dashboard backgrounds are independent of PRD-03 color themes. A member can have any background with any theme. Backgrounds provide the image + celebrations; themes provide the colors for cards, text, and UI elements.
- [ ] Convention: Each task category feeds exactly ONE overlay per member. This is enforced in the overlay setup flow and configuration UI. No double-counting.
- [ ] Convention: Multi-overlay support is architecture-ready for both single and multiple active overlays. The `multi_overlay_enabled` flag on the family config determines the mode. Schema works identically either way.
- [ ] Convention: Overlay configs are static TypeScript objects in the codebase. Adding a new overlay is creating a new `OverlayConfig` + generating images, not changing engine code.
- [ ] Convention: **Two collectible modes.** Effort mode: one collectible per day, sized by task count (Pet Collector). Category mode: one collectible per completed task category per day — ALL tasks in the category must be done to earn it (Apothecary, Video Game Quest). Mode is set per overlay in the `OverlayConfig.collectibleMode` field.
- [ ] Convention: Category mode collectibles require completing ALL assigned tasks in that category for the day. Partial completion earns nothing. This is by design — each bottle/item represents mastery of a full responsibility area.
- [ ] Convention: Overlay progress is saved independently per overlay instance. Pausing preserves all data. Switching backgrounds has no effect on overlay progress. Points and streaks are overlay-independent (they come from PRD-24's foundation).
- [ ] Convention: Recipe/quest combinations consume collectibles from `overlay_instances.ingredient_counts`. Ingredients are decremented on brew/complete. Cooldown is enforced per recipe.
- [ ] Convention: DailyCelebration Step 4 renders sequentially for active overlays: Sub-step A per overlay (collectible reveal), then Sub-step B if any stage changed, then Sub-step C (points). Play shell gets maximum animation per reveal; Guided condenses if 2+ overlays.
- [ ] Convention: Pipeline Step 9 (theme progress) from PRD-24 is removed. Dashboard backgrounds have no progress tracking.
- [ ] Convention: Video Game Quest uses 8-bit pixel retro aesthetic for all assets. Stage images, loot icons, and quest badges must maintain consistent pixel art style.
- [ ] Convention: Treasure box, egg, gift box, and slot machine reveal containers are **themed to the active visual theme**, not generic. Each VisualThemeConfig defines 3 `revealContainers` with poster frames and video keys. PRD-24's generic templates (pirate, princess, medieval, etc.) are replaced. If no overlay is active, 3 generic fallback containers are used.
- [ ] Convention: Reveal container poster frames are generated as part of the theme's 8×8 image grid (closed + open states as separate cells) and serve as frame 1 of the AI-generated reveal video. Same grid produces all theme assets with consistent style.
- [ ] Convention: Content Creation Pipeline uses one 8×8 grid per visual theme. All assets for a theme (collectibles, stages, reveals, bosses, evolution phases, stamps) are generated in a single grid prompt for maximum style consistency. Manus orchestrates: grid gen → Image Cutter slice → naming → video gen → folder organization → upload to VS Code via Claude Code.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `dashboard_backgrounds`, `overlay_instances`, `overlay_collectibles`, `recipe_completions`, `background_library`

Tables modified:
- `gamification_configs`: `visual_world_theme` → renamed to `dashboard_background_key`; `overlay_id` → removed
- `gamification_daily_summaries`: `theme_unlocks_today` → renamed to `background_change_today`

Triggers added:
- AFTER INSERT/UPDATE on `overlay_collectibles` → update `overlay_instances.ingredient_counts` (increment collectible type count)
- AFTER INSERT/UPDATE on `overlay_instances` where `current_stage` changes → add to `gamification_daily_summaries.overlay_progress_today`
- AFTER INSERT on `recipe_completions` → decrement `overlay_instances.ingredient_counts` by ingredients used

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **"Visual Worlds" simplified to cosmetic dashboard backgrounds with matched celebration animations.** No CSS token override sets, no theme-specific progression tracking. Backgrounds are decorative images + themed micro-celebrations on task completion. | Reduces complexity while keeping backgrounds feeling alive. A dolphin jumping across the screen when you complete a task on the Ocean background makes the background feel responsive, not just wallpaper. |
| 2 | **Background celebrations: small on every task, big on milestones.** Every task completion triggers a small themed animation (fish swims by). 3rd task, 5th+ task, and routine complete trigger medium/large animations (whale breaches). | Constant positive reinforcement without being overwhelming. Milestones feel genuinely special. |
| 3 | **PRD-24A renamed from "Visual Worlds & Overlay Engine" to "Overlay Engine & Gamification Visuals."** | Reflects actual scope after Visual Worlds simplification. The overlay engine is the primary system in this PRD. |
| 4 | **Multi-overlay architecture supports both single and multiple active, configurable via flag.** Decision on whether kids can have multiple active overlays deferred. Schema and engine work either way. | Avoids premature commitment. Can launch with one active and open to multiple based on user feedback, or vice versa, without code changes. |
| 5 | **Two collectible modes: effort and category.** Effort mode (Pet Collector): one collectible per day, sized by task count. Category mode (Apothecary, Video Game Quest): one collectible earned per completed task category per day. | Different overlays should feel like different games. Pet Collector is about volume of effort. Apothecary is about completing whole responsibility areas. Each creates a distinct motivational mechanic. |
| 6 | **Category mode requires completing ALL tasks in a category to earn the collectible.** No partial credit. | "I finished ALL my schoolwork" is more meaningful than "I did 3 of 5 homework tasks." The bottle represents mastery of that day's responsibility, not a drip feed. Makes each bottle feel truly earned. |
| 7 | **Apothecary bottles are visually distinct by category.** Red round = schoolwork, blue tall = chores, green flask = reading, pink heart = kindness, gold star = exercise. | Visual distinctiveness makes the collection beautiful and the recipe system intuitive. "I need 10 red and 10 blue" is clearer than "10 intelligence ingredients and 10 energy ingredients." |
| 8 | **5 launch visual themes: Pets, Apothecary Bottles, Dragons, Pixel Loot, Mythical Creatures.** | Pets: real animals, ages 4–10. Apothecary: potion bottles, ages 8–16. Dragons: cute/ornate variants, ages 4–16. Pixel Loot: 8-bit retro, ages 7–14. Mythical Creatures: fantasy beings (unicorns, phoenixes, griffins), ages 6–14. Five themes covers every kid personality and age range. |
| 9 | **Video Game Quest uses 8-bit pixel retro aesthetic (Zelda/Mario style).** | Strong nostalgic appeal for parents, universal "cool" factor for kids. 8-bit pixel art is also very efficient to generate in the asset pipeline — grid generation produces highly consistent results with pixel art. |
| 10 | **Mythical Creatures split from Pets as its own theme.** Unicorns, phoenixes, griffins, etc. get their own stages (Enchanted Grove → Crystal Cave → Floating Island → Legendary Realm) rather than living awkwardly inside a "pet" theme. | A golden retriever and a unicorn don't belong in the same collection — different vibes, different stage environments, different audience appeal. Splitting makes each theme's identity crystal clear. One extra grid (~10 min pipeline time) for a whole new theme. |
| 11 | **Legendary/rare collectibles as Perfect Day prizes.** When a kid completes ALL tasks for the day, they earn a top-rarity collectible instead of a normal one. In Pets: rare red panda. In Mythical Creatures: legendary phoenix. | Creates a special-feeling reward for the best days without requiring a separate mechanic. Rarity tiers serve double duty — visual variety AND motivational hierarchy. |
| 10 | **4-stage overlay progression AND daily collectibles coexist.** Stages are long-term (weeks/months). Daily collectibles are immediate (today). Both feed from the same task completions. | Two motivational timescales: "what did I earn today?" (daily collectible) and "how far have I come?" (stage progression). Both contribute to the feeling of growth. |
| 11 | **Recipe combinations included at launch for Apothecary and Video Game Quest.** Collect category bottles/loot → combine → unlock reward. | Adds depth for older kids. Creates a quest-like mechanic that ties directly into the reward economy. Validates the engine's advanced features system across two overlays. |
| 12 | **13 dashboard backgrounds at launch.** Full catalog from the Gamification Master Manuscript. | Backgrounds are cheap to generate (image pipeline handles them in ~1 hour total). More options = more personalization. |
| 13 | **Overlay visual independence from dashboard backgrounds.** Overlay art (pets, bottles, stage images) does not adapt to the dashboard background aesthetic. | Massively reduces asset count. Overlay art stands on its own. Theme adaptation (brass cauldrons on Steampunk, etc.) is documented as a future vision for post-MVP content expansion. |
| 14 | **Content Creation Pipeline uses Nano Banana grids + Image Cutter.** Grid generation for consistent multi-item batches, sliced into individual assets. Manus orchestrates batch execution. | Proven workflow (treasure box videos validated it). Grid approach dramatically reduces time for icon/collectible generation. The Hugging Face Image Cutter is free and handles the slicing. 8-bit pixel art for Video Game Quest is especially well-suited to grid generation. |
| 15 | **Overlay progress saves independently. Pausing preserves everything. Points and streaks are overlay-independent.** | Points are the gamification currency (PRD-24). Overlays are the narrative layer on top. A child's 287 stars don't change when they pause Pet Collector. Their streak is about task consistency, not overlay state. Clean separation. |
| 16 | **Gamification pipeline Step 9 (theme progress) removed.** Dashboard backgrounds are cosmetic and have no progress model. | Simplification. The overlay progression IS the gamification visual progression. No need for a separate "theme progress" system. |
| 17 | **Background self-selection configurable per child by mom.** Mom can allow the child to pick their own background, or mom assigns it. | Some kids should choose their own space. Some kids (especially young Play-mode kids) should have mom pick. Mom decides per child. |
| 18 | **Each overlay can work differently from the others.** The collectible mode (effort vs. category) and advanced features (recipes, quests) are per-overlay config. The engine is generic but each overlay's game feel is unique. | The whole point is that different overlays feel like different games. A pet game, a potion-brewing game, and an RPG quest game should each feel distinct. The engine supports this through config, not custom code. |
| 19 | **Treasure box / egg / gift box reveal containers are themed to the active visual theme.** Replaces PRD-24's generic templates (pirate, princess, medieval, etc.) with per-theme containers: pet carrier, dragon egg, potion crate, pixel chest, etc. Poster frames generated as part of the theme's image grid and used as frame 1 of the reveal video. | Keeps the entire visual experience consistent. A child playing the Dragon theme sees dragon eggs and treasure hoards, not generic pirate chests. The grid-to-video pipeline (poster frame → AI video) means each container's static image feeds directly into its animation. Zero wasted assets. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Overlay-to-background visual adaptation (per-background overlay art variants) | Post-MVP content expansion. Document as future vision. |
| 2 | Additional overlays beyond Pet Collector and Apothecary | Post-MVP content. Engine supports them via OverlayConfig. |
| 3 | Random events in overlays (streak-triggered narrative events) | Post-MVP. Interface stubbed in OverlayConfig.advancedFeatures. |
| 4 | Upgrade chains in overlays (building progression) | Post-MVP. Interface stubbed. |
| 5 | Custom overlay creation by mom | Post-MVP. Would need a UI for defining collectible types, stages, and uploading images. |
| 6 | Animated stage evolution (smooth morph rather than crossfade) | Post-MVP polish. Crossfade is MVP. |
| 7 | Color-reveal images themed to overlay aesthetics | PRD-24B covers the Color-Reveal system; thematic connection is post-MVP. |
| 8 | Recipe templates for family challenges | PRD-24C. Recipe engine supports it; family challenge integration is future. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-24 (Foundation) | `gamification_configs.visual_world_theme` renamed to `dashboard_background_key`. `overlay_id` column removed, replaced by `overlay_instances` table. `gamification_daily_summaries.theme_unlocks_today` renamed to `background_change_today`. Pipeline Step 9 removed. Pipeline Step 8 fully specified. | Update PRD-24 schema and pipeline sections. |
| PRD-03 (Design System) | Deferred #4 ("Gamification visual themes") now resolves to: "Dashboard backgrounds are cosmetic images (PRD-24A). Overlay visuals have their own art independent of the design system theme." | Update PRD-03 Deferred #4 reference. |
| PRD-04 (Shell Routing) | Dashboard backgrounds introduce a CSS background-image layer behind dashboard content. Play and Guided shells need readability gradient overlay with more opaque card backgrounds. | Note background rendering requirements per shell. |
| PRD-10 (Widgets) | Widget Catalog I-16 renamed from "Visual World Progress" to "Overlay Progress." I-17 "Overlay Collection Display" wired to overlay_collectibles + overlay_instances. Collection View Widget added as new widget type. | Update Widget Catalog entries. |
| PRD-11 (Victory Recorder) | DailyCelebration Step 4 fully specified with 3 sub-steps: collectible reveal, stage evolution, points summary. Step 4 reads from overlay_collectibles and overlay_instances. | Replace Step 4 stub with PRD-24A reference. |
| PRD-22 (Settings) | Gamification Settings Screen 8, Section H ("Visual World") becomes "Dashboard Background" with the background selector. A new "Overlays" section added with the overlay selector, setup flow, and per-overlay configuration. | Update Settings section references. |
| Widget Template Catalog | I-16 and I-17 data sources wired. I-16 renamed. New Collection View Widget registered. | Update catalog. |
| Build Order Source of Truth | PRD-24A completed. 5 new tables (dashboard_backgrounds, overlay_instances, overlay_collectibles, recipe_completions, background_library). 2 existing tables modified. | Move PRD-24A to Section 2. Register tables. |

---

*End of PRD-24A*
