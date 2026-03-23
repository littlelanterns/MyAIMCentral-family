# PRD-18: Rhythms & Reflections

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-06 (Guiding Stars & Best Intentions), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-11 (Victory Recorder + Daily Celebration), PRD-12A (Personal LifeLantern), PRD-14 (Personal Dashboard), PRD-14B (Calendar), PRD-16 (Meetings), PRD-17 (Universal Queue & Routing System)
**Created:** March 13, 2026
**Last Updated:** March 13, 2026

---

## Overview

Rhythms & Reflections is the daily heartbeat of MyAIM Family — the feature that transforms the app from a collection of management tools into a living, personal companion. Rhythms are configurable daily and periodic check-in experiences that give members a structured way to start their day, close their day, review their week, and reflect at longer intervals. Reflections is the standalone daily reflection practice with its own page, integrated into the Evening Rhythm as a lightweight inline experience.

The core design philosophy: **"We provide the tools to make the boxes, not the boxes themselves."** Three rhythms ship active by default (Morning, Evening, Weekly Review), two ship available but off (Monthly Review, Quarterly Inventory), and a curated library of 7-10 additional rhythm templates lives in the Studio for browsing, customization, and activation. Every rhythm — default or custom — is fully configurable: toggle on/off, edit content and prompts, change timing, reorder sections, archive, restore to defaults. Per family member.

Rhythms are a **consumption surface** — they read data from many other features (Guiding Stars, Best Intentions, Tasks, Calendar, Victories, LifeLantern) but create relatively little of their own. The primary data outputs are `rhythm_completions` for tracking and `journal_entries` from reflection answers. The Reflections page is both a standalone practice and the data source for the Evening Rhythm's inline reflection experience.

> **Mom experience goal:** When mom opens the app in the morning, she should feel like someone thoughtful prepared a personalized briefing just for her — not a wall of notifications, but a quiet moment of "here's who you are, here's what matters today, here's your plan." When she closes her day, the evening rhythm should feel like a gentle hand on her shoulder saying "you did good today — let's notice what went right, capture what's on your mind, and set up tomorrow." Never guilt. Never pressure. Always her choice.

> **Depends on:** Dashboard section ordering and breathing glow convention — defined in PRD-14 (Personal Dashboard) and PRD-17 (Universal Queue & Routing System). Section types reference data contracts from PRD-06, PRD-08, PRD-09A, PRD-11, PRD-12A, PRD-14B, PRD-16.

---

## User Stories

### Morning Rhythm
- As a mom, I want to start my day with a grounding reminder of who I'm choosing to be so my identity anchors my decisions before the chaos begins.
- As a mom, I want to see my top priorities and calendar at a glance so I know what's coming without hunting through multiple screens.
- As a mom, I want to capture thoughts that hit me in the morning so they don't get lost in the day.
- As a teen, I want a quick, encouraging morning check-in that shows me what I need to do today without overwhelming me.
- As a guided child, I want to see my routine and tasks in a simple, friendly format so I know what to do without needing mom to tell me.

### Evening Rhythm
- As a mom, I want to celebrate what went right today before I think about what's next so the day ends on a positive note.
- As a mom, I want a structured but optional evening flow that helps me reflect, plan tomorrow, and close the day intentionally.
- As a mom, I want to answer a few reflection questions each evening that route to my journal automatically so I build a record of my inner life without extra work.
- As a teen, I want a simpler evening experience that celebrates my wins and asks me one or two thoughtful questions.
- As a guided child, I want the DailyCelebration sequence instead of an adult reflection experience.

### Reflections Page
- As a mom, I want a dedicated place to see all my reflection questions, answer them at my own pace, and browse past answers organized by date.
- As a mom, I want my reflection answers to automatically appear in the right places — gratitude answers in my gratitude journal view, accomplishments flagged as potential victories — without me manually routing each one.
- As a mom, I want to add my own reflection questions and archive ones that don't resonate with me.
- As a mom, I want to export my reflection history filtered by category tags, organized by date, as a clean journal document.

### Periodic Rhythms
- As a mom, I want a weekly review that shows me what happened and what's coming so I can plan ahead without feeling behind.
- As a mom, I want monthly and quarterly check-ins available when I'm ready for deeper reflection, but not nagging me if I'm not.

### Configuration & Customization
- As a mom, I want to configure different rhythms for different family members so my 8-year-old's morning looks nothing like mine.
- As a mom, I want to browse rhythm templates in the Studio and activate ones that fit my family's patterns.
- As a teen, I want to browse rhythm templates, customize one, and send it to mom for approval so I can take ownership of my own growth practice.
- As a mom, I want to see when family members have completed their rhythms on my Overview so I have gentle awareness without micromanaging.

### System-Wide Conventions
- As any user, I want brief tooltip descriptions on features and settings so I can understand what things do without reading a manual.
- As any user, I want "What's this?" links that open LiLa to explain a feature conversationally so I get help tailored to my experience level.

---

## Screens

### Screen 1: Morning Rhythm (Auto-Open Modal → Dashboard Card)

> **Depends on:** Dashboard section ordering — defined in PRD-14. Breathing glow convention — defined in PRD-17.

**Delivery behavior:**

The first time a member opens their dashboard during morning rhythm hours (between their configured wake time and noon), the Morning Rhythm auto-opens as a modal overlay. The modal is not blocking — the member can dismiss it immediately with a tap outside or a dismiss button. After dismissal (or completion), the rhythm collapses to a dashboard card with the breathing glow indicator, positioned as a new section at the top of the section list (above calendar, tasks, and widgets). Tapping the card re-opens the full rhythm experience.

The auto-open triggers exactly once per period. If the member dismisses and returns later during morning hours, they see only the dashboard card — no second auto-open.

> **Decision rationale:** Gentle auto-open (Option B) balances "present but not pushy" with re-engagement. The first encounter catches the user's attention; the card ensures availability without interruption. Matches StewardShip's Reveille pattern adapted for dashboard-card architecture.

**What the user sees (Mom/Adult default template):**

A vertically scrolling modal with themed header, section cards, and a bottom action bar.

```
┌──────────────────────────────────────────────────┐
│  Good morning, [Name].                        ✕  │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  ✦ Guiding Star Rotation                   │   │
│  │  "I choose to lead with patience and       │   │
│  │   presence, even when the day is loud."     │   │
│  │  Remember who you are.                      │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  ♡ Best Intentions Focus                   │   │
│  │  Today, remember to...                      │   │
│  │  ☑ Pause and breathe when Gideon speaks  ×2│   │
│  │  ☑ Give kids experiences with the Spirit  ×0│   │
│  │  ☑ Go for a gratitude walk               ×0│   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  ▣ Today's Priorities                       │   │
│  │  [Static snapshot of current task view]     │   │
│  │  ── tap to open Tasks page ──               │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  ◈ Today's Calendar                         │   │
│  │  9:00 AM  Co-op science class               │   │
│  │  1:00 PM  Jake - orthodontist               │   │
│  │  3:30 PM  Basketball practice               │   │
│  │  ── tap to open Calendar ──                 │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  ✎ Anything on your mind?                   │   │
│  │  [Smart Notepad embed — text area with      │   │
│  │   full routing capabilities on save]        │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  (Periodic cards appear here on their days) │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  [Start My Day]              [Snooze ▾]          │
└──────────────────────────────────────────────────┘
```

**Section types in the default Morning Rhythm (Mom/Adult):**
1. **Guiding Star Rotation** — one rotating declaration from active, AI-included entries. Framing: "Remember who you are."
2. **Best Intentions Focus** — 2-3 active intentions for today with tap-to-celebrate checkmarks. Framing: "Today, remember to..."
3. **Task Preview** — static snapshot of the user's current dashboard task view (no carousel). Tappable to navigate to Tasks page.
4. **Calendar Preview** — today's events at a glance. Tappable to navigate to Calendar page.
5. **Brain Dump / Capture** — embedded Smart Notepad component (see System-Wide Conventions section). Framing: "Anything on your mind?"
6. **(Periodic cards)** — Weekly Review, Monthly Review, or Quarterly Inventory cards appear here inline on their configured days.

> **Decision rationale:** Morning is forward-looking by default — plan, prioritize, set intention. No morning reflection prompt in the default template. Users who want morning gratitude or reflection can add those section types via customization.

**Interactions:**
- [Start My Day] → marks rhythm as completed for today, closes modal, card shows completed state on dashboard
- [Snooze ▾] → dropdown with "Remind me in 30 min" / "Remind me in 1 hour" / "Dismiss for today"
- Tap any section → navigates to that feature's full page (Tasks, Calendar, Guiding Stars, etc.)
- Tap-to-celebrate on Best Intentions → same confetti/count behavior as PRD-06 main page
- Brain Dump text → on save, creates a notepad tab with `source_type = 'rhythm_capture'` and the rhythm context

**Data created/updated:**
- `rhythm_completions` record with `rhythm_key = 'morning'`, `period = 'YYYY-MM-DD'`, `completed_at` timestamp
- `intention_iterations` records (if user taps celebrate on Best Intentions)
- `notepad_tabs` record (if user enters brain dump content)

**Per-role default templates:**

| Role | Default Morning Sections | Notes |
|------|-------------------------|-------|
| Mom / Adult | Guiding Star, Best Intentions, Task Preview, Calendar Preview, Brain Dump, (Periodic cards) | Full template |
| Independent Teen | Encouraging Message, Task Preview, Calendar Preview | Lighter, encouraging |
| Guided Child | Encouraging Message, Routine Checklist, Task Preview (simplified) | Simple, warm |
| Play Child | Encouraging Message (big, colorful), Routine Checklist (visual cards) | Maximum simplicity |

---

### Screen 2: Evening Rhythm (Auto-Open Modal → Dashboard Card)

**Delivery behavior:**

Same pattern as Morning Rhythm: auto-open modal on first dashboard visit during evening hours (between configured evening time and midnight). Collapses to breathing glow card after dismiss. One auto-open per day.

> **Decision rationale:** Fixed section sequence for the evening rhythm. Sections can be toggled on/off but the order is locked. The evening rhythm has a deliberate narrative arc: celebrate → plan → reflect → close. Reordering would break that flow. This is an intentional exception to the general "fully reorderable" pattern of other rhythms.

**What the user sees (Mom/Adult default template):**

A vertically scrolling modal with a fixed section sequence. All sections are toggleable on/off in rhythm settings, but order cannot be changed.

**Default Evening Rhythm sections (fixed order):**

| # | Section | Default State | Description |
|---|---------|--------------|-------------|
| 1 | **Evening Greeting** | ON | Personalized warm greeting. "How was your day, [Name]?" |
| 2 | **Accomplishments & Victories** | ON | Today's completed tasks + manual victories, deduplicated. Never shows what wasn't done. Uses Victory Recorder data. |
| 3 | **Completed Meetings** | ON | Any meetings held today with summary links. Auto-hides if no meetings today. |
| 4 | **Milestone Celebrations** | ON | Goal completions, streak milestones, achievement unlocks from today. Auto-hides if none. |
| 5 | **Carry Forward** | **OFF** | Move/reschedule/cancel incomplete tasks. Available but off by default — users who want task triage in their evening flow can enable it. |
| 6 | **Tomorrow's Priorities** | ON | AI-suggested top priorities for tomorrow + freeform "What do I want tomorrow to feel like?" Shows what's known (tomorrow's calendar + carried tasks) plus space for intentions. |
| 7 | **"How Was Today?" Triage** | ON | Three-option mood check: Course Correcting / Smooth Sailing / Rough Waters. Logs to `rhythm_completions.mood_triage`. LiLa can reference this in future conversations. |
| 8 | **Closing Thought** | ON | One rotating Guiding Star entry displayed in full. Grounding moment before reflection. |
| 9 | **From Your Library** | ON | One rotating Scripture/Quote entry from Guiding Stars `entry_type = 'scripture_quote'`. Auto-hides if user has no entries of this type. |
| 10 | **Before You Close the Day** | ON | Reminders: at-risk streaks, pending queue items, upcoming deadlines. Auto-hides if nothing pending. |
| 11 | **Reflections** | ON | 3 rotating reflection questions from the Reflections prompt library, inline answer fields. "See all questions →" link to Reflections page. Shared data with Reflections page. |
| 12 | **Custom Tracker Prompts** | ON | Evening trackers (water intake, exercise, mood, etc.) from PRD-10 widgets configured for evening check-in. Auto-hides if no evening trackers configured. |
| 13 | **Close My Day** | ON | Bottom action bar: [Close My Day] completes the rhythm. [Open Journal] navigates to Journal. [Talk to LiLa] opens LiLa drawer. |

> **Decision rationale:** Carry Forward is off by default to honor the Victory Recorder philosophy ("never show what wasn't done"). Users who find evening task triage helpful can enable it. The section exists because proactive task decisions are different from shame — it's "what do I want to do with these?" not "look at what you failed at."

> **Mom experience goal:** The evening rhythm should end the day with warmth and intention, not with a to-do list of failures. Celebrate first, plan second, reflect third, close gently.

**Reflections section detail (Section 11):**

The evening rhythm pulls 3 reflection questions inline using a date-seeded PRNG for deterministic daily rotation. The algorithm:
1. Pull all active, non-archived prompts from the member's reflection prompt library
2. Filter by age-appropriateness tags matching the member's role
3. Prioritize unanswered questions over already-answered ones (check `reflection_responses` for today)
4. Select 3 using a date-seeded PRNG so the selection is deterministic (same questions if the user re-opens the evening rhythm)
5. Display with inline textarea per question

Each answer saves to `reflection_responses` with the prompt ID and response text. Answers in the evening rhythm are lightweight — they save the response but routing (to Journal, Victory, etc.) happens from the Reflections page. A "See all questions →" link navigates to the full Reflections page.

If a question was already answered on the Reflections page earlier that day, it shows as "Reflected ✓" in the evening rhythm and is deprioritized in the 3-question selection.

**Interactions:**
- [Close My Day] → marks rhythm as completed, closes modal, card shows completed state
- Tapping any section's feature link → navigates to that feature page
- Answering a reflection question inline → saves to `reflection_responses`
- "See all questions →" → navigates to Reflections page

**Data created/updated:**
- `rhythm_completions` record with `rhythm_key = 'evening'`, mood_triage value
- `reflection_responses` records (if user answers inline questions)
- Task status updates (if Carry Forward is enabled and user triages tasks)

**Guided/Play Evening Experience:**

Guided and Play children do NOT get the adult evening rhythm. At evening rhythm time, they get the **DailyCelebration sequence** from PRD-11 instead — confetti, animations, Visual World progress. This is already fully defined in PRD-11 Screen 5.

> **Depends on:** DailyCelebration 5-step sequence — defined in PRD-11, Screen 5. PRD-18 specifies only the handoff: at evening rhythm time for Guided/Play members, the dashboard triggers DailyCelebration instead of the card-based evening reflection experience.

---

### Screen 3: Reflections Page (Standalone)

**Navigation:** Accessible from sidebar navigation as a standalone page AND linked from the Evening Rhythm's "See all questions →" link.

> **Mom experience goal:** The Reflections page should feel like opening a beautiful journal to a page of thoughtful questions — an invitation to pause, not a homework assignment. Answering is always optional. The practice builds over time into a rich personal record that surfaces across the Journal through tag-based views.

**Tab 1: Today**

```
┌──────────────────────────────────────────────────┐
│  Reflections                                      │
│  [Today]  [Past]  [Manage]                        │
│  ─────────────────────────────────────────────────│
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  What am I grateful for today?              │   │
│  │  Category: Gratitude & Joy                  │   │
│  │  [                                          ]   │
│  │  [                                          ]   │
│  │  [Save]                                     │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  What obstacle did I face today, and what   │   │
│  │  did I do to overcome it?                   │   │
│  │  Category: Growth & Accountability          │   │
│  │  [                                          ]   │
│  │  [                                          ]   │
│  │  [Save]                                     │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  ✓ Reflected — "I'm grateful for the quiet  │   │
│  │  moment with Jake after lunch..."           │   │
│  │  [Edit] [Route →]                           │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ... (all active questions listed)                │
│                                                   │
│  Reflected on 1 of 3 today                        │
└──────────────────────────────────────────────────┘
```

**What the user sees:**
- All active (non-archived) questions from the member's reflection prompt library
- Each question displayed as a card with the prompt text, category tag, and an inline textarea
- Already-answered questions (from today) show the response text with [Edit] and [Route →] buttons
- Unanswered questions show the empty textarea with [Save]
- Soft progress indicator at bottom: "Reflected on X of Y today" (Y defaults to 3 but is configurable by mom for kids)

**Answering a question:**
1. User types response in the textarea
2. Taps [Save]
3. Response saves to `reflection_responses` with prompt_id, response text, and today's date
4. The response also creates a `journal_entries` record with:
   - `entry_type = 'reflection'`
   - `source = 'reflection_prompt'`
   - `source_reference_id` → the `reflection_responses.id`
   - `tags` array auto-populated based on the prompt's category:
     - Gratitude & Joy → `['reflection', 'gratitude']`
     - Growth & Accountability → `['reflection', 'growth']`
     - Identity & Purpose → `['reflection', 'identity']`
     - Relationships & Service → `['reflection', 'relationships']`
     - Curiosity & Discovery → `['reflection', 'curiosity']`
     - Kids-Specific → `['reflection', 'kids']`
   - LiLa also analyzes the response content for additional smart tagging:
     - Accomplishment/success language → LiLa offers "This sounds like a victory — flag it?" → if yes, creates `victories` record with `source = 'reflection_routed'`
     - Gratitude expression → auto-tagged `gratitude` (may already be tagged from category)
     - Goal progress → LiLa suggests linking to relevant LifeLantern area or Best Intention

**[Route →] button (on answered questions):**
Opens a mini routing panel with the prompt question as context metadata. The user can:
- Flag as Victory → creates `victories` record
- Link to LifeLantern area → creates cross-reference
- Link to People & Relationships → creates note on person's profile
- Link to InnerWorkings → creates `self_knowledge` record
- The Journal entry already exists (auto-created on save). This routing creates *additional* cross-references, never moves the original.

> **Decision rationale:** Routing is available from the Reflections page but NOT from the Evening Rhythm's inline answers. This keeps the evening flow lightweight — answer and move on. The Reflections page is the full management interface. Same data, different levels of engagement.

**Tab 2: Past**

- Date-grouped history of all past reflection responses
- Each entry shows: question text, response text, date, tags (as chips), routing indicators (which destinations it was also routed to)
- Filter by date range, category tag, or search text
- Functionally equivalent to viewing the Journal filtered to the `reflection` tag, but rendered in the Reflections page UI with question-answer pairing

**Tab 3: Manage**

- List of all reflection prompts (32 defaults + any custom)
- Each prompt shows: text, category, age-appropriateness tags, status (active/archived)
- Drag handles for reordering (affects rotation priority)
- Toggle active/archived per prompt
- [+ Add Custom Question] button — user enters question text, assigns category
- Default prompts can be archived but NOT deleted. Archived defaults stop appearing in rotation but can be restored.
- Custom prompts can be edited, archived, or deleted
- "Restore All Defaults" button returns all 32 defaults to active state

**Data created/updated:**
- `reflection_responses` records on answer save
- `journal_entries` records auto-created with category-based tags
- `victories` records (if user flags an answer as victory)
- `reflection_prompts` records (on Manage tab: custom creation, archive/restore, reorder)

---

### Screen 4: Weekly Review (Inline Card in Morning Rhythm)

**Default day:** Configurable, default Friday
**Delivery:** Inline card within Morning Rhythm on the configured day
**Purpose:** Quick tactical awareness — what happened this week, what's coming next week

> **Decision rationale:** The Friday Overview from the design notes is absorbed into the Weekly Review. Same concept, configurable day. The Weekly Review is one of the 3 active defaults.

**Default sections:**
1. **Weekly Stats** — Tasks completed / carried forward / cancelled this week. Best Intention iteration totals. Active streaks status.
2. **Top Victories** — 3-5 highlighted victories from the week (LiLa selects most meaningful based on importance flag and Guiding Stars connections)
3. **Next Week Preview** — Upcoming tasks + meetings + important dates + approaching milestones
4. **Rotating Reflection Prompt** — One weekly-specific prompt from a weekly prompt set. Examples: "What was the theme of this week?" / "What will I do differently next week?"
5. **Deep Dive Link** — "Want to do a full weekly review? [Start Weekly Review Meeting →]" launches PRD-16 Weekly Review meeting type

> **Decision rationale:** The deep dive link is the rhythm-to-meeting bridge. The weekly card is 60 seconds; the meeting is 20-30 minutes. Both exist, serving different depths. The rhythm creates awareness and offers the meeting as an option.

**Tracking:** `rhythm_completions` with `rhythm_key = 'weekly_review'`, `period = 'YYYY-W##'`

---

### Screen 5: Monthly Review (Inline Card, Available but Off by Default)

**Default timing:** 1st of the month (configurable)
**Delivery:** Inline card within Morning Rhythm on configured day
**Default state:** Available but toggled OFF. Users enable in Rhythms settings.

**Default sections:**
1. **Month at a Glance** — Summary stats: total tasks completed, victories logged, streaks maintained, Best Intention iteration totals, LifeLantern areas visited
2. **Highlight Reel** — LiLa selects 3-5 most significant victories or patterns from the month
3. **Reports Link** — "View full monthly report → [Reports Page]"
4. **Deep Dive Link** — "Want to do a full monthly review? [Start Monthly Review Meeting →]" launches PRD-16 Monthly Review meeting type

**Tracking:** `rhythm_completions` with `rhythm_key = 'monthly_review'`, `period = 'YYYY-MM'`

---

### Screen 6: Quarterly Inventory (Inline Card, Available but Off by Default)

**Default timing:** ~90 days since last LifeLantern check-in (personalized, not calendar-quarter-based)
**Delivery:** Inline card within Morning Rhythm
**Default state:** Available but toggled OFF.

> **Depends on:** LifeLantern staleness check — defined in PRD-12A. Uses `life_lantern_areas` table to calculate days since last visit per area.

**Default sections:**
1. **Time Since Last Check-in** — "It's been about [X] months since you last reflected on your life areas in LifeLantern."
2. **Stale Areas** — Lists LifeLantern areas ordered by staleness
3. **Quick Win Suggestion** — "You could start with [most stale area] — usually takes about 10-15 minutes."
4. **Launch Link** — "Ready to check in? [Open LifeLantern →]" navigates to LifeLantern Hub (PRD-12A)

**Tracking:** `rhythm_completions` with `rhythm_key = 'quarterly_inventory'`, `period = 'YYYY-Q#'`

---

### Screen 7: Rhythms Settings Page

**Navigation:** Accessible from sidebar navigation. Also accessible via gear icon on any rhythm card.

**What the user sees:**

```
┌──────────────────────────────────────────────────┐
│  Rhythms                                          │
│  [Member picker: Mom ▾]                           │
│  ─────────────────────────────────────────────────│
│                                                   │
│  ACTIVE RHYTHMS                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  ☀ Morning Rhythm                    [⚙]   │   │
│  │  Daily · Wake time – Noon                   │   │
│  │  6 sections enabled                         │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │  ☾ Evening Rhythm                    [⚙]   │   │
│  │  Daily · 7:00 PM – Midnight                 │   │
│  │  11 sections enabled                        │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │  ▦ Weekly Review                     [⚙]   │   │
│  │  Fridays · In Morning Rhythm                │   │
│  │  5 sections enabled                         │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  AVAILABLE RHYTHMS                                │
│  ┌────────────────────────────────────────────┐   │
│  │  ◇ Monthly Review                   [Enable]│   │
│  │  1st of month · In Morning Rhythm           │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │  ◇ Quarterly Inventory              [Enable]│   │
│  │  ~90 days since LifeLantern check-in        │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  CUSTOM RHYTHMS                                   │
│  (none yet)                                       │
│  [+ Create Custom Rhythm]                         │
│                                                   │
│  [Browse Studio Templates →]                      │
└──────────────────────────────────────────────────┘
```

**Member picker:** Mom can switch to configure any family member's rhythms. The picker shows all family members. When viewing another member's rhythms, mom sees their configurations and can edit them (for Guided children, this is the only way rhythms are configured).

**[⚙] Settings for each rhythm:**
- Enable/disable toggle
- Timing configuration (active hours, day of week, day of month)
- Section list with on/off toggles per section
- For Morning Rhythm and custom rhythms: drag handles for section reordering
- For Evening Rhythm: fixed order, on/off toggles only
- Per-section settings (tap a section to edit: which Guiding Star types to rotate, how many intentions to show, reflection category filters, etc.)
- [+ Add Section] opens the section type picker
- [Restore Defaults] returns to the role-type default template
- [Archive Rhythm] (for custom rhythms)

**Custom rhythm creation:**
- Name, interval (daily/weekly/monthly/custom), timing, assigned members
- Section picker from the full section type library
- Sections are reorderable for custom rhythms
- Save creates a `rhythm_configs` record with `is_custom = true`

**Studio template browsing:**
- [Browse Studio Templates →] navigates to the Studio page filtered to rhythm templates
- Templates include: Sabbath/Renewal Reflection, Priority Reevaluation, Goal Evaluation, Children & Youth Program Check-in, Marriage Check-in, Homeschool Week Review, Semester Review, Medication/Health Check, Mid-Day Reset, Bedtime Prayer
- Tapping a template shows preview → [Activate] creates a copy as a custom rhythm the user can further customize

**Teen rhythm request flow:**
- Independent Teens see the Rhythms page with their own rhythms and can browse Studio templates
- When a teen taps [Activate] on a template or [Create Custom Rhythm], they can customize it
- Instead of [Save], teen sees [Request Activation →] which sends the configured rhythm to mom's Requests tab in the Universal Queue Modal
- Mom can approve as-is, edit then approve, or decline with a note
- Mom's permission setting controls whether teens can create rhythm requests (default: allowed)

**Data created/updated:**
- `rhythm_configs` records (on any configuration change)
- Studio queue entries with `source = 'rhythm_request'` (for teen requests)

---

### Screen 8: Rhythm Dashboard Card (Collapsed State)

After a rhythm is dismissed or completed, it appears as a compact card in the dashboard section list.

**Pending (not yet completed today):**
- Card shows rhythm name and "Ready when you are" text
- Breathing glow animation (platform-wide convention from PRD-17)
- Tapping opens the full rhythm modal

**Completed:**
- Card shows rhythm name, completion time, and a subtle checkmark
- No breathing glow
- Tapping re-opens the completed rhythm for review (read-only, responses visible)

**Snoozed:**
- Card shows rhythm name and "Snoozed until [time]"
- No breathing glow until snooze expires, then glow resumes
- Tapping opens the rhythm immediately (cancels snooze)

---

## Section Type Library

These are the modular building blocks available when configuring any rhythm. Each section type has a defined data source, rendering behavior, and configuration options.

| # | Section Type | Description | Data Source | Available In |
|---|-------------|-------------|-------------|-------------|
| 1 | **Guiding Star Rotation** | One rotating declaration with anchoring framing | `guiding_stars` table, `is_included_in_ai = true` | Morning, Evening, Custom |
| 2 | **Best Intentions Focus** | 2-3 active intentions with tap-to-celebrate | `best_intentions` table, active entries | Morning, Custom |
| 3 | **Task Preview** | Static snapshot of user's current task view | Tasks via PRD-09A dashboard contract | Morning, Custom |
| 4 | **Calendar Preview** | Today's events at a glance | `calendar_events` via PRD-14B | Morning, Custom |
| 5 | **Victory Summary** | Today's accumulated victories with celebration | `victories` table via PRD-11 | Evening, Custom |
| 6 | **Intention Check-in** | Iteration counts per intention, gentle 0-tap handling | `intention_iterations` via PRD-06 | Evening, Custom |
| 7 | **Reflections** | Rotating prompts from library, inline answer fields | `reflection_prompts` + `reflection_responses` | Evening, Custom |
| 8 | **Brain Dump / Capture** | Embedded Smart Notepad component | Smart Notepad (PRD-08) | Morning, Evening, Custom |
| 9 | **Tomorrow Prep** | Tomorrow's calendar + priority selection + freeform intention | Calendar + Tasks | Evening, Custom |
| 10 | **Scripture / Quote Rotation** | Rotating entries from Guiding Stars scriptures/quotes type | `guiding_stars` where `entry_type = 'scripture_quote'` | Morning, Evening, Custom |
| 11 | **Encouraging Message** | LiLa-generated or pre-written warm message | LiLa API or static content | Morning (kids), Custom |
| 12 | **LifeLantern Check-in** | Nudge to revisit a stale life area | `life_lantern_areas` staleness check | Quarterly, Custom |
| 13 | **Routine Checklist** | Today's routine steps (for kids) | `tasks` where `task_type = 'routine'` | Morning (kids), Custom |
| 14 | **Weekly Stats** | Tasks completed/carried/cancelled, streaks | Aggregated from multiple tables | Weekly, Custom |
| 15 | **Next Week Preview** | Upcoming tasks + meetings + dates + milestones | Calendar + Tasks + Meetings | Weekly, Custom |
| 16 | **Reflection Summary** | This period's reflection highlights | `journal_entries` with `reflection` tag | Weekly, Monthly, Custom |
| 17 | **Custom Text / Prompt** | User-defined content — anything mom wants | User-authored content | Any |
| 18 | **Completed Meetings** | Meetings held today with summary links | `meetings` via PRD-16 | Evening |
| 19 | **Milestone Celebrations** | Goal completions, streak milestones | Gamification + streaks | Evening |
| 20 | **Carry Forward** | Move/reschedule/cancel incomplete tasks | Tasks via PRD-09A | Evening (off by default) |
| 21 | **How Was Today? Triage** | Three-option mood check | `rhythm_completions.mood_triage` | Evening |
| 22 | **Before You Close the Day** | Reminders, at-risk streaks, pending items | Multiple sources | Evening |
| 23 | **Custom Tracker Prompts** | Evening trackers from widget config | PRD-10 widgets | Evening |
| 24 | **Renewal Dimension Rotation** | 4-week rotating focus (physical/spiritual/mental/social) | User-configurable dimensions | Studio templates, Custom |
| 25 | **Gratitude Anchor** | One gratitude prompt | Static/custom | Studio templates, Custom |
| 26 | **Intention Setting** | Freeform text for weekly intention | Routes to Best Intentions or Journal | Studio templates, Custom |

> **Forward note:** Additional section types can be added without schema changes — the `sections` JSONB array in `rhythm_configs` uses `section_type` TEXT keys that map to rendering components. New section types require only a new component, not a migration.

---

## Reflection Prompt Library

### Default Prompts (32)

**Gratitude & Joy (8 prompts):**
1. What am I grateful for today?
2. What did I love about today?
3. What was a moment that inspired awe, wonder, or joy?
4. What made me laugh today?
5. What brought you joy recently?
6. What are you looking forward to?
7. What small moment today might I have overlooked that was actually a gift?
8. Who made my day better, and do they know it?

**Growth & Accountability (7 prompts):**
9. What obstacle did I face today, and what did I do to overcome it?
10. How well did I attend to my duties today?
11. Where did I fall short today, and what would I do differently?
12. What goal did I make progress on?
13. What did I do today that was hard but right?
14. What did I avoid today that I know I need to face?
15. What pattern did I notice in myself today?

**Identity & Purpose (4 prompts):**
16. How did I move toward my divine identity or life purpose today?
17. What would my future self thank me for today?
18. When did I feel most like the person I'm becoming?
19. Which of my Guiding Stars showed up in my actions today?

**Relationships & Service (5 prompts):**
20. What was a moment that made me appreciate another family member?
21. How did I serve today?
22. Who needed me today, and was I there?
23. What conversation today mattered most?
24. How did I make someone feel safe or seen?

**Curiosity & Discovery (3 prompts):**
25. What was something interesting I learned or discovered?
26. What question is still on my mind from today?
27. What did I see differently today than I would have a year ago?

**Kids-Specific (5 prompts):**
28. What was the best part of your day?
29. Was there a moment you were brave today?
30. Did you help someone today? How?
31. What's something you tried that was hard?
32. If you could do one thing over, what would it be?

### Dynamic / Contextual Prompts (LiLa-Generated)

LiLa generates contextual prompts blended seamlessly with static prompts. These are visually indistinguishable from static prompts — the experience feels personal without being obviously AI-generated.

- **Day-data-based:** "You had a really full task day. What felt most meaningful versus just busy?"
- **Stale-intention-based:** "You set an intention to [title]. How has that been feeling lately?"
- **Stale-LifeLantern-based:** "It's been a while since you reflected on your [area]. How's that part of your life feeling right now?"
- **Victory-based:** "You accomplished [specific victory] today. What did that take from you?"
- **Conflict-based:** If LiLa detected tension in a conversation today: "It sounds like today had some hard moments. What's sitting with you tonight?"

> **Decision rationale:** Dynamic prompts are seamlessly blended. The magic is that reflection feels personal without being obviously AI-generated. Dynamic prompts use the same `reflection_prompts` table with `source = 'lila_dynamic'` and `is_ephemeral = true` (generated per session, not persisted permanently).

### Prompt Rotation Logic

Each evening (or when viewing the Reflections page), the system selects prompts:
1. Pull all active, non-archived prompts for this member
2. Filter by age-appropriateness tags matching member's role
3. Use date-seeded PRNG for deterministic selection (same prompts on same day if re-opened)
4. Prioritize unanswered questions over already-answered (check `reflection_responses` for today)
5. Weight categories by engagement history (if user consistently skips Growth prompts, those appear less frequently over time)
6. Blend 1-2 LiLa dynamic prompts with static prompts when contextually relevant

### Prompt Management

- Users can archive any default prompt (stops appearing in rotation)
- Users can restore archived defaults
- Users can edit the wording of any prompt (preserves original text for restore)
- Users can create custom prompts with category assignment
- Mom can assign specific prompts or categories to kids' rhythms
- Soft guideline: "Answer at least 3 per session." Configurable number per member. Shown as progress indicator, never blocks dismissal.

---

## Visibility & Permissions

| Role | Rhythm Access | Reflections Access | Configuration Access | Notes |
|------|-------------|-------------------|---------------------|-------|
| Mom / Primary Parent | Full — all rhythms, all sections | Full — all prompts, full routing | Full — configure own + all family members' rhythms | Mom sees completion indicators for all family members on her Overview |
| Dad / Additional Adult | Full — own rhythms | Full — own reflections | Full — configure own rhythms only. Cannot see/configure other members' rhythms unless mom grants permission. | Dad's reflection answers are private. Mom cannot see them through View As (dad's content is HIS per PRD-02). |
| Special Adult | Not present | Not present | Not present | Rhythms are outside Special Adult scope. No rhythm features during shifts. |
| Independent (Teen) | Full — own rhythms | Full — own reflections | Can customize own rhythms. Can browse Studio templates and request activation (sent to mom's Requests tab). Mom's permission setting controls whether teen can create rhythm requests. | Mom sees teen's reflection answers via View As (per PRD-02 default visibility). Teen is aware of this via TransparencyIndicator. |
| Guided | Simplified — Morning only (DailyCelebration replaces Evening) | Not present as standalone | None — mom configures all rhythms for Guided children | Mom assigns sections, prompts, timing |
| Play | Minimal — Morning only (DailyCelebration replaces Evening) | Not present | None — mom configures all rhythms for Play children | Maximum simplification, visual-first |

### Shell Behavior

| Shell | Morning Rhythm | Evening Rhythm | Reflections Page | Rhythms Settings |
|-------|---------------|---------------|-----------------|-----------------|
| Mom | Full modal + card | Full 13-section sequence | Full 3-tab page | Full config + member picker |
| Dad / Additional Adult | Full modal + card | Full 13-section sequence | Full 3-tab page | Own rhythms only |
| Special Adult | Not present | Not present | Not present | Not present |
| Independent (Teen) | Reduced sections (Encouraging Message, Tasks, Calendar) | Reduced sections (Victories, Reflections, Tomorrow Prep) | Full 3-tab page (teen-appropriate prompts) | Own rhythms + Studio browsing with request flow |
| Guided | Encouraging Message, Routine Checklist, Tasks (simplified) | DailyCelebration (PRD-11) | Not present | Not present (mom configures) |
| Play | Encouraging Message (big/colorful), Routine Checklist (visual) | DailyCelebration (PRD-11, maximum delight) | Not present | Not present (mom configures) |

### Privacy & Transparency
- Mom sees all children's rhythm completion status on her Overview (PRD-14C)
- Mom can see teen's reflection answers through View As
- Teen sees TransparencyIndicator (Lucide `Eye` icon) on their Reflections page when mom has visibility
- Dad's reflections are private to him — mom cannot access through View As (per PRD-02: dad's personal content is his)
- Each adult's rhythm data is private to them unless explicitly shared

---

## Data Schema

### Table: `rhythm_configs`

Per-member rhythm configuration. One row per rhythm per member.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members |
| rhythm_key | TEXT | | NOT NULL | Unique key: 'morning', 'evening', 'weekly_review', 'monthly_review', 'quarterly_inventory', or custom slug |
| display_name | TEXT | | NOT NULL | User-visible name (editable for custom rhythms) |
| rhythm_type | TEXT | 'default' | NOT NULL | Enum: 'default', 'custom', 'template_activated' |
| enabled | BOOLEAN | true | NOT NULL | Whether this rhythm is active for this member |
| sections | JSONB | '[]' | NOT NULL | Ordered array of section configurations. Each: `{section_type, enabled, config, order}` |
| section_order_locked | BOOLEAN | false | NOT NULL | If true, sections can toggle on/off but not reorder. True for Evening Rhythm. |
| timing | JSONB | '{}' | NOT NULL | `{start_hour, end_hour, day_of_week, day_of_month, interval_days, trigger_type}` |
| auto_open | BOOLEAN | true | NOT NULL | Whether rhythm auto-opens on first dashboard visit during active hours |
| reflection_guideline_count | INTEGER | 3 | NOT NULL | Soft guideline: "Answer at least N reflections." Configurable by mom for kids. |
| source_template_id | UUID | | NULL | FK → studio rhythm template if activated from Studio |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Members read/update own configs. Mom reads/updates all family configs. Special Adults: no access.

**Indexes:**
- `(family_id, member_id, rhythm_key)` UNIQUE — one config per rhythm per member
- `(family_id, member_id, enabled)` — active rhythms for a member

**Sections JSONB structure:**
```json
[
  {
    "section_type": "guiding_star_rotation",
    "enabled": true,
    "order": 1,
    "config": {
      "entry_types": ["value", "declaration"],
      "framing_text": "Remember who you are."
    }
  },
  {
    "section_type": "best_intentions_focus",
    "enabled": true,
    "order": 2,
    "config": {
      "count": 3,
      "selection": "priority_weighted"
    }
  }
]
```

### Table: `rhythm_completions`

Tracks when members complete or dismiss rhythms. One record per rhythm per period.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members |
| rhythm_key | TEXT | | NOT NULL | Matches `rhythm_configs.rhythm_key` |
| period | TEXT | | NOT NULL | Period identifier: 'YYYY-MM-DD' (daily), 'YYYY-W##' (weekly), 'YYYY-MM' (monthly), 'YYYY-Q#' (quarterly) |
| status | TEXT | 'pending' | NOT NULL | Enum: 'pending', 'completed', 'dismissed', 'snoozed' |
| mood_triage | TEXT | | NULL | Evening only: 'course_correcting', 'smooth_sailing', 'rough_waters' |
| snoozed_until | TIMESTAMPTZ | | NULL | If snoozed, when to re-show |
| completed_at | TIMESTAMPTZ | | NULL | When the user tapped "Start My Day" / "Close My Day" |
| dismissed_at | TIMESTAMPTZ | | NULL | When the user dismissed without completing |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Members read/update own completions. Mom reads all family completions (for Overview indicators).

**Indexes:**
- `(family_id, member_id, rhythm_key, period)` UNIQUE — one completion per rhythm per period per member
- `(family_id, member_id, status)` — pending rhythms for dashboard rendering

### Table: `reflection_prompts`

The configurable prompt library. Defaults are seeded on family creation. Custom prompts added by users.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NULL | NULL = family-level default. Set = member-specific custom prompt. |
| prompt_text | TEXT | | NOT NULL | The question text |
| original_text | TEXT | | NULL | Preserved original wording for edited defaults (enables "Restore" per prompt) |
| category | TEXT | | NOT NULL | Enum: 'gratitude_joy', 'growth_accountability', 'identity_purpose', 'relationships_service', 'curiosity_discovery', 'kids_specific', 'custom' |
| age_tags | TEXT[] | '{}' | NOT NULL | Array: 'adult', 'teen', 'guided', 'play'. Controls which role types see this prompt. |
| source | TEXT | 'default' | NOT NULL | Enum: 'default', 'custom', 'lila_dynamic' |
| is_ephemeral | BOOLEAN | false | NOT NULL | True for LiLa-generated dynamic prompts (not permanently persisted) |
| sort_order | INTEGER | 0 | NOT NULL | User-defined ordering within category |
| archived_at | TIMESTAMPTZ | | NULL | Archived prompts stop appearing in rotation |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** All family members can read family-level prompts. Members can CRUD their own custom prompts. Mom can CRUD all family prompts and assign prompts to kids.

**Indexes:**
- `(family_id, archived_at, category)` — active prompts by category
- `(family_id, member_id)` — member-specific prompts

### Table: `reflection_responses`

Individual answers to reflection prompts. Shared between Reflections page and Evening Rhythm inline answers.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members |
| prompt_id | UUID | | NOT NULL | FK → reflection_prompts |
| response_text | TEXT | | NOT NULL | The user's answer |
| response_date | DATE | CURRENT_DATE | NOT NULL | The date this response was written |
| source_context | TEXT | 'reflections_page' | NOT NULL | Enum: 'reflections_page', 'evening_rhythm'. Where the answer was written. |
| journal_entry_id | UUID | | NULL | FK → journal_entries. The auto-created journal entry for this response. |
| routed_destinations | JSONB | '{}' | NOT NULL | Tracks secondary routes: `{victory_id, lifelantern_area_id, person_profile_id, ...}` |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Members read/write own responses. Mom reads children's responses (via View As per PRD-02 visibility rules). Dad's responses are private (dad's personal content is his).

**Indexes:**
- `(family_id, member_id, response_date)` — today's responses for deduplication
- `(family_id, member_id, prompt_id, response_date)` — prevent duplicate answers to same prompt on same day

### Schema Updates to Existing Tables

**`journal_entries` (PRD-08) — add `tags` column:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| tags | TEXT[] | '{}' | NOT NULL | Content categorization tags: 'reflection', 'gratitude', 'growth', 'identity', 'relationships', 'curiosity', 'commonplace', 'kids', 'custom'. GIN index. Replaces entry_type as primary filtering mechanism for Journal views. |

> **Decision rationale:** Tags replace the `entry_type` enum as the primary Journal filtering mechanism. One record can have multiple tags and appear in multiple filtered views. `entry_type` is preserved as the source indicator (how the entry was created). Tags are the content categorization (what the entry is about). This enables a unified Journal with tag-based filtered views instead of separate sub-pages per entry type.

> **Cross-PRD impact:** This changes PRD-08's Journal architecture from "sub-pages per entry type" to "one Journal with tag-based filtered views." See Cross-PRD Impact Addendum.

**`journal_entries.entry_type` semantic shift:**
- `entry_type` now means "source/creation method" — how the entry got into Journal (manual_text, voice_transcription, reflection_prompt, meeting_framework, etc.)
- `tags` means "content categorization" — what the entry is about (gratitude, reflection, growth, commonplace, etc.)
- Existing code that filters by `entry_type` for display purposes should migrate to filtering by `tags`

### Enum/Type Updates

**New enums on `studio_queue.source`:**
- Add: `'rhythm_request'` — for teen rhythm activation requests sent to mom

**New enums on `journal_entries.source`:**
- Add: `'reflection_prompt'` — reflection answer auto-routed to Journal

**New enums on `victories.source`:**
- Add: `'reflection_routed'` — victory flagged from a reflection answer

---

## Flows

### Incoming Flows (How Data Gets INTO Rhythms)

| Source | How It Works |
|--------|-------------|
| Guiding Stars (PRD-06) | Morning/Evening rhythms read `guiding_stars` entries with `is_included_in_ai = true` for rotation sections |
| Best Intentions (PRD-06) | Morning rhythm reads active `best_intentions` for focus section. Evening rhythm reads `intention_iterations` for check-in section. |
| Tasks (PRD-09A) | Morning rhythm reads today's tasks via dashboard contract for Task Preview section. Evening reads completed tasks for Victory Summary. |
| Calendar (PRD-14B) | Morning rhythm reads today's `calendar_events` for Calendar Preview. Tomorrow Prep reads tomorrow's events. |
| Victory Recorder (PRD-11) | Evening rhythm reads today's `victories` for Accomplishments section. Weekly/Monthly review reads period victories for highlights. |
| LifeLantern (PRD-12A) | Quarterly Inventory reads `life_lantern_areas` staleness for check-in nudge. |
| Meetings (PRD-16) | Evening rhythm reads today's `meetings` for Completed Meetings section. Weekly review reads upcoming meetings. |
| Widget Trackers (PRD-10) | Evening rhythm reads widgets configured for evening check-in for Custom Tracker Prompts section. |
| Studio Templates | Rhythm templates from Studio serve as starting points for activation. |

### Outgoing Flows (How Rhythms Feed Others)

| Destination | How It Works |
|-------------|-------------|
| Journal (PRD-08) | Reflection answers auto-create `journal_entries` with `entry_type = 'reflection'` and category-based `tags`. All answers route to Journal automatically. |
| Victory Recorder (PRD-11) | Reflection answers can be flagged as victories → creates `victories` record with `source = 'reflection_routed'`. |
| Smart Notepad (PRD-08) | Brain Dump section content creates `notepad_tabs` with `source_type = 'rhythm_capture'` and rhythm context. |
| Studio Queue (PRD-17) | Teen rhythm requests deposited with `source = 'rhythm_request'`. |
| Best Intentions (PRD-06) | Intention Setting section content can route to `best_intentions` on save. |
| LiLa Context (PRD-05) | `mood_triage` values from Evening Rhythm available to LiLa for future conversation context. Reflection responses available as context when relevant. |
| Family Overview (PRD-14C) | Rhythm completion status surfaced as simple indicators: "[Name] completed morning rhythm" / "[Name] hasn't done evening rhythm yet." |

---

## AI Integration

### No Guided Mode Registered

Rhythms and Reflections do NOT register in the LiLa guided mode registry. They are consumption surfaces and context sources, not conversation modes.

> **Decision rationale:** Same pattern as Guiding Stars and Best Intentions (PRD-06). These features produce data LiLa reads, not tools LiLa operates. Keeping the guided mode registry clean for true interactive modes.

### LiLa Contextual Help Mode (System-Wide Convention)

When a user taps a "What's this?" tooltip link anywhere in the app, LiLa opens with a contextual help augmentation — not a full guided mode, but an augmented context injection that tells LiLa what feature/setting the user is asking about.

**Behavior:**
1. User taps "What's this?" on any feature, section, setting, or toggle
2. LiLa drawer opens with a system prompt addition: "The user is asking about [feature_key]. Explain what this feature does, how to use it effectively, and why they might or might not want it. Tailor your explanation to their role ([role]) and experience level. Do NOT explain implementation details, architecture, or how to recreate the feature."
3. LiLa explains conversationally, answers follow-up questions
4. Context is scoped to the specific feature — LiLa doesn't volunteer information about unrelated features unless asked

> **Decision rationale:** No standalone glossary page that could be scraped by competitors. LiLa-powered contextual help is inherently dynamic, personalized by role, and protects intellectual property while being more helpful than a static glossary.

> **Forward note:** This convention applies to every feature in the app. PRD-18 establishes it; every future feature PRD should implement tooltip descriptions with "What's this?" → LiLa help links on features, sections, settings, and toggles.

### Dynamic Reflection Prompts

LiLa generates contextual prompts based on the member's day data, blended seamlessly with static prompts. See Reflection Prompt Library section above for details.

### Mood Triage as LiLa Context

The Evening Rhythm's "How Was Today?" triage value (Course Correcting / Smooth Sailing / Rough Waters) is stored in `rhythm_completions.mood_triage` and available to LiLa's context assembly. If a user rated their day "Rough Waters" and then opens LiLa, LiLa can acknowledge: "It sounds like today was tough. What's on your mind?"

---

## System-Wide Conventions Established by This PRD

### Convention 1: Embedded Smart Notepad Component

Any feature needing a text-heavy input surface can embed a Smart Notepad mini-component with the same routing capabilities as the full Smart Notepad drawer.

**How it works:**
- The embedded component renders as a textarea with the same save/route options as a Notepad tab
- On save, content creates a `notepad_tabs` record with appropriate `source_type` and context metadata (e.g., the rhythm section, the reflection question, the feature context)
- Auto-routing: when the feature context makes the destination obvious (e.g., reflection answer → Journal), the content auto-routes without user decision
- Manual routing: when the content could go multiple places, the user gets the same "Send to..." routing options as Smart Notepad
- The question/prompt that prompted the input is preserved as context metadata on the routed content

**Where this convention applies (current and future):**
- Rhythm sections: Brain Dump, Tomorrow Prep freeform, Intention Setting
- Reflection answers (though these use `reflection_responses` table directly, not notepad_tabs)
- Any future feature that needs text capture with routing

> **Forward note:** This convention should be evaluated during the pre-build audit. The key question is whether the embedded component should always create `notepad_tabs` records or whether some features (like reflection answers) should write directly to their own tables. The current design has reflection answers writing to `reflection_responses` + auto-creating `journal_entries`, while Brain Dump writes to `notepad_tabs`. This is intentional — reflections have their own data model; brain dumps are generic capture.

### Convention 2: Feature Tooltip Descriptions with LiLa Contextual Help

Every feature, section type, setting, and toggle in the app should have:
1. A brief hover/tap tooltip description (1-2 sentences)
2. A "What's this?" link that opens LiLa in contextual help mode

**Implementation:**
- Tooltips use the PRD-03 Tooltip component with an appended "What's this?" link
- The link passes a `feature_key` to LiLa's context injection
- LiLa explains the feature conversationally, tailored to the user's role
- No standalone glossary page exists — all help is LiLa-powered

> **Depends on:** PRD-03 Tooltip component — needs enhancement to include "What's this?" link support. PRD-05 LiLa context assembly — needs a `contextual_help` context injection pattern.

### Convention 3: Journal Tag-Based Filtering

The Journal is one unified surface with tag-based filtering replacing the sub-page architecture from PRD-08.

**How it works:**
- All entries live in `journal_entries` with a `tags` TEXT[] array
- Viewing "Reflections" = Journal filtered to `reflection` tag
- Viewing "Gratitude" = Journal filtered to `gratitude` tag
- An entry tagged `['reflection', 'gratitude']` appears in both views
- Export: user selects one or more tags, system aggregates matching entries, deduplicates, sorts by date
- `entry_type` preserved as source indicator (how the entry was created), not content filter

**Two tag categories:**
- **System tags** (platform-defined, auto-applied by category): `reflection`, `gratitude`, `growth`, `identity`, `relationships`, `curiosity`, `commonplace`, `kids`, `brain_dump`, etc. These power the built-in filtered views.
- **Custom tags** (user-created, freeform): family member names (`avigaile`, `jake`, `ruthie`), topics (`homeschool`, `marriage`, `health`, `finances`), projects, seasons of life — anything the user wants to track and later filter or export by. Autocomplete suggests previously used custom tags as the user types.

**Custom tag use case:** A mom who tags journal entries, reflections, and victories with a child's name can later export a complete journal of everything related to that child — reflections about them, victories involving them, notes from meetings about them — all in one date-sorted document. This is powerful for homeschool portfolios, IEP documentation, or simply building a keepsake record of each child's journey.

**LiLa smart-tagging:** When a reflection answer or journal entry mentions a family member by name, LiLa auto-suggests tagging with that member's name (same smart-tagging pattern as `life_area_tags` auto-application). The user can accept or dismiss the suggestion.

> **Cross-PRD impact:** This changes PRD-08's Journal architecture. See Cross-PRD Impact Addendum.

---

## Edge Cases

### Member with No Guiding Stars
- Guiding Star Rotation section auto-hides. No empty state shown — the section simply doesn't render. When the member creates their first Guiding Star, the section appears automatically.

### Member with No Best Intentions
- Best Intentions Focus section auto-hides. Same pattern.

### Member with No Scripture/Quote Entries
- "From Your Library" section in Evening Rhythm auto-hides. Section only renders if user has `guiding_stars` entries with `entry_type = 'scripture_quote'`.

### No Tasks for Today
- Task Preview section shows a warm empty state: "Nothing scheduled yet. Enjoy the open space, or add something if inspiration strikes."

### All Reflection Questions Answered
- If user has answered all active prompts today (unlikely with 32+ prompts), the Reflections section in Evening Rhythm shows: "You've reflected on everything today. That's wonderful." The Reflections page shows all answered questions with their responses.

### Evening Rhythm After Midnight
- If a member opens the app after midnight but hasn't done their evening rhythm, the system checks: was the evening rhythm completed for the previous day? If not, offer it with "Looks like yesterday's evening rhythm is still waiting. Want to do it now?" The completion records against the previous day's date.

### Large Families — Many Rhythm Configs
- 9 kids × 5 rhythm types = 45 `rhythm_configs` rows minimum. Performance impact is negligible (small JSONB records). Mom's Rhythms Settings page shows member picker for efficient navigation.

### Custom Rhythm Soft Limit
- 20 custom rhythms per member. If a user hits the limit, the [+ Create Custom Rhythm] button is replaced with a message: "You've reached the maximum of 20 custom rhythms. Archive one to create a new one."

### Teen Rhythm Request Rejected
- When mom declines a teen's rhythm request, the teen receives a notification with mom's optional note. The configured rhythm is not activated. The teen can modify and re-request.

### Rhythm Time Overlap
- If morning and evening rhythm hours overlap (e.g., wake time 6 AM, evening time 5 PM, user opens app at 5:30 PM and hasn't done either), prioritize the one that hasn't been done: show morning rhythm first, then evening. In practice, this is rare.

### Offline / PWA
- Rhythm modal structure renders offline (CSS/JS). Section data may show stale indicators. Completion tracking queues locally and syncs when online.
- Full offline spec deferred to Offline/PWA PRD.

---

## Tier Gating

All rhythm features are available to all users during beta. Feature keys wired from day one.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `rhythms_basic` | Morning and Evening rhythms with default templates | Essential |
| `rhythms_periodic` | Weekly, Monthly, and Quarterly rhythms | Enhanced |
| `rhythms_custom` | Custom rhythm creation and Studio template activation | Enhanced |
| `reflections_basic` | Reflections page with 32 default prompts | Essential |
| `reflections_custom` | Custom prompt creation and management | Enhanced |
| `reflections_export` | Export filtered reflection history as document | Full Magic |
| `rhythm_dynamic_prompts` | LiLa-generated contextual reflection prompts | Full Magic |

> **Tier rationale:** Basic morning/evening rhythms and reflections are Essential because the daily practice of intentional check-ins and reflection is foundational to the platform's mission. Custom creation, periodic rhythms, and AI-generated prompts are upgrade incentives. Export is Full Magic because it serves the power-user/homeschool-compliance audience.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Studio rhythm template library (browsing, preview, activation) | Studio page template browsing experience | PRD-09B (Lists, Studio & Templates) or dedicated Studio PRD |
| Rhythm completion indicators on Mom's Overview | Aggregated family progress display | PRD-14C (Family Overview) |
| Tooltip + "What's this?" → LiLa help pattern implementation | Every feature in the app | All future PRDs + PRD-03 update + PRD-05 update |
| Custom Tracker Prompts section rendering | Widget evening check-in configuration | PRD-10 (Widgets) enhancement |
| Reports page link from Monthly Review | Reports page | Future Reports PRD |
| Reflection export as formatted document | Export engine | Future Export/Reports PRD |
| DailyCelebration handoff from Evening Rhythm time trigger | DailyCelebration rendering | PRD-25 (Guided Dashboard) + PRD-26 (Play Dashboard) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Morning Rhythm / Evening Review integration points for Guiding Stars | PRD-06 Screen 4 | Guiding Star Rotation and Best Intentions Focus section types consume the data contracts defined in PRD-06 Screen 4 |
| Morning Rhythm / Evening Review integration points for Best Intentions | PRD-06 Screen 4 | Intention Check-in section type reads `intention_iterations` per the PRD-06 contract |
| Evening Rhythm integration — today's victories shown in review | PRD-11 (MVP When Dependency Ready) | Accomplishments & Victories section reads from `victories` table |
| Morning/Evening rhythm incoming flow from Smart Notepad | PRD-08 Flows | Brain Dump section creates `notepad_tabs` with `source_type = 'rhythm_capture'` |
| Reflections sub-page deferred from PRD-08 | PRD-08 Decision #14 | Reflections page fully designed here. Journal Reflections sub-page replaced by tag-based filtered view. |
| LifeLantern rotation through daily rhythm features | PRD-12A Stubs | LifeLantern Check-in section type reads staleness from `life_lantern_areas` |
| Rhythm completion awareness on family overview | PRD-14C stub | Completion indicators surfaced via `rhythm_completions` query |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `rhythm_configs`, `rhythm_completions`, `reflection_prompts`, `reflection_responses` tables created with RLS policies
- [ ] `tags` column added to `journal_entries` with GIN index
- [ ] 32 default reflection prompts seeded on family creation
- [ ] Default rhythm configs seeded per member on family member creation (Morning, Evening, Weekly active; Monthly, Quarterly available but off)
- [ ] Morning Rhythm: auto-open modal on first dashboard visit during morning hours, all 6 default sections rendering
- [ ] Evening Rhythm: auto-open modal during evening hours, 13-section fixed sequence with toggleable sections
- [ ] Breathing glow on rhythm dashboard cards when rhythm is pending
- [ ] Snooze/dismiss/complete behavior on all rhythms
- [ ] Rhythm completion tracking with period-based deduplication
- [ ] Reflections page: Today tab with inline answer textareas, Past tab with date-grouped history, Manage tab with prompt CRUD
- [ ] Reflection answers auto-route to `journal_entries` with category-based tags
- [ ] Evening Rhythm pulls 3 inline reflection questions with date-seeded rotation
- [ ] Shared `reflection_responses` between Reflections page and Evening Rhythm
- [ ] Weekly Review inline card in Morning Rhythm on configured day
- [ ] Monthly Review and Quarterly Inventory available but off by default
- [ ] Rhythms Settings page with member picker, section toggles, timing configuration
- [ ] Guided/Play members get DailyCelebration at evening rhythm time (handoff to PRD-11)
- [ ] Per-role default templates applied on member creation
- [ ] RLS: members see own rhythms/reflections. Mom sees all family. Dad's reflections private.
- [ ] All styling uses semantic tokens. Lucide icons only.
- [ ] Activity log triggers on rhythm_completions INSERT and reflection_responses INSERT

### MVP When Dependency Is Ready
- [ ] LiLa dynamic reflection prompts blended with static (requires PRD-05 day-data context assembly enhancement)
- [ ] Custom Tracker Prompts section wired to PRD-10 evening widget configs (requires PRD-10 evening check-in feature)
- [ ] Studio rhythm template browsing and activation (requires Studio page from PRD-09B or dedicated Studio PRD)
- [ ] Teen rhythm request flow through Universal Queue Modal (requires PRD-17 request processing)
- [ ] Rhythm completion indicators on Mom's Overview (requires PRD-14C)
- [ ] Carry Forward section wired to task status updates (requires PRD-09A task triage API)
- [ ] Mood triage values available to LiLa context assembly (requires PRD-05 context enhancement)
- [ ] Reflection answer "Flag as Victory" routing (requires PRD-11 victory creation API)
- [ ] LifeLantern Check-in section staleness calculation (requires PRD-12A area tracking)
- [ ] Completed Meetings section (requires PRD-16 meeting data)
- [ ] Before You Close the Day reminders (requires cross-feature pending item aggregation)

### Post-MVP
- [ ] Reflection export as formatted document (filtered by tags, date range)
- [ ] LiLa-powered "What's this?" contextual help on all features (system-wide rollout)
- [ ] Premium reflection prompt packs (themed collections: Spiritual Growth, Marriage Enrichment, Parenting Reflection, etc.)
- [ ] Reflection sharing: opt-in per answer to share specific reflections on Family Hub
- [ ] Rhythm analytics: track completion patterns, most-engaged sections, reflection frequency
- [ ] Sabbath/Renewal and other Studio rhythm templates (initial 7-10 library)
- [ ] Voice-to-text for reflection answers
- [ ] Morning/Evening dashboard layouts (PRD-14 post-MVP: saved layout profiles that auto-switch by time of day)
- [ ] Renewal Dimension Rotation section type with customizable dimensions
- [ ] Children & Youth Program Check-in template
- [ ] Push notifications for rhythm reminders (optional, off by default, per-rhythm)

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: Rhythms use auto-open modal delivery. First dashboard visit during rhythm hours → modal auto-opens. One auto-open per period. After dismiss, collapses to breathing glow card.
- [ ] Convention: Evening Rhythm has a FIXED section sequence (toggle on/off only, no reorder). All other rhythms are fully reorderable.
- [ ] Convention: Guided/Play children get DailyCelebration (PRD-11) at evening rhythm time, NOT the adult evening rhythm.
- [ ] Convention: Reflection answers auto-route to `journal_entries` with `entry_type = 'reflection'` and category-based `tags` array. One record, multiple filtered views.
- [ ] Convention: Journal uses `tags` TEXT[] for content categorization and filtered views. `entry_type` is preserved as source indicator only. Tag-based filtering replaces sub-page architecture. Two tag types: **system tags** (platform-defined, auto-applied: reflection, gratitude, growth, etc.) and **custom tags** (user-created freeform: family member names, topics, projects). LiLa auto-suggests member name tags when content mentions family members.
- [ ] Convention: Reflection prompt rotation uses date-seeded PRNG for deterministic daily selection. Prioritizes unanswered over already-answered.
- [ ] Convention: **System-wide embedded Smart Notepad convention** — any feature needing text-heavy input can embed a Smart Notepad mini-component with full routing capabilities. Content auto-routes when destination is obvious; manual routing when ambiguous.
- [ ] Convention: **System-wide tooltip + "What's this?" → LiLa contextual help** — every feature, section, setting, and toggle should have a tooltip description with a "What's this?" link that opens LiLa to explain the feature conversationally. No standalone glossary page.
- [ ] Convention: Rhythm configs use `sections` JSONB with `section_type` TEXT keys mapping to rendering components. New section types require only a new component, not a migration.
- [ ] Convention: `rhythm_completions` uses period-based tracking: 'YYYY-MM-DD' for daily, 'YYYY-W##' for weekly, 'YYYY-MM' for monthly, 'YYYY-Q#' for quarterly.
- [ ] Convention: Carry Forward section available but OFF by default in Evening Rhythm. Victory Recorder philosophy: never show what wasn't done in the default experience.
- [ ] Convention: Teen rhythm requests flow through Studio Queue with `source = 'rhythm_request'` to mom's Requests tab.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `rhythm_configs`, `rhythm_completions`, `reflection_prompts`, `reflection_responses`
Tables modified: `journal_entries` — added `tags` TEXT[] column with GIN index
Enums updated: `studio_queue.source` adds 'rhythm_request'. `journal_entries.source` adds 'reflection_prompt'. `victories.source` adds 'reflection_routed'.
Triggers added: `set_updated_at` on `rhythm_configs`, `reflection_prompts`. Activity log triggers on `rhythm_completions` INSERT, `reflection_responses` INSERT.

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **3 active defaults (Morning, Evening, Weekly Review), 2 available-but-off (Monthly, Quarterly)** | Morning and Evening are the daily heartbeat. Weekly Review bridges daily awareness and deeper planning. Monthly/Quarterly are specialized — available for users who want them, not imposed on everyone. Buffet principle. |
| 2 | **Sunday Reflection / Sabbath is a Studio template, not a default rhythm** | Different users have different Sabbath observances. Making it a template respects religious diversity while providing well-crafted starting points. |
| 3 | **Renewal Dimension Rotation is a section type in the library, not a default rhythm section** | The 4-week physical/spiritual/mental/social rotation is a specific practice pattern that belongs as an opt-in section type, not assumed for all users. Works well as part of a Sabbath/renewal Studio template. |
| 4 | **Evening Rhythm has fixed section sequence (toggle on/off only, no reorder)** | The evening rhythm has a deliberate narrative arc: celebrate → plan → reflect → close. Reordering would break that flow. Intentional exception to the general reorderable pattern. |
| 5 | **Carry Forward section available but OFF by default in Evening Rhythm** | Victory Recorder philosophy: never show what wasn't done in the default experience. Users who want evening task triage can enable it. Proactive task decisions ≠ shame. |
| 6 | **32 default reflection prompts across 6 categories** | Comprehensive library covering gratitude, growth, identity, relationships, curiosity, and kids. Enough variety for weeks of non-repeating rotation. All archivable, all editable. |
| 7 | **Gentle auto-open modal delivery (Option B)** | First dashboard visit during rhythm hours → modal auto-opens. Dismissible immediately. Collapses to breathing glow card for re-entry. Matches StewardShip's proven Reveille pattern. |
| 8 | **Reflections page is a standalone page with 3 tabs (Today, Past, Manage)** | Gives reflection its own dedicated home beyond the Evening Rhythm's lightweight inline experience. Same data, different levels of engagement. |
| 9 | **Reflection answers auto-route to Journal with category-based tags** | One record in `journal_entries` with tags derived from prompt category. Appears in all relevant filtered views (Reflections, Gratitude, Growth, etc.) without duplication. Single-source-of-truth principle. |
| 10 | **Journal uses tag-based filtering instead of sub-page architecture** | One unified Journal with `tags` TEXT[] array. Filtering by tag replaces separate sub-pages. An entry with multiple tags appears in multiple views. Export supports multi-tag selection with deduplication. Cross-PRD impact on PRD-08. |
| 11 | **Routing available from Reflections page, NOT from Evening Rhythm inline answers** | Keeps the evening flow lightweight — answer and move on. The Reflections page is the full management interface for routing answers to Victory, LifeLantern, etc. |
| 12 | **System-wide embedded Smart Notepad convention** | Any feature needing text-heavy input can embed a Smart Notepad mini-component. Auto-routes when destination is obvious; manual routing when ambiguous. Established as platform-wide pattern. |
| 13 | **System-wide tooltip + LiLa contextual help convention** | No standalone glossary page (protects IP from scraping). "What's this?" links open LiLa to explain features conversationally, tailored to user's role. Established as platform-wide pattern. |
| 14 | **Task preview in morning rhythm uses static snapshot of current dashboard view** | No carousel in the rhythm card — that's what the dashboard itself is for. The rhythm shows "here's your top stuff today." Can change later if needed. |
| 15 | **Teen rhythm request flow: configure → request → mom approves/edits** | Teens browse Studio templates, customize, send configured rhythm to mom's Requests tab. Mom can approve as-is, edit, or decline with a note. Respects teen autonomy while maintaining mom oversight. |
| 16 | **7-10 Studio rhythm templates planned** | Sabbath/Renewal, Priority Reevaluation, Goal Evaluation, Children & Youth Program Check-in, Marriage Check-in, Homeschool Week Review, Semester Review, Medication/Health Check, Mid-Day Reset, Bedtime Prayer. Post-MVP content. |
| 17 | **Reflection answers visible to mom via View As for teens (standard PRD-02 visibility)** | No special per-answer sharing mechanism. Mom sees teen reflections through existing View As. Teen sees TransparencyIndicator. Dad's reflections private (his content is his). |
| 18 | **Weekly Review absorbs the Friday Overview concept** | Same thing, configurable day (default Friday). One of the 3 active defaults. |
| 19 | **Custom tags supported alongside system tags on journal entries** | Users can tag entries with family member names, topics, projects, or any freeform text. Enables powerful filtered exports — e.g., "everything related to Avigaile" as a date-sorted journal. LiLa auto-suggests member name tags when content mentions family members. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Studio rhythm template content (7-10 templates) | Post-MVP content sprint. Architecture supports activation from day one. |
| 2 | LiLa dynamic reflection prompts | MVP When Dependency Ready — requires PRD-05 day-data context assembly enhancement |
| 3 | Reflection export as formatted document | Post-MVP — requires export engine |
| 4 | Premium reflection prompt packs | Post-MVP content + tier gating |
| 5 | Push notifications for rhythm reminders | Post-MVP enhancement. Off by default, configurable per-rhythm. |
| 6 | Reflection sharing on Family Hub | Post-MVP — opt-in per answer, requires PRD-14D |
| 7 | Renewal Dimension Rotation section type | Post-MVP — available as section type, implemented with Studio templates |
| 8 | Voice-to-text for reflection answers | Post-MVP — requires voice input infrastructure |
| 9 | Rhythm analytics (completion patterns, engagement) | Post-MVP analytics feature |
| 10 | Tooltip + LiLa help system-wide rollout | Established as convention; each feature PRD implements. PRD-03 and PRD-05 need updates. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-08 (Journal + Smart Notepad) | Journal architecture changes from sub-pages per entry type to tag-based filtered views. `tags` TEXT[] column added to `journal_entries`. Reflections sub-page deferred in PRD-08 is now fully designed here. | Update PRD-08 to note tag-based filtering replaces sub-page architecture. Add `tags` column to schema. Update Reflections deferred note to point to PRD-18. |
| PRD-06 (Guiding Stars & Best Intentions) | Screen 4 morning/evening integration stubs now wired. Guiding Star Rotation and Best Intentions Focus section types consume the data contracts. | Verify PRD-06 Screen 4 contracts are consumed correctly. No schema changes. |
| PRD-11 (Victory Recorder) | Evening Rhythm integration wired — Accomplishments & Victories section reads from `victories` table. Reflection answers can be flagged as victories with `source = 'reflection_routed'`. | Add 'reflection_routed' to `victories.source` enum. Update MVP When Dependency Ready to point to PRD-18. |
| PRD-12A (LifeLantern) | LifeLantern Check-in section type reads staleness from `life_lantern_areas`. Quarterly Inventory rhythm links to LifeLantern Hub. | Verify staleness calculation query. No schema changes. |
| PRD-14 (Personal Dashboard) | Rhythm cards render as auto-inserting dashboard sections. Greeting header coexists with rhythm card (rhythm is a separate section, not part of greeting). | Note that rhythm sections auto-insert at top of section list when due. Dashboard edit mode should not allow hiding rhythm sections (they auto-manage). |
| PRD-16 (Meetings) | Weekly Review deep dive links to Weekly Review meeting type. Monthly Review links to Monthly Review meeting. Completed Meetings section in Evening Rhythm reads meeting data. | Verify meeting type keys match. No schema changes. |
| PRD-03 (Design System) | Tooltip component needs "What's this?" link support. Breathing glow animation token should be documented for rhythm card usage. | Add tooltip enhancement to PRD-03. Document breathing glow token. |
| PRD-05 (LiLa Core) | New context injection pattern: `contextual_help` for "What's this?" links. Mood triage values as context source. Dynamic reflection prompt generation capability. | Add contextual_help pattern to LiLa context assembly. Add mood_triage to available context sources. |
| PRD-04 (Shell Routing) | Reflections page added to sidebar navigation. Rhythms Settings page added to sidebar navigation. | Add both routes to shell navigation definitions. |
| PRD-09B (Lists, Studio & Templates) | Rhythm templates are a new template category in the Studio. | Note rhythm template category when writing Studio page experience. |
| PRD-14C (Family Overview) | Rhythm completion indicators surface on Mom's Overview. | Consume `rhythm_completions` data in overview display. |
| PRD-17 (Universal Queue) | Teen rhythm requests use `source = 'rhythm_request'` in Studio Queue. | Add to source enum. |

---

*End of PRD-18*
