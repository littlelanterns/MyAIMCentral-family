# Backburner Feature Addendum

**Status:** Approved — Ready for Pre-Build Audit Reconciliation
**Created:** March 15, 2026
**Touches:** PRD-04, PRD-08, PRD-09B, PRD-17, PRD-18

---

## Overview

The Backburner is a system-provided list that every family member receives automatically. It serves as the universal parking lot for "not now, but not never" items — ideas, goals, tasks, projects, and intentions that aren't actionable today but shouldn't be lost.

The Backburner solves a problem every mom knows: the mental graveyard of good ideas that die because there's no structured place to put them and no structured time to revisit them. Without a Backburner, items either clutter active task lists (creating overwhelm) or vanish from memory entirely (creating regret). The Backburner sits between those extremes — a warm, low-pressure space where ideas rest until mom is ready for them.

> **Mom experience goal:** "I had this great idea for a family tradition but I can't act on it right now. I don't want to forget it, and I don't want it sitting in my task list making me feel behind. I just want to put it somewhere safe and know that something will remind me to look at it later."

> **Design philosophy:** The Backburner is a *list* with *intelligence*. It looks and behaves like a familiar list (browse, scroll, tap), but AI auto-categorizes incoming items into meaningful sections so the review experience feels organized without mom doing the organizing. The monthly review rhythm provides the forcing function that prevents the Backburner from becoming its own ideas graveyard.

---

## User Stories

### Capture
- As a mom, I want to send items to my Backburner from anywhere in the app so I never lose a "not now" idea.
- As a mom, I want a Backburner button in my QuickTasks strip so I can capture a thought in two taps without opening any other feature.
- As a mom, I want LiLa to suggest "Send to Backburner?" during Smart Notepad processing when an item clearly isn't actionable this week.

### Organization
- As a mom, I want my Backburner items auto-sorted into meaningful sections so I can scan by category without filing things manually.
- As a mom, I want to drag items between sections if the AI categorized something wrong.
- As a mom, I want sections to appear and disappear dynamically based on what's actually in my Backburner so it never feels like an empty filing cabinet.

### Review & Activation
- As a mom, I want to browse my Backburner anytime from my Lists page.
- As a mom, I want my monthly review to include a Backburner check-in so I'm periodically reminded to decide on things I've been sitting on.
- As a mom, I want one-tap actions to activate a Backburner item — turning it into a task, a Best Intention, a Guiding Star, or routing it to the Studio Queue — without copying and re-entering information.
- As a mom, I want to release items from my Backburner without guilt — letting go should feel like clarity, not failure.

### Visibility
- As a teen (Independent), I want my own Backburner for ideas I'm not ready to act on yet.
- As a dad, I want my own Backburner that works the same as mom's.

---

## Feature Specification

### System List Behavior

The Backburner is a special instance of the `lists` table (PRD-09B) with `list_type = 'backburner'`. It is auto-created for every family member during account setup (PRD-01) alongside other system defaults. It cannot be deleted, renamed, or duplicated. There is exactly one Backburner per member.

Because it uses the existing `lists` / `list_items` schema, the Backburner inherits all standard list behaviors: item ordering, notes, the `sort_order` field, and RLS policies. No new tables are required.

### AI Auto-Categorization

When an item arrives in the Backburner (from any entry point), LiLa assigns it to one of the following broad sections by analyzing the item text and its routing origin:

| Section | What It Catches | Activation Path |
|---------|----------------|-----------------|
| Goals & Growth | Guiding Stars ideas, Best Intentions drafts, LifeLantern aspirations, personal development items | → Activate as Guiding Star, Best Intention, or LifeLantern goal |
| Projects & Plans | Big project ideas, Studio Queue candidates, multi-step plans, business ideas | → Send to Studio Queue for planning |
| Tasks & To-Dos | Specific actionable items that aren't time-sensitive yet | → Create Task (opens Task Creation Modal) |
| Ideas & Inspiration | Creative sparks, things to research, articles to read, recipes to try, traditions to start | → Route via RoutingStrip (flexible destination) |
| Family & Relationships | Family activity ideas, date night concepts, gift ideas, conversation topics, relationship goals | → Route via RoutingStrip (flexible destination) |
| Unsorted | Items where AI classification confidence is low | → Mom manually moves to correct section, or routes directly |

> **Decision rationale:** Six broad sections rather than mirroring every system tool. This keeps the visual clean while covering the full range of "not now" items. The activation path per section provides contextual quick-actions that make sense for the category.

**Section behavior:**
- Sections are **dynamic** — a section only appears when at least one item exists in it. When the last item in a section is removed (activated, released, or moved), the section disappears.
- **Unsorted always appears at top** when it has items, providing a gentle nudge to classify or act on uncertain items.
- AI categorization uses the item's text content plus its `source` metadata (e.g., an item routed from a meeting action item is more likely "Tasks & To-Dos"; an item from LifeLantern context is more likely "Goals & Growth").
- Categorization is stored in the `section_name` field on `list_items` (existing PRD-09B column). Mom can drag-and-drop items between sections to override AI classification.

### Entry Points (How Items Get to the Backburner)

| Entry Point | Mechanism | PRD Affected |
|-------------|-----------|-------------|
| **QuickTasks strip** | "Backburner" button added to default QuickTasks set. Tapping opens a minimal capture modal: text field + [Save]. AI auto-categorizes on save. | PRD-04, PRD-17 |
| **RoutingStrip** | "Backburner" added as a routing destination tile (Lucide icon: `Flame` or `Archive`, label: "Backburner"). Available in all RoutingStrip contexts. Routes item directly to Backburner with source metadata preserved. | PRD-17 |
| **Smart Notepad processing** | During Review & Route or LiLa-assisted processing, LiLa may suggest "This sounds like something for later. Send to Backburner?" as a routing suggestion. User confirms with one tap. | PRD-08 |
| **Studio Queue / Sort tab** | When processing Sort tab items, "Backburner" appears as a dismiss-alternative — "Not ready to configure this? Send it to your Backburner instead of dismissing it." | PRD-17 |
| **Manual add** | From the Backburner list view itself, a [+ Add] button allows direct item creation with optional section selection. | PRD-09B |
| **Any feature with routing** | Anywhere the RoutingStrip appears, Backburner is an option. This includes meeting action item routing (PRD-16), request acceptance routing (PRD-15), and any future routing contexts. | Multiple |

### Backburner List View (Browsable Anytime)

The Backburner appears in the Lists page (PRD-09B, Screen 2) alongside other lists. It has a distinct system icon (lantern dimmed / flame icon) and is always pinned at the top of the list page, above user-created lists.

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│  Backburner                                        [+ Add]   │
│  14 items · 3 sections                                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ▾ UNSORTED (2)                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ○ That co-op thing Sarah mentioned        ···  3 weeks  │ │
│  │ ○ Research homeschool conventions nearby   ···  1 week   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ▾ GOALS & GROWTH (5)                                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ○ Start a gratitude practice with kids     ···  2 months │ │
│  │ ○ Learn about Enneagram for parenting      ···  6 weeks  │ │
│  │ ○ Create a family mission statement        ···  3 weeks  │ │
│  │ ○ Read "The Whole-Brain Child"             ···  2 weeks  │ │
│  │ ○ Set up a weekly planning rhythm          ···  1 week   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ▾ IDEAS & INSPIRATION (4)                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ○ Family movie night rating system         ···  1 month  │ │
│  │ ○ Birthday interview tradition             ···  3 weeks  │ │
│  │ ○ Seasonal nature journal project          ···  2 weeks  │ │
│  │ ○ Try that lemon pasta recipe              ···  3 days   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ▸ TASKS & TO-DOS (3) — collapsed                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Item display:**
- Item name (text)
- Age indicator — relative time since the item was added ("3 days", "2 weeks", "2 months")
- `···` overflow menu per item: Activate, Move to Section, Edit, Release

> **Design note — Age as warmth metaphor:** Age indicators use warm-to-cool visual styling that fits the lantern brand. Recent items have warm text color (standard). Items older than 1 month shift to a slightly muted tone. Items older than 3 months use the most muted tone. This gives mom an at-a-glance sense of what's been sitting without being judgmental. Exact color tokens to be determined during build using PRD-03 semantic tokens.

**Interactions:**
- Tap item → expands inline to show notes (if any), source breadcrumb ("From: Meeting with Jake, March 2"), and action buttons
- **Action buttons per item** (contextual based on section):

| Section | Primary Action | Secondary Actions |
|---------|---------------|-------------------|
| Goals & Growth | Activate as Best Intention | Guiding Star · LifeLantern Goal · Studio Queue · Release |
| Projects & Plans | Send to Studio Queue | Create Task · Release |
| Tasks & To-Dos | Create Task | Calendar · Studio Queue · Release |
| Ideas & Inspiration | Route (opens RoutingStrip) | Release |
| Family & Relationships | Route (opens RoutingStrip) | Release |
| Unsorted | Route (opens RoutingStrip) | Move to Section · Release |

- **Release** removes the item from the Backburner entirely. A brief confirmation: "Let this one go?" with [Release] and [Keep]. On release, a small toast: "Released — that's clarity, not failure." (Victory Recorder philosophy applied.)
- **Drag-and-drop** between sections to re-categorize.
- **Collapse/expand** sections by tapping the section header.

### Source Breadcrumb

When an item arrives via routing (not manual add), the system stores the origin in `list_items.notes` as structured metadata (or a dedicated field if the pre-build audit identifies a cleaner approach). The breadcrumb displays as a subtle line below the item name when expanded:

- "From: Smart Notepad, March 10"
- "From: Meeting with Jake, March 2"
- "From: QuickTasks capture"
- "From: Studio Queue sort"

This helps mom remember *why* she saved something when reviewing months later.

### Monthly Review Integration (PRD-18)

The Backburner check-in is added as a new section within the existing Monthly Review rhythm (PRD-18, Screen 5). It does not create a standalone rhythm — it's woven into the review mom is already doing.

**New section type added to PRD-18 Section Type Library:**

| # | Section Type | Description | Data Source | Available In |
|---|-------------|-------------|-------------|-------------|
| 27 | **Backburner Review** | Periodic review of parked items with keep/activate/release triage | `lists` where `list_type = 'backburner'` + `list_items` | Monthly, Quarterly, Custom |

**Monthly Review Backburner section flow:**

The Backburner Review section renders as a card within the Monthly Review rhythm, positioned after the Highlight Reel and before the Reports Link.

**Three-pass experience:**

1. **Quick Scan** — LiLa shows a summary: "You have 14 items on your Backburner — 5 in Goals & Growth, 4 in Ideas & Inspiration, 3 in Tasks & To-Dos, 2 Unsorted." If the Backburner is empty, the section shows a warm empty state: "Your Backburner is clear — nothing waiting in the wings."

2. **Triage** — LiLa highlights items worth reviewing, prioritizing:
   - Oldest items first (items that have been sitting 3+ months)
   - Unsorted items (need classification or decision)
   - Items that may be newly relevant based on current context (e.g., a "plan summer activities" item surfacing in May)
   
   Each highlighted item shows inline with three actions: **[Activate]** (routes to appropriate destination per section), **[Keep]** (item stays, resets the "reviewed" feeling), **[Release]** (removes with the release celebration).
   
   Mom can tap "That's enough for now" at any point to skip remaining items. The triage is not exhaustive — it's a curated selection, not a forced march through every item.

3. **Release Celebration** — If mom released any items during triage, a brief moment: "You released [N] items this month. That's [N] decisions made — well done." Framed as clarity and decisiveness, never as giving up. Consistent with Victory Recorder's celebration-only philosophy.

**Tracking:** The Backburner Review section completion is captured as part of the Monthly Review `rhythm_completions` record (not a separate record). The `completion_data` JSONB field includes `backburner_reviewed: true`, `items_activated: N`, `items_released: N`.

### QuickTasks Integration (PRD-04)

"Backburner" is added to the default QuickTasks button set.

**Updated default QuickTasks (mom, adjusts by shell):**
Add Task, Journal Entry, Mind Sweep, Log Victory, Family Calendar, Quick Note, **Backburner**

Because QuickTasks auto-sort by usage frequency, the Backburner button will naturally find its position based on how often mom uses it. If she rarely uses it, it scrolls off-screen. If she uses it daily, it moves to the front.

**Backburner QuickTask behavior:**
- Tap → opens a minimal capture modal (consistent with other QuickTask capture patterns):
  ```
  ┌────────────────────────────────┐
  │  Save to Backburner      [✕]  │
  ├────────────────────────────────┤
  │                                │
  │  [What's on your mind?      ]  │
  │                                │
  │  [Save]                        │
  └────────────────────────────────┘
  ```
- On save, AI auto-categorizes the item and deposits it into the Backburner list. Brief toast: "Saved to Backburner."
- No section picker on capture — the point is speed. AI sorts, mom corrects later if needed.

### RoutingStrip Integration (PRD-17)

Backburner is added to the RoutingStrip destination catalog:

| Destination | Lucide Icon | Label | What Happens on Tap |
|-------------|-------------|-------|-------------------|
| Backburner | `Flame` | Backburner | Creates `list_items` record in member's Backburner list with source metadata. AI auto-categorizes into section. Toast: "Saved to Backburner." |

**Context-filtered destination sets — Backburner added to:**

| Context | Change |
|---------|--------|
| Notepad "Send To" (PRD-08) | Add Backburner tile to grid |
| Meeting action item routing (PRD-16) | Add Backburner as alternative to Skip |
| Review & Route per-card routing (PRD-08) | Add Backburner tile to grid |
| Sort tab dismiss alternative (PRD-17) | "Send to Backburner" option alongside Dismiss |

> **Decision rationale:** Backburner is not added to the Request accept routing context (PRD-15) because accepted requests are inherently actionable — they came from another family member who is waiting for action. Backburnering a request would create a communication gap.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | Owns her Backburner. Can view (but not edit) children's Backburners. Cannot view Dad's. |
| Dad / Additional Adult | Full | Owns his Backburner. Cannot view others'. |
| Special Adult | None | Caregivers don't have persistent personal features. |
| Independent (Teen) | Full | Owns their Backburner. Mom can view. |
| Guided / Play | None | Too young for a "someday" parking lot. |

### Privacy
- Each member's Backburner is private by default.
- Mom's view of children's Backburners is read-only (she can see what's there, but can't activate, release, or reorganize items on their behalf).
- The Backburner is never shared as a collaborative list. Each member's is individual.

---

## Data Schema

No new tables. The Backburner uses existing PRD-09B schema:

### Existing Table: `lists`
- One record per member where `list_type = 'backburner'`
- `is_system = true` (new boolean column, or handled via `list_type` check — pre-build audit to determine cleanest approach)
- `is_shared = false` (always)
- Auto-created during family member setup (PRD-01)

### Existing Table: `list_items`
- `section_name` column stores the AI-assigned category ("goals_growth", "projects_plans", "tasks_todos", "ideas_inspiration", "family_relationships", "unsorted")
- `notes` column stores source breadcrumb metadata (structured as "source:feature_name|date:YYYY-MM-DD|context:optional detail")
- All other existing columns work as-is

### Enum/Type Updates
- Add `'backburner'` to the `list_type` config-driven type set (PRD-09B)

> **Decision rationale:** Using the existing `lists` / `list_items` schema avoids new tables and keeps the Backburner consistent with all list behaviors (RLS, sharing model, item structure). The `section_name` column was already designed for grouping headers — this is exactly its intended use.

---

## AI Integration

### Auto-Categorization

- **Model:** Haiku (fast, cheap — categorization is a simple classification task)
- **Trigger:** On item creation via any entry point
- **Input:** Item text + source metadata (which feature routed it, any contextual tags)
- **Output:** One of six `section_name` values
- **Confidence threshold:** If classification confidence is below 70%, assign to "unsorted" rather than guessing wrong
- **Cost:** Negligible — one Haiku call per item, estimated <100 items/month per family

> **Optimization note (per AI Cost Optimization Patterns doc):** If the Semantic Context Infrastructure (pgvector) is available at build time, auto-categorization could use embedding similarity against section exemplars instead of a Haiku call, reducing cost to near-zero. The addendum's Haiku approach works as a standalone fallback.

### Monthly Review Triage

- **Model:** Sonnet (needs contextual awareness to identify newly-relevant items)
- **Trigger:** When Backburner Review section renders in Monthly Review
- **Input:** All Backburner items + current month context (calendar, active goals, season)
- **Output:** Ordered list of 3-7 items to highlight for triage, with brief reason ("This has been here 4 months" or "Summer is coming — might be time for this one")
- **Cost:** One Sonnet call per monthly review, negligible

---

## Edge Cases

### Empty Backburner
- List view shows warm empty state: "Nothing on the back burner right now. When you have a 'not now, but not never' idea, send it here."
- Monthly Review section shows: "Your Backburner is clear — nothing waiting in the wings." Section is skippable.

### Very Full Backburner (50+ items)
- List view works normally with collapsible sections (sections become essential for navigation at this volume).
- Monthly Review triage highlights only 5-7 items, not the entire list. "You have 53 items — let's focus on the ones that stand out."

### Item Activated but Destination Feature Not Yet Built
- If a Backburner item's activation path leads to a feature that's still a stub (e.g., LifeLantern Goal before LifeLantern is built), the action button is disabled with a tooltip: "Coming soon."

### Duplicate Items
- No automated deduplication. Mom may intentionally have similar items from different contexts. If the monthly review triage notices near-duplicates, LiLa can mention it: "These two items look similar — want to combine them?"

### Member Deletion / Archival
- When a family member is archived, their Backburner is archived with them (standard list archival behavior per PRD-09B).

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `backburner_list` | Backburner system list, manual add, browsing, activation, release | Essential |
| `backburner_ai_sort` | AI auto-categorization of incoming items | Enhanced |
| `backburner_rhythm` | Backburner Review section in Monthly Review | Enhanced |

> **Tier rationale:** The Backburner as a simple parking lot list is Essential — it's a basic organizational tool. AI auto-categorization and rhythm integration are Enhanced because they add intelligence. All keys return true during beta.

---

## Stubs

### Stubs Created by This Addendum

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Backburner creation during family member setup | PRD-01 member creation flow | PRD-01 (add to setup sequence) |
| Backburner item count on Dashboard | Dashboard indicator showing "N items on your Backburner" | PRD-14 (widget or greeting integration) |

### Existing Stubs Wired by This Addendum

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| List type config extensibility | PRD-09B | New `backburner` list type added via config |
| RoutingStrip destination extensibility | PRD-17 | New Backburner destination tile added to catalog |
| Section Type Library extensibility | PRD-18 | New "Backburner Review" section type (#27) added |
| QuickTasks extensibility | PRD-04 | New "Backburner" button added to default set |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Backburner list auto-created for Mom, Dad, and Independent members on account setup
- [ ] Backburner appears pinned at top of Lists page with system icon
- [ ] Cannot be deleted, renamed, or duplicated
- [ ] Items display with collapsible dynamic sections and age indicators
- [ ] AI auto-categorization on item creation (Haiku call with unsorted fallback)
- [ ] Manual section reassignment via drag-and-drop
- [ ] Source breadcrumb stored and displayed on item expand
- [ ] Contextual activation actions per section (one-tap routing to appropriate destination)
- [ ] Release flow with confirmation and celebration toast
- [ ] QuickTasks "Backburner" button with minimal capture modal
- [ ] RoutingStrip "Backburner" tile in all applicable routing contexts
- [ ] Smart Notepad "Send to Backburner" suggestion during processing
- [ ] RLS: member-scoped, mom read-only on children's Backburners
- [ ] `useCanAccess('backburner_list')`, `useCanAccess('backburner_ai_sort')`, `useCanAccess('backburner_rhythm')` hooks wired (all true during beta)

### MVP When Dependency Is Ready
- [ ] Backburner Review section in Monthly Review rhythm (requires PRD-18 build)
- [ ] Monthly triage with Sonnet-powered relevance highlighting (requires PRD-18 build)
- [ ] Backburner item count on Personal Dashboard (requires PRD-14 widget)

### Post-MVP
- [ ] Embedding-based auto-categorization replacing Haiku calls (per Semantic Context Infrastructure Addendum)
- [ ] LiLa proactive suggestions: "You backburnered 'family mission statement' 3 months ago and you just created a Family Vision Quest — want to activate it?"
- [ ] Backburner trends in Reports: "You activated 8 items and released 12 this quarter"
- [ ] Teen Backburner coaching: LiLa helps teens review their own Backburner with age-appropriate prompts

---

## Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-01 (Auth & Family Setup) | Backburner list auto-creation added to member setup sequence. | Add `backburner` list creation to the system defaults seeded per member. |
| PRD-04 (Shell Routing & Layouts) | "Backburner" added to default QuickTasks button set. | Update QuickTasks default list. Add Backburner capture modal spec. |
| PRD-08 (Journal + Smart Notepad) | Backburner added as routing suggestion during Notepad processing. Backburner tile added to "Send To" RoutingStrip. | Update Send To grid destinations. Add LiLa suggestion pattern for backburner routing. |
| PRD-09B (Lists, Studio & Templates) | New `backburner` list type added to config-driven type set. Backburner pinned at top of Lists page. System list that cannot be deleted/renamed. | Add backburner to list type configs. Add system list pinning behavior. |
| PRD-17 (Universal Queue & Routing System) | Backburner added to RoutingStrip destination catalog. Added to Notepad, Meeting, and Review & Route routing contexts. "Send to Backburner" added as Sort tab dismiss alternative. | Update RoutingStrip destination table. Update context-filtered destination sets. |
| PRD-18 (Rhythms & Reflections) | New section type #27 "Backburner Review" added to Section Type Library. Monthly Review default sections updated to include Backburner Review. | Add section type. Update Monthly Review Screen 5 default sections. |

---

## CLAUDE.md Additions from This Addendum

- [ ] Convention: Backburner is a system-provided list (`list_type = 'backburner'`). One per member. Auto-created on setup. Cannot be deleted or renamed.
- [ ] Convention: Backburner uses the existing `lists` / `list_items` schema — no new tables. `section_name` stores AI-assigned category.
- [ ] Convention: Backburner sections are dynamic (appear/disappear based on content). Six categories: goals_growth, projects_plans, tasks_todos, ideas_inspiration, family_relationships, unsorted.
- [ ] Convention: AI auto-categorization uses Haiku with 70% confidence threshold. Below threshold → unsorted.
- [ ] Convention: Backburner is a RoutingStrip destination (Lucide icon: `Flame`, label: "Backburner"). Available in Notepad, Meeting, Review & Route, and Sort tab contexts. Not available in Request accept context.
- [ ] Convention: Release celebration follows Victory Recorder philosophy — letting go is framed as clarity and decisiveness, never failure.

---

## Decisions Made This Session

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Backburner as system list using existing schema** | No new tables needed. Uses proven `lists` / `list_items` pattern. Inherits RLS, sharing model, and all list behaviors. |
| 2 | **AI auto-categorization with dynamic sections** | Mom shouldn't have to file things manually — that's friction that kills adoption. But sections must be dynamic (not empty placeholders) to avoid feeling like an unused filing cabinet. |
| 3 | **Six broad categories, not per-tool mirroring** | Keeps visual clean. Per-tool sections (one for each feature) would create too many mostly-empty categories. Broad buckets with contextual activation paths give the same routing precision with less visual noise. |
| 4 | **Unsorted section for low-confidence items** | Preserves trust in AI categorization by never guessing wrong — uncertain items go to Unsorted where mom can classify them or act directly. |
| 5 | **Monthly Review integration, not standalone rhythm** | Moms won't schedule a separate "Backburner Review" event. But if it shows up as a section inside the monthly review they're already doing, friction drops to near zero. |
| 6 | **Release celebration** | Directly inspired by Belsky's "Monthly Backburner Ritual" — most items will be trash, some will be gold. Releasing trash should feel good, not guilty. Aligns with Victory Recorder's celebration-only philosophy. |
| 7 | **QuickTasks button for capture** | The Backburner is highest-value when capture is effortless. Two taps from any screen. Auto-sort by frequency means it stays prominent only for moms who use it. |
| 8 | **Not available in Request accept routing** | Requests come from family members who are waiting. Backburnering a request creates a communication gap — requests should be accepted, declined, or snoozed, not parked indefinitely. |

---

*End of Backburner Feature Addendum*
