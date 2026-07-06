# Dispatch Factory — MANIFEST

> **Purpose:** Durable state for the long-running Fable "dispatch factory" session producing
> founder-approvable pre-dispatch packs for EVERY remaining unbuilt PRD and feature-surface
> project, before Fable intro pricing ends 2026-07-07.
> **Any future session must be able to resume from this file alone.**
>
> Created: 2026-07-04 (Fable 5 session, fresh start — no prior manifest existed)
> Last updated: 2026-07-04 — **FACTORY COMPLETE: STAGES 1-4 DONE. ALL BATCHES (1-9) RESOLVED;
> every pack APPROVED with final dispatch prompts** (amendments recorded in the ⚖ block:
> PRD40+ARP, FDWA widened + PINR pair, RFLX privacy-NO + standing no-hiding principle w/
> legacy-carve-out clarification, 28B SDS fold-in, PRD31 greenfield Stripe, PRD38
> GoDaddy-parked domain → ops-checklist cutover). Two non-APPROVED items by design: **PRD29**
> (unparked → recon'd; goal-science addendum session IN FLIGHT in a parallel Fable window →
> re-synthesis on approved addendum) and **BSBP** (placeholder until BSB1 ships). **ARP is the
> time-sensitive dispatch: run it before the Fable window ends 2026-07-07.** Builds run
> post-window on Sonnet workers with Fable-if-available-else-Opus judgment gates. Dispatch
> order suggestion: ARP now → FDWA+PINR (pair) → GDCX → SMFX → BSB1 (on KIDS-REWARDS close) →
> P2 chain (PRD40→PRD31→PRD22→PRD32, behind SAFETY-BETA-GATE deploys) → P3/P4/P5 per each
> pack's dependency edges.

## How this factory works (resume instructions)

- **Stage 1 — INVENTORY** (✅ done 2026-07-04): cross-checked `claude/feature_glossary.md` against
  `BUILD_STATUS.md`, `.claude/completed-builds/**` (README index + ledger), `WIRING_STATUS.md`,
  `STUB_REGISTRY.md`, `claude/follow-up-builds/*`, and the `followup-build-queue` memory.
- **Stage 2 — RECON** (per item): spawn Sonnet subagents (`model: "sonnet"`, 2-3 in parallel) to read
  the FULL PRD + ALL `prds/addenda/` matches + universal addenda per `claude/PRE_BUILD_PROCESS.md`
  + relevant live_schema/WIRING_STATUS/STUB_REGISTRY sections. Each returns a structured evidence
  brief (requirements list, schema gaps, wiring touchpoints, cross-PRD references). The factory
  session never reads PRDs end-to-end itself.
- **Stage 3 — SYNTHESIS** (per item, Fable judgment): reconcile PRD against every convention/build
  that postdates it (newer wins — name each conflict + ruling explicitly); place in dependency
  graph; slice plan with per-slice model routing per `.claude/rules/model-routing.md` (judgment
  gates route "Fable if available, else Opus" — these run post-2026-07-07); full dispatch prompt
  (two-step model header + freshness preamble: "re-verify against git log and CLAUDE.md conventions
  added since <pack date> before building"); isolate open founder decisions with recommendations.
  Write the pack to `claude/dispatch-factory/<ITEM>.md`.
- **Stage 4 — DECISION BATCHES:** surface accumulated decisions to founder in batches of 3-5,
  recommendations first. Approved pack → status APPROVED, dispatch prompt final.
- **Rules:** read-only outside `claude/dispatch-factory/`. No `.claude/rules/current-builds/`
  entries (created at build time). No migrations, no migration-number reservations. Packs
  front-load the PRE_BUILD ritual; build-time worker still runs the freshness delta-check.
  Four build sessions run in parallel — recon reads COMMITTED state, ignore uncommitted changes.

## Status legend

`inventoried → recon'd → synthesized → decisions-pending → APPROVED`

---

## Exclusions (NOT in this factory, with reasons)

| Item | Reason |
|---|---|
| PRD-20 Safe Harbor | Backburnered (founder 2026-06-09; `claude/feature-decisions/Safe-Harbor-Backburner-Decision.md`) |
| PRD-41 Platform AI Ethics + PRD-30 Safety Monitoring | Already sequenced inside SAFETY-BETA-GATE (Slices D/E → then PRD-30, locked sequence) |
| SAFETY-BETA-GATE (Slices C→B→A) | In flight — dispatched, `.claude/rules/current-builds/SAFETY-BETA-GATE.md` |
| KIDS-REWARDS-PAGE (Slice 5 remains) | In flight — `.claude/rules/current-builds/KIDS-REWARDS-PAGE.md` |
| CLIENT-DATE-REMEDIATION | In flight — approved for dispatch, own dispatch prompt exists |
| My Rewards page content follow-up | Absorbed by KIDS-REWARDS-PAGE (in flight) |
| Safe Harbor decommission follow-up | Resolved by backburner decision 2026-06-09 |
| 📌 Post-MVP registry stubs (~79) | Not packaged individually; folded into related packs' scope notes only where a pack naturally covers them |
| OPPORTUNITY-SURFACES post-MVP stubs (5) | Post-MVP, registered 2026-07-03 |

---

## Item table

Priority: P1 = near-ready / founder pull / correctness · P2 = beta-critical platform ·
P3 = family-experience PRDs · P4 = rewards/tracking surfaces · P5 = content/compliance/community ·
P6 = tail. Priority is PACK-PRODUCTION order, not build order.

| ID | Item | Type | Status | Pri | Notes (evidence) |
|---|---|---|---|---|---|
| BSB1 | BookShelf Becoming Build 1 — Never Lose My Place | Surface | **decisions-pending** (pack: `BSB1.md`) | P1 | Pre-build draft EXISTS (`claude/feature-decisions/BookShelf-Becoming-Build1-Never-Lose-My-Place.md`); pack = freshness delta + dispatch prompt. Dispatch gated on KIDS-REWARDS completion (founder ruling 2026-06-12) |
| FDWA | Family-device write audit (remaining tables) | Surface | **decisions-pending** (pack: `FDWA.md`, recon: `FDWA-RECON.md`) — highest kid-pain-per-effort item; found the universal family_members self-update gap | P1 | STUB_REGISTRY RR-DEPLOY-SCOPING ⏳MVP — journal_entries, victories, widget_data_points, practice_log, messages, reflection_responses under family-shadow sessions; symptom: kid action on family tablet silently does nothing. Pattern: `util.is_family_shadow_of` (migration 100262 precedent) |
| PINR | PIN-relock stickiness (personal-device timeout) | Surface | **decisions-pending** (pack: `PINR.md`, recon: `PINR-RECON.md`) — Option A ruled (dual persisted sessions) | P1 | Family-Auth-Two-Door Founder Decision 4 stub ⏳MVP — timeout should drop to PIN/picture relock, not full sign-out |
| SMFX | Small-fixes pack (bundled tiny items) | Surface | **decisions-pending** (pack: `SMFX.md`) | P1 | `/queue` redirect route (dead action_url since Build G); fo-command-center pin seeds `family_overview_configs`; shopping-mode residual test pin + notepad list-picker parity audit; revoke transitional `set_family_password` RPC grant; emoji sweep (ViewAsMemberPicker 👁, OneFiveThreeView 📋, countdown 🎯 + countdowns.emoji column product decision); PRD-14D §Screen 5 line 335 wording edit (doc-only) |
| PRD40 | PRD-40 COPPA Compliance & Parental Verification | PRD | **decisions-pending** (pack: `PRD40.md`, recon: `PRD40-RECON.md`) | P2 | In `prds/foundation/`, absent from BUILD_STATUS + glossary — build status unknown, recon must establish. Under-13 beta blocked until PRD-41 ships (PRD-40:767-769,1158); sequencing vs SAFETY-BETA-GATE needed |
| PRD22 | PRD-22 Settings | PRD | **decisions-pending** (pack: `PRD22.md`, recon: `PRD22-RECON.md`) | P2 | Phase 27 Pending. Settings overlay stub (PRD-04 Repair); data export/account deletion tables partially exist (`account_deletions` 0 rows); LiLa tool-permission mgmt UI stub; member_emails |
| PRD31 | PRD-31 Subscription Tier System (+ tier chart NEW-BB + Phase 41 tier review) | PRD | **decisions-pending** (pack: `PRD31.md`, recon: `PRD31-RECON.md`) | P2 | Phase 38 Pending. Stripe; ai_credits/credit_packs/etc. tables absent from live DB; Convention #256 chart; beta `useCanAccess()` bypass exit plan |
| PRD32 | PRD-32 Admin Console + PRD-32A Demand Validation (+ PRD-21B slice per D-002) | PRD | **decisions-pending** (pack: `PRD32.md`, recon: `PRD32-RECON.md`) | P2 | Phase 39 Pending. Admin Console is a PlannedExpansionCard today; persona/lens moderation queues fill with no drain surface (STUB 🔗); PRD-32 Screen 13 persona review (Convention #258); beta_glitch_reports admin surface |
| PRD21B | PRD-21B AI Vault Admin | PRD | inventoried | P2 | Phase 25B ⏳MVP. Merge candidate into PRD32 pack (D-002) |
| PRD19 | PRD-19 Family Context & Relationships | PRD | **decisions-pending** (pack: `PRD19.md`, recon: `PRD19-RECON.md`) — founder-protected; Convention #243 obligation lands here | P3 | Phase 20 Pending. Tables exist empty (private_notes, relationship_notes); Mediator supersedes relationship_mediation (Convention #95); guided interview, member documents, monthly aggregations, reports — overlaps PRD-28B report infra |
| PRD12A | PRD-12A Personal LifeLantern | PRD | **decisions-pending** (pack: `PRD12A.md`, recon: `PRD12AB-RECON.md`) | P3 | Phase 22 Pending. Unblocks Rhythms Quarterly Inventory staleness trigger (Convention #178), Archives LifeLantern aggregation |
| PRD12B | PRD-12B Family Vision Quest | PRD | **decisions-pending** (pack: `PRD12B.md`, recon: `PRD12AB-RECON.md`; dispatches after PRD12A) | P3 | Phase 22 Pending. Unblocks family-level Guiding Stars (owner_type exists, no UI), Hub Family Vision section, LiLa family-vision context loader stub |
| PRD29 | PRD-29 BigPlans (Goal Science Edition) | PRD | **APPROVED — RE-SYNTHESIZED 2026-07-04** against the founder-approved `prds/addenda/PRD-29-Goal-Science-Addendum.md` (all 24 §17 decisions ruled; ZERO open decisions). Pack: `PRD29.md` — 20 rulings, THREE build phases (A Foundation/Core → B Wheel/Overcoming → C Tiers/Integrations), one dispatch prompt per phase. 5 plan spines; teen/guided Overcoming built COMPLETE but shipped DARK behind `bigplans_overcoming_teen` until PRD-41+PRD-30 + founder flip. **TRKG dispatches first** (chart-prize dependency, graceful degradation if it slips) | P3 | Phase 33 Pending. Unblocks meeting Goals routing, BookShelf→BigPlans, ThoughtSift route-to-BigPlans chips, badge/award pick-N-of-M (Convention #167), LifeLantern complex-goal handoff |
| GDCX | Guided Dashboard completion (PRD-25 residuals) | Surface | **decisions-pending** (pack: `GDCX.md`, recon: `GDCX-RECON.md`) — **NBT dark for 2+ months, root-caused, fix in Slice 1**; 4 stale registry rows found already-wired | P3 | Write drawer Messages tab (PRD-15 now built), LiLa Homework Help + Communication Coach modals ("Coming soon"; their guided-mode prompts land in SAFETY-BETA-GATE Slice A — dependency), unread badge, Progress page gamification, task point values, gamification header indicators |
| RFLX | Reflections revamp (privacy + Past tab + render shape) | Surface | **decisions-pending** (pack: `RFLX.md`, recon: `RFLX-MSRE-RECON.md`) — headline reframed: kid-privacy = design REVERSAL question; real bugs = journal-copy mismatch + dead routing column | P3 | View-As follow-up G ⏳MVP — no privacy column on reflection_responses; kid-private decision; "Visible to parent" audit; Past tab UX |
| TRKG | Tracker goals & gamification-mode honesty | Surface | **decisions-pending** (pack: `TRKG.md`, recon: `TRKG-RSTP-RECON.md`) — **gamification earning-mode settings are UI theater (1/4 creature + 2/3 page modes real); tracker_goal branch dropped in Connector rewrite**; scope renamed: Phase-B features (multiplayer/TrackThis/gameboard) stay registered residuals | P4 | KIDS-REWARDS R2 ⏳MVP (goal detection → earned_prizes firing); Build M tracker_goal page-earning trigger (MISLEADING UI); widget milestone→victory AIR; color_reveal/gameboard picker mismatch; multiplayer layer; Track This flow; linked pair; timer→widget data points; streak-proposal trackers (KIDS-REWARDS S4) |
| RSTP | Per-step routine rewards (R1) | Surface | **decisions-pending** (pack: `RSTP.md`, recon: `TRKG-RSTP-RECON.md`) — R1 stub premise corrected: routine steps fire ZERO reward pipeline today; no routine-level completion event exists; step-level ruled | P4 | KIDS-REWARDS R1 ⏳MVP — no reward columns on task_template_steps; payout at routine_step_completions insert (no fireDeed there today); earned-prizes pipe + 3-mode image picker reusable |
| SAEX | Special Adult Experience + PRD-27 Caregiver Tools | Surface+PRD | **decisions-pending** (pack: `SAEX.md`, recon: `SAEX-RECON.md`) — D-001 resolved: ONE pack, TWO builds (A foundation → B content). **Split-brain shift system found: gate + mom UI read a dead table; shift access never worked** | P4 | `claude/follow-up-builds/special-adult-experience.md` (ShiftView built-never-mounted, SA sidebar, shift-gated visibility, special_adult_permissions unenforced) + PRD-27 (trackable events, shift reports, custody). Merge decision D-001 |
| MSRE | Mom self-restriction enforcement | Surface | **decisions-pending** (pack: `MSRE.md`, recon: `RFLX-MSRE-RECON.md`) — FO leak path found; registry conflation found | P4 | PERMISSIONS-WIRING stub ⏳MVP — mom_self_restrictions rows saved+displayed inactive; needs target-aware filtering on mom-side journal/stars/intentions/innerworkings surfaces |
| PRD28B | PRD-28B Compliance & Progress Reporting | PRD | **decisions-pending** (pack: `PRD28B.md`, recon: `PRD3728-RECON.md`) — SDS Vault tool split as early-dispatchable Slice 0; after PRD19 + PRD37 | P5 | Phase 32 residual. 6 tables unbuilt (STUB entry 606); consumes homeschool_time_logs (built, 0 rows — needs real data); unblocks PRD-37 portfolio export, PRD-19 report templates, ESA invoices |
| PRD37 | PRD-37 Family Feeds | PRD | **decisions-pending** (pack: `PRD37.md`, recon: `PRD3728-RECON.md`) — before PRD28B per locked addendum order | P5 | Phase 36 Pending. Shared addendum with PRD-28B; family_moments is the homeschool learning-capture home (Convention #20 note); Out of Nest feed |
| MSWP | PRD-17B MindSweep remainder | PRD | **decisions-pending** (pack: `MSWP.md`, recon: `TAIL-RECON.md`) — item SHRANK: share-to-app already wired; offline→PRD33; email=ops checklist; real gap = Digest toggles that do nothing + STUB:232 overclaim | P5 | Phase 18 Partial — share-to-app, PWA manifest, IndexedDB offline, email DNS config; Phase C never started; auto-sweep cron now healthy (Convention #246 fix) |
| PRD05C | PRD-05C LiLa Optimizer | PRD | **APPROVED** (pack: `PRD05C.md`) — after PRD31; picker-hide rides SMFX item 8 | P5 | Phase 23 Pending. MISLEADING UI: optimizer mode_key in picker but flow unbuilt (PromptPackDetail.tsx:152 TODO); Vault "Optimize with LiLa" depends; optimizer_outputs/user_prompt_templates/context_presets tables absent |
| PRD21C | PRD-21C AI Vault Engagement & Community | PRD | **APPROVED** (pack: `PRD21C.md`) — after PRD32 (console host); brings the dead pre-seeded counters alive | P5 | Phase 26 Pending. vault_engagement/comments/moderation tables absent; heart_count columns exist on vault_items; blocks PRD-38 per phase deps |
| PRD38 | PRD-38 Blog (Cookie Dough) | PRD | **APPROVED** (pack: `PRD38.md`) — after PRD32; domain parked at GoDaddy → DNS cutover = founder-ops checklist, build verifies on a preview hostname | P5 | Phase 37 Pending (deps Phase 03 ✅, 26). blog-comment-moderate + blog-publish-scheduled Edge Functions listed in architecture doc — recon verifies what exists |
| PRD14E | PRD-14E Family Hub TV Mode + PRD-14D Phase B residuals | PRD | **decisions-pending** (pack: `PRD14E.md`, recon: `TAIL-RECON.md`) — /hub/tv blank-page bug found (fix rides SMFX item 7); dispatches after PRD11B; countdown-emoji decision lands here | P5 | Phase 15 residual. Slideshow (slideshow_slides table exists, 0 rows), TV landscape PWA at /hub/tv |
| PRD11B | PRD-11B Family Celebration | PRD | **decisions-pending** (pack: `PRD11B.md`, recon: `TAIL-RECON.md`) — STUB:184 false-Wired corrected; godmother no-op awaits; dispatches BEFORE PRD14E | P5 | Ledger: "NOT built — separate future phase" despite Phase 12 complete row + one stale ✅ registry row. family_victory_celebrations table absent; family_victory_godmother is a no-op placeholder awaiting this |
| TYPES | Generated Supabase TypeScript types adoption | Surface | **decisions-pending** (pack: `TYPES.md`, factory-written) — incremental adoption ruled; quiet-window dispatch | P6 | Follow-up D 📌Post-MVP but foundational — Database generic on createClient; high regression-risk, own audit |
| PRD33 | PRD-33 Offline / PWA | PRD | **decisions-pending** (pack: `PRD33.md`) — PARKED shelf pack; **Convention #257 offline-date tension PRE-RULED** (client timestamps = ordering only; DATE columns server-derived at flush) | P6 | Phase 40, deps "All phases"; glossary Post-MVP. Pack produced last |
| BSBP | BookShelf Becoming program (Builds 2+) | Surface | **placeholder complete** (`BSBP.md`) — synthesis trigger = BSB1 close-out | P6 |
| ARP | Attorney Review Package (COPPA/privacy, Missouri — PRD40 amendment) | Deliverable | **DELIVERED 2026-07-05** — `claude/legal-drafts/` holds all six drafts incl. attorney cover memo; next step = founder sends to counsel (the sign-off) | P1 |
| FGPZ | Family Goals & Family Prizes (family-level tracking, family prizes, family best intentions) | Surface | **inventoried 2026-07-05** — founder raised mid-KIDS-REWARDS-S5 and ruled "build it now, but switch to Fable to design it"; research handoff at `claude/feature-decisions/Family-Goals-And-Prizes-Handoff.md`; next step = Fable-led pre-build ritual against that brief (NOT yet a pack; coordinate with PRD29 Build C's family-plan machinery + PrizeBoard territory) | P2 | Placeholder — synthesize from Recon Part 6 program plan AFTER Build 1 ships; Build 1's section-anchor infra is load-bearing for Builds 5/6 |

## Dependency graph (build-order edges, not pack-production order)

- PRD40 → PRD31 Slice 2 (PRD40 builds the Stripe foundation + webhook router per D-PRD40-2; PRD31 extends with subscription events)
- PRD40 ↔ PRD22 (shared export engine + deletion-cascade engine — whichever dispatches first builds the shared piece)
- SAFETY-BETA-GATE C/B/A deploy → PRD40 build start AND PRD31 Slice 3 (shared supabase/functions territory)
- PRD31 → PRD32 (billing/analytics surfaces), → Phase 41 tier review, → "Recalculate tier blocks" Edge Function, → tier gating exit from beta bypass. PRD31 ruling D-PRD31-4: PRD-32's ai_usage_log/platform_usage_log are NOT built — metering extends ai_usage_tracking (PRD32 pack must honor)
- PRD32 ← PRD21B (if merged, D-002); PRD32 drains the PRD-34 persona/lens moderation queues (Convention #258 Screen 13)
- PRD21C → PRD38 (BUILD_STATUS phase deps)
- PRD28B → PRD37 (portfolio export, standards linkage, Family Newsletter template) and ← PRD-28 homework data (built; needs founder real data)
- PRD19 ↔ PRD28B (report templates/generated_reports overlap — recon must draw the line)
- PRD12A → Rhythms Quarterly Inventory trigger, Archives LifeLantern aggregation; PRD12A → PRD29 (complex goal → Project Planner handoff, already stub-marked wired the other direction)
- PRD12B → family-level Guiding Stars UI, Hub Family Vision section, LiLa family-vision context loader
- PRD29 → Meetings Goals routing, BookShelf→BigPlans, ThoughtSift chips, Convention #167 pick-N-of-M
- SAFETY-BETA-GATE Slice A (in flight) → GDCX (guided mode prompts for Homework Help / Communication Coach exist before their modals mount)
- KIDS-REWARDS completion → BSB1 dispatch (founder sequencing ruling 2026-06-12)
- PRD40 sequencing interlocks with PRD-41 (SAFETY Slice D) for under-13 beta
- TRKG and RSTP both consume the Slice-1 earned-prizes pipeline (shipped); TRKG touches grandfathered Convention #271 surfaces → those refactors ride along (widget_data_points, roll_creature)
- FDWA, PINR, MSRE, RFLX, SMFX, TYPES: no upstream blockers
- PRD33 last (deps: all phases)

## Decision queue

### ⚖ STAGE 4 RESOLUTION — BATCHES 1–8 (founder final ruling, 2026-07-04)

**ALL pack recommendations for batches 1–8 are APPROVED.** Every "OPEN (batch 1-8)" row below
and every "decisions-pending" status in the item table for batch-1-8 packs is SUPERSEDED by
this block: **those packs are APPROVED and their dispatch prompts are FINAL** (as amended
below). Batch 9 (PRD05C/PRD21C/PRD38) remains OPEN. Overrides & resolutions:

1. **D-PRD31-5:** Stripe is GREENFIELD — build products/prices/webhooks from scratch.
2. **D-PRD40 (all approved) + AMENDMENT:** new deliverable — **Attorney Review Package**
   (Missouri-specific privacy policy, COPPA direct notice, parental-consent flow copy,
   data-practices summary), drafted by a Fable session for the founder's licensed attorney,
   who is the SIGN-OFF. New item `ARP.md` — dispatch-ready NOW (Fable window ends 07-07).
   Build timing for PRD-40 itself stays founder-controlled.
3. **D-RFLX-1 = NO. STANDING PRINCIPLE (founder, verbatim): "we don't want to facilitate
   hiding things from parents."** Kids cannot lock content from parents; kid-privacy resolves
   at the COPPA level only. No NEW kid-privacy affordances platform-wide. (The shipped
   `filterKidPrivate()` daily-UX behavior stands per the approved D-PRD40-3 — full parental
   review via the COPPA surfaces — unless the founder separately reopens it.) D-RFLX-2 = yes.
4. **D-PRD22-5 = YES** — Play gear removed; mom manages Play kids' appearance.
5. **D-FDWA-2 AMENDED + D-FDWA-3 ANSWERED:** messages, notepad_tabs, and mindsweep_holding ARE
   included in the family-shadow write policies (teens PIN-logged on family devices get full
   feature use; app-layer attribution accepted per #39/#276). **FDWA + PINR = sequencing pair**
   (PINR mitigates walk-away risk). FDWA E2E flips to attribution probes on all three tables.
6. **D-PRD29-0 REVERSED — BigPlans UNPARKED.** Vision:
   `claude/feature-decisions/BigPlans-Goal-Science-Vision.md` (goal-science methods, goal→
   generated tasks/milestones/trackers, four audience tiers incl. kid-with-mom co-planning
   with chart/coloring-page reward tracker reusing Build M + TRKG). PRD29 status → recon'd;
   new upstream dependency = claude.ai research+design session producing a PRD-29 addendum →
   factory re-synthesis. No longer Gate-4-gated; **TRKG sequences first** (BigPlans consumes
   tracker-goal firing).
7. **D-28B-1 SDS split-out DECLINED** — existing Claude artifact covers the employees; the SDS
   generator stays inside the main PRD-28B build (Slice 3).

| ID | Decision | Status | Ruling |
|---|---|---|---|
| D-000 | Approve Stage 1 inventory + processing order | ✅ RESOLVED 2026-07-04 | Founder: "Go — inventory and order as listed." |
| D-001 | SAEX: one combined pack (Special Adult Experience + PRD-27) or two? | ✅ RESOLVED 2026-07-04 | Combined SA + PRD-27 recon; split-or-merge decided at synthesis |
| D-002 | PRD21B: merge into PRD32 pack? | ✅ RESOLVED 2026-07-04 | Merge PRD-21B into the PRD-32 pack as its own slice |
| D-003 | Priority order override? | ✅ RESOLVED 2026-07-04 | Superseded by the standing deadline rule below + Fable-dependence ordering |
| D-BSB1-1 | Dashboard Continue card: section vs widget | OPEN (batch 1) | Section card, Morning-Rhythm-style, self-hiding |
| D-BSB1-2 | Anchor URL param format | OPEN (batch 1) | `&anchor=<extraction_id>`, section-title fallback |
| D-BSB1-3 | AudienceToggle persistence home | OPEN (batch 1) | `bookshelf_member_settings` |
| D-SMFX-1 | `countdowns.emoji` column fate | OPEN (batch 1) | Defer product decision to PRD14E pack; SMFX swaps hardcoded fallback only |
| D-SMFX-2 | Authorize one-line PRD-14D edit (Convention #12 exception) | OPEN (batch 1) | Yes — founder-sanctioned 2026-05-28; pack approval = written authorization |
| D-PRD40-1..6 | See `PRD40.md` §decisions (cohort framing; Stripe-first; filterKidPrivate ruling; two-door addendum; lawyer engagement; own-family interim stance) | OPEN (batch 2) | All six recommended-yes in the pack |
| D-PRD31-1..7 | See `PRD31.md` §decisions (feature_access_v2 shape; pre-populated toggles; seed drift; one metering pipeline; **Stripe dashboard state — needs founder answer**; access-layer unification; EF retrofit in-scope) | OPEN (batch 2) | Recommended in pack; D-PRD31-5 requires founder knowledge |
| D-PRD22-1..6 | See `PRD22.md` §decisions (route-based settings permanent; hub-and-spoke; adopt drifted deletion schema; dad read-only view; **Play gear removal**; full ZIP export) | OPEN (batch 2) | All six recommended-yes in the pack |
| D-PRD32-1..6 | See `PRD32.md` §decisions (reconciliation-first / no parallel twins; staff_permissions columns; skip platform_usage_log; defer Safety Config to PRD-30; minimal Moderation tab; Feedback-first slice order) | OPEN (batch 3) | All six recommended-yes in the pack |
| D-PRD29-0..5 | See `PRD29.md` §decisions (confirm PARKED; 4-mode taxonomy wins over drift; direct-deploy per #276; Composition-compliant wizard; Haiku router split; family_create ≠ task_assignment) | OPEN (batch 3) | All recommended-yes; D-PRD29-0 = confirm parking |
| D-12AB-1, D-12A-2..4, D-12B-1..3 | See `PRD12A.md` + `PRD12B.md` §decisions (split 12A-first; Tasks fallback for complex goals; canonical life_lantern key; teen stays post-MVP; live mode stays stub; family-GS render surface ships) | OPEN (batch 4) | All recommended-yes |
| D-PRD19-1..6 | See `PRD19.md` §decisions (reduced safety bridge; nickname unification on family_members.nicknames; interview rebuilt to PRD spec; amend Convention #248; reports boundary held; SA lightweight scope) | OPEN (batch 4) | All recommended-yes |
| D-PINR-1..3 | See `PINR.md` §decisions (Option A dual sessions; keep teardown posture; code durations win + Convention #63 amended) | OPEN (batch 4) | All recommended-yes |
| D-FDWA-1..3 | See `FDWA.md` §decisions (narrow appearance RPC — never blanket self-update; include family_requests, EXCLUDE messages deliberately; teen family-device usage question) | OPEN (batch 4) | 1-2 recommended-yes; 3 = founder knowledge question, non-blocking |
| D-GDCX-1..5 | See `GDCX.md` §decisions (Messages redirect permanent; Progress→/my-rewards; Victories nav restore per #124; DailyCelebration Steps 3/4 bundle; per-prompt toggles accepted simplification) | OPEN (batch 5) | All recommended-yes; NBT fix itself needs no decision — it restores your own intent |
| D-RFLX-1..2 | See `RFLX.md` §decisions (**kid-private reflections: recommend NO** — design reversal, resolve at PRD-40 level; journal-copy visibility fix) | OPEN (batch 5) | No + Yes |
| D-MSRE-1..2 | See `MSRE.md` §decisions (Guided kids included; tag-level deferred) | OPEN (batch 5) | Both yes |
| D-3728-1..4 + D-28B-1..2 | See `PRD37.md` + `PRD28B.md` §decisions (locked 37→28B order + PRD19 prerequisite; proceed without real data; SendToGrid homework redirect; route cleanup; **SDS Vault tool early split-out — your Ruthie reporting need**; start using Log Learning) | OPEN (batch 6) | All recommended-yes |
| D-SAEX-1..6 | See `SAEX.md` §decisions (pre-shell /caregiver redirect; drop dead shift_sessions; SA excluded from family-door roster; direct-space messaging; existing keys canonical + lila_help removed from SA; FO-linked shift history) | OPEN (batch 6) | All recommended-yes |
| D-TRKG-1..3 + D-RSTP-1..2 + D-TYPES-1 | See `TRKG.md` / `RSTP.md` / `TYPES.md` §decisions (Connector-event + centralized SUM-semantics detection; mode-blindness repair in scope; picker honesty; step-level immediate idempotent never-revoked rewards; incremental types adoption) | OPEN (batch 7) | All recommended-yes |
| D-11B-1..2, D-14E-1..3, D-MSWP-1..2, D-PRD33-0..2 | See `PRD11B.md` / `PRD14E.md` / `MSWP.md` / `PRD33.md` §decisions (11B before 14E; family_celebration grant class; PWA scope→33; drop dead families columns; countdown emoji→icon picker; approval-learning stays Post-MVP; email = founder ops checklist; PRD33 parked + manifest/idb rulings) | OPEN (batch 8) | All recommended-yes |
| D-05C-1..2, D-21C-1..2, D-38-1..2 | See `PRD05C.md` / `PRD21C.md` / `PRD38.md` §decisions | ✅ RESOLVED (batch 9, founder 2026-07-04) | All approved per recommendations; D-38-1 answered: domain PARKED at GoDaddy → DNS cutover = founder-ops checklist, never a build dependency |

## STANDING RULE — deadline skip-ahead (founder, 2026-07-04)

Production order is P1 → P2 → P3 → P4 → P5 → P6, **but if 2026-07-07 approaches with items
unfinished, SKIP AHEAD so the judgment-heaviest packs always get Fable quality. P2 and PRD-19
must NEVER be the ones left over.** P5/P6 are the acceptable casualties — they can be produced
post-window on Opus with modest loss. A resumed session MUST honor this rule: check the date,
check what's unfinished, and jump the queue accordingly.

Additionally per founder: sequence pack production **in dependency order AND in order of
most-Fable-dependent**. The Fable session's own synthesis time is the binding constraint —
Sonnet recon is parallel and cheap; low-Fable-dependence packs (BSB1, SMFX, FDWA, PINR) are
produced opportunistically alongside without occupying queue slots.

**STANDING PRINCIPLE (founder, 2026-07-04, from the D-RFLX-1 ruling): "we don't want to
facilitate hiding things from parents."** Kids cannot lock content from parents; kid-privacy
resolves at the COPPA level only. No pack, build, or future design adds NEW kid-privacy
affordances without explicit founder direction. The RFLX build proposes this as a CLAUDE.md
convention line at its close-out.
**Carve-out clarification (founder, 2026-07-04 follow-up):** the EXISTING carve-outs (Journal
`visibility='private'`, InnerWorkings `share_with_mom=false`, lila_conversation View-As
filtering) **LEAVE STANDING** — the principle freezes the pattern going FORWARD. The legacy
carve-outs get decided ONCE, at the PRD-40 level WITH ATTORNEY INPUT, per the approved
D-PRD40-3 framing (the ARP data-practices summary surfaces them to counsel). **Never widen
visibility retroactively.**

## Synthesis queue (dependency × Fable-dependence, post-D-000)

1. **PRD40** (beta-legality root; interlocks PRD-41 sequencing; status unknown → highest judgment)
2. **PRD31** (monetization root; Convention #256 chart; beta-bypass exit plan)
3. **PRD32** (+PRD21B slice per D-002; depends on PRD31 knowledge; Convention #258 drain surfaces)
4. **PRD22** (independent; wide cross-system touchpoints)
5. **PRD19** (founder-protected — never left over; PRD-28B boundary must be drawn here first)
6. **PRD12A** → 7. **PRD12B** (adjacent pair; 12A first)
8. **PRD29** (widest unlock fan-out)
9. **PRD28B** (after PRD19 line-drawing) → 10. **PRD37** (after PRD28B)
11. **TRKG** → 12. **RSTP** (connector-architecture judgment, shared pipeline)
13. **SAEX** (+PRD27 per D-001)
14. **GDCX** / 15. **RFLX** / 16. **MSRE** (bounded surfaces)
17. **MSWP** / 18. **PRD05C** / 19. **PRD21C** → 20. **PRD38** / 21. **PRD14E** / 22. **PRD11B**
23. **TYPES** / 24. **PRD33** / 25. **BSBP** (tail — Opus-acceptable per standing rule)

Opportunistic track (parallel, low Fable-dependence): **BSB1** (draft exists — freshness delta
only), **SMFX** (items fully known), **FDWA** + **PINR** (code recon via cheap agents, no PRD read).

## Processing log

- 2026-07-04: Factory session started (Fable 5). Stage 1 inventory completed from BUILD_STATUS.md,
  completed-builds README + ledger, STUB_REGISTRY.md (full read), WIRING_STATUS.md, follow-up-builds
  folder, followup-build-queue memory, prds/ glob (102 files — PRD-40 found on disk, absent from
  BUILD_STATUS/glossary). MANIFEST created. Awaiting D-000.
- 2026-07-04 (later): D-000/001/002 resolved by founder. Standing deadline skip-ahead rule recorded.
  Synthesis queue re-ordered by dependency × Fable-dependence. Stage 2 recon wave 1 launched
  (Sonnet readers: PRD40, PRD31, PRD22 — 3 parallel per process). BSB1 opportunistic synthesis
  started in the main session.
- 2026-07-04 (later): **BSB1 pack written** (`BSB1.md` — freshness delta: ZERO BookShelf commits
  since the 2026-06-12 draft; conventions #275/#276/OPPORTUNITY-SURFACES checked, no conflicts;
  dispatch prompt final pending D-BSB1-1..3). **SMFX pack written** (`SMFX.md` — all 6 items
  re-verified live by grep: /queue route absent w/ 3 producers, FO pin fixture gap, shopping
  residuals, RPC grant revoke, 3 emoji sites, PRD-14D edit; dispatch prompt final pending
  D-SMFX-1..2). Decision batch 1 (5 small decisions) surfaced to founder. Recon wave 2 queue:
  PRD32(+21B) + PRD19 readers on wave-1 completions; FDWA + PINR code-recon agents after that.
- 2026-07-04 (later): Wave-1 recon complete (PRD40/PRD31/PRD22 briefs archived as *-RECON.md).
  **Three P2 packs synthesized: PRD40.md, PRD31.md, PRD22.md** — 19 decisions queued as batch 2.
  Key rulings: PRD40 dormant-but-built per founder 2026-04-21 resolution (supersedes Gate-4
  wording); PRD40 owns the Stripe foundation, PRD31 extends; PRD31 amends its PRD to the live
  feature_access_v2 shape + pre-populated toggles (production reality wins); one metering pipeline
  (ai_usage_tracking) — PRD-32's parallel log tables will NOT be built; PRD22 goes route-based
  hub-and-spoke; **Play-gear regression found** (live ungated Settings gear on Play shell, PRD
  says none — fix rides PRD22 Slice 2). Wave-2 readers in flight: PRD32(+21B), PRD19.
- 2026-07-04 (later): PRD32 brief in → **PRD32.md pack synthesized** (reconciliation-first: never
  build ai_usage_log/feedback_submissions/platform_usage_log/dedicated vault buckets — extend
  ai_usage_tracking, beta_glitch_reports, platform-assets; Safety Config deferred to PRD-30 build;
  minimal Moderation tab ships to unblock PRD-38; Personas tab confirmed FULLY WIRED, STUB L355-356
  persona-half + L94 stale rows flagged for correction). **Inter-brief contradiction RESOLVED by
  factory grep:** cost-logger is imported by 38 Edge Functions (PRD-32 reader right; PRD-31
  reader's "4 of ~50" wrong) — PRD31.md Slice 3 + D-PRD31-7 corrected to a centralized
  credit-deduction layer, PRD31-RECON.md annotated. Batch 3 queued (D-PRD32-1..6). Wave-3 readers
  in flight: PRD12A+PRD12B (combined), PRD29. Still running: PRD19. Next freed slots → FDWA + PINR
  code-recon agents, then GDCX/RFLX/MSRE and TRKG/RSTP/SAEX readers per queue.
- 2026-07-04 (later): PRD29 brief in → **PRD29.md pack synthesized, PARKED** (triage SCOPE-2.F67
  Defer-to-Gate-4 honored as D-PRD29-0; 11 rulings incl. 4-mode taxonomy over seeded drift,
  direct-deploy per #276, Composition-compliant wizard, Haiku router split, task_assignment
  interlock). PRD12A/12B brief in → **PRD12A.md + PRD12B.md packs synthesized** (split 12A-first;
  chunked Whisper = net-new module in 12B; another false ✅-Wired registry row caught — STUB:185
  LifeLantern→Project Planner; Convention #57 "7 stub loaders" text confirmed stale). FDWA + PINR
  code-recon agents launched. Still running: PRD19. **9 packs done** (BSB1, SMFX, PRD40, PRD31,
  PRD22, PRD32, PRD29, PRD12A, PRD12B); batches 1-4 pending founder.
- 2026-07-04 (later): PINR brief in → **PINR.md synthesized** (Option A dual persisted sessions
  ruled; Convention #63 doc-vs-code duration drift found — code wins). PRD19 brief in →
  **PRD19.md synthesized** (founder-protected item DONE: reduced Safe-Harbor bridge, nickname
  unification, interview rebuilt to spec, Convention #248 amendment, #243 obligation lands in its
  Slice 6; guard tables completed additively). FDWA brief in → **FDWA.md synthesized** (12+
  blocked tables ranked; TWO bonus finds: universal family_members self-update gap — theme
  changes silently fail for ALL non-mom sessions platform-wide — fixed via narrow appearance RPC;
  redeem_own_prize missing shadow branch). **12 packs done** (+PINR, PRD19, FDWA). In flight:
  GDCX reader, RFLX+MSRE combined reader. Remaining after those: TRKG, RSTP, SAEX(+PRD27),
  PRD28B, PRD37, MSWP, PRD05C, PRD21C, PRD38, PRD14E, PRD11B, TYPES, PRD33, BSBP.
- 2026-07-04 (later): GDCX + RFLX/MSRE briefs in → **GDCX.md, RFLX.md, MSRE.md synthesized (15
  packs done)**. GDCX headline: **Next Best Thing (PRD-25's unhideable flagship) dark in
  production since 2026-05-03; root cause = useNBTEngine never applies filterTasksForToday;
  fix + founder-verified re-enable is GDCX Slice 1.** Homework Help + Communication Coach modals
  found ALREADY WIRED (STUB rows 395/396/400/401 stale). RFLX reframed: kid-private reflections
  = deliberate-design REVERSAL question (recommend NO; resolve kid-privacy once at PRD-40 level);
  real fixes = journal-copy visibility mismatch + dead routed_destinations column + missing
  page routing. MSRE: shared hook across 4 View-As pages + the FO Best Intentions outside-View-As
  leak path; keyWiringStatus de-conflation (one flag falsely couples dad-grant + mom-restriction
  enforcement). Batch 5 queued. Wave in flight: TRKG+RSTP combined, SAEX(+PRD27), PRD28B+PRD37
  combined. Tail remaining after: MSWP, PRD05C, PRD21C, PRD38, PRD14E, PRD11B, TYPES, PRD33, BSBP.
- 2026-07-04 (later): PRD3728 + SAEX briefs in → **PRD37.md, PRD28B.md, SAEX.md synthesized (18
  packs done)**. 28B/37: PRD-19 confirmed as 28B's mandatory prerequisite (base report tables);
  locked 37→28B order held; SendToGrid homework "first brick" graduates to family_moments;
  **SDS Vault tool split out as early-dispatchable Slice 0 (founder's personal Ruthie-reporting
  need + pre-launch marketing asset)**; COPPA per-family assertion approach. SAEX: D-001 resolved
  at synthesis = ONE pack, TWO builds (A foundation → B PRD-27 content). **Major find: split-brain
  shift system — ShiftView writes time_sessions, but usePermission's SA branch + ALL of mom's
  PermissionHub SA surfaces read the dead shift_sessions table (0 rows) → shift-gated access has
  NEVER functioned; STUB:85 "Shift View ✅ Wired" materially misleading.** Also: PRD-27's
  messaging plan targets a column that never existed (thread_type); babysitter currently gets the
  FULL adult shell incl. AI. Batch 6 queued (D-3728, D-28B, D-SAEX). In flight: TRKG+RSTP reader,
  05C/21C/38 combined reader, 14E/11B/MSWP combined reader. After those: TYPES (factory-written,
  light), PRD33, BSBP placeholder → Stage 1-3 COMPLETE, all batches to founder.
- 2026-07-04 (later): TRKG/RSTP brief in → **TRKG.md, RSTP.md, TYPES.md synthesized (21 packs
  done).** DEEPEST FIND OF THE RUN: **gamification earning-mode settings are UI theater** —
  execute_creature_godmother implements 0 of 4 configured creature modes (flat roll always);
  execute_page_unlock_godmother lost the tracker_goal branch in the Connector rewrite (2 of 3
  page modes); Settings writes columns nothing reads; Conventions #209/#210 + STUB:334 overclaim.
  Also: **R1 stub premise FALSE** — routine steps fire zero reward pipeline; no routine-level
  completion event exists (routine parent tasks never get Mark-Complete). TRKG ruled: Connector
  event + one centralized SUM-semantics detection godmother + full mode-honesty repair. RSTP
  ruled: step-level, immediate, idempotent-per-day, never revoked, no deed-per-step. TYPES ruled:
  incremental adoption. Batch 7 queued. PRD-33 reader launched (last recon). In flight:
  05C/21C/38, 14E/11B/MSWP, PRD33. Remaining synthesis: those 6 packs + BSBP placeholder note →
  then Stage 1-3 COMPLETE (28 packs), all 7 batches to founder.
- 2026-07-04 (later): TAIL brief (14E/11B/MSWP) + PRD33 brief in → **PRD11B.md, PRD14E.md,
  MSWP.md, PRD33.md, BSBP.md written (26 packs + placeholder).** Finds: /hub/tv renders BLANK
  (missing registry entry — **SMFX amended to 7 items**); STUB:184 Family-Celebration false-Wired;
  Hub Celebrate button doesn't even query counts; MSWP SHRANK (share-to-app already wired,
  offline→PRD33 per the addendum's own assignment, email=DNS ops task, real gap = digest toggles
  that render nothing + STUB:232 overclaim); PRD33 parked with the #257 offline-date tension
  PRE-RULED (client timestamps order-only; DATE columns server-derived at flush; airplane-mode→
  correct-DATE probe is the load-bearing test). Batch 8 queued. **ONLY the 05C/21C/38 reader
  remains** → 3 final packs → Stage 1-3 COMPLETE.
- 2026-07-04 (final): VAULT brief (05C/21C/38) in → **PRD05C.md, PRD21C.md, PRD38.md written.
  STAGES 1-3 COMPLETE: 29 packs + BSBP placeholder.** Final finds: Optimizer is live-but-hollow
  in the LiLa picker (hide rides SMFX item 8 — SMFX now 8 items); 21C's vault_items counters
  have been hardcoded-zero in production since the Vault shipped; 21C addendum's "completed"
  claim false; PRD38 is the cleanest absence (even its demand card renders nowhere; new
  top-level STUB row ships with its build); ai_patterns.md's "BYOK support" line conflicts with
  the PRD's no-BYOK design (05C close-out corrects). Batch 9 (FINAL) queued. **Stage 4 = founder
  approves batches 1-9; approved packs flip to APPROVED; dispatch prompts are then final.**
  Suggested dispatch order (kid-pain-per-effort): FDWA → GDCX → SMFX → PINR, with PRD40/PRD31/
  PRD22/PRD32 queuing behind SAFETY-BETA-GATE deploys, then the P3/P4/P5 chains per each pack's
  dependency edges. Resume rule for any future session: this manifest alone is sufficient state.
- 2026-07-04 (Stage 4): **FOUNDER RESOLVED BATCHES 1-8 — all packs APPROVED** (⚖ block above is
  authoritative). Amendments executed: PRD31 (greenfield Stripe), PRD40 (+Attorney Review
  Package → new item ARP.md, dispatch-ready before 07-07), RFLX (privacy scope DEAD; standing
  no-hiding-from-parents principle recorded here + memory + proposed CLAUDE.md line at RFLX
  close-out), FDWA (messages/notepad/mindsweep INCLUDED; attribution E2E; FDWA+PINR pair —
  PINR.md cross-noted), PRD28B (SDS split-out declined, folded into Slice 3), PRD29 (UNPARKED →
  recon'd; claude.ai goal-science addendum is the new upstream; TRKG first; vision doc read and
  confirmed complete). Batch 9 still OPEN (D-05C-1..2, D-21C-1..2, D-38-1..2 — D-38-1 needs the
  founder's domain-state answer). Updated dispatch-order note: **ARP first (window!), then
  FDWA+PINR (pair) → GDCX → SMFX**, P2 chain behind SAFETY-BETA-GATE deploys, claude.ai
  BigPlans addendum session whenever the founder schedules it.
- 2026-07-04 (Stage 4 complete): **BATCH 9 RESOLVED — FACTORY DONE.** Founder follow-ups
  executed: (1) legacy kid-privacy carve-outs LEAVE STANDING — pattern frozen forward; decided
  once at PRD-40 with attorney input (ARP data-practices summary now surfaces the question to
  counsel); never widen visibility retroactively; (2) BigPlans upstream corrected: the
  research+design session runs NOW in a parallel Claude Code Fable window → draft at
  claude/feature-decisions/PRD-29-Goal-Science-Addendum-DRAFT.md → re-synthesis when the
  approved addendum lands in prds/addenda/; (3) aimagicformoms.com parked at GoDaddy → PRD38
  amended (preview-hostname verification + GoDaddy→Vercel founder-ops cutover checklist);
  (4) batch 9 approved per recommendations (PRD05C, PRD21C, PRD38 → APPROVED). Final state:
  **27 APPROVED packs + ARP (approved deliverable) + PRD29 (awaiting addendum) + BSBP
  (awaiting BSB1).** This manifest remains the single resume anchor.
- 2026-07-04 (evening — PRD29 re-synthesis): the approved Goal Science Addendum landed in
  prds/addenda/ (1550 lines; all 24 §17 decisions founder-ruled incl. D6 FINAL minor-privacy
  posture — mom-held notified privacy grant, kids never hold a lock — and D22-extended
  no-alerts). **PRD29.md fully re-synthesized → APPROVED**: 20 rulings (11 carried, 2
  superseded — §11 seven-mode registry replaces the pure 4-mode set; five-value plan_type +
  satellites — 7 new addendum laws incl. Just-Today-AI-free, essays default is_included_in_ai
  FALSE + PI hard exclusion, crisis-independent-of-privacy, white-hat copy rules); slice plan =
  3 build phases × 15 slices (A1-A6 foundation/core/curriculum-flagship, B1-B5 Wheel/Overcoming
  w/ load-bearing privacy probes, C1-C4 tiers/integrations); schema slice creates
  plan_wheels + plan_support_people greenfield with the addendum baked in; teen/guided
  Overcoming BUILT-DARK behind bigplans_overcoming_teen; per-phase dispatch prompts (Sonnet
  xhigh workers, Fable-else-Opus gates); TRKG-first sequencing held. **FACTORY FULLY COMPLETE:
  28 APPROVED packs + ARP; only BSBP remains by design (post-BSB1).**
- 2026-07-05: ARP marked DELIVERED (six drafts in claude/legal-drafts/ incl. attorney cover
  memo — founder sends to counsel). NEW ITEM INVENTORIED: **FGPZ — Family Goals & Family
  Prizes** (founder mid-session ask 2026-07-05; research handoff written by the KIDS-REWARDS-S5
  worker at claude/feature-decisions/Family-Goals-And-Prizes-Handoff.md; awaits a Fable-led
  pre-build — note the overlap surface with PRD29's family plans + weekly family check-ins and
  the PrizeBoard). Docs-only commit pushed: dispatch-factory/ + legal-drafts/ + the approved
  Goal Science Addendum + vision/brief docs + BookShelf recon/draft + model-routing.md —
  parallel sessions' in-flight files deliberately left unstaged.
