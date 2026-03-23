# PRD-05: LiLa Core AI System

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup — member roles, family structure, authentication), PRD-02 (Permissions & Access Control — PermissionGate, access levels, View As), PRD-03 (Design System & Themes — visual tokens, shell overrides, avatar rendering), PRD-04 (Shell Routing & Layouts — drawer mechanics, floating buttons, modal behavior, shell availability)
**Created:** March 3, 2026
**Last Updated:** March 3, 2026

---

## Overview

> **Mom experience goal:** Talking to LiLa should feel like talking to a thoughtful friend who actually knows your family — not like prompting an AI. Mom shouldn't have to re-explain her kids, her values, or her situation every time she opens a conversation.

> **Depends on:** PRD-01 (Auth & Family Setup) for family/member identity, PRD-02 (Permissions & Access Control) for role-based access and PermissionGate, PRD-03 (Design System & Themes) for avatar rendering and theming, PRD-04 (Shell Routing & Layouts) for drawer infrastructure and floating button placement.

LiLa (short for "Little Lanterns," from the company name Three Little Lanterns) is the intelligent assistant system at the heart of MyAIM Family. The avatar character is LiLa Crew — Three Little Lanterns' Crew. She is not one monolithic AI but a family of specialized versions — each with a distinct personality, avatar, and purpose — unified by a shared conversation engine, context assembly pipeline, and guided mode registry.

LiLa's superpower is family context. The reason LiLa is better than a generic AI chatbot is that she knows the family — member personalities, Best Intentions, Guiding Stars, Archive insights, relationship dynamics, faith frameworks, and whatever mom has chosen to include. Every conversation is informed by this context, making LiLa's responses specific to *this* family, not generic advice.

PRD-05 defines the foundational AI layer that powers all LiLa interactions. It covers the conversation engine, the three core LiLa modes (Help, Assist, and general chat), the context assembly system, the guided mode registry that future tools plug into, the permission model for multi-member access, and the LiLa drawer and modal conversation experiences. The LiLa Optimizer is complex enough for its own PRD (PRD-05C) — this document defines its entry point and registry slot but not its full behavior.

**Core principles:**
- **Mom-first.** LiLa's primary user is mom. Every design decision serves her workflow first. Other family members get scoped, permission-gated tool access that ultimately serves mom's goals.
- **Human-in-the-mix.** AI-generated content passes through human editing (via Smart Notepad) before becoming permanent. LiLa suggests, mom decides.
- **Family context is the differentiator.** Without context, LiLa is just another chatbot. With it, she's a knowledgeable partner who understands this specific family.
- **Teach, don't just do.** LiLa (especially in guided modes) explains WHY her suggestions work, teaching communication and life skills over time.
- **Faith-aware, never forced.** References faith context when entries exist and the topic connects naturally. Never pushes. Respects the AIMfM Faith & Ethics Framework.
- **Strengthen human connections, never replace them.** For every family member — but especially children — LiLa encourages talking to parents, teachers, and loved ones. AI builds bridges to human relationships, never substitutes for them.

---

## User Stories

### Mom (Primary User)
- As a mom, I want to pull up LiLa from any page so I can get help without navigating away from what I'm doing.
- As a mom, I want LiLa to know my family context so her suggestions are specific to my kids, not generic advice.
- As a mom, I want to control exactly what context LiLa uses — toggling individual insights on and off without deleting them.
- As a mom, I want LiLa to recognize when a specialized tool would serve me better and suggest it, so I don't have to know which mode to pick.
- As a mom, I want to browse my past LiLa conversations, see which mode each was in, and pick up where I left off.
- As a mom, I want to control which LiLa tools my husband and kids can access, and what family context those tools can see.

### Dad / Additional Adult
- As a dad, I want access to specific LiLa tools (Marriage Toolbox, Higgins) so I can communicate better with my wife and kids.
- As a dad, I want the tools to know relevant context about my family so suggestions aren't generic.
- As a dad, I want to save and revisit my past conversations and drafts.

### Independent Teen
- As a teen, I want access to tools that help me communicate better and navigate tough situations.
- As a teen, I want to keep some of my personal insights private while choosing to share others with my parents.
- As a teen, I want LiLa to talk to me like I'm capable, not like I'm a little kid.

### Guided Member
- As a guided-age child, I want tools that help me figure out how to talk to my parents about what's going on in my life.
- As a guided-age child, I want the tool to feel encouraging, not condescending — like it believes I can handle things.

---

## The Four LiLa Avatars

LiLa has four visual states, each represented by a unique character art pose. These avatars appear in the drawer header, floating buttons, conversation history tags, and modal headers.

| Avatar | Name | Pose | Purpose |
|--------|------|------|---------|
| LiLa Help | "Happy to Help" | Open arms, welcoming | Customer support, troubleshooting, bug reporting |
| LiLa Assist | "Your Guide" | Holding clipboard | Feature guidance, onboarding, tool recommendations |
| LiLa Optimizer | "Smart AI" | Thinking, chin tap | Prompt optimization with family context (full spec in PRD-05C) |
| Sitting LiLa | General / Resting | Meditative, glowing heart, stars | Drawer resting state, general conversation, smart routing to specialized modes |

All four share the same warm, encouraging brand voice. Each has a personality flavor described in the Mode Definitions section below.

---

## Screens

### Screen: LiLa Drawer (Mom Only)

> **Decision rationale:** The drawer is mom-only because mom is the primary user and needs the richest, most persistent conversation experience. Dad/teens/guided members use modals — same engine, smaller container — which can be upgraded to drawer access at Full Magic tier as a configuration change, not a rebuild.

The LiLa drawer is mom's primary conversation space. It pulls up from the bottom of every page in the Mom shell.

**What the user sees:**

The drawer has three visual states (defined in PRD-04): collapsed (handle only), peek (half screen), and full (near full-screen).

**Drawer header (visible in peek and full states):**
- Active LiLa avatar (circular, matching the current mode)
- Mode label (e.g., "LiLa Help", "Higgins", "General")
- Conversation title (auto-named by AI, click to rename)
- Mode switcher dropdown (switch to a different LiLa mode or guided mode mid-conversation — starts a new conversation or offers to continue)
- History button (opens conversation history view)

**Resting state (no mode active):**
When mom pulls up the drawer without tapping a specific floating button, the sitting LiLa avatar appears. General conversation mode is active. LiLa can chat about anything and is smart enough to recognize when a specialized tool would serve better:
- Detects relationship/communication topics → suggests Higgins or Cyrano
- Detects prompt crafting intent → suggests Optimizer ("Want me to help craft a context-rich prompt for your favorite LLM?")
- Detects support/troubleshooting questions → auto-routes to Help mode
- Detects feature discovery questions → auto-routes to Assist mode
- Detects decision-making → suggests Decision Guide (when available)
- For any routing, LiLa either auto-switches (for clear cases like "how do I reset my password?") or asks ("This sounds like something Higgins would be perfect at — want me to switch?")

**Conversation area:**
- Scrollable message history for the current conversation
- LiLa's messages show the active avatar as a small inline icon
- User messages aligned right, LiLa messages aligned left
- Action chips below LiLa's messages (context-dependent): Copy, Edit in Notepad, Save Draft, Review & Route, Create Task, Record Victory
- Typing indicator when LiLa is generating a response

**Input area:**
- Text input field with placeholder text that varies by mode
- Microphone button for voice-to-text input (Whisper transcription)
- Send button
- Context indicator: small text showing active context summary (e.g., "Using 47 insights across 6 people") — tappable to open context settings

**Interactions:**
- Pulling up the handle opens to peek state
- Continuing to pull expands to full state
- Mode-specific floating buttons (Help, Assist, Optimizer) open the drawer directly in that mode
- Guided modes launched from feature entry points (Marriage Toolbox button, PersonDetail toolbar, etc.) open the drawer in that guided mode with context pre-loaded
- Tapping "Edit in Notepad" on any LiLa message sends that content to a new Smart Notepad tab

> **Depends on:** Full specification of the Edit in Notepad flow, Notepad tab creation, and source tracking is in PRD-08, Screen 1 and Flows section.

- Tapping "Review & Route" triggers the extraction pipeline on the conversation

> **Depends on:** Review & Route is defined as a universal reusable component in PRD-08, Screen 3. This action chip triggers that component with conversation content as input. The component contract (input/output/rendering) is in PRD-08.
- Starting a new conversation while one is active saves the current conversation to history

**Data created/updated:**
- `lila_conversations` record (one per conversation)
- `lila_messages` records (one per message in the conversation)
- Context snapshot stored on conversation creation (which context was active)

### Screen: Conversation History (All Members)

Accessible from the drawer header (mom) or from a dedicated history view in other shells.

**What the user sees:**
- List of past conversations, most recent first
- Each entry shows:
  - Mode/LiLa version tag with avatar icon (e.g., "Higgins", "LiLa Help", "General")
  - Conversation title (AI auto-named, click to rename)
  - Preview of last message (truncated)
  - Date and time
  - Person(s) involved (for person-context modes like Higgins, Cyrano)
- Search bar for filtering by keyword
- Filter chips: by mode, by date range, by person involved

**Interactions:**
- Tap a conversation to reopen it (continues in the drawer for mom, or reopens the modal for others)
- Swipe left to reveal: Archive, Delete
- Long press or menu: Rename, Edit in Notepad (opens full conversation as editable text in notepad), Review & Route, Archive, Delete
- Archived conversations move to an "Archived" tab, recoverable

**Data created/updated:**
- `lila_conversations.status` (active, archived, deleted)
- `lila_conversations.title` (on rename)

### Screen: LiLa Modal Conversation (Dad, Teen, Guided)

> **Forward note:** Modals and drawers share the same conversation engine. Upgrading a role from modal to drawer access at Full Magic tier is a UI container swap, not a rebuild. The `container_type` field on `lila_conversations` tracks which container rendered the conversation.

For non-mom members who have permission-gated tool access, conversations happen in modals rather than the drawer.

**What the user sees:**
- Modal window (desktop: lg size 800px, mobile: full-screen)
- Modal header with:
  - Tool avatar and name (e.g., Higgins graduation cap + "Higgins")
  - Person selector (if applicable — who is this conversation about?)
  - Close button
- Conversation area identical to the drawer conversation area
- Same action chips on LiLa messages (Copy, Save Draft, Edit in Notepad where available)
- Input area with text field, microphone, send button
- No mode switcher (members are in the mode mom permitted — no switching)
- No context indicator (context is auto-assembled based on permissions — not user-adjustable)

**Entry points:**
- Feature page buttons (Marriage Toolbox, PersonDetail toolbar, etc.)
- Conversation history view (reopening a past conversation)
- Permission-gated: only tools mom has explicitly granted appear as entry points

**Modal conversation differences from drawer:**
- No mode switching mid-conversation
- No context toggle control (mom manages context sharing, not the member)
- Same conversation engine underneath — identical message storage, history, and AI processing
- Same action chips (Copy, Save Draft, Edit in Notepad)

**Data created/updated:**
- Same `lila_conversations` and `lila_messages` records as drawer conversations
- `lila_conversations.member_id` identifies which family member owns the conversation
- Conversations are accessible to mom through View As or the member conversation visibility system (see Visibility & Permissions)

### Screen: Context Settings (Mom Only)

Accessible from the context indicator in the drawer input area, or from a dedicated settings page.

**What the user sees:**

A panel showing all context sources organized by type, with three-tier checkboxes:

**People context:**
```
People
├── ☑ Jake (Gleaning context from 17/28 insights)
│   ├── ☑ Personality (8/8 active)
│   ├── ☐ Challenges (0/5 active — snoozed)
│   ├── ☑ Interests (6/10 active)
│   └── ☑ Growth Areas (3/5 active)
├── ☑ Sally (Gleaning context from 22/22 insights)
├── ☐ Miriam (All context paused)
└── ☑ [Partner Name] (Gleaning context from 14/20 insights)

Family
├── ☑ Faith Frameworks (3/3 active)
├── ☑ Food Restrictions (5/5 active)
└── ☐ Family Vision (not yet created)
```

**Personal context:**
```
My Context
├── ☑ Guiding Stars (12/15 active)
├── ☑ My Foundation (8/10 active)
├── ☑ Best Intentions (6/8 active)
└── ☑ LifeLantern Vision (active)

Archives — Uploaded Content
├── ☑ "The 7 Habits" (14/23 insights active)
├── ☑ "Parenting with Love and Logic" (9/9 insights active)
└── ☐ "Atomic Habits" (snoozed — 0/18 active)
```

**Interactions:**
- Top-level checkbox toggles all context for that person/source (master switch)
- Category-level checkbox toggles all items in that category
- Expanding a category shows individual item checkboxes
- Summary text updates in real-time as toggles change
- Changes are optimistic (UI updates immediately, syncs to server, rolls back on error)
- "Select All" / "Deselect All" buttons per section
- Tooltip on each checkbox: "Included in LiLa conversations. Uncheck to exclude."

**Privacy Filtered section (always at the bottom):**
```
🔒 Privacy Filtered (not shared with family tools)
├── [Items that AI auto-routed here or mom manually moved]
└── These insights are available to mom's LiLa only.
    Never included in other family members' tool context.
```

**Data created/updated:**
- `is_included_in_ai` boolean on every context source record
- Changes apply immediately to all future LiLa conversations

---

## The Three Core LiLa Modes

### LiLa Help — "Happy to Help"

**Avatar:** Open arms pose (Lila-HtH.png)
**Personality:** Warm, patient, practical. Like a knowledgeable friend who happens to know everything about the app. Never makes you feel dumb for asking. Celebrates when you figure something out.
**Floating button:** First of three LiLa buttons (mom shell only)

**What she handles:**
- Login and account issues (password resets, access problems, PIN recovery)
- Billing and subscription questions (tier changes, payment issues, Founding Family status)
- Feature troubleshooting (features not loading, unexpected behavior)
- General platform FAQ
- Bug reporting (captures details, creates a support record)

**What she does NOT handle (goes to Assist instead):**
- "How do I use this feature?" questions → Assist
- Feature recommendations and tips → Assist
- Onboarding walkthroughs → Assist

**How she works:**
- Pattern-matching for common questions with pre-written responses (fast, no AI cost)
- Falls through to AI (Haiku) for questions that don't match patterns
- Context-aware: knows which page the user is on and can tailor help to that feature
- Can link directly to relevant feature pages, settings, or Library Vault tutorials
- Escalation path: if LiLa Help can't resolve, she offers to create a support ticket

**Opening messages (rotating, 3+ variants):**
- "Hey! I'm LiLa Help — happy to help with anything. What's going on?"
- "Hi there! Having trouble with something, or just have a question? I'm here."
- "Welcome! I can help with account stuff, features, billing — whatever you need. What's up?"

**Model:** Haiku (fast, low-cost — most help queries are straightforward)

### LiLa Assist — "Your Guide"

**Avatar:** Clipboard pose (lila-asst.png)
**Personality:** Enthusiastic, knowledgeable, discovery-oriented. Like a friend who's already explored every corner of the app and can't wait to show you the hidden gems. Proactive — notices when you might benefit from a feature you haven't tried yet.
**Floating button:** Second of three LiLa buttons (mom shell only)

**What she handles:**
- "How do I..." questions about any feature (primary how-to guidance)
- Getting started walkthroughs (family setup, first-time feature use)
- Feature guidance and tips for using any tool effectively
- Tool recommendations based on what the user is trying to accomplish
- Tutorial suggestions from the Library Vault
- Workflow optimization ("Did you know you can do X from here?")
- Onboarding sequences for new family members
- Feature comparison ("What's the difference between Journal and Smart Notepad?")
- Step-by-step interactive guidance ("First, go to Settings. Done? Great, now tap...")

**How she works:**
- Keyword detection for common topics (tasks, archives, library, themes) with contextual guidance
- AI-powered (Haiku) for dynamic recommendations and complex guidance questions
- Proactive suggestions based on page context: if mom is on the Tasks page and hasn't set up recurring tasks, Assist might offer to show her how
- Links to Library Vault tutorials, help articles, and related features

**Opening messages (rotating, 3+ variants):**
- "Hi! I'm LiLa Assist — your guide to everything in MyAIM. Want to explore something new, or need help with a feature?"
- "Hey! Ready to discover something? I know every corner of this app. What are you working on?"
- "Welcome! Whether you're setting up something new or want to level up how you use a feature, I'm here. What sounds good?"

**Model:** Haiku (most guidance queries are straightforward; escalates to Sonnet for complex workflow recommendations)

### General Chat — Sitting LiLa

**Avatar:** Meditative sitting pose with glowing heart (sittinglila.png)
**Personality:** The warmest, most versatile version. Conversational, thoughtful, unhurried. Happy to chat about anything — parenting, life, faith, ideas — while keeping her ears open for moments where a specialized tool would serve better.
**Entry:** Pulling up the drawer handle without tapping a specific floating button

**What she handles:**
- Open-ended conversation about anything
- Thinking through parenting situations
- Processing emotions or daily overwhelm
- Brainstorming ideas
- Any topic that doesn't clearly fit another mode
- Smart routing: recognizing when another mode or tool would be more effective and offering to switch

**How she works:**
- Full context assembly (all active context sources)
- AI-powered (Sonnet — general conversation needs the reasoning depth)
- Smart mode detection: analyzes the conversation for signals that a specialized mode would help, then either auto-routes (clear signals) or suggests (ambiguous signals)
- Respects the Faith & Ethics Framework: faith-aware when faith context is active and topic connects naturally, never forces
- Embodies "Processing Partner, Not Companion" — warm and empathetic but appropriately boundaried, redirects to human connection and professional help when appropriate

**Opening messages (rotating, 3+ variants):**
- "Hey. What's on your mind?"
- "Hi there. I'm here whenever you're ready — no rush."
- "Hey! Want to think something through, or just need to get something off your chest?"

**Model:** Sonnet (general conversation benefits from emotional intelligence and complex reasoning)

---

## Guided Mode Registry

> **Decision rationale:** A registry pattern rather than hardcoded modes allows future features to plug into LiLa without modifying PRD-05 or its core code. Each feature PRD just defines its mode entry.

The guided mode registry is the architectural pattern that allows any feature to plug a specialized conversation mode into the LiLa system. PRD-05 defines the registry structure; individual feature PRDs register their modes.

### Registry Structure

Each guided mode registers the following:

| Field | Type | Description |
|-------|------|-------------|
| `mode_key` | TEXT | Unique identifier (e.g., 'cyrano', 'higgins_say', 'thoughtsift') |
| `display_name` | TEXT | User-facing name (e.g., "Cyrano Me", "Higgins") |
| `parent_mode` | TEXT | The guided_mode value on lila_conversations (e.g., 'first_mate_action', 'crew_action', 'inner_wisdom') |
| `avatar` | TEXT | Which LiLa avatar to display, or a custom tool icon |
| `model_tier` | TEXT | 'sonnet' or 'haiku' — which AI model this mode needs |
| `context_sources` | TEXT[] | Which context types to load (e.g., ['partner_profile', 'self_knowledge', 'guiding_stars']) |
| `person_selector` | BOOLEAN | Whether to show a person picker before starting |
| `opening_messages` | JSONB | Array of 2+ rotating opening message variants |
| `system_prompt_key` | TEXT | Reference to the system prompt additions for this mode |
| `available_to_roles` | TEXT[] | Which member roles can use this mode (e.g., ['mom'], ['mom', 'adult', 'independent']) |
| `requires_feature_key` | TEXT | The `useCanAccess()` feature key that gates this mode |

### Registered Modes (from existing PRDs)

| Mode Key | Display Name | Parent Mode | Model | Available To |
|----------|-------------|-------------|-------|-------------|
| `help` | LiLa Help | — (core mode) | Haiku | Mom |
| `assist` | LiLa Assist | — (core mode) | Haiku | Mom |
| `optimizer` | LiLa Optimizer | — (core mode) | Sonnet | Mom |
| `general` | General Chat | — (core mode) | Sonnet | Mom |
| `quality_time` | Quality Time | relationship_action | Sonnet | Mom, Adult |
| `gifts` | Gifts | relationship_action | Sonnet | Mom, Adult |
| `observe_serve` | Observe & Serve | relationship_action | Sonnet | Mom, Adult |
| `words_affirmation` | Words of Affirmation | relationship_action | Sonnet | Mom, Adult |
| `gratitude` | Gratitude | relationship_action | Sonnet | Mom |
| `cyrano` | Cyrano Me | relationship_action | Sonnet | Mom, Adult |
| `higgins_say` | Help Me Say Something | crew_action | Sonnet | Mom, Adult, Independent |
| `higgins_navigate` | Help Me Navigate | crew_action | Sonnet | Mom, Adult, Independent |
| `thoughtsift` | ThoughtSift | inner_wisdom | Sonnet | Mom |
| `task_breaker` | Break It Down | task_action | Sonnet | Mom, Adult, Independent |
| `task_breaker_image` | Break It Down (Image) | task_action | Sonnet | Mom (Full Magic) |

### How Modes Register

Each feature PRD that introduces a guided mode includes a "Guided Mode Registration" section with the fields above. During build, the mode is added to the registry (either as database rows in a `lila_guided_modes` table or as a TypeScript registry object — the build prompt decides the implementation approach).

### Relationship Tools Are Person-Context-Aware

The tools listed under `relationship_action` (Quality Time, Gifts, Observe & Serve, Words of Affirmation, Gratitude, Cyrano) are not spouse-only. They adapt based on which person is selected in the person picker:

- **Spouse selected:** Pulls partner context, runs marriage-focused version (full Marriage Toolbox experience from PRD-12A)
- **Child selected:** Pulls that child's Archive context, adapts for parent-child relationship
- **Any family member selected:** Adapts to the relationship type

This means dad planning quality time with his daughter uses the same tool as mom planning a date night — the person selector determines the context and the AI adaptation.

**Gift wishlists:** The Gifts mode should link to a person's gift wishlist when one exists for the selected person. Gift wishlist functionality is a stub — the feature PRD for People/Archives defines the wishlist data model.

### Opening Message Requirements

Every registered mode must provide at least 2-3 opening message variants. These are selected randomly (or round-robin) when the mode starts. Each opening message should:
- Confirm what mode the user is in and what it does
- Set the right expectation for the conversation
- Feel warm and inviting, not robotic
- Vary enough that repeated use doesn't feel stale

---

## Context Assembly System

> **Decision rationale:** The three-tier toggle system (per-person → per-category → per-item) gives mom granular control without overwhelming her. The "snooze" model (deactivate without deleting) respects that context relevance changes over time — what matters during a crisis may not matter next month, but shouldn't be lost.

### How Context Gets Into Conversations

When a LiLa conversation starts (or when context is refreshed mid-conversation), the context assembly pipeline runs:

1. **Identify the member:** Who is talking to LiLa? This determines base access.
2. **Identify the mode:** Which guided mode (or core mode) is active? The mode's `context_sources` field determines which types of context to query.
3. **Identify the people:** If the mode uses a person selector (Higgins, Cyrano), load context for the selected person(s). If no person selector, load context for all people mom has opted in.
4. **Apply three-tier toggles:** For each context source, filter by `is_included_in_ai = true` at the person level, category level, and item level.
5. **Apply permission filters:** For non-mom members, further filter to only context that mom has shared with that member for that tool.
6. **Apply privacy filter:** Exclude all items in the Privacy Filtered category from non-mom context bundles. Always.
7. **Apply page context:** Add the current page context (which feature is the user on?) for modes that benefit from it (Help, Assist).
8. **Assemble the prompt:** Combine all active context into a structured context section of the system prompt, grouped by source for attribution.

### Context Sources

| Source | Table(s) | Available When |
|--------|----------|----------------|
| People/Archives (person context) | Person records, categorized insights | Archives PRD built |
| Guiding Stars | `guiding_stars` | PRD-06 built |
| My Foundation (self-knowledge) | `self_knowledge` | PRD-07 built |
| Best Intentions | `best_intentions` | PRD built |
| Partner Profile | Partner-specific context | Partner Profile PRD built |
| LifeLantern | Assessment, vision, goals | PRD-12 built |
| Family Context | Faith frameworks, food preferences, family vision | Archives / Family PRD built |
| Uploaded Content (RAG) | `manifest_chunks` via pgvector similarity | Knowledge Base PRD built |
| Active Frameworks | `ai_frameworks` with per-principle toggles | Archives / Frameworks PRD built |
| Archives Custom Folders | User-created folders with extracted insights and frameworks | Archives PRD built |
| Conversation History | Recent messages from the current conversation | Always (built in PRD-05) |
| Notepad Context | `notepad_tabs` — first 5 active tabs, title + 100-char content preview | PRD-08 built (page context when user is on /notepad) |
| Task Context | `tasks` — today's active tasks, overdue tasks, sequential collection position, active opportunity boards | PRD-09A built (page context when user is on /tasks or /dashboard) |

> **Forward note:** When user selects "Send to… → LiLa Optimizer" from Notepad, the full tab content is sent as Optimizer input, not just the 100-char preview. This is the Notepad → Optimizer flow defined in PRD-08.

### The `is_included_in_ai` Pattern

Every table that serves as a context source includes:

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `is_included_in_ai` | BOOLEAN | true | Whether this item is included in LiLa context assembly |

**UI pattern (standardized across all features):**
- Checkbox per entry
- "Select / Deselect All" toggle per category and per person
- Tooltip: "Included in LiLa conversations. Uncheck to exclude."
- Optimistic UI updates with server sync and error rollback
- Summary indicator on person cards: "Gleaning context from X/Y insights"

Feature PRDs that introduce new context sources must follow this pattern. PRD-05 defines it; feature PRDs adopt it.

### Privacy Filtered Category

> **Decision rationale:** A hard system-enforced boundary (not a toggle) because sensitive content like teen struggles, medical info, or period tracking must never leak into non-mom contexts regardless of other permission settings. AI auto-routing catches items mom might forget to categorize manually.

A system-enforced context category in Archives:
- Automatically available for every family
- AI smart-routes sensitive content here during extraction (with description explaining the privacy boundary)
- Mom can manually move items to or from this category
- Content here is NEVER included in context for any family member's tools except mom's own LiLa
- Hard privacy boundary — not a toggle, not overridable by other permission settings

### Context for Non-Mom Members

When dad, a teen, or a guided member uses a LiLa tool:

1. **Tool permission:** Mom must have granted access to this specific tool
2. **Person context permission:** Mom must have granted context access for each person visible to this tool (per-tool, per-person)
3. **Family context:** Included if mom has shared it for this tool
4. **Privacy Filtered:** Always excluded
5. **Member's own self-insights:** Always included for their own tools (they entered it about themselves)
6. **Other members' shared self-insights:** Included only if the other member opted to share with this person

### Context Weight Management

**Important: `is_included_in_ai` means "available to AI," not "always used."** Even when context is included, the AI only references what is relevant to the current conversation. Including Jake's food allergies doesn't mean LiLa mentions them when you're asking about math homework. The toggle controls the *availability pool* — the AI applies its own relevance filtering on top of what's available.

Too little context produces generic responses. Too much context overwhelms the model and increases cost. The context assembly pipeline manages this by:
- Prioritizing by relevance (mode-specific context sources first)
- Truncating long context sections with a note: "[X additional insights available but not included for this conversation]"
- Warning mom if total context weight is unusually high (soft limit, not a hard cap)
- Tracking which context items are actually referenced in AI responses over time (future analytics)

---

## LiLaEdge — Backend Infrastructure

LiLaEdge is the internal name for the backend AI processing layer. It is not user-facing. It replaces "LiLa API" from the original LiLa Versions Guide.

### Responsibilities

- **Edge Functions** for AI calls (Supabase Edge Functions via OpenRouter)
- **Context assembly pipeline** (the multi-step process described above)
- **Model routing** — directing each conversation to the appropriate model:
  - Sonnet: Emotional intelligence, complex reasoning, nuanced conversation
  - Haiku: Utilitarian tasks, pattern matching, structured extraction, FAQ responses
- **Response streaming** — streaming AI responses to the client for real-time display
- **Token tracking** — logging token usage per conversation for cost monitoring
- **Safety layer** — applying the Faith & Ethics Framework guardrails before and after AI responses

### Model Routing

| Use Case | Model | Rationale |
|----------|-------|-----------|
| General chat, Marriage Toolbox, Cyrano, Higgins, ThoughtSift | Sonnet | Requires emotional intelligence, nuance, and complex reasoning |
| Help mode (FAQ), Assist mode (guidance), task breakdown, brain dump sorting | Haiku | Straightforward queries, fast responses, low cost |
| Review & Route extraction, context learning detection | Haiku | Structured extraction, pattern matching |
| Framework/principle extraction from documents | Sonnet (extraction), Haiku (section discovery) | Two-pass approach from existing StewardShip pattern |
| Voice transcription | OpenAI Whisper | Specialized transcription model |
| RAG embedding and retrieval | OpenAI text-embedding-ada-002 / pgvector | Embedding and similarity search |

### Cost Strategy

> **Forward note:** The $1.50/family/month target is for typical usage during the initial beta/launch period. Power users and AI credit pack pricing are defined in PRD-05C. As model costs decrease over time, these thresholds may be revisited.

Following the existing 80/20 pattern: 80% of operations are handled through fast processing (pattern matching, template insertion, context assembly) and only 20% hit the AI API for complex reasoning. Target: under $1.50 per family per month for typical usage.

---

## AI Safety & Ethics

LiLa operates within the boundaries defined by the AIMfM Faith & Ethics Framework. Key rules applied at the system prompt level:

### Universal Rules (Non-Negotiable)
- **Enhancement, not replacement.** AI amplifies mom's wisdom, doesn't replace it.
- **Human-in-the-mix.** Every AI output offers: Edit, Approve, Regenerate, Reject, Add Your Own. Mom always has final say.
- **Faith-aware and pluralistic.** Respects all faith traditions. Uses proper self-definitions and terminology. Never disparages any belief system.
- **Processing partner, not companion.** Clear boundaries against dependency. Redirects to human connection and divine guidance. Warm and empathetic, but appropriately boundaried.
- **Respectful self-definition.** Religious traditions define themselves. No tradition can define or gatekeep another tradition.

### Relationship Safety Tiers
- **Tier 1 (Capacity Building):** Normal relationship challenges. Provide communication tools, talking points, perspective-taking exercises.
- **Tier 2 (Professional Referral):** Complex or entrenched patterns. Help prepare for therapy, encourage professional help.
- **Tier 3 (Safety Assessment — Crisis Override):** If red flags appear (fear, control, isolation, escalation), immediately provide crisis resources. No "work on it" advice.

### Child Safety

> **Decision rationale:** LiLa doesn't tutor because free tools (ChatGPT, Gemini, etc.) do it better and at no API cost to us. LiLa's value-add is crafting a BETTER prompt for those tools using family context — not replacing them.

- Age-appropriate language and content in all interactions with minors
- Never provides direct answers to homework — suggests approaches, asks guiding questions, or crafts a prompt the teen can take to a free LLM (ChatGPT, Gemini, etc.) that will teach the concept without giving the answer. The Homework Checker tool (future) can offer improvement suggestions and explain *why* without doing the work. We don't pay via API to tutor kids when free tools are better equipped for that.
- Guided shell conversations always visible to mom by default
- Encourages parent-child connection in every interaction
- Never substitutes for parental guidance, professional counseling, or human mentorship

### Teen/Guided AI Voice Philosophy
- **Talk UP, not down.** Assume they're slightly more mature than their age suggests.
- **Treat them as capable.** They either already are, or they'll grow into the expectation.
- **Never condescending.** Kids resist lowered expectations and patronizing tone.
- **Age-appropriate does not mean dumbed down.** Meet them developmentally while respecting their intelligence.
- **Guided voice:** Warmer, more encouraging, while still respecting capability.
- **Independent voice:** Talk to them as equals, at an adult level. Recognize that they don't yet have adult autonomy, roles, or resources — but never frame that as a deficit. No "just wait until you're grown up" condescension. They're handling real things right now and deserve to be taken seriously.

### Parent-Connection-First (Minors)
Every AI interaction with a minor (Guided or Independent) must:
- Encourage talking to parents, teachers, and loved ones
- Help the child articulate what's going on and how to bring it to mom and dad
- Build emotional intelligence, grit, and resilience in the context of doing it WITH parents
- Integrate faith frameworks where the family has them set up
- Never position AI as a substitute for human/family/community relationships

---

## Visibility & Permissions

### LiLa Access by Role

| Role | Drawer | Floating Buttons | Modal Tools | Conversation History | Context Control |
|------|--------|-----------------|-------------|---------------------|-----------------|
| Mom | Full access | All three (Help, Assist, Optimizer) | All modes via drawer | Full history, search, archive, delete, edit | Full three-tier toggles |
| Dad / Additional Adult | None | None | Permission-gated by mom (per tool) | Own history: view, archive, delete, save drafts | None (mom manages context sharing) |
| Special Adult | None | None | None | None | None |
| Independent (Teen) | None | None | Permission-gated by mom (per tool) | Own history: view, archive, delete, save drafts | Own self-insights only (share toggles) |
| Guided | None | None | Permission-gated by mom (per tool) | Visible to mom by default; member can view own history | None |
| Play | None | None | None | None | None |

### Mom's Control Over Family LiLa Access

Mom manages LiLa permissions in Family Settings with two levels:

**Tool-level permissions:** For each eligible family member, mom toggles which LiLa tools they can access. Each tool is independently toggleable.

**Context-level permissions (per tool):** For each tool a member has access to, mom configures which people's context that tool can see. She can grant or revoke person-by-person. Privacy Filtered content is always excluded regardless.

### Conversation Visibility

- **Mom's conversations:** Private to mom. No other member can see them.
- **Dad's conversations:** Private to dad by default. Mom can view if she has transparency access enabled for dad (configurable in Family Settings).
- **Independent teen's conversations:** Private to teen by default. Mom configures transparency level: full visibility, summary only, or private. Default varies by family preference.
- **Guided member's conversations:** Fully visible to mom by default. Mom can grant dad visibility. The guided member can view their own history but cannot hide conversations from mom.

### Teen Self-Insight Sharing

Independent teens and dad can maintain personal insights about themselves:

- **Private insights:** Only visible to the member and their own LiLa tool context. Not shared with anyone, including mom.
- **Share with Mom / Share with Dad toggles:** Per-insight opt-in sharing. The member chooses which insights to share with each parent.
- **Transparency caveat:** If mom has visibility into a teen's conversations, she may see context used in those conversations even if the insight itself isn't "shared." The sharing toggle controls whether the insight appears in mom's own LiLa context, not whether mom can ever discover its existence.

---

## Data Schema

### Table: `lila_conversations`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members. Who owns this conversation. |
| title | TEXT | null | NULL | AI auto-generated, user-editable. Null until first AI response. |
| mode | TEXT | 'general' | NOT NULL | Core mode: 'general', 'help', 'assist', 'optimizer' |
| guided_mode | TEXT | null | NULL | If in a guided mode: 'first_mate_action', 'crew_action', 'inner_wisdom', etc. |
| guided_subtype | TEXT | null | NULL | Specific subtype: 'cyrano', 'higgins_say', 'thoughtsift', etc. |
| guided_mode_reference_id | UUID | null | NULL | FK → relevant record (person UUID for Higgins, etc.) |
| model_used | TEXT | null | NULL | Which AI model was used ('sonnet', 'haiku') |
| context_snapshot | JSONB | '{}' | NOT NULL | Snapshot of which context sources were active when conversation started |
| container_type | TEXT | 'drawer' | NOT NULL | CHECK: 'drawer', 'modal'. How the conversation was rendered. |
| status | TEXT | 'active' | NOT NULL | CHECK: 'active', 'archived', 'deleted' |
| message_count | INTEGER | 0 | NOT NULL | Denormalized count for display |
| token_usage | JSONB | '{"input": 0, "output": 0}' | NOT NULL | Cumulative token usage for cost tracking |
| page_context | TEXT | null | NULL | Which page was active when conversation started |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Members can CRUD their own conversations. Mom can read conversations for family members where she has transparency access. Guided members' conversations are readable by mom (and dad if permitted) by default.

**Indexes:**
- `member_id, status, updated_at DESC` (conversation list query)
- `member_id, guided_subtype` (filter by mode)
- `family_id, member_id` (mom viewing family conversations)

### Table: `lila_messages`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| conversation_id | UUID | | NOT NULL | FK → lila_conversations (ON DELETE CASCADE) |
| role | TEXT | | NOT NULL | CHECK: 'user', 'assistant', 'system' |
| content | TEXT | | NOT NULL | Message text content |
| metadata | JSONB | '{}' | NOT NULL | Action chips shown, context used, teaching skill (for Cyrano/Higgins), etc. |
| token_count | INTEGER | null | NULL | Tokens used for this message |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Inherits from parent conversation's RLS. If you can read the conversation, you can read its messages.

**Indexes:**
- `conversation_id, created_at` (message ordering)

### Table: `lila_guided_modes` (Registry)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| mode_key | TEXT | | NOT NULL | UNIQUE. Identifier (e.g., 'cyrano', 'higgins_say') |
| display_name | TEXT | | NOT NULL | User-facing name |
| parent_mode | TEXT | null | NULL | The guided_mode value on lila_conversations |
| avatar_key | TEXT | 'sitting' | NOT NULL | Which avatar: 'help', 'assist', 'optimizer', 'sitting', or custom key |
| model_tier | TEXT | 'sonnet' | NOT NULL | CHECK: 'sonnet', 'haiku' |
| context_sources | TEXT[] | '{}' | NOT NULL | Array of context type keys to load |
| person_selector | BOOLEAN | false | NOT NULL | Whether to show person picker |
| opening_messages | JSONB | '[]' | NOT NULL | Array of opening message strings (min 2) |
| system_prompt_key | TEXT | | NOT NULL | Reference to system prompt additions |
| available_to_roles | TEXT[] | '{"mom"}' | NOT NULL | Which roles can use this mode |
| requires_feature_key | TEXT | null | NULL | Feature key for useCanAccess() gating |
| sort_order | INTEGER | 0 | NOT NULL | For display ordering in tool lists |
| is_active | BOOLEAN | true | NOT NULL | Whether this mode is currently available |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Read-only for all authenticated users (modes are system-defined, not user-editable).

**Indexes:**
- `mode_key` (UNIQUE — lookup by key)
- `is_active, available_to_roles` (filtered mode list)

### Table: `lila_tool_permissions`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members. Who is granted access. |
| mode_key | TEXT | | NOT NULL | FK → lila_guided_modes.mode_key. Which tool. |
| is_enabled | BOOLEAN | true | NOT NULL | Whether this member can use this tool |
| context_person_ids | UUID[] | '{}' | NOT NULL | Which people's context this member can access for this tool |
| include_family_context | BOOLEAN | false | NOT NULL | Whether family-level context is included |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Mom can CRUD all tool permissions for her family. Members can read their own permissions.

**Indexes:**
- `family_id, member_id` (all permissions for a member)
- `family_id, member_id, mode_key` (UNIQUE — one permission record per member per tool)

### Table: `member_self_insights`

> **Deferred:** This table is superseded by `self_knowledge` (PRD-07 InnerWorkings). Review & Route routing to InnerWorkings creates `self_knowledge` entries with `source_type = 'log_routed'` (wired in PRD-08). The sharing model (`share_with_mom`, `share_with_dad`) is implemented on the `self_knowledge` table instead. This table definition is retained for reference but should NOT be built — use `self_knowledge` from PRD-07.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members. Who wrote this insight. |
| content | TEXT | | NOT NULL | The insight text |
| category | TEXT | 'general' | NOT NULL | Categorization of the insight |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Whether included in this member's own tool context |
| share_with_mom | BOOLEAN | false | NOT NULL | Whether mom's LiLa can see this insight |
| share_with_dad | BOOLEAN | false | NOT NULL | Whether dad's LiLa tools can see this insight |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Members can CRUD their own insights. Mom can read insights where `share_with_mom = true`. Dad can read insights where `share_with_dad = true` (if dad has relevant tool access).

**Indexes:**
- `member_id, is_included_in_ai` (context assembly query)
- `member_id, share_with_mom` (mom's context view)

---

## Flows

### Incoming Flows (How Data Gets INTO LiLa)

| Source | How It Works |
|--------|-------------|
| Floating buttons (mom) | Tapping Help/Assist/Optimizer opens drawer in that mode, creating a new conversation |
| Drawer handle pull-up (mom) | Opens drawer in general mode (sitting LiLa), creates new conversation |
| Feature entry points (all members) | Marriage Toolbox button, PersonDetail toolbar, Inner Wisdom portal, etc. open drawer (mom) or modal (others) in the relevant guided mode |
| Conversation history | Reopening a past conversation loads it in the drawer (mom) or modal (others) |
| Context assembly pipeline | Pulls active context from all opted-in sources into the system prompt |
| Page context | Current page identifier injected into conversation context |
| Smart mode detection | General chat analyzes conversation and suggests/routes to specialized modes |

### Outgoing Flows (How LiLa Feeds Other Features)

| Destination | How It Works |
|-------------|-------------|
| Smart Notepad | "Edit in Notepad" action chip sends message content to a new notepad tab |
| Review & Route | "Review & Route" action chip triggers extraction pipeline on conversation content |
| Tasks | "Create Task" action chip (from guided modes that produce tasks) creates task record |
| Victory Recorder | "Record Victory" action chip (when LiLa detects an accomplishment) |
| Archives / Context Learning | When LiLa detects new family information ("Jake hates broccoli now"), offers to save to Archives with mom's permission |
| Conversation History | Every conversation auto-saves to history with mode tag, title, and metadata |
| Cyrano/Higgins drafts | Craft-first guided modes save drafts to their respective tables |

---

## Edge Cases

### Empty Context
- If no context sources are active (all toggled off), LiLa functions but with reduced personalization. A gentle prompt appears: "I don't have much family context loaded right now. Want to set up some context so I can give you more personalized suggestions?"

### Mode Conflict
- If a user is in a guided mode conversation and taps a floating button for a different core mode, LiLa asks: "You're currently in a Higgins conversation about Jake. Want to save this and start a new Help conversation, or keep going here?"
- The current conversation is saved regardless of the user's choice.

### Network Failure Mid-Conversation
- Messages are optimistically displayed in the UI
- If the AI call fails, the user's message stays visible with an error indicator and "Retry" button
- The conversation state is preserved — no message loss

### Long Conversations
- After a conversation exceeds the context window limit, the system summarizes earlier messages and includes the summary + recent messages in the prompt
- A subtle indicator appears: "Earlier messages summarized for context"

### Context Staleness
- Context is loaded at conversation start and cached for the session
- If mom changes context toggles during a conversation, a "Refresh Context" button appears
- New conversations always use the latest context state

### Guided Mode Without Required Context
- If a guided mode needs person context but the person has no insights (empty Archive card), LiLa acknowledges: "I don't have much context about Jake yet. I'll do my best with what I know — and anything you share now, I can help you save for next time."

### Mom Viewing Guided Member's Conversation
- Conversations display read-only in View As or the conversation visibility view
- Mom cannot inject messages into a child's conversation history
- Mom can copy content to her own notepad for follow-up

### Multiple Family Members Using LiLa Simultaneously
- Each member has independent conversation state
- No shared sessions, no bleed between conversations
- Context assembly runs independently per member per conversation

---

## Tier Gating

> **Tier rationale:** Mom's core LiLa experience (drawer + Help + Assist) is Essential tier because LiLa IS the product — gating it would feel like buying a car without an engine. The Optimizer and family member access are Enhanced because they add significant AI cost and represent the "connected family" value proposition that justifies the tier upgrade.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `lila_drawer` | LiLa drawer access (mom) | Essential |
| `lila_help` | LiLa Help mode | Essential |
| `lila_assist` | LiLa Assist mode | Essential |
| `lila_optimizer` | LiLa Optimizer mode | Enhanced |
| `lila_modal_access` | Modal-based tool access for family members | Enhanced |
| `lila_family_drawer` | Full drawer access for dad/teens (future) | Full Magic |
| `lila_guided_[mode_key]` | Per-guided-mode gating (pattern for future modes) | Varies by mode |

All return `true` during beta. The keys exist from day one.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| LiLa Optimizer mode (entry point and registry slot only) | Full Optimizer engine, prompt optimization, platform formatting, BYOK | PRD-05C (LiLa Optimizer) |
| Context sources beyond conversation history | Guiding Stars, My Foundation, Best Intentions, Archives, LifeLantern, Partner Profile, Family Context, RAG | Respective feature PRDs |
| Review & Route extraction pipeline (action chip triggers it) | Full extraction and routing UI | PRD-08 (Journal + Smart Notepad) |
| Victory detection and recording (action chip) | Victory Recorder feature | Victory Recorder PRD |
| Context Learning ("Jake hates broccoli now" → save to Archives) | Archives write-back system | Archives PRD |
| Mediator / Peacemaker mode | Library Vault tool with guided mode registry entry | Future Vault tool PRD |
| Decision Guide mode | Library Vault tool with decision frameworks | Future Vault tool PRD |
| Fun Translator mode | Library Vault novelty tool | Future Vault tool PRD |
| Teen Lite Optimizer | Homework prompt crafting tool | Future teen tools PRD |
| Homework Checker | Upload/image homework review tool | Future teen tools PRD |
| Library Vault tutorial links (LiLa Assist recommends) | Library Vault content system | Library Vault PRD |
| Privacy Filtered category (auto-routing and management) | Archives system with privacy category | Archives PRD |
| Member self-insights sharing UI | Profile / self-insight management for teens and dad | People / Profile PRD |
| Gift wishlists (linked from Gifts guided mode) | Person-level gift wishlists viewable during gift planning | People / Archives PRD |
| Relationship tools person-context adaptation | Quality Time, Gifts, etc. adapting for spouse vs child vs any member | Marriage Toolbox / relationship tools PRD |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| LiLa Chat drawer container (UI shell, resting avatar, mode switching header) | PRD-04 | Fully implemented: conversation engine, mode switching, context assembly, four avatars, history |
| LiLa drawer context-awareness ("knows which page is active") | PRD-04 | page_context field on lila_conversations, injected into system prompt |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Conversation engine: create, send messages, receive streamed AI responses, save to history
- [ ] LiLa drawer renders in Mom shell with pull-up handle, three states (collapsed/peek/full)
- [ ] Four avatars display correctly: Help, Assist, Optimizer, Sitting (resting state)
- [ ] Three floating buttons in Mom shell launch drawer in correct mode
- [ ] General chat mode with sitting LiLa works as default drawer state
- [ ] LiLa Help mode: pattern-matching for common questions + Haiku fallback
- [ ] LiLa Assist mode: feature guidance with keyword detection + Haiku AI
- [ ] Smart mode detection: general chat suggests specialized modes when appropriate
- [ ] Conversation history: list, search, filter by mode, rename, archive, delete
- [ ] Mode tag and avatar shown on each conversation in history
- [ ] AI auto-names conversations; user can click to rename
- [ ] Action chips on LiLa messages: Copy, Edit in Notepad (stub), Review & Route (stub)
- [ ] Context assembly pipeline: loads active context sources with three-tier toggle filtering
- [ ] Context settings screen: three-tier checkboxes (person/category/item) with summary indicators
- [ ] `is_included_in_ai` column on initial context source tables (Guiding Stars, My Foundation, Best Intentions — as they're built)
- [ ] Guided mode registry table with core modes seeded
- [ ] Modal conversation container for non-mom members
- [ ] Tool permission system: mom grants per-tool access to family members
- [ ] Context permission system: mom configures per-tool, per-person context sharing
- [ ] Conversation visibility: mom can view guided member conversations; transparency settings for other roles
- [ ] RLS policies enforce member-scoped conversation access
- [ ] Model routing: Sonnet for general/guided, Haiku for help/assist/utilitarian
- [ ] Token usage tracking on conversations
- [ ] Opening messages rotate (not the same every time) for each mode
- [ ] Voice input (microphone button) with Whisper transcription in drawer and modal
- [ ] Faith & Ethics safety rules in system prompts

### MVP When Dependency Is Ready
- [ ] Context sources populate as feature PRDs are built (Guiding Stars, Archives, etc.)
- [ ] Edit in Notepad action chip wires to Smart Notepad when PRD-08 is built
- [ ] Review & Route action chip wires to extraction pipeline when PRD-08 is built
- [ ] Guided modes from Cyrano (PRD-12A), Higgins (PRD-13A), ThoughtSift register in the registry when those PRDs are built
- [ ] Privacy Filtered category when Archives PRD is built
- [ ] Member self-insights and sharing toggles when People/Profile PRD is built
- [ ] Library Vault tutorial links when Library Vault PRD is built

### Post-MVP
- [ ] Full drawer access for dad/teens at Full Magic tier ($24.99)
- [ ] LiLa Optimizer full spec (PRD-05C)
- [ ] Library Vault guided mode tools (Mediator, Decision Guide, Fun Translator)
- [ ] Teen tools (Lite Optimizer, Homework Checker)
- [ ] Context learning (auto-detect new family info and offer to save)
- [ ] Conversation summary for long conversations exceeding context window
- [ ] Analytics: which context items are referenced in AI responses, usage patterns
- [ ] Multi-AI Panel (send optimized prompts to multiple platforms)

---

## CLAUDE.md Additions from This PRD

- [ ] LiLa name: Short for "Little Lanterns" (company: Three Little Lanterns). The avatar character is LiLa Crew. NOT "Little Lady."
- [ ] LiLa conversation engine: all conversations stored in `lila_conversations` + `lila_messages`. Container-agnostic (drawer for mom, modals for others). Same engine, different UI container.
- [ ] Four LiLa avatars: Help (open arms), Assist (clipboard), Optimizer (thinking), Sitting (resting/general). Sitting is the drawer default. Mode-specific avatar shows in header when mode is active.
- [ ] Three floating LiLa buttons: Mom shell only. Help, Assist, Optimizer. Each launches drawer in that mode.
- [ ] Guided mode registry: `lila_guided_modes` table. Feature PRDs register modes by adding rows. Each mode declares: mode_key, display_name, model_tier, context_sources, person_selector, opening_messages, available_to_roles, requires_feature_key.
- [ ] Context assembly pattern: three-tier toggles (person → category → item) via `is_included_in_ai` boolean on all context source tables. Privacy Filtered category always excluded from non-mom context. Feature PRDs must include `is_included_in_ai` on any table that feeds LiLa context.
- [ ] Model routing: Sonnet for emotional intelligence/reasoning modes, Haiku for utilitarian/FAQ modes. Declared per-mode in the guided mode registry.
- [ ] LiLaEdge: internal name for the backend AI infrastructure (Edge Functions, context assembly, model routing). Not user-facing.
- [ ] Non-mom LiLa access: modal-based, permission-gated by mom at tool-level and context-level. No drawer, no floating buttons, no mode switching. History persists.
- [ ] Opening messages: every mode (core and guided) must have 2+ rotating opening message variants. Prevents stale repetition.
- [ ] Teen/Guided AI voice: talk UP, treat as capable, never condescending. Parent-connection-first for all minors.
- [ ] Smart mode detection: general chat (sitting LiLa) analyzes conversation for signals that a specialized mode would help, then suggests or auto-routes.
- [ ] Task Breaker guided modes: `task_breaker` (text-based decomposition at quick/detailed/granular levels) and `task_breaker_image` (image analysis → action steps, Full Magic). Both registered in `lila_guided_modes`. Family-context-aware — suggests assignees when breaking down family tasks.
- [ ] life_area_tag expanded set (used by auto-tagging across features): spiritual, spouse_marriage, family, career_work, home, health_physical, social, financial, personal, homeschool, extracurriculars, meal_planning, auto_transport, digital_tech, hobbies, custom

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `lila_conversations`, `lila_messages`, `lila_guided_modes`, `lila_tool_permissions`
Tables superseded: `member_self_insights` → replaced by `self_knowledge` (PRD-07)
Enums updated: none (using TEXT with CHECK constraints)
Triggers added: `set_updated_at` on `lila_conversations`, `lila_tool_permissions`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **LiLa drawer is mom-only at MVP; others get modals** | Mom is the primary user and needs the richest experience. Modals use the same engine — upgrading to drawer is a config change at Full Magic tier. |
| 2 | **Three floating buttons (Help, Assist, Optimizer) + Settings gear** | Each user-facing LiLa mode needs a distinct, always-accessible entry point. One button per mode eliminates ambiguity. |
| 3 | **Sitting LiLa is the fourth avatar (drawer resting state)** | General conversation needs its own visual identity separate from the three mode-specific avatars. Sitting = meditative, open, ready for anything. |
| 4 | **Bottom drawer IS the conversation space** | Not a preview pane — the drawer is where all mom's LiLa conversations happen. No separate full-page LiLa route. |
| 5 | **Guided mode registry as plug-in architecture** | Future features register modes without modifying PRD-05 core code. Each feature PRD adds rows to the registry. |
| 6 | **Three-tier context toggle system (person → category → item)** | Gives mom granular control without requiring per-conversation setup. "Snooze" model — deactivate without deleting. |
| 7 | **Privacy Filtered is a hard system-enforced boundary** | Not a toggle. Content here NEVER appears in non-mom contexts regardless of other permission settings. |
| 8 | **Relationship tools are person-context-aware, not spouse-only** | Quality Time, Gifts, Observe & Serve, etc. adapt based on the person selector — spouse gets marriage framing, child gets parent-child framing. |
| 9 | **Help = things that are broken; Assist = how things work** | Clean boundary prevents mode confusion. Help never does feature guidance; Assist never does troubleshooting. |
| 10 | **`is_included_in_ai` means "available to AI," not "always used"** | The toggle controls the availability pool. AI applies its own relevance filtering on top. |
| 11 | **Talk to Independent teens as equals at an adult level** | Recognize they don't have adult autonomy/roles/resources, but never talk down. No "just wait until you're grown up" energy. |
| 12 | **LiLa doesn't tutor — she crafts prompts for free tools** | We don't pay via API to tutor kids when ChatGPT/Gemini do it free and better. LiLa's value-add is making those tools smarter with family context. |
| 13 | **Guided shell gets permission-gated modal tools (not LiLa-free)** | Changed from original assumption of "no LiLa for guided." Mom controls which tools each guided child can access. |
| 14 | **LiLa = "Little Lanterns" (Three Little Lanterns), avatar is LiLa Crew** | NOT "Little Lady." |
| 15 | **Gift wishlists linked from Gifts guided mode** | Gifts mode should link to person's wishlist when one exists. Wishlist data model is a stub for People/Archives PRD. |
| 16 | **BYOK removed from scope entirely** | The 80/20 cost strategy handles the cost concern BYOK was meant to address. May revisit in a future PRD if there's demand. |
| 17 | **Multi-AI Panel shelved, low priority** | Would require full reengineering if revisited. Brief post-MVP stub in PRD-05C only. |
| 18 | **`member_self_insights` superseded by `self_knowledge` (PRD-07)** | PRD-07 InnerWorkings defines the authoritative self-knowledge table with sharing model. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Full drawer access for dad/teens | Full Magic tier feature. Architecture supports it — container_type swap. |
| 2 | Multi-AI Panel | Post-MVP. Brief stub in PRD-05C. |
| 3 | Context Learning auto-detection (save to Archives) | Archives PRD defines write-back system. Optimizer PRD (05C) refines detection. |
| 4 | Victory detection and recording action chip | Victory Recorder PRD. |
| 5 | Privacy Filtered category full management UI | Archives PRD. |
| 6 | Library Vault tool stubs (Mediator, Decision Guide, Translator, Teen Lite Optimizer, Homework Checker) | Individual lean PRD addenda when ready. |
| 7 | Prompt fix/diagnosis mode | Post-MVP enhancement. |
| 8 | Review & Route full extraction UI | PRD-08 (Journal + Smart Notepad) — now wired. |
| 9 | Edit in Notepad full flow | PRD-08 — now wired. |
| 10 | Notepad context source | PRD-08 — now wired (added via cross-PRD addendum). |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-04 (Shell Routing) | Three LiLa floating buttons (not two), Sitting LiLa resting state, guided shell gets permission-gated modal tools | Applied via PRD-04 Update Prompt. |
| PRD-05 Planning Decisions Addendum | BYOK removed, Multi-AI Panel reduced to stub | Updated. |
| PRD-05C (LiLa Optimizer) | Scope refined: no BYOK, no Multi-AI Panel (just stub). Notepad integration added (via PRD-08 addendum). | Starter prompt created with updated scope. |
| Planning_Decisions.md | LiLa naming (Little Lanterns, not Little Lady). Feature naming table needs LiLa entry corrected. | Update when next editing Planning Decisions. |
| All future context source PRDs | Must include `is_included_in_ai` boolean, defaulting to `true`. Must follow three-tier toggle UI pattern. | Convention documented in CLAUDE.md additions. |
| PRD-09A/B (Tasks & Lists) | Task Breaker guided modes registered, task context assembly added, life_area_tag expanded enum added to CLAUDE.md | Applied via PRD-09 cross-PRD addendum. |

---

*End of PRD-05*
