# Active Build: MEMBER-SETTINGS-HUB — Person-First Settings Navigation

> **Status: Rounds 1–2 SHIPPED (`618f041`, closed `5a932eb`, both on `main`). ROUND 3 — a founder-reported minimize/pill bug in actual use, diagnosed and fixed — PROOF COMPLETE, HOLDING for referee + founder confirm before this small follow-up commit.** Round 3 fixed a genuine, platform-wide `ModalV2`/`ModalManagerContext` bug (pill click never actually reopened a minimized modal — confirmed dead for all 6 real persistent-modal consumers app-wide, not hub-specific) alongside a hub-scoped UX ruling (X = full close, no pill; only the backdrop and the — button minimize). 6/6 functional E2E green (hub's own suite, incl. the new pill-lifecycle test), 1/1 new tour test green (3 screenshots read, state-preservation visually confirmed pixel-identical before/after restore), 16/16 + 15/16 regression sample green (the 1 failure reproduced identically on a clean stash of `main` — pre-existing, unrelated to this fix). Zero fixture residue.
> Founder-directed build, no PRD (a UI-navigation feature layered entirely on top of existing editors — no new tables, no new save paths). Her words: "I'd like the ability to click on the name, access each of their areas — allowance, homework, gamification, etc. — as well as edit pin/password, all from just their name," while every existing topic-direction surface (Allowance page, Manage Members & PINs, Permission Hub, Safety Monitoring settings) stays exactly as it is.
> **Founder gap-check (round 2):** the round-1 build wired only `/family-members`'s roster. The founder's original complaint was specifically about the roster PREVIEW on the Settings page itself ("Settings → Family Management") — the one that made her press "Manage Members & PINs" before she could do anything. Round 2 adds that second door, mounting the SAME `MemberSettingsHub` component with no fork.
> **Round 3 (this section):** founder UX ruling + suspected bug on the hub's minimize behavior — see "Round 3" section below for the full diagnosis, fix, and blast-radius reasoning.
> ⛔ Production-touch gate (`.claude/rules/orchestrator.md`): no migration was needed at any round (confirmed — zero schema changes, ever), no deploys. The E2E suite and Convention #277 tour HAVE been run live under seat-granted suite slots (see "Live proof" sections below) — zero fixture residue, independently re-verified at every round.

## What shipped

**Two launch points, one hub.**
1. `src/pages/FamilyMembers.tsx`'s member rows (round 1) — clickable (name/avatar/chevron, `data-testid="member-hub-open-{id}"`).
2. `src/pages/SettingsPage.tsx`'s Family Management roster preview (round 2, the founder gap-check) — its "Quick member overview" rows are now clickable too (`data-testid="settings-member-hub-open-{id}"`), opening the SAME `MemberSettingsHub` right there on `/settings`, no navigation hop to `/family-members` first. Mom's own row stays a plain, non-interactive summary (no hub for herself — see "Why mom's own row stays plain" below). The existing "Manage Members & PINs" nav link (→ `/family-members`) is completely untouched — both doors reach the same rooms.

Both doors call the identical `<MemberSettingsHub>` component with the identical `useMemberSaveAndConsentGate()` hook — zero forked logic.

**The hub.** `src/components/family/MemberSettingsHub.tsx` — `ModalV2 type="persistent" size="xl"`, gradient header, minimize-to-pill (standard ModalV2 persistent behavior, matching every other persistent modal in this codebase — no bespoke restore-from-pill wiring was built, since none exists anywhere else in the app either). A "View as [name]" footer button launches the existing View-As machinery (`startViewAs`, Convention #39 modal-overlay architecture) — see the dedicated finding below for why it navigates to `/dashboard` first, and why exiting View-As lands mom on her own Dashboard rather than reopening the hub. The hub's own `ModalV2 isOpen` is wired to `!isViewingAs` as a defensive guard against ever rendering the hub UI stacked underneath the ViewAsModal overlay.

Nine collapsible sections (Convention-style accordion, default-open on Profile only, expanding one never auto-collapses another):

| Section | What it mounts | Branches by role? |
|---|---|---|
| Profile | `MemberProfileEditor` (extracted, see below) | No — same form for everyone |
| Login & Access | Launch rows → `PinModal` / `PictureModal` / `SetLoginModal` / `InviteModal` (extracted, see below) | No |
| Permissions & Features | Read-only summary (`member_feature_toggles` count) + deep link to `/permissions` | No |
| Allowance & Finances | `ChildAllowanceConfigInner` (extracted) | Kids only — adults/special adults get a one-line note |
| Gamification & Rewards | Launch row → existing `GamificationSettingsModal` | No |
| Homework / Homeschool | Read-only note (no per-child editor exists anywhere in the app today — none invented) | Copy differs kid vs adult |
| Safety Monitoring | Same `useMonitoringConfigs`/`useUpdateMonitoringConfig`/`SafetySensitivityModal` hooks as Settings → Safety Monitoring, filtered to this member; dad also gets the "receives alerts" recipient toggle | Kids + additional_adult; special_adult gets a note |
| Privacy & Consent | `MemberPrivacyConsentCard` (new, extracted from `PrivacyConsentPage.tsx`) | Kids only (COPPA) |
| Theme & Appearance | Read-only note — theme is owner-set-only today, no write path invented | No |

**Section applicability is a pure, unit-tested function**, not inline JSX conditionals: `src/lib/family/memberSettingsHubSections.ts` (`getMemberSectionApplicability(role)`), pinned by `tests/member-settings-hub-sections.test.ts` (4/4 — kid, dad, special_adult, and an unknown-role degrade-safely case).

**Extractions performed (the "launcher, not editors" discipline — zero new save paths):**
1. `src/components/family/MemberProfileEditor.tsx` — the name/dashboard-mode/birthday/age-bracket/color form + Save/Cancel, pulled verbatim out of `FamilyMembers.tsx`'s inline `MemberRow` edit panel. `MemberRow` now renders this same component instead of its old inline JSX — one implementation, two launch points (the inline pencil AND the hub).
2. `src/components/family/MemberLoginModals.tsx` — `PictureModal`, `SetLoginModal`, `PinModal`, `InviteModal` moved out of `FamilyMembers.tsx` verbatim (mechanical `sed`-range extraction, not retyped) so both `FamilyMembers.tsx` and `MemberSettingsHub.tsx` can import them without a circular-import risk between the two.
3. `src/features/financial/ChildAllowanceConfig.tsx` — `ChildAllowanceConfigPage` (route, reads `memberId` from `useParams`) is now a 3-line wrapper around a new exported `ChildAllowanceConfigInner({ memberId })`, which carries 100% of the original page's logic unchanged. The hub mounts `ChildAllowanceConfigInner` directly.
4. `src/pages/PrivacyConsentPage.tsx` — `ActiveRow`/`RevokedRow`/`AgedOutRow` are now exported (were page-private), and a new `MemberPrivacyConsentCard({ memberId, memberName })` filters `useCoppaConsentRecords()` to one member and renders the right row, owning its own revocation-modal state at this component's level (not nested inside `ActiveRow`) — mirroring the exact reason the page itself does this (a 2026-08-24 tour finding: nesting the modal inside a row that unmounts on revoke success closes the modal before mom sees the success screen).
5. **(Round 2)** `src/hooks/useMemberSaveAndConsentGate.tsx` — the save/consent-gate machinery (`handleSaveMember`, `handleUnder13Transition`, and the dormant-card/consent-flow/acknowledge-modal JSX) was pulled OUT of `FamilyMembers.tsx` entirely and into this shared hook, specifically so a SECOND caller (`SettingsPage.tsx`) could reuse the identical gate without forking it. `FamilyMembers.tsx` now calls this hook instead of owning the state itself — a genuine consolidation, not just an addition. Returns `{ handleSaveMember, handleUnder13Transition, gateModals }`; `gateModals` is a JSX fragment the caller renders once (the actual `CoppaDormantCard`/`CoppaConsentFlow`/`CoppaAcknowledgeModal` stack). Accepts an optional `onSaved` callback so `FamilyMembers.tsx` can still reset its own `editingId` toggle after a save, while `SettingsPage.tsx` (which has no such toggle) simply omits it.

**Both callers' save/consent-gate machinery is now the SAME hook, not two forks.** The COPPA bracket-transition consent gate (dormant card → consent flow → acknowledge modal) fires from exactly the same code path regardless of which of the two doors mom used.

**Why mom's own row stays a plain, non-interactive summary on Settings → Family Management.** Allowance, Privacy & Consent, and Safety Monitoring don't apply to mom herself, and "View as Mom" is nonsensical — opening the full hub for her own row would mostly show "not applicable" notes. Her row still displays (visual parity with the pre-existing list unchanged) but isn't wrapped in a button. `/family-members`'s own roster already excludes mom entirely (`otherMembers = allMembers.filter(m => m.id !== member?.id)`) for the same reason — this is consistent with that existing convention, not a new one.

## Real finding during round 2's own E2E proof — Settings sections are collapsed-by-default accordions

**Finding.** The first live run of the new Settings-entry test failed on the click itself ("element is visible, enabled and stable" yet "`<div class=\"rounded-xl overflow-hidden\">` intercepts pointer events").

**Root cause.** Every section on `/settings` (`SettingsSection`, including "Family Management") is its OWN collapsed-by-default accordion (`useState(false)`, content wrapped in `max-height: isOpen ? '4000px' : '0px'; overflow: hidden`). Playwright's actionability check considered the roster button "visible" (it has real dimensions of its own), but its clipped 0-height ancestor meant the actual click coordinates landed on the collapsed section's OWN header instead.

**Not a bug — this is exactly the pre-existing friction the founder was describing.** Mom already has to expand "Family Management" to see the roster preview at all (that was true before this build touched anything). The fix here is test-side only: `page.getByRole('button', { name: 'Family Management' }).click()` before asserting the roster row, in both the functional spec and the tour. The improvement this build makes is real regardless — once she's expanded the section she was already opening to glance at her family, the rows are now clickable instead of dead ends.

**Convention #14 (LiLa knowledge):** `FEATURE_GUIDE_REGISTRY['member_settings_hub']`, a `help-patterns.ts` entry, a `PAGE_KNOWLEDGE['/family-members']` entry, and a `USE_CASE_RECIPES` entry — all added even though `FeatureGuide` renders nothing while `FEATURE_GUIDES_DISABLED=true` (matches the platform-wide flag; content is registered and ready for when it flips).

## Real bug found live during the first E2E run — View-As launched from a mom-only page

**Finding.** The hub's "View as [name]" button originally called `startViewAs(...)` directly while still on `/family-members`. The FIRST live run of `member-settings-hub.spec.ts` test 4 timed out waiting for the ViewAsBanner — the screenshot showed a "Parent-only area — Tap Exit View As to access it" card had replaced the ENTIRE page instead.

**Root cause.** `/family-members` is wrapped in `<MomOnlyRoute>`, which resolves the "effective member" via `useEffectiveMember()` — a hook that reads the GLOBAL `isViewingAs` flag from `ViewAsProvider`, not scoped to `ViewAsModal`'s own rendered subtree (its own doc comment says "inside the modal scope" but the implementation has no such scoping). The instant `startViewAs` sets `viewingAsMember`, EVERY consumer of `useEffectiveMember()` anywhere in the tree — including `MomOnlyRoute` guarding the very route mom is standing on — starts resolving to the View-As target (Casey, role='member'). `MomOnlyRoute` then renders its OWN `<MomOnlyBlockedCard>` directly instead of `<ProtectedRoute>{children}</ProtectedRoute>`, which means `RoleRouter`/`ViewAsModal` (mounted only inside `ProtectedRoute`) never gets a chance to mount at all. View-As technically starts (a real `view_as_sessions` row is inserted) but mom sees nothing but a dead-end "Parent-only" card.

**Why this is pre-existing platform behavior, not a defect I introduced.** Every other View-As launch point in the app (`ViewAsMemberPicker` on Dashboard's "View As" tab, `HubMemberAuthModal`) starts from `/dashboard` or `/hub` — neither is `<MomOnlyRoute>`-gated. The Member Settings Hub is the FIRST feature to try launching View-As from a page that itself sits behind `MomOnlyRoute`, which is what surfaced the mismatch. This is a real, general platform interaction (any future feature launching View-As from a mom-only page would hit the identical wall) — not something to "fix" by touching `MomOnlyRoute` or `useEffectiveMember` (a Convention #39-governed component, out of scope for a launcher build) but by not launching from an incompatible host page.

**Fix.** The hub's "View as" button now calls `navigate('/dashboard')` BEFORE `startViewAs(...)` — landing on the same non-gated host every other View-As entry point already uses. Exiting View-As (via the real `ViewAsBanner`'s exit button) returns mom to her own Dashboard, not back into the hub — navigating away unmounts `FamilyMembers.tsx` and its `hubMemberId` state, exactly like leaving any other page would. This is a deliberate, disclosed deviation from the original design language ("hub reopens automatically") — reopening the hub across a hard navigation isn't supported by the underlying architecture without changes to `MomOnlyRoute` itself, which is out of this build's scope. The in-code doc comment at the top of `MemberSettingsHub.tsx` and the test itself both document the real behavior.

**Proof of the fix:** `member-settings-hub.spec.ts`'s View-As test (rewritten to assert `waitForURL('**/dashboard')`, the real `ViewAsBanner` text "Viewing as ... Casey", and a clean exit with no blocked card) — green on re-run. See "Live proof — Round 1" below for the full live-run detail.

## Files touched

- `src/pages/FamilyMembers.tsx` (modified — clickable rows, exports 4 modal functions moved out, imports the new hub; **round 2:** now calls `useMemberSaveAndConsentGate` instead of owning the gate state itself)
- `src/pages/SettingsPage.tsx` (**round 2, new** — Family Management roster rows clickable, mounts `MemberSettingsHub` + `useMemberSaveAndConsentGate`; dropped its own ad-hoc roster fetch in favor of the shared `useFamilyMembers` hook; removed now-unused `supabase`/`useEffect` imports)
- `src/hooks/useMemberSaveAndConsentGate.tsx` (**round 2, new** — the shared save/consent-gate hook both pages call)
- `src/components/family/MemberProfileEditor.tsx` (new)
- `src/components/family/MemberLoginModals.tsx` (new — extracted)
- `src/components/family/MemberSettingsHub.tsx` (new)
- `src/lib/family/memberSettingsHubSections.ts` (new — pure applicability logic)
- `src/features/financial/ChildAllowanceConfig.tsx` (modified — `ChildAllowanceConfigInner` extraction)
- `src/pages/PrivacyConsentPage.tsx` (modified — 3 row exports + `MemberPrivacyConsentCard`)
- `src/config/feature_guide_registry.ts` (modified — new entry)
- `src/lib/ai/help-patterns.ts` (modified — new pattern)
- `supabase/functions/_shared/feature-guide-knowledge.ts` (modified — page knowledge + use-case recipe)
- `tests/member-settings-hub-sections.test.ts` (new — vitest, 4/4 green)
- `tests/e2e/features/member-settings-hub.spec.ts` (new — **5 tests, 5/5 green live** — round 2 added the Settings-entry test)
- `tests/e2e/features/member-settings-hub-eyes-on-tour.spec.ts` (new — **4 tests, 4/4 green live**, EYES_ON_TOUR-gated — round 2 added the Settings-entry shot)
- this build file

## Local proof (done, no production touch)

- `npx tsc -b` — clean, zero errors, across the whole project (verified after both round 1 and round 2's changes).
- `npx eslint .` (full project) — **0 errors, 81 warnings, all pre-existing** (none in this build's files, either round — confirmed by `git status --porcelain`: the only touched files are the ones listed above).
- `npm run prebuild` — green: lint (0 errors), `verify_jwt` config check (63/63 Edge Functions — this build touches none), Safe Harbor filter check (63/63, 0 unguarded queries — this build touches none), under-13 aggregation-exclusion check (85 files, 4 writers — this build touches none).
- `npx vitest run tests/member-settings-hub-sections.test.ts` — **4/4 green** (unaffected by round 2 — the pure applicability function wasn't touched).
- `npx vitest run` (full suite, round 1) — **883 passed / 10 failed across 5 files, ALL PRE-EXISTING**: `tests/build-task-schedule-fields-routine.test.ts` (1), `tests/convention-lint.test.ts` (4), `tests/journal-notepad.test.ts` (2), `tests/personal-growth.test.ts` (2), `tests/update-routine-template-atomic.test.ts` (1). This exact 10-failure/5-file signature matches a previously-documented pre-existing baseline from this session's own history (PRD-40 Slice 5's progress log records the identical set) — none of these files or their source dependencies appear anywhere in this build's diff.
- `npx playwright test tests/e2e/features/member-settings-hub.spec.ts --list` — **5/5 parse-clean** (round 2 added test 4, the Settings-entry gap-check).
- `npx playwright test tests/e2e/features/member-settings-hub-eyes-on-tour.spec.ts --list` — **4/4 parse-clean** (EYES_ON_TOUR-gated; round 2 added the Settings-entry shot).

## Live proof — Round 1 (done this session — seat-granted suite slot)

**Functional spec — 4/4 green** (`npx playwright test tests/e2e/features/member-settings-hub.spec.ts`), after the View-As fix above:
1. Mom-only enforcement (Casey session → Parent-only block card) — ✅ 6.1s
2. Row click opens the hub scoped to Casey (Profile default-open, Login & Access + Safety Monitoring expand correctly) — ✅ 6.8s
3. Real edit through Allowance persists (`weekly_amount=37.5` DB-asserted on the throwaway `HUBTEST Kid` fixture) — ✅ 8.3s
4. View As launches (now via `/dashboard`), banner shows "Viewing as ... Casey", exits cleanly with no blocked card — ✅ 7.3s

**Zero fixture residue** — independently re-verified via a standalone service-role query (not just the test's own `afterAll` assertion): zero `HUBTEST%` rows in `family_members`, and zero orphaned `allowance_configs`/`allowance_periods`/`lists` rows for the swept id.

**Regression pins — 12/13 green:**
- `family-auth-two-door.spec.ts` — 7/8 (test 8, "PIN personal device — env-gated," timed out on its own `waitForLoadState('networkidle')` AFTER a successful `waitForURL('**/dashboard')` — this is the exact pre-existing flake already diagnosed and exonerated in an earlier build this session; my changes touch none of that test's real founder-family PIN/shadow-account code path).
- `pin-relock-stickiness.spec.ts` — 5/5.

**Convention #277 eyes-on tour — 3/3 green, all 9 screenshots read.** Zero defects found — every section, every viewport, theme-consistent, no unstyled/clipped/overflowing states. One pre-existing cosmetic artifact noted (not a regression): on the mobile member-list screenshot, the fixed BottomNav overlays the "Jordan" row mid-scroll — a full-page-screenshot-vs-fixed-positioning artifact already documented platform-wide in an earlier session (not specific to this build).

## Live proof — Round 2, the Settings entry gap-check (this session, seat-granted suite slot)

**Functional spec — 5/5 green** (all of round 1's 4 tests re-verified green after the `useMemberSaveAndConsentGate` extraction, PLUS the new test 4):
1–3, 5. Round 1's four tests, unchanged in behavior, re-run green after the shared-hook refactor.
4. **NEW: "Settings → Family Management roster row opens the SAME hub (founder gap-check, 2026-09-07)"** — expands the collapsed Family Management accordion, clicks Casey's row on `/settings` (confirms `page.url()` still contains `/settings` — no navigation hop), confirms the hub opens with `MemberProfileEditor` visible, does a real idempotent Save (Casey's own unchanged name) and DB-asserts `display_name` persisted, and confirms mom's own row (`settings-member-hub-open-{sarahId}`) has zero matches — not a button. — ✅ 7.2s

One real test-authoring bug found and fixed during this round's own first run (documented above as its own finding): Settings sections are collapsed-by-default accordions — the test now expands "Family Management" before asserting the roster.

**Zero fixture residue** — independently re-verified: zero `HUBTEST%` rows, and Casey's row confirmed byte-identical to her pre-test values (`role`, `dashboard_mode`, `age`, `coppa_age_bracket`, `member_color`, `date_of_birth` all unchanged — only `display_name` was written, and it was written back to itself).

**Convention #277 eyes-on tour — 4/4 green**, the 2 new Settings-entry screenshots read (below), for **11/11 total screenshots read across both rounds.**

Referee pass → selective staging (the file list above) → commit on founder confirm.

## Round 3 — minimize/pill/restore/dismiss lifecycle (founder ruling + confirmed platform-wide bug, 2026-09-07)

**The founder's message.** Desired semantics: (1) X = fully done, modal closes, no pill remains; (2) clicking the page underneath = minimize to the pill; (3) clicking the pill = REOPEN the hub with state preserved; (4) the pill gets its own small dismiss x. She flagged a suspected bug — "clicking the pill makes it disappear without reopening" — and asked for a diagnosis BEFORE any fix, with the blast radius kept explicit: a genuine shared-component bug fix could go global, but the X-semantics change should stay scoped to the hub unless every other persistent-modal consumer was confirmed not to depend on X-minimizes.

### Diagnosis (done first, confirmed real, before any code changed)

Two distinct things were wrong, read directly out of `ModalV2.tsx`/`ModalManagerContext.tsx`/`MinimizedPill(Bar).tsx` plus cross-checked against `specs/Modal-System-Architecture.md`:

1. **Pill-click-restore was never actually wired — a real, platform-wide gap in the shared component, not hub-specific.** `doMinimize()` called the consumer's own `onClose()` right after registering the pill — which unmounts the whole subtree for every one of this codebase's 6 real `type="persistent"` consumers (`BookDiscussionModal`, `EventCreationModal`, `MemberSettingsHub`, `PostMeetingReview`, `TaskCreationModal`, `TrackerQuickCreateModal` — confirmed via `grep -rl 'type="persistent"'`). Clicking a pill called `ModalManagerContext.restore(id)`, which only filtered the id out of the `minimized` array and returned the (always-empty, `state: {}`) record — nothing in the codebase consumed that return value to tell the original, now-unmounted consumer to remount. Confirmed via `grep -rln "onRestore=\|onMinimize="` that **zero** of the 6 consumers pass either prop to their own `<ModalV2>` — the pill was decorative from day one, for every consumer, not something this build broke. `specs/Modal-System-Architecture.md`'s own "Restore Flow" (pill click → modal reopens with preserved state) and its verification checklist ("Clicking a pill restores the modal with all state preserved") describe exactly the behavior that was never actually implemented.
2. **X-button-minimizes (not closes) is the ORIGINAL, deliberate design** — `specs/Modal-System-Architecture.md`'s Behavior Decision Matrix explicitly says "Click X button → Minimize" for persistent modals, and `handleHeaderClose`/`handleBackdropClick` both routed to the identical `handleMinimize()`. The founder's ruling is a considered override of that original decision, not a bug report against it.

**Blast-radius check before deciding scope:** grepped the other 5 consumers for `hasUnsavedChanges`/`onSaveDraft`/`onMinimize`/`onRestore` — 3 of them (`EventCreationModal`, `PostMeetingReview`, `TaskCreationModal`) pass `hasUnsavedChanges` (cosmetic orange-dot on the pill only), **zero** of the 6 pass `onSaveDraft` (so the draft-prompt branch has never fired for anyone either), and **zero** pass `onMinimize`/`onRestore`. None of the 5 non-hub consumers have any functional dependency on "X leaves a pill" beyond a pill that was already broken (couldn't be restored) — so fixing restore can only improve their situation, and none rely on "X = minimize" as load-bearing UX beyond that same broken affordance.

### The fix

**Global (the confirmed shared-component bug — benefits all 6 consumers identically):**
- `ModalManagerContext.tsx`: added `dismiss(id)` + `dismissedSignal` alongside the existing `close`/`restore`. `dismiss` is the pill's own explicit "throw this away" action (right-click, or its new small x) — it removes the pill AND stamps a signal the still-mounted modal watches, so it can actually unmount itself. `restore` (a plain pill click) is now sufficient **on its own** to bring the modal back — nothing else needs to change.
- `ModalV2.tsx`: `doMinimize()` no longer calls the consumer's `onClose()` — the whole subtree (all of `MemberSettingsHub`'s internal React state: which sections are expanded, scroll position, form drafts, everything) stays mounted, just hidden behind `display:none` on the overlay (`visuallyOpen = isOpen && !manager.isMinimized(id)`), so a plain pill click causing `isMinimized(id)` to flip false is now enough for the exact same DOM/state to reappear — no per-consumer serialize/deserialize wiring required, matching the original spec's promise. Body-scroll-lock, active-modal-id tracking, and the Escape handler are now gated on `visuallyOpen` (not `isOpen`) — so the "page underneath" is genuinely fully interactive while minimized, per the founder's point (2). A defensive `useEffect` clears any stale pill whenever `isOpen` goes false for real, so a true close can never leave an orphan pill.
- A real bug was found and fixed DURING this fix's own proof run (not shipped broken): a fresh remount of the SAME modal id (id is keyed by `targetMember.id`, so reopening after a dismiss reuses it) was reading the STALE `dismissedSignal` left over from the previous instance and immediately closing itself again. Fixed with a ref that captures "whatever signal already existed at mount time" as the baseline, so only a genuinely NEW dismiss (fired while THIS instance is live) triggers a close.
- `MinimizedPill.tsx`/`MinimizedPillBar.tsx`: the pill now renders two zones — clicking the body restores (unchanged verb, now functional), and a new small, always-visible `X` (12px, `aria-label="Dismiss {title}"`) discards for good; right-click is kept as the existing power-user shortcut, now also wired to `dismiss` instead of the old `close` (which would have left the modal mounted-but-orphaned under the new architecture).
- `ModalBackdrop.tsx`: added `data-testid="modal-backdrop"` — a test-only, zero-behavior-impact addition needed to reliably click "the page underneath" in the new E2E test.

**Scoped to the hub only (per the founder's explicit instruction):**
- New `ModalV2Props.closeButtonBehavior?: 'minimize' | 'close'`, default `'minimize'` — every existing consumer is unaffected unless it opts in. `MemberSettingsHub.tsx` is the only consumer passing `closeButtonBehavior="close"`. With it: the header X (and Escape) call `onClose()` directly — full close, no pill, matching founder point (1). The separate minimize (—) button (already present in `ModalHeader` for every persistent modal, previously fully redundant with X) is untouched and still minimizes regardless of `closeButtonBehavior` — so the hub now reads exactly like a desktop window: — minimizes, X is done.

**Known, disclosed limitation (not attempted, out of the founder's actual ask):** pills do NOT survive an actual route change to a different page. That would require rendering the minimized flow's content from a global registry above the router, decoupled from the page that opened it — a materially bigger architecture change the original spec aspired to but never built either, and the founder's 4-point ruling only describes the in-page lifecycle (she stays on `/family-members` or `/settings` throughout). Flagging honestly rather than silently claiming more than was built.

### Proof

- `npx tsc -b` — clean. `npx eslint` on all 8 touched files — 0 errors.
- **`member-settings-hub.spec.ts` — 6/6 green** (the 5 existing tests re-verified unaffected, plus the new "minimize/restore/dismiss lifecycle" test): expand Login & Access → backdrop-click minimizes (hub text hidden, pill visible) → click the pill → hub reappears with Login & Access STILL expanded (the exact restore that was previously broken) and the pill gone → re-minimize → click the pill's own dismiss-x → pill gone AND hub gone for real (proven by reopening fresh and finding Login & Access back to its default collapsed state — no leftover mounted instance) → click the real X → fully done, no pill at all.
- **Convention #277 tour — 1 new test, 3 screenshots, all read.** The "restored" screenshot is **pixel-identical** to the "before minimize" screenshot (same scroll position, same expanded section) — visual confirmation the state genuinely survived, not just an assertion. The "minimized" screenshot confirms the Family Members page underneath is fully interactive (no backdrop, no dimming) with only the pill floating near the bottom; the pill's screen position in the full-page-stitched capture is a known, pre-existing `fullPage:true`-vs-`position:fixed` screenshot artifact (the pill is genuinely fixed bottom-center at normal viewport size — this artifact would affect any fixed element in any of this suite's full-page shots, not something this fix introduced).
- **Regression sample — 16/16 + 15/16, the 1 failure confirmed pre-existing.** Ran `mom-creates-routines-and-tasks.spec.ts` (TaskCreationModal-heavy) — 16/16 green. Ran `calendar-penciled-in.spec.ts` (EventCreationModal-heavy) — 15/16 green; the 1 failure (`QueueCard shows Calendar icon for calendar-destination items`, a QuickTasks-strip scroll-arrow intercepting an inbox-button click) was re-run against a `git stash` of this exact fix and reproduced IDENTICALLY on unmodified `main` — confirmed pre-existing and unrelated (nothing to do with `ModalV2`, `TaskCreationModal`, or `EventCreationModal`). A full sweep of all 20 files referencing the other 5 consumers was not run (would be a large, unauthorized shared-suite run beyond what this diagnose-and-fix task asked for); this sample specifically targeted the two consumers most likely to reveal a regression (the ones actually wiring `hasUnsavedChanges`, exercising the parts of `ModalV2` this fix touched most).
- Zero fixture residue — `git status --porcelain` after every run showed only the 8 intended files.

### Files touched (Round 3)

- `src/contexts/ModalManagerContext.tsx` (modified — `dismiss`/`dismissedSignal`)
- `src/components/shared/ModalV2.tsx` (modified — the core restore fix + `closeButtonBehavior`)
- `src/components/shared/MinimizedPill.tsx` (modified — visible dismiss-x, `onDismiss` prop rename)
- `src/components/shared/MinimizedPillBar.tsx` (modified — wires `dismiss` instead of `close`)
- `src/components/shared/ModalBackdrop.tsx` (modified — `data-testid` only)
- `src/components/family/MemberSettingsHub.tsx` (modified — `closeButtonBehavior="close"`)
- `tests/e2e/features/member-settings-hub.spec.ts` (modified — new pill-lifecycle test)
- `tests/e2e/features/member-settings-hub-eyes-on-tour.spec.ts` (modified — new pill-lifecycle tour test)
- this build file

## Mom-UI Surfaces

- Family Management member rows on `/family-members` (clickable name/row) — shell: mom only, modification.
- Family Management roster preview on `/settings` (clickable name/row) — shell: mom only, modification. **The founder's original complaint target.**
- Member Settings Hub (9-section accordion modal) — shell: mom only, new; now reachable from both surfaces above.

## Mom-UI Verification

*(Convention #277 — Claude ran the tour and READ all 11 screenshots across both rounds. All green.)*

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Family Members list — clickable rows | ✅ chevron affordance visible, all 7 rows correctly styled with member colors, icon buttons intact | ✅ same layout, fully readable at 768px | ✅ chevron hidden (by design, `hidden sm:block`), rows still fully tappable, icon buttons fit without wrapping | Mom | `member-settings-hub-{vp}-0-list.png` (all 3 read) | 2026-09-07 |
| Hub — Profile section (default open) | ✅ gradient header "Casey's Settings", header strip (avatar+name+role), Name/Dashboard-Style/Birthday/Age-bracket/Color grid/Save all render correctly, "View as Casey" footer visible | ✅ full-width modal, all fields readable, no clipping | ✅ 2-col Name/Dashboard-Style fields still fit at 375px, color grid wraps to 4 rows cleanly, footer button reachable | Mom | `member-settings-hub-{vp}-1-profile-open.png` (all 3 read) | 2026-09-07 |
| Hub — Login & Access + Safety Monitoring expanded (multi-expand) | ✅ 4 launch rows (Set PIN/Picture/Login/Invite) + Safety Monitoring's Monitored toggle (ON, matches DB), Sensitivity link, Flag History link — confirms "expanding one section doesn't collapse others" | ✅ same, fully readable | ✅ same, all rows/toggle fit at 375px without overflow | Mom | `member-settings-hub-{vp}-2-more-sections.png` (all 3 read) | 2026-09-07 |
| **Settings → Family Management roster, expanded** (round 2, founder gap-check) | ✅ every non-mom row (Mark, Amy, Kylie, Alex, Casey, Jordan, Ruthie) shows a chevron and reads as tappable; Sarah's own row correctly has NO chevron; Casey's row shows "Member · visual_password" (auth_method label renders correctly); "Manage Members & PINs" nav link still present below, untouched | — (not toured; desktop-only shot per the founder's ask) | — | Mom | `member-settings-hub-desktop-3-settings-entry-list.png` (read) | 2026-09-07 |
| **Hub opened from the Settings entry** (round 2) | ✅ identical "Casey's Settings" hub renders as an overlay directly on `/settings`, dimmed Family Management roster visible behind the modal backdrop — pixel-for-pixel the same component as the `/family-members` entry, confirming zero fork | — | — | Mom | `member-settings-hub-desktop-4-settings-entry-open.png` (read) | 2026-09-07 |
| **Round 3 — hub before minimize** (Login & Access expanded, header shows both — and X buttons) | ✅ | — | — | Mom | `member-settings-hub-desktop-5-pill-1-before-minimize.png` (read) | 2026-09-07 |
| **Round 3 — minimized, pill floating, page underneath fully interactive** | ✅ backdrop gone, Family Members roster fully clickable, pill visible with its own restore body + dismiss-x (pill's screen position is a known `fullPage`-vs-`fixed` capture artifact, not a real defect — see Round 3 proof notes) | — | — | Mom | `member-settings-hub-desktop-5-pill-2-minimized-with-pill.png` (read) | 2026-09-07 |
| **Round 3 — restored via pill click** | ✅ **pixel-identical** to the before-minimize shot — same scroll position, Login & Access still expanded — visual proof the restore genuinely works now | — | — | Mom | `member-settings-hub-desktop-5-pill-3-restored.png` (read) | 2026-09-07 |

## Post-Build Verification

| Requirement | Status | Evidence |
|---|---|---|
| Member row click opens person-first hub (/family-members) | **Wired** | `member-settings-hub.spec.ts` test 2 green live |
| **Settings → Family Management roster row opens the SAME hub (founder gap-check)** | **Wired** | `member-settings-hub.spec.ts` test 4 green live; `SettingsPage.tsx` mounts the identical `MemberSettingsHub` + `useMemberSaveAndConsentGate`, no fork |
| **Shared save/consent-gate hook (one implementation, two callers)** | **Wired** | `src/hooks/useMemberSaveAndConsentGate.tsx`; `FamilyMembers.tsx` refactored to consume it too (not just `SettingsPage.tsx`) |
| Mom's own row on Settings roster stays non-interactive | **Wired (by design)** | `isMom` branch renders a plain div, not a button; DB-asserted zero `settings-member-hub-open-{sarahId}` matches in test 4 |
| Existing "Manage Members & PINs" surfaces unchanged | **Wired** | `MemberRow`'s icon buttons + inline pencil edit untouched, only extraction |
| Profile section (extracted, one save path) | **Wired** | `MemberProfileEditor.tsx`; used by both `MemberRow` and the hub |
| Login & Access (Pin/Picture/SetLogin/Invite) | **Wired** | `MemberLoginModals.tsx`, mounted as hub children |
| Permissions & Features (summary + deep link) | **Wired** | `PermissionsSummarySection`; deep-links to the real `/permissions` (no re-implementation) |
| Allowance & Finances (kid-only, real editor) | **Wired** | `ChildAllowanceConfigInner`; DB-asserted in `member-settings-hub.spec.ts` test 3 |
| Gamification & Rewards | **Wired** | Launches the existing `GamificationSettingsModal` |
| Homework / Homeschool | **Stubbed (by design — no editor exists anywhere in the app)** | Read-only note, no write path invented, per the dispatch's own hard rule |
| Safety Monitoring (kid + dad, sensitivity modal) | **Wired** | `MemberSafetySection`, same hooks as `SafetyMonitoringSettingsSection` |
| Privacy & Consent (kid-only, COPPA) | **Wired** | `MemberPrivacyConsentCard`, extracted from `PrivacyConsentPage.tsx` |
| Theme & Appearance | **Stubbed (by design — owner-set-only, no write path invented)** | Read-only note |
| View As launches from the hub, exits back cleanly | **Wired (real bug found + fixed live)** | Originally broken (View-As from a mom-only page → MomOnlyRoute self-blocks, see the dedicated finding section above); fixed to navigate to `/dashboard` first; `member-settings-hub.spec.ts`'s View-As test green live |
| Mom-only enforcement unchanged | **Wired** | `member-settings-hub.spec.ts` test 1 green live; hub only ever mounts inside the existing `<MomOnlyRoute>` page |
| Section-visibility pure logic + vitest | **Wired** | `memberSettingsHubSections.ts` + 4/4 vitest |
| Convention #14 (LiLa knowledge) | **Wired** | registry + help-pattern + page-knowledge + use-case-recipe entries |
| Convention #277 eyes-on tour | **Done — 5/5 across all 3 rounds, 14/14 screenshots read, zero defects** | Mom-UI table above |
| Regression: family-auth-two-door + pin-relock-stickiness | **12/13 green (1 pre-existing flake, round 1)** | See "Live proof — Round 1" section above |
| No new migration | **Confirmed N/A** | Zero schema changes — pure UI/navigation layer, all 3 rounds |
| **Round 3: pill-click-restore actually works (was a confirmed dead, platform-wide gap)** | **Wired** | `ModalV2.tsx`/`ModalManagerContext.tsx` fix; `member-settings-hub.spec.ts`'s pill-lifecycle test green live; visually confirmed pixel-identical before/after in the tour |
| **Round 3: X = full close, no pill (hub-scoped, per founder ruling)** | **Wired** | `closeButtonBehavior="close"`, opt-in prop, zero change to the other 5 persistent-modal consumers (confirmed via blast-radius grep) |
| **Round 3: pill's own small dismiss-x** | **Wired** | `MinimizedPill.tsx`; discards for good (tells the still-mounted modal to truly close), not just cosmetic |
| Rounds 1–2: committed to `main` | **Done** | `618f041` (feature) + `5a932eb` (state close-out) |
| Round 3: commit + push | **Not done** | Holding for referee pass + founder confirm |
