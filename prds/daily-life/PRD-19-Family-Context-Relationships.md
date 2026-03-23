# PRD-19: Family Context & Relationships

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-07 (InnerWorkings), PRD-13 (Archives & Context), PRD-15 (Messages, Requests & Notifications), PRD-18 (Rhythms & Reflections)
**Created:** March 13, 2026
**Last Updated:** March 13, 2026

---

## Overview

PRD-19 enriches the Archives experience (established in PRD-13) into the platform's complete family context engine and adds the relationship intelligence layer. Where PRD-13 defined the folder structure, three-tier toggles, aggregation convention, and context learning pattern, PRD-19 adds: richer per-member detail views with draggable context prioritization, a generalized upload-and-summarize pipeline, LiLa-guided context interviews, a dual-context sharing model (their shared context + your private observations), per-member aliases for external LLM privacy, relationship notes between specific pairs of people, Partner Profile bidirectional sharing, monthly data aggregation tied to billing cycles, a template-based reports system, and an AI Toolbox stub for person-context tools.

This PRD consolidates three features from the original Planning Decisions doc: Family Management Page (#17), People & Relationships (#18), and Partner Profile (#19). The "Family Management" experience lives in Archives — there is no separate management page. People profiles are Archive context cards. Partner Profile is a section within this PRD covering bidirectional sharing permissions.

> **Mom experience goal:** Archives should feel like a living family dossier — everything LiLa needs to know about every person, organized the way mom thinks about her family. When she taps a family member's card, she sees a complete picture: who they are, what matters to them, what she's observed, and what reports she's generated — all with fine-grained control over what's active, who sees it, and what LiLa references.

---

## User Stories

### Per-Member Context Management
- As a mom, I want to see a complete context overview for each family member so I can understand at a glance what LiLa knows about them.
- As a mom, I want to drag context items into priority order so the most important things about a person are always at the top.
- As a mom, I want to toggle any context item active or inactive so I control exactly what LiLa references without deleting anything.
- As a mom, I want to archive or delete context items I no longer need so the overview stays clean.
- As a mom, I want to add my own private notes about a family member that only I can see so I can track sensitive observations (relationship dynamics, behavioral patterns, things I'm working through) without the person seeing them.
- As a mom, I want each family member to have a nickname/alias so when I use LiLa Optimizer to craft prompts for external LLMs, my kids' real names aren't sent to other AI platforms.

### Upload & Summarize
- As a mom, I want to upload documents about a family member (personality tests, IEP paperwork, medical records, school reports) and have LiLa extract the key context points for me so I don't have to manually transcribe everything.
- As a mom, I want to review extracted context items before they're saved so I can edit, remove, or reorganize what LiLa captured.
- As a mom, I want uploaded documents stored alongside the member's profile so I can reference the original anytime.

### Guided Context Interview
- As a mom, I want to walk through guided questions about my child (communication style, love languages, learning preferences, interests) that feel like a conversation, not a form, so building context feels natural.
- As a mom, I want LiLa to suggest built-in mini-assessments or link to free online quizzes (love languages, learning styles) so I can discover things about my kids and upload the results.
- As a mom, I want the guided interview answers to automatically become context items on the member's Archive card so I don't have to do double data entry.

### Sharing & Privacy
- As a dad, I want to share specific context about myself with my wife's LiLa so she gets better advice about our relationship.
- As a dad, I want three sharing checkboxes per context item — LiLa (mine), Spouse, Family — so I control exactly who benefits from each piece of context.
- As a mom viewing my husband's Archive card, I want to see both his shared context AND my private observations about him, clearly separated, so I have the full picture without him seeing my notes.
- As an independent teen, I want to see my own context card (if mom has allowed it) so I understand what LiLa knows about me.

### Relationship Notes
- As a mom, I want to record notes about the dynamic between two specific people (e.g., sibling rivalry between Jake and Emma, or communication patterns between me and my husband) so LiLa can reference relationship-specific context during Higgins coaching.
- As a mom, I want relationship notes to be private to me — only my LiLa sees them, never the people involved.

### Partner Profile
- As a mom, I want my husband to have his own InnerWorkings that he can optionally share with my LiLa context so relationship tools give better advice.
- As a dad, I want to opt in to sharing my self-knowledge with my wife's LiLa without her seeing everything — I choose what to share per item.

### Reports & Aggregation
- As a mom, I want the system to automatically compile my family's monthly data (victories, task completions, educational hours, IEP progress, behavioral observations) so I have a complete picture without manual tracking.
- As a mom, I want to generate different types of reports from the same data (homeschool hours log, IEP progress report, accomplishments list, monthly summary) so one data set serves all my reporting needs.
- As a mom, I want finished reports stored in my family member's Archive so LiLa can reference them later and I can browse my report history.

### Bulk Family Setup
- As a mom setting up my family, I want to bulk-add family members with natural language and have LiLa sort them into the right structure (name, age, birthday, suggested dashboard mode, out of nest) so I don't have to fill out forms one person at a time.
- As a mom, I want each parsed member's notes to be individually editable with the ability to delete or toggle "add to context" so I control what becomes active context from day one.

### AI Toolbox
- As a mom, I want my family members to have access to a set of AI tools (Higgins, Cyrano, Homework Helper, etc.) that pull context from Archives so the tools give personalized advice.
- As a mom, I want to control which tools appear in each family member's toolbox so I can curate age-appropriate AI experiences.

---

## Screens

### Screen 1: Archives Main Page (Enhanced from PRD-13)

> **Depends on:** PRD-13, Screen 1. This screen enhances the existing Archives main page, not replaces it.

**What the user sees:**
- Page title: "Archives"
- **Family folder** at the top — contains cards for spouse + all in-home family members. Each card shows:
  - Member photo (uploaded) or system color avatar (pulled from their profile `calendar_color`)
  - Display name
  - Role badge
  - Context summary: "X active context items"
  - Quick-toggle `is_included_in_ai` master switch (person-level)
- **Out of Nest folder** — collapsible section below Family. Contains cards for Out of Nest members (adult children, their spouses, grandchildren). Same card format.
- **Special Adults section** — lightweight cards showing name, assigned kids, contact info. Not full Archive folders — these are summary profiles managed in Settings. Tap opens a simple detail view (not the full member detail experience).
- **Reports shortcut** — "View All Reports" link navigating to the Reports page (Screen 6).
- **Family Overview Card** — as defined in PRD-13 (family-level context: personality, rhythms, focus, faith).

> **Decision rationale:** Special Adults get lightweight profile cards rather than full Archive folders because they are caregivers with shift-based access, not people mom is building deep context about. Their relevant info (name, contact, certifications, assigned kids, any shift notes) lives in a simple profile, not the full folder/context/upload experience.

**Interactions:**
- Tap a family member card → Screen 2 (Member Detail)
- Tap an Out of Nest member card → Screen 2 (same experience)
- Tap Special Adult card → simple detail view (name, contact, assigned kids, notes — no full context system)
- Tap "View All Reports" → Screen 6

---

### Screen 2: Member Detail View

> **Mom experience goal:** Tapping into a family member's card should feel like opening their personal dossier — everything I know about them, everything LiLa knows, and everything I've observed, all in one scrollable view with total control.

**What the user sees:**

**Header area:**
- Member photo or color avatar (large)
- Display name (editable)
- **Aliases section:** "Also known as:" with editable alias list (e.g., "Jakey, J-man, Bug"). A toggle: "Use alias in external prompts?" with a selected alias for LiLa Optimizer to substitute. Tooltip: "When LiLa Optimizer creates prompts for other AI platforms, it will use this alias instead of [real name] to protect your child's privacy."
- Role badge, age, birthday
- Person-level `is_included_in_ai` master toggle

**Context Overview section:**

> **Decision rationale:** The context overview is the core of the member experience. Each item is individually controllable — active/inactive, draggable for priority, archivable, deletable. This gives mom complete curation power over what LiLa knows and in what order of importance.

- Each item shows: drag handle, active checkbox, context text, source indicator (InnerWorkings, LiLa detected, manual, uploaded document, guided interview)
- Items are draggable to reorder by priority/relevance
- Swipe left on any item → Archive or Delete options
- Tap any item → expand for editing (text, source, sharing checkboxes)
- **Three sharing checkboxes per item** (when expanded):
  - "Include in my LiLa" (controls AI context — this is the `is_included_in_ai` toggle)
  - "Share with Spouse" (makes visible on spouse's view of this person)
  - "Share with Family" (makes visible to family members with Archive access)
- [+ Add] button → inline form for manually adding a context item
- Settings icon → context settings (bulk toggle active/inactive, select all/deselect all)
- Summary indicator: "Gleaning context from X/Y insights"

**Aggregated source sections** (below context overview):
- **InnerWorkings** — live references to `self_knowledge` entries (if this member has any). Same display as PRD-13 aggregation.
- **Guiding Stars & Best Intentions** — live references
- **Other source features** — as defined in PRD-13

**Your Private Notes section** (mom only — never visible to the subject):

> **Decision rationale:** Mom needs a space for sensitive observations that should never be seen by the person being described. "He tends to sulk when in a bad mood" or "She shuts down when I raise my voice" are invaluable for LiLa coaching but would be hurtful if the person saw them. These notes are strictly mom's LiLa context + mom's own reference.

- Each note has an `is_included_in_ai` toggle (default: on)
- Notes are never shared, never visible to the subject, never visible to anyone except mom
- RLS enforced: only `primary_parent` can read/write private notes
- [+ Add Note] button for adding new observations

**Shared Context from Them section** (visible when viewing spouse or teen who has shared context):
- Shows context items the person has explicitly shared via their sharing checkboxes
- Clearly labeled: "Shared by [Name]"
- Read-only on mom's side — she can toggle `is_included_in_ai` for her own context assembly but cannot edit their shared items

**Guided Context Interview section:**
- Shows categories with completion status (checkmarks for completed, circles for not started)
- Categories: Communication Style, Love Languages, Learning Style, Interests & Hobbies, Sensory & Comfort, Social & Friends, Health & Wellbeing, Strengths & Superpowers, Growth Areas
- Progress tracked per category — mom can do a few questions at a time
- Completed categories show item count
- [Start] or [Continue where I left off] button opens Screen 3
- Answers automatically create context items in the Context Overview

**Documents section:**
- Shows uploaded documents with filename, upload date, count of extracted context items
- [Upload] opens file picker (PDF, images, DOCX, TXT, EPUB, MD)
- Tap document → view original file + see linked context items
- Upload flow → Screen 4

**Reports section:**
- Shows recently generated reports for this member
- [Generate New] → Screen 5 (Report Generation)
- Tap report → view/download the finished report
- Reports are stored as `archive_context_items` with `context_type = 'generated_report'`
- [View All Reports] link → Screen 6

**Data created/updated:**
- `archive_context_items` (CRUD on context overview items and private notes)
- `archive_member_settings` alias fields
- `sort_order` on context items (drag reordering)
- Sharing checkboxes on items

---

### Screen 3: Guided Context Interview

> **Mom experience goal:** This should feel like chatting with a friend who asks thoughtful questions about my kid — not filling out a clinical intake form.

**What the user sees:**
- A conversational interface (not a form) that presents one question at a time
- Questions are from a predefined question bank organized by category
- LiLa-styled presentation (LiLa avatar, speech bubble style) but the questions themselves are system-defined (not AI-generated) to minimize API costs

> **Decision rationale:** Using predefined questions with a conversational UI (not AI-generated questions) keeps costs near zero while still feeling personal. The question bank can grow through testing and beta feedback. AI is only used for parsing free-text answers into structured context items when needed.

**Question categories and starter questions:**

**Communication Style:**
- "How does [Name] prefer to receive feedback — direct and clear, or gentle and indirect?"
- "When [Name] is upset, what helps them calm down?"
- "How does [Name] typically express that they need something?"

**Love Languages:**
- "Does [Name] light up more when you spend time together, give them a gift, say something kind, do something helpful, or give physical affection?"
- Built-in mini-assessment option: "Want to do a quick love languages quiz for [Name]? (5 questions)" — a simple "which would [Name] prefer?" comparison format scored locally (no AI cost)
- "Know their love language already? Just tell me and I'll save it."
- External quiz links: "You can also take the official Love Languages quiz at 5lovelanguages.com and upload the results."

**Learning Style:**
- "Does [Name] learn best by seeing, hearing, reading, or doing?"
- "What subjects or topics does [Name] get excited about?"
- "When [Name] is stuck on something, what approach works best to help them?"

**Interests & Hobbies:**
- "What does [Name] love to do in their free time?"
- "What topics can [Name] talk about for hours?"
- "Is there anything [Name] used to love but has outgrown?"

**Sensory & Comfort:**
- "Are there any textures, sounds, or environments that bother [Name]?"
- "What foods does [Name] love? What do they refuse to eat?"
- "What helps [Name] feel safe and comfortable?"

**Social & Friends:**
- "Who are [Name]'s closest friends?"
- "How does [Name] handle conflict with peers?"
- "Is [Name] more introverted or extroverted?"

**Health & Wellbeing:**
- "Any allergies, medical conditions, or medications I should know about?"
- "How does [Name] handle stress or anxiety?"
- "Any sensory processing or neurodivergent traits worth noting?"

**Strengths & Superpowers:**
- "What is [Name] naturally good at?"
- "What qualities do other people notice about [Name]?"
- "When does [Name] seem most in their element?"

**Growth Areas:**
- "What's something [Name] is working on or struggling with right now?"
- "Are there any recurring patterns you've noticed that you'd like to address?"
- "What do you wish [Name] could do more independently?"

**Interactions:**
- Mom answers in free text (embedded Smart Notepad mini-component per PRD-18 convention)
- After each answer, the system extracts context items (using simple parsing for structured answers, or a lightweight AI call for complex free-text answers)
- Extracted items shown for review: "Here's what I captured. Edit anything that doesn't sound right:"
- Mom confirms → items saved to context overview with `source = 'guided_interview'`
- "Skip" button available on every question — no forced flows (buffet principle)
- Progress saved per category — mom can leave and return anytime
- "What's this?" tooltip on category headers opens LiLa contextual help (PRD-18 convention)

**Data created:**
- `archive_context_items` with `source = 'guided_interview'` and `source_reference_id` linking to the interview category
- `guided_interview_progress` tracking which categories/questions are completed per member

---

### Screen 4: Upload & Summarize Flow

> **Depends on:** StewardShip RAG and retrieval patterns for document processing.

**What the user sees:**

**Step 1 — File Selection:**
- File picker accepting: PDF, JPG, PNG, DOCX, TXT, EPUB, MD
- "Upload a document about [Name] — personality test results, IEP paperwork, medical records, school reports, anything. LiLa will extract the key context points for you to review."
- Max file size indicator

**Step 2 — Processing:**
- Upload progress indicator
- "LiLa is reading [filename]..."
- Processing uses AI extraction (Sonnet for complex documents, Haiku for simple text files)

**Step 3 — Review Extracted Items:**
- Each extracted item has: active checkbox, editable text, category dropdown, edit/remove buttons
- Mom can add additional items manually that the AI missed
- Category dropdown matches Archive category folders (Personality & Traits, Interests & Hobbies, Health & Medical, School & Learning, General, etc.)
- [Save to Context] creates `archive_context_items` records linked to the uploaded document via `source_reference_id`
- Original document stored in Supabase Storage, linked to the member

**Data created:**
- `member_documents` record (file metadata, storage URL, member link)
- `archive_context_items` records with `source = 'document_upload'` and `source_reference_id` pointing to the document record

---

### Screen 5: Report Generation

> **Depends on:** Monthly data aggregation system (runs on billing day). Reports can only be generated for months where aggregation has completed.

**What the user sees:**
- Report For: member picker (or "Whole Family" for family-wide report)
- Template selection: Monthly Summary, Homeschool Hours Log, IEP Progress Report, List of Accomplishments, Update LiLa Context, Custom Template (tier-gated)
- Date range limited to months with completed aggregations
- Output format: View in App, PDF, Markdown
- [Preview] shows a draft; [Generate & Save] creates the final report and stores it in the member's Archive
- "Update LiLa Context" template has LiLa analyze the month's data and suggest context additions/updates

> **Forward note:** The full reports system (all templates, custom template authoring, multi-month spanning, state-specific homeschool compliance formatting) is a substantial feature that will be refined through testing. PRD-19 establishes the aggregation table, the reports page, and the core generation flow. Template refinement and additional report types may come in a future enhancement PRD or as part of PRD-28 (Tracking, Allowance & Financial).

**Data created:**
- `generated_reports` record (report metadata, content, template used, date range)
- `archive_context_items` record with `context_type = 'generated_report'` linking the finished report to the member's Archive

---

### Screen 6: Reports Page

**What the user sees:**
- Standalone page accessible from Archives main and from sidebar navigation
- Shows all generated reports across all family members
- Filterable by: member, report type, date range
- Each report card shows: member name, report type, date range, generated date
- Tap → view the full report (rendered in-app or downloadable as PDF/Markdown)
- [Generate New Report] button → Screen 5

> **Decision rationale:** A dedicated Reports page gives mom a single place to find all reports, distinct from browsing individual member Archives. This is especially valuable when she needs to quickly find a specific report for a school meeting or therapy appointment.

---

### Screen 7: Relationship Notes

> **Mom experience goal:** I want to capture the dynamic between two specific people — not just who they are individually, but how they interact. This helps LiLa give better coaching when I'm navigating a specific relationship.

**What the user sees:**
- Accessible from: member detail view (a "Relationship Notes" section), or from a dedicated "Relationships" area within Archives
- Shows existing relationship notes as cards with person pair, author indicator, note text, and active/inactive toggle
- [+ New] → pick two people → write note → save
- Each note has `is_included_in_ai` toggle and `is_available_for_mediation` toggle
- Each author sees ONLY their own notes. Mom can see all notes in Full Picture Mediation mode (via LiLa, never on screen).

**Starter Prompts:**

When creating a new relationship note, the editor offers optional reflection prompts to help the author get started. These appear as tappable suggestions above the text area — tap to insert as a starting point, or ignore and free-write.

**Prompts for mom (about any pair):**
- "What's the dynamic between these two right now?"
- "What triggers conflict between them?"
- "What brings out the best in their relationship?"
- "What does each person need from the other that they're not getting?"
- "What patterns do I notice repeating?"

**Prompts for teens/dad (about a relationship they're in):**
- "What do I appreciate about this person?"
- "What do I wish was different about how we interact?"
- "When do I feel closest to them?"
- "When do I feel most frustrated or distant?"
- "What would I want them to understand about me?"
- "How do I want to show up in this relationship?"

**Prompts for Guided children (simplified):**
- "How do you feel about [name]?"
- "What do you like doing together?"
- "What makes you upset with [name]?"
- "What do you wish [name] would do more?"

> **Decision rationale:** Starter prompts lower the barrier to reflection, especially for teens who might stare at a blank box. The prompts are designed to invite honest self-reflection without leading toward negativity. The teen prompts include a forward-looking "how do I want to show up" question that aligns with the ownership/empowerment philosophy. Guided prompts are simple and age-appropriate.

**Data created:**
- `relationship_notes` records

---

### Screen 8: "How to Reach Me" Card

> **Mom experience goal:** Every person in my family has their own operating manual. When Higgins is helping me figure out how to talk to Jake about something hard, it needs to know that he shuts down if I raise my voice, responds to humor, and needs 10 minutes of space before he can re-engage.

**What the user sees:**

A structured card within the member detail view (Screen 2), positioned between the Context Overview and the Context Folders. It's a quick-reference communication guide for this person.

```
┌─────────────────────────────────────────────┐
│  📋 How to Reach Jake                        │
│  ─────────────────────────────────────────  │
│  When I'm upset:                             │
│    "Give me 10 minutes alone, then come      │
│     back and talk calmly."                   │
│                                             │
│  I respond best to:                          │
│    "Humor and directness. Don't beat         │
│     around the bush."                        │
│                                             │
│  Please don't:                               │
│    "Raise your voice or compare me to my     │
│     siblings."                               │
│                                             │
│  How to know I'm struggling:                 │
│    "I get really quiet and go to my room."   │
│                                             │
│  How to help when I'm struggling:            │
│    "Bring me a snack and sit nearby          │
│     without talking. I'll open up when       │
│     I'm ready."                              │
│  ─────────────────────────────────────────  │
│  ✏️ Edit    👤 Written by: Jake (shared)     │
│  ☑ Include in LiLa context                  │
└─────────────────────────────────────────────┘
```

**Structured fields (all optional — fill in what you know):**
1. "When I'm upset..." — what the person needs when emotionally activated
2. "I respond best to..." — communication approaches that work
3. "Please don't..." — things that make it worse
4. "How to know I'm struggling..." — visible signs of distress
5. "How to help when I'm struggling..." — concrete support actions

**Who writes it:**
- **Teens (Independent):** Can write their own card. This is an act of self-advocacy — telling the family "here's how to reach me." Shared with mom by default (teen can adjust sharing).
- **Mom:** Writes cards for younger children based on her observations. Can also write her own.
- **Dad:** Can write his own card. Shared with spouse by default.
- **Anyone can suggest edits** to their own card at any time.

**How LiLa uses it:**
- The "How to Reach Me" card is loaded as HIGH-PRIORITY context whenever LiLa is helping someone communicate with this person (Higgins, Cyrano, message coaching, mediation)
- Formatted in the system prompt as: "[Name]'s communication guide: When upset, they need [X]. They respond best to [Y]. Avoid [Z]."
- This is one of the most valuable context sources for relationship tools — it's a direct instruction manual from the person themselves (or from mom's deep knowledge of them)

> **Decision rationale:** This is distinct from general context items because it's structured specifically for communication scenarios — the exact use case where Higgins, Cyrano, and message coaching operate. Having it as a dedicated card with consistent fields means LiLa can always find it quickly rather than scanning general context for communication-relevant items. Having teens write their own is a powerful self-advocacy exercise.

> **Forward note:** The "How to Reach Me" card could eventually become a shareable artifact — a teen could share their card with a teacher, counselor, or friend's parent. This is a post-MVP concept but the data model should support it (the card is just structured `archive_context_items` with a specific `context_type`).

**Data model:**
- Stored as `archive_context_items` records with `context_type = 'how_to_reach_me'`
- Each field is a separate context item within a logical group (linked by a `group_id` or by sharing the same `context_type` + `member_id`)
- Alternatively: a single JSONB item with all fields, stored as one `archive_context_items` record. Simpler, and the card is always loaded as a unit.

> **Decision rationale:** Single JSONB item is recommended — the card is always loaded and displayed as a unit, never as individual fields. One record, one toggle, one sort_order position.

**Data created/updated:**
- One `archive_context_items` record per member with `context_type = 'how_to_reach_me'` and JSONB content containing all fields

---

### Screen 8: Partner Sharing Settings

**What the user sees:**
- Accessible from: partner's member detail view, or from Settings → Family → Partner Sharing
- Shows the bidirectional sharing configuration between mom and dad

**Mom's side:**
- Toggle: "Allow [Partner] to share context with my LiLa" (enables the Shared Context from Them section on partner's Archive card)
- View of what partner has shared (read-only — she can toggle `is_included_in_ai` for her own context assembly but cannot edit their shared items)

**Dad's side (on his own device):**
- His InnerWorkings entries and context items each have the three checkboxes: LiLa (his), Spouse, Family
- Toggling "Spouse" on an item makes it visible on mom's view of his Archive card
- He can see a summary of what he's shared: "Sharing X items with [Partner]"

> **Decision rationale:** Bidirectional opt-in sharing means neither partner sees anything the other hasn't explicitly chosen to share. This protects both parties. Mom's private notes about dad (Screen 2) are separate from dad's shared context — she has both views available but they never mix.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | Sees all member Archive cards. Can create, edit, delete all context items. Private notes visible only to her. Relationship notes visible only to her. Controls all sharing settings. |
| Dad / Additional Adult | Configurable | Mom controls whether dad can access Archive cards for each child — view, edit, or add. Dad always has access to his own Archive card. Can see items shared with "Spouse" or "Family." Cannot see mom's private notes. |
| Special Adult | None (summary only) | Lightweight profile card only — not a full Archive experience. No context management. |
| Independent (Teen) | Limited (if mom enables) | Can view their own Archive card if mom has enabled it. Can see items marked "Share with Family." Cannot see mom's private notes about them. Cannot edit context items (mom-authored). Can manage their own InnerWorkings sharing (covered in PRD-07). |
| Guided / Play | Not present | No access to Archives. Context is managed by mom on their behalf. |

### Shell Behavior
- **Mom shell:** Full Archives page in sidebar navigation. All screens accessible.
- **Dad shell:** Archives visible in sidebar if mom has granted access. Shows only permitted member cards. Own card always visible.
- **Independent shell:** "My Profile" link (if mom-enabled) shows their own Archive card in read-only mode. No access to other members' cards.
- **Guided / Play shell:** Not present.
- **Special Adult shell:** Not present (Special Adult profiles managed in Settings, not Archives).

### Privacy & Transparency
- **Private Notes:** RLS-enforced mom-only. Never appear in any non-mom context. Not even visible to dad with full Archive access.
- **Relationship Notes:** Same — RLS-enforced mom-only.
- **Teen transparency:** If mom enables a teen to view their own Archive card, the teen can see what context is active for LiLa. They cannot see mom's private notes. Teen is notified when mom adds or changes context about them (per PRD-02 notification conventions).
- **Alias system:** Aliases are stored on the member record. Only visible to mom. Used automatically by LiLa Optimizer (PRD-05C) when formatting prompts for external platforms.

---

## Data Schema

### Table: `member_documents`

Stores uploaded documents about family members.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members. Who this document is about. |
| uploaded_by | UUID | | NOT NULL | FK → family_members. Who uploaded it. |
| file_name | TEXT | | NOT NULL | Original filename |
| file_type | TEXT | | NOT NULL | MIME type or extension |
| storage_url | TEXT | | NOT NULL | Supabase Storage URL |
| file_size_bytes | INTEGER | | NULL | File size for display |
| extraction_status | TEXT | 'pending' | NOT NULL | Enum: 'pending', 'processing', 'completed', 'failed' |
| extraction_item_count | INTEGER | 0 | NOT NULL | How many context items were extracted |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Mom can CRUD all documents for her family. Dad can read documents for members he has Archive access to (if mom has granted it). Teens can read their own documents (if mom has enabled profile viewing).

**Indexes:**
- `(family_id, member_id)` — documents for a specific member

---

### Table: `private_notes`

Mom's private observations about family members. Never visible to the subject.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| about_member_id | UUID | | NOT NULL | FK → family_members. Who this note is about. |
| author_id | UUID | | NOT NULL | FK → family_members. Always mom. |
| content | TEXT | | NOT NULL | The note text |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Whether LiLa references this note |
| sort_order | INTEGER | 0 | NOT NULL | Display priority |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** ONLY `primary_parent` can read/write. No exceptions. Not even dad with full Archive access.

**Indexes:**
- `(family_id, about_member_id, archived_at)` — active notes about a person

---

### Table: `relationship_notes`

Notes about the dynamic between two specific people. Multiple family members can write notes about the same pair — each note is private to its author.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| person_a_id | UUID | | NOT NULL | FK → family_members. Always the smaller UUID of the pair. |
| person_b_id | UUID | | NOT NULL | FK → family_members. Always the larger UUID of the pair. |
| author_id | UUID | | NOT NULL | FK → family_members. Who wrote this note. Determines visibility — each author sees only their own notes. |
| content | TEXT | | NOT NULL | The relationship note |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Whether LiLa references this in the author's conversations |
| is_available_for_mediation | BOOLEAN | true | NOT NULL | Whether this note can be used in Full Picture mediation mode (mom's sessions). Author can opt out if they want a note purely for themselves. |
| sort_order | INTEGER | 0 | NOT NULL | |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

> **Decision rationale:** Multiple perspectives on the same relationship are the whole point. Helam writes about Dad↔Helam from his side. Dad writes about the same pair from his side. Mom writes her observations. Three notes, same pair, three private scopes. LiLa can hold all three simultaneously in mediation mode without any person seeing another's raw notes.

**CHECK constraint:** `person_a_id < person_b_id` — prevents duplicate pairs regardless of author. Application layer normalizes UUID order before insert.

**RLS Policy:**
- Each member can CRUD their own notes (`WHERE author_id = current_user`)
- Mom can additionally READ all notes in mediation mode (`WHERE family_id = current_family`) — this is gated by the `relationship_mediation` guided mode, not by default browsing
- No member can ever read another member's notes through the Archive UI — mediation access is LiLa-context-only, never displayed on screen

**Who can write relationship notes:**

| Role | Can Write About |
|------|----------------|
| Mom | Any relationship pair in the family (including ones she's not part of) |
| Dad | Relationships he's part of (Dad↔Mom, Dad↔Child) |
| Independent Teen | Relationships they're part of (Teen↔Parent, Teen↔Sibling) |
| Guided | Simplified version: "How do you feel about your relationship with [name]? What do you wish it was like?" — saved as a relationship note with `author_id = guided_child`. Available via a Guided-appropriate prompt, not the full note editor. |
| Play | Not available |

> **Forward note:** The Guided child version is a lightweight emotional check-in, not a full relationship notes editor. It helps LiLa understand the child's emotional world ("I wish Dad played with me more" or "My sister is mean to me") in age-appropriate terms. This is relationship intelligence building, not therapy.

**Indexes:**
- `(family_id, person_a_id, person_b_id, author_id)` — notes about a specific pair by a specific author
- `(family_id, author_id, archived_at)` — all active notes by a specific author
- `(family_id, person_a_id, person_b_id, is_available_for_mediation)` — mediation context query

---

### Table: `guided_interview_progress`

Tracks which guided interview categories/questions have been completed per member.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members. Who the interview is about. |
| category | TEXT | | NOT NULL | Interview category key |
| questions_completed | TEXT[] | '{}' | NOT NULL | Array of completed question IDs |
| is_complete | BOOLEAN | false | NOT NULL | Whether all questions in the category are done |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Mom can CRUD.

**Indexes:**
- `(family_id, member_id, category)` — progress for a specific member + category

---

### Table: `monthly_data_aggregations`

Structured data compiled from across the platform on each family's billing day.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| billing_period_start | DATE | | NOT NULL | Start of the billing month |
| billing_period_end | DATE | | NOT NULL | End of the billing month |
| aggregation_data | JSONB | '{}' | NOT NULL | Structured data: victories, task completions, educational hours by subject, achievements, streaks, IEP progress, therapy notes, behavioral observations, family summary |
| member_summaries | JSONB | '{}' | NOT NULL | Per-member breakdowns within the aggregation |
| aggregation_status | TEXT | 'pending' | NOT NULL | Enum: 'pending', 'processing', 'completed', 'failed' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

> **Decision rationale:** Aggregated data is stored as structured JSONB optimized for fast querying, separate from Archives. Archives holds finished documents for reference; this table holds raw structured data for report generation. Only finished reports go to Archives.

**RLS Policy:** Mom can read. System inserts (via scheduled function on billing day).

**Indexes:**
- `(family_id, billing_period_start)` — aggregation for a specific month

---

### Table: `generated_reports`

Finished reports generated from aggregated data.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NULL | FK → family_members. NULL for family-wide reports. |
| template_type | TEXT | | NOT NULL | Enum: 'monthly_summary', 'homeschool_hours', 'iep_progress', 'accomplishments', 'context_update', 'custom' |
| title | TEXT | | NOT NULL | Report title |
| content_markdown | TEXT | | NOT NULL | Full report content in Markdown |
| content_pdf_url | TEXT | | NULL | Supabase Storage URL for PDF version |
| source_aggregation_ids | UUID[] | | NOT NULL | Which `monthly_data_aggregations` records this report was generated from |
| date_range_start | DATE | | NOT NULL | |
| date_range_end | DATE | | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Mom can CRUD. Dad can read if granted Archive access.

**Indexes:**
- `(family_id, member_id, created_at DESC)` — reports for a member, newest first
- `(family_id, template_type)` — reports by type

---

### Schema Additions to Existing Tables

**`archive_member_settings` (PRD-13) — add columns:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| aliases | TEXT[] | '{}' | NOT NULL | Array of nicknames/aliases for this member |
| use_alias_in_external | BOOLEAN | false | NOT NULL | Whether LiLa Optimizer substitutes alias for real name |
| primary_alias | TEXT | | NULL | The alias used for external prompt substitution |

**`archive_context_items` (PRD-13) — add columns:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| share_with_spouse | BOOLEAN | false | NOT NULL | Whether this item is visible on spouse's view |
| share_with_family | BOOLEAN | false | NOT NULL | Whether this item is visible to family members with access |
| sort_order | INTEGER | 0 | NOT NULL | User-controlled priority ordering in context overview |

---

### Enum/Type Updates

New TEXT CHECK enums:
- `extraction_status`: 'pending', 'processing', 'completed', 'failed'
- `aggregation_status`: 'pending', 'processing', 'completed', 'failed'
- `report_template_type`: 'monthly_summary', 'homeschool_hours', 'iep_progress', 'accomplishments', 'context_update', 'custom'

Additions to existing enums:
- `archive_context_items.source`: add 'guided_interview', 'document_upload'
- `archive_context_items.context_type`: add 'generated_report'

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| PRD-01 (Auth — Bulk Add) | Family member creation triggers Archive folder auto-creation (PRD-13). PRD-19 enriches the bulk add with LiLa sorting of notes into context items. |
| PRD-07 (InnerWorkings) | InnerWorkings entries surface as aggregated context on Archive cards (PRD-13 pattern). PRD-19 adds spouse sharing checkboxes to this flow. |
| PRD-13 (Archives — Context Learning) | LiLa detects family information in conversations and offers to save. PRD-19 inherits this; new items get the three sharing checkboxes. |
| PRD-05C (LiLa Optimizer) | When crafting prompts for external platforms, Optimizer reads `primary_alias` from `archive_member_settings` and substitutes for real names if `use_alias_in_external = true`. |
| PRD-18 (Rhythms) | Reflection responses and rhythm completion data contribute to monthly aggregation. |
| All feature PRDs | Victory records, task completions, Best Intentions, educational hours, etc. all feed into `monthly_data_aggregations` on billing day. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-05 (LiLa Context Assembly) | Context overview items, private notes, and relationship notes are context sources in the assembly pipeline. Loaded based on conversation's person selector and mode. |
| PRD-05 (Higgins / Cyrano) | When Higgins loads context for a specific pair, relationship notes between those two people are included. Private notes about each person are included for mom. |
| PRD-05C (LiLa Optimizer) | Alias substitution in external prompts. |
| Archives (PRD-13) | Finished reports stored as Archive items. All PRD-19 context items are Archive context items (same table, enriched). |
| AI Toolbox (stub) | Person-context tools read from Archive context when launched with a person selected. |

---

## AI Integration

### Guided Mode: `family_context_interview`

**Registered in LiLa guided mode registry with:**
- `mode_key`: `family_context_interview`
- `display_name`: "Build [Name]'s Profile"
- `model_tier`: `haiku` (simple question presentation + answer parsing — not complex reasoning)
- `context_sources`: loads existing context items for the member (so LiLa doesn't re-ask what's already captured)
- `person_selector`: the member being interviewed about
- `available_to_roles`: mom only
- `requires_feature_key`: `archives_guided_interview`

> **Decision rationale:** The guided interview uses predefined questions (not AI-generated) to minimize costs. AI is only used for parsing complex free-text answers into structured context items. The conversational UX is achieved through a chatbot-style interface, not through AI conversation. The `haiku` model tier reflects this lightweight usage.

### Nickname Recognition

LiLa must resolve all registered nicknames to the canonical family member. When mom types "Mimi was upset today," LiLa checks `display_name_aliases` across all family members and resolves "Mimi" to Miriam for context lookup.

**How it works:**
- At conversation start, LiLa loads `family_members.display_name` + `archive_member_settings.display_name_aliases` for all family members into the system prompt as a name resolution table
- Any recognized nickname in a user message is treated as a reference to that member
- LiLa responds using the canonical `display_name` (not the nickname), unless the user consistently uses a specific nickname — then LiLa mirrors their preferred name
- If a nickname is ambiguous (matches multiple members), LiLa asks for clarification

**Alias behavior (distinct from nicknames):**
- The `external_alias` is NEVER used in internal LiLa conversations
- It is ONLY substituted by the Optimizer when formatting prompts for external LLMs
- When `use_alias_for_external = true`, the Optimizer replaces all instances of `display_name` AND all `display_name_aliases` with the `external_alias` in the output

> **Decision rationale:** Nicknames are for recognition (LiLa understands who mom is talking about). Aliases are for privacy (external LLMs never see real names). These are separate concerns with separate data flows.

### Context Assembly — New Sources

PRD-19 adds these context sources to the PRD-05 assembly pipeline:

| Source | When Loaded | Format |
|--------|-------------|--------|
| Private notes | When the AUTHOR of the note is the current user AND conversation involves the noted person | `Your observations about [Person]: [note content]` |
| Relationship notes (own) | When the AUTHOR is the current user AND conversation involves BOTH people in the pair | `Your notes on [Person A] ↔ [Person B]: [note content]` |
| Relationship notes (mediation) | When mom is in Full Picture Mediation mode AND conversation involves the pair | All authors' notes loaded with neutral labels — see Mediation section below |
| Shared partner context | When conversation involves partner-related topics (Marriage Toolbox, Higgins with spouse selected) | `[Partner]'s shared context: [items]` |

### Full Picture Mediation Mode

> **Mom experience goal:** When I'm trying to help Helam and his dad work things out, I need LiLa to understand BOTH sides — not just mine. But I don't want to read their private notes. I want LiLa to hold the full picture and help me help them.

**Guided mode: `relationship_mediation`**

Registered in LiLa guided mode registry with:
- `mode_key`: `relationship_mediation`
- `display_name`: "Help Me Help Them"
- `model_tier`: `sonnet` (requires emotional intelligence, perspective synthesis, ethical reasoning)
- `context_sources`: ALL relationship notes for the selected pair (from all authors where `is_available_for_mediation = true`), plus both people's shared context, plus mom's private notes about both people
- `person_selector`: two people (the pair being mediated)
- `available_to_roles`: mom only
- `requires_feature_key`: `archives_relationship_mediation`

**How it works:**
1. Mom selects two people (e.g., Helam ↔ Dad) and enters mediation mode
2. LiLa loads ALL relationship notes for that pair from all authors (where `is_available_for_mediation = true`)
3. Notes are labeled neutrally in the system prompt: "Perspective A:", "Perspective B:", "Observer perspective:" — never attributed by name
4. LiLa synthesizes the perspectives to help mom understand the full picture and coach both parties
5. Mom NEVER sees the raw notes on screen — she only experiences LiLa's synthesized understanding
6. LiLa can gently encourage perspective-taking: "Have you considered that [person] might be experiencing this differently?" without quoting their notes

**System prompt instructions for mediation mode:**

```
You have access to multiple perspectives on the relationship between 
[Person A] and [Person B]. These perspectives are confidential — you 
must NEVER:
- Quote or paraphrase any specific note from any perspective
- Reveal that a specific person said or feels something specific
- Attribute emotions or opinions to a named person based on their notes
- Take sides or villainize any family member
- Jump straight to "consider their perspective" — validate first

You SHOULD follow this conversational arc:

1. VALIDATE FIRST — Acknowledge the person's feelings as real and 
   legitimate. "That sounds really frustrating." "It makes sense 
   you'd feel that way." Never skip this step.

2. INVITE CURIOSITY — Ask the person what THEY think might be 
   going on. "Why do you think [person] might be responding that 
   way?" This is a question, not a lecture. Let them arrive at 
   perspective-taking through their own thinking.

3. OFFER A GENTLE REFRAME (optional, only if natural) — "Sometimes 
   what looks like not caring is actually not knowing how to show 
   up the way you need." This is offered as a possibility, not an 
   instruction to feel differently.

4. EMPOWER WITH OWNERSHIP — Move to action and agency. "What are 
   your thoughts? How would you like to show up in this? Would you 
   like help creating some action steps that give you ownership 
   over how you want to handle this?"

The goal is ALWAYS to help family members rise to the best versions 
of themselves. We repair, we don't divide. We respect ALL members.
The person should feel understood, empowered, and in ownership of 
their next steps — not lectured, dismissed, or pushed to see things 
the other person's way before they're ready.

EXCEPTION: If any note contains language suggesting unhealthy or 
unsafe dynamics — fear of a specific person, physical harm, coercive 
control, isolation, threats — do NOT invite curiosity about the other 
person's perspective. Never label the situation as "abuse" based on 
one person's notes. Instead, paint a picture of what healthy looks 
like, acknowledge the gap without labeling, and guide toward safe 
humans and real support. For immediate danger, provide Tier 3 crisis 
resources per PRD-05. Suggest Safe Harbor (PRD-20) for ongoing 
processing.
```

> **Decision rationale:** Full Picture mode gives LiLa the intelligence to genuinely help with family dynamics — not just echo one person's perspective back to them. The privacy boundary (LiLa synthesizes, never reveals) respects each person's vulnerability while enabling real mediation. The safety concern exception ensures protection without LiLa overstepping by labeling or diagnosing.

### Relationship Context Ethical Framework

This framework applies to ALL LiLa interactions involving relationship context, not just mediation mode. The core conversational arc is: **validate → invite curiosity → gentle reframe → empower with ownership.**

**Core principle:** LiLa holds relationship context to help ALL members of the family rise to the best versions of themselves. We repair relationships, we don't divide them. We respect all members. The person should always leave the conversation feeling understood and empowered, never lectured or dismissed.

**The Validate → Curiosity → Empower Arc:**

1. **Validate feelings first.** Always. Every time. The person's hurt is real regardless of the other person's perspective. "That sounds really frustrating." "It makes sense you'd feel unheard." Never skip validation to jump to perspective-taking.

2. **Invite the person's own curiosity.** Ask THEM what they think is going on. "Why do you think he might respond that way?" "What do you think is happening for her?" This is fundamentally different from telling them what the other person thinks. The person arrives at perspective-taking through their own reasoning, not LiLa's instruction.

3. **Offer gentle reframes** only when natural and only as possibilities. "Sometimes what looks like not caring is actually not knowing how." This is offered softly — the person can take it or leave it. Never force a reframe on someone who isn't ready.

4. **Empower with ownership and agency.** "What would you like to do about this? How do you want to show up? Would you like help creating action steps that give you ownership?" The person decides their own next move. LiLa supports, doesn't prescribe.

**LiLa NEVER:**
- Villainizes any family member
- Reveals what someone else said, feels, wrote, or thinks
- Pushes perspective-taking before validation ("but have you considered...")
- Encourages contempt, resentment, or disrespect toward a family member
- Dismisses legitimate hurt ("you shouldn't feel that way" / "it's not that bad")
- Uses relationship context to manipulate or shame
- Tells the person what to feel or how to interpret the other person's behavior
- Turns a child against a parent or a parent against a child

**LiLa DOES:**
- Validate feelings as the first response, every time
- Help each person articulate what they need from the relationship
- Ask questions that invite the person's own curiosity about the dynamic
- Suggest communication approaches tailored to both people's styles (using InnerWorkings + relationship context)
- Help people recognize their own patterns ("you've mentioned feeling dismissed before — is there a pattern here?")
- Empower with concrete next steps the person chooses themselves
- Celebrate relationship wins and progress
- Respect the person's pace — if they're not ready to consider the other side, that's okay

**Safety concern exception:** If LiLa notices language suggesting unhealthy or unsafe dynamics — fear of a specific person, physical harm, coercive control, isolation, threats — the validate-curiosity-empower arc is modified. Curiosity is NOT invited about the other person's perspective when safety is at stake. Empowerment focuses on safety and support. The full safety concern protocol is defined in PRD-20 (Safe Harbor). Key principles: LiLa never labels a situation as "abuse" based on one person's perspective, never diagnoses, and never assigns blame. Instead, LiLa paints a picture of what healthy looks like, acknowledges the gap without labeling, and guides toward safe humans. For immediate danger, Tier 3 crisis resources are provided directly per PRD-05. Safe Harbor is suggested as the dedicated processing space for ongoing situations. Safety concerns are not relationship dynamics to mediate — they are situations that need real human support.

> **Decision rationale:** This framework embodies the discernment principle — helping people develop their inner compass about relationships rather than telling them what to feel or who to blame. The validate-first approach ensures people feel heard before anything else. The curiosity invitation respects their autonomy to arrive at perspective-taking on their own terms. The ownership step puts them in the driver's seat. This is the difference between "your dad is wrong" (judgment), "have you considered his perspective?" (premature lecturing), and "what do you think is going on, and how do you want to show up?" (discernment + empowerment).

### Relationship Notes for Each Person's LiLa

When a non-mom family member uses LiLa (Higgins, general chat, etc.) and the conversation involves a relationship:
- LiLa loads ONLY that person's own relationship notes (where `author_id = current_user`)
- LiLa does NOT load other people's notes or mom's notes
- LiLa uses the notes to understand the person's perspective and help them through the validate → curiosity → empower arc
- LiLa invites curiosity about the other person's perspective even without access to the other side's notes — this is a coaching skill, not a data dependency

### Upload Extraction

- Uses Sonnet for complex documents (PDFs, multi-page), Haiku for simple text files
- Extraction prompt instructs the model to identify key facts, personality traits, medical information, preferences, and other context-relevant items
- Output is structured as an array of `{ text, suggested_category }` objects for the review screen
- Original document is also stored for RAG "dig deeper" access (leveraging StewardShip patterns)

### RAG "Dig Deeper"

> **Depends on:** StewardShip RAG patterns (pgvector embeddings, document chunking, retrieval).

When a LiLa conversation references a person and the summarized context isn't sufficient, the user can say "dig deeper" or similar phrases. LiLa then:
1. Queries the vector embeddings of that member's uploaded documents
2. Retrieves relevant chunks
3. Includes them as supplementary context for the current conversation

> **Forward note:** The full RAG pipeline (chunking, embedding, retrieval ranking) is built on StewardShip patterns. PRD-19 establishes the document storage and the "dig deeper" UX trigger. The RAG infrastructure itself may be formalized in a Knowledge Base PRD or built directly from StewardShip reference.

### Monthly Aggregation & Context Freshness

On billing day, a scheduled function runs a four-step process:

**Step 1: Data Aggregation**
- Queries all feature tables for the billing period (victories, task completions, educational hours, achievements, streaks, IEP data, therapy notes, behavioral observations)
- Compiles structured JSONB into `monthly_data_aggregations`

**Step 2: Context Freshness Review**
- Compares the month's aggregated data against each member's current active context items
- Generates a per-member list of **suggested context updates** — additions, revisions, and potential removals:
  - **Additions:** New patterns observed. "Jake completed 47 math tasks at 92% — suggested context: 'Currently excelling in math.'"
  - **Revisions:** Existing context that may be outdated. "Current context says 'Struggles with math anxiety' (added 6 months ago). This month's data shows consistent math success. Suggested revision: 'Was anxious about math; now excelling with confidence.'"
  - **Removals:** Context that no longer appears relevant. "Current context says 'Soccer T/Th 4-6pm' but no soccer-related tasks or events appeared this month. Still accurate?"
- This step uses Haiku for cost efficiency — it's pattern matching and comparison, not complex reasoning

**Step 3: Present to Mom**
- Mom receives a notification: "[Month] data is ready! You have X suggested context updates across Y family members."
- Tapping opens a review screen showing per-member suggested updates
- Each suggestion shows: the existing context item (if revision/removal), the suggested change, and the data that prompted it
- Mom can accept, edit, or dismiss each suggestion
- Accepted additions create new `archive_context_items` with `source = 'monthly_review'`
- Accepted revisions update existing items (old version preserved in edit history)
- Accepted removals archive the item (soft delete)
- Dismissed suggestions are tracked to avoid re-suggesting (same pattern as context learning dismissals in PRD-13)

**Step 4: Report Availability**
- Notifies mom that monthly reports are available for generation
- If LiLa monthly context review is enabled at a higher tier: triggers a deeper Sonnet analysis that looks for patterns across multiple months, not just the current one

> **Decision rationale:** The monthly context freshness review turns the billing-day aggregation into an automatic context maintenance system. Mom doesn't have to remember to update "struggles with math" when Jake has clearly overcome it — the system notices and suggests the update. This keeps LiLa's intelligence current without requiring mom to manually audit every context item. The review-before-save pattern (same as everywhere else) ensures mom stays in control.

> **Mom experience goal:** I shouldn't have to remember what I wrote about Jake six months ago. The system should notice when things have changed and help me keep everything current. One notification a month, a few taps to review suggestions, and LiLa stays up to date.

---

## Edge Cases

### Empty Member Archive
- Shows warm empty state: "Start building [Name]'s profile — the more LiLa knows, the better she can help."
- Guided interview prominently featured as the primary onboarding path
- Upload button visible

### Upload Processing Failure
- If extraction fails (corrupted file, unsupported format within accepted types, illegible image): "I couldn't extract context from this file. You can try a clearer version, or add context manually."
- Original file is still stored — user can retry or manually enter context

### Very Large Uploads
- Files over 10MB show a warning
- PDFs over 50 pages processed in chunks with progress indicator
- EPUB files extracted to text before processing

### No Aggregation Data Available
- Reports page shows: "No monthly data available yet. Data is compiled on your billing renewal day."
- If family just signed up: "Your first data compilation will happen on [next billing date]."

### Partner Has No Account
- If no dad/spouse member exists: Partner Sharing section is hidden
- If dad exists but hasn't set up his own profile: "Invite [Name] to set up their profile so they can share context with you."

### Relationship Notes — Self-Referencing
- User cannot create a relationship note between a person and themselves
- The pair must be two different people

### Alias — No Alias Set
- If `use_alias_in_external = true` but no `primary_alias` is set: prompt mom to create one before Optimizer uses it
- Default: alias not used (`use_alias_in_external = false`)

### Context Item Ordering After New Additions
- New items from any source (manual, guided interview, document upload, context learning) are appended at the bottom of the context overview
- Mom drags them into the desired position
- Items from different sources are visually tagged but mixed in the same priority list

### Data Retention After Cancellation
- Monthly aggregations are retained indefinitely per the "Mom Who Cares" data retention policy
- Active subscribers have full access to all aggregated months
- Cancelled subscribers retain read-only access for up to 12 months, then data follows the configured retention policy
- Storage cost is approximately a penny per family per month — no financial reason to delete

---

## Tier Gating

> **Tier rationale:** Core context management is foundational to LiLa's intelligence and should be broadly available. Advanced features (reports, custom templates, RAG, on-demand aggregation) represent higher-value capabilities for power users.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `archives_enhanced_member` | Enhanced member detail view (context overview, drag ordering, private notes) | TBD |
| `archives_guided_interview` | Guided context interview flow | TBD |
| `archives_document_upload` | Upload documents with AI extraction | TBD |
| `archives_rag_deep` | RAG "dig deeper" from uploaded documents | TBD |
| `archives_relationship_notes` | Relationship notes between pairs | TBD |
| `archives_relationship_mediation` | Full Picture Mediation mode (mom sees all perspectives via LiLa) | TBD |
| `archives_partner_sharing` | Bidirectional partner context sharing | TBD |
| `archives_reports_basic` | Generate reports from pre-built templates | TBD |
| `archives_reports_custom` | Custom report templates (mom-authored) | TBD |
| `archives_aggregation_ondemand` | Trigger data aggregation on demand (not just billing day) | TBD |
| `archives_alias` | Alias system for external LLM privacy | TBD |
| `ai_toolbox_browse` | Browse and use AI Toolbox | TBD |
| `ai_toolbox_assign` | Mom assigns tools to family members' toolboxes | TBD |

All return `true` during beta. Feature keys wired from day one per PRD-02 conventions.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| AI Toolbox page + per-member tool assignment | Full AI Toolbox with AI Vault integration | AI Vault PRD |
| Higgins/Cyrano/etc. living in AI Toolbox | Person-context tools pulling from Archive context | AI Vault PRD / individual tool PRDs |
| Custom report templates (mom-authored) | Advanced template authoring with AI generation | PRD-28 or dedicated Reports PRD |
| State-specific homeschool compliance formatting | State-by-state template library | PRD-28 (Tracking, Allowance & Financial) |
| On-demand aggregation trigger | Premium billing-independent data compilation | Future tier gating implementation |
| My Circle (non-family contacts) | Lightweight contact cards with freeform notes | Post-MVP feature |
| Teen-facing "Tell LiLa About Yourself" guided flow | Lighter interview saving to InnerWorkings with sharing toggles, gives teens input into their own profile | Post-MVP enhancement |
| Full RAG pipeline (chunking, embedding, retrieval) | Vector search across uploaded documents | Knowledge Base PRD |
| Relationship Wins auto-tagging from Victory Recorder | Victories mentioning two people auto-tag as relationship wins for that pair; LiLa can reference positive moments during conflict coaching | PRD-11 enhancement / post-MVP |
| Report generation PDF export | Server-side PDF rendering from Markdown | Build infrastructure |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| My Circle folder type for non-family contacts | PRD-13 | Deferred to post-MVP. Stub remains. |
| Partner Profile aggregation on Archive card | PRD-13 | Wired via the dual-context sharing model (Shared Context from Them section on Screen 2) + Partner Sharing Settings (Screen 8). |
| Family Management Page | Planning Decisions doc | Absorbed into Archives. The enhanced member detail view (Screen 2) IS the family management experience. No separate page needed. |
| People & Relationships feature | Planning Decisions doc | Absorbed into Archives enrichment + relationship notes. |
| Auto-archive victories monthly | PRD-13 | Wired via monthly data aggregation — victory data is part of the billing-day compilation. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Enhanced member detail view (Screen 2) with context overview, drag ordering, active/inactive toggles, archive/delete
- [ ] Private notes section on member detail — mom-only, RLS-enforced
- [ ] Three sharing checkboxes per context item: LiLa, Spouse, Family
- [ ] Shared Context from Them section visible when partner has shared items
- [ ] Guided context interview (Screen 3) with starter question bank (9 categories, 2-3 questions each)
- [ ] Built-in love languages mini-assessment (local scoring, no AI cost)
- [ ] Document upload flow (Screen 4) supporting PDF, images, DOCX, TXT, EPUB, MD
- [ ] AI extraction of context items from uploaded documents with review screen
- [ ] Original documents stored in Supabase Storage, linked to member
- [ ] Relationship notes (Screen 7) — create, edit, delete, active/inactive toggle
- [ ] Relationship notes starter prompts — tappable suggestions for mom, teens, and guided children
- [ ] Relationship notes multi-author — mom, dad, independent teens can write; each sees only their own
- [ ] Guided children simplified relationship feelings prompt functional
- [ ] "How to Reach Me" card (Screen 8) — structured fields, single JSONB context item per member
- [ ] Teens can write their own "How to Reach Me" card (shared with mom by default)
- [ ] Mom can write "How to Reach Me" cards for younger children
- [ ] "How to Reach Me" card loaded as high-priority context for Higgins, Cyrano, message coaching
- [ ] Alias system — per-member aliases, "use alias in external prompts" toggle, primary alias selection
- [ ] Partner sharing settings (Screen 8) — bidirectional opt-in
- [ ] `monthly_data_aggregations` table created, billing-day aggregation function wired
- [ ] Monthly context freshness review: generates suggested additions/revisions/removals per member from aggregated data
- [ ] Context freshness review screen: per-member suggestions with accept/edit/dismiss actions
- [ ] Dismissed freshness suggestions tracked to prevent re-offering
- [ ] Reports page (Screen 6) with basic report generation from templates
- [ ] At least 3 report templates functional: Monthly Summary, Homeschool Hours, Accomplishments
- [ ] Finished reports stored in member Archives
- [ ] Bulk family setup enrichment — LiLa sorts notes into context items during member creation
- [ ] Special Adult lightweight profile cards on Archives main page
- [ ] RLS verified: private notes only readable by primary_parent
- [ ] RLS verified: relationship notes only readable by their author (`author_id = current_user`); mom can read all in mediation mode only
- [ ] Relationship notes: multi-author support — mom, dad, independent teens can write about relationships they're part of
- [ ] Guided children: simplified relationship feelings prompt functional
- [ ] Full Picture Mediation guided mode registered and functional
- [ ] Mediation mode loads all authors' notes with neutral labels, never attributes by name
- [ ] `is_available_for_mediation` toggle functional per note
- [ ] RLS verified: spouse sharing checkboxes control cross-member visibility
- [ ] `useCanAccess()` wired on all feature keys, returning `true` during beta
- [ ] PermissionGate wrapping all Archives UI per PRD-02 conventions

### MVP When Dependency Is Ready
- [ ] LiLa Optimizer alias substitution (depends on PRD-05C build)
- [ ] Higgins/Cyrano loading relationship notes for relevant pairs (depends on Higgins/Cyrano tool builds)
- [ ] IEP Progress Report template (depends on PRD-28 tracking infrastructure)
- [ ] Context Update template (LiLa analyzes aggregation and suggests additions — depends on PRD-05C context learning)
- [ ] RAG "dig deeper" from uploaded documents (depends on Knowledge Base PRD or StewardShip RAG port)
- [ ] AI Toolbox page with tool assignment (depends on AI Vault PRD)

### Post-MVP
- [ ] My Circle — non-family contacts with freeform notes
- [ ] Custom report templates (mom-authored)
- [ ] State-specific homeschool compliance formatting
- [ ] On-demand data aggregation (not just billing day)
- [ ] On-demand LiLa context review
- [ ] Advanced interview question bank (expanded through beta feedback)
- [ ] Personality GPT integration (upload results from third-party personality tools)
- [ ] Context staleness indicators (highlight items not updated in X months)
- [ ] Seasonal family overview prompts
- [ ] Platform-specific report formatting (optimized for specific school systems or therapy providers)

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: Archives is the family management surface. There is no separate Family Management Page or People & Relationships page. Member profiles ARE Archive cards.
- [ ] Convention: Private notes (`private_notes` table) are ALWAYS mom-only. RLS enforced. Never included in non-mom context assembly. Never visible to dad even with full Archive access.
- [ ] Convention: Relationship notes (`relationship_notes` table) are multi-author and per-author-private. Each member sees only their own notes. Mom, dad, and independent teens can write about relationships they're part of. Mom can additionally write about any pair. Guided children can write simplified relationship feelings.
- [ ] Convention: Full Picture Mediation mode (`relationship_mediation` guided mode) loads ALL authors' notes for a pair (where `is_available_for_mediation = true`) into LiLa's context with neutral labels. Notes are NEVER displayed on screen or attributed by name. LiLa synthesizes without revealing.
- [ ] Convention: Relationship Context Ethical Framework — LiLa never takes sides, never reveals one person's feelings to another, always steers toward repair, respects all members. Safety concern exception modifies the arc when unhealthy dynamics are detected — LiLa never labels, never diagnoses, paints a picture of healthy, and guides toward safe humans. Full protocol in PRD-20.
- [ ] Convention: Three sharing checkboxes per context item — `is_included_in_ai` (LiLa context), `share_with_spouse`, `share_with_family`. These are independent toggles. Sharing with spouse does NOT automatically include in LiLa.
- [ ] Convention: Dual-context model on member detail views — "Their shared context" (items they've shared via checkboxes) and "Your private notes" (your observations, never visible to them). Both sections can have items toggled active/inactive for LiLa.
- [ ] Convention: Alias system — `primary_alias` on `archive_member_settings` is used by LiLa Optimizer when `use_alias_in_external = true`. Real names never sent to external platforms when alias is active.
- [ ] Convention: Nickname recognition — `display_name_aliases TEXT[]` on `archive_member_settings` stores all nicknames. LiLa loads these into the system prompt as a name resolution table. Any recognized nickname in a user message resolves to the canonical `display_name`. The Optimizer replaces ALL names (display_name + all aliases) with the `external_alias` when formatting for external LLMs.
- [ ] Convention: Guided context interview uses predefined questions (system-defined, not AI-generated) to minimize costs. AI only used for parsing complex free-text answers.
- [ ] Convention: Document upload follows the review-before-save pattern — AI extracts, user reviews, then saves. Same pattern as PRD-07 (InnerWorkings upload).
- [ ] Convention: Monthly data aggregation fires on Day 1 of each family's billing cycle. Aggregated data is structured JSONB in `monthly_data_aggregations`, NOT in Archives. Only finished reports go to Archives.
- [ ] Convention: Monthly context freshness review runs automatically after aggregation. Compares month's data against active context items and generates suggested additions, revisions, and removals. Mom reviews and accepts/edits/dismisses. Accepted changes use `source = 'monthly_review'`. Dismissed suggestions tracked to prevent re-offering.
- [ ] Convention: Report templates are tier-gatable. Custom templates are a premium feature. Built-in templates available at lower tiers.
- [ ] Convention: AI Toolbox is a stub — concept established, tools registered, but full implementation deferred to AI Vault PRD.
- [ ] Convention: Special Adults get lightweight profile cards, not full Archive folders.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `member_documents`, `private_notes`, `relationship_notes`, `guided_interview_progress`, `monthly_data_aggregations`, `generated_reports`
Columns added to `archive_member_settings` (PRD-13): `aliases`, `use_alias_in_external`, `primary_alias`
Columns added to `archive_context_items` (PRD-13): `share_with_spouse`, `share_with_family`, `sort_order`
Enums updated: `extraction_status`, `aggregation_status`, `report_template_type`, extended `source` and `context_type` on `archive_context_items`
Triggers added: `set_updated_at` on `private_notes`, `relationship_notes`, `guided_interview_progress`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Partner Profile folded into PRD-19**, not a separate PRD-19A | Partner Profile is fundamentally a People profile with special bidirectional permissions. Separate PRD would create cross-referencing overhead for what's really the same data model. |
| 2 | **No standalone People & Relationships page or Family Management Page** — Archives IS the family management surface | Avoids creating a thin page that duplicates what Archives already provides. Member profiles are Archive cards. The enhanced member detail view provides all the "management" UI needed. |
| 3 | **My Circle deferred to post-MVP** | Keeps scope manageable. Non-family contact management is useful but not essential for the core family context experience. |
| 4 | **Sphere of Influence skipped entirely** | Removed from active build due to therapist IP concerns. The relationship mapping concept is not relevant in a lighter form. |
| 5 | **Dual-context sharing model: their shared context + your private observations** | Real family dynamics require honest private notes (e.g., communication patterns, manipulation tendencies, codependency dynamics) that would be hurtful if seen by the subject. Separating shared vs. private context protects relationships while giving LiLa the full picture. |
| 6 | **Three sharing checkboxes per context item: LiLa, Spouse, Family** | Gives granular per-item control. Independent toggles — sharing with spouse doesn't automatically include in AI, and vice versa. |
| 7 | **Guided interview uses predefined questions, not AI-generated** | Minimizes API costs while still feeling conversational. Question bank grows through testing and beta feedback. AI only used for parsing free-text answers. |
| 8 | **Built-in love languages mini-assessment** scored locally, plus links to free external quizzes | Provides value without API costs. External quiz links let mom use established assessments and upload results. |
| 9 | **Upload pipeline supports PDF, images, DOCX, TXT, EPUB, MD** | Broad format support matches real-world documents mom might have (school reports as DOCX, IEP paperwork as PDF, personality results as images, etc.). |
| 10 | **Same review-before-save pattern as PRD-07** for document uploads | Proven pattern. Mom reviews extracted items before anything is saved to context. Consistent UX across upload experiences. |
| 11 | **Monthly aggregation on billing day, not a universal date** | Creates natural retention hook. Mom's data compiles when her subscription renews, giving her a tangible reason to stay subscribed. |
| 12 | **Aggregated data in dedicated table, NOT in Archives** | Archives holds finished documents for reference. Aggregation is structured JSONB optimized for querying. Separation of concerns. Only finished reports go to Archives. |
| 13 | **Reports system: establish tables + core flow in PRD-19; templates refined in future PRDs** | PRD-19 defines the aggregation, report generation UX, and core templates. Full template refinement (state-specific compliance, custom templates) comes in PRD-28 or dedicated Reports PRD. |
| 14 | **Aliases are per-member, one primary alias for external prompt substitution** | Simple, clear. Mom sets one alias per person. LiLa Optimizer auto-substitutes when crafting prompts for external LLMs. |
| 15 | **Special Adults get lightweight profile cards, not full Archive folders** | Caregivers with shift-based access don't need the full context management experience. Simple profile card with name, contact, assigned kids, notes. |
| 16 | **Relationship notes expanded to multi-author** — mom, dad, and independent teens can all write notes about relationships they're part of. Each note is private to its author. | Real relationship mediation requires understanding all perspectives. Helam's view of Dad↔Helam is different from Dad's view and from Mom's view. All three are valuable. Privacy per author prevents hurt while enabling intelligence. |
| 17 | **Full Picture Mediation mode for mom** — `relationship_mediation` guided mode loads ALL authors' notes for a pair (where `is_available_for_mediation = true`) | Mom needs the complete picture to mediate effectively. Notes are loaded into LiLa context with neutral labels ("Perspective A", "Perspective B") — never attributed by name. Mom never sees raw notes on screen. LiLa synthesizes without revealing. |
| 18 | **`is_available_for_mediation` opt-out flag** per relationship note | Each author can choose whether their notes are available for mediation mode. Default is true (available). If someone writes something purely for their own processing, they can toggle it off. |
| 19 | **Guided children can write simplified relationship feelings** — "How do you feel about your relationship with [name]? What do you wish it was like?" | Age-appropriate emotional awareness building. Helps LiLa understand younger children's emotional world. Not therapy — relationship intelligence. |
| 20 | **Relationship Context Ethical Framework established** — LiLa never takes sides, never reveals, always steers toward repair, respects all members. Safety concern exception modifies the arc — LiLa never labels, never diagnoses, paints healthy, guides toward safe humans. Full protocol deferred to PRD-20. | Embodies the discernment principle. Helps people develop their inner compass rather than telling them who to blame. The safety concern exception ensures protection without LiLa overstepping by labeling or diagnosing based on one person's perspective. |
| 21 | **AI Toolbox established as a stub** — concept confirmed, Higgins/Cyrano/etc. live there, full implementation deferred to AI Vault PRD | The Toolbox concept is clear but depends on AI Vault infrastructure for tool management, assignment, and delivery. |
| 22 | **Planning Decisions doc acknowledged as outdated** — Build Order Source of Truth remains authoritative | PRD numbering in Planning Decisions no longer matches reality. Reconciliation planned for pre-build audit. |
| 23 | **PRD-19 consolidates Planning Decisions features #17, #18, and #19** | Family Management Page, People & Relationships, and Partner Profile are all absorbed into this single PRD because they all converge on the Archives experience. |
| 24 | **Relationship notes include starter prompts** — tappable suggestions tailored to the author's role (mom, teen, guided child) | Lowers the barrier to reflection. Especially valuable for teens who might not know where to start. Prompts invite honest self-reflection without leading toward negativity. Includes forward-looking "how do I want to show up" question for empowerment. |
| 25 | **"How to Reach Me" card as a structured context item** — one JSONB record per member with 5 fields | Direct communication guide that Higgins, Cyrano, and message coaching need most. Structured fields ensure consistency. Teens writing their own card is a self-advocacy exercise. Single JSONB item keeps it simple — one record, one toggle, always loaded as a unit. |
| 26 | **"How to Reach Me" loaded as HIGH-PRIORITY context** for all communication tools | This is the most actionable context for relationship interactions — it's literally instructions for how to communicate with this person. Takes priority over general context items when token budgets are tight. |
| 27 | **Relationship Wins / Victory tie-in established as stub** | Victories mentioning two people can auto-tag as relationship wins. LiLa can reference positive moments during conflict coaching: "Remember when they built Legos together for two hours?" Celebration-forward approach to relationship intelligence. Wires to PRD-11 enhancement. |
| 28 | **Monthly context freshness review** — billing-day aggregation automatically generates suggested context additions, revisions, and removals per member | Keeps LiLa's intelligence current without mom manually auditing every item. The system notices when "struggles with math" is contradicted by a month of 92% completion rates. Same review-before-save pattern as everywhere else — mom stays in control. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | My Circle (non-family contacts) | Post-MVP feature. Stub remains in PRD-13. |
| 2 | Custom report templates (mom-authored) | PRD-28 or dedicated Reports PRD |
| 3 | State-specific homeschool compliance formatting | PRD-28 (Tracking, Allowance & Financial) |
| 4 | Full AI Toolbox implementation | AI Vault PRD |
| 5 | Full RAG pipeline | Knowledge Base PRD or StewardShip RAG port |
| 6 | On-demand data aggregation | Future tier gating implementation |
| 7 | Advanced interview question bank expansion | Beta testing and iteration |
| 8 | Planning Decisions doc reconciliation with current PRD numbering | Pre-build audit |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-01 (Auth & Family Setup) | Bulk add enrichment — LiLa sorting of notes into context items during family setup. | Note that bulk add parsed notes get `is_included_in_ai` toggles and flow into Archive context items. |
| PRD-02 (Permissions) | New sharing model with `share_with_spouse` and `share_with_family` checkboxes. Private notes as a new permission boundary. | Add private notes to the permission documentation. Note that `share_with_spouse` is a new per-item sharing mechanism alongside the existing Archive access grants. |
| PRD-05 (LiLa Core) | New context sources: private notes, relationship notes, shared partner context. Alias substitution for external prompts. | Update context assembly pipeline to include these sources. Add relationship note loading rule (both people in pair must be in the conversation). |
| PRD-05C (LiLa Optimizer) | Alias system — when `use_alias_in_external = true`, Optimizer substitutes `primary_alias` for real names in external prompts. | Add alias lookup to the Optimizer's prompt formatting pipeline. |
| PRD-07 (InnerWorkings) | InnerWorkings entries gain `share_with_spouse` checkbox for bidirectional partner sharing. | Add `share_with_spouse` column to `self_knowledge` table. Note that this is independent of the existing `is_shared_with_mom` / `is_shared_with_dad` flags (which control parent-child visibility, not partner-partner sharing). |
| PRD-13 (Archives) | Enhanced member detail view, private notes, alias columns on `archive_member_settings`, sharing columns on `archive_context_items`, Special Adult lightweight profiles. Reports stored in Archives. | Update PRD-13 schema to include new columns. Note that the "My Circle folder type" stub remains deferred to post-MVP. |
| PRD-15 (Messages) | Out of Nest members confirmed to NOT have full Archive folders initially. They have Archive cards (PRD-13) but not the enhanced PRD-19 experience at MVP. | Note that Out of Nest enhanced profiles are a future enhancement. Basic Archive folder structure from PRD-13 is sufficient at MVP. |
| PRD-18 (Rhythms & Reflections) | Rhythm completion data and reflection responses feed into monthly data aggregation. | Note `monthly_data_aggregations` as a consumer of rhythm/reflection data. |
| Build Order Source of Truth | PRD-19 completed. Consolidates features #17, #18, #19 from Planning Decisions. New tables defined. AI Toolbox stub established. | Update Section 2 with PRD-19 completion. Update Section 5 to note Family Management Page and People & Relationships are absorbed. Add AI Toolbox to stubs. |

---

*End of PRD-19*
