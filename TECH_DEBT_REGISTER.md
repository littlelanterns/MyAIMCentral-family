# TECH_DEBT_REGISTER.md

> **Purpose:** Authoritative ledger of known code or schema defects that have been consciously classified as Tech Debt — meaning they are real (not speculative, not mislabeled) but fixed opportunistically during adjacent work rather than in a dedicated build pass.
>
> **Authored:** 2026-04-23
> **Source:** Phase 3 Triage Session 2 — [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md) locked at 183/183.
> **Companion artifacts:** [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md) · [FIX_NOW_SEQUENCE.md](FIX_NOW_SEQUENCE.md) · [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md).

---

## Register

| # | Source | Title | Scope | Non-concurrent-zone flag | Added | Resolved | Notes |
|---|---|---|---|---|---|---|---|
| 1 | SCOPE-8a.F8 (Triage Row 99) | HumanInTheMix component reuse count = 1 — inconsistent HITM implementations | Tie-off opportunistic during Universal Setup Wizards workstream. HITM implementations vary site-to-site because the reusable component has effectively a single caller; remaining HITM surfaces hand-rolled Edit / Approve / Regenerate / Reject. Convention #4 is honored semantically but not structurally. | **YES** — HumanInTheMix refactor touches files that wizard builds will touch; serialize or the refactor collides with wizard-build commits. | 2026-04-23 | — | Severity Medium, Beta=N, Wizard-design-impacted=Y per worksheet. Blocked-by: Universal Setup Wizards workstream (the refactor is expected to happen as part of, or immediately after, that workstream rather than as a standalone pass). Worksheet annotation: "opportunistic during Universal Setup Wizards workstream. Non-concurrent-zone flag for Phase 4 dispatch planning (HumanInTheMix refactor collides w/ wizard builds)." |
| 2 | NEW-S (Triage Row 105) | Schema consolidation: decide canonical storage for sequential behavior (`sequential_collections` table vs. `lists` with `presentation_mode=sequential`) | Both storage locations currently valid and populated. Consuming code must treat them identically behaviorally. Future schema cleanup collapses them to one canonical location once the Composition Architecture doc §1.1 + draft notes 24 + 26 direction firms up. | No | 2026-04-23 | — | Severity Low, Beta=N. "Silent approve" in Session 2 — no founder-level re-read needed; classification was already clean at emission. Reference: Composition Architecture doc §1.1, draft notes 24 + 26. No sequencing dependency — sits in the pool until a schema cleanup pass surfaces it naturally. |

---

## Intake rules — how to add a row

A finding qualifies as **Tech Debt** when all of the following hold:

1. **It is a known, specific defect** — not a speculative improvement, not a "we could refactor this someday," not a doc-drift item. If the finding is better classified as Fix Now, Fix Next Build, Intentional-Update-Doc, Defer-to-Gate-4, or Capture-only, use that classification instead.
2. **Current behavior is tolerable.** The defect is not Beta-blocking, not producing wrong data, not a silent correctness hazard, not a user-visible failure under normal conditions. (If any of those, it belongs in a Fix Now or Fix Next Build wave.)
3. **A dedicated fix pass is not warranted.** The fix is cheap when done alongside adjacent work but expensive-to-schedule on its own. Dedicated-pass-warranted work goes to Fix Next Build instead.
4. **The adjacent work is identifiable.** Either a workstream name (e.g. "Universal Setup Wizards") or a natural surfacing event (e.g. "next schema cleanup pass") can be named in the Scope column. Debt without a plausible fix occasion is just deferred work and should go to Defer-to-Gate-4.

### Non-concurrent-zone flag

Set **YES** when the debt's fix touches files or architecture that an active or imminent workstream will also touch. This is a dispatch-planning signal — it tells Phase 4 coordinators that the fix cannot run concurrently with the adjacent workstream without producing merge conflicts or scope overlap. SCOPE-8a.F8 (HumanInTheMix) is the reference example: the refactor collides with wizard builds because both touch the same component-shape boundary.

Set **No** when the fix is schema-level, doc-level, or otherwise file-disjoint from in-flight work.

### Row format

- **# —** sequential in this register, independent of worksheet row numbers.
- **Source —** triage-row identifier (`SCOPE-X.FY (Triage Row N)` or `NEW-X (Triage Row N)`) for rows sourced from Phase 3 Triage. Use `post-triage` for rows added after Session 2 close.
- **Title —** the defect itself in one clause — what is wrong, not what should replace it.
- **Scope —** what gets fixed when this row is resolved. Name the adjacent workstream or surfacing event here.
- **Non-concurrent-zone flag —** YES / No per the criterion above.
- **Added —** ISO date the row landed in this register.
- **Resolved —** ISO date + commit reference when the debt is fixed. Leave blank until closure.
- **Notes —** severity, beta flag, wizard-design-impact flag, dependencies, worksheet annotations, cross-references. Reproduce load-bearing annotations from the worksheet verbatim so readers do not need to cross-open it.

### Adding a post-triage row

When a new Tech Debt finding surfaces outside of a triage cycle:

1. Classify it against the four intake criteria above. If any fails, use the correct classification instead.
2. Append a new row with Source = `post-triage`, populate all columns, and capture the originating context (commit, dispatch, or discussion link) in Notes.
3. If the row is non-concurrent-zone flagged YES, notify the Phase 4 dispatch coordinator so it enters the concurrency map.

### Resolving a row

Fill in the **Resolved** column with ISO date + commit reference when the debt lands. Do not delete resolved rows — the register doubles as a resolution log.

---

## Cross-references

- Classification definitions + full triage context: [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md) (Legend section).
- Wave ordering for adjacent workstreams that surface these fixes: [FIX_NOW_SEQUENCE.md](FIX_NOW_SEQUENCE.md) v11.
- Audit-layer detail per finding: [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md).
- Gate 1 exit criteria: this file's existence satisfies the `TECH_DEBT_REGISTER.md exists with all deferred findings` checkbox in [TRIAGE_WORKSHEET.md §Gate 1 exit criteria tracker](TRIAGE_WORKSHEET.md).
