# Audit + Wizard Design — Parallel Work Plan

> **Created:** 2026-04-18
> **Owner:** Tenise
> **Purpose:** Single source of truth coordinating parallel work across Claude Code (VS Code) and Claude.ai (web) during Phase 2 (Audit), Phase 3 (Triage), and Phase 5 (Zod/simplify). Keep all three parties — Tenise, Claude Code, Claude.ai — aligned on what each is doing, when checkpoints happen, and how outputs merge.
> **Supersedes nothing.** This document coordinates execution of `MYAIM_GAMEPLAN_v2.2.md`; it does not change the gameplan itself.

---

## Why We're Doing It This Way

Building more wizards on an un-audited foundation risks compounding the "tests pass but doesn't serve need" gap already flagged in the Universal List Wizard. Opus 4.7 arrived 2026-04-16, which removes the only reason Phase 5 (Zod/simplify) was deferred. Running audit → triage → Zod/simplify before resuming wizard builds means every Tier 1 wizard (Tally, Streak, Opportunity Board, Gamification improvements) ships on a clean, simplified, connection-architecture-locked foundation.

The design work that only Tenise can do (narrative user flows — "Day 1: Sarah sets up Alex's reading tracker") runs **in parallel** on Claude.ai so no time is lost. By the time Gate 1 and Phase 5 complete, flow designs are ready as the spec Phase 4 wizard builds implement against.

---

## Who Does What

### Claude Code (this VS Code session)

**Owns:**
- Phase 2 Architectural Audit — all 8 scopes (code quality, PRD-to-code alignment, cross-PRD integration, cost optimization P1-P9, stub registry reconciliation, LiLa content discrepancy, performance baseline, compliance & safety)
- Phase 3 Triage — producing classification (Fix Now / Fix Next Build / Tech Debt / Intentional / Defer to Gate 4), executing Fix Now items
- Phase 5 Zod/simplify sweep with Opus 4.7
- All code changes, migrations, test updates, Edge Function edits
- PRD doc updates driven by audit findings (for "Intentional — update doc" classifications)
- Updating `.claude/rules/current-builds/` as audit phases transition
- Producing all required deliverable files: `AUDIT_REPORT_v1.md`, `TECH_DEBT_REGISTER.md`, `COMPLIANCE_READINESS_REPORT.md`, `PERFORMANCE_BASELINE.md`

**Does NOT touch during this window** (reserved for founder/Claude.ai ownership):
- [../feature-decisions/Universal-Setup-Wizards.md](../feature-decisions/Universal-Setup-Wizards.md)
- [../feature-decisions/Universal-Setup-Wizards-Session-Addendum.md](../feature-decisions/Universal-Setup-Wizards-Session-Addendum.md)
- Any new `Universal-Setup-Wizards-User-Flows.md` (Claude.ai will draft it; Tenise lands it in repo)
- `src/components/studio/wizards/` — no new wizard code, no wizard refactors (audit/Zod findings touching these get queued but not executed until Phase 4)

### Claude.ai (web project)

**Owns:**
- Narrative user flow design for Tier 1 wizards, then Tier 2 as stretch
- "How does Sarah go from nothing to a configured feature" scenarios, end-to-end
- Preset content drafts (starting titles, framing text, milestone defaults)
- Connection matrix thinking per wizard — which other systems each wizard should offer to wire into
- Surfacing feature gaps discovered during flow design (AUDIT-FLAG items)

**Does NOT produce:**
- Code
- Migration plans
- Specific component architecture (that's in the existing wizard doc — flows reference it, don't rewrite it)
- Bug fixes

**Output format:** See "Flow Design Format" section below.

### Tenise (founder)

**Owns:**
- Reviewing Claude Code's proposed audit investigation order before Phase 2 starts
- Classifying audit findings during Phase 3 triage (founder judgment, not delegable)
- Running Claude.ai flow design sessions — each scenario is a founder-led conversation
- Landing the finished flow doc in the repo at the agreed path (cut/paste from Claude.ai → file creation in Claude Code)
- Go/no-go calls on every gate transition
- Resolving "AUDIT-FLAG" items that surface during flow design — deciding whether they're audit findings, new PRD work, or wizard scope adjustments

---

## Timeline & Checkpoints

Calendar is approximate — pace-dependent. Gameplan estimates are 4-6 active Claude Code days total for Phase 2+3+5, with founder review cycles between. At your March-23-to-April-18 velocity, 1-2 weeks calendar is realistic.

### Week 1 (current)

**Claude Code:**
- [ ] Read the gameplan Phase 2 scope (lines 284-351) and propose investigation order to Tenise
- [ ] Tenise approves approach → Claude Code begins Scope 1 (code quality) + Scope 2 (PRD-to-code alignment)
- [ ] Produce running `AUDIT_REPORT_v1.md` as findings accumulate

**Claude.ai:**
- [ ] Design **Tally Wizard** user flows (3 scenarios minimum)
  - Suggested: "Sarah sets up Alex's reading tracker with allowance tie-in", "Mark adds a water intake tracker for Jordan", "Sarah sets up a family reading race with reward reveal at 20 books"
- [ ] Start draft list of Tally Wizard starting titles (scrollable row of suggestions)

### Week 2

**Claude Code:**
- [ ] Continue audit scopes 3-8 (cross-PRD, cost, stubs, LiLa content, performance, compliance)
- [ ] Scope 8 Compliance is the Beta Readiness Gate driver — flag Scope 8 findings distinctly
- [ ] Deliver complete `AUDIT_REPORT_v1.md` for founder review

**Claude.ai:**
- [ ] Design **Streak Wizard** flows (universal + preset paths)
- [ ] Design **Opportunity Board Wizard** flows (bulk-add-first, multi-category — earning / learning / "I'm bored" / connection)
- [ ] Start drafting preset framing text

### Week 3

**Claude Code:**
- [ ] Phase 3 triage with Tenise — walk findings, classify each
- [ ] Execute Fix Now items, commit per gameplan convention
- [ ] Produce `TECH_DEBT_REGISTER.md`
- [ ] Update relevant PRDs for "Intentional — update doc" classifications

**Claude.ai:**
- [ ] Design **Gamification Improvements** flows (per-segment tracking, task existence checks, surgical — not rebuild)
- [ ] Finish Tier 1 wizard flows
- [ ] Optional stretch: start Tier 2 flows (Routine Builder kid-focus, Maintenance Schedule, Reward Menu, Treasure Box)

**Checkpoint:** Land the wizard flow doc in the repo at `claude/feature-decisions/Universal-Setup-Wizards-User-Flows.md`. Tenise pastes the flow content into a new file; Claude Code reviews the landing for repo hygiene (link formatting, cross-references to the existing wizard doc, etc.). Both Phase 3 completion and flow-doc landing happen this week.

### Week 4

**Claude Code:**
- [ ] Phase 5 Zod/simplify sweep using Opus 4.7
- [ ] Pre-flight: verify `claude-opus-4-7` model, tokenizer calibration check
- [ ] Run Zod coverage audit, close gaps, simplify repeated patterns
- [ ] Small reviewable commits

**Claude.ai:**
- [ ] Polish Tier 2 flow designs
- [ ] Prep: for each Tier 1 wizard, confirm its flow doc has (a) 3+ scenarios, (b) connection matrix filled out, (c) preset content drafted

**Gate 1 Exit:** Tenise explicitly signs off that audit is complete, triage is done, and TECH_DEBT_REGISTER covers deferred items. Gate 2 opens.

---

## Flow Design Format (for Claude.ai output)

Claude.ai produces flows in this shape so they land cleanly in the repo and give Phase 4 wizard builds a clear spec.

### Per wizard, three or more scenarios

Each scenario reads like a short story — named character, specific outcome, end-to-end. Example:

```markdown
## Tally Wizard — Scenario 1: Sarah sets up Alex's reading tracker

**Setup:** Sarah (mom) wants to build a reading tracker for Alex (age 15, Independent shell).
She's decided each finished book earns $0.50 toward his allowance, and at 20 books
he unlocks a reward reveal.

**Flow:**
1. Sarah opens Studio → Trackers & Widgets section. Sees "Reading Log" card.
2. Taps "Customize" → Tally Wizard opens with Reading Log preset.
3. Step 1 "What are you counting?" — title pre-fills "Alex's Reading Goal".
   Unit pre-fills "books". Sarah confirms.
4. Step 2 "Who is this for?" — picks Alex from MemberPillSelector.
5. Step 3 "How does this count up?" — picks "Link to an existing item" →
   browses recurring tasks → picks "Alex's Reading Time" routine step.
   (AUDIT-FLAG: does this routine step exist? If not, how does the wizard
   offer inline creation?)
6. Step 4 "Set a goal" — enters 20 books. Preview shows "When Alex reaches 20
   books, he'll see a celebration!"
7. Step 5 "Pick a look" — picks star_chart (preset default).
8. Step 6 "Add extras" — ConnectionOffersPanel shows:
   - "Count toward allowance?" — toggles ON, enters $0.50/book
   - "Add a reward reveal when goal is reached?" — toggles ON → AttachRevealSection
     inline → picks treasure chest video
9. Step 7 "Review & Deploy" — sees summary, adds tags "reading", "allowance".
   DashboardDeployPicker defaults to Alex's dashboard. Taps Deploy.

**Outcome:** Tracker appears on Alex's Independent dashboard. Each completed reading
session auto-increments the tracker. At 20 books, reward reveal fires. Allowance
period accumulates $0.50 × book count.

**Wizards invoked:** Tally Wizard (primary) + AttachRevealSection (embedded)
**Connections touched:** allowance (PRD-28), reward reveal (PRD-24A), routine step
link (PRD-09A), dashboard deploy (PRD-10)
**Existing code dependencies:** useCreateWidget, MemberPillSelector, AttachRevealSection,
RecurringItemBrowser
**AUDIT-FLAGS:** Step 5 routine-step-doesn't-exist path needs verification
```

### Connection matrix per wizard

After the scenarios, list every connection point the wizard exposes:

```markdown
## Tally Wizard — Connection Matrix

| Connection | Status today | Required by flow | Notes |
|---|---|---|---|
| Allowance (PRD-28) | Wired | Yes | `counts_for_allowance` on widget |
| Reward reveal (PRD-24A) | Wired | Yes | AttachRevealSection embedded |
| Homework hours (PRD-28) | Wired | Optional | `counts_for_homework` |
| Victory (PRD-11) | Wired | Optional | `victory_on_complete` |
| Multiplayer mode (PRD-10) | Wired | Optional | For family reading race scenarios |
| Rhythms (PRD-18) | Wired | Optional | `rhythm_keys` in widget config |
| Routine step link | Wired | Yes | Via RecurringItemBrowser |
| Inline task creation | Not yet wired | Yes (per Scenario 1) | AUDIT-FLAG — needs wizard-internal creation flow |
```

---

## Handoff Rules

### Flow doc → repo landing (one-time, end of Week 3)

- **Path:** `claude/feature-decisions/Universal-Setup-Wizards-User-Flows.md`
- **Format:** Three sections — `# Tier 1 Flows`, `# Tier 2 Flows (in progress)`, `# Shared Patterns`
- **How:** Tenise copies content from Claude.ai → creates file in Claude Code or VS Code → commits with message `docs(wizards): land Tier 1 user flow designs`
- **After landing:** Claude Code picks up AUDIT-FLAG items from the doc and adds them to Phase 3 triage queue

### Audit findings → flow design

If Claude Code's audit surfaces an architectural pattern that affects wizard design (e.g., "the connection matrix approach needs X restructuring"), it gets flagged in `AUDIT_REPORT_v1.md` with a line:

> **Wizard Design Impact:** [description]

Tenise reads these during Phase 3 review, brings relevant ones into her next Claude.ai session for flow adjustments. Not every audit finding affects wizard design — most don't.

### Flow design → audit inputs

When Claude.ai flow design reveals a gap ("to do X the flow needs Y, and Y doesn't exist"), Tenise tags it in the flow doc with:

> **AUDIT-FLAG:** [description]

When the flow doc lands in the repo, Claude Code reads the AUDIT-FLAG items and classifies each as:
- Fix Now (if blocking flow)
- New audit finding (adds to report if audit is still in flight)
- New PRD / addendum item (for Phase 8 backlog)
- Wizard scope adjustment (noted in flow doc, not acted on until Phase 4)

---

## Non-Concurrent Zones

To prevent cross-tool collisions:

**Claude Code WILL NOT touch during this window:**
- [../feature-decisions/Universal-Setup-Wizards.md](../feature-decisions/Universal-Setup-Wizards.md)
- [../feature-decisions/Universal-Setup-Wizards-Session-Addendum.md](../feature-decisions/Universal-Setup-Wizards-Session-Addendum.md)
- `claude/feature-decisions/Universal-Setup-Wizards-User-Flows.md` (new file Claude.ai is drafting)
- `src/components/studio/wizards/` — read-only for audit purposes, no code changes

**Claude.ai is read-only on:**
- `src/` — source code (via repo sync, for reference only)
- `supabase/migrations/` — migrations
- `supabase/functions/` — Edge Functions
- `tests/` — test specs
- Any `.md` file under `claude/` except the three wizard flow docs above

**Neither tool touches during this window:**
- `MYAIM_GAMEPLAN_v2.2.md` — gameplan is read-only until Phase 2 completes
- `CLAUDE.md` conventions — no new conventions added until Phase 1 wizard doc locking (which happens inside this window)

---

## Starting Prompts

### Claude Code (VS Code) kickoff

Tenise pastes this at the start of the audit session:

> "We're starting Phase 2 Architectural Audit per `MYAIM_GAMEPLAN_v2.2.md`. Per `AUDIT_PARALLEL_PLAN.md`, you own the full audit, triage, and Phase 5 Zod/simplify work. Claude.ai is running flow design in parallel — do not touch the three Universal-Setup-Wizards files listed in the non-concurrent zones section, and do not touch `src/components/studio/wizards/`. Propose your investigation order for the 8 audit scopes and show me how you'll structure findings. Do not start auditing until I approve the approach."

### Claude.ai (web) kickoff

Tenise pastes this at the start of each flow design session:

> "We're doing wizard user flow design per `AUDIT_PARALLEL_PLAN.md` in the repo. Claude Code is running the architectural audit in parallel. You're designing narrative scenarios — "Day 1, Sarah wants to X" — for Tier 1 wizards (Tally, Streak, Opportunity Board, Gamification improvements), one at a time. Each flow follows the format in `AUDIT_PARALLEL_PLAN.md` "Flow Design Format" section. Today we're working on [WIZARD NAME]. Please read `claude/feature-decisions/Universal-Setup-Wizards.md` and `Universal-Setup-Wizards-Session-Addendum.md` for the existing wizard spec, then help me draft three scenarios for [WIZARD NAME]. Tag anything that reveals a feature gap as AUDIT-FLAG."

---

## What Success Looks Like

By the end of this window:

- `AUDIT_REPORT_v1.md` exists and is founder-reviewed
- `TECH_DEBT_REGISTER.md` captures all deferred findings
- `COMPLIANCE_READINESS_REPORT.md` feeds into Beta Readiness Gate planning
- `PERFORMANCE_BASELINE.md` is captured
- Phase 5 Zod/simplify sweep has landed, `tsc -b` clean
- `claude/feature-decisions/Universal-Setup-Wizards-User-Flows.md` exists in repo with Tier 1 flows complete
- Every AUDIT-FLAG in the flow doc is classified
- Tenise says "Gate 1 is complete, advancing to Gate 2"
- Phase 4 wizard builds open with a clean codebase AND a clear user-flow spec

What NOT changing during this window:

- No new wizards shipped
- No feature rollouts
- No new PRD builds

This is an intentional pause on user-visible feature work to pay down what accumulated during the first 26 days of the build sprint.
