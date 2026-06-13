# Slice 3 Dispatch Prompt — paste into a fresh session

> Copy everything inside the fenced block into a new Claude Code session to start Slice 3.

```
You are Worker KIDS-REWARDS-PAGE-S3 (Slice 3 — Creature pages + Coloring section + Dashboard Doors) for MyAIM Central, continuing a founder-approved build mid-flight.

Read these IN FULL before touching anything:
1. .claude/rules/current-builds/KIDS-REWARDS-PAGE.md (auto-loads — the active build file; your task is the Slice 3 paragraph of the Slice Plan + the "Founder eyes-on fixes" log)
2. claude/feature-decisions/KIDS-REWARDS-PAGE-Gate-Decisions.md (founder gate — AUTHORITATIVE where it differs from anything else; read §13 in full — it is the complete, founder-locked design for the creature page, coloring section, and dashboard doors, refined over a live design session and it SUPERSEDES the terser Slice-Plan text)
3. claude/feature-decisions/Kids-Rewards-Page.md (pre-build recon — Sections 3, 4, 8 for the supersession map + reuse inventory)

STATE YOU INHERIT (verify, don't trust blindly):
- Slices 1 and 2 are COMPLETE, committed (08efafa), and pushed to main. The earned_prizes pipeline, redeem_own_prize RPC, visibility model, three-mode RewardImagePicker (Slice 1), and the shared MyRewards sections component + GamificationSettingsModal "My Rewards Page" section (Slice 2) are all live.
- Next free migration number: 00000000100274. (100273 was a same-session P0 fix: meetings↔meeting_participants RLS cross-recursion — util.my_meeting_ids() SECURITY DEFINER helper, pattern reference for any future two-table policy cycle.)
- Working tree is clean EXCEPT two untracked BookShelf planning docs (claude/feature-decisions/BookShelf-*.md) — a SEPARATE track. NEVER stage, modify, or delete them. Selective staging only.
- Slice 4 (Propose-a-Reward + mom self-propose) is NOT in this dispatch — it is the parallel slice and gets its own session.

YOUR TASK — Slice 3, exactly as Gate-Decisions §13 + the Slice 3 plan paragraph specify. Three parts:

PART A — Creature page (Gate-Decisions §13 is the law here):
- ONE self-contained FRAME holding a horizontal background SWIPE STRIP (the hero) + an unplaced-creatures SCROLLBAR at the BOTTOM OF THE FRAME (not bottom of page — so it never collides with the Play nav).
- Swipe the strip = NAVIGATE between the member's unlocked backgrounds (hands empty). Each background renders its placed creatures at saved positions.
- Drag-to-edge page flip = RETAINED, re-scoped to MOVING a creature between backgrounds: while dragging a creature, pushing it to the left/right edge advances the strip to the adjacent background so it can be dropped there. (Phone-home-screen metaphor: swipe browses, drag-to-edge carries. Both coexist.)
- Unplaced scrollbar = every earned-but-unplaced creature (member_creature_collection where sticker_page_id IS NULL). HIDEABLE via the shared <PullTab orientation="bottom"> (src/components/shared/PullTab.tsx — vibe-aware, required accessible label, Notepad/LiLa drawer pattern). Hidden → the assembled scene is the full hero of the frame.
- TWO placement gestures from the unplaced strip, BOTH supported: (a) touch-select-then-touch-place (tap a creature to select, tap a background spot to drop), and (b) drag-and-drop (incl. drag-to-edge mid-drag to reach another background). Drag sets exact x/y; touch-place sets x/y at the tapped point.
- Full earned-creature catalogue incl. unplaced; remove-from-page = set sticker_page_id NULL (returns to the unplaced strip).
- PREPARE-FOR-NOW, BUILD LATER: a background/character-SET picker over gamification_themes (1 row today) that writes member_sticker_book_state.active_theme_id. Do NOT build the picker, but the section MUST read the member's active set and filter backgrounds + creatures by theme_id from the start — never hardcode the single theme.
- Reuse: StickerOverlay (drag, 0–1 relative coords), useMoveCreature (already accepts newPageId — confirmed recon finding #4), useMemberPageUnlocks, useCreaturesForMember, useStickerBookState, gamification_sticker_pages (sort_order), member_creature_collection.

PART B — Coloring section (Gate-Decisions §13 — CARD GALLERY, founder decision):
- Card gallery, NOT a swipe strip. Active coloring images as cards on top (each showing its grayscale→color reveal progress); completed ones below as a "gallery of finished art." Tap any → full view.
- Keep the EXISTING browser-print flow (records printed_at). ADD Download: lineart PNG AND finished color PNG keepsake (Q4). No PDF library — assets are print-res PNGs by design.
- Surfaces the EXISTING reveal mechanic only (useColoringReveals, ColorRevealCanvas, ColorRevealDetailModal, member_coloring_reveals, coloring_reveal_library) — Slice 3 adds the rewards-page gallery surface + Download; it does NOT change how reveals are earned.

PART C — Dashboard doors (Gate-Decisions §13 + gate Section 4 — MOM PLACES THEM, founder decision):
- Two new dashboard widgets: 'sticker_page' (live miniature of the member's LAST-VIEWED background with creatures in saved positions; view-only viewport on the dashboard → tap opens the full creature modal) and 'coloring_page' (miniature of the active coloring image → tap opens the coloring modal).
- View-only on the dashboard (a window, not a toy — all interaction lives in the modal). S/M/L per PRD-10.
- Mom places them via the widget picker like any other widget — NOT auto-seeded onto kid dashboards. No new preference toggle. Registration path: types/widgets.ts union → WidgetRenderer case → widget_starter_configs seed row → picker category. RECON the live widget-grid wiring per shell first (gate Section 4 recon item #3): if the grid is real on Guided/Independent/Adult, register both as catalog widgets; Play's widgets are hardcoded — add Play equivalents there.

MIGRATION (start at 00000000100274):
- member_sticker_book_state.last_viewed_page_id (new column; per R5 — restores the swipe position; do NOT touch active_page_id award-landing semantics).
- widget_starter_configs seed rows for the two door widgets.
- Idempotent; apply via `supabase db push --linked`; regenerate claude/live_schema.md via `npm run schema:dump` and stage it (the pre-commit hook enforces Convention #244 on any staged migration).

PROCESS (non-negotiable):
- Run the PRE_BUILD_PROCESS ritual. Do the live recon FIRST — never guess schema. Confirm against the live DB: Gate Section 8 items #3 (last-viewed-page storage), #4 (All-pages tab = full earned catalogue incl. unplaced?), #5 (widget-grid wiring per shell), and Q4 (coloring print/download asset URLs). Cite findings.
- Playwright is the ONLY proof of done: write tests/e2e/features/kids-rewards-slice3.spec.ts covering creature placement (both gestures), drag-to-edge cross-background move, remove-from-page, swipe navigation, theme-scoped filtering, coloring gallery (active+completed, download), and both door widgets (placement + view-only + opens modal). View-As correctness throughout (useEffectiveMember).
- Regression pins MUST stay green: kids-rewards-slice1, kids-rewards-slice2, meetings-rls-recursion, role-scoping-leak-pass, permissions-wiring, task-assignment-scoping, fo-command-center.
- npx tsc -b clean, npm run lint 0 errors.
- Emoji rule: Lucide / on-brand assets only, no Unicode emoji (the Play shell was just swept — keep it clean).
- Extend the eyes-on tour (tests/e2e/features/kids-rewards-eyes-on-tour.spec.ts, EYES_ON_TOUR=1) with Slice 3 stops; KRSLICE3-prefixed fixtures, swept by the slice3 suite's next run.

GATES:
- NOTHING COMMITS until BOTH the full suite passes AND founder eyes-on clears the new surfaces — populate the Mom-UI Verification table in the build file. Founder small-finger eyes-on is REQUIRED for the Play creature page, especially the drag-to-edge flip threshold (reachable without accidental flips when placing a creature near an edge) and the pull-tab.
- Then selective staging (KIDS-REWARDS-PAGE / Slice-3 files only — BookShelf docs stay untracked), founder confirms before push. Direct-to-main is this project's deploy flow (Vercel builds from main).
- After Slice 3 closes, the remaining work is Slice 4 (Propose-a-Reward + mom self-propose) and Slice 5 (parent PrizeBoard restructure + mom's pill per R4-REVISED + full verification). Present the Slice 4 plan before writing further code.
```
