# Studio Seed Templates — Founder Specification

> **Status:** Authoritative founder input (2026-03-24)
> **Scope:** Studio architecture, seed content, Guided Forms, Opportunity Board config
> **Rule:** This document is READ-ONLY source material, same as PRDs.

---

## The Studio Mental Model — Five Layers

### Layer 1: The Store Shelves (System Seed Templates)
Blank format types that ship with the app. Not filled in — just the shape of a thing. Empty craft kits on the shelf. Every new family sees the same shelf. Nobody "owns" these — platform-level. `is_system_template = true`, `family_id = NULL`.

### Layer 2: Mom's Craft Table (Customization)
Mom picks a blank format off the shelf, taps [Customize], and fills it in for her family. She's not modifying the shelf — she's making her own version. When she saves, it becomes her template in "My Customized" tab. She can also create from scratch and save as reusable template later.

### Layer 3: The Library (My Customized)
Personal family template library — everything she's built. Shows at a glance what each template is assigned to, who it's deployed to, how many active deployments. Can edit, duplicate, archive, or redeploy.

### Layer 4: Deployment (Assigning to Kids)
From her library, picks a template and hits [Deploy]. Selects which kids, schedule, rotation. Each kid gets independent live copy. Changes to template don't affect deployed copies.

### Layer 5: Dashboard (Daily Use)
Kids never see Studio or the library. They see their personal dashboard — today's tasks, routines, available opportunities. Output of everything mom built.

---

## Seed Content at Launch

### Task & Chore Formats (5 blank types)

**1. Simple Task** (`template_type: 'task'`)
- Description: A one-time or recurring task assigned to one or more family members. Add a name, optionally set a due date, reward, and completion approval. The most flexible format.
- Example uses: Take out the trash, Return library books, Call the dentist, Help dad with yard work

**2. Routine Checklist** (`template_type: 'routine'`)
- Description: Multi-step checklist with sections on different schedules — Daily, MWF, Weekly, or custom. Each section has its own frequency. Build once, deploy to any child. Resets fresh each period with no guilt carry-forward.
- Example uses: Morning routine, Bedroom clean-up, Kitchen duties, After-school checklist, Bathroom deep clean

**3. Opportunity Board** (`template_type: 'opportunity_claimable'`)
- Description: Optional jobs kids can browse and earn from. Each job has its own reward (dollars, stars, or both). Three sub-types: Claimable (first to claim, locked with timer, auto-releases), Repeatable (do it over and over, optional caps), Capped (limited total completions). Mom selects which family members can see each board.
- Example uses: Extra House Jobs board, Ruthie's practice tasks, Bonus school tasks, Summer earning opportunities

**4. Sequential Collection** (`template_type: 'sequential'`)
- Description: Ordered list of tasks that feeds one at a time. Task N+1 unlocks only when Task N is complete. Reuse year after year by deploying to new student.
- Example uses: Math textbook chapters, YouTube tutorial series, Piano lesson progression, Nature study unit

**5. Randomizer / Draw List** (stored in `list_templates` with `list_type: 'randomizer'`)
- Description: Curated grab bag. Tap [Draw] for spinner animation that reveals selection. Items can be repeatable (return to pool) or one-time (removed after draw). Works for extra jobs, name drawing, activity picking, reward spins.
- Example uses: TSG Extra Jobs (chores + connection items), Who picks the movie tonight, Dinner activity picker, Reward spinner

### Guided Forms & Worksheets (4 blank types)

> Guided Forms are `template_type = 'guided_form'` in `task_templates`, NOT a separate system. They get their own Studio category section but share the task assignment pipeline.

**5. Guided Form (blank canvas)** (`guided_form_subtype: 'custom'`)
- Description: Structured thinking worksheet mom assigns to a child. Mom defines sections, fills setup prompt, assigns. Child completes on dashboard. Mom reviews. LiLa assistance configurable (default OFF). Printable as paper worksheet.
- Example uses: Custom decision-making exercise, Goal reflection, Pre-trip planning form, Reading response questions

**5B. SODAS** (`guided_form_subtype: 'sodas'`)
- Description: A structured thinking exercise that teaches real decision-making. Mom fills Situation. Child works through Options (3+) → Disadvantages (each option) → Advantages (each option, including bad choices) → Solution (best and why). More honest than pros/cons because it requires acknowledging advantages in every option.
- Sections: S (Situation, mom fills) → O (Options, child) → D (Disadvantages, child) → A (Advantages, child) → S (Solution, child)
- Example uses: Sibling conflict, What to do when angry, Spending birthday money, Friend situation

**5C. What-If Game** (`guided_form_subtype: 'what_if'`)
- Description: Lighter, faster version of SODAS for pre-teaching before situations arise. Mom poses scenario, child thinks it through before they're in the heat of the moment. A widely-used method for pre-teaching. Works for kids as young as Guided shell age.
- Sections: The Scenario (mom) → My Options (child) → What Might Happen (child) → What I Would Do (child) → What I Learned (child)
- Example uses: Friend asking to do something wrong, Someone mean at co-op, Finished work early, Feeling angry at sibling

**5D. Apology Reflection** (`guided_form_subtype: 'apology_reflection'`)
- Description: Deeper than "say sorry." Child thinks through what happened, who was affected, why it mattered, what they'd do differently, how to make it right. Restorative tone, not punitive. Mom reviews and uses as springboard for conversation.
- Sections: What Happened → Who Was Affected and How → Why It Mattered → What I Wish I'd Done Instead → How I Want to Make It Right → What I Want to Remember

### List Formats (6 blank types)

**1. Shopping List** (`list_type: 'shopping'`)
- Quantity, unit, store section, notes per item. Share with spouse or older kids. AI Bulk Add parses recipes/brain dumps.

**2. Wishlist** (`list_type: 'wishlist'`)
- URL, estimated price, size/color notes, who it's for. Individual per child for gift-givers. Calculates total.

**3. Packing List** (`list_type: 'packing'`)
- Categorized sections (Clothing, Toiletries, Gear, Documents). Progress bar. Share with family. Save as template per trip type.

**4. Expense Tracker** (`list_type: 'expenses'`)
- Amount, category, date, notes. Running total. Not full accounting — quick shareable tally.

**5. To-Do List** (`list_type: 'todo'`)
- Simple checkable list. One-tap [→ Tasks] promote button per item. Great for brain dumps before things become real tasks.

**6. Custom List** (`list_type: 'custom'`)
- Blank canvas. Any items, optional notes, optional URLs.

---

## Pre-Filled Example Templates

### Task/Chore Examples (5)

**Example 1: Morning Routine** — Routine checklist with "Every Morning" (6 steps), "School Days Only" (3 steps), "Every Sunday" (2 steps).

**Example 2: Bedroom Clean-Up** — Routine with Daily (3 steps), Weekly/show_until_complete (4 steps), Monthly/show_until_complete (4 steps).

**Example 3: Extra House Jobs Board** — Claimable opportunity board. 8 real chore jobs ($1-$3, 30min-3hr locks) + 2 connection items (5 stars, repeatable, no lock). Mix of quick/medium/big/connection categories.

**Example 4: Curriculum Chapter Sequence** — Sequential collection, 5 sample chapters, auto-promote on completion, weekdays only.

**Example 5: TSG Extra Jobs Randomizer** — Randomizer list. 9 chore items (one-time, quick/medium) + 4 connection items (repeatable). TSG-inspired.

### Guided Form Examples (3)

**Example 6: SODAS Sibling Conflict** — Pre-filled Situation section with warm framing. Child sections blank.

**Example 7: What-If Friend Pressure** — Pre-filled Scenario about peer pressure. Child sections blank.

**Example 8: Apology Reflection General** — Pre-filled warm intro note ("I'm not asking you to do this as punishment..."). Child sections blank.

### List Examples (4)

**Example 1: Weekly Grocery List** — Shopping list with 7 sections (Produce, Dairy, Meat, Pantry, Frozen, Household). Pre-filled items.

**Example 2: Family Road Trip Packing** — Packing list with 5 categories. Pre-filled items per category.

**Example 3: Birthday Wishlist (Child)** — Wishlist with 5 sample items showing links, prices, notes, sizes.

**Example 4: Homeschool Curriculum Budget** — Expense tracker with 5 sample purchases, running total.

---

## Opportunity Board — Full Configuration

### Board-Level Settings
- `board_name` — display name
- `opportunity_subtype` — 'claimable' | 'repeatable' | 'capped'
- `available_to` — array of family_member_ids (who can see/use the board)
- `board_scope` — 'shared' (one pool, kids compete) | 'individual' (each kid gets own copy)
- `claim_visibility` — 'show_names' | 'hide_names'
- `completion_approval_required` — BOOLEAN

### Per-Job Settings
- `job_name`, `job_description`
- `reward_dollars` DECIMAL nullable, `reward_stars` INTEGER nullable (both can be set simultaneously)
- `claim_lock_duration` INTERVAL nullable (only for claimable)
- `completion_cap_per_period` INTEGER nullable (for repeatable: max per period)
- `completion_cap_total` INTEGER nullable (for capped: max total across all kids)
- `is_repeatable` BOOLEAN
- `category` — 'quick' | 'medium' | 'big' | 'connection'
- `sort_order`

### Claim Lock Mechanics
- Kid taps [Claim] → task_claims record → job locked for claim_lock_duration
- Countdown timer shown on kid's and mom's view
- Complete + approved → reward credits
- Lock expires → job releases back to pool, no penalty
- 30min grace period if kid actively in-progress when lock expires
- First-claim-wins: DB-level unique constraint on active claims per job
- Kid can voluntarily release claim before timer expires

---

## Guided Forms — Architecture

### Data Model
- `task_templates` with `template_type = 'guided_form'`, `guided_form_subtype` TEXT
- Assignment creates `tasks` record with `task_type = 'guided_form'`
- `guided_form_responses` table: `task_id`, `family_member_id`, `section_key`, `section_content TEXT`, `filled_by` ('mom'|'child'), `completed_at`

### Two-Step Assignment Flow
1. Mom fills her sections inline (Situation, Scenario, Intro note). She is NOT editing the template — filling this assignment instance only.
2. Mom assigns to child(ren). Each gets independent assignment. Mom's pre-filled sections copied as completed entries. Child's sections created as blank.

### Reuse
Same template serves unlimited assignments. Mom assigns SODAS next week with different Situation — independent instance. Template record never modified.

### Dashboard Rendering
Activity card with progress ("2 of 5 sections complete"). Tapping opens full-screen form-fill, one section at a time. LiLa help button per section only when enabled.

### Review Flow
Completed forms appear in mom's review queue. Mom can add written response, mark reviewed, mark "ready to discuss" (sends child notification).

---

## Studio Card UI — Universal Pattern

### Card Face (always visible)
- Icon + template name (bold)
- One-line tagline (description truncated ~80 chars)
- Badge if is_example ("Example")
- [Customize] button — visible on hover (desktop) or after tap-expand (mobile)

### Hover / Tap-Expanded State
- Full description paragraph
- "Works great for:" followed by example_use_cases as chips
- [Customize] button prominent
- Guided Forms: section structure preview
- Opportunity Board: brief "How it works" line
- Trackers: visual variant thumbnail

### Mobile Behavior
Single tap expands card in-place (pushes others down). Second tap collapses. [Customize] visible only in expanded state.

### Source of Truth
`description` and `example_use_cases` from seed data are the source — no hardcoded card copy in components. New seed templates automatically get correct hover descriptions.

---

## Tracker / Widget Starter Configs (10)

> Deferred until PRD-10 (Widgets & Trackers) tables exist. Specified here for completeness.

1. Morning Routine Streak — streak/flame_counter
2. Daily Habit Grid — grid/bujo_monthly_grid
3. Reading Log — tally/star_chart (multiplayer compatible)
4. Homeschool Hours by Subject — timer_duration/time_bar_chart
5. Sticker Chart — collection/animated_sticker_grid
6. IEP / ISP Goal Progress — tally/progress_bar_multi
7. Weekly Chore Completion — percentage/donut_completion (connects to allowance)
8. Independence Skills Staircase — sequential_path/staircase
9. Family Reading Race — tally/colored_bars_competitive (multiplayer)
10. Daily Mood Check-In — dot_circle/year_in_pixels_weekly (private by default)
