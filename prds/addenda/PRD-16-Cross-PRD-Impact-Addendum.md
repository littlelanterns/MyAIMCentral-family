# PRD-16 Cross-PRD Impact Addendum

**Created:** March 11, 2026
**Session:** PRD-16 (Meetings)
**Purpose:** Documents how PRD-16 decisions affect prior PRDs and establishes new patterns.

---

## Impact on PRD-08 (Journal + Smart Notepad)

**What changed:**
- "Send to → Agenda" routing stub fully wired. The inline meeting picker overlay is now populated from `meeting_schedules` data, showing upcoming meetings with agenda capability. Selecting a meeting creates a `meeting_agenda_items` record with `source = 'notepad_route'`.
- "Agenda routing stub" from PRD-08's Stubs Created section is now fully wired.
- `journal_entries.entry_type` gains `'meeting_notes'` as a new value. Meeting summaries auto-save to Journal on meeting completion.
- `journal_entries.source` gains `'meeting'` as a new value.

**Action needed:**
- Mark "Agenda routing (adds item to meeting agenda)" stub as WIRED in PRD-08's Stubs section.
- Add `'meeting_notes'` to the `entry_type` enum documentation.
- Add `'meeting'` to the `source` enum documentation.
- Update the Send To destination count if it's referenced as "14 destinations" — Agenda was already counted, so no count change needed.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- The `meeting` guided mode, which was registered but unspecified in PRD-05, is now fully defined with:
  - Subtype parameter (meeting type: couple, family_council, mentor, etc.)
  - Full context assembly specification (recent meetings, pending agenda items, customized sections, InnerWorkings, Guiding Stars, Best Intentions, victories, task patterns, Vision Quest data, Communication Guidelines)
  - Two behavioral modes: Live (facilitative) and Record After (retrospective capture)
  - Facilitator-aware behavior for family council meetings
  - System prompt behavioral notes

**Action needed:**
- Update the guided mode registry in PRD-05 or Build Order Source of Truth Section 9 to reflect full specification status.
- Note meeting context sources in the context assembly pipeline documentation.

---

## Impact on PRD-09A / PRD-09B (Tasks & Studio Queue)

**What changed:**
- `studio_queue.source` value `'meeting_action'` is now fully wired. Post-meeting review routes action items to any member's Studio Queue with this source value. The `studio_queue` table is defined in PRD-09B; the queue processing UI is defined in PRD-09A.
- Meeting action items follow the universal queue pattern: they land as drafts in the Universal Queue Modal Tasks tab for full configuration before becoming real tasks.

**Action needed:**
- Confirm `'meeting_action'` exists in the `studio_queue.source` enum (it was already referenced in PRD-09B schema).
- Note meetings as an incoming source in the task flow documentation.

---

## Impact on PRD-14B (Calendar)

**What changed:**
- `calendar_events.source` gains `'meeting_schedule'` as a new value. Meeting schedules optionally create recurring calendar events linked via `source_reference_id` to `meeting_schedules.id`.
- Meeting completion marks the corresponding calendar event instance as completed.
- Calendar event reminders serve double duty as meeting reminders — no separate meeting reminder infrastructure.

**Action needed:**
- Add `'meeting_schedule'` to the `calendar_events.source` enum.
- Document the meeting schedule → calendar event linkage pattern.
- Note that calendar event completion can be triggered by meeting completion (not just manual user action).

---

## Impact on PRD-15 (Messages, Requests & Notifications)

**What changed:**
- `notifications.notification_type` gains three new values: `'meeting_reminder'`, `'meeting_completed'`, `'meeting_action_routed'`.
- `notifications.category` gains `'meetings'` as a new value. This means `notification_preferences` needs a 'meetings' category seeded for each member.
- `conversation_threads.source_type` gains `'meeting_summary'` for threads created via "Share to Messages" from the post-meeting review screen.
- Teens can request meetings via the PRD-15 Request system (existing functionality, no schema change — just a documented use case).

**Action needed:**
- Add three notification types to the enum documentation.
- Add 'meetings' to the notification category enum and ensure it's included in the default `notification_preferences` seeding for new family members.
- Add 'meeting_summary' to `conversation_threads.source_type` enum.

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- Meeting feature keys (`meetings_basic`, `meetings_shared`, `meetings_ai`, `meetings_custom_templates`, `meetings_facilitator_rotation`) need to be registered in the Feature Key Registry.
- Meeting permission model established: parents initiate meetings, dad's access to meeting types involving kids depends on his per-kid permission grants from mom, teens request meetings via PRD-15 Requests but cannot start them, Guided children can add agenda items (via "Things to Talk About") but cannot start or participate directly in meetings.
- Dad's meeting access for parent-child and mentor meetings follows the same per-kid permission model as task viewing — if dad doesn't have permission for a child's features, he can't start or participate in that child's mentor meeting.

**Action needed:**
- Add meeting feature keys to the Feature Key Registry.
- Note the meeting permission model in PRD-02's permission documentation (parents initiate, teens request, Guided contribute agenda items).
- Verify that dad's per-kid permission grants are compatible with meeting participant scoping.

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- Meetings added as a sidebar navigation item. Accessible to Mom, Dad, and Independent teens. Not present for Special Adults, Guided, or Play.
- The Meetings page needs shell-level routing configuration.

**Action needed:**
- Add "Meetings" to sidebar route configuration for Mom, Dad, and Independent shells.
- Verify routing config excludes Meetings from Special Adult, Guided, and Play shells.

---

## Impact on PRD-06 (Guiding Stars & Best Intentions)

**What changed:**
- Best Intentions is now a routing destination from meeting action items. An action item like "I'll be more patient about homework time" can be routed directly to Best Intentions from the post-meeting review screen.
- Guiding Stars is now a routing destination from meeting action items. An action item like "I want to make honesty my guiding principle" can be routed directly to Guiding Stars.
- Both Guiding Stars and Best Intentions data are loaded as AI context during meetings for alignment check-ins and commitment reviews.

**Action needed:**
- No schema changes needed. Note meetings as an incoming source for both Best Intentions and Guiding Stars in the PRD-06 flow documentation.

---

## Impact on PRD-11 (Victory Recorder & Daily Celebration)

**What changed:**
- Recent victories are loaded as AI context during mentor, parent-child, and family council meetings. LiLa references recent wins for celebration and encouragement.

**Action needed:**
- No schema changes needed. Note victory data as a context source consumed by the meeting system.

---

## Impact on PRD-12B (Family Vision Quest)

**What changed:**
- Family Vision Quest data (family vision statement, active vision sections) loaded as AI context during family council meetings. LiLa can reference the family's stated values and vision during family discussions.

**Action needed:**
- No schema changes needed. Note vision data as a context source consumed by the meeting system.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-16 (Meetings) completed with 6 tables: `meetings`, `meeting_participants`, `meeting_schedules`, `meeting_templates`, `meeting_template_sections`, `meeting_agenda_items`.
- `meeting` guided mode fully specified (was registered in PRD-05, now fully defined).
- 'meetings' established as a notification category.
- Meetings feature registered in the StewardShip-to-MyAIM feature name mapping (Meeting Frameworks → Meetings).

**Action needed:**
- Move PRD-16 to Section 2 (Completed PRDs) with table list.
- Register 6 new tables in the key DB tables column.
- Update Section 9 (Guided Modes) to show `meeting` mode as fully specified by PRD-16.
- Update Section 6 (Feature Name Changes) if needed.
- Add PRD-16 addendum to Section 2 addenda list.

---

## New Patterns Established

### Meeting-to-Queue Routing Pattern
Post-meeting action item routing follows the universal queue pattern. This establishes the precedent that ANY feature producing action items should route through the Studio Queue — never directly create tasks. Features that may follow this pattern in the future: Morning/Evening Rhythms, Safe Harbor action items, AI Vault recommended actions.

### Calendar Event Source Linkage Pattern
Meeting schedules create calendar events with `source = 'meeting_schedule'` and `source_reference_id` linking back to the schedule. This is a new pattern for features creating calendar events programmatically. Other features that may create calendar events (Goals, Routines, Morning Rhythm) should follow this `source` + `source_reference_id` pattern.

### Dual Ownership via Participants Table
The `meeting_participants` join table establishes the pattern for shared records where multiple family members need access to the same entity. The meeting record exists once; participants are linked via the join table. This pattern could be reused for any future shared entity (e.g., shared goals, shared projects).

### Compact Routing Strip Pattern
The post-meeting routing dropdown (Screen 4) is an instance of a compact routing strip — a focused subset of the Notepad's full 15-destination Send To grid, tailored to the most common routing destinations for the context. PRD-15's Requests accept flow uses the same pattern (Calendar, Tasks, List, Acknowledge). PRD-16 extends it with Best Intentions, Guiding Stars, and Goals. A future Universal Queue & Routing System PRD should consolidate this into a reusable component spec so all compact routing strips share the same UI component with context-appropriate destination filtering.

---

*End of PRD-16 Cross-PRD Impact Addendum*
