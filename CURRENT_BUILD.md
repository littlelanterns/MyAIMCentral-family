# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.

## Status: IDLE

---

## Phase Being Built
## PRD File
## Addenda Files (ALL that apply — check prds/addenda/ for every PRD-XX* file)
## Feature Decision File
---

## Pre-Build Summary
### What Is Being Built
### Key Decisions From the PRD (Easy to Miss)
### Key Decisions From Addenda
### Database Changes Required
### Feature Keys to Register
### Things That Are STUBS (Do NOT Build This Phase)
### Cross-Feature Connections


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
