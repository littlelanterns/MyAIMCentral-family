# PRD-30: Safety Monitoring

**Status:** Not Started
**Dependencies:** PRD-05 (LiLa Core AI System), PRD-02 (Permissions & Access Control), PRD-15 (Messages, Requests & Notifications), PRD-20 (Safe Harbor)
**Created:** March 21, 2026
**Last Updated:** March 21, 2026

---

## Overview

Safety Monitoring is the invisible guardian behind MyAIM's family safety promise. While PRD-05 defines LiLa's real-time crisis override (immediately providing crisis resources during a conversation) and PRD-20 defines Safe Harbor's emotional processing space, PRD-30 owns the behind-the-scenes detection pipeline that scans LiLa conversations for concerning patterns and privately alerts designated parents — without the monitored member ever knowing a flag was raised.

The philosophy is prevention-first, trust-preserving. MyAIM has a unique advantage over external monitoring tools like Bark, Canopy, and Pinwheel: we own the AI. LiLa doesn't just detect problems after they happen — her system prompt actively redirects conversations away from harmful territory in real-time (the Canopy-style guardrail), while simultaneously generating private safety flags for parents when concerning patterns emerge (the Bark-style alert). This dual layer — prevent AND detect — is the core differentiator.

Safety Monitoring serves any family member mom designates for monitoring. While the most common use case is teen monitoring, the system supports monitoring any non-primary-parent member. The feature is invisible to monitored members, respects the platform's privacy model, and aligns with the Faith & Ethics Framework's commitment to protecting safety without weaponizing surveillance.

> **Mom experience goal:** I set it once and forget about it. If one of my kids says something concerning to LiLa, I get a notification with just enough context to know what happened and a suggestion for how to bring it up. I'm not reading their conversations — I'm getting a safety net. The system also tells me about patterns over time, not just individual incidents. And I can tune how sensitive each category is, because what's concerning for my 10-year-old is different from my 16-year-old.

> **Depends on:** PRD-05 (LiLa Core AI System) defines the conversation engine, model routing, and global crisis override. PRD-02 (Permissions & Access Control) defines the five-role permission model and mom's configuration authority. PRD-15 (Messages, Requests & Notifications) defines the notification delivery system, including the safety alert category that bypasses DND. PRD-20 (Safe Harbor) defines the Safe Harbor data exclusion conventions and the teen AI literacy module that transparently discloses the safety flag system.

---

## Architectural Boundaries

### What PRD-30 Owns

| System | Scope |
|--------|-------|
| Detection pipeline | Two-layer analysis: keyword/phrase matching + Haiku conversation classification |
| Safety flag generation | Creating flag records from detected concerns |
| Flag severity classification | Three-tier severity: Concern, Warning, Critical |
| Monitoring configuration | Per-member monitoring toggle, per-category sensitivity thresholds |
| Flag review experience | Mom's flag detail view, acknowledgment flow, flag history |
| Pattern summary | Periodic digest of flag trends per monitored member |
| Conversation starter suggestions | LiLa-generated guidance for how to discuss flagged topics with the child |
| Safety resources library | Curated, categorized crisis and support resources |
| Notification flag recipient config | Which parent-role members receive safety flag notifications |

### What Other PRDs Own (Not Duplicated Here)

| PRD | What It Owns | How PRD-30 Connects |
|-----|-------------|---------------------|
| PRD-05 (LiLa Core) | Conversation engine, global crisis override, model routing, system prompts | PRD-30 hooks into the message pipeline after each LiLa response to run detection. Global crisis override is PRD-05's real-time guardrail; PRD-30 adds the invisible parent notification layer. |
| PRD-02 (Permissions) | Five-role permission model, mom's configuration authority | PRD-30 uses the existing permission model. Mom configures monitoring; dad receives flags only if mom grants access. |
| PRD-15 (Notifications) | Notification delivery system, notification preferences, safety alert priority | PRD-30 creates notification records; PRD-15 delivers them. Safety alerts bypass DND per PRD-15's existing rules. |
| PRD-20 (Safe Harbor) | Safe Harbor conversations, teen AI literacy module, Safe Harbor data exclusions | Safe Harbor conversations ARE subject to safety monitoring (confirmed in PRD-20). The teen AI literacy module transparently discloses the safety flag system. |
| PRD-22 (Settings) | Settings page structure, section registration | PRD-30 registers a "Safety Monitoring" section in Settings. |

---

## User Stories

### Configuration
- As a mom, I want to designate which family members are monitored for safety concerns so I can protect the children who need it while respecting older teens' growing independence.
- As a mom, I want to adjust sensitivity per trigger category per child so my 16-year-old doesn't generate profanity flags for normal teen language while my 10-year-old's monitoring stays strict.
- As a mom, I want to grant my husband access to safety flag notifications so we can share the responsibility of responding to concerns.

### Detection & Alerting
- As a mom, I want to be notified immediately when my child's conversation with LiLa contains critical safety indicators (self-harm, crisis language) so I can respond without delay.
- As a mom, I want safety flags to include a brief context snippet (not the full conversation) so I understand what happened without invading my child's privacy.
- As a mom, I want each flag to come with a suggestion for how to start a conversation about the topic so I'm equipped to respond, not just alarmed.

### Review & History
- As a mom, I want to review my child's safety flag history so I can see patterns over time, not just individual incidents.
- As a mom, I want a periodic summary of safety monitoring trends so I can understand whether things are improving or need professional attention.
- As a dad with safety notification access, I want to see the same flags and history my wife sees so we can coordinate our response.

### Privacy & Trust
- As a teen, I was told during the AI Literacy Module (PRD-20) that the safety flag system exists, so I'm not blindsided if my parents bring up something I discussed with LiLa.
- As a monitored member, I should never see any indication that a flag was raised on my behalf — no UI changes, no behavioral differences from LiLa.

---

## Screens

### Screen 1: Safety Monitoring Configuration (Settings Section)

**What the user sees:**

A section within Settings (PRD-22) titled "Safety Monitoring," accessible only to mom/primary parent.

```
┌─────────────────────────────────────────────────────┐
│  Safety Monitoring                                  │
│  ─────────────────────────────────────────────────  │
│  Monitor family members' LiLa conversations for     │
│  concerning patterns. Flagged content is shared      │
│  privately with designated parents only.             │
│                                                     │
│  WHO RECEIVES SAFETY ALERTS                         │
│  ─────────────────────────────────────────────────  │
│  You (always)                    [✓] 🔒             │
│  Dad / [Partner Name]            [✓]                │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  MONITORED MEMBERS                                  │
│  ─────────────────────────────────────────────────  │
│  Jake (Independent, 16)          [ON]    [⚙️]       │
│  Emma (Guided, 12)               [ON]    [⚙️]       │
│  Lily (Play, 8)                  [ON]    [⚙️]       │
│  [Partner Name]                  [OFF]   [⚙️]       │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  NOTIFICATION DELIVERY                              │
│  ─────────────────────────────────────────────────  │
│  In-app notifications            [✓]                │
│  Email alerts                    [✓]                │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  PATTERN SUMMARY                                    │
│  ─────────────────────────────────────────────────  │
│  Weekly digest email              [ON]              │
│                                                     │
│  [View Flag History →]                              │
└─────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Children are monitored ON by default. Mom can turn monitoring OFF per child (opt-out model — safety first).
- Dad/Additional Adult monitoring is OFF by default (opt-in for adults).
- Mom's own alert receipt is always on and locked — primary parent always receives flags.
- Dad's alert receipt is a toggle mom controls.
- The ⚙️ gear icon next to each monitored member opens per-member sensitivity configuration (Screen 2).

**Interactions:**
- Toggle monitoring ON/OFF per member
- Toggle dad's safety notification access
- Toggle notification delivery channels (in-app, email)
- Toggle weekly pattern summary digest
- Tap "View Flag History" → navigates to Screen 4

**Data created/updated:**
- `safety_monitoring_configs` records per member
- `safety_notification_recipients` records

---

### Screen 2: Per-Member Sensitivity Configuration

**What the user sees:**

Opened by tapping ⚙️ next to a monitored member's name. Modal or slide-over panel.

```
┌─────────────────────────────────────────────────────┐
│  Safety Sensitivity — Jake (16)              ✕      │
│  ─────────────────────────────────────────────────  │
│  Adjust how sensitively each category is monitored  │
│  for this member. Higher = more flags.              │
│                                                     │
│  Self-Harm / Suicidal Ideation                      │
│  [████████████████████] High 🔒                     │
│                                                     │
│  Abuse Indicators                                   │
│  [████████████████████] High 🔒                     │
│                                                     │
│  Substance Use                                      │
│  [████████████░░░░░░░░] Medium                      │
│                                                     │
│  Eating Disorder Language                            │
│  [████████████████████] High                        │
│                                                     │
│  Severe Bullying                                    │
│  [████████████░░░░░░░░] Medium                      │
│                                                     │
│  Sexual Content / Predatory Patterns                │
│  [████████████████████] High 🔒                     │
│                                                     │
│  Profanity / Aggressive Language                    │
│  [████░░░░░░░░░░░░░░░░] Low                         │
│                                                     │
│  Other Concerning Patterns                          │
│  [████████████░░░░░░░░] Medium                      │
│                                                     │
│  [Reset to Defaults]                [Save]          │
└─────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Three sensitivity levels per category: Low, Medium, High.
- Self-Harm, Abuse Indicators, and Sexual Content / Predatory Patterns are locked at High for all members. These are non-negotiable safety categories — mom cannot lower them.
- Other categories are adjustable per member. Defaults vary by shell type:
  - **Play shell children:** All categories default to High.
  - **Guided shell children:** All adjustable categories default to High.
  - **Independent shell teens:** Substance Use, Bullying, Other default to Medium. Profanity defaults to Low.
  - **Adults (if opted in):** All adjustable categories default to Medium. Profanity defaults to Low.

**Interactions:**
- Slide or tap to change sensitivity level per category
- Tap "Reset to Defaults" to restore shell-type-appropriate defaults
- Tap "Save" to persist

**Data created/updated:**
- `safety_sensitivity_configs` records (per member, per category)

---

### Screen 3: Safety Flag Detail (from Notification Tap)

**What the user sees:**

Reached by tapping a safety alert notification (PRD-15) or from the flag history view. Full-screen or large modal.

```
┌─────────────────────────────────────────────────────┐
│  ⚠️ Safety Flag — Jake                       ✕     │
│  ─────────────────────────────────────────────────  │
│  March 21, 2026 at 3:47 PM                         │
│                                                     │
│  SEVERITY: ● Warning (Orange)                       │
│  CATEGORY: Substance Use                            │
│                                                     │
│  CONTEXT                                            │
│  ─────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────┐    │
│  │ Jake: "...honestly I've been thinking about  │    │
│  │ trying what my friends are doing at parties" │    │
│  │                                              │    │
│  │ LiLa: "It sounds like you're feeling some   │    │
│  │ pressure from your friend group..."          │    │
│  │                                              │    │
│  │ Jake: "yeah I just want to fit in, they all  │    │
│  │ drink and it's not a big deal to them"       │    │
│  └─────────────────────────────────────────────┘    │
│  [Show More Context ↓]                              │
│                                                     │
│  HOW TO BRING THIS UP                               │
│  ─────────────────────────────────────────────────  │
│  "Jake may be feeling social pressure around        │
│  alcohol use. A low-pressure opening could be:      │
│  'I was thinking about how hard it is when your     │
│  friends are doing stuff you're not sure about.     │
│  Have you been dealing with any of that?'           │
│  Avoid leading with rules or consequences —         │
│  lead with curiosity and empathy first."            │
│                                                     │
│  RESOURCES                                          │
│  ─────────────────────────────────────────────────  │
│  📞 SAMHSA Helpline: 1-800-662-4357                │
│  🔗 Partnership to End Addiction: drugfree.org      │
│  📖 "How to Talk to Your Teen About Alcohol"        │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  [Acknowledge]    [Dismiss (False Positive)]        │
└─────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Default context snippet: the flagged message + 2 messages before it (LiLa's response and the prior user message for context).
- "Show More Context" expands to 5 messages total. Mom never sees the full conversation transcript — just enough to understand the concern.
- "How to Bring This Up" is a LiLa-generated conversation starter (single Haiku call per flag), personalized to the trigger category and the child's age. Follows the "I Go First" teaching philosophy.
- Resources are curated per trigger category from the `safety_resources` reference table (not AI-generated).
- **Acknowledge:** Marks the flag as reviewed. Stays in history with "Acknowledged" status.
- **Dismiss (False Positive):** Marks as reviewed and false positive. Stays in history with "Dismissed" status and grayed appearance. Over time, dismissed flags in a category inform the system that sensitivity may need tuning (post-MVP: auto-suggestion to lower sensitivity).
- No "Delete" action — all flags are kept permanently for the safety record.
- Critical-severity flags have a red banner and the context snippet is shown expanded by default.

**Interactions:**
- Tap "Show More Context" to expand snippet
- Tap resource links to open external resources
- Tap "Acknowledge" or "Dismiss"
- After action, flag moves to history with the appropriate status

**Data created/updated:**
- `safety_flags.status` updated to 'acknowledged' or 'dismissed'
- `safety_flags.reviewed_at` and `reviewed_by` populated

---

### Screen 4: Safety Flag History

**What the user sees:**

Accessed from Settings > Safety Monitoring > "View Flag History" or from Family Overview (PRD-14C) Safety section. Also accessible from the full notification history filtered to safety category.

```
┌─────────────────────────────────────────────────────┐
│  Safety Flag History                                │
│  ─────────────────────────────────────────────────  │
│  [All Members ▼]  [All Categories ▼]  [All Time ▼] │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  This Week                                          │
│  ─────────────────────────────────────────────────  │
│  ⚠️ Jake — Substance Use (Warning)    Mar 21, 3pm  │
│     Status: New                                     │
│                                                     │
│  Last Week                                          │
│  ─────────────────────────────────────────────────  │
│  ● Emma — Bullying (Concern)          Mar 15, 11am │
│     Status: Acknowledged ✓                          │
│                                                     │
│  ○ Jake — Profanity (Concern)         Mar 14, 4pm  │
│     Status: Dismissed                               │
│                                                     │
│  Earlier                                            │
│  ─────────────────────────────────────────────────  │
│  🔴 Emma — Self-Harm (Critical)       Mar 2, 9pm   │
│     Status: Acknowledged ✓                          │
│                                                     │
│  [Load More...]                                     │
└─────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Filterable by member, category, and time range.
- Grouped by time period (This Week, Last Week, Earlier).
- Visual severity indicators: ● yellow (Concern), ⚠️ orange (Warning), 🔴 red (Critical).
- Dismissed flags shown in muted/grayed styling.
- Tapping any flag opens its detail view (Screen 3).

**Interactions:**
- Filter by member, category, time range
- Tap any flag → opens detail view
- Scroll to load more

**Data created/updated:**
- None (read-only view)

---

### Screen 5: Family Overview — Safety Section

**What the user sees:**

A collapsible section on the Family Overview (PRD-14C), only visible to mom (and dad if granted safety notification access). Shows a per-child summary card.

```
┌─────────────────────────────────────────────────────┐
│  SAFETY MONITORING                           [⚙️]   │
│  ─────────────────────────────────────────────────  │
│  Jake: 1 new flag (⚠️ Warning)         [Review →]  │
│  Emma: No flags this week              ✓            │
│  Lily: Monitoring active, no flags     ✓            │
│  ─────────────────────────────────────────────────  │
│  [View Full History →]                              │
└─────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Shows only members with active monitoring.
- Highlights any unreviewed flags with severity indicator.
- ⚙️ gear links to Settings > Safety Monitoring configuration.
- "Review →" links to the specific unreviewed flag detail.
- "View Full History →" links to the full flag history view (Screen 4).
- If no members are monitored, section shows: "Safety Monitoring is available in Settings."

**Data created/updated:**
- None (read-only summary view)

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | Configures all monitoring. Always receives flags. Reviews flag history. Accesses all screens. Cannot be monitored. |
| Dad / Additional Adult | Conditional | Receives flags only if mom grants safety notification access. Can view flag history for members they can see. Can be monitored (opt-in by mom). Cannot configure monitoring settings. |
| Special Adult | None | No safety monitoring visibility. Not monitorable (they don't use LiLa). |
| Independent (Teen) | None | No awareness of flag generation. AI Literacy Module (PRD-20) provides transparent disclosure that the system exists. |
| Guided / Play | None | No awareness. Guided child conversations are already visible to mom by default (PRD-05). Safety monitoring adds the classification layer. |

### Shell Behavior

- **Mom shell:** Safety Monitoring section in Settings. Safety summary section on Family Overview. Safety alert notifications.
- **Dad shell (if granted access):** Safety alert notifications. Can view flag history from notification tap-through. No configuration access.
- **Independent shell:** No Safety Monitoring surfaces. No indication of monitoring activity.
- **Guided shell:** No Safety Monitoring surfaces.
- **Play shell:** No Safety Monitoring surfaces.
- **Special Adult shell:** Not present.

### Privacy & Transparency

- **Teens know the system exists** via PRD-20's AI Literacy Module ("the app will quietly let [mom/designated parent] know"). This is not hidden surveillance — it's disclosed as a safety net.
- **Teens do NOT see** individual flag events, flag history, or any indication that a specific flag was raised.
- **Safe Harbor conversations ARE monitored** for safety flags. This is confirmed in PRD-20. The teen AI Literacy Module explicitly covers this ("if you ever say something that sounds like you might be in danger...").
- **Dad can see flags** only if mom grants access. Dad cannot configure monitoring or change sensitivity.
- **Context snippets are limited** — never the full conversation. Max 5 messages expanded. This preserves the child's conversational privacy while giving parents enough context to respond.

---

## Detection Pipeline

### Layer 1: Keyword/Phrase Matching (Every Message)

Runs on every LiLa message from a monitored member, synchronously after the message is saved to `lila_messages`. This is a fast, cheap text-matching check.

**Implementation:** A curated keyword/phrase list stored in `safety_keywords` reference table. Each keyword is mapped to a trigger category and a base severity. The list is maintained by the platform admin and can be updated without deployment.

**Matching approach:**
- Case-insensitive substring matching with word boundary awareness.
- Phrase matching (multi-word patterns like "want to die" or "cutting myself").
- Context-aware negation: "I don't want to die" still triggers (better to over-flag than under-flag for critical categories).
- Slang and abbreviation awareness: the keyword list includes known teen slang variants (e.g., "unalive" for suicide, "sh" for self-harm).

**What Layer 1 produces:** A `keyword_match` event with: matched keyword/phrase, category, base severity, message_id, member_id. If the category's sensitivity for this member is set to Low and the base severity is Concern, the match is logged but no flag is generated (filtered by sensitivity). Medium and High sensitivity both generate flags from keyword matches; Medium just requires a higher base severity threshold for the less critical categories.

### Layer 2: Haiku Conversation Classification (Per-Conversation)

Runs asynchronously at conversation end (when the conversation is closed or after 30 minutes of inactivity). Evaluates the full conversation for patterns that keywords alone would miss — gradual hopelessness, isolation language, grooming patterns, escalating emotional distress without explicit crisis words.

**Implementation:** A single Haiku API call with a structured classification prompt. The prompt includes the full conversation text and asks Haiku to evaluate across all trigger categories, returning a JSON response with detected concerns, severity assessment, and the specific message indices that raised concern.

**Cost:** ~$0.002 per conversation classification (Haiku is cheap). Only runs for monitored members. Estimated 5-20 conversations/member/month = $0.01-$0.04/member/month.

**What Layer 2 produces:** A `conversation_classification` event with: array of detected concerns (each with category, severity, key_message_indices, reasoning). If any concern's severity meets the member's sensitivity threshold for that category, a flag is generated.

### Flag Generation

When either layer produces a detection that meets the member's sensitivity threshold:

1. A `safety_flags` record is created.
2. A Haiku call generates a "How to Bring This Up" conversation starter suggestion (one sentence prompt context, 2-3 sentence suggestion). Cost: ~$0.001 per flag.
3. A notification record is created in PRD-15's `notifications` table with `category = 'safety'` and `priority = 'high'`.
4. If email delivery is enabled, an email notification is queued.

**Deduplication:** If a flag already exists for the same member + same category within the last 24 hours and the new detection is the same or lower severity, the existing flag is updated with the new context rather than creating a duplicate. If the new detection is higher severity, a new flag is created.

### Trigger Categories

| Category | Key | Description | Lockable? |
|----------|-----|-------------|-----------|
| Self-Harm / Suicidal Ideation | `self_harm` | Language about hurting oneself, suicidal thoughts, "unalive" references, cutting, etc. | Locked at High |
| Abuse Indicators | `abuse` | Descriptions of physical, emotional, or sexual abuse; fear of a specific person; secrecy about injuries | Locked at High |
| Sexual Content / Predatory Patterns | `sexual_predatory` | Sexual solicitation, grooming patterns, age-inappropriate sexual content, "don't tell anyone" patterns | Locked at High |
| Substance Use | `substance` | Alcohol, drug use, vaping, peer pressure around substances | Adjustable |
| Eating Disorder Language | `eating_disorder` | Restriction, purging, body dysmorphia, calorie obsession, "pro-ana" language | Adjustable |
| Severe Bullying | `bullying` | Being bullied, cyberbullying, social exclusion, threats from peers | Adjustable |
| Profanity / Aggressive Language | `profanity` | Excessive profanity, violent language, aggressive outbursts | Adjustable |
| Other Concerning Patterns | `other` | Isolation, withdrawal, persistent hopelessness, running away, major behavioral changes | Adjustable |

---

## Data Schema

### Table: `safety_monitoring_configs`

Per-family-member monitoring configuration. Created when monitoring is toggled on.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| monitored_member_id | UUID | | NOT NULL | FK → family_members. The member being monitored. |
| is_active | BOOLEAN | true | NOT NULL | Whether monitoring is currently active for this member |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |
| created_by | UUID | | NOT NULL | FK → family_members. Should always be primary parent. |

**RLS Policy:** Primary parent can CRUD for their family. No other member can access.

**Indexes:**
- `(family_id, monitored_member_id)` UNIQUE — one config per member
- `(family_id, is_active)` — "which members are actively monitored?"

---

### Table: `safety_sensitivity_configs`

Per-member, per-category sensitivity thresholds.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| monitored_member_id | UUID | | NOT NULL | FK → family_members |
| category | TEXT | | NOT NULL | Trigger category key (self_harm, abuse, substance, etc.) |
| sensitivity | TEXT | 'high' | NOT NULL | CHECK: 'low', 'medium', 'high'. Locked categories override to 'high' at application layer. |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Primary parent can CRUD for their family. No other member can access.

**Indexes:**
- `(family_id, monitored_member_id, category)` UNIQUE — one sensitivity per member per category

---

### Table: `safety_notification_recipients`

Tracks which parent-role members receive safety flag notifications.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| recipient_member_id | UUID | | NOT NULL | FK → family_members. Must be a parent-role member. |
| is_active | BOOLEAN | true | NOT NULL | |
| notification_channels | TEXT[] | '{in_app}' | NOT NULL | Array: 'in_app', 'email'. Extensible for future 'push', 'sms'. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Primary parent can CRUD. Recipient can read their own record.

**Indexes:**
- `(family_id, recipient_member_id)` UNIQUE

---

### Table: `safety_flags`

Individual safety flag records.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| flagged_member_id | UUID | | NOT NULL | FK → family_members. The member whose conversation was flagged. |
| conversation_id | UUID | | NOT NULL | FK → lila_conversations |
| category | TEXT | | NOT NULL | Trigger category key |
| severity | TEXT | | NOT NULL | CHECK: 'concern', 'warning', 'critical' |
| detection_layer | TEXT | | NOT NULL | CHECK: 'keyword', 'classification', 'both'. Which detection layer triggered this flag. |
| context_snippet | JSONB | | NOT NULL | Array of message objects: [{role, content, message_id}]. Max 5 messages. |
| matched_keywords | TEXT[] | '{}' | NOT NULL | Keywords that triggered (Layer 1). Empty if Layer 2 only. |
| classification_reasoning | TEXT | null | YES | Haiku's reasoning for the classification (Layer 2). Null if Layer 1 only. |
| conversation_starter | TEXT | null | YES | LiLa-generated suggestion for how to discuss this with the child. |
| resource_ids | UUID[] | '{}' | NOT NULL | FK references to safety_resources. |
| status | TEXT | 'new' | NOT NULL | CHECK: 'new', 'acknowledged', 'dismissed' |
| reviewed_at | TIMESTAMPTZ | null | YES | When the flag was reviewed |
| reviewed_by | UUID | null | YES | FK → family_members. Who reviewed. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Primary parent and granted notification recipients can read flags for their family. No member can delete. Primary parent can update status. Flagged member CANNOT access.

**Indexes:**
- `(family_id, flagged_member_id, created_at DESC)` — "flags for this child, newest first"
- `(family_id, status)` — "unreviewed flags"
- `(family_id, flagged_member_id, category, created_at DESC)` — deduplication window check
- `(family_id, created_at DESC)` — "all flags, newest first"

---

### Table: `safety_keywords`

Curated keyword/phrase library for Layer 1 detection. Platform-level (not per-family).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| keyword | TEXT | | NOT NULL | The keyword or phrase to match |
| category | TEXT | | NOT NULL | Trigger category key |
| base_severity | TEXT | 'concern' | NOT NULL | CHECK: 'concern', 'warning', 'critical'. The minimum severity this keyword generates. |
| is_phrase | BOOLEAN | false | NOT NULL | If true, match the full phrase (multi-word). If false, word-boundary match. |
| is_active | BOOLEAN | true | NOT NULL | Soft toggle for individual keywords |
| notes | TEXT | null | YES | Admin notes on why this keyword is included |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Read-only for the detection pipeline (service role). Admin can CRUD.

**Indexes:**
- `(category, is_active)` — "active keywords by category"
- `(keyword)` UNIQUE — no duplicate keywords

---

### Table: `safety_resources`

Curated support resources per trigger category. Platform-level.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| category | TEXT | | NOT NULL | Trigger category key |
| resource_name | TEXT | | NOT NULL | Display name (e.g., "988 Suicide & Crisis Lifeline") |
| resource_type | TEXT | | NOT NULL | CHECK: 'hotline', 'website', 'article', 'book'. |
| resource_value | TEXT | | NOT NULL | Phone number, URL, or reference |
| description | TEXT | null | YES | Brief description of the resource |
| display_order | INTEGER | 0 | NOT NULL | Sort order within category |
| is_active | BOOLEAN | true | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Read-only for the detection pipeline and flag display. Admin can CRUD.

**Indexes:**
- `(category, is_active, display_order)` — "resources for this category, sorted"

---

### Table: `safety_pattern_summaries`

Periodic (weekly) digest data per monitored member.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| monitored_member_id | UUID | | NOT NULL | FK → family_members |
| period_start | DATE | | NOT NULL | Start of the summary period |
| period_end | DATE | | NOT NULL | End of the summary period |
| summary_data | JSONB | | NOT NULL | {category_counts: {self_harm: 0, substance: 1, ...}, total_flags: 1, severity_breakdown: {concern: 1, warning: 0, critical: 0}, trend: 'stable'} |
| narrative | TEXT | null | YES | LiLa-generated narrative summary (e.g., "One substance-use flag this week, down from two last week. No critical flags.") |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Primary parent and granted notification recipients can read for their family. Flagged member CANNOT access.

**Indexes:**
- `(family_id, monitored_member_id, period_end DESC)` — "latest summary for this child"

---

### Column Addition: `lila_messages`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| safety_scanned | BOOLEAN | false | NOT NULL | Whether this message has been processed by the Layer 1 keyword scanner. Prevents double-processing. |

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| LiLa conversation engine (PRD-05) | Every message from a monitored member triggers Layer 1 keyword scanning. Conversation completion triggers Layer 2 classification. |
| Family member setup (PRD-01) | When a new child is added to the family, a `safety_monitoring_configs` record is auto-created with `is_active = true` (children default to monitored). |
| PRD-20 (Safe Harbor) | Safe Harbor conversations are included in monitoring. The `is_safe_harbor` flag on the conversation does NOT exclude it from safety scanning. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-15 (Notifications) | Safety flags create `notifications` records with `category = 'safety'`, `priority = 'high'`. These bypass DND per PRD-15's existing rules. |
| PRD-14C (Family Overview) | Safety summary section pulls from `safety_flags` and `safety_monitoring_configs` for the Family Overview dashboard. |
| PRD-22 (Settings) | Safety Monitoring configuration section registered in Settings. |
| Email delivery | If email notifications are enabled, safety flags trigger an email via the existing email notification pipeline. Pattern summaries are delivered as weekly digest emails. |

---

## AI Integration

### Detection Classification Prompt (Layer 2)

No guided mode registered — this is a background AI call, not a user-facing conversation.

**Model:** Haiku (fast, cheap, sufficient for structured classification)

**System prompt pattern:**

```
You are a safety classification system for a family management platform. 
Analyze the following conversation between a family member and LiLa (an AI assistant) 
for concerning patterns.

Evaluate across these categories:
- self_harm: Self-harm, suicidal ideation, "unalive" references
- abuse: Physical, emotional, or sexual abuse indicators
- sexual_predatory: Sexual content, grooming patterns, age-inappropriate sexual content
- substance: Alcohol, drug use, peer pressure around substances
- eating_disorder: Restriction, purging, body dysmorphia
- bullying: Being bullied, cyberbullying, social exclusion
- profanity: Excessive profanity, violent/aggressive language
- other: Isolation, withdrawal, persistent hopelessness, running away

For each detected concern, provide:
- category (from above)
- severity: "concern" (mild indicators), "warning" (clear concerning patterns), "critical" (immediate safety risk)
- key_message_indices: which messages raised the concern (0-indexed)
- reasoning: brief explanation

Respond ONLY with valid JSON. If no concerns detected, respond with {"concerns": []}.
```

### Conversation Starter Generation

**Model:** Haiku

**Prompt pattern:**

```
A parent has been notified that their [age]-year-old [child/teen] discussed 
[category description] with an AI assistant. Generate a brief, warm, 
non-confrontational conversation starter the parent could use to bring this up.

Rules:
- Lead with curiosity and empathy, not rules or consequences
- Don't reference the AI conversation directly (the child should not feel surveilled)
- Keep it to 2-3 sentences
- Match the parent's likely emotional state (concerned but wanting to help)
```

### Pattern Summary Narrative

**Model:** Haiku

**Scheduled:** Weekly (Sunday night), runs for each monitored member with at least one flag in the period.

**Prompt:** Summarizes the week's flag data into a brief human-readable narrative with trend comparison to the prior week.

---

## Edge Cases

### No Flags Generated (Healthy State)
- The most common state. Configuration remains active, no flags appear.
- Weekly summary for members with zero flags: "No concerns detected this week." (only sent if mom has the weekly digest enabled).
- Family Overview section shows "✓" for all monitored members.

### High Volume of Flags (Alert Fatigue)
- If a member generates more than 5 flags in a single day across the same category, the system consolidates into a single daily summary flag: "Multiple [category] indicators detected today" with context from the highest-severity instance.
- Post-MVP: suggest sensitivity adjustment if dismissal rate for a category exceeds 80%.

### Monitoring Toggled Off
- When mom turns monitoring off for a member, no new flags are generated.
- Existing flag history remains accessible (never deleted).
- Layer 1 scanning skips messages from that member. Layer 2 classification does not run.

### Family Member Removed
- If a family member is removed from the family, their monitoring config is soft-deleted.
- Flag history persists (safety records should never be lost).

### Conversation With No Clear Concerning Content
- Layer 2 classification returns `{"concerns": []}`. No flag generated.
- This is the expected outcome for the vast majority of conversations.

### Layer 1 and Layer 2 Disagree
- If Layer 1 catches a keyword match but Layer 2 classifies the full conversation as non-concerning, the keyword match still generates a flag (better to over-alert than under-alert), but the flag is created at the lower of the two severities with a note that the pattern-level review found no broader concern.

### Network Failure During Detection
- Layer 1 (keyword matching) runs locally against the database — no network dependency.
- Layer 2 (Haiku classification) runs asynchronously. If the API call fails, it retries up to 3 times with exponential backoff. If all retries fail, the conversation is flagged for manual classification review in the next batch.

### Same Conversation Triggers Multiple Categories
- Each category generates its own flag record. A single conversation can produce multiple flags (e.g., both substance use and bullying).
- Notifications are consolidated: one notification per conversation with the highest severity, listing all categories. "Safety alert for Jake: Substance Use (Warning), Bullying (Concern)."

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `safety_monitoring_basic` | Keyword-based detection (Layer 1), basic flag review, curated resources | Enhanced |
| `safety_monitoring_ai` | AI classification (Layer 2), conversation starter suggestions, pattern summaries | Full Magic |

> **Decision rationale:** Basic keyword monitoring should be accessible at Enhanced tier — safety shouldn't be locked behind the highest paywall. The AI-powered features (Layer 2 classification, personalized conversation starters, pattern analysis) are Full Magic because they incur per-conversation AI costs.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Journal and message scanning | Extend detection to journal entries and PRD-15 messages | Post-MVP enhancement |
| Auto-sensitivity suggestions | Based on dismissal rate, suggest sensitivity adjustments | Post-MVP enhancement |
| Admin keyword management UI | Platform admin interface for managing the safety_keywords table | PRD-32 (Admin Console) |
| Push notification delivery for safety alerts | Critical safety flags delivered via push notification | PRD-33 (Offline / PWA) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Safety flag alert notifications | PRD-15 (listed under "MVP When Dependency Is Ready") | PRD-30 creates notification records with `category = 'safety'`, `priority = 'high'`. PRD-15 delivers them via the notification tray and email. |
| Global crisis keyword detection → parent notification | PRD-05 / Complete Reference (described conceptually) | PRD-30 provides the full detection pipeline, flag schema, and parent review experience that makes the concept operational. |
| Safe Harbor safety flag system | PRD-20 (referenced in Teen AI Literacy Module, Area 4) | PRD-30 is the system PRD-20 describes. Safe Harbor conversations are monitored per the flag pipeline defined here. |
| Family Overview safety section stub | PRD-14C (section extensibility) | PRD-30 registers a `safety_monitoring` section key that renders the summary view (Screen 5). |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `safety_monitoring_configs` table created with RLS policies
- [ ] `safety_sensitivity_configs` table created with RLS policies
- [ ] `safety_notification_recipients` table created with RLS policies
- [ ] `safety_flags` table created with RLS policies
- [ ] `safety_keywords` table created and seeded with initial keyword library (minimum 50 keywords across all categories)
- [ ] `safety_resources` table created and seeded with curated resources per category
- [ ] `safety_pattern_summaries` table created with RLS policies
- [ ] Layer 1 keyword matching runs on every LiLa message from monitored members
- [ ] Layer 2 Haiku classification runs on conversation completion for monitored members
- [ ] Flag generation creates records with context snippets (flagged message + 2 before)
- [ ] Conversation starter suggestion generated per flag via Haiku
- [ ] Safety Monitoring section in Settings (Screen 1) — toggles, recipient config, delivery channels
- [ ] Per-member sensitivity configuration (Screen 2) — category sliders with locked categories
- [ ] Safety flag detail view (Screen 3) — context, conversation starter, resources, acknowledge/dismiss
- [ ] Safety flag history view (Screen 4) — filterable, sorted
- [ ] Family Overview safety summary section (Screen 5) — per-child status
- [ ] Notification integration: safety flags create notifications that bypass DND
- [ ] Email delivery for safety flag alerts (when enabled)
- [ ] New children auto-created with monitoring ON
- [ ] Locked categories (self_harm, abuse, sexual_predatory) cannot be lowered below High
- [ ] Flagged member has zero visibility into flag existence
- [ ] RLS verified: flagged member cannot query safety_flags, safety_monitoring_configs, or related tables
- [ ] Deduplication: same member + same category within 24 hours consolidates
- [ ] `safety_scanned` column on `lila_messages` prevents double-processing

### MVP When Dependency Is Ready
- [ ] Weekly pattern summary generation and email digest (depends on scheduled job infrastructure)
- [ ] Push notification delivery for Critical safety flags (depends on PRD-33 service workers)

### Post-MVP
- [ ] Journal entry scanning (extend Layer 1 to journal content)
- [ ] Message scanning (extend Layer 1 to PRD-15 messages)
- [ ] Auto-sensitivity suggestion based on dismissal rate patterns
- [ ] Admin keyword management UI (PRD-32)
- [ ] Trend visualization in flag history (charts showing flag frequency over time)
- [ ] LiLa proactive check-in suggestions based on flag patterns ("It's been a week since the substance use flag — consider checking in with Jake")

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: Safety monitoring uses a two-layer detection pipeline: Layer 1 (keyword/phrase matching, synchronous, every message) + Layer 2 (Haiku conversation classification, async, per-conversation). Both layers feed the same `safety_flags` table.
- [ ] Convention: Three locked safety categories (`self_harm`, `abuse`, `sexual_predatory`) are always High sensitivity and cannot be lowered by the parent. Application layer enforces this regardless of database values.
- [ ] Convention: Safety flag context snippets are limited to max 5 messages. The parent never sees the full conversation transcript. This is a privacy boundary, not a technical limitation.
- [ ] Convention: The `safety_scanned` boolean on `lila_messages` prevents double-processing. Any message pipeline must set this flag after Layer 1 processing.
- [ ] Convention: Safety flags are never deleted. Status transitions: new → acknowledged or new → dismissed. Both remain in history permanently.
- [ ] Convention: Safety alert notifications use `category = 'safety'` and `priority = 'high'` in the PRD-15 notifications table. These bypass DND and cannot be disabled in notification preferences (locked ON per PRD-15 Screen 10).
- [ ] Convention: New child family members auto-create a `safety_monitoring_configs` record with `is_active = true`. This should be part of the family member creation flow (PRD-01).

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `safety_monitoring_configs`, `safety_sensitivity_configs`, `safety_notification_recipients`, `safety_flags`, `safety_keywords`, `safety_resources`, `safety_pattern_summaries`

Columns added: `lila_messages.safety_scanned` (BOOLEAN DEFAULT false NOT NULL)

Enums referenced (not new — used as TEXT CHECK constraints): severity ('concern', 'warning', 'critical'), sensitivity ('low', 'medium', 'high'), status ('new', 'acknowledged', 'dismissed'), detection_layer ('keyword', 'classification', 'both'), resource_type ('hotline', 'website', 'article', 'book')

Triggers added: `updated_at` auto-trigger on `safety_monitoring_configs`, `safety_sensitivity_configs`, `safety_keywords`, `safety_resources`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Two-layer detection: keyword matching + Haiku classification | Balances cost (keywords are free) with intelligence (Haiku catches subtle patterns). Aligns with P1-P9 optimization patterns. |
| 2 | Children monitored by default (opt-out), adults opt-in | Safety first. A parent who forgets to enable monitoring shouldn't be unprotected. Adults have different privacy expectations. |
| 3 | Three severity tiers: Concern, Warning, Critical | Mirrors Safe Harbor's three-tier safety system. Gives mom appropriate urgency levels. |
| 4 | Config in Settings, review in Family Overview + flag history | Configuration is a set-once activity (Settings). Review is an ongoing monitoring activity (Family Overview + dedicated history). |
| 5 | Context snippets limited to 5 messages max | Preserves child's conversational privacy while giving parents enough context. Not full transcript access. |
| 6 | Three locked categories that can't be lowered | Self-harm, abuse, and sexual predatory patterns are always critical. No parent should be able to lower these. |
| 7 | LiLa-generated conversation starters per flag | Inspired by Bark's expert guidance approach. Aligns with "I Go First" teaching philosophy. Low cost (one Haiku call per flag). |
| 8 | Per-category sensitivity thresholds per child | Inspired by Bark's custom alert thresholds. Reduces alert fatigue for older teens while keeping younger children at strict monitoring. |
| 9 | Weekly pattern summary digest | Inspired by Bark + Troomi activity reports. Trend-level view more actionable than individual incidents. |
| 10 | Curated resources, not AI-generated | Safety resources should be verified and reliable. Hotline numbers must be accurate. Static reference table updated by admin. |
| 11 | Flags never deleted | Safety records are permanent. Even dismissed false positives stay in history. This protects both the family and the platform. |
| 12 | Safe Harbor conversations ARE monitored | Confirmed by PRD-20. The teen knows about this via the AI Literacy Module. Safety trumps privacy for crisis indicators. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Journal and message scanning | Post-MVP enhancement. LiLa conversations are the highest-value monitoring surface. |
| 2 | Admin keyword management UI | PRD-32 (Admin Console) |
| 3 | Auto-sensitivity suggestions based on dismissal patterns | Post-MVP analytics enhancement |
| 4 | Trend visualization charts in flag history | Post-MVP UI enhancement |
| 5 | LiLa proactive check-in suggestions based on flag patterns | Post-MVP LiLa enhancement |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-05 (LiLa Core) | Safety scanning hooks into the message pipeline. `safety_scanned` column added to `lila_messages`. | Note the message pipeline hook point and the new column. |
| PRD-15 (Notifications) | "Safety flag alert notifications" stub is now wired. Safety alerts use `category = 'safety'`, `priority = 'high'`. | Move from "MVP When Dependency Is Ready" to wired. |
| PRD-14C (Family Overview) | Safety Monitoring section registered as an extensible section (`safety_monitoring` key). | Add section registration to PRD-14C's extensibility list. |
| PRD-22 (Settings) | Safety Monitoring configuration section added. | Add to Settings section registry. |
| PRD-01 (Auth & Family Setup) | New child creation should auto-create `safety_monitoring_configs` with `is_active = true`. | Add to family member creation flow. |
| PRD-20 (Safe Harbor) | Confirmed: Safe Harbor conversations are monitored. PRD-30 is the system PRD-20's AI Literacy Module describes. | No changes needed — PRD-20 already references this correctly. |
| Build Order Source of Truth v2 | PRD-30 completed. 7 new tables, 1 column addition. | Move to completed PRDs. |

---

*End of PRD-30*
