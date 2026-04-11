# PRD-24/PRD-26 — Configurable Earning Strategies

> **Status:** COMPLETE — Phases 1-6 built, Phase 7 verification 2026-04-11
> **Parent build:** Build M (PRD-24 + PRD-26 Play Dashboard + Sticker Book)
> **Created:** 2026-04-10
> **Scope:** Replaces the single hardcoded d100 creature roll with a mom-configurable earning strategy system. Adds Play Segments for task grouping.

---

## 1. Problem Statement

The current gamification pipeline has one earning path: every task completion rolls a d100 against a 40% chance. This works for some kids but is wrong for others:

- Kids who get frustrated by randomness need **predictable** earning
- Kids who think in chunks of their day need **segment-based** earning
- Kids who can delay gratification need a **daily completion** goal
- The current model gives mom no control over *when* rewards flow

Additionally, the Play Dashboard renders tasks as a flat list. Young children's days have natural sections (morning routine, school, chores, evening) and the dashboard should reflect that structure.

---

## 2. Play Segments — Task Grouping

### What they are

Mom-defined groups that organize a Play (or Guided) child's tasks into visual sections on the dashboard. Each segment has a name, an icon, a sort order, and an optional day-of-week filter.

### Concrete example (founder's daughter)

| Segment | Tasks | Day filter |
|---|---|---|
| Morning | Get dressed, Eat breakfast, Brush teeth, Make bed | Every day |
| School | Reading*, Writing*, Math*, Arts & Crafts*, P.E.* | Weekdays |
| Jobs | Random chore 1*, Random chore 2*, Weekly chore | Every day |
| Evening | Clean up toys, Bath time, Pajamas, Story time | Every day |
| Sunday List | [Future: faith-themed activities] | Sunday only |

\* = randomizer-linked task (daily draw from a curated list)

### Dashboard rendering

```
┌─────────────────────────────────────┐
│  ☀️ Morning                    3/4  │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │Dress │ │Eat   │ │Teeth │ ...   │
│  │  ✓   │ │  ✓   │ │  ✓   │       │
│  └──────┘ └──────┘ └──────┘       │
│                                     │
│  📚 School                    0/5  │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │Read  │ │Write │ │Math  │ ...   │
│  │  ?   │ │  ?   │ │  ?   │       │
│  └──────┘ └──────┘ └──────┘       │
│                                     │
│  🧹 Jobs                     0/3  │
│  ...                                │
└─────────────────────────────────────┘
```

Each segment shows a progress bar (3/4). When all tasks in a segment are done, a segment-complete celebration plays before any creature earning logic fires.

### Key properties

- **Mom creates and names segments** in the child's gamification settings
- **Suggested names** offered during creation: Morning, Afternoon, Evening, School, Jobs/Chores, Play Time, Sunday, Outdoor Time
- **Tasks are assigned to segments** — each task belongs to exactly one segment (or "Unsegmented" if mom hasn't organized yet)
- **Day-of-week filter** — a segment can be set to only appear on specific days (Sunday List only on Sundays, School only on weekdays, etc.)
- **Sort order** — mom drags segments into the order she wants on the dashboard
- **Available in ALL shells** — Play (big tiles), Guided (section headers + progress), Independent (collapsible sections), Adult (collapsible sections at adult density). Gamification earning is opt-in per member regardless of shell.
- **Optional** — if mom doesn't create segments, the dashboard/task list renders tasks as a flat list (current behavior)

### Randomizer-linked tasks within segments

Many segment tasks can be linked to a randomizer list (Build J infrastructure). For example, "Reading" is linked to a randomizer list of reading activities that mom curated.

**Reveal style** — mom chooses per child:

| Style | Child sees | Good for |
|---|---|---|
| **Show upfront** | Activity is already visible when dashboard loads ("Read Charlotte's Web ch. 3") | Kids who like to see their full plan and prepare |
| **Mystery tap** | Sparkly mystery tile — tap to reveal today's activity with a mini card-flip animation | Kids who love surprises and treat each task as a little present to open |

The underlying randomizer draw is deterministic per day regardless of reveal style — refreshing shows the same activity.

---

## 3. Creature Earning Modes — Mom Picks Per Child

### The four modes

#### Mode 1: Segment Complete

> **For mom:** "Your child earns a creature each time they finish all the tasks in a section of their day. Set up Morning, School, and Jobs — that's three chances per day."
>
> **Good for:** Kids who think in chunks and love the satisfaction of completing a set.

**How it works:**
- When all tasks in a segment are marked complete (or approved), a creature is awarded
- Each segment is an independent earning opportunity
- Mom can attach creature earning to ALL segments or only specific ones (e.g., creatures from Morning + School but not Evening)
- Multiple creatures per day is normal and expected

**Configuration:**
- `creature_earning_mode = 'segment_complete'`
- `creature_earning_segment_ids = UUID[]` (which segments trigger creature awards; empty = all)

#### Mode 2: Every N Completions

> **For mom:** "Your child earns a creature every time they check off a certain number of tasks. Set it to 3, and every third checkmark brings a new friend."
>
> **Good for:** Kids who need frequent, predictable wins to stay motivated.

**How it works:**
- A counter increments on every task completion (or approval)
- When counter reaches the threshold, creature is awarded
- Mom decides: does the counter reset after each creature, or keep climbing?
  - **Reset mode:** Complete 3 → creature → counter resets → complete 3 more → creature
  - **Cumulative mode:** Creature at 3, 6, 9, 12... (same math, but the counter display shows total)

**Configuration:**
- `creature_earning_mode = 'every_n_completions'`
- `creature_earning_threshold = N` (default 3)
- `creature_earning_counter_resets = true | false` (display preference; math is equivalent)

#### Mode 3: Complete the Day

> **For mom:** "Your child earns one creature when they finish everything assigned for the day. One big reward for a full day's work."
>
> **Good for:** Kids who can handle working toward a bigger goal and feel proud of a complete day.

**How it works:**
- All tasks assigned to the child with a due date of today (or no due date + active) must be complete
- One creature per day maximum
- If segments exist, ALL segments must be complete (segment completion celebrations still fire individually, but the creature only comes after the last one)

**Configuration:**
- `creature_earning_mode = 'complete_the_day'`

#### Mode 4: Random Surprise

> **For mom:** "Any task might award a creature — about 4 out of every 10. Your child never knows which one will be the lucky one!"
>
> **Good for:** Kids who love surprises and don't get frustrated by chance.

**How it works:**
- Current d100 roll behavior preserved exactly
- Each task completion independently rolls against `creature_roll_chance_per_task` (default 40%)

**Configuration:**
- `creature_earning_mode = 'random_per_task'`
- `creature_roll_chance_per_task = 40` (adjustable)

---

## 4. Background/Page Earning Modes — Separate Choice

Background (sticker page) earning is configured independently from creature earning.

#### Mode A: Tracker Goal

> **For mom:** "Tie a new background to a specific goal — like earning 5 stars on a potty chart, or 10 marks on a reading tracker. You pick the tracker and the number."
>
> **Good for:** When you want backgrounds to celebrate a specific milestone, like potty training progress.

**Configuration:**
- `page_earning_mode = 'tracker_goal'`
- `page_earning_tracker_widget_id = UUID` (which dashboard widget/tracker to watch)
- `page_earning_tracker_threshold = N` (data points needed)

#### Mode B: Every N Creatures

> **For mom:** "A new background unlocks automatically as your child's collection grows. Set it to 7 creatures, or 3, or whatever pace feels right."
>
> **Good for:** Steady progress — the more creatures they earn, the more pages they unlock.

**Configuration:**
- `page_earning_mode = 'every_n_creatures'`
- `page_unlock_interval = N` (default 7)

#### Mode C: Every N Completions

> **For mom:** "A new background after a certain number of tasks completed, regardless of creatures earned."
>
> **Good for:** Direct connection between effort and new pages — every task counts toward the next background.

**Configuration:**
- `page_earning_mode = 'every_n_completions'`
- `page_earning_completion_threshold = N`
- `page_earning_counter_resets = true | false`

---

## 5. Mom's Setup Experience

### First-time setup (when mom enables gamification for a Play/Guided child)

**Step 1 — Organize the day (optional)**

> "Want to organize [Name]'s tasks into sections of their day?"
>
> [Yes, let's set it up] → Segment creator
> [Not right now — just a simple list] → Skip, flat dashboard

If yes: mom creates segments (Morning, School, Jobs, Evening), then assigns existing tasks or creates new ones within each segment. Suggested names appear as tappable pills. She can add a day filter (e.g., "School" only on weekdays).

**Step 2 — How does [Name] earn creatures?**

Four cards, each with the mode name, "good for" description, and a small illustration:

```
┌────────────────────────┐  ┌────────────────────────┐
│ 🧩 Segment Complete    │  │ 🔢 Every 3 Tasks       │
│                        │  │                        │
│ Finish all tasks in a  │  │ Every 3rd checkmark    │
│ section → earn a       │  │ brings a new friend.   │
│ creature. Multiple     │  │                        │
│ chances per day.       │  │ Good for: kids who     │
│                        │  │ need frequent,         │
│ Good for: kids who     │  │ predictable wins.      │
│ think in chunks.       │  │                        │
│ [Select]               │  │ [Select]               │
└────────────────────────┘  └────────────────────────┘
┌────────────────────────┐  ┌────────────────────────┐
│ ⭐ Complete the Day     │  │ 🎲 Random Surprise     │
│                        │  │                        │
│ One creature when      │  │ ~40% chance on any     │
│ everything's done for  │  │ task. Your kid never   │
│ the day.               │  │ knows which one!       │
│                        │  │                        │
│ Good for: kids who     │  │ Good for: kids who     │
│ can work toward a      │  │ love surprises.        │
│ bigger goal.           │  │                        │
│ [Select]               │  │ [Select]               │
└────────────────────────┘  └────────────────────────┘
```

If "Every N" is selected → number picker: "How many tasks per creature?" (default 3)
If "Segment Complete" is selected + segments exist → checkboxes: "Which segments earn creatures?" (default all)

**Step 3 — How does [Name] unlock new backgrounds?**

Three cards with same format:

- Tracker goal → tracker picker + threshold number
- Every N creatures → number picker (default 7)
- Every N completions → number picker

**Step 4 — Done!**

> "[Name]'s sticker book is ready! They'll start earning creatures with their next task."

### Ongoing configuration (settings panel)

After setup, mom can modify any setting from:
**Settings → [Play Child] → Gamification**

Sections:
1. **Day Segments** — add/rename/reorder/delete segments, assign tasks, set day filters
2. **Creature Earning** — switch mode, adjust thresholds, pick segments
3. **Background Earning** — switch mode, adjust thresholds, pick tracker
4. **Sticker Book** — toggle on/off, reset, points per task
5. **Reveal Style** — show upfront vs mystery tap (for randomizer-linked tasks)

Each section is expandable/collapsible. The mode cards from setup are available inline for switching.

---

## 6. Schema Changes Required

### New table: `task_segments`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| family_id | UUID FK | |
| family_member_id | UUID FK | Which member this segment belongs to (any shell) |
| segment_name | TEXT NOT NULL | "Morning", "School", etc. |
| icon_key | TEXT | Lucide icon name or platform_assets reference |
| sort_order | INTEGER DEFAULT 0 | Display order on dashboard/task list |
| day_filter | INTEGER[] | Day-of-week numbers (0=Sun..6=Sat). NULL = every day |
| creature_earning_enabled | BOOLEAN DEFAULT true | Whether completing this segment awards a creature |
| segment_complete_celebration | BOOLEAN DEFAULT true | Mini-celebration when segment completes (mom configurable) |
| randomizer_reveal_style | TEXT DEFAULT 'mystery_tap' | CHECK: 'show_upfront', 'mystery_tap'. Per-segment override. |
| theme_override_id | UUID FK nullable | Future: Sunday List uses a faith-themed sticker theme |
| is_active | BOOLEAN DEFAULT true | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** Mom/member can manage own. Child can read own.
**Index:** `(family_member_id, is_active, sort_order)`

### Altered table: `tasks`

| Column | Type | Notes |
|---|---|---|
| task_segment_id | UUID FK nullable | Which segment this task belongs to (NULL = unsegmented) |

### Altered table: `member_sticker_book_state`

| Column | Type | Default | Notes |
|---|---|---|---|
| creature_earning_mode | TEXT | 'random_per_task' | CHECK: 'segment_complete', 'every_n_completions', 'complete_the_day', 'random_per_task' |
| creature_earning_threshold | INTEGER | 3 | For 'every_n_completions' mode |
| creature_earning_counter | INTEGER | 0 | Running counter for 'every_n_completions' mode |
| creature_earning_counter_resets | BOOLEAN | true | Display/behavior for 'every_n_completions' |
| page_earning_mode | TEXT | 'every_n_creatures' | CHECK: 'tracker_goal', 'every_n_creatures', 'every_n_completions' |
| page_earning_completion_threshold | INTEGER | 20 | For 'every_n_completions' page mode |
| page_earning_completion_counter | INTEGER | 0 | Running counter |
| page_earning_tracker_widget_id | UUID FK nullable | For 'tracker_goal' mode |
| page_earning_tracker_threshold | INTEGER | 5 | For 'tracker_goal' mode |
| randomizer_reveal_style | TEXT | 'mystery_tap' | CHECK: 'show_upfront', 'mystery_tap' |

### RPC changes: `roll_creature_for_completion`

The RPC currently has one path (d100 roll). It must be refactored to:

1. Read `creature_earning_mode` from `member_sticker_book_state`
2. Branch on mode:
   - **random_per_task:** current d100 logic (unchanged)
   - **every_n_completions:** increment counter → if counter >= threshold → award creature (+ reset counter if configured)
   - **segment_complete:** check if the completed task's segment now has all tasks done → if yes → award creature
   - **complete_the_day:** check if ALL tasks assigned to this child for today are now complete → if yes → award creature
3. Background earning: similarly branch on `page_earning_mode`

### New RPC: `check_segment_completion`

Helper called by the main RPC when `creature_earning_mode = 'segment_complete'`:

```sql
-- Given a task_id, find its play_segment_id
-- Count incomplete tasks in that segment for today
-- If 0 incomplete → segment is complete → return true
```

---

## 7. Forward-Thinking Notes

### Sunday List (future build)

- A segment with `day_filter = [0]` (Sunday only)
- Linked to a **separate sticker theme** with faith/Bible-themed creatures and backgrounds
- Mom opts in explicitly — never auto-created
- The `gamification_themes` table already supports multiple themes; Sunday List would use a second theme with its own creatures + pages
- `member_sticker_book_state` could carry a `sunday_theme_id` or the segment itself could reference a theme override
- Sunday sticker pages only surface on Sundays in the sticker book detail modal

### Additional earning types (future)

The earning mode enum is extensible. Future modes could include:
- **Streak milestone** — creature at 3-day, 7-day, 14-day streaks
- **Timer goal** — earn after N minutes of focused time
- **Approval-based** — mom manually awards (for behaviors not tracked as tasks)

### Additional reward types beyond creatures and backgrounds (future)

The "menu of gamification options" concept means this earning strategy system should be designed so it can drive ANY reward type, not just creatures and pages:
- Coloring page reveals
- Badge/achievement unlocks
- Treasure box triggers
- Custom reward redemptions

The `creature_earning_mode` could generalize to a `reward_earning_config` JSONB that maps earning strategies to reward types.

---

## 8. What This Changes About Build M

### Sub-phase E (Mom Settings) — expanded scope

The original Sub-phase E was a simple settings screen with 5 controls. This design expands it to include:

1. Segment CRUD (create, name, reorder, delete, day filter, creature-earning toggle)
2. Task-to-segment assignment UI
3. Creature earning mode picker (4-card selector with "good for" descriptions)
4. Background earning mode picker (3-card selector)
5. Reveal style picker
6. The original controls (master toggle, sticker book toggle, points per task, reset)

### RPC refactor

`roll_creature_for_completion` must be refactored from a single d100 path to a strategy-branching function. This is the most significant code change.

### PlayDashboard rendering

`PlayTaskTileGrid` must support grouped rendering by segment when segments exist, with per-segment progress indicators and segment-complete celebrations.

### Migration

One new migration adding `task_segments` table, `tasks.task_segment_id` column, and the new columns on `member_sticker_book_state`.

---

## 9. Founder Decisions — LOCKED 2026-04-10

1. **Randomizer reveal style** — **Mom configurable**, settable per-segment. School can use mystery tap while Morning shows upfront.

2. **Segment-complete celebration** — **Mom configurable**. Some kids love a mini-celebration between segment completion and creature reveal; others find it annoying. Mom chooses per child.

3. **"Every N completions" counter** — **Yes, visible to kids** on the dashboard. Shows progress toward next creature ("2/3 until next creature!").

4. **"Complete the day" edge case** — earned creatures are **never taken away**. If mom adds a task mid-day after "day complete" fired, the creature stays earned. The day-complete status rechecks live for future evaluations, but past awards are permanent. This is consistent with the broader "celebration only, never punishment" principle.

5. **Guided shell segments** — same grouping concept, age-appropriate rendering. Segment headers with name + compact progress bar, standard task cards below. Not the big chunky Play tiles.

6. **Segments available to ALL shells** — not just Play and Guided. Independent teens and adults can use segments as an alternative way to see their tasks/routines organized by time-of-day. The table is renamed from `play_segments` to `task_segments` to reflect cross-shell usage.

7. **Gamification opt-in across all shells** — teens and adults CAN earn stickers if mom (or they) enable it. A 13-year-old Independent member with `gamification_configs.enabled = true` earns creatures on task completion, with a lighter sticker book widget appropriate for the Independent shell. Gamification and allowance calculations (PRD-28) coexist — both consume the same `task_completions` rows independently.

8. **Randomizer reveal style** — **Mom choice** per child: show upfront vs mystery tap. Confirmed 2026-04-10.

9. **Coloring reveals are 1:1 task-linked, NOT earning-mode-driven.** Each coloring picture is linked to a specific task via `earning_task_id`. Each completion of that task = one reveal step. No earning mode picker on coloring reveals — the earning mode system is for creatures only. Coloring reveals are visual tally counters tied to a specific repeatable action (e.g., "Using the Toilet" → each completion → one color zone revealed). Confirmed 2026-04-10.

10. **Coloring reveal renders as a dashboard WIDGET, not a task tile.** The coloring image appears as its own widget/card on the Play Dashboard with an "I did it!" button underneath. Similar to a Best Intentions widget but the visual is the progressive color reveal instead of a counter. Confirmed 2026-04-10.

11. **Coloring reveal config is simplified to 4 fields:** pick image, pick linked task, pick step count (how many completions until full reveal), pick lineart preference (for printing). No earning mode cards, no thresholds, no segment checkboxes. Confirmed 2026-04-10.

### Per-shell segment rendering (confirmed)

| Shell | Visual treatment |
|---|---|
| **Play** | Big section banners with icon, chunky progress bar, large tiles |
| **Guided** | Section headers with name + compact progress bar, standard task cards |
| **Independent** | Collapsible section headers in task list, progress pill in header |
| **Adult** | Collapsible section headers, adult density system |

### Platform reveals (noted for future)

The founder has additional "plain platform reveals" that are not attached to gamification themes — general-purpose reveal animations for various platform surfaces. These are separate from the Woodland Felt Mossy Chest / Fairy Door reveals and will be designed in a future build. The existing reveal components (CardFlipReveal, ThreeDoorsReveal, SpinnerWheelReveal, ScratchOffReveal) may serve this purpose.

---

## 10. Asset Status — Woodland Coloring Library

**32 subjects total** — 20 animals + 12 scenes. All in `coloring-library-complete.zip`.

### Per-subject assets (all 32 have all 7 files)

| File | Purpose | Status |
|---|---|---|
| `color.png` | Full-color felt image — final revealed state | 32/32 |
| `grayscale.png` | Starting state the child sees | 32/32 |
| `lineart_simple.png` | Printable coloring page — young kids | 32/32 |
| `lineart_medium.png` | Printable coloring page — standard | 32/32 |
| `lineart_complex.png` | Printable coloring page — older kids/adults | 32/32 |
| `grid_preview.png` | 1x5 overview strip (color → grayscale → 3 linearts) | 32/32 |
| `zones.json` | 50 color zones with hex, name, coverage_pct | 32/32 |

### Reveal sequences (pre-computed step groupings)

**Complete: 32/32** — all subjects have reveal_sequences with 6 step variants (5, 10, 15, 20, 30, 50). Verified 2026-04-10 from `coloring-library-zones-only-v2.zip`.

### Reveal sequence format (from fox_mushroom zones.json)

```json
{
  "reveal_sequences": {
    "5": [
      [zone_ids for step 1, grouped by coverage balance],
      [zone_ids for step 2],
      ...
    ],
    "10": [...],
    "15": [...],
    "20": [...],
    "30": [...],
    "50": [...]
  }
}
```

### Supabase Storage path

```
gamification-assets/woodland-felt/coloring-library/{slug}/color.png
gamification-assets/woodland-felt/coloring-library/{slug}/grayscale.png
gamification-assets/woodland-felt/coloring-library/{slug}/lineart_simple.png
gamification-assets/woodland-felt/coloring-library/{slug}/lineart_medium.png
gamification-assets/woodland-felt/coloring-library/{slug}/lineart_complex.png
gamification-assets/woodland-felt/coloring-library/{slug}/grid_preview.png
gamification-assets/woodland-felt/coloring-library/{slug}/zones.json
```

Slug is the folder name (e.g., `fox_mushroom`). Database stores only the slug — all 7 URLs are derived at runtime from the CDN base + theme slug + subject slug pattern.

### Subject inventory

**Animals (20):**
armadillo_wildflowers, badger_log, bear_cub_honey, beaver_dam, deer_and_fawn, fox_mushroom, frog_mushroom, hedgehog_acorns, mole_garden, moose_meadow, mouse_berries, opossum_berries, otter_family_winter, otter_riverbank, owl_moonlight, rabbit_clover, raccoon_stream, squirrel_pinecone, turtle_pond, wolf_pup_snow

**Scenes (12):**
scene_apple_harvest, scene_autumn_leaf_boats, scene_cherry_blossom_picnic, scene_christmas_morning, scene_firefly_dance, scene_harvest_festival_market, scene_moonlit_stargazing, scene_pond_boat, scene_rainy_day_umbrella, scene_spring_garden, scene_sunrise_breakfast, scene_winter_sledding

---

## 11. Implementation Plan — LOCKED PHASES

### Phase 1 — Earning Strategy Foundation + Color Reveal Schema
**Gate: `tsc -b` clean, all 4 creature earning modes + 3 page modes + color reveal earning work via RPC**

| Item | Description |
|---|---|
| Migration | `task_segments` table, `tasks.task_segment_id`, earning mode columns on `member_sticker_book_state`, `coloring_reveal_library` table (32 rows seeded from zones.json), `member_coloring_reveals` table |
| RPC refactor | `roll_creature_for_completion` → strategy-branching: reads `creature_earning_mode` and branches to segment_complete / every_n_completions / complete_the_day / random_per_task. Same branching for page earning. |
| Color reveal RPC | `advance_coloring_reveal(p_member_coloring_reveal_id)` — increments step, adds next zone group to revealed_zone_ids |
| Segment completion RPC | `check_segment_completion(p_task_id)` — checks if all tasks in segment are done |
| Day completion RPC | `check_day_completion(p_member_id)` — checks if all assigned tasks for today are done |
| Earning integration | Color reveal advancement wired into the same earning trigger system — when earning fires, both creature pipeline + color reveal pipeline run |
| Types + hooks | `TaskSegment`, `ColoringRevealImage`, `MemberColoringReveal`, earning mode enums, `useTaskSegments`, `useColoringReveals` |

### Phase 2 — Task Segments + Play Dashboard Grouped Rendering
**Gate: Play Dashboard renders segments, completing a segment triggers creature + color reveal**

| Item | Description |
|---|---|
| Segment CRUD hooks | `useCreateSegment`, `useUpdateSegment`, `useDeleteSegment`, `useReorderSegments` |
| Task-to-segment assignment | `useAssignTaskToSegment` mutation |
| PlayTaskTileGrid refactor | Grouped rendering by segment: section banners with icon + progress bar, tiles underneath |
| Segment-complete celebration | Configurable mini-celebration (confetti + glow) when a segment finishes |
| Progress counter | "2/3 until next creature!" visible on Play Dashboard per earning mode |
| Earning counter | For every_n mode: visible child-facing counter in dashboard header area |

### Phase 3 — Color Reveal Widget + Fox & Mushroom End-to-End
**Gate: Child completes tasks → Fox progressively reveals → full reveal → print**

| Item | Description |
|---|---|
| Asset upload | Fox & Mushroom (+ all 15 other sequence-ready subjects) into Supabase Storage at `gamification-assets/woodland-felt/coloring-library/{slug}/` |
| `ColorRevealWidget` | Dashboard widget: grayscale base image with CSS color overlay masking. As zones reveal, matching color regions transition from grayscale to full color. 1:1 aspect ratio container (16:9 image centered with edges cropped). |
| Reveal animation | When a new step fires: brief shimmer/glow on the newly revealed zones, then they settle into full color |
| Multiple active reveals | A child can have several `member_coloring_reveals` rows active simultaneously, each driven by its own earning config |
| `ColorRevealDetailModal` | Full-screen view of the current reveal image — larger, zoomable, shows progress (e.g., "Step 8 of 15 — almost there!") |
| Print flow | On completion: "You revealed the whole picture! Print it and color it yourself!" → line art complexity picker (simple/medium/complex) → opens print-friendly view via `window.print()` |
| Completed Book | Gallery of fully revealed coloring images. `WHERE is_complete = true ORDER BY completed_at`. Tappable to re-view or re-print. Permanent trophy shelf. |

### Phase 4 — Mom Settings (Full Configuration Surface)
**Gate: Mom can fully configure gamification from a single settings flow**

| Item | Description |
|---|---|
| Setup wizard | First-time flow: organize segments → pick creature earning mode → pick page earning mode → assign coloring reveals → done |
| Creature mode picker | 4 cards with "good for" descriptions. Per-mode config (threshold number, segment checkboxes, etc.) |
| Page mode picker | 3 cards with "good for" descriptions |
| Coloring reveal config | Per-reveal: pick image, pick step count (5/10/15/20/30/50), pick earning mode, pick earning source (segment/tracker/completions) |
| Segment management | Create/name/reorder/delete segments, assign tasks, day-of-week filters, per-segment reveal style + celebration toggle |
| Reveal style picker | Show upfront vs mystery tap, per-segment |
| Existing controls | Master toggle, sticker book toggle, points per task, reset — now integrated into the larger settings surface |

### Phase 5 — Cross-Shell Segments + Gamification Opt-In
**Gate: Segments render in all shells; your 13-year-old can earn stickers**

| Item | Description |
|---|---|
| Guided segment rendering | Section headers + compact progress bars, standard task cards |
| Independent segment rendering | Collapsible section headers in task list, progress pill |
| Adult segment rendering | Collapsible section headers at adult density |
| Gamification opt-in | Lighter sticker book + color reveal widgets for non-Play shells |
| Allowance coexistence | Verify gamification + PRD-28 allowance both consume `task_completions` independently |

### Phase 6 — Randomizer Reveals in Segments + Remaining Images + Polish
**Gate: Full end-to-end experience for your daughter's day**

| Item | Description |
|---|---|
| Mystery tap tile | Sparkly card-flip reveal for randomizer-linked tasks in segments |
| Show upfront tile | Pre-revealed randomizer result displayed on dashboard load |
| Per-segment reveal style wiring | Mom's per-segment choice applied at render time |
| All 32 coloring images seeded | All reveal sequences complete — full `coloring_reveal_library` table with 32 subjects, uploaded to Supabase Storage in Phase 3 |

### Phase 7 — Verification + Documentation
**Gate: Founder sign-off, all conventions documented**

| Item | Description |
|---|---|
| CLAUDE.md conventions | ~15 new entries covering earning modes, segments, color reveal, cross-shell gamification |
| STUB_REGISTRY.md | Update all Build M stubs |
| Post-build verification table | Every requirement → Wired / Stubbed / Missing |
| Feature decision file | Verification results archived |
| CURRENT_BUILD.md | Reset to IDLE |

---

## 12. Post-Build Verification Table — 2026-04-11

### Phase 1: Earning Strategy Foundation + Color Reveal Schema

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1.1 | `task_segments` table with RLS + indexes | **Wired** | Migration 100126. RLS: family read, mom write. Index on `(family_member_id, is_active, sort_order)`. |
| 1.2 | `tasks.task_segment_id` FK column | **Wired** | Migration 100126. FK to `task_segments(id)` ON DELETE SET NULL. |
| 1.3 | `coloring_reveal_library` table seeded with 32 subjects | **Wired** | Migration 100126. 32 rows (20 animals + 12 scenes) with slug, display_name, category, reveal_sequences JSONB (6 step variants: 5/10/15/20/30/50). |
| 1.4 | `member_coloring_reveals` table | **Wired** | Migration 100126. Tracks per-member progress: current_step, total_steps, revealed_zone_ids, is_complete, earning_task_id. |
| 1.5 | Earning mode columns on `member_sticker_book_state` | **Wired** | 11 new columns: `creature_earning_mode`, `creature_earning_threshold`, `creature_earning_counter`, `creature_earning_counter_resets`, `page_earning_mode`, `page_earning_completion_threshold`, `page_earning_completion_counter`, `page_earning_tracker_widget_id`, `page_earning_tracker_threshold`, `randomizer_reveal_style`. |
| 1.6 | `roll_creature_for_completion` RPC refactored with earning mode branching | **Wired** | Step 7 branches on 4 modes: `random_per_task` (d100), `every_n_completions` (counter), `segment_complete` (all tasks in segment done), `complete_the_day` (all today's tasks done). Page earning similarly branches on 3 modes. |
| 1.7 | `check_segment_completion(p_task_id)` RPC | **Wired** | Returns true when all tasks in the completed task's segment are done for today. |
| 1.8 | `check_day_completion(p_member_id)` RPC | **Wired** | Returns true when all assigned tasks for today are complete. |
| 1.9 | `advance_coloring_reveal(p_member_coloring_reveal_id)` RPC | **Wired** | Increments step, adds next zone group to `revealed_zone_ids`, sets `is_complete` when done. |
| 1.10 | TypeScript types: `TaskSegment`, `ColoringRevealImage`, `MemberColoringReveal`, earning enums | **Wired** | In `src/types/play-dashboard.ts`. |
| 1.11 | `useTaskSegments` hook | **Wired** | `src/hooks/useTaskSegments.ts` — read + CRUD + reorder. |
| 1.12 | `useColoringReveals` hook | **Wired** | `src/hooks/useColoringReveals.ts` — read + advance + lineart preference. |
| 1.13 | Feature keys registered | **Wired** | `task_segments`, `earning_strategies`, `coloring_reveals`, `gamification_segment_complete`, `gamification_every_n`, `gamification_complete_day`. |

### Phase 2: Task Segments + Play Dashboard Grouped Rendering

| # | Requirement | Status | Notes |
|---|---|---|---|
| 2.1 | Segment CRUD hooks (`useCreateSegment`, `useUpdateSegment`, `useDeleteSegment`, `useReorderSegments`) | **Wired** | In `src/hooks/useTaskSegments.ts`. |
| 2.2 | Task-to-segment assignment (`useAssignTaskToSegment`) | **Wired** | Mutation in `useTaskSegments.ts`. |
| 2.3 | `PlayTaskTileGrid` grouped rendering by segment | **Wired** | `src/components/play-dashboard/PlayTaskTileGrid.tsx` — renders segment banners with icon + progress bar, tiles underneath. Falls back to flat list when no segments. |
| 2.4 | Segment-complete celebration (confetti + glow) | **Wired** | `segment_complete_celebration` flag per segment controls whether mini-celebration plays. |
| 2.5 | Earning progress counter ("2/3 until next creature!") | **Wired** | `EarningProgressPill` component renders per-mode progress in dashboard header. |
| 2.6 | Day-of-week filter on segments | **Wired** | `day_filter INTEGER[]` column; segments only render on matching days. |

### Phase 3: Color Reveal Widget + End-to-End Canvas

| # | Requirement | Status | Notes |
|---|---|---|---|
| 3.1 | Asset upload to Supabase Storage | **Wired** | `scripts/upload-coloring-library.cjs` uploads all 32 subjects (7 files each) to `gamification-assets/woodland-felt/coloring-library/{slug}/`. |
| 3.2 | `ColorRevealCanvas` (grayscale → color zone reveals) | **Wired** | `src/components/play-dashboard/ColorRevealCanvas.tsx` — canvas pixel masking, zones transition from grayscale to full color on reveal. |
| 3.3 | Reveal animation (shimmer/glow on newly revealed zones) | **Wired** | CSS transition on zone reveal. |
| 3.4 | Multiple active reveals per child | **Wired** | Multiple `member_coloring_reveals` rows per member supported. |
| 3.5 | `ColorRevealDetailModal` (full-screen zoomable view + progress) | **Wired** | `src/components/play-dashboard/ColorRevealDetailModal.tsx`. |
| 3.6 | Print flow (lineart picker → `window.print()`) | **Wired** | Lineart complexity picker (simple/medium/complex) → print-friendly view. |
| 3.7 | `CompletedBookGallery` (gallery of fully revealed images) | **Wired** | `src/components/play-dashboard/CompletedBookGallery.tsx` — `WHERE is_complete = true ORDER BY completed_at`. |
| 3.8 | E2E tests | **Wired** | `tests/e2e/features/color-reveal-phase3.spec.ts`. |

### Phase 4: Mom Settings (Full Configuration Surface)

| # | Requirement | Status | Notes |
|---|---|---|---|
| 4.1 | `GamificationSettingsModal` with 6 collapsible sections | **Wired** | `src/components/gamification/settings/GamificationSettingsModal.tsx`. |
| 4.2 | Segment management (create/name/reorder/delete/day filter/creature-earning toggle) | **Wired** | Section 2 of settings modal. DnD reorder, suggested names as tappable pills. |
| 4.3 | Task-to-segment assignment UI | **Wired** | `SegmentTaskPickerModal` — member's tasks listed, tap to assign to segment. |
| 4.4 | Creature earning mode picker (4 cards with "good for" descriptions) | **Wired** | `EarningModePickerCards` — 4 cards: Segment Complete, Every N Tasks, Complete the Day, Random Surprise. Per-mode config (threshold, segment checkboxes). |
| 4.5 | Page/background earning mode picker (3 cards) | **Wired** | 3 cards: Tracker Goal, Every N Creatures, Every N Completions. |
| 4.6 | Coloring reveal config (pick image, pick task, pick step count, pick lineart) | **Wired** | `ColoringImagePickerModal` + config section. 4 fields per founder decision #11. |
| 4.7 | Reveal style picker (show upfront vs mystery tap) | **Wired** | Per-segment `randomizer_reveal_style` toggle in segment settings. |
| 4.8 | Master toggle, sticker book toggle, points per task, reset | **Wired** | Section 1 (toggles) + Section 6 (reset/advanced). |
| 4.9 | Mutation hooks (6+) | **Wired** | `useUpdateGamificationConfig`, `useUpdateStickerBookEarning`, `useToggleStickerBook`, `useResetStickerBook`, `useCreateColoringReveal`, `useDeleteColoringReveal`, `useResetColoringReveals`. |

### Phase 5: Cross-Shell Segments + Task-Linked Coloring

| # | Requirement | Status | Notes |
|---|---|---|---|
| 5.1 | `earning_task_id` FK on `member_coloring_reveals` | **Wired** | Migration 100127. |
| 5.2 | RPC updated: `earning_task_id` check runs first in pipeline | **Wired** | Migration 100128. Task-linked reveals bypass earning mode — advance on 1:1 task match. |
| 5.3 | `ColorRevealTallyWidget` (dashboard widget with "I did it!" button) | **Wired** | `src/components/coloring-reveal/ColorRevealTallyWidget.tsx` — shows image, linked task name, progress bar, "I did it!" button (completes linked task). |
| 5.4 | `SegmentHeader` for non-Play shells | **Wired** | `src/components/segments/SegmentHeader.tsx` — compact header with name + progress pill. Used in Guided, Independent, Adult shells. |
| 5.5 | Guided shell segment grouping in `GuidedActiveTasksSection` | **Wired** | Tasks grouped by segment with SegmentHeader. |
| 5.6 | Independent/Adult shell segment grouping | **Wired** | Collapsible section headers at appropriate density. |
| 5.7 | Gamification opt-in across all shells (founder decision #7) | **Wired** | Any member with `gamification_configs.enabled = true` can earn. Lighter sticker book widget for non-Play. |
| 5.8 | E2E tests | **Wired** | `tests/e2e/features/phase5-segments-coloring-reveal.spec.ts`. |

### Phase 6: Randomizer Reveals in Segments + Polish

| # | Requirement | Status | Notes |
|---|---|---|---|
| 6.1 | `MysteryTapTile` (sparkly card-flip reveal for randomizer-linked tasks) | **Wired** | `src/components/play-dashboard/MysteryTapTile.tsx` — shimmer animation + card-flip. |
| 6.2 | Show upfront tile (pre-revealed randomizer result on dashboard load) | **Wired** | Controlled by segment's `randomizer_reveal_style`. |
| 6.3 | Per-segment reveal style wiring | **Wired** | Mom's per-segment choice applied at render time via `randomizer_reveal_style`. |
| 6.4 | `RedrawButton` (adult-only, math gate, UPDATE in-place) | **Wired** | `src/components/play-dashboard/RedrawButton.tsx` — redraws update existing `randomizer_draws` row in-place (no history pollution). Math gate for adult approval. |
| 6.5 | E2E tests | **Wired** | `tests/e2e/features/play-dashboard-phase6-randomizer-reveals.spec.ts` — 6 tests. |

### Stubs (Documented Not-Building)

| # | Item | Status | Notes |
|---|---|---|---|
| S1 | Mom message widget on Play Dashboard | **Stubbed** | `PlayMomMessageStub` renders `PlannedExpansionCard`. Depends on PRD-15 messaging. |
| S2 | Play reveal tiles (surprise reveal mechanic) | **Stubbed** | `PlayRevealTileStub` renders `PlannedExpansionCard`. Deferred post-MVP. |
| S3 | Setup wizard (first-time guided flow) | **Stubbed** | Settings modal serves as both first-time and ongoing config. Wizard is a polish pass. |
| S4 | Tracker Goal page earning mode (widget data point integration) | **Stubbed** | Schema + RPC branch exist. Frontend widget picker queries `dashboard_widgets` but no active consumption loop — widget data point triggers not wired to page earning. |
| S5 | Sunday List theme override | **Stubbed** | `theme_override_id` column exists on `task_segments`. No faith-themed sticker theme created yet. |
| S6 | Task unmark cascade (points/streak/creature reversal) | **Stubbed** | Existing known limitation from Sub-phase C (CLAUDE.md #206). No changes in this expansion. |
| S7 | Streak milestone earning mode | **Stubbed** | Earning mode enum is extensible. Not built. |
| S8 | Timer goal earning mode | **Stubbed** | Not built. |
| S9 | Approval-based manual earning mode | **Stubbed** | Not built. |
| S10 | Drag-to-reposition creatures on sticker pages | **Stubbed** | Schema supports it (`position_x`, `position_y`). UI deferred. |
| S11 | Sticker book page curation UI (mom picks page order) | **Stubbed** | Pages unlock in order. Custom curation deferred. |
| S12 | Currency customization UI | **Stubbed** | `gamification_configs` has `currency_name`/`currency_icon` columns. No UI built. |

### Verification Summary

| Status | Count |
|---|---|
| **Wired** | 42 |
| **Stubbed** | 12 |
| **Missing** | 0 |

**Zero Missing items. Build is complete.**

### Mobile/Desktop Navigation Parity Check

No new top-level pages were added by this expansion. Task segments are a settings surface (inside `GamificationSettingsModal`), not a new page. Coloring reveals render as dashboard widgets, not pages. No sidebar entries added. **Parity check: N/A — no new routes.**
