> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-11: Victory Recorder & Daily Celebration

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-06 (Guiding Stars & Best Intentions), PRD-07 (InnerWorkings), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-10 (Widgets, Trackers & Dashboard Layout)
**Created:** March 5, 2026
**Last Updated:** March 5, 2026
**Companion:** PRD-11B (Family Celebration — separate PRD)

---

## Overview

Victory Recorder exists because most people — moms especially, and kids learning to see themselves — default to measuring the day by what went wrong. The mental tally of failure is automatic. Nobody has to teach it. Victory Recorder is the deliberate counter-practice. It asks one question: **"What did you do right?"**

Victory Recorder is two things. First, it is a **running Ta-Da list** — a global quick-action available anytime, anywhere, for capturing something good the moment it happens. Mom survived the grocery store with all three kids. A teen told their coach something hard. A 5-year-old went potty. A dad made a phone call he'd been dreading. These are victories. The button is always there. Tap it, type it, gold shimmer, done. Three seconds. The day's task completions, tracker entries, Best Intention iterations, and widget milestones also flow in silently and automatically. The list only grows.

Second, it is a **celebration engine** — a meaning layer on top of the list. The list is the evidence; the celebration is the interpretation. The user can scroll their victories anytime and see every item — that's the record, complete and browsable. But when they tap "Celebrate This," LiLa looks at the same list and tells them what it adds up to — what patterns it reveals, what it says about who they're becoming, why today's small steps matter even when they don't feel like enough. You don't need an AI to read your list back to you. You need someone to see what you can't see when you're standing too close to it. The narrative draws from Guiding Stars, Best Intentions, InnerWorkings, and growth patterns to connect what they *did* to who they *are becoming*.

The celebration narrative is also the **shareable** part. Nobody texts their friend a screenshot of a checklist. But a paragraph that says "You showed up to the hard conversation, you kept your patience through the tantrum, and you still found time to work out — that's not a lucky day, that's a person who's building something" — that's something you send to your husband, your mom, your best friend. The meaning is what people want to share, not the list.

Victory Recorder is NOT a task review, NOT a completion tracker, and NOT a reflection journal. It never shows what wasn't done. It never creates a comparison between what was accomplished and what was assigned. It is exclusively a celebration surface — downstream of the task system, receiving the output of completed work and celebrating it.

This PRD defines two distinct products that share a database table but have entirely different UIs: **VictoryRecorder** (the adult/teen experience) and **DailyCelebration** (the kid experience for Guided and Play modes). Family Celebration is deferred to PRD-11B.

> **Mom experience goal:** Victory Recorder should feel like opening a beautiful journal that already has the facts filled in — and you just add the soul. The "Record a Victory" button should feel like a tiny act of rebellion against the voice that says you didn't do enough today.

---

## User Stories

### Recording (All Roles)
- As a mom, I want a global quick-action to record a victory the moment it happens so I can capture the win before I forget it in the chaos.
- As a mom, I want task completions, tracker entries, and Best Intention iterations to automatically appear in my victory log so I don't have to re-enter what the system already knows.
- As a teen, I want to record victories that no task system would ever anticipate — like setting a boundary or staying calm in a hard moment — so I have evidence that I'm growing.
- As a parent, I want to record a victory for my young child (she went potty, rode her bike, was brave at the dentist) so it becomes part of her story.

### Celebrating (All Roles)
- As a mom, I want LiLa to generate a celebration narrative that connects my day's victories to my values and growth areas so I see the pattern, not just the list.
- As a teen, I want the celebration to be respectful and identity-focused — not childish praise — so it actually means something to me.
- As a guided-mode child, I want the celebration to be fun, warm, and specific so I feel like someone important noticed what I did.
- As a play-mode child, I want big sparkles and joyful words so celebrating feels amazing and I want to do it again tomorrow.

### Reviewing
- As a mom, I want to browse my past victories over time so I can see evidence of growth when I'm doubting myself.
- As a mom, I want to browse my child's past victories so I can see their growth and use it in conversations, IEP meetings, or homeschool documentation.
- As any member, I want to mark a victory as a "Mom's Pick" so the most meaningful moments stand out.

### Mom's Picks
- As a mom, I want to specially designate certain victories — mine or my children's — as "Mom's Picks" so the moments I most want to remember are flagged.
- As a child, I want to know when mom marked one of my victories as a Mom's Pick so I know she noticed.

---

## Screens

### Screen 1: Victory Recorder Main Page (Adult/Teen — `VictoryRecorder` component)

> **Depends on:** Shell context — defined in PRD-04. Theme tokens — defined in PRD-03.

**What the user sees:**
- Page title: "Victory Recorder"
- Contextual subtitle (muted): "What did you do right?"
- Period filter: Today | This Week | This Month | All Time | Custom Range — controls which victories load
- Life area filter: **"All Areas" is the default** (everything shown, no filtering). When the user wants to narrow, they tap individual category chips which are **multi-selectable** and **auto-sorted by usage frequency** (most-used categories appear first, least-used scroll right). Includes both default life area categories and any custom tags the user has created. A persistent **"+ Add Custom"** button is always visible at the end of the chip row for creating new tags on the fly. Tapping "All Areas" resets any active selections.
- Special filter modes: Best Intentions | Guiding Stars | LifeLantern — tapping these filters victories to only those connected to the selected feature, and the celebration engine draws connections and encouragement specifically from that context
- Victory count summary: "[X] victories" for the selected period/filters
- Victories displayed in reverse chronological order as cards:
  - Victory description text
  - AI celebration text if generated (warm, italic styling)
  - Life area tag (removable chip)
  - Source indicator icon (task, tracker, intention, widget, manual, lila, notepad)
  - Timestamp
  - Mom's Pick indicator (small gold star) if designated
  - Gold accent on the card (thin gold left border)
- "Celebrate This!" button in the summary header — triggers AI narrative generation for all visible victories
- "Past Celebrations" link — opens Celebration Archive (Screen 4)
- Floating action button: "Record a Victory" (also accessible as global quick-action from any page)
- LiLa drawer accessible from this page loads recent victories as context

**Interactions:**
- Tap a victory card → opens Victory Detail (Screen 3)
- Tap "Record a Victory" FAB → opens Record a Victory modal (Screen 2)
- Tap "Celebrate This!" → triggers celebration flow (loading spinner + gold SparkleOverlay → AI narrative modal)
- Filter by time or life area → list updates immediately
- Long-press a victory → quick actions: Mom's Pick toggle, Archive, Copy

**Empty State:**
- Warm illustration or icon
- "Nothing here yet — and that's okay. When you notice something you've done right today, no matter how small, come back and record it. You've already taken the first step by being here."
- "Record a Victory" button prominent in the empty state

> **Decision rationale:** The main page is a browsing and celebration surface, not a data entry form. The structured daily review (tasks, trackers, mood, gratitude) belongs in the Evening Rhythm, not here. Victory Recorder receives the output and celebrates it.

---

### Screen 2: Record a Victory (Modal — All Modes)

**Adult/Teen version:**
- Text area: "What did you accomplish?" (large, inviting)
- Quick-add category buttons: Helped Someone, Extra Cleaning, Extra Learning, Creative Project, Act of Kindness, Physical Activity, Custom
- Tapping a category pre-fills a tag but still allows free-text description
- After entering text, LiLa generates:
  - Suggested life area tag (displayed as removable chip)
  - Suggested celebration text (displayed below in italic, editable)
  - Connection to Guiding Stars or Best Intentions if detected (displayed as a linkable chip, removable)
- All AI suggestions are editable or removable before saving
- "Save" button
- Optional: importance indicator (small win / big win / major achievement) — affects celebration proportionality

**After saving:**
- Gold shimmer/sparkle animation plays briefly
- Victory card appears at the top of the list (if on the Victory Recorder page)
- If recorded via global quick-action, brief toast confirmation: "Victory recorded!" with gold accent

**Guided Mode version:**
- Larger text, illustrated category icons
- Categories: Helped Someone (hands), Was Kind (heart), Learned Something (lightbulb), Did My Chores (broom), Was Brave (lion), Something Else (pencil)
- Mom or child types description
- Confetti burst on save

**Play Mode version:**
- Giant illustrated category tiles (minimal text — icons prominent for pre-readers)
- Categories: Helped Someone (two figures hugging), Was Kind (heart with sparkles), Learned Something (star with rays), Did My Chores (sparkly broom), Something Else (blank star)
- Mom types description (or child with help)
- Big gold "YAY!" save button
- Confetti explosion + gold sparkles on save

**When arriving from another feature (prefill):**
- Description field is pre-filled with source content
- AI suggestions auto-generate after 500ms
- User reviews, edits if needed, saves

**Data created:**
- `victories` record with description, source, source_reference_id, life_area_tag, celebration_text, importance, family_member_id

> **Decision rationale:** Quick-add categories serve both as speed and as teaching tools — they help users (especially children) learn to notice categories of good behavior. The category becomes a life_area_tag on the record.

---

### Screen 3: Victory Detail (Expanded Card)

**What the user sees:**
- Full victory description
- AI celebration text (editable — "Edit" button next to it)
- Life area tag (editable)
- Guiding Stars connection if applicable (editable — can add, change, or remove)
- Best Intentions connection if applicable (editable — can add, change, or remove)
- Source info: where this victory came from (task title, tracker name, intention text, manual entry, LiLa conversation excerpt)
- Source link (tappable to navigate to the source feature)
- Date and time
- Mom's Pick toggle (gold star — mom only for children's victories, self for own)
- Mom's Pick note field (optional — "Why this matters to me")
- "Archive" button
- "Copy" button (copies victory text + celebration to clipboard)

**Data updated:**
- `victories` record fields (celebration_text, life_area_tag, guiding_star_id, best_intention_id, importance, is_moms_pick, moms_pick_note, archived_at)

---

### Screen 4: Celebration Archive

> **Forward note:** This is the text-card-based archive of saved celebration narratives, modeled on StewardShip's "Past Celebrations" pattern. Visual Celebration Cards with designed layouts are a future enhancement.

**What the user sees:**
- Modal or page titled "Past Celebrations"
- Celebration narratives organized by date, newest first
- Each card shows:
  - Date header (e.g., "Today — Feb 28, 2026")
  - Item count (e.g., "15 items")
  - The full AI-generated celebration narrative text
  - "Copy" and "Delete" actions at the bottom of each card
- Scrollable list, loads more on scroll

**Data read:**
- `victory_celebrations` table, filtered by family_member_id, ordered by created_at DESC

---

### Screen 5: DailyCelebration Sequence (Guided/Play — `DailyCelebration` component)

> **Depends on:** Visual World system — stub until PRD-24 (Rewards & Gamification). Gamification points — stub until PRD-24.

**What the child (or mom, for young children) sees:**

A sequenced celebration experience. Each step is skippable. The whole sequence takes 60–90 seconds if not skipped. The sequence ONLY shows what was accomplished — never what wasn't done.

**Step 1 — The Opener (5 seconds)**
Full-screen animated greeting with the child's name and a celebratory message. Uses the child's Visual World aesthetic. Confetti or theme-appropriate particles.
```
"Amazing work today, [Name]!"
[Theme-appropriate animation plays]
```

**Step 2 — Victories Summary (10–15 seconds)**
Shows victories recorded today — both auto-captured and manual. Each victory animates in with a checkmark or star. Purely additive — only what was accomplished appears. If 1 victory exists, it celebrates that 1 victory. If 10 exist, it celebrates all 10. The number assigned is NEVER referenced.
```
Look what you did today!
✅ Finished math homework
✅ Helped with dishes
⭐ Shared snack with Mia at recess
⭐ Was brave at the dentist

That's 4 victories! Amazing!
```

> **Decision rationale:** The original Gamification Manuscript Step 2 showed incomplete tasks with empty checkboxes. This is removed. Victory Recorder never shows what wasn't done. Incomplete task triage belongs in the Evening Rhythm.

**Step 3 — Streak Update (5–10 seconds)**
Shows current streak count with animation if a streak is active. If a streak milestone was hit today (7, 14, 21, 30 days), this step gets a bigger celebration with gold effects. If no active streak, this step is skipped automatically.

**Step 4 — Theme Progress (15–20 seconds) — THE MAIN EVENT**
Gold border on this step. Shows the child's Visual World and Overlay Collection progress. If anything new was unlocked today, it is revealed here with a special animation.

> **Deferred:** Visual World evolution and Overlay Collection reveals are stubs until PRD-24 (Rewards & Gamification). The celebration sequence structure accommodates them — Step 4 renders a placeholder that shows the Visual World image and a progress indicator. PRD-24 will wire the actual evolution animations and reveal logic.

**Step 5 — The Close (5–10 seconds)**
An encouraging send-off message. Option to share today's celebration with mom (for Guided mode).
```
You're doing amazing!
See you tomorrow!

[Share with Mom] [Done!]
```

**Per-mode rendering:**

| Element | Play Mode | Guided Mode |
|---------|-----------|-------------|
| Text size | Largest — pre-reader friendly | Large — readable |
| Animation intensity | Maximum — confetti, sparkles, bouncing | Moderate — achievement unlocked style |
| Language | Simple, excited, short sentences | Specific praise, slightly longer |
| Voice personality default | Fun Friend or Silly Character | Enthusiastic Coach |
| Manual entry button | "I Did Something Great!" (giant) | "I Did Something Else Great!" |
| Step 4 emphasis | Visual delight focused | Progress + delight balanced |

**Data read:**
- Today's `victories` records for this family_member_id
- Streak data from tracker/gamification system
- Theme progress from gamification system (stub)

**Data created:**
- `victory_celebrations` record with the generated narrative
- `celebration_viewed` flag on today's victories

---

### Screen 6: Global Quick-Action — "Record a Victory"

> **Depends on:** Global quick-action infrastructure — to be defined in Shell/Navigation PRD update or Settings.

**What the user sees:**

A persistent quick-action accessible from anywhere in the app — the specific UI mechanism (FAB, bottom bar action, pull-down action, or navigation shortcut) is determined by the Shell PRD. The important thing is that it's always reachable without navigating to the Victory Recorder page.

Tapping it opens the Record a Victory modal (Screen 2) as an overlay on top of whatever page the user is currently on. After saving, the user returns to their previous context with a brief gold-accented toast: "Victory recorded!"

For kid modes, the global quick-action appears on their dashboard as a prominent button: "I Did Something Great!" (Play) or "Record a Victory" (Guided).

> **Decision rationale:** Victory recording must be frictionless and immediate. If the user has to navigate to a specific page to record a victory, they won't do it. The moment of noticing something good is fleeting — the button must be there when the impulse strikes.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | Sees own victories + all children's victories. Can view any child's Victory Recorder via View As. Can designate Mom's Picks on anyone's victories. |
| Dad / Additional Adult | Full (own) + Permitted children | Own victories always accessible. Children's victories visible per PRD-02 `member_permissions`. Can designate Mom's Picks if mom grants permission. |
| Special Adult | View only (assigned kids, active shift) | Can see assigned children's victories during shift. Can record victories for assigned children. Cannot access own Victory Recorder (no personal dashboard). |
| Independent (Teen) | Full (own) | Full Victory Recorder. Own victories only. Mom sees all by default (per PRD-02 default visibility). Teen can see Mom's Picks on their own victories. |
| Guided | Simplified (DailyCelebration) | DailyCelebration sequence on their dashboard. Manual entry via "I Did Something Else Great!" button. Mom manages their Victory Recorder. |
| Play | Maximum simplification (DailyCelebration) | DailyCelebration sequence on their dashboard. Giant "I Did Something Great!" button. Mom records most victories for them. |

### Shell Behavior

| Shell | Victory Recorder Page | DailyCelebration | Record a Victory | Celebrate This |
|-------|----------------------|------------------|-----------------|----------------|
| Mom (Personal) | Full page with all features. No emojis. Text-based buttons. Warm, clean aesthetic. | Not present | Global quick-action + FAB on page | AI narrative generation |
| Dad / Additional Adult | Same as Mom (own data + permitted children) | Not present | Global quick-action + FAB | AI narrative generation |
| Special Adult | Not present (shift-based access only) | Not present | "Log Victory" button during shift for assigned kids | Not present |
| Independent (Teen) | Full page, clean aesthetic, no condescension | Not present | Global quick-action + FAB | AI narrative generation — reflective, growth-focused |
| Guided | Not present as standalone page | Full 5-step sequence on dashboard | "I Did Something Else Great!" button on dashboard | Part of DailyCelebration sequence |
| Play | Not present as standalone page | Full 5-step sequence on dashboard (maximum delight) | "I Did Something Great!" giant button on dashboard | Part of DailyCelebration sequence |

### Privacy & Transparency
- Mom sees all children's victories by default (mom-first architecture)
- Teens are informed that mom can see their victories: "Your victories are visible to your parent. This helps them celebrate your growth."
- Dad's visibility into children's victories follows PRD-02 permission scoping
- Each adult's own Victory Recorder is private to them (dad cannot see mom's, mom cannot see dad's — unless explicitly shared in a future feature)

---

## Data Schema

### Table: `victories`

The shared table for all victory records across VictoryRecorder and DailyCelebration.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members. The person whose victory this is. |
| description | TEXT | | NOT NULL | The victory text |
| celebration_text | TEXT | | NULL | AI-generated celebration narrative. Editable by user. |
| life_area_tag | TEXT | | NULL | From expanded 16-value life area enum (PRD-09A) |
| custom_tags | TEXT[] | '{}' | NOT NULL | User-created tags for seasonal or focus-based categorization (e.g., "potty training season", "marathon prep", "Q1 career push") |
| source | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'task_completed', 'tracker_entry', 'intention_iteration', 'widget_milestone', 'lila_conversation', 'notepad_routed', 'reflection_routed', 'list_item_completed', 'routine_completion' |
| source_reference_id | UUID | | NULL | FK to the source record (task, tracker entry, intention, etc.) |
| recorder_type | TEXT | 'myaim' | NOT NULL | Enum: 'myaim', 'stewardship'. Distinguishes origin for data migration. |
| member_type | TEXT | | NOT NULL | Enum: 'adult', 'teen', 'guided', 'play'. Set from family_member role at creation. |
| importance | TEXT | 'standard' | NOT NULL | Enum: 'small_win', 'standard', 'big_win', 'major_achievement'. Affects celebration proportionality. |
| guiding_star_id | UUID | | NULL | FK → guiding_stars. Connection to a Guiding Star if relevant. |
| best_intention_id | UUID | | NULL | FK → best_intentions. Connection to a Best Intention if relevant. |
| is_moms_pick | BOOLEAN | false | NOT NULL | Mom specially designated this victory. |
| moms_pick_note | TEXT | | NULL | Why mom flagged this as meaningful. |
| moms_pick_by | UUID | | NULL | FK → family_members. Which parent designated this. |
| celebration_voice | TEXT | | NULL | Voice personality used for celebration (e.g., 'enthusiastic_coach', 'pirate_captain') |
| photo_url | TEXT | | NULL | Optional photo of the day / moment |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom reads all family victories. Dad reads own + permitted children's victories. Teens read own only. Guided/Play read own only (via DailyCelebration component). Special Adults read assigned children's during active shift. All members can insert their own victories. Mom can update any family member's victories (for Mom's Pick, editing celebration text). Teens can update their own.

**Indexes:**
- `(family_id, family_member_id, created_at DESC)` — member's victories, newest first
- `(family_id, created_at DESC)` — family-wide victory feed
- `(family_id, family_member_id, life_area_tag)` — filter by life area
- `(family_id, source)` — source tracking
- `(family_id, is_moms_pick)` — Mom's Picks filter
- `(source_reference_id)` — deduplication and source linking

---

### Table: `victory_celebrations`

Saved AI-generated celebration narratives (the Celebration Archive).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| celebration_date | DATE | CURRENT_DATE | NOT NULL | The date this celebration covers |
| mode | TEXT | 'individual' | NOT NULL | Enum: 'individual', 'review', 'collection'. Individual = single celebration, review = evening review, collection = period celebration. |
| period | TEXT | | NULL | 'today', 'this_week', 'this_month', 'custom' |
| narrative | TEXT | | NOT NULL | The full AI-generated celebration text |
| victory_ids | UUID[] | | NULL | Array of victory IDs included in this celebration |
| victory_count | INTEGER | | NOT NULL | How many victories were included |
| celebration_voice | TEXT | | NULL | Voice personality used |
| context_sources | JSONB | '{}' | NOT NULL | Which context sources were used (guiding_stars, best_intentions, innerworkings) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Same scoping as `victories` — members see their own, mom sees all family.

**Indexes:**
- `(family_id, family_member_id, created_at DESC)` — archive browsing

---

### Table: `victory_voice_preferences`

Per-member voice personality selection for celebrations.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members. Unique per member. |
| selected_voice | TEXT | | NOT NULL | Voice personality key (e.g., 'enthusiastic_coach', 'calm_mentor', 'pirate_captain') |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Members can read/update their own. Mom can read/update any family member's. For Guided/Play, mom sets the voice.

**Unique constraint:** `(family_member_id)` — one voice preference per member.

---

### Enum/Type Updates

**New source values for `victories.source`:**
- `task_completed` — active task marked complete (PRD-09A `victory_flagged` or auto-route)
- `tracker_entry` — tracker data point logged (PRD-10)
- `intention_iteration` — Best Intention celebrate tap (PRD-06)
- `widget_milestone` — widget completion milestone (PRD-10)
- `lila_conversation` — LiLa detects and user confirms (PRD-05)
- `notepad_routed` — Smart Notepad "flag as victory" (PRD-08)
- `reflection_routed` — Reflection response routed to victory
- `list_item_completed` — list item with victory_on_complete checked (PRD-09B)
- `routine_completion` — routine reset with completed items (PRD-09A)
- `manual` — user-initiated via Record a Victory

**New voice personality keys:**
Essential tier: `enthusiastic_coach`, `calm_mentor`, `fun_friend`, `silly_character`, `proud_parent`
Full Magic tier: `princess`, `pirate_captain`, `sports_announcer`, `british_nobleman`, `scottish_rogue`, `gen_z_influencer`, `news_reporter`, `wizard`, `superhero`, `astronaut`

> **Forward note:** TTS audio generation is post-MVP. For MVP, voice personalities affect the *text style* of the AI-generated celebration — the pirate writes like a pirate, the coach writes like a coach. Actual audio synthesis via OpenAI TTS or ElevenLabs is a future enhancement.

---

## Flows

### Incoming Flows (How Data Gets INTO Victory Recorder)

| Source | How It Works | Interrupts User? |
|--------|-------------|-----------------|
| PRD-09A: Active task marked complete | When a deployed task's status changes to 'completed', auto-create victory with source = 'task_completed', description = task title + completion_note if present. | No — silent. Victory appears in log. |
| PRD-10: Tracker entry logged | When a data_point is created on any tracker (water intake, study hours, breathing practice), auto-create victory with source = 'tracker_entry', description = tracker name + value + unit. | No — silent. |
| PRD-06: Best Intention iteration celebrated | When user taps celebrate on an intention iteration, auto-create victory with source = 'intention_iteration'. | No — silent. |
| PRD-10: Widget milestone hit | When a widget reaches a configured milestone (star chart complete, streak goal, coin jar full), auto-create victory with source = 'widget_milestone'. | No — silent. Gold shimmer plays on the widget itself (PRD-10 handles this). |
| PRD-05: LiLa conversation detection | During conversation, LiLa notices an accomplishment and offers to save it as a victory. User confirms. source = 'lila_conversation'. | Yes — user confirms via action chip. |
| PRD-08: Smart Notepad routing | User writes in notepad, selects "Flag as Victory" from Send To. source = 'notepad_routed'. | Yes — user initiates. |
| Reflections: Route to Victory | User answers a reflection question and taps "Route to Victory." source = 'reflection_routed'. | Yes — user initiates. |
| PRD-09B: List item completed | List with victory_on_complete = true: checking an item auto-creates victory. source = 'list_item_completed'. | No — silent. Quick sparkle plays on the list item. |
| PRD-09A: Routine reset | When a routine resets with completed items, auto-creates factual victory listing completed items. source = 'routine_completion'. | No — silent. |
| Manual entry | User taps "Record a Victory" global quick-action or FAB. source = 'manual'. | Yes — user initiates. |

> **Decision rationale:** Auto-routed victories are always silent — no popup, no interruption. The user's flow is never broken. The victories accumulate quietly and are there when the user is ready to celebrate. This is critical for making the system feel helpful rather than nagging.

### Outgoing Flows (How Victory Recorder Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-11B: Family Celebration | Family celebration reads all family members' victories for the period. Stub until PRD-11B. |
| Archives (stub) | Victory reports auto-aggregate into each member's Archives folder monthly. Stub until Archives PRD. |
| Evening Rhythm / Reckoning (stub) | Evening Rhythm reads today's victories to show in the "Accomplishments" section and generate the daily Victory Review narrative. Stub until Rhythms PRD. |
| Dashboard widgets | Recent victories widget displays latest 3–5 victories on the member's dashboard. |
| LiLa context | When user is discouraged, LiLa can load recent victories as evidence of capability. PRD-05 context assembly loads victories when relevant. |
| Reports (stub) | Victory data feeds into report generation: Weekly Summary, Monthly Report, Homeschool Tracking, IEP/Special Needs Progress. Stub until Reports PRD. |
| Activity Log | Database trigger on victories INSERT auto-creates an activity_log_entries event with event_type = 'victory_recorded'. |

---

## AI Integration

### Celebration Text Generation

When a user records a victory manually or taps "Celebrate This!" on a collection, LiLa generates celebration text.

**Context loaded:**
- The victory description(s)
- Active Guiding Stars for this member (always-on baseline)
- Active Best Intentions for this member (if relevant)
- InnerWorkings entries with `is_included_in_ai = true` (selectively — strengths and growth areas most relevant)
- LifeLantern goals (stub — future)
- The selected voice personality

**AI behavior rules (critical — add to CLAUDE.md):**
1. **Identity-based, not performance-based.** Never "Great job completing 8 tasks!" Instead: "You kept your promise to yourself today — that's the kind of person you're becoming."
2. **Proportionate to the accomplishment.** "Made my bed" gets a warm acknowledgment. "Had a breakthrough conversation with my teenager" gets something that feels bigger. The importance field helps calibrate.
3. **Small steps are real victories.** When someone takes one small step on something big — 15 minutes on a project they've been avoiding, one paragraph of an essay, one phone call out of ten — the celebration should honor that step as meaningful, not measure it against what's left. "You touched that project today. You didn't finish it — but you showed up to it. That's how mountains move." For people who struggle with all-or-nothing thinking, the small step often feels like nothing. The celebration must reframe it as something.
4. **Connect to values when natural.** If a victory aligns with a Guiding Star or Best Intention, name the connection. Never forced — only when genuinely relevant.
5. **1-3 sentences for individual celebrations.** 2-4 paragraphs for collection/review celebrations.
6. **Never "I'm so proud of you."** That's a parent's line, not an AI's line. Instead: "Here's what you did today — this is evidence of who you're becoming."
7. **Never generic.** No "Great job!" No "Keep it up!" Every celebration must reference the specific victory.
8. **Editable.** Every piece of AI-generated celebration text is editable by the user. The AI suggests; the human decides.
9. **Voice personality shapes the tone.** The Pirate Captain writes like a pirate. The Calm Mentor writes like a wise friend. The Silly Character is playful and funny. The personality comes through in word choice and phrasing, not in substance — the identity-based celebration principles apply regardless of voice.
10. **Celebrations must feel different every day.** The AI should vary its approach naturally so celebrations never feel mechanical or templated. Variety strategies include: some days notice a pattern across victories ("Three of today's victories involved patience — that's becoming a theme"); some days zoom in on one specific victory that deserves the spotlight; some days are brief and warm ("Quiet day. But you showed up. That counts."); some days connect today's victories to something from last week or last month; some days focus on the *cumulative* effect of small steps rather than individual items. The goal is to feel like a thoughtful friend who notices different things on different days — not a report being generated.
11. **Summarize, don't itemize.** Collection celebrations should NOT list every single auto-routed victory. Instead, summarize patterns ("You tracked your water intake every day this week"), spotlight specifics that stand out ("That conversation with your sister was a turning point"), and let the less notable items contribute to the overall narrative without individual mention. The AI chooses what to highlight based on what would feel most meaningful, not what would be most comprehensive.
12. **Sincerity over enthusiasm.** The celebration should feel genuinely warm, not performatively excited. A sincere "That mattered" lands harder than an enthusiastic "AMAZING!!!" The tone should feel like someone who actually paid attention, not someone trying to make you feel good.

**Four celebration modes:**
- `individual` — Parse and celebrate a single victory. 1-3 sentences.
- `review` — Warm narrative reflection for the Evening Rhythm's daily review. 1-2 paragraphs.
- `collection` — Period-based celebration narrative for the "Celebrate This!" button. 2-4 paragraphs weaving together multiple victories, finding patterns, connecting to values.
- `monthly` — Stub for future monthly summary generation.

**Quality bar for collection celebrations:**

The AI should read the *shape of the day* and tell the person what that shape reveals about who they are. It is not summarizing tasks — it is interpreting what the pattern means. Two celebrations for the same day should read differently — different opening metaphors, different thematic emphasis, different structural approaches.

Example quality targets (from StewardShip, adapted for MyAIM):

*For a mom who spent the day debugging code, gathering documentation, refactoring components, getting kids to bed, and doing family star time (15 items):*

> "Today revealed the architect in you — someone who sees systems not just as they are, but as they could become. The methodical way you tested routing, identified drawer behaviors, and mapped out compatibility issues speaks to a mind that understands how well-built systems work. The pattern that emerges is striking: you're simultaneously building digital infrastructure and tending to the human connections that give that infrastructure meaning. Between refactoring components and getting kids to bed, you're weaving together the technical and the relational with remarkable intentionality."

Note what this does: it doesn't list 15 items. It finds the *meaning* in the pattern — the integration of technical work and family life — and names it as identity evidence. The mundane items (debugging, bedtime) become proof of something larger. This is the quality bar. Every collection celebration should aspire to this: reading the shape, naming the pattern, connecting it to identity.

### Victory Detection in LiLa Conversations

During any LiLa conversation, the system prompt includes instructions to notice genuine accomplishments and offer to save them as victories.

**Rules:**
- Suggest only for genuine accomplishments, not trivial routine tasks
- Maximum one suggestion per accomplishment
- Accept "no" gracefully — never push
- Offer via action chip, not inline text: [Save as Victory]

### Victories as Encouragement

When a user expresses discouragement ("I feel like I'm failing at everything"), LiLa should:
1. **Acknowledge the difficulty FIRST.** "That sounds really heavy."
2. **Then gently offer evidence.** "Would it help to look at what you've actually done this week? Because there's more there than you might think."
3. **Never dismissive.** Never jump straight to "But look at all your wins!" The validation comes first, always.

---

## Edge Cases

### Empty Victory Recorder
- Empty state is warm and encouraging, not guilt-inducing
- "Nothing here yet — and that's okay" messaging
- Prominent "Record a Victory" button

### Victory from Deleted Source
- If a task, tracker, or other source is deleted/archived after a victory was recorded from it, the victory remains intact
- The source link becomes inactive: "Original source no longer available"
- The victory description stands on its own — victories are permanent records

> **Decision rationale:** This is the "nothing shrinks" principle. Victories persist even when their source is removed.

### Deduplication
- The `source_reference_id` prevents duplicate victories from the same source event
- If a task completion creates both a victory (auto-route) and the user also manually records it, the manual entry is allowed (different source) but the UI can flag potential duplicates for the user to merge or dismiss
- The `useAccomplishments` merge pattern from StewardShip — querying both tasks and victories and deduplicating — should be adapted for the family context

### Very Frequent Victory Recording
- No limit on how many victories can be recorded per day
- AI does not throttle suggestions but keeps celebration text proportionate
- A day with 20 victories is celebrated differently than a day with 2 — the AI notes the volume and celebrates the consistency

### Editing Celebration Text
- User can fully rewrite AI celebration text
- User can clear it entirely (empty celebration text is allowed)
- Edited text is saved as-is; AI does not regenerate unless user explicitly requests via "Regenerate" button

### Auto-Route Volume Control
- Some users may find auto-routed victories too noisy (e.g., every single tracker entry becoming a victory)
- Future enhancement: mom can configure which auto-route sources are active per member
- MVP: all sources active by default

> **Forward note:** Auto-route source configuration is a future settings enhancement. For MVP, all sources route by default. If users report noise, this becomes a priority addition.

### Child Recording Their Own Victories
- Guided mode children can record their own victories via the "I Did Something Else Great!" button
- Play mode children can tap the "I Did Something Great!" button, but mom typically helps with the description
- All child-recorded victories are visible to mom immediately

---

## Tier Gating

> **Tier rationale:** Basic victory recording and celebration is Essential because the practice of noticing victories is foundational to the platform's mission. Premium voice personalities and advanced AI features are Enhanced/Full Magic because they represent meaningful upgrade value.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `victory_recorder_basic` | Victory Recorder page, manual entry, auto-routes, basic celebration text | Essential |
| `victory_recorder_celebrate` | "Celebrate This!" AI narrative generation (collection/review modes) | Essential |
| `victory_moms_picks` | Mom's Picks designation | Essential |
| `victory_voice_basic` | 5 base voice personalities (text style only) | Enhanced |
| `victory_voice_premium` | 10+ premium voice personalities | Full Magic |
| `victory_reports` | Victory report generation (weekly, monthly, homeschool, IEP) | Enhanced |
| `daily_celebration` | DailyCelebration 5-step sequence for Guided/Play | Essential |

All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| DailyCelebration Step 4 — Visual World evolution and Overlay reveals | Gamification theme progress system | PRD-24 (Rewards & Gamification) |
| Gamification approach modules (Dragon, Star Jar, Achievement Board, etc.) | Configurable visual modules that plug into celebration sequence | PRD-24 (Rewards & Gamification) |
| TTS audio generation for voice personalities | OpenAI TTS / ElevenLabs integration | Post-MVP enhancement |
| Family Celebration mode | Whole-family celebration script, scheduled triggers | PRD-11B (Family Celebration) |
| Victory Reports — Weekly Summary | Report template, PDF generation | Reports PRD (future) |
| Victory Reports — Monthly Report | Report template, monthly compilation | Reports PRD (future) |
| Victory Reports — Homeschool Tracking | State-compliant educational hours, subject tracking | Reports PRD (future) |
| Victory Reports — IEP/Special Needs Progress | Therapist/teacher formatted progress report | Reports PRD (future) |
| Auto-archive to Archives | Monthly victory aggregation into member's Archives folder | Archives PRD |
| Auto-route source configuration | Per-member settings for which sources create victories | Settings PRD (future) |
| LifeLantern context in celebrations | Life assessment goals referenced in celebration narratives | LifeLantern PRD |
| Celebration Cards (visual) | Designed, shareable image-based celebration summaries | Future enhancement |
| Reflections feature | Daily contemplation questions, responses, routing to Victory | Reflections PRD (separate) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| `victory_flagged` on tasks table | PRD-09A | Task completions with victory_flagged auto-create victory records with source = 'task_completed'. Additionally, ALL task completions auto-route to victories (not just flagged ones). |
| Widget milestones trigger victory records | PRD-10 | Widget milestone events create victory records with source = 'widget_milestone'. |
| Best Intention iteration celebrations | PRD-06 | Intention celebrate-tap creates victory records with source = 'intention_iteration'. |
| LiLa victory detection action chip | PRD-05 | Wired here — LiLa offers [Save as Victory] action chip during conversations when accomplishments detected. |
| Smart Notepad "Flag as Victory" routing | PRD-08 | Notepad routing to Victory creates records with source = 'notepad_routed'. |
| List item victory_on_complete | PRD-09B | List items with victory_on_complete auto-create victories on check-off. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Victory Recorder main page with chronological list, period/life area filters
- [ ] Record a Victory modal with quick-add categories and free-text entry
- [ ] AI-generated celebration text (individual mode) with life area tag and identity-based narrative
- [ ] "Celebrate This!" collection mode — AI narrative weaving together period's victories
- [ ] Celebration Archive — text card history of saved narratives, browsable by date
- [ ] Gold visual effects on victory cards and save animation (SparkleOverlay)
- [ ] Auto-route from task completions → victory records (silent, no interruption)
- [ ] Auto-route from tracker entries → victory records (silent)
- [ ] Auto-route from Best Intention iterations → victory records (silent)
- [ ] Auto-route from widget milestones → victory records (silent)
- [ ] Manual victory entry via global quick-action (accessible from any page)
- [ ] Victory Detail view with source links, editing, archiving
- [ ] Mom's Picks — boolean toggle + optional note on any family victory
- [ ] DailyCelebration 5-step sequence for Guided/Play modes (Step 4 stubbed)
- [ ] Voice personality selection (text style only — 5 base voices)
- [ ] Shell-appropriate rendering across all modes (Play/Guided/Independent/Adult)
- [ ] Editable AI-generated content on all victories
- [ ] Victory persistence — survives source deletion
- [ ] RLS on all tables — family-scoped, role-appropriate
- [ ] Activity log trigger on victory INSERT

### MVP When Dependency Is Ready
- [ ] LiLa victory detection during conversations with [Save as Victory] action chip (requires PRD-05 detection logic)
- [ ] Victories as encouragement during hard times — LiLa loads recent victories when user is discouraged (requires PRD-05 context assembly enhancement)
- [ ] DailyCelebration Step 4 wired to Visual World and Overlay evolution (requires PRD-24)
- [ ] Evening Rhythm integration — today's victories shown in Reckoning review (requires Rhythms PRD)
- [ ] Reflection response routing to Victory (requires Reflections PRD)

### Post-MVP
- [ ] TTS audio for voice personalities (OpenAI TTS or ElevenLabs)
- [ ] Victory Reports — Weekly Summary, Monthly, Homeschool, IEP (PDF generation)
- [ ] Auto-archive to Archives monthly
- [ ] Auto-route source configuration per member
- [ ] Celebration Cards — visual, shareable, designed image summaries
- [ ] Premium voice personalities (10+ Full Magic tier voices)
- [ ] Pattern Insights for teens (AI notices themes across 10+ victories)
- [ ] Private Victory Wall for teens (curated collection of pinned victories)
- [ ] Victory heatmap for adults (GitHub-style consistency visualization)
- [ ] Monthly Reflection Card (printable summary)
- [ ] AI learning what user considers victory-worthy based on past confirmations/rejections

---

## CLAUDE.md Additions from This PRD

- [ ] Gold visual effects: ONLY on Victory Recorder, DailyCelebration, and streak milestones. Nowhere else in the app. Gold means victory. If gold appears everywhere, it means nothing.
- [ ] Victory Recorder is a celebration-only surface. It NEVER shows incomplete tasks, unfinished goals, or what wasn't done. It only accumulates. Nothing shrinks.
- [ ] Victory celebration text rules: identity-based, not performance-based. 1-3 sentences for individual, 2-4 paragraphs for collection. Connected to Guiding Stars/Best Intentions when natural. Never generic. Never "I'm so proud of you."
- [ ] Small steps rule: When someone takes one small step on something big, the celebration honors the step as meaningful — never measures it against what's left. Critical for users with all-or-nothing thinking patterns.
- [ ] Celebration variety rule: Celebrations must feel different every day. Vary approach — sometimes patterns, sometimes spotlight one victory, sometimes brief, sometimes connecting to last week. Never feel like a template being filled in.
- [ ] Summarize, don't itemize: Collection celebrations highlight patterns and spotlight specifics rather than listing every auto-routed victory. AI chooses what to highlight based on what feels most meaningful.
- [ ] Sincerity over enthusiasm: Celebrations should feel genuinely warm, not performatively excited. A sincere "That mattered" lands harder than "AMAZING!!!"
- [ ] Victory identification in LiLa conversations: suggest when genuine, not for trivial things, max once per accomplishment, accept "no" gracefully.
- [ ] Victories as encouragement: acknowledge difficulty FIRST, then offer evidence. Never dismissive.
- [ ] Victory from deleted source: victory persists, source link becomes inactive.
- [ ] Auto-routed victories are always silent — no popup, no interruption to user flow.
- [ ] `VictoryRecorder` = adult/teen component. `DailyCelebration` = kid component (Guided/Play). These are separate React components. They share the `victories` table but have entirely different UIs.
- [ ] DailyCelebration Step 2 shows ONLY completed victories. Never references incomplete tasks. Never shows "X of Y" where Y is the total assigned.
- [ ] Voice personalities affect text style for MVP. TTS audio is post-MVP.
- [ ] Mom's Picks: mom-designated victories with optional note. Gold star indicator. Feeds into family celebrations and reports.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `victories`, `victory_celebrations`, `victory_voice_preferences`
Enums updated: `victory_source` (10 source values), `victory_importance` (4 levels), `celebration_mode` (4 modes), `voice_personality` (15+ keys across tiers)
Triggers added:
- AFTER INSERT on `victories` → insert `activity_log_entries` with event_type = 'victory_recorded'
- `set_updated_at` on `victories`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Victory Recorder is a celebration-only surface, not a daily review form.** The structured end-of-day review (task triage, mood, gratitude, tracker prompts) belongs in the Evening Rhythm / Reckoning, not Victory Recorder. | Keeps Victory Recorder focused on its core mission — celebrating what went right — without mixing in task management or reflective journaling. |
| 2 | **DailyCelebration Step 2 removed incomplete task display.** Original Gamification Manuscript showed incomplete tasks with empty checkboxes. Now shows ONLY completed victories. | Victory Recorder must never create disappointment. If a child completed 1 of 5 tasks, the celebration says "You did your reading today!" not "1 of 5 tasks." |
| 3 | **All task completions, tracker entries, and Best Intention iterations auto-route to Victory Recorder silently.** | The full picture must be available at celebration time without the user re-entering data. Silent routing prevents interruption fatigue. |
| 4 | **"Record a Victory" is a global quick-action, not just a page feature.** | Victory recording must be frictionless. The moment of noticing something good is fleeting. Three seconds, from anywhere. |
| 5 | **Family Celebration deferred to PRD-11B.** | Keeps PRD-11 focused on individual recording and celebration. Family celebration is architecturally an extension of the same engine but deserves its own PRD for the communal ritual design. |
| 6 | **TTS audio deferred to post-MVP. Voice personalities are text-style-only for MVP.** | Significant cost and complexity. The personality still comes through in written style. Audio is a meaningful future upgrade. |
| 7 | **Gamification visual modules (Dragon, Star Jar, etc.) deferred to PRD-24.** Schema and celebration sequence designed to accommodate them without creating tech debt. | PRD-11 is already complex with two products. Gamification modules are a separate system that plugs into the celebration sequence structure. |
| 8 | **Celebration Archive is text cards organized by date**, modeled on StewardShip's "Past Celebrations" pattern. Not visual cards with designed layouts. | Simple, effective, ships quickly. Visual Celebration Cards are a future enhancement. |
| 9 | **Mom's Picks included in MVP.** Boolean + optional note. Small schema addition, big emotional payoff. | A child whose victory is marked as a Mom's Pick knows their mom noticed. That's more motivating than any badge. |
| 10 | **Reflections is a separate feature, not part of Victory Recorder.** Reflection responses can be routed to Victory Recorder. | Reflections has its own page, question management, and browsing experience. Clean separation prevents feature bloat. |
| 11 | **Victory Recorder reads context from Guiding Stars, Best Intentions, InnerWorkings, and LifeLantern (stub) for celebration generation.** No Wheel concept. | Wheel is a StewardShip-specific tool not in MyAIM v2. The celebration engine connects victories to the person's values, intentions, strengths, and growth areas from the features that exist. |
| 12 | **Adults' own Victory Recorders are private from each other.** Mom can't see Dad's, Dad can't see Mom's. | Victory Recorder is a personal growth space. Spousal visibility could be a future opt-in sharing feature. |
| 13 | **Auto-route creates victories from ALL task completions**, not just those with `victory_flagged = true`. The `victory_flagged` field from PRD-09A serves as an additional emphasis marker, not a gate. | Every completed task is an accomplishment worth recording. The celebration engine calibrates proportionality — making a bed gets a warm note, not a parade. |
| 14 | **Small steps are explicitly honored in celebration text.** The AI must reframe partial progress as meaningful, not measure it against what remains. | For users with all-or-nothing thinking (common in moms and teens), a small step often feels like nothing. The celebration must counter that pattern by naming the step as evidence of showing up. |
| 15 | **Celebrations must vary daily and summarize rather than itemize.** The AI should not list every auto-routed victory. It should highlight patterns, spotlight specifics, and feel different each day. | Repetitive celebration templates become wallpaper within a week. Sincerity and variety keep the practice meaningful long-term. The AI is a thoughtful friend, not a report generator. |
| 16 | **Life area category filters are multi-selectable.** User can tap multiple categories to see victories from all selected areas simultaneously. "Celebrate This!" operates on whatever is currently filtered. | Enables powerful lens combinations — celebrate just your motherhood + marriage victories from this month, or all education victories for the quarter. |
| 17 | **Custom tags supported alongside default life area categories.** Users can create seasonal or focus-based tags (e.g., "potty training season", "marathon prep", "Q1 career push") and apply them to victories. | Life areas are broad and stable. Custom tags let users track focus areas that are temporal or personal. A mom in a "patience season" can tag and later celebrate all her patience victories. |
| 18 | **Special filter modes for Best Intentions, Guiding Stars, and LifeLantern.** Filtering by these shows connected victories and makes the celebration engine draw connections specifically from that context. | Lets a user ask "How am I doing on my intention to pause before reacting?" or "How are my victories connecting to my LifeLantern goals?" and get a celebration that speaks directly to that growth area. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Family Celebration (communal ritual, script, scheduling) | PRD-11B |
| 2 | Visual World evolution in DailyCelebration Step 4 | PRD-24 (Rewards & Gamification) |
| 3 | Gamification modules (Dragon, Star Jar, Achievement Board, etc.) | PRD-24 |
| 4 | TTS audio for voice personalities | Post-MVP enhancement |
| 5 | Victory Reports (Weekly, Monthly, Homeschool, IEP) | Dedicated Reports PRD |
| 6 | Auto-archive to Archives | Archives PRD |
| 7 | Auto-route source configuration per member | Settings PRD |
| 8 | Reflections feature (daily questions, responses, routing) | Dedicated Reflections PRD |
| 9 | LifeLantern context integration | LifeLantern PRD |
| 10 | Pattern Insights for teens | Post-MVP |
| 11 | Private Victory Wall for teens | Post-MVP |
| 12 | Victory heatmap for adults | Post-MVP |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-09A (Tasks) | All task completions auto-route to victories, not just victory_flagged. Auto-route is silent. | Update PRD-09A task completion flow to include victory creation step. Clarify that `victory_flagged` is emphasis, not gate. |
| PRD-10 (Widgets) | Tracker entries auto-route to victories silently. | Update PRD-10 to note that data_point creation triggers victory record. |
| PRD-06 (Guiding Stars & Best Intentions) | Intention iteration celebrate-tap creates victory record. | Update PRD-06 intention iteration flow to include victory creation. |
| PRD-05 (LiLa Core) | Victory detection action chip now specified. Victories as encouragement behavioral rules defined. | Add victory detection rules to LiLa system prompt specification. Add context loading rules for discouragement scenarios. |
| PRD-08 (Journal + Smart Notepad) | "Flag as Victory" routing destination confirmed and specified. | Verify PRD-08 routing destinations include victory path. |
| PRD-04 (Shell Routing) | Global quick-action "Record a Victory" requires shell-level UI accommodation. | Note in PRD-04 that a global quick-action system is needed (may affect navigation architecture). |
| PRD-03 (Design System) | Gold visual effects rule reinforced — ONLY on Victory Recorder, DailyCelebration, streak milestones. | Verify PRD-03 gold effect containment rule is documented. |

---

*End of PRD-11*
