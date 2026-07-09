# Active Build: PRD-40 — COPPA Compliance & Parental Verification

> **Status: SLICE 1 COMPLETE, RLS-VERIFIED, PROOF GREEN — HOLDING for founder review + commit approval (2026-07-08).** Migration `00000000100305_prd40_coppa_foundation.sql` applied to production. 7 tables live (6 PRD-40 + `stripe_webhook_events`), `family_members` backfilled, `coppa_consent_templates` v1.0.0 seeded dormant, `child_data_tables` registry (175 entries) shipped with a self-updating completeness vitest, `staff_permissions` extended with `coppa_admin`, `feature_key_registry`/`feature_access_v2` seeded. Zero UI, zero Stripe, zero cascade SQL — exactly Slice 1 scope. **Nothing committed** — selective staging pending founder go-ahead (heavy parallel-session traffic in this tree; do not stage `.claude/rules/current-builds/PRD-31-subscriptions.md` or the two `claude/feature-decisions/PRD-31-*` files — those belong to a different concurrent session). Slice 2 (Stripe foundation) is next, gated on founder supplying TEST-mode Stripe keys.
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

- **2026-07-08 — Slice 1 (Schema + Registry) COMPLETE.** Worker session; dispatched via the seat with migration-numbering + shared-fixture addenda. What shipped:

  **Migration numbering.** Next free at dispatch time was **100305** (confirmed against `supabase migration list --linked` — 100289 through 100304 existed locally but were NOT yet applied remotely, five parallel sessions having landed them the same evening). Applied via `supabase db query --linked -f supabase/migrations/00000000100305_prd40_coppa_foundation.sql` (never `db push`, per the seat's instruction, to avoid dragging in the other sessions' unapplied migrations). Single migration file, no collisions.

  **Schema — 7 tables, 2 new `family_members` columns, 1 CHECK extension.** `coppa_consent_templates`, `parent_verifications`, `coppa_consents`, `parent_verification_attempts`, `parental_data_exports`, `retention_deletion_log` (the 6 PRD-40 tables) + `stripe_webhook_events` (decision file §3.3 shared infrastructure, service-role-only, zero policies, built now because Slice 1 owns the base schema pass — Slice 2 is its first real consumer). `family_members.coppa_age_bracket` (TEXT CHECK, NOT NULL DEFAULT 'adult') + `family_members.is_suspended_for_deletion` (BOOLEAN NOT NULL DEFAULT false). `staff_permissions.permission_type` CHECK extended with `'coppa_admin'` via the exact idempotent drop-and-recreate-by-discovered-name pattern from migration 100290 (the SM-B lesson — never guess the constraint name).

  **Deviation from the PRD's literal "New enum: X" language (documented in-migration):** used TEXT + CHECK constraints for all three "enums" (`verification_method`, `coppa_age_bracket`, `verification_attempt_status`), not native Postgres `CREATE TYPE ... AS ENUM`. Every other migration in this codebase uses the TEXT+CHECK idiom specifically because CHECK constraints can be ALTERed idempotently later (proven by the `coppa_admin` extension above) whereas native enum types require `ALTER TYPE ... ADD VALUE` outside a transaction block. Consistency with 150+ prior migrations wins; flagging in case this reads as a spec deviation.

  **Immutability RLS — the actual point of this migration.** `parent_verifications`: SELECT-only for mom (own family) + staff (all families); **zero** INSERT/UPDATE/DELETE policies for any authenticated role — service-role only, forever, even for mom's own row. `coppa_consents`: mom SELECT own family; mom UPDATE restricted via a **column-level GRANT** (`REVOKE UPDATE ... FROM authenticated; GRANT UPDATE (revoked_at, scheduled_deletion_at, revocation_reason) ... TO authenticated;`) layered under a family-scoped RLS USING/WITH CHECK — proven live by the RLS pass to reject a mixed statement touching one allowed + one disallowed column atomically (no partial-apply leak); zero DELETE policy. `coppa_consent_templates`: SELECT open to all authenticated (audit-replay), INSERT/UPDATE staff-only, zero DELETE (retirement is `retired_at`, never a real delete). `parent_verification_attempts` / `parental_data_exports`: mom SELECT own family + staff SELECT all; zero client write policy (service-role/future-RPC only — Slice 1 explicitly does not build the request paths). `retention_deletion_log`: staff-SELECT-only, mom sees nothing directly (her view is the per-child `deletion_completion_notes` JSONB). `stripe_webhook_events`: RLS enabled + `REVOKE ALL FROM authenticated, anon` + zero policies — confirmed completely unreachable by any client role, including staff.

  **Backfill (live counts, 20 total members across the founder's production family/families):** `under_13` = 6, `13_to_17` = 5, `adult` = 9. Derived from `date_of_birth` (age-accurate) where present, else the static `age` snapshot, defaulting `adult` per decision file R-2. Idempotent — only touches rows still at the column default with evidence to act on; `role='family'` shadow rows (Convention #273) explicitly excluded from the backfill predicate so they can never misclassify as a child.

  **Template seed.** `coppa_consent_templates` version `'1.0.0'` seeded with the Attorney Review Package draft text (`claude/legal-drafts/parental-consent-flow-copy-draft.md`, 2026-07-05) as the five section bodies, `lawyer_approved_at = NULL` — **the literal dormancy gate**, confirmed live: 1 row, `lawyer_approved_at IS NULL`. `notes` column flags the three `[FOUNDER INPUT NEEDED]` placeholders (privacy email/phone/mailing address) still open in Section 4 text, carried over verbatim from the ARP draft.

  **Feature keys.** `coppa_consent_review` + `coppa_consent_revoke` registered in `feature_key_registry`, and in `feature_access_v2` for `role_group='mom'` only at the essential tier with `is_enabled=true` — never tier-gated, matches "COPPA rights cannot be paywalled." No other role_group gets a row (PRD §Visibility & Permissions: dad/Special Adult/teen/kid see zero COPPA UI).

  **`notifications.category` (decision R-4):** confirmed via schema read that `notifications.category` is a bare `TEXT` column with **no CHECK constraint** — no migration change was needed to unlock category `'privacy'` for later slices' notifications. Documented, not touched.

  **THE REGISTRY — `src/lib/compliance/childDataTables.ts`, 175 entries.** Derived from two live `information_schema` queries (FK-reference walk to `family_members` across `public` + `platform_intelligence`, unioned with a naming-convention walk for `member_id`/`_member_id`/`_member_ids`-suffixed columns lacking a formal FK — this schema has many of the latter). 170 distinct feature tables + the 5 PRD-40 compliance-audit tables themselves (classified `preserve` — they're the evidence, not the data being protected) = 175. One false positive caught and removed during derivation: `families.primary_parent_id` looked plausible but actually `REFERENCES auth.users(id)` directly, not `family_members` — verified against the original migration `00000000000001_auth_family_setup.sql` before excluding it. Classification counts: **134 hard_delete, 33 scrub, 5 preserve (the compliance tables themselves), 3 not_applicable** (Special-Adult-only / primary-parent-only columns that can never resolve to a minor). Full table below.

  **THE PIN — `tests/coppa-registry-completeness.test.ts`, 5 tests, all green.** Static analysis (no live DB connection, matching every other migration-parsing vitest in this repo — `tests/list-type-constraint.test.ts` is the precedent pattern). Parses every `.sql` file in `supabase/migrations/` for `CREATE TABLE` bodies (balanced-paren walk, not regex greediness — `CHECK(...)` clauses nest parens) and `ALTER TABLE ... ADD COLUMN` statements, applies the same two-signal detection (explicit `REFERENCES family_members` + naming convention) used to derive the registry, and fails when any discovered table is missing a `CHILD_DATA_TABLES` entry. This durably enforces the CLAUDE.md convention going forward — a future PRD that adds a new child-scoped table will break this test in CI until someone classifies it. Caught two real gaps live during authoring (both fixed same-session): the migration's own 5 new tables needed `preserve` entries (initially omitted, since I was thinking "feature data" not "the audit trail itself"), and a schema-prefix normalization bug in the test's own comparison logic for `platform_intelligence.persona_promotion_queue`.

  **`scripts/full-schema-dump.cjs` DOMAIN_ORDER** taught the new "COPPA Compliance & Parental Verification (PRD-40)" domain (7 tables). `npm run schema:dump` re-run; `claude/live_schema.md` regenerated and confirms the new domain section with live row counts.

  **RLS verification — dispatched to the `rls-verifier` subagent, PASS, zero gaps, 81 probes.** Full dated section appended to `RLS-VERIFICATION.md` ("Migration 100305 — PRD-40 COPPA Compliance & Parental Verification (Slice 1 Foundation)", pure append, 195 lines, confirmed via `git diff --stat` that zero existing content was touched). Methodology: `SET LOCAL ROLE` + `SET LOCAL request.jwt.claims` JWT impersonation inside a single `BEGIN...ROLLBACK` transaction against production, covering mom/dad/special-adult/teen/guided-kid across two families + a genuinely-anonymous caller + a temp staff grant — everything destroyed by the rollback, zero residue confirmed by an independent post-transaction read. Findings: no non-mom role reads ANY COPPA data except `coppa_consent_templates` (by design — the disclosure text itself); `parent_verifications` genuinely immutable even for a staff/`coppa_admin` session; `coppa_consents`'s column-level grant correctly rejects a mixed-column UPDATE atomically (no partial apply); `retention_deletion_log` staff SELECT is genuinely family-unscoped while mom gets zero rows even for her own child; `stripe_webhook_events` fully closed to everyone including staff. **One documented, non-blocking observation:** `coppa_consents` has no INSERT policy for anyone (by design — Slice 3's `commit_consented_members` SECURITY DEFINER RPC per R-13 is the only insert path; flagging so Slice 3 doesn't reach for a bare `.insert()` and hit a silent 42501).

  **Proof.** `npx tsc -b` clean (zero errors). `npx eslint` clean on all touched TS files (the `.cjs` script is eslintignored by config, as expected — not an issue). `npx vitest run tests/coppa-registry-completeness.test.ts` — 5/5 green. Ran two nearby regression pins (`tests/list-type-constraint.test.ts` — pass; `tests/convention-lint.test.ts` — 2 PRE-EXISTING unrelated failures in `ArchiveMemberCard.tsx`, confirmed via `git status --porcelain` that this file is untouched by this session's diff, not a regression I introduced). Backfill counts verified by direct read-only query against production (pasted above). No E2E fixtures were needed for this slice (zero UI, zero RPCs reachable from a browser session yet) — the `COPPATEST` prefix convention is Slice 3+'s concern.

  **Live reality for Slice 2 (Stripe foundation):** `stripe_webhook_events` table exists and is ready to consume; `parent_verifications.stripe_payment_intent_id` has its unique-when-not-null index in place for the webhook idempotency requirement; no Stripe SDK dependency, no `_shared/stripe.ts`, no Edge Function exists yet — Slice 2 is a clean start. Founder still needs to supply TEST-mode `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` as Supabase secrets before Slice 2's proof can run live.

  **Nothing committed** — holding for founder review of this progress log + the classification table below, then selective staging of exactly this session's files (migration, `src/lib/compliance/`, the vitest, the 3 modified docs) — explicitly EXCLUDING the untracked `PRD-31-subscriptions.md` / `PRD-31-Subscription-Tiers.md` / `PRD-31-Tier-Chart-DRAFT.md` files, which belong to a different concurrent session.

  ### Full `child_data_tables` classification — 175 entries, for founder eyes

  *(Generated directly from `src/lib/compliance/childDataTables.ts` — the file is the source of truth; this is a snapshot for review, not a second copy to maintain. Sorted hard_delete → scrub → preserve → not_applicable, alphabetical within each group.)*

  | Table | Columns | Classification | Notes |
  |---|---|---|---|
  | `activity_log_entries` | member_id | **hard_delete** | The child's own activity feed entries. |
  | `ai_output_scans` | member_id | **hard_delete** | Decision file R-7/OD-2 explicit: PRD-41 append-only ethics-scan queue, hard-deleted under the COPPA carve-out. |
  | `ai_usage_tracking` | member_id | **hard_delete** | Per-row AI usage/cost attributed to this specific child. |
  | `allowance_configs` | family_member_id, pool_owner_member_id | **hard_delete** | The child's own allowance pool config. pool_owner_member_id folds under the same row (self-managed pool ownership stub). |
  | `allowance_dispatch_audit` | family_member_id | **hard_delete** | Single-child-scoped reconciliation audit row; hard delete with the config. |
  | `allowance_periods` | family_member_id | **hard_delete** | PRD explicit list item (matches tasks/task_completions). |
  | `archive_context_items` | member_id, added_by | **hard_delete** | Hard delete keyed on member_id — PRD Cascade rule: "Relationship notes about the child — hard delete." added_by (mom, usually) scrub only if member_id points elsewhere (child added a note about a sibling). |
  | `archive_folders` | member_id | **hard_delete** | The child's own archive folder tree. |
  | `archive_member_settings` | member_id | **hard_delete** | The child's own archive settings. |
  | `asset_suggestion_misses` | member_id | **hard_delete** | Low-value diagnostic telemetry row tied to a specific member session; hard delete for consistency/simplicity. |
  | `best_intentions` | member_id, related_member_ids | **hard_delete** | Owner row: hard delete on member_id. related_member_ids UUID[] on OTHER members' rows: scrub the child's id out. |
  | `beta_glitch_reports` | family_member_id | **hard_delete** | The child's own bug report, if any. |
  | `board_personas` | created_by | **hard_delete** | Family-scoped personal_custom personas are literally the child's own AI-toy creation (Convention #97: these NEVER enter the platform intelligence pipeline anyway) — treat as the child's own data. |
  | `board_sessions` | member_id | **hard_delete** | The child's own ThoughtSift session. |
  | `bookshelf_action_steps` | family_member_id | **hard_delete** | The child's own action step. |
  | `bookshelf_declarations` | family_member_id | **hard_delete** | The child's own declaration. |
  | `bookshelf_discussions` | family_member_id | **hard_delete** | The child's own BookShelf discussion conversation. |
  | `bookshelf_insights` | family_member_id | **hard_delete** | The child's own personal insight. |
  | `bookshelf_member_settings` | family_member_id | **hard_delete** | The child's own BookShelf settings. |
  | `bookshelf_questions` | family_member_id | **hard_delete** | The child's own question. |
  | `bookshelf_search_history` | member_id | **hard_delete** | The child's own search history. |
  | `bookshelf_summaries` | family_member_id | **hard_delete** | The child's own personal highlight/summary of a book. |
  | `bookshelf_user_state` | member_id | **hard_delete** | The child's own heart/note/is_included_in_ai state on extractions. |
  | `color_reveal_progress` | revealed_by_member_id | **hard_delete** | The child's own reveal progress (per-widget zone tracking). |
  | `coloring_gallery` | family_member_id | **hard_delete** | The child's own completed-coloring gallery. |
  | `communication_drafts` | author_id, about_member_id | **hard_delete** | Hard delete when EITHER author_id (child's own draft) or about_member_id (a draft ABOUT this child) matches the departing child. |
  | `contract_grant_log` | family_member_id | **hard_delete** | Decision file R-7/OD-2 explicit append-only ledger carve-out. |
  | `contracts` | created_by, family_member_id | **hard_delete** | Hard delete when family_member_id = child. NULL family_member_id = family-wide/per-kid-inheritance contract, untouched. created_by (mom) scrub. |
  | `conversation_space_members` | family_member_id | **hard_delete** | Join-table row: the child's own membership in a space. Hard delete the row, preserve the space and other members. |
  | `dashboard_configs` | family_member_id | **hard_delete** | The child's own dashboard layout config. |
  | `dashboard_widget_folders` | family_member_id | **hard_delete** | The child's own widget folder. |
  | `dashboard_widgets` | family_member_id, assigned_member_id | **hard_delete** | Hard delete keyed on family_member_id. Also carries multiplayer_participants UUID[] (scrub) and data_source_ids (ambiguous, flag for Slice 4 review). |
  | `deed_firings` | family_member_id | **hard_delete** | Decision file R-7/OD-2 explicit append-only ledger carve-out. |
  | `deferred_grants` | family_member_id | **hard_delete** | A pending grant queued specifically for this child. |
  | `earned_prizes` | family_member_id, created_by, redeemed_by, shared_with_member_ids | **hard_delete** | Hard delete keyed on family_member_id UNLESS NULL (Convention #278 family-level prize — then scrub only). created_by/redeemed_by scrub. |
  | `event_attendees` | family_member_id | **hard_delete** | PRD explicit rule: "hard delete child's attendee rows, keep events." |
  | `family_goal_contributions` | member_id | **hard_delete** | Decision file R-7/OD-2 append-only ledger carve-out. Deletion MUST trigger recompute of current_progress on active goals (Convention #278). |
  | `family_intention_iterations` | member_id | **hard_delete** | The child's own tally entry on a family intention. |
  | `family_requests` | sender_member_id, recipient_member_id, processed_by | **hard_delete** | Hard delete when EITHER sender or recipient is the child. processed_by (mom) scrub. |
  | `feature_demand_responses` | family_member_id, actual_voter_id | **hard_delete** | The child's own vote/note. |
  | `feature_discovery_dismissals` | member_id | **hard_delete** | The child's own permanent dismissal record. |
  | `feature_expansion_dismissals` | family_member_id, actual_dismisser_id | **hard_delete** | The child's own dismissal preference. |
  | `financial_transactions` | family_member_id | **hard_delete** | Convention #223/R-7/OD-2 append-only ledger carve-out. |
  | `food_restrictions` | member_id, created_by | **hard_delete** | "About the child" personal health data. created_by scrub. |
  | `gamification_configs` | family_member_id | **hard_delete** | The child's own gamification config. |
  | `gift_history` | member_id, counterparty_member_id | **hard_delete** | Hard delete keyed on member_id. counterparty_member_id scrub. |
  | `guided_form_responses` | family_member_id | **hard_delete** | The child's own worksheet answers. |
  | `guiding_stars` | member_id | **hard_delete** | PRD explicit list item. |
  | `homeschool_configs` | family_member_id | **hard_delete** | Convention #226 per-child override config. NULL rows are family-wide defaults, untouched. |
  | `homeschool_time_logs` | family_member_id, approved_by | **hard_delete** | PRD explicit personal compliance record. approved_by (mom) scrub. |
  | `intention_iterations` | member_id, acted_by | **hard_delete** | member_id = whose tally, hard delete. acted_by scrub if different. |
  | `journal_entries` | member_id | **hard_delete** | PRD explicit. Addendum (c): export path deliberately does NOT filterKidPrivate(). |
  | `journal_prompts` | family_member_id | **hard_delete** | The child's own personal journal prompt (BookShelf-sourced). |
  | `journal_visibility_settings` | child_member_id, parent_member_id | **hard_delete** | Keyed on child_member_id. |
  | `lila_conversations` | member_id | **hard_delete** | Also subject to the 90-day rolling retention sweep independent of consent status. |
  | `lila_ethics_rejections` | member_id | **hard_delete** | Decision file R-7/OD-2 append-only carve-out. |
  | `lila_member_preferences` | member_id | **hard_delete** | Per-child AI tone/preference config. |
  | `lila_tool_permissions` | member_id | **hard_delete** | Also carries context_person_ids UUID[] — scrub departing child's id out of OTHER members' rows. |
  | `list_item_member_tracking` | family_member_id | **hard_delete** | Per-member completion tracking specific to this child. |
  | `lists` | owner_id, created_by, archive_member_id, subject_member_id | **hard_delete** | Keyed on owner_id OR subject_member_id (PRD-43 gift-ideas list ABOUT this child). created_by/archive_member_id scrub otherwise. |
  | `loans` | family_member_id | **hard_delete** | The child's own loan/balance record. |
  | `meal_feedback` | member_id, acted_by | **hard_delete** | The child's own reaction/feedback on a meal. |
  | `meeting_agenda_items` | added_by, related_member_id | **hard_delete** | Hard delete when related_member_id = child. added_by scrub when different. |
  | `meeting_participants` | family_member_id | **hard_delete** | Join-table row: the child's own participation record. |
  | `meeting_schedules` | created_by, related_member_id | **hard_delete** | Hard delete keyed on related_member_id. created_by (mom) scrub. |
  | `meetings` | facilitator_member_id, related_member_id, started_by | **hard_delete** | Hard delete keyed on related_member_id. Others scrub. |
  | `member_coloring_reveals` | family_member_id | **hard_delete** | The child's own coloring-reveal progress. |
  | `member_creature_collection` | family_member_id | **hard_delete** | The child's own earned creature collection. |
  | `member_emails` | family_member_id | **hard_delete** | Rare for a child under 13; hard delete if present. |
  | `member_feature_toggles` | member_id, disabled_by | **hard_delete** | Per-child config. disabled_by scrub if it's the departing child acting on a sibling's toggle. |
  | `member_messaging_permissions` | member_id, can_message_member_id | **hard_delete** | Hard delete keyed on member_id. can_message_member_id scrub. |
  | `member_page_unlocks` | family_member_id | **hard_delete** | The child's own sticker-page unlock history. |
  | `member_permissions` | granting_member_id, target_member_id, granted_to | **hard_delete** | Keyed on target_member_id/granted_to. granting_member_id scrub. |
  | `member_sticker_book_state` | family_member_id | **hard_delete** | The child's own sticker book state. |
  | `message_coaching_settings` | family_member_id | **hard_delete** | The child's own coaching toggle. |
  | `message_read_status` | family_member_id | **hard_delete** | Join-table row: the child's own read-receipt. |
  | `messages` | sender_member_id | **hard_delete** | Data collected FROM the child (their own authored PII). |
  | `mindsweep_approval_patterns` | member_id | **hard_delete** | The child's own learned auto-route pattern. |
  | `mindsweep_events` | member_id | **hard_delete** | The child's own sweep event log. |
  | `mindsweep_holding` | member_id | **hard_delete** | The child's own captured-but-unprocessed items. |
  | `mindsweep_settings` | member_id | **hard_delete** | The child's own MindSweep settings. |
  | `mom_self_restrictions` | target_member_id, primary_parent_id | **hard_delete** | Keyed on target_member_id. primary_parent_id always mom, N/A. |
  | `notepad_routing_stats` | member_id | **hard_delete** | Per-member routing frequency stats. |
  | `notepad_tabs` | member_id | **hard_delete** | The child's own Smart Notepad tabs. |
  | `notification_preferences` | family_member_id | **hard_delete** | The child's own preference config. |
  | `notifications` | recipient_member_id | **hard_delete** | Notifications addressed to this child. |
  | `persona_favorites` | member_id | **hard_delete** | The child's own favorited personas. |
  | `point_transactions` | family_member_id, acted_by | **hard_delete** | Decision file R-7/OD-2 append-only ledger carve-out. |
  | `practice_log` | family_member_id | **hard_delete** | The child's own practice session log. |
  | `private_notes` | about_member_id, author_id | **hard_delete** | PRD explicit "relationship notes about the child" rule, keyed on about_member_id. |
  | `randomizer_draws` | family_member_id | **hard_delete** | The child's own draw record. |
  | `reflection_prompts` | member_id | **hard_delete** | The child's own reflection prompt set. |
  | `reflection_responses` | member_id | **hard_delete** | The child's own reflection answers. |
  | `relationship_notes` | author_id, person_a_id, person_b_id | **hard_delete** | PRD explicit rule, hard delete when EITHER person_a_id or person_b_id is the child. |
  | `reward_proposals` | proposer_member_id, processed_by | **hard_delete** | Hard delete when proposer_member_id = child. processed_by (mom) scrub. |
  | `reward_reveal_attachments` | family_member_id | **hard_delete** | The child's own reveal attachment. |
  | `reward_shop_purchases` | family_member_id, acted_by, processed_by | **hard_delete** | The child's own purchase/spend record. |
  | `rhythm_completions` | member_id | **hard_delete** | The child's own rhythm completion record. |
  | `rhythm_configs` | member_id | **hard_delete** | The child's own rhythm configuration. |
  | `routine_step_completions` | family_member_id, member_id | **hard_delete** | The child's own step-completion records. |
  | `safety_flags` | flagged_member_id, reviewed_by | **hard_delete** | The whole point of PRD-30 is monitoring THIS child; hard delete on revocation. |
  | `safety_monitoring_configs` | monitored_member_id, created_by | **hard_delete** | The child's own monitoring toggle. |
  | `safety_notification_recipients` | recipient_member_id | **hard_delete** | Rare for a child to be a recipient; hard delete if it occurs. |
  | `safety_pattern_summaries` | monitored_member_id | **hard_delete** | The child's own weekly digest summaries. |
  | `safety_sensitivity_configs` | monitored_member_id | **hard_delete** | The child's own per-category sensitivity config. |
  | `self_knowledge` | member_id | **hard_delete** | PRD explicit list item (InnerWorkings). |
  | `special_adult_assignments` | child_id, special_adult_id | **hard_delete** | Hard delete keyed on child_id. special_adult_id N/A (always adult). |
  | `studio_queue` | owner_id, requester_id | **hard_delete** | Keyed on owner_id. requester_id scrub. |
  | `task_assignments` | family_member_id, member_id, assigned_by | **hard_delete** | Assignment record keyed to this child. assigned_by scrub. |
  | `task_claims` | member_id, claimed_by | **hard_delete** | The child's own opportunity claim. |
  | `task_completions` | family_member_id, member_id, acted_by, approved_by | **hard_delete** | PRD explicit list item. acted_by/approved_by scrub if different from the completer. |
  | `task_segments` | family_member_id | **hard_delete** | The child's own day-segment config (Build M). |
  | `tasks` | assignee_id, created_by, in_progress_member_id, mastery_approved_by | **hard_delete** | PRD explicit "child is assignee or creator." Hard delete keyed on assignee_id; others scrub. |
  | `teaching_skill_history` | member_id, about_member_id | **hard_delete** | Hard delete when EITHER member_id or about_member_id matches. |
  | `teen_sharing_overrides` | member_id | **hard_delete** | Designed for teens (13-17); classified for completeness. |
  | `time_sessions` | family_member_id, started_by, edited_by | **hard_delete** | Hard delete keyed on family_member_id. |
  | `timer_configs` | family_member_id | **hard_delete** | The child's own timer preferences. |
  | `user_saved_prompts` | user_id, shared_with_member_id | **hard_delete** | Hard delete keyed on user_id. shared_with_member_id scrub. |
  | `vault_content_requests` | user_id | **hard_delete** | The child's own content request. Note: "user_id" genuinely FKs to family_members(id), not auth.users. |
  | `vault_copy_events` | user_id | **hard_delete** | The child's own copy-event log. |
  | `vault_first_sightings` | user_id | **hard_delete** | The child's own first-seen tracking. |
  | `vault_tool_sessions` | user_id | **hard_delete** | The child's own tool session. |
  | `vault_user_bookmarks` | user_id | **hard_delete** | The child's own bookmarks. |
  | `vault_user_progress` | user_id | **hard_delete** | The child's own progress tracking. |
  | `vault_user_visits` | user_id | **hard_delete** | The child's own visit log. |
  | `victories` | family_member_id, moms_pick_by | **hard_delete** | Hard delete keyed on family_member_id. moms_pick_by always mom. |
  | `victory_celebrations` | family_member_id | **hard_delete** | The child's own celebration narrative. |
  | `victory_voice_preferences` | family_member_id | **hard_delete** | The child's own voice preference. |
  | `view_as_permissions` | target_member_id, viewer_id | **hard_delete** | Keyed on target_member_id. |
  | `view_as_sessions` | viewer_id, viewing_as_id | **hard_delete** | Addendum (b)(5): rows where viewing_as_id = child are hard-deleted; view_as_feature_exclusions cascades via session FK. |
  | `visual_schedule_member_assignments` | family_member_id | **hard_delete** | The child's own assigned visual-schedule routine. |
  | `visual_schedule_member_tasks` | family_member_id | **hard_delete** | The child's own visual-schedule task state. |
  | `widget_data_points` | family_member_id, recorded_by_member_id | **hard_delete** | Hard delete keyed on family_member_id. |
  | `widget_templates` | family_member_id | **hard_delete** | The child's own saved widget template. |
  | `assign_task_godmother_configs` | specific_member_id | **scrub** | Auto-assignment target config; scrub the reference, config preserved. |
  | `bookshelf_collections` | created_by_member_id | **scrub** | Scrub authorship, preserve collection for family. |
  | `bookshelf_items` | uploaded_by_member_id | **scrub** | Scrub uploader; book preserved for family library. |
  | `bookshelf_shares` | shared_by_member_id, shared_with_member_id | **scrub** | Scrub whichever reference is the departing child. |
  | `calendar_events` | created_by, approved_by, acted_by | **scrub** | Shared family calendar items, not one child's exclusive data. |
  | `conversation_spaces` | created_by | **scrub** | Scrub authorship; space preserved for remaining members. |
  | `conversation_threads` | started_by | **scrub** | Scrub actor; thread preserved for other participants. |
  | `countdowns` | created_by_member_id | **scrub** | Mom-authored in practice; scrub, preserve countdown. |
  | `family_best_intentions` | created_by_member_id, participating_member_ids | **scrub** | Scrub authorship + remove child's id from participants array. |
  | `family_goals` | created_by, participating_member_ids | **scrub** | Scrub created_by + remove child's id from participants array. |
  | `family_overview_configs` | family_member_id, selected_member_ids | **scrub** | family_member_id is the viewing mom/adult's own config; scrub child's id from selected_member_ids. |
  | `gift_claims` | claimed_by_member_id | **scrub** | Scrub claimant reference, preserve claim record for the gift recipient. |
  | `list_items` | added_by, checked_by, gift_for, in_progress_member_id, mastery_approved_by | **scrub** | Own-list items cascade via `lists` hard-delete; this covers the child as ACTOR on someone else's list. |
  | `list_shares` | member_id, shared_with | **scrub** | shared_with = child received a share — remove access row, preserve share. |
  | `list_templates` | created_by | **scrub** | Mom-authored; scrub authorship, preserve template. |
  | `meal_plan_entries` | cook_member_id, created_by, kids_helped_member_ids | **scrub** | Scrub cook/created_by + remove child's id from kids_helped array. |
  | `meal_pointers` | created_by | **scrub** | Mom-authored "how WE do it" note; scrub authorship. |
  | `meeting_templates` | created_by, default_partner_id | **scrub** | Mom-authored template; scrub, also scrub default_participant_ids array. |
  | `mindsweep_allowed_senders` | added_by | **scrub** | Family-level list; scrub actor. |
  | `out_of_nest_members` | invited_by | **scrub** | Scrub invited_by if it was the child; preserve the out-of-nest record. |
  | `pending_changes` | created_by, affected_member_ids | **scrub** | Scrub created_by + remove child's id from affected_member_ids array. |
  | `permission_presets` | created_by | **scrub** | Scrub authorship; preserve the preset for the family. |
  | `perspective_lenses` | created_by | **scrub** | Scrub authorship if child-created; preserve lens. |
  | `platform_intelligence.persona_promotion_queue` | submitted_by_member_id | **scrub** | Per Convention #97 a child's persona should never reach here; scrub defensively. |
  | `purchase_history` | purchased_by | **scrub** | Scrub actor, preserve purchase record for the list/family. |
  | `recipe_versions` | created_by | **scrub** | Scrub authorship, preserve version. |
  | `recipes` | created_by | **scrub** | Scrub authorship, preserve recipe for family. |
  | `reveal_animation_pools` | created_by | **scrub** | Scrub authorship, preserve pool. |
  | `reward_reveals` | created_by | **scrub** | Scrub authorship, preserve config. |
  | `reward_shop_items` | created_by, audience_member_ids | **scrub** | Scrub created_by + remove child's id from audience array. |
  | `task_templates` | created_by | **scrub** | Scrub authorship, preserve template for siblings. |
  | `wishlist_share_links` | created_by | **scrub** | Scrub authorship, preserve link. |
  | `wizard_templates` | original_author_id | **scrub** | Scrub authorship, preserve template for family. |
  | `coppa_consents` | child_member_id, parent_member_id | **preserve** | Never hard-deleted — the row IS the legal evidence of consent/revocation timing. |
  | `parent_verification_attempts` | parent_member_id, verification_id | **preserve** | Preserved permanently — documents the parent's verification history. |
  | `parent_verifications` | parent_member_id | **preserve** | Immutable audit trail, no UPDATE/DELETE ever, including admin. |
  | `parental_data_exports` | child_member_id, parent_member_id | **preserve** | Time-based (90-day) retention rule, NOT a consent-revocation cascade action. |
  | `retention_deletion_log` | child_member_id | **preserve** | The audit trail OF the deletion cascade itself — must outlive the deletions it records. |
  | `access_schedules` | member_id | **not_applicable** | Special Adult/co-parent scheduling; adults only in practice. |
  | `account_deletions` | requested_by | **not_applicable** | Account-level action; always the account-holding parent. |
  | `shift_sessions` | special_adult_id | **not_applicable** | Special Adults are always adults. |

## Post-Build Verification

*(Checkpoint 5 — every PRD MVP item + every R-ruling + OD outcome: Wired / Stubbed / Missing. Zero Missing. Copy to the feature decision file at close-out.)*

| Requirement | Status | Evidence |
|---|---|---|
| *(build time)* | | |
