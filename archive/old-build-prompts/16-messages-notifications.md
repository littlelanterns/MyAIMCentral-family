# Build Prompt 16: Messages, Requests & Notifications

## PRD Reference
- PRD-15: `prds/communication/PRD-15-Messages-Requests-Notifications.md`

## Prerequisites
- Phase 06 (LiLa Core AI System) complete

## Objective
Build the three-level messaging system (spaces, threads, messages) for family communication, including LiLa message coaching that helps younger members improve their communication before sending. Build the Content Corner for sharing curated content, Out of Nest tracking for members away from home, family requests with approval workflows, and the notification infrastructure that delivers alerts across the platform. This is the communication backbone for the entire family platform.

## Database Work
Create tables:
- `conversation_spaces` — Top-level communication spaces (e.g., "Family Chat", "Mom & Dad", "Kids Room")
- `conversation_space_members` — Members assigned to each space with role permissions
- `conversation_threads` — Threads within spaces for organized discussions
- `messages` — Individual messages with content, sender, thread, attachments, coaching status
- `message_read_status` — Per-member read tracking for messages
- `messaging_settings` — Family-wide messaging configuration (coaching requirements, content filtering)
- `member_messaging_permissions` — Per-member permissions for messaging (who can message whom, hours restrictions)
- `message_coaching_settings` — Configuration for LiLa coaching by member role/age (mandatory vs optional, coaching intensity)
- `family_requests` — Structured requests from members to parents (permission requests, purchase requests, schedule changes)
- `notifications` — Platform-wide notification records with type, recipient, read status, action URL
- `notification_preferences` — Per-member notification settings (channels, quiet hours, category toggles)
- `out_of_nest_members` — Tracking for members currently away from home (location description, expected return, check-in status)

Enable RLS on all tables. Members see only spaces they belong to; mom has oversight of all messaging.

## Component Work
- Conversation spaces list — Browse and select communication spaces
- Thread view — Messages within a thread with real-time updates (Supabase Realtime)
- Message composer — Text input with attachments, emoji, and coaching integration
- LiLa message coaching — Pre-send review for guided/independent members; suggests improvements before sending
- Content Corner — Curated content sharing space (links, articles, media) with family discussion
- Out of Nest — Status board showing members currently away, with check-in prompts
- Family requests — Structured request forms (permission, purchase, schedule) with mom approval workflow
- Notification center — Bell icon with dropdown showing recent notifications, mark-as-read
- Notification preferences — Settings panel for per-category, per-channel notification control
- Unread badges — Real-time unread counts on sidebar navigation items

## Edge Function Work
- `coach-message` — AI reviews draft message and provides coaching suggestions for tone, clarity, kindness
- `send-notification` — Dispatches notifications across channels (in-app, push, email) based on member preferences

## Testing Checklist
- [ ] Messages send and appear in real-time for all space members
- [ ] LiLa coaching reviews messages before send for guided members
- [ ] Message coaching is optional for independent members and disabled for adults
- [ ] Family requests go through approval workflow and notify mom
- [ ] Notifications appear in notification center with correct routing
- [ ] Out of Nest status updates and check-in reminders work
- [ ] Content Corner allows sharing and discussing curated content
- [ ] RLS prevents members from seeing spaces they are not assigned to

## Definition of Done
- All PRD-15 MVP items checked off
- Three-level messaging (spaces/threads/messages) fully functional
- Coaching pipeline operational for guided and independent roles
- Notification infrastructure delivering across in-app channel
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
