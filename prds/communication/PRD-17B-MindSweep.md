# PRD-17B: MindSweep

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-09B (Lists, Studio & Templates), PRD-14B (Calendar), PRD-15 (Messages, Requests & Notifications), PRD-17 (Universal Queue & Routing System), PRD-18 (Rhythms & Reflections)
**Created:** March 16, 2026
**Last Updated:** March 16, 2026

---

## Overview

MindSweep is the auto-sort intelligence layer for MyAIM Family. It is not a separate feature with its own screens — it is a **mode** that sits on top of the existing Smart Notepad → Review & Route → Universal Queue pipeline and adds the brain that makes everything route itself.

The platform already has three levels of content routing: **"Send to → [destination]"** (manual, one tap, user knows where it goes), **"Review & Route"** (semi-manual, LiLa extracts items as cards, user confirms each destination), and now **"MindSweep"** (automatic, LiLa extracts + classifies + confidence-scores + routes based on configurable aggressiveness). MindSweep is the third option — the one where mom talks for 90 seconds while making coffee and everything lands where it belongs without her touching it again.

MindSweep also introduces three external intake channels that feed the same auto-sort brain: **share-to-app** (phone share sheet → MyAIM), **email forwarding** (forward a school newsletter to your family's MindSweep address), and a **dedicated quick-capture PWA entry point** (a separate home screen icon that opens straight to capture). Every channel feeds the same `mindsweep-sort` Edge Function. Every channel respects the same aggressiveness settings. Every channel deposits results into the existing Studio Queue (PRD-17) or routes directly to destinations for non-queue items.

MindSweep is designed with aggressive cost optimization. Captures throughout the day collect in a **holding queue** and are processed in a single batched LLM call — either on-demand when mom taps "Sweep Now" or on a configurable daily schedule (e.g., 8pm). Classification uses **pgvector embedding similarity** against the family's existing content before falling back to an LLM, eliminating ~90% of classification API calls. Voice transcription uses the **free browser Web Speech API for short captures** (under 30 seconds), reserving Whisper for longer recordings. These optimizations bring MindSweep's cost to approximately **$0.25-0.35/month for a typical family** and **~$0.66/month even for a heavy-use family of 9**.

The name "MindSweep" is trademarked (Mind Sweep™) and is the branded, user-facing name for this capability. It appears on the RoutingStrip, in Settings, and on the dedicated PWA icon.

> **Mom experience goal:** I'm driving and I remember six things at once. I tap the MindSweep icon on my phone, talk for 30 seconds, and put the phone down. When I get home, those six things are already sorted — the soccer flyer became a calendar event pending my approval, the grocery items landed on my shopping list, the birthday party RSVP became a task assigned to me, and the random idea about a family camping trip went to my Backburner. I didn't route anything. I didn't even open the full app.

> **Design philosophy:** MindSweep is the auto-sort alternative to Review & Route. Same extraction pipeline, same destinations, same human-in-the-mix principle — but with configurable autonomy. Mom decides how aggressive the auto-routing is: from "sort and suggest but ask me" to "handle the obvious stuff, ask about the rest" to "you know me, just do it."

---

## User Stories

### Auto-Sort
- As a mom, I want a "MindSweep" option alongside "Send to" and "Review & Route" in my Smart Notepad so I can choose whether to route manually, review suggestions, or let the system handle it.
- As a mom, I want to configure how aggressive MindSweep's auto-routing is — from "always ask" to "handle the obvious" to "full autopilot" — so the system matches my comfort level.
- As a mom, I want high-confidence items (like a grocery list that's clearly groceries) to route automatically when I'm in autopilot mode, while sensitive content (like emotional observations about my child) always lands in my review queue regardless of mode.
- As a mom, I want to set rules for what MindSweep always reviews vs. auto-approves so the system respects my judgment about what's sensitive.

### External Intake
- As a mom, I want to share content from any app on my phone (texts, screenshots, links, articles) directly to MyAIM via the share sheet so MindSweep can sort it without me opening the full app.
- As a mom, I want to forward emails (school newsletters, appointment confirmations, activity flyers) to a family email address and have MindSweep extract and route the actionable items automatically.
- As a mom, I want a dedicated MindSweep icon on my phone's home screen that opens straight to a quick-capture interface with voice, text, and photo options so I can brain-dump in seconds.

### Cross-Member Routing
- As a mom, when MindSweep detects that a captured item involves another family member (like a flyer for dad's Saturday commitment), I want it to suggest routing to that person's queue with the appropriate context.
- As a dad, I want items routed to me via MindSweep to appear in my queue with clear attribution — "From mom's MindSweep: Soccer tournament flyer — Saturday, needs driver."

### Approval Learning
- As a mom, I want MindSweep to learn from my approval patterns over time — noticing what I always approve unchanged, what I always edit, and what I always want to review — so it gets smarter about what to handle automatically.
- As a mom, I want the system to periodically suggest upgrading auto-approval for categories where I consistently approve without changes, letting me opt in to more automation as trust builds.

### Digest & Review
- As a mom, I want a MindSweep summary in my morning/evening rhythm showing what was captured and auto-routed since my last check-in so I have awareness without having to check manually.
- As a mom, I want a weekly MindSweep report showing capture volume, auto-route accuracy, and pattern insights so I can see the system working for me.

### Offline
- As a mom, I want to capture voice memos and quick notes offline and have them auto-sync and process through MindSweep when connectivity returns.

---

## Screens

### Screen 1: MindSweep as RoutingStrip Destination

**What the user sees:**

In the Smart Notepad's "Send to..." RoutingStrip grid (PRD-08), and in all other RoutingStrip contexts (PRD-17), a new tile appears:

```
┌─────────┐
│  Wand2   │
│MindSweep│
└─────────┘
```

- **Icon:** Lucide `Wand2` (magic wand — captures the "it just sorts itself" feel)
- **Label:** "MindSweep"
- **Position:** Appears after the existing direct-destination tiles (Tasks, Journal, Calendar, etc.) and before Backburner. Exact position is flexible — RoutingStrip tiles are context-filtered per PRD-17.

**Behavior:**

When user taps MindSweep on the RoutingStrip:
1. Content from the current context (Notepad tab, LiLa conversation, meeting transcript, etc.) is sent to the `mindsweep-sort` Edge Function
2. A brief processing indicator appears: "MindSweep sorting..." with a subtle animation
3. Results are handled based on the user's aggressiveness setting (see Screen 3)
4. Confirmation toast: "MindSweep sorted 6 items" with [View in Queue] link

**Data created/updated:**
- `mindsweep_events` record for tracking/analytics
- `studio_queue` records for items routed to queue-based destinations
- Direct records for non-queue destinations (journal entries, victories, etc.) per existing PRD-17 convention

---

### Screen 2: Quick-Capture PWA Entry Point

**What the user sees:**

A minimal capture interface that opens when the user taps the dedicated MindSweep home screen icon. This is a separate PWA entry point (`/sweep`) with its own web manifest entry.

```
┌──────────────────────────────────────────┐
│                                          │
│         ✦ MindSweep                      │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  │   What's on your mind?           │    │
│  │                                  │    │
│  │                                  │    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [🎤 Voice]  [📄 Scan]  [🔗 Link]      │
│                                          │
│  Auto-sort: Trust the Obvious  [⚙]      │
│                                          │
│  [Sweep Now]              [Save for Later]│
│                                          │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  Holding: 4 items · Next auto-sweep: 8pm │
│  Recent: 3 items swept 2 hours ago       │
│  [Open MyAIM →]                          │
└──────────────────────────────────────────┘
```

- **Text field:** Accepts typed input. Autofocus on open.
- **Voice button:** Taps to record. For short recordings (under 30 seconds), uses free browser Web Speech API for transcription. For longer recordings, Whisper transcription in real-time chunks (same as PRD-08/PRD-12B). Transcribed text appears in the text field. Tap again to stop.
- **Scan button (Lucide `ScanLine`):** Opens camera or photo picker. Intended for **documents, flyers, bulletins, screenshots, and anything with text to extract** — not for memory photos. Image is processed by the vision model to extract text content (same OCR pattern as PRD-14B). The image itself is NOT stored in MyAIM — only the extracted text is kept and routed. A brief tooltip on first use: "Scan reads text from photos and flyers. The image stays on your phone — we just grab the information."
- **Link button:** Paste or share a URL. Edge Function fetches and summarizes the linked content.
- **Auto-sort indicator:** Shows current aggressiveness mode. [⚙] opens MindSweep Settings (Screen 3) as a slide-up sheet.
- **[Sweep Now]:** Sends ALL content in the holding queue (including this capture) to the `mindsweep-sort` Edge Function as a single batched call. Processing indicator, then confirmation toast with item count.
- **[Save for Later]:** Adds this capture to the holding queue WITHOUT processing. Will be included in the next Sweep Now or auto-sweep. For quick captures where mom just wants to dump and go.
- **Holding queue indicator:** Shows count of items waiting in the holding queue and next scheduled auto-sweep time.
- **Recent activity line:** Shows last sweep summary for continuity awareness.
- **[Open MyAIM →]:** Full app link for when the user wants to go deeper.

**Adding to home screen:**
- During onboarding (PRD-01) or in MindSweep Settings (Screen 3), a prompt explains: "Add MindSweep to your home screen for instant capture." This triggers the PWA install prompt for the `/sweep` entry point with its own icon and manifest.
- The icon uses a distinct visual (MindSweep wand/sparkle variant of the main app icon) so it's visually separate on the home screen.

**Share-to-app behavior:**
- When content arrives via the phone's share sheet (Web Share Target API), this same interface opens with the shared content pre-populated in the text field (for text/links) or queued for scanning (for images/screenshots that contain text).
- Shared images follow the same "Scan" philosophy — MindSweep extracts text/information from the image but does not store the image itself.
- If the user has configured "auto-sweep shared content" in Settings, shared content skips the interface entirely and is added to the holding queue with a notification toast. It processes with the next Sweep Now or auto-sweep.

**Data created/updated:**
- Same as Screen 1 — `mindsweep_events` + routed records

---

### Screen 3: MindSweep Settings

**What the user sees:**

Accessible from MindSweep Settings gear icon, or from the main Settings page (PRD-22) under a "MindSweep" section.

```
┌──────────────────────────────────────────┐
│  MindSweep Settings                  ✕   │
│  ─────────────────────────────────────── │
│                                          │
│  AUTO-SORT MODE                          │
│  How much should MindSweep handle        │
│  on its own?                             │
│                                          │
│  ○ Always Ask                            │
│    Sort and suggest, but I'll review     │
│    everything in my Queue.               │
│                                          │
│  ● Trust the Obvious                     │
│    Auto-route high-confidence items.     │
│    Everything else goes to my Queue.     │
│                                          │
│  ○ Full Autopilot                        │
│    Handle high and medium confidence.    │
│    Only flag low-confidence and          │
│    sensitive content for review.         │
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  ALWAYS REVIEW (regardless of mode)      │
│  ☑ Emotional content about children      │
│  ☑ Family relationship observations      │
│  ☑ Behavioral notes about family members │
│  ☑ Financial discussions                 │
│  ☐ Health / medical content              │
│  ☐ Content mentioning specific people    │
│    outside the family                    │
│  [+ Add custom rule]                     │
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  PROCESSING SCHEDULE                     │
│  Auto-sweep time: [8:00 PM ▾]           │
│  (Holding queue processes daily at this  │
│  time. You can always Sweep Now manually)│
│                                          │
│  Email forwarding: [Process immediately] │
│  ○ Process immediately                   │
│  ○ Add to holding queue                  │
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  VOICE                                   │
│  High accuracy (all recordings): [OFF]   │
│  (When OFF, short voice captures use     │
│  free transcription. When ON, all        │
│  recordings use premium transcription.)  │
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  DOCUMENT SCANNING                       │
│  Scan extracts text from photos of       │
│  flyers, bulletins, and screenshots.     │
│  Images stay on your phone — MindSweep   │
│  only keeps the information it reads.    │
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  EXTERNAL INTAKE                         │
│                                          │
│  Email forwarding:                       │
│  wertman-7x3k@sweep.myaimfamily.com     │
│  [Copy Address]  [Add to Contacts]       │
│                                          │
│  Allowed senders:                        │
│  ✓ tenisewertman@gmail.com              │
│  ✓ husband@email.com                    │
│  [+ Add sender]                          │
│                                          │
│  Share-to-app:                           │
│  Auto-sweep shared content: [OFF]        │
│  (When ON, shared content processes      │
│  immediately without showing the         │
│  capture screen)                         │
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  HOME SCREEN SHORTCUT                    │
│  [Add MindSweep to Home Screen]          │
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  DIGEST                                  │
│  Include MindSweep summary in:           │
│  ☑ Morning Rhythm                        │
│  ☑ Evening Rhythm                        │
│  ☑ Weekly Review                         │
│                                          │
│  [Save]                                  │
└──────────────────────────────────────────┘
```

**Auto-sort modes explained:**

| Mode | High Confidence | Medium Confidence | Low Confidence | Sensitive Content |
|------|----------------|-------------------|----------------|-------------------|
| **Always Ask** | → Queue with pre-filled suggestion | → Queue with suggestion | → Queue | → Queue |
| **Trust the Obvious** | → Auto-routes directly | → Queue with pre-filled suggestion | → Queue | → Queue (always) |
| **Full Autopilot** | → Auto-routes directly | → Auto-routes directly | → Queue with suggestion | → Queue (always) |

- **Default mode:** Always Ask (builds trust before automation)
- **Sensitive content rules** always override mode — items matching "Always Review" rules go to Queue regardless of aggressiveness setting
- Mom can change mode at any time. The quick-capture PWA also shows current mode for awareness.

**Email forwarding setup:**
- Family email address is auto-generated on family creation (PRD-01) using `[family-slug]-[short-hash]@sweep.myaimfamily.com`
- Address is dormant until mom enables it in Settings
- Allowed senders list: only emails from whitelisted addresses are processed. Unknown senders receive a bounce reply: "This MindSweep address only accepts email from authorized family members."
- Mom and Dad's registered emails are auto-added to the allowed senders list. Others must be added manually.

**Data created/updated:**
- `mindsweep_settings` record (per member)
- `mindsweep_allowed_senders` records (per family)

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | All MindSweep features. Configures settings, approval rules, email forwarding, allowed senders. Can route items to any family member's queue. |
| Dad / Additional Adult | Full (own) | Own MindSweep capture and settings. Can route to kids they manage (per PRD-02 permissions). Cannot configure family email forwarding or see mom's approval rules. |
| Special Adult | None | Special Adults use the standard Notepad → Send To workflow. No MindSweep access. |
| Independent (Teen) | Capture only | Can use MindSweep quick-capture and voice input. Auto-sort routes to their own queue only. No cross-member routing. No email forwarding access. Settings limited to auto-sort mode toggle. |
| Guided / Play | None | These members use simplified interfaces. Their content is captured by parents on their behalf. |

### Shell Behavior
- **Mom/Dad/Independent shells:** MindSweep tile appears in RoutingStrip. Quick-capture PWA installable. Voice button available.
- **Guided/Play shells:** MindSweep does not appear. Content capture for these members happens through parent shells.
- **Special Adult shell:** MindSweep does not appear.

### Privacy & Transparency
- Teens can see that MindSweep exists and use it for their own content. They cannot see mom's approval rules, auto-sort patterns, or email forwarding configuration.
- Items auto-routed by MindSweep carry a `source = 'mindsweep'` tag visible on the record, so mom can always identify what was auto-sorted vs. manually placed.

---

## Data Schema

### Table: `mindsweep_settings`

Per-member MindSweep configuration.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| aggressiveness | TEXT | 'always_ask' | NOT NULL | CHECK: 'always_ask', 'trust_obvious', 'full_autopilot' |
| always_review_rules | JSONB | '["emotional_children", "relationship_dynamics", "behavioral_notes", "financial"]' | NOT NULL | Array of rule keys that always force queue review regardless of aggressiveness |
| custom_review_rules | JSONB | '[]' | NOT NULL | User-defined review rules (freeform text patterns) |
| auto_sweep_shared | BOOLEAN | false | NOT NULL | When true, share-to-app content skips capture UI and goes to holding queue |
| auto_sweep_time | TIME | '20:00' | NOT NULL | Daily auto-sweep time (24h format). Holding queue processes at this time. |
| email_process_immediately | BOOLEAN | true | NOT NULL | When true, forwarded emails process immediately instead of queuing |
| high_accuracy_voice | BOOLEAN | false | NOT NULL | When true, all voice recordings use Whisper regardless of length |
| digest_morning | BOOLEAN | true | NOT NULL | Include MindSweep summary in Morning Rhythm |
| digest_evening | BOOLEAN | true | NOT NULL | Include MindSweep summary in Evening Rhythm |
| digest_weekly | BOOLEAN | true | NOT NULL | Include MindSweep summary in Weekly Review |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Unique constraint:** `(family_member_id)` — one settings record per member.

**RLS Policy:** Member can read/write their own record. Mom can read (not write) any family member's settings.

### Table: `mindsweep_holding`

Staging area for captured content awaiting batch processing. Items live here temporarily until a Sweep Now or auto-sweep processes them.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members |
| content | TEXT | | NOT NULL | Raw captured text (or extracted text from scan) |
| content_type | TEXT | | NOT NULL | CHECK: 'voice_short', 'voice_long', 'text', 'scan_extracted', 'link', 'email' |
| source_channel | TEXT | | NOT NULL | CHECK: 'quick_capture', 'routing_strip', 'share_to_app', 'email_forward', 'lila_conversation' |
| audio_blob_local | BOOLEAN | false | NOT NULL | Whether an audio blob is stored locally (IndexedDB) awaiting Whisper transcription |
| link_url | TEXT | | NULL | Original URL if content_type is 'link' |
| captured_at | TIMESTAMPTZ | now() | NOT NULL | When the user originally captured this |
| processed_at | TIMESTAMPTZ | | NULL | When this item was included in a sweep batch. NULL = still waiting. |
| sweep_event_id | UUID | | NULL | FK → mindsweep_events. Set when processed. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Member can read/write their own holding items.

**Indexes:**
- `(family_id, member_id, processed_at)` — find unprocessed items for a member

> **Decision rationale:** Server-side holding queue (not just IndexedDB) because email forwarding and share-to-app may capture content when the user's device isn't open to the app. IndexedDB is used as a secondary local cache for offline captures that sync to this table when connectivity returns.

### Table: `mindsweep_allowed_senders`

Whitelisted email addresses for inbound email processing.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| email_address | TEXT | | NOT NULL | Whitelisted sender email |
| added_by | UUID | | NOT NULL | FK → family_members (who added this sender) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**Unique constraint:** `(family_id, email_address)` — no duplicate senders per family.

**RLS Policy:** Mom can full CRUD. Dad can read.

### Table: `mindsweep_events`

Tracks every MindSweep processing event for analytics, digest generation, and approval learning.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members (who initiated the sweep) |
| source_channel | TEXT | | NOT NULL | CHECK: 'routing_strip', 'quick_capture', 'share_to_app', 'email_forward', 'auto_sweep' |
| input_type | TEXT | | NOT NULL | CHECK: 'voice', 'text', 'image', 'link', 'email', 'mixed' |
| raw_content_preview | TEXT | | NULL | First 200 chars of raw input (for digest display). No full content stored — that lives in source records. |
| items_extracted | INTEGER | 0 | NOT NULL | Count of items the AI extracted |
| items_auto_routed | INTEGER | 0 | NOT NULL | Count of items that auto-routed (high/medium confidence depending on mode) |
| items_queued | INTEGER | 0 | NOT NULL | Count of items deposited in Queue for review |
| items_direct_routed | INTEGER | 0 | NOT NULL | Count of items routed directly to non-queue destinations (journal, victory, etc.) |
| aggressiveness_at_time | TEXT | | NOT NULL | The aggressiveness setting at time of processing (snapshot for accuracy) |
| processing_cost_cents | INTEGER | 0 | NOT NULL | Total AI processing cost in cents for this sweep event |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Member can read their own events. Mom can read all family events.

**Indexes:**
- `(family_id, member_id, created_at DESC)` — digest queries
- `(family_id, created_at DESC)` — family-wide analytics

### Table: `mindsweep_approval_patterns`

Tracks mom's approval behavior on MindSweep-routed items for future learning recommendations.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members |
| content_category | TEXT | | NOT NULL | AI-assigned category of the item (e.g., 'academic_achievement', 'meal_food', 'hobby_interest', 'emotional_child', 'scheduling', 'shopping') |
| action_taken | TEXT | | NOT NULL | CHECK: 'approved_unchanged', 'approved_edited', 'rerouted', 'dismissed' |
| suggested_destination | TEXT | | NOT NULL | Where MindSweep suggested routing |
| actual_destination | TEXT | | NULL | Where mom actually routed it (NULL if dismissed) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Member can read their own patterns. System writes on approval action.

**Indexes:**
- `(family_id, member_id, content_category)` — pattern analysis queries

### Column Addition: `studio_queue`

Add to the existing `studio_queue` table (PRD-17):

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| mindsweep_confidence | TEXT | | NULL | CHECK: 'high', 'medium', 'low'. NULL for non-MindSweep items. |
| mindsweep_event_id | UUID | | NULL | FK → mindsweep_events. Links queue item back to the sweep event that created it. |

### Column Addition: `families`

Add to the existing `families` table (PRD-01):

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| sweep_email_address | TEXT | | NULL | The family's unique MindSweep email address. Generated on family creation, NULL until mom enables email forwarding. |
| sweep_email_enabled | BOOLEAN | false | NOT NULL | Whether email forwarding is active |

### Enum/Type Updates

Add to `studio_queue.source` CHECK constraint (PRD-17):
- `'mindsweep_auto'` — item auto-routed by MindSweep
- `'mindsweep_queued'` — item queued by MindSweep for manual review
- `'email_forward'` — item from email forwarding intake
- `'share_to_app'` — item from phone share sheet

---

## Flows

### Incoming Flows (How Content Gets INTO MindSweep)

| Source | How It Works |
|--------|-------------|
| Smart Notepad "Send to → MindSweep" | User taps MindSweep on RoutingStrip. Content from active Notepad tab sent to `mindsweep-sort` Edge Function. |
| Quick-capture PWA | User types/speaks/photographs in the `/sweep` interface. Content sent to `mindsweep-sort` on [Sweep It]. |
| Share-to-app | Phone share sheet → PWA share target → content pre-populated in quick-capture UI (or auto-processed if `auto_sweep_shared = true`). |
| Email forwarding | Email received at family sweep address → inbound email webhook → `mindsweep-email-intake` Edge Function parses email → feeds `mindsweep-sort`. |
| LiLa conversation "MindSweep this" | During any LiLa conversation, user says or taps "MindSweep this" → conversation content sent to `mindsweep-sort`. |
| Meeting post-processing | After a meeting (PRD-16), instead of manually routing each action item, user can tap "MindSweep All" to auto-sort all extracted items at once. |

### Outgoing Flows (Where MindSweep Routes Items)

MindSweep routes to all existing destinations defined in PRD-17's RoutingStrip, plus Backburner:

| Destination | How It Routes |
|-------------|--------------|
| Tasks (via Studio Queue) | `studio_queue` record with `destination = 'task'`, `source = 'mindsweep_auto'` or `'mindsweep_queued'` |
| Lists (via Studio Queue) | `studio_queue` record with `destination = 'list'`, AI suggests which list |
| Calendar | Directly to `calendar-parse-event` Edge Function (PRD-14B) for event extraction → event created as `pending_approval` |
| Journal | Directly creates `journal_entries` record (PRD-08) with AI-suggested `entry_type` |
| Victory Recorder | Directly creates `victories` record (PRD-11) |
| Best Intentions | Directly creates `best_intentions` draft record (PRD-06) |
| Guiding Stars | Directly to Guiding Stars creation flow (PRD-06) |
| Backburner | Directly to Backburner list (Backburner Addendum) with AI auto-categorization |
| Archives / Self-Knowledge | Directly creates `archive_context_items` record (PRD-13) |
| Another member's Queue | `studio_queue` record with `owner_id` = target member, `requester_id` = sender, `source = 'mindsweep_auto'` |
| InnerWorkings | Routes to InnerWorkings context (PRD-07) |

> **Convention:** Non-queue destinations (Journal, Victory, Best Intentions, Guiding Stars, Backburner, Archives) route directly — same pattern as PRD-17. Queue-based destinations (Tasks, Lists, Widgets, Trackers) go through `studio_queue`. Calendar uses its own parsing Edge Function.

---

## AI Integration

### `mindsweep-sort` Edge Function

**The core brain.** This is a single Edge Function that receives content from any intake channel and returns structured routing decisions. It is designed for **batched processing** — multiple captures are combined into a single call for cost efficiency.

**Input:**
```json
{
  "items": [
    {"content": "Tommy got 100% on his spelling test!", "content_type": "text", "captured_at": "2026-03-16T14:30:00Z"},
    {"content": "Pick up milk and eggs", "content_type": "text", "captured_at": "2026-03-16T15:10:00Z"},
    {"content": "[extracted text from scanned flyer]", "content_type": "scan_extracted", "captured_at": "2026-03-16T16:00:00Z"},
    {"content": "Start thinking about summer camp options", "content_type": "text", "captured_at": "2026-03-16T18:45:00Z"}
  ],
  "member_id": "uuid",
  "family_id": "uuid",
  "aggressiveness": "trust_obvious",
  "always_review_rules": ["emotional_children", "relationship_dynamics"]
}
```

**Processing (optimized pipeline):**

1. **Pre-classify with embeddings (FREE):** For each item, generate an embedding via OpenAI text-embedding-3-small (~$0.00002/item, essentially free). Compare against existing family content embeddings in pgvector. If nearest-neighbor similarity > 0.85 to an existing item in a known destination (e.g., "pick up milk" matches existing shopping list items), assign destination and confidence = 'high' without any LLM call. This handles ~90% of routine items.

2. **Batch LLM call for remaining items:** Items where embedding similarity is below threshold are batched into a single Haiku-equivalent LLM call. One prompt processes all ambiguous items at once: "Here are N items. For each, provide: category, destination, confidence, sensitivity flag, cross-member detection." One API call regardless of item count.

3. **Sensitivity check:** For each item (whether classified by embedding or LLM), check against `always_review_rules` — any match forces `confidence = 'review_required'` regardless of score.

4. **Cross-member detection:** Check if content references family member names → suggest cross-member routing if relevant.

**Output:**
```json
{
  "items": [
    {
      "extracted_text": "Tommy got 100% on his spelling test",
      "category": "academic_achievement",
      "destination": "victory",
      "confidence": "high",
      "classified_by": "embedding",
      "sensitivity_flag": false,
      "cross_member": "Tommy",
      "cross_member_action": null
    },
    {
      "extracted_text": "Pick up milk and eggs",
      "category": "shopping",
      "destination": "list",
      "destination_detail": {"list_type": "shopping", "suggested_list": "Weekly Groceries"},
      "confidence": "high",
      "classified_by": "embedding",
      "sensitivity_flag": false,
      "cross_member": null,
      "cross_member_action": null
    },
    {
      "extracted_text": "Sarah's recital is next Thursday at 7pm",
      "category": "scheduling",
      "destination": "calendar",
      "confidence": "high",
      "classified_by": "llm_batch",
      "sensitivity_flag": false,
      "cross_member": "Sarah",
      "cross_member_action": "attendee"
    },
    {
      "extracted_text": "Start thinking about summer camp options",
      "category": "idea_someday",
      "destination": "backburner",
      "confidence": "medium",
      "classified_by": "llm_batch",
      "sensitivity_flag": false,
      "cross_member": null,
      "cross_member_action": null
    }
  ],
  "processing_cost_cents": 1,
  "items_classified_by_embedding": 2,
  "items_classified_by_llm": 2
}
```

**Model selection:** Haiku-equivalent via OpenRouter for the batched LLM call. Falls back to Sonnet only for complex multi-item extractions where Haiku returns low confidence across all items.

### Processing Modes: Sweep Now vs. Scheduled

MindSweep captures land in a **holding queue** (lightweight local storage — IndexedDB on client, or `mindsweep_holding` staging rows in Supabase if captured from email). Processing happens in one of two ways:

- **Sweep Now (on-demand):** User taps "Sweep Now" from the quick-capture UI, QuickTasks strip, or Queue Modal. ALL items in the holding queue are batched into a single `mindsweep-sort` call. This is the "sit down with coffee and process my day" experience.
- **Auto-sweep (scheduled):** System processes the holding queue at a time mom configures (default: 8:00 PM). Everything captured since the last sweep gets batched into one call. Mom wakes up to sorted items in her Queue or already auto-routed.
- **Immediate sweep:** For time-sensitive channels (email forwarding), items can optionally process immediately rather than queuing. Configurable per channel in Settings.

> **Decision rationale:** Batching is the single biggest cost optimization. 15 individual LLM calls vs. 1 batched call with 15 items saves ~70-75% on classification costs. It also creates a better UX — one satisfying "15 items sorted" moment instead of 15 tiny toasts throughout the day.

### Voice Transcription Cost Optimization

- **Short recordings (under 30 seconds):** Use the free browser Web Speech API as primary transcription. Accuracy is lower but sufficient for grocery items, quick reminders, and simple captures. ~60-70% of MindSweep voice inputs are short.
- **Long recordings (30+ seconds):** Use OpenAI Whisper with chunked real-time transcription (same infrastructure as PRD-08/PRD-12B). Necessary for brain dumps, meeting recaps, and detailed observations.
- **User override:** A "High accuracy" toggle in MindSweep Settings forces Whisper for all recordings regardless of length, for users who prefer accuracy over cost savings.

> **Decision rationale:** Web Speech API is free and instant. For a quick "pick up milk" voice memo, Whisper's superior accuracy adds no value. Reserving Whisper for longer recordings where accuracy matters saves ~$0.34/month for a heavy-use family.

### Document Scanning (Scan Button)

The Scan button accepts photos of **documents, flyers, bulletins, calendars, permission slips, screenshots, and anything containing text to extract.** It is explicitly NOT for memory photos, dinner pics, or scrapbook content.

**Behavior:**
1. User taps Scan → camera opens or photo picker appears
2. Image is sent to the vision model (same OpenRouter vision pipeline as PRD-14B calendar OCR)
3. Vision model extracts all text content from the image
4. **The image is NOT stored in MyAIM.** Only the extracted text is kept.
5. Extracted text is added to the holding queue like any other text capture
6. Processed during next Sweep Now or auto-sweep

**User-facing framing:** The button is labeled "Scan" (Lucide `ScanLine` icon), not "Photo" or "Camera." First-use tooltip: "Scan reads text from flyers, bulletins, and screenshots. The image stays on your phone — MindSweep just grabs the information."

> **Decision rationale:** Document scanning is one of MindSweep's highest-value use cases — a homeschool mom snaps a co-op calendar and every event auto-routes to her family calendar. But processing random memory photos through the vision API ($0.02/image) provides no routing value without a scrapbook feature. Framing the button as "Scan" sets the right expectation and prevents unnecessary vision API costs. Expected usage: 10-15 document scans/month per family, not 50 random photos.

### Cost Estimate (Optimized)

**Heavy-use family of 9 (350-400 items/month):**

| Line Item | Monthly Cost | How |
|-----------|-------------|-----|
| Voice: short captures (Web Speech API) | $0.00 | ~56 short memos × free browser API |
| Voice: long captures (Whisper) | $0.14 | ~24 long memos × $0.006 |
| Document scans (vision model) | $0.30 | ~15 flyers/bulletins × $0.02 |
| Embedding generation | $0.007 | ~350 items × $0.00002 (essentially free) |
| Batched LLM classification | $0.12 | ~8-10 batched calls/month for items embeddings couldn't classify |
| Email parsing | $0.10 | ~10 newsletters × $0.01 |
| **Total** | **~$0.66/month** | |

**Typical family of 4-5 (150-200 items/month):**

| Line Item | Monthly Cost |
|-----------|-------------|
| Voice (mixed) | $0.06 |
| Document scans | $0.16 |
| Embeddings | $0.004 |
| Batched LLM | $0.06 |
| Email | $0.05 |
| **Total** | **~$0.33/month** |

> **Cost context:** At $0.33-0.66/month for MindSweep on top of ~$0.20/month base AI costs, total AI cost per family is ~$0.53-0.86/month. At a $15-20/month subscription, that's 94-97% gross margin on AI. The 80/20 cost architecture holds comfortably.

### `mindsweep-email-intake` Edge Function

**Email-specific preprocessing.** Receives the inbound email webhook payload from the email service (Postmark/SendGrid/Cloudflare).

**Processing:**
1. Verify sender is in `mindsweep_allowed_senders` for this family
2. Extract email subject, body text, and any attachments (images, PDFs)
3. Strip email signatures, forwarding headers, and thread history to isolate the relevant content
4. For newsletters/long emails: summarize key actionable items rather than processing the full text
5. Pass cleaned content to `mindsweep-sort` with `source_channel = 'email_forward'`

### Approval Pattern Analysis (Phase 2)

Not a real-time function — runs as a periodic analysis (weekly or on-demand).

**Logic:**
- Query `mindsweep_approval_patterns` for a member
- Group by `content_category`
- For categories where `approved_unchanged` rate > 90% over 20+ items: suggest auto-approval
- For categories where `approved_edited` or `rerouted` rate > 50%: flag as "still learning"
- Surface suggestion in MindSweep Settings: "Based on your patterns, I can auto-approve [category]. Sound good?"
- Mom confirms → adds category to an `auto_approve_categories` JSONB array on `mindsweep_settings`

### MindSweep Digest (Section Type #28 for PRD-18)

A new section type for Rhythms & Reflections:

| # | Section Type | Description | Data Source | Available In |
|---|-------------|-------------|-------------|-------------|
| 28 | **MindSweep Digest** | Summary of items captured and routed since last check-in | `mindsweep_events` aggregated | Morning, Evening, Weekly, Custom |

**Morning digest:** "Since yesterday evening: 4 items swept. 3 auto-routed (grocery list, calendar event, victory). 1 waiting in your Queue."

**Evening digest:** "Today: 7 items swept across 3 sessions. 5 auto-routed. 2 in Queue."

**Weekly digest:** "This week: 23 items swept. 19 auto-routed (83% auto-rate). Top categories: scheduling (8), shopping (5), academic (4). Your Queue processed 4 items."

---

## Edge Cases

### Empty MindSweep Input
- User taps [Sweep It] with no content: show inline validation "Nothing to sweep yet — type, speak, or share something first."

### Single-Item vs. Multi-Item Detection
- If content is clearly a single item (e.g., "pick up dry cleaning"), MindSweep routes it directly without the extraction step. No need to parse a single sentence into cards.
- If content contains multiple items (detected by sentence boundaries, conjunctions, or topic shifts), full extraction runs.

### Email From Unknown Sender
- Email received from an address not in `mindsweep_allowed_senders`: bounce reply sent. Email content is NOT processed or stored. No record created.

### Email Forwarding Not Enabled
- Family sweep email address exists in the database but `sweep_email_enabled = false`: inbound emails are silently dropped. No bounce reply (prevents confirming the address exists).

### Offline Quick-Capture
- Content stored locally in IndexedDB with `sync_status = 'pending'`
- Voice recordings stored as audio blobs locally
- On connectivity restore: audio uploaded to Whisper for transcription → transcribed text sent to `mindsweep-sort` → results processed normally
- UI shows "Pending sync" indicator (Lucide `CloudOff` icon) on items awaiting processing
- Items appear in a "Pending" section of the quick-capture recent activity

### Confidence Disagreement
- If the AI assigns "high confidence" but the item matches an "Always Review" rule, the rule wins. Item goes to Queue regardless of confidence. The confidence score is still stored for analytics but doesn't determine routing in this case.

### Large Brain Dump (20+ Items Extracted)
- Same behavior as PRD-17's large batch handling. Items arrive in Studio Queue grouped by `batch_id` from the `mindsweep_event_id`. Grouped card shows "20 items from MindSweep" with Send as Group / Process All / Expand options.

### MindSweep on Content Already Processed
- If a user runs MindSweep on Notepad content that was already processed via Review & Route, MindSweep runs independently. Duplicate items may result. This is acceptable — the Queue's dismiss action handles duplicates, and it's better to over-capture than under-capture.

### Share-to-App on iOS PWA Limitations
- iOS has limited Web Share Target API support for PWAs. If share-to-app is not available on the user's device, the MindSweep Settings screen hides the share-to-app section and shows the email forwarding option more prominently as the alternative external intake channel.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `mindsweep_manual` | MindSweep in "Always Ask" mode — sort and suggest, user reviews all | Essential |
| `mindsweep_auto` | MindSweep in "Trust the Obvious" and "Full Autopilot" modes — auto-routing with confidence tiers | Full Magic |
| `mindsweep_email` | Email forwarding intake channel | Full Magic |
| `mindsweep_share` | Share-to-app intake channel | Enhanced |
| `mindsweep_pwa` | Dedicated quick-capture PWA entry point | Enhanced |
| `mindsweep_digest` | MindSweep Digest section in Rhythms | Enhanced |
| `mindsweep_learning` | Approval pattern analysis and auto-approval suggestions (Phase 2) | Full Magic |

> **Tier rationale:** Basic MindSweep (manual mode) is Essential because it's just a smarter Review & Route — every mom should have it. Auto-routing and email forwarding are Full Magic because they're the premium intelligence. Share-to-app and PWA entry point are Enhanced as convenience features. All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Approval pattern learning recommendations | Periodic analysis job + Settings UI suggestion | Phase 2 enhancement (no PRD needed — extends mindsweep_settings) |
| MindSweep onboarding prompt (add to home screen) | PRD-01 onboarding flow or post-setup wizard | PRD-01 addendum or Phase 2 |
| Email forwarding infrastructure setup | DNS configuration, email service webhook registration | DevOps / deployment concern, not a PRD |
| Weekly MindSweep intelligence report | Extended digest with pattern insights | Phase 2 enhancement |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| "SMS/email capture channels" side quest | Remaining PRDs doc | Email forwarding fully specified in this PRD. SMS deferred. |
| "LiLa auto-routing" post-MVP item | PRD-17 | MindSweep IS the auto-routing system. Fully specified. |
| "Smart defaults (pre-filling based on patterns)" post-MVP item | PRD-17 | MindSweep confidence scoring provides the pre-filling intelligence. |
| MindSweep as branded experience | Planning Decisions doc ("Folded into Smart Notepad") | Now fully specified as its own PRD with auto-sort mode, external intake, and branded quick-capture. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] MindSweep tile on RoutingStrip (Lucide `Wand2`, label "MindSweep") in all applicable routing contexts
- [ ] `mindsweep-sort` Edge Function: extraction, classification, confidence scoring, sensitivity checking, cross-member detection
- [ ] Three aggressiveness modes: Always Ask, Trust the Obvious, Full Autopilot
- [ ] Always Review rules: configurable toggles for sensitive content categories
- [ ] MindSweep Settings screen with mode selection, review rules, digest toggles
- [ ] Quick-capture PWA entry point (`/sweep`) with voice, text, photo, link inputs
- [ ] Voice input uses Web Speech API for short captures (under 30s), Whisper for long captures. "High accuracy" toggle overrides.
- [ ] Scan button (Lucide `ScanLine`) opens camera/picker, extracts text via vision model, does NOT store image. First-use tooltip explains behavior.
- [ ] Image input uses vision model OCR (same infrastructure as PRD-14B) — only for document/text extraction, not memory photos
- [ ] Auto-routed items carry `source = 'mindsweep_auto'` and `mindsweep_confidence` on `studio_queue`
- [ ] Queued items carry `source = 'mindsweep_queued'` with pre-filled destination suggestions
- [ ] `mindsweep_events` table tracks all sweep events for digest and analytics
- [ ] `mindsweep_holding` table for batched processing queue with server-side staging
- [ ] Holding queue UI: item count indicator, "Sweep Now" button, next auto-sweep time display
- [ ] Sweep Now processes entire holding queue in single batched LLM call
- [ ] Auto-sweep scheduled function runs daily at member's configured time (default 8pm)
- [ ] Embedding-first classification: pgvector similarity check before LLM fallback
- [ ] `mindsweep_approval_patterns` table records approval actions (data collection for Phase 2 learning)
- [ ] `mindsweep_settings` table with per-member configuration
- [ ] Share-to-app via Web Share Target API (Android; graceful degradation on iOS)
- [ ] Confirmation toast after sweep with item count and [View in Queue] link
- [ ] Cross-member routing suggestions when content references other family members
- [ ] MindSweep Digest section type (#28) registered in PRD-18 Section Type Library
- [ ] Offline capture with IndexedDB queue and auto-sync on connectivity restore
- [ ] RLS: member-scoped settings and events, mom can read all family events
- [ ] All `useCanAccess()` hooks wired (all return true during beta)
- [ ] All icons are Lucide — no emoji in the build
- [ ] All colors reference semantic tokens only

### MVP When Dependency Is Ready
- [ ] Email forwarding intake (requires DNS setup and email service webhook — can be enabled post-deploy without code changes)
- [ ] MindSweep Digest rendering in Morning/Evening/Weekly rhythms (requires PRD-18 build)
- [ ] Backburner as MindSweep routing destination (requires Backburner Addendum build)
- [ ] "MindSweep All" button on meeting post-processing (requires PRD-16 build)

### Post-MVP
- [ ] Approval pattern learning with periodic analysis and auto-approval suggestions
- [ ] Weekly MindSweep intelligence report (capture volume, auto-route accuracy, pattern insights)
- [ ] Proactive capture prompts ("You usually capture homework wins on Fridays — how did this week go?")
- [ ] Auto-sweep shared content toggle (skip capture UI for share-to-app)
- [ ] MindSweep widget for dashboard (compact "last sweep" summary card)
- [ ] Seasonal content capture suggestions (back-to-school, holiday, summer break)
- [ ] SMS intake channel (text message → MindSweep processing)

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: MindSweep is the auto-sort mode for the existing Notepad → Queue pipeline. It is NOT a separate feature surface — it routes through existing infrastructure. "Send to → [destination]" = manual. "Review & Route" = semi-manual. "MindSweep" = automatic with configurable aggressiveness.
- [ ] Convention: `mindsweep-sort` Edge Function is the single brain that all intake channels feed. It returns extraction + classification + confidence + routing decisions. Every channel (RoutingStrip, quick-capture, share-to-app, email) passes through the same function.
- [ ] Convention: MindSweep confidence levels are 'high', 'medium', 'low'. Stored on `studio_queue.mindsweep_confidence`. Sensitivity rules override confidence — "Always Review" items go to Queue regardless of score.
- [ ] Convention: Three aggressiveness modes stored in `mindsweep_settings.aggressiveness`: 'always_ask', 'trust_obvious', 'full_autopilot'. Default is 'always_ask'. Mode determines which confidence levels auto-route vs. queue.
- [ ] Convention: Non-queue destinations (Journal, Victory, Best Intentions, Guiding Stars, Backburner, Archives) are routed directly by MindSweep, same as PRD-17's RoutingStrip convention. Queue-based destinations (Tasks, Lists, Widgets, Trackers) go through `studio_queue`.
- [ ] Convention: Email forwarding uses family-unique addresses (`[slug]-[hash]@sweep.myaimfamily.com`). Only whitelisted senders are processed. Unknown senders receive bounce reply.
- [ ] Convention: Quick-capture PWA entry point lives at `/sweep` with its own web manifest. Shares auth session with main app.
- [ ] Convention: `mindsweep_approval_patterns` tracks approval behavior for Phase 2 learning. Data is collected from MVP but learning recommendations are Phase 2.
- [ ] Convention: MindSweep adds `source` values to `studio_queue`: 'mindsweep_auto', 'mindsweep_queued', 'email_forward', 'share_to_app'.
- [ ] Convention: MindSweep uses a **holding queue** (`mindsweep_holding` table) for batched processing. Captures collect throughout the day and process in one batched LLM call via Sweep Now (on-demand) or auto-sweep (scheduled). This is the primary cost optimization — batching saves ~70-75% vs. individual calls.
- [ ] Convention: MindSweep classification uses **embedding-first** strategy. pgvector semantic similarity classifies ~90% of routine items for free. Only novel/ambiguous items need an LLM call. This gets smarter over time.
- [ ] Convention: Short voice captures (under 30 seconds) use free browser Web Speech API. Whisper reserved for recordings over 30 seconds or when user enables "High accuracy" mode.
- [ ] Convention: The Scan button (Lucide `ScanLine`) extracts text from documents/flyers/screenshots. **Images are NOT stored in MyAIM** — only extracted text is kept. This is explicitly not a photo upload feature.
- [ ] Convention: MindSweep target cost: ~$0.33/month for typical family, ~$0.66/month for heavy-use family of 9. These numbers assume batched processing, embedding-first classification, Web Speech API for short voice, and document-only scanning.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `mindsweep_settings`, `mindsweep_holding`, `mindsweep_allowed_senders`, `mindsweep_events`, `mindsweep_approval_patterns`
Columns added: `studio_queue.mindsweep_confidence` (TEXT, nullable), `studio_queue.mindsweep_event_id` (UUID, nullable), `families.sweep_email_address` (TEXT, nullable), `families.sweep_email_enabled` (BOOLEAN, default false)
Enums updated: `studio_queue.source` CHECK constraint expanded with 4 new values
Triggers added: Scheduled function for daily auto-sweep at member's configured `auto_sweep_time`

---

## Decisions Made This Session

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **MindSweep is a mode, not a destination** | MindSweep doesn't have its own storage. It's the auto-sort brain that routes to all existing destinations. This avoids duplicating infrastructure and keeps the mental model clean: capture anywhere → MindSweep sorts → items land where they belong. |
| 2 | **Three aggressiveness modes with "Always Ask" as default** | Builds trust before automation. Mom starts by seeing what MindSweep suggests, then upgrades to auto-routing as confidence builds. Maximalist options, minimalist defaults. |
| 3 | **Sensitive content rules always override aggressiveness** | Emotional content about children should never be auto-filed without mom's review, even in Full Autopilot mode. This is a trust and safety decision that protects the human-in-the-mix principle for high-stakes content. |
| 4 | **Share-to-app AND email forwarding (both)** | Different use cases. Share-to-app is faster for phone-native content (texts, screenshots, links). Email forwarding is better for email-native content (newsletters, school comms). Both are cheap to build. |
| 5 | **Dedicated PWA quick-capture at `/sweep`** | One tap from the home screen to voice capture. Skips the full app entirely. This is the "tell your friend about it" experience. Technically it's the same app with a different start URL and web manifest. |
| 6 | **Per-session auto-sort toggle with configurable default** | User can override their default mode at capture time. They discover a preference and set the default accordingly. Flexibility without friction. |
| 7 | **Approval pattern tracking from MVP, learning from Phase 2** | Collect the data immediately so Phase 2 has a rich dataset. But don't ship the learning behavior until families trust the system and you have real usage patterns to validate. |
| 8 | **MindSweep Digest as PRD-18 section type #28** | MindSweep awareness belongs in the rhythms mom is already doing, not as a separate check. Morning: "here's what was captured overnight." Evening: "here's what was captured today." Weekly: "here's your MindSweep stats." |
| 9 | **Backburner as MindSweep routing destination** | "Someday/maybe" items should auto-route to Backburner rather than cluttering the active task queue. MindSweep detects "not now but not never" language and routes accordingly. |
| 10 | **Cross-member routing with suggestion, not auto-action** | MindSweep suggests "Route to Dad's queue?" but doesn't auto-send to another member without confirmation. Cross-member routing is a higher-stakes action that deserves a human check. |
| 11 | **Email addresses per family, not per member** | Simpler mental model. One address per family. Mom manages the allowed senders list. Individual members don't need their own email intake at MVP — they use in-app capture. |
| 12 | **QuickTasks strip auto-sorts by usage frequency** | Confirmed from existing PRD-04 pattern. MindSweep doesn't need special placement — if mom uses it constantly, it naturally floats to the front. |
| 13 | **Batched processing: collect all day, sweep once** | The single biggest cost optimization. 15 individual LLM calls vs. 1 batched call saves ~70-75% on classification costs. Also creates better UX — one satisfying "15 items sorted" moment instead of 15 tiny toasts. Sweep Now (on-demand) + auto-sweep (scheduled, default 8pm) + immediate (email forwarding option). |
| 14 | **Embedding-first classification before LLM** | pgvector semantic similarity handles ~90% of routine classification for essentially free ($0.00002/embedding). Only novel/ambiguous items need an LLM call. Gets smarter over time as the family builds more content embeddings. |
| 15 | **Web Speech API for short voice captures, Whisper for long** | Short captures (under 30 seconds) don't need Whisper's accuracy for grocery lists and quick reminders. Free browser API saves ~$0.34/month for heavy users. User can override with "High accuracy" toggle. |
| 16 | **Scan, not Photo — document extraction only, images not stored** | MindSweep reads text from flyers, bulletins, and screenshots but does NOT store photos. Framing the button as "Scan" (Lucide `ScanLine`) sets the right expectation. Eliminates ~$0.60/month in unnecessary vision API calls from random memory photos. Only 10-15 document scans/month expected vs. 50 random photos. |
| 17 | **Holding queue with server-side staging** | Email forwarding and share-to-app may deliver content when the user's device isn't active. Server-side `mindsweep_holding` table ensures nothing is lost. IndexedDB serves as secondary local cache for offline captures. |

---

*End of PRD-17B*
