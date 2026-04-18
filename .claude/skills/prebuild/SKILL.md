---
name: prebuild
description: "Run the mandatory pre-build audit for a PRD. Reads the full PRD, finds all matching addenda, checks live schema gaps, creates the feature decision file, and populates the active build file under .claude/rules/current-builds/. Invoke with a PRD number: /prebuild PRD-15"
---

# Pre-Build Audit — Claude Code Skill

This skill enforces the mandatory pre-build ritual defined in `claude/PRE_BUILD_PROCESS.md`. Every feature build MUST start here. No exceptions.

## How to Invoke

```
/prebuild PRD-15
/prebuild PRD-18
/prebuild PRD-28B
```

The argument is a PRD number. If no number is provided, ask for one.

---

## Step 0: Tool Health Check (MANDATORY — HARD GATE)

**This step runs before anything else.** Do not read the PRD, do not search addenda, do not touch any other step until tool health is confirmed.

### The principle: Connected ≠ Functioning

Registration, authentication, and connection handshakes are necessary but NOT sufficient proof that a tool is working. A tool can report `✓ Connected` and still:
- Return errors on every actual tool call (codegraph with a stale database lock, April 2026)
- Work against a weeks-stale index that returns confident but wrong results (mgrep between initial sync and first refresh, April 2026)
- Successfully authenticate but have its quota exhausted, silently ingesting partial data (mgrep free tier, April 2026)
- Be wrapped by a plugin hook that runs the tool with a failing argument, writes the error to a log nobody reads, and reports success to Claude Code (mgrep watch hook, ongoing)

Step 0 probes each required tool END-TO-END — not just "is it connected" but "does a real call return real data." Connection check is a cheap first filter; the end-to-end probe is the proof.

### Pre-flight: Orphaned codegraph lock check

<!-- Per RECON Decision 11: orphaned lock directory mitigation -->

Before any tool health probes, check for an orphaned codegraph lock directory at `.codegraph/codegraph.db.lock`. This directory is codegraph's lockfile mechanism — when a codegraph process exits uncleanly (crash, SIGKILL, machine shutdown mid-operation), the directory is left behind and every subsequent tool call returns `"CodeGraph not initialized"` or `"database is locked"`. This is a known failure mode (codegraph April 2026 incident — three-week-stale lock silently broke every codegraph call).

**Behavior:** HARD GATE on detection. Do NOT auto-fix. The lock's existence is a diagnostic signal — it means the previous codegraph process crashed. Clearing it without inspection could mask a recurring issue. Require explicit user acknowledgment before proceeding.

**Probe (runs before any other Step 0 work):**

```bash
if [ -d ".codegraph/codegraph.db.lock" ]; then
  # Confirm no live codegraph process (avoids false positive on an active run).
  # Windows: tasklist | grep -i codegraph
  # Unix:    pgrep codegraph
  # If no live process → orphan. Hard gate.
fi
```

**On hit, print exactly:**

```
[HARD GATE] Orphaned codegraph lock detected: .codegraph/codegraph.db.lock

Likely cause: previous codegraph process exited without releasing lock.

Resolution: rm -rf .codegraph/codegraph.db.lock

This empty directory is the lock — removing it preserves the index.
Acknowledge with [continue] after running the command, or investigate
if you suspect a deeper crash before clearing.
```

**If the directory does not exist:** silent pass, continue to `### Required tools`.

### Required tools (hard halt if any are broken)

| Tool | Purpose | Connection Check | End-to-end Probe |
|---|---|---|---|
| codegraph MCP | Code graph queries for cross-file impact analysis | `claude mcp list` → `✓ Connected` | Call `mcp__codegraph__codegraph_status` — must return real index stats (files > 0, nodes > 0). NOT "CodeGraph not initialized" or "database is locked" |
| endor-cli-tools MCP (AURI) | Real-time security scanning of AI-generated code | (disabled — skip connection check) | Disabled until Developer Edition reinstall (per Finding F1, `RECONNAISSANCE_REPORT_v1.md`). Skip security scan step. |
| mgrep CLI | Semantic search across PRDs, specs, and source | `mgrep whoami` → authenticated user (not `Failed to refresh token`) | Freshness probe: `mgrep search "<known-recent identifier for this PRD>" .` — must return BOTH source files AND PRD markdown. If only markdown appears, the index is missing code — halt. |

### Optional tools (surface status, do NOT halt)

| Tool | Notes |
|---|---|
| Gmail MCP, Google Calendar MCP | `! Needs authentication` is expected and acceptable. These are not required for code builds. |
| Google Drive MCP | If present and connected, note it. If disconnected, note it but do not halt. |

### Execution

**Pre-flight:** Before any probes, run the orphaned codegraph lock check from `### Pre-flight: Orphaned codegraph lock check` above. If it hard-gates, HALT here and wait for explicit user acknowledgment before continuing.

1. **Connection checks (in parallel):**
   - `claude mcp list` → parse each server's status (reads `~/.claude.json` — NOT `.vscode/mcp.json`; see `specs/Pre-Build-Setup-Checklist.md` § MCP Configuration Location Sweep for the full six-location check methodology when drift is suspected)
   - `mgrep whoami 2>&1 | head -3` → check for auth-failed string

2. **End-to-end probes (for each required tool):**
   - codegraph: call `mcp__codegraph__codegraph_status` tool. Verify the response includes non-zero file/node counts.
   - mgrep: pick a freshness probe identifier appropriate to the PRD being built. Examples:
     - PRD-15 → search for `MessageCoachingSettings` (post-Mar-28 messaging code)
     - PRD-16 → search for `MeetingSetupWizard`
     - PRD-24 → search for `roll_creature_for_completion`
     - PRD-28 → search for (once built) `homeschool_time_logs` or similar
     - Default if no obvious recent identifier: search for `MeetingSetupWizard` as a known-post-Mar-28 baseline check
     If the probe returns zero source file results (only markdown), treat the index as stale and halt with a refresh instruction.
   - endor-cli-tools: connection-only for now (account setup pending). The caveat line MUST appear in the status table.

3. **Freshness heuristic (warn, do NOT halt):**
   - Compare `.codegraph/codegraph.db` modification time against `git log -1 --format=%ct`
   - If codegraph.db is older than the latest commit by > 24 hours, emit a yellow warning: "Codegraph index may be stale — last refreshed YYYY-MM-DD, most recent commit YYYY-MM-DD. Consider running `codegraph sync`."
   - Similarly for mgrep: if the mgrep freshness probe returns results but they feel sparse for the PRD's domain, note the concern — watch might have died or the index might have drifted. Not a halt.

4. **Build the status table.** Include the current timestamp so future log reviews know when the check ran:

   ```
   Tool Health Check (before /prebuild PRD-XX) — YYYY-MM-DD HH:MM
   ───────────────────────────────────────────────────────────────
   ✓ codegraph MCP            — Connected; probe returned 880 files / 10K nodes / 17K edges
   ✓ endor-cli-tools (AURI)   — Connected (scan verification pending account setup — F1)
   ✓ mgrep CLI                — Authenticated as Tenise; probe for "MeetingSetupWizard" returned 8 source files
   ! Gmail MCP                — Needs auth (optional, OK)
   ! Google Calendar MCP      — Needs auth (optional, OK)

   Freshness: codegraph index modified 2026-04-16 12:27 (latest commit 2026-04-16 10:15 — fresh ✓)
   ```

5. **If all required tools are green AND all end-to-end probes pass:** print "Tool health ✓ — proceeding to Step 1" and continue.

6. **If ANY required tool fails (connection OR probe): HALT.** Print:
   - Which tool failed and WHICH layer (connection vs probe)
   - The exact fix command (see fix table below)
   - Instructions: "Resolve the broken tool, then re-invoke `/prebuild PRD-XX`"
   - **Do not proceed to Step 1.** Return from the skill.

### Fix commands (reference — print the relevant one on failure)

| Tool broken | Layer | Fix |
|---|---|---|
| `endor-cli-tools: ✗ Failed to connect` | Connection | `claude mcp remove "endor-cli-tools" -s local` then `claude mcp add endor-cli-tools "C:/Users/tenis/AppData/Roaming/npm/bin/endorctl.exe" -- ai-tools mcp-server` then `claude mcp list` to verify. Full context: `reference_auri_security.md` |
| `codegraph: ✗ Failed to connect` | Connection | Check `claude mcp get codegraph` for the registered command. Reinstall codegraph CLI if the binary is missing. |
| `codegraph: probe returned "not initialized" or "database is locked"` | End-to-end | Check for stale lock: `ls .codegraph/codegraph.db.lock` (directory or file). If present and no codegraph process is running (`tasklist \| grep codegraph`), it's stale — `rm -rf .codegraph/codegraph.db.lock`. If the DB itself is corrupted, `rm -rf .codegraph && codegraph init && codegraph index` (takes 1-3 min, rebuilds from current code). |
| `codegraph: probe succeeded but index stale vs latest commit` | Freshness | `codegraph sync` (fast) or `codegraph index` (full rebuild). Warning only — not a halt unless the sweep specifically needs recent code. |
| `mgrep: Failed to refresh token` | Connection/Auth | Tenise must run `mgrep login` in her OWN terminal (outside Claude Code — the device-code flow needs interactive stdin). Full context: `reference_mgrep.md` |
| `mgrep: probe returned only markdown, no source files` | End-to-end | Index is stale or incomplete. Tenise runs `mgrep watch --max-file-count 3000` in her own terminal to refresh. (The plugin hook silently fails on MyAIMCentral because of the 1000-file default — see F13.) Wait for `✔ Initial sync complete` before re-invoking `/prebuild`. |
| `mgrep: quota exhausted` (on free tier) | Quota | Either wait for monthly quota reset, upgrade to paid tier, or add `.mgrepignore` exclusions to fit under limit. Scale tier ($20/mo) is the current MyAIM recommendation. |

### Interactive auth — NEVER attempt from within the skill

Some tools (mgrep login, gh auth login) require device-code flows that need interactive stdin. **Claude Code cannot complete these flows** — piping stdin breaks the handshake mid-flow (the CLI that initiated the device code must stay alive through browser approval and token save).

If a required tool needs interactive re-auth, the skill HALTS and tells Tenise to run the auth command in her own terminal. Do NOT try to fix it via `printf "y\n" | <command>` or similar — this has been tried, it breaks the flow, and Tenise will have to do it manually anyway.

### mgrep watch-hook silent-failure check (advisory)

After the main Step 0 probes pass, optionally check for the plugin hook failure pattern:
- Look for the most recent `/tmp/mgrep-watch-command-<session_id>.log` in `/tmp/`
- If it contains `File count exceeded` or `Quota exceeded` from this session's hook invocation, emit: "Advisory: mgrep plugin watch hook failed silently this session. Set `MGREP_MAX_FILE_COUNT=3000` as a persistent user env var (F13) OR manually run `mgrep watch --max-file-count 3000` in a long-lived terminal."
- Not a halt. Just visibility into a known issue.

### Override Acknowledged (escape hatch — use sparingly)

If Tenise explicitly says "override acknowledged" or "proceed with override acknowledged" after seeing a failure, the skill may proceed BUT must:

1. Record an audit entry in the active build file under `.claude/rules/current-builds/<build-name>.md` in its Pre-Build Summary section, using this exact format:

   ```
   YYYY-MM-DD HH:MM — Step 0 override: <tool name> <failure state>, Tenise proceeded with override acknowledged. Known gap: <what capability is missing this build>.
   ```

   Example:
   ```
   2026-04-16 14:32 — Step 0 override: mgrep auth expired, Tenise proceeded with override acknowledged. Known gap: semantic search unavailable this build.
   ```

2. Include the audit entry in the final pre-build summary presented for founder review (Step 6).

3. Do NOT treat "override acknowledged" as a standing authorization — it applies to this build only. Next `/prebuild` invocation re-runs Step 0 from scratch.

### Why this step exists

See `claude/LESSONS_LEARNED.md` → "The Second Failure Mode: Silent Tool Drift" and the Quick Reference patterns (Windows npm PATH, MCP Silent Disconnect, Auth Token Silent Expiry). The short version:

**Registration ≠ authentication ≠ connection ≠ functioning ≠ current.** Any of those layers can fail silently. Step 0's job is to probe every required layer for every required tool and halt the build if any layer fails.

Specific incidents closed by this check:
- **AURI** was installed, registered, and ignored for weeks while showing `✗ Failed to connect`. PRD-01 and PRD-02 shipped without it scanning anything. (April 2026)
- **codegraph** showed `✓ Connected` but had a 3-week-stale database lock. Every tool call returned "CodeGraph not initialized." (April 2026)
- **mgrep** authenticated, served queries, and returned confident results — from an index that hadn't been refreshed in weeks. Searches for recent code came back empty but looked plausible. (April 2026)
- **mgrep watch hook** (ongoing): runs `mgrep watch` with no flags, hits 1000-file default limit every session, writes error to a log nobody reads, reports success to Claude Code. See followup F13.

### Reference memory

Full mechanics of why each tool drifts and how to fix:
- `reference_auri_security.md` — AURI/endorctl quirks, npm-shim gotcha
- `reference_mgrep.md` — mgrep device-code auth flow, interactive requirement
- `feedback_windows_npm_path.md` — Windows 3-node-install PATH layering
- `feedback_mcp_verify_after_register.md` — general auth-backed-tool drift pattern

Full audit trail:
- `TOOL_HEALTH_REPORT_2026-04-16.md` — first comprehensive tool health sweep (the sweep that informed this Step 0 design)
- `claude/LESSONS_LEARNED.md` → "The Second Failure Mode: Silent Tool Drift" section + Quick Reference appendix

---

## Step 1: Locate and Read the Full PRD

1. Check `claude/feature_glossary.md` to find the PRD's category folder
2. Read the ENTIRE PRD at `prds/[category]/PRD-XX-FeatureName.md` — every word, not a skim
3. If the file doesn't exist at the expected path, search with Glob: `prds/**/PRD-XX*`

---

## Step 2: Find and Read Every Matching Addendum

1. Search `prds/addenda/` for ALL files containing the PRD number:
   - Glob: `prds/addenda/PRD-XX*` (e.g., `prds/addenda/PRD-15*`)
   - Also check for combined addenda (e.g., `PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md`)
2. Read EVERY file found — do not skip any
3. List every addendum file read by full filename

### Always-Relevant Addenda (check for EVERY build)

| Addendum | When It Applies |
|---|---|
| `PRD-Audit-Readiness-Addendum.md` | ALWAYS — every build |
| `PRD-Template-and-Audit-Updates.md` | Any feature using templates |
| `PRD-31-Permission-Matrix-Addendum.md` | Any feature with permissions or tiers |
| `PRD-35-Cross-PRD-Impact-Addendum.md` | Any feature with scheduling or recurrence |
| `PRD-36-Cross-PRD-Impact-Addendum.md` | Any feature with time tracking or timers |

Read the applicable always-relevant addenda too.

---

## Step 3: Check Schema Gaps

1. Read `claude/live_schema.md` — check what tables exist in the live database right now
2. Identify gaps: tables the PRD requires that don't exist yet, columns that need adding
3. Read `WIRING_STATUS.md` — check what's wired vs stubbed that this feature connects to

---

## Step 4: Create the Feature Decision File

Create `claude/feature-decisions/PRD-XX-FeatureName.md` using the template at `claude/feature-decisions/_TEMPLATE.md`.

Fill in ALL sections:
- **What Is Being Built** — one paragraph, plain language
- **Screens & Components** — exhaustive list of every UI element
- **Key PRD Decisions** — things most likely to be missed or built wrong
- **Addendum Rulings** — every decision from every addendum
- **Database Changes Required** — every table, column, index, trigger, migration
- **Feature Keys** — every feature key with tier and role groups
- **Stubs** — explicit list of what NOT to build this phase
- **Cross-Feature Connections** — what this feature sends/receives from others
- **Things That Connect Back Later** — future features that will wire into this one

---

## Step 5: Create the Active Build File

Create `.claude/rules/current-builds/<build-name>.md` (e.g., `PRD-30-safety-monitoring.md`). Do NOT add YAML `paths:` frontmatter — the folder auto-loads unconditionally via Claude Code's recursive `.claude/rules/` discovery, and `paths:` frontmatter would make it path-conditional and break the auto-load.

Populate the file with:
- Status: **ACTIVE**
- PRD file path
- Every addendum file read (list them ALL)
- Feature decision file path
- Complete pre-build summary with these subsections:
  - **Context** — what exists, what's new, why this matters
  - **Dependencies Already Built** — hooks, components, tables that exist
  - **Dependencies NOT Yet Built** — what's missing that this feature needs
  - **Build Items** — numbered list of every concrete deliverable
  - **Stubs** — what is NOT being built and why
  - **Key Decisions** — architectural choices with rationale

---

## Step 6: Present Summary for Founder Review

Output the complete pre-build summary and ask Tenise to review:

> "Here is the pre-build summary for PRD-XX. Please review:
> - Are all requirements captured correctly?
> - Are the stubs right — nothing missing, nothing extra?
> - Have any decisions changed since the PRD was written?
> - Anything to adjust before build begins?"

**Do NOT write any code until the founder explicitly confirms.**

---

## Critical Rules

1. **PRDs are the SINGLE SOURCE OF TRUTH.** If the PRD says it, build it. If it doesn't, don't.
2. **The PRDs ARE the minimum.** Never suggest an "MVP approach" or "simpler version for now." If something can't be built correctly, stop and ask Tenise.
3. **Never modify files in `prds/`, `specs/`, or `reference/`.** These are read-only source material.
4. **List every addendum you read.** If you read it, it goes in the summary.
5. **Zero Missing items before code.** Every requirement must be Wired, Stubbed, or explicitly approved as deferred.
6. **This skill produces the plan only.** It does NOT write code. The founder reviews and approves before any code is written.
