# StewardShip — Phase 7 Build Prompts (v2)

## Overview

Phase 7 (Growth Tools) is split into three sub-phases:
- **Phase 7A:** The Wheel + Life Inventory
- **Phase 7B:** Rigging (Planning Tool)
- **Phase 7C:** Safe Harbor (AI Behavioral Mode)

Each prompt below is a self-contained session for Claude Code. Start each session by reading CLAUDE.md, then the relevant PRD(s), then DATABASE_SCHEMA.md.

---

---

# PHASE 7A: The Wheel + Life Inventory

## Session Prompt for Claude Code

```
You are building Phase 7A of StewardShip — The Wheel and Life Inventory.

READ THESE FIRST (in order):
1. CLAUDE.md (full file — conventions, stub registry, patterns)
2. docs/PRD-11-Wheel-Life-Inventory.md (the feature spec)
3. docs/DATABASE_SCHEMA.md (table schemas — Wheel + Life Inventory tables already defined)
4. docs/StewardShip_System_Overview_PRD_v2.md (system context, cross-feature rules)
5. src/lib/types.ts (existing TypeScript types — GuidedMode already includes 'wheel' and 'life_inventory', LogEntry already has related_wheel_id)
6. src/contexts/HelmContext.tsx (how guided conversations work — startGuidedConversation pattern)
7. supabase/functions/helm-chat/index.ts (existing AI Edge Function)
8. supabase/functions/unload-the-hold/index.ts (reference for the compile Edge Function pattern)
9. supabase/migrations/002_full_schema.sql (verify existing tables — wheel_instances, wheel_rim_entries, life_inventory_areas, life_inventory_snapshots, log_entries.related_wheel_id all already exist)

## What You're Building

### The Wheel
A guided change process tool from the user's therapist. Hub (core change) + 6 Spokes + Rim (periodic check-in). Heavy AI conversation with essay compilation.

**Pages:**
1. Wheel Main Page (`src/pages/Wheel.tsx`) — List of active/completed/archived Wheels, "Start a New Wheel" button
2. Wheel Detail View — Tabbed interface:
   - **Spokes tab:** Visual spoke representation, tap to expand any spoke, edit content
   - **Journal tab:** Log entries linked to this Wheel (via `related_wheel_id`), plus life-area-tag fallback for entries that match but weren't explicitly linked
   - **Conversations tab:** Helm conversations associated with this Wheel (build conversation, Rim check-ins, "Continue at Helm" sessions) — queried via `guided_mode_reference_id` matching this wheel's ID
3. Action buttons: "Continue at Helm", "Schedule Rim Check-in", "Mark Complete", "Archive"

**Guided Mode at Helm:**
- `guided_mode = 'wheel'` with `guided_mode_reference_id` pointing to the `wheel_instances.id`
- AI walks through Hub → Spoke 1 → Spoke 2 → Spoke 3 → Spoke 4 → Spoke 5 → Spoke 6 sequentially
- Each spoke saves incrementally to the database as completed
- Pause/resume across sessions (check `current_spoke` on the wheel_instances record to know where to pick up)

**Spoke Rules (critical — from therapist's framework):**
- Spoke 1 (Why): Always answer is "to increase self-worth and belonging for myself or others." AI tells user this upfront, then explores their specific connection.
- Spoke 2 (When): Always answer is "as soon as possible." Set start date and checkpoint date. Merciful, not rigid.
- Spoke 3 (Self-Inventory): Always answer is "I need a self-inventory." Two parts, each compiled into an essay:
  - Part 1: Honest assessment of current trait/behavior. Should be genuinely uncomfortable. If it doesn't cause discomfort, it's not big enough for a Wheel.
  - Part 2: Vision — role models (at least 2, ideally 3-4, specific traits not whole people) + what success looks like.
  - Both essays compiled by the `wheel-compile` Edge Function (see below).
  - "Copy to Clipboard" button on each essay in the Wheel Detail view (simple, no fancy export needed — users can paste into email/notes/wherever).
  - AI offers to send insights to Keel and vision to Mast (user decides).
- Spoke 4 (Support): Three roles with strict boundaries:
  - Supporter: cheerleader, never judges/nags. Spouse CAN be Supporter.
  - Reminder: given explicit permission, agree on HOW. Spouse NEVER.
  - Observer: watches progress, honest feedback. Spouse NEVER.
  - AI drafts conversation scripts for each role via `wheel-compile`.
  - "Copy to Clipboard" button on each script.
  - "Ideally" not "must" for proximity — imperfect something beats perfect nothing.
- Spoke 5 (Evidence): Three sources defined upfront: self-observation, observer feedback, blind test (strongest). Plus fruits. Reviewed during Rim.
- Spoke 6 (Becoming): "I do what the person I want to be would do." AI suggests Compass tasks, user decides. Not automatic.

**Rim Check-in:**
- Default interval: 14 days, user adjustable
- Reviews all spokes via Helm guided conversation
- At checkpoint date: user evaluates — complete, continue, adjust, or archive
- Saves to `wheel_rim_entries` table
- Any reflections saved to Log during Rim get `related_wheel_id` set automatically

**Wheel Journaling:**
The Wheel has a dedicated Journal tab on the detail page showing entries connected to this Wheel. This works through two mechanisms:
1. **Explicit linking:** Log entries with `related_wheel_id` matching this Wheel. This is the primary method. When the AI saves something to the Log during a Wheel conversation (or Rim check-in), it sets `related_wheel_id`. When the user manually creates a Log entry, they can optionally link it to a Wheel.
2. **Tag fallback:** Log entries matching this Wheel's `life_area_tag` created after the Wheel's `created_at` date, shown in a "Related Entries" subsection below the explicitly linked entries. This catches journal entries that are topically relevant but weren't explicitly linked.

The Log page itself should also be filterable by Wheel. Add a filter option to the existing Log filters: "Linked to Wheel: [dropdown of active Wheels]". This lets users see their Wheel journal entries from within the Log's normal interface too.

During Helm conversations (any mode, not just Wheel), when the user discusses something relevant to an active Wheel, the AI can offer: "Want me to save this to your Log and connect it to your Wheel about [hub_text]?" — setting `related_wheel_id` on the Log entry.

### New Edge Function: `wheel-compile`

Create `supabase/functions/wheel-compile/index.ts`.

This is a focused compilation function, NOT a chat function. It takes conversation context and produces polished written output. Called by the frontend at specific moments:

**Inputs:**
```typescript
{
  user_id: string;
  wheel_id: string;
  compile_type: 'spoke_3_who_i_am' | 'spoke_3_who_i_want_to_be' | 'spoke_4_script';
  conversation_messages: Array<{ role: string; content: string }>;
  hub_text: string; // The core change — needed for context in all compile types
  // For spoke_4_script:
  support_role?: 'supporter' | 'reminder' | 'observer';
  person_context?: { name: string; relationship: string };
}
```

**Outputs:**
```typescript
{
  compiled_text: string; // The essay or script
  error?: string;
}
```

**System prompts by compile_type:**
- `spoke_3_who_i_am`: "Compile a first-person essay from this conversation. The essay should be an honest, vulnerable self-assessment of the person's current state regarding [hub_text]. Write in the user's voice. This should feel uncomfortable to read — that's the point. Don't soften the hard parts. Well-structured paragraphs, not a list."
- `spoke_3_who_i_want_to_be`: "Compile a first-person vision essay from this conversation. Include the specific role models discussed (traits, not whole people) and paint a rich, detailed picture of who they want to become regarding [hub_text]. Aspirational but grounded. Write in the user's voice."
- `spoke_4_script`: "Draft a conversation script this person can use to ask [person_name] to serve as their [role] for their change process regarding [hub_text]. Natural, not scripted-sounding. Include what to say, how to explain the role, and what boundaries to set."

Follow the same Edge Function pattern as `unload-the-hold/index.ts` for API key handling, CORS, error responses, and OpenRouter integration.

### Life Inventory

**Page:** `src/pages/LifeInventory.tsx`
- Shows life areas with brief summaries
- Default areas (seeded on first visit if none exist): Spiritual/Faith, Marriage/Partnership, Family/Parenting, Physical Health, Emotional/Mental Health, Social/Friendships, Professional/Career, Financial, Personal Development/Learning, Service/Contribution
- Each area expandable to show: Where I was (baseline), Where I am (current), Where I'm wanting to end up (vision)
- All fields user-editable directly on the page
- "Start a Life Inventory Conversation" button → opens Helm with `guided_mode = 'life_inventory'`
- "Discuss This Area" button per area → opens Helm with that area as context
- Custom area creation (user can add their own areas)
- Areas with no data show "Not explored yet"

**Guided Mode at Helm:**
- `guided_mode = 'life_inventory'`
- AI asks warm, open-ended questions — no scales, no clinical tone
- Organizes responses into life areas behind the scenes
- Reflects back organized observations for user to refine and confirm
- Incremental save: each area saves as AI reflects and user confirms
- Updates write to `life_inventory_areas` table (baseline/current/vision summaries)
- Snapshots saved to `life_inventory_snapshots` for history

**Onboarding seeding is STUBBED for this phase.** Life Inventory works without it — areas show "Not explored yet" until the user starts a conversation. Add to Stub Registry.

### Schema Change: Add `related_rigging_plan_id` to `log_entries`

Create a new migration file: `supabase/migrations/003_add_rigging_plan_to_log.sql`

```sql
-- Add related_rigging_plan_id to log_entries for Rigging journaling (Phase 7B)
ALTER TABLE public.log_entries
  ADD COLUMN related_rigging_plan_id UUID DEFAULT NULL;

-- Index for filtering log entries by rigging plan
CREATE INDEX idx_log_entries_rigging_plan ON log_entries (related_rigging_plan_id)
  WHERE related_rigging_plan_id IS NOT NULL;
```

Also update:
- `src/lib/types.ts` — Add `related_rigging_plan_id: string | null;` to the `LogEntry` interface
- `docs/DATABASE_SCHEMA.md` — Add the column to the log_entries table definition

NOTE: `related_wheel_id` already exists on `log_entries` in the migration, schema doc, and TypeScript types. No change needed for that one.

### Hooks

Create:
- `src/hooks/useWheel.ts` — CRUD for wheel_instances, wheel_rim_entries. Fetch active/completed/archived. Update individual spokes. Schedule Rim. Fetch linked Log entries (by related_wheel_id + life_area_tag fallback). Fetch linked Helm conversations (by guided_mode_reference_id).
- `src/hooks/useLifeInventory.ts` — CRUD for life_inventory_areas, life_inventory_snapshots. Seed defaults on first visit. Update summaries.

### Components

Create in `src/components/`:
- `wheel/WheelCard.tsx` — Card for Wheel list (hub text, spoke progress, dates, support people)
- `wheel/WheelDetail.tsx` — Full detail view with tabs (Spokes, Journal, Conversations)
- `wheel/SpokeView.tsx` — Expanded spoke content display (adapts per spoke type — text for 1/2, essays with copy button for 3, role cards with scripts for 4, evidence checklist for 5, becoming actions for 6)
- `wheel/WheelJournalTab.tsx` — Journal tab showing linked Log entries + tag-fallback related entries
- `wheel/WheelConversationsTab.tsx` — Conversations tab showing linked Helm conversations
- `wheel/WheelProgressCard.tsx` — Reusable compact card for Charts and Crow's Nest. Shows: hub text, spoke progress (6 small dots/circles, filled for complete), days until next Rim. Tap navigates to Wheel detail page. Single component, single data source — renders identically wherever it appears.
- `lifeinventory/AreaCard.tsx` — Expandable area with three-column view
- `lifeinventory/AreaEditor.tsx` — Inline editing for baseline/current/vision

### Log Page Updates

Update the existing Log page (`src/pages/Log.tsx` or wherever Log filters live):
- Add a "Linked to Wheel" filter option to LogFilters
- When active, shows only entries with `related_wheel_id` matching the selected Wheel
- Dropdown populated from user's active Wheels (hub text as label)
- This is a small addition to existing filter UI — not a redesign

Update `src/lib/types.ts` LogFilters interface:
```typescript
export interface LogFilters {
  // ... existing fields ...
  relatedWheelId: string | null; // NEW: filter by linked Wheel
}
```

### Stub Wiring

Wire these existing stubs (mark as WIRED in Stub Registry after):
- `Charts → Wheel Progress cards` — Add WheelProgressCard to Charts page in a "Growth" section
- `Crow's Nest → Active Wheels card` — Add WheelProgressCard to Crow's Nest dashboard

### System Prompt Updates

Update `src/lib/systemPrompt.ts` (or wherever the system prompt is assembled):

When `guided_mode = 'wheel'`:
- Load the wheel_instances record (all spoke data so far)
- Include Mast entries and Keel data for Spoke 3 context
- Include the spoke rules and always-answers in the system prompt
- Tell the AI which spoke the user is currently on (`current_spoke`)
- Instruct the AI to present the always-answer first, then explore specifics

When `guided_mode = 'life_inventory'`:
- Load all life_inventory_areas with current data
- Include Mast and Keel for context
- Instruct: conversational, no scales, organize behind the scenes, reflect back for confirmation

For regular (non-guided) Helm conversations:
- If user has active Wheels, include a brief summary in context: "User has an active Wheel about [hub_text], currently on Spoke [N]"
- AI should never nag about Wheels in regular conversation
- If user discusses something relevant to an active Wheel, AI can offer to link a Log entry to that Wheel

### Navigation

- Add Wheel to navigation (it should already have a route stub — verify)
- Add Life Inventory to navigation
- Both pages accessible from sidebar/navigation menu

### What "Done" Looks Like

- [ ] Wheel main page with active/completed/archived sections
- [ ] Wheel detail view with three tabs: Spokes, Journal, Conversations
- [ ] Spoke tab: visual spoke representation, tap to expand, edit content
- [ ] Journal tab: linked Log entries + tag-fallback related entries
- [ ] Conversations tab: linked Helm conversations
- [ ] Start New Wheel → Helm guided mode, AI walks through Hub → Spoke 1-6
- [ ] Always-answers presented for Spokes 1, 2, 3
- [ ] Spoke 3: deep conversation → "Compile Essay" → wheel-compile Edge Function → user reviews/edits → saves
- [ ] Spoke 3 essays have "Copy to Clipboard" button in detail view
- [ ] Spoke 4: conversation per role → "Draft Script" → wheel-compile → user reviews/edits → saves
- [ ] Spoke 4 scripts have "Copy to Clipboard" button in detail view
- [ ] Spoke 5: evidence items defined and saved
- [ ] Spoke 6: becoming actions saved, optional Compass task creation
- [ ] Incremental spoke saving (current_spoke updated as each completes)
- [ ] Pause/resume across sessions
- [ ] Rim check-in flow via Helm guided mode
- [ ] Rim scheduling with configurable interval
- [ ] Completion evaluation at checkpoint date
- [ ] wheel-compile Edge Function working for essays and scripts
- [ ] Log entries created during Wheel conversations get related_wheel_id set automatically
- [ ] Log page has "Linked to Wheel" filter
- [ ] AI offers to link relevant Log entries to active Wheels in regular conversations
- [ ] Life Inventory page with expandable areas, three-column view
- [ ] Default areas seeded on first visit
- [ ] Direct editing on Life Inventory page
- [ ] Life Inventory guided conversation at Helm
- [ ] "Discuss This Area" opens Helm with area context
- [ ] Snapshots saved for history
- [ ] WheelProgressCard on Charts and Crow's Nest (stub wiring)
- [ ] Wheel/Life Inventory context loaded in regular Helm conversations
- [ ] Migration 003 adds related_rigging_plan_id to log_entries
- [ ] TypeScript LogEntry interface updated with related_rigging_plan_id
- [ ] RLS on all data (tables already have policies — verify they work)
- [ ] TypeScript compiles without errors
- [ ] All CSS uses var(--color-*) variables, no hardcoded colors

### Stubs Created This Phase (add to Stub Registry)

| Stub | Created In | Wires To | Status |
|------|-----------|----------|--------|
| Wheel → Crew/Sphere references in Spoke 4 | Phase 7A (Wheel) | Phase 8 (Crew) | STUB |
| Life Inventory → Onboarding seeding | Phase 7A (Life Inventory) | Future (Onboarding) | STUB |
| Life Inventory → AI notices relevant info in regular Helm conversations | Phase 7A (Life Inventory) | Enhancement (AI context polish) | STUB |

Note: Keel data loading during Spoke 3 should be wired NOW (Keel was built in Phase 2).

## Documentation Updates (do these AFTER the build compiles and works)

### CLAUDE.md Updates

Add to Stub Registry table:
```
| Wheel → Crew/Sphere references in Spoke 4 | Phase 7A (Wheel) | Phase 8 (Crew) | STUB |
| Life Inventory → Onboarding seeding | Phase 7A (Life Inventory) | Future (Onboarding) | STUB |
| Life Inventory → AI notices relevant info in regular Helm conversations | Phase 7A (Life Inventory) | Enhancement (AI context) | STUB |
```

Update existing stubs to WIRED:
```
| Charts → Wheel Progress cards | Phase 5B (Charts) | Phase 7A (Wheel) | WIRED |
| Crow's Nest → Active Wheels card | Phase 5C (Crow's Nest) | Phase 7A (Wheel) | WIRED |
```

Add to Phase 6 Stubs & Deferred Wiring section — note which remain deferred:
- Tracker → auto-increment linked goal progress: Still deferred to Phase 7B (Rigging)
- Tracker → auto-complete linked Compass task: Still deferred to Phase 7B (Rigging)

Add to Wheel Conventions section:
- Wheel Journal tab shows Log entries linked via `related_wheel_id` + life_area_tag fallback
- Conversations tab shows Helm conversations linked via `guided_mode_reference_id`
- Log entries created during Wheel conversations get `related_wheel_id` set automatically
- AI offers to link relevant entries to active Wheels in regular Helm conversations
- "Copy to Clipboard" on Spoke 3 essays and Spoke 4 scripts (no file export)

### System Overview PRD Updates

Update PRD Index:
```
| PRD-10: Reveille + Reckoning | Phase 6 Built ✅ |
| PRD-11: The Wheel + Life Inventory | Phase 7A Built ✅ |
```

Update Build Order — add ✅ to Phase 7A items and break Phase 7 into sub-phases:
```
### Phase 7A: Wheel + Life Inventory ✅
17. The Wheel (page + guided Helm process, all Spokes, Rim cycle, wheel-compile Edge Function, journal/conversation tabs)
18. Life Inventory (page + guided Helm process, area management, snapshots)
19. WheelProgressCard wired to Charts and Crow's Nest
```

### DATABASE_SCHEMA.md Updates

Add `related_rigging_plan_id` column to the `log_entries` table:
```
| related_rigging_plan_id | UUID | null | NULL | FK → rigging_plans |
```

Add to the Foreign Key map under log_entries:
```
log_entries
  ├── related_wheel_id → wheel_instances.id (already documented)
  └── related_rigging_plan_id → rigging_plans.id (NEW)
```

Update table count from 38 to 38 (no new tables, just a column addition).

Verify the full guided_mode enum is documented:
```
'wheel', 'life_inventory', 'rigging', 'declaration', 'self_discovery', 'meeting', 'first_mate_action', 'safe_harbor', 'unload_the_hold', null
```
```

---

---

# PHASE 7B: Rigging (Planning Tool)

## Session Prompt for Claude Code

```
You are building Phase 7B of StewardShip — Rigging, the Planning Tool.

READ THESE FIRST (in order):
1. CLAUDE.md (full file — conventions, stub registry, patterns)
2. docs/PRD-16-Rigging.md (the feature spec)
3. docs/DATABASE_SCHEMA.md (rigging_plans, rigging_milestones, rigging_obstacles already defined; log_entries now has related_rigging_plan_id from Phase 7A migration)
4. docs/StewardShip_System_Overview_PRD_v2.md (system context, Rigging section in Page Patterns)
5. src/lib/types.ts (GuidedMode already includes 'rigging'; LogEntry now has related_rigging_plan_id)
6. src/contexts/HelmContext.tsx (startGuidedConversation pattern)
7. supabase/functions/wheel-compile/index.ts (reference for the rigging-compile Edge Function — same pattern)
8. src/components/compass/ (Task Breaker integration — understand how tasks are created with related_rigging_plan_id)

## What You're Building

### Rigging Page
`src/pages/Rigging.tsx`

**Main Page:**
- "Rigging" header with subtitle "Your plans and projects. Where intention becomes action."
- "Start New Plan" button → opens Helm in Rigging guided mode
- Filter bar: Active (default), Paused, Completed, All
- Sort: Recently updated (default), Alphabetical, Target date
- Plan cards showing: title, description preview, status, milestone progress bar, next milestone + date, connected Mast principle, nudge icon
- Completed plans collapsed section
- Empty state: "No plans yet. When you have something bigger than a single task — a career move, a home project, a personal goal — this is where it takes shape."

**Plan Detail View (tabbed, same pattern as Wheel Detail):**
- **Plan tab:** Title (editable), status badge, description (editable), connected Mast principles (add/remove), connected Goals (links to Charts), framework(s) used in plain language. Milestones section, MoSCoW section (if applicable), Obstacles section (if applicable), 10-10-10 section (if applicable). Nudge preference toggles.
- **Journal tab:** Log entries linked via `related_rigging_plan_id` + life_area_tag fallback. Same pattern as Wheel Journal tab.
- **Conversations tab:** Helm conversations with `guided_mode = 'rigging'` and `guided_mode_reference_id` matching this plan.
- Action buttons: "Continue Planning" (Helm), "Break Down Next Milestone" (Task Breaker)
- Plan menu: Pause, Archive, Delete

**Milestones on Plan tab:**
- Ordered list with title, target date, status, linked task count
- Inline editing for dates and status
- Tap to expand description
- "Break Down" button per milestone → Task Breaker

**MoSCoW section (only if framework includes MoSCoW):**
- Four columns: Must Have, Should Have, Could Have, Won't Have
- Items editable, movable between columns

**Obstacles section (only if applicable):**
- Risk + mitigation pairs with status (watching/triggered/resolved)
- Editable

**10-10-10 section (only if applicable):**
- Decision text, three perspectives, conclusion
- Editable

**Manual Plan Creation:**
- "Create Plan Manually" option (form-based, no AI)
- Title, description, add milestones manually, add obstacles manually
- Framework selection optional (user can pick, or leave as "none")
- No Helm conversation required

### Guided Mode at Helm

`guided_mode = 'rigging'` with `guided_mode_reference_id` → `rigging_plans.id`

**AI Flow:**
1. User describes what they're trying to accomplish
2. AI connects to Mast principles when natural (not forced)
3. AI selects framework(s) based on description — uses plain language, never jargon
4. AI walks through framework conversationally, one question at a time
5. When ready: "Compile Plan" button → `rigging-compile` Edge Function
6. User reviews compiled plan, edits anything
7. AI asks about nudge preferences
8. User confirms → plan saved

**Framework Selection Logic (for system prompt):**
- Projects with clear deliverables → Milestone Mapping + MoSCoW
- Decisions → 10-10-10 + Backward Planning
- Goals with uncertainty → Obstacle Pre-mortem + Milestone Mapping
- Can combine any ("mixed" mode)
- AI suggests, user can request different frameworks

**Continue Planning:**
- When user taps "Continue Planning" from detail view, reopen Helm with plan context
- AI says: "Where would you like to pick up? We could add milestones, adjust the timeline, break down the next milestone into tasks, or talk through how things are going."

### New Edge Function: `rigging-compile`

Create `supabase/functions/rigging-compile/index.ts`.

Same pattern as `wheel-compile`. Takes conversation messages and produces structured plan data.

**Input:**
```typescript
{
  user_id: string;
  plan_id?: string; // null for new plans, set for revisions
  conversation_messages: Array<{ role: string; content: string }>;
  mast_entries?: string; // for connection suggestions
}
```

**Output:**
```typescript
{
  title: string;
  description: string;
  framework: 'moscow' | 'backward' | 'milestone' | 'premortem' | 'ten_ten_ten' | 'mixed';
  frameworks_used: string[]; // all frameworks applied
  milestones: Array<{ title: string; description?: string; target_date?: string }>;
  moscow?: { must_have: string[]; should_have: string[]; could_have: string[]; wont_have: string[] };
  obstacles?: Array<{ risk_description: string; mitigation_plan: string }>;
  ten_ten_ten?: { decision_text: string; ten_days: string; ten_months: string; ten_years: string; conclusion: string };
  mast_connections?: string[]; // suggested Mast entry IDs to link
  error?: string;
}
```

**System prompt:** "Compile a structured plan from this planning conversation. Extract milestones in chronological order. Apply the [framework(s)] discussed. Use plain language throughout. If MoSCoW was discussed, sort items into the four categories. If obstacles were discussed, pair each risk with its mitigation. If 10-10-10 was discussed, include all three time perspectives and the conclusion."

### Task Breaker Integration

When user taps "Break Down Next Milestone" or "Break Down" on any milestone:
- Open Task Breaker (already built in Phase 4B) with the milestone as input
- Tasks created with `related_rigging_plan_id` set to the plan ID
- Tasks created with `source = 'rigging_plan'` (verify this value against existing code — System Overview says 'rigging_output', check which is used and be consistent)
- Task Breaker levels: quick, detailed, granular (already implemented)
- Update `rigging_milestones.task_breaker_level` when tasks are generated

### Rigging Journaling

Same pattern as Wheel journaling:
- Plan Detail has a Journal tab showing Log entries with `related_rigging_plan_id` matching this plan
- Life area tag fallback for entries that are topically relevant but not explicitly linked
- During Rigging Helm conversations, Log entries saved get `related_rigging_plan_id` set automatically
- AI can offer to link relevant entries in regular conversations: "Want me to connect this to your plan about [title]?"
- Log page: add "Linked to Plan" filter alongside the "Linked to Wheel" filter added in Phase 7A

### Hooks

Create:
- `src/hooks/useRigging.ts` — CRUD for rigging_plans, rigging_milestones, rigging_obstacles. Fetch by status. Update plan/milestone status. Nudge preferences. Fetch linked Log entries. Fetch linked Helm conversations.

### Components

Create in `src/components/rigging/`:
- `PlanCard.tsx` — Card for plan list (progress bar, next milestone, Mast connection)
- `PlanDetail.tsx` — Full detail view with tabs (Plan, Journal, Conversations)
- `MilestoneList.tsx` — Ordered milestone timeline with inline editing
- `MoscowView.tsx` — Four-column MoSCoW display (only shown when framework includes MoSCoW)
- `ObstacleList.tsx` — Risk/mitigation pairs with status controls
- `TenTenTenView.tsx` — 10-10-10 analysis display (only shown when applicable)
- `NudgePreferences.tsx` — Toggle switches for plan nudge settings
- `ManualPlanForm.tsx` — Form-based plan creation (no AI)
- `PlanJournalTab.tsx` — Journal entries linked to this plan (same pattern as WheelJournalTab)
- `PlanConversationsTab.tsx` — Helm conversations linked to this plan

### Stub Wiring

Wire these existing stubs:
- `Goal → Tracker auto-increments goal progress` — When a tracker entry is logged and the tracker is linked to a goal, auto-increment goal progress. (Check custom_trackers for related_goal_id, update goals.progress_current)
- `Goal → Tracker entry auto-completes linked Compass task` — When a tracker entry is logged and a Compass task exists for today with the same tracker link, mark it complete.

### System Prompt Updates

When `guided_mode = 'rigging'`:
- Load the rigging_plans record if continuing (all milestones, obstacles, MoSCoW, 10-10-10)
- Load Mast entries for connection suggestions
- Include framework selection logic in system prompt
- Include the five framework descriptions in plain language
- Instruct: conversational, one question at a time, compile when user is ready

For regular Helm conversations:
- If user has active Rigging plans, include brief summary in context
- If nudge_related_conversations is true for a plan, AI can mention it once per conversation when relevant

### Navigation

- Add Rigging to navigation (should already have a route stub — verify)

### What "Done" Looks Like

- [ ] Rigging main page with plan cards, filter/sort, empty state
- [ ] Plan Detail view with three tabs (Plan, Journal, Conversations)
- [ ] Plan tab with all sections (milestones, MoSCoW, obstacles, 10-10-10, nudges)
- [ ] Journal tab showing linked Log entries + tag fallback
- [ ] Conversations tab showing linked Helm conversations
- [ ] Start New Plan → Helm guided mode with framework selection
- [ ] AI selects frameworks based on user description
- [ ] Conversational planning flow → "Compile Plan" → rigging-compile Edge Function
- [ ] User reviews/edits compiled plan → confirms → saves
- [ ] Per-plan nudge preferences (configurable toggles)
- [ ] Continue Planning reopens Helm with full plan context
- [ ] Manual plan creation (form-based, no AI)
- [ ] Milestone-to-task via Task Breaker (all three levels)
- [ ] Tasks created with related_rigging_plan_id and correct source value
- [ ] Inline editing on Plan Detail (title, description, dates, MoSCoW, obstacles)
- [ ] Plan status management (active, paused, completed, archived)
- [ ] rigging-compile Edge Function working
- [ ] Log entries from Rigging conversations get related_rigging_plan_id set
- [ ] Log page has "Linked to Plan" filter
- [ ] Tracker → goal auto-increment wired
- [ ] Tracker → task auto-complete wired
- [ ] Rigging context loaded in regular Helm conversations
- [ ] RLS working on all tables
- [ ] TypeScript compiles without errors
- [ ] All CSS uses var(--color-*) variables

### Stubs Created This Phase

| Stub | Created In | Wires To | Status |
|------|-----------|----------|--------|
| Rigging → Reveille/Reckoning milestone nudging | Phase 7B (Rigging) | Phase 10 (Reminders) | STUB |
| Rigging → Manifest RAG for planning sessions | Phase 7B (Rigging) | Phase 9 (Manifest) | STUB |
| Rigging → Victory suggestion on plan completion | Phase 7B (Rigging) | Enhancement (polish) | STUB |

## Documentation Updates

### CLAUDE.md Updates

Add to Stub Registry:
```
| Rigging → Reveille/Reckoning milestone nudging | Phase 7B (Rigging) | Phase 10 (Reminders) | STUB |
| Rigging → Manifest RAG for planning sessions | Phase 7B (Rigging) | Phase 9 (Manifest) | STUB |
| Rigging → Victory suggestion on plan completion | Phase 7B (Rigging) | Enhancement (polish) | STUB |
```

Update existing stubs to WIRED:
```
| Goal → Tracker auto-increments goal progress | Phase 5B (Charts) | Phase 7B (Rigging) | WIRED |
| Goal → Tracker entry auto-completes linked Compass task | Phase 5B (Charts) | Phase 7B (Rigging) | WIRED |
```

Add to Rigging Conventions section:
- Rigging Journal tab shows Log entries linked via `related_rigging_plan_id` + life_area_tag fallback
- Conversations tab shows Helm conversations linked via `guided_mode_reference_id`
- Log entries from Rigging conversations get `related_rigging_plan_id` set automatically

If `source = 'rigging_plan'` was added/confirmed for Compass tasks, document in Compass Conventions.

### System Overview PRD Updates

Update PRD Index:
```
| PRD-16: Rigging (Planning Tool) | Phase 7B Built ✅ |
```

Update Build Order:
```
### Phase 7B: Rigging ✅
20. Rigging page (plan cards, detail view with tabs, manual creation, inline editing)
21. Rigging guided mode at Helm (framework selection, conversational planning)
22. rigging-compile Edge Function
23. Milestone-to-Task Breaker integration
24. Tracker → goal/task auto-wiring
25. Rigging journaling (Log integration)
```

### DATABASE_SCHEMA.md Updates

No new schema changes in 7B — the `related_rigging_plan_id` column on `log_entries` was added in the Phase 7A migration. Verify it's documented.
```

---

---

# PHASE 7C: Safe Harbor (AI Behavioral Mode)

## Session Prompt for Claude Code

```
You are building Phase 7C of StewardShip — Safe Harbor, a specialized AI mode for stress processing and crisis support.

READ THESE FIRST (in order):
1. CLAUDE.md (full file — Safe Harbor conventions already documented)
2. docs/PRD-14-Safe-Harbor.md (the feature spec)
3. docs/StewardShip_System_Overview_PRD_v2.md (Safe Harbor section, cross-feature rules including Rule 7: Crisis Override)
4. src/lib/systemPrompt.ts (existing system prompt assembly)
5. src/contexts/HelmContext.tsx (startGuidedConversation pattern)
6. supabase/functions/helm-chat/index.ts (where the system prompt is consumed)

## What You're Building

Safe Harbor is NOT a data feature — it creates no new tables, no new Edge Functions. It is an AI behavioral mode with a dedicated entry page and a carefully engineered system prompt sequence.

### Safe Harbor Page
`src/pages/SafeHarbor.tsx`

**What the user sees:**
- Clean, calming page — warm cream background, minimal elements
- Header: "Safe Harbor"
- Subtext: "A space to process what's heavy. No judgment. No agenda."
- Three reassurance statements (subtle, not overwhelming):
  - "Take your time. There's no rush here."
  - "Everything here stays between us. Save what matters to your Log when you're ready."
  - "If you're in crisis, tell me. I'll get you to the right resources immediately."
- Single action: "Start a Conversation" button → opens Helm in Safe Harbor guided mode
- **No conversation history on this page.** Past Safe Harbor conversations are in normal Helm history. This page stays clean — not a record of hard times.

### Guided Mode at Helm

`guided_mode = 'safe_harbor'`

**Context Loading (richer than normal):**
Always loaded:
- Mast entries (principles to ground in)
- Keel entries (personality, processing style, tendencies)
- Recent Log entries (last 7 days)

Loaded when relevant:
- Active Wheel data (if stress connects to active change process) — wire now (Phase 7A built)
- Life Inventory current state (if stress connects to a life area) — wire now (Phase 7A built)
- First Mate / spouse_insights (if stress involves marriage) — stub until Phase 8
- Crew member context (if stress involves a specific person) — stub until Phase 8
- Manifest RAG (if user has relevant uploaded materials) — stub until Phase 9

### AI Behavior — The Three-Phase Sequence

This is the core of Safe Harbor. The system prompt must enforce this sequence:

**Phase 1: Validation (ALWAYS first)**
- Acknowledge what they're feeling. Don't rush to fix.
- Reflect back what you hear. Use their words, not clinical language.
- Ask questions to understand, not to assess.
- Stay here until the user signals readiness to go deeper.
- Signs of readiness: asking "what should I do?", shifting from emotion to analysis, directly asking for advice.

**Phase 2: Frameworks (only when user signals readiness)**
- Apply frameworks naturally — never as lectures, never by name.
- Frameworks available:
  - 5 Levels of Consciousness (what they can/can't control)
  - Owner vs. Victim stance + Circle/Zigzag/Straight Line + empowering language (Straight Line Leadership)
  - Circle of Influence vs. Concern + Begin with End in Mind + Divine Center (7 Habits)
  - Swedenborg regeneration/ruling love/influx (for faith-oriented users)
  - LDS "Think Celestial" (for faith-oriented users)
  - Active Wheel connection (Spoke 6 — what would the person I want to be do?)
  - Mast grounding (user's own principles)
  - Manifest RAG (when available — stub for now)
- **CRITICAL: Owner vs. Victim** — NEVER use "victim" as a label or accusation. This framework is about inner stance, not character judgment. Model the shift; don't correct their language.
- **Divine Center (7 Habits):** When stress comes from being anchored to something that shifted (spouse, job, reputation), help user re-anchor to God as the stable center. Only for faith-oriented users.

**Phase 3: Action (when user is ready to move forward)**
- Help them identify one concrete next step
- Redirect to human connection: "Have you taken this to the Lord?" / "Have you talked to your wife/husband?" / "Who can you bring this to?"
- AI redirects at least once per Safe Harbor conversation. These redirects are the destination, not afterthoughts.
- Offer to create Compass tasks, save to Log, or update Keel if insights emerged

### Three-Tier Safety System

**Tier 1: Capacity Building (default)**
- Normal stress, frustration, difficult situations
- AI operates in full coaching mode (validation → frameworks → action)

**Tier 2: Professional Referral**
- Complex or entrenched patterns (same topic 2-3+ visits)
- AI gently reflects the pattern: "I notice this is something that keeps coming up. I'm here for you, and I also think talking to a professional counselor could give you tools I can't."
- Encourage professional help, offer to help prepare for therapy

**Tier 3: Crisis Override**
- Crisis indicators: suicidal ideation, self-harm, domestic violence, imminent danger
- ALL coaching stops immediately
- Provide crisis resources directly:
  - 988 Suicide & Crisis Lifeline (call or text 988)
  - Crisis Text Line (text HOME to 741741)
  - National Domestic Violence Hotline (1-800-799-7233)
- Do NOT attempt to counsel through a crisis
- **Crisis Override applies everywhere, not just Safe Harbor.** If crisis indicators appear in ANY conversation in the app, resources are provided immediately.

### Special Cases

**Repeat visits on same topic:** After 2-3 visits, AI gently reflects the pattern and redirects to human connection or professional help. Not punitive — "I notice this keeps weighing on you. That tells me it's important enough to bring to someone who can walk alongside you in person."

**Faith crisis handling:** Validate, don't fix. Don't argue theology. Redirect to spiritual community. "This sounds like something worth exploring with your pastor/bishop/spiritual mentor."

**Light-touch auto-detection:** In regular Helm conversations (not Safe Harbor mode), if the AI detects significant stress, it can mention Safe Harbor once: "If you'd like a space to really process this, Safe Harbor is there for you." Maximum once per conversation. Not a mode shift — just a mention.

### Components

Create in `src/components/safeharbor/`:
- `SafeHarborLanding.tsx` — The clean landing page with reassurance statements and start button

### System Prompt Addition

Add a Safe Harbor system prompt block to `src/lib/systemPrompt.ts`:

```
MODE: Safe Harbor — Stress Processing & Support

The user has entered Safe Harbor. They are dealing with something difficult.

SEQUENCE (follow in order):
1. VALIDATE FIRST. Acknowledge what they're feeling. Don't rush to fix. Reflect their words back. Stay here until they signal readiness.
2. LISTEN DEEPLY. Ask questions to understand, not to assess. Use their language, not clinical terms.
3. FRAMEWORKS (only when ready). Apply naturally, never as lectures:
   [list relevant frameworks based on loaded context]
4. REDIRECT to prayer and human connection when appropriate. At least once per conversation.
5. ACTION when they're ready. One concrete next step. Offer to save to Log or create tasks.

NEVER:
- Provide clinical diagnosis or therapy
- Use "victim" as a label (Owner/Victim is about stance, not character)
- Rush past validation
- Force frameworks before the person is ready
- Attempt to counsel through a crisis (Tier 3 = immediate resources only)

CRISIS OVERRIDE: If you detect suicidal ideation, self-harm, domestic violence, or imminent danger: STOP everything else. Provide these resources immediately:
- 988 Suicide & Crisis Lifeline (call or text 988)
- Crisis Text Line (text HOME to 741741)
- National Domestic Violence Hotline (1-800-799-7233)

The user's processing style (from Keel): {keel_processing_style}
The user's principles (from Mast): {mast_entries}
{active_wheel_context if available}
{life_inventory_context if relevant}
```

### Crisis Override in Regular Conversations

Add crisis detection to the GLOBAL system prompt (not just Safe Harbor). In `systemPrompt.ts`, the base system prompt that applies to ALL conversations should include:

```
CRISIS OVERRIDE (applies to ALL conversations):
If you detect indicators of suicidal ideation, self-harm, domestic violence, or imminent danger to self or others, immediately:
1. Stop all other coaching/advice
2. Provide crisis resources:
   - 988 Suicide & Crisis Lifeline (call or text 988)
   - Crisis Text Line (text HOME to 741741)
   - National Domestic Violence Hotline (1-800-799-7233)
3. Express care and encourage immediate help
Do NOT attempt to counsel through a crisis. Resources first, always.
```

### Navigation

- Add Safe Harbor to navigation
- Consider making it accessible from the Helm drawer as well (a "Safe Harbor" option when starting a new conversation)

### What "Done" Looks Like

- [ ] Safe Harbor landing page — clean, calming, minimal
- [ ] "Start a Conversation" opens Helm in safe_harbor guided mode
- [ ] No conversation history on the Safe Harbor page
- [ ] System prompt enforces validation-first sequence
- [ ] Frameworks applied naturally, never by name
- [ ] Owner vs. Victim handled with care (never a label)
- [ ] Three-tier safety system (capacity building, professional referral, crisis override)
- [ ] Crisis Override in Safe Harbor conversations
- [ ] Crisis Override added to global system prompt (all conversations)
- [ ] Redirect to human connection at least once per conversation
- [ ] Active Wheel context loaded when relevant
- [ ] Life Inventory context loaded when relevant
- [ ] Light-touch auto-detection mention in regular Helm conversations (once per conversation max)
- [ ] Repeat visit pattern reflection (after 2-3 visits on same topic)
- [ ] Faith-sensitive handling (validate, don't fix; redirect to spiritual community)
- [ ] RLS working (no new tables — uses helm_conversations)
- [ ] TypeScript compiles without errors
- [ ] All CSS uses var(--color-*) variables

### Stubs Created This Phase

| Stub | Created In | Wires To | Status |
|------|-----------|----------|--------|
| Safe Harbor → First Mate/Crew context loading | Phase 7C (Safe Harbor) | Phase 8 (Relationships) | STUB |
| Safe Harbor → Manifest RAG context | Phase 7C (Safe Harbor) | Phase 9 (Manifest) | STUB |

## Documentation Updates

### CLAUDE.md Updates

Add to Stub Registry:
```
| Safe Harbor → First Mate/Crew context loading | Phase 7C (Safe Harbor) | Phase 8 (Relationships) | STUB |
| Safe Harbor → Manifest RAG context | Phase 7C (Safe Harbor) | Phase 9 (Manifest) | STUB |
```

Update Safe Harbor Conventions section:
- Note that Crisis Override is now implemented in the global system prompt, not just Safe Harbor
- Note light-touch auto-detection is implemented in the base Helm prompt

### System Overview PRD Updates

Update PRD Index:
```
| PRD-14: Safe Harbor | Phase 7C Built ✅ |
```

Update Build Order:
```
### Phase 7C: Safe Harbor ✅
26. Safe Harbor landing page
27. Safe Harbor system prompt sequence (validation → frameworks → action)
28. Crisis Override in global system prompt
29. Light-touch auto-detection in regular Helm conversations
```

Add ✅ to Phase 7 header once all three sub-phases are complete:
```
### Phase 7: Growth Tools ✅
```

### DATABASE_SCHEMA.md Updates

No changes needed. Safe Harbor creates no new tables.

Verify the guided_mode enum includes 'safe_harbor' (it should — already documented).
```

---

---

# Post-Phase 7 Checklist

After all three sub-phases are complete, verify:

1. **System Overview PRD Index** — All relevant PRDs updated:
   - PRD-10: Phase 6 Built ✅
   - PRD-11: Phase 7A Built ✅
   - PRD-14: Phase 7C Built ✅
   - PRD-16: Phase 7B Built ✅

2. **System Overview Build Order** — Phase 7 fully checked off with sub-phases

3. **CLAUDE.md Stub Registry** — All wired stubs marked, all new stubs added

4. **DATABASE_SCHEMA.md** — `related_rigging_plan_id` on `log_entries` documented

5. **Edge Functions** — Two new:
   - `supabase/functions/wheel-compile/index.ts`
   - `supabase/functions/rigging-compile/index.ts`

6. **New Hooks:**
   - `src/hooks/useWheel.ts`
   - `src/hooks/useLifeInventory.ts`
   - `src/hooks/useRigging.ts`

7. **New Pages:**
   - `src/pages/Wheel.tsx`
   - `src/pages/LifeInventory.tsx`
   - `src/pages/Rigging.tsx`
   - `src/pages/SafeHarbor.tsx`

8. **Log Page Updates:**
   - "Linked to Wheel" filter
   - "Linked to Plan" filter

9. **Cross-feature wiring:**
   - WheelProgressCard on Charts + Crow's Nest
   - Tracker → goal auto-increment
   - Tracker → task auto-complete
   - Crisis Override in global system prompt

10. **TypeScript compiles without errors across the entire project**

11. **All CSS uses var(--color-*) variables — no hardcoded colors anywhere in new code**

12. **Migration file:** `003_add_rigging_plan_to_log.sql` applied
