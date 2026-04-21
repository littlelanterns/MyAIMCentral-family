---
Status: DRAFT — awaiting founder review before dispatch
Stage: C (apply phase)
Scope: 3 + 8b
Drafted: 2026-04-21
Target: Fresh Claude Code session, no prior conversation context
---

# Scope 3+8b Apply-Phase Worker Prompt

> Paste the entire block below (from the first `#` heading through "Proceed.") into a fresh Claude Code session. The worker reads DECISIONS.md + the audit report stubs, emits findings, then commits. Nothing else.

---

You are the Scope 3+8b **apply-phase worker** for the MyAIM Central Phase 2 Architectural Audit. This is a fresh window with no prior conversation context. Your only job is to emit findings into `AUDIT_REPORT_v1.md` exactly as adjudicated in `scope-3-8b-evidence/DECISIONS.md` (commit ac3bbff, APPROVED WITH AMENDMENTS 2026-04-21), then commit.

## Hard guardrails — what you do NOT do

- **Do NOT amend any PRD file** under `prds/` or `prds/addenda/` — PRDs and addenda are read-only for this scope (CLAUDE.md Convention #12).
- **Do NOT modify any source code** under `src/`, `supabase/`, `scripts/`, `tests/`, etc. Findings describe drift; remediation happens in future builds, not this session.
- **Do NOT dispatch sub-agents.** You are a single-pass emitter.
- **Do NOT re-adjudicate any verdict.** Every severity, Beta flag, Resolution tag, and finding title in DECISIONS.md §Synthesis pass is final.
- **Do NOT regenerate the live schema or run migrations.** No DB writes.
- **Do NOT touch non-concurrent zones** per AUDIT_REPORT_v1.md §0: `claude/feature-decisions/Universal-Setup-Wizards*.md`, `src/components/studio/wizards/`.
- **Do NOT amend DECISIONS.md, SYNTHESIS.md, FOUNDER_HANDOFF.md, PLAN.md, or the EVIDENCE_*.md files.** They are historical records.
- **Do NOT archive the `scope-3-8b-evidence/` directory.** Archive is a separate future step per founder's staggered-commit protocol.

## What you DO

Emit 55 findings + 9 Deferred Appendix entries + 16 Beta Readiness entries + 3 process-hygiene Appendix notes into `AUDIT_REPORT_v1.md`, then make one commit. See the task breakdown below.

## Required reading (in this order, before any emission)

1. **`scope-3-8b-evidence/DECISIONS.md`** — the authoritative adjudicated input. Commit ac3bbff. The **§Synthesis pass** section at the end contains the final emission rosters (SCOPE-8b table + SCOPE-3 table + Deferred-to-Gate-4 Appendix table + Appendix C additions). Every title, severity, Beta flag, and evidence pointer you need is there.
2. **`scope-3-8b-evidence/FOUNDER_HANDOFF.md`** — founder verdicts + three structural pushbacks. Load-bearing where DECISIONS.md cites "per FOUNDER_HANDOFF."
3. **`AUDIT_REPORT_v1.md`** §0 (finding schema, line 32) + §3 stub (line 1111) + §8b stub (line 1115) + existing Appendix C table (line 1323).

Do **NOT** re-read the 33 evidence files in `scope-3-8b-evidence/` up front. DECISIONS.md cites the exact EVIDENCE file + seam number for every finding. **Lazy-load** individual evidence files only when you need finding-body detail that DECISIONS.md does not already supply (e.g., specific file:line references, grep hits, quoted addendum text).

Do **NOT** re-read SYNTHESIS.md, PLAN.md, or the individual evidence files for verdict information. DECISIONS.md supersedes them on every count.

## Finding schema (use verbatim per AUDIT_REPORT_v1.md §0 line 32)

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

**All 55 findings in Scope 3+8b have `Founder decision required: N`** — every verdict was adjudicated in FOUNDER_HANDOFF + DECISIONS.md. Do not prompt for further adjudication.

**Wizard Design Impact** — populate `N/A` on all 55 findings unless a specific EVIDENCE_*.md file you lazy-load explicitly flags wizard impact (none of the 33 evidence files did during traversal; it will almost certainly stay `N/A` across the board).

## Emission-tag splitting rule (PLAN §2.2)

- `SCOPE-8b.F{N}` findings emit into **§8b** (line 1115, replacing the "*Not yet started*" stub).
- `SCOPE-3.F{N}` findings emit into **§3** (line 1111, replacing the "*Not yet started*" stub).
- Paired findings cross-reference each other by **ID only** — do not re-describe a paired finding's content; say "cross-ref SCOPE-8b.F11" and stop.
- Cross-references to closed scopes (SCOPE-8a.F1/F3, Scope 5 Finding A, Scope 2 F*, Scope 4 F*) cite by **ID only**.

---

## Task 1 — Emit §8b (13 SCOPE-8b findings)

Replace the stub `*Not yet started. Stage C (merged with Scope 3).*` at AUDIT_REPORT_v1.md line 1115 with the section body described below.

Section header structure:

```
## 8b — Scope 8b: Integration compliance & safety

**Status:** COMPLETE — 13 findings emitted (F1–F13) from Scope 3+8b integration traversal closed 2026-04-21.

**Pattern summary:** Edge Function authorization layer (F1), HITM gate bypasses on non-conversation AI writes (F2, F3), documented user-control mechanisms silently unenforceable (F4), Crisis Override omissions (F5), auto-sweep no-op (F6), `.ics` runtime CHECK violation (F7), GDPR right-to-erasure unenforced (F8), meeting privacy + permission gaps (F9, F10), shift-session bifurcation (F11), messaging safety client-side only (F12), server-side tier enforcement absent (F13). 13 of 13 are Beta Y blockers.

**Ships-together blocks identified during adjudication:**
- F1 + F5 ship in same commit cycle (same `_shared/` directory, same class of fix, both safety substrate).
- F11 sequenced after SCOPE-3.F2 PRD-35 RecurrenceDetails type consolidation (root-cause dependency).
- F1 Mediator Full Picture ships first as proof-of-pattern, remaining 11+1 surfaces follow in tight sequence as one cohesive build.
```

Then emit the 13 findings in F1 → F13 order per the DECISIONS.md §Synthesis pass §"Emission roster — SCOPE-8b" table. For each finding:

- **Title** — copy from the DECISIONS.md roster table.
- **Severity / Beta / Resolution** — copy from the DECISIONS.md roster table.
- **Location** — primary file:line from the EVIDENCE file cited. Lazy-load the EVIDENCE_*.md only if DECISIONS doesn't already supply it. Include secondary cross-references after the primary.
- **Description** — 3–6 sentence summary of the drift pattern. Pull from DECISIONS.md Round N per-decision text (Rounds 4–18) which contains the founder-approved framing. Do NOT invent new framing. For F1, use Round 4 Decision 1 body + the lede-example framing from Pushback A (Round 1): Mediator Full Picture cross-family data leakage as the concrete example in the lede paragraph.
- **Evidence** — one or two specific file:line citations + the EVIDENCE_*.md file path. Lazy-load the EVIDENCE file only if specific line numbers not already in DECISIONS.md.
- **Proposed resolution** — copy the resolution tag(s) verbatim (e.g., "Fix Now (Mediator) + Fix Next Build (remaining 11+1 surfaces)" for F1).
- **Founder decision required: N** (all 13).
- **Wizard Design Impact: N/A** (all 13).
- **Beta Readiness flag: Y** (all 13).

### REQUIRED apply-phase instruction for SCOPE-8b.F4 (Amendment 1)

F4's **Description** field must include the following retrospective footnote verbatim, as the final paragraph of the Description body:

> **Footnote (audit-trail continuity):** PRD-22 `history_retention` was initially triaged as "never built" during pre-synthesis evidence pass; founder adjudication restored it as a specced-but-unwired consumer based on PRD-22 design session 2026-03-19 artifacts. Future evidence passes should treat columns with corresponding PRD spec text as "consumer missing," not "feature never built."

This footnote is Amendment 1's retrospective correction. It MUST appear inside F4's Description. The prospective version of this habit lives in SCOPE-3.F17 (Task 2); do not confuse the two.

### REQUIRED apply-phase instruction for SCOPE-8b.F11 (Amendment 2)

F11's **Description** field must include the following sequencing sentence verbatim, as the final sentence of the Description body (before the evidence paragraph):

> Remediation sequenced after SCOPE-3.F2 PRD-35 RecurrenceDetails type consolidation — that consolidation is the root cause of this bifurcation.

The same sentence ALSO appears in SCOPE-3.F2's Description (Task 2) to carry the dependency from both sides. Verify both sides carry the sentence before committing.

### F1 contributing-surface list

F1's Description must enumerate contributing surfaces at the **PRD level**, not the Edge-Function level. PRD-21's 8 tool Edge Functions (cyrano, higgins_say/navigate, 4 Love Language, gratitude) count as **one** surface; PRD-34's 5 ThoughtSift Edge Functions (board_of_directors, perspective_shifter, decision_guide, mediator, translator) count as **one** surface. Mediator Full Picture (EVIDENCE_prd34 F-B) is a sub-point of the PRD-34 surface but called out separately as the lede example in the opening paragraph of F1's Description.

Use a bulleted list, one bullet per PRD-level surface, per the DECISIONS.md Round 4 "Contributing evidence files" block (which shows PRD-21A folded in per Flag 1 verdict). The contributing-surface list enumerates PRD-15, PRD-17B, PRD-18, PRD-21, PRD-21A (Vault teen-filter), PRD-22, PRD-25, PRD-27, PRD-34 (with Mediator F-B as the elevated sub-point), and PRD-36 — one bullet per PRD, with per-seam EVIDENCE file reference inside the bullet.

---

## Task 2 — Emit §3 (42 SCOPE-3 main-table findings)

Replace the stub `*Not yet started. Stage C (merged with Scope 8b).*` at AUDIT_REPORT_v1.md line 1111 with the section body described below.

Section header structure:

```
## 3 — Scope 3: Cross-PRD integration

**Status:** COMPLETE — 42 findings emitted (F1–F42) from Scope 3+8b integration traversal closed 2026-04-21. 3 Beta Y (F14, F22, F41); 39 Beta N.

**Pattern summary:** Source/enum discipline drift (F1), PRD-35 vocabulary drift + consumer gaps (F2–F4), model-tier registry drift → multi-provider helper (F5), addendum supersession + self-reporting (F6, F7), Lego primitive library (F8), `is_included_in_ai` column-drop (F9), Settings nav entry gaps (F10), stale stub comments + void event dispatch (F11, F12), WIRING convention violation (F13), first-allowance-period gap (F14), three CLAUDE.md convention proposals (F15–F17), per-PRD integration bundles (F18–F42). PRD-19 fixable items take the F39 slot; PRD-19 core infrastructure unbuilt moves to the Deferred-to-Gate-4 Appendix (Task 3).

**Sequencing dependencies to preserve:**
- SCOPE-3.F2 PRD-35 type consolidation must land before SCOPE-8b.F11 PRD-27 shift bifurcation fix.
- SCOPE-3.F9 PRD-14 column-drop must coordinate with SCOPE-8b.F4's wire-the-consumer work on PRD-14D `family_best_intentions.is_included_in_ai` (same convention area, opposite fates).
- SCOPE-3.F6 Build M supersession scope overlaps with PRD-24-family bundles F28/F29/F30 (cross-reference, do not consolidate — founder Flag 2 verdict kept the distinction).
```

Then emit the 42 findings in F1 → F42 order per the DECISIONS.md §Synthesis pass §"Emission roster — SCOPE-3" table. Same per-finding field structure as Task 1:

- Title / Severity / Beta / Resolution from DECISIONS.md roster verbatim.
- Location, Description, Evidence from the corresponding Round N text (Rounds 8–19 cover SCOPE-3 decisions; Rounds 4/6/13 cover split decisions whose §3 half lands here).
- Founder decision required: N (all 42).
- Wizard Design Impact: N/A (all 42).
- Beta Readiness flag: Y on F14, F22 (mild Y), F41; N on everything else.

### REQUIRED apply-phase instruction for SCOPE-3.F2 (Amendment 2 paired side)

F2's **Description** field must include the following sequencing sentence verbatim, as the final sentence of the Description body (before the evidence paragraph):

> PRD-35 spec amendment ships first; then the two `RecurrenceDetails` TypeScript contracts consolidate into one canonical type. SCOPE-8b.F11 PRD-27 shift bifurcation remediation depends on this type consolidation landing first — the `parseRecurrenceDetails` silently-returning-null is the root cause of that bifurcation.

Verify SCOPE-8b.F11's Description carries its paired sentence (see Task 1) before committing.

### REQUIRED framing for SCOPE-3.F8 (Decision 9 reframe per Round 12)

F8's **Description** field must use founder-specified Lego/surge-protector language verbatim:

> Reusable animation/visual primitive library (9+ components) intentionally unassigned to production consumers per Lego/surge-protector architecture (MYAIM_GAMEPLAN v2.2, Phase 1 CLAUDE.md convention addition). Components ship as a primitive library for attachment to Lists, Tasks, Routines, Rewards, Consequences, and other configurable surfaces. Each list/task/routine can be configured with connectors like reward reveals, scratch card reveals, treasure box, sticker charts, tallies that open a reveal every N iterations, etc. — a deliberately configurable library of connection-ready primitives. `GamificationShowcase.tsx` (`/dev/gamification`) serves as the internal preview surface. Production wiring happens incrementally as each consuming feature is built.

Do NOT reframe this as "dead code" or "stubbed components." It is Intentional-Document per founder verdict.

### REQUIRED framing for SCOPE-3.F5 (Decision 7 expanded scope per Round 10)

F5's **Description** must describe the multi-provider `invokeAI()` helper architecture (not just "read model_tier string from DB at runtime"). Include the proposed `lila_guided_modes` column additions (`provider`, `model_id`, `fallback_provider`, `fallback_model_id`, `max_tokens`, `temperature`) and the `_shared/ai-invoke.ts` helper contract, per Round 10 body. Cross-reference SCOPE-4 cost-pattern findings as read-only citation (Scope 4 closed + applied + archived 2026-04-20, Amendment 5 prohibits scope-moves).

### REQUIRED framing for SCOPE-3.F17 (Amendment 1 prospective-only side)

F17's **Description** must scope to the prospective Habit #9 convention proposal only. Do NOT include the retrospective PRD-22 `history_retention` footnote — that lives in SCOPE-8b.F4 (Task 1). State explicitly in F17's body: "Retrospective footnote about the PRD-22 `history_retention` correction lives inside SCOPE-8b.F4's Description per Amendment 1; F17 emits only the forward-looking convention proposal."

---

## Task 3 — Emit §3 Deferred-to-Gate-4 Appendix (9 entries)

After the last F42 finding in §3, append a new subsection:

```
### Deferred-to-Gate-4 Appendix

Integration surfaces that cannot be evaluated because one side of the seam is unbuilt. Not finding-table entries — remediation scope is already captured by the cited closed finding. Amended 2026-04-21 per DECISIONS.md Round 20 + Amendment 3.

| Deferred Surface | Blocking unbuilt PRD | Cross-Ref |
|---|---|---|
| PRD-20 Safe Harbor integrations | PRD-20 unbuilt | SCOPE-8a.F3 |
| PRD-30 Safety Monitoring integrations | PRD-30 unbuilt | SCOPE-8a.F3 |
| PRD-32/32A Admin Console integrations | PRD-32 unbuilt | SCOPE-8a.F1 remediation scope |
| PRD-37/PRD-28B Compliance & Progress Reporting seam | PRD-28B unbuilt | Scope 5 Finding A |
| PRD-40 COPPA consent gating integrations | PRD-40 unbuilt | SCOPE-8a.F1 |
| PRD-41 Runtime ethics enforcement integrations | PRD-41 unauthored | SCOPE-8a.F3 |
| PRD-27 Caregiver Tools integrations (added Round 20 Decision 14) | PRD-27 mostly unbuilt (3 tables, no UI surface) | PRD-27 F-A shift bifurcation remains standalone as SCOPE-8b.F11 (live data gap, not unbuilt-PRD gap); EVIDENCE_prd27 F-B structural consolidation collapses to this Deferred entry |
| PRD-29 BigPlans integrations (added Round 20 Decision 14) | PRD-29 entirely unbuilt | EVIDENCE_prd29 F-A collapsed; cross-ref SCOPE-3.F32 + F13 (stub-socket WIRED) |
| PRD-19 Family Context & Relationships core infrastructure (added Amendment 3) | PRD-19 mostly unbuilt (4 core tables absent, no UI entry) | EVIDENCE_prd19 F-B; PRD-19 fixable integration items are SCOPE-3.F39 in main §3 finding table |
```

**Note for the worker:** This Appendix is NOT counted in the 42-finding main-table roster. PRD-19 fixable items (F39) stay in the main table; PRD-19 core infrastructure unbuilt lives only in this Appendix. Do not create an F39a/F39b split in the main table.

---

## Task 4 — Append 16 entries to existing Appendix C (Beta Readiness index)

The existing table starts at AUDIT_REPORT_v1.md line 1325. Append 16 new rows to the existing 4-column schema: `Finding ID | Scope | Title | Notes`.

Map each SCOPE-8b/SCOPE-3 Beta-Y finding per the DECISIONS.md §Synthesis pass §"Appendix C" table. For the **Notes** column, use the "Beta Y source" text from the DECISIONS.md table as the Notes content (e.g., for SCOPE-8b.F1: "Cross-tenant data leakage + paid-AI cost amplification + teen-visible cross-tier content").

Rows to append (16 total, in this order):

1. `| SCOPE-8b.F1 | 3+8b | Authenticate-not-authorize (13 surfaces including PRD-21A Vault teen-filter) | Cross-tenant data leakage + paid-AI cost amplification + teen-visible cross-tier content |`
2. `| SCOPE-8b.F2 | 3+8b | HITM PRD-21 communication_drafts | AI output persisted without review |`
3. `| SCOPE-8b.F3 | 3+8b | HITM PRD-34 board_personas | Hallucinated personas amortize cross-family |`
4. `| SCOPE-8b.F4 | 3+8b | Pattern 1D user-control enforcement (5 surfaces) | Trust-violation compounding |`
5. `| SCOPE-8b.F5 | 3+8b | Crisis Override missing (3 Edge Functions) | Convention #7 non-negotiable |`
6. `| SCOPE-8b.F6 | 3+8b | PRD-17B auto-sweep no-op | Marquee ADHD-mom use case non-viable |`
7. `| SCOPE-8b.F7 | 3+8b | PRD-14B .ics CHECK violation | Runtime DB error on marquee import |`
8. `| SCOPE-8b.F8 | 3+8b | PRD-22 GDPR deletion unenforced | Compliance + child-data cascade |`
9. `| SCOPE-8b.F9 | 3+8b | PRD-16 meeting impressions privacy | Couple-tester privacy leak |`
10. `| SCOPE-8b.F10 | 3+8b | PRD-16 dad permission gate absent | Cross-parent access violation |`
11. `| SCOPE-8b.F11 | 3+8b | PRD-27 shift bifurcation | 2 live rows; Special Adult permission cascade; sequenced after SCOPE-3.F2 |`
12. `| SCOPE-8b.F12 | 3+8b | PRD-15 messaging safety (4 sub-surfaces) | Client-side-only safety semantics |`
13. `| SCOPE-8b.F13 | 3+8b | PRD-31 server-side tier enforcement absent | 47 Edge Functions ungated |`
14. `| SCOPE-3.F14 | 3+8b | PRD-28 first allowance_period row never created | Allowance non-operational at first-use |`
15. `| SCOPE-3.F22 | 3+8b | Play shell Fun-tab 404 | (mild Y — 1-line fix) |`
16. `| SCOPE-3.F41 | 3+8b | PRD-21A MemberAssignmentModal broken write | High — permissions don't persist |`

**Also update the "Open Beta Readiness blockers" tally** (currently reads "Open Beta Readiness blockers (6): SCOPE-8a.F1, F2, F3, F5, F6, SCOPE-4.F4.") at AUDIT_REPORT_v1.md line 1336. Amend the opening number from `(6)` to `(22)` and append the 16 new finding IDs in the comma-separated list **in the same order as the Appendix C table rows: SCOPE-8b.F1 through F13, then SCOPE-3.F14, F22, F41**. Keep the subsequent non-Beta enumeration unchanged.

---

## Task 5 — New Appendix E (process-hygiene observations)

After the existing Appendix D (Cleanup Actions, line 1315) and before the existing "Stage A progress log" section (line 1340), insert:

```
## Appendix E — Process-hygiene observations (Scope 3+8b global-addenda traversal)

Three process-hygiene observations from the Scope 3+8b EVIDENCE_global-addenda pattern pass, recorded as Appendix notes rather than findings per DECISIONS.md Round 19 + SYNTHESIS §9 note #5.

1. **Addendum supersession tagging.** When a build supersedes a pre-build addendum's architecture, the affected addendum should carry a `> **Superseded by Build X YYYY-MM-DD — see .claude/completed-builds/YYYY-MM/build-X-*.md**` tag at the top or at the affected section. PRD-24 family addenda (PRD-24, PRD-24A, PRD-24B) predate Build M 2026-04-13 and do not carry this tag; remediation captured as SCOPE-3.F6.

2. **Addendum completion-fact verification.** When an addendum asserts a feature/table/column is "completed" or "wired," the assertion should be verified against live schema + code on the date the addendum is finalized, with a `> **Verified against code on YYYY-MM-DD**` marker. PRD-21C addendum L196, PRD-24 addendum, and PRD-29 addendum all assert completion facts that live schema or code contradicts; remediation captured as SCOPE-3.F7.

3. **Addendum stub-socket language discipline.** When an addendum refers to an in-progress integration socket (a column or table that exists but has no live writer/consumer), the addendum must NOT label it "WIRED" per WIRING_STATUS.md L3 convention ("If it doesn't work in the app, it is not wired"). PRD-29 addendum L94–98 labels `tasks.source='project_planner'` + `tasks.related_plan_id` stub sockets as "WIRED" despite no writer code existing; remediation captured as SCOPE-3.F13. Related forward-looking convention proposal captured as SCOPE-3.F17 (prospective Habit #9).

These are documentation hygiene observations, not integration defects. The corresponding remediations (F6, F7, F13, F17) are logged as findings per normal §3 emission.
```

---

## Cross-reference discipline (critical)

While drafting finding bodies, use **ID-only** citations for anything closed. Do NOT re-describe closed-scope content. Examples of correct usage:

- "Cross-ref SCOPE-8a.F1 (PRD-40 COPPA unbuilt)." ← correct
- "Cross-ref SCOPE-8a.F1, which describes the entirely-unbuilt COPPA consent gating infrastructure including the under-13 family_member insert precondition at FamilySetup.tsx:276..." ← WRONG (re-describing)
- "Cross-ref Scope 5 Finding A (PRD-28B unbuilt)." ← correct
- "Cross-ref Scope 2 batch findings across the 28 PRD surfaces (SCOPE-2.F1 through SCOPE-2.F70) per relevant emission." ← correct
- "Cross-ref SCOPE-4.F1 (MindSweep embedding-first 100% Haiku) and SCOPE-4.F4 (Board of Directors cache tenancy)." ← correct as read-only citation, no reopening

Paired findings within Scope 3+8b itself (e.g., SCOPE-3.F2 ↔ SCOPE-8b.F11) use the same ID-only discipline but MUST carry the sequencing sentence on both sides per Amendment 2.

---

## Order of operations

Execute tasks in this exact order to minimize file-state churn and merge-conflict risk:

1. Read DECISIONS.md fully (commit ac3bbff, APPROVED WITH AMENDMENTS). Confirm you see Rounds 1–20 + Synthesis pass + Sign-off with 5 amendments + 2 flag verdicts.
2. Read FOUNDER_HANDOFF.md — confirm you understand the three pushbacks.
3. Read AUDIT_REPORT_v1.md §0, §3, §8b, Appendix C, Appendix D in full (lines 1–100 for schema; lines 1100–1355 for the target sections).
4. Execute **Task 1 (emit §8b)** — single Edit replacing line 1115 stub with full §8b body.
5. Execute **Task 2 (emit §3)** — single Edit replacing line 1111 stub with full §3 body, including the Deferred-to-Gate-4 Appendix (Task 3) as the final subsection under §3 after F42.
6. Execute **Task 4 (append to Appendix C)** — one Edit to append 16 rows to the existing table, one Edit to update the "Open Beta Readiness blockers (6)" tally to (22).
7. Execute **Task 5 (new Appendix E)** — one Edit inserting the new appendix between Appendix D and the Stage A progress log.
8. Verify: both Amendment 1 footnote (inside F4) and Amendment 2 sequencing sentence (inside both F2 and F11) are present.
9. Run `git status` and `git diff --stat` to confirm exactly one file changed (`AUDIT_REPORT_v1.md`), no other files.
10. Commit.

## Commit protocol

One commit, one file changed. Commit message verbatim:

```
docs(audit): apply Scope 3+8b findings — 13 SCOPE-8b + 42 SCOPE-3 + 9 Deferred Appendix + 16 Beta Readiness entries
```

Do NOT push. Do NOT archive the evidence directory. Do NOT touch any other branch. Founder handles push + archive separately per staggered-commit protocol (~30min offset from any concurrent AUDIT_REPORT commit).

## First message back to founder (required before emitting)

Before executing Task 1, report in one message:

1. Confirmation you have read DECISIONS.md commit ac3bbff and can cite the final emission counts (13 SCOPE-8b + 42 SCOPE-3 + 9 Deferred + 16 Beta C + 3 Appendix E notes).
2. Confirmation you understand the two embedded apply-phase instructions (F4 retrospective footnote, F11 + F2 paired sequencing sentence).
3. Confirmation of section placement: §8b body replaces line 1115 stub, §3 body replaces line 1111 stub, Deferred Appendix is a `### Deferred-to-Gate-4 Appendix` subsection under §3 after F42, Appendix C table gets 16 appended rows (existing 4-column schema), Appendix E is new and sits between Appendix D and Stage A progress log.
4. Any remaining ambiguity you need resolved. If none: say "Ready to emit. Proceed?" and wait for founder's go-ahead.

Do NOT begin Task 1 until founder confirms "proceed."

## Success criteria (self-check before committing)

- [ ] Exactly one file modified: `AUDIT_REPORT_v1.md`.
- [ ] §3 contains 42 findings (F1–F42 sequential, no F39a/F39b).
- [ ] §8b contains 13 findings (F1–F13 sequential).
- [ ] Deferred-to-Gate-4 Appendix under §3 lists 9 entries (PRD-20, PRD-30, PRD-32/32A, PRD-37/PRD-28B, PRD-40, PRD-41, PRD-27, PRD-29, PRD-19 core).
- [ ] Appendix C table grew by 16 rows; "Open Beta Readiness blockers" tally updated from (6) to (22) with the 16 new IDs appended.
- [ ] New Appendix E exists between Appendix D and Stage A progress log, contains exactly 3 numbered process-hygiene observations.
- [ ] SCOPE-8b.F4 Description contains the retrospective footnote verbatim.
- [ ] SCOPE-8b.F11 Description contains the sequencing sentence verbatim.
- [ ] SCOPE-3.F2 Description contains the paired sequencing sentence verbatim.
- [ ] SCOPE-3.F17 Description explicitly states it is prospective-only and cross-refs F4 for the retrospective footnote.
- [ ] SCOPE-3.F8 Description uses the founder-specified Lego/surge-protector language verbatim.
- [ ] SCOPE-3.F5 Description describes the multi-provider `invokeAI()` expansion, not just the original model-tier-read-from-DB framing.
- [ ] SCOPE-8b.F1 Description lists 13 contributing surfaces with Mediator (EVIDENCE_prd34 F-B) as the lede example.
- [ ] All 55 finding bodies use the AUDIT_REPORT_v1.md §0 schema verbatim (Severity / Location / Description / Evidence / Proposed resolution / Founder decision required: N / Wizard Design Impact: N/A / Beta Readiness flag: Y|N).
- [ ] No PRD files modified. No source code modified. No evidence files modified. No migrations run. No archives moved.
- [ ] Commit message is verbatim: `docs(audit): apply Scope 3+8b findings — 13 SCOPE-8b + 42 SCOPE-3 + 9 Deferred Appendix + 16 Beta Readiness entries`.

Proceed.
