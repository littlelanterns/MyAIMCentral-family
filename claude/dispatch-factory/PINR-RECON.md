# PINR — PIN-Relock Stickiness Recon Brief (Sonnet code-recon, 2026-07-04)

> Archived by the dispatch factory (condensed, citations kept). Consumed by `PINR.md`.

## A. Current flow (file:line)

1. Family door: `FamilyLogin.tsx:117-168` → `verifyFamilyLogin` (`auth.ts:110-116`) → RPC `verify_family_login` (latest body migration 100257:69-165; roster released only in success branch :100-143).
2. `establishFamilySession()` (`FamilyLogin.tsx:94-115`): `signInWithPassword({email:'{family_id}@family.myaimcentral.app'})` on the SINGLE shared client (`client.ts:12-20`, storageKey 'myaim-auth'); password state cleared immediately (:146).
3. Member tile → PIN (`handlePinSubmit` :209-268): `verify_member_pin` then `signInWithPassword({email:'{member_id}@pin...'})` **on the same client/storage slot — clobbers the family session** (intentional "personal device" behavior). Picture path via family-auth-admin `picture_login` (:458-529) same shape.
4. Only persisted artifact after: the member session. The family-door passage leaves NO independent trace.
5. **Timeout durations DIVERGED from Convention #63:** `useSessionTimeout.ts:15-20` — live code: `adult: 0` (no timeout, manual sign-out), `independent/guided/play: 7 days` (deliberate-looking comment :10-13). Convention #63 documents 24h/4h/1h/30m. Doc-vs-code drift to reconcile.
6. Expiry (`scheduleTimeout` :119-127): full unscoped `supabase.auth.signOut()` + navigate to `/auth/family-login` → kid faces family-name+password again — the exact Decision-4 bug.
7. `useSessionTimeout` mounts only via ShellProvider:51 under ProtectedRoute; **/hub uses ProtectedRouteNoShell → hub-resting family devices never time out** (Decision 4 already satisfied there). Gap is EXCLUSIVELY personal-device member sessions.
8. `useViewAsTimeout` = reference for relock-without-destroying (modal-close pattern; never touches the session) — but hub dip-ins never minted a session, so it doesn't solve this.

## B. Today vs Decision 4 intent

Hub device: persists indefinitely ✅. Personal device timeout: full signOut → family door ❌ (should drop to the member's own PIN/picture gate). Manual sign-out + storage wipe clearing the family layer: correct/expected, out of scope.
Root cause: "passed the family door" is never persisted as an independently-checkable artifact.

## C. Constraints

1. No-enumeration: resume path must not release roster pre-credential; reusing an already-issued authenticated credential is safe (possession, not guessing).
2. Kill switch: `set_family_password` (family-auth-admin :195-238) rotates shadow password + `admin.auth.admin.signOut(userId,'global')` (:229-232) revokes ALL the shadow user's refresh tokens — any persisted family-layer proof MUST die with it.
3. Lockout columns untouched by a non-password resume; don't add a new attemptable surface.
4. `requires_email_login` members (picture_login :475-489 precedent): timeout → email sign-in, never a shadow relock.
5. `get_family_login_members(p_family_id)` RPC (migration 100251:64-123) is CURRENTLY DEAD CODE, gated exactly right ("authenticated AND belongs to family" — the hidden role='family' row satisfies `fm.user_id = auth.uid()` via ensure_family_member_identity, 100254:112-150). Natural roster source for a live family session.
6. Convention #39 boundary NOT crossed (member sessions are already real JWTs; this only adds family-layer persistence).
7. Single shared client today — a live family layer needs a second client instance (different storageKey) or a cold credential.
8. E2E kill-switch pin (family-auth-two-door.spec.ts test 7 :159-183): `localStorage.clear()` must still force the full door — holds under all options.

## D. Options (recon's analysis)

- **A — dual persisted sessions** (second client, storageKey 'myaim-family-auth', autoRefresh): kill switch free (refresh revocation), reuses get_family_login_members, no migration. Cons: idle refresh chatter; two auth blobs in localStorage (same secret class as today); must isolate the module so data hooks never read it.
- **B — cold refresh-token persistence, revive on demand:** leaner but refresh-rotation race/fragility (lost-token → silent fallback to full door). "Option A done riskier."
- **C — bespoke family_device_tokens table + anon verify RPC:** explicit + auditable; but NEW anon credential-verification surface that must replicate byte-identical no-enumeration semantics, new revocation wiring in set_family_password (forgettable-drift risk — the bare-RPC lesson), duplicated roster query outside the auth.uid() gate, new migration.
- **D — store plaintext family password: REJECTED** (violates server-side-secret precedent).
- **Adjacent posture question:** lock-screen (never signOut, gate UI) vs full teardown+remint. Stub wording ("kid re-enters family password" is the complaint, not "re-enters PIN") implies keep real re-verification + teardown; lock-screen is a materially weaker posture for shared kid devices.

## E. Touch points + E2E

`useSessionTimeout.ts` expiry branch; `FamilyLogin.tsx` resume entry state + establishFamilySession persistence; `auth.ts` dead wrappers go live; family-auth-admin set_family_password (verify revocation covers the new layer); NEW `src/lib/supabase/familyDeviceClient.ts` (Option A — no migration). ShellProvider call site shape unchanged.
E2E: existing 8 tests untouched (no timeout coverage — durations 0/7d untestable live); NEW stickiness spec needs a testable seam (injectable timeout override — test-infra work, flag explicitly). Required assertions: (a) simulated timeout → member's own PIN/picture screen ONLY, never family form; (b) kill switch → same path falls back to FULL door; (c) requires_email_login → /auth/sign-in; (d) localStorage.clear() → full door.
