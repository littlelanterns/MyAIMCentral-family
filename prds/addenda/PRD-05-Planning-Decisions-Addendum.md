# PRD-05 Planning Decisions: Cross-PRD Impact Addendum

**Purpose:** Decisions made during PRD-05 (LiLa Core AI System) planning that affect other PRDs and areas of development outside PRD-05's scope. Upload this to project knowledge so future PRD conversations have access to these architectural decisions.

**Created:** March 3, 2026
**Session:** PRD-05 clarifying questions and design discussion

---

## Decisions Affecting PRD-04 (Shell Routing & Layouts)

A separate update prompt has been created for PRD-04. Key changes:

1. **Three LiLa floating buttons** (not two): Help (open arms), Assist (clipboard), Optimizer (thinking). Mom shell only. All other shells get Settings only.
2. **Fourth LiLa avatar — Sitting LiLa:** Meditative pose with glowing heart. Used as the drawer's resting/idle state for general conversation.
3. **LiLa drawer is mom-only for MVP.** Dad, teens, and guided members access LiLa tools through permission-gated modals, not the drawer.
4. **Guided shell gets limited LiLa tool access** via modals (changed from "No LiLa"). Mom controls per-tool access. All guided conversations visible to mom by default.
5. **Architecture is container-agnostic:** Conversation engine works identically in drawer (mom) and modals (everyone else). Upgrading dad/teens to full drawer at Full Magic tier ($24.99) is a configuration change, not a rebuild.

---

## Decisions Affecting Archives PRD

### Three-Tier Context Toggle System

Every context source in the app uses a shared `is_included_in_ai` pattern with three levels of granularity:

1. **Per-person level** — Master toggle for an entire person's context (e.g., "Include Jake's context" on/off)
2. **Per-category level** — Toggle entire categories within a person (e.g., Jake's "personality" on, Jake's "challenges" off)
3. **Per-item level** — Toggle individual entries within a category (e.g., 15 of Jake's 20 personality insights active)

Each person's context card shows a summary indicator: "Gleaning context from 17/28 insights" — giving mom at-a-glance awareness without opening every category.

This same pattern applies to all context sources: uploaded books with extracted insights can have individual insights toggled on/off. It's a "snooze" model (deactivate without deleting), not a delete model.

### Privacy-Filtered Category (System-Enforced)

A "Privacy Filtered" category exists system-wide in Archives. Properties:

- **System-enforced:** Automatically available for every family. Not optional.
- **AI smart routing:** When AI detects sensitive context during conversation or extraction, it auto-routes to the Privacy Filtered category (with a description explaining that this context is not shared with other family members' tools).
- **Mom-managed:** Mom can manually move items to or from the Privacy Filtered category at any time.
- **Hard privacy boundary:** Content in this category is NEVER included in context assembly for any family member's tools other than mom's own LiLa. If dad needs to know something, mom tells him directly; he can add it to his own context manually.
- **Use cases:** A teen's private struggles, sensitive medical details, information siblings don't need to know, anything mom wants LiLa to know but doesn't want surfaced through other members' tools.

### Mom-Controlled Context Sharing for Dad/Teens

When mom grants a family member access to a LiLa tool, she can also configure *who* that member can pull context for within that tool:

- **Per-tool, per-person permissions:** e.g., dad gets Marriage Toolbox with context for mom + all kids, but Higgins with context for kids only.
- **Family-level context:** A separate "Family" context category containing family faith frameworks, food restrictions/preferences, and (later) family vision/goals. Shareable independently from individual person context.
- **Privacy Filtered content is always excluded** regardless of other sharing settings.

### Teen/Dad Self-Insights

Teens and dad can maintain their own personal insights about themselves:

- **Private section:** Insights that only they and AI can see (for their own tool context, e.g., Higgins). Not shared with anyone, including mom. (Though mom seeing their conversations may reveal content — that's a known acceptable tradeoff.)
- **Share with Mom / Share with Dad checkboxes:** Per-insight opt-in sharing. Teens can choose which of their self-insights to share with each parent.
- **Use case:** Miriam writes insights about what she wishes mom would do differently, what communication styles work for her, etc. She can keep these private for her own Higgins context, or share specific ones with mom.
- **Mom's visibility caveat:** If mom has transparency access to a teen's conversations (default for guided, permission-based for independent), she may see the content used in context even if the insight itself isn't "shared." This is an acceptable tradeoff — the sharing toggle controls whether the insight appears in mom's OWN LiLa context, not whether mom can ever discover it exists.

---

## Decisions Affecting People & Relationships / Family Management PRDs

### Higgins Multi-Person Selector with Family Tab

When launching Higgins (or similar person-context tools), the person selector should include a "Family" tab alongside the individual person list. This loads family-level context (faith frameworks, shared values, food preferences, family goals) alongside any selected individual people.

### Context Permissions Cascade

When a non-mom member uses a person-context tool:
1. Tool must be granted by mom (tool-level permission)
2. People context must be granted by mom (per-tool, per-person permission)
3. Privacy Filtered items are always excluded
4. Teen/dad self-insights are included only if that person chose to share them

---

## Decisions Affecting Inner Wisdom / ThoughtSift PRD

### ThoughtSift as a Guided Mode in LiLa

ThoughtSift registers as a guided mode in the LiLa guided mode registry (defined in PRD-05). It uses the same conversation engine, context assembly, and history system. Entry point is the Inner Wisdom portal page, but the conversation happens in the LiLa drawer (for mom) or a modal (for other permitted members).

---

## Decisions Affecting Library Vault PRD

### New Guided Modes as Vault Tools

The following are planned as Library Vault tools that use the guided mode registry:

- **Mediator / Peacemaker** — Input both sides of a disagreement, LiLa helps work through it
- **Decision Guide** — Preloaded with decision-making frameworks (including coin-flip insight: "while the coin is flipping, notice which outcome you hope/fear — that observation is worth noting before your final choice"), walks user through structured decision-making
- **Fun Translator** — Novelty tool that rewrites normal text in various styles: formal, casual, businesslike, pirate, medieval courtier, decade slang, generational dialects (boomer, gen x, gen z, gen alpha), etc.
- **Teen Lite Optimizer** — Teen asks a homework question, LiLa crafts a teaching-focused prompt (not answer-giving) for the teen to paste into an LLM of their choice
- **Homework Checker** — Teen uploads/photographs homework, LiLa gives improvement points and explains *why* without doing the work or giving answers

Each gets its own lean PRD addendum when ready.

---

## Decisions Affecting LiLa Optimizer PRD (PRD-05C)

### Scope Confirmed as Separate

PRD-05C covers: full Optimizer spec, prompt optimization engine, platform-specific formatting (ChatGPT vs Claude vs Gemini vs Midjourney), prompt template library, context learning detection, and cost strategy. Multi-AI Panel is a brief post-MVP stub only. BYOK is removed from scope — it may be revisited in a future PRD if there's demand. PRD-05 defines the Optimizer's entry point (floating button, drawer mode header) and its slot in the guided mode registry.

---

## Decisions Affecting All Feature PRDs

### Context Toggle Infrastructure Rule

**Every feature PRD that introduces a new context source must include an `is_included_in_ai` boolean column (defaulting to `true`) on the relevant table.** PRD-05 defines the shared pattern; feature PRDs follow it.

The context assembly pipeline (LiLaEdge) filters on this flag when building context bundles. The UI pattern is standardized: checkbox per entry, "Select/Deselect All" per category, optimistic UI updates with server sync, tooltip: "Included in LiLa conversations. Uncheck to exclude."

### Model Routing Strategy

Feature PRDs that involve AI processing should specify which model tier to use:

- **Sonnet:** Emotional intelligence, complex reasoning, nuanced conversation (Cyrano, Higgins, ThoughtSift, Marriage Toolbox, general LiLa chat)
- **Haiku:** Utilitarian tasks, structured extraction, sorting (brain dump sorting, task breakdown, calendar suggestions, Review & Route extraction, context learning detection, framework extraction)
- **OpenAI Whisper:** Voice transcription
- **OpenAI embeddings / Supabase pgvector:** RAG retrieval

The guided mode registry includes a `model_tier` field so each mode declares which model it needs.

### Guided Mode Opening Messages

Every guided mode registered in the LiLa system must define **multiple rotating opening messages** (at least 2-3 variants per mode). These orient the user — confirming what mode they're in, what it does, and setting expectations. This prevents the experience from feeling repetitive on repeated use.

---

## Decisions Affecting Teen/Guided AI Voice (All Relevant PRDs)

### Talk Up Philosophy

For all AI interactions with teens (Independent shell) and older children (Guided shell):

- **Talk UP, not down.** Assume they're slightly more mature than their age suggests.
- **Treat them as capable.** They either already are, or they'll grow into the expectation.
- **Never condescending.** Kids resist lowered expectations and resist feeling patronized.
- **Age-appropriate ≠ dumbed down.** Meet them developmentally while respecting their intelligence.
- **Guided voice:** Slightly warmer and more encouraging while still respecting capability.
- **Independent voice:** More peer-adjacent, advisory tone. Respect autonomy.

### Parent-Connection-First Philosophy

For Guided shell members especially (but applicable to all minors):

- Always encourage talking to parents, teachers, loved ones
- Help kids articulate what's going on and how to bring it to mom and dad
- Build emotional intelligence, grit, and resilience — but always in the context of doing it WITH parents
- Faith framework integration where family has it set up
- Never substitute for human/family/community relationships
- AI strengthens parent-child bonds, never replaces them
- All conversations visible to mom by default (guided), transparency-configurable (independent)

---

## LiLa Avatar Mapping (Canonical Reference)

| Avatar | Pose | File | Used For |
|--------|------|------|----------|
| LiLa Help | Open arms, welcoming | Lila-HtH.png | Help mode (floating button + drawer header) |
| LiLa Assist | Holding clipboard | lila-asst.png | Assist mode (floating button + drawer header) |
| LiLa Optimizer | Thinking, chin tap | lila-opt.png | Optimizer mode (floating button + drawer header) |
| Sitting LiLa | Meditative, glowing heart, stars | sittinglila.png | Drawer resting state / general conversation mode |

---

## LiLaEdge — Backend Infrastructure Layer

Internal name for the backend AI processing infrastructure. Covers:
- Supabase Edge Functions for AI calls
- Context assembly pipeline (three-tier toggle filtering)
- Model routing (Sonnet vs Haiku based on guided mode registry)
- Shared AI processing for all user-facing LiLa versions
- LiLa API from the original Versions Guide maps to this concept

Users never see this name. It replaces "LiLa API" as the internal reference for the backend layer.

---

*End of addendum. Upload to project knowledge for reference in future PRD conversations.*
