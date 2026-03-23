# PRD-34 Cross-PRD Impact Addendum
## ThoughtSift — Decision & Thinking Tools — Impact on Existing PRDs

**Created:** March 22, 2026
**Parent PRD:** PRD-34 (ThoughtSift — Decision & Thinking Tools)

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- 5 new guided modes registered: `board_of_directors`, `perspective_shifter`, `decision_guide`, `mediator`, `translator`. The existing placeholder `thoughtsift` row in the guided mode registry should be removed and replaced with these 5 individual entries.
- Model tier: 4 modes use Sonnet, Translator uses Haiku.
- Board of Directors generates multiple AI responses per user turn (one per seated advisor). The conversation engine must handle sequential multi-response generation within a single conversation turn.
- Translator is a single-turn transform, not a conversation. The modal pattern still works but the UI is an input/output interface rather than a chat thread.
- All 5 modes use the standard conversation container (modal for all members including mom, since these launch from the Vault/Toolbox, not the LiLa drawer).

**Action needed:**
- Remove `thoughtsift` placeholder from the guided mode registry.
- Add 5 new rows to `lila_guided_modes` per the registration table in PRD-34.
- Note Board of Directors multi-response pattern in the conversation engine spec (sequential Sonnet calls, each attributed via `lila_messages.metadata.persona_id`).
- Note Translator's single-turn pattern as an alternative conversation UI mode.

---

## Impact on PRD-19 (Family Context & Relationships)

**What changed:**
- The `relationship_mediation` guided mode is superseded by the `mediator` guided mode from PRD-34. All system prompt rules, privacy boundaries, conversational arc (validate → curiosity → reframe → empower), and the Full Picture multi-perspective synthesis are preserved within the Mediator tool's "Full Picture (Mom only)" context mode.
- The safety exception for abuse/harm detection is preserved verbatim.
- The feature key `archives_relationship_mediation` maps to the Mediator's Full Picture context.
- The relationship_mediation system prompt text from PRD-19 Section "Guided mode: `relationship_mediation`" is incorporated into the Mediator's Full Picture context mode.

**Action needed:**
- Mark `relationship_mediation` guided mode as superseded by PRD-34's `mediator` mode.
- Note that the mode key changes from `relationship_mediation` to `mediator`, but the Full Picture context mode preserves all prior behavior.
- Update the feature key reference: `archives_relationship_mediation` is now accessed through the Mediator tool's Full Picture context, not a standalone guided mode.

---

## Impact on PRD-21 (Communication & Relationship Tools)

**What changed:**
- The AI Toolbox sidebar section gains 5 new assignable tools. These use the existing `lila_tool_permissions` pattern established by PRD-21.
- No schema changes needed — the `mode_key` field on `lila_tool_permissions` references the 5 new guided mode keys.

**Action needed:**
- Note 5 new ThoughtSift tools as assignable through the AI Toolbox alongside the existing 8 communication tools.

---

## Impact on PRD-21A (AI Vault — Browse & Content Delivery)

**What changed:**
- 5 new `vault_items` records needed, each with `content_type = 'ai_tool'` and `delivery_method = 'native'`.
- New Vault category: "ThoughtSift / Thinking Tools" in `vault_categories`.
- Each tool launches its guided conversation mode when the user taps the launch button on the Vault detail/portal page.
- "+Add to AI Toolbox" available on all 5 items (they're native AI tools).
- 5 thumbnail images required (specifications to be detailed in the pre-build visual asset audit).

**Action needed:**
- Add "ThoughtSift / Thinking Tools" to `vault_categories` seed data.
- Add 5 vault item records to seed data with appropriate display titles, descriptions, tier badges, and thumbnail placeholder references.

---

## Impact on PRD-21B (AI Vault — Admin Content Management)

**What changed:**
- Admin needs to manage community-generated personas and community-generated lenses through moderation queues.
- These are similar to the existing comment moderation pattern but review persona/lens content rather than comments.

**Action needed:**
- Note two new moderation queue types for the admin panel: persona review and lens review. Full UI spec deferred to PRD-32 (Admin Console).

---

## Impact on PRD-30 (Safety Monitoring)

**What changed:**
- All ThoughtSift conversations pass through the existing two-layer safety pipeline (Layer 1 keyword matching + Layer 2 Haiku classification). No new safety infrastructure needed.
- Board of Directors adds a persona creation content gate (Haiku pre-screen for deity/blocked figure names). This is a pre-conversation check, not a conversation monitoring change.
- Board of Directors advisor responses should be evaluated in full conversation context, not individually. A historical figure discussing war in character is not a safety violation; the same language outside of character context might be.

**Action needed:**
- Note ThoughtSift guided mode keys as additional conversation sources for the safety scanning pipeline.
- Add persona creation content gate as a pre-conversation Haiku check (separate from the conversation-level safety scan).

---

## Impact on PRD-32 (Admin Console)

**What changed:**
- Two new moderation queue types needed:
  1. **Persona Review Queue:** Community-generated personas awaiting approval before becoming public. Shows persona name, personality profile summary, source references, and content policy status. Actions: Approve (set `is_public = true`), Reject, Edit & Approve.
  2. **Lens Review Queue:** Community-generated Perspective Shifter lenses awaiting approval. Shows lens name, description, system prompt addition. Actions: Approve, Reject, Edit & Approve.
- Both queues live in the existing moderation infrastructure established by PRD-32.

**Action needed:**
- Add Persona Review and Lens Review tabs to the Admin Console's moderation section.

---

## Impact on Platform Intelligence Pipeline v2

**What changed:**
- **Channel D (Board of Directors Personas) is fully wired.** The three-tier persona library is operational. Content policy is enforced. Community-generated personas flow through the capture → queue → promote pipeline. Personal custom personas never enter the pipeline.
- The `board_personas` table in the `platform_intelligence` schema serves as the promoted personas store. Personal custom personas live in the `public` schema.
- Persona embeddings use the same pgvector infrastructure (halfvec, text-embedding-3-small) as other platform intelligence.

**Action needed:**
- Mark Channel D as wired by PRD-34.
- Update the Build Timing table: Channel D is wired with ThoughtSift.
- Note that `board_personas` has a split architecture: system/community tiers in `platform_intelligence` schema, personal customs in `public` schema.

---

## Impact on AI Cost Optimization Patterns

**What changed:**
- Board of Directors is the most AI-expensive ThoughtSift tool: 3 advisors × Sonnet = ~$0.03 per turn; a 10-turn session = ~$0.30. With 5 advisors: ~$0.50 per session.
- Persona generation (Sonnet, one-time per new persona): ~$0.02-$0.03. Amortized across all future users via the caching pattern.
- Perspective Shifter, Decision Guide, Mediator: 1 Sonnet call per turn, standard conversation cost (~$0.01-$0.02 per session).
- Translator: 1 Haiku call per rewrite, negligible cost (<$0.001).
- Persona caching (P8 pattern) ensures generation costs are one-time per public figure.
- Estimated total ThoughtSift AI cost per family per month: $0.05-$0.15 depending on usage intensity.

**Action needed:**
- Add ThoughtSift cost line items to the AI Cost Optimization Patterns document.
- Note Board of Directors as a cost-intensive tool with the 3-default/5-max guardrail.

---

## Impact on Build Order Source of Truth v2

**What changed:**
- PRD-34 (ThoughtSift — Decision & Thinking Tools) is complete.
- 6 new tables: `board_personas`, `board_sessions`, `board_session_personas`, `persona_favorites`, `perspective_lenses`, `decision_frameworks`.
- 5 new feature keys: `thoughtsift_board_of_directors`, `thoughtsift_perspective_shifter`, `thoughtsift_decision_guide`, `thoughtsift_mediator`, `thoughtsift_translator`.
- 5 new guided mode registrations replacing 1 placeholder.
- 1 existing guided mode superseded: `relationship_mediation` → `mediator`.
- Build dependencies: requires PRD-05 (conversation engine), PRD-07 (InnerWorkings for family-context lenses), PRD-13 (Archives for context), PRD-19 (relationship notes for Mediator Full Picture), PRD-21A (Vault listing), PRD-30 (safety pipeline).

**Action needed:**
- Move PRD-34 from "Remaining PRDs" to "Completed PRDs."
- Update remaining PRD count.
- Add 6 new tables to the total table count.
- Note build dependency chain.

---

## Impact on Pre-Build Setup Checklist

**What changed:**
- 5 Vault thumbnail images needed for the 5 ThoughtSift tools.
- Starter pack personas need to be seeded in the `board_personas` table during initial data seeding.
- 15 decision frameworks need to be seeded in the `decision_frameworks` table.
- Perspective Shifter starter lenses (6 simple shifts + 8 named frameworks) need to be seeded in `perspective_lenses`.

**Action needed:**
- Add ThoughtSift visual asset creation to the pre-build visual asset audit task.
- Add ThoughtSift seed data (personas, frameworks, lenses) to the database seeding task.

---

## New Tables Summary

| Table | PRD | Purpose |
|-------|-----|---------|
| `board_personas` | PRD-34 | Persona profiles for Board of Directors (three-tier library) |
| `board_sessions` | PRD-34 | Links BoD conversations to their seated personas |
| `board_session_personas` | PRD-34 | Individual persona seats per session (including Prayer Seats) |
| `persona_favorites` | PRD-34 | User's favorited personas for quick access |
| `perspective_lenses` | PRD-34 | Lens definitions for Perspective Shifter (system, community, custom) |
| `decision_frameworks` | PRD-34 | Decision framework definitions for Decision Guide |

**Total new tables: 6**

---

## New Feature Keys

| Key | PRD | Tier |
|-----|-----|------|
| `thoughtsift_board_of_directors` | PRD-34 | Full Magic |
| `thoughtsift_perspective_shifter` | PRD-34 | Full Magic |
| `thoughtsift_decision_guide` | PRD-34 | Enhanced |
| `thoughtsift_mediator` | PRD-34 | Enhanced |
| `thoughtsift_translator` | PRD-34 | Enhanced |

---

*End of PRD-34 Cross-PRD Impact Addendum*
