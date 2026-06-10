# Feature Decision File: Family-Auth-Two-Door (PRD-01 / PRD-02 Amendment)

> Created: 2026-06-09
> Type: AMENDMENT to existing auth/login architecture. Not a fresh PRD. Closes a live production security hole and implements the founder-specified two-door umbrella login model.
> PRDs amended: prds/foundation/PRD-01-Auth-Family-Setup.md, prds/foundation/PRD-02-Permissions-Access-Control.md
> Addenda read: PRD-31-Permission-Matrix-Addendum.md, PRD-Audit-Readiness-Addendum.md, PRD-Template-and-Audit-Updates.md. (Searched prds/addenda/ - there is NO PRD-01-specific or PRD-02-specific addendum.)
> Companion build read: .claude/completed-builds/2026-06/view-as-identity-scope-architecture.md (its origin mom_viewing/member_session model and useEffectiveMember hooks are the foundation this build sits on)
> Founder approved (decisions): 2026-06-09 in chat. Pre-build summary approval: PENDING.

---

## What Is Being Built

Each family becomes one mom-owned account with two login doors: (a) mom email/password, and (b) the family login name plus a new family password. After the family door, the device lands on a choice screen with a Hub tile and member-name tiles. Tapping Hub turns the device into a shared family device (rests on /hub; members dip in via avatar+PIN through the existing member_session View-As flow). Tapping a member name plus entering their PIN turns the device into that member personal device (rests on their dashboard, persistently signed in). The family door persists on a device indefinitely (cleared only by manual sign-out, storage wipe, or mom changing the family password). This build also closes a live roster-enumeration hole (two unauthenticated SECURITY DEFINER RPCs leak full member rosters) and moves visual-password verification server-side (today it is verified in browser JS with the correct sequence downloaded to the client).

---

## Screens and Components

| Screen / Component | Notes |
|---|---|
| FamilyLogin - Family Door (Step 1) | Existing /auth/family-login. Replace the two-step family-name-then-roster with a single combined family-name + family-password verification. Wrong name and wrong password return the SAME generic error (no enumeration). 5-attempt / 15-min lockout (mirrors verify_member_pin). On success a family session is established and the device advances to the Choice Screen. The family-login page is LOCKED for a family until mom has set the family password. |
| Choice Screen (NEW) | After the family door. Shows a Hub tile plus member name/avatar tiles (from a now-gated roster RPC). Entry via /hub pre-highlights the Hub tile; both entry points reach the same screen. Tap Hub then device rests on /hub (family device). Tap a member name then that member auth gate (PIN / picture password / none). Mom tile ALWAYS requires HER auth (her PIN or email password) - family password alone never opens mom command center. |
| Member auth gate (within Choice Screen) | Per-member: PIN pad (existing verify_member_pin), picture-password grid (now SERVER-verified), or none (straight through - acceptable because the device already passed the family door). On success for a non-mom member then personal device, persistently signed in via the existing PIN shadow-account session mechanism, rests on their dashboard. |
| Hub resting state | /hub becomes reachable under a family session (today it requires mom auth - see Q1). Members dip in via avatar+PIN using the existing HubMemberAuthModal then startViewAs origin member_session. Member timeout returns to Hub, NOT to the family-password prompt. |
| Settings - Family - Family Password section (NEW) | Mom sets/changes the family password (min 8 chars, letters + numbers). Changing it is her remote kill switch - all devices resting on the family door are kicked. |
| Forced family-password setup prompt (NEW) | Existing moms get a one-time forced set-your-family-password prompt at next email login. Until set, the family-login page is locked for that family. |
| Visual-password verification (server-side move) | The image-sequence comparison moves from FamilyLogin.tsx JS into a server RPC with the same 5-attempt/15-min lockout pattern. The correct sequence is never sent to the browser. |

---

## Key PRD Decisions (Easy to Miss)

1. Live schema uses family_members.user_id, NOT auth_user_id. PRD-01 spec text (lines 424, 564, 678) says auth_user_id; the built schema and useFamilyMember.ts use user_id. Build against user_id. (Known, already-resolved divergence - schema wins.)
2. verify_member_pin RPC is solid and stays (bcrypt, 5 tries then 15-min lockout, returns JSONB). Family password verification mirrors this pattern.
3. Pre-existing reason-string mismatch (do not regress, fix opportunistically): verify_member_pin returns reason values member_not_found / wrong_pin / no_pin_set, but FamilyLogin.tsx and HubMemberAuthModal.tsx check for not_found / invalid. Latent bug surfaced during this audit - the family-door rewrite touches this file.
4. family_hub_configs.hub_pin is a kiosk-exit lock (4-digit, separate concern). DO NOT overload it for the family password. The family password is a NEW column on families, a real password (min 8), bcrypt-hashed.
5. auth_method=none is now valid and safe because the device passed the family door first. This FIXES the broken FamilyLogin.tsx lines 126-129 path that just navigates to /dashboard with no session.
6. Family-password-only visibility = Hub surface ONLY (the tables /hub reads: family_hub_configs, calendar_events, event_categories, family_best_intentions, family_intention_iterations, countdowns, victories, family_members roster, families). Anything beyond the hub requires a member gate.
7. Email-invited members unchanged. Accept-invite flow (/auth/accept-invite, accept_family_invite RPC) stays as-is. Their email/password opens only their own dashboard.
8. Member-layer stickiness follows Convention #63 (adult 24h, independent 4h, guided 1h, play 30m). Member timeout falls back to the name-tile/PIN screen (personal device) or Hub (family device) - NEVER back to the family-password prompt.
9. Per-kid auth method is mom choice: PIN / picture password / none.
10. Seed a generic family password for the Testworth test family (1f6200a7-df82-4ac4-bce3-3edcafe66bc5, login name testworthfamily) so testing is not blocked.

---

## Addendum Rulings

### From PRD-31-Permission-Matrix-Addendum.md:
- The three-layer permission stack (Layer 1 tier / Layer 2 mom toggle / Layer 3 granular) is unchanged. The family door and choice screen are an AUTHENTICATION concern, layered BELOW the permission engine - passing the family door grants a session identity, not feature access. Feature access still resolves through feature_access_v2 + member_feature_toggles + member_permissions.
- No new feature keys are required for the auth doors themselves. A family-session gate, if desired, maps to the existing family_login (Enhanced) feature key from PRD-01.

### From PRD-Audit-Readiness-Addendum.md:
- Process/quality addendum. No feature-impacting rulings. Honor the rationale/deferred tagging conventions in the amendment text recorded for PRD-01/PRD-02.

### From PRD-Template-and-Audit-Updates.md:
- Documentation convention only. No architectural impact.

---

## Database Changes Required

### Modified Tables (columns being added)
- families.family_password_hash TEXT NULL - bcrypt hash of the family password. NULL until mom sets it (family-login page locked while NULL).
- families.family_password_failed_attempts INTEGER NOT NULL DEFAULT 0 - lockout counter (mirrors family_members.pin_failed_attempts).
- families.family_password_locked_until TIMESTAMPTZ NULL - lockout timestamp (mirrors family_members.pin_locked_until).
- (Possible, pending Q1) families.family_auth_user_id UUID NULL - FK to the per-family shadow auth account, if the recommended hub-session approach is chosen.

### New RPCs / Functions
- set_family_password(p_family_id, p_password) SECURITY DEFINER - primary-parent-only (checks auth.uid() = families.primary_parent_id); validates min 8 / letters+numbers; bcrypt-hashes into family_password_hash. Mirrors hash_member_pin auth-check pattern.
- verify_family_login(p_login_name, p_password) SECURITY DEFINER - combined name+password check in ONE call. Generic failure for wrong-name OR wrong-password (no enumeration). 5-attempt / 15-min lockout on the family row. On success returns family_id plus whatever the chosen hub-session mechanism needs.
- GATE the two leaky RPCs: lookup_family_by_login_name and get_family_login_members must no longer return member data to unauthenticated callers. Either fold roster retrieval into verify_family_login (returns roster only on verified password) or require a verified family session. Phase 1, first commit.
- Visual-password verification RPC verify_member_visual_password(p_member_id, p_sequence) SECURITY DEFINER with 5/15 lockout - moves comparison server-side.
- (Pending Q5) possibly extend the PIN shadow-account model to visual-password members for personal-device persistence (today they get NO session).

### Migrations
- Migration A (Phase 1 - leak closure, FIRST COMMIT): Gate lookup_family_by_login_name + get_family_login_members. Server-side visual-password RPC can ride along or land as Phase 4.
- Migration B (Phase 2): Add family_password columns to families; set_family_password + verify_family_login RPCs; seed Testworth generic password.
- Migration C (Phase 3): Hub-session identity mechanism per Q1.
- Bootstrap note: per-family shadow-account creation needs the service role key (a new Edge Function). Same constraint already blocks PIN shadow-account creation (FamilyMembers.tsx line 428 TODO).

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| family_login | Enhanced | (infra) | EXISTING from PRD-01. No new key required. |
| family_hub | Enhanced | (infra) | EXISTING. Hub resting surface. |

No new feature keys required.

---

## Stubs - Do NOT Build This Phase

- PRD-01 spec session timeouts as a full role-duration rebuild - Convention #63 durations already exist via useSessionTimeout; do not re-architect.
- Multi-family support - one mom = one family stays.
- Biometric / Google OAuth - post-MVP per PRD-01.
- PWA install of /hub - separate follow-up.
- Real per-member Supabase auth swap - explicitly NOT this build. Known future-migration point (Convention #39).
- Configuration UI for which hub tables a family session can read - fixed by the build, not mom-configurable.

---

## Cross-Feature Connections

| This feature | Direction | Connected to | Via |
|---|---|---|---|
| Family door session | to | Hub surface (/hub) | New family-session identity (Q1); hub-surface RLS read access |
| Choice screen member tile + PIN | to | View-As member_session flow | Existing HubMemberAuthModal then startViewAs origin member_session |
| Member tile + PIN (personal device) | to | Member persistent session | Existing PIN shadow account member_id@pin.myaimcentral.app + signInWithPassword |
| set_family_password change | to | All devices on family door | Kill switch - family session invalidation (Q3) |
| Family door (combined verify) | from | families.family_login_name_lower, family_password_hash | New verify_family_login RPC |
| Visual-password gate | to | family_members.visual_password_config | New server RPC (moved from client) |
| Email-invited members | from | Accept-invite flow | UNCHANGED - accept_family_invite RPC |

---

## Things That Connect Back to This Feature Later

- Real per-member Supabase auth (future): the family-door session becomes a migration anchor (Convention #39).
- PRD-15 Messaging: sender identity under a personal-device member session must use useEffectiveMember().
- PRD-30 Safety Monitoring: typed input under a member session evaluates against the target settings via useEffectiveMember().

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate (2026-06-09 chat)
- [x] All addenda captured above (none PRD-01/02-specific exist)
- [x] Stubs confirmed - nothing extra will be built
- [x] Schema changes correct
- [x] Q1 hub-session approach approved — Option A (per-family shadow account + hidden family_members row), EXPANDED by founder: the Family identity is first-class and deliberate, with its own permission set; future hub configuration (mom adding widgets to the hub, hub theming) hangs off this identity rather than mom's account. Proposed role value: `family`.
- [x] Q5 ruled with a DESIGN CORRECTION (2026-06-09): visual password was never meant to be a 4-picture sequence. Intended design: SINGLE-PICTURE pick — each kid has one secret picture (PIN equivalent); login shows a shuffled grid of their picture + decoys; kid taps theirs. Existing sequence implementation is replaced. Server-side verify, 5/15 lockout, and the same shadow-session personal-device persistence as PIN members (full treatment now). 0 prod members use visual_password, so no data migration burden.
- [x] Approved to build (founder, 2026-06-09)

---

## Post-Build PRD Verification

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | Wired / Stubbed / Missing | |

### Summary
- Total requirements verified:
- Wired:
- Stubbed:
- Missing: 0

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs acceptable and in STUB_REGISTRY.md
- [ ] Zero Missing confirmed
- [ ] Phase approved as complete
- Completion date:
