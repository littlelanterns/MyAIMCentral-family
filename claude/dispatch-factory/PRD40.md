# Pre-Dispatch Pack — PRD40: COPPA Compliance & Parental Verification

> **Factory status:** synthesized → decisions-pending (6 decisions, batch 2)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD40. Priority: P2 (beta-critical).
> Evidence: `claude/dispatch-factory/PRD40-RECON.md` (full Sonnet recon brief, 2026-07-04).
> Verdict from recon: **100% unbuilt.** Zero COPPA code, zero Stripe code anywhere in the platform.
> Registered as SCOPE-8a.F1 + F2, LOCKED Fix Now rows #1/#2 in TRIAGE_WORKSHEET since April.

## Why this pack matters (plain English)

COPPA is the law governing children's data. The platform stores kids' names, tasks, journals, and
LiLa conversations today with none of the legally required consent machinery. The founder-approved
plan (2026-04-21, FIX_NOW_SEQUENCE L517) is: **build the framework now, ship it dormant, scope the
first beta cohort to families with no under-13 children, open the second cohort only after lawyer
review + revocation cascade are done.** This pack turns that plan into a dispatchable build.

## Reconciliation rulings (newer wins — named explicitly)

1. **Cohort framing.** FIX_NOW_SEQUENCE founder resolution (2026-04-21: dormant-but-built; cohort 1
   = no under-13 families) SUPERSEDES `MYAIM_GAMEPLAN_v2.2.md` L521's "COPPA fully wired before
   beta." The two docs were never reconciled; this pack encodes the newer ruling (confirm at
   D-PRD40-1).
2. **Two-door auth (Convention #273, 2026-06-09) postdates PRD-40 (2026-04-16).** The PRD's Screen 1
   disclosure copy and deletion-cascade registry (L945-958) know nothing of per-child shadow auth
   accounts, `ensure_pin_shadow_account` sessions, picture-password HMAC secrets, or family-device
   resting sessions. PRD-40 must be EXTENDED via addendum before build (D-PRD40-4) — the cascade
   registry gains shadow-account teardown, `pin_hash`, `visual_password_config`, and picture-secret
   rows; the disclosure copy names the new auth artifacts.
3. **Convention #39 `filterKidPrivate()` vs PRD-40 Key Decision 7** ("no under-13 transparency
   exemption"). Genuine product-vs-legal tension: kid-private journaling is now a shipped,
   deliberate value; COPPA requires the parent be ABLE to review collected data. Ruling proposal
   (D-PRD40-3): keep `filterKidPrivate()` in daily View-As UX, and satisfy the parental review
   right through the FORMAL surfaces — Screen 8 consent review + the per-child data export, which
   include EVERYTHING (kid-private items too) for `under_13` children. Key Decision 7 is amended
   accordingly in the addendum. Daily UX keeps trust; the legal right is fully honored on the
   rights surface.
4. **PRD-13 privacy-filter prerequisite: SATISFIED.** The role-asymmetric fix PRD-40 L744-752 waits
   on landed 2026-04-17 (STUB_REGISTRY entry 629: `applyPrivacyFilter` + `isPrimaryParent` helpers,
   RESTRICTIVE RLS migration 100149). Build-time worker re-verifies.
5. **PRD-20 backburner (2026-06-09) moots the Safe Harbor gate** (PRD-40 L883-898). Ship
   `coppa_age_bracket` anyway; skip Safe Harbor gate wiring; mark N/A-backburnered in verification.
6. **Admin Screen 10 = third `ADMIN_TABS` row.** The 2-tab admin shell now exists
   (`src/pages/admin/AdminLayout.tsx`) with a "Wave 4 (COPPA)" row explicitly reserved in its
   header comment. No larger console build needed; the PRD32 pack absorbs console growth.
7. **PRD-41 sequencing.** PRD-40's non-LiLa infrastructure (tables, consent flow, Stripe charge,
   cascade, retention crons) is INDEPENDENT of PRD-41. Only the "under-13 uses LiLa" gate waits on
   SAFETY-BETA-GATE Slice E. Build can dispatch as soon as SAFETY Slices C/B/A have deployed
   (shared `supabase/functions/` territory — sequence, don't overlap).

## Slice plan (model routing per `.claude/rules/model-routing.md`)

| Slice | Scope | Routing |
|---|---|---|
| 0 | **PRD-40 Two-Door Addendum** — authored on claude.ai (founder channel, same pattern as PRD-41 Slice D): disclosure-copy extensions, cascade-registry additions for Convention #273 artifacts, Key Decision 7 amendment per D-PRD40-3, cohort-framing note superseding Gate-4 wording. Lands as `prds/addenda/PRD-40-Two-Door-Auth-Addendum.md` | claude.ai handoff (founder) |
| 1 | Schema: 6 tables (`parent_verifications`, `coppa_consents`, `coppa_consent_templates`, `parent_verification_attempts`, `parental_data_exports`, `retention_deletion_log`), 3 enums, 2 `family_members` columns, immutability RLS (no-UPDATE/DELETE policies), rate-limit scaffolding. Also teach `scripts/full-schema-dump.cjs` DOMAIN_ORDER the new tables | Sonnet xhigh (migration-writer patterns) + rls-verifier |
| 2 | **Stripe foundation** (platform's first Stripe code, per D-PRD40-2): `_shared/stripe.ts`, PaymentIntent Edge Function ($1, `metadata.purpose=coppa_verification`), `stripe-webhook-handler` Edge Function with EVENT ROUTING designed for PRD-31 to extend, daily reconciliation cron (Convention #246 `util.invoke_edge_function`), attempt logging + 5/hr-20/day rate limits | Sonnet xhigh |
| 3 | Consent UX Screens 1–7: 5-section scroll-enforced modal flow, verification success + email receipt, additional-child acknowledgment; `FamilySetup.tsx` retrofit (held-pending-verification commit, bulk/manual-add branching, `coppa_age_bracket` derivation from DOB) | Sonnet xhigh |
| 4 | Rights + lifecycle: Screen 8 (Settings → Privacy & Consent), Screen 9 (3-step revocation + 14-day grace + undo), per-child data-export ZIP (JSON+README, 7-day signed URL, 1/child/7-days), deletion cascade per the 8-rule table + two-door additions, 3 retention crons, `retention_deletion_log` | Sonnet xhigh (heaviest correctness slice) |
| 5 | Enforcement: `useCoppaConsent()` client hook + `_shared/coppa-consent.ts` server check, AI-call gating for `under_13` in Edge Functions, RLS extension on child-scoped writes, Platform Intelligence aggregation exclusion, 2 always-true feature keys | Sonnet xhigh |
| 6 | Admin `/admin/coppa` tab (third ADMIN_TABS row), E2E suite `tests/e2e/features/coppa-consent.spec.ts` (consent flow, webhook reconciliation, revocation grace, cascade correctness, export, rate limits, RLS probes), LiLa knowledge, verification tables | Sonnet xhigh |
| Gates | Pre-build freshness audit + Checkpoint 5 post-build verify | **Fable if available, else Opus** |

External gate (not a slice): **lawyer review** — consent templates ship with `lawyer_approved_at`
NULL; the flow is inert for real users until counsel populates it. Second-cohort opener.

### FOUNDER AMENDMENT (2026-07-04) — Attorney Review Package (new deliverable)

Approved with amendment: build timing stays founder-controlled, and the pack gains a
deliverable — an **ATTORNEY REVIEW PACKAGE drafted to Missouri-specific requirements**:
(1) privacy policy draft, (2) COPPA direct notice, (3) parental-consent flow copy (the Screen
1–5 disclosure text), (4) data-practices summary. Produced by a **Fable session** as
preparation for review/edit by the founder's licensed attorney, **who is the sign-off** —
nothing legal-relying ships without attorney approval. The package is its own factory item
(`ARP.md` — dispatch-ready now, ideally inside the Fable pricing window) and its output feeds
Slice 3's disclosure copy + the `coppa_consent_templates` seeds (still gated on
`lawyer_approved_at`).

## Open founder decisions (D-PRD40-1..6 — batch 2) — **✅ ALL RESOLVED per recommendations
(founder 2026-07-04), with the Attorney Review Package amendment above.**

| # | Decision | Recommendation |
|---|---|---|
| D-PRD40-1 | Confirm cohort framing: dormant-but-built; cohort 1 = no under-13 families; supersede Gate-4 "fully wired before beta" wording | Confirm — it's your own 2026-04-21 ruling; this just makes it canonical |
| D-PRD40-2 | Stripe lands FIRST with PRD-40 (webhook handler designed for PRD-31 to extend)? | Yes — COPPA's $1 charge is small, legally load-bearing, and unblocks the second cohort; PRD-31's full billing extends the same handler |
| D-PRD40-3 | `filterKidPrivate()` stays in daily UX; parental review right satisfied via Screen 8 + full per-child export (kid-private items included for under-13); amend Key Decision 7 | Yes — honors the law on the rights surface without breaking the shipped kid-trust design |
| D-PRD40-4 | Author the Two-Door Addendum on claude.ai before build (Slice 0) | Yes — PRD-40 predates Convention #273; building without the extension bakes in a stale disclosure + incomplete cascade |
| D-PRD40-5 | Engage outside counsel now, in parallel — build ships dormant regardless | Yes — lawyer review is the long pole for cohort 2; start the clock |
| D-PRD40-6 | Interim stance on your own kids using the app pre-consent-infra: accepted risk (you are the consenting parent, de facto); backfill your family's consent rows once the flow exists | Accept + backfill — consistent with your SAFETY-BETA-GATE Gate-1 ruling |

## Dependency edges (manifest-mirrored)

- After: SAFETY-BETA-GATE Slices C/B/A deployed (shared Edge Function territory).
- Before: PRD31 Slice 2 (extends the webhook handler), beta cohort 2, RLS-VERIFICATION expansion
  (PRD-40 + PRD-30 tables together, per PRD L910).
- Parallel-safe with: everything else in the factory queue.

---

## DISPATCH PROMPT (paste into a FRESH session — after D-PRD40-1..6 resolve AND Slice 0 addendum exists)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-40 — COPPA Compliance & Parental Verification.
Pre-dispatch pack: claude/dispatch-factory/PRD40.md (rulings + slice plan). Evidence brief:
claude/dispatch-factory/PRD40-RECON.md. All six pack decisions are RESOLVED per the pack's
recommendations unless the founder noted otherwise at approval.

FRESHNESS PREAMBLE (before anything): pack produced 2026-07-04. Run `git log --oneline
--since=2026-07-04`; re-read CLAUDE.md conventions added since; confirm SAFETY-BETA-GATE
Slices C/B/A have DEPLOYED (you share supabase/functions/ territory — do not collide);
re-verify STUB_REGISTRY entry 629 (privacy-filter role-asymmetric fix) still holds; check
the next free migration number immediately before every push (multiple sessions land
migrations in parallel).

READ FIRST (in order):
1. prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md — FULL read, every word.
2. prds/addenda/PRD-40-Two-Door-Auth-Addendum.md — MUST exist (Slice 0). If absent, STOP and
   tell the founder; do not build against the unamended PRD.
3. claude/dispatch-factory/PRD40.md + PRD40-RECON.md — rulings, slice plan, line-ref map.
4. Create .claude/rules/current-builds/PRD-40-coppa.md (no YAML frontmatter) with the full
   pre-build summary per claude/PRE_BUILD_PROCESS.md, present to the founder, get explicit
   approval BEFORE code (Checkpoint 1 — the pack accelerates this ritual, it does not skip it).

BUILD SLICES 1→6 per the pack table: schema+RLS (immutable audit tables — no UPDATE/DELETE
policies, service-role INSERT for verifications), Stripe foundation (_shared/stripe.ts +
$1 PaymentIntent + stripe-webhook-handler with event routing PRD-31 will extend + daily
reconciliation cron via util.invoke_edge_function, Convention #246; cron-invoked functions
deploy --no-verify-jwt), consent UX Screens 1-7 + FamilySetup retrofit (held-pending-
verification — members NEVER commit before verification on first under-13 add), rights +
lifecycle (Screen 8/9, per-child export ZIP incl. kid-private items for under_13 per
D-PRD40-3, deletion cascade per the 8-rule table + two-door additions, 3 retention crons),
enforcement (useCoppaConsent + _shared server check + AI-call gating + aggregation exclusion),
admin /admin/coppa tab + E2E + LiLa knowledge.

HARD RULES: consent templates ship lawyer_approved_at=NULL and the live flow stays INERT for
real users until populated (dormant-but-built). Sibling-data preservation is the load-bearing
cascade rule. filterKidPrivate() is NOT weakened (D-PRD40-3). Convention #257: all dates
server-derived. Backfill the founder's own family consent rows as the final verification step
(D-PRD40-6), founder present.

PROOF: tests/e2e/features/coppa-consent.spec.ts (consent flow end-to-end with Stripe test
mode, webhook-fails reconciliation, revocation + 14-day grace + undo, cascade correctness
probes incl. sibling preservation, export contents incl. kid-private inclusion, rate limits,
RLS immutability probes). tsc -b clean, lint clean. Ask the founder before running shared-
fixture suites. NOTHING COMMITS until proof is green AND founder eyes-on clears; selective
staging; founder confirms before push. Post-build: Checkpoint 5 verification table (zero
Missing), regenerate live_schema, STUB_REGISTRY + WIRING_STATUS updates, CLAUDE.md convention
additions (propose the PRD's 22, founder trims), move build file to completed-builds.
```
