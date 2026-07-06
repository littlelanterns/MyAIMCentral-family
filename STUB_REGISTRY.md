# Stub Registry — MyAIM Central v2

Every stub across all PRDs with created-by PRD, wired-by PRD (or "Unwired"), and build phase assignment.

## Status Legend

- ✅ **Wired** — Fully implemented. No further action.
- 🔗 **Partially Wired** — Some aspects implemented, some remain. Track the unwired aspects separately.
- ⏳ **Unwired (MVP)** — Committed deferred work: stub is scheduled for wiring in a specific future MVP build. Counts toward per-build stub metrics.
- 📌 **Unwired (Post-MVP)** — Speculative / nice-to-have, intentionally deferred beyond MVP. Not committed to any specific build. Counted separately — never included in a build's stub count.
- ❌ **Superseded** — Replaced by a different approach.
- 🚫 **Removed** — Removed from the seed default.
  ⤷ 'Removed' means removed from the seed default (e.g., section dropped from the default morning/evening rhythm, template removed from the default Studio shelf). The underlying code / component may still exist in the repo for custom configurations or future reuse. This symbol does NOT mean 'code deleted.'

### Stub count convention

"Build X stub count" means "Unwired (MVP) stubs introduced or touched in Build X." Post-MVP items are counted separately. Wired items from prior builds are not re-counted — the per-build count is a snapshot of deferred MVP work tied to that build, not a lifetime total.

---

## OPPORTUNITY-SURFACES Follow-Ups (2026-07-03)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Claim-on-behalf from FO board rows (mom claiming a board item FOR a kid directly from the Family Overview column; today mom claims via View As or the kid claims themselves — keeps claim identity clean) | OPPORTUNITY-SURFACES scope (b) | Unwired | 📌 Unwired (Post-MVP) | — |
| Standalone opportunity TASKS (backward-compat, non-list shape) in the FO unclaimed-board display — boards (`lists.is_opportunity`) are the founder-named regression subject; standalone tasks already surface via FO claims/completions rows + the restored Tasks-page tab | OPPORTUNITY-SURFACES scope (b), decision #7 | Unwired | 📌 Unwired (Post-MVP) | — |
| FO board row tap-through to the Lists detail page (rows are display-only) | OPPORTUNITY-SURFACES scope (b) | Unwired | 📌 Unwired (Post-MVP) | — |
| Play claim-lock countdown UI (claimable items still get their task_claims lock; no timer display for pre-readers) | OPPORTUNITY-SURFACES scope (c) | Unwired | 📌 Unwired (Post-MVP) | — |
| Play voluntary claim release ("Put it back" exists on Guided/Independent/Adult surfaces; Play kids ask a grown-up — mom has the FO [Return]) | OPPORTUNITY-SURFACES scope (c) | Unwired | 📌 Unwired (Post-MVP) | — |

---

## Family Goals & Family Prizes (2026-07-05) — founder-directed, awaiting Fable pre-build

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| **Family-level goal/tracking system: Family Prizes, Family Best Intentions integration, and general "family goals" the whole family works toward together.** Raised by the founder mid-session during KIDS-REWARDS-PAGE-S5 ("if the family is working together on a prize or a goal, it would be a family prize"). She explicitly asked for REAL multi-member contribution tracking (not a manual mom-declared placeholder) and to run the design in a dedicated Fable session rather than absorb it into the Slice 5 PrizeBoard polish it was raised alongside. Full research handoff — schema constraints already checked (`earned_prizes.family_member_id` is `NOT NULL` today; `contracts.family_member_id IS NULL` already means something different — "all kids individually," not "one shared goal"; `family_best_intentions`/`family_intention_iterations` is the closest existing precedent but is entirely disconnected from the reward-firing pipeline), three founder decisions already resolved (build real tracking now; surface on a member's own rewards page when they participate in or are earning toward it; mom marks a family prize redeemed once for everyone), and open design questions for the Fable pre-build to resolve — all in `claude/feature-decisions/Family-Goals-And-Prizes-Handoff.md`. | Founder directive, 2026-07-05 (mid KIDS-REWARDS-PAGE-S5) | Unwired | ⏳ Unwired (MVP) | Dedicated Fable pre-build session — see handoff doc §6 for the starting prompt |

---

## KIDS-REWARDS-PAGE Follow-Ups (2026-06-12)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| **Per-step routine rewards (Unification Principle R1).** Per-step reward config does NOT exist anywhere (`task_template_steps` has zero reward columns; no payout code). KIDS-REWARDS-PAGE wired routine-COMPLETION rewards into the earned-prizes pipeline at the two existing hook points (`useTaskCompletion.ts` completion-time, `useTaskCompletions.ts` approval-time). A future build adding per-step rewards must: add reward columns (`reward_type`, `reward_amount`, `reward_image_url`, `reward_image_asset_key`) to `task_template_steps`, surface config in the routine builder, fire the payout at step completion (`routine_step_completions` insert path — note: NO fireDeed exists there today), and route privileges/family_activities rewards into `earned_prizes` with `source_type='routine_step'` provenance. The earned-prizes pipe and three-mode image picker are waiting and reusable. | KIDS-REWARDS-PAGE gate (G2: hooks not features) | Unwired | ⏳ Unwired (MVP) | Future routine-rewards build |
| **Tracker goal detection → prize firing (Unification Principle R2).** No tracker/widget has goal-reached or milestone completion detection — `widget_data_points` record silently; nothing fires. KIDS-REWARDS-PAGE added the prize **image** to tracker prize config (`widget_config.prize_image_url` / `prize_image_asset_key` alongside the existing `prize_label`) so the promise is fully configured. A future build adding goal detection must: detect threshold/goal crossing at the `widget_data_points` write path (per tracker type), then create the `earned_prizes` row from the widget's configured prize fields with `source_type='widget'` provenance (`reward_reveal_attachments.source_type` already permits `'widget'`). Covered-by-principle: any tracker gaining completion detection inherits the earned-prizes hook — do not invent a parallel reward path. | KIDS-REWARDS-PAGE gate (G1: recon before wiring trackers) | Unwired | ⏳ Unwired (MVP) | Future tracker-goals build |
| Freeform / LiLa-assisted reward proposals (v1 is a guided structured form; no LiLa parsing) | KIDS-REWARDS-PAGE gate §5 | Unwired | 📌 Unwired (Post-MVP) | — |
| Multi-round proposal counteroffers (v1 is one-round: mom counters once, kid accepts/declines) | KIDS-REWARDS-PAGE gate §5 | Unwired | 📌 Unwired (Post-MVP) | — |
| Play-shell Propose-a-Reward variant (form kept simple enough to extend; not built) | KIDS-REWARDS-PAGE gate §5 | Unwired | 📌 Unwired (Post-MVP) | — |
| Un-redeem reversal audit history (v1 is a clean reset — clears redeemed_at/by with no audit row) | KIDS-REWARDS-PAGE gate Q2 | Unwired | 📌 Unwired (Post-MVP) | — |
| **Slice 5 — Parent PrizeBoard "By kid / By date" arrangement toggle + prizes/privileges-only summary strip.** Registered here at close-out (2026-07-04) rather than silently absorbed as done: Slices 1-4 shipped and were verified; Slice 5 (the last item of the original 5-slice plan) was never executed — no arrangement toggle on the Prizes tab, no dedicated summary strip, no `tests/e2e/features/kids-rewards-page.spec.ts`. The #271 owed-number reconciliation test Slice 5 called for was already covered by Slice 2's test 18, and LiLa knowledge + FeatureGuide were completed at this same close-out — those two Slice 5 items are done. Mom's own rewards-page entry point (R4-REVISED: a pill in PrizeBoard's Prizes tab) also still needs this tab work to fully land. | KIDS-REWARDS-PAGE gate | Unwired | ⏳ Unwired (MVP) | Future Slice 5 build (own dispatch, re-verify current PrizeBoard.tsx state first) |
| **fo-command-center pin must seed/restore `family_overview_configs` itself.** The pinned spec assumes the default no-config state (all member columns render) but never seeds it — any session that saves a member selection on the Testworth mom's FO breaks tests 6+12 ("Jordan's column" not found). Bit the Slice 4 pin run 2026-07-03; repaired by a one-off test-family config delete. Fix belongs in `tests/e2e/family-overview/fo-command-center.spec.ts` beforeAll/afterAll (snapshot + restore, same pattern the slice specs use for member preferences). FO-COMMAND-CENTER-owned surface. | KIDS-REWARDS-PAGE Slice 4 pin run (2026-07-03) | Unwired | ⏳ Unwired (MVP) | Next session touching the FO spec |
| **`/queue?tab=requests` notification action_url is a dead link (pre-existing since PRD-15 Build G).** No `/queue` route exists; NotificationTray navigates `window.location.href` there for request-received notifications — and now reward-proposal notifications reuse the same URL for consistency. Candidate fix: a `/queue` route that redirects to the dashboard and opens the UniversalQueueModal on the requested tab. | PRD-15 Build G (discovered by KIDS-REWARDS-PAGE Slice 4) | Unwired | ⏳ Unwired (MVP) | Small standalone fix or next PRD-15/queue-surface session |

---

## RR-DEPLOY-SCOPING Follow-Ups (2026-06-10)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Comprehensive family-device write audit — remaining tables (journal_entries, victories, widget_data_points, practice_log, messages, reflection_responses, etc.) under family-shadow sessions. Migration 100262 restored the tasks/lists/hub-tally domain (`util.is_family_shadow_of` additive policies); every OTHER table a family-device dip-in writes to needs the same check. Same fix pattern. | Two-door build (Convention #273) exposed; RR-DEPLOY-SCOPING fixed the tasks domain | Unwired | ⏳ Unwired (MVP) | Dedicated audit pass — symptom: kid action on family tablet silently does nothing |
| FO Queue "Deploy all" button on `deployQueueItem()` engine | RR-DEPLOY-SCOPING (engine shipped) | FO-COMMAND-CENTER (same day — button shipped on the engine) | ✅ Wired | Done 2026-06-10 |
| Tasks/Lists READ-side RLS (unchanged — Convention #39 per-member-auth migration point) | Role-scoping leak pass | Unwired | ⏳ Unwired (MVP) | Per-member-auth migration |

---

## Foundation Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Mom self-restriction ENFORCEMENT (rows saved + displayed inactive via keyWiringStatus; no mom-side surface filters by them yet) | PRD-02 / PERMISSIONS-WIRING (2026-06-09) | Unwired | ⏳ Unwired (MVP) | Follow-up build (target-aware filtering on journal/stars/intentions/innerworkings mom views) |
| Special Adult Experience (mount ShiftView PRD-02 Screen 6, SA sidebar branch, shift-gated visibility; SA Hub per-kid grid hidden until then) | PRD-02 / PERMISSIONS-WIRING (2026-06-09) | Unwired | ⏳ Unwired (MVP) | `claude/follow-up-builds/special-adult-experience.md` |
| Inactive Hub permission keys (journal/guiding_stars/best_intentions/innerworkings/victory_recorder per-kid dad grants — marked "takes effect in a future update") | PERMISSIONS-WIRING (2026-06-09, founder Decision 4) | Unwired | 📌 Unwired (Post-MVP) | Each needs a real dad-views-kid surface first; flip in keyWiringStatus.ts when wired |
| IndependentShell RoutingToastProvider (teen shell toasts are silent noops; no permission gate fires there so not load-bearing) | PERMISSIONS-WIRING (2026-06-09) | Unwired | 📌 Unwired (Post-MVP) | — |
| "Deploy all" button on the Queue surface (loops `deployQueueItems()` per pending item + results summary; lives in SortTab so modal + FO Queue tab share it) | FO-COMMAND-CENTER (2026-06-10, founder request via coordination) | FO-COMMAND-CENTER (same day — REVIEW-ROUTE engine landed mid-session) | ✅ Wired | E2E `fo-command-center.spec.ts` test 3b |
| FO Finances tab for finance-granted dads (scoped to granted kids; view = read-only, contribute = + Pay All, manage = + grace/makeup) | FO-COMMAND-CENTER (2026-06-10) | FO-COMMAND-CENTER (same day — founder pulled into scope at the eyes-on gate) | ✅ Wired | E2E `fo-command-center.spec.ts` test 8b |
| FO per-column long-press collapse override + section/column drag-reorder (PRD-14C spec) | PRD-14C original FO build (pre-existing gap) | FO-COMMAND-CENTER (2026-06-10 — founder pulled into scope at the eyes-on gate) | ✅ Wired | Long-press 500ms override + ⠿ grips via @dnd-kit, persisted. E2E test 8c |
| Personal-device member timeout → PIN relock (family layer must persist on device; today timeout = full sign-out, kid re-enters family password) | Family-Auth-Two-Door (2026-06-09, Founder Decision 4) | Unwired | ⏳ Unwired (MVP) | Follow-up build |
| 'None'-members direct resting member session from choice screen (currently routes via /hub avatar dip-in — safe, just indirect) | Family-Auth-Two-Door (2026-06-09) | Unwired | 📌 Unwired (Post-MVP) | — |
| PIN flow requires_email_login guard (picture flow has it; PIN flow would mint an unresolvable session for an email-linked member) | Family-Auth-Two-Door (2026-06-09) | Unwired | 📌 Unwired (Post-MVP) | — |
| Revoke transitional public set_family_password RPC grant (Edge Function path is canonical; bare RPC skips shadow rotation → drift) | Family-Auth-Two-Door (2026-06-09) | Unwired | ⏳ Unwired (MVP) | Follow-up build |
| PIN verification (FamilyLogin) | PRD-01 (Phase 01) | Remediation | ✅ Wired | Remediation |
| Accept-invite flow (/auth/accept-invite) | PRD-01 | PRD-01 | ✅ Wired | Remediation |
| Session duration per role | PRD-01 | PRD-01 | ✅ Wired | Remediation |
| Inactivity warning banner | PRD-01 | PRD-01 | ✅ Wired | Remediation |
| Family device hub widgets | PRD-01 | PRD-14D | ✅ Wired | Phase 15 |
| Tablet hub timeout config | PRD-01 | PRD-22 | ✅ Wired | Phase 27 |
| Permission hub UI | PRD-02 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
| Transparency panel (mom side) | PRD-02 | PRD-02 | ✅ Wired | Phase 02 |
| Teen transparency panel (teen side) | PRD-02 | PRD-02 | ✅ Wired | Remediation |
| View As sessions | PRD-02 | PRD-02 | ✅ Wired | Phase 02 |
| View As (modal overlay + identity scope + origin flag) + banner | PRD-02 | View-As Identity-Scope | ✅ Wired | View-As Identity-Scope (2026-05) |
| View As feature exclusions | PRD-02 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
| Special Adult Shift View | PRD-02 | PRD-02 | ✅ Wired | Remediation |
| Shift schedule config | PRD-02 | PRD-35 (access_schedules) | ✅ Wired | Phase 05 |
| PIN lockout (server-side) | PRD-01 | PRD-02 | ✅ Wired | Remediation |
| Default permission auto-creation | PRD-02 | PRD-02 | ✅ Wired | Remediation |
| Emergency lockout toggle | PRD-02 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
| Permission profiles → Layer 3 | PRD-02/PRD-31 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
| Post-shift LiLa summary compilation | PRD-02 | — | ⏳ Unwired (MVP) | Phase 06+ (LiLa) |
| Recalculate tier blocks Edge Function | PRD-02/PRD-31 | — | ⏳ Unwired (MVP) | Phase 38 (Stripe) |
| SA Log Activity form during shifts | PRD-02 | PRD-27 | ⏳ Unwired (MVP) | Phase 31 |
| Admin user management | PRD-02 | PRD-32 | ✅ Wired | Phase 39 |

## View-As Identity-Scope Architecture Follow-Ups (2026-05)

These are scoped follow-up builds surfaced during the View-As Identity-Scope Architecture build (PRD-02 / PRD-14D / PRD-28, 2026-05). Each awaits its own pre-build audit and feature-decision doc.

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| **A.** My Rewards page content — ~~kid-facing prize/allowance/balance UI stub~~ **RESOLVED — KIDS-REWARDS-PAGE (2026-06/2026-07), 4 slices.** Real `<MyRewards>` component ships Points/streak, Custom Rewards, Victories, Finances, Creatures, Coloring, Propose-a-Reward (kid) + self-propose (adult) sections, mom-toggleable per member. See `.claude/completed-builds/2026-07/kids-rewards-page.md`. | View-As Identity-Scope | KIDS-REWARDS-PAGE | ✅ Resolved | — |
| **B.** Special Adult sidebar audit (Convention #40 invisibility follow-up) — reconcile `getSidebarSections('special_adult')` against `permission_level_profiles role_group='special_adult'` | View-As Identity-Scope | — | ⏳ Unwired (MVP) | Follow-up build |
| **C.** Safe Harbor decommission — ~~PRD-20 status change, convention sweep, schema + edge-function + route cleanup~~ **RESOLVED 2026-06-09: founder backburnered PRD-20.** 4 guided modes deactivated (migration 100249), user-facing surfaces removed (route, Lanterns Path, expansion registry, PermissionHub toggle). Defensive plumbing KEPT intentionally (`is_safe_harbor` filters, `PRIVACY_EXCLUSIONS`/`PRIVACY_ROUTE_MAP`, Conventions #6/#243). See `claude/feature-decisions/Safe-Harbor-Backburner-Decision.md` | View-As Identity-Scope | Backburner decision 2026-06-09 | ✅ Resolved | — |
| **D.** Generated Supabase TypeScript types adoption — add `Database` generic to `createClient`, regenerate `src/types/supabase.ts`, fix surfaced type errors. Closes the typo-safety gap that motivated build-wide Disciplines 1+2 | View-As Identity-Scope | — | 📌 Post-MVP | Follow-up build (own pre-build audit) |
| **E.** Per-member sidebar customization — layer `member_feature_toggles` (Permission Hub overrides) over the `permission_level_profiles` baseline in `getSidebarSections()`. Foundational dep of Permission Hub usability. Doc: `claude/follow-up-builds/per-member-sidebar-customization.md` | View-As Identity-Scope | — | ⏳ Unwired (MVP) | Follow-up build |
| **F.** Shopping Mode & Lists visibility scoping — list-level visibility (owner + `list_shares`) on `useShoppingModeStores` so mom's private lists don't leak to teens. Doc: `claude/follow-up-builds/shopping-mode-and-lists-visibility-scoping.md` | View-As Identity-Scope | — | ⏳ Unwired (MVP) | Follow-up build |
| **G.** Reflections revamp (privacy + Past tab + render shape) — `reflection_responses` has no privacy column; decide whether kid-private support is added, audit the "Visible to parent" indicator, revisit Past tab UX | View-As Identity-Scope | — | ⏳ Unwired (MVP) | Follow-up build |

**Permanent View-As architecture improvements (✅ Wired, not stubs — recorded for traceability):** the ErrorBoundary wrap around the ViewAsModal-rendered shell/page (commit `939b730`, friendly fallback instead of black-screen) and the hub-route ViewAsModal mount in `src/pages/Hub.tsx` (commit `9d63b1f`, so the `/hub` member_session flow can render the kid's view). Both surfaced during the cross-shell crash detour and are permanent.

## LiLa AI Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| LiLa Optimizer mode | PRD-05 | PRD-05C | ⏳ Unwired (MVP) | MISLEADING UI: `optimizer` mode_key appears in LiLa mode picker, but PRD-05C Optimizer flow not built. TODO in `PromptPackDetail.tsx:152` explicitly notes the gap. Tapping the mode does not launch an optimization experience. |
| HumanInTheMix Regenerate/Reject | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Help/Assist pattern matching (13 FAQs) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Opening messages (core + task_breaker) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Context assembly stubs (7 sources) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Permission + privacy filtering | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Voice input (Whisper) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Page context passing | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Person-level context toggles (UI) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Conversation history date filter | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Context sources (GuidingStars, etc.) | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
| Review & Route pipeline | PRD-05 | PRD-08 | ✅ Wired | Phase 09 |
| Long conversation summarization | PRD-05 | — | 📌 Post-MVP | — |
| Mode auto-routing mid-conversation | PRD-05 | — | ⏳ Unwired (MVP) | Phase 07+ |
| Archive context loading | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
| BookShelf RAG context | PRD-05 | PRD-23 | ✅ Wired | 2026-04-11 (Phase 1b-E: context-assembler → get_bookshelf_context platform RPC) |
| Tool permission management UI | PRD-05 | PRD-22 | ⏳ Unwired (MVP) | Phase 27 |
| Victory detection/recording | PRD-05 | PRD-11 (AIR) | ⏳ Unwired (MVP) | All 3 designed AIR sources (task, intention, widget) await build. List-completion auto-victories fire via separate `list_completed` path (migration 100102), not AIR. |
| Context Learning write-back | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
| Mediator/Peacemaker mode | PRD-05 | PRD-34 (mediator) | ✅ Wired | Phase 35 |
| Decision Guide mode | PRD-05 | PRD-34 (decision_guide) | ✅ Wired | Phase 35 |
| Fun Translator mode | PRD-05 | PRD-34 (translator) | ✅ Wired | Phase 35 |
| Teen Lite Optimizer | PRD-05C | — | 📌 Post-MVP | — |
| Homework Checker | PRD-05 | — | 📌 Post-MVP | — |
| Privacy Filtered category | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
| Library Vault tutorial links | PRD-05 | PRD-21A | ✅ Wired | Phase 25 |
| Relationship tools person-context | PRD-05 | PRD-21 | ✅ Wired | Phase 24 |
| Edit in Notepad action chip | PRD-05 (Phase 06) | PRD-08 (Phase 09) | ✅ Wired | Phase 09 |
| Review & Route action chip | PRD-05 (Phase 06) | PRD-08 (Phase 09) | ✅ Wired | Phase 09 |
| Create Task action chip | PRD-05 (Phase 06) | PRD-09A | ✅ Wired | Phase 10 |
| Record Victory action chip | PRD-05 (Phase 06) | PRD-11 | ⏳ Unwired (MVP) | Phase 12 |

## Personal Growth Stubs

> **AIR scope note:** "AIR Wired" status means silent auto-creation on source event (task completion, intention iteration, widget milestone). Manual scan-and-claim paths do not qualify.

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Family-level GuidingStars | PRD-06 | PRD-12B | ⏳ Unwired (MVP) | `owner_type` column on `guiding_stars` supports family-scope values but no UI creates or renders family-owned Guiding Stars. PRD-12B schema never built. Column was prep-scaffolded under PRD-06/07 repair work; full Family Vision Quest feature deferred. |
| Dashboard widget containers | PRD-06 | PRD-10 | ✅ Wired | Phase 11 |
| Morning/Evening rhythm integration | PRD-06 | PRD-18 | ✅ Wired | Phase 19 |
| Victory Recorder logging from intentions | PRD-06 | PRD-11 (AIR) | ⏳ Unwired (MVP) | `useLogIntentionIteration` writes iteration + activity_log; no victory insert in the mutation. |
| InnerWorkings context in LiLa | PRD-07 | PRD-13 | ✅ Wired | Phase 13 |
| LiLa self-discovery guided mode | PRD-07 | PRD-07 | ✅ Wired | Phase 08 |
| "Craft with LiLa" — pre-primed conversation for GS crafting (button exists, shows stub alert) | PRD-06 | PRD-05 (LiLa integration) | ⏳ Unwired (MVP) | Phase 06 |
| "Extract from Content" — upload content, extract GS entries | PRD-06 | Knowledge Base PRD | ⏳ Unwired (MVP) | TBD |
| Family-level Guiding Stars creation — owner_type='family' column exists, creation flow deferred | PRD-06 | PRD-12 (LifeLantern) | ⏳ Unwired (MVP) | Phase 22 |
| Dashboard widget for GS rotation — widget config defined | PRD-06 | PRD-10 (Widgets) | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Morning/Evening Review GS integration — data contracts defined | PRD-06 | PRD-18 (Rhythms) | ⏳ Unwired (MVP) | Phase 19 |
| Victory Recorder GS thread detection — celebration checks GS for connections | PRD-06 | PRD-11 (Victory Recorder) | ⏳ Unwired (MVP) | Phase 12 |
| Declaration language coaching — LiLa guides toward honest commitment language | PRD-06 | PRD-05 (LiLa crafting flow) | ⏳ Unwired (MVP) | Phase 06 |
| Victory Recorder daily intention summary — intention_iterations consumed by Victory Recorder | PRD-06 | PRD-11 (Victory Recorder) | ⏳ Unwired (MVP) | Phase 12 |
| Dashboard widget for BI celebration — widget config defined | PRD-06 | PRD-10 (Widgets) | ⏳ Unwired (MVP) | Planned celebration/milestone UI moment when a Best Intention threshold is hit (confetti/congrats card). Distinct from the existing `InfoFamilyIntention.tsx` tally display widget — the tally is a separate feature and is not the referent of this stub. |
| Bar graph tracker visualization — tracker_style column exists, UI shows "Enhanced" badge | PRD-06 | best_intentions_tracker_views feature key | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Streak tracker visualization — tracker_style column exists, UI shows "Enhanced" badge | PRD-06 | best_intentions_tracker_views feature key | ⏳ Unwired (MVP) | PRD-10 Phase B |
| "Discover with LiLa" (self_discovery guided mode) — button exists, stub behavior | PRD-07 | PRD-05 (lila_guided_modes seed + system prompt) | ⏳ Unwired (MVP) | Phase 06 |
| Teen privacy indicator — UI badge showing visibility status | PRD-07 | PRD-02 (teen visibility setting) | ⏳ Unwired (MVP) | Phase 02+ |
| Archives "checked somewhere, checked everywhere" — sharing state single-source-of-truth | PRD-07 | PRD-13 (Archives) | ✅ Wired | Phase 13 |
| Content extraction from Knowledge Base — upload to KB, extract IW entries | PRD-07 | Knowledge Base PRD | ⏳ Unwired (MVP) | TBD |
| Messaging notifications | PRD-08 | PRD-15 | ✅ Wired | Phase 16 |
| Review & Route routing UI | PRD-08 | PRD-08 | ✅ Wired | Phase 09 |
| Send to Person (messaging) | PRD-08 | PRD-15 | ✅ Wired | Phase 16 |
| Send to Calendar | PRD-08 | PRD-14B | ✅ Wired | Phase 14 |
| Send to Touch Base (Agenda) | PRD-08 | PRD-16 (Build P) | ✅ Wired | 2026-04-15 — MeetingPickerOverlay multi-select grid; also wired from SortTab + MindSweep (2026-05-06 overhaul) |
| Reward system integration | PRD-09A | PRD-24 | ✅ Wired | Phase 29 |
| Allowance pool calculation | PRD-09A | PRD-28 | ✅ Wired | Phase 32 |
| Widget milestone → victory | PRD-10 | PRD-11 (AIR) | ✅ Wired | Phase 12 |
| Auto-victory from task completions | PRD-11 | Phase 3 Connector | ✅ Wired | 2026-05-03 — `victory_godmother` fires via contracts on task completion deeds. Legacy `createVictoryForCompletion` deleted. |
| Family Celebration mode | PRD-11 | PRD-11B | ✅ Wired | Phase 12 |
| Complex goal → Project Planner | PRD-12A | PRD-29 | ✅ Wired | Phase 33 |
| Family Vision Quest discussions | PRD-12B | PRD-12B | ⏳ Unwired (MVP) | PRD-12B schema (`family_vision_quests`, `vision_sections`, `family_vision_statements`, etc.) never built. Feature unavailable in app. Partial claim was aspirational. |
| Context export for external AI | PRD-13 | PRD-13 | ✅ Wired | Phase 13 |

## Archives & Context Stubs (PRD-13)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| LifeLantern aggregation in Archives | PRD-13 | PRD-12A | ⏳ Unwired (MVP) | Phase 22 (PRD-12A) |
| Family Vision Statement in Family Overview | PRD-13 | PRD-12B | ⏳ Unwired (MVP) | Phase 22 (PRD-12B) |
| Family Meeting Notes structured routing | PRD-13 | PRD-16 (Build P) | ✅ Wired | 2026-04-15 — Meeting summaries auto-save to `journal_entries` with `entry_type='meeting_notes'` on Save & Close |
| Partner Profile aggregation in Archives | PRD-13 | PRD-19 | ⏳ Unwired (MVP) | Phase 20 (PRD-19) |
| Shared Lists aggregation in Archives | PRD-13 | — | ⏳ Unwired (MVP) | Share with Archive UI |
| Journal entries aggregation in Archives | PRD-13 | PRD-08 | ⏳ Unwired (MVP) | Verify PRD-08 tables, wire display |
| My Circle folder type — non-family contacts | PRD-13 | — | 📌 Post-MVP | People & Relationships PRD |
| Monthly victory auto-archive | PRD-13 | PRD-11 | 📌 Post-MVP | PRD-11 enhancement |
| Seasonal Family Overview prompts | PRD-13 | PRD-18 | 📌 Post-MVP | Rhythm PRD |
| Archive full-text search | PRD-13 | — | 📌 Post-MVP | — |
| Dad edit access in Archives | PRD-13 | — | 📌 Post-MVP | Read-only at MVP |
| Context staleness indicators | PRD-13 | — | 📌 Post-MVP | — |
| Haiku overview card generation (AI call) | PRD-13 | — | 📌 Post-MVP | Card renders, generation call is stub |
| Context presets / smart modes | PRD-13 | PRD-05C | 📌 Post-MVP | PRD-05C enhancement |
| "Open in Notepad" from Context Export | PRD-13 | PRD-08 | 📌 Post-MVP | Notepad bridge not wired |
| Usage count display in Archives UI | PRD-13 | — | 📌 Post-MVP | DB columns wired, no analytics surface |

---

## Communication Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Push notification delivery | PRD-15 | — | 📌 Post-MVP | — |
| Content Corner link preview | PRD-15 | — | 📌 Post-MVP | — |
| Out of Nest SMS notifications | PRD-15 | — | 📌 Post-MVP | — |
| Out of Nest compose picker | PRD-15 | PRD-15 Phase E | ⏳ Unwired (MVP) | `useMessagingPermissions` only reads `family_members`. Extension point: fetch from `out_of_nest_members` table too and merge results. Per Tenise (2026-04-06), Out of Nest ranks **higher** than Special Adults in picker priority. See TODO comment in `src/hooks/useMessagingPermissions.ts`. |
| Morning digest/Daily Briefing | PRD-15 | — | 📌 Post-MVP | — |
| Meeting gamification connection (attendance streaks, facilitator badges) | PRD-16 | PRD-24 | ⏳ Unwired (MVP) | Schema supports facilitator_member_id; gamification pipeline not connected |
| Guided "Things to Talk About" capture widget | PRD-16 (Build P) | PRD-16 Phase 5 (Build P) | ✅ Wired | 2026-04-15 — `GuidedThingsToTalkAboutSection` on Guided Dashboard, creates `meeting_agenda_items` with `suggested_by_guided=true`, child can see/remove their own items |
| Meeting voice input/recording (Record After) | PRD-16 (Build P) | — | 📌 Post-MVP | Premium tier, voice recording for meetings |
| Meeting transcription + Review & Route from voice | PRD-16 (Build P) | — | 📌 Post-MVP | Requires voice recording pipeline |
| Goals routing destination from meeting action items | PRD-16 (Build P) | PRD-29 (BigPlans) | ⏳ Unwired (MVP) | Goals disabled in compact routing strip until BigPlans built |
| LiLa section suggestions for custom templates | PRD-16 (Build P) | — | ⏳ Unwired (MVP) | Full Magic tier; simple text generation at launch |
| Family council voting system | PRD-16 (Build P) | — | 📌 Post-MVP | — |
| "Refer back to decisions" cross-conversation intelligence | PRD-16 (Build P) | — | 📌 Post-MVP | — |
| Meeting templates in AI Vault for community sharing | PRD-16 (Build P) | — | 📌 Post-MVP | — |
| Queue Modal future tabs | PRD-14B | PRD-15 (Requests), PRD-17 (Sort) | ✅ Wired | Phase 18 |
| MindSweep email forwarding | PRD-08 | PRD-17B | 🔗 Partially Wired | Edge Function code-complete; blocked on DNS / email forwarding provider configuration. WIRING_STATUS.md and the function header both already call it a stub; registry's "Wired" claim was premature. |
| MindSweep approval learning | PRD-17B | PRD-17B | ✅ Wired | Phase 18 |
| Weekly MindSweep intelligence report | PRD-17B | — | 📌 Post-MVP | — |

## Daily Life Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Studio rhythm template library | PRD-18 | — | 📌 Post-MVP | — |
| Reflection export as document | PRD-18 | — | 📌 Post-MVP | — |
| PRD-18 Phase A: `evening_tomorrow_capture` placeholder | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (rotating prompts + fuzzy match + overflow) |
| PRD-18 Phase A: `morning_priorities_recall` placeholder | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (reads previous evening metadata.priority_items) |
| PRD-18 Phase A: `on_the_horizon` placeholder | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (7-day lookahead + Task Breaker modal) |
| PRD-18 Phase A: `periodic_cards_slot` returning null | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (Weekly/Monthly/Quarterly cards inline) |
| PRD-18 Phase A: `carry_forward` per-task triage section | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (replaced with fallback behavior + pg_cron Edge Function) |
| PRD-18 Phase A: `routine_checklist` placeholder | PRD-18 Phase A | PRD-18 Phase B (Build K) | 🚫 Removed | 2026-04-07 (cut from Guided morning seed — duplicate of dashboard Active Tasks) |
| PRD-18 Phase A: `task_preview` in adult/Guided morning | PRD-18 Phase A | PRD-18 Phase B (Build K) | 🚫 Removed | 2026-04-07 (cut from morning seed — duplicate of dashboard Active Tasks; component stays in registry) |
| PRD-18 Phase A: `encouraging_message` placeholder | PRD-18 Phase A | PRD-18 Phase B (Build K) | ✅ Wired | 2026-04-07 (`GuidedEncouragingMessageSection` — 20 messages, PRNG rotation, Reading Support) |
| PRD-18 Phase B: `mindsweep_lite` placeholder | PRD-18 Phase B (Build K) | PRD-18 Phase C (Build L) | ✅ Wired | 2026-04-07 (reuses `mindsweep-sort` Edge Function + batched commit on Close My Day + release disposition override) |
| PRD-18 Phase B: `morning_insight` placeholder | PRD-18 Phase B (Build K) | PRD-18 Phase C (Build L) | ✅ Wired | 2026-04-07 (20 adult questions + `generate-query-embedding` + `match_book_extractions` RPC + empty BookShelf nudge) |
| PRD-18 Phase B: `feature_discovery` placeholder | PRD-18 Phase B (Build K) | PRD-18 Phase C (Build L) | ✅ Wired | 2026-04-07 (12-candidate pool + 14-day engagement filter + 3-days/week PRNG gate + permanent dismissals) |
| PRD-18 Phase B: `rhythm_tracker_prompts` auto-hide | PRD-18 Phase B (Build K) | PRD-18 Phase C (Build L) | ✅ Wired | 2026-04-07 (`dashboard_widgets.config.rhythm_keys` multi-select in WidgetConfiguration + link-only section renderer) |
| PRD-18 Phase C: MindSweep-Lite `delegate` disposition → real `family_request` | PRD-18 Phase C (Build L) | PRD-18 Phase C follow-up (Build L.1) | ✅ Wired | 2026-04-07 (passes real `family_member_names` to `mindsweep-sort`, promotes cross-member `suggest_route` results to `family_request` disposition, inserts into PRD-15 `family_requests` with `source='mindsweep_auto'` via `commitMindSweepLite`) |
| PRD-18 Phase B: `before_close_the_day` auto-hide | PRD-18 Phase B (Build K) | PRD-18 Phase C | ⏳ Unwired (MVP) | Phase C (cross-feature pending aggregation) |
| PRD-18 Phase B: `completed_meetings` auto-hide | PRD-18 Phase B (Build K) | PRD-16 Phase E (Build P) | ✅ Wired | 2026-04-15 — `CompletedMeetingsSection` queries last 7 days of completed meetings, auto-hides when empty |
| PRD-18 Phase B: `milestone_celebrations` auto-hide | PRD-18 Phase B (Build K) | PRD-24 (Gamification) | ⏳ Unwired (MVP) | Wire when Gamification ships |
| PRD-18 Phase B: Weekly/Monthly Review deep dive button | PRD-18 Phase B (Build K) | PRD-16 (Build P) | ⏳ Unwired (MVP) | Meetings built but deep-dive meeting type requires separate wiring — weekly/monthly reviews are Rhythms (PRD-18), not Meetings. Button remains stub. |
| PRD-18 Phase B: Quarterly Inventory Stale Areas / LifeLantern launch | PRD-18 Phase B (Build K) | PRD-12A (LifeLantern) | ⏳ Unwired (MVP) | "LifeLantern coming soon" stub |
| PRD-18 Phase B: On the Horizon "Schedule time for this?" calendar block creation | PRD-18 Phase B (Build K) | PRD-18 polish | ⏳ Unwired (MVP) | Component shows [Break into steps] + [Open task]; calendar block deferred |
| PRD-18 Phase D: Independent Teen tailored rhythm experience | PRD-18 Phase B (Build K) | PRD-18 Phase D (Build N) | ✅ Wired 2026-04-07 | Teen morning (7 sections) + evening (8 sections, section_order_locked) with "Morning Check-in"/"Evening Check-in" display names, reflection_guideline_count=2, MindSweepLiteTeenSection with 4-option dropdown (Schedule/Journal about it/Talk to someone/Let it go), 15 teen morning insight questions, 3 teen feature discovery entries, talk_to_someone disposition writing private journal reminders (NEVER family_requests). Migration 100114 seeded teen content and forked auto_provision_member_resources. |
| Custom report templates (mom-authored) | PRD-19 | PRD-28B | ⏳ Unwired (MVP) | Depends on PRD-28B compliance infrastructure (see entry 517 — 6 tables not yet built). Previous ✅ Wired claim was premature. |
| State-specific compliance formatting | PRD-19 | PRD-28B | ⏳ Unwired (MVP) | Depends on PRD-28B compliance infrastructure (see entry 517 — 6 tables not yet built). Previous ✅ Wired claim was premature. |
| Teen "Tell LiLa About Yourself" | PRD-19 | — | 📌 Post-MVP | — |
| Safe Harbor → Library RAG | PRD-20 | — | 📌 Post-MVP | — |
| Safe Harbor offline support | PRD-20 | PRD-33 | ⏳ Unwired (MVP) | Phase 40 |
| ThoughtSift name → External Tool Suite | PRD-20 | PRD-34 | ✅ Wired | Phase 35 |

## AI Vault Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| AI Vault sidebar navigation | PRD-04 | PRD-21A | ✅ Wired | Phase 25 (2026-03-25) |
| AI Toolbox browsing/assignment | PRD-19 | PRD-21A | ✅ Wired | Phase 25 (2026-03-25) |
| Library Vault tutorial links from LiLa Assist | PRD-05 | PRD-21A | ✅ Wired | Phase 25 (2026-03-25) |
| Optimize with LiLa (full flow) | PRD-21A | PRD-05C | ⏳ Unwired (MVP) | Phase 23 |
| Deploy with LiLa (skill deployment) | PRD-21A | — | 📌 Post-MVP | — |
| Embedded tool iframe delivery | PRD-21A | PRD-21A | ✅ Wired | Delivered Phase 25 AIVault wiring (commit 2026-04-07). `AIToolDetail.tsx` has full `delivery_method === 'embedded'` branch rendering sandboxed iframe. |
| Native AI tool LiLa modal launch | PRD-21A | PRD-05 | ✅ Wired | Delivered Phase 25 AIVault wiring (commit 2026-04-07, "Vault native tools launch into correct modal (Translator, BoD + all others)"). `openTool(guided_mode_key)` + `ToolLauncherProvider` dispatch across 9 files. |
| Vault recommended dashboard widget | PRD-21A | PRD-10 | ⏳ Unwired (MVP) | PRD-10 Phase B |
| LiLa proactive Vault suggestions | PRD-21A | — | 📌 Post-MVP | — |
| Seasonal tag auto-surfacing (date logic) | PRD-21A | — | ⏳ Unwired (MVP) | Phase 25 enhancement |
| Section C: Recommended for You | PRD-21A | — | ⏳ Unwired (MVP) | Phase 25 enhancement |
| Session report re-import via Review & Route | PRD-21A | PRD-08 + PRD-28 | ⏳ Unwired (MVP) | Phase 32 |
| PRD-21B Admin content management UI | PRD-21A | PRD-21B | ⏳ Unwired (MVP) | Phase 25B |
| PRD-21C Engagement (hearts, comments, discussions) | PRD-21A | PRD-21C | ⏳ Unwired (MVP) | Phase 26 |
| Learning paths (multi-item sequences) | PRD-21A | — | 📌 Post-MVP | — |
| Creator economy / user-submitted tools | PRD-21A | — | 📌 Post-MVP (Phase 4) | — |
| UpgradeModal (tier gating prompt) | PRD-21A | — | ❌ Deleted during /simplify — rebuild when tier gating activates post-beta | /simplify Phase 1 |
| Content versioning | PRD-21B | — | 📌 Post-MVP | — |
| Scheduled publishing | PRD-21B | — | 📌 Post-MVP | — |
| Collaborative filtering recommendations | PRD-21C | — | 📌 Post-MVP | — |
| Semantic/vector search for Vault | PRD-21C | — | 📌 Post-MVP | — |
| Out of Nest → sibling messaging | PRD-22 | — | 📌 Post-MVP | — |
| Book social sharing | PRD-23 | — | 📌 Post-MVP | — |
| BookShelf → Send to Widgets (tracker data point) | PRD-23 | PRD-10 | ⏳ Unwired (MVP) | ApplyThisSheet shows "Tracker" button which opens TaskCreationModal with habit taskType — but direct widget data-point routing is not built |
| BookShelf → Send to BigPlans (project goal) | PRD-23 | PRD-29 | ⏳ Unwired (MVP) | ApplyThisSheet shows BigPlans as "Coming Soon" — wires when PRD-29 builds |
| BookShelf → Send to Messages (full message send) | PRD-23 | PRD-15 | ⏳ Unwired (MVP) | Routes to studio_queue with destination='message'; actual message delivery pending PRD-15 |
| Drop old per-family BookShelf tables (Phase 1c) | PRD-23 Phase 1b | PRD-23 Phase 1c | ⏳ Unwired (MVP) | 30-day soak after 1b-F, then drop bookshelf_summaries/insights/declarations/action_steps/questions + old RPCs |
| bookshelf_chapters migration to platform | PRD-23 | — | 📌 Post-MVP | — |
| Cross-family book recommendations | PRD-23 | — | 📌 Post-MVP | — |

## Gamification Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Family Challenges (PRD-24C) | PRD-24A | — | 📌 Post-MVP | — |
| Boss Quests game mode | PRD-24A | — | 📌 Post-MVP | — |
| Bingo Cards game mode | PRD-24A | — | 📌 Post-MVP | — |
| Evolution Creatures game mode | PRD-24A | — | 📌 Post-MVP | — |
| Passport Books game mode | PRD-24A | — | 📌 Post-MVP | — |
| Task unmark cascade (points/streak/creature/page reversal) | PRD-24 Sub-phase C | — | ⏳ Unwired (MVP) | Future UNDO pipeline build |
| Drag-to-reposition creatures on sticker pages | PRD-24 Sub-phase D | — | ⏳ Unwired (MVP) | Schema supports it; UI deferred |
| Sticker book page curation UI | PRD-24 Sub-phase D | — | 📌 Post-MVP | Pages unlock in order; custom curation deferred |
| Currency customization UI | PRD-24 | — | 📌 Post-MVP | Columns exist on gamification_configs; no settings UI |
| Randomizer mastery → gamification pipeline | PRD-24 Sub-phase C | — | ⏳ Unwired (MVP) | Known gap: randomizer mastery approvals don't fire RPC (no task_completions row). Sequential mastery works. |
| DailyCelebration Step 3/4 gamification wiring | PRD-26 Sub-phase B | — | ⏳ Unwired (MVP) | Auto-skipped in DailyCelebration overlay |
| Play Dashboard mom message widget | PRD-26 Sub-phase B | — | ⏳ Unwired (MVP) | `PlayMomMessageStub` renders PlannedExpansionCard. PRD-15 dependency. |
| Play Dashboard reveal tiles | PRD-26 Sub-phase B | — | 📌 Post-MVP | `PlayRevealTileStub` renders PlannedExpansionCard |

## Build M — Configurable Earning Strategies Stubs (PRD-24/PRD-26 Expansion)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Task segments | Build M Phase 1 | Build M Phase 2 | ✅ Wired | 2026-04-11 — `task_segments` table + CRUD hooks + PlayTaskTileGrid grouped rendering |
| 4 creature earning modes (segment_complete, every_n, complete_the_day, random_per_task) | Build M Phase 1 | Phase 3 Connector | ✅ Wired | 2026-05-03 — `creature_godmother` replaces old `roll_creature_for_completion` RPC. Earning modes configurable via contracts. |
| 3 page earning modes (tracker_goal, every_n_creatures, every_n_completions) | Build M Phase 1 | Phase 3 Connector | ✅ Wired | 2026-05-03 — `page_unlock_godmother` replaces old RPC page unlock. Modes configurable via contracts. |
| Coloring reveal library (32 subjects) | Build M Phase 1 | Build M Phase 3 | ✅ Wired | 2026-04-11 — `coloring_reveal_library` seeded, `ColorRevealCanvas` renders progressive zone reveals |
| Task-linked coloring reveals (polymorphic earning_source) | Build M Phase 4 | Phase 3 Connector | ✅ Wired | 2026-05-03 — `earning_task_id` replaced with `earning_source_type` + `earning_source_id` (polymorphic). Any deed source can advance coloring reveals via `presentation_mode='coloring_advance'`. |
| Cross-shell segment rendering | Build M Phase 2 | Build M Phase 5 | ✅ Wired | 2026-04-11 — `SegmentHeader` for Guided/Independent/Adult + `PlayTaskTileGrid` for Play |
| Gamification settings modal (6 sections) | Build M Phase 4 | Build M Phase 4 | ✅ Wired | 2026-04-11 — Full config: segments, earning modes, coloring reveals, toggles, reset |
| Mystery tap tile + show upfront tile | Build M Phase 6 | Build M Phase 6 | ✅ Wired | 2026-04-11 — `MysteryTapTile` card-flip + per-segment `randomizer_reveal_style` |
| Redraw button (adult-only, math gate) | Build M Phase 6 | Build M Phase 6 | ✅ Wired | 2026-04-11 — `RedrawButton` updates draw in-place, requires math gate for adults |
| First-time setup wizard (guided onboarding flow) | Build M Phase 4 | — | 📌 Post-MVP | Settings modal serves as both first-time and ongoing config |
| Tracker Goal page earning (widget data point consumption) | Build M Phase 1 | — | ⏳ Unwired (MVP) | MISLEADING UI: GamificationSettingsModal exposes Tracker Goal page earning mode option, but the widget data-point trigger is not wired. Schema + RPC branch exist. Widget picker wired. Data point trigger not connected. |
| Sunday List faith-themed sticker theme override | Build M Phase 1 | — | 📌 Post-MVP | `theme_override_id` on `task_segments`. No faith theme created. |
| Streak milestone earning mode | Feature decision file §7 | — | 📌 Post-MVP | Earning mode enum extensible |
| Timer goal earning mode | Feature decision file §7 | — | 📌 Post-MVP | Time-interval page unlock earning mode (e.g., new page unlocks every day or every N days). Distinct from Build M's `tracker_goal` mode (which is threshold-on-widget). Not built. |
| Approval-based manual earning mode | Feature decision file §7 | — | 📌 Post-MVP | Not built |

## Platform Complete Stubs

> **PRD-28B absence note:** `report_templates` + 5 companion tables not yet built; all ✅ Wired rows claiming per-template features are pending that build. See entry 517 in Studio Intelligence Stubs for the 6-table compliance dependency.

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Caregiver push notifications | PRD-27 | — | 📌 Post-MVP | — |
| Homeschool budget/cost tracking | PRD-28 | — | 📌 Post-MVP | — |
| Advanced financial reports | PRD-28 | — | 📌 Post-MVP | — |
| IEP Progress Report template | PRD-28B | — | 📌 Post-MVP | — |
| Therapy Summary template | PRD-28B | — | 📌 Post-MVP | — |
| IEP/document understanding | PRD-28B | — | 📌 Post-MVP | — |
| ESA vendor integration | PRD-28B | — | 📌 Post-MVP | — |
| System design trial expiration UI | PRD-29 | — | 📌 Post-MVP | — |
| Safety journal/message scanning | PRD-30 | — | 📌 Post-MVP | — |
| Community persona moderation queue | PRD-34 | PRD-32 | 🔗 Partially Wired | Backend only: `content_policy_status` column + writer (Edge Function sets `pending_review` for community submissions) + consumer filter (`.eq('approved')`) all exist. No admin UI page, no approve/block RPC — queue fills but has no drain surface. Admin Console itself is a PlannedExpansionCard roadmap item. |
| Community lens moderation queue | PRD-34 | PRD-32 | 🔗 Partially Wired | Backend only: same shape as the persona queue. Admin Console is a PlannedExpansionCard roadmap item (`feature_expansion_registry.ts:278-282`), so neither persona nor lens moderation has a live surface. |
| Board session export | PRD-34 | — | 📌 Post-MVP | — |
| Translator non-English language support | PRD-34 | — | 📌 Post-MVP | — |
| Standards linkage on portfolio | PRD-37 | PRD-28B | ⏳ Unwired (MVP) | Depends on PRD-28B compliance infrastructure (see entry 517 — 6 tables not yet built). Previous ✅ Wired claim was premature. |
| Portfolio export | PRD-37 | PRD-28B | ⏳ Unwired (MVP) | Depends on PRD-28B compliance infrastructure (see entry 517 — 6 tables not yet built). Previous ✅ Wired claim was premature. |
| Family Newsletter report template | PRD-37 | PRD-28B | ⏳ Unwired (MVP) | Depends on PRD-28B compliance infrastructure (see entry 517 — 6 tables not yet built). Previous ✅ Wired claim was premature. |
| Image auto-tagging | PRD-37 | — | 📌 Post-MVP | — |

## Scale & Monetize Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Blog comment threading | PRD-38 | — | 📌 Post-MVP | — |
| Blog search | PRD-38 | — | 📌 Post-MVP | — |
| Blog RSS feed | PRD-38 | — | 📌 Post-MVP | — |
| Blog email newsletter | PRD-38 | — | 📌 Post-MVP | — |
| Pinterest auto-pin | PRD-38 | — | 📌 Post-MVP | — |
| Per-family AI cost drill-down | PRD-32 | — | 📌 Post-MVP | — |
| Admin activity log | PRD-32 | — | 📌 Post-MVP | — |
| External calendar sync | PRD-14B | — | 📌 Post-MVP | — |
| Google Calendar integration | PRD-14B | — | 📌 Post-MVP | — |

## Family Overview Stubs (PRD-14C)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Calendar week/month toggle on Family Overview | PRD-14C | — | 📌 Post-MVP | UX polish pass |
| Column drag-to-reorder (dnd-kit on headers) | PRD-14C | — | 📌 Post-MVP | UX polish pass |
| Section per-column override (long-press gesture) | PRD-14C | — | 📌 Post-MVP | UX polish pass |
| Section drag-to-reorder (dnd-kit on section headers) | PRD-14C | — | 📌 Post-MVP | UX polish pass |

## Guided Dashboard Stubs (PRD-25)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Celebrate section | PRD-25 (Phase A) | PRD-11 (Victory Recorder) | ✅ Wired | `CelebrateSection.tsx` is a functional 60-line component rendering a gold Celebrate! button wired to launch the DailyCelebration overlay. Imported and rendered at `GuidedDashboard.tsx:21,165`. CLAUDE.md Convention #179 documents as live. Reverse-direction Looks-Fine-Failure same as Finding C Entry 323. |
| DailyCelebration Reflections Step 2.5 | PRD-25 (Phase C) | PRD-11 | ⏳ Unwired (MVP) | Code comment insertion point |
| Victories page (Guided) | PRD-25 (Phase C) | PRD-11 | ✅ Wired | GuidedVictories.tsx is a functional page consuming real `useVictories` hooks (spot-verified 2026-04-19). Registry "warm stub" wording was stale — the page has been live in the Guided shell. |
| Progress page (Guided) | PRD-25 (Phase C) | PRD-24 (Gamification) | ⏳ Unwired (MVP) | GuidedProgress.tsx warm stub |
| Gamification header indicators | PRD-25 (Phase A) | PRD-24 | ⏳ Unwired (MVP) | Display from family_members columns |
| Task point values | PRD-25 (Phase A) | PRD-24 | ⏳ Unwired (MVP) | Read from tasks table |
| Messages tab in Write drawer | PRD-25 (Phase B) | PRD-15 (Messages) | ⏳ Unwired (MVP) | "Coming soon" placeholder |
| Unread message badge on Write button | PRD-25 (Phase C) | PRD-15 | ⏳ Unwired (MVP) | Hardcoded 0 |
| Before-send coaching in Messages tab | PRD-25 | PRD-15 | 📌 Post-MVP | LiLa reviews message tone |
| LiLa Homework Help modal | PRD-25 (Phase C) | PRD-05 (guided modes) | ⏳ Unwired (MVP) | "Coming soon" modal |
| LiLa Communication Coach modal | PRD-25 (Phase C) | PRD-05 + PRD-21 | ⏳ Unwired (MVP) | "Coming soon" modal |
| Visual World theme skinning | PRD-25 | PRD-24A (Visual Worlds) | 📌 Post-MVP | Dashboard themed by active Visual World |
| Gamification widgets in grid | PRD-25 | PRD-24 + PRD-10 | 📌 Post-MVP | Gamification widget types for Guided grid |
| Graduation celebration + tutorial | PRD-25 (Phase C) | Post-MVP | 📌 Post-MVP | Data flag only (graduation_tutorial_completed) |
| Advanced NBT (energy, Best Intentions, family context) | PRD-25 | Post-MVP | 📌 Post-MVP | Enhancement to NBT priority engine |
| "Ask Mom" from NBT | PRD-25 | PRD-15 | 📌 Post-MVP | Quick-request when child disagrees with all suggestions |

---

## Infrastructure Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Universal Scheduler UI component | PRD-35 | PRD-35 | ✅ Wired | Phase 05 |
| Completion-dependent scheduling | PRD-35 | PRD-35 | ✅ Wired | Phase 05 |
| Custody patterns | PRD-35 | PRD-27 | ✅ Wired | Phase 31 |
| Family holiday calendar auto-exclusion | PRD-35 | — | 📌 Post-MVP | — |
| ICS export from RRULE strings | PRD-35 | — | 📌 Post-MVP | — |
| LiLa schedule extraction cards | PRD-35 | PRD-08 | ⏳ Unwired (MVP) | Phase 09 |
| LiLa conversational schedule builder | PRD-35 | PRD-05 | ⏳ Unwired (MVP) | Phase 06 |
| Pick Dates painted-calendar mode | Worker 5 | Worker 5 | ✅ Wired | Worker 5 |
| deed_firings table (connector event log) | Worker 5 | Worker 5 | ✅ Wired | Worker 5 |
| Painted-day deed firing (cron + Edge Function) | Worker 5 | Worker 5 | ✅ Wired | Worker 5 |
| lists.schedule_config attachment | Worker 5 | Worker 5 | ✅ Wired | Worker 5 |
| "Active today" badge on list cards | Worker 5 | Worker 5 | ✅ Wired | Worker 5 |
| Per-date assignee editor | Worker 5 | Worker 5 | ✅ Wired | Worker 5 |
| Contract evaluation of deed firings | Worker 5 | Phase 3 | ⏳ Unwired (MVP) | Phase 3 |
| List visibility gating by schedule | Worker 5 | Phase 3 | ⏳ Unwired (MVP) | Phase 3 |
| Convert-to-recurrence pattern detection | Worker 5 | — | 📌 Post-MVP | — |
| Universal Timer UI (all 4 modes) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| Floating timer bubble (all 5 shells) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| 5 visual timer styles (SVG/CSS) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| Timer session history + editing | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| Play mode age gate + visual timer | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| Timer config panel (per-member) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| All configured color themes | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| Theme-adaptive Tooltip | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| 11 shared components (Button, Card, etc.) | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| SparkleOverlay (Play victories) | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| Shell token overrides (touch/font/spacing) | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| Theme persistence to Supabase | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| Shell-aware BottomNav | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| QuickTasks strip | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| PerspectiveSwitcher (dashboard) | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| Play shell Celebrate button | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| Guided shell personalized header | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| Notepad in Adult/Independent shells | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| Settings removed from Sidebar | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| Guided lightweight notepad | PRD-04 | PRD-04 Repair | ✅ Wired | PRD-04 Repair 2026-03-25 |
| Settings overlay (full UI) | PRD-04 Repair | PRD-22 | ⏳ Unwired (MVP) | Phase 27 |
| Hub widget content (real widgets) | PRD-04 Repair | PRD-10/PRD-14D | ⏳ Unwired (MVP) | Phase 11/15 |
| PWA entry points | PRD-04 | PRD-33 | 📌 Post-MVP | — |
| Timer idle reminders | PRD-36 | PRD-15 | ⏳ Unwired (MVP) | Phase 16 |
| Timer → homeschool time logs | PRD-36 | PRD-28 | ⏳ Unwired (MVP) | Phase 32 |
| Timer → task completion threshold | PRD-36 | PRD-09A | ✅ Wired | Phase 10 |
| Timer → widget data points | PRD-36 | PRD-10 | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Visual World themed timer animations | PRD-36 | PRD-24A | 📌 Post-MVP | — |

## Studio & Lists Stubs (Phase 10 — PRD-09B)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Studio Browse tab (template cards) | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio My Customized tab | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio [Customize] → Task types | PRD-09B | PRD-09A | ✅ Wired | Phase 10 |
| Studio [Customize] → List types | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio [Customize] → Guided Forms | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio [Customize] → Trackers/Widgets | PRD-09B | PRD-10 | ✅ Wired | PRD-10 Phase A |
| Studio seed templates | PRD-09B | PRD-09B | 🔗 Partially Wired | Task templates fully deploy. List templates now hydrate default_items on deploy (Worker 4, 2026-05-01). Tailored wizard flows pending — feeds Universal Setup Wizards workstream. |
| Lists full CRUD (9 types) | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Lists Randomizer draw view | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Lists promote-to-task | PRD-09B | PRD-09A | ✅ Wired | Phase 10 |
| Guided Form assign modal | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Guided Form child fill view | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Guided Form mom review view | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Guided Form LiLa help button | PRD-09B | PRD-05 | ⏳ Unwired (MVP) | Phase 06 |
| System list auto-provision (Backburner, Ideas) | PRD-09B | PRD-09B | ✅ Wired | Delivered via `auto_provision_member_resources` trigger in migration 00000000100101 (list_provision fix). Backfill for existing members included in same migration. Trigger body preserved verbatim in all 8 subsequent revisions (100103–100115). Founder verified 2026-04-19 that Backburner and Ideas lists appear for her family members. Caveat: routing INTO these lists from other features is tracked separately in WIRING_STATUS.md and remains untested as of walk-through date. |
| ListPicker overlay (Notepad → Lists) | PRD-09B | — | ⏳ Unwired (MVP) | Routing via studio_queue works; no separate ListPicker overlay component exists — may not be needed. |
| List drag-to-rearrange (@dnd-kit) | PRD-09B | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Save list as template to Studio | PRD-09B | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| List item promotion badge | PRD-09B | Phase 10 Repair | ✅ Wired | Phase 10 Repair |

## Widget & Tracker Stubs (PRD-10 Phase A)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Dashboard grid + all configured tracker types | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
| Widget Picker modal | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
| Widget Configuration modal | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
| Widget Detail View modal | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
| Widget folders (create/view) | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
| Widget starter configs | PRD-10 | PRD-10 Phase A | 🔗 Partially Wired | Widget starter config cards render; deploy flow either no-ops or falls through to generic creator. Wizard flows pending — feeds Universal Setup Wizards workstream. |
| Phase B tracker types | PRD-10 | — | 🔗 Partially Wired | 11 of 13 Phase B tracker types wired (per PHASE_B_TRACKER_INVENTORY.md, 2026-04-20). 2 remain unbuilt: `color_reveal` and `gameboard`. MISLEADING UI: both unbuilt types appear in WidgetPicker.tsx:34 under goal_pursuit.trackerTypes, but neither has a case branch in WidgetRenderer.tsx — selecting them falls through to PlannedTrackerStub ('Coming soon'). Note: `color_reveal` here refers to the WidgetPicker tracker path, which is distinct from Build M's separately-rendered `ColorRevealTallyWidget` — same name, different code paths. Remediation options (picker removal vs. code-path bridge) are post-audit backlog. |
| Multiplayer layer | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Track This flow (Screen 5) | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Color-reveal tracker + image library | PRD-10 | Build M | ✅ Wired | Delivered via Build M (2026-04-11). `coloring_reveal_library` table (32 Woodland Felt subjects) + `ColorRevealCanvas` + `ColorRevealTallyWidget` rendered on 3 dashboards. PRD-10 Phase C's original `coloring_image_library` table was superseded. |
| Gameboard tracker | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase C |
| Linked pair deployment | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase C |
| Special Adult child-widget view | PRD-10 | — | 📌 Post-MVP | — |
| Decorative layer (Cozy Journal) | PRD-10 | — | 📌 Post-MVP | — |
| Widget milestone → Victory Record | PRD-10 | PRD-11 | ⏳ Unwired (MVP) | PRD-11 |
| Widget → Gamification progress | PRD-10 | PRD-24 | 🔗 Partially Wired | Infrastructure delivered via Build M (page_earning_tracker_widget_id + threshold columns on member_sticker_book_state, CLAUDE.md Convention #210). Downstream widget-data-point consumer trigger remains unwired — see stub 266. |
| Allowance Calculator → payment | PRD-10 | PRD-28 | ⏳ Unwired (MVP) | PRD-28 |

## Tasks Repair Stubs (Phase 10 Repair — PRD-09A, PRD-17)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Task creation modal redesign (compact 2-col) | Phase 10 Repair | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| View sync logic (computeViewSync) | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Task view drag-to-reorder (@dnd-kit) | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Sequential collection creation (end-to-end) | PRD-09A | PRD-09A/09B Studio Intelligence Phase 1 | ✅ Wired | 2026-04-06. Prior "Phase 10 Repair" entry claimed this was wired but `SequentialCreator.tsx` + `SequentialCollectionView.tsx` had zero callers — every entry point opened `TaskCreationModal` which silently created malformed single-row tasks. Phase 1 wired `SequentialCreatorModal` (new wrapper around existing `SequentialCreator`) to `useCreateSequentialCollection`, revived `SequentialCollectionView` on the Tasks tab, added guards on `createTaskFromData` and `TaskCreationModal` to prevent regression, and exposed the flow from Studio, Tasks, and Lists. E2E tests in `tests/e2e/features/studio-intelligence-phase1.spec.ts`. |
| Sequential reuse/redeploy flow | PRD-09A | PRD-09A/09B Studio Intelligence Phase 1 | ✅ Wired | `useRedeploySequentialCollection` hook + SequentialCollectionView restart-for-another-student UI — live as of 2026-04-06 when the view was revived from dead code. |
| Routine step progress indicator | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Approval-required parent UI | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Completion photo evidence | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Unmark cascade behavior | PRD-09A | Phase 10 Repair | ⏳ Unwired (MVP) | Aligned with line 243 and Convention #206 — unmark cascade explicitly unimplemented. Previously 'Partial' status was inconsistent with lines 243/448. |
| Batch Process All progress bar | PRD-17 | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Role-scoped queue visibility | PRD-17 | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Breathing glow vs badge toggle | PRD-17 | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| HScrollArrows on ViewCarousel | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Emoji removed from task views | Phase 10 Repair | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| External attribution removed | Phase 10 Repair | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| AI Auto-Sort for views | PRD-09A | — | ⏳ Unwired (MVP) | Needs ai-parse Edge Function |
| Special Adult shift-scoped task access | PRD-09A | — | ⏳ Unwired (MVP) | Needs access_schedules wiring |
| Notification auto-dismiss on queue processing | PRD-17 | — | ⏳ Unwired (MVP) | Needs notification system |
| Gamification reward/streak reversal on unmark | PRD-09A/PRD-24 | — | ⏳ Unwired (MVP) | Needs PRD-24 |

## Daily Progress Marking Stubs (PRD-09A Addendum — 2026-04-28)

| Stub | Created By | Wired By | Status | Notes |
|------|-----------|----------|--------|-------|
| Inactivity-based auto-unclaim | PRD-09A Addendum §4.4 | — | ⏳ Unwired (MVP) | Schema tracks last session date via practice_log. No UI for mom-configurable timeout. `in_progress_member_id` cleared on completion; future: clear after N days of inactivity. |
| Cross-task time aggregation reports | PRD-09A Addendum §1.4 | — | 📌 Unwired (Post-MVP) | Per-task aggregation is wired. Cross-task/cross-kid analytics deferred to PRD-28B compliance reporting. |
| Path H — LiLa-suggested task track toggles | PRD-09A Addendum §6.3 | — | ⏳ Unwired (MVP) | LiLa task-suggestion acceptance surface should expose track property toggles. Existing default behavior preserved (false/false). |
| Path I — Plan/goal decomposition track toggles | PRD-09A Addendum §6.3 | — | ⏳ Unwired (MVP) | BigPlans, LifeLantern, Guiding Stars, Best Intentions task generation surfaces should expose track toggles. |
| Path J — Other capture surface track toggles | PRD-09A Addendum §6.3 | — | ⏳ Unwired (MVP) | Voice-parse, cookbook-scan, AI Vault tools. Default false/false preserved. |
| Path K — RoutineDuplicateDialog track inheritance | PRD-09A Addendum §6.6 | — | ⏳ Unwired (MVP) | Routine deploy copy should inherit track_progress from source task. Unlisted path found during pre-build. |
| Path L — RandomizerSpinnerTracker track inheritance | PRD-09A Addendum §6.6 | — | ⏳ Unwired (MVP) | Randomizer widget draw → task should inherit from list item. Unlisted path found during pre-build. |
| Session history detail view | PRD-09A Addendum §3.4 | — | ⏳ Unwired (MVP) | `useTaskPracticeSessions` hook exists. Aggregation subtitle is tappable (state wired). Expansion/modal rendering the per-session list (date + duration + who) not yet built. |

## ThoughtSift Stubs (PRD-34)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| ThoughtSift guided modes (5) | PRD-05 | PRD-34 | ✅ Wired | Phase 35 (34A) |
| `relationship_mediation` guided mode | PRD-19 | PRD-34 (mediator) | ✅ Wired | Phase 35 (34B) |
| Board of Directors persona library | Platform Intelligence Channel D | PRD-34 | ✅ Wired | Phase 35 (34A) |
| Full persona library browse page (categories/filtering) | PRD-34 | — | 📌 Post-MVP | — |
| LiLa proactive ThoughtSift tool suggestion | PRD-34 | — | 📌 Post-MVP | — |
| Custom lens creation UI (describe → LiLa caches) | PRD-34 | — | 📌 Post-MVP | — |
| Custom lens sharing to community library | PRD-34 | — | 📌 Post-MVP | — |
| Decision Guide: user-created custom frameworks | PRD-34 | — | 📌 Post-MVP | — |
| Guided-shell simplified ThoughtSift versions | PRD-34 | — | 📌 Post-MVP | — |
| BookShelf enrichment for BoD personas | PRD-34 | PRD-23 | ⏳ Unwired (MVP) | Phase 28 (BookShelf) |
| Route to BigPlans action chip (Decision Guide + BoD) | PRD-34 | PRD-29 | ⏳ Unwired (MVP) | Phase 33 (BigPlans) |
| `is_available_for_mediation` per-note toggle | PRD-34 (Mediator) | PRD-19 | ⏳ Unwired (MVP) | Phase 20 (Family Context) |
| Send via Message action chip (Mediator) | PRD-34 | PRD-15 | ⏳ Unwired (MVP) | Phase 16 (Messages) |
| @Name addressing UI parsing in BoD | PRD-34 | — | 📌 Post-MVP | — |
| Suggested for This Situation in persona selector | PRD-34 | — | 📌 Post-MVP | — |
| Long-press persona preview card | PRD-34 | — | 📌 Post-MVP | — |
| LiLa follow-up question after custom persona creation ("direct or warm?") | PRD-34 | — | 📌 Post-MVP | Enhancement to custom persona flow — description field covers this for now |
| Recently Used section in persona selector | PRD-34 | — | 📌 Post-MVP | — |
| Full PRD-30 Layer 2 Haiku safety classification for ThoughtSift | PRD-34 | PRD-30 | ⏳ Unwired (MVP) | Phase 34 (Safety Monitoring) |

---

## Studio Intelligence Stubs (PRD-09A/09B Studio Intelligence Phase 1)

Created 2026-04-06. Three-session sequence. Phase 1 is the foundation; Sessions 2 and 3 build on top.

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| `SequentialCreatorModal` wrapper | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
| `SequentialCollectionCard` exported for cross-page use | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
| Sequential visible on Lists page (grid + list view) | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
| Sequential creation entry from Lists [+ New List] | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
| Randomizer in Lists [+ New List] type picker grid | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 (one-line fix in Lists.tsx:357) |
| `capability_tags` required on StudioTemplate type | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
| `capability_tags` populated on all seed templates | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
| `createTaskFromData` guard for taskType='sequential' | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
| Sequential advancement modes (practice_count, mastery) | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — migration 100105 + `usePractice.ts` hooks + SequentialCreator defaults section + SequentialCollectionView per-item progress + TaskCard submit-as-mastered button + PendingApprovalsSection mastery fork (Tasks.tsx). 7/7 E2E tests passing. |
| `practice_log` + `randomizer_draws` tables | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — migration 100105 with RLS + indexes + UNIQUE partial index on randomizer_draws for Surprise Me determinism. E2E test E verifies duplicate rejection. |
| Linked routine steps (`step_type` enum) | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | ✅ Wired | Dashboard rendering of linked routine steps landed 2026-04-13 per WIRING_STATUS.md; step_type enum + all three linked branches (sequential/randomizer/task) render in RoutineStepChecklist.tsx:214-221. |
| `curriculum-parse` Edge Function | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — dedicated Haiku-powered Edge Function (not ai-parse). CurriculumParseModal Human-in-the-Mix review wired into SequentialCreator `[Paste Curriculum]` button. Per-item advancement/URL metadata flows through to handleSave via parallel parsedItems state. |
| Reading List Studio template | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — `ex_reading_list` in studio-seed-data.ts. Studio.tsx handleCustomize tracks sequentialTemplateId and opens SequentialCreatorModal with `initialDefaults` (mastery + duration tracking + active_count=1 + manual promotion). |
| Routine duplication with linked step resolution | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J → follow-up) | ✅ Wired | 2026-04-13 — RoutineDuplicateDialog deep-copies template + sections + steps. Linked steps surface for review with "Change" button opening LinkedSourcePicker. Member pill picker for target child. Wired into Studio "My Customized" Duplicate button (routines open dialog, non-routines keep shallow copy). |
| Randomizer draw modes (focused / buffet / surprise) | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — DrawModeSelector component + Randomizer.tsx rendering forks (Focused locks after one draw, Buffet shows N/max slot count, Surprise Me shows auto-draw notice with no manual draw button). useSurpriseMeAutoDraw hook uses smart-draw weighting. |
| Sequential mastery approval in global queue | Linked Steps addendum (Build J) | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — Tasks.tsx PendingApprovalsSection detects `completion_type='mastery_submit'` on task_completions rows and forks to useApproveMasterySubmission / useRejectMasterySubmission. Evidence note + URL rendered inline. Rejection resets mastery_status to 'practicing' (not 'rejected'). |
| Randomizer mastery approval inline on Lists detail view | Linked Steps addendum (Build J) | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — RandomizerMasteryApprovalInline sub-component in Lists.tsx renders pending mastery submissions per-list above the Randomizer draw area. Sequential uses global queue; randomizer uses per-list inline section (cross-source unified queue explicitly deferred). |
| Per-item advancement override editor in SequentialCollectionView | Linked Steps addendum (Build J) | 2026-04-13 | ✅ Wired | Inline ItemAdvancementEditor in SequentialCollectionView. Settings icon per item (hover-reveal), toggles inline form: mode selector (complete/practice_count/mastery), practice target, approval toggle, evidence toggle, duration tracking. Writes directly to tasks table, invalidates collection query. |
| Evidence file upload (camera integration) for mastery submissions | Linked Steps addendum (Build J) | — | 📌 Post-MVP | Basic text note + URL capture works. Rich file/camera upload deferred. |
| Linked routine step child-dashboard rendering (expand to show current active item + inline practice actions) | Linked Steps addendum (Build J) | — | ⏳ Unwired (MVP) | Build J stubbed. Linked step DATA flows through routine persistence. TaskCard already renders advancement subtitle + resource URL for sequential tasks. Linked-step expansion (showing the source's current active item with inline practice/mastery actions) is the next incremental step. |
| "What do you want to create?" Studio search bar | PRD-09A/09B Phase 1 | Studio Intelligence Phase 2 (Session 3) | ⏳ Unwired (MVP) | Session 3 |
| Use case category browse in Studio | PRD-09A/09B Phase 1 | Studio Intelligence Phase 2 (Session 3) | ⏳ Unwired (MVP) | Session 3 |
| Enhanced Studio cards with capability tag pills | PRD-09A/09B Phase 1 | Studio Intelligence Phase 2 (Session 3) | ⏳ Unwired (MVP) | Session 3 |
| Studio "My Library" cross-table unified tab | PRD-09A/09B Phase 1 | Studio Intelligence Phase 2 (Session 3) | ⏳ Unwired (MVP) | Session 3 |
| Post-creation smart recommendation cards | PRD-09A/09B Phase 1 | Studio Intelligence Phase 2 (Session 3) | ⏳ Unwired (MVP) | Session 3 |
| LiLa `studio_create_guide` conversational mode | PRD-09A/09B Phase 1 | Studio Intelligence Phase 3 | 📌 Post-MVP | Depends on PRD-05, PRD-18, PRD-29 |
| Conversational school year planner | Linked Steps addendum | Studio Intelligence Phase 3 | 📌 Post-MVP | Depends on PRD-05, PRD-18, PRD-29 |
| Living shopping list enhancement | Concept capture 2026-04-06 | — | 📌 Post-MVP | `specs/Concept-Capture-Shopping-List-Backburner-Victory.md` |
| Backburner/Ideas activation as victory | Concept capture 2026-04-06 | — | 📌 Post-MVP | Wire when Backburner activation paths are built |
| homework-estimate AI subject allocation | PRD-28 Screen 7 | PRD-28 | ✅ Wired | Edge Function `homework-estimate` + inline invocation from `LogLearningModal.tsx:69`. When mom types a learning description, AI estimates which subject(s) to allocate the logged time to. Migration 00000000100138 seeded the `homeschool_time_review` mode_key used by this call. |
| Full `homeschool_time_review` LiLa guided-mode conversation | PRD-28 Screen 7 | PRD-05 dependency | 📌 Post-MVP | Conversational weekly time-log review with LiLa. Depends on PRD-05 day-data context enhancement. The Edge Function under this mode_key is wired for inline subject estimation (see row above) but no guided-mode conversation UI surface exists. |
| Subject Tracking section in TaskCreationModal | PRD-28 Addendum | Polish pass | ⏳ Unwired (MVP) | Per-task subject assignment checkboxes in "Rewards & Completion Tracking" section. Would enable automatic `homeschool_time_logs` creation on task completion for homework-tagged tasks. Currently mom uses Log Learning widget for manual entry. |
| PRD-28B Compliance & Progress Reporting (6 tables) | PRD-28B | Separate build | ⏳ Unwired (MVP) | `homeschool_family_config`, `homeschool_student_config`, `education_standards`, `standard_evidence`, `report_templates`, `esa_invoices`. Consumes `homeschool_time_logs` + `homeschool_subjects` from PRD-28. Needs working data first. |
| Biweekly/monthly allowance periods | PRD-28 + PRD-35 | PRD-35 integration | 📌 Post-MVP | Weekly only at MVP. PRD-35 Universal Scheduler biweekly/monthly support needed. |
| Business work export (formatted PDF/CSV) | PRD-28 | — | 📌 Post-MVP | Export timer sessions × hourly rate data for business work invoicing. |
| Dad payment delegation | PRD-28 | — | 📌 Post-MVP | Allow additional_adult to mark payments on behalf of mom. |
| Teen purchase deduction requests via PRD-15 | PRD-28 + PRD-15 | PRD-15 Messages | 📌 Post-MVP | Teen requests a purchase deduction through family_requests, mom approves/declines. |
| Allowance history trend charts | PRD-28 | — | 📌 Post-MVP | Visual charts showing completion %, earnings, and balance over time per child. |
| Goal-based pool UX (`pool_type='goal_pool'`) | Phase 3.5 | — | 📌 Post-MVP | Schema columns exist on `allowance_configs` but no frontend UX for creating or managing goal-based pools. Deferred per pre-build summary. |
| Self-managed pool UX (teen/adult ownership) | Phase 3.5 | — | 📌 Post-MVP | Schema supports `pool_owner_member_id` on `allowance_configs` but no UX for teens/adults to own and manage their own pools. Deferred per pre-build summary. |
| Cross-pool condition authoring UI (D-gap-4) | Phase 3.5 | — | ⏳ Unwired (MVP) | Mom can create cross-pool conditions via `/contracts` page directly. Dedicated inline UI in ChildAllowanceConfig deferred. Worker D2 gap. |
| Hourly work earning pathway (time x rate) | Phase 3.5 | — | 📌 Post-MVP | Separate from pool percentage math. Uses `time_sessions` + `money_godmother`. Shows in same financial ledger. Deferred until founder sets up hourly jobs for older kids. |

---

## Phase 0.25 Residue Backfill (2026-04-17)

Five pre-existing items that were in the codebase before the STUB_REGISTRY convention took hold. Backfilled here for visibility. Target phases reflect where they'll be wired. Per `RECON_DECISIONS_RESOLVED.md` residue cleanup list.

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| `lila_messages.safety_scanned` column (migration 7, line 86) | PRD-05 (migration 7) | PRD-30 | ⏳ Unwired (MVP) | PRD-30 Safety Monitoring build — column exists in schema but no logic reads or writes it. Will be wired when PRD-30 builds its safety-scan pipeline. |
| `lila_conversations.safety_scanned` column (migration 7, line 44) | PRD-05 (migration 7) | PRD-30 | ⏳ Unwired (MVP) | PRD-30 Safety Monitoring build — same pattern as the message-level column at the conversation level. Wired alongside the message-level column. |
| Safe Harbor `'manage'` permission preset (migration 19, lines 463-469, Full Partner preset, `safe_harbor: 'manage'` on line 468) | PRD-02 (migration 19) | PRD-20 | ⏳ Unwired (MVP) | PRD-20 Safe Harbor frontend — preset entry exists and is dormant. Expected no-op until PRD-20 ships the Safe Harbor UI and gating tables. Behaves correctly today as an unused permission value. |
| Safe Harbor placeholder UI + ViewAs exclusion (`src/pages/placeholder/index.tsx:53`, `src/App.tsx:176`, `src/lib/permissions/ViewAsProvider.tsx:46` `PRIVACY_EXCLUSIONS = ['safe_harbor']` constant) | PRD-04 / PRD-02 | PRD-20 | ⏳ Unwired (MVP) | PRD-20 Safe Harbor frontend — placeholder component and ViewAs exclusion are in place so PRD-20 can slot into existing routing and privacy infrastructure without retrofit. |
| `_requestingMemberId` parameter in `supabase/functions/_shared/relationship-context.ts:261` (caller at line 189 passes a real `memberId` value but the function ignores it) | Phase 0.25 recon | Phase 0.26 Session 3 | ✅ Wired | Phase 0.26 Session 3 (2026-04-17) — Underscore dropped, parameter renamed to `requestingMemberId`. App-layer role-asymmetric filtering applied at 4 sites via new `applyPrivacyFilter` + `isPrimaryParent` helpers in `supabase/functions/_shared/privacy-filter.ts` (commits `6760ad1`, `7fe5ffa`, `7cd034e`). Database-level RESTRICTIVE RLS policy on `archive_context_items` enforces the rule as defense-in-depth (migration `00000000100149`, commit `a11a456`). Behavioral verification deferred — production has zero `is_privacy_filtered=true` rows; correctness asserted by inspection (commit `75f0161`). |

## Universal Capability Parity Stubs (Stage 2 — 2026-04-30)

| Stub | Created By | Wired By | Status | Notes |
|------|-----------|----------|--------|-------|
| `require_note` on `task_template_steps` | Stage 2 Parity audit (Task 3) | — | ⏳ Unwired (MVP) | Per-step "require a note on completion" toggle. Column does not exist in schema. Would need migration + step editor UI + completion-time enforcement. No PRD assigned. |

## Phase 3.8 — Activity Management

| Stub | Created By | Wired By | Status | Notes |
|------|-----------|----------|--------|-------|
| LiLa context from activity completion patterns | Phase 3.8 | PRD-05 context assembly expansion | ⏳ Unwired (MVP) | Activity completion data not yet included in LiLa context assembly pipeline. Requires new context source loader in `_shared/context-assembler.ts`. |
| Offline activity lists | Phase 3.8 | PRD-33 | 📌 Unwired (Post-MVP) | Activity lists and icon launcher widgets require network connectivity. Offline support deferred to PRD-33 PWA build. |
| Cross-family sharing / community templates | Phase 3.8 | — | 📌 Unwired (Post-MVP) | Activity list templates are family-scoped only. Community sharing of activity configurations deferred. |
| Activity list scheduling (painted/recurring) | Phase 3.8 | Phase 3 painted schedules expansion | ⏳ Unwired (MVP) | Activity lists are always-available. Painted or recurring schedule attachment (e.g., "only on Tuesdays") not yet wired. `lists.schedule_config` column exists but not connected to activity wizard. |
| Analytics for activity patterns | Phase 3.8 | PRD-32 | 📌 Unwired (Post-MVP) | No admin-side analytics for activity completion patterns, popular activities, or daily floor achievement rates. Deferred to PRD-32 Admin Console analytics expansion. |

---

## Member-Day Obligations — Grandfathered (Convention #271 — 2026-05-28)

These surfaces re-derive "what counts for a member on a given date" inline instead of calling `get_member_day_obligations`. They are grandfathered as-is by Convention #271. **Any change to one of them MUST refactor it to consume the canonical query as part of that change.** The Member-Day Task State build (2026-05-28) wired the three painted-affected callers (`useRoutineWeekView`, `calculate_allowance_progress`, `calculate-allowance-period`); the rest below await their own touch.

| Surface | Created By | Wired By | Status | Notes |
|------|-----------|----------|--------|-------|
| Gamification math (`execute_creature_godmother`, `execute_points_godmother`, `execute_page_unlock_godmother`) | Phase 3 Worker F/H | next gamification-math change | ⏳ Unwired (MVP) | **Row corrected 2026-07-03 (CLIENT-DATE-REMEDIATION build):** `roll_creature_for_completion` (the RPC this row originally named) was DROPPED by migration 100221 — the Phase 3 connector/godmother architecture replaced it entirely; the row above was stale. Next change to gamification math MUST consume `get_member_day_obligations`. Separately, streak DATE derivation specifically (not the get_member_day_obligations question) is already family-local: `compute_streak()` (migration 100204) was made family-timezone-aware by migration 100240, and `family_members.current_streak`/`longest_streak`/`last_task_completion_date` are dead columns since the same 100221 drop — client reads go through `useMemberStreak()` → `compute_streak()` now, not the frozen columns. See CLAUDE.md Convention #257's "Adjacent finding" note. |
| Homework time log writes (`homeschool_time_logs`) | PRD-28 | next homework change | ⏳ Unwired (MVP) | `useFinancial` and related. Next change MUST consume the function. Layer 2 `source_type='homework_log'` not yet populated. |
| Victory creation paths (`createVictoryForCompletion`, `createVictoryForDeed`, victory_godmother) | PRD-11 / Phase 3 | next victory change | ⏳ Unwired (MVP) | Next change MUST consume the function. Layer 2 `source_type='victory'` not yet populated. |
| Tracker widget event recording (`widget_data_points`) | PRD-10 | next tracker change | ⏳ Unwired (MVP) | Various trackers write inline. Layer 2 `source_type='tracker_event'` not yet populated. DATE column (`recorded_date`) is now trigger-protected (migration 100282, Convention #257) — this row is about `get_member_day_obligations` consumption only, an orthogonal concern. |
| Best Intention tally writes (`intention_iterations`) | PRD-06 | next intention change | ⏳ Unwired (MVP) | Layer 2 `source_type='intention_tally'` not yet populated. |
| Practice log writes (`practice_log` from `useLogPractice`) | PRD-09A Build J | next practice change | ⏳ Unwired (MVP) | Next change MUST consume the function. DATE column (`period_date`) is now trigger-protected (migration 100282, Convention #257) — this row is about `get_member_day_obligations` consumption only, an orthogonal concern. |
| Non-routine "is this assigned today" in `useTasks`, `useOpportunityLists`, `useSequentialCollections`, `useFinancial`, `useFamilyOverviewData` | various | per-surface follow-up | ⏳ Unwired (MVP) | Each gets its own follow-up build that extends Layer 2 with the matching `source_type` and refactors the surface in. |
| `countAssignedTasks` non-routine portion (`calculate-allowance-period`) | this build | Layer 2 `source_type='task'` build | ⏳ Unwired (MVP) | The routine portion now goes through `get_member_day_obligations`; non-routine tasks are still counted via a direct query until Layer 2 populates `source_type='task'`. |
| `recurringTaskFilter` refactor to consume the RPC | this build | architectural follow-up | ⏳ Unwired (MVP) | Currently the TS reference implementation for the invariant test. A future build replaces it with a thin wrapper around the RPC; until then the invariant test (`tests/routine-day-state-invariant.test.ts`) catches drift. |
| Extending `get_member_day_obligations` to non-routine `source_type` values | this build | per-source follow-up builds | ⏳ Unwired (MVP) | One source_type at a time (`task`, `opportunity_claim`, `sequential_item`, `randomizer_draw`, `intention_tally`, `tracker_event`, `homework_log`, `victory`) as the surfaces are touched. The function and its return shape already exist. |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Wired | ~85 |
| 🔗 Partially Wired | ~7 |
| ⏳ Unwired (MVP) | ~45 |
| 📌 Post-MVP | ~79 |
| ❌ Superseded | ~3 |
| **Total** | ~219 |
