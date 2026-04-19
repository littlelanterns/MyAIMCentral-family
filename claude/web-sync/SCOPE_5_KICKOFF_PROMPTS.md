# Scope 5 Kickoff Prompts

> Four structurally-identical kickoff prompts — one per session. Paste each into its own Claude Code window when launching. Launch order per founder's operational preference (stagger recommended: Session 2 first, review its calibration packet, then Sessions 1/3/4 in quick succession).

---

## Session 1 — Schema remainder

```
You are Session 1 of a four-session parallel Scope 5 stub reconciliation operation.

Your partition: Schema remainder — 43 entries of stub_partition_schema.md. The 2026-04-19 pilot already processed 5 entries (lines 398, 413, 417, 446, 456). Do NOT re-process them. Append new packets to the existing evidence file; do NOT overwrite.

Calibration entry: line 494 (Sequential advancement modes). Process the calibration entry FIRST, surface the packet in chat, and PAUSE. Wait for founder message "Session 1 calibration approved, continue." before processing the remaining 42 entries (starting at line 469).

Before processing any entry, read IN FULL:
1. claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md — the operation plan
2. scope-5-evidence/EVIDENCE_RECIPE.md — the recipe (MANDATORY: 4-level identifier extraction chain including step d.5 bounded source-code lookup)
3. scope-5-evidence/stub_partition_schema.md — your partition (read the Calibration entry section; 7 sub-claims to verify)

Output file: scope-5-evidence/STUB_REGISTRY_EVIDENCE_SCHEMA.md (APPEND to the existing 5 pilot packets; do NOT overwrite).

You are authorized to spawn sub-agents via Agent tool (general-purpose type; Explore cannot Write). Sub-agents must follow the same recipe and forbidden actions.

Report to me in this chat at: session start, calibration packet complete + paused for review, (after founder approval) every 20 entries, PARTITION COMPLETE, any HALT condition.

When ready, report "Session 1 ready, starting Schema remainder at calibration entry 494." Then process the calibration entry and pause.
```

---

## Session 2 — Edge Functions

```
You are Session 2 of a four-session parallel Scope 5 stub reconciliation operation.

Your partition: Edge Functions — 9 entries of stub_partition_edge_functions.md. Calibration entry: line 497 (curriculum-parse Edge Function). Process the calibration entry FIRST, surface the packet in chat, and PAUSE. Wait for founder message "Session 2 calibration approved, continue." before processing the remaining 8 entries. Any message that is not exactly that approval string is treated as a correction or halt — do not resume on partial approval.

Before processing any entry, read IN FULL:
1. claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md — the operation plan
2. scope-5-evidence/EVIDENCE_RECIPE.md — the recipe (MANDATORY: 4-level identifier extraction chain including step d.5)
3. scope-5-evidence/stub_partition_edge_functions.md — your partition

Output file: scope-5-evidence/STUB_REGISTRY_EVIDENCE_EDGE_FUNCTIONS.md (create fresh).

You are authorized to spawn sub-agents via Agent tool (general-purpose type). Sub-agents must follow the same recipe and forbidden actions.

Report to me in this chat at: session start, calibration packet complete + paused for review, (after founder approval) every 20 entries, PARTITION COMPLETE, any HALT condition.

When ready, report "Session 2 ready, starting Edge Functions at calibration entry 497." Then process the calibration entry and pause.
```

---

## Session 3 — UI

```
You are Session 3 of a four-session parallel Scope 5 stub reconciliation operation.

Your partition: UI — ~120 entries of stub_partition_ui.md (largest partition). Calibration entry: line 433 (Sequential collection creation — canonical "Looks Fine Failure" case). Process the calibration entry FIRST, surface the packet in chat, and PAUSE. Wait for founder message "Session 3 calibration approved, continue." before processing the remaining ~119 entries. Any message that is not exactly that approval string is treated as a correction or halt — do not resume on partial approval.

Before processing any entry, read IN FULL:
1. claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md — the operation plan
2. scope-5-evidence/EVIDENCE_RECIPE.md — the recipe (MANDATORY: 4-level identifier extraction chain including step d.5)
3. scope-5-evidence/stub_partition_ui.md — your partition (read the scale warning at top)

Output file: scope-5-evidence/STUB_REGISTRY_EVIDENCE_UI.md (create fresh).

Given the ~120-entry volume, sub-agent dispatch via Agent tool (general-purpose type) is encouraged. Dispatch sub-agents with explicit entry ranges (e.g., "process entries 207 through 250 of stub_partition_ui.md table").

Report to me in this chat at: session start, calibration packet complete + paused for review, (after founder approval) every 25 entries, PARTITION COMPLETE, any HALT condition.

When ready, report "Session 3 ready, starting UI at calibration entry 433." Then process the calibration entry and pause. Note: SequentialCollectionCard is a named export from SequentialCollectionView.tsx:213 — NOT a separate file. Packet that claims the Card "doesn't exist" is wrong.
```

---

## Session 4 — Cross-cutting

```
You are Session 4 of a four-session parallel Scope 5 stub reconciliation operation.

Your partition: Cross-cutting — ~55 entries of stub_partition_crosscutting.md (most ambiguous partition). Calibration entry: line 493 (createTaskFromData guard for taskType='sequential'). Process the calibration entry FIRST, surface the packet in chat, and PAUSE. Wait for founder message "Session 4 calibration approved, continue." before processing the remaining ~54 entries. Any message that is not exactly that approval string is treated as a correction or halt — do not resume on partial approval.

Expect 30-50% of this partition's packets to resolve as CAPABILITY-ONLY. That's the correct outcome for abstract entries. Do NOT invent identifiers to make packets look complete.

Before processing any entry, read IN FULL:
1. claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md — the operation plan
2. scope-5-evidence/EVIDENCE_RECIPE.md — the recipe (MANDATORY: 4-level identifier extraction chain including step d.5)
3. scope-5-evidence/stub_partition_crosscutting.md — your partition (read the tighter-evidence-requirements section at top)

Output file: scope-5-evidence/STUB_REGISTRY_EVIDENCE_CROSSCUTTING.md (create fresh).

You are authorized to spawn sub-agents via Agent tool (general-purpose type). Sub-agents must follow the same recipe and forbidden actions.

Report to me in this chat at: session start, calibration packet complete + paused for review, (after founder approval) every 20 entries, PARTITION COMPLETE, any HALT condition.

When ready, report "Session 4 ready, starting Crosscutting at calibration entry 493." Then process the calibration entry and pause. The expected known-good packet MUST quote the throw statement verbatim from src/utils/createTaskFromData.ts:58-64.
```

---

## Launch stagger (founder's operational guide — not part of kickoff prompts)

Recommended launch order:

1. **Session 2 (Edge Functions) first.** Smallest partition, cleanest calibration (identifier-in-stub direct match). Founder reviews calibration packet in chat, confirms recipe is operational on a fresh session, types `Session 2 calibration approved, continue.`
2. **Session 1 (Schema remainder), Session 3 (UI), Session 4 (Crosscutting) launched in quick succession** once Session 2's calibration is approved. Each pauses after its own calibration packet. Founder reviews each in chat as they come in (there's no strict order on reviewing calibrations 1/3/4 — whichever chat pings first).
3. Founder approval per session is exactly the message: `Session [N] calibration approved, continue.` Any other message is treated by the session as a correction or halt signal.
4. Once all four calibrations are approved, overnight parallel continues unattended until each partition reports PARTITION COMPLETE.
5. Morning synthesis dispatched as a fresh fifth session per operation plan §10.

The `HALT` file mechanism (operation plan §5) lets the founder abort ALL sessions with `touch HALT` at repo root — each session halts on its next integrity check and writes a clean HALT marker. Founder deletes HALT before re-dispatch.
