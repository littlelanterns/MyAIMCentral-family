# Phase B Tracker Types — Wired/Stub/Misleading UI Inventory

> Produced 2026-04-20 by Scope 5 Round 3 walk-through, Entry 4 (registry line 414).
> Scope: every non-Phase-A-or-borderline-Phase-A tracker_type value called out for
> investigation under the founder's "if it doesn't work in the app, it is not wired"
> rule.

## Source enumeration

From [src/types/widgets.ts](src/types/widgets.ts):

- Phase B-1 union (line 33): `boolean_checkin`, `sequential_path`, `achievement_badge`,
  `xp_level`, `allowance_calculator`, `leaderboard`, `mood_rating`, `countdown`,
  `timer_duration`, `snapshot_comparison` — **10 types**.
- Additional types flagged `phaseA: false` in `TRACKER_TYPE_REGISTRY`: `color_reveal`,
  `gameboard`, `log_learning` — **3 types**.
- Task prompt also requested coverage of `randomizer_spinner` and `privilege_status`
  (registry marks both `phaseA: true`, but they were listed for verification) — **2 types**.

Total covered: **15 types**.

Registry row 414's parenthetical "(11 remaining)" is stale — the actual Phase B-1
union count is 10, and the additional Phase-B-category types (color_reveal, gameboard,
log_learning) bring the conceptual Phase B set to 13.

## Verification method

For each type:
1. Component file existence under [src/components/widgets/trackers/](src/components/widgets/trackers/).
2. Case branch in [src/components/widgets/WidgetRenderer.tsx](src/components/widgets/WidgetRenderer.tsx) `switch (widget.template_type)` (lines 54-95).
3. Presence in [src/components/widgets/WidgetPicker.tsx](src/components/widgets/WidgetPicker.tsx) `PICKER_CATEGORIES` array (lines 32-41) — this is what determines whether the type is offered in the picker UI.
4. If offered in picker, trace the click path: the picker builds a synthetic `WidgetStarterConfig` with the tracker type and calls `onSelectStarterConfig` (lines 247-269). This creates a `DashboardWidget` row. When rendered, `WidgetRenderer` dispatches on `template_type`. If no case branch matches, fallthrough to `default` which returns `PlannedTrackerStub` — a "Coming soon" placeholder.

---

## Summary counts

- **Wired:** 13
- **Stub (honest absence):** 0
- **Misleading UI (offered in picker but non-functional):** 2

---

## Per-type inventory

### boolean_checkin
- **Render component:** [src/components/widgets/trackers/BooleanCheckinTracker.tsx](src/components/widgets/trackers/BooleanCheckinTracker.tsx) (252 lines)
- **Functional:** yes — toggles today's boolean data point via `onRecordData`, supports `simple_toggle` + `calendar_dots` variants
- **In WidgetPicker grid:** yes — `routine_trackers` category
- **Click behavior:** Creates widget with `template_type='boolean_checkin'`; WidgetRenderer line 66 routes to `BooleanCheckinTracker`
- **Verdict:** WIRED

### sequential_path
- **Render component:** [src/components/widgets/trackers/SequentialPathTracker.tsx](src/components/widgets/trackers/SequentialPathTracker.tsx) (300 lines)
- **Functional:** yes — reads `config.steps`, computes current step from data points, supports step completion
- **In WidgetPicker grid:** yes — `goal_pursuit` and `skill_tracking` categories
- **Click behavior:** WidgetRenderer line 68 routes to `SequentialPathTracker`
- **Verdict:** WIRED

### achievement_badge
- **Render component:** [src/components/widgets/trackers/AchievementBadgeTracker.tsx](src/components/widgets/trackers/AchievementBadgeTracker.tsx) (227 lines)
- **Functional:** yes — DEFAULT_BADGES fallback, earned-badge tracking via data point metadata
- **In WidgetPicker grid:** yes — `achievement_recognition` category
- **Click behavior:** WidgetRenderer line 70 routes to `AchievementBadgeTracker`
- **Verdict:** WIRED

### xp_level
- **Render component:** [src/components/widgets/trackers/XpLevelTracker.tsx](src/components/widgets/trackers/XpLevelTracker.tsx) (194 lines)
- **Functional:** yes — component renders XP progress
- **In WidgetPicker grid:** yes — `achievement_recognition` category
- **Click behavior:** WidgetRenderer line 72 routes to `XpLevelTracker`
- **Verdict:** WIRED

### allowance_calculator
- **Render component:** [src/components/widgets/trackers/AllowanceCalculatorTracker.tsx](src/components/widgets/trackers/AllowanceCalculatorTracker.tsx) (238 lines)
- **Functional:** yes — full calculator UI
- **In WidgetPicker grid:** yes — `reward_allowance` category
- **Click behavior:** WidgetRenderer line 76 routes to `AllowanceCalculatorTracker`
- **Verdict:** WIRED

### leaderboard
- **Render component:** [src/components/widgets/trackers/LeaderboardTracker.tsx](src/components/widgets/trackers/LeaderboardTracker.tsx) (180 lines)
- **Functional:** yes — multi-member ranking with period filter (daily/weekly/monthly)
- **In WidgetPicker grid:** yes — `family_social` category
- **Click behavior:** WidgetRenderer line 78 routes to `LeaderboardTracker`
- **Verdict:** WIRED

### mood_rating
- **Render component:** [src/components/widgets/trackers/MoodRatingTracker.tsx](src/components/widgets/trackers/MoodRatingTracker.tsx) (178 lines)
- **Functional:** yes — 1-5 scale daily mood check-in
- **In WidgetPicker grid:** yes — `reflection_insight` category
- **Click behavior:** WidgetRenderer line 80 routes to `MoodRatingTracker`
- **Verdict:** WIRED

### countdown
- **Render component:** [src/components/widgets/trackers/CountdownTracker.tsx](src/components/widgets/trackers/CountdownTracker.tsx) (197 lines)
- **Functional:** yes — target-date countdown
- **In WidgetPicker grid:** yes — `goal_pursuit` category + featured in `HUB_WIDGET_RECOMMENDATIONS`
- **Click behavior:** WidgetRenderer line 82 routes to `CountdownTracker`
- **Verdict:** WIRED

### timer_duration
- **Render component:** [src/components/widgets/trackers/TimerDurationTracker.tsx](src/components/widgets/trackers/TimerDurationTracker.tsx) (353 lines)
- **Functional:** yes — substantial implementation tracking time spent on activities
- **In WidgetPicker grid:** yes — `routine_trackers` category
- **Click behavior:** WidgetRenderer line 74 routes to `TimerDurationTracker`
- **Verdict:** WIRED

### snapshot_comparison
- **Render component:** [src/components/widgets/trackers/SnapshotComparisonTracker.tsx](src/components/widgets/trackers/SnapshotComparisonTracker.tsx) (297 lines)
- **Functional:** yes — before/after snapshots
- **In WidgetPicker grid:** yes — `goal_pursuit` category
- **Click behavior:** WidgetRenderer line 84 routes to `SnapshotComparisonTracker`
- **Verdict:** WIRED

### color_reveal
- **Render component:** **ABSENT from [src/components/widgets/trackers/](src/components/widgets/trackers/)** — no `ColorRevealTracker.tsx` file. Build M's [ColorRevealTallyWidget.tsx](src/components/coloring-reveal/ColorRevealTallyWidget.tsx) is a DIFFERENT, dashboard-direct surface (imported and rendered outside the widget grid in [Dashboard.tsx:706](src/pages/Dashboard.tsx#L706), [GuidedDashboard.tsx:205](src/pages/GuidedDashboard.tsx#L205), [PlayDashboard.tsx:307](src/pages/PlayDashboard.tsx#L307)). It is NOT reachable via the PRD-10 widget-picker → WidgetRenderer path.
- **Functional:** N/A for this tracker_type path
- **In WidgetPicker grid:** **YES** — listed in `PICKER_CATEGORIES` under `goal_pursuit` ([WidgetPicker.tsx:34](src/components/widgets/WidgetPicker.tsx#L34))
- **Click behavior:** Creates widget with `template_type='color_reveal'`. WidgetRenderer has NO case branch for it, so falls through to `default` (line 94) → `PlannedTrackerStub` renders a Clock icon, the label "Color Reveal", and the text **"Coming soon"**. Mom selected the widget expecting Build M's color-reveal experience; she gets a "Coming soon" stub instead. The two systems are architecturally disconnected.
- **Verdict:** **MISLEADING UI**

### gameboard
- **Render component:** **ABSENT** — no `GameboardTracker.tsx` file in [src/components/widgets/trackers/](src/components/widgets/trackers/)
- **Functional:** N/A
- **In WidgetPicker grid:** **YES** — listed in `PICKER_CATEGORIES` under `goal_pursuit` ([WidgetPicker.tsx:34](src/components/widgets/WidgetPicker.tsx#L34))
- **Click behavior:** Creates widget with `template_type='gameboard'`. WidgetRenderer has no case branch → `default` → `PlannedTrackerStub` "Coming soon". Same pattern as color_reveal.
- **Verdict:** **MISLEADING UI**

### randomizer_spinner
- **Render component:** [src/components/widgets/trackers/RandomizerSpinnerTracker.tsx](src/components/widgets/trackers/RandomizerSpinnerTracker.tsx) (315 lines)
- **Functional:** yes
- **In WidgetPicker grid:** NOT in `PICKER_CATEGORIES` array, but registry entry has `phaseA: true` so it may flow through a different picker path (Studio [Customize] tracker widget flow per WIRING_STATUS.md). Widget offering is at minimum partially available.
- **Click behavior:** WidgetRenderer line 88 routes to `RandomizerSpinnerTracker` — dispatch works if any path creates a widget with this template_type.
- **Verdict:** WIRED (registry classifies as Phase A; not in scope for line 414's "Phase B" complaint regardless)

### privilege_status
- **Render component:** [src/components/widgets/trackers/PrivilegeStatusTracker.tsx](src/components/widgets/trackers/PrivilegeStatusTracker.tsx) (150 lines)
- **Functional:** yes
- **In WidgetPicker grid:** yes — `reward_allowance` category ([WidgetPicker.tsx:36](src/components/widgets/WidgetPicker.tsx#L36))
- **Click behavior:** WidgetRenderer line 90 routes to `PrivilegeStatusTracker`
- **Verdict:** WIRED (registry classifies as Phase A; not in scope for line 414 regardless)

### log_learning
- **Render component:** [src/components/widgets/trackers/LogLearningTracker.tsx](src/components/widgets/trackers/LogLearningTracker.tsx) (230 lines)
- **Functional:** yes — homework time logging with subject breakdown, used in [LogLearningModal.tsx](src/features/financial/LogLearningModal.tsx)
- **In WidgetPicker grid:** yes — `reflection_insight` category ([WidgetPicker.tsx:38](src/components/widgets/WidgetPicker.tsx#L38))
- **Click behavior:** WidgetRenderer line 92 routes to `LogLearningTracker`
- **Verdict:** WIRED

---

## Conclusion

**Registry line 414's "(11 remaining)" is dramatically stale.** Under the founder's rule,
only 2 genuinely unbuilt types remain — `color_reveal` and `gameboard` — and both are
**misleading-UI** cases because the WidgetPicker offers them under the `goal_pursuit`
category but selecting either produces a "Coming soon" `PlannedTrackerStub` widget
rather than the designed behavior.

Build M's `ColorRevealTallyWidget` is a distinct, dashboard-direct surface and does
NOT resolve the tracker-type → WidgetRenderer → color_reveal case. The two systems
share a name but not a code path.

### Recommended Registry verdict for line 414

**Flip ⏳ Unwired (MVP) → 🔗 Partially Wired** with per-type enumeration in the note
AND a misleading-UI flag.

Proposed note wording:

> 10 Phase B-1 tracker types are fully wired: `boolean_checkin`, `sequential_path`,
> `achievement_badge`, `xp_level`, `allowance_calculator`, `leaderboard`, `mood_rating`,
> `countdown`, `timer_duration`, `snapshot_comparison`. `log_learning` is also wired.
> **Remaining unbuilt: `color_reveal`, `gameboard` — MISLEADING UI.** Both are offered
> in WidgetPicker under the `goal_pursuit` category; selecting either creates a widget
> whose WidgetRenderer fall-through is `PlannedTrackerStub` ("Coming soon"). Build M's
> `ColorRevealTallyWidget` is a separate dashboard-direct surface, not reachable from
> the widget-picker path. Remove `color_reveal` and `gameboard` from
> `PICKER_CATEGORIES.goal_pursuit.trackerTypes` to remove the misleading surface, or
> route `template_type='color_reveal'` to Build M's component in WidgetRenderer.

### Misleading-UI flag for the registry stub

Yes — this stub triggers the founder's misleading-UI rule for `color_reveal` and
`gameboard`. Two remediation options for the split:

1. **Surface-removal (safer):** Delete `color_reveal` and `gameboard` from the
   `goal_pursuit.trackerTypes` array in `WidgetPicker.tsx`. The stub stays honest at
   🔗 Partially Wired with those two still pending; no misleading picker offer.
2. **Code-path bridge (requires design thought):** Add a case branch in WidgetRenderer
   for `template_type='color_reveal'` that routes to Build M's `ColorRevealTallyWidget`
   (or a thin adapter). This promotes color_reveal to WIRED and leaves gameboard as
   the only remaining misleading-UI item.

Founder decides which remediation path to take.
