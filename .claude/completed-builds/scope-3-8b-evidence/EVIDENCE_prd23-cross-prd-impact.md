---
Status: COMPLETE (worker analysis captured by orchestrator after sub-agent Write-permission denial; findings are worker-attested, file paths verified by orchestrator)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-20
Addendum: prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-23 (source) ↔ PRD-06 (GuidingStars/BestIntentions), PRD-08 (Journal — quick_note + prompts), PRD-09A (Tasks — action steps), PRD-13 (Archives — three-tier toggle), PRD-15 (Notepad/Discussion — partial), PRD-18 (Rhythms — Morning Insight bookshelf match), PRD-21A (AI Vault — BookShelf entry), PRD-30 (Safety — Deferred-to-Gate-4)
Provenance: Worker `a782509bbdfeeb7c8` ran the full evidence pass in-memory across the addendum, BookShelf migrations, the `bookshelf-discuss` Edge Function, the `get_bookshelf_context` RPC, the `extractionActions.ts` outbound surface, and the per-PRD destination consumers. Worker's Write/Bash were denied at file-create time. Worker's findings summary captured below verbatim. Orchestrator did NOT re-run the analysis.
---

## Worker cover paragraph

Worker traversed BookShelf integration outbound to four destination PRDs (Guiding Stars via declarations, Tasks via action steps, Journal via prompts, AI Vault via tool listing) plus the LiLa context-assembly axis. Read addendum + Phase-1b platform migration + `bookshelf-discuss` Edge Function (separate from `lila-chat`, separate conversation tables) + `get_bookshelf_context` RPC + `extractionActions.ts` + destination consumers. Identified 13 row-level seams collapsing to 5 distinct findings (A–E). The traversal exposed two SCOPE-8b primary findings (Crisis Override / safety monitoring bypass on `bookshelf-discuss`; PRD-13 person-level master toggle bypass in context RPC) and three SCOPE-3 findings (handoff partial-wiring, addendum schema drift across 5 sub-items, embedding-without-context-inclusion gap). Addendum predates Phase 1b platform migration and references tables that no longer exist — schema drift is significant.

## Per-seam findings table (worker pre-consolidated to A–E + cross-pattern)

Worker reported 13 seams analyzed but consolidated to 5 findings + 1 cross-addendum pattern at evidence-write time per PLAN §5.1 discipline.

| Finding | Description | Classification | Proposed finding tag | Severity | Beta default |
|---|---|---|---|---|---|
| **A** | `bookshelf-discuss` Edge Function bypasses Crisis Override + safety monitoring. No `detectCrisis` / `CRISIS_OVERRIDE` import; messages persist to `bookshelf_discussion_messages` NOT `lila_messages`, so PRD-30 cannot scan them when built. | Unintentional-Fix-Code | **SCOPE-8b** primary + SCOPE-3 cross-ref | High | **Y** |
| **B** | `get_bookshelf_context` RPC bypasses PRD-13 person-level master toggle (`archive_member_settings.is_included_in_ai`). Three-tier toggle is broken at the top tier specifically for BookShelf items. | Unintentional-Fix-Code | **SCOPE-8b** primary + SCOPE-3 cross-ref | Medium-High | **Y** |
| **C** | Five outbound handoffs partially built or silently broken: (1) Discussion action chips absent; (2) Tasks `onSave` is a no-op — TaskCreationModal opens but no row created; (3) "Write About This" → Notepad routes to Tasks instead of Notepad; (4) `useSemanticSearch()` hook absent; (5) Rhythms "From Your BookShelf" card not built. `markSentToTasks()` exposed with zero call sites. | Unintentional-Fix-Code (partial-wiring) | **SCOPE-3** | High | N (UX broken, not safety) |
| **D** | Cross-PRD addendum schema drift in 5 sub-items: (1) addendum references nonexistent tables (`bookshelf_principles` never created); (2) 5-way enum drift on `book_knowledge_access`; (3) unwirable `source_type='content_extraction'`; (4) Victory PRD disagreement on whether BookShelf can flag victories; (5) Channel E (extraction cache) overstated. | Unintentional-Fix-PRD (addendum stale post-Phase-1b) | **SCOPE-3** | Medium | N |
| **E** | `bookshelf_questions` table has `embedding` column but is excluded from LiLa context assembly. Either drop the column (no consumer) or wire the consumer (PRD spec implies it should be loaded). | Unintentional-Fix-Code OR Unintentional-Fix-PRD (founder decides direction) | **SCOPE-3** | Low | N |

## Cross-addendum pattern candidate (flagged for orchestrator §5.2 review)

**`source` field has NO CHECK constraint on outbound destination tables.** `tasks.source`, `guiding_stars.source`, `best_intentions.source` — all freeform TEXT. Addenda routinely request "add 'X' to the source enum" but no enum exists at the schema layer. Pattern likely repeats across PRD-08 (notepad source), PRD-15 (`family_requests.source` enum drift confirmed in PRD-15 evidence file seam #9), PRD-17B (`mindsweep_*` sources), PRD-34 (ThoughtSift sources). Worker recommends elevating to a single cross-addendum SCOPE-3 finding once 3+ surfaces confirm. Reference for cross-check: `00000000000009_remediation_schema_batch.sql:315`.

## Beta Y candidates

A, B — both safety/privacy guardrail drift. SCOPE-8b primaries.

## Top 3 surprises

1. Addendum predates Phase 1b platform migration — references `bookshelf_principles` (table never created).
2. `bookshelf-discuss` is a SEPARATE Edge Function from `lila-chat` with SEPARATE conversation tables (`bookshelf_discussions` + `bookshelf_discussion_messages`) — Crisis Override + PRD-30 are invisible to it.
3. BookShelf "Send to Tasks" flow opens `TaskCreationModal` but `onSave` is a no-op — no `tasks` row ever created from BookShelf. `markSentToTasks()` exposed by hook with zero call sites.

## Watch-flag hits

- **Crisis Override duplication / propagation gap** — Finding A confirms absence in `bookshelf-discuss`
- **`is_included_in_ai` three-tier propagation** — Finding B confirms person-level master toggle bypass
- **studio_queue source discipline (adjacent)** — `extractionActions.ts:189-212` writes `source:'bookshelf'` to direct destination tables (NOT studio_queue, but the freeform-source pattern is the same root)

## Orchestrator adjudication

(empty — pending walk-through against synthesis doc)
