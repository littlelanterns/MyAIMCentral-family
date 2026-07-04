# Active Build: OPPORTUNITY-SURFACES — Opportunity Boards Restoration

> **Status: ALL SCOPES CODE COMPLETE (2026-07-02) — (a)+(b)+(c)+write-back fix. Spec
> 8/8 green; regression pins green (fo-command-center 12, leak-pass 10, kids-rewards
> slice1 15 / slice2 9 / slice3 14, meetings-rls 3 — slice4's in-flight spec deliberately
> not run); zero fixture residue; tsc -b exit 0; lint 0 errors. Migration
> `00000000100280_consume_opportunity_list_item.sql` founder-approved (number confirmed
> by founder) and APPLIED to linked production. AWAITING FOUNDER EYES-ON — nothing
> committed.** Live founder-reported regression: opportunity boards invisible to
> mom/adults/teens/Play.
> Worker: OPPORTUNITY-SURFACES · Feature decision file:
> `claude/feature-decisions/Opportunity-Surfaces-Restoration.md`
>
> **Coordination locks (3 parallel sessions):** do NOT touch RequestsTab, MyRewards.tsx,
> or reward_proposals code (Slice 4). NO migrations (100277+ reserved by Slice 4) — if one
> becomes necessary, STOP and ask. Ask founder before running any FULL Playwright suite.

---

## Verified Root Causes (all three confirmed in code + git this session)

1. **Tasks page:** commit `a6e8108` (FO-COMMAND-CENTER Phase 3) gated the tab switcher
   ([Tasks.tsx:546](src/pages/Tasks.tsx#L546)) and the Opportunities content branch
   ([Tasks.tsx:663](src/pages/Tasks.tsx#L663)) behind `isGuidedMember`. The FO relocation
   only shipped claimed/completed display
   ([FamilyOverview.tsx:617](src/components/family-overview/FamilyOverview.tsx#L617) +
   claims rows) — the browsable board of UNCLAIMED items has no mom-facing home.
2. **Play:** commit `08efafa` removed `/tasks` from PlayShell nav (Home + Fun only);
   [PlayDashboard.tsx:91-93](src/pages/PlayDashboard.tsx#L91-L93) has filtered to
   task/routine/habit since Build M — zero Play opportunity surface, and even claim-bridge
   tasks (`opportunity_*` types) would be invisible.
3. **Guided kids still work** — their two-tab experience is preserved untouched.

## Key facts recon'd (never guessed)

- **Eligibility scoping lives in `useOpportunityLists(familyId, memberId)`**
  ([useOpportunityLists.ts:33-58](src/hooks/useOpportunityLists.ts#L33-L58)): memberId
  present → `eligible_members` null/empty = everyone, else must contain memberId; memberId
  omitted → ALL boards (mom's path). Claim-rule mirror in `canClaimItem`.
- **`task_claims` RLS** (`tcl_via_task`, migration 000008) is family-membership FOR ALL via
  `auth.uid()` — covers kid shadow sessions AND the two-door family-shadow member row. No
  RLS blocker for Play claims; no migration needed.
- **Pre-existing gap (flagged, NOT fixed here):** `useCompleteOpportunityTask` (the only
  code that writes `list_items.completed_instances`/`is_available=false` on completion) is
  exported but UNUSED. All roles complete claim-bridge tasks through the generic paths
  (`useTaskCompletion.ts` / `useTasks.ts`), which release claims + pay rewards but never
  write back to the list item — a completed one_time item becomes claimable again.
  Pre-dates this regression; touches completion hooks in KIDS-REWARDS territory → founder
  decision, separate session.

---

## Scope (a) — Tasks-page Opportunities tab for ALL roles  [BUILDING NOW]

- Tabs (My Tasks / Opportunities) render for every role (remove `isGuidedMember` gate at
  the tab switcher; content branch becomes `activeTab === 'opportunities'`).
- `displayTasks` memo: `activeTab === 'opportunities'` → filter personal scope to
  `opportunity_*` types for ALL roles (guided branch behavior unchanged); guided
  `my_tasks` keeps task/habit; non-guided `my_tasks` keeps Q2 inclusion control.
- Inclusion pills + ViewCarousel + filter bar hidden while the Opportunities tab is active
  (they are My-Tasks-view concerns; guided members never see them, unchanged).
- `OpportunitiesTab` gains `showAllBoards` (true when effective member is
  `primary_parent`): passes `undefined` memberId to `useOpportunityLists` → mom sees ALL
  boards. Claim identity stays the effective member (mom claims only where eligible —
  `canClaimItem` already enforces).
- Guided render paths untouched: quick-add box, guided empty states, no FeatureGuide.

## Scope (b) — FO OpportunitiesSection browsable board  [BUILDING NOW]

- New hook `useOpportunityBoardsWithItems(familyId)` in `useFamilyOverviewData.ts`: one
  query for `lists` (is_opportunity, not archived), one for their `list_items` where
  `is_available=true`. Returns boards with items + eligible_members.
- `OpportunitiesSection` renders, per member column: for each board the member is eligible
  for, a compact board header (Star + title + N available) + unclaimed item rows (name +
  reward badge). Claimed rows (with mom [Return]) and completed-today rows unchanged.
- Display-only rows (no claim-on-behalf from FO — stub, see feature decision file).
- Board shows in EVERY eligible member's column (column = "what can this kid see/claim").
- Dad's granted-scoped FO: columns are already scoped by viewableIds; no new leak surface.

## Scope (c) — Play opportunity tiles  [DESIGN ONLY — AWAITING FOUNDER APPROVAL]

### Mini pre-build summary — Play "Extra Jobs" section

**What it is:** Play kids (3-7) get a tap-to-claim opportunity surface directly on
PlayDashboard — their first ever. Boards they're eligible for render as a new section
below the task grid.

**Design:**
1. **New `PlayOpportunitySection`** (`src/components/play-dashboard/`), rendered on
   PlayDashboard between `PlayTaskTileGrid` and the stubs. Hidden entirely when the kid
   has no eligible boards or no claimable items (no empty-state noise).
2. **Per-board banner** styled like the existing segment banners: Star (Lucide, chrome)
   + board title + "N to pick from". Collapsible, default expanded.
3. **Item tiles** in the existing `play-tile-grid` (2-col phone, 56px+ targets, big text):
   item name + reward badge (DollarSign/Star chrome icon + amount). Tile imagery follows
   the Build M platform-asset pattern — auto-matched paper-craft icons via the
   `usePlayTaskIcons` tag-match path against the item name (Lucide never used as tile
   imagery, per the PlayDashboard header rule; dispatch's "Lucide icons" honored for
   chrome). Fallback = the same graceful onError the task tiles use.
4. **Only claimable-right-now items show** (`canClaimItem` true + not actively claimed by
   anyone via the claim-status map). Items claimed by siblings, on cooldown, or done for
   the week are simply invisible on Play — no "Jimmy is working on this" complexity for a
   4-year-old.
5. **Tap-to-claim = tap → big friendly confirm** ("Want to do this job?" with the item
   name + reward, [Yes!] / [Not now], 56px+ buttons) → `useClaimOpportunityItem` (the
   exact same claim→task bridge every other shell uses) → success copy ("It's yours!
   Look in your list!") → the claim-bridge task appears in the kid's task grid.
   Confirm-step exists because a single stray tap must not lock a claimable job.
6. **PlayDashboard task filter extended** to include `opportunity_*` task types so the
   claimed bridge task renders as a normal tap-to-complete tile ("What's next" /
   segment grid). Completion flows the existing generic path → gamification RPC, money
   reward, custom-reward RPC — zero new completion code.
7. **View As:** section renders for mom-in-View-As; claim uses
   `createdBy = real viewer id, memberId = kid` (the established pattern).
8. **No new tables, no migrations, no settings.** `eligible_members` IS mom's control for
   who sees each board (per the Opportunity Board spec `available_to`).

**Explicitly NOT in (c):** claim locks countdown display on Play (claimable items still
get their task_claims lock — just no timer UI for pre-readers); voluntary "Put it back"
on Play (kid asks a grown-up — mom has FO [Return]); reward money amounts hidden? NO —
amounts show (founder amended Play money to opt-in for the MyRewards surface only;
board reward badges are motivation, and if founder prefers them hidden on Play we flip
one prop — flag at eyes-on).

**Open question for founder:** should Play claiming require the confirm step (designed
in) or be single-tap like task completion? Recommendation: keep the confirm — claims
lock items away from siblings, unlike completions which are the kid's own.

---

## No-Migration Statement

No schema changes. `tcl_via_task` covers all claim writes. If anything RLS-blocks during
E2E, STOP and ask the founder (100277+ is Slice 4's).

## Playwright plan (`tests/e2e/features/opportunity-surfaces.spec.ts`)

Fixtures OPPSURF-prefixed via service role (leak-pass pattern), Testworth family:
1. Opportunities tab VISIBLE + functional for mom (own session) — board renders
2. Tab visible for additional_adult + independent teen (eligibility-scoped)
3. Eligibility scoping: board with eligible_members=[kidA] → kidA sees it, sibling
   doesn't, mom sees it (all boards)
4. FO OpportunitiesSection shows the browsable board (unclaimed items) per member column
5. Guided regression: guided member still sees two tabs + board (no regression)
6. (after (c) approval) Play claim flow: tile → confirm → bridge task appears
Regression pins to re-run (targeted, with founder's ok): fo-command-center,
role-scoping-leak-pass, kids-rewards slices.

---

## Progress Log (2026-07-01, Worker OPPORTUNITY-SURFACES)

**(a) Tasks page — DONE.** [Tasks.tsx](src/pages/Tasks.tsx): tab switcher renders for all
roles; content branch `activeTab === 'opportunities'`; displayTasks memo filters personal
scope to `opportunity_*` on the tab for every role (guided My Tasks + non-guided inclusion
control unchanged); inclusion pills / ViewCarousel / filter bar hidden on the Opportunities
tab; `OpportunitiesTab` gained `showAllBoards` (effective-mom → all boards, claim identity
unchanged). Guided render paths untouched.

**(b) FO browsable board — DONE.** New `useOpportunityBoardsWithItems(familyId)` in
[useFamilyOverviewData.ts](src/hooks/useFamilyOverviewData.ts) (boards + available items +
claimed-flag via active bridge tasks, 3 queries total). `OpportunitiesSection` renders
per-eligible-board unclaimed item rows (board header testid
`fo-opp-board-{boardId}-{memberId}`) below claims/completions; section count badge now
includes available board items; `isBoardEligibleFor` mirrors the useOpportunityLists rule.
Claim + unclaim mutations invalidate `['fo-opportunity-boards']` (+ claim also refreshes
`['list-item-claim-status']`).

**Proof:** `tests/e2e/features/opportunity-surfaces.spec.ts` — **6/6 green** (mom tab +
all-boards incl. a board excluding her; eligible teen; sibling exclusion; dad scoping; FO
per-column board presence/absence with FO-config snapshot/restore; guided two-tab
regression pin). Zero OPPSURF residue verified via service role after the run.
`npx tsc -b`: zero errors in touched files — 5 pre-existing errors in the parallel
Slice 4 session's untracked `src/hooks/useRewardProposals.ts` (NotificationType values),
NOT touched by this session. ESLint scoped to the 4 touched files: 0 errors, 2
pre-existing warnings on untouched lines.

**Files touched by THIS session:** `src/pages/Tasks.tsx`,
`src/components/family-overview/FamilyOverview.tsx`,
`src/hooks/useFamilyOverviewData.ts`, `src/hooks/useOpportunityLists.ts`,
`tests/e2e/features/opportunity-surfaces.spec.ts`, the two process files.
(Working-tree changes to TaskCreationModal.tsx / WidgetConfiguration.tsx /
createTaskFromData.ts / useRewardProposals.ts / migration 100278 belong to parallel
sessions — selective staging required at commit time.)

**Deferred pending founder word:** regression pin suites (fo-command-center, leak-pass,
kids-rewards slices) — not run yet per the ask-before-full-suites coordination rule and
because parallel sessions share prod fixtures (kids-rewards sweeps KRSLICE demo fixtures
the founder may be poking). (c) Play code — design awaiting approval.

---

## Progress Log — Day 2 (2026-07-02): (c) built + write-back fix BLOCKED ON MIGRATION APPROVAL

Founder approved (c) + asked for the claimed-board-job → list-item write-back fix.

**(c) Play "Extra Jobs" — CODE COMPLETE.** New
[PlayOpportunitySection.tsx](src/components/play-dashboard/PlayOpportunitySection.tsx)
(eligibility-scoped boards → banner + tap-to-claim tiles, claimable-right-now filter,
big confirm overlay, platform-asset tile icons via the usePlayTaskIcons pseudo-task shim,
friendly error copy). PlayDashboard: task filter now includes `opportunity_*` types so
claimed bridge tasks render as normal tap-to-complete tiles; section rendered between the
task grid and the stubs. E2E test 7 proves the full claim flow IN THE BROWSER (tile →
confirm → "It's yours!" → bridge task tile appears, board hides the claimed item).

**Write-back — client code wired at 6 sites, but E2E exposed a SECOND root cause.**
New never-throws helper
[opportunityListWriteBack.ts](src/lib/tasks/opportunityListWriteBack.ts) called from
useTaskCompletion.ts (complete + uncomplete), useTasks.ts (useCompleteTask,
useApproveTaskCompletion, useUncompleteTask), useTaskCompletions.ts (useApproveCompletion).
Tests 7 + 8 fail EXACTLY on the consumed-item assertion and the trace shows why:
**`list_items` has no write path for kid PERSONAL sessions.** The only write policy is
`li_via_list` (migration 000008: list owner / primary parent / list_shares) — opportunity
boards are mom-owned with no shares, so a kid's UPDATE is silently filtered to 0 rows
(no error — the classic silent RLS failure). Migration 100141 opened SELECT for exactly
this reason; writes were never opened. `li_family_device` (100262) covers family-shadow
devices only. This ALSO means the never-called `useCompleteOpportunityTask` could never
have worked for kids even if it had been called.

**Proposed fix (STOP-and-ask per dispatch):** narrow SECURITY DEFINER RPC
`consume_opportunity_list_item(p_task_id, p_direction)` following the 100275
`place_member_creature` precedent — server-side derivation of every written value,
family-membership + family-shadow authorization, touches ONLY completed_instances /
is_available / last_completed_at. Helper swaps its direct UPDATE for the RPC (six call
sites unchanged). Migration numbering needs coordination: 100277 committed, 100278-100279
are Slice 4's untracked files — next apparent free is 100280 but Slice 4 owns the reserved
range. AWAITING founder approval + number assignment.

**Current suite state:** tests 1-6 green (incl. all of yesterday's pins); test 7 green
through the entire Play claim UI, failing only the final consumed-item DB poll; test 8
same shape. The two failures pin the intended behavior per the tests-match-intent rule —
they go green when the RPC lands. tsc -b exit 0 (whole workspace, Slice 4's errors fixed
on their side); eslint 0 errors on all touched files.

---

## Mom-UI Verification

> Founder could not eyes-on live (2026-07-02) and directed a headed-Playwright
> user-level walkthrough instead ("check as a user with a headed playwright to
> make sure it's all visible; looks judged in a later UI run"). Tour:
> `tests/e2e/features/opportunity-surfaces-eyes-on.spec.ts` (EYES_ON_TOUR=1,
> 4 stops, 9 screenshots in `eyes-on-tour/opps-*.png`), each screenshot
> visually inspected by the worker. Fixtures left in place for founder poking;
> swept by the next opportunity-surfaces.spec.ts run.

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Tasks page Opportunities tab (mom) | ✅ headed | — (later UI run) | — (later UI run) | Mom | opps-01..03: tabs render, 3 boards, expand shows items, mom's claim = "Unavailable" on non-eligible board | 2026-07-02 |
| Tasks page Opportunities tab (teen) | ✅ headed | — | — | Independent (own login) + View As entry | opps-05..07: View As renders Alex's shell; own-login shows exactly his 2 eligible boards + claim buttons | 2026-07-02 |
| FO Opportunities section — board + claimed + counts | ✅ headed | — | — | Mom | opps-04: Alex column shows 2 boards/3 items, Casey column shows Everyone board only | 2026-07-02 |
| Play "Extra Jobs" + confirm dialog | ✅ headed | — | — | Play (own login) | opps-08/09: banners + tiles + confirm, NO dollar amounts (gate at default), stars shown; real-tablet small-finger pass deferred to the later UI run | 2026-07-02 |

## Progress Log — Day 2 close (2026-07-02): write-back LANDED via RPC

Founder approved the migration + confirmed number 100280. Slice 4's 100278/100279 were
verified already applied remotely (`supabase migration list --linked` in sync), so
`db push` applied only 100280. `consume_opportunity_list_item(p_task_id, p_direction)`:
SECURITY DEFINER, server-derives every written value from the bridge task + item,
touches ONLY completed_instances / is_available / last_completed_at, authorizes task
assignee / primary_parent / additional_adult / family-shadow (non-assignee siblings
rejected). The client helper now calls the RPC (six call sites unchanged); it
self-filters non-bridge tasks so unconditional calls from approval hooks are safe.
Spec rerun: **8/8** — both write-back pins green from real kid browser sessions
(Play → useCompleteTask path; teen TaskCard toggle → useTaskCompletion path).
`live_schema.md` regeneration not needed (function only — no table/column changes).

## Progress Log — Day 2 final (2026-07-02): money gate + eyes-on + commit authorization

Founder rulings (2026-07-02, second message): (1) eyes-on via headed Playwright (she
can't view live; looks judged in a later UI run); (2) **Play money gate**: dollar
amounts hidden on Play tiles by default, gated on the SAME per-kid money opt-in as the
Fun page (`my_rewards_sections.finances`, Slice 2 amendment — one switch of intent, no
second rule; stars aren't money and stay visible); (3) approved: stage → commit → Part B
close-out.

Money gate implemented in PlayOpportunitySection via `useMyRewardsSettings(memberId)`
→ `sections.finances` (tiles + confirm dialog; points/"Special prize!" unaffected).
Spec test 7 pins BOTH directions (hidden by default with the override cleared; visible
after mom's opt-in; Ruthie's preferences snapshot/restored). One timing flake fixed by
pinning the deterministic dialog-resolution instead of the 1.8s success flash — suite
**8/8, no flake**. Headed tour run + all 9 screenshots visually inspected (see Mom-UI
table). tsc -b exit 0; lint 0 errors.

## Post-Build Verification

*(Checkpoint 5 — completed 2026-07-02; founder pre-authorized commit + close-out)*

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Opportunities tab visible + functional on /tasks for mom | dispatch (a) | Wired | spec test 1 |
| Tab for additional_adult + teens, eligibility-scoped | dispatch (a) | Wired | tests 2-4 |
| Mom sees ALL boards incl. ones excluding her | dispatch (a) | Wired | test 1 (board with eligible_members=[Alex]) |
| eligible_members scoping preserved exactly | dispatch (a) | Wired | tests 2/3/4/6 (eligible sees / sibling doesn't) |
| Guided two-tab experience unregressed | dispatch | Wired | test 6 |
| FO browsable board (unclaimed items) per member column | dispatch (b) | Wired | test 5 + `useOpportunityBoardsWithItems` |
| FO claimed rows + mom [Return] unchanged | FO-COMMAND-CENTER | Wired | untouched; fo-command-center 12/12 |
| Play opportunity tiles, tap-to-claim, Play-sized, no emoji | dispatch (c) | Wired | test 7 (full browser flow); founder design approval 2026-07-02 |
| Claimed bridge task renders + completes on PlayDashboard | dispatch (c) | Wired | test 7 (task filter extended to opportunity_*) |
| Play money gate: $ hidden by default, per-kid opt-in (Slice 2 switch), stars visible | founder ruling 2026-07-02 | Wired | test 7 pins both directions; tour opps-08/09 |
| Write-back: completion consumes list item (all roles) | founder add-on 2026-07-02 | Wired | RPC 100280 + 6 call sites; tests 7+8 |
| Write-back reverse on uncomplete | founder add-on (coherence) | Wired | both uncomplete paths; keeps "job returns to pool" honest |
| Playwright spec pinning tab/scoping/FO/Play/write-back | dispatch | Wired | 8/8 |
| tsc -b clean + lint clean | dispatch | Wired | exit 0 / 0 errors |
| Regression pins green | dispatch | Wired | 63 regression tests across 6 suites |
| No RequestsTab / MyRewards / reward_proposals touches | coordination | Wired | verified via git status file list |
| Migration only with founder approval | coordination | Wired | 100280 approved + number founder-confirmed |
| Mobile/desktop nav parity | Convention #14 | N/A | no new top-level page; tab lives inside existing /tasks |

**Stubbed (registered in the feature decision file, for STUB_REGISTRY at close-out):**
claim-on-behalf from FO board rows; standalone opportunity TASKS in the FO board display;
FO board row tap-through to Lists; Play claim-lock countdown UI; Play voluntary release
("ask a grown-up" / mom's FO [Return] covers it).

**Missing: 0**

**Close-out items pending founder sign-off (Part B):** STUB_REGISTRY entries,
WIRING_STATUS rows, LiLa knowledge (help-patterns + feature-guide-knowledge for the
restored tab + Play Extra Jobs), feature-decision verification copy, archive this file.
