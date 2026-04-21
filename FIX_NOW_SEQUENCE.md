# FIX_NOW_SEQUENCE.md

> **Status:** DRAFT v2 — applied founder Session 1 response 2026-04-21
> **Generated:** 2026-04-21 by Dependency-Graph worker; revised 2026-04-21 by orchestrator after founder response
> **Purpose:** Session 2 adjudication aid — orders Fix Now + Fix Next Build findings so the execution queue respects real dependencies. Reads alongside [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md) and [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md).
> **Scope:** 11 Fix Now + 2 Fix Now (+compound) + 1 Fix Code + 74 Fix Next Build. 27 Beta Readiness blockers anchor the ordering (22 from Appendix C + 5 from 2026-04-21 founder additions). `Defer-to-Gate-4`, `Tech Debt`, `Intentional-Update-Doc`, `Closed/Resolved`, `Informational`, `Capture-only` rows omitted from waves but called out when they appear as upstream blockers.

---

## What changed from v1 → v2 (2026-04-21 founder response)

- **COPPA chain unblocked.** SCOPE-2.F1 (Stripe webhook) + SCOPE-2.F48 (Admin Console) reclassified `Defer-to-Gate-4 → Fix Next Build` as Wave 4 prerequisites. Wave 4 now has a real path to landing.
- **Board of Directors 3-way file serialization consolidated into ONE wave.** SCOPE-8a.F5 + SCOPE-4.F4 + SCOPE-8b.F3 + SCOPE-4.F8a + SCOPE-4.F8b merged into **Wave 1B: Board-of-Directors consolidated sprint**. Single build cycle; eliminates cross-wave regression risk on `lila-board-of-directors/index.ts`.
- **SCOPE-4.F4 reclassified `Intentional-Update-Doc → Fix Code`** with design nuance (AI classifier personal-vs-community; community-relevant routes to PRD-32 Admin Console approval queue; approved personas enter shared cache). PRD-34 addendum required post-Session-2.
- **SCOPE-4.F8 split:** F8a (privacy-filter bypass, Fix Now, Beta Y) + F8b (assembler refactor, Fix Next Build — verdict `LILA-POWERED-BUT-BYPASSING` per [RECON_F8B_ASSEMBLER.md](RECON_F8B_ASSEMBLER.md)).
- **5 new findings added** (NEW-A, NEW-B, NEW-C, NEW-D, NEW-E). Placed in waves below.
- **First beta cohort scope:** families with no children under 13. Unlocks COPPA ship-dormant-but-built at beta launch without blocking first cohort. Second cohort opens after lawyer review + `lawyer_approved_at` populates + revocation cascade complete.

---

## TL;DR

- **6 waves + 1 consolidated sprint.** Wave 0 = doc/enabler prereqs; Wave 1 = Beta blockers with no dependencies; Wave 1B = Board-of-Directors consolidated sprint; Wave 2 = safety substrate (F1/F5/F11); Wave 3 = Wave-2-dependent Beta blockers + prompt audits; Wave 4 = COPPA cascade (now unblocked); Wave 5 = post-Board downstream cleanup.
- **Zero hard chain breaks remain.** Former Wave-4 block eliminated by F1/F48 reclassifications.
- **One soft coordination pair persists:** SCOPE-3.F9 ↔ SCOPE-8b.F4 (same convention area, opposite fates on `is_included_in_ai` column family). Ship in coordinated commit cycle to prevent PRD drift.
- **Two conventions landed 2026-04-21:** Convention 247 (LiLa scope), Convention 248 (Native AI Vault tool categories). These unblock every governance-tagged finding.

---

## Wave 0 — Upstream enablers (run in parallel with Wave 1/1B)

Doc / type / schema work that unblocks later waves. No code-path deps. Can dispatch immediately.

| Finding | Scope | Sev | Beta | Proposed | Unblocks | Parallelizable with | Notes |
|---|---|---|---|---|---|---|---|
| SCOPE-3.F2 | 3 | Med | N | Fix Next Build | SCOPE-8b.F11 (Wave 2) | All Wave 0/1/1B | PRD-35 vocabulary + `RecurrenceDetails` type consolidation. Root-cause of SCOPE-8b.F11 bifurcation. Ships spec amendment first, then TS consolidation. |
| SCOPE-3.F9 | 3 | Low | N | Intentional-Update-Doc | — (coord w/ SCOPE-8b.F4 Wave 3) | All Wave 0/1/1B | Drops `dashboard_widgets.is_included_in_ai`. ⚠️ Coordinate commit with SCOPE-8b.F4. |
| SCOPE-2.F1 | 2 | Med | N | Fix Next Build | SCOPE-8a.F1 (Wave 4) | SCOPE-2.F48 | Stripe webhook handler (minimum scope needed for COPPA revocation-path hook, not full monetization). |
| SCOPE-2.F48 | 2 | Med | N | Fix Next Build | SCOPE-8a.F1 (Wave 4), SCOPE-4.F4 (Wave 1B approval queue) | SCOPE-2.F1 | Admin Console shell (minimum scope: approval-queue UI route + admin auth gate). Dual-purpose: COPPA verification log + Board approval queue. |

---

## Wave 1 — Beta blockers with zero dependencies (parallel with Wave 0)

These land immediately. No upstream blockers. Safe to dispatch as parallel worker streams.

| Finding | Scope | Sev | Beta | Proposed | Unblocks | Parallelizable with | Notes |
|---|---|---|---|---|---|---|---|
| SCOPE-8a.F3 | 8a | Blocking | Y | Fix Now | — | All Wave 1 non-8a | PRD-20 + PRD-30 + PRD-41 build. Largest scope in Wave 1. Founder decision Y on sub-build ordering. |
| SCOPE-8a.F6 | 8a | Blocking | Y | Fix Now | — | All Wave 1 | DailyCelebration HITM. ~1 file. |
| SCOPE-8b.F7 | 8b | High | Y | Fix Now | — | All Wave 1 | `.ics` CHECK constraint. 1-line migration. |
| SCOPE-3.F22 | 3 | Low | Y | Fix Now | — | All Wave 1 | Play shell /rewards route. 1-line fix. |
| SCOPE-3.F41 | 3 | High | Y | Fix Now | — | All Wave 1 | MemberAssignmentModal broken write. Correct column names on INSERT. |
| SCOPE-3.F14 | 3 | High | Y | Fix Next Build | — | All Wave 1 | First allowance_periods bootstrap. Trigger on `allowance_configs.enabled=true`. |
| **NEW-A** | BookShelf | High | Y | Fix Next Build | — | All Wave 1 | `book_discuss` vs `book_discussion` dedup. Focused single-worker mini-audit. |
| **NEW-B** | LiLa UI | High | Y | Fix Now | — | All Wave 1 | Remove General from 10 user-facing surfaces (Recon-2); drawer default = Help. Preserve technical fallback. |

---

## Wave 1B — Board-of-Directors consolidated sprint (single serial sprint)

**All five findings touch `supabase/functions/lila-board-of-directors/index.ts`, related Board UI, and PRD-34.** Consolidated per founder direction 2026-04-21 to eliminate cross-wave regression risk. One build sprint, one Edge Function redeploy, one PRD-34 addendum.

| Finding | Scope | Sev | Beta | Proposed | Role in sprint |
|---|---|---|---|---|---|
| SCOPE-8a.F5 | 8a | Med | Y | Fix Now (+compound) | Content-policy fail-closed flip + server-side `contentPolicyCheck` re-invocation on `create_persona` action. Includes `content_policy_check` embedding pre-screen (folded from SCOPE-4.F4 per audit L2072). |
| SCOPE-4.F4 | 4 | High | Y | **Fix Code** | Persona cache 3-tier rebuild: (a) AI classifier personal-vs-community routing at creation, (b) approval queue UI in PRD-32 Admin Console (requires SCOPE-2.F48 Wave 0 prerequisite), (c) cache lookup respects `is_public` + `family_id` scoping. **PRD-34 addendum required post-sprint.** |
| SCOPE-8b.F3 | 8b | High | Y | Fix Next Build | HITM gate on `board_personas` generation — folds into F4's approval-queue review step. |
| SCOPE-4.F8a | 4 | High | Y | Fix Now | `is_privacy_filtered` hard-constraint bypass in Decision Guide + Board of Directors. Lands as part of F8b assembler refactor; privacy filter is the first thing the shared assembler does. |
| SCOPE-4.F8b | 4 | Med | N | Fix Next Build | Refactor Decision Guide + Board of Directors to call `assembleContext` (verdict: LILA-POWERED-BUT-BYPASSING per Recon-1). **Audit Perspective Shifter + Mediator in same pass.** Once landed, Convention 248 invariant (`context_sources` non-empty ⇒ must use shared assembler) is enforced across all ThoughtSift + Mediator tools. |

**Sprint prerequisite:** SCOPE-2.F48 Admin Console shell (Wave 0) must land before F4 approval queue work begins.

**Sprint unblocks:** SCOPE-4.F5 (alternative-persona substitution — Wave 5).

---

## Wave 2 — Safety-substrate commit cycle (depends on Wave 0)

**Ships-together block per audit line 1607:** F1 + F5 share `_shared/` directory, same class of fix, both safety substrate. F1 Mediator Full Picture ships first as proof-of-pattern; remaining 11+1 surfaces follow in tight sequence as one cohesive build. F11 sequences immediately after SCOPE-3.F2 lands.

| Finding | Scope | Sev | Beta | Proposed | Blocked-by | Unblocks | Parallelizable with | Notes |
|---|---|---|---|---|---|---|---|---|
| SCOPE-8b.F1 | 8b | Blocking | Y | Fix Now (+compound) | — | SCOPE-8b.F12 coaching-log server-side, SCOPE-8b.F13 tier-gate | SCOPE-8b.F5 (same cycle) | `_shared/auth.ts` `authorizeForFamily` helper. Mediator Full Picture lede. 13 surfaces in Fix Next Build follow-on. |
| SCOPE-8b.F5 | 8b | Blocking | Y | Fix Now | — | — | SCOPE-8b.F1 | Crisis Override in 3 Edge Functions. Same `_shared/` directory as F1. ~5 lines per file. |
| SCOPE-8b.F11 | 8b | High | Y | Fix Now | SCOPE-3.F2 (Wave 0) | — | SCOPE-8b.F1 / F5 | PRD-27 shift bifurcation. Consolidate `shift_sessions` → `time_sessions`, migrate 2 live rows, drop `shift_sessions`. |

---

## Wave 3 — Fix Next Build Beta blockers + prompt audits (after Wave 2)

Beta Y blockers proposed Fix Next Build. Most depend on F1's `authorizeForFamily` helper, F5's crisis-detection pattern, or the class-of-fix substrate. Plus the two new prompt-coverage audits (NEW-C + NEW-D) which can run anytime after Wave 0 conventions landed.

| Finding | Scope | Sev | Beta | Proposed | Blocked-by | Parallelizable with | Notes |
|---|---|---|---|---|---|---|---|
| SCOPE-8b.F2 | 8b | High | Y | Fix Next Build | — | All Wave 3 | HITM gate on `communication_drafts`. 8 Edge Functions. |
| SCOPE-8b.F4 | 8b | High | Y | Fix Next Build | Coordinate w/ SCOPE-3.F9 (Wave 0) | All Wave 3 | User-control enforcement sweep across 5 surfaces. ⚠️ Coordination pair with SCOPE-3.F9. |
| SCOPE-8b.F6 | 8b | High | Y | Fix Next Build | — | All Wave 3 | PRD-17B auto-sweep server-side routing layer. |
| SCOPE-8b.F8 | 8b | High | Y | Fix Next Build | — | All Wave 3 | GDPR `process_expired_deletions` cascade + cron + UI. ⛔ SERIAL with SCOPE-8a.F1/F2 (Wave 4 — cron infrastructure shared with COPPA retention). |
| SCOPE-8b.F9 | 8b | High | Y | Fix Next Build | — | All Wave 3 | Meeting impressions RLS / view redaction. |
| SCOPE-8b.F10 | 8b | High | Y | Fix Next Build | — | All Wave 3 | `useCreateMeeting` member_permissions check. |
| SCOPE-8b.F12 | 8b | High | Y | Fix Next Build | SCOPE-8b.F1 (Wave 2) | Other Wave 3 | Messaging safety — 4 sub-surfaces. Sub-surface 2 folds into F1's `authorizeForFamily` rollout. |
| SCOPE-8b.F13 | 8b | High | Y | Fix Next Build | SCOPE-8b.F1 (Wave 2) | Other Wave 3 | `_shared/tier-gate.ts` helper. Ships in F1 rollout directory. 47 Edge Functions. |
| **NEW-C** | LiLa prompts | Med | Y | Fix Next Build | Convention 247 (landed) | **NEW-D** (ship as paired pass) | On-task enforcement audit across specialized LiLa modes. Single prompt-review sweep. |
| **NEW-D** | LiLa prompts | Med | Y | Fix Next Build | Convention 247 (landed) | **NEW-C** (ship as paired pass) | Faith Ethics + LiLa core guardrail coverage audit across all 43 `lila_guided_modes` prompts. Paired with NEW-C — same file pass. |

---

## Wave 4 — COPPA cascade (prerequisites landed in Wave 0; first-beta-cohort scoping)

Per founder response 2026-04-21: COPPA framework builds in Wave 4 but first beta cohort is scoped to families with no children under 13. Framework ships dormant-but-built at beta launch. Second cohort opens after (a) lawyer review completes, (b) `lawyer_approved_at` populates on consent templates, (c) revocation cascade build completes.

| Finding | Scope | Sev | Beta | Proposed | Blocked-by | Notes |
|---|---|---|---|---|---|---|
| SCOPE-8a.F1 | 8a | Blocking | Y | Fix Now | SCOPE-2.F1 + SCOPE-2.F48 (Wave 0) | Full PRD-40 COPPA build. Founder decision Y on sub-build ordering + admin-shell concurrency. **Lawyer review gates live user consent; framework ships dormant until `lawyer_approved_at` populates.** |
| SCOPE-8a.F2 | 8a | Blocking | Y | Fix Now | SCOPE-8a.F1 | Privacy-data-lifecycle. F1's Fix Now scope per audit line 275 "must include the deletion cascade work captured in F2's resolution scope" — effectively same build. |

**Beta cohort scoping:** first cohort = no under-13s. Add matching CLAUDE.md convention or beta-planning note post-Session-2.

---

## Wave 5 — Downstream cleanup (after Wave 1B Board sprint lands)

| Finding | Scope | Sev | Beta | Proposed | Blocked-by | Notes |
|---|---|---|---|---|---|---|
| SCOPE-4.F5 | 4 | Med | N | Intentional-Update-Doc | SCOPE-4.F4 (Wave 1B) | Alternative-persona substitution. Blocked by F4 cache rebuild — F4 must land first. |

---

## Gate 4 — parking lot (consistent with upstream Defer-to-Gate-4)

Fix Next Build / Defer-to-Gate-4 rows whose upstream blockers are themselves Deferred. Do NOT schedule until upstream unblocks.

| Finding | Proposed | Blocked-by | Chain status |
|---|---|---|---|
| SCOPE-2.F52 | Defer-to-Gate-4 | SCOPE-2.F9 (Defer-to-Gate-4) | Consistent — both deferred. Optimize with LiLa stub. |
| SCOPE-2.F53 | Defer-to-Gate-4 | SCOPE-2.F9 (Defer-to-Gate-4) | Consistent — both deferred. Deploy with LiLa stub. |

---

## Capture-only (no wave, no fix — vision tracking)

| Finding | Classification | Notes |
|---|---|---|
| **NEW-E** | Capture-only | `LILA_FUTURE_LOCAL_LLM.md` stub — on-device small LLM for General/kid/privacy-sensitive chat. Post-beta vision. Author stub post-Session-2; do NOT schedule build. |

---

## Parallelization summary

| Wave | Max parallelism | Key serialization boundaries |
|---|---|---|
| Wave 0 | 4 workers | None internal — F2, F9, F1, F48 touch different files. |
| Wave 1 | Up to 8 workers | One per finding. All are file-disjoint. |
| Wave 1B | **1 worker (serial sprint)** | Same Edge Function + same PRD-34 addendum + same Admin Console surface. Do NOT split. |
| Wave 2 | 2–3 workers | F1 + F5 share `_shared/` directory — one worker. F11 separate. |
| Wave 3 | Up to 10 workers | ⛔ F8 cron infra overlaps Wave 4 COPPA retention cron. ⛔ F12 sub-2 + F13 gated on F1 `_shared/` helpers. NEW-C + NEW-D = single worker (paired pass). |
| Wave 4 | 1 worker (+ 1 Wave-3-F8 coordinator) | COPPA build spans PRD-40 + PRD-31 webhook + PRD-32 admin; founder-led scope. |
| Wave 5 | 1 worker | Post-Board-sprint cleanup. |

---

## Foreseeable blockers (⚠️ chain breaks summary)

All hard chain breaks from v1 resolved by founder response.

**Remaining soft coordination pairs:**

1. **SCOPE-3.F9 ↔ SCOPE-8b.F4** — same convention area (`is_included_in_ai` column family), opposite fates. PRD-14 and PRD-14D amendments must land in coordinated commit cycle to prevent doc drift.
2. **SCOPE-8b.F8 ↔ SCOPE-8a.F1/F2 cron infrastructure** — GDPR deletion cron + COPPA retention cron use the same `util.invoke_edge_function` pattern. Risk: duplicate cron registrations if Wave 3 F8 and Wave 4 land independently. Assign one worker to own both cron migrations.
3. **NEW-C + NEW-D** — same-file prompt pass. Ship as one worker dispatch.

---

## Machine-readable adjacency list

Format: `UPSTREAM -> DOWNSTREAM`. One edge per line. `->` = hard dependency (upstream must land first). `~~>` = coordination pair (ship-together recommended; not a hard block).

```
# Wave 0 → Wave 2/4
SCOPE-3.F2 -> SCOPE-8b.F11
SCOPE-2.F1 -> SCOPE-8a.F1
SCOPE-2.F48 -> SCOPE-8a.F1
SCOPE-2.F48 -> SCOPE-4.F4

# Wave 4 internal
SCOPE-8a.F1 -> SCOPE-8a.F2

# Wave 1B consolidated sprint (all internal to the sprint, ship together)
SCOPE-8a.F5 ~~> SCOPE-4.F4
SCOPE-4.F4 ~~> SCOPE-8b.F3
SCOPE-4.F4 ~~> SCOPE-4.F8a
SCOPE-4.F4 ~~> SCOPE-4.F8b

# Wave 1B → Wave 5
SCOPE-4.F4 -> SCOPE-4.F5

# Wave 2 substrate → Wave 3
SCOPE-8b.F1 -> SCOPE-8b.F12
SCOPE-8b.F1 -> SCOPE-8b.F13
SCOPE-8b.F1 ~~> SCOPE-8b.F5

# Gate 4 parking
SCOPE-2.F9 -> SCOPE-2.F52
SCOPE-2.F9 -> SCOPE-2.F53

# Coordination pairs
SCOPE-3.F9 ~~> SCOPE-8b.F4
SCOPE-8a.F1 ~~> SCOPE-8b.F8
SCOPE-8a.F2 ~~> SCOPE-8b.F8
NEW-C ~~> NEW-D
```

---

## Source references

- Founder Session 1 response (2026-04-21) — COPPA chain resolution, Board sprint consolidation, NEW findings additions, F8 split, F4 reclassification.
- Recon-1 verdict: [RECON_F8B_ASSEMBLER.md](RECON_F8B_ASSEMBLER.md) — LILA-POWERED-BUT-BYPASSING.
- Recon-2 inventory: [RECON_GENERAL_MODE_SURFACES.md](RECON_GENERAL_MODE_SURFACES.md) — 10 user-facing surfaces; drawer default = Help.
- Conventions landed 2026-04-21: CLAUDE.md §247 (LiLa scope), §248 (Native AI Vault tool categories).
- Pre-adjudicated constraints + audit cross-references: [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md) + [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md).
- Ships-together block on F1+F5: [AUDIT_REPORT_v1.md §8b L1606–1609](AUDIT_REPORT_v1.md#L1606).
- F11 sequencing: [AUDIT_REPORT_v1.md §SCOPE-8b.F11 L1746–1748](AUDIT_REPORT_v1.md#L1746).
- NEW pairing SCOPE-3.F9 ↔ SCOPE-8b.F4: [AUDIT_REPORT_v1.md §Scope 3+8b header L1119, §SCOPE-3.F9 L1214](AUDIT_REPORT_v1.md#L1119).
