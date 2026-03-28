# PRD Template & Audit Readiness Updates
## Changes to Apply to Project Knowledge Files

**Date:** March 3, 2026
**Session:** PRD-07 (InnerWorkings)
**Purpose:** Two project knowledge files need updates so that future PRD sessions automatically include the audit readiness habits and the "Decisions Made This Session" section. Apply these changes before starting the PRD-08 conversation.

---

## Update 1: PRD Template — Add Two New Sections

### Add to the template (inside the markdown code block), after DATABASE_SCHEMA.md Additions and before `*End of PRD-[##]*`:

```markdown
---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| [1] | **[Decision summary]** | [Why this call was made — one sentence.] |

[Capture every non-obvious decision made during the PRD session. Include naming decisions, architectural choices, privacy model selections, what was included vs. excluded, and any cross-PRD conventions established.]

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| [1] | [What was intentionally left for later] | [Which PRD, design sprint, or phase resolves it] |

[Capture everything that was discussed but explicitly deferred. This prevents the Opus audit from flagging known gaps as oversights.]

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| [PRD-##] | [What this PRD's decisions change about that PRD] | [Specific update needed] |

[List every existing PRD that needs updating based on decisions made in this session. Be specific about what changed and what action is needed.]
```

### Add to the "Always Include" list in the Section Usage Guide:

```
- **Decisions Made This Session** — Every PRD session makes decisions. Capture them here with rationale, deferrals, and cross-PRD impact. This is critical for the final Opus audit.
```

### Add to the "Flex Based on Complexity" note:

```
Even simple PRDs should have a Decisions section — even if it's just 2-3 rows. The audit needs to see what was decided and why, regardless of feature complexity.
```

---

## Update 2: PRD Template — Add Audit Readiness Inline Tags

### Add a new section after the Section Usage Guide called "Audit Readiness Tags":

```markdown
## Audit Readiness Tags

These inline tags should be used throughout PRD sections (not just in a single section) to support the final Opus audit pass. See PRD-Audit-Readiness-Addendum.md for full context and examples.

**Use throughout the PRD where relevant:**

- `> **Decision rationale:** [Why this call was made, in one sentence.]` — Place after any non-obvious decision. Prevents Opus from flagging intentional choices as problems.

- `> **Deferred:** [What's deferred] — to be resolved in [PRD-## / future sprint / etc.]` — Place after any stubbed or TBD item. Distinguishes "intentionally deferred" from "accidentally skipped."

- `> **Depends on:** [What is assumed] — defined in PRD-[##], [Section].` — Place at the top of any section that relies on another PRD. Lets Opus verify both ends of the dependency.

- `> **Mom experience goal:** [What this should feel like from mom's perspective.]` — Place in the Overview or before the most important screen description. At least one per PRD.

- `> **Tier rationale:** [Why this capability sits at this tier.]` — Place in the Tier Gating section.

- `> **Forward note:** [What may evolve and why it's constrained now.]` — Place near any launch-scoped constraint. Invites better audit suggestions.

**Shell behavior tables:** Always include all five shells (Mom, Dad, Special Adult, Independent, Guided/Play). No blank entries. Use explicit "Not present" or "Not applicable" with a Deferred tag if stubbed.

**Quick check before finalizing any PRD:**
- [ ] Non-obvious decisions have `> **Decision rationale:**` notes
- [ ] All deferred/stubbed items have `> **Deferred:**` tags with resolution paths
- [ ] Cross-PRD assumptions have `> **Depends on:**` notes
- [ ] Shell behavior table includes all five shells with no blank entries
- [ ] Tier Gating section has a `> **Tier rationale:**` note
- [ ] At least one `> **Mom experience goal:**` note on the most important flow
- [ ] Any launch-scoped constraints have `> **Forward note:**` tags
- [ ] "Decisions Made This Session" section is complete with all three tables
```

---

## Update 3: Audit Readiness Addendum — Add Reference to Decisions Section

### Add after the Quick Reference Checklist at the end of the Audit Readiness Addendum:

```markdown
---

## Habit 8: Consolidate Session Decisions in the PRD

Every PRD ends with a "Decisions Made This Session" section containing three tables:

1. **Decided** — Every non-obvious decision with a one-sentence rationale
2. **Deferred** — Everything discussed but explicitly left for later, with a resolution path
3. **Cross-PRD Impact** — Every existing PRD affected by this session's decisions, with specific action needed

**Why it matters:** This is the single source of truth for what happened during the PRD session. Without it, decisions scatter across conversation history and are lost when the session ends. The Opus audit uses this section to verify that cross-PRD impacts have been addressed and that deferrals have resolution paths.

**This section replaces the need for separate "Session Addendum" files.** Everything lives in the PRD itself, in context with the decisions it documents.

### Add to the Quick Reference Checklist:

- [ ] "Decisions Made This Session" section includes Decided, Deferred, and Cross-PRD Impact tables
```

---

## Update 4: PRD-08 Starter Prompt — Add Audit Readiness Reminder

### Add to the "Approach" section of the PRD-08 Starter Prompt:

```markdown
6. Include audit readiness tags throughout the PRD (`> **Decision rationale:**`, `> **Depends on:**`, `> **Deferred:**`, `> **Mom experience goal:**`, `> **Forward note:**`, `> **Tier rationale:**`) per the PRD-Audit-Readiness-Addendum.md
7. End the PRD with a "Decisions Made This Session" section capturing all decisions, deferrals, and cross-PRD impact in three tables
```

---

## Summary of Changes

| File | What to Add |
|------|-------------|
| **MyAIM_Family_PRD_Template.md** | "Decisions Made This Session" section in the template. "Audit Readiness Tags" guidance section after the Section Usage Guide. Update "Always Include" list. |
| **PRD-Audit-Readiness-Addendum.md** | Habit 8 (Consolidate Session Decisions). Updated Quick Reference Checklist. |
| **PRD-08-Starter-Prompt.md** | Two lines added to the Approach section referencing audit readiness tags and the Decisions section. |

After applying these updates, every future PRD session will automatically produce PRDs with inline audit tags and a consolidated decisions section — no separate addendum files needed.

---

*End of updates document*
