# Claude Code → claude.ai Sync — 2026-06-09

> Purpose: reorient claude.ai. Its last knowledge ends 2026-05-30, mid-Worker-5 (5A–5E) of the
> View-As Identity-Scope Architecture build, with three open items: (1) Reflections privacy
> filtering deferred, (2) ViewAsBanner Switch-button hide approved but possibly UI-only,
> (3) gate #11 runtime-timeout verification undecided (manual runbook vs Playwright).
> Everything below is what happened since.

---

## 1. View-As Identity-Scope Architecture — CLOSED 2026-06-04

The build claude.ai last saw in flight is finished, signed off, and archived
(`.claude/completed-builds/2026-06/view-as-identity-scope-architecture.md`).

**Resolution of the three open items it was tracking:**
- **Gate #11 (timeout verification):** resolved via Worker 5C + 5D. 5C shipped `useViewAsTimeout`
  (15-min idle, 2-min non-blocking warning banner + "I'm still here" reset) mounted in
  `ViewAsModal`, verified. 5D answered the runbook-vs-Playwright question with **Playwright**:
  two Discipline-1 smoke tests covering BOTH `view_as_sessions.origin` write paths
  (`mom_viewing` and `member_session`), DB-verified against production rows.
- **Switch-button hide below the UI layer:** the origin-aware `ViewAsBanner` (Manage Tasks
  hidden, Switch hidden, Exit copy variant per origin) shipped in 5B; the lateral-escalation
  gap was founder-reviewed and confirmed KEEP as shipped.
- **Reflections privacy:** stayed deferred as planned — now formally registered as
  **Follow-Up Build G** (Reflections revamp; no privacy column exists yet).

**Final audit:** 48 requirements → 45 Wired / 2 Stubbed / 0 Missing.
Migrations `100246` (origin column, 394 rows backfilled) + `100248` (my_rewards feature key).

**What the close-out surfaced (the interesting part):**
- **Five crash-detour hotfixes** during 5E, the biggest being a *Realtime channel collision
  class of bug*: `supabase.channel(name)` reuses channels by topic name, and View-As renders a
  second shell tree above the viewer's shell — so any singleton-named `postgres_changes` channel
  got reused and `.on()`-after-`.subscribe()` threw, black-screening the app. All 4 realtime
  hooks (`useNotifications`, `usePendingReveals`, `useThreadRealtime`, `useSpacesRealtime`)
  were swept to per-instance `useId()` channel names + bind-before-subscribe + `removeChannel`
  cleanup. Codified as **Convention #272**.
- Other hotfixes: ErrorBoundary wrapping the modal-rendered shell (degrades to friendly card,
  never black-screens), `ViewAsModal` mounted on `/hub` so kid-PIN flow renders, Family Overview
  widget query referencing non-existent columns, banner theming moved to the accent-deep
  Tooltip pattern, lock emoji → Lucide Lock.
- **Convention #39 fully rewritten** in CLAUDE.md for the modal-overlay architecture
  (`useEffectiveMember()` vs `useFamilyMember()`, origin-keyed `filterKidPrivate()`,
  invisibility-over-blocking with `<MomOnlyRoute>` backstop on 16 routes, known migration
  point for future per-member Supabase auth).
- One housekeeping surprise: Workers 1–4 foundation code had been returned **uncommitted** in
  an earlier session and was discovered + committed during close-out (`18e882d`).

**Follow-Up Builds A–G registered in STUB_REGISTRY** (the named forward queue from this build):
- A — My Rewards page real content (kid-facing; currently a PlannedExpansionCard stub at `/my-rewards`)
- B — Special Adult sidebar audit
- C — Safe Harbor decommission decision
- D — Generated Supabase types adoption
- E — Per-member sidebar customization via Permission Hub (this is also where Archives-for-Dad/teens returns; founder ruled Archives stays OUT of Adult/Independent defaults)
- F — Shopping Mode / Lists visibility scoping
- G — Reflections revamp (absorbs the deferred kid-privacy filtering)

---

## 2. Two stragglers formally closed same day (2026-06-04)

Both had shipped code weeks earlier but lacked sign-off; closed on an opportunistic
eyes-on basis:

- **PRD-09B — Living Shopping List & Shopping Mode V1** (code shipped 2026-05-04, `f2569b7`).
  Always-on shopping lists, Recently Purchased tab, purchase history, auto-archive cron,
  per-section timing; Shopping Mode = cross-list store selection + store view + aisle lens.
  Migration `100230`. V2/V3 items documented as stubs.
- **TaskCreationModal — Checkbox Honesty** (code shipped 2026-05-25, `970e175`).
  Fixed silent revert of tracking checkboxes (allowance / gamification / homework /
  extra-credit / track-progress / track-duration) on parent re-render via
  `hasUserInteractedRef`. Vitest invariant is the proof.

---

## 3. Member-Day Task State — Single Source of Truth — CLOSED 2026-06-08

The newest completed build, and an important architectural anchor going forward.

**The bug:** three "painted-blind" read paths (`useRoutineWeekView`, the
`calculate_allowance_progress` RPC, and the `calculate-allowance-period` Edge Function's
`countAssignedTasks`) counted past-end-date *painted* routines in kids' allowance
denominators — silent allowance erosion for Gideon, Miriam, and Mosiah.

**The fix (Convention #271):** one canonical SQL source for "what counts for a member on a date":
- **Layer 1** `obligation_active_for_member_on_date(task, member, date) → bool` — atomic
  predicate mirroring `src/lib/tasks/recurringTaskFilter.ts` line-for-line (painted
  rdates/exdates, until, dtstart, archived, assignee).
- **Layer 2** `get_member_day_obligations(member, start, end)` — the public bulk query every
  measurement/reward surface MUST call. Populates `source_type='routine_step'` now; the return
  shape pre-carries `pool_id`, `task_segment_id`, `is_extra_credit`, `homework_subject_ids`
  so future surfaces (gamification, homework, victories, trackers…) refactor in without a
  signature change.
- **The dashboard-truth invariant:** if a scoreable item doesn't appear on the kid's dashboard
  for a day, it cannot appear in ANY reward denominator for that day. Display and math derive
  from the same query.
- An invariant test (`tests/routine-day-state-invariant.test.ts`, 19/19) mirrors the SQL
  predicate in TS — change one, change the other, or CI fails.
- Data repair: `until` backfilled on 3 painted production rows; 1 orphan `assignee_id=NULL`
  routine archived. Migration `100247`. Commit `6143b5a`. Audit 12/12 Wired, 0 Missing.

**Grandfathered surfaces** (re-derive inline today; MUST refactor to the RPC when next
touched): `roll_creature_for_completion`, homework time logs, victory creation, tracker
widget events, intention tallies, practice log, non-routine task derivations.

---

## 4. Where we are right now (2026-06-09)

- **No active builds.** `.claude/rules/current-builds/` holds only `IDLE.md`.
- **Working tree has light uncommitted test work:** a new `tests/e2e/features/phase3.8-full-flow.spec.ts`,
  a new `tests/unit/parseSmartList.test.ts`, a one-line `package.json` change, and refreshed
  Workers-2/3 screenshots — looks like an in-flight test/verification pass, not a feature build.
- **Open follow-ups carried forward:**
  - Founder testing through the current week + per-kid old→corrected allowance delta review
    (Gideon/Miriam/Mosiah); default is honor-the-corrected numbers.
  - Convention #271 grandfathered-surface refactors (when touched).
  - Layer 2 `source_type` extension, one source type per future build.
  - Sweep to find/prevent whatever deploy flow created the orphan `assignee_id=NULL` row.
- **Standing queues for picking the next build:** Follow-Up Builds A–G, `/bug-triage-merge`
  (beta_glitch_reports — 74 rows), and `claude/web-sync/TRIAGE_WORKSHEET.md`.

## 5. Corrected timeline (fixing claude.ai's stale memory)

claude.ai already self-corrected that Phase 3.5/3.7/3.8 shipped in early May — confirmed.
The accurate recent sequence is:

| Date | Build | Status |
|---|---|---|
| 2026-05-03 | Phase 3 Connector Layer (12 godmothers, contracts, deed_firings) | Closed |
| 2026-05-04 | Phase 3.7 Wizards & Seeded Templates; PRD-09B Shopping code ships | Closed / shipped |
| 2026-05-05 | Phase 3.8 Activity Management | Closed |
| 2026-05-06 | Phase 3.5 Multi-Pool Allowance | Closed |
| 2026-05-25 | Checkbox Honesty code ships | Shipped |
| 2026-05-28→06-04 | View-As Workers 5A–5E + hotfix detour | Closed 06-04 |
| 2026-06-04 | View-As sign-off; PRD-09B + Checkbox Honesty sign-offs | Closed |
| 2026-06-08 | Member-Day Task State / Convention #271 | Closed |
| 2026-06-09 | Idle; test-pass work in working tree | — |

**New conventions since claude.ai's snapshot:** #271 (member-day obligations single source of
truth + dashboard-truth invariant) and #272 (per-instance Realtime channel names,
bind-before-subscribe). Convention #39 rewritten. Next migration number: `100249`.
