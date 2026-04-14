# Opportunity-List Unification + Multi-List Image Import + Universal Assignee Filter

> **Status:** Spec for parallel session. Created 2026-04-14, updated with founder decisions.
> **Origin:** Founder session identifying gaps between opportunity tasks and list infrastructure.

---

## The Core Insight

Most opportunities will be organized as lists. The list IS the opportunity board. Instead of creating individual opportunity tasks, mom creates a list (e.g., "Extra Jobs for Money"), flags it as an opportunity, and the list mechanics handle everything: kids browse items, claim them ("I'll do this!"), claimed items appear as tasks on their dashboard with reward info.

The randomizer list already proves the pattern — a list item becomes a de facto task via the draw mechanic. Opportunity lists generalize this: a list item becomes a de facto task via the claim mechanic.

---

## Founder Decisions (Locked 2026-04-14)

1. **`is_opportunity` flag** on any list type (not a new `list_type`) — a randomizer, checklist, or custom list can all be opportunities
2. **Browse first, commit when ready** — kid taps "I'll do this!" which claims + creates the task
3. **Multi-list import suggests new lists AND sorts into existing**
4. **Randomizer reveal mode configurable per list** (same as existing `draw_mode`)
5. **Per-item rewards optional** with list-level default

---

## What Already Exists (Build J Infrastructure on list_items)

Build J added the FULL advancement/mastery/practice infrastructure to `list_items`:
- `advancement_mode` ('complete' | 'practice_count' | 'mastery')
- `practice_target`, `practice_count`, `mastery_status`, `mastery_submitted_at`
- `mastery_approved_by`, `mastery_approved_at`
- `require_mastery_approval`, `require_mastery_evidence`, `track_duration`

And on `lists`:
- `pool_mode` ('individual' | 'shared') — any/each pattern
- `eligible_members UUID[]` — who can see/claim from the list
- `draw_mode` ('focused' | 'buffet' | 'surprise') — randomizer modes
- `max_active_draws` — concurrent draw limit
- `default_advancement_mode`, `default_practice_target`, etc. — list-level defaults

Also existing:
- `list_items.reward_amount` — per-item reward (money amount)
- `list_items.is_repeatable` — whether item returns to pool after completion
- `list_items.max_instances` — lifetime cap on completions
- `list_items.completed_instances` — lifetime completion count
- `list_items.frequency_min/max`, `frequency_period`, `cooldown_hours` — recurrence caps
- `list_items.is_available` — whether item is in the active pool
- `task_claims` table — first-claim-wins, lock duration, auto-release
- `task_rewards` table — points, money, privilege, custom, hourly

**The mastery/practice infrastructure is ALREADY on list_items.** The main gap is the claim→task bridge and the `is_opportunity` flag.

---

## Gap 1: Opportunity Lists

### Schema Changes Needed

```sql
-- Flag any list as an opportunity board
ALTER TABLE lists ADD COLUMN is_opportunity BOOLEAN DEFAULT false;

-- Per-item opportunity metadata (extends existing list_items)
ALTER TABLE list_items ADD COLUMN opportunity_subtype TEXT
  CHECK (opportunity_subtype IN ('one_time', 'claimable', 'repeatable'));
-- one_time: one person claims it, done forever (painting trim)
-- claimable: one person at a time, lock duration, releases back to pool
-- repeatable: available weekly/monthly, multiple people can claim across periods

ALTER TABLE list_items ADD COLUMN reward_type TEXT
  CHECK (reward_type IN ('points', 'money', 'privilege', 'custom'));
-- reward_amount already exists on list_items

ALTER TABLE list_items ADD COLUMN claim_lock_duration INTEGER;
ALTER TABLE list_items ADD COLUMN claim_lock_unit TEXT
  CHECK (claim_lock_unit IN ('minutes', 'hours', 'days'));

-- List-level reward defaults
ALTER TABLE lists ADD COLUMN default_reward_type TEXT
  CHECK (default_reward_type IN ('points', 'money', 'privilege', 'custom'));
ALTER TABLE lists ADD COLUMN default_reward_amount DECIMAL(10,2);
ALTER TABLE lists ADD COLUMN default_opportunity_subtype TEXT
  CHECK (default_opportunity_subtype IN ('one_time', 'claimable', 'repeatable'));
ALTER TABLE lists ADD COLUMN default_claim_lock_duration INTEGER;
ALTER TABLE lists ADD COLUMN default_claim_lock_unit TEXT
  CHECK (default_claim_lock_unit IN ('minutes', 'hours', 'days'));

-- tasks.source gains 'opportunity_list_claim'
```

### Item Availability Patterns (Founder Examples)

| Scenario | opportunity_subtype | is_repeatable | max_instances | frequency | Example |
|----------|-------------------|---------------|---------------|-----------|---------|
| One-time, one person | `one_time` | false | 1 | — | Paint the trim |
| Weekly recurring, anyone can claim | `repeatable` | true | null | weekly | Clean out the van |
| Claimable with lock timer | `claimable` | false | 1 | — | Organize the garage |
| Skill mastery (multiple tries) | `repeatable` | true | null | — | Learn to change a tire |

### Mastery on Opportunity Items

For skills that take multiple tries (not sequential, but need practice):
- Set `advancement_mode='practice_count'` or `'mastery'` on the list item
- Kid claims the item → task spawns with practice/mastery mode
- Each completion logs to `practice_log` + increments `practice_count`
- At `practice_target`, either auto-completes (practice_count mode) or kid submits for mastery approval
- Mom approves → item marks mastered, potentially exits pool (`is_available=false`)

**This infrastructure already exists from Build J.** The only new thing is the claim→task bridge that carries the advancement mode forward.

### Any/Each Pattern (pool_mode)

Already exists on `lists.pool_mode`:
- **`'shared'`** — one pool, kids compete for claims. "Paint the trim" gets claimed by one person.
- **`'individual'`** — each assigned member gets their own iteration/copy of the list. Each kid works through their own progress independently.

When `pool_mode='individual'`: on assignment, the system creates `list_shares` records with `is_individual_copy=true` for each eligible member. Each member's completion tracking is independent via `list_item_member_tracking`.

### Claim → Task Bridge Flow

1. Kid browses opportunity list, sees available items with rewards
2. Kid taps "I'll do this!" on an item
3. System checks: is item available? (not claimed by someone else for `one_time`/`claimable`)
4. Creates `task_claims` record with lock duration (if claimable)
5. Creates `tasks` record:
   - `task_type` = the item's `opportunity_subtype` mapped to task types
   - `source` = `'opportunity_list_claim'`
   - `source_reference_id` = `list_item.id`
   - Carries forward: `advancement_mode`, `practice_target`, `require_mastery_approval`, `reward` info
6. Task appears on kid's dashboard
7. On completion: increments `list_items.completed_instances`, processes reward, releases claim
8. For `one_time`: sets `is_available=false` permanently
9. For `repeatable`: item stays available (respects cooldown/frequency rules)
10. For mastery items: follows the existing practice/mastery flow from Build J

### UI Changes

**List creation / editing:**
- Toggle: "This is an opportunity list" → reveals opportunity settings panel
- Per-item: opportunity subtype, reward type + amount, claim lock duration
- List-level defaults for all the above
- pool_mode selector (shared vs individual copies)

**Opportunity list detail view (kid-facing):**
- Browse mode: items with reward badges, availability status, "I'll do this!" button
- Claimed items show lock timer countdown
- Completed items show checkmark + earned reward
- Mastery items show practice progress

**Opportunities tab on Tasks page:**
- Renders opportunity-flagged lists as expandable cards
- Each card shows: list title, item count, total reward potential
- Expand to see items with claim buttons
- Also shows any standalone opportunity tasks (backward compat)

**Kid's dashboard:**
- Claimed items appear as normal tasks (because they ARE tasks)
- Gamification pipeline fires on completion (points, creatures, etc.)

### Build Phases

- **Phase 1: Schema + flag + list creation UI** — `is_opportunity` flag, opportunity metadata columns, list creation toggle + settings panel
- **Phase 2: Claim→task bridge** — kid claims → task spawns → dashboard shows. Claim lock mechanics.
- **Phase 3: Opportunities tab integration** — opportunity lists render in the Opportunities tab alongside standalone opportunities
- **Phase 4: Completion flow** — task complete → list item updated → reward processed → claim released → availability updated
- **Phase 5: Mastery flow** — practice logging, mastery submission, approval, pool exit on mastery

---

## Gap 2: Randomizer + Opportunity Hybrid

### The Scenario
"Outside Fun" list: not required (opportunity), has mystery reveal (randomizer), items from a book TOC.

### How It Works
1. Create list with `is_opportunity=true` + `draw_mode='surprise'` (or 'focused')
2. Items have `opportunity_subtype='repeatable'` + `reward_type='points'`
3. Randomizer draw selects today's activity (mystery tap or spinner)
4. Reveal shows the activity name
5. Kid can tap "I'll do this!" to claim → task spawns → dashboard
6. OR kid can skip (it's optional — that's the opportunity part)
7. Next day, a new draw happens

### What's Already Built
- Randomizer with all 3 draw modes (focused/buffet/surprise)
- Mystery tap reveal + spinner animation
- Auto-draw for surprise mode via `useTaskRandomizerDraws`
- `is_opportunity` flag (Gap 1 adds this)

### What's New
- When `is_opportunity=true` on a randomizer: the draw reveals the item but does NOT auto-create a task. Instead it shows "Want to do this? [I'll do this!]" — the kid opts in.
- If the kid opts in: claim→task bridge fires (same as Gap 1)
- If the kid skips: no task, no penalty, the draw is just for fun/discovery

---

## Gap 3: Multi-List Image Import + Auto-Sort

### What Already Exists
- `mindsweep-scan` Edge Function — OCR from images via Haiku vision
- `curriculum-parse` Edge Function — parses text into list items
- Task Breaker image mode — Sonnet vision for photos
- "Import from image" option in TaskCreationModal List type

### The Full Flow

**Step 1: Capture**
- Upload photo(s) of book table of contents, or paste text
- Optional: "Source book title" field (e.g., "The Big Book of Nature Activities")
- OCR runs → extracted text displayed for review

**Step 2: Classify**
- New `smart-list-import` Edge Function (or extend `curriculum-parse`)
- Input: extracted items + list of existing family lists (id, title, description) + source book title
- Haiku classifies each item: "this is an outdoor activity → Outside Fun", "this is a craft → Arts & Crafts"
- Items that don't fit existing lists get "New list: [suggested name]"
- Source book + page number preserved in `notes` field

**Step 3: Human-in-the-Mix Review**
- Table showing: item title | suggested list | confidence | notes
- Per-item: change target list via dropdown, edit title/notes, accept/reject
- New list suggestions show "[Create this list]" button
- Accept creates the list on the spot

**Step 4: Commit**
- Bulk insert: items route to their respective lists in one operation
- Each item gets `notes` like "From: The Big Book of Nature Activities, p.42"

### Entry Points
- Lists page: [Smart Import] button for multi-list import
- Individual list detail: [Import from image] for single-list import (partially exists)
- Could also wire from Studio

### Build Phases
- **Phase 1:** Single-list image import — wire OCR + curriculum-parse into list creation (mostly exists)
- **Phase 2:** `smart-list-import` Edge Function — multi-list classification
- **Phase 3:** SmartImportModal — full review UI with multi-list commit + new list creation
- **Phase 4:** Book/page metadata extraction + source preservation

---

## Gap 4: Universal Assignee Filter on Tasks Page

### Current State
- Tasks page has filter bar: Filter, Active, Completed, All, Unassigned + sort dropdown
- `filterMemberId` state exists but only used in "By Member" view
- No persistent filter across tabs

### What's Needed
- Member-color pill bar below tabs, above filter pills
- Defaults to "Me" (current logged-in member)
- "All" pill to show everything
- Persists across ALL tabs (My Tasks, Routines, Opportunities, Sequential, Queue, Finances)
- Small member-color dot on TaskCard showing assignee at a glance
- Optional "Created by" toggle

### Status
**Building now in current session** — not deferred to parallel session.

---

## Summary: What's Already Built vs What's New

| Capability | Status | Notes |
|-----------|--------|-------|
| `list_items` advancement/mastery columns | **Built (Build J)** | practice_count, mastery, approval — all 10 columns |
| `lists.pool_mode` (individual/shared) | **Built (Build J)** | any/each pattern |
| `lists.eligible_members` | **Built (Build J)** | who can see/claim |
| `lists.draw_mode` + randomizer infrastructure | **Built (Build J)** | focused/buffet/surprise |
| `list_items.reward_amount` | **Built** | money amount per item |
| `task_claims` table | **Built (PRD-09A)** | claim lock mechanics |
| `practice_log` table | **Built (Build J)** | cross-source practice sessions |
| `curriculum-parse` Edge Function | **Built (Build J)** | Haiku parses text into items |
| `mindsweep-scan` Edge Function | **Built (MindSweep)** | OCR from images |
| `is_opportunity` flag on lists | **NEW** | Small schema change |
| Per-item `opportunity_subtype` + `reward_type` | **NEW** | 4 columns on list_items |
| List-level opportunity defaults | **NEW** | 5 columns on lists |
| Claim → task bridge | **NEW** | Core new logic |
| Opportunity list UI (kid browse + claim) | **NEW** | New component |
| Opportunities tab shows opportunity lists | **NEW** | Tab integration |
| `smart-list-import` Edge Function | **NEW** | Multi-list classification |
| SmartImportModal | **NEW** | Multi-list review + commit UI |
| Universal assignee filter | **Building now** | Current session |

---

## Recommended Build Order for Parallel Session

| Session | Scope | Effort |
|---------|-------|--------|
| **1** | Schema (is_opportunity flag, 4 list_item cols, 5 list cols) + list creation UI toggle + opportunity settings panel | Small-Medium |
| **2** | Claim→task bridge + kid browse UI + claim lock mechanics | Medium |
| **3** | Opportunities tab integration + completion flow + reward processing | Medium |
| **4** | Randomizer+opportunity hybrid (opt-in draw reveal) | Small |
| **5** | Single-list image import (wire OCR→curriculum-parse→list items) | Small |
| **6** | Multi-list smart import (new Edge Function + SmartImportModal) | Medium |
| **7** | Mastery flow on opportunity items (reuses Build J infrastructure) | Small |

**Sessions 1-4 are the core.** Sessions 5-7 are enhancements.

---

## Architectural Decision Record

- **Why flag not type:** `is_opportunity` lets any list type become an opportunity. A randomizer is still a randomizer (with draw mechanics) — it just also has opportunity semantics (optional, claimable, rewarded). A checklist is still a checklist — it just also lets kids claim items.
- **Why claim→task bridge not direct completion:** Reuses the entire existing task completion pipeline — gamification, approval, practice/mastery, time tracking, victory routing — without duplicating any of it on list_items. The list item is the source of truth for the opportunity; the task is the execution record.
- **Why not merge lists and tasks tables:** They serve different purposes. Lists are organizational containers (mom's mental model). Tasks are execution units (kid's daily experience). The bridge connects them without conflating them.
