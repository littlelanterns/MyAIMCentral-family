---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-36-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-36 (source) ↔ PRD-03 (animation tokens + pulse animation), PRD-04 (floating bubble z-index in shell), PRD-09A (tasks.time_tracking_enabled + time_threshold_minutes), PRD-10 (widget Type 14 TimerDurationTracker), PRD-15 (timer_idle_reminder + timer_auto_paused notification types), PRD-22 (Settings Timer Settings section), PRD-24 (gamification auto-fire on threshold), PRD-27 (shift sessions via time_sessions per Convention #40), PRD-28 (homeschool_time_logs + hourly rate calculation)
Provenance: Worker `a2d6e6c40e38e7085` (Opus, report-only mode) ran the full evidence pass in-memory across the addendum + PRD-36 base + `src/features/timer/` (TimerProvider, useTimer, useTimerTick, useActiveTimers, useTimerActions) + FloatingBubble.tsx + VisualTimers.tsx + PlayModeTimer.tsx + TimerConfigPanel.tsx (509L) + IdleReminderBanner + InlineTaskTimerControls + TimerDurationTracker.tsx + TaskCard.tsx + LogLearningModal.tsx + migration `00000000000019_schema_remediation_batch2.sql` + SettingsPage.tsx grep + cross-reference to PRD-27 F-A shift-session bifurcation. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Walked the PRD-36 Cross-PRD Impact Addendum end-to-end against code reality. **The Universal Timer is the most completely schema-wired but least cross-PRD-integrated feature audited so far.** The core engine lives in `src/features/timer/` with `TimerProvider` correctly wrapping all 5 shells (Mom, Adult, Independent, Guided, Play), the `time_sessions` + `timer_configs` schema present per migration `00000000000019_schema_remediation_batch2.sql`, all 5 visual timer styles (`sand_timer|hourglass|thermometer|arc|filling_jar`) implemented in `VisualTimers.tsx`, the Play-mode age gate in `PlayModeTimer.tsx` as a client-only speed bump per Convention #37, and Task Card clock-in/Pomodoro controls wired in `TaskCard.tsx:615-621` against `time_tracking_enabled`. But **the cross-PRD integration layer the addendum describes is almost entirely absent**: (1) `time_session_completed` and `time_session_modified` are dispatched as `window.CustomEvent` in `useTimer.ts:218,295,328` but have **ZERO listeners anywhere** — no homeschool log consumer, no PRD-28 financial consumer, no PRD-24 gamification pipeline consumer, no PRD-10 widget data-point update; (2) `timer_idle_reminder` and `timer_auto_paused` **notification types do NOT exist in any migration, code, or notifications table** — addendum promises PRD-15 integration, code ships client-only `IdleReminderBanner` that bypasses PRD-15's delivery/preference infrastructure entirely; (3) "Timer Settings" section **does NOT exist in SettingsPage.tsx** — `TimerConfigPanel` component exists but is never imported by any page or settings route, making it a demo-only component analogous to the PRD-24 family pattern; (4) **Widget integration is absent** — `TimerDurationTracker.tsx:14` defines its OWN `timer_mode?: 'manual' | 'start_stop' | 'both'` field that is semantically disjoint from `time_sessions.timer_mode`, has no [▶ Start] button calling `useTimerActions`, and records directly to `widget_data_points`; (5) **LogLearning "Use Timer" button has NO onClick handler** — dead UI. **Primary F11-relevant finding is RLS scope drift**: PRD-36 Visibility table L407-412 says "Dad reads children if permitted. Special Adults read/write assigned children during shift." Migration ships only `primary_parent_id = auth.uid()` (mom) + `family_member_id IN family_members WHERE user_id = auth.uid()` (self) — **there is NO dad-read-permitted-children policy, NO Special Adult shift-window read/write policy**. Combined with EVIDENCE_prd27 F-A, Special Adult shift start writes rows that cannot be re-read by the child they were started for. **Primary SCOPE-3 consolidation**: "Timer primitive layer is fully wired; cross-PRD integration surface is dispatched to void."

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | **PRD-09A: `time_tracking_enabled` + `time_threshold_minutes` on tasks; task card timer controls** | Addendum L11-18 + L20-22 | Both columns present. `TaskCard.tsx:208` reads `time_tracking_enabled`; L615-621 renders inline `InlineTaskTimerControls` with `[Clock In]` + `[Pomodoro]` buttons → `startTimer({mode:'clock'\|'pomodoro_focus', taskId})`. `timer_advanced` tier gate applied. Wired end-to-end. **Missing piece: no `time_threshold_reached` event detection, no auto-completion on threshold reached.** Grep `time_threshold_minutes` only appears in schema; no listener on `time_session_completed` checks it. | Partial-Fix-Code (primitives wired, threshold-completion-trigger absent) | **SCOPE-3** Low | N |
| 2 | **PRD-10: Timer/Duration Logger widget consumes `time_sessions`; [▶ Start] button creates `time_sessions` with `widget_id`** | Addendum L30-38 | `TimerDurationTracker.tsx:14` declares its OWN disjoint `timer_mode?: 'manual' \| 'start_stop' \| 'both'` config field (not `time_sessions.timer_mode`). Records via `onRecordData` → `widget_data_points`. **No `useTimerActions` usage. No `startTimer` call. Grep `useTimerActions\|startTimer` across `src/components/widgets/` returns zero matches.** `widget_id` FK on `time_sessions` exists but is never populated. | Unintentional-Fix-Code | **SCOPE-3** Medium | N |
| 3 | **PRD-04: Floating bubble z-index above content + QuickTasks (z-40), below modals + bottom sheets** | Addendum L45-52 | `FloatingBubble.tsx:258,298` sets `zIndex: 35`. **Below BottomNav (z-40)**. On mobile, bubble is physically above BottomNav via `bottom: 72` offset but z-ordering places it UNDER the nav for any overlap case. Addendum requires bubble ABOVE QuickTasks — spec drift. | Unintentional-Fix-Code | **SCOPE-3** Low | N |
| 4 | **PRD-15: `timer_idle_reminder` + `timer_auto_paused` notification types through PRD-15 delivery; "Timer Reminders" category in preferences** | Addendum L60-70 | **Grep `timer_idle_reminder\|timer_auto_paused\|Timer Reminders\|timer_reminder` across `supabase/` + `src/` = ZERO matches.** No notification type registered. No preference category. Idle handling is client-only `IdleReminderBanner` at `TimerProvider.tsx:298-354` — fixed top banner, no push delivery, no DB row, no Do Not Disturb integration. Auto-pause fires no notification at all. | Unintentional-Fix-Code (bypasses PRD-15 infrastructure) | **SCOPE-3** Medium | N |
| 5 | **PRD-22: "Timer Settings" section in Settings with family defaults + per-child configuration** | Addendum L74-84 | `TimerConfigPanel.tsx` exists (509 lines, feature-complete per-child config UI). **Grep `TimerConfigPanel` in `src/pages/` = 0 matches.** `SettingsPage.tsx` has no `Timer` string and no navigation row linking to the panel. Component orphaned — demo-only. | Unintentional-Fix-Code | **SCOPE-3** Medium | N |
| 6 | **PRD-03: Floating bubble component design spec + visual timer animation tokens + pulse animation** | Addendum L90-101 | `FloatingBubble.tsx` implements draggable, edge-snapping bubble with theme-token colors + `timerBubblePulse 2.4s` active animation. `VisualTimers.tsx:803-815` implements all 5 styles via CSS/SVG consuming theme tokens. Strong positive. | Documented (strong positive) | — | — |
| 7 | **PRD-24: Timer-triggered completion fires same `task_completed` event as manual** | Addendum L111-118 | **Structurally cannot fire** — no `time_threshold_reached` detection (seam #1) + `time_session_completed` listener absent → no automated path from timer to `task_completions` row → gamification pipeline untriggered-by-timer. Manual `[⏹ Done]` button is the only completion path. | Partial-Fix-Code (cascading from seam #1) | **SCOPE-3** Low | N |
| 8 | **PRD-28: `time_session_completed` event consumed to create `homeschool_time_logs`** | Addendum L123-135 | **Event dispatched at `useTimer.ts:218` but has ZERO listeners.** Grep `addEventListener.*time_session\|time_session_completed.*listener` across `src/` + `supabase/functions/` = zero. Homeschool time logs are created by the `LogLearningModal.tsx` manual flow; LogLearning's "Use Timer" button at L304-310 has **no onClick handler — dead UI**. | Unintentional-Fix-Code | **SCOPE-3** Medium | N |
| 9 | **`time_session_completed` event as integration pattern — consumers listen independently** | Addendum L554-561 + PRD-36 §Decisions #13 | Pattern IS wired on emission side (`useTimer.ts:218,295,328`) but has **zero listeners anywhere**. Pure dead-letter dispatch. Same for `time_session_modified`. | Unintentional-Fix-Code | **SCOPE-3** Medium (consolidation of #7 + #8 + #2) | N |
| 10 | **Play mode age gate: speed bump, not security** | Convention #37 | `PlayModeTimer.tsx:46-120` ships `AgeGate` with `useState`-backed selection, any 18+ unlocks → `QuickStartScreen`, under-18 → `UnderAgeMessage`. No persistence. Matches spec. | Documented (strong positive) | — | — |
| 11 | **Multiple concurrent timers supported, badge count when >1** | Addendum L33 + Convention #34 | Schema allows unlimited rows per member. `FloatingBubble.tsx:308` renders single Clock icon without explicit badge (active count visible via `activeTimers.length` prop but no visual badge number — addendum spec Screen 1 shows "③" badge). | Partial-Fix-Code (concurrent data layer works; badge UI incomplete) | **SCOPE-3** Low | N |
| 12 | **Soft delete only** | Convention #36 + Addendum L343 | `useTimer.ts:308-337` `deleteSession` sets `deleted_at`; `useActiveTimers.ts:47` filters `.is('deleted_at', null)`. Matches spec. | Documented (strong positive) | — | — |
| 13 | **Timestamp-based, not client-side** | Convention #32 + Addendum line 20 | `useTimer.ts:158` `started_at: new Date().toISOString()` server-timestamped on insert; `useTimerTick.ts:441` computes `elapsed = now - started_at` from DB value; `useActiveTimers` refetches every 5s for cross-device sync. Matches spec. | Documented (strong positive) | — | — |
| 14 | **RLS policies cover dad + Special Adult per PRD-36 §Visibility** | PRD-36 L405-423 + migration `…000019:78-99` | Shipped policies: `ts_manage_primary_parent` (mom all) + `ts_select_own` / `ts_insert_own` / `ts_update_own` (self based on `user_id=auth.uid()`). **NO `member_permissions`-based dad policy. NO Special Adult shift-window policy. NO `started_by IN family_members` alternate grant on SELECT.** Dad cannot view permitted child's timer history. Special Adult who wrote a shift session to `time_sessions` via Convention #40 cannot re-read the child's running timers. | Unintentional-Fix-Code (F11 adjacent) | **SCOPE-8b** Low + **SCOPE-3** cross-ref | N |

## Unexpected findings list

1. **`time_session_completed` + `time_session_modified` events are dispatched into a void.** Zero listeners across `src/` and `supabase/functions/`. The entire "loose coupling integration pattern" from PRD-36 Decision #13 is aspirational.

2. **`TimerConfigPanel.tsx` is a 509-line orphaned demo-only component.** Same pattern as 9 demo-only components cataloged in PRD-24 family.

3. **`LogLearningModal.tsx:304-310` "Use Timer" button has no onClick handler** — dead UI. Addendum L131 explicitly says the button invokes PRD-36 clock mode.

4. **TimerDurationTracker (widget Type 14) defines its own disjoint `timer_mode` field** (`manual|start_stop|both`) semantically unrelated to `time_sessions.timer_mode` (`clock|pomodoro_focus|pomodoro_break|stopwatch|countdown`). Two timer architectures shipped in parallel.

5. **No time_threshold auto-completion mechanism exists.** PRD-36 §Flows L545 says "When a time threshold is reached, the timer emits a `threshold_reached` event." Grep returns zero matches.

6. **RLS on `time_sessions` silently denies dad/Special Adult/teen-cross-family.** Combined with PRD-27 F-A's `shift_sessions` read-mismatch, the Special Adult shift workflow is doubly-broken.

7. **BottomNav z-40 is above FloatingBubble z-35.** On mobile, z-ordering contradicts addendum L50.

## Proposed consolidation (§5.1 + §5.2 candidates)

**§5.1 within-addendum:**

- Seams #2 + #4 + #5 + #8 + #9 share root cause: **"PRD-36 primitive engine is wired; cross-PRD integration surfaces are dispatched to void or left demo-only."** Consolidate.
- Seams #1 + #7 + #11 share root cause: **"Timer completion-side integrations (threshold detection, badge count, gamification auto-fire) partially wired."** Consolidate.
- Seam #3 stands alone as Low design drift.
- Seam #14 stands alone as SCOPE-8b + SCOPE-3 RLS gap.
- Seams #6, #10, #12, #13 strong positives.

After §5.1: **3 SCOPE-3 findings** + **1 SCOPE-8b Low** + **4 documented positives**.

**§5.2 cross-addendum candidates:**

**A. "Demo-only component pattern" — PRD-36 contributes a 4th addendum.**

| Addendum | Demo-only components |
|---|---|
| PRD-24 | TreasureBoxIdle |
| PRD-24A | 2 (evolution-flipbook adjacent) |
| PRD-24B | 8 |
| **PRD-36 (new)** | **TimerConfigPanel orphaned; LogLearning "Use Timer" dead onClick** |

**ESCALATE** — strengthens the existing cross-addendum consolidation.

**B. "Event dispatched into void / consumer-side absent" pattern — NEW SIGNAL.**

Only 2 occurrences so far (PRD-24 uncomplete-cascade TODO + PRD-36 time_session events). Watch for 3rd.

**C. "Timer-adjacent settings orphaned"** reinforces PRD-22 F-B cross-addendum consolidation.

**D. "F11 server-side enforcement" — PRD-36 contributes 1 new surface** (RLS `user_id=auth.uid()` only, no dad/Special Adult policies). **Pattern now at 8 surfaces — SATURATED.**

**E. "Client-only implementation bypasses PRD-15 notification infrastructure" — NEW SIGNAL.**

## Proposed finding split

- **F-A: PRD-36 engine is fully wired but cross-PRD integration surfaces dispatch to void** (consolidates seams #2+#4+#5+#8+#9). **Unintentional-Fix-Code. SCOPE-3 Medium. Beta N.**
- **F-B: Timer completion-side integrations partially wired** (consolidates seams #1+#7+#11). **Partial-Fix-Code. SCOPE-3 Low. Beta N.**
- **F-C: `time_sessions` RLS lacks dad/Special Adult policies** (seam #14). Combined with EVIDENCE_prd27 F-A. **Unintentional-Fix-Code. SCOPE-8b Low + SCOPE-3 cross-ref. Beta N.**
- **F-D: FloatingBubble z-index 35 is below BottomNav z-40** (seam #3). **Unintentional-Fix-Code. SCOPE-3 Low. Beta N.** Informational.

**Expected final cardinality: 3 SCOPE-3 findings + 1 SCOPE-8b Low + 4 documented positives.**

## Beta Y candidates

**Zero Beta-Y candidates from this surface.** All SCOPE-3 findings are integration-drift. The single SCOPE-8b finding (F-C) is theoretically a permission gap but practically mitigated.

## Top 3 surprises

1. **The `time_session_completed` event is dispatched but has literally zero listeners in the entire codebase.** PRD-36 Decision #13 calls this "the integration pattern — loose coupling." In reality, the events fire into a void.

2. **The `TimerDurationTracker` widget has its OWN `timer_mode` field semantically unrelated to `time_sessions.timer_mode`** — two timer architectures ship in parallel.

3. **LogLearning's "Use Timer" button has no `onClick` handler** — pure dead UI. Addendum L131 explicitly specifies the button invokes PRD-36's clock mode.

## Watch-flag hits

- **F11 server-side enforcement — DIRECT HIT on F-C.** Cross-addendum F11 pattern now at **8 surfaces — SATURATED. ESCALATE.**
- **Crisis Override** — N/A.
- **F17 messaging / Notification** — Partial hit. PRD-36's `timer_idle_reminder` + `timer_auto_paused` notification types do NOT exist. Covered by consolidated F-A.
- **F22+F23 archive column drift** — N/A.
- **studio_queue source discipline** — N/A.
- **`is_included_in_ai` three-tier propagation** — N/A.
- **Convention #35 (5 visual timer styles)** — **DIRECT POSITIVE HIT.** `sand_timer|hourglass|thermometer|arc|filling_jar` confirmed present.
- **Convention #36 (soft delete only)** — **DIRECT POSITIVE HIT.**
- **Convention #37 (Play age gate, client speed bump)** — **DIRECT POSITIVE HIT.**
- **Convention #40 cross-ref** — Timer is the underlying `time_sessions` table that PRD-27 shift sessions write to. F-C compounds with EVIDENCE_prd27 F-A.
- **Demo-only component pattern (cross-addendum)** — **STRONG HIT.** 4th addendum.
- **Event dispatched to void pattern (NEW)** — 2 occurrences. Watch for 3rd.

## Orchestrator adjudication

(empty — pending walk-through)
