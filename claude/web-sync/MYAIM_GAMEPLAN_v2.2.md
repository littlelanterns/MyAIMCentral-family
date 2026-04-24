# MyAIM Family — Master Gameplan v2.2

> **Status:** DRAFT for founder review
> **Created:** April 16, 2026
> **Version:** v2.2 (adds Phase 0.25 Reconnaissance, Phase 0.35 COPPA PRD Session, Scope 8 Compliance & Safety in audit, "tests pass but doesn't serve need" check, Beta Readiness Gate, today's tool-health sweep context)
> **Owner:** Tenise (founder)
> **Purpose:** Master orientation document for the next phase of MyAIM Family development — covering wizard sprint close-out, architectural audit, wizard build continuation, Playwright video library, LiLa knowledge batch, and accelerated PRD rollout.

## Tool Availability Note

**Opus 4.7 is live in Claude Code as of April 16, 2026.** Verified working in VS Code extension. 4.7-specific features (`/ultrareview`, `xhigh` effort, auto mode, task budgets) are available and should be used per the guidance in Phase 5 and Section 3.5.

## Pre-Gameplan Context (April 16, 2026 — What Was Done Before Phase 0)

A tool health sweep surfaced and fixed significant silent-failure issues across the development environment. Documented in `TOOL_HEALTH_REPORT_2026-04-16.md`. Key outcomes:

- AURI security scanner fixed (was disconnected during PRD-01 + PRD-02 builds — retroactive scan needed in Phase 2 audit)
- mgrep upgraded to Scale tier, index refreshed, Windows-compatible auto-refresh via VS Code task
- codegraph re-indexed fresh (was stale since March 28)
- Step 0 hard-gate added to /prebuild skill with end-to-end probes (not just connection checks)
- "Looks Fine" failure pattern documented in LESSONS_LEARNED.md
- CLAUDE.md Convention #241 added (Tooling Hygiene)

**Tenise's wizard work (Universal List Wizard) committed at 21a47a1 but not yet founder-verified as serving intended use case.** "Tests pass" ≠ "serves need" — this is the canonical example of the new architectural audit check in Phase 2.

**17 open followups tracked in TOOL_HEALTH_REPORT** — F1 (Endor account for AURI scans), F10-F17 (various). These feed into Phase 0.25 Reconnaissance scope.

---

## How to Use This Document

**This is the master orientation doc.** Every future Claude Code session should begin by reading this file. It supersedes any prior planning notes where they conflict.

**When starting a new Claude Code session, paste this instruction:**

> "Read `MYAIM_GAMEPLAN_v2.2.md` at repo root. This is the master gameplan for the current phase of work. Tell me which phase we're in, what's next on the checklist, and confirm you understand the gate structure before we start."

**When you want to start a specific phase, paste the relevant section.** Each phase in this doc is self-contained enough to serve as a session prompt on its own.

**When the plan changes**, update this doc and increment the version suffix (`v2.1` → `v2.2` for additions, `v3` for major restructure). Decisions made during execution supersede the plan itself — this doc records intent, not contract.

---

## Section 1: Orientation

### Current State Snapshot (as of April 16, 2026)

**Built and signed off:**
- 24+ PRDs fully complete (PRD-01 through PRD-36, excluding gaps)
- Build M (Gamification): verification complete, awaiting sign-off
- PRD-16 (Meetings): verification complete, awaiting sign-off

**In-flight:**
- Universal Setup Wizards — 5 wizards built, Universal List Wizard has 7 passing Playwright tests, paperwork partially complete
- Uncommitted working changes across Studio.tsx, StudioTemplateCard.tsx, CustomizedTemplateCard.tsx, studio-seed-data.ts
- Feature decision file status: DRAFTING, founder review pending

**Not started (partial list — see full backlog in Appendix A):**
- PRD-05C, PRD-11B, PRD-12A/B, PRD-19, PRD-20, PRD-22, PRD-27, PRD-28B, PRD-29, PRD-30, PRD-31, PRD-32/32A, PRD-33, PRD-37, PRD-38
- Tier 1 wizards remaining: Tally, Streak, Opportunity Board, Gamification improvements
- Tier 2-4 wizards: Routine Builder kid-focused enhancement, Maintenance Schedule, Reward Menu, Treasure Box, Best Intentions, Guiding Stars, Money, Percentage, Mood, Visual World, Sequential Path, InnerWorkings, Archives, first-visit detection, Supabase draft persistence

**Waiting for:**
- Claude Opus 4.7 to land in Claude Code / VS Code extension (released in Claude.ai; propagation to tools pending)

### Guiding Philosophy (Reminders)

These principles predate this gameplan and continue to apply:

- **Build it right.** No MVP shortcuts. No tech debt. No workarounds without explicit founder approval.
- **Value first.** "Providing value for them also benefits us, but err on the side of providing value."
- **Maximalist options, minimalist auto-defaults.** Rich configuration available, sensible defaults pre-filled.
- **Human-in-the-Mix.** Every AI output goes through Edit/Approve/Regenerate/Reject before saving.
- **LiLa bridges to humans, never substitutes.** LiLa applies synthesized universal principles, not single-source quotes.
- **Celebrations are user-triggered, never automatic.** Victory Recorder is celebration-only (Ta-Da list).
- **PRD sessions supersede Planning Decisions doc.** Most recent session decisions are authoritative.

### New Architectural Principle: Lego / Surge Protector Connection Architecture

**Added to this gameplan, to be promoted to CLAUDE.md convention.**

Every feature in MyAIM Family is a **composable block** with standard connection points. Families assemble their own platform by plugging blocks together. This is not a metaphor — it is an architectural rule that shapes how we build.

**The rules:**

1. **Every wizard exposes every connection point it could have.** Not just the ones that work today.
2. **Connection points that don't have a live target system yet are registered-and-inert.** They show up as "coming soon when you set up X" rather than being invisible.
3. **When a target system ships later, existing connection points auto-activate.** No retrofit required.
4. **ConnectionOffersPanel is the canonical UI for exposing connections.** Reused in wizards and in edit views (unobtrusive, collapsed, absent if no connections are relevant).
5. **Fully wired means "every cell in the connection matrix is either live or registered-and-inert."**

Think of it like a surge protector: 8 outlets, only 3 in use today, but when you buy a new lamp next month, there's already a plug waiting.

This principle becomes load-bearing in **Gate 2** (wizard build continuation) and should be added to CLAUDE.md as convention #241 or equivalent during Phase 1.

### The Four-Gate Production Pipeline

The work ahead flows through four gates. **Nothing advances to the next gate until the previous one is solid.**

```
Gate 1: Code Correctness
   ↓
Gate 2: Wizards + Interconnections Wired
   ↓
Gate 3: Playwright Video Library (Ground Truth Recorded)
   ↓
Beta Readiness Gate: Compliance + Safety Verified + Legal Reviewed
   ↓
Gate 4: LiLa Trained on Verified Reality
```

**Gate 1** — The code does what it's supposed to do. Manual routes work. Audit findings are triaged and resolved. Code-reality alignment is verified.

**Gate 2** — Every Tier 1 wizard ships with its full connection matrix exposed (live or registered-and-inert). Families can assemble their platform from working Lego blocks.

**Gate 3** — Playwright records the working app performing manual paths AND wizard paths for every feature. The recording process itself is a final QA gate — if the video can't be made smoothly, there's a bug to fix first.

**Beta Readiness Gate** — Compliance infrastructure (COPPA, child data handling, LiLa safety enforcement) is verified. A human lawyer has reviewed consent language, T&C, privacy policy, and disclosures. Beta user exposure is blocked until this gate clears.

**Gate 4** — LiLa's help patterns, feature-guide-knowledge, and troubleshooting content are generated against videoed, verified ground truth. LiLa cannot hallucinate because her knowledge base derives from recordings of the actual working app.

This sequence exists because LiLa's trustworthiness depends on everything underneath her being true, AND because beta exposure carries legal weight that requires human legal review. Skipping a gate breaks the chain.

---

## Section 2: The Checklist (Phases and Gates)

### Phase 0 — Sign-Offs (Pre-Gate 1)

**Goal:** Close the current chapter cleanly before entering the new phase.

**Tasks:**
- Formally sign off Build M (Gamification) verification
- Formally sign off PRD-16 (Meetings) verification
- Reset `.claude/rules/current-builds/` to IDLE state (move active build files to `.claude/completed-builds/YYYY-MM/`; `IDLE.md` anchor remains)
- Commit: `chore: sign off Build M + PRD-16 Meetings, reset to IDLE`

**Session prompt for Claude Code:**

> "Before we start anything new, I need to formally sign off on two completed builds so `.claude/rules/current-builds/` resets clean. Please:
> 1. Show me the verification tables for Build M (Gamification) and PRD-16 (Meetings)
> 2. Confirm there are no open blocking items in either
> 3. Reset `.claude/rules/current-builds/` to IDLE state (archive active build files to `.claude/completed-builds/YYYY-MM/`)
> 4. Commit with message 'chore: sign off Build M + PRD-16 Meetings, reset to IDLE'
>
> Do NOT start any new work after this. We're entering a structured planning phase."

**Estimated time:** 30 minutes

---

### Phase 0.25 — Reconnaissance (Pre-Gate 1)

**Goal:** Find out what we actually have vs. what we think we have. Replace guesswork with verified facts before planning any further.

**Why this exists:** Today (April 16) surfaced multiple cases where tools/docs/assumptions were silently out of sync with reality. The tool-health sweep fixed the tooling side. This phase does the same for documentation, compliance architecture, and any other silent drift.

**Scope:**

1. **Doc accuracy reconciliation.** Verify the accuracy of:
   - `BUILD_STATUS.md` — does it match actual built state?
   - `CLAUDE.md` — are all conventions current? Any orphaned rules from deleted features?
   - `STUB_REGISTRY.md` — is every "Wired" actually wired? Every "Stubbed" actually still stubbed?
   - `.claude/rules/current-builds/` — reflects actual current work?
   - Any other living docs in the claude/ directory
   
   Flag drift. Produce a reconciliation report. Update files to match reality. The auto-update-after-push convention silently failed — this is the one-time catch-up pass.

2. **Compliance & safety architecture gap analysis.**
   - Read PRD-20 (Safe Harbor), PRD-30 (Safety Monitoring), PRD-05 (LiLa child safety), PRD-02 (Permissions)
   - Document the intended COPPA-compliant architecture
   - Compare against what's actually built
   - Flag gaps: what consent mechanisms exist, what's missing, what retrofit work is needed
   - Check RLS-VERIFICATION.md status for child-data tables
   - Output: compliance gap report

3. **Tool-firing verification (followup from April 16 sweep).**
   - Verify Step 0 tool health check runs correctly on next /prebuild invocation
   - Verify the wizards directory mgrep issue (F10) — re-probe `src/components/studio/wizards/` after 24h for embedding lag resolution
   - Check for any tools we have registered but didn't verify during the April 16 sweep
   - Output: tool-health report delta

4. **17 followups from TOOL_HEALTH_REPORT_2026-04-16.md** — review each, classify as: "do in Phase 0.25," "defer to Phase 2," "tech debt register," or "intentional / no action."

5. **Wizard work state check.** The Universal List Wizard committed at 21a47a1 but was not founder-verified as serving intended use case. As part of reconnaissance:
   - Read the committed wizard code
   - Understand what it does vs. what the founder expected
   - Flag the gap (don't fix — fix comes in Phase 4)
   - This informs Phase 0.5 close-out decision

**Deliverable:** `RECONNAISSANCE_REPORT_v1.md` at repo root, covering all 5 scopes.

**Session prompt for Claude Code:**

> "We're starting Phase 0.25 Reconnaissance per MYAIM_GAMEPLAN_v2.2.md. Do not take action beyond reading and reporting. Produce RECONNAISSANCE_REPORT_v1.md covering the 5 scopes listed in the gameplan. Do not modify any code. Doc-reconciliation FIXES come after I've reviewed the report. Start by reading the gameplan, today's TOOL_HEALTH_REPORT, and the 17 followups. Then propose your investigation order before starting."

**Estimated time:** 1-2 hours of active Claude Code work, plus founder review of findings.

---

### Phase 0.35 — COPPA PRD Session (Pre-Gate 1, Parallel with Phase 0.25)

**Goal:** Write PRD-40 COPPA Compliance & Parental Verification based on decisions Tenise summarized from prior conversations.

**Why this exists:** COPPA compliance architecture was decided in prior conversations but never formalized into a PRD. Decisions exist only in Tenise's memory and a conversation summary. This phase turns those decisions into a binding spec.

**Decisions already made (to be formalized):**
- Verification is per-parent, not per-child. One verification event = mom verified; she then acknowledges COPPA notice per additional child without new charge.
- Payment serves as COPPA verification. Subscription payment (or $1 beta charge) is an FTC-approved verification method.
- Database structure: `coppa_consents` (one row per child) + `parent_verifications` (one event per parent, linked to multiple consents).
- Trigger: only fires when first under-13 child is added. All-teen families (13+) skip the flow entirely.
- Consent UX: separate from general T&C acceptance. Distinct screen explaining what's collected, how LiLa uses it, how to revoke.

**Scope:**
- Write `PRD-40-COPPA-Compliance-Parental-Verification.md` following the PRD template
- Cross-PRD Impact Addendum: retrofit work for PRD-01 (Auth), PRD-02 (Permissions), PRD-31 (Subscription)
- Legal review note: consent language, verification flow, and revocation mechanism all require human lawyer review before beta launch
- Integration hooks: when mom adds first under-13 child in PRD-01's flow, trigger COPPA consent screen

**This can run in parallel with Phase 0.25** — they touch different scopes and don't block each other. If founder prefers serial, run 0.25 first.

**Deliverable:** PRD-40 + Cross-PRD Impact Addendum merged into project knowledge.

**Estimated time:** 1 full PRD session (~2 hours).

---

### Phase 0.5 — Wizard Sprint Close-Out (Pre-Gate 1)

**Goal:** Finish the current wizard's build properly and pause the wizard sprint without loose ends.

**Decision still open:** Stop after Universal List Wizard, or finish Tally Wizard first? (Founder to decide — this is the fork Tenise flagged wanting to discuss.)

**Tasks (regardless of which wizard is the stopping point):**
- Founder: 5-min visual verification of the current wizard in browser (when localhost is back up)
- Claude Code: STUB_REGISTRY.md update — flip wizard stubs to Wired
- Claude Code: CLAUDE.md conventions update (wizard patterns: localStorage key format, ConnectionOffersPanel pattern, activity log pattern)
- Claude Code: Commit the build
- **Log deferred LiLa knowledge** in `LILA_KNOWLEDGE_BACKLOG.md` (new file, see below) — help patterns for completed wizards stay as backlog entries, not built until Gate 4
- Claude Code: Update BUILD_STATUS.md to reflect wizard sprint pause

**What does NOT happen in Phase 0.5:**
- Help patterns for LiLa are NOT written (deferred to Gate 4 batch)
- feature-guide-knowledge for Lists page is NOT written (deferred to Gate 4 batch)
- No new wizards start

**LILA_KNOWLEDGE_BACKLOG.md — new file to create:**

A lightweight tracking doc at repo root. Every deferred LiLa content item gets logged here when a build ships without its help content. Format per entry:

```markdown
## [Feature/Wizard Name]
- **Shipped:** [date, commit SHA]
- **Needs:** help patterns for [list of user phrasings]
- **Needs:** feature-guide-knowledge for [page/feature]
- **Blocked by:** 4.7 availability in Claude Code + Gate 3 video recording
- **Status:** Backlog
```

Claude Code updates this file at the end of every build that defers LiLa content. Gate 4 reads this file as its work queue.

**Estimated time:** 1-2 hours (plus founder visual verification)

---

### Phase 1 — Lock Universal Setup Wizards Design Doc (Pre-Gate 1)

**Goal:** Move `Universal-Setup-Wizards.md` from DRAFTING to LOCKED with the session addendum decisions folded in.

**Why this matters:** The design doc is the authority for remaining wizard builds. Locking it now means audit findings don't retroactively need to account for design drift.

**Tasks:**
- Claude Code: Merge `Universal-Setup-Wizards-Session-Addendum.md` decisions into `Universal-Setup-Wizards.md`
- Mark superseded sections clearly (the original 10-preset Tally wizard, individual list wizards, standalone Checklist wizard, etc.)
- Change status to LOCKED with date
- Session addendum remains as historical record but is no longer needed for builds
- Add Lego/Surge Protector principle to CLAUDE.md as formal convention
- Commit: `docs: lock Universal Setup Wizards design doc, add Lego connection principle`

**Estimated time:** 1-2 hours

---

### Phase 2 — Architectural Audit (Gate 1 Begins)

**Goal:** Surface every area where the code, the PRDs, the LiLa content, or the architectural patterns have drifted — so we know what to fix before building more.

**Scope (full architectural review per founder decision):**

1. **Code quality**
   - TypeScript errors (`tsc -b` clean)
   - Zod coverage audit (which endpoints/functions have schema validation, which don't)
   - Obvious dead code, unused imports, orphaned components
   - Test coverage (which features have E2E tests, which don't)
   - Lint warnings triage
   - **"Tests pass but doesn't serve need" check.** For each built-and-tested feature, sample 2-3 "real use" scenarios (not just unit test scenarios). Confirm tests passing actually means the feature serves its intended use case. Flag any "tests pass but doesn't serve need" gaps for triage. The Universal List Wizard situation (committed 21a47a1 but founder-flagged as not quite matching intended use case) is the canonical example of what this check catches.
   - **Tool-health verification (sub-check).** Confirm TOOL_HEALTH_REPORT_2026-04-16.md findings are still current at audit time. Re-run tool-health sweep as a spot check. Confirm Step 0 /prebuild gate is working as designed. Flag any new tools registered since reconnaissance that haven't been verified.
   - **AURI retroactive scan.** AURI was non-functional from installation through April 16, 2026. Run AURI across the entire existing codebase to surface security issues that weren't caught during original build. Prioritize PRD-01 (Auth), PRD-02 (Permissions), PRD-05 (LiLa system prompts + ethics enforcement), and any Edge Function with AI calls or user data handling.

2. **PRD-to-code alignment** (three-column discrepancy report)
   - For every built PRD: what the PRD says × what the code does × status classification
   - Status options: Intentional-Document, Unintentional-Fix-Code, Unintentional-Fix-PRD, Deferred-Document, Scope-Creep-Evaluate
   - Every discrepancy needs founder review — Claude Code produces the report, founder resolves

3. **Cross-PRD integration audit**
   - Every cross-PRD addendum — was it honored in code?
   - Are the integration points actually wired, or stubbed?
   - Does data flow across PRD boundaries as designed?

4. **Cost optimization patterns (P1-P9)**
   - Verify each pattern is applied where it should be
   - Identify AI calls that should be using embedding-based classification but aren't
   - Check context loading is relevance-filtered, not bulk-loaded

5. **Stub registry reconciliation**
   - Every stub in STUB_REGISTRY.md — is it still stubbed, or has it been wired without the registry being updated?
   - Every "wired" item — does the code actually do what's claimed?
   - MVP vs Post-MVP vs Superseded classifications accurate?

6. **LiLa content discrepancy report (reporting layer only)**
   - For every LiLa help pattern and feature-guide-knowledge entry: does it reference code/UI that exists and works as described?
   - List discrepancies. **Do not fix during audit.** Discrepancies inform Gate 4's rewrite.

7. **Performance baseline**
   - Measure current load times, query performance, AI call latency
   - Record baseline so future optimization work can be measured
   - Flag any obvious performance issues for triage

8. **Compliance & safety infrastructure**
   - COPPA compliance readiness. Per PRD-40 (drafted in Phase 0.35): is the `coppa_consents` table built? `parent_verifications` table? Is consent UX wired to first-under-13-child trigger? Are the retrofit hooks in PRD-01 (Auth) and PRD-31 (Subscription) in place?
   - Child data handling. Any table with data belonging to under-13 children — RLS correct? Data export/deletion flows exist? Retention policy encoded?
   - LiLa safety enforcement. Are the ethics auto-reject categories (force, coercion, manipulation, shame-based control, withholding affection) actually enforced at the Edge Function level, not just specified in prompts? PRD-20 (Safe Harbor) wired? PRD-30 (Safety Monitoring) wired?
   - Deities-as-Board-persona block. Is the Prayer Seat pattern enforced? Can a user actually add a deity as Board of Directors persona, or does the block trigger?
   - Legal liability surfaces. Every AI output has Edit/Approve/Regenerate/Reject (Human-in-the-Mix pattern)? Where does this break down?
   - Output: compliance readiness report tied to Beta Readiness Gate (see below). Legal review items flagged separately for human lawyer review.

**Deliverable:** A single audit report file (`AUDIT_REPORT_v1.md`) organized by the 8 scope sections above. Each finding gets:
- Description
- Severity (Blocking / High / Medium / Low)
- Proposed resolution
- Founder decision required? (Y/N)

**Session prompt for Claude Code:**

> "We're starting the Phase 2 Architectural Audit per MYAIM_GAMEPLAN_v2.2.md. The scope is the 8 sections defined in Phase 2. Before you begin, propose the order you'll audit in and show me how you'll structure findings. Do not start auditing until I approve the approach."

**Estimated time:** 1-2 days of active Claude Code sessions, depending on scope depth per finding

**Audit-specific Claude Code queries:** See Section 4 (Query Library) for the full question list organized by scope area.

**Note on /ultrareview (4.7 feature — if available):** Within the audit, `/ultrareview` is the preferred tool for change-focused review sessions (e.g., reviewing a single feature's code for bugs and design issues). It does NOT replace the broader architectural sweep, which covers scopes `/ultrareview` can't (PRD alignment, cost patterns, stub reconciliation). Use `/ultrareview` ad-hoc when a specific change warrants careful review. See Section 3 Decision Tree for guidance. Three free uses available on Pro/Max — spend them on moments where the review actually matters.

---

### Phase 3 — Triage (Gate 1 Completes)

**Goal:** Turn the audit report into an actionable plan. Classify every finding. Fix the blockers.

**Tasks:**
- Founder + Claude: walk the audit report finding-by-finding
- Classify each finding into:
  - **Fix Now** — blocks Gate 2, do before any new wizards
  - **Fix Next Build** — address as part of the next feature build that touches the area
  - **Tech Debt Register** — log in dedicated tech debt doc, revisit later
  - **Intentional (Update Doc)** — code is right, PRD/doc needs updating to match
  - **Defer to Gate 4** — LiLa content issues wait for Gate 4 batch
- Claude Code: execute Fix Now items
- Claude Code: update PRDs/docs where classification was "Intentional (Update Doc)"
- Create `TECH_DEBT_REGISTER.md` for Fix Next Build + Tech Debt items
- Commit triage decisions + any Fix Now completions

**Gate 1 Exit Criteria (must all be true to advance to Gate 2):**
- [ ] Audit report is complete and founder-reviewed
- [ ] Every audit finding is classified (Fix Now / Fix Next Build / Tech Debt / Intentional / Defer to Gate 4)
- [ ] All Fix Now items are resolved and committed
- [ ] PRD updates for "Intentional" classifications are merged
- [ ] TECH_DEBT_REGISTER.md exists with all deferred findings
- [ ] LILA_KNOWLEDGE_BACKLOG.md has all Gate 4 items logged
- [ ] `tsc -b` is clean
- [ ] BUILD_STATUS.md reflects Gate 1 complete
- [ ] Founder has explicitly said "Gate 1 is complete, advancing to Gate 2"

**Estimated time:** 1 day for triage + variable for Fix Now execution (depends on audit findings)

---

### Phase 4 — Resume Wizard Builds (Gate 2)

**Goal:** Finish Tier 1 wizards with full Lego/Surge Protector connection architecture. Continue through Tier 2, 3, 4 as prioritized in the Universal Setup Wizards doc.

**Precondition:** Gate 1 exit criteria all met.

**Tasks in order:**
1. Build the **connection matrix** — a document showing: which wizards × which target systems × current wire status. This becomes the reference for "what's live / what's registered-and-inert" per wizard.
2. Build remaining Tier 1 wizards per the revised priority (from session addendum):
   - Tally Wizard (one universal, 7 steps, highest leverage)
   - Streak Wizard (uses RecurringItemBrowser)
   - Opportunity Board Wizard (bulk-add-first)
   - Gamification Setup improvements (surgical, not rebuild)
3. Each wizard ships with:
   - Full ConnectionOffersPanel exposure (every potential connection visible, live or registered-and-inert)
   - Playwright E2E test passing
   - STUB_REGISTRY updated
   - CLAUDE.md conventions updated if new patterns emerge
   - Commit
   - **LILA_KNOWLEDGE_BACKLOG.md entry added** for deferred help patterns
4. Move to Tier 2 once Tier 1 is complete:
   - Routine Builder kid-focused enhancement
   - Maintenance Schedule Wizard
   - Reward Menu + Treasure Box Wizards
   - Best Intentions + Guiding Stars Wizards
5. Continue through Tier 3 and Tier 4 per Universal Setup Wizards doc

**Note on 4.7 overlap:** If Opus 4.7 lands in Claude Code during Gate 2, Phase 5 (Zod/simplify pass) can interleave with wizard builds. 4.7 is strong at systematic pattern work across similar components — Gate 2's repeated-structure wizards benefit significantly.

**Gate 2 Exit Criteria (must all be true to advance to Gate 3):**
- [ ] All Tier 1 wizards shipped with full connection matrix exposure
- [ ] All Tier 2 wizards shipped (or explicit founder decision to defer specific ones)
- [ ] Tier 3 and 4 wizards built or explicitly deferred with dates
- [ ] Connection matrix document exists and is current
- [ ] Every wizard has passing Playwright E2E test
- [ ] STUB_REGISTRY reflects current state accurately
- [ ] `tsc -b` is clean
- [ ] BUILD_STATUS.md reflects Gate 2 complete
- [ ] Founder has explicitly said "Gate 2 is complete, advancing to Gate 3"

**Estimated time:** 2-4 weeks, depending on how much gets built before deferral

---

### Phase 5 — Opus 4.7 Zod / Simplify Pass (Interleaves with Gate 2 if 4.7 arrives mid-phase)

**Goal:** Use Opus 4.7's systematic refactor strength to sweep Zod coverage and simplify codebase patterns. Also re-baseline cost and latency under the new tokenizer.

**Trigger:** Opus 4.7 available and verified in Claude Code / VS Code extension.

**Pre-flight tasks (do these FIRST when 4.7 becomes available, before the refactor work):**
- Verify model: ask Claude Code "what model are you running" → expect `claude-opus-4-7`
- Run a small test task and compare token usage against 4.6 baseline — the new tokenizer uses roughly 1.0-1.35× more tokens for the same content
- Set effort level defaults for different task types:
  - **`xhigh`** for audit review, complex refactors, wizard builds (new effort level between `high` and `max`)
  - **`high`** for standard coding tasks
  - **`medium`** for documentation updates, LiLa content generation
  - **`low`** only for scoped mechanical tasks
- If running long agentic tasks, evaluate task budgets (new beta feature) — `task-budgets-2026-03-13` header, advisory cap to help the model self-moderate across a full agentic loop
- Re-tune `max_tokens` — start higher than you did on 4.6 given the tokenization change

**Main tasks:**
- Run Zod coverage audit (already done in Phase 2, re-check for gaps introduced during Gate 2 builds)
- For every gap: generate Zod schema, wire into endpoint/function
- Simplification sweep: identify repeated patterns that could be abstracted, duplicated code that could be shared, overly complex logic that could be clarified
- Refactor in small, reviewable commits
- Add/update tests as refactors land

**Behavioral changes to watch for on 4.7:**
- **Response length varies by task complexity** — shorter on simple lookups, longer on open-ended analysis. If 4.7 gives a shorter answer than you expected, it judged the task simpler than you did. Provide more context if it under-delivers, or use positive examples to show desired depth.
- **More literal instruction following** — 4.7 won't silently generalize. If you say "audit PRD-15" it won't also audit PRD-16 unless you ask. This is usually good for predictable builds.
- **More direct tone** — less validation-forward phrasing, fewer affirmations. This is a good match for your audit-style communication preference.
- **Fewer tool calls by default** — 4.7 reasons more and tools less. If Claude Code isn't running enough grep/view commands during audit, raise effort to `xhigh` rather than prompting harder.
- **Fewer subagents spawned** — if you need parallel work, explicitly request it.
- **Built-in progress updates in long runs** — you shouldn't need scaffolding like "summarize every 3 steps." If progress updates are wrong length, specify what you want in the prompt.

**When this phase runs depends on 4.7 timing:**
- If 4.7 lands before Gate 2 starts: run as Phase 4.5 between Phase 3 and Phase 4
- If 4.7 lands during Gate 2: interleave with wizard builds
- If 4.7 lands after Gate 2: run as Phase 5 before Gate 3
- If 4.7 does not land before Gate 3: run Phase 5 with Opus 4.6 as a reduced-scope Zod pass; skip the simplification sweep for later

**Estimated time:** 2-3 days of active sessions

---

### Phase 6 — Playwright Video Library (Gate 3)

**Goal:** Record the working app performing every significant user flow, producing ground truth video content for LiLa reference and user troubleshooting.

**Pre-flight design requirement:** Before starting Phase 6, write a proper feature decision doc for the video library. This should include:
- Video format, length guidelines, file hosting location
- Naming conventions and category taxonomy
- How LiLa will reference videos (link format, timestamp linking if supported)
- Update cadence — when videos are re-recorded as features change
- Storage: Supabase storage bucket? CDN? Embedded in app or external?
- Whether videos should have voiceover, captions, or be silent
- Per-flow: manual path video AND wizard path video

**This feature decision doc becomes PRD-39 (or next available number) when formalized.**

**Tasks (after pre-flight design is approved):**
- Select the flows to record (prioritized list — daily-use flows first)
- For each flow: write Playwright test that executes the full user journey in a realistic way
- Configure Playwright to record video
- Run recordings, review for quality, re-record if needed
- **Recording as QA:** if a video can't be made smoothly, there's a bug — fix the bug, then re-record
- Upload videos to chosen hosting
- Build video index / catalog (per-category, per-feature)
- Surface videos in app troubleshooting section

**Gate 3 Exit Criteria (must all be true to advance to Gate 4):**
- [ ] Video library design doc (PRD-39 or equivalent) is LOCKED
- [ ] Every Tier 1 feature has manual path + wizard path video recorded
- [ ] Every Tier 2 feature has at least manual path video
- [ ] Video index exists and is accessible in app troubleshooting section
- [ ] All bugs discovered during recording are fixed and re-recordings are complete
- [ ] LILA_KNOWLEDGE_BACKLOG.md is updated with video references for each entry
- [ ] Founder has explicitly said "Gate 3 is complete, advancing to Gate 4"

**Estimated time:** 1-2 weeks

---

### Beta Readiness Gate (Between Gate 3 and Gate 4)

**Why this exists:** Before LiLa training finalizes and the app approaches beta-user exposure, verify the compliance and safety infrastructure surfaced during Phase 2 Scope 8 has been fully remediated. This is a separate gate because compliance readiness has legal, not just product, implications.

**Preconditions:**
- Gate 3 exit criteria met (videos exist as ground truth)
- Phase 2 Scope 8 Compliance Readiness Report produced
- All Compliance Fix Now items from Phase 3 triage have been resolved

**Exit Criteria (all must be true before Gate 4 / LiLa training / beta):**
- [ ] COPPA compliance per PRD-40 fully wired: `coppa_consents` table, `parent_verifications` table, consent UX, first-under-13-child trigger all verified working
- [ ] Child data handling audit passes: RLS correct on all under-13 child data tables, export/deletion flows exist, retention policy encoded
- [ ] LiLa ethics enforcement verified at Edge Function level (not just prompt-specified): auto-reject categories (force, coercion, manipulation, shame-based control, withholding affection) tested with red-team prompts
- [ ] Deities-as-Board-persona block tested — cannot be bypassed
- [ ] PRD-20 (Safe Harbor) core functionality wired and tested
- [ ] PRD-30 (Safety Monitoring) core functionality wired
- [ ] Every AI output surface has Edit/Approve/Regenerate/Reject (Human-in-the-Mix) — audit confirms no gaps
- [ ] **Legal review completed** by a human lawyer: COPPA consent language, T&C, privacy policy, LiLa disclosure language, data handling disclosures. This is a hard requirement; Claude Code cannot self-certify this item.
- [ ] Founder has explicitly said "Beta Readiness Gate is complete, advancing to Gate 4 / LiLa training / beta"

**Deliverable:** `BETA_READINESS_REPORT.md` with each exit criterion evidenced (what was tested, what was verified, what the lawyer signed off on).

**Estimated time:** depends on Phase 2 findings. If compliance is largely wired, 2-3 days of verification. If gaps are significant, could be 1-2 weeks of remediation work plus legal review turnaround.

**This gate may run in parallel with early Gate 4 LiLa knowledge batch work** (LiLa training that doesn't touch user-facing disclosures), but beta user exposure is blocked until this gate clears.

---

### Phase 7 — LiLa Knowledge Batch (Gate 4)

**Goal:** Train LiLa on the verified, videoed, working reality of the app. Flush the backlog built up through Phases 0.5, 4, and 6.

**Precondition:** Gate 3 exit criteria all met. Videos exist as ground truth.

**Tasks:**
- Read LILA_KNOWLEDGE_BACKLOG.md in full — this is the work queue
- For every entry:
  - Write help patterns for listed user phrasings
  - Write feature-guide-knowledge entries
  - Link to relevant Playwright videos (at least one manual path, one wizard path where applicable)
  - Add troubleshooting content referencing video library
- Update LiLa's retrieval/ranking to prefer video-linked content where available
- Run LiLa through test scenarios — verify no hallucinations, verify video links work
- Update LILA_KNOWLEDGE_BACKLOG.md entries to Status: Complete
- Archive completed backlog into `LILA_KNOWLEDGE_ARCHIVE.md`

**No formal gate exit criteria** — Gate 4 is iterative. LiLa gets better over time as more content ships and as users surface gaps.

**Estimated time:** 3-5 days

---

### Phase 8 — Accelerated PRD Rollout

**Goal:** Clear the remaining PRD backlog on a clean, audited, documented, LiLa-aware foundation.

**Remaining PRDs (see Appendix A for full list with dependencies):**
- Tier A (blocking other work or high-value): PRD-22 Settings, PRD-28B Compliance, PRD-31 Subscription Tiers, PRD-32/32A Admin Console, PRD-37 Family Feeds
- Tier B (growth features): PRD-05C LiLa Optimizer, PRD-11B Family Celebration, PRD-12A/B LifeLantern + Vision Quest, PRD-19 Family Context, PRD-20 Safe Harbor
- Tier C (specialized): PRD-27 Caregiver Tools, PRD-29 BigPlans, PRD-30 Safety Monitoring, PRD-33 Offline/PWA, PRD-38 Blog
- Gamification themes: Pets, Apothecary, Dragons, Pixel Loot (Woodland Felt is canonical pattern)

**Pattern for each PRD:**
- PRD session (Claude reads docs, asks clarifying questions with recommendations)
- Pre-build ritual (PRE_BUILD_PROCESS.md)
- Build execution (Claude Code, sub-phase gating)
- Playwright E2E test
- Video recording (per Gate 3 protocol)
- LiLa knowledge batch entry
- Sign-off

**No formal exit criteria** — this phase continues until the platform is feature-complete for launch.

---

## Section 3: Decision Tree

When specific situations arise during execution, use these branches to decide what to do.

### "Claude Code finds a critical bug during audit"

Is it blocking the current phase?
- **Yes** → Classify as Fix Now in triage. Do not advance to Gate 2 until resolved.
- **No** → Classify as Fix Next Build or Tech Debt. Document. Continue audit.

Is it a security vulnerability or data corruption risk?
- **Yes** → Fix immediately, regardless of phase. Security/data issues override gate structure.
- **No** → Follow standard triage.

### "I want to build a wizard while audit is running"

Is it a Tier 1 wizard (Tally, Streak, Opportunity Board, Gamification improvements)?
- **Yes** → Strongly prefer pausing. Tier 1 wizards benefit most from audit findings. If you absolutely must build, run it in a separate Claude Code session window, and treat any audit findings as potential rework.
- **No** → If it's a small fix or bug patch, fine. If it's a new feature build, it's preferable to wait.

Are you waiting on founder input for audit triage?
- **Yes** → Use the wait time for a small, isolated task that won't conflict with audit findings. A doc update, a test addition, a small bug fix in an already-audited area.
- **No** → Focus on audit.

### "Audit surfaces 50+ findings"

- Batch them by scope section first (code quality, PRD alignment, etc.)
- Within each batch, sort by severity (Blocking → High → Medium → Low)
- Triage Blocking items first in one session
- Triage High items in a second session
- Medium and Low items can go straight to Tech Debt Register without individual review, with founder spot-checking
- Do not try to triage all 50+ in one sitting — split into focused sessions

### "4.7 lands mid-audit"

Is the audit > 50% complete?
- **Yes** → Finish the audit with 4.6, then do Phase 5 (Zod/simplify) with 4.7 immediately after.
- **No** → Stop, switch to 4.7, restart the audit with fresh 4.7 sessions. The second pass will be faster because Claude Code has the scope definition already.

### "A new PRD decision emerges during audit"

- Log it in `AUDIT_DECISIONS_EMERGED.md` as a new file
- Do not block audit on it — these are future-phase concerns
- In triage, review the list and schedule PRD sessions for each before Phase 8

### "A wizard build reveals that a connection target system doesn't exist yet"

Per Lego/Surge Protector architecture:
- Register the connection as inert in ConnectionOffersPanel
- Copy: "Coming soon when you set up [X]"
- Add the "build X" item to the appropriate future phase
- Do NOT hide the connection point — the whole point is users see what's possible

### "Playwright recording in Gate 3 reveals a bug"

- Stop recording that flow
- Create an audit-style finding for the bug
- Fix the bug
- Re-record the flow
- Add the bug discovery to a "Gate 3 Bug Harvest" log — these bugs escaped Gate 1, which tells us something about audit coverage

### "LiLa is still hallucinating in Gate 4 after training on videoed content"

- Identify the specific hallucination pattern
- Is it referencing code that does exist, but incorrectly? → LiLa prompting issue, adjust system prompt
- Is it referencing code that doesn't exist? → Ground truth content is wrong, fix the content
- Is it ignoring the video library? → Retrieval/ranking issue, adjust LiLa's content prioritization
- Log each pattern and resolution in `LILA_QUALITY_LOG.md`

### "I have momentum and want to skip a gate"

**Don't.** The gates exist because LiLa trustworthiness depends on the chain. Skipping a gate means:
- LiLa trained on unverified content → hallucinations return
- Videos recorded on unfinished features → user confusion
- Wizards built on un-audited code → rework guaranteed
- Code shipped without audit → tech debt compounds silently

If momentum is strong, redirect it into completing the current gate faster, not skipping ahead.

### "I don't know what phase I'm in"

- Check BUILD_STATUS.md first — it should say
- If unclear: check the last commit — does the message reference this gameplan?
- Ask Claude Code: "Read MYAIM_GAMEPLAN_v2.2.md and BUILD_STATUS.md. What phase are we in and what's the next checklist item?"

### "When should I use /ultrareview?"

Per Opus 4.7 Claude Code feature. You get 3 free uses on Pro/Max — spend them wisely.

**Use /ultrareview when:**
- A significant feature build is about to merge and you want a second-opinion review
- The audit's Fix Now commits are done and you want to verify quality before closing Gate 1
- Uncommitted changes have been sitting for a while (like your current Studio.tsx changes) and need fresh eyes before commit
- You suspect a design issue but can't articulate it specifically

**Don't use /ultrareview for:**
- Routine bug fixes (overkill)
- The broad architectural audit itself (too large, not change-focused)
- Anything where you already know what's wrong
- Just to feel safer about a change you already reviewed carefully

**Verify 4.7 is running before spending a use.** If Claude Code is still on 4.6, `/ultrareview` may not work or may not give you 4.7-quality results.

### "When is auto mode appropriate?"

Per Opus 4.7 Claude Code feature, extended to Max users. See Section 3.5 (Auto Mode Protocol) for the full rules. Short version:

- **Yes:** subsequent wizards in a pattern already established, Playwright video recording runs, batch Zod schema generation following an approved plan, test writing for already-built features, documentation updates following an approved change
- **No:** database schema changes, LiLa behavior changes, shared infrastructure changes, gameplan/CLAUDE.md changes, the first time a new pattern is being established, anything across a gate boundary

**When in doubt, don't enable auto mode.** The safety rails exist because the risk of "built the wrong thing thoroughly" is higher than the upside of "built it slightly faster."

### "I want auto mode but the rules say no for this task"

Three options:
1. Break the task into smaller pieces, some of which might qualify for auto mode
2. Do it manually this one time so the pattern is established — subsequent similar work qualifies for auto mode
3. Tell Claude Code to produce a very detailed plan first, you review and approve, then run in semi-auto mode (commit checkpoints after each logical unit, you review each commit)

---

## Section 3.5: Auto Mode Protocol

Opus 4.7 in Claude Code introduces **auto mode** — a permissions option where Claude makes decisions on your behalf, so long-running tasks complete with fewer interruptions. Max users have access. This section defines how auto mode is used within this gameplan so that less babysitting doesn't become less fidelity-to-intent.

### The Core Principle

> **Auto mode executes plans. It does not invent plans.**

Claude Code produces a written plan, you approve the plan, auto mode runs the plan. The plan is the contract. If Claude Code needs to deviate, it stops and asks.

### The Six Safety Rails

These rails apply whenever auto mode is enabled for MyAIM work:

**1. Auto mode only permitted within a phase, never across gate boundaries.**
You approve Gate 1 exit manually. You approve Gate 2 exit manually. You approve Gate 3 exit manually. Always. No exceptions. Auto mode accelerates execution *inside* a phase; it never decides a phase is complete.

**2. Auto mode requires a written plan first.**
Before enabling auto mode, Claude Code produces a plan document listing: the task, the intended approach, the specific files to be touched, the expected commits, and any assumptions being made. You review the plan. You approve it. Then — and only then — auto mode runs.

**3. Auto mode requires commit checkpoints.**
Long auto-mode runs must commit after each logical unit (e.g., each Zod schema addition, each wizard step built, each video recorded). Commit messages must clearly describe what happened. You can stop the run at any commit and review. "Big bang" auto mode commits are not allowed.

**4. Auto mode is NOT permitted for:**
- Database schema changes (migrations, RLS policies, RPC definitions)
- LiLa system prompt or behavior modifications
- Shared infrastructure changes (ConnectionOffersPanel, SetupWizard, WizardProgressSaver, WizardTagPicker, DashboardDeployPicker, RecurringItemBrowser, useCompleteTask, useApproveCompletion, anything in `src/lib/shared/`)
- The gameplan, CLAUDE.md, STUB_REGISTRY.md, PRE_BUILD_PROCESS.md, or any orientation/convention docs
- The first time a new wizard type is built (pattern establishment requires your input)
- Anything the audit classified as "Fix Now" (these need careful review)
- Any work that crosses a Gate boundary

**5. Auto mode IS permitted for:**
- Subsequent wizards in a pattern already established with your input (e.g., after Tally Wizard is built with your oversight, Streak Wizard following the same pattern can run in auto mode)
- Playwright video recording runs (mechanical, repetitive, plan-driven)
- Batch refactors following an approved plan (like adding Zod schemas to a list of endpoints)
- Test writing for already-built features where the test plan has been approved
- Documentation updates (STUB_REGISTRY entries, BUILD_STATUS updates, commit messages) following an approved build
- LiLa knowledge batch generation (Gate 4) after the ground-truth videos exist and the backlog template is approved

**6. Every auto mode run produces a summary report you read before approving the next step.**
At the end of any auto mode run, Claude Code writes a brief report: what was done, what was skipped and why, any assumptions that were made, any findings or concerns. You read this report. You either approve continuing to the next task or you stop and review.

### Auto Mode Enablement Checklist

Before clicking "enable auto mode" for a specific task, confirm:

- [ ] The task is in the "permitted" list above (or the "not permitted" list has been explicitly overridden by written founder decision)
- [ ] Claude Code has produced a plan and you've approved it
- [ ] The plan specifies commit checkpoints
- [ ] You understand what files will be touched
- [ ] The task is within a single phase, not crossing a gate
- [ ] If the task is within an approved auto-permitted category, you've confirmed the pattern has been established (not the first time)
- [ ] You'll be available to review commits as they land

If any checkbox is unchecked, don't enable auto mode.

### The "Fidelity Over Speed" Tiebreaker

Tenise's stated preference: "I want things to work correctly, but I would really like to do as little as possible after we have made the decisions. But I want it to build things the way I intend them, not do a really thorough job of building the wrong thing."

The tiebreaker rule: **when in doubt, disable auto mode.** The cost of a manual session is an hour of your time. The cost of "built the wrong thing thoroughly" is days of rework and potentially a lost week of momentum. The asymmetry means safety rails should err toward caution.

### Auto Mode Audit Trail

Claude Code should maintain `AUTO_MODE_LOG.md` — a file that logs every auto mode enablement:

```markdown
## [Date, Time]
- **Task:** [brief description]
- **Plan:** [link to approved plan]
- **Enabled after:** [what preceded the enablement]
- **Commits:** [list of commit SHAs]
- **Report:** [link to summary report]
- **Founder review:** [timestamp + any notes]
```

This provides an audit trail for reviewing which tasks benefited from auto mode vs. which caused issues, and informs future iterations of this protocol.

---

## Section 3.6: Parallelism & Agent Teams Protocol

Opus 4.7 enhances native multi-agent coordination — an Opus 4.7 lead can spawn Sonnet 4.6 or Haiku 4.5 sub-agents for parallel subtasks and synthesize results. Combined with the ability to run multiple Claude Code sessions in separate windows, you have two flavors of parallelism available. This section defines when each is appropriate and how to use them safely.

### The Core Principle

> **Parallelize mechanical work that has established patterns. Serialize decision work and pattern establishment.**

Mechanical work: Zod schema generation across many endpoints, audit findings across independent scopes, video recordings across feature categories, LiLa content generation across backlog entries, test writing for built features.

Decision work: triage classification, gate exit approval, architectural choices, the first-ever build of a new pattern, anything requiring founder judgment.

When in doubt, serialize. The cost of a slow parallel run is mild inefficiency. The cost of parallel execution that diverges from intent is rework across multiple tracks simultaneously.

### Agent Team Composition: Three Modes

**Mode A: Opus 4.7 Lead + Sub-Agents (native agent teams)**

One Opus 4.7 instance orchestrates. It spawns Sonnet 4.6 or Haiku 4.5 sub-agents for parallel subtasks, reviews their outputs, and synthesizes. You interact with the lead, not the sub-agents.

- **Best for:** Large mechanical tasks where consistency of output matters (Zod schemas across a codebase, LiLa content across features, audit findings across scopes).
- **Advantages:** Lead ensures consistency, sub-agents parallelize, you have a single interface.
- **Disadvantages:** Sub-agent quality varies; lead must review carefully. Harder to debug if something goes wrong mid-run.
- **Note:** Opus 4.7 tends to spawn fewer sub-agents by default than prior models. If you want more parallelism, explicitly instruct the lead to delegate aggressively.

**Mode B: Parallel Claude Code Sessions (you orchestrate)**

Multiple Claude Code windows open. Each session works on an independent scope. You assign tasks, check progress, and coordinate commits.

- **Best for:** Tasks where you want full visibility into each parallel track, or where sessions need different working directories / branches.
- **Advantages:** You see everything directly. Each session has its own context. Easy to pause one session without affecting others.
- **Disadvantages:** You orchestrate, which adds cognitive load. Harder to ensure consistency across sessions.

**Mode C: Hybrid (your preference per this gameplan)**

Use Mode A (agent teams) for deep parallelism within a single phase where output consistency matters. Use Mode B (parallel sessions) for cross-phase parallelism or when different sessions need different contexts.

Example: Phase 2 audit uses Mode A — Opus 4.7 lead coordinates sub-agents to audit independent scopes. Phase 4 wizard builds use Mode B — one session per wizard, you orchestrate.

### Per-Phase Parallelism Guidance

**Phase 0 (Sign-offs):** Serial. Single session.

**Phase 0.5 (Wizard close-out):** Serial. Single session.

**Phase 1 (Design doc lock + CLAUDE.md additions):** Serial. Single session.

**Phase 2 (Architectural audit):** HIGH parallelism. **Preferred mode: A (agent teams) or B (parallel sessions), your choice.**
- 7 independent scope sections can run simultaneously
- If Mode A: Opus 4.7 lead spawns one sub-agent per scope section, coordinates findings into unified AUDIT_REPORT_v1.md
- If Mode B: one Claude Code session per scope section, you merge findings manually
- **Exit from parallelism:** triage is serial, regardless of how audit ran

**Phase 3 (Triage):** Serial. Decision work. Exception: after triage, Fix Now items can run in parallel.

**Phase 4 (Wizard builds):** Mixed. **Preferred mode: B (parallel sessions) with serial first-of-pattern.**
- Tally Wizard (first post-audit wizard): serial — pattern establishment
- Streak + Opportunity Board (after Tally pattern proven): can run in parallel sessions
- Gamification Setup improvements: serial — surgical, touches existing code
- Playwright tests can be written in parallel with wizard implementation in a separate session

**Phase 5 (Zod / simplify pass):** HIGH parallelism. **Preferred mode: A (agent teams).**
- Opus 4.7 lead orchestrates
- Sub-agents per subsystem (tasks, lists, widgets, LiLa, etc.)
- Lead ensures cross-system type consistency
- This is the clearest "agent teams win" case in the gameplan

**Phase 6 (Playwright video recording):** MEDIUM parallelism. **Preferred mode: A within batches.**
- Group flows into batches by category
- Within a batch, sub-agents record in parallel
- Batches execute serially
- **If recording surfaces a bug, serialize** — diagnose cleanly before resuming parallel

**Phase 7 (LiLa knowledge batch):** HIGH parallelism. **Preferred mode: A (agent teams).**
- Opus 4.7 lead ensures LiLa voice consistency
- Sub-agents per feature, each writes help patterns + feature-guide-knowledge
- Lead reviews all output against consistency checklist before commit

**Phase 8 (PRD rollout):** MEDIUM parallelism. **Preferred mode: B (parallel sessions).**
- Independent PRDs (no shared dependencies) can build simultaneously
- Default: one PRD per session
- Cross-PRD dependencies force serial ordering

### Safety Rails for Parallel Work

These are additions to the Auto Mode Protocol (Section 3.5) — they apply when parallelism is combined with auto mode, but also when parallelism is used with manual mode.

**1. Parallel work requires a coordination plan first.**
Before parallel execution starts, document the scope boundaries for each parallel track. Who (which session or sub-agent) is doing what. What's shared, what's isolated.

**2. Parallel tracks commit to separate branches or isolated file scopes.**
Two parallel tracks must not touch the same files. If they must, serialize those edits. Branch-per-track or file-scope-per-track is the enforcement.

**3. Every parallel run produces a consolidated report.**
For Mode A: the lead produces the consolidated report. For Mode B: you consolidate manually at the end of the parallel phase.

**4. Gate exit criteria still require founder sign-off.**
Regardless of how parallel the work was, you serially sign off on gate completion. No parallelism crosses gate boundaries.

**5. If a parallel track fails, pause all tracks.**
When one sub-agent or parallel session hits a blocker, pause the others. Don't let parallel tracks race past an unresolved issue in one of them — the issue might be systemic.

**6. Record parallelism decisions in PARALLELISM_LOG.md.**
For each parallel run: track composition, scope assignments, outcomes, and any issues. Informs future iterations of this protocol.

### When to Choose Mode A vs Mode B

| Factor | Choose Mode A (agent teams) | Choose Mode B (parallel sessions) |
|---|---|---|
| Task type | Mechanical, uniform across scopes | Independent, varied contexts |
| Output consistency | Critical | Less critical |
| Founder oversight | Light (review lead's synthesis) | Heavy (direct per-session) |
| Debugging difficulty concern | Lower tolerance for opaque failures → avoid A | Comfortable with direct debugging |
| Phase | Audit, Zod pass, LiLa batch | Wizard builds, PRD rollout |
| Opus 4.7 available | Required for native agent teams | Not required |

### The Conservative Default

Per founder preference: **Phase 0 + 0.5 + 1 run single-threaded.** Parallelism is introduced in Phase 2 and selectively afterward. The first parallel run is the audit (Phase 2) — low-stakes because audit findings are reports, not code changes.

This gives us a real-world test of agent teams before parallelism gets used for anything that modifies production code.

---

## Section 4: Claude Code Query Library

These are the specific questions to paste into Claude Code during each phase. They're organized by audit scope section (Phase 2) and by task type.

### Audit Queries — Code Quality

**Zod coverage:**
> "Grep the codebase for all API route handlers, Edge Functions, and form submission handlers. For each, identify whether input is validated with a Zod schema. Produce a table: file path × handler name × Zod coverage (Yes/No/Partial) × severity if missing."

**TypeScript errors:**
> "Run `tsc -b` and list every error. For each, classify as: Blocking Build / Runtime Risk / Dead Code / Type Annotation Missing. Propose fixes grouped by classification."

**Dead code:**
> "Find all exported functions, components, and constants that have zero imports anywhere in the codebase. Exclude: entry points, Playwright test files, migration files. Produce a list with file path × symbol name × last commit touching it."

**Test coverage:**
> "For every feature in STUB_REGISTRY.md marked Wired, check: does a Playwright E2E test exist for it? Produce a coverage matrix. Flag Wired features with no test as 'Untested-Wired'."

### Audit Queries — PRD-to-Code Alignment

**Three-column discrepancy report:**
> "I want to audit PRD-[X] for code-reality alignment. Please:
> 1. Read PRD-[X] and all its addenda (grep for addendum files mentioning PRD-[X])
> 2. Identify every feature, rule, behavior, and decision the PRD specifies
> 3. For each: find the code implementing it and verify the behavior matches
> 4. Produce a three-column table: PRD specification × Code reality × Status
> 5. Status options: Match / Intentional Improvement (needs PRD update) / Unintentional Drift (needs code fix) / Not Built (needs classification) / Extra in Code Not in PRD (needs evaluation)
> 6. Do not fix anything — just report."

**Batch PRD audit:**
> "Audit PRDs [list]. For each, follow the three-column discrepancy report protocol. Combine into a single report grouped by PRD. Flag any cross-PRD inconsistencies you notice."

### Audit Queries — Cross-PRD Integration

**Addendum honor check:**
> "Every Cross-PRD Impact Addendum specifies integration points between PRDs. For [PRD-X]'s addendum: identify every integration point mentioned, find where each is implemented in code, and verify the integration works as specified. Report honored / stubbed / not implemented."

**Data flow verification:**
> "Trace the data flow for [user action, e.g., 'completing a task that earns a creature']. Follow through every system touched. For each: is the flow as designed? Any leaks, broken links, or unexpected side effects? Report the path and any issues."

### Audit Queries — Cost Optimization (P1-P9)

**Pattern application check:**
> "Read AI-Cost-Optimization-Patterns.md. For each pattern P1-P9, identify every place in the codebase where it should be applied (based on the pattern's description). For each location: is the pattern applied? Produce a per-pattern table."

**Embedding vs LLM call audit:**
> "Find every AI call in the codebase (to OpenRouter, Anthropic, OpenAI, etc.). For each: what is it doing? Could it be replaced with an embedding-based classification or similarity search? Flag candidates for conversion."

**Context loading check:**
> "Find every place context is loaded for an AI call (Supabase queries that feed LiLa, guided mode context, etc.). For each: is it relevance-filtered via pgvector, or bulk-loaded? Flag bulk-loaded contexts for conversion to relevance-filtered."

### Audit Queries — Stub Registry Reconciliation

**Stub state verification:**
> "Read STUB_REGISTRY.md. For every entry marked Wired: find the code, verify the behavior. For every entry marked Stubbed or MVP: find the code, verify it's actually stubbed vs accidentally wired. Report discrepancies."

**MVP classification accuracy:**
> "For every STUB_REGISTRY item marked MVP: is it actually a minimum viable version, or does it exceed/fall short of that? Reclassify each."

### Audit Queries — LiLa Content Discrepancy

**Help pattern reality check:**
> "Find every LiLa help pattern in the codebase (help-patterns files, feature-guide-knowledge files, system prompts referencing features). For each pattern: does the feature, UI element, button name, or flow it references still exist and behave as described? Produce a discrepancy report. Do not fix — just report."

**Feature guide knowledge audit:**
> "Read all feature-guide-knowledge entries. For each: walk through the guide as if executing it. Does every step work as described? Does every referenced UI element exist? Are button names current? Report discrepancies."

### Audit Queries — Performance Baseline

**Load time baseline:**
> "Using Playwright, measure page load times for: /, /dashboard, /tasks, /lists, /studio, /meetings. Report median and p95 across 10 runs per page. Save baseline to PERFORMANCE_BASELINE.md."

**Query performance:**
> "For the top 20 most-executed Supabase queries (by estimated frequency): log execution time. Identify any queries exceeding 200ms. Report candidates for optimization (index adds, query restructure, caching)."

**AI call latency:**
> "For every AI call pattern in the codebase: measure typical latency (mock or real calls). Identify calls exceeding 5s that aren't using streaming. Flag for streaming conversion or model downgrade (Haiku vs Sonnet)."

### /ultrareview Usage (Opus 4.7 feature, Pro/Max, 3 free uses)

**Pre-commit review of a significant change:**
> "/ultrareview — please review the uncommitted changes in this working tree. I'm about to commit. Flag any bugs, design issues, or concerns a careful senior engineer would catch."

**Review of a completed build before sign-off:**
> "/ultrareview — please review the changes introduced in the last [N] commits implementing [feature name]. Report bugs, inconsistencies with the rest of the codebase, and any design decisions that feel off."

**Review of audit Fix Now commits before Gate 1 exit:**
> "/ultrareview — please review all commits since [audit start SHA] that were tagged as Fix Now items. Verify the fixes are complete, don't introduce new issues, and match the original audit finding's intended resolution."

### Auto Mode Protocol (Opus 4.7 feature, Max users)

**Request a plan before enabling auto mode:**
> "I want to enable auto mode for [task description]. Per the gameplan's Auto Mode Protocol, please first produce a written plan: the approach, the files you'll touch, the expected commits, and any assumptions. Don't start work yet — I need to approve the plan first."

**Enable auto mode with safety rails:**
> "Plan approved. You may now enable auto mode for this task. Remember: commit after each logical unit with clear messages, stop and ask if you hit anything outside the plan, produce a summary report at the end, and log the run in AUTO_MODE_LOG.md."

**Request summary report:**
> "Auto mode run complete. Please produce the summary report: what was done, what was skipped and why, any assumptions made, any findings or concerns. Save the report alongside AUTO_MODE_LOG.md."

### Agent Teams & Parallelism (Opus 4.7 multi-agent coordination)

**Request a coordination plan before parallel execution:**
> "I want to use parallel execution for [task description]. Per the gameplan's Section 3.6 Parallelism Protocol, please first produce a coordination plan: what each track/sub-agent will do, scope boundaries (which files each touches), whether this is Mode A (agent teams) or Mode B (parallel sessions), and any shared dependencies. Don't start work yet — I need to approve the plan first."

**Launch agent teams (Mode A) for Phase 2 audit:**
> "Plan approved. As the Opus 4.7 lead, spawn sub-agents to audit the following independent scopes in parallel: [list scopes]. Each sub-agent produces its own findings file. You synthesize into AUDIT_REPORT_v1.md. Ensure consistency across sub-agent outputs. Log the parallel run in PARALLELISM_LOG.md."

**Launch agent teams for Phase 5 Zod pass:**
> "Plan approved. As the lead, spawn sub-agents per subsystem (tasks, lists, widgets, LiLa, etc.) to generate Zod schemas for missing coverage. Review each sub-agent's output for cross-system type consistency before merging. Commit one subsystem at a time with clear messages."

**Launch agent teams for Phase 7 LiLa batch:**
> "Plan approved. As the lead, spawn sub-agents per LILA_KNOWLEDGE_BACKLOG.md entry. Each writes help patterns + feature-guide-knowledge + video links for its assigned feature. You review all output against LiLa voice consistency checklist before commit."

**Pause parallel run on failure:**
> "One of the parallel tracks hit an issue. Per Section 3.6 rule 5, pause all tracks. Produce a status report: which tracks completed, which paused, what the issue is, and whether it might be systemic. I'll decide how to proceed."

**Request parallel run consolidated report:**
> "Parallel run complete. Produce the consolidated report: what each track did, consistency check across outputs, any divergence from the coordination plan, any issues encountered. Save alongside PARALLELISM_LOG.md."

### Wizard Build Queries — Gate 2

**Connection matrix construction:**
> "Build a connection matrix document. Rows: every Tier 1-4 wizard. Columns: every system a wizard could connect to (allowance, opportunity board, routines, gamification, reveals, tracking, calendar, Family Hub, Best Intentions, etc.). Cells: Live / Registered-Inert / Not Applicable. Save as CONNECTION_MATRIX.md."

**Wizard Lego check:**
> "For [wizard name] — verify it exposes every applicable connection point in ConnectionOffersPanel. Check the connection matrix. For any Registered-Inert cells: does the wizard show the 'coming soon when you set up X' copy? For any Live cells: does the connection actually work end-to-end?"

### Video Recording Queries — Gate 3

**Flow selection:**
> "Produce a prioritized list of user flows to record for the video library, per PRD-39 (video library feature decision doc). Group by: Daily-Use (record first), Weekly-Use (record second), Monthly-Use (record third), Occasional (record last)."

**Recording as QA:**
> "Set up Playwright to record [flow name]. Run the recording. If the recording fails or produces an awkward result, identify the bug that caused it. Do not modify test code to paper over UI bugs — find and fix the UI bug, then re-record."

### LiLa Training Queries — Gate 4

**Backlog consumption:**
> "Read LILA_KNOWLEDGE_BACKLOG.md. For the first entry: write help patterns for all listed user phrasings, write feature-guide-knowledge entries, link to the relevant Playwright videos. Verify every reference is accurate against the current codebase. Mark the entry Complete when done."

**Hallucination test:**
> "Run LiLa through this test scenario: [description]. Does she hallucinate any feature, button, flow, or step that doesn't exist? Does she fail to reference the video library where it would help? Report any issues and propose fixes."

---

## Section 5: Appendices

### Appendix A — Remaining PRD Sequence

**Tier A — Foundation / Blocking Other Work:**
- PRD-22 Settings (full UI) — blocks PRD-31
- PRD-28B Compliance & Progress Reporting — ESA positioning, follows PRD-28
- PRD-31 Subscription Tier System (Stripe) — needed for launch, blocked by PRD-02 + PRD-22
- PRD-32/32A Admin Console — blocked by PRD-21A + PRD-34
- PRD-37 Family Feeds — blocked by PRD-09 + PRD-15

**Tier B — Growth & Identity:**
- PRD-05C LiLa Optimizer — blocked by PRD-13
- PRD-11B Family Celebration — PRD-11 extension
- PRD-12A LifeLantern — blocked by PRD-07, PRD-08, PRD-13
- PRD-12B Family Vision Quest — blocked by PRD-12A
- PRD-19 Family Context & Relationships — blocked by PRD-13
- PRD-20 Safe Harbor — blocked by PRD-06, PRD-13, PRD-19

**Tier C — Specialized:**
- PRD-17B MindSweep (Phase B remainder + Phase C)
- PRD-27 Caregiver Tools — blocked by PRD-02, PRD-05
- PRD-29 BigPlans — blocked by PRD-06, PRD-10
- PRD-30 Safety Monitoring — blocked by PRD-06, PRD-15
- PRD-33 Offline / PWA — blocked by all phases
- PRD-38 Blog (Cookie Dough) — blocked by PRD-03
- PRD-10 Phase B/C (remaining tracker types, multiplayer, color reveal, gameboard)
- PRD-14C polish, PRD-14D Phase B, PRD-14E TV Mode
- PRD-23 Phase 1c (drop old tables after 30-day soak)

**Gamification Themes (after Woodland Felt canonical pattern):**
- Pets, Apothecary, Dragons, Pixel Loot

**New PRDs to Create:**
- PRD-39 Playwright Video Library (pre-flight for Gate 3)

### Appendix B — Wizard Build Order (Revised Post-Gate 1)

Per Universal-Setup-Wizards.md + session addendum, ordered by tier:

**Tier 1 (highest priority):**
1. ✅ Universal List Wizard (shipped, tests passing)
2. ⏳ Tally Wizard (universal, 7 steps, highest-leverage remaining)
3. ⏳ Streak Wizard (6 steps, RecurringItemBrowser already built)
4. ⏳ Opportunity Board Wizard (bulk-add-first, multi-category)
5. ⏳ Gamification Setup improvements (surgical, not rebuild)

**Tier 2:**
- Routine Builder kid-focused enhancement
- Maintenance Schedule Wizard (new `maintenance` list_type, list + recurring task hybrid)
- Reward Menu + Treasure Box Wizards
- Best Intentions Wizard
- Guiding Stars Wizard

**Tier 3:**
- Money Wizard (after PRD-28 further along)
- Percentage Wizard
- Mood & Check-In Wizard
- Visual World / Overlay Wizard
- Sequential Path Wizard

**Tier 4 (polish):**
- Connection flows (Phase 3 glue)
- InnerWorkings Wizard
- Archives Wizard
- First-visit detection across all pages
- Supabase draft persistence (only if beta shows need)

### Appendix C — Contingency Plans

**"The audit reveals a fundamental architectural issue"**
Example: wizard state management pattern doesn't scale, or the Lego connection model can't be implemented as designed.

Action: Stop Gate 1. Hold a design session with Claude (planning/PRD) to rethink. Draft a new architectural decision doc. Founder approves. Resume audit with new approach in mind.

**"4.7 is delayed weeks/months"**
Action: Continue with Opus 4.6. 4.6 is genuinely capable of the audit and most wizard builds. Phase 5 (Zod/simplify) can still happen with 4.6 — will be less efficient but not blocked. Video recording (Gate 3) and LiLa training (Gate 4) don't require 4.7 at all.

**"Beta tester validation reveals a wizard is wrong"**
Action: Document the feedback in `BETA_FEEDBACK_LOG.md`. In Gate 2, adjust the wizard design before building additional wizards in the same pattern. If the issue is architectural (affects multiple wizards), pause Gate 2 and revise the design doc.

**"Founder runs out of time / energy mid-phase"**
Action: Commit current work with clear status notes. Update BUILD_STATUS.md with exact pick-up point. The next session starts with "Read MYAIM_GAMEPLAN_v2.2.md and BUILD_STATUS.md to orient." No loss of context.

**"Claude Code makes an unapproved change"**
Action: Per founder conventions — Claude Code should not declare things fixed without showing proof. If an unapproved change lands, revert and re-evaluate. The gate structure protects against this somewhat by requiring explicit founder sign-off at gate exits.

### Appendix D — Files Created By This Gameplan

Files this plan creates or formalizes in the repo:

- `MYAIM_GAMEPLAN_v2.2.md` — this file
- `TOOL_HEALTH_REPORT_2026-04-16.md` — already created April 16, 2026 (pre-Phase 0)
- `RECONNAISSANCE_REPORT_v1.md` — Phase 0.25 output
- `PRD-40-COPPA-Compliance-Parental-Verification.md` — Phase 0.35 output
- `LILA_KNOWLEDGE_BACKLOG.md` — deferred LiLa content tracking (Phase 0.5 forward)
- `AUDIT_REPORT_v1.md` — Phase 2 output (now 8-scope instead of 7)
- `TECH_DEBT_REGISTER.md` — Phase 3 output
- `AUDIT_DECISIONS_EMERGED.md` — design decisions surfaced during audit
- `CONNECTION_MATRIX.md` — Gate 2 artifact
- `PERFORMANCE_BASELINE.md` — Phase 2 output
- `COMPLIANCE_READINESS_REPORT.md` — Phase 2 Scope 8 output
- `BETA_READINESS_REPORT.md` — Beta Readiness Gate output
- `LILA_QUALITY_LOG.md` — Gate 4 tracking
- `LILA_KNOWLEDGE_ARCHIVE.md` — completed LiLa entries
- `BETA_FEEDBACK_LOG.md` — ongoing
- `PRD-39-Playwright-Video-Library.md` — pre-flight for Gate 3
- `AUTO_MODE_LOG.md` — auto mode enablement audit trail (when auto mode is first used)
- `PARALLELISM_LOG.md` — parallel run audit trail (when parallelism is first used)

CLAUDE.md additions:
- Convention #241 (Tooling Hygiene) — already landed April 16, 2026
- Lego / Surge Protector connection architecture convention (Phase 1)
- Gate structure reference ("before advancing a gate, verify exit criteria")
- "Read MYAIM_GAMEPLAN_v2.2.md at session start" instruction
- Auto Mode Protocol reference (when auto mode is first used)
- "Tests pass but doesn't serve need" check as part of feature-done criteria
- COPPA compliance hooks (per PRD-40 when written)

LESSONS_LEARNED.md additions (already landed April 16, 2026):
- "Second Failure Mode: Silent Tool Drift" narrative section
- Quick Reference appendix with 4 named patterns (Windows npm PATH, MCP Silent Disconnect, Auth Token Silent Expiry, Wrapper Reports Success When Tool Didn't Run)
- The "Looks Fine" Failure Pattern synthesis

---

*End of MYAIM_GAMEPLAN_v2.2.md*
