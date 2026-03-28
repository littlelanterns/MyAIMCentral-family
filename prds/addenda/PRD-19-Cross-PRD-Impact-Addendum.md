# PRD-19 Cross-PRD Impact Addendum

**Created:** March 13, 2026
**Session:** PRD-19 (Family Context & Relationships)
**Purpose:** Documents how PRD-19 decisions affect prior PRDs and establishes new patterns/conventions.

---

## New Patterns Established

### Dual-Context Model (Shared + Private)
PRD-19 establishes that when viewing any family member's Archive detail, there are two distinct context sections: "Shared by [Name]" (items the person has opted to share) and "My Private Notes" (the viewer's own observations, never visible to the subject). This pattern applies to parent-child, spouse, and sibling relationships. Private notes use `is_private_note = true` on `archive_context_items` with RLS enforcement — not just UI hiding.

### Multi-Author Relationship Notes with Per-Author Privacy
Relationship notes between two people can be authored by multiple family members (mom, dad, independent teens, guided children via simplified prompts). Each author sees only their own notes. The `relationship_notes` table uses a UUID normalization constraint (`person_a_id < person_b_id`) to prevent duplicate pairs. The `author_id` determines visibility.

### Full Picture Mediation Mode
A new LiLa guided mode (`relationship_mediation`) allows mom to access all authors' relationship notes for a pair, loaded into LiLa's context with neutral labels ("Perspective A", "Perspective B") — never attributed by name, never displayed on screen. LiLa synthesizes without revealing specifics.

### Validate → Curiosity → Empower Arc
PRD-19 establishes a system-wide ethical framework for all relationship interactions. LiLa always validates feelings first, invites the person's own curiosity about the dynamic, offers gentle reframes as possibilities (not instructions), and empowers with ownership and agency. Abuse exception modifies the arc — curiosity about the abuser's perspective is not invited; empowerment focuses on safety.

### "How to Reach Me" Card
A structured per-member communication guide (5 fields). Stored as a single JSONB `archive_context_items` record. Loaded as HIGH-PRIORITY context for all communication tools. Teens can write their own as self-advocacy.

### Nickname Recognition + External Alias System
Two distinct name systems: nicknames (many per member, for LiLa recognition) and external alias (one per member, for Optimizer substitution in external LLM prompts).

### Monthly Context Freshness Review
Billing-day aggregation includes a four-step process: aggregate → compare against existing context → generate suggested additions/revisions/removals → present to mom for review.

### External Tool Context Update Pipeline
Optimizer-generated external tools include a "context slot" with update instructions. Monthly freshness reviews generate pre-formatted context update blocks for deployed external tools. Tools degrade without fresh context — natural retention hook.

### Relationship Notes Starter Prompts
Optional tappable reflection prompts tailored by author role. Includes forward-looking empowerment questions.

---

## Impact on PRD-01 (Auth & Family Setup)

**What changed:**
- Bulk add flow gets a post-creation context enrichment step. After AI parses members from natural language, PRD-19 extracts context items from the descriptions and saves them as `archive_context_items` with `source = 'bulk_setup'`.

**Action needed:**
- Note that PRD-19 extends the bulk add flow with context extraction from the same natural language input.

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- Private notes (`is_private_note = true`) introduce a new hard privacy boundary enforced at RLS.
- Relationship notes introduce per-author privacy on a shared-pair table.
- `is_shared_with_spouse` and `is_shared_with_family` are new per-item sharing mechanisms.
- "How to Reach Me" cards written by teens are shared with mom by default.

**Action needed:**
- Add `is_private_note` exclusion to permission engine resolution.
- Add `relationship_notes` RLS policy pattern to documentation.
- Register all new feature keys in the Feature Key Registry.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- New context sources: private notes (author-only), relationship notes (author-only normal / all-authors mediation), shared partner context, "How to Reach Me" cards (high priority).
- New guided modes: `family_context_interview`, `relationship_mediation`.
- Nickname resolution table loading at conversation start.
- Sort order priority for context item loading.
- Validate → Curiosity → Empower arc as system-wide relationship convention.

**Action needed:**
- Add nickname resolution, sort order priority, private note filtering, relationship note loading rules, and "How to Reach Me" high-priority loading to context assembly pipeline.
- Register both new guided modes.
- Add the ethical framework as a system prompt convention for relationship-adjacent modes.

---

## Impact on PRD-05C (LiLa Optimizer)

**What changed:**
- Alias substitution: replace all name variants with `external_alias` in external platform output.
- External tool context update pipeline: generated tools include "context slot" with update instructions. Monthly reviews produce pre-formatted update blocks for deployed tools.

**Action needed:**
- Add alias lookup to prompt formatting pipeline.
- Add external tool registry concept: track deployed tools, their platform, and their context state. Monthly freshness review generates targeted update blocks per tool.

---

## Impact on PRD-07 (InnerWorkings)

**What changed:**
- `is_shared_with_spouse` sharing pattern extended to `archive_context_items` alongside existing InnerWorkings sharing columns.

**Action needed:**
- Verify consistency between InnerWorkings sharing (`is_shared_with_mom`, `is_shared_with_dad`) and Archives sharing (`is_shared_with_spouse`, `is_shared_with_family`). Both coexist — different purposes.

---

## Impact on PRD-11 (Victory Recorder)

**What changed:**
- Relationship Wins stub: victories mentioning two people can auto-tag as relationship wins.

**Action needed:**
- Note as future enhancement. No schema changes needed now.

---

## Impact on PRD-13 (Archives & Context)

**What changed:**
- `archive_context_items` gets 4 new columns: `is_private_note`, `is_shared_with_spouse`, `sort_order`, `document_id`.
- `archive_member_settings` gets 4 new columns: `display_name_aliases`, `external_alias`, `use_alias_for_external`, `guided_interview_progress`.
- New `source` and `context_type` enum values added.
- PRD-19 Screen 2 supersedes PRD-13 Screen 2 for the enhanced member detail experience.

**Action needed:**
- Update PRD-13 schema to note columns "added by PRD-19."
- Update RLS policies for `is_private_note` enforcement.
- Note that PRD-19 Screen 2 extends PRD-13 Screen 2.

---

## Impact on PRD-15 (Messages & Notifications)

**What changed:**
- Message coaching should load "How to Reach Me" cards as high-priority context for the recipient.

**Action needed:**
- Add "How to Reach Me" card loading to message coaching context assembly.

---

## Impact on PRD-18 (Rhythms & Reflections)

**What changed:**
- Rhythm completion data and reflection responses feed into monthly data aggregation.

**Action needed:**
- Note `monthly_data_aggregations` as a consumer of rhythm/reflection data.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-19 completed. Titled "Family Context & Relationships."
- Consolidates Planning Decisions features #17, #18, #19.
- New tables: `member_documents`, `relationship_notes`, `monthly_data_aggregations`.
- New guided modes: `family_context_interview`, `relationship_mediation`.
- AI Toolbox stub established.
- External tool context update pipeline established.
- Monthly context freshness review established.

**Action needed:**
- Update Section 2 with PRD-19 completion.
- Update Section 5 to note #17, #18, #19 absorbed.
- Add new guided modes to Section 9.
- Add AI Toolbox to stub registry.
- Note Planning Decisions doc needs reconciliation during pre-build audit.

---

*End of PRD-19 Cross-PRD Impact Addendum*
