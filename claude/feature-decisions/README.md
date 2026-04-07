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
| PRD-02-repair.md | PRD-02 | 2026-03-25 | Complete (18 wired, 3 stubbed) |
| PRD-03-repair.md | PRD-03 | 2026-03-25 | Complete (19 wired, 0 stubbed) |
| PRD-04-repair.md | PRD-04 | 2026-03-25 | Complete (11 wired, 0 stubbed) |
| PRD-05-repair.md | PRD-35 + PRD-36 | 2026-03-25 | Complete (14 wired, 0 stubbed) |
| PRD-05-LiLa-repair.md | PRD-05 | 2026-03-25 | Complete (10 wired, 0 stubbed, 1 N/A) |
| PRD-06-Guiding-Stars-Best-Intentions.md | PRD-06 | 2026-03-25 | Complete (42 wired, 11 stubbed) |
| PRD-07-InnerWorkings-repair.md | PRD-07 | 2026-03-25 | Complete (19 wired, 4 stubbed) |
| PRD-10-Widgets-Trackers-Dashboard-Layout.md | PRD-10 | 2026-03-25 | Complete |
| PRD-13-Archives-Context.md | PRD-13 | 2026-03-25 | Complete (80 wired, 14 stubbed) |
| PRD-21A-AI-Vault-Browse.md | PRD-21A | 2026-03-25 | Complete (74 wired, 14 stubbed) |
| PRD-21-Communication-Relationship-Tools.md | PRD-21 | 2026-03-26 | Complete (32 wired, 10 stubbed) |
| PRD-34-ThoughtSift.md | PRD-34 | 2026-03-26 | Complete — 3 sub-phases (34A: 42w/8s, 34B: 39w/4s, 34C: 48w/10s) |
| PRD-14-Personal-Dashboard.md | PRD-14 | 2026-03-30 | Complete (37 wired, 5 stubbed) — reconciliation build |
| PRD-17-Universal-Queue-Routing.md | PRD-17 | 2026-04-03 | Complete (30 wired, 7 stubbed) — gap-fill session |
| PRD-09A-09B-Studio-Intelligence-Phase-1.md | PRD-09A + PRD-09B | 2026-04-06 | Complete (27 wired, 0 stubbed) — sequential wiring fix + cross-surface visibility + capability tags foundation |
| PRD-18-Rhythms-Reflections.md | PRD-18 | 2026-04-07 | Phase A complete (51 wired, 14 stubbed) — foundation + Guided mini evening rhythm with rotating wordings + library-backed reflections + reflections date bug fix. Phases B/C/D = Enhancement Addendum items 1-8. |
