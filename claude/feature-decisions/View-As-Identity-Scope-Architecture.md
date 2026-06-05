# Feature Decision File: View As — Identity-Scope Architecture

> **Created:** 2026-05-19
> **PRDs:** `prds/foundation/PRD-02-Permissions-Access-Control.md`, `prds/dashboards/PRD-14D-Family-Hub.md`
> **Addenda to read (pre-build-auditor pass):**
>   - `prds/addenda/PRD-14D-Cross-PRD-Impact-Addendum.md` ✓ (read in Plan Mode)
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md` — pending
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md` — pending
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` — pending (verify View As tier still Enhanced)
>   - Any addendum touching `view_as_sessions`, `view_as_feature_exclusions`, `view_as_permissions`, or `HubMemberAuthModal` — pending grep pass
> **Companion research:** `claude/web-sync/VIEW_AS_AUDIT_2026-05-19.md` (7,284-word independent audit by research worker, read in full)
> **Founder approved:** Direction confirmed 2026-05-19 Plan Mode session. Full pre-build summary approval pending pre-build-auditor output.

---

## What Is Being Built

A re-architecture of View As — and the Family Hub's PIN-protected member access flow — so the modal opens with the target member's actual session: their identity, their data, their navigation. The modal renders above whatever was underneath (mom's dashboard, or the family hub). Closing the modal (X button, click-off, or inactivity timeout) reveals the original page intact.

**Today** the modal swaps shell/theme but every data hook still resolves to mom — so the kid sees mom's lists, mom's tasks, mom's victories, dressed in their theme. From the family hub this means **kids on the shared tablet right now are looking at mom's data after PIN entry** — a privacy bug in production.

**After this build** the modal contents render as if the target were the data subject. The modal carries two identity tags — "whose data?" (the target) and "who's actually pressing buttons?" (mom or the target, depending on origin). Pages that don't care about the second tag work unchanged. Pages with kid-private content (Journal entries marked private, Safe Harbor history, self-knowledge shared/unshared with mom) use both tags to decide what to show.

---

## Founder Decisions (locked 2026-05-19)

1. **Identity-scoping mechanism: Option β.** Keep `useFamilyMember()` as the auth-user hook (returns mom — 119 callers depend on this). Add a new `useEffectiveMember()` hook for "the data subject." Sweep the ~27 page-level callers that legitimately want "whose data" (~17 with inline `activeMember` forks today + ~10 with no View As awareness today). Add a parallel `useEffectiveShell()` for the same reason at the shell layer. Considered and rejected: hijacking `useFamilyMember()` itself (Option α) — would silently break the 119 callers that legitimately want auth-user.
2. **Origin flag on the ViewAs context:** `origin: 'mom_viewing' | 'member_session'`. Set to `'mom_viewing'` when `startViewAs()` is called from mom's dashboard. Set to `'member_session'` when called from `HubMemberAuthModal` after PIN entry (the kid asserted presence at the device). The flag drives kid-private content filtering — see decision 4.
3. **Modal-only inactivity timeout.** New timeout that runs only while ViewAs is active. **Default 15 minutes** of no taps → close the modal. Does NOT touch regular auth sessions. Mom on her phone, dad on his phone, kids on their own devices stay signed in indefinitely. The broken PRD-01 spec timeouts (adult=0, etc.) are NOT being fixed — the persistent-login behavior they produce is what the founder wants. Only the View As modal gets a timeout.
4. **Kid-private content filter (small extension, not new schema).** Today only [`Journal.tsx:33-42`](src/pages/Journal.tsx#L33-L42) does this: when `isViewingAs`, strip entries with `visibility='private'`. Promote that pattern into a shared helper. Rule: **if `origin === 'mom_viewing'` AND item is marked kid-private, hide it. Otherwise show it.** Wire the helper into Journal (existing), Safe Harbor (already excluded via `excludedFeatures`), and any `self_knowledge` rows where `share_with_mom = false`. No new columns, no new tables. The kid-private concept already exists in fragments — this just makes them work consistently.
5. **No "mom hides from this kid" privacy schema.** Dropped from roadmap. Founder couldn't name a real use case that isn't already handled by existing per-member data scoping (lists are per-owner, journal is mom-scoped, archives are mom-scoped, etc.). If a real use case surfaces later, add a column to that one table at that time — no platform-wide privacy model needed today.
6. **Modal close behavior depends on origin.** From mom's dashboard → returns to mom's dashboard underneath. From hub → returns to `/hub` underneath (currently buggy — `HubMemberAuthModal` navigates to `/dashboard` after PIN success; this build changes that).
7. **PRD-09B verification deferred.** Living Shopping List build stays in `current-builds/` with verification pending. View As opens as a second active build.

---

## Screens & Components

| Screen / Component | Status | Notes |
|---|---|---|
| `ViewAsModal` | Refactor | Wrap children in `ViewAsIdentityScope`. Read `origin` from ViewAs context to seed the scope. On close, navigate based on origin: mom_viewing → no nav (mom's dashboard already underneath); member_session → ensure underlying route is `/hub`. |
| `ViewAsIdentityScope` provider | **NEW** | Context provider that exposes the target member + origin to `useEffectiveMember()` / `useEffectiveShell()`. Lives inside the modal's React tree only. |
| `useEffectiveMember()` hook | **NEW** | Returns `{ member, isViewAs, origin, realViewerId }`. Reads from `ViewAsIdentityScope` if present; falls back to `useFamilyMember()` otherwise. Used by the ~27 page-level callers that want "whose data?" |
| `useEffectiveShell()` hook | **NEW** | Same pattern for shell type. Returns the target's shell when in View As scope, mom's shell otherwise. Replaces the inline `useMemo` shell derivation in `Sidebar.tsx:307-317` and `BottomNav.tsx:76-86`. |
| `useEffectiveViewer()` helper | **NEW (small)** | Returns `{ realHumanIsTarget: boolean }` — true when `origin === 'member_session'`. Used by the kid-private filter helper. |
| `filterKidPrivate()` helper | **NEW (small)** | The shared "hide kid-private from mom-when-viewing" helper. Used by Journal (existing logic refactored to use it), Safe Harbor surfaces, self_knowledge surfaces, any future kid-private content type. |
| `ViewAsProvider` | Refactor | Add `origin` to context state. `startViewAs()` accepts an `origin` parameter. `HubMemberAuthModal` passes `'member_session'`; `ViewAsMemberPicker` passes `'mom_viewing'`. |
| `ViewAsBanner` | Minor adjustment | Manage Tasks button currently calls `stopViewAs() + navigate('/tasks?member=…')` — correct for mom-origin. Hide or relabel for member-session origin (kid doesn't need a "go back to mom's task manager" shortcut). |
| `ViewAsMemberPicker` | No change | Used by Switch button in banner. Mom-origin only. |
| `HubMemberAuthModal` | Refactor | After PIN verify, open the View As modal layered over `/hub` instead of navigating to `/dashboard`. Pass `origin='member_session'` to `startViewAs()`. |
| `HubMemberAccessSection` | No change | Renders the avatar grid; tapping a member opens `HubMemberAuthModal`. |
| Sidebar (adult shell config) | Rewrite | Drop mom-only management items (Studio, Prize Board admin, RewardRules/Contracts) from non-mom shells. Reconcile against `permission_level_profiles` (164 rows). |
| Sidebar (independent shell config) | Rewrite | Same — current independent shell pulls from the same `plan` constant. |
| Sidebar (guided shell config) | Verify | Already kid-appropriate per audit; confirm no mom-only items leak through. |
| BottomNav More menu | Inherits from sidebar | Built from `getSidebarSections(shell)` per Convention #16 — auto-reflects sidebar rewrite. Verify no parallel list anywhere. |
| Route-level guards for mom-only management | **NEW** | Today the only protection is "sidebar doesn't list it." A kid in View As who navigated by URL could still reach Studio etc. Add a `<MomOnlyRoute>` guard component for: `/studio`, `/prize-board` (admin tabs), `/contracts`, `/permissions`, `/family-members`, `/family-setup`, `/settings/allowance/*`, `/settings/homework`, `/settings/gamification`, `/settings/reward-reveals`, `/archives/family-overview`, `/archives/privacy-filtered`, `/archives/export`. Full list finalized in pre-build summary. |
| View As modal inactivity timeout | **NEW** | 15-min default. `useViewAsTimeout` hook subscribes to mouse/key/touch/scroll inside the modal. On timeout: `stopViewAs()`. Does not affect regular `useSessionTimeout`. |
| `Dashboard.tsx` `isViewAsOverlay` plumbing | Simplify | After `useEffectiveMember()` lands, the `displayMemberId` ternary becomes redundant — `useFamilyMember()` (auth) and `useEffectiveMember()` (data subject) cleanly split. The `isViewAsOverlay` prop stays for cosmetic flags (hide sign-out, hide family-setup prompt, disable long-press edit) but the data-subject logic moves to `useEffectiveMember()`. |
| `GuidedDashboard.tsx`, `PlayDashboard.tsx` `isViewAsOverlay` plumbing | Simplify | Same pattern as Dashboard. |

---

## Mom-UI Surfaces

| Surface | Shells | New / Modification |
|---|---|---|
| ViewAsModal — mom-origin (opened from mom's dashboard) | Mom | Modification (identity scope inside; close returns to mom dashboard) |
| ViewAsModal — member-session origin (opened from family hub PIN flow) | (no shell — hub overlay) | Modification (close returns to `/hub` not `/dashboard`) |
| Sidebar inside ViewAs modal — Adult shell config | Adult | Modification (drop mom-only items) |
| Sidebar inside ViewAs modal — Independent shell config | Independent | Modification (drop mom-only items) |
| Sidebar inside ViewAs modal — Guided shell config | Guided | Verify — kid-appropriate already |
| Sidebar inside ViewAs modal — Play shell | Play | Verify — no sidebar; confirm child-facing dashboard renders with kid's data |
| BottomNav More menu inside ViewAs modal | Adult, Independent | Modification (inherits sidebar config) |
| ViewAsBanner — mom-origin | (modal banner) | Adjustment (Manage Tasks visible) |
| ViewAsBanner — member-session origin | (modal banner) | Adjustment (Manage Tasks hidden) |
| HubMemberAuthModal post-PIN landing | (hub) | Modification (no longer navigates to /dashboard; modal layered over /hub) |
| Lists page rendered inside ViewAs modal | (target shell) | Verify — must show target member's lists |
| Tasks page rendered inside ViewAs modal | (target shell) | Verify — must show target member's tasks |
| Journal rendered inside ViewAs modal — mom_viewing | (target shell) | Verify — kid-private entries HIDDEN from mom |
| Journal rendered inside ViewAs modal — member_session | (target shell) | Verify — kid-private entries SHOWN to kid |
| Victories rendered inside ViewAs modal | (target shell) | Verify — must show target member's victories |
| Calendar rendered inside ViewAs modal | (target shell) | Verify — must show target member's events |
| Meetings/Touch Base rendered inside ViewAs modal | (target shell) | Verify — Touch Base scoped to target |
| Messages rendered inside ViewAs modal | (target shell) | **High-priority verify** — Convention #141 says mom CANNOT read other members' messages. mom_viewing must show only messages the target is a participant in. |
| Settings rendered inside ViewAs modal | (target shell) | Verify — target's settings, not mom's. |
| Mom-only routes (Studio, PrizeBoard admin, RewardRules) | (any non-mom shell in modal) | Hard-blocked by `<MomOnlyRoute>` guard |
| Modal inactivity timeout → close | All | 15-min default; founder configurable later |

## Mom-UI Verification (populate during build)

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| ViewAsModal — mom-origin | ✅ | ⏸ founder eyes-on | ⏸ founder eyes-on | Mom | Founder live-verified during 2026-05-30 cross-shell detour — dashboard View-As of Gideon (Independent) renders kid shell + modal stays open; banner readable light + dark. | 2026-05-30 |
| ViewAsModal — hub-origin | ✅ | ⏸ founder eyes-on | ⏸ founder eyes-on | hub overlay | Founder live-verified during 2026-05-30 cross-shell detour — hub PIN renders kid shell over `/hub`. | 2026-05-30 |
| Sidebar inside modal (Adult) | | | | | | |
| Sidebar inside modal (Independent) | | | | | | |
| Sidebar inside modal (Guided) | | | | | | |
| Modal close → mom dashboard | ⏸ founder eyes-on | ⏸ founder eyes-on | ⏸ founder eyes-on | Mom | Modal-stays-open-over-dashboard confirmed during 2026-05-30 detour; explicit close-back pending eyes-on. | |
| Modal close → /hub | ✅ | ⏸ founder eyes-on | ⏸ founder eyes-on | hub overlay | Founder live-verified during 2026-05-30 cross-shell detour — Return-to-Hub lands on `/hub` cleanly. | 2026-05-30 |
| Modal inactivity timeout | | | | | | |
| Lists page inside modal | | | | | | |
| Tasks page inside modal | | | | | | |
| Journal inside modal — kid-private hidden from mom | | | | | | |
| Journal inside modal — kid-private shown to kid | | | | | | |
| Victories inside modal | | | | | | |
| Calendar inside modal | | | | | | |
| Messages inside modal (Convention #141) | | | | | | |
| Settings inside modal | | | | | | |
| Mom-only routes blocked from kid shells | | | | | | |

---

## Key Architectural Decisions (Easy to Miss)

1. **`useFamilyMember()` stays as "auth user."** 119 callers depend on this — sidebar persistence, GlitchReporter attribution, permission resolution, settings pages, shell computation. Do NOT make `useFamilyMember()` context-aware.
2. **`useEffectiveMember()` is the NEW hook for "data subject."** Used by ~27 page-level callers (~17 with inline `activeMember` forks today + ~10 with zero View As awareness). The inline forks get migrated to `useEffectiveMember()`. The zero-awareness pages get evaluated: either migrate or hard-block via `<MomOnlyRoute>`.
3. **The "real human" question** is exposed via `useEffectiveViewer().realHumanIsTarget` (derived from `origin`). Used by the kid-private filter helper. Only ~3-4 surfaces actually consume this (Journal, Safe Harbor, self_knowledge).
4. **PRD-02 Screen 5: "Actions log as the viewed member"** — already honored at the application layer via `target_member_id` columns. Pre-build-auditor verifies no orphan write path attributes to `auth.uid()` instead of the target.
5. **Convention #39 in CLAUDE.md is STALE** — says "View As renders full-shell mode via `ViewAsShellWrapper` wrapping MomShell content." `ViewAsShellWrapper` is a no-op passthrough. This build updates Convention #39 to reflect modal-overlay + identity-scope + origin-flag architecture.
6. **Hub flow uses the same modal as mom's View As** — same `startViewAs()` call, different `origin` parameter. Convention #39 update covers both flows in one rule.
7. **`view_as_feature_exclusions` (234 rows in prod) is currently hardcoded to Safe Harbor** in `ViewAsProvider.PRIVACY_EXCLUSIONS`. Runtime gate at `ViewAsModal.tsx:294` only honors that one key. This build does NOT add a configuration UI but DOES verify the runtime gate still fires correctly through the new architecture.
8. **`view_as_permissions` table has 0 rows and is untouched.** Originally intended for per-kid View As exclusions config. No longer in scope (no privacy schema build planned).
9. **`view_as_sessions` audit table** (351 rows in prod) is still inserted-into on every `startViewAs()`. Hub-origin sessions get the same row with `origin` recorded in metadata or a new column (pre-build-auditor decides — column vs JSONB).
10. **Convention #16 (mobile/desktop nav parity)** is reaffirmed — BottomNav More menu reads from `getSidebarSections(shell)`. The sidebar config rewrite automatically propagates to mobile.
11. **PRD-01 session-timeout spec is INTENTIONALLY NOT being followed.** Adult=24h, independent=4h, guided=1h, play=30m — all stay broken-as-implemented (the current `SESSION_DURATIONS` table has adult=0 = no timeout). Founder explicitly wants persistent logins on personal devices. The only new timeout is the View-As-modal-only 15-min inactivity timer.

---

## Addendum Rulings

> Pre-build-auditor: complete the addenda read pass. Especially:
> - PRD-Audit-Readiness-Addendum.md — cross-cutting audit rulings
> - PRD-31-Permission-Matrix-Addendum.md — verify `view_as_mode` tier (currently Enhanced)
> - Any addendum mentioning `view_as_*` tables or `HubMemberAuthModal`
> - PRD-09A/09B addenda — verify no requirement for the OLD `displayMemberId` pattern this build is consolidating
> - PRD-15 (Messaging) — Convention #141 says mom cannot read other members' messages. Verify View As respects this when Messages page is opened in modal.

### From PRD-14D Cross-PRD Impact Addendum (read 2026-05-19)
- No direct View As mechanics defined. The addendum extends the perspective switcher to non-mom shells.
- The addendum does NOT address the kid-PIN-from-hub flow — that was layered on after the PRD-14D session. **This build formalizes that flow.**

---

## Database Changes Required

**None expected.** All necessary tables already exist:

| Table | Status | Use |
|---|---|---|
| `view_as_sessions` | exists, 351 rows | Audit trail for every View As session — possibly add `origin` column (pre-build-auditor decides column vs JSONB metadata) |
| `view_as_feature_exclusions` | exists, 234 rows | Runtime feature blocks — unchanged this build |
| `view_as_permissions` | exists, 0 rows | Untouched (no privacy schema build planned) |

> Pre-build-auditor: confirm by reading actual table definitions in `claude/live_schema.md` and migrations. Decide whether `origin` warrants a new column or fits in existing JSONB.

---

## Feature Keys

No new feature keys required. Existing keys from PRD-02:

| Feature Key | Tier | Notes |
|---|---|---|
| `view_as_mode` | Enhanced | Already registered. No change. |

> Pre-build-auditor: verify `view_as_mode` exists in `feature_key_registry` and that PRD-31 hasn't changed the tier.

---

## Stubs — Do NOT Build This Phase

- [ ] Mom-configures-per-kid privacy gates UI. **Dropped from roadmap** — not a follow-up build. If a real use case surfaces, handle it on the affected table at that time.
- [ ] `/hub` as installable PWA. Tablet PWA bounces to `/dashboard`. Separate follow-up build (B-followup-1).
- [ ] Real Supabase auth swap for kids. Not needed under chosen architecture.
- [ ] Configuration UI for `view_as_feature_exclusions` beyond the hardcoded Safe Harbor entry.
- [ ] Real-time session-end propagation across devices.
- [ ] PRD-01 spec session timeouts (24h adult, 4h independent, 1h guided, 30m play). Intentionally NOT enforced — founder wants persistent logins. Only the new View-As-modal 15-min inactivity timer is in scope.
- [ ] Auto-titling, AI session summary, or any other LiLa intelligence on View As sessions.

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| ViewAsIdentityScope | → | ~27 page-level callers | `useEffectiveMember()` / `useEffectiveShell()` |
| ViewAsModal | → | Sidebar / BottomNav | Sidebar reads `useEffectiveShell()` to choose target's shell config |
| ViewAsModal | → | Per-target theme | Existing wiring, no change |
| HubMemberAuthModal (PRD-14D) | → | `startViewAs(target, mom.id, family.id, 'member_session')` | New `origin` parameter |
| ViewAsMemberPicker (mom's dashboard) | → | `startViewAs(target, mom.id, family.id, 'mom_viewing')` | New `origin` parameter |
| `filterKidPrivate()` helper | → | Journal (existing logic refactored) | Replaces inline filter at `Journal.tsx:33-42` |
| `filterKidPrivate()` helper | → | Self-knowledge surfaces | New wiring; respects `share_with_mom` flag |
| `filterKidPrivate()` helper | → | Safe Harbor surfaces | Already excluded entirely via `excludedFeatures`; verify no leak |
| View As modal close | → | mom's dashboard OR /hub | Based on `origin` |
| `<MomOnlyRoute>` guard | → | Studio, PrizeBoard, Contracts, etc. | Hard-blocks when modal target is non-mom |
| `startViewAs()` | → | `view_as_sessions` | Insert audit row (unchanged; possibly add origin field) |

---

## Things That Connect Back to This Feature Later

- **B-followup-1: `/hub` as installable PWA** — fixes the tablet app shortcut bouncing to `/dashboard`. After that ships, the modal-close return-to-`/hub` behavior works end-to-end on installed-app installations.
- **Future PRD-15 Messaging integration** — when message coaching settings are wired in, the sender identity must use `useEffectiveMember()`, not `useFamilyMember()`. The pattern this build establishes is the template.
- **Future PRD-30 Safety Monitoring** — when a kid types in their journal/conversation inside the modal, safety monitoring evaluates against the target's age/sensitivity settings, not mom's. Identity-scope makes this work for free as long as the relevant hooks use `useEffectiveMember()`.
- **If a real "hide from this specific kid" use case ever surfaces** — add a column to the affected table at that time. No platform-wide privacy schema needed.

---

## Founder Confirmation (Pre-Build)

- [x] Direction confirmed in Plan Mode session 2026-05-19
- [x] Identity-scope = Option β (`useEffectiveMember()` + sweep ~27 pages)
- [x] Origin flag on ViewAs state (`mom_viewing` | `member_session`)
- [x] Kid-private filter helper (small extension of existing Journal pattern, NOT new schema)
- [x] No privacy gates schema build planned (dropped from roadmap)
- [x] Modal-only inactivity timeout, 15-min default
- [x] PRD-01 spec timeouts intentionally NOT enforced
- [x] Hub close-behavior = return to `/hub`
- [x] PRD-09B verification deferred
- [ ] Full pre-build summary approved (pending pre-build-auditor output)
- [ ] All addenda captured (pending pre-build-auditor full read pass)
- [ ] Final mom-only route block list confirmed (pending pre-build-auditor)
- [ ] `view_as_sessions` origin field decision (column vs JSONB — pre-build-auditor)
- [ ] **Approved to build** (founder signs after pre-build-auditor output)

---

## Post-Build PRD Verification

> Every requirement from PRD-02 §Screen 5 + PRD-14D hub PIN flow + founder-locked decisions accounted for.

Full 48-row Wired/Stubbed/Missing table produced by the `post-build-verifier` agent (Checkpoint 5, 2026-06-04) and preserved in the archived build file `.claude/completed-builds/2026-06/view-as-identity-scope-architecture.md` (Checkpoint 6 section). Graded from direct code evidence, not self-reports.

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- **Total requirements verified: 48**
- **Wired: 45**
- **Stubbed: 2** — My Rewards page content (route/gate/feature-key Wired; body is a `PlannedExpansionCard` stub → Follow-Up Build A) · Reflections kid-privacy (no privacy column in live schema → Follow-Up Build G)
- **Missing: 0**

Closed under founder Option B (2026-06-04): remaining Mom-UI eyes-on rows (tablet/mobile viewport sweeps + kid-side data/blocked-card/Journal checks) accepted as pending-founder-eyes-on; functional + structural evidence complete; runbooks in the archived build file. Kid-private Journal check is N/A until kids create journal entries. Post-audit emoji fix (`5d1fbee`): `PrivacyBlockedPage` lock emoji → Lucide `Lock` (no-emoji rule).

---

## Founder Sign-Off (Post-Build)

- [x] Verification table reviewed (post-build-verifier, 48 reqs)
- [~] Mom-UI Verification table — load-bearing rows ✅ founder-live-verified; remaining tablet/mobile + kid-side rows accepted as pending-eyes-on per Option B (functional + structural verified)
- [x] All stubs are acceptable for this phase and in STUB_REGISTRY.md (My Rewards content → Follow-Up A; Reflections privacy → Follow-Up G)
- [x] Zero Missing items confirmed
- [x] CLAUDE.md Convention #39 updated to reflect new architecture (+ #272 realtime channels added)
- [x] **Phase approved as complete** (founder Option B, 2026-06-04)
- **Completion date:** 2026-06-04
