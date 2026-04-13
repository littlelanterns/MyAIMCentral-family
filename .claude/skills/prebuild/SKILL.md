---
name: prebuild
description: "Run the mandatory pre-build audit for a PRD. Reads the full PRD, finds all matching addenda, checks live schema gaps, creates the feature decision file, and populates CURRENT_BUILD.md. Invoke with a PRD number: /prebuild PRD-15"
---

# Pre-Build Audit — Claude Code Skill

This skill enforces the mandatory pre-build ritual defined in `claude/PRE_BUILD_PROCESS.md`. Every feature build MUST start here. No exceptions.

## How to Invoke

```
/prebuild PRD-15
/prebuild PRD-18
/prebuild PRD-28B
```

The argument is a PRD number. If no number is provided, ask for one.

---

## Step 1: Locate and Read the Full PRD

1. Check `claude/feature_glossary.md` to find the PRD's category folder
2. Read the ENTIRE PRD at `prds/[category]/PRD-XX-FeatureName.md` — every word, not a skim
3. If the file doesn't exist at the expected path, search with Glob: `prds/**/PRD-XX*`

---

## Step 2: Find and Read Every Matching Addendum

1. Search `prds/addenda/` for ALL files containing the PRD number:
   - Glob: `prds/addenda/PRD-XX*` (e.g., `prds/addenda/PRD-15*`)
   - Also check for combined addenda (e.g., `PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md`)
2. Read EVERY file found — do not skip any
3. List every addendum file read by full filename

### Always-Relevant Addenda (check for EVERY build)

| Addendum | When It Applies |
|---|---|
| `PRD-Audit-Readiness-Addendum.md` | ALWAYS — every build |
| `PRD-Template-and-Audit-Updates.md` | Any feature using templates |
| `PRD-31-Permission-Matrix-Addendum.md` | Any feature with permissions or tiers |
| `PRD-35-Cross-PRD-Impact-Addendum.md` | Any feature with scheduling or recurrence |
| `PRD-36-Cross-PRD-Impact-Addendum.md` | Any feature with time tracking or timers |

Read the applicable always-relevant addenda too.

---

## Step 3: Check Schema Gaps

1. Read `claude/live_schema.md` — check what tables exist in the live database right now
2. Read `claude/database_schema.md` — check the planned schema for this feature's tables
3. Identify gaps: tables the PRD requires that don't exist yet, columns that need adding
4. Read `WIRING_STATUS.md` — check what's wired vs stubbed that this feature connects to

---

## Step 4: Create the Feature Decision File

Create `claude/feature-decisions/PRD-XX-FeatureName.md` using the template at `claude/feature-decisions/_TEMPLATE.md`.

Fill in ALL sections:
- **What Is Being Built** — one paragraph, plain language
- **Screens & Components** — exhaustive list of every UI element
- **Key PRD Decisions** — things most likely to be missed or built wrong
- **Addendum Rulings** — every decision from every addendum
- **Database Changes Required** — every table, column, index, trigger, migration
- **Feature Keys** — every feature key with tier and role groups
- **Stubs** — explicit list of what NOT to build this phase
- **Cross-Feature Connections** — what this feature sends/receives from others
- **Things That Connect Back Later** — future features that will wire into this one

---

## Step 5: Populate CURRENT_BUILD.md

Add a new build section to `CURRENT_BUILD.md` with:
- Status: **ACTIVE**
- PRD file path
- Every addendum file read (list them ALL)
- Feature decision file path
- Complete pre-build summary with these subsections:
  - **Context** — what exists, what's new, why this matters
  - **Dependencies Already Built** — hooks, components, tables that exist
  - **Dependencies NOT Yet Built** — what's missing that this feature needs
  - **Build Items** — numbered list of every concrete deliverable
  - **Stubs** — what is NOT being built and why
  - **Key Decisions** — architectural choices with rationale

---

## Step 6: Present Summary for Founder Review

Output the complete pre-build summary and ask Tenise to review:

> "Here is the pre-build summary for PRD-XX. Please review:
> - Are all requirements captured correctly?
> - Are the stubs right — nothing missing, nothing extra?
> - Have any decisions changed since the PRD was written?
> - Anything to adjust before build begins?"

**Do NOT write any code until the founder explicitly confirms.**

---

## Critical Rules

1. **PRDs are the SINGLE SOURCE OF TRUTH.** If the PRD says it, build it. If it doesn't, don't.
2. **The PRDs ARE the minimum.** Never suggest an "MVP approach" or "simpler version for now." If something can't be built correctly, stop and ask Tenise.
3. **Never modify files in `prds/`, `specs/`, or `reference/`.** These are read-only source material.
4. **List every addendum you read.** If you read it, it goes in the summary.
5. **Zero Missing items before code.** Every requirement must be Wired, Stubbed, or explicitly approved as deferred.
6. **This skill produces the plan only.** It does NOT write code. The founder reviews and approves before any code is written.
