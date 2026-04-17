# Reconnaissance Report v1

> **Phase 0.25 deliverable per `MYAIM_GAMEPLAN_v2.2.md` lines 152-190.**
> **Audit window:** 2026-04-16 evening session.
> **Scope:** All 5 reconnaissance scopes (doc reconciliation, compliance/safety gap analysis, tool-firing verification, 17 followups classification, wizard state check).
> **Nature:** Findings only. No fixes applied. Corrections sit in Phase 0.26 and later.
> **Inputs rolled up:** `.claude/recon/phase-abc-findings.md` (Phases A+B+C), `c:/tmp/phase_d_findings.md` (Phase D), `c:/tmp/phase_e_findings.md` (Phase E + is_privacy_filtered trace).

---

## Framing Preamble — Read Before Findings

**Most of what this report flags is catch-up work, not process failure.** A large portion of the codebase was rebuilt ~3 weeks ago after a full audit. Schema columns, placeholder routes, unused parameters, half-wired hooks — these are deliberate forward-looking stubs waiting for PRDs that haven't been written yet, not broken conventions that fired wrong. Framing every such artifact as "drift" would miscast the state of the codebase as alarmingly fragile when the actual situation is "post-rebuild, pre-completion, proceeding on plan."

**To keep severity proportional, every Scope 2 finding is categorized one of three ways:**

- **Residue** — Pre-convention artifacts from the audit-then-rebuild cycle. Orphaned columns, placeholder routes, unused parameters. **Catch-up items**, not process failures. Either backfill into `STUB_REGISTRY.md` as forward-looking hooks, or remove from schema once clearly abandoned. Low urgency.
- **Drift** — Code/convention divergence where the convention existed and code did not follow. **Real process failures** requiring enforcement. These are the findings that warrant alarm.
- **Expected gap** — PRDs scheduled but not yet reached (PRD-20 frontend, PRD-30 entire stack, PRD-40 not yet written, LiLa runtime ethics). **Beta Readiness Gate items**, not bugs. Expected absences that become required presences before beta.

Every finding below carries a `Category:` line with one of those three tags. A finding tagged `Expected gap` is NOT a process failure — it's a scheduled-but-not-yet-built item that the report surfaces so founder can confirm scheduling.

**Scopes 1, 3, 4, 5 use the same severity bands (high/medium/low) but do not need the same three-way categorization — they concern documents, tools, and a single committed feature rather than architectural intent vs. reality.**

---

## Executive Summary

Five scopes investigated. Findings distributed across three categories:

### Current-state drift — 5 findings (the alarm band)

These are where conventions existed and code or process didn't follow. Warrant enforcement work.

1. **CURRENT_BUILD.md convention #14 compliance ~15-20%.** 3 reset-to-IDLE commits in repo history against ~15-20 build completions. 2637 lines / 283K auto-loaded every session; 6 un-marked build sections read as "active work" to new sessions.
2. **BUILD_STATUS.md is authoritative but stale.** Header says 2026-04-06; 5 recent build completions missing (Meetings, Gamification, Rhythms C+D, BookShelf Phase 1+1b, PRD-28 Sub-phase B). Would mislead any new planning session.
3. **`is_privacy_filtered` implemented as unconditional strip, not author-aware.** Convention #76 says "NEVER in non-mom context regardless of toggle state" — a role-asymmetric rule. Current implementation at `context-assembler.ts:613` strips filtered items unconditionally for all requesters including mom's own tools. Code diverges from convention intent. Affects the 1 of 4 sites that DOES filter, not just the 3 that don't filter.
4. **Pre-commit hook actively broken.** `npx tsc --noEmit` crashes because npm/nvm4w PATH is broken. Misleading "TypeScript errors" message. Unknown window of silently-not-enforced tsc checks. Commit-convention compliance drift at the mechanism level.
5. **STUB_REGISTRY stub-count ambiguity.** Three different counts for same build (10/12/14). Root cause: taxonomy gap — "deferred we'll build" vs. "speculative we might build" not distinguished. Affects sign-off accounting.

### Residue from the audit-then-rebuild cycle — 4 findings (catch-up, not alarm)

These exist because schema/infra was built forward of PRDs that haven't been written yet. Expected. Needs cataloging + stub-registry backfill, not urgent fixes.

6. **`lila_messages.safety_scanned` + `lila_conversations.safety_scanned` columns exist but nothing writes to them.** Placed for PRD-30; PRD-30 not yet built. Dormant until the pipeline lands.
7. **`safe_harbor` feature_expansion_registry entry + ViewAsProvider `PRIVACY_EXCLUSIONS=['safe_harbor']` + useLila `is_safe_harbor` filtering.** All plumbing present for PRD-20 Safe Harbor. Frontend = placeholder. Forward-looking hooks.
8. **`permission_presets.safe_harbor = 'manage'` in Full Partner preset.** No-op today because Safe Harbor UI doesn't render. Scheduled activation when PRD-20 frontend lands.
9. **`_requestingMemberId` parameter accepted but unused in `relationship-context.ts`.** TypeScript underscore-prefix explicitly marks it as intentionally-unused. The plumbing for author-aware filtering was wired; the logic was deferred. This is EXPLICIT residue — someone placed the hook, never implemented the body.

### Expected gaps (scheduled but not reached) — 5 findings (Beta Readiness Gate items)

These are planned absences on the roadmap, flagged here so founder can confirm they're correctly scheduled and not forgotten.

10. **PRD-30 Safety Monitoring entire stack.** 7 tables, Layer 1 + Layer 2 pipeline, flag review UI, weekly digest — none exist. Scheduled per gameplan. Blocks Beta Readiness.
11. **PRD-20 Safe Harbor frontend.** All 7 screens unbuilt; route = `PlaceholderPage`. Scheduled. Blocks Beta Readiness.
12. **PRD-20 access-gating tables.** `safe_harbor_orientation_completions` / `safe_harbor_literacy_completions` / `safe_harbor_consent_records` have no migration. Scheduled with PRD-20 build. Blocks teen Safe Harbor access.
13. **PRD-40 COPPA infrastructure not yet written (Phase 0.35 scope).** `coppa_consents` + `parent_verifications` tables + first-under-13 trigger + payment linkage. PRD-40 authoring is currently running in a parallel session. Blocks Beta Readiness.
14. **LiLa runtime ethics enforcement at Edge Function level.** Currently prompt-only. Gameplan Beta Readiness exit criterion 523 requires platform-level auto-reject. No dedicated PRD exists for this work. Founder decision required: extend PRD-21 vs. create PRD-41. Blocks Beta Readiness.

### Tool health (Scope 3) — 3 high, 1 resolved, 1 documented

High severity:
- Codegraph MCP orphaned-lock regression (2nd regression today)
- npm/nvm4w PATH broken
- Pre-commit hook broken (downstream of npm)

Resolved: mgrep wizards directory green (F10).
Documented: MCP scope precedence — Claude Code CLI reads only `~/.claude.json`; `.vscode/mcp.json` is VS Code-scope.

### Wizard state (Scope 5) — 3 use-case gaps, NOT fixes

Committed 21a47a1. Structurally complete at single-user-deploy. **Not multi-user verified.** Gap C ("husband doesn't see the shared list on his side") is the canonical gameplan line 24 "`tests pass` ≠ `serves need`" example.

### 17 Followups (Scope 4) — all accounted

7 Phase 0.26 / 1 partial founder-action (F1 AURI reinstall) / 2 defer to Phase 2 / 4 tech debt / 1 intentional / 1 resolved / 1 closed / 2 new open.

### Structural observation worth bold text

**Tool state volatility on this machine exceeds the April 16 sweep's implicit model.** Two "verified green in morning, broken by evening" instances (npm, codegraph). The sweep's "verify once, then trust until next sweep" doesn't hold. Consider Step 0.5 mid-build re-probe and pre-sign-off re-run convention.

---

## Scope 1 — Doc Accuracy Reconciliation

### Finding 1.1 — CURRENT_BUILD.md convention drift

**Description:** Convention #14 Part B (verbatim): `CURRENT_BUILD.md — reset Status to IDLE, clear all sections`. Practice has diverged from convention at mechanism level.

**Evidence:**
- 283,389 bytes / 2637 lines / 13 full build sections below a "Status: IDLE" header
- `grep -n "^# Build "` returns 13 Build sections: 2 marked "SIGNED OFF", 5 marked "COMPLETED", **6 have no header marker at all** (O, N, L, K, C, E, G)
- Historical archive at bottom stops at PRD-14C / 2026-03-31
- Git log: only 3 "reset to IDLE" commits in repo history — f20f944 (2026-03-30), 2ed66c4 (today), 01de232 (today)
- Compliance rate: ~15-20% against ~15-20 build completions

**Severity:** High. Auto-loaded via `@CURRENT_BUILD.md` every session. Un-marked sections read as active work to new sessions. 283K consumes significant context budget.

**Category:** Drift.

**Proposed handling (Phase 0.26):**
- Clarify interpretation ambiguity: "clear all sections" literal vs. "clear only active-build, leave historical" practice
- One-time cleanup of 11 un-cleared sections OR migrate to append-only `completed-builds.md` archive
- Enforcement mechanism: pre-commit hook file-modification assertion, GitHub Action, or formalized sign-off ceremony checklist

**Founder decision required:** Interpretation choice (literal vs. practice) + enforcement mechanism preference.

---

### Finding 1.2 — BUILD_STATUS.md stale

**Description:** BUILD_STATUS.md header says "Last updated: 2026-04-06." Actual last commit 2026-04-13. Missing 5 completed builds.

**Evidence:**
- Header label: `> Last updated: 2026-04-06` (self-stale)
- File mtime: Apr 13 17:36
- Last git commit: `a161015 feat(PRD-28): homework tracking Sub-phase B` on 2026-04-13
- Missing completions (per CURRENT_BUILD sign-offs + git log):
  - Line 52: Phase 17 PRD-16 Meetings → "Pending" (actual: SIGNED OFF 2026-04-16)
  - Line 64: Phase 29 PRD-24/24A/24B Gamification → "Pending" (actual: SIGNED OFF 2026-04-16)
  - Line 54: Phase 19 Rhythms → "Phase C and Phase D pending" (actual: both complete 2026-04-07)
  - Line 67: Phase 32 PRD-28 → "Sub-phase B pending" (actual: complete 2026-04-13)
  - Line 63: Phase 28 PRD-23 BookShelf → "Pending" (actual: Phase 1 + Phase 1b-F complete)

**Severity:** High. New planning sessions reading BUILD_STATUS as primary source would propose re-building Meetings, Gamification, BookShelf, Rhythms C+D — work already signed off.

**Category:** Drift.

**Proposed handling (Phase 0.26):**
- Bring entries up to date
- Fix "Last updated" label to derive from git commit timestamp, not hand-written value
- Consider auto-generated footer via simple script, to prevent relabel-drift

**Founder decision required:** Whether to auto-generate the "Last updated" line or keep manual.

---

### Finding 1.3 — STUB_REGISTRY.md taxonomy gap

**Description:** Same build shows 3 different stub counts across three sources. Root cause is absent taxonomy, not arithmetic error.

**Evidence:**
- Build M: 10 visible in STUB_REGISTRY (3 in "Configurable Earning Strategies" section + 7 in main gamification section) / 12 claimed by CURRENT_BUILD sign-off / 14 per item 6 of 17 followups
- Status legend distinguishes Wired / Partially Wired / Unwired MVP / Post-MVP / Superseded
- Does NOT distinguish "committed deferred we WILL build" from "speculative we MIGHT build"
- Different aggregation methods collapse these differently → different counts

**Severity:** Medium. Registry is internally consistent. Drift only shows up when cross-referenced with sign-off claims.

**Category:** Drift.

**Proposed handling (Phase 0.26):** Formalize stub-type taxonomy. Separate "committed deferred" from "speculative possibility." Republish legend. Phase build re-counts use new taxonomy.

**Founder decision required:** Taxonomy labels (proposal: `committed_deferred`, `speculative`, `wired`, `partial_wired`, `superseded`).

---

### Finding 1.4 — Auto-load budget consumption

**Description:** Auto-loaded files consume ~670K per session before task-specific work starts.

**Evidence:**
- CURRENT_BUILD.md 283K (auto-loaded)
- CLAUDE.md 92K (auto-loaded)
- claude/database_schema.md 198K (auto-loaded via `@`)
- claude/live_schema.md 51K (auto-loaded via `@`) — likely overlaps database_schema.md
- claude/ai_patterns.md + architecture.md + conventions.md + feature_glossary.md ~50K combined (auto-loaded)
- LESSONS_LEARNED.md 27K — correctly NOT auto-loaded, lazy-loaded on demand

**Severity:** Medium. Affects every session's working budget. Worsens context-window pressure on large tasks.

**Category:** Drift (follows from 1.1 mostly; live_schema / database_schema redundancy is separate).

**Proposed handling:**
- Resolve CURRENT_BUILD.md per 1.1
- Evaluate live_schema.md / database_schema.md collapse
- Audit CLAUDE.md for content that could move to `@`-referenced lazy sub-files

**Founder decision required:** Whether to keep live_schema.md and database_schema.md separate or collapse.

---

### Finding 1.5 — Convention #14 enforcement mechanism absent

**Description:** The 7-item post-build checklist has no mechanical enforcement. Compliance varies by file.

**Evidence:**
- STUB_REGISTRY: highest compliance — tied to per-stub verification output (forces updates)
- BUILD_STATUS: ~60-70% compliance — most builds update, some skip
- CURRENT_BUILD.md: ~15-20% compliance (worst)
- CLAUDE.md: updated for some builds, not others
- FeatureGuide + LiLa knowledge updates: not tracked
- No pre-commit / post-commit / GitHub Action enforces the checklist

**Severity:** High — root mechanism finding. Explains why 1.1 and 1.2 drift.

**Category:** Drift.

**Proposed handling:** Choose enforcement mechanism. Options:
- Pre-commit hook asserting "files modified in this commit" (fails if build-marker file changes but BUILD_STATUS doesn't)
- GitHub Action convention-compliance check
- Formalized sign-off ceremony checklist with visible checkboxes in PR template

**Founder decision required:** Mechanism preference. Also: which checklist items actually matter (7 is a lot — is FeatureGuide update per-build really necessary?).

---

## Scope 2 — Compliance & Safety Architecture Gap Analysis

### Intended architecture (from PRDs)

Four layers with distinct responsibilities:

| Layer | Source PRD | Responsibility |
|---|---|---|
| Real-time Crisis Override | PRD-05 §AI Safety & Ethics, PRD-20 Tier 3 | Every LiLa conversation scans user messages for crisis keywords → resources (988/Crisis Text/NDVH/911) → no coaching. Global, not Safe-Harbor-only. |
| Safe Harbor Processing Space | PRD-20 | Calm space for mom/dad/gated teen/narrow guided. Validation-first. History isolated from regular LiLa. Exempt from spousal transparency + aggregation. |
| Behind-the-scenes Detection | PRD-30 | Two-layer scan (keyword + Haiku classifier) on monitored members → private flags to designated parents → "how to bring it up" conversation starter → weekly pattern digest. Invisible to the monitored member. |
| Permission & Transparency | PRD-02 | Mom-first. Four access levels (none/view/contribute/manage). Teens share UP but never restrict DOWN. Safe Harbor is an explicit transparency exception. Privacy Filtered is a hard system boundary. |

Plus Phase 0.35 COPPA compliance layer (PRD-40, authoring in parallel): per-parent verification, subscription payment as FTC-approved verification, trigger on first under-13 child add, `coppa_consents` + `parent_verifications` tables.

### Finding 2.1 — Crisis Override runtime enforcement

**Description:** Crisis detection wired correctly across 15 Edge Functions.

**Evidence:**
- [`supabase/functions/_shared/crisis-detection.ts`](supabase/functions/_shared/crisis-detection.ts) — 15 hard-coded keywords + `detectCrisis()` + `CRISIS_RESPONSE` (988/741741/1-800-799-7233/911)
- Consumed by: lila-chat, lila-message-respond, lila-higgins-say, lila-higgins-navigate, lila-quality-time, lila-gifts, lila-observe-serve, lila-words-affirmation, lila-mediator, lila-perspective-shifter, lila-gratitude, lila-cyrano, lila-board-of-directors, lila-decision-guide (+1)
- Runtime pre-check at [lila-chat/index.ts:297-326](supabase/functions/lila-chat/index.ts#L297-L326) + in-prompt CRISIS_OVERRIDE directive at [lila-chat/index.ts:39-44](supabase/functions/lila-chat/index.ts#L39-L44) — belt-and-suspenders

**Severity:** None. Wired correctly.

**Category:** Not a finding — baseline confirmation.

---

### Finding 2.2 — Safe Harbor schema hooks wired, frontend placeholder

**Description:** Schema and RLS for Safe Harbor are correct. Frontend is placeholder. Access-gating tables have no migration.

**Evidence:**
- `lila_conversations.is_safe_harbor` + `safety_scanned` columns exist ([migration 07 lines 42, 44, 86](supabase/migrations/00000000000007_lila_ai_system.sql))
- RLS `lc_select_parent` requires `is_safe_harbor = false` before primary parent SELECT succeeds ([migration 07:69-73](supabase/migrations/00000000000007_lila_ai_system.sql#L69-L73)) — transparency exemption correct at DB layer. Matches PRD-20 Decision 18.
- 4 guided modes seeded in `lila_guided_modes`: safe_harbor, safe_harbor_guided, safe_harbor_orientation, safe_harbor_literacy
- Route `/safe-harbor` → [src/pages/placeholder/index.tsx:52-53](src/pages/placeholder/index.tsx#L52-L53) renders `PlaceholderPage`
- Search `src/` for `SafeHarbor|is_safe_harbor|safe_harbor` returns 9 hits — all infrastructural (placeholder, feature-key registration, ViewAs exclusion, demand-validation card)
- `useLila.ts:225` filters `is_safe_harbor=false` on list; `createConversation` accepts `is_safe_harbor?: boolean` at `:270` — plumbing exists, no UI fires it
- **Access-gating tables missing:** `safe_harbor_orientation_completions`, `safe_harbor_literacy_completions`, `safe_harbor_consent_records` — documented in PRD-20 and `claude/database_schema.md` but no `CREATE TABLE` migration

**Severity:** High for end-user impact (cannot use Safe Harbor), but:

**Category:** Expected gap. PRD-20 frontend + gating tables are scheduled work on the gameplan Beta Readiness Gate. Not a process failure — a scheduled-but-not-yet-built item. The schema + RLS + guided modes + placeholder are residue of forward-planning.

**Proposed handling:** Hold for scheduled PRD-20 build. Verify PRD-20 build prompt includes the 3 access-gating tables.

**Founder decision required:** Confirm PRD-20 build remains on schedule before beta.

---

### Finding 2.3 — PRD-30 Safety Monitoring entire stack absent

**Description:** None of PRD-30's 7 tables exist. Two-layer detection pipeline not implemented. Flag review UI not built. Weekly digest not scheduled.

**Evidence:**

| Table | Migration | Required by |
|---|---|---|
| `safety_monitoring_configs` | None | Per-member opt-out, auto-create on new-child insert |
| `safety_sensitivity_configs` | None | Per-member-per-category sensitivity with 3 locked categories |
| `safety_notification_recipients` | None | Which parents get flag notifications |
| `safety_flags` | None | **The flag record itself** — context snippet, severity, starter, resource IDs |
| `safety_keywords` | None | Layer 1 reference library (50+ keywords, platform-managed) |
| `safety_resources` | None | Per-category curated hotlines/websites/articles |
| `safety_pattern_summaries` | None | Weekly digest per monitored member |

Pipeline state:
- Layer 1 keyword matching — the hard-coded `CRISIS_KEYWORDS` in `_shared/crisis-detection.ts` handles real-time Tier 3 crisis override; NOT the same as Layer 1 "raise a flag even when no crisis keyword"
- Layer 2 Haiku conversation classifier — no `safety-classify` Edge Function
- Weekly pattern digest — no cron schedule
- Flag review UI — no files in `src/pages/` or `src/components/`
- **`lila_messages.safety_scanned` + `lila_conversations.safety_scanned` columns exist but nothing writes to them — dormant residue from the 3-week-ago rebuild.**

**Severity:** High for beta impact. PRD-20 teen AI Literacy Module promises "the app will quietly let your parents know" — currently that promise cannot be kept.

**Category:** Expected gap (pipeline) + Residue (orphaned `safety_scanned` columns).

**Proposed handling:** Hold for scheduled PRD-30 build. Add `lila_messages.safety_scanned` + `lila_conversations.safety_scanned` to STUB_REGISTRY as forward-looking hooks with target phase = PRD-30 build.

**Founder decision required:** Confirm PRD-30 build scheduling.

---

### Finding 2.4 — COPPA infrastructure not yet written

**Description:** `coppa_consents` + `parent_verifications` tables not created. No first-under-13-child trigger. No payment → verification linkage. **PRD-40 itself has not been written** (Phase 0.35 scope, currently running in parallel session).

**Evidence:**
- `family_members.date_of_birth DATE` and `family_members.age INTEGER` columns exist ([migration 09:31-32](supabase/migrations/00000000000009_remediation_schema_batch.sql#L31-L32))
- No trigger derives under-13 status
- No consent event. No verification link.
- PRD-40 absent from `prds/` directory

**Severity:** High for beta impact. Beta launch with under-13 users blocked.

**Category:** Expected gap. Phase 0.35 is explicitly scheduled for PRD-40 authoring.

**Proposed handling:** Hold for Phase 0.35 completion → PRD-40 build → legal review.

**Founder decision required:** None now; confirm PRD-40 scheduling with the parallel authoring session.

---

### Finding 2.5 — `is_privacy_filtered` is implemented as unconditional strip, not author-aware (DRIFT from convention #76)

**Description:** Current implementation at the one site that honors the filter strips `is_privacy_filtered=true` items **unconditionally** — including from mom's own context when mom is the requester. Convention #76 describes a role-asymmetric rule ("NEVER in non-mom context") that implies mom should retain access to her own filtered items. Founder framing refines this further: the correct rule is **author-aware** — the member who authored/owns a filtered item retains access in their own tools; others do not.

**Trace evidence (verbatim):**

Site 1 — `supabase/functions/_shared/context-assembler.ts:607-615`:
```
const { data: items } = await supabase
  .from('archive_context_items')
  .select('context_value, folder_id, member_id')
  .eq('family_id', familyId)
  .in('folder_id', enabledFolderIds)
  .eq('is_included_in_ai', true)
  .eq('is_privacy_filtered', false)   // ← unconditional, no author check
  .is('archived_at', null)
  .limit(totalLimit)
```

Caller at lines 332-345 passes `membersToLoadArchive = [memberId, ...mentionedNonUser]`. The filter applies identically whether the item belongs to `memberId` (the requesting user) or to a mentioned other member. **No author-aware logic.**

Site 2 — `supabase/functions/_shared/relationship-context.ts:259-265` (function signature):
```
async function loadPersonContext(
  familyId: string,
  _requestingMemberId: string,   // ← underscore = intentionally unused
  personId: string,
  allMembers: ...
```

The TypeScript underscore-prefix convention explicitly marks `_requestingMemberId` as unused. **The author-aware hook is wired at the call site; the implementation was deferred.** This is explicit residue — a placeholder that was never filled in.

Sites 2-3 within `relationship-context.ts`:
- Line 281 (negative preferences query): no `is_privacy_filtered` filter, no `_requestingMemberId` check
- Line 397 (folder-scoped items): no `is_privacy_filtered` filter, no `_requestingMemberId` check

Site 4 — `bookshelf-study-guide/index.ts:79`:
- Query scope is `target_member_id`'s own archive
- No `is_privacy_filtered` filter

**Convention #76 verbatim (CLAUDE.md):**
> `is_privacy_filtered = true` items are NEVER included in non-mom context regardless of any toggle state. This is enforced in the context assembly pipeline, not in UI. It is not a preference — it is a system boundary.

The convention uses a role-asymmetric formulation ("non-mom"). Founder's refined framing uses an author-aware formulation ("requesting member is the owner"). Both agree on the core behavior: **filtered items should NOT load into another person's context, but SHOULD load into the author's own context.** Current code does neither — it strips unconditionally.

**Severity per site:**

| Site | Blast radius | Severity | Why |
|---|---|---|---|
| 1. `context-assembler.ts:613` (main pipeline) | All LiLa tools using canonical context assembly | Medium | Correctness bug in the safe-fail direction — over-filters, loses mom's access to her own flagged items. No leak. Affects tool usefulness, not safety. |
| 2. `relationship-context.ts:281` (negative preferences) | Cyrano/Higgins/Mediator (mom's own relationship tools) | Medium pending author-aware logic | Filter absent. If this becomes mom-requester-only in practice (which is likely for Cyrano etc.), unconditional leak of filtered items into mom's context is actually the expected behavior, and adding unconditional filter would be over-restrictive. Teen-facing entry points would change severity to high. |
| 3. `relationship-context.ts:397` (folder-scoped items) | Used by 7+ relationship Edge Functions including Mediator | **High** | Mediator's Full Picture mode synthesizes across two family members. If teen opens Higgins/Mediator to coach a conversation with mom, mom's privacy-filtered items about teen must not load into teen's prompt. Cross-member leak is real and active the moment teen uses any of these tools. |
| 4. `bookshelf-study-guide/index.ts:79` | Child study guide generation | Medium-low pending audit | Scope is child's own archive. Mom-as-requester is the common case; mom already has transparency for under-13 children in most contexts. Severity depends on what personal notes actually get stored in bookshelf curation, which wasn't audited here. |

**Fix pattern (for the report, not to execute in recon):**

The correct fix is **NOT** "add `.eq('is_privacy_filtered', false)` at all four sites." That would propagate the over-restrictive bug from Site 1 to Sites 2-4.

The correct fix is:
1. **Make the filter author-aware everywhere.** Rule: exclude `is_privacy_filtered=true` rows unless `item.member_id === requestingMemberId` (owner sees own items). If role-asymmetric convention preferred over author-aware, substitute: exclude unless requester is primary_parent.
2. **Wire `_requestingMemberId` at `relationship-context.ts` to drop the underscore** and actually consume the parameter.
3. **Apply the same author-aware query structure at all 4 sites consistently.**
4. **Add grep CI check** for convention #76 compliance on `archive_context_items` queries — but the check should verify author-aware logic is present, not just `.eq('is_privacy_filtered', false)` presence.
5. **Consider RLS-layer defense-in-depth** — RLS policy auto-excluding `is_privacy_filtered=true` for non-owner SELECTs. Deepest defense; would catch any future query that forgets the filter.

**Category:** Drift at Site 1 (convention existed, code does wrong thing). Residue at Sites 2-4 (hook wired, body not written — the underscore-prefix is the smoking gun). Mixed category; the fix unifies both.

**Proposed handling:** Phase 0.26 or dedicated safety pass after PRD-30 build prompt is written. Fold the filter-logic design into the PRD-30 safety schema work — that build touches the same area.

**Founder decision required:**
- Role-asymmetric ("mom always sees") vs. author-aware ("owner always sees") — which rule?
- Defense-in-depth at RLS layer yes/no?
- Timing: Phase 0.26, or hold until PRD-30 build picks it up?

---

### Finding 2.6 — LiLa runtime ethics enforcement is prompt-only (BETA BLOCKER)

**Description:** Gameplan Beta Readiness Gate ([line 523](MYAIM_GAMEPLAN_v2.2.md#L523)) requires "LiLa ethics enforcement verified at Edge Function level (not just prompt-specified): auto-reject categories (force, coercion, manipulation, shame-based control, withholding affection)." Currently implemented as system-prompt directive only. No platform-level enforcement.

**Evidence:**
- `BASE_IDENTITY` system prompt at [lila-chat/index.ts:46-58](supabase/functions/lila-chat/index.ts#L46-L58) says "You never guilt, shame, or manipulate" — directive to the model
- `VOICE_ADJUSTMENTS` enforces "parent-connection-first" tone for guided/independent roles
- **No pre-flight content filter on user input.** Prompt like "write a script to guilt-trip my teen into obeying" goes straight to the model
- **No post-generation content scan.** LiLa's response is not checked against auto-reject categories before returning
- **No rejection path.** Only crisis keywords trigger an early return
- The `content_policy_check` action in `lila-board-of-directors/index.ts:26-80` is the ONLY platform-level ethics gate, and it's scoped to persona creation (deity/harmful-description block) — not general conversation ethics

**Severity:** **Beta blocker.** Explicit gameplan exit criterion 523. System prompt is advisory, not enforcing. Red-team prompts targeting the 5 auto-reject categories can produce outputs that violate the Faith & Ethics Framework with no platform-level detection.

**Category:** Expected gap (scheduled Beta Readiness work) but **no dedicated PRD exists for this work**. The closest PRD is PRD-21 (Communication & Relationship Tools) which covers tool-specific ethics but not general runtime enforcement.

**Required components when this work is built:**
1. Pre-flight scan on user input for force/coercion/manipulation/shame/withholding patterns
2. Post-generation scan on LiLa output for the same 5 patterns
3. Rejection logging to an auditable table (e.g., `lila_ethics_rejections` with user_id, input_hash, category, timestamp)
4. Red-team test suite run before every deploy
5. Graceful refusal language — validate underlying need, redirect to healthier approach, never lecture. Must feel warm, not clinical.

**Proposed handling:**
- **Founder decision required:** Extend PRD-21 with a runtime enforcement section, OR create a new PRD-41 LiLa Runtime Ethics Enforcement.
- Recon flags the gap and the missing PRD. Founder decides PRD strategy.

**Blocking:** Yes — Beta Readiness Gate cannot be passed without this.

---

### Finding 2.7 — Safe Harbor aggregation-exclusion unverified (forward-looking risk)

**Description:** PRD-20 §Safe Harbor Data Exclusions requires Safe Harbor conversations to be excluded from monthly aggregation (PRD-19), context freshness review (PRD-19), reports, and any data compilation. RLS exclusion for spousal transparency ✓ verified (migration 07). Downstream scanners NOT yet wired, so risk is latent.

**Evidence:**
- `context-assembler.ts` Layer 2 topic-match + Layer 3 search paths NOT traced this phase — flagged for follow-up confirmation that no downstream path pulls `is_safe_harbor=true` text/embeddings
- `monthly_data_aggregations` table (PRD-19) — appears PRD-19 aggregation is schema-only today (no Edge Function or SQL function scans `lila_conversations`)
- Family Overview / Reports pipelines — same status, no scanner wired yet

**Severity:** Low today (scanners don't exist). Becomes high the moment PRD-19 aggregation, PRD-28B reporting, or any LiLa context expansion starts pulling from `lila_conversations`.

**Category:** Expected gap + pre-emptive guardrail need.

**Proposed handling:**
- Add explicit convention: `"all queries against lila_conversations used for aggregation / reporting / context MUST filter is_safe_harbor = false"`
- Add grep-based CI check before any aggregation pipeline goes live
- Add RLS/SQL-view guard for defense-in-depth

**Founder decision required:** Timing of the guardrail work. Can land in Phase 0.26, or when PRD-19/PRD-28B/PRD-30 aggregation first ships (whichever first).

---

### Finding 2.8 — RLS verification coverage absent for safety/child-data tables

**Description:** Current `RLS-VERIFICATION.md` covers families, family_members, calendar stack, PRD-18 rhythms stack (17 tests, 2026-04-07). Zero coverage of safety boundaries.

**Evidence:** Gameplan Beta Readiness exit criterion ([line 522](MYAIM_GAMEPLAN_v2.2.md#L522)): "Child data handling audit passes: RLS correct on all under-13 child data tables, export/deletion flows exist, retention policy encoded." Uncovered:
- Safe Harbor transparency boundary (Dad cannot read Mom's Safe Harbor conversation — migration 7 RLS correct but untested)
- Teen cannot read `safety_flags` (table doesn't exist; tests needed when built)
- Guided/Play child cannot read `member_documents`, `private_notes`, `relationship_notes` where they're the subject
- Mom can read all under-13 child data in contexts where she should
- Dad's access to children scoped by `member_permissions` — general case untested

**Severity:** High for beta certification. Beta Readiness Gate cannot be passed on RLS alone.

**Category:** Expected gap. RLS verification is scheduled work.

**Proposed handling:** After PRD-30 and PRD-40 tables land, expand RLS-VERIFICATION.md in one pass covering all safety + child-data tables.

**Founder decision required:** None now; scheduled with Beta Readiness sprint.

---

### Finding 2.9 — Child data export/deletion flows unverified

**Description:** Beta Readiness requires export/deletion flows with COPPA-aware retention. `data_exports` + `account_deletions` tables exist (PRD-22) but cascade behavior for under-13 data is untested.

**Evidence:**
- `data_exports` table exists (PRD-22 Settings)
- `account_deletions` table exists (PRD-22, 14-day grace)
- Unknown: deletion cascade correctly includes under-13 child data (lila_messages, lila_conversations, archive_context_items, journal_entries, etc.). Export similarly unverified.
- No retention policy language reviewed for under-13 data

**Severity:** Medium. Correctness uncertain; beta certification uncertain.

**Category:** Expected gap. Part of COPPA scope (PRD-40).

**Proposed handling:** Bundle with PRD-40 build. Legal review required on retention policy text.

**Founder decision required:** None now; scheduled with Beta Readiness.

---

### Unexpected observations from Phase D (kept for the record)

- **F1 Phase D** `CRISIS_KEYWORDS` hard-coded list (15 keywords) diverges from intended `safety_keywords` library (50+ per PRD-30). Correct architecture (narrow/fast for crisis override; broad/async for monitoring); gap is on broad-and-async side. **Category: Expected gap (PRD-30).**
- **F2 Phase D** `lila-translator`, `mindsweep-sort`, `message-coach` do NOT consume crisis-detection. Intentional per design (Translator = single-turn Haiku; Mindsweep = mom's brain dump; message-coach = mom drafting pre-send). Flag if teens/children get entry points. **Category: Intentional, not a finding.**
- **F3 Phase D** Crisis-detection scans USER input only, not LiLa OUTPUT. Industry-standard limitation; beta red-team scope. **Category: Expected gap + red-team followup.**
- **F4 Phase D** `permission_presets.safe_harbor = 'manage'` in Full Partner preset. No-op today because Safe Harbor UI doesn't render. **Category: Residue — scheduled activation with PRD-20 frontend.**
- **F5 Phase D** `feature_expansion_registry.ts` has a `safe_harbor` entry. Correct UX hygiene. **Category: Residue — forward-looking hook.**

---

## Scope 3 — Tool-Firing Verification Delta

### Finding 3.1 — codegraph MCP orphaned-lock regression

**Description:** `claude mcp list` shows `✓ Connected`. But `mcp__codegraph__codegraph_status` returns `CodeGraph not initialized for this project`. Direct CLI `codegraph status` returns `✗ Failed to get status: database is locked`. This is the **second** "verified green, broken by evening" instance today (first was npm/nvm4w).

**Evidence:**
- Lock directory state: `.codegraph/codegraph.db.lock/` empty, mtime 12:27:47, never modified after creation
- Database: 25.4MB, last written 12:27:10 (37 seconds before lock was created)
- Process list: zero `codegraph.exe` processes running. Lock is orphaned, not held.
- Lock is empty directory — no PID, no hostname, no identifier. Standard Unix mkdir-lock pattern without stale-detection.
- Gap: 7+ hours between lock creation and probe, zero modifications, zero holders

**Root-cause hypothesis:** codegraph uses mkdir-based atomic locking without PID payload. Relies on RAII cleanup on graceful exit; cleanup doesn't run on SIGKILL. Any session killed between `mkdir lock/` and `rmdir lock/` leaves orphan. **Recurrence prediction:** every ungraceful Claude Code session termination will produce this again.

**Severity:** High. Structural recurring pattern.

**Category:** Not applicable (Scope 3 is tool-health, not architectural).

**Three-part handling per founder direction:**
1. **Symptomatic fix:** `rm -rf .codegraph/codegraph.db.lock` (empty directory only, preserves 25MB index). NOT `rm -rf .codegraph`.
2. **Operational mitigation (Phase 0.26):** Step 0 hard-gate probe enhancement. Check for orphaned lock + flag with one-command cleanup.
3. **Upstream issue:** File with codegraph project — (a) PID-containing lockfile for stale-detection, (b) signal handler for graceful cleanup on SIGTERM/SIGKILL where possible.

**Founder decision required:** Confirm Phase 0.26 mitigation + upstream issue filing.

---

### Finding 3.2 — mgrep CLI green (F10 resolved)

**Description:** April 16 sweep's "yellow" observation on wizards directory is clear.

**Evidence:** Probes on post-Mar-28 identifiers returned 99%+ matches: MeetingSetupWizard.tsx 99.03%, UniversalListWizard.tsx 98.76%, StarChartWizard.tsx 99.14%. Hypothesis confirmed: async embedding lag caught up.

**Severity:** Resolved.

**Category:** Not applicable.

---

### Finding 3.3 — AURI correctly absent; SKILL.md drift flagged

**Description:** `claude mcp list` does NOT include endor-cli-tools (AURI formally disabled). `.claude/skills/prebuild/SKILL.md` still lists AURI as required hard-gate. Future `/prebuild` invocation would halt at Step 0 looking for missing MCP, or silently skip because skill text assumes registration.

**Evidence:**
- Binary at `C:/Users/tenis/AppData/Roaming/npm/bin/endorctl.exe` exists (323MB, Apr 16 11:45), version v1.7.932
- `--version` works without npm dependency
- `auth --print-access-token` returns "no credentials found" (matches F1 precondition Step 2)
- `claude mcp list` output confirms AURI not registered at user-scope

**Severity:** Medium. Doc drift between reality and skill instructions.

**Category:** Drift (applies to Scope 3 tool doc).

**Phase 0.26 action:** Update SKILL.md AURI row to reflect formally-disabled state + F1 reinstall pointer.

---

### Finding 3.4 — npm/nvm4w PATH broken

**Description:** node works; npm/npx broken.

**Evidence:**
- `node --version` → v20.10.0 ✓
- `npm --version` → `Error: Cannot find module 'C:\nvm4w\nodejs\node_modules\npm\bin\npm-cli.js'`
- `npx --version` → same (depends on npm)
- Three node installs on PATH (listed twice each): `C:\Users\tenis\AppData\Local\nvm`, `C:\nvm4w\nodejs`, `C:\Program Files\nodejs`
- `C:\nvm4w\nodejs\node_modules\` exists but `npm\bin\npm-cli.js` missing
- `node_modules/.bin/tsc` (project-local) works — local project binaries callable

**Severity:** High. Blocks normal git commits via pre-commit hook path; blocks `npm install` / `npx` workflows.

**Category:** Not applicable (tool-health, not convention).

**Proposed handling:** Separate backup-diagnose-fix-verify session. Probable fix: repair nvm4w install state (reinstall npm under nvm4w's node) OR reorder PATH so `C:\Program Files\nodejs` wins.

**Founder decision required:** Timing of the fix session.

---

### Finding 3.5 — Pre-commit hook broken

**Description:** `.git/hooks/pre-commit` runs `npx tsc --noEmit` uniformly. Because npx depends on broken npm, hook crashes with misleading "TypeScript errors" diagnosis.

**Evidence:**
- 344-byte POSIX shell script, executable
- Not file-type aware (runs on markdown-only commits)
- Error message attributes failure to TypeScript when root cause is npm

**Severity:** High. Any commit WITHOUT `--no-verify` fails with wrong diagnosis. Unknown window of silently-not-enforced tsc checks.

**Category:** Drift (convention #121 "tsc -b zero errors before commit" is only enforced by this hook; enforcement broken).

**Phase 0.26 fix:** Replace hook with file-type-aware version:
- Skip on markdown-only commits
- Use project-local `node_modules/.bin/tsc` directly (bypass npm)
- Report root cause explicitly on failure

---

### Finding 3.6 — MCP scope precedence documented

**Description:** Claude Code CLI reads only `~/.claude.json`. `.vscode/mcp.json` is VS Code-scope only. F17 resolved.

**Evidence (locations checked):**
- `~/.claude.json` `.mcpServers` (user scope): only `codegraph` registered
- `~/.claude.json` `.projects.<cwd>.mcpServers` (project scope): empty `{}`
- `.vscode/mcp.json` (workspace): has `endor-cli-tools` — for VS Code's integrated Claude extension, NOT Claude Code CLI
- `.vscode/settings.json`: file does not exist
- `.claude/settings.json` and `settings.local.json`: permissions only, no MCP config

**Severity:** Low (confirmatory).

**Category:** Not applicable.

**Phase 0.26 action:** Update `specs/Pre-Build-Setup-Checklist.md` + SKILL.md Step 0 to document multi-location sweep methodology.

---

### Finding 3.7 — "Looks Fine" pattern instances confirmed

- **Instance 1:** AURI Connected ≠ Functional (multiple confirmations).
- **Instance 2:** Pre-commit hook silent-error via npm dependency. Hook "exists" and "looks fine" but broken.
- Add both to LESSONS_LEARNED Quick Reference in Phase 0.26.

---

## Scope 4 — 17 Followups Classification

All accounted. 7 in Phase 0.26 + 1 partial founder-action + 2 defer-to-Phase-2 + 4 tech-debt + 1 intentional + 1 resolved + 1 closed + 2 new open findings.

### Do in Phase 0.26 (doc-fix pass) — 7 items

- **F3** — Document `mgrep watch --max-file-count 3000` startup in `PRE_BUILD_PROCESS.md`
- **F4** — Document 1000-file mgrep default limit in `reference_mgrep.md` + PRE_BUILD_PROCESS.md
- **F11** — Add `.mgrepignore` (tmp files + visual_schedule migrations + optional `public/**`). Frees ~500K token index space.
- **F14** — Founder files upstream GitHub issue on Mixedbread-Grep plugin describing 4 Windows bugs
- **F15** — Add repo token-size measurement to CLAUDE.md or new `REPO_STATS.md`. ~1.78M tokens in src/ alone.
- **F17** — Update `specs/Pre-Build-Setup-Checklist.md` methodology for multi-location MCP sweep
- **NEW: SKILL.md AURI row drift** (Finding 3.3)

### Partial Phase 0.25 + founder-action (1)

- **F1** — AURI reinstall. Preconditions verified (Phase A A7). Actual reinstall requires founder keyboard (browser OAuth doesn't work in Claude Code subprocess).

### Defer to Phase 2 audit (2)

- **F2 (residual)** — SKILL.md end-to-end probe design is strong. Remaining: mgrep quota state, freshness heuristics, AURI scan probe (blocked on F1).
- **F9** — mgrep quota/credit state in Step 0. Bundles with F2.

### Tech debt register (4)

- **F5** — `gh auth login` (optional, no blocker)
- **F7** — codegraph native bindings vs WASM (functional, slower)
- **F12** — Duplicate `sittinglila.png` (1.12MB byte-identical). Repo bloat.
- **F16** — Disable Windows `python3` MS Store alias + `mkdir C:\tmp\`. Hygiene only.

### Intentional / no action (1)

- **F6** — Supabase CLI v2.84.2 → v2.90.0. Founder-deferred.

### Resolved this session (1)

- **F10** — mgrep wizards directory. Finding 3.2.

### Closed (1)

- **F13** — RESCINDED (env-var fix wouldn't help since mgrep watch hook never runs on Windows — 4 incompatibility bugs).

### NEW open findings (2)

- **SKILL.md AURI drift** — Finding 3.3 (folded into Phase 0.26 fix list).
- **Codegraph orphaned-lock regression** — Finding 3.1 (requires root-cause investigation + upstream issue).

---

## Scope 5 — Universal List Wizard State Check

### Commit state

- **Commit:** 21a47a1 `wip: Universal List Wizard scaffolding`, 2026-04-16 15:21, author Tenise (co-authored Claude)
- **Scope:** 1134-line component + 5 supporting components + 503-line E2E test file (7 passing tests) + 2 feature-decision doc files (+3907 insertions)
- **No follow-up commits**
- **Status per gameplan line 24:** "committed at 21a47a1 but not yet founder-verified as serving intended use case." Canonical example of Phase 2 audit gap.

### 6-step wizard flow

| # | Step | Gate to advance |
|---|---|---|
| 1 | Purpose — 9 preset tiles + free-text with Haiku type detection | `selectedPresetKey \|\| detectedListType` |
| 2 | Items — BulkAddWithAI textarea → Haiku parse with section/price/quantity | **`items.length > 0` (HARD GATE)** |
| 3 | Sharing — private / specific-pick / whole-family + "others can add" toggle | Always |
| 4 | Organize — editable sections with live preview | Always |
| 5 | Extras — preset-specific checkboxes + ConnectionOffersPanel | Always |
| 6 | Review — title + summary + WizardTagPicker | `items.length > 0` to finish |

Deploy writes: `lists` row + synchronous-loop `list_items` inserts + `list_shares` inserts + `activity_log_entries` row with event_type='wizard_deployed'.

### Intended use case (from design docs)

**Session addendum line 213:**
> "List with my husband of things we need to get done" → Shared To-Do list → Universal List Wizard → "Who shares this list?" step

**Session addendum line 37 (priority rationale):**
> List wizards moved from Tier 4 to Tier 1. Shared lists are an immediate need for the founder's family (house to-do lists, things to get done, shared lists with husband).

**Session prompt this session:** "shared permanent shopping list with husband" — vocabulary drift from docs' "things to get done" but structurally identical: **ongoing, editable, shared-with-spouse list.**

### What wizard serves well

- List type detection from free text (Haiku)
- AI item parsing from brain dump
- Member pill picker for husband selection at Step 3
- `anyoneCanAdd` → `canEdit` mapping into `list_shares`
- localStorage progress persistence
- Activity logging with full metadata

### Gaps vs. intended use case (flagged — NOT fixed)

**Gap A — Step 2 hard-blocks on `items.length > 0`.** Mom cannot reach Sharing step without entering at least one item. Her mental model ("set up the shared list, we'll fill it in over time") doesn't match the wizard's model ("dump items, then configure sharing"). Workaround (throwaway placeholder) exists but clunky.

**Severity:** Medium. **Category:** Design drift from founder intent.

**Gap B — Default `sharingMode='private'`.** Shared-with-spouse requires 2 extra taps every invocation. Founder's canonical use case is shared-with-husband by default. Possible fast-paths (not implemented): spouse-relationship detection + auto-preselect, localStorage remember-last-used per preset, dedicated "Shared with [Husband Name]" preset tile.

**Severity:** Medium. **Category:** Design drift from founder intent.

**Gap C — Husband-visibility post-deploy NOT founder-verified.** E2E tests (7 passing) cover mom-side programmatic inserts only. No test validates:
- Husband's Lists page renders the shared list with correct ownership attribution
- Husband can add items (if `anyoneCanAdd=true`)
- Husband's Dashboard surfaces the list
- List appears in husband's search/filter queries

Canonical gameplan line 24 "tests pass ≠ serves need" gap.

**Severity:** High — the core use case hinges on behaviors the test suite doesn't exercise. **Category:** Design gap + Beta Readiness-adjacent.

**Gap D — "Permanent" semantics unexamined.** Wizard creates persistent `lists` row but no copy tells mom "this stays forever; come back via /lists." Review step mentions "add more items anytime" but no pointer to where list lives. Mom may lose discovery.

**Severity:** Low. **Category:** UX polish.

**Gap E — Session addendum Step 3 copy drift** (per-item assignment in Maintenance Schedule Wizard ≠ Universal List Wizard Step 3). Not a wizard gap; mom might expect it based on broader pattern. **Severity:** Low. **Category:** Doc drift.

**Gap F — Detector/preset mismatch path silently downgrades to custom.** If Haiku returns a `listType` not matching any preset `.key`, `matchedPreset` is null, fall-back is custom. Worth a unit test. **Severity:** Low. **Category:** Test coverage gap.

### Minor observations

- **F-Wiz-1** New `activity_log_entries.event_type = 'wizard_deployed'` value. Add to conventions in Phase 0.26.
- **F-Wiz-2** Wizard deploys sequentially (await inside for loop). 30-item shopping list = 30 round-trips. Performance concern at scale.
- **F-Wiz-3** Connection offers saved to metadata, never actioned downstream. Matches register-and-inert principle. Audit trail exists.
- **F-Wiz-4** `useWizardProgress` localStorage-only, not DB-backed. Breaks cross-device resume.

### Phase 0.5 input

Before calling the wizard sprint "paused," the next founder-driven test should be a **live multi-user exercise:** open wizard, set up shared shopping list with husband's account, have husband log in, verify he sees the list, both add items. 20-minute ceremony resolves Gap C + any unknown-unknowns.

**Founder decision required:** Timing of the multi-user test. Recommended before Phase 0.5 close-out.

---

## Volatility Observation For The Record

**Tool state and documentation state on this machine are more volatile than the April 16 sweep assumed.**

Three code/convention drifts of high severity:
1. **CURRENT_BUILD.md:** Convention says reset + clear; practice is ~15-20% compliance.
2. **BUILD_STATUS.md:** Says "Last updated: 2026-04-06"; actually Apr 13; missing 5 build completions.
3. **`is_privacy_filtered` convention #76:** Says enforcement in context assembly pipeline; practice is unconditional strip at 1 site, absent at 3 others — neither implements the author-aware or role-asymmetric rule.

Two "green in morning, broken by evening" tool instances today:
1. **npm/nvm4w** — node works, npm/npx broken
2. **codegraph MCP** — verified green at 12:27, orphaned lock by 12:28, 7 hours stale by evening

**Implication for Step 0 hard-gate cadence:**
- Step 0 end-to-end probe design is correct
- Step 0 only runs at build-start — multi-hour sessions can regress mid-build
- **Consider:** Step 0.5 mid-build re-probe for long sessions
- **Consider:** Pre-sign-off re-probe convention (CURRENT_BUILD Build P explicitly flagged this)
- **Consider:** Lower Step 0 cost to reduce friction

**Implication for convention enforcement:**
- "Do X after every build" conventions without mechanical enforcement drift
- STUB_REGISTRY has best compliance (tied to per-stub verification output)
- CURRENT_BUILD.md worst (~15-20%)
- BUILD_STATUS.md in between (~60-70%)
- **Consider:** Pre-commit hook / GitHub Action / sign-off ceremony checklist

**Also:** ~75% of Scope 2 findings are correctly categorized as Residue or Expected Gap. The codebase is post-rebuild, pre-completion. Scope 2's alarm band (actual Drift) narrows to Finding 2.5 (`is_privacy_filtered` logic) and Finding 2.6 (LiLa runtime ethics — though this is better understood as Expected Gap with no PRD yet). The report's rebalanced framing reflects this.

---

## Phase 0.26 Candidate Fix List (consolidated, re-ordered by category)

### Drift fixes (alarm band — address first)

- [ ] **Finding 1.1** Resolve CURRENT_BUILD.md interpretation + one-time cleanup + enforcement mechanism choice
- [ ] **Finding 1.2** Update BUILD_STATUS.md to reflect 5 missing completions + fix "Last updated" label
- [ ] **Finding 1.3** Formalize STUB_REGISTRY stub-type taxonomy
- [ ] **Finding 1.5** Choose convention #14 enforcement mechanism
- [ ] **Finding 2.5** (Drift portion at Site 1) — design author-aware filter logic to replace unconditional strip at `context-assembler.ts:613`. Wire `_requestingMemberId` consumption at `relationship-context.ts` sites. Coordinate with PRD-30 build if held.
- [ ] **Finding 3.5** Replace pre-commit hook with file-type-aware + project-local `node_modules/.bin/tsc`

### Residue cleanup (lower urgency, catch-up)

- [ ] Backfill `lila_messages.safety_scanned` + `lila_conversations.safety_scanned` into STUB_REGISTRY as forward-looking hooks (target phase: PRD-30 build)
- [ ] Backfill Safe Harbor placeholder UI + ViewAs exclusions + feature_expansion_registry entries into STUB_REGISTRY (target: PRD-20 frontend build)
- [ ] Backfill `permission_presets.safe_harbor='manage'` as expected no-op until PRD-20 frontend lands
- [ ] Backfill `_requestingMemberId` unused parameter as deferred-author-aware-logic stub in STUB_REGISTRY

### Tool health

- [ ] **Finding 3.1** Symptomatic fix recipe for codegraph orphaned lock + Step 0 hard-gate enhancement + upstream issue
- [ ] **Finding 3.3** Update SKILL.md AURI row
- [ ] **Finding 3.4** Separate session: backup-diagnose-fix-verify for npm/nvm4w PATH
- [ ] **Finding 3.6** Update `specs/Pre-Build-Setup-Checklist.md` multi-location MCP sweep methodology
- [ ] 17-followup Phase 0.26 items (F3, F4, F11, F14, F15, F17)

### Expected gaps — confirm scheduling, no immediate action

- [ ] **Finding 2.3** PRD-30 Safety Monitoring build — confirm gameplan scheduling
- [ ] **Finding 2.2** PRD-20 Safe Harbor frontend + gating tables build — confirm gameplan scheduling
- [ ] **Finding 2.4** PRD-40 COPPA — verify Phase 0.35 authoring session is on track
- [ ] **Finding 2.6** LiLa runtime ethics enforcement — **founder decision required:** extend PRD-21 or create PRD-41
- [ ] **Finding 2.7** Safe Harbor aggregation-exclusion guardrail — schedule alongside first PRD that adds aggregation
- [ ] **Finding 2.8** RLS-VERIFICATION.md expansion — bundle after PRD-30/PRD-40 tables land
- [ ] **Finding 2.9** COPPA export/deletion flow verification — bundle with PRD-40 build + legal review

### Feature fixes (Phase 2 audit + Phase 4 wizard pass)

- [ ] **Gap A** Universal List Wizard Step 2 items>0 hard-gate removal
- [ ] **Gap B** Default sharing mode rethink
- [ ] **Gap C** Multi-user E2E test for husband-side visibility (canonical Phase 2 audit exemplar)
- [ ] **Gap D** Discovery pointer to /lists post-deploy

### Red-team scope (pre-beta)

- [ ] **Finding 2.6 components 3 and 4** Rejection logging table schema + red-team test suite design

---

## Founder Decisions Required

Consolidated list of decisions surfaced by this report:

1. **Convention #14 interpretation** (Finding 1.1): literal "clear all sections" vs. "clear only active-build"
2. **Convention #14 enforcement mechanism** (Finding 1.5): pre-commit / GitHub Action / ceremony checklist
3. **STUB_REGISTRY stub-type taxonomy labels** (Finding 1.3)
4. **BUILD_STATUS "Last updated" label** (Finding 1.2): auto-generated or manual
5. **live_schema.md / database_schema.md collapse** (Finding 1.4)
6. **is_privacy_filtered rule** (Finding 2.5): role-asymmetric ("mom always sees") vs. author-aware ("owner always sees")
7. **is_privacy_filtered RLS defense-in-depth** (Finding 2.5): yes/no
8. **is_privacy_filtered fix timing** (Finding 2.5): Phase 0.26 or hold for PRD-30 build
9. **LiLa runtime ethics PRD strategy** (Finding 2.6): extend PRD-21 vs. create PRD-41
10. **Safe Harbor aggregation guardrail timing** (Finding 2.7): Phase 0.26 or first aggregation PRD
11. **Phase 0.26 codegraph mitigation + upstream issue** (Finding 3.1): confirm
12. **npm/nvm4w fix session timing** (Finding 3.4)
13. **Wizard multi-user test timing** (Scope 5 Gap C): before Phase 0.5 close-out recommended

---

*End Reconnaissance Report v1. Next action: founder review. Doc-reconciliation fixes land in Phase 0.26 after founder approves this report. Residue cleanup and Expected-gap items remain as scheduled work.*
