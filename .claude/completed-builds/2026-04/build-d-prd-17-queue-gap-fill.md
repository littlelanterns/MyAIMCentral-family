# Build D: PRD-17 Universal Queue & Routing System (Gap-Fill) — COMPLETED

### PRD Files
- `prds/communication/PRD-17-Universal-Queue-Routing-System.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-17-Universal-Queue-Routing.md`

---

### Pre-Build Summary

#### Context
PRD-17 is the central routing infrastructure — the "sorting station" where items from brain dumps, meetings, LiLa, kid requests, and goals land in one unified inbox. Mom opens the Review Queue modal, processes everything, closes it. This is critical infrastructure that PRD-17B (MindSweep) sits directly on top of.

**~75% of PRD-17 was already built** across earlier phases (PRD-14B, PRD-09A, PRD-08, PRD-14C). This session fills the remaining gaps to make the queue fully functional before MindSweep.

#### Dependencies Already Built
- UniversalQueueModal with 3 tabs, badge counts, "All caught up!" state
- SortTab with studio_queue items, QueueCard, BatchCard (Send as Group / Process All / Expand / Dismiss)
- RoutingStrip with 15+ destinations, context filtering, sub-destination drill-down
- BreathingGlow presence indicator component
- studio_queue table with full PRD-17 schema, RLS, indexes
- useStudioQueue hooks (items, count, batched, role-scoped)
- TaskCreationModal Quick Mode / Full Mode toggle with pre-population
- RoutingToastProvider with 5-second undo
- TaskRouteHandler (notepad → studio_queue)
- PendingItemsBar entry point (Family Overview)
- Feature keys registered (studio_queue, queue_modal, queue_quick_mode, routing_strip, queue_batch_processing)
- Badge style preference (glow/numeric, localStorage)
- RequestsTab stub with empty state (PRD-15 dependency)
- EventCreationModal for calendar event editing (PRD-14B)

#### Dependencies NOT Yet Built
- PRD-15 (Messages, Requests & Notifications) — RequestsTab stays stub
- PRD-16 (Meetings) — meeting_action source stays stub
- PRD-17B (MindSweep) — columns/sources not added yet

#### Build Items (Gap-Fill — 7 items)

**1. QuickTasks "Review Queue" click → opens modal**
- Change the indicator click handler from "toggle mode" to "open UniversalQueueModal"
- QuickTasks needs to import and render UniversalQueueModal
- BreathingGlow on the Inbox icon when any tab has pending items
- When modal is open, indicator remains visible but non-interactive
- Mode toggle (glow/numeric) moves to long-press or is removed (toggle exists in PendingItemsBar already)

**2. CalendarTab wired to real pending events**
- Query `calendar_events WHERE status='pending' AND family_id = currentFamilyId`
- Render approval cards with: event title, date/time, location, submitter (avatar + name via created_by)
- Transportation needs indicator if applicable
- Source indicator if from image/Route
- **Approve** — sage teal bg, sets status='approved', approved_by, approved_at
- **Edit & Approve** — soft gold bg, opens EventCreationModal in edit mode, saves as approved
- **Reject** — light blush bg, dropdown with optional rejection note, sets status='rejected'
- **Approve all (N)** — gradient button at bottom when N > 1
- Empty state: CalendarCheck icon + "No events waiting for approval."
- All colors from theme tokens

**3. List picker from Sort tab**
- When a studio_queue item has `destination='list'`, the [Add to list] button opens a list picker overlay
- List picker shows: existing family lists (filtered by owner), option to create new list
- On selection: add item content as `list_items` record in chosen list, set `studio_queue.processed_at`
- For batch items with destination='list': "Send as Group" adds all items to the same list
- Critical for MindSweep readiness — shopping items need clean list routing

**4. Dashboard queue indicator**
- Add a queue pending indicator somewhere visible on Dashboard (personal view)
- Breathing glow or badge that opens UniversalQueueModal on click
- Only visible to mom/primary_parent (and permitted additional_adults)
- Uses useStudioQueueCount + pending calendar events count

**5. Tasks page queue badge**
- Add badge indicator on Tasks page that opens modal to Sort tab
- Shows count of pending studio_queue items
- Breathing glow when items exist

**6. Calendar page queue badge**
- Add badge indicator on Calendar page that opens modal to Calendar tab
- Shows count of pending calendar events
- Breathing glow when events await approval

**7. TypeScript check**
- `tsc -b` — zero errors before declaring complete

### Stubs (NOT Building This Phase)
- Notification auto-dismiss on queue processing (PRD-15 not built)
- Notification creation on approve/reject (PRD-15 not built)
- Settings page badge preference toggle (PRD-22)
- Widget/Tracker creation from Sort tab (PRD-10 stubs already in place)
- Goal decomposition → studio_queue (future PRD)
- LiLa destination suggestion hints on queue cards (post-MVP)
- Real-time concurrent processing indicators (post-MVP)
- MindSweep columns/sources/tile (PRD-17B — do not add yet)
- RequestsTab full implementation (PRD-15 — stub already correct)
- Keyboard shortcuts / swipe gestures (post-MVP)

### Key Decisions
1. **QuickTasks click = open modal** — this is the #1 priority. Mom's primary daily entry point.
2. **CalendarTab connects to existing EventCreationModal** for "Edit & Approve" — no new modal.
3. **List picker is essential for MindSweep readiness** — shopping items need list routing, not task routing.
4. **No new migration needed** — all tables and columns already exist.
5. **Stubs stay stubs** — RequestsTab, notification auto-dismiss, MindSweep columns are all correctly deferred.
6. **BreathingGlow already works** — just needs to be connected to more entry points.

---

