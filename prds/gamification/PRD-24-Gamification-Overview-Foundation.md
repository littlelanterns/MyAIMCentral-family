> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-24: Gamification System — Overview & Foundation

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-09A (Tasks, Routines & Opportunities), PRD-09B (Lists, Studio & Templates), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-11 (Victory Recorder & Daily Celebration), PRD-14 (Personal Dashboard), PRD-15 (Messages, Requests & Notifications), PRD-17 (Universal Queue & Routing System), PRD-22 (Settings)
**Created:** March 16, 2026
**Last Updated:** March 16, 2026
**Sub-PRDs:** PRD-24A (Visual Worlds & Overlay Engine), PRD-24B (Gamification Visuals & Interactions), PRD-24C (Family Challenges & Multiplayer Gamification)

---

## Overview

PRD-24 is the architectural umbrella for the MyAIM Family gamification system — the engine that transforms task completion, habit tracking, and personal growth into a rewarding, immersive experience for every family member. It defines the points and currency system, the reward menu and redemption flow, the treasure box reward containers, the gamification event pipeline that connects task completions to celebrations, streak tracking with schedule-aware logic, the Family Leaderboard, and the mom configuration journey for setting up and managing gamification per child.

The gamification system spans four sub-PRDs. PRD-24 (this document) defines the foundation — the data engine, points math, reward economy, and architectural boundaries. PRD-24A defines Visual Worlds (immersive dashboard themes) and the Overlay Engine (narrative game layers). PRD-24B defines the gamification visuals and interactions — reveal animations, Star Chart sequences, Color-Reveal progressions, and celebration effects. PRD-24C defines family-level gamification — challenges, quest boards, and multiplayer competition/collaboration mechanics.

The gamification system is built on three core principles. First, **mom-first configuration** — every aspect of gamification is opt-in, mom-configured, and adjustable per child. Mom decides the currency name, the earning rates, the reward menu, the visual theme, and whether gamification is enabled at all. Second, **celebration only** — the system celebrates what was accomplished, never highlights what wasn't. No failure states, no shame mechanics, no punishment through point deduction. Third, **equitable by design** — when family members with different point scales participate in shared challenges, the system normalizes contributions so effort is valued equally regardless of age or ability.

> **Mom experience goal:** Setting up gamification for each of my kids should feel like customizing a game for them personally — picking their world, their rewards, their pace. Once it's running, I shouldn't have to think about it. Points accumulate, rewards unlock, celebrations happen, and my kids are motivated. When I need to adjust something, one trip to Settings handles it. When a child earns a reward, they request it, and I approve it from my queue — or it auto-approves if I set it that way.

> **Depends on:** PRD-09A (Tasks) defines the task completion event that triggers points. PRD-09B (Lists) defines the Randomizer list type that treasure boxes and consequence wheels use. PRD-10 (Widgets) defines the dashboard grid and tracker infrastructure that gamification widgets render inside. PRD-11 (Victory Recorder) defines the DailyCelebration sequence whose Step 4 this PRD wires. PRD-15 (Messages, Requests & Notifications) provides the request/approval system for reward redemption. PRD-17 (Universal Queue) provides the Requests tab where mom processes reward approvals. PRD-22 (Settings) provides the Settings overlay where gamification configuration screens live.

---

## Architectural Boundaries

This section defines what lives in PRD-24 versus its sub-PRDs and versus other existing PRDs. These boundaries are authoritative.

### What PRD-24 Owns

| System | Scope |
|--------|-------|
| Points/currency engine | Earning rates, bonus logic, point balance tracking, currency naming, normalization for family equity |
| Reward menu & economy | Reward definitions, point costs, redemption request flow, auto-approve configuration, treasure box containers |
| Gamification event pipeline | Task completion → points → streak → theme progress → celebration trigger chain |
| Streak system | Schedule-aware streaks, grace periods, pause/resume, milestone detection |
| Family Leaderboard | Percentage-based ranking widget, opt-in configuration, privacy controls |
| Randomizer gamification extensions | Availability rules (unlimited/limited/scheduled), re-spin limits, treasure box unlock trigger, reveal visual selection |
| Mom configuration journey | Setup wizard gamification step, Settings panel screens, per-child configuration |
| Progress visualization options | Currency display modes (counter, level, ring, badge, hidden) — per-member configurable |

### What Sub-PRDs Own

| PRD | Scope |
|-----|-------|
| PRD-24A | Visual World themes (selection, skinning, progress tracking), Overlay Engine (config-driven renderer, launch overlays), DailyCelebration Step 4 wiring, Visual Asset Manifest |
| PRD-24B | Pre-rendered reveal animations (treasure chest, egg, gift box, slot machine), CSS/SVG interactive reveals (card flip, spinner, doors, scratch-off), Star Chart animation, Color-Reveal system, theme-aware animation styling, Content Creation Pipeline |
| PRD-24C | Time-boxed family challenges, family quest board, seasonal event framework (stub), family celebration integration with PRD-11B |

### What Other PRDs Own (Not Duplicated Here)

| PRD | What It Owns | How PRD-24 Connects |
|-----|-------------|---------------------|
| PRD-09A (Tasks) | Task completion events, task categories, opportunity claiming, routine step completions | PRD-24 listens to task completion events and fires the gamification pipeline |
| PRD-09B (Lists) | Randomizer list type, list item schema, draw/assign logic, SODAS forms | PRD-24 extends Randomizer items with availability rules and connects treasure boxes to Randomizer lists |
| PRD-10 (Widgets) | Dashboard grid, widget configuration modal, tracker types (grid, streak, tally, progress bar, etc.), multiplayer layer infrastructure | PRD-24 defines gamification-specific info widgets (I-16 through I-25 from Widget Catalog) that render in PRD-10's grid. PRD-24 defines theme token sets that PRD-10's widgets consume. |
| PRD-11 (Victory Recorder) | VictoryRecorder component (adult/teen), DailyCelebration sequence (5-step structure), victory auto-routing | PRD-24 wires DailyCelebration Step 4 with theme progress. PRD-24 feeds points data into Step 4's display. |
| PRD-15 (Messages/Requests) | Request system, approval flow, notification delivery | PRD-24 creates reward redemption requests that flow through PRD-15 |
| PRD-17 (Universal Queue) | Requests tab in Review Queue modal | Reward approval requests appear in mom's Requests tab |
| PRD-22 (Settings) | Settings overlay container, category navigation, per-member settings pattern | PRD-24 defines gamification settings screens hosted within PRD-22's framework |
| PRD-28 (Allowance) | Allowance calculator, real-money tracking, payment systems | Completely separate from gamification points. Points are in-app currency; allowance is real money. They never mix. |

---

## User Stories

### Points & Currency (Mom)
- As a mom, I want to choose what the gamification currency is called for each of my kids so it feels personal — "stars" for my 5-year-old, "gems" for my 12-year-old, "XP" for my teen.
- As a mom, I want to set how many points each task is worth by default, and override the value for specific tasks, so a 45-minute deep clean earns more than brushing teeth.
- As a mom, I want to choose whether a routine awards points per step or only on full completion, so I can incentivize completing the entire morning routine rather than cherry-picking easy steps.
- As a mom, I want to disable gamification entirely for a specific child if I decide intrinsic motivation works better for them.
- As a mom, I want to adjust point values anytime without losing existing balances, so I can recalibrate if the economy feels too easy or too hard.

### Points & Currency (Children)
- As a child, I want to see my points go up every time I complete a task so I feel the immediate reward of my effort.
- As a child in Play mode, I want to earn 1 star per task so I can count my stars on my fingers and understand exactly what I earned.
- As a child in Guided mode, I want to earn bigger numbers so completing my homework feels like a real achievement.

### Rewards & Redemption
- As a mom, I want to create a reward menu for each child with different point costs, so the rewards feel earned and proportional to effort.
- As a mom, I want some rewards to auto-approve when redeemed (small things like extra screen time) and others to require my approval (expensive things like a bookstore trip), so I'm not a bottleneck for every little reward.
- As a child, I want to browse my available rewards, see how close I am to each one, and tap "Request" to redeem, so I feel agency in choosing my rewards.
- As a mom, I want reward redemption requests to appear in my Review Queue alongside other family requests so I process everything in one place.

### Treasure Box
- As a mom, I want to set up a treasure box for a child that unlocks when they accumulate enough points, so there's a big exciting moment to work toward.
- As a mom, I want to choose what's inside the treasure box — either a specific reward or a randomized draw from a list of rewards — so I can create surprise or certainty depending on what motivates my child.
- As a mom, I want to choose whether the child sees progress toward the unlock or if it's a surprise, because some kids are motivated by watching progress and others love surprises.
- As a child, I want to see my treasure box on my dashboard — locked and pulsing gently when I'm working toward it, jumping and glowing when it's ready to open.
- As a child, I want to tap "Open!" and watch an amazing animation reveal my reward, so the moment feels special and exciting.
- As a mom, I want to choose the treasure box animation style (princess chest, pirate chest, pixel game style, storybook style) so it matches my child's personality.

### Streaks
- As a mom, I want streaks to align with my child's task schedule so they aren't penalized on days when no tasks were assigned.
- As a mom, I want to pause a child's streak during vacation or sick days so hard-earned progress isn't lost to circumstances beyond their control.
- As a mom, I want to configure how many grace days a streak allows (0, 1, or 2) per child, so I can balance discipline with grace.
- As a child, I want to see my streak count grow and celebrate milestones (7 days, 14 days, 30 days) so I feel proud of my consistency.

### Randomizer Gamification
- As a mom, I want the randomizer draw experience to feel fun and exciting — a spinning wheel, mystery doors, card flip — not just a boring random selection.
- As a mom, I want to choose which reveal animation style each randomizer list uses, so the consequence wheel feels different from the reward spinner.
- As a child drawing from a personal opportunity randomizer, I want to see the item revealed in an exciting way, decide if I want to accept it, and self-assign it as a task if I do.
- As a child who doesn't accept a drawn item, I want to re-spin (if mom allows it) and have the rejected item go back into the pool.

### Randomizer Item Availability
- As a mom, I want some randomizer items to be always available (repeatable chores), some limited to a certain number of completions (one-time projects), and some on a schedule (deep cleans available monthly), so the draw pool stays fresh and appropriate.
- As a mom, I want to set how many re-spins a child gets per day so they can't just keep spinning until they get the easiest option.

### Configuration & Settings
- As a mom, I want to configure gamification for each child from Settings, including their currency name, point rates, reward menu, visual theme, and progress display style.
- As a mom, I want a gamification step in the initial child setup wizard that walks me through the basics, with smart defaults I can accept or customize.
- As an Independent teen, I want to choose my own progress visualization style (if mom permits), so my dashboard feels like mine.
- As an adult who opted into gamification, I want to configure my own gamification preferences without needing mom to do it.

### Family Leaderboard
- As a mom, I want the Family Leaderboard to be opt-in and show completion percentages (not raw points) so it's fair across different ages and task loads.
- As a mom, I want to enable or disable the leaderboard at any time, and choose whether it shows names or anonymous rankings.
- As a family member on the leaderboard, I want to see my ranking and feel motivated by friendly family competition — not shamed by being last.

---

## Screens

### Screen 1: Points Dashboard Widget (All Shells)

**What the user sees:**

A dashboard widget (PRD-10 grid, deployable in S/M/L sizes) showing the member's current gamification status. The display adapts based on the visualization mode mom (or the member) selected.

**Visualization modes:**

| Mode | Display | Best For |
|------|---------|----------|
| Counter | "[icon] 287 stars" with the configured currency name and icon | Play, Guided — tangible numbers |
| Level | "Level 7" with a progress bar showing percentage to Level 8 | Guided, Independent — abstracts raw numbers |
| Progress Ring | Circular donut filling based on weekly/monthly completion percentage | Teens, adults — clean data visualization |
| Minimal Badge | Current streak count + most recent achievement badge. No point number. | Adults, minimalist teens |
| Hidden | No persistent display. Points accrue in the background. Rewards and treasure boxes still function. | Adults, intrinsic-motivation preference |

**Per-mode widget content:**

Counter mode (small):
```
┌────────────────────┐
│  ⭐ 287 stars       │
│  ████████░░ Lv 5   │
└────────────────────┘
```

Counter mode (medium):
```
┌──────────────────────────────────┐
│  ⭐ 287 stars                     │
│  ████████░░░░░░ Level 5          │
│  Today: +35   Streak: 12 days   │
│  [View Rewards]                  │
└──────────────────────────────────┘
```

Level mode (medium):
```
┌──────────────────────────────────┐
│        Level 7                   │
│  ██████████░░░░░░░░ 65%         │
│  142 more to Level 8            │
│  🔥 12-day streak               │
└──────────────────────────────────┘
```

**Shell rendering:**

| Shell | Defaults | Adjustments |
|-------|----------|-------------|
| Play | Counter mode, largest text, currency icon prominent, animated sparkle on point display | Emoji permitted per PRD-03 |
| Guided | Counter or Level mode, large text, streak visible | No emoji |
| Independent | Any mode, standard text | Member chooses (if mom permits) |
| Adult | Any mode, standard text, often Progress Ring or Hidden | Self-configured |

**Interactions:**
- Tap widget → opens Points Detail modal (Screen 2)
- [View Rewards] button (medium/large widget) → opens Reward Menu (Screen 3)

**Data read:**
- `gamification_configs` for currency name, icon, visualization mode
- `family_members` for current point balance, streak data, level
- Today's `gamification_events` for daily point total

---

### Screen 2: Points Detail Modal

**What the user sees:**

A modal showing the member's complete gamification status. Three tabs: Overview, History, Achievements.

**Overview tab:**
- Current point balance (large, prominent, themed)
- Current level + progress bar to next level
- Active streak count + next milestone
- Today's earnings breakdown (which tasks earned how many points)
- Weekly trend (simple sparkline showing daily point totals for the past 7 days)

**History tab:**
- Scrollable list of point transactions, newest first
- Each entry shows: date, description ("Completed: Clean bedroom"), points earned, running balance
- Filter by: All, Tasks, Bonuses, Streak Milestones, Rewards Spent

**Achievements tab:**
- Grid of earned achievement badges
- Each badge shows: icon, name, date earned
- Unearned badges shown as locked silhouettes with unlock criteria
- Categories: Streak milestones, task milestones, perfect week/month, overlay stage completions, color-reveal completions

> **Forward note:** Achievement badges are defined in PRD-24A (overlay completions) and PRD-24B (tracker completions). PRD-24 defines the display surface and the badge data model. Sub-PRDs populate the badge catalog.

**Data read:**
- `gamification_events` for transaction history
- `gamification_achievements` for earned badges
- `gamification_configs` for level thresholds and currency display

---

### Screen 3: Reward Menu

**What the user sees:**

A modal showing available rewards the member can redeem, organized by point cost (cheapest first).

```
┌──────────────────────────────────────────────────┐
│  Reward Menu                              ⭐ 287  │
│  ─────────────────────────────────────────────── │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🎮  30 min extra screen time      50 ⭐     │ │
│  │     [Redeem]                                 │ │
│  ├─────────────────────────────────────────────┤ │
│  │ 🍦  Ice cream after dinner        75 ⭐     │ │
│  │     [Redeem]                                 │ │
│  ├─────────────────────────────────────────────┤ │
│  │ 📚  Trip to the bookstore        200 ⭐     │ │
│  │     ████████░░░░░ 287/200 — Ready!          │ │
│  │     [Redeem]                                 │ │
│  ├─────────────────────────────────────────────┤ │
│  │ 🎨  Craft supply run ($10)       300 ⭐     │ │
│  │     █████████░░░░ 287/300 — 13 more!        │ │
│  │     [locked]                                 │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Each reward shows:**
- Icon (emoji or uploaded image)
- Name and description
- Point cost
- Progress bar if not yet affordable
- [Redeem] button if affordable, [locked] if not
- Small badge: "Auto-approves" or "Needs mom's approval"

**Interactions:**
- Tap [Redeem] → confirmation dialog: "Spend [cost] [currency] on [reward]?"
- On confirm:
  - If auto-approve: points deducted, reward marked as redeemed, celebration micro-animation, notification to mom
  - If requires approval: points reserved (not deducted yet), request created in PRD-15 system, appears in mom's Requests tab (PRD-17), child sees "Pending approval" status
- Mom approves → points deducted, reward status changes to "Approved," celebration notification sent to child
- Mom denies → reserved points returned, reward status "Not this time" with optional mom note, gentle notification to child

**Data created:**
- `reward_redemptions` record with status, points_cost, approval_type
- `requests` record (PRD-15) if requires_approval = true

---

### Screen 4: Treasure Box Widget (Dashboard)

**What the user sees:**

A 1×1 dashboard widget showing a preview image of the configured treasure box animation template (princess chest, pirate chest, pixel chest, storybook chest). The widget has two states:

**Locked state (working toward unlock):**
- Small preview of the treasure box in its closed, idle state
- Subtle pulsing glow animation
- If progress is visible (mom configured): progress indicator below — "23/50 ⭐" or a mini progress bar
- If progress is hidden (surprise mode): just the locked chest with a small lock icon

**Unlocked state (ready to open):**
- Treasure box preview with excited animation — bouncing, glowing, dancing in place
- "Open!" button below, prominent and inviting
- Pulsing glow intensifies

> **Decision rationale:** The treasure box is a 1×1 widget rather than a larger display because it's ambient motivation — always visible, always reminding the child what they're working toward, but not dominating the dashboard. The big moment happens in the full-screen modal.

**Interactions:**
- Tap [Open!] when unlocked → launches full-screen reveal modal (Screen 5)
- Tap when locked → shows progress detail tooltip or mini-modal with progress info

**Data read:**
- `treasure_boxes` for configuration, trigger type, current progress
- `gamification_configs` for animation template selection

---

### Screen 5: Treasure Box Reveal Modal (Full-Screen)

**What the user sees:**

A full-screen modal (or near-full-screen on desktop) that plays the reward reveal ceremony.

**Sequence:**

1. **Modal opens** with a brief fade-in. Background dims. The treasure box animation template's video plays centered in the modal.

2. **Video plays** (3-5 seconds). The pre-rendered 3D animation plays: chest wobbles, spins, lid bursts open with golden light. (Or egg cracks and hatches, or gift box unwraps, or slot machine reels spin — depending on the configured template.)

3. **CSS sparkle overlay** triggers at the moment of opening. Theme-colored particles burst from the center of the video frame, extending beyond the video boundaries into the modal space. These are CSS/SVG particles rendered by the app, using the child's Visual World theme colors.

4. **Reward reveal** appears after the animation peak. A card slides up from below showing:
   - The reward icon and name (large, celebratory)
   - The reward description
   - [Claim!] button (if auto-approve) or [Request from Mom] button (if requires approval)

5. **Confetti rain** plays across the full modal for 2-3 seconds.

6. **Settle.** Animation calms. Reward card is prominent. Action buttons are clear.

**If treasure box contains a Randomizer list:**
- Instead of a single reward, the animation reveals one randomly-selected item from the list
- The unchosen items are never shown — only the selected reward appears
- The item follows the same Randomizer availability rules (repeatable, limited, scheduled)

**Trigger types that open this modal:**

| Trigger | How It Works |
|---------|-------------|
| Points threshold | Child accumulates N points → box unlocks → child taps Open → modal plays → points are deducted |
| Completion unlock | Specific task or tracker completes → box unlocks → child taps Open → modal plays |
| Count-based | Child completes N instances of a tracked item → box unlocks → child taps Open → modal plays |
| Randomizer draw (Context A) | Mom taps Draw on her Randomizer widget → modal plays with mom's selected reveal visual → mom assigns result to child |

**Animation templates (pre-rendered 3D video):**

All templates follow a consistent animation sequence: idle glow → wobble with anticipation → bouncy jump with 360° spin → lid bursts open with themed particle explosion → soft landing → lingering shimmer fade. Each template adapts the materials, particle types, and color palette to its theme.

| Template | Aesthetic | Default File |
|----------|-----------|-------------|
| Pirate chest | Weathered dark wood, rusty iron bands, skull-and-crossbones latch, gold doubloons burst | `reveal_pirate.webm` |
| Princess jewelry box | Pearlescent pink/white, golden crown clasp, diamond accents, pink sparkles and tiny tiaras | `reveal_princess.webm` |
| Medieval strongbox | Heavy oak, hammered iron straps, heraldic shield latch, golden light rays and floating banners | `reveal_medieval.webm` |
| Steampunk contraption | Polished brass/copper, exposed gears, pressure gauge, steam vents, bronze sparks and spinning cogs | `reveal_steampunk.webm` |
| Candy Land chest | Glossy frosted cake layers, candy cane trim, gumdrop rivets, lollipop clasp, candy and sprinkle burst | `reveal_candy_land.webm` |
| Gemstone geode | Carved amethyst, crystal clusters, emerald/ruby inlays, diamond clasp, prismatic light beams | `reveal_gemstone.webm` |
| Lisa Frank rainbow | Neon gradient surface, holographic rainbow patterns, dolphin clasp, neon sparkles and holographic stars | `reveal_lisa_frank.webm` |
| Mystery egg | Glowing egg wobbles, cracks spread, creature/prize hatches out | `reveal_mystery_egg.webm` |
| Gift box | Wrapped box with bow, ribbon unfurls, lid pops, confetti burst | `reveal_gift_box.webm` |
| Slot machine | 3D reels spin, decelerate, land on reward | `reveal_slot_machine.webm` |

> **Content pipeline note:** The template list is extensible — adding a new template is a content addition (generate video + add to storage), not a code change. The modal component accepts any video URL via the `animation_template` key on `treasure_boxes`. Overlay-themed reveal variations (Apothecary cauldron reveal, Kingdom Builder gate reveal) will be created through the Content Creation Pipeline defined in PRD-24B.

> **Batch creation validated:** The first 7 templates above were successfully batch-generated using a three-step pipeline: (1) Claude generates structured prompt arrays (JSON with theme name + detailed video prompt), (2) Manus batch-executes the prompts against an AI video generation tool, (3) output organized into asset folders. This confirms the Content Creation Pipeline approach and is the exact pattern the Claude Skill will formalize for overlay content, Visual World backgrounds, and all other batch-generated assets.

**Technical implementation note:**
- Video element: `<video>` with WebM primary source, MP4 H.264 fallback, `playsinline muted` attributes
- Video plays in a centered frame within the modal. No background removal needed.
- CSS sparkle/confetti overlay renders on top of the video frame, in theme colors
- Poster frame (first frame as static image) displays instantly while video loads

**Data created:**
- `treasure_box_opens` record with timestamp, reward_revealed, trigger_type
- `reward_redemptions` record if reward requires approval
- `gamification_events` record for points deducted (if points threshold trigger)

---

### Screen 6: Randomizer Reveal Experience

**What the user sees:**

When a Randomizer list has a gamification reveal visual configured, the draw experience launches in a modal rather than the standard inline card from PRD-09B.

**CSS/SVG Interactive Reveal Visuals:**

| Visual | Interaction | Theme Adaptation |
|--------|-------------|------------------|
| Spinner wheel | Tap to spin, watch deceleration, pointer lands on result | Wheel segments, pointer, hub, particles all use Visual World theme tokens. Per-theme decorative variants on pointer and hub shape. |
| Three doors | Tap a door to choose, door opens with light, unchosen doors fade away (never reveal) | Door shapes vary by Visual World: castle doors, spaceship airlocks, hobbit doors, gingerbread doors. All CSS/SVG path variants. |
| Card flip | Tap a face-down card, it flips with 3D perspective rotation, unchosen cards fade away (never reveal) | Card back patterns, diamond/motif shapes, shimmer colors, particle colors all from theme tokens. |
| Scratch-off | Drag finger/cursor across surface to reveal reward underneath | Coating texture themed: frost (Arctic), sand (Desert), moss (Forest), stardust (Space). Reveal glow in theme colors. |

**Theme adaptation tiers:**
- **Tier 1 — Color theming (all reveals, MVP):** Every visual reads theme tokens for colors, particles, and glow effects. Automatic from design system.
- **Tier 2 — Shape theming (doors and spinner, enhanced):** Per-Visual-World SVG shape variants for door frames and spinner decorative elements. 3-5 shape sets for launch themes.

**After reveal:**
- Selected item displayed with celebration animation
- For Context A (mom's tool): [Assign to...] button → member picker → creates task
- For Context B (personal draw): [Accept] button → self-assigns as Opportunity task; [Pass] button → item returns to pool, re-spin count decremented
- For Context C (treasure box): item revealed as the reward, follows reward redemption flow

**Data read:**
- `lists` + `list_items` for available items
- `gamification_configs` for reveal visual selection per list

---

### Screen 7: Reward Menu Editor (Mom — Settings)

> **Hosted within:** PRD-22 Settings overlay → Family Members → [Child Name] → Gamification → Rewards

**What the user sees:**

A list of configured rewards for this child, with add/edit/delete actions.

```
┌──────────────────────────────────────────────────┐
│  Rewards for Jake                     [+ Add]    │
│  ─────────────────────────────────────────────── │
│                                                   │
│  🎮  30 min extra screen time                    │
│      Cost: 50 gems · Auto-approves              │
│      [Edit] [Delete]                             │
│                                                   │
│  🍦  Ice cream after dinner                      │
│      Cost: 75 gems · Auto-approves              │
│      [Edit] [Delete]                             │
│                                                   │
│  📚  Trip to the bookstore                       │
│      Cost: 200 gems · Requires approval          │
│      [Edit] [Delete]                             │
│                                                   │
│  🎨  Craft supply run ($10)                      │
│      Cost: 300 gems · Requires approval          │
│      [Edit] [Delete]                             │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Add/Edit reward fields:**
- Name (required)
- Description (optional)
- Icon (emoji picker or image upload)
- Point cost (required, number input)
- Approval type: Auto-approve / Requires my approval
- Availability: Always / Limited (number of redemptions) / Scheduled (uses universal scheduler)
- Notes to child (optional — shows on the reward card)

**Data created/updated:**
- `gamification_rewards` records

---

### Screen 8: Gamification Settings Panel (Mom — Settings)

> **Hosted within:** PRD-22 Settings overlay → Family Members → [Child Name] → Gamification

**What the user sees:**

A settings panel for configuring all gamification aspects for one child. Organized into collapsible sections.

**Section A — Enable/Disable:**
- Master toggle: "Enable gamification for [Name]" (default ON for Guided/Play, OFF for Independent/Adult)
- When OFF: all gamification features hidden for this member, but data preserved (can re-enable without losing progress)

**Section B — Currency:**
- Currency name (text input, default varies by shell: "stars" for Play, "points" for Guided, "points" for Independent)
- Currency icon (emoji picker, default: star)

**Section C — Point Rates:**
- Base points per task (number input, default varies by shell: 1 for Play, 10 for Guided/Independent)
- Bonus at 3 tasks (number input, default: base × 3 + 5 bonus)
- Bonus at 5+ tasks (number input, default: base × 5 + 10 bonus)
- Routine completion mode: "Award per step" / "Award on full completion" (toggle, default: per step)

> **Decision rationale:** Per-task point overrides are configured on the task itself (PRD-09A Task Creation Modal, Section 7: Rewards), not in gamification settings. The gamification settings panel defines the defaults; individual tasks can override with a higher or lower value.

**Section D — Streaks:**
- Grace period: 0 / 1 / 2 days (picker, default: 1)
- Schedule-aware: ON/OFF (default: ON) — when ON, streaks only count scheduled days, skipping unscheduled days automatically
- Allow manual pause: ON/OFF (default: ON) — shows "Pause Streak" button to mom

**Section E — Progress Display:**
- Visualization mode: Counter / Level / Progress Ring / Minimal Badge / Hidden (visual picker with previews)
- Level thresholds: auto-calculated (default) or custom (mom defines point ranges per level)

**Section F — Treasure Box:**
- [Configure Treasure Boxes] → opens treasure box configuration (Screen 9)

**Section G — Rewards:**
- [Manage Reward Menu] → opens reward menu editor (Screen 7)

**Section H — Visual World:**
- [Choose Visual World] → opens Visual World selector (defined in PRD-24A)
- Current theme displayed with thumbnail

**Section I — Reveal Visuals:**
- Default reveal animation for this child's Randomizer draws (visual picker: spinner, doors, cards, scratch-off)
- Treasure box animation template (visual picker: pirate, princess, medieval, steampunk, candy_land, gemstone, lisa_frank, egg, gift_box, slot_machine)

---

### Screen 9: Treasure Box Configuration (Mom — Settings)

> **Hosted within:** Settings → Family Members → [Child Name] → Gamification → Treasure Boxes

**What the user sees:**

A list of configured treasure boxes for this child, plus [+ Add Treasure Box].

**Add/Edit treasure box fields:**

- Name (e.g., "Weekly Reward Box," "Reading Challenge Prize")
- Animation template: pirate / princess / medieval / steampunk / candy_land / gemstone / lisa_frank / egg / gift_box / slot_machine (visual picker with preview thumbnails)
- Trigger type:
  - **Points threshold:** Set point cost. Points deducted on open.
  - **Completion unlock:** Link to a specific task or tracker. Box unlocks when task/tracker completes.
  - **Count-based:** Set a count target and what's being counted (task completions, tracker entries, etc.)
- Progress visibility: Visible to child / Surprise (hidden until unlock)
- What's inside:
  - **Single reward:** Pick from reward menu or create a one-time reward
  - **Random draw:** Link to a Randomizer list — one item is randomly revealed on open
- Repeating: One-time / Repeating (re-locks after opening, progress resets)
- Dashboard widget: Auto-deploy 1×1 widget to child's dashboard (default: ON)

**Data created/updated:**
- `treasure_boxes` records

---

### Screen 10: Family Leaderboard Widget (Dashboard)

**What the user sees:**

A dashboard widget (PRD-10 grid, deployable in M/L sizes) showing family member rankings.

**Display:**
```
┌──────────────────────────────────┐
│  Family Leaderboard  👑          │
│  This week                       │
│  ─────────────────────────────── │
│  1. Emma      ████████░░  92%   │
│  2. Jake      ██████░░░░  78%   │
│  3. Mom       █████░░░░░  71%   │
│  4. Lily      ████░░░░░░  65%   │
└──────────────────────────────────┘
```

**Key behaviors:**
- Shows **completion percentage**, not raw points — equitable across different ages and task loads
- Period toggle: Today / This Week / This Month
- Opt-in only — mom explicitly enables via widget deployment. Never appears by default.
- Play mode children always see collaborative framing ("Look how much our family did!") rather than competitive ranking
- Mom configures: show names / show anonymous ("1st place, 2nd place...") / show only top 3
- Percentages calculated as: tasks completed ÷ tasks assigned × 100 for each member

> **Decision rationale:** Percentage-based rather than points-based because a Play kid with 3 assigned tasks who completes all 3 is at 100%, while a teen with 11 assigned tasks who completes 8 is at 73%. Raw points would make the teen look ahead despite the younger child's perfect day.

**Data read:**
- `task_completions` aggregated per member for the selected period
- `task_assignments` for total assigned count per member

---

## Gamification Event Pipeline

This is the core engine that connects task completions to the gamification system. Every time a qualifying event occurs, this pipeline runs.

### Event Flow: Task Completion

```
1. Task marked complete → task_completions record created (PRD-09A)

2. GAMIFICATION CHECK:
   - Is gamification enabled for this member? (gamification_configs.enabled)
   - If not → stop. No points, no events.

3. CALCULATE POINTS:
   - Does this task have a points_override? → use override value
   - No override → use member's base_points_per_task from gamification_configs
   - Check daily bonus conditions:
     - Count today's completions for this member
     - 3rd task today? → add bonus_at_three value
     - 5th+ task today? → add bonus_at_five value (replaces bonus_at_three, not additive)

4. AWARD POINTS:
   - Increment family_members.gamification_points by calculated amount
   - Create gamification_events record: type='points_earned', amount, source='task_completed', source_reference_id=task_id

5. CHECK STREAK:
   - Is this the first task completion today? → update streak
   - Was yesterday (or last scheduled day, if schedule-aware) completed? → increment current_streak
   - Gap detected? → check grace period. Grace available? → use grace, increment streak. No grace? → reset to 1.
   - Streak milestone hit (7, 14, 21, 30, 60, 90)? → award milestone bonus points, create gamification_events record, trigger milestone celebration

6. CHECK LEVEL:
   - Does new point total cross a level threshold?
   - If yes → update family_members.gamification_level, create gamification_events record: type='level_up'

7. CHECK TREASURE BOXES:
   - Any treasure_boxes with trigger_type='points_threshold' where current balance >= threshold?
   - Any treasure_boxes with trigger_type='count_based' where completion count reached target?
   - Any treasure_boxes with trigger_type='completion_unlock' linked to this task?
   - If unlocked → update treasure_box status to 'ready', trigger unlock notification

8. CHECK OVERLAY PROGRESS (stub → PRD-24A):
   - What task category was this? Map to overlay collectible.
   - Update overlay progress. Check if new stage reached.

9. CHECK THEME PROGRESS (stub → PRD-24A):
   - Has a new theme unlock been triggered?

10. UPDATE DAILY RECORD:
    - Update or create today's gamification_daily_summary with points_earned_today, tasks_completed_today

11. TRIGGER MICRO-CELEBRATION (if configured):
    - Immediate: points popup animation (+10 ⭐) on the task completion
    - This is a small CSS animation on the task card, NOT the full treasure box ceremony
```

### Event Flow: Streak Milestone

```
1. Streak milestone detected in step 5 above

2. AWARD BONUS:
   - 7 days: +50 (adjusted to member's scale — Play: +5, Guided/Independent: +50)
   - 14 days: +100 (Play: +10, Guided/Independent: +100)
   - 21 days: +150 (Play: +15, Guided/Independent: +150)
   - 30 days: +200 (Play: +20, Guided/Independent: +200)
   - 60 days: +300, 90 days: +500

3. CREATE ACHIEVEMENT:
   - gamification_achievements record: type='streak_milestone', value=streak_count

4. NOTIFY:
   - Notification to child: "🔥 [streak] day streak! Amazing!"
   - Notification to mom: "[Child name] hit a [streak]-day streak!"

5. QUEUE FOR CELEBRATION:
   - Add to today's gamification_daily_summary.streak_milestone_today
   - DailyCelebration Step 3 (PRD-11) will show the milestone with enhanced animation
```

### Event Flow: Reward Redemption

```
1. Child taps [Redeem] on a reward

2. CHECK AFFORDABILITY:
   - Current balance >= reward cost?
   - If not → show "Not enough [currency]" message. Stop.

3. CHECK APPROVAL TYPE:
   - Auto-approve?
     → Deduct points immediately
     → Create reward_redemptions record: status='approved'
     → Create gamification_events record: type='points_spent'
     → Micro-celebration on the reward card
     → Notification to mom: "[Child] redeemed [reward]"
   
   - Requires approval?
     → Reserve points (mark as pending, not deducted)
     → Create reward_redemptions record: status='pending_approval'
     → Create request record (PRD-15): type='reward_redemption'
     → Request appears in mom's Requests tab (PRD-17)
     → Child sees "Pending approval" on the reward

4. MOM APPROVES:
   → Deduct reserved points
   → Update reward_redemptions: status='approved'
   → Notification to child: "[Reward] approved! 🎉"

5. MOM DENIES:
   → Return reserved points to balance
   → Update reward_redemptions: status='denied'
   → Optional mom note attached
   → Gentle notification to child: "[Reward] — not this time" with mom's note if provided
```

### Event Flow: Treasure Box Unlock

```
1. Trigger condition met (points threshold / completion / count-based)

2. UPDATE TREASURE BOX:
   - Set status = 'ready'
   - Set unlocked_at timestamp

3. ACTIVATE WIDGET:
   - Treasure box widget on child's dashboard transitions from locked to unlocked state
   - Widget starts dancing/glowing animation

4. NOTIFY:
   - Notification to child: "Your treasure box is ready to open! 🎁"
   - Notification to mom: "[Child]'s treasure box unlocked"

5. CHILD TAPS OPEN:
   - Launch reveal modal (Screen 5)
   - Play animation template video
   - CSS sparkle overlay in theme colors
   - Reveal reward (single or random from linked Randomizer list)

6. POST-OPEN:
   - If single reward: create reward_redemptions record
   - If Randomizer draw: apply item availability rules, create record
   - If repeating box: reset progress, set status = 'locked', counter resets
   - If one-time box: set status = 'completed'
   - Deduct points if points_threshold trigger

7. LOG:
   - Create treasure_box_opens record
   - Create gamification_events record: type='treasure_box_opened'
```

---

## Family Challenge Equity System

When family members with different point scales participate in shared challenges or appear on the Family Leaderboard, raw points must be normalized for fairness.

### Normalization Formula

Each member has a `base_points_per_task` configured in `gamification_configs`. The normalization factor converts any member's points to a common scale.

```
Normalized contribution = raw_points_earned ÷ member's base_points_per_task
```

**Example:**
- Play kid (base: 1 point/task) completes 5 tasks → earns 5 points → normalized: 5 ÷ 1 = 5 task-equivalents
- Guided kid (base: 10 points/task) completes 5 tasks → earns 50 points → normalized: 50 ÷ 10 = 5 task-equivalents
- Both contributed equally: 5 task-equivalents each

**Where normalization applies:**
- Family Leaderboard (percentage-based, which inherently normalizes)
- Family Challenges (PRD-24C) — contribution scores use task-equivalents
- Any family-level aggregation comparing members

**Where normalization does NOT apply:**
- Individual point balances (a child's 287 gems are their 287 gems)
- Reward redemption (costs are set against the individual's scale)
- Treasure box thresholds (set per-child)
- DailyCelebration (celebrates the individual's real numbers)

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full configuration, full visibility across all members, reward approval, leaderboard control, treasure box setup, all Settings panels | Mom is the gamification administrator |
| Dad / Additional Adult | Self-configuration (if gamification enabled for self). View children's gamification status if mom grants permission. Cannot configure children's gamification without permission. | Follows PRD-02 permission model |
| Special Adult | View gamification status for assigned children during active shift. Can mark tasks complete which triggers points pipeline. Cannot configure gamification. Cannot approve rewards. | Shift-scoped per PRD-02 |
| Independent (Teen) | Sees own points, rewards, streaks, achievements. Can redeem rewards. Can choose own visualization mode if mom permits. Cannot modify point rates or reward costs. | Mom controls whether teen can self-configure visual preferences |
| Guided | Sees own points, rewards, streaks in age-appropriate display. Can redeem rewards (triggers approval flow). Can tap treasure box to open. All configuration by mom. | Simplified UI per PRD-04 Guided shell |
| Play | Sees stars/currency in large, playful display. Treasure box widget with big Open button. Mom or caregiver assists with redemption. All configuration by mom. | Maximum animation, simple interaction per PRD-04 Play shell |

### Shell Behavior

| Feature | Mom/Adult | Independent | Guided | Play |
|---------|-----------|-------------|--------|------|
| Points widget | All visualization modes | All visualization modes | Counter or Level | Counter only |
| Reward menu | Full editor | Browse & redeem | Browse & redeem (simplified) | Mom-assisted |
| Treasure box | Configure + view all children | Own boxes | Own boxes (big buttons) | Own boxes (biggest buttons, most animation) |
| Leaderboard | Configure + view | View (if enabled) | View (collaborative framing) | Never competitive. "Look what our family did!" |
| Settings | Full gamification config | Visual preference only (if permitted) | Not accessible | Not accessible |
| Micro-celebration | Subtle point popup | Moderate animation | Full animation | Maximum animation with sound hooks |

---

## Data Schema

### Table: `gamification_configs`

One record per family member. Stores all gamification configuration for that member.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (UNIQUE) |
| enabled | BOOLEAN | true | NOT NULL | Master toggle |
| currency_name | TEXT | 'stars' | NOT NULL | Display name for points |
| currency_icon | TEXT | '⭐' | NOT NULL | Emoji or icon reference |
| base_points_per_task | INTEGER | 10 | NOT NULL | Default earning rate |
| bonus_at_three | INTEGER | 35 | NOT NULL | Total points when 3rd task completed (not additive bonus) |
| bonus_at_five | INTEGER | 60 | NOT NULL | Total points when 5th+ task completed |
| routine_points_mode | TEXT | 'per_step' | NOT NULL | 'per_step' or 'on_completion' |
| streak_grace_days | INTEGER | 1 | NOT NULL | 0, 1, or 2 |
| streak_schedule_aware | BOOLEAN | true | NOT NULL | Only count scheduled days |
| streak_pause_enabled | BOOLEAN | true | NOT NULL | Allow manual pause |
| streak_paused | BOOLEAN | false | NOT NULL | Currently paused |
| streak_paused_at | TIMESTAMPTZ | | NULL | When pause started |
| visualization_mode | TEXT | 'counter' | NOT NULL | 'counter', 'level', 'progress_ring', 'minimal_badge', 'hidden' |
| level_thresholds | JSONB | '[]' | NOT NULL | Custom level boundaries or empty for auto-calculated |
| reveal_visual_default | TEXT | 'spinner' | NOT NULL | Default Randomizer reveal: 'spinner', 'doors', 'cards', 'scratch_off' |
| treasure_box_template | TEXT | 'pirate' | NOT NULL | Default treasure box animation: 'pirate', 'princess', 'medieval', 'steampunk', 'candy_land', 'gemstone', 'lisa_frank', 'egg', 'gift_box', 'slot_machine' |
| visual_world_theme | TEXT | | NULL | Active Visual World (stub → PRD-24A) |
| overlay_id | TEXT | | NULL | Active overlay (stub → PRD-24A) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom reads/writes all. Members read own. Dad reads children if permitted.

**Indexes:**
- `(family_member_id)` UNIQUE — one config per member
- `(family_id)` — family-level queries

---

### Table: `gamification_events`

Append-only ledger of all gamification transactions. Never updated or deleted.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| event_type | TEXT | | NOT NULL | 'points_earned', 'points_spent', 'points_reserved', 'points_returned', 'level_up', 'streak_milestone', 'treasure_box_opened', 'achievement_earned' |
| points_amount | INTEGER | 0 | NOT NULL | Positive for earned, negative for spent |
| balance_after | INTEGER | | NOT NULL | Running balance after this event |
| source | TEXT | | NOT NULL | 'task_completed', 'daily_bonus', 'streak_milestone', 'reward_redeemed', 'treasure_box', 'manual_adjustment' |
| source_reference_id | UUID | | NULL | FK to the source record (task_id, reward_id, etc.) |
| description | TEXT | | NULL | Human-readable: "Completed: Clean bedroom" |
| metadata | JSONB | '{}' | NOT NULL | Additional context (streak_count, level_reached, etc.) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped. Mom reads all. Members read own. Append-only — no updates or deletes.

**Indexes:**
- `(family_member_id, created_at DESC)` — member history
- `(family_id, event_type)` — family-level aggregation
- `(family_member_id, created_at::date)` — daily summary queries

---

### Table: `gamification_rewards`

Mom-configured rewards per child.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| name | TEXT | | NOT NULL | |
| description | TEXT | | NULL | |
| icon | TEXT | | NULL | Emoji or image URL |
| points_cost | INTEGER | | NOT NULL | |
| approval_type | TEXT | 'requires_approval' | NOT NULL | 'auto_approve' or 'requires_approval' |
| availability | TEXT | 'always' | NOT NULL | 'always', 'limited', 'scheduled' |
| max_redemptions | INTEGER | | NULL | For 'limited' availability |
| redemption_count | INTEGER | 0 | NOT NULL | Current count |
| recurrence_config | JSONB | | NULL | For 'scheduled' availability (same shape as PRD-09A task recurrence) |
| notes_to_child | TEXT | | NULL | Shows on reward card |
| sort_order | INTEGER | 0 | NOT NULL | |
| is_active | BOOLEAN | true | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. Members read own (active only).

---

### Table: `reward_redemptions`

Track every reward redemption attempt and its status.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| reward_id | UUID | | NOT NULL | FK → gamification_rewards |
| points_cost | INTEGER | | NOT NULL | Points at time of redemption (snapshot) |
| status | TEXT | 'pending_approval' | NOT NULL | 'pending_approval', 'approved', 'denied', 'auto_approved' |
| request_id | UUID | | NULL | FK → requests (PRD-15) if requires approval |
| approved_by | UUID | | NULL | FK → family_members (who approved) |
| approved_at | TIMESTAMPTZ | | NULL | |
| denied_reason | TEXT | | NULL | Mom's optional note on denial |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full access. Members read own.

---

### Table: `treasure_boxes`

Mom-configured treasure box reward containers.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| name | TEXT | | NOT NULL | |
| animation_template | TEXT | 'storybook' | NOT NULL | 'princess', 'pirate', 'pixel', 'storybook', 'egg', 'gift_box', 'slot_machine' |
| trigger_type | TEXT | | NOT NULL | 'points_threshold', 'completion_unlock', 'count_based' |
| trigger_config | JSONB | '{}' | NOT NULL | { points_threshold: 100 } or { task_id: uuid } or { count_target: 10, count_source: 'task_completions' } |
| progress_visible | BOOLEAN | true | NOT NULL | Whether child sees progress toward unlock |
| content_type | TEXT | | NOT NULL | 'single_reward' or 'randomizer' |
| reward_id | UUID | | NULL | FK → gamification_rewards (if single_reward) |
| randomizer_list_id | UUID | | NULL | FK → lists (if randomizer, must be a randomizer-type list) |
| is_repeating | BOOLEAN | false | NOT NULL | Re-locks after opening |
| status | TEXT | 'locked' | NOT NULL | 'locked', 'ready', 'completed' |
| current_progress | INTEGER | 0 | NOT NULL | Current count/points toward unlock |
| unlocked_at | TIMESTAMPTZ | | NULL | |
| deploy_widget | BOOLEAN | true | NOT NULL | Auto-deploy 1×1 widget to child's dashboard |
| is_active | BOOLEAN | true | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. Members read own (active only).

---

### Table: `treasure_box_opens`

Log of every treasure box opening.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| treasure_box_id | UUID | | NOT NULL | FK → treasure_boxes |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| reward_revealed | TEXT | | NOT NULL | Description of what was revealed |
| reward_id | UUID | | NULL | FK → gamification_rewards (if single reward) |
| randomizer_item_id | UUID | | NULL | FK → list_items (if random draw) |
| animation_template_used | TEXT | | NOT NULL | Which video played |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped. Mom reads all. Members read own.

---

### Table: `gamification_achievements`

Earned achievement badges and milestones.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| achievement_type | TEXT | | NOT NULL | 'streak_milestone', 'task_milestone', 'perfect_week', 'perfect_month', 'overlay_stage', 'color_reveal_complete', 'level_up' |
| achievement_key | TEXT | | NOT NULL | Unique key: 'streak_7', 'streak_14', 'tasks_100', 'perfect_week_1', etc. |
| achievement_value | INTEGER | | NULL | The number (streak count, task count, level number) |
| badge_icon | TEXT | | NULL | Icon reference for display |
| badge_name | TEXT | | NOT NULL | Human-readable: "7-Day Streak Champion" |
| earned_at | TIMESTAMPTZ | now() | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped. Mom reads all. Members read own.

**Indexes:**
- `(family_member_id, achievement_key)` UNIQUE — each achievement earned once
- `(family_member_id, earned_at DESC)` — recent achievements

---

### Table: `gamification_daily_summaries`

Daily aggregation for celebration and reporting.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| summary_date | DATE | CURRENT_DATE | NOT NULL | |
| points_earned_today | INTEGER | 0 | NOT NULL | |
| tasks_completed_today | INTEGER | 0 | NOT NULL | |
| streak_count | INTEGER | 0 | NOT NULL | Streak as of this day |
| streak_milestone_today | INTEGER | | NULL | If milestone hit today (7, 14, etc.) |
| level_at_end_of_day | INTEGER | | NULL | |
| treasure_boxes_opened | INTEGER | 0 | NOT NULL | |
| achievements_earned_today | JSONB | '[]' | NOT NULL | Array of achievement_keys earned today |
| theme_unlocks_today | JSONB | '[]' | NOT NULL | Stub → PRD-24A |
| overlay_progress_today | JSONB | '{}' | NOT NULL | Stub → PRD-24A |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom reads all. Members read own.

**Indexes:**
- `(family_member_id, summary_date)` UNIQUE — one summary per member per day
- `(family_id, summary_date)` — family daily view

---

### Column Additions to Existing Tables

**`family_members` table (PRD-01):**

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| gamification_points | INTEGER | 0 | Current point balance |
| gamification_level | INTEGER | 1 | Current level |
| current_streak | INTEGER | 0 | Active streak count |
| longest_streak | INTEGER | 0 | All-time best |
| last_task_completion_date | DATE | | NULL | For streak calculation |
| streak_grace_used_today | BOOLEAN | false | Resets daily |

**`list_items` table (PRD-09B) — Randomizer availability extensions:**

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| availability_mode | TEXT | 'unlimited' | 'unlimited', 'limited_instances', 'scheduled' |
| max_instances | INTEGER | | NULL | For limited_instances mode |
| completed_instances | INTEGER | 0 | Current count toward cap |
| recurrence_config | JSONB | | NULL | For scheduled mode (same shape as PRD-09A task recurrence) |
| next_available_at | TIMESTAMPTZ | | NULL | Calculated from recurrence_config after completion |

**`lists` table (PRD-09B) — Randomizer gamification extensions:**

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| reveal_visual | TEXT | | NULL | 'spinner', 'doors', 'cards', 'scratch_off', 'treasure_chest', etc. Only applies to randomizer lists |
| max_respins_per_period | INTEGER | 3 | NULL | Re-spin limit |
| respin_period | TEXT | 'day' | NULL | 'day', 'week', 'session' |

### Enum/Type Updates

**`requests.request_type` (PRD-15):** Add `'reward_redemption'`

**`notification_type` (PRD-15):** Add `'reward_redeemed'`, `'reward_approved'`, `'reward_denied'`, `'treasure_box_unlocked'`, `'streak_milestone'`, `'level_up'`

**`notification_category` (PRD-15):** Add `'gamification'`

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| PRD-09A (Tasks) | Task completion event triggers gamification pipeline. task_completions record → check gamification_configs.enabled → calculate points → full pipeline. |
| PRD-09A (Opportunities) | Opportunity completion triggers same pipeline. Extra credit tasks earn points with same normalization. |
| PRD-09B (Randomizer) | Randomizer draw uses reveal visual from gamification config. Accepted items self-assign as opportunity tasks, which then trigger points on completion. |
| PRD-10 (Widgets) | Tracker milestone completions (star chart full, color-reveal complete) trigger gamification events. Widget auto-tracking creates tracker entries that can trigger treasure box count-based unlocks. |
| PRD-22 (Settings) | Gamification configuration changes flow from Settings screens into gamification_configs table. |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| PRD-11 (Victory Recorder) | gamification_daily_summaries data feeds DailyCelebration Step 3 (streak) and Step 4 (theme progress, stub → PRD-24A). Points earned today shown in celebration. |
| PRD-15 (Requests) | Reward redemptions with requires_approval create request records. |
| PRD-17 (Universal Queue) | Reward approval requests appear in Requests tab. |
| PRD-24A (Visual Worlds) | Points and completions drive Visual World theme progress and overlay stage evolution. |
| PRD-24B (Visuals) | Reveal visual selection determines which animation plays on Randomizer draw and treasure box open. |
| PRD-24C (Family Challenges) | Normalized contribution scores feed family challenge progress calculations. |

---

## AI Integration

### LiLa Context

When gamification is enabled for a member, LiLa's context assembly (PRD-05) includes:
- Current point balance and level
- Active streak count and next milestone
- Recent achievements (last 5)
- Active treasure box progress (if any)
- Reward menu with costs

This allows LiLa to naturally reference gamification in conversations:
- "You're only 13 stars away from that bookstore trip!"
- "Your 14-day streak is incredible — that's twice as long as your previous best."
- "I see you just earned the Perfect Week badge. That takes real commitment."

### No Guided Mode

PRD-24 does not introduce a new LiLa guided mode. Gamification configuration is through Settings UI, not AI conversation. LiLa references gamification data contextually but doesn't manage it.

---

## Edge Cases

### Point Balance Goes Negative
- Should never happen — all spending checks balance ≥ cost before proceeding
- Reserved points (pending approval) reduce available balance but don't deduct
- If a race condition causes negative balance, clamp to 0 and log an error event

### Mom Changes Point Rates Mid-Stream
- Existing balances are NOT recalculated. New rates apply only to future earnings.
- This is by design — recalculating would either punish (rates lowered) or gift (rates raised) retroactively

### Child Has Gamification Disabled Then Re-Enabled
- All data preserved. Points, streaks, achievements, rewards — everything comes back.
- Streak does NOT continue from where it left off. Streak resets to 0 on re-enable (grace period doesn't span the disabled period).
- This prevents gaming: disable for a week, re-enable, claim a streak was "paused."

### Mom Deletes a Reward That a Child Is Saving For
- Soft delete (is_active = false). The reward disappears from the menu.
- If the child had a pending redemption: auto-deny with message "This reward is no longer available."
- Points are returned to balance.

### Streak and Sick Days
- Mom uses "Pause Streak" when child is sick. Streak count freezes.
- On unpause, streak continues from where it left off.
- Paused days don't count as grace days.
- Schedule-aware streaks skip unscheduled days automatically — if tasks are only MWF, T/Th/Sa/Su don't affect the streak regardless of pause status.

### Multiple Treasure Boxes Unlock Simultaneously
- Each unlocks independently. Multiple widgets can dance on the dashboard at once.
- Child opens them one at a time — each gets its own modal ceremony.

### Family Member Removed
- Cascade delete gamification_configs, gamification_events, gamification_rewards, reward_redemptions, treasure_boxes, treasure_box_opens, gamification_achievements, gamification_daily_summaries for that member.
- Their contributions to family leaderboard are removed from history.

---

## Tier Gating

> **Tier rationale:** Basic gamification (points, rewards, streaks) is Essential because it's a core family engagement feature. Advanced visuals and treasure box ceremonies are Enhanced because they represent meaningful upgrade value. Full Visual World immersion is Full Magic.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `gamification_basic` | Points earning, basic reward menu, streak tracking, achievement badges | Essential |
| `gamification_rewards_advanced` | Treasure box containers (all trigger types), auto-approve configuration, Randomizer availability rules | Enhanced |
| `gamification_reveal_visuals` | Gamification reveal animations (spinner, doors, cards, scratch-off) on Randomizer draws | Enhanced |
| `gamification_treasure_animations` | Pre-rendered treasure box / egg / gift box / slot machine video reveals | Full Magic |
| `gamification_leaderboard` | Family Leaderboard widget | Enhanced |
| `gamification_visual_worlds` | Visual World theme selection and dashboard skinning (stub → PRD-24A) | Full Magic |
| `gamification_overlays` | Overlay engine and overlay content (stub → PRD-24A) | Full Magic |

All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Visual World theme selection in Settings Screen 8, Section H | Visual World selector with theme previews | PRD-24A |
| Overlay selection in Settings Screen 8 | Overlay selector with active overlay management | PRD-24A |
| `visual_world_theme` and `overlay_id` columns on gamification_configs | Visual World and Overlay data model | PRD-24A |
| `theme_unlocks_today` and `overlay_progress_today` on daily summaries | Theme/overlay progress tracking | PRD-24A |
| Event pipeline steps 8-9 (overlay progress, theme progress) | Overlay and theme event handlers | PRD-24A |
| DailyCelebration Step 4 theme progress display | Visual World progress animation in celebration sequence | PRD-24A |
| Pre-rendered reveal video assets (treasure chest × 4, egg, gift box, slot machine) | Video file creation through Content Creation Pipeline | PRD-24B |
| CSS/SVG reveal component theme shape variants (door shapes, spinner decorations) | Per-Visual-World SVG path variants | PRD-24B |
| Star Chart animation sequence specification | Star fly + confetti + bounce animation spec | PRD-24B |
| Color-Reveal tracker system specification | Grayscale → color zone reveal + gallery save | PRD-24B |
| Family Challenge contribution scoring using normalization | Time-boxed family challenge system | PRD-24C |
| Seasonal event framework | Limited-time family challenges | PRD-24C |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| DailyCelebration Step 4 — gamification points display | PRD-11 | gamification_daily_summaries.points_earned_today feeds Step 4. Streak data feeds Step 3. |
| Gamification approach modules (Dragon, Star Jar, Achievement Board) | PRD-11 | Stubs remain for PRD-24A — this PRD defines the data layer they'll consume. |
| `task_rewards` table (stub) | PRD-09A | Wired as `gamification_rewards` + `reward_redemptions` + the gamification event pipeline. The task_rewards stub from PRD-09A is superseded by this PRD's reward economy. |
| Task unmark reward cascade | PRD-02 | When a task completion is unmarked, the gamification pipeline runs in reverse: points deducted, daily summary updated, streak recalculated. If the completion triggered a treasure box unlock that hasn't been opened yet, the unlock is reverted. |
| Gamification system templates in Studio "Coming Soon" | PRD-09B | Gamification templates remain "Coming Soon" in Studio. PRD-24A will define the template content. PRD-24 defines the reward and points infrastructure they'll consume. |
| Reward transaction processing on task completion | PRD-09A "MVP When Dependency Is Ready" | Fully wired by the gamification event pipeline (Section: Gamification Event Pipeline). |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `gamification_configs` table created with per-member configuration
- [ ] `gamification_events` table created as append-only ledger
- [ ] `gamification_rewards` table created with mom CRUD
- [ ] `reward_redemptions` table created with approval flow
- [ ] `treasure_boxes` table created with all 4 trigger types
- [ ] `treasure_box_opens` table created
- [ ] `gamification_achievements` table created
- [ ] `gamification_daily_summaries` table created with daily aggregation
- [ ] `family_members` extended with gamification columns
- [ ] `list_items` extended with availability_mode, max_instances, completed_instances, recurrence_config, next_available_at
- [ ] `lists` extended with reveal_visual, max_respins_per_period, respin_period
- [ ] Gamification event pipeline fires on task completion (full 10-step flow)
- [ ] Points calculation respects per-task overrides > per-child base rate > shell defaults
- [ ] Routine points mode (per_step vs on_completion) working
- [ ] Daily bonus logic (3 tasks, 5+ tasks) working
- [ ] Schedule-aware streak calculation working (skips unscheduled days)
- [ ] Streak grace period (0/1/2 days) working
- [ ] Streak pause/resume working
- [ ] Streak milestone detection and bonus point award working
- [ ] Level calculation working (auto or custom thresholds)
- [ ] Points Dashboard Widget renders all 5 visualization modes
- [ ] Points Detail Modal with Overview, History, Achievements tabs
- [ ] Reward Menu displays rewards with progress bars and affordability state
- [ ] Reward redemption: auto-approve flow working
- [ ] Reward redemption: requires-approval flow creating PRD-15 request
- [ ] Reward approval/denial updating redemption status and point balance
- [ ] Treasure box widget: locked and unlocked states with animations
- [ ] Treasure box: points_threshold trigger working
- [ ] Treasure box: completion_unlock trigger working
- [ ] Treasure box: count_based trigger working
- [ ] Treasure box: reveal modal launches with video + CSS sparkle overlay
- [ ] Treasure box: single reward and Randomizer draw content types working
- [ ] Treasure box: repeating boxes reset correctly after open
- [ ] Randomizer availability rules: unlimited, limited_instances, scheduled all working
- [ ] Randomizer re-spin limits enforced
- [ ] Randomizer self-assign on accept creates Opportunity task
- [ ] Randomizer pass returns item to pool
- [ ] Family Leaderboard widget: percentage-based, opt-in, period toggle
- [ ] Gamification Settings panel (Screen 8) with all sections
- [ ] Reward Menu Editor (Screen 7) with full CRUD
- [ ] Treasure Box Configuration (Screen 9) with all trigger types
- [ ] Setup wizard gamification step for new child creation
- [ ] Micro-celebration (points popup) on task completion
- [ ] Notification: reward redeemed, reward approved/denied, treasure box unlocked, streak milestone
- [ ] RLS on all tables: family-scoped, mom reads all, members read own
- [ ] `useCanAccess()` hooks wired for all feature keys (all return true during beta)
- [ ] Unchosen items in card flip and three doors NEVER reveal — they fade away

### MVP When Dependency Is Ready
- [ ] Visual World theme selection in Settings (requires PRD-24A)
- [ ] Overlay selection in Settings (requires PRD-24A)
- [ ] DailyCelebration Step 4 theme progress wiring (requires PRD-24A)
- [ ] CSS/SVG reveal visual theme shape variants (requires PRD-24B)
- [ ] Star Chart animation sequence (requires PRD-24B)
- [ ] Color-Reveal system (requires PRD-24B)
- [ ] Family challenge contribution scoring (requires PRD-24C)

### Post-MVP
- [ ] Overlay-themed treasure box animation templates (Apothecary cauldron, Kingdom gates, etc.)
- [ ] Additional achievement badge catalog beyond streak/task milestones
- [ ] Point economy analytics for mom (average daily earnings, reward redemption frequency, economy health indicator)
- [ ] LiLa proactive suggestions: "You're close to your bookstore reward — want to look for some extra credit tasks?"
- [ ] Gamification progress in mom's weekly email digest
- [ ] Export gamification history as CSV
- [ ] Admin override: mom manually adjusts point balance with reason logging

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: Gamification is opt-in and mom-configured per child. `gamification_configs.enabled` gates the entire system. When disabled, all gamification UI hidden, data preserved.
- [ ] Convention: `gamification_events` is append-only. Never update or delete event records. This is the source of truth for point balances and transaction history.
- [ ] Convention: Points hierarchy: task-specific override > member's base rate > shell default. Check in this order.
- [ ] Convention: Streaks are schedule-aware by default. Only scheduled days count. Use the task's recurrence_config to determine scheduled days.
- [ ] Convention: Family-level metrics (leaderboard, challenges) use completion percentage or normalized task-equivalents, never raw points. Raw points are personal currency.
- [ ] Convention: Unchosen items in card flip and three doors reveal visuals NEVER show what was on them. They fade away. No FOMO mechanics.
- [ ] Convention: Treasure box videos play in a modal frame with CSS sparkle overlay on top. Videos are WebM primary, MP4 fallback, with `playsinline muted` attributes and a poster frame.
- [ ] Convention: Reward redemption creates a PRD-15 request when requires_approval is true. Auto-approved rewards bypass the request system.
- [ ] Convention: Randomizer availability rules (unlimited/limited/scheduled) use `availability_mode` on `list_items`. Scheduled mode uses the same recurrence_config JSONB shape as PRD-09A tasks.
- [ ] Convention: When a task completion is unmarked, the gamification pipeline reverses: points deducted, daily summary updated, streak recalculated, unopened treasure box unlocks reverted.
- [ ] Convention: Currency name and icon are per-child. Display as configured in `gamification_configs`. Never hardcode "stars" or "points" in UI strings.
- [ ] Convention: Micro-celebration (points popup) fires on task completion. This is a small CSS animation on the task card, NOT the full treasure box ceremony.
- [ ] Convention: Play mode leaderboard shows collaborative framing ("Look what our family did!") never competitive ranking.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `gamification_configs`, `gamification_events`, `gamification_rewards`, `reward_redemptions`, `treasure_boxes`, `treasure_box_opens`, `gamification_achievements`, `gamification_daily_summaries`

Tables extended: `family_members` (6 columns), `list_items` (5 columns), `lists` (3 columns)

Enums updated:
- `requests.request_type`: add 'reward_redemption'
- `notification_type`: add 'reward_redeemed', 'reward_approved', 'reward_denied', 'treasure_box_unlocked', 'streak_milestone', 'level_up'
- `notification_category`: add 'gamification'

Triggers added:
- AFTER INSERT on `gamification_events` → update `family_members.gamification_points` (running balance)
- AFTER INSERT/UPDATE on `task_completions` → invoke gamification event pipeline
- Daily cron: generate/update `gamification_daily_summaries` records, reset `streak_grace_used_today`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Currency name is mom-configurable per child.** System default varies by shell (stars/points/points). Mom picks at setup or in Settings. | Personalization — "gems" for one kid, "XP" for another. Prevents one-size-fits-all feeling. |
| 2 | **Point rates are smart defaults by shell, fully overridable.** Play: 1/task. Guided: 10/task. Independent: 10/task. Per-task overrides available. | Play kids count on fingers (1 star per task). Guided kids want big numbers. All adjustable because every family is different. |
| 3 | **Family equity uses completion percentage and normalized task-equivalents.** Never raw points for family comparisons. | A Play kid earning 1 point/task and a Guided kid earning 10 points/task contribute equally when both complete 5 tasks. Fairness across ages and abilities. |
| 4 | **Schedule-aware streaks.** Streaks only count days when tasks were scheduled. MWF tasks don't break streak on T/Th/Sa/Su. | Prevents unfair streak breaks. Aligns with how families actually schedule tasks. |
| 5 | **Streak pause for vacations/sick days.** Mom manually pauses; streak freezes and resumes. | Protects hard-earned progress from life circumstances. Builds trust in the system. |
| 6 | **Reward approval: mom configures per reward.** Auto-approve for low-stakes, requires-approval for high-stakes. | Prevents mom from being a bottleneck for every little reward while maintaining control over significant ones. |
| 7 | **Treasure box progress visibility: mom configures.** Visible (motivating) or surprise (exciting). | Different kids are motivated differently. Mom knows her child best. |
| 8 | **Treasure box as a 1×1 dashboard widget with dancing unlock state.** | Ambient motivation — always visible, not dominant. The big moment happens in the full-screen modal. |
| 9 | **Unchosen items in card flip and three doors NEVER reveal.** | Prevents meltdowns. No "you could have gotten X" disappointment mechanics. |
| 10 | **PRD-24 splits into 4 sub-PRDs.** PRD-24 (foundation), 24A (Visual Worlds/overlays), 24B (visuals/interactions), 24C (family challenges). | Scope is too large for one PRD. Each sub-system is self-contained enough for its own document. |
| 11 | **Randomizer availability rules: unlimited, limited by instances, scheduled.** Scheduled uses the universal recurrence config from PRD-09A. | General-purpose system that covers repeatable chores, one-time projects, and monthly deep cleans — all in the same Randomizer list with per-item rules. |
| 12 | **Randomizer re-spin with accept/pass flow.** Pass returns item to pool, re-spin count decremented. Accept self-assigns as Opportunity task. | Gives children agency without gaming the system. Mom controls re-spin limits. |
| 13 | **Reveal animations split: pre-rendered 3D video for ceremony reveals, CSS/SVG for interactive reveals.** | Treasure chest/egg/gift box are passive spectacles (video wins). Spinner/doors/cards/scratch-off are interactions (CSS/SVG wins). Best of both worlds. |
| 14 | **5 progress visualization modes for gamification display.** Counter, Level, Progress Ring, Minimal Badge, Hidden. Per-member configurable. | Buffet concept — provide options, users decide. A 5-year-old and an adult have very different preferences. |
| 15 | **Gamification settings screens defined in PRD-24, hosted in PRD-22 Settings framework.** | Keeps all gamification config specification in one place rather than split across two PRDs. |
| 16 | **Allowance is OUT of PRD-24. Lives in PRD-28.** | Allowance is real money, not game currency. They never mix. PRD-28 owns financial tracking. |
| 17 | **Routine points can be per-step or on-completion.** Mom configures. | Some moms want to reward each step of the morning routine. Others want to incentivize completing the whole thing. |
| 18 | **Bonus points at 3 and 5+ tasks replace, not add.** 3rd task = total 35 (not 30+25). 5th task = total 60 (not 35+50). | Prevents confusing math. The numbers represent total day earnings at each milestone, not additive bonuses. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Visual World themes and selection UI | PRD-24A |
| 2 | Overlay engine and launch overlay content | PRD-24A |
| 3 | DailyCelebration Step 4 animation wiring | PRD-24A |
| 4 | All reveal animation specifications and theme adaptation | PRD-24B |
| 5 | Star Chart animation sequence | PRD-24B |
| 6 | Color-Reveal tracker system | PRD-24B |
| 7 | Content Creation Pipeline (Claude Skills, Manus workflows, Midjourney batches) | PRD-24B + post-PRD tooling artifacts |
| 8 | Family challenges and quest boards | PRD-24C |
| 9 | Seasonal event framework | PRD-24C |
| 10 | Visual Asset Manifest (complete catalog of required images) | PRD-24A |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-01 (Auth & Family Setup) | `family_members` table extended with 6 gamification columns. Gamification config auto-created on member setup. | Add columns to PRD-01 schema. Add gamification_configs seeding to member creation flow. |
| PRD-02 (Permissions) | Task unmark reward cascade fully specified. | Update PRD-02's stub reference to point to PRD-24's reverse pipeline. |
| PRD-09A (Tasks) | `task_rewards` stub superseded by PRD-24's reward economy. Per-task `points_override` field needed on Task Creation Modal Section 7. | Update PRD-09A to reference PRD-24 for reward processing. Add points_override to task schema. |
| PRD-09B (Lists) | `list_items` extended with 5 availability columns. `lists` extended with 3 reveal/respin columns. Randomizer draw behavior extended with gamification reveal visuals and accept/pass/self-assign flow. | Add columns to PRD-09B schema. Update Randomizer behavior description. |
| PRD-10 (Widgets) | Gamification info widgets I-16 through I-25 (from Widget Catalog) now have a data source — PRD-24's tables. Treasure box is a new 1×1 widget type. | Add treasure box widget to PRD-10's widget type registry. Note gamification data sources for info widgets. |
| PRD-11 (Victory Recorder) | DailyCelebration Step 3 now reads streak data from gamification_daily_summaries. Step 4 has a data source for points (theme progress still stub → PRD-24A). | Update PRD-11 Step 3/4 to reference gamification_daily_summaries. |
| PRD-15 (Messages/Requests) | 'reward_redemption' added to request_type. 6 notification types added. 'gamification' category added. | Update PRD-15 enum documentation. Add gamification to notification preferences seeding. |
| PRD-17 (Universal Queue) | Reward approval requests appear in Requests tab. | Note in PRD-17 that reward requests follow the standard request processing flow. |
| PRD-22 (Settings) | Gamification settings panel defined as a new category within Settings overlay. Screens 7, 8, 9 are gamification-specific. | Add "Gamification" to Settings category navigation. Reference PRD-24 for screen specs. |
| Build Order Source of Truth | PRD-24 completed. 8 new tables. 3 existing tables extended. Sub-PRDs 24A/B/C established. | Move PRD-24 to Section 2. Register tables. Add sub-PRDs to Section 4. |

---

## Starter Prompt for Next Session (PRD-24A: Visual Worlds & Overlay Engine)

```
We are writing PRD-24A: Visual Worlds & Overlay Engine for MyAIM Family v2.

READ THESE FIRST (in order):
1. PRD-24-Gamification-Overview-Foundation.md (the parent PRD — read completely)
2. MYAIM_Gamification_Master_Manuscript.md (Sections 3 and 4 — Visual Worlds and Overlays)
3. Widget-Template-Catalog-v3-Final.md (gamification widgets I-16 through I-25)
4. PRD-03-Design-System-Themes.md (theme tokens, shell tokens, gamification visual deferred items)
5. PRD-04-Shell-Routing-Layouts.md (Guided/Play shell gamification integration zones)
6. PRD-10-Widgets-Trackers-Dashboard-Layout.md (widget grid, dashboard configs)
7. PRD-11-Victory-Recorder-Daily-Celebration.md (DailyCelebration Step 4 stub)
8. MyAIM_Family_Build_Order_Source_of_Truth_v2.md

PRD-24A covers:
- Visual World themes: selection, dashboard skinning, theme token sets, progress tracking infrastructure
- Overlay Engine: generic config-driven renderer, OverlayConfig interface, task-category-to-collectible mapping
- 2 launch overlays: Apothecary Workshop (fully specified) + one simpler overlay (Monster Army or Pet Collector)
- DailyCelebration Step 4 wiring: theme progress display, overlay reveals, evolution animations
- Visual Asset Manifest: complete catalog of all image assets needed, dimensions, formats, quantities
- Theme adaptation: how Visual World tokens flow through widgets, reveals, and celebrations

Key decisions already made in PRD-24:
- Visual Worlds are dashboard-wide theme skins, not widgets
- Overlay engine is config-driven — adding overlays is a content task, not code
- 3-5 themes at launch, infrastructure for 13
- 2 overlays at launch, engine supports unlimited via config
- Color-reveal images can be tied to overlay themes
- Post-PRD artifacts: Claude Skill for overlay content generation, Manus workflows for bulk assets

Present all clarifying questions at once with your recommendation leading each.
```

---

*End of PRD-24*
