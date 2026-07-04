# Feature Decision File: Opportunity Surfaces Restoration

> **Created:** 2026-07-01
> **Type:** Regression fix + one small NEW surface (Play), founder-dispatched (Worker OPPORTUNITY-SURFACES)
> **Source material:** PRD-09A (Tasks, Routines & Opportunities), `specs/studio-seed-templates.md` (Opportunity Board full configuration), Convention #275 (FO-COMMAND-CENTER), Convention #135 (Guided Tasks page), Build M / Convention #217 (Play tile conventions)
> **Founder approved:** (a)+(b) pre-approved in dispatch 2026-07-01; (c) awaiting mini pre-build approval

---

## What Is Being Built

Opportunity boards (lists with `is_opportunity=true`) became invisible to every role except
Guided kids. Three restorations: (a) the Tasks-page Opportunities tab returns for ALL roles
(it was gated to `isGuidedMember` by FO-COMMAND-CENTER commit `a6e8108`); (b) the Family
Overview Opportunities section gains the browsable board — unclaimed available items per
member column — alongside the existing claimed/completed rows (the FO relocation only ever
shipped claimed-item display); (c) NEW, pending founder approval: Play kids get opportunity
tiles on the PlayDashboard with tap-to-claim (Play kids lost their last path to any
opportunity surface when `/tasks` left the Play nav in KIDS-REWARDS Slice 2 — and Play
never had board access at all).

---

## Verified Root Causes (2026-07-01, this session)

1. **[Tasks.tsx:546](src/pages/Tasks.tsx#L546)** tab switcher renders only when
   `isGuidedMember`; **[Tasks.tsx:663](src/pages/Tasks.tsx#L663)** content branch is
   `isGuidedMember && activeTab === 'opportunities'`. Both from commit `a6e8108`
   (FO-COMMAND-CENTER Phase 3). The FO relocation shipped claimed-items display only:
   **[FamilyOverview.tsx:617](src/components/family-overview/FamilyOverview.tsx#L617)**
   filters `assignee_id === memberId` (completions) + claims — no unclaimed board anywhere
   mom-facing. MemberSpotCheck's Opportunities tab likewise shows only tasks already
   assigned to the member.
2. **Commit `08efafa`** (KIDS-REWARDS Slice 2) reduced PlayShell nav to Home + Fun (no
   `/tasks`); **[PlayDashboard.tsx:91-93](src/pages/PlayDashboard.tsx#L91-L93)** filters to
   `task|routine|habit` since Build M — even claim-bridge tasks (`opportunity_*` types) are
   invisible on the Play dashboard.
3. Guided kids still work (two-tab experience intact) — must not regress.

---

## Screens & Components

| Screen / Component | Change | Notes |
|---|---|---|
| Tasks page tab switcher (`Tasks.tsx`) | Modified | Tabs (My Tasks / Opportunities) render for ALL roles, not just Guided |
| Tasks page Opportunities tab content | Modified | `OpportunitiesTab` renders for all roles; guided rendering path unchanged |
| `OpportunitiesTab` (Tasks.tsx sub-component) | Modified | New `showAllBoards` prop: mom (`primary_parent` effective member) passes `undefined` memberId to `useOpportunityLists` → sees ALL boards; everyone else keeps eligibility filter |
| Inclusion pills / ViewCarousel / filter bar (Tasks.tsx) | Modified | Hidden while the Opportunities tab is active (they are My-Tasks-view concerns) |
| FO `OpportunitiesSection` (FamilyOverview.tsx) | Modified | Adds per-board unclaimed available items (compact rows, board title header) above claimed/completed rows, filtered per column by `eligible_members` |
| New hook `useOpportunityBoardsWithItems` (useFamilyOverviewData.ts) | New | One query for family opportunity lists + one for their available items; per-column eligibility filtering happens in the section |
| PlayDashboard opportunity tiles | NEW — **awaiting founder approval** | See mini pre-build summary in the active build file |

---

## Key Decisions (Easy to Miss)

1. **Eligibility scoping preserved exactly.** `useOpportunityLists(familyId, memberId)`
   already implements it: `eligible_members` null/empty = everyone; otherwise must contain
   the memberId. Non-mom roles keep passing their effective member id. Mom passes
   `undefined` (all boards) — per dispatch "mom sees all."
2. **Mom's claim identity stays her own.** `OpportunityListBrowse` still receives mom's
   member id for claim actions; `canClaimItem` will show "Not eligible for this list" on
   boards she isn't in — she browses all, claims only where eligible. No claim-rule change.
3. **Effective member drives visibility** (`useEffectiveMember`) so View-As shows exactly
   what the member sees — consistent with the page's existing PRD-02 scoping comment.
4. **Guided experience untouched:** two tabs, quick-add box, no filter bar, guided empty
   states — all render paths keyed on `isGuidedMember` for guided members stay as-is.
5. **FO board rows are display-only** in this build. Claimed rows keep the mom [Return]
   button; unclaimed rows show item name + reward badge under a board-title header.
   Claiming from FO on a kid's behalf is NOT built (mom claims via View As or the kid
   claims themselves — claim identity semantics stay clean).
6. **FO board appears in every eligible member's column.** A board eligible to 3 kids shows
   under all 3 — the column answers "what can THIS kid see/claim," mirroring dashboard-truth
   framing.
7. **Standalone opportunity TASKS (backward-compat shape) are not added to the FO board
   display.** The founder-reported regression names boards (`is_opportunity=true` lists).
   Standalone opportunity tasks already surface on FO via claims + completions rows and on
   the restored Tasks-page tab. Flagged as a possible follow-up, not built silently.
8. **Play tiles never use Lucide/emoji as tile content** (Build M rule in PlayDashboard
   header comment) — the dispatch's "Lucide icons" is honored for chrome (section header,
   claim affordance), while tile imagery follows the existing platform-asset pattern.
   Resolved in the (c) design for founder review.

---

## Database Changes Required

**One migration — founder-approved 2026-07-02 (number confirmed by founder):**
`00000000100280_consume_opportunity_list_item.sql` — SECURITY DEFINER RPC
`consume_opportunity_list_item(p_task_id, p_direction)`. Needed because kid PERSONAL
sessions have no `list_items` write path (`li_via_list` = owner/mom/shares only; 100141
opened SELECT only; `li_family_device` covers family-shadow only) — so the completion
write-back the founder requested could not land for the primary flow. The RPC
server-derives every written value and touches only completed_instances / is_available /
last_completed_at; authorized callers: task assignee, primary_parent, additional_adult,
family-shadow. No table or policy changes. Applied to linked production 2026-07-02.
(Slice 4's 100278/100279 verified already applied remotely before pushing.)

All other data paths reuse existing tables: `lists`, `list_items`, `tasks`, `task_claims`.

---

## Feature Keys

No new feature keys. Existing `tasks_opportunities` gating (beta: `useCanAccess` returns
true) unchanged.

---

## Stubs — Do NOT Build This Phase

- [ ] Claim-on-behalf from FO columns (mom claiming for a kid directly from the board rows)
- [ ] Standalone opportunity tasks in the FO unclaimed-board display (see decision #7)
- [ ] Tap-through from FO board rows to the Lists detail page
- [ ] Anything touching RequestsTab, MyRewards.tsx, or reward_proposals (Slice 4 territory)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Tasks-page Opportunities tab | ← | Opportunity lists | `useOpportunityLists` (`lists.is_opportunity`, `eligible_members`) |
| Claim flow | → | Tasks + claims | `useClaimOpportunityItem` → `tasks` (source=`opportunity_list_claim`) + `task_claims` |
| FO Opportunities section | ← | Boards + items | new `useOpportunityBoardsWithItems` (`lists` + `list_items.is_available`) |
| Play claim flow (c) | → | Gamification | claim-bridge task completion → existing `roll_creature_for_completion` pipeline (untouched) |

---

## Founder Confirmation (Pre-Build)

- [x] (a) + (b) scope founder-approved in dispatch (2026-07-01)
- [x] (c) Play design mini pre-build summary approved (founder, 2026-07-02 — confirm
      step kept as designed)
- [x] Write-back fix requested by founder (2026-07-02) + migration 100280 approved,
      number founder-confirmed
- [ ] Eyes-on before anything commits

---

## Post-Build PRD Verification

*(fill at close-out)*

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
