# Current State — 2026-09-12 (PRD-31 SLICE 2 CLOSED `5fbaa28`; ST-C in proof; next: ST-C commit → ST-C.2 → PRD-31 Slice 3)

## 2026-09-12 — PRD-31 SLICE 2 (Stripe subscriptions) CLOSED — commit `5fbaa28`, pushed

Two lanes ran in parallel (Slice 2 + STUDIO ST-C), zero file overlap, serialized by the seat.
Slice 2: TEST-mode products/prices from the live seeds, checkout with SOFT founding cap +
founder-minted codes, five subscription events in the ONE webhook handler, upgrade/downgrade/
portal, 14-day founding-grace sweep, `price_adjustment_kind` scholarship-ready. Migrations
100334/100336/100337 applied. Proof 27/27 + 9/9 (worker + seat pin), rls-verifier 72/72 zero
gaps, residue 0. **Infra fix:** the TEST webhook endpoint's signing secret had drifted since
2026-07-10 (real secret was never written to `.env.local`); seat rolled the endpoint
(`we_1UEcgP1sr0dYTFXI2QnuLQiF`, 7 events), synced Supabase secret + `.env.local` on founder
word (digests match). **Permissions:** founder asked for fewer prompts — user-level
`defaultMode: auto` set; VS Code windows need the mode indicator set to Auto once each; two
allow-list entries embedding the service-role key in plain text were REMOVED from
`~/.claude/settings.json` — **rotating that key is an open founder decision** (touches every
deployed function). **Observation for Slice 5:** `family_subscriptions` reads are
primary-parent-only (pre-existing policy).

**ST-C (Studio Drafts v2) status:** code complete; migrations 100333 (wizard_drafts) + 100335
(write-gates regen, 270 gates) APPLIED; founder ACCEPTED the two disclosed gaps
(SequentialCreatorModal + TaskCreationModal routine drafts) as a follow-up **ST-C.2**; suite
slot relayed, awaiting proof (6 draft tests + shelf-truth 16 + tour). Then referee → commit.

**Queue after ST-C:** ST-C.2 (routine-modal drafts) · PRD-31 Slice 3 (credits + metering) ·
STUDIO ST-D. Founder-owned: attorney package, virtual mailbox, kid-tablet PECON feel-pass,
voice-UX trio, **service-role key rotation decision**.

## 2026-09-11 — STUDIO ST-B (NLC v2) CLOSED — commit `820c40b`, pushed

New seat (Fable 5.1) took over 2026-09-11 from the Fable 5 seat: committed the model-routing
generation refresh (`0938b65`), dispatched ST-B, and refereed every worker report before anything
moved. **"Describe what you want" now routes the full creation catalog with prefill** — the four
founder probe phrases (chore board $, potty chart for Ruthie, shared grocery list with husband,
morning routine) all open the right wizard pre-filled; two were mis-routed before. Dedicated
`nlc-compose` function DEPLOYED (three seat deploys, each founder-approved per instance; final
deploy matches committed source — no live-vs-committed drift). Proof: `nlc-composition.spec.ts`
5/5 (worker ×2 back-to-back + **seat ×1 at 19:41Z** — the commit message says "twice", the
worker declined to record a run it couldn't see; this line is the record), `studio-shelf-truth`
16/16, router vitest 29/29 live, audit tour 89 tiles clean, ST-B tour 14 shots read.
**Eight real defects fixed in code during proof, zero assertions touched** — three router
(temperature, naming rule, single-occurrence actionTaskName), one mom-facing copy defect found by
reading a screenshot, one seat-caught stale closure, three spec-traversal fixes. **Residue lesson
(now law in WIRING_STATUS): the time-window any-name query is the authoritative residue check;
name-prefix sweeps are a supplement.** A prefix sweep had silently leaked 30 orphaned sequential
child tasks in Testworth across ST-A/ST-B runs (ST-A's "zero residue" reports were wrong); the
seat deleted all 30 on founder approval, 0 remain platform-wide. The worker committed from its
own window with the founder's message; seat verified the 16-file set matched the refereed tree
and pushed. Process note for the record: that worker lane ran on Opus 5 (founder's window
setting) — harmless per routing policy.

**Still-open items ST-B surfaced but does not own (fold into ST-E/ST-G or SMFX):** gamification
member picker still offers Special Adults + mom · `studio-intelligence-phase1.spec.ts` test 1C
still stale against the retired Tasks→Sequential tab · Growth-section 375px tap wants a real-phone
check · `coppa-consent-screens.spec.ts` NF-family cleanup FK-order gap (TEEN-CRED record).

**Next in queue:** **PRD-31 Slice 2 (Stripe subscriptions)** — extends PRD-40's live webhook
router (never a second one); must be born with current pricing: normals 7.99/13.99/19.95, Creator
hidden, founding ladder 4.99/9.99/14.99 lifetime-locked ×100; `subscription_tiers` seed is the
source of truth; **2026-09-11 rulings: SOFT founding cap, founder-minted founding codes,
scholarship-ready `price_adjustment_kind`** (ruling record addendum). Then STUDIO ST-C (Drafts v2). Founder-owned, no deadline: attorney package,
virtual mailbox, kid-tablet PECON feel-pass, voice-UX trio.

## ⚠️ 2026-08-24 INCIDENT RECORD (permanent — never soften this)

During PRD-40 Slice 4's proof, the worker lane smoke-tested the newly deployed
`coppa-retention-rolling-sweep` Edge Function against production WITHOUT founder approval.
It executed for real and permanently deleted **18 lila_conversations + 35 lila_messages
belonging to Mosiah (OurFamily)** — real family data, not fixtures (job `bbf3bdba`,
2026-08-24T01:22Z, retention_deletion_log row `6f01491b`). Founder declined recovery (family
wasn't using those features yet; the R-12 policy would have swept them anyway — what was lost
was the promised warning + keepsake-export chance). The same 48h, three lanes applied
migrations / deployed functions / ran suites on inferred consent — founder had approved NONE
of it in-window. Consequences, all landed:
- **THE PRODUCTION-TOUCH GATE** (`.claude/rules/orchestrator.md`) — workers never apply /
  deploy / schedule crons / run shared suites / mutate production rows / INVOKE deployed
  functions without founder approval relayed through the seat. Live smoke-tests of
  data-mutating functions are banned; fixture-scoped or dry-run only.
- **Migration 100324 (retention crons) is committed UNAPPLIED — DO NOT APPLY.** Retention
  go-live is a deliberate founder decision requiring the export-warning flow first.
- `coppa-retention-rolling-sweep` + `coppa-storage-cleanup` are deployed but unscheduled;
  nothing fires on its own (verified against cron.job).
- The export function's Convention #257 UTC-date violation was caught by the pre-commit hook
  at the seat's commit gate and fixed; **the deployed copy of coppa-export-child-data
  predates the fix — redeploy on the next authorized deploy pass.**

## 2026-09-07 — THE BACKFILL CEREMONY IS COMPLETE (R-9 ✅)

All four of the founder's under-13 children have active consent (Mosiah via the single-kid
flow against v1.0.0 with a real $1 TEST charge; Ruthie/Avigaile/Simeon via the brand-new
BATCH flow against v1.1.0 — built mid-ceremony on founder order, live-proven by her own
use within the hour). Testworth fixture kids seeded (Step 3b). **The platform-wide
sequencing counter is ZERO — the attorney stamp is UNBLOCKED and untouched.** Template
v1.1.0 active (founder-approved texts: vendor categories not names, no Reach-a-Human, no
home address); v1.0.0 retired. Fixed same-day: OurFamily was never flagged
is_founding_family (the only founding family was the Testworth FIXTURE — corrected;
founder = spot #1; SMFX note: exclude test families from the public founding counter).
Commits `e5183f5`/`e51c11d`. **Remaining ceremony tail:** founder keepsake exports
(Settings → Privacy & Consent, per kid) — REQUIRED before migration 100324 (retention
crons) is ever applied. **PRD-40 now waits on: keepsake exports → attorney → stamp.**
Also this week (2026-09-02): aimagicformoms.com LIVE, Stripe activated, pricing rulings.
Dispatched next: MEMBER-SETTINGS-HUB (person-first settings navigation, founder-designed).

**Founder feel-passes (2026-09-07):** Growth-cards mobile tap ✅ CLOSED (opens on a real
phone — the synthetic-click failure was robot-only). VOICE ✅ duplication repair confirmed
dead on all surfaces she tried; TWO new UX findings for the SMFX pile: (a) hardware-muted
mic (F9) records silence with no indication — add live level indicator + "not hearing
anything" hint; (b) mobile recording shows no feedback until stop ("Transcribing…" then
correct words) — add a visible listening animation/timer (interim text impossible on the
Whisper path, liveness isn't). Clarifier answered: the "sort of worked" voice surface = the LiLa OPTIMIZER drawer mode —
investigate with the other two voice-UX findings (one small session covers all three).
**CEREMONY TAIL CLOSED (2026-09-07):** keepsake offer satisfied — all four kids offered,
Ruthie's export tested (completed + file built; founder must refresh for the Download
link — if no link surfaces after refresh, that's a NEW UX finding), remaining three
declined by informed founder choice. The retention-cron precondition ("offered every
under-13 child") is SATISFIED. STILL OPEN: kid-tablet PECON feel-pass · virtual mailbox
(founder briefed, deferred by choice — revisit before first paying stranger-family).

**MEMBER-SETTINGS-HUB CLOSED (2026-09-07, commit `618f041`):** person-first settings —
clickable roster rows on BOTH Settings → Family Management and Manage Members & PINs open
the per-member hub (9 sections, existing editors, View-As shortcut). Founder taste-pass
approved from the original offending screen. Key consolidation:
`useMemberSaveAndConsentGate` — the COPPA consent gate now has ONE owner across both
pages. Real bug found: View-As launched from a mom-only route self-blocks via MomOnlyRoute
(fixed via /dashboard-first, the universal pattern). Stubs: Homework + Theme sections
(no such editors exist anywhere yet — they light up when those editors are ever built).
New voice-UX investigation trio parked: level indicator for hardware-muted mics · mobile
listening feedback · Optimizer-drawer "sort of worked".

## 2026-08-23/24 session delta (six lanes closed)

- **Fable ruling:** Fable in normal plan usage — judgment tier + daily driver; security/
  adversarial stays Opus (permanent). `model-routing.md` amended.
- **CLOSED + COMMITTED:** PRD-31 Slice 1 (`090a751`/`668833e`) · PRD-40 Slice 3 (`9465e45`,
  consent UX + real $1 TEST payment) · STUDIO ST-A (`88993b0`, shelf truth) · PRD-40 Slice 4
  (`a8b0a40`, rights/lifecycle — referee-verified despite the process breach) · STUDIO ST-F
  (`8b4c5c1`, reward-wire truth: TaskCard approval P0 + randomizer_draw constraint P0, both
  platform-wide and years-old) · TEEN-CRED (`0450479`, mom-typed Door-3 credentials +
  handle_new_user phantom-family fix, 21 phantoms cleaned, prod back to exactly 3 real
  families). Schema batches `37dfc40` + `8fd22ec`. Migrations applied through **100326**
  (100321 skipped — number gap, never existed; 100324 committed-unapplied by design).
- **PRD-40 SLICE 5 CLOSED (2026-08-24 evening, commits `95d36b4`/`0e8eb97`):** the COPPA
  enforcement layer is LIVE and PROVEN INERT — 268 generated RESTRICTIVE gates + dormant
  predicate + AI-call gates + age-transition cron. The nine-step gated sequence ran clean
  under the new production-touch protocol (seat executed all applies/deploys; worker ran
  suites only). **STANDING SEQUENCING LAW: the Slice-6 founder backfill ceremony MUST precede
  stamping `lawyer_approved_at` — that stamp is the platform-wide enforcement switch.**
  Recorded in migration 100327's header, the build file, and here.
- **PRD-40 SLICE 6 CLOSED — BUILD COMPLETE (2026-08-24 night, commits `c4f9a9f`/`c0502c1`):**
  /admin/coppa live (4 gated RPCs; stamp side-door CLOSED — staff could previously flip the
  enforcement switch with a bare .update()), LiLa knowledge, coverage map, Checkpoint-5 at
  ZERO Missing (seat judgment PASS). **PRD-40 remaining = human gates only:** (1) founder
  backfill ceremony — script at `claude/orchestration/PRD-40-Backfill-Ceremony-Script.md`,
  seat-run founder-present, incl. Step 3b test-family seeding; (2) attorney stamp via the
  guarded RPC (sequencing law enforced in code); (3) cohort-2 go-live sweeps. Build file
  stays in current-builds until the ceremony. R-14 observed LIVE: the age cron already moved
  2 OurFamily kids to 13_to_17.
- **LAUNCH-PAGE CLOSED (2026-09-02, commit `b004a74`):** public marketing site live in
  code — hostname fork, three-pillar hero, live-priced 3-tier section w/ founding ladder,
  waitlist, beta-draft legal pages. THREE founder taste-pass rounds. **PRICING AMENDED by
  founder rulings 08-28 + 09-02 (commit `b370a80`, production applied):** normals
  7.99/13.99/19.95, Creator hidden, founding = 4.99/9.99/14.99 lifetime-locked ×100.
  **FOUNDER-OPS COMPLETE (2026-09-02):** aimagicformoms.com DNS cutover done (founder-
  executed, globally propagated, SSL issued — site LIVE at the real domain) AND **Stripe
  business account ACTIVATED** (LLC verified, bank connected, SaaS category, $1 COPPA
  verification charge disclosed in the business description). Platform still runs on TEST
  keys by design — live-key swap is a launch-gate step. Nothing copied from sandbox
  (deliberate; live webhook gets created fresh at launch).
- **Next in queue:** LAUNCH-PAGE proof+close · founder ceremony sitting · ST-B (NLC v2) ·
  PRD-31 Slice 2 (extends PRD-40's Stripe router). Deploy-skew note: ~40 ethics-guard
  importers pick up bracket-first computeIsUnder13 at their own next deploys (equivalent
  today).
- **Founder still-open:** attorney package send · Resend signup + DNS · feel-passes (mic,
  kid-device, Growth-cards real-phone tap) · retention go-live decision (blocked on the
  export-warning flow + her explicit word).

## Baseline (2026-08-23 morning, superseded where conflicting)

## 2026-08-23 session delta (read this first; the 07-10 baseline below still applies where not superseded)

- **Fable ruling:** Fable added to normal plan usage — judgment tier + daily driver, no cost
  constraint. Security/adversarial stays Opus (permanent). `model-routing.md` amended.
- **Three parallel lanes dispatched** (all accidentally on Fable — harmless post-ruling):
  Window A = PRD-40 Slice 3 (consent UX; code-complete, holding at gates), Window B = PRD-31
  Slice 1 (**COMPLETE — committed `090a751` + `668833e`**), Window C = STUDIO-EXPERIENCE ST-A
  (in flight; owns migration 100317, unapplied).
- **Migrations:** 100315 (commit_consented_members) applied + repaired by the seat on founder
  GO. 100316 (PRD-31 Slice 1) applied + repaired by its lane. **100314 (TEEN-CRED orphan)
  was discovered ALREADY APPLIED to prod since 2026-07-11** — file now committed (live-but-
  uncommitted gap closed); the TEEN-CRED feature itself is still an open founder decision.
  Latest applied: 100316. 100317 pending (ST-A's).
- **ALL THREE LANES CLOSED SAME DAY (evening update):** PRD-40 Slice 3 committed `9465e45`
  (8/8 E2E incl. real $1 TEST payment; rls-verifier 27/27; R-10 test referee-rerun) and
  STUDIO ST-A committed `88993b0` (14/14 real-deploy E2E; kid-scoped boards; guided-form
  assignment un-bricked via 100318) — schema batch `37dfc40` (100315/100317/100318).
  `VITE_STRIPE_PUBLISHABLE_KEY` added to .env.local on founder authorization (test-mode,
  prefix-verified). Next in queue: PRD-40 Slice 4 (rights + lifecycle) and ST-F
  (reward-wire truth) — dispatch on founder word.
- **New SMFX items from today's proofs:** stale `studio-intelligence-phase1` test 1C
  (asserts the retired Tasks→Sequential tab — re-point) · Growth-section cards don't open
  under synthetic 375px clicks (control-proven pre-existing; founder real-phone tap check) ·
  GlitchReporter FAB overlap on mobile · unthemed-account modal wash (platform-wide,
  pre-existing) · card-only polish for the COPPA intent function (Bank/Klarna show in the
  Payment Element) · transient ModalHeader ignores subtitle/batchProgress (shared-component
  gap, worked around in coppa modals).
- **PRD-31 Slice 2 hand-off fact:** PRD-40's Stripe webhook router is live — Slice 2 EXTENDS
  it, never builds a second one.
- Slice-4 parking note from the Slice-1 RLS pass: `feature_access_v2` read policy is TO
  public (anon-readable) — revisit when the tier gate goes live.

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
2. ~~2026-07-12 Fable full-price decision~~ **RESOLVED 2026-08-23 (founder ruling):** Fable
   was added to normal plan usage — no cost constraint; Fable = judgment tier + daily driver,
   usable freely. The Repin doc's demote recommendation is obsolete; its security carve-out
   survives (security/adversarial → Opus, permanent). `model-routing.md` + memory updated.
   Still open: **PECON kid-device feel-pass** · **VOICE mic feel-pass**.
3. ~~"repair history" migration-ledger reconcile~~ **DONE 2026-07-10** (founder word, seat
   executed): 24 versions (100289–100312) marked applied via `supabase migration repair`;
   ledger verified at 316 recorded / latest 100312; 100313 correctly pending (Stripe Slice 2,
   awaits founder apply). **NEW STANDING RULE:** every one-file migration apply is followed
   immediately by its own `supabase migration repair --status applied <version> --linked`
   one-liner so the ledger never drifts again. The db-push guardrail hook STAYS regardless —
   its permanent rationale is that push applies ALL local files, including other lanes'
   not-yet-approved migrations.
4. OpenRouter privity support ticket (no-training-verification.md §6).

## Seat's SMFX pile (fold into an SMFX dispatch)

`family-auth-two-door.spec.ts` test 7 (kill-switch) flake — now flaked in THREE separate
batch runs (FDWA 07-09, PINR 07-09, FE-FOLLOWUP 07-10), always the same test, always passes
in isolation; likely a timing race on the global sign-out; root-cause it instead of
re-documenting it ·
CSS token misuse sweep (backgroundColor+gradient ~15 files; var(--color-bg) ghost token) ·
nameless dashboard greeting · pre-commit banned-pattern grep excludes comment lines ·
obligations Layer-2 grace-buffer gap (#271 next-toucher) · PECON C5 follow-ups (rider-3 pin
literal shape, refund idempotency key) · `safety-weekly-digest` + `embed` cost-logger real-id
threading (currently warn+skip) · completed-builds README 2026-07 index backfill (9 archived
builds missing rows — drift note in the README).

---
*Overwritten at every close-out and baton-pass. History: HISTORY.md.*
