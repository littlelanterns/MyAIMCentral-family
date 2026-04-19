# Scope 5 Stub Reconciliation — Operation Plan

> **Status:** ACTIVE — pilot complete (2026-04-19); overnight parallel dispatch pending founder approval.
> **Author:** Tenise (founder) with Claude Code support.
> **Created:** 2026-04-19.
> **Parent audit:** Phase 2 Architectural Audit — `AUDIT_REPORT_v1.md`.
> **Lifecycle target:** Move to `.claude/completed-builds/` when Scope 5 completes (see §13 below).
> **Expected completion condition:** All four evidence files show `PARTITION COMPLETE`; reconciliation draft (`STUB_REGISTRY_RECONCILIATION_DRAFT.md`) exists; founder has reviewed all contradiction and ambiguous entries; a commit updating the real `STUB_REGISTRY.md` has landed.

---

## 1 — Goal

Verify the accuracy of `STUB_REGISTRY.md` by producing observational evidence packets for every entry (~224 total; 5 processed in pilot, 219 remaining). Four parallel Claude Code sessions divide the work by domain partition. Each session writes to its own evidence file. No verdicts, no code changes, no registry edits, no cross-session coordination during the run — evidence only. Morning synthesis merges the four evidence files into a reconciliation draft for founder review, after which the real `STUB_REGISTRY.md` is updated in a single commit and this operation plan is archived.

This is NOT a fix-it operation. It is a measurement operation. Every discrepancy surfaced becomes data for the Phase 2 audit report and the Phase 3 remediation plan — but remediation happens later, outside the scope of this operation.

---

## 2 — Operation architecture

**Four parallel sessions.** Each is a Claude Code lead instance working on one domain partition. Leads MAY spawn sub-agents within their session if it helps them process their partition (via the Agent tool with `general-purpose` subagent type; `Explore` cannot Write so is unsuitable for evidence-file output). Sub-agents must follow the same recipe and forbidden actions, and their output feeds back into the lead's single evidence file — sub-agents do NOT write evidence files directly.

**No cross-session coordination during the run.** Each session is self-contained. If one session fails, the other three continue. Parallel safety is provided by (a) per-partition output files (no write contention) and (b) the registry integrity check (any session that detects registry drift halts itself without affecting peers).

**Morning synthesis is a separate fifth session.** After all four partition sessions show `PARTITION COMPLETE`, a new Claude Code session reads all four evidence files, produces `STUB_REGISTRY_RECONCILIATION_DRAFT.md`, walks the contradictions and ambiguous entries with the founder, and lands the final `STUB_REGISTRY.md` update + operation archive as its last actions.

---

## 3 — Partition assignments

| Session | Partition | Partition file | Output file | Entry count | Calibration entry |
|---|---|---|---|---|---|
| Session 1 | Schema remainder (pilot processed 5) | `scope-5-evidence/stub_partition_schema.md` | `scope-5-evidence/STUB_REGISTRY_EVIDENCE_SCHEMA.md` — **APPEND to existing pilot output; do NOT overwrite** the 5 packets already there | 43 remaining | **Line 494 — Sequential advancement modes** (see §9). Process calibration first, pause for founder review, then process the other 42 entries starting at 469. |
| Session 2 | Edge Functions | `scope-5-evidence/stub_partition_edge_functions.md` | `scope-5-evidence/STUB_REGISTRY_EVIDENCE_EDGE_FUNCTIONS.md` | 9 | Line 497 `curriculum-parse` Edge Function |
| Session 3 | UI | `scope-5-evidence/stub_partition_ui.md` | `scope-5-evidence/STUB_REGISTRY_EVIDENCE_UI.md` | ~120 | Line 433 Sequential collection creation (end-to-end) |
| Session 4 | Cross-cutting | `scope-5-evidence/stub_partition_crosscutting.md` | `scope-5-evidence/STUB_REGISTRY_EVIDENCE_CROSSCUTTING.md` | ~55 | Line 493 `createTaskFromData` guard for `taskType='sequential'` |

UI is the long pole. Sessions 2 and 1 will likely complete first (Edge Functions smallest; Schema remainder inherits validated recipe). Session 4 is heaviest in ambiguity (expect 30-50% of crosscutting packets to resolve as CAPABILITY-ONLY).

---

## 4 — Integrity check protocol

**Baseline:** `STUB_REGISTRY.md` has 547 lines. Last-modifying commit: `c2e04e3` (2026-04-17 22:24 — "chore(phase-0.26-s3.5): mark _requestingMemberId wiring complete in STUB_REGISTRY").

**Check:** Every session runs `wc -l STUB_REGISTRY.md` via Bash at session start AND between every entry. Expected output is `547 STUB_REGISTRY.md`.

**On drift:** If the count is anything other than 547:
1. Stop immediately. Do not process any more entries.
2. Write to the evidence file:
   ```
   ## HALTED — REGISTRY CHANGED MID-RUN (expected 547 lines, got <M>)
   <ISO timestamp>
   <N entries completed before halt>
   ```
3. Exit. Do not attempt to reconcile.

The founder resolves the registry state before re-dispatching.

---

## 5 — HALT file mechanism

**Purpose:** single-command shutdown of all four sessions without having to alt-tab through four VS Code windows.

**Spec:**
- The file `HALT` at repo root (`c:/dev/MyAIMCentral-family/MyAIMCentral-family/HALT`) is the signal.
- Every session checks for `HALT` via Bash (`[ -f HALT ]` or equivalent) at session start AND between every entry (same cadence as the integrity check).
- On detection:
  1. Stop immediately. Do not process any more entries.
  2. Write to the evidence file:
     ```
     ## HALTED — HALT file detected
     <ISO timestamp>
     <N entries completed before halt>
     ```
  3. Exit gracefully. Do not delete the `HALT` file.
- The founder deletes the `HALT` file before re-dispatching any sessions.

If a session aborts for any reason OTHER than `HALT` or registry drift (tool error, context pressure, session timeout), it still writes a `## HALTED AT ENTRY <N>` marker before exiting.

---

## 5b — Plan and recipe frozen during the run

While sessions are actively processing, the following files are FROZEN — no edits to any of them during the run:

- `scope-5-evidence/EVIDENCE_RECIPE.md`
- `scope-5-evidence/stub_partition_*.md` (all four)
- `claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md` (this file)
- `claude/web-sync/SCOPE_5_KICKOFF_PROMPTS.md`

The plan and recipe are the contract sessions are executing against. Packets produced against recipe-v1 and packets produced against recipe-v2 cannot be synthesized coherently — the founder would not know which packet follows which rules.

If a recipe gap surfaces mid-run (a session hits an entry shape the recipe doesn't handle cleanly, or a forbidden-action loophole is discovered, or the approval-message protocol turns out to have ambiguity):

1. Founder touches `HALT` at repo root. All four sessions halt on their next integrity check and write clean `## HALTED — HALT file detected` markers.
2. Founder edits the recipe, partition, or plan as needed. Change is documented in this plan file by appending a `## Amendments during run` section with date + change summary + rationale.
3. Edit committed with message `chore(scope-5): mid-run recipe/plan amendment — <summary>`. Push.
4. Founder deletes `HALT`.
5. Sessions are re-dispatched with fresh kickoff prompts referencing the amended files. Partition evidence files continue to accumulate (pre-amendment packets remain — the `## Amendments` note in the plan tells the synthesis session which recipe version each packet was produced against).

Why this discipline parallels the registry integrity check: the registry is a contract between packets and their claimed source of truth. The recipe + plan + partitions are a contract between sessions and their instructions. Both contracts must be version-stable during a run, or evidence quality degrades silently.

## 6 — Forbidden actions (hard rules)

A session executing this operation MUST NOT:

1. **Write to or edit `STUB_REGISTRY.md`.** Read-only for the entire operation.
2. **Edit any source code.** No writes to `src/**`, `supabase/**`, `tests/**`, `specs/**`, `prds/**`. Reading is fine; writing is not.
3. **Run any state-modifying git operation.** No `git add`, `git commit`, `git push`, `git checkout`, `git stash`, `git reset`. Read-only git (`git log`, `git show`, `git diff`, `git status`) is allowed for evidence gathering.
4. **Reach a verdict.** No packet says "this is wired" or "this is unwired." Packets report what grep found, what the code shows, what the doc says. Classification happens in morning synthesis.
5. **Speculate past the evidence.** Grep returning zero hits means "grep returned zero hits" — not "this feature is probably unwired."
6. **Invoke `mgrep`.** Per Convention 242 (inverted 2026-04-18), mgrep requires per-query founder approval; sessions do NOT have approval. Evidence collection uses Grep + Glob only.
7. **Invoke AURI / endor tools.** Scope 5 is grep + inspection; not scanning.
8. **Invent an implementation identifier.** If the 4-level chain produces nothing, record as CAPABILITY-ONLY. Fabrication is worse than acknowledging ambiguity.
9. **Cross-partition writes.** Each session writes to its own evidence file only. Never append to another partition's output.

The ONLY files a session may write to are its assigned evidence file (per §3) and the repo-root `HALT` file (for emergency self-halt when directed).

---

## 7 — Sub-agent dispatch guidance

Leads may spawn sub-agents within their session if the partition volume warrants it (Session 3 UI with ~120 entries is the most likely candidate). Sub-agents must:

1. **Read the full operation plan** (`claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md`) and the full recipe (Appendix A of this file AND the canonical `scope-5-evidence/EVIDENCE_RECIPE.md`) before processing any entry.
2. **Receive their entry range explicitly** from the lead (e.g., "process entries 207 through 250 of the UI partition"). Sub-agents do NOT choose which entries to process.
3. **Follow the same forbidden-actions list** (§6). Sub-agents have no additional permissions.
4. **Return packets to the lead** as tool result output. The LEAD writes packets into the evidence file — sub-agents do NOT write directly.
5. **Report sub-agent-level HALT conditions** to the lead, which records them in the evidence file.

Dispatch use `general-purpose` subagent type (the `Explore` type cannot Write; evidence packets require Write access from the lead even if sub-agents return output only). Lead's Agent prompt must explicitly reference this operation plan and include the forbidden-actions clause.

**Quality control:** The lead reviews sub-agent output before appending it to the evidence file. If a sub-agent produces a malformed packet (missing fields, verdict language, fabricated identifier), the lead re-runs the entry itself rather than laundering bad output.

---

## 8 — Reporting protocol

Each session reports to its own chat window at these moments (the founder monitors the four windows from the outside):

1. **Session start:** "Session <N> ready, starting <partition> at entry <first>."
2. **First packet complete:** "Session <N> first packet complete (entry <line>), Field 1 resolved at level <a|b|c|d|d.5|e>."
3. **Every 20 entries:** "Session <N> progress: <M> entries complete, next entry <line>."
4. **HALT condition:** "Session <N> HALTED — <reason>, <M> entries complete, evidence written to <path>."
5. **PARTITION COMPLETE:** "Session <N> PARTITION COMPLETE — <total> entries processed, evidence at <path>, ready for morning synthesis."

These are short chat reports, NOT in the evidence file. Progress markers inside the evidence file use the HTML-comment `<!-- PROGRESS MARKER: ... -->` form per recipe spec.

---

## 9 — Calibration entries per partition

**Every session** processes its calibration entry FIRST, surfaces the packet in its chat window, and PAUSES. The founder compares the calibration packet against the known-good answer documented in the partition file's "Calibration entry" section, then issues approval. No session continues past its calibration packet without explicit founder approval.

**Founder approval format (unambiguous single message).** When the founder is satisfied with a calibration packet, she types exactly this message in that session's chat:

```
Session [N] calibration approved, continue.
```

Where `[N]` is the session number (1, 2, 3, or 4). No other words are needed. On receiving this message, the session proceeds to the next entries in its partition per the recipe.

If the founder is NOT satisfied with a calibration packet (e.g., the packet skipped the 4-level chain, reached a verdict, fabricated an identifier, or missed a known-good claim from the partition file), she issues either a specific correction ("redo entry 433 — the packet claimed SequentialCollectionCard does not exist; the correct answer is that it is a named export from SequentialCollectionView.tsx:213") or a halt ("Session 3 halt, recipe issue"). The session responds and does not continue until the founder says `Session [N] calibration approved, continue.`

Full known-good content for each calibration entry is in the partition file's "Calibration entry" section. Summary:

| Session | Calibration line | Expected Field 1 level | Purpose |
|---|---|---|---|
| 1 (Schema remainder) | 494 — Sequential advancement modes | (a) multi-identifier, rigor test | Session-instance drift check; 7 sub-claims in the registry row test thoroughness across migration + hook + component + convention layers |
| 2 (Edge Functions) | 497 — `curriculum-parse` | (a) direct | Tests identifier-in-stub case |
| 3 (UI) | 433 — Sequential collection creation | (a) multi-identifier | Tests Looks-Fine-Failure pattern with historical context + SequentialCollectionCard named-export trap |
| 4 (Cross-cutting) | 493 — `createTaskFromData` guard | (a) direct + behavioral-claim verification | Tests specific-behavior verification (throw statement must be quoted verbatim) |

The Backburner/Ideas calibration (line 398, processed in pilot) is documented in `EVIDENCE_RECIPE.md` as the (b)-level cross-reference-chain reference example.

**Four different calibration shapes by design:** Schema Session 1 = rigor/thoroughness, Edge Functions Session 2 = direct-match, UI Session 3 = Looks-Fine-Failure + named-export-trap, Crosscutting Session 4 = behavioral-claim-verbatim. A sub-agent that passes all four has demonstrated recipe fluency across every shape of evidence work in the operation.

---

## 10 — Morning synthesis protocol

After all four sessions show `PARTITION COMPLETE`:

1. **Fresh Claude Code session dispatched.** Its prompt receives this operation plan path, the four evidence file paths, and the authority to write `STUB_REGISTRY_RECONCILIATION_DRAFT.md`.

2. **Packet scan pass.** Synthesis session reads all four evidence files, scanning for:
   - Malformed packets (missing fields, verdict language, empty Field 5).
   - HALT markers mid-file (some entries were never processed — flag for re-run).
   - Cross-partition conflict notes (if any).
   - Fabricated-identifier red flags.

3. **Classification pass.** Each of the ~219 packets (plus the 5 from the pilot) gets a classification:
   - `evidence-supports-claimed-status` — packet evidence aligns with the registry's status (✅/⏳/📌/🔗/❌).
   - `evidence-contradicts-claimed-status` — evidence directly contradicts the claim (like Backburner/Ideas + possibly entry 413 from pilot).
   - `evidence-ambiguous-needs-founder-judgment` — evidence mixed, incomplete, or entry resolved as CAPABILITY-ONLY.

4. **Draft produced.** `STUB_REGISTRY_RECONCILIATION_DRAFT.md` at repo root lists all 224 entries with their evidence summary (one-paragraph per packet, pointing at the full packet) and the classification bucket. Contradictions and ambiguous entries are listed first in separate sections for founder walk-through.

5. **Founder walk-through.** Synthesis session presents contradictions and ambiguous entries in batches of 10-20. Founder decides the real status per entry. Decisions are recorded inline in the draft.

6. **Commit 1 — reconciliation.** Synthesis session updates the real `STUB_REGISTRY.md` in ONE commit with the founder's decisions applied. Commit message: `chore(stub-registry): update per Scope 5 reconciliation — [N] entries corrected, [N] entries confirmed accurate`. This is the reviewable history-reference commit — its commit message answers "when and why did we change these entries." DO NOT bundle the archive move into this commit; the archive is hygiene and belongs in its own commit (step 8 below).

7. **Audit report finding landed.** Synthesis session appends SCOPE-5 findings (beyond F1 and F2 already logged) to `AUDIT_REPORT_v1.md` for any contradictions the founder classified as needing Phase 3 attention. This may or may not be part of Commit 1 depending on whether AUDIT_REPORT_v1.md edits feel like part of the reconciliation story — synthesis session's judgment. If in doubt, bundle with Commit 1.

8. **Commit 2 — archive move (mandatory last step — do NOT defer; do NOT bundle with Commit 1).** Synthesis session performs the following as its final actions before exit:
   - Amend this operation plan file with a completion header at the top:
     ```
     ## Completion record — <ISO date>
     - Scope 5 complete. Reconciliation commit: <SHA>.
     - Entries contradicting registry: <count>.
     - Entries resolved as ambiguous / founder-judgment: <count>.
     - Entries supporting registry: <count>.
     - All four evidence files archived alongside this plan.
     ```
   - `git mv claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md .claude/completed-builds/`
   - `git mv claude/web-sync/SCOPE_5_KICKOFF_PROMPTS.md .claude/completed-builds/`
   - `git mv scope-5-evidence/ .claude/completed-builds/scope-5-evidence/` (or individual file moves if git prefers)
   - Commit 2 (separate, clean): `chore(scope-5): archive completed stub reconciliation operation plan and evidence`.

---

## 11 — Completion criteria

Scope 5 is considered complete when ALL of the following hold:

- [ ] All four partition evidence files (`STUB_REGISTRY_EVIDENCE_SCHEMA.md`, `EDGE_FUNCTIONS.md`, `UI.md`, `CROSSCUTTING.md`) end with `## PARTITION COMPLETE`.
- [ ] `STUB_REGISTRY_RECONCILIATION_DRAFT.md` has been produced with all ~224 entries classified.
- [ ] Founder has walked contradictions and ambiguous entries with the synthesis session.
- [ ] Final `STUB_REGISTRY.md` update commit has landed.
- [ ] This operation plan has been moved to `.claude/completed-builds/` with a completion header appended.
- [ ] All four evidence files have been moved to `.claude/completed-builds/scope-5-evidence/` alongside this plan.
- [ ] Archive commit has landed.
- [ ] `AUDIT_REPORT_v1.md` Scope 5 section has been updated to note completion and list any SCOPE-5.F{N} findings raised.

---

## 12 — Known risks

- **Session 3 UI context pressure.** ~120 entries is near the upper bound of what a single Claude Code session can process cleanly. If Session 3 halts mid-partition for context-pressure reasons, the remaining entries resume on a fresh session. The recipe's HALT-marker protocol handles this cleanly.
- **Cross-partition misfit surprises.** If a sub-agent encounters an entry that clearly belongs in a different partition, it records the mismatch and moves on. Synthesis re-homes the entry; no re-dispatch needed mid-run.
- **Registry drift.** If STUB_REGISTRY.md is edited during the run (by human or by a different Claude session), ALL four sessions halt on the next integrity check. Founder resolves and re-dispatches.
- **CAPABILITY-ONLY inflation in crosscutting.** If more than ~60% of Session 4 packets resolve as CAPABILITY-ONLY, that's a signal the recipe's 4-level chain is too strict for abstract entries. Not a halt condition — surface it for founder judgment at synthesis.

---

## 13 — Lifecycle

**Active (now through synthesis):** This file lives at `claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md`. Evidence files at `scope-5-evidence/` at repo root. Both are discoverable by future Claude Code sessions looking at `claude/web-sync/` for active coordination docs.

**Archived (after synthesis, per §10.8):**
- `claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md` → `.claude/completed-builds/SCOPE_5_STUB_RECONCILIATION.md`
- `scope-5-evidence/` (entire directory: recipe, partitions, evidence files, pilot output) → `.claude/completed-builds/scope-5-evidence/`
- Archive commit: `chore(scope-5): archive completed stub reconciliation operation plan and evidence`.

After archive, the operation is a historical record — discoverable, auditable, referenceable. `claude/web-sync/` is clean for the next active coordination doc.

---

# Appendix A — Evidence Recipe (verbatim)

> This appendix is a verbatim copy of `scope-5-evidence/EVIDENCE_RECIPE.md`. If the canonical recipe changes, this appendix MUST be updated in the same commit. Any divergence between the canonical recipe and this appendix is a documentation bug.

**(The full text of `scope-5-evidence/EVIDENCE_RECIPE.md` is included here. Sessions may read either the canonical file or this appendix — they are the same text. Updates go to BOTH files in the same commit.)**

Read the full recipe at `scope-5-evidence/EVIDENCE_RECIPE.md`.

Key sections and their line ranges in the canonical file (useful for quick navigation):
- Forbidden actions (recipe §6 equivalent)
- Registry integrity check protocol
- HALT file mechanism
- The per-entry evidence packet — 6-field format
- Field 1 — MANDATORY 4-level extraction chain (a) → (b) → (c) → (d) → (d.5) → (e)
- Good packet example (Backburner/Ideas calibration)
- Bad packet example
- Handling ambiguity
- Session startup instructions template
- For the founder (morning review) section

**Note on Appendix vs canonical file:** The founder considered pasting the full recipe text verbatim into this appendix for absolute self-containment. The decision taken 2026-04-19: the canonical recipe file (`scope-5-evidence/EVIDENCE_RECIPE.md`) travels WITH the operation plan into `.claude/completed-builds/` on archive (per §13), so future sessions looking at this operation have the canonical file adjacent to the plan. A literal second copy would double maintenance burden without adding discoverability. Sessions are instructed in kickoff prompts to read both this plan file AND the canonical recipe file.

**If the canonical recipe file is ever separated from this plan file** (e.g., one is archived without the other), treat this appendix as incomplete and halt. The recipe and plan are a package.
