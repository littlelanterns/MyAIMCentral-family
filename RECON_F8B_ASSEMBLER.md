# RECON F8b — Decision Guide + Board of Directors: Assembler Bypass Verdict

## 1. Verdict

**`LILA-POWERED-BUT-BYPASSING`** — Both Decision Guide and Board of Directors ARE registered in `lila_guided_modes` with non-empty `context_sources` arrays declaring them as LiLa-powered tools (category 1), yet both Edge Functions hand-roll context queries against the exact tables the shared assembler owns, bypassing `assembleContext` entirely. This is an architectural defect, not a utility-pattern choice. F8b reclassifies **Fix Next Build**, sequenced with SCOPE-4.F4 Board sprint.

## 2. Per-tool evidence table

| Tool | `mode_key` registered? | `context_sources` declared | Uses `assembleContext`? | `guided_mode_key` on vault_items | `delivery_method` | Verdict |
|---|---|---|---|---|---|---|
| `decision_guide` | Yes (mig 100049:258) | `{guiding_stars, self_knowledge, best_intentions}` | **No** — hand-rolls queries (lines 29–71) | `decision_guide` (mig 100049:711) | `native` (mig 100049:711) | Category 1, bypassing |
| `board_of_directors` | Yes (mig 100049:256) | `{guiding_stars, self_knowledge, best_intentions}` | **No** — hand-rolls queries (lines 420–428) | `board_of_directors` (mig 100049:655) | `native` (mig 100049:655) | Category 1, bypassing |
| `task_breaker` (control) | Yes (mig 100021:36) | `{}` (**empty**) | No (correctly) | n/a (separate vault path) | n/a | Category 2, correct |

## 3. Code citations

- Decision Guide imports: `supabase/functions/lila-decision-guide/index.ts:6-10` — no `context-assembler` import.
- Decision Guide hand-rolled context loader: `supabase/functions/lila-decision-guide/index.ts:25-81` (`loadDecisionContext`), queries `guiding_stars`, `best_intentions`, `self_knowledge` directly with no `is_privacy_filtered`, no three-tier toggle cascade, no name-detection layer.
- Board of Directors imports: `supabase/functions/lila-board-of-directors/index.ts:8-11` — no `context-assembler` import.
- Board of Directors hand-rolled context loader: `supabase/functions/lila-board-of-directors/index.ts:419-433` — same three tables, same gaps.
- Registration evidence: `supabase/migrations/00000000100049_prd34_thoughtsift_tables.sql:256,258` — `context_sources` arrays populated.
- Shared assembler exists and enforces privacy filter: `supabase/functions/_shared/context-assembler.ts:204` (`export async function assembleContext`) and `:611` (is_privacy_filtered stripping logic).
- Task Breaker control: `supabase/migrations/00000000000021_lila_opening_messages.sql:36-48` — `context_sources='{}'`, declaring utility intent. Edge Function at `supabase/functions/task-breaker/index.ts:9-10` correctly does not import assembler.

## 4. Comparison to Task Breaker

Task Breaker's registration in `lila_guided_modes` carries an **empty `context_sources` array** — the declaration itself says "this tool loads no family context." Its Edge Function correctly does not import `assembleContext`. The utility-pattern invariant: **non-empty `context_sources` in `lila_guided_modes` obligates the Edge Function to use the shared assembler.** Decision Guide and Board of Directors both declare context needs and then bypass the mechanism that enforces the three-tier toggle cascade, `is_privacy_filtered`, Safe Harbor exclusion, name detection, and topic matching. This is not a different category — it is category 1 implemented incorrectly.

Supporting conventions: Convention 98 (PRD-34) mandates `synthesizeFamilyContext()` dual enforcement for Perspective Shifter; Convention 104 says all ThoughtSift tools pass through PRD-30 safety monitoring; CLAUDE.md lines 74–76 + 243 (aggregation guardrail) collectively require all LiLa-powered context loads to respect `is_privacy_filtered` and Safe Harbor filtering — neither hand-rolled loader does.

## 5. Recommended F8b reclassification

Proposed TRIAGE_WORKSHEET.md text for the Proposed column:

> **Fix Next Build — sequence with SCOPE-4.F4 Board sprint.** Decision Guide and Board of Directors are registered in `lila_guided_modes` with non-empty `context_sources` arrays (category-1 LiLa-powered), but their Edge Functions hand-roll context queries that bypass `assembleContext` and therefore skip the three-tier toggle cascade, name detection, topic matching, and Safe Harbor aggregation guard. F8a privacy-filter fix is a subset of this work. Refactor both Edge Functions to call `assembleContext` with the appropriate per-tool options (Decision Guide: topic matching for values-adjacent questions; Board of Directors: full assembly plus prior-advisor turn stitching). Perspective Shifter and Mediator should be audited in the same pass since all four share the category-1 pattern.

## 6. Convention / PRD updates needed

None required for verdict `UTILITY-PATTERN-CORRECT` — verdict is the opposite. The CLAUDE.md ThoughtSift section (Conventions 92–105) and PRD-34 already imply shared-assembler use via Convention 98's `synthesizeFamilyContext()` requirement and Convention 104's safety pipeline mandate. PRD-34 should gain one explicit sentence during the F8b fix build:

> "All category-1 ThoughtSift tools (Board of Directors, Perspective Shifter, Decision Guide, Mediator) load family context exclusively through `_shared/context-assembler.ts#assembleContext`. Hand-rolled queries against `guiding_stars`, `self_knowledge`, `best_intentions`, `archive_context_items`, or `faith_preferences` are prohibited in these Edge Functions — they bypass the three-tier toggle cascade, `is_privacy_filtered` hard constraint, and Safe Harbor aggregation guard."

New convention candidate (would slot after #105):

> **105a. ThoughtSift category-1 tools MUST use `assembleContext`.** Any tool registered in `lila_guided_modes` with a non-empty `context_sources` array is category-1 LiLa-powered and must load context via the shared assembler. Empty `context_sources` (`'{}'`) is the category-2 utility declaration (Task Breaker pattern). A non-empty array combined with hand-rolled queries is an architectural defect, not a design choice.
