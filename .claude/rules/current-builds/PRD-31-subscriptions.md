# Active Build: PRD-31 — Subscription Tier System (+ Tier Chart NEW-BB / Convention #256)

> **Status: PRE-BUILD APPROVED (founder, 2026-07-08) — OD-31-A..D all resolved + chart default rules approved (verbatim in the ruling record §4). Slice-1 dispatch prompt READY below — NOT dispatched; the coordination seat sequences it. No code, no migrations.**
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
| 2 | **Stripe** per PRD-40 §3 boundary: products/prices (greenfield), Checkout, 5 subscription events in the purpose-routed `stripe-webhook-handler` (extend PRD-40's if it landed; else build the base per §3 + `stripe_webhook_events` dedup + `_shared/stripe.ts`), Customer Portal, upgrade-immediate/downgrade-end-of-period, past-due lifecycle (14-day grace), founding enrollment + atomic 100-counter in the webhook path | Founder TEST keys gate the proof; duplicate-event idempotency probe mandatory |
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

## Post-Build Verification

*(Checkpoint 5 — every PRD MVP item + every R31 ruling + OD outcome + all 16 Beta-Bypass Exit Registry rows: Wired / Stubbed / Missing. Zero Missing. Copy to the feature decision file at close-out. Pre-approved stubs listed in the ruling record §5.)*

| Requirement | Status | Evidence |
|---|---|---|
| *(build time)* | | |
