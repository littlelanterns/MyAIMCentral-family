# Family Auth - Two-Door Umbrella Model

## Status: ACTIVE — ALL 4 PHASES SHIPPED 2026-06-09, awaiting founder eyes-on verification (Checkpoint 5)

> Commits: c4e04a8 (Phase 1 leak closure) · 887be09 (Phase 2 family password) · 8778007 (password script) · d8adab1 (Phase 3 Family identity + choice screen) · 9af9718 (Phase 4 single-picture password). Migrations 100251-100254, 100256-100258 applied to production. family-auth-admin Edge Function deployed (--no-verify-jwt; config.toml entry added by parallel session in fb90095).
>
> Production-verified during build: anon roster calls 401; byte-identical login failures; Testworth + WarmthWisdomWork doors unlock (password Lanterns2026 both — founder changes hers via `npm run family:password`); Family identity session signs in + RLS resolves; picture grid 9 unmarked images, wrong tap counts down, correct tap mints session, email-linked members route to email sign-in (Casey test).
>
> Remaining before close-out: founder Mom-UI verification (table below), then Part B file updates + move to completed-builds. Phase 4 item needing real-device confirmation: picture session for a shadow/unlinked kid (all Testworth kids have test email accounts, so the full token path was verified only at the API level).

> PRD-01 / PRD-02 AMENDMENT. Closes a live production roster-enumeration hole and implements the founder-specified two-door umbrella login model. Founder decisions locked 2026-06-09 in chat; these override PRD-01/PRD-02 text where they conflict (conflicts noted below).

---

## Source Material Read

- PRD: prds/foundation/PRD-01-Auth-Family-Setup.md (full)
- PRD: prds/foundation/PRD-02-Permissions-Access-Control.md (full)
- Addenda: prds/addenda/PRD-31-Permission-Matrix-Addendum.md (full)
- Addenda: prds/addenda/PRD-Audit-Readiness-Addendum.md (full)
- Addenda: prds/addenda/PRD-Template-and-Audit-Updates.md (partial - documentation convention only)
- NOTE: NO PRD-01-specific or PRD-02-specific addendum exists in prds/addenda/ (directory searched).
- claude/live_schema.md: families, family_members, family_hub_configs, view_as_sessions sections.
- WIRING_STATUS.md: View-As Identity-Scope Architecture section.
- .claude/completed-builds/2026-06/view-as-identity-scope-architecture.md (the foundation this build sits on).
- Feature decision file: claude/feature-decisions/Family-Auth-Two-Door.md
- Source: src/pages/auth/FamilyLogin.tsx, src/components/hub/HubMemberAuthModal.tsx, src/components/hub/FamilyHub.tsx, src/pages/Hub.tsx, src/lib/supabase/auth.ts, src/components/ProtectedRoute.tsx, src/components/AuthGuard.tsx, src/hooks/useFamily.ts, src/hooks/useFamilyMember.ts, src/pages/FamilyMembers.tsx (PinModal).
- Migrations: 00000000000001_auth_family_setup.sql, 00000000000014_fix_family_members_rls_recursion.sql, 00000000100027_prd01_repair.sql, 00000000100070_fix_hash_member_pin_column.sql, 00000000100075_skip_auto_family_for_pin_accounts.sql, 00000000100086_hub_pin_rpcs.sql.
- Production verification queries run (see Schema Gaps).

---

## Security Findings Driving This Build (verified this session)

1. lookup_family_by_login_name and get_family_login_members are SECURITY DEFINER with ZERO auth checks (migration 00000000100027 lines 99-137; 00000000000001 lines 317-342). Any unauthenticated person can type a family name at /auth/family-login and harvest the full roster (names, avatars, auth_method, colors, dashboard_mode). LIVE IN PRODUCTION.
2. Visual passwords verified CLIENT-SIDE (FamilyLogin.tsx lines 171-202): the correct sequence is downloaded to the browser and compared in JS. No lockout, no session on success.
3. auth_method=none members (FamilyLogin.tsx lines 126-129) just navigate to /dashboard with no session - broken no-op.
4. PIN members get real Supabase sessions via shadow accounts member_id@pin.myaimcentral.app (FamilyLogin.tsx lines 228-243). Established precedent.
5. verify_member_pin (bcrypt, 5 tries then 15-min lockout, JSONB return) is solid and stays.
6. families has NO family password column. family_hub_configs.hub_pin is a kiosk-exit lock - separate concern, do NOT overload.

---
## Schema Gaps Found (production-verified 2026-06-09)

- families.family_password_hash: DOES NOT EXIST. No password column on families at all. Must be added.
- No family-password lockout columns. Must add family_password_failed_attempts + family_password_locked_until.
- 7 PIN shadow accounts exist in auth.users (email LIKE %@pin.myaimcentral.app).
- 9 family_members have pin_hash set; 7 are linked to a shadow account (user_id points at the @pin account); 2 have a PIN hash but NO shadow account (broken state - their PIN login cannot create a session).
- 0 members have auth_method visual_password; 0 have auth_method none (all 7 PIN members are auth_method=pin). So visual-password personal-device persistence is currently unexercised in prod.
- PIN-set flow (FamilyMembers.tsx PinModal lines 411-435) only calls hash_member_pin (writes pin_hash). It does NOT create the shadow auth account (TODO at line 428). So shadow-account creation is a pre-existing gap; the 7 that exist were created some other way.
- Testworth test family exists: id 1f6200a7-df82-4ac4-bce3-3edcafe66bc5, login name testworthfamily. Seed a generic family password here.
- /hub today is wrapped in ProtectedRouteNoShell -> AuthGuard, which REQUIRES an authenticated user. The hub resolves family identity via useFamily -> useFamilyMember -> useAuth (mom session). It does NOT work under any family/anonymous session today.
- family_members SELECT RLS (migration 00000000000014): own row (user_id=auth.uid()), family via parent (families.primary_parent_id=auth.uid()), and same-family via get_my_family_id() security-definer keyed on user_id=auth.uid(). A family session needs an identity that get_my_family_id can resolve.

---

## Founder Decisions (LAW for this build - locked 2026-06-09)

1. Two-door umbrella: each family = one mom account with two doors: mom email/password, and family login name + family password. Family password is a REAL password (min 8, letters+numbers), bcrypt-hashed in a new families column, same 5/15 lockout as PINs.
2. Combined verification, no enumeration: name lookup + password check is ONE step. Wrong name and wrong password return the same generic error. Roster RPC refuses to return names without a verified family password - enforced server-side.
3. Choice screen with two resting places: Hub tile + member name tiles. Hub -> family device, rests on /hub, members dip in via avatar+PIN (member_session View-As). Member name + PIN -> personal device, rests on their dashboard, persistently signed in (PIN shadow-account session). /hub entry pre-highlights Hub; both entries reach the same screen.
4. Two-layer stickiness: family layer persists on a device indefinitely - cleared ONLY by manual sign-out, app uninstall/reinstall (storage wipe), or mom changing the family password (remote kill switch). Member layer follows Convention #63 durations; member timeout falls back to the name-tile/PIN screen (personal device) or Hub (family device), NEVER to the family-password prompt.
5. Mom tile always requires HER auth (her PIN or email password). Family password alone never opens mom command center.
6. Family-password-only visibility = Hub surface only (calendar, victories, names, countdowns, family best intentions). Anything beyond requires a member gate.
7. Per-kid auth method is mom choice: PIN / picture password / none. None is acceptable post-family-door (fixes the broken no-PIN path).
8. Visual passwords move server-side with the same lockout pattern (fix the client-side hole in the same build).
9. Mom manages the family password in Settings - Family. Existing moms get a forced one-time set-your-family-password prompt at next email login. Family-login page locked until set. Seed a generic password for Testworth.
10. Email-invited members unchanged. Their email/password opens only their own dashboard.
11. Sequencing: roster-leak closure lands in the first commit; the umbrella/choice-screen/hub work builds on top in the same build.
12. (Ruled 2026-06-09, second session) Q1 = Option A APPROVED, with expanded intent: each family gets a first-class "Family" identity (shadow auth account + hidden family_members row). This is deliberate architecture, not just an RLS workaround — the Family identity gets ITS OWN permission set, and future hub configuration (mom adding widgets to the hub, hub theming, etc.) hangs off this identity rather than off mom's account. Hidden from all people-rosters, but real in the permission system.
13. (Ruled 2026-06-09, second session) VISUAL PASSWORD DESIGN CORRECTION: the founder never wanted a 4-picture SEQUENCE. The intended design is a SINGLE-PICTURE pick — each kid has one secret picture (their PIN equivalent); the login screen shows a small grid of pictures (their picture + decoys, shuffled) and the kid taps theirs. The existing sequence implementation in FamilyLogin.tsx + visual_password_config is WRONG per founder intent and is replaced, not preserved. Verification is server-side with the standard 5/15 lockout; the correct answer never reaches the browser. Because the picture IS the kid's PIN equivalent, single-picture members get the same shadow-session personal-device persistence as PIN members (resolves Q5 = full treatment now, with the corrected design).

---
## Build Scope (Phased)

### Phase 1 - Leak closure (FIRST COMMIT, ships independently)
- Gate lookup_family_by_login_name and get_family_login_members so neither returns roster data to an unauthenticated caller. Preferred: fold roster retrieval into the new verify_family_login RPC (roster returned ONLY on verified family password). Interim acceptable: require a verified family session token.
- Update src/lib/supabase/auth.ts and FamilyLogin.tsx to the gated flow.
- This commit alone removes the production enumeration hole.

### Phase 2 - Family password + settings + forced setup
- Migration: add families.family_password_hash, family_password_failed_attempts, family_password_locked_until.
- RPC set_family_password (primary-parent-only) + verify_family_login (combined, generic error, 5/15 lockout).
- Settings - Family - Family Password section UI (Mom shell).
- Forced one-time set-your-family-password prompt at next mom email login; family-login page locked for a family while family_password_hash IS NULL.
- Seed Testworth generic password.

### Phase 3 - Choice screen + resting places + hub umbrella session
- Choice screen component (Hub tile + member tiles), reached after the family door and from /hub (Hub pre-highlighted).
- Hub-resting family-session identity (Q1 - see Open Questions; recommendation below).
- Member tile -> per-member auth gate -> personal device (PIN shadow session) OR Hub dip-in (member_session View-As).
- Mom tile -> her PIN or email password (never family password).
- Member-timeout fallback wiring (to name-tile/PIN or Hub, never to family-password prompt).
- Kill-switch: changing the family password invalidates resting family sessions (Q3 mechanism).

### Phase 4 - Picture password (redesigned) server-side
- REDESIGN per Founder Decision 13: single-picture pick, NOT a sequence. Kid's one secret picture among shuffled decoys.
- Mom-side setup UI: pick the kid's picture from the login_avatar asset set (replaces sequence setup).
- RPC verify_member_picture_password (server-side compare, 5/15 lockout). Correct answer never reaches the browser. visual_password_config schema simplified to a single asset reference (migrate/clear any existing sequence configs — 0 members use visual_password in prod, so no data migration burden).
- On success: same shadow-account session as PIN members (personal-device persistence parity — Q5 resolved as full treatment).

---

## Recommended Answers to Open Engineering Questions

### Q1 - Hub-resting family session identity for RLS. RECOMMENDATION: per-family shadow auth account with a hidden family_members row.
- Create one shadow account family_id@family.myaimcentral.app (service-role, via a new Edge Function - mirrors the existing PIN shadow pattern), and a corresponding family_members row with a NEW role value (proposed family_device) so get_my_family_id() resolves and existing RLS keyed on user_id=auth.uid() works WITHOUT a policy rewrite.
- CAUTION (must verify before building): (a) family_members.role CHECK constraint currently allows only primary_parent/additional_adult/special_adult/member - adding family_device requires altering the CHECK; (b) the auto_provision_member_resources trigger fires on every family_members insert (archive folder + dashboard_config + sticker book etc.) - the family_device row must be EXCLUDED (guard the trigger on the new role, same pattern as handle_new_user skipping @pin emails); (c) is_active / dashboard_enabled filtering across roster UIs must hide the family_device row so it never appears as a person; (d) get_family_login_members ORDER BY and the choice-screen roster must exclude it.
- ALTERNATIVE (only if the hidden-row side effects prove too invasive): families.family_auth_user_id column + a NARROW set of new RLS read policies limited to exactly the hub-surface tables (family_hub_configs, calendar_events, event_categories, family_best_intentions, family_intention_iterations, countdowns, victories, families, and a name/avatar-only view of family_members). This avoids the trigger/role-constraint surgery but requires writing ~8 new SELECT policies and a restricted roster view, and useFamily/useFamilyMember would need a family-session branch.
- Recommendation rationale: the shadow-account-with-hidden-row path reuses the proven PIN shadow pattern and leaves the entire existing RLS surface untouched, at the cost of trigger/constraint guards that are well-understood and testable. The column+policy path is cleaner conceptually but touches more RLS surface and forks the identity hooks. Build the shadow-account path unless founder prefers the narrower blast radius of the column path.

### Q2 - Fate of the existing /auth/family-login flow. It BECOMES the family door + choice screen.
- SURVIVES: AuthPageLayout shell, lockout countdown UI/helpers, the member-select grid (repurposed as the choice screen member tiles), the PIN-entry step, the visual-password step (now calling the server RPC).
- CHANGES: Step 1 family-name lookup becomes family-name + family-password combined verify (verify_family_login). The member-select step only renders AFTER the family password verifies. auth_method=none and PIN/visual success now establish the correct session/resting state instead of a bare navigate.
- ADDED: the Hub tile on the choice screen; mom-tile-requires-her-own-auth branch; member-vs-family resting-place routing.

### Q3 - Mom changes family password -> all devices kicked. RECOMMENDATION:
- If the per-family shadow account is used (Q1 rec): set_family_password also rotates the shadow account password via the service-role Edge Function (supabase.auth.admin.updateUserById). Existing resting family sessions hold a refresh token tied to the old password and fail on next refresh -> kicked back to the family door. This is the same mechanism the PIN-change TODO (FamilyMembers.tsx:428) needs.
- If the column+policy path is used: store a family_session_epoch on families; the family session caches the epoch; bump it on password change; the client (and/or an RLS-checked function) treats a stale epoch as signed-out. Slightly more app-layer plumbing.

### Q4 - Do PIN shadow accounts have family_members.user_id linked? YES (verified): all 7 existing PIN shadow members have user_id pointing at their @pin account. So kid-personal-device RLS already works for linked PIN members. The 2 pin_hash-without-shadow members are the broken case - PIN-set must create+link the shadow account (the FamilyMembers.tsx:428 TODO must finally be built, via a service-role Edge Function).

### Q5 - Visual-password members and shadow accounts. Today they get NO session at all (client-side verify only). For personal-device PERSISTENCE they need the same shadow-account + signInWithPassword mechanism as PIN members. RECOMMENDATION: in Phase 4, on successful server-side visual-password verify, mint/sign-in a shadow session the same way PIN does (the shadow password can be a server-held secret derived per member, since the visual sequence is not a password the client should send as one). If founder wants visual-password members to be Hub-dip-in ONLY (no personal-device persistence) for now, that is a smaller scope - flag for founder ruling.

---
## Conflicts Between Founder Decisions and PRD-01/PRD-02 (founder decisions WIN - record as PRD amendments)

1. PRD-01 Screen 4 describes family login as: family name -> member list -> auth, with NO family password, and the member list shown right after a valid family name. The two-door model OVERRIDES this: a family password is now required BEFORE the member list renders, and name+password are one combined no-enumeration step. AMENDMENT to PRD-01 Screen 4 + Screen 9.
2. PRD-01 Edge Case Family not found returns a specific We could not find a family message (line 164) - enumeration-friendly. OVERRIDDEN: wrong name and wrong password now return one generic error. AMENDMENT to PRD-01 Edge Cases + Screen 4 error states.
3. PRD-01 says get_family_login_members is public, no auth required (migration comment + line 328). OVERRIDDEN: roster is now gated behind a verified family password. AMENDMENT to PRD-01 Screen 4 data flow.
4. PRD-01 Screen 4 / Edge Cases: auth_method=none taps straight to dashboard. Still true, but ONLY after the family door; the bare client-side navigate becomes a real resting-place transition. CLARIFIES rather than contradicts.
5. PRD-01 PIN default mm/dd and 4-digit PINs stay. The family password is a SEPARATE, stronger credential (min 8, letters+numbers) - net-new, no conflict.
6. PRD-01 tablet_hub_timeout never default and PRD-02/Convention #63 member timeouts: unchanged. The new rule is only the member-timeout FALLBACK TARGET (to name-tile/PIN or Hub, never family-password prompt). CLARIFIES.
7. families schema in PRD-01 (lines 392-415) lists no password column. AMENDMENT: add family_password_hash + lockout columns.
8. No PRD conflict with PRD-02 permission model - the doors sit below it. The View-As member_session origin (added by the 2026-06 View-As build, itself a post-PRD-02 layer) is reused as-is.

---

## Stubs - Do NOT Build This Phase

- Full role-duration session-timeout rebuild (Convention #63 values already exist via useSessionTimeout).
- Multi-family support.
- Biometric / Google OAuth.
- PWA install of /hub.
- Real per-member Supabase auth swap (every member a real JWT) - known future-migration point (Convention #39).
- Mom-configurable hub-table visibility.
- (Possible stub per Q5 founder ruling) visual-password personal-device persistence, if founder scopes visual-password to Hub-dip-in only for now.

---

## Dependencies

- Existing: verify_member_pin RPC, PIN shadow-account model + signInWithPassword, View-As member_session origin + HubMemberAuthModal + startViewAs, useFamily/useFamilyMember/useAuth chain, AuthGuard, family_members RLS (migration 14), auto_provision_member_resources trigger, handle_new_user @pin skip.
- NEW dependency introduced: a service-role Edge Function for shadow-account create/password-update (family session and the long-standing PIN-change TODO). This is the only new infra primitive.

---

## Mom-UI Surfaces

This build touches the following mom-facing surfaces. Each must be verified at desktop (>=1024px), tablet (~768px), and mobile (<=640px) in every shell mom encounters.

- FamilyLogin family-door step (family name + family password) - shells: pre-auth /auth/family-login - modification
- Choice screen (Hub tile + member tiles) - shells: pre-auth/family-session, reached from /auth/family-login and /hub - new
- Mom tile auth gate (her PIN or email password) - shells: pre-auth choice screen - new
- Settings - Family - Family Password section (set/change) - shells: Mom - new
- Forced family-password setup prompt at next mom email login - shells: Mom - new
- Hub resting state reachable under family session - shells: standalone /hub (no shell chrome) - modification
- Member dip-in from Hub (avatar+PIN) - shells: hub overlay (member_session View-As) - modification (reused)
- Visual-password member auth gate (server-verified) - shells: pre-auth choice screen / FamilyLogin - modification

Backend-only deliverables (no UI verification needed):
- verify_family_login RPC, set_family_password RPC, verify_member_visual_password RPC, gating of lookup_family_by_login_name + get_family_login_members, per-family shadow-account Edge Function, families migration, Testworth seed.

---
## Mom-UI Verification (populate during build)

| Surface | Desktop >=1024px | Tablet ~768px | Mobile <=640px | Shells Tested | Evidence | Timestamp |
|---------|------------------|---------------|----------------|---------------|----------|-----------|
| FamilyLogin family-door (name + password) | | | | pre-auth | | |
| Choice screen (Hub + member tiles) | | | | pre-auth / family-session | | |
| Mom tile auth gate (her PIN/email) | | | | pre-auth | | |
| Settings - Family - Family Password section | | | | Mom | | |
| Forced family-password setup prompt | | | | Mom | | |
| Hub resting state under family session | | | | /hub standalone | | |
| Member dip-in from Hub (avatar+PIN) | | | | hub overlay | | |
| Visual-password gate (server-verified) | | | | pre-auth | | |
| Generic-error/no-enumeration on bad name OR bad password | | | | pre-auth | | |
| Member timeout falls back to name-tile/PIN or Hub (never family-password) | | | | all member shells | | |

---

## Open Questions — RULED (2026-06-09 second session)

- Q1 path: **RULED — Option A approved** (per-family shadow account + hidden family_members row), expanded into a first-class Family identity with its own permission set (Founder Decision 12). Proposed role value: `family` (added to the role CHECK constraint); excluded from auto_provision trigger, rosters, counts.
- Q5: **RULED — full treatment now**, with the corrected single-picture design (Founder Decision 13). Picture-password kids get personal-device persistence parity with PIN kids.
- Family password reset path: mom resets from Settings while authenticated via her email/password (her account IS the recovery path). No separate reset email. (Implicit in Decision 9; flag at sign-off if founder wants otherwise.)
- The 2 pin_hash-without-shadow members: backfill their shadow accounts in Phase 3 (fixes the FamilyMembers.tsx:428 TODO) so their PIN login produces a real session. (Treating as approved — it is a bug fix; surface in Phase 3 verification.)

---

## Post-Build Verification (filled at Checkpoint 5)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | Wired/Stubbed/Missing | |

Zero Missing required before close-out.
