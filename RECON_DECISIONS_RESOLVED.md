# Reconnaissance Report v1 — Founder Decisions Resolved

> **Companion to:** `RECONNAISSANCE_REPORT_v1.md` (commit 914671a)
> **Resolved:** 2026-04-17
> **Status:** All 13 decisions answered. Phase 0.26 scope locked.

---

## How to Read This Document

The reconnaissance report surfaced 13 decisions requiring founder input. This file documents the resolutions. Each decision includes:
- The original question
- The resolution
- Brief rationale (where non-obvious)
- Action implications for Phase 0.26

Resolutions supersede any earlier assumption. When Phase 0.26 builds begin, read this file alongside the recon report.

---

## Decision 1 — CURRENT_BUILD.md interpretation + architecture

**Original question:** Literal "clear all sections" vs. "clear only active-build" interpretation of Convention #14.

**Resolution:** Neither. Replace `CURRENT_BUILD.md` with a folder-based architecture that accommodates concurrent build sessions.

**New structure:**
- `.claude/current-builds/` — folder tracked in git, contains one `.md` file per active build (e.g., `PRD-28-tracking.md`, `PRD-30-safety.md`). Auto-loaded via `@`-reference in CLAUDE.md.
- `.claude/completed-builds/YYYY-MM/` — folder tracked in git (NOT gitignored), contains signed-off build docs organized by year-month. NOT auto-loaded. Durable, searchable via mgrep, available to Claude Code on demand.

**Rationale:** Single `CURRENT_BUILD.md` cannot support concurrent session workflow (multiple builds active at once). Folder-per-build eliminates collisions, makes active state obvious at a glance, and survives machine failures via git. Completed builds tracked in git (not gitignored) because durability, cross-machine access, and web Claude.ai project knowledge visibility all depend on repo tracking.

**Phase 0.26 actions:**
- Create `.claude/current-builds/` folder structure
- Migrate any relevant content from current `CURRENT_BUILD.md`
- Create `.claude/completed-builds/2026-04/` with migrated completed-build sections
- Update CLAUDE.md `@`-references (remove old `CURRENT_BUILD.md`, add new folder pattern)
- Delete old `CURRENT_BUILD.md`
- Update Convention #14 text in CLAUDE.md to reflect folder-based pattern

---

## Decision 2 — Convention #14 enforcement mechanism

**Original question:** Pre-commit / GitHub Action / ceremony checklist.

**Resolution:** GitHub Action, with auto-commit of doc updates as follow-up commits.

**Rationale:** Pre-commit hooks run locally, can be bypassed with `--no-verify`, and already broke once due to the npm/nvm4w issue. GitHub Actions run remotely, cannot be bypassed, add zero local friction. Auto-commit pattern means founder never has to manually update timestamps or sync docs — the Action does the work.

**Phase 0.26 actions:**
- Design GitHub Action that triggers on push to main
- Action checks: if `src/` or `supabase/migrations/` changed, did a file in `.claude/current-builds/` update? If a stub was added, did `STUB_REGISTRY.md` update? Did `BUILD_STATUS.md` timestamp advance?
- Action behavior: auto-commit doc fixes as follow-up commit (e.g., `docs: auto-update BUILD_STATUS timestamp after <commit-sha>`). Does NOT fail the push — corrects it.
- For true doc drift (e.g., stub added without registry update), Action commits a TODO marker and opens a tracking issue

---

## Decision 3 — STUB_REGISTRY stub-type taxonomy labels

**Original question:** Formalize taxonomy to distinguish "committed deferred" from "speculative."

**Resolution:** Do NOT invent new labels. The existing labels (`⏳ Unwired (MVP)` and `📌 Post-MVP`) already make this distinction — they're just underused and not obvious at a glance.

**Rationale:** STUB_REGISTRY already distinguishes MVP-committed stubs from Post-MVP speculative items. The stub-count drift (10 vs. 12 vs. 14 for Build M) was a counting inconsistency, not a taxonomy gap. Different aggregations pulled different subsets.

**Phase 0.26 actions:**
- Update STUB_REGISTRY legend to clarify what each status means in plain language
- Define what "Build X stub count" means going forward: specifically "Unwired (MVP) stubs introduced or touched in Build X." Post-MVP items counted separately.
- No schema change. No label change. Just documentation clarification.

---

## Decision 4 — BUILD_STATUS "Last updated" label

**Original question:** Auto-generated or manual timestamp.

**Resolution:** Rolls into Decision 2. GitHub Action auto-commits the timestamp update.

**No separate action needed.**

---

## Decision 5 — live_schema.md / database_schema.md collapse

**Original question:** Keep separate or merge.

**Resolution:** Archive the old planning-era `database_schema.md`. Regenerate `live_schema.md` fresh from current Supabase state. Keep only `live_schema.md` going forward.

**Rationale:** `database_schema.md` is the old planning summary that was shown to be unreliable. `live_schema.md` is (or should be) a snapshot of current reality. Past conversation confirmed both are likely inaccurate at this point. Regenerate one authoritative source.

**Phase 0.26 actions:**
- Move `claude/database_schema.md` to `.claude/archive/database_schema_SUPERSEDED.md` with a note explaining it's historical reference only
- Run a Supabase schema dump script, regenerate `claude/live_schema.md` from actual production database state
- Update CLAUDE.md `@`-reference: remove `@claude/database_schema.md`, keep `@claude/live_schema.md`
- Context budget reclaim: ~200K per session (removes 198K auto-loaded file)

---

## Decision 6 — `is_privacy_filtered` rule

**Original question:** Role-asymmetric vs. author-aware.

**Resolution:** Role-asymmetric (mom-only).

**Rationale:** PRD-13 repeatedly and explicitly specifies role-asymmetric: "Privacy Filtered is always mom-only — no other role should see sensitive context management." UI copy, RLS notes, and visibility tables all describe a mom-centric model. The "author-aware" framing that came up in web Claude discussion was an intuitive design instinct but not the documented product decision. Implementing the documented rule is simpler: exclude unless requester is primary_parent.

**Phase 0.26 actions:**
- Rewrite `supabase/functions/_shared/context-assembler.ts:613` to apply role-asymmetric filter (`is_primary_parent = true` check on requester)
- Wire `_requestingMemberId` parameter in `relationship-context.ts` (drop the underscore, actually consume the value)
- Apply same role-asymmetric pattern at:
  - `relationship-context.ts:281` (negative preferences)
  - `relationship-context.ts:397` (folder-scoped items)
  - `bookshelf-study-guide/index.ts:79`
- Add grep-based CI check for convention #76 compliance on `archive_context_items` queries

---

## Decision 7 — RLS defense-in-depth for `is_privacy_filtered`

**Original question:** Yes/no on database-level RLS policy in addition to Edge Function filtering.

**Resolution:** Yes.

**Rationale:** One-time policy write, permanent protection against accidental leaks in any future code. Even if a future query forgets the Edge Function filter, the database enforces the boundary. Defense-in-depth for a cross-member privacy surface is warranted.

**Phase 0.26 actions:**
- Write RLS policy on `archive_context_items` that auto-excludes `is_privacy_filtered = true` rows when the requester is not the primary parent
- Add RLS verification test to `RLS-VERIFICATION.md` covering this policy
- Test with real queries as each role before declaring complete

---

## Decision 8 — `is_privacy_filtered` fix timing

**Original question:** Phase 0.26 or hold for PRD-30 build.

**Resolution:** Phase 0.26.

**Rationale:** Site 3 (`relationship-context.ts:397`) is an active cross-member leak the moment a teen uses Higgins or Mediator. Holding for PRD-30 couples two unrelated changes, leaves the leak open indefinitely, and slows PRD-30 when it eventually builds. Fix is conceptually standalone.

**No separate action needed beyond Decision 6 and Decision 7 actions.**

---

## Decision 9 — LiLa runtime ethics PRD strategy

**Original question:** Extend PRD-21 vs. create PRD-41.

**Resolution:** Create PRD-41 LiLa Runtime Ethics Enforcement.

**Rationale:** Documentation consistently treats ethics enforcement as platform-wide cross-cutting infrastructure, not tool-specific behavior. Beta Readiness Gate language describes "every AI output surface." Platform Intelligence Pipeline has its own three-layer ethics filter for book training, separately from any tool PRD. The `lila-board-of-directors` content policy check is already at Edge Function level as a platform concern. Burying runtime ethics inside PRD-21 (Communication & Relationship Tools) would miss the majority of LiLa entry points.

**PRD-41 scope (to be written):**
- Pre-flight content filter on all user input to LiLa (scans for force/coercion/manipulation/shame/withholding patterns)
- Post-generation content scan on all LiLa output (same five categories)
- Rejection logging to auditable `lila_ethics_rejections` table
- Red-team test suite run before every deploy
- Graceful refusal language (validate underlying need, redirect to healthier approach, never lecture)
- Retrofit wiring for all existing LiLa Edge Functions

**Phase 0.26 actions:**
- None directly — PRD-41 authoring is a separate session, not Phase 0.26 fix work
- Phase 0.26 flags PRD-41 as beta blocker in BUILD_STATUS and on the roadmap

---

## Decision 10 — Safe Harbor aggregation-exclusion guardrail timing

**Original question:** Phase 0.26 or first aggregation PRD.

**Resolution:** Convention text lands in Phase 0.26. Grep-based CI check and RLS/view guard implementation lands with first aggregation PRD build (PRD-19, PRD-28B, or PRD-30 — whichever ships first).

**Rationale:** Convention costs almost nothing to document now. Implementation only matters when aggregation scanners exist, which they don't yet. Writing the convention now ensures aggregation builds inherit the constraint from day one.

**Phase 0.26 actions:**
- Add convention to CLAUDE.md: "All queries against `lila_conversations` used for aggregation, reporting, or context assembly MUST filter `is_safe_harbor = false` unless explicitly scoped to Safe Harbor history view."
- No CI check yet. No RLS policy yet. Those land with first aggregation build.

---

## Decision 11 — Codegraph Phase 0.26 mitigation + upstream issue

**Original question:** Confirm the three-part handling (symptomatic fix recipe, Step 0 probe enhancement, upstream issue filing).

**Resolution:** Confirm all three.

**Phase 0.26 actions:**
- Document symptomatic fix recipe: `rm -rf .codegraph/codegraph.db.lock` (empty directory only, preserves index). Add to relevant troubleshooting doc.
- Enhance `/prebuild` Step 0 hard-gate to probe for orphaned codegraph lock directory and flag with one-command cleanup
- File upstream GitHub issue with codegraph project: (a) PID-containing lockfile for stale-detection, (b) signal handler for graceful cleanup on SIGTERM/SIGKILL. Founder files from personal GitHub account.

---

## Decision 12 — npm/nvm4w fix session timing

**Original question:** When to schedule the fix session.

**Resolution:** RESOLVED 2026-04-17. Fix completed in dedicated session. Root cause was stray `npm install` with wrong cwd wiping bundled npm. Fixed via surgical copy of npm 10.8.2 from v20.19.3. Pre-commit hook now runs cleanly, --no-verify no longer needed.

**Tracked in:** RECONNAISSANCE_REPORT_v1.md Finding 3.4 (marked RESOLVED), CONVERSATION_CONTEXT.md (gap removed), LESSONS_LEARNED.md (wrong-cwd corruption pattern captured).

**Three residual followups (not addressed):**
1. Three duplicate `C:\Program Files\nodejs` entries in PATH (cosmetic, tech debt register)
2. Stray `@anthropic-ai/claude-code` in v20.10.0 node_modules (harmless, tech debt register)
3. Root-cause prevention for future Claude Code updates (captured in LESSONS_LEARNED.md)

---

## Decision 13 — Wizard multi-user test timing

**Original question:** Before Phase 0.5 close-out.

**Resolution:** Playwright test first, manual ceremony with husband/kids optional after Playwright passes.

**Rationale:** Playwright can drive multi-user flows using the seeded Testworth family accounts, catching data/RLS/rendering bugs before wasting human time. Tests must be UI-only (no backend shortcuts) to prove the feature actually works end-to-end. Screenshot capture at every assertion provides visual proof. Manual ceremony becomes UX feel confirmation, not bug hunting.

**Phase 0.26 actions:**
- Write Playwright multi-user test using Testworth family contexts (mom, dad, teen, guided as relevant)
- UI-only actions — all interactions via `getByRole()` and actual clicks, no direct Supabase client inserts
- Screenshot captured at every `test.step()` boundary with descriptive captions
- Test structure uses `test.step()` blocks with caption-quality names (preparing for future Tier 2 tutorial wrapper — see "Template for Future Tests" section below)
- Assertions cover: mom creates shared list, dad sees it, bidirectional item adds, teen does NOT see non-shared list, RLS enforces at database level

---

## Template for Future Tests — Tier 1 / Tier 2 Pattern

Current Playwright tests should be written as Tier 1 regression tests but with structural properties that enable future Tier 2 tutorial generation without rewrite.

**Tier 1 — Regression suite (what we're building now):**
- Fast, headless, runs on every deploy
- Assertion-heavy, catches bugs
- Screenshots on failure only
- Testworth family fixtures
- Failure blocks merge

**Tier 2 — Tutorial generation (deferred, but structurally enabled):**
- Video recording + pacing + narration
- Annotated screenshots for written tutorials
- Polished output for AI Vault / Help system
- Output: written tutorial with screenshots PLUS polished video

**Properties to bake into Tier 1 tests now (so Tier 2 wrap is trivial):**
- `test.step('Mom opens the wizard', ...)` — step names are caption-quality
- Role-based selectors: `page.getByRole('button', { name: 'Share with family' })`
- Clean phase separation (setup / action / assertion, not interleaved)
- Externalized fixtures (Testworth accounts, test data in fixtures file, not magic strings)
- Consistent authentication pattern across tests

**Phase 0.26 Playwright test for wizard must follow this template. All future tests follow the same pattern.**

---

## Additional Phase 0.26 Items (from recon report fix queue)

Beyond the 13 decisions, the recon report identified these Phase 0.26 items:

### Drift fixes
- Finding 1.1 — Migrate to folder-based current-builds architecture (covered by Decision 1)
- Finding 1.2 — Update BUILD_STATUS.md to reflect 5 missing completions
- Finding 1.3 — Clarify STUB_REGISTRY legend (covered by Decision 3)
- Finding 1.5 — Implement GitHub Action enforcement (covered by Decision 2)
- Finding 2.5 — Privacy filter fix (covered by Decisions 6, 7, 8)
- Finding 3.5 — Replace pre-commit hook: file-type-aware check + use project-local `node_modules/.bin/tsc` instead of global `npx`

### Tool health
- Finding 3.1 — Codegraph orphaned lock handling (covered by Decision 11)
- Finding 3.3 — Update SKILL.md AURI row to reflect disabled state
- Finding 3.6 — Update `specs/Pre-Build-Setup-Checklist.md` for multi-location MCP sweep methodology

### 17-followups Phase 0.26 batch
- F3 — Document `mgrep watch --max-file-count 3000` in PRE_BUILD_PROCESS.md
- F4 — RESOLVED (Decision 12)
- F11 — Add `.mgrepignore` for tmp files + visual_schedule migrations
- F14 — Founder files Mixedbread-Grep upstream issue for 4 Windows bugs
- F15 — Add repo token-size measurement to CLAUDE.md or new REPO_STATS.md
- F17 — Update Pre-Build-Setup-Checklist.md for multi-location MCP sweep

### Residue cleanup (backfill into STUB_REGISTRY)
- `lila_messages.safety_scanned` + `lila_conversations.safety_scanned` columns → STUB_REGISTRY with target phase PRD-30
- Safe Harbor placeholder UI, ViewAs exclusions, feature_expansion_registry entries → STUB_REGISTRY with target phase PRD-20 frontend
- `permission_presets.safe_harbor='manage'` → STUB_REGISTRY as expected no-op until PRD-20
- `_requestingMemberId` parameter → STUB_REGISTRY as deferred-author-aware-logic (now being wired per Decision 6)

### Expected gaps (no immediate action, confirm scheduling)
- PRD-30 Safety Monitoring build (confirm gameplan scheduling)
- PRD-20 Safe Harbor frontend + gating tables build (confirm gameplan scheduling)
- PRD-40 COPPA (in flight in parallel session Phase 0.35)
- PRD-41 LiLa Runtime Ethics Enforcement (new, per Decision 9)
- Safe Harbor aggregation-exclusion convention (Decision 10 — convention text only)
- RLS-VERIFICATION.md expansion (bundle after PRD-30/PRD-40 tables land)
- COPPA export/deletion flow verification (bundle with PRD-40)

### Wizard fixes (Phase 0.26 or dedicated wizard pass)
- Gap A — Universal List Wizard Step 2 items>0 hard-gate removal
- Gap B — Default sharing mode rethink (possibly remember-last-used or spouse-auto-preselect)
- Gap C — Multi-user Playwright test (covered by Decision 13)
- Gap D — Discovery pointer to /lists post-deploy

---

## Phase 0.26 Session Planning

Phase 0.26 is too large for a single session. Suggested session breakdown:

**Session 1 — Doc architecture + schema cleanup**
- Current-builds folder migration (Decision 1)
- Database_schema.md archive + live_schema.md regeneration (Decision 5)
- STUB_REGISTRY legend clarification (Decision 3)
- Safe Harbor aggregation convention text (Decision 10)
- Residue backfill into STUB_REGISTRY

**Session 2 — Enforcement infrastructure**
- GitHub Action design + implementation (Decision 2)
- Pre-commit hook replacement (Finding 3.5)
- Codegraph Step 0 probe enhancement (Decision 11)
- SKILL.md AURI row update (Finding 3.3)

**Session 3 — Privacy filter fix**
- context-assembler.ts:613 role-asymmetric rewrite (Decision 6)
- relationship-context.ts wiring at 3 sites (Decision 6)
- bookshelf-study-guide wiring (Decision 6)
- RLS defense-in-depth policy (Decision 7)
- grep-based CI check for convention #76
- RLS verification tests

**Session 4 — Wizard multi-user Playwright test**
- Test using Testworth family (Decision 13)
- Tier 1 structure with Tier 2 properties baked in
- Screenshot capture, UI-only actions
- Gaps A, B, D addressed as findings surface

**Session 5 — 17-followups doc cleanup batch**
- F3, F11, F15, F17 (doc updates)
- F14 upstream issue template prepared for founder

**Session 6 — BUILD_STATUS reconciliation**
- Update Phase 17 (Meetings), Phase 29 (Gamification), Phase 19 (Rhythms C+D), Phase 32 (PRD-28), Phase 28 (BookShelf) to reflect actual completion state (Finding 1.2)

Sessions can run in any order that respects dependencies (Session 1 before Session 6, Session 3 can be done any time, etc.). Founder decides order based on priority.

---

*End RECON_DECISIONS_RESOLVED.md. Phase 0.26 scope locked. Ready for build session planning.*
