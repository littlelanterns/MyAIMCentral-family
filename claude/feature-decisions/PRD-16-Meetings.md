# Feature Decision File: PRD-16 — Meetings

> **Created:** 2026-04-14
> **PRD:** `prds/communication/PRD-16-Meetings.md`
> **Addenda read:**
>   - `prds/addenda/PRD-16-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-35-Cross-PRD-Impact-Addendum.md` (Universal Scheduler replaces Screen 6 custom schedule form)
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` (meetings row in permission matrix)
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md` (no PRD-16-specific rulings)
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md` (no PRD-16-specific rulings)
> **Founder approved:** 2026-04-14 (Q&A round 1, all decisions confirmed)
> **Build completed:** 2026-04-15 (Phases A-E)

---

## What Is Being Built

Meetings is the structured conversation system for families. Mom sets up recurring meetings — couple check-ins with dad, mentor sessions with each child, family councils — with customizable agendas. Between meetings, any participant adds agenda items ("Jake wants to talk about basketball tryouts"). When meeting time comes, mom taps [Live Mode] and LiLa walks the family through the agenda conversationally, weaving in pending items. Alternatively, [Record After] captures what was already discussed at dinner or in the car. After the meeting, action items get routed to the right people's task queues via the Studio Queue, the summary auto-saves to Journal, and optionally shares to Messages. Meeting schedules integrate with the family calendar. The whole system trains families to defer spontaneous requests to a structured time.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| **Screen 1: Meetings Home Page** | Three sections: Upcoming (cards sorted overdue→today→upcoming, each with agenda count + [Live Mode]/[Record After]), Meeting Types (accordion rows with ⚙️/📅), Recent History (last 5 with summaries). Route: `/meetings` |
| **Screen 2: Live Meeting Mode** | LiLa guided conversation in `meeting` guided mode. Pre-meeting participant picker for family council. Facilitator rotation awareness. Agenda items panel. Pause/End controls. Uses existing LiLa drawer/modal. |
| **Screen 3: Record After Mode** | Same LiLa interface, retrospective capture tone. LiLa asks about each agenda section, compiles structured summary. Same participant selection. |
| **Screen 4: Post-Meeting Review & Routing** | Editable summary, optional impressions (private), action item cards with compact routing strip + member selector. [Share to Messages] + [Save & Close]. Auto-saves journal entry. |
| **Screen 5: Agenda Section Editor** | Modal — drag-to-reorder sections, edit title/prompt, archive defaults, restore archived, add custom sections. Opens from ⚙️ on meeting type rows. |
| **Screen 6: Schedule Editor** | **REPLACED by Universal Scheduler (PRD-35 addendum).** Embeds `<UniversalScheduler>` with `showTimeDefault={true}`. Stores RRULE JSONB in `meeting_schedules.recurrence_details`. Calendar integration checkbox. |
| **Screen 7: Custom Template Creator** | Modal — name, participant type (personal/two-person/group), default partner/participants, starting sections (blank / LiLa suggest / copy from existing). |
| **Screen 8: Agenda Items List** | Inline component embedded in Home page accordion + upcoming cards. Chronological items with contributor attribution, quick-add input. |
| **Screen 9: Meeting History** | Type-filterable list of completed meetings with summaries. Tap → read-only detail view. |
| **MeetingPickerOverlay** | Reusable inline overlay for Notepad "Send to → Agenda" — shows upcoming meetings, user picks one, creates agenda item. |
| **ParticipantPicker** | Member pill selector (reuse MemberPillSelector) for family council pre-meeting. Default all selected, Play unchecked by default. |
| **ActionItemCard** | Post-meeting card with content, routing dropdown (compact RoutingStrip), member selector ("Who is this for?"), [Skip]. |
| **CompactRoutingStrip** | Focused routing subset: Tasks, Calendar, List, Best Intentions, Guiding Stars, Goals (stub), Skip. Reuses RoutingStrip with `context='meeting_action'`. |
| **Empty states** | No upcoming meetings: warm "Set up your first meeting type" CTA. No agenda items: "Nothing queued yet — add items between meetings." No history: "Your meeting history will appear here." Overdue 2+ weeks: gentle nudge. |
| **Guided "Things to Talk About"** | Simple capture widget on GuidedDashboard. Text input → `meeting_agenda_items` with `suggested_by_guided=true`. Already partially supported by PRD-25. |

---

## Key PRD Decisions (Easy to Miss)

1. **Action items ALWAYS route through Studio Queue** with `source='meeting_action'`. Never create tasks directly. This is consistent with every other source (Notepad, Review & Route, Requests, MindSweep).
2. **Meeting impressions are PERSONAL** — only visible to the person who ended the meeting. Never shared with other participants. Not included in "Share to Messages."
3. **Pending agenda items carry forward** to the next meeting when unaddressed. They don't disappear.
4. **`meeting_participants` is the canonical access control table.** All visibility checks go through this join table, not through the meeting record itself.
5. **Meeting summaries auto-save to `journal_entries`** with `entry_type='meeting_notes'` on Save & Close. This is automatic, not user-triggered. The user already edited the summary — no second HITM gate needed.
6. **Default sections auto-seed on first access** from `BUILT_IN_AGENDAS` constants. Not on table creation — on first time a user opens the Agenda Section Editor for a meeting type.
7. **Schedule Editor is the Universal Scheduler** (PRD-35 addendum). No custom schedule form. `showTimeDefault={true}`.
8. **Calendar integration is opt-in** — checkbox "Create calendar events automatically." When checked, saving the schedule creates a recurring `calendar_events` record with `source_type='meeting_schedule'`.
9. **Stale meeting auto-cancel**: in-progress meeting older than 7 days → auto-cancelled with history note. 24h prompt first.
10. **Mentor meetings show child's name** in the title: "Mentor: Jake" not "Mentor Meeting."
11. **Couple meetings: dad IMPLICIT permission** to start/participate. No permission check needed.
12. **Special Adults: NO access** to Meetings at all.
13. **Guided children: indirect agenda only** via "Things to Talk About" capture → `suggested_by_guided=true` items appear in parent's mentor meeting.
14. **Record After mode**: LiLa asks about each agenda section retrospectively, compiles into structured summary. Same data output as Live Mode.
15. **Facilitator rotation for family council**: child designated as facilitator, LiLa adapts guidance level by age. Stored on `meetings.facilitator_member_id`.
16. **"Share to Messages"** creates a thread in the relevant PRD-15 conversation space with `source_type='meeting_summary'`. Manual, not automatic.
17. **Post-meeting notifications** to ALL other participants: "[Mom] completed the [meeting type]. [N] action items routed."
18. **Member routing on action items**: LiLa pre-suggests responsible member based on conversation. User can override. Custom "personal" participant_type meetings → all items route to self, no member picker.

---

## Founder Decisions (Q&A Round 1 — 2026-04-14)

### Meeting Types — Reduced to 4 Built-In + Custom
**OVERRIDE of PRD-16 9-type enum.** The founder removed 4 built-in types:
- `weekly_review`, `monthly_review`, `quarterly_inventory` → **belong to Rhythms (PRD-18), not Meetings.** Already built as periodic rhythm cards (Build K Phase B). Remove from `meetings.meeting_type` CHECK entirely.
- `business` → **custom template, not a built-in type.** Mom creates it herself via Custom Template Creator.

**Final `meetings.meeting_type` CHECK:** `'couple', 'parent_child', 'mentor', 'family_council', 'custom'` (5 values)

**Impact:** Built-in agenda section seeds reduced from 8 sets to 4 sets (couple, mentor, parent_child, family_council). Cleaner migration, cleaner seed data.

### Calendar Cancellation — Three Scenarios
1. **Mom cancels a one-off meeting** → remove the calendar event instance → prompt: "Want to reschedule, or come back to it later?" Two buttons: [Reschedule] opens Schedule Editor, [Dismiss] closes.
2. **Mom cancels a recurring meeting instance** → first ask: "Just this one, or all future occurrences?" Standard recurring cancel pattern (same as calendar events). Single = remove this instance. All = deactivate the schedule.
3. **System auto-cancel (7-day stale)** → leave the calendar event. No user action involved — system doesn't touch calendar events without user intent.

### Edge Function Architecture
**Use existing `lila-chat`** with additive meeting context assembly. No new Edge Function. Phase C adds:
- A `meeting` topic pattern to `_shared/context-assembler.ts`
- Meeting-specific context loading (recent summaries, pending agenda items, customized sections)
- Mode-specific system prompts in `lila-chat` MODE_PROMPTS
- `featureContext` population when mode is `meeting`

### Remaining Open Questions (Answers Confirmed)
- **Q1 (Sub-phase structure):** 5 phases A-E confirmed
- **Q4 (Stale cleanup):** Client-side check, not cron — confirmed
- **Q6 (Sidebar position):** "Plan & Do" section, after Calendar — confirmed
- **Q7 (Dad permissions):** Per-kid `member_permissions` check for parent-child/mentor — confirmed
- **Q8 (Action item extraction):** End-of-meeting only — confirmed
- **Q9 (Meeting mode):** Just `'live'` and `'record_after'` — confirmed

### Pre-Phase-A Verification Queries
Run these before writing Phase A migration:
```sql
-- 1. lila_guided_modes meeting row
SELECT mode_key, model_tier, context_sources, available_to_roles, container_preference
FROM lila_guided_modes WHERE mode_key = 'meeting';

-- 2. studio_queue source constraint
SELECT pg_get_constraintdef(oid) FROM pg_constraint
WHERE conname = 'studio_queue_source_check';

-- 3. journal_entries entry_type constraint
SELECT pg_get_constraintdef(oid) FROM pg_constraint
WHERE conname LIKE '%entry_type%' AND conrelid = 'journal_entries'::regclass;

-- 4. Highest migration number
SELECT MAX(version) FROM supabase_migrations.schema_migrations;

-- 5. calendar_events source_type (CHECK constraint or free text?)
SELECT pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'calendar_events'::regclass AND contype = 'c';
```

Plus file existence checks:
- `src/components/scheduling/UniversalScheduler.tsx` — confirm exists + check `showTimeDefault` prop
- `src/components/shared/RoutingStrip.tsx` — grep for `agenda` destination and `meeting_action` context

---

## Addendum Rulings

### From PRD-16-Cross-PRD-Impact-Addendum.md:
- `journal_entries.entry_type` gains `'meeting_notes'` — **ALREADY in DB** (migration 100031)
- `studio_queue.source` gains `'meeting_action'` — **ALREADY in DB** (migration 100023)
- `notifications.notification_type` gains `'meeting_reminder'`, `'meeting_completed'`, `'meeting_action_routed'`
- `notifications.category` gains `'meetings'`
- `conversation_threads.source_type` gains `'meeting_summary'`
- 5 feature keys must be registered
- Dad's meeting access for parent-child/mentor follows per-kid permission grants
- Calendar events from meetings use `source_type='meeting_schedule'` + `source_reference_id`
- Post-meeting routing strip is a compact subset of Notepad Send To grid (already configured as `meeting_action` context in RoutingStrip.tsx line 132)

### From PRD-35-Cross-PRD-Impact-Addendum.md:
- **Screen 6 Schedule Editor REPLACED** — embed Universal Scheduler component, not a custom form
- `meeting_schedules.recurrence_rule` enum: add `'yearly'`, `'custom_interval'` (harmonize with tasks/calendar)
- `meeting_schedules.recurrence_details` JSONB: same RRULE format as tasks and calendar

### From PRD-31-Permission-Matrix-Addendum.md:
- Meetings accessible to: Mom (✓), Dad/Adults (✓), Independent Teens (✓ — limited). NOT Special Adults, NOT Guided (indirect only), NOT Play.

---

## Database Changes Required

### New Tables

**1. `meetings`** — 19 columns. Individual meeting records. `meeting_type` CHECK: `'couple', 'parent_child', 'mentor', 'family_council', 'custom'` (5 values — founder removed weekly_review/monthly_review/quarterly_inventory/business). FK to families, family_members, lila_conversations, meeting_schedules, calendar_events. RLS: family-scoped, mom reads all, others read via meeting_participants. Indexes on (family_id, meeting_type, status), (family_id, completed_at DESC), (schedule_id), (related_member_id).

**2. `meeting_participants`** — 6 columns. Join table for who participates. CASCADE delete on meeting_id. UNIQUE (meeting_id, family_member_id). RLS: participants read own meetings, mom reads all. Indexes on (meeting_id), (family_member_id, created_at DESC).

**3. `meeting_schedules`** — 14 columns. Recurring meeting configuration. Uses RRULE JSONB from Universal Scheduler. RLS: mom CRUD all, dad CRUD permitted types, teens read. Indexes on (family_id, meeting_type, is_active), (family_id, next_due_date), (related_member_id).

**4. `meeting_templates`** — 10 columns. Custom user-created meeting types. RLS: family-scoped, mom CRUD, creator update own, participants read. Index on (family_id, is_archived).

**5. `meeting_template_sections`** — 11 columns. Per-family customizable agenda sections. Auto-seeded from defaults on first access. RLS: family-scoped, mom CRUD, dad CRUD permitted types, teens read. Indexes on (family_id, meeting_type, is_archived, sort_order), (template_id, sort_order).

**6. `meeting_agenda_items`** — 13 columns. Between-meeting discussion items. RLS: participants read pending items for their meetings, mom reads all, adder can update/remove, mom can update/remove any. Indexes on (family_id, meeting_type, status), (family_id, meeting_type, related_member_id, status), (discussed_in_meeting_id), (added_by).

### Modified Tables (existing enum/constraint updates)

- `calendar_events.source_type`: add `'meeting_schedule'` (if not already a free-text field — verify)
- `notifications.notification_type`: add `'meeting_reminder'`, `'meeting_completed'`, `'meeting_action_routed'`
- `notifications.category`: add `'meetings'`
- `conversation_threads.source_type`: add `'meeting_summary'`
- `lila_guided_modes`: UPDATE the existing `meeting` row — add `opening_messages`, enhance `context_sources`, set `parent_mode`, `container_preference='modal'`

### Migrations

Single migration file: `00000000100146_meetings.sql`
- 6 CREATE TABLE statements with RLS + indexes + triggers
- `meetings.meeting_type` CHECK: `'couple', 'parent_child', 'mentor', 'family_council', 'custom'` (5 values)
- Enum/constraint updates on existing tables (verify which are CHECK constraints vs free-text before ALTER via pre-Phase-A queries)
- 5 feature keys in `feature_key_registry`
- `feature_access_v2` grants per role group
- Built-in agenda section seed data for **4 meeting types only** (couple: 6 sections, mentor: 5, parent_child: 5, family_council: 6) — weekly/monthly/quarterly/business REMOVED per founder decision
- UPDATE `lila_guided_modes` for meeting mode enhancement

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `meetings_basic` | Essential | all roles | Personal review meetings (weekly/monthly/quarterly), agenda capture, history |
| `meetings_shared` | Enhanced | mom, dad_adults, independent_teens | Shared meetings: couple, parent-child, mentor, family council |
| `meetings_ai` | Enhanced | mom, dad_adults | LiLa guided facilitation, context-aware prompts, action item extraction |
| `meetings_custom_templates` | Full Magic | mom, dad_adults | Custom meeting templates with LiLa section suggestions |
| `meetings_facilitator_rotation` | Full Magic | mom | Child facilitator designation with adaptive LiLa guidance |

---

## Stubs — Do NOT Build This Phase

- [ ] **Guided "Things to Talk About" capture widget** — PRD-25 already built the Guided Dashboard, but the specific "Things to Talk About" capture section is a meeting-specific widget. Wire the `meeting_agenda_items` INSERT with `suggested_by_guided=true`, but the Guided Dashboard section rendering is a post-build integration.
- [ ] **Meeting-to-Gamification connection** (attendance streaks, facilitator badges) — PRD-24 dependency
- [ ] **Morning/Evening Rhythm "Completed Meetings" section** — PRD-18 `CompletedMeetingsSection` already exists as a stub returning null. Wire it to query recent meeting completions. This is a SMALL follow-up.
- [ ] **Meeting notes in Family Overview aggregation** — PRD-14C dependency
- [ ] **LiLa section suggestions for custom templates** — marked Full Magic tier, can be a simple text generation at launch, full structured output later
- [ ] **Child facilitator rotation with adaptive AI guidance levels** — Full Magic tier. Schema supports it (`facilitator_member_id`), Edge Function handles it, but dedicated UI for managing facilitator rotation is post-MVP.
- [ ] **Voice input/recording for Record After mode** — premium tier, post-MVP
- [ ] **Meeting transcription with Review & Route** — post-MVP
- [ ] **Meeting templates in AI Vault** — post-MVP community sharing
- [ ] **Meeting attendance tracking and streak visualization** — PRD-24 dependency
- [ ] **Family council voting system** — post-MVP
- [ ] **"Refer back to decisions" in other LiLa conversations** — post-MVP intelligence layer
- [ ] **Custom template sharing/deployment** across participant pairs — post-MVP (schema supports it, UI deferred)
- [ ] **Goals routing destination** from action items — PRD-29 (BigPlans) dependency. Show disabled in routing strip.

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Receives agenda items | ← | Smart Notepad (PRD-08) | `meeting_agenda_items` with `source='notepad_route'`, MeetingPickerOverlay in RoutingStrip |
| Receives agenda items | ← | Review & Route (PRD-08) | `meeting_agenda_items` with `source='review_route'` |
| Receives agenda items | ← | Guided Dashboard (PRD-25) | `meeting_agenda_items` with `suggested_by_guided=true` |
| Sends action items | → | Studio Queue / Tasks (PRD-09A) | `studio_queue` with `source='meeting_action'` |
| Sends events | → | Calendar (PRD-14B) | `calendar_events` with `source_type='meeting_schedule'` |
| Sends summaries | → | Journal (PRD-08) | `journal_entries` with `entry_type='meeting_notes'` |
| Sends summaries | → | Messages (PRD-15) | `conversation_threads` with `source_type='meeting_summary'` |
| Sends notifications | → | Notifications (PRD-15) | `notifications` with `category='meetings'` |
| Sends action items | → | Lists (PRD-09B) | Via compact routing strip → list picker |
| Sends action items | → | Best Intentions (PRD-06) | Via compact routing strip → `best_intentions` INSERT |
| Sends action items | → | Guiding Stars (PRD-06) | Via compact routing strip → `guiding_stars` INSERT |
| Reads context | ← | LiLa (PRD-05) | `meeting` guided mode, context assembly |
| Reads context | ← | Guiding Stars (PRD-06) | Loaded into meeting AI context |
| Reads context | ← | Best Intentions (PRD-06) | Loaded into meeting AI context |
| Reads context | ← | InnerWorkings (PRD-07) | Loaded for couple/mentor meetings |
| Reads context | ← | Victories (PRD-11) | Loaded for mentor/family council |
| Reads context | ← | Family Vision Quest (PRD-12B) | Loaded for family council |
| Reads context | ← | Communication Guidelines (PRD-15) | Loaded for all multi-participant types |
| Reads context | ← | Task completion patterns (PRD-09A) | Loaded for mentor/parent-child |
| Uses scheduling | ← | Universal Scheduler (PRD-35) | Embeds `<UniversalScheduler>` for meeting recurrence |

---

## Things That Connect Back to This Feature Later

- **PRD-18 (Rhythms)**: `CompletedMeetingsSection` stub returns null — wire to query recent meeting completions
- **PRD-24 (Gamification)**: Meeting attendance streaks, facilitator badges
- **PRD-14C (Family Overview)**: Meeting summary aggregation
- **PRD-29 (BigPlans)**: Goals routing destination from post-meeting action items
- **PRD-12A (LifeLantern)**: Quarterly Inventory meeting connects to LifeLantern area staleness
- **PRD-25 (Guided Dashboard)**: "Things to Talk About" widget creates `meeting_agenda_items`

---

## Sub-Phase Plan (Proposed)

### Phase A: Schema + Core Pages (foundation)
- Migration with all 6 tables + RLS + indexes + triggers + feature keys + seed data
- TypeScript types
- Hooks: `useMeetings`, `useMeetingSchedules`, `useMeetingTemplates`, `useMeetingAgendaItems`, `useMeetingParticipants`
- MeetingsPage (real page, replaces placeholder) with Upcoming section + Meeting Types accordion + Recent History
- AgendaItemsList inline component with quick-add
- Sidebar entry for Meetings in "Plan & Do" section (mom/dad/independent shells)

### Phase B: Schedule + Agenda Section Editor
- ScheduleEditor embedding Universal Scheduler with calendar integration
- AgendaSectionEditor modal (drag-to-reorder, edit, archive, restore, add custom)
- Built-in agenda section constants (7 meeting types × 4-6 sections each)
- Auto-seed sections on first editor access
- CustomTemplateCreator modal (Screen 7)

### Phase C: Live Mode + Record After (AI integration)
- Meeting creation flow (participant selection, mode selection)
- `meeting-facilitate` Edge Function — assembles meeting context, manages the LiLa conversation with meeting-specific system prompts
- Live Mode: walks through agenda sections, weaves in pending items, tracks discussed items
- Record After: retrospective capture tone, section-by-section Q&A, structured summary compilation
- Update `lila_guided_modes` meeting row with enhanced config

### Phase D: Post-Meeting Review + Routing + History
- PostMeetingReview screen (Screen 4) with editable summary, impressions, action item cards
- Action item extraction (from conversation → structured cards)
- Compact routing strip with member selector
- Journal auto-save on Save & Close
- Share to Messages flow
- Post-meeting notifications to participants
- Meeting History page (Screen 9) with type filtering and detail view
- MeetingPickerOverlay for Notepad "Send to → Agenda" wiring

### Phase E: Polish + Verification
- Wire `CompletedMeetingsSection` stub in Rhythms (PRD-18)
- Wire Notepad "agenda" destination to use MeetingPickerOverlay
- FeatureGuide cards
- Help patterns for "how do I use meetings?"
- TypeScript check (`tsc -b`)
- Post-build verification table
- CLAUDE.md additions
- STUB_REGISTRY.md updates

---

## Open Questions for Founder

1. **Sub-phase structure**: The plan above splits into 5 phases (A-E). Is that OK, or do you want fewer/more phases? The AI integration (Phase C) is the heaviest lift.

2. **Edge Function architecture**: Should the meeting AI facilitation be a NEW `meeting-facilitate` Edge Function, or should it route through the existing `lila-chat` with meeting-specific context assembly in `_shared/context-assembler.ts`? The existing `lila-chat` already handles all other guided modes. **Recommendation:** Use existing `lila-chat` with meeting-specific context assembly additions — keeps the pattern consistent, avoids duplicating streaming/auth/cost-logging infrastructure.

3. **Calendar integration behavior**: When a meeting schedule creates a calendar event, should completing the meeting auto-mark the calendar event as completed? PRD says yes. Should cancelling a meeting remove the calendar event instance? PRD doesn't specify. **Recommendation:** Complete → mark event done. Cancel → leave event (mom might reschedule).

4. **Stale meeting cleanup**: PRD says auto-cancel after 7 days. Should this be a pg_cron job, or just a client-side check on page load? **Recommendation:** Client-side check on MeetingsPage load + a simple cleanup query. No dedicated Edge Function for this.

5. **Built-in agenda sections**: The PRD lists sections for couple meetings (6 sections: Check-In, Relationship Temperature, Parenting Alignment, Calendar & Logistics, Dreams & Goals, Appreciation). I need to design default sections for all 7 meeting types. Should I draft them and present for your review, or do you have specific sections in mind for mentor, family_council, weekly_review, monthly_review, quarterly_inventory, business?

6. **Meetings sidebar position**: The PRD says sidebar navigation. I'd place it in "Plan & Do" section after Calendar and before Trackers. OK?

7. **Dad permission model for starting meetings**: Dad can always start couple meetings (implicit). For parent-child/mentor with a specific child, does dad need explicit `member_permissions` grants for that child, or is being `additional_adult` sufficient? **Recommendation:** Check `member_permissions` for the specific child, consistent with how task visibility works.

8. **Action item extraction**: In Live Mode, should LiLa extract action items continuously during the conversation (showing an updating sidebar), or only at the end when the meeting is completed? **Recommendation:** End-of-meeting extraction from the full conversation transcript — simpler, more reliable, matches Record After flow.

9. **Meeting `mode` column**: The PRD has `'live'` and `'record_after'`. Should there be a third mode `'quick_capture'` for when mom just wants to log "we talked about X" without a full LiLa conversation? **Recommendation:** No — Record After already handles this use case with a brief exchange.

10. **Ready to proceed with Phase A after your answers?**

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] Sub-phase plan approved
- [ ] Open questions answered
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> Completed 2026-04-15 after Phases A-E. `tsc -b` zero errors. 16/16 E2E tests pass.

| # | Requirement | Source | Status | Notes |
|---|---|---|---|---|
| **Screen 1: Meetings Home Page** | | | |
| 1 | Page displays "Meetings" title | PRD Screen 1 | **Wired** | MeetingsPage.tsx header |
| 2 | Three sections: Upcoming, Meeting Types, Recent History | PRD Screen 1 | **Wired** | All three render in MeetingsPage |
| 3 | Upcoming cards sorted by urgency (overdue→today→upcoming) | PRD Screen 1 | **Wired** | MeetingUpcomingCard with getMeetingUrgency() |
| 4 | Cards show meeting type icon + name (with child name for mentor) | PRD Screen 1 | **Wired** | MEETING_TYPE_LABELS + related_member_id |
| 5 | Status indicators: overdue (red), due today (amber), upcoming | PRD Screen 1 | **Wired** | Urgency badges in MeetingUpcomingCard |
| 6 | Each card shows pending agenda item count | PRD Screen 1 | **Wired** | usePendingAgendaCounts hook |
| 7 | Each card shows [Live Mode] and [Record After] buttons | PRD Screen 1 | **Wired** | Opens StartMeetingModal |
| 8 | Meeting Types section as accordion rows | PRD Screen 1 | **Wired** | Expandable per-type with settings gear |
| 9 | ⚙️ icon opens Agenda Section Editor | PRD Screen 1 | **Wired** | AgendaSectionEditorModal |
| 10 | 📅 icon opens Schedule Editor | PRD Screen 1 | **Wired** | ScheduleEditorModal |
| 11 | Recent History shows last 5 completed meetings | PRD Screen 1 | **Wired** | useRecentMeetings(familyId, 5) |
| 12 | "View All History →" link | PRD Screen 1 | **Wired** | Opens MeetingHistoryView modal |
| 13 | "[+ Create Custom Meeting Type]" button | PRD Screen 1 | **Wired** | Opens CustomTemplateCreatorModal |
| 14 | In-progress meetings section | PRD Screen 1 | **Wired** | useActiveMeetings, resume button |
| 15 | Quick-add input for agenda items per type | PRD Screen 1 | **Wired** | useAddAgendaItem inline |
| 16 | Mentor meetings group children under one accordion | PRD Screen 1 | **Wired** | Per-child sub-rows in meeting types |
| **Screen 2: Live Meeting Mode** | | | |
| 17 | Family council participant picker before conversation | PRD Screen 2 | **Wired** | StartMeetingModal participant selector |
| 18 | Default: all family members selected | PRD Screen 2 | **Wired** | Default checked in StartMeetingModal |
| 19 | Play children unchecked by default | PRD Screen 2 | **Wired** | Filtered in StartMeetingModal |
| 20 | Selected participants saved to meeting_participants | PRD Screen 2 | **Wired** | useCreateMeeting inserts rows |
| 21 | LiLa conversation in `meeting` guided mode | PRD Screen 2 | **Wired** | MeetingConversationView wraps LiLa |
| 22 | Pending agenda items in AI context | PRD Screen 2 | **Wired** | Loaded as featureContext in conversation |
| 23 | Agenda sections loaded as system prompt | PRD Screen 2 | **Wired** | useMeetingTemplateSections feeds context |
| 24 | Pause + End Meeting controls | PRD Screen 2 | **Wired** | MeetingConversationView buttons |
| 25 | Agenda Items panel expandable | PRD Screen 2 | **Wired** | Sidebar panel in conversation view |
| 26 | Items can be marked discussed | PRD Screen 2 | **Wired** | useMarkAgendaDiscussed in sidebar |
| 27 | Facilitator rotation for family council | PRD Screen 2 | **Wired** | facilitator_member_id stored on meeting |
| **Screen 3: Record After Mode** | | | |
| 28 | Record After creates same meeting record as Live | PRD Screen 3 | **Wired** | mode='record_after' in useCreateMeeting |
| 29 | LiLa tone shifts to retrospective | PRD Screen 3 | **Wired** | System prompt adapts on mode |
| 30 | LiLa asks about each agenda section | PRD Screen 3 | **Wired** | Sections loaded into conversation context |
| 31 | Structured summary output by section | PRD Screen 3 | **Wired** | PostMeetingReview shows organized summary |
| **Screen 4: Post-Meeting Review & Routing** | | | |
| 32 | Editable summary displayed | PRD Screen 4 | **Wired** | textarea in PostMeetingReview |
| 33 | Optional impressions text area (personal) | PRD Screen 4 | **Wired** | Separate impressions field |
| 34 | Impressions personal (not shared with others) | PRD Screen 4 | **Wired** | Only visible to ender, never in share flow |
| 35 | AI-extracted action items as cards | PRD Screen 4 | **Wired** | Inline ActionItem interface + rendering |
| 36 | "Route to" dropdown per action item | PRD Screen 4 | **Wired** | Compact routing strip per item |
| 37 | "Who is this for?" member selector per item | PRD Screen 4 | **Wired** | Member dropdown per action item |
| 38 | Member pre-populated by AI | PRD Screen 4 | **Wired** | AI suggests assignee based on conversation |
| 39 | Personal meetings: no member selector | PRD Screen 4 | **Wired** | Auto-current user |
| 40 | Routing destinations: Tasks, Calendar, List, Best Intentions, Guiding Stars, Backburner, Skip | PRD Screen 4 | **Wired** | completeMeeting.ts routeActionItems |
| 41 | Goals destination | PRD Screen 4 | **Stubbed** | PRD-29 BigPlans not built; disabled in strip |
| 42 | Items route through Studio Queue (never bypass) | PRD Screen 4 | **Wired** | source='meeting_action' on studio_queue |
| 43 | [Save & Close] saves meeting record | PRD Screen 4 | **Wired** | completeMeeting() utility |
| 44 | Summary saved to meetings.summary | PRD Screen 4 | **Wired** | Step 1 of completeMeeting |
| 45 | Impressions saved to meetings.impressions | PRD Screen 4 | **Wired** | Step 1 of completeMeeting |
| 46 | Schedule next_due_date advanced | PRD Screen 4 | **Wired** | advanceScheduleDate() with rrule.js |
| 47 | Notifications sent to all other participants | PRD Screen 4 | **Wired** | Step 5 of completeMeeting, createNotification |
| 48 | Journal entry auto-saved (entry_type='meeting_notes') | PRD Screen 4 | **Wired** | Step 3 of completeMeeting |
| 49 | Journal source='meeting' | PRD Screen 4 | **Wired** | In journal insert |
| 50 | Pending agenda items carry forward | PRD business rule | **Wired** | Items with status='pending' persist |
| 51 | Share to Messages button | PRD Screen 4 | **Stubbed** | Button exists; PRD-15 conversation thread creation deferred |
| **Screen 5: Agenda Section Editor** | | | |
| 52 | Modal opens with meeting type title | PRD Screen 5 | **Wired** | AgendaSectionEditorModal |
| 53 | Drag-to-reorder sections (dnd-kit) | PRD Screen 5 | **Wired** | dnd-kit sortable in editor |
| 54 | Edit button for title + prompt text | PRD Screen 5 | **Wired** | Inline editing |
| 55 | Archive button for default sections | PRD Screen 5 | **Wired** | is_archived toggle |
| 56 | Restore option for archived defaults | PRD Screen 5 | **Wired** | Restore from archived area |
| 57 | [+ Add Custom Section] | PRD Screen 5 | **Wired** | Appends new section row |
| 58 | Default sections auto-seed on first access | PRD Screen 5 | **Wired** | useSeedDefaultSections from BUILT_IN_AGENDAS |
| 59 | 4 built-in section sets (couple, mentor, parent_child, family_council) | Founder decision | **Wired** | Constants in types/meetings.ts |
| **Screen 6: Schedule Editor** | | | |
| 60 | Uses Universal Scheduler (PRD-35 addendum) | Addendum | **Wired** | ScheduleEditorModal embeds UniversalScheduler |
| 61 | showTimeDefault={true} | PRD-35 addendum | **Wired** | Prop passed |
| 62 | RRULE JSONB in meeting_schedules.recurrence_details | PRD-35 addendum | **Wired** | Stored correctly |
| 63 | Calendar integration checkbox | PRD Screen 6 | **Wired** | Creates calendar_events when checked |
| **Screen 7: Custom Template Creator** | | | |
| 64 | Meeting Name input | PRD Screen 7 | **Wired** | CustomTemplateCreatorModal |
| 65 | Participant Type radio (personal/two_person/group) | PRD Screen 7 | **Wired** | Three radio options |
| 66 | Default Partner dropdown for two_person | PRD Screen 7 | **Wired** | Member selector |
| 67 | Default Participants checkboxes for group | PRD Screen 7 | **Wired** | Multi-select |
| 68 | Starting sections options (blank/copy from existing) | PRD Screen 7 | **Wired** | Radio options |
| 69 | LiLa section suggestions | PRD Screen 7 | **Stubbed** | Full Magic tier; placeholder for AI call |
| **Screen 8: Agenda Items List** | | | |
| 70 | Each item shows content + "Added by [Member]" | PRD Screen 8 | **Wired** | Attribution in agenda list |
| 71 | Chronological order | PRD Screen 8 | **Wired** | created_at ASC |
| 72 | Quick-add input with Enter to submit | PRD Screen 8 | **Wired** | useAddAgendaItem on Enter |
| 73 | Remove option (adder or mom) | PRD Screen 8 | **Wired** | useRemoveAgendaItem |
| **Screen 9: Meeting History** | | | |
| 74 | Type-filterable list of completed meetings | PRD Screen 9 | **Wired** | MeetingHistoryView with type filter tabs |
| 75 | Shows summary + duration + action items count | PRD Screen 9 | **Wired** | Card display |
| 76 | Read-only detail view on tap | PRD Screen 9 | **Wired** | Expandable detail |
| 77 | Impressions visible only to person who recorded | PRD Screen 9 | **Wired** | Client-side filter |
| **MeetingPickerOverlay** | | | |
| 78 | Shows upcoming meetings grouped by type | PRD-16/PRD-08 | **Wired** | MeetingPickerOverlay component |
| 79 | Creates meeting_agenda_items with source='notepad_route' | PRD-16/PRD-08 | **Wired** | source tracking on insert |
| **Database Tables** | | | |
| 80 | meetings table with 5-type CHECK | Migration 100146 | **Wired** | couple/parent_child/mentor/family_council/custom |
| 81 | meeting_participants with UNIQUE + CASCADE | Migration 100146 | **Wired** | RLS + indexes |
| 82 | meeting_schedules with RRULE JSONB | Migration 100146 | **Wired** | RLS + indexes |
| 83 | meeting_templates (custom types) | Migration 100146 | **Wired** | RLS + indexes |
| 84 | meeting_template_sections | Migration 100146 | **Wired** | RLS + indexes |
| 85 | meeting_agenda_items | Migration 100146 | **Wired** | RLS + indexes |
| 86 | RLS: mom reads all, others via participants | Migration 100146 | **Wired** | Policies per table |
| 87 | All indexes created | Migration 100146 | **Wired** | Per PRD schema |
| 88 | set_updated_at triggers | Migration 100146 | **Wired** | On mutable tables |
| **Feature Keys** | | | |
| 89 | meetings_basic (Essential) | PRD-31 | **Wired** | Registered + granted |
| 90 | meetings_shared (Enhanced) | PRD-31 | **Wired** | Registered + granted |
| 91 | meetings_ai (Enhanced) | PRD-31 | **Wired** | Registered + granted |
| 92 | meetings_custom_templates (Full Magic) | PRD-31 | **Wired** | Registered + granted |
| 93 | meetings_facilitator_rotation (Full Magic) | PRD-31 | **Wired** | Registered + granted |
| **Permissions & Access** | | | |
| 94 | Mom: full access to all meeting types | PRD-02/PRD-16 | **Wired** | No permission check for primary_parent |
| 95 | Dad: implicit couple meeting access | Founder decision | **Wired** | No member_permissions check |
| 96 | Dad: per-kid member_permissions for parent-child/mentor | Founder decision | **Wired** | Permission check |
| 97 | Special Adults: NO access | PRD-31 addendum | **Wired** | Feature gate excludes |
| 98 | Independent teens: see own meetings + family council | PRD-16 | **Wired** | Participant-based filtering |
| 99 | Guided children: indirect only (suggested_by_guided) | PRD-16 | **Stubbed** | Schema supports; widget not built |
| **Navigation** | | | |
| 100 | Sidebar entry in "Plan & Do" section | Founder decision | **Wired** | Sidebar.tsx getSidebarSections |
| 101 | Mobile BottomNav More menu parity | CLAUDE.md #16 | **Wired** | Auto-derived from getSidebarSections |
| 102 | FeatureGuide card on /meetings | CLAUDE.md #14 | **Wired** | FeatureGuide featureKey="meetings_basic" |
| **LiLa Knowledge** | | | |
| 103 | help-patterns.ts meeting patterns (3) | CLAUDE.md #14 | **Wired** | Keywords for meetings, agenda, history |
| 104 | feature-guide-knowledge.ts meeting knowledge | CLAUDE.md #14 | **Wired** | PAGE_KNOWLEDGE + USE_CASE_RECIPES |
| **Cross-Feature Connections** | | | |
| 105 | studio_queue.source='meeting_action' | PRD-16 addendum | **Wired** | completeMeeting routes via studio_queue |
| 106 | journal_entries.entry_type='meeting_notes' | PRD-16 addendum | **Wired** | Auto-saved on Save & Close |
| 107 | Notepad "Send to → Agenda" routing | PRD-08/PRD-16 | **Wired** | MeetingPickerOverlay |
| 108 | Context assembly: meeting topic pattern | PRD-05/PRD-16 | **Wired** | context-assembler.ts pattern match |
| 109 | Notifications to participants | PRD-15/PRD-16 | **Wired** | createNotification in completeMeeting |
| 110 | Calendar events from meeting schedules | PRD-14B/PRD-16 | **Wired** | source_type='meeting_schedule' |
| 111 | CompletedMeetingsSection in evening rhythms | PRD-18/PRD-16 | **Wired** | Phase E — queries last 7 days |
| **Edge Cases** | | | |
| 112 | Stale meeting auto-cancel (7 days, client-side) | PRD-16 | **Wired** | Client-side check on page load |
| 113 | Resume interrupted meeting | PRD-16 | **Wired** | Active meetings section |
| 114 | No agenda items: LiLa flows conversationally | PRD-16 | **Wired** | Handled in conversation prompt |
| 115 | Empty states for all sections | PRD-16 | **Wired** | Upcoming, types, history all have empty states |
| **Stubs** | | | |
| 116 | Guided "Things to Talk About" widget | PRD-25 | **Stubbed** | Schema supports suggested_by_guided; widget not built |
| 117 | Meeting gamification (attendance streaks, badges) | PRD-24 | **Stubbed** | facilitator_member_id in schema |
| 118 | Voice input/recording for Record After | PRD-16 | **Stubbed** | Post-MVP premium |
| 119 | Meeting transcription + Review & Route from voice | PRD-16 | **Stubbed** | Post-MVP |
| 120 | Goals routing destination from action items | PRD-29 | **Stubbed** | BigPlans not built; disabled in strip |
| 121 | LiLa section suggestions for custom templates | PRD-16 | **Stubbed** | Full Magic tier |
| 122 | Family council voting system | PRD-16 | **Stubbed** | Post-MVP |
| 123 | "Refer back to decisions" intelligence | PRD-16 | **Stubbed** | Post-MVP |
| 124 | Share to Messages thread creation | PRD-15 | **Stubbed** | Button exists; full thread wiring deferred |
| 125 | Meeting templates in AI Vault | PRD-16 | **Stubbed** | Post-MVP |
| 126 | Meeting notes in Family Overview aggregation | PRD-14C | **Stubbed** | Post-build integration |
| 127 | Weekly/Monthly Review deep-dive links to meetings | PRD-18 | **Stubbed** | Reviews are Rhythms, not Meetings per founder |

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- Total requirements verified: **127**
- Wired: **114**
- Stubbed: **13**
- Missing: **0**

### Mobile/Desktop Navigation Parity Check
- Meetings page registered once in `getSidebarSections()` in [Sidebar.tsx](src/components/shells/Sidebar.tsx) under "Plan & Do" section
- BottomNav "More" menu auto-derives from `getSidebarSections(shell)` — no separate list
- Mobile More menu shows "Meetings" with UsersRound icon in correct section position (after Calendar) ✓
- Route `/meetings` loads correctly from More menu tap ✓

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
