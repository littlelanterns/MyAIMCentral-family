# AI Integration Philosophy

*This document explains how AI works inside MyAIM Family. This isn't ChatGPT wrapped in a family app. AI is the product — woven into the architecture, not bolted on top.*

---

## LiLa: A Family of AI Modes, Not a Chatbot

LiLa (Little Lanterns) is not one monolithic AI. She is a family of specialized modes unified by a shared conversation engine, context assembly pipeline, and guided mode registry.

Each mode has a distinct personality, avatar state, and purpose:

- **LiLa Help** — Customer support, troubleshooting, pattern-matched common questions with Haiku fallback. Open arms avatar.
- **LiLa Assist** — Feature guidance, onboarding, tool recommendations. Clipboard avatar.
- **LiLa Optimizer** — Prompt enhancement with family context. Takes a rough idea and returns a context-rich prompt the user can use on any AI platform. Thinking avatar.
- **General LiLa** — Open conversation with smart mode detection. When mom starts discussing a relationship issue, LiLa suggests switching to Higgins (communication coaching). When she's working through a decision, LiLa suggests the Decision Guide. Meditative avatar.

Beyond these core modes, a guided mode registry allows specialized tools to plug into the same conversation engine: Cyrano (message drafting), Higgins (communication coaching), Board of Directors (multi-perspective thinking), Perspective Shifter, Decision Guide, Mediator, and more. Each guided mode has its own system prompt, its own context requirements, and its own personality — but all share the same infrastructure.

---

## Context Assembly: The Core Differentiator

The single most important thing LiLa does is assemble context about the family before every conversation turn.

When mom asks LiLa for dinner help, the system doesn't just process the words "help with dinner." It assembles:

- **Guiding Stars** — The family's declared values and principles
- **Best Intentions** — Growth goals for specific family members ("Eli is learning to cook")
- **InnerWorkings** — Personality profiles, communication styles, sensory needs
- **Archives** — Historical context about each family member
- **Calendar** — What's happening today, what happened recently, what's coming
- **Relationship context** — "How to Reach Me" preferences, communication patterns
- **Faith framework** — If configured, the family's spiritual context (never forced, never assumed)

This context is assembled per-turn using semantic retrieval — not by stuffing everything into every prompt. The embedding pipeline generates vectors for all contextual content, and each conversation turn retrieves only the context most semantically relevant to the current message.

The result: LiLa's response to "help with dinner" might account for the fact that it's Tuesday (therapy day, so dinner needs to be fast), that the 11-year-old has a goal of learning to cook, that the 4-year-old needs to be included in family activities, and that dad prefers simple meals on weeknights. No generic AI can do this. No competitor assembles this context.

---

## Condensed Intelligence

LiLa's communication and relationship tools are backed by synthesized wisdom from 100+ books on communication, psychology, family dynamics, and personal development.

A critical design constraint: **LiLa never cites a single book source.** She doesn't say "According to Dr. Gottman..." or "The book 'Crucial Conversations' recommends..." Instead, she applies synthesized universal principles — patterns that converge across multiple sources and traditions. If a user asks where the advice comes from, LiLa offers multiple convergent sources as "further reading" — never attributing her guidance to any single authority.

This is an ethical choice: families should receive guidance grounded in broad human wisdom, not filtered through any single author's methodology or brand. It also makes the guidance more durable — it's not tied to any framework that could go out of fashion.

The condensed intelligence files that back LiLa's specialized modes were created through careful extraction, synthesis, and ethical filtering. A three-layer content pipeline ensures quality: automated gate (Haiku screens for harmful patterns), deeper review (Sonnet evaluates nuance), and human oversight (admin weekly review).

---

## The Nine Cost Optimization Patterns

Total AI cost: under $1.00 per family per month. This is achieved through nine patterns (P1-P9) applied across every AI-calling feature:

**P1 — Embedding-based auto-tagging.** Instead of calling an LLM to classify every journal entry, task, or feed item, we generate a text embedding and compare it to reference vectors. This handles ~90% of routine classification at a fraction of the cost.

**P2 — On-demand secondary outputs.** When LiLa generates a response, she doesn't pre-generate explanations, alternatives, or extended analysis. Instead, action chips ("Explain why," "See alternatives," "Dig deeper") let the user request secondary outputs only when wanted.

**P3 — Per-turn semantic context refresh.** Instead of stuffing the full conversation history and all family context into every prompt, each turn retrieves only the semantically relevant context. This keeps context rich while keeping token counts manageable.

**P4 — Model routing by task complexity.** Sonnet handles conversations that require nuance, empathy, and complex reasoning. Haiku handles help text, quick classification, and utilitarian tasks. The router selects the appropriate model for each request.

**P5 — Cached pattern matching for common queries.** LiLa Help uses pattern matching against common questions before falling back to an LLM call. Many support queries are answered without any AI cost.

**P6 — Batched embedding generation.** Embeddings are generated asynchronously through a pgmq queue rather than synchronously on every content creation. This allows batch processing during low-usage periods.

**P7 — Template-based generation.** Report generation uses structured templates with data injection, not free-form LLM generation for the entire document. The AI writes the narrative sections; the data sections are template-filled.

**P8 — Context window management.** Long conversations are summarized periodically rather than carrying the full history forward. The summary preserves key context while reducing token consumption.

**P9 — Tiered AI access.** Not every feature needs the most expensive model. The tier system aligns AI capability with subscription level, ensuring the platform is sustainable at every price point.

---

## The Platform Intelligence Pipeline

MyAIM doesn't just use AI — it learns from how families use the platform. Twelve capture channels (A through L) feed anonymized, aggregated usage patterns into a self-improving flywheel:

- Which features are used most often (and by which roles)
- Which LiLa guided modes produce the most useful outputs
- Which context sources most improve AI response quality
- Which PlannedExpansionCards generate the most interest signals

This data — never individual family data, always aggregated patterns — feeds back into model prompt refinement, feature prioritization, and cost optimization. The platform gets better at serving families the more families use it.

An admin weekly review process ensures human oversight of all pipeline outputs. No automated system makes changes to user-facing behavior without human approval.

---

## Human-in-the-Mix: Everywhere, Always

This bears repeating because it is the single most important AI design decision in the platform:

Every AI output has four buttons: **Edit, Approve, Regenerate, Reject.**

This is not optional. It is not a setting. It is not something that "advanced users" can turn off. It is the foundational pattern that makes it ethical to put AI into a family context where the data includes children, disability documentation, financial records, and sensitive relationship dynamics.

Mom is always in the loop. AI suggests. Mom decides. That's the product.

---

*AIMagicforMoms™ — AI Magic for Moms + MyAIM Family*
