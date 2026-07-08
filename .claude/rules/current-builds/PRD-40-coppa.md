# Active Build: PRD-40 — COPPA Compliance & Parental Verification

> **Status: PRE-BUILD APPROVED (founder, 2026-07-07) — OD-1..4 all resolved per recommendations; Two-Door Addendum LANDED (`prds/addenda/PRD-40-Two-Door-Auth-Addendum.md`). Slice-1 dispatch prompt READY below — NOT dispatched; the coordination seat sequences it. No code, no migrations.**
> Auditor: Fable judgment session per the locked routing policy; read-only on code.
> Authority chain: `prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md` (full read, every word) → `claude/dispatch-factory/PRD40.md` (approved pack — D-PRD40-1..6 RESOLVED 2026-07-04 + Attorney Review Package amendment) → `claude/dispatch-factory/PRD40-RECON.md` → **`claude/feature-decisions/PRD-40-COPPA-Compliance.md` (THE ruling record — R-1..R-14, the Stripe boundary, the cascade taxonomy, the addendum draft; read it first, it wins over stale PRD text)** → this file (slice plan + dispatch prompts).
> **Migration discipline: NO numbers reserved.** Last seen tonight: 100301 — and five parallel sessions landed 100289–100301 in a single evening. Take the next free number at file-creation time, re-verify immediately before applying, and apply only this build's idempotent SQL via `supabase db query --linked -f` when foreign unapplied migrations are pending.
>
> 2026-07-07 — **Step 0 override (Convention #241), recorded for founder acknowledgment:** codegraph reported not-initialized at session start (same lock/state class cleared with founder approval 2026-07-05/06); AURI (endor-cli-tools) known-down since 2026-07-05. Proceeded Grep/Glob-only per the PRD-30 audit precedent — read-only judgment session, no code written, low impact. Implementation workers MUST re-run Step 0 at their own session starts.

---

## Source material read (this session, in full)

- `prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md` — all 1258 lines
- `claude/dispatch-factory/PRD40.md` (approved pack) + `PRD40-RECON.md` (evidence brief) + `PRD31.md` (for the Stripe boundary)
- `claude/legal-drafts/` — attorney-cover-memo, parental-consent-flow-copy-draft (two-door coverage verified), data-practices-summary §8 (the mandatory kid-privacy question)
- No PRD-40 addenda exist (glob-verified) — the Two-Door Addendum is drafted in the decision file §6, pending OD-1
- Freshness delta: `git log --since=2026-07-04` (23 commits — safety stack, PECON, PRD-42/43, night batches); live code verification of every load-bearing pack claim (results in the decision file §1–§2)
- Always-relevant addenda: PRD-31-Permission-Matrix (zero COPPA rows), PRD-Audit-Readiness (disciplines already baked into the slice plan)

## The headlines the founder needs

1. **Everything the pack promised still holds, and one thing got easier.** COPPA and Stripe are both still 100% unbuilt (re-verified live tonight). The roster retrofit is SMALLER than the PRD assumed: `FamilySetup.tsx` is the single `family_members` insert choke point in the whole frontend — bulk-AI and manual add already converge on one save path, so the consent gate lands in one place plus the member-edit path.
2. **The Slice-0 addendum doesn't exist, but the Attorney Review Package already did its legal half.** The 2026-07-05 ARP discloses PINs, picture passwords, and shadow accounts in parent-readable language. The remaining technical half (cascade additions for two-door artifacts, Key Decision 7 amendment, cohort framing) is drafted and ready in the decision file §6 — OD-1 asks whether I land it in `prds/addenda/` this session (recommended) or a separate session does.
3. **Tonight's safety stack created one genuinely new decision: append-only ledgers vs. the federal deletion right (OD-2).** Since April the platform grew a family of append-only tables (`financial_transactions`, `point_transactions`, `family_goal_contributions`, `lila_ethics_rejections`, `ai_output_scans`...). Recommendation: the COPPA cascade is their sole sanctioned deleter, with a one-sentence carve-out added to each convention.
4. **The deletion-cascade registry must be derived from the LIVE schema, not the PRD's April table list** — ~40+ child-scoped tables have appeared since (points, safety, ethics, wishlists, meals, goals, two-door auth artifacts). Slice 1 derives it systematically and pins it with a registry-completeness test so every FUTURE child-scoped table fails CI until classified. That test is the durable form of the PRD's registry convention.
5. **Email is a live cross-build dependency (OD-3):** PRD-30 SM-C (in flight tonight) builds the platform's first outbound email sender as its last item. PRD-40's receipts and deletion reminders should consume it, never build a second one. Everything else in PRD-40 is email-independent while dormant.
6. **The Stripe boundary with PRD-31 is drawn exactly** (decision file §3): PRD-40 builds `_shared/stripe.ts`, the purpose-routed `stripe-webhook-handler`, router-level event dedup, the $1 intent function, and the reconciliation cron; PRD-31 extends the same router with its five subscription events and owns `family_subscriptions`. One handler, one client module, a named customer-id handoff.
7. **One dormant-mode behavior needs your confirmation (OD-4):** while no lawyer-approved template exists, an under-13 add by a non-founder family is blocked with a warm "almost ready" card — the only legally coherent reading of dormant-but-built. Cohort-1 invitees never see it.
8. **Your kids' LiLa history:** once brackets backfill and the retention cron lands, the 90-day rolling sweep applies to your under-13 kids' conversations (R-12). Policy working as designed — flagged so it's never a surprise. Export first if you want a keepsake.

## Founder decisions

- **D-PRD40-1..6: RESOLVED 2026-07-04** (pack) — not reopened. Attorney Review Package DELIVERED 2026-07-05.
- **OD-1..4: ✅ ALL RESOLVED per recommendations (founder, 2026-07-07)** — addendum landed this session; append-only ledgers hard-delete with convention carve-outs; email via SM-C's shared sender only; dormant "almost ready" block card confirmed. Verbatim resolutions recorded in the decision file §7.
- **Founder external actions** (§8): Stripe test keys before Slice 2 proof; send the ARP to counsel; Resend key rides SM-C; backfill ceremony at Slice 6.

## Dependencies verified in place

SAFETY-BETA-GATE C/B/A + E deployed (shadow) ✓ · PRD-30 SM-A/B live, SM-C in flight ✓ · privacy-filter role-asymmetric fix (migration 100149) ✓ · notifications pipeline (PRD-15) ✓ · Admin shell (3 tabs; COPPA = 4th row + `staff_permissions` CHECK extension) ✓ · Convention #246 cron/Vault ✓ · two-door auth (Convention #273) — artifacts mapped into the cascade ✓ · single roster-insert choke point ✓

## Dependencies NOT in place (dispositioned)

Outbound email (SM-C, OD-3) · Stripe keys (founder action) · attorney sign-off (cohort-2 gate, never a build gate) · PRD-41 enforcement flip (cohort-2 gate, R-11) · PRD-20 Safe Harbor gate — N/A-backburnered (ship the bracket, skip the wiring)

## Slice plan (Sonnet xhigh workers, sequential — each slice one fresh session, per-slice progress log below)

| Slice | Scope | Notes |
|---|---|---|
| 1 | **Schema + registry.** 6 tables + 3 enums + 2 `family_members` columns + bracket backfill for existing members + immutability RLS (no-UPDATE/DELETE; service-role INSERT) + `stripe_webhook_events` dedup table + notifications category handling (R-4) + `child_data_tables` registry derived from live schema with founder-visible classification table + registry-completeness vitest + template seed `1.0.0` (`lawyer_approved_at` NULL) + feature keys + admin CHECK extension + DOMAIN_ORDER + schema:dump | rls-verifier pass required; #280 auth-gates on every new SECURITY DEFINER function |
| 2 | **Stripe foundation** per the boundary (decision file §3): `_shared/stripe.ts`, purpose-routed `stripe-webhook-handler` (`verify_jwt=false`, signature auth, config.toml entry), `create-coppa-verification-intent` (mom-only, rate-limited), reconciliation cron | Founder supplies TEST keys before proof; duplicate-event idempotency probe mandatory |
| 3 | **Consent UX Screens 1–7 + roster retrofit.** 5-section scroll-enforced modal, Screen 6 success, Screen 7 acknowledgment; `FamilySetup.handleSave` gate + held-pending state + `commit_consented_members` RPC (R-13) + post-commit PIN/shadow pipeline resume + bracket derivation UI (AI parse + manual radio + edit path) + R-8 dormant-block card | HITM n/a (no AI output); ModalV2 full-screen; Lucide only |
| 4 | **Rights + lifecycle** (heaviest correctness slice). Screen 8 Settings, Screen 9 revocation (type-to-confirm, 14-day grace, undo), per-child export ZIP (private bucket, signed 7-day URL, kid-private inclusion per D-PRD40-3 with in-code rationale), deletion cascade per taxonomy incl. two-door teardown + OD-2 ledgers + goal recompute, 3 retention crons, `retention_deletion_log`; email touchpoints against SM-C's shared sender (OD-3) | R-10 session gating on every surface; cascade correctness probes are the proof centerpiece |
| 5 | **Enforcement.** `util.coppa_write_allowed()` + RESTRICTIVE write gates generated from the registry + `useCoppaConsent()` + `_shared/coppa-consent.ts` + AI-call gating + `computeIsUnder13` reconciliation (R-2) + aggregation CI seed script | Inert for consented/13+ members by construction |
| 6 | **Admin tab (4th row) + E2E + close-out.** `/admin/coppa`, `tests/e2e/features/coppa-consent.spec.ts` (consent E2E in Stripe test mode incl. signed-webhook simulation, duplicate-event probe, webhook-fails reconciliation, revocation grace + undo, cascade probes incl. sibling preservation + shadow-account teardown, export contents, rate limits, RLS immutability + R-10 session probes, registry-completeness), LiLa knowledge (Convention #14 Part B), Convention #277 eyes-on tour, **founder backfill ceremony (R-9, founder present)**, verification tables | Checkpoint 5 gate: Fable if available, else Opus |
| Gate | Cohort-2 opener (post-build, calendar): attorney approval → `lawyer_approved_at` · PRD-41 Phase-4 flip · live Stripe keys | Not a slice |

## Universal rules baked into every slice (do not re-litigate in-session)

- The decision file's rulings R-1..R-14 are LAW; where the PRD text disagrees, the ruling wins and the worker records it in the verification table.
- Consent templates ship `lawyer_approved_at=NULL`; the live flow stays INERT for real users (R-8 block card). Sibling-data preservation is the load-bearing cascade rule. `filterKidPrivate()` is never weakened (D-PRD40-3).
- Convention #257 (server-derived dates), #246 (crons via `util.invoke_edge_function`, `--no-verify-jwt` + in-code auth), #280 (auth-gate every SECURITY DEFINER function taking bare ids — rls-verifier proves it live), #223-family carve-out per OD-2, config.toml entry for every new Edge Function, Lucide-only, theme tokens only, ModalV2.
- COPPA UI/RPCs: mom's REAL session only (R-10) — reject family-shadow, member-shadow, and View-As scope; probes pin it.
- Proof = Playwright driving REAL flows with service-role DB assertions (COPPATEST fixture prefix, swept beforeAll+afterAll, zero residue). Ask the founder before running shared-fixture suites and before deploying ANY Edge Function. NOTHING COMMITS until proof is green and founder confirms; selective staging — heavy parallel-session traffic in this tree.

## Dispatch prompts

The pack's dispatch prompt (`claude/dispatch-factory/PRD40.md` §DISPATCH PROMPT) remains the base. Slice-1's prompt is READY below (founder-approved 2026-07-07, **not yet dispatched — the coordination seat sequences it**). Per-slice prompts for Slices 2–6 are generated at dispatch time from the slice table — each must carry: the model header, READ FIRST = decision file → this file → PRD + addendum → pack, the freshness preamble (git log since dispatch date, migration-number re-check, SM-C email-sender landing status for Slice 4, PRD-31 landing status for Slice 2), the universal rules block above, and that slice's row as the scope contract.

### Slice 1 dispatch prompt (paste into a FRESH session when the seat sequences it)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the Slice-1 worker for PRD-40 — COPPA Compliance & Parental
Verification: schema, enums, backfills, immutability RLS, the child-data
registry, and its completeness pin. Zero UI, zero Stripe in this slice.
Pre-build complete and founder-approved 2026-07-07; all decisions RESOLVED
(D-PRD40-1..6 + OD-1..4) — build exactly what the rulings say, no scope
trimming, no simpler-for-now substitutions.

FRESHNESS PREAMBLE (before anything): run `git log --oneline
--since=2026-07-07`; re-read CLAUDE.md conventions added since; confirm
`prds/addenda/PRD-40-Two-Door-Auth-Addendum.md` EXISTS (if absent, STOP and
tell the founder); check the next free migration number at file-creation
time AND re-check immediately before applying — five parallel sessions
landed 100289–100301 in one evening. If foreign unapplied migrations are
pending, apply ONLY yours via `supabase db query --linked -f` with
idempotent SQL — never `db push`.

READ FIRST (in order):
1. claude/feature-decisions/PRD-40-COPPA-Compliance.md — THE ruling record.
   R-1..R-14 are LAW; §3 is the Stripe boundary (Slice 2's, but your
   stripe_webhook_events table serves it); §5 is your cascade-taxonomy
   anchor set; §7 records the resolved decisions.
2. prds/addenda/PRD-40-Two-Door-Auth-Addendum.md — cascade additions (b),
   Key Decision 7 amendment (c), cohort framing (d).
3. prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md —
   §Data Schema (L561-701) is your table spec; §Retention (L831-879) for
   retention_deletion_log; §Edge Cases L948-958 as the HISTORICAL cascade
   list your registry derivation supersedes.
4. .claude/rules/current-builds/PRD-40-coppa.md (auto-loads) — slice table
   + universal rules.

BUILD:
1. Migration(s), idempotent: `parent_verifications`, `coppa_consents`,
   `coppa_consent_templates`, `parent_verification_attempts`,
   `parental_data_exports`, `retention_deletion_log` exactly per the PRD's
   column tables + `coppa_consents.deletion_completion_notes`; 3 enums
   (verification_method, coppa_age_bracket, verification_attempt_status);
   `family_members.coppa_age_bracket` (TEXT enum, NOT NULL DEFAULT 'adult')
   + `is_suspended_for_deletion` (BOOLEAN NOT NULL DEFAULT false);
   `stripe_webhook_events` dedup table per decision file §3.3; all indexes
   incl. the partial unique constraints (one active verification per
   parent; one active consent per child; scheduled-deletion job index).
2. RLS per the PRD's per-table policy specs — immutability is the point:
   NO UPDATE/DELETE policies on parent_verifications ever; coppa_consents
   mom-UPDATE limited to revocation fields only, no DELETE ever; templates
   immutable once published (retire-not-update); attempts service-INSERT;
   retention log admin-SELECT/service-INSERT. Admin read paths gate on
   staff_permissions. Extend the staff_permissions.permission_type CHECK
   with 'coppa_admin' (SM-B lesson: the CHECK rejects new types unless
   extended in the same migration).
3. Backfill `coppa_age_bracket` for ALL existing family_members from
   date_of_birth (age-accurate) else the static age column, default
   'adult' (decision file R-2). Read-verify counts per bracket after apply
   and paste them in your progress-log entry.
4. Seed `coppa_consent_templates` version '1.0.0' with the ARP draft text
   from claude/legal-drafts/parental-consent-flow-copy-draft.md as
   placeholder section bodies, lawyer_approved_at NULL — the literal
   dormancy gate.
5. Feature keys `coppa_consent_review` + `coppa_consent_revoke` in
   feature_key_registry + feature_access_v2 (always-true, never
   tier-gated). Handle the notifications category per decision file R-4
   (verify whether notifications.category is CHECK-constrained; if yes,
   extend with 'privacy' in this migration).
6. THE REGISTRY (decision file R-6): derive `child_data_tables` by walking
   the live schema for every table carrying a member-referencing column;
   classify each as hard_delete / scrub / preserve / not_applicable per
   the PRD's 8-rule taxonomy anchored by decision file §5 + addendum §(b)
   (shadow-account teardown, auth columns, view_as_sessions). Ship it as a
   TypeScript constant with per-table metadata (member column name,
   classification, scrub instructions where applicable). Present the FULL
   classification table in the active build file for founder eyes.
7. THE PIN: a vitest (tests/coppa-registry-completeness.test.ts) that
   enumerates member-referencing columns from the schema snapshot and
   FAILS when any table is unclassified in the registry — the durable form
   of the PRD's registry convention. New tables added by future builds
   must break this test until classified.
8. Teach scripts/full-schema-dump.cjs DOMAIN_ORDER the 6 new tables, run
   `npm run schema:dump` after apply.

HARD RULES: Convention #280 — every new SECURITY DEFINER function taking a
bare id carries a family-membership + role gate from birth (this slice
should need few or none; flag any you create). Convention #257 — no
client-derived dates anywhere. The append-only carve-out (OD-2) is Slice
4's cascade concern — your RLS ships the ledger tables' existing policies
untouched. Do NOT build the cascade, crons, Stripe, or any UI — later
slices own them.

PROOF: rls-verifier pass over all 6 new tables against all 5 roles + a
cross-family probe (immutability probes: mom cannot UPDATE/DELETE
parent_verifications even her own; kid sessions read NOTHING from any
COPPA table; admin path works only with staff_permissions); registry-
completeness vitest green; backfill verification counts; tsc -b clean;
lint clean. COPPATEST fixture prefix if any E2E fixtures are needed, swept,
zero residue. Ask the founder before running shared-fixture suites.
NOTHING COMMITS until proof is green AND the founder confirms; selective
staging — heavy parallel-session traffic in this tree. Fill your
progress-log entry in the active build file (migration numbers actually
taken, the registry classification table, live reality for Slice 2).
```

## Mom-UI Surfaces

- Consent flow Screens 1–7 (full-screen modal + acknowledgment modal) — shells: mom only, new
- FamilySetup preview: under-13 indicators + bracket radio + R-8 dormant card — shells: mom, modification
- Settings → Privacy & Consent (Screen 8) + revocation flow (Screen 9) + export — shells: mom only, new
- Member edit: bracket selector + age-transition nudge — shells: mom, modification
- `/admin/coppa` (Screen 10) — founder/staff only, new
- Kid/adult/teen/Special-Adult shells: **zero COPPA surfaces** (verified absence is a test target)

## Mom-UI Verification

*(Convention #277 Claude-driven tour at Slice 6 — desktop/tablet/mobile as mom + zero-surface probes as other roles.)*

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| *(build time)* | | | | | | |

## Progress Log

*(Each slice worker appends at checkpoint: what shipped, migration numbers actually taken, deviations, live reality for the next slice.)*

- 2026-07-07 — Pre-build audit complete (this file + `claude/feature-decisions/PRD-40-COPPA-Compliance.md`).
- 2026-07-07 — **Founder approved the summary; OD-1..4 all resolved per recommendations.** Two-Door Addendum landed at `prds/addenda/PRD-40-Two-Door-Auth-Addendum.md`; decision file §6/§7 updated to record resolutions. Slice-1 dispatch prompt prepared above — HOLDING for the coordination seat to sequence dispatch.

## Post-Build Verification

*(Checkpoint 5 — every PRD MVP item + every R-ruling + OD outcome: Wired / Stubbed / Missing. Zero Missing. Copy to the feature decision file at close-out.)*

| Requirement | Status | Evidence |
|---|---|---|
| *(build time)* | | |
