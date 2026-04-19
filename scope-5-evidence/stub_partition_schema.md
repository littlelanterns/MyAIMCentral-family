# Scope 5 Partition — Schema & Migrations

> **Domain:** Database schema — tables, triggers, columns, RLS policies, enums, RPCs, migrations, seed data.
> **Source:** `STUB_REGISTRY.md`.
> **Source checksum at dispatch:** 547 lines, 224 entries. Last-modifying commit: `c2e04e3` (2026-04-17 22:24). See `EVIDENCE_RECIPE.md` → "Registry integrity check" for the halt-on-drift protocol.
> **Count in this partition:** 48 to-be-processed entries. **5 already processed in pilot** (2026-04-19): lines 398, 413, 417, 446, 456. See `scope-5-evidence/STUB_REGISTRY_EVIDENCE_SCHEMA.md`.
> **Session 1 resume point: entry 469** (first unprocessed entry in this partition after the pilot). Do NOT re-process entries 398, 413, 417, 446, 456 — their packets exist and are under review.
> **Recipe:** `scope-5-evidence/EVIDENCE_RECIPE.md` — READ IN FULL before starting.
> **Output:** Append to `scope-5-evidence/STUB_REGISTRY_EVIDENCE_SCHEMA.md` — do NOT overwrite the pilot's 5 packets.

## Format

Each row: `STUB_REGISTRY.md line <N> | <Stub column from registry>`.

Sub-agent reads the full row from `STUB_REGISTRY.md` at the cited line number when processing.

**Rationale column stripped 2026-04-19.** An earlier draft of this file included a "Rationale" column with categorization hints. Pilot review (2026-04-19) found rationale was wrong in 2 of 5 sampled entries — it guessed `widget_templates` for entry 413 (actual table: `widget_starter_configs`) and `coloring_image_library` for entry 417 (actual live table: `coloring_reveal_library`). Sub-agents relying on rationale hints would have been misled on those entries. Column removed. Trust the recipe's 4-level Identifier Extraction chain (including the (d.5) bounded-source-code-lookup step added 2026-04-19). If you find yourself wanting a rationale hint, that's the sub-agent's Field 1 work to produce — not a shortcut this file provides.

## Calibration entry (process FIRST in this partition)

**Line 494 — `Sequential advancement modes (practice_count, mastery)`.**

Why this one: the pilot validated the recipe on Schema. This calibration validates the Session 1 INSTANCE — a fresh Claude Code session may process the recipe differently than the pilot session, so session-instance drift risk is independent of recipe validation. Line 494 has 7 distinct sub-claims packed into its registry row (migration + 2 tables × 3 columns + hook + 4 components + E2E test count). A rigorous packet verifies all seven; a sloppy packet verifies one or two and moves on. Session-instance rigor test.

Expected evidence-packet content (founder's known-good answer):

- Field 1 (a) → multi-identifier case. Direct identifiers from stub row:
  - Columns: `advancement_mode`, `practice_target`, `mastery_status` (on both `tasks` AND `list_items` per CLAUDE.md convention #158 and #162)
  - Migration: `00000000100105_*` — the Build J migration
  - Hook: `usePractice.ts`
  - Components: `SequentialCreator` (defaults section), `SequentialCollectionView` (per-item progress), `TaskCard` (submit-as-mastered button)
  - Queue fork: `PendingApprovalsSection` in `Tasks.tsx` (around line 1062 per CLAUDE.md #161)
  - E2E: "7/7 E2E tests passing" — spec files should exist
- Field 2 grep expected:
  - Migration 100105 exists at `supabase/migrations/00000000100105_*.sql`. Grep should find CREATE or ALTER statements adding `advancement_mode`, `practice_target`, `mastery_status` to both `tasks` and `list_items`.
  - `src/hooks/usePractice.ts` exists. Hook exports `useLogPractice`, `useApproveMasterySubmission`, `useRejectMasterySubmission` (per CLAUDE.md #159 / #160).
  - Component files exist in `src/components/tasks/sequential/` (the directory surfaced in the pilot).
  - E2E spec files in `tests/e2e/features/` matching sequential-mastery patterns.
- Field 3 callers:
  - `usePractice` hook callers — likely `SequentialCollectionView`, `TaskCard`, and mastery approval components.
  - Last-touching commits date to Build J era (2026-04-06 or shortly after).
- Field 4:
  - CLAUDE.md convention #158 documents `advancement_mode` column semantics.
  - CLAUDE.md convention #159 documents `practice_log` as the unified practice session table.
  - CLAUDE.md convention #161 names `PendingApprovalsSection` at `Tasks.tsx:1062` with the mastery fork behavior.
  - `prds/addenda/PRD-09A-09B-Linked-Steps-*` addendum should describe the advancement-mode design.
- Field 5 (expected to include):
  - E2E test execution not run — only spec file existence confirmed.
  - Production row counts for `mastery_status` distribution not checked.
  - CLAUDE.md convention #205 notes randomizer mastery is a known gap outside the gamification pipeline; not directly relevant to this entry but worth flagging.
- Field 6 neutral summary: multi-identifier entry; 7 sub-claims verified across migration + hook + 4 components + convention layer; alignment with registry claim. No verdict.

**Rigor red flags to watch for:**
- Packet that grep'd only migration 100105 and skipped the 3 component verifications → thinness.
- Packet that confirmed `advancement_mode` on `tasks` but skipped checking `list_items` → incomplete.
- Packet that named `SequentialCreator` without verifying the "defaults section" claim → hand-waving.
- Packet that did NOT mention CLAUDE.md conventions #158/#159/#161 → missed Field 4.

Process this entry first. Founder compares your calibration packet against the expected content above. Session 1 PAUSES after packet 1 and waits for the founder message `Session 1 calibration approved, continue.` before processing the remaining 42 Schema-remainder entries (starting at 469).

## Pilot context

Schema partition's original calibration (line 398 Backburner/Ideas) was processed in the 2026-04-19 pilot and validated by the founder. The pilot also processed entries 413, 417, 446, 456. Those 5 packets are already in `STUB_REGISTRY_EVIDENCE_SCHEMA.md`. Session 1 APPENDS its work to that same file — starting with the new calibration packet (line 494), then the remaining 42 entries starting at 469. Do NOT overwrite the pilot's 5 packets. Do NOT re-process entries 398, 413, 417, 446, 456.

## Entries (to-be-processed — pilot-completed entries omitted)

| Line | Stub identifier |
|---|---|
| 28 | Tablet hub timeout config |
| 32 | View As sessions |
| 34 | View As feature exclusions |
| 36 | Shift schedule config |
| 37 | PIN lockout (server-side) |
| 38 | Default permission auto-creation |
| 39 | Emergency lockout toggle |
| 40 | Permission profiles → Layer 3 |
| 74 | Privacy Filtered category |
| 88 | Family-level GuidingStars |
| 133 | My Circle folder type |
| 163 | Meeting templates in AI Vault |
| 173 | Studio rhythm template library |
| 194 | PRD-18 Phase D: Independent Teen tailored rhythm |
| 195 | Custom report templates (mom-authored) |
| 197 | My Circle (non-family contacts) |
| 230 | Drop old per-family BookShelf tables (Phase 1c) |
| 231 | bookshelf_chapters migration to platform |
| 243 | Task unmark cascade |
| 256 | Task segments |
| 257 | 4 creature earning modes |
| 258 | 3 page earning modes |
| 259 | Coloring reveal library (32 subjects) |
| 260 | Task-linked coloring reveals (1:1 earning_task_id) |
| 267 | Sunday List faith-themed sticker theme override |
| 268 | Streak milestone earning mode |
| 269 | Timer goal earning mode |
| 270 | Approval-based manual earning mode |
| 279 | IEP Progress Report template |
| 280 | Therapy Summary template |
| 291 | Family Newsletter report template |
| 390 | Studio seed templates (15 in DB) |
| 469 | `is_available_for_mediation` per-note toggle |
| 492 | capability_tags populated on all 27 seed templates |
| 494 | Sequential advancement modes (practice_count, mastery) |
| 495 | practice_log + randomizer_draws tables |
| 496 | Linked routine steps (`step_type` enum) |
| 498 | Reading List Studio template |
| 500 | Randomizer draw modes (focused / buffet / surprise) |
| 517 | PRD-28B Compliance & Progress Reporting (6 tables) |
| 532 | `lila_messages.safety_scanned` column (migration 7, line 86) |
| 533 | `lila_conversations.safety_scanned` column (migration 7, line 44) |
| 534 | Safe Harbor `'manage'` permission preset (migration 19, lines 463-469) |

**Pilot-completed (do NOT re-process):** lines 398, 413, 417, 446, 456.

## Ambiguous entries — ADVISORY ONLY, do NOT process twice

**The entries listed below are ALREADY in this partition's to-be-processed table above.** This section documents categorization reasoning for the founder's cross-partition review — it explains why ambiguous entries were kept in Schema rather than re-homed elsewhere. Do NOT process these entries twice. If you see a line number here that is NOT in the table above, it was never categorized to this partition — do not process it.

- **Line 197 (My Circle)** — could be UI (folder picker UI) or schema (enum value). Kept in schema because the enum is the gating primitive; UI doesn't exist yet.
- **Line 243 (Task unmark cascade)** — mixed. Cascade logic is RPC-shaped (schema) and hook-shaped (crosscutting). Kept in schema because the reversal would be a new RPC, not a hook-layer change.
- **Line 500 (Randomizer draw modes)** — could be UI (selector component exists). Kept in schema because `lists.draw_mode` column is the persisted switch; UI is a thin surface on top.

Each ambiguous entry appears in exactly ONE partition's to-be-processed table across the four partition files. If you find the same line number in another partition's to-be-processed table, STOP and report the conflict under a `## CROSS-PARTITION CONFLICT` heading in your evidence file before processing.

## Out of scope for this partition

If the sub-agent encounters an entry where the primary identifier is a React component, Edge Function, or hook rather than a DB object, that entry belongs in a different partition. Do NOT attempt to process it — record the partition mismatch in the evidence file with the entry's line number and the sub-agent's recommended destination partition. Move on.
