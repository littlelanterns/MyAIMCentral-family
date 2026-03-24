# Build Prompt 31: Caregiver Tools

## PRD Reference
- PRD-27: `prds/platform-complete/PRD-27-Caregiver-Tools.md`
- Addendum: `prds/addenda/PRD-27-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 02 (Permissions & Access Control) complete
- Phase 05 (Universal Scheduler & Timer) complete

## Objective
Build the caregiver experience: a single-page CaregiverLayout with two views (Caregiver View with column-based information and Kid View dashboard), trackable events (mom-configured per child), shift reports (LiLa-compiled or manual), and co-parent experience (custody-schedule-gated or always-on, no shift UI for co-parents). This is a Lean-Medium phase.

## Database Work
Create tables:
- `trackable_event_categories` — Mom-configured event categories per child (e.g., meals, naps, medications, diapers)
- `trackable_event_logs` — Individual event log entries with category, child, timestamp, notes, logged-by member
- `shift_reports` — Shift report records with start/end time, LiLa-compiled or manual narrative, child coverage, handoff notes

Enable RLS on all tables. Caregivers see only children they are assigned to. Mom configures categories and reviews all reports. Co-parents access is gated by custody schedule or always-on setting.

## Component Work
### CaregiverLayout
- Single-page layout — Dedicated caregiver experience, no deep navigation required
- Caregiver View — Column-based display: today's schedule, trackable events log, notes, upcoming items
- Kid View — Simplified child dashboard showing current tasks, routines, and status for the caregiver to reference

### Trackable Events
- Event category management — Mom configures event categories per child (add, edit, remove, reorder)
- Event logging — Quick-log events with category, timestamp (defaults to now), and optional notes
- Event history — Scrollable history of logged events filtered by child and category

### Shift Reports
- LiLa-compiled report — Auto-generate shift summary from logged events, task completions, and notes during shift window
- Manual report — Free-text shift report entry for caregivers who prefer manual handoff
- Report history — View past shift reports with date filtering

### Co-Parent Experience
- Custody-schedule-gated access — Co-parent sees full dashboard only during their custody windows (or always-on if configured)
- No shift UI — Co-parents do not see shift report functionality; they get direct dashboard access

## Testing Checklist
- [ ] CaregiverLayout renders single-page with Caregiver View and Kid View toggle
- [ ] Caregiver View displays columns: schedule, events, notes
- [ ] Kid View shows child's simplified dashboard
- [ ] Mom can configure trackable event categories per child
- [ ] Caregiver can log events with category, time, and notes
- [ ] Event history filters by child and category
- [ ] LiLa-compiled shift report generates from shift activity
- [ ] Manual shift report saves and displays
- [ ] Co-parent access respects custody schedule gating
- [ ] Co-parent experience does not show shift report UI
- [ ] RLS restricts caregiver to assigned children only

## Definition of Done
- All PRD-27 MVP items checked off
- CaregiverLayout operational with both views
- Trackable events fully functional with mom-configured categories
- Shift reports (both LiLa-compiled and manual) working
- Co-parent experience correctly gated by custody schedule
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
