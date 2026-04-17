# Reconnaissance Report v1

> **Phase 0.25 deliverable per `MYAIM_GAMEPLAN_v2.2.md` lines 152-190.**
> **Audit window:** 2026-04-16 evening session.
> **Scope:** All 5 reconnaissance scopes (doc reconciliation, compliance/safety gap analysis, tool-firing verification, 17 followups classification, wizard state check).
> **Nature:** Findings only. No fixes applied this phase. All corrections sit in Phase 0.26 and later.
> **Inputs rolled up:** `.claude/recon/phase-abc-findings.md` (Phases A+B+C), `c:/tmp/phase_d_findings.md` (Phase D), `c:/tmp/phase_e_findings.md` (Phase E + is_privacy_filtered trace).

---

## Executive Summary

Five scopes investigated. Findings fall into four severity bands:

**Critical / High severity — 9 findings**
1. **PRD-30 Safety Monitoring is 100% absent.** 7 tables missing, pipeline not running, no flag review UI. Teen AI Literacy promises "the app will quietly let your parents know" — promise cannot be kept today.
2. **Safe Harbor frontend is a placeholder only.** Route renders `PlaceholderPage`. All 7 screens (landing, history, conversation, guided, orientation, literacy, hold harmless) not built.
3. **Safe Harbor access-gating tables have no migration.** `safe_harbor_orientation_completions`, `safe_harbor_literacy_completions`, `safe_harbor_consent_records` documented in PRD-20 and schema doc but never created.
4. **COPPA infrastructure 100% absent.** `coppa_consents`, `parent_verifications` not created. No first-under-13 trigger. Beta Readiness Gate cannot be passed until PRD-40 is written + built + legally reviewed.
5. **LiLa ethics auto-reject is prompt-only, not Edge Function enforcement.** Gameplan Beta Readiness exit criterion (line 523) requires platform-level auto-reject for force/coercion/manipulation/shame-based control/withholding affection. Today: system-prompt directive only, no pre-flight filter, no post-generation scan, no rejection path.
6. **`is_privacy_filtered` convention #76 violated at 3 of 4 read sites.** `relationship-context.ts` (2 sites used by 7+ relationship tools) and `bookshelf-study-guide/index.ts` do not honor the filter. `context-assembler.ts` is the only correct site.
7. **CURRENT_BUILD.md mechanism drift.** 2637 lines / 283K / 13 build sections below the "IDLE" header. Only 3 "reset to IDLE" commits in repo history — about 15-20% compliance with convention #14 Part B. Auto-loaded into every session, polluting context with 7 un-marked build sections.
8. **BUILD_STATUS.md is authoritative but stale.** Header says "Last updated: 2026-04-06"; 5 completed builds missing (Meetings signed off, Gamification signed off, Rhythms Phases C+D, BookShelf Phase 1 + 1b, PRD-28 Sub-phase B). New sessions reading BUILD_STATUS as primary would propose re-building already-complete work.
9. **Pre-commit hook actively broken.** `.git/hooks/pre-commit` runs `npx tsc --noEmit`; npx depends on npm; npm is broken on Windows machine; hook crashes with misleading "TypeScript errors found" message. No tsc enforcement in commit path for unknown duration.

**Medium severity — 7 findings**
- Codegraph MCP orphaned-lock regression (mkdir-lock structural pattern, no stale detection)
- STUB_REGISTRY.md stub-count drift (3 different numbers for same build — taxonomy gap)
- File auto-load budget ~670K/session — CURRENT_BUILD alone contributes 283K
- SKILL.md AURI drift — still lists AURI as required hard-gate; formally disabled
- Safe Harbor aggregation-exclusion unverified for downstream scanners (blocks on PRD-19/PRD-28B wiring-on)
- Universal List Wizard Gaps A+B: Step 2 hard-blocks on items>0 + default sharing mode 'private' — frictions the canonical use case
- `mindsweep-sort`, `lila-translator`, `message-coach` do not consume crisis-detection (intentional per design; flag for future teen entry points)

**Low severity / Resolved / Intentional — 9 findings**
- mgrep wizards directory now returns 99%+ matches (F10 resolved)
- AURI correctly absent from Claude Code CLI (`.vscode/mcp.json` is VS Code-scope only)
- VS Code MCP config scope precedence documented (F17 resolved)
- Ruled-out hypotheses preserved in Phase A source (don't re-investigate)
- F13 rescinded (env-var fix wouldn't help since mgrep watch hook never runs on Windows)
- Supabase CLI upgrade (F6) — intentional defer
- Various tech-debt items (F5, F7, F12, F16)
- Crisis-override runtime enforcement ✓ wired across 15 Edge Functions
- Prayer Seat + deity-as-persona block ✓ wired in Board of Directors Edge Function

**One overarching pattern worth naming in bold:**

> **Tool state and documentation state on this machine are more volatile than the April 16 sweep assumed.** Two "green in morning, broken by evening" instances this day alone (npm/nvm4w; codegraph). Three convention-vs-practice drifts of high severity (CURRENT_BUILD, BUILD_STATUS, `is_privacy_filtered`). The sweep's implicit model of "verify once, then trust until next sweep" does not hold.

---

## Scope 1 — Doc Accuracy Reconciliation

### CURRENT_BUILD.md — mechanism finding

- **State:** 283,389 bytes / 2637 lines / 13 full build sections below the header.
- **Header claim:** `Status: IDLE` with two current sign-offs listed (Build P PRD-16 and Build M Gamification, both 2026-04-16).
- **Reality below header:** `grep -n "^# Build " CURRENT_BUILD.md` returns 13 Build sections. 2 marked "SIGNED OFF", 5 marked "COMPLETED", **6 have no header marker at all** (sections O, N, L, K, C, E, G).
- **Historical archive at bottom:** stops at PRD-14C / 2026-03-31. Missing all completions Apr 1+.
- **Git log reality:** Only 3 "reset CURRENT_BUILD to IDLE" commits in history — f20f944 (2026-03-30, PRD-14), 2ed66c4 (today, Build M+PRD-16), 01de232 (today, follow-up reset).
- **Compliance rate for convention #14 Part B "reset Status to IDLE, clear all sections":** ~15-20%.
- **Severity:** **High.** Auto-loaded into every session via CLAUDE.md `@CURRENT_BUILD.md`. Six un-marked active-looking sections read as "current work" to any new session.
- **Phase 0.26 actions:**
  - Clarify convention #14 interpretation: literal "clear all sections" (move to append-only archive) vs. "clear only active-build sections, leave historical" (current practice).
  - One-time cleanup of 11 un-cleared sections.
  - Choose enforcement mechanism: pre-commit hook assertion, GitHub Action, or formalized sign-off ceremony checklist.

### BUILD_STATUS.md — most out-of-date living doc

- **State:** Header "Last updated: 2026-04-06". File mtime Apr 13. Last git commit touching it: a161015 on 2026-04-13 (PRD-28 Sub-phase B).
- **Missing entries:** Build L (Rhythms Phase C, 2026-04-07), Build N (Rhythms Phase D, 2026-04-07), Phase 1b-F BookShelf (2026-04-13), Build M Gamification sign-off (2026-04-16), Build P PRD-16 sign-off (2026-04-16).
- **Specific drift rows:**
  - Line 52: Phase 17 PRD-16 Meetings → "Pending" (actual: SIGNED OFF 2026-04-16)
  - Line 64: Phase 29 PRD-24/24A/24B → "Pending" (actual: SIGNED OFF 2026-04-16)
  - Line 54: Phase 19 Rhythms → "Phase C and Phase D pending" (actual: both complete 2026-04-07)
  - Line 67: Phase 32 PRD-28 → "Partial — Sub-phase A; Sub-phase B pending" (actual: both complete 2026-04-13)
  - Line 63: Phase 28 PRD-23 BookShelf → "Pending" (actual: Phase 1 + Phase 1b-F complete)
- **Severity:** **High.** New sessions reading BUILD_STATUS as primary planning source would propose re-building Meetings, Gamification, BookShelf, Rhythms Phase C+D.
- **Phase 0.26 actions:** Bring up to date. Fix "Last updated" label. Add missing completions.

### STUB_REGISTRY.md — most current but counting ambiguity

- **State:** mtime Apr 15 17:31. Updates have fired for most recent builds (Build P 2026-04-15, Build M Phase 7 2026-04-11, Build N 2026-04-07). Highest doc-update compliance rate of the four living docs.
- **Drift type:** Not freshness — taxonomy. Build M reports 3 different stub counts: 10 (from grep of registry), 12 (CURRENT_BUILD sign-off claim), 14 (item 6 of the 17 followups).
- **Root cause:** Status legend distinguishes Wired / Partially Wired / Unwired MVP / Post-MVP / Superseded. Does NOT distinguish "deferred work we WILL build" from "possibility we MIGHT build." Different aggregation methods produce different counts.
- **Severity:** **Medium.** Counts don't match but the registry itself is internally consistent.
- **Phase 0.26 actions:** Formalize stub-type taxonomy per item 6 of the 17 followups. Separate "committed deferred" from "speculative possibility." Republish legend. Phase build verification re-counts use new taxonomy.

### File auto-load budget — context waste

- **CURRENT_BUILD.md:** 283K / 2637 lines — auto-loaded every session
- **CLAUDE.md:** 92K / 511 lines — auto-loaded every session
- **claude/database_schema.md:** 198K — auto-loaded via `@` reference
- **claude/live_schema.md:** 51K — auto-loaded via `@` reference (likely overlaps with database_schema.md)
- **claude/ai_patterns.md, architecture.md, conventions.md, feature_glossary.md:** ~50K combined — auto-loaded
- **Total:** ~670K per session budget consumed before any task-specific work starts.
- **LESSONS_LEARNED.md:** 27K — NOT @-referenced; loads only on demand. Correct handling.
- **Severity:** **Medium.** Affects every session's working budget.
- **Phase 0.26 actions:** (a) resolve CURRENT_BUILD.md accumulation; (b) evaluate whether live_schema.md and database_schema.md can collapse; (c) audit CLAUDE.md for content that could move to `@`-referenced sub-files.

### Inter-doc contradictions propagate session confusion

- **C4a** BUILD_STATUS Phase 17 "Pending" vs. CURRENT_BUILD Build P "SIGNED OFF 2026-04-16" — same codebase, different answer depending on read order.
- **C4b** BUILD_STATUS Phase 29 "Pending" vs. CURRENT_BUILD Build M "SIGNED OFF 2026-04-16" — identical pattern.
- **C4c** CURRENT_BUILD.md "Status: IDLE" header + 6 un-marked active-looking build sections below — intra-file contradiction.
- **C4d** CURRENT_BUILD.md bottom archive stops at Mar 31; missing Builds H, I, K, L, M, N, P, Phase 1b-F.
- **C4e** Stub counts drift across sources for same build.

### Mechanism finding — auto-update-after-build convention has no enforcement

- Convention #14 Part B is a 7-item checklist (BUILD_STATUS + database_schema + STUB_REGISTRY + CLAUDE.md + FeatureGuide + LiLa knowledge + feature-decision + CURRENT_BUILD reset + feature-decisions README).
- Commit log shows inconsistent firing — some builds touch all 4 living docs, some touch 2-3, some touch 1.
- STUB_REGISTRY has best compliance because updates are tied to per-stub verification output.
- CURRENT_BUILD reset has worst compliance (~15-20%).
- BUILD_STATUS in between (~60-70%).
- **Severity:** **High — root mechanism finding.** Drift is structural, not incidental.
- **Phase 0.26 actions:** Choose enforcement mechanism (pre-commit hook "files modified in this commit" assertion, GitHub Action convention-compliance check, formalized sign-off ceremony checklist with visible checkboxes).

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

Plus Phase 0.35 COPPA compliance layer (PRD-40, not yet written): per-parent verification (not per-child), subscription payment as FTC-approved verification, trigger fires on first under-13 child add, `coppa_consents` + `parent_verifications` tables.

### What IS built

- **Crisis Override runtime enforcement — ✓ WIRED.** [`supabase/functions/_shared/crisis-detection.ts`](supabase/functions/_shared/crisis-detection.ts) with 15 hard-coded keywords + `detectCrisis()` + `CRISIS_RESPONSE`. Consumed by **15 Edge Functions**: lila-chat, lila-message-respond, lila-higgins-say, lila-higgins-navigate, lila-quality-time, lila-gifts, lila-observe-serve, lila-words-affirmation, lila-mediator, lila-perspective-shifter, lila-gratitude, lila-cyrano, lila-board-of-directors, lila-decision-guide (+1). Belt-and-suspenders: runtime pre-check AT [lila-chat/index.ts:297-326](supabase/functions/lila-chat/index.ts#L297-L326) + in-prompt CRISIS_OVERRIDE directive at [lila-chat/index.ts:39-44](supabase/functions/lila-chat/index.ts#L39-L44).
- **Safe Harbor schema hooks — ✓ WIRED (partial).** `lila_conversations.is_safe_harbor` + `safety_scanned` columns exist ([migration 07 lines 42, 44, 86](supabase/migrations/00000000000007_lila_ai_system.sql)). RLS `lc_select_parent` correctly requires `is_safe_harbor = false` before primary parent SELECT — transparency exemption enforced at DB layer. Matches PRD-20 Decision 18.
- **Safe Harbor guided modes — ✓ WIRED (data only).** 4 modes seeded in `lila_guided_modes`: safe_harbor, safe_harbor_guided, safe_harbor_orientation, safe_harbor_literacy. Feature key present in Full Partner permission preset.
- **Deity-as-Board-persona block + Prayer Seat — ✓ WIRED.** `content_policy_check` action in lila-board-of-directors with outcomes approved/deity/blocked/harmful_description. Deity → Prayer Seat redirect. Matches convention #100 + #102.
- **`is_privacy_filtered` column — ✓ WIRED in schema.** Archive items have the boolean. Enforcement traced separately below.
- **Age collection — ✓ WIRED (basis only).** `family_members.date_of_birth` + `age` columns exist. No under-13 trigger. No consent event. No verification link.

### Critical gaps

**Gap 1 — Safe Harbor access-gating tables SPEC ONLY**

| Table | Migration | Required by |
|---|---|---|
| `safe_harbor_orientation_completions` | None | Teen access step 1 (mom orientation) |
| `safe_harbor_literacy_completions` | None | Teen access step 4 (teen AI literacy) |
| `safe_harbor_consent_records` | None | Teen access step 3 (hold harmless + transparency level) |

**Impact:** Teen Safe Harbor access cannot be gated in the database. Mom orientation walkthrough, teen literacy module, hold-harmless agreement have no persistence layer.

**Gap 2 — PRD-30 Safety Monitoring 100% ABSENT**

None of the 7 required tables exist: `safety_monitoring_configs`, `safety_sensitivity_configs`, `safety_notification_recipients`, `safety_flags`, `safety_keywords`, `safety_resources`, `safety_pattern_summaries`.

Pipeline status:
- **Layer 1 keyword matching — not implemented.** The `CRISIS_KEYWORDS` list in `_shared/crisis-detection.ts` handles real-time Tier 3 crisis override; it is NOT the same as Layer 1 "raise a flag even when no crisis keyword."
- **Layer 2 Haiku conversation classifier — not implemented.** No `safety-classify` Edge Function. No scheduled job fires at conversation close.
- **Weekly pattern digest — not implemented.** No cron schedule.
- **Flag review UI — not built.** No matching files in `src/pages/` or `src/components/`.
- **`lila_messages.safety_scanned` column exists but nothing writes to it.** Dead weight until PRD-30 is built.

**Impact:** Bark-style parent alert system is absent. Teen AI Literacy Module (PRD-20) promises "the app will quietly let your parents know" — currently that promise cannot be kept.

**Gap 3 — Safe Harbor frontend PLACEHOLDER ONLY**

Route `/safe-harbor` → [src/pages/placeholder/index.tsx:52-53](src/pages/placeholder/index.tsx#L52-L53) renders a `PlaceholderPage` with `prd="PRD-20"`, `featureKey="safe_harbor"`. That's the entire implementation.

Search `src/` for `SafeHarbor|is_safe_harbor|safe_harbor` returns 9 hits — all infrastructural (route placeholder, PermissionHub feature-key registration, ViewAsProvider `PRIVACY_EXCLUSIONS = ['safe_harbor']`, feature_expansion_registry demand-validation card, etc.). No pages, no components, no hooks.

Missing entirely:
- Screen 1 landing page
- Screen 2 history
- Screen 3 conversation container
- Screen 4 guided child experience
- Screen 5 mom orientation
- Screen 6 teen literacy module
- Screen 7 hold harmless

`useLila.ts` correctly filters `is_safe_harbor=false` at [line 225](src/hooks/useLila.ts#L225) and `createConversation` accepts `is_safe_harbor?: boolean` at [line 270](src/hooks/useLila.ts#L270) — plumbing exists, no UI fires it.

**Impact:** End users cannot use Safe Harbor.

**Gap 4 — COPPA / parental verification 100% ABSENT**

- `coppa_consents` — no migration, not in schema doc (PRD-40 not yet written).
- `parent_verifications` — no migration.
- No first-under-13-child trigger. Nothing derives under-13 status from `date_of_birth`.
- No payment → verification linkage (per Phase 0.35 decision to treat subscription payment as FTC-approved verification).
- Retrofit hooks in PRD-01 (Auth) and PRD-31 (Subscription) absent because infrastructure doesn't exist.
- **PRD-40 itself has not been written (Phase 0.35 scope). This recon runs BEFORE Phase 0.35.**

**Impact:** Beta launch with under-13 users blocked until PRD-40 is written, COPPA infrastructure is built, and a human lawyer reviews consent/disclosure language. Explicit Beta Readiness Gate exit criterion (gameplan v2.2 line 521).

**Gap 5 — LiLa ethics auto-reject at Edge Function level PROMPT-ONLY**

Gameplan exit criterion (line 523): "LiLa ethics enforcement verified at Edge Function level (not just prompt-specified): auto-reject categories (force, coercion, manipulation, shame-based control, withholding affection)."

Current state:
- `BASE_IDENTITY` system prompt ([lila-chat/index.ts:46-58](supabase/functions/lila-chat/index.ts#L46-L58)) says "You never guilt, shame, or manipulate" — directive to LiLa.
- `VOICE_ADJUSTMENTS` enforces "parent-connection-first" tone for guided/independent roles.
- **No pre-flight content filter on user input.** Prompt like "write a script to guilt-trip my teen" goes to the model.
- **No post-generation content scan.** LiLa's response is not checked against auto-reject categories.
- **No rejection path.** Only crisis keywords trigger an early return.
- `content_policy_check` in lila-board-of-directors is the ONLY platform-level ethics gate, scoped to persona creation (deity/harmful-description block).

**Impact:** Red-team prompts targeting the 5 auto-reject categories can produce outputs that violate Faith & Ethics Framework. Edge Function would never know. System prompt is advisory, not enforcing.

**Gap 6 — Safe Harbor aggregation-exclusion UNVERIFIED**

PRD-20 §Safe Harbor Data Exclusions: conversations must be excluded from monthly aggregation (PRD-19), context freshness review (PRD-19), reports, any data compilation.

- RLS exclusion for spousal transparency ✓ verified (migration 07).
- `context-assembler.ts` — Layer 2 topic-match + Layer 3 search load paths NOT traced this phase. Must confirm no downstream LiLa context path pulls `is_safe_harbor=true` text/embeddings.
- `monthly_data_aggregations` (PRD-19) — need to confirm no Edge Function or SQL function scans `lila_conversations` for aggregation. Appears none do yet (PRD-19 is schema-only).
- Family Overview / Reports pipelines — same status, no scanner wired.

**Impact:** Low risk today because downstream scanners don't exist. Becomes high risk the moment PRD-19 aggregation, PRD-28B reporting, or any LiLa context expansion pulls from `lila_conversations`. **Recommendation:** Add explicit `is_safe_harbor = false` convention + RLS/SQL-view guard before any aggregation pipeline goes live.

**Gap 7 — RLS verification coverage for safety/child-data tables NONE**

Current `RLS-VERIFICATION.md` coverage: families, family_members, calendar stack, PRD-18 rhythms stack (17 tests, 2026-04-07). Zero coverage of:
- Safe Harbor transparency boundary (Dad cannot read Mom's Safe Harbor conversation — migration 7 RLS is correct but untested in the matrix)
- Teen cannot read `safety_flags` (table doesn't exist; tests needed when built)
- Guided/Play child cannot read `member_documents`, `private_notes`, `relationship_notes` where they're the subject
- Mom can read all under-13 child data in contexts where she should
- Dad's access to children scoped by `member_permissions` — general case untested

Gameplan Beta Readiness exit criterion (line 522): "Child data handling audit passes: RLS correct on all under-13 child data tables, export/deletion flows exist, retention policy encoded." None of these are certified.

**Gap 8 — Child data export / deletion flows UNVERIFIED**

- `data_exports` table exists (PRD-22).
- `account_deletions` table exists (PRD-22, 14-day grace).
- **Unknown:** Whether deletion cascade correctly includes under-13 child data (lila_messages, lila_conversations, archive_context_items, journal_entries, etc.). Export similarly unverified.
- No retention policy language reviewed for under-13 data.

### Unexpected observations flagged from Phase D

- **F1** `CRISIS_KEYWORDS` hard-coded list (15 keywords) diverges from intended `safety_keywords` library (50+ per PRD-30 spec). Correct architecture; gap is on the broad-and-async side.
- **F2** `lila-translator`, `mindsweep-sort`, `message-coach` do NOT consume crisis-detection. Intentional per design (Translator single-turn Haiku; Mindsweep = mom's brain dump; message-coach = mom drafting pre-send). Flag for future if teens/children get entry points to any.
- **F3** Crisis-detection scans USER input only, not LiLa OUTPUT. If LiLa hallucinates harmful language, no post-generation gate. Industry-standard limitation; worth beta red-team scope.
- **F4** `permission_presets.safe_harbor = 'manage'` in Full Partner preset is a no-op today — permission exists but Safe Harbor UI doesn't render.
- **F5** `feature_expansion_registry.ts` has a `safe_harbor` entry — correct UX hygiene. Confirms Safe Harbor is treated as a known unbuilt feature, not oversight.

### is_privacy_filtered trace (Phase D F6 closure)

**Task:** Confirm `context-assembler.ts` respects `archive_context_items.is_privacy_filtered` per CLAUDE.md convention #76.

**Result:** **Filter enforced at 1 of 4 read sites. 3 sites are gaps.**

| Site | File:Line | is_privacy_filtered honored? |
|---|---|---|
| ✓ Archive context load (topic-scoped, named-person) | [`_shared/context-assembler.ts:613`](supabase/functions/_shared/context-assembler.ts#L613) | YES |
| ❌ Negative preferences (veto items) | [`_shared/relationship-context.ts:281`](supabase/functions/_shared/relationship-context.ts#L281) | **NO** |
| ❌ General folder-scoped items | [`_shared/relationship-context.ts:397`](supabase/functions/_shared/relationship-context.ts#L397) | **NO** |
| ❌ Child study guide personalization | [`bookshelf-study-guide/index.ts:79`](supabase/functions/bookshelf-study-guide/index.ts#L79) | **NO** |

**Interpretation:** Convention #76 states `is_privacy_filtered = true` items are NEVER included in non-mom context, enforcement "in the context assembly pipeline."

- The canonical `context-assembler.ts` pipeline honors the flag correctly.
- `relationship-context.ts` is a parallel loader consumed by **7+ Edge Functions** (Cyrano, Higgins-Say, Higgins-Navigate, Gratitude, Quality-Time, Words-Affirmation, Observe-Serve, Mediator). Both read sites there miss the filter.
- `bookshelf-study-guide/index.ts:79` is single-purpose; queries by `member_id=target_member_id` (scope is child's own archive). Mom-as-requester path still leaks.

**Severity:** **High.**

**Phase 0.26 / Phase 4 actions:**
- Add `.eq('is_privacy_filtered', false)` to `relationship-context.ts:281` and `:397`.
- Decide policy for `bookshelf-study-guide/index.ts:79`.
- Add grep CI check: every `.from('archive_context_items').select(` must be followed within N lines by `.eq('is_privacy_filtered', false)` OR `// PRIVACY-OK` explicit comment.
- Consider RLS-layer defense-in-depth: RLS policy automatically excludes `is_privacy_filtered=true` rows from non-mom SELECT.

### Compliance fix now — minimal sequence

Ordered by dependency:

1. **Write PRD-40 (Phase 0.35)** — COPPA infrastructure spec.
2. **Write PRD-20 + PRD-30 build prompts** — 7 missing PRD-20 tables + 7 missing PRD-30 tables, RLS verified in-migration.
3. **Build COPPA per PRD-40** — `coppa_consents`, `parent_verifications`, first-under-13 trigger, payment linkage, UX.
4. **Build PRD-20 Safe Harbor frontend + gating tables** — orientation, literacy, consent screens with persistence.
5. **Build PRD-30 detection pipeline + flag review surfaces** — Layer 1 + Layer 2 + weekly digest.
6. **Implement LiLa ethics auto-reject at Edge Function level** — shared pre-flight content filter + rejection path, red-team tested.
7. **Fix `is_privacy_filtered` gap** — 3 call sites + CI check + optional RLS defense-in-depth.
8. **Verify Safe Harbor aggregation-exclusion** — convention + grep-based CI check.
9. **Expand `RLS-VERIFICATION.md`** — Safe Harbor transparency + all child-data tables + all PRD-30 tables + all COPPA tables.
10. **Legal review** — consent language, T&C, privacy policy, LiLa disclosure, data handling.

Every item is an explicit Beta Readiness Gate exit criterion (gameplan v2.2 lines 520-529).

---

## Scope 3 — Tool-Firing Verification Delta

### A1. codegraph MCP — REGRESSION

- `claude mcp list` shows `✓ Connected`. But `mcp__codegraph__codegraph_status` returns `CodeGraph not initialized for this project`. Direct CLI `codegraph status` returns `✗ Failed to get status: database is locked`.
- **Lock directory state:** `.codegraph/codegraph.db.lock/` empty, mtime 12:27:47, never modified after creation.
- **Database:** 25.4MB, last written 12:27:10 (37 seconds before lock was created).
- **Process list:** Zero `codegraph.exe` processes running. Lock is orphaned, not actively held.
- **Root-cause hypothesis:** codegraph uses mkdir-based atomic lock pattern without PID/hostname payload. No stale-detection mechanism. Ungraceful termination (SIGKILL, window close, VS Code crash) leaves orphan locks.
- **Recurrence prediction:** Without upstream fix OR operational mitigation, will happen again on every ungraceful Claude Code session termination that involves a codegraph call.
- **Second "verified green in morning, broken by evening" instance today** (first was npm/nvm4w). Tool state is more volatile than April 16 sweep assumed.
- **Three-part handling per founder direction:**
  - **Symptomatic fix:** `rm -rf .codegraph/codegraph.db.lock` (empty directory only, preserves 25MB index). NOT `rm -rf .codegraph`.
  - **Operational mitigation (Phase 0.26):** Step 0 hard-gate enhancement. Check for orphaned lock + flag with one-command cleanup instruction.
  - **Upstream issue:** File with codegraph project — (a) PID-containing lockfile, (b) signal handler removing lock on SIGTERM/SIGKILL where possible.
- **Severity:** **High** (structural recurring pattern).

### A2. mgrep CLI — GREEN, F10 RESOLVED

Probes on post-Mar-28 identifiers returned 99%+ matches: MeetingSetupWizard.tsx 99.03%, UniversalListWizard.tsx 98.76%, StarChartWizard.tsx 99.14%. April 16 sweep's "yellow" observation on wizards directory is now clear. Hypothesis confirmed: async embedding lag caught up.

### A3. AURI (endor-cli-tools) — correctly absent; SKILL.md drift flagged

- `claude mcp list` output does NOT include endor-cli-tools. Binary at `C:/Users/tenis/AppData/Roaming/npm/bin/endorctl.exe` exists (323MB, Apr 16 11:45), version v1.7.932, `--version` works without npm, `auth --print-access-token` returns "no credentials found" (matches F1 precondition Step 2).
- **New finding:** `.claude/skills/prebuild/SKILL.md` still lists AURI as required hard-gate tool. AURI formally disabled (removed from user-scope). Future `/prebuild` would either halt at Step 0 looking for missing MCP, or silently skip because current skill text assumes it's registered.
- **Severity:** Medium (doc drift).
- **Phase 0.26 action:** Update SKILL.md to reflect formally-disabled state + F1 reinstall pointer.

### A4. npm/nvm4w PATH — CONFIRMED BROKEN

- `node --version` → v20.10.0 ✓
- `npm --version` → `Error: Cannot find module 'C:\nvm4w\nodejs\node_modules\npm\bin\npm-cli.js'` — npm infrastructure broken
- `npx --version` → same module-not-found error (depends on npm)
- Three node installs on PATH: `C:\Users\tenis\AppData\Local\nvm`, `C:\nvm4w\nodejs`, `C:\Program Files\nodejs` — each listed twice
- `C:\nvm4w\nodejs\node_modules\` exists but `npm\bin\npm-cli.js` missing from expected location
- `node_modules/.bin/tsc` (project-local) exists — local project binaries still callable
- **Severity:** **High** (blocks normal git commits via pre-commit hook; blocks `npm install` / `npx` workflows).
- **Phase 0.26 + separate session action:** Backup-diagnose-fix-verify sequence per founder. Probable fix: either repair nvm4w install state (reinstall npm under nvm4w's node) or reorder PATH so `C:\Program Files\nodejs` wins.

### A5. Pre-commit hook — CONFIRMED worse than "not enforced"

- `.git/hooks/pre-commit` exists, executable POSIX shell script, 344 bytes
- Runs `npx tsc --noEmit` uniformly on every commit (not file-type aware)
- Because npx depends on npm which is broken, hook crashes at npx resolution
- Error message misleadingly attributes failure to "TypeScript errors" when root cause is npm infrastructure break
- **Severity:** **High** (any commit WITHOUT `--no-verify` currently fails with wrong diagnosis; unknown window of silently-not-enforced tsc).
- **Phase 0.26 fix:** Replace hook with file-type-aware version that (a) skips on markdown-only commits, (b) uses project-local `node_modules/.bin/tsc` directly instead of `npx tsc`, (c) reports root cause on failure.

### A6. MCP scope precedence — DOCUMENTED

Locations checked:
- `~/.claude.json` `.mcpServers` (user scope): only `codegraph` registered
- `~/.claude.json` `.projects.<cwd>.mcpServers` (project scope): empty `{}`
- `.vscode/mcp.json` (workspace): has `endor-cli-tools` — for VS Code's integrated Claude extension, NOT Claude Code CLI
- `.vscode/settings.json`: file does not exist
- `.claude/settings.json` and `settings.local.json`: permissions only, no MCP config

**Key insight:** Claude Code CLI reads ONLY from `~/.claude.json`. The AURI entry at `.vscode/mcp.json` does NOT affect Claude Code CLI sessions. F17 resolved — current state clean at Claude Code CLI level.

**Phase 0.26 action:** Update `specs/Pre-Build-Setup-Checklist.md` + SKILL.md Step 0 to document the multi-location sweep methodology.

### A8. "Looks Fine" pattern instances confirmed

- **Instance 1:** AURI Connected ≠ Functional (multiple sessions of confirmation).
- **Instance 2:** Pre-commit hook silent-error. Hook "exists" and "looks fine" but is actively broken via npm dependency. Would have kept failing with wrong diagnosis until investigated.
- **Add to LESSONS_LEARNED Quick Reference:** both instances in Phase 0.26.

---

## Scope 4 — 17 Followups Classification

Totals: 7 in Phase 0.26 + 1 partial + 2 defer-to-Phase-2 + 4 tech-debt + 1 intentional + 1 resolved + 1 closed + 2 NEW = accounted.

### Do in Phase 0.26 (doc-fix pass) — 7 items

- **F3** — Document `mgrep watch --max-file-count 3000` startup in `PRE_BUILD_PROCESS.md`. VS Code task already does it.
- **F4** — Document 1000-file mgrep default limit in `reference_mgrep.md` memory + PRE_BUILD_PROCESS.md.
- **F11** — Add `.mgrepignore` (tmp files + visual_schedule migrations + optional `public/**`). Frees ~500K token index space.
- **F14** — Founder files upstream GitHub issue on Mixedbread-Grep plugin describing all 4 Windows bugs.
- **F15** — Add repo token-size measurement to CLAUDE.md or new lightweight `REPO_STATS.md`. ~1.78M tokens in src/ alone.
- **F17** — Update `specs/Pre-Build-Setup-Checklist.md` methodology to check all VS Code MCP config locations. Extend SKILL.md Step 0.
- **NEW: SKILL.md AURI row** — update to reflect formally-disabled state (A3).

### Partial Phase 0.25 + founder-action (1)

- **F1** — AURI reinstall. Preconditions verified (A7). Actual reinstall requires founder keyboard (browser OAuth doesn't work in Claude Code subprocess).

### Defer to Phase 2 audit (2)

- **F2 (residual)** — SKILL.md has strong end-to-end probe design. Remaining: mgrep quota state, freshness heuristics, AURI scan probe (blocked on F1).
- **F9** — mgrep quota/credit state in Step 0. Bundles with F2.

### Tech debt register (4)

- **F5** — `gh auth login` (optional, no blocker).
- **F7** — codegraph native bindings vs WASM (functional, slower).
- **F12** — Duplicate `sittinglila.png` (1.12MB byte-identical). Repo bloat.
- **F16** — Disable Windows `python3` MS Store alias + `mkdir C:\tmp\`. Hygiene only.

### Intentional / no action (1)

- **F6** — Supabase CLI v2.84.2 → v2.90.0. Founder-deferred.

### Resolved this session (1)

- **F10** — mgrep wizards directory. See A2.

### Closed (1)

- **F13** — RESCINDED in April 16 sweep (env var wouldn't help since hook never runs on Windows — 4 Windows incompatibility bugs).

### NEW open findings (2)

- **SKILL.md AURI drift** — A3 (folded into Phase 0.26 fix list above).
- **Codegraph orphaned-lock regression** — A1 (requires root-cause investigation before fix).

---

## Scope 5 — Universal List Wizard State Check

### Commit state

- **Commit:** 21a47a1 `wip: Universal List Wizard scaffolding`, 2026-04-16 15:21, author Tenise (co-authored Claude).
- **Scope:** 1134-line component + 5 supporting components + 503-line E2E test file (7 passing tests) + 2 feature-decision doc files (+3907 insertions).
- **No follow-up commits.**
- **Status per gameplan line 24:** "committed at 21a47a1 but not yet founder-verified as serving intended use case." Canonical example of Phase 2 audit gap.

### 6-step wizard flow

| # | Step | Gate to advance |
|---|---|---|
| 1 | Purpose — 9 preset tiles + free-text with Haiku type detection | `selectedPresetKey || detectedListType` |
| 2 | Items — BulkAddWithAI textarea → Haiku parse with section/price/quantity | **`items.length > 0` (HARD GATE)** |
| 3 | Sharing — private / specific-pick / whole-family + "others can add" toggle | Always |
| 4 | Organize — editable sections with live preview | Always |
| 5 | Extras — preset-specific checkboxes + ConnectionOffersPanel | Always |
| 6 | Review — title + summary + WizardTagPicker | `items.length > 0` to finish |

On deploy: `lists` row + synchronous-loop `list_items` inserts + `list_shares` inserts + `activity_log_entries` row with event_type='wizard_deployed'.

### Intended use case (from design docs)

**Session addendum line 213:**
> "List with my husband of things we need to get done" → Shared To-Do list → Universal List Wizard → "Who shares this list?" step

**Session addendum line 37 (priority rationale):**
> List wizards moved from Tier 4 to Tier 1. Shared lists are an immediate need for the founder's family (house to-do lists, things to get done, shared lists with husband). Beta tester validation confirms this is a universal mom need.

**Session prompt this session:** "shared permanent shopping list with husband" — vocabulary drift (docs say "things to get done", session says "shopping list") but structurally identical use case: **ongoing, editable, shared-with-spouse list.**

### What wizard serves well

- List type detection from free text (Haiku).
- AI item parsing from brain dump.
- Member pill picker for husband selection at Step 3.
- `anyoneCanAdd` → `canEdit` mapping into `list_shares`.
- localStorage progress persistence.
- Activity logging with full metadata.

### Gaps vs. intended use case (flagged — NOT fixed)

**Gap A — Step 2 hard-blocks on items>0.** Mom cannot reach sharing step without entering at least one item. Her mental model ("set up the shared list, we'll fill it in over time") doesn't match the wizard's model ("dump items, then configure sharing"). Workaround (throwaway placeholder item) exists but clunky.

**Gap B — Default `sharingMode='private'`.** Shared-with-spouse requires 2 extra taps every invocation. Founder's canonical use case is "shared with husband by default." Possible fast-paths (not implemented): spouse-relationship detection + auto-preselect, localStorage remember-last-used per preset, or a dedicated "Shared with [Husband Name]" preset tile.

**Gap C — Husband-visibility post-deploy NOT founder-verified.** Wizard calls `shareList.mutateAsync({ listId, memberId: husbandId, canEdit })`. E2E tests pass 7 assertions but only cover mom-side programmatic inserts. **No test validates:**
- Husband's Lists page renders the shared list with correct ownership attribution.
- Husband can add items (if `anyoneCanAdd=true`).
- Husband's Dashboard surfaces the list (requires widget that may not exist yet).
- List appears in husband's search/filter/tag queries.

This is gameplan line 24's canonical "`tests pass` ≠ `serves need`" gap. The wizard's promise hinges on behaviors the test suite doesn't exercise.

**Gap D — "Permanent" semantics unexamined.** Wizard creates persistent `lists` row, but no copy tells mom "this stays forever; come back via /lists." Review step mentions "add more items anytime" but doesn't pointer to where the list lives. Mom may lose discovery after wizard closes.

**Gap E — Step 3 copy drift.** Session addendum Step 5 ("Who handles what?") describes per-item assignment including "hire someone", "together". That's the Maintenance Schedule Wizard — a different wizard. Universal List Wizard Step 3 does not offer per-item assignment. Not a wizard gap per se; mom might expect it based on the broader pattern.

**Gap F — Detector/preset mismatch path silently downgrades to custom.** If Haiku detector returns a `listType` not matching any preset `.key`, `matchedPreset` is null, `selectedPresetKey` stays null, `parseItems` falls back to custom `parsePrompt`. Worth a unit test on mismatch handling.

### Minor observations

- **F-Wiz-1** New `activity_log_entries.event_type = 'wizard_deployed'` value. Reasonable; add to conventions list in Phase 0.26.
- **F-Wiz-2** Wizard deploys sequentially (await inside for loop). 30-item shopping list = 30 round-trips. Performance concern at scale, not correctness.
- **F-Wiz-3** Connection offers saved to metadata but never actioned downstream. Matches register-and-inert principle (gameplan line 86-94) — audit trail exists for when connections come online.
- **F-Wiz-4** `useWizardProgress` is localStorage-only, not DB-backed. Fine for solo sessions; breaks if mom starts on phone and continues on tablet.

### Phase 0.5 input

Before calling the wizard sprint "paused," the next founder-driven test should be a **live multi-user exercise:** open wizard, set up shared shopping list with husband's account, have husband log in, verify he sees the list, both add items, watch for any gap. 20-minute ceremony resolves Gap C + any unknown-unknowns.

---

## Volatility Pattern For The Record

**Top-level pattern worth naming in bold:**

**Tool state and documentation state on this machine are more volatile than the April 16 sweep assumed.**

Three instances of documented convention vs. observed reality drift detected this phase:
1. **CURRENT_BUILD.md:** Convention says reset + clear; practice is ~15-20% compliance. Drift is structural.
2. **BUILD_STATUS.md:** Says "Last updated: 2026-04-06"; actually last updated 2026-04-13; missing 5 build completions.
3. **`is_privacy_filtered` convention #76:** Says enforcement "in the context assembly pipeline"; practice is 1 of 4 read sites.

Two "green in morning, broken by evening" tool instances this day alone:
1. **npm/nvm4w** — node works, npm/npx broken.
2. **codegraph MCP** — verified green at 12:27 afternoon, orphaned lock by 12:28:47 (likely session-end related), 7 hours stale by evening probe.

**Implication for Step 0 hard-gate cadence:**
- Step 0 is well-designed (end-to-end probes, not just "Connected" status).
- But Step 0 only runs at build-start. Multi-hour sessions can regress mid-build.
- **Consider:** Step 0.5 mid-build re-probe for long sessions, or pre-sign-off re-probe (gameplan item 7 — pre-sign-off verification re-run convention).
- **Consider:** Lower the cost of running Step 0 so it can run more often without friction.

**Implication for convention enforcement:**
- "Do X after every build" conventions without mechanical enforcement drift. CURRENT_BUILD.md is the worst case (~15-20% compliance); BUILD_STATUS.md (~60-70%); STUB_REGISTRY.md best (stub-by-stub accounting forces updates).
- **Consider:** Pre-commit hook / GitHub Action / formalized sign-off ceremony checklist with visible checkboxes as enforcement.
- **Consider:** Simplify the checklist itself — 7-item post-build list is a lot; which items actually matter?

---

## Phase 0.26 Candidate Fix List (consolidated)

### Doc-accuracy fixes
- [ ] Update BUILD_STATUS.md to reflect 5 missing completions + fix "Last updated" label.
- [ ] Resolve CURRENT_BUILD.md interpretation ambiguity in convention #14 + one-time cleanup of 11 un-cleared sections OR migrate to append-only archive.
- [ ] Formalize STUB_REGISTRY stub-type taxonomy ("committed deferred" vs. "speculative possibility").
- [ ] Update historical archive at bottom of CURRENT_BUILD.md to include Builds H, I, K, L, M, N, P, Phase 1b-F.

### Tool health fixes
- [ ] Replace pre-commit hook with file-type-aware version using project-local `node_modules/.bin/tsc`.
- [ ] Separate session: backup-diagnose-fix-verify sequence for npm/nvm4w PATH.
- [ ] Step 0 hard-gate enhancement: check orphaned `.codegraph/codegraph.db.lock/` + one-command cleanup.
- [ ] File upstream codegraph issue: PID-containing lock file + signal handler for graceful cleanup.
- [ ] Update `.claude/skills/prebuild/SKILL.md` AURI row to reflect formally-disabled state + F1 reinstall pointer.
- [ ] Update `specs/Pre-Build-Setup-Checklist.md` methodology: multi-location MCP config sweep, end-to-end probe requirement.
- [ ] 17-followup Phase 0.26 items (F3, F4, F11, F14, F15, F17).

### Safety / privacy fixes (some may block on PRD-40 / PRD-20 / PRD-30 builds)
- [ ] Add `.eq('is_privacy_filtered', false)` to `relationship-context.ts:281` and `:397`.
- [ ] Decide policy for `bookshelf-study-guide/index.ts:79` (mom-as-requester vs. target-member-as-requester).
- [ ] Add grep CI check for convention #76 compliance on `archive_context_items` reads.
- [ ] Add RLS-layer defense-in-depth for `is_privacy_filtered`.
- [ ] Add convention #N+1: pre-sign-off verification re-run (tsc -b + E2E suite with fresh timestamps).

### Larger builds (Gate-scale, not Phase 0.26)
- [ ] PRD-40 writing (Phase 0.35).
- [ ] PRD-20 frontend + access-gating tables build.
- [ ] PRD-30 detection pipeline build.
- [ ] COPPA infrastructure build (post-PRD-40).
- [ ] LiLa ethics auto-reject Edge Function level.
- [ ] RLS verification expansion for safety + child-data tables.

### Feature fixes (Phase 2 audit + Phase 4 wizard pass)
- [ ] Universal List Wizard Gap A (Step 2 items>0 hard-gate).
- [ ] Universal List Wizard Gap B (default sharing mode).
- [ ] Universal List Wizard Gap C (multi-user E2E test for husband-side visibility).
- [ ] Universal List Wizard Gap D (discovery pointer to /lists post-deploy).

---

*End Reconnaissance Report v1. Next action: founder review. Doc-reconciliation fixes land in Phase 0.26 after founder approves this report.*
