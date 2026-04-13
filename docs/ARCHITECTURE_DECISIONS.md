# Architecture Decisions

*Every technical choice in MyAIM Family was made for a reason. This document explains the reasoning behind the architecture.*

---

## Why 60-80+ Database Tables

A family platform isn't a user app with extra rows. Every family member has fundamentally different data, different permissions, and different privacy requirements. A teenager's journal entries must be architecturally isolated from a sibling's dashboard — not just hidden by a UI toggle, but separated at the database level through Row Level Security policies.

The table count reflects real complexity: families have members with roles (mom, dad, teen, child, caregiver). Members have goals, tasks, journal entries, conversation histories, personality profiles, faith contexts, and relationship dynamics. Caregivers have shifts, assigned children, and time-scoped access. Children have age-appropriate data surfaces. Each of these domains requires its own tables, its own RLS policies, and its own permission boundaries.

This is not schema bloat. It is data separation as a privacy architecture.

---

## Why pgvector and Embedding-Based Classification

LiLa needs to understand context — what a journal entry is about, which family member it relates to, whether it's a task or a reflection or a goal update. The naive approach: send every item to an LLM for classification. At scale, that's expensive and slow.

Our approach: generate a text embedding (OpenAI text-embedding-3-small, 1536 dimensions stored as halfvec) for each content item when it's created, using an async pgmq queue. Then classify by comparing embeddings to reference vectors — no LLM call needed for ~90% of routine classification tasks.

Cost: less than $0.01 per family per month for embeddings. This replaces what would be approximately $0.45/month in Haiku API calls per family.

The embedding pipeline also powers semantic context assembly for LiLa conversations: instead of stuffing the full conversation history into every prompt, we do per-turn semantic retrieval — pulling only the context most relevant to the current message. This keeps context rich while keeping token costs controlled.

Five tables carry embedding columns: `archive_entries`, `journal_entries`, `lila_messages`, `bookshelf_chunks`, and `task_items`. All use `halfvec(1536)` consistently.

---

## Why Human-in-the-Mix Is an Architectural Pattern

Human-in-the-Mix means every AI-generated output passes through a four-button review: Edit, Approve, Regenerate, Reject. This appears throughout the platform — LiLa conversation actions, report generation, Smart Notepad routing, declaration generation, communication coaching outputs.

This is not a UI feature. It is an architectural pattern that serves three purposes simultaneously:

1. **COPPA compliance.** The platform handles children's data. Parental review of AI outputs before they become permanent records is not optional — it's a legal requirement. By making Human-in-the-Mix the universal pattern for all AI outputs, we achieve compliance by architecture rather than by policy.

2. **Ethical AI.** LiLa suggests. Mom decides. The AI never autonomously creates permanent records, sends messages to family members, or makes changes to schedules without human approval. In a platform handling sensitive family context — disability documentation, relationship dynamics, financial records — autonomous AI action is not an acceptable risk.

3. **Legal liability.** If an AI-generated SDS report contains an error, the Human-in-the-Mix review creates a clear chain of responsibility: the AI suggested, the human approved. This protects both the family and the platform.

The pattern is implemented as a reusable component, not repeated code. Every AI output surface uses the same review flow, ensuring consistency and making it impossible to accidentally ship an AI feature without human review.

---

## Why Five Shells Instead of One App with Settings

A 7-year-old with Down Syndrome and her mother are not the same user with different permissions. They are fundamentally different users who need fundamentally different experiences.

The five shells — Mom, Adult, Independent, Guided, and Play — are not permission layers on top of a single interface. They are distinct layout components with different navigation patterns, different information density, different interaction models, and different visual presentation.

- **Mom Shell:** Full sidebar navigation, LiLa drawer (pull-up from any page), every tool available, family overview dashboard.
- **Adult Shell:** Scoped navigation to assigned members and communication tools. Caregivers get a purpose-built layout with no sidebar — just their assigned children and a shift log.
- **Independent Shell (Teens):** Self-directed tools, Safe Harbor for processing, age-appropriate AI access. LiLa talks to teens like they're capable, not like they're children.
- **Guided Shell (Kids 8-12):** Simplified interface, gamified elements, parent-approved interactions. Lower information density, higher engagement cues.
- **Play Shell (Young Children):** Large icons, celebration-focused, fully parent-controlled. Minimal text, maximum visual feedback.

This architecture was driven by real need: the founder's family includes nine children spanning ages from toddler to teenager, plus two caregiving aides. A single interface with role-based filtering would have resulted in a compromised experience for everyone. Purpose-built shells mean each user type gets a complete, designed experience — not a degraded version of someone else's app.

---

## Why OpenRouter Instead of Direct API Calls

MyAIM uses multiple AI models for different purposes: Sonnet for complex conversations and contextual responses, Haiku for utilitarian tasks like help text and quick classification. OpenRouter provides a single API endpoint that routes to the appropriate model based on the request.

Benefits:
- **Cost optimization:** Different tasks use different models. A help question doesn't need Sonnet. A complex family conversation doesn't deserve Haiku.
- **Model flexibility:** If a better model becomes available, we can route to it without changing application code.
- **Fallback handling:** If one model provider has an outage, OpenRouter can route to alternatives.
- **Single billing and monitoring:** One API key, one usage dashboard, one cost tracking system.

Total AI cost across all nine optimization patterns: under $1.00 per family per month. This matters because cost discipline enables subscription pricing that families can actually afford.

---

## Why Supabase Edge Functions Instead of n8n

Early architectural plans included n8n for workflow orchestration. This was removed from scope for a specific reason: one less external dependency for a platform handling family data.

Supabase Edge Functions run in the same infrastructure as the database, with the same security model, the same authentication, and the same RLS policies. There is no external service with its own credential management, its own uptime concerns, or its own data handling policies.

For a family platform where data security is paramount, minimizing the number of external services that touch family data is an architectural decision, not a convenience choice.

---

## Why rrule.js (RFC 5545) for Scheduling

Family schedules are genuinely complex. "2nd and 4th Wednesdays" is a real recurring schedule in this family — it's when Amy takes Ruthie to activity days. "Every Tuesday and Thursday 9 AM to noon" is another — co-op days with Kylie.

Simple date recurrence (every week, every month) doesn't cover real family scheduling. RFC 5545 recurrence rules handle arbitrary patterns: nth weekday of the month, every other week, specific day-of-week combinations, exceptions for holidays. The rrule.js library implements this standard and integrates cleanly with the calendar system.

This was chosen because the founder's actual family schedule broke simpler recurrence models during StewardShip development.

---

## Why Templates as Data, Not Code

Report templates (homeschool compliance, SDS monthly, ESA invoices, family newsletters) are stored in a `report_templates` database table, not as code files. New templates can be added by inserting a row — no deployment needed.

This matters because:
- Different states have different homeschool reporting requirements. A Missouri family and an Arizona family need different templates.
- The SDS report format may change when the compliance portal updates.
- Community-contributed templates become possible without code changes.
- Template updates ship instantly, not on deployment cycles.

The same principle applies throughout the platform: guided mode definitions, gamification rules, and widget configurations are stored as data, making the platform configurable without code changes.

---

## Why the Audit Happened

Before the main build sprint, a comprehensive audit was conducted: 97 files (42 PRDs, 42 addenda, 4 specs) read by 14 parallel agents. The audit discovered that early build phases had been coded from a summary document that diverged from the actual PRDs — resulting in a ~39% pass rate across ~1,067 checkpoints.

The decision was made to rebuild from the PRDs directly rather than patch the divergent code.

This was the correct decision for three reasons:
1. **Data integrity.** Incorrect schemas for a family platform mean incorrect data isolation, incorrect permissions, and potential exposure of children's data.
2. **Architectural consistency.** Patching divergent code would have created technical debt that compounds with every subsequent feature.
3. **Trust.** Families will trust this platform with their most sensitive information. That trust must be earned through architectural rigor, not speed.

The audit findings and corrected reference documents are preserved in the `audit/` folder as evidence of the process.

---

*AIMagicforMoms™ — AI Magic for Moms + MyAIM Family*
