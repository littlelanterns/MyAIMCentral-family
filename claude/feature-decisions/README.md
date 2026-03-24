# Feature Decisions

> Consolidated build references — one file per PRD, written before each build, kept permanently.

---

## Purpose

Each file in this folder is a synthesis of one PRD + all its addenda.
It is written by Claude during the pre-build process, reviewed by Tenise, and used as
the working reference during the build.

These files exist to solve a specific problem: important decisions buried in PRDs and
addenda were getting missed at build time, producing wrong code that had to be torn out.
This folder is the fix.

---

## What Each File Contains

- Every screen and component to be built (explicit list)
- Key PRD decisions most likely to be missed
- Every addendum ruling that affects this build
- Database changes required
- Feature keys to register
- Explicit stub list (what NOT to build this phase)
- Cross-feature connections
- Founder approval record

---

## How Files Get Created

As part of the Pre-Build Process (`claude/PRE_BUILD_PROCESS.md`):

1. Claude reads the full PRD + all addenda
2. Claude creates this file from `_TEMPLATE.md`
3. Tenise reviews and approves
4. Only then does code get written

---

## File Naming

`PRD-XX-FeatureName.md` — matches the PRD number and feature name exactly.

---

## These Files Are Permanent

Once written, these files stay in the codebase. They are the record of what was
decided and why at build time. Do not delete them after a feature ships.

---

## Files in This Folder

| File | PRD | Build Date | Status |
|---|---|---|---|
| *(none yet — created during pre-build ritual for each phase)* | | | |
