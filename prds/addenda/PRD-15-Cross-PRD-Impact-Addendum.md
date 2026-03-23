# PRD-15 Cross-PRD Impact Addendum

**Created:** March 11, 2026
**Session:** PRD-15 (Messages, Requests & Notifications)
**Purpose:** Documents how PRD-15 decisions affect prior PRDs and establishes new patterns/conventions.

---

## New Patterns Established

### Project-Based Conversation Architecture
PRD-15 defines a three-level messaging system: Conversation Spaces → Conversation Threads → Messages. This is modeled after Claude AI's project/chat structure. Spaces are persistent containers for relationships and groups. Threads are topic-based conversations within spaces. Messages are individual chat entries. This architecture supports 1-on-1, custom groups, whole family, Content Corner, and Out of Nest conversation types.

### Message Coaching System
PRD-15 establishes a before-send coaching pattern where LiLa analyzes messages in the context of sender identity, recipient identity, their family relationship dynamic, conversation history, and mom's Family Communication Guidelines. Coaching is per-member (mom-enabled), adapts tone by relationship, and never blocks sending. This pattern could extend to other communication surfaces in the future (e.g., Higgins, Cyrano).

### "Ask LiLa & Send" Invocation Pattern
A new way to invoke LiLa — from within a conversation thread, the user taps the LiLa avatar button (left side of text entry) to send their message AND trigger a contextual LiLa response. LiLa only participates when explicitly invoked. This is distinct from the LiLa bottom drawer (PRD-05) and the LiLa Optimizer (PRD-05C).

### Family Communication Guidelines Context Category
Mom defines family communication values in `messaging_settings.communication_guidelines`. This text is loaded into LiLa's context for all in-conversation responses and coaching interactions. This is a new context source that feeds PRD-05's context assembly pipeline.

### Notification Infrastructure
PRD-15 defines the `notifications` table and delivery system that every feature depends on. Notification types are extensible via the `notification_type` enum. Categories drive preference filtering. Safety alerts are always high priority and bypass Do Not Disturb. This is cross-cutting infrastructure, not a feature-specific pattern.

### Out of Nest Member Pattern
PRD-15 introduces a new account type — Out of Nest members stored in `out_of_nest_members` (separate from `family_members`). These are lightweight external accounts with no access to family tools, only designated conversation spaces. They receive email notifications. This pattern supports adult children, grandparents, and extended family.

### Universal Queue Modal — Expanded
The Queue Modal (defined in PRD-14B) now has three registered tabs: Calendar, Tasks, Requests. A chat shortcut button is added for quick messaging from within the queue workflow.

---

## Impact on PRD-01 (Auth & Family Setup)

**What changed:**
- Out of Nest members introduce a new account type with lightweight authentication. The `out_of_nest_members` table stores name, email, relationship, and invite status. Out of Nest members authenticate via email-based login (invite flow → account creation → limited access).

**Action needed:**
- Note the `out_of_nest_members` table as a new account pattern alongside `family_members`.
- Plan the Out of Nest invitation and authentication flow (email invite → accept → create account → limited session scoping).
- Consider whether Out of Nest members use the same `auth.users` table with a flag or a separate auth pathway. The `out_of_nest_members.auth_user_id` field links to `auth.users`.

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- New messaging permission model: `member_messaging_permissions` table stores explicit per-member-pair messaging access. Mom and Dad have implicit permission to message anyone (application layer check). Kids need explicit records.
- `message_coaching_settings` table stores per-member coaching configuration (enabled/disabled, custom prompt).
- Group creation permission is a per-member toggle controlled by mom.
- 11 new feature keys registered: `messaging_basic`, `messaging_groups`, `messaging_lila`, `messaging_coaching`, `messaging_content_corner`, `messaging_out_of_nest`, `requests_basic`, `requests_routing`, `notifications_basic`, `notifications_push`, `notifications_email`.

**Action needed:**
- Add all 11 messaging/requests/notifications feature keys to the Feature Key Registry.
- Note `member_messaging_permissions` as a new permission pattern (explicit per-member-pair records, not role-based defaults).
- Note message coaching and group creation as mom-controlled per-member toggles in the Permission Hub documentation.
- Add messaging permissions to the Permission Hub UI spec (Screen 2 for dad, general settings area for kids).

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- Messages added as a sidebar navigation item (accessible to Mom, Dad, Independent, Guided if messaging enabled; not Play or Special Adult outside shift).
- Bell icon (notification tray) added to shell header, top-right area near member avatar/settings. Shows unread notification badge count.
- Notification dropdown/drawer triggered by bell icon tap — renders in shell header area.
- Queue Modal chat shortcut button added.

**Action needed:**
- Add Messages to the sidebar route configuration for applicable shells.
- Add notification bell icon to the shell header component specification.
- Note that the notification dropdown needs shell-level UI accommodation (z-index, positioning, responsive behavior).
- Update QuickTasks strip to include "Request" as a quick-action option.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- New LiLa invocation pattern: "Ask LiLa & Send" from within message conversation threads. LiLa reads conversation history, participant profiles/InnerWorkings, and Family Communication Guidelines, then responds contextually as a message participant.
- New LiLa context source: Family Communication Guidelines (`messaging_settings.communication_guidelines`).
- Message coaching uses LiLa for before-send analysis — a new AI capability that analyzes message tone/content relative to sender-recipient relationship dynamics.
- LiLa auto-titling: generates concise titles for conversation threads after first reply.
- `meeting` guided mode already registered in PRD-05. No new guided modes from PRD-15, but the "Ask LiLa & Send" pattern is a new invocation method distinct from bottom drawer, Optimizer, and guided modes.

**Action needed:**
- Register Family Communication Guidelines as a context source in the context assembly pipeline (always loaded when LiLa is invoked in a conversation thread or for coaching).
- Document the "Ask LiLa & Send" invocation pattern alongside existing invocation methods.
- Note message coaching as an AI capability (before-send analysis, relationship-aware, adapts by maturity level).
- Note LiLa auto-titling as a lightweight AI task (conversation summary → 3-6 word title).

---

## Impact on PRD-08 (Journal + Smart Notepad)

**What changed:**
- "Send to Person" stub **fully wired** as "Send to → Message." Opens the compose flow (Screen 5) with notepad content as message body, family member picker for recipient selection.
- "Message inbox and reply system" stub **fully wired** as the full project-based conversation architecture with Spaces, Threads, and chat-style UI.
- New 16th routing destination added: **"Send as Request"** in the Send To grid. Opens Quick Request form (Screen 7) with notepad content as request title/details and recipient picker.
- The Send To grid is now 15 destinations (Message replaces "Send to Person" + Request is new), up from the original 14 minus the merge.

**Action needed:**
- Mark "Send to Person" stub as **WIRED** — now routes to Messages compose flow.
- Mark "Message inbox and reply system" stub as **WIRED** — full messaging system defined.
- Add "Request" to the Send To grid with Lucide icon (e.g., `MessageSquarePlus` or `HelpCircle`). Add to the inline picker overlay table — Request uses the same family member picker as Message but for a single recipient.
- Update the routing destination count from 14 to 15 (or update the count if "Send to Person" was already in the 14).
- Note that Message destination now supports multi-recipient with individual/group/new group options.

---

## Impact on PRD-09A (Tasks, Routines & Opportunities)

**What changed:**
- Task completion approval notifications now have a defined delivery system via the `notifications` table. When a task requires approval and is marked complete, a notification record is created for the approver.
- Accepted requests with "Add to Tasks" routing create task drafts in the Studio Queue or directly as tasks, with `source = 'request'` and `source_reference_id` linking to the `family_requests` record.
- Tasks tab in Universal Queue Modal confirmed alongside Calendar and Requests tabs.

**Action needed:**
- Note the notification delivery system for task completion approvals. Add notification record creation to the task completion flow spec.
- Note `source = 'request'` as a new task source type in the tasks schema if not already covered.
- Confirm Tasks tab registration in Universal Queue Modal with badge count query.

---

## Impact on PRD-14 (Personal Dashboard)

**What changed:**
- Notification bell icon with unread badge count available for the dashboard header/shell area.
- Unread message count available as a potential dashboard indicator or widget data source.
- Pending requests count feeds into the Queue Modal total badge (alongside Calendar and Tasks pending counts).

**Action needed:**
- Note notification bell integration in the shell header area of the dashboard.
- Consider whether "Recent Messages" or "Unread Messages" should be an optional dashboard section or widget (future enhancement, not required at MVP).
- Update the pending items badge description to include Requests alongside Calendar and Tasks.

---

## Impact on PRD-14B (Calendar)

**What changed:**
- Calendar approval/rejection notifications now have a defined delivery system. When an event is approved or rejected, a notification record is created in the `notifications` table with `notification_type = 'calendar_approved'` or `'calendar_rejected'`.
- Calendar event reminders create notification records at `reminder_minutes` before event start time with `notification_type = 'calendar_reminder'`. In-app delivery at MVP; push delivery post-MVP.
- Pending event expiration notifications create records when a pending event's date passes without approval.
- Universal Queue Modal now has Requests tab alongside Calendar tab and Tasks tab. Chat shortcut button added to the modal.
- Event reminder delivery stub **partially wired** — in-app reminders via notification tray are MVP. Push notification delivery remains deferred.

**Action needed:**
- Update stubs section: mark "Event reminder delivery (push notifications)" as partially wired (in-app MVP, push deferred).
- Update stubs section: mark "Universal Queue Modal — future tabs (Requests, Messages, etc.)" as partially wired (Requests tab added; Messages has own home, not a Queue Modal tab).
- Note the chat shortcut button addition to the Queue Modal component contract.
- Add notification record creation to the calendar approval/rejection flow description.

---

## Impact on PRD-11 (Victory Recorder + Daily Celebration)

**What changed:**
- Victory sharing notifications are defined as a post-MVP notification type (`notification_type = 'victory_shared'`, `category = 'lila'` or a new 'victories' category). When a member shares a victory, notification records would be created for shared-with members.

**Action needed:**
- Note victory sharing notification as a future integration point. No changes needed to PRD-11 at this time — the notification infrastructure is ready when the sharing trigger is built.

---

## Impact on PRD-11B (Family Celebration)

**What changed:**
- Family celebration notifications are defined as a post-MVP notification type (`notification_type = 'family_celebration'`). When a family celebration is triggered, notification records would be created for family members.

**Action needed:**
- Note family celebration notification as a future integration point. No changes needed to PRD-11B at this time.

---

## Impact on PRD-12B (Family Vision Quest)

**What changed:**
- PRD-15 confirms that LiLa can participate in group conversation threads via "Ask LiLa & Send." For Family Vision Quest conversations, LiLa would operate in Vision Quest guided mode (PRD-12B) with specialized prompting. The messaging infrastructure supports LiLa as a distinct voice in family discussion threads.

**Action needed:**
- Note that Family Vision Quest discussions can leverage the messaging system's group conversation + LiLa integration. The Vision Quest guided mode system prompt would need to be loaded when LiLa is invoked in a Vision Quest-designated conversation space.
- Consider whether Vision Quest should create a dedicated conversation space (like Content Corner is a special space type) or use standard group conversations. Decision can be made during build.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-15 completed. 12 new tables defined. Three major subsystems: Messages, Requests, Notifications.
- Notification system established as cross-cutting platform infrastructure.
- Out of Nest member pattern established as a new account type.
- "Ask LiLa & Send" established as a new LiLa invocation pattern.
- Message coaching established as a new AI capability.
- PRD-15 is now locked (already was — referenced by PRD-14B).
- `meeting` guided mode referenced in PRD-05 — Meetings PRD (PRD-16) is the next planned session.

**Action needed:**
- Move PRD-15 to Section 2 (completed) in the Build Order.
- Add PRD-15 to the Completed PRDs table with key DB tables: `conversation_spaces`, `conversation_space_members`, `conversation_threads`, `messages`, `message_read_status`, `messaging_settings`, `member_messaging_permissions`, `message_coaching_settings`, `family_requests`, `notifications`, `notification_preferences`, `out_of_nest_members`.
- Note notification system as cross-cutting infrastructure in conventions.
- Note Out of Nest member pattern in conventions.
- Add "Ask LiLa & Send" to the LiLa invocation patterns list.
- Note PRD-16 (Meetings) as the next planned PRD session.

---

## Summary of Stubs Affected

### Stubs Now WIRED

| Stub | Created By | Wired By |
|------|-----------|----------|
| "Send to Person" routing destination | PRD-08 | PRD-15 — "Send to → Message" compose flow |
| "Message inbox and reply system" | PRD-08 | PRD-15 — Full messaging system |
| Calendar approval/rejection notifications | PRD-14B | PRD-15 — `notifications` table and tray delivery |
| Universal Queue Modal — future tabs | PRD-14B | PRD-15 — Requests tab registered |
| Notification system referenced by PRD-02 | PRD-02 | PRD-15 — Full notification infrastructure |

### Stubs PARTIALLY WIRED

| Stub | Created By | Status |
|------|-----------|--------|
| Event reminder delivery (push notifications) | PRD-14B | In-app reminders via notification tray = MVP. Push delivery = deferred to post-MVP. |
| Teen notification on mom visibility increase | PRD-02 | Notification infrastructure ready. Trigger wiring = post-MVP. |

### Stubs Still Pending (Created by PRD-15)

| Stub | Wires To | When |
|------|----------|------|
| Push notification delivery | Service worker infrastructure | Post-MVP |
| Out of Nest SMS/text notifications | SMS delivery service | Post-MVP |
| Higgins/Cyrano coaching integration | Higgins/Cyrano PRDs | When those PRDs are built |
| Victory sharing notifications | PRD-11 sharing trigger | Post-MVP |
| Family celebration notifications | PRD-11B trigger | Post-MVP |
| LiLa suggestion notifications | PRD-05 suggestion system | Post-MVP |
| Permission change notifications | PRD-02 trigger | Post-MVP |
| Morning digest / Daily Briefing | Future PRD | Post-MVP |

---

*End of PRD-15 Cross-PRD Impact Addendum*
