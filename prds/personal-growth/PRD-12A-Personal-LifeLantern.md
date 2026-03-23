# PRD-12A: Personal LifeLantern

**Status:** Not Started
**Sibling:** PRD-12B (Family Vision Quest — complete)

> **Note:** There is no standalone PRD-12 parent document. LifeLantern is fully specified by PRD-12A (Personal LifeLantern, this document) and PRD-12B (Family Vision Quest). The Build Order Source of Truth serves as the index connecting them. Both PRDs are self-contained with their own schemas, guided modes, and cross-PRD impacts.
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System — guided mode registry, context assembly, voice input), PRD-06 (Guiding Stars & Best Intentions — goal generation destinations), PRD-07 (InnerWorkings — assessment context source), PRD-09A (Tasks, Routines & Opportunities — goal generation destination), PRD-10 (Widgets, Trackers & Dashboard Layout — goal generation destination)
**Created:** March 10, 2026
**Last Updated:** March 10, 2026

---

## Overview

Personal LifeLantern is the personal growth side of LifeLantern — the companion to Family Vision Quest (PRD-12B). Where Family Vision Quest asks "who are we becoming together?", Personal LifeLantern asks "who am I becoming?" It is a deeply personal, LiLa-guided experience that helps a person honestly assess where they are across the major areas of life, envision who they want to become, and generate concrete goals to close the gap.

The feature has three interconnected components: **Life Assessment** (honest inventory of current reality, including history and patterns), **Vision Casting** (aspirational picture of who the person wants to become, enriched by role models and specific traits), and **Goal Generation** (LiLa analyzes the gap between assessment and vision and suggests actionable goals that flow into existing features). The output is a living Personal Vision Statement — a cohesive narrative synthesized from all per-area vision content — that becomes core LiLa context, grounding every future conversation in the person's direction and aspirations.

The entire experience is a buffet, not a checklist. Mom picks which life areas to explore, which components to engage with (assessment, vision, or goals), and how deep to go. LiLa guides warmly through open-ended conversation — no scales, no scores, no clinical tone. Everything LiLa generates is inline editable. Past assessments are preserved as timestamped snapshots — a record of growth, never deleted.

> **Mom experience goal:** LifeLantern should feel like sitting down with a wise, patient friend who helps you see your own life clearly — where you've been, where you are, and where you want to go. It should never feel like a performance review or a self-help worksheet. The experience should leave mom feeling more grounded and more hopeful, not more overwhelmed.

> **Depends on:** PRD-05 (LiLa Core) — Guided mode registry, context assembly pipeline, voice input infrastructure.

> **Depends on:** PRD-06 (Guiding Stars & Best Intentions) — Goal generation creates Guiding Stars (`source = 'lifelantern'`) and Best Intentions from vision work.

> **Depends on:** PRD-07 (InnerWorkings) — InnerWorkings entries (personality, traits, strengths) inform assessment conversations. LiLa loads InnerWorkings context during Life Assessment to personalize questions.

> **Depends on:** PRD-09A (Tasks) — Goal generation creates tasks from action steps.

> **Depends on:** PRD-10 (Widgets & Trackers) — Goal generation creates tracker widgets for measurable goals.

---

## User Stories

### Life Assessment
- As a mom, I want to honestly assess where I am in each area of my life so I have a clear starting point for growth.
- As a mom, I want LiLa to guide me through assessment with warm, open-ended questions — not scales or ratings — so it feels like a conversation, not a test.
- As a mom, I want to include relevant history and patterns in my assessment so LiLa understands not just where I am but how I got here.
- As a mom, I want to pick which life areas to assess rather than being forced through all of them, because some areas need attention now and others can wait.
- As a mom, I want to edit anything LiLa generates from our conversation so the assessment truly reflects my perspective.
- As a mom, I want past assessments preserved so I can look back and see how I've grown.

### Vision Casting
- As a mom, I want to articulate what I want each area of my life to look like so I have a clear picture of who I'm becoming.
- As a mom, I want to identify people — real or fictional — who embody what I want for each area, and pull out the specific traits I admire, so my vision is grounded in something concrete.
- As a mom, I want LiLa to weave my aspirations and role model traits into a rich picture of who I'm becoming, not just a list of goals.
- As a mom, I want a cohesive Personal Vision Statement that synthesizes all my per-area visions into one narrative so I can see the whole picture.
- As a mom, I want to share my Personal Vision Statement with my husband if I choose, so he can understand and support my direction.

### Goal Generation
- As a mom, I want LiLa to analyze the gap between my assessment and my vision and suggest concrete goals so I know what to do next.
- As a mom, I want to approve each suggested goal before it's created anywhere — LiLa suggests, I decide.
- As a mom, I want goals to flow into the right features — ongoing practices as Best Intentions, values as Guiding Stars, action steps as Tasks, measurable items as Trackers — so everything is connected.
- As a mom, I want to revisit goal generation after updating my assessment or vision, because my goals should evolve as I grow.

### Ongoing Engagement
- As a mom, I want to check in on any life area whenever I feel like it — not on a schedule, but when it matters to me.
- As a mom, I want LiLa to gently notice when an area hasn't been revisited in a while and mention it naturally in conversation, so I don't lose sight of areas that matter.
- As a mom, I want my Personal Vision Statement loaded as LiLa context so her advice is grounded in where I'm going, not just where I am.

---

## The 13 Life Areas

The 13 areas below are the default starting framework. They are scaffolding for LiLa's guided conversations — the UI shows the area name and tailored prompts, not a rigid form. Each area has two content dimensions: Assessment (where I am, including history) and Vision (where I want to be).

> **Decision rationale:** 13 default areas covering the full breadth of personal life. The list is comprehensive without being exhausting because the experience is a buffet — mom engages with what matters to her now. Custom areas are post-MVP but architecturally supported from day one (TEXT keys, not a fixed enum).

| # | Area Name | Section Key | What It Captures | Core Assessment Question | Core Vision Question |
|---|-----------|-------------|-----------------|-------------------------|---------------------|
| 1 | Spiritual / Faith | `spiritual_faith` | Relationship with God, spiritual practices, prayer life, peace, trust | *How would you describe your spiritual life right now — and what has it looked like over the years?* | *What would a rich, grounded spiritual life look like for you?* |
| 2 | Marriage / Partnership | `marriage_partnership` | Connection, communication, intimacy, shared vision, patterns | *How are things between you and your partner right now? What patterns do you notice?* | *What does the marriage you want to be in actually look like?* |
| 3 | Family / Parenting | `family_parenting` | Relationships with children, parenting approach, family dynamics | *How does your family life feel right now — the rhythms, the relationships, the hard parts?* | *What kind of parent do you want to be, and what does a thriving family look like for you?* |
| 4 | Physical Health | `physical_health` | Body, energy, exercise, nutrition, sleep, medical | *How are you feeling physically? What does your body need right now?* | *What would it look like to feel strong and well in your body?* |
| 5 | Emotional / Mental Health | `emotional_mental` | Inner state, stress, coping, therapy, emotional regulation | *How are you doing emotionally — really? What's weighing on you or lifting you up?* | *What does emotional wellbeing look like for you?* |
| 6 | Social / Friendships | `social_friendships` | Community, friendships, isolation, belonging, social energy | *How connected do you feel to people outside your family right now?* | *What kind of friendships and community do you want in your life?* |
| 7 | Career / Professional | `career_professional` | Work, calling, professional growth, work-life balance | *Where are you professionally right now, and how does it feel?* | *What does fulfilling, meaningful work look like for you?* |
| 8 | Financial | `financial` | Money, security, debt, planning, stewardship | *How do you feel about your financial situation? What patterns have shaped where you are?* | *What does financial peace and freedom look like for you?* |
| 9 | Personal Development / Learning | `personal_development` | Growth, curiosity, skills, reading, education | *What are you learning or growing in right now — or wishing you were?* | *What does being a lifelong learner look like for you?* |
| 10 | Service / Contribution | `service_contribution` | Giving, volunteering, impact, helping others, stewardship of gifts | *How are you giving or serving right now? Does it feel like enough, too much, or just right?* | *How do you want to use what you've been given to serve others?* |
| 11 | Legacy | `legacy` | Long-term impact, what you leave behind, generational influence | *When you think about what you're building that outlasts you, what comes to mind?* | *What do you want people to remember? What kind of legacy are you building?* |
| 12 | Home / Environment | `home_environment` | Physical space, order, beauty, sanctuary, the feeling of home | *How does your home feel right now — physically, emotionally, as a space to live in?* | *What kind of home do you want to create — what would it feel like to walk through your door?* |
| 13 | Fun / Recreation / Rest | `fun_recreation_rest` | Play, hobbies, rest, Sabbath, joy, things that recharge | *How are you doing with fun, rest, and the things that recharge you?* | *What does a life with enough play, rest, and joy look like?* |

> **Forward note:** Custom areas are a natural extension — mom may want to add areas specific to her life (creative projects, ministry, homeschool philosophy, business building, etc.). Architecture supports this from day one: `section_key` is TEXT, not a fixed enum at the DB level. Custom area management is post-MVP once the core 13 are validated.

### Supporting Prompts Per Area

Each area has 2-3 supporting prompts that LiLa uses to deepen the conversation beyond the core question. These are behind-the-scenes — LiLa weaves them naturally into the conversation rather than presenting them as a list.

**Assessment supporting prompts (used across all areas):**
- "What choices or patterns brought you to where you are now?"
- "What have you tried before that worked? What hasn't?"
- "If you're honest with yourself, what's the hardest part?"

**Vision supporting prompts (used across all areas):**
- "Think of someone — real or fictional — who embodies what you want here. What specific traits do you admire in them?"
- "If this area of your life was exactly how you wanted it, what would a typical day or week look like?"
- "What would it feel like to be the person you want to become in this area?"

> **Decision rationale:** Universal supporting prompts rather than per-area custom prompts for MVP. The core questions per area provide enough differentiation. LiLa's contextual awareness (knowing which area the conversation is about) handles the rest. Per-area custom supporting prompts can be refined post-launch based on real conversation patterns.

---

## Screens

### Screen 1: LifeLantern Hub

**What the user sees:**
- Page title: "LifeLantern"
- Tagline (muted): "Where you are. Where you're going."
- If first visit: warm welcome message from LiLa with brief explanation of the three components (Assessment, Vision, Goals) and an invitation to start wherever feels right. "Start Exploring" button.
- If areas have been explored: area cards showing all 13 default areas, each displaying:
  - Area name and a warm icon
  - Status indicator: "Not explored yet" / "Assessment started" / "Vision started" / "Assessment & Vision complete"
  - Last visited date (if explored)
  - A gentle staleness indicator if the area hasn't been revisited in a while (e.g., "Last visited: 4 months ago" with a soft "Check in?" link)
  - Tap to open the Area Detail screen
- "My Vision Statement" card at the top (if any vision content exists):
  - Shows a preview of the active Personal Vision Statement (first 2-3 lines)
  - "View Full Vision" link → Screen 5
  - If no vision statement generated yet: "Generate your vision when you're ready" prompt
- "Generate Goals" action button (visible when at least one area has both assessment and vision content)
- Sections can be reordered by drag (personal priority order, saved per user)

> **Mom experience goal:** The hub should feel like a thoughtful map of her life — warm, clear, and inviting. Not a dashboard to optimize, but a place to reflect and choose where to focus.

**Interactions:**
- Tap an area card → Screen 2 (Area Detail)
- Tap "My Vision Statement" card → Screen 5 (Personal Vision Statement)
- Tap "Generate Goals" → Screen 6 (Goal Generation)
- Tap "Start Exploring" (first visit) → LiLa opens to the life_lantern guided mode, offering to walk mom through her first area
- Long-press/drag area cards → reorder
- Tap "Check in?" on a stale area → opens Screen 2 for that area with LiLa pre-primed for a check-in conversation

**Data created/updated:**
- `life_lantern_area_order` (JSONB on member preferences or a lightweight storage) for custom area ordering

---

### Screen 2: Area Detail

**What the user sees:**
- Area name as page title (e.g., "Marriage / Partnership")
- Two content panels side by side on desktop, stacked on mobile:

**Assessment Panel ("Where I Am"):**
  - Current assessment content (editable text area)
  - If empty: warm prompt — "Ready to explore where you are in this area? LiLa can help." with "Start Assessment Conversation" button
  - If populated: full assessment text with inline edit capability
  - "Update with LiLa" button — opens a check-in conversation to refresh the assessment
  - "Edit Directly" toggle — switches to direct text editing mode
  - Snapshot history: collapsible list of prior assessment versions, each timestamped and optionally named

**Vision Panel ("Where I Want to Be"):**
  - Current vision content (editable text area)
  - If empty: warm prompt — "What does the life you want look like in this area?" with "Start Vision Conversation" button
  - If populated: full vision text with inline edit capability, including any role model traits woven in
  - "Update with LiLa" button — opens a vision casting conversation
  - "Edit Directly" toggle — switches to direct text editing mode
  - Role model summary (if any were discussed): small cards showing names and extracted traits, tappable to expand
  - Snapshot history: collapsible list of prior vision versions, each timestamped and optionally named

**Gap Summary (below both panels):**
  - If both assessment and vision exist: LiLa-generated gap summary — 2-3 sentences identifying the key differences between current reality and aspirational vision
  - "Generate Goals for This Area" button → Screen 6 filtered to this area
  - Gap summary is auto-generated when both panels have content, regenerated when either updates

**Navigation:**
- Back to Hub
- Left/right arrows to navigate to adjacent areas (based on hub order)

> **Decision rationale:** Two-panel layout (Assessment + Vision) with gap summary below provides the honest "mirror" experience — current reality and aspirational picture visible together, with the gap made explicit. This is the core LifeLantern experience.

**Interactions:**
- Tap "Start Assessment Conversation" → opens LiLa drawer in `life_lantern` guided mode, pre-loaded with this area's context, assessment focus
- Tap "Start Vision Conversation" → opens LiLa drawer in `life_lantern` guided mode, pre-loaded with this area's context, vision focus
- Tap "Update with LiLa" → same as above, but LiLa reads existing content first and frames it as a check-in
- Tap "Edit Directly" → inline text editing, changes saved on blur/exit
- Tap a snapshot → view past version, option to restore or name/rename
- Tap "Generate Goals for This Area" → Screen 6, filtered

**Data created/updated:**
- `life_lantern_areas.assessment_content` — current assessment text
- `life_lantern_areas.vision_content` — current vision text
- `life_lantern_areas.gap_summary` — LiLa-generated gap text
- `life_lantern_area_snapshots` — append-only history entries

---

### Screen 3: LiLa Assessment Conversation

This is not a separate page — it's the LiLa drawer (mom) or modal (other roles) opened in the `life_lantern` guided mode with assessment focus.

**What LiLa does:**
- Greets warmly and establishes which area the conversation is about
- Asks the area's core assessment question
- Follows up with supporting prompts naturally woven into conversation
- Draws on InnerWorkings context (personality, traits) to personalize questions: "Given that you tend to process internally, how does that affect your friendships?"
- If previous assessment content exists, LiLa references it: "Last time we talked about this, you mentioned feeling disconnected from your creative side. How does that feel now?"
- After 3-6 exchanges (adaptive — LiLa reads engagement level), reflects back an organized summary
- User edits/confirms the summary
- Confirmed content saves to `life_lantern_areas.assessment_content`
- Previous content archived to `life_lantern_area_snapshots` before overwrite

**Conversation flow:**
1. Opening: warm, area-specific greeting
2. Core question + follow-ups (2-4 exchanges)
3. History/pattern exploration (1-2 exchanges)
4. Reflection: LiLa summarizes what she heard
5. User edits/confirms → saved

> **Decision rationale:** Conversational assessment (no scales, no scores) follows the StewardShip Life Inventory pattern. LiLa guides warmly, organizes behind the scenes, reflects back for confirmation. The user always has final edit authority.

---

### Screen 4: LiLa Vision Casting Conversation

Same container as Screen 3 — LiLa drawer/modal in `life_lantern` guided mode with vision focus.

**What LiLa does:**
- Establishes the area and asks the core vision question
- If assessment content exists for this area, LiLa acknowledges the starting point: "You described feeling stuck in your career. Let's talk about what unstuck looks like."
- Guides through aspirational visioning — what does the ideal look like?
- Introduces the role model prompt: "Think of someone — real or fictional — who embodies what you want here. What specific traits do you admire?"
- Extracts specific traits (not wholesale imitation): "So from [person], you admire their discipline with money but not necessarily their workaholic tendencies. Got it."
- Supports 2-4 role models per area (but doesn't require any — everything is optional)
- Weaves traits and aspirations into a vision summary: a warm, first-person picture of who the user is becoming in this area
- User edits/confirms the summary
- Confirmed content saves to `life_lantern_areas.vision_content`
- Role model data saves to `life_lantern_role_models`

**Conversation flow:**
1. Opening: acknowledge assessment context if it exists
2. Core vision question + follow-ups (2-4 exchanges)
3. Role model exploration (optional, 1-3 exchanges per model)
4. Trait extraction and weaving
5. Vision summary: LiLa reflects back the aspirational picture
6. User edits/confirms → saved

> **Decision rationale:** Role model visioning adapted from the Wheel's Spoke 3 concept — specific traits from real or fictional people, not wholesale imitation. This grounds the vision in something concrete and personally meaningful rather than abstract aspiration.

---

### Screen 5: Personal Vision Statement

**What the user sees:**
- "My Vision" heading
- Current Personal Vision Statement — a cohesive narrative generated by LiLa from all current per-area vision content
- "Last generated: [date]" indicator
- "Regenerate Vision" button — LiLa synthesizes all current area vision content into a fresh statement
- Edit button — direct inline editing of the generated statement
- Version history: past Personal Vision Statements, each timestamped, optionally named (e.g., "After My 40th Birthday", "New Chapter")
- Visibility control: "Share this vision with family members" toggle + member picker
- `is_included_in_ai` toggle: "Include in LiLa conversations" (default: true)

> **Decision rationale:** Personal Vision Statement follows the same pattern as PRD-12B's Family Vision Statement — generated from per-area content on demand, append-only with version history, never deleted. The source of truth is per-area vision content; the statement is a synthesized snapshot.

**Interactions:**
- Tap "Regenerate Vision" → LiLa generates new statement, shown as preview before replacing current
- Tap "Edit" → inline editing of the current statement
- Tap a history version → view past statement, option to restore or name/rename
- Toggle visibility → choose which family members can see this vision
- Toggle `is_included_in_ai` → controls whether LiLa loads this as context

**Data created/updated:**
- `personal_vision_statements` — new row (append-only)
- Prior active statement deactivated via trigger

---

### Screen 6: Goal Generation

**What the user sees:**
- "Bridge the Gap" heading
- Subheading (muted): "Turn your vision into action."
- Area selector: dropdown or horizontal scroll to focus on one area, or "All Areas" for a comprehensive view
- For each area with both assessment and vision content, LiLa displays:
  - Area name
  - Brief gap summary (from the Area Detail screen)
  - Suggested goals as cards, each showing:
    - Goal text
    - Suggested destination: icon + label indicating where this goal would be created (Guiding Star, Best Intention, Task, Tracker, or Project Plan stub)
    - Accept / Edit / Dismiss actions
- "Generate More Suggestions" button per area (LiLa can suggest additional goals)
- "Create Selected Goals" button — batch creates all accepted goals in their respective features

**Goal routing logic:**

| Goal Type | Destination | Creation Method |
|-----------|-------------|-----------------|
| Core value or identity declaration surfaced from vision work | Guiding Stars (PRD-06) | Direct creation: `guiding_stars` record with `source = 'lifelantern'` |
| Ongoing practice or mindfulness intention | Best Intentions (PRD-06) | Direct creation: `best_intentions` record with `source = 'lifelantern'` |
| Concrete action step with a clear endpoint | Tasks (PRD-09A) | Routed: opens task creation with details pre-filled, user completes and saves |
| Measurable item to track over time | Widgets/Trackers (PRD-10) | Routed: opens widget creation with details pre-filled, user completes and saves |
| Complex multi-step long-term goal | Project Planner (stub) | Stub: LiLa notes this would be a great project plan; offers to break into Tasks instead |

> **Decision rationale:** Lightweight identity items (Guiding Stars, Best Intentions) are created directly because they're simple declarations/intentions with no complex fields. Actionable items (Tasks, Trackers) are routed through their feature's creation flow so mom gets full control over details like due dates, assignments, and tracker configuration. This respects each feature's creation patterns while keeping the flow smooth.

**Interactions:**
- Select area from dropdown → filters suggestions to that area
- Accept a suggestion → card marked for creation
- Edit a suggestion → inline edit before accepting
- Dismiss a suggestion → removed from list
- Tap "Create Selected Goals" → batch creates Guiding Stars and Best Intentions directly; navigates to Task/Widget creation for routed items
- Tap "Generate More Suggestions" → LiLa produces additional goal suggestions

**Data created/updated:**
- `guiding_stars` records with `source = 'lifelantern'`, `source_reference_id` → `personal_vision_statements.id`
- `best_intentions` records with `source = 'lifelantern'`
- Tasks and Widgets created through their respective feature flows

---

## AI Integration

> **Depends on:** PRD-05 (LiLa Core) — Guided mode registry, context assembly pipeline.

### Guided Mode: `life_lantern`

Registered in LiLa guided mode registry with:

| Field | Value |
|-------|-------|
| `mode_key` | `life_lantern` |
| `display_name` | Personal LifeLantern |
| `model_tier` | `sonnet` |
| `context_sources` | `['self_knowledge', 'guiding_stars', 'best_intentions', 'life_lantern']` |
| `person_selector` | false (always about the current user) |
| `available_to_roles` | `['mom']` (expandable to `['mom', 'adult', 'independent']` at Full Magic tier) |
| `requires_feature_key` | `life_lantern` |

**Opening messages (3 rotating variants):**
1. "Let's take a look at your life — honestly and hopefully. Where would you like to start?"
2. "I'm here to help you see where you are and where you're going. Pick an area that's been on your mind, or I can suggest one."
3. "Think of this as a conversation with yourself, with me taking notes. What area of your life feels like it needs attention right now?"

### LiLa's Roles in This Feature

**1. Assessment Guide**
When the user starts or updates an assessment for a life area, LiLa enters assessment mode. She asks the area's core question, follows up with supporting prompts, draws on InnerWorkings context to personalize, and reflects back an organized summary. LiLa's tone is warm, honest, and nonjudgmental — she asks questions that invite genuine reflection without pushing for discomfort. If previous assessment content exists, she frames the conversation as a check-in.

**2. Vision Casting Guide**
When the user starts or updates a vision for a life area, LiLa enters vision mode. She acknowledges the assessment context (if it exists), asks the core vision question, introduces the role model prompt, extracts specific traits, and weaves everything into a vision summary. LiLa's tone is encouraging and imaginative — she helps the user paint a vivid picture without being generic or inspiration-poster-y.

**3. Gap Analyst**
After both assessment and vision exist for an area, LiLa generates a brief gap summary — 2-3 sentences identifying the key differences. This is auto-generated and refreshed when either panel updates. The gap summary is displayed on the Area Detail screen and feeds into goal generation.

**4. Goal Suggester**
On the Goal Generation screen, LiLa analyzes the gap between assessment and vision across selected areas and suggests concrete goals. Each suggestion includes a recommended destination (Guiding Star, Best Intention, Task, Tracker, or Project Plan stub). LiLa categorizes intelligently: identity-level insights become Guiding Stars, ongoing practices become Best Intentions, action items become Tasks, measurable targets become Trackers.

**5. Organic Check-in Partner**
In general chat mode (Sitting LiLa), when conversation touches on a life area that hasn't been revisited in a while, LiLa can naturally mention it: "You know, it's been a few months since you last reflected on your Financial area in LifeLantern. Want to check in on that?" This is conversational awareness, not a scheduled notification.

**System prompt rules for LifeLantern conversations:**
- Always use warm, conversational language — never clinical, never scale-based
- Honor specificity: reference real details the user has shared, not generic prompts
- Assessment mode: be honest and gentle; draw out patterns without judgment; make space for discomfort without pushing
- Vision mode: be imaginative and encouraging; extract specific traits from role models (not wholesale imitation); paint vivid pictures
- When referencing InnerWorkings: weave personality context naturally ("Given what you know about yourself as a processor...")
- Never rush — the user sets the pace. Fewer, deeper questions are better than a survey.
- Respect the buffet principle: if the user skips something, move on gracefully

### Personal LifeLantern as Context Source

The Personal Vision Statement is registered as a member-scoped context source in the PRD-05 context assembly pipeline:

| Source | Table(s) | Available When | Scope |
|--------|----------|----------------|-------|
| Personal LifeLantern | `personal_vision_statements` (active record), `life_lantern_areas` (per-area content) | PRD-12A built | Member-scoped |

**Context loading rules:**
- Active Personal Vision Statement loaded when conversations touch on personal direction, goals, motivation, or identity
- Per-area content loaded when conversations touch on specific life areas (e.g., Financial content loaded when discussing money, Marriage content loaded when discussing partnership)
- Both Personal LifeLantern and Family Vision Quest (PRD-12B) are registered as context sources; LiLa uses the standard relevance filtering to grab only what's pertinent to the current conversation
- `is_included_in_ai` toggle on `personal_vision_statements` controls availability (default: true)
- Per-area `is_included_in_ai` toggles on `life_lantern_areas` control individual area inclusion

### Voice Input

All text input fields in Personal LifeLantern support voice input. Transcription uses OpenAI Whisper (same infrastructure as PRD-12B). For LiLa conversations, voice input is handled by the existing LiLa drawer voice input mechanism from PRD-05.

---

## Data Schema

### Table: `life_lantern_areas`

The evolving per-area content for a member's life assessment and vision. One row per section key per member — this is the living source of truth.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families (for RLS) |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| section_key | TEXT | | NOT NULL | One of the 13 default keys or a custom key (future) |
| assessment_content | TEXT | | NULL | Current "where I am" text (inclusive of history/patterns) |
| vision_content | TEXT | | NULL | Current "where I want to be" text |
| gap_summary | TEXT | | NULL | LiLa-generated gap analysis (auto-refreshed) |
| assessment_last_updated | TIMESTAMPTZ | | NULL | When assessment was last modified |
| vision_last_updated | TIMESTAMPTZ | | NULL | When vision was last modified |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Whether this area's content is available to LiLa context assembly |
| display_order | INTEGER | | NOT NULL | User-customized sort order |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Unique constraint:** `(family_member_id, section_key)` — one active area record per member per section key.

**RLS Policy:** Member can read/write their own records. Mom can read all family members' records (mom-sees-all). Other members cannot see each other's LifeLantern content.

**Indexes:**
- `idx_life_lantern_areas_member` on `(family_member_id)` — primary query pattern
- `idx_life_lantern_areas_family` on `(family_id)` — for mom's cross-member view

---

### Table: `life_lantern_area_snapshots`

Append-only version history for each area's assessment and vision content. Never deleted.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| life_lantern_area_id | UUID | | NOT NULL | FK → life_lantern_areas |
| family_id | UUID | | NOT NULL | FK → families (for RLS) |
| family_member_id | UUID | | NOT NULL | FK → family_members (for RLS) |
| content_type | TEXT | | NOT NULL | Enum: 'assessment', 'vision' |
| content | TEXT | | NOT NULL | The content at this point in time |
| snapshot_name | TEXT | | NULL | Optional user-given name ("After Therapy Breakthrough") |
| saved_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Same as parent table — member owns their own, mom sees all.

---

### Table: `life_lantern_role_models`

Role models discussed during vision casting conversations. Stored separately for reference and future cross-area use.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families (for RLS) |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| life_lantern_area_id | UUID | | NOT NULL | FK → life_lantern_areas (which area this role model was discussed for) |
| name | TEXT | | NOT NULL | Name of the role model (real or fictional) |
| is_fictional | BOOLEAN | false | NOT NULL | Whether this is a fictional character |
| traits | TEXT[] | | NOT NULL | Array of specific traits admired (extracted by LiLa) |
| notes | TEXT | | NULL | Additional context about why this person was chosen |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Same as parent — member owns their own, mom sees all.

> **Decision rationale:** Storing role models separately rather than embedding them in vision text allows them to be referenced, displayed as summary cards on the Area Detail screen, and potentially reused across areas. The `traits` array enables LiLa to reference specific traits in future conversations without re-parsing vision text.

---

### Table: `personal_vision_statements`

Generated Personal Vision Statement snapshots. Append-only — old versions are never deleted.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families (for RLS) |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| is_active | BOOLEAN | false | NOT NULL | True for the current active statement. Only one active per member. |
| statement_text | TEXT | | NOT NULL | The full Personal Vision Statement |
| version_name | TEXT | | NULL | Optional name ("New Year Reset", "After My 40th Birthday") |
| generated_by | TEXT | 'lila' | NOT NULL | Enum: 'lila', 'manual' |
| area_snapshot | JSONB | | NULL | Snapshot of per-area vision content at time of generation (for historical accuracy) |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Whether this statement is included in LiLa context assembly |
| visibility | TEXT | 'private' | NOT NULL | Enum: 'private', 'shared' |
| visible_to_members | UUID[] | | NULL | Array of member IDs who can see this (when visibility = 'shared') |
| generated_at | TIMESTAMPTZ | now() | NOT NULL | |
| created_by | UUID | | NOT NULL | FK → family_members |

**Trigger:** When a new `personal_vision_statements` record is inserted with `is_active = true`, set all other records for the same `family_member_id` to `is_active = false`.

**RLS Policy:** Member can read/write their own records. Mom can read all family members' records. Shared members in `visible_to_members` can read when `visibility = 'shared'`.

---

### Enum/Type Updates

No existing enums modified. New TEXT CHECK constraints:
- `life_lantern_areas.section_key`: 13 default values (listed in the Life Areas table above). TEXT type allows custom keys in the future without migration.
- `life_lantern_area_snapshots.content_type`: `'assessment'` | `'vision'`
- `personal_vision_statements.generated_by`: `'lila'` | `'manual'`
- `personal_vision_statements.visibility`: `'private'` | `'shared'`

---

## Visibility & Permissions

> **Depends on:** PRD-02 (Permissions & Access Control) — mom-sees-all model, PermissionGate component, per-member permission scoping.

| Role | Access | Notes |
|------|--------|-------|
| **Mom / Primary Parent** | Full access to all LifeLantern screens, all areas, assessment, vision, goals, Personal Vision Statement generation and sharing. Can view all family members' LifeLantern content (mom-sees-all). | Primary user at MVP. |
| **Dad / Additional Adult** | Own LifeLantern accessible if mom grants tool permission. Cannot see mom's or other members' LifeLantern content unless explicitly shared via visibility controls. | Privacy default: dad's LifeLantern is his own, mom can see it. |
| **Independent Teen** | Own LifeLantern accessible if mom enables the feature for them. Lighter version with youth-appropriate areas (see Forward note). Mom can see teen's content (with transparency). | Teen's LifeLantern is private from other family members; mom has visibility per PRD-02 conventions. |
| **Guided / Play** | Not present. Personal LifeLantern is not age-appropriate for younger children. | |
| **Special Adult** | Not present. LifeLantern is a personal growth feature for core family members. | |

### Shell Behavior

| Shell | Behavior |
|-------|----------|
| Mom | Full LifeLantern experience — hub, all 13 areas, assessment, vision, goals, Personal Vision Statement, sharing controls |
| Dad / Additional Adult | Own LifeLantern (permission-gated). Same screens minus mom's cross-member view. |
| Independent Teen | Youth-lite version (permission-gated, future tier). Reduced area set, age-appropriate framing. |
| Guided | Not present |
| Play | Not present |
| Special Adult | Not present |

> **Forward note:** Youth-lite LifeLantern for Independent Teens is a future Full Magic tier feature. Default youth areas would include: Spiritual/Faith, Emotional/Mental Health, Physical Health, Social/Friendships, Personal Development/Learning, Service/Contribution, Fun/Recreation/Rest — plus custom areas for programs like LDS Children and Youth. Architecture supports this: `section_key` is TEXT, area sets can be role-specific, and the `available_to_roles` field on the guided mode can be expanded.

### Privacy & Transparency

- Mom can see all family members' LifeLantern content (per PRD-02 mom-sees-all model)
- Dad's LifeLantern is visible to mom but not to children
- Teen's LifeLantern is visible to mom with transparency (teen knows mom can see it, per PRD-02 conventions)
- Personal Vision Statement sharing is opt-in: mom/dad/teen can choose to share their statement with specific family members via the visibility toggle
- All PermissionGate wrapped with `useCanAccess('life_lantern')` from day one

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| PRD-07 (InnerWorkings) | `self_knowledge` entries loaded as context during assessment conversations. Personality types, traits, and strengths inform how LiLa asks questions and personalizes reflections. |
| PRD-06 (Guiding Stars) | Existing Guiding Stars loaded as context during vision casting — LiLa can reference declared values when helping articulate vision. |
| PRD-06 (Best Intentions) | Existing Best Intentions loaded as context during goal generation — LiLa avoids suggesting duplicates. |
| PRD-05 (LiLa Core) | Guided mode registry hosts `life_lantern`. Context assembly pipeline loads LifeLantern data for relevant conversations. Voice input infrastructure. |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| PRD-06 (Guiding Stars) | Goal generation creates Guiding Stars with `source = 'lifelantern'`, `source_reference_id` → `personal_vision_statements.id`. Values and declarations surfaced from vision work. |
| PRD-06 (Best Intentions) | Goal generation creates Best Intentions with `source = 'lifelantern'`. Ongoing practices surfaced from gap analysis. |
| PRD-09A (Tasks) | Goal generation pre-fills task creation for concrete action steps. User completes creation through normal task flow. |
| PRD-10 (Widgets/Trackers) | Goal generation pre-fills tracker creation for measurable goals. User completes creation through normal widget flow. |
| PRD-05 (LiLa context) | Active Personal Vision Statement loaded as member-scoped context. Per-area content loaded when topic-relevant. |
| PRD-11 (Victory Recorder) | LifeLantern content available as context for victory connections — victories can be linked to LifeLantern goals/vision areas. |

---

## Edge Cases

**First visit — no data yet:** Warm empty state with LiLa invitation. No pressure to explore all areas. "Start wherever feels right."

**Assessment without vision:** Completely valid. Mom may want to honestly assess an area without being ready to envision change. Gap summary not generated. Goal generation not available for that area.

**Vision without assessment:** Also valid, though LiLa gently suggests that an honest assessment makes the vision more grounded. Gap summary not generated. Goal generation available but less specific.

**Partial area exploration:** Mom explores 5 of 13 areas. Unexplored areas show "Not explored yet" — no pressure, no guilt, no progress percentage.

**Very long assessment or vision text:** No hard character limit. LiLa's context assembly uses truncation with a note when content exceeds token budgets (per PRD-05 context weight management).

**Regenerating vision when areas are incomplete:** LiLa generates the Personal Vision Statement from whatever area vision content currently exists. Areas with no vision content are omitted. LiLa notes which areas weren't included.

**Multiple areas updated between vision regeneration:** LiLa always generates from the current state of all areas. Old statement is preserved in version history before replacement.

**Role model appears in multiple areas:** The same person can be a role model for multiple areas (e.g., a mentor admired for both career and spiritual qualities). Each area stores its own role model reference with area-specific traits.

**User disagrees with LiLa's gap summary:** Inline editable. User can rewrite or delete the gap summary entirely.

**Goal suggestion for a destination the user hasn't set up:** If a goal routes to a feature the user hasn't used yet (e.g., no Trackers created yet), LiLa briefly explains what the feature is and offers to help set it up, or suggests an alternative destination.

---

## Tier Gating

> **Decision rationale:** Tier assignments deferred to launch configuration. All features built with `useCanAccess()` hooks from day one. The architecture below reflects the intended tier shape without locking it in.

| Feature Key | Description | Intended Tier (TBD) |
|-------------|-------------|---------------------|
| `life_lantern` | Core LifeLantern — assessment, vision, Personal Vision Statement, goal generation | TBD |
| `life_lantern_voice` | Voice input for assessment and vision conversations (Whisper API cost) | TBD — likely higher tier due to API cost |
| `life_lantern_teen` | Youth-lite LifeLantern for Independent Teens | TBD — likely Full Magic tier |

> **Tier rationale:** Core LifeLantern is a high-value personal growth feature that drives LiLa context quality. Gating it too high reduces the quality of all LiLa interactions for those users. Voice input has per-call cost implications. Teen version is a Full Magic expansion.

All feature keys return `true` during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD / Phase |
|------|----------|--------------------|
| Project Planner goal destination — LiLa suggests complex multi-step goals as future project plans; until built, offers to break into Tasks | Project Planner (Rigging) | TBD — listed in Build Order as "Numbers Flexible" |
| Youth-lite LifeLantern — reduced area set, age-appropriate framing for Independent Teens | `life_lantern_teen` feature key | Post-MVP, Full Magic tier |
| Custom life areas — user-created areas beyond the 13 defaults | Custom area management | Post-MVP. Architecture ready: `section_key` is TEXT, not a fixed enum. |
| LifeLantern → Victory Recorder special filter — victories connected to LifeLantern goals/vision areas | PRD-11 LifeLantern filter stub | Wired when PRD-11 stub is resolved |
| Morning Rhythm / Evening Review integration — rotate LifeLantern areas and goals through daily rhythm features | Morning Rhythm PRD (TBD) | Post-MVP |
| Dashboard widget — LifeLantern area summary or vision statement snippet on personal dashboard | PRD-14 (Personal Dashboard) | When PRD-14 is built |
| Configurable check-in cadence — user-set reminder schedule per area (quarterly, monthly, etc.) | Settings or LifeLantern enhancement | Post-MVP |

### Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| LifeLantern as LiLa context source | PRD-05 | Personal Vision Statement and per-area content registered as member-scoped context sources. Loaded by context assembly pipeline when relevant. |
| LifeLantern goal generation → Guiding Stars | PRD-06 | `guiding_stars` inserts with `source = 'lifelantern'`, `source_reference_id` → `personal_vision_statements.id` |
| LifeLantern goal generation → Best Intentions | PRD-06 | `best_intentions` inserts with `source = 'lifelantern'` |
| `life_lantern` guided mode | PRD-05 (Build Order) | Fully registered with mode key, context sources, available roles, and feature key. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] All tables created with RLS policies: `life_lantern_areas`, `life_lantern_area_snapshots`, `life_lantern_role_models`, `personal_vision_statements`
- [ ] LifeLantern Hub (Screen 1): empty state, area cards with status, Personal Vision Statement preview, area reordering
- [ ] Area Detail (Screen 2): two-panel layout (assessment + vision), inline editing, snapshot history, gap summary
- [ ] LiLa assessment conversation: core questions, supporting prompts, InnerWorkings context, summary reflection, confirm/edit/save
- [ ] LiLa vision casting conversation: core questions, role model extraction, trait weaving, vision summary, confirm/edit/save
- [ ] Role model storage and display (summary cards on Area Detail screen)
- [ ] Snapshot history: append-only, timestamped, nameable/renameable
- [ ] Personal Vision Statement generation from per-area vision content
- [ ] Personal Vision Statement version history, inline editing, visibility controls
- [ ] Personal Vision Statement loaded as LiLa context source (with `is_included_in_ai` toggle)
- [ ] Goal Generation screen: gap analysis, LiLa suggestions, destination routing, accept/edit/dismiss
- [ ] Guiding Stars creation from goal generation with `source = 'lifelantern'`
- [ ] Best Intentions creation from goal generation with `source = 'lifelantern'`
- [ ] Task creation routing (pre-filled, user completes in PRD-09A flow)
- [ ] Widget/Tracker creation routing (pre-filled, user completes in PRD-10 flow)
- [ ] `life_lantern` guided mode registered in LiLa guided mode registry
- [ ] Staleness indicators on hub area cards ("Last visited: X months ago")
- [ ] LiLa organic check-in awareness in general chat mode
- [ ] All `useCanAccess('life_lantern')` hooks wired, PermissionGate on all member-scoped UI
- [ ] RLS verification: member can only see their own data; mom can see all family members' data

### MVP When Dependency Is Ready
- [ ] Victory Recorder LifeLantern filter reads Personal Vision Statement and area content (requires PRD-11 build)
- [ ] Personal Dashboard LifeLantern widget (requires PRD-14 build)

### Post-MVP
- [ ] Youth-lite LifeLantern for Independent Teens (reduced areas, age-appropriate framing)
- [ ] Custom life areas (user-created beyond 13 defaults)
- [ ] Configurable check-in cadence per area
- [ ] Morning Rhythm / Evening Review integration
- [ ] Project Planner goal destination (when Rigging PRD is built)
- [ ] Dashboard widget rotation of LifeLantern areas and goals

---

## CLAUDE.md Additions from This PRD

- [ ] `life_lantern` guided mode registered in `lila_guided_modes`. Mode key, display name, model tier, context sources defined in PRD-12A AI Integration section.
- [ ] `life_lantern_areas` table: one row per section key per member. `section_key` is TEXT — do not rename keys once created (referenced by snapshots and role models). `assessment_content` and `vision_content` are the living source of truth; history lives in `life_lantern_area_snapshots`.
- [ ] `personal_vision_statements` table: append-only. `is_active` trigger automatically deactivates prior statements when new active one is inserted. Never delete rows.
- [ ] Convention: section_key values are stable identifiers — never rename: `spiritual_faith`, `marriage_partnership`, `family_parenting`, `physical_health`, `emotional_mental`, `social_friendships`, `career_professional`, `financial`, `personal_development`, `service_contribution`, `legacy`, `home_environment`, `fun_recreation_rest`.
- [ ] Personal Vision Statement is LiLa context: loaded as member-scoped context when `is_included_in_ai = true`. Per-area content loaded when topic-relevant.
- [ ] Goal generation routing: Guiding Stars and Best Intentions created directly with `source = 'lifelantern'`. Tasks and Widgets routed through their feature's creation flow with pre-filled details.
- [ ] PermissionGate required on all LifeLantern UI. `useCanAccess('life_lantern')` wired from day one.
- [ ] Role model `traits` stored as TEXT[] array — LiLa references specific traits, not wholesale imitation of role models.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `life_lantern_areas`, `life_lantern_area_snapshots`, `life_lantern_role_models`, `personal_vision_statements`
Enums updated: None (all TEXT CHECK constraints)
Triggers added: `set_active_personal_vision_statement` — when new `personal_vision_statements` row inserted with `is_active = true`, deactivate all prior rows for same `family_member_id`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **13 default life areas** (Spiritual/Faith, Marriage/Partnership, Family/Parenting, Physical Health, Emotional/Mental Health, Social/Friendships, Career/Professional, Financial, Personal Development/Learning, Service/Contribution, Legacy, Home/Environment, Fun/Recreation/Rest) | Comprehensive coverage of personal life dimensions. Legacy, Home/Environment, and Fun/Recreation/Rest confirmed as additions beyond the StewardShip 10. |
| 2 | **Two content dimensions per area: Assessment + Vision** | Combined "where I was" and "where I am" into a single Assessment field (inclusive of history and patterns). Cleaner than three fields; the meaningful distinction is between honest current reality and aspirational future. |
| 3 | **Custom areas post-MVP, architecture ready from day one** | TEXT section keys (not a fixed enum) allow custom areas without migration. Core 13 provide comprehensive coverage for MVP validation. |
| 4 | **Separate data model from PRD-12B** | Personal LifeLantern and Family Vision Quest have similar patterns but different data shapes (individual vs. collaborative, no quest sessions, no multi-member responses). Separate tables keep the schema clean. |
| 5 | **Role models stored separately in `life_lantern_role_models` table** | Enables display as summary cards, cross-reference across areas, and trait-level LiLa context without re-parsing vision text. |
| 6 | **Goal routing: direct creation for identity items, routed for action items** | Guiding Stars and Best Intentions are simple declarations/intentions — created directly with `source = 'lifelantern'`. Tasks and Widgets have complex creation fields — routed through their feature's creation flow with pre-filled details. |
| 7 | **Project Planner stub (not numbered)** | Documented in Stubs section without assigning a PRD number. Build Order already lists it under "Numbers Flexible" as Rigging. LiLa offers to break complex goals into Tasks until Project Planner exists. |
| 8 | **Organic check-ins: LiLa conversational awareness + hub staleness indicators at MVP** | Lightest touch, most organic approach. No notification infrastructure needed. Dashboard widgets and configurable cadences are natural post-MVP extensions. |
| 9 | **Personal Vision Statement privacy: private by default, shareable by choice** | Respects the deeply personal nature of the content. Mom can share with dad. Teen (when expanded) can share with mom. Visibility toggle per member. |
| 10 | **LiLa loads both Personal LifeLantern and Family Vision Quest as context sources** | Both registered in context assembly pipeline. Standard relevance filtering applies — LiLa grabs only what's pertinent. No new mechanism needed. |
| 11 | **Universal supporting prompts for MVP, not per-area custom** | Core questions provide area differentiation. LiLa's contextual awareness handles the rest. Per-area custom prompts can be refined post-launch based on conversation patterns. |
| 12 | **Mom only at MVP; expandable to dad and teens at Full Magic tier** | Same permission model as other features. Youth-lite version (reduced areas, age-appropriate framing) for teens is a future design sprint. |
| 13 | **Buffet principle: everything optional, user chooses what to engage with** | No area is required. No component is mandatory. Mom can do assessment without vision, vision without assessment, goals without completing either. LiLa adapts to whatever exists. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Youth-lite LifeLantern for Independent Teens | Post-MVP design sprint. Default youth areas identified: Spiritual, Emotional/Mental, Physical, Social, Personal Development, Service, Fun/Recreation — plus custom areas. Architecture ready. |
| 2 | Custom life areas beyond 13 defaults | Post-MVP. Architecture supports it: `section_key` is TEXT. Needs UI for area management (add, rename, archive, reorder). |
| 3 | Project Planner goal destination | When Rigging PRD is written. LiLa offers to break complex goals into Tasks until then. |
| 4 | Configurable check-in cadence | Post-MVP. MVP uses LiLa's conversational awareness and hub staleness indicators. |
| 5 | Morning Rhythm / Evening Review integration | When those features are built. LifeLantern areas and goals rotate through daily rhythm. |
| 6 | Dashboard widget for Personal Dashboard | When PRD-14 (Personal Dashboard) is built. |
| 7 | Tier gating assignments | Launch configuration. All `useCanAccess()` hooks built now, values set at launch. |
| 8 | Per-area custom supporting prompts | Post-launch refinement based on real conversation patterns. Universal prompts adequate for MVP. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-05 (LiLa Core) | `life_lantern` guided mode registered. Personal Vision Statement and per-area content added as member-scoped context sources. | Add `life_lantern` to guided mode registry table. Add Personal LifeLantern to context assembly documentation as a member-scoped context source. |
| PRD-06 (Guiding Stars & Best Intentions) | Goal generation creates Guiding Stars with `source = 'lifelantern'` and `source_reference_id` → `personal_vision_statements.id`. Also creates Best Intentions with `source = 'lifelantern'`. | Verify PRD-06 schema includes `source` and `source_reference_id` columns with correct support for 'lifelantern' value. Verify `best_intentions` table has a `source` column. |
| PRD-07 (InnerWorkings) | InnerWorkings entries confirmed as context input for LifeLantern assessment conversations. | No schema changes needed — InnerWorkings is already a context source in PRD-05. Verify context_sources array in guided mode registration includes 'self_knowledge'. |
| PRD-09A (Tasks) | Goal generation routes task creation to PRD-09A's creation flow with pre-filled details. | Verify task creation supports pre-filled fields from external callers (title, description, source reference). |
| PRD-10 (Widgets/Trackers) | Goal generation routes tracker creation to PRD-10's creation flow with pre-filled details. | Verify widget creation supports pre-filled fields from external callers. |
| PRD-11 (Victory Recorder) | LifeLantern content confirmed as context source for victory connections. | Update PRD-11 LifeLantern filter stub to reference `personal_vision_statements` and `life_lantern_areas` tables. |

---

*End of PRD-12A*
