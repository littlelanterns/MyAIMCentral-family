# Tool Health Report — 2026-04-16

Full silent-failure tool sweep. Triggered by the discovery that AURI (Endor Labs security scanner MCP) had been silently disconnected — possibly since initial setup — while Claude Code was building security-sensitive PRD-01 and PRD-02 code. This report inventories every tool registered to Claude Code for this project and tests each end-to-end, not just "does it exist."

See `claude/LESSONS_LEARNED.md` → "The Second Failure Mode: Silent Tool Drift" for the full postmortem that prompted this sweep.

---

## Methodology

Every tool is tested at three levels:

1. **Registered** — Is the tool installed and declared (in `claude mcp list`, in PATH, or in VS Code settings)?
2. **Authenticated** — Does the tool have valid credentials / session tokens (where applicable)?
3. **Actually Firing** — Does a real end-to-end call return real data, not just a "connected" handshake?

A tool that passes 1 + 2 but fails 3 is the exact failure mode that prompted this sweep — codegraph was "Connected" but not initialized, so zero tool calls ever returned real data.

---

## Summary Table

| Tool | Registered | Authed | Actually Firing | Status |
|---|---|---|---|---|
| codegraph MCP | ✓ | n/a | ✓ **after full re-index this session** | Green — verified via real query for post-Mar-28 code |
| endor-cli-tools MCP (AURI) | ✓ | n/a | ⚠ Partial | MCP reachable; full scan verification requires Endor Labs account setup (F1) |
| mgrep CLI | ✓ | ✓ | ✓ **Scale tier + full re-index this session** | Green for most surfaces. Yellow: `src/components/studio/wizards/` files not yet appearing in searches — likely async embedding lag on last-48h files (F10). |
| mgrep watch hook (plugin) | ✓ | n/a | ✗ **Fundamentally broken on Windows — has never run** | RED — initial diagnosis was "file-count limit failure"; deeper investigation found 4 independent Windows-incompatibility bugs, starting with `python3` not being installed at all. See Finding 2b. **Resolved by replacing the hook with a VS Code workspace task** at `.vscode/tasks.json` (committed 2026-04-16). Hook itself still broken but now redundant — the task does the real work. |
| claude.ai Gmail MCP | ✓ | ✗ Needs auth | n/a | Optional — not required for code builds |
| claude.ai Google Calendar MCP | ✓ | ✗ Needs auth | n/a | Optional — not required for code builds |
| claude.ai Google Drive MCP | ✓ | ✓ | Not tested | Optional — surface status only |
| supabase CLI | ✓ | ✓ | ✓ cloud mode | Green — cloud linked to MyAIMCentral (`vjfbzpliqialqmabfnxs`); local-mode unavailable (Docker not running, expected for cloud-only workflow). Non-urgent: v2.84.2 → v2.90.0 upgrade available (F6). |
| vercel CLI | ✓ | ✓ as `lilacrew` | ✓ | Green |
| gh CLI | ✓ | ✗ **Not logged in** | n/a | Optional — recommend `gh auth login` if PR/issue operations become part of builds (F5) |

---

## Detailed Findings

### 1. codegraph MCP — **CRITICAL finding, fixed this session**

**Registered:** Yes — `claude mcp list` shows `codegraph: codegraph serve --mcp — ✓ Connected`.

**What was broken:** MCP server was "Connected" but the underlying codegraph index was unusable. The `.codegraph/` directory existed (9 MB database from 2026-03-28) but had a stale `codegraph.db.lock` directory left over from a process that had crashed or been killed on Mar 28. Calling `mcp__codegraph__codegraph_status` returned **"CodeGraph not initialized for this project"** — a misleading error. The actual error from the CLI was "database is locked."

Even worse: the index itself was 3 weeks stale. Between Mar 28 and today the following code shipped:
- Build M (gamification — 42 wired items)
- PRD-16 Meetings (full feature, 5 phases including the committed `MeetingSetupWizard` component)
- Universal List Wizard + shared wizard infrastructure (partially uncommitted)
- Various fixes across LiLa tools, routines, shared tasks

An unlocked stale index would have returned confident-looking results based on code that no longer matched the current state — worse than broken queries, because stale queries mislead silently.

**What we did:**
1. `rm -rf .codegraph` (blew away the stale state entirely)
2. `codegraph init` — clean re-initialization
3. `codegraph index` — built fresh index from current codebase

**End-to-end verification (all three passed):**
- Direct CLI `codegraph status`: 880 files, 10,067 nodes, 16,978 edges, 25.37 MB, no lock
- `mcp__codegraph__codegraph_status` via MCP: same numbers — MCP and CLI agree
- Freshness probe: `mcp__codegraph__codegraph_search query="MeetingSetupWizard"` → found function at `src/components/studio/wizards/MeetingSetupWizard.tsx:97` plus interface definition and import references in `MeetingsPage.tsx` and `Studio.tsx`. This file was created as part of PRD-16 Phase E (commit `426c446`) — definitively post-March-28 code.

**Minor observation:** `codegraph status` reports "Pending Changes: Added: 7 files" — these are the uncommitted wizard files from the current working tree (`ConnectionOffersPanel.tsx`, `DashboardDeployPicker.tsx`, `RecurringItemBrowser.tsx`, `UniversalListWizard.tsx`, `WizardTagPicker.tsx`, `presets/listPresets.ts`, `useWizardProgress.ts`). Running `codegraph sync` would incorporate them. Not blocking — but if wizard work continues without a sync, queries against those files won't return results.

**Side finding (non-urgent):** CLI warns `[CodeGraph] Using WASM SQLite backend (native better-sqlite3 unavailable)`. Native bindings aren't loading — codegraph works, just slower than native. Could be related to the Windows npm PATH layering. Not fixing in this sweep.

**Gitignore status:** `.codegraph/` is already in root `.gitignore`, and codegraph ships its own `.codegraph/.gitignore` that excludes `*.db`, `cache/`, `*.log`. No gitignore changes needed.

---

### 2. mgrep CLI — **Scale tier active, index fully refreshed 2026-04-16, green with one yellow observation**

**Registered:** Yes — `C:\Users\tenis\AppData\Roaming\npm\mgrep.cmd` (v0.1.10).
**Authenticated:** Yes — re-authed during this session via device-code flow as Tenise / Tenise's Workspace.

**What was broken:** Three layered failures stacked on top of each other:

1. **Stale index** — search returned results, but they came from an index frozen weeks before current code was written. Probes for recently-added source returned only PRD markdown, despite those source files existing on disk and being found by codegraph. Same "confident stale results worse than broken queries" pattern as codegraph.
2. **1000-file limit** — `mgrep watch` without flags refused to sync because the repo has 1,345+ tracked files (beyond the CLI's default hard limit of 1000). This failed silently via the plugin hook (see Finding 2b below).
3. **Free tier token quota exhausted** — `mgrep watch --max-file-count 3000` started, then hit "Free tier quota exceeded. You've reached the monthly limit of 2,000,000 store tokens." Nothing was synced.

**Repo-size diagnostic (conducted mid-sweep to decide between upgrade vs. prune):** See "mgrep Indexing Diagnostic" below. Short version: `src/` alone is ~1.78M tokens (chars/4 estimate); total indexable textual content is ~5–6M tokens. The 2M free tier was guaranteed to be hit. The repo genuinely needs more headroom to be useful.

**Fix applied:**
- Tenise upgraded to Mixedbread **Scale tier** ($20/month + $20 initial credits + $5 spending cap).
- Re-ran `mgrep watch --max-file-count 3000` on Scale tier.
- Result: `✔ Initial sync complete (1348/1348) • uploaded 1346` — 2 files filtered by mgrep's built-in type filter (likely binaries or unsupported extensions). No quota error. Index fully refreshed.

**End-to-end verification (three probes):**

| Probe | Result |
|---|---|
| Post-Mar-28 meeting source files | ✓ `src/components/meetings/StartMeetingModal.tsx`, `MeetingHistoryView.tsx`, `CustomTemplateCreatorModal.tsx`, `MeetingPickerOverlay.tsx` all appear at 84–97% match |
| Post-Mar-28 gamification settings | ✓ `src/components/gamification/settings/GamificationSettingsModal.tsx` returned at 66% match |
| Post-Mar-28 gamification widget | ✓ `src/components/gamification/widgets/StarChartAnimation.tsx` returned at 76% match |

**YELLOW observation — `src/components/studio/wizards/` directory not appearing in searches:**

Every search I ran for content that should live in this directory returned zero `.tsx` results from it — including targeted probes for committed files like `MeetingSetupWizard.tsx`, `StarChartWizard.tsx`, `GetToKnowWizard.tsx`, `RoutineBuilderWizard.tsx`, `SetupWizard.tsx`. These files are git-tracked, not in `.gitignore`, not excluded by any config. Same probes for files in adjacent directories (`src/components/meetings/`, `src/components/gamification/widgets/`) return results normally.

**Hypothesis:** async embedding lag on recently-modified files. All wizard files are dated Apr 14–15 (within 48h of this sweep). Upload completed, but Mixedbread's embedding pipeline may not have finished vectorizing them yet. Worth re-probing in a few hours or the next day.

**Not a blocker.** Meeting, gamification, calendar, and other source surfaces all return fresh results. This specific directory may surface later as embeddings catch up. Added as F10 followup.

**Persistence note:** `mgrep watch` is a continuous process. The background watch I started will die when this session ends. The Claude Code plugin hook re-launches `mgrep watch` on every session start — but with a bug (see Finding 2b).

**Side observation — editor tmp files flagged by watch:** During this sweep, the mgrep watch process logged "Failed to upload changed file" events for transient editor temp files (pattern `<filename>.tmp.<pid>.<ts>`) that the Write tool creates and removes during atomic saves. The upload attempt races with the tmp file's deletion. Harmless (mgrep recovers on the next sync), but explains why earlier searches surfaced `*.tmp.*` results in `src/lib/permissions/`. Recommendation for F11: add `*.tmp.*.[0-9]*` to a future `.mgrepignore` to silence these noise events.

---

### 2b. mgrep watch hook — **Windows-incompatible, has NEVER run on this machine**

> **Note (2026-04-16 update):** The initial Finding 2b below described a single "silent failure" at the `mgrep watch` file-count step. Deeper investigation in the same session revealed the hook has FOUR independent Windows-incompatibility bugs and has never executed a single line of its Python code on this machine. The updated diagnosis is below. Resolution: replaced the hook mechanism entirely with a VS Code workspace task.

**Location:** `~/.claude/plugins/cache/Mixedbread-Grep/mgrep/0.0.0/hooks/mgrep_watch.py` (also at `~/.claude/plugins/marketplaces/Mixedbread-Grep/plugins/mgrep/hooks/mgrep_watch.py`).

**Trigger:** `hook.json` fires this hook on every Claude Code `SessionStart` event (matcher: `startup|resume`) with a 10-second launcher timeout. Hook command: `python3 ${CLAUDE_PLUGIN_ROOT}/hooks/mgrep_watch.py`.

**Initial diagnosis (wrong):** The hook runs `mgrep watch` with no flags, hits the 1000-file default limit, writes to a log nobody reads, reports success. Prescribed fix: `MGREP_MAX_FILE_COUNT=3000` as env var.

**Actual diagnosis (after running the hook manually):** The hook has FOUR independent Windows-incompatibility bugs, any one of which prevents it from working. The initial env-var fix would not have helped because the hook never reaches the point of reading env vars.

| # | Bug | Effect |
|---|---|---|
| 1 | `python3` as a command resolves to the Microsoft Store installer stub on Windows, even though real Python 3 IS installed (verified 2026-04-16: `python --version` and `py --version` both return Python 3.10.6). On Windows 10/11, the command name `python3` is registered as an "App execution alias" that intercepts the call BEFORE normal PATH resolution — it opens the Store installer prompt and exits. The real Python installation is callable as `python` or `py`, but anything that specifically invokes `python3` (like this plugin hook's `hook.json`) hits the stub. | Hook never starts. The interpreter name the hook specifies is hijacked by the Store alias before reaching the real Python. |
| 2 | `C:\tmp\` does not exist on this Windows machine (verified: `[ -d /c/tmp ] → NO`). The hook's Python script does `open("/tmp/mgrep-watch-command-<id>.log", "w")`, which on Windows resolves to `C:\tmp\mgrep-watch-command-<id>.log`. | Even if Python were installed, `open()` would raise `FileNotFoundError` because the parent directory doesn't exist. |
| 3 | `subprocess.Popen([...], preexec_fn=os.setsid)` on line 42 — `preexec_fn` is Unix-only. On Windows, Python raises `ValueError: preexec_fn is not supported on Windows platforms`. | Even if `C:\tmp\` existed and Python ran, the subprocess call crashes before starting `mgrep`. |
| 4 | `subprocess.Popen(["mgrep", "watch"])` without `shell=True` — Python's `subprocess` on Windows doesn't find `.cmd` shims unless `shell=True` is passed. It looks for `mgrep.exe`. | Even if bugs 1–3 were fixed, `mgrep` wouldn't resolve because `mgrep.cmd` (the npm shim on PATH) isn't findable without shell=True. |

**Net effect:** The hook has been failing at step 1 from day one — `python3` hits the MS Store alias instead of the real Python 3 installation that IS present on the machine. No log files exist in `C:\tmp\` because the hook's Python code never executed. Claude Code happily reports the hook "succeeded" (it exited within the 10-second timeout, with a non-zero exit code from the MS Store stub that Claude Code doesn't treat as a hard fail). Every session start has been a no-op for mgrep indexing.

**What actually kept mgrep's index fresh during this session:** the sweep-operator (Claude Code, in this session) manually ran `mgrep watch --max-file-count 3000` via the background Bash tool. That's the ONLY way mgrep has ever indexed this repo. The hook contributed nothing.

### The chosen long-term fix: VS Code workspace task (implemented 2026-04-16)

Rather than patch a Python hook that is fundamentally Windows-incompatible AND lives in a plugin cache folder (which gets wiped on plugin updates), we replaced the mechanism entirely with a VS Code workspace task at `.vscode/tasks.json`:

```json
{
  "label": "mgrep watch",
  "type": "shell",
  "command": "mgrep",
  "args": ["watch", "--max-file-count", "3000"],
  "isBackground": true,
  "runOptions": { "runOn": "folderOpen" },
  "presentation": { "reveal": "silent", "panel": "dedicated", ... }
}
```

**Why this is better than patching the hook:**
- No dependency on `python3` being installed
- No dependency on `C:\tmp\` existing
- No Unix-only Python kwargs
- Cross-platform (Windows, Mac, Linux with zero changes)
- Visible in VS Code's Terminal panel — failures aren't silent, the task's output is right there
- Survives plugin updates (the task lives in this repo, not in `~/.claude/plugins/cache/`)
- Committed to the repo = documented + reproducible for any future developer

**One-time setup step after this commit:** VS Code disables auto-run tasks by default for security. After pulling this change, run **"Tasks: Manage Automatic Tasks"** → **"Allow Automatic Tasks"** from the command palette (Ctrl+Shift+P). After that, `mgrep watch` starts automatically every time the project folder opens.

**The broken hook is NOT removed.** It still exists in `~/.claude/plugins/cache/Mixedbread-Grep/mgrep/0.0.0/` and continues to fire on session start and continues to no-op. We don't remove it because we don't own the plugin cache; plugin updates could re-install it anyway. It's just harmlessly ineffective — the VS Code task does the real work. When `mgrep watch` is already running (from the VS Code task), a second invocation from the hook (if it ever starts working) would just detect no-changes-to-sync and exit.

### What about also fixing the hook?

Technically possible — see the 4-bug table above — but not recommended as a primary mechanism. Options analyzed:

| Approach | Survives plugin update? | Recommendation |
|---|---|---|
| Install Python 3 + `mkdir C:\tmp` (bugs 1 + 2) | Yes | Do if convenient — good hygiene for other Unix-inspired tools. Does NOT make the hook work — bugs 3+4 remain. |
| Patch plugin Python file for bugs 3 + 4 | **No — wiped on plugin update** | **Do NOT do.** Exactly the silent-failure pattern we're trying to escape — patch works for a while, plugin update silently wipes it, hook goes back to no-op, nobody notices for weeks. |
| File upstream issue with Mixedbread to fix bugs 3 + 4 in plugin source | Yes (once their fix ships) | **Do.** Right fix, benefits every Windows user of this plugin. Long lead time. |

**Defense in depth strategy:** VS Code task is the primary, always-on mechanism. Upstream fix (F14) is the slow but correct background action. If Mixedbread fixes the hook eventually, it runs as a harmless duplicate of the task.

### Also — missed VS Code-level AURI registration (fixed in same commit)

During this update's investigation, discovered `.vscode/mcp.json` at the workspace level registers AURI with the broken `npx -y endorctl` command — the same broken pattern I fixed earlier at the Claude Code level. Earlier in the sweep I'd grep'd VS Code *user* settings for MCP references and found none — but missed the *workspace* `.vscode/mcp.json`. Fixed in this commit to use the full binary path, matching the Claude Code registration.

Lesson: "VS Code MCP config" lives in multiple places depending on scope (user, workspace, devcontainer). A tool sweep needs to check all of them, not just user settings.

### Followups updated

- **F13 (env var)** — RESCINDED. The initial fix wouldn't have helped because the hook doesn't run at all. Env var can still be set if desired (useful for manual `mgrep watch` invocations to not need the `--max-file-count` flag), but it's now a convenience, not a required fix.
- **F14 (upstream issue)** — KEPT AND EXPANDED. File GitHub issue on the Mixedbread-Grep plugin describing all 4 Windows-incompatibility bugs. Report the specific behavior: on Windows without Python 3 installed, the hook exits silently with the MS Store stub and reports success.
- **F16 (new)** — Optional: install Python 3 + `mkdir C:\tmp`. Good hygiene but doesn't fix the hook without upstream changes.
- **F17 (new)** — Sweep methodology update: tool health sweeps must check `.vscode/mcp.json` (workspace-level), `.vscode/settings.json` (workspace-level), `~/.vscode/argv.json` (if present), AND VS Code user settings — not just one of these. Document in setup checklist.

---

## mgrep Indexing Diagnostic (conducted mid-sweep)

Triggered by Mixedbread dashboard showing 1.8M stored tokens — needed to decide between upgrade vs. prune vs. drop. Findings drove the upgrade decision.

### Is node_modules bloat the cause?

**No.** mgrep respects `.gitignore` out of the box:

| Source | Count |
|---|---|
| `git ls-files` (tracked, gitignore-respecting) | 1,366 |
| `git ls-files + untracked-not-ignored` | 1,377 |
| mgrep reported trying to sync | 1,345–1,348 |
| `find` excluding build dirs | 1,615 |

mgrep's file count is within ~20 of `git ls-files` — rounding is mgrep's built-in type filter (images, lock files, etc.). `node_modules/`, `dist/`, `build/`, `.next/`, `.codegraph/`, `coverage/` are all already in `.gitignore` and excluded.

No `.mgrepignore` file exists at repo root. mgrep is using its defaults.

### Token breakdown (chars/4 approximation)

```
src:                  704 files   7.1M chars   ~1,777K tokens
supabase/migrations:  154 files   3.9M chars     ~970K tokens
prds:                  96 files   4.3M chars   ~1,069K tokens
claude:                52 files   1.3M chars     ~321K tokens
tests:                104 files   1.3M chars     ~318K tokens
specs:                 34 files   0.9M chars     ~220K tokens
reference:             16 files   0.8M chars     ~188K tokens
supabase/functions:    55 files   0.8M chars     ~188K tokens

ALL TRACKED:                     30.3M chars   ~7,567K tokens
```

`src/` alone ≈ 1.78M tokens. Total indexable textual content ≈ 5–6M tokens. The 2M free-tier limit was guaranteed to be hit.

### Largest individual files (top 15 by char count)

```
 1,120,154 chars  public/sittinglila.png                            [binary]
 1,120,154 chars  public/decorations/sittinglila.png                [binary, byte-identical DUPLICATE]
 1,009,729 chars  public/decorations/graphpaperripped.png           [binary]
   996,500 chars  supabase/migrations/…_visual_schedule_cdef.sql    [data seed, inline gamification assets]
   698,002 chars  supabase/migrations/…_visual_schedule_ghi.sql     [data seed]
   483,321 chars  public/decorations/decorativepaperstarembellishment.png
   455,583 chars  public/decorations/starcluster.png
   393,661 chars  public/aimfm-logo-transparent.png
   363,432 chars  supabase/migrations/…_play_dashboard_sticker_book.sql [data seed]
   310,614 chars  CURRENT_BUILD.md
   304,786 chars  public/decorations/goldthumbtack.png
   294,574 chars  public/pwa-icon-maskable-512.png
   291,115 chars  public/pwa-icon-512.png
   290,523 chars  public/decorations/clipboardclip.png
   286,201 chars  public/Lila-HtH.png
```

**Observations:**

- **Binary PNGs in `public/`**: mgrep's default filter likely skips these (it uses file-type detection), so they probably don't count against store tokens. But it's implicit — making it explicit via `.mgrepignore` would be defensive.
- **`public/sittinglila.png` and `public/decorations/sittinglila.png` are byte-for-byte identical duplicates.** Separate issue from mgrep, worth flagging for cleanup. Added as F12.
- **Three giant SQL data-seed migrations** (`visual_schedule_cdef`, `visual_schedule_ghi`, `play_dashboard_sticker_book`) — combined ~515K tokens of inline data. Valuable to keep in the repo (they're real migrations). Zero semantic-search value. These drove meaningful quota consumption.

### Decision driven by diagnostic

The repo genuinely needs >2M tokens of semantic-search storage to be useful. Pruning to fit free tier would require excluding PRDs (the most valuable content for cross-feature search) — bad trade. Scale tier upgrade ($20/month + $20 credits + $5 spending cap) was the right call. A minimal future `.mgrepignore` excluding the data-seed SQL migrations would keep future growth headroom without affecting code search quality.

---

### 3. endor-cli-tools MCP (AURI) — partial verification

**Registered:** Yes — command `C:/Users/tenis/AppData/Roaming/npm/bin/endorctl.exe ai-tools mcp-server` → `✓ Connected`. Reconnected earlier in this session after discovering it had been `✗ Failed to connect` for an unknown period (original registration used `npx -y endorctl` which silently failed because the endorctl Go-binary postinstall doesn't create the PATH shim that npx expects).

**Actually firing:** Not fully testable without Endor Labs account credentials. Per plan agreed earlier in this session, we do NOT force a scan without account setup. Scan-verification deferred until the account is configured.

**What "Connected" confirms:** The MCP process starts cleanly; the MCP handshake completes. That's enough for Step 0 to pass, but not enough to claim scans are actually happening on AI-generated code.

**Required followup:** Set up Endor Labs account, add credentials, run a minimal test scan to confirm end-to-end. Once done, Step 0 should include that scan as part of its probe rather than trusting "Connected" alone.

---

### 4. supabase CLI — green (cloud mode)

**Registered:** Yes — `/c/Users/tenis/bin/supabase` (v2.84.2).

**Authenticated:** Yes — `supabase projects list` returns the full account project list with `MyAIMCentral` (ref `vjfbzpliqialqmabfnxs`) shown as linked (●).

**Why the original end-to-end test was wrong:** First probe was `supabase status` — which requires Docker Desktop running for local dev mode. Docker isn't running on this machine, and Tenise's workflow is cloud-only (migrations via `supabase db push`, Edge Functions via `supabase functions deploy`). `supabase status` is the wrong check for cloud usage.

**Correct end-to-end check for this project:** `supabase projects list` — confirms cloud auth + project link without requiring Docker.

**Non-urgent:** CLI version 2.84.2 installed; v2.90.0 available. Per founder direction: flag as non-urgent upgrade, don't action.

---

### 5. vercel CLI — green

`vercel whoami` returns `lilacrew`. Auth valid. Not in critical-path for Step 0 (it's deploy-time, not build-time), but confirmed working.

---

### 6. gh CLI — not authenticated

`gh auth status` returns "You are not logged into any GitHub hosts. To log in, run: `gh auth login`."

Per founder direction: **optional**, not added to Step 0 required list. Not on the critical path for builds. Recommendation: run `gh auth login` (interactive browser flow, Tenise runs in her own terminal) if PR / issue operations via `gh` become part of a build workflow.

---

### 7. Claude.ai MCPs (Gmail, Google Calendar, Google Drive)

- Gmail: `! Needs authentication` — expected, not required for code builds
- Google Calendar: `! Needs authentication` — expected, not required for code builds
- Google Drive: `✓ Connected` — passes handshake; no end-to-end probe this sweep since it's not on the build critical path

None block anything. Surface only.

---

## Followups (tracked for future execution)

### F1 — Set up Endor Labs account, verify AURI end-to-end scan
**Priority:** High.
**Blocker for:** Being able to trust that AURI is actually scanning auth/permissions code, not just connected. Until this is done, Step 0 reports "MCP reachable" for AURI, but we do not have ground truth that real scans return real findings.
**Action:** Create Endor Labs account, configure API key/secret on `endorctl` CLI, run a minimal scan on a small test file, confirm findings output. Then update Step 0 Task 4 probe to include a scan assertion, not just connection.

### F2 — Task 4: Enhance Step 0 with end-to-end probes (not just connection checks)
**Priority:** High. Pulled straight out of this sweep's core finding.
**Why:** This sweep proved "Connected" is not sufficient for codegraph or mgrep. Step 0 as currently written would have passed both broken states.
**Required per founder guidance:**
- For each required MCP, define a real end-to-end probe that exercises actual tool output.
- For codegraph: probe must return an initialized state + a real query for known-recent code, not just `codegraph_status`.
- For AURI: once account is set up, probe must include a minimal scan returning expected findings.
- For mgrep: probe must (a) confirm auth, (b) check index freshness against recent git activity.
- Document the "connected != functioning" principle in Step 0's "Why this step exists."
- Consider: index modification date vs. most recent git commit date; warn if index is older. Or: query for something known to have been recently added; fail if not found. Or: track "last indexed" timestamp in Step 0 output.

### F3 — Keep `mgrep watch` running as standard workflow
**Priority:** Medium.
**Issue:** `mgrep watch` is a continuous process. When it's not running (even after auth is valid), the index goes stale within hours/days of active development. The file-count limit (`--max-file-count 3000` for this repo today) is also easy to forget.
**Recommendation:** Add `mgrep watch --max-file-count 3000` to the project's standard startup workflow. Document in `PRE_BUILD_PROCESS.md` under tool installation/verification. Could also consider a VS Code task or a startup script that launches watch automatically when the project opens.

### F4 — Document the 1000-file default limit for mgrep
**Priority:** Low. Already captured in this report; duplicate into memory (`reference_mgrep.md`) and into the Pre-Build Process doc.
**Content:** "mgrep watch has a default file-sync limit of 1000. Repos larger than that need `--max-file-count N` or `MGREP_MAX_FILE_COUNT=N` env var. MyAIMCentral at 1345 files needs 3000+ for headroom."

### F5 — `gh auth login` if GitHub CLI operations become part of builds
**Priority:** Low (not on current critical path).
**Action:** `gh auth login` (interactive browser). Add `gh auth status` to Step 0 as optional-check if PR/issue operations become part of any build flow.

### F6 — Supabase CLI upgrade v2.84.2 → v2.90.0
**Priority:** Non-urgent, flagged per founder direction. Don't action.
**When to revisit:** When a needed feature is gated behind a newer CLI version, or during a general tooling-maintenance pass.

### F7 — codegraph native bindings vs WASM fallback
**Priority:** Low.
**Issue:** codegraph runs on WASM SQLite because `better-sqlite3` native bindings aren't loading. Functional but slower.
**When to revisit:** If codegraph query latency becomes a problem during builds.

### F8 — `codegraph sync` on current uncommitted wizard files
**Priority:** Low, situational.
**Issue:** 7 uncommitted wizard files exist in the working tree but aren't in the index yet. If work continues on them and codegraph is queried, those queries will miss them.
**Action:** Run `codegraph sync` when the wizard work stabilizes or is committed.

### F9 — Step 0 must surface mgrep quota state (paid tier headroom)
**Priority:** Medium — part of Task 4 Step 0 enhancement.
**Why:** Scale tier removes the hard quota limit but still has a $5 spending cap. A runaway indexer burning credits would exhaust the cap silently. Step 0's mgrep probe should surface remaining quota/credit state when possible, not just auth.
**Action (Task 4):** Investigate whether mgrep CLI exposes quota/credit info. If yes, add to Step 0. If no, add a documented reminder to check the Mixedbread dashboard periodically.

### F10 — `src/components/studio/wizards/` not appearing in mgrep searches
**Priority:** Medium, time-boxed.
**Issue:** Post-refresh, mgrep searches return zero `.tsx` results from this specific directory (tracked files `MeetingSetupWizard.tsx`, `StarChartWizard.tsx`, `GetToKnowWizard.tsx`, `RoutineBuilderWizard.tsx`, `SetupWizard.tsx` all git-tracked, all missing). Adjacent directories (`src/components/meetings/`, `src/components/gamification/*/`) return results normally.
**Hypothesis:** Async embedding lag on Apr 14–15 files. Upload succeeded (`Initial sync complete 1348/1348`); vectorization may be pending.
**Action:** Re-probe in 24h. If still missing, investigate Mixedbread-side embedding failures or file-level exclusion rules. Possible escalation to Mixedbread support.

### F11 — Add a `.mgrepignore` for noise + data-seed exclusions
**Priority:** Medium.
**Content to add:**
- `*.tmp.*.[0-9]*` — suppresses transient editor tmp-file upload/delete race events (currently generates noise in the watch log and pollutes search results with stale tmp paths)
- `supabase/migrations/*visual_schedule*.sql` — three large data-seed migrations, ~515K tokens combined, zero semantic-search value
- `supabase/migrations/00000000100115_play_dashboard_sticker_book.sql` — data seed (optional, ~91K tokens)
- Consider: `public/**` — explicit (defensive) exclusion of the `public/` directory so all binary assets are definitively excluded regardless of mgrep's built-in type filter
**Impact:** Frees ~500K+ tokens in the index for actual code/docs growth. Silences watch noise. Makes exclusions intentional rather than implicit.

### F12 — Duplicate binary asset: sittinglila.png
**Priority:** Low, not tool-related.
**Issue:** `public/sittinglila.png` and `public/decorations/sittinglila.png` are byte-for-byte identical (both 1.12 MB). Unrelated to mgrep — just bloat in the repo.
**Action:** Decide which copy is canonical, delete the other, update references.

### F13 — RESCINDED 2026-04-16
**Original action:** Set `MGREP_MAX_FILE_COUNT=3000` as a Windows user env var so the mgrep watch hook would pick it up.
**Rescinded because:** The deeper investigation (same day) found the hook never runs at all on this Windows machine — `python3` isn't installed, `C:\tmp\` doesn't exist, and the Python code itself has Unix-only kwargs. The env var would never be read because the hook never reaches that code path. Replaced with VS Code workspace task approach — see Finding 2b resolution.
**What is still useful about the env var:** If you manually run `mgrep watch` in a standalone terminal (outside the VS Code task), setting `MGREP_MAX_FILE_COUNT=3000` saves you from needing to remember the `--max-file-count` flag. Purely a convenience.

### F14 — Upstream issue to Mixedbread on watch hook
**Priority:** Medium (bumped from Low — now that we know the full scope of Windows incompatibility, reporting upstream is the only path to a clean fix).
**Action:** File an issue with the Mixedbread-Grep plugin describing all 4 Windows-incompatibility bugs found during the April 2026 sweep:
1. Hook script uses `python3` but Windows doesn't ship with Python 3 by default (default `python3` on Windows is the Microsoft Store installer stub).
2. Hook writes log files to `/tmp/` which resolves to `C:\tmp\` on Windows — a directory that doesn't exist in standard Windows installs. `open()` raises `FileNotFoundError`.
3. Hook uses `preexec_fn=os.setsid` in `subprocess.Popen` — Unix-only, raises `ValueError` on Windows.
4. Hook calls `subprocess.Popen(["mgrep", "watch"])` without `shell=True` — on Windows this won't find `mgrep.cmd` (the npm shim).
Also request:
- Hook surfaces non-success exit codes to Claude Code so silent failures become visible.
- Cross-platform PID/log file location (use `tempfile.gettempdir()` instead of hardcoded `/tmp/`).

### F16 — Optional Windows hygiene: disable `python3` MS Store alias + create C:\tmp\
**Priority:** Low.
**Correction to earlier F16 wording:** Real Python 3 IS installed on this machine (verified 2026-04-16 — `python --version` returns Python 3.10.6). The problem is specifically that the `python3` command name is intercepted by the Microsoft Store installer alias, not that Python itself is missing.
**Action:** In Windows Settings → Apps → Advanced app settings → App execution aliases, toggle OFF the entries for `python3.exe` / `Python3 (App Installer)`. Also `mkdir C:\tmp`.
**Benefit:** Makes `python3` resolve to the real Python install, and gives Unix-inspired tools the `/tmp/` directory they assume exists. Does NOT make the mgrep hook work — bugs 3 and 4 remain (Unix-only kwargs + shell=True issue). But cleans up 2 of the 4 incompatibility layers. Takes about 30 seconds. Worth doing when convenient, not urgent.

### F17 — Tool sweep methodology: check all VS Code MCP config locations
**Priority:** Medium.
**Issue:** During the initial sweep, I grep'd VS Code user settings for MCP references and reported "no VS Code-level MCP config" — but missed `.vscode/mcp.json` at the workspace level, which existed and registered AURI with the broken `npx -y endorctl` command. Discovered during the Windows hook investigation. Fixed in the same commit as Finding 2b's resolution.
**Action:** Update the sweep methodology (and Step 0 check) to inspect ALL of:
- `~/AppData/Roaming/Code/User/settings.json` (user-level)
- `.vscode/mcp.json` (workspace-level, NEW to check)
- `.vscode/settings.json` (workspace-level)
- `~/.vscode/argv.json` if present
- Any `devcontainer.json` files
Document in `specs/Pre-Build-Setup-Checklist.md`.

### F15 — src/ ratchet-watch: the repo grew from assumed ~400K tokens to actual ~1.8M tokens in `src/` alone
**Priority:** Low. Not a bug — an observation.
**What:** During this sweep, measured `src/` at ~1.78M tokens (chars/4 estimate) and total tracked textual content at ~7.6M tokens. Founder's mental model had `src/` at ~400K.
**Why it matters:** Token counts scale with Mixedbread quota consumption, LiLa context-assembly costs, and any future full-repo batch AI operations. A 4× delta between perceived and actual repo size is worth knowing, and worth re-measuring periodically.
**Action:** Re-measure quarterly or after any major feature-build wave. Log as a line in `CLAUDE.md` or a light `REPO_STATS.md` so the next sweep has a reference.

---

## Process lessons

1. **"Connected" is not "actually firing."** Verified twice in this single sweep — once with codegraph (MCP connected, index stale-and-locked), once with mgrep (authed, index stale). Both returned confident results that didn't match reality. If we'd trusted the initial `claude mcp list` pass without end-to-end probes, the sweep would have reported green across the board while two of three critical tools were silently broken.

2. **End-to-end tests must exercise real data flows.** `supabase status` checks local dev mode; `supabase projects list` checks cloud auth. For a cloud-only project, only the second reflects reality. Tool checks must match the project's actual usage pattern.

3. **Indexes on code need freshness checks, not just liveness checks.** This is new territory that Step 0 doesn't currently cover. Task 4 will address it.

4. **Silent failures accumulate.** Between AURI (weeks-to-months disconnected), mgrep (auth expired at unknown date), and codegraph (locked since Mar 28), at least three tools were silently broken at the time of this sweep. All "installed" per the setup checklist. None producing the benefits they were supposed to.

5. **Document limits, not just commands.** The 1000-file mgrep limit wasn't in the original setup doc. Future setup docs must include not just "run `mgrep watch`" but "run `mgrep watch --max-file-count N` where N is > your file count with headroom."
