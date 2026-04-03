# Feature Decision File: PRD-17 — Universal Queue & Routing System (Gap-Fill)

> **Created:** 2026-04-03
> **PRD:** `prds/communication/PRD-17-Universal-Queue-Routing-System.md`
> **Addenda read:**
>   - `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
> **Founder approved:** 2026-04-03

---

## What Is Being Built

PRD-17 is the central routing infrastructure — "the sorting station." Items from brain dumps, meetings, LiLa, kid requests, and goal breakdowns land in one unified inbox (`studio_queue`). Mom opens the Review Queue modal, processes everything in one focused session, then closes it and she's done.

**This is a gap-fill session.** ~75% of PRD-17 was built across earlier phases (PRD-14B, PRD-09A, PRD-08, PRD-14C). This session wires the remaining entry points, gets CalendarTab functional, and adds the list picker — making the queue fully usable before MindSweep (PRD-17B).

---

## What Already Exists (Do NOT Rebuild)

| Component | File | Status |
|---|---|---|
| UniversalQueueModal (3 tabs, badges, "All caught up!") | `src/components/queue/UniversalQueueModal.tsx` | Working |
| SortTab (items, ordering, source labels, dismiss) | `src/components/queue/SortTab.tsx` | Working |
| QueueCard (destination badges, source indicators) | `src/components/queue/QueueCard.tsx` | Working |
| BatchCard (Send as Group / Process All / Expand / Dismiss) | `src/components/queue/BatchCard.tsx` | Working |
| RoutingStrip (15+ destinations, context filter, sub-drill-down) | `src/components/shared/RoutingStrip.tsx` | Working |
| BreathingGlow (presence indicator, CSS animation) | `src/components/ui/BreathingGlow.tsx` | Working |
| `studio_queue` table (full schema, RLS, indexes) | Migration 00000000000008 | Working |
| useStudioQueue hooks (items, count, batched, role-scoped) | `src/hooks/useStudioQueue.ts` | Working |
| TaskCreationModal Quick/Full Mode toggle | `src/components/tasks/TaskCreationModal.tsx` | Working |
| RoutingToastProvider (5-second undo) | `src/components/shared/RoutingToastProvider.tsx` | Working |
| TaskRouteHandler (notepad → studio_queue) | `src/lib/routing/taskRouteHandler.ts` | Working |
| PendingItemsBar entry (Family Overview) | `src/components/family-overview/PendingItemsBar.tsx` | Working |
| Feature keys (studio_queue, queue_modal, etc.) | Migration | Working |
| Badge style preference (glow/numeric, localStorage) | QuickTasks.tsx | Working |
| RequestsTab (stub with empty state) | `src/components/queue/RequestsTab.tsx` | Correctly Stubbed |

---

## Screens & Components (Gap-Fill Items)

| Screen / Component | Notes |
|---|---|
| QuickTasks "Review Queue" → opens modal | PRIMARY GAP. Currently only toggles indicator mode. Must open UniversalQueueModal. |
| CalendarTab wired to real events | Query `calendar_events WHERE status='pending'`, render approval cards |
| CalendarTab approval card | Event title, date/time, location, submitter, Approve / Edit & Approve / Reject |
| CalendarTab "Approve all" bulk action | Gradient button at bottom when multiple pending |
| List picker from Sort tab | When `destination='list'`, show list selector instead of TaskCreationModal |
| Dashboard queue indicator | Breathing glow on Dashboard that opens modal |
| Tasks page queue badge | Badge on Tasks page that opens modal to Sort tab |
| Calendar page queue badge | Badge on Calendar page that opens modal to Calendar tab |
| Sidebar BreathingGlow | Glow on sidebar nav items when pending items exist |

---

## Key PRD Decisions (Easy to Miss)

1. **QuickTasks "Review Queue" click = open modal.** This is the primary entry point. The indicator toggle (glow vs numeric) should NOT consume the click — move it to Settings or long-press.

2. **CalendarTab approval actions:** Approve = sage teal bg. Edit & Approve = soft gold bg. Reject = light blush bg with dropdown for optional note. All use theme tokens not hardcoded colors.

3. **CalendarTab "Approve all (N)"** — gradient button at bottom. Bulk approves all. Creators receive notifications (stub — PRD-15 not built).

4. **List picker from Sort tab** — this is critical for MindSweep readiness. Shopping items routed by MindSweep need to hit a list picker, not TaskCreationModal. Must handle: select existing list, items added as `list_items`.

5. **Sort tab ordering:** member requests first → meeting actions second → all others by `created_at` desc. Batch items use earliest `created_at` in batch.

6. **Default tab logic:** Sort first. If empty → first tab with items (Calendar, then Requests). If all empty → "All caught up!" state. Persist last-viewed tab within session.

7. **Entry points open to specific tabs:** Calendar page → Calendar tab. Tasks page → Sort tab. Dashboard → Sort tab (default logic).

8. **Processing an event in CalendarTab:** Sets `calendar_events.status` to 'approved', sets `approved_by` and `approved_at`. Full color on all calendars. (Notification creation deferred — PRD-15 not built.)

9. **Reject dropdown:** Optional rejection note text field. Sets status to 'rejected'.

10. **"Edit & Approve"** opens event in EventCreationModal (existing component) for editing, saves as approved.

---

## Addendum Rulings

### From PRD-17B-Cross-PRD-Impact-Addendum.md:
- `studio_queue` will get 2 new columns later: `mindsweep_confidence` (TEXT), `mindsweep_event_id` (UUID). Do NOT add now.
- 4 new `source` values coming: 'mindsweep_auto', 'mindsweep_queued', 'email_forward', 'share_to_app'. Do NOT add now.
- MindSweep tile will be added to RoutingStrip later. Do NOT add now.
- Design nothing that conflicts with these future additions.

### From PRD-Audit-Readiness-Addendum.md:
- No PRD-17-specific rulings.

---

## Database Changes Required

### New Tables
None — `studio_queue` already exists with full PRD-17 schema.

### Modified Tables
None required for this gap-fill.

### Migrations
No new migration needed. Verify `calendar_events.status` CHECK constraint includes 'pending' (already confirmed from PRD-14B build).

---

## Feature Keys

Already registered — no new keys needed:

| Feature Key | Minimum Tier | Notes |
|---|---|---|
| `studio_queue` | Essential | Already registered |
| `queue_modal` | Essential | Already registered |
| `queue_quick_mode` | Essential | Already registered |
| `routing_strip` | Essential | Already registered |
| `queue_batch_processing` | Enhanced | Already registered |

---

## Stubs — Do NOT Build This Phase

- [ ] Notification auto-dismiss on queue processing (PRD-15 not built)
- [ ] Notification creation on approve/reject (PRD-15 not built)
- [ ] Settings page badge preference toggle (PRD-22 section)
- [ ] Widget creation flow from Sort tab (PRD-10 stub)
- [ ] Tracker creation flow from Sort tab (PRD-10 stub)
- [ ] Goal decomposition → studio_queue (future PRD)
- [ ] Project planner → studio_queue (future PRD)
- [ ] LiLa destination suggestion hints on queue cards (post-MVP)
- [ ] Real-time concurrent processing indicators (real-time subscription)
- [ ] MindSweep columns/sources on studio_queue (PRD-17B)
- [ ] MindSweep tile on RoutingStrip (PRD-17B)
- [ ] Keyboard shortcuts for queue processing (post-MVP)
- [ ] Swipe gestures on mobile (post-MVP)
- [ ] RequestsTab full implementation (PRD-15 not built — stub already correct)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Queue Modal CalendarTab | ← | Calendar events | `calendar_events WHERE status='pending'` |
| Queue Modal CalendarTab | → | Calendar events | Sets `status`, `approved_by`, `approved_at` |
| Queue Modal CalendarTab | → | EventCreationModal | "Edit & Approve" opens existing modal |
| Sort tab | ← | studio_queue | Pending items query |
| Sort tab | → | TaskCreationModal | [Configure] for task items |
| Sort tab | → | List picker | [Add to list] for list items |
| QuickTasks strip | → | UniversalQueueModal | Click opens modal |
| Dashboard | → | UniversalQueueModal | Indicator opens modal |
| Tasks page | → | UniversalQueueModal | Badge opens modal to Sort tab |
| Calendar page | → | UniversalQueueModal | Badge opens modal to Calendar tab |
| Sidebar nav items | ← | studio_queue / calendar_events | Pending counts for glow |

---

## Things That Connect Back to This Feature Later

- PRD-17B (MindSweep) adds columns + sources to studio_queue, adds MindSweep to RoutingStrip
- PRD-15 (Messages) wires RequestsTab full implementation + notification auto-dismiss
- PRD-16 (Meetings) wires meeting_action source items into studio_queue
- PRD-10 (Widgets/Trackers) wires widget/tracker creation from Sort tab

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate
- [x] All addenda captured above
- [x] Stubs confirmed — nothing extra will be built
- [x] Schema changes correct (none needed)
- [x] Feature keys identified (all already registered)
- [x] **Approved to build** — 2026-04-03

---

## Post-Build PRD Verification

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Universal Queue Modal with tabbed navigation | Screen 1 | Wired | 3 tabs, gradient header, badge counts |
| Three tabs: Calendar, Sort, Requests | Screen 1 | Wired | Calendar + Sort functional, Requests stub |
| Opens from QuickTasks strip | Screen 1 | Wired | Click indicator opens modal |
| Opens from Dashboard badge | Screen 1 | Wired | QueueBadge next to PerspectiveSwitcher |
| Opens from Tasks page badge | Screen 1 | Wired | QueueBadge next to page title |
| Opens from Calendar page badge | Screen 1 | Wired | QueueBadge in gradient toolbar |
| Default tab logic (Sort first, fallback) | Screen 1 | Wired | |
| Breathing glow presence indicator | Presence | Wired | BreathingGlow on all entry points |
| Badge preference (discreet/numeric) | Presence | Wired | localStorage toggle |
| Sort tab items with destination badges | Screen 3 | Wired | task/list/widget/tracker badges |
| Sort tab ordering (requests → meetings → date) | Screen 3 | Wired | |
| Calendar tab pending event cards | Screen 2 | Wired | Approve / Edit & Approve / Reject |
| Calendar tab Approve all bulk | Screen 2 | Wired | Gradient button |
| Calendar status bug fixed | Bug | Wired | 'pending' → 'pending_approval' in 3 files |
| Requests tab placeholder | Screen 4 | Stubbed | PRD-15 dependency |
| [Configure] → TaskCreationModal pre-populated | Screen 8 | Wired | Source-adaptive |
| [Add to list] → ListPickerModal | Screen 3 | Wired | Search, create new, batch support |
| [Dismiss] with optional note | Screen 3 | Wired | DismissConfirm modal |
| Batch grouping (Group/All/Expand) | Screen 3 | Wired | BatchCard |
| Quick Mode (name + assign + when) | Screen 7 | Wired | Schedule passthrough |
| Full Mode (7 sections) | Screen 7 | Wired | Toggle preserved |
| RoutingStrip universal component | Screen 6 | Wired | 15+ destinations, context filtering |
| Sub-destination drill-down | Screen 6 | Wired | Inline expansion |
| Routing toast with 5s undo | Screen 6 | Wired | RoutingToastProvider |
| Per-tab empty states | Screens 2-4 | Wired | Correct icons + copy |
| Global "All caught up!" state | Screen 5 | Wired | Sparkles, warm copy |
| studio_queue authoritative schema | Data | Wired | Full PRD-17 schema |
| Role-scoped visibility | Visibility | Wired | Mom all, Dad own, Teen requests |
| useCanAccess hooks | Tier | Wired | Returns true during beta |
| RoutingToastProvider on Adult/Independent shells | PRD-17 | Wired | |
| Shared task visibility via task_assignments | PRD-09A/17 | Wired | |
| Notification auto-dismiss | PRD-17 | Stubbed | PRD-15 not built |
| Widget/Tracker creation from Sort | PRD-17 | Stubbed | PRD-10 stubs |
| MindSweep columns/sources/tile | PRD-17B | Stubbed | Deferred |
| LiLa suggestion hints on queue cards | PRD-17 | Stubbed | Post-MVP |
| Real-time concurrent processing | PRD-17 | Stubbed | Post-MVP |
| Settings page badge preference toggle | PRD-17 | Stubbed | PRD-22 |
| E2E Playwright tests (24 passing) | Testing | Wired | 2 spec files |

### Summary
- Total: 37
- Wired: 30
- Stubbed: 7
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
