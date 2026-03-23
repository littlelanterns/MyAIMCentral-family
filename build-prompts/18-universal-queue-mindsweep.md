# Build Prompt 18: Universal Queue & MindSweep

## PRD Reference
- PRD-17: `prds/communication/PRD-17-Universal-Queue-Routing-System.md`
- PRD-17B: `prds/communication/PRD-17B-MindSweep.md`

## Prerequisites
- Phase 10 (Tasks, Lists, Studio & Templates) complete
- Phase 16 (Messages, Requests & Notifications) complete

## Objective
Build the Universal Queue Modal as the central triage interface for processing incoming items across the platform, with tabs for Calendar, Sort, and Requests. Build the RoutingStrip component for quick item-level routing decisions. Implement batch processing for handling multiple items efficiently. Build MindSweep as a multi-modal capture tool (voice, text, scan, email forwarding) that dumps raw thoughts into a holding area for later sorting, with auto-routing powered by AI and an email forwarding pipeline that creates items from forwarded emails.

## Database Work
Extend/create tables:
- `studio_queue` — Extend existing table with routing metadata, source tracking (mindsweep, email, scan), batch identifiers
- `mindsweep_settings` — Per-member MindSweep configuration (default capture mode, auto-route confidence threshold, email forwarding address)
- `mindsweep_holding` — Raw captured items awaiting sort/route (text content, source type, capture timestamp, routing suggestion)
- `mindsweep_allowed_senders` — Approved email addresses that can forward to MindSweep inbox
- `mindsweep_events` — Audit log of MindSweep capture and routing events
- `mindsweep_approval_patterns` — Learned patterns for auto-routing based on user approval history

Enable RLS on all tables. Members manage their own MindSweep items; mom can view all queue items.

## Component Work
- Universal Queue Modal — Tabbed modal accessible from multiple entry points (sidebar, dashboard, notifications)
  - Calendar tab — Incoming calendar-related items for scheduling
  - Sort tab — Unsorted items requiring routing to destination (task, list, event, journal, archive)
  - Requests tab — Pending family requests awaiting approval
- RoutingStrip component — Inline routing controls for individual items (destination selector, quick actions, dismiss)
- Batch processing — Select multiple items and apply bulk routing, categorization, or dismissal
- MindSweep capture — Multi-modal input interface
  - Voice capture — Speak thoughts, transcribed to text items
  - Text capture — Quick text entry with auto-split into individual items
  - Scan capture — Camera/upload to extract text from photos
  - Email capture — Unique forwarding address per member; inbound emails parsed into items
- Auto-routing — AI suggests routing destination based on content analysis and learned patterns
- MindSweep sort view — Review captured items with routing suggestions, approve/override/dismiss

## Edge Function Work
- `mindsweep-sort` — Analyzes captured items and suggests routing destinations based on content and user patterns
- `mindsweep-email-inbound` — Webhook receiver for forwarded emails; parses content into holding items

## Testing Checklist
- [ ] Universal Queue Modal opens with Calendar, Sort, and Requests tabs populated correctly
- [ ] RoutingStrip routes items to correct destinations (task, list, event, journal, archive)
- [ ] Batch processing applies routing to multiple selected items
- [ ] MindSweep voice capture transcribes and creates holding items
- [ ] MindSweep text capture auto-splits multi-line input into separate items
- [ ] Email forwarding creates holding items from inbound emails
- [ ] Auto-routing suggests correct destinations with reasonable confidence
- [ ] Learned routing patterns improve suggestions over time

## Definition of Done
- All PRD-17 and PRD-17B MVP items checked off
- Universal Queue Modal functional with all three tabs
- MindSweep capture working for voice, text, scan, and email modes
- Auto-routing producing suggestions with user approval/override flow
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
