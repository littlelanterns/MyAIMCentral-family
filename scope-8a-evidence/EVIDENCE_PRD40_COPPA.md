# Scope 8a — PRD-40 COPPA Evidence Pass

> Worker pass executed: 2026-04-20
> Items covered: 8a-CL-01 through 8a-CL-16
> Primary tools: Grep + Glob + Read
> Scope: verify whether PRD-40 infrastructure is BUILT (not the quality of the PRD itself)

---

## Summary table

| Item | Claim | Proposed verdict | Confidence | Evidence anchor |
|---|---|---|---|---|
| 01 | `parent_verifications` table | FAIL | high | No migration, not in live_schema.md |
| 02 | `coppa_consents` table | FAIL | high | No migration, not in live_schema.md |
| 03 | `coppa_consent_templates` table | FAIL | high | No migration, not in live_schema.md |
| 04 | `parent_verification_attempts` table | FAIL | high | No migration, not in live_schema.md |
| 05 | `family_members` COPPA columns | FAIL | high | Neither column in live_schema.md `family_members` section; no ALTER TABLE in migrations |
| 06 | COPPA enums (`verification_method`, `coppa_age_bracket`, `verification_attempt_status`) | FAIL | high | No CREATE TYPE anywhere; no CHECK constraints with these values |
| 07 | RLS policies gate writes on active COPPA consent | FAIL | high | No policy references `coppa_consents`; no helper function |
| 08 | `useCoppaConsent` hook | FAIL | high | No `src/hooks/useCoppa*` file; no matches in `src/` |
| 09 | Consent Screens 1–5 built | FAIL | high | No `Coppa*`/`COPPA*` components; no `coppa_consents` writes in `src/` |
| 10 | First-under-13-child trigger fires consent flow | FAIL | high | `FamilySetup.tsx:276` inserts under-13 rows directly with no branch |
| 11 | Additional-child acknowledgment Screen 7 | FAIL | high | No acknowledgment component anywhere |
| 12 | Revocation Screen 9 + scheduled deletion | FAIL | high | No revocation UI; no scheduled-deletion cron for COPPA |
| 13 | Admin verification log Screen 10 | FAIL | high | No admin pages exist in `src/` at all |
| 14 | Stripe webhook COPPA branch | FAIL | high | No stripe webhook Edge Function exists; no COPPA branch possible |
| 15 | PRD-01 retrofit — under-13 signup blocks on verification | FAIL | high | Same code site as CL-10: save completes with no precondition |
| 16 | Turns-13 age-bracket transition trigger | FAIL | high | No daily job touching age/birthday/superseded_at |

**Aggregate:** 16/16 FAIL with high confidence. PRD-40 is entirely unbuilt. PRD header Status "Not Started" matches reality.

---

## Item-by-item detail

### 8a-CL-01 `parent_verifications` table

**Queries run:**
- `Grep supabase/migrations/ "parent_verifications" -i` → 0 hits
- `Grep claude/live_schema.md "parent_verifications" -i` → 0 hits

**Raw results:** No hits anywhere.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** Table is not created by any migration and does not appear in the production schema snapshot regenerated 2026-04-20.

---

### 8a-CL-02 `coppa_consents` table

**Queries run:**
- `Grep supabase/migrations/ "coppa_consents" -i` → 0 hits
- `Grep supabase/migrations/ "coppa" -i` → 0 hits (blanket search, no migration mentions COPPA at all)
- `Grep claude/live_schema.md "coppa" -i` → 0 hits

**Raw results:** No hits.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** No migration references `coppa` in any form. Blanket scan confirms zero COPPA infrastructure in migrations.

---

### 8a-CL-03 `coppa_consent_templates` table

**Queries run:** covered by the blanket `coppa` scan in CL-02.

**Raw results:** No hits.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** Covered by blanket scan. No COPPA-related tables exist anywhere.

---

### 8a-CL-04 `parent_verification_attempts` table

**Queries run:**
- `Grep prds/ "parent_verification" -i` → 1 hit, `prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md` only (the PRD itself).
- No hits in migrations or live_schema.md.

**Raw results:** Only PRD-40 text itself references the table.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** No migration or schema evidence. Only the PRD spec mentions the table.

---

### 8a-CL-05 `family_members` COPPA columns

**Queries run:**
- `Grep claude/live_schema.md "coppa_age_bracket"` → 0 hits
- `Grep claude/live_schema.md "is_suspended_for_deletion"` → 0 hits
- `Grep supabase/migrations/ "coppa_age_bracket|is_suspended_for_deletion" -i` → 0 hits (covered by the blanket COPPA scan)

**Raw results:** `family_members` table in live_schema.md lists 42 columns (id through emergency_locked). Neither `coppa_age_bracket` nor `is_suspended_for_deletion` appears in that list.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** Both columns specified in PRD-40 §Column Addition L687 are absent from both the production schema snapshot and any migration.

---

### 8a-CL-06 COPPA enums

**Queries run:**
- `Grep supabase/migrations/ "verification_method|verification_attempt_status" -i` → 0 hits
- `Grep supabase/migrations/ "under_13|age_bracket|verification_method" -i` → 0 hits

**Raw results:** No CREATE TYPE statements and no CHECK constraints use these values.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** Per PRD-40 L698, three enums expected. None exist. No fallback enforcement (TEXT+CHECK) either.

---

### 8a-CL-07 RLS policies gate writes on active COPPA consent

**Queries run:**
- Blanket `coppa` scan in migrations → 0 hits (no policy can reference a table that doesn't exist).
- No helper function named like `check_coppa_consent` / `has_active_coppa_consent` (covered by blanket scan).

**Raw results:** No RLS policy references COPPA state anywhere.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** Prerequisite table does not exist; no policy could gate on it. Per PRD-40 L722, every child-scoped write policy is expected to be extended — none are.

---

### 8a-CL-08 `useCoppaConsent` hook

**Queries run:**
- `Glob src/hooks/useCoppa*` → 0 hits
- `Glob src/**/Coppa*` → 0 hits
- `Glob src/**/COPPA*` → 0 hits
- `Grep src/ "coppa" -i` → 0 hits

**Raw results:** No files, no matches.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** Frontend hook described in PRD-40 L723 does not exist in any form.

---

### 8a-CL-09 Consent Screens 1–5 built

**Queries run:**
- `Glob src/**/Coppa*` → 0 hits
- `Glob src/**/COPPA*` → 0 hits
- `Grep src/ "coppa" -i` → 0 hits
- (String searches for PRD-40 screen copy deferred — no components exist to search in.)

**Raw results:** No consent components anywhere.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** Five-section consent modal described in PRD-40 §Screens L58–L500 is entirely unbuilt.

---

### 8a-CL-10 First-under-13-child trigger fires consent flow

**Queries run:**
- `Glob src/**/FamilySetup*.tsx` → 1 hit: `src/pages/FamilySetup.tsx`
- Read [FamilySetup.tsx:250-329](src/pages/FamilySetup.tsx#L250-L329): the save action for initial household member onboarding.
- Grepped the file for `coppa`, `under_13`, `coppa_age_bracket` → 0 hits.

**Raw results:** [FamilySetup.tsx:276-279](src/pages/FamilySetup.tsx#L276-L279) inserts household members directly:
```
const { data: insertedMembers, error: insertError } = await supabase
  .from('family_members')
  .insert(inserts)
  .select('id, date_of_birth')
```
No branching on age, no COPPA precondition, no verification check, no redirect to a consent flow. Under-13 children are inserted along with every other member.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** PRD-40 §Incoming Flows L710 requires the save action to route to the consent flow when `coppa_age_bracket='under_13'` and no active `parent_verifications` exist. The save action has no such branch and the prerequisite columns/tables don't exist.

---

### 8a-CL-11 Additional-child acknowledgment flow (Screen 7)

**Queries run:**
- `Glob src/**/Coppa*` / `Glob src/**/*Acknowledg*` → 0 COPPA-related hits
- `Grep src/ "acknowledgment" + "coppa"` → covered by blanket `coppa` scan returning 0 hits

**Raw results:** No acknowledgment component.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** No component exists and no `coppa_consents` table exists to write against.

---

### 8a-CL-12 Revocation Screen 9 + scheduled deletion

**Queries run:**
- `Grep src/ "revoke.*consent|revoke.*coppa" -i` → 0 hits
- `Grep supabase/migrations/ "pg_cron|cron.schedule"` → 10 migration files found (none COPPA-related)
- Reviewed the 10 pg_cron files — they handle: allowance financial, rotation advancement, rhythms phase B, claim expiration, penciled-in auto-expire, mindsweep auto-sweep, smart lists frequency, PRD-01 repair, and base extensions. None mention COPPA, consent, or `is_suspended_for_deletion`.

**Raw results:** No revocation UI. No scheduled COPPA deletion.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** Both the UI surface (Screen 9) and the 14-day scheduled deletion job (PRD-40 L715) are absent. The `is_suspended_for_deletion` column itself does not exist (CL-05), so no job could set it.

---

### 8a-CL-13 Admin verification log Screen 10

**Queries run:**
- `Glob src/pages/admin/**/*.tsx` → 0 hits
- `Glob src/pages/Admin*` → 0 hits
- `Glob src/**/admin/**` → 0 hits
- `Glob src/**/Admin*` → 0 hits

**Raw results:** No admin pages exist in the codebase at all.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** PRD-40 Screen 10 requires an admin surface, but no admin console exists yet (PRD-32 appears unbuilt in `src/pages/`). This is a compound miss: COPPA admin surface depends on admin shell that does not exist.

---

### 8a-CL-14 Stripe webhook COPPA branch

**Queries run:**
- `Glob supabase/functions/**stripe**` → 0 hits
- `Glob supabase/functions/*stripe*` → 0 hits
- `Grep supabase/functions/ "stripe" -i` → 0 hits
- Listed all 46 Edge Functions via `Glob supabase/functions/*/index.ts` — no stripe handler present.
- Confirmed `stripe_customer_id` / `stripe_subscription_id` columns exist on `family_subscriptions` per [00000000000001_auth_family_setup.sql:219-231](supabase/migrations/00000000000001_auth_family_setup.sql#L219-L231), but no webhook Edge Function consumes them.

**Raw results:** The Edge Function referenced in PRD-40 L726 (`stripe-webhook-handler`) does not exist.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** The verification success path relies on Stripe webhook $0.50 charge-and-refund. Without the Edge Function, no verification can complete.

---

### 8a-CL-15 PRD-01 retrofit hook — under-13 signup blocks on verification

**Queries run:**
- Same code site as CL-10: [FamilySetup.tsx:276-279](src/pages/FamilySetup.tsx#L276-L279).
- Also checked `src/pages/auth/AcceptInvite.tsx` (see `src/pages/auth/*.tsx` listing); grep for `family_members` in auth pages confirms AcceptInvite only updates (does not insert) family_members — invite acceptance happens against pre-inserted rows, so the insert-time guard must live in FamilySetup.

**Raw results:** The PRD-01 save-action at FamilySetup.tsx:276 completes successfully for any age value. Can it commit `family_members` with no `parent_verifications` row? Yes — no such table exists, no such check is performed.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** Overlap with CL-10 noted explicitly. The retrofit question — "does PRD-01 block on missing consent?" — answers false with direct evidence. Primary-key gate is absent.

---

### 8a-CL-16 Turns-13 age-bracket transition trigger

**Queries run:**
- `Glob supabase/functions/*age*` → 0 hits
- `Glob supabase/functions/*birthday*` → 0 hits
- `Glob supabase/functions/*turns*` → 0 hits
- `Grep supabase/ "superseded_at"` → 0 hits
- Reviewed the 10 pg_cron migration files (enumerated in CL-12) — none handle age-bracket transitions.

**Raw results:** No daily cron touching `date_of_birth` or `coppa_consents.superseded_at`.

**Proposed verdict:** FAIL
**Confidence:** high
**Rationale:** PRD-40 L716 daily birthday-crossing job does not exist.

---

## Unexpected findings

**1. Only PRD-40 itself mentions COPPA anywhere in the repo.** A blanket `Grep supabase/migrations/ "coppa" -i` returned zero hits. A `Grep src/ "coppa" -i` returned zero hits. A `Grep prds/ "parent_verification" -i` returned only PRD-40 itself. There is no partial infrastructure, no abandoned stub, no retrofit attempt in progress. This is a clean absence, which is consistent with PRD-40's own header status "Not Started."

**2. Stripe integration is spec-only.** `family_subscriptions` has `stripe_customer_id` + `stripe_subscription_id` columns and an index (`idx_fs_stripe_cust`), but there is no Edge Function that writes to them. Across 46 Edge Functions in `supabase/functions/`, none handles Stripe at all. This affects CL-14 directly but also has implications for PRD-31 (Subscription Tiers). **Out of scope for this pass — flagging for orchestrator awareness only.**

**3. No admin console exists in `src/pages/`.** PRD-32 Admin Console is listed as MVP in feature_glossary.md, but no `src/pages/admin/**` tree exists and no `Admin*` components were found. CL-13 (admin COPPA log) depends on admin shell, so this is a compound gap. **Out of scope for this pass — flagging for orchestrator awareness only.**

**4. `account_deletions` table exists but serves PRD-22, not PRD-40.** `supabase/migrations/00000000100027_prd01_repair.sql:231-294` creates `account_deletions` with a `trigger_account_deletion` function and RLS policy `account_deletions_parent_manage`. The "parent" keyword here refers to `primary_parent`, not parental-consent revocation. This table could potentially be reused for COPPA revocation cascade when PRD-40 is built, but it is not currently wired to any COPPA flow. **Possible future leverage point — not current evidence.**

## Notes for the orchestrator

- **No contradictory evidence.** The absence is clean — there are no partial commits, no abandoned branches in `.claude/completed-builds/`, no stub references in `STUB_REGISTRY.md` (not read in this pass but the blanket coppa/parent_verification greps would have surfaced it). If you want a confirming grep of `STUB_REGISTRY.md` before adjudication, it should be a 30-second check.
- **Severity alignment with checklist:** 14 of the 16 items are tagged Blocking or High in the checklist summary table. With all 16 at FAIL, this is a category-wide blocking gap for beta readiness if under-13 children are in scope.
- **Scope ambiguity:** PRD-40 itself is "Not Started" per its header. The audit is verifying whether the declared-unbuilt PRD has in fact been built anyway (it has not). The orchestrator will need to adjudicate with founder whether this is a "confirmed gap, build next" outcome or a "deferred beta item with compensating controls" outcome.
- **Adjacent gaps worth noting:** CL-13 depends on the Admin Console (PRD-32) which also appears unbuilt. CL-14 depends on a Stripe webhook Edge Function which does not exist. PRD-40 is blocked on both prerequisites even before its own build starts.
