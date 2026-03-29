# RLS Verification Matrix

Per-table, per-role access verification. Run after each build phase.

**Access Level Shorthand:**
- ✅ Full — CRUD on own/family data
- 👀 Read — Read-only access
- 🔒 Scoped — Access filtered by permissions (member_permissions, access_schedules)
- ❌ None — No access
- 👑 All — Unrestricted within family (mom only)

| Table | Mom | Dad/Adult | Special Adult | Independent Teen | Guided/Play | RLS Policy Name | Verified | Notes |
|-------|-----|-----------|---------------|-----------------|-------------|-----------------|----------|-------|
| families | 👑 | 👀 | 👀 | 👀 | 👀 | | | |
| family_members | 👑 | 🔒 | 🔒 | 👀 own | 👀 own | | | |
| event_categories | 👑 CRUD (custom) | 👀 | 👀 | 👀 | 👀 | event_categories_select, _insert/update/delete_primary_parent | 2026-03-28 | System cats (family_id IS NULL) readable by all incl. anon (W-1). is_system guard prevents modifying seeds. |
| calendar_events | 👑 All | ✅ Own + view family | ✅ Own + view family | ✅ Own (pending) + view approved | 👀 approved only | calendar_events_select/insert/update/delete | 2026-03-28 | W-2: pending_approval visible to Guided/Play (should restrict). W-3: INSERT doesn't enforce status for non-mom. |
| event_attendees | 👑 All | 👀 family events | 👀 family events | 👀 family events | 👀 family events | event_attendees_select/insert/update/delete | 2026-03-28 | E-1: SELECT doesn't mirror calendar_events visibility. Non-mom can see attendees for events they can't see. |
| calendar_settings | 👑 CRUD | 👀 | 👀 | 👀 | 👀 | calendar_settings_select/insert/update | 2026-03-28 | OK. No DELETE policy (blocked by default). UNIQUE(family_id). |
| | | | | | | | | |

---

## Calendar RLS Issues (2026-03-28)

| ID | Severity | Table | Description | Fix |
|----|----------|-------|-------------|-----|
| W-1 | Warning | event_categories | System categories (family_id IS NULL) readable by unauthenticated users | Likely intentional per PRD ("public read"). Confirm with founder. |
| W-2 | Warning | calendar_events | pending_approval events visible to ALL roles including Guided/Play children | Change SELECT arm 1 from `IN ('approved','pending_approval')` to `= 'approved'` |
| W-3 | Warning | calendar_events | INSERT policy doesn't enforce `status = 'pending_approval'` for non-primary-parent | Add CHECK constraint or policy condition on status column |
| E-1 | Error | event_attendees | SELECT bypasses calendar_events visibility rules — non-mom can see attendees for rejected/cancelled events | Mirror the calendar_events visibility logic in attendee SELECT policy |
