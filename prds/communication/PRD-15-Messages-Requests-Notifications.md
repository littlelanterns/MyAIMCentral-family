# PRD-15: Messages, Requests & Notifications

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-14 (Personal Dashboard), PRD-14B (Calendar)
**Created:** March 11, 2026
**Last Updated:** March 11, 2026

---

## Overview

PRD-15 defines the family communication backbone — three interconnected subsystems that make MyAIM Family a living, breathing family coordination platform rather than a collection of isolated tools.

**Messages** is a full family communication hub modeled after a project-based conversation architecture. Each family relationship or group is a persistent conversation space containing individual conversation threads. Members chat in real-time, revive old threads months later, and invoke LiLa for context-aware guidance within any conversation. A special Content Corner space lets families curate and share media links for browsing or scheduled family viewing nights. Message coaching — powered by LiLa and mom's Family Communication Guidelines — provides before-send teaching moments tailored to each sender-recipient relationship dynamic.

**Requests** is a lightweight system where any family member can send a request to another member. Unlike task assignment (top-down), requests are suggestions — the recipient has full autonomy to accept, decline, or defer. Accepted requests route to Calendar, Tasks, or Lists with a single tap. Request discussions escalate to conversation threads in the messaging system when needed.

**Notifications** is the cross-platform delivery system that every feature depends on. In-app notifications power a bell icon tray in the shell header. The notification system delivers event reminders, approval outcomes, request updates, safety alerts, and new message indicators. Out of Nest family members receive email notifications so they can participate without being logged in. Push notifications are architected into the data model for post-MVP activation.

> **Mom experience goal:** When I open Messages, I see every conversation with every family member and group — organized, searchable, and alive. My kids can communicate safely with family instead of needing social media. When someone sends a request, I process it in seconds with one-tap routing. And I never miss anything important because the notification system keeps me informed without overwhelming me.

> **Depends on:** PRD-08 (Journal + Smart Notepad) defines the "Send to Person" stub and "Message inbox and reply system" stub — both wired by this PRD. PRD-14B (Calendar) defines the Universal Queue Modal pattern — Requests registers a tab. PRD-02 (Permissions) defines the role-based access model that governs who can message whom. PRD-05 (LiLa Core) provides the AI backbone for conversation coaching, auto-titling, and in-conversation assistance.

---

## User Stories

### Messaging — Core

- As a mom, I want to see all my family conversations organized by person and group so I can find any conversation quickly without scrolling through a single feed.
- As any family member, I want to open a conversation space with another member and start a new conversation thread so we can discuss a specific topic.
- As any family member, I want to respond to an old conversation thread (even months later) and have it pop back to the top of my conversations list so I don't have to start a new thread for the same topic.
- As a mom, I want a unified "Chats" view that shows all conversations across all spaces sorted by most recent activity so I can see what's happening across the whole family at a glance.
- As any family member, I want to search across all my conversations so I can find something someone said weeks ago.

### Messaging — Groups & Multi-Recipient

- As a mom, I want to create custom groups (like "Parents Only" or "Older Kids") so I can send messages to specific subsets of my family.
- As any permitted member, I want to create groups with family members I have messaging access to so I can organize conversations by topic or audience.
- As any family member, I want a whole-family conversation space so we can share things everyone should see.
- As a mom, I want to send the same message to multiple people and choose whether it goes as individual messages, to an existing group, or creates a new group so I have control over how information flows.

### Messaging — LiLa Integration

- As any family member with permission, I want to tap "Ask LiLa & Send" instead of "Send" so LiLa can read the conversation and provide context-aware guidance to the group.
- As a mom, I want to set Family Communication Guidelines that LiLa references when participating in any family conversation so her responses align with our family values.
- As a mom, I want to enable or disable the "Ask LiLa" feature per conversation space or per member so I control where AI participates in family communication.

### Messaging — Coaching

- As a mom, I want to enable before-send message coaching for any family member so they get gentle teaching moments about communication before their messages go out.
- As a guided child, I want coaching that helps me think about whether my words are kind before I send a message so I learn good communication habits.
- As a teen, I want coaching that respects my maturity but helps me consider how my tone might be received so I can communicate better with my family.
- As any coached member, I want to be able to edit my message after seeing coaching feedback OR send it as-is so coaching is a learning tool, not a blocker.

### Messaging — Content Corner

- As any family member, I want to share links to reels, videos, or articles in a dedicated Content Corner so our family has a curated media collection.
- As a mom, I want to control whether Content Corner links can be browsed anytime or are locked until a scheduled family viewing time so I can use it for family movie nights.
- As a family, I want to watch Content Corner links together like a playlist on a Friday night so we have a fun shared experience.

### Messaging — Out of Nest

- As a mom, I want to add Out of Nest family members (adult children, grandparents) who can participate in designated conversation spaces so my kids can communicate with extended family safely.
- As an Out of Nest member, I want to receive email notifications when someone messages me so I don't have to check the app constantly.
- As a parent, I want my kids to have a safe, family-controlled communication channel with relatives instead of social media so I know their interactions are appropriate.

### Requests

- As a kid, I want to send a request to mom (like "Can I go to Jake's house Friday?") so she can approve or decline from her queue.
- As a mom, I want to accept a request and immediately route it to the calendar, tasks, or a list with one tap so processing requests is fast.
- As a teen, I want to send a request to a sibling (like "Can you trade chore days?") if mom has permitted sibling messaging so I can negotiate directly.
- As any family member, I want to see what happened to my request (accepted, declined, where it was routed) so I'm not left wondering.
- As a request recipient, I want to respond with a comment or question that opens a conversation thread instead of just accept/decline so we can discuss it.

### Notifications

- As any family member, I want a bell icon showing my unread notification count so I know when something needs my attention.
- As a mom, I want to control which notification categories I receive (messages, requests, calendar, tasks, safety) so I'm not overwhelmed.
- As a mom, I want safety flag notifications to always come through regardless of Do Not Disturb settings so I never miss a safety concern.
- As an Out of Nest member, I want to receive email notifications for new messages so I can stay connected without being logged in.

---

## Screens

### Subsystem 1: Messages

---

### Screen 1: Messages Home (Conversation Spaces List)

> **Mom experience goal:** One glance tells me who's been talking, what's new, and where to pick up. It feels like opening a well-organized messaging app, not a corporate inbox.

**What the user sees:**

The Messages home screen, accessible from sidebar navigation. The layout follows the project-based conversation architecture:

```
┌─────────────────────────────────────────────┐
│  Messages                        🔍  ✏️     │
│  [Spaces]  [Chats]                          │
│  ─────────────────────────────────────────  │
│  📌 Content Corner              2 new links  │
│      Emma shared a reel • 10m ago           │
│  ─────────────────────────────────────────  │
│  👨 Dad                            ●  (3)   │
│      "Can you check Jake's math..." • 1h    │
│  ─────────────────────────────────────────  │
│  👦 Jake                           ●  (1)   │
│      "Mom can I go to Tyler's..." • 2h      │
│  ─────────────────────────────────────────  │
│  👧 Emma                                    │
│      "Thanks for helping me toda..." • 1d   │
│  ─────────────────────────────────────────  │
│  👨‍👩‍👧‍👦 Whole Family                          │
│      Dad: "Pizza night!" • 2d               │
│  ─────────────────────────────────────────  │
│  👥 Older Kids                              │
│      Ruthie: "Who has the char..." • 3d     │
│  ─────────────────────────────────────────  │
│  🏠 Grandma & Grandpa (Out of Nest)        │
│      Grandma: "Love the photos..." • 1w    │
│  ─────────────────────────────────────────  │
│                                             │
│  [+ New Conversation]                       │
└─────────────────────────────────────────────┘
```

**Two tabs at top:**

- **Spaces** (default): Shows conversation spaces organized by relationship — 1-on-1 members, custom groups, whole family, Out of Nest members. Each space shows: avatar/icon, name, last message preview, timestamp, unread badge count. Sorted by most recent activity (new messages pop the space to top). Content Corner is pinned at top.

- **Chats**: The unified view — all individual conversation threads across ALL spaces, aggregated and sorted by most recent activity. Each row shows the thread title (LiLa auto-generated, inline editable), which space it belongs to, last message preview, and timestamp. Searchable via the search icon.

**Interactions:**

- **🔍 (Search):** Opens search bar. Searches across all conversations — message content, thread titles, sender names. Results show message snippets with conversation context.
- **✏️ (Compose):** Opens new conversation flow — pick recipient(s), choose individual/group/new group, type message, send.
- **Tap a space:** Opens that space's conversation thread list (Screen 2).
- **Tap a chat (in Chats tab):** Opens that specific conversation thread directly (Screen 3).
- **Long-press a space:** Options — mute notifications, pin/unpin, archive.

**Data read:**
- `conversation_spaces` where current member is a participant
- Latest `messages` per space for preview
- Unread count per space from `message_read_status`

---

### Screen 2: Conversation Space (Thread List)

> **Mom experience goal:** Opening "Jake" shows me every conversation topic I've ever had with him — homework help, permission requests, just checking in. I can pick up any thread or start a new one.

**What the user sees:**

Inside a conversation space (e.g., tapping "Jake" from Screen 1):

```
┌─────────────────────────────────────────────┐
│  ← Jake                          🔍  ✏️     │
│  ─────────────────────────────────────────  │
│  Friday Plans                      ●  (2)   │
│      "Can I go to Tyler's hou..." • 2h      │
│  ─────────────────────────────────────────  │
│  Math Homework Help                         │
│      "Thanks mom that makes se..." • 1d     │
│  ─────────────────────────────────────────  │
│  Basketball Tryouts                         │
│      "Coach said I made the te..." • 5d     │
│  ─────────────────────────────────────────  │
│  Regarding: Chore Trade Request             │
│      "Sure, I'll take Tuesday..." • 1w      │
│  ─────────────────────────────────────────  │
│  Summer Camp Plans                          │
│      "I really want to do the..." • 3mo     │
│  ─────────────────────────────────────────  │
│                                             │
│  [+ New Conversation]                       │
└─────────────────────────────────────────────┘
```

**Conversation threads within the space:**
- Each thread has a LiLa auto-generated title (inline editable — tap the title to rename)
- Shows last message preview, timestamp, unread badge
- Sorted by most recent activity — responding to a 3-month-old thread pops it to top
- Threads are never deleted, only archivable

**Interactions:**
- **Tap a thread:** Opens the conversation thread (Screen 3)
- **✏️ (New conversation):** Creates a new thread in this space — user types first message, LiLa auto-titles after first exchange
- **🔍 (Search):** Searches within this space only
- **Long-press a thread:** Archive, rename, pin within space

---

### Screen 3: Conversation Thread (Chat View)

> **Mom experience goal:** This feels like texting my family — natural, fast, and I can ask LiLa for help right in the conversation when I need it.

**What the user sees:**

The chat view inside a conversation thread:

```
┌─────────────────────────────────────────────┐
│  ← Friday Plans                    ✏️ title │
│  Jake • Mom                                 │
│  ─────────────────────────────────────────  │
│                                             │
│         Mom can I go to Tyler's             │
│         house after practice on             │
│         Friday?  He said his mom            │
│         can pick us up.                     │
│                          2:15 PM  ○ Jake    │
│                                             │
│  What time would you need to                │
│  be picked up?                              │
│  Mom ○  2:20 PM                             │
│                                             │
│         His mom said she can drop           │
│         me off by 8. Is that ok?            │
│                          2:22 PM  ○ Jake    │
│                                             │
│  ─────────────────────────────────────────  │
│  [🤖]  [Type a message...          ] [Send] │
│  LiLa                                       │
└─────────────────────────────────────────────┘
```

**Chat-style message bubbles:**
- Messages from the current user on the left, other members on the right (or vice versa — standard chat layout with member avatar indicators)
- Each message shows: sender avatar/initial, message text, timestamp
- In group conversations: sender name above each message bubble
- LiLa messages appear with a distinct LiLa avatar and slightly different bubble styling (subtle background tint)
- System messages (request outcomes, routing confirmations) appear as centered, muted cards between message bubbles

**Text entry area at bottom:**
- **[🤖] (Ask LiLa & Send):** Left side of text entry — LiLa avatar button. Tap to send the typed message to the conversation AND trigger LiLa's contextual response. Hover/long-press tooltip: "Ask LiLa & Send." Mom can disable this per-space or per-member.
- **[Send]:** Right side — standard send button. Sends message to conversation participants only, LiLa stays silent.
- Text input field in center with placeholder "Type a message..."

**LiLa behavior when invoked:**
- Reads the full conversation history for this thread
- Loads participant profiles (InnerWorkings, roles, ages)
- Loads mom's Family Communication Guidelines
- Responds contextually as a distinct participant — helpful, warm, relationally aware
- LiLa's response appears as a message from "LiLa" with her avatar
- LiLa does NOT continue responding unless someone taps "Ask LiLa & Send" again

**Before-send coaching (for coached members):**

When a coached member taps Send, instead of sending immediately:

```
┌─────────────────────────────────────────────┐
│  ✨ Before you send...                      │
│  ─────────────────────────────────────────  │
│  [Mom's custom prompt, e.g.:]               │
│  "Are your words helpful, healing,          │
│   or hurtful?"                              │
│                                             │
│  [LiLa's coaching note, e.g.:]             │
│  "This might come across a little           │
│   harsh to Dad. Want to soften it?          │
│   Remember, tone is hard to read            │
│   in text."                                 │
│                                             │
│  [Edit Message]  [Send Anyway]              │
└─────────────────────────────────────────────┘
```

- **Coaching is context-aware:** considers who is sending, who is receiving, their family relationship, the conversation history, and member maturity level
- **[Edit Message]:** Returns to text entry with message still in the field for editing
- **[Send Anyway]:** Sends as-is. Not a blocker — always the member's choice.
- **Coaching adapts by relationship:** Dad→child gets different coaching than teen→parent or sibling→sibling
- Mom can see that coaching was triggered (in a coaching activity log accessible from messaging settings) but does NOT see the original draft unless the member chose to send it

**Data created:**
- `messages` record with conversation_thread_id, sender_member_id, content, message_type ('user' | 'lila' | 'system')
- `message_read_status` updated for all thread participants
- If LiLa invoked: LiLa message record with `message_type = 'lila'`

---

### Screen 4: Content Corner

> **Mom experience goal:** Instead of my kids showing me 47 TikToks at random moments, they drop the best ones in Content Corner and we watch them together on Friday night. Or they can browse if I've unlocked it.

**What the user sees:**

Content Corner appears as a special pinned conversation space. When opened, it shows a media-focused view:

```
┌─────────────────────────────────────────────┐
│  ← Content Corner                   ⚙️      │
│  [Feed]  [Playlist Mode 🍿]                 │
│  ─────────────────────────────────────────  │
│  Emma • 10 min ago                          │
│  🔗 instagram.com/reel/abc123               │
│  [Link preview card with thumbnail]         │
│  "You guys HAVE to see this cat 😂"         │
│  ─────────────────────────────────────────  │
│  Jake • 2 hours ago                         │
│  🔗 youtube.com/watch?v=xyz                 │
│  [Link preview card with thumbnail]         │
│  "This basketball trick shot is insane"     │
│  ─────────────────────────────────────────  │
│  Dad • yesterday                            │
│  🔗 article-link.com/cool-article           │
│  [Link preview card]                        │
│  "Thought this was interesting"             │
│  ─────────────────────────────────────────  │
│                                             │
│  [🤖]  [Paste a link or type...    ] [Send] │
└─────────────────────────────────────────────┘
```

**Two view modes:**

- **Feed (default):** Chronological list of shared links with preview cards, sender name, timestamp, and optional comment. Members can react or add comments below each link. Standard messaging interactions.

- **Playlist Mode 🍿:** A curated viewing experience — links display as a sequential playlist. Tap "Next" to advance. Designed for family viewing sessions (Friday movie night). Video links auto-embed when possible.

**Mom controls (⚙️ settings):**

- **Viewing access:** "Browse anytime" (default) or "Locked until [date/time]" — when locked, members can still ADD links but cannot VIEW them until the specified time. The "surprise reveal" builds anticipation for family viewing night.
- **Who can add links:** Per-member toggle (part of messaging permissions)
- **Content moderation:** Mom can remove any link. Future: LiLa pre-screening of link content.

**Data created:**
- `messages` records with `message_type = 'content_corner_link'` and `metadata` JSONB containing link URL, preview data, lock status

---

### Screen 5: New Conversation / Compose Flow

**What the user sees:**

When tapping ✏️ from Messages home or any space:

```
┌─────────────────────────────────────────────┐
│  New Message                             ✕  │
│  ─────────────────────────────────────────  │
│  To:  [Search or select family members]     │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ○ Dad          ○ Jake               │    │
│  │ ○ Emma         ○ Ruthie             │    │
│  │ ○ [... other permitted members]     │    │
│  │ ─────────────────────────────────── │    │
│  │ Groups:                             │    │
│  │ ○ Parents Only  ○ Older Kids        │    │
│  │ ○ Whole Family                      │    │
│  │ ○ Grandma & Grandpa (Out of Nest)  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [When 2+ individuals selected:]            │
│  Send as: (●) Individual messages           │
│           ( ) Group message                 │
│           ( ) Create new group → [Name: __] │
│                                             │
│  Message:                                   │
│  [Type your message...                 ]    │
│                                             │
│  [Send]                                     │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Select one recipient → sends to existing 1-on-1 space, creates new thread
- Select a group → sends to that group space, creates new thread
- Select 2+ individuals → choose: individual messages (same content, separate spaces), group message (existing group or create new group with a name)
- Selecting "Create new group" prompts for a group name
- Only shows members the current user has messaging permission to reach
- Out of Nest members appear in the list with a subtle badge/indicator

**From Notepad "Send to → Message":**
When arriving from PRD-08's Send To grid:
- The compose flow opens pre-populated with the notepad content as the message body
- User selects recipient(s) and sends
- Notepad tab moves to history tagged "Sent to: Message → [recipient name]"

---

### Screen 6: Messaging Settings (Mom)

**What the user sees:**

Accessible from Messages home (gear icon) and from the main Settings area.

```
┌─────────────────────────────────────────────┐
│  Messaging Settings                      ✕  │
│  ─────────────────────────────────────────  │
│  Family Communication Guidelines            │
│  [Text area — editable by mom]              │
│  "In our family, we communicate with        │
│   kindness and respect. Before sending,     │
│   ask: Are my words helpful, healing,       │
│   or hurtful? We build each other up."      │
│  (LiLa uses these when coaching or          │
│   responding in family conversations)       │
│  ─────────────────────────────────────────  │
│  Message Coaching                           │
│  Enable before-send coaching for:           │
│  [✓] Jake (Independent)                    │
│  [✓] Emma (Guided)                         │
│  [✓] Ruthie (Guided)                       │
│  [ ] Dad                                    │
│  [ ] Noah (Play — no messaging)            │
│  ─────────────────────────────────────────  │
│  Messaging Permissions                      │
│  Who can message whom:                      │
│  Jake: [✓] Parents [✓] Emma [✓] Ruthie    │
│  Emma: [✓] Parents [✓] Jake [ ] Ruthie    │
│  Ruthie: [✓] Parents [ ] Jake [ ] Emma    │
│  ─────────────────────────────────────────  │
│  Group Creation                             │
│  Who can create groups:                     │
│  [✓] Dad  [✓] Jake  [✓] Emma  [ ] Ruthie  │
│  ─────────────────────────────────────────  │
│  Ask LiLa                                  │
│  Enable "Ask LiLa & Send" in:              │
│  [✓] All conversations (default)           │
│  Or configure per space...                  │
│  ─────────────────────────────────────────  │
│  Content Corner                             │
│  Viewing access: (●) Browse anytime         │
│                  ( ) Locked until [__:__]    │
│  Who can add links:                         │
│  [✓] All family members                    │
│  ─────────────────────────────────────────  │
│  Out of Nest Members                        │
│  [Manage Out of Nest accounts →]            │
│  ─────────────────────────────────────────  │
│  [Save]                                     │
└─────────────────────────────────────────────┘
```

**Data updated:**
- `messaging_settings` record (family-level settings)
- `member_messaging_permissions` records per member-pair
- `message_coaching_settings` per member

---

### Subsystem 2: Requests

---

### Screen 7: Quick Request Creation

> **Mom experience goal:** My kid can ask me for something in 10 seconds without interrupting what I'm doing. I process it when I'm ready.

**What the user sees:**

Accessible from: QuickTasks strip "Request" button, FAB menu option, or Notepad "Send as Request" routing destination.

```
┌─────────────────────────────────────────────┐
│  New Request                             ✕  │
│  ─────────────────────────────────────────  │
│  What are you requesting?                   │
│  [Can I go to Tyler's house Friday?    ]    │
│                                             │
│  Who is this for?                           │
│  [Mom ▾]                                    │
│                                             │
│  When? (optional)                           │
│  [Friday after practice              ]      │
│                                             │
│  Details (optional)                         │
│  [His mom can pick us up and drop    ]      │
│  [me off by 8pm                      ]      │
│                                             │
│  [Send Request]                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **"Who is this for?"** dropdown shows family members the current user has permission to send requests to (same as messaging permission matrix)
- **Send Request:** Creates a `family_requests` record, recipient receives a notification, request appears in recipient's Queue Modal Requests tab
- From Notepad: notepad content pre-fills the "What" and "Details" fields

**Data created:**
- `family_requests` record with sender, recipient, title, details, optional when, status = 'pending'

---

### Screen 8: Requests Tab in Universal Queue Modal

> **Mom experience goal:** I open my Review Queue and see requests alongside calendar approvals and task items. I process everything in one focused session.

**What the user sees:**

The Requests tab within the Universal Queue Modal (PRD-14B pattern):

```
┌─────────────────────────────────────────────┐
│  Review Queue                            ✕  │
│  [Calendar (3)] [Tasks (5)] [Requests (2)]  │
│  ─────────────────────────────────────────  │
│  ┌───────────────────────────────────────┐  │
│  │ 🙋 Can I go to Tyler's house Friday? │  │
│  │ From: Jake  •  Friday after practice  │  │
│  │ "His mom can pick us up and drop      │  │
│  │  me off by 8pm"                       │  │
│  │                                       │  │
│  │ [Accept ▾]  [Decline ▾]  [Snooze]   │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  ┌───────────────────────────────────────┐  │
│  │ 🙋 Can Emma and I trade chore days?  │  │
│  │ From: Ruthie  •  This week            │  │
│  │ "She said she'd do Tuesday if I do    │  │
│  │  Thursday"                            │  │
│  │                                       │  │
│  │ [Accept ▾]  [Decline ▾]  [Snooze]   │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  💬 [Open Messages]                          │
└─────────────────────────────────────────────┘
```

**Accept dropdown — simplified routing strip:**

```
┌──────────────────────────────┐
│  Route this request:         │
│  📅 Add to Calendar          │
│  ✅ Add to Tasks             │
│  📋 Add to List              │
│  👍 Just Acknowledge         │
└──────────────────────────────┘
```

- **📅 Add to Calendar:** Opens Quick Add pre-filled with request content (title, when, details). Creates event on save.
- **✅ Add to Tasks:** Creates a task draft in Studio Queue with request content. Or creates a task directly if simple enough.
- **📋 Add to List:** Opens list picker — add item to existing list or create new.
- **👍 Just Acknowledge:** Marks request as accepted with no routing. Sender gets notification: "Mom accepted your request."
- Each option sends a notification to the sender with the outcome AND where it was routed (e.g., "Mom accepted your request and added it to the calendar for Friday at 4").

**Decline dropdown:**

```
┌──────────────────────────────┐
│  Decline with note:          │
│  [Optional: type a reason]   │
│  [Decline]                   │
│  ─────────────────────────── │
│  💬 Discuss (open chat)      │
└──────────────────────────────┘
```

- **Decline:** Marks request as declined, optional note sent to requester as a notification.
- **💬 Discuss:** Creates a new conversation thread in the sender↔recipient space titled "Regarding: [request title]". Opens the chat for discussion. Request stays in pending state until resolved via the queue.

**Snooze:** Pushes the request down the list. Reappears after a configured interval (default: 4 hours, configurable).

**💬 Open Messages (bottom of queue):** Quick shortcut to open the Messages page — so mom can fire off a related message while she's in queue-processing mode.

---

### Subsystem 3: Notifications

---

### Screen 9: Notification Tray (Shell Header)

> **Mom experience goal:** A single bell icon tells me if anything needs my attention. I glance, process what's urgent, and get back to what I was doing.

**What the user sees:**

Bell icon in the shell header (top-right area, near member avatar/settings):

```
┌──────────────────────────────────────────────────────┐
│  MyAIM Family            [🔔 (5)]  [👤]              │
└──────────────────────────────────────────────────────┘
```

Tapping the bell opens a dropdown/drawer:

```
┌─────────────────────────────────────────────┐
│  Notifications                   [Mark All] │
│  ─────────────────────────────────────────  │
│  ● Jake sent you a request          2m ago  │
│    "Can I go to Tyler's house Friday?"      │
│  ─────────────────────────────────────────  │
│  ● New message from Dad            15m ago  │
│    in "Grocery Run"                         │
│  ─────────────────────────────────────────  │
│  ● Calendar: Soccer Practice       30m ago  │
│    Reminder: starts in 1 hour               │
│  ─────────────────────────────────────────  │
│    Emma's art class approved       2h ago   │
│    Added to calendar for Thursday 3pm       │
│  ─────────────────────────────────────────  │
│  ⚠️ Safety alert                   3h ago  │
│    Review flagged conversation              │
│  ─────────────────────────────────────────  │
│                                             │
│  [See All Notifications →]                  │
└─────────────────────────────────────────────┘
```

**Notification items:**
- Unread notifications have a ● dot indicator and slightly bolder text
- Read notifications are subtler
- Each notification is tappable — navigates to the relevant feature/screen (tap request notification → opens Queue Modal to Requests tab, tap message notification → opens that conversation thread, tap safety alert → opens safety review)
- **[Mark All]:** Marks all notifications as read
- **[See All Notifications →]:** Opens full notification history page (scrollable, searchable, filterable by category)

**Safety alerts** are visually distinct — warning icon, always sorted to top regardless of timestamp.

**Badge count logic:**
- Shows total unread notifications
- Does NOT include Queue Modal pending items (those have their own badges on their respective feature pages and the QuickTasks strip)
- Badge disappears when all notifications are read

---

### Screen 10: Notification Preferences

Accessible from notification tray gear icon or Settings area:

```
┌─────────────────────────────────────────────┐
│  Notification Preferences                ✕  │
│  ─────────────────────────────────────────  │
│  Do Not Disturb                             │
│  [OFF]  (Safety alerts always come through) │
│  ─────────────────────────────────────────  │
│  Category        In-App    Push (coming)    │
│  ─────────────   ──────    ─────────────    │
│  Messages        [✓]       [ ]              │
│  Requests        [✓]       [ ]              │
│  Calendar        [✓]       [ ]              │
│  Tasks           [✓]       [ ]              │
│  Safety          [✓] 🔒    [ ] 🔒           │
│  LiLa            [✓]       [ ]              │
│  ─────────────────────────────────────────  │
│  (🔒 = always on, cannot be disabled)       │
│                                             │
│  [Save]                                     │
└─────────────────────────────────────────────┘
```

- Safety category is always on and locked — cannot be disabled
- Push column is visible but disabled at MVP (shows "coming soon" state)
- Do Not Disturb mutes all categories except Safety

---

## Visibility & Permissions

| Role | Messages | Requests | Notifications | Notes |
|------|----------|----------|---------------|-------|
| Mom / Primary Parent | Full access. Can message anyone. Controls all messaging settings, coaching, permissions, Content Corner, Out of Nest accounts. | Can send/receive requests to/from anyone. Processes requests in Queue Modal. | Full notification access. Safety alerts always delivered. Controls notification preferences. | Mom sees all settings. Cannot read private messages between other members. |
| Dad / Additional Adult | Full access. Can message anyone. Can create groups if mom permits. | Can send/receive requests to/from anyone in family. | Full notification access for categories mom has enabled. Safety alerts if mom grants safety notification access. | Dad cannot modify messaging settings or permissions. |
| Special Adult | Messages parents only during active shift. No group messaging. No Content Corner. | Can send requests to parents only during active shift. | Shift-scoped notifications only. | Cannot message children. Cannot access messaging outside of shift. |
| Independent (Teen) | Messages parents always. Messages siblings if mom permits per-member. Can create groups if mom permits. Content Corner access. Before-send coaching if mom enables. | Can send requests to parents always. Siblings if permitted. | Notifications for own messages, request outcomes. No safety alert access. | Coaching is teaching-oriented but respects maturity. |
| Guided | Messages parents only by default. Per-member permission for siblings. Before-send coaching if mom enables (default: enabled). Content Corner access. | Can send requests to parents. | Age-appropriate notifications for own messages, request outcomes. | Coaching is structured and teaching-focused. |
| Play | No messaging. | No requests. | No notification tray. | No communication features. |
| Out of Nest | Participates in designated conversation spaces only. No access to family internal tools, requests, or queue. | No request access. | Email notifications for new messages. | Lightweight external account. Cannot see any family data beyond designated conversations. |

### Shell Behavior

- **Mom/Dad shell:** Full Messages sidebar item, notification bell in header, Queue Modal with Requests tab
- **Independent shell:** Messages sidebar item (filtered to permitted contacts), notification bell, no Queue Modal (no approval responsibilities)
- **Guided shell:** Simplified Messages surface (if messaging enabled for them), no notification bell (notifications delivered differently in Guided shell — inline indicators)
- **Play shell:** No messaging features present
- **Special Adult shell:** Messages accessible only during active shift, limited to parent conversations

### Privacy & Transparency

- Messages between two members are private — mom cannot read messages between dad and a teen, or between siblings, UNLESS she is a participant in the conversation.
- Mom can see that coaching was triggered (coaching activity log) but cannot see the original draft or the coaching feedback content.
- Teens can see their own messaging permission settings in their transparency panel (PRD-02 pattern).
- Out of Nest members see only designated conversation spaces — no visibility into family internal systems.

> **Decision rationale:** Message privacy is critical for building trust, especially with teens. Mom-first does not mean mom-reads-all-messages. Mom controls WHO can communicate and WHAT coaching is active, but the content of conversations between other members is private. This mirrors healthy family communication where parents set boundaries and teach communication skills but don't read their kids' texts to each other.

---

## Data Schema

### Table: `conversation_spaces`

Persistent containers for conversations — one per relationship or group.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| space_type | TEXT | | NOT NULL | Enum: 'direct' (1-on-1), 'group', 'family' (whole family), 'content_corner', 'out_of_nest' |
| name | TEXT | | NULL | Display name. NULL for direct spaces (shows other member's name). Required for groups. |
| created_by | UUID | | NOT NULL | FK → family_members. Who created this space. |
| is_pinned | BOOLEAN | false | NOT NULL | Pinned spaces sort to top. Content Corner default pinned. |
| metadata | JSONB | '{}' | NOT NULL | Extensible. Content Corner: `{ "viewing_mode": "browse" | "locked", "locked_until": "ISO timestamp" }` |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- Members can read spaces where they are a participant (via `conversation_space_members`).
- Mom can read all family spaces (for settings/management, not message content).
- Members can create spaces if they have group creation permission or are creating a direct space with a permitted contact.

**Indexes:**
- `(family_id, space_type)` — filter by space type
- `(family_id, updated_at DESC)` — most recent activity sorting

---

### Table: `conversation_space_members`

Maps members to their conversation spaces.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| space_id | UUID | | NOT NULL | FK → conversation_spaces |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| role | TEXT | 'member' | NOT NULL | Enum: 'member', 'admin' (can rename group, add/remove members) |
| notifications_muted | BOOLEAN | false | NOT NULL | Per-member mute toggle for this space |
| joined_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:**
- Members can read their own membership records and the membership list of spaces they belong to.
- Space admins (creator + mom) can add/remove members.

**Indexes:**
- `(space_id)` — members of a space
- `(family_member_id)` — spaces a member belongs to
- Unique constraint on `(space_id, family_member_id)`

---

### Table: `conversation_threads`

Individual conversation topics within a space.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| space_id | UUID | | NOT NULL | FK → conversation_spaces |
| title | TEXT | | NULL | LiLa auto-generated, inline editable. NULL until first exchange triggers auto-title. |
| started_by | UUID | | NOT NULL | FK → family_members |
| is_archived | BOOLEAN | false | NOT NULL | Archived threads don't appear in default list |
| is_pinned | BOOLEAN | false | NOT NULL | Pinned threads sort to top within space |
| source_type | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'request_discussion', 'notepad_route', 'system' |
| source_reference_id | UUID | | NULL | FK to originating record (e.g., family_requests.id for request discussions) |
| last_message_at | TIMESTAMPTZ | now() | NOT NULL | Denormalized for fast sorting |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:**
- Members can read threads in spaces they belong to.
- Members can create threads in spaces they belong to.
- Members can update threads they started (rename, archive, pin).
- Mom can archive/pin any thread in family spaces.

**Indexes:**
- `(space_id, is_archived, last_message_at DESC)` — active threads sorted by recency
- `(source_type, source_reference_id)` — find threads linked to requests or other sources

---

### Table: `messages`

Individual messages within conversation threads.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| thread_id | UUID | | NOT NULL | FK → conversation_threads |
| sender_member_id | UUID | | NULL | FK → family_members. NULL for system messages. |
| message_type | TEXT | 'user' | NOT NULL | Enum: 'user', 'lila', 'system', 'content_corner_link' |
| content | TEXT | | NOT NULL | Message text content |
| metadata | JSONB | '{}' | NOT NULL | Extensible. Links: `{ "url": "...", "preview_title": "...", "preview_image": "...", "preview_domain": "..." }`. System: `{ "event_type": "request_accepted", "request_id": "...", "routed_to": "calendar" }` |
| reply_to_id | UUID | | NULL | FK → messages. For quoting/replying to a specific message. |
| is_edited | BOOLEAN | false | NOT NULL | |
| edited_at | TIMESTAMPTZ | | NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:**
- Members can read messages in threads they have access to (via space membership).
- Members can insert messages in threads they have access to.
- Members can update their own messages (edit). Cannot delete — only edit.
- System and LiLa messages cannot be edited by members.

**Indexes:**
- `(thread_id, created_at)` — messages in order within a thread
- `(sender_member_id, created_at DESC)` — member's sent messages
- `(message_type)` — filter by type (useful for Content Corner queries)

---

### Table: `message_read_status`

Tracks read state per member per thread.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| thread_id | UUID | | NOT NULL | FK → conversation_threads |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| last_read_message_id | UUID | | NULL | FK → messages. The last message this member has read. NULL = no messages read. |
| last_read_at | TIMESTAMPTZ | | NULL | |

**RLS Policy:**
- Members can read and update their own read status.

**Indexes:**
- Unique constraint on `(thread_id, family_member_id)`
- `(family_member_id, last_read_at)` — for unread count calculations

---

### Table: `messaging_settings`

Family-level messaging configuration.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families. One row per family. |
| communication_guidelines | TEXT | '' | NOT NULL | Mom's Family Communication Guidelines text. Fed to LiLa context. |
| content_corner_viewing_mode | TEXT | 'browse' | NOT NULL | Enum: 'browse', 'locked' |
| content_corner_locked_until | TIMESTAMPTZ | | NULL | If locked, when it unlocks |
| content_corner_who_can_add | JSONB | '["all"]' | NOT NULL | Array of member IDs or ["all"] |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- All family members can read (need guidelines for LiLa context, need Content Corner settings).
- Only mom (primary_parent) can update.

**Indexes:**
- `(family_id)` — unique, one per family

---

### Table: `member_messaging_permissions`

Per-member-pair messaging access, controlled by mom.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members. The member being granted permission. |
| can_message_member_id | UUID | | NOT NULL | FK → family_members. The member they can message. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

> **Decision rationale:** Stored as explicit permission records rather than a permissions matrix JSONB. This makes RLS queries straightforward — "can member A message member B?" is a simple existence check. Mom and Dad have implicit permission to message anyone (checked at application layer, not stored as records).

**RLS Policy:**
- Mom can CRUD all records.
- Members can read their own permission records (to know who they can message).

**Indexes:**
- `(family_id, member_id)` — who can this member message?
- Unique constraint on `(member_id, can_message_member_id)`

---

### Table: `message_coaching_settings`

Per-member coaching configuration.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members. The coached member. |
| is_enabled | BOOLEAN | false | NOT NULL | Whether coaching is active for this member |
| custom_prompt | TEXT | | NULL | Mom's custom coaching prompt for this member. Falls back to family communication guidelines if NULL. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- Mom can CRUD.
- The coached member can read their own record (transparency).

**Indexes:**
- Unique constraint on `(family_id, family_member_id)`

---

### Table: `family_requests`

Request records with lifecycle tracking.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| sender_member_id | UUID | | NOT NULL | FK → family_members |
| recipient_member_id | UUID | | NOT NULL | FK → family_members |
| title | TEXT | | NOT NULL | What's being requested |
| details | TEXT | | NULL | Additional context |
| when_text | TEXT | | NULL | Free-text timing ("Friday after practice") |
| status | TEXT | 'pending' | NOT NULL | Enum: 'pending', 'accepted', 'declined', 'snoozed' |
| routed_to | TEXT | | NULL | Enum: 'calendar', 'tasks', 'list', 'acknowledged'. NULL while pending. |
| routed_reference_id | UUID | | NULL | FK to created record (calendar_events.id, tasks.id, list_items.id). NULL if just acknowledged. |
| decline_note | TEXT | | NULL | Optional note when declining |
| snoozed_until | TIMESTAMPTZ | | NULL | When snoozed request reappears |
| discussion_thread_id | UUID | | NULL | FK → conversation_threads. If a discussion was opened. |
| source | TEXT | 'quick_request' | NOT NULL | Enum: 'quick_request', 'notepad_route' |
| source_reference_id | UUID | | NULL | |
| processed_at | TIMESTAMPTZ | | NULL | When accepted/declined |
| processed_by | UUID | | NULL | FK → family_members |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- Sender can read their own sent requests.
- Recipient can read requests sent to them. Can update status (accept/decline/snooze).
- Mom can read all family requests.

**Indexes:**
- `(family_id, recipient_member_id, status)` — pending requests for a member (Queue Modal query)
- `(family_id, sender_member_id, created_at DESC)` — sent requests history
- `(status, snoozed_until)` — snoozed requests ready to resurface

---

### Table: `notifications`

Cross-platform notification records.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| recipient_member_id | UUID | | NOT NULL | FK → family_members |
| notification_type | TEXT | | NOT NULL | Enum: 'new_message', 'request_received', 'request_outcome', 'calendar_approved', 'calendar_rejected', 'calendar_reminder', 'task_approval', 'safety_alert', 'victory_shared', 'family_celebration', 'lila_suggestion', 'permission_change', 'system' |
| category | TEXT | | NOT NULL | Enum: 'messages', 'requests', 'calendar', 'tasks', 'safety', 'lila'. For preference filtering. |
| title | TEXT | | NOT NULL | Short notification title |
| body | TEXT | | NULL | Notification body text |
| source_type | TEXT | | NULL | The feature that generated this notification (e.g., 'calendar_events', 'family_requests', 'messages') |
| source_reference_id | UUID | | NULL | FK to the record that triggered this notification |
| action_url | TEXT | | NULL | Deep link path within the app (e.g., '/messages/space/thread-id', '/queue?tab=requests') |
| is_read | BOOLEAN | false | NOT NULL | |
| read_at | TIMESTAMPTZ | | NULL | |
| is_dismissed | BOOLEAN | false | NOT NULL | Dismissed = hidden from tray but still in history |
| delivery_method | TEXT | 'in_app' | NOT NULL | Enum: 'in_app', 'email', 'push', 'email_and_push'. MVP: in_app + email (for Out of Nest). |
| delivered_at | TIMESTAMPTZ | | NULL | When the notification was delivered (in-app: created_at. Email: when sent. Push: when sent.) |
| email_sent_at | TIMESTAMPTZ | | NULL | For Out of Nest email delivery tracking |
| priority | TEXT | 'normal' | NOT NULL | Enum: 'normal', 'high' (safety alerts). High = bypasses DND. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:**
- Members can read their own notifications.
- Members can update their own notifications (mark read, dismiss).
- System inserts notifications (via triggers or Edge Functions).

**Indexes:**
- `(recipient_member_id, is_read, created_at DESC)` — unread notifications, newest first
- `(recipient_member_id, category, created_at DESC)` — filter by category
- `(recipient_member_id, is_read)` — unread count
- `(delivery_method, delivered_at)` — pending email/push delivery

---

### Table: `notification_preferences`

Per-member notification category preferences.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| category | TEXT | | NOT NULL | Enum: 'messages', 'requests', 'calendar', 'tasks', 'safety', 'lila' |
| in_app_enabled | BOOLEAN | true | NOT NULL | Safety category: always true, not editable |
| push_enabled | BOOLEAN | false | NOT NULL | Post-MVP. Safety: will default true when push is available. |
| do_not_disturb | BOOLEAN | false | NOT NULL | Global DND toggle (applied across all categories except safety) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- Members can read and update their own preferences.
- Safety category preferences cannot be set to false (enforced at application layer).

**Indexes:**
- `(family_member_id, category)` — unique per member per category

---

### Table: `out_of_nest_members`

Lightweight external accounts for family members outside the household.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| name | TEXT | | NOT NULL | Display name |
| email | TEXT | | NOT NULL | For login and email notifications |
| relationship | TEXT | | NULL | e.g., 'grandparent', 'aunt', 'adult_child', 'cousin' |
| avatar_url | TEXT | | NULL | Optional profile image |
| invited_by | UUID | | NOT NULL | FK → family_members (mom) |
| invite_status | TEXT | 'pending' | NOT NULL | Enum: 'pending', 'accepted', 'active', 'deactivated' |
| last_active_at | TIMESTAMPTZ | | NULL | |
| auth_user_id | UUID | | NULL | FK → auth.users. Set when they accept invite and create account. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

> **Decision rationale:** Out of Nest members are stored in a separate table rather than as `family_members` because they have a fundamentally different permission model — no access to family tools, no role in the permission system, no feature access. They exist solely to participate in designated conversation spaces. This avoids polluting the `family_members` table with accounts that don't participate in the core family platform.

**RLS Policy:**
- Mom can CRUD.
- Out of Nest members can read their own record.
- Family members can read Out of Nest member records for their family (to see names/avatars in conversations).

**Indexes:**
- `(family_id)` — all Out of Nest members for a family
- `(email)` — lookup by email for login
- Unique constraint on `(family_id, email)`

---

### Enum/Type Updates

New TEXT CHECK enums:
- `space_type`: 'direct', 'group', 'family', 'content_corner', 'out_of_nest'
- `message_type`: 'user', 'lila', 'system', 'content_corner_link'
- `request_status`: 'pending', 'accepted', 'declined', 'snoozed'
- `request_routed_to`: 'calendar', 'tasks', 'list', 'acknowledged'
- `request_source`: 'quick_request', 'notepad_route'
- `notification_type`: 'new_message', 'request_received', 'request_outcome', 'calendar_approved', 'calendar_rejected', 'calendar_reminder', 'task_approval', 'safety_alert', 'victory_shared', 'family_celebration', 'lila_suggestion', 'permission_change', 'system'
- `notification_category`: 'messages', 'requests', 'calendar', 'tasks', 'safety', 'lila'
- `notification_delivery_method`: 'in_app', 'email', 'push', 'email_and_push'
- `notification_priority`: 'normal', 'high'
- `out_of_nest_invite_status`: 'pending', 'accepted', 'active', 'deactivated'

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| PRD-08 (Smart Notepad — Send To) | "Send to → Message" from the Send To grid opens the compose flow (Screen 5) with notepad content as the message body. `source_type = 'notepad_route'`. |
| PRD-08 (Smart Notepad — Send To) | "Send to → Request" (new 15th destination) opens Quick Request (Screen 7) with notepad content as request title/details. |
| PRD-14B (Calendar) | Event approval/rejection creates notification records. Event reminders at `reminder_minutes` before start time create notification records. Attendee ride requests create notification records. |
| PRD-09A (Tasks) | Task completion requiring approval creates notification record for the approver. |
| PRD-05 (LiLa Core) | Safety flag alerts create high-priority notification records for designated parents. LiLa suggestions create normal-priority notification records. |
| PRD-11 (Victory Recorder) | Victory sharing creates notification records for shared-with members (post-MVP). |
| PRD-11B (Family Celebration) | Family celebration trigger creates notification records for family members (post-MVP). |
| PRD-02 (Permissions) | Mom removing self-restriction creates notification record for affected teen (post-MVP). |
| Quick Request creation | Any member creates a request via Quick Request form or FAB. Creates `family_requests` record + notification for recipient. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-14B (Calendar) | Accepted request with "Add to Calendar" routing creates a calendar event via Quick Add flow. `source_type` on calendar event references the request. |
| PRD-09A (Tasks) | Accepted request with "Add to Tasks" routing creates a task draft in Studio Queue or directly as a task. |
| PRD-09B (Lists) | Accepted request with "Add to List" routing creates a list item on the selected list. |
| PRD-14 (Dashboard) | Notification badge count feeds the dashboard pending items indicator. Unread message count available for dashboard display. |
| PRD-04 (Shell) | Bell icon with notification count renders in the shell header across all applicable shells. |
| PRD-05 (LiLa Core) | Conversation context loaded when LiLa is invoked in a message thread — thread history, participant profiles, Family Communication Guidelines. Message coaching uses LiLa for before-send analysis. |
| Universal Queue Modal | Requests tab registered with badge count query and content component. Chat shortcut button opens Messages. |
| Email delivery | Out of Nest member notifications trigger email sends via Edge Function. |

---

## AI Integration

### LiLa in Conversations (On-Demand)

**Trigger:** Member taps "Ask LiLa & Send" button in any conversation thread where LiLa access is enabled.

**Context loaded:**
- Full conversation thread history (last N messages, configurable for context window management)
- Participant profiles: names, roles, ages, InnerWorkings entries (if shared/available)
- Mom's Family Communication Guidelines
- The current member's message that triggered the LiLa invocation
- The family relationship context (parent↔child, sibling↔sibling, etc.)

**AI behavior:**
- Respond as a helpful, warm, relationally aware family guide
- Reference Family Communication Guidelines naturally without quoting them verbatim
- Adapt tone to the conversation context — playful in casual family chats, thoughtful in serious discussions, practical in logistics conversations
- Never take sides in family disagreements — facilitate understanding
- In Vision Quest conversations: switch to Vision Quest guided mode (PRD-12B) with specialized prompting
- LiLa's response appears as a message with `message_type = 'lila'`

### Message Coaching (Before-Send)

**Trigger:** Coached member taps Send in any conversation thread.

**Context loaded:**
- The message being sent
- The conversation thread history
- Sender profile (role, age/maturity, InnerWorkings)
- Recipient profile(s) (role, age/maturity, relationship to sender)
- Mom's Family Communication Guidelines
- Member's custom coaching prompt (if set) or family guidelines as fallback
- The family relationship dynamic between sender and each recipient

**AI behavior:**
- Analyze the message for tone, potential misunderstandings, kindness, and alignment with family communication values
- Generate a coaching note that is:
  - **Gentle and non-judgmental** — never shaming
  - **Relationally specific** — references the actual relationship ("Remember, [sibling] is younger and might take this literally")
  - **Actionable** — suggests a specific alternative if the message could be improved
  - **Brief** — 1-3 sentences max
- If the message is fine: coaching checkpoint appears with just mom's custom prompt and a "Looks good!" from LiLa — no delay or friction
- If concerns detected: coaching note appears with specific, gentle feedback
- **Never blocks sending** — always offers Edit and Send Anyway

**Coaching tone by relationship:**
- Parent → young child: "This might feel a little intense for [name]. Kids respond better to encouragement than correction in text."
- Teen → parent: "Tone is hard to read in messages. This could come across as dismissive even if you don't mean it that way."
- Teen → younger sibling: "You're the older one here — [name] looks up to you. How would this land if someone older sent it to you?"
- Sibling → sibling (same age): "Would you say this the same way in person? Text can make things sound harsher."
- Dad → teen: "Teens can read directness as frustration. Adding a sentence of context might help."

### LiLa Auto-Titling

**Trigger:** New conversation thread receives its first reply (2+ messages exist).

**Context loaded:** First few messages of the thread.

**AI behavior:** Generate a concise, descriptive title (3-6 words) summarizing the conversation topic. Title is stored on `conversation_threads.title` and is inline editable by any thread participant.

---

## Edge Cases

### Large Families (7+ members)

- Conversation spaces list could be long. Search and pinning help manage this.
- "Whole Family" group with 10+ participants: message bubbles show sender name prominently. Compact mode available for high-traffic threads.
- Compose flow with many selectable members: scrollable grid with search filter.

### Message Coaching Edge Cases

- **Rapid-fire messaging:** If a coached member sends 3+ messages in quick succession, coaching only triggers on the first message in a burst. Subsequent messages within 60 seconds skip the checkpoint to avoid friction.
- **"Send Anyway" frequency:** If a coached member consistently taps "Send Anyway" without editing, coaching does NOT escalate or become more aggressive. It continues offering gentle suggestions. Mom can review coaching activity log to decide if intervention is needed.
- **LiLa unavailable:** If the coaching AI call fails, the message sends normally with no delay. Coaching is a nice-to-have, not a gate.

### Content Corner Edge Cases

- **Locked viewing mode:** Members can still ADD links when locked. They just can't VIEW existing links until the unlock time. This lets the family accumulate content for Friday night.
- **Invalid links:** Show a generic link card with URL text. No preview available indicator.
- **Playlist mode with mixed content:** Video links auto-embed. Article links show preview card. Non-previewable links show URL. Playlist advances through all types.

### Out of Nest Edge Cases

- **Email delivery failures:** If email notification fails to send, retry 3 times with exponential backoff. After 3 failures, log the failure. Do not notify the in-household sender that delivery failed (to avoid confusion).
- **Out of Nest member removes their account:** All their messages remain in conversation history attributed to their name. Their space membership is marked as "left."
- **Out of Nest member never accepts invite:** Invite expires after 30 days. Mom can resend.

### Request Edge Cases

- **Request to self:** Not permitted (UI prevents selecting yourself as recipient).
- **Request to member with no messaging permission:** Not permitted (recipient list filtered by permissions).
- **Snoozed request lifecycle:** Resurfaces after configured interval. After 3 snoozes, a subtle indicator suggests declining or discussing.
- **Request for a past date:** System accepts it (the "when" field is free text, not a validated date). The request still functions normally.

### Notification Edge Cases

- **Notification flood:** If a feature generates 10+ notifications in rapid succession (e.g., bulk task approvals), they're collapsed into a summary notification: "5 tasks approved."
- **Do Not Disturb active:** All notifications except Safety are suppressed from the tray. They're still recorded and appear when DND is turned off.
- **Member has no notification preferences set:** All categories default to enabled.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `messaging_basic` | 1-on-1 messaging between family members, basic notifications | Essential |
| `messaging_groups` | Group conversations, custom group creation | Enhanced |
| `messaging_lila` | "Ask LiLa & Send" in conversations, LiLa auto-titling | Full Magic |
| `messaging_coaching` | Before-send message coaching with LiLa analysis | Full Magic |
| `messaging_content_corner` | Content Corner space with playlist mode and viewing lock | Enhanced |
| `messaging_out_of_nest` | Out of Nest member accounts and email notifications | Enhanced |
| `requests_basic` | Send and receive requests, basic accept/decline | Essential |
| `requests_routing` | Accept + route to Calendar/Tasks/Lists | Enhanced |
| `notifications_basic` | In-app notification tray, per-category preferences | Essential |
| `notifications_push` | Push notification delivery (post-MVP) | Enhanced |
| `notifications_email` | Email notification delivery for Out of Nest members | Enhanced |

> **Tier rationale:** Basic messaging and notifications are Essential — communication is fundamental to a family platform. Group features, AI-powered coaching, Content Corner, and Out of Nest require Enhanced or Full Magic because they represent the intelligence and coordination layers that differentiate tiers. Request routing to other features requires Enhanced because it depends on cross-feature integration.

All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Push notification delivery (service workers, device tokens, platform-specific handling) | Push notification infrastructure | Post-MVP Push Notifications PRD or engineering sprint |
| Content Corner link preview generation (fetch URL metadata, generate preview cards) | Link unfurling service | Build-time implementation detail |
| Content Corner playlist auto-embed for video links | Video embed system | Post-MVP enhancement |
| Content Corner moderation (LiLa pre-screening of shared links) | Safety/moderation system | Post-MVP |
| Out of Nest invitation email flow (send invite, create account, onboard) | Auth system extension | Wires into PRD-01 auth patterns at build time |
| Out of Nest text/SMS notification delivery | SMS delivery infrastructure | Post-MVP |
| Victory sharing notifications | PRD-11 Victory Recorder sharing trigger | Post-MVP notification type |
| Family celebration notifications | PRD-11B Family Celebration trigger | Post-MVP notification type |
| Permission change notifications (teen notified when mom removes self-restriction) | PRD-02 permission change trigger | Post-MVP notification type |
| LiLa proactive suggestion notifications | PRD-05 LiLa suggestion system | Post-MVP notification type |
| Morning digest / Daily Briefing notification | Future Daily Briefing feature | Post-MVP / future PRD |
| Higgins/Cyrano integration in message coaching | Future Higgins/Cyrano PRDs | "Want help rewording? Open in Cyrano" option on coaching checkpoint |
| Message coaching activity log (mom can review coaching triggers) | Messaging settings / analytics | MVP stretch or early post-MVP |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| "Send to Person" routing destination | PRD-08 | "Send to → Message" in the Send To grid opens compose flow (Screen 5). Notepad content becomes message body. Family member picker selects recipients. |
| "Message inbox and reply system" | PRD-08 | Full messaging system with conversation spaces, threads, chat-style UI, reply capability, search, and archive. |
| Event reminder delivery (push notifications) | PRD-14B | In-app reminder notifications at MVP. Notification records created at `reminder_minutes` before event start. Push delivery deferred. |
| Universal Queue Modal — future tabs (Requests, Messages) | PRD-14B | Requests tab registered in Queue Modal. Messages do NOT get a Queue Modal tab (has own sidebar home). Chat shortcut button added to Queue Modal. |
| Calendar approval/rejection notifications | PRD-14B | Notification records created when events are approved/rejected. Delivered via notification tray. |
| Pending event expiration notifications | PRD-14B | Notification to event creator when pending event date passes without approval. |
| Teen notification on mom visibility increase | PRD-02 | Notification record created when `mom_self_restrictions` record is deleted. Post-MVP activation. |
| Notification system referenced by PRD-02 | PRD-02 | Full notification infrastructure now defined — `notifications` table, delivery system, preferences. |

---

## What "Done" Looks Like

### MVP (Must Have)

**Messages:**
- [ ] `conversation_spaces`, `conversation_space_members`, `conversation_threads`, `messages`, `message_read_status` tables created with RLS policies
- [ ] `messaging_settings`, `member_messaging_permissions`, `message_coaching_settings` tables created with RLS policies
- [ ] Messages home screen with Spaces tab and Chats tab (unified view)
- [ ] Conversation space list sorted by most recent activity, unread badges
- [ ] Conversation thread list within spaces, sorted by most recent activity
- [ ] Chat-style conversation thread view with message bubbles, timestamps, sender indicators
- [ ] Send message flow — type and send within a thread
- [ ] New conversation creation — select recipient(s), type message, send
- [ ] Multi-recipient: individual messages, existing group, or create new group
- [ ] Group conversation support (custom groups + whole family)
- [ ] Search across all conversations (content, thread titles, sender names)
- [ ] "Send to → Message" from Smart Notepad wired (PRD-08 stub)
- [ ] Unread message count in sidebar nav and notification tray
- [ ] Message permissions enforced: mom→anyone, dad→anyone, kids→per member_messaging_permissions
- [ ] Messaging Settings screen (Screen 6) — mom controls permissions, coaching, guidelines, Content Corner
- [ ] Family Communication Guidelines text field (feeds LiLa context)
- [ ] LiLa auto-titling of conversation threads (inline editable)
- [ ] Content Corner as pinned conversation space — add links, browse feed
- [ ] Content Corner viewing lock (mom sets "browse" or "locked until" mode)

**Message Coaching:**
- [ ] Before-send coaching checkpoint for coached members
- [ ] Coaching per-member enable/disable by mom
- [ ] Context-aware coaching: sender identity, recipient identity, relationship dynamic, conversation history
- [ ] Coaching adapts tone by relationship (parent→child, teen→parent, sibling→sibling, etc.)
- [ ] Mom's custom coaching prompt per member (falls back to Family Communication Guidelines)
- [ ] Edit Message and Send Anyway options (never blocks)
- [ ] Rapid-fire bypass (coaching skips after first message in a burst)

**Ask LiLa & Send:**
- [ ] LiLa avatar button on left side of text entry
- [ ] Tapping sends message to conversation AND triggers LiLa response
- [ ] LiLa response appears as distinct message with LiLa avatar and bubble styling
- [ ] LiLa context-aware: conversation history, participant profiles, Family Communication Guidelines
- [ ] Mom can enable/disable per conversation space or globally
- [ ] LiLa stays silent unless explicitly invoked

**Requests:**
- [ ] `family_requests` table created with RLS policies
- [ ] Quick Request creation form (Screen 7) — title, recipient, optional when/details
- [ ] "Send as Request" routing destination in Notepad Send To grid (15th destination)
- [ ] Requests tab in Universal Queue Modal with accept/decline/snooze
- [ ] Accept routing strip: Calendar, Tasks, List, Acknowledge
- [ ] Decline with optional note
- [ ] Snooze with configurable interval
- [ ] Sender notified of outcome + routing destination
- [ ] "Discuss" option creates conversation thread titled "Regarding: [request]"
- [ ] Request permissions follow messaging permission model

**Notifications:**
- [ ] `notifications` and `notification_preferences` tables created with RLS policies
- [ ] Bell icon in shell header with unread badge count
- [ ] Notification dropdown/tray with recent notifications
- [ ] Tap notification navigates to relevant screen (deep linking)
- [ ] Mark all read, dismiss individual notifications
- [ ] Notification preferences per category with DND toggle
- [ ] Safety alerts always delivered (bypass DND, visual priority treatment)
- [ ] MVP notification types: new_message, request_received, request_outcome, calendar_approved, calendar_rejected, calendar_reminder, task_approval, safety_alert
- [ ] Notification flood collapsing (10+ rapid notifications → summary)

**Out of Nest:**
- [ ] `out_of_nest_members` table created with RLS policies
- [ ] Mom can add Out of Nest members (name, email, relationship)
- [ ] Out of Nest members participate in designated conversation spaces
- [ ] Email notification delivery for Out of Nest members when they receive a message
- [ ] Out of Nest members can log in with lightweight account and view/respond in their designated spaces

**Integration:**
- [ ] QuickTasks strip "Review Queue" entry opens Queue Modal with Requests tab
- [ ] Chat shortcut button on Universal Queue Modal opens Messages
- [ ] Calendar notifications wired (approval, rejection, reminder)
- [ ] "Send as Request" added to Notepad Send To grid
- [ ] RLS verified: members cannot read conversations they're not part of
- [ ] RLS verified: Out of Nest members see only designated conversation spaces
- [ ] RLS verified: messaging permissions enforced at data layer

### MVP When Dependency Is Ready

- [ ] Task completion approval notifications (depends on PRD-09A approval flow build)
- [ ] Safety flag alert notifications (depends on PRD-05 safety monitoring build)
- [ ] Calendar context in LiLa conversation responses (depends on PRD-14B + PRD-05 context wiring)
- [ ] Content Corner playlist mode with video auto-embed (depends on link unfurling service)
- [ ] Message coaching Higgins/Cyrano integration (depends on Higgins/Cyrano PRD builds)

### Post-MVP

- [ ] Push notification delivery (service workers, device tokens, iOS/Android PWA)
- [ ] Out of Nest text/SMS notifications
- [ ] Victory sharing notifications
- [ ] Family celebration notifications
- [ ] Permission change notifications (teen notified)
- [ ] LiLa proactive suggestion notifications
- [ ] Morning digest / Daily Briefing
- [ ] Content Corner LiLa link pre-screening / moderation
- [ ] Message coaching activity log for mom
- [ ] Read receipts (optional, per-conversation toggle)
- [ ] Message reactions (emoji reactions on individual messages)
- [ ] Message editing with edit history indicator
- [ ] Voice messages (audio recording in chat)
- [ ] Extended Out of Nest: more relationship types, family tree view

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: Messaging uses a three-level architecture — Conversation Spaces → Conversation Threads → Messages. Spaces are persistent containers (1-on-1, groups, family, Content Corner, Out of Nest). Threads are topics within spaces. Messages are individual chat entries.
- [ ] Convention: `message_type` enum distinguishes user messages, LiLa messages, system messages, and Content Corner links. LiLa messages have distinct visual treatment (avatar, bubble tint).
- [ ] Convention: LiLa is NEVER automatically present in conversations. She only responds when explicitly invoked via "Ask LiLa & Send." The button is on the LEFT side of text entry to avoid accidental taps.
- [ ] Convention: Message coaching is a before-send checkpoint, never a blocker. Members can always send via "Send Anyway." Coaching adapts to sender-recipient relationship dynamic.
- [ ] Convention: Messaging permissions are stored as explicit `member_messaging_permissions` records. Mom and Dad have implicit permission to message anyone (checked at application layer). Kids need explicit records.
- [ ] Convention: Out of Nest members are stored in `out_of_nest_members` table, NOT in `family_members`. They have no access to family tools — only designated conversation spaces.
- [ ] Convention: Notifications use a single `notifications` table with `notification_type` and `category` fields. Category drives preference filtering. Safety alerts are `priority = 'high'` and bypass Do Not Disturb.
- [ ] Convention: Requests are processed in the Universal Queue Modal Requests tab. Accept offers a routing strip (Calendar, Tasks, List, Acknowledge). "Discuss" creates a conversation thread. Simple outcomes are notifications only — no automatic conversation threads.
- [ ] Convention: Content Corner is a special `conversation_spaces` record with `space_type = 'content_corner'`. Links are messages with `message_type = 'content_corner_link'` and preview metadata in the `metadata` JSONB column.
- [ ] Convention: Universal Queue Modal now has three tabs: Calendar, Tasks, Requests. Plus a chat shortcut button for quick messaging. Messages do NOT have a Queue Modal tab.
- [ ] Convention: LiLa auto-titles all conversation threads after the first reply. Titles are always inline editable. Stored on `conversation_threads.title`.
- [ ] Convention: Family Communication Guidelines are stored in `messaging_settings.communication_guidelines` and loaded into LiLa's context for all in-conversation responses and coaching interactions.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `conversation_spaces`, `conversation_space_members`, `conversation_threads`, `messages`, `message_read_status`, `messaging_settings`, `member_messaging_permissions`, `message_coaching_settings`, `family_requests`, `notifications`, `notification_preferences`, `out_of_nest_members`

Enums defined: `space_type`, `message_type`, `request_status`, `request_routed_to`, `request_source`, `notification_type`, `notification_category`, `notification_delivery_method`, `notification_priority`, `out_of_nest_invite_status`

Triggers added: `set_updated_at` on `conversation_spaces`, `messaging_settings`, `message_coaching_settings`, `family_requests`, `notification_preferences`, `out_of_nest_members`. `update_thread_last_message_at` trigger on `messages` insert to denormalize `conversation_threads.last_message_at`. `update_space_updated_at` trigger on `conversation_threads.last_message_at` change to bubble up to `conversation_spaces.updated_at`.

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Project-based conversation architecture (Spaces → Threads → Messages)** | Modeled after Claude AI's project/chat structure. Organized by relationship, browsable by topic, revivable after months. Gives families a messaging system that grows with them rather than becoming an unmanageable feed. |
| 2 | **Chat-style UI, not email inbox** | Families communicate conversationally. Chat bubbles feel natural and fast. Email-style inbox adds friction and formality that doesn't match family communication patterns. |
| 3 | **Unified "Chats" view alongside Spaces view** | Spaces organize by relationship. Chats aggregate everything by recency. Both views serve different needs — browsing vs. "what's latest?" — and both are essential for families with many members. |
| 4 | **Content Corner as a pinned conversation space with playlist mode** | Shared media curation lives naturally alongside messaging. Playlist mode for family viewing nights. Mom-controlled viewing lock builds anticipation and lets families use it as a curated Friday night experience. |
| 5 | **LiLa on-demand via "Ask LiLa & Send" — never automatic** | LiLa participates only when explicitly invoked. Prevents AI from dominating family conversations. The button placement (left side) reduces accidental invocations. Families control when AI input is welcome. |
| 6 | **Family Communication Guidelines as a dedicated context category** | Mom defines family communication values in one place. LiLa references these in all coaching and in-conversation responses. Creates consistency between AI guidance and family values. |
| 7 | **Message coaching per-member (not role-locked), context-aware of sender-recipient relationship** | Coaching adapts to who is sending, who is receiving, their relationship dynamic, conversation history, and member maturity. Dad→child gets different coaching than teen→parent. Teaching moments are relationally specific, not generic. |
| 8 | **Message coaching is before-send checkpoint, never a blocker** | Edit and Send Anyway are always available. Coaching teaches, it doesn't censor. This builds trust with coached members and avoids the frustration of being blocked. |
| 9 | **Messaging permissions as explicit per-member-pair records** | Granular control — mom decides individually who can message whom. Not role-based defaults. Simple existence check for RLS enforcement. |
| 10 | **Group creation is a mom-permissioned per-member toggle** | Not everyone needs to create groups. Mom decides based on each child's maturity and needs. |
| 11 | **Out of Nest members at MVP with email notifications** | Critical for families with adult children or engaged grandparents. Provides safe, family-controlled communication alternative to social media. Email notifications ensure Out of Nest members stay engaged without requiring constant app login. |
| 12 | **Out of Nest members in separate table, not `family_members`** | Fundamentally different permission model — no family tools access, no role, no features. Avoids polluting the core member table with accounts that don't participate in the platform. |
| 13 | **Requests as separate `family_requests` table** | Requests have a different lifecycle than studio queue items (sender/recipient negotiation, notification to sender, routing on accept). Different tables for different concerns. |
| 14 | **Request outcomes → notification only; discussion → conversation thread** | Simple accepts/routes don't need conversation overhead. But when discussion is needed, the request context flows naturally into the messaging system via auto-created threads. |
| 15 | **LiLa auto-titles all conversations, inline editable** | Reduces friction of naming threads. LiLa generates concise titles after first exchange. Always editable because LiLa's title might not match the user's mental model. |
| 16 | **Notifications as a single table with type/category fields** | One table serves all features. Category drives preference filtering. Type provides specificity for display and deep linking. Simpler than per-feature notification tables. |
| 17 | **Bell icon in shell header, separate from Queue Modal** | Notifications (awareness) and Queue Modal (action) serve different purposes. Bell shows "what happened." Queue shows "what needs your decision." Both are accessible from the shell but are architecturally distinct. |
| 18 | **Push notifications post-MVP, schema ready now** | Push requires significant engineering (service workers, device tokens, platform differences). MVP works with in-app + email for Out of Nest. Schema fields support adding push without refactoring. |
| 19 | **Safety alerts bypass DND, always high priority** | Non-negotiable safety design. Parents must never miss safety flags regardless of notification settings. |
| 20 | **Queue Modal gets chat shortcut button** | Mom processing queue items often needs to fire off a related message. One-tap access to messaging from the queue workflow keeps her in flow. |
| 21 | **"Send as Request" as 15th Notepad Send To destination** | Notepad captures thoughts. Some thoughts are requests for specific people. Natural routing path that leverages the existing Send To infrastructure. |
| 22 | **Message privacy: mom cannot read other members' conversations** | Mom controls WHO communicates and WHAT coaching is active. Content of conversations between other members is private. Builds trust, especially with teens. Mirrors healthy family communication boundaries. |
| 23 | **Coaching activity log (mom sees coaching was triggered, not the content)** | Balance between parental awareness and member privacy. Mom knows coaching is working. Member knows their drafts are private. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Push notification delivery | Post-MVP engineering sprint. Schema ready. |
| 2 | Text/SMS notifications for Out of Nest members | Post-MVP. Email sufficient at MVP. |
| 3 | Morning digest / Daily Briefing | Future Daily Briefing PRD or post-MVP enhancement. |
| 4 | Victory sharing notifications | Post-MVP. Depends on PRD-11 sharing trigger. |
| 5 | Family celebration notifications | Post-MVP. Depends on PRD-11B trigger. |
| 6 | LiLa proactive suggestion notifications | Post-MVP. Depends on PRD-05 suggestion system. |
| 7 | Permission change notifications | Post-MVP. Depends on PRD-02 trigger wiring. |
| 8 | Content Corner LiLa link pre-screening | Post-MVP moderation feature. |
| 9 | Higgins/Cyrano integration in coaching | Depends on those PRDs being written and built. |
| 10 | Read receipts | Post-MVP. Optional per-conversation toggle. |
| 11 | Message reactions (emoji) | Post-MVP enhancement. |
| 12 | Voice messages | Post-MVP. Audio recording in chat. |
| 13 | Extended Out of Nest (family tree, more relationship types) | Post-MVP expansion. |
| 14 | Content Corner playlist video auto-embed | MVP stretch or post-MVP. Depends on link unfurling. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-08 (Journal + Smart Notepad) | "Send to Person" stub fully wired as "Send to → Message." "Message inbox and reply system" stub fully wired. New 15th routing destination "Send as Request" added to Send To grid. | Mark both messaging stubs as wired. Add "Request" to the 14-destination Send To grid (now 15 destinations). Update inline picker list to include Request with recipient picker. |
| PRD-14B (Calendar) | Calendar approval/rejection/reminder notifications now have a defined delivery system. Universal Queue Modal gets Requests tab and chat shortcut button. | Note notification delivery system reference. Update Queue Modal spec to include Requests tab registration and chat shortcut. |
| PRD-09A (Tasks) | Task completion approval notifications now have a defined delivery system. Task Creation Queue in Universal Queue Modal confirmed. | Note notification delivery system reference. Confirm Tasks tab in Queue Modal. |
| PRD-14 (Personal Dashboard) | Notification bell icon and badge count available for dashboard header. Unread message count available as dashboard indicator. | Note notification badge integration. Consider Messages as a dashboard section or widget. |
| PRD-04 (Shell Routing & Layouts) | Messages added as sidebar navigation item. Bell icon added to shell header. Notification tray dropdown needs shell-level UI accommodation. | Add Messages to sidebar route config. Add notification bell to shell header component spec. |
| PRD-02 (Permissions & Access Control) | New messaging permission model defined. `member_messaging_permissions` table for kid messaging access. `message_coaching_settings` for coaching toggles. Group creation permission per member. | Add messaging feature keys to Feature Key Registry. Note messaging permission model in permission documentation. Reference coaching settings as a mom-controlled permission. |
| PRD-05 (LiLa Core AI System) | New LiLa context sources: conversation history, Family Communication Guidelines, coaching analysis. "Ask LiLa & Send" invocation pattern defined. | Register messaging as a LiLa context source. Add conversation coaching as an AI capability. Note the "Ask LiLa & Send" invocation pattern. |
| PRD-01 (Auth & Family Setup) | Out of Nest members introduce a new account type with lightweight auth. | Note `out_of_nest_members` table. Plan Out of Nest authentication flow (email invite → account creation → limited access). |
| Build Order Source of Truth | PRD-15 completed. 12 new tables. Notification system established as cross-cutting infrastructure. Out of Nest member pattern established. | Move PRD-15 to Section 2 (completed). Note notification system as platform infrastructure. Note Out of Nest as a new account pattern. |

---

*End of PRD-15*
