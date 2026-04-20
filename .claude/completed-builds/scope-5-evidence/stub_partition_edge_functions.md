# Scope 5 Partition — Edge Functions & Server Logic

> **Domain:** Supabase Edge Functions (anything under `supabase/functions/`), server-side AI pipelines, async server logic, embedding pipeline, cron-driven server work.
> **Source:** `STUB_REGISTRY.md`.
> **Source checksum at dispatch:** 547 lines, 224 entries. Last-modifying commit: `c2e04e3` (2026-04-17 22:24). See `EVIDENCE_RECIPE.md` → "Registry integrity check" for the halt-on-drift protocol.
> **Count in this partition:** 9 to-be-processed entries.
> **Recipe:** `scope-5-evidence/EVIDENCE_RECIPE.md` — READ IN FULL before processing the calibration entry.
> **Output:** `scope-5-evidence/STUB_REGISTRY_EVIDENCE_EDGE_FUNCTIONS.md`.

## Format

Each row: `STUB_REGISTRY.md line <N> | <Stub column from registry>`.

Sub-agent reads the full row from `STUB_REGISTRY.md` at the cited line number when processing.

**Rationale column stripped 2026-04-19.** Pilot review found categorization hints were wrong in ~40% of sampled cases. Trust the recipe's 4-level Identifier Extraction chain (including the (d.5) bounded-source-code-lookup step), not partition-file hints.

## Calibration entry (process FIRST in this partition)

**Line 497 — `curriculum-parse` Edge Function.**

Why this one: contrast case to Schema's calibration. Line 497's stub row explicitly names the identifier (`curriculum-parse Edge Function`), so Field 1 resolves at level (a) — no (b)-(d) cross-reference chain needed. This calibration verifies the sub-agent handles the "identifier named in stub" case correctly WITHOUT invoking unnecessary cross-reference lookups.

Expected evidence-packet content (founder's known-good answer — verified 2026-04-19 against the working tree):

- Field 1 (a) → identifier `curriculum-parse`, source: stub entry line 497 (row text includes "dedicated Haiku-powered Edge Function (not ai-parse)"). Secondary identifier: `CurriculumParseModal` (caller component named in stub text).
- Field 2 grep for `curriculum-parse` across `supabase/functions/` → directory `supabase/functions/curriculum-parse/` with `index.ts` inside. The `index.ts` file has a Build J header, Zod-validated input/output, `OPENROUTER_API_KEY` env reference, `MODEL = 'anthropic/claude-haiku-4.5'`, and a detailed SYSTEM_PROMPT describing extraction rules.
- Field 3: Caller grep should surface `CurriculumParseModal.tsx` (or similar) and its parent `SequentialCreator.tsx`. Last-touching commit should date to Build J (around 2026-04-06).
- Field 4: Stub row's "wired by" cell already names "Linked Steps addendum (Build J)". PRD-09A/09B Studio Intelligence addendum should describe the function. CLAUDE.md convention 165 names `curriculum-parse` explicitly.
- Field 6 neutral summary: function exists at expected path, caller wired, Build-J era commit, convention 165 corroborates. No verdict.

If the packet can't find `supabase/functions/curriculum-parse/index.ts` OR the file is an empty stub with no SYSTEM_PROMPT, that's the red flag.

Process this entry first. Founder compares your calibration packet against the expected content above before approving the partition for full run.

## Entries (to-be-processed)

| Line | Stub identifier |
|---|---|
| 42 | Recalculate tier blocks Edge Function |
| 56 | Voice input (Whisper) |
| 65 | BookShelf RAG context |
| 81 | Voice input (Whisper) — duplicate row, process with cross-reference note to packet at line 56 |
| 139 | Haiku overview card generation (AI call) |
| 165 | MindSweep email forwarding |
| 445 | AI Auto-Sort for views |
| 476 | Full PRD-30 Layer 2 Haiku safety classification for ThoughtSift |
| 497 | **CALIBRATION** — curriculum-parse Edge Function |

## Ambiguous entries — ADVISORY ONLY, do NOT process twice

All three ambiguous entries below are in the to-be-processed table above.

- **Line 65 (BookShelf RAG context)** — intersection of Edge Function code and platform RPC. Primary code path at run time is the context-assembler function.
- **Line 139 (Haiku overview card generation)** — no explicit function name in registry. Haiku AI call implies server-side Edge Function boundary (never ship API key to client). **Expected to resolve at level (e) capability-only** or at (d.5) if an Edge Function is named in an addendum — good stress test for those paths.
- **Line 445 (AI Auto-Sort)** — sort IS a UI feature; implementation needs server-side `ai-parse`. The Edge Function absence is the gating factor.

If the same line number appears in another partition's to-be-processed table, STOP and report the conflict under a `## CROSS-PARTITION CONFLICT` heading.

## Out of scope for this partition

Entries whose primary identifier is a React component, DB trigger/column/table, or client-side hook belong in a different partition. Record partition mismatch in the output file and move on.
