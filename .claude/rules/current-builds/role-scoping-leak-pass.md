# Role-Scoping Leak Pass (PRD-02 enforcement on read surfaces)

## Status: ACTIVE (founder-approved 2026-06-09 in chat)

> Feature-anchored bug-fix build. Origin: founder report — husband (Jerrod, `additional_adult`)
> sees mom's tasks ("Build App" w/ instances) on his Tasks page and "a lot of" mom's information.
> Root cause class: pages treat `additional_adult` as mom-equivalent for DATA VISIBILITY
> (`isMomOrDad` patterns) or query by `family_id` with no member scoping. PRD-02 model
> (founder re-confirmed 2026-06-09): **mom sees all; everyone else sees ONLY their own +
> explicitly shared + members mom has granted via `member_permissions`.**

## Founder rulings (LAW for this build)

1. Each person's Tasks page shows only their own. Mom's everyone-at-once view belongs to
   Family Overview. Tasks page **defaults to own member for everyone, including mom**
   (mom keeps the filter bar/tabs for now — relocation is a separate future build, see below).
2. Lists: visible = own + shared-with + granted. Applies to kids on PIN personal-device
   sessions too.
3. **Shopping lists / Shopping Mode are NOT family-shared by default** — only owner + shared.
   (Overrides the earlier "by-design-shared" classification.)
4. Financial data: mom-only page + DB-level read scoping (mom all / member own rows).
5. Queue (studio_queue) reads: mom family-wide; everyone else own items only.
   Cross-member INSERT path (MindSweep mom→kid routing, migration 100120) must keep working.

## Scope — 7 fixes

| # | Fix | Files |
|---|-----|-------|
| 1 | `useViewableMembers(featureKey)` shared hook (mom→all; additional_adult→self+grants; others→self) | new `src/hooks/useViewableMembers.ts` |
| 2 | Tasks page scoping: display filter, member pill bar limited to viewable, default-to-own (all roles), PendingApprovalsSection scoped | `src/pages/Tasks.tsx` |
| 3 | Lists page + sequential collections visibility scoping | `src/pages/Lists.tsx`, sequential surfaces |
| 4 | Financial History: `/finances/history` → MomOnlyRoute + RLS migration tightening `financial_transactions` (and `loans`) SELECT | `src/App.tsx`, new migration `00000000100253_financial_queue_read_scoping.sql` |
| 5 | studio_queue SELECT/UPDATE/DELETE family-wide path narrowed to `primary_parent` (same migration) | migration |
| 6 | Shopping Mode hooks scoped to own+shared lists (mom keeps family-wide) | `src/hooks/useShoppingMode.ts`, `src/pages/ShoppingMode.tsx` |
| 7 | `useActiveTimers` explicit member filter (hygiene — RLS already scopes) | `src/features/timer/useTimer.ts` |

## Verified-safe surfaces (sweep 2026-06-09, 3 Explore agents + hand-verification)

Journal, InnerWorkings, GuidingStars, BestIntentions, Victories, Reflections, Rhythms,
Notepad, MindSweep, Archives, Dashboard widgets, Messages, Notifications, Requests,
Meeting impressions — all member-scoped. Calendar, BookShelf, Family Hub — by-design shared.
Studio, PrizeBoard, Contracts, PermissionHub, FamilyMembers, allowance/gamification
settings — MomOnlyRoute-guarded.

## Known limitation (declared to founder)

Tasks/Lists fixes are display-layer scoping (same layer existing kid-filtering uses);
tasks/lists RLS still permits family-wide SELECT. Full RLS enforcement is part of the
per-member-auth migration point (Convention #39). Financial + queue ARE fixed at RLS level
in this build (money + captured thoughts warrant the stronger layer).

## Stubs / NOT this build

- **Tasks→Family Overview restructure** (founder vision, captured in
  `claude/feature-decisions/Family-Overview-Command-Center-Vision.md`): move tabs,
  approvals, Queue tab, member spot-checking to Family Overview; Tasks page becomes
  purely personal (own items + 13 prioritization views, with routines/other types
  viewable alongside tasks). Own build, own pre-build process.
- Special Adult shift-scoped task visibility refinement (stays self-only, as today).
- RLS hardening for tasks/lists (Convention #39 migration point).

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Tasks page (mom default = own pill, bar intact) | | | | Mom | | |
| Tasks page as dad (own only; granted kids visible) | | | | Adult (founder eyes-on Jerrod device) | | |
| Lists page as dad/kid (own + shared only) | | | | Adult/Independent | | |
| /finances/history blocked for dad (friendly card) | | | | Adult | | |
| Shopping Mode (own+shared lists only) | | | | Mom + Adult | | |
| Queue badge/Sort tab as dad (own items only) | | | | Adult | | |

## Post-Build Verification (filled 2026-06-09)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `useViewableMembers(featureKey, forMember?)` hook | founder ruling | **Wired** | `src/hooks/useViewableMembers.ts`. Mom→all, additional_adult→self+grants (`access_level != 'none'`, `permission_value` fallback), others→self. Memoized; View-As-aware via `forMember`. |
| Tasks: dad/kid display filter scoped | founder ruling | **Wired** | Tasks.tsx — non-mom "All" = own + shared + created-by-me + granted assignees. Deep-linked `?member=` sanitized against viewableIds. |
| Tasks: member pill bar limited to viewable | founder ruling | **Wired** | Pill bar renders from `viewableMembers`; hidden when only self is viewable (kids). Mom unchanged (full roster). |
| Tasks: default filter = own member (ALL roles incl. mom) | founder ruling "my tasks page should be mine" | **Wired** | One-shot effect; functional update so `?member=` deep link wins; "All" still selectable. |
| Tasks: PendingApprovalsSection scoped | sweep finding #4 | **Wired** | `visiblePendingApprovals` memo — mom all; others own/created/granted. |
| Lists: non-mom sees own + shared + granted | founder ruling | **Wired** | Lists.tsx — `useSharedListIds` now loaded every session (was View-As-only); granted members' lists included, their system lists excluded. |
| Sequential collections scoped (Lists + Tasks Sequential tab) | sweep finding #5 | **Wired** | `useSequentialCollections(familyId, visibleMemberIds?)` — collection visible iff ≥1 task assigned to a viewable member. Lookup-only consumers (DashboardTasksSection, LinkedSourcePicker) unchanged by design. |
| /finances/history mom-only | sweep finding #3 | **Wired** | `<MomOnlyRoute>` in App.tsx. Kid balance view stays via LedgerView mode='self' + `child_can_see_finances`. |
| financial_transactions RLS read scoping | sweep finding #3 | **Wired** | Migration 100255 `ft_scoped_read` — **applied to production + verified via pg_policies**. Mom family-wide; others own rows. |
| loans RLS read scoping | sweep finding #3 | **Wired** | Migration 100255 `loans_scoped_read` — applied + verified. |
| studio_queue read scoping (RLS) | sweep finding #6 | **Wired** | Migration 100255 — SELECT/UPDATE/DELETE family-wide path narrowed to primary_parent; own-rows path kept; cross-member INSERT (MindSweep routing) untouched. Applied + verified (4 policies). |
| Shopping Mode scoped to own + shared (founder ruling: NOT family-shared by default) | follow-up queue item 7 / "F" | **Wired** | `useShoppingModeStores/Items(scopeToOwner)` — non-mom base query `.eq('owner_id', memberId)`; shared lists validated as shopping+included before merging. Mom family-wide. |
| useActiveTimers explicit member filter | sweep hygiene #7 | **Wired** | Non-mom only — mom keeps family-wide timer view (matches `ts_manage_primary_parent` RLS; she quick-starts Play countdowns). |
| `tsc -b` clean | Convention #121 | **Wired** | 0 errors. |
| `npm run lint` | conventions | **Wired** | 0 errors; warnings pre-existing. |
| `npm run schema:dump` after migration | Convention #244 | **Wired** | Regenerated 2026-06-09. |
| Automated test pin for scoping rules | follow-up doc Worker 1 tests | **Wired** | `tests/e2e/permissions/role-scoping-leak-pass.spec.ts` — 10 browser tests vs Testworth family (mom default-own, dad self-only, granted path, lists, queue RLS, finance block, shopping mode, FAB, teen lists, mom regression). LEAKPASS-prefixed fixtures created/removed via service role. |
| MomOnlyRoute blocks non-mom OWN logins (not just View-As) | found by Playwright test #6 | **Wired** | `MomOnlyRoute.tsx` — previously passed dad/teens straight through on direct URL; now any non-mom data subject gets the Parent-only card on all mom-only routes. Loading renders neutral frame (no flash, no false block). Invisibility stays the primary layer; card copy matches View-As member_session. |
| member_permissions `granted_to` read path (RLS) | found by Playwright test #3 | **Wired** | Migration 100259 (applied + verified): `mp_select` was missing the granted_to predicate — additional_adults could not read grants given TO them, so the whole granted path (useViewableMembers, usePermission, meeting gates) silently returned empty. Pre-existing production bug. |
| Notepad/route list-picker parity (follow-up doc Q4) | follow-up doc | **Stubbed** | Write-destination pickers not audited; residual noted in follow-up doc. |
| Founder eyes-on: Jerrod's device (tasks/lists/queue/shopping) | Visual Verification Standard | **Pending founder** | Cannot be eyes-on verified from this session — requires dad's login. Mom-UI table awaits founder verification. |
