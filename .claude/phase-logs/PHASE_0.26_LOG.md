<!-- Phase logs live under .claude/phase-logs/, one file per phase.
     Format established with PHASE_0.26_LOG.md. Future phases follow the same
     structure: Overview, per-session entries with sha trail + delivered +
     surprises + carry-forward, Convention Candidates if any, Remaining
     Sessions, Phase Status. When a phase closes, its log becomes a read-only
     historical record. -->

# Phase 0.26 Session Log

> **Purpose:** One-glance tracking of Phase 0.26 sessions. Each session records sha trail, scope, key decisions, surprises, and carry-forward items. Maintained session-by-session. Lives at repo root for Claude.ai project-knowledge visibility.
>
> **Conventions used here:** no emoji; audit-style format; dated commits via SHA trail; carry-forward items use checkboxes for unresolved, plain text for resolved.
>
> **Current status:** Phase 0.26 is 6 of 8 sessions complete. S6, S5, S4 remain.

---

## Overview

Phase 0.26 executes the cleanup and infrastructure work surfaced by the Phase 0.25 Reconnaissance. It closes documentation drift, enforces conventions via CI, fixes the active cross-member privacy leak, and reconciles build status records. All 13 founder decisions resolved 2026-04-17 (`RECON_DECISIONS_RESOLVED.md`).

**Session breakdown (originally planned 6, expanded to 8 during S1 execution):**

| Session | Status | Scope |
|---|---|---|
| S1a | Complete | Doc architecture migration (folder-based current-builds, schema regen, conventions) |
| S1b | Complete | STUB_REGISTRY residue backfill |
| S1.5 | Complete | Auto-loaded doc path updates (mid-S1 discovery session) |
| S2 | Complete | CI enforcement infrastructure (GitHub Actions, Husky) |
| S3 | Complete | Privacy filter fix (Convention #76 defense-in-depth) |
| S7 | Complete | Skill/agent stale path migration |
| S6 | Pending | BUILD_STATUS reconciliation |
| S5 | Pending | 17-followups doc batch + Convention candidates bookmark |
| S4 | Pending | Wizard multi-user Playwright test (Testworth seeding) |

Sessions can run in any dependency-respecting order; founder decides sequence. S1 → all others established; S6 depends on nothing; S4 depends on Testworth test data.

---

## Session S1a — Doc Architecture Migration

**Date:** 2026-04-17
**Commit:** `37ef2ac`
**Scope:** 23 files, ±5500 lines

**Delivered:**
- Migrated `CURRENT_BUILD.md` (single shared file) to `.claude/rules/current-builds/` folder pattern for concurrent-build support. Native Claude Code recursive auto-load.
- Archived planning-era `database_schema.md` to `.claude/archive/database_schema_SUPERSEDED.md`. Regenerated `claude/live_schema.md` fresh from production.
- Added Convention #243 (Safe Harbor aggregation-exclusion guardrail) and Convention #244 (live_schema.md regen-from-production pattern) to CLAUDE.md.
- Rewrote Convention #14 text in CLAUDE.md to reflect folder-based pattern.
- STUB_REGISTRY legend clarification (Decision 3).
- Context budget reclaim: ~200K per session (removed auto-loaded archived file).

**Surprises:**
- Original Phase 0.26 scoped as 6 sessions; discovery during S1 that skill/agent path migration was larger than the original S5 doc-cleanup batch could absorb, so split to S7 (new) and left S5 for 17-followups batch.
- Convention #242 (mgrep usage) already existed — recon report had missed it. New Safe Harbor guardrail became #243, not #242.

**Carry-forward:**
- S1.5 created on the fly to handle auto-loaded doc path updates (Convention #11 in-place sentence removal + #244 addition).

---

## Session S1b — STUB_REGISTRY Residue Backfill

**Date:** 2026-04-17
**Commit:** `29a03b9`

**Delivered:** 5 dated backfill entries in STUB_REGISTRY dated subsection:
- `lila_messages.safety_scanned` + `lila_conversations.safety_scanned` columns → PRD-30 target
- Safe Harbor placeholder UI + ViewAs exclusions + `feature_expansion_registry` → PRD-20 target
- `permission_presets.safe_harbor='manage'` → PRD-20 target
- `_requestingMemberId` parameter entry (S3 target — resolved during S3)

**No surprises.** Small clean session.

---

## Session S1.5 — Auto-Loaded Doc Path Updates

**Date:** 2026-04-17
**Commit:** `17ae54a`

**Delivered:**
- Rewrote paths in `PRE_BUILD_PROCESS.md` to match new architecture.
- 3 surgical CLAUDE.md edits including Convention #11 in-place sentence removal.
- Added Convention #244 (live_schema.md regen pattern) to CLAUDE.md Non-Negotiable section.

**Why this became its own session:** S1a's architecture migration landed the new folder pattern, but auto-loaded docs in other files still referenced the old paths. Mid-S1 discovery. Rather than compress into S1a, gave it own session so each session had one clear scope.

**Carry-forward:**
- 5 additional active-doc stale-path references missed by S1a/S1.5 — surfaced by S7 reconnaissance (see S7 carry-forward).

---

## Session S2 — CI Enforcement Infrastructure

**Date:** 2026-04-17
**SHA trail:** `e89a0bb` → `84de0a1` → `e885eaa` → `863c4c7` → `fbd28ca`
**Plus bot auto-commit:** `71b351c` (Convention #14 workflow proving itself live)

**Delivered:**
- `.github/workflows/ci.yml` — baseline proof-of-life (npm ci + tsc --version)
- `.github/workflows/enforce-convention-14.yml` — auto-enforces doc updates on code/migration changes; opens `doc-drift` issues; auto-commits BUILD_STATUS timestamp bumps for phase-completion commits
- `.github/workflows/check-convention-76.yml` — grep-based CI check for `archive_context_items` queries without nearby `is_privacy_filtered` filter; PR annotations + single-comment-per-PR lifecycle
- Husky v9 replaces legacy `.git/hooks/pre-commit` with file-type-aware check (`tsc -b` for .ts/.tsx, non-blocking `[warning]` reminder for `supabase/migrations/` changes)
- Codegraph orphan-lock probe added to `/prebuild` Step 0
- SKILL.md AURI row updated to disabled state (per Finding 3.3)
- `.gitattributes` with `text eol=lf` rules for `.husky/*` and `*.sh`

**Key quality catches:**
- Convention #14 workflow fired live on `84de0a1`, bot auto-committed `71b351c` bumping BUILD_STATUS timestamp, loop-guard correctly skipped processing its own commit. First proven auto-enforcement write in repo history.
- `startsWith` over `contains` for loop-prevention message check (strictly safer).
- `github.event.before..HEAD` diff range over `HEAD^ HEAD` (handles multi-commit pushes).
- Untrusted commit metadata via `env:` vars, never inline `${{ }}` interpolation (security).
- Self-caught heredoc-vs-printf bug during Task 3 build (YAML indentation would have leaked into rendered markdown).
- Windows CRLF risk on shell scripts caught during Task 4.

**Surprises:**
- `ci.yml` failed on all S2 commits after push — not due to S2's work, but due to pre-existing lockfile drift (`package.json` declared a dep chain requiring `@floating-ui/dom@1.7.6`, `package-lock.json` lacked the entry). Linux npm enforced; Windows local npm had been silently masking the drift. Resolved by merging Dependabot PR #2 which had a fresh lockfile → merge commit `9720892`. First real `ci.yml` green landed on `9720892`.

**Carry-forward (Convention candidates to fold into S5):**
1. Heredoc-vs-printf in YAML shell steps
2. `.gitattributes` `text eol=lf` for shell scripts
3. Untrusted commit metadata via `env:` vars, not inline `${{ }}`
4. `./node_modules/.bin/tsc --version` session-start hygiene check

---

## Session S3 — Privacy Filter Defense-in-Depth

**Date:** 2026-04-18
**SHA trail:** `6760ad1` → `7fe5ffa` → `7cd034e` → `a11a456` → `75f0161` → `c2e04e3`

**Delivered:**
- New shared module `supabase/functions/_shared/privacy-filter.ts` with `isPrimaryParent()` (async DB helper) and `applyPrivacyFilter()` (generic query-builder wrapper) exports
- `context-assembler.ts:613` — replaced unconditional filter (which wrongly excluded mom from her own context) with role-asymmetric helper call
- `relationship-context.ts` — wired `_requestingMemberId` at 3 sites (line 261 parameter rename, lines 281-287 missing filter, lines 396-404 missing filter); signature changes on `loadPersonContext` and `loadPersonArchiveItems`; sync roster check pattern (zero DB roundtrips vs. helper's 2N)
- `bookshelf-study-guide/index.ts:79` — missing filter added via helper pattern (no roster in scope)
- Migration `00000000100149_archive_context_items_privacy_rls.sql` — RESTRICTIVE SELECT policy on `archive_context_items`; reuses `is_primary_parent_of()` SECURITY DEFINER helper from migration 100100; applied to production
- RLS-VERIFICATION.md — three test cases documented (mom, dad, non-primary member); verification deferred — production had zero `is_privacy_filtered=true` rows, Mom's Observations feature unused
- STUB_REGISTRY entry for `_requestingMemberId` marked Wired

**Key quality catches:**
- **RESTRICTIVE not PERMISSIVE** on the RLS policy — PERMISSIVE would have been a silent no-op because existing PERMISSIVE `aci_select_own_family` already grants every family member SELECT on every row. Near-catastrophic pre-deploy catch.
- **Bug at line 613 was over-filtering, not missing filter** — original code had `.eq('is_privacy_filtered', false)` unconditionally, which excluded mom from seeing her own privacy-filtered items. Recon report implied missing filter; actual direction was opposite.
- Pre-push audit of 38 `archive_context_items` references classified: 4 fixed-in-S3 + 11 writes (out of scope) + 1 pre-fixed read + 12 Class D reads (will be tightened by RLS) + 10 non-query. No legitimate leaks requiring push deferral.

**Surprises:**
- Local `node_modules` was half-broken (empty TypeScript package `lib/`, no `tsc` shim). Resolved with controlled `npm ci` after killing stray Vite processes. Classic "April 2026 npm corruption" class symptom recurring.
- Production database had zero `is_privacy_filtered=true` rows (Mom's Observations unused). Behavioral verification deferred; correctness asserted by inspection.

**Carry-forward (Convention candidates to fold into S5):**
5. Primary-parent check: sync roster when available, helper otherwise
6. 12 Class D sites backlog for explicit `applyPrivacyFilter` wrapping (currently RLS-protected; future migration to app-layer for intention clarity)

**Carry-forward (other):**
- [ ] Testworth family seeding with `is_privacy_filtered=true` archive items for behavioral RLS verification. Fits S4 (wizard Playwright) or standalone seed-data session.

---

## Session S7 — Skill/Agent Stale Path Migration

**Date:** 2026-04-18
**SHA trail:** `1f266be` → `1ef9810`

**Delivered:**
- Reconnaissance: 12 stale-path references found across 5 files (3 skills had hits in 1 file; 5 agents had hits in 4 files)
- 11 path migration edits across 5 files:
  - `.claude/skills/prebuild/SKILL.md` — 3 Replace, 1 Remove (Step 3 dual-read collapsed to live_schema.md only), 1 Step 5 expansion documenting the `paths:` frontmatter omission requirement
  - `.claude/agents/post-build-verifier.md` — 2 Replace
  - `.claude/agents/rls-verifier.md` — 1 Replace with refined wording making schema-vs-behavior split-of-responsibilities explicit (PRD for RLS behavior, live_schema for structure)
  - `.claude/agents/migration-writer.md` — 4 Remove (prescription + rebuttal pair on lines 23/26, post-migration step on 136, analogous rebuttal on 144)
  - `.claude/agents/pre-build-auditor.md` — 1 Remove (consolidated to live_schema.md only)
- Verification commit: zero hits on stale patterns in active skills/agents

**Key quality catches:**
- Edit 1.4 (SKILL.md Step 5) added a critical technical warning about NOT using `paths:` YAML frontmatter in `.claude/rules/current-builds/` files — prevents future maintainer from inadvertently breaking the folder auto-load. Documentation fidelity, not scope creep.
- Conservative three-word trims on migration-writer.md lines 26 and 144 preserved positive assertions ("the PRD is authoritative for schema design") while removing orphan rebuttals to the archived doc — flagged explicitly during reconnaissance.

**Surprises:**
- **mgrep subcommand syntax gotcha discovered mid-session:** bare `mgrep "pattern"` routes to the `index` default mode silently returning no results; correct invocation is `mgrep search "pattern"`. Not auth failure, not drift — purely CLI ergonomics. Task 3 used Grep fallback per Convention #242 exception during the diagnosis gap, which saved the session (without fallback, verification would have reported false-clean).
- **Out-of-S7-scope drift surfaced:** 5 active docs (`MYAIM_GAMEPLAN_v2.2.md`, `claude/LESSONS_LEARNED.md`, `CONVERSATION_CONTEXT.md`, `tests/e2e/features/play-dashboard-sub-phase-b.spec.ts`, `workflows/audit-prompt.md`) still contain stale path references that S1a/S1.5 missed. Correctly flagged, not fixed in S7. Folds into S5 scope.

**Carry-forward (Convention candidate to fold into S5):**
7. mgrep `search` subcommand required — bare `mgrep "pattern"` silently no-ops via default `index` mode

**Carry-forward (other):**
- [ ] 5 active docs with stale path references S1a/S1.5 missed — fold into S5's doc-cleanup scope

---

## Convention Candidates — Accumulated (fold into S5)

These are discoveries from S2/S3/S7 that warrant formal Convention entries in CLAUDE.md, plus (where applicable) CI checks or tooling-hygiene documentation. All bookmarked for S5.

1. **Heredoc-vs-printf in YAML shell steps** — use `printf '...' "$VAR"` over heredocs in GitHub Actions shell scripts to avoid YAML-indent leak into rendered output.
2. **`.gitattributes` `text eol=lf` for shell scripts and Husky hooks** — never rely on local `core.autocrlf` for line-ending normalization on executable scripts.
3. **Untrusted commit metadata in GitHub Actions shell steps must pass via `env:` vars, never inline `${{ }}` interpolation** — commit messages are attacker-controlled.
4. **Session-start hygiene check `./node_modules/.bin/tsc --version`** — catches empty-typescript-package state that allows commits to pass locally but fail CI.
5. **Primary-parent check: sync roster lookup when `family_members` array is in scope; fall back to `isPrimaryParent()` helper for isolated sites without roster access** — both converge on `family_members.role = 'primary_parent'` ground truth; pick cheapest that doesn't lose correctness.
6. **12 Class D frontend sites for explicit `applyPrivacyFilter` wrapping** — list archived in S3 Task 4 pre-push audit. Currently RLS-protected; migration to app-layer is an intention-clarity improvement, not a correctness fix.
7. **mgrep invocation must include `search` subcommand** — bare `mgrep "pattern"` silently routes to default `index` mode returning empty output.

**Framing note for S5 drafters:** All 7 candidates share a pattern — tools or techniques that "look fine" but silently produce wrong or empty output. Consider folding into an expansion of Convention #241 (Tooling Hygiene) as a "Silent Tooling Failure Patterns" subsection rather than 7 independent conventions. Single lookup surface, easier to maintain, captures the common diagnostic signature.

---

## Remaining Sessions

### S6 — BUILD_STATUS Reconciliation

**Scope (per recon Finding 1.2):** Update `BUILD_STATUS.md` to reflect 4 phases that completed but weren't recorded there:
- Phase 17 (Meetings) — signed off as Build P
- Phase 29 (Gamification) — signed off as Build M
- Phase 19 (Rhythms C+D) — complete
- Phase 28 (BookShelf Phase 1b) — complete

Phase 32 (PRD-28) was flagged in recon but is already aligned; drop from the list.

**Dependencies:** None. Lightweight doc reconciliation session.

**Pre-flight for S6:** mgrep subcommand ergonomics now known (use `mgrep search "pattern"`, not bare `mgrep`); no auth issue exists. Session can proceed at founder's leisure.

### S5 — 17-Followups Doc Batch + Convention Candidates

**Scope:**
- **17-followups Phase 0.26 batch:** F3 (mgrep watch startup in PRE_BUILD_PROCESS.md), F4 (1000-file mgrep default limit), F11 (`.mgrepignore` for tmp files), F14 (founder files upstream Mixedbread-Grep issue), F15 (repo token-size measurement), F17 (Pre-Build-Setup-Checklist methodology)
- **Convention candidates:** 7 bookmarked entries above
- **S7 carry-forward:** 5 active docs with stale path references S1a/S1.5 missed
- Recon Finding 3.6 — specs/Pre-Build-Setup-Checklist.md update for multi-location MCP sweep

**Dependencies:** None. Can run anytime.

### S4 — Wizard Multi-User Playwright Test

**Scope (per recon Decision 13):** End-to-end Playwright test using seeded Testworth family. Tier 1 structure with Tier 2 properties. UI-only actions (no backend shortcuts). Screenshot capture at every assertion. Multi-user flows with per-role browser contexts.

**Dependencies:** Testworth family seeding with `is_privacy_filtered=true` archive items (per S3 carry-forward). Could be included as session sub-task or handled separately first.

---

## Phase 0.26 Status

**Complete (6 of 8):** S1a, S1b, S1.5, S2, S3, S7
**Remaining (3):** S6, S5, S4
**Target completion:** None set; founder-paced.

**Production changes live from Phase 0.26:**
- Defense-in-depth for `is_privacy_filtered` at application and database layers
- RLS policy `archive_context_items_privacy_filter_role_asymmetric` enforcing role-asymmetric visibility
- GitHub Actions enforcing Convention #14 (doc updates) and Convention #76 (privacy filter checks)
- Husky v9 file-type-aware pre-commit hook
- Documentation architecture on folder-based current-builds pattern

**Not yet deployed:**
- S6/S5/S4 outputs (pending)
