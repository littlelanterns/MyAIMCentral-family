# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.

## Status: IDLE

---

<!--
  HOW TO USE THIS FILE
  ────────────────────
  At the start of every build session:
  1. Claude reads the PRD + all addenda listed below
  2. Claude fills in every section of this file
  3. Founder reviews and explicitly approves
  4. Only then does code get written

  When the build phase is complete:
  - Reset Status to IDLE
  - Clear all sections below
  - Save the feature decision file to claude/feature-decisions/
  - Run the post-build checklist (Convention #14)
-->

---

## Phase Being Built
<!-- e.g., "Phase 02 — PRD-02: Permissions & Access Control" -->


## PRD File
<!-- Full path, e.g., prds/foundation/PRD-02-Permissions-Access-Control.md -->


## Addenda Files (ALL that apply — check prds/addenda/ for every PRD-XX* file)
<!--
  List every addendum read before this build. If unsure, search prds/addenda/ for the PRD number.
  Common ones to always check:
  - PRD-XX-Cross-PRD-Impact-Addendum.md
  - PRD-XX-Session-Addendum.md
  - PRD-31-Permission-Matrix-Addendum.md (anything with permissions)
  - PRD-35-Cross-PRD-Impact-Addendum.md (anything with scheduling)
  - PRD-36-Cross-PRD-Impact-Addendum.md (anything with timers)
  - PRD-Audit-Readiness-Addendum.md (always worth checking)
-->


## Feature Decision File
<!-- Path to claude/feature-decisions/PRD-XX-FeatureName.md once created -->


---

## Pre-Build Summary
<!-- Claude writes this after reading PRD + all addenda. Founder approves before code is written. -->

### What Is Being Built
<!-- Every screen, every component, every flow — complete list, nothing assumed -->


### Key Decisions From the PRD (Easy to Miss)
<!-- The non-obvious things. Specific field names, edge cases, empty states, visibility rules. -->


### Key Decisions From Addenda
<!-- Every ruling from addenda that affects this build. Note if an addendum overrides the PRD. -->


### Database Changes Required
<!-- Tables being created or modified. Every column. Migration approach. -->


### Feature Keys to Register
<!-- Every feature key, its tier, which role groups get it -->


### Things That Are STUBS (Do NOT Build This Phase)
<!-- Explicit list. If it's not in scope, say so here so it doesn't accidentally get built. -->


### Cross-Feature Connections
<!-- What this feature receives from other features, and what it sends to other features -->


---

## Founder Approval
<!--
  Founder reviews this summary before code begins.
  Check each box only after confirming.
-->
- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda have been read and captured above
- [ ] Stubs are clearly identified — nothing extra will be built
- [ ] Schema changes are correct and migration is planned
- [ ] Feature keys are identified
- [ ] Ready to build

---

## Post-Build PRD Verification

<!--
  Filled in AFTER the build is complete, BEFORE declaring it done.
  Go through every requirement from the pre-build summary above.
  Every item must be Wired or Stubbed. Zero Missing = build complete.

  Status options:
    Wired   = built and functional
    Stubbed = documented placeholder, in STUB_REGISTRY.md
    Missing = not built, not stubbed — build is NOT complete

  Present this table to Tenise as the handoff report.
-->

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

### Verification Summary
- Total requirements:
- Wired:
- Stubbed:
- Missing: **0** ← must be zero before closing

### Founder Sign-Off
- [ ] All requirements are Wired or Stubbed
- [ ] All stubs are in STUB_REGISTRY.md
- [ ] Any stubbed items are acceptable for this phase
- [ ] **Build approved as complete**
