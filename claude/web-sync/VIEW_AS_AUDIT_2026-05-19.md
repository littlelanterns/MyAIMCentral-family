# View As Audit — 2026-05-19

> Read-only research deliverable for the View As architectural fix planning session.
> Author: research agent. Scope: every file the View As code path touches, plus the
> Family Hub kid-login flow that secretly rides the same path.
> Source-of-truth files quoted by file:line refs throughout.

---

## TL;DR for the orchestrator

1. **View As is currently a UI/display swap with a fake state-based router, not an auth or data swap.** The auth user remains mom in every code path. `useFamilyMember()` always returns mom. Pages that "behave correctly" in View As do so because each one individually swizzles `member` to `viewingAsMember` before passing it to data hooks. There is no platform-level enforcement and no shared `useEffectiveMember()` hook.

2. **The hub kid-login flow rides exactly the same `startViewAs()` call as mom's overlay — see `src/components/hub/HubMemberAuthModal.tsx:117`.** When a kid taps their avatar and enters their PIN, mom's auth session stays active and `startViewAs(kid, mom.id, family.id)` is fired. The PIN gate is theatre — the underlying session is still mom. This is the architectural bug that makes a kid's "login" indistinguishable from mom's View As session at every layer below the banner.

3. **`getSidebarSections()` in `src/components/shells/Sidebar.tsx:34-154` is not a permission spec.** It's the desktop nav for the LOGGED-IN viewer per shell. Adopting it as the View As nav (commit 2d3526c) hid the symptom of the architectural problem but introduced new lies: it claims a teen sees Tasks/Calendar/Touch Base/Trackers/Lists/Shopping Mode/Studio/Prize Board/RewardRules and a guided child sees Tasks/Messages/Journal/Reflections/Victories — much of which is wrong against PRD-02 and `permission_level_profiles` (164 rows in live schema).

---

## Section 1 — Current View As Architecture

### Provider hierarchy at the moment of View As activation

From `src/App.tsx:94-101`:

```
QueryClientProvider
  → ThemeProvider
    → ModalManagerProvider
      → ViewAsProvider                          ← swap target #1 (View As state)
        → BrowserRouter                         ← REAL router, never changes path
          → SettingsProvider
            → <Routes>
              → ProtectedRoute
                → RoleRouter
                  → renderShell(useShell().shell, children)
                  → <ViewAsModal />             ← overlay sibling
```

Inside the ProtectedRoute, `ShellProvider` calls `useFamilyMember()` (which calls `useAuth()`) and computes `shell` from mom's `role` + `dashboard_mode` (`src/components/shells/ShellProvider.tsx:46-52`). **It never reads `useViewAs()`** — `shell` is always mom's shell.

When mom clicks View As:
1. `ViewAsMemberPicker` calls `startViewAs(member, mom.id, family.id)` (`src/lib/permissions/ViewAsProvider.tsx:48`).
2. `ViewAsProvider` writes a `view_as_sessions` row, then sets state: `viewingAsMember`, `realViewerId`, `excludedFeatures = ['safe_harbor']` by default.
3. `ViewAsModal` (rendered by `RoleRouter`) reacts to `isViewingAs === true` and renders:
   - A backdrop + fixed modal over the mom shell that is *still underneath*
   - The `ViewAsBanner` (gold pill at top with Switch/Exit buttons)
   - A *target-shell* wrapper picked from `dashboard_mode` (`src/features/permissions/ViewAsModal.tsx:167-175`)
   - Inside that wrapper, `renderPage(currentPath)` — a hard-coded switch over path strings (`src/features/permissions/ViewAsModal.tsx:60-118`)
4. The modal applies the target member's `theme_preferences` to the **global** theme (`src/features/permissions/ViewAsModal.tsx:209-223`), restores mom's theme on exit. Side-effect: while View As is active, even the mom shell beneath the overlay is themed with the kid's theme.

### What gets swapped vs. what doesn't

| Layer | Swap on View As? | Mechanism | Notes |
|---|---|---|---|
| Auth user (`useAuth().user`) | **No** | Never touched | Supabase auth session stays mom's |
| `useFamilyMember()` | **No** | Always queries `family_members where user_id = auth.uid()` (`src/hooks/useFamilyMember.ts:64-71`) | Returns mom |
| `useShell().shell` | **No** | `ShellProvider` doesn't read `useViewAs()` | Mom shell stays "mom" |
| Theme tokens (CSS vars) | **Yes (global)** | `useTheme().setTheme(...)` in `ViewAsModal` | Bleeds through to the mom shell underneath the modal |
| Rendered shell component | **Yes (overlay only)** | `ShellWrapper` inside the modal picks via `targetShell` derived from `viewingAsMember.dashboard_mode` (`ViewAsModal.tsx:148-157`) | A second copy of the kid's shell is mounted inside the modal |
| Sidebar nav (real) | **Conditional** | `Sidebar` reads `useViewAs()` and switches `shell` for `getSidebarSections()` only when `isViewingAs` (`Sidebar.tsx:307-317`) | The desktop sidebar visibly changes when View As opens (this is commit 2d3526c's behavior) |
| BottomNav (real) | **Conditional** | Same pattern (`BottomNav.tsx:76-86`) | Mobile bottom tabs visibly change when View As opens |
| Page navigation INSIDE the modal | **Yes (fake)** | `ViewAsNavContext` — pure React state, not the router | URL never changes |
| Per-page data hooks | **Manual, per-page** | Each page individually computes `activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member` and passes that into its hooks | No platform enforcement |
| Permission gates | **Sort of** | `PermissionGate` short-circuits to fallback when `excludedFeatures.includes(featureKey)` (`PermissionGate.tsx:43-46`) | Only blocks features mom explicitly opted out of in the picker UI |
| Writes attribution | **Manual, opt-in** | `useActedBy()` returns `realViewerId` when in View As (`src/hooks/useActedBy.ts:13-15`); call sites must include `acted_by: actedBy` in inserts | Most call sites do NOT — every Tasks/Lists/Journal etc. write happens as the kid by default |
| RLS check on writes | **Never re-evaluated** | Supabase client uses mom's auth.uid() always | Kid-as-target write goes through mom's RLS because mom's the auth user — works by accident |

### Fake router inside the modal

`renderPage` (`src/features/permissions/ViewAsModal.tsx:60-118`) is a hand-maintained `switch` over ~30 string paths. Comparison with `src/App.tsx:104-208` shows roughly the same set of routes — but the modal version is a parallel hand-maintained list that already has drift risk. Missing from `renderPage`: `/permissions`, `/family-members`, `/family-setup`, `/family-login-name`, `/prize-board`, `/contracts`, `/finances/history`, `/feeds`, `/messages/space/:spaceId`, `/messages/thread/:threadId`, `/safe-harbor` (blocked separately), `/bigplans`, `/thoughtsift`, `/notepad`, `/rewards`, `/sweep`, `/hub`, plus all `/settings/*` sub-routes and `/admin/*`.

`SidebarNavItem` (`Sidebar.tsx:206-247`) has two render modes: when `isViewingAs`, it renders a `<button>` that calls `viewAsNav(path)` (fake nav) and never touches the real router; otherwise a real `<NavLink>`. `GuidedShell`'s bottom nav has the same fork (`GuidedShell.tsx:200-242`).

The `allowedPaths` set (`ViewAsModal.tsx:178-187`) is derived from `getSidebarSections(targetShell)`. So the path filter for View As is the same nav lie audited in Section 4.

### `viewingAsMember` vs. `effectiveMember` vs. "the member who should own the data"

There is **no `useEffectiveMember()` hook** in the codebase. Pages that handle View As "correctly" use an inline ternary: `activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member`. This pattern shows up in 17+ pages individually (see Section 2). Pages that skip the pattern silently render mom's data inside the kid's shell.

`useActedBy()` (`src/hooks/useActedBy.ts`) is the only "View As-aware attribution" helper — returns `realViewerId` (mom) when active, null otherwise. Grep shows only a small handful of write paths consume it. Most don't.

---

## Section 2 — Every Hook That Returns "Current User"

### Inventory

#### `useAuth()` — `src/hooks/useAuth.ts:5-24`
- **Returns:** `{ user: User | null, loading: boolean, signOut }` — the Supabase auth user.
- **Total call sites:** 11 files (Grep `useAuth()`).
- **Semantics:** This is the auth identity. Always mom while View As is active. Should never change behavior on View As.
- **Sample call sites:**
  - `src/components/AuthGuard.tsx` — auth gate around protected routes
  - `src/hooks/useFamilyMember.ts:57` — uses `user.id` to look up `family_members`
  - `src/hooks/useIsAdmin.ts` — admin gating
  - `src/lib/permissions/usePermission.ts:27` — combined with `useFamilyMember`
  - `src/components/beta/GlitchReporterFAB.tsx` — bug reporter (correctly logs the auth user)
  - `src/pages/Welcome.tsx`, `src/pages/auth/SignIn.tsx` — auth flows
  - `src/pages/Dashboard.tsx:53` — for the Sign Out button
- **Question for each call site:** all 11 want the auth user — they're checking "is someone signed in" or attributing audit events to the human who tapped the button. None of them should change in View As.

#### `useFamilyMember()` — `src/hooks/useFamilyMember.ts:56-75`
- **Returns:** The single `family_members` row whose `user_id === useAuth().user.id`.
- **Total call sites: 179 occurrences across 146 files** (Grep count).
- **Semantics:** Today this is BOTH "the auth member" and "the member whose data the page is showing." That conflation is the bug. After the fix, `useFamilyMember()` should remain "the auth member" and a new `useEffectiveMember()` should replace this hook everywhere a page wants "the member whose data is being shown."
- **The big number is misleading:** many call sites are correct as-is because they really do mean "the auth user's family_member" (e.g., for sidebar persistence, for the Sign Out button, for tier-gating, for write attribution). The migration is not 179 sites — it's the subset that should be "effective member."
- **Sample call sites where the intent is "auth member" (should stay `useFamilyMember()`):**
  - `src/components/shells/Sidebar.tsx:304` — sidebar persistence keyed to auth user's `layout_preferences`
  - `src/components/shells/ShellProvider.tsx:46` — computes mom's shell (always mom)
  - `src/components/beta/GlitchReporterFAB.tsx` — bug reports attributed to the auth user
  - `src/components/shells/MomShell.tsx:51`, `AdultShell.tsx:37`, `IndependentShell.tsx:37` — shell-level identity for header/footer
  - `src/pages/SettingsPage.tsx:1` — settings page is per-auth-user
  - `src/hooks/usePermission.ts` (`src/lib/permissions/usePermission.ts:28`) — permission resolution against auth user
- **Sample call sites where the intent is "the member whose data is displayed" (should become `useEffectiveMember()` or accept a memberId prop):**
  - `src/pages/Lists.tsx:161-164` — explicitly forks: `activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member`. Then passes `activeMember.id` to `useSharedListIds`, `useHiddenSharedLists`, and the list filter (`Lists.tsx:230-238`).
  - `src/pages/Tasks.tsx:122-125` — same fork pattern; `activeMember.id` is the assignee filter for `useTasks` and `task-assignments-member`.
  - `src/pages/GuidingStars.tsx:189-194` — `useGuidingStars(activeMember?.id)`.
  - `src/pages/BestIntentions.tsx:810-815` — `useBestIntentions(activeMember?.id)`.
  - `src/pages/InnerWorkings.tsx:51-55` — `useSelfKnowledge(activeMember?.id)`.
  - `src/pages/Journal.tsx:33-42` — `useJournalEntries(activeMember?.id)`, plus a manual privacy filter that strips `visibility=private` entries when `isViewingAs` is true (this is the closest thing in the codebase to a "hide from viewer" model — see Section 5).
  - `src/pages/ShoppingMode.tsx:17-21` — `activeMember = isViewingAs ? viewingAsMember : member` then `useShoppingModeStores(family.id, activeMember.id)`.
  - `src/pages/ReflectionsPage.tsx:30-34` — same.
  - `src/pages/RhythmsSettingsPage.tsx:39` — same.
  - `src/components/notepad/NotepadContext.tsx:46-52` — same.
  - `src/pages/Dashboard.tsx:58-72` — uses `isViewAsOverlay` prop instead of inline detection because the same Dashboard component is rendered twice (once as mom under the modal, once as the kid inside the modal); the prop disambiguates.
  - `src/pages/GuidedDashboard.tsx:36-42` — same prop pattern.
  - `src/pages/PlayDashboard.tsx:63-70` — same prop pattern.
  - `src/components/guided/WriteDrawer.tsx:22` — `isViewingAs && viewingAsMember ? viewingAsMember : member`.
  - `src/components/guided/CelebrateSection.tsx:24` — `viewingAsMember` only.
  - `src/components/rhythms/sections/EveningGreetingSection.tsx:26` — same.

This is the population that needs to be migrated. Easy estimate from the `isViewingAs` and `viewingAsMember` Grep results: **~17 pages and ~5 shared components** today have the inline fork. Every other consumer of `useFamilyMember()` either (a) actually means "auth member" (correct), or (b) is silently showing mom's data while underneath a kid's shell (a defect, not yet fixed).

#### `useShell()` — `src/components/shells/ShellProvider.tsx:22-24`
- **Returns:** `{ shell, role, memberId, memberName }` derived from `useFamilyMember()` only. Never reads View As state.
- **Total call sites:** 16 files (Grep).
- **Semantics:** "What shell is the auth user in?" Currently the answer is "mom's shell" while View As is active because `useFamilyMember()` returns mom.
- **Sample call sites:**
  - `src/components/shells/Sidebar.tsx:301` (`realShell`)
  - `src/components/shells/BottomNav.tsx:71` (`realShell`)
  - `src/components/shells/RoleRouter.tsx:33` — picks which shell to mount
  - `src/components/tasks/DashboardTasksSection.tsx`, `src/components/widgets/...` — used to vary density and touch-target sizing
  - `src/features/timer/{TimerProvider,MiniPanel,FloatingBubble}.tsx` — timer UI sizing
  - `src/components/gamification/shared/useShellAwareMotion.ts` — animation tuning
- All 16 want "the auth user's shell" today. After the fix, a subset of these will want "the effective shell" — for example, the visible Sidebar and BottomNav already manually compute a `shell` from `viewingAsMember.dashboard_mode` when in View As (`Sidebar.tsx:307-317`, `BottomNav.tsx:76-86`); that logic should move into a shared `useEffectiveShell()` hook.

#### `useViewAs()` — `src/lib/permissions/ViewAsProvider.tsx:30-32`
- **Returns:** `{ isViewingAs, viewingAsMember, realViewerId, excludedFeatures, startViewAs, stopViewAs, switchViewAs, setFeatureExclusions }`.
- **Total call sites:** 32 files (Grep `useViewAs()`).
- **Semantics:** Today every consumer reads from this to either (a) fork between mom data and kid data on a page, (b) attribute writes via `useActedBy`, (c) show the banner/picker, or (d) gate a privacy feature exclusion. Every one of these consumers is a candidate to be rewritten against the new architecture.

#### There is no `useEffectiveMember()` and no `useEffectiveShell()` today
Both are implied by the current ad-hoc patterns. Adding them is part of the planned fix.

### Audit conclusion for Section 2

The data-layer migration is **not 179 call sites**. It's the ~17 pages and ~5 components in the "should be effective member" sample list above, plus a sweep through the remaining 124 `useFamilyMember()` call sites to verify each is genuinely "auth member" semantics. The bulk-rewrite is contained.

The bigger lift is the platform-level enforcement: today there is no shared hook for "the effective member" and no RLS-equivalent that catches drift. A new `useEffectiveMember()` + a lint rule banning `useFamilyMember()` in pages would prevent regressions.

---

## Section 3 — Every Page That Should Behave Differently in View As

Classified against routes in `src/App.tsx:104-208`. Each row notes whether the page currently has View As awareness and what it should do.

### Mom-only (should HARD-BLOCK in View As)

| Route | File | Current state | What it should do in View As |
|---|---|---|---|
| `/studio` | `src/pages/Studio.tsx` | No View As awareness. Renders identically because all data is shown via `useFamilyMember()` (which is always mom). When mom is in View As, this page is in the modal's `allowedPaths` because mom-shell sidebar includes Studio. | Hard-block. Studio is mom's template workshop — a kid should never see "Customize" buttons. (Today the kid would see mom's Studio if `/studio` is in the allowed paths for their shell — which it isn't per `getSidebarSections('guided')`, but only because the sidebar list is shell-specific. The mom-shell View As path would expose Studio. This is a hole.) |
| `/contracts` (RewardRules) | `src/pages/ContractsPage.tsx` | No View As awareness. | Hard-block. Reward rules are mom's automation surface. |
| `/prize-board` Allowance tab | `src/pages/PrizeBoard.tsx:54` | No View As awareness; PrizeBoard reads `currentMember` from `useFamilyMember()` directly. | Hard-block for Allowance tab specifically (admin "Mark Paid"). Prizes + Balance tabs may show as scoped views — see "Shared but role-scoped" row. |
| `/permissions` | `src/pages/PermissionHub.tsx` | Not in `renderPage` map. Routes only available to mom in main app. | Hard-block. PRD-02 Screen 5 explicitly disallows modifying permission settings from inside View As. |
| `/family-members`, `/family-setup`, `/family-login-name` | various | Not in `renderPage` map. | Hard-block. |
| `/settings/allowance`, `/settings/allowance/:memberId`, `/settings/allowance/:memberId/history` | various | Not in `renderPage` map. | Hard-block. |
| `/settings/homework`, `/settings/gamification`, `/settings/reward-reveals` | various | Not in `renderPage` map. | Hard-block. |
| `/admin/*` | `src/pages/admin/*` | Wrapped in `<AdminGate>` (`src/components/AdminGate.tsx`) which checks `staff_permissions`. | Hard-block separately. AdminGate uses `useAuth()` so the gate doesn't change in View As — but the route shouldn't be reachable from any kid shell's sidebar. |
| `/family-feed` (PRD-37 stub) | `src/pages/placeholder/index.tsx` | Stub. | TBD when PRD-37 ships; treat as mom-only for now. |

### Shared but role-scoped (load TARGET member's data; hide mom-only sections)

These are the pages a kid would legitimately use if they were logged in directly. In View As, they should load the target member's data. In the hub login flow (after the fix), they should load the kid's data through the kid's auth session.

| Route | File | Current state | Mom-only sections/buttons to hide for non-mom viewers |
|---|---|---|---|
| `/dashboard` | `src/pages/Dashboard.tsx` | Inline `isViewAsOverlay` prop, swaps to `viewingAsMember` for `displayMemberId`. Sign Out hidden when `isViewAsOverlay` (`Dashboard.tsx:493-507`). Family setup prompt hidden (`Dashboard.tsx:510-518`). Long-press-edit-mode restricted to mom (`Dashboard.tsx:172-176`). Reasonably correct already. | Sign Out, Family Setup prompt, long-press section edit mode |
| `/tasks` | `src/pages/Tasks.tsx` | Inline fork `activeMember` (`Tasks.tsx:124-125`); uses for `useTasks`, `task-assignments-member` (`:132-138`); `member?.role === 'primary_parent'` for soft-claim approval (`Tasks.tsx:198`). PartiallyView-As-aware. | Mom-only: "Approve" buttons on pending completions; mom-only: edit/delete on others' tasks; mom-only Finances tab visibility per kid; mom-only "Mark Paid" on allowance; sequential mastery approvals panel; "Pending Approvals" section |
| `/lists` | `src/pages/Lists.tsx` | Inline fork `activeMember` (`Lists.tsx:163-164`). Filters list to `owner_id === activeMember.id OR sharedListIds.includes(l.id)` when in View As (`Lists.tsx:234-238`). Mostly correct. | Mom-only sharing edits on shared lists (cross-sibling edit authority per Conventions 266-269); New list creation gated by role for non-Mom shells |
| `/journal` | `src/pages/Journal.tsx` | Inline fork. Strips `visibility === 'private'` entries when `isViewingAs` (`Journal.tsx:39-42`). This is the only existing "hide from viewer" filter in the codebase. | Mom-only "Promote to Victory" / cross-feature route buttons; entries with `is_privacy_filtered = true` should also be hidden (see Section 5) |
| `/journal/reflections`, `/commonplace`, `/gratitude`, `/kid-quips` | `src/pages/Journal.tsx` | Same filter. | Same |
| `/reflections` | `src/pages/ReflectionsPage.tsx` | Inline fork (`:30-34`). Shows transparency indicator for teens (`:71-82`). | Mom-only "manage" tab edits |
| `/calendar` | `src/components/calendar/CalendarPage.tsx` | Uses `useFamilyMember()` directly (no View As awareness). | Mom-only: approve pending events; mom-only: edit other members' events; mom-only: event category management; mom-only: calendar settings |
| `/meetings` | `src/pages/MeetingsPage.tsx` | Uses `useFamilyMember()`. No View As awareness. | Mom-only: schedule editor; mom-only: custom template creation; mom-only: agenda items added by other members; couple-meeting visibility |
| `/messages` (and /messages/space/:id, /messages/thread/:id) | `src/pages/MessagesPage.tsx`, `MessagesSpacePage.tsx`, `MessagesThreadPage.tsx` | Uses `useFamilyMember()` directly. **Critical privacy boundary** (Convention 141: mom cannot read other members' messages). | Mom-only: messaging settings; coaching log; "Hidden from this kid" wouldn't apply — the kid sees their own messages. **The risk is the reverse: mom's View As session, because it uses mom's auth.uid(), can read messages through mom's RLS that the kid couldn't read on their own session.** This is a hard-block surface today and the architectural fix makes it correct. |
| `/notepad` | `src/components/notepad/NotepadContext.tsx` (provider) + `NotepadPage` | NotepadContext has View As fork (`NotepadContext.tsx:46-52`). | "Send to..." routing destinations gated by feature access — kid's set is smaller |
| `/victories` | `src/pages/VictoryRecorder.tsx` and `GuidedVictories.tsx` | Uses `useFamilyMember()`. | Mom-only "Mom's Pick" annotation; mom-only Family Picks aggregation |
| `/trackers` | placeholder/widgets page | TBD on PRD-10 wiring. | Mom-only widget creation when scope is "family" or another member; per-widget privacy |
| `/guiding-stars` | `src/pages/GuidingStars.tsx:189-194` | Inline fork. | Mom can heart/unheart for others; kid can only manage own |
| `/best-intentions` | `src/pages/BestIntentions.tsx:810-815` | Inline fork. | Mom-only: family best intentions creation; tracker creation; member assignments |
| `/inner-workings` | `src/pages/InnerWorkings.tsx:51-55` | Inline fork. | Mom-only: viewing other members' self-knowledge based on `share_with_mom` / `share_with_dad`; private items hidden (already on `is_private`) |
| `/archives`, `/archives/member/:memberId`, `/archives/family-overview` | `src/pages/archives/*` | Uses `useFamilyMember()`. | Hard-block for non-mom viewers entirely on `family-overview`; member-detail pages should load the target member's data and respect three-tier toggles + `is_privacy_filtered` (Convention 76 — hard system constraint) |
| `/archives/privacy-filtered` | `src/pages/archives/PrivacyFilteredPage.tsx` | mom-only by definition | Hard-block for non-mom |
| `/archives/export` | `src/pages/archives/ContextExportPage.tsx` | mom-only | Hard-block for non-mom |
| `/shopping-mode` | `src/pages/ShoppingMode.tsx:17-21` | Inline fork. | Generally fine — Shopping Mode is per-member |
| `/vault`, `/vault/my-prompts` | `src/features/vault/pages/*` | Uses `useFamilyMember()`. | Mom-only: "+Add to AI Toolbox"; mom-only: vault admin functions; tier-gated content already filters via existing tier checks |
| `/bookshelf`, `/bookshelf/prompts` | `src/pages/BookShelfPage.tsx`, `JournalPromptsPage` | Uses `useFamilyMember()`. | BookShelf per-member settings already exist (`bookshelf_member_settings`); Study Guides are audience-scoped |
| `/safe-harbor` | placeholder | Already hard-blocked in View As via `PRIVACY_ROUTE_MAP` + `excludedFeatures` (`ViewAsModal.tsx:120-125`) | Stays blocked — Safe Harbor is exempt from aggregation (Convention 6, 243) |
| `/life-lantern`, `/lanterns-path` | placeholder | PRD-12A future. | Per-member when wired |
| `/bigplans` | placeholder | PRD-29 future. | Per-member when wired |
| `/family-context` | placeholder | PRD-19 future. | mom-only |
| `/rhythms/settings` | `src/pages/RhythmsSettingsPage.tsx` | Inline fork (`:39`). | mom-only "configure for other members"; kid can only configure own when permitted |
| `/feeds` | placeholder | PRD-37 future. | TBD |

### Always allowed / already correct

| Route | File | Notes |
|---|---|---|
| `/dashboard` | (above) | Already does this reasonably via `isViewAsOverlay` prop |
| `/settings` | `src/pages/SettingsPage.tsx` | Settings is per-auth-user. In View As, mom changes mom's settings. After the fix, in hub login, the kid would have access to a scoped version. |
| `/hub` (PWA route) | `src/pages/Hub.tsx` → `FamilyHub` | Shared family surface. Already handles its own auth via PIN modal. (See Section 8.) |
| `/auth/*` | `src/pages/auth/*` | Auth flows — always allowed |

### Hub-flow dependency

**Every "Shared but role-scoped" row above is also the kid's view via hub login** (today through `startViewAs(kid, mom.id, family.id)` from `HubMemberAuthModal.tsx:117`). So every fix that lands for one path lands for the other simultaneously *if* the planned architecture treats hub login as a real auth session swap. If it doesn't, then every page will need to be audited twice — once for "mom in View As of kid" and once for "kid via hub PIN."

---

## Section 4 — Current Sidebar Config Lies

Source: `getSidebarSections(shell)` in `src/components/shells/Sidebar.tsx:34-154`.

This function generates the sidebar for the LOGGED-IN viewer per shell. Adopting it as the View As nav (commit 2d3526c) means the View As modal claims a kid's shell shows everything in their case branch — which is much more than the role would have access to per `permission_level_profiles` (164 rows) and PRD-02.

### Adult shell (`case 'adult'`, line 116-122)

```
home, capture, plan, grow, family, {AI & Tools: AI Vault only}, bookshelf
```

| Section | Item | Should an adult role really have this? | Notes |
|---|---|---|---|
| Plan & Do | **Studio** | **No.** Studio is mom's template workshop. PRD-09A/09B and Convention #149 frame it as mom's creation surface. | Lie. |
| Plan & Do | **Prize Board** | Partial — Prize Board has 3 tabs; only Balance is kid-facing. Allowance and Prizes admin are mom-only. | Lie at full-page level. |
| Plan & Do | **RewardRules** (`/contracts`) | **No.** Contracts are mom's automation switchboard. | Lie. |
| Plan & Do | Shopping Mode | Yes (PRD-09B addendum) | Correct |
| Plan & Do | Trackers | Partial — adult can view own trackers, mom-only to create cross-family | Partial lie |
| Family | **Family Feeds** | TBD — PRD-37 may scope by role | Unverified |
| Family | People | Adult sees relationships per PRD-19; mom-only Family Overview is gated separately | OK |
| Grow | LifeLantern | Per-member feature; adult sees own | OK |
| Capture & Reflect | Rhythms | Settings path is gated to mom for "configure other members" — adult should see own | Partial |

### Independent (teen) shell (`case 'independent'`, line 123-139)

```
home, capture, plan, grow (without LifeLantern), {Family: Messages only}, {AI & Tools: AI Vault}, bookshelf
```

| Section | Item | Should a teen really have this? | Notes |
|---|---|---|---|
| Plan & Do | **Studio** | No | Lie |
| Plan & Do | **Prize Board** | No (admin); Balance only | Lie at full-page level |
| Plan & Do | **RewardRules** | No | Lie |
| Plan & Do | **Shopping Mode** | Probably not (it's a household coordination tool) | Likely lie |
| Plan & Do | **Trackers** | Partial — teen sees own | OK if scoped |
| Plan & Do | Calendar | Teen sees own + family events per PRD-14B; OK | OK |
| Plan & Do | **Touch Base** (meetings) | Teen participates but doesn't create meetings | Partial |
| Grow | BestIntentions, Guiding Stars, InnerWorkings, Victories | Per-member growth tools — OK | OK |

### Guided (younger child) shell (`case 'guided'`, line 140-150)

```
home, {My Day: Tasks, Messages, Journal, Reflections, Victories}, bookshelf
```

| Section | Item | Should a guided child really have this? | Notes |
|---|---|---|---|
| My Day | Tasks | Yes per PRD-25 — but **only 2 tabs** (My Tasks, Opportunities) per Convention 135. The shared `/tasks` route shows 5+ tabs. | Routing is correct; the PAGE itself needs to scope when viewed by guided role. |
| My Day | Messages | PRD-15 stub from guided shell — not yet wired (Convention 131 says Messages tab is stub) | Sidebar adds it but feature is stubbed |
| My Day | Reflections | Yes when enabled by mom | OK |
| My Day | Victories | Yes — see "Stars" in PlayShell, "Victories" here | OK |
| BookShelf | Library, Study Guides, Journal Prompts | Per-member with audience scoping | OK |

### Play shell (`case 'play'`, line 151-152)

```
return [] — no sidebar
```

Correct — Play uses its own purpose-built nav (`PlayShell.tsx:104-125`: Home, Tasks, Stars, Fun).

### Summary of the sidebar lie

For each non-mom shell, the sidebar config includes mom-administered surfaces (Studio, RewardRules, Prize Board Allowance tab) because the case branch was hand-built and never reconciled with PRD-02's permission spec or with `permission_level_profiles`. The View As modal then inherits these lies because `allowedPaths` is built from the same function.

Ground truth is in `permission_level_profiles` (164 rows, see live schema p. lines describing the table) plus `feature_access_v2`. A correct nav config would either:
- Derive sidebar from `feature_key_registry` + `permission_level_profiles` for the active role group, OR
- Continue hand-maintaining per-shell lists but reconcile each entry against the PRD-02 permission spec and explicitly remove Studio/RewardRules/Allowance admin from non-mom shells.

---

## Section 5 — Privacy / "Hidden From Child" Data Model

### What exists today

Searched `claude/live_schema.md` and migrations. The codebase has **partial fragments** of a privacy model but no unified "hidden from this member" column:

| Source | Mechanism | Scope |
|---|---|---|
| `archive_context_items.is_privacy_filtered` (live schema line 1427) | Hard system constraint per Convention 76 — Privacy Filtered items NEVER reach non-mom context regardless of toggles. Enforced in context assembly pipeline. | Archives → LiLa context only. Not a "this kid can't see this row" gate. |
| `self_knowledge.share_with_mom` and `share_with_dad` (live schema lines 488-489) | Per-row boolean visibility controls written by the child | Self-knowledge specifically |
| `journal_entries.visibility` (`private` / `shared_parents` / `family`) + `journal_entries.is_private` (lines 488-522) | The kid chooses visibility per entry. Mom's View As page strips `visibility === 'private'` manually (`Journal.tsx:39-42`). | Journal only; partial — only Journal page applies the filter |
| `journal_visibility_settings` table (lines 3131-3143) — `is_visible_to_parent` per entry type per child | PRD-08 model for "is this journal type visible to parent" | Defaults table — not row-level |
| `mom_self_restrictions` (mom restricts HERSELF from seeing kid's feature) | Per Convention #15-style: mom hides from herself | Reverse direction — mom hiding, not "hide from kid" |
| `member_feature_toggles.is_disabled` (sparse rows when disabled) | Disables a whole feature for a member | Whole-feature, not row-level |
| `teen_sharing_overrides` (live schema 3782-3793) | Teen can promote `mom_only` → `family` per resource | Teen-elevates direction, not "hide from kid" |
| `lila_conversations.is_safe_harbor` | Exempt from all aggregation/context per Convention 6 | Specific to LiLa |

### What does NOT exist

There is **no single "hide this row from these members" column** on archives, guiding stars, best intentions, inner workings, victories, or calendar events. PRD-02 line 199 explicitly says "Features mom has restricted herself from seeing are hidden (even in View As)" — i.e., the only direction the existing model handles is **mom restricting herself**.

The orchestrator's planned work introduces a NEW direction: **mom marks an item as "private from this specific child"**. This is currently not modeled anywhere except indirectly via Journal's `visibility=private` (which is the kid setting it themselves).

### Minimum required data model

Two options, both viable:

**Option A — Per-table boolean: `is_hidden_from_member UUID[]`**
- Add `hidden_from_member_ids UUID[]` (default `'{}'`) to each context-sensitive table:
  - `archive_context_items`
  - `guiding_stars`
  - `journal_entries`
  - `self_knowledge`
  - `best_intentions`
  - `victories`
  - `tasks` (for tasks mom doesn't want a specific kid to see in the queue)
  - `calendar_events`
- RLS additions: deny if `current_member_id = ANY(hidden_from_member_ids)`
- Pro: matches the existing pattern (each table owns its own visibility flags)
- Con: requires updates to ~8 tables and ~8 RLS policies

**Option B — Junction table: `member_hidden_resources(member_id, resource_table, resource_id)`**
- Single table, generic, easy to add new resource types later
- Pro: clean
- Con: every read query has to join

The decision between A and B is the orchestrator's call. The audit's job is to flag that the schema work is non-trivial and the table list above is the minimum.

### Critical: "private from kid" semantics when the kid IS the viewer

PRD-02 line 199 conflates two cases. The planned architecture must split them:

| Case | Today | What "private from kid X" means |
|---|---|---|
| Mom in View As of kid X | Mom uses kid's view; auth = mom; RLS = mom; data = whatever fork the page applies. **Mom currently sees everything because she's the auth user.** | Mom should see all data, but hidden items render with a "Private" indicator (because mom is the one who marked it private — she should know it's there but it shouldn't display to the kid). The View As session is "what does the kid see" with mom's awareness. |
| Kid via hub PIN (today rides View As) | Same code path as above — auth is still mom. Kid sees everything mom sees because RLS evaluates mom. **This is the bug.** | Kid should NOT see items hidden from them. The privacy column needs to be enforced via RLS against the kid's actual auth user. |

**The hub login flow makes Option A (column with RLS) the correct choice** because:
1. RLS naturally enforces "kid can't see hidden_from_member_ids contains my id" when the kid's auth.uid() resolves to their family_member_id.
2. Mom's View As session needs a different layer — application-layer rendering ("show this item, but mark it as Private — only mom can see it on this page") because RLS will let mom read it (she's the auth user).

In other words: the privacy model has to be enforced in TWO places — RLS (for real auth sessions, including the post-fix kid hub login) and application code (for mom's View As session where she's reading her own RLS-allowed rows but choosing to show kid-private items differently).

---

## Section 6 — Pages Already View-As-Aware

From Grep `useViewAs` and `isViewAsOverlay`, with status assessment.

### Files with `isViewAsOverlay` (the Dashboard prop pattern)

| File | Lines | Correctness |
|---|---|---|
| `src/features/permissions/ViewAsModal.tsx:60-118` | Modal harness — passes `isViewAsOverlay` to Dashboard, GuidedDashboard, PlayDashboard | Correct as a routing layer |
| `src/pages/Dashboard.tsx:48-72`, `:455` | Correct: swaps `displayMemberId` to `viewingAsMember.id` for all data hooks, hides Sign Out + family setup prompt + section edit when `isViewAsOverlay` | Correct |
| `src/pages/GuidedDashboard.tsx:33-49` | Correct: same pattern | Correct |
| `src/pages/PlayDashboard.tsx:63-103` | Correct: same pattern; also adds `isAdultViewing` check for randomizer redraw | Correct |
| `src/types/play-dashboard.ts` | Type definition | N/A |

### Files using `useViewAs()` directly (32 files via Grep)

Grouped by intent.

**Correct (inline `activeMember` fork is consumed by data hooks):**
- `src/pages/Tasks.tsx:124-125` — `activeMember` passed to `useTasks`, `task-assignments-member`
- `src/pages/Lists.tsx:163-238` — `activeMember` plus list filter
- `src/pages/Journal.tsx:36-42` — Plus the privacy filter (only file in codebase doing this)
- `src/pages/GuidingStars.tsx:191-194`
- `src/pages/BestIntentions.tsx:812-815`
- `src/pages/InnerWorkings.tsx:53-55`
- `src/pages/ReflectionsPage.tsx:33-34`
- `src/pages/ShoppingMode.tsx:20-21`
- `src/pages/RhythmsSettingsPage.tsx:39`
- `src/components/notepad/NotepadContext.tsx:46-52`
- `src/components/guided/WriteDrawer.tsx:22` — passes `activeMember.id` to the drawer
- `src/components/guided/CelebrateSection.tsx:24`
- `src/components/widgets/info/InfoRecentVictories.tsx:27`

**Correct (uses `isViewingAs` for UI affordance only):**
- `src/components/shells/MomShell.tsx:50` — adjusts top bar offset when banner is visible
- `src/components/shells/AdultShell.tsx:36` — same
- `src/components/shells/IndependentShell.tsx:36` — same
- `src/components/shells/GuidedShell.tsx:52,165` — uses `viewingAsMember` for greeting + fake nav routing
- `src/components/rhythms/sections/EveningGreetingSection.tsx:26` — greeting customization

**Sidebar/nav lie (the commit 2d3526c work):**
- `src/components/shells/Sidebar.tsx:212,302` — swaps sidebar sections to target shell
- `src/components/shells/BottomNav.tsx:72` — same for mobile
- `src/features/permissions/ViewAsModal.tsx:162` — modal harness
- `src/features/permissions/ViewAsBanner.tsx:30` — banner
- `src/features/permissions/ViewAsMemberPicker.tsx:108` — picker

**Privacy / write attribution / gating:**
- `src/lib/permissions/PermissionGate.tsx:39` — feature exclusion block
- `src/components/shared/PlannedExpansionCard.tsx:30` — vote attribution
- `src/hooks/useActedBy.ts:14` — write attribution
- `src/lib/theme/useThemePersistence.ts:26` — skip persistence when in View As

**Hub login (the bug):**
- `src/components/hub/HubMemberAuthModal.tsx:44,117` — fires `startViewAs(kid, mom.id, family.id)` after kid's PIN

**Dashboard composing pages (consume `viewingAsMember` only, not `isViewingAs`):**
- `src/pages/Dashboard.tsx:58` — explicit destructure of all four
- `src/pages/GuidedDashboard.tsx:39`
- `src/pages/PlayDashboard.tsx:64`

### Pages with NO View As awareness (silently broken)

- `src/components/calendar/CalendarPage.tsx` — uses `useFamilyMember()` only
- `src/components/meetings/*` — `useFamilyMember()` only
- `src/pages/MessagesPage.tsx`, `MessagesSpacePage.tsx`, `MessagesThreadPage.tsx` — `useFamilyMember()` only; **dangerous because of cross-member privacy boundary** (Convention 141)
- `src/pages/archives/ArchivesPage.tsx`, `MemberArchiveDetail.tsx`, `FamilyOverviewDetail.tsx` — `useFamilyMember()` only
- `src/features/vault/pages/VaultBrowsePage.tsx`, `PersonalPromptLibraryPage.tsx` — `useFamilyMember()` only
- `src/pages/VictoryRecorder.tsx`, `GuidedVictories.tsx` — `useFamilyMember()` only
- `src/pages/BookShelfPage.tsx` — uses `useFamilyMember()` and `useViewAs` is NOT in this file (verified via Grep)
- `src/pages/Studio.tsx` — `useFamilyMember()` only
- `src/pages/PrizeBoard.tsx` — `useFamilyMember()` only
- `src/pages/ContractsPage.tsx` — `useFamilyMember()` only

These pages would render mom's data inside the target shell when accessed via View As. Many of them shouldn't be reachable from a kid shell at all (Studio, PrizeBoard, ContractsPage) — so they're protected by the sidebar not listing them in the kid case branches. But the sidebar is the only thing protecting them. There is no route-level guard.

---

## Section 7 — Recommended Build Decomposition

Five phases. Each is a worker-able chunk with clear boundaries.

### Phase 1 — Privacy & Effective-Member Hooks (Foundation)

**Scope:**
- Add `useEffectiveMember()` and `useEffectiveShell()` hooks. For now, route through `useViewAs() → useFamilyMember()` so the call surface is correct; later phases can change the implementation.
- Add an ESLint rule (or codemod) that flags `useFamilyMember()` use in page-level files for review.
- Schema migration: add `hidden_from_member_ids UUID[]` to the 8 context-sensitive tables (see Section 5). RLS additions to enforce the column on read. **No frontend UI yet.**

**Files changed:** ~10 (new hooks, schema migration, RLS policies)
**Dependencies:** None
**Workers:** 1
**Risk:** RLS additions touch many tables; mistakes here corrupt data visibility for all consumers.

### Phase 2 — Sidebar Truth Reconciliation

**Scope:**
- Rewrite `getSidebarSections(shell)` so each non-mom case branch matches `permission_level_profiles` + PRD-02 ground truth. At minimum, remove Studio / RewardRules / Prize Board Allowance admin from adult and independent. Decide on Shopping Mode and Touch Base per role.
- Apply the same to `getGuidedMoreSections()` if any — guided already has a separate hand-maintained list.
- Verify mobile More menu mirror still reads from the same source per Convention #16.

**Files changed:** `src/components/shells/Sidebar.tsx`, `src/components/shells/BottomNav.tsx`, possibly `src/components/shells/GuidedShell.tsx`'s `GUIDED_MORE_SECTIONS`. Tests for mobile/desktop nav parity.
**Dependencies:** None (independent of Phase 1)
**Workers:** 1
**Risk:** Visible to mom (her own sidebar may shift); coordinate with founder before merge.

### Phase 3 — Page-Level Data Layer Migration

**Scope:**
- Sweep the ~17 pages with inline `activeMember` forks and replace with `useEffectiveMember()` from Phase 1.
- Sweep the ~10 pages with NO View As awareness and add either (a) explicit View As awareness via `useEffectiveMember()`, or (b) hard-block via route-level guards if they should never be in View As.
- For mom-only pages, add a route-level guard component (e.g., `<MomOnlyRoute>`) so the protection isn't sidebar-only.
- Add the application-layer "show but mark private" rendering for items where `hidden_from_member_ids` includes the effective member (mom in View As sees them with a Private badge; kid in their own session can't read them by RLS).

**Files changed:** ~25 pages + ~5 shared components + route definitions in `App.tsx`
**Dependencies:** Phase 1 (hooks) must land first; Phase 2 (sidebar) optional but recommended
**Workers:** 2-3 (split by domain: Tasks/Lists/Studio cluster, Journal/Reflections/Notepad cluster, Calendar/Meetings/Messages cluster)
**Risk:** Cross-cutting — touches many surfaces. Each page change is small but the volume is real.

### Phase 4 — Hub Login as Real Auth Swap

**Scope:**
- Replace `startViewAs(kid, mom.id, family.id)` in `HubMemberAuthModal.tsx:117` with an actual auth session swap. This requires either:
  - A Supabase magic-link-style RPC that issues a JWT for the kid's `user_id` after PIN verification, OR
  - A platform-level "secondary auth" abstraction where the hub holds a parent session but a child session overlays on top, with RLS evaluating against the child.
- Update `useSessionTimeout` (`src/hooks/useSessionTimeout.ts`) to honor role-based session durations during a hub login: the PRD-01 spec says adult=24h, independent=4h, guided=1h, play=30m. Today's `SESSION_DURATIONS` table has them all at 7 days (`useSessionTimeout.ts:15-20`) — already out of spec, and the hub login pretends none of this matters because it's mom's session.
- Add a "Sign out and return to Hub" action in the kid-shell rendered after hub login.
- Decide what happens if mom is also signed in on the same device (multi-session story).

**Files changed:** `HubMemberAuthModal.tsx`, `useSessionTimeout.ts`, possibly a new `src/hooks/useHubMemberSession.ts`, new Supabase RPC, possibly schema changes for short-lived kid tokens
**Dependencies:** Phase 1 (effective member hook) and Phase 3 (pages using it). RLS-correctness from Phase 1 is the load-bearing piece for the kid session to actually be scoped correctly.
**Workers:** 1 (deep, narrow)
**Risk:** Highest. Auth is load-bearing; mistakes lock out kids or worse. Needs explicit founder sign-off on the auth model before implementation.

### Phase 5 — Privacy Marking UI

**Scope:**
- Add "Private from [member]" affordance on every surface that supports it. Heart/HeartOff handles AI context inclusion; this is a different toggle: per-row + per-target-member visibility.
- Surface the hidden state to mom inside View As ("12 entries are hidden from [kid name]" indicator).

**Files changed:** Many — every surface that owns a context-sensitive row. Realistic to scope as "the 8 tables touched in Phase 1" and stop there for v1.
**Dependencies:** Phase 1 (schema + RLS), Phase 3 (effective member hook in place)
**Workers:** 1 (low-complexity UI sweep, can run in parallel with later parts of Phase 3)
**Risk:** Lowest of the five.

### Phase ordering summary

```
P1 (foundation) ─┬─→ P3 (page sweep) ─┬─→ P4 (hub auth)
                 │                    │
                 └─→ P5 (privacy UI) ─┘

P2 (sidebar truth) — independent, can run anywhere
```

P1 is the gate. P4 is the longest pole and the highest risk. P5 is the easiest. P3 is the bulkiest. P2 is the smallest visible deliverable.

### Distribution of hub work

The hub flow's existing pattern (avatar → PIN → start session) only changes meaningfully in **Phase 4**. Phases 1-3 + 5 affect the hub by virtue of changing the underlying primitives (effective member hook, sidebar truth, page-level data forks, privacy schema). Phase 4 is the one that flips the lie about "kid is logged in."

---

## Section 8 — Hub Member-Access Flow

### The flow today

1. Family Hub renders (`src/components/hub/FamilyHub.tsx:282-633`) — either standalone (entire viewport, hub-mode kiosk) or as a perspective tab inside the dashboard.
2. Member access surfaces:
   - **Standalone:** left-edge pull tab opens a slide-in member drawer (`FamilyHub.tsx:309-409`) showing every active in-household member as a colored avatar with optional lock icon.
   - **Inline section:** `HubMemberAccessSection` (`src/components/hub/sections/HubMemberAccessSection.tsx:29-142`) — same grid pattern inside the page flow.
3. Kid taps their avatar → `setAuthMember(member)` triggers `HubMemberAuthModal` (`HubMemberAuthModal.tsx`).
4. The modal:
   - If `member.auth_method === 'none'` or null: skips PIN, fires `startViewAs(member, currentMember.id, family.id)` and navigates to `/dashboard` (`HubMemberAuthModal.tsx:71-81`).
   - Otherwise: shows PIN entry. On success (`verify_member_pin` RPC returns `success: true`): fires the same `startViewAs(...)` call (`HubMemberAuthModal.tsx:107-121`).
5. The kid is now in a View As session. They land on `/dashboard`, which renders the kid's shell inside the View As modal overlay on top of mom's shell.

### Auth state during this flow

| Question | Today's answer |
|---|---|
| Is the kid "logged in" in any meaningful sense? | **No.** Supabase auth session remains mom's. `useAuth().user.id` is mom's auth.users id. `useFamilyMember()` returns mom's `family_members` row. |
| Does RLS evaluate against the kid? | **No.** RLS evaluates `auth.uid()`, which is mom. The kid sees data through mom's permissions. |
| Whose `family_id` scope applies? | Mom's. Same family, but every cross-member visibility filter that depends on the current `family_members` row uses mom's. |
| What happens when the kid taps Sign Out? | Likely signs MOM out (sign-out path uses `useAuth().signOut`, which calls Supabase auth signOut). The kid had no separate session to sign out of. Need to verify the Guided sign-out button at `GuidedShell.tsx:417` actually signs the auth user out. |

### Does this flow respect role-based session timeouts?

**No.** `useSessionTimeout` (`src/hooks/useSessionTimeout.ts:15-20`) computes the timeout from `member.dashboard_mode`, but `member` here is mom (because `useFamilyMember()` returns mom). So a guided kid's "session" actually runs on mom's session — which today is 7 days of inactivity (or 0 = no timeout if mom is `primary_parent`). The PRD-01 spec (adult=24h, independent=4h, guided=1h, play=30m) is not enforced at all in the hub flow.

Side note: even mom's own session is out of spec. `SESSION_DURATIONS.adult = 0` means "no timeout" — but PRD-01 says 24h. This is a separate (smaller) bug.

### Hub-specific handling

- The hub does NOT pass any special flag to `startViewAs()`. From the provider's perspective, a hub login is indistinguishable from mom clicking View As from the Family Overview tab.
- There is `hub_pin` (separate from `pin_hash` on family_members) and a "Hub Mode" kiosk lock (`FamilyHub.tsx:154-200`). Hub Mode locks the hub itself but doesn't change the kid login behavior.
- After hub login, the kid is dropped into `/dashboard` which renders within `<RoleRouter>` → `<MomShell>` (because mom is still the auth user) with `<ViewAsModal>` overlay open. Visually it looks like the kid's app, but architecturally it's mom-shell-plus-overlay.

### What changes if the architectural fix lands

If Phase 4 succeeds at making hub login a real auth swap:
- The kid's `auth.uid()` resolves to a session whose `user_id` matches their `family_members.user_id`.
- `useFamilyMember()` returns the kid's row naturally.
- `useShell()` computes the kid's shell naturally.
- `useSessionTimeout` reads the kid's `dashboard_mode` and applies the PRD-01 duration.
- RLS evaluates the kid for every query — no more "kid sees what mom sees by accident."
- The View As modal is no longer involved in the hub flow at all. View As becomes purely mom's tool for "manage my kid's tasks from my own session."
- `ViewAsBanner` no longer appears for hub-logged-in kids.
- Privacy "hidden from this kid" enforcement (Phase 5) works by RLS because the kid's auth.uid() is real.

If Phase 4 does NOT land but Phases 1-3 and 5 do:
- Mom's View As becomes correct (data scoped, mom-only blocked, privacy items handled).
- Hub login still pretends. The kid's "session" is still mom's. Privacy-via-RLS doesn't work for the hub kid because RLS evaluates mom. Phase 5's privacy semantics break for hub-logged-in kids.

This is why Phase 4 is load-bearing for the full fix — and why Phase 5's privacy semantics depend on Phase 4 to be honest.

---

## File path reference table

For the orchestrator's planning, the load-bearing files cited in this audit:

| File | Lines | Role |
|---|---|---|
| `src/lib/permissions/ViewAsProvider.tsx` | 1-154 | View As state + `startViewAs/stopViewAs/switchViewAs` |
| `src/features/permissions/ViewAsModal.tsx` | 1-307 | Modal harness, fake nav, target-shell wrapper, page registry |
| `src/features/permissions/ViewAsBanner.tsx` | 1-125 | Gold pill banner |
| `src/features/permissions/ViewAsMemberPicker.tsx` | 1-281 | Member grid + `view_as_permissions` lookup for non-mom viewers |
| `src/features/permissions/ViewAsShellWrapper.tsx` | 1-16 | Now a passthrough (was previously the swap layer) |
| `src/components/shells/Sidebar.tsx` | 34-154, 206-247, 300-343 | `getSidebarSections`, View As fork, real-vs-fake nav buttons |
| `src/components/shells/BottomNav.tsx` | 66-99 | Mobile nav with View As fork |
| `src/components/shells/RoleRouter.tsx` | 32-43 | Mounts shell + ViewAsModal as siblings |
| `src/components/shells/ShellProvider.tsx` | 32-72 | Computes mom's shell from `useFamilyMember()` — never reads View As |
| `src/components/shells/MomShell.tsx` | 40-248 | Mom's shell, includes `ViewAsShellWrapper` passthrough |
| `src/components/shells/AdultShell.tsx` | 34-103 | Adult shell |
| `src/components/shells/IndependentShell.tsx` | 34-103 | Teen shell |
| `src/components/shells/GuidedShell.tsx` | 35-609 | Guided shell + GuidedBottomNav with View As fork at `:200-242` |
| `src/components/shells/PlayShell.tsx` | 28-130 | Play shell — no View As branches |
| `src/hooks/useFamilyMember.ts` | 1-97 | Returns auth-bound family_members row |
| `src/hooks/useAuth.ts` | 1-24 | Supabase auth user |
| `src/hooks/useActedBy.ts` | 1-16 | Returns `realViewerId` for write attribution |
| `src/hooks/useSessionTimeout.ts` | 1-211 | Session timeouts (out-of-spec; doesn't apply to View As / hub) |
| `src/lib/permissions/PermissionGate.tsx` | 1-110 | Three-layer permission check; respects `excludedFeatures` |
| `src/lib/permissions/usePermission.ts` | 1-156 | Layer 3 permission resolution |
| `src/components/hub/FamilyHub.tsx` | 1-635 | Hub container |
| `src/components/hub/HubMemberAuthModal.tsx` | 1-298 | Hub PIN entry → `startViewAs` (the bug) |
| `src/components/hub/sections/HubMemberAccessSection.tsx` | 1-142 | Member grid in hub |
| `src/components/hub/HubHeader.tsx` | 1-83 | Hub title bar |
| `src/App.tsx` | 75-208 | Route table + provider hierarchy |
| `src/pages/Dashboard.tsx` | 47-72, 232, 455-518 | `isViewAsOverlay` prop pattern (the correct pattern) |
| `src/pages/Tasks.tsx` | 122-138, 198 | Inline fork pattern |
| `src/pages/Lists.tsx` | 161-238 | Inline fork pattern |
| `src/pages/Journal.tsx` | 33-42 | Inline fork + the only existing privacy filter in the codebase |
| `claude/live_schema.md` | 488-489, 522, 1427, 3131-3143, 3782-3793 | The fragmented privacy model that exists today |
| `prds/foundation/PRD-02-Permissions-Access-Control.md` | 179-205, 316-337 | View As spec + view_as_permissions table |
| `CLAUDE.md` | Convention #39 | "View As renders full-shell mode" — this is the current (insufficient) convention |
