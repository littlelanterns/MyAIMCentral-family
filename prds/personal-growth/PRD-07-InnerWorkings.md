> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-07: InnerWorkings (Self-Knowledge)

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-05 Planning Decisions Addendum, PRD-06 (Guiding Stars & Best Intentions)
**Created:** March 3, 2026
**Last Updated:** March 4, 2026

---

## Overview

InnerWorkings answers the question: **Who am I right now?** Where Guiding Stars (PRD-06) defines who the person is choosing to become, InnerWorkings describes current reality — personality types, traits, tendencies, strengths, growth areas, and general self-knowledge. Together, Guiding Stars and InnerWorkings give LiLa the complete picture: aspirational identity + present reality.

InnerWorkings is the name for everyone — it is not user-nameable. The name evokes the gears, wiring, and operating system of a person without being clinical. The database table is `self_knowledge` (never changes). The StewardShip predecessor was "The Keel" with the same six-category structure and three input paths. For MyAIM Family v2, InnerWorkings adapts this for a multi-member family platform with the mom-first permission model and a new privacy default for teens.

**Three core input paths make InnerWorkings accessible to anyone**, regardless of how introspective or assessment-savvy they are: write it yourself, upload personality assessment results, or discover through a guided conversation with LiLa. A fourth path — Bulk Add — lets users paste multiple items for AI to sort into categories. All paths lead to the same place: structured self-knowledge entries that LiLa can reference when personality context would improve the response.

**InnerWorkings is a context source, not always-on.** Unlike Guiding Stars (loaded as baseline identity context in every conversation), InnerWorkings is loaded selectively — only when the conversation topic benefits from personality awareness. This is an architectural distinction established in StewardShip: self-knowledge makes advice more personalized, but not every conversation needs it.

**Key conventions:** "Growth Areas" is the label — never "Weaknesses" anywhere in the UI. Contradictory entries are welcome — people are complex. Sensitive content (mental health, trauma, neurodivergence, shame-related patterns) is treated with care and never used judgmentally.

> **Mom experience goal:** InnerWorkings should feel like a private mirror — a place to understand yourself better, not a form to fill out. The three input paths meet mom wherever she is: already self-aware, holding assessment results, or needing help articulating what she senses but can't name.

---

## User Stories

### Creating & Managing Self-Knowledge
- As a mom, I want to record my personality type results (MBTI, Enneagram, etc.) so LiLa understands how I think and process.
- As a mom, I want to write down my traits and tendencies so LiLa can tailor advice to how I actually show up, not a generic version of me.
- As a mom, I want to identify my strengths so LiLa can help me lean into what energizes me.
- As a mom, I want to name my growth areas so LiLa can be sensitive to where I struggle, without judgement.
- As a dad, I want my own InnerWorkings so my AI interactions reflect who I actually am.
- As an independent teen, I want to explore who I am so the AI can help me in ways that fit my personality.

### Input Paths
- As a mom, I want to quickly write a self-knowledge entry so capturing a realization doesn't require a long process.
- As a mom, I want to upload my personality assessment results (PDF or image) so AI can extract and organize the key insights for me.
- As a mom, I want to have a conversation with LiLa to discover patterns about myself I might not be able to articulate on my own.
- As a mom, I want to tell LiLa my personality type (e.g., "I'm a Carol Tuttle 3/2") and have her help me identify which associated traits actually apply to me.
- As a mom, I want to paste a big list of things I know about myself and have AI sort them into the right categories.

### Privacy & Sharing
- As an independent teen, I want my InnerWorkings to be private by default so I can explore who I am without worrying about who's watching.
- As a teen, I want to choose to share specific entries with mom so she can understand me better when I'm ready.
- As a dad, I want to share specific entries with my wife so her LiLa context includes what she needs to know about how I work.
- As a mom, I want to be able to turn on visibility for my teen's InnerWorkings when I need to, with my teen knowing I did.

### AI Context
- As a mom, I want LiLa to reference my personality when it's relevant — not mechanically, but as natural context that makes advice more personalized.
- As a mom, I want to control which InnerWorkings entries LiLa can see using the standard context toggle system.
- As a mom, I want InnerWorkings entries to appear on Archive person cards so I can manage all context about a person in one place.

---

## Screens

### Screen 1: InnerWorkings Main Page

**What the user sees:**
- Page title: "InnerWorkings"
- Contextual subtitle (muted): "Who you are right now."
- Entries grouped by category, each group collapsible:
  - **Personality Types** — results from personality frameworks (hover description: "Your results from personality frameworks — MBTI, Enneagram, Dressing Your Truth, Four Tendencies, StrengthsFinder, Love Languages, etc. Just the type or result, not the full assessment.")
  - **Traits & Tendencies** — behavioral patterns, how you process, react, and show up
  - **Strengths** — what you're good at, what energizes you
  - **Growth Areas** — areas for development (NEVER "Weaknesses" in any UI element)
  - **General** — anything else about yourself that doesn't fit the other categories
- Each entry displayed as a card with:
  - The text of the entry
  - Small category tag
  - Source indicator if present (e.g., "from Enneagram results", "discovered with LiLa")
  - `is_included_in_ai` checkbox (tooltip: "Included in LiLa conversations. Uncheck to exclude.")
  - Edit icon (inline editing)
  - Archive action (swipe or menu)
- "Select All / Deselect All" toggle per category group for AI context inclusion
- Summary indicator at top: "Gleaning context from 14/18 insights" (per PRD-05 Addendum pattern)
- Floating action button with options:
  - "Write It Myself" — opens inline add form
  - "Upload Assessment" — opens file picker for PDF/image upload
  - "Discover with LiLa" — opens LiLa in `self_discovery` guided mode
  - "Bulk Add" — opens bulk add form with AI sorting
- "View Archived" toggle at bottom to show/hide archived entries

**Interactions:**
- Tap entry → expand for inline editing
- Long-press or drag → reorder within category group
- Swipe left → archive option
- Tap "Discover with LiLa" → opens LiLa drawer (mom) or modal (other roles) in `self_discovery` guided mode
- Tap AI checkbox → optimistic toggle, syncs to server
- Tap archived entry → option to restore

**Data created/updated:**
- `self_knowledge` entries (CRUD)
- `is_included_in_ai` boolean per entry
- `archived_at` timestamp for soft deletes
- `sort_order` integer for user-controlled ordering within category

**Empty State:**
- Warm illustration or icon
- "InnerWorkings is where you capture who you are right now — your personality, your patterns, your strengths, and the areas where you're growing. The more LiLa knows about how you tick, the more personalized her guidance becomes."
- Three buttons: "Write Something About Myself", "Upload Assessment Results", "Let LiLa Help Me Discover"
- The tone is inviting, never pressuring. Sets expectation: "This is a starting point. InnerWorkings will deepen as you learn about yourself."

### Screen 2: Write It Myself (Inline Add Form)

**What the user sees:**
- Modal or bottom sheet with:
  - Category picker (Personality Types, Traits & Tendencies, Strengths, Growth Areas, General)
  - Text field — "What do you know about yourself?"
  - Source field (optional, freeform) — "Where does this come from?" (e.g., "Enneagram Type 1", "MBTI - INTJ", "therapist", "self-observed", "Carol Tuttle 3/2")
  - Save button

**Interactions:**
- User selects category, types entry, optionally adds source, saves
- Entry immediately appears in the correct category group on the main page
- AI checkbox defaults to true (included in context)

**Data created:**
- One `self_knowledge` record with `source_type = 'manual'`

### Screen 3: Upload Assessment (File Upload Flow)

**What the user sees:**

**Step 1 — File Selection:**
- File picker accepting PDF and image files (jpg, png)
- "Upload a personality assessment, test results, or any document about yourself. LiLa will extract the key insights for you to review."

**Step 2 — Processing:**
- Loading state with LiLa avatar: "Reading your assessment..."
- AI processes the file and extracts individual insights

**Step 3 — Review & Confirm:**
- LiLa presents extracted insights as a list, each with:
  - The insight text (editable inline)
  - Suggested category (editable via dropdown)
  - Confidence indicator (high/medium/low — visual only, helps user prioritize review)
  - Checkbox to include/exclude from save (all checked by default)
  - Optional source label auto-populated from the document (e.g., "Enneagram Type 1 Report")
- High-confidence insights shown first, low-confidence in a separate "Review these more carefully" section
- "Save Selected" button at bottom
- "Add More" option to write additional insights the AI may have missed
- User can edit any insight text before saving

**Interactions:**
- Toggle individual insights on/off
- Edit insight text inline
- Change suggested category via dropdown
- Save selected → all checked insights saved as individual `self_knowledge` records
- Original file stored in Supabase Storage

**Data created:**
- Multiple `self_knowledge` records with `source_type = 'file_upload'`
- All records share the same `source_reference_id` pointing to the upload record
- `source` field auto-populated from document context (user can edit)
- `file_storage_path` on each record points to the original file

### Screen 4: Bulk Add

**What the user sees:**
- Large text area with placeholder: "Paste self-observations, test results, personality notes...\n\nENFJ personality type\nStrong verbal communicator\nTend to overthink decisions under pressure\nGood at seeing the big picture"
- "Let AI Sort" button
- After processing: same review interface as Upload (list of insights with category suggestions, edit capability, include/exclude checkboxes)
- "Save Selected" button

**Interactions:**
- User pastes text, taps "Let AI Sort"
- AI parses text into individual insights, suggests categories
- User reviews, edits, saves
- Same review/confirm pattern as Upload flow

**Data created:**
- Multiple `self_knowledge` records with `source_type = 'bulk_add'`

### Screen 5: Teen Privacy Indicator (Independent Shell)

**What the teen sees:**
- On the InnerWorkings page, a small privacy badge near the page title
- **When mom has NOT toggled on visibility:** Badge shows "Your InnerWorkings are private" (lock icon). Below it: "You can share individual entries with mom using the share toggle on each entry."
- **When mom HAS toggled on visibility:** Badge shows "Mom can see your entries" (eye icon). Below it: "Mom turned on visibility for your InnerWorkings. Your entries marked as private are still hidden." Tapping navigates to Settings permissions section.
- Each entry shows a "Share with Mom" toggle (functional regardless of mom's visibility setting — lets teen proactively share even when overall visibility is off)
- If dad has tool access: "Share with Dad" toggle also appears

### Screen 6: Dad Sharing Interface (Adult Shell)

**What dad sees:**
- On each InnerWorkings entry: "Share with [partner name]" toggle
- When toggled on, that entry becomes visible in the partner's LiLa context and appears on the partner's Context Settings screen
- Unsharing removes it from the partner's context immediately

---

## Visibility & Permissions

> **Depends on:** PermissionGate component pattern — defined in PRD-02, Permission Architecture section. All access gating in this feature must use that pattern.
> **Depends on:** Shell routing and layout zones — defined in PRD-04, Shell Routing Logic section.

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full CRUD on own entries. Can view teen entries IF she has toggled on visibility for that teen. Can view entries teens have specifically shared. | Mom's default: cannot see teen entries. Mom must actively toggle on visibility (teen is notified). |
| Dad / Additional Adult | Full CRUD on own entries. Cannot see mom's unless she shares. | Dad's entries are private by default. Can share specific entries with mom via toggle. |
| Special Adult | None | Special Adults do not have InnerWorkings. Not applicable — feature outside Special Adult scope. |
| Independent (Teen) | Full CRUD on own entries. Entries private by default. Can share specific entries with mom and/or dad via per-entry toggles. | Teen sees privacy indicator showing current visibility status. |
| Guided / Play | Stubbed — future design decision | Guided children may get a simplified version later. Play children do not interact with this feature. |

> **Deferred:** Guided shell InnerWorkings — simplified version for Guided children to be designed in a future design sprint. Currently stubbed; nav item hidden or shows "Coming soon."
> **Deferred:** Play shell — InnerWorkings not present. Intentional and likely permanent for Play-age children.

### Shell Behavior

- **Mom shell:** Full InnerWorkings page in sidebar. Dashboard widget (stub). LiLa context integration active. All four input paths available.
- **Adult shell:** Same page if feature access granted by mom. Own entries only. All four input paths available.
- **Independent shell:** Own InnerWorkings page. Privacy indicator visible. All four input paths available. Simplified layout.
- **Guided shell:** Stubbed. Placeholder nav item that shows "Coming soon" or is hidden based on build status.
- **Play shell:** Feature not present.

### Privacy & Transparency

- **Teen privacy model (inverted from Guiding Stars):** InnerWorkings defaults to private for teens. Mom must actively toggle on visibility per teen in Family Settings. When she does:

> **Decision rationale:** InnerWorkings is more sensitive than Guiding Stars — personality details, growth areas, processing styles, and potentially mental health or neurodivergence information. Defaulting to private respects that sensitivity while still giving mom the authority to see when needed. The teen notification ensures transparency.
  - Teen receives a notification
  - A persistent indicator appears on the teen's InnerWorkings page ("Mom can see your entries")
  - The teen cannot toggle this back off themselves
  - The teen can advocate for privacy by having a Higgins conversation with mom (the UI can suggest this path)
  - Even with visibility toggled on, entries the teen has explicitly marked as `is_private = true` remain hidden from mom (if mom has enabled the private entry capability for that teen)
- **Per-entry sharing (always available to teens):** Regardless of mom's visibility toggle, the teen can proactively share specific entries with mom and/or dad using per-entry toggles. This means a teen with full privacy can still choose to share "I'm an ENFP" without exposing their growth areas.
- **Dad sharing:** Each entry has a "Share with [partner name]" toggle. When shared, the entry appears in the partner's LiLa context and is visible on the partner's Context Settings screen. Unsharing removes it.
- **Mom's visibility setting column:** `teen_innerworkings_visible` boolean on the family member's permission record (or equivalent permission table). Default: false.
- **Transparency caveat:** If mom has transparency access to a teen's LiLa conversations (configured in PRD-05), she may see InnerWorkings content used in conversation context even if the entry itself isn't shared. The sharing toggle controls whether the entry appears in mom's OWN LiLa context, not whether mom can ever discover it exists.

---

## Data Schema

### Table: `self_knowledge`

This table supersedes the `member_self_insights` stub defined in PRD-05. It carries forward that table's sharing model (`share_with_mom`, `share_with_dad`) while adding the full InnerWorkings feature structure.

> **Decision rationale:** Single table (`self_knowledge`) replaces the PRD-05 `member_self_insights` stub rather than maintaining two tables storing "things a person knows about themselves." Avoids confusion about where to save, where to read, and what LiLa loads.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| owner_member_id | UUID | | NOT NULL | FK → family_members. InnerWorkings is always personal (no family-level entries). |
| category | TEXT | | NOT NULL | Enum: 'personality_type', 'trait_tendency', 'strength', 'growth_area', 'general' |
| content | TEXT | | NOT NULL | The insight text. For personality types, this is the type identifier and brief description (e.g., "ENFP — I'm clearly an NF, equal on E/I and P/J"). |
| source | TEXT | | NULL | Freeform label for where this knowledge came from (e.g., "Enneagram Type 1", "MBTI", "Carol Tuttle 3/2", "therapist", "self-observed", "Gretchen Rubin - Rebel"). |
| source_type | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'file_upload', 'lila_discovery', 'bulk_add', 'content_extraction', 'log_routed'. Tracks HOW the entry was created. |
| source_reference_id | UUID | | NULL | FK → source record (LiLa conversation ID, upload record ID, etc.). For traceability. |
| file_storage_path | TEXT | | NULL | Path to original uploaded file in Supabase Storage. Only populated for `source_type = 'file_upload'`. |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Standard context toggle. PRD-05 Addendum pattern. |
| is_private | BOOLEAN | false | NOT NULL | For teen entries: if true AND mom has enabled private entries for this teen, mom cannot see this entry even if she has toggled on visibility. |
| is_shared_with_mom | BOOLEAN | false | NOT NULL | For teen/dad entries: if true, entry appears in mom's LiLa context and is visible in mom's Context Settings. |
| is_shared_with_dad | BOOLEAN | false | NOT NULL | For teen/mom entries: if true, entry appears in dad's LiLa context (if dad has relevant tool access). |
| sort_order | INTEGER | 0 | NOT NULL | User-controlled ordering within category group |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete. Non-null = archived. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- Members can CRUD their own entries (where `owner_member_id` = auth user's member ID)
- Mom can SELECT teen entries WHERE: (a) mom has toggled on visibility for that teen AND `is_private` = false, OR (b) `is_shared_with_mom` = true (regardless of visibility toggle)
- Dad can SELECT entries WHERE `is_shared_with_dad` = true (if dad has relevant tool/feature access)
- Partner can SELECT entries where `is_shared_with_mom` = true or `is_shared_with_dad` = true (depending on which partner)

**Indexes:**
- `family_id, owner_member_id, archived_at` (active entries per member)
- `family_id, owner_member_id, category, archived_at` (entries by category)
- `family_id, is_included_in_ai, archived_at` (context assembly query)
- `owner_member_id, is_shared_with_mom, archived_at` (mom's context view)
- `owner_member_id, is_shared_with_dad, archived_at` (dad's context view)
- `source_reference_id` (find all entries from one upload/conversation)

**Trigger:**
```sql
CREATE TRIGGER set_updated_at BEFORE UPDATE ON self_knowledge
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Enum/Type Updates

Add to existing source/context enums:
- `self_knowledge` as a context source type in LiLa context assembly
- `self_discovery` as a guided mode key in `lila_guided_modes` registry

The `member_self_insights` table from PRD-05 is superseded by `self_knowledge`. Any references to `member_self_insights` in PRD-05's schema or build should be updated to point to `self_knowledge`.

---

## Flows

### Incoming Flows (How Data Gets INTO InnerWorkings)

| Source | How It Works |
|--------|-------------|
| Direct entry (manual) | User types entry on InnerWorkings page via "Write It Myself" form |
| File upload | User uploads PDF/image of personality assessment. AI extracts insights, user reviews and confirms. Records saved with `source_type = 'file_upload'`. Original file stored. |
| LiLa discovery conversation | User opens `self_discovery` guided mode. LiLa asks questions, identifies patterns, extracts confirmed insights. Records saved with `source_type = 'lila_discovery'`, `source_reference_id` → conversation ID. |
| Bulk add | User pastes multiple items. AI parses and categorizes. User reviews and confirms. Records saved with `source_type = 'bulk_add'`. |
| Content extraction (stub) | Future: user uploads content to Knowledge Base, selects "Inform InnerWorkings" → AI extracts personality-relevant insights → user reviews → saved with `source_type = 'content_extraction'`. Requires Knowledge Base PRD. |
| Log/Journal routing (wired by PRD-08) | User captures content in Smart Notepad → selects "Save to InnerWorkings" from Send To grid → inline category picker overlay → saved with `source_type = 'log_routed'`, `source_reference_id` = notepad tab ID. Notepad's routing function handles the insert; InnerWorkings RLS allows inserts from the routing context (same user creating their own entry). |
| LiLa context learning (stub) | Future: during any LiLa conversation, context learning detects self-knowledge-relevant content → offers to save to InnerWorkings. Requires PRD-05C context learning feature. |

### Outgoing Flows (How InnerWorkings Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| LiLa context assembly | Active, `is_included_in_ai = true` entries loaded selectively when personality context would improve the response. Formatted in system prompt grouped by category. |
| Archives person cards | InnerWorkings entries surface on a person's Archive card as live references (not copies). Sharing state is single-source-of-truth on the `self_knowledge` table. "Checked somewhere, checked everywhere" rule applies. |
| Context Settings screen | Entries appear in the three-tier toggle system (person → InnerWorkings category → individual entries). Summary indicator: "Gleaning context from X/Y insights." |
| LiLa Optimizer (PRD-05C) | Optimizer's context presets can include/exclude InnerWorkings categories. "Relationship Advice" preset includes traits and personality types. "Career Planning" preset could include strengths (future business identity feature). |
| LifeLantern (stub) | Future: life assessment may reference personality data. Goal generation may consider strengths and growth areas. |
| Partner Profile (stub) | Future: if both parents share InnerWorkings with each other, this informs Marriage Toolbox and relationship AI tools. |
| Safe Harbor (stub) | Future: stress processing mode references personality data to adapt coping suggestions to how the person actually processes. |

---

## AI Integration

> **Depends on:** LiLa guided mode registry — defined in PRD-05, Guided Mode Registry section. The `self_discovery` mode registers there.
> **Depends on:** Context assembly pipeline and three-tier toggle system — defined in PRD-05, Context Assembly System section. InnerWorkings is a context source consumed by that pipeline.

### Guided Mode: `self_discovery`

**Registered in LiLa guided mode registry with:**
- `mode_key`: `self_discovery`
- `display_name`: "Discover Your InnerWorkings"
- `model_tier`: `sonnet` (requires emotional intelligence and personality framework knowledge)
- `context_sources`: loads existing InnerWorkings entries for the current member (so LiLa doesn't re-discover what's already captured)
- `person_selector`: none (this is always about the current member)
- `available_to_roles`: mom, dad, independent_teen
- `requires_feature_key`: `innerworkings_discovery`

**Opening messages (2-3 rotating variants):**
1. "Let's explore how you tick. I can ask you some questions about how you process, react, and show up — or if you know your personality type from any framework, tell me and I'll help you figure out which traits actually fit you. What sounds good?"
2. "I'd love to learn more about who you are right now — your patterns, your strengths, the things that make you uniquely you. We can go as deep or as light as you want. Where would you like to start?"
3. "InnerWorkings is all about knowing yourself. I can help you explore that through questions, or if you already have personality assessment results you want to unpack, just tell me your type and we'll dig in. What do you have?"

**AI Behavior in self_discovery mode:**

*Personality Type Unpacking:*
When a user mentions a personality type (e.g., "I'm a Carol Tuttle 3/2", "I'm an ENFP", "I'm a Rebel in Four Tendencies"), LiLa uses her built-in knowledge of that framework to:
1. Acknowledge the type and briefly describe key characteristics
2. Present common traits associated with that type as questions: "3/2s often tend to be dynamic and fast-paced, with a strong drive to get things done. Does that sound like you?"
3. Present common friction points or growth areas: "3/2s can sometimes steamroll over others' feelings when they're focused on a goal. Is that something you recognize?"
4. For each confirmed trait, note it as a candidate insight
5. If LiLa is unfamiliar with a framework, she says so honestly: "I'm not familiar with that particular system. Can you tell me a bit about what your type means, and I'll help you identify which traits ring true?"

*Open-Ended Discovery:*
When a user doesn't have assessment results or wants to explore from scratch:
1. LiLa asks thoughtful, open-ended questions about how the person processes information, handles stress, recharges, communicates, and makes decisions
2. Identifies patterns across answers
3. Avoids labeling or diagnosing — focuses on self-reported experience
4. Periodically summarizes what she's heard and checks accuracy

*Extraction and Save:*
At natural stopping points (or when the user is ready to wrap up), LiLa:
1. Compiles confirmed insights into a categorized list
2. Presents the list for review: "Based on our conversation, here's what I've captured about you. Review and edit anything that doesn't feel right:"
3. User edits, adds, removes as needed
4. On confirmation, insights are saved as individual `self_knowledge` records with `source_type = 'lila_discovery'` and `source_reference_id` pointing to the conversation
5. LiLa sets expectations: "This is a great start. You can always come back to discover more, or add things as you notice them."

*Multi-Session Discovery:*
Discovery can span multiple conversations. Each conversation saves its own insights. LiLa references existing InnerWorkings entries (loaded as context) to avoid re-asking about things already captured.

### Context Assembly Behavior (Selective Loading)

> **Decision rationale:** InnerWorkings is loaded selectively (not always-on like Guiding Stars) because personality context isn't relevant to every conversation. Loading it only when helpful reduces token usage and keeps LiLa focused. This matches the StewardShip Keel convention and was confirmed in the PRD-05 Planning Decisions Addendum.

**When to load InnerWorkings context:**
InnerWorkings is loaded selectively — not in every conversation, but when personality context would improve the response. Trigger scenarios include:
- Relationship conversations (personality dynamics between people)
- Stress or emotional processing discussions (how the person handles pressure)
- Parenting advice where personality awareness helps (communication style with kids)
- Career or professional conversations (strengths, working style)
- Any conversation where the user explicitly references personality ("as an introvert, I...")
- Goal-setting or growth conversations (strengths to leverage, growth areas to be sensitive about)
- Communication style discussions (love languages, conflict style)

These are guidance for the context assembly pipeline, not rigid rules. The model should have flexibility to include InnerWorkings whenever personality awareness would genuinely improve the response.

**System prompt format when loaded:**

```
[User]'s InnerWorkings (who they are right now):

PERSONALITY TYPES:
- [source]: [content]

TRAITS & TENDENCIES:
- [content]

STRENGTHS:
- [content]

GROWTH AREAS:
- [content]

GENERAL:
- [content]
```

- Categories with no entries are omitted from the prompt
- If total InnerWorkings text exceeds ~1500 tokens, include entries by `sort_order` priority and truncate lower-ranked entries with "[X additional insights available]"
- LiLa references this context naturally — never lists entries or quotes them mechanically
- If InnerWorkings contains anxiety info, LiLa avoids high-pressure framing. If it contains trauma info, LiLa adjusts tone. Sensitive content is always handled with care.

### System Prompt Notes

- **Contradictory entries are normal.** "I'm generally patient" and "I lose my temper when I feel disrespected" can coexist. LiLa treats these as nuance, not errors. She can note the nuance: "You've described yourself as generally patient but quick to anger when you feel disrespected. That's a useful distinction."
- **Never use InnerWorkings judgmentally.** If a growth area is "I tend to procrastinate," LiLa never says "Well, since you're a procrastinator..." She uses it to offer strategies tailored to the person's actual patterns.
- **Personality type knowledge.** LiLa uses her built-in knowledge of personality frameworks (MBTI, Enneagram, Four Tendencies, Dressing Your Truth, StrengthsFinder, Love Languages, DISC, Working Genius, etc.) to enrich sparse type entries. If a user only recorded "ENFP," LiLa understands what that means and can reference associated traits naturally.
- **Growth Areas label is sacred.** In any AI-generated text referencing this category, always use "Growth Areas" — never "Weaknesses," "Flaws," "Shortcomings," or similar negative framing.
- **Empty InnerWorkings behavior:** LiLa functions without InnerWorkings but gives less personalized advice. May suggest building it out — gentle, not nagging, maximum once per week, only in receptive contexts: "I could give you more tailored advice if I knew more about how you think and process. Want to spend a few minutes building out your InnerWorkings?"

---

## Edge Cases

### Empty InnerWorkings
- LiLa functions normally but with generic personality awareness
- Dashboard widget shows empty state with invitation
- Gentle suggestion maximum once per week in receptive contexts only

### Very Many Entries
- No hard limit, but practical guidance: if total InnerWorkings content exceeds ~1500 tokens, prioritize by `sort_order` (user's top-ranked entries within each category first) and truncate lower-ranked entries
- Summary indicator keeps the user informed: "Gleaning context from X/Y insights"

### Upload Processing Failure
- If AI cannot extract insights from an uploaded file (corrupted PDF, illegible image, unrelated content), show a friendly error: "I couldn't extract personality insights from this file. You can try a clearer image, or just write the key points yourself."
- The original file is still stored — user can try re-processing later or manually enter the insights

### Upload of Very Large Files
- Very large PDFs (50+ pages) should show a warning: "This is a large document. I'll focus on extracting the key personality insights, but it may take a moment."
- For extremely large files, route through the Knowledge Base RAG pipeline (stub) — InnerWorkings stores the summary, Knowledge Base stores the chunked/embedded content

### Contradictory Entries
- System does not flag, warn, or attempt to reconcile contradictory entries
- LiLa notes nuance when relevant in conversation but never treats contradictions as errors

### Sensitive Content
- No content filtering on InnerWorkings entries — users may include mental health details, trauma history, neurodivergence, relationship patterns, or shame-related content
- LiLa adapts tone when sensitive content is present in context (less pressure, more care)
- AI never throws sensitive content back at the user judgmentally or casually

### Teen Toggles Visibility After Mom Turns It On
- Teen cannot change the visibility toggle. The UI explains this clearly and suggests Higgins as a conversation path.
- Per-entry `is_private` toggle (if mom has enabled private entries) still gives the teen granular control over specific entries even when overall visibility is on.

### Archived Then Restored
- Restoring an entry (setting `archived_at` back to NULL) returns it to active display in its original `sort_order` position within its category
- Restored entries immediately become available to LiLa context assembly if `is_included_in_ai = true`

### Concurrent Edits (Multi-Device)
- Last-write-wins for entry content edits
- `is_included_in_ai` toggle changes are optimistic with server sync and rollback on error

### Mom Adds Observations About Family Members
- Mom's own observations about family members go into Archives (not InnerWorkings). InnerWorkings is always self-authored — the member writes about themselves. Mom's supplementary context lives in Archives as separate entries she creates.

### Discovery Conversation Interrupted
- If a self_discovery conversation is abandoned mid-flow, no insights are lost because nothing is saved until the user explicitly confirms
- The conversation remains in history and can be reopened to continue

---

## Tier Gating

> **Tier rationale:** Basic InnerWorkings (manual entry + context loading) is Essential because self-knowledge is foundational to personalized AI. Upload and discovery paths are Enhanced because they use AI processing that costs more and represent a meaningful upgrade value.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `innerworkings_basic` | InnerWorkings page with manual entry and bulk add | Essential |
| `innerworkings_upload` | File upload with AI extraction | Enhanced |
| `innerworkings_discovery` | LiLa self-discovery guided mode | Enhanced |
| `innerworkings_context` | InnerWorkings loaded in LiLa context assembly | Essential |

All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Content extraction input path ("Inform InnerWorkings" from Knowledge Base) | Knowledge Base / content upload system | Knowledge Base PRD |
| LiLa context learning auto-detection of self-knowledge content | LiLa context learning feature | PRD-05C |
| Dashboard widget for InnerWorkings | Widget infrastructure | Widgets PRD |
| Personality GPTs (Enneagram Guide, MBTI Interpreter, etc.) | Inner Wisdom Portal / specialized AI tools | Post-MVP (may not be built) |
| Business identity as family member with own InnerWorkings | Business Entity View | Future architecture decision |
| Guided children's light InnerWorkings experience | Guided shell feature design | Future design decision |
| Safe Harbor personality-adapted coping suggestions | Safe Harbor stress processing | Safe Harbor PRD |

> **Forward note:** Business identity as a separate "family member" with its own InnerWorkings is a future growth direction. This is why "You, Inc." was removed from personal InnerWorkings — professional/business self-knowledge will live in the business entity's own profile, not mixed with personal self-knowledge. Architecture should not foreclose this path.

> **Forward note:** Personality GPTs (Enneagram Guide, MBTI Interpreter, etc.) are post-MVP and may not be built. The `self_discovery` guided mode covers the core use case. If Personality GPTs are later added, they would register as additional guided modes that read from InnerWorkings data.

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| `member_self_insights` table | PRD-05 | Superseded by `self_knowledge` table with full feature structure. Sharing model carried forward. |
| `self_knowledge` referenced in LiLa context assembly as context source | PRD-05, PRD-05 Addendum | Table fully defined with `is_included_in_ai`, context format specified, selective loading triggers documented |
| InnerWorkings context in Optimizer presets | PRD-05C | Categories available for preset filtering |
| Log/Journal routing to InnerWorkings (`source_type = 'log_routed'`) | PRD-07 (this PRD, originally a stub) | Wired by PRD-08: "Save to InnerWorkings" from Smart Notepad Send To grid creates `self_knowledge` entry with `source_type = 'log_routed'`, `source_reference_id` = notepad tab ID, and user-selected category from inline picker overlay. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `self_knowledge` table created with all columns, RLS policies active
- [ ] `member_self_insights` table from PRD-05 stub marked as superseded (migration to rename/replace if it was already built)
- [ ] InnerWorkings page: display entries grouped by five categories, collapsible groups, inline add, inline edit, archive/restore, reorder
- [ ] Write It Myself: inline add form with category picker, text field, optional source field
- [ ] Upload Assessment: file picker → AI extraction → review/edit/confirm → save. Original file stored in Supabase Storage.
- [ ] Bulk Add: paste text → AI parse and categorize → review/edit/confirm → save
- [ ] Discover with LiLa: `self_discovery` guided mode registered, opening messages rotate, personality type unpacking works for known frameworks, graceful fallback for unknown frameworks, insight extraction and save flow
- [ ] `is_included_in_ai` toggle on all entries, optimistic UI, server sync
- [ ] "Select All / Deselect All" per category group
- [ ] Summary indicator: "Gleaning context from X/Y insights"
- [ ] Soft delete via `archived_at`
- [ ] Source tracking: `source` + `source_type` + `source_reference_id` on all entries
- [ ] Linked insights from uploads: all entries from one upload share `source_reference_id`
- [ ] LiLa context assembly loads InnerWorkings selectively with category-grouped format
- [ ] Teen privacy: entries private by default, mom can toggle on visibility (teen notified, persistent indicator), per-entry sharing toggles functional
- [ ] Dad sharing: per-entry "Share with [partner]" toggle functional
- [ ] RLS verified: member sees own; mom sees teen entries only when visibility toggled on OR entry is shared; dad sees shared entries only
- [ ] Empty state with warm invitation and three entry path buttons
- [ ] Personality Types category hover description
- [ ] "Growth Areas" label enforced — never "Weaknesses" in any UI element

### MVP When Dependency Is Ready
- [ ] InnerWorkings entries surface on Archive person cards as live references (requires Archives PRD)
- [ ] "Checked somewhere, checked everywhere" sharing state sync between InnerWorkings and Archives (requires Archives PRD)
- [ ] Content extraction from Knowledge Base uploads (requires Knowledge Base PRD)
- [ ] Log/Journal routing to InnerWorkings (requires PRD-08)
- [ ] Dashboard widget (requires Widgets PRD)
- [ ] Context learning auto-detection in LiLa conversations (requires PRD-05C)
- [ ] Safe Harbor personality-adapted coping (requires Safe Harbor PRD)

### Post-MVP
- [ ] Personality GPTs / specialized assessment interpreter tools (Enneagram Guide, MBTI Interpreter, etc.)
- [ ] AI recognizing InnerWorkings-relevant insights in ongoing conversations and offering to add them
- [ ] Visual personality profile summary card
- [ ] Business identity as a separate "family member" with its own InnerWorkings profile
- [ ] Guided children's light InnerWorkings experience
- [ ] InnerWorkings sharing between partners (e.g., mom can see dad's shared InnerWorkings entries for relationship context without dad manually sharing each one)

---

## CLAUDE.md Additions from This PRD

- [ ] InnerWorkings feature name: not user-nameable (unlike the old "My Foundation" plan). Database table: `self_knowledge`. Always called "InnerWorkings" in UI.
- [ ] InnerWorkings supersedes `member_self_insights` from PRD-05. One table (`self_knowledge`) for all member self-knowledge.
- [ ] Five categories: `personality_type`, `trait_tendency`, `strength`, `growth_area`, `general`. No "You, Inc." — professional/business identity is a future feature direction.
- [ ] "Growth Areas" label is sacred — never "Weaknesses", "Flaws", "Shortcomings" in any UI label, button, heading, or AI-generated text.
- [ ] Contradictory entries are normal. AI notes nuance, never flags contradictions as errors.
- [ ] Sensitive content (mental health, trauma, neurodivergence, shame) treated with care. AI adapts tone, never uses judgmentally.
- [ ] Three input paths + Bulk Add: Write It Myself, Upload Assessment, Discover with LiLa (`self_discovery` guided mode), Bulk Add.
- [ ] `self_discovery` guided mode registered in LiLa guided mode registry. Personality type unpacking uses LiLa's built-in framework knowledge. Graceful fallback for unknown frameworks.
- [ ] Selective loading: InnerWorkings loaded into LiLa context only when personality awareness would improve the response (not always-on like Guiding Stars).
- [ ] Teen privacy inverted from Guiding Stars: private by default, mom opts IN to visibility (teen notified). Per-entry sharing still works independently.
- [ ] Archives aggregation: InnerWorkings entries surface on Archive person cards as live references. "Checked somewhere, checked everywhere" — sharing state is single-source-of-truth on `self_knowledge` table.
- [ ] `source` field is freeform (specific labels like "Enneagram Type 1", "Carol Tuttle 3/2", "therapist"). `source_type` enum tracks HOW entry was created.
- [ ] Upload flow: AI extracts insights, user reviews before saving, original file stored. All entries from one upload linked via `source_reference_id`.
- [ ] Mom's observations about family members go in Archives, not InnerWorkings. InnerWorkings is always self-authored.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `self_knowledge`
Tables superseded: `member_self_insights` (from PRD-05)
Enums updated: context source types (add `self_knowledge`), guided mode keys (add `self_discovery`)
Triggers added: `set_updated_at` on `self_knowledge`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Feature renamed:** "My Foundation" → **InnerWorkings** (not user-nameable) | "InnerWorkings" is immediately intuitive, fits the OneWord brand naming convention (GuidingStars, LifeLantern), and works across all ages. Was already on the suggested preset list. Removing user-nameability simplifies UI and ensures consistent feature identity. |
| 2 | **"You, Inc." category removed** for all members. Five categories: Personality Types, Traits & Tendencies, Strengths, Growth Areas, General. | Future growth direction is a business identity that functions like an additional family member with its own profile. Professional self-knowledge will live there, not in personal InnerWorkings. |
| 3 | **"Personality Assessments" renamed to "Personality Types."** Stores type identifiers (e.g., "ENFP", "Carol Tuttle 3/2"), not full assessment writeups. | Short type entries let LiLa use built-in framework knowledge to enrich context. More practical than storing full assessment text. |
| 4 | **`self_knowledge` table supersedes `member_self_insights`** from PRD-05. One table, not two. | Avoids two places storing "things a person knows about themselves." Carries forward the sharing model from the PRD-05 stub. |
| 5 | **Teen privacy inverted from Guiding Stars:** private by default, mom opts in to visibility (teen notified). | InnerWorkings is more sensitive than values/declarations — personality details, growth areas, mental health context. Defaulting to private respects that sensitivity. |
| 6 | **`self_discovery` guided mode registered** in LiLa guided mode registry. | Discovery conversation needs specific system prompt instructions, a distinct arc, and the guided mode infrastructure (opening messages, mode tags, context loading). |
| 7 | **LiLa uses built-in training knowledge** for personality frameworks. No need to pre-define framework details in the PRD. | Claude and the models LiLa uses are trained on extensive personality framework knowledge. Graceful fallback for unknown frameworks. |
| 8 | **Personality GPTs are post-MVP** (may not be built). | The `self_discovery` guided mode covers the core use case. Personality GPTs would be additional guided modes if ever added. |
| 9 | **Custom categories skipped for MVP.** Five default categories + "General" catch-all is sufficient. | Avoids UI complexity (category management, empty states, deletion). Architecture extensible — TEXT enum means adding categories later is a migration. |
| 10 | **Archives aggregation convention established:** "Checked somewhere, checked everywhere." | InnerWorkings entries surface in Archives as live references. Sharing state is single-source-of-truth on the source table. This convention applies to all context source features. |
| 11 | **InnerWorkings is always self-authored.** Mom's observations about family members go in Archives, not InnerWorkings. | Clean separation: InnerWorkings = what I know about myself. Archives = what others observe about me. Prevents confusion about entry ownership. |
| 12 | **Business identity as future family member** noted as growth direction. | This is why "You, Inc." was removed — professional self-knowledge will live in the business entity's own InnerWorkings. Not in any current PRD scope. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Guided shell InnerWorkings (simplified version for Guided children) | Future design sprint. Currently stubbed with nav item hidden or "Coming soon." |
| 2 | Personality GPTs (Enneagram Guide, MBTI Interpreter, Four Tendencies Coach, etc.) | Post-MVP. May not be built. `self_discovery` mode covers core use case. |
| 3 | Business identity as family member with own InnerWorkings | Future architecture decision. No PRD assigned. |
| 4 | Content extraction from Knowledge Base ("Inform InnerWorkings") | Knowledge Base / RAG PRD |
| 5 | Log/Journal routing to InnerWorkings | PRD-08 (Journal + Smart Notepad) |
| 6 | LiLa context learning auto-detection of self-knowledge content | PRD-05C context learning feature |
| 7 | Dashboard widget for InnerWorkings | Widgets PRD (PRD-10) |
| 8 | Safe Harbor personality-adapted coping suggestions | Safe Harbor PRD |
| 9 | Custom categories beyond the five defaults | Revisit if user feedback indicates need. Architecture supports it (TEXT enum). |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-05 (LiLa Core AI System) | `member_self_insights` superseded by `self_knowledge` | Update schema section; update context assembly references |
| PRD-05 Planning Decisions Addendum | New convention: "Checked somewhere, checked everywhere" | Add to context toggle infrastructure section |
| PRD-06 (Guiding Stars & Best Intentions) | Entries now surface in Archives under aggregation convention | No table changes needed; convention was already compatible. Note it explicitly. |
| Planning_Decisions.md | Feature renamed from "My Foundation" to "InnerWorkings"; no longer user-nameable | Update Feature Naming table |
| Feature Design Reference | Feature name mapping updated | Update display name, remove "User Can Rename? YES" |
| All future context source PRDs | Must follow "Checked somewhere, checked everywhere" convention | Include in PRD template guidance or audit checklist |

---

*End of PRD-07*
