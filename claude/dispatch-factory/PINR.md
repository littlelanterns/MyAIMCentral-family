# Pre-Dispatch Pack — PINR: Personal-Device Timeout → PIN/Picture Relock

> **Factory status:** synthesized → decisions-pending (3 decisions, batch 4)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PINR. Priority: P1.
> Evidence: `claude/dispatch-factory/PINR-RECON.md`. Origin: Family-Auth-Two-Door registered stub
> (Founder Decision 4 — "family layer persists; timeout drops only to the PIN/picture relock").
> Headline: the family-door passage currently leaves NO persisted trace (the member sign-in
> clobbers it), so a kid's session timeout dumps them at the family-password form. Hub devices
> are already correct (they never time out); this is exclusively the personal-device path.
> Bonus finding: session-timeout durations in code (adult none / kids 7 days) diverged from
> Convention #63's documented 24h/4h/1h/30m.

## Design ruling (D-PINR-1): **Option A — dual persisted sessions**

A second, narrowly-scoped Supabase client (`src/lib/supabase/familyDeviceClient.ts`, storageKey
`myaim-family-auth`) holds the family-identity shadow session persistently alongside the member
session. On member timeout: sign out ONLY the member client → if the family session is valid,
land on that member's own PIN/picture gate (roster via the currently-dead-but-perfectly-gated
`get_family_login_members` RPC under the family session's auth.uid()); if invalid → full door.

Why A over the alternatives (recon options B/C/D):
- **Kill switch works for free** — changing the family password already calls global signOut on
  the shadow user, revoking its refresh tokens; the family layer dies with it, no new revocation
  wiring to remember (Option C's forgettable-drift risk — the same class as the bare
  `set_family_password` RPC problem — is avoided entirely).
- **No new anon-callable credential surface** — Option C's verify-token RPC would have to
  re-implement byte-identical no-enumeration semantics; Option A adds zero new pre-auth surface.
- **No migration**; reuses `get_family_login_members` (dead code, gated exactly right).
- Option B (cold refresh-token revival) rejected as A-but-fragile (rotation races → silent
  family-layer loss). Option D (store the password) rejected outright.

Hard isolation rule: the family client lives in ONE dedicated module imported ONLY by the
login/resume flow — data hooks, RLS reads, and `useFamilyMember` never touch it.

## Other rulings

1. **Posture (D-PINR-2): keep full member-session teardown + re-mint on timeout** (not a
   lock-screen). Real PIN/picture re-verification with a fresh JWT is the shipped
   defense-in-depth posture for shared kid devices; the Decision-4 complaint was only ever the
   family-password step. `useViewAsTimeout`'s modal pattern stays what it is (hub dip-ins).
2. **Durations (D-PINR-3): code wins, Convention #63 amended.** Live code deliberately set
   adult=no-timeout / kids=7 days (commented); with relock now cheap (one PIN tap), the founder
   MAY later tighten kid durations via a settings knob — recorded as an optional follow-up, not
   built now.
3. **`requires_email_login` members:** timeout routes to `/auth/sign-in` (they never had a shadow
   session) — preserve the picture_login precedent branch.
4. **E2E seam:** `useSessionTimeout` gains an injectable/testable override (no behavioral change)
   so stickiness tests don't wait 7 days — explicit test-infra work item.
5. **The existing 8-test family-auth pin stays green untouched**; `localStorage.clear()` still
   resets the device fully under Option A (both storage keys wiped).

## Slice plan (single Sonnet worker)

| Slice | Scope | Routing |
|---|---|---|
| 1 | `familyDeviceClient.ts` module + `establishFamilySession()` persists into it + module-isolation lint note; resume entry state in `FamilyLogin.tsx` (member-scoped relock screen: avatar + their gate only; roster via `get_family_login_members`; email-linked branch; fall-through to full door when family session invalid) | Sonnet xhigh |
| 2 | `useSessionTimeout` expiry branch: scoped member signOut → resume navigation; testable seam; Convention #63 text amendment prepared for close-out | Sonnet xhigh |
| 3 | E2E `tests/e2e/features/pin-relock-stickiness.spec.ts`: (a) simulated timeout → member gate ONLY, family form never rendered; (b) kill switch → full door; (c) requires_email_login → /auth/sign-in; (d) localStorage.clear() → full door; + family-auth-two-door 8/8 regression | Sonnet xhigh |
| Gates | Checkpoint 5 verify | **Fable if available, else Opus** |

## Open founder decisions (batch 4)

| # | Decision | Recommendation |
|---|---|---|
| D-PINR-1 | Option A (dual persisted sessions) over bespoke device tokens | Yes — kill switch inherited for free; zero new pre-auth surface; no migration |
| D-PINR-2 | Keep full teardown + re-mint posture (no lock-screen shortcut) | Yes — kid-device defense-in-depth; only the family-password step disappears |
| D-PINR-3 | Code durations are ground truth (adult none / kids 7d); amend Convention #63; optional future settings knob to tighten | Yes — the code comment shows it was deliberate; docs follow reality |

## Dependency edges
**SEQUENCING PAIR with FDWA (founder ruling 2026-07-04):** FDWA's amended scope admits teen
messaging/notepad/mindsweep writes on family devices with app-layer attribution — PINR's relock
is the accepted mitigation for the walk-away risk. Dispatch the two in the same window (either
order; each build file notes the other). Also coordinate lightly with SMFX item 4 (the
`set_family_password` RPC grant revoke — same auth territory).

---

## DISPATCH PROMPT (paste into a FRESH session — after batch-4 decisions resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PINR — personal-device timeout → PIN/picture relock
(Family-Auth-Two-Door Founder Decision 4 follow-up). Pre-dispatch pack:
claude/dispatch-factory/PINR.md (Option A ruled + 5 rulings + 3-slice plan). Evidence:
claude/dispatch-factory/PINR-RECON.md (precise file:line map). All decisions RESOLVED per
recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. Run `git log --oneline --since=2026-07-04`;
re-read CLAUDE.md Convention #273 and conventions added since; re-verify the recon's file:line
refs (FamilyLogin.tsx flow, useSessionTimeout.ts:119-127 expiry branch, family-auth-admin
set_family_password :195-238, get_family_login_members migration 100251:64-123) before editing.
Check whether SMFX shipped (its item 4 revokes the bare set_family_password RPC grant — verify
the Edge-Function path is still the only writer either way).

READ FIRST: (1) CLAUDE.md Family Auth Two-Door section (Convention #273) — every rule there is
binding; (2) .claude/completed-builds/2026-06/family-auth-two-door.md (Decision 4 + stickiness
intent); (3) the pack + recon. Create .claude/rules/current-builds/PINR-pin-relock.md (no YAML
frontmatter) with the pre-build summary, founder approval BEFORE code.

BUILD per the 3-slice plan. HARD RULES: familyDeviceClient is imported ONLY by the login/resume
flow — grep-verify at close that no data hook touches it; NO new pre-auth RPC surface — roster
comes only from get_family_login_members under the family session's auth.uid(); byte-identical
no-enumeration behavior of the family door is untouched; requires_email_login members route to
/auth/sign-in on timeout; kill-switch behavior (password change → family layer dies → full door)
is proven by test, not assumed; the timeout seam adds testability with zero behavioral change;
Convention #63 doc amendment rides close-out.

PROOF: new pin-relock-stickiness.spec.ts (4 assertions per the pack) + family-auth-two-door
8/8 green + tsc -b + lint. Ask the founder before running shared-fixture suites. NOTHING COMMITS
until proof green AND founder eyes-on clears (eyes-on: time a kid session out on a real tablet
— the relock screen must show ONLY that kid's gate); selective staging; founder confirms before
push. Close-out: Checkpoint 5, STUB_REGISTRY row flip (Family-Auth stub → Wired), Convention #63
amendment, archive build file.
```
