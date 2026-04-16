---
name: prebuild
description: "Run the mandatory pre-build audit for a PRD. Reads the full PRD, finds all matching addenda, checks live schema gaps, creates the feature decision file, and populates CURRENT_BUILD.md. Invoke with a PRD number: /prebuild PRD-15"
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

**This step runs before anything else.** Do not read the PRD, do not search addenda, do not touch any other step until tool health is confirmed. Silent tool disconnects have historically gone undetected for weeks (AURI scanned nothing while we thought it was protecting auth code — see `claude/LESSONS_LEARNED.md` → "The Second Failure Mode: Silent Tool Drift").

### Required tools (hard halt if any are broken)

| Tool | Purpose | Check |
|---|---|---|
| codegraph MCP | Code graph queries for cross-file impact analysis | `claude mcp list` → must show `✓ Connected` |
| endor-cli-tools MCP (AURI) | Real-time security scanning of AI-generated code | `claude mcp list` → must show `✓ Connected` |
| mgrep CLI | Semantic search across PRDs, specs, and source | `mgrep whoami` → must return an authenticated user, not `Failed to refresh token` |

### Optional tools (surface status, do NOT halt)

| Tool | Notes |
|---|---|
| Gmail MCP, Google Calendar MCP | `! Needs authentication` is expected and acceptable. These are not required for code builds. |
| Google Drive MCP | If present and connected, note it. If disconnected, note it but do not halt. |

### Execution

1. Run `claude mcp list` and parse output for each server's status.
2. Run `mgrep whoami 2>&1 | head -3` and check for the auth-failed string.
3. Build the status table. Include the current timestamp in the header so future log reviews know when the check ran:

   ```
   Tool Health Check (before /prebuild PRD-XX) — YYYY-MM-DD HH:MM
   ───────────────────────────────────────────────────────────────
   ✓ codegraph MCP            — Connected
   ✓ endor-cli-tools (AURI)   — Connected (scan verification pending account setup)
   ✓ mgrep CLI                — Authenticated as Tenise
   ! Gmail MCP                — Needs auth (optional, OK)
   ! Google Calendar MCP      — Needs auth (optional, OK)
   ```

   Note: AURI `✓ Connected` confirms MCP reachability only. Full end-to-end scan verification requires Endor Labs account setup, tracked separately as a reconnaissance followup item. This is acknowledged and is not a hard halt — connection alone is sufficient for Step 0 to pass.

4. **If all required tools are green:** print "Tool health ✓ — proceeding to Step 1" and continue.

5. **If ANY required tool is broken: HALT.** Print:
   - Which tool failed
   - The exact fix command (see table below)
   - Instructions: "Resolve the broken tool, then re-invoke `/prebuild PRD-XX`"
   - **Do not proceed to Step 1.** Return from the skill.

### Fix commands (reference — print the relevant one on failure)

| Tool broken | Fix |
|---|---|
| `endor-cli-tools: ✗ Failed to connect` | `claude mcp remove "endor-cli-tools" -s local` then `claude mcp add endor-cli-tools "C:/Users/tenis/AppData/Roaming/npm/bin/endorctl.exe" -- ai-tools mcp-server` then `claude mcp list` to verify. Full context: `reference_auri_security.md` |
| `codegraph: ✗ Failed to connect` | Check `claude mcp get codegraph` for the registered command. Reinstall codegraph CLI if the binary is missing. |
| `mgrep: Failed to refresh token` | Tenise must run `mgrep login` in her OWN terminal (outside Claude Code — the device-code flow needs interactive stdin). Full context: `reference_mgrep.md` |

### Override Acknowledged (escape hatch — use sparingly)

If Tenise explicitly says "override acknowledged" or "proceed with override acknowledged" after seeing a failure, the skill may proceed BUT must:

1. Record an audit entry in `CURRENT_BUILD.md` under the active build's Pre-Build Summary section, using this exact format:

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

See `claude/LESSONS_LEARNED.md` → "The Second Failure Mode: Silent Tool Drift." The short version: tools that silently no-op get forgotten for months while we think we're getting their benefits. AURI was installed specifically to scan auth/permissions code. PRD-01 and PRD-02 shipped without it scanning anything because the MCP was `✗ Failed to connect` and no error ever surfaced. This check closes that gap before every build.

### Reference memory

Full mechanics of why each tool drifts and how to fix:
- `reference_auri_security.md` — AURI/endorctl quirks, npm-shim gotcha
- `reference_mgrep.md` — mgrep device-code auth flow, interactive requirement
- `feedback_windows_npm_path.md` — Windows 3-node-install PATH layering
- `feedback_mcp_verify_after_register.md` — general auth-backed-tool drift pattern

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
2. Read `claude/database_schema.md` — check the planned schema for this feature's tables
3. Identify gaps: tables the PRD requires that don't exist yet, columns that need adding
4. Read `WIRING_STATUS.md` — check what's wired vs stubbed that this feature connects to

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

## Step 5: Populate CURRENT_BUILD.md

Add a new build section to `CURRENT_BUILD.md` with:
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
