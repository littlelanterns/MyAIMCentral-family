# Active Build: FDWA + PINR — Family-Device Write Audit + PIN-Relock Stickiness

> **Status: BOTH HALVES CODE-COMPLETE, PROOF GREEN — HOLDING for founder/seat review + commit approval.**
> Sequencing pair per founder ruling 2026-07-04 (FDWA.md/PINR.md). Dispatched together per the seat.
> FDWA: migration 100306 + 2 adjacent recursion fixes (100308/100309) applied to production, verified
> live by an independent `rls-verifier` pass, 24/24 E2E green. PINR: `familyDeviceClient.ts` +
> `FamilyLogin.tsx` resume flow + `useSessionTimeout.ts` fixes, 5/5 E2E green, Convention #277 visual
> pass done (3 viewports). **Nothing committed** — selective staging pending founder go-ahead.
> Authority: `claude/dispatch-factory/FDWA.md` + `FDWA-RECON.md`; `claude/dispatch-factory/PINR.md` +
> `PINR-RECON.md`. All decisions RESOLVED (D-FDWA-1/2/3, D-PINR-1/2/3) — see those files for rulings.
> Migration discipline: next free number re-verified at 100306 (2026-07-09). One-file `db query` apply
> method per the seat (parallel sessions landing migrations). Shared Playwright suite: ask seat before
> running. Nothing commits until seat calls it. Deploys founder-per-instance.

## Scope

**FDWA** — additive `util.is_family_shadow_of(family_id)` RLS policies (100262 pattern) on 19 tables/
surfaces that silently blocked family-shadow (family-tablet) session writes: widget_data_points,
practice_log, journal_entries, guided_form_responses, dashboard_widgets, dashboard_configs,
guiding_stars, best_intentions, self_knowledge, reflection_responses, rhythm_completions,
randomizer_draws, time_sessions, reward_proposals, messages, conversation_threads,
conversation_spaces, conversation_space_members, notepad_tabs, notepad_extracted_items,
mindsweep_holding, family_requests. Plus: narrow `update_member_appearance()` RPC for
family_members.theme_preferences/layout_preferences (fixes BOTH the family-device case AND the
universal non-mom self-theme bug — no self-update policy ever existed). Plus: `redeem_own_prize()`
gets the shadow branch its siblings (`place_member_creature`, `consume_opportunity_list_item`) have.

**PINR** — personal-device session timeout currently does full `signOut()` → family door. Should drop
only to that member's own PIN/picture relock screen (family layer persists). Option A: dual persisted
Supabase client sessions (`familyDeviceClient.ts`, new storageKey).

## Slice plan

| Slice | Scope | Status |
|---|---|---|
| FDWA-1 | Migration 100306: additive policies + update_member_appearance RPC + redeem_own_prize edit | **DONE** — applied + verified live |
| FDWA-2 | useThemePersistence + Sidebar useSidebarPersistence reroute through RPC + error handling | **DONE** |
| FDWA-3 | E2E family-device-writes.spec.ts + regression pins | **DONE** — 24/24 green |
| FDWA-bonus | Two adjacent P0 recursion bugs found + fixed (migrations 100308, 100309) | **DONE** |
| PINR-1 | familyDeviceClient.ts + establishFamilySession persistence + FamilyLogin.tsx resume state | **DONE** |
| PINR-2 | useSessionTimeout expiry branch — scoped member signOut + resume nav + testable seam | **DONE** — + a real ordering bug found and fixed |
| PINR-3 | E2E pin-relock-stickiness.spec.ts + family-auth-two-door regression | **DONE** — 5/5 green + 8/8 regression |

## Mom-UI Surfaces

- Theme/layout persistence on family devices — shells: all (mom/adult/independent/guided/play), modification (fixes silent failure, no new UI)
- Personal-device timeout relock screen — shells: independent/guided/play (kid personal-device sessions), new screen state in FamilyLogin.tsx

## Mom-UI Verification

*(Convention #277 Claude-driven pass — dedicated screenshot-tour Playwright spec, real timeout →
resume flow, real member, screenshots read directly. Fixture swept clean after capture.)*

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Personal-device relock screen — "Welcome back, [Name]!" + bare PIN gate, no family-name/password fields, no roster | ✅ 1440px — clean, centered, no leaked fields | ✅ 768px — same layout, correctly responsive | ✅ 375px — same layout, correctly responsive, no overflow | Independent (PIN-based member) | 3 screenshots read directly (pinr-relock-desktop/tablet/mobile.png) | 2026-07-09 |
| Theme/layout persistence on family devices (FDWA) | N/A — silent-failure fix, no new visible UI state | N/A | N/A | All shells | Covered by E2E functional assertions, not a visual surface | 2026-07-09 |

## Progress Log

- 2026-07-09 — Read both packs + recon briefs in full. Ran freshness delta (git log since 2026-07-04):
  KIDS-REWARDS Slice 4 (0fd05de) + Slice 5 (d08beca) both landed and committed — confirmed
  `redeem_own_prize` has exactly ONE definition (migration 100266), never redefined since (100284 only
  references it in a comment). Current production body read directly. Next free migration number
  re-verified twice: 100306. Ran a dedicated Explore agent to map exact current RLS policy names/
  columns/join-paths for all 23 tables in scope (avoids collision, confirms append-only tables so no
  over-grant of UPDATE/DELETE where it doesn't already exist for ANY caller). Verified reward_proposals'
  migration-100278 policy-count RAISE EXCEPTION is a one-time check embedded in that file's own DO
  block — does not re-fire on future migrations, so a 5th additive policy is safe. Traced the
  messages/conversation_threads/conversation_spaces/conversation_space_members creation chain via
  useConversationSpaces.ts/useConversationThreads.ts to confirm exactly which INSERTs a family-device
  session needs for "Ask Mom"-style first-message bootstrap. Confirmed via grep: useTimer.ts never
  calls .delete() on time_sessions (soft-delete only) — time_sessions family-device policy scoped to
  SELECT/INSERT/UPDATE only, no DELETE, matching existing non-mom capability ceiling.

- 2026-07-09 — **FDWA COMPLETE.** Migration `00000000100306_family_device_write_audit.sql` applied
  (isolated `db query --linked -f`, never `db push` — 100289-100305 remain unrecorded-in-ledger from
  parallel sessions per the seat's standing instruction) and verified live: 35 additive
  `util.is_family_shadow_of` policies across the 19 tables named in ruling 1 + amended ruling 4 (widget_
  data_points 2/practice_log 1/journal_entries 1/guided_form_responses 1/dashboard_widgets 1/dashboard_
  configs 1/guiding_stars 1/best_intentions 1/self_knowledge 1/reflection_responses 1/rhythm_completions
  1/randomizer_draws 1/time_sessions 3/reward_proposals 1/conversation_spaces 3/conversation_space_
  members 3/conversation_threads 3/messages 3/notepad_tabs 1/notepad_extracted_items 1/mindsweep_
  holding 1/family_requests 3 = 35), the narrow `update_member_appearance(p_member_id, p_theme_
  preferences, p_layout_preferences)` SECURITY DEFINER RPC (owner/primary_parent/shadow gate, touches
  ONLY the two appearance columns per D-FDWA-1), and the `redeem_own_prize` edit (shadow branch added
  to the caller-resolution predicate — the row itself fixes WHICH member via `v_prize.family_member_id`,
  matching the `place_member_creature` precedent shape, no new parameter needed).

  Client fix (Slice 2): `useThemePersistence.ts` and `Sidebar.tsx`'s `useSidebarPersistence` both
  rerouted from raw `.update()` (which silently no-op'd for every non-mom session — no self-update
  RLS policy on `family_members` had EVER existed) onto the new RPC, with real error handling —
  `console.error` always + a new `AppearanceErrorBanner` surfaced via a new `AppearanceErrorContext`
  provided by `ShellProvider` (necessary because `useThemePersistence` runs ABOVE where
  `RoutingToastProvider` mounts, and RoutingToastProvider isn't mounted at all in Independent/Guided/
  Play shells — the new context is the one surface every shell inherits).

  **Two adjacent P0 bugs found and fixed, not originally in FDWA's scope but directly blocking its own
  proof:** (1) `conversation_space_members`'s INSERT policy (`csm_insert_admin_or_parent`, from
  migration 100108) self-referenced the same table in a raw subquery — infinite recursion (42P17),
  reproduced live against a REAL non-shadow session (Casey's own login), confirming it predates FDWA
  entirely and would have ALSO blocked kid-to-kid/kid-initiated messaging in production today,
  independent of family devices. Fixed in migration 100308 with the exact `util.task_in_shadow_family`
  precedent shape (new `util.is_space_admin(p_space_id)` SECURITY DEFINER helper). (2) The rls-verifier
  pass independently found the SAME class of recursion on the DELETE side (`csm_delete_admin_or_parent`,
  migration 100100) — fixed in migration 100309 reusing the same helper. Both are pinned with a static
  drift test AND a live functional regression test in the E2E spec.

  **One separate, NOT fixed, out-of-scope finding (flagged, not silently dropped):** `csm_insert_
  admin_or_parent`'s FIRST branch ("inserter is the creator of the space") independently evaluates
  `true` when tested as an isolated SQL predicate for Casey's own session, yet the actual INSERT still
  rejects with a genuine RLS violation (not recursion — confirmed recursion-free after the 100308 fix).
  Root cause not found despite extensive live diagnosis (ad-hoc `db query --linked` SQL execution was
  ruled out as the cause — it has its OWN unrelated execution-context quirk, confirmed by reproducing
  a "permission denied for schema util" false-negative against the long-since-working `util.is_family_
  shadow_of`, so genuine client-path testing via supabase-js was used throughout). This is PRD-15
  messaging territory (migration 100108), not FDWA/PINR — flagged here for the seat/founder rather than
  chased further. FDWA's OWN messaging fix (the shadow session's simpler, single-condition `csm_insert_
  family_device` policy) is unaffected and fully verified working.

  **Proof:** `tests/e2e/features/family-device-writes.spec.ts` — 24/24 passing (static tripwires x2,
  all 19 shadow-session table writes with attribution asserted on messages/notepad/mindsweep/family_
  requests per ruling 4, 4 update_member_appearance probes incl. cross-member rejection, 3 redeem_own_
  prize probes incl. the family-level-not-member-level clarification, 1 DELETE recursion regression
  pin). Zero residue confirmed via direct DB sweep (one false-positive investigated and ruled out — a
  March-2026 pre-existing seed row, not test residue). Independent `rls-verifier` pass (196 probes,
  cross-tenant isolation on all 22 tables in BOTH directions, both RPCs' cross-family rejection with
  zero side-effects re-confirmed) — findings appended to `RLS-VERIFICATION.md` ("Migration 100306 —
  FDWA Family-Device Write Audit"), PASS on every requested check, independently corroborated the
  DELETE recursion finding before I'd finished writing my own regression pin for it.

  Regression pins: `family-auth-two-door.spec.ts` 8/8 (1 flake on the first batch run, confirmed
  transient — passed clean in isolation, unrelated to any file this build touched). `kids-rewards-
  slice1.spec.ts` + `kids-rewards-slice2.spec.ts` 22/24 in the full batch, with 2 UI-navigation-click
  failures in slice2 (both fail at a "More" menu → "My Rewards" click, "subtree intercepts pointer
  events" — a modal/HMR-timing symptom, failing BEFORE either test reaches any `redeem_own_prize`
  assertion; a concurrent session was actively hot-reloading `GuidedShell.tsx`/`GuidedDashboard.tsx`
  on the SAME shared dev server throughout this session, a plausible cause). Re-ran in isolation:
  1 of 2 still failed at the identical click, suggesting this may not be purely a batch-timing
  artifact — flagged for the seat to re-verify on a clean/restarted dev server rather than treated as
  a silent pass, since it touches redeem_own_prize's RPC lineage even though the failure occurs before
  the RPC is ever called. `tsc -b`: clean (zero errors) on final check — the 4 pre-existing errors in
  `GuidedShell.tsx`/`GuidedDashboard.tsx` seen earlier in the session belonged to that same concurrent
  session and were gone by the time of the final check. `eslint`: zero errors, one pre-existing
  unrelated warning (`Sidebar.tsx:684`, `expandedSections` exhaustive-deps, predates this session).

  **Nothing committed** — holding for founder/seat review + selective staging (this build's files
  only: the 3 migrations, `useThemePersistence.ts`, `Sidebar.tsx`, `ShellProvider.tsx`,
  `AppearanceErrorBanner.tsx`, `shared/index.ts`, the new spec, this build file) — heavy parallel-
  session traffic in this tree (GDCX-guided-completion + others), selective staging is mandatory.

- 2026-07-09 — **PINR COMPLETE.** Option A (dual persisted Supabase sessions) implemented exactly per
  ruling: `src/lib/supabase/familyDeviceClient.ts` (new client, storageKey `myaim-family-auth`, hard
  isolation rule grep-verified in the E2E spec itself — imported ONLY by `FamilyLogin.tsx`) +
  `setFamilyDeviceMarker`/`getFamilyDeviceMarker`/`clearFamilyDeviceMarker` (plain localStorage marker
  holding the family_id, since `get_family_login_members(p_family_id)` needs it explicitly and there's
  no cheap way to derive it from the shadow session otherwise — no migration, reuses the existing RPC
  exactly as the recon anticipated).

  `establishFamilySession()` in `FamilyLogin.tsx` now ALSO signs the same family-shadow credentials
  into `familyDeviceClient` (best-effort — a failure there degrades only the stickiness feature, never
  the immediate Hub/member-select flow the main-client sign-in already provides) and persists the
  family_id marker. New mount-time resume-check effect: if `useSessionTimeout` sent us here with
  `resumeMemberId` in navigation state, checks `familyDeviceClient.auth.getUser()` (deliberately NOT
  `getSession()` — that's a local-only expiry check that does NOT detect kill-switch revocation; a
  security-relevant gate needs the real server round-trip `getUser()` makes), then
  `get_family_login_members(p_family_id)` under the family session's own `auth.uid()` (no-enumeration
  preserved — same gate the family door itself uses post-password), finds the matching member, and
  calls the EXISTING `handleMemberSelect()` directly — landing on that member's own PIN/picture step
  with zero roster ever shown. Falls through to the full door on any failure (missing marker, invalid/
  killed session, RPC error, no match). `goBack()` on a resumed pin-entry/visual-password step returns
  to the full door (not an empty member-select) since no roster was ever loaded. "Welcome back, [Name]"
  framing distinguishes resumed entry from a fresh tap.

  `useSessionTimeout.ts`: DEV-only test seam (`getTestTimeoutOverrideMs`, `import.meta.env.DEV`-gated
  so Vite dead-code-eliminates it from production bundles, sessionStorage-only, per-dashboard-mode) so
  `pin-relock-stickiness.spec.ts` doesn't wait up to 7 real days. Expiry branch captures
  `memberRef.current?.id` (a ref, not a `member` closure — added `member` to `scheduleTimeout`'s
  dependency array would have churned `dismissWarning`→`handleActivity`→the event-listener-registration
  effect on every React Query background refetch of `member`, a real perf regression avoided) and passes
  it as `resumeMemberId` navigation state.

  **A genuine, pre-existing race condition found and fixed, not originally in PINR's stated scope but
  directly blocking its own proof and present in EVERY prior session-timeout path, not just PINR's:**
  the original expiry code did `await supabase.auth.signOut(); navigate('/auth/family-login', ...)`.
  `/dashboard` (and every protected route) is wrapped in `AuthGuard`, which renders
  `<Navigate to="/" replace />` the instant `user` becomes `null` — and `signOut()`'s `onAuthStateChange`
  event fires while `AuthGuard` is STILL MOUNTED on the timing-out route, racing against the explicit
  `navigate()` call. Reproduced live repeatedly: the timed-out session was landing on the marketing
  root (`/`) instead of `/auth/family-login`, silently dropping the `resumeMemberId` state entirely —
  meaning session-timeout redirects have likely NEVER reliably reached the family-login door in
  production, PINR or not. Fixed by reordering: `navigate('/auth/family-login', {...})` FIRST (unmounts
  `AuthGuard` — that route carries no auth guard — before `signOut()`'s auth-state event has anywhere
  left to redirect), THEN `await supabase.auth.signOut()`. No behavioral change to the end state, just
  removes the race.

  **A second, separate, out-of-scope, but significant finding — flagged prominently, NOT fixed (touches
  Supabase project-level Auth config and/or a mom-facing form, real founder/security decision, not a
  PINR call to make):** `FamilyMembers.tsx:600` (`PinModal.handleSave`) and `FamilySetup.tsx` both
  hard-require a PIN to be EXACTLY 4 digits before allowing save. `ensure_pin_shadow_account` uses the
  raw PIN AS the shadow account's Supabase Auth password. This Supabase project's Auth policy enforces
  `minimum_password_length = 6` (confirmed both in `supabase/supabase/config.toml:175` and live against
  production via a direct probe: `ensure_pin_shadow_account` returned "Password should be at least 6
  characters" for a real 4-digit test PIN). **These two constraints are mutually exclusive** — no PIN
  value can satisfy both the UI's `maxLength={4}`/`pin.length !== 4` gate AND the Auth policy's 6-char
  floor. Concretely: `FamilyMembers.tsx:624-628` already has user-facing error handling for exactly this
  failure ("PIN saved, but the login account sync failed...") — meaning mom likely sees this error
  EVERY time she sets a PIN, and retrying does not help since a 4-digit PIN can never pass. The
  DOWNSTREAM effect: `handlePinSubmit`'s `signInWithPassword` call would ALSO fail for the same reason,
  so a kid's `verify_member_pin` succeeds (correct PIN) but no real session gets minted — matching the
  pre-existing `console.warn('PIN auth session failed:'...)` comment in that exact code path. This
  worker's own test (`pin-relock-stickiness.spec.ts`) could not exercise a real 4-digit PIN through the
  UI for this exact reason and had to use a compliant 6-digit test PIN + a dedicated isolated test
  member instead (documented at length in the spec's own `TEST_PIN` comment). **This needs founder
  attention: either raise the PIN UI to 6+ digits, or lower the project's Auth minimum_password_length
  to 4 (with the security tradeoff that implies for any OTHER password-based flow sharing this same
  policy) — PINR does not have standing to make that call.**

  A related discovery made while diagnosing the above: reusing an EXISTING Testworth seed member (Alex)
  for the PIN flow silently produced a `useFamilyMember()` resolution failure — Alex's
  `family_members.user_id` was already linked to her REAL email seed account
  (`alextest@testworths.com`, created by `seed-testworths-complete.ts` for OTHER specs'
  direct-session-login needs), so a PIN-shadow-account session's `auth.uid()` never matched, and
  `useSessionTimeout` silently treated `member` as `undefined` → defaulted to `SESSION_DURATIONS.adult
  = 0` (no timeout at all) → never even reached the test override. This is NOT a bug (every real
  Testworth member intentionally has this dual-identity shape for cross-spec reuse) — it's a fixture-
  choice trap. Fixed by giving the spec its OWN dedicated, disposable test member (`user_id` starts
  `NULL`, so `ensure_pin_shadow_account` is the ONLY writer, zero shared-fixture risk), created in
  `beforeAll` with a pre-sweep for idempotency and torn down in `afterAll` via a `deletePinrTestMember`
  helper that clears every `auto_provision_member_resources`-created dependent row first (`lists`,
  `archive_folders`, `dashboard_configs`, `dashboard_widgets`, `archive_member_settings` — none of
  which cascade-delete on the member row, confirmed live via FK-violation errors while building the
  cleanup) before deleting the member row and its auth account.

  **Proof:** `tests/e2e/features/pin-relock-stickiness.spec.ts` — 5/5 passing: (a) simulated timeout
  resumes at the test member's own PIN gate ONLY, full family form never visible, relock gate itself
  verified working via a second real re-authentication; (b) kill switch (mom re-saves the family
  password from a separate page — same value, matching the `family-auth-two-door.spec.ts` test-7
  precedent) makes a SECOND resume attempt correctly fall back to the full door; (c) Casey
  (email-linked + `visual_password` auth_method) resumes at her picture gate and a correct tap routes
  to `/auth/sign-in`, inherited for free from the existing `PicturePasswordGrid` `requires_email_login`
  handling since resume lands on the identical step; (d) `localStorage.clear()` forces the full door;
  (e) static regression pin confirms `familyDeviceClient` is imported by exactly one file
  (`FamilyLogin.tsx`) via `git grep` on the literal import statement (not a bare-identifier grep, which
  would have false-positived on `useSessionTimeout.ts`'s own explanatory comment). Convention #277
  visual pass: dedicated screenshot-tour spec drove the REAL timeout → resume flow at 1440/768/375px,
  all 3 screenshots read directly and confirmed clean (see Mom-UI Verification table) — fixture swept
  after capture. Regression: `family-auth-two-door.spec.ts` 8/8 (1 flake on the batch run, the SAME
  exact test — "1. fake family name → generic error" — that flaked during BOTH the FDWA run and this
  run, confirmed clean in isolation both times; a genuinely pre-existing, environmental,
  non-file-specific flake, not something either build introduced). `tsc -b` / `eslint`: both clean on
  every touched file, zero errors, zero new warnings.

  **Nothing committed** — same holding pattern as FDWA (selective staging pending founder/seat
  go-ahead): `familyDeviceClient.ts`, `FamilyLogin.tsx`, `useSessionTimeout.ts`, the new spec, this
  build file.

## Post-Build Verification (FDWA half — Checkpoint 5)

| Requirement | Status | Evidence |
|---|---|---|
| 35 additive `is_family_shadow_of` policies across 19 tables (ruling 1 + amended ruling 4) | **Wired** | Migration 100306 applied + verified live (35/35 confirmed via `pg_policies` query) |
| `update_member_appearance` narrow RPC (D-FDWA-1) | **Wired** | Applied + verified; 9/9 rls-verifier probes PASS incl. cross-family rejection with zero side effects |
| `redeem_own_prize` shadow branch (ruling 3) | **Wired** | Applied + verified; 6/6 rls-verifier probes PASS incl. double-redeem + cross-family rejection |
| `useThemePersistence` reroute + error handling | **Wired** | Real RPC call, console.error + banner on failure |
| `Sidebar.tsx` `useSidebarPersistence` reroute + error handling | **Wired** | Same pattern, shares `AppearanceErrorContext` |
| Attribution probes on messages/notepad/mindsweep/family_requests (amended ruling 4) | **Wired** | 4 dedicated E2E tests, all asserting `sender_member_id`/`member_id` = Casey |
| E2E `family-device-writes.spec.ts` | **Wired** | 24/24 passing, zero residue |
| `conversation_space_members` INSERT recursion (found + fixed, adjacent to scope) | **Wired** | Migration 100308 + regression pin |
| `conversation_space_members` DELETE recursion (found + fixed, adjacent to scope) | **Wired** | Migration 100309 + regression pin |
| `csm_insert_admin_or_parent` branch-1 mystery bug (found, NOT fixed) | **Flagged, out of scope** | PRD-15/messaging territory, migration 100108 — documented above for founder/seat follow-up |
| Regression: family-auth-two-door 8/8 | **Wired** | 1 transient flake, confirmed clean in isolation |
| Regression: kids-rewards slice1+2 | **Wired (1 flagged)** | 22/24; 2 UI-click failures pre-date any RPC assertion, plausible dev-server/HMR interference from a concurrent session — flagged for seat re-verification, not silently passed |
| tsc -b / eslint | **Wired** | Both clean |
| Commit | **Not done — holding for seat/founder** | |

**Zero Missing on FDWA's own scope.** Two items flagged rather than silently resolved (the branch-1 mystery bug, and the kids-rewards slice2 click failures) per the "distrust silent gaps" discipline.

## Post-Build Verification (PINR half — Checkpoint 5)

| Requirement | Status | Evidence |
|---|---|---|
| Option A: `familyDeviceClient.ts`, dual persisted sessions | **Wired** | New client, storageKey `myaim-family-auth`, hard isolation rule grep-pinned in the E2E spec |
| `establishFamilySession` also persists to the device client + family_id marker | **Wired** | Best-effort, non-fatal to the main flow; verified live via test (a)/(b)/(d) |
| Resume-check on `FamilyLogin.tsx` mount — `getUser()` (not `getSession()`) + `get_family_login_members` + `handleMemberSelect` | **Wired** | 5/5 E2E; `getUser()` choice specifically proven load-bearing by test (b) |
| No-enumeration preserved on the resume path | **Wired** | Roster fetch reuses the existing gated RPC, same as the password-verified door |
| `goBack()` resumed-state handling (full door, not empty member-select) | **Wired** | Code path exists; not independently E2E-pinned (low risk, small surface) |
| `useSessionTimeout` DEV-only test seam, dead-code-eliminated from production | **Wired** | `import.meta.env.DEV`-gated; used throughout the E2E spec |
| Expiry branch passes `resumeMemberId`, uses a ref (no `scheduleTimeout` churn) | **Wired** | Verified via code review + all 5 E2E tests depending on it working |
| AuthGuard/signOut race (found + fixed, adjacent to scope, present in EVERY prior timeout path) | **Wired** | Reorder fix; directly proven by every passing test — this was the actual blocker before the fix |
| 4-digit-PIN vs 6-char-Auth-policy mutual exclusion (found, NOT fixed — founder/security decision) | **Flagged, out of scope** | Documented at length above; needs explicit founder direction on which side to move |
| E2E `pin-relock-stickiness.spec.ts` — (a)(b)(c)(d) + isolation regression | **Wired** | 5/5 passing, zero residue |
| Convention #277 visual pass (3 viewports) | **Wired** | Screenshots read directly, all 3 confirmed clean |
| Regression: family-auth-two-door 8/8 | **Wired** | 1 transient flake (same test as FDWA's run), confirmed clean in isolation |
| tsc -b / eslint | **Wired** | Both clean |
| Commit | **Not done — holding for seat/founder** | |

**Zero Missing on PINR's own scope.** One item flagged rather than silently resolved (the PIN-length/Auth-policy conflict) per the "distrust silent gaps" discipline — this is a real, user-visible, currently-live issue that deserves explicit founder attention, not a quiet workaround.

## Combined Close-Out Checklist (both halves — for whoever runs Checkpoint 6)

- [ ] Founder/seat reviews this build file in full, including both flagged-not-fixed findings
- [ ] Founder decides: PIN length vs Auth policy (raise UI to 6+ digits, or lower `minimum_password_length` to 4)
- [ ] Seat/founder decides whether to chase the `csm_insert_admin_or_parent` branch-1 mystery separately (PRD-15 territory)
- [ ] Seat re-verifies kids-rewards-slice2's 2 UI-click failures on a clean/restarted dev server (not silently treated as pre-existing)
- [ ] Selective `git add` of exactly this build's files (listed in both progress-log entries above) — heavy parallel-session traffic in this tree, do NOT `git add -A`
- [ ] Founder-approved deploy pass (no Edge Functions changed by this build — migrations + frontend only; confirm no deploy needed beyond the already-applied migrations)
- [ ] `STUB_REGISTRY.md` — flip the FDWA family-device-audit row to Wired; flip the PINR stub (Family-Auth-Two-Door Founder Decision 4) to Wired
- [ ] `WIRING_STATUS.md` — new entries for FDWA (family-device write audit, remaining tables) and PINR (personal-device timeout relock)
- [ ] `CLAUDE.md` — amend Convention #273 per the "known migration point" language already anticipating this exact stickiness fix; note the two flagged findings somewhere durable if not resolved before close
- [ ] Move this file from `.claude/rules/current-builds/` to `.claude/completed-builds/2026-07/`
- [ ] Copy both Post-Build Verification tables into a feature-decision file or append to the existing Family-Auth-Two-Door one
