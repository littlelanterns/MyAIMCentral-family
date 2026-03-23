# PRD-05C: LiLa Optimizer

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup — member roles, family structure), PRD-02 (Permissions & Access Control — PermissionGate, access levels), PRD-03 (Design System & Themes — visual tokens, avatar rendering), PRD-04 (Shell Routing & Layouts — drawer mechanics, floating buttons), PRD-05 (LiLa Core AI System — conversation engine, context assembly, guided mode registry, drawer infrastructure)
**Created:** March 3, 2026
**Last Updated:** March 3, 2026

---

## Overview

The LiLa Optimizer is the flagship intelligence feature of MyAIM Family — the tool that makes mom's family context portable to any AI platform she uses. While other LiLa modes (Help, Assist, General Chat, guided tools like Higgins and Cyrano) answer questions and facilitate conversations directly, the Optimizer does something fundamentally different: it crafts prompts. Mom enters a simple request, and the Optimizer transforms it into a rich, context-aware prompt that she can copy and paste into ChatGPT, Claude, Gemini, or any other LLM — and that LLM will respond as if it deeply understands her family.

This is what makes the Optimizer the platform's differentiator. Mom builds her family context once in MyAIM (Archives, Best Intentions, Guiding Stars, LifeLantern, person profiles), and the Optimizer makes all of that context work everywhere. She doesn't need to re-explain her family to every AI tool she uses. The Optimizer also produces a second output type: conversation flow prompts — multi-turn scripts with context baked in that mom pastes into her LLM to start a guided process (meal planning walkthrough, behavior conversation prep, etc.).

The Optimizer uses an 80/20 cost strategy: 80% of optimizations are handled through JavaScript pattern matching, template assembly, and context insertion (free), and only 20% require an AI API call via Sonnet for complex, emotional, or novel requests. This keeps the per-family cost within the platform's budget targets while delivering high-quality results.

> **Mom experience goal:** "I typed three words and got back a perfect prompt that knew my whole family. I just copied it into ChatGPT and got the best answer I've ever gotten." The Optimizer should feel like having a brilliant friend who knows your family and writes perfect prompts in seconds.

> **Depends on:** Conversation engine, context assembly pipeline, guided mode registry, drawer infrastructure — defined in PRD-05, all sections. LiLa Optimizer's registry slot is pre-defined in PRD-05's Guided Mode Registry table.

**Core constraint:** The Optimizer is strictly for prompt optimization and conversation flow crafting, not general chat. If mom asks a question the Optimizer would normally just answer, it crafts a prompt instead and offers to switch to General Chat if she'd rather LiLa help directly.

> **Decision rationale:** Strict prompt-crafting scope (no general chat) was chosen because the Optimizer's value is making family context *portable* to any LLM. If it answered questions directly, it would just be another chatbot competing with General Chat LiLa.

---

## User Stories

### Mom — Prompt Crafting
- As a mom, I want to type a simple request and get back a rich, detailed prompt I can paste into my favorite AI so I don't have to re-explain my whole family every time.
- As a mom, I want the Optimizer to know which of my kids I'm talking about and automatically include their relevant context so the prompt feels personalized.
- As a mom, I want to choose between a quick optimization and a more guided process so I can move fast when I'm confident and get help when I'm not sure what I need.
- As a mom, I want to see what context LiLa added to my prompt so I can learn what makes prompts work better over time.

### Mom — Conversation Flows
- As a mom, I want the Optimizer to create a multi-step conversation script I can paste into an LLM so it walks me through a process (like meal planning or behavior prep) with my family context already loaded.
- As a mom, I want conversation flows to include natural pause points so the LLM asks me questions and adapts as we go.

### Mom — Templates & Reuse
- As a mom, I want to save prompts I've used before as templates so I can quickly reuse them with different kids or topics.
- As a mom, I want to browse pre-built starter prompts in the Library Vault so I don't have to start from scratch every time.
- As a mom, I want starter prompts to auto-fill my family context and let me customize before saving.

### Mom — Context Management
- As a mom, I want the Optimizer to auto-detect which context preset to use based on my request so I don't have to manually configure context every time.
- As a mom, I want to select a context preset manually when I know exactly what context I want included.
- As a mom, I want the Optimizer to notice when I mention new family information and offer to save it so my context stays current.

### Mom — Usage Awareness
- As a mom, I want to see how much of my monthly optimization limit I've used so I can pace myself or purchase more credits if I need them.

---

## Screens

### Screen: Optimizer Drawer (Mom Shell)

The Optimizer uses the same LiLa drawer defined in PRD-05. When mom taps the Optimizer floating button (thinking/chin-tap avatar), the drawer opens in Optimizer mode.

**What the user sees:**

**Drawer header:**
- LiLa Optimizer avatar (thinking pose)
- Mode label: "LiLa Optimizer"
- Conversation title (auto-named by AI, click to rename)
- Mode switcher dropdown (inherited from PRD-05 — can switch to other modes)
- History button

**Mode selector (below header, above conversation area):**
Two tappable chips that set the optimization approach for this conversation:
- **Quick Optimize** — "I know what I need" — LiLa optimizes immediately with available context. Default selection.
- **Walk Me Through It** — "Help me think this through" — LiLa asks smart clarifying questions before crafting the prompt.

The mode selector is persistent for the conversation but can be changed mid-conversation. Switching from Quick to Walk Me Through prompts LiLa to ask follow-up questions about the current request.

> **Decision rationale:** Two explicit modes (Quick Optimize / Walk Me Through It) were chosen over auto-detection because mom should control the pace of her experience. Auto-detection was considered but rejected — it felt unpredictable, and moms who know what they want shouldn't have to wait through questions.

**Context preset indicator (below mode selector):**
A small dropdown showing the active context preset:
- Default: "Auto-Detect" (Optimizer selects based on request)
- Tappable to manually select: Homework Help, Meal Planning, Behavior Guidance, Spiritual Questions, Schedule Management, Creative & Fun, Communication, or any custom preset mom has configured.
- Shows the active context summary (e.g., "Using 34 insights across 4 people")

**Usage indicator (top-right of drawer, subtle):**
A small thermometer or progress arc showing monthly optimization usage:
- "12 of 50 this month" — informational, not alarming
- Tappable to see full usage details and option to purchase AI credit packs
- Color shifts from brand teal to warm amber as usage approaches the limit

**Conversation area:**
- Same scrollable message area as all LiLa drawer conversations (PRD-05)
- LiLa's messages show the Optimizer avatar as inline icon
- Optimized prompts render as **prompt cards** (see Prompt Card section below)
- Action chips on messages: Copy, Edit in Notepad, Save as Template, Review & Route

**Input area:**
- Text input with placeholder: "What do you need help with? I'll craft the perfect prompt."
- Microphone button for voice input
- Send button
- Context indicator (same as PRD-05, tappable to open Context Settings)

**Interactions:**
- Typing a request and sending triggers the optimization pipeline
- Quick Optimize: LiLa processes immediately and returns a prompt card
- Walk Me Through It: LiLa asks 1-2 clarifying questions (smart-filtered against existing context) before producing the prompt card
- If Quick Optimize receives a vague request, LiLa gently nudges: "I can optimize this, but one quick question would make it much better — want me to ask?"
- All standard drawer interactions from PRD-05 apply (pull-up states, history, mode switching)

**Data created/updated:**
- `lila_conversations` record (mode: optimizer)
- `lila_messages` records
- `optimizer_outputs` record (linked to the conversation, stores the optimized prompt and metadata)

### Screen: Prompt Card (Within Conversation)

When the Optimizer produces an optimized prompt, it renders as a styled card within the conversation — visually distinct from regular chat messages.

**What the user sees:**

**Card header:**
- Prompt type badge (e.g., "Homework Help", "Meal Planning", "Conversation Flow")
- Platform suggestion with link (e.g., "Great for ChatGPT" with link to chatgpt.com — based on mom's preferred platform settings, or a generic "Works on any AI" if no preference set)

**Card body:**
- The full optimized prompt text, cleanly formatted
- If the prompt is a conversation flow, sections are visually delineated with step numbers and pause indicators

**Card footer — action buttons:**
- **Copy** — Copies the full prompt text to clipboard. Brief "Copied!" confirmation.
- **Edit in Notepad** — Sends the prompt to Smart Notepad for editing before use
- **Save as Template** — Opens the template save flow (see Prompt Templates section)
- **"What did I add?"** — Toggle that expands an explainer section below the card

**"What did I add?" explainer (collapsed by default):**
When expanded, shows a checklist of context that was woven into the prompt:
```
What LiLa added to your prompt:
✅ Jake's age (10) — calibrates grade-level content
✅ Learning style (visual) — prompts the AI to use diagrams
✅ Interest (Minecraft) — makes examples relatable  
✅ Current challenge (fractions) — from Jake's Archives
✅ Best Intention (build independence) — aligns suggestions with your family goal
✅ Structured output request — ensures specific, actionable response
```
Each item briefly explains WHY it was added — this is the teaching moment.

**Interactions:**
- Copy is single-tap, immediately copies
- Edit in Notepad sends the prompt content to a new Smart Notepad tab (stub until PRD-08)
- Save as Template opens an inline form for naming and categorizing
- "What did I add?" toggles the explainer with smooth expand/collapse animation

**Data created/updated:**
- `optimizer_outputs` record stores the prompt text, prompt type, context snapshot, and explainer data

### Screen: Prompt Templates (Mom Only)

Accessible from the Optimizer drawer via a "My Templates" button in the history view, or from the Library Vault.

**What the user sees:**

**My Saved Templates section:**
- List of templates mom has saved, sorted by most recently used
- Each template card shows: name, category tag, last used date, usage count
- Tap a template to load it into a new Optimizer conversation with context auto-filled
- Swipe to reveal: Edit, Duplicate, Delete
- Templates with placeholders show them as highlighted chips (e.g., [CHILD_NAME] renders as a tappable chip that opens a person picker)

**Starter Templates section (from Library Vault):**
- Grid of system-provided prompt templates, organized by category
- Each card shows: title, short description, category tag, "Customize & Save" button
- Tapping "Customize & Save" opens the template in the Optimizer drawer with family context auto-filled and all placeholders resolved. Mom can edit the result, then save to her personal templates.

**Interactions:**
- Tapping a saved template creates a new Optimizer conversation with the template pre-loaded and context freshly assembled
- Placeholder chips are tappable — person picker for [CHILD_NAME], text input for open placeholders
- "Customize & Save" on starter templates runs the template through the Optimizer's context assembly, presents the result for editing, and saves on confirmation

**Data created/updated:**
- `user_prompt_templates` records

### Screen: Context Presets (Within Context Settings)

Context presets appear as a new section within the Context Settings screen defined in PRD-05.

**What the user sees:**

**Preset list:**
- System-provided presets listed in a drag-and-drop reorderable list
- Each preset shows: name, on/off toggle, brief description of what context it includes
- "Auto-Detect" is always first and cannot be reordered (it's the default)
- Remaining presets can be reordered by drag-and-drop to reflect mom's priority

**Preset detail (tap to expand):**
- Expandable section showing which context categories are included/excluded
- Checkboxes per category — mom can customize what each preset loads
- "Reset to Default" button per preset

**Interactions:**
- Toggle a preset off to hide it from the Optimizer's preset dropdown
- Drag-and-drop to reorder (order affects the preset dropdown in the Optimizer)
- Tap to expand and customize which context fields the preset includes
- Changes save optimistically with server sync

**Data created/updated:**
- `context_presets` records (preset configuration per family)

### Screen: Usage & Credits (Accessible from Usage Indicator)

**What the user sees:**

**Usage summary:**
- Visual thermometer showing current month's optimization count vs. limit
- "23 of 50 optimizations used this month. Resets [date]."
- Breakdown: how many were Quick Optimize vs. Walk Me Through It (informational)

**AI Credit Packs:**
- Option to purchase additional optimization credits
- Credit packs available in small/medium/large bundles
- Credits roll over month to month — never expire
- Current credit balance displayed

**Tier upgrade prompt (when near limit):**
- Gentle mention: "Need more? [Higher tier] includes [X] optimizations per month."
- Not pushy — informational only

**Data created/updated:**
- `ai_usage_tracking` records (per-optimization tracking)
- `ai_credit_balance` on the family record

---

## The Optimization Pipeline

### How the Optimizer Processes a Request

```
Mom sends a message
    ↓
1. CROSS-MODE CHECK
   Is this actually a prompt crafting request?
   If mom seems to want direct help (emotional processing, venting,
   general question), offer to switch to General Chat.
    ↓
2. REQUEST TYPE DETECTION (JavaScript — free)
   Pattern match against known prompt types using detection_keywords
   and detection_patterns from the optimization_patterns table.
   Falls back to "general" if no strong match.
    ↓
3. CONTEXT PRESET SELECTION (JavaScript — free)
   If Auto-Detect: select preset based on detected request type
   If manual preset active: use that preset's configuration
    ↓
4. CONTEXT ASSEMBLY (JavaScript — free)
   Run the PRD-05 context assembly pipeline with the active preset's
   context categories. Apply three-tier toggle filtering.
   Privacy Filtered content always excluded.
    ↓
5. SMART QUESTION FILTERING (JavaScript — free)
   Scan assembled context for gaps relative to the prompt type's
   required_context fields.
   If Quick Optimize mode:
     - Proceed with available context, note any gaps in the explainer
     - If request is vague, offer one clarifying nudge
   If Walk Me Through It mode:
     - Ask 1-2 questions ONLY for missing required context
     - Never ask what context already answers
    ↓
6. OPTIMIZATION DECISION (JavaScript — free)
   Can this request be handled by template assembly?
     YES (80% of requests) → Step 7A
     NO (complex/emotional/novel) → Step 7B
    ↓
7A. TEMPLATE ASSEMBLY (JavaScript — free)
    Select the matching template from optimization_patterns.
    Fill placeholders with assembled context.
    Apply optimization rules (tone, structure, output format).
    → Step 8
    
7B. AI OPTIMIZATION (Sonnet API call — ~20% of requests)
    Send the request + assembled context + optimization rules
    to Sonnet via LiLaEdge. AI crafts the prompt with full
    reasoning capability.
    → Step 8
    ↓
8. OUTPUT FORMATTING
   Package the optimized prompt as a prompt card.
   Generate the "What did I add?" explainer data.
   Detect prompt category (text, conversation_flow, image, search).
   Attach platform suggestion based on mom's preferences.
    ↓
9. CONTEXT LEARNING CHECK (Haiku — low cost)
   Scan the conversation for new family information mentioned by mom.
   If detected, queue a "Want me to save this?" offer for after
   the prompt card is delivered.
```

### Prompt Types

The Optimizer categorizes every output into one of these types:

| Prompt Category | Description | MVP? |
|---|---|---|
| **Text** | Standard prompts for any LLM — homework, meals, behavior, creative, etc. | Yes |
| **Conversation Flow** | Multi-turn scripts with context and pause points. Mom pastes the whole thing to start a guided LLM conversation. | Yes |
| **Image** | Prompts formatted for image generation platforms (Midjourney, DALL-E, Ideogram). Very different syntax. | Post-MVP |
| **Search/Research** | Prompts optimized for search-oriented tools (Perplexity-style). | Post-MVP |

### Smart Question Filtering

The Optimizer should never ask a question whose answer is already available in context. This is a two-layer system:

**Layer 1 — JavaScript pre-scan (before any AI call):**
For the detected prompt type, check the `required_context` fields against assembled context. Build a "known" map and a "missing" map. Pass both to the AI (if an AI call is needed) or use the "missing" map to generate clarifying questions from the pattern's `clarifying_questions` field.

**Layer 2 — AI behavioral instruction (in system prompt):**
When the AI is involved, the system prompt explicitly states: "The following context is already known — do not ask the user to confirm or re-provide any of this information: [known context summary]. Only ask about: [missing context summary]."

### Cross-Mode Awareness

The Optimizer recognizes when mom's request isn't actually about prompt crafting:

**Auto-redirect triggers:**
- Emotional distress signals ("I'm so stressed," "I don't know what to do," "everything is falling apart")
- Direct questions that don't need a prompt ("what time is soccer practice?", "how do I change my theme?")
- Troubleshooting/support requests ("this feature isn't working," "I can't find my archives")

**Response pattern:**
LiLa acknowledges what mom is going through and offers a choice:
"It sounds like you're working through something right now. Want me to switch you to General Chat so LiLa can help you directly? Or if you'd like to take this to your favorite LLM, I can craft a prompt that captures the situation."

If the redirect is clearly a Help or Assist topic (support question, feature guidance), LiLa auto-routes with a brief explanation: "That's a great question for LiLa Help — let me switch you over."

> **Decision rationale:** Soft redirect rather than hard boundary was chosen because mom shouldn't feel punished for opening the "wrong" mode. The Optimizer is emotionally intelligent enough to recognize what mom actually needs and route her there gracefully.

---

## Prompt Templates System

### User-Created Templates

When mom taps "Save as Template" on a prompt card:

1. Inline form appears below the card:
   - Template name (auto-suggested based on prompt type + people involved)
   - Category selector (Meal Planning, Homework, Bedtime Stories, Behavior, etc.)
   - The prompt text, editable, with detected context fields highlighted as `[PLACEHOLDER]` chips
2. Mom can convert specific values back to placeholders (e.g., change "Jake" to `[CHILD_NAME]`) for reusability
3. Save confirms and adds to My Templates

### Starter Templates (Library Vault)

System-provided prompt templates that live in the Library Vault. These are curated, high-quality prompts covering common mom use cases.

**"Customize & Save" flow:**
1. Mom browses starter templates in the Library Vault
2. Taps "Customize & Save" on a template
3. Optimizer drawer opens with the template pre-loaded
4. Placeholders auto-fill from family context (person picker for `[CHILD_NAME]`, auto-fill for `[AGE]`, `[INTERESTS]`, etc.)
5. Mom reviews, edits if desired, saves to her personal templates
6. The saved version retains placeholders for fields that should change per-use (like `[CHILD_NAME]`) while baking in stable context (like dietary restrictions)

### Template Placeholders

| Placeholder | Auto-fills From | Behavior |
|---|---|---|
| `[CHILD_NAME]` | Person selector | Opens person picker on use |
| `[AGE]` | Archives / Person profile | Auto-fills, editable |
| `[INTERESTS]` | Archives / Person profile | Auto-fills as comma list, editable |
| `[SUBJECT]` | Mom's request or manual entry | Text input if not detected |
| `[LEARNING_STYLE]` | Archives / Person profile | Auto-fills if available |
| `[DIETARY_NEEDS]` | Archives / Family context | Auto-fills, editable |
| `[BEST_INTENTION]` | Active Best Intentions | Auto-fills most relevant, editable |
| `[FAMILY_SIZE]` | Family member count | Auto-fills |
| `[CUSTOM]` | Manual entry | Always prompts for input |

---

## Context Presets

### System-Provided Presets

| Preset | Auto-Detect Triggers | Context Loaded |
|---|---|---|
| **Auto-Detect** (default, always first) | — | Optimizer selects based on request |
| **Homework Help** | homework, study, school, test, learn, grade, assignment | Learning styles, academic challenges, Best Intentions (learning), recent victories |
| **Meal Planning** | dinner, lunch, meal, cook, recipe, eat, grocery | Dietary restrictions, food preferences, family size, schedules, faith dietary laws |
| **Behavior Guidance** | behavior, discipline, conflict, argue, fight, sibling | Personality traits, challenges, Best Intentions (relationship), family values |
| **Spiritual Questions** | faith, pray, God, church, spiritual, values, moral | Faith preferences, family values, Best Intentions (faith), observances |
| **Schedule Management** | plan, calendar, schedule, organize, routine, week | Schedules, activities, commitments, preferences |
| **Creative & Fun** | story, draw, art, imagine, create, game, play, craft | Interests, personality, age, favorites |
| **Communication** | talk to, tell, explain, conversation, say to, how to say | Personality, relationship dynamics, challenges, Best Intentions, communication style |

### Preset Customization

Mom can:
- Toggle any preset on/off (hidden from the dropdown when off)
- Reorder via drag-and-drop (order reflects in the Optimizer dropdown)
- Expand a preset to see and edit which context categories it includes
- Reset any preset to its system default

Auto-Detect cannot be toggled off or reordered — it's always the first option.

---

## Context Learning Detection

When mom mentions new family information during an Optimizer conversation, the system detects it and offers to save it to Archives. This is the detection mechanism — the actual write-back to Archives is defined in the Archives PRD.

### Detection Triggers

The Optimizer scans mom's messages for patterns indicating new family information:

- **Preference changes:** "Jake hates broccoli now," "Mia just started loving ballet"
- **Schedule information:** "Soccer practice moved to Tuesdays at 5," "Zy has piano on Wednesdays"
- **Personality observations:** "He's been really anxious about school lately," "She's so much more confident this year"
- **Milestone/life events:** "Jake just turned 11," "We started homeschooling this semester"
- **Relationship dynamics:** "The younger two have been fighting a lot," "Jake and Mia are getting along so much better"
- **Medical/dietary:** "Found out Jake is allergic to peanuts," "We're going dairy-free this month"

### Detection Process

1. **Haiku scan** (low cost) runs on mom's messages, looking for new-information signals
2. If detected, the Optimizer compares against existing Archives context to confirm it's genuinely new (not already stored)
3. After delivering the optimized prompt (never interrupting the primary flow), LiLa offers: "I noticed you mentioned [new info]. Want me to save that to [person]'s Archives? It'll help me optimize better next time."
4. Mom can: Save (adds to appropriate Archives folder), Skip, or Edit before saving

### Cross-Reference Note for Archives PRD

The Archives PRD should define:
- The write-back endpoint that Context Learning calls
- How auto-detected context items are categorized into the correct folder
- Whether auto-detected items go into a "Review" queue or directly into Archives
- The UI for reviewing AI-suggested context additions

---

## "Optimize with LiLa" Entry Point

Library Vault items and other features can launch the Optimizer with pre-loaded context.

### From Library Vault

When a Library Vault item has an "Optimize with LiLa" button:

1. Mom taps the button on the Library Vault item
2. The LiLa drawer opens in Optimizer mode
3. The library item's content is pre-loaded as the starting request
4. If the library item has a `template_context_preset`, that preset is auto-selected
5. The Optimizer processes and delivers a prompt card with the library item's content enriched by family context

### From Conversation Flow Items

When a Library Vault item is a conversation flow template:

1. Mom taps "Optimize with LiLa"
2. Optimizer opens with the flow template loaded
3. Context assembly fills in family details throughout the flow script
4. Mom receives a complete, context-rich conversation flow she can paste into her LLM
5. The flow includes clear step markers and pause points

### From Other Features (Future)

The "Optimize with LiLa" pattern can be extended to any feature that wants to offer prompt crafting. The pattern is:
- Pass a `source_feature`, `source_content`, and optional `context_preset` to the Optimizer
- Optimizer opens in the drawer with the content pre-loaded

---

## Platform Preferences

### Mom's Preferred Platforms

In the Optimizer settings (accessible from the drawer settings or the main Settings page), mom can configure:

**Preferred platform for text prompts:**
- A dropdown with common platforms: ChatGPT, Claude, Gemini, Copilot, Other
- "No preference" option (default) — prompt card shows "Works on any AI"
- If a platform is selected, prompt cards show "Great for [Platform]" with a direct link

**Free platform suggestions:**
For moms who haven't set a preference, the Optimizer includes a helpful note on prompt cards: "New to AI? Try pasting this into [platform with generous free tier] — it's free to use." This helps onboard moms who are new to using LLMs directly.

**Platform links are informational, not functional.** The Optimizer does not send prompts to platforms. It formats them for copy/paste. The link is a convenience so mom can open her preferred platform in a new tab.

> **Decision rationale:** Copy/paste output (not direct API sending) was chosen deliberately. Direct-to-platform sending would require BYOK/OAuth integrations for each platform — significant scope for minimal UX improvement. Copy/paste is universal, works with any platform (including free tiers), and keeps the Optimizer's value proposition simple: we make the context, you choose the destination.

### Platform-Specific Formatting (Post-MVP)

At MVP, all text prompts use a universal format that works well on any major LLM. Post-MVP, a "Format for..." option on prompt cards could adjust prompt structure for platform-specific conventions (e.g., XML tags for Claude, markdown emphasis for ChatGPT). This is polish, not core.

> **Forward note:** Universal prompt formatting is a launch-scoped constraint. Most moms won't notice the difference between platform-optimized and universal prompts, but power users may eventually want this. The architecture supports adding it without refactoring.

---

## Visibility & Permissions

| Role | Access | Notes |
|---|---|---|
| Mom / Primary Parent | Full | Only user with Optimizer access. Drawer-based. |
| Dad / Additional Adult | None | Optimizer is mom-only. Dad accesses other LiLa tools via modals. |
| Special Adult | None | No Optimizer access. |
| Independent (Teen) | None | Teen Lite Optimizer is a separate future tool (see Stubs). |
| Guided / Play | None | No Optimizer access. |

### Shell Behavior

| Shell | Optimizer Access | Notes |
|-------|-----------------|-------|
| Mom | Full access — floating button, drawer mode, all features | Primary and only Optimizer user |
| Dad / Additional Adult | Not present | Optimizer is mom-only. Dad accesses other LiLa tools via permission-gated modals. |
| Special Adult | Not present | No Optimizer access. Special Adults have shift-scoped tool access only. |
| Independent (Teen) | Not present | Teen Lite Optimizer is a separate future tool (see Stubs). |
| Guided / Play | Not present | No Optimizer access. |

> **Decision rationale:** Optimizer is mom-only because the core value proposition (family context portability) is a mom workflow. Dad doesn't need to craft prompts about the family — he has direct LiLa tool access. Teens get a future Teen Lite Optimizer with homework-specific guardrails.

---

## Data Schema

### Table: `optimizer_outputs`

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| conversation_id | UUID | | NOT NULL | FK → lila_conversations |
| message_id | UUID | | NOT NULL | FK → lila_messages. The message containing this prompt card. |
| original_request | TEXT | | NOT NULL | Mom's original input text |
| prompt_type | TEXT | 'general' | NOT NULL | Detected prompt type (homework, meal_planning, behavior, etc.) |
| prompt_category | TEXT | 'text' | NOT NULL | text, conversation_flow, image, search |
| optimized_prompt | TEXT | | NOT NULL | The final optimized prompt text |
| context_snapshot | JSONB | '{}' | NOT NULL | What context was included (for "What did I add?" explainer) |
| context_preset_used | TEXT | 'auto_detect' | NOT NULL | Which preset was active |
| optimization_method | TEXT | 'template' | NOT NULL | 'template' (JS assembly) or 'ai' (Sonnet call) |
| was_copied | BOOLEAN | false | NOT NULL | Whether mom copied the prompt |
| was_edited | BOOLEAN | false | NOT NULL | Whether mom sent to Notepad for editing |
| was_saved_as_template | BOOLEAN | false | NOT NULL | Whether mom saved as a template |
| tokens_used | INTEGER | 0 | NOT NULL | Tokens consumed (0 for template-assembled prompts) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Mom can CRUD her own family's outputs. No other member access.

**Indexes:**
- `family_id, created_at DESC` (usage history)
- `family_id, prompt_type` (analytics: which types are most used)
- `conversation_id` (link to conversation)

### Table: `optimization_patterns`

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| prompt_type | TEXT | | NOT NULL | Unique identifier: homework, meal_planning, etc. |
| prompt_category | TEXT | 'text' | NOT NULL | text, conversation_flow, image, search |
| detection_keywords | TEXT[] | '{}' | NOT NULL | Words that trigger this type |
| detection_patterns | TEXT[] | '{}' | NOT NULL | Regex patterns for matching |
| required_context | TEXT[] | '{}' | NOT NULL | Context fields that must be present |
| optional_context | TEXT[] | '{}' | NOT NULL | Context fields that enrich if available |
| clarifying_questions | JSONB | '[]' | NOT NULL | Questions to ask if context is missing |
| template | TEXT | | NOT NULL | Prompt template with placeholders |
| optimization_rules | JSONB | '{}' | NOT NULL | Rules for AI-powered optimization |
| is_active | BOOLEAN | true | NOT NULL | |
| sort_order | INTEGER | 0 | NOT NULL | Display order |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Read-only for all authenticated users. System-managed (admin-seeded, not user-editable).

**Indexes:**
- `prompt_type` (UNIQUE — one pattern per type)
- `is_active` (filter active patterns)

### Table: `user_prompt_templates`

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| template_name | TEXT | | NOT NULL | User-chosen name |
| template_description | TEXT | | YES | Optional description |
| prompt_type | TEXT | 'general' | NOT NULL | Category: homework, meal_planning, etc. |
| prompt_category | TEXT | 'text' | NOT NULL | text, conversation_flow |
| template_text | TEXT | | NOT NULL | Template with [PLACEHOLDER] tokens |
| placeholder_map | JSONB | '{}' | NOT NULL | Maps placeholders to context sources |
| context_preset | TEXT | 'auto_detect' | NOT NULL | Which preset to auto-load |
| usage_count | INTEGER | 0 | NOT NULL | How many times used |
| last_used_at | TIMESTAMPTZ | | YES | |
| sort_order | INTEGER | 0 | NOT NULL | User-defined order |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Mom can CRUD her own family's templates. No other member access.

**Indexes:**
- `family_id, last_used_at DESC` (most recently used)
- `family_id, prompt_type` (filter by category)

### Table: `context_presets`

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| preset_key | TEXT | | NOT NULL | System key: homework_help, meal_planning, etc. |
| display_name | TEXT | | NOT NULL | User-visible name |
| is_enabled | BOOLEAN | true | NOT NULL | Whether this preset appears in the dropdown |
| sort_order | INTEGER | 0 | NOT NULL | Drag-and-drop order |
| context_categories | JSONB | '{}' | NOT NULL | Which context categories to include/exclude |
| is_system | BOOLEAN | true | NOT NULL | System-provided (true) vs user-created (false, future) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Mom can read and update her family's presets. Cannot delete system presets (only toggle off). System presets are seeded on family creation.

**Indexes:**
- `family_id, is_enabled, sort_order` (dropdown query)
- `family_id, preset_key` (UNIQUE — one preset per key per family)

### Table: `ai_usage_tracking`

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| usage_type | TEXT | | NOT NULL | 'optimizer_quick', 'optimizer_walkthrough', 'context_learning', etc. |
| tokens_consumed | INTEGER | 0 | NOT NULL | Tokens used for this operation |
| optimization_method | TEXT | | NOT NULL | 'template' or 'ai' |
| billing_period | TEXT | | NOT NULL | 'YYYY-MM' format for monthly rollup |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Mom can read her own family's usage. System writes on each optimization.

**Indexes:**
- `family_id, billing_period` (monthly usage query)
- `family_id, created_at DESC` (usage history)

### Addition to `families` table (or `family_settings`)

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| ai_credit_balance | INTEGER | 0 | NOT NULL | Purchased AI credits remaining (roll over) |
| preferred_platform | TEXT | | YES | Mom's preferred LLM platform |
| optimizer_mode_default | TEXT | 'quick' | NOT NULL | 'quick' or 'walkthrough' — mom's default mode |

---

## Flows

### Incoming Flows (How Data Gets INTO the Optimizer)

| Source | How It Works |
|---|---|
| Optimizer floating button (mom shell) | Opens drawer in Optimizer mode, new conversation |
| Mode switcher (within drawer) | Switches active conversation to Optimizer mode |
| "Optimize with LiLa" button (Library Vault) | Opens drawer with library item pre-loaded as starting request |
| Conversation history | Reopening a past Optimizer conversation |
| Context assembly pipeline | Pulls active context per the selected preset and three-tier toggles |
| My Templates | Loading a saved template creates a new Optimizer conversation |
| Smart Notepad "Send to..." | "Send to → LiLa Optimizer" sends full tab content as Optimizer input (wired by PRD-08) |

### Outgoing Flows (How the Optimizer Feeds Others)

| Destination | How It Works |
|---|---|
| Clipboard (external) | Copy button on prompt cards — mom pastes into her LLM of choice |
| Smart Notepad | "Edit in Notepad" sends prompt text to a new notepad tab (stub) |
| User Prompt Templates | "Save as Template" saves the prompt structure for reuse |
| Archives (Context Learning) | When new family info is detected, offers to save to Archives (stub — write-back defined in Archives PRD) |
| Review & Route | Action chip on messages triggers extraction pipeline (stub) |
| Conversation History | All conversations auto-save with "LiLa Optimizer" mode tag |

### Notepad Integration (Bidirectional — wired by PRD-08)

> **Depends on:** Smart Notepad "Send to..." grid and tab creation — defined in PRD-08, Screen 1 and Flows section.

- **Notepad → Optimizer:** User selects "Send to... → LiLa Optimizer" from the Notepad Send To grid. Full tab content sent as Optimizer input.
- **Multiple sends are additive:** If user sends Tab A, then sends Tab B, Tab B's content appends below Tab A's in the Optimizer workspace. Content accumulates until user clears or starts a new session.
- **Optimizer → Notepad:** Optimizer output can be sent to a Notepad tab via "Edit in Notepad" for further refinement before external use. Creates tab with `source_type = 'lila_optimizer'`.

---

## AI Integration

### Guided Mode Registration

The Optimizer's registry entry (already defined in PRD-05):

| Field | Value |
|---|---|
| mode_key | `optimizer` |
| display_name | LiLa Optimizer |
| parent_mode | — (core mode) |
| avatar | lila-opt.png |
| model_tier | sonnet |
| context_sources | All (filtered by active preset) |
| person_selector | No (detected from request) |
| opening_messages | See below |
| system_prompt_key | optimizer_system |
| available_to_roles | ['mom'] |
| requires_feature_key | lila_optimizer |

### Opening Messages (Rotating, 3+ Variants)

- "Hey! Ready to craft something? Tell me what you need, and I'll build you the perfect prompt — packed with everything your AI needs to know about your family."
- "Hi there! What are we working on? Whether it's homework help, meal planning, or something creative, I'll turn your idea into a prompt any AI will love."
- "Welcome back! Got a request? Give me the short version and I'll handle the rest — or tap 'Walk Me Through It' if you want to build it together."

### System Prompt Notes

Key behavioral rules for the Optimizer's system prompt:

- **Identity:** You are LiLa Optimizer — your job is to craft prompts, not answer questions. Every response should either produce an optimized prompt, ask a clarifying question on the way to producing one, or redirect to a more appropriate LiLa mode.
- **Never answer directly.** If mom asks "what should I make for dinner?", don't suggest recipes — craft a prompt that will get her the best dinner suggestions from her LLM of choice, enriched with her family's dietary needs, preferences, and schedule.
- **Context is your superpower.** Always weave in relevant family context. Explain what you added and why via the "What did I add?" section.
- **Respect the mode selector.** Quick Optimize = deliver fast. Walk Me Through It = ask smart questions first. Never ask unnecessary questions in Quick mode.
- **Smart question filtering.** Never ask for information that's already in the assembled context. Check before asking.
- **Warm and encouraging.** Same brand voice as all LiLa versions — supportive, never condescending, celebrates mom's effort.
- **Cross-mode awareness.** If the request isn't about prompt crafting, acknowledge and offer to redirect.
- **Conversation flows.** When the request suits a multi-turn guided process (meal planning, behavior prep, party planning), offer to produce a conversation flow prompt instead of a single prompt.
- **Teaching moments.** The "What did I add?" explainer should help mom learn what makes prompts effective. Over time, she becomes a better prompt crafter herself.

---

## Edge Cases

### Empty Context
If no context sources are active (all toggled off) or the family has just started and hasn't populated Archives yet, the Optimizer still functions but with reduced personalization. LiLa notes: "I don't have much family context loaded yet, so this prompt is more general than usual. As you add to your Archives, my prompts will get much more personalized."

### Vague Request in Quick Optimize
If the request is too vague to produce a useful prompt (e.g., "help"), LiLa gently nudges: "I'd love to help! Could you give me a bit more to work with? Something like 'help Jake with math' or 'plan meals for this week' — even a short version lets me pull in the right context."

### Request Doesn't Match Any Pattern
If the request type isn't in the optimization_patterns table, the Optimizer falls back to the "general" pattern, which uses AI (Sonnet) to craft a well-structured, context-enriched prompt. The 80/20 split means novel request types are handled gracefully, just at slightly higher cost.

### Context Preset Mismatch
If Auto-Detect selects a preset that doesn't feel right to mom, she can manually switch presets mid-conversation. The Optimizer re-assembles context with the new preset and regenerates the prompt if asked.

### Usage Limit Reached
When mom hits her monthly optimization limit, the Optimizer responds warmly: "You've been busy this month! Your optimization limit refreshes on [date]. Want to grab an AI credit pack to keep going?" The drawer doesn't close or lock — mom can still browse templates and history, just not generate new optimizations.

### Conversation Flow Too Long for Clipboard
If a conversation flow prompt is very long, the Copy button still copies the full text, but LiLa adds a note: "This is a longer flow — you might want to use 'Edit in Notepad' first to review it, then copy from there."

### Network Failure During Optimization
If the AI call fails (for the 20% that need it), the user's request stays visible with an error indicator and "Retry" button. Template-assembled prompts (80%) are unaffected by network issues since they're generated client-side.

### Context Learning False Positive
If the Optimizer detects "new" information that's actually already in Archives (the comparison missed it), mom simply taps "Skip" on the save offer. No harm done. The detection should err on the side of offering rather than missing genuinely new information.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|---|---|---|
| `lila_optimizer` | LiLa Optimizer mode access | Enhanced |
| `optimizer_templates` | User prompt templates (save/manage) | Enhanced |
| `optimizer_starter_templates` | Library Vault starter templates | Enhanced |
| `optimizer_context_presets` | Context preset customization | Enhanced |
| `optimizer_credits` | AI credit pack purchasing | Enhanced |
| `optimizer_usage_tier_enhanced` | Enhanced tier monthly optimization cap | Enhanced |
| `optimizer_usage_tier_fullmagic` | Full Magic tier monthly optimization cap | Full Magic |
| `optimizer_usage_tier_creator` | Creator tier monthly optimization cap | Creator |

All return `true` during beta. Usage caps are enforced via the `ai_usage_tracking` table; exact cap numbers are tuned during beta based on real usage data.

> **Tier rationale:** The Optimizer is the flagship AI feature and the primary reason to upgrade from Essential (mom-only) to Enhanced (connected family). Placing it at Enhanced — not Essential — creates the clearest upgrade incentive while keeping the core platform (Help, Assist, General Chat) free at Essential tier. Credit packs provide a softer upsell path for power users who don't need a full tier upgrade.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|---|---|---|
| Context Learning write-back to Archives | Archives save endpoint, folder routing, review queue | Archives PRD |
| "Edit in Notepad" on prompt cards | Smart Notepad integration | PRD-08 (Journal + Smart Notepad) |
| Review & Route action chip on messages | Extraction pipeline | PRD-08 (Journal + Smart Notepad) |
| Image prompt optimization (Midjourney, DALL-E, Ideogram) | Platform-specific image prompt syntax | Future Optimizer enhancement |
| Search/Research prompt optimization (Perplexity-style) | Search-oriented prompt formatting | Future Optimizer enhancement |
| Platform-specific text formatting ("Format for...") | Per-platform prompt structure adjustments | Future Optimizer enhancement |
| Teen Lite Optimizer | Homework-focused prompt crafting for teens | Future teen tools PRD |
| Prompt fix/diagnosis mode | "My prompt isn't working" debugging tool | Future Optimizer enhancement |
| AI credit pack purchasing | Payment integration, credit balance management | Payments/billing PRD |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|---|---|---|
| LiLa Optimizer mode (entry point and registry slot) | PRD-05 | Fully implemented: optimization pipeline, prompt cards, templates, presets, usage tracking |
| Optimize with LiLa button pattern (Library Vault) | Library Vault concept (v1) | Defined: opens Optimizer drawer with library item pre-loaded |
| Context Learning detection | PRD-05 (stub to Archives PRD) | Detection mechanism defined; write-back remains stub for Archives PRD |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Optimizer mode activates from floating button, opens drawer in Optimizer mode
- [ ] Two optimization modes: Quick Optimize and Walk Me Through It, selectable per-conversation
- [ ] Request type detection identifies common prompt types (homework, meals, behavior, creative, schedule, communication)
- [ ] Context preset auto-detection selects appropriate context based on request
- [ ] Manual context preset selection available via dropdown
- [ ] Smart question filtering: never asks for information already in assembled context
- [ ] Template-based optimization (JavaScript assembly) works for well-matched prompt types
- [ ] AI-powered optimization (Sonnet) works for complex/novel requests
- [ ] Optimized prompts render as prompt cards with: Copy, Edit in Notepad (stub), Save as Template
- [ ] "What did I add?" explainer toggle on prompt cards shows which context was used and why
- [ ] Conversation flow prompts: multi-turn scripts with context and pause points
- [ ] Cross-mode awareness: redirects non-prompt-crafting requests to appropriate LiLa mode
- [ ] User prompt templates: save, name, categorize, reuse with auto-filled placeholders
- [ ] Context presets: system-provided, togglable, reorderable via drag-and-drop, customizable
- [ ] Usage thermometer: shows monthly optimization count vs. limit
- [ ] Soft throttle: warm messaging when approaching or reaching monthly limit
- [ ] Opening messages rotate (3+ variants)
- [ ] Platform preference setting in Optimizer settings
- [ ] Prompt cards show platform suggestion with link based on preferences
- [ ] Context Learning detection: identifies new family info, offers to save (write-back is stub)
- [ ] `optimization_patterns` table seeded with core prompt type patterns
- [ ] `context_presets` table seeded with system presets on family creation
- [ ] RLS policies enforce mom-only access on all Optimizer tables
- [ ] Conversation history tagged with "LiLa Optimizer" mode label

### MVP When Dependency Is Ready
- [ ] Edit in Notepad wires to Smart Notepad when PRD-08 is built
- [ ] Review & Route wires to extraction pipeline when PRD-08 is built
- [ ] Context Learning write-back wires to Archives when Archives PRD is built
- [ ] Starter templates appear in Library Vault when Library Vault PRD is built
- [ ] "Optimize with LiLa" button on Library Vault items when Library Vault PRD is built

### Post-MVP
- [ ] Image prompt optimization (Midjourney, DALL-E, Ideogram platform-specific syntax)
- [ ] Search/research prompt optimization
- [ ] Platform-specific text formatting ("Format for..." dropdown on prompt cards)
- [ ] Prompt fix/diagnosis mode ("my prompt isn't working" debugging)
- [ ] AI credit pack purchasing and balance management
- [ ] Teen Lite Optimizer (separate tool, separate PRD)
- [ ] Multi-AI comparison capabilities (existing Puppeteer prototype reference, not in current scope)
- [ ] Context Learning expanded: detects Best Intention relevance, schedule patterns, relationship dynamics

> **Forward note:** Image and search prompt types are deferred because they require fundamentally different prompt structures (Midjourney syntax, Perplexity query optimization) that would add significant scope without serving the broadest user base at launch. Text and conversation flow prompts cover the vast majority of mom use cases. The Puppeteer-based Multi-AI Panel prototype exists but is deprioritized — time spent on Library Vault tools and tutorials serves more moms than a multi-model comparison feature.

---

## CLAUDE.md Additions from This PRD

- [ ] LiLa Optimizer: strictly prompt crafting and conversation flow generation. Never answers mom's questions directly — always produces a prompt for her to take to an LLM. If the request isn't about prompt crafting, redirect to General Chat or appropriate mode.
- [ ] Two optimization modes: Quick Optimize (immediate, default) and Walk Me Through It (conversational, asks smart questions). Mode selector is per-conversation, visible in drawer.
- [ ] 80/20 cost model: 80% of optimizations are JavaScript template assembly (free). 20% use Sonnet for complex/novel requests. The `optimization_method` field on `optimizer_outputs` tracks which path was used.
- [ ] Smart question filtering: two-layer system. JavaScript pre-scans context for known answers, then AI system prompt explicitly states what's already known. Never ask for context that's already available.
- [ ] Prompt cards: optimized prompts render as styled cards in conversation with Copy, Edit in Notepad, Save as Template, and "What did I add?" explainer toggle.
- [ ] Context presets: system-seeded on family creation, mom-customizable (toggle, reorder, edit categories). Auto-Detect is always first and cannot be disabled.
- [ ] Prompt templates: user-created saves + system starter templates in Library Vault with "Customize & Save" flow. Support `[PLACEHOLDER]` tokens that auto-fill from context.
- [ ] Conversation flow prompts: a distinct prompt category that produces multi-turn scripts with context baked in and pause points for LLM interaction.
- [ ] Context Learning: Optimizer detects new family info in conversation, offers to save. Detection defined in PRD-05C; write-back defined in Archives PRD.
- [ ] Usage tracking: tier-based monthly caps, usage thermometer in drawer, soft throttle with warm messaging. AI credit packs (purchasable, rollover) for power users. Exact caps tuned during beta.
- [ ] Cross-mode awareness: Optimizer recognizes emotional distress, support questions, and feature guidance requests, and offers to redirect to appropriate LiLa mode.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `optimizer_outputs`, `optimization_patterns`, `user_prompt_templates`, `context_presets`, `ai_usage_tracking`
Columns added to `families` (or `family_settings`): `ai_credit_balance`, `preferred_platform`, `optimizer_mode_default`
Enums updated: none (using TEXT with CHECK constraints)
Triggers added: `set_updated_at` on `optimization_patterns`, `user_prompt_templates`, `context_presets`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **BYOK removed from scope entirely** | The 80/20 cost strategy already handles the cost ceiling concern. BYOK's other justification (direct-to-platform sending) is out of scope since copy/paste is the delivery model. |
| 2 | **Multi-AI Panel deferred with one-line mention only** | Existing Puppeteer prototype works but would need full reengineering. Time better spent on Library Vault tools/tutorials that serve more moms. |
| 3 | **Two explicit optimization modes (Quick Optimize / Walk Me Through It)** | Auto-detection felt unpredictable. Explicit modes respect mom's time when she's confident and provide guided support when she's not. Smart nudge bridges the gap for vague Quick requests. |
| 4 | **Prompt types instead of platform targets** | Platform selection was coupled to the Multi-AI Panel. With that deferred, the Optimizer categorizes by prompt type (text, conversation flow, image, search) and uses universal formatting for text prompts at MVP. |
| 5 | **Universal text prompt formatting at MVP** | A well-crafted prompt works on any major LLM. Platform-specific formatting (XML for Claude, etc.) is post-MVP polish. |
| 6 | **Copy/paste delivery, no direct API sending** | Direct-to-platform would require OAuth/BYOK per platform — massive scope for minimal UX gain. Copy/paste is universal and keeps complexity down. |
| 7 | **Context presets: system-provided, mom-customizable** | Mom can toggle, reorder (drag-and-drop), and edit preset contents. Auto-Detect is always first and cannot be disabled. |
| 8 | **User-created templates + system starter library** | Starter templates in Library Vault with "Customize & Save" flow. User saves are personal only. Placeholders auto-fill from context. |
| 9 | **Conversation flow prompts as a distinct output type** | Multi-turn scripts with context baked in and pause points. A differentiated feature — mom pastes the whole flow into her LLM and it walks her through a process. |
| 10 | **Soft cross-mode redirect for non-prompt requests** | Optimizer recognizes emotional distress and non-prompt requests, offers to switch to General Chat rather than producing a tone-deaf prompt. |
| 11 | **Tier-based usage caps with thermometer and credit packs** | Exact numbers tuned during beta. Soft throttle with warm messaging. Credits are purchasable and roll over. |
| 12 | **No active recommendation for or against any specific LLM platform** | Mom chooses her own platforms. A separate "Meet the LLMs" content project (outside PRD scope) will eventually cover pros/cons/strengths. |
| 13 | **Pattern Library is content, not architecture** | PRD defines the mechanism (pattern table structure, detection pipeline, template assembly). Actual patterns are authored in a separate content sprint using the Optimizer Pattern Library Authoring Guide. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Image prompt optimization (Midjourney, DALL-E, Ideogram) | Future Optimizer enhancement PRD |
| 2 | Search/research prompt optimization (Perplexity-style) | Future Optimizer enhancement PRD |
| 3 | Platform-specific text formatting ("Format for...") | Future Optimizer enhancement PRD |
| 4 | Prompt fix/diagnosis mode | Future Optimizer enhancement PRD |
| 5 | AI credit pack purchasing (payment integration) | Payments/billing PRD |
| 6 | Teen Lite Optimizer | Future teen tools PRD |
| 7 | Multi-AI Panel / Puppeteer prototype integration | Not currently planned — existing prototype available as reference if revisited |
| 8 | BYOK (Bring Your Own Key) | Removed from scope. Not planned for any phase. |
| 9 | Optimization pattern content authoring | Pre-build content sprint using Optimizer Pattern Library Authoring Guide (separate document created) |
| 10 | Context Learning write-back to Archives | Archives PRD defines the save endpoint and folder routing |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-05 Planning Decisions Addendum | BYOK and Multi-AI Panel removed from Optimizer scope description | Update the "Decisions Affecting LiLa Optimizer PRD" section to remove BYOK and reduce Multi-AI Panel to a brief reference |
| PRD-05 (LiLa Core) | Notepad context source added; Edit in Notepad and Review & Route action chips now cross-referenced to PRD-08 | Apply PRD-08 Cross-PRD Impact Addendum changes |
| PRD-06 (Guiding Stars & Best Intentions) | Best Intentions keywords referenced by Optimizer context presets | Ensure `is_included_in_ai` on `best_intentions` table; add `source` and `source_reference_id` columns for Notepad routing traceability |

---

*End of PRD-05C*
