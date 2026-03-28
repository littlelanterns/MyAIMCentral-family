# Audit Session Starter

> Paste this entire prompt at the start of a fresh Claude Code session to kick off the full codebase audit.
> Do not modify the prompt below — use it as-is.

---

## PROMPT TO PASTE:

---

I need you to run a full compliance audit of everything built so far in this codebase, comparing what was actually built against what the PRDs and addenda require. The goal is to find everything that is wrong, missing, incomplete, or inaccurate before we build anything new.

**Do not write any code during this session. This is a read-and-report audit only.**

---

### Phases to Audit

Audit each of the following completed phases in order:

| Phase | PRDs | Description |
|---|---|---|
| 01 | PRD-01 | Auth & Family Setup |
| 02 | PRD-02 | Permissions & Access Control |
| 03 | PRD-03 | Design System & Themes |
| 04 | PRD-04 | Shell Routing & Layouts |
| 05 | PRD-35, PRD-36 | Universal Scheduler & Timer |
| 06 | PRD-05 | LiLa Core AI System |
| 09 | PRD-08 | Smart Notepad |
| 10 | PRD-09A, PRD-09B, PRD-17 | Tasks, Lists, Studio, Queue Modal, Guided Forms |

---

### Audit Process for Each Phase

For every phase above, do the following:

**Step 1: Read the source material**
- Read the full PRD file for that phase (every word)
- Read every matching addendum in `prds/addenda/` for that PRD number
- Read `prds/addenda/PRD-Audit-Readiness-Addendum.md` for cross-cutting rulings
- Note every requirement: every screen, every field, every interaction, every rule, every empty state, every visibility condition

**Step 2: Read the actual code**
- Find the relevant components, hooks, pages, Edge Functions, and migrations for that phase
- Read them carefully — do not skim

**Step 3: Produce the phase audit report**

For each requirement from the PRD and addenda, assign one of these statuses:

| Status | Meaning |
|---|---|
| **Correct** | Built exactly as specified |
| **Partial** | Built but incomplete — what's missing |
| **Wrong** | Built but differs from spec — describe the difference |
| **Missing** | Not built at all |
| **Stubbed** | Intentional placeholder — confirm it's in STUB_REGISTRY.md |

---

### Audit Report Format

Produce one report section per phase. Use this structure:

```
## Phase XX — PRD-XX: [Feature Name]

### PRD Files Read
- [list every PRD and addendum file read]

### Requirements Audit

| Requirement | Source | Status | Detail |
|---|---|---|---|
| [requirement] | PRD §X | Correct/Partial/Wrong/Missing/Stubbed | [notes] |

### Summary
- Total requirements: X
- Correct: X
- Partial: X
- Wrong: X
- Missing: X
- Stubbed: X

### Issues Found (Partial + Wrong + Missing)
1. [Issue description — specific enough to fix]
2.
3.
```

---

### Final Summary

After all phases, produce a master issues list:

```
## Master Issues List — All Phases

### Priority 1: Wrong (Built Incorrectly)
These are actively working incorrectly and need immediate correction.
1. [Phase XX] [Component] — [what's wrong, what it should be]

### Priority 2: Missing (Not Built)
These were supposed to be built but aren't present.
1. [Phase XX] [Feature/Screen] — [what's missing]

### Priority 3: Partial (Incomplete)
These are partially built but need completion.
1. [Phase XX] [Component] — [what's incomplete]

### Stubs to Verify
Confirm each stub is properly documented in STUB_REGISTRY.md.
1. [Phase XX] [Feature] — [stub status]

### Total Issue Count
- Wrong: X
- Missing: X
- Partial: X
- Total requiring fixes: X
```

---

### Important Rules for This Audit

- Read every PRD completely before auditing that phase's code — do not work from memory
- Be specific: "the PIN lockout doesn't check `pin_locked_until`" not "PIN lockout may have issues"
- Check addenda carefully — many requirements that got missed in builds came from addenda, not the base PRD
- If you're unsure whether something is correct or wrong, read the PRD again — do not guess
- Do not suggest fixes during the audit — only report findings
- When you find something missing or wrong, quote the exact PRD language so Tenise can see exactly what was specified

---

Begin with Phase 01 — PRD-01: Auth & Family Setup.

---

*End of prompt*
