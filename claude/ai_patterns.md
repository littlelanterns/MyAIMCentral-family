# AI Patterns — MyAIM Central Family Platform v2

## LiLa (Little Lanterns) — AI Assistant Architecture

### Core Identity

- LiLa is the platform's AI assistant, branded as "Little Lanterns"
- Processing partner, NOT a friend, therapist, or companion
- Never guilt, shame, or manipulate
- Always bridges toward real human connection
- Follows each family's faith and values framework

---

## Conversation Engine (PRD-05)

- `lila_conversations` table — parent record per conversation
- `lila_messages` table — individual messages within a conversation
- Mom gets LiLa in a bottom drawer; all other members get modals
- Conversations are mode-scoped (the active guided mode determines LiLa's behavior)
- Mode switching: LiLa detects domain shifts mid-conversation and offers to switch modes

---

## Four Core LiLa Modes

| Mode | Avatar | Purpose |
|------|--------|---------|
| **LiLa Help** | "Happy to Help" | Customer support, troubleshooting, bug reporting. Checks known issues (keyword matching) BEFORE calling AI. |
| **LiLa Assist** | "Your Guide" | Feature guidance, onboarding, tool recommendations. |
| **LiLa Optimizer** | "Smart AI" | Prompt optimization with family context (PRD-05C). BYOK support. |
| **Sitting LiLa** | "Resting" | General chat, smart routing to specialized modes. |

---

## Complete Guided Mode Registry

40+ modes across all PRDs. Each mode shapes LiLa's system prompt, context assembly, and available actions.

### Core Modes (PRD-05)

- `help` — Customer support and troubleshooting
- `assist` — Feature guidance and onboarding
- `optimizer` — Prompt optimization with family context
- `general` — General chat and smart routing

### Relationship / Communication (PRD-21)

- `quality_time` — Love Language: quality time suggestions
- `gifts` — Love Language: gift ideas and tracking
- `observe_serve` — Love Language: acts of service observation
- `words_affirmation` — Love Language: affirmation crafting
- `gratitude` — Love Language: gratitude expression
- `cyrano` — Sonnet model, spouse-only romantic communication aid
- `higgins_say` — Sonnet model, communication coaching (what to say)
- `higgins_navigate` — Sonnet model, communication coaching (how to navigate)

### Personal Growth

- `self_discovery` (PRD-07) — InnerWorkings self-knowledge exploration
- `craft_with_lila` (PRD-06) — Guiding Stars AI crafting
- `life_lantern` (PRD-12A) — Life Lantern assessments
- `family_vision_quest` (PRD-12B) — Family vision statement creation

### Calendar / Meetings

- `calendar_event_create` (PRD-14B) — AI-assisted event creation
- `meeting` (PRD-16) — Meeting facilitation with subtypes: couple, family_council, mentor, etc.

### Family Context

- `family_context_interview` (PRD-19) — Structured family context gathering

### Safe Harbor (PRD-20)

- `safe_harbor` — Sonnet model, available to mom/dad/teen
- `safe_harbor_guided` — Haiku model, guided mode for children
- `safe_harbor_orientation` — Sonnet model, mom-only orientation
- `safe_harbor_literacy` — Haiku model, teen-only literacy building

### ThoughtSift (PRD-34)

Five SEPARATE tools, NOT sub-modes of a single tool:

- `board_of_directors` — 3-5 persona advisory panel (Sonnet, one call per advisor)
- `perspective_shifter` — Swappable lens chips for reframing (Sonnet)
- `decision_guide` — 15 decision frameworks (Sonnet)
- `mediator` — 8 context modes for conflict mediation (Sonnet; supersedes PRD-19 relationship_mediation)
- `translator` — Single-turn text rewrite (Haiku; NOT conversational)

### BigPlans (PRD-29)

- `bigplans_planning` — Project planning assistance
- `bigplans_friction_finder` — Identify friction points
- `bigplans_checkin` — Progress check-ins
- `bigplans_system_design_trial` — System design trials
- `bigplans_deployed_component` — Deployed component support

### BookShelf (PRD-23)

- Book Discussion mode — Multi-book semantic RAG conversations

### Compliance / Reporting (PRD-28B)

- `homeschool_report_generation` — Automated compliance report drafting

### Tracking (PRD-28)

- `homeschool_time_review` — Homeschool time log review

### Family Feeds (PRD-37)

- `homeschool_bulk_summary` — Bulk summary generation for feeds

---

## Context Assembly Pipeline — Layered Architecture (PRD-05 / PRD-13)

All LiLa Edge Functions use a three-layer context assembly system implemented in `_shared/context-assembler.ts`. The principle: **"LiLa appears smarter by knowing less at the right time."** Relevance filtering runs ON TOP of the existing three-tier toggle system (`is_included_in_ai`), not instead of it.

### Layer 1 — Always Loaded (~200 tokens)

Loaded on every turn, every Edge Function, no filtering:
- **Family roster**: display_name, age, role, relationship for all active members
- **Current user**: identified as `[current user]` in the roster
- **Feature context**: book titles, tool mode, page context — grounds the conversation

### Layer 2 — On-Demand by Relevance

Fetched only when the conversation references a specific person or topic. Two triggers:

**Trigger A: Name Detection** — Scans the current message + last 4 conversation messages for family member names (word-boundary regex, case-insensitive, checks `display_name` and `nicknames`). When detected, loads that member's archive context items and self-knowledge.

**Trigger B: Topic Matching** — Matches the conversation text against keyword patterns to determine which context categories are relevant:
- `faith|spiritual|prayer|church` → faith preferences + faith-category Guiding Stars
- `goal|intention|plan|grow` → Guiding Stars (all) + Best Intentions
- `schedule|busy|time|week` → Schedule & Activities archive items
- `personality|trait|strength` → Self-Knowledge entries
- `food|meal|diet|cook` → Preferences archive items
- `school|learn|homework` → School & Learning archive items
- `health|medical|therapy|disability` → Health & Medical archive items
- `hobby|interest|sport|music` → Interests & Hobbies archive items
- `love|marriage|spouse|relationship` → Relationships context
- **Default** (no topic detected): user's top 5 Guiding Stars only

### Layer 3 — Search Only, Never Bulk Loaded

Accessed via semantic search (embedding similarity) for deep grounding:
- `bookshelf_chunks` via `match_bookshelf_chunks` RPC (BookShelf discuss)
- Full extraction sets via `match_bookshelf_extractions` RPC (BookShelf search)
- Journal entries (future: semantic search RPC)

### Per-Tool Overrides

| Tool | Always load (Layer 1+) | Layer 2 trigger |
|------|----------------------|-----------------|
| lila-chat | Nothing extra | Name detection + topic matching per turn |
| Cyrano | Partner always included | Topic matching filters depth |
| Higgins Say/Navigate | Nothing extra | Name detection (multi-person) + topic matching |
| Love Language tools | Partner always included | Topic matching only |
| BookShelf Discuss | Book metadata + hearted extractions | Name detection + topic matching |
| Safe Harbor | Nothing extra (privacy-first) | Minimal — only user's own context |
| Mediator | Depends on context mode | Name detection + topic matching |
| Perspective Shifter | Person's context if selected | Topic matching |

### Invariants (unchanged by layered loading)

- **Three-tier toggles** still respected: person-level → folder-level → item-level `is_included_in_ai`
- **Privacy Filtered items** still always excluded for non-mom
- **Safe Harbor** still exempt from all context aggregation
- **Crisis Override** still global, checked on every message before context assembly

### Context Sources

- Guiding Stars, Best Intentions
- InnerWorkings (`self_knowledge`)
- Archives (context items with folder hierarchy)
- Journal entries (where `is_included_in_ai = true`)
- LifeLantern assessments
- Personal and Family Vision Statements
- Relationship notes, partner context
- Faith preferences
- BookShelf knowledge (per-member settings: `hearted_only` / `all` / `principles_only` / `none`)
- Recent conversation history (sliding 4-message window for detection)
- Page/feature context

---

## 9 AI Cost Optimization Patterns

| Pattern | Name | Description |
|---------|------|-------------|
| P1 | Batch Processing | Embed 100 items once, not one at a time on write |
| P2 | Embedding-Based Classification | Replace Haiku classifier calls with pgvector semantic queries |
| P3 | Context Learning Detection | Only trigger Haiku when embedding delta exceeds threshold |
| P4 | Semantic Context Compression | Embeddings reduce context tokens sent to reasoning model |
| P5 | On-Demand Secondary Output | Generate primary output only; extras (alt titles, tags) on request |
| P6 | Caching and Reuse | Cache synthesized frameworks in `platform_intelligence`; do not regenerate |
| P7 | Time-Based Sampling | Process a sample of messages for patterns, extrapolate |
| P8 | User-Controlled Scope | Let users opt in/out of specific AI features via toggles |
| P9 | Per-Turn Semantic Refresh | Sliding 4-message detection window re-evaluates context relevance each turn (implemented via `assembleContext()`) |

---

## Model Routing

| Use Case | Model | Rationale |
|----------|-------|-----------|
| LiLa conversations (most modes) | Claude Sonnet via OpenRouter | Emotional intelligence, nuance |
| Safe Harbor | Sonnet | Requires careful ethical reasoning |
| ThoughtSift Board of Directors | Sonnet (per advisor) | Each advisor = one Sonnet call |
| Translator | Haiku | Single-turn text rewrite, no reasoning needed |
| Safe Harbor Guided (children) | Haiku | Simple, warm responses; not complex reasoning |
| Safety classification (PRD-30) | Haiku | Async, lightweight classification |
| Blog comment moderation | Haiku | Binary positive/negative classification |
| Embedding generation | OpenAI text-embedding-3-small | 1536 dimensions, $0.02/M tokens |
| MindSweep classification | Embedding-first, Haiku fallback | P2 pattern: pgvector before LLM |
| Sentiment classification (feedback) | Embedding-based | Pattern library, NOT per-submission LLM |

---

## AI Metering and Credits (PRD-31)

### What Is Metered

- AI metering applies ONLY to Sonnet-level operations
- Haiku, embeddings, Whisper, and JS-only operations are NOT metered

### Credits Ledger

- `ai_credits` table — append-only ledger (never UPDATE rows)
- Sources: `tier_monthly_allotment`, `purchased`, `earned_onboarding`, `earned_promotion`, `tier_sample`, `ai_action_spent`, `expired`, `refund`

### Spending Priority

Credits are consumed in this order (expiring soonest first):

1. Credits expiring soonest
2. Monthly allotment
3. Earned credits
4. Purchased credits

### Expiration Rules

- Earned credits expire in 90 days
- Purchased credits never expire

---

## Embedding Pipeline (Semantic Context Infrastructure)

### Configuration

- Model: OpenAI `text-embedding-3-small` (1536 dimensions)
- Storage: `halfvec(1536)` for cost efficiency
- Queue: pgmq `embedding_jobs` queue
- Processing: `pg_cron` every 10 seconds triggers the `embed` Edge Function

### Pipeline Flow

1. Generic trigger `util.queue_embedding_job()` fires on INSERT/UPDATE
2. Job enters `embedding_jobs` queue
3. `pg_cron` polls every 10 seconds
4. `embed` Edge Function processes the batch
5. Embedding stored as `halfvec(1536)` on the source row

### Search

- `match_by_embedding()` Postgres function for semantic similarity queries

### Tables Receiving Embeddings

- `archive_context_items`
- `best_intentions`
- `self_knowledge`
- `guiding_stars`
- `journal_entries` (where `is_included_in_ai = true`)
- `bookshelf_chunks`

---

## Platform Intelligence Pipeline (12 Channels)

Anonymized usage patterns used for platform self-improvement. All data passes through 3-tier anonymization before storage: names replaced with stable aliases, IDs removed, timestamps removed where possible. Admin approval is required before anything becomes platform intelligence.

| Channel | Data Type | Source PRDs |
|---------|-----------|-------------|
| A | Prompt patterns | PRD-05, PRD-05C |
| B | Context effectiveness | PRD-05, PRD-13 |
| C | Edge case registry | All PRDs |
| D | Board personas | PRD-34 |
| E | Book cache / extraction cache | PRD-23 |
| F | Synthesized principles | Cross-PRD |
| G | Framework ethics log | PRD-23 |
| H | Meeting section patterns | PRD-16 |
| I | Declaration patterns | PRD-06 |
| J | Routine patterns | PRD-09A, PRD-18 |
| K | Widget configurations | PRD-10 |
| L | Question effectiveness | PRD-05 |

---

## Safety Systems

### Global Crisis Override

Applies across EVERY LiLa conversation, regardless of mode:

- Crisis keywords detected in any message trigger immediate resource display
- Resources provided: 988 Suicide & Crisis Lifeline, Crisis Text Line, NDVH, 911
- No coaching during crisis — resources only
- Override takes priority over all other LiLa behavior

### Safety Monitoring (PRD-30)

**Two-layer detection:**

- **Layer 1:** Keyword/phrase matching — synchronous, runs on every message
- **Layer 2:** Haiku conversation classification — async background processing

**Three severity tiers:**

| Tier | Response |
|------|----------|
| Concern | Flag for review |
| Warning | Escalated notification |
| Critical | Immediate intervention |

**Locked categories (always High severity):**

- `self_harm`
- `abuse`
- `sexual_predatory`

**Monitoring scope:**

- Children are monitored by default (opt-out available)
- Adults are opt-in
- `lila_messages.safety_scanned` flag prevents double-processing

### Safe Harbor Safety Concern Protocol (PRD-20)

Rules LiLa follows when safety concerns arise in Safe Harbor conversations:

- LiLa NEVER labels situations as abuse or provides diagnoses
- LiLa paints a picture of healthy dynamics, acknowledges gaps, and bridges to safe humans
- Conversation arc: Validate -> Curiosity -> Empower

**Three-tier escalation:**

1. **Normal Processing** — Standard Safe Harbor conversation flow
2. **Professional Referral** — Gentle bridge to professional resources
3. **Crisis Override** — Immediate crisis resources (same as global override)

---

## Automatic Intelligent Routing (AIR)

Silent auto-routing of achievements into the victories system. No user action required; the platform detects milestones and creates victory records automatically.

| Source Event | Victory Source Value | Trigger |
|-------------|---------------------|---------|
| Task completion | `task_completion` | Task marked complete |
| Best Intention iteration | `best_intention_iteration` | Iteration logged on a Best Intention |
| Widget milestone data point | `widget_milestone` | Milestone threshold reached on a widget |
