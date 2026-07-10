# Current State — 2026-07-10 midday (Convention #247 GATE CLEARED — enforcement LIVE; no lanes active)

> Rebuild the full picture from: this file → `claude/dispatch-factory/MANIFEST.md` (build queue)
> → `.claude/rules/current-builds/*` (in-flight) → `.claude/completed-builds/README.md` (history).
> Everything below is on `main` through commit `d9fc77c` + the close-out docs batch. Tree clean.

## What landed 2026-07-09 evening → 2026-07-10 (all committed + pushed)

- **PHASE-4 FLIP LIVE — Convention #247 beta gate CLEARED (2026-07-10, founder GO).**
  `ENFORCEMENT_MODE 'shadow'→'enforcing'` across all 40 ethics-guard-importing functions.
  Pre-flip: safety-beta-gate 58/58, ethics 10/10 (incl. 4/4 deity-block), calibration 100%
  Tier-1 recall / 100% Tier-2 reject / 0% false positives. Post-flip live-verified: retraction
  + reframe end-to-end, crons green, no false-positive flood. Rollback pre-authorized
  (shadow + redeploy). SAFETY-BETA-GATE archived to completed-builds. Commit `d9fc77c`.
- **Step-0 pre-flip check caught a REAL shipped defect (twice-corrected record):** PRD-30
  Layer-2 was silently lossy since ship — fenced-JSON parse bug (12 monitored-kid
  conversations permanently stuck; deity gate bricked fail-closed in a 3rd function) + FK-dead
  cost telemetry (zero safety/ethics cost rows ever). Fixed via `_shared/json-extract.ts`
  across 3 functions + real-id cost logging; live-proven (23/23 scanned; seeded self-harm →
  flag + starter + mom notification end-to-end). Commits `e82fadb`, `0c4ffb8`. Record
  corrections appended to `claude/feature-decisions/PRD-30-Safety-Monitoring.md` and
  `Beta-Readiness-Report-2026-07.md` (criterion-6 overstatement corrected).
- **RPC-EXECUTE sweep COMPLETE** (migration 100312, commit `0fe3bfb`): 3 in-body gates incl.
  new server-computed `grant_money_for_task_completion` (built+gated, NOT yet wired to its 2
  frontend call sites), 13 fns → service_role-only (incl. pin-caught `upsert_book_library`),
  2 anon-closed, permanent CI pin `tests/rpc-grant-audit.test.ts`. 26/26 rls-verifier probes.
- **FDWA+PINR + GDCX Checkpoint-6 docs cascade** (`e550cbd`) — STUB/WIRING/#273/archives.
- **07-12 Fable deliverables ready** (`bf8310a`): Beta Readiness delta (now further updated
  with the gate closure) + `claude/orchestration/Model-Routing-Repin-2026-07-12.md`.

## Beta scoreboard (from the Beta Readiness report, 2026-07-10 update)

Criteria 3, 4, 6, 7 ✅ · 5 N/A · **remaining path: Stripe test keys → PRD-40 Slices 2–6 →
attorney package → founder declaration.** Criteria 1/2 🟡 (PRD-40 Slice 1 live), 8 🟡
(founder-external), 9 ⬜.

## Immediate queue

1. **PRD-40 Slice 2 (Stripe foundation)** — blocked ONLY on founder test keys. Dispatch
   prompt ready in `.claude/rules/current-builds/PRD-40-coppa.md`.
2. **Frontend follow-up lane (Sonnet, one session, now unblocked — no suites running):**
   kid-PIN derived-secret fix (founder ruled: KEEP 4-digit PINs; mirror `family-auth-admin`
   picture path) · wire `grant_money_for_task_completion` into `useTasks.ts` +
   `useTaskCompletion.ts` (retire the client-computed amount) · teen mom-initiated invite.
3. **JSON.parse sweep (small Sonnet task):** route every OpenRouter-response parse site
   through `_shared/json-extract.ts` — the fenced-JSON class hit 3 functions; close it
   platform-wide. Include digest/embed cost-logger real-id threading.
4. **Dispatch-factory queue** (`MANIFEST.md`): STUDIO-EXPERIENCE ST-A prompt ready; SMFX;
   BSB1 unblocked; P3 chains per pack edges.
5. **csm_insert_admin_or_parent branch-1 mystery** (PRD-15) — diagnosed, not chased.

## Standing operating rules

- **Model routing: security/adversarial → Opus (Fable flags it — firm, permanent).** Two-step
  /model headers on every dispatch (manual founder step). ONE shared Playwright suite at a
  time across windows (seat serializes). Live-captured-response pins for any pipeline that
  parses model output (new lesson, 2026-07-10 — synthetic fixtures missed the fenced-JSON bug).
- Seat-executed release batches: schema commit first, then per-lane code commits (selective
  staging, own files), then shared-docs sweep. **Founder standing push-after-review
  authorization.** Production migrations / Edge deploys / destructive ops = founder
  per-instance (deploy method of record: `--use-api`, Docker not running; migrations via
  `db query --linked -f`, never `db push` — ledger lags ~20 files, see repair-history item).
- Pre-commit prose false-positives → reword, never override. Migration numbers re-checked at
  apply time (**100312 latest**).
- Convention #277 tours + DB-asserted pins are the only accepted proof.

## Founder-only open items

1. **Stripe test-mode keys** (`sk_test_` + optional `whsec_`) → unblocks PRD-40 Slice 2; the
   seat sets them via `supabase secrets set` on receipt. **Attorney package**: 3 contact
   blanks (mailing address, privacy email, phone) → seat fills the legal-drafts → founder
   sends. **Resend signup + DNS** → safety + Out-of-Nest emails.
2. **2026-07-12 Fable full-price decision** — both deliverables ready (see above); NOTHING
   re-pinned until she rules. **PECON kid-device feel-pass** · **VOICE mic feel-pass**.
3. **"repair history"** migration-ledger reconcile (~2 min, seat runs on the word — now ~22
   one-file-applied migrations incl. 100312).
4. OpenRouter privity support ticket (no-training-verification.md §6).

## Seat's SMFX pile (fold into an SMFX dispatch)

CSS token misuse sweep (backgroundColor+gradient ~15 files; var(--color-bg) ghost token) ·
nameless dashboard greeting · pre-commit banned-pattern grep excludes comment lines ·
obligations Layer-2 grace-buffer gap (#271 next-toucher) · PECON C5 follow-ups (rider-3 pin
literal shape, refund idempotency key) · `safety-weekly-digest` + `embed` cost-logger real-id
threading (currently warn+skip) · completed-builds README 2026-07 index backfill (9 archived
builds missing rows — drift note in the README).

---
*Overwritten at every close-out and baton-pass. History: HISTORY.md.*
