# Current State — As of 2026-07-08 (post batch #3; Fable window through 2026-07-12)

> Any coordination session (fresh, compacted, or resumed) rebuilds the full picture from:
> this file → `claude/dispatch-factory/MANIFEST.md` (packs + queue) →
> `.claude/rules/current-builds/*` (in-flight) → `.claude/completed-builds/README.md` (history).

## The 2026-07-07→08 sprint, fully landed (three seat-executed release batches, all pushed)

- **Batch 1 (fb594fe):** SAFETY-BETA-GATE C/B/A+E (shadow mode), schema 100286–100299, PRD-30 SM-A/B, WishLists Phase A, KitchenCompass Phase A, shared sweep.
- **Batch 2 (0f62108):** PECON-EARN Worker A (ledger, config-as-truth, routine economics) + the godmother EXECUTE lockdown (100300 — CRITICAL: all 15 connector fns were anon-executable since Phase 3; ledger drift 0.00 = no abuse evidence).
- **Batch 3 (this push):** PECON-SHOP Worker B (Reward Shop, migrations 100302/100304 incl. its own RPC hardening), PRD-30 SM-C (weekly digests, crisis-flag wiring, migration 100303; email DEFERRED — founder has no Resend creds yet), **the model-ID platform repair** (invalid `claude-haiku-4-5-20251001` dev-harness ID had silently broken SIX production functions: safety-classify L2+starters never worked, validate-ai-output Tier-2, message-coach notes, auto-title-thread, lila-board-of-directors over-blocking; all fixed→`anthropic/claude-haiku-4.5`, deployed, permanent guard `tests/redteam/model-id-guard.test.ts`, Silent Tooling Failure Pattern #8), PRD-40 pre-build docs + Two-Door Addendum, shared-doc appends (Conventions #280/#281/#282).

**Slice E is LIVE IN SHADOW MODE** (37 fns deployed, 3 tiers armed — note: Tier-2 verdicts only real AFTER the model-ID fix deploy; earlier shadow data is Tier-0/1 only, recorded in the SAFETY-BETA-GATE.md Phase-4 handoff). **PRD-30 detection + digests LIVE.**

## Builds complete — Checkpoint 5 VERIFIED + **FOUNDER SIGNED OFF 2026-07-08** — ARCHIVED

Both build files (+ PECON-earn/shop) moved to `.claude/completed-builds/2026-07/`, along with a housekeeping sweep of five previously-completed-and-pushed build files (ALLOWANCE-RECONCILIATION, CLIENT-DATE-REMEDIATION, FAMILY-GOALS-PRIZES, HITM-CLOSURE, PRD-42, PRD-43) that were still auto-loading into every session. `current-builds/` now holds ONLY: SAFETY-BETA-GATE (stays until Phase-4 flip), PRD-40-coppa (Slice 1 pending), STUDIO-EXPERIENCE (ST-A+ pending), VOICE-INPUT-REPAIR (founder mic feel-pass open), IDLE.md. Ledger rows added to both READMEs.

- **PRD-30 (SM-A+B+C): Checkpoint 5 PASS** — 48 Wired / 4 Stubbed / 0 Missing, all six spot-checks green (no-side-door column guard holds even vs mom; crisis path provably DB-independent). Three doc discrepancies found → all corrected by the seat same day (tier-gate STUB row added, two stale "not yet fixed" texts updated). Verdict appended to the feature decision file. On founder sign-off: archive build file to completed-builds + README index row.
- **PECON (A+B): Checkpoint 5 PASS** — 24 Wired / 0 Missing; ledger genuinely append-only with zero platform-wide bypass; lockdown covers all 15 functions. Three non-blocking follow-ups queued (see pile): rider-3 pin strengthening (D1), refund idempotency key (D2 — one line, next PECON-adjacent session), mom manual-points-adjustment stub registered + Convention #206 corrected (D3, done). Verdict appended to PECON-shop.md. Founder feel-pass still hers: kid buys a shop item on a real device (Play shelf = human-feel class).

## Ready to dispatch (seat sequences)

- **PRD-40 Slice 1** — pre-build APPROVED (OD-1..4), Slice-1 prompt written in `.claude/rules/current-builds/PRD-40-coppa.md`. Founder calendar items: Stripe test keys before Slice 2, attorney package = under-13 long pole.
- **PRD-31 Fable pre-build** — seat writes the prompt (reads PRD-40 decision file §3 Stripe boundary). Target: 07-08/09.
- **SM email follow-up** — when founder does the ~20-min Resend signup + DNS.

## This week (Fable window ends 07-12)

1. **Adversarial safety-stack review** — once dispatched, doubles as the shadow-log calibration data generator (family LiLa usage is low, so the review's driven conversations ARE the Phase-4 dataset). Scope includes the RPC EXECUTE-grant audit (born from the godmother incident) + deploy-dependent Slice E pins + fresh-dev-server safety-beta-gate re-confirm.
2. **Phase-4 flip session** after the review's data lands: read shadow log → tune 0.45 threshold → flip shadow→enforcing → Beta Readiness Report → Convention #247 gate cleared.
3. **Beta Readiness delta report** + **Fable-vs-Opus re-pin recommendation** by 07-12.

## Standing operating rules (unchanged; see batch-1 entry in HISTORY for full list)

Model routing + two-step /model headers · ONE shared Playwright suite at a time (tree-level results count for all lanes) · seat-executed release batches (per-lane commits + schema commit + shared sweep; live_schema staged with migrations per hook) · founder standing push-after-review authorization · deploys founder-per-instance · Convention #277 tours are load-bearing (caught 3 invisible-UI defect classes this sprint) · hook false-positives on PROSE describing banned patterns get reworded, never overridden (3rd occurrence this sprint).

## Founder-only open items

1. Resend signup + DNS (unblocks safety emails + Out-of-Nest + PRD-15 email prefs).
2. Attorney package → counsel (~2 wks, her clock). `MINDSWEEP_WEBHOOK_SECRET` before email intake.
3. Stripe test-mode keys (before PRD-40 Slice 2 proof).
4. PECON feel-pass: kid buys shop item on real device.
5. Checkpoint 5 sign-offs for PRD-30 + PECON when verifier tables land.
6. OpenRouter privity support ticket.

## Seat's SMFX pile

CSS token misuse sweep (backgroundColor+gradient ~15 files; var(--color-bg) ghost token) · nameless dashboard greeting · pre-commit banned-pattern grep excludes comment lines (3 false positives this sprint) · obligations Layer 2 step-fairness grace-buffer gap (flagged in PECON-earn.md — #271 next-toucher rule) · **PECON C5 follow-ups:** rider-3 pin strengthened to literal shared-per_step shape (D1) + `refund:{purchase_id}` idempotency key or FOR UPDATE in resolve/cancel (D2 — one line).

---
*Overwritten at every close-out and baton-pass. History: HISTORY.md.*
