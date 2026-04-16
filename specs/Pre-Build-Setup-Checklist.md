# MyAIM Family: Pre-Build Setup Checklist
## Everything That Happens Between "All PRDs Done" and "First Line of Code"

**Purpose:** This checklist lives in project knowledge as a reminder card. When all PRDs are written and you're ready to transition from planning to building, open this document and work through it in order. Nothing here is optional — each step prevents a specific category of build-phase pain.

**When to use:** After the final PRD is uploaded to project knowledge and before you open VS Code for the first build session.

---

## Step 1: PRD Consistency Audit (Opus + 1M Context)

Open VS Code with Claude Code. Select `/model opus` with the 1M context option.

**Load all PRD files + supporting docs into one session and run the audit.**

The audit prompt should instruct Opus to check for:
- [ ] Database column name conflicts across PRDs (same column, different types or meanings)
- [ ] RLS policy pattern consistency (does every feature follow PRD-02's PermissionGate convention?)
- [ ] Stub registry completeness (every stub created has a wiring target; every wiring target has a stub)
- [ ] Circular dependencies between PRDs
- [ ] Shell behavior table completeness (all 5 shells addressed in every feature PRD, no blanks)
- [ ] Feature key registration completeness (every `useCanAccess()` key registered in PRD-02's format)
- [ ] Tier gating consistency (no feature accidentally gated differently in two places)
- [ ] Audit readiness tag coverage (`> **Decision rationale:**`, `> **Deferred:**`, `> **Depends on:**`, `> **Forward note:**` present where needed)
- [ ] Cross-PRD Impact Addendum completeness (every addendum's "Action Needed" items actually applied)
- [ ] Naming convention compliance (compound OneWord feature names, snake_case tables, no nautical terms)
- [ ] **Embedding column completeness** — every table listed in the Semantic Context Infrastructure Addendum (`archive_context_items`, `best_intentions`, `self_knowledge`, `guiding_stars`, `journal_entries`) has `embedding halfvec(1536)` in its schema definition
- [ ] **AI optimization pattern references** — every PRD with an AI Integration section references the applicable patterns from the AI Cost Optimization Patterns doc (P1-P9). If a PRD specifies a Haiku auto-tagging call, it should note "replaced by P2 embedding-based classification"
- [ ] **Platform Intelligence channel references** — every feature PRD notes which capture channels (A-L) it wires during build, per the Platform Intelligence Pipeline v2
- [ ] **Trigger column specificity** — embedding triggers fire on content column changes only (not metadata like is_included_in_ai, usage_count, sort_order)

**Edit PRD files directly in VS Code as you address each finding.** Don't just list issues — fix them in the source files so the PRDs are clean before any code touches them.

---

## Step 2: Install Developer Tools (AURI + mgrep)

> **Install is step 1 of 2. Verify-firing is step 2.** A tool that's "registered" is not a tool that's "actually firing." Both AURI and mgrep have known silent-failure modes — a tool can appear connected or authenticated and still no-op on every call. The April 2026 tool health sweep (see `TOOL_HEALTH_REPORT_2026-04-16.md`) discovered AURI had been silently disconnected and mgrep had been silently running against a 3-week-stale index. Neither produced error messages. Every verification step below is there to catch a specific failure mode that has actually occurred.

### AURI Security Scanner

**What it is:** Free MCP-based security scanner by Endor Labs. Runs locally in VS Code alongside Claude Code. Scans AI-generated code in real time for vulnerabilities. Your code never leaves your machine.

**Why now:** PRD-01 (Auth) and PRD-02 (Permissions) are your highest-security-risk features. Having AURI active from the first line of auth code means you never accumulate unscanned security debt.

**Install:**
- [ ] Install AURI MCP server (no signup, no credit card)
- [ ] Add to Claude Code MCP config using the FULL binary path, not `npx -y endorctl`. Windows example:
  ```
  claude mcp add endor-cli-tools "C:/Users/<user>/AppData/Roaming/npm/bin/endorctl.exe" -- ai-tools mcp-server
  ```
  **Why the full path:** endorctl uses a `go-npm` postinstall script that downloads the Go binary AFTER npm's shim-generation step finishes. On Windows, no `endorctl.cmd` shim gets created at `<npm-prefix>/endorctl.cmd`. The binary exists at `<npm-prefix>/bin/endorctl.exe` but isn't on PATH under that name. `npx -y endorctl` silently fails to resolve. Using the full path bypasses the broken shim.

**Verify firing (not just registered):**
- [ ] `claude mcp list` → `endor-cli-tools: ... ✓ Connected` (NOT `✗ Failed to connect`)
- [ ] Run a test scan on a small test file (once Endor Labs account is configured): `endorctl scan <file>` should produce structured findings output
- [ ] Note: "Connected" only confirms the MCP process started. A test scan is the only way to verify the full path works end-to-end. Until an Endor Labs account is set up, scans remain untested — track as a followup, and document the gap.
- [ ] If disconnected later: reconnection procedure is in `~/.claude/projects/<slug>/memory/reference_auri_security.md`

### mgrep Semantic Search

**What it is:** CLI semantic search tool by Mixedbread AI. Understands meaning, not just exact strings. When Claude Code needs to find something in your codebase, mgrep returns the most relevant code/doc chunks by meaning — even if the exact words don't match.

**Why now:** Your repo will have 20+ PRD files, 8 living docs, and growing source code. When Claude Code needs to check "how does the permission gate pattern work for special adults?" during a build session, mgrep finds the answer in one query instead of Claude cycling through 5-10 grep attempts burning tokens and time.

**How it helps during audit:** When Opus is auditing PRDs for consistency, mgrep lets it search semantically — "where is studio_queue referenced as task_queue?" finds mismatched naming across files even when the exact string doesn't appear.

**How it helps during build:** Claude Code uses mgrep automatically (after `mgrep install-claude-code`) to find relevant code patterns, check existing implementations, and locate stubs that need wiring — all by meaning, not just text matching.

**Install:**
- [ ] Install: `npm install -g @mixedbread-ai/mgrep`
- [ ] Login: `mgrep login` (authenticates via browser — GitHub, Google, or email). Must be run in a real interactive terminal; piping stdin breaks the device-code flow.
- [ ] Wire into Claude Code: `mgrep install-claude-code` (Claude automatically uses mgrep for searches)

**Known operational limits (critical — document these in your project's memory):**
- [ ] Default `--max-file-count` is **1000**. Repos above that silently fail with `File count exceeded`. Pass `--max-file-count 3000` (or your repo's count with headroom) OR set `MGREP_MAX_FILE_COUNT=3000` as a persistent environment variable.
- [ ] **Recommended:** Set the env var globally so the flagless `mgrep watch` invoked by the Claude Code plugin hook picks it up automatically:
  ```powershell
  setx MGREP_MAX_FILE_COUNT 3000
  ```
  (Without this, every Claude Code session start re-launches the plugin hook, which runs `mgrep watch` with no flags, which hits the 1000-file limit, which writes to a log nobody reads, which the hook reports as success. Silent failure, guaranteed.)
- [ ] **Free tier quota is 2M "store tokens"** total. MyAIM's repo has ~5-6M tokens of indexable content — the free tier will be exhausted during initial sync. Upgrade to Scale tier ($20/month + credits) if semantic search is part of the workflow.
- [ ] A large repo on free tier will silently ingest up to 2M tokens then stop. Queries return results, but from a partial index. Exact same failure mode as a stale index.

**Index the project (preferred — VS Code workspace task):**
- [ ] Add `.vscode/tasks.json` to the repo with a `mgrep watch --max-file-count 3000` task set to `runOn: folderOpen`. See MyAIMCentral's `.vscode/tasks.json` for the canonical version. This auto-starts `mgrep watch` every time the project is opened in VS Code.
- [ ] In VS Code, run "Tasks: Manage Automatic Tasks" → "Allow Automatic Tasks" from the command palette (Ctrl+Shift+P). This is a one-time security prompt — without it, auto-run tasks are disabled by default.
- [ ] Do NOT rely on the Mixedbread-Grep Claude Code plugin's `mgrep_watch.py` hook to index automatically. As of April 2026, the hook has four independent Windows-incompatibility bugs (uses `python3` which isn't installed on Windows, writes to `/tmp/` which doesn't exist on Windows, uses Unix-only `preexec_fn=os.setsid`, doesn't use `shell=True` so can't resolve `.cmd` shims). On Windows, the hook has never executed a single line of its own Python code. A VS Code task is cross-platform, visible in the UI, and survives plugin updates.

**Alternative — manual terminal:** If not in VS Code, run `mgrep watch` manually in a long-lived terminal. Set `MGREP_MAX_FILE_COUNT=3000` in your environment so you don't need to remember the `--max-file-count` flag. Keep the terminal open while actively developing.

**Verify firing (not just authenticated):**
- [ ] `mgrep whoami` → returns your authenticated user, NOT `Failed to refresh token`. If token expired, re-login.
- [ ] Run a real semantic search: `mgrep "how does the permission gate pattern work"` → returns ranked results including PRD sections AND source files. If only PRDs come back, the source is missing from the index (file-count limit, quota, or stale index).
- [ ] **Freshness probe:** After any major feature lands, search for a known-new file (e.g., a component added yesterday). If it appears in results, the index is current. If not, re-run `mgrep watch` to sync OR troubleshoot why that file didn't get indexed.
- [ ] Watch the Mixedbread dashboard (https://platform.mixedbread.com) periodically for "store tokens" approaching the tier limit. Run `mgrep watch --dry-run` to see what WOULD be synced without using credits.
- [ ] If mgrep "works" but returns unexpectedly sparse results for recent code, treat it as stale, not broken. Stale indexes return confident-looking results from an older codebase snapshot — worse than a visible error because they mislead silently.

> **How mgrep and Supabase CLI work together during build:**
> - **mgrep** searches your local repo files by meaning — PRDs, source code, migration SQL, docs, CLAUDE.md. Use it when Claude Code needs to check a convention, find a pattern, verify a schema definition, or locate a stub.
> - **Supabase CLI** connects to your actual cloud database — runs migrations, deploys Edge Functions, tests RLS queries, checks live data. Uses project URL + service role key from `.env`.
> - Both are available to Claude Code in every session. mgrep replaces "load the entire file into context" with "search and get just the relevant chunk." This keeps the context window lean.

> **Impact on build prompt "Read These First" lists:**
> With mgrep active, limit "Read These First" to CLAUDE.md + the current PRD + any files being directly modified this session. For reference lookups (schema checks, convention verification, cross-PRD questions, existing utility searches), Claude Code should search via mgrep rather than pre-loading entire reference documents. This keeps 60-70% of the context window available for actual code generation instead of reference material.

---

## Step 3: Create Infrastructure

- [ ] GitHub repo: `github.com/littlelanterns/MyAIM_Family` — public, initialize with README
- [ ] Supabase project: `myaim-family-v2` — region: us-west-1 or us-central-1
- [ ] Vercel project: Connect to GitHub repo, framework preset: Vite
- [ ] Note the Supabase project ref ID and service role key — you'll need them in Step 4

---

## Step 4: Scaffold Project (Claude Code — Sonnet)

Using Claude Code with Sonnet (standard context — save Opus for planning):
- [ ] Vite + React 19 + TypeScript setup
- [ ] Complete folder structure
- [ ] `.env.example` with required variables (including `OPENAI_API_KEY` for embeddings)
- [ ] ThemeProvider and CSS variable system
- [ ] `npm run dev` shows blank page with theme applied
- [ ] Git initialized, first commit pushed

### Connect CLI Tools to Project

All three tools connect during scaffolding so Claude Code can use them from the first build session. No manual SQL copy-pasting — everything runs through Claude Code in VS Code.

- [ ] Supabase CLI: `supabase init` + `supabase link --project-ref <project-id>` — connects local repo to cloud Supabase project. All migrations run via `supabase db push`. Claude Code writes migration files to `supabase/migrations/` and applies them through the CLI.
- [ ] AURI: Add MCP server config to Claude Code using FULL binary path (see Step 2) — `claude mcp list` must show `✓ Connected`
- [ ] mgrep: `mgrep watch --max-file-count 3000` in a long-lived terminal + `mgrep install-claude-code` — indexes repo and wires into Claude Code searches

**Verify all three (end-to-end, not just "installed"):**
- [ ] **Supabase cloud auth:** `supabase projects list` → must show your project as linked (dot marker). **Do NOT use `supabase status`** — that requires Docker Desktop for local dev mode, which isn't relevant for cloud-only workflows. The April 2026 sweep failed this check for the wrong reason because Docker wasn't running; `supabase projects list` was the correct test for this project.
- [ ] **AURI:** `claude mcp list` → `endor-cli-tools: ✓ Connected`. If account credentials are configured, also run a test scan on a known file and confirm output.
- [ ] **mgrep:** `mgrep whoami` returns authenticated user + `mgrep "your test query"` returns ranked results including BOTH source files and PRD sections. If only one type appears, index is incomplete.

### Semantic Search & Platform Intelligence Infrastructure

Wire this during scaffolding so it's ready before any feature tables are created. See Semantic Context Infrastructure Addendum and Platform Intelligence Pipeline v2 for full specs.

- [ ] Enable Postgres extensions in initial migration: `pgvector`, `pgmq`, `pg_net`, `pg_cron`
- [ ] Create `embedding_util` schema with generic `queue_embedding_job()` trigger function
- [ ] Create pgmq queue: `SELECT pgmq.create('embedding_jobs');`
- [ ] Create pg_cron job to process embedding queue every 10 seconds
- [ ] Deploy `embed` Edge Function (generic — processes all tables via TABLE_CONFIG map)
- [ ] Store OpenAI API key in Supabase Vault as `openai_api_key`
- [ ] Create `platform_intelligence` schema
- [ ] Create all Platform Intelligence promoted tables (prompt_patterns, context_effectiveness, edge_case_registry, board_personas, book_cache, book_extraction_cache, synthesized_principles, framework_ethics_log, meeting_section_patterns, declaration_patterns, routine_patterns, widget_configurations, question_effectiveness)
- [ ] Create `platform_intelligence.review_queue` table
- [ ] Deploy anonymization Edge Function
- [ ] Seed `life_area_reference_embeddings` table with pre-computed reference vectors for auto-tagging (Pattern P2)
- [ ] Verify: insert a test record into any table with an embedding trigger → check that embedding is generated within 30 seconds

---

## Step 5: Place Documentation in Repo

Copy into the repo's `docs/` folder:
- [ ] All PRD files (the audited, clean versions from Step 1)
- [ ] DATABASE_SCHEMA.md (generated from PRDs during audit)
- [ ] BUILD_STATUS.md (initialized, no phases complete yet)
- [ ] STUB_REGISTRY.md (initialized from PRD stub tables)
- [ ] Semantic-Context-Infrastructure-Addendum.md (embedding pipeline spec)
- [ ] AI-Cost-Optimization-Patterns.md (optimization patterns reference)
- [ ] Platform-Intelligence-Pipeline-v2.md (self-improving architecture spec)

Initialize these tracking logs in the repo root:
- [ ] FIXME-LOG.md (cross-scope issues — see Step 8)
- [ ] PATTERN-DECISIONS.md (architectural decisions made during build — see Step 9)
- [ ] RLS-VERIFICATION.md (per-table, per-role access verification — see Step 10)
- [ ] AI-COST-TRACKER.md (edge function AI costs — see Step 11)
- [ ] tasks/lessons.md (Claude Code self-correction log — see Workflow Discipline section)

---

## Step 6: Configure CLAUDE.md with Build Rules

This is the master instruction file that Claude Code reads at the start of every session. It must include:

**Important:** Every PRD has a "CLAUDE.md Additions from This PRD" section at the bottom. During Step 6, pull ALL of those additions into the real CLAUDE.md, organized by topic. PRD-03 (Design System) is especially critical — it contains detailed vibe, theme, shell, gradient, dark mode, and component rules that Claude Code must follow from the first build session. Don't just include the high-level conventions below — compose the full CLAUDE.md from all PRD additions.

### Standard Conventions
- [ ] TypeScript must compile without errors
- [ ] All CSS uses `var(--color-*)` variables — no hardcoded colors
- [ ] Mobile-first — test on mobile viewport before desktop
- [ ] No Unicode emoji in adult interfaces — Lucide icons only
- [ ] Merciful defaults — no guilt language, no aggressive nudging
- [ ] Human-in-the-Mix — every AI output has Edit/Approve/Regenerate/Reject
- [ ] All shared components imported from `src/core/components/`

### Common Commands Reference
- [ ] Include a quick-reference of project CLI commands in CLAUDE.md so Claude Code never guesses:
  - `npm run dev` — start dev server
  - `npm run build` — production build
  - `npm run lint` — ESLint check
  - `supabase db push` — apply migrations to cloud
  - `supabase functions deploy <name>` — deploy Edge Function
  - `supabase db reset` — reset local DB (caution)
  - `mgrep "query"` — semantic search across repo
  - Update this list as new scripts are added during build

### Semantic Search & Embedding Conventions (from Semantic Context Infrastructure Addendum)
- [ ] pgvector enabled. All embedding columns use `halfvec(1536)` with HNSW indexes using `halfvec_cosine_ops`
- [ ] Embedding generation is async via pgmq queue → `embed` Edge Function → OpenAI `text-embedding-3-small`. Never synchronous on write.
- [ ] New tables with searchable text content: add `embedding halfvec(1536)` column + trigger calling `embedding_util.queue_embedding_job()`. Add table config to the `embed` Edge Function's TABLE_CONFIG.
- [ ] Triggers fire on content column changes only — not on toggles, counts, or metadata columns
- [ ] Embedding columns are always nullable (NULL until processed). Queries must handle NULL gracefully.
- [ ] `match_family_context()` is the shared similarity search function. Always filter by `family_id`, `is_included_in_ai`, `archived_at IS NULL`.

### AI Cost Optimization Conventions (from AI Cost Optimization Patterns)
- [ ] Life area auto-tagging uses embedding comparison against `life_area_reference_embeddings`, NOT Haiku calls (Pattern P2)
- [ ] Context learning detection uses embedding delta: compare message embedding against Archives, only trigger Haiku scan when max similarity < threshold (Pattern P3)
- [ ] On-demand secondary output: AI generates primary deliverable only. Explainers/extras on-demand via action chips (Pattern P5)
- [ ] Per-turn semantic context refresh for multi-turn guided conversations — don't carry stale startup context (Pattern P9)
- [ ] Never generate content the user didn't ask for

### Platform Intelligence Conventions (from Platform Intelligence Pipeline v2)
- [ ] Platform intelligence lives in `platform_intelligence` schema. NEVER write family-identifiable data to this schema.
- [ ] All captured data passes through the anonymization Edge Function before entering the review queue. Never bypass anonymization.
- [ ] Nothing becomes platform intelligence without admin approval (Human-in-the-Mix).
- [ ] When building a feature, check which capture channels (A-L) it should wire and include the capture triggers.
- [ ] Book framework ethics filter: Haiku pre-screen → Sonnet principle scan → admin review. Auto-reject coercion, force, manipulation, shame-based frameworks.
- [ ] Synthesized principles: LiLa never cites a single source. Apply universal principles naturally. Offer multiple convergent sources as "further reading" only if asked.

### Workflow Discipline (Claude Code Behavioral Rules)

**Add this as a named section in CLAUDE.md:**

```markdown
## Workflow Discipline

### Plan Before Implementing
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways mid-implementation, STOP and re-plan immediately — don't keep pushing forward hoping it works out
- Use plan mode for verification steps, not just building
- Write a brief implementation plan as a comment before starting complex work

### No Deferred Quality — Do It Right the First Time
- NEVER suggest "for now we can just..." or "we can improve this later" or "as a temporary solution..." unless explicitly asked for a quick prototype
- If the correct implementation is known, implement it correctly now. Do not create tech debt by choosing an easier path with a promise to fix it later — that "later" rarely comes.
- If the correct implementation is unclear, STOP and ask — don't guess with a shortcut
- If a task feels too large to do correctly in one session, say so. We will split it into sub-phases. A properly scoped smaller task done right is always better than a full task done with shortcuts.
- The only acceptable "temporary" code is an explicitly documented stub (tracked in STUB_REGISTRY.md with a wiring target and future phase). Stubs are intentional architectural placeholders, not lazy shortcuts.
- Ask yourself before every implementation choice: "Am I doing this because it's the right approach, or because it's the faster approach?" If the answer is faster, stop and do it right.

### Subagent Strategy
- Use subagents to keep the main context window clean
- Offload research, file exploration, and parallel analysis to subagents
- One task per subagent for focused execution
- For complex problems, throw more compute at it via subagents rather than degrading the main thread

### Self-Review Before Presenting
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: step back and implement the proper solution
- Skip self-review for simple, obvious, one-line fixes — don't over-engineer
- Ask yourself: "Would a staff engineer approve this?"

### Edge Case Awareness
- For any non-trivial logic, proactively consider edge cases before writing the implementation:
  - Empty, null, or undefined inputs
  - Arrays with 0 or 1 items
  - Max/min values, extremely long strings, special characters
  - Invalid states (end date before start date, negative quantities, duplicate entries)
  - Permission edge cases (what if a family member's role changes mid-session?)
  - Concurrent access (two family members editing the same record)
- Handle edge cases in code with clear guards, not with hope
- If an edge case is identified but handling it is out of scope, add a comment and a FIXME-LOG entry — don't silently ignore it

### Autonomous Bug Fixing
- When given a bug report: investigate independently. Check logs, trace errors, identify root cause.
- Don't ask the user to diagnose — that's your job
- Fix the root cause, not the symptom
- Zero context switching required from the user

### Context Check Before Creating
- Before creating any new utility function, hook, component, or helper: search the codebase first (use mgrep if available) to check if a similar one already exists
- Before creating a new table or column: check DATABASE_SCHEMA.md and existing migrations
- Before establishing a new pattern: check CLAUDE.md and PATTERN-DECISIONS.md for existing conventions
- If you find something similar but not quite right, extend or adapt it rather than creating a parallel version
- The goal is one way to do each thing, not multiple competing approaches

### Lessons Learned Tracking
- After ANY correction from the user: append to `tasks/lessons.md` with the pattern and the rule to prevent it
- Format: `| Date | Mistake | Root Cause | Rule to Prevent | Phase |`
- Review lessons at the start of each session for patterns relevant to the current work
- If the same type of mistake appears twice, escalate the rule to a CLAUDE.md convention

### Session Handoff Quality
- At the end of every build session, before the final git push, verify: CLAUDE.md is updated, BUILD_STATUS.md reflects what was completed, STUB_REGISTRY.md has all new stubs and any newly wired stubs marked, and DATABASE_SCHEMA.md includes any new tables/columns
- These four files ARE the handoff to the next session. If they're stale, the next session starts with wrong assumptions.
- When starting a new session: read CLAUDE.md fully, check STUB_REGISTRY.md for stubs this phase should wire, and check BUILD_STATUS.md for the current state before implementing anything
```

### FIXME-LOG Rule (Cross-Scope Issue Handling)

**Add this as a named section in CLAUDE.md:**

```markdown
## Cross-Scope Issue Handling — FIXME-LOG Rule

When you encounter an issue in a file OUTSIDE the current session's scope:

1. **Does it block the current task?** → Fix it now. Note the fix in your session summary.
2. **Does it NOT block the current task?** → Do NOT fix it. Instead, append a single entry to `FIXME-LOG.md`:

| Date | File | Issue | Related PRD | Severity | Found During |
|------|------|-------|-------------|----------|--------------|
| YYYY-MM-DD | path/to/file.ts | Brief description of what's wrong | PRD-## | low/medium/high | Phase X session |

**Rules:**
- Never fix cross-scope issues in the middle of a build session unless they directly block your current work
- "Severity" means: high = will break other features, medium = incorrect behavior but not breaking, low = cosmetic or convention violation
- Every 3-5 build sessions, a dedicated "cleanup sprint" session will process this log
- During cleanup sprints, batch related fixes together and check for ripple effects
- After fixing an item, mark it with ✅ and the date resolved — don't delete entries

**Why this rule exists:** Fixing unrelated issues mid-session splits your context, increases bug risk in both the original task and the fix, and burns context tokens on work outside the session's scope. Logging is fast; fixing is better done in a focused pass.
```

### Auto-Update Convention
- [ ] After every git push, Claude Code updates BUILD_STATUS.md, CLAUDE.md (new conventions), and STUB_REGISTRY.md

### PATTERN-DECISIONS Rule (Architectural Decisions During Build)

**Add this as a named section in CLAUDE.md:**

```markdown
## Architectural Decision Logging — PATTERN-DECISIONS Rule

When you make a non-obvious architectural decision during a build session — a component structure choice, a hook pattern, a race condition handling approach, or anything not explicitly specified in the PRD — append a single entry to `PATTERN-DECISIONS.md`:

| Date | Phase | Decision | Why | Affects |
|------|-------|----------|-----|---------|
| YYYY-MM-DD | Phase X | Brief description of the decision | Why this approach was chosen over alternatives | Which features or areas this impacts |

**What counts as a "non-obvious decision":**
- Choosing between two valid implementation approaches
- Establishing a pattern that future phases should follow
- Working around a limitation in a library or platform
- Deciding how to handle an edge case the PRD didn't address
- Creating a reusable utility or helper that other features will use

**What does NOT need logging:**
- Following an existing convention from CLAUDE.md
- Implementing something exactly as the PRD specifies
- Standard TypeScript/React patterns

**Promotion:** During the 4D doc sync step, review new entries. If a decision establishes a pattern that all future phases should follow, promote it to a CLAUDE.md convention.
```

### RLS-VERIFICATION Rule (Data Access Verification)

**Add this as a named section in CLAUDE.md:**

```markdown
## RLS Verification Logging — RLS-VERIFICATION Rule

After completing any build phase that creates or modifies a database table, run the RLS sanity-check tests and log results in `RLS-VERIFICATION.md`.

For each table, verify and record access for ALL five roles:

| Table | Mom | Dad | Special Adult | Independent | Guided/Play | Verified Date | Phase |
|-------|-----|-----|---------------|-------------|-------------|---------------|-------|
| table_name | full / own / per-permission / none | ... | ... | ... | ... | YYYY-MM-DD | Phase X |

**Access level shorthand:**
- `full` = read/write all rows in family scope
- `own` = read/write only rows where family_member_id = self
- `per-permission` = access determined by PRD-02 permission settings (specify which permission key)
- `assigned` = Special Adults see only assigned children's data during active shifts
- `none` = no access to this table
- `read-only` = can read but not write

**Rules:**
- Never skip a role. If a role has no access, explicitly write `none`.
- If a table has RLS disabled (public within family), note it and explain why.
- Run actual queries as each role to verify — don't just trust the policy definition.
- Flag any table where the verification result doesn't match the PRD spec.
```

### AI-COST-TRACKER Rule (Edge Function Cost Logging)

**Add this as a named section in CLAUDE.md:**

```markdown
## AI Cost Logging — AI-COST-TRACKER Rule

After completing any build phase that creates or modifies a Supabase Edge Function making an AI API call (Anthropic, OpenAI, or other), log it in `AI-COST-TRACKER.md`.

| Edge Function | Purpose | Model | Est. Input Tokens | Est. Output Tokens | Est. Cost/Call | Frequency | Phase Built |
|---------------|---------|-------|-------------------|-------------------|---------------|-----------|-------------|
| function-name | What it does | sonnet/haiku/etc | ~N,NNN | ~N,NNN | ~$0.NNN | 1x/user/day, on-demand, etc. | Phase X |

**Rules:**
- Estimates don't need to be precise — ballpark from the prompt size and expected response length
- "Frequency" means: how often will a typical user trigger this? (1x/day, on-demand, 1x/week, etc.)
- Update the estimate if you significantly change the prompt or context window during a later phase
- This log is used for tier pricing decisions before beta launch
```

---

## Step 7: Create QA-SHELLS.md

- [ ] Per-shell verification checklist covering all 5 shells
- [ ] Structural checks (routing, navigation zones, permission gates, LiLa access, theme rendering)
- [ ] Feature-specific checks added as each build phase ships
- [ ] Designed to be runnable as an Agent Teams QA pass at milestone builds

*(This document may already exist in project knowledge if drafted during PRD phase.)*

---

## Step 8: Create FIXME-LOG.md

Initialize the log file with the table header and no entries:

```markdown
# FIXME-LOG: Cross-Scope Issues Found During Build

| Date | File | Issue | Related PRD | Severity | Found During | Resolved |
|------|------|-------|-------------|----------|--------------|----------|
```

---

## Step 9: Create PATTERN-DECISIONS.md

Initialize the architectural decisions log:

```markdown
# PATTERN-DECISIONS: Architectural Decisions Made During Build

Decisions logged here were made during build sessions when the PRD didn't specify an implementation approach. Review during 4D doc sync — promote recurring patterns to CLAUDE.md conventions.

| Date | Phase | Decision | Why | Affects |
|------|-------|----------|-----|---------|
```

---

## Step 10: Create RLS-VERIFICATION.md

Initialize the data access verification matrix:

```markdown
# RLS-VERIFICATION: Per-Table, Per-Role Access Verification

Every table with Row-Level Security must be verified against all 5 roles after the build phase that creates it. This is the audit trail for data privacy and COPPA compliance.

**Access level shorthand:** `full` = all rows in family | `own` = own rows only | `per-permission` = PRD-02 permission key | `assigned` = Special Adult shift-scoped | `none` = no access | `read-only` = read but not write

| Table | Mom | Dad | Special Adult | Independent | Guided/Play | Verified Date | Phase |
|-------|-----|-----|---------------|-------------|-------------|---------------|-------|
```

---

## Step 11: Create AI-COST-TRACKER.md

Initialize the edge function cost log:

```markdown
# AI-COST-TRACKER: Edge Function AI Costs

Every Supabase Edge Function that makes an AI API call is logged here with estimated token costs and invocation frequency. Used for tier pricing decisions before beta launch.

| Edge Function | Purpose | Model | Est. Input Tokens | Est. Output Tokens | Est. Cost/Call | Frequency | Phase Built |
|---------------|---------|-------|-------------------|-------------------|---------------|-----------|-------------|
```

---

## Step 12: Final Verification

Before starting your first build phase prompt:
- [ ] All PRD files are in `docs/` and match what's in project knowledge
- [ ] Semantic Context, AI Cost Optimization, and Platform Intelligence docs are in `docs/`
- [ ] CLAUDE.md has all conventions including FIXME-LOG, PATTERN-DECISIONS, RLS-VERIFICATION, AI-COST-TRACKER, Semantic Search, AI Optimization, and Platform Intelligence rules
- [ ] AURI is installed and active
- [ ] mgrep is installed, project indexed, Claude Code integration active
- [ ] pgvector, pgmq, pg_net, pg_cron extensions enabled in Supabase
- [ ] `embed` Edge Function deployed and processing queue
- [ ] `platform_intelligence` schema created with all tables
- [ ] Anonymization Edge Function deployed
- [ ] `life_area_reference_embeddings` table seeded
- [ ] Embedding pipeline verified (test insert → embedding appears within 30 seconds)
- [ ] FIXME-LOG.md exists and is empty
- [ ] PATTERN-DECISIONS.md exists and is empty
- [ ] RLS-VERIFICATION.md exists and is empty
- [ ] AI-COST-TRACKER.md exists and is empty (with `embed` Edge Function pre-logged as first entry)
- [ ] QA-SHELLS.md exists with structural checks
- [ ] BUILD_STATUS.md exists with all phases listed as pending
- [ ] STUB_REGISTRY.md is initialized from PRD stub tables
- [ ] DATABASE_SCHEMA.md is generated and placed
- [ ] `npm run dev` works and shows themed blank page
- [ ] First build prompt is drafted (using Build_Prompt_Template.md structure)

---

## Ready to Build

Start with Phase 1 (PRD-01: Auth & Family Setup). Follow the 4-step cycle:
1. **4A:** Plan & prepare build prompt (Opus in claude.ai)
2. **4B:** Build in Claude Code (Sonnet, paste build prompt)
3. **4C:** Test & fix (you test in browser, report findings)
4. **4D:** Update docs & sync

**Recurring maintenance cadence:**
- **Every git push:** CLAUDE.md, BUILD_STATUS.md, STUB_REGISTRY.md auto-updated
- **Every build phase that touches DB tables:** RLS-VERIFICATION.md updated
- **Every build phase that creates/modifies AI edge functions:** AI-COST-TRACKER.md updated
- **During build sessions (as they arise):** FIXME-LOG.md, PATTERN-DECISIONS.md, and tasks/lessons.md entries appended
- **Every 3-5 build sessions:** FIXME-LOG cleanup sprint
- **During 4D doc sync:** Review PATTERN-DECISIONS.md and tasks/lessons.md — promote recurring patterns and repeated mistakes to CLAUDE.md conventions
- **At milestone builds (every 5-8 phases):** Run QA-SHELLS.md verification across all 5 shells
- **After the first 5 build phases:** Review PATTERN-DECISIONS.md and tasks/lessons.md for recurring patterns that should become Claude Code skills in `/mnt/skills/user/`. Examples: a "new-guided-mode" skill that scaffolds LiLa guided mode registration, a "new-edge-function" skill that follows the established proxy pattern, a "new-pipeline-channel" skill that scaffolds Platform Intelligence capture triggers with anonymization. Each skill is a SKILL.md file that encodes a proven build pattern so Claude Code applies it automatically without re-reading PRDs. Continue reviewing for new skill candidates at every subsequent milestone.
- **After the first 5 build phases:** Install CodeGraph (`npx @colbymchenry/codegraph`) — an MCP-based code knowledge graph that indexes functions, classes, imports, and call relationships into a local SQLite database. Claude Code queries it instead of scanning files, reducing exploration tokens by ~30% and tool calls by ~25%. Especially valuable for MyAIM's deep cross-feature dependencies — impact analysis shows the blast radius of any change before Claude Code touches it. Setup: run the installer, `codegraph init -i` in the project root, restart Claude Code. It auto-syncs when Claude Code edits files via hooks. Not needed during early phases when the codebase is small.

---

## Full Document Inventory (12 living docs during build)

| Document | What It Tracks | Update Trigger |
|----------|---------------|----------------|
| CLAUDE.md | Conventions, patterns, build rules | Every git push |
| BUILD_STATUS.md | Phase completion + timestamps | After each phase |
| STUB_REGISTRY.md | Stubs created and wired | After each phase |
| DATABASE_SCHEMA.md | Tables, columns, types, relationships | After schema-changing phases |
| FIXME-LOG.md | Cross-scope issues found during build | During sessions (log) + every 3-5 sessions (cleanup) |
| PATTERN-DECISIONS.md | Architectural calls made during build | During sessions as decisions arise |
| RLS-VERIFICATION.md | Per-table, per-role access verification | After phases that touch DB tables |
| AI-COST-TRACKER.md | Edge function AI costs, frequency, and template hit rate | After phases that create/modify AI edge functions |
| tasks/lessons.md | Claude Code mistakes and self-correction rules | After any user correction during a session |
| Semantic-Context-Infrastructure-Addendum.md | Embedding pipeline spec (reference, not frequently updated) | If embedding model or infrastructure changes |
| AI-Cost-Optimization-Patterns.md | Optimization patterns per feature (reference) | If new patterns discovered or costs change significantly |
| Platform-Intelligence-Pipeline-v2.md | Self-improving architecture spec (reference) | If new capture channels identified |

---

*Created: March 12, 2026*
*Updated: March 15, 2026 — Added mgrep, pgvector infrastructure, platform intelligence schema, embedding conventions, AI optimization conventions, and Platform Intelligence conventions. Updated doc inventory from 8 to 11.*
*Updated: April 16, 2026 — Split Step 2 into explicit Install + Verify-Firing sections for AURI and mgrep. Documented known silent-failure modes: endorctl go-npm shim gotcha (use full binary path, not `npx -y`), mgrep 1000-file limit (pass `--max-file-count` or set `MGREP_MAX_FILE_COUNT` env var), mgrep 2M-token free-tier quota (MyAIM repo exceeds it, Scale tier required), plugin-hook silent failure. Corrected Step 4 supabase verification from `supabase status` (requires Docker, wrong for cloud-only) to `supabase projects list`. Reference: TOOL_HEALTH_REPORT_2026-04-16.md.*
*Updated: April 16, 2026 (later same day) — Replaced the mgrep plugin hook recommendation with a VS Code workspace task at `.vscode/tasks.json` after discovering the Mixedbread-Grep Claude Code plugin hook has 4 independent Windows-incompatibility bugs and has never run a single line of its Python code on Tenise's machine. The hook is fundamentally broken on Windows; VS Code task is the cross-platform, visible, survives-plugin-updates replacement. Also noted `.vscode/mcp.json` as a workspace-level VS Code MCP config location that must be checked during tool health sweeps.*
*Reference: Execution Plan v2, Build Prompt Template, Planning Decisions, Semantic Context Infrastructure Addendum, AI Cost Optimization Patterns, Platform Intelligence Pipeline v2, TOOL_HEALTH_REPORT_2026-04-16.md*
