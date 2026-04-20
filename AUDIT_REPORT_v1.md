# AUDIT_REPORT_v1.md

> Phase 2 Architectural Audit — MyAIM Central family platform
> Audit window opened: 2026-04-18
> Coordinated via: [claude/web-sync/AUDIT_PARALLEL_PLAN.md](claude/web-sync/AUDIT_PARALLEL_PLAN.md)
> Gameplan: [MYAIM_GAMEPLAN_v2.2.md](MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 284-351)
> Status: **Stage A closed; Stage B Scope 8a COMPLETE — all 5 rounds closed, 8 findings emitted (F1–F8), 5 Beta Readiness blockers open pending Phase 3 triage; Stage C (Scope 2/3/8b/4) pending**

---

## 0 — Methodology and tool health at audit time

### Stage execution order (approved 2026-04-18)

**Stage A — Groundwork** (serial; AURI kicks off as shell background job after first-call OAuth)
1. Scope 1 pre-flight — `tsc -b`, `npm run lint`, tool-health re-verification, mgrep spot-check
2. AURI retroactive scan kicks off as long-running background job (priority PRD-01, PRD-02, PRD-05, Edge Functions)
3. Scope 5 — Stub registry reconciliation

**Stage B — Beta Readiness infrastructure** (binary checks)
4. Scope 8a — binary compliance/safety checklist

**Stage C — Main body** (integration tracing)
5. Scope 2 — PRD-to-code alignment (batched Foundation → LiLa → Personal Growth → Tasks/Studio → Dashboards/Calendar → Communication → Vault/BookShelf → Gamification → Compliance)
6. Scope 3 + Scope 8b — merged integration traversal; findings tagged `SCOPE-3` or `SCOPE-8b` at emission time
7. Scope 4 — Cost optimization P1–P9

**Stage D — Reporting and measurement**
8. Scope 6 — LiLa content discrepancy (reporting-only; feeds `LILA_KNOWLEDGE_BACKLOG.md`)
9. Scope 7 — Performance baseline (feeds `PERFORMANCE_BASELINE.md`)

### Finding schema

```
### [SCOPE-N.FN] Short title
- Severity: Blocking | High | Medium | Low
- Location: file:line or PRD/addendum reference
- Description: What the code does vs what the PRD/spec says vs what STUB_REGISTRY/WIRING_STATUS claims
- Evidence: specific quote, grep hit, or query result
- Proposed resolution: Fix Now | Fix Next Build | Tech Debt | Intentional-Update-Doc | Defer-to-Gate-4
- Founder decision required: Y/N
- Wizard Design Impact: (populated only when relevant)
- Beta Readiness flag: Y/N
```

### Non-concurrent zones (will not touch during this window)

- [claude/feature-decisions/Universal-Setup-Wizards.md](claude/feature-decisions/Universal-Setup-Wizards.md)
- [claude/feature-decisions/Universal-Setup-Wizards-Session-Addendum.md](claude/feature-decisions/Universal-Setup-Wizards-Session-Addendum.md)
- `claude/feature-decisions/Universal-Setup-Wizards-User-Flows.md` (Claude.ai drafting)
- [src/components/studio/wizards/](src/components/studio/wizards/) — read-only for audit reference; no code changes

### Tool health at audit start (2026-04-18)

| Tool | State | Notes |
|---|---|---|
| `tsc -b` | Clean (exit 0) | No TypeScript errors |
| `npm run lint` | Clean (exit 0, 72 warnings) | All 72 warnings are `react-hooks/exhaustive-deps`; conventions.md sets this rule to warn-level intentionally |
| `./node_modules/.bin/tsc` | Present | Hygiene check passed (see CLAUDE.md silent-failure pattern #4) |
| codegraph MCP | ✓ Connected; green | Re-indexed 2026-04-16 per TOOL_HEALTH_REPORT |
| mgrep CLI | **Degraded 2026-04-18** | Was Scale tier; hit spend limit mid-Stage-A ($36.54 in 36 hours, projecting $300+/month). Downgraded to free tier same day. Convention 242 inverted: mgrep demoted from "required default" to "per-query-approved escape hatch." Wizards spot-check per TOOL_HEALTH F10 **passed before the downgrade** — MeetingSetupWizard returned 99%+ matches at expected paths; index was fresh when probed. Ongoing: Grep/Glob are now the primary search tools for the rest of the audit. |
| endor-cli-tools MCP (AURI) | ✓ Connected; OAuth complete; MCP `scan` tool producing findings as of 2026-04-18 | First-call browser OAuth completed this session. Smoke test returned real vulnerability data. CLI `endorctl scan` with `-o summary` and `-o table-verbose` both produced 29-byte `INFO: Linter scans complete` logs (output format not the cause). MCP `scan` tool with scoped `include_path` returned 6 findings across PRD-01/02/05 + Edge Functions — all false positives (see SCOPE-1.F5 + SCOPE-1.F6). Working path for future AURI use: MCP `scan` tool, not CLI. |
| Supabase CLI | Green (cloud mode) | Per TOOL_HEALTH_REPORT |
| Vercel CLI | Green (`lilacrew`) | Per TOOL_HEALTH_REPORT |

---

## 1 — Scope 1: Code quality

### [SCOPE-1.F1] TOOL_HEALTH_REPORT_2026-04-16 F1 AURI recipe is wrong for Developer Edition

- **Severity:** Medium (documentation defect — misleads future reinstall attempts)
- **Location:** [TOOL_HEALTH_REPORT_2026-04-16.md](TOOL_HEALTH_REPORT_2026-04-16.md) F1 "Reinstall recipe" (line 324 area); [claude/LESSONS_LEARNED.md](claude/LESSONS_LEARNED.md) (pending entry)
- **Description:** F1's recipe directs `endorctl init` as step 1. Research in a parallel Claude.ai session (2026-04-18) confirmed `endorctl init` routes to the Enterprise Edition flow — it prompts for a tenant namespace which this project does not have and does not want. Developer Edition (the correct target for solo use, free, local-only scanning) uses a different flow: no `endorctl init`, no tenant, no namespace. First-call browser OAuth is handled by the MCP server itself on first tool invocation inside Claude Code.
- **Evidence:** (1) Tenise's prior `endorctl init` attempt was aborted at the tenant namespace prompt. (2) Endor's official Claude Code MCP setup doc (https://docs.endorlabs.com/setup-deployment/mcp/claude-code) documents the Developer Edition flow without `endorctl init`. (3) `.endorctl\config.yaml` verified absent in `USERPROFILE` — aborted init did not write partial auth state.
- **Proposed resolution:** **Intentional-Update-Doc.** Rewrite TOOL_HEALTH_REPORT_2026-04-16.md F1 with the corrected Developer Edition recipe (register MCP at user scope with full binary path → first-call OAuth in new session). Add a matching entry to `claude/LESSONS_LEARNED.md` under the existing "documented tool recipes that turned out to be wrong" theme (alongside the Go-npm shim issue and the mgrep token issue).
- **Founder decision required:** N (already founder-driven correction)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** N

### [SCOPE-1.F2] tsc -b and npm run lint baseline at audit start

- **Severity:** Low (informational baseline)
- **Location:** Whole repo
- **Description:** `tsc -b` exits 0 with no errors. `npm run lint` exits 0 with 72 warnings, all `react-hooks/exhaustive-deps`. Per `claude/conventions.md`, the ESLint config is an allow-list and exhaustive-deps is intentionally warn-level (too many false positives to make it an error). No lint errors. No hard block on audit or future builds.
- **Evidence:** Background Bash tasks `bzoxqywpi` (tsc) and `bjp2t50bz` (lint) both exited 0. Representative warning locations: `Studio.tsx:458`, `Tasks.tsx:175,522`, `MemberArchiveDetail.tsx:513,716,717`.
- **Proposed resolution:** **Informational.** The 72 exhaustive-deps warnings are candidates for tech-debt review if the project later decides to tighten the rule to error-level. Not itself a finding requiring action.
- **Founder decision required:** N
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** N

### [SCOPE-1.F3] AURI retroactive scan blocked on first-call OAuth in fresh session — RESOLVED 2026-04-18

- **Severity:** High (Scope 1 sub-check explicitly required by gameplan line 298)
- **Location:** Whole repo; priority PRD-01 (Auth) / PRD-02 (Permissions) / PRD-05 (LiLa system prompts + ethics) / Edge Functions with AI calls or user data
- **Description:** Gameplan Scope 1 requires an AURI retroactive scan to surface security issues not caught during original build (AURI was non-functional from install through 2026-04-16). AURI was re-registered at user scope on 2026-04-18 via the corrected Developer Edition recipe. The MCP server reports `✓ Connected` in `claude mcp list`, but the prior session's tool surface did not expose `mcp__endor-cli-tools__*` tools (canonical "Connected ≠ Functional" pattern). Fresh session required to rebuild the surface.
- **Evidence:** `ToolSearch` returned "No matching deferred tools found" for three separate query forms against the endor namespace in the prior session. `claude mcp list` confirmed connection at user scope. `~/.claude.json` top-level `mcpServers` contained the correct shape.
- **Resolution:** **CLOSED 2026-04-18.** Fresh session picked up the user-scope registration correctly. First-call browser OAuth completed (Endor Labs "Authentication Successful" screen returned). Smoke test via `mcp__endor-cli-tools__check_dependency_for_vulnerabilities` against `lodash@4.17.20` returned real vulnerability data (5 GHSA IDs, `is_vulnerable: true`, `vulnerability_count: 5`, `latest_version: 4.18.1`). Retroactive scan launched as background shell job (`endorctl scan --path . --quick-scan --dependencies --secrets --local --ai-models --languages typescript,javascript`); exit 0 but empty findings output — new finding SCOPE-1.F5 opened to handle the empty-output question.
- **Founder decision required:** N (resolved)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** Moved to SCOPE-1.F5 — AURI scan itself ran, but whether its findings populate `COMPLIANCE_READINESS_REPORT.md` depends on the empty-output resolution.

### [SCOPE-1.F4] Convention 242 inverted mid-audit: mgrep-primary to grep-primary

- **Severity:** Medium (convention change, not a code defect; touches CLAUDE.md, PRE_BUILD_PROCESS.md, prebuild skill, memory files)
- **Location:** `CLAUDE.md` Convention 241 + 242; `claude/PRE_BUILD_PROCESS.md` "Prerequisites" section; `.claude/skills/prebuild/SKILL.md` Step 0 required-tools table + execution steps + fix table; memory: `feedback_use_mgrep.md`, `reference_mgrep.md`, `MEMORY.md` index
- **Description:** Convention 242 was written 2026-04-16 mandating `mgrep` as the primary search tool with Grep/Glob prohibited for cross-cutting lookups. The assumption was that mgrep on Scale tier ($20/mo + $20 credits + $5 cap) was cheap enough to be the default. Real cost data after 36 hours of Phase 2 audit use: **$36.54 spend, projecting $300+/month** for solo-founder workload. mgrep hit the spend limit mid-Stage-A (the BookBorrow line 398 Backburner/Ideas auto-provision verification query surfaced the block). Convention inverted 2026-04-18: Grep and Glob become the primary search tools; mgrep is reserved for semantic queries that literal matching cannot answer, requiring per-query founder approval. mgrep simultaneously downgraded from Scale tier to free tier and demoted from "required tool-health gate" to "optional." Convention will be re-evaluated post-audit based on how often semantic capability was genuinely needed.
- **Evidence:** (1) Spend limit error returned by `mgrep search` during Scope 5 verification in this session. (2) Founder-provided cost data: $36.54 / 36 hours on Scale tier. (3) Pre-existing mgrep watch startup in PRE_BUILD_PROCESS.md and hard-gate in prebuild SKILL.md Step 0 confirming the "required default" stance before inversion.
- **Known friction:** The `mgrep:mgrep` Claude Code plugin skill still advertises itself as `MANDATORY: Replaces ALL built-in search tools. You MUST invoke this skill BEFORE using WebSearch, Grep, or Glob.` This is baked into the plugin manifest and cannot be rewritten from the project. CLAUDE.md Convention 242 is authoritative and overrides the skill description. A plugin update or removal is the only durable fix; Tenise's call whether to pursue it.
- **Proposed resolution:** **Intentional-Update-Doc.** Landing in commit `chore(conventions): invert Convention 241 mgrep-primary → grep-primary after Scale-tier cost evaluation` (scoped to convention/doc changes only). Lessons-learned pattern added: `claude/LESSONS_LEARNED.md` → "Convention Cost Evaluation." Post-audit review will decide whether mgrep stays (at some tier) or gets cancelled entirely.
- **Founder decision required:** N (founder-directed change — resolution is already in progress)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** N

### [SCOPE-1.F5] AURI retroactive scan — RESOLVED 2026-04-18

- **Severity:** High (Scope 1 sub-check per gameplan line 298 — scan must produce usable findings)
- **Location:** Priority scope: PRD-01 (`src/pages/auth/**`), PRD-02 (`src/lib/permissions/**`), PRD-05 (Edge Functions with AI calls via `supabase/functions/**`), PRD-04 shells (`src/components/shells/**`), auth hooks (`src/hooks/useAuth.ts`)
- **Description:** Gameplan Scope 1 requires AURI to scan retroactively for security issues not caught during original builds. Three runs were executed this session:
  1. **Scan 1 (CLI, 2026-04-18):** `endorctl scan --path . --quick-scan --dependencies --secrets --local --ai-models -o summary --sarif-file ...`. Exit 0; log output 29 bytes (`INFO: Linter scans complete`); no SARIF produced. **Result: no findings surfaced via CLI.**
  2. **Scan 2 (CLI re-run, 2026-04-18):** Same command with `-o table-verbose` instead of `-o summary` (output-format hypothesis test). Identical 29-byte log, no SARIF. **Output format hypothesis ruled out.**
  3. **Scan 3 (MCP scan tool, 2026-04-18):** `mcp__endor-cli-tools__scan` with `include_path` scoped to `src/pages/auth/**`, `src/lib/permissions/**`, `src/hooks/useAuth.ts`, `src/components/shells/**`, `supabase/functions/**`. **Result: 6 findings returned across 9 line locations, all "Potential secret leak / Generic API Key" MEDIUM severity.** On inspection, all 6 are false positives (see SCOPE-1.F6).
- **Evidence:** Scan 1 + Scan 2 logs at `audit-logs/auri-retro-scan.log` + `audit-logs/auri-retro-rerun.log` (both 29 bytes). Scan 3 full finding payload preserved in Appendix A.
- **Resolution:** **CLOSED.** AURI retroactive sweep IS supported via MCP `scan` tool in Developer Edition with scoped `include_path`. CLI with repo-wide scope produces no output (possible Developer Edition CLI limitation or findings routed to Endor web dashboard — not investigated further since MCP path works). Findings from Scan 3 appended to Appendix A. Working protocol for future Scope 2/3 integration-audit AURI checks: use MCP `scan` with targeted `include_path` globs (each glob must match at least one file, or the tool errors with a "does not match" message).
- **Founder decision required:** N (resolved)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** N — superseded by SCOPE-1.F6 for the false-positive follow-up

### [SCOPE-1.F6] AURI Generic API Key regex false-positive on feature-key identifiers

- **Severity:** Low (6 false-positive findings — no actual secrets leaked; AURI tooling noise, not a code defect)
- **Location:** 9 code locations matched by AURI's "Secrets without validation rules" policy:
  - `supabase/functions/mindsweep-sort/index.ts` L349 + L619 — `featureKey: 'mindsweep_sort'` in `logAICost()` calls
  - `supabase/functions/whisper-transcribe/index.ts` L75 — `featureKey: 'whisper_transcribe'` in `logAICost()`
  - `supabase/functions/spelling-coach/index.ts` L154 — `featureKey: 'spelling_coach'` in `logAICost()`
  - `src/hooks/useTasks.ts` L636 — `key: 'uncategorized'` (section key literal in prioritization view)
  - `src/components/shells/BottomNav.tsx` L32 — `featureKey: 'vault_browse'` on nav item
  - `src/components/shells/Sidebar.tsx` L95, L117, L134 — `featureKey: 'vault_browse'` / `'vault_consume'` on nav items
- **Description:** AURI's `generic-api-key` secret-detection rule (policy UUID `65b2e05de574b379df5bd5a0`, "Secrets without validation rules") matched six distinct short identifier strings as potential Generic API Keys. Inspection of each location shows every match is a legitimate `featureKey` / `key` string literal used as an identifier, not a secret. Every matched value is either (a) a registered entry in the `feature_key_registry` table per PRD-31, (b) a UI section key, or (c) a constant used by the platform's permission gate infrastructure. None are API keys, tokens, or credentials. AURI correctly marks all six `VALIDATION_STATUS_UNSPECIFIED` — the tool didn't attempt live validation, and the secret-detection heuristic over-matches by design (bias toward false positives to catch real leaks).
- **Evidence:** Direct code inspection of each of the 9 lines (see Appendix A for per-location snippets). All are short snake_case identifiers matching the AURI Generic API Key regex purely on string shape, not content.
- **Proposed resolution:** **Intentional-Update-Doc + minor cleanup.** Options for suppressing the false positives in future scans (pick during Phase 3 triage, NOT this audit):
  - (a) Add `// endorctl:allow` comment above each flagged line (Endor's recommended suppression — explicit, ugly, tracks with code)
  - (b) Create `.endorctl.yml` policy config excluding the `generic-api-key` rule for files matching `*featureKey*` patterns (invasive, risks hiding real leaks)
  - (c) Accept the 6 false positives as baseline noise and document them so future AURI scans compare against this baseline — any new finding is genuinely new
  - (d) Do nothing — each future scan surfaces the same 6, audit reports note them as "known false positives" per this finding
  - **Recommended:** (c) for audit hygiene. Add a `# AURI Baseline` section to `AUDIT_REPORT_v1.md` or a separate `AURI_BASELINE.md` listing these 6 finding signatures so new future-run deltas are obvious.
- **Founder decision required:** N (informational finding — remediation choice is Phase 3)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** N — no real security issue. The finding data itself (6 false positives on ~2000 lines of scanned code) is actually evidence of clean auth/permissions/edge-function code at the scanned depth.

---

## 5 — Scope 5: Stub registry reconciliation

Status: **IN PROGRESS** (1 finding logged; full line-by-line reconciliation continues).

**Read in full 2026-04-18:** `STUB_REGISTRY.md` (547 lines, ~224 entries; summary counts: ~92 Wired, ~3 Partially Wired, ~42 Unwired-MVP, ~84 Post-MVP, ~3 Superseded). Full content ingested for cross-check against WIRING_STATUS.md (CLAUDE.md-embedded) and against code/migration reality.

### [SCOPE-5.F1] STUB_REGISTRY line 398 stale: Backburner/Ideas auto-provision is wired

- **Severity:** Low (documentation staleness, no code defect)
- **Location:** `STUB_REGISTRY.md` line 398: `System list auto-provision (Backburner, Ideas) | PRD-09B | — | ⏳ Unwired (MVP) | Phase 10+`
- **Description:** STUB_REGISTRY.md claims Backburner/Ideas system lists are an unwired MVP stub. Migration-level verification disproves this claim. The `auto_provision_member_resources` trigger has been creating these lists on every `family_members` insert since migration `00000000100101_claim_expiration_cron_and_list_provision.sql` (comment "Fix 2: Auto-provision Backburner & Ideas lists for new members"). The same migration contains a backfill `INSERT INTO public.lists ... FROM public.family_members ... WHERE NOT EXISTS ...` for existing eligible members. Every subsequent migration that re-declares the trigger body (100103, 100104, 100106, 100110, 100111, 100112, 100114, 100115 — 8 revisions) preserves the Backburner/Ideas branch verbatim. The latest version in migration 100115 lines 1412-1435 is identical to the 100101 original. **WIRING_STATUS.md is authoritative on this capability; STUB_REGISTRY.md line 398 needs to flip to ✅ Wired with the 100101 date.**
- **Evidence:**
  - Grep on `supabase/migrations/` returned 11 migrations touching `auto_provision_member_resources`.
  - Migration `00000000100101_claim_expiration_cron_and_list_provision.sql` lines 61-115 define the trigger with `-- 3. Create Backburner & Ideas lists for non-Guided/Play members` branch inserting `('Backburner', 'backburner')` and `('Ideas', 'ideas')` idempotently.
  - Migration `00000000100115_play_dashboard_sticker_book.sql` lines 1412-1435 (latest revision) contains the same branch verbatim, marked `-- EXISTING BRANCHES (preserved verbatim from live production)`.
  - `live_schema.md` shows 42 `lists` rows including `list_type` column supporting `backburner` and `ideas` values.
  - WIRING_STATUS.md "System Lists (auto-created per member)" section already lists both as `Auto-Created: Yes` / Status `Wired`.
- **Proposed resolution:** **Intentional-Update-Doc.** Flip STUB_REGISTRY.md line 398 to `✅ Wired | 2026-??-?? (migration 100101)`. CLAUDE.md Convention 19 is technically under-specified too (mentions "archive folder + dashboard_config" but not Backburner/Ideas + the rhythm_configs seed that also ride this trigger) — worth updating in the same pass to accurately describe everything the trigger does. Defer to Phase 3 triage with other `Intentional-Update-Doc` findings; not urgent.
- **Founder decision required:** N
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** N

### [SCOPE-5.F2] live_schema.md missing widget_starter_configs table (surfaced during pilot)

- **Severity:** Medium (schema doc drift — reduces `live_schema.md`'s authority as a reference during evidence-collection work; not a code defect)
- **Location:** `claude/live_schema.md` widget section — should list `widget_starter_configs`; does not.
- **Description:** The Scope 5 pilot's second packet (Schema partition, entry 413 "Widget starter configs (10 seeds)") revealed that `widget_starter_configs` — a DB table created and seeded by migration `00000000100032_seed_widget_starter_configs.sql` with exactly 10 INSERTs, with additional Phase B2 + hub-widget seeds in migrations 100056 and 100063, and queried live by `useWidgetStarterConfigs()` in `src/hooks/useWidgets.ts:115-123`, consumed by Studio, Dashboard, WidgetPicker, and WidgetConfiguration — is NOT listed in `claude/live_schema.md`. The closest entry is `widget_templates` (listed with 0 rows, no application-layer consumer found in pilot greps).
- **Evidence:** Grep `widget_starter_configs` in `supabase/migrations/` → 3 hits (100032 + 100056 + 100063). Grep `widget_starter_configs` in `src/` → ≥4 hits (hook definition + 3 consumers). Grep `widget_starter_configs` in `claude/live_schema.md` → 0 hits. Migration 100032 touching commit `051ac23` (2026-03-25) "Seed 10 widget starter configs for Studio Trackers & Widgets category" — predates the last `npm run schema:dump` run by several weeks.
- **Three possible causes:** (a) `scripts/full-schema-dump.cjs` missed the table because it uses PostgREST OpenAPI introspection and `widget_starter_configs` isn't in the API schema grant (matches CLAUDE.md Convention 244's note about API-exposed tables); (b) the dump script has a bug that silently skipped this table; (c) `live_schema.md` is simply stale relative to production and `npm run schema:dump` hasn't been run since the migration landed.
- **Proposed resolution:** **Intentional-Update-Doc.** Next `npm run schema:dump` run with verbose output should identify why `widget_starter_configs` is missing. If the dump is correctly scoped to API-exposed tables, amend `live_schema.md` header to explicitly enumerate the API-schema-only-vs-full limitation AND cross-reference migration-only tables in a supplementary section. If the dump has a bug, fix `scripts/full-schema-dump.cjs`. Defer fix to Phase 3 doc-hygiene pass; for Scope 5 evidence collection, sub-agents should treat `live_schema.md` as an advisory reference and grep migrations for schema ground truth.
- **Related pilot-discovery:** Partition-file rationale column was wrong in 2 of 5 sampled entries (413 guessed `widget_templates` instead of `widget_starter_configs`; 417 guessed `coloring_image_library` rather than the live `coloring_reveal_library`). Rationale column will be stripped from all 4 partition files before overnight dispatch per separate action item. Not a separate finding — it's the same category of doc drift as F2 but in a different doc.
- **Founder decision required:** N
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** N

### [SCOPE-5.F3] Partition-size estimates in operation plan drifted by order of magnitude from actual partition contents

- **Severity:** Low (process/documentation drift — no impact on evidence integrity)
- **Location:** `claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md` §3 (Partition assignments table) vs. the actual `scope-5-evidence/stub_partition_*.md` files produced later.
- **Description:** The operation plan's partition-assignment table estimated entry counts per partition as Schema remainder ~43, Edge Functions ~9, UI ~120, Crosscutting ~55 — total ~227, close to the registry's 224 post-pilot count. In execution, actual partition sizes were Schema 43 (match), Edge Functions 8 (near-match, off by one), Crosscutting 154 (plan estimate was 35% of actual — off by 2.8×), and UI likely ~11 (plan estimate was >10× actual — off by an order of magnitude in the opposite direction). Total partition counts add up correctly in aggregate; it's the per-partition split that drifted between plan-write time and partition-file-write time.
- **Evidence:**
  - Plan §3 row "Session 4 | Crosscutting | 55 | …" verified at dispatch by reading the plan file.
  - Actual Crosscutting count verified 2026-04-19 post-partition-complete: Session 4 processed 155 table rows (1 calibration + 154 batch entries); `grep -cE '^\| *[0-9]+ *\|'` under `## Entries (to-be-processed)` in `stub_partition_crosscutting.md` returns 155.
  - Session 4 briefly suspected fabrication or cross-partition contamination when the "~55" plan estimate collided with the 154-row partition table; the suspicion was cleared by reading the partition file directly and dispatching sub-agents against the actual table.
- **Root cause:** Partition estimates in the plan were generated by domain intuition at plan-write time, before the partition files were produced. When the partition files were later split with different groupings than the intuition assumed, the plan was not updated to reflect the partition-file ground truth. No `wc -l`-style validation was run against the partition files before kickoff prompts were written.
- **Impact during this operation:** None. Recipe and evidence integrity held throughout; Session 4 processed all 154 assigned entries and the calibration correctly, with the expected CAPABILITY-ONLY rate (~47%, within the 30–50% band the partition file predicted). No fabrication, no cross-partition contamination. Cost was briefly elevated founder suspicion during verification.
- **Proposed resolution:** **Intentional-Update-Doc** + process guardrail. For any future multi-partition operation: (a) partition files are the authoritative source for size estimates, not intuition; (b) partition-file row counts must be validated against the plan's size table via `wc -l` / `grep -c` before kickoff prompts are written; (c) if counts diverge, update the plan (not the partition file) and commit the update in the same change as kickoff-prompt generation. Recommend adding a single-line check to `SCOPE_5_STUB_RECONCILIATION.md` §3 pre-dispatch, or codifying it as a convention under "Multi-session operation hygiene" for future scopes.
- **Classification:** Process finding, not a recipe failure.
- **Founder decision required:** N
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** N

### Remaining Scope 5 work

Full line-by-line reconciliation of the remaining 223 entries (minus the 5 processed in pilot = 218 to go) against code reality. Approach: four parallel sessions per the operation plan at `claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md`. Each session produces evidence packets per `scope-5-evidence/EVIDENCE_RECIPE.md`. Morning synthesis merges evidence into a reconciliation draft for founder review. Entries that contradict the registry's claimed status become SCOPE-5.F{N} findings following the same template as F1 and F2.

### [SCOPE-5.F4] Scope 5 walk-through summary — 12 registry flips, 7 merges, 1 split, 3 hygiene adds, 1 commit applied

- **Severity:** Medium (documentation truth — the registry now tells the truth)
- **Location:** STUB_REGISTRY.md (applied in this commit); WALKTHROUGH_DECISIONS.md (authoritative per-entry detail preserved in scope-5-evidence/)
- **Description:** The Scope 5 stub registry reconciliation walk-through completed 2026-04-20 across 5 rounds against the 224 registry entries. The synthesis pass identified 11 aggregate findings, 17 contradictions, 45 ambiguous entries, and ~160 confirmed-accurate entries. Founder walk-through resolved every entry into one of: registry flip, registry hygiene (merge / count-drop / note-update / row-split / glossary-add / header-note-add), or batch approval. Cross-cutting patterns identified:
    - PRD-28B compliance infrastructure absence (Finding A): 5 rows prematurely marked Wired against an unbuilt 6-table schema. All flipped to Unwired.
    - Automatic Intelligent Routing unbuilt (Finding B): 3 of 3 designed AIR sources (task completions, intention iterations, widget milestones) lack writer code. List-completion auto-victory is a separate pattern, not AIR. All AIR-source rows flipped to Unwired.
    - Looks-Fine-Failure bidirectional (Finding C + Round 4 Line 321): 2 rows registry-says-Wired-but-code-is-stub (165 MindSweep email, 117 task AIR); 2 rows registry-says-stub-but-code-is-functional (323 GuidedVictories, 321 Celebrate section). Flipped to truth in both directions.
    - Build M silent delivery (Finding F) + Vault delivery methods silent delivery (Finding G): 4 rows understated — Build M and Phase 25 AIVault work was not captured in the registry. Flipped to ✅ Wired.
    - PRD-12B attribution gap (Finding J): 2 rows attributed to an unbuilt PRD. Flipped to Unwired per founder rule "if it doesn't work in the app, it is not wired."
    - Duplicate registry rows (Finding D): 7 pairs merged.
    - Stale parenthetical counts (Finding E): 5 count-drops applied.
    - Misleading UI surfaces: identified at multiple sites — Studio shelf tiles (line 390), Widget starter configs (413), WidgetPicker color_reveal and gameboard (414), LiLa Optimizer mode (50), GamificationSettingsModal Tracker Goal option (266). Notes added per the "misleading-UI rule" (WALKTHROUGH_DECISIONS.md Recording Rules section).
- **Evidence:** 407 evidence packets produced across 4 partition sessions (Schema 48, Edge Functions 9, UI 195, Cross-cutting 155); preserved in scope-5-evidence/STUB_REGISTRY_EVIDENCE_*.md. Synthesis reconciliation draft at scope-5-evidence/STUB_REGISTRY_RECONCILIATION_DRAFT.md. Founder walk-through decisions at scope-5-evidence/WALKTHROUGH_DECISIONS.md. Parallel inventories produced: scope-5-evidence/STUDIO_TEMPLATE_INVENTORY.md + PHASE_B_TRACKER_INVENTORY.md (feed future Universal Setup Wizards workstream).
- **Proposed resolution:** **Applied** in this commit. Post-audit follow-ups:
    - Studio shelf broken click-flows — remediation via Universal Setup Wizards workstream (non-concurrent during audit; picks up post-audit)
    - WidgetPicker color_reveal/gameboard misleading UI — remove from picker OR bridge to Build M widget; Tenise to choose post-audit
    - AIR writer build — build task / intention / widget-milestone auto-victory writers per the architectural doc
    - PRD-28B build — full 6-table schema + UI surfaces
    - PRD-12B build — full Family Vision Quest schema + UI surfaces
    - live_schema.md drift (SCOPE-5.F2) — addressed by separate schema-dump expansion commit (parallel workstream)
- **Founder decision required:** N (walk-through completed; decisions recorded)
- **Wizard Design Impact:** Y — STUDIO_TEMPLATE_INVENTORY.md + PHASE_B_TRACKER_INVENTORY.md become agenda material for Universal Setup Wizards design sessions
- **Beta Readiness flag:** N (registry now matches code reality; no new blockers introduced by this finding)

## 8a — Scope 8a: Binary compliance/safety checklist

**Status:** COMPLETE — All 5 rounds closed. 8 findings emitted (F1–F8). 5 Beta Readiness blockers open: F1, F2, F3, F5, F6. Non-Beta: F4, F7, F8.
**Checklist inventory:** [scope-8a-evidence/CHECKLIST_INVENTORY.md](scope-8a-evidence/CHECKLIST_INVENTORY.md) (40 binary items across 5 buckets).
**Decisions log:** [scope-8a-evidence/CHECKLIST_DECISIONS.md](scope-8a-evidence/CHECKLIST_DECISIONS.md) (append-only; founder adjudication captured).

### Round 1 — Bucket 1: PRD-40 COPPA compliance (items 8a-CL-01 through 8a-CL-16)

Evidence pass executed 2026-04-20. Worker report at [scope-8a-evidence/EVIDENCE_PRD40_COPPA.md](scope-8a-evidence/EVIDENCE_PRD40_COPPA.md) (local commit `203878a`). All 16 items FAIL with high confidence. Consolidated into a single finding rather than 16 individual findings to reduce noise; individual item verdicts preserved in the decisions log.

#### [SCOPE-8a.F1] PRD-40 COPPA compliance infrastructure entirely unbuilt

- **Severity:** Blocking
- **Location:** `prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md` (Status: Not Started); no migration, no `src/` component, no Edge Function, no hook implements any COPPA infrastructure
- **Description:** Scope 8a Bucket 1 evidence pass ([scope-8a-evidence/EVIDENCE_PRD40_COPPA.md](scope-8a-evidence/EVIDENCE_PRD40_COPPA.md), commit `203878a` local) verified all 16 COPPA checklist items (`8a-CL-01` through `8a-CL-16`) as FAIL with high confidence. The four PRD-40 tables (`parent_verifications`, `coppa_consents`, `coppa_consent_templates`, `parent_verification_attempts`) do not exist. The two `family_members` column additions (`coppa_age_bracket`, `is_suspended_for_deletion`) are absent. No consent UX, no `useCoppaConsent` hook, no RLS gate on child-data tables references COPPA consent, no scheduled deletion job, no turns-13 transition trigger. The first-under-13-child trigger specified in PRD-40 §Incoming Flows L710 is not implemented: `FamilySetup.tsx:276` commits under-13 `family_members` rows directly with zero consent precondition. Under current code, a family can be created containing an under-13 child with no COPPA consent record, no parental verification, no audit trail.
- **Evidence:** [scope-8a-evidence/EVIDENCE_PRD40_COPPA.md](scope-8a-evidence/EVIDENCE_PRD40_COPPA.md) — per-item grep/glob queries returned zero hits across migrations, `src/`, and `supabase/functions/`; [FamilySetup.tsx:276](src/pages/FamilySetup.tsx#L276) save-action anchor directly confirms CL-10 and CL-15. Supplementary blanket scan confirmed zero `coppa` mentions anywhere in the codebase.
- **Prerequisite gaps surfaced (block PRD-40 even if it were started):**
  - **Stripe webhook Edge Function does not exist.** CL-14 (COPPA branch in webhook handler) fails because the prerequisite handler has never been built. Primary ownership: Scope 2 / Scope 3 (PRD-31 audit, Stage C).
  - **No admin console pages exist in `src/pages/`.** CL-13 (admin verification log Screen 10) is a compound gap — PRD-32 Admin Console is unbuilt. Primary ownership: Scope 2 (PRD-32 audit, Stage C).
- **Remediation intelligence:** `account_deletions` table (PRD-22 migration `100027`) exists with deletion function + RLS. Not currently COPPA-wired but available as revocation cascade leverage when PRD-40 is built.
- **Proposed resolution:** **Fix Now** — blocks Beta Readiness Gate by definition (this scope IS the beta compliance gate per gameplan line 513). COPPA is a hard legal precondition for under-13 beta user exposure. Scope of Fix Now is the full PRD-40 build (4 tables, column additions, 10 screens, Stripe webhook Edge Function, scheduled deletion job, transition trigger, RLS updates, PRD-01 retrofit), plus the two prerequisite builds (Stripe webhook handler owned by PRD-31; admin console shell owned by PRD-32). Legal disclosure copy requires attorney review before beta user exposure — flagged separately for human-lawyer attention per PRD-40 `[LAWYER REVIEW REQUIRED]` markers.
- **Founder decision required:** Y (scope of remediation; ordering of dependency builds; whether admin console shell is built concurrently with PRD-40 or staged separately)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** Y — **primary Beta Readiness blocker for Scope 8a.** No under-13 beta user exposure is permissible until F1 is resolved.

### Round 2 — Bucket 2: Child data handling (items 8a-CL-17 through 8a-CL-22)

Evidence pass: [scope-8a-evidence/EVIDENCE_BUCKET_2.md](scope-8a-evidence/EVIDENCE_BUCKET_2.md). 2 PASS, 1 PASS-with-caveat, 2 PARTIAL, 1 FAIL. RLS coverage on child-data tables is clean (20/20 present tables). Privacy Filtered hard-enforcement via `applyPrivacyFilter` at `_shared/context-assembler.ts:623` + migration `100149` defense-in-depth RLS. One consolidated finding emitted for the three data-lifecycle gaps (export, deletion, voice retention).

#### [SCOPE-8a.F2] Privacy-data-lifecycle incomplete — export, deletion, voice retention

- **Severity:** Blocking
- **Location:**
  - **Data export:** Archives-only surface; no full-family export anywhere in `src/pages/settings/`
  - **Data deletion:** `process_expired_deletions()` flips `family_members.is_active = false` only; no cascade to child-data tables; scheduled cron commented out
  - **Voice retention:** `journal_entries.audio_file_path` live in production; no pg_cron job cleaning audio files; CLAUDE.md architecture note referencing "daily voice recording cleanup" is aspirational only
- **Description:** COPPA grants parents rights to access the full data record of their under-13 children AND to have that data actually deleted. Today, mom can only export Archives (a subset); "deleting" a family member soft-deactivates the `family_members` row while leaving tasks, journal entries, tracker data, LiLa conversations, and photos behind in their respective tables; kids' voice recordings in `audio_file_path` persist indefinitely. The COPPA access right, the COPPA deletion right, and the general indefinite-retention-of-child-audio concern are three separate gaps with a single remediation theme: privacy-data-lifecycle is incomplete.
- **Evidence:** [scope-8a-evidence/EVIDENCE_BUCKET_2.md](scope-8a-evidence/EVIDENCE_BUCKET_2.md) items CL-18 (PARTIAL, Archives-only export), CL-19 (PARTIAL, soft-deactivate + no child-data cascade), CL-20 (FAIL, no retention cron). Founder adjudication captured at [scope-8a-evidence/CHECKLIST_DECISIONS.md](scope-8a-evidence/CHECKLIST_DECISIONS.md) §Founder adjudication.
- **Cross-reference to F1:** The existing `process_expired_deletions()` flips only `family_members.is_active`; child-data tables are untouched. PRD-40 revocation cascade is therefore not achievable against current code, even if the 4 COPPA tables were in place. F1's Fix Now scope is broader than originally described — it must include the deletion cascade work captured in F2's resolution scope.
- **Proposed resolution:** **Fix Now.** Scope: (a) full-family data export surface in PRD-22 Settings covering every table with family-scoped rows; (b) cascading deletion that actually removes child-data rows per PRD-22 + PRD-40 revocation requirements; (c) voice-recording retention cron with a specified retention threshold (default proposal: 90 days; legal review for beta-appropriate threshold).
- **Founder decision required:** Y (retention threshold; deletion cascade scope — hard-delete vs archive-to-cold-storage)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** Y

### Round 3 — Bucket 3: LiLa safety enforcement (items 8a-CL-23 through 8a-CL-31)

Evidence pass: [scope-8a-evidence/EVIDENCE_BUCKET_3.md](scope-8a-evidence/EVIDENCE_BUCKET_3.md). 2 PASS, 1 PARTIAL, 6 FAIL. The 6 FAILs are structural "PRD not built" states for PRD-20 and PRD-30 (and PRD-41, not yet authored). `lila-mediator` is the reference implementation for durable safety-flag persistence — the pattern PRD-30/PRD-41 should generalize. Two findings emitted: F3 (structural PRD build gap) + F4 (Translator code-level consistency).

#### [SCOPE-8a.F3] PRD-20 Safe Harbor + PRD-30/PRD-41 Safety Monitoring entirely unbuilt

- **Severity:** Blocking
- **Location:**
  - PRD-20 Safe Harbor tables (`safe_harbor_orientation_completions`, `safe_harbor_literacy_completions`, `safe_harbor_consent_records`) and UI unbuilt
  - PRD-30 Safety Monitoring tables (`safety_monitoring_configs`, `safety_sensitivity_configs`, `safety_notification_recipients`, `safety_flags`, `safety_keywords`, `safety_resources`, `safety_pattern_summaries`) unbuilt; `safety-classify` Edge Function not present; no Layer 1 keyword scanner wired to message-send path; no Layer 2 cron scheduler; `lila_messages.safety_scanned` column is dead weight
  - PRD-41 LiLa Runtime Ethics Enforcement: not authored per PRD-40 dependency note (line 4); no output-validation Edge Function runs AFTER model response; ethics auto-reject categories (force, coercion, manipulation, shame-based control, withholding affection) enforced only in system prompt text
- **Description:** Scope 8a Bucket 3 evidence pass verified all six safety-infrastructure items FAIL: Safe Harbor feature flows, PRD-30 Safety Monitoring 7-table schema, Layer 1 keyword scanner, Layer 2 async Haiku classifier scheduling, monitoring-scope defaults, and code-level ethics auto-reject. Collectively this means a child's LiLa conversations are not monitored for crisis/harm content today, the private processing space PRD-20 promises moms and teens does not exist, and ethics enforcement relies on the model following system prompt instructions rather than non-circumventable code-level checks. No child-facing AI beta exposure is permissible with this infrastructure absent.
- **Evidence:** [scope-8a-evidence/EVIDENCE_BUCKET_3.md](scope-8a-evidence/EVIDENCE_BUCKET_3.md) items CL-25 through CL-30 all FAIL. CL-31 PASS confirms `lila-mediator` persists `safety_triggered` to `lila_conversations.context_snapshot` and reads it before every turn — the reference pattern PRD-30/PRD-41 should generalize.
- **Founder framing captured:** Build PRD-30 + PRD-41 safety-monitoring infrastructure in a way that PRD-20 Safe Harbor can plug into cleanly when it is built. Do not defer PRD-30/PRD-41 until PRD-20 — the monitoring infrastructure is independently needed for every LiLa surface children touch.
- **Remediation intelligence:** `lila-mediator` pattern generalization for durable safety-flag persistence across every LiLa Edge Function. `safety_scanned` columns on `lila_messages`/`lila_conversations` already exist and can be wired by Layer 2 Haiku classifier writes.
- **Proposed resolution:** **Fix Now.** Scope: (a) PRD-20 Safe Harbor build (orientation flow + literacy flow + consent records + shell UI); (b) PRD-30 Safety Monitoring build (7-table schema + `safety-classify` Edge Function + Layer 1 keyword scan wired to message-send + Layer 2 pg_cron + monitoring-scope defaults seeded per role); (c) PRD-41 LiLa Runtime Ethics Enforcement authoring and build (output-validation Edge Function with code-level rejection for ethics auto-reject categories).
- **Founder decision required:** Y (ordering of PRD-20 vs PRD-30 vs PRD-41 builds; whether PRD-41 is authored during remediation or as a separate pre-build session)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** Y — **largest single Scope 8a Beta blocker by scope**

#### [SCOPE-8a.F4] Translator LiLa Edge Function exempted from code-level crisis detection

- **Severity:** Medium
- **Location:** `supabase/functions/lila-translator/index.ts`; `supabase/functions/_shared/` crisis-detection helper with documented "except Translator" exception in header
- **Description:** CLAUDE.md Convention #7 states that Crisis Override is GLOBAL and every system prompt must include crisis detection. Every LiLa Edge Function except Translator runs a code-level `detectCrisis` check before response emission; Translator is explicitly exempted in the shared helper and relies only on an in-prompt safety clause. The two mechanisms are not equivalent: code-level detection is non-circumventable, while in-prompt safety relies on model compliance. Translator accepts arbitrary pasted text from the user (positioned as a style-rewrite toy per founder product framing — pirate, sportscaster, Gen Z voice), which is the same input-surface shape every other LiLa tool has. The same input-surface argues for the same guardrail.
- **Evidence:** [scope-8a-evidence/EVIDENCE_BUCKET_3.md](scope-8a-evidence/EVIDENCE_BUCKET_3.md) item CL-23 PARTIAL. Shared helper "except Translator" exception documented in header. `lila-translator/index.ts` has no `detectCrisis` invocation.
- **Founder product context:** Translator is a stylistic rewrite tool, not a tone-softener. Not positioned as a conversational surface. Captured here as rationale for Vault positioning, not as a safety-exemption justification.
- **Proposed resolution:** **Fix Next Build.** Extend `detectCrisis` to Translator input. Remove the "except Translator" exception from the shared helper. CLAUDE.md #7 stays as-is. Mechanical change: one import + one call in `lila-translator/index.ts`.
- **Founder decision required:** N (adjudicated 2026-04-20)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** N

### Round 4 — Bucket 4: Board of Directors content policy (items 8a-CL-32 through 8a-CL-36)

Evidence pass: [scope-8a-evidence/EVIDENCE_BUCKET_4.md](scope-8a-evidence/EVIDENCE_BUCKET_4.md). 5/5 PASS — the Haiku pre-screen, deity → Prayer Seat redirect, blocked-figure hard block, Prayer Seat no-AI rule, and once-per-session disclaimer are all wired end-to-end across `lila-board-of-directors/index.ts` and `BoardOfDirectorsModal.tsx`. Three fail-open / defense-in-depth defects surfaced as unexpected findings and consolidate into a single Beta-Readiness-relevant finding.

#### [SCOPE-8a.F5] Board of Directors content policy has fail-open defects

- **Severity:** Medium
- **Location:**
  - `supabase/functions/lila-board-of-directors/index.ts:74` and `:100–102` — `contentPolicyCheck` returns `approved` on Haiku API failure or JSON parse failure
  - Same file, `create_persona` action handler — does not internally re-invoke `contentPolicyCheck`; gate is enforced only at client-caller site in `BoardOfDirectorsModal.tsx`
  - Same file, `:195–201` — hardcoded fallback prayer questions returned only on JSON parse failure (edge case)
- **Description:** The PRD-34 Board of Directors content policy gate (deity → Prayer Seat; blocked-figure → hard block) is correctly wired when Haiku is reachable and returns valid JSON. Two failure-mode defects undermine the guardrail: (a) Haiku classifier errors default to `approved` (fail-open) — during a Haiku outage, a user attempting to add a deity or blocked figure would succeed; (b) the `create_persona` action on the Edge Function does not re-invoke the content policy check server-side, so a direct API call bypassing the client modal would skip the gate entirely. The hardcoded prayer-question fallback on JSON parse failure violates CLAUDE.md #100 ("never canned") if the fallback path ever became dominant, but is a low-severity edge case today.
- **Evidence:** [scope-8a-evidence/EVIDENCE_BUCKET_4.md](scope-8a-evidence/EVIDENCE_BUCKET_4.md) Unexpected Findings 1–3. All five checklist items CL-32 through CL-36 PASS — the gate works when its call chain is intact.
- **Proposed resolution:** **Fix Now** for (a) and (b); **Tech Debt** for (c).
  - (a) Flip fail-open default to fail-closed with user-facing retry message on Haiku classifier error
  - (b) Add server-side `contentPolicyCheck` invocation inside `create_persona` action handler
  - (c) Replace hardcoded prayer-question fallback with a re-query or user-visible error state; tracked in `TECH_DEBT_REGISTER`
- **Founder decision required:** N (adjudicated 2026-04-20)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** Y — **fail-open on a safety gate is a beta-visible safety concern, however low the failure probability**

### Round 5 — Bucket 5: Human-in-the-Mix sweep (items 8a-CL-37 through 8a-CL-40)

Evidence pass: [scope-8a-evidence/EVIDENCE_BUCKET_5.md](scope-8a-evidence/EVIDENCE_BUCKET_5.md). HITM is applied in spirit across 22/30 AI-persistence surfaces. Shared `HumanInTheMix` component has reuse count = 1. CL-39 (LiLa chat) and CL-40 (embeddings) confirmed as scope confirmations per checklist design. Five bypass patterns surfaced: one Blocking (DailyCelebration), one Medium audit-trail defect (MindSweep autopilot), one Medium tech-debt (component reuse), and two intentional-design confirmations (BookShelf extraction pipeline + auto-titles). Three findings emitted: F6, F7, F8.

#### [SCOPE-8a.F6] DailyCelebration auto-persists AI celebration narrative with no HITM

- **Severity:** Blocking
- **Location:** `src/components/dashboard/DailyCelebration.tsx:180–196` — on Done click, AI-generated celebration narrative writes to `victory_celebrations` with no Edit, Regenerate, or Reject step
- **Description:** The DailyCelebration feature generates an AI narrative summarizing a child's victories and auto-saves that narrative to `victory_celebrations` when mom closes the celebration. The narrative is child-facing and becomes a permanent celebration record. Mom has no opportunity to correct hallucinations (misattributed victories, wrong names, content that references Safe Harbor material), soften tone for a kid having a hard day, or reject the narrative entirely. This is the most load-bearing HITM bypass in the codebase per Bucket 5 evidence — child-facing + persistent + no review. CLAUDE.md #4 ("every AI output MUST go through Human-in-the-Mix before persisting") applies without exception here.
- **Evidence:** [scope-8a-evidence/EVIDENCE_BUCKET_5.md](scope-8a-evidence/EVIDENCE_BUCKET_5.md) Unexpected Finding 1. Direct read of `DailyCelebration.tsx:180–196` confirms no HITM UI; `victory_celebrations` insert fires unconditionally on Done.
- **Proposed resolution:** **Fix Now.** Add Edit / Approve / Regenerate / Reject UI between narrative generation and `victory_celebrations` insert. Mom must explicitly approve before the record persists. Use the shared `HumanInTheMix` component (addressing F8's reuse-count concern in the same change).
- **Founder decision required:** N (adjudicated 2026-04-20)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** Y

#### [SCOPE-8a.F7] MindSweep autopilot routes labeled `source='manual'` — audit-trail integrity defect

- **Severity:** Medium
- **Location:** `supabase/functions/mindsweep-sort/index.ts` + consuming code paths that write to `guiding_stars`, `best_intentions`, `self_knowledge`, `journal_entries`, `victories` with `source='manual'` when routed via `trust_obvious` or `full_autopilot` mode
- **Description:** Mom's opt-in to MindSweep's `trust_obvious` or `full_autopilot` mode IS the HITM consent — the opt-in covers every subsequent auto-route under that consent. Not a HITM violation. However, autopilot-routed records persist with `source='manual'`, which makes them indistinguishable from hand-approved entries in the audit trail. If mom later audits her guiding stars or journal entries to understand which items she manually curated vs which arrived via autopilot, the data does not support that query. Audit-trail integrity is particularly relevant for items that flow into the platform-intelligence pipeline.
- **Evidence:** [scope-8a-evidence/EVIDENCE_BUCKET_5.md](scope-8a-evidence/EVIDENCE_BUCKET_5.md) Unexpected Finding 4.
- **Proposed resolution:** **Fix Next Build.** Rename the source value written on autopilot routes from `'manual'` to `'mindsweep_autopilot'`. Update any downstream query that filters by `source='manual'` to handle both values where appropriate.
- **Founder decision required:** N (adjudicated 2026-04-20)
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** N

#### [SCOPE-8a.F8] HumanInTheMix component reuse count = 1 — inconsistent HITM implementations

- **Severity:** Medium
- **Location:** `src/components/` — shared `HumanInTheMix` component (imported only by `LilaMessageBubble`); 22+ other AI-output surfaces reinvent Edit / Approve / Regenerate / Reject inline with different button labels ("Save" vs "Approve" vs "Accept" vs "Use this")
- **Description:** The HITM pattern is applied in spirit across 22 of 30 AI-persistence surfaces checked, but the shared component exists with a single import site. Every other feature rebuilds the four-action review UX from scratch, producing inconsistent button labels and inconsistent interaction patterns. This is not a safety bypass — HITM is happening — but it is a UX consistency defect AND a maintenance defect (any future change to the review pattern has to touch 22+ sites instead of one).
- **Evidence:** [scope-8a-evidence/EVIDENCE_BUCKET_5.md](scope-8a-evidence/EVIDENCE_BUCKET_5.md) Unexpected Finding 5 + component reuse count.
- **Proposed resolution:** **Tech Debt.** Refactor AI-output surfaces to import the shared `HumanInTheMix` component; standardize button labels per CLAUDE.md / conventions.md §Human-in-the-Mix Pattern. Sequence during the Universal Setup Wizards workstream (non-concurrent zone during audit per AUDIT_REPORT_v1.md §0). Opportunistic during wizard feature work — not a dedicated pass.
- **Founder decision required:** N (adjudicated 2026-04-20)
- **Wizard Design Impact:** Y — refactor should happen as part of wizard workstream to batch component consolidation with other UX polish
- **Beta Readiness flag:** N

#### Scope confirmations (not findings — logged for audit completeness)

Five AI-output surfaces commit output without pre-commit HITM. After founder adjudication, each is confirmed as intentional design or metadata-level output, not a HITM violation:

- **LiLa chat messages (8a-CL-39):** conversational, not persistence-bound content.
- **Embeddings (8a-CL-40):** async metadata, no user-facing text.
- **BookShelf extraction pipeline (`bookshelf-extract`, `bookshelf-study-guide`):** hundreds of extractions per book make pre-commit HITM impractical. Post-hoc Heart/Hide is the intentional user-facing review surface.
- **Auto-titles (Notepad tabs + message threads):** titles are metadata; mom can rename inline. Treated as embeddings-class metadata.
- **MindSweep autopilot opt-in:** mom's opt-in IS the HITM consent for every subsequent auto-route. (Audit-trail labeling defect captured separately in F7.)

## 2 — Scope 2: PRD-to-code alignment

*Not yet started. Stage C.*

## 3 — Scope 3: Cross-PRD integration

*Not yet started. Stage C (merged with Scope 8b).*

## 8b — Scope 8b: Integration compliance & safety

*Not yet started. Stage C (merged with Scope 3).*

## 4 — Scope 4: Cost optimization patterns (P1–P9)

*Not yet started. Stage C.*

## 6 — Scope 6: LiLa content discrepancy (reporting-only)

*Not yet started. Stage D. Output feeds `LILA_KNOWLEDGE_BACKLOG.md`, no fixes during audit.*

## 7 — Scope 7: Performance baseline

*Not yet started. Stage D. Output feeds `PERFORMANCE_BASELINE.md`.*

---

## Appendix A — AURI scan output

**Smoke test (2026-04-18):** `mcp__endor-cli-tools__check_dependency_for_vulnerabilities` on `lodash@4.17.20` returned `is_vulnerable: true`, `vulnerability_count: 5`, GHSA IDs: `GHSA-xxjr-mmjv-4gpg`, `GHSA-r5fr-rjxr-66jc`, `GHSA-f23m-r3pf-42rh`, `GHSA-35jh-r3h4-6jhm`, `GHSA-29mw-wpgm-hmr9`. `latest_version: 4.18.1`. Tool confirmed authenticated and returning real Endor DB data.

**Scan 1 — CLI, quick-scan, `-o summary` (2026-04-18):** Command: `endorctl scan --path . --quick-scan --dependencies --secrets --local --ai-models --languages typescript,javascript --tags "audit-2026-04-18,stage-a,phase-2" -o summary --sarif-file audit-logs/auri-retro-scan.sarif`. Background task `bbxkhcyfo` completed with exit 0. Log output (29 bytes): `INFO: Linter scans complete`. No SARIF file produced.

**Scan 2 — CLI, quick-scan, `-o table-verbose` (2026-04-18):** Same command with `-o table-verbose` (output-format hypothesis test per SCOPE-1.F5 proposed resolution option a). Background task `bhl3t9901` completed with exit 0. Identical 29-byte log. No SARIF. **Conclusion: CLI scan path is not producing findings in this environment regardless of output format.** Not investigated further since the MCP path works.

**Scan 3 — MCP scan tool, scoped to PRD-01/02/05 + Edge Functions (2026-04-18):** `mcp__endor-cli-tools__scan` with `include_path: ["src/pages/auth/**", "src/lib/permissions/**", "src/hooks/useAuth.ts", "src/components/shells/**", "supabase/functions/**"]`, `languages: ["typescript"]`, `quick_scan: true`, `scan_types: ["vulnerabilities", "secrets", "dependencies", "sast"]`. Endor namespace: `demo-trial` (Developer Edition default). Scan target sha: `4eac8190a991ac2a9d1f2f1fec325b7aa0b9d5e0` (this audit's Convention-242 commit). Returned 6 findings — **all Generic API Key false positives on feature-key identifier strings, no actual secrets leaked, no vulnerabilities, no SAST issues.** Per-finding detail:

| Finding UUID | Secret ID | Matched string | Locations |
|---|---|---|---|
| `82ea8185-e1d7-4f44-925f-9da7841b3101` | `cdd951` | `'mindsweep_sort'` | `supabase/functions/mindsweep-sort/index.ts` L349, L619 |
| `624e5f47-53a1-4130-a698-8888f4441555` | `1ad7ce` | `'whisper_transcribe'` | `supabase/functions/whisper-transcribe/index.ts` L75 |
| `c6f7b236-bb8a-4c60-9da8-1b62e5d6908a` | `770a5f` | `'uncategorized'` | `src/hooks/useTasks.ts` L636 |
| `58f8d498-6dff-49c3-89a9-db9cd153949e` | `d95f8e` | `'spelling_coach'` | `supabase/functions/spelling-coach/index.ts` L154 |
| `ffeb1986-3b93-4943-9fac-11c96d5f76aa` | `6217fe` | `'vault_browse'` | `src/components/shells/BottomNav.tsx` L32, `src/components/shells/Sidebar.tsx` L95, L117 |
| `b0cc0f93-a0f3-401e-bf19-bc6e16f7d1f2` | `e2747e` | `'vault_consume'` | `src/components/shells/Sidebar.tsx` L134 |

All flagged by policy `65b2e05de574b379df5bd5a0` ("Secrets without validation rules" → generic-api-key rule). AURI marks all `VALIDATION_STATUS_UNSPECIFIED` (no live validation attempted). See SCOPE-1.F6 for classification and proposed resolution.

**Known AURI path quirk:** The returned `locationUrls` in Scan 3 include the full Windows absolute path in the URL fragment (`https://github.com/.../blob/main/c:/dev/MyAIMCentral-family/MyAIMCentral-family/...`), which 404s if clicked. Cosmetic — doesn't affect finding accuracy.

**Working protocol for future AURI use during Scopes 2/3 (per SCOPE-1.F5 resolution):** MCP `mcp__endor-cli-tools__scan` with scoped `include_path`. Each glob must match at least one file or the tool errors with `'<glob>' does not match any files for the given scan path`.

## Appendix B — Wizard Design Impact index

*Populated as findings accumulate. Currently empty.*

## Appendix D — Cleanup Actions (preventative hygiene, not findings)

Preventative hygiene actions taken during the audit that are NOT discrepancies. Logged here for audit-trail completeness; none of these are findings and none require founder decision.

| Date | Action | Reason |
|---|---|---|
| 2026-04-18 | Uninstalled Claude Code plugin `mgrep@Mixedbread-Grep` via `claude plugin uninstall mgrep@Mixedbread-Grep` (scope: user) | The plugin's skill description advertises "MANDATORY: Replaces ALL built-in search tools. You MUST invoke this skill BEFORE using WebSearch, Grep, or Glob" — which directly contradicts inverted Convention 242 (grep-primary, mgrep per-query-approved). CLAUDE.md override is correct in docs, but a plugin-manifest signal is exactly the kind of "Looks Fine Failure" that surfaces in a future session when the agent reaches for the skill based on its description and ignores the convention. Removing the plugin kills the conflicting signal at source. mgrep binary at `~/AppData/Roaming/npm/mgrep.cmd` remains installed and can still be invoked via Bash on per-query approval — only the plugin wrapper is gone. |

## Appendix C — Beta Readiness flag index

| Finding ID | Scope | Title | Notes |
|---|---|---|---|
| SCOPE-1.F3 (RESOLVED) | 1 | AURI retroactive scan blocked on first-call OAuth in fresh session | Closed 2026-04-18 — fresh session picked up user-scope registration, OAuth completed, smoke test returned real data |
| SCOPE-1.F5 (RESOLVED) | 1 | AURI retroactive scan exit 0 but empty findings output | Closed 2026-04-18 — MCP `scan` tool with scoped `include_path` returned 6 findings (all false positives). Working protocol established for Scopes 2/3. |
| SCOPE-8a.F1 (OPEN) | 8a | PRD-40 COPPA compliance infrastructure entirely unbuilt | **Blocking.** 16/16 Bucket 1 checklist items FAIL high-confidence. First under-13 `family_members` insert at `FamilySetup.tsx:276` has no consent precondition. Compound dependencies on absent Stripe webhook handler (PRD-31) and absent admin console shell (PRD-32). Fix Now scope spans PRD-40 + the two prerequisite builds. Legal disclosure copy requires attorney review separately. |
| SCOPE-8a.F2 (OPEN) | 8a | Privacy-data-lifecycle incomplete — export, deletion, voice retention | **Blocking.** Export is Archives-only; deletion soft-deactivates without child-data cascade; voice retention cron does not exist, audio persists indefinitely. COPPA access + deletion rights not satisfied. Fix Now: full-family export, cascading deletion, retention cron with threshold. |
| SCOPE-8a.F3 (OPEN) | 8a | PRD-20 Safe Harbor + PRD-30/PRD-41 Safety Monitoring entirely unbuilt | **Blocking.** Largest Scope 8a Beta blocker by build scope. Child LiLa conversations not monitored for crisis/harm today. Ethics auto-reject lives only in prompt text, not code. `lila-mediator` is reference pattern for generalization. Fix Now: PRD-20 + PRD-30 build + PRD-41 author+build. |
| SCOPE-8a.F5 (OPEN) | 8a | Board of Directors content policy fail-open defects | **Medium.** Gate works end-to-end when Haiku is reachable. Fail-open on classifier error; `create_persona` action lacks server-side re-invocation. Fix Now for fail-closed flip + server-side gate; Tech Debt for hardcoded prayer fallback. |
| SCOPE-8a.F6 (OPEN) | 8a | DailyCelebration auto-persists AI narrative with no HITM | **Blocking.** Child-facing + persistent + no review. `DailyCelebration.tsx:180–196` writes AI-generated celebration narrative to `victory_celebrations` on Done click with no Edit/Regenerate/Reject. CLAUDE.md #4 violation. Fix Now: add HITM step using shared component. |

**Open Beta Readiness blockers (5):** SCOPE-8a.F1, F2, F3, F5, F6. Non-Beta Scope 8a findings (not in this index): F4 (Translator crisis-detection consistency — Medium, code-fix Next Build), F7 (MindSweep autopilot audit-trail labeling — Medium, Fix Next Build), F8 (HITM component under-reuse — Medium, Tech Debt). SCOPE-1.F6 is false-positive noise (not a blocker). SCOPE-5.F1 is documentation staleness (not a blocker).

---

## Stage A progress log

| Stage A step | Status | Notes |
|---|---|---|
| Scope 1 pre-flight — tsc | ✅ Done | Clean (exit 0) |
| Scope 1 pre-flight — lint | ✅ Done | Clean (0 errors, 72 warn-level warnings) |
| Scope 1 pre-flight — tsc binary hygiene | ✅ Done | `./node_modules/.bin/tsc --version` present |
| Scope 1 pre-flight — tool health re-verify | ✅ Done | codegraph/supabase/vercel green; AURI re-registered at user scope; mgrep on Scale tier (subsequently degraded mid-Stage-A — see F4) |
| Scope 1 pre-flight — mgrep spot-check | ✅ Done | MeetingSetupWizard query returned 99%+ matches at expected paths; wizards index was fresh when probed (TOOL_HEALTH F10 lag concern mitigated for that moment). |
| AURI first-call OAuth + smoke test | ✅ Done | OAuth completed in browser, smoke test on lodash@4.17.20 returned real vulnerability data (5 GHSA IDs). SCOPE-1.F3 resolved. |
| AURI retroactive scan kickoff | ✅ Done | Three runs executed. CLI with `-o summary` and `-o table-verbose` both empty (29-byte log, no SARIF). MCP scan tool with scoped `include_path` returned 6 findings — all false positives. SCOPE-1.F5 RESOLVED. SCOPE-1.F6 opened for the false-positive classification. |
| Convention 242 inversion | ✅ Done (commit `4eac819`) | SCOPE-1.F4. mgrep Scale tier burned $36.54 in 36h, projecting $300+/month. Downgraded to free tier; convention flipped to Grep/Glob primary; LESSONS_LEARNED "Convention Cost Evaluation" pattern added. |
| mgrep plugin uninstall (cleanup action) | ✅ Done | `claude plugin uninstall mgrep@Mixedbread-Grep` succeeded. Eliminates the "MANDATORY" skill-description signal that would conflict with inverted Convention 242 in future sessions. See Cleanup Actions section below. |
| Scope 5 — stub registry reconciliation | 🚧 Mid-stage | STUB_REGISTRY.md read in full (547 lines, 224 entries). SCOPE-5.F1 logged (Backburner/Ideas line 398 stale). Remaining 223 entries still need spot-check-level verification. |
| Stage A review pause | ⏳ Pending | After Scope 5 entry-by-entry reconciliation completes. |
