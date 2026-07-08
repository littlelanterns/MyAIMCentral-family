# PRD-40 Addendum — Two-Door Auth Reconciliation, Key Decision 7 Amendment, Cohort Framing

> **Status:** APPROVED (founder, 2026-07-07 — OD-1..4 resolved per `claude/feature-decisions/PRD-40-COPPA-Compliance.md` §7).
> Authored: 2026-07-07, Fable pre-build audit session, under founder dispatch (PRD-41 in-repo authoring precedent).
> Base PRD: `prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md` (2026-04-16). This addendum reconciles it with everything that shipped between April and July 2026 — most importantly the Two-Door Umbrella Auth model (Convention #273, 2026-06-09), which postdates the PRD entirely. **Newer wins: where this addendum and the base PRD disagree, this addendum is authoritative.**
> Companion rulings (freshness deltas beyond this addendum's four sections — canonical under-13 source, append-only-ledger carve-out, dormant-block mechanics, commit-RPC shape, etc.): `claude/feature-decisions/PRD-40-COPPA-Compliance.md` R-1..R-14.

---

## (a) Disclosure copy — SATISFIED by the Attorney Review Package

The base PRD's Screen 1–5 disclosure copy (marked `[LAWYER REVIEW REQUIRED]`) knows nothing of the two-door auth artifacts. The Attorney Review Package (2026-07-05, `claude/legal-drafts/`) supersedes that placeholder copy wholesale: `parental-consent-flow-copy-draft.md` already discloses, in parent-readable language —

- PINs stored only as scrambled (hashed) values, never the actual number
- The single secret-picture sign-in, stored as a scrambled code, never a readable record of which picture is the child's
- The hidden (shadow) sign-in accounts created behind the scenes so a child's PIN or picture can actually sign them in

No further disclosure-copy authoring is needed in-repo. The attorney's approved markup of the ARP drafts becomes `coppa_consent_templates` version `1.0.0`; the `[LAWYER REVIEW REQUIRED]` markers clear only via `lawyer_approved_at` being populated. Until then the flow is inert for real users (section (d) below).

---

## (b) Deletion-cascade registry additions — Convention #273 artifacts

The base PRD's canonical cascade list (L948-958) predates the two-door model. The following are added to the `child_data_tables` registry / cascade, per child, on consent revocation:

1. **The child's shadow auth account.** When `family_members.user_id` points to a shadow account (created via `ensure_pin_shadow_account` or the picture-password flow — never an email-invited real account), the cascade performs a global sign-out of that auth user, then deletes it via the admin API (`deleteUser`), ordered BEFORE the `family_members` row hard-delete. Email-invited real accounts are detached (member row deleted; the auth account is the person's own and is out of COPPA scope) — the export/deletion right covers the child's data, not an account credential the parent created with their own email.
2. **Auth columns on the child's `family_members` row** — `pin_hash`, `pin_failed_attempts`, `pin_locked_until`, `visual_password_config` (the single-picture secret + fixed decoy set), `auth_method` — die with the row. Named explicitly so no partial-scrub path (e.g., a future soft-delete variant) can ever leave a credential artifact behind.
3. **The picture-password server-derived HMAC secret** exists only as the shadow account's password; it is destroyed with item 1. No separate storage to sweep.
4. **Family-level auth artifacts are PRESERVED:** the family shadow account (`{family_id}@family.myaimcentral.app`), `families.family_password_hash`, hub configuration, and the hidden `role='family'` member row belong to the family, not the departing child.
5. **`view_as_sessions` rows where `viewing_as_id = <child>`** (plus their `view_as_feature_exclusions` via session FK): hard delete. They are records of the child's account being used/inspected — "data about the child."

The Slice-1 registry derivation (`claude/feature-decisions/PRD-40-COPPA-Compliance.md` R-6) folds these in alongside the post-April table sweep.

---

## (c) Key Decision 7 — AMENDED (D-PRD40-3, founder-resolved 2026-07-04)

Base PRD Key Decision 7 said: *"The full parent-visibility model applies to all under-13 LiLa interactions — no transparency exemption."* Convention #39's `filterKidPrivate()` (shipped, deliberate, kid-trust-load-bearing) hides kid-private journal/self-knowledge/`lila_conversation` items from mom in daily View-As UX. The amendment resolves the tension:

- **Daily UX keeps `filterKidPrivate()` unweakened.** View-As continues to hide kid-private items from mom, keyed on origin, exactly as shipped.
- **The COPPA parental review right is satisfied in full on the FORMAL rights surfaces:** Screen 8 (Settings → Privacy & Consent review) and the per-child data export, which for `under_13` children include EVERYTHING — kid-private journal entries, `share_with_mom=false` self-knowledge, and `lila_conversation`-type journal entries included. The export path deliberately does NOT apply `filterKidPrivate()`; an in-code rationale comment is required at that site (Convention #279 pattern for deliberate HITM/privacy divergences).
- **Subject to counsel:** the attorney cover memo's mandatory question (§8.3 of the data-practices summary) asks whether the shipped kid-privacy carve-outs are compatible with COPPA's parental access right given this rights-surface answer. If counsel rules otherwise, the change is a filter flag on the daily-UX side — never an architecture change. The carve-outs are frozen (never widened) pending that ruling, per the standing `no-hiding-from-parents` founder rule.

---

## (d) Cohort framing — CANONICAL (D-PRD40-1, supersedes Gate-4 wording)

The framework ships **dormant-but-built** (founder resolution 2026-04-21, `FIX_NOW_SEQUENCE.md` L517, confirmed 2026-07-04):

- **Beta cohort 1** contains only families with no under-13 children (enforced by invitation).
- **While no `coppa_consent_templates` row has `lawyer_approved_at` set,** an under-13 add by any non-founder family is **blocked with a warm card** (OD-4, approved 2026-07-07): the consent flow cannot be shown, because consent captured against unapproved text is not valid consent, and falling through to collection would be the thing COPPA forbids. The rest of the add batch commits normally. Founder-family records run through the documented backfill posture instead (decision file R-9), then re-consent through the real flow once v1.0.0 is approved.
- **Cohort 2 (under-13 families) opens after all three:** (i) attorney review → `lawyer_approved_at` populated; (ii) the revocation/deletion cascade built and verified (this build); (iii) **PRD-41's Phase-4 enforcement flip** — PRD-41 shipped 2026-07-04..06 in shadow mode; shadow satisfies "built," and the flip to enforcing is the under-13-exposure gate (decision file R-11).

This supersedes `MYAIM_GAMEPLAN_v2.2.md` L521 ("COPPA fully wired before beta"), which was never reconciled in-repo before now.

---

*End of addendum.*
