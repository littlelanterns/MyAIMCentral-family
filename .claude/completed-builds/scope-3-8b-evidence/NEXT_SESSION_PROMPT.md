---
Purpose: Self-contained startup prompt for the fresh Scope 3+8b orchestrator session that will populate DECISIONS.md and draft the apply-phase worker prompt.
Written: 2026-04-21 by outgoing orchestrator (context nearly exhausted)
---

# Fresh Session Startup Prompt — Scope 3+8b Orchestrator Continuation

Paste this into a new Claude Code session in the `MyAIMCentral-family` project directory. Everything the session needs is already on disk.

---

You are the Scope 3+8b orchestrator for the MyAIM Central Phase 2 audit. This is a fresh window with no prior conversation context. The evidence-gathering and synthesis phases are COMPLETE. The founder has adjudicated all 15 decisions. Your job is to:

1. Populate `scope-3-8b-evidence/DECISIONS.md` with per-decision Round entries reflecting founder verdicts.
2. Draft the apply-phase worker prompt (to be dispatched in a fresh worker window that will emit findings into AUDIT_REPORT_v1.md §3 + §8b + Appendix C).
3. Do NOT dispatch the apply-phase worker yet — hand the drafted prompt back to the founder for review before dispatch.
4. After apply-phase commits, archive `scope-3-8b-evidence/` to `.claude/completed-builds/scope-3-8b-evidence/`.

## Required reading (in this exact order)

1. **`scope-3-8b-evidence/FOUNDER_HANDOFF.md`** — IN FULL. This is the authoritative document. Every founder verdict is here. Three structural pushbacks reshape the synthesis before decision-by-decision verdicts apply.

2. **`scope-3-8b-evidence/SYNTHESIS.md`** — §0 (traversal summary), §6 (decision prompts context), §7 (apply-phase emission tables — TO BE REGENERATED per founder verdicts). Skim §1–§5 for pattern context; FOUNDER_HANDOFF is authoritative where it contradicts.

3. **`scope-3-8b-evidence/PLAN.md`** — §2.2 emission-tag decision table, §4 finding schema, §8 handoff to apply-phase, §10 success criteria.

4. **`scope-3-8b-evidence/DECISIONS.md`** — standing rules (#1-#9) + Round 0 Deferred-to-Gate-4 table that needs PRD-27 + PRD-29 added per Decision 14.

5. **`AUDIT_REPORT_v1.md`** §0 methodology + finding schema + §3 + §8b stubs (currently empty, awaiting apply-phase).

6. **Skim all 33 evidence files** in `scope-3-8b-evidence/EVIDENCE_*.md` only as needed when cross-referencing findings. Do NOT re-read all 33 cover-to-cover — FOUNDER_HANDOFF + SYNTHESIS cite specific seams and evidence files with line anchors.

## Your tasks, in order

### Task 1 — Populate DECISIONS.md rounds

Per PLAN §4.2 and the adjudication log format (modeled on `.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md`), add one `## Round N` heading per adjudicated decision. Rounds 1–15 correspond to founder Decisions 1–15 in FOUNDER_HANDOFF. Each Round entry captures:

- **Date:** 2026-04-21
- **Pattern / Surface:** short title
- **Founder verdict:** verbatim from FOUNDER_HANDOFF
- **Severity + Beta Readiness flag**
- **Resolution tag** (Fix Now / Fix Next Build / Tech Debt / Intentional-Update-Doc / Intentional-Update-PRD / Deferred-to-Gate-4)
- **Contributing evidence files** with seam numbers
- **Remediation sequencing notes** where applicable (Decision 1+4 ship together; Decision 6 + PRD-27 F-A sequencing)
- **Emission list** — final SCOPE-3.F{N} and SCOPE-8b.F{N} finding titles this round produces

Also add:
- **Round 16** — Pushback A consolidation documentation (F1+F2 merge)
- **Round 17** — Pushback B split documentation (Pattern 2A + PRD-14B standalone)
- **Round 18** — Pushback C restoration documentation (`history_retention` in Pattern 1D)
- **Round 19** — Post-Audit Recommendations #1, #2, #3 (founder chose C-both on all three)
- **Round 20** — Round 0 Deferred table amendment (PRD-27 + PRD-29 added)
- **Synthesis pass section** — reflect that Option A pattern-grouped synthesis was used; cite SYNTHESIS.md as the walk-through artifact; note this is the first Scope to use single-session pattern-level adjudication

### Task 2 — Regenerate emission tables

In DECISIONS.md "Synthesis pass" section (or a new §Emission Roster section), produce the final numbered finding list. Expected counts per FOUNDER_HANDOFF:

- **SCOPE-8b:** 14 findings (F1+F2 merged)
- **SCOPE-3:** ~35–40 findings post-consolidation

Number SCOPE-8b.F1 through SCOPE-8b.F14 and SCOPE-3.F1 through SCOPE-3.F{N} sequentially. For each, specify:

- Short title
- Severity (Blocking / High / Medium / Low)
- Beta Readiness flag (Y/N)
- Resolution tag
- Location (file:line OR cross-ref to evidence file)
- Primary contributing evidence file(s)
- Remediation sequencing notes where applicable

Use FOUNDER_HANDOFF "Apply-phase worker input checklist" as the ground truth for what each finding contains.

### Task 3 — Draft the apply-phase worker prompt

A separate worker will take this prompt and write findings into `AUDIT_REPORT_v1.md`. The prompt must be self-contained (the worker will be in a fresh window with no prior context). Include:

1. **Worker role:** apply-phase emission for Scope 3+8b findings into AUDIT_REPORT_v1.md §3 and §8b.
2. **Required reading:** DECISIONS.md (newly populated), FOUNDER_HANDOFF, AUDIT_REPORT_v1.md §0 methodology, all 33 evidence files in scope-3-8b-evidence/ (can lazy-load as needed per finding).
3. **Finding schema per PLAN §2.1** — identical to AUDIT_REPORT §0 schema:
   ```
   ### [SCOPE-N.FN] Short title
   - Severity: Blocking | High | Medium | Low
   - Location: file:line or PRD/addendum reference
   - Description: What the code does vs what the PRD/spec says vs what STUB_REGISTRY/WIRING_STATUS claims
   - Evidence: specific quote, grep hit, or query result (cite evidence file seam number)
   - Proposed resolution: Fix Now | Fix Next Build | Tech Debt | Intentional-Update-Doc | Defer-to-Gate-4
   - Founder decision required: Y/N (N for all — adjudicated in FOUNDER_HANDOFF)
   - Wizard Design Impact: (populated only when relevant)
   - Beta Readiness flag: Y/N
   ```
4. **Splitting rule:** SCOPE-3.F{N} findings emit into §3; SCOPE-8b.F{N} findings emit into §8b. Cross-references between paired findings preserved.
5. **Appendix C (Beta Readiness index)** regenerated with ~17 Scope 3+8b Y-flagged entries (14 SCOPE-8b + 3 SCOPE-3 Y — specifically PRD-14B .ics, PRD-28 first allowance_period, PRD-21A MemberAssignmentModal broken write).
6. **Cross-references to closed findings:** SCOPE-8a.F3 (Safe Harbor + PRD-30 unbuilt), SCOPE-8a.F1 (Admin Console unbuilt), SCOPE-5 Finding A (PRD-28B unbuilt), Scope 2 SCOPE-2.F22/F23/F67/F68/F18 and others — cite by ID, do not re-describe content.
7. **Post-Audit Recommendations #1, #2, #3** — emit as Intentional-Update-CLAUDE-md findings per founder's C-both choice (emit in audit trail + note that dedicated CLAUDE.md convention session will draft the canonical text).
8. **Appendix notes** — global-addenda process-hygiene recommendations per SYNTHESIS.md §9 note #5 (not standalone findings).
9. **Commit message:** `docs(audit): apply Scope 3+8b findings — 14 SCOPE-8b + ~35-40 SCOPE-3 + 3 CLAUDE-md convention proposals`.
10. **Do NOT** dispatch the apply-phase worker yet. Hand the drafted prompt back to founder for review first.

### Task 4 — Await founder approval, then dispatch apply-phase

After founder reviews and approves the apply-phase prompt:
- Dispatch it as a background Agent call (model: "opus", run_in_background: true)
- Await completion notification
- Verify emissions landed in `AUDIT_REPORT_v1.md` §3 + §8b + Appendix C
- Report status back to founder with: file count, finding count, commit SHA

### Task 5 — Archive

After apply-phase commits and founder confirms:
- `git mv scope-3-8b-evidence/ .claude/completed-builds/scope-3-8b-evidence/`
- Commit: `chore(audit): archive Scope 3+8b evidence — traversal + synthesis + apply complete`
- Push per founder protocol (stagger ~30min from any concurrent Scope 4 apply-phase commit to avoid AUDIT_REPORT_v1.md merge conflict)

## What NOT to do

- Do NOT re-read SYNTHESIS.md cover-to-cover. It's a draft superseded by FOUNDER_HANDOFF on ~20 points.
- Do NOT re-dispatch any evidence workers. All 28 traversable surfaces + 4 Deferred stubs + 1 global-addenda stub are persisted.
- Do NOT edit existing EVIDENCE_*.md files. They are frozen per the Provenance headers.
- Do NOT start apply-phase without founder review of the drafted prompt.
- Do NOT amend PRDs or source code in this scope. The audit records findings; remediation happens in later builds.

## State snapshot (as of 2026-04-21 handoff)

- **33 evidence files on disk** in `scope-3-8b-evidence/`:
  - 28 traversable surface evidence files (PRD-08, PRD-14, PRD-14B, PRD-14D, PRD-15, PRD-16, PRD-17B, PRD-18, PRD-19, PRD-21, PRD-21A, PRD-21C, PRD-22, PRD-23, PRD-24, PRD-24A, PRD-24B, PRD-25, PRD-26, PRD-27, PRD-28, PRD-29, PRD-31, PRD-34, PRD-35, PRD-36, + 2 multi-PRD PRD-09A/09B)
  - 4 Deferred-to-Gate-4 stubs (PRD-20, PRD-30, PRD-32/32A, PRD-37/PRD-28B)
  - 1 global-addenda stub
- **SYNTHESIS.md on disk** (draft, ~1200 lines, now superseded on ~20 points by FOUNDER_HANDOFF)
- **FOUNDER_HANDOFF.md on disk** (authoritative, adjudication complete)
- **This file (NEXT_SESSION_PROMPT.md) on disk** for continuity
- **DECISIONS.md** — Round 0 + standing rules only. Needs 15+ adjudication rounds populated.
- **AUDIT_REPORT_v1.md §3 and §8b** — empty stubs awaiting apply-phase.

## Headline numbers (from FOUNDER_HANDOFF)

- **14 SCOPE-8b findings** (1 Blocking F11 consolidation, 2 Blocking Crisis Override, rest High)
- **~35-40 SCOPE-3 findings** post-consolidation
- **17 Beta Readiness index entries** to Appendix C
- **3 CLAUDE.md convention proposals** (Lego connector documentation, AI model registry, addendum-writing habit #9)
- **Most severe finding:** consolidated F11 `authenticateRequest without authorize` — Blocking — cross-family data leakage via Mediator Full Picture
- **3 Fix-Now candidates:** PRD-14B .ics CHECK (1-line migration), PRD-27 shift bifurcation (one file-pair change, sequenced after Decision 6), PRD-21A MemberAssignmentModal (dropped column writes)

## Your first message to founder

Upon starting, read FOUNDER_HANDOFF + SYNTHESIS §0 + §7 + DECISIONS.md standing rules, then report:

1. Confirm you've ingested the handoff cleanly.
2. Propose your population plan for DECISIONS.md (rounds 1–15 + 5 amendment rounds).
3. Ask founder whether to populate DECISIONS.md AND draft apply-phase prompt in the same session, or split across two sessions.

Proceed.
