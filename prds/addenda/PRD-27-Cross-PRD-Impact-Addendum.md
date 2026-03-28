# PRD-27 Cross-PRD Impact Addendum: Caregiver Tools

**Created:** March 17, 2026
**Source PRD:** PRD-27 (Caregiver Tools)

---

## Purpose

This addendum documents all changes to existing PRDs required by the Caregiver Tools PRD. These changes will be reconciled by Claude Code in a single coordinated sweep during the pre-build audit, not piecemeal.

---

## Impacted PRDs

### PRD-04: Shell Routing & Layouts

| Section | Change | Details |
|---------|--------|---------|
| Shell Routing Logic table | **UPDATE** Special Adult row | Change: `special_adult → Scoped AdultLayout or purpose-built CaregiverLayout` to: `special_adult → CaregiverLayout`. Remove the "open question" note. |
| Shell Behavior: Special Adult | **REPLACE** description | Replace: "Same as Adult but sidebar only shows features for assigned children during active shifts. No perspectives. No LiLa access of any kind." With: "Purpose-built `CaregiverLayout`. Single page with two views: Caregiver View (swipeable child columns with trackable items + shift log) and Kid View (child's full dashboard in child's theme). No sidebar, no drawers, no LiLa, no personal features. Messages via slide-up panel. See PRD-27 for full specification." |
| Deferred #1 | **MARK** as resolved | "Special Adult shell layout (full Adult shell vs purpose-built minimal layout)" — resolved by PRD-27: purpose-built `CaregiverLayout`. |
| Edge Cases: Special Adult Shift Expiry | **UPDATE** | Add: "Co-parents with `schedule_type = 'always_on'` never see the shift expiry message. Co-parents with custody schedules see a gentle banner when their access window ends, with a 5-minute grace period for active interactions." |

### PRD-02: Permissions & Access Control

| Section | Change | Details |
|---------|--------|---------|
| Screen 3: Special Adult Permission Config | **ADD** Section 5: Trackable Events | Add a new section to the Special Adult configuration screen: "Section 5: **Trackable Events** — Mom configures custom trackable event categories per child. Links to PRD-27 Screen 4 (Trackable Event Category Configuration). Preset bundles available: Infant, Toddler, Special Needs, School Age, Medical." |
| Screen 6: Special Adult Shift View | **MARK** as fully specified | Add note: "The complete caregiver shift experience is defined in PRD-27. Screen 6 here provides the conceptual framework; PRD-27 Screens 1-3 provide the full implementation specification including the two-view model, swipeable columns, trackable event logging, shift log, Kid View, and co-parent experience." |
| AI Integration: Shift Summary Compilation | **ENHANCE** | Add: "PRD-27 extends shift compilation to support custom date-range reports (mom-initiated). Mom can generate aggregated or chronological reports across multiple shifts, filtered by caregiver and/or child. See PRD-27 Screen 5 and `shift_reports` table." |
| Data Schema | **ADD** table reference | Add reference to PRD-27's new tables: `trackable_event_categories`, `trackable_event_logs`, `shift_reports`. These are defined in PRD-27, not PRD-02, but are closely related to the permission/shift infrastructure. |
| Data Schema: `shift_sessions` | **ADD** column | Add `is_co_parent_session` BOOLEAN DEFAULT false. For co-parent activity logging where no shift start/end exists. Auto-created daily for always-on co-parents. |
| Forward note (co-parent pattern) | **MARK** as fully wired | "The Special Adult role with broader permissions + an always-on recurring shift schedule architecturally supports a co-parent or live-in nanny use case" — now fully implemented in PRD-27 with `schedule_type = 'always_on'` on `access_schedules` (PRD-35) and the no-shift-UI co-parent experience. |
| Feature Key Registry | **ADD** keys | Add to the feature key registry table: `caregiver_trackable_events` (Enhanced), `caregiver_shift_reports` (Full Magic), `caregiver_custody_schedule` (Full Magic), `caregiver_messaging` (Enhanced). |

### PRD-10: Widgets, Trackers & Dashboard Layout

| Section | Change | Details |
|---------|--------|---------|
| Screen 6: Special Adult Child-Widget View | **ADD** cross-reference | Add note: "This screen defines the widget rendering contract for caregiver interaction. PRD-27 wraps this as 'Kid View' — the child's full dashboard rendered for caregiver use. All widget interactions during Kid View create standard data records tagged with `shift_session_id`. Celebrations fire using the child's active theme." |
| Edge Cases: Special Adult Shift Ends Mid-Interaction | **UPDATE** | Add co-parent note: "Co-parents with custody-schedule access see a 5-minute grace period banner instead of immediate cutoff. Always-on co-parents never see this message." |
| Co-parent use case section | **ADD** cross-reference | Add: "The co-parent use case described here is fully implemented in PRD-27. Co-parents use `schedule_type = 'always_on'` on `access_schedules` (PRD-35). No shift UI required." |

### PRD-15: Messages, Requests & Notifications

| Section | Change | Details |
|---------|--------|---------|
| Data Schema: `conversation_threads.thread_type` enum | **ADD** value `'caregiver'` | For caregiver ↔ mom messaging threads. |
| Conversation thread creation | **ADD** auto-creation rule | When a Special Adult is assigned to a family (PRD-01) and granted messaging permission, a `caregiver` thread is auto-created between the caregiver and the primary parent. Thread persists across shifts. |
| Visibility rules | **ADD** caregiver scoping | Caregivers can only see threads of type `'caregiver'` where they are a participant. They cannot see family threads, couple threads, or any other thread type. |
| Co-parent messaging note | **ADD** | "Co-parent messaging is always available regardless of access window status. The custody schedule gates child data access only, not adult-to-adult communication." |

### PRD-25: Guided Dashboard

| Section | Change | Details |
|---------|--------|---------|
| Rendering context | **ADD** note | "The Guided Dashboard renders inside the caregiver's Kid View (PRD-27 Screen 2) when a caregiver taps a Guided child's name button. All interactions are identical to the child's own experience. Actions are tagged with `shift_session_id` for audit trail." |

### PRD-26: Play Dashboard

| Section | Change | Details |
|---------|--------|---------|
| Rendering context | **ADD** note | "The Play Dashboard renders inside the caregiver's Kid View (PRD-27 Screen 2) when a caregiver taps a Play child's name button. All interactions are identical to the child's own experience. Actions are tagged with `shift_session_id` for audit trail." |

### PRD-01: Auth & Family Setup

| Section | Change | Details |
|---------|--------|---------|
| Stubs: Special Adult "what they can see" scoping | **MARK** as fully wired | "Wires to PRD-02 (Permissions) + PRD-27 (Caregiver Tools). PRD-27 implements the complete caregiver experience including Caregiver View, Kid View, trackable events, shift logging, and co-parent access patterns." |

### PRD-03: Design System & Themes

| Section | Change | Details |
|---------|--------|---------|
| Member color usage | **ADD** note | "Member colors are used as header button fills in the caregiver's child column view (PRD-27 Screen 1). Each child's column header is a button rendered in that child's assigned family member color, providing quick visual identification for caregivers managing multiple children." |

---

## New Tables Summary

PRD-27 introduces three new tables that should be added to DATABASE_SCHEMA.md:

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `trackable_event_categories` | Mom-defined tracking categories per child (ate lunch, potty trip, took meds, etc.) | FK → families, FK → family_members (child) |
| `trackable_event_logs` | Individual timestamped entries when a caregiver marks a trackable event | FK → trackable_event_categories, FK → family_members (child), FK → family_members (caregiver), FK → shift_sessions |
| `shift_reports` | Compiled shift or date-range reports generated by LiLa | FK → families, FK → family_members (generator), FK → shift_sessions (optional) |

---

## Enum Updates Summary

| Table.Column | New Value | Added By |
|-------------|-----------|----------|
| `shift_sessions.started_by` | `'auto_custody'` | PRD-27 (co-parent auto-sessions) |
| `conversation_threads.thread_type` | `'caregiver'` | PRD-27 (caregiver ↔ mom messaging) |
| `activity_log_entries.source` | `'trackable_event'` | PRD-27 (trackable event logging) |

---

## Trigger Summary

| Trigger | Table | Behavior |
|---------|-------|----------|
| Trackable event → activity log | `trackable_event_logs` AFTER INSERT | Creates an `activity_log_entries` record with `source = 'trackable_event'`, `family_id`, `member_id` (child), `shift_session_id`, and event details. |

---

## Summary

| PRD | Impact Level | Changes |
|-----|-------------|---------|
| PRD-04 | High | Shell layout decision resolved, shell routing table updated, deferred item closed |
| PRD-02 | High | Trackable events section added, shift compilation enhanced, co-parent pattern fully wired, new column added, feature keys registered |
| PRD-10 | Low | Cross-references added, co-parent use case confirmed |
| PRD-15 | Medium | New thread type, auto-creation rule, visibility scoping, co-parent messaging note |
| PRD-25 | Low | Kid View rendering context note added |
| PRD-26 | Low | Kid View rendering context note added |
| PRD-01 | Low | Stub marked as fully wired |
| PRD-03 | Low | Member color usage note added |

---

*End of PRD-27 Cross-PRD Impact Addendum*
