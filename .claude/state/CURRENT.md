# Current State — 2026-07-09 evening (RESTING — all in-flight work pushed, no lanes active)

> Rebuild the full picture from: this file → `claude/dispatch-factory/MANIFEST.md` (build queue)
> → `.claude/rules/current-builds/*` (in-flight) → `.claude/completed-builds/README.md` (history).
> Everything below is on `main` through commit `da51059`. Tree clean, nothing unpushed.

## What landed 2026-07-09 (all committed + pushed, one clean batch da51059)

- **SECURITY EMERGENCY — RESOLVED.** Adversarial safety-stack review (ran on Opus — Fable's dual-use guardrails flag adversarial authoring) found 4 CRITICAL, 3 live. All closed LIVE in production + pushed: grant_money + apply_permission_profile in-body auth gates (100311), 3-function leaf-RPC lockdown (100310), lila-chat crisis-500 (HTTP 500→200, 988 hotline now returned — live-verified), validate-ai-output fail-open (retries/parks instead of auto-clearing). Report: `SAFETY_STACK_ADVERSARIAL_REVIEW.md`.
- **RPC-grant audit DONE + seat-verified:** ~15 remaining anon-executable SECURITY DEFINER fns are all BOUNDED (self-gated with in-body admin checks, or legit-idempotent-rightful-owner-target only). → ONE follow-up sweep migration, NOT an emergency.
- **GDCX** — Guided Dashboard completion (4 slices): Next Best Thing re-enabled (was dark since 2026-05-03), DailyCelebration steps unstubbed, Progress→/my-rewards, Victories nav restored, unread badge. Migration 100307.
- **FDWA + PINR** — family-device writes (100306, 35 RLS policies + update_member_appearance RPC) + 2 pre-existing P0 conversation_space_members recursion fixes (100308/100309) + personal-device PIN relock.

## Immediate queue (next seat sequences — nothing is blocked)

1. **Phase-4 flip** (the big one): LiLa's ethics enforcement goes shadow→enforcing = clears the Convention #247 beta gate. UNBLOCKED now (crisis-500 + fail-open deployed, OpenRouter credits restored). Remaining before flip: re-run the calibration + fresh-dev-server safety-beta-gate 58-suite → then GO (calibration was 0% false-positive — the founder's core fear is disproven). **Runs on Opus** (safety/adversarial content). FIRST check the functional item below.
   - **Functional check (Phase-4 readiness):** 73 of 84 lila_conversations are unscanned by safety-classify. Likely the review's test conversations on non-monitored members, or the scanner catching up post-model-fix. Zero cost impact — but confirm safety-classify actually scans monitored kids' conversations end-to-end before the flip.
2. **Follow-up builds (Sonnet, not urgent):**
   - **Kid PIN session-mint fix** — FOUNDER RULED keep 4-digit PINs. Fix = picture-password derived-secret pattern (Convention #273; mirror `family-auth-admin` picture path ~lines 384/509). Do NOT force 6-digit / weaken Auth policy.
   - **Teen mom-initiated invite** (founder feature request) — mom creates username/password OR email login for a teen, sent by her, teen under her family. PRD-01 accept-invite territory.
   - **RPC-EXECUTE sweep** — in-body gates or service_role lock for the ~15 bounded fns + grant_money same-family amount-tamper (server-computed award amounts). Add the permanent RPC-grant audit pin (class has bitten twice).
   - **csm_insert_admin_or_parent** RLS branch mystery (PRD-15) — diagnosed, not chased.
3. **Dispatch-factory queue** (`MANIFEST.md`): PRD-40 Slice 2 (needs founder Stripe test keys), then the P2/P3/P4/P5 chains. PRD-40 Slice 1 + PRD-31 pre-build already done.

## Standing operating rules

- **Model routing: security/adversarial → Opus (Fable flags it) — firm re-pin data point for 07-12.** Two-step /model headers on every dispatch (manual founder step). ONE shared Playwright suite at a time across windows (seat serializes; tree-level result counts for all lanes).
- Seat-executed release batches: schema commit (migrations + live_schema) first, then per-lane code commits (selective staging, own files), then shared-docs sweep (STUB_REGISTRY etc. once, citing all lanes). **Founder standing push-after-review authorization.** Production migrations / Edge deploys / destructive ops = founder per-instance.
- Pre-commit hook false-positives on PROSE describing banned date-patterns → reword, never override. Pre-push state-file guard: commit ALL lanes' state files (don't --no-verify; don't sweep another lane's file). Migration numbers re-checked at apply time (100311 latest).
- Convention #277 Claude-driven eyes-on tours are load-bearing (caught 3 invisible-UI defect classes this sprint). DB-asserted pins are the only accepted proof.

## Founder-only open items

1. **Stripe test-mode keys** → unblocks PRD-40 Slice 2. **Resend signup + DNS** → safety + Out-of-Nest emails.
2. **PECON kid-device feel-pass** (Reward Shop) · **VOICE mic feel-pass** · attorney package (~2 wks).
3. **"repair history"** — ~20 migrations applied via one-file method aren't in Supabase's migration-history ledger; a future naive `db push` would replay them (they're idempotent, but a landmine). Non-destructive reconcile, ~2 min, seat runs it on the word.
4. **2026-07-12 Fable full-price revisit — BOTH DELIVERABLES READY (prepared 2026-07-09, decision still yours on the 12th; NOTHING re-pinned yet):** Beta Readiness delta appended to `claude/feature-decisions/Beta-Readiness-Report-2026-07.md` (headline: gate moved from ~4–6 weeks to ~2–3 weeks + attorney; criteria 6 & 7 now ✅); re-pin rec at `claude/orchestration/Model-Routing-Repin-2026-07-12.md` (recommends: judgment tier back to Opus, Fable escalation-only, security→Opus permanent; exact edits listed, seat executes on your word).
5. OpenRouter privity support ticket (no-training-verification.md §6).

## Seat's SMFX pile (fold into an SMFX dispatch)

CSS token misuse sweep (backgroundColor+gradient ~15 files; var(--color-bg) ghost token — GDCX + KitchenCompass + SM-B all hit variants) · nameless dashboard greeting · pre-commit banned-pattern grep should exclude comment lines (multiple false positives this sprint) · obligations Layer-2 grace-buffer gap (#271 next-toucher) · PECON C5 follow-ups: rider-3 pin literal shape (D1) + refund idempotency key (D2).

---
*Overwritten at every close-out and baton-pass. History: HISTORY.md.*
