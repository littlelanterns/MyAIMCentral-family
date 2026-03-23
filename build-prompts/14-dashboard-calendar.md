# Build Prompt 14: Personal Dashboard & Calendar

## PRD Reference
- PRD-14: `prds/dashboards/PRD-14-Personal-Dashboard.md`
- PRD-14B: `prds/dashboards/PRD-14B-Calendar.md`

## Prerequisites
- Phase 05 (Universal Scheduler & Timer) complete
- Phase 10 (Tasks, Lists, Studio & Templates) complete
- Phase 11 (Widgets, Trackers & Dashboard Layout) complete

## Objective
Build the Personal Dashboard as the primary landing experience for each member, using a hybrid section/widget layout where fixed sections (greeting, today's focus, quick actions) combine with the configurable widget grid from Phase 11. Build the Calendar system with event CRUD, an approval queue for events proposed by non-mom members, OCR intake for scanning paper schedules, and the Universal Queue Modal for triaging incoming items.

## Database Work
Create tables:
- `calendar_events` — Event records with title, description, start/end times, recurrence (RRULE), location, category, creator, approval status
- `event_attendees` — Many-to-many linking events to family members with RSVP status
- `event_categories` — Custom and default event categories with color coding
- `calendar_settings` — Per-member calendar preferences (default view, week start day, working hours, notification lead times)

Enable RLS on all tables. Members see events they attend or created; mom sees all family events.

## Component Work
- Personal Dashboard layout — Hybrid sections (greeting, today's agenda, quick actions, rhythm status) plus widget grid area
- Dashboard section renderer — Fixed sections that pull from tasks, calendar, rhythms, victories
- Calendar views — Day, week, month, agenda list views with responsive behavior
- Event CRUD — Create/edit/delete events with recurrence, attendees, categories, reminders
- Approval queue — Events proposed by children/teens require mom approval; pending state visible to proposer
- OCR intake — Camera/upload flow that extracts event details from photos of paper schedules
- Universal Queue Modal — Tabbed modal (Calendar tab, Sort tab, Requests tab) for processing incoming items
- Calendar widget — Dashboard widget showing upcoming events
- Quick Add event — Minimal-field event creation from dashboard or calendar

## Edge Function Work
- `ocr-calendar-intake` — Processes uploaded images to extract event data (dates, times, titles) using AI vision

## Testing Checklist
- [ ] Personal Dashboard renders greeting, today's agenda, and widget grid
- [ ] Calendar displays events in day, week, month, and agenda views
- [ ] Event creation with recurrence generates correct future occurrences
- [ ] Approval queue shows pending events for mom; approved events appear on all attendee calendars
- [ ] OCR intake extracts event details from a photo of a school schedule
- [ ] Universal Queue Modal opens with correct tabs and processes items
- [ ] Calendar settings (week start, default view) persist and apply
- [ ] RLS prevents cross-family event access

## Definition of Done
- All PRD-14 and PRD-14B MVP items checked off
- Dashboard hybrid layout rendering correctly per role
- Calendar fully functional with recurrence and approval queue
- Universal Queue Modal operational with Calendar tab
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
