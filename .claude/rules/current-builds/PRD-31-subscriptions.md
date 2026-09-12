# Active Build: PRD-31 — Subscription Tier System (+ Tier Chart NEW-BB / Convention #256)

> **Status: SLICE 1 COMPLETE (2026-08-23, applied to production, NOT COMMITTED — holding for founder review). SLICE 2 (Stripe Subscriptions) PROOF COMPLETE (2026-09-11) — 36/36 green (27/27 `subscription-tiers.spec.ts` + 9/9 regression on `coppa-stripe-foundation.spec.ts`, the shared webhook handler's other consumer), both residue checks clean, all migrations applied to production. HOLDING for rls-verifier + seat referee pass + founder commit — NOTHING staged or committed yet.** See the 2026-09-11 progress-log entry for the full build record: three migrations (100334 schema, 100336 a NOT NULL fix, 100337 a public-schema RPC wrapper), a rolled Stripe webhook endpoint secret (external infra, not a code issue), and five real bugs found and fixed live during proof (one product bug — a `create-subscription-change` schedule-phase drift risk fixed before it was ever exercised — and four test-file bugs, none of which needed a second redeploy once found). Pre-build approved 2026-07-08; OD-31-A..D all resolved (verbatim in the ruling record §4); the 2026-09-11 founder addendum (soft cap, founding codes, scholarship forward-design) is LAW for this slice and is fully encoded and proven live.
> **Tier chart = LIVING DRAFT until flip time** (founder's beta strategy): Slice 1 encodes the approved A-principle (non-mom `E`→`En`), the D-move (`safety_monitoring_basic` mom→E), the §N repairs, and the three default rules; the founder's cell-level marks land on her schedule via later seed updates or the Screen-4 grid.
> Authority chain: `prds/scale-monetize/PRD-31-Subscription-Tier-System.md` (full read) → `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` + `PRD-31-Cross-PRD-Impact-Addendum.md` (full reads) → `claude/dispatch-factory/PRD31.md` (approved pack; rulings 1–9 = LAW; D-PRD31-1..7 RESOLVED 2026-07-04, D-PRD31-5 GREENFIELD) → `claude/dispatch-factory/PRD31-RECON.md` → `claude/feature-decisions/PRD-40-COPPA-Compliance.md` §3 (THE Stripe boundary — extend, never redraw) → **`claude/feature-decisions/PRD-31-Subscription-Tiers.md` (THE ruling record — R31-1..12 + OD-31-A..D; read it first, it wins over stale PRD text)** → this file (slice plan + dispatch prompts).
> **Founder-markup deliverable:** `claude/feature-decisions/PRD-31-Tier-Chart-DRAFT.md` — every feature key × 6 role groups from the LIVE seeds, questionable assignments flagged. The founder reacts to it; she never composes tiers from a blank page.
> **Migration discipline: NO numbers reserved.** Last seen: 100304. Five parallel sessions landed 100289–100304 across two evenings. Take the next free number at file-creation time, re-verify immediately before applying; if foreign unapplied migrations are pending, apply only this build's idempotent SQL via `supabase db query --linked -f` — never `db push`.
>
> 2026-07-08 — **Step 0 override (Convention #241), recorded for founder acknowledgment:** read-only judgment session, proceeded Grep/Glob-only per the PRD-40 audit precedent (codegraph/AURI state not re-verified; no code written). Implementation workers MUST re-run Step 0 at their own session starts.

---

## Source material read (this session, in full)

- `prds/scale-monetize/PRD-31-Subscription-Tier-System.md` — all 1210 lines
- `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` (499 lines) + `PRD-31-Cross-PRD-Impact-Addendum.md` (249 lines)
- `claude/dispatch-factory/PRD31.md` + `PRD31-RECON.md`; `claude/feature-decisions/PRD-40-COPPA-Compliance.md` §3 (Stripe boundary)
- Always-relevant addenda checked: PRD-Audit-Readiness (tier-rationale habit — informs the chart), PRD-Template-and-Audit-Updates (no PRD-31 rulings)
- Freshness delta: `git log --since=2026-07-04` (34 commits — SAFETY-BETA-GATE deploy, NOTRAIN-HARDEN, PECON-EARN/SHOP, PRD-30 SM-A/B/C, PRD-42/43, night batches); live code verification of every load-bearing pack claim; **live production DB read-only queries** of `feature_access_v2` (390) / `feature_key_registry` (222) / `permission_level_profiles` (173) / `subscription_tiers` seeds — the DRAFT tier chart is derived from these, not from migrations

## The headlines the founder needs

1. **Everything the pack promised still holds; one constraint dissolved and one new choke point appeared.** Stripe still 0%/greenfield; credits/metering still 0%; `useCanAccess` still the hardcoded stub (its return TYPE already matches the addendum — internals-only rebuild, no caller migration). The pack's Slice-3 blocker (SAFETY-BETA-GATE touching the same Edge Functions) is **satisfied** — it deployed 2026-07-07. New: NOTRAIN-HARDEN routed all 48 AI call sites through one shared OpenRouter client — a second candidate choke point for the credit check/deduct (ruling R31-6 lets the Slice-3 worker choose the wiring; the accounting stays on cost-logger).
2. **The live seed data is messier than the recon knew — and now it's fully mapped.** 390 rows (grew from 362), 78 registry keys with zero assignments (including ALL of BookShelf, Family Hub, Family Overview, the Guided shell, Family Login), 45 rows with NULL tier ids, 3 unregistered keys carrying live rows, 4 duplicate key pairs, and the role_group values are PLURALIZED vs the PRD's enum (live wins — R31-1). All repairs itemized in the chart §N; Slice 1 executes them.
3. **The DRAFT tier chart is built and waiting for your pen** (`claude/feature-decisions/PRD-31-Tier-Chart-DRAFT.md`). Its biggest finding: **the live seeds contradict Essential's own story** — Essential is documented "mom-only, no connected family members," yet ~60 non-mom cells (tasks, messaging, meetings, gamification, Play dashboard, reward shop, wishlists…) sit at Essential. Decide the principle once (OD-31-A) and the markup becomes mechanical. Also: Creator is completely empty (by design — confirm), and safety monitoring's tier placement is flagged as a values question (OD-31-D).
4. **The beta-bypass exit finally has a complete registry** (below) — all 16 surfaces the `useCanAccess()` flip touches, including the brand-new `safety-classify` `TIER_GATE_ENABLED` stub (2026-07-08), the Sidebar/`useResolvedFeatureAccess` nav layer, Vault `allowed_tiers`, `blocked_by_tier`/`recalculate-tier-blocks`, and the grant-key composition audit. Slice 4 builds the per-layer activation switch; nothing turns on when the build ships (pack ruling 6 — building ≠ activating).
5. **Stripe sequencing is pre-authorized in both orders.** PRD-40 (which owns the webhook-router foundation if it goes first) is approved but NOT dispatched. The §3 contract makes either order safe: whoever ships first builds `_shared/stripe.ts` + the purpose-routed handler + the dedup table; the other extends. The coordination seat picks; no re-litigation in-session (R31-12).
6. **Points ≠ AI credits.** The PECON point economy (kids' points, Reward Shop) and the AI-credit economy (mom's "AI actions") are firewalled — separate ledgers, separate choke points, separate vocabulary, credits never on kid surfaces (R31-5). Verified zero code overlap today.
7. **No email dependency** (R31-8): past-due/expiry warnings are in-app notifications; Stripe sends its own receipts; dunning sequences are post-MVP.

## Founder decisions

- **D-PRD31-1..7: RESOLVED 2026-07-04** (pack) — not reopened. D-PRD31-5 = GREENFIELD Stripe.
- **OD-31-A..D + chart default rules: ✅ ALL RESOLVED (founder, 2026-07-08)** — verbatim resolutions in the ruling record §4. A: Essential stays mom-only, non-mom `E` cells → `En` mechanically, founder marks exceptions on her schedule (living draft). B: grant×tier AND-composition approved — tier changes never auto-grant/auto-revoke. C: allotment numbers deferred to flip time (real usage data). D: `safety_monitoring_basic` → Essential (floor-level "mom knows"); `safety_monitoring_ai` stays FM.
- **Founder external action:** Stripe account + TEST-mode keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` as Supabase secrets) before Slice 2 proof — shared gate with PRD-40 §8.

## Beta-Bypass Exit Registry (R31-11 — Slice 4's checklist, Slice 7's probe list)

Every surface the Convention #10 exit touches. Any parallel build adding a new bypassed surface MUST add a row here.

| # | Surface | Where | What changes at exit |
|---|---|---|---|
| 1 | `useCanAccess()` — the canonical gate | `src/lib/permissions/useCanAccess.ts:19-23` | Hardcoded `{allowed:true}` → real 3-layer resolution behind the `tier_gating` switch layer |
| 2 | `PermissionGate` + its 8 mounting pages | `src/lib/permissions/PermissionGate.tsx`; SettingsPage, MeetingsPage, BookShelfPage, ArchivesPage, MemberArchiveDetail, FamilyOverviewDetail, ContextExportPage, PrivacyFilteredPage | Dormant `tierFallback`/`toggleFallback` paths go live; UpgradeModal becomes the default tierFallback |
| 3 | Direct `useCanAccess` call sites | `MindSweepCapture.tsx:115-116` (mindsweep_scan/link), `TaskBreaker.tsx:45` (tasks_task_breaker_image), `TaskCreationModal.tsx:699` (homeschool_subjects), `TaskCard.tsx:252-253` (timer_basic/advanced) | Real results — each verified to have a graceful blocked state, never a blank wall (Cross-PRD addendum, PRD-04 note) |
| 4 | Sidebar tier locks | `Sidebar.tsx:760-761` (`tierLocked = false // Will be: !useCanAccess(...)`) | Real Lock icons; flows into BottomNav More automatically (Convention #16 single source) |
| 5 | Nav-visibility layer | `useResolvedFeatureAccess.ts:94` (documented tier slot) | `{enabled:false, source:'tier_lock'}` activates; Sidebar/BottomNav/ViewAsModal parity automatic |
| 6 | **Server-side: `safety-classify`** | `supabase/functions/safety-classify/index.ts:126,393,882,995` — `TIER_GATE_ENABLED=false` (registered stub, 2026-07-08) | Flip + implement the first server-side `feature_access_v2` lookup (`safety_monitoring_ai` gates Layer-2 sweeps + conversation starters). Slice 4 ships `_shared/tier-access.ts` so no Edge Function hand-rolls tier resolution |
| 7 | Vault locking | `VaultContentCard.tsx:40` (`isLocked = false`), `VaultBrowsePage.tsx:42` | Locked overlays + tier badges + UpgradeModal; `vault_items.allowed_tiers` unified with `feature_access_v2` (Cross-PRD addendum) |
| 8 | `blocked_by_tier` + profile apply | `apply_permission_profile()` (migration 100260); STUB_REGISTRY:222 | `blocked_by_tier` becomes real; `recalculate-tier-blocks` Edge Function built (fires on tier change) |
| 9 | Permission Hub (Screen 7) | `src/lib/permissions/keyWiringStatus.ts` + Hub grid | 4-state tier-aware cells (✓ / off / 🔒 / ···); wiring-status registry gains the tier dimension — the Hub never claims a lock it can't enforce |
| 10 | Usage thermometer | Screen 5 (born in Slice 5) | Beta shows "∞"; post-flip shows tier allotment with color thresholds |
| 11 | Tier-sampling modal | Screen 6 (born in Slice 5) | Only renders when gating is live and credits exist |
| 12 | LiLa entry surfaces | `LilaModalTrigger.tsx:30` (+ drawer/modal gating on lila_* keys) | Flow through the hook; verify graceful blocked states per mode key |
| 13 | Grant-scoped surfaces audit | `useViewableMembers.ts:16`, GrantedRoute, useManagementGrants | R31-4 composition proof: the tier flip must not add OR remove any granted-dad access (E2E probe) |
| 14 | Settings stub retirement | `feature_expansion_registry.ts:289` (`subscription_tiers` PlannedExpansionCard) | Replaced by the real Screen 1 (Slice 5) |
| 15 | Founding override | `families.is_founding_family` + `founding_onboarding_complete` + `family_subscriptions.status` | Becomes load-bearing — founder + test families' flags verified correct BEFORE any flip |
| 16 | Registry defaults | 78 unassigned keys (chart Rule 1) | Absent row = UNGATED at activation; admin grid flags "needs assignment" until Phase 41 closes them |

## Slice plan (Sonnet xhigh workers, sequential; per-slice progress log below)

| Slice | Scope | Notes |
|---|---|---|
| 0 | **Founder:** ✅ decisions DONE 2026-07-08 (OD-31-A..D + default rules). REMAINING: Stripe account + TEST keys (gates Slice 2 proof only); cell-level chart markup continues on her schedule (never a blocker) | Decisions complete; Slice 1 unblocked |
| 1 | **Schema + seeds + registry hygiene.** 6 missing tables (`ai_credits` append-only INSERT-only RLS per Convention #223 pattern, `credit_packs` seeded ×3, `tier_sampling_costs`, `tier_sample_sessions`, `onboarding_milestones`, `subscription_cancellations`); `family_subscriptions` founding-rate columns + `is_founding_family` mirror; `feature_key_registry` +`category`/`is_lite_version`/`lite_version_of`; **chart-markup encoding** (seed corrections from the founder's marks); 45 NULL-tier repairs; 3 unregistered keys + 4 dupe merges (chart §N); missing vault keys (hearts/comments per addendum); 'never'-semantics doc + R31-9 access-semantics notes; `handle_new_user()` extension (milestone seed row); rls-verifier pass | Dispatch prompt READY below |
| 2 | **Stripe** per PRD-40 §3 boundary: products/prices from the live seeds, Checkout, 5 subscription events in PRD-40's LIVE purpose-routed `stripe-webhook-handler` (EXTEND it — R31-12), Customer Portal, upgrade-immediate/downgrade-end-of-period, past-due lifecycle (14-day grace → founding-lock loss), founding enrollment with a **SOFT** cap decided at checkout-session time (ruling 2026-09-11 — simultaneous sign-ups both win; public counter clamps at 0), **founder-minted one-time `founding_codes`** (redeem at checkout, don't consume public spots, minting RPC now / admin UI in Slice 6), and the generalized `price_adjustment_kind` on `family_subscriptions` (founding / founding_code / scholarship-ready) | Founder TEST keys loaded; duplicate-event idempotency probe mandatory; see ruling record 2026-09-11 addendum |
| 3 | **Credits + metering.** Ledger mechanics (4 sources, spending priority SQL, negative-balance rule), credit-pack purchase flow (one-time Checkout), 90-day earned-expiry cron + monthly-allotment grant (Convention #246 `util.invoke_edge_function`, `--no-verify-jwt`), **check/deduct module on the cost-logger/openrouter choke points (R31-6, fail-open while switch off)**, per-call-site metered/not-metered classification (Haiku/embeddings/Whisper NEVER metered), audit stragglers not on the shared logger | SAFETY-BETA-GATE collision constraint SATISFIED (deployed 2026-07-07) |
| 4 | **Access activation infra.** Real `useCanAccess()` internals (plural role groups, founding override, FK+boolean 'never'), UpgradeModal (fresh design per pack ruling 8), `recalculate-tier-blocks` EF, `useResolvedFeatureAccess` tier slot + `TOGGLE_KEY_ALIASES` retirement, `_shared/tier-access.ts` + safety-classify TIER_GATE wiring, **the per-layer ACTIVATION SWITCH (metering display → tier gating → billing enforcement; default OFF)**, Beta-Bypass Exit Registry walked row-by-row | Building ≠ activating (pack ruling 6) |
| 5 | **Screens.** Screen 1 Plan Comparison (retires the PlannedExpansionCard), Screen 2 Credit Packs, Screen 3 Cancellation (3-step + `subscription_cancellations`), Screen 5 Thermometer widget (beta "∞"; PRD-10 widget registration), Screen 6 Tier-Sampling modal + session tracking, Screen 7 Permission Hub 4-state cells | Mom-UI heavy — Convention #277 tour rows below |
| 6 | **Founding program + admin.** 10 milestones detection + credit awards (founding = tracked, zero credits), grace lifecycle + durability rules, admin Tier Assignment tab (next free ADMIN_TABS row, `tier_admin` staff CHECK extension — R31-7), founding counters (admin + public-ready), **Screen-4 grid = the live Convention #256 tier chart** + CSV export + Phase-41 review checklist; no hardcoded tier names anywhere (grep-verified) | |
| 7 | **E2E + verification.** `tests/e2e/features/subscription-tiers.spec.ts`: Stripe test-mode webhook lifecycle incl. duplicate-event probe, credit spend-priority + expiry, founding race (atomic counter) + durability table, **role-group gating probes with the switch ON in a dedicated TIERTEST family** (registry rows 1–16 walked), grant-composition probe (row 13), append-only RLS probes, sampling flow; regression pins (leak-pass, permissions-wiring — this build touches their tables); Convention #277 eyes-on tour; Checkpoint 5 | Fable if available, else Opus for the gate |

Sequencing: 1 → 2 → 3 → 4 → 5 → 6 → 7. Slice 2 coordinates with PRD-40 Slice 2 through the §3 contract (either order pre-authorized — R31-12). Expect 2–3 worker sessions with baton passes.

## Universal rules baked into every slice (do not re-litigate in-session)

- The ruling record's R31-1..12 are LAW; where PRD text disagrees, the ruling wins and the worker records the amendment in the verification table. Pack rulings 1–9 stand beneath them.
- `ai_credits` is append-only (INSERT-only RLS, balances always computed from ledger sum). Points ≠ credits (R31-5) — grep-verify the firewall at close.
- Building does NOT activate gating: Convention #10 stays until the founder flips the per-layer switch (Slice 4 builds it; nobody flips it in this build).
- ONE webhook handler, ONE `_shared/stripe.ts` (PRD-40 §3 contract verbatim). Stripe is the single source of payment truth — `family_subscriptions` is written by the webhook handler, never by client code.
- Haiku/embeddings/Whisper are NEVER metered. Metering deduct is fail-open while the switch is off.
- No hardcoded tier names in feature logic (Convention #256) — everything reads the chart tables.
- Convention #257 (server-derived dates for period math), #246 (crons via Vault helper, `--no-verify-jwt` + in-code auth), #280-lesson (every new SECURITY DEFINER function taking bare ids is auth-gated from birth; rls-verifier proves live), config.toml entry for every new Edge Function in the same commit, Lucide-only, theme tokens only, ModalV2.
- Proof = Playwright driving REAL flows with service-role DB assertions (TIERTEST fixture prefix, swept beforeAll+afterAll, zero residue). Ask the founder before running shared-fixture suites and before deploying ANY Edge Function. NOTHING COMMITS until proof is green and founder confirms; selective staging — heavy parallel-session traffic in this tree.

## Dispatch prompts

Per-slice prompts for Slices 2–7 are generated at dispatch time from the slice table + the pack's base prompt (`claude/dispatch-factory/PRD31.md` §DISPATCH PROMPT), each carrying: the model header, READ FIRST = ruling record → this file → chart → PRD + addenda → pack, the freshness preamble (git log since dispatch, migration re-check, PRD-40 Slice-2 landing status for Slice 2), and the universal rules block. Slice 1's prompt is READY below — dispatch only after OD-31-A markup lands.

### Slice 1 dispatch prompt (paste into a FRESH session after founder markup)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the Slice-1 worker for PRD-31 — Subscription Tier System: schema
completion, seed repairs, and registry hygiene. Zero Stripe, zero UI, zero
metering in this slice. Pre-build founder-approved 2026-07-08 (OD-31-A..D +
chart default rules all resolved) — build exactly what the rulings say. The
tier chart is a LIVING DRAFT: you encode the APPROVED PRINCIPLES (below),
never wait for full cell-level markup.

FRESHNESS PREAMBLE (before anything): run `git log --oneline
--since=2026-07-08`; re-read CLAUDE.md conventions added since; re-read
claude/feature-decisions/PRD-31-Tier-Chart-DRAFT.md for any founder marks
added since approval (encode any you find alongside the principles); check
the next free migration number at file-creation time AND re-check
immediately before applying — parallel sessions land migrations nightly. If
foreign unapplied migrations are pending, apply ONLY yours via
`supabase db query --linked -f` with idempotent SQL — never `db push`.

READ FIRST (in order):
1. claude/feature-decisions/PRD-31-Subscription-Tiers.md — THE ruling record.
   R31-1..12 are LAW (plural role groups; explicit-row 'never'; seed repairs;
   grant×tier AND-composition; points/credits firewall; access-semantics
   notes).
2. claude/feature-decisions/PRD-31-Tier-Chart-DRAFT.md — the living chart.
   §N is your repair list; the APPROVED rulings are your seed values:
   (A) every non-mom `E` cell → `En` (mechanical sweep, exceptions only
   where the founder has marked one); (D) safety_monitoring_basic mom → E;
   the three default rules govern everything unassigned/NULL; any founder
   cell marks present at your session start are encoded too.
3. .claude/rules/current-builds/PRD-31-subscriptions.md (auto-loads) — slice
   table + universal rules + Beta-Bypass Exit Registry.
4. prds/scale-monetize/PRD-31-Subscription-Tier-System.md §Data Schema
   (L764-973) — your table specs, AS AMENDED by pack rulings 1-4 (live
   feature_access_v2 FK+boolean shape stays; member_feature_toggles
   pre-populated model stays; ai_usage_tracking is the one metering pipeline).
5. prds/addenda/PRD-31-Permission-Matrix-Addendum.md — permission_level_
   profiles (already live, 173 rows) + blocked_by_tier semantics.

BUILD:
1. Migration(s), idempotent: `ai_credits` (append-only ledger — INSERT-only
   RLS for service role, mom SELECT own family, NO client writes, NO
   UPDATE/DELETE policies ever; indexes per PRD L888-891), `credit_packs`
   (seed Starter 25/$1.99, Bundle 100/$4.99, Power 300/$12.99),
   `tier_sampling_costs` (default 5), `tier_sample_sessions`,
   `onboarding_milestones` (UNIQUE(family_id, milestone_key); 10 milestone
   keys per PRD L951), `subscription_cancellations` (service INSERT, admin
   READ). Every table RLS-enabled, family-scoped.
2. `family_subscriptions`: add `is_founding_family` mirror,
   `founding_rate_monthly`, `founding_rate_yearly` (nullable DECIMALs).
3. `feature_key_registry`: add `category`, `is_lite_version`,
   `lite_version_of`; populate `category` from the chart's section headers;
   set lite-version metadata for guided_write_drawer (→ notepad_basic),
   bookshelf_teen (→ bookshelf_adult), and any others the chart names.
4. Seed repairs + approved-principle encoding, all as feature_access_v2
   upserts with plural role_group values (R31-1): the OD-31-A sweep
   (non-mom `E`→`En` across the board, exceptions only where marked); the
   OD-31-D move (safety_monitoring_basic mom→E, dad stays En); 45 NULL-tier
   repairs per the chart's inline suggestions; register `meal_planning` +
   `quicktasks`; merge `smart_notepad`→`notepad_basic`,
   `duration_tracking`→`task_duration_tracking`, `tasks_teen_studio`→
   `studio_teen_access`, retire `tasks_pomodoro`; display-name fixes
   (task_assignment grant vs tasks_family_assignment); add `vault_hearts`,
   `vault_comments_post`, `vault_comments_read` (comments = mom-only,
   is_enabled=false rows for all other role groups — the FIRST explicit
   'never' rows; addendum decision). Paste before/after row counts per
   repair class in your progress-log entry.
5. `handle_new_user()`: extend to seed the 'account_created'
   onboarding_milestones row (credits_awarded=0 during beta — the award
   logic is Slice 3/6 scope; the ROW must exist from account one). Preserve
   every existing behavior including the role='family' shadow-account
   exclusion (Convention #273).
6. R31-9 access-semantics notes: one-line "whose access this checks"
   appended to feature_key_registry.description for the ambiguous keys the
   ruling names (messaging_coaching, allowance_basic, reward_reveals_*,
   tasks_routines, linked_routine_steps).
7. Docs: 'never'-semantics + absent-row-default documented in the chart file
   header (flip its status line to ENCODED v2); DOMAIN_ORDER additions for
   the 6 new tables in scripts/full-schema-dump.cjs; `npm run schema:dump`
   after apply.

HARD RULES: Convention #280 — any new SECURITY DEFINER function taking a
bare id carries a family-membership gate from birth (this slice should need
none; flag any you create). Do NOT build Stripe, credits logic, the
activation switch, or any UI — later slices own them. Do NOT touch
point_transactions or any PECON surface (R31-5 firewall).

PROOF: rls-verifier pass over all 6 new tables against all 5 roles + a
cross-family probe (append-only probes: mom cannot INSERT/UPDATE/DELETE
ai_credits even for her own family; kid sessions read NOTHING from any
credit/cancellation table); seed-repair verification queries pasted into the
progress log (zero NULL minimum_tier_id rows remain; zero unregistered keys
carry rows; merged keys have zero orphan rows); registry-completeness spot
check (every feature_access_v2 key exists in feature_key_registry — add a
vitest pinning it so future drift fails CI); tsc -b clean; lint clean.
TIERTEST fixture prefix if E2E fixtures are needed, swept, zero residue.
NOTHING COMMITS until proof is green AND the founder confirms; selective
staging — parallel-session traffic. Fill your progress-log entry in the
active build file (migration numbers actually taken, repair verification
output, live reality for Slice 2 incl. whether PRD-40's Stripe foundation
has landed).
```

## Mom-UI Surfaces

- Screen 1 Plan Comparison (Settings → Subscription & Billing; retires the PlannedExpansionCard) — shells: mom only, new
- Screen 2 Credit Packs modal — mom only, new
- Screen 3 Cancellation flow — mom only, new
- Screen 5 Usage Thermometer (dashboard widget + Screen 1 inline; "∞" during beta) — mom, new
- Screen 6 Tier-Sampling modal — mom (all adult/teen roles post-flip; never renders during beta), new
- Screen 7 Permission Hub 4-state tier-aware cells — mom only, modification
- UpgradeModal + Sidebar/BottomNav tier-lock icons — mom/adult/independent shells, new/modification (dormant until the switch flips; tour verifies dormancy = zero visual change)
- Screen 4 Tier Assignment grid + founding counter — founder/staff only (admin shell), new
- Founding badge (Screen 1 + profile) — mom, new

## Mom-UI Verification

*(Convention #277 Claude-driven tour at Slices 5–7 — desktop/tablet/mobile as mom + admin; dormancy probes as kid/teen roles confirming ZERO visible change while the switch is off.)*

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| *(build time)* | | | | | | |

## Progress Log

*(Each slice worker appends at checkpoint: what shipped, migration numbers actually taken, deviations, live reality for the next slice.)*

- 2026-07-08 — Pre-build audit complete (this file + `claude/feature-decisions/PRD-31-Subscription-Tiers.md` + `claude/feature-decisions/PRD-31-Tier-Chart-DRAFT.md`). Live-DB-derived tier chart delivered for founder markup.
- 2026-07-08 — **Founder approved the summary; OD-31-A..D + chart default rules ALL RESOLVED** (verbatim in the ruling record §4): Essential stays mom-only (non-mom `E`→`En` sweep); grant×tier AND-composition confirmed; allotments deferred to flip time; `safety_monitoring_basic` moved to Essential, AI layer stays FM. Chart flipped to LIVING DRAFT v1.1 — founder marks land on her schedule, never a Slice-1 blocker. Slice-1 dispatch prompt updated accordingly — **HOLDING for the coordination seat to sequence dispatch.**

- **2026-08-23 — Slice 1 (Schema + Seeds + Registry Hygiene) COMPLETE — applied to production, all verifications green. NOT COMMITTED (holding for founder confirm; heavy multi-lane traffic in this tree).** Dispatched as Window B; executed on Fable (founder chose the window; deliberate routing override, noted per the VOICE-INPUT-REPAIR precedent).

  **Migration numbering — live collision caught and handled.** Next-free at session start was 100315; Window A (PRD-40 Slice 3) took `00000000100315_prd40_commit_consented_members.sql` mid-session while this file was being authored. Renumbered to **`00000000100316_prd31_slice1_credits_schema_and_seed_repairs.sql`**, applied via `supabase db query --linked -f` (never `db push` — 100314/100315 are other lanes' unapplied files), then `supabase migration repair --status applied 00000000100316 --linked`. The untracked 100314 (teen creds) was grep-verified to not touch any PRD-31 table before proceeding.

  **Freshness delta since dispatch:** re-derived ALL seed-repair targets from a live production query on 2026-08-23, not the 2026-07-08 snapshot — counts had drifted (fav2 390→392, fkr 222→224) but the repair sets matched the chart §N inventory exactly (45 NULL-tier rows, 3 unregistered keys, 151 enabled non-mom Essential cells, 0 `is_enabled=false` rows). No new founder chart marks found (chart still v1.1 principles-only).

  **What shipped (before → after, all live-verified by an independent post-apply query):**
  - **6 new tables** — `ai_credits` (append-only: mom-SELECT-own-family only, zero client write policies + explicit REVOKE, 3 PRD indexes), `credit_packs` (3 seeds: Starter 25/$1.99, Bundle 100/$4.99, Power 300/$12.99), `tier_sampling_costs` (PK feature_key FK→registry, default 5), `tier_sample_sessions` (family-member read), `onboarding_milestones` (UNIQUE(family_id, milestone_key), 10-key CHECK), `subscription_cancellations` (staff-only read; Slice 6 narrows to tier_admin). All RLS-enabled. DOMAIN_ORDER already listed all 6 (no script change needed); `npm run schema:dump` re-run — live_schema "missing" count dropped 20→14.
  - **`family_subscriptions`** + `is_founding_family` (mirror-backfilled from `families` — currently 0 founding families flagged), `founding_rate_monthly`, `founding_rate_yearly`.
  - **`feature_key_registry`** + `category` / `is_lite_version` / `lite_version_of` (FK). Categories populated for ALL 226 keys from the chart's section headers (zero NULL categories). Lite metadata: `guided_write_drawer`→`notepad_basic`, `bookshelf_teen`→`bookshelf_adult`.
  - **`feature_access_v2` hygiene:** dedup + the PRD's never-created **UNIQUE (feature_key, role_group)** index added. Merges per §N: `smart_notepad`→`notepad_basic` (3 rows), `duration_tracking`→`task_duration_tracking` (4 rows), `tasks_teen_studio`→`studio_teen_access` (0 rows); `tasks_pomodoro` retired. Retired keys removed from fav2 + registry + mft (mft/plp were clean; only cosmetic capability-tag string in studio-seed-data references 'duration_tracking' — not a feature key, untouched). Registered `meal_planning` (Management Grants, grant-semantics description per OD-31-B) + `quicktasks`.
  - **45 NULL-tier repairs** → 0 remaining, per the chart's inline suggestions (pre-sweep values so the A-principle applied uniformly).
  - **OD-31-A sweep:** 151 enabled non-mom Essential cells → Enhanced; **0 remain** (assert-guarded in the migration AND pinned by the vitest with an empty `FOUNDER_EXCEPTIONS` allowlist for her future marks).
  - **OD-31-D:** `safety_monitoring_basic` mom → Essential (dad stays Enhanced; `safety_monitoring_ai` stays Full Magic — all three live-verified).
  - **New addendum keys:** `vault_hearts` (mom E / dad En, follows browse), `vault_comments_post` + `vault_comments_read` (mom E; **10 `is_enabled=false` rows** for all other role groups) + `vault_request_content` dad flipped to Never = **the platform's first 11 explicit Never rows** (R31-2 semantics now exercised by real data). Semantics documented in `COMMENT ON TABLE feature_access_v2` + the chart header.
  - **Display-name collision fixed** (`task_assignment` → "Task Assignment Grant (adults)", `tasks_family_assignment` → "Assign Tasks to Family") + **R31-9 access-semantics notes** appended to 7 keys (messaging_coaching, allowance_basic, reward_reveals_basic/library/media, tasks_routines, linked_routine_steps).
  - **`handle_new_user()`** now seeds the `account_created` milestone row (credits_awarded=0; award logic is Slice 3/6). Everything else preserved verbatim from 100254 incl. both shadow-account skips. Functionally probed via a rolled-back idempotency + CHECK-rejection probe against production (passed, 0 residue).

  **Proof:** migration's own 9-assert verification DO block passed at apply; independent post-apply query confirmed every claim (0 NULL tiers / 0 unregistered / 0 retired / 0 non-mom-E-enabled / 11 Never rows / 6 tables RLS-on / 3 packs / fkr 226 fully categorized / fav2 399). **`tests/prd31-registry-completeness.test.ts` — 4/4 green against live production** (live-DB vitest, .env.local creds, loud skip when absent; pins: fav2⊆registry, zero NULL tiers, retired-keys-stay-retired, OD-31-A invariant with founder-exception allowlist). `npx tsc -b`: **zero errors in Slice-1 files** — the only errors in the tree are in OTHER lanes' in-flight working files (`FamilySetup.tsx` = PRD-40 Slice 3; `SharedTaskListWizard.tsx` = studio lane; they shifted between runs, i.e. actively being edited — flagged for their owners, not regressions from this slice, which touches zero src files). eslint clean on the new test. **rls-verifier: PASS, zero gaps — 56 live adversarial probes** (single BEGIN...ROLLBACK against production, all 5 roles + anon + a temp staff session across two families, zero residue independently confirmed): ai_credits mom-only-read/zero-writes-even-for-mom; credit_packs + tier_sampling_costs universal-authenticated-read/zero-writes-even-for-staff; tier_sample_sessions any-family-member read confirmed; onboarding_milestones primary-parent-only; subscription_cancellations staff-only family-unscoped read (non-staff mom correctly blocked from her own family's rows); feature_access_v2 platform-read policy survived the hygiene work untouched (verifier observation, pre-existing design: that policy is `TO public`, readable by anon — not introduced here). Full 159-line section appended to `RLS-VERIFICATION.md` ("Migration 100316 — PRD-31 Slice 1 (credits schema + seed repairs) (2026-08-23)", pure append verified via `git diff --stat`).

  **Live reality for Slice 2 (Stripe):** PRD-40's Stripe foundation **HAS landed and is deployed** (`_shared/stripe.ts`, purpose-routed `stripe-webhook-handler`, `stripe_webhook_events` dedup table, real TEST-mode endpoint + secrets — commit `d2e07a5`, 9/9 proof). Per R31-12, PRD-31 Slice 2 EXTENDS that router with its 5 subscription events — do not build a second handler or client module. `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` are already loaded as Supabase secrets. `parent_verifications.stripe_customer_id` lookup path is live for customer reuse.

  **Files this slice (for selective staging after founder confirm):** `supabase/migrations/00000000100316_prd31_slice1_credits_schema_and_seed_repairs.sql`, `tests/prd31-registry-completeness.test.ts`, `claude/feature-decisions/PRD-31-Tier-Chart-DRAFT.md` (header → ENCODED v2), `claude/live_schema.md` (regen), this build file, `RLS-VERIFICATION.md` (verifier append). Do NOT stage other lanes' files (coppa/, lib/members/, wizard files, FamilySetup.tsx, migrations 100314/100315).

## Post-Build Verification

*(Checkpoint 5 — every PRD MVP item + every R31 ruling + OD outcome + all 16 Beta-Bypass Exit Registry rows: Wired / Stubbed / Missing. Zero Missing. Copy to the feature decision file at close-out. Pre-approved stubs listed in the ruling record §5.)*

| Requirement | Status | Evidence |
|---|---|---|
| *(build time)* | | |

- 2026-09-11 — **Founder rulings recorded before Slice-2 dispatch** (ruling record addendum 2026-09-11): soft founding cap (both simultaneous sign-ups win; public counter clamps), founder-minted one-time founding codes (RPC in Slice 2, admin UI in Slice 6), scholarship forward-design via a generalized `price_adjustment_kind`. Slice 2 dispatch prompt issued by the seat with these baked in.

- **2026-09-11 — Slice 2 (Stripe Subscriptions) CODE COMPLETE — local proof green, HOLDING at the production-touch gate. Nothing applied, deployed, or run against production Stripe/DB in this session.** Freshness preamble confirmed PRD-40's Stripe foundation is deployed and live (`_shared/stripe.ts`, purpose-routed `stripe-webhook-handler`, `stripe_webhook_events` dedup, secrets loaded) — extended per R31-12, no second handler/client built.

  **Migration numbering — a live collision caught and handled mid-session.** Took 100333 at file-creation time (confirmed free via `supabase migration list --linked` and `ls`); a CONCURRENT lane (STUDIO ST-C, wizard drafts) claimed the SAME number in this shared working tree before I finished. Re-verified via a fresh `ls` + `git status`, found the collision, renumbered to the next genuinely free number: **`00000000100334_prd31_slice2_stripe_subscriptions.sql`** (self-references inside the file, including the verification block's own `RAISE NOTICE`, updated to match). Zero file overlap with ST-C's `src/components/studio/wizards/*` files — confirmed via `git status --porcelain` before and after.

  **What the migration (100334, AUTHORED — NOT applied) does:**
  - `subscription_tiers` + `stripe_product_id` / `stripe_price_id_normal` / `stripe_price_id_founding` — populated by the checked-in idempotent script (below), not by the migration itself.
  - `family_subscriptions` + `price_adjustment_kind` CHECK('founding'|'founding_code'|'scholarship') — ruling 2026-09-11 §3, the scholarship forward-design. Written ONLY by the webhook handler.
  - `families` + `is_test_family` — a genuinely new, small schema addition needed to fix the SMFX-flagged live gap ("exclude test families from the public founding counter," `.claude/state/CURRENT.md` 2026-09-07). Backfilled `true` for Testworth (`family_login_name_lower='testworthfamily'`) via format match, not fragile name-string matching.
  - **Live-data hygiene fix found and fixed in the same migration:** OurFamily's `families.is_founding_family` was corrected to `true` on 2026-09-07 (the ceremony fix), but that POST-DATES Slice 1's own mirror migration (100316, applied 2026-08-23) — so OurFamily's `family_subscriptions` row was still `is_founding_family=false` / `founding_rate_monthly=NULL`, a stale mirror. Migration 100334 re-runs Slice 1's own idempotent mirror UPDATE and backfills `price_adjustment_kind='founding'` for already-founding families, which is the minimum needed for the new counter to report correctly TODAY without waiting for a real subscription event.
  - `founding_codes` table — zero client RLS policies at all (stricter than "no reads of unredeemed" — no client access whatsoever; every legitimate interaction has a SECURITY DEFINER RPC).
  - `get_founding_family_count()` REPLACED (was 100331/LAUNCH-PAGE's version, which counted ALL `is_founding_family=true` families with no test-family or code-vs-organic distinction) — now excludes `is_test_family`, counts ONLY `price_adjustment_kind='founding'` (never `founding_code`/`scholarship`, per ruling §2: "code-granted families do NOT consume public spots"), clamps at 100 via `LEAST(...,100)`.
  - `staff_permissions.permission_type` CHECK extended with `'tier_admin'` (R31-7, forward-compat for Slice 6's admin tab) using the exact idempotent discovered-constraint-name pattern from migration 100305/100290. The founding-code RPCs gate on ANY staff row today (the founder's existing `coppa_admin` grant already qualifies) — matching the migration 100305 comment's own "standard admin gate" precedent — so nothing is blocked waiting for a dedicated `tier_admin` grant to exist.
  - `mint_founding_code(p_note, p_expires_at, p_code)` — staff-gated, auto-generates `FOUNDING-XXXXXXXX` when no code is supplied.
  - `list_founding_codes()` — **beyond the literal dispatch ask** (only minting was requested; the admin UI is Slice 6's). Added because `founding_codes` otherwise has ZERO client-reachable read path before Slice 6 lands, and the founder explicitly said she wants to "generate a one-time code... as I create connections" — with no way to check what's outstanding, that's a real usability gap for the seat/founder in the interim. Flagged here as an intentional scope addition, easily dropped if unwanted.
  - `redeem_founding_code(p_code, p_family_id)` — service_role-ONLY (never client-reachable, Convention #280 discipline: this function directly grants founding-price eligibility from a bare code string). Atomic single-use via `UPDATE ... WHERE redeemed_at IS NULL`, never throws (returns `false` on invalid/expired/already-redeemed so the webhook can gracefully fall back rather than 500-retry-looping).
  - `util.sweep_expired_founding_grace()` + daily cron (`subscription-founding-grace-sweep`, 06:30 UTC, offset from the existing 06:20 COPPA age-transition cron) — the PRD's "Payment failure beyond 14 days → founding status Lost permanently" rule. Direct-SQL cron, no Edge Function, matching the `util.coppa_reconcile_age_brackets()` precedent exactly (migration 100329). `families.is_founding_family` stays `true` (historical record, mirrors the PRD's own grace-period-miss language) — only `founding_family_lost_at` gets set.
  - Full self-verification `DO` block (9 assertions): RLS/policy-count on `founding_codes`, EXECUTE-grant boundaries on all 4 new/replaced functions, cron registration, both new columns present.

  **Design decision recorded, not silently assumed:** the public founding count is now a LIVE derived count (`price_adjustment_kind='founding'` rows), not a monotonic ratchet — a family that loses founding status frees its spot for a later organic sign-up. The original PRD's "atomic 100-counter" language reads as a ratchet; the 2026-09-11 ruling's "decided at checkout-session-creation time" phrasing reads more naturally as a live count to me. Flagged explicitly in the migration's own header comment in case the founder prefers strict never-reclaimed spots instead (an easy follow-up: a monotonic `founding_slots_claimed` ledger instead of a live query).

  **What `stripe-webhook-handler/index.ts` (EXTENDED, not forked) does:**
  - `getEventMetadata()` — a new shared helper checking `obj.metadata`, then `obj.parent.subscription_details.metadata`, then `obj.subscription_details.metadata` in order. Needed because Checkout Sessions and Subscriptions reliably carry their own top-level `.metadata` (both set identically at session-creation time), but **Invoice objects' metadata-propagation behavior varies by Stripe API version** — `_shared/stripe.ts` deliberately doesn't pin an `apiVersion`, so I built the fallback chain defensively rather than assume one shape. `routeKey()` AND the diagnostic `purpose` column write (used to be a bare top-level-only read, silently wrong for invoice events) both now use this helper consistently.
  - `getSubscriptionPeriod()` — a second defensive helper for the SAME class of API-version uncertainty: Stripe's newer "flexible billing" API versions moved `current_period_start`/`current_period_end` from the top-level Subscription object to the subscription ITEM level. Checks both locations rather than assuming. The identical fallback pattern is duplicated locally inside `create-subscription-change` (Edge Functions in this codebase don't share business-logic imports across function directories beyond `_shared/`).
  - `handleCheckoutSessionCompleted` — retrieves the full Subscription (the Session object alone lacks period dates/price ids), resolves founding kind (organic honored unconditionally per the soft-cap ruling; code redeemed atomically via the RPC, honored even on a redemption race since the charge already happened at that price — mirrors this file's own pre-existing 23505-handling philosophy of "never punish the customer for a server-side race"), computes `founding_rate_monthly/yearly` from `founding_discount`, UPDATEs the family's existing `family_subscriptions` row (never INSERTs — every family already has one from birth, `family_id` is UNIQUE), mirrors `families.is_founding_family=true` on first grant.
  - `handleSubscriptionUpdated` — maps the current Stripe price id back to a tier via `stripe_price_id_normal`/`stripe_price_id_founding`, recalculates the founding rate for the NEW tier when currently founding (PRD Founding Status Durability: "Founding rate recalculates for new tier"), and reads/clears `pending_tier_id` from subscription metadata (the downgrade-scheduling "metadata trick" — see `create-subscription-change` below).
  - `handleSubscriptionDeleted` — cancels, loses founding PERMANENTLY per the PRD's own durability table, but (a considered design choice, not an oversight) leaves `families.is_founding_family=true` as a historical record and sets `founding_family_lost_at` instead — mirroring the PRD's own language for the grace-period-miss edge case, and matching the schema column's own doc comment ("NULL if active or never-founding").
  - `handleInvoicePaymentFailed` / `handleInvoicePaid` — sets/clears `past_due`, with the 14-day clock starting ONLY on the first failure (a retry failing again must not push the deadline out indefinitely); an in-app `notifications` row (`category:'billing'`, a genuinely new category value — the column has no CHECK constraint per prior confirmed convention) informs mom, per the original PRD's explicit webhook-table instruction.
  - `mapSubscriptionStatus()` — maps every Stripe subscription status to the platform's 4-value CHECK, falling back to `past_due` for any unmapped/incomplete Stripe status rather than risk a CHECK-violation crash (same defensive posture as ST-0's `tasks_source_check` lesson, applied preemptively here rather than discovered live).

  **`create-subscription-checkout` (new):** founding eligibility decided at session-creation time per the soft-cap ruling; founding codes validated read-only (exists/unredeemed/not-expired) before charging, never consumed here (redemption is atomic and webhook-side, avoiding burning a code on an abandoned checkout); **the PRD's explicit "re-subscribe after cancellation → normal pricing, founding cannot be restored" durability rule is enforced HERE, absolutely, before either the organic-cap or code path is even considered** — closing what would otherwise be a real gaming vector (cancel, then apply a fresh code to regain a locked rate). Stripe Customer reuse checks `family_subscriptions.stripe_customer_id` first, then `parent_verifications.stripe_customer_id` (COPPA's own reuse chain), matching the §3 contract's named handoff. `success_url`/`cancel_url` are fixed, server-side, `APP_URL`-based (never client-supplied) — deliberately avoiding an open-redirect surface since this is genuinely the platform's first checkout-redirect flow and no existing precedent existed to follow.

  **`create-subscription-change` (new):** upgrade = immediate real Stripe price swap with proration (releases any pending downgrade schedule first, since an upgrade supersedes it); downgrade = a real Stripe Subscription Schedule (two phases: current price until period end, target price after) PLUS a metadata write (`pending_tier_id`) that itself fires a `customer.subscription.updated` event — this is the mechanism that lets the webhook (which never talks to anything but Stripe-originated events) mirror the pending change into `family_subscriptions` without this function ever touching that table directly, honoring "family_subscriptions is written by the webhook handler, never by client code" literally rather than as a fiction. **A real design gap found and fixed during my own review (before any test run):** the function's initial "does this family have an active subscription" check only looked at `stripe_subscription_id IS NOT NULL` — but that column stays set on a CANCELLED row for historical reference (Stripe never deletes the object either), so a cancelled family calling this function would have proceeded to try mutating a Stripe subscription that can no longer accept price/item changes. Fixed to also require `status <> 'cancelled'`.

  **`create-subscription-portal-session` (new):** thin, straightforward — resolves `stripe_customer_id`, creates a Stripe Billing Portal session, returns the URL.

  **`scripts/stripe-setup-subscription-products.ts` (new, checked-in, NOT run):** idempotent Product/Price reconciliation reading live `subscription_tiers` — reuses an existing Product/Price when its recorded amount still matches, archives-and-recreates a Price when the live tier price has changed (Stripe Prices are immutable once created), skips inactive tiers (Creator) entirely, and a tier with `founding_discount=0` correctly gets no founding Price at all. `--dry-run` flag for a no-write preview. **This is itself a production-touching script** (creates real Stripe TEST-mode objects, writes to the live `subscription_tiers` table) — written, not executed, per the production-touch gate.

  **E2E — `tests/e2e/features/subscription-tiers.spec.ts` (new, 27 tests, PARSE-VERIFIED via `--list`, NOT RUN — the file this dispatch names as shared across Slices 2-7, this describe block is Slice 2's portion):** R-10-class unauthorized-caller probes; organic-founding-grants-to-two-independent-families (the soft cap's defining behavioral change from the old atomic-counter design — proven without fabricating literally 100 fixture rows, which I flagged as a deliberate proof-cost/scope tradeoff, same class as PRD-40's own reconciliation-cron precedent); founding-code full lifecycle (RLS zero-read, staff-gated mint rejection, mint+list+redeem round-trip, single-use re-redemption no-op, service-role-only redeem enforcement); the full 5-event signed-replay webhook lifecycle against a genuinely independent throwaway fixture family (`TIERTEST2`, created via `sr.auth.admin.createUser()` exactly like `coppa-consent-screens.spec.ts`'s `NF_EMAIL` pattern) including the mandatory duplicate-event dedup probe; the REAL `create-subscription-change` upgrade (immediate, real Stripe price swap) and downgrade (real Subscription Schedule + metadata trick) paths, ordered BEFORE the invoice-failed/deleted tests intentionally push the fixture toward cancellation; the 14-day grace sweep (both the loses-founding and preserved-under-14-days branches); portal-session both states; `get_founding_family_count()`'s test-family and code-vs-organic exclusions. TIERTEST2 + minted founding-code fixtures + webhook-event rows all tracked and swept in `afterAll`, with a TIME-WINDOW residue check (not just name-prefix) as the authoritative proof — the exact lesson from ST-B's own finding this week that a prefix-only sweep silently missed 30 orphaned rows.

  **A second real finding, caught and fixed BEFORE any test run (by re-deriving the fixture data live rather than trusting an assumption):** Testworth has **ZERO** `family_subscriptions` rows in production at all — not just a missing `stripe_subscription_id`, no row whatsoever. Root cause: `seed-testworths-complete.ts` creates `families`/`family_members` via direct table inserts, never through a real `auth.users` signup, so the base schema's `AFTER INSERT ON auth.users` auto-provisioning trigger (which creates the default `essential`/`active` `family_subscriptions` row) never fires for it — every REAL family has one; Testworth is the anomaly. This would have made every Testworth-touching test in my suite silently no-op (an `UPDATE` against a non-existent row succeeds with zero rows affected in Supabase, which would have produced false passes/fails with no visible error). Fixed in the spec's own `beforeAll`: create a `family_subscriptions` row for Testworth if none exists (tracked), delete it in `afterAll` if we created it — restoring Testworth to its TRUE original state either way. Not fixed at the schema/seed level (out of this slice's scope; flagging for whoever owns `seed-testworths-complete.ts` next, since other future Testworth-touching subscription/billing tests will hit the identical trap otherwise).

  **Local proof (everything safely runnable without crossing the production-touch gate):** `npx tsc -b` — zero errors in any file this slice touched (4 pre-existing errors in `Studio.tsx`/`useWizardDraft.ts` confirmed to belong to the concurrent ST-C lane, never touched by this slice). `npx eslint` on all 6 touched/new files — 0 errors (Deno function files + the `scripts/*.ts` file correctly report "ignored," matching every prior slice's identical precedent; the E2E spec file itself is fully lint-clean with zero warnings). `node scripts/check-function-jwt-config.cjs` — 67/67 functions covered (3 new entries added in the same commit as their functions, the PRD-42 lesson). `npm run prebuild` — 0 errors / 77 pre-existing warnings, none in this slice's files; Safe Harbor filter + under-13 aggregation checks both pass (this slice touches neither surface, correctly out of scope). `npm run redteam` — 77/77. `npx vitest run tests/prd31-registry-completeness.test.ts` — 4/4 green against LIVE production (confirms zero drift from this session, since nothing has been applied yet). `npx playwright test tests/e2e/features/subscription-tiers.spec.ts --list` — 27/27 parse-clean.

  **Live reality for Slice 3 (credits/metering):** Slice 2 introduces zero credit/metering code (R31-5 firewall respected — grep-verified no `ai_credits`/`point_transactions` touches anywhere in this slice's diff). `subscription_tiers.monthly_ai_allotment` is untouched (still the Slice-0/pack placeholder numbers, OD-31-C deferred to flip time). The `notifications.category='billing'` value is now live (first use) — Slice 3/5 should reuse it for any credit-related billing notices rather than inventing a second category.

  **PRODUCTION-TOUCH GATE — everything below requires explicit founder/seat approval before I (or anyone) proceeds; NOTHING in this list has been done:**
  1. Apply migration `00000000100334_prd31_slice2_stripe_subscriptions.sql` (`supabase db query --linked -f`, then `supabase migration repair --status applied 00000000100334 --linked` — re-verify 100334 is STILL free immediately before, per the collision already caught once this session).
  2. Run `scripts/stripe-setup-subscription-products.ts` (creates real Stripe TEST-mode Products/Prices, writes their ids back onto `subscription_tiers`) — `--dry-run` first is recommended.
  3. Deploy the 3 new functions + the extended `stripe-webhook-handler` (`--no-verify-jwt` each, config.toml entries already in place).
  4. Extend the ONE registered TEST-mode webhook endpoint's `enabled_events` to include the 5 subscription events (a Stripe Dashboard/API action — **never delete-and-recreate the endpoint**, per the 2026-07-10 incident record where exactly that pattern raced against the founder's own manually-created endpoint and deleted it).
  5. Run `tests/e2e/features/subscription-tiers.spec.ts` in a granted suite slot (creates real Stripe TEST-mode objects — fake money, same class PRD-40's own suite leaves; a fresh throwaway `TIERTEST2` fixture family + auth user).
  6. An `rls-verifier` pass over `founding_codes`, the 3 new/replaced RPCs, and the `family_subscriptions` write-rejection probe (client can never INSERT/UPDATE it directly) — needs the migration applied first.
  7. Regression: `coppa-stripe-foundation.spec.ts` (9/9 expected — I extended the SAME webhook handler file it pins).

  **Files this slice (for selective staging after founder confirm — verify against a FRESH `git status` first, since a concurrent lane (ST-C) is active in this same tree):** `supabase/migrations/00000000100334_prd31_slice2_stripe_subscriptions.sql`, `supabase/functions/stripe-webhook-handler/index.ts` (extended), `supabase/functions/create-subscription-checkout/index.ts` (new), `supabase/functions/create-subscription-change/index.ts` (new), `supabase/functions/create-subscription-portal-session/index.ts` (new), `supabase/supabase/config.toml` (3 new entries), `scripts/stripe-setup-subscription-products.ts` (new), `tests/e2e/features/subscription-tiers.spec.ts` (new), this build file. **Do NOT stage** `supabase/migrations/00000000100333_st_c_wizard_drafts.sql`, any `src/components/studio/wizards/*` file, `src/pages/Studio.tsx`, or `useWizardDraft.ts`/`useWizardDraftChrome.ts`/`WizardDraftPrompts.tsx` — all ST-C's, not touched by this slice.

- **2026-09-11 (same day, continued) — Slice 2 PROOF COMPLETE: 36/36 green (27/27 + 9/9) across four seat-granted suite slots. Two more migrations landed (100336, 100337), one Stripe webhook endpoint secret rolled (external infra fix, not code), five real bugs found and fixed live (1 product, 4 test-file). Nothing committed — holding for rls-verifier + seat referee + founder confirm.**

  **The proof arc, in order (each round: run → diagnose → fix → re-run whole file, per the seat's "fix code never assertions" rule):**

  | Round | Result | Blocker found | Root cause | Fix |
  |---|---|---|---|---|
  | 1 | 9/27 (1 failed, 17 skipped) | `mint_founding_code` INSERT | `founding_codes.minted_by UUID NOT NULL` — but the function's own gate deliberately permits `auth.role()='service_role'` callers (the sanctioned near-term calling pattern, per the migration's own header), and `auth.uid()` is NULL for a service-role call | **Migration 100336** — `ALTER TABLE founding_codes ALTER COLUMN minted_by DROP NOT NULL` |
  | — | (static review, no test run) | `create-subscription-change` downgrade path | Reconstructed the Subscription Schedule's phase-1 boundaries from an independently-fetched `Subscription` object rather than the schedule's own authoritative phase data — a real Stripe-validation drift risk, found by code review before it was ever exercised | **Product-code fix, redeployed by the seat** — read `schedule.phases[0]` directly instead |
  | 2 | 14/27 | webhook signature verification (400) on the FIRST-ever call to `postWebhook()` in this suite | External: the deployed `stripe-webhook-handler`'s `STRIPE_WEBHOOK_SECRET` no longer matched `.env.local`'s value for the shared endpoint. Isolated definitively (not guessed) by re-running `coppa-stripe-foundation.spec.ts` as a diagnostic — it regressed at the IDENTICAL step, proving this was infra, not my code | **Seat rolled the endpoint** (deleted `we_1TrmSg1sr0dYTFXIozjJ6f71`, created `we_1UEcgP1sr0dYTFXI2QnuLQiF` at the same URL/7-events, synced the new secret to Supabase + `.env.local`, sha256 digests verified matching on both sides) |
  | — | (found + fixed pre-run, real bug) | `teardownTt2Fixture()` | `stripe.customers.del()` on a customer with an active subscription cascades a REAL subscription cancellation → fires a real `customer.subscription.deleted` webhook that raced the cleanup's own DB deletes | **Test-file fix** — removed the customer-deletion call entirely, matching `coppa-stripe-foundation.spec.ts`'s own established "leave TEST-mode Stripe objects behind" precedent |
  | 3 | 14/27 (blocked at test 15) then 16/27 then 17/27 then 20/27 (four sequential single-test advances, each its own whole-file re-run) | test 16, then test 18, then test 21 | (16) test 16's "duplicate delivery" probe used FRESH event metadata with `founding_kind:''` instead of reusing the established state — a genuinely NEW event (router dedups on event.id, not payload), which silently reverted the fixture to non-founding and broke every later test's assumption. (18) Stripe treats a metadata value set to `''` as DELETING that key, not preserving it as an empty string — the product code already treats `undefined`/`''` identically (`meta.pending_tier_id \|\| null`), only the test's literal `.toBe('')` assertion was wrong. (21) `util.sweep_expired_founding_grace()` lives in the `util` schema, which — confirmed live via a direct `{db:{schema:'util'}}` client probe — is NOT exposed to PostgREST on this project (only `public`/`graphql_public` are); grep-confirmed zero other `util.*` function is ever called via client RPC anywhere in this codebase, matching the `util.coppa_reconcile_age_brackets()` precedent (SQL-script-tested only, never Playwright) | (16) **Test-file fix** — reuse the SAME minted code/kind so the "first" delivery of the new event.id is idempotent-in-effect. (18) **Test-file fix** — `toBeFalsy()` instead of `.toBe('')`. (21) **Migration 100337** — a thin `public.sweep_expired_founding_grace()` wrapper (service_role-only) delegating to the real `util.` function; the cron registration and the real logic are untouched |
  | 4 | **27/27** | — | — | — |
  | 5 (regression) | **9/9** `coppa-stripe-foundation.spec.ts` | — | — | Proves the rolled endpoint didn't regress the function's OTHER consumer |

  **Migrations landed this slice (all applied to production, all self-verified, none yet committed):** `00000000100334` (Slice 2 schema — see the entry above), `00000000100336` (`founding_codes.minted_by` nullable), `00000000100337` (`public.sweep_expired_founding_grace()` wrapper). Next-free is now 100338 for whichever lane needs it next (ST-C's own concurrent migrations, 100333/100335, are untouched by and independent of these three).

  **Final per-test results — `tests/e2e/features/subscription-tiers.spec.ts`, 27/27:**
  1–5: R-10-class checkout probes (kid/dad/family-shadow/no-auth/invalid-tier) — all reject correctly.
  6: organic founding granted to an independent fixture family while comfortably under the 100-cap (the soft cap's defining "no artificial single-winner serialization" behavior).
  7: 409 `already_subscribed` for an already-active family.
  8: `founding_codes` — zero client read access for anon/kid/dad/mom (RLS has no policies at all).
  9: `mint_founding_code` rejects a non-staff mom.
  10: mint + list + redeem round-trip; single-use re-redemption correctly no-ops.
  11: `redeem_founding_code` — authenticated (even mom) rejected, service_role only.
  12: invalid founding code rejected before any charge.
  13–14: `get_founding_family_count()` — excludes Testworth (`is_test_family`) even when flagged founding; a `founding_code`-granted family never counts toward the organic total.
  15: **the centerpiece** — `checkout.session.completed` creates a real Stripe subscription, redeems a founding code atomically, `family_subscriptions` fully populated, `families.is_founding_family` mirrored.
  16: duplicate delivery of the SAME event.id is deduped (post-fix: state genuinely unchanged, not just "ran once").
  17: `customer.subscription.updated` recalculates the founding rate for a new tier.
  18: `create-subscription-change` upgrade — real Stripe price swap, immediate, `pending_tier_id` cleared.
  19: `create-subscription-change` downgrade — real Subscription Schedule (phase-1 read back from the schedule itself), `pending_tier_id` metadata mirrors into `family_subscriptions` via the real webhook the metadata write triggers; current tier unaffected until the period boundary.
  20: `invoice.payment_failed` sets `past_due` (14-day clock starts ONLY on the first failure, a second failure doesn't push it out); mom notified (`category:'billing'`); `invoice.paid` clears it.
  21: `util.sweep_expired_founding_grace()` — 15-day-old past_due WITH founding loses it permanently (`families.is_founding_family` stays `true`, historical); a fresh 3-day-old past_due is correctly preserved.
  22: `customer.subscription.deleted` — cancels, loses founding permanently, `founding_family_lost_at` set, `families.is_founding_family` stays `true` (historical record, matches the PRD's own grace-period-miss language).
  23: post-cancellation, a fresh checkout is offered NORMAL pricing regardless of cap or a valid code (the "founding cannot be restored" durability rule, enforced absolutely before either eligibility path is even considered).
  24–25: portal session — 400 with no customer; real `billing.stripe.com` URL once one exists.
  26: `create-subscription-change` — 400 `no_active_subscription` post-cancellation (status checked, not just `stripe_subscription_id` presence).
  27: `create-subscription-change` kid session rejected.

  **Regression — `tests/e2e/features/coppa-stripe-foundation.spec.ts`, 9/9** (the webhook handler's OTHER real consumer; proves the rolled endpoint + extended handler didn't break PRD-40's own Stripe foundation).

  **Residue — both checks, final state:**

  | Table | Time-window (any name, since 21:00 UTC session start) | Fixture-name / whole-table total |
  |---|---|---|
  | families | 0 | 3 (unchanged from session start) |
  | family_subscriptions | 0 | 2 (unchanged) |
  | subscription_cancellations | 0 | 0 |
  | founding_codes | 0 | 0 |
  | stripe_webhook_events | 0 (this suite's OWN fixtures) | 8 (6 pre-existing baseline + 2 from `coppa-stripe-foundation.spec.ts`'s own accepted real-charge residue class — `payment_intent.succeeded`/`payment_intent.payment_failed`, `purpose:'coppa_verification'`, real Stripe-generated event ids, never `evt_test_...` — identified by provenance, not deleted, per the seat's explicit instruction not to touch another suite's accepted residue) |
  | parent_verifications / parent_verification_attempts | — | 3 / 7 (attempts +1 from the COPPA suite's own real-declined-charge test 8, its own accepted class) |

  Zero stray `tiertest2` auth users. Zero stray "Mom's Family" phantom families. Every `stripe_webhook_events`/`founding_codes` row THIS suite's own fixtures created was tracked by id and swept in `afterAll`; the handful of real-Stripe-generated log rows appearing between rounds (invoice.paid / payment_intent.succeeded / customer.subscription.updated, `purpose:null` or `'subscription'`, real event ids) were an unavoidable byproduct of creating/mutating REAL Stripe TEST subscriptions each round — identified by provenance and manually cleaned between rounds so each round started from the true baseline; the final round's residual count (0 in the time-window check) confirms the suite's own `afterAll` fully sweeps its own state.

  **Stripe TEST objects created across the full proof arc (all fake test money, left in place per the established `coppa-stripe-foundation.spec.ts` precedent — Stripe TEST-mode objects have no real-world cost and are not deleted):**
  - Customers: `cus_VF6FRDJIm92U0E`, `cus_VF6Rswv5y0Mwqw`, `cus_VF6RjoRQseDzuP`, `cus_VF6wKHuk6KLsgE`, `cus_VF6wHCwXnSEgne`, `cus_VF6zQG4Fa9xAz0`, `cus_VF6z9T5WCmDIbs`, `cus_VF71pNCgp48XBY`, `cus_VF71uTzQ1zcLwO`, `cus_VF81OS2XWhQ2mH`, `cus_VF81h6W9D1F2WR` (TIERTEST2, one pair per round — one from the checkout-session test, one from the direct-subscription webhook-lifecycle test); `cus_VF6U5GjiEb78Ms`, `cus_VF83IfwFQ1D5aC` (Testworth/Sarah, real COPPA $1-verification customers, persistent/expected reuse pattern).
  - Checkout sessions (created, never completed): 7 total, one or two per round, all `status:'open'`.
  - Subscriptions: `sub_1UEcEY1sr0dYTFXIbtJDjUTx` (round 2, canceled via the now-fixed customer-deletion bug), `sub_1UEciI1sr0dYTFXIF5TCOkzj`, `sub_1UEclU1sr0dYTFXI7SS01pI3`, `sub_1UEcnP1sr0dYTFXIG2j2otMW`, `sub_1UEdle1sr0dYTFXI7bo2Hdud` (final green round — real Stripe status stays `active`; the fabricated `customer.subscription.deleted` webhook in test 22 simulates the EFFECT in our DB without performing the real Stripe-side cancellation, which is not the point of that test).
  - Subscription schedules: `sub_sched_1UEcna1sr0dYTFXIDfj0QlV7`, `sub_sched_1UEdlq1sr0dYTFXIg5gFwK0Y` (from the downgrade tests, rounds 3–4).
  - Webhook endpoint: rolled by the seat mid-arc (`we_1TrmSg1sr0dYTFXIozjJ6f71` → `we_1UEcgP1sr0dYTFXI2QnuLQiF`, same URL, same 7 events, livemode=false).

  **Local proof, re-confirmed after every fix:** `npx eslint` clean on every touched file each round (0 errors). No `tsc -b` regressions introduced (the pre-existing ST-C `Studio.tsx`/`useWizardDraft.ts` errors are unrelated, confirmed via `git status` throughout — zero overlap with this slice's files at any point in the arc).

  **`git status --porcelain` at close of this entry** (unchanged file set from the 2026-09-11 first entry, plus the two new migrations and the fixed spec file — verify fresh before staging, ST-C is still active in this tree): `.claude/rules/current-builds/PRD-31-subscriptions.md`, `supabase/functions/stripe-webhook-handler/index.ts`, `supabase/supabase/config.toml`, `scripts/stripe-setup-subscription-products.ts`, `supabase/functions/create-subscription-change/`, `create-subscription-checkout/`, `create-subscription-portal-session/`, `supabase/migrations/00000000100334_*.sql`, `00000000100336_*.sql`, `00000000100337_*.sql`, `tests/e2e/features/subscription-tiers.spec.ts`. ST-C's files (`useWizardDraft*`, `Studio.tsx`, `childDataTables.ts`, `coppa-cascade-plan.ts`, `coppa-write-gates-rollback.sql`, migrations `100333`/`100335`, `wizard-draft-persistence.spec.ts`) remain untouched and must never be staged from this lane.

  **Remaining before commit:** an independent `rls-verifier` pass over `founding_codes`, the 4 new/replaced RPCs (`mint_founding_code`, `list_founding_codes`, `redeem_founding_code`, `get_founding_family_count`, `public.sweep_expired_founding_grace`), and the `family_subscriptions` client-write-rejection probe (RLS already has zero client write policies per the base schema — this needs live confirmation, not just a read of the migration). Then the seat's referee pass, then founder confirm, then selective staging + commit + `npm run schema:dump`.

  **Live reality for Slice 3 (credits/metering):** unchanged from the first entry — zero credit/metering code introduced, `notifications.category='billing'` is now live and proven (test 20), R31-5 firewall respected throughout (grep-verified no `ai_credits`/`point_transactions` touches anywhere in this slice's full diff, migrations included).

