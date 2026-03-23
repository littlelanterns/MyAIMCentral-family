# PRD-12B: Family Vision Quest

**Status:** Not Started
**Parent:** PRD-12 (LifeLantern — overview PRD, stub)
**Sibling:** PRD-12A (Personal LifeLantern — not yet drafted)
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System — guided mode registry, context assembly, voice input), PRD-06 (Guiding Stars & Best Intentions — family-level Guiding Stars stub wired here)
**Created:** March 9, 2026
**Last Updated:** March 9, 2026

---

## Overview

Family Vision Quest is the family-facing side of LifeLantern. It is a mom-initiated, collaborative activity that helps a family discover and articulate who they want to become together — not as a set of rules, but as a shared picture of the life they're building.

The output is a living family vision: a set of evolving topic sections (each with its own history) plus a synthesized Family Vision Statement that LiLa generates on demand from the current state of all sections. The Family Vision Statement becomes shared LiLa context across all family members, and the process of building it can generate family-level Guiding Stars.

The core experience is an **async survey flow**: mom launches the Quest, assigns questions to family members, they answer on their own devices at their own pace (with optional LiLa guidance), and mom sees all answers aggregated in her portal. A **live facilitated mode** — where the family gathers, audio is recorded, and LiLa guides the discussion — is designed into the architecture as a future mode (stub in this PRD).

> **Mom experience goal:** Mom should feel like she's been handed a thoughtful family therapist's facilitation kit — one that does the heavy lifting of gathering everyone's input, synthesizing it, and turning it into something beautiful she can actually use. The Quest shouldn't feel like homework. It should feel like an invitation.

> **Depends on:** PRD-06 (Guiding Stars & Best Intentions) — `owner_type = 'family'` on the `guiding_stars` table. Family-level Guiding Stars creation is stubbed in PRD-06 and fully defined here.

> **Depends on:** PRD-05 (LiLa Core) — Guided mode registry, context assembly pipeline, voice input infrastructure.

---

## User Stories

### Launching & Managing the Quest
- As a mom, I want to launch a Family Vision Quest so my family can build a shared vision together.
- As a mom, I want to choose which family members participate in each section so I can include the right voices without overwhelming younger kids.
- As a mom, I want to send notifications to family members so they know the Quest is open and what to do.
- As a mom, I want to capture answers for my youngest children myself so their voices are still represented even if they can't use the app.
- As a mom, I want to see all family members' answers in one place — grouped by section — so I can understand what matters to each person.
- As a mom, I want to track progress on who has answered which sections so I know when we're ready to discuss.

### Answering & Contributing
- As a dad or teen, I want to answer vision questions on my own device, in my own time, without being put on the spot.
- As a family member, I want help from LiLa if I'm not sure how to answer a section so I don't skip it.
- As a family member, I want to see what section I'm answering and why it matters so the questions feel meaningful, not random.

### The Family Discussion
- As a mom, I want to open a facilitated discussion for any section where LiLa reads back the compiled answers and the family can respond so we have a real conversation, not just a survey.
- As a mom, I want to record that family discussion (audio, transcribed in real time) so we don't lose what was said.
- As a mom, I want to see the transcript of the discussion after it ends so I can review and edit before it becomes part of the vision.

### Building the Vision
- As a mom, I want each section of our family vision to evolve over time so we can update individual areas without starting over.
- As a mom, I want LiLa to generate a synthesized Family Vision Statement from our current section content on demand so I have a cohesive picture of who we are.
- As a mom, I want to suggest or generate family-level Guiding Stars from our vision content so the vision connects to our daily life.
- As a mom, I want the Family Vision to be visible to family members I choose so it can inspire our whole household.

---

## The 11 Vision Sections

The 11 sections below are the default starting framework. They are behind-the-scenes prompting guides — the UI shows the section title and tailored prompts, not a rigid form. LiLa uses these as scaffolding for generating questions and facilitating discussion.

> **Decision rationale:** 11 sections as a starting scaffold, not a rigid structure. LiLa uses them as prompting guides while the UI keeps things warm and human. Mom can add custom sections post-MVP.

| # | Section Name | What It Captures | Core Question |
|---|-------------|-----------------|---------------|
| 1 | How Our Home Feels | Physical and emotional atmosphere — calm, joyful, cozy, safe, orderly | *When you walk into our home, how do you want it to feel?* |
| 2 | How We Treat Each Other | Tone, speech, conflict resolution, kindness — what belongs here | *How do we want to speak to and treat each other?* |
| 3 | Family Standards & Responsibilities | Self-government, belonging, effort, honesty, follow-through — visionary, not procedural | *What does being part of this family mean?* |
| 4 | Learning & Growing | Education, curiosity, character — TJEd and capability-focused | *What does learning look like in our family?* |
| 5 | Use, Talents & Helping Others | Stewardship, service, gifts, gratitude — developing and giving | *How do we want to use what we've been given?* |
| 6 | Faith & Spiritual Life | Prayer, scripture, trust, peace, spiritual practices — broad and felt | *What does faith look like in our home?* |
| 7 | Sabbath & Sacred Time | Rest, connection, worship, what doesn't belong — felt before rules | *What do we want our Sabbath to feel like?* |
| 8 | Fun, Play & Recreation | Games, adventures, humor, traditions — joy as a value, not a reward | *How do we have fun together?* |
| 9 | Entertainment & Media | What fits, how it should make us feel, boundaries — kids have opinions here | *What kind of entertainment fits our family?* |
| 10 | Traditions & Family Culture | Identity, memory-making, continuity, what people will remember | *What traditions do we love and want to create?* |
| 11 | Work, Business & Creating | Contribution, stewardship, supporting each other's work, creating together | *What does working hard look like in our family?* |

> **Forward note:** Custom sections are a natural extension — mom may want to add sections specific to her family (homeschool rhythms, extended family relationships, financial philosophy, etc.). Post-MVP addition once the core 11 are validated.

---

## Screens

### Screen 1: Family Vision Quest Hub (Mom's Portal)

**What the user sees:**
- Page title: "Family Vision Quest"
- Tagline (muted): "Discover who your family is becoming — together."
- If no Quest has been started: warm empty state with illustration, "Start Your Family's Vision" button, and brief description of what the Quest is and why it matters
- If a Quest is in progress: progress overview card showing:
  - Which sections are open
  - How many members have answered each section
  - Visual completion indicators per section (e.g., "4 of 5 members answered")
  - "Continue Quest" primary action
- If a Quest is complete: "Your Family Vision" summary section (see Screen 6) with a "Revisit or Update" button
- Secondary navigation tabs: **Our Vision** (current state) | **Quest Progress** (active session) | **History** (past versions)

**Interactions:**
- Tap "Start Your Family's Vision" → Screen 2 (Quest Setup)
- Tap "Continue Quest" → Screen 3 (Section View)
- Tap any section card → Screen 3 for that section
- Tap "Our Vision" tab → Screen 6
- Tap "History" tab → version history of past Family Vision Statements

---

### Screen 2: Quest Setup

**What the user sees:**
- "Let's Set Up Your Family Vision Quest" heading
- Brief framing text: "We'll work through 11 areas of family life together. You can involve as many family members as you'd like — and do it at your own pace."
- Section list: all 11 sections shown with toggle to include/exclude each
- For each included section: a "Who answers this?" member picker (multi-select from family members)
  - Age-appropriate defaults: Independent/Adult members auto-selected; Guided members shown with "Mom captures" indicator; Play members shown with "Mom captures" indicator
  - Mom is always included and always answers
- Notification settings: "Notify family members when their sections are ready?" toggle, with message preview
- "Launch Quest" button

> **Decision rationale:** Mom controls which sections to include and who participates per section. Some families may skip sections (e.g., no "Work & Business" section for a family where that doesn't apply yet). This respects the "visionary, not procedural" principle — the Quest should be exactly what the family needs, not a mandatory checklist.

**Interactions:**
- Toggle sections on/off
- Select/deselect members per section
- Tap "Launch Quest" → creates `family_vision_quest` record, creates `vision_section_responses` records for all assigned members, sends notifications to assigned members, navigates to Screen 3

---

### Screen 3: Section View (Mom's Aggregated View)

**What the user sees:**
- Section title (e.g., "How Our Home Feels")
- Section framing: a short, warm sentence explaining what this section is about and why it matters (pulled from the section scaffolding, not user-visible as a "prompt guide")
- Response cards, one per assigned family member, showing:
  - Member name and avatar
  - Their response (text or voice transcript)
  - If not yet answered: "Waiting for [Name]'s answer" placeholder
  - If mom captured for a child: response shown with a small "Recorded by Mom" tag
- "Add My Answer" card for mom if she hasn't answered yet
- "Open Discussion" button (activates Screen 4 — the facilitated discussion for this section)
- "View Section Vision" button (shows the current synthesized content for this section)
- Navigation arrows to next/previous sections

**Two view modes (toggle at top):**
- **By Section** (default): showing all members' answers for the current section
- **By Person**: showing all of one person's answers across all sections

**Interactions:**
- Tap a member's response card → expand/read full response
- Tap "Add My Answer" → Screen 3A (Mom's answer input)
- Tap "Open Discussion" → Screen 4
- Tap "View Section Vision" → Screen 5 (Section Vision Editor)
- Toggle view mode

---

### Screen 3A: Answer Input (For Mom & All Contributing Members)

This screen appears when any assigned member taps into their section to answer. The experience adapts by role.

**For Independent members and Adults:**
- Section title and warm framing sentence
- The section's core question displayed prominently
- 2–3 supporting prompts shown below (e.g., for "How Our Home Feels": "What words describe the atmosphere? What helps you feel calm, safe, or energized here?")
- Large text input field (voice input available — transcribed in real time via Whisper)
- "Get Help from LiLa" button → opens lightweight guided prompt (see AI Integration)
- "Save Answer" button

**For Guided members (elementary-age):**
- Simplified prompts, larger text, warmer framing
- Voice input prominent
- "Get Help from LiLa" available with age-appropriate guidance
- Mom sees a banner: "This section has been sent to [Name]. You can also capture their answer yourself."

**For Play members (youngest):**
- Mom always captures — this interface is only accessible to mom when capturing for a Play child
- Prompt displayed to mom: "What would [Name] say? You can speak for them or record their voice."
- Voice input prominent
- Response saved with `captured_by_mom = true`

> **Decision rationale:** Play and very young Guided members cannot complete a survey independently, but their voices still belong in the family vision. Mom capturing for them (attributed to the child with a flag) preserves their representation while being honest about how it was gathered.

---

### Screen 4: Section Discussion (Facilitated Mode)

**What the user sees:**
- Section title and a "Discussion Mode" indicator
- LiLa's compiled summary of all member answers for this section — a synthesized paragraph that captures the themes without quoting individuals directly (preserves the collaborative feel)
- Below the summary: individual answers collapsible if mom wants to see the raw responses
- A prompt from LiLa: "Here's what your family shared about [section]. Is there anything to add, clarify, or explore further?"
- **Audio recording controls**: large microphone button, recording indicator, real-time transcript panel that updates as people speak
- Transcript shown in rolling chunks (not waiting for full recording to end — addresses Whisper timeout issue on long recordings)
- "End Discussion" button → saves transcript, marks discussion complete for this section
- After ending: option to review and edit transcript before saving

> **Decision rationale:** Real-time chunked transcription (rather than waiting for end of recording) prevents the Whisper timeout failure mode Tenise identified from personal experience with long voice recordings. Chunks are assembled into a full transcript on the backend.

> **Forward note:** The live facilitated mode (full family together, LiLa as active moderator, question-by-question pacing) is designed as a future mode. This discussion screen is the MVP bridge — mom can open it during a family gathering and LiLa provides the compiled summary as a starting point. The full live mode would add real-time question prompting, turn-taking management, and a more guided flow.

**Interactions:**
- Tap microphone → start recording, transcript begins updating in real time
- Tap microphone again → pause/stop recording
- Tap "End Discussion" → save transcript, navigate back to Screen 3
- Edit transcript inline before saving

---

### Screen 5: Section Vision Editor

**What the user sees:**
- Section title
- Current section vision content (editable text area)
- "Regenerate with LiLa" button — LiLa synthesizes all member answers + discussion transcript for this section into a new vision statement for the section
- Edit history: collapsible list of prior versions of this section's content, each timestamped and optionally named
- "This is good" confirmation button — marks this section as current and finalized (for purposes of overview generation)
- Small context note: "This section's content feeds into your Family Vision Statement."

**Interactions:**
- Edit text directly (inline)
- Tap "Regenerate with LiLa" → AI generates new section content, shown as a suggestion that replaces or appends
- Tap a history entry → view past version, option to restore
- Tap "This is good" → section marked current

---

### Screen 6: Family Vision Statement

**What the user sees:**
- "Our Family Vision" heading
- Current Family Vision Statement — a cohesive narrative generated by LiLa from all current section content
- "Last generated: [date]" indicator
- "Regenerate Vision" button — LiLa synthesizes all current section vision content into a fresh overview
- Edit button — mom can edit the generated statement directly
- Version history: past Family Vision Statements, each timestamped, optionally named (e.g., "Spring 2026", "After We Moved")
- "Generate Family Guiding Stars" button → Screen 7
- Visibility control: "Share this vision with family members" toggle + member picker

> **Decision rationale:** The Family Vision Statement is always generated fresh from the current section content — it is not stored as a primary record but as a snapshot. The source of truth is the section-level content. This means mom can update a single section and regenerate the overview without losing prior versions.

**Interactions:**
- Tap "Regenerate Vision" → LiLa generates new statement, shown as a preview before replacing current
- Tap "Edit" → inline editing of the current statement
- Tap a history version → view past statement, option to restore or name
- Tap "Generate Family Guiding Stars" → Screen 7
- Toggle visibility → choose which members can see the vision

---

### Screen 7: Family Guiding Stars Generation

**What the user sees:**
- "Create Family Guiding Stars" heading
- Brief explanation: "Guiding Stars are the values, declarations, and principles your family chooses to live by. Your vision contains seeds of these — let's find them."
- LiLa-generated suggested Guiding Stars cards, drawn from the Family Vision content
  - Each card shows: suggested declaration or value text, which vision section it came from, an accept/edit/dismiss action
- "Write your own" button → inline add form for mom to write a custom family Guiding Star
- "Add Selected to Family Guiding Stars" button → saves accepted cards as `guiding_stars` records with `owner_type = 'family'`

> **Depends on:** PRD-06 (Guiding Stars & Best Intentions) — `guiding_stars` table with `owner_type = 'family'`, `source = 'lifelantern'`.

**Interactions:**
- Accept a suggestion → card marked for saving
- Edit a suggestion → inline edit before saving
- Dismiss a suggestion → removed from list
- Tap "Write your own" → inline add
- Tap "Add Selected" → batch creates `guiding_stars` records, navigates back to Screen 6

---

## AI Integration

> **Depends on:** PRD-05 (LiLa Core) — Guided mode registry, context assembly pipeline.

### Guided Mode: `family_vision_quest`

Registered in LiLa guided mode registry with:

| Field | Value |
|-------|-------|
| `mode_key` | `family_vision_quest` |
| `display_name` | Family Vision Quest |
| `model_tier` | `sonnet` |
| `context_sources` | `['family_members', 'guiding_stars', 'self_knowledge']` |
| `person_selector` | false (family-scoped, not person-scoped) |
| `available_to_roles` | `['mom']` |
| `requires_feature_key` | `family_vision_quest` |

**Opening messages (2 rotating variants):**
1. "Let's build something beautiful together. I'll help you gather your family's voices, find the themes, and shape them into a vision that actually means something to your household. Where would you like to start?"
2. "Your family has a vision — sometimes it just takes some listening to find it. I'm here to help you gather it, shape it, and make it real. Ready?"

### LiLa's Roles in This Feature

**1. Section Facilitation (per-section guided prompt)**
When a family member taps "Get Help from LiLa" on their answer input screen, LiLa enters a lightweight guided prompt mode — not a full conversation, but 2–4 follow-up questions to help them articulate what they actually want for this section. The questions are section-specific (e.g., for "How We Treat Each Other": "Think about a moment when someone in your family made you feel really seen. What did they do?"). After 2–4 exchanges, LiLa summarizes what she heard and offers it as a draft answer.

> **Decision rationale:** A lightweight guided prompt (not a full conversation) for section help keeps the experience light and focused. Full conversation mode would be overwhelming for a single survey question. The goal is to help someone articulate what they already know, not explore deeply.

**2. Answer Compilation (Section Discussion)**
Before opening a section discussion, LiLa synthesizes all member answers for that section into a warm, theme-based summary paragraph. It does not quote individuals. It identifies what the family seems to collectively care about and names it. This becomes the discussion starting point.

**3. Section Vision Generation**
When mom taps "Regenerate with LiLa" on a section, LiLa reads all member answers + any discussion transcript for that section and produces a vision statement for that section — 2–4 sentences that capture the family's collective aspiration for that area of life. Warm, first-person plural ("In our family, we..."), forward-looking, not prescriptive.

**4. Family Vision Statement Generation**
When mom taps "Regenerate Vision" on Screen 6, LiLa reads all current section vision content and generates a cohesive Family Vision Statement. This is a narrative that weaves the sections into a unified picture — typically 3–5 paragraphs. It should feel like something the family could read aloud together.

**System prompt rules for vision generation:**
- Always use "we" and "our family" language — never "you should" or "your family will"
- Forward-looking and aspirational, but grounded — not generic inspiration-poster language
- Honor specificity from the section content — if family members mentioned specific things (faith, homeschool, business), those appear
- Do not include rules, chores, or procedural content — this is vision, not policy
- Tone: warm, unhurried, meaningful

**5. Family Guiding Stars Suggestion**
After a Family Vision Statement is generated, LiLa can analyze the vision content and suggest family-level Guiding Stars — values, declarations, or principles that surface naturally from what the family articulated. Each suggestion is drawn from specific section content so mom can see where it came from.

### Voice Input & Transcription

All text input fields in Family Vision Quest support voice input. Transcription uses OpenAI Whisper.

For the Section Discussion (Screen 4), transcription runs in real-time chunked mode:
- Audio is sent to Whisper in rolling chunks as recording continues (not waiting for recording to end)
- Each chunk's transcript appends to the rolling transcript display
- Final transcript is assembled from all chunks on session end
- Mom can edit the full assembled transcript before saving

> **Decision rationale:** Real-time chunked transcription directly addresses the Whisper timeout failure mode on long family discussions. Sending the full audio at the end causes failures; sending chunks maintains a live transcript and prevents data loss.

> **Forward note:** Voice input (Whisper API) has per-call cost implications. The tier gating strategy for voice features will be determined at launch configuration time. Architecture should not foreclose cost-based gating on any voice feature.

---

## Data Schema

### Table: `family_vision_quests`

Tracks active and completed Quest sessions.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| created_by | UUID | | NOT NULL | FK → family_members (always mom) |
| status | TEXT | 'in_progress' | NOT NULL | Enum: 'in_progress', 'complete', 'archived' |
| sections_included | TEXT[] | | NOT NULL | Array of section keys included in this Quest |
| launched_at | TIMESTAMPTZ | now() | NOT NULL | |
| completed_at | TIMESTAMPTZ | | NULL | Set when mom marks Quest complete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | |

---

### Table: `vision_sections`

The evolving per-section content for a family's vision. One row per section per family — this is the living source of truth, not per-Quest.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| section_key | TEXT | | NOT NULL | Enum: 'home_feels', 'treat_each_other', 'standards_responsibilities', 'learning_growing', 'use_talents_helping', 'faith_spiritual', 'sabbath_sacred', 'fun_play_recreation', 'entertainment_media', 'traditions_culture', 'work_business_creating' |
| current_content | TEXT | | NULL | The current active vision content for this section |
| last_generated_at | TIMESTAMPTZ | | NULL | When LiLa last generated content for this section |
| last_edited_at | TIMESTAMPTZ | | NULL | When mom last manually edited |
| is_current | BOOLEAN | true | NOT NULL | False if section has been archived/replaced |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | |

**Unique constraint:** `(family_id, section_key)` — one active section record per family per section key.

---

### Table: `vision_section_history`

Append-only version history for each section.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| vision_section_id | UUID | | NOT NULL | FK → vision_sections |
| family_id | UUID | | NOT NULL | FK → families (for RLS) |
| content | TEXT | | NOT NULL | The content at this point in time |
| version_name | TEXT | | NULL | Optional user-given name ("After Family Meeting") |
| saved_at | TIMESTAMPTZ | now() | NOT NULL | |
| saved_by | UUID | | NOT NULL | FK → family_members |

---

### Table: `vision_section_responses`

Individual member answers to section questions within a Quest session.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| quest_id | UUID | | NOT NULL | FK → family_vision_quests |
| family_id | UUID | | NOT NULL | FK → families (for RLS) |
| section_key | TEXT | | NOT NULL | Which section this response is for |
| responding_member_id | UUID | | NOT NULL | FK → family_members (the person whose answer this is) |
| captured_by_member_id | UUID | | NULL | FK → family_members. NULL if self-answered. Set to mom's ID if mom captured for a child. |
| captured_by_mom | BOOLEAN | false | NOT NULL | True when mom answered on behalf of a child |
| response_text | TEXT | | NULL | Written or transcribed response |
| voice_recording_url | TEXT | | NULL | Supabase Storage URL if voice recording saved |
| lila_assisted | BOOLEAN | false | NOT NULL | True if member used "Get Help from LiLa" |
| answered_at | TIMESTAMPTZ | | NULL | NULL if not yet answered |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

---

### Table: `vision_section_discussions`

Recorded family discussions per section.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| quest_id | UUID | | NOT NULL | FK → family_vision_quests |
| family_id | UUID | | NOT NULL | FK → families (for RLS) |
| section_key | TEXT | | NOT NULL | Which section this discussion covers |
| lila_summary | TEXT | | NULL | LiLa's compiled summary of member answers that opened the discussion |
| audio_recording_url | TEXT | | NULL | Supabase Storage URL for raw audio |
| transcript | TEXT | | NULL | Full assembled transcript (may have been edited by mom) |
| transcript_chunks | JSONB | | NULL | Array of chunk objects: [{chunk_index, text, timestamp}] — raw Whisper output before assembly |
| recorded_at | TIMESTAMPTZ | | NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | |

---

### Table: `family_vision_statements`

Generated Family Vision Statement snapshots. Append-only — old versions are never deleted.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| is_active | BOOLEAN | false | NOT NULL | True for the current active statement. Only one active per family. |
| statement_text | TEXT | | NOT NULL | The full Family Vision Statement |
| version_name | TEXT | | NULL | Optional name ("Spring 2026", "After We Moved") |
| generated_by | TEXT | 'lila' | NOT NULL | Enum: 'lila', 'manual' |
| section_snapshot | JSONB | | NULL | Snapshot of section content at time of generation (for historical accuracy) |
| generated_at | TIMESTAMPTZ | now() | NOT NULL | |
| created_by | UUID | | NOT NULL | FK → family_members (always mom) |

**Trigger:** When a new `family_vision_statements` record is inserted with `is_active = true`, set all other records for the same `family_id` to `is_active = false`.

---

## Visibility & Permissions

> **Depends on:** PRD-02 (Permissions & Access Control) — mom-sees-all model, per-member permission scoping.

| Role | Access |
|------|--------|
| **Mom** | Full access to all Quest screens, all member responses, all section content, all discussion transcripts, all vision statements. Launches and manages all Quests. |
| **Dad / Additional Adult** | Assigned sections visible and answerable. Cannot see other members' answers (mom controls this visibility — future permission toggle). Cannot access Quest Hub or aggregated views. |
| **Independent Teen** | Same as Dad — assigned sections visible and answerable. LiLa help available. Cannot see aggregated view. |
| **Guided Member** | May receive simplified section prompt on their device if mom chooses to send it. Cannot access Quest Hub. Mom may capture for them. |
| **Play Member** | Mom always captures. No direct Quest interaction. |
| **Special Adult** | Not included in Family Vision Quest by default. Mom may optionally assign sections to a Special Adult if she chooses. |

**Family Vision Statement visibility:**
Mom chooses which members can see the active Family Vision Statement via the visibility control on Screen 6. Default: visible to all adults in the household, not visible to children unless mom enables.

> **Decision rationale:** Member responses are not cross-visible to other members by default. The aggregate view (all answers per section) lives only in mom's portal. This prevents the dynamic where family members feel judged or compared — each person answers independently, and mom holds the synthesis.

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| PRD-01 (Family Members) | `family_members` records determine who can be assigned to sections and who receives notifications |
| PRD-05 (LiLa) | LiLa guided mode registry hosts `family_vision_quest` mode. Whisper API handles voice transcription. |
| PRD-06 (Guiding Stars) | `guiding_stars` table accepts `owner_type = 'family'` records created from Screen 7 of this feature |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| PRD-06 (Guiding Stars) | Family Guiding Stars created here with `owner_type = 'family'`, `source = 'lifelantern'`, `source_reference_id` → `family_vision_statements.id` |
| PRD-05 (LiLa context) | Active Family Vision Statement loaded as shared family context for all members with visibility access. `is_included_in_ai` toggle available. |
| PRD-11B (Family Celebration) | Family Vision Quest is a stub source for Family Celebration's special filter mode — victories can be connected to Family Vision goals (wired when PRD-11B stub is resolved) |
| PRD-11 (Victory Recorder) | LifeLantern special filter mode in Victory Recorder reads Family Vision content (stubbed in PRD-11, wired here) |

---

## Edge Cases

**Quest abandoned mid-completion:** All responses already submitted are saved. Quest can be resumed. No expiry on open Quests — mom decides when to close or archive.

**Family member doesn't answer:** Quest can be completed without every assigned member responding. Mom sees unanswered sections flagged. She can capture their answer herself or proceed without it.

**Mom updates a section after a new Quest:** Each Quest session adds new responses. The section vision content is separate from responses — mom controls when to regenerate section content. Old responses are preserved in `vision_section_responses` tied to their Quest ID.

**Multiple active Quests:** Only one Quest can be `in_progress` at a time per family. Mom must complete or archive the current Quest before launching a new one.

**Regenerating vision when sections are incomplete:** LiLa generates the Family Vision Statement from whatever section content currently exists. Sections with no content are omitted. LiLa notes which sections weren't included in the generation.

**Long discussions:** Chunked transcription handles recordings of any length. If a chunk fails to transcribe, the gap is marked in the transcript with "[transcription gap]" so mom knows to fill it manually.

---

## Tier Gating

> **Decision rationale:** Tier assignments are deferred to launch configuration. All features are built with `useCanAccess()` hooks wired from day one so tier gates can be configured without refactoring. The architecture below reflects the intended tier shape without locking it in.

| Feature Key | Description | Intended Tier (TBD) |
|-------------|-------------|---------------------|
| `family_vision_quest` | Core Quest — async survey, aggregation, section vision, Family Vision Statement | TBD |
| `family_vision_discussion` | Section Discussion with audio recording and transcription (Whisper API cost) | TBD — likely higher tier due to API cost |
| `family_vision_guiding_stars` | Generate Family Guiding Stars from vision content | TBD |
| `family_vision_live_mode` | Live facilitated mode (future stub) | TBD — likely highest tier |

All feature keys return `true` during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD / Phase |
|------|----------|--------------------|
| Live facilitated mode (full family gather, LiLa as active moderator, real-time question pacing) | Family Vision Quest Live Mode | Post-MVP — stub in `family_vision_quests.mode` column (`'async'` \| `'live'`) |
| Family Vision → Victory Recorder special filter | PRD-11 stub resolution | Already stubbed in PRD-11; wired by this PRD via `family_vision_statements` table reference |
| Family Vision → Family Celebration special filter | PRD-11B stub resolution | PRD-11B |
| Custom sections (mom-added section topics beyond the 11 defaults) | Custom section management | Post-MVP |
| Family Mission Statement (distinct from vision — "why we exist" vs "who we're becoming") | Post-MVP | Separate design sprint |
| Section-level sharing controls (which sections which members can see) | Settings PRD | Post-MVP |

### Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Family-level Guiding Stars creation flow | PRD-06 | Fully defined in Screen 7 and AI Integration. `guiding_stars` inserts with `owner_type = 'family'`, `source = 'lifelantern'`. |
| LifeLantern special filter in Victory Recorder | PRD-11 | `family_vision_statements` table confirmed as the context source. Filter reads active statement. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] All tables created with RLS policies: `family_vision_quests`, `vision_sections`, `vision_section_history`, `vision_section_responses`, `vision_section_discussions`, `family_vision_statements`
- [ ] Quest Hub (Screen 1): empty state, in-progress state, complete state
- [ ] Quest Setup (Screen 2): section toggle, member assignment per section, launch
- [ ] Section View (Screen 3): aggregated response cards, by-section and by-person toggle, waiting state for unanswered members
- [ ] Answer Input (Screen 3A): text input + voice input, supporting prompts, role-adaptive (Independent/Adult/Guided/Play)
- [ ] "Get Help from LiLa" lightweight guided prompt functional for all sections
- [ ] Mom capture for younger children with `captured_by_mom = true` flag and UI indicator
- [ ] Section Vision Editor (Screen 5): editable content, LiLa regeneration, version history
- [ ] Family Vision Statement (Screen 6): generation, editing, version history, visibility controls
- [ ] Family Guiding Stars Generation (Screen 7): LiLa suggestions, accept/edit/dismiss, bulk save to `guiding_stars`
- [ ] Family Vision Statement loaded as shared LiLa context (with `is_included_in_ai` toggle)
- [ ] `guiding_stars` inserts from this feature with `owner_type = 'family'` and `source = 'lifelantern'`

### MVP When Dependency Is Ready
- [ ] Section Discussion (Screen 4) with LiLa compiled summary (requires Whisper integration)
- [ ] Audio recording + chunked real-time transcription (requires Whisper edge function)
- [ ] Victory Recorder LifeLantern filter reads Family Vision content (requires PRD-11 build)
- [ ] Family Celebration LifeLantern filter (requires PRD-11B build)

### Post-MVP
- [ ] Live facilitated mode
- [ ] Custom sections
- [ ] Family Mission Statement
- [ ] Section-level visibility controls per member
- [ ] Quest notification system (push/email to family members)
- [ ] Quest completion triggers (auto-suggest generating vision when all members answered)

---

## CLAUDE.md Additions from This PRD

- [ ] `family_vision_quest` guided mode registered in `lila_guided_modes`. Mode key, display name, model tier, context sources defined in PRD-12B AI Integration section.
- [ ] `vision_sections` table: one row per section key per family. `section_key` is a TEXT enum — do not rename keys once created (referenced by multiple tables). `current_content` is the live source of truth; history lives in `vision_section_history`.
- [ ] `family_vision_statements` table: append-only. `is_active` trigger automatically deactivates prior statements when new active one is inserted. Never delete rows.
- [ ] Voice transcription for Section Discussions uses chunked Whisper mode — audio sent in rolling chunks, assembled on session end. Raw chunks stored in `transcript_chunks` JSONB. Never wait for full recording to end before beginning transcription.
- [ ] `captured_by_mom = true` flag on `vision_section_responses`: displayed in UI with "Recorded by Mom" indicator. These are attributed to the child member, not mom.
- [ ] Family Vision Statement is LiLa context: loaded as shared family context when `is_included_in_ai = true`. Available to all family members with visibility access (per `family_vision_statements` visibility setting). Not just mom.
- [ ] Convention: section_key values are stable identifiers — never rename: `home_feels`, `treat_each_other`, `standards_responsibilities`, `learning_growing`, `use_talents_helping`, `faith_spiritual`, `sabbath_sacred`, `fun_play_recreation`, `entertainment_media`, `traditions_culture`, `work_business_creating`.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `family_vision_quests`, `vision_sections`, `vision_section_history`, `vision_section_responses`, `vision_section_discussions`, `family_vision_statements`
Enums updated: `section_key` TEXT CHECK values (11 default values)
Triggers added: `set_active_family_vision_statement` — when new `family_vision_statements` row inserted with `is_active = true`, deactivate all prior rows for same `family_id`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Feature name: Family Vision Quest** | Working name from planning phase retained. Clear, energetic, describes what it is. |
| 2 | **PRD-12 is a parent stub; PRD-12A (Personal LifeLantern) and PRD-12B (Family Vision Quest) are the substantive PRDs** | Family Vision Quest has more defined requirements now; Personal LifeLantern has additional framework inputs still being assembled. Splitting allows 12B to be drafted first. |
| 3 | **11 sections are a behind-the-scenes prompting scaffold, not a rigid UI structure** | Sections power LiLa's question generation and synthesis but the UI presents them warmly, not as a form to fill out. Preserves the "discovering who we are" tone. |
| 4 | **Async survey flow is MVP; live facilitated mode is a stub** | Async is the more broadly useful mode and lower infrastructure complexity. Live mode architecture is considered in the data model (mode column, chunked transcription) but not built at MVP. |
| 5 | **Real-time chunked Whisper transcription for Section Discussions** | Waiting until end of recording causes Whisper API timeouts on long family discussions. Chunked transcription solves this and provides a better live experience. |
| 6 | **Section content and Family Vision Statement are separate layers** | Section content (per-topic, evolving) is the source of truth. The Family Vision Statement is a generated snapshot from current section content. This allows incremental updates without full regeneration. |
| 7 | **Family Vision Statement is append-only with version history** | Families grow and change. Past visions are meaningful records, not mistakes. Never delete — archive with timestamp. |
| 8 | **Mom captures for Play/young Guided members with `captured_by_mom = true` flag** | Preserves children's representation in the family vision while being architecturally honest about how the data was gathered. |
| 9 | **Member responses are not cross-visible between members by default** | Aggregated view lives only in mom's portal. Prevents comparison/judgment dynamics during answering phase. |
| 10 | **LiLa help on answer input is a lightweight guided prompt, not a full conversation** | 2–4 focused questions to help articulate an answer is the right scope. Full conversation would be disproportionate to a single survey section. |
| 11 | **Family Guiding Stars suggested by LiLa from vision content, mom decides what to keep** | AI suggestion is a starting point; mom controls what becomes an official family value. Inline edit/dismiss/accept before saving. |
| 12 | **Tier gating deferred to launch configuration** | All feature keys built with `useCanAccess()` from day one. Voice/discussion features noted as likely higher tier due to API cost, but no locks set now. |
| 13 | **Family Mission Statement is post-MVP** | Vision (who we're becoming) is distinct from mission (why we exist). Mission requires separate design work and isn't needed for the core collaborative experience. |
| 14 | **Custom sections are post-MVP** | 11 defaults cover the full scope of family life for MVP. Custom section management adds UI complexity that isn't needed to validate the core feature. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Live facilitated mode (full family gather, LiLa as active moderator) | Post-MVP design sprint. Architecture ready — `mode` column on `family_vision_quests`, chunked transcription already in place. |
| 2 | Family Mission Statement (distinct from vision) | Separate post-MVP design sprint after Family Vision Quest is validated. |
| 3 | Custom sections beyond the 11 defaults | Post-MVP. Architecture extensible — `section_key` is TEXT, not a fixed enum at the DB level. |
| 4 | Section-level visibility controls (which sections which members can see) | Settings PRD. MVP default: Family Vision Statement visibility is all-or-nothing. |
| 5 | Tier gating assignments | Launch configuration. All `useCanAccess()` hooks built now, values set at launch. |
| 6 | Personal LifeLantern (PRD-12A) | Separate PRD session. Framework inputs still being assembled by Tenise. |
| 7 | Quest completion notifications (push/email to family members) | Notifications PRD or Settings PRD. MVP uses in-app indicators only. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-06 (Guiding Stars & Best Intentions) | Family-level Guiding Stars creation flow fully defined here. `source = 'lifelantern'` and `source_reference_id` → `family_vision_statements.id` specified. | Verify PRD-06 schema includes `source_reference_id` column with correct FK reference. No structural changes needed — this PRD wires the existing stub. |
| PRD-11 (Victory Recorder) | LifeLantern special filter confirmed to read from `family_vision_statements` (active record). | Update PRD-11 LifeLantern filter stub to reference `family_vision_statements` table as the context source. |
| PRD-11B (Family Celebration) | Family Vision Quest stub in PRD-11B wired here. Same source: `family_vision_statements` active record. | Update PRD-11B LifeLantern special filter stub to reference `family_vision_statements`. |
| PRD-05 (LiLa Core) | `family_vision_quest` guided mode registered. Family Vision Statement added as a shared family context source (loaded for all members with visibility access, not just mom). | Add `family_vision_quest` to guided mode registry table. Add Family Vision Statement to the context assembly documentation as a family-scoped context source. |

---

*End of PRD-12B*
