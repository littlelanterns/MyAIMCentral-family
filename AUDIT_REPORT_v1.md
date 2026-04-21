# AUDIT_REPORT_v1.md

> Phase 2 Architectural Audit — MyAIM Central family platform
> Audit window opened: 2026-04-18
> Coordinated via: [claude/web-sync/AUDIT_PARALLEL_PLAN.md](claude/web-sync/AUDIT_PARALLEL_PLAN.md)
> Gameplan: [MYAIM_GAMEPLAN_v2.2.md](MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 284-351)
> Status: **Stages A + B closed; Stage C Scope 2 COMPLETE — 70 findings emitted (F1–F70) across 9 domain batches; Scope 3+8b and Scope 4 pending**

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

**Status:** COMPLETE — All 5 rounds closed 2026-04-20. 8 findings emitted (F1–F8). 5 Beta Readiness blockers open: F1, F2, F3, F5, F6. Non-Beta: F4, F7, F8.

**Evidence archived** 2026-04-20 to [.claude/completed-builds/scope-8a-evidence/](.claude/completed-builds/scope-8a-evidence/) (this commit). The `scope-8a-evidence/...` paths referenced throughout this section are historical anchors — the files now live at the archive path.

**Checklist inventory:** [.claude/completed-builds/scope-8a-evidence/CHECKLIST_INVENTORY.md](.claude/completed-builds/scope-8a-evidence/CHECKLIST_INVENTORY.md) (40 binary items across 5 buckets).
**Decisions log:** [.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md](.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md) (append-only; founder adjudication captured).

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

**Status:** COMPLETE — 9 domain batches closed 2026-04-20. 70 findings emitted (F1–F70) spanning 43 PRDs + 24 addenda audited against code reality.

**Evidence archived** 2026-04-20 to `.claude/completed-builds/scope-2-evidence/` (handled by separate archive-phase commit — this apply-phase commit lands findings only). Per-batch decision rationale preserved in `scope-2-evidence/DECISIONS.md` Rounds 1–9 with full founder adjudication paragraphs.

**Beta Readiness flag count:** 0 — every Scope 2 finding is doc/code-drift with no direct beta-visible safety/privacy/compliance impact. Product-timing escalations (F19, F22, F34, F36) are remediation-queue priority signals, not beta blockers.

**Open cross-scope carry-forwards to Scope 3+8b and Scope 4:**
- `task_queue` → `studio_queue` nomenclature staleness pattern across upstream PRDs where downstream reconciliation mandates did not back-propagate (Batch 4 F24).
- PRD-14 `col_span` cross-PRD recurrence — may surface across PRD-25/PRD-26 section rendering (Batch 5 F32 PATTERN-FLAG).
- PRD-26 `tasks.source='randomizer_reveal'` expectation vs Build J `randomizer_draws` table seam — cross-PRD architecture reconciliation (Batch 5 F38 PATTERN-FLAG).
- F11 server-side per-tool-per-person context-sharing enforcement in `assembleContext()` — defense-in-depth beyond current UI-layer enforcement; likely Scope 8b finding with Beta Readiness Y when surfaced (Batch 2 open flag #4).
- PRD-14B vision-model cost analysis applicable when `calendar-parse-event` Edge Function is eventually built (Batch 5 F34 PATTERN-FLAG-FOR-SCOPE-4).
- MindSweep P2 embedding-first classification verification against production `ai_usage_tracking` data (Batch 4 PATTERN-FLAG-FOR-SCOPE-4).
- Mom-decides-privacy-with-transparency architecture cross-PRD cascade (F39 is PRD-15 instance; may cascade across PRD-06 partner-share F16, PRD-08 per-child visibility F18, PRD-19 relationship notes F22/F23 — Batch 6 PATTERN-FLAG-FOR-SCOPE-3).
- Post-build-verification enum-alignment miss pattern — F43 shape may recur across Build O/P/Q-class builds (Batch 6 PATTERN-FLAG-FOR-SCOPE-3).
- AI Toolbox cross-PRD integration pattern — recurs across PRD-21, PRD-21A, PRD-21C, PRD-34 (Batch 7 F45 PATTERN-FLAG-FOR-SCOPE-3).
- `SemanticSearchPanel` cross-feature consumer integration — 8 downstream consumer PRDs each have their own seam (Batch 7 F57 PATTERN-FLAG-FOR-SCOPE-3).
- Gamification-as-lego-pieces cross-feature composability — founder architectural principle applies across Reward economy, Reveal Library, Color Reveal, Treasure Box, earning modes composing across tasks/lists/routines/best-intentions/goals/book-chapters/streaks (Batch 8 PATTERN-FLAG-FOR-SCOPE-3; candidate for CLAUDE.md convention).
- PRD-05 ↔ PRD-24A LiLa bingo/boss/passport generation seam — Scope 3+8b should verify LiLa context-assembler hooks land alongside write-target tables (Batch 8 PATTERN-FLAG-FOR-SCOPE-3).
- PRD-28 financial data exclusion from LiLa context assembly enforced by omission — no CI guard; grep-based CI guard decision surfaces during Scope 4 (Batch 9 PATTERN-FLAG-FOR-SCOPE-4).

### [SCOPE-2.F1] PRD-31 tier monetization infrastructure unbuilt

- **Severity:** Medium
- **Location:** PRD-31 Subscription Tier System — all 7 monetization screens; missing tables `ai_credits`, `credit_packs`, `tier_sampling_costs`, `tier_sample_sessions`, `onboarding_milestones`, `subscription_cancellations` per [claude/live_schema.md](claude/live_schema.md) §Subscription & Monetization; no Stripe webhook Edge Function in [supabase/functions/](supabase/functions/); PRD-01 §Tier Gating L686 founding family 100-spot counter absent; [src/hooks/useFamily.ts:10](src/hooks/useFamily.ts#L10) reads `is_founding_family` but no counter query, no "X / 100 claimed" UI, no enforcement of the 100-spot ceiling
- **Description:** PRD-31's monetization surface is almost entirely unbuilt by design. All 6 credit/tier-sampling tables are absent from the live database, no Stripe webhook Edge Function exists, and 6 of 7 PRD-31 screens have no code counterpart. CLAUDE.md Convention #10 explicitly states that `useCanAccess()` returns true for everything during beta, which makes the absence beta-safe. Three-finding pre-monetization prerequisite stack: F1 (this) + F2 (gate adoption) + F3 (access-level picker) must all close before paid-tier activation can flip live without degraded UX.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_1_foundation.md](scope-2-evidence/EVIDENCE_BATCH_1_foundation.md) PRD-01 R5 + PRD-31 R1–R8; zero Stripe hits anywhere in `supabase/functions/` confirmed by repo-wide grep; `useCanAccess.ts:19-23` comment documents beta-unlock stance.
- **Proposed resolution:** Defer-to-Gate-4. Build the full monetization surface when the app has crossed the "worth subscribing to" threshold per founder direction 2026-04-20. Cross-ref SCOPE-8a.F1 prerequisite note (Stripe webhook handler is an absent dependency that also blocks PRD-40 COPPA revocation cascade).
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F2] PRD-02 permission gate adoption low — pre-monetization prerequisite

- **Severity:** Low during beta; escalates to High when tier-gating activates
- **Location:** CLAUDE.md Conventions #9–10; PRD-01 §L813; PRD-02 §Tier Gating L715. Grep `useCanAccess\(` across `src/` returns 6 invocations across 5 files ([useCanAccess.ts](src/lib/permissions/useCanAccess.ts), [PermissionGate.tsx](src/lib/permissions/PermissionGate.tsx), [MindSweepCapture.tsx](src/components/mindsweep/MindSweepCapture.tsx), [TaskBreaker.tsx](src/components/tasks/TaskBreaker.tsx), [TaskCreationModal.tsx](src/components/tasks/TaskCreationModal.tsx)). Grep `PermissionGate` returns 9 files — all in `src/pages/archives/**`, [BookShelfPage.tsx](src/pages/BookShelfPage.tsx), [MeetingsPage.tsx](src/pages/MeetingsPage.tsx), plus the component itself.
- **Description:** The Convention #9–10 rule mandates `useCanAccess()` + `<PermissionGate>` wrapping on every page and tool so tier-gating can be flipped on via configuration rather than rebuild. Current adoption is very low — most feature entry points (Dashboard, Tasks, Lists, Journal, Calendar, Meetings, BookShelf except 1 route, Archives except 1 route, Victories, Studio, Vault, Guiding Stars, etc.) do not wrap. Beta-unlock makes this effectively no-op today, but the convention's forward-looking purpose is undercut when most features never wrap. Pre-monetization prerequisite: when tier-gating flips live for paid tiers, unwrapped features stay unrestricted regardless of matrix rows.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_1_foundation.md](scope-2-evidence/EVIDENCE_BATCH_1_foundation.md) PRD-02 R4–R5 (consolidated batch-level gate-adoption candidate).
- **Proposed resolution:** Fix Next Build. Forward-looking work during pre-monetization remediation queue. Cannot flip paid tiers on without a wrapping catchup pass first. Link to F1 as mandatory prerequisite.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F3] PRD-02 access-level picker missing — signature founding-family onboarding moment

- **Severity:** Medium
- **Location:** PRD-31-Permission-Matrix-Addendum §Mom's Selection Flow L196–232. `permission_level_profiles` table seeded with 164 rows per [claude/live_schema.md](claude/live_schema.md#L164); grep `permission_level_profiles` in `src/` returns 0 hits. No component named `AccessLevelSelector`, `PermissionProfileModal`, or equivalent exists. [PermissionHub.tsx:421](src/pages/PermissionHub.tsx#L421) writes directly to `member_feature_toggles` without routing through the profile-selection picker.
- **Description:** The Permission-Matrix addendum specifies a Light/Balanced/Maximum picker modal on first member creation plus a `[Change Access Level]` entry point in Permission Hub. This is the addendum's flagship new onboarding flow. Backing data is fully wired (164 `permission_level_profiles` rows seeded ready to consume); the consuming UI is missing. Every founding family recruited from this point forward hits the degraded PermissionHub-only flow without ever seeing the signature selection moment.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_1_foundation.md](scope-2-evidence/EVIDENCE_BATCH_1_foundation.md) PRD-02 R6; `permission_level_profiles` 164 live rows confirm seed data ready to consume.
- **Proposed resolution:** Fix Next Build — **ESCALATED** per founder direction 2026-04-20: build soon rather than next normal build sprint. Near-term build priority for restoring the intended onboarding for founding family acquisition. Pre-build gate: decide whether sparse vs dense `member_feature_toggles` semantics need reconciliation with addendum's profile seeder (CLAUDE.md convention says sparse "no row = enabled"; addendum's seeder implies dense pre-populated rows per profile).
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F4] PRD-01 + PRD-04 legacy Hub columns on `families` table superseded by PRD-14D

- **Severity:** Low
- **Location:** PRD-01 §Data Schema L404–405 specifies `families.tablet_hub_config JSONB` + `tablet_hub_timeout TEXT`; PRD-04 §Data Schema L666–682 specifies `families.hub_config JSONB` with widget grid + always_on + hub_theme. All three columns present in [claude/live_schema.md:13-14,21](claude/live_schema.md#L13) with no consumer code in `src/`. Hub UI consumes `family_hub_configs` table per PRD-14D via [src/hooks/useFamilyHubConfig.ts:56](src/hooks/useFamilyHubConfig.ts#L56). Only non-consumer reference is a comment at [src/pages/PermissionHub.tsx:302](src/pages/PermissionHub.tsx#L302).
- **Description:** Three Hub-related JSONB/TEXT columns on the `families` table are dead weight. PRD-14D Cross-PRD-Impact-Addendum moved Hub config to a dedicated `family_hub_configs` table; the legacy columns were never dropped. Scope 5 pattern of table-exists-but-consumer-absent applies — documentation cleanup per PRD-14D supersession, no functional impact.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_1_foundation.md](scope-2-evidence/EVIDENCE_BATCH_1_foundation.md) PRD-01 R3 + PRD-04 R1 (consolidated).
- **Proposed resolution:** Intentional-Update-Doc. Amend PRD-01 §Data Schema L404–405 + PRD-04 §Data Schema L666–682 to reference PRD-14D `family_hub_configs`. Optional drop migration during Phase 3 triage.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F5] PRD-02 shift-scheduling text superseded by `access_schedules` + `time_sessions`

- **Severity:** Low
- **Location:** PRD-02 §Data Schema L418 defines `shift_schedules` table (table does not exist in live schema); PRD-02 §Data Schema L392–415 defines `shift_sessions` table (exists with 0 rows, no readers). Live code uses `access_schedules` per [src/lib/scheduling/scheduleUtils.ts:19](src/lib/scheduling/scheduleUtils.ts#L19) + [src/lib/permissions/usePermission.ts:102](src/lib/permissions/usePermission.ts#L102) with `schedule_type` enum `'shift' | 'custody' | 'always_on'`, and shift logic persists via `time_sessions` with `source_type='shift'`.
- **Description:** PRD-02 describes a shift-scheduling architecture that was entirely replaced during PRD-35 Universal Scheduler + Build O time-sessions work. CLAUDE.md Conventions #26 (`access_schedules` replaces `shift_schedules`) and #40 (Special Adult shifts use `time_sessions`, no separate `shift_sessions` table) document the replacement. Orchestrator originally proposed Intentional-Document but founder direction 2026-04-20 overrode to Unintentional-Fix-PRD: PRDs remain authoritative references; leaving them stale (even with conventions documenting the change) degrades the spec surface for future contributors and AI-assisted builds.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_1_foundation.md](scope-2-evidence/EVIDENCE_BATCH_1_foundation.md) PRD-02 R1 + R2 (consolidated). `shift_sessions` live schema row count 0; zero readers in `src/`.
- **Proposed resolution:** Intentional-Update-Doc. Update PRD-02 §Data Schema text to cite CLAUDE.md Conventions #26 and #40 explicitly, replacing the `shift_schedules` and `shift_sessions` table definitions with the `access_schedules` + `time_sessions` architecture.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F6] PRD-03 theme count — code ships 46, spec + Convention #42 claim 38

- **Severity:** Low
- **Location:** PRD-03 §Theme Catalog L386 "Launch Catalog (~38 themes)" + CLAUDE.md Convention #42 "38 themes implemented across 6 mood categories". [src/lib/theme/tokens.ts:117–138](src/lib/theme/tokens.ts#L117) declares 46 distinct `ThemeKey` values (9 original + 7 Warm & Cozy + 7 Cool & Calm + 6 Bold & Rich + 5 Soft & Light + 6 Bright & Fun + 6 Seasonal); [L189](src/lib/theme/tokens.ts#L189) `themes: Record<ThemeKey, ThemeColors>` populates all 46.
- **Description:** Code ships 8 more themes than spec + Convention #42 acknowledge. No user-visible defect today (all 46 themes render correctly). Founder direction 2026-04-20: codify 46 as truth (update PRD-03 + Convention #42 to 46). Future consolidation/rework — reduce themes and make each deliberately differentiated rather than many-that-look-similar — logged as post-audit product workstream; not audit scope.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_1_foundation.md](scope-2-evidence/EVIDENCE_BATCH_1_foundation.md) PRD-03 R1.
- **Proposed resolution:** Intentional-Update-Doc. Update PRD-03 §Theme Catalog + CLAUDE.md Convention #42 from 38 to 46. Post-audit product workstream tracks future theme consolidation separately.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F7] PRD-03 shared component inventory mismatch across PRD-03 / Convention #44 / STUB_REGISTRY

- **Severity:** Low
- **Location:** PRD-03 §Shared Component Library L682–702 lists 18 components (Button, Card, Input, Modal, Tooltip, Toast, Badge, EmptyState, LoadingSpinner, IconButton, FeatureGuide, DrawerChat, VisibilityToggle, LockedOverlay, UpgradeCard, RoleBadge, ShiftBanner, ColorPicker). CLAUDE.md Convention #44 acknowledges 13 shared components (Button, Card, Input, Modal, Badge, LoadingSpinner, EmptyState, Toggle, Avatar, Tabs, Select, Tooltip, SparkleOverlay). [STUB_REGISTRY.md:362](STUB_REGISTRY.md#L362) lists "11 shared components" Wired.
- **Description:** Three authoritative sources disagree on the shared-component count: 18 (PRD-03) vs 13 (Convention #44) vs 11 (STUB_REGISTRY). Some delta components are wired elsewhere in the tree, some absent, some legitimately deferred. Cross-PRD pattern since shared components by definition cross PRDs.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_1_foundation.md](scope-2-evidence/EVIDENCE_BATCH_1_foundation.md) PRD-03 R4.
- **Proposed resolution:** Fix Next Build. Low-priority inventory reconciliation during doc-hygiene pass; one source needs to become truth. PATTERN-FLAG-FOR-SCOPE-3 preserved since the drift surface crosses PRDs.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F8] PRD-04 `/hub/tv` PlannedExpansionCard stub — PRD-14E Post-MVP

- **Severity:** Low
- **Location:** PRD-04 §Tablet Hub / PWA Entry Points L597–606 + PRD-14E specify `/hub/tv` PWA-installable TV mode with landscape layout. [src/App.tsx:66-70,105](src/App.tsx#L66) ships `HubTvStub` rendering a `PlannedExpansionCard` with `featureKey="family_hub_tv_route"`.
- **Description:** Honest placeholder stays. No TV mode advertising exists anywhere in the app; PlannedExpansionCard is correctly framed as post-MVP per PRD-33 PWA PRD. PRD-14E is listed in Scope 2 Batch 5 + feature glossary as MVP but spec implies post-MVP timing per the PWA PRD. PRD-14E entirely rolls to this finding — Batch 5 does not re-emit per §7 Rule 7.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_1_foundation.md](scope-2-evidence/EVIDENCE_BATCH_1_foundation.md) PRD-04 R2; PRD-14E Batch 5 evidence rows roll into this finding.
- **Proposed resolution:** Defer-to-Gate-4. PlannedExpansionCard demand-validation stub is the correct current state per CLAUDE.md Convention #31. Build kicks off when PRD-33 PWA PRD timeline comes due.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F9] PRD-05C LiLa Optimizer infrastructure unbuilt

- **Severity:** Medium
- **Location:** PRD-05C LiLa Optimizer — Enhanced-tier flagship. 4 tables (`optimizer_outputs`, `optimization_patterns`, `user_prompt_templates`, `context_presets`) absent from live schema. All 5 screens unbuilt. 9-step optimization pipeline Edge Function absent. Prompt cards, "What did I add?" explainer, Quick/Walk-Me-Through modes, context presets, usage thermometer UI — none exist. `optimizer` mode_key seeded in `lila_guided_modes` but launches no flow — already captured as misleading UI in Scope 5 walk-through.
- **Description:** Same shape as F1 tier-monetization-unbuilt pattern. Enhanced-tier flagship deferred per beta-unlock posture (Convention #10). Misleading UI (`optimizer` mode picker surface) captured in Scope 5; not re-emitted here.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_2_lila.md](scope-2-evidence/EVIDENCE_BATCH_2_lila.md) PRD-05C R1, R2, R3.
- **Proposed resolution:** Defer-to-Gate-4. Build when app is worth subscribing to, per founder's F1 direction. F52 + F53 (Vault premium actions) + F51 LiLa Preferences UI bundle with this build queue.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F10] PRD-05 downstream registry supersession — 15 modes spec'd, 43 modes shipped

- **Severity:** Low
- **Location:** PRD-05 §Guided Mode Registry lists 15 modes; `lila_guided_modes` live table has 43 rows. PRD-05 L398 documents extensibility mechanism (downstream PRDs register modes). Same pattern applies to `lila_conversations` columns added by PRD-20/21A/30 and `member_self_insights` superseded by PRD-07 `self_knowledge`.
- **Description:** Snapshot-drift with extensibility explicitly documented. **NOT mirroring F5 override** per founder direction 2026-04-20 — F5 was unambiguous table replacement (shift_schedules → access_schedules), while F10 is spec-snapshot drift with extensibility documented at PRD-05 L398. PRD-05 schema section gets a "current state at time of writing, extensible via X/Y/Z" disclaimer rather than full rewrite.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_2_lila.md](scope-2-evidence/EVIDENCE_BATCH_2_lila.md) PRD-05 R1, R2, R3.
- **Proposed resolution:** Intentional-Update-Doc. Snapshot refresh + extensibility disclaimer per founder 2026-04-20 direction. No PRD text rewrite.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F11] PRD-05 context assembly architecture wrapping drift — 3-layer framework wraps 8 PRD concepts

- **Severity:** Medium (orchestrator override from worker's Low, approved by founder — context assembly is the highest-weight system in the platform)
- **Location:** PRD-05 §Context Assembly Pipeline describes 8 context concepts; [supabase/functions/_shared/context-assembler.ts](supabase/functions/_shared/context-assembler.ts) + [claude/ai_patterns.md](claude/ai_patterns.md) §Context Assembly Pipeline Layered Architecture + CLAUDE.md Convention #105 ship a 3-layer framework (always loaded / on-demand by relevance / search only) with per-turn semantic refresh, name detection, topic matching, per-tool overrides.
- **Description:** The 3-layer framework wraps PRD-05's 8 concepts — no capability lost, 7 new capabilities added (name detection, topic matching, Layer 3 semantic RPCs, P9 per-turn refresh, per-tool overrides, explainability metadata, baseline fallback). `context_sources` field retained as registry documentation per founder direction — code-hardcoded per-tool steering IS superior because modes diverged beyond what a single-field list can express. Severity override to Medium: highest-weight system; future AI-assisted LiLa builds reading PRD-05 alone would implement against the wrong architecture.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_2_lila.md](scope-2-evidence/EVIDENCE_BATCH_2_lila.md) PRD-05 R6; [scope-2-evidence/ANALYSIS_F11_CONTEXT_ARCHITECTURE_COMPARISON.md](scope-2-evidence/ANALYSIS_F11_CONTEXT_ARCHITECTURE_COMPARISON.md) decision-support report (commit 0fe6c3d) confirmed option (c) complementary architecture.
- **Proposed resolution:** Intentional-Update-Doc. PRD-05 §Context Assembly prose amendment describing wrapping relationship, citing `claude/ai_patterns.md` §Context Assembly Pipeline Layered Architecture + CLAUDE.md Convention #105, plus one sentence on `context_sources` retirement as registry documentation only. No code changes. Server-side per-tool-per-person enforcement in `assembleContext()` (analysis §7 Q2) deferred to Scope 3+8b RLS/seams review per founder agreement.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F12] PRD-05 Privacy Filtered folder category UI deferred to PRD-13

- **Severity:** Low
- **Location:** PRD-05 R4 — item-level `is_privacy_filtered` boolean enforced at Edge Function level via `applyPrivacyFilter()` in [supabase/functions/_shared/context-assembler.ts:623](supabase/functions/_shared/context-assembler.ts#L623) + migration `100149` defense-in-depth RLS. Folder-level category UI to toggle privacy filtering at folder scope is missing.
- **Description:** Privacy boundary holds via item-level `is_privacy_filtered` + `applyPrivacyFilter()`. Folder-level category UI for scoped toggling is deferred to PRD-13 Archives build. Beta Y flag evaluated per PLAN §6 shape #2 (privacy-adjacent) and rejected — `applyPrivacyFilter()` already enforces the hard boundary at the Edge Function level. Folder UI is PRD-13 Archives territory and surfaces naturally there.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_2_lila.md](scope-2-evidence/EVIDENCE_BATCH_2_lila.md) PRD-05 R4.
- **Proposed resolution:** Defer-to-Gate-4. Surfaces when PRD-13 Archives build kicks off in natural build sequence.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F13] PRD-05 opening messages missing for 35 of 43 guided modes

- **Severity:** Low
- **Location:** `lila_guided_modes.opening_messages JSONB` defaults to `'[]'` with no CHECK constraint enforcing `jsonb_array_length >= 2`. 35 of 43 modes launch without warm openings; core 4 modes (help, assist, general, optimizer) + task_breaker variants + `homeschool_time_review` have openings.
- **Description:** Silent-degradation schema pattern. Remediation direction per founder 2026-04-20: runtime generation rejected (latency makes UX messy across every mode); seed rotating hard-coded greetings in migration for all 35 missing modes. Tone: invitational, not directive. Pattern to AVOID: BookShelf mode's current funneling into LiLa-selected discussion rather than letting mom lead — openers describe mode capability (good), not pick mode topic (bad). BookShelf funneling behavior flagged forward to Batch 7 PRD-23 pass as separate mode-level system prompt defect.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_2_lila.md](scope-2-evidence/EVIDENCE_BATCH_2_lila.md) PRD-05 R7.
- **Proposed resolution:** Fix Next Build. Seed rotating hard-coded invitational openings via migration; add CHECK constraint enforcing `jsonb_array_length >= 2` for future rows.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F14] PRD-05 `buildFaithContext()` reads nonexistent schema field — likely dead code

- **Severity:** Low
- **Location:** [src/lib/ai/system-prompts.ts](src/lib/ai/system-prompts.ts) `buildFaithContext()` reads a `response_approach` TEXT field that doesn't exist on `faith_preferences`. Edge Function `supabase/functions/_shared/context-assembler.ts` correctly reads individual boolean columns per CLAUDE.md Convention #78.
- **Description:** Helper is almost certainly dead code — schema shipped as individual boolean columns (`prioritize_tradition`, `include_comparative`, `respect_but_dont_assume`, etc.) per PRD-13; frontend helper reads the pre-Convention-#78 TEXT/JSONB field shape. Classification stays Unintentional-Fix-Code regardless of dead-code confirmation — deleting dead code is "fix code" shape.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_2_lila.md](scope-2-evidence/EVIDENCE_BATCH_2_lila.md) PRD-05 R8.
- **Proposed resolution:** Fix Next Build. Delete `buildFaithContext()` helper. Verify no callers; confirm dead code before removal.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F15] PRD-05C `ai_usage_tracking` schema drift — live is generic platform-wide tracker

- **Severity:** Low
- **Location:** PRD-05C specifies an Optimizer-specific rollup schema; live `ai_usage_tracking` table (531 active rows per [claude/live_schema.md](claude/live_schema.md)) is a generic platform-level per-AI-call tracker.
- **Description:** Live table is the shipped truth — generic schema is broader and correct. PRD-05C's original Optimizer-specific rollup design is narrower than what was built. Same shape as F42 (feature decision supersedes addendum) — doc drift from code, not code drift from intent.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_2_lila.md](scope-2-evidence/EVIDENCE_BATCH_2_lila.md) PRD-05C R4.
- **Proposed resolution:** Intentional-Update-Doc. PRD-05C text amendment to cite generic `ai_usage_tracking` schema.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F16] PRD-06 partner-share UI missing on Guiding Stars + Best Intentions

- **Severity:** Low
- **Location:** `guiding_stars.is_shared_with_partner BOOLEAN` + `best_intentions.is_shared_with_partner BOOLEAN` columns wired per [claude/live_schema.md](claude/live_schema.md) §Personal Growth. Per-entry "Share with partner" toggle specified on Guiding Stars Screen 1 + Best Intentions Screen 2 — UI never surfaced. Person-level backup via `archive_member_settings` toggle exists.
- **Description:** Column-wired-UI-absent gate-adoption pattern — same shape as F2. Person-level backup via `archive_member_settings.is_included_in_ai` provides coarse-grained partner visibility control; per-entry granular sharing is the unbuilt layer. Cross-PRD seam — `is_shared_with_partner` column-wired-UI-absent pattern recurs across PRD-06, PRD-07 (potentially), and PRD-19 (F23 archive column drift).
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md](scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md) PRD-06 R1, R2.
- **Proposed resolution:** Fix Next Build. Low priority — fix when per-entry granular sharing becomes roadmap priority. PATTERN-FLAG-FOR-SCOPE-3 preserved (partner-sharing pattern cross-PRD seam).
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F17] PRD-08 messaging supersession — 2-table spec vs 3-table PRD-15 architecture

- **Severity:** Low
- **Location:** PRD-08 §Journal & Messaging describes 2-table messaging architecture; PRD-15 ships 3-table `conversation_spaces` + `conversation_threads` + `messages` model.
- **Description:** Structural drift (2 tables vs 3-table PRD-15 architecture) warrants proper audit record rather than hygiene-note downgrade. Founder flagged separate product concern 2026-04-20 ("messaging not working exactly as I envisioned, some is working") — that product-level concern was carried forward to Batch 6 Communication walk-through for PRD-15 behavior-vs-intent review; founder confirmed 2026-04-20 she could not identify the specific UX concern beyond F39 mom-visibility and F40 DND. Outside this finding's scope which is doc-drift only.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md](scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md) PRD-08 R2.
- **Proposed resolution:** Intentional-Update-Doc. Update PRD-08 §Messaging text to cite PRD-15 spaces/threads/messages architecture.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F18] PRD-08 per-child journal visibility UI missing

- **Severity:** Low
- **Location:** `journal_visibility_settings` table wired (6 columns, 0 rows per [claude/live_schema.md](claude/live_schema.md)). PRD-08 §Per-Child Visibility specifies mom-configurable per-child-per-entry-type visibility UI. RLS default protects teens at baseline.
- **Description:** Table shipped; mom-configurable visibility UI missing. Cross-PRD seam — mom-decides-privacy-with-transparency architecture cascades across partner-share (F16), per-child journal visibility (this), relationship/private notes (F22/F23), and mom-visibility on messaging (F39). RLS default protects at baseline regardless.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md](scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md) PRD-08 R3.
- **Proposed resolution:** Fix Next Build. Eventually fix when mom-configurable visibility becomes roadmap priority.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F19] PRD-11B Family Celebration unbuilt — STUB_REGISTRY L120 false-Wired claim

- **Severity:** Medium
- **Location:** PRD-11B Family Celebration — `family_victory_celebrations` table missing; no component exists; no feature keys in `feature_key_registry`; no `family_celebration_basic` / `family_celebration_detailed` / `family_celebration_voice` / `family_celebration_archive` consumers; no journal-entry-type support; no prompt modes. [STUB_REGISTRY.md:120](STUB_REGISTRY.md#L120) falsely claims "Wired Phase 12."
- **Description:** Entire surface absent. Meta-finding: stub registry integrity issue surfaced by Scope 2 after Scope 5 walk-through missed it. Founder direction 2026-04-20: "sooner than later, but not urgent" — product-timing note baked into remediation queue. Same shape as F1/F9 tier-monetization-unbuilt pattern but with near-term product-timing signal rather than paid-tier-gated.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md](scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md) PRD-11B R1–R5.
- **Proposed resolution:** Fix Next Build. Build when prioritized — "sooner than later, not urgent" per founder 2026-04-20. STUB_REGISTRY line 120 correction flagged for Phase 3 doc-hygiene (not reopening Scope 5).
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F20] PRD-18 mood triage supersession — Enhancement Addendum + Convention #25 removed default

- **Severity:** Low
- **Location:** PRD-18 base specified mood_triage ON in default evening rhythm; Enhancement Addendum §Evening Rhythm Revised Section Sequence + CLAUDE.md Convention #25 ("Mood tracking is NOT a default rhythm section") removed it. Column preserved on `rhythm_completions.mood_triage` for future use.
- **Description:** Clean supersession — addendum-properly-captured. Base PRD-18 needs one-line pointer amendment citing Enhancement Addendum + Convention #25.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md](scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md) PRD-18 R2.
- **Proposed resolution:** Intentional-Update-Doc. Base PRD-18 pointer amendment, not rewrite.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F21] PRD-18 teen experience supersession — Enhancement Addendum §Enhancement 7 + Conventions #189–197

- **Severity:** Low
- **Location:** PRD-18 base described teens as "reduced sections"; Enhancement Addendum §Enhancement 7 + CLAUDE.md Conventions #189–197 capture full tailored template (7 morning + 8 evening sections, 15 teen-specific questions, teen MindSweep-Lite dispositions including `talk_to_someone` as PRIVATE journal write).
- **Description:** Intentional-Document confirmed — **NOT mirroring F5 override** per founder direction 2026-04-20. F5 was archaeological table definitions (whole tables that no longer exist); F21 is properly-addendum-captured supersession with extensibility documented in Enhancement Addendum + Conventions. Different shape — base PRD-18 gets one-line pointer amendment ("see Enhancement Addendum §Enhancement 7"), not rewrite.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md](scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md) PRD-18 R4.
- **Proposed resolution:** Intentional-Update-Doc. Base PRD-18 pointer amendment only.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F22] PRD-19 reports + aggregation pipeline unbuilt — near-term 2–3 month roadmap

- **Severity:** Medium
- **Location:** PRD-19 Family Context & Relationships. 4 of 6 PRD-19 tables missing: `member_documents`, `guided_interview_progress`, `monthly_data_aggregations`, `generated_reports`. Aggregation pipeline Edge Function absent. MemberArchiveDetail.tsx "Looks-Fine-Failure" — page renders aggregation but misses PRD-19 layer (private notes, relationship notes, aliases, How-to-Reach-Me) because backing columns absent per F23.
- **Description:** Founder direction 2026-04-20: near-term roadmap (next 2–3 months), build posture "wait until app has content to load onto" but ensure forward-thinking integration readiness. Two critical coupling notes baked into remediation: (a) F23 archive column drift MUST land before or concurrent with F22 feature build (reports pipeline else built against wrong schema); (b) PRD-28B infrastructure prerequisite decision (merge PRD-28B into PRD-19 OR build PRD-28B separately) must be made BEFORE F22 build kicks off. Connects to closed SCOPE-5.F4 Finding A (PRD-28B absence) and Finding B (AIR writer auto-victory pipeline unbuilt).
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md](scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md) PRD-19 R1–R4.
- **Proposed resolution:** Fix Next Build — near-term roadmap per founder 2026-04-20. Pre-build gates: F23 migration lands first/concurrent; PRD-28B merge-vs-separate decision adjudicated before build kickoff.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F23] PRD-19 archive column drift — 5 + 3 addendum columns unbacked

- **Severity:** Low
- **Location:** PRD-19 Cross-PRD Impact Addendum §PRD-13 specifies 5 column additions on `archive_context_items` + 3 on `archive_member_settings`; none migrated. `display_name_aliases` provides partial alias coverage.
- **Description:** Silent addendum drift — addendum written 2026-03-13; no STUB_REGISTRY entry captures the gap. Dual-context sharing, drag-reorder priority, alias system for external LLM privacy all unbacked. Cross-ref F22 coupling: migration must land before or with F22 feature build per founder's 2–3 month horizon direction.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md](scope-2-evidence/EVIDENCE_BATCH_3_personal-growth.md) PRD-19 R5, R6.
- **Proposed resolution:** Fix Next Build. Migration must land before/with F22.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F24] PRD-09A `task_queue` legacy nomenclature — 10 stale occurrences in PRD text

- **Severity:** Low
- **Location:** PRD-09A uses `task_queue` 10 times across Screens, Stubs, CLAUDE.md Additions, Tier Gating sections. PRD-17 §Schema Reconciliation Note mandated rename to `studio_queue` that was applied in code (entire codebase uses `studio_queue` consistently) but never applied to PRD-09A text. Feature key `tasks_queue` also obsolete (not in registry; code ships canonical PRD-17 keys: `studio_queue`, `queue_modal`, `queue_quick_mode`, `routing_strip`, `queue_batch_processing`).
- **Description:** Upstream PRD text not updated after downstream reconciliation mandate. PRD-09B correctly cites the rename; PRD-09A itself stayed stale. Cross-PRD pattern that may recur — flagged for Scope 3+8b integration-traversal pass.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md](scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md) PRD-09A R1, R9 + PRD-09B R7.
- **Proposed resolution:** Intentional-Update-Doc. PRD-09A text pass to replace `task_queue` → `studio_queue` (10 occurrences) + feature key `tasks_queue` → canonical PRD-17 keys.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F25] PRD-09A prioritization views partial — 12 options ship (7 real + 5 stubs), ABCDE removed

- **Severity:** Low
- **Location:** PRD-09A internally inconsistent — 13 vs 14 views count. Code ships 12 options with 7 real view components (Simple List, Now/Next/Optional, By Category, Eisenhower, Eat the Frog, 1-3-5, Kanban) + 5 `PlannedViewStub` placeholders (Big Rocks, Ivy Lee, MoSCoW, Impact/Effort, By Member) + ABCDE explicitly removed per founder decision 2026-04-13.
- **Description:** Honest stub pattern is graceful degradation. PRD text internally inconsistent on count; keep as single finding rather than splitting. ABCDE-removal sub-note embedded in primary Deferred-Document classification.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md](scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md) PRD-09A R2.
- **Proposed resolution:** Defer-to-Gate-4. PRD-09A text update in same pass as F24 task_queue naming fix; reconcile the 13 vs 14 vs 12 count to match ship state. Planned views build incrementally as prioritized.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F26] PRD-09A Habit task type unwired — 3-mode meta-type branching remediation

- **Severity:** Low
- **Location:** PRD-09A §Screen 3 spec'd `task_type = 'habit'` enum value with zero consumer. No STUB_REGISTRY entry. Grep `task_type.*habit` surfaces only type declaration.
- **Description:** Founder product direction 2026-04-20 CLARIFIES: Habit is a meta-type that branches into 3 rendering modes based on user tracking preference — (a) tally-type (wire to PRD-10 widget), (b) calendar-day-mark-type (wire to PRD-10 widget), (c) task-at-interval-type (wire to existing routine/recurrence infrastructure). Habit is a legitimate concept (not redundant with routines/trackers) — it mixes task+best-intention semantics and lets the user pick how it gets surfaced.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md](scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md) PRD-09A R3.
- **Proposed resolution:** Fix Next Build. Build Habit creation flow with 3 rendering-mode pickers, each creating the appropriate downstream artifact (widget row or scheduled task). Enum + PRD text stay.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F27] PRD-09B list type catalog — codify 5 extras with documented use cases

- **Severity:** Low
- **Location:** PRD-09B §List Types. All 5 extra list types have legitimate provenance: `backburner` + `ideas` (CLAUDE.md Convention #21 auto-system lists), `prayer` (specs/studio-seed-templates.md §List Formats), `sequential` (Studio Intelligence addendum Phase 1C), `reference` (founder direction: static reference materials like Nicholeen Peck parenting-response skills cards — content to refer to, not interact with).
- **Description:** Orchestrator override from worker's Scope-Creep-Evaluate to Intentional-Document per founder direction 2026-04-20 to codify all 5 extras. Remediation shape matches F30 pattern: one PRD + spec doc pass.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md](scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md) PRD-09B R1.
- **Proposed resolution:** Intentional-Update-Doc. Update PRD-09B + `specs/studio-seed-templates.md` to catalog all 5 extras with their documented use cases. Doc-only pass.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F28] PRD-17 numeric indicator preference deferred to Settings PRD

- **Severity:** Low
- **Location:** PRD-17 §L570 explicitly defers to Settings PRD (PRD-22, future). Breathing glow (Discreet default) is live; Numeric mode has no opt-in path. Not currently in STUB_REGISTRY.
- **Description:** Tied to Settings PRD timeline — surfaces naturally when PRD-22 Settings build kicks off. Not urgent.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md](scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md) PRD-17 R4.
- **Proposed resolution:** Defer-to-Gate-4. Bundle with PRD-22 Settings build (F50).
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F29] PRD-17B MindSweep auto-seed contract unmet — group with halfway-state completion bucket

- **Severity:** Medium
- **Location:** PRD-17B Cross-PRD Impact Addendum requires auto-creation of `mindsweep_settings` + population of `mindsweep_allowed_senders` during family setup. Live schema: 18 `family_members` rows; 0 rows in `mindsweep_settings` + `mindsweep_allowed_senders`.
- **Description:** Addendum contract broken. Founder context 2026-04-20: the 18 family_members predate MindSweep build; even with seed code wired, no backfill would populate pre-existing families. MindSweep is in "halfway state especially email-related" (see [STUB_REGISTRY.md:167](STUB_REGISTRY.md#L167) email forwarding Partially Wired DNS blocker). Remediation groups with broader MindSweep halfway-state completion bucket — auto-seed implementation AND backfill for pre-existing families land together when MindSweep build is finished.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md](scope-2-evidence/EVIDENCE_BATCH_4_tasks-studio.md) PRD-17B R2.
- **Proposed resolution:** Fix Next Build. Group with MindSweep halfway-state completion bucket (auto-seed + backfill + email-forwarding DNS resolution per STUB_REGISTRY L167).
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F30] PRD-10 tracker catalog expansion — codify 17 canonical + 4 extras

- **Severity:** Low
- **Location:** PRD-10 internal contradiction — Overview L18 claims "19 tracker types" while enum L624–629 lists 17. Code ships the 17-value enum plus 4 extras that arrived post-PRD: `randomizer_spinner`, `privilege_status`, `log_learning`, `best_intention`.
- **Description:** Founder confirmed 2026-04-20 all 4 extras are legitimate and should be codified per F27 pattern: `randomizer_spinner` (widget version of randomizer list type), `privilege_status` (permission/access tracking for kids), `log_learning` (homeschool time logging per Build K), `best_intention` (Best Intentions counter/tracker). Same Intentional-Update-Doc shape as F27.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md](scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md) PRD-10 R1.
- **Proposed resolution:** Intentional-Update-Doc. One PRD-10 doc pass to reconcile Overview count and add 4 extras with brief use-case notes. No code changes.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F31] PRD-10 `widget_templates` vs `widget_starter_configs` architectural split

- **Severity:** Low
- **Location:** PRD-10 §Data Schema L596–611 specifies `widget_templates` table; live `widget_templates` has 0 rows with no application-layer consumer. Live `widget_starter_configs` has 39 seeded rows and is consumed by Studio, Dashboard, WidgetPicker, WidgetConfiguration via [src/hooks/useWidgets.ts:115-123](src/hooks/useWidgets.ts#L115).
- **Description:** Architectural split already documented as SCOPE-5.F2 closed finding. `widget_templates` was superseded by `widget_starter_configs`. Code is truth. PRD-10 §Data Schema text update to cite `widget_starter_configs` as shipped truth.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md](scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md) PRD-10 R2. CROSS-REF: SCOPE-5.F2.
- **Proposed resolution:** Intentional-Update-Doc. PRD-10 §Data Schema text update. Doc-only.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F32] PRD-14 `col_span` responsive-section feature unbuilt — will-be-built eventually

- **Severity:** Low
- **Location:** PRD-14 Decision #14 + Cross-PRD Impact Addendum L28–33 specify `col_span` responsive-section rendering. Zero code adoption — sections render full-width as fallback. No STUB_REGISTRY entry.
- **Description:** No functional regression today (full-width fallback renders correctly), but responsive grid utility is lost. Founder direction 2026-04-20: "needs to be fixed eventually" — baked as "will-be-built" flag rather than indefinite polish. May recur across PRD-25/PRD-26 section rendering — PATTERN-FLAG-FOR-SCOPE-3.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md](scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md) PRD-14 R1.
- **Proposed resolution:** Fix Next Build. Add to STUB_REGISTRY so future contributors see it as tracked unbuilt feature rather than forgotten spec text. Low priority registry hygiene recommendation.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F33] PRD-14B schema refactor documentation — 3 Convention-documented deliberate supersessions

- **Severity:** Low
- **Location:** PRD-14B §Data Schema text describes 3 schema fields that differ from live schema: category (text) → `category_id UUID FK` per CLAUDE.md Convention #110; `auto_approve_members` JSONB → UUID[] per Convention #114; `week_start_day INTEGER` column added per Convention #115.
- **Description:** All 3 schema drifts are deliberately superseded via Conventions. Evidence bar per §4.3.2 met (Conventions explicit). Code is truth; PRD-14B §Data Schema text update needed.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md](scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md) PRD-14B R1, R2, R3. SUPERSEDES: CLAUDE.md Conventions #110, #114, #115.
- **Proposed resolution:** Intentional-Update-Doc. PRD-14B §Data Schema text update. Doc-only.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F34] PRD-14B AI intake unbuilt — near-term build priority per founder direction

- **Severity:** Medium
- **Location:** PRD-14B MVP checklist L881–884 3 items missing: `calendar-parse-event` Edge Function absent from all 45 Edge Functions in [supabase/functions/](supabase/functions/); Image-to-Event Screen 6 vision-model flow unbuilt in EventCreationModal; "Help Me Plan This" LiLa Guided Intake + `calendar_event_create` guided mode not seeded in `lila_guided_modes`.
- **Description:** Founder direction 2026-04-20: "this needs to be working" — near-term build priority similar to F22 homeschool reporting. Not urgent blocker, but next-build-queue priority. PATTERN-FLAG-FOR-SCOPE-4 preserved: when vision-model pipeline is eventually built, Scope 4 cost analysis applicable — OpenRouter vision-model per-call cost vs. Haiku text-only extraction cost for the same intake pipeline.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md](scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md) PRD-14B R6, R7, R8.
- **Proposed resolution:** Fix Next Build. Near-term build priority per founder direction. PATTERN-FLAG-FOR-SCOPE-4 preserved for cost analysis when built.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F35] PRD-14C Family Overview polish deferred — 4 UX polish items Post-MVP

- **Severity:** Low
- **Location:** PRD-14C polish items stub-registered Post-MVP per [STUB_REGISTRY.md:315-318](STUB_REGISTRY.md#L315): column drag-to-reorder, section drag-to-reorder, per-column override via long-press gesture, calendar week/month toggle on Family Overview.
- **Description:** Core [FamilyOverview.tsx](src/components/family-overview/FamilyOverview.tsx) surface ships; interaction polish deferred. No functional regression.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md](scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md) PRD-14C R2, R3, R4.
- **Proposed resolution:** Defer-to-Gate-4. Polish pass per STUB_REGISTRY Post-MVP marking.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F36] PRD-25 Guided LiLa Tools unbuilt — active kid demand elevates priority

- **Severity:** Medium (orchestrator escalation from worker's Low per founder active-user-demand signal)
- **Location:** Migration [00000000000013](supabase/migrations/00000000000013_lila_guided_modes_seed.sql) seeds `guided_homework_help` (Socratic homework assistance, Haiku-class) and `guided_communication_coach` (kid-adapted Higgins, Haiku-class) into `lila_guided_modes` (43 rows total) with complete `system_prompt_key` + `opening_messages`. Zero invoking UI — grep for mode keys in `src/` surfaces only type declaration. [STUB_REGISTRY.md:333-334](STUB_REGISTRY.md#L333) marks both ⏳ Unwired (MVP).
- **Description:** Founder direction 2026-04-20: "my son has requested and asked how to use these" — active user demand elevates seeded-but-unwired modes from academic concern to real UX gap. A kid is asking about features that don't launch. The AI infrastructure is ready; consuming Guided shell LiLa modal surface is the missing piece.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md](scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md) PRD-25 R2.
- **Proposed resolution:** Fix Next Build. Wire permission-gated LiLa modals for Guided members on Homework Help + Communication Coach per PRD-25 §AI Integration L520–539. Low code lift, high user value.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F37] PRD-25 + PRD-26 graduation flows unbuilt — Post-MVP

- **Severity:** Low
- **Location:** PRD-25 Screen 7 (Guided→Independent, 5-step tutorial) and PRD-26 Screen 4 (Play→Guided, 4-step tutorial) share same shape: celebration overlay + interactive tutorial + welcome card + `graduation_tutorial_completed` preference. Only the preference flag ships. [STUB_REGISTRY.md:337](STUB_REGISTRY.md#L337) marks "Graduation celebration + tutorial" as 📌 Post-MVP.
- **Description:** Member experience on shell transition is functional (data carries over) without the celebration/tutorial polish. Both PRDs share one finding for the polish gap.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md](scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md) PRD-25 R4 + PRD-26 R4.
- **Proposed resolution:** Defer-to-Gate-4. Post-MVP per STUB_REGISTRY.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F38] PRD-26 reveal architecture superseded by Build M — 5 styles → 2 per-segment

- **Severity:** Low
- **Location:** PRD-26 Screen 2 (Reveal Task Tile Flow L168–221) + Data Schema L329–398 describe 5 reveal styles (`spinner`, `mystery_doors`, `card_flip`, `scratch_off`, `gift_box`) stored in `dashboard_configs.preferences.reveal_tiles[]` — none shipped. Build M (2026-04-11 completed-build record) + CLAUDE.md Convention #215 ship `show_upfront` / `mystery_tap` on `task_segments.randomizer_reveal_style` per-segment. `play_reveal_tiles` feature key ships as PlannedExpansionCard stub.
- **Description:** Architectural supersession with addendum evidence bar met (Convention #215 + Build M completed-build record are explicit architectural decisions). PRD-26 `reveal_tiles` JSONB preferences architecture never shipped. Same shape as F21 addendum-captured supersession.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md](scope-2-evidence/EVIDENCE_BATCH_5_dashboards-calendar.md) PRD-26 R1, R2. SUPERSEDES: Convention #215 + Build M completed-build record. CROSS-REF: PATTERN-FLAG-FOR-SCOPE-3 for PRD-26 `tasks.source='randomizer_reveal'` expectation vs Build J `randomizer_draws` table seam.
- **Proposed resolution:** Intentional-Update-Doc. PRD-26 §Screen 2 + §Data Schema text update. Doc-only.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F39] PRD-15 mom-visibility architecture — three-state observation/private model supersedes Convention #141 strict privacy

- **Severity:** Medium (orchestrator override from worker's Low per founder architectural direction 2026-04-20)
- **Location:** CLAUDE.md Convention #141 ("Mom CANNOT read other members' messages") + PRD-15 §685/§690/§702 describe strict privacy. Current code implements strict privacy via space-membership-only RLS — correct for beta defaults but does NOT match founder intent.
- **Description:** Founder direction 2026-04-20 reshaped this from doc-drift (worker's original Unintentional-Fix-PRD Low) into architectural build. Founder intent: mom decides which conversations she can observe, participants are notified when observation is active, mom can also flag specific conversations/members as private so she cannot observe them. Example given: "mom might observe any conversation that involves Helam or Mosiah, but allow Miriam and Gideon to have privacy." Matches PRD-02 Teen Transparency Panel precedent ("mom decides, privacy transparent to anyone involved"). Convention #141 gets REWRITE, not affirmation. Three-state model: (a) default mom cannot observe (current code), (b) mom opts-in per member/conversation → participants notified observation is active, (c) mom flags specific conversations/members as private → mom cannot observe even if adjacent conversations are observable.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_6_communication.md](scope-2-evidence/EVIDENCE_BATCH_6_communication.md) PRD-15 R6. CROSS-REF: Convention #141, PRD-02 Teen Transparency Panel (Convention #134, PRD-02 §Screen 4), SCOPE-2.F16/F18/F22/F23 partner-share + per-child visibility cross-PRD cascade.
- **Proposed resolution:** Fix Next Build. Remediation scope: new observation flag columns (likely on `conversation_spaces` and/or `member_messaging_permissions`), notification event on observation toggle, Teen Transparency Panel indicator extension, RLS policy expansion so observation-flagged spaces surface to mom, private-flag enforcement so flagged spaces stay hidden even when adjacent ones are observable, Convention #141 REWRITE, PRD §685/§690/§702 rewrite. Current strict version stays for beta defaults — loosening lands with full transparency architecture.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F40] PRD-15 DND non-safety suppression unwired

- **Severity:** Medium (orchestrator escalation from worker's Low per founder "let's fix" direction)
- **Location:** DND toggle UI-complete and stores flag via [NotificationPreferencesPanel.tsx:188-214](src/components/notifications/NotificationPreferencesPanel.tsx#L188). [src/hooks/useNotifications.ts:15-33](src/hooks/useNotifications.ts#L15) sorts by priority DESC (correct for safety-first) but never filters against `notification_preferences.do_not_disturb`. No consumer reads the stored flag.
- **Description:** Convention #143 "Safety alerts always bypass DND" implies the inverse (non-safety respects DND) is baseline. Immediate defect: ~5-line query filter in `useNotifications.ts` + `useUnreadNotificationCount` closes the core suppression. Founder surfaced broader concern 2026-04-20 ("do we have any notifications yet? I don't know how any of that works") indicating the notification surface may be in halfway-state similar to MindSweep (F29) — flagged as Phase 3 production-notification-audit open flag. Shape matches F3 (column-seeded / UI-absent) + F29 (config-flag-stored / filter-absent).
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_6_communication.md](scope-2-evidence/EVIDENCE_BATCH_6_communication.md) PRD-15 R10.
- **Proposed resolution:** Fix Next Build. ~5-line query-filter addition closes the immediate defect. Phase 3 audit: query `notifications` insert log over last 30 days, compare against 13 `notification_type` values in PRD-15, surface halfway-state items.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F41] WIRING_STATUS.md PRD-15 / PRD-16 post-build checklist drift

- **Severity:** Low
- **Location:** [WIRING_STATUS.md](WIRING_STATUS.md) lines 18, 19, 26, 123, 182 still label PRD-15 destinations "Stub — PRD-15 not built" post-Build-G. Line 19 also stale for PRD-16 post-Build-P.
- **Description:** Pure post-build checklist-update miss. Build G shipped PRD-15 full messaging/requests/notifications infrastructure; Build P shipped PRD-16 meetings. WIRING_STATUS.md never updated. Single doc pass closes it.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_6_communication.md](scope-2-evidence/EVIDENCE_BATCH_6_communication.md) PRD-15 R11.
- **Proposed resolution:** Intentional-Update-Doc. Single WIRING_STATUS.md update pass.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F42] PRD-16 meeting_type enum 9→5 override per feature decision 2026-04-14

- **Severity:** Low
- **Location:** PRD-16 §589 spec'd 9 meeting types; [claude/feature-decisions/PRD-16-Meetings.md](claude/feature-decisions/PRD-16-Meetings.md) §Meeting Types feature decision 2026-04-14 reduced to 5 (couple, parent_child, mentor, family_council, custom). weekly_review/monthly_review/quarterly_inventory moved to Rhythms (PRD-18, in Build K Phase B). `business` removed as custom template, not built-in type.
- **Description:** Feature decision file carries the override per PLAN §4.3.2 evidence bar (not the addendum). Different shape from F5 archaeological-table override — F42 is addendum-adjacent-via-feature-decision supersession with extensibility via `custom` type preserved. PRD-16 §589 gets pointer amendment citing feature decision, not a rewrite.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_6_communication.md](scope-2-evidence/EVIDENCE_BATCH_6_communication.md) PRD-16 R1. CROSS-REF: [claude/feature-decisions/PRD-16-Meetings.md](claude/feature-decisions/PRD-16-Meetings.md) §Meeting Types.
- **Proposed resolution:** Intentional-Update-Doc. PRD-16 §589 pointer amendment citing feature decision.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F43] PRD-16 notification enum additions missing from migration 100146 — `completeMeeting.ts` workaround mis-categorises

- **Severity:** Medium
- **Location:** PRD-16 Cross-PRD Impact Addendum §Impact-on-PRD-15 requires 3 new `notifications.notification_type` values (`meeting_reminder`, `meeting_completed`, `meeting_action_routed`) + `notifications.category='meetings'`. Migration [100146](supabase/migrations/00000000100146_prd_16_meetings.sql) applied 2 other addendum enum additions (`calendar_events.source_type='meeting_schedule'` at L301 and `conversation_threads.source_type='meeting_summary'` at L306) but missed the notifications enum additions entirely. [completeMeeting.ts:86-87](src/hooks/useMeetings.ts#L86) workaround uses `notification_type='system'` + `category='tasks'`. Build P verification row 47 passed "Wired — createNotification in completeMeeting" without checking enum-value alignment.
- **Description:** Addendum contract broken + post-build verification let it through + forward-blocker for category-filtered notifications working properly. Functional impact: post-meeting participant notifications arrive correctly; category filter in notification tray miscategorises meeting events under "Tasks" instead of "Meetings." Mirror F19 precedent: do NOT reopen Build P sign-off; flag Build P 127/114/13/0 tally correction as Phase 3 doc-hygiene alongside this feature fix.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_6_communication.md](scope-2-evidence/EVIDENCE_BATCH_6_communication.md) PRD-16 R2. CROSS-REF: Build P completion file at `.claude/completed-builds/2026-04/build-p-prd-16-meetings.md`.
- **Proposed resolution:** Fix Next Build. Small migration (4 enum additions) + 1-line update to [completeMeeting.ts](src/hooks/useMeetings.ts) closes it. PATTERN-FLAG-FOR-SCOPE-3 preserved for post-build-verification enum-alignment miss pattern across Build O/P/Q-class builds.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F44] PRD-16 Build P verification table drift — `GuidedThingsToTalkAboutSection` marked Stubbed but fully built

- **Severity:** Low
- **Location:** [GuidedThingsToTalkAboutSection.tsx](src/components/guided/GuidedThingsToTalkAboutSection.tsx) is fully built — text input, `useAddAgendaItem` with `suggested_by_guided: true`, `useRemoveAgendaItem`, optional TTS support. Build P verification rows 99 and 116 in [claude/feature-decisions/PRD-16-Meetings.md](claude/feature-decisions/PRD-16-Meetings.md) mark it "Stubbed — widget not built."
- **Description:** Post-verification drift only. Correct state is Wired on both rows. Stub count drops from 13 to 11 (or 12 if the two entries consolidate). Same Phase 3 doc-hygiene bucket as F43 Build-P-tally correction flag.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_6_communication.md](scope-2-evidence/EVIDENCE_BATCH_6_communication.md) PRD-16 R5.
- **Proposed resolution:** Intentional-Update-Doc. Update rows 99 + 116 to Wired; correct Build P tally from 127/114/13/0 to 127/116/11/0. Does NOT warrant reopening Build P sign-off per F19 precedent.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F45] PRD-21 AI Toolbox sidebar restoration

- **Severity:** Medium (founder override from worker's Low per active demand signal)
- **Location:** [src/components/shells/Sidebar.tsx:487](src/components/shells/Sidebar.tsx#L487) — AI Toolbox sidebar section removed via undocumented code comment. Originally worker classified Scope-Creep-Evaluate pending founder direction.
- **Description:** Founder override from worker's "codify removal" recommendation to "restore" per direction 2026-04-20: the sidebar removal was a demo-time decision, not a permanent architectural choice. CLAUDE.md Convention #80 ("AI Vault = storefront, AI Toolbox = personalized launcher") remains authoritative. Current production state preserved (AI Vault in all adult/Independent dashboards; mom-only commenting preserved as privacy boundary). Future-state clarification: not all tools are designed for non-mom members, so mom will opt family in per tool — which is precisely why the per-member curated Toolbox launcher matters. Founder product signal: "ideal even now honestly." PATTERN-FLAG-FOR-SCOPE-3 preserved for AI Toolbox cross-PRD integration pattern (PRD-21 default, PRD-21A Vault +Add, PRD-21C `saved_prompt_id` share-from-my-prompts, PRD-34 ThoughtSift tool assignment).
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-21 R2. CROSS-REF: Convention #80.
- **Proposed resolution:** Fix Next Build. Rebuild sidebar section consuming `lila_tool_permissions`, honor `source='default'` (PRD-21 starter 8 tools) + `source='vault'` (Vault-assigned tools) + future `saved_prompt_id` rendering (PRD-21C shared LiLa-customized prompts).
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F46] PRD-34 ThoughtSift `/thoughtsift` route removal — scope creep reverts

- **Severity:** Low
- **Location:** [src/App.tsx:178](src/App.tsx#L178) registers `<Route path="/thoughtsift">`; [src/pages/placeholder/index.tsx:62-64](src/pages/placeholder/index.tsx#L62) exports `ThoughtSiftPage` placeholder.
- **Description:** Founder override from worker's "build landing page" recommendation to "route removal" per direction 2026-04-20: ThoughtSift tools live in AI Vault and launch from the ThoughtSift QuickTasks submenu already. The sidebar route with placeholder was scope creep — PRD-34 never specified a landing page.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-34 R1.
- **Proposed resolution:** Fix Next Build. Delete route registration in [src/App.tsx:178](src/App.tsx#L178) + remove `ThoughtSiftPage` from [src/pages/placeholder/index.tsx:62-64](src/pages/placeholder/index.tsx#L62). Confirm no sidebar nav entry references `/thoughtsift` after removal.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F47] PRD-34 `board_personas` schema split missing — deferred until Channel D

- **Severity:** Low
- **Location:** PRD-34 Cross-PRD Impact Addendum §Platform Intelligence Pipeline v2 mandates `platform_intelligence` schema for system/community tiers + public for `personal_custom`. Migration [00000000100049](supabase/migrations/00000000100049_board_of_directors.sql) ships all personas as single public table with `persona_type` row-level tagging.
- **Description:** RLS + `persona_type` enforce ownership today (personal Grandma Rose personas stay private). Schema split matters when Channel D community-persona promotion pipeline runs (someone creates Gandalf → moderation approves → becomes available to all families). Cheap to defer; fix when community pipeline is built.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-34 R2.
- **Proposed resolution:** Fix Next Build. Deferred until Channel D community-persona promotion pipeline build.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F48] PRD-21B Admin Console unbuilt — beta-deferred per F1/F9/F19 pattern

- **Severity:** Medium
- **Location:** PRD-21B AI Vault Admin — no `/admin` route, no tabbed nav, no vault CRUD UI, no content request queue UI, no analytics, no image manager, no LiLa content suggestions. `staff_permissions` table wired with no consumer. All 17 seeded `vault_items` rows arrived via migrations.
- **Description:** Same shape as F1 (tier monetization) + F9 (Optimizer) + F19 (Family Celebration) beta-deferred-Medium pattern. Every Vault content change currently requires migration/SQL edits.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-21B R1–R5.
- **Proposed resolution:** Defer-to-Gate-4. Build Admin Console Shell (`/admin` route + tab nav + `staff_permissions` gating) as one unit; all 6 PRD-21B screens land together.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F49] PRD-21C Vault Engagement layer unbuilt — mom-only commenting privacy posture preserved

- **Severity:** Medium
- **Location:** PRD-21C AI Vault Engagement & Community — all 6 engagement tables absent (`vault_engagement`, `vault_comments`, `vault_comment_reports`, `vault_moderation_log`, `vault_satisfaction_signals`, `vault_engagement_config`). 4 denormalized counters on `vault_items` migrated but nothing writes to them (always read 0).
- **Description:** Beta-deferred-Medium same as F48. Preserves mom-only commenting posture per current product direction — non-mom members do not comment, keeping discussion space mom-exclusive. Partial forward-prep complete: `shared_with_member_id` + `saved_prompt_id` columns wired for future share-from-my-prompts flow.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-21C R1–R6.
- **Proposed resolution:** Defer-to-Gate-4. Close together with F48 when Vault is worth admin-managed authoring + community is worth social proof.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F50] PRD-22 Settings overlay + embeds deferred — mom-should-not-lose-her-place UX

- **Severity:** Medium (founder severity elevation from worker's Low per "mom should not lose her place. Basically anywhere. That is annoying")
- **Location:** PRD-22 Decision #1 specifies Settings as overlay. [src/components/settings/SettingsProvider.tsx:6](src/components/settings/SettingsProvider.tsx#L6) explicitly documents the deferral. PRD-22 Screens 5, 6, 8, 9 (Permission Hub, Notification Preferences, Calendar Settings, Messaging Settings, LiLa Context Settings) all exist as standalone surfaces; none are embedded within Settings per PRD-22 spec.
- **Description:** Active UX-annoyance demand matches F36 elevation precedent. Consolidates PRD-22 R1 (Settings page vs overlay) + R2 (Permission Hub embed) + R3 (Calendar/Messaging/Notification/LiLa Context Settings embeds). Founder enhancement direction captured as open flag: during "View As" mode, inline permission grant/revoke embeds on each feature page she navigates to — scope addition beyond base PRD-22, post-audit product workstream.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-22 R1 + R2 + R3 (consolidated).
- **Proposed resolution:** Fix Next Build. Build PRD-22 Settings overlay + embeds as one unit; all 5 screens land together. View-As inline permissions flagged as post-audit product workstream beyond base PRD-22.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F51] PRD-22 minor screens deprioritized by founder — 4 amendments

- **Severity:** Low
- **Location:** PRD-22 R4 (account deletion), R5 (data export), R6 (multi-email), R7 (LiLa preferences).
- **Description:** Per founder direction 2026-04-20: (a) account deletion — NO self-serve deletion; users cancel subscriptions with data preserved; manual deletion with grace period only on request — PRD-22 Screen 2 spec amended; (b) data export — "not the biggest priority for me. My focus is making things as great as they can be while on the app"; (c) multi-email — "not too worried yet"; (d) LiLa Preferences UI — "should probably be built when we build the core lila features that I believe are still unbuilt" — bundles with F9 PRD-05C Optimizer build queue. Severity dropped from per-row Medium (R4/R5 originally compliance-adjacent) to Low via founder deprioritization. Manual deletion workflow documentation flagged for Phase 3 so beta users have a visible account-closure path.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-22 R4 + R5 + R6 + R7 (consolidated). CROSS-REF: SCOPE-8a.F2 (data-lifecycle compliance scope) — original R4/R5 compliance-adjacency deprioritized per founder amendment 2026-04-20.
- **Proposed resolution:** Defer-to-Gate-4. No self-serve account deletion; manual admin-triggered with grace period. PRD-22 Screen 2 spec amendment. Phase 3 open flag: beta users need visible path to "how do I close my account?" copy pointing to support email.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F52] PRD-21A Optimize with LiLa stub — gated on F9 Optimizer build

- **Severity:** Low
- **Location:** [PromptPackDetail.tsx:148-168](src/features/vault/components/detail/PromptPackDetail.tsx#L148) — `OptimizeButton` is an explicit STUB with "coming soon" tooltip and TODO comment. Archives side (`reference_photos`, `physical_description` on `archive_member_settings`) fully wired.
- **Description:** Gated on F9 PRD-05C Optimizer Edge Function build. Archives side wired; dependency-gated.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-21A R4.
- **Proposed resolution:** Defer-to-Gate-4. Bundle with F9 PRD-05C Optimizer build.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F53] PRD-21A Deploy with LiLa skill stub — gated on F9 + External Tool Registry

- **Severity:** Low
- **Location:** [SkillDetail.tsx:32](src/features/vault/components/detail/SkillDetail.tsx#L32) — "Deploy with LiLa" button handler is `alert('Coming soon!')`. Platform download/copy buttons functional for raw skill use.
- **Description:** Same shape as F52. Premium personalized flow + session report re-import pipeline gated on F9 Optimizer + External Tool Registry infrastructure (PRD-05C + PRD-19 per PRD-21A Forward Note).
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-21A R5.
- **Proposed resolution:** Defer-to-Gate-4. Bundle with F9 + External Tool Registry.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F54] PRD-21 skill-check mode missing for Cyrano + Higgins Say

- **Severity:** Low
- **Location:** Core craft-first flow in `lila-cyrano` + `lila-higgins-say` wired. Skill-check branch (5+ interaction threshold) absent. No STUB_REGISTRY entry.
- **Description:** Founder direction 2026-04-20: "isn't necessary yet... eventually I'd like them to be able to utilize this, and be coached through finding their own words to use." Confirms PRD-21 intent (make-itself-unnecessary coaching flow). Core craft-first flow wired; skill-check 5+-interaction branch is advanced-stage polish.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-21 R6.
- **Proposed resolution:** Defer-to-Gate-4. Add to STUB_REGISTRY during remediation queue alongside F32 col_span recommendation — same shape.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F55] PRD-21 Higgins display name seed registry drift

- **Severity:** Low
- **Location:** [supabase/migrations/00000000000007_lila_ai_system.sql:233-234](supabase/migrations/00000000000007_lila_ai_system.sql#L233) seeds `lila_guided_modes.display_name` "What to Say" / "How to Navigate"; PRD-21 + QuickTasks labels specify "Help Me Say Something" / "Help Me Navigate This."
- **Description:** Two-layer divergence: user-visible QuickTasks submenu correct; `lila_guided_modes.display_name` column wrong. Any surface reading `display_name` shows wrong names (conversation history, mode switcher, any future registry-driven UI). Cheapest fix in Batch 7.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-21 R3.
- **Proposed resolution:** Fix Next Build. One-line UPDATE migration — `UPDATE lila_guided_modes SET display_name` for the two `mode_key` rows.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F56] PRD-23 Cross-PRD Impact Addendum `bookshelf_principles` → `bookshelf_insights` rename drift

- **Severity:** Low
- **Location:** PRD-23 Cross-PRD Impact Addendum references `bookshelf_principles` at lines 36–46 + 172–180; base PRD-23 §Data Schema L623–657 and code both use `bookshelf_insights`.
- **Description:** Same pattern as F21 — addendum-properly-captured supersession with base-PRD pointer amendment. One-line addendum text amendment closes it. Pure doc drift.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-23 R1.
- **Proposed resolution:** Intentional-Update-Doc. One-line addendum amendment.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F57] PRD-23 `SemanticSearchPanel` app-wide hook zero external consumers

- **Severity:** Low
- **Location:** `useSemanticSearch()` hook + `SemanticSearchPanel` exist per PRD-23-Session-Addendum §4 with 8-feature integration map (Safe Harbor, InnerWorkings, Journal, Tasks, Family Context, LifeLantern, Meetings + BookShelf). Only BookShelf consumes today.
- **Description:** Founder direction 2026-04-20: "Would like semantic search to be useable whenever/wherever it would be valuable to user." Confirms addendum's 8-feature integration map. Hook architecture correct; each consumer wires during its own feature build phase.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md](scope-2-evidence/EVIDENCE_BATCH_7_vault-bookshelf.md) PRD-23 R3. PATTERN-FLAG-FOR-SCOPE-3 preserved (each consumer-PRD integration is a Scope 3 seam).
- **Proposed resolution:** Defer-to-Gate-4. Each consumer wires during own feature build phase.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F58] PRD-24 reward economy unbuilt — near-term lego-piece connector

- **Severity:** Medium
- **Location:** 7 of PRD-24's 8 tables absent + 6 screens absent + DailyCelebration Step 3/4 auto-skipped.
- **Description:** Founder direction 2026-04-20: "Reward economy, that should be a lego piece as well, that can plug into any/all relevant lists, tasks, routines, best intentions, goals, etc." Shifted from F1/F9 "when paid tiers ship" pattern to F22/F34 "near-term roadmap with cross-feature composability" pattern. Remediation scope: not just Screen 3 reward menu — reward containment + treasure box + reward redemption as cross-feature connectors that plug into any task/list/routine/best-intention/goal source. 7 tables still planned ("We do still plan to have a lot of the other tables, most all of those" per founder). Build M deferred this as baby-step scope cut per feature decision file §6.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_8_gamification.md](scope-2-evidence/EVIDENCE_BATCH_8_gamification.md) PRD-24 R1, R2, R3, R4, R5, R7 + PRD-24A R4.
- **Proposed resolution:** Fix Next Build. Build when founder prioritizes reward economy onto the active queue. Cross-feature composability as remediation scope.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F59] PRD-24 pipeline + settings panel superseded by Build M

- **Severity:** Low (orchestrator severity override from worker's Medium per F21 precedent)
- **Location:** PRD-24 §Gamification Event Pipeline L596–623 + §Screen 8 Settings Panel L462–502. Build M shipped 11-step RPC pipeline + 6-section settings modal via CLAUDE.md Conventions #198–207 + #221.
- **Description:** Conventions captured Build M's architectural pivot. Same rationale as F21 ("addendum-captured supersession does not harm more than text-stale other PRDs") — Low not Medium. PRD-24 text stays with pointer amendment citing Conventions, not rewrite.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_8_gamification.md](scope-2-evidence/EVIDENCE_BATCH_8_gamification.md) PRD-24 R9, R10. SUPERSEDES: Conventions #198–222.
- **Proposed resolution:** Intentional-Update-Doc. PRD-24 §Gamification Event Pipeline + §Screen 8 Settings Panel pointer amendment citing Conventions #198–222. Doc-only.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F60a] PRD-24A dashboard backgrounds → Sticker Book pages supersession

- **Severity:** Low
- **Location:** PRD-24A §Data Schema L1122–1139 + L1232–1252 describe `dashboard_backgrounds` + `background_library` (13 seeded backgrounds) as dashboard-wide overlay/background. Build M shipped `gamification_sticker_pages` (26 rows) as the kid-facing sticker book scene per Conventions #198–207.
- **Description:** Clean subset supersession per founder 2026-04-20: "The only thing we kind of changed was the sticker book background pages instead of the background being an overlay/background for the entire dashboard." `dashboard_backgrounds` + `background_library` specifically replaced by `gamification_sticker_pages`.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_8_gamification.md](scope-2-evidence/EVIDENCE_BATCH_8_gamification.md) PRD-24A R1 (subset). SUPERSEDES: Conventions #198–207.
- **Proposed resolution:** Intentional-Update-Doc. PRD-24A §Data Schema L1122–1139 + L1232–1252 pointer amendment.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F60b] PRD-24A overlay engine deferred indefinitely — pause, maybe never

- **Severity:** Medium
- **Location:** PRD-24A overlay engine: `overlay_instances` + `overlay_collectibles` + `recipe_completions` subset — dashboard-wide narrative game layer with 4-stage progression, category-to-collectible mapping, stage evolution animations.
- **Description:** Founder direction 2026-04-20: "The overlay engine I'd like to pause on, I don't want it deleted forever, but I do want it deferred as an idea to possibly implement at a much later date. Maybe never..." Distinct from F60c — overlay engine specifically is paused indefinitely. Sticker Book (F60a) substitutes as kid-facing mechanic. Not deleted, not near-term. Medium severity acknowledges scope of architecture paused (3 tables + entire engine concept).
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_8_gamification.md](scope-2-evidence/EVIDENCE_BATCH_8_gamification.md) PRD-24A R1 (subset). Feature decision file documents Override #1 (Sticker Book replaces overlay 4-stage progression).
- **Proposed resolution:** Defer-to-Gate-4. STUB_REGISTRY entry with "deferred indefinitely — possibly never" framing to distinguish from active-roadmap F60c entries.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F60c] PRD-24A themes + game modes + Game Modes Addendum tables on active roadmap

- **Severity:** Medium
- **Location:** 5 launch visual themes (Pets, Apothecary Bottles, Dragons, Pixel Loot, Mythical Creatures) + 7 game modes (Daily Growth, Category Collection, Recipe & Quest, Stamp Passport, Streak Evolution, Boss Battle/Party Quest, Family Bingo) + PRD-24A-Game-Modes-Addendum tables (`boss_quests`, `bingo_cards`, `evolution_creatures`, `passport_books`) + LiLa bingo/boss/passport generation. [STUB_REGISTRY.md:239-243](STUB_REGISTRY.md#L239) currently marks Post-MVP.
- **Description:** Founder direction 2026-04-20: "All of the other themes and game modes are still needing to be built. They need to be on the roadmap. All of those... Ideally, some of the same images made in each theme can be used in different ways for different game modes, so woodland felt could be a bingo theme, or a recipe thing at some point, or a sized collection by however much they accomplish that day, etc." F22/F34 near-term-roadmap pattern. Woodland Felt asset reuse across game modes confirmed as founder architectural intent (modular Visual Theme × Game Mode per PRD-24A).
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_8_gamification.md](scope-2-evidence/EVIDENCE_BATCH_8_gamification.md) PRD-24A R2, R3, R5 + Game Modes Addendum tables.
- **Proposed resolution:** Fix Next Build. STUB_REGISTRY L239-243 Post-MVP entries upgrade to "active roadmap" framing. Near-term roadmap.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F61] PRD-24B reveal library needs cross-feature lego wiring

- **Severity:** Medium
- **Location:** 4 CSS/SVG reveals (CardFlipReveal, ThreeDoorsReveal, SpinnerWheelReveal, ScratchOffReveal) + 4 micro-celebrations (PointsPopup, StreakFire, LevelUpBurst, BackgroundCelebration) + StarChartAnimation + TreasureBoxIdle + ReadabilityGradient all ~500 lines of production-quality shell-aware React code consumed only by `/dev/gamification` demo. [RewardRevealModal.tsx:314](src/components/reward-reveals/RewardRevealModal.tsx#L314) placeholder comment ("For now, render a generic animation. Phase 4 or later can wire the named components") is the explicit hook point. Parallel architecture: `reward-reveals/` (5 tables, 33 `reveal_animations` seeded).
- **Description:** Orchestrator classification flip from worker's Deferred-Document to Unintentional-Fix-Code per founder direction 2026-04-20: "The gamification reveal library needs to be connected as additional lego pieces to different tasks or streams of tasks. So mom can have an opportunity list, or a sequential list, and every [choose number] they can do a reveal for a prize, or mom can have a randomized list of consequences and decide whether she wants that hooked to a card reveal, the doors, scratch off, or spinner, or a rotation of all of those... It has not been wired, but all of the pieces of the app should work together like buildable blocks that can connect at several points or at any point with each other. A routine could have one item on it connected to a sequential list, another attached to a randomized opportunity list, etc. It is not currently that way, but it needs to be. asap." Active builder direction to wire as cross-feature connector — severity Medium, NOT delete dead code. Open architectural question: reward-reveals/ parallel architecture (reward_reveals + reward_reveal_attachments + reveal_animations 33 rows + earned_prizes + congratulations_messages) — merge or coexist. Pre-build decision required before F61 implementation kicks off.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_8_gamification.md](scope-2-evidence/EVIDENCE_BATCH_8_gamification.md) PRD-24B R1, R2, R4, R5. PATTERN-FLAG-FOR-SCOPE-3 gamification-as-lego-pieces.
- **Proposed resolution:** Fix Next Build. Pre-build architectural reconciliation decision required (merge reward-reveals/ + gamification/reveals/ into single lego-piece architecture vs. coexist for different purposes). `lists.reveal_type` dormant column (migration 00000000000008:310) wires to the reveal library at build time; PRD-24 text stale `reveal_visual` references update as part of F61 remediation.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F62] PRD-24B Color Reveal needs fuller lego-connector architecture

- **Severity:** Medium
- **Location:** Build M Conventions #211–213 shipped 1:1 task-linked tally counter (4-field config, 6 step-count variants, 32 Woodland Felt subjects). PRD-24B Screen 10 original model: any achievement source + Sequential/Gradual/Random strategies + complexity 1–5 with 3–100 zones.
- **Description:** Orchestrator classification flip from worker's Intentional-Document to Unintentional-Fix-Code per founder direction 2026-04-20: "I would like color reveal to also be able to connect to multiple tasks [click all that apply] or attach to streaks, book chapters, or any type of list etc. It would again be like a lego piece connector that mom can connect anywhere to anything..." Build M Conventions #211–213 are NOT final — baby-step simplification. Full architecture restores PRD-24B Screen 10 rich model AND expands to multi-task click-all-that-apply, streak milestones, book chapter completions, any list type.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_8_gamification.md](scope-2-evidence/EVIDENCE_BATCH_8_gamification.md) PRD-24B R3.
- **Proposed resolution:** Fix Next Build. Conventions #211–213 amendment/retirement when F62 ships. STUB_REGISTRY color-reveal entry updates from "deferred expansion" to "wired as cross-feature connector" at build completion.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F63] PRD-24 screen features unbuilt — 5 viz modes ship 1, level threshold dormant, leaderboard scaffolding only

- **Severity:** Low
- **Location:** PRD-24 specifies 5 Points widget visualization modes (Counter, Level, Progress Ring, Minimal Badge, Hidden); code ships Counter only (Play-only). `gamification_configs` shipped full PRD-24 schema but 80% of columns dormant — `visualization_mode`, `bonus_at_three`, `bonus_at_five`, `routine_points_mode`, `streak_schedule_aware`, `streak_pause_enabled`, `streak_paused`, `streak_paused_at`, `level_thresholds` all read zero times. `gamification_level` column dormant — no level threshold logic. Family Leaderboard widget type registered in [src/types/widgets.ts:389](src/types/widgets.ts#L389) but percentage-based ranking + period toggle + Play collaborative framing missing.
- **Description:** Schema-ready, code-dormant. Same F2/F16/F32 gate-adoption pattern. Founder roadmap intent (per F60c) restores these columns to active roadmap as broader gamification system expands.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_8_gamification.md](scope-2-evidence/EVIDENCE_BATCH_8_gamification.md) PRD-24 R6, R7, R8, R11.
- **Proposed resolution:** Fix Next Build. Fix when roadmap-relevant; surfaces naturally during F58 reward economy build.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F66] PRD-27 Caregiver Tools unbuilt — Enhanced-tier flagship

- **Severity:** Medium
- **Location:** PRD-27 Caregiver Tools — purpose-built CaregiverLayout two-view model (Caregiver View + Kid View), swipeable columns, trackable event logging, LiLa-compiled shift reports all absent. 3 tables absent (`trackable_event_categories`, `trackable_event_logs`, `shift_reports`). Only infrastructure shipped: `shift_sessions.is_co_parent_session` column (PRD-27 L429 addition).
- **Description:** Same shape as F1/F9/F19 pattern — Enhanced-tier flagship unbuilt, honest PlannedExpansionCard stub registered per Convention #31, beta-deferred. Most beta families won't have babysitters/grandma/aide/co-parent during beta window. When PRD-27 build kicks off, Scope 3+8b integration with PRD-02 permissions + PRD-15 messaging + PRD-25/26 Kid View rendering verified at pre-build audit.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_9_compliance.md](scope-2-evidence/EVIDENCE_BATCH_9_compliance.md) PRD-27 R1, R2, R4, R5, R6.
- **Proposed resolution:** Defer-to-Gate-4. Tier-monetization-stack shape.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F67] PRD-29 BigPlans unbuilt — Enhanced-tier flagship

- **Severity:** Medium
- **Location:** PRD-29 BigPlans. 5 tables absent (`plans`, `plan_milestones`, `plan_components`, `plan_check_ins`, `friction_diagnosis_templates`). 4 guided modes (`bigplans`, `bigplans_goal`, `bigplans_project`, `bigplans_system`) unseeded. `bigplans-compile` Edge Function absent.
- **Description:** Same shape as F66. Planning/system-design tool (Friction Detective diagnostic with four-category taxonomy, goal backward-planning, multi-track projects, trial period with check-ins) entirely absent. Cross-coupling: PRD-12A LifeLantern goal decomposition stub routes to BigPlans (PRD-29 Cross-PRD Impact Addendum §PRD-12A); PRD-09A `tasks.related_plan_id` column + `source='project_planner'` enum value ARE pre-wired stub sockets. No urgency during beta.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_9_compliance.md](scope-2-evidence/EVIDENCE_BATCH_9_compliance.md) PRD-29 R1, R2, R3, R4.
- **Proposed resolution:** Defer-to-Gate-4. Enhanced-tier flagship; couples with PRD-12A goal decomposition stub.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F68] PRD-37 Family Feeds unbuilt — pair with PRD-28B build-order

- **Severity:** Medium
- **Location:** PRD-37 Family Feeds. 6 tables absent (`family_moments`, `moment_media`, `moment_reactions`, `moment_comments`, `out_of_nest_feed_settings`, `feed_approval_settings`). `homeschool_bulk_summary` guided mode unseeded. `/feeds` renders honest FamilyFeedsStub PlannedExpansionCard.
- **Description:** Same shape as F66/F67. Family Life Feed + Homeschool Portfolio Feed + Out of Nest adult-child PWA entry point all absent. Paired in build order with PRD-28B Compliance Reporting per shared addendum — PRD-28B merge-vs-separate prerequisite decision preserved in open flags (defer to F22 pre-build audit when PRD-19 reports pipeline kicks off, 2–3 month horizon).
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_9_compliance.md](scope-2-evidence/EVIDENCE_BATCH_9_compliance.md) PRD-37 R1, R2, R3.
- **Proposed resolution:** Defer-to-Gate-4. PRD-28B merge-vs-separate prerequisite decision preserved in open flags. Pairs with F22 build in 2–3 month horizon.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F69] PRD-38 Blog (Cookie Dough & Contingency Plans) unbuilt — pre-paid-launch prerequisite

- **Severity:** Medium
- **Location:** PRD-38 Blog at aimagicformoms.com. 5 tables absent (`blog_posts`, `blog_engagement`, `blog_comments`, `blog_free_tools`, `blog_categories`). Zero Supabase Storage buckets. No domain routing between aimagicformoms.com + myaimcentral.com. No `blog-comment-moderate` / `blog-publish-scheduled` Edge Functions.
- **Description:** Same shape as F66/F67/F68 but distinct timing context. Public marketing blog — the Pinterest traffic funnel, SEO surface, free-tools hub, founder-voice customer-acquisition hook — entirely unbuilt. Pre-launch stack finding — pairs with F1 (tier monetization) + F2 (gate adoption) + F3 (access-level picker) as pre-paid-launch prerequisite. Not beta blocker (beta ships without a public site); becomes prerequisite when pricing goes live. Founder's "100 founding family" customer-acquisition funnel requires F69 operational.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_9_compliance.md](scope-2-evidence/EVIDENCE_BATCH_9_compliance.md) PRD-38 R1, R2, R3.
- **Proposed resolution:** Defer-to-Gate-4. Pre-paid-launch prerequisite stack with F1/F2/F3; beta ships without this. Becomes blocker when pricing goes live.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### [SCOPE-2.F70] PRD-35 `access_schedules` field-name drift

- **Severity:** Low
- **Location:** PRD-35 §Data Schema L326–343 specifies `access_schedules.special_adult_id UUID NOT NULL` + `recurrence_data JSONB`. Migration [00000000000004_universal_scheduler.sql:13-22](supabase/migrations/00000000000004_universal_scheduler.sql#L13) ships `member_id` + `recurrence_details`; remediation migration 00000000000019 added missing `schedule_name`/`start_time`/`end_time` columns but did not rename the base two. Consumer code consistent.
- **Description:** Pure PRD-text-stale-doc-drift. Neither PRD-27 Cross-PRD addendum nor CLAUDE.md Convention #26 reference the column names literally. Same shape as F24 (PRD-09A task_queue naming staleness) — one-line PRD-35 amendment closes it. Coupling note: PRD-35 amendment per F70 should land before or concurrent with F66 PRD-27 build so PRD-27 implementation reads correct field names.
- **Evidence:** [scope-2-evidence/EVIDENCE_BATCH_9_compliance.md](scope-2-evidence/EVIDENCE_BATCH_9_compliance.md) PRD-35 R1. SUPERSEDES: current live schema per migrations 00000000000004 + 00000000000019.
- **Proposed resolution:** Intentional-Update-Doc. One-line PRD-35 amendment.
- **Founder decision required:** N
- **Beta Readiness flag:** N

### Scope 2 batch hygiene notes (not findings — doc/registry one-line corrections)

Captured here for completeness; each is a one-line amendment scheduled for Phase 3 doc-hygiene triage, not a standalone finding:

- **Batch 1:** PRD-01 §Data Schema L424 calls the column `auth_user_id`; live schema uses `user_id`. One-line PRD-01 text amendment.
- **Batch 9:** [STUB_REGISTRY.md:516](STUB_REGISTRY.md#L516) claims "Subject Tracking section in TaskCreationModal" is Unwired (MVP); code reality at [TaskCreationModal.tsx:1947-1966](src/components/tasks/TaskCreationModal.tsx#L1947) shows it wired via `countsForHomework` + `homeworkSubjectIds`. One-line STUB_REGISTRY amendment: flip row 516 from Unwired (MVP) to Wired.

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
