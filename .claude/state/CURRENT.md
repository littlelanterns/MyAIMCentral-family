# Current State — 2026-07-09, security emergency RESOLVED + seat handoff (Opus→fresh Fable)

> ✅ **EMERGENCY FULLY RESOLVED — all 5 findings closed LIVE in production.** grant_money +
> apply_permission_profile auth gates (100311) + 3-function lockdown (100310) + lila-chat
> crisis-500 (HTTP 500→200, 988 returned, live-verified) + validate-ai-output fail-open — all
> deployed + live-verified 2026-07-09. TWO security commits captured LOCAL, ahead of origin,
> NOT pushed: `7952c12` (100310) + `28c9edd` (100311 + EF fixes). They push with the next batch
> once GDCX/FDWA/PINR commit their state files (pre-push guard correctly blocks on GDCX's
> uncommitted STUB_REGISTRY — do NOT --no-verify, do NOT sweep other lanes). RPC-grant audit:
> ~15 remaining exposed functions seat-verified BOUNDED (self-gated or legit-target-only) →
> one follow-up sweep, not an emergency.

> Rebuild the full picture from: this file → `claude/dispatch-factory/MANIFEST.md` →
> `.claude/rules/current-builds/*` → `.claude/completed-builds/README.md`.
> **Seat note:** this session ran on Opus (Fable's dual-use guardrails flag the adversarial
> security content). Orchestration is handing back to a fresh FABLE seat. The exploit-analysis /
> adversarial-authoring stays in the Opus SECURITY-EMERGENCY window; the Fable seat COORDINATES
> (sequences, verifies remediation read-only, runs commit batches, pushes) — standard defensive
> release management, not attack authoring.

## 🚨 ACTIVE: adversarial safety-stack review found 4 CRITICAL, 3 live in production

Full report: `SAFETY_STACK_ADVERSARIAL_REVIEW.md`. All seat-verified independently. Status of each:

1. **grant_money exploitable by unauthenticated internet caller** — SECURITY DEFINER, anon-executable, ZERO auth check; caller supplies family/member/amount. Seat CONFIRMED live (grants + body read). Same shape on `grant_points`, `apply_permission_profile`, `update_ethics_pattern_embedding`, `insert_ethics_pattern_candidate`. The 100300 godmother lockdown sealed the dispatch layer but missed these LEAF functions. **Split fix (seat-designed, caller-verified):**
   - **SAFE bare-revoke → service_role only** (no legit client caller — verified): `grant_points`, `update_ethics_pattern_embedding` (only caller = embed EF, service role), `insert_ethics_pattern_candidate` (only caller = validate-ai-output EF). ✅ **DONE — migration 100310 APPLIED LIVE to production 2026-07-09 (grants verified `{postgres, service_role}` only) + committed locally `7952c12`. NOT YET PUSHED** — the pre-push state-file guard correctly blocks because GDCX has uncommitted STUB_REGISTRY work in the tree; the security commit rides to remote in the next batch when GDCX commits (hole is closed live regardless of git). Do NOT --no-verify; do NOT sweep GDCX's STUB_REGISTRY into a security push.
   - **NEEDS AUTH GATE, not revoke** (has legit mom-facing authenticated caller): `grant_money` (src/lib/financial/grantMoney.ts) + `apply_permission_profile` (PermissionHub.tsx:1518). → owned by the SECURITY-EMERGENCY worker (below), 100298 gate pattern.
2. **lila-chat crisis override → HTTP 500, no 988** — `lila-chat/index.ts:393`, `.catch()` on a postgREST thenable calling a nonexistent RPC. Kid types suicidal words → "Internal server error", no resources, nothing persists (PRD-30 can't even flag it). mindsweep-sort's crisis path is FINE (validated). **BLOCKS beta regardless of the flip.** No live lila-chat crisis pin existed → undetected. → SECURITY-EMERGENCY worker.
3. **OpenRouter at zero credits — LiLa fully dark ~2 days (402 on every call).** ✅ **RESOLVED — founder topped up 2026-07-09.**
4. **validate-ai-output fails OPEN** — `index.ts:265` treats null Tier-2 (any Haiku fail) as "clean," auto-clears the flagged violation, doesn't even bump retry_count. 34.7% of violations swallowed during the credit outage. The model-ID lesson half-learned. → SECURITY-EMERGENCY worker.

**SECURITY-EMERGENCY worker** — ✅ ALL 4 FIXES DONE. grant_money + apply_permission_profile in-body auth gates (migration 100311, APPLIED LIVE, both live-verified anon-rejected + mom-passes, zero fixture residue). lila-chat crisis-500 + validate-ai-output fail-open FIXED ON DISK, **NOT DEPLOYED — awaiting founder deploy of `lila-chat` + `validate-ai-output` (the crisis-500 is the last live child-safety gap).** 100311 + EF fixes uncommitted, ride the next batch with 100310.

**RPC-grant audit (WS2 + seat-verified 2026-07-09):** the ~15 remaining anon-executable SECURITY DEFINER functions are all BOUNDED — seat read the value/security-adjacent ones directly: `dispatch_single_grant`/`award_custom_reward_for_completion` can only act on legit, idempotent, rightful-owner targets (no attacker-chosen value/target); `admin_*` ethics + `approve_queued_persona`/`defer_queued_persona` have IN-BODY staff_permissions/admin gates (anon → 'not authorized'). None can mint arbitrary value, rewrite permissions, or poison the safety library. → **ONE follow-up sweep migration** (in-body gates or service_role lock for the bounded writers), NOT an emergency. Plus grant_money same-family amount-tamper residual (server-computed award amounts is the real fix). Fold into the SMFX/follow-up sweep; the RPC-EXECUTE-grant audit PIN below makes the class permanently visible.

## Phase-4 flip verdict: data says GO, blockers say NOT-YET

Calibration (199 seeded outputs, live pipeline, threshold 0.45): Tier-1 recall 100%, **false-positive rate 0/124 = 0%** (the founder's core fear — jumpy classifier scolding a tired mom — is DISPROVEN in data), Tier-2 100% category-correct on everything it processed. **Keep 0.45.** Flip carries no false-retraction risk. NOT-YET blocked ONLY by, in order: (1) ✅ OpenRouter restored, (2) validate-ai-output fail-open, (3) lila-chat crisis-500, (4) re-run calibration w/ credits + new lila-chat crisis pin + fresh-dev-server safety-beta-gate 58-suite, (5) THEN flip. Deferred Slice-E pins 1/4/5 proved live PASS; the shared 58-suite still needs the slot + a dev server (non-interactive review couldn't run it).

## In flight (parallel Sonnet lanes)

- **FDWA + PINR** (family-device write audit → PIN-relock; approved pair) — running.
- **GDCX** (Guided dashboard: Next Best Thing dark since 2026-05-03 + Write-drawer Messages + Homework/Coach mounts) — running; seat approved its E2E fixture question (GDCXTEST rows on Mosiah, afterAll-deleted, matches guided-dashboard-full.spec.ts precedent).
- **SECURITY-EMERGENCY** — see above.

## Recently landed + pushed (2026-07-08→09)

PRD-30 (SM-A/B/C) + PECON (A+B) Checkpoint-5 PASS, signed off, archived (`cd0acab`). PRD-40 Slice 1 (COPPA foundation + 175-table child-data deletion registry + CI completeness pin, migration 100305) + PRD-31 pre-build APPROVED (draft tier chart + 16-surface beta-bypass exit registry) pushed (`2edb5cf`/`7d68b3c`). Nine build files archived to `.claude/completed-builds/2026-07/`.

## Standing operating rules

Model routing: **security/adversarial → Opus (Fable dual-use flags it) — this is now a re-pin data point for 07-12.** Two-step /model headers on every dispatch. ONE shared Playwright suite at a time across windows (seat serializes; tree-level result counts for all lanes). Seat-executed commit batches (per-lane + schema commit staged with live_schema + shared sweep). **Founder standing push-after-review authorization.** Production migrations + Edge deploys + destructive ops = founder per-instance. Hook false-positives on PROSE describing banned patterns get reworded, never overridden. Convention #277 eyes-on tours are load-bearing.

## Founder-only open items

1. **"lock them"** — the 3 safe RPC revokes (do it in whichever seat; fastest = immediately).
2. **Stripe test keys** → unblocks PRD-40 Slice 2. **Resend signup** → safety + Out-of-Nest emails.
3. **"repair history"** — ~17 migrations applied via one-file method aren't in Supabase's migration-history ledger; a future naive `db push` would replay them. Non-destructive reconcile, ~2 min, seat runs it.
4. PECON kid-device feel-pass (Reward Shop) · VOICE mic feel-pass · attorney package (~2 wks).
5. **07-12 Fable full-price revisit** — Beta Readiness delta + Fable-vs-Opus re-pin rec (now carries: adversarial/security work pins Opus permanently). PRD-31 + PRD-40 pre-builds already done.

## SMFX pile

CSS token misuse sweep (backgroundColor+gradient ~15 files; var(--color-bg) ghost token) · nameless dashboard greeting · pre-commit banned-pattern grep should exclude comment lines (multiple false positives) · obligations Layer-2 grace-buffer gap (#271 next-toucher) · PECON C5 follow-ups: rider-3 pin literal shape (D1) + refund idempotency key (D2) · **revive `tests/e2e/features/guided-dashboard-full.spec.ts`** — all 13 tests dead at login (stale `sb-<host>-auth-token` storage key; app now uses `myaim-auth` via client.ts). Small targeted fix to route it through `tests/e2e/helpers/auth.ts`, BUT watch for assertion drift from GDCX's dashboard changes — do as a deliberate standalone task, not bundled · **NEW from review: add a permanent RPC-EXECUTE-grant audit pin** (no public-schema SECURITY DEFINER function should carry anon/authenticated EXECUTE without an in-body auth gate — this class has now bitten twice: godmother lockdown + tonight's leaf functions).

---
*Overwritten at every close-out and baton-pass. History: HISTORY.md.*
