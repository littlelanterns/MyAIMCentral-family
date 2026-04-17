# Build G: PRD-15 Messages, Requests & Notifications

### PRD Files
- `prds/communication/PRD-15-Messages-Requests-Notifications.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-15-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md` (MindSweep cross-member routing)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-Template-and-Audit-Updates.md`
- `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-15-Messages-Requests-Notifications.md`

### Build Plan
`C:\Users\tenis\.claude\plans\structured-wibbling-riddle.md` — Founder-reviewed 5-phase plan.

---

### Pre-Build Summary

#### Context
PRD-15 defines the family communication backbone — three interconnected subsystems (Messages, Requests, Notifications) across 10 screens, 12 database tables, 11 feature keys, and 4 Edge Functions. This is the largest remaining PRD and every other feature depends on Notifications.

Only `out_of_nest_members` (migration 17, 4 rows) exists. `notifications` and `notification_preferences` exist in DB but are NOT API-exposed and have no migration file. All messaging tables and `family_requests` do NOT exist yet. `usePendingCounts.ts` query on `family_requests` silently fails (returns 0). `RequestsTab.tsx` is a stub. `MessagesPage` is a placeholder. No notification bell in any shell.

#### Dependencies Already Built
- out_of_nest_members table (migration 17, 4 rows, used in FamilySetup + ArchivesPage)
- RequestsTab.tsx stub in UniversalQueueModal
- MessagesPage placeholder at /messages route
- RoutingStrip 'message' destination (exists but no handler)
- QuickCreate "Send Request" action (falls back to Notepad)
- BreathingGlow component (src/components/ui/BreathingGlow.tsx)
- CalendarTab approve/reject handlers (ready for notification wiring)
- ListPickerModal, EventCreationModal, TaskCreationModal (for request accept routing)
- MemberPillSelector component
- ModalV2 component
- usePendingCounts.ts (queries family_requests, silently fails)
- _shared/context-assembler.ts, _shared/cost-logger.ts, _shared/cors.ts, _shared/auth.ts

#### Dependencies NOT Yet Built
- Supabase Realtime (first usage in codebase — verify enabled on project)
- Push notification infrastructure (post-MVP)
- Email delivery for Out of Nest (stub)
- PRD-16 (Meetings) — meeting action items → requests deferred
- PRD-30 (Safety) — safety flag alert notifications deferred

#### Build Phases (5 phases, A→B→C/D→E)

**Phase A: Infrastructure** — Migration 00000000100098 (9 new tables + 2 ALTER + RLS + triggers + indexes + 11 feature keys), TypeScript types, feature key registration. RLS built WITH the tables — critical privacy rule: mom cannot read other members' messages.

**Phase B: Notifications + Calendar Wiring** — NotificationBell (reuses BreathingGlow), NotificationTray, NotificationPreferencesPanel, useNotifications + useNotificationPreferences hooks, createNotification utility. Bell added to Mom/Adult/Independent shells. Wire calendar approve/reject notifications immediately for real test data.

**Phase C: Requests** — useRequests hook, QuickRequestModal, RequestCard (handles source='mindsweep_auto' attribution), wire RequestsTab, QuickCreate "Send Request", RoutingStrip 'request' destination (15th), accept routing to Calendar/Tasks/List/Acknowledge with sender notification.

**Phase D: Messages Core** — 6 hooks (spaces, threads, messages, realtime, permissions, unread count), MessagesPage (Spaces + Chats tabs), ConversationSpaceView, ChatThreadView, MessageInputBar, ComposeFlow, MessageSearch, initializeConversationSpaces (runs on first /messages visit with warm loading state). Sidebar nav + Queue Modal chat shortcut.

**Phase E: Messages Advanced** — 4 Edge Functions (lila-message-respond, message-coach, auto-title-thread, notify-out-of-nest stub), CoachingCheckpoint, ContentCorner + LinkPreviewCard, MessagingSettings (7 sections), LiLa "Ask LiLa & Send" button, "Discuss" from request → conversation thread.

#### Stubs (NOT Building)
- Push notifications, SMS/text for Out of Nest
- Morning digest / Daily Briefing
- Victory sharing / Family celebration / Permission change / LiLa suggestion notifications
- Content Corner LiLa link pre-screening
- Higgins/Cyrano coaching integration
- Read receipts, message reactions, voice messages
- Extended Out of Nest (family tree)
- Message coaching activity log
- Calendar reminder notifications via pg_cron

#### Key Decisions
1. **RLS in Phase A** — built with tables, not bolted on. Mom can't read other members' messages.
2. **Calendar notifications wired in Phase B** — real test data for notification tray from day one
3. **BreathingGlow reused** — existing component from PRD-17, not recreated
4. **usePendingCounts backward compatible** — existing query shape works after table creation, Phase C tightens
5. **Queue Modal chat shortcut in Phase D** — per PRD-15 Screen 8
6. **"Send as Request" in Phase C** — 15th RoutingStrip destination, not deferred
7. **family_requests.source includes 'mindsweep_auto'** — PRD-17B cross-member routing
8. **initializeConversationSpaces on first /messages visit** — warm loading state, idempotent, no PRD-01 coupling

---

