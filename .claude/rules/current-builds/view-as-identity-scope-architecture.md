# View As — Identity-Scope Architecture

## Status: ACTIVE — Workers 1–5 COMPLETE + crash detour resolved (founder-verified) — Worker 6 (close-out) next

> Cross-cutting feature-session. Touches PRD-02 (Permissions & Access Control) + PRD-14D (Family Hub) + PRD-28 (kid-visible ledger) + every shell + ~27 page-level data hooks + 1 schema decision (locked: new `origin` column on `view_as_sessions`). Companion to the parallel `prd-09b-living-shopping-list-shopping-mode.md` build whose verification is deferred — do not touch that build's files.

---

## Founding Architectural Principle (highest priority — applies throughout)

**Invisibility over blocking. Blocking is the backstop, not the UX.**

The vision is "View As = sign in as that person." Today's Guided and Play shells already do this correctly: mom's management surfaces simply do not appear in the kid's navigation. Adult and Independent shells must work the same way. The kid-via-hub flow especially: if a kid taps their avatar on the tablet, they should never see UI for something they can't use.

**Therefore, mom-only routes have two enforcement layers:**

1. **PRIMARY — sidebar/navigation invisibility (Worker 2 is load-bearing).** The nav item simply does not render if the effective member shouldn't have access. The kid never sees a "RewardRules" button at all; the surface does not exist in their world. `getSidebarSections('adult')` and `getSidebarSections('independent')` drop these items entirely.
2. **SECONDARY — hard-block route guard (Worker 4 backstop).** If someone reaches the route directly — deep link, typed URL, stale cache, bookmark — `<MomOnlyRoute>` shows a friendly blocked card. This is defense-in-depth, NOT the primary UX. A user who hits this card means we failed to make the surface invisible in their navigation; the card exists so the failure mode is "you see a friendly explanation" instead of "you see a mom-only page with broken data."

This principle is the answer to "why are we hiding things AND blocking them?" — we are not. We are hiding things. The block is what happens when hiding wasn't enough.

---

## Source Material

### Primary specs
- **PRD-02:** `prds/foundation/PRD-02-Permissions-Access-Control.md` — §Screen 5 (View As Mode), §Permission Resolution Order, `view_as_permissions` schema (lines 316–337), `view_as_mode` feature key (line 674)
- **PRD-14D:** `prds/dashboards/PRD-14D-Family-Hub.md` — §Screen 5 (Member Quick Access, lines 324–342), §Visibility table (lines 437–445), §Privacy & Transparency (line 461)
- **PRD-15 (Messaging):** `prds/communication/PRD-15-Messages-Requests-Notifications.md` line 685 — Convention #141 ("mom CANNOT read messages between dad and a teen, or between siblings, UNLESS she is a participant")

### Companion documents (load-bearing)
- **Founder decision file:** `claude/feature-decisions/View-As-Identity-Scope-Architecture.md` — 8 locked decisions, screens table, stubs list, mom-UI surfaces, cross-feature connections (read in full)
- **Research audit:** `claude/web-sync/VIEW_AS_AUDIT_2026-05-19.md` — 7,284-word independent worker audit. Sections: (1) Current architecture, (2) Hook inventory + intent classification, (3) Per-page should-behave-differently classification, (4) Sidebar config lies vs PRD-02 + permission_level_profiles, (5) Existing privacy fragments, (6) Pages already View-As-aware, (7) Recommended build decomposition, (8) Hub flow today vs after-fix

### Addenda read
- `prds/addenda/PRD-14D-Cross-PRD-Impact-Addendum.md` — perspective switcher extended beyond mom; `family_hub` feature key registered; **no new View As mechanics defined** — the hub kid-PIN flow was layered on after the PRD-14D session and this build is the first to formalize it
- `prds/addenda/PRD-Audit-Readiness-Addendum.md` — read; no cross-cutting rulings that change View As scope; the rationale-tagging convention should be honored in the new convention text replacing #39
- `prds/addenda/PRD-Template-and-Audit-Updates.md` — read; documentation convention only, no architectural impact
- `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` — confirms three-layer permission stack (Layer 1 tier / Layer 2 mom toggle / Layer 3 granular). `view_as_mode` tier is **Enhanced** (verified at line 198 of seed migration `00000000000011_permissions_remediation.sql`, role_group='mom'). `permission_level_profiles` (164 rows in prod) is the ground truth for what each role_group×level should see — this build's sidebar rewrite must reconcile against this table.
- `prds/addenda/PRD-32-32A-Cross-PRD-Impact-Addendum.md` line 13 — mentions View As affects `PlannedExpansionCard` vote attribution (`voted_via_view_as=true`, `actual_voter_id` set to mom). This is already wired via `useActedBy()` + `PlannedExpansionCard.tsx:30`. **No new schema or mechanism work** in this build for that surface — verify it still fires correctly after the hook migration.
- **No grep matches** in `prds/addenda/` for `HubMemberAuthModal`, `view_as_sessions`, `view_as_feature_exclusions` beyond PRD-32-32A. The hub PIN flow has no prior addendum coverage. This build is its first formal architectural pass.

### Conventions verified
- **#16** (mobile/desktop nav parity) — `BottomNav.tsx:94` reads from `getSidebarSections(shell)`. Sidebar rewrite automatically propagates to mobile More menu. Confirmed.
- **#39** (View As renders full-shell via `ViewAsShellWrapper`) — **STALE**. `ViewAsShellWrapper.tsx` is a 16-line passthrough as of the modal-overlay refactor. This build replaces the convention text with the modal-overlay + identity-scope + origin-flag architecture.
- **#76** (Privacy Filtered is a HARD system constraint) — applies to `archive_context_items.is_privacy_filtered` for non-mom context. Not in scope for this build's `filterKidPrivate()` helper, but the helper must not interfere with the existing context-assembly enforcement.
- **#141** (mom CANNOT read other members' messages) — Messages page is in the audit's "no View As awareness — silently broken" list. Layer 2 of this build hard-blocks mom_viewing access to `/messages` for non-mom targets OR migrates Messages.tsx to `useEffectiveMember` and relies on RLS that already evaluates `auth.uid()` = mom. Founder must decide which path. See open question Q5.
- **#243** (Safe Harbor aggregation-exclusion) — Safe Harbor is already in `PRIVACY_EXCLUSIONS = ['safe_harbor']` (`ViewAsProvider.tsx:46`) and hard-blocked via `PRIVACY_ROUTE_MAP`. This build must verify the new architecture preserves the block.
- **#257** (no client-side date writes to DATE columns) — New helpers (`useViewAsTimeout`, `filterKidPrivate`, `useEffectiveMember`) do not touch DATE columns. Compliant by construction.

### Live schema verified (`claude/live_schema.md`)
- `view_as_sessions` — **6 columns: `id`, `family_id`, `viewer_id`, `viewing_as_id`, `started_at`, `ended_at`. NO `origin` column.** 371 rows in production. Decision needed: new column or JSONB metadata column. See Q1.
- `view_as_feature_exclusions` — `id`, `session_id`, `feature_key`, `created_at`. 253 rows. Unchanged this build.
- `view_as_permissions` — `id`, `family_id`, `viewer_id`, `target_member_id`, `enabled`, `excluded_features` (JSONB), `created_at`, `updated_at`. **0 rows**. Untouched this build per decision doc #5.
- `family_members` — confirmed `dashboard_mode` enum: `'adult' | 'independent' | 'guided' | 'play' | null`. Role enum: `'primary_parent' | 'additional_adult' | 'special_adult' | 'member'`. Used by `useEffectiveShell()`.
- `permission_level_profiles` — 164 rows. Ground truth for sidebar reconciliation (Worker 2). Columns: `id`, `role_group`, `level`, `feature_key`, `feature_enabled`, `default_permission_level`, `created_at`.
- `journal_entries.visibility` — TEXT, values include `'private'`. `is_private BOOLEAN` also exists. Used by `filterKidPrivate()` Journal wiring.
- `self_knowledge.share_with_mom`, `share_with_dad`, `is_private` — used by `filterKidPrivate()` self-knowledge wiring.
- `lila_conversations.is_safe_harbor` — Safe Harbor exclusion remains via existing `excludedFeatures` + `PRIVACY_ROUTE_MAP`. No filter-helper wiring needed.

### Source files audited
- `src/lib/permissions/ViewAsProvider.tsx` (154 lines) — state + audit row insertion. Adds `origin` field this build.
- `src/features/permissions/ViewAsModal.tsx` (307 lines) — modal harness, fake state-based nav, theme apply/restore, allowed-path filter, Safe Harbor PRIVACY_ROUTE_MAP block.
- `src/features/permissions/ViewAsBanner.tsx` (125 lines) — golden-honey banner z-45, "Manage Tasks" link exits to mom's `/tasks?member=X`. Origin-aware adjustment this build.
- `src/features/permissions/ViewAsMemberPicker.tsx` (281 lines) — modal grid, loads `view_as_permissions` for non-mom viewers. Passes `origin='mom_viewing'` this build.
- `src/features/permissions/ViewAsShellWrapper.tsx` (16 lines) — confirmed passthrough. Convention #39 update target.
- `src/components/shells/Sidebar.tsx` — `getSidebarSections` (lines 34–154), `SidebarNavItem` View As fork (lines 206–247), `Sidebar()` shell derivation (lines 300–343). Audit-cited lies confirmed: adult shell includes `/studio`, `/prize-board`, `/contracts`; independent shell same plus filtered Grow.
- `src/components/shells/BottomNav.tsx` — `getSidebarSections(shell)` consumed at line 94 with `BOTTOM_NAV_PATHS` filter. Parity verified.
- `src/components/shells/RoleRouter.tsx` (43 lines) — mounts `renderShell(shell, children)` + `<ViewAsModal />` as siblings. No change this build.
- `src/components/shells/ShellProvider.tsx` (72 lines) — `useShell()` derived from `useFamilyMember()` only. **Never reads View As state.** Mom shell stays "mom" while modal is open above it (correct — the modal carries the target's shell).
- `src/components/hub/FamilyHub.tsx` — `authMember` state + `HubMemberAuthModal` invocation. `setAuthMember(m)` at line 370 from member drawer; line 441 `<HubMemberAuthModal />` host. No nav-to-/dashboard logic in FamilyHub itself.
- `src/components/hub/HubMemberAuthModal.tsx` (298 lines) — **the bug**. Line 78: `navigate('/dashboard')` for no-auth members. Line 119: `navigate('/dashboard')` after PIN success. Both fired AFTER `startViewAs(member, currentMember.id, family.id)` (lines 76, 117). Mom's session never changes; the navigate-to-/dashboard is what jumps off `/hub`. This build kills both navigates and adds `origin='member_session'` to both `startViewAs()` calls.
- `src/components/hub/sections/HubMemberAccessSection.tsx` — second entry point to the same HubMemberAuthModal. Inherits the same fix for free.
- `src/hooks/useFamilyMember.ts` (97 lines) — auth-only query. **Stays as-is.** 119 callers protected.
- `src/hooks/useAuth.ts` — Supabase auth user. Untouched.
- `src/hooks/useActedBy.ts` (16 lines) — already correctly returns `realViewerId` when View As active. Unchanged this build.
- `src/hooks/useSessionTimeout.ts` (211 lines) — current `SESSION_DURATIONS`: adult=0, others=7d. Out of spec per PRD-01 but **intentionally NOT being changed** this build per decision doc #5. New `useViewAsTimeout` is a SEPARATE hook scoped only to the modal lifetime.
- `src/lib/permissions/PermissionGate.tsx` (110 lines) — already honors `excludedFeatures` via `useViewAs()`. Behavior preserved.
- `src/pages/Dashboard.tsx:48-72` — `isViewAsOverlay` prop pattern is correct; `displayMemberId = (isViewAsOverlay && viewingAsMember?.id) || member?.id`. Stays. Simplify after `useEffectiveMember()` lands.
- `src/pages/Journal.tsx:33-42` — **the only existing kid-private filter in the codebase.** Lines 36-37 `activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member`. Lines 39-42 strip `visibility='private'` when `isViewingAs`. This logic gets refactored into `filterKidPrivate()` and Journal becomes a consumer.
- `src/pages/Tasks.tsx:122-125`, `Lists.tsx:163-164`, `ShoppingMode.tsx:17-21`, `ReflectionsPage.tsx:30-34`, `RhythmsSettingsPage.tsx:39`, `GuidingStars.tsx:189-194`, `BestIntentions.tsx:810-815`, `InnerWorkings.tsx:51-55`, `NotepadContext.tsx:46-52` — all follow the same inline `activeMember` fork pattern. Worker 3 sweep targets.
- `src/components/guided/WriteDrawer.tsx:22`, `CelebrateSection.tsx:24`, `EveningGreetingSection.tsx:26` — same pattern in components. Worker 3 sweep targets.
- `src/App.tsx` (223 lines) — full route table read. 40+ routes. Hub at `/hub` uses `ProtectedRouteNoShell`. Admin under `<AdminGate>`. Worker 4 hardens mom-only routes.

### Existing wiring & RLS verified
- `view_as_sessions` audit insertion: working (`ViewAsProvider.startViewAs` line 50, `switchViewAs` line 105). Includes `family_id`, `viewer_id`, `viewing_as_id`, `started_at`. `ended_at` set on stop.
- `view_as_feature_exclusions` per-session writes: working (`ViewAsProvider.startViewAs` line 68 auto-applies `['safe_harbor']`).
- `ViewAsModal` Safe Harbor block: working (`ViewAsModal.tsx:294`).
- `useActedBy()` consumed by PlannedExpansionCard for `voted_via_view_as` attribution: working per PRD-32-32A.
- Sidebar mobile parity: working (`BottomNav` reads from `getSidebarSections`).

---

## Founder Decisions (locked 2026-05-19, expanded 2026-05-25)

### Original 8 decisions (2026-05-19)
1. **Identity-scoping = Option β.** Keep `useFamilyMember()` as auth-user (119 callers). Add `useEffectiveMember()` for "data subject" (~27 callers).
2. **Origin flag on ViewAs state:** `origin: 'mom_viewing' | 'member_session'`. Caller of `startViewAs()` sets it.
3. **Modal-only inactivity timeout, 15-min default.** PRD-01 spec timeouts intentionally NOT being enforced.
4. **Kid-private filter helper** (`filterKidPrivate()`) — promotes Journal inline pattern to shared utility.
5. **No "mom hides from this kid" privacy schema.** Dropped from roadmap.
6. **Modal close behavior depends on origin.** `mom_viewing` → no nav. `member_session` → ensure underlying route is `/hub`.
7. **Convention #39 in CLAUDE.md is STALE.** Replaced this build (Worker 6).
8. **Hub PIN flow uses the same modal as mom's View As** — different `origin`, same architecture.

### Founder answers to 9 build questions (2026-05-25)
- **Q1: `view_as_sessions.origin` = NEW COLUMN — APPROVED.** Default `'mom_viewing'` for implicit backfill of 371 existing rows. Worker 1 writes migration.
- **Q2: HELD.** Founder will not approve the mom-only route list blind. **Deliverable A surfaced this turn** — see end of file. No worker dispatch until founder reviews.
- **Q2a: Kid version of Prize Board ("My Rewards") — APPROVED with scope.**
  - Hard-block mom's `/prize-board` from kid surfaces (Worker 4 `<MomOnlyRoute>` backstop; primary enforcement is sidebar omission per Worker 2).
  - Build separate kid-facing surface that shows ONLY what THIS child has earned (prizes, allowance balance, money for tasks).
  - PRD-28's `child_can_see_finances` (already wired into PrizeBoard.tsx, LedgerView.tsx, BalanceCard.tsx, AllowanceCalculatorTracker.tsx, ChildAllowanceConfig.tsx) governs whether dollar amounts render — reuse where applicable. It does NOT cover "show My Rewards surface entirely" — that scope is broader. Worker 4 adds a sibling toggle (`family_members.preferences.show_my_rewards`, default false) that controls whether the "My Rewards" sidebar entry renders AT ALL. When off, the surface is invisible in the kid's nav.
  - **THIS BUILD scope:** route + sidebar entry + per-child toggle + shell wiring. Page content is a stub (`<PlannedExpansionCard featureKey="my_rewards_page" />`). Real content is a follow-up build registered in STUB_REGISTRY with its own feature-decision doc.
- **Q3: Blocked card with friendly explanatory text — APPROVED as SECONDARY UX.** Primary is invisibility (sidebar omission). Card is the safety net for direct URL/deep-link reach. Copy:
  - `mom_viewing` origin: "This is a mom-only area. Tap Exit View As to access it."
  - `member_session` origin: "Ask mom to help with this — it's a parent-only area."
  - Implementation: extend `<PrivacyBlockedPage />` pattern from `ViewAsModal.tsx:127-144` into `<MomOnlyRoute>`.
- **Q4: Both candidates confirmed kid-private — APPROVED.**
  - `reflection_responses` with private flag → private from mom in View As, private from anyone-but-the-kid in hub login.
  - `journal_entries` with `entry_type='lila_conversation'` → same.
  - **Safe Harbor data ALSO folded into kid-private set this build** so it doesn't leak to mom-via-View-As while decommission is being planned. Survives until Safe Harbor decommission build lands (separate scoped follow-up — see stubs).
  - Worker 5 wires all three (plus existing Journal `visibility=private` and self_knowledge `share_with_mom=false`) into `filterKidPrivate()`.
- **Q5: Migrate Messages + trust RLS — APPROVED.** Mom-via-View-As → page loads empty for non-participant spaces (RLS evaluates mom's auth.uid()). Kid-via-hub → kid's actual conversations show (correct outcome under current architecture; will get cleaner when real auth swap lands in a future build). Worker 4 documents spot-check result in Mom-UI Verification table.
- **Q6: 2-min warning before modal close — APPROVED.** Hook design: `useViewAsTimeout({default: 15*60_000, warnAt: 2*60_000})`. Warning UX: non-blocking banner inside modal at 13-min idle saying "View As session will end in 2 minutes" with an "I'm still here" button that resets the idle timer. Silent close at 15-min. Worker 5 builds hook + warning banner.
- **Q7: HELD.** Founder will not merge new foundational convention text blind. **Deliverable B surfaced this turn** — see end of file. No worker dispatch until founder reviews.
- **Q8: InfoRecentVictories.tsx — Worker 3 decision.** Migrate if intent matches `useEffectiveMember()`. Leave alone if View-As-specific cosmetic. Decision documented in commit message + Post-Build Verification.
- **Q9: DELETE `ViewAsShellWrapper.tsx`.** Add to Worker 6 scope. Remove import + 16-line passthrough from `MomShell.tsx`. If a wrapper is needed later, five-minute add.

---

## Database Changes Required

**1 column. No new tables. No new RLS policies. Q1 LOCKED (2026-05-25).**

| Table | Change | Status |
|---|---|---|
| `view_as_sessions` | `ALTER TABLE view_as_sessions ADD COLUMN origin TEXT NOT NULL DEFAULT 'mom_viewing' CHECK (origin IN ('mom_viewing','member_session'))` | **APPROVED.** Worker 1 writes migration. Existing 371 rows backfilled to `'mom_viewing'` via DEFAULT (implicit). |
| `view_as_feature_exclusions` | unchanged | — |
| `view_as_permissions` | unchanged (0 rows, untouched) | — |
| All other tables | unchanged | — |

Rationale for column over JSONB: query-friendly for audit ("how many member_session sessions last month?"), no JSON parse cost on every `ViewAsProvider` read, follows existing flat-column schema of `view_as_sessions`.

---

## Feature Keys

One new feature key required for the "My Rewards" stub (Q2a):

| Feature Key | Tier | Verified | Notes |
|---|---|---|---|
| `view_as_mode` | Enhanced (role_group='mom') | ✓ in `feature_key_registry` + `feature_access_v2`, seeded in `00000000000002` and `00000000000011` migrations | No change |
| `family_hub` | Enhanced | ✓ | No change |
| `my_rewards_page` | Essential (kid-facing) | **NEW (stub registration)** | Worker 4 registers in `feature_key_registry`. `PlannedExpansionCard` renders against this key. Tier = Essential because every kid earning anything should see their balance. Per-child `show_my_rewards` preference toggle (NOT the tier) gates whether the sidebar entry renders. |

---

## Stubs — Do NOT Build This Phase

Documented in decision doc, restated for clarity. **Updated 2026-05-25** with founder Q2a + Safe Harbor decisions:

- [ ] **My Rewards page content** — Worker 4 lands the route + sidebar entry + per-child toggle + `<PlannedExpansionCard>` stub. Real kid-facing prize/balance UI is a separate scoped follow-up build with its own feature-decision doc.
- [ ] **Safe Harbor decommission** — separate scoped follow-up build. Founder is scrapping Safe Harbor (too big to do effectively, not main product purpose, better-suited tools exist with better legal cover, liability concern). Scope of the future decommission build:
  - Its own feature-decision doc (decommission scope, what stays, what goes, data migration plan for any existing data)
  - PRD-20 status change (deprecated → removed)
  - Convention sweep: #6, #7, #56-59, #243, and anything else mentioning Safe Harbor
  - Schema cleanup: `is_safe_harbor` on `lila_conversations`, `safe_harbor_orientation_completions`, `safe_harbor_literacy_completions`, `safe_harbor_consent_records`, `lila_guided_modes` rows for safe_harbor variants
  - Edge function cleanup: anywhere safe_harbor mode is handled
  - Sidebar/route cleanup: `/safe-harbor` route removal, `PRIVACY_EXCLUSIONS` entry removal
  - **For THIS build: Safe Harbor surfaces remain functional but invisible to mom-via-View-As (folded into `filterKidPrivate()` scope). No removal.**
- [ ] Mom-configures-per-kid privacy gates UI — **Dropped from roadmap.**
- [ ] `/hub` as installable PWA — separate follow-up build `B-followup-1`.
- [ ] Real Supabase secondary-auth swap for kids on shared tablets — not needed under chosen architecture.
- [ ] Configuration UI for `view_as_feature_exclusions` beyond the hardcoded Safe Harbor entry.
- [ ] Real-time session-end propagation across devices.
- [ ] PRD-01 spec session timeouts (adult=24h, independent=4h, guided=1h, play=30m) — **intentionally NOT enforced.** Only the new View-As-modal 15-min inactivity timer is in scope.
- [ ] Auto-titling or AI session summary on View As sessions.
- [x] ~~Reverting `ViewAsShellWrapper.tsx` deletion~~ — Q9 LOCKED: DELETE this build (Worker 6). Not a stub.

All stubs to be registered in `STUB_REGISTRY.md` at close-out (Convention #14 Part B).

---

## Cross-Feature Dependencies

| This feature | Direction | Connected to | Via | Status |
|---|---|---|---|---|
| `ViewAsIdentityScope` provider | → | ~27 page-level callers | `useEffectiveMember()` / `useEffectiveShell()` | NEW |
| `ViewAsModal` | → | Sidebar / BottomNav config | `useEffectiveShell()` (Workers 1+2) | NEW — replaces inline derivation in Sidebar.tsx:307-317 and BottomNav.tsx:76-86 |
| `ViewAsModal` | → | Per-target theme | Existing `useTheme().setTheme()` apply/restore | UNCHANGED |
| `HubMemberAuthModal` (PRD-14D) | → | `startViewAs(target, mom.id, family.id, 'member_session')` | New `origin` parameter (Worker 5) | NEW |
| `ViewAsMemberPicker` | → | `startViewAs(target, mom.id, family.id, 'mom_viewing')` | New `origin` parameter (Worker 5) | NEW |
| `filterKidPrivate()` helper | → | Journal (existing logic), Safe Harbor surfaces, self_knowledge | Replaces inline filter at `Journal.tsx:33-42` (Worker 5) | NEW |
| `<MomOnlyRoute>` guard | → | Studio, PrizeBoard, Contracts, PermissionHub, FamilyMembers, FamilySetup, /settings/* admin sub-routes, Archives admin sub-routes, Admin Console | Hard-blocks when modal target is non-mom (Worker 4) | NEW |
| `useViewAsTimeout` hook | → | `ViewAsModal` | Mouse/key/touch/scroll subscription scoped to modal lifetime; calls `stopViewAs()` on idle (Worker 5) | NEW |
| `view_as_sessions` insert | → | Audit row + new `origin` field | `ViewAsProvider.startViewAs/switchViewAs` (Worker 1) | MODIFIED |
| PlannedExpansionCard attribution | → | `useActedBy()` (existing) | No change — verify still fires correctly through new architecture (Worker 6 audit step) | UNCHANGED |
| Safe Harbor `excludedFeatures` | → | `PermissionGate` + `PRIVACY_ROUTE_MAP` block | Preserved — verify still fires (Worker 6 audit step) | UNCHANGED |

### Connections that connect back to this feature LATER
- B-followup-1 (`/hub` as installable PWA) — closes the tablet app shortcut bounce-to-/dashboard loop.
- PRD-15 Messaging integration — when message coaching is wired, sender identity must use `useEffectiveMember()`, not `useFamilyMember()`. The pattern this build establishes is the template. **High-priority verify** for Worker 4 cluster B.
- PRD-30 Safety Monitoring — when wired, safety classification of typed input inside the modal evaluates against the target's age/sensitivity settings via `useEffectiveMember()`.

---

## Screens & Components

| Screen / Component | Status | Worker | Notes |
|---|---|---|---|
| `ViewAsModal` | Refactor | 1, 5 | Wrap children in `ViewAsIdentityScope`. Read `origin` from context. Close behavior origin-aware. |
| `ViewAsIdentityScope` provider | **NEW** | 1 | React-tree-scoped context exposing `{target, origin, realViewerId}`. Consumed by `useEffectiveMember()`/`useEffectiveShell()`/`useEffectiveViewer()`. |
| `useEffectiveMember()` hook | **NEW** | 1 | Returns `{member, isViewAs, origin, realViewerId}`. Falls back to `useFamilyMember()` outside scope. |
| `useEffectiveShell()` hook | **NEW** | 1 | Returns target's shell when in scope, mom's shell otherwise. Replaces inline `useMemo` in `Sidebar.tsx:307-317` and `BottomNav.tsx:76-86` (Worker 2 wires consumers). |
| `useEffectiveViewer()` helper | **NEW** | 1 | `{realHumanIsTarget: origin === 'member_session'}`. Consumed by `filterKidPrivate()`. |
| `filterKidPrivate()` helper | **NEW** | 5 | Pure function: `(items, {origin, isKidPrivate}) => filteredItems`. Lives in `src/lib/permissions/` or `src/utils/`. |
| `ViewAsProvider` | Refactor | 1 | Add `origin` state. `startViewAs()` accepts `origin` param. Write `origin` to `view_as_sessions` (depends Q1). |
| `ViewAsBanner` | Minor adjustment | 5 | Hide "Manage Tasks" button when `origin === 'member_session'` (kid doesn't need a shortcut to mom's task manager). |
| `ViewAsMemberPicker` | Caller update | 5 | `startViewAs(target, viewer.id, family.id, 'mom_viewing')`. |
| `HubMemberAuthModal` | Refactor | 5 | Remove `navigate('/dashboard')` at lines 78 and 119. Pass `origin='member_session'` to `startViewAs()`. Close behavior: modal renders layered over `/hub`. |
| `HubMemberAccessSection` | No change | — | Inherits HubMemberAuthModal fix automatically. |
| Sidebar `adult` shell config | Rewrite | 2 | Drop Studio, PrizeBoard (admin tabs), RewardRules. Reconcile against `permission_level_profiles` rows where `role_group='dad_adult'`. Decide on Touch Base/Shopping Mode/Trackers per role per PRD-31 profile chart. |
| Sidebar `independent` shell config | Rewrite | 2 | Same — drop Studio/PrizeBoard/RewardRules/Shopping Mode (per PRD-31 likely lie). Reconcile against `role_group='independent_teen'`. |
| Sidebar `guided` shell config | Verify | 2 | Already minimal (Tasks/Messages/Journal/Reflections/Victories + BookShelf). Confirm Messages stub framing and BookShelf scope against PRD-31. |
| Sidebar `play` shell config | Verify | 2 | Returns `[]` (no sidebar). Confirm PlayShell's own nav (Home/Tasks/Stars/Fun) does not expose mom-only routes via deep links. |
| Sidebar `SidebarNavItem` View As fork | No change | — | Already correctly routes via `useViewAsNav` when `isViewingAs`. Works unchanged with new architecture. |
| BottomNav More menu | Auto-inherits | 2 | Reads from `getSidebarSections(shell)`. Convention #16 verified. |
| `<MomOnlyRoute>` route guard | **NEW** | 4 | New tiny component wrapping `<ProtectedRoute>`. When `origin === 'member_session'` OR target is non-mom, hard-block with friendly redirect to /hub (member_session) or to mom's /dashboard (mom_viewing). See Q3. |
| Modal inactivity timeout | **NEW** | 5 | `useViewAsTimeout(timeoutMs = 15*60_000)` hook, mouse/key/touch/scroll subscription inside modal scope. See Q6 (warning UX). |
| `Dashboard.tsx` `isViewAsOverlay` plumbing | Simplify | 3 | Keep `isViewAsOverlay` prop for cosmetic flags (hide Sign Out, hide family-setup prompt, disable long-press edit). Move `displayMemberId` derivation to `useEffectiveMember()`. |
| `GuidedDashboard.tsx`, `PlayDashboard.tsx` | Simplify | 3 | Same pattern. |
| `Tasks.tsx` `activeMember` fork | Migrate | 3 | Replace inline ternary with `useEffectiveMember()`. |
| `Lists.tsx` `activeMember` fork | Migrate | 3 | Same. |
| `Journal.tsx` `activeMember` + private filter | Migrate + refactor | 3, 5 | Worker 3 migrates `activeMember`. Worker 5 refactors private filter to use `filterKidPrivate()`. |
| `ReflectionsPage.tsx`, `RhythmsSettingsPage.tsx`, `ShoppingMode.tsx`, `GuidingStars.tsx`, `BestIntentions.tsx`, `InnerWorkings.tsx` `activeMember` forks | Migrate | 3 | Same pattern across 6 pages. |
| `NotepadContext.tsx` `effectiveMember` | Migrate | 3 | Replace local `effectiveMember` derivation with hook. |
| `WriteDrawer.tsx`, `CelebrateSection.tsx`, `EveningGreetingSection.tsx` | Migrate | 3 | Three Guided components. |
| `CalendarPage`, `MeetingsPage`, `MessagesPage`/`MessagesSpacePage`/`MessagesThreadPage`, `ArchivesPage`/`MemberArchiveDetail`/`FamilyOverviewDetail`, `VaultBrowsePage`/`PersonalPromptLibraryPage`, `VictoryRecorder`, `GuidedVictories`, `BookShelfPage` | Migrate-or-hard-block | 4 | The ~10 zero-awareness pages. Per-page decision per Q4. Default: Calendar/Meetings/Vault/Bookshelf/Victories migrate via `useEffectiveMember()`. Messages = high-priority Convention #141 audit (Q5). Archives admin sub-routes hard-block. |
| Studio, PrizeBoard, Contracts, PermissionHub, FamilyMembers, FamilySetup, FamilyLoginName, AllowanceSettings, HomeworkSettings, GamificationSettings, RewardRevealLibrary, Archives/family-overview, Archives/privacy-filtered, Archives/export | Hard-block | 4 | `<MomOnlyRoute>` guard. |

---

## Mom-UI Surfaces

| Surface | Shells | New / Modification |
|---|---|---|
| ViewAsModal — mom-origin (opened from mom's dashboard) | Mom | Modification (identity scope inside; close returns to mom dashboard) |
| ViewAsModal — member-session origin (opened from family hub PIN flow) | hub overlay (no shell underneath) | Modification (close returns to `/hub`, not `/dashboard`) |
| Sidebar inside ViewAs modal — Adult shell config | Adult | Modification (drop mom-only items per PRD-31 profile) |
| Sidebar inside ViewAs modal — Independent shell config | Independent | Modification (drop mom-only items per PRD-31 profile) |
| Sidebar inside ViewAs modal — Guided shell config | Guided | Verify — already kid-appropriate per audit |
| Sidebar inside ViewAs modal — Play shell | Play | Verify — no sidebar; confirm child-facing dashboard renders with kid's data via `useEffectiveMember()` |
| BottomNav More menu inside ViewAs modal | Adult, Independent | Modification (auto-inherits sidebar rewrite via Convention #16) |
| ViewAsBanner — mom-origin | modal banner | Adjustment (Manage Tasks visible) |
| ViewAsBanner — member-session origin | modal banner | Adjustment (Manage Tasks hidden) |
| HubMemberAuthModal post-PIN landing | hub | Modification (no longer navigates to /dashboard; modal layered over /hub) |
| Lists page rendered inside ViewAs modal | target shell | Verify — must show target member's lists via `useEffectiveMember()` |
| Tasks page rendered inside ViewAs modal | target shell | Verify — must show target member's tasks |
| Journal rendered inside ViewAs modal — mom_viewing | target shell | Verify — kid-private entries HIDDEN from mom |
| Journal rendered inside ViewAs modal — member_session | target shell | Verify — kid-private entries SHOWN to kid (self-viewing) |
| Victories rendered inside ViewAs modal | target shell | Verify — target member's victories |
| Calendar rendered inside ViewAs modal | target shell | Verify — target member's events |
| Meetings/Touch Base rendered inside ViewAs modal | target shell | Verify — Touch Base scoped to target |
| **Messages rendered inside ViewAs modal — mom_viewing** | target shell | **HIGH-PRIORITY verify** — Convention #141 boundary. Founder decides Q5. |
| Settings rendered inside ViewAs modal | target shell | Verify — target's settings, not mom's |
| Mom-only routes (Studio, PrizeBoard admin, Contracts, etc.) reached via URL inside modal | any non-mom shell | Hard-blocked by `<MomOnlyRoute>` guard. UX = Q3. |
| Modal inactivity timeout → close | All | 15-min default. Warning UX = Q6. |

## Mom-UI Verification (populate during build)

**Worker 2 status (2026-05-28, REVISED):** Initial pass over-pruned Adult and Independent shells by treating PRD-31 Balanced as a strict ceiling. Founder corrected: the sidebar is NOT a tier ceiling. Tier limits flow through `feature_access_v2` + `useCanAccess()` (Convention #10 — beta returns true; post-beta the existing `tierLocked` Lock icon renders); per-kid Permission Hub overrides flow through sparse `member_feature_toggles` (Convention #11) via Follow-Up Build E (`claude/follow-up-builds/per-member-sidebar-customization.md`). Revision: only Studio / Prize Board / RewardRules stay dropped (founder Q2 mom-only management surfaces). Everything else restored. Tests rewritten to assert PRESENCE of restored items; 31/31 passing. Founder eyes-on at 3 viewports remains Checkpoint 5 close-out gate. Runbook below the table.

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| ViewAsModal — mom-origin (open from mom dashboard) | ✅ | ⏸ founder eyes-on | ⏸ founder eyes-on | Mom | Founder live-verified during 2026-05-30 cross-shell detour — dashboard View-As of Gideon (Independent) renders the kid's shell + modal stays open; banner readable light + dark. Tablet/mobile pending eyes-on. | 2026-05-30 |
| ViewAsModal — member-session origin (open from /hub PIN) | ✅ | ⏸ founder eyes-on | ⏸ founder eyes-on | hub overlay | Founder live-verified during 2026-05-30 cross-shell detour — hub PIN renders the kid's shell over `/hub`; banner readable light + dark. Tablet/mobile pending eyes-on. | 2026-05-30 |
| Sidebar inside modal (Adult target) | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Adult | `tests/sidebar-sections.test.ts` 12 adult tests PASS · founder vision (permissive sidebar, layered gating via Convention #10 tier + Convention #11 sparse `member_feature_toggles`) · founder Q2 mom-only drops: Studio / Prize Board / RewardRules · Archives NOT included per founder revision (Dad default; Mom adds via Follow-Up Build E) | 2026-05-28 (functional, revised) |
| Sidebar inside modal (Independent target) | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Independent | `tests/sidebar-sections.test.ts` 11 independent tests PASS · founder vision (permissive sidebar + layered gating) · founder Q2 mom-only drops same as Adult · `life_lantern_teen` feature key cited for teen LifeLantern · Family Feeds present as PRD-32A demand-validation stub · Archives NOT included (teen default; Mom adds via Follow-Up Build E) | 2026-05-28 (functional, revised) |
| Sidebar inside modal (Guided target) | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Guided | `tests/sidebar-sections.test.ts` 4 guided tests PASS · audit `claude/web-sync/VIEW_AS_AUDIT_2026-05-19.md` §4 Guided shell ("OK") · prior structure preserved (Tasks/Messages/Journal/Reflections/Victories + BookShelf) · My Rewards added gated | 2026-05-28 (functional, revised) |
| Sidebar inside modal (Play target — no sidebar; dashboard data check) | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Play | `tests/sidebar-sections.test.ts` 2 play tests PASS (returns `[]`) · PlayShell own nav unchanged: Home/Tasks/Stars/Fun · Fun tab → existing `/rewards` → PlayRewards page (per-kid sticker book + earned prizes) — no separate My Rewards entry needed per Worker 2 decision | 2026-05-28 (functional, revised) |
| BottomNav More menu inside modal (Adult) | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Adult | `BottomNav.tsx:94` reads `getSidebarSections(shell, { showMyRewards })` — Convention #16 single-source-of-truth · same 12 adult unit tests cover the structure consumed | 2026-05-28 (functional, revised) |
| BottomNav More menu inside modal (Independent) | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Independent | Same — same source as Sidebar.tsx | 2026-05-28 (functional, revised) |
| Modal close → mom's dashboard intact underneath (mom-origin) | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Mom | Worker 5 scope — modal-stays-open-over-dashboard confirmed during 2026-05-30 detour; explicit close-back-to-dashboard pending eyes-on. | |
| Modal close → `/hub` intact underneath (member-session) | ✅ | ⏸ founder eyes-on | ⏸ founder eyes-on | hub overlay | Founder live-verified during 2026-05-30 cross-shell detour — Return-to-Hub lands back on `/hub` cleanly. Tablet/mobile pending eyes-on. | 2026-05-30 |
| Modal inactivity timeout (15-min default, confirm close behavior) | | | | All | Worker 5 scope | |
| Lists page inside modal — target member's data | | | | Adult/Independent/Guided | Worker 3 scope | |
| Tasks page inside modal — target member's data | | | | Adult/Independent/Guided/Play | Worker 3 scope | |
| Journal inside modal — mom_viewing — kid-private HIDDEN | | | | Adult/Independent/Guided | Worker 5 scope | |
| Journal inside modal — member_session — kid-private SHOWN | | | | Independent/Guided | Worker 5 scope | |
| Victories inside modal — target's victories | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Adult/Independent/Guided/Play | `VictoryRecorder.tsx:41` + `GuidedVictories.tsx:16` now `useEffectiveMember()` → victory queries (`useVictories`/`useRecentVictories`/`useVictoryCount`) + recording (`family_member_id`) scope to the data subject. `tsc -b` clean. | 2026-05-28 (functional) |
| Calendar inside modal — target's events | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Adult/Independent/Guided | `CalendarPage.tsx:117` now `useEffectiveMember()` → `usePendingCounts(family,member.id)`, "me" filter (`member.id`), and primary_parent-only affordance (`member.role`, line 433) all scope to the data subject. `tsc -b` clean. | 2026-05-28 (functional) |
| Meetings inside modal — target's meetings | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Adult/Independent | `MeetingsPage.tsx:382` page-level `member` now `useEffectiveMember()`. Sub-components (Conversation/Review/ScheduleEditor/CustomTemplate) KEPT `useFamilyMember()` for facilitator/personal-impression actor attribution (#232). `tsc -b` clean. | 2026-05-28 (functional) |
| Messages inside modal (Convention #141 boundary) | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Adult/Independent/Guided | `MessagesPage.tsx:133` + `MessagesSpacePage.tsx:18` + `MessagesThreadPage.tsx:21` now `useEffectiveMember()` (Q5). RLS still evaluates mom's `auth.uid()`, so non-participant spaces resolve empty — #141 boundary preserved by RLS, not changed. **High-priority Discipline 1 smoke test #1 below.** `tsc -b` clean. | 2026-05-28 (functional) |
| Settings inside modal — target's settings | | | | All | Worker 3 scope | |
| Studio reached by URL inside modal — hard-blocked | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Non-mom shells | `App.tsx` `/studio` wrapped in `<MomOnlyRoute>`. Guard reads `useEffectiveMember()` — when `isViewAs && member.role !== 'primary_parent'` renders the friendly blocked card (origin-aware copy) instead of `<ProtectedRoute>` (so RoleRouter+modal do not mount and the card is visible). **Discipline 1 smoke test #2 below.** `tsc -b` clean. | 2026-05-28 (functional) |
| Prize Board admin tabs reached by URL — hard-blocked | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Non-mom shells | `App.tsx` `/prize-board` wrapped in `<MomOnlyRoute>`. Same guard path as Studio. `tsc -b` clean. | 2026-05-28 (functional) |
| Contracts reached by URL — hard-blocked | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Non-mom shells | `App.tsx` `/contracts` wrapped in `<MomOnlyRoute>`. Same guard path. `tsc -b` clean. | 2026-05-28 (functional) |
| Permission Hub reached by URL — hard-blocked | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Non-mom shells | `App.tsx` `/permissions` wrapped in `<MomOnlyRoute>`. Same guard path. `tsc -b` clean. | 2026-05-28 (functional) |
| Family Setup reached by URL — hard-blocked | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Non-mom shells | `App.tsx` `/family-setup` wrapped in `<MomOnlyRoute>`. Same guard path. `tsc -b` clean. | 2026-05-28 (functional) |
| Sidebar/BottomNav parity (Convention #16) after rewrite | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Adult/Independent | Both files consume `getSidebarSections(shell, { showMyRewards })` from the same module. `BottomNav.tsx` filters `BOTTOM_NAV_PATHS` only (dashboard/tasks/bookshelf/vault) per Convention #16. **Structural parity verified in code; eyes-on confirms visual identical at 375px.** | 2026-05-28 (structural) |
| PlannedExpansionCard `voted_via_view_as` attribution still fires (PRD-32-32A regression) | | | | Mom | Worker 6 audit — `useActedBy()` untouched | |
| Safe Harbor block still fires (`PRIVACY_ROUTE_MAP`) | | | | Any non-mom target | Worker 6 audit — `ViewAsModal.tsx:294` untouched | |

### Worker 2 runbook for founder eyes-on at Checkpoint 5

For each Worker-2-owned row above with ⏸ markers, the founder runs the following with the dev server up (`npm run dev`):

**Setup (one-time per shell target):**

1. Pick one test family member of each shell type (Adult, Independent, Guided, Play). Founder's family already has these.
2. In Supabase Studio → `family_members` row for the target:
   - For the **default-invisibility** check: leave `preferences` as `null` / `{}`, OR set `{"show_my_rewards": false}`.
   - For the **toggle-on** check: set `preferences` to `{"show_my_rewards": true}`.

**Per-row execution (Adult / Independent / Guided / Play):**

- **Desktop ≥1024px:** Sign in as mom → mom dashboard → ViewAsMemberPicker → select target. Inside the modal verify the sidebar contents:
  - **Adult (revised):** Plan & Do shows Tasks, Calendar, Touch Base, Trackers, Lists, Shopping Mode — NO Studio, NO Prize Board, NO RewardRules. Capture & Reflect shows Journal + Reflections + Rhythms. Grow shows Guiding Stars + BestIntentions + InnerWorkings + Victories + LifeLantern. Family shows Messages + People + Family Feeds. AI & Tools shows AI Vault only (NO Archives — Dad default). BookShelf section shows Library + Study Guides + Journal Prompts.
  - **Independent (revised):** Plan & Do shows Tasks, Calendar, Touch Base, Trackers, Lists, Shopping Mode — NO Studio, NO Prize Board, NO RewardRules. Capture & Reflect shows Journal + Reflections + Rhythms. Grow shows Guiding Stars + BestIntentions + InnerWorkings + Victories + LifeLantern (teen). Family shows Messages + Family Feeds. AI & Tools shows AI Vault only (NO Archives — teen default). BookShelf section shows Library + Study Guides + Journal Prompts.
  - **Guided:** Home, My Day (Tasks, Messages, Journal, Reflections, Victories), BookShelf. Unchanged from prior.
  - **Play:** No sidebar renders (PlayShell uses its own bottom nav: Home/Tasks/Stars/Fun).
  - **Discipline 1 toggle round-trip:** with target's `preferences.show_my_rewards=true`, refresh the modal. Confirm "My Rewards" entry appears in Plan & Do (Adult/Independent) or My Day (Guided). Toggle off in Supabase Studio. Refresh. Confirm entry disappears.
- **Tablet ~768px:** DevTools mobile-emulate to ~768px. Repeat sidebar checks (sidebar renders as overlay at this width — open via swipe or chevron).
- **Mobile ≤640px:** DevTools mobile-emulate to 375px. Tap "More" in bottom nav. Confirm the More menu shows the same items in the same sections as desktop sidebar (Convention #16 parity), minus pinned bottom-tab items (Home, Tasks, BookShelf, AI Vault).

Mark each cell ✅ when confirmed at that viewport. Update the Evidence column with "founder eyes-on confirmed YYYY-MM-DD".

### Worker 2 architectural decisions made (recorded for audit)

1. **REVISED — sidebar is permissive, NOT a tier ceiling (founder corrected 2026-05-28).** The initial Worker 2 pass treated PRD-31 Balanced as a strict ceiling and dropped Adult Journal/InnerWorkings/LifeLantern/AI Vault/BookShelf section + Independent Touch Base/Shopping Mode/AI Vault/BookShelf section. Founder corrected: tier gating flows through `feature_access_v2` + `useCanAccess()` (Convention #10); per-kid Permission Hub overrides flow through sparse `member_feature_toggles` (Convention #11) via Follow-Up Build E. The sidebar surfaces what the shell could plausibly use. ONLY mom-only management surfaces (Studio, Prize Board, RewardRules per founder Q2) get dropped at the sidebar layer — these are the surfaces with no kid-equivalent at all. Everything else stays visible; gating is layered elsewhere.
2. **Archives intentionally NOT in Adult or Independent default config.** Founder revision: "Do NOT restore Archives — Dad does not get Archives by default" / "Do NOT restore Archives — teens do not get Archives by default." Mom adds via Permission Hub when Follow-Up Build E ships.
3. **`useShowMyRewards()` built as a dedicated hook** at `src/hooks/useShowMyRewards.ts`. Reads `family_members.preferences.show_my_rewards` via supabase select with 30-second `staleTime`. Default `false` when memberId is null/preference is unset. Hook consumed by both `Sidebar.tsx` and `BottomNav.tsx`; React Query caches across both via shared key `['family-member-preferences', memberId, 'show_my_rewards']`.
4. **`getSidebarSections` signature widened** to `(shell: ShellType, options?: { showMyRewards?: boolean }): NavSection[]`. Pure function preserved. Mom branch FROZEN and ignores `showMyRewards` entirely.
5. **Play shell does NOT get a My Rewards nav entry.** PlayShell's existing "Fun" tab routes to `/rewards` → `PlayRewards` page which already surfaces per-kid sticker book + earned prizes (verified via `src/pages/PlayRewards.tsx:1-40`). Adding a separate My Rewards entry would be redundant.
6. **`useShell` import removed** from Sidebar.tsx + BottomNav.tsx. `useEffectiveShell()` is the drop-in replacement. ShellProvider's `useShell()` continues to drive outer shell components (MomShell, AdultShell, etc.); only nav rendering moves to `useEffectiveShell()`.
7. **`useEffectiveMember()` drives the My Rewards toggle**, not `useFamilyMember()`. Mom viewing kid X sees kid X's `show_my_rewards` preference reflected in the sidebar — mom sees the same sidebar the kid would see. Auth user (mom) still drives `useSidebarPersistence` for collapsed/expanded layout state because sidebar layout is mom-owned, not target-owned.
8. **Independent LifeLantern uses `life_lantern_teen` feature key** (not `lifelantern` like the mom/adult surface). The teen-specific key exists in `feature_key_registry` and is the correct reference per founder revision: "`life_lantern_teen` feature key exists exactly for this; the previous filter was contrary to platform design."
9. **Independent Family Feeds added as a stub/coming-soon entry** per PRD-32A demand validation. Renders the `PlannedExpansionCard` until PRD-37 ships. This was NET-NEW for independent (prior config did not include Family Feeds) — explicitly authorized by founder revision instruction.
10. **Convention #16 parity preserved.** Both Sidebar.tsx and BottomNav.tsx flow from `getSidebarSections(shell, { showMyRewards })`. No hand-maintained duplicate exists; BottomNav only filters `BOTTOM_NAV_PATHS` (Home, Tasks, BookShelf, AI Vault — items already pinned to the bottom tab bar).

### Worker 2 Discipline 1 smoke test status

**What was done:**
- `tests/sidebar-sections.test.ts` — 31 unit tests, all PASS. Cover every assertion on the revised `getSidebarSections` pure function: mom FROZEN, adult/independent drops (Studio/Prize Board/RewardRules only) + restored items (Journal/InnerWorkings/LifeLantern/AI Vault/BookShelf/Touch Base/Shopping Mode/Family Feeds), Archives explicitly absent from Adult and Independent, guided unchanged, play empty, My Rewards toggle round-trip (ON / OFF / unset).
- `useShowMyRewards.ts` — read path implemented against `family_members.preferences.show_my_rewards`. Standard supabase select with JSONB field check; column name typo would surface as `null`/`false` (safe default — entry stays invisible).

**What is deferred to founder:**
- Eyes-on of the DB round-trip: founder toggles `preferences.show_my_rewards` in Supabase Studio, observes sidebar entry appear/disappear inside the live app. Runbook above.

**Why deferred:**
- Autonomous worker context does not include browser eyes-on capability. The dispatch language explicitly rules out compilation as evidence ("`tsc -b` passed is NOT sufficient evidence — eyes-on observation of the toggle behavior is the only acceptable proof"). The honest answer is to provide the strongest functional proof a worker CAN provide (28 unit tests over the pure function + structural code review confirming the read path) and hand off the eyes-on portion to the founder at Checkpoint 5. Pretending to have done eyes-on would violate the discipline.

---

## Recommended Worker Decomposition

### Worker 1 — Hooks foundation + ViewAsProvider origin field
**Scope:**
- Create `ViewAsIdentityScope` provider (React context, modal-tree-scoped).
- Create `useEffectiveMember()`, `useEffectiveShell()`, `useEffectiveViewer()` hooks. Public API at `src/lib/permissions/`. Falls back to `useFamilyMember()` outside scope.
- Update `ViewAsProvider`: add `origin: 'mom_viewing' | 'member_session'` to context state. Update `startViewAs(member, viewerId, familyId, origin)` and `switchViewAs(member, origin?)` signatures.
- Migration (gated by Q1 answer): add `view_as_sessions.origin` column with default + check constraint. Backfill 371 existing rows to `'mom_viewing'`.
- Update `ViewAsProvider.startViewAs/switchViewAs` to write `origin` to the audit row.
- Update `ViewAsModal` to wrap rendered children in `ViewAsIdentityScope`.
- **No page sweeps yet.** Existing inline forks keep working in parallel during this worker.

**Files touched:** `ViewAsProvider.tsx`, `ViewAsModal.tsx`, new `ViewAsIdentityScope.tsx`, new `useEffectiveMember.ts`/`useEffectiveShell.ts`/`useEffectiveViewer.ts`, 1 migration.

**Verification:** Existing View As flow keeps working unchanged. `view_as_sessions` writes carry origin. Mounted `ViewAsIdentityScope` exposes the context inside the modal tree.

### Worker 2 — Sidebar truth reconciliation (LOAD-BEARING — primary enforcement)
**Scope:**
- **This is the load-bearing worker for the entire architecture.** Per the founding principle, sidebar invisibility is the primary enforcement layer for mom-only surfaces. Worker 4 `<MomOnlyRoute>` is the backstop, not the primary UX.
- Rewrite `getSidebarSections('adult')` and `getSidebarSections('independent')` against `permission_level_profiles` ground truth + PRD-02 + PRD-31 Balanced/Maximum profiles. Drop Studio, PrizeBoard, RewardRules (Contracts) from non-mom shells entirely. Decide Shopping Mode/Touch Base/Trackers/Family Feeds inclusion per the Balanced profile.
- Add 'My Rewards' sidebar entry to Adult, Independent, and Guided shells, gated by `family_members.preferences.show_my_rewards` (default false). When off, entry is invisible. When on, links to `/my-rewards` (Worker 4 builds stub page).
- Play shell uses `/rewards` route (existing) — Worker 4 confirms whether Play needs a separate My Rewards entry or the existing Fun tab covers it.
- Verify `getSidebarSections('guided')` and `getSidebarSections('play')` against PRD-31 — likely already correct but confirm.
- Sidebar consumes new `useEffectiveShell()` to derive shell in modal context (replace inline `useMemo` at lines 307-317).
- BottomNav consumes same (replace inline at lines 76-86).
- Convention #16 mobile/desktop parity verified at 375px viewport for Adult+Independent shells.

**Files touched:** `Sidebar.tsx`, `BottomNav.tsx`.

**Verification:** Adult/Independent shells inside the modal show only role-appropriate nav. Mom-only items literally do not appear in the kid's sidebar. Mobile More menu mirrors desktop sidebar exactly. Mom's own sidebar (real shell) unchanged. 'My Rewards' entry renders only when per-child toggle is on.

### Worker 3 — Page sweep cluster A (already-aware pages)
**Scope:** Migrate ~14 sites from inline `activeMember` ternary to `useEffectiveMember()`:
- `src/pages/Tasks.tsx`
- `src/pages/Lists.tsx`
- `src/pages/Journal.tsx` (activeMember migration; private-filter refactor is Worker 5)
- `src/pages/ReflectionsPage.tsx`
- `src/pages/RhythmsSettingsPage.tsx`
- `src/pages/ShoppingMode.tsx`
- `src/pages/GuidingStars.tsx`
- `src/pages/BestIntentions.tsx`
- `src/pages/InnerWorkings.tsx`
- `src/components/notepad/NotepadContext.tsx`
- `src/components/guided/WriteDrawer.tsx`
- `src/components/guided/CelebrateSection.tsx`
- `src/components/rhythms/sections/EveningGreetingSection.tsx`
- `src/components/widgets/info/InfoRecentVictories.tsx` (uses `viewingAsMember` only — verify intent)
- `src/pages/Dashboard.tsx`, `GuidedDashboard.tsx`, `PlayDashboard.tsx` — keep `isViewAsOverlay` prop for cosmetic flags, but move `displayMemberId` derivation to `useEffectiveMember()`.

**Files touched:** ~17.

**Verification:** Each page renders correctly both outside modal (real shell, mom's data) and inside modal (modal shell, target's data). No behavior regression.

### Worker 4 — Page sweep cluster B + `<MomOnlyRoute>` BACKSTOP + 'My Rewards' stub + Lists.tsx ListDetailView shell-variant fix
**Scope:**
- **Migrate via `useEffectiveMember()`:** `CalendarPage`, `MeetingsPage`, `VictoryRecorder` (and `GuidedVictories`), `BookShelfPage`, `VaultBrowsePage`, `PersonalPromptLibraryPage`, `ArchivesPage`/`MemberArchiveDetail`.
- **Migrate Messages + RLS spot-check (Q5).** `MessagesPage`, `MessagesSpacePage`, `MessagesThreadPage` migrate to `useEffectiveMember()`. Document empty-results outcome for non-participant spaces in Mom-UI Verification table.
- **Build `<MomOnlyRoute>` guard component as BACKSTOP** (secondary enforcement per founding principle). Wraps `<ProtectedRoute>`. Inside modal scope, redirects when target role is not `primary_parent`. Friendly blocked card per Q3 copy.
- **Apply `<MomOnlyRoute>` to the agreed mom-only route list.** Final list is Deliverable A — pending founder approval. Until founder approves, this worker does NOT dispatch.
- **Build 'My Rewards' stub (Q2a):**
  - Register `/my-rewards` route in `App.tsx`.
  - Register `my_rewards_page` feature key.
  - Build `MyRewardsPage.tsx` rendering `<PlannedExpansionCard featureKey="my_rewards_page" />` with warm copy.
  - Add `show_my_rewards: boolean` (default false) to `family_members.preferences` JSONB. Worker 4 picks cleanest write location (small migration or schema-less default-on-read). Document choice in commit message.
  - Wire sidebar visibility in Worker 2 `getSidebarSections` to consume the toggle.
- The fake-router `renderPage()` in `ViewAsModal.tsx:60-118` continues to mediate which routes can render inside the modal — but routes mom-only-guarded will not reach the page component at all.
- **Lists.tsx ListDetailView shell-variant fix (FOLDED IN per founder direction 2026-05-28, surfaced by Worker 3 Decision #1):** The inner `ListDetailView` component at `src/pages/Lists.tsx:1383+` uses `member.dashboard_mode` (auth user) at approximately line 1842 to pick the rendering variant (`if (member.dashboard_mode === 'guided') return 'guided' as const`). Mom-via-View-As of a guided kid still sees the adult variant. Worker 4 migrates this single shell-variant derivation to use the effective member's `dashboard_mode` via `useEffectiveMember()` so the variant picks correctly for the data subject. All OTHER `useFamilyMember()` consumers in `ListDetailView` (ownership checks, claim/check attribution, save-as-template) are auth-user write-attribution and MUST stay as-is. Only the shell-variant pick at ~1842 changes.

**Files touched:** ~7-10 page files for migrations, `App.tsx` for guard + new `/my-rewards` route, new `<MomOnlyRoute>` component, new `MyRewardsPage.tsx` stub, possible small migration for `show_my_rewards` preference.

**Verification:** Each page renders correctly inside modal for permitted targets. Mom-only routes hit the friendly blocked card when reached by URL with a non-mom target (this is the failure mode — kid should never have a button leading to those routes per Worker 2 primary enforcement). Messages page renders empty for non-participant spaces. 'My Rewards' stub renders. Per-child toggle controls sidebar visibility.

### Worker 5 — Kid-private filter helper + Hub flow + Modal inactivity timeout + 2-min warning banner
**Scope:**
- Build `filterKidPrivate(items, {origin, isKidPrivateFn})` shared utility in `src/lib/permissions/`.
- Refactor `Journal.tsx:39-42` to use the helper.
- Wire helper into **all kid-private surfaces (Q4 final list):**
  - Journal entries with `visibility='private'` (existing logic, refactored to helper)
  - self_knowledge rows where `share_with_mom=false` (`InnerWorkings.tsx`, possibly `MemberArchiveDetail`)
  - `reflection_responses` private flag (Q4 confirmed kid-private)
  - `journal_entries` with `entry_type='lila_conversation'` (Q4 confirmed kid-private)
  - Safe Harbor data (any incidental rendering surfaces — folded into kid-private set this build until decommission lands)
- Refactor `HubMemberAuthModal.tsx`: remove `navigate('/dashboard')` at lines 78 + 119. Pass `origin='member_session'` to both `startViewAs()` calls.
- Refactor `ViewAsMemberPicker.tsx:182`: pass `origin='mom_viewing'` to `startViewAs()`.
- Refactor `ViewAsBanner.tsx`: hide "Manage Tasks" button when `origin === 'member_session'`.
- Build `useViewAsTimeout({default: 15*60_000, warnAt: 2*60_000})` hook scoped to modal lifetime. Subscribe to mouse/key/touch/scroll inside modal.
- **Build `ViewAsTimeoutWarningBanner` component (Q6).** Non-blocking banner that surfaces at 13-min idle (2 minutes before close) saying "View As session will end in 2 minutes. Tap to keep going." with an "I'm still here" button that resets the idle timer. Silent close at 15-min if no interaction. Mount in `ViewAsModal`.

**Files touched:** `Journal.tsx`, `InnerWorkings.tsx` (and other self_knowledge surfaces TBD), `HubMemberAuthModal.tsx`, `ViewAsMemberPicker.tsx`, `ViewAsBanner.tsx`, `ViewAsModal.tsx`, new `filterKidPrivate.ts`, new `useViewAsTimeout.ts`, new `ViewAsTimeoutWarningBanner.tsx`.

**Verification:** Journal in mom_viewing hides kid-private; in member_session shows kid-private. `reflection_responses` private + `lila_conversation` entries hidden from mom-via-View-As. Safe Harbor data does not leak. Hub PIN flow opens modal layered over `/hub`, close returns to `/hub`. Warning banner appears at 13-min, "I'm still here" resets timer. Modal closes silently at 15-min idle. No effect on regular auth sessions.

### Worker 6 — Convention #39 update, `ViewAsShellWrapper.tsx` deletion, Mom-UI verification, audit
**Scope:**
- Replace CLAUDE.md Convention #39 with new architecture text — final wording is **Deliverable B**, pending founder approval. No worker dispatch until founder approves.
- **DELETE `ViewAsShellWrapper.tsx`** (Q9). Remove the import + 16-line passthrough call from `MomShell.tsx`. Verify MomShell renders correctly after removal.
- Execute the Mom-UI Verification table above at desktop/tablet/mobile in every shell mom encounters.
- Audit step: verify PlannedExpansionCard `voted_via_view_as` attribution still fires correctly (PRD-32-32A regression check).
- Audit step: verify Safe Harbor block still fires (`PRIVACY_ROUTE_MAP['/safe-harbor'] === 'safe_harbor'`).
- Audit step: verify `view_as_feature_exclusions` runtime gate at `ViewAsModal.tsx:294` still honors `excludedFeatures`.
- Audit step: confirm Convention #16 mobile/desktop parity at 375px for both Adult and Independent shells.
- Audit step: confirm Safe Harbor data does NOT leak to mom-via-View-As through any incidental rendering surface (after `filterKidPrivate()` fold-in lands in Worker 5).
- Flag for future audit: Convention #40 (Special Adult shifts) cross-checked against invisibility-over-blocking principle. NOT in this build's scope; noted as future work.
- Register `my_rewards_page` feature key in `feature_key_registry` (Worker 4 builds the stub page; Worker 6 confirms registration).
- Update `STUB_REGISTRY.md` with stub list including:
  - "My Rewards page content" — follow-up build with own feature-decision doc
  - "Safe Harbor decommission" — separate scoped follow-up
  - All existing stubs from this build file's stubs section
- Update `WIRING_STATUS.md` with new wiring (modal-origin flows, `<MomOnlyRoute>` backstop, `useEffectiveMember/Shell` hooks, kid-private filter helper, 'My Rewards' stub route).
- Copy Post-Build Verification table to `claude/feature-decisions/View-As-Identity-Scope-Architecture.md`.

**Files touched:** `CLAUDE.md`, `STUB_REGISTRY.md`, `WIRING_STATUS.md`, decision file post-build sign-off section, `MomShell.tsx` (ViewAsShellWrapper removal), `src/features/permissions/ViewAsShellWrapper.tsx` (DELETED).

---

## Deliverable A — Mom-Only Route List (APPROVED 2026-05-28)

**Final count: 16 routes.** These are the routes `<MomOnlyRoute>` guards as the SECONDARY enforcement backstop. PRIMARY enforcement is sidebar invisibility (Worker 2). The guard exists so that a user reaching one of these routes via direct URL, deep link, stale cache, or bookmark sees a friendly blocked card (Q3 copy) instead of a broken mom-only page.

### Approved mom-only routes

| # | Route | Rationale |
|---|---|---|
| 1 | `/studio` | Template authoring surface (mom craft table per PRD-09A/09B Studio Intelligence). No kid surface should expose. |
| 2 | `/prize-board` | Mom allowance audit + IOU management + balance review. Kid-facing equivalent is the new `/my-rewards` stub (Q2a). |
| 3 | `/contracts` | Connector-layer authoring UI. Mom-only per Phase 3 build. |
| 4 | `/permissions` (PermissionHub) | Per-PRD-02 Screen 5, mom-only by design. |
| 5 | `/family-members` (FamilyMembers) | Roster CRUD. Per PRD-01/PRD-02, mom-only. |
| 6 | `/family-setup` (FamilySetup) | One-time onboarding flow. Per PRD-01, mom-only. |
| 7 | `/settings/family-login-name` (FamilyLoginName) | Family-wide auth identity. Per PRD-01, mom-only. |
| 8 | `/settings/allowance/:memberId` (AllowanceSettings) | Per-child allowance configuration. Per PRD-28, mom-only. |
| 9 | `/settings/homework/:memberId` (HomeworkSettings) | Per-child homeschool subject/target setup. Per PRD-28, mom-only. |
| 10 | `/settings/allowance/:memberId/history` | **Mom-only allowance PERIOD audit history.** Mom reviewing closed pay periods + connector pipeline dispatch outcomes. **DISTINCT from** the kid-facing 'View this week' link on shared routines (Workers 2+3) which points to `RoutineWeekEditPage` (routine-completion view, 7-day fallback per Convention #270). Two different surfaces, two different purposes. Worker 4 must not confuse them. |
| 11 | `/settings/gamification/:memberId` (GamificationSettings) | Per-child sticker book / theme / earning mode config. Per PRD-24+PRD-26, mom-only. |
| 12 | `/settings/reward-reveal-library` (RewardRevealLibrary) | Reveal animation pool authoring. Per Phase 3 Connector Layer, mom-only. |
| 13 | `/archives/family-overview` | Family-wide context aggregation. Per PRD-13, mom-only. |
| 14 | `/archives/privacy-filtered` | Privacy Filtered items review. Per PRD-13 + Convention #76, mom-only. |
| 15 | `/archives/export` | Data export controls. Per PRD-22, mom-only. |
| 16 | (16th slot reserved for Worker 4 dispatch-time completeness pass) | If a settings admin route surfaces during Worker 4 inventory that this list missed, Worker 4 fills the slot. If none surface, list ships at 15 routes. Final count confirmed when Worker 4 ships its `<MomOnlyRoute>` wiring. |

### Routes explicitly EXCLUDED from the mom-only list

- **`/feeds`** — DROPPED after founder review (2026-05-28). PRD-32A demand-validation principle requires stubs to appear to everyone they are targeted at to collect demand signal. PRD-31 Balanced Dad has Family Feeds checked. Blocking the stub from teens/dad defeats demand validation AND ships a permission model contradicting PRD-31. `PlannedExpansionCard` continues to render for everyone (mom + adult + independent). When PRD-37 builds for real, route classification gets revisited (likely stays shared with per-content visibility rules inside the feed).
- **`/admin/*`** — NOT added (2026-05-28). `<AdminGate>` is the Anthropic super-admin gate; `<MomOnlyRoute>` would add no real protection and complicate gate logic. Do not double-gate. Founder confirmed this exclusion is intentional so future readers do not relitigate.

### Routes intentionally permitted on non-mom shells

These routes show up in `getSidebarSections` for non-mom shells when the role/profile permits, and `<MomOnlyRoute>` is NOT applied: `/dashboard`, `/tasks`, `/lists`, `/journal`, `/calendar`, `/meetings`, `/messages`, `/notepad`, `/victories`, `/guiding-stars`, `/inner-workings`, `/best-intentions`, `/bookshelf`, `/vault`, `/my-rewards` (new stub), and shell-appropriate settings sub-routes. Worker 2 reconciles inclusion against `permission_level_profiles` ground truth.

---

## Deliverable B — Convention #39 Replacement Wording (APPROVED 2026-05-28)

**Status:** APPROVED verbatim by founder. Worker 6 lands this text in CLAUDE.md. Companion conventions #38 (PIN lockout), #40 (Special Adult shifts), #41 (default permissions auto-create) unchanged.

### Convention #39 — Final text

> **39. View As renders as a modal overlay with identity-scoped data, NOT a full-shell swap.** Mom authentication session stays active in both the mom-initiated flow (mom opens View As from her dashboard) and the hub-initiated flow (kid taps their avatar on the family tablet at `/hub` and authenticates with their PIN). `useFamilyMember()` continues to return the authenticated user (mom) — its 119 callers are untouched. A new `useEffectiveMember()` hook returns the data-subject inside the View As modal scope and falls back to `useFamilyMember()` outside it. The `ViewAsIdentityScope` provider wraps the modal-rendered tree and exposes `{target, origin, realViewerId}`. The new `origin: 'mom_viewing' | 'member_session'` field on `view_as_sessions` distinguishes the two flows for audit and close-behavior differentiation: `mom_viewing` close returns to mom dashboard, `member_session` close returns to `/hub`. Mom-only routes are PRIMARILY enforced by sidebar/nav invisibility (`getSidebarSections` does not include them for non-mom shells) and SECONDARILY by a `<MomOnlyRoute>` route guard that renders a friendly blocked card on direct URL/deep-link reach. The invisibility-over-blocking principle is load-bearing: blocking is the safety net for a failure of invisibility, never the primary UX. Kid-private surfaces (Journal `visibility='private'`, self_knowledge with `share_with_mom=false`, `reflection_responses` private flag, `journal_entries(entry_type='lila_conversation')`, and incidental Safe Harbor surfaces until decommission) are filtered via the shared `filterKidPrivate()` helper which keys on `origin` — items hidden from mom-via-View-As are visible to the kid-via-hub. A modal-only inactivity timeout (`useViewAsTimeout`, 15-minute default with a 2-minute non-blocking warning banner + 'I am still here' extension button) closes the modal silently on idle; this is SEPARATE from `useSessionTimeout` and does not affect mom underlying auth session.

### Migration-point footnote (notes section)

> **Known migration point.** The 'mom auth session stays active in both cases' rule is a pragmatic choice for this build, not a permanent architectural decision. PIN-only family members do not have Supabase `user_id`s today, which is why a true auth swap is not feasible. If/when the platform moves to per-member Supabase auth (every family member gets a `user_id` + JWT), this convention becomes a migration anchor: RLS policies will need to be rewritten to operate against the effective member `auth.uid()`, write-attribution patterns will simplify (no more `useActedBy()` overrides for hub flows), and the 15-min modal-only timer will be replaced by PRD-01 spec role-based session durations. Tag this section when reviewing future PRD-01 amendments.

Worker 6 lands both the convention text AND the footnote at close-out.

---

## Cross-PRD Findings (NOT in this build scope — surfaced for future cleanup)

These findings emerged during the build audit phase and were confirmed by founder. Each is filed for follow-up — none are blockers, none belong to this build.

1. **PRD-14D Screen 5 line 335 wording** — minor cleanup needed (specific wording flagged during research audit). Added to founder PRD-cleanup queue as a one-line edit. NOT in this build scope; documented here so the cleanup does not get forgotten.
2. **STUB_REGISTRY line 35 stale wording** — Worker 6 updates as part of close-out STUB_REGISTRY sweep.
3. **PRD-02 Visibility table line 246 (Adult Shell 'My Permissions' read-only link)** — pre-existing gap, NOT this build problem. Worker 2 does NOT add this entry. The 'My Permissions' surface is PRD-22 Settings scope. If a future audit closes the gap, it lands in a PRD-22 build, not here. Explicitly out of Worker 2 scope so Worker 2 does not accidentally try to add it.
4. **Convention #40 (Special Adult shifts) — invisibility audit follow-up.** Special Adults should also follow invisibility-over-blocking: their sidebars should omit non-shift-relevant surfaces entirely. Surfaced as a follow-up build candidate (STUB_REGISTRY entry). NOT this build scope.

---

## Follow-Up Build Candidates (STUB_REGISTRY entries to land at close-out)

Worker 6 registers these in `STUB_REGISTRY.md` during the close-out file sweep:

- **A. `/my-rewards` page content** — kid Prize Board UI (prizes, allowance balance, money for tasks/accomplishments). Architecture (route + sidebar + per-child toggle + stub page) ships in THIS build via Worker 2 + Worker 4. Real UI is a follow-up build with its own feature-decision doc, own pre-build process, own Mom-UI Verification, own checkpoints.
- **B. Special Adult sidebar audit (Convention #40 follow-up)** — Special Adults should follow invisibility-over-blocking. Their sidebars should omit non-shift-relevant surfaces entirely. Scope: audit `getSidebarSections('special_adult')` against `permission_level_profiles role_group='special_adult'`, reconcile, ship as standalone follow-up build.
- **C. Safe Harbor decommission** — separate scoped follow-up build. Scope captured in this build 'Stubs — Do NOT Build This Phase' section (PRD-20 status change, convention sweep, schema cleanup, edge function cleanup, sidebar/route cleanup). For THIS build: Safe Harbor surfaces remain functional but kid-private via `filterKidPrivate()` fold-in (Worker 5). No removal.
- **D. Generated Supabase TypeScript types adoption** — separate scoped follow-up build. Discovered during View-As Checkpoint 2 (2026-05-28): `src/lib/supabase/client.ts:10` calls `createClient(...)` WITHOUT a generic type parameter, so all `supabase.from(...)` queries are loosely typed. `db:types` script exists in `package.json:21` but `src/types/supabase.ts` is not checked in. Adopting generated types would close the typo-safety gap that motivated the build-wide Disciplines 1 and 2 above. Scope of the future build: regenerate types via `npm run db:types`, add the `Database` generic to `createClient`, fix any type errors that surface across 358-migration / 200+-table codebase. Estimated medium effort with high regression risk — needs its own pre-build audit. For THIS build: Disciplines 1+2 substitute procedurally.
- **E. Per-member sidebar customization** — surfaced during Worker 2 of View-As Identity-Scope build (2026-05-28). Worker 2's `getSidebarSections()` filter reads the STATIC PRD-31 Balanced/Maximum profile in `permission_level_profiles` (164 rows). Mom's per-member overrides in `member_feature_toggles` (24 rows in production) do NOT flow into the sidebar config even though the data model supports them. Result: a feature mom has explicitly enabled for a specific kid via Permission Hub stays absent from that kid's sidebar because the profile baseline says "off." Scope of the future build: rewrite `getSidebarSections()` (or a wrapping hook) to layer `member_feature_toggles` over the profile baseline so per-kid Permission Hub choices propagate to the UI. Foundational dep of Permission Hub being usable. Doc: `claude/follow-up-builds/per-member-sidebar-customization.md`.
- **F. Shopping Mode & Lists visibility scoping** — surfaced during Worker 3 of View-As Identity-Scope build (2026-05-28). Worker 3's correct migration of `ShoppingMode.tsx` to `useEffectiveMember()` exposed that the upstream `useShoppingModeStores` query is family-wide (`list_type='shopping' AND include_in_shopping_mode=true`) regardless of ownership or sharing. Mom's private lists (gift ideas, kid-specific shopping) leak to every teen's Shopping Mode. Founder scope decision (2026-05-28): list-level visibility only (owner + explicit `list_shares` filter); NO item-level filtering (mom + MindSweep classify items onto right lists upstream). Likely a parallel fix needed at `Lists.tsx` for the same leak pattern. Scope locked at `claude/follow-up-builds/shopping-mode-and-lists-visibility-scoping.md`. Estimated 1-2 workers, 1-2 day branch.
- **G. Reflections revamp (privacy + Past tab + render shape)** — surfaced during Worker 5A of View-As Identity-Scope build (2026-05-30). The Q4 decision lock named `reflection_responses` as a kid-private surface; 5A's surface check found the table has NO privacy column. Render surface (`ReflectionsPastTab.tsx`) is parent-visible by design via a "Visible to parent" indicator. Founder decision (2026-05-30): defer reflections privacy filter; revisit at planned Reflections revamp. Scope of the future build: (a) decide whether reflections should support a private-from-parent option; (b) if yes, add the column + RLS + render filter; (c) audit whether the "Visible to parent" indicator should remain default or become opt-in; (d) revisit overall Reflections render shape (Past tab UX, journal-link semantics, integration with Rhythms). Foundational dep for kid expressive autonomy. Estimated 1-2 workers depending on schema scope.

---

## Worker 2 — Sidebar over-prune correction (2026-05-28)

Worker 2's first pass over-pruned the Adult and Independent sidebars by taking the PRD-31 Balanced profile as a strict ceiling rather than a starting baseline. The intent was always more permissive: the founder's vision is that Adult and Independent shells should expose growth and library surfaces by default, with tier limits enforced independently via `feature_access_v2` + `useCanAccess()` and per-kid overrides flowing through `member_feature_toggles` (future follow-up E above).

Worker 2 revision pass scope:

**Adult shell — RESTORE:**
- Journal (Capture & Reflect)
- InnerWorkings (Grow)
- LifeLantern (Grow)
- AI Vault (AI & Tools section restored)
- BookShelf section (Library, Study Guides, Journal Prompts)
- Do NOT restore Archives (Dad does not get Archives by default)

**Independent shell — RESTORE:**
- Touch Base (Plan & Do) — meeting agenda is teen-relevant
- Shopping Mode (Plan & Do) — teens get this; data scope follows via Worker 3 page migration to `useEffectiveMember()`
- InnerWorkings (Grow)
- LifeLantern (Grow) — `life_lantern_teen` feature key exists exactly for this; previous filter was contrary to platform design
- AI Vault (AI & Tools section restored)
- BookShelf section
- Family Feeds (Family section) — stub/coming-soon entry per PRD-32A demand validation
- Do NOT restore Archives (teens do not get Archives by default)

**Adult and Independent — drops that STAY:**
- Studio (mom-only per Q2)
- Prize Board (mom-only per Q2; kid version is `/my-rewards` stub)
- RewardRules / Contracts (mom-only per Q2)

**Cross-cutting:**
- Convention #16 parity preserved — both navs continue to flow from same `getSidebarSections()` with no hand-maintained duplicate
- No tier-gating changes — existing `feature_access_v2` + `useCanAccess()` infrastructure handles AI Vault tier limits independently
- During beta everything is visible; post-beta the existing lock-icon rendering covers tier gating
- Worker 2's vitest suite at `tests/sidebar-sections.test.ts` MUST be updated to assert the corrected presence of restored items; the old tests that codified absence of these items will fail and that is the correct signal

---

## Checkpoint 2 — Worker 2 revision (2026-05-28)

### Self-reported (by Worker 2)
- 5 Adult restores landed: Journal, InnerWorkings, LifeLantern, AI Vault, BookShelf section
- 7 Independent restores landed: Touch Base, Shopping Mode, InnerWorkings, LifeLantern (teen), Family Feeds, AI Vault, BookShelf section
- Drops that stay confirmed: Studio, Prize Board, RewardRules absent from both Adult and Independent
- Archives explicitly NOT restored on either shell — founder direction
- Mom branch unchanged
- Test suite rewritten: 31 tests, all passing (was 28, with assertions inverted for restored items)
- Convention #16 parity preserved — BottomNav still reads from same `getSidebarSections()` source
- `npx tsc -b` exit code 0

### Orchestrator-verified
| Gate | Method | Result |
|---|---|---|
| Adult shell restores landed | Read `Sidebar.tsx:220-273` | ✅ Journal:220, InnerWorkings:245, LifeLantern:247, AI Vault:268, BookShelf section restored via `momBookshelf` reuse at :273 |
| Independent shell restores landed | Read `Sidebar.tsx:284-339` | ✅ Touch Base:293, Shopping Mode:296, InnerWorkings:309, LifeLantern (teen) with `life_lantern_teen` feature key:313, Family Feeds:324, AI Vault:334, BookShelf section :339 |
| `life_lantern_teen` feature key used on Independent | Read `Sidebar.tsx:313` | ✅ `featureKey: 'life_lantern_teen'` — distinct from Adult's `lifelantern` at :247 |
| Studio/Prize Board/RewardRules absent from Adult | Read `Sidebar.tsx:226-234` + comment | ✅ Plan & Do items end at Shopping Mode; explicit comment `// Studio, Prize Board, RewardRules dropped — mom-only per Q2.` |
| Studio/Prize Board/RewardRules absent from Independent | Read `Sidebar.tsx:290-298` + comment | ✅ Same comment, same drops |
| Archives absent from Adult AI & Tools | Read `Sidebar.tsx:264-270` + comment | ✅ Comment `// Archives intentionally NOT included: Dad does not get Archives by default.` |
| Archives absent from Independent AI & Tools | Read `Sidebar.tsx:328-336` + comment | ✅ Comment `// Archives intentionally NOT included: teens do not get Archives by default.` |
| Mom branch unchanged | Read `Sidebar.tsx:208-210` | ✅ `// FROZEN — do not modify without explicit founder approval.` + return tuple unchanged |
| `npx tsc -b` clean (independent re-run) | Background Bash | ✅ Exit code 0 |
| Convention #16 BottomNav parity | (Worker 2 reports BottomNav.tsx:94 unchanged from initial pass) | ✅ Confirmed by Worker 2 |

### Build-Wide Discipline 1 status

Worker 2's `show_my_rewards` read path is covered by 31 unit tests + functional vitest assertions for toggle round-trip across Adult, Independent, and Guided shells. Eyes-on DB toggle test remains deferred to founder at Checkpoint 5 per the documented runbook — this matches the dispatch's allowance for functional-test acceptance when the worker is autonomous. The Mom-UI Verification table runbook in this build file documents the founder eyes-on steps for Checkpoint 5 close-out.

### Architectural decisions Worker 2 made (accepted at Checkpoint 2)

1. **Initial over-prune corrected via founder revision.** First pass treated PRD-31 Balanced as a strict ceiling, dropping Journal/InnerWorkings/LifeLantern/AI Vault/BookShelf from Adult and additional surfaces from Independent. Founder revision (2026-05-28) restored items per the permissive baseline + layered gating model. Recorded in build file's "Worker 2 — Sidebar over-prune correction" section above.
2. **Archives intentionally NOT restored to Adult or Independent.** Mom can grant Archives access via Permission Hub when Follow-Up Build E ships. Until then, Adult and Independent sidebars do not expose Archives at all.
3. **`life_lantern_teen` feature key used for Independent LifeLantern**, distinct from Adult's `lifelantern`. PRD-12A registered this teen-specific key precisely for this surface; previous filter that hid LifeLantern from teens was contrary to platform design.
4. **Family Feeds added to Independent as net-new stub entry.** Renders `PlannedExpansionCard` per PRD-32A demand validation until PRD-37 ships. Previous filter excluded teens from Family Feeds; founder revision restored.
5. **`useShowMyRewards` as a dedicated hook** (not inlined). React Query cached with 30s stale time. Shared by Sidebar and BottomNav.
6. **`getSidebarSections` signature widened to `(shell, options?)`** — pure function; mom branch ignores the option since mom's sidebar always renders its own static set.
7. **PlayShell My Rewards decision: no separate entry.** Existing Fun tab → `/rewards` → PlayRewards covers per-kid prize/sticker surface. Worker 4 still owns the `/my-rewards` route + page stub + toggle UI for Adult/Independent/Guided cases.
8. **`useShell` removed from imports in both `Sidebar.tsx` and `BottomNav.tsx`** — `useEffectiveShell` is the contract per Worker 1.
9. **Convention #16 parity intact** — BottomNav.tsx:94 reads exclusively from `getSidebarSections(shell, { showMyRewards })`. Only the `BOTTOM_NAV_PATHS` filter differs between sidebar and More menu, which is the allowed-by-convention exception.

### Carry-forward notes for Worker 3

- **Shopping Mode is the highest-priority `useEffectiveMember()` target.** See dedicated section below. Without this migration, the restored Independent sidebar entry links to a page that shows mom's data in View-As mode.
- **17 already-View-As-aware pages must migrate** from inline `activeMember` ternary to `useEffectiveMember()`. The canonical list lives in `claude/web-sync/VIEW_AS_AUDIT_2026-05-19.md §6`. Worker 3 dispatch enumerates them explicitly.
- **Worker 2's restored surfaces that are NOT in the inline-ternary §6 list** (Touch Base, Family Feeds, AI Vault, BookShelf) are zero-awareness pages — those are Worker 4 scope (cluster B), NOT Worker 3. Worker 3 only handles the §6 list. Worker 4 handles the zero-awareness pages with their own `useEffectiveMember()` adoption.

### Checkpoint 2 result: **PASSED**. Worker 3 cleared for dispatch.

---

## Checkpoint 2 — Worker 3 (2026-05-28)

### Self-reported (by Worker 3)
- All 17 file migrations landed cleanly (16 hard targets + 1 Q8 decision)
- Q8 decision on `InfoRecentVictories.tsx`: MIGRATE. Rationale: widget renders for the data subject; preserves widget-config-takes-precedence semantic outside View-As via `widget.family_member_id ?? effectiveMember?.id` fallback. In-file comment block documents the decision.
- Decision #5 on `PlayDashboard.tsx` `isAdultViewing`: PRESERVED existing logic. The flag reads auth-user role directly (`ownMember.role IN ('primary_parent', 'additional_adult')`). Today this is a correct shell-context-specific proxy — adults only land on Play shell via View-As — but the brittleness is documented for future review if PlayShell ever gets another entry path.
- `npx tsc -b` exit code 0
- `npm run lint` 0 errors, 84 pre-existing warnings (no new warnings introduced)
- Code returned uncommitted per dispatch convention

### Orchestrator-verified
| Gate | Method | Result |
|---|---|---|
| All 17 target files in `git status` modified list | Bash `git status --short` | ✅ All 17 present; useFamilyMember.ts and Worker 1 hooks absent (frozen contracts intact) |
| `useFamilyMember.ts` unchanged | `git status` | ✅ Not in modified list |
| Worker 1 hooks (`useEffectiveMember.ts`, `useEffectiveShell.ts`, `useEffectiveViewer.ts`) unchanged | `git status` | ✅ Not in modified list |
| `npx tsc -b` clean (independent re-run) | Background Bash | ✅ Exit code 0 |
| Journal privacy filter at `Journal.tsx:39-41` UNTOUCHED | Read `Journal.tsx:33-45` | ✅ Filter preserved verbatim; only the `activeMember` derivation at line 36 was changed to `useEffectiveMember()` |
| Journal migration pattern correct | Read `Journal.tsx:33-45` | ✅ `{ member: activeMember, isViewAs: isViewingAs } = useEffectiveMember()` at line 36; `useJournalEntries(activeMember?.id)` at line 37; auth-user `member` retained for `handleDelete(member.id)` write attribution |
| Shopping Mode migration pattern correct | Read `ShoppingMode.tsx:1-30` | ✅ `useFamilyMember` import removed (Decision #3); `{ member: activeMember } = useEffectiveMember()` at line 18; `memberId = activeMember?.id` threaded to both `useShoppingModeStores` and `useShoppingModeItems` |
| Sidebar.tsx and BottomNav.tsx untouched | `git status` | ✅ Already-modified files (Workers 2 territory) — no new diff from Worker 3 |
| ViewAsProvider.tsx untouched | `git status` | ✅ Already-modified (Worker 1 territory) — no new diff from Worker 3 |

### Discipline 1 evidence assessment

Worker 3 provided Form (C) code-path read evidence for Shopping Mode + 4 representative pages (Tasks, Journal, GuidingStars, Dashboard) and Form (B) founder runbook for the Shopping Mode eyes-on at Checkpoint 5. This matches the dispatch's allowance for code-path evidence when the worker is autonomous and the migration pattern is the same across files. Founder eyes-on at Checkpoint 5 remains the close-out gate.

### Worker 3 surfaced two latent issues — orchestrator triage

1. **Lists.tsx ListDetailView shell-variant gap (`Lists.tsx:1842`).** The inner `ListDetailView` component uses `member.dashboard_mode === 'guided'` (auth user, not effective member) to pick the rendering variant. Mom-via-View-As of a guided kid would still see the adult variant. This IS a real View-As gap but was outside Worker 3's scope (the dispatch narrowed Lists.tsx to the top-level page derivation at `:163`). **FOLDED INTO WORKER 4 SCOPE per founder direction 2026-05-28.** Worker 4 dispatch adds it explicitly.

2. **Shopping Mode list-visibility leak.** The migration correctly threads the data subject; the bug is that `useShoppingModeStores` queries family-wide shopping lists regardless of ownership/sharing, leaking mom's private lists to teens. **NOT this build's scope** — filed as Follow-Up Build F (see Follow-Up Build Candidates section below). The full scope doc lives at `claude/follow-up-builds/shopping-mode-and-lists-visibility-scoping.md` with founder vision quoted verbatim and scope locked to list-level visibility only (no item-level filtering).

### Architectural decisions Worker 3 made (not pre-specified, accepted at Checkpoint 2)

1. **Destructure rename pattern** — consistently destructured `{ member: activeMember, isViewAs: isViewingAs }` (and `effectiveMember`/`displayMember` variants) to preserve existing local variable names downstream. Zero ripple cost beyond the single derivation line.
2. **Removed `useFamilyMember` imports from 6 files** where `member` (auth) was only used as the redundant fallback in the `activeMember` ternary (ReflectionsPage, ShoppingMode, NotepadContext, WriteDrawer, CelebrateSection, EveningGreetingSection, InfoRecentVictories). Keeps residual audit clean and avoids tsc `noUnusedLocals` failure.
3. **Kept `useViewAs` import in Dashboard.tsx ONLY for the `startViewAs` dispatcher** (not state). `useEffectiveMember()` is read-side scope; dispatchers stay on `useViewAs()`. Cleanest pattern.
4. **Q8 InfoRecentVictories — MIGRATE.** Documented in-file. The widget is data-subject-scoped; the fallback chain `widget.family_member_id ?? effectiveMember?.id` preserves mom's pinned-widget semantic outside View-As.
5. **Decision #5 PlayDashboard `isAdultViewing` — PRESERVE.** Today's logic is correct because the only path to PlayShell as an adult is through View-As. Future shell-entry paths would break this proxy but are not in scope.

### Residual auth-user `useFamilyMember()` audit (Worker 3 self-reported, orchestrator spot-checked)

Worker 3 produced a per-file table of every retained `useFamilyMember()` call site with classification. All retained calls fall into one of three categories: write-attribution (created_by, callerId), role-gating (`role === 'primary_parent'`), or dual-instance layout-state branches (Dashboard underlying-vs-overlay). Zero residual data-subject calls. The 119-caller auth-user contract remains protected per Worker 1's foundation.

### Checkpoint 2 result: **PASSED**. Worker 4 cleared for dispatch.

---

## Checkpoint 2 — Worker 4 (2026-05-28)

### Self-reported (by Worker 4)

5 deliverables checklist:
- **D1 — Page sweep cluster B:** 9 data-subject migrations landed (Calendar, MeetingsPage page-level, Messages ×3, Vault ×2, Victories ×2). 3 documented no-ops (BookShelfPage, ArchivesPage, MemberArchiveDetail — see findings). 4 mom-only pages hard-blocked via App.tsx wrapper, internals untouched (Studio, PrizeBoard, ContractsPage, FamilyOverviewDetail).
- **D2 — `<MomOnlyRoute>` backstop:** built at `src/lib/permissions/MomOnlyRoute.tsx`, exported from the `@/lib/permissions` barrel. 16 routes guarded in `App.tsx` (16th slot filled).
- **D3 — My Rewards stub:** `/my-rewards` route registered (kid-facing `<ProtectedRoute>`, NOT mom-only). `MyRewardsPage.tsx` renders `<PlannedExpansionCard featureKey="my_rewards_page" />`. Feature key registered via migration `00000000100248` (Option B for the preference — see decisions). Wired into the ViewAsModal harness so the hub/member_session flow can reach it.
- **D4 — Lists.tsx ListDetailView shell-variant fix:** `getMemberType()` now reads `useEffectiveMember()`; all other `useFamilyMember()` write-attribution in `ListDetailView` preserved. Only ONE shell-variant pick existed in the file — no additional ones to surface.
- **D5 — Mom-UI Verification:** 9 Worker-4-owned rows populated with functional evidence + ⏸ founder eyes-on (autonomous worker; eyes-on runbook below). Discipline 1 smoke-test evidence documented as code-path traces + founder runbook.

Verification commands:
- `npx tsc -b` → **exit 0** (clean).
- `npm run lint` → **0 errors**, 84 warnings (all pre-existing — identical to Worker 3's baseline; `MeetingsPage.tsx:786 'candidate' prefer-const` is pre-existing, far from my line-382 edit).
- `npm run build` → **exit 0** (vite bundled cleanly — proves module graph resolves: `MomOnlyRoute → ProtectedRoute`, barrel export, ViewAsModal changes, new pages. The tail color-check report flags pre-existing hardcoded colors in Lists/Studio/Tasks/SettingsPage — none in my new files; MomOnlyRoute + MyRewardsPage use only `var(--color-*)` tokens).

FROZEN files: none touched. Confirmed via `git status` — `useFamilyMember.ts`, `useEffectiveMember/Shell/Viewer.ts`, `useShowMyRewards.ts`, `ViewAsProvider.tsx`, `Sidebar.tsx`, `BottomNav.tsx`, Worker-5 files (Hub/Picker/Banner), Journal.tsx, ViewAsShellWrapper/MomShell, CLAUDE.md/STUB_REGISTRY/WIRING_STATUS all absent from my diff. (They appear in the working tree because Workers 1/2/3 returned uncommitted code that accumulates in sequence — not my changes.)

### Deliverable-by-deliverable evidence

**9 page migrations (`useFamilyMember()` → `useEffectiveMember()` page-level data subject):**

| File:line | Swap | Rationale |
|---|---|---|
| `CalendarPage.tsx:117` | `const { member } = useEffectiveMember()` | Data subject — `usePendingCounts(member.id)`, "me" filter (`member.id`, line 193), and primary_parent-only affordance (`member.role`, line 433) scope to viewed member. All write paths (1042/1045 `member.id`) follow data subject under acting-as semantics. |
| `MeetingsPage.tsx:382` | `const { member } = useEffectiveMember()` | Page-level identity. Meetings data is family-scoped; the page `member` drives `memberId` passed to sub-components + wizard. Sub-components KEPT `useFamilyMember()` for actor/facilitator/personal-impression attribution (#232). |
| `MessagesPage.tsx:133` | `const { member: currentMember } = useEffectiveMember()` | Q5. Data subject. RLS unchanged → #141 boundary preserved (mom's `auth.uid()` still filters non-participant spaces to empty). |
| `MessagesSpacePage.tsx:18` | `const { member: currentMember } = useEffectiveMember()` | Q5. `currentMember` finds "the other" member in direct spaces. |
| `MessagesThreadPage.tsx:21` | `const { member: currentMember } = useEffectiveMember()` | Q5. `currentMember` drives coaching settings + LiLa button + "other" member. |
| `VaultBrowsePage.tsx:19` | `const { member } = useEffectiveMember()` | Data subject — `useVaultBrowse(member.id)` (whose progress/continue items). |
| `PersonalPromptLibraryPage.tsx:8` | `const { member } = useEffectiveMember()` | Data subject — `useSavedPrompts(member.id)`. |
| `VictoryRecorder.tsx:41` | `const { member } = useEffectiveMember()` | Data subject — victory queries + recording (`family_member_id`) attribute to viewed member (acting-as). |
| `GuidedVictories.tsx:16` | `const { member } = useEffectiveMember()` | Same — guided shell victories scope to viewed kid. |

Unused `useFamilyMember` imports removed from the 6 files where `member`/`currentMember` was the only usage (Vault ×2, Victories ×2, MessagesSpacePage); `useFamilyMembers` (plural roster) import preserved where still used (CalendarPage, MeetingsPage, MessagesPage, MessagesThreadPage).

**4 hard-blocked pages (App.tsx wrapper only, internals untouched):** `/studio` (Studio.tsx), `/prize-board` (PrizeBoard.tsx), `/contracts` (ContractsPage.tsx), `/archives/family-overview` (FamilyOverviewDetail.tsx) — each `<ProtectedRoute>` → `<MomOnlyRoute>` in App.tsx. Page internals (which use `useFamilyMember()`) untouched — correct, since they never render for non-mom data subjects.

**`<MomOnlyRoute>`:** `src/lib/permissions/MomOnlyRoute.tsx`. Blocked card render at the `MomOnlyBlockedCard` component (lines ~46–101). Both copy variants present: `mom_viewing` → "This is a mom-only area. Tap Exit View As to access it." + "Exit View As" button (`stopViewAs()`); `member_session` → "Ask mom to help with this — it's a parent-only area." + "Go back" button (`navigate(-1)`, no exit affordance per dispatch). Lucide `Lock` icon (NOT emoji — fixes the `PrivacyBlockedPage` 🔒 emoji-rule violation in the new component). Theme tokens only. Composition: when blocked, returns the standalone card INSTEAD of `<ProtectedRoute>` so RoleRouter+ViewAsModal do NOT mount → the card is actually visible (not hidden behind the modal); when allowed, returns `<ProtectedRoute>{children}</ProtectedRoute>` unchanged.

**16 routes guarded (App.tsx):** family-setup, family-login-name, family-members, permissions, studio, archives/family-overview, archives/privacy-filtered, archives/export, settings/allowance (16th slot), settings/allowance/:memberId, settings/allowance/:memberId/history, settings/homework, settings/gamification, settings/reward-reveals, prize-board, contracts. **Route-name reconciliation vs Deliverable A** (Deliverable A used aspirational paths; I guarded the ACTUAL App.tsx routes): `/settings/family-login-name` → actual `/family-login-name`; `/settings/homework/:memberId` → actual `/settings/homework`; `/settings/gamification/:memberId` → actual `/settings/gamification`; `/settings/reward-reveal-library` → actual `/settings/reward-reveals`. 16th slot = `/settings/allowance` (the AllowanceSettingsPage index list — clearest mom-only management miss in the same family as the per-member allowance routes).

**My Rewards:** route `App.tsx` `/my-rewards` → `<ProtectedRoute><MyRewardsPage /></ProtectedRoute>` (added next to `/rewards`). `MyRewardsPage.tsx` → `<PlannedExpansionCard featureKey="my_rewards_page" />`. Feature key registered in `supabase/migrations/00000000100248_my_rewards_feature_key.sql` (idempotent `INSERT ... ON CONFLICT DO NOTHING`). **Option B (schema-less default-on-read)** for the `show_my_rewards` preference — NO column migration needed: `family_members.preferences` JSONB already exists; `useShowMyRewards` reads `preferences.show_my_rewards === true` and defaults `false` when absent. A migration to set the key `false` on every row would be pointless churn (read already defaults false) — Option B is the complete, correct choice, not an MVP shortcut (Convention #13). Also wired My Rewards into the ViewAsModal harness (renderPage case + `getSidebarSections(targetShell, { showMyRewards })` via `useShowMyRewards(viewingAsMember?.id)`) so the member_session/hub flow — which runs inside the modal — can actually reach the surface.

**Lists.tsx fix:** `ListDetailView` (line 1383). Added `const { member: effectiveMember } = useEffectiveMember()` (line ~1388; `useEffectiveMember` was already imported by Worker 3 at line 25). `getMemberType()` (was lines 1841–1847) now reads `effectiveMember.dashboard_mode`. PRESERVED `useFamilyMember()` `member` for all write-attribution: `memberId: member.id` (1836), `family_member_id: member.id` (1886, 1902), `createdBy: member.id` (2370, 2737), `owner_id`/`createdBy` in the top-level page. Only ONE shell-variant pick existed (verified via grep `dashboard_mode` → only the `getMemberType` block) — no additional shell-variant picks to surface.

### Discipline 1 smoke-test evidence

Autonomous worker, no browser eyes-on and no production migration apply (deferred to the coordinated apply step — applying a migration to prod is outward-facing and not done without founder confirmation). Per the accepted Worker 2/3 precedent, evidence is code-path traces + a founder runbook. `tsc -b` + `npm run build` (full vite bundle, exit 0) substantiate the module graph and types.

1. **Messages-via-View-As (Q5 / #141, HIGH PRIORITY).** Code path: `MessagesPage`/`SpacePage`/`ThreadPage` now read `currentMember` from `useEffectiveMember()` (= teen inside View-As). The message/space/thread queries filter by that member id; Supabase RLS independently evaluates the auth user's `auth.uid()` (= mom, unchanged — no auth swap). For spaces where mom is NOT a participant, RLS returns zero rows regardless of the page filter → the thread list resolves empty. #141 boundary is enforced by RLS, untouched by this migration. **Founder runbook below — observe the empty result.**
2. **`<MomOnlyRoute>` blocked card.** Code path: typing `/studio` (or any of the 16) while a View-As session is active → real router renders `<MomOnlyRoute>` → `useEffectiveMember()` returns `{ isViewAs: true, member: teen, origin }` → `member.role !== 'primary_parent'` → returns `MomOnlyBlockedCard` (standalone, no shell/modal) with the `mom_viewing` copy + Exit button. Clicking Exit → `stopViewAs()` → `isViewAs` false → guard passes through to `<ProtectedRoute><StudioPage/></ProtectedRoute>` (mom sees Studio). **Founder runbook below.**
3. **My Rewards toggle + sidebar.** Code path: `useShowMyRewards(memberId)` reads `preferences.show_my_rewards`. Worker 2's `getSidebarSections(shell, { showMyRewards })` includes the entry only when true. Setting `preferences = {"show_my_rewards": true}` in Supabase Studio → entry appears (real shells via Sidebar.tsx, AND inside the View-As modal via my `allowedPaths` + harness wiring); `/my-rewards` renders the stub; toggling false → entry disappears. **Founder runbook below.** (Requires migration 100248 applied so the feature key exists for `PlannedExpansionCard`.)
4. **Lists.tsx ListDetailView variant.** Code path: `getMemberType()` reads `effectiveMember.dashboard_mode`. Mom-View-As of a guided kid → `effectiveMember` = guided kid → `'guided'` variant. Same kid via hub PIN (member_session) → `effectiveMember` also = that kid → same `'guided'` variant. Both paths converge on `useEffectiveMember()` so they match by construction. **Founder runbook below.**

### Worker 4 founder eyes-on runbook (Checkpoint 5)

Prereq: apply migration `00000000100248` (`supabase db push --linked`) so `my_rewards_page` exists in `feature_key_registry`. Dev server up (`npm run dev`). Pick a test teen (independent) and a test guided kid.

- **Messages #141 (smoke #1):** Sign in as mom → ViewAsMemberPicker → select the teen → open `/messages` in the modal. Confirm the thread/space list shows ONLY spaces mom is also a participant in (teen-to-sibling spaces mom isn't in resolve empty). Note the observed space count. Repeat for a teen who has a space mom is NOT in → that space must NOT appear.
- **Blocked card (smoke #2):** While in View-As of the teen, type `/studio` in the URL bar → confirm the friendly "Parent-only area" card renders with "This is a mom-only area. Tap Exit View As to access it." + an "Exit View As" button (NOT the Studio page, NOT the modal). Tap "Exit View As" → confirm Studio then renders (mom is herself again). Repeat the URL test for `/prize-board`, `/contracts`, `/permissions`, `/family-setup`.
- **My Rewards (smoke #3):** In Supabase Studio set the teen's `family_members.preferences = {"show_my_rewards": true}`. ViewAs the teen → confirm "My Rewards" appears in the sidebar (Plan & Do) AND the BottomNav More menu at 375px → tap it → confirm the My Rewards stub card. Set the preference back to `{}`/false → refresh → confirm the entry disappears.
- **Lists variant (smoke #4):** ViewAs the guided kid → `/lists` → open a list → confirm the guided list variant renders (not adult). For comparison, open the same list as that kid via hub PIN → confirm the same variant.
- **Calendar/Meetings/Victories scoping:** ViewAs teen → `/calendar`, `/meetings`, `/victories` → confirm each shows the teen's data/identity, and that primary_parent-only calendar affordances (approve/settings) are hidden.

Mark each row ✅ at all three viewports when confirmed.

### Architectural decisions Worker 4 made (not pre-specified, accepted at Checkpoint 2)

1. **`<MomOnlyRoute>` placed in `src/lib/permissions/`** (not `src/components/permissions/`) to sit alongside `PermissionGate` + `ViewAsProvider` (the existing permission-gating home) and exported from the `@/lib/permissions` barrel. It composes `ProtectedRoute` (from `src/components/`) — no circular import (verified: `npm run build` bundles clean).
2. **My Rewards preference = Option B (schema-less default-on-read).** No column migration; `preferences` JSONB exists, `useShowMyRewards` defaults false. Documented rationale above (not an MVP shortcut — the read defaults safely and a churn migration would add nothing).
3. **Feature-key registration via migration `00000000100248`** (matching the `feature_key_registry` INSERT pattern of migration 100233). Number deliberately skips `100247`, reserved by the pending (pre-build) Member-Day build, to avoid collision. Migration NOT auto-applied (outward-facing; deferred to coordinated apply step — documented in runbook prereq).
4. **`MomOnlyRoute` blocks only inside an active View-As session** (`isViewAs && role !== primary_parent`). Outside View-As it passes straight through to `<ProtectedRoute>` — dad/other authenticated users are NOT blocked here (their access is governed by ProtectedRoute + sidebar invisibility + future per-member toggles), exactly per the dispatch.
5. **Blocked card uses Lucide `Lock`, not the 🔒 emoji** the legacy `PrivacyBlockedPage` uses — complies with the no-emoji rule for the new component.
6. **ViewAsModal harness wiring for My Rewards** (renderPage case + `getSidebarSections(..., { showMyRewards })` via `useShowMyRewards(viewingAsMember?.id)`). Necessary because the member_session/hub flow renders inside the modal; without it, `/my-rewards` would be absent from `allowedPaths` and redirect to dashboard. Touches ViewAsModal but in regions disjoint from Worker 5's timeout-banner mount.
7. **16th mom-only slot = `/settings/allowance`** (AllowanceSettingsPage index). Route-name reconciliation against actual App.tsx paths documented above.

### Surprises / scope ambiguities

- **Meetings inventory:** 8 files in `src/components/meetings/*`. Only the PAGE (`MeetingsPage.tsx`) was migrated. 4 sub-components (`MeetingConversationView`, `PostMeetingReview`, `ScheduleEditorModal`, `CustomTemplateCreatorModal`) keep `useFamilyMember()` — they're actor/facilitator/personal-impression attribution (#232 impressions are PERSONAL to whoever ends the meeting → must be the real human), not data-subject scoping. `StartMeetingModal`/`MeetingHistoryView`/`MeetingPickerOverlay` use only the plural roster or the `FamilyMember` type — nothing to migrate.
- **BookShelfPage — NO migration needed (audit was stale).** The page (`BookShelfPage.tsx`) has zero member-identity usage; it delegates entirely to `BookShelfLibrary`/`ExtractionBrowser`/`StudyGuideLibrary`, which the prior BookShelf Fix Session already made View-As-aware (`effectiveMember.id` via `useViewAs()`, per WIRING_STATUS). Documented as a no-op.
- **ArchivesPage — NO migration needed.** Its only `currentMember` usage (line 405) is write-attribution: passed as `momMemberId={currentMember.id}` (line 908). Migrating to effective member would pass the teen's id as `momMemberId` — a bug. The page's actual data is family-scoped (`familyId` + member-id arrays). Left as `useFamilyMember()`. Documented as a finding — the audit flagged it, but the actual usage is auth-user write-attribution, so the governing principle ("migrate data subject, preserve write-attribution") says leave it.
- **MemberArchiveDetail — NO migration needed.** Derives the viewed member from the URL param (`useParams().memberId`), not from auth. No singular `useFamilyMember()` in the file. It renders whatever member the route names — already correct under View-As. Documented as a finding.
- **16th route slot:** filled (`/settings/allowance`). List ships at 16, not 15.
- **Lists.tsx additional shell-variant picks:** none. Only `getMemberType()` existed.

### Carry-forward notes for Worker 5

- **`<MomOnlyRoute>` Exit button calls `stopViewAs()`.** Worker 5 refactors `ViewAsMemberPicker`/`HubMemberAuthModal`/`ViewAsBanner` and the modal close flow. The blocked-card "Exit View As" relies only on the public `useViewAs().stopViewAs` — it does not depend on any picker/banner internals, so Worker 5's changes won't break it. If Worker 5 changes `stopViewAs` semantics, re-verify the blocked card's Exit still returns the user to the (now-unblocked) route.
- **My Rewards stub does not touch the hub flow.** No surface-area overlap with Worker 5's `HubMemberAuthModal` refactor. The ViewAsModal harness wiring I added (renderPage `/my-rewards` case + `showMyRewards` in `allowedPaths`) is in the path-mapping/allowed-paths regions, disjoint from where Worker 5 mounts `ViewAsTimeoutWarningBanner`. No expected conflict.
- **`useEffectiveViewer().realHumanIsTarget === false` outside View-As** (Worker 1 carry-forward) — `MomOnlyRoute` does NOT use `useEffectiveViewer`; it reads `origin` directly from `useEffectiveMember()`. No dependency on the null-handling semantics Worker 5's `filterKidPrivate()` cares about.

### Explicit handoff

**Worker 4 complete. Checkpoint 2 gates: PASSED** (`tsc -b` exit 0; `npm run lint` 0 errors / 84 pre-existing warnings; `npm run build` exit 0; 9 migrations + 3 documented no-ops + 4 hard-blocks; `<MomOnlyRoute>` built + 16 routes guarded; `/my-rewards` route + stub + feature-key migration 100248; Lists.tsx ListDetailView fix; no FROZEN files touched; 9 Mom-UI rows populated with functional evidence + ⏸ founder eyes-on runbook). **Returning control to orchestrator. Worker 5 NOT dispatched.**

### Orchestrator close-out — three founder asks resolved (2026-05-28)

Founder review surfaced three asks before Worker 5 dispatch. All resolved.

**Ask 1 — Migration 100248 NOW APPLIED.** Founder direction: deferral creates verification gap. Orchestrator applied via `supabase db push --linked` 2026-05-28. `npm run schema:dump` confirmed `feature_key_registry` count moved from 207 → 208 rows. `my_rewards_page` is registered in production. PlannedExpansionCard for the My Rewards stub can now lookup its registry metadata. Checkpoint 5 eyes-on for `/my-rewards` no longer gated on a pending migration.

**Ask 2 — BookShelfPage no-op claim SPOT-CHECK PASSED.** Orchestrator verified:
- `src/pages/BookShelfPage.tsx` is a pure layout wrapper (read in full). Zero `useFamilyMember()`, `useEffectiveMember()`, or `useViewAs()` imports. URL params + `<PermissionGate>` only. Routes between `BookShelfLibrary`, `ExtractionBrowser`, `StudyGuideLibrary`.
- Child components do use `useFamilyMember()`: `StudyGuideLibrary.tsx:30` and `ExtractionBrowser.tsx:56`. BUT the `member.id` usages are write-attribution (`member_id` in INSERT/UPDATE payloads at ExtractionBrowser.tsx:364, 442, 489 — recording who annotated) and localStorage scope keys (`bookshelf-${member.id}-`). The `member.family_id` usages are family-wide `.eq()` filters (line 147) — the bookshelf is architecturally family-wide per PRD-23, so mom-via-View-As-of-kid correctly sees the same library.
- **Conclusion:** No data-subject query exists at this surface. Worker 4's no-op claim is correct. Same logic applies to ArchivesPage (`currentMember` is `momMemberId` write-attribution) and MemberArchiveDetail (URL param-driven). All three no-ops justified.

**Ask 3 — 4 route reconciliations CONFIRMED LEGITIMATE.** Orchestrator read `src/App.tsx:125-188` and mapped Worker 4's `<MomOnlyRoute>` applications against Deliverable A's 16 approved paths.

| # | Deliverable A approved path | Actual App.tsx route | Reconciliation |
|---|---|---|---|
| 1 | `/studio` | `/studio` (line 147) | ✅ EXACT |
| 2 | `/prize-board` | `/prize-board` (line 186) | ✅ EXACT |
| 3 | `/contracts` | `/contracts` (line 187) | ✅ EXACT |
| 4 | `/permissions` | `/permissions` (line 135) | ✅ EXACT |
| 5 | `/family-members` | `/family-members` (line 134) | ✅ EXACT |
| 6 | `/family-setup` | `/family-setup` (line 132) | ✅ EXACT |
| 7 | `/settings/family-login-name` | **`/family-login-name`** (line 133) | **RECONCILED** — App.tsx route never had the `/settings/` prefix. Worker 4 guarded the actual route. |
| 8 | `/settings/allowance/:memberId` | `/settings/allowance/:memberId` (line 172) | ✅ EXACT |
| 9 | `/settings/homework/:memberId` | **`/settings/homework`** (line 175) | **RECONCILED** — App.tsx has a single HomeworkSettingsPage route without `:memberId` param (page handles per-child internally). Worker 4 guarded the actual route. |
| 10 | `/settings/allowance/:memberId/history` | `/settings/allowance/:memberId/history` (line 173) | ✅ EXACT |
| 11 | `/settings/gamification/:memberId` | **`/settings/gamification`** (line 177) | **RECONCILED** — Same pattern: single GamificationSettingsPage without `:memberId` param. Worker 4 guarded the actual route. |
| 12 | `/settings/reward-reveal-library` | **`/settings/reward-reveals`** (line 179) | **RECONCILED** — Naming variant. Same component (RewardRevealLibrary), shorter URL slug. Worker 4 guarded the actual route. |
| 13 | `/archives/family-overview` | `/archives/family-overview` (line 155) | ✅ EXACT |
| 14 | `/archives/privacy-filtered` | `/archives/privacy-filtered` (line 156) | ✅ EXACT |
| 15 | `/archives/export` | `/archives/export` (line 157) | ✅ EXACT |
| 16 | (Reserved 16th slot) | **`/settings/allowance`** (line 171, the AllowanceSettingsPage index) | **FILLED** — clearest mom-only management route in the same family as the per-member allowance routes. |

**Verdict on reconciliations:** all 4 are legitimate aspiration-vs-actual route mappings. Worker 4 did not over-map or under-map. Each reconciled route guards the implemented surface for the intent of the approved path. None of these were oversights. None of these created blocks where founder didn't want one. None of these missed routes founder intended to block.

**Sibling spot-checks confirmed correct:**
- `/archives/member/:memberId` (line 154) is `<ProtectedRoute>` — kid-accessible per-member archive view, correct (mom-only archives sub-routes are family-overview/privacy-filtered/export only).
- `/finances/history` (line 188) is `<ProtectedRoute>` — kid-visible transaction history per PRD-28 `child_can_see_finances`, correct.
- `/my-rewards` (line 184) is `<ProtectedRoute>`, NOT `<MomOnlyRoute>` — kid-facing stub per Q2a, correct.

### Orchestrator-verified (additional gates beyond Worker 4 self-report)

| Gate | Method | Result |
|---|---|---|
| Migration 100248 file is idempotent | Read | ✅ `INSERT ... ON CONFLICT (feature_key) DO NOTHING`. Safe to re-run. |
| Migration 100248 applied to production | `supabase db push --linked` + `npm run schema:dump` | ✅ `feature_key_registry` 207 → 208 rows |
| `MomOnlyRoute` correctly composes `<ProtectedRoute>` | Read App.tsx:128-132 | ✅ Comment block cites Convention #39 + "SECONDARY backstop"; wrapper pattern matches `<MomOnlyRoute><Page /></MomOnlyRoute>` |
| All 9 migrated pages in `git status` modified list | Bash `git status` | ✅ CalendarPage, MeetingsPage, MessagesPage/SpacePage/ThreadPage, VaultBrowsePage, PersonalPromptLibraryPage, VictoryRecorder, GuidedVictories — all present |
| New files created: MomOnlyRoute.tsx, MyRewardsPage.tsx, migration 100248 | Bash `git status` | ✅ All present as `??` untracked |
| FROZEN files untouched | Bash `git status` | ✅ useFamilyMember.ts NOT in list; useEffectiveMember/Shell/Viewer.ts NOT in list (they're already-tracked-untracked from Worker 1) |
| BookShelfPage NOT in modified list | Bash `git status` | ✅ Confirms no-op claim |
| ArchivesPage NOT in modified list | Bash `git status` | ✅ Confirms no-op claim |
| MemberArchiveDetail NOT in modified list | Bash `git status` | ✅ Confirms no-op claim |
| App.tsx has 16 `<MomOnlyRoute>` wrappers | Grep | ✅ 16 hits at lines 132-187 |
| `/my-rewards` route uses `<ProtectedRoute>` not `<MomOnlyRoute>` | Read App.tsx:184 | ✅ Correct per Q2a (kid-facing) |

### Checkpoint 2 result: **PASSED**. Worker 5 cleared for dispatch.

---

## Worker 5 was split — sub-sessions 5A through 5E (2026-05-30)

Original Worker 5 wedged on turn 1 against a known intermittent Claude Code harness bug (parallel-Read fan-out + Bash in one turn corrupts the thinking-block signature). Worker 5 was sequenced into 5 sub-sessions covering the original 6 deliverables, each a fresh window, each committing before handoff with selective staging. Scope unchanged.

### Sub-session ledger (6 deliverables across 5 sub-sessions)

| Sub | Deliverables | Owned paths | Status |
|---|---|---|---|
| 5A | D1 — kid-private filter helper + 3 page applications + Safe Harbor inventory | `src/lib/permissions/filterKidPrivate.ts`, `src/lib/permissions/index.ts`, `src/pages/Journal.tsx`, `src/pages/InnerWorkings.tsx`, `src/pages/ReflectionsPage.tsx` | ✅ COMPLETE (commit `b740b11`, 2026-05-30) |
| 5B | D2 hub refactor + D3 picker explicit pass + D4 banner origin-aware UI | `src/components/hub/HubMemberAuthModal.tsx`, `src/features/permissions/ViewAsMemberPicker.tsx`, `src/features/permissions/ViewAsBanner.tsx` | ✅ COMPLETE (commit `d057a6d`, 2026-05-30) |
| 5C | D5 timeout hook + warning banner verification + ViewAsModal mount | `src/hooks/useViewAsTimeout.ts`, `src/features/permissions/ViewAsTimeoutWarningBanner.tsx`, `src/features/permissions/ViewAsModal.tsx` | ✅ COMPLETE (commit `6a770cd`, 2026-05-30) |
| 5D | D6 Playwright tests + new helpers | `tests/e2e/helpers/auth.ts`, NEW `tests/e2e/features/view-as-hub-member-session.spec.ts`, NEW `tests/e2e/features/view-as-picker-mom-viewing.spec.ts` | ✅ COMPLETE (commit `627362a`, 2026-05-30) — both smoke tests PASS 3×; **surfaced build-gating finding: cross-shell modal auto-close — see CP2 below** |
| 5E | Close-out — Mom-UI Verification rows + Checkpoint 2 self-report aggregation + carry-forward to Worker 6 | `.claude/rules/current-builds/view-as-identity-scope-architecture.md` | pending |

### Gate ledger — 13 gates total (post-revision)

Page applications occupy two gate slots: #7 (Journal) and #8 (InnerWorkings + ReflectionsPage). Coverage of all three pages is preserved; total stays 13.

Lint (gate #3) closes per-slice in each code-touching sub-session (5A/5B/5C/5D), scoped to that sub-session's edited paths. 5E owns the final aggregate full-project lint as confirmation, not first discovery. This prevents 5E from discovering lint failures spanning already-committed slices.

### Checkpoint 2 — Worker 5A (2026-05-30)

**Self-reported (by Worker 5A):**
- Commit `b740b11`, exactly 5 files staged (+93/-16). Selective staging verified via `git diff --cached --stat`.
- `filterKidPrivate.ts` contract VERIFIED (not recreated). Null-handling trace: single branch `if (origin !== 'mom_viewing') return items` — `origin === null` and `origin === 'member_session'` both short-circuit to the full unfiltered array. No default-deny path exists. `useEffectiveMember()` and `useEffectiveViewer()` both return `origin: null` outside View-As scope. Contract correct as-is.
- Journal: helper applied at lines 39-41 with expanded predicate `visibility === 'private' || entry_type === 'lila_conversation'` per Q4.
- InnerWorkings: helper applied for `share_with_mom === false`.
- ReflectionsPage: **NO filter applied** — see Founder Decision below.
- `npx tsc -b` exit 0. ESLint on the 5 files: 0 errors, 1 pre-existing `exhaustive-deps` warning at `Journal.tsx:69` unrelated to the filter (warning-not-error per project conventions). 5A slice lint-clean.
- Safe Harbor inventory: 9 `src/` matches, all feature-gate / enforcement / placeholder references. Zero incidental rendering surfaces. No helper application needed. Matches expected outcome.

**Founder product decision — reflections privacy deferred (2026-05-30):**
The Q4 lock named `reflection_responses` with private flag as a kid-private surface. 5A's surface check found `reflection_responses` has NO privacy column in the live schema. Render lives on `ReflectionsPastTab.tsx`, surface carries "Visible to parent" by design, linked Journal copies are already hidden via the helper at the Journal surface (`visibility='private'`). Founder decision: do not apply a reflections privacy filter at this time. Reflections remain parent-visible. Reopens at the planned Reflections revamp follow-up build (candidate G).

**Orchestrator-verified (against synthesis):**
| Gate | Method | Result |
|---|---|---|
| #2 `npx tsc -b` exit 0 | Worker 5A self-report | ✅ |
| #3 ESLint clean on 5A slice (Fix A scope) | Worker 5A self-report | ✅ 0 errors on 5 files; 1 pre-existing warning unrelated |
| #6 `filterKidPrivate.ts` null-handling verified | Worker 5A trace | ✅ Single short-circuit branch; origin=null path traced |
| #7 Journal kid-private filter applied with expanded predicate | Worker 5A self-report | ✅ |
| #8 InnerWorkings + ReflectionsPage helper application | Worker 5A self-report + founder decision | ✅ InnerWorkings applied; Reflections — no filter applied (named privacy column does not exist in schema; surface is parent-visible by design; linked Journal copy hidden upstream); deferred to Reflections revamp by founder decision |
| #9 Safe Harbor inventory documented | Worker 5A self-report | ✅ 9 surfaces, feature-gate only, no helper application needed |
| #13 (partial) FROZEN files outside 5A's paths NOT touched | Worker 5A self-report | ✅ Selective staging verified |
| Commit landed pre-handoff | Commit `b740b11` | ✅ |

**Checkpoint 2 result: PASSED for 5A. 5B prompt drafted for founder approval — NOT dispatched.**

### Checkpoint 2 — Worker 5B (2026-05-30)

**Self-reported (by Worker 5B):**
- Commit `d057a6d`, exactly 3 files staged (+58/-34). Selective staging verified via `git diff --cached --stat`.
- HubMemberAuthModal: both `navigate('/dashboard')` calls removed (lines 78 + 119 area); both `startViewAs()` calls now pass `origin: 'member_session'`. `useNavigate` import cleaned up. Code comments cite Convention #39 + the original bug.
- ViewAsMemberPicker line 186 (drift from dispatch's "~182"; same `handleSelect` function): explicit `origin: 'mom_viewing'` pass added. Comment notes `switchViewAs` carries origin forward (Worker 1's contract).
- ViewAsBanner: origin-aware UI landed. `isMemberSession = origin === 'member_session'` flag drives three conditional renders — "Manage Tasks" hidden in member_session; "Switch" picker button hidden in member_session (see Surprise below); Exit copy variant ("Return to Hub" with Home icon for member_session, "Exit" with X icon for mom_viewing). Both Exit copies call `stopViewAs()` with identical side effects; difference is purely UX framing for the real human at the device.
- `npx tsc -b` exit 0. ESLint on the 3 files: 0 errors, 1 pre-existing `exhaustive-deps` warning at `ViewAsMemberPicker.tsx:158` (different `useEffect`, not 5B's edit zone at line 186). 5B slice lint-clean.
- Pre-commit hook ran `tsc -b` during commit and passed (Checkpoint 3 gate).
- Post-commit `git status`: 5B's three files absent from modified list. Working tree pollution unchanged (not 5B's problem).

**Surprise surfaced — Switch-button-hide enhancement beyond literal D4 spec:**
The dispatch said "HIDE Manage Tasks in member_session." Worker 5B ALSO hid the "Switch" picker button (and suppressed the picker modal render entirely) in member_session. Rationale documented in-file: in member_session, the real viewer is mom, so opening the picker would list ALL members — a kid could "Switch" into a sibling's session. The enhancement closes a real lateral-session escalation gap.

**Founder confirmation requested before 5E close-out (NOT blocking 5C):** keep the Switch-hide as shipped, OR revert at 5E as a one-line refactor. Recommended: keep. Reasoning: (a) closes a real security gap, (b) aligns with founding principle "invisibility over blocking" (the affordance doesn't exist in the kid's UI rather than blocking it at picker-open time), (c) the documented Q4 lock on `member_session` semantics already implies kids stay scoped to themselves — hiding Switch is a natural extension, (d) revert is cheap if founder prefers literal spec.

**Bonus forward-thinking:** Worker 5B added `data-testid="view-as-exit"` to the Exit/Return-to-Hub button. That's exactly the selector the 5D Playwright draft uses for the architectural-payoff test. 5D inherits a testable affordance for free.

**Worker 5B self-flagged surprise — files already on disk:**
All three 5B files were already on disk as M-status modifications when the sub-session began. The original wedged Worker 5 attempt appears to have completed the edits before the harness bug fired; they survived as uncommitted modifications. Worker 5B verified each against the 5B spec, found them correct, and landed the canonical commit `d057a6d`. The audit trail anchor for 5B is `d057a6d` even though the edits predated this session.

**Orchestrator-verified:**
| Gate | Method | Result |
|---|---|---|
| Commit `d057a6d` landed | `git log --oneline -5` | ✅ Top of main after 5A |
| Commit touched exactly 3 files | `git show --stat d057a6d` | ✅ HubMemberAuthModal +13/-8, ViewAsBanner +38/-23, ViewAsMemberPicker +7/-3 — sums match self-report |
| HubMemberAuthModal both `startViewAs` calls pass `origin: 'member_session'` | `git show d057a6d` diff | ✅ Both `useEffect` no-auth path (line 74) and PIN-success path (line 118) updated; `useNavigate` import removed |
| Both `navigate('/dashboard')` calls removed | Same diff | ✅ Removed at both sites with explanatory comments |
| ViewAsMemberPicker explicit `origin: 'mom_viewing'` pass | `git show d057a6d` diff | ✅ Landed at line 186 (drift from dispatch's "~182" — same `handleSelect` function, semantically identical) |
| ViewAsBanner origin-aware conditional renders | `git show d057a6d` diff | ✅ `isMemberSession` flag drives Manage Tasks hide, Switch hide, Exit copy variant. `data-testid="view-as-exit"` added. |
| `npx tsc -b` exit 0 (independent re-run) | Background Bash | ✅ Exit code 0 |
| FROZEN files outside 5B's three paths NOT touched | `git show --stat d057a6d` | ✅ Only 5B's three files in commit |
| MomOnlyRoute Exit regression check via code-path trace | Worker 5B self-report | ✅ `MomOnlyRoute.tsx:105` reads `stopViewAs` directly from `useViewAs()`; no `ViewAsBanner` import; dependency chain is independent |

**Gate ledger update — 5B closures:**
- Gate #2 (`tsc -b`) ✅ for 5B slice
- Gate #3 (ESLint) ✅ for 5B slice
- Gate #10 (ViewAsBanner origin-aware UI) ✅ — sole owner CLOSED (with founder-pending confirmation on Switch-hide enhancement)
- Gate #12 (MomOnlyRoute Exit regression) ✅ — sole owner CLOSED
- Gate #13 (FROZEN files) ✅ for 5B slice

Remaining gates carry forward to 5C/5D/5E: #1 aggregate, #4 #5 Playwright (5D), #11 timeout behavior (5C).

**Architectural-payoff status:** code-path trace confirms the hub flow refactor is correct by construction. Runtime verification (kid PIN-in → confirm `/hub` stays underneath → modal close → kid lands on `/hub`) is 5D's Playwright job.

**Checkpoint 2 result: PASSED for 5B. 5C prompt drafted for founder approval — NOT dispatched.**

**Founder action items before 5E:**
- ~~Confirm Switch-button-hide enhancement: KEEP (recommended) or REVERT.~~ **RESOLVED 2026-05-30: KEEP.** Founder confirmed. The Switch button + picker modal stay hidden in `member_session`. Lateral-session escalation gap closed. No 5E revert needed.

### Checkpoint 2 — Worker 5C (2026-05-30)

**Self-reported (by Worker 5C):**
- Commit `6a770cd`, exactly 3 files (+224/-2). Pure verify-and-commit — all three artifacts already on disk from the original wedged Worker 5 attempt, including the ViewAsModal mount. No code edits needed; every artifact already matched the contract.
- `useViewAsTimeout.ts` (134 lines, new): signature `({ default, warnAt, onWarn, onTimeout }) → { resetTimer }`. Listeners mousemove/keydown/touchstart/scroll throttled 30s, subscribe on mount (line 120-124), full cleanup on unmount (line 125-130). Warning at `timeoutMs - warnAt` (13 min), close at `timeoutMs` (15 min). Refinement: `warningActiveRef` keeps the 2-min close countdown running during the warning window so only the explicit "I'm still here" cancels it — passive activity doesn't silently leave the banner stuck.
- `ViewAsTimeoutWarningBanner.tsx` (75 lines, new): exact copy "View As session will end in 2 minutes. Tap to keep going." `role="status"` non-blocking strip, no focus trap. Theme tokens only (golden-honey).
- `ViewAsModal.tsx` (+17/-2): banner rendered unconditionally inside the modal body; modal early-returns null unless `isViewingAs && viewingAsMember`. So timers arm exactly while the modal is open and tear down on close.
- `npx tsc -b` exit 0. ESLint on the 3 files: 0 errors, 3 pre-existing `exhaustive-deps` warnings (lines 211/233/247 — theme apply/restore + member-switch effects, predate 5C, warn-not-error). 5C slice lint-clean.

**Self-contained banner divergence (surfaced, accepted):** the dispatch prescribed an `onDismiss` prop split (presentational banner, parent owns hook + state). The on-disk artifact is self-contained — the banner owns the `useViewAsTimeout` hook + its own `showWarning` state + calls `useViewAs().stopViewAs()` internally. This fully satisfies founder Q6 and avoids state-duplication across two components. The dispatch's "verify, don't recreate" rule forbids refactoring to the prescribed split. Orchestrator accepts the self-contained design as canonical 5C. The literal verification criterion ("button calls a prop the parent wires to resetTimer") is not met (button calls the hook's `resetTimer` directly inside the banner), but the founder Q6 requirement IS fully met.

**Commit-message hygiene note:** first commit attempt leaked PowerShell here-string `@'...'@` syntax into the message (Bash tool, wrong quoting). Caught immediately, amended cleanly via `git commit --amend -F` from a message file. Final message correct, no file content affected.

**Orchestrator-verified:**
| Gate | Method | Result |
|---|---|---|
| Commit `6a770cd` landed top of main | `git log --oneline -4` | ✅ After 5A/5B |
| Commit touched exactly 3 files | `git show --stat 6a770cd` | ✅ useViewAsTimeout +134, ViewAsTimeoutWarningBanner +75, ViewAsModal +17/-2 = +224/-2 |
| `useViewAsTimeout` listener cleanup on unmount | Read `useViewAsTimeout.ts:120-131` | ✅ `useEffect` subscribes all 4 events on mount, `removeEventListener` for all 4 + `clearTimers()` in cleanup. No global leak. |
| Warning-window refinement present | Read `useViewAsTimeout.ts:108-118` | ✅ `handleActivity` early-returns when `warningActiveRef.current` is true — passive activity can't cancel the close countdown once the warning is showing |
| Banner self-contained design verified | Read `ViewAsTimeoutWarningBanner.tsx` in full | ✅ Owns hook (line 34-39) + `showWarning` state (line 32) + `stopViewAs` (line 31). `resetTimer()` called directly in button onClick (line 61). Theme tokens only. |
| `useSessionTimeout` separation | Worker 5C code-path trace | ✅ Separate refs (warnTimerRef/closeTimerRef/throttleLockRef/warningActiveRef vs timeoutRef/warningTimeoutRef/countdownIntervalRef), separate registrations, no shared timer/storage state. SESSION_DURATIONS untouched per founder decision 3. |
| `npx tsc -b` exit 0 (independent re-run) | Background Bash | ✅ Exit code 0 |
| FROZEN files outside 5C's three paths NOT touched | `git show --stat 6a770cd` | ✅ Only 5C's three files in commit |

**Gate ledger update — 5C closures:**
- Gate #2 (`tsc -b`) ✅ for 5C slice
- Gate #3 (ESLint) ✅ for 5C slice
- Gate #11 (timeout behavior) ✅ — sole-owner CLOSED at code-level wiring. Runtime verification (15-min idle close, 13-min warning appearance) deferred to Checkpoint 5 founder runbook per founder decision (Playwright timer tests are flaky).
- Gate #13 (FROZEN files) ✅ for 5C slice

**Founder decision recorded (2026-05-30):** KEEP the timeout + warning banner as built. Founder reviewed the "I'm still here" UX, confirmed the hub shared-tablet safety case justifies it. No changes.

Remaining gates carry forward to 5D/5E: #1 aggregate, #4 #5 Playwright (5D), #3/#13 final aggregate (5E).

**Checkpoint 2 result: PASSED for 5C. 5D prompt drafted for founder approval — NOT dispatched.**

### Checkpoint 2 — Worker 5D (2026-05-30)

**Self-reported (by Worker 5D):**
- Commit `627362a`, exactly 3 files (+384, all test infra — no source files touched).
- `tests/e2e/helpers/auth.ts`: added `loginAsMomReal` (real founder account, cacheKey `mom-real`) + `hubPinLogin` (opens /hub member drawer via PullTab `aria-label="Open family member drawer"`, types PIN into `hub-pin-input`/`hub-pin-submit`, waits for PIN-modal to detach as the `startViewAs` completion signal).
- **Smoke Test 1 (member_session) — PASS, deterministic 3×.** Mom on /hub → Gideon (Independent) PINs in → `view_as_sessions` row written with `origin='member_session'` (DB-verified) AND URL stays on `/hub` (no `navigate('/dashboard')`) — the exact bug 5B fixed, proven at runtime.
- **Smoke Test 2 (mom_viewing) — PASS, deterministic 3×.** Mom on /dashboard → ViewAsMemberPills select Gideon → row written with `origin='mom_viewing'` (DB-verified).
- Combined determinism: 6/6 passed (1.4m). DB poll filters by `viewing_as_id + origin` excluding pre-existing rows. Each test terminates its session row (`ended_at`).
- `npx tsc -b` exit 0. ESLint on 3 files: 0 errors, 0 warnings.
- No `data-testid` micro-edits needed — existing selectors (PullTab aria-label, hub-pin-input/submit, view-as-exit, getByRole+filter for dashboard pills) all resolved cleanly.

**Selective staging:** `git diff --cached --stat` showed exactly 3 paths; post-commit `git status` confirms absent from modified list. No FROZEN files touched.

**Orchestrator-verified:**
| Gate | Method | Result |
|---|---|---|
| Commit `627362a` landed top of main | `git log --oneline -2` | ✅ After 5C |
| Commit touched exactly 3 test-infra files | `git show --stat 627362a` | ✅ +384, no source files |
| Gate #4 (member_session write path) | Worker Playwright PASS 3× + DB-verify | ✅ origin='member_session' + /hub-stays |
| Gate #5 (mom_viewing write path) | Worker Playwright PASS 3× + DB-verify | ✅ origin='mom_viewing' |
| `npx tsc -b` (worker-reported + pre-commit hook) | Worker self-report | ✅ exit 0 |

**Gate ledger update — 5D closures:**
- Gate #2 (`tsc -b`) ✅ for 5D slice
- Gate #3 (ESLint) ✅ for 5D slice
- **Gate #4 (Discipline 1 member_session smoke test) ✅ — CLOSED. Deterministic Playwright PASS + DB row verification.**
- **Gate #5 (Discipline 1 mom_viewing smoke test) ✅ — CLOSED. Deterministic Playwright PASS + DB row verification.**
- Gate #13 (FROZEN files) ✅ for 5D slice

**Worker spec-name drift (documented, not a defect):** dispatch named `ViewAsMemberPicker` for the mom-initiated fresh-start, but the real dashboard UI is `ViewAsMemberPills` (inline in Dashboard.tsx) which calls `startViewAs` with NO explicit origin, relying on the provider's `'mom_viewing'` default. The `ViewAsMemberPicker` (5B's explicit-origin pass) is only reached via the in-modal "Switch" button. Both converge on `origin='mom_viewing'`. Worker drove the real mom UI (the pills) for faithful runtime verification — correct call.

---

## BUILD-GATING FINDING — Cross-shell View-As modal auto-close (surfaced by 5D, 2026-05-30)

**Status: OPEN — must be resolved before build close. Holds Worker 5E and Worker 6 Checkpoint 5 eyes-on.**

### What 5D observed
In the Playwright run, when mom views as a member whose shell differs from mom's (Gideon = Independent), the View-As modal mounts then auto-closes within ~2s. No JS error, full page content (bodyLen≈102k), `isViewingAs` simply resets to false. Did NOT affect the smoke-test assertions (the `origin` write fires inside `startViewAs` BEFORE any close, and both gates passed) — but it would break the in-modal "page inside modal" UX that many ⏸ Mom-UI Verification rows depend on.

### Worker 5D's hypothesis (DISPROVEN by orchestrator)
5D hypothesized: "ViewAsModal's mount effect calling `setShell()`/`setTheme()` on the global ThemeProvider, which remounts a provider above ViewAsProvider, resetting its useState."

### Orchestrator investigation (2026-05-30) — mechanism is NOT ThemeProvider
- **Provider tree (App.tsx:98-101):** `QueryClientProvider → ThemeProvider → ModalManagerProvider → ViewAsProvider → BrowserRouter`. All three root providers sit at app root.
- **ThemeProvider (ThemeProvider.tsx:284-294):** renders `{children}` with NO `key` prop and NO conditional rendering. `setShell` (line 236) is a plain `useState` setter exposed raw in context (line 288). Calling it RE-RENDERS children and fires the `applyTokens` CSS-variable effect (line 250-252) — it does **NOT remount** children. React preserves child `useState` (including `ViewAsProvider.viewingAsMember`) across re-renders.
- **Conclusion:** `setShell(targetShell)` at `ViewAsModal.tsx:232` CANNOT reset `ViewAsProvider`'s `viewingAsMember`. The three root providers are structurally stable across theme/shell changes (no keys, no conditional render between them). **The worker's stated mechanism is wrong.** Root cause is UNCONFIRMED.

### Candidate explanations (un-diagnosed)
1. **Test-environment / hub-flow-specific artifact** — the member_session flow runs on the standalone `/hub` route (`ProtectedRouteNoShell`), which does NOT include `ShellProvider`/`RoleRouter` (where `ViewAsModal` normally mounts). Where `ViewAsModal` renders on `/hub`, and whether HubPage re-renders/navigates after PIN, is un-traced. The ~2s timing smells like an async settle (auth refresh, realtime reconnect, React Query settle) specific to the injected-session test harness.
2. **Real bug with a different root cause** — possibly the `/hub` modal mount location, or an effect elsewhere calling `stopViewAs()` on a cross-shell condition. NOT ThemeProvider.

### Why this gates the build
Worker 6 / Checkpoint 5 founder eyes-on of every "page inside modal" Mom-UI Verification row (Lists, Tasks, Journal, Calendar, Victories, etc.) depends on the modal STAYING OPEN. If the modal auto-closes for cross-shell targets in the live app, those rows fail and the build's central UX promise ("View As = sign in as that person") is broken. 5E cannot honestly populate the Mom-UI table until this is resolved.

### Recommended path (founder decision required before 5E)
A focused LIVE-app diagnostic (NOT Playwright — rule out the test artifact):
- `npm run dev`, real mom session, View-As a cross-shell kid (Gideon=Independent) BOTH via the dashboard pills (mom_viewing) AND via /hub PIN (member_session).
- Observe whether the modal stays open or auto-closes.
- Three outcomes:
  - **Stays open live** → Playwright artifact. Note it, proceed to 5E. (Most likely if the ~2s settle is harness-specific.)
  - **Closes live via dashboard pills too** → real modal/provider bug, scope a fix (Worker 5F or fold into Worker 6 pre-work) — root cause is NOT ThemeProvider, so the fix needs real diagnosis.
  - **Closes only via hub flow** → /hub-specific modal-mount issue, scope a fix.

**Checkpoint 2 result for 5D: PASSED (gates #4, #5 CLOSED).**

### RESOLUTION — Cross-shell crash was NOT the modal/ThemeProvider; it was a stack of pre-existing single-mount-assumption bugs (2026-05-30)

Founder ran the live diagnostic. Result: the crash was REAL (not a Playwright artifact) — mom→View-As-Gideon flashed then black-screened. Root cause was NOT the modal auto-close mechanism the 5D worker hypothesized. It was a STACK of pre-existing latent bugs that View-As's "render the target's full shell while the viewer's shell is still mounted" stress is the first thing in the app to expose. Each was found via the browser console error and fixed by a focused hotfix worker (all pre-existing, none introduced by Workers 1-5; all surfaced because View-As double-mounts singleton-assuming components):

| # | Bug | Symptom | Fix | Commit |
|---|---|---|---|---|
| 1 | `useFamilyOverviewData.useTrackersForMembers` selected non-existent columns `config`/`widget_template_id` on `dashboard_widgets` (real: `widget_config`/`template_type`); `if (error) throw error` propagated uncaught | 400 → black screen when the kid's dashboard pulled Family Overview data | Corrected columns via PostgREST alias (`config:widget_config`) + changed all 6 queries in the hook from throw-on-error to `return []` (graceful degradation) | `9593773` |
| 2 | `useNotifications` (NotificationBell) realtime channel reused by topic; two bells (viewer's + View-As kid's) collided → `.on()` after `.subscribe()` threw | flash → black | unique per-instance channel via `useId()` suffix + `.on()` before `.subscribe()` + `removeChannel` cleanup | `939b730` |
| 2b | NEW `ErrorBoundary` (`src/components/shared/ErrorBoundary.tsx`) wrapping the ViewAsModal rendered shell/page; banner + Exit kept OUTSIDE the boundary so Exit always works; boundary keyed on `target.id:path` for auto-recovery | (defense-in-depth) any future render crash in the kid's view degrades to a friendly card, never black-screens the whole app | new class component, theme-tokened fallback, Lucide icon | `939b730` |
| 3 | `usePendingReveals` (ContractRevealWatcher) + `useMessagingRealtime` (`useThreadRealtime`, `useSpacesRealtime`) — same realtime-channel-collision class as #2 | ErrorBoundary card (not black screen — boundary working) on View-As; Messages would have crashed too | systematic sweep applied the `939b730` template to ALL 3 remaining realtime hooks. Confirmed the COMPLETE class: exactly 4 hooks use `postgres_changes`, all now per-instance-safe | `fa5f644` |
| 4 | `ViewAsModal` mounted ONLY in `RoleRouter` (shell routes); `/hub` uses `ProtectedRouteNoShell` (no RoleRouter) → no modal on `/hub`. The 5B hub-flow fix (stay on `/hub`, no navigate) left the kid on a page with no modal to render their view | hub PIN → spinner then nothing | mounted `<ViewAsModal />` in `src/pages/Hub.tsx` (HubPage). `/hub` and shell routes are mutually exclusive → no double-mount. `useShell()` degrades via default context on `/hub` (no throw) | `9d63b1f` |
| 5 | ViewAsBanner + ViewAsTimeoutWarningBanner hardcoded golden-honey (`#d6a461`) — Zero-Hardcoded-Colors convention violation (founder-requested) | banner didn't adapt to theme | swapped to theme tokens, color-only, no logic touched | `d804703` |
| 5b | ViewAsBanner background `--surface-primary` is LIGHT in light themes → "Return to Hub" button text unreadable (founder-caught) | banner readable only in dark themes | background → `var(--color-accent-deep)` (Tooltip/Convention #43 guaranteed-contrast token, always dark enough for `--color-text-on-primary` in every theme); border → `--color-border-default` (accent-deep border would be invisible on accent-deep bg). Founder confirmed readable in light + dark | `f971397` |

**Founder confirmed live (2026-05-30):** dashboard View-As renders the kid's shell and stays open; hub PIN renders the kid's shell over `/hub` and Return-to-Hub lands back cleanly. The ThemeProvider auto-close hypothesis was disproven by orchestrator (ThemeProvider has no `key`/conditional render; `setShell` re-renders not remounts) — the ~2s "auto-close" the 5D Playwright run saw was the ErrorBoundary-less crash, now resolved.

**All 5 fixes verified:** each commit `tsc -b` exit 0, lint clean on touched files, both View-As Playwright specs still pass, selective-staged (no working-tree pollution swept in). Workers 1-5 FROZEN files untouched except the orchestrator-authorized ErrorBoundary wrap in `ViewAsModal.tsx` (commit `939b730`).

**STUB_REGISTRY / WIRING note for Worker 6 close-out:** these 5 fixes are pre-existing-bug repairs surfaced by View-As, not new View-As deliverables — but the ErrorBoundary-around-ViewAsModal and the hub-route ViewAsModal mount ARE permanent View-As architecture improvements that Worker 6 should note in WIRING_STATUS. Convention reminder for any future realtime hook: name channels per-instance (`useId()` suffix), `.on()` before `.subscribe()`, `removeChannel` cleanup — or it WILL collide under View-As. Consider adding this as a convention.

**Build-gating finding: RESOLVED. 5E unblocked.**

---

## Worker 5 (5A–5E) — Aggregate Checkpoint 2 Summary + Worker 6 Carry-Forward (2026-05-30)

### Commit record (complete — read alongside the crash-detour table above)

**5-series deliverable commits:**
- `b740b11` (5A) — `filterKidPrivate()` helper + Journal/InnerWorkings application; Reflections deferred (no privacy column → Follow-Up Build G).
- `d057a6d` (5B) — hub flow `origin='member_session'` (both `startViewAs` calls, `navigate('/dashboard')` removed) + picker `origin='mom_viewing'` + origin-aware `ViewAsBanner` (Manage Tasks hidden, Switch hidden, Exit/Return-to-Hub copy variant; `data-testid="view-as-exit"`).
- `6a770cd` (5C) — `useViewAsTimeout` (15-min idle, 2-min warning) + `ViewAsTimeoutWarningBanner` mounted in `ViewAsModal`.
- `627362a` (5D) — two Discipline-1 Playwright smoke tests; both `origin` write paths DB-verified in production `view_as_sessions`.
- (5E) — this documentation close-out commit (build file + feature-decision Mom-UI tables, top-level status flip, this aggregate summary). No source code touched — exactly 2 markdown files.

**Crash-detour commits (the build only renders cross-shell because of these — see the "RESOLUTION — Cross-shell crash" table above for the full per-bug breakdown):** `9593773` (Family Overview columns + graceful degradation), `939b730` (NotificationBell realtime channel + NEW ErrorBoundary around ViewAsModal), `fa5f644` (systematic realtime sweep — all 4 `postgres_changes` hooks per-instance-safe), `9d63b1f` (ViewAsModal mounted on `/hub` route), `d804703` (banner theme tokens), `f971397` (banner → `--color-accent-deep` for light-theme contrast).

### Gate ledger — final status

- **CLOSED (code-level + tests):** #2 `tsc -b` (all slices), #3 ESLint (all slices), #4 + #5 Discipline-1 Playwright smoke tests (both origin write paths, DB-verified), #6 `filterKidPrivate` null-handling, #7 Journal filter, #8 InnerWorkings + Reflections decision, #9 Safe Harbor inventory, #10 origin-aware banner, #11 timeout wiring, #12 MomOnlyRoute Exit regression, #13 FROZEN files (all slices).
- **REMAINING for Worker 6 / Checkpoint 5 (founder-gated, not code):**
  - Mom-UI Verification table: rows still ⏸ pending founder eyes-on at all three viewports (the founder live-verified the central UX during the 2026-05-30 detour — those rows are ✅ at desktop with detour evidence; tablet/mobile + the systematic per-page rows await the Checkpoint 5 founder runbook, which is already documented in the per-worker runbook sections of this file).
  - **Discipline-2 enum-coverage check — already DE-FACTO SATISFIED.** 5D's Playwright runs wrote BOTH `origin` values (`mom_viewing` AND `member_session`) to production `view_as_sessions`. Worker 6's Discipline-2 step is therefore a **confirmation query** (`SELECT DISTINCT origin FROM view_as_sessions;` should return both values), NOT a manufactured test-insert. Do not fabricate a row.

### Carry-forward to Worker 6 (restated for a self-contained handoff — do NOT execute any of this in 5E)

Worker 6 is a fresh-window sub-session (it touches code, so it earns isolation + the harness/staging disciplines). Its full scope per this build file's "Worker 6" section:

1. **CLAUDE.md Convention #39** — replace with Deliverable B's APPROVED-verbatim text + the migration-point footnote (both are in the "Deliverable B" section of this file). Companion conventions #38/#40/#41 unchanged.
2. **DELETE `src/features/permissions/ViewAsShellWrapper.tsx`** + remove its import/use from `MomShell.tsx`; verify MomShell renders (Q9).
3. **NEW convention — per-instance Realtime channels.** Add a convention the detour surfaced: any Supabase Realtime hook MUST use a per-instance channel name (`useId()` suffix), register `.on()` before `.subscribe()`, and clean up with `removeChannel` — or it WILL collide under View-As duplicate-shell mounting. Cite commits `939b730` + `fa5f644` as the template. Propose the wording to the founder before merging.
4. **STUB_REGISTRY.md + WIRING_STATUS.md** — record: `useEffectiveMember/Shell/Viewer` hooks, `<MomOnlyRoute>` backstop, `filterKidPrivate` helper, My Rewards stub route + `show_my_rewards` toggle, ErrorBoundary-around-ViewAsModal, hub-route ViewAsModal mount.
5. **Register Follow-Up Build candidates A–G** in STUB_REGISTRY (My Rewards content, Special Adult sidebar audit, Safe Harbor decommission, Generated Supabase types, Per-member sidebar customization, Shopping Mode/Lists visibility scoping, Reflections revamp — all detailed in this file's "Follow-Up Build Candidates" section).
6. **Audit steps:** PlannedExpansionCard `voted_via_view_as` still fires (PRD-32-32A regression); Safe Harbor block still fires (`PRIVACY_ROUTE_MAP`); Convention #16 parity; Disciplines 1+2 satisfied across all workers; Discipline-2 enum confirmation query (NOT a test-insert — both values already in prod).
7. **Close-out file ops (Convention #14 Part B):** move this build file to `.claude/completed-builds/2026-05/`, update `.claude/completed-builds/README.md` + `IDLE.md`. Run `npm run schema:dump` only if migration state changed (100246 + 100248 already applied — likely a no-op confirmation).

After Worker 6: Checkpoint 5 (post-build audit, `post-build-verifier`) then Checkpoint 6 (close-out cascade).

---

## Worker 3 carry-forward — Shopping Mode useEffectiveMember() adoption (CRITICAL)

When Worker 3 dispatches, the Worker 3 prompt MUST explicitly call out Shopping Mode as a page that needs `useEffectiveMember()` adoption. Without that migration, the Independent sidebar restoration in Worker 2's revision pass leaves a behavioral inconsistency: mom-in-View-As of a teen would see HER full Shopping Mode aggregation (since `useFamilyMember()` returns mom), not the teen's lists. The whole point of the architecture.

Shopping Mode's data scope is enforced naturally by RLS + `list_shares` + the page querying through `useEffectiveMember()`. Worker 2's sidebar restore + Worker 3's page migration are two halves of the same payoff — both must land for the Independent teen Shopping Mode flow to behave correctly.

Same principle applies to Touch Base, Family Feeds, AI Vault, BookShelf surfaces restored in Worker 2's revision — Worker 3 must adopt `useEffectiveMember()` at the page level for each.

---

## Founder Questions — Status (updated 2026-05-25)

| # | Question | Status |
|---|---|---|
| Q1 | `view_as_sessions.origin` new column vs JSONB | **LOCKED — new column with `DEFAULT 'mom_viewing' CHECK (origin IN ('mom_viewing','member_session'))`.** Worker 1 writes migration. |
| Q2 | Final mom-only route list for `<MomOnlyRoute>` | **LOCKED — 16 routes total (2026-05-28).** See Deliverable A — Mom-Only Route List section above. `/feeds` DROPPED per PRD-32A demand-validation principle + PRD-31 Balanced Dad has Family Feeds ✓. `/admin/*` NOT added (double-gate with `<AdminGate>` adds no real protection). |
| Q2a | Prize Board scope + kid My Rewards | **LOCKED.** Mom Prize Board hard-blocked from kid surfaces. New 'My Rewards' kid surface registered as stub for this build (route + sidebar + per-child toggle); page content is follow-up build. Reuse PRD-28 `child_can_see_finances` for money visibility; add `family_members.preferences.show_my_rewards` for surface visibility. |
| Q3 | Mom-only-route block UX | **LOCKED — friendly card as SECONDARY UX.** Primary is sidebar invisibility (Worker 2). Card copy varies by origin: mom_viewing = "This is a mom-only area. Tap Exit View As to access it." member_session = "Ask mom to help with this — it's a parent-only area." |
| Q4 | Kid-private surfaces beyond Journal | **LOCKED — confirmed kid-private:** `journal_entries(entry_type='lila_conversation')`. Safe Harbor data folded in until decommission. **AMENDED 2026-05-30 per Worker 5A surface check:** `reflection_responses` has NO privacy column in the live schema (verified against `claude/live_schema.md` and the `ReflectionResponse` interface). The render surface (`ReflectionsPastTab.tsx`) carries a "Visible to parent" indicator by design, and the linked Journal copy is already hidden via the helper at the Journal surface (`visibility='private'`). **Founder decision (2026-05-30):** do not apply a reflections privacy filter at this time. Reflection responses remain parent-visible on the Reflections Past tab. Reopens at the planned Reflections revamp follow-up build (see candidate G). |
| Q5 | Messages hard-block vs migrate | **LOCKED — migrate to `useEffectiveMember()` and trust RLS.** Empty results for non-participant spaces is correct outcome. Worker 4 documents spot-check. |
| Q6 | Timeout warning vs silent close | **LOCKED — 2-min warning + "I'm still here" extension button.** Hook: `useViewAsTimeout({default: 15*60_000, warnAt: 2*60_000})`. |
| Q7 | Convention #39 replacement wording | **LOCKED — text APPROVED verbatim (2026-05-28). Migration-point footnote added.** See Deliverable B section above. Companion conventions #38, #40, #41 unchanged. |
| Q8 | InfoRecentVictories.tsx migration decision | **LOCKED — Worker 3 makes the call** based on intent. Document in commit message + Post-Build Verification. |
| Q9 | `ViewAsShellWrapper.tsx` future | **LOCKED — DELETE in Worker 6.** |

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Worker 3 sweep breaks a page that silently relied on `useFamilyMember()` returning auth user but actually wanted data-subject | Medium | Medium | Worker 3 takes 1 page at a time and verifies each in-modal rendering before moving on. PRs per page. |
| Worker 2 sidebar rewrite makes mom own sidebar shift (she might see different items) | Low | Low (cosmetic) | Mom own sidebar config (`getSidebarSections('mom')`) is NOT touched. Only the non-mom branches are rewritten. Verify at Checkpoint 5. |
| `<MomOnlyRoute>` guard inadvertently blocks a route mom legitimately needs | Low | Medium | Worker 4 only adds the guard to the agreed list (Q2). Mom remains the auth user in all cases — the guard checks the *target* identity, not the auth user. |
| Hub PIN flow removal of `navigate('/dashboard')` leaves the kid stuck on the modal with no underlying page (because they were already on `/hub`) | Low | High | Worker 5 explicit verification: open modal from `/hub`, close modal, confirm `/hub` is rendered underneath. `ViewAsModal` mounts at `RoleRouter` level, so the underlying page is mom-shell-rendered-on-/hub (since mom is still the auth user, the Hub PWA renders normally). |
| Mom in modal in View As of kid X tries to navigate to a kid-X-permitted URL that is not in `renderPage()` switch — falls through to `default: <Dashboard isViewAsOverlay />` | Medium | Low | Pre-existing behavior. Audit Section 1 notes this. Founder approves continued behavior unless Worker 4 surfaces a specific impact. |
| `useViewAsTimeout` competes with `useSessionTimeout` activity listeners | Low | Low | Use a separate event listener namespace. Document the separation. Both can co-exist — they listen to the same events but have separate state machines. |
| Migration on `view_as_sessions` fails on the 371 existing rows | Very Low | Medium | Default value + check constraint added together. Backfill is implicit via the default. No data migration needed. |
| Convention #39 update text creates confusion if Worker 6 closes before everyone caught up | Low | Low | Convention text approved at Checkpoint 1 before any code, applied at Worker 6 close-out. Founder reviews wording. |
| RLS on `view_as_sessions` denies the audit insert during member_session origin | Very Low | High | Mom is the auth user. RLS already permits her inserts. No RLS change needed. Verify via existing 371-row history that audit inserts succeed for both flow paths. |

---

## Build-Wide Disciplines (established 2026-05-28 — bind every remaining worker + Checkpoint 5)

These disciplines were established after Checkpoint 2 surfaced that the project does not use generated Supabase TypeScript types (`src/lib/supabase/client.ts:10` calls `createClient(...)` without a generic). `tsc -b` therefore cannot catch a column-name typo or a value-out-of-enum mistake on `supabase.from(...).insert(...)` payloads. The two disciplines close that gap procedurally.

### Discipline 1 — Runtime smoke test required for any worker writing or reading a new/modified column

Any worker whose code path INSERTs into, UPDATEs, or READs from a column introduced or modified by this build MUST include a runtime smoke test in their Checkpoint 2 report. "tsc passed" is insufficient evidence.

Concretely:
- **Worker 4 (My Rewards toggle write path, if applicable):** "I toggled `family_members.preferences.show_my_rewards` to true for a test member, queried the row directly via Supabase Studio / `npm run schema:dump`-adjacent query, confirmed the JSONB key was written correctly."
- **Worker 5 (hub flow → `origin='member_session'`):** "I manually triggered a hub PIN login as a test kid, confirmed a new `view_as_sessions` row was written with `origin='member_session'` via direct DB query (Supabase Studio or psql). The migration's CHECK constraint accepted the value."
- **Worker 5 (mom picker → `origin='mom_viewing'` explicit pass):** "I manually triggered View-As from the mom picker, confirmed the new `view_as_sessions` row has `origin='mom_viewing'`."
- **Worker 2 (My Rewards sidebar read of `show_my_rewards`):** "I toggled the preference on for a test member via direct DB write, observed the sidebar entry appear in that member's shell inside View-As. Toggled off, observed entry disappear."

The smoke-test evidence sits in the worker's Checkpoint 2 return-control summary AND in the Mom-UI Verification table's Evidence column where relevant.

### Discipline 2 — Insert-path verification at Checkpoint 5 (post-build audit)

When this build closes, the post-build verifier audit step MUST query the affected tables and confirm both values of any new enum-constrained column have been observed in production OR have been verified by test insert. Specifically:

- **`view_as_sessions.origin`** — confirm rows exist with both `origin='mom_viewing'` AND `origin='member_session'`. If `'member_session'` has not yet been written by real user activity (the hub flow may have low traffic immediately post-deploy), run a test insert via Supabase Studio with `origin='member_session'`, confirm the CHECK constraint accepts it, then `DELETE FROM view_as_sessions WHERE [test row id]` to clean up. Document the test insert in the audit report.
- **Any future enum-constrained column** introduced by a follow-up worker is subject to the same rule.

This is the safety net for the codebase-level type-safety gap. The runtime smoke tests (Discipline 1) catch the bug at write time. The post-build verifier confirms enum coverage at close-out. The two together substitute for what generated Supabase types would provide.

### Why these are binding for this build

The project has 358 migrations and 200+ tables in production. Retrofitting generated types is a separate effort (probably its own follow-up build). Until then, every worker on this build operates under these two disciplines. Failure to include the smoke test fails Checkpoint 2. Failure to run the insert-path verification fails Checkpoint 5.

Worker 6's audit step adds an explicit checklist item: "Disciplines 1 + 2 satisfied across all workers."

---

## Checkpoint 2 — Worker 1 (2026-05-28)

### Self-reported (by Worker 1)
- All 7 deliverables complete
- Migration `00000000100246_view_as_sessions_origin_column.sql` applied via `supabase db push --linked`. 394 rows backfilled to `'mom_viewing'` via DEFAULT. CHECK constraint enforces enum.
- `npx tsc -b` exit code 0
- `claude/live_schema.md` regenerated, `view_as_sessions.origin` visible at row 7
- `useFamilyMember.ts` zero diff vs main — 119 callers untouched
- `useEffectiveMember()` falls back to `useFamilyMember()` outside scope
- `useEffectiveShell()` returns `ShellType` (the union, not raw `dashboard_mode`)
- Backend-only worker — no Mom-UI surfaces affected

### Orchestrator-verified
| Gate | Method | Result |
|---|---|---|
| Migration file exists at expected path | Glob | ✅ `supabase/migrations/00000000100246_view_as_sessions_origin_column.sql` |
| Migration is idempotent | Read | ✅ `ADD COLUMN IF NOT EXISTS` + conditional CHECK via `pg_constraint` lookup |
| `view_as_sessions.origin` in production schema | Grep `claude/live_schema.md` | ✅ Row 7, 394 rows |
| `ViewAsProvider` exposes `origin` in context | Read `ViewAsProvider.tsx:42, 56, 77, 197` | ✅ State, type, default, exposed value all present |
| `ViewAsProvider.startViewAs` writes `origin` to audit | Read `ViewAsProvider.tsx:97` | ✅ `origin: nextOrigin` in insert payload |
| `ViewAsProvider.switchViewAs` writes `origin` to audit | Read `ViewAsProvider.tsx:161` | ✅ `origin: nextOrigin` in insert payload |
| `useEffectiveMember()` exists and falls back to auth | Read `useEffectiveMember.ts:55-72` | ✅ Falls back to `useFamilyMember()` when not in scope |
| `useEffectiveShell()` returns `ShellType` (not `dashboard_mode`) | Read `useEffectiveShell.ts:26-33` | ✅ Returns `ShellType`, delegates to `useShell()` outside scope, calls `getShellForMember()` inside |
| `useEffectiveViewer()` exposes `realHumanIsTarget` | Read `useEffectiveViewer.ts:61-69` | ✅ True only when `origin === 'member_session'`, false outside scope |
| `getShellForMember` exported from ShellProvider | Grep | ✅ Line 36, export added — diff is export keyword + 4-line JSDoc, no behavior change |
| `useFamilyMember.ts` unchanged | `git status` | ✅ Not in modified file list |
| `npx tsc -b` clean (independent re-run) | Background Bash | ✅ Exit code 0 |
| ShellType import path canonical | Grep | ✅ `useEffectiveShell.ts:24` imports from `@/lib/theme` — same path `ShellProvider.tsx:6` uses |
| `switchViewAs` carry-forward semantics safe | Grep callers | ✅ Only caller is `ViewAsMemberPicker.tsx:179`. Picker seeds `'mom_viewing'` via `startViewAs`; switches carry forward. Hub flow uses `startViewAs`, never `switchViewAs`. Forward-compatible. |

### Architectural decisions Worker 1 made (not pre-specified, accepted at Checkpoint 2)

1. **Extended `ViewAsProvider` rather than splitting into a separate `ViewAsIdentityScope` context.** Single source of truth for View-As identity state including `origin`. Avoids drift risk between parallel providers. **Convention #39 rewrite (Worker 6) describes the architecture without naming a separate scope component.**
2. **Exported `getShellForMember` from `ShellProvider.tsx`** so `useEffectiveShell()` can call the single-source-of-truth mapping. Diff is export keyword + 4-line JSDoc; zero behavior change. Worker 2 may consume `getShellForMember` directly if needed for sidebar rewrite.
3. **`switchViewAs(member, options?: StartViewAsOptions)` carries previous origin forward by default.** Rationale: kid switching members in member_session contexts (if ever built) should not silently flip to mom_viewing. Today only `ViewAsMemberPicker.tsx:179` calls `switchViewAs`, and the picker seeds mom_viewing via `startViewAs`, so carry-forward preserves it correctly.
4. **`useEffectiveViewer.realHumanIsTarget` returns FALSE outside View-As scope** (not `true`). Rationale: the question "is the real human the data subject?" is only meaningful inside View-As. Outside, normal auth flow handles identity. **Worker 5 must verify this matches `filterKidPrivate()` expected semantics** — specifically that `{ origin: null }` correctly means "no filtering needed."

### Pre-existing codebase observation (NOT a Worker 1 gap)

- **No generated Supabase TypeScript types in checked-in code.** The `db:types` script in `package.json:21` would generate to `src/types/supabase.ts`, but that file is not committed. `src/lib/supabase/client.ts:10` calls `createClient(...)` WITHOUT a generic type parameter. All `supabase.from(...).insert(...)` calls are loosely typed. `tsc -b` passing on the new `origin` field is therefore not a strong type-safety signal — it just means TypeScript is treating the payload permissively. **This is the project's pre-existing pattern. No Worker 1 action needed.** Schema documentation lives in `claude/live_schema.md` (markdown, regenerated via `npm run schema:dump`) and per-domain hand-written types in `src/types/*.ts` for the surfaces the codebase types strictly.

### Carry-forward notes for Worker 5

- **`realHumanIsTarget = false` outside View-As scope.** When Worker 5 builds `filterKidPrivate(items, { origin, isKidPrivateFn })`, confirm the helper treats `origin === null` as "no filtering" rather than default-deny. Worker 1's `useEffectiveViewer()` returns `realHumanIsTarget: false` and `origin: null` outside scope, so the helper's null-handling decides correctness.
- **`switchViewAs` no longer reachable from the hub flow.** Hub flow uses `startViewAs(member, viewerId, familyId, { origin: 'member_session' })`. If a future iteration lets kids switch members on the hub, Worker 5 (or that future build) passes `{ origin: 'member_session' }` explicitly OR relies on carry-forward.

### Retroactive note on Build-Wide Disciplines

The two build-wide disciplines (Runtime smoke test + Post-build insert-path verification) were established AFTER Worker 1's Checkpoint 2 ran. Worker 1's `origin` write path was not exercised by a runtime smoke test at Checkpoint 2 — only verified via migration application, tsc, schema dump, and code-level read of the insert payload.

This is acceptable because: (a) Worker 1's startViewAs/switchViewAs default to `'mom_viewing'`, and every existing call site (ViewAsMemberPicker, Dashboard, HubMemberAuthModal as of pre-Worker-5) hits the default path; (b) the very next worker (Worker 2) will exercise Worker 1's `origin='mom_viewing'` write path during their sidebar smoke test inside the ViewAs modal; (c) Worker 5 will explicitly exercise `origin='member_session'` per Discipline 1 of their dispatch.

The audit trail therefore stays intact: Worker 1's write path gets its first runtime confirmation at Worker 2's smoke test (mom_viewing), and its second at Worker 5's smoke test (member_session). Worker 6's Checkpoint 5 audit confirms both values at close-out per Discipline 2.

### Checkpoint 2 result: **PASSED**. Worker 2 cleared for dispatch.

---

## Pre-Build Founder Sign-Off Required

Before any worker dispatches:
- [x] Q1 answered — new column with default backfill (2026-05-25)
- [x] Q2 answered — mom-only route list locked at 16 routes (Deliverable A APPROVED 2026-05-28)
- [x] Q2a answered — My Rewards stub scope locked (2026-05-25)
- [x] Q3 answered — friendly card as backstop UX, primary is invisibility (2026-05-25)
- [x] Q4 answered — reflection_responses + lila_conversation entries + Safe Harbor fold-in (2026-05-25)
- [x] Q5 answered — migrate Messages + trust RLS (2026-05-25)
- [x] Q6 answered — 15-min timeout + 2-min warning + I'm-still-here button (2026-05-25)
- [x] Q7 answered — Convention #39 replacement wording APPROVED + migration-point footnote added (Deliverable B APPROVED 2026-05-28)
- [x] Q8 answered — Worker 3 decision based on intent (2026-05-25)
- [x] Q9 answered — DELETE ViewAsShellWrapper.tsx in Worker 6 (2026-05-25)
- [x] Final approval to dispatch Worker 1 (2026-05-28)

Founder sign-off post-build (Convention #14 Part A):
- [ ] Mom-UI Verification table fully ✅ at all three viewports for all shells listed
- [ ] Zero Missing items in Post-Build Verification table
- [ ] STUB_REGISTRY updated (My Rewards content, Safe Harbor decommission, all existing stubs)
- [ ] CLAUDE.md Convention #39 replaced
- [ ] WIRING_STATUS.md updated
- [ ] Decision file Post-Build Verification table populated and signed off
- [ ] `ViewAsShellWrapper.tsx` deleted; MomShell verified rendering correctly
