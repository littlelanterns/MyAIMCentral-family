# How We Broke Our AI-Assisted Build — And The Process That Fixed It

> A postmortem and playbook for solo founders building complex software with AI coding assistants.
> From the MyAIM Central project — a 42-PRD family management platform built by one founder with AI.

---

## The Setup

MyAIM Central is a large-scale family management and personal growth platform. The scope is ambitious: 42 PRDs (Product Requirements Documents), ~165 database tables, five role-based UI shells, an AI assistant, gamification, scheduling, messaging, compliance reporting — the works.

The founder (Tenise) spent weeks writing detailed PRDs and addenda for every feature. These weren't vague wish lists — they were precise specifications with every screen, every field, every interaction, every edge case, every empty state documented. The planning was thorough and intentional.

Then it was time to build. With AI.

---

## What Went Wrong

### Phase 1-8: The Slow Disaster

We built features in phases, working through the PRD list. Each phase felt productive — code was being written, components were appearing, features were taking shape. But underneath, problems were compounding.

**The core failure mode: The AI was building from summaries instead of source material.**

Here's how it happened:

1. **Schema summaries replaced PRDs.** The project had a `database_schema.md` file (now archived — see `claude/live_schema.md` for current schema reference) — a convenient reference summarizing all ~165 tables. The AI would read this summary and start building. The problem? A summary captures the *shape* of a feature, not the *intent*. Column names don't tell you which fields are required on which screens, what the empty states should say, how features interact, or what the edge cases are. The PRDs had all of this. The schema summary had none of it.

2. **Addenda were missed entirely.** Many PRDs had addenda — follow-up documents capturing decisions made after the base PRD was written. These addenda often *overrode* or *clarified* the base PRD. For example, an addendum might say "use `access_schedules` instead of `shift_schedules`" or "this table name was changed from X to Y." When the AI only read the base PRD (or worse, only the schema summary), it built against outdated or incomplete specifications.

3. **"MVP" shortcuts accumulated.** The AI would suggest "for now, let's just..." or "a simpler version would be..." and implement a reduced version of what the PRD specified. Each individual shortcut seemed reasonable. But across 8 build phases, hundreds of these small reductions meant the built product was fundamentally different from the designed product. Features were half-wired. Interactions were stubbed. Edge cases were ignored. The delta between "what was built" and "what was designed" grew with every phase.

4. **Build prompts were generated from bad data.** Early in the project, we generated "build prompt" files from the schema summary to guide each phase. These build prompts inherited every error and omission from the summary. They became a layer of abstraction between the AI and the actual requirements — a game of telephone where the message degraded at each step. We eventually had to ban these files entirely (42 files moved to `archive/old-build-prompts/` and marked as poisoned).

5. **No verification against source material.** After each phase, there was no systematic check of "did we build what the PRD actually says?" Code was written, it compiled, it rendered something on screen — and the phase was marked complete. Nobody went back to the PRD line by line to verify.

### The Audit: 578 Failures

After 8 phases of building, we ran a comprehensive audit. Every built feature was checked against its source PRD and addenda.

**Result: ~578 failures across 9 categories.**

These weren't cosmetic issues. They included:
- Wrong table names (building against the old schema summary instead of audit rulings)
- Missing fields that the PRD explicitly required
- Features wired to the wrong data sources
- Interactions that didn't match the PRD's specification
- Cross-feature connections that were completely absent
- Entire sub-features that were stubbed when they should have been built
- UI patterns that contradicted the design system PRD

The 578 failures took **10 remediation phases** to fix. That's 10 phases of rework — tearing out wrong code and rebuilding it correctly — that could have been avoided if the code had been built right the first time.

---

## The Root Cause

The root cause wasn't that the AI was bad at coding. The code quality was fine. The architecture was reasonable. The components were well-structured.

**The root cause was that the AI was building the wrong thing correctly.**

When you give an AI a schema summary and say "build the tasks feature," it will produce a competent tasks feature — but one based on its interpretation of column names, not on the detailed behavioral specification in the PRD. It doesn't know that `incomplete_action` has six specific options with specific behavioral rules unless it reads the PRD. It doesn't know that Fresh Reset is the *default* for routines unless it reads the addendum. It doesn't know that `studio_queue` replaces `task_queue` unless it reads the audit rulings.

The AI builds confidently from whatever context it has. If that context is incomplete, the build is confidently wrong.

---

## The Fix: The Pre-Build Process

After the audit and remediation, we designed a mandatory process that runs before any code is written. It has been in effect for every build phase since, and the error rate has dropped to near zero.

### The Mandatory Ritual

#### Step 1: Read the Full PRD
Not a skim. Not a summary. The full document, every section, every word. The AI must process the actual source material — the PRD that the founder spent days writing.

#### Step 2: Read Every Matching Addendum
Search the addenda directory for every file that matches the PRD number. There are often multiple addenda per PRD, and they contain decisions that override or clarify the base document. Missing an addendum means building against outdated specs.

#### Step 3: Create a Feature Decision File
A permanent record in `claude/feature-decisions/` that captures:
- Every screen and interaction from the PRD
- Every addendum ruling that affects this build
- Every cross-feature connection
- Every explicit stub (what NOT to build, and why)
- Every edge case and empty state

This file does NOT duplicate the PRD — it's a build-focused extraction that ensures nothing is missed. It stays in the codebase permanently as reference.

#### Step 4: Populate the Build Context File
A new file at `.claude/rules/current-builds/<build-name>.md` is created with the complete pre-build summary. The `.claude/rules/current-builds/` folder auto-loads into every AI conversation via Claude Code's native recursive discovery, so the build context is always present.

#### Step 5: Founder Review Before Code
The pre-build summary is presented to the founder. She reviews:
- Is everything captured correctly?
- Have any decisions changed since the PRD was written?
- Are the stubs appropriate?
- Is anything missing?

**No code is written until the founder explicitly confirms.** This is the gate that prevents the AI from confidently building the wrong thing.

#### Step 6: Build With Full Context
Code is written with the complete PRD, addenda, and feature decision file loaded. During the build, if something doesn't match the PRD, work stops and the founder is consulted. No interpretation. No improvisation.

#### Step 7: Post-Build Verification
After the build, every requirement from the pre-build summary is checked line by line:
- **Wired**: Built and functional
- **Stubbed**: Documented placeholder with entry in the stub registry
- **Missing**: Not built, not stubbed — build is incomplete

**Zero Missing items required.** The verification table is presented to the founder as the handoff report. This is the check that phases 1-8 were missing entirely.

#### Step 8: File Updates
Documentation is updated: schema docs, stub registry, wiring status, build status. The feature decision file gets the verification results appended. The build context file resets to IDLE.

---

## Why It Works

### 1. Source Material, Not Summaries
The AI reads the actual PRD — the document the founder carefully wrote — not a derivative summary. This eliminates the telephone game.

### 2. Completeness Check Before Building
The feature decision file forces the AI to enumerate every requirement before writing code. You can't miss what you've explicitly listed.

### 3. Human Gate Before Code
The founder reviews the plan before implementation begins. This catches misunderstandings when they're cheap to fix (changing a bullet point) rather than expensive (rewriting a component).

### 4. Verification Against Source
The post-build check ensures the built product matches the designed product. Every requirement gets a status. Nothing slips through.

### 5. Institutional Memory
The feature decision files, stub registry, and build status documents create a permanent record. Future build phases inherit knowledge from past phases. The AI doesn't re-discover the same decisions.

---

## Key Principles We Learned

### "The PRDs ARE the minimum."
This became a mantra. When the AI suggests "for now, let's just..." or "a simpler version would be..." — the answer is no. The PRDs were carefully designed as the minimum viable product. They're not a ceiling to aim toward later; they're the floor to build from now. If something can't be built correctly right now, stop and ask the founder. Don't substitute a simpler version without explicit approval.

### "Build it right or don't build it yet."
Half-built features create more work than unbuilt features. A properly documented stub (with a PlannedExpansionCard in the UI and an entry in the stub registry) is better than a half-implemented feature that looks done but isn't.

### "Never build from summaries."
Schema docs, build prompts, feature glossaries — these are navigation aids, not building specifications. They help you find the right PRD. They are not substitutes for reading it.

### "The AI builds confidently from whatever context it has."
This is the fundamental insight. AI coding assistants don't express uncertainty about specifications. They don't say "I'm not sure what this field should do, let me check the PRD." They make a reasonable assumption and build it. If the context is wrong, the build is wrong — and it looks right until you audit it.

### "Verification is not optional."
"I wrote the code and it compiles" is not verification. "I checked every requirement in the PRD against what was built" is verification. The post-build verification table is what makes the difference between "it looks done" and "it is done."

---

## The Second Failure Mode: Silent Tool Drift

The pre-build process fixed "building the wrong thing correctly." Months later we discovered a different class of silent failure: **integrated tools that stop working without anyone noticing.**

### The Discovery

On 2026-04-16, the founder asked a casual question: "What was the AURI thing we did for security stuff?" AURI (Endor Labs security scanner) had been set up as an MCP server specifically to scan AI-generated authentication and permissions code in real time. The entire point of installing it was that PRD-01 and PRD-02 were the highest-security-risk features in the codebase.

A quick check revealed:
- The MCP server was registered in the config exactly as planned.
- It had been registered with status `✗ Failed to connect` for an unknown period — possibly since initial setup.
- Claude Code had been happily building auth and permissions code without the scanner active the entire time.
- Zero error messages. Zero warnings. Zero hints that anything was wrong.

The same check uncovered that `mgrep` (a semantic code search tool that was supposed to replace regex grep for cross-PRD consistency checks) had also silently disconnected — its auth token had expired. Every `mgrep search` call was returning "Failed to refresh token" and Claude Code was quietly falling back to regular Grep, losing the semantic search capability entirely.

### How It Happened

**AURI / endorctl (Endor Labs security scanner):**
The `endorctl` npm package uses a `go-npm` postinstall script that downloads the Go binary AFTER npm's shim-generation step finishes. On Windows, this means the binary lands at `AppData\Roaming\npm\bin\endorctl.exe` — but the `endorctl.cmd` shim that SHOULD exist at `AppData\Roaming\npm\endorctl.cmd` (which is on PATH) never gets created. So `npx -y endorctl ai-tools mcp-server` in the MCP config silently fails because `endorctl` isn't on PATH. The binary exists. It's just not callable by name.

**mgrep:**
Authentication token expired. Device-code flow is required to re-authenticate, which is interactive and can't be completed through a piped shell. The tool kept running, accepting commands, and returning "Failed to refresh token" — but Claude Code just fell back to regular grep without surfacing the degradation.

### The Pattern

Both failures share a structure:

1. **Tool is registered correctly.** Config files are clean. Packages are installed. Nothing looks wrong.
2. **Initial setup works.** There's a moment where the tool functions normally.
3. **State drifts.** Auth expires. A package update breaks a shim. A machine reboots and a watch process doesn't restart. PATH gets reordered.
4. **No error surface.** MCP tools that can't connect just don't get called. CLI tools with expired tokens fall back to a graceful error message that doesn't interrupt the flow. Claude Code, built to be helpful, reaches for an alternate tool without mentioning the gap.
5. **The founder assumes the tool is still working** because it was set up correctly and nothing has broken loudly. Months pass.
6. **Discovery is accidental** — usually triggered by "hey, why haven't we been using X?" rather than by any warning system.

The failure isn't in the tools. It's in the absence of a verification layer between "we registered it" and "it's actively running every time we think it is."

### The Fix

The same principle that fixed the PRD drift applies to tool drift: **make verification mandatory, not optional.**

1. **Every `/prebuild` invocation now runs a tool health check first.** Three seconds: `claude mcp list` + `mgrep whoami`. If any expected tool is failed or unauthenticated, the skill refuses to proceed with the audit. A silent failure this session is caught within one build cycle, not months later.
2. **The reconnection procedure for each tool is documented** (in memory and in this lessons file). When something's broken, the fix path is one command, not a debugging session.
3. **Package quirks are recorded.** For go-npm packages like endorctl, the MCP config uses the full binary path instead of `npx -y <pkg>`. PATH gotchas are documented so they don't have to be re-derived.
4. **Windows-specific PATH layering is a known gotcha.** Three node installations coexist on this machine (`Program Files\nodejs`, `nvm4w\nodejs`, `AppData\Roaming\npm`). The one that runs isn't always the one where packages land. `where <cmd>` + `npm config get prefix` is always the first debug step.

### The Second Insight

> "Silent tool failures are worse than loud ones. A tool that errors loudly gets fixed immediately. A tool that silently no-ops gets forgotten for months while you think you're getting its benefits."

AURI was installed for the highest-security-risk features in the entire codebase. PRD-01 and PRD-02 shipped without it having scanned a single line. That's not a tooling quirk — that's weeks of security-sensitive code written without the safety net that was supposed to catch problems. The scanner wasn't broken. Our assumption that "it's installed, so it's running" was broken.

### The Rule

If you depend on a tool, verify it's actually running. Before every build session. Not occasionally. Not when you remember. Every time. The cost of the check is seconds. The cost of assuming is weeks of unscanned code or a shipped auth vulnerability.

This applies to MCP servers, auth-backed CLIs (semantic search, cloud DB tools, issue trackers), language servers, linters wired to IDE plugins, deploy webhooks, cron jobs, background workers — anything that's supposed to be happening but you can't see happening.

The check doesn't have to be elaborate. It just has to run.

---

## The Numbers

| Metric | Before Process | After Process |
|--------|---------------|---------------|
| Audit failures per phase | ~72 average | Near zero |
| Rework phases required | 10 (remediation) | 0 |
| Time spent on rework | More than original build | N/A |
| Features matching PRD spec | ~60-70% | ~98-100% |
| Addenda rulings missed | Routinely | None |
| Founder surprises at review | Frequent | Rare |

---

## For Other Solo Founders

If you're building a complex product with AI assistance, here's the distilled advice:

1. **Write detailed specs before you build.** The AI is only as good as the context you give it. Vague specs produce vague implementations.

2. **Make the AI read the actual spec, not a summary.** Load the full document into context. Yes, it uses tokens. It's worth it.

3. **Gate code behind human review of the plan.** Have the AI tell you what it's going to build *before* it builds it. Review that plan against your spec. This is the highest-leverage intervention.

4. **Verify after building.** Go through your spec line by line and check each item against the built product. Use a status table (Wired / Stubbed / Missing). Accept nothing less than zero Missing items.

5. **Never accept "for now" shortcuts without explicitly approving them.** Each shortcut seems small. They compound into a product that doesn't match your vision.

6. **Document decisions permanently.** Feature decision files, stub registries, convention docs — these are the institutional memory that makes the next build phase smarter than the last.

7. **Ban derivative documents that drift from source.** If you have build prompts or summaries generated from your specs, they WILL drift. When they do, they poison every build that uses them. Either keep them rigorously updated or delete them.

The AI is an incredibly powerful building tool. But it needs guard rails — not on its coding ability, but on its understanding of *what to build*. The pre-build process is those guard rails.

---

## Timeline

| Date | Event |
|------|-------|
| Early 2026 | 42 PRDs and addenda written over several weeks |
| Feb-Mar 2026 | Phases 01-08 built with AI assistance |
| 2026-03-23 | Comprehensive audit reveals ~578 failures |
| 2026-03-23 | Pre-build process designed and documented |
| 2026-03-23 to 2026-03-25 | 10 remediation phases fix audit failures |
| 2026-03-25 | Remediation complete. Process proven. New builds begin. |
| 2026-04-16 | Second failure mode discovered: silent tool drift. AURI disconnected since initial setup, mgrep index 3 weeks stale, codegraph database locked. Full tool sweep conducted (see `TOOL_HEALTH_REPORT_2026-04-16.md`); Step 0 tool health check added to `/prebuild` skill; quick-reference patterns below added for rapid lookup. |
| 2026-04-17 | Claude Code install/update wiped bundled npm from active nvm4w Node version (Finding 3.4 resolved). Fixed via surgical copy of npm 10.8.2 from an intact sibling Node version — no config/PATH changes, fully reversible. Failure pattern added to Silent-Failure Patterns below. |

---

## Quick Reference: Silent-Failure Patterns

Named patterns for rapid lookup during troubleshooting. Full context in the narrative sections above.

### Pattern: Windows npm PATH Layering
**Symptom:** `npm install -g <package>` succeeds. The command is unavailable or runs an old version. `where <command>` shows multiple paths or nothing. A tool you "just installed" behaves as if it wasn't installed.
**Root cause:** On Tenise's Windows machine, three node/npm installations coexist (`C:\Program Files\nodejs\`, `C:\nvm4w\nodejs\`, `C:\Users\tenis\AppData\Roaming\npm\`). PATH resolution picks the first match; global installs land in the Roaming folder. The folder that runs the command isn't always the folder where packages land.
**Detection:** `where <command>` shows multiple locations (or none); `npm config get prefix` shows a different folder than what's actually on PATH first.
**Fix:** Install directly into the folder that wins PATH resolution, OR use full binary paths for anything that needs to be reliably callable by name. For go-npm packages (endorctl, a few others), the postinstall writes the binary to `<prefix>/bin/<name>.exe` — which is NOT on PATH — and no `.cmd` shim gets created. Always use the full binary path for these.
**Prevention:** Setup-checklist Step 2 documents the full-binary-path approach for AURI/endorctl. `/prebuild` Step 0 catches connection failures that result from this class of issue. Memory: `feedback_windows_npm_path.md`.

### Pattern: MCP Silent Disconnect
**Symptom:** `claude mcp list` shows a server as `✗ Failed to connect`. Claude Code never calls the MCP's tools because they aren't available. No error surfaces during builds. Time passes; the expected benefit of the tool doesn't happen.
**Root cause:** MCP registration is non-validating — `claude mcp add` succeeds as long as the config is syntactically valid. It doesn't attempt to start the server. If the command path is wrong, the server silently fails to start on first use, and Claude Code routes around it without mention.
**Detection:** `claude mcp list` shows `✗ Failed to connect` for the affected server. Alternative signal: the tool hasn't been used for an unexpectedly long time despite being expected to run.
**Fix:** `claude mcp get <name>` to inspect the registered command. Run the command manually (outside the MCP wrapper) to see the actual error. Re-register with a corrected command; verify with `claude mcp list` shows `✓ Connected`.
**Prevention:** `/prebuild` Step 0 hard-gates on `✗ Failed to connect` for required MCPs. Documented reconnection commands live in per-tool memory files (e.g. `reference_auri_security.md`). After every `claude mcp add`, immediately run `claude mcp list` before walking away.

### Pattern: Auth Token Silent Expiry
**Symptom:** A CLI tool that previously worked starts returning "Failed to refresh token" or similar. Tool appears installed. Claude Code silently stops using it and falls back to a less-capable alternative (e.g., mgrep → regular Grep). No error surfaces to the user. Results still come back but from a less capable tool or a stale cached state.
**Root cause:** Refresh tokens have finite lifetimes. When they expire and the auto-refresh fails, the tool surfaces the error to stdout/stderr but upstream wrappers (Claude Code plugin hooks, agent code) may not propagate it. The tool "runs" but produces no useful work.
**Detection:** Tool-specific whoami/status commands (`mgrep whoami`, `gh auth status`, `vercel whoami`, `supabase projects list`). If auth is bad, these surface the error cleanly. Alternative signal: a capability that previously worked degrades quietly — e.g., semantic searches returning only markdown because the CLI is failing and a fallback to regex search took over.
**Fix:** Re-authenticate via the tool's login command. **Interactive device-code flows (mgrep login, gh auth login) require a real terminal** — piped stdin breaks the handshake mid-flow. The user runs these in their own terminal, then Claude Code verifies after.
**Prevention:** `/prebuild` Step 0 runs `mgrep whoami` as a required check. Per-tool memory files document the re-auth procedure. Generalizes: any auth-backed tool needs an explicit auth check at session start, not just a "does the binary exist" check. Reference: `feedback_mcp_verify_after_register.md` (extends beyond MCPs to any auth-backed CLI).

### Pattern: Wrapper Reports Success When Tool Didn't Run
**Symptom:** A plugin hook, scheduled task, or CI step "runs successfully" — no errors surfaced, parent process reports completion — but the work it was supposed to do never happened. Evidence of the work (log files, side effects, index updates) is absent but nobody looks for it.
**Root cause:** Wrappers check "did the subprocess exit within the timeout" but not "did the subprocess do what it was supposed to do." When the subprocess is an interpreter (`python3 script.py`, `node script.js`, `bash -c '...'`), if the interpreter itself isn't installed OR is shadowed by a stub (Microsoft Store alias, missing dependency, platform mismatch), the wrapper's success check passes even though zero real work happened. Classic example: the Mixedbread-Grep Claude Code plugin hook runs `python3 mgrep_watch.py` on every session start — but on Windows, `python3` as a command name is registered as a Microsoft Store "App execution alias" that intercepts the call before it reaches any real Python installation. Real Python 3 CAN be installed on the same machine (callable as `python` or `py`) and the hook still fails because it specifically asks for `python3`. The MS Store stub exits in under a second. Claude Code treats "hook exited within 10 seconds" as success. The hook hasn't done its job since the day the plugin was installed.
**Detection:** Look for evidence of the work, not evidence of the wrapper. For hooks that should write log files: does the log file exist, and is its timestamp after the wrapper ran? For hooks that should start background processes: is the process actually running? For hooks that should produce side effects: did the side effect occur? Running the hook command manually outside the wrapper surfaces errors the wrapper hides. On Windows, explicitly test the exact command name the hook uses — `python3 --version` may return the Microsoft Store install-prompt stub even when `python --version` or `py --version` return real Python. Any hook expecting `python3` as a command is silently no-op on a Windows machine that hasn't disabled the Store alias, regardless of whether Python is actually installed.
**Fix:** Layered — (a) verify the hook actually runs by running it manually and checking its specific outputs, (b) if the wrapper mechanism is fundamentally broken for your platform (as the Mixedbread hook is on Windows), replace it with a different mechanism that can't fail silently (e.g., VS Code workspace task with visible terminal output instead of a Python hook writing to a log nobody reads), (c) file upstream issue to fix the wrapper for everyone.
**Prevention:** Never trust wrapper success. When adding any hook/task/scheduled job, verify outputs exist (not just exit code). When replacing a Unix-authored tool's hook on Windows, assume it's broken until proven working. Prefer mechanisms that surface output visibly (VS Code tasks with a Terminal panel tab, systemd services with logs, CI with streaming output) over mechanisms that write to logs nobody reads. Reference: `TOOL_HEALTH_REPORT_2026-04-16.md` Finding 2b for the full 4-bug case study.

### Pattern: Claude Code install/update corrupting bundled npm when run with wrong cwd
**Symptom:** `npm --version` and `npx --version` fail with `Cannot find module '<node-install>\node_modules\npm\bin\npm-cli.js'`. `node --version` still works. Project-local `node_modules/.bin/tsc` still works (local binaries callable). The pre-commit hook that runs `npx tsc --noEmit` crashes with a misleading "TypeScript errors" message, forcing `--no-verify` on every commit until the root cause is diagnosed.
**Root cause:** A Claude Code update or install operation runs as a local (non-`-g`) `npm install` with the active Node install folder (e.g., `C:\nvm4w\nodejs\`) as its cwd. npm interprets that folder as a project root, writes a local `node_modules` tree, and in the process wipes the bundled `npm/` package that was shipped with that Node version. The other Node versions on the machine are unaffected — only the specifically-active version breaks. The nvm4w install, the symlink, the Node runtime, PATH, the registry, and user globals at `%APPDATA%\npm\` all remain intact. Failure is scoped narrowly to one version's `node_modules/npm/` being gone.
**Detection:** The most reliable signature is a `.package-lock.json` file sitting directly at the top of `<node-install>/node_modules/` with a `"name"` field matching the install folder name (e.g., `"name": "nodejs"`) and a packages list that contains non-npm packages (`@anthropic-ai/claude-code`, `@img/sharp`, etc.) but no `node_modules/npm` entry. Confirm by `ls <node-install>/node_modules/` and looking for a missing `npm/` subdirectory. Comparable sibling Node versions (via `nvm list`) will still have intact `npm/` under their own `node_modules/`.
**What to check after any Claude Code update:** Run `npm --version` for each nvm4w Node version, especially the currently-active one (`nvm current`). If the active version fails with `Cannot find module … npm-cli.js`, the install event has corrupted the bundled npm. Also inspect `<node-install>/node_modules/.package-lock.json` — if it exists and doesn't belong to npm, a wrong-cwd install happened.
**Fix:** Surgical copy of `npm/` from another intact Node version's `node_modules` into the broken version's `node_modules`. npm is bundled per Node version but is fully self-contained, so any sibling version's npm (same major ideally, but minor-version mismatches are fine) restores functionality. The operation is offline, reversible (delete the copied folder to return to broken state), doesn't touch nvm4w config or PATH, and doesn't disturb the stray `@anthropic-ai/claude-code` local install that remains alongside. Example: `cp -r "C:/Users/tenis/AppData/Local/nvm/v20.19.3/node_modules/npm" "C:/Users/tenis/AppData/Local/nvm/v20.10.0/node_modules/npm"`. Verify via `npm --version`, `npx --version`, `npm install --dry-run`, and running the pre-commit hook manually.
**Prevention:** Before running any Claude Code update command manually, confirm cwd is in the project directory, NOT in a Node install directory. After any Claude Code update, run a quick `npm --version` sanity check. If you have multiple nvm4w versions, keep at least two installed so you always have a clean sibling to copy from if the active version gets corrupted. Reference: Finding 3.4 in `RECONNAISSANCE_REPORT_v1.md` for the original incident; `C:\tmp\nvm4w-diagnosis.md` (session-local) for the full diagnosis trail.

---

## Quick Reference: Convention Hygiene Patterns

Named patterns for conventions that looked right when written but turned out wrong in practice. Same shape as the Silent-Failure patterns above — rule was written assuming a tool/process behaved one way, real use showed it behaved differently — but the failure is in the *convention*, not in the tooling itself.

### Pattern: Convention Cost Evaluation
**Symptom:** A convention in `CLAUDE.md` or a rule file prescribes a paid external tool as "required default" or "primary workflow." Cost data after real-world use reveals the projected monthly burn rate is an order of magnitude higher than the assumption the convention was written under. The convention becomes the thing blocking work instead of the thing accelerating it — and worse, the pressure to rewrite it lands mid-build when there's no time to evaluate calmly.
**Root cause:** The convention was drafted while the tool was cheap — trial tier, promotional pricing, or an early usage pattern that didn't exercise the real cost surface. Over the first days or weeks of genuine use, the cost shape reveals itself. But by then the convention has already been institutionalized across multiple files (CLAUDE.md, PRE_BUILD_PROCESS.md, skill files, memory entries) and the rewrite is a multi-file commit under time pressure instead of a design decision made up front.
**Detection:** Track actual spend per tool over the first real-use window (first week of audit, first sprint of builds, first month of operation). If a single tool's projected monthly cost exceeds its category budget by more than 2× — or if the tool hits a spend-limit error during normal work — the convention that mandates it is wrong and needs to be re-evaluated before the cost compounds. Concrete threshold: any tool with a usage-based cost surface should get a 72-hour cost-sanity check before being promoted from "trial" to "required default."
**Fix:** Invert the convention in one scoped commit — demote the tool from "required default" to "per-query-approved escape hatch." Update every file that references the old stance (CLAUDE.md conventions, `PRE_BUILD_PROCESS.md` prerequisites, prebuild skill's tool-health table, memory feedback/reference entries, MEMORY.md index line) in the same commit so nothing drifts. Log a finding in the active audit report if one is running, so the cost-vs-benefit ratio can be measured during the audit window and the decision can be revisited with real data.
**Prevention:** Before writing any convention that depends on a paid external tool, answer three questions in the convention's own text: (1) What is the tool's cost surface — per-query, per-file-indexed, per-seat, flat subscription? (2) What's the projected monthly cost at the expected usage pattern? (3) What's the fallback if the tool becomes too expensive, hits a spend limit, or loses auth? If any answer is "I don't know," the convention isn't ready to be institutionalized. Historical cases: **mgrep Scale tier** ($20/mo + $20 credits + $5 cap) burned $36.54 in 36 hours of Phase 2 audit use, projecting $300+/month — Convention 242 was inverted 2026-04-18 from "mgrep-primary, Grep/Glob prohibited" to "Grep/Glob primary, mgrep per-query-approved." **Endor Labs AURI** (Developer Edition, free) was verified as free-tier-sustainable before adoption — no cost-evaluation gap. The difference is whether the cost-sanity check happened before or after the convention was institutionalized.

---

*Written from the trenches of a real project. The mistakes were expensive. The process that fixed them was not complicated — it just had to be mandatory.*
