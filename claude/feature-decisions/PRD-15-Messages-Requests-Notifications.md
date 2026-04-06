# Feature Decision File: PRD-15 — Messages, Requests & Notifications

> **Created:** 2026-04-06
> **PRD:** `prds/communication/PRD-15-Messages-Requests-Notifications.md`
> **Addenda read:**
>   - `prds/addenda/PRD-15-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md` (MindSweep cross-member routing)
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md`
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`
> **Founder approved:** pending

---

## What Is Being Built

Three interconnected subsystems that make MyAIM a living family coordination platform:

**Messages** — Project-based conversation architecture (Spaces -> Threads -> Messages). Each family relationship or group is a persistent conversation space. Real-time chat with Supabase Realtime. LiLa "Ask LiLa & Send" for in-conversation AI. Before-send coaching for kids. Content Corner for curated media links with playlist mode.

**Requests** — Lightweight system where any member sends a request to another. Recipient accepts (routes to Calendar/Tasks/List/Acknowledge), declines (with note), snoozes, or opens a discussion thread. Processed in the Universal Queue Modal Requests tab.

**Notifications** — Cross-platform bell icon + tray in shell headers. Per-category preferences with DND. Safety alerts always bypass DND. Email delivery for Out of Nest members (stub).

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| Messages Home (Screen 1) | Two tabs: Spaces (organized by relationship) + Chats (unified threads by recency). Search + compose icons. Content Corner pinned at top. |
| Conversation Space (Screen 2) | Thread list within a space. Sorted by last_message_at. Pinned threads at top. |
| Chat Thread (Screen 3) | Chat bubbles. Sender left/right layout. LiLa messages distinct. System messages centered. Auto-scroll. Mark read on mount. |
| Content Corner (Screen 4) | Feed mode + Playlist mode. Link preview cards. Mom viewing lock. |
| Compose Flow (Screen 5) | Modal. Member picker filtered by permissions. Individual/group/new group options when 2+ selected. |
| Messaging Settings (Screen 6) | Mom-only. 7 sections: guidelines, coaching, permissions matrix, group creation, LiLa, Content Corner, Out of Nest. |
| Quick Request (Screen 7) | Modal. Title, recipient picker, optional when/details. |
| Requests Tab (Screen 8) | In Universal Queue Modal. Accept dropdown (routing strip), Decline (note + discuss), Snooze. |
| Notification Tray (Screen 9) | Bell icon dropdown. Recent 20. Category icons. Safety sorted to top. Flood collapsing. |
| Notification Preferences (Screen 10) | Modal. Per-category toggles. DND. Safety locked. Push "coming soon". |
| NotificationBell | Shell header. Lucide Bell + unread badge + BreathingGlow. |
| RequestCard | Queue card for requests. MindSweep attribution badge when source='mindsweep_auto'. |
| QuickRequestModal | Transient ModalV2. Pre-fillable from Notepad. |
| CoachingCheckpoint | Before-send overlay. Mom prompt + LiLa note. Edit / Send Anyway. 60s rapid-fire bypass. |
| MessageInputBar | Text input + Send. LiLa avatar button left (Phase E). |
| SpaceListItem | Avatar, name, preview, timestamp, unread badge. |
| LinkPreviewCard | URL metadata: thumbnail, title, domain. |
| ComposeFlow | Modal with MemberPillSelector. |
| MessageSearch | Full-text search overlay across all conversations. |

---

## Key PRD Decisions (Easy to Miss)

1. **Mom cannot read other members' messages.** She controls WHO communicates and WHAT coaching is active, but content of private conversations is private. RLS enforces this — mom only sees messages in spaces where she's a member.
2. **LiLa NEVER automatically responds in conversations.** Only when explicitly invoked via "Ask LiLa & Send" button (LEFT side of text entry to avoid accidental taps).
3. **Message coaching is a before-send checkpoint, never a blocker.** Edit and Send Anyway always available. Rapid-fire bypass: coaching skips after first message in a 60-second burst.
4. **Coaching adapts by relationship dynamic** — parent→child, teen→parent, sibling→sibling all get different coaching tone.
5. **Content Corner locked mode** — members can ADD links when locked but cannot VIEW them until unlock time. Builds anticipation for family viewing night.
6. **Messaging permissions are explicit per-member-pair records** in `member_messaging_permissions`. Mom and Dad have IMPLICIT permission to message anyone (checked at app layer, not stored as records).
7. **Out of Nest members in `out_of_nest_members` table**, NOT `family_members`. No access to family tools — only designated conversation spaces.
8. **Requests are NOT studio_queue items.** They have their own lifecycle (sender/recipient negotiation, notification to sender, routing on accept) in `family_requests` table.
9. **Queue Modal Requests tab** — Accept offers a simplified routing strip (Calendar, Tasks, List, Acknowledge). "Discuss" creates a conversation thread titled "Regarding: {request.title}".
10. **Notification categories:** messages, requests, calendar, tasks, safety, lila. Safety is `priority='high'` and bypasses DND. Always locked on.
11. **LiLa auto-titles all conversation threads** after first reply (3-6 words). Always inline editable.
12. **Family Communication Guidelines** stored in `messaging_settings.communication_guidelines`. Loaded into LiLa context for all in-conversation responses and coaching.
13. **family_requests.source CHECK includes 'mindsweep_auto'** for PRD-17B cross-member routing.
14. **Notification flood collapsing** — 3+ notifications from same source_type within 5 minutes → summary notification.
15. **Snoozed requests** resurface after configured interval (default 4 hours). After 3 snoozes, subtle indicator suggests declining or discussing.
16. **Messages tab in Universal Queue Modal: NO.** Messages has its own sidebar home. Queue Modal gets a chat shortcut button instead.

---

## Addendum Rulings

### From PRD-15-Cross-PRD-Impact-Addendum.md:
- "Send to Person" stub (PRD-08) → WIRED as "Send to → Message" compose flow
- "Message inbox and reply system" stub (PRD-08) → WIRED as full messaging system
- Calendar approval/rejection/reminder notifications → WIRED via `notifications` table
- Universal Queue Modal future tabs → Requests tab added. Messages do NOT get a tab.
- 11 new feature keys registered
- "Ask LiLa & Send" is a NEW invocation pattern (distinct from drawer, optimizer, guided modes)
- Family Communication Guidelines is a NEW context source for LiLa

### From PRD-17B-Cross-PRD-Impact-Addendum.md:
- MindSweep cross-member routing creates requests with `source='mindsweep_auto'`
- RequestCard must handle MindSweep attribution display

### From PRD-31-Permission-Matrix-Addendum.md:
- 11 feature keys follow the 3-layer permission model (tier → toggle → granular)
- All return true during beta
- Permission level profiles include messaging features at Balanced+ for teens, parents

---

## Database Changes Required

### New Tables (9)
- `conversation_spaces` — space_type, name, is_pinned, metadata JSONB
- `conversation_space_members` — space_id, family_member_id, role, notifications_muted
- `conversation_threads` — space_id, title, source_type, source_reference_id, last_message_at
- `messages` — thread_id, sender_member_id, message_type, content, metadata, reply_to_id, is_edited
- `message_read_status` — thread_id, family_member_id, last_read_message_id
- `messaging_settings` — family_id, communication_guidelines, content_corner_*
- `member_messaging_permissions` — member_id, can_message_member_id
- `message_coaching_settings` — family_member_id, is_enabled, custom_prompt
- `family_requests` — sender/recipient, title, details, when_text, status, routed_to, source (includes 'mindsweep_auto')

### Modified Tables (2)
- `notifications` — ADD COLUMN IF NOT EXISTS for all PRD-15 columns. GRANT PostgREST access.
- `notification_preferences` — Same pattern. GRANT PostgREST access.

### Migrations
- `00000000100098_prd15_messaging_requests_notifications.sql` — all tables + RLS + triggers + indexes + feature keys

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `messaging_basic` | Essential | mom, dad_adults, independent_teens, guided_kids | 1-on-1 messaging + basic notifications |
| `messaging_groups` | Enhanced | mom, dad_adults, independent_teens | Group conversations, custom groups |
| `messaging_lila` | Full Magic | mom, dad_adults, independent_teens | "Ask LiLa & Send" + auto-titling |
| `messaging_coaching` | Full Magic | mom | Before-send coaching enablement |
| `messaging_content_corner` | Enhanced | mom, dad_adults, independent_teens, guided_kids | Content Corner with playlist |
| `messaging_out_of_nest` | Enhanced | mom | Out of Nest member management |
| `requests_basic` | Essential | mom, dad_adults, independent_teens, guided_kids | Send/receive requests |
| `requests_routing` | Enhanced | mom, dad_adults | Accept + route to Calendar/Tasks/Lists |
| `notifications_basic` | Essential | all except play | In-app tray + preferences |
| `notifications_push` | Enhanced | all except play | Push delivery (post-MVP) |
| `notifications_email` | Enhanced | mom | Email for Out of Nest |

---

## Stubs -- Do NOT Build This Phase

- [ ] Push notification delivery (service workers, device tokens)
- [ ] SMS/text for Out of Nest
- [ ] Morning digest / Daily Briefing
- [ ] Victory sharing notifications
- [ ] Family celebration notifications
- [ ] Permission change notifications (teen notified)
- [ ] LiLa proactive suggestion notifications
- [ ] Content Corner LiLa link pre-screening
- [ ] Higgins/Cyrano coaching integration
- [ ] Read receipts (optional per-conversation toggle)
- [ ] Message reactions (emoji on individual messages)
- [ ] Message editing with edit history indicator (editing works, visual history deferred)
- [ ] Voice messages (audio recording in chat)
- [ ] Extended Out of Nest (family tree, more relationships)
- [ ] Message coaching activity log for mom
- [ ] Calendar reminder notifications via pg_cron (timed delivery deferred)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Requests accepted | -> | Calendar | EventCreationModal pre-filled, routed_to='calendar' |
| Requests accepted | -> | Tasks | studio_queue or direct task, routed_to='tasks' |
| Requests accepted | -> | Lists | ListPickerModal, routed_to='list' |
| MindSweep cross-member | -> | Requests | family_requests with source='mindsweep_auto' |
| Notepad "Send to Message" | -> | Messages | ComposeFlow pre-filled with content |
| Notepad "Send as Request" | -> | Requests | QuickRequestModal pre-filled with content |
| Calendar approve/reject | -> | Notifications | createNotification in CalendarTab handlers |
| Queue Modal | -> | Messages | Chat shortcut button at bottom |
| LiLa in conversations | <- | PRD-05 context assembly | Thread history + participant profiles + guidelines |
| Message coaching | <- | PRD-05 LiLa | Haiku analysis of message tone vs relationship |

---

## Things That Connect Back to This Feature Later

- PRD-16 (Meetings) — meeting action items could route through Requests
- PRD-11 (Victory Recorder) — victory sharing notifications when sharing trigger built
- PRD-11B (Family Celebration) — family celebration notifications
- PRD-02 (Permissions) — permission change notifications for teens
- PRD-12B (Family Vision Quest) — vision discussions could use messaging group spaces
- PRD-05 (LiLa) — LiLa proactive suggestion notifications
- PRD-09A (Tasks) — task completion approval notifications
- PRD-30 (Safety) — safety flag alert notifications (always high priority)

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed -- nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> Completed after build, before declaring the phase done.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| *(to be filled after build)* | | | |

**Status key:** Wired = built and functional . Stubbed = in STUB_REGISTRY.md . Missing = incomplete

### Summary
- Total requirements verified:
- Wired:
- Stubbed:
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
