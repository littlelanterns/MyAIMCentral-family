# Round 3 Verdict Proposals

> Produced 2026-04-19 by Scope 5 walk-through bulk verdict worker.
> Founder reviews, approves/overrides. Decisions then recorded in
> WALKTHROUGH_DECISIONS.md by a subsequent worker.

## Summary counts
- TYPE A (cross-references): 14
- TYPE B (verdict proposals): 26
- TYPE C (founder judgment needed): 5
- Total: 45

---

## TYPE A — Cross-references

These entries were already resolved as part of Round 1 aggregate findings or Round 2
standalone contradiction work. No new verdict needed — they carry the decision already
recorded in WALKTHROUGH_DECISIONS.md.

| Section 3 # | Line | Stub title (truncated) | Resolved under |
|---|---|---|---|
| 2 | 62 / 82 | Long conversation summarization (duplicate pair) | Finding D — merge pair, keep 📌 Post-MVP |
| 3 | 88 | Family-level GuidingStars | Finding J — flipped ✅ Wired → ⏳ Unwired (MVP) |
| 5 | 120 | Family Vision Quest discussions | Finding J — flipped 🔗 Partial (audio stub) → ⏳ Unwired (MVP) |
| 6 | 133 / 197 | My Circle (non-family contacts) duplicate pair | Finding D — merge pair, keep 📌 Post-MVP |
| 9 | 155 | Meeting gamification connection | Finding K — consistent, no change (⏳ Unwired (MVP)) |
| 12 | 357 | All 38 color themes | Finding E — hygiene only, replace "38 color themes" with "all configured themes" |
| 15 | 423 | Widget → Gamification progress | Finding F — flipped ⏳ Unwired (MVP) → 🔗 Partially Wired (Build M infra delivered, consumer trigger pending) |
| 17 | 445 | AI Auto-Sort for views | Finding E (scope context) — note wording update: "ai-parse exists; `task_placement` guided mode not seeded, no AI placement banner UI." No status change. |
| 19 | 457 / 458 | Community moderation queues (duplicate with 285/286) | Finding D — merge 285+457 and 286+458 pairs; both pairs resolve to 🔗 Partially Wired (backend writer + consumer gate exist, admin UI does not) |
| 28 | 390 | Studio seed templates ("15 in DB") | Finding E — flipped ✅ Wired → 🔗 Partially Wired (template cards render; click-through deploys nothing or misroutes for most) |
| 29 | 492 | capability_tags populated "on all 27 seed templates" | Finding E — hygiene only, replace "(27 seed templates)" with "(all seed templates)". No status change. |
| 36 | 445 | AI Auto-Sort for views (duplicate of #17) | Finding E (scope context) — same as #17 |
| 43 | 287 / 461 | Board session export (duplicate pair) | Finding D — merge pair, keep 📌 Post-MVP |
| 44 | 288 / 462 | Translator non-English language support (duplicate pair) | Finding D — merge pair, keep 📌 Post-MVP |

---

## TYPE B — Verdict proposals (founder approves as batch or flags exceptions)

### Entry 7 — Line 139 — Haiku overview card generation
- **Current:** 📌 Post-MVP
- **Proposed:** Keep 📌 Post-MVP
- **Rationale:** `overview_card_content` storage column wired and rendered in `MemberArchiveDetail.tsx`; Haiku generation call is absent. Registry note ("Card renders, generation call is stub") accurately describes the scope. CROSSCUTTING evidence confirms capability-only.
- **Misleading-UI flag:** None — card surface is a user-editable field, not a claim that AI generated it.

### Entry 8 — Lines 148 / 163 — Meeting templates in AI Vault (community sharing)
- **Current:** 📌 Post-MVP
- **Proposed:** Keep 📌 Post-MVP
- **Rationale:** Section 3 row notes capability-only status; no community-sharing surface for meeting templates exists in `src/`. Consistent with Post-MVP.
- **Misleading-UI flag:** None — no surface visible to users.

### Entry 10 — Line 268 — Streak milestone earning mode
- **Current:** 📌 Post-MVP
- **Proposed:** Keep 📌 Post-MVP
- **Rationale:** CLAUDE.md #209 enumerates 4 creature earning modes; `streak_milestone` is not among them. The `streak_milestone` value appears in an adjacent `unlocked_trigger_type` enum but not `creature_earning_mode`. Earning-mode feature not available in the app.
- **Misleading-UI flag:** None — mode not exposed in GamificationSettingsModal picker.

### Entry 14 — Line 422 — Widget milestone → Victory Record
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** Finding B verification confirmed `widget_milestone` is a placeholder enum value in `src/types/victories.ts:13` with zero writers across `src/`, migrations, and Edge Functions. Under founder's rule, enum presence is not wired status.
- **Misleading-UI flag:** None — no user surface advertises this path.

### Entry 16 — Line 438 — Unmark cascade behavior
- **Current:** 🔗 Partially Wired
- **Proposed:** Flip to ⏳ Unwired (MVP)
- **Rationale:** CLAUDE.md Convention #206 says "Task unmark cascade is explicitly NOT implemented (known limitation)." Under founder's rule, explicit non-implementation is not "partial." Aligning 438 to line 243 ("Task unmark cascade" already ⏳ Unwired (MVP)) eliminates an internal contradiction.
- **Misleading-UI flag:** None — no UI suggests cascade works; mom must manually adjust points per stub note.

### Entry 18 — Line 454 — ThoughtSift guided modes (5)
- **Current:** ✅ Wired
- **Proposed:** Keep ✅ Wired
- **Rationale:** CLAUDE.md §ThoughtSift confirms 5 separate tools (`board_of_directors`, `perspective_shifter`, `decision_guide`, `mediator`, `translator`) each have their own mode_key, Edge Function, and seeded row. Tool-level wiring variance is tracked by individual per-tool registry entries. This entry covers the mode-seeding task, which is complete.
- **Misleading-UI flag:** None.

### Entry 20 — Line 459 — Full persona library browse page (categories/filtering)
- **Current:** 📌 Post-MVP
- **Proposed:** Keep 📌 Post-MVP
- **Rationale:** Consistent per Session 3. Browse page with category filtering not built; current persona selector is session-scoped picker. Capability-only.
- **Misleading-UI flag:** None — no link to a browse page exists in UI.

### Entry 21 — Line 460 — LiLa proactive ThoughtSift tool suggestion
- **Current:** 📌 Post-MVP
- **Proposed:** Keep 📌 Post-MVP
- **Rationale:** Capability-only per synthesis note; no LiLa mid-conversation suggestion of ThoughtSift tools. Consistent with Post-MVP.
- **Misleading-UI flag:** None.

### Entry 22 — Line 467 — BookShelf enrichment for BoD personas
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** `board_personas.bookshelf_enriched` column exists per live_schema.md (line 9 of board_personas). No consumer code reads the column to branch enrichment behavior. Schema scaffolded, feature not functional.
- **Misleading-UI flag:** None.

### Entry 23 — Line 488 — Sequential visible on Lists page (grid + list view)
- **Current:** ✅ Wired
- **Proposed:** Keep ✅ Wired
- **Rationale:** CLAUDE.md #156 (filter='all' behavior) + WIRING_STATUS.md Sequential Collections table confirm Lists page renders sequential collection tiles when `filter='all'`. Phase 1 dual access verified in `tests/e2e/features/studio-intelligence-phase1.spec.ts`.
- **Misleading-UI flag:** None.

### Entry 24 — Line 496 — Linked routine steps (`step_type` enum)
- **Current:** 🔗 Partially Wired
- **Proposed:** Flip to ✅ Wired
- **Rationale:** WIRING_STATUS.md §Sequential Collections row "Linked routine steps — dashboard rendering | RoutineStepChecklist expands inline with linked content from sequential/randomizer/task sources | **Wired** | GuidedActiveTasksSection + TaskCard. 2026-04-13." Verified at [RoutineStepChecklist.tsx:214-221](src/components/tasks/RoutineStepChecklist.tsx#L214-L221) — all three linked branches render. The "next incremental step" noted in the existing registry stub is the work that landed 2026-04-13.
- **Misleading-UI flag:** None.

### Entry 25 — Line 515 — `homeschool_time_review` LiLa guided mode
- **Current:** 📌 Post-MVP
- **Proposed:** Keep 📌 Post-MVP
- **Rationale:** Migration 00000000100138 seeded the `homeschool_time_review` mode_key and `supabase/functions/homework-estimate/index.ts` exists; `LogLearningModal.tsx:69` invokes it. However, the registry note explicitly scopes this as "AI subject estimation from child's Log Learning description" which depends on PRD-05 day-data context enhancement. The homework-estimate function that exists is a narrower scope than the full guided-mode feature described. Status is consistent with "deferred beyond MVP pending PRD-05 enhancement."
- **Misleading-UI flag:** None — no UI surface advertises the full guided-mode flow.
- **Note:** This one is genuinely on the TYPE B/C borderline. Moved to TYPE B because the registry description explicitly names an unmet dependency (PRD-05 day-data context) as the gate.

### Entry 26 — Line 518 — Biweekly/monthly allowance periods
- **Current:** 📌 Post-MVP
- **Proposed:** Keep 📌 Post-MVP
- **Rationale:** CHECK constraint includes biweekly/monthly values; no UI exposes them. Weekly is the only allowance period supported in the app today per the registry note.
- **Misleading-UI flag:** None — allowance UI shows weekly-only picker.

### Entry 27 — Line 267 — Sunday List faith-themed sticker theme override
- **Current:** 📌 Post-MVP
- **Proposed:** Keep 📌 Post-MVP
- **Rationale:** `theme_override_id` column exists on `task_segments`; no faith-themed seed row created. Capability-only.
- **Misleading-UI flag:** None.

### Entry 30 — Line 42 — Recalculate tier blocks Edge Function
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** Consistent — Edge Function not created. No `recalculate-tier-blocks` function in `supabase/functions/`.
- **Misleading-UI flag:** None.

### Entry 31 — Line 139 — Haiku overview card generation (AI call) [duplicate of Entry 7]
- **Current:** 📌 Post-MVP
- **Proposed:** Keep 📌 Post-MVP
- **Rationale:** Same as Entry 7. Listed twice in Section 3; single registry line.
- **Misleading-UI flag:** None.

### Entry 32 — Line 153 — Out of Nest compose picker
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** [useMessagingPermissions.ts:58](src/hooks/useMessagingPermissions.ts#L58) contains an explicit TODO to fetch from `out_of_nest_members` — the hook currently only reads `family_members`. Under founder's rule, compose picker cannot reach Out of Nest members today. Note on line 153 already describes the extension point precisely; no rewrite needed.
- **Misleading-UI flag:** None — Out of Nest names simply don't appear in ComposeFlow picker today; no false suggestion that they do.

### Entry 33 — Line 230 — Drop old per-family BookShelf tables (Phase 1c)
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** Consistent — no DROP TABLE migration for the five per-family bookshelf_* tables; table row counts per live_schema.md confirm they are still populated (bookshelf_summaries 21538 rows, bookshelf_insights 24360, etc.). This is a scheduled cleanup, not a live feature gap.
- **Misleading-UI flag:** None.

### Entry 34 — Line 243 — Task unmark cascade
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** CLAUDE.md #206 confirms explicit non-implementation. Registry correctly marked. See also Entry 16 (line 438, which we propose flipping to align).
- **Misleading-UI flag:** None.

### Entry 35 — Line 266 — Tracker Goal page earning (widget data point consumption)
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** Build M delivered schema (`page_earning_tracker_widget_id` + threshold columns on `member_sticker_book_state`) + `roll_creature_for_completion` RPC branch. Widget picker wired. Data-point trigger that fires the RPC on widget threshold is not connected. Under founder's rule, page-unlock-on-tracker-goal does not fire in the app today.
- **Misleading-UI flag:** The GamificationSettingsModal likely offers "Tracker Goal" as a page earning mode choice — if so, the UI suggests it works. Flag for founder: **GamificationSettingsModal exposes page_earning_mode='tracker_goal' option; selecting it will not produce the advertised behavior because the data-point trigger is not wired.** Consistent with related stub 423 (Widget → Gamification progress, now Partially Wired per Finding F).

### Entry 37 — Line 447 — Notification auto-dismiss on queue processing
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** Consistent. Queue processing exists (Universal Queue Modal, Sort tab), but notification system integration to auto-dismiss related notifications is not built (notifications table has 0 rows per live_schema.md).
- **Misleading-UI flag:** None.

### Entry 38 — Line 448 — Gamification reward/streak reversal on unmark
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** Consistent with lines 243 and 438 (Entry 16 proposal). All three describe aspects of the unmark cascade that CLAUDE.md #206 explicitly names unimplemented.
- **Misleading-UI flag:** None.

### Entry 39 — Line 469 — `is_available_for_mediation` per-note toggle
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** Consistent — no `is_available_for_mediation` column created on any relationship-notes surface. Feature absent.
- **Misleading-UI flag:** None.

### Entry 40 — Line 476 — Full PRD-30 Layer 2 Haiku safety classification for ThoughtSift
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** Consistent — no `safety-classify` Edge Function in `supabase/functions/`; `safety_flags` table not present in live_schema.md. PRD-30 Safety Monitoring build not yet shipped. (See also Phase 0.25 residue lines 532-533 covering scan columns on lila_messages/lila_conversations — same PRD-30 dependency.)
- **Misleading-UI flag:** None.

### Entry 41 — Line 49 cluster — Essential tier stubs (entries 23-44, Foundation + LiLa)
- **Current:** Mixed Wired statuses
- **Proposed:** Keep all Wired statuses as-is
- **Rationale:** Section 3's row 41 is a batch confirmation (not a specific line) that Session 3 UI packets confirmed the Foundation/Auth/Permissions and LiLa-core clusters as Wired. Section 4 of the reconciliation draft lists 23-44 as confirmed-accurate. Under founder's rule, these features demonstrably work in the app (PIN login, View As, session timeout, LiLa drawer, Human-in-the-Mix, etc. — all verified in ongoing use).
- **Misleading-UI flag:** None.
- **Note:** This is a batch acknowledgement, not a specific line-level verdict. If founder wants per-line spot-checks of the cluster, those belong in Round 4 (confirmed-accurate spot-check), not Round 3.

### Entry 42 — Line 138 — Context staleness indicators
- **Current:** 📌 Post-MVP
- **Proposed:** Keep 📌 Post-MVP
- **Rationale:** Archives-side staleness indicators absent. LiLa-side has a "Refresh Context" button in `LilaContextSettings.tsx:267`, which is a different surface (manual refresh, not staleness indication). Archives scope of this entry is capability-only.
- **Misleading-UI flag:** None — no staleness indicator in Archives suggests one should exist.

### Entry 45 — Line 534 — Safe Harbor 'manage' permission preset
- **Current:** ⏳ Unwired (MVP)
- **Proposed:** Keep ⏳ Unwired (MVP)
- **Rationale:** Consistent — preset row exists in migration 19 (Full Partner preset, line 468), dormant until PRD-20 Safe Harbor frontend ships. No app-level Safe Harbor gating consumes the preset today. Covered by Phase 0.25 residue backfill.
- **Misleading-UI flag:** None — no UI exposes "manage Safe Harbor" capability.

---

## TYPE C — Founder judgment needed

### Entry 1 — Line 50 — LiLa Optimizer mode
- **Current:** ✅ Wired
- **Evidence summary:** `tests/guided-mode-registry.test.ts:24` confirms `optimizer` mode_key is seeded with display_name "LiLa Optimizer", sonnet tier, and `lila_optimizer` feature key. However, [PromptPackDetail.tsx:152](src/features/vault/components/detail/PromptPackDetail.tsx#L152) contains an explicit `// TODO: When PRD-05C Optimizer is built, launch LiLa Optimizer conversation modal` comment. WIRING_STATUS.md row 12 (referenced in synthesis) says "Stub | PRD-05C not built." Under founder's rule, the mode_key is seeded (half wired), but the full optimization conversation flow does not launch today.
- **Judgment question:** Should "LiLa Optimizer mode" on line 50 stay ✅ Wired (scope = mode_key seeded + mode switcher recognizes it) or flip to 🔗 Partially Wired / ⏳ Unwired (MVP) (scope = full optimizer flow deliverable to mom today)? The current wording "LiLa Optimizer mode" is ambiguous between the two scopes.

### Entry 4 — Line 102 — Dashboard widget for BI celebration
- **Current:** ⏳ Unwired (MVP)
- **Evidence summary:** `src/components/widgets/info/InfoFamilyIntention.tsx` is a built, functional widget that displays Family Best Intentions on the personal dashboard with a "You: X · Family: Y" tally for today. The stub title says "BI celebration" — an unclear name that doesn't directly correspond to "InfoFamilyIntention." The stub may refer to a separate planned widget (e.g., a celebration burst when a BI milestone is reached) rather than this display widget.
- **Judgment question:** Is `InfoFamilyIntention.tsx` the intended referent for this stub? If yes, flip to ✅ Wired and rename the stub to "Family Intention display widget." If no, keep ⏳ Unwired (MVP) and clarify the stub wording to describe what "BI celebration" actually means (e.g., "milestone confetti on Best Intention tally").

### Entry 11 — Line 269 — Timer goal earning mode
- **Current:** 📌 Post-MVP
- **Evidence summary:** Build M delivered 3 page earning modes including `tracker_goal` (CLAUDE.md Convention #210). "Timer goal" is not among the 4 creature earning modes (Convention #209) or the 3 page earning modes. The synthesis note flags a naming collision: is "Timer goal" a different unbuilt feature, or a stale name for what got built as `tracker_goal` where the tracker is a timer-duration widget?
- **Judgment question:** Is "Timer goal earning mode" the same feature as Build M's `tracker_goal` (where mom configures a timer-duration tracker threshold)? If yes, this stub is superseded — either flip to ❌ Superseded or flip to 🔗 Partially Wired (tracker_goal works, but timer-backed tracker_goal may have its own consumer gap per stub 266). If no, keep 📌 Post-MVP and clarify that "Timer goal" is a distinct unbuilt earning mode separate from tracker_goal.

### Entry 13 — Line 414 — Phase B tracker types (11 remaining)
- **Current:** ⏳ Unwired (MVP)
- **Evidence summary:** [src/types/widgets.ts:33](src/types/widgets.ts#L33) enumerates 10 Phase B-1 tracker types (not 11): `boolean_checkin`, `sequential_path`, `achievement_badge`, `xp_level`, `allowance_calculator`, `leaderboard`, `mood_rating`, `countdown`, `timer_duration`, `snapshot_comparison`. `TRACKER_TYPE_REGISTRY` shows Phase B entries with metadata (`phaseA: false`). Additionally, `log_learning` is known wired (used in `LogLearningModal.tsx`) and `color_reveal` was effectively delivered via Build M (`ColorRevealTallyWidget`). The count "11 remaining" is stale, and the status "Unwired" may be partially wrong depending on which specific trackers are considered shipped.
- **Judgment question:** Do any of the 10 Phase B-1 tracker types + `color_reveal` + `gameboard` + `randomizer_spinner` + `privilege_status` + `log_learning` render and accept user data in the app today? If some are wired, flip this stub to 🔗 Partially Wired and enumerate which remain unwired in a per-type inventory. If none of the Phase B set render beyond stubs, keep ⏳ Unwired (MVP) and correct the count from "(11 remaining)" to the actual remaining count.
- **Misleading-UI flag (conditional):** If `WidgetPicker.tsx` offers any Phase B tracker types in the type grid and selecting them produces a no-op or generic widget rather than the designed behavior, that is a misleading UI surface matching the founder's rule. Founder should verify by opening the Widget Picker and spot-checking a few Phase B options.

### Entry 25 (alt interpretation) — Line 515 — `homeschool_time_review` LiLa guided mode
- **Current:** 📌 Post-MVP
- **Evidence summary:** Migration 00000000100138 seeded the `homeschool_time_review` mode_key (2026-04-13 per commit context). [supabase/functions/homework-estimate/index.ts](supabase/functions/homework-estimate/index.ts) exists and is invoked from [LogLearningModal.tsx:69](src/features/financial/LogLearningModal.tsx#L69). The registry note specifically describes a *LiLa guided mode* for AI subject estimation "requires PRD-05 day-data context enhancement" — which is distinct from the Edge Function that is already invoked inline from Log Learning. So there are two overlapping things: (a) `homework-estimate` Edge Function, wired inline; (b) full `homeschool_time_review` LiLa guided-mode conversation experience, requires PRD-05 day-data dependency.
- **Judgment question:** The stub at line 515 as written is specifically about (b), the full LiLa guided-mode flow. It is correctly Post-MVP under that scope because (b) is not shipped. But the note "Infrastructure (Edge Function + seed data) exists per Session 4, committed 2026-04-13" in the synthesis draft is accurate about (a), which is a related but distinct capability. Does the founder want to:
  - (A) Keep 📌 Post-MVP and leave note unchanged (my TYPE B recommendation).
  - (B) Flip to ⏳ Unwired (MVP) to reflect that the mode_key + Edge Function now exist and only UI surface is pending.
  - (C) Split into two registry rows — one for the Edge Function (✅ Wired via homework-estimate inline call) and one for the full guided-mode flow (📌 Post-MVP).
- I flagged this TYPE C (even though I listed a TYPE B fallback above) because the synthesis draft itself recommends a flip that is defensible but founder-judgment-dependent.
