# Build Prompt 17: Meetings

## PRD Reference
- PRD-16: `prds/communication/PRD-16-Meetings.md`

## Prerequisites
- Phase 10 (Tasks, Lists, Studio & Templates) complete
- Phase 16 (Messages, Requests & Notifications) complete

## Objective
Build the Meetings system for structured family meetings with agenda management, LiLa facilitation support, and integration with other platform features. Meeting types include family meetings, one-on-ones, and check-ins. Action items generated during meetings route to the Studio Queue as tasks, and meeting summaries automatically save to Journal entries for future reference.

## Database Work
Create tables:
- `meetings` — Meeting records with type, title, date/time, status (scheduled/active/completed), facilitator, summary
- `meeting_participants` — Members attending each meeting with attendance status
- `meeting_schedules` — Recurring meeting schedules (RRULE-based) linked to meeting templates
- `meeting_templates` — Reusable meeting structures with default agenda, duration, participant roles
- `meeting_template_sections` — Ordered sections within a meeting template (check-in, agenda, action items, closing)
- `meeting_agenda_items` — Individual agenda items with title, description, time allocation, discussion notes, owner

Enable RLS on all tables. Participants see meetings they are part of; mom can manage all meetings.

## Component Work
- Meeting list — Upcoming and past meetings with quick-start and schedule actions
- Meeting creation — Select type, template, participants, schedule (one-time or recurring)
- Meeting templates — Create and manage reusable meeting structures with section order
- Active meeting view — Live agenda with timer per item, note-taking, LiLa facilitation prompts
- LiLa facilitation — AI-generated discussion prompts, transition cues, time warnings during active meetings
- Action item capture — During meetings, create action items that route to Studio Queue as tasks
- Meeting summary — Auto-generated summary from agenda notes; saves to Journal
- Meeting history — Browse completed meetings with summaries and action item status

## Edge Function Work
- `generate-meeting-summary` — Produces meeting summary from agenda notes and discussion content
- `meeting-facilitation` — Provides LiLa facilitation prompts based on meeting type and agenda progress

## Testing Checklist
- [ ] Meeting creation with template populates agenda sections correctly
- [ ] Recurring meetings generate future instances based on RRULE schedule
- [ ] Active meeting view tracks time per agenda item
- [ ] LiLa facilitation provides contextual prompts during active meetings
- [ ] Action items created during meetings appear in Studio Queue as tasks
- [ ] Meeting summary auto-generates and saves to Journal
- [ ] Meeting participants receive notifications for upcoming meetings

## Definition of Done
- All PRD-16 MVP items checked off
- Meeting lifecycle (create, start, conduct, complete) fully functional
- Action items routing to Studio Queue verified
- Meeting summaries saving to Journal verified
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
