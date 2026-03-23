# PRD-26: Play Dashboard

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-09A (Tasks, Routines & Opportunities), PRD-09B (Lists, Studio & Templates — Randomizer list type), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-11 (Victory Recorder & Daily Celebration), PRD-14 (Personal Dashboard — shared architecture), PRD-15 (Messages — receive-only), PRD-24 (Gamification Overview & Foundation), PRD-24A (Overlay Engine / Gamification Visuals), PRD-24B (Gamification Visuals & Interactions — reveal animations)
**Created:** March 17, 2026
**Last Updated:** March 17, 2026

---

## Overview

PRD-26 defines the Play Dashboard — the personal home screen for family members assigned to the Play shell. This is the dashboard for the youngest family members: pre-readers, early readers, and young children ranging roughly from ages 3 to 7, though mom assigns based on readiness, never age. The Play Dashboard is not a stripped-down version of the adult experience — it's a fundamentally different interaction model designed for kids who navigate by tapping big colorful things, not by reading text.

Everything on the Play Dashboard is large, visual, and tappable. Tasks appear as colorful tiles with one-tap completion and celebration animations. Gamification is the primary UX framework — stars, stickers, Visual World themes, and celebration effects are woven into every interaction. The dashboard is entirely mom-managed: section order, widget assignment, task configuration, and all settings are locked. The child's role is to interact, complete, and celebrate.

The Play Dashboard's distinctive feature is the **Reveal Task Tile** — a task tile linked to a Randomizer list (PRD-09B) that uses a fun reveal animation (spinner, mystery doors, card flip, scratch-off — from PRD-24B) to show the child which specific activity they're doing today within a category. Mom creates a list of jobs, crafts, or activities, links it to a task tile on the child's dashboard, and the child taps to discover their surprise. This transforms "do a chore" into a game.

> **Design principle:** The Play Dashboard should make a child *want* to use it. Not because they have to, but because tapping things makes cool stuff happen. Every completion should feel like an achievement. Every visit should end with a celebration. The dashboard doesn't ask children to manage themselves — it puts the fun in front of them and celebrates every step they take.

> **Depends on:** PRD-04 (Shell Routing) defines the Play shell container — no sidebar, no drawers, no LiLa, big tile layout, emoji bottom nav, celebrate button. PRD-14 defines the shared `dashboard_configs` table. PRD-10 defines widget grid mechanics. PRD-24 defines gamification points, streaks, and rewards. PRD-24A defines Visual Worlds. PRD-24B defines reveal animations. PRD-09B defines the Randomizer list type. PRD-11 defines the DailyCelebration 5-step sequence with maximum delight for Play mode.

---

## User Stories

### Landing Experience
- As a Play member, I want to see my name really big with a fun greeting when I open the app, so I know this is MY space.
- As a Play member, I want to see colorful tiles showing what I need to do today, so I can tap and get started without reading a list.
- As a mom, I want my youngest child's dashboard to be fully managed by me — I decide what they see, how it's arranged, and what's available.

### Task Tiles
- As a Play member, I want to tap a task tile and see a big checkmark and celebration when I'm done, so finishing things feels exciting.
- As a Play member, I want to see stars on every task so I know how many I'll earn when I finish.
- As a mom, I want to assign tasks to my Play child's dashboard as big visual tiles that they can complete with one tap.

### Reveal Task Tiles
- As a Play member, I want to tap a special tile and see a spinner (or doors, or cards) reveal my surprise job for today, so chores feel like a game.
- As a Play member, I want to spin again if mom lets me, so I get some choice in what I do.
- As a mom, I want to create a list of jobs, crafts, or activities and link it to a tile on my child's dashboard so the specific task changes each day but the category stays the same.
- As a mom, I want to choose the reveal animation style (spinner, doors, cards, scratch-off) so it matches my child's personality.
- As a mom, I want to set how many times per day my child can draw from each list, so arts and crafts is once a day but bonus jobs are unlimited.

### Gamification
- As a Play member, I want to see my stars go up every time I finish something, and I want sparkles and confetti when I complete tasks.
- As a Play member, I want to see my Visual World on my dashboard and watch it grow as I earn more stars.
- As a mom, I want gamification to be the primary motivational framework for my Play child — stars, stickers, themes, and celebrations are how the dashboard works.

### Messages (Receive Only)
- As a Play member, I want to see a message from my mom (like "Great job today!" or "Time for lunch!") so I know she's thinking about me.
- As a mom, I want to send my Play child a quick message that shows up on their dashboard without them needing to navigate to a messaging page.

### Celebration
- As a Play member, I want to tap a big "Celebrate!" button and see all the cool things I did today with fireworks and stars.
- As a mom, I want the DailyCelebration to be the highlight of my child's day — the feature that makes them want to come back tomorrow.

### Graduation
- As a Play member being moved to Guided, I want the change to feel like I'm growing up — with a celebration and a tour of my new bigger-kid dashboard.
- As a mom, I want graduating my child from Play to Guided to carry over all their data and feel like a positive milestone.

---

## Screens

### Screen 1: Play Dashboard Home

> **Depends on:** PRD-04 Play shell container. PRD-14 dashboard_configs table. PRD-10 widget grid. PRD-24 gamification data. PRD-24A Visual World theming.

**What the user sees:**

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│            "Hi Ruthie!" 👋✨                                   │
│            ⭐ 52 stars    🔥 5 days                            │
│            "Today you have 4 things to do!"                    │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │    🧹               │  │    🎨   ✨          │             │
│  │                     │  │                     │             │
│  │   Brush Teeth       │  │  Arts & Crafts      │             │
│  │                     │  │  Tap to reveal!     │             │
│  │        ⭐ 1         │  │        ⭐ 3         │             │
│  └─────────────────────┘  └─────────────────────┘             │
│                                                                │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │    📖               │  │    🧽   ✨          │             │
│  │                     │  │                     │             │
│  │   Reading Time      │  │  Do a Job           │             │
│  │                     │  │  Tap to reveal!     │             │
│  │        ⭐ 2         │  │        ⭐ 2         │             │
│  └─────────────────────┘  └─────────────────────┘             │
│                                                                │
│  ┌────────────── Mom says: ──────────────────────┐            │
│  │  "Have a great day sweetie! Love you! 💕"     │            │
│  └────────────────────────────────────────────────┘            │
│                                                                │
│  [Widgets: Visual World card, Star Chart, etc.]                │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🎉🎉🎉  Celebrate!  🎉🎉🎉                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  🏠 Home  |  ✅ Tasks  |  ⭐ Stars  |  🎮 Fun                │
└────────────────────────────────────────────────────────────────┘
```

**Header:**
- Child's name displayed large and center. "Hi [Name]!" with animated wave or sparkle effect (per PRD-14 Play stub spec).
- Gamification indicators: star/currency count and streak count with icons. Large, prominent, always visible. Uses mom's chosen currency name (PRD-24). Hidden if gamification is disabled for this member.
- Daily summary: "Today you have [X] things to do!" — friendly count of assigned tasks. When all are done: "You did everything today! Amazing!" If no tasks assigned: "Today is a free day! Have fun!"
- No Guiding Stars declaration rotation (Play members don't have Guiding Stars).
- The entire header area is skinned by the child's active Visual World theme (PRD-24A).

**Task tiles:**
- Large, colorful, rounded cards arranged in a responsive grid (2 columns on phone, 3-4 on tablet). No collapsible sections — tiles are always expanded and visible.
- Each tile shows: large emoji icon (mom-assigned or auto-suggested by task category), task title in large text, and star/point value if gamification is enabled.
- Minimum touch target: 56px (PRD-04 Play shell spec). Tiles should be substantially larger than this minimum — targeting roughly 120-160px tall.
- **Standard task tiles:** One-tap completion. Tap the tile → task completes → celebration animation plays (gold particle burst, bouncy checkmark, star flies to header counter — per PRD-03 Play shell celebration tokens). No confirmation dialog. One tap = done.
- **Routine tiles:** Tap opens an expanded step-by-step view. Each step is a big checkbox with step name. Completing all steps triggers a larger celebration than a single task.
- **Reveal task tiles:** Identified by a sparkle/shimmer effect on the tile and "Tap to reveal!" subtitle text. Tapping opens the reveal animation overlay (see Screen 2).
- Completed tiles: checkmark overlay, slightly dimmed but still visible (never removed — "never show what wasn't done" philosophy applies in reverse: always show what WAS done). Completed tiles shift to the bottom of the tile grid.
- If a task requires approval, completion shows a "Waiting for Mom ⏳" state with a gentle pulsing clock icon.
- Tile order is controlled by mom. Default: uncompleted first, completed at bottom.

**Mom's message card:**
- When mom has sent a message to this Play member (via PRD-15), the most recent unread message displays as a card inline with the dashboard content. Styled distinctly from task tiles — softer colors, mom's avatar or a heart icon, "Mom says:" header.
- Read-only. The child cannot reply from the Play dashboard.
- Multiple unread messages stack (newest on top, older collapsed). Tapping a collapsed stack expands to show all messages.
- Messages dismiss when the child (or mom via View As) taps a small [✓ Got it] button. Dismissed messages don't reappear.
- If no unread messages, the card is not shown (no empty space).

**Widget grid:**
- Same grid architecture as PRD-14 / PRD-10. Widgets render with Play shell tokens — larger, more colorful, bigger touch targets.
- Mom arranges and assigns widgets. Child has no layout control — no reordering, no editing, no creating.
- Gamification widgets (Visual World progress, star chart, streak calendar, treasure box, reward progress) are the primary widget content for Play members.
- Widget touch targets use Play shell minimum of 56px (PRD-04).
- The Visual World progress widget is the centerpiece — it should be large (spanning 2 columns if space allows) and show the child's world with visible evolution progress.

**Celebrate! button:**
- Full-width button near the bottom of the scrollable content. Gold gradient with emoji decorations (🎉). Larger and more visually prominent than the Guided version.
- Bouncy idle animation — gentle scale pulse (1.0 → 1.02 → 1.0, 2-second cycle) to draw attention.
- Tapping launches the DailyCelebration 5-step sequence (PRD-11) in Play mode rendering: maximum delight, confetti, sparkles, bouncing, largest text, fun character voice personality.
- Button text: "Celebrate!" always. The DailyCelebration sequence handles the content — even if there are zero victories, the sequence opens with the animated greeting and closes with encouragement.

**Section ordering:**
- Controlled entirely by mom via dashboard management. Default order: Header → Task Tiles → Mom's Message → Widget Grid → Celebrate.
- Mom can hide sections (except Header and Task Tiles, which are always visible).
- No section collapse capability — everything is always expanded. Play mode is about big, visible, tappable surfaces, not information density management.

**Data read:**
- `dashboard_configs` row for this member
- `tasks` and `task_completions` for today's assigned tasks
- `lists` and `list_items` for Randomizer-linked reveal tiles
- `conversation_messages` for mom's messages (PRD-15, filtered to unread)
- `gamification_balances` for currency display
- `streaks` for active streak count

---

### Screen 2: Reveal Task Tile Flow

> **Depends on:** PRD-09B (Randomizer list type). PRD-24B (reveal animations).

**What the user sees when tapping a reveal task tile:**

**Step 1 — Reveal Animation (full-screen overlay):**
The reveal animation plays using the style mom selected for this list. The full-screen overlay is themed to the child's Visual World.

Available reveal styles (from PRD-24B):
- **Spinner:** A colorful wheel with item names around the edge. Spins with deceleration. Lands on the selected item with a "ding!" sound effect indicator (visual — audio is device-dependent).
- **Mystery Doors:** Three doors appear. Child taps one. Door opens with a dramatic animation to reveal the item.
- **Card Flip:** Three face-down cards appear. Child taps one. Card flips over to reveal the item.
- **Scratch-Off:** A sparkly scratch-off card. Child swipes/taps to "scratch" and reveal the item underneath.
- **Gift Box:** A wrapped present. Child taps to open. Lid lifts with sparkles to reveal the item.

The item is selected by the engine *before* the animation plays — the reveal is purely theatrical. Selection follows mom's configured selection mode: Random, Rotating (no repeats until all seen), or Manual (mom pre-selected today's item).

**Step 2 — Item Revealed:**
The selected item displays large and center with a celebration micro-animation (sparkles, stars).

```
┌────────────────────────────────────────┐
│                                        │
│         🧹 ✨                          │
│                                        │
│     "Wipe the kitchen table!"          │
│                                        │
│     ⭐ 2 stars                         │
│                                        │
│   [ 🎯 Do This! ]  [ 🔄 Pick Again ]  │
│                                        │
└────────────────────────────────────────┘
```

- **[Do This!]** — Accepts the revealed item. Creates a task instance from the list item, assigned to this member, for today. The reveal overlay closes. The dashboard tile updates from "Tap to reveal!" to showing the specific item name with a completion checkbox. The child can now complete it like any standard task tile.
- **[Pick Again]** — Only visible if mom enabled re-picks for this list. Plays the reveal animation again with a new selection. If mom set a re-pick limit (e.g., 2 re-picks max), a gentle counter shows: "1 more pick available" / "Last pick!" After the limit, only [Do This!] remains.
- If mom disabled re-picks, only [Do This!] appears — "you get what you get" is a valid parenting choice.

**Step 3 — After acceptance:**
The reveal tile on the dashboard transforms into a standard task tile showing the specific revealed item. It behaves identically to any other task tile from this point: one-tap completion with celebration animation, points awarded, victory recorded.

**Daily limit enforcement:**
- Each Randomizer list has a `daily_draw_limit` (null = unlimited, integer = max draws per day).
- After the daily limit is reached, the reveal tile shows a friendly completion state: "All done with [category] today! 🌟" The sparkle effect stops. The tile becomes non-tappable with a satisfied/complete visual treatment.
- Daily limit resets at midnight (or mom's configured day-reset time if different).
- Draw count tracked in `dashboard_configs.preferences.reveal_draws_today` (JSONB: `{ "list_uuid": count }`), reset by a daily cron/trigger.

**Data created:**
- `tasks` record created from the list item on [Do This!] acceptance (source = 'randomizer_reveal', source_reference_id = list_item.id)
- `list_items.is_available` updated if item is one-and-done (is_repeatable = false)
- Draw count incremented in preferences

---

### Screen 3: Mom's Dashboard Management for Play Members

> **Accessed from:** Settings → Family Management → select Play member → Manage Dashboard.

**What mom sees:**

A simplified configuration screen — fewer options than Guided because Play is more locked-down.

**Task tile management:**
- List of assigned tasks shown as tile previews. Mom can drag to reorder.
- [+ Add Task] button → Task Creation Modal (PRD-09A), pre-scoped to this member.
- [+ Add Reveal Tile] button → Reveal tile configuration:
  1. Select or create a Randomizer list (links to PRD-09B list management).
  2. Choose tile name (defaults to list title, editable — e.g., "Jobs," "Arts & Crafts").
  3. Choose tile emoji icon.
  4. Choose reveal style: Spinner, Mystery Doors, Card Flip, Scratch-Off, Gift Box.
  5. Set selection mode: Random, Rotating, Manual.
  6. Set repeat rules: Infinite, Limited (X times per item), One-and-done.
  7. Set re-pick allowed: Yes (with optional limit) / No.
  8. Set daily draw limit: Unlimited / Number per day.
  9. Set point value per completed reveal item.
- Each reveal tile shows a summary of its configuration with [Edit] and [Remove] buttons.

**Widget management:**
- Links to widget assignment interface (PRD-10), scoped to this member.
- Recommended default: Visual World progress (large), Star Chart.

**Feature toggles:**
- **Reading Support:** On/Off (same as PRD-25 — TTS icons, larger font, icon pairing). Especially valuable for pre-readers.
- **Gamification:** Enabled/Disabled (per PRD-24). When disabled, star values hidden from tiles, header indicators hidden, DailyCelebration Step 4 skipped. Gamification is default ON for Play — disabling is unusual but supported.

**No toggles for:** Writing, messaging (send), LiLa tools, reflections, spell check coaching — these features don't exist in Play mode.

**Data updated:**
- `dashboard_configs.layout` — tile order, widget positions, section visibility
- `dashboard_configs.preferences` — reading support, gamification, reveal tile configurations
- Randomizer lists (PRD-09B) — created/edited via linked list management

---

### Screen 4: Play → Guided Graduation

> **Triggered when:** Mom changes a member's `dashboard_mode` from 'play' to 'guided' in Family Management.

**What the child sees on next login:**

**Step 1 — Celebration Moment (full-screen overlay):**
- Maximum Play-style delight: huge animated celebration with the child's name, confetti explosion, sparkles, their Visual World elements dancing.
- Message in large, simple text: "Wow, [Name]! You're moving to the BIG KID dashboard!"
- Brief pause for celebration (3-4 seconds), then big [Let's Go!] button.

**Step 2 — Interactive Tutorial (guided walkthrough):**
Simpler than the Guided → Independent tutorial (PRD-25). Fewer steps, bigger visuals, simpler language.

Tutorial steps:
1. **"This is your new home"** — Shows the Guided dashboard. Points out the bottom nav icons. Task: tap the Home icon.
2. **"Your tasks look like this now"** — Shows the task section with checkboxes (instead of big tiles). Task: tap a checkbox on a sample task.
3. **"You can write things now"** — Highlights the Write button in the bottom nav. Task: tap Write, see the drawer open, close it.
4. **"You're awesome!"** — Celebration close with summary of what's new.

**Step 3 — Welcome Home (dashboard loads):**
- Guided dashboard renders with all Play-era data carried over.
- One-time welcome card: "Welcome to your new Guided dashboard! You have new things to explore. Your [mom-chosen currency name] and streak are all here!"
- Tracked in `dashboard_configs.preferences.graduation_tutorial_completed`.

**What carries over:**
- Gamification data: points, streaks, Visual World progress, achievements — all continue.
- Task history, victory records — all preserved.
- Reveal tile configurations DON'T carry over as reveal tiles (Guided mode uses the Guided Next Best Thing pattern instead). The underlying Randomizer lists remain available for mom to reconfigure.

**What changes:**
- Big tile layout → section/grid hybrid layout (PRD-25).
- Emoji bottom nav → text-and-icon bottom nav (Home, Tasks, Write, Victories, Progress).
- One-tap tile completion → checkbox completion with celebration animation.
- No writing → Write drawer available.
- No messaging → Messages tab in Write drawer (if mom enables).
- Everything locked → widget reordering available.

---

## Visibility & Permissions

| Role | Dashboard Access | Layout Control | Widget Control | Reveal Tile Config | Messages |
|------|-----------------|---------------|---------------|-------------------|----------|
| Mom / Primary Parent | Full management via Settings → Manage Dashboard. Can View As (PRD-02). | Full — tile order, section visibility, all configuration. | Full — assign, position, remove. | Full — create, edit, remove reveal tiles. Choose reveal style, selection mode, limits. | Can send messages that appear on child's dashboard. |
| Dad / Additional Adult | Can View As if mom grants permission. No management access. | None | None | None | Can send messages if mom permits (per PRD-15). |
| Special Adult | Can view assigned Play member's dashboard during shift (PRD-27). | None | Interact with permitted widgets. No changes. | None | None |
| Play Member (self) | Full view and interaction. Tap tiles, complete tasks, trigger reveals, view widgets, trigger DailyCelebration. | None. Cannot reorder, hide, or modify anything. | View and interact only. No changes. | Tap to reveal and complete. Cannot configure. | Receive only. Cannot send or reply. |

### Shell Behavior
- Play shell layout per PRD-04: no sidebar, no drawers, no LiLa (no access of any kind), no floating buttons (except parent-locked Settings), big tile layout, emoji bottom nav, celebrate button.
- Bottom nav items: 🏠 Home, ✅ Tasks, ⭐ Stars, 🎮 Fun (per PRD-04).
- Settings requires mom's PIN or auth to access (parent-locked).
- All gamification features maximum — sparkles, confetti, bouncy animations, per PRD-03 Play shell tokens.
- Emoji permitted in Play shell (per PRD-03).

### Privacy & Transparency
- Play members have no privacy expectations — mom sees everything.
- No transparency panel for Play members (the concept of "what can my parent see" is not age-appropriate for this group).
- Mom's messages to Play members are not private — any parent with View As access can see them.
- Task completions, victories, and all activity are fully visible to mom.

---

## Data Schema

### Extensions to `dashboard_configs.preferences` JSONB (PRD-14 table)

PRD-26 adds the following keys to the existing `preferences` JSONB column:

```json
{
  "reading_support_enabled": false,
  "reveal_tiles": [
    {
      "id": "uuid",
      "list_id": "uuid",
      "tile_name": "Jobs",
      "tile_emoji": "🧹",
      "reveal_style": "spinner",
      "selection_mode": "random",
      "repeat_rule": "infinite",
      "repick_allowed": true,
      "repick_limit": 2,
      "daily_draw_limit": null,
      "point_value": 2,
      "sort_order": 3
    }
  ],
  "reveal_draws_today": {
    "list-uuid-1": 2,
    "list-uuid-2": 0
  },
  "graduation_tutorial_completed": false,
  "message_display_mode": "inline"
}
```

**Key descriptions:**
- `reading_support_enabled` — Same as PRD-25. Enables TTS icons, larger font, icon pairing.
- `reveal_tiles` — Array of reveal tile configurations. Each links to a PRD-09B Randomizer list and defines the reveal experience for that tile.
- `reveal_draws_today` — Daily draw counter per list. Reset at midnight by scheduled function.
- `graduation_tutorial_completed` — Whether the Play → Guided tutorial has been completed.
- `message_display_mode` — How mom's messages display. 'inline' = card in dashboard flow (default). Future option: 'notification' = banner at top.

### Reveal Tile Configuration Fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier for this reveal tile config |
| list_id | UUID | FK → lists (PRD-09B Randomizer list) |
| tile_name | TEXT | Display name on the tile (default: list title) |
| tile_emoji | TEXT | Emoji icon for the tile |
| reveal_style | TEXT | 'spinner', 'mystery_doors', 'card_flip', 'scratch_off', 'gift_box' |
| selection_mode | TEXT | 'random', 'rotating', 'manual' |
| repeat_rule | TEXT | 'infinite', 'limited', 'one_and_done' |
| repeat_limit | INTEGER | NULL | Max times per item (only for 'limited' rule) |
| repick_allowed | BOOLEAN | Whether [Pick Again] button is available |
| repick_limit | INTEGER | NULL | Max re-picks per reveal (null = unlimited) |
| daily_draw_limit | INTEGER | NULL | Max draws per day (null = unlimited) |
| point_value | INTEGER | Points awarded on completion of revealed item |
| sort_order | INTEGER | Position in the tile grid |

### New Section Keys

Added to the section key string constants (extending PRD-14 and PRD-25):
- `'task_tiles'` — The task tile grid (replaces `'active_tasks'` for Play mode — different rendering).
- `'mom_message'` — Mom's message card section.

These join existing keys: `'greeting'`, `'calendar'`, `'active_tasks'`, `'widget_grid'`, `'next_best_thing'`, `'celebrate'`.

### Enum/Type Updates

No new enums. Reveal style and selection mode are stored as TEXT in the JSONB preferences, not as database enums.

Addition to `tasks.source` values: `'randomizer_reveal'` — tasks created from reveal tile acceptance.

---

## Flows

### Incoming Flows (How Data Gets INTO the Play Dashboard)

| Source | How It Works |
|--------|-------------|
| PRD-09A (Tasks) | Mom-assigned tasks populate standard task tiles. |
| PRD-09B (Randomizer Lists) | Randomizer list items populate reveal task tile content. |
| PRD-24 (Gamification) | Point balances, streak data, and reward progress populate header indicators and gamification widgets. |
| PRD-24A (Visual Worlds) | Active Visual World theme skins the entire dashboard. |
| PRD-24B (Reveal Animations) | Reveal animation components render the spinner, doors, cards, scratch-off, and gift box experiences. |
| PRD-10 (Widgets) | Mom-assigned widgets populate the widget grid. |
| PRD-15 (Messages) | Mom's messages appear as inline cards on the dashboard. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-09A (Tasks) | Task completions (standard + revealed items) feed the task completion pipeline. Reveal acceptance creates task records with `source = 'randomizer_reveal'`. |
| PRD-24 (Gamification) | Task completions trigger the gamification event pipeline (points → streak → theme progress → celebration). |
| PRD-11 (Victory Recorder) | Completed tasks flow to Victory Recorder. Completed revealed items include the category context ("Did a Job: Wiped the kitchen table"). DailyCelebration launched from Celebrate! button. |
| PRD-09B (Lists) | Completed one-and-done Randomizer items update `list_items.is_available = false`. Draw counts feed back to list usage analytics. |

---

## AI Integration

No AI integration in the Play Dashboard. Play mode has no LiLa access of any kind (per PRD-04). There is no AI glaze on task suggestions, no AI-generated celebration text on the dashboard, and no AI coaching.

The DailyCelebration sequence (PRD-11) does use AI for celebration narrative generation, but that is owned by PRD-11, not this PRD.

The only "intelligence" on the Play Dashboard is the non-AI Randomizer selection engine (random/rotating/manual item selection from lists).

---

## Edge Cases

### Pre-Reader with No Reading Support Enabled
- Task tile names still display as text (mom writes them). The child may not be able to read them, but the emoji icon and mom's verbal instruction ("tap the one with the broom") provide navigation.
- If mom enables Reading Support, TTS icons appear on every tile — child taps the speaker to hear what the task is.
- This is an acceptable default — not every 3-year-old needs TTS. Mom knows her child.

### All Tasks Completed
- Header changes to: "You did everything today! Amazing! 🌟"
- All task tiles show completed state (checkmark overlay, gentle dimming).
- Celebrate! button gets extra emphasis — bouncy animation intensifies, sparkle effects.
- Reveal tiles that have remaining daily draws are still active — the child can keep picking activities if mom allows.

### Reveal Tile with Empty List
- If all items in a Randomizer list are exhausted (all one-and-done items used), the tile shows: "All done with [category]! 🎉 Ask mom for more!" Non-tappable.
- If the list exists but has zero items, the tile is hidden (mom should add items before deploying the tile). A warning shows in mom's management screen: "[List name] has no items — this tile won't appear until you add some."

### Reveal Tile — Manual Selection Mode
- When mom uses "manual" selection mode, she pre-selects which item the child will get today.
- The reveal animation still plays (the child doesn't know it was pre-selected — the theatrical experience is the same).
- If mom hasn't made a manual selection for today, the tile shows: "Check back later!" — mom gets a reminder notification if configured.

### Very Young Child (3-4 years old)
- The dashboard works for pre-readers because navigation is icon-based and touch targets are large.
- Mom will likely need to help the child initially ("tap the blue one!").
- The child's primary independent interaction is one-tap completion — which even a 3-year-old can do.
- Voice read-aloud (Reading Support) significantly improves independence for this age group.

### No Gamification
- If mom disables gamification, star values disappear from tiles, header indicators hide, DailyCelebration Step 4 (Theme Progress) is skipped.
- The dashboard still functions — it's just task tiles without point values.
- This is unusual for Play mode (gamification IS the Play experience) but supported.

### Multiple Reveal Tiles on Same Screen
- Each reveal tile operates independently — different lists, different reveal styles, different limits.
- Example: "Jobs" (spinner, unlimited), "Arts & Crafts" (mystery doors, 1/day), "Bonus Fun" (card flip, 3/day).
- All coexist in the tile grid without conflict.

### Message Overflow
- If mom sends many messages, only the most recent 3 unread show. Older unread messages are accessible by tapping "See more from Mom" below the visible cards.
- Dismissed messages are gone — no message history accessible to the Play child (mom can see history via her own messaging interface).

### Network Failure During Reveal
- The reveal animation is client-side — it doesn't require a network call to play.
- Item selection happens before animation starts. If the network drops before the task is created on the server, the task creation retries when connectivity returns.
- If the retry fails, the draw doesn't count against the daily limit.

### Play Member Assigned Tasks by Non-Mom Parent
- Dad can assign tasks to the Play child if mom has granted task assignment permission (PRD-09A).
- Dad-assigned tasks appear as standard tiles on the Play dashboard, same as mom-assigned tasks.
- Only mom can create reveal tiles (since they require Randomizer list configuration in dashboard management).

---

## Tier Gating

All Play Dashboard features are available to all users during beta. `useCanAccess()` hooks wired from day one, return `true`.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `play_dashboard` | Play Dashboard layout and all standard task tiles | TBD post-beta |
| `play_reveal_tiles` | Reveal task tiles (Randomizer + reveal animations) | TBD post-beta |
| `play_reading_support` | Reading Support accommodations (TTS, larger font, icon pairing) | TBD post-beta |
| `play_message_receive` | Receive messages from parents on dashboard | TBD post-beta |

> **Tier rationale:** Reveal tiles are the compelling upgrade feature for Play mode — the gamified chore experience is what makes Play magical. Reading Support and message receiving are accessibility/communication features with strong retention value.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Play member message sending (reply to mom) | PRD-15 messaging write capability for Play | Post-MVP |
| Audio/sound effects on reveal animations | Device audio integration | Post-MVP |
| Reveal tile "manual" mode — mom's daily selection UI | PRD-22 Settings or mom's daily config surface | Post-MVP |
| Reveal tile analytics (which items are most/least popular) | Platform analytics | Post-MVP |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Play Dashboard (full specification) | PRD-14, Screen 5 | Fully wired — all stub descriptions from PRD-14 are implemented or superseded. |
| Play shell big tile layout | PRD-04 | Fully specified — task tiles, reveal tiles, widget grid, celebrate button. |
| Play shell emoji bottom nav | PRD-04 | Confirmed: 🏠 Home, ✅ Tasks, ⭐ Stars, 🎮 Fun. |
| DailyCelebration Play mode rendering | PRD-11 | Confirmed — Play rendering with maximum delight, largest text, bouncing, confetti. |
| Randomizer list dashboard widget | PRD-09B | Extended — Randomizer lists now surface as reveal task tiles on Play dashboard with configurable reveal animations and daily limits. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Play Dashboard renders with header (name, stars, streak, task count), task tiles, widget grid, and Celebrate button
- [ ] Standard task tiles with one-tap completion, celebration animation (gold particles, bouncy checkmark, star fly to header)
- [ ] Reveal task tiles render with sparkle effect and "Tap to reveal!" subtitle
- [ ] Reveal flow: tap tile → full-screen reveal animation → item revealed → [Do This!] / [Pick Again] → task created → completable as normal tile
- [ ] At least 3 reveal styles functional: spinner, mystery doors, card flip (scratch-off and gift box can be Post-MVP)
- [ ] Reveal selection modes: random and rotating functional (manual can be Post-MVP)
- [ ] Reveal repeat rules: infinite and one-and-done functional (limited can be Post-MVP)
- [ ] Re-pick functionality with configurable limit
- [ ] Daily draw limit enforcement with friendly "All done" state and midnight reset
- [ ] Mom's message card: displays most recent unread message(s) inline on dashboard, [Got it] dismiss
- [ ] Widget grid with Play shell tokens (56px touch targets, larger rendering)
- [ ] Celebrate! button launches DailyCelebration in Play mode (PRD-11)
- [ ] Visual World theme skins the dashboard (requires PRD-24A)
- [ ] Completed tiles show checkmark and shift to bottom of grid
- [ ] Header task count updates in real-time as tasks are completed
- [ ] Mom's dashboard management in Settings: task tile ordering, reveal tile configuration, widget assignment, Reading Support toggle
- [ ] Reading Support: TTS icons on tiles and labels, larger font, icon pairing when enabled
- [ ] All layout controlled by mom — child has zero edit capability
- [ ] Bottom nav: Home, Tasks, Stars, Fun with emoji icons and 56px touch targets
- [ ] Settings parent-locked (requires PIN/auth)
- [ ] `useCanAccess()` hooks wired for all 4 feature keys (return true during beta)
- [ ] RLS: member reads own dashboard_configs; mom reads/updates all family members
- [ ] Completed revealed items flow to Victory Recorder with category context
- [ ] Gamification pipeline fires on all task completions (standard + revealed)

### MVP When Dependency Is Ready
- [ ] Visual World theme skinning (requires PRD-24A)
- [ ] Reveal animation components (requires PRD-24B animation library)
- [ ] Star chart and gamification widgets in grid (requires PRD-24 + PRD-10)
- [ ] Message receive from mom (requires PRD-15 messaging infrastructure)
- [ ] Treasure box widget (requires PRD-24 reward system)

### Post-MVP
- [ ] Graduation celebration and interactive tutorial (Play → Guided)
- [ ] Scratch-off and gift box reveal styles
- [ ] Manual selection mode with mom's daily selection UI
- [ ] Limited repeat rule (X times per item)
- [ ] Audio/sound effects on reveal animations and celebrations
- [ ] Play member message sending (reply to mom)
- [ ] Reveal tile analytics for mom (most/least popular items)
- [ ] Calendar section (icon-rich, minimal text — per PRD-14 Play stub)
- [ ] Routine step cards with visual step-by-step progress
- [ ] Multiple dashboard configurations per Play member (structured day vs. free day)

---

## CLAUDE.md Additions from This PRD

- [ ] Play Dashboard uses task tile grid layout, NOT the section/grid hybrid from PRD-14. No collapsible sections. Everything is always visible and expanded.
- [ ] Play Dashboard section keys: `'task_tiles'` (replaces `'active_tasks'`) and `'mom_message'` join existing keys.
- [ ] Reveal task tiles: standard task tiles linked to a PRD-09B Randomizer list with a PRD-24B reveal animation. Configuration stored in `dashboard_configs.preferences.reveal_tiles` JSONB array.
- [ ] Reveal selection happens BEFORE animation — the animation is theatrical only. The item is pre-selected; the spinner/doors/cards are for fun.
- [ ] Daily draw limits tracked in `dashboard_configs.preferences.reveal_draws_today` JSONB object. Reset at midnight.
- [ ] Accepted reveal items create `tasks` records with `source = 'randomizer_reveal'` and `source_reference_id = list_item.id`.
- [ ] Play Dashboard has ZERO AI integration. No LiLa, no AI glaze, no AI-generated text on the dashboard itself. DailyCelebration AI is owned by PRD-11.
- [ ] Play members receive messages (read-only, inline card) but cannot send. No messaging compose capability.
- [ ] Play Dashboard: everything locked by mom. Child has no layout, widget, or configuration control. No edit mode.
- [ ] Graduation (Play → Guided): celebration overlay + 4-step tutorial (simpler than Guided → Independent). Data carries over. Reveal tile configs don't carry over to Guided.
- [ ] Bottom nav for Play shell: 🏠 Home | ✅ Tasks | ⭐ Stars | 🎮 Fun — emoji icons, 56px touch targets.

---

## DATABASE_SCHEMA.md Additions from This PRD

**Tables modified:**
- `dashboard_configs` — `preferences` JSONB extended with Play-specific keys (reading_support_enabled, reveal_tiles array, reveal_draws_today, graduation_tutorial_completed, message_display_mode).

**New section key constants:** `'task_tiles'`, `'mom_message'`.

**Tasks source value added:** `'randomizer_reveal'` — tasks created from reveal tile acceptance.

**No new tables defined.** Play Dashboard reuses `dashboard_configs` (PRD-14), `tasks` (PRD-09A), `lists` and `list_items` (PRD-09B), `conversation_messages` (PRD-15), and all gamification tables (PRD-24).

**No new triggers defined.** Daily draw reset handled by scheduled function (same midnight reset mechanism as streak calculations in PRD-24).

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Reveal task tiles instead of a separate "Next Best Thing" button** | Play-age kids don't need decision support — they need surprise and delight. The reveal animation transforms "do a chore" into a game. Same problem solved, age-appropriate solution. |
| 2 | **Mom picks reveal style per list from PRD-24B's existing animation library** | Reuses existing animation infrastructure. No new animation engineering. Mom gets personalization, kid gets fun. |
| 3 | **Mom configures selection mode (random/rotating/manual), repeat rules, re-pick, and daily limits** | Maximum mom control over the experience. Some moms want true randomness, others want to curate. Some allow re-picks, others say "you get what you get." All valid parenting styles supported. |
| 4 | **Receive-only messaging** | Play-age kids shouldn't compose messages independently. Mom can send encouragement/reminders that display inline. Send capability deferred to post-MVP. |
| 5 | **No AI integration on the Play Dashboard** | Play members have no LiLa access. The dashboard uses no AI — not even for glaze text. All fun comes from gamification and reveal animations, not AI. |
| 6 | **Graduation (Play → Guided) follows PRD-25 celebration + tutorial pattern** | Consistent graduation experience across all shell transitions. Simpler tutorial (4 steps vs 5) for the younger audience. |
| 7 | **Completed reveal items flow to Victory Recorder with category context** | "Did a Job: Wiped the kitchen table" tells a richer story than just "Wiped the kitchen table." The category adds meaning to the victory narrative. |
| 8 | **No calendar section in Play MVP** | Calendar is low-value for 3-7 year olds. Deferred to Post-MVP with the icon-rich, minimal-text rendering from the PRD-14 Play stub. |
| 9 | **Everything locked by mom — no child layout control** | Play members are 3-7. They don't manage dashboards. Mom decides everything. This is appropriate. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Icon-rich calendar section | Post-MVP — per PRD-14 Play stub spec with icons per event, minimal text |
| 2 | Audio/sound effects on reveals and celebrations | Post-MVP — device audio integration |
| 3 | Manual selection mode daily UI | Post-MVP — needs mom's daily selection surface |
| 4 | Play member message sending | Post-MVP — voice-to-parent "walkie-talkie" pattern potentially |
| 5 | Scratch-off and gift box reveal styles | Post-MVP — spinner, doors, and cards cover launch |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-14 (Personal Dashboard) | Play Dashboard stub (Screen 5) fully superseded by PRD-26. New section keys added. `preferences` JSONB extended. | Mark PRD-14 Screen 5 Play stub as "Superseded by PRD-26." Add new section keys and preference keys. |
| PRD-09A (Tasks) | New `source` value: `'randomizer_reveal'` for tasks created from reveal tile acceptance. | Add 'randomizer_reveal' to tasks.source documentation. |
| PRD-09B (Lists — Randomizer) | Randomizer lists now surface as reveal task tiles on Play dashboard, not just mom's Draw button. Extended with daily_draw_limit, selection_mode, repeat_rule. | Note Play dashboard as a consumer of Randomizer lists. Verify list_items schema supports all needed fields (it does — is_repeatable, is_available already exist). Add selection_mode and repeat_rule to Randomizer list configuration if not already present. |
| PRD-24B (Gamification Visuals) | Reveal animations confirmed for use in non-reward contexts (task reveals, not just treasure box reveals). | Note that reveal animation components must be reusable outside of reward contexts. Verify animation components accept arbitrary content (task item) not just reward data. |
| PRD-15 (Messages) | Play members confirmed as receive-only. Mom's messages display as inline dashboard cards, not via messaging page. | Note Play shell message display location (inline dashboard card). Verify message send API supports targeting Play members who have no messaging compose capability. |
| PRD-11 (Victory Recorder) | Confirmed: revealed items include category context in victory description. | Note that tasks with `source = 'randomizer_reveal'` should include the parent list title as category context in victory auto-creation. |
| PRD-22 (Settings) | Play Dashboard Management screen added to Settings → Family Management → Play member. | Add "Manage Dashboard" for Play members with reveal tile configuration UI. |
| Build Order Source of Truth | PRD-26 written. | Move PRD-26 to Section 2 (completed). |

---

*End of PRD-26*
