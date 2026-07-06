# GDCX — Guided Dashboard Completion Recon Brief (Sonnet agent, 2026-07-04)

> Archived condensed with citations. Consumed by `GDCX.md`.

## Residual verdicts

1. **Messages tab (Write drawer):** NOT a "Coming soon" stub anymore — `WriteDrawerMessages.tsx` shows real unread count (`useUnreadNotificationCount()`, :21) + "Open Messages" redirect; header comment documents the interim decision (:10-12). Full inline spec (PRD :230-236) is buildable (PRD-15 all live; coaching Convention #139 confirmed at ChatThreadView.tsx:521-536). NEEDS-DESIGN.
2. **Unread badge on Write button:** `GuidedShell.tsx:610-611` hardcoded 0 with wired render logic (:624-634). READY — one line.
3. **LiLa Homework Help:** **WIRED** — mode row (migration 000013:178-179), Socratic prompt + safety preamble (`lila-chat/index.ts:151-152`; preamble import confirms SAFETY-BETA-GATE Slice A SHIPPED), mom toggle (GuidedManagementScreen.tsx:570-575), kid launcher (GuidedShell.tsx:206-213 → openTool). STUB row 400 STALE.
4. **LiLa Communication Coach:** **WIRED** same chain (000013:180-181; index.ts:153-154 "Talk It Out"; toggle :576-581; launcher :214-219). STUB row 401 STALE.
5. **Progress page:** PRD never spec'd content (nav label only). GuidedProgress.tsx = sticker widget + "more coming soon". **OVERLAP: KIDS-REWARDS /my-rewards** (Guided More menu) now shows points/rewards/victories/creatures/coloring — two surfaces compete. NEEDS-DESIGN.
6. **Gamification header indicators:** **WIRED** (GuidedGreetingSection.tsx:107-121; compute_streak RPC via useMemberStreak.ts:29-33). Minor edge: hide logic is value>0, not an explicit enabled check. STUB row 395 STALE.
7. **Task point values:** **WIRED** (GuidedActiveTasksSection.tsx:245-253, points_override + Star). STUB row 396 STALE.
8. **DailyCelebration Step 2.5 reflections:** STILL STUB at both ends — `DailyCelebration.tsx:24-37` discards `reflectionsEnabled`; activeSteps (:75-78) hardcodes out streak+theme with no reflections branch; caller CelebrateSection.tsx:46-54 never passes the pref. All building blocks exist (useReflections hooks + WriteDrawerReflections card pattern). READY (real work).
9. **NEXT BEST THING FULLY DISABLED** — `GuidedDashboard.tsx:106-109` `return null // Disabled per founder request (2026-05-03): pulling from unassigned/inactive tasks. Re-enable when scoped to assigned+active only.` Engine (useNBTEngine.ts), card, AI glaze (guided-nbt-glaze EF — now auth'd per SAFETY Slice C) all built. **Root cause:** useNBTEngine.ts:28-32 filters assignee/status/archived but NEVER applies `filterTasksForToday` (recurringTaskFilter.ts) — so MWF routines on a Tuesday / future-dtstart routines surfaced as suggestions. The PRD's flagship UNHIDEABLE feature (types/guided-dashboard.ts:84-88) dark for 2+ months. READY — apply the filter, verify, flip on.
10. Adjacent: per-prompt reflection enable/disable UI (PRD Screen 5) absent — only count dropdown; `reflection_prompts`/`reflection_custom_prompts` prefs are dead config. DailyCelebration Steps 3 (streak) + 4 (theme) also unconditionally skipped — data now real (Build M), could unstub in the same pass.

## Infra: everything available (messaging, notifications count hook, guided modes live, gamification tables, journal entry_type/source support, filterTasksForToday exists).

## Conflicts (named)
- **Convention #124 vs code:** #124 says Guided nav = Home, Tasks, Write, Victories, Progress. Code (GuidedShell.tsx:30-35 + Write injection) = Home/Tasks/Write/Progress; **Victories lives in the More menu** (GUIDED_MORE_SECTIONS :142). Drift or deliberate — founder call; amend #124 or restore.
- NBT priority count: code has 8 levels incl. best-intention reminder — **matches Convention #126 (newer, 8 levels)**; the PRD's 7 is superseded. No conflict.
- #139/#133 confirmed satisfied.
- CLIENT-DATE-REMEDIATION coordination: its R2/R3 slices thread family-today into `filterTasksForToday` call sites (GuidedActiveTasksSection etc.) — the NBT fix must use the same seeded pattern, not a bare client date.

## Founder questions (absorbed into pack decisions)
Messages redirect vs inline; Progress vs /my-rewards; NBT founder-complaint confirmation at eyes-on; Victories nav placement; per-prompt toggles wanted?; bundle Steps 3/4.

Key files: GuidedDashboard.tsx, useNBTEngine.ts, NextBestThingCard.tsx, CelebrateSection.tsx, DailyCelebration.tsx, GuidedManagementScreen.tsx, GuidedShell.tsx (:30-35, :610-611), GuidedProgress.tsx, WriteDrawerMessages.tsx, WriteDrawerReflections.tsx, STUB_REGISTRY:391-406.
