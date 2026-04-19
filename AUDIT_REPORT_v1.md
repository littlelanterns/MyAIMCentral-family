# AUDIT_REPORT_v1.md

> Phase 2 Architectural Audit — MyAIM Central family platform
> Audit window opened: 2026-04-18
> Coordinated via: [claude/web-sync/AUDIT_PARALLEL_PLAN.md](claude/web-sync/AUDIT_PARALLEL_PLAN.md)
> Gameplan: [MYAIM_GAMEPLAN_v2.2.md](MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 284-351)
> Status: **IN PROGRESS — Stage A mid-stage; AURI OAuth complete, Convention 242 inverted mid-audit (2026-04-18)**

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
| endor-cli-tools MCP (AURI) | ✓ Connected at user scope, OAuth completed 2026-04-18 | First-call browser OAuth completed successfully this session. Smoke test (`lodash@4.17.20`) returned real vulnerability data (5 GHSA IDs). Retroactive scan ran to completion (exit 0) but produced empty findings output — see SCOPE-1.F5. |
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

### [SCOPE-1.F5] AURI retroactive scan exit 0 but empty findings output

- **Severity:** High (Scope 1 sub-check per gameplan line 298 — scan must produce usable findings)
- **Location:** `audit-logs/auri-retro-scan.log` (29 bytes: `INFO: Linter scans complete`); no SARIF file produced at `audit-logs/auri-retro-scan.sarif` despite `--sarif-file` flag; command: `endorctl scan --path . --quick-scan --dependencies --secrets --local --ai-models --languages typescript,javascript --tags "audit-2026-04-18,stage-a,phase-2" -o summary --sarif-file audit-logs/auri-retro-scan.sarif`
- **Description:** After AURI OAuth and smoke test confirmed the tool is authenticated and returning real data for individual queries, the repo-wide retroactive scan was launched as a background shell job. Exit code 0, background task completed normally. Log output contains only `INFO: Linter scans complete` — no dependency findings, no secret findings, no AI-model findings, no SAST findings, no SARIF file written. Three hypotheses: **(H1)** Developer Edition routes findings to Endor's web dashboard only (local CLI does not surface them); **(H2)** `-o summary` output format silently suppresses detail and `--sarif-file` failed to write (Windows path handling? permission?); **(H3)** `--quick-scan` skipped the subsystems that actually produce findings. None of these have been disproven.
- **Evidence:** Log file at 29 bytes. SARIF file absent from `audit-logs/` directory. Exit 0 from background task. Smoke test returned real data, confirming the CLI is authenticated and capable.
- **Proposed resolution:** **Founder decision required.** Options: (a) re-run with `-o json` or `-o table-verbose` plus stdout redirect (fastest, verifies output-format hypothesis); (b) re-run via MCP `mcp__endor-cli-tools__scan` tool with scoped `include_path` for PRD-01, PRD-02, PRD-05, Edge Functions (blocks conversation for scan duration but returns findings inline); (c) check Endor Labs web dashboard for the scan results; (d) inspect whether `--sarif-file` needs an absolute path on Windows. Proposed default if no guidance: (a) first, then escalate to (b) if (a) is still empty.
- **Founder decision required:** **Y** — which re-run path to take, or whether to accept empty and move on
- **Wizard Design Impact:** N/A
- **Beta Readiness flag:** **Y** — `COMPLIANCE_READINESS_REPORT.md` cannot be populated with AURI data until this resolves

---

## 5 — Scope 5: Stub registry reconciliation

Status: **IN PROGRESS** (paused mid-verification for Convention 242 inversion commit — see SCOPE-1.F4).

**Read in full 2026-04-18:** `STUB_REGISTRY.md` (547 lines, ~224 entries; summary counts: ~92 Wired, ~3 Partially Wired, ~42 Unwired-MVP, ~84 Post-MVP, ~3 Superseded). Full content ingested for cross-check against WIRING_STATUS.md (CLAUDE.md-embedded) and against code/migration reality.

### Preliminary discrepancy flagged (verification pending)

**Backburner/Ideas system list auto-provision — STUB_REGISTRY vs. WIRING_STATUS disagreement.**

- **STUB_REGISTRY.md line 398:** `System list auto-provision (Backburner, Ideas) | PRD-09B | — | ⏳ Unwired (MVP) | Phase 10+`
- **WIRING_STATUS.md (embedded in CLAUDE.md context):** Claims both Backburner and Ideas are `Auto-Created: Yes (auto_provision_member_resources trigger)` with Status `Wired`.
- **CLAUDE.md Convention 19:** Describes `auto_provision_member_resources` trigger as creating "an archive folder + dashboard_config for every new `family_members` insert. No manual creation needed." Does NOT explicitly mention Backburner/Ideas list creation — silent on that aspect.

**Verification needed:** inspect the actual trigger definition in the Supabase migrations to confirm which doc is correct. Intended approach used `mgrep` for the trigger body; blocked by spend limit. Post-convention-commit, verification resumes with Grep/Glob on the supabase migrations directory.

### Remaining Scope 5 work

Full line-by-line reconciliation of all 224 entries against code reality. Plan after convention commit: batch Grep/Glob-based spot-checks on a representative subset — every ⏳ Unwired-MVP entry (42 items) gets a "does it actually exist in code yet?" check; every ✅ Wired entry gets a random-sample spot-check (~10% sample). Entries that fail the spot-check become SCOPE-5.F{N} findings.

## 8a — Scope 8a: Binary compliance/safety checklist

*Not yet started. Stage B.*

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

**Scan 1 (2026-04-18):** Repo-wide quick scan. Command: `endorctl scan --path . --quick-scan --dependencies --secrets --local --ai-models --languages typescript,javascript --tags "audit-2026-04-18,stage-a,phase-2" -o summary --sarif-file audit-logs/auri-retro-scan.sarif`. Background task `bbxkhcyfo` completed with exit 0. Log output (29 bytes total): `INFO: Linter scans complete`. SARIF file not produced. See SCOPE-1.F5 for the empty-output question and proposed re-run paths.

Smoke test (pre-scan, 2026-04-18): `check_dependency_for_vulnerabilities` on `lodash@4.17.20` returned 5 GHSA IDs, `is_vulnerable: true`, `latest_version: 4.18.1`. Tool is authenticated and capable — empty scan output is a scan-configuration or output-format issue, not an auth issue.

## Appendix B — Wizard Design Impact index

*Populated as findings accumulate. Currently empty.*

## Appendix C — Beta Readiness flag index

| Finding ID | Scope | Title | Notes |
|---|---|---|---|
| SCOPE-1.F3 (RESOLVED) | 1 | AURI retroactive scan blocked on first-call OAuth in fresh session | Closed 2026-04-18 — scan ran, but empty output question moved to SCOPE-1.F5 |
| SCOPE-1.F5 | 1 | AURI retroactive scan exit 0 but empty findings output | Blocks `COMPLIANCE_READINESS_REPORT.md` AURI section until resolved — founder decision on re-run path pending |

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
| AURI retroactive scan kickoff | ✅ Ran (exit 0) but empty findings output — SCOPE-1.F5 | Background task `bbxkhcyfo` completed; log is 29 bytes, no SARIF. Founder decision needed on re-run path. |
| Convention 242 inversion (mid-stage) | 🚧 Landing this commit | SCOPE-1.F4. mgrep Scale tier burned $36.54 in 36h, projecting $300+/month. Downgraded to free tier; convention flipped to Grep/Glob primary; LESSONS_LEARNED "Convention Cost Evaluation" pattern added. |
| Scope 5 — stub registry reconciliation | 🚧 In progress | STUB_REGISTRY.md read in full (547 lines, 224 entries). 1 discrepancy flagged (Backburner/Ideas auto-provision). Verification paused mid-stage for convention commit; resumes after with Grep/Glob. |
| Stage A review pause | ⏳ Pending | After Scope 5 completes and SCOPE-1.F5 resolves. |
