# Pre-Dispatch Pack — TRKG: Tracker Goals & Gamification-Mode Honesty

> **Factory status:** synthesized → decisions-pending (3 decisions, batch 7)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: TRKG. Priority: P4.
> Evidence: `claude/dispatch-factory/TRKG-RSTP-RECON.md`.
> **HEADLINE: the gamification earning-mode settings are UI theater.** The live Connector
> godmothers implement 1 of the 4 creature-earning modes and 2 of the 3 page-earning modes mom
> can configure — the "Tracker Goal" branch was silently dropped in the Phase-3 rewrite, and the
> creature godmother ignores the mode column entirely. Meanwhile no tracker has ever fired a
> goal reward: the streak-goal/prize fields shipped in KIDS-REWARDS S4 are write-only, and the
> "Goal reached!" banner some trackers show is a client-side illusion with no award behind it.
> This pack = goal detection done right + the mode-honesty repair, in one build.

## Rulings

1. **Mechanism (D-TRKG-1): Connector event + ONE centralized detection RPC.**
   `useRecordWidgetData` fires a deed (`source_type='widget_data_point'` — reserved in the
   schema since 100199) and one seeded per-kid contract (`if_pattern='every_time'`) dispatches a
   new `tracker_goal` godmother. THE GODMOTHER does the detection: reads the widget's config per
   tracker type (streak-walk for streak; SUM(value) vs target for tally/percentage —
   **explicitly resolving D6's COUNT-vs-SUM ambiguity in favor of value-sum semantics**),
   awards `earned_prizes` (`source_type='widget'`, idempotent per widget+goal-crossing), and
   advances page-unlock where `page_earning_mode='tracker_goal'`. No contract-per-widget
   auto-authoring (no precedent, needless complexity); no client-side detection (the TS "goal
   reached" banners become displays of server truth).
2. **Mode-blindness repair is IN SCOPE (D-TRKG-2)** — the pack's second pillar:
   `execute_creature_godmother` gains the 4-mode branching (`random_per_task` /
   `every_n_completions` / `segment_complete` / `complete_the_day`) reading
   `member_sticker_book_state` as the config source of truth; `execute_page_unlock_godmother`
   regains `tracker_goal` and reads the state table's `page_earning_mode`. Base every rewrite on
   the CURRENT production bodies (migration 100225 lineage — guard-ledger discipline).
   Conventions #209/#210 get honesty amendments; STUB:334's stale-false text corrected.
3. **Scope discipline (D-TRKG-3):** multiplayer layer, Track This flow, gameboard, linked pairs,
   timer→widget feed stay OUT (they're PRD-10 Phase B features, not goal detection) — honestly
   re-registered. The `color_reveal`/`gameboard` WidgetPicker entries that dead-end into
   "Coming soon" are REMOVED from the picker (misleading-UI fix; the types return when built).
4. **Convention #271 obligation honored:** touching widget event recording triggers the
   grandfathered-surface rule — this build extends `get_member_day_obligations` Layer 2 with
   `source_type='tracker_event'` (additive UNION branch; the return shape already carries the
   fields) and the recording path consumes it where day-scoping matters.
5. **D2 resolved at build:** targeted check for any widget-milestone→victory writer; none found
   in recon → row 182's "✅ Wired" corrected, and milestone victories fire through the new
   godmother (celebration-only, additive per #199 — a failed roll never blocks the data point).
6. `useRewardProvenance` gains `'widget'` (RSTP adds `'routine_step'`; second-lander merges).

## Slice plan (single Sonnet worker)
| Slice | Scope | Routing |
|---|---|---|
| 1 | Migration: tracker_goal godmother + deed wiring contract seeds + creature/page godmother mode-branching rewrites (CURRENT bodies) + Layer 2 tracker_event extension | Sonnet xhigh + rls-verifier |
| 2 | `useRecordWidgetData` deed firing (never-throws, additive per #199) + WidgetConfiguration goal-field completeness per tracker type + picker honesty removals + provenance extension | Sonnet xhigh |
| 3 | E2E (`tests/e2e/features/tracker-goals.spec.ts`: streak crosses goal_days → prize awarded once, idempotent on re-record; tally SUM-semantics probe (a value>1 record counts by value); tracker_goal page unlock; each creature mode behaves per config — the 4-mode matrix; failed-roll-never-blocks probe) + registry/convention corrections + verification | Sonnet xhigh |
| Gates | Checkpoint 5 | **Fable if available, else Opus** |

## Open founder decisions (batch 7)
| # | Decision | Recommendation |
|---|---|---|
| D-TRKG-1 | Connector event + centralized detection godmother (SUM-semantics) | Yes — uses the machinery the schema reserved for exactly this |
| D-TRKG-2 | Mode-blindness repair in scope (4 creature + 3 page modes become real) | Yes — mom's settings must do what they say |
| D-TRKG-3 | Phase-B features stay out; misleading picker entries removed | Yes — this pack is goals + honesty, not all of PRD-10 |

## Dependency edges
Consumes KIDS-REWARDS Slice-1 earned-prizes pipe (shipped). Touches migration-100225 lineage
(coordinate if any parallel session edits godmothers). RSTP shares useRewardProvenance.
Convention #271 Layer-2 extension is this build's contribution to the canonical query.

---

## DISPATCH PROMPT (paste into a FRESH session — after batch-7 decisions resolve)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for TRKG — tracker goals + gamification-mode honesty. Pack:
claude/dispatch-factory/TRKG.md (6 rulings + 3-slice plan). Evidence:
claude/dispatch-factory/TRKG-RSTP-RECON.md (TRKG section — file:line map). Decisions RESOLVED
per recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; base EVERY godmother
rewrite on the CURRENT production function bodies (100225 lineage — the copy-stale-body failure
mode is documented in the KIDS-REWARDS build file; check for later revisions first); re-verify
recon refs (useWidgets.ts:198-237, WidgetConfiguration streak/sequential prize fields, 100206
if_pattern implementations); check whether RSTP landed (useRewardProvenance merge); next free
migration number before every push.

READ FIRST: (1) prds/personal-growth/PRD-10-Widgets-Trackers-Dashboard-Layout.md — Screen 4 +
outgoing-flows + stubs sections; (2) CLAUDE.md Conventions #198-222 (gamification law — esp.
#199 additive-never-load-bearing, #219 never-taken-away) + #271; (3) the pack + recon. Create
.claude/rules/current-builds/TRKG-tracker-goals.md (no YAML frontmatter), pre-build summary,
founder approval BEFORE code.

HARD RULES: gamification is ADDITIVE — a failed deed/roll NEVER blocks the data-point write
(#199 try/catch pattern); awards are never revoked (#219); detection is SERVER-side SUM/streak
semantics (ruling 1 — the E2E value>1 probe is load-bearing); godmothers read
member_sticker_book_state as mode truth; idempotency per widget+crossing (UNIQUE key);
Convention #271 Layer-2 tracker_event extension ships (extend the SAME function, never a new
one); picker honesty removals; Convention #257 dates.

PROOF: tests/e2e/features/tracker-goals.spec.ts per the pack list + tsc -b + lint +
kids-rewards slice pins (you touch the prize pipe — ask the founder before shared-fixture
suites). NOTHING COMMITS until green + founder eyes-on (eyes-on: set a 3-day streak goal with a
prize on a real kid's tracker, cross it, watch the prize appear in My Rewards; flip a creature
mode and see behavior actually change). Selective staging; founder confirms before push.
Close-out: Checkpoint 5, STUB corrections (334 stale-false, 182-vs-501 contradiction, 493
picker rows), Convention #209/#210 honesty amendments, R2 follow-up row → Wired, archive.
```
