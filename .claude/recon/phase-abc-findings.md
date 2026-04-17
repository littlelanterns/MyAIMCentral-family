# Phase 0.25 Reconnaissance — Phase A/B/C Findings (Working Material)

> **Not the final report.** This is raw source material for Phase F synthesis into `RECONNAISSANCE_REPORT_v1.md`.
> Session that produced this: 2026-04-16 evening. Closed at end of Phase C.
> DO NOT FIX any of these findings here. Recon only. Fix pass is Phase 0.26.

---

## HANDOFF TO D+E SESSION

- **Phases complete:** A (Tool ground truth), B (17 followups classification), C (Doc reconciliation)
- **Findings live:** this file — `.claude/recon/phase-abc-findings.md`
- **Two broken-but-documented tools (DO NOT re-investigate or fix):**
  1. **codegraph MCP** — orphaned mkdir-lock, regresses on ungraceful shutdown. Full diagnosis in §Codegraph-Regression below. Symptomatic fix = `rm -rf .codegraph/codegraph.db.lock`. NOT fixed this session — founder wants root-cause understood first.
  2. **npm/nvm4w PATH** — `node` works, `npm`/`npx` fail with `Cannot find module npm-cli.js`. nvm4w has incomplete install state. Full diagnosis in §Phase-A Item-2. Documented for separate backup-diagnose-fix-verify sequence.
- **Use `mgrep` for cross-file search, NOT codegraph.** mgrep was refreshed this session (Scale tier, full index) and is green. Wizards directory verified 99%+ matches.
- **Phase D+E scope:** `MYAIM_GAMEPLAN_v2.2.md` lines 152-190. D = compliance/safety architecture gap analysis (PRD-20, PRD-30, PRD-05, PRD-02). E = wizard work state check (commit 21a47a1).
- **Phase F = synthesize all findings (A-E) into `RECONNAISSANCE_REPORT_v1.md` at repo root.** Not yet written.
- **CONVERSATION_CONTEXT.md** at repo root also contains founder's context framing. Already committed 855246c.
- **CURRENT_BUILD.md commit at end:** commit 855246c included CONVERSATION_CONTEXT.md only. This findings file + Phase D/E/F work should be bundled when founder approves push.

---

## PHASE A — Tool Ground Truth

### A1. codegraph MCP — REGRESSION (time-sensitive, see §Codegraph-Regression)
- **Evidence:** `claude mcp list` shows `✓ Connected`. But `mcp__codegraph__codegraph_status` returns `CodeGraph not initialized for this project`. Direct CLI `codegraph status` returns `✗ Failed to get status: database is locked`.
- **Severity:** High (structural recurring pattern, not one-time drift)
- **Proposed handling:** Three-part per founder direction — (a) symptomatic fix recipe documented, (b) operational mitigation via Step 0 hard-gate probe for orphaned lock dir, (c) upstream issue to codegraph about PID-less mkdir-locks and graceful shutdown on SIGKILL.
- **This is the second instance of "verified green in morning, broken by evening" today** (first was npm/nvm4w). Flag in Phase F synthesis as structural volatility pattern — April 16 sweep's assumption that tools stay green between sweeps is wrong.

### A2. mgrep CLI — GREEN (F10 RESOLVED)
- **Evidence:** Probes on post-Mar-28 identifiers returned 99%+ matches: `MeetingSetupWizard.tsx` 99.03%, `UniversalListWizard.tsx` 98.76%, `StarChartWizard.tsx` 99.14%. April 16 sweep's "yellow" observation on wizards directory is now clear.
- **Hypothesis confirmed:** async embedding lag on Apr 14-15 files had caught up by this session.
- **Severity:** Resolved — close F10.

### A3. AURI (endor-cli-tools) — correctly absent, SKILL.md drift flagged
- **Evidence:** `claude mcp list` output does NOT include endor-cli-tools. Binary at `C:/Users/tenis/AppData/Roaming/npm/bin/endorctl.exe` exists (323MB, Apr 16 11:45 timestamp), version v1.7.932, `--version` works without npm dependency, `auth --print-access-token` returns "no credentials found" (matches F1 precondition Step 2).
- **New finding:** `.claude/skills/prebuild/SKILL.md` still lists AURI as required hard-gate tool with "connection alone accepted until account setup" language. AURI has been formally disabled (removed from user-scope), so a future `/prebuild` invocation would either halt at Step 0 looking for the missing MCP, or silently skip because the current skill text assumes it's registered.
- **Severity:** Medium (doc drift; Step 0 would behave inconsistently with current reality)
- **Proposed handling:** Phase 0.26 SKILL.md update — replace AURI row with disabled-state acknowledgment plus F1 reinstall pointer. Do NOT fix this session.

### A4. Item 2 — npm/nvm4w PATH CONFIRMED BROKEN
- **Evidence:**
  - `node --version` → v20.10.0 ✓
  - `npm --version` → `Error: Cannot find module 'C:\nvm4w\nodejs\node_modules\npm\bin\npm-cli.js'` — npm infrastructure broken
  - `npx --version` → same module-not-found error (npx depends on npm)
  - `which node` → `/c/nvm4w/nodejs/node`, plus `C:\nvm4w\nodejs\node.exe` AND `C:\Program Files\nodejs\node.exe` via `where`
  - Three node installs on PATH: `C:\Users\tenis\AppData\Local\nvm`, `C:\nvm4w\nodejs`, `C:\Program Files\nodejs` — with duplicates (each listed twice)
  - `C:\nvm4w\nodejs\node_modules\` exists and has files, but `node_modules\npm\bin\npm-cli.js` is missing from expected nvm4w location
  - `node_modules/.bin/tsc` (project-local) exists — local project binaries still callable
- **Severity:** High (blocks ALL normal git commits via pre-commit hook path; blocks any `npm install` or `npx` workflow)
- **Proposed handling:** Documented for separate backup-diagnose-fix-verify sequence per founder. DO NOT touch this session. Probable fix direction: either repair nvm4w install state (reinstall npm under nvm4w's node version) or reorder PATH so `C:\Program Files\nodejs` wins.

### A5. Item 3 — Pre-commit hook CONFIRMED worse than "not enforced"
- **Evidence:**
  - `.git/hooks/pre-commit` exists, executable POSIX shell script, 344 bytes
  - Contents (verbatim): `#!/bin/sh\n# Pre-commit hook: run tsc --noEmit to catch strict TS errors\n# that Vite's dev server (esbuild) silently ignores but Vercel fails on.\n\necho "Running TypeScript check..."\nnpx tsc --noEmit\nif [ $? -ne 0 ]; then\n  echo ""\n  echo "TypeScript errors found. Fix them before committing."\n  echo "Vercel will reject this build."\n  exit 1\nfi`
  - Not file-type aware — runs on every commit including markdown-only
  - Because `npx` depends on `npm` which is broken, hook crashes at npx resolution
  - Hook error message misleadingly attributes failure to "TypeScript errors" when root cause is npm infrastructure break
- **Severity:** High (any commit WITHOUT `--no-verify` currently fails with wrong diagnosis; unknown window of silently-not-enforced tsc enforcement)
- **Proposed handling:** Phase 0.26 — replace hook with file-type-aware version that (a) skips on markdown-only commits, (b) uses project-local `node_modules/.bin/tsc` directly instead of `npx tsc` to bypass npm, (c) explicitly reports root cause on failure. Still DO NOT fix this session.

### A6. Item 4 / F17 — MCP scope precedence DOCUMENTED
- **Evidence (locations checked):**
  - `~/.claude.json` `.mcpServers` (user scope): only `codegraph` registered
  - `~/.claude.json` `.projects.<cwd>.mcpServers` (project scope for this repo): empty `{}`
  - `.vscode/mcp.json` (workspace): has `endor-cli-tools` registered with full binary path — for VS Code's own Claude extension, NOT Claude Code CLI
  - `.vscode/settings.json` (workspace): file does not exist
  - `.claude/settings.json` (local): permissions only, no MCP config
  - `.claude/settings.local.json` (local): permissions only, no MCP config
- **Key insight:** `.vscode/mcp.json` is for VS Code's integrated Claude extension. Claude Code CLI reads ONLY from `~/.claude.json`. AURI registration in `.vscode/mcp.json` does NOT affect Claude Code CLI sessions. F17's concern about plugin-install scope contention resolved — current state is clean at the Claude Code CLI level.
- **Severity:** Low (confirmatory, no action needed)
- **Proposed handling:** Phase 0.26 — update `specs/Pre-Build-Setup-Checklist.md` + SKILL.md Step 0 to document the multi-location sweep methodology.

### A7. Item 1 — AURI reinstall recipe preconditions VERIFIED
- **Evidence:** See A3. Recipe Step 1 (founder runs `endorctl init` in Windows terminal for browser OAuth) is the next action. All pre-reinstall conditions are satisfied.
- **Severity:** N/A (founder-action task, not recon finding)
- **Proposed handling:** Queue for founder execution after Phase 0.25 completes. Cannot run `endorctl init` from Claude Code Bash subprocess (browser OAuth doesn't work in subprocess).

### A8. Item 9 — "Looks Fine" pattern instances CONFIRMED
- **Instance 1: AURI Connected ≠ Functional** — confirmed by F1 disabled-state sweep finding + today's fresh confirmation that formal disabling prevented recurrence of silent claim-but-not-working
- **Instance 2: Pre-commit hook silent-error possibility** — confirmed A5. Hook "exists" and "looks fine" but is actively broken via npm dependency. Would have kept breaking commits silently (or noisily with wrong diagnosis) until investigated.
- **Add to LESSONS_LEARNED Quick Reference:** both instances in Phase 0.26.

---

## PHASE B — 17 Followups Classification

Totals: 7 Phase 0.25 / 1 partial / 2 defer-to-Phase-2 / 4 tech-debt / 1 intentional / 1 resolved / 1 closed = 17 accounted for. Plus 2 new findings.

### Do in Phase 0.26 (doc-fix pass) — 7 items
- **F3** — Document `mgrep watch --max-file-count 3000` startup in `PRE_BUILD_PROCESS.md`. VS Code task already does it; needs documenting.
- **F4** — Document 1000-file mgrep default limit in `reference_mgrep.md` memory + PRE_BUILD_PROCESS.md.
- **F11** — Add `.mgrepignore` (tmp files + visual_schedule migrations + optional `public/**`). Frees ~500K token index space.
- **F14** — Founder files upstream GitHub issue on Mixedbread-Grep plugin describing all 4 Windows bugs. From her GitHub account.
- **F15** — Add repo token-size measurement line to CLAUDE.md or new lightweight `REPO_STATS.md`. ~1.78M tokens in src/ alone.
- **F17** — Update `specs/Pre-Build-Setup-Checklist.md` methodology to check all VS Code MCP config locations. Extend SKILL.md Step 0.
- **NEW: SKILL.md AURI row** — update to reflect formally-disabled state (A3 above).

### Partial Phase 0.25 + founder-action (1)
- **F1** — AURI reinstall. Preconditions verified this session (A7). Actual reinstall requires founder keyboard.

### Defer to Phase 2 audit (2)
- **F2 (residual)** — SKILL.md already has strong end-to-end probe design. Remaining: mgrep quota state, freshness heuristics, AURI scan probe (blocked on F1).
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
- **F13** — RESCINDED in April 16 sweep (env var wouldn't help since hook never runs).

### NEW open findings (2)
- **SKILL.md AURI drift** — A3 (folded into Phase 0.26 fix list above)
- **Codegraph orphaned-lock regression** — A1 / §Codegraph-Regression (requires root-cause investigation before fix)

---

## PHASE C — Doc Reconciliation

### C1. CURRENT_BUILD.md — convention-vs-practice drift (mechanism finding)
- **Evidence:**
  - File size: 283,389 bytes / 2637 lines (grows each build)
  - Header claims `Status: IDLE` with sign-offs listed
  - 13 full build sections below the header. `grep -n "^# Build "` returns: P (line 20, SIGNED OFF marker), O (line 26, NO marker), M (479, SIGNED OFF), N (485, NO marker), L (850, NO marker), K (1106, NO marker), J (1407, COMPLETED marker), C (1612, NO marker), D (1736, COMPLETED marker), E (1847, NO marker), F (1971, COMPLETED marker), G (2117, NO marker), H (2200, no marker), I (2319, COMPLETED marker).
  - Pattern: 2 builds have "SIGNED OFF" (P, M — both today). 5 have "COMPLETED" (J, D, F, I + H implicit). 7 have NO header marker at all (O, N, L, K, C, E, G).
  - Git log shows only 3 "reset CURRENT_BUILD to IDLE" commits EVER: f20f944 (2026-03-30, PRD-14), 2ed66c4 (today, Build M + PRD-16), 01de232 (today, follow-up reset).
  - Bottom historical archive section (around line 2601+) stops at PRD-14C / 2026-03-31. Missing all completions Apr 1+.
- **Convention #14 Part B (verbatim from CLAUDE.md):** `CURRENT_BUILD.md — reset Status to IDLE, clear all sections`
- **Practice interpretation that has won:** Only clear the active-build's sections, leave historical ones. This is interpretation 1 vs literal "clear all sections" (interpretation 2).
- **Compliance rate:** 3 resets in ~15-20 build completions = ~15-20% compliance with even interpretation 1. Literal "clear all sections" has never been fully followed.
- **Severity:** High (auto-loads 283K into every session; sections without markers read as active work to new sessions)
- **Proposed handling:** Phase 0.26 — (a) resolve interpretation ambiguity (clarify CLAUDE.md convention text), (b) do one-time historical cleanup of 11 un-cleared sections or migrate to append-only `completed-builds.md` archive, (c) consider mechanism to enforce (pre-commit hook? GitHub Action? sign-off ceremony checklist?).

### C2. BUILD_STATUS.md — most out-of-date living doc
- **Evidence:**
  - Header: `> Last updated: 2026-04-06`
  - File mtime: `Apr 13 17:36` (stale vs. its own "last updated" claim)
  - Last git commit touching this file: `a161015 feat(PRD-28): homework tracking Sub-phase B` on 2026-04-13
  - Since then, on git timeline: Phase 1b-F BookShelf (2026-04-13), Build M Gamification formalization (2026-04-16), Build P PRD-16 sign-off (2026-04-16). NONE updated BUILD_STATUS.md.
  - Specific drift rows:
    - Line 52: Phase 17 PRD-16 Meetings → "Pending" (actual: SIGNED OFF 2026-04-16)
    - Line 64: Phase 29 PRD-24/24A/24B Gamification → "Pending" (actual: SIGNED OFF 2026-04-16)
    - Line 54: Phase 19 Rhythms → text says "Phase C... and Phase D... pending" (actual: Phase C Build L complete 2026-04-07, Phase D Build N complete 2026-04-07)
    - Line 67: Phase 32 PRD-28 → "Partial — Sub-phase A; Sub-phase B pending" (actual: both sub-phases complete 2026-04-13)
    - Line 63: Phase 28 PRD-23 BookShelf → "Pending" (actual: Phase 1 and Phase 1b complete — Phase 1b-F signed off 2026-04-13)
  - Gaps between BUILD_STATUS.md git-touches: Apr 13 (PRD-28) → Apr 6 (PRD-18 Phase B). In between, Build L, Build N, Phase 1b-E were NOT reflected.
- **Severity:** High (new sessions planning builds would see Meetings, Gamification, BookShelf as "Pending" and propose building them)
- **Proposed handling:** Phase 0.26 — bring up to date, fix "Last updated" label, add missing completions.

### C3. STUB_REGISTRY.md — most current living doc, but counting ambiguity
- **Evidence:**
  - File mtime: Apr 15 17:31
  - Git log shows updates for Build P (2026-04-15 commit 426c446), Build M Phase 7 (2026-04-11 commit bbeda14), Build N (2026-04-07 commit 69510b2), etc.
  - Build M stub counts visible via grep: 3 in "Build M — Configurable Earning Strategies" section (lines 260-262 — one Wired from Phase 4 + two Post-MVP) + 7 in main Gamification stubs section (lines 238-246 that overlap Build M scope). Total ~10 visible.
  - CURRENT_BUILD.md Build M sign-off claims "12 stubbed."
  - Item 6 (from 9-additional list) claims "14" as another count.
  - Three different counts for same build: 10 (registry) vs 12 (CURRENT_BUILD) vs 14 (item 6).
- **Severity:** Medium (counts-don't-match drift; root cause is formal ambiguity in stub-type classification)
- **Root cause:** STUB_REGISTRY status legend distinguishes Wired / Partially / Unwired MVP / Post-MVP / Superseded, but does NOT distinguish between "deferred work we WILL build" and "possibility we MIGHT build." Phase build reports aggregate these. Different aggregation methods produce different counts.
- **Proposed handling:** Phase 0.26 — formalize stub-type distinction per item 6. Separate "committed deferred" from "speculative possibility." Publish revised legend. Phase build verification re-counts use new taxonomy.

### C4. Inter-doc contradictions that propagate session confusion (critical)
- **C4a.** BUILD_STATUS Phase 17 "Pending" vs CURRENT_BUILD Build P "SIGNED OFF 2026-04-16" — same codebase, different answer depending on which doc read first.
- **C4b.** BUILD_STATUS Phase 29 "Pending" vs CURRENT_BUILD Build M "SIGNED OFF 2026-04-16" — identical pattern.
- **C4c.** CURRENT_BUILD.md "Status: IDLE" header + 7 un-marked active-looking build sections below (O, N, L, K, C, E, G). Read order changes interpretation. This is INTRA-file contradiction.
- **C4d.** CURRENT_BUILD.md bottom archive section stops at PRD-14C (Mar 31). Missing Build H, I, K, L, M, N, P, Phase 1b-F. The completion log is itself incomplete.
- **C4e.** Stub counts drift across sources for same build (see C3).

### C5. File-size auto-load budget (item 8)
- **Evidence:**
  - CURRENT_BUILD.md: 283K / 2637 lines — auto-loaded every session via `@CURRENT_BUILD.md` in CLAUDE.md
  - CLAUDE.md: 92K / 511 lines — auto-loaded every session
  - claude/database_schema.md: 198K — auto-loaded via `@claude/database_schema.md`
  - claude/live_schema.md: 51K — auto-loaded via `@claude/live_schema.md`
  - claude/ai_patterns.md, architecture.md, conventions.md, feature_glossary.md: ~50K combined — auto-loaded
  - **Total auto-load per session: ~670K.**
  - LESSONS_LEARNED.md: 27K (Apr 16 16:01) — NOT @-referenced in CLAUDE.md; loads only on demand. Correct handling.
  - database_schema.md + live_schema.md likely overlap substantially (both document same schema from different angles).
- **Severity:** Medium (context waste; affects every session's effective working budget)
- **Proposed handling:** Phase 0.26 or later — (a) resolve CURRENT_BUILD.md accumulation per C1, (b) evaluate whether live_schema.md is redundant with database_schema.md, (c) audit CLAUDE.md for content that can move to @-referenced sub-files lazily loaded.

### C6. Item 5 — PRD-16 stub duplication (DEFERRED — not in STUB_REGISTRY.md)
- **Evidence:** grep for Build P / PRD-16 in STUB_REGISTRY.md returned 8 unique entries, no obvious duplication.
- **Founder claim:** "PRD-16 verification rows #1 and #2 describe same gap."
- **Likely location:** The verification table in `claude/feature-decisions/PRD-16-Meetings.md`, not STUB_REGISTRY.md.
- **Proposed handling:** Flag for Phase F to verify against feature decision file. If confirmed, include in Phase 0.26 fix list. NOT INVESTIGATED this session.

### C7. Item 7 — Pre-sign-off verification re-run convention (OPEN)
- **Evidence:** Build P sign-off in CURRENT_BUILD.md line 22 explicitly flagged this for Phase 0.25: "tsc -b and 16/16 E2E tests claims from 2026-04-16 accepted without re-running (logged for Phase 0.25: add pre-sign-off verification re-run as option)."
- **Complicating factor:** Pre-commit hook is broken (A5). Currently NO tsc enforcement in commit path. Pre-sign-off re-run would be the only enforcement until hook is fixed.
- **Proposed handling:** Phase F recommendation — formalize as convention #241+: "before sign-off ceremony, re-run tsc -b + E2E suite, attach fresh timestamps to sign-off entry." NOT implemented this session.

### C8. Mechanism — auto-update-after-build convention has no enforcement
- **Evidence:**
  - CLAUDE.md convention #14 Part B is a 7-item checklist (BUILD_STATUS + database_schema + STUB_REGISTRY + CLAUDE.md + FeatureGuide + LiLa knowledge + feature-decision + CURRENT_BUILD reset + feature-decisions README)
  - Commit log shows inconsistent firing: some builds touch all 4 files (CURRENT_BUILD, BUILD_STATUS, STUB_REGISTRY, CLAUDE.md), some touch only 2-3, some only 1.
  - No pre-commit, post-commit, or GitHub Action enforces the checklist.
  - STUB_REGISTRY has the best compliance rate because its updates are tied directly to each build's verification output (stub-by-stub accounting forces updates).
  - CURRENT_BUILD reset has the worst compliance rate (~15-20%).
  - BUILD_STATUS is in between (~60-70% compliance — updated for most builds but skipped recent batch).
- **Severity:** High (root mechanism finding — drift is structural, not incidental)
- **Proposed handling:** Phase 0.26 or later — choose enforcement mechanism (options: pre-commit hook adds a "files modified in this commit" assertion, GitHub Action checks for convention-compliance after build commits, or formalize sign-off ceremony checklist with visible checkboxes).

---

## §Codegraph-Regression — verbatim probe data (TIME-SENSITIVE)

Captured 2026-04-16 evening, session that wrote this file.

### Processes running on host (tasklist output)
```
Image Name                     PID Session Name        Session#    Mem Usage
========================= ======== ================ =========== ============
node.exe                     25916 Console                    1     51,164 K
node.exe                     29584 Console                    1     74,908 K
node.exe                      2560 Console                    1     46,244 K
claude.exe                   33876 Console                    1    404,660 K
```

- Zero `codegraph.exe` processes running
- No process matching "codegraph" case-insensitive
- Only claude.exe (current session) plus 3 generic node.exe processes
- Lock is NOT actively held by a running process

### Lock directory state (`.codegraph/codegraph.db.lock/`)
```
total 4
drwxr-xr-x 1 tenis 197609 0 Apr 16 12:27 .
drwxr-xr-x 1 tenis 197609 0 Apr 16 12:27 ..
```

Empty directory. No PID file. No identifier.

### stat output — lock directory
```
  File: .codegraph/codegraph.db.lock/
  Size: 0         	Blocks: 0          IO Block: 65536  directory
Device: e23ef52h/237236050d	Inode: 13229323905605516  Links: 1
Access: (0755/drwxr-xr-x)  Uid: (197609/   tenis)   Gid: (197609/ UNKNOWN)
Access: 2026-04-16 19:28:28.550854500 -0500
Modify: 2026-04-16 12:27:47.443536400 -0500
Change: 2026-04-16 12:27:47.443536400 -0500
 Birth: 2026-04-16 12:27:47.443536400 -0500
```

### stat output — database file
```
  File: .codegraph/codegraph.db
  Size: 26599424  	Blocks: 25976      IO Block: 65536  regular file
Access: 2026-04-16 19:04:50.278798000 -0500
Modify: 2026-04-16 12:27:10.607004900 -0500
Change: 2026-04-16 12:27:10.607004900 -0500
 Birth: 2026-04-16 12:25:58.673628200 -0500
```

### Timestamp sequence (this is the critical evidence)
- **12:25:58** — codegraph.db created (Birth)
- **12:27:10** — codegraph.db last written (Modify)
- **12:27:47** — codegraph.db.lock directory created, 37 seconds after last db write
- **12:27:47** — lock directory never modified after creation (Change matches Modify matches Birth)
- **19:28:28** — lock directory last accessed (by my read-only probe tonight)
- **Gap:** 7+ hours between lock creation and now, zero modifications to lock directory, zero processes holding it

### handle.exe availability
Not present on PATH. Skipped per founder instruction (no install).

### Interpretation (for synthesis)
- **Lock is orphaned, not actively held.**
- **Codegraph uses mkdir-based atomic lock pattern** — creating a directory as an exclusive marker. Standard Unix pattern when you need atomic locking without filesystem lockf support.
- **The mkdir-lock contains no identifying data.** Normal lock files contain PID + hostname so stale locks can be detected. Codegraph's implementation doesn't — the directory is the lock, emptiness is a feature.
- **No stale-detection mechanism exists** in codegraph. When a process takes the lock and doesn't release it, subsequent processes can only see "lock exists" — they cannot determine whether the holder is still alive.
- **This is a structural incompatibility** with how Claude Code sessions terminate: window close / VS Code crash / OS restart / watchdog timeout / branch switch / process kill — none give codegraph a chance to run its cleanup logic. Every such termination potentially leaves a lock orphan.
- **Three data points of regression on one day:**
  1. Before April 16 sweep — stale index + stale lock (lock from some earlier session, db from March 28)
  2. April 16 afternoon after sweep fix — green at 12:27:10 (db written, no lock)
  3. April 16 evening (now) — lock orphaned at 12:27:47, held for 7 hours, no process owns it
- **Root-cause hypothesis** (needs codegraph source verification): codegraph creates the mkdir-lock on certain operations (init, index, possibly status on ungraceful shutdown scenarios), relies on RAII-like cleanup on graceful exit, but cleanup doesn't run on SIGKILL. Any session killed between `mkdir lock/` and final `rmdir lock/` leaves an orphan.
- **Recurrence prediction:** Without upstream fix OR operational mitigation, this WILL happen again on every ungraceful Claude Code session termination that involves a codegraph call.

### Three-part handling per founder direction
1. **Symptomatic fix recipe (lightweight, documented):** `rm -rf .codegraph/codegraph.db.lock` — just the empty directory, NOT `rm -rf .codegraph` (preserves 25MB index). Codegraph works on next call.
2. **Operational mitigation (Phase 0.26 candidate):** Step 0 hard-gate probe enhancement — check for orphaned `.codegraph/codegraph.db.lock/` and flag it with one-command cleanup instruction. Something like: `if [ -d .codegraph/codegraph.db.lock ] && ! pgrep -f codegraph > /dev/null; then echo "Orphaned codegraph lock — run: rm -rf .codegraph/codegraph.db.lock"; fi`.
3. **Upstream issue:** File GitHub issue with codegraph project requesting (a) PID-containing lockfile for stale-detection, (b) signal handler that removes the lock on SIGTERM/SIGKILL where possible. Upstream fix timeline is outside our control — hence the operational mitigation matters.

---

## Ruled-out hypotheses (preserve — don't re-investigate)

- **F13 (env-var fix for mgrep watch hook):** Confirmed rescinded. Hook never runs at all on Windows (4 Windows-incompatibility bugs; `python3` resolves to MS Store stub, `/tmp/` doesn't exist, `preexec_fn` Unix-only, `subprocess.Popen` without `shell=True` misses `.cmd` shim). Env var would never be read. Do not revisit.
- **Codegraph lock held by active process:** Ruled out. Process list shows zero codegraph.exe processes. 3 node.exe processes are generic (not codegraph-related — codegraph is a Go binary, not node). Lock is orphaned, not held. Do not re-check process list looking for holder.
- **mgrep wizards directory indexing failure:** Ruled out. Async embedding lag from April 16 sweep has caught up. Wizard files return 99%+ matches. F10 resolved. Do not re-probe.
- **VS Code `.vscode/mcp.json` AURI registration affecting Claude Code CLI:** Ruled out. That config is for VS Code's integrated Claude extension. Claude Code CLI reads only `~/.claude.json`. The AURI entry at the VS Code workspace level does NOT leak into Claude Code CLI. Do not re-investigate scope contention there.
- **BUILD_STATUS.md "Last updated: 2026-04-06" label as authoritative:** Ruled out. File mtime is Apr 13; content shows entries through Apr 13. "Last updated" label is itself stale. Treat git commit timestamp + file mtime as truth, not the header label.
- **STUB_REGISTRY.md as stub-count authority:** Ruled out. Counts don't match CURRENT_BUILD.md claims. Root cause is stub-type taxonomy gap, not arithmetic error. Phase 0.26 needs to resolve taxonomy before re-counting.
- **Pre-commit hook Windows-awareness:** Ruled out via inspection. Hook is a sh script that runs `npx tsc --noEmit` uniformly. Not file-type aware. Not Windows-aware. Not node-install-aware. Breaks uniformly when npm is broken. Do not hypothesize Windows-specific branches.
- **Codegraph `✓ Connected` status as sufficient:** Ruled out (again). Third confirmation this month of "Connected ≠ Functioning." codegraph MCP reports Connected while returning "not initialized" on real calls. Same pattern as April 16 pre-sweep. Step 0 MUST end-to-end probe; status handshake alone is insufficient.

---

## Volatility observation for Phase F synthesis

Top-level pattern worth calling out in the final report:

**Tool state on this machine is more volatile than the April 16 sweep assumed.**

Two "verified green in morning, broken by evening" instances today:
1. **npm/nvm4w** — node works, npm/npx broken. Worked enough for `node --version`, failed for anything that needs npm. Window of regression: unknown, but the pre-commit hook has been silently-broken for however long this has been the case.
2. **codegraph MCP** — verified green during April 16 afternoon sweep (880 files / 10K nodes / 17K edges, no lock). Re-broken within 6-12 hours with orphaned lock.

Both align with "Connected ≠ Functioning" but go one step further — both tools were verified FUNCTIONING, then regressed. This is outside the April 16 sweep's model.

**Implication for Step 0 hard-gate cadence and scope:**
- Step 0 correctly probes end-to-end (SKILL.md is well-designed in this respect)
- But Step 0 only runs at build-start. A build session that spans multiple hours could have tools silently regress mid-build.
- Consider: add a Step 0.5 mid-build re-probe for long sessions, or a pre-sign-off re-probe (item 7 connection)
- Consider: lower the cost of running Step 0 so it can run more often without friction

This is a pattern to flag, not a fix to implement in recon.
