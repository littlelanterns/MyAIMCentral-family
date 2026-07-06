# Pre-Dispatch Pack — TYPES: Generated Supabase TypeScript Types Adoption

> **Factory status:** synthesized → decisions-pending (1 decision, batch 7)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: TYPES. Priority: P6 (foundational,
> Post-MVP-classified but quality-compounding). Factory-written from the established record
> (View-As follow-up D + `claude/follow-up-builds/supabase-types-foundation.md`) — no fresh
> recon needed; the build-time worker re-verifies.

## The gap (established 2026-05-28, View-As Checkpoint 2)

`src/lib/supabase/client.ts` calls `createClient(...)` WITHOUT the `Database` generic, so every
`supabase.from(...)` query is loosely typed — `tsc -b` cannot catch column-name typos or
enum-violation values on `.insert()` payloads across a 200+-table codebase. The `db:types`
script exists in package.json; `src/types/supabase.ts` is not committed. Until adopted, builds
compensate procedurally (Disciplines 1+2: runtime smoke tests on writes + Checkpoint-5
insert-path verification).

## Rulings

1. **Incremental adoption, never big-bang (D-TYPES-1).** Flipping the generic on the shared
   client would surface hundreds of type errors across the whole codebase in one PR — high
   regression risk, unreviewable. Instead:
   (a) generate + COMMIT `src/types/supabase.ts` (regenerated after every migration alongside
   `npm run schema:dump` — the close-out checklist gains a line);
   (b) export a typed client alias (`supabase` typed via `createClient<Database>` — same
   instance, typed surface) and fix errors MODULE-BY-MODULE, starting with the highest-risk
   write paths (hooks that insert: tasks, completions, rewards, journal);
   (c) new code MUST use the typed surface from day one (a convention line lands at close-out);
   (d) hand-written row interfaces in `src/types/*.ts` migrate to `Tables<'x'>` aliases
   opportunistically, never in bulk.
2. **Timing:** dispatch in a QUIET window between feature builds (it touches everything a
   little); ideal right after a migration-heavy build closes so the generated file starts
   maximally fresh.
3. **The generated file is an artifact, not truth** — PRDs and live_schema stay authoritative;
   the type file is regenerated, never hand-edited (same rule class as Convention #244).

## Slice plan (single Sonnet worker, 1-2 sessions)
| Slice | Scope | Routing |
|---|---|---|
| 1 | Generate + commit types; typed client surface; CI/lint guard that the file is current (compare hash after schema:dump); close-out checklist + convention line | Sonnet xhigh |
| 2 | Module-by-module adoption of the top write-path hooks (tasks/completions/rewards/journal/lists) — fix surfaced errors; each module's fixes verified by existing pins | Sonnet xhigh |
| 3 | Report: remaining untyped modules ranked by write-risk (the backlog future builds burn down opportunistically) | Sonnet xhigh |
| Gates | Checkpoint 5 | **Fable if available, else Opus** |

## Open founder decision (batch 7)
| # | Decision | Recommendation |
|---|---|---|
| D-TYPES-1 | Incremental adoption strategy (typed surface + module-by-module), types file committed + regenerated with schema:dump | Yes — big-bang is unreviewable risk for zero extra value |

## DISPATCH PROMPT (paste into a FRESH session — quiet window, after batch-7 decisions)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for TYPES — generated Supabase types adoption. Pack:
claude/dispatch-factory/TYPES.md (3 rulings). Also read
claude/follow-up-builds/supabase-types-foundation.md.

FRESHNESS PREAMBLE: git log --since=2026-07-04; confirm no other session is mid-migration
(coordinate — your generated file must match the moment's schema); run `npm run db:types`
against production per the package.json script.

BUILD per the 3-slice plan. HARD RULES: incremental only — the shared client instance is
unchanged, the TYPED SURFACE is what modules migrate to; zero behavior changes (types only —
any real bug the types surface gets FIXED and called out separately in your report, never
silently absorbed); the generated file is never hand-edited; every existing E2E pin you can
cheaply run after each module migration, runs (ask the founder before shared-fixture suites);
tsc -b clean at every commit point.

PROOF: tsc -b + lint + affected pins + a demonstration probe (introduce a deliberate
column-typo in a scratch branch file and show tsc now catches it). NOTHING COMMITS until green
+ founder confirmation. Close-out: Checkpoint 5, convention line ("new supabase calls use the
typed surface; regenerate types with schema:dump"), the ranked remaining-modules backlog
registered, archive build file.
```
