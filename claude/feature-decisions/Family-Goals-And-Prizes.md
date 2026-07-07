# Feature Decision File: FAMILY-GOALS-PRIZES — Family Goals, Family Prizes & Multi-Member Contribution Tracking

> **Created:** 2026-07-05 (Fable pre-build session)
> **PRD:** No single owning PRD — founder-directed feature occupying the practical core of the never-written **PRD-24C (Family Challenges & Multiplayer Gamification)**. Research base: `claude/feature-decisions/Family-Goals-And-Prizes-Handoff.md` (read in full; its §3 codebase claims were independently re-verified against live migrations/code by this pre-build — all confirmed accurate).
> **Source PRDs read in full:** `prds/personal-growth/PRD-06-Guiding-Stars-Best-Intentions.md`, `prds/dashboards/PRD-14D-Family-Hub.md`, `prds/gamification/PRD-24-Gamification-Overview-Foundation.md`, `prds/dashboards/PRD-26-Play-Dashboard.md`, `prds/scale-monetize/PRD-32A-Demand-Validation-Engine.md`
> **Addenda read:**
>   - `prds/addenda/PRD-14D-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-24A-Game-Modes-Addendum.md` *(load-bearing — see Addendum Rulings)*
>   - `prds/addenda/PRD-26-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-32-32A-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` *(always-relevant)*
>   - `prds/addenda/PRD-35-Cross-PRD-Impact-Addendum.md` *(always-relevant — no scheduling surface in v1; goal window is two plain dates, NOT the Universal Scheduler)*
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md` *(always-relevant)*
> **Founder approved:** 2026-07-06 — "requirements captured correctly, stubs are right" — with two riders recorded in `.claude/rules/current-builds/FAMILY-GOALS-PRIZES.md`: (1) kids-rewards slice pins 1–5 are mandatory regression gates + the earned_prizes reader audit findings must be recorded in the build file; (2) contributions count EVENTS — assigned-denominator goal types must route through `get_member_day_obligations` (Convention #271), never derived inline.

---

## What Is Being Built

A family-level goal system where the whole family works toward something together and earns a **Family Prize** — a prize owned by no single family member, displayed to everyone, and redeemed once by mom for the whole family. Mom creates a **Family Goal** ("Family Movie Night — tally 'Remain Calm' 50 times as a family") by naming an outcome, picking participants, choosing an earning mode, attaching a prize, and linking what counts: taps on a Family Best Intention and/or completions of specific tasks. Every qualifying contribution — from the Hub tablet, a kid's personal dashboard, or a task checkbox — increments the family's progress. When the target is crossed, the Family Prize is awarded automatically and instantly, appears on the Prize Board and every participant's My Rewards page, and mom redeems it once for everyone. This closes the gap where `family_best_intentions` tallies have existed since PRD-14D with no reward pipeline attached, and builds the contribution engine that future PRD-24C game-mode visuals (Boss Battles, Family Bingo) will skin.

---

## Founder Decisions (2026-07-05, this session + handoff session)

| # | Decision | Source |
|---|---|---|
| FD-1 | **Real multi-member contribution tracking now** — not a mom-declared manual placeholder | Handoff §2.1 |
| FD-2 | **Participants see family goals/prizes on their own `/my-rewards`** ("If they have a family prize they have access to, or are trying to earn, yes, they should see it") | Handoff §2.2 |
| FD-3 | **Redemption is once, for everyone** — one row, one redeem action by mom | Handoff §2.3 |
| FD-4 | **New Family Goal container** (new `family_goals` tables) that can point at Family Best Intentions and tasks — NOT bolting goal fields onto `family_best_intentions`. Intentions stay open-ended ("never done"); goals complete and award | This session, Q1 |
| FD-5 | **Both earning modes ship in v1, mom picks per goal**: Mode A "All together" (shared counter, anyone's contribution counts) and Mode B "Everyone does their part" (each participant must hit their own mini-target) | This session, Q2 |
| FD-6 | **Authoring home: one management surface, two doors** — a Family Goals manager reachable from the Prize Board AND from Hub Settings (next to Family Best Intentions management). Studio wizard entry deferred | This session, Q3 |
| FD-7 | **Filed as standalone build FAMILY-GOALS-PRIZES**, explicitly noted as the practical core of PRD-24C. No PRD document authored now; Boss Battle/Bingo visuals remain future PRD-24C scope and will consume this engine | This session, Q4 |

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| **`FamilyGoalManager`** (modal, ModalV2) | Mom-only management surface. List of goals grouped Active / Completed / Archived. [+ New Family Goal] → creation form. Edit (active goals only — target/participants editable with plain warning that progress already counted stays counted), Archive (soft, `archived_at`). |
| **Family Goal creation form** (inside manager) | Fields: Title (outcome-named per Convention #249 spirit — placeholder "Family Movie Night"), Description (optional), Prize (name required + optional image via existing `RewardImagePicker` + optional details text), Participants (member pill buttons, Convention #119 pattern; default = all kids; mom may include herself/dad; Special Adults + hidden `role='family'` row never offered), Earning mode (segmented control w/ inline description per Convention #118 language: "All together" / "Everyone does their part"), Target count (integer; per-family total for Mode A, per-person for Mode B), What counts (source picker: link one or more active Family Best Intentions AND/OR pick specific tasks via assignee-scoped task picker), Optional end date (plain date input — NOT Universal Scheduler; no recurrence in v1), Progress visible to kids toggle (default ON — PRD-24 treasure-box `progress_visible` precedent). |
| **Prize Board → Prizes tab: Family group** | Earned family prizes render in a "Family" group (By-kid arrangement gets a "Family" column/group; By-date shows inline with a "Family" badge). Redeem / Un-redeem via existing `useRedeemPrize`/`useUnredeemPrize` (mom-only via existing RLS). Redeemed family prizes appear in the existing redeemed strip/history. |
| **Prize Board → Prizes tab: Family Goals strip** | Active family goals with progress bars + prize preview + [Manage Family Goals] button (door #1 to `FamilyGoalManager`). Hidden when no goals exist EXCEPT a quiet [+ Family goal] affordance for mom. |
| **Hub Settings → "Family Goals & Prizes" group** | Door #2 — same `FamilyGoalManager`, listed alongside the existing Family Best Intentions Management group (PRD-14D Screen 6 pattern). |
| **Hub main surface → new `family_goals` section** | New section key `'family_goals'` in `family_hub_configs.section_order` / `section_visibility` (mom-configurable order + visibility per PRD-14D Screen 6; `mergeSectionOrder`-style read-time grafting so existing saved orders pick it up). Renders active goals: title, prize name/image, Mode A: family progress bar "27 / 50"; Mode B: per-member mini-progress with member colors. Recently-completed goal (≤48h) shows a celebration banner: "You did it! [Prize] earned!" Section hidden entirely when no active/recent goals (PRD-14D empty-section pattern); mom sees a warm empty state inviting creation. NOT collapsible (PRD-14D Decision #18). |
| **My Rewards → "Family" section** | For participants (FD-2): active goals with "You: 3 · Family: 27/50" framing (PRD-14D Screen 2 personal-dashboard framing precedent), earned unredeemed family prizes, redeemed family prizes included in `RedeemedHistoryModal`. Mom-toggleable per member via the existing `my_rewards_sections` preferences pattern (KIDS-REWARDS Slice 2), default ON. Mom's own My Rewards "Me" view shows family goals she participates in. |
| **Empty states** | Manager: "Family Goals let your whole family work toward a prize together. Create your first one!" Hub section (mom only): same warmth. My Rewards section: hidden when the member participates in nothing and no family prizes exist. |

---

## Key Decisions (Easy to Miss)

1. **A Family Prize is an `earned_prizes` row with `family_member_id = NULL`.** Migration drops NOT NULL and adds `CHECK (family_member_id IS NOT NULL OR source_type = 'family_goal')` so family prizes are the ONLY ownerless rows. `visibility = 'family'` (100266 model), `shared_with_member_ids` = participant snapshot at award time (drives the My Rewards "participant" query), `source_type = 'family_goal'`, `source_id = goal id`. Partial unique index `ON earned_prizes(source_id) WHERE source_type = 'family_goal'` guarantees one prize per goal ever. One row = one redeem = FD-3, with the existing redeem/un-redeem hooks working unchanged.
2. **This does NOT go through the contracts/godmother layer.** Verified: `contracts.family_member_id IS NULL` means "family default — applies to each kid independently" (migration 100199:37 comment + `dispatch_godmothers` matching), AND the dispatch IF-count queries (`every_nth`/`on_threshold_cross`, 100206:132-155) count firings family-wide for NULL-member contracts while granting to the single member who fired the Nth deed — the semantics are irreconcilably tangled with "one shared family goal." Family Goals get a purpose-built engine (precedent: coloring reveals, Convention #211 — "a visual tally counter tied to a specific repeatable action, not earning-mode-driven"). Never author `contracts` rows for family goals.
3. **Contributions are counted by DB triggers, not client wiring.** `AFTER INSERT ON family_intention_iterations` and `AFTER INSERT/UPDATE ON task_completions` → SECURITY DEFINER functions insert `family_goal_contributions` rows and bump progress. This is why every write path counts automatically: Hub tablet taps, personal dashboard taps, family-device shadow sessions (Convention #276 restored their `family_intention_iterations` writes), View As, approval flows. Client code never computes progress.
4. **Task-completion counting mirrors the gamification pipeline's filter (Convention #200 semantics):** a completion counts when `completion_type IN ('complete', NULL, 'mastery_approved')` AND (`require_approval = false` OR `approval_status = 'approved'`). Practice sessions and pending-approval completions never count. Approval-required tasks count at approval time (the UPDATE leg of the trigger).
5. **Award is transactional and race-safe:** inside the contribution trigger, when the goal condition is met → `UPDATE family_goals SET status='completed', completed_at=now() WHERE id=$1 AND status='active'`; only if that UPDATE claims the row does the prize INSERT run, in the same transaction. The status guard + the partial unique index make double-award impossible under concurrent taps.
6. **Mode B math:** every member in `participating_member_ids` must have `COUNT(contributions) >= target_count`. A contribution from a NON-participant never counts in either mode (trigger checks membership). Mode A: total contributions across participants `>= target_count`.
7. **Contributions count ACTIONS, never points** — PRD-24's Family Challenge Equity law ("family-level aggregation... never raw points"). One tally = 1, one qualifying completion = 1, regardless of the member's age or point scale.
8. **No rewind on task un-complete.** Consistent with the platform-wide unmark gap (Convention #206) and celebration-only (#219): contributions already counted stay counted; an earned family prize is never revoked. Registered as a known limitation alongside #206's.
9. **Goal window is server-evaluated.** `starts_at`/`ends_at` (DATE, optional) are compared inside the trigger against the contribution's TIMESTAMPTZ at `families.timezone` (Convention #257 discipline — no client "today" writes; the contribution table stores only TIMESTAMPTZ). A goal past `ends_at` stops counting; a daily cron is NOT needed for v1 (expiry is evaluated lazily at write/read time; `status='expired'` set opportunistically). Goals with no end date run until earned or archived.
10. **`family_goals.is_included_in_ai BOOLEAN DEFAULT true` ships in the schema** (standard Convention #8 pattern, Heart toggle in the manager) but context-assembler wiring is a registered stub — no LiLa loading this build.
11. **Editing an active goal never resets counted progress.** Target/participant edits apply from now on; the manager shows plain copy stating this. Archiving a goal hides it everywhere but preserves contribution history.
12. **Convention #271 boundary:** v1 goal conditions are completion-COUNT numerators (N tallies / N completions) — they do not ask "what counts for this member on this day" and therefore do not touch `get_member_day_obligations`. The "everyone completes ALL their assigned things on the same day" goal type (PRD-24A Game Modes bingo-square style) is explicitly DEFERRED because it is an obligations-denominator question and MUST route through the Convention #271 RPC when built.
13. **No money payloads.** Family prize = custom reward (name/text/image) only. A dollar-value family prize would require a per-member `financial_transactions` split policy that doesn't exist (#223 append-only ledger is per-member) — deferred with its own design question.
14. **Mom-only management; display follows existing grants.** Creating/editing/archiving goals = `primary_parent` only (RLS-enforced). Finance/prize-board-granted dads (Convention #274) see the Prize Board surfaces read-only for goals; redeem stays mom-only (existing `earned_prizes` UPDATE policy). Hub section is family-visible by design (PRD-14D). No new permission keys wired beyond the feature key below.
15. **No AI in the v1 creation flow → no HITM surface needed** (Convention #4 applies to AI output only). LiLa-suggested goals (PRD-24A Game Modes pattern: LiLa generates → mom edits/approves) is a natural follow-up, registered as a stub.
16. **Recurring/repeating goals are NOT in v1.** A goal completes once. "Re-run it" = mom duplicates from the completed list (cheap manager affordance). Repeating goals with fresh windows = future (would meet PRD-35 scheduler rules).

---

## Addendum Rulings

### From `prds/addenda/PRD-24A-Game-Modes-Addendum.md` (load-bearing):
- Boss Battle/Party Quest defines the founder-approved shape of a shared family target: `total_hp/current_hp` (shared target + progress), per-member `contributions`, `start_date/end_date`, `reward`, `status` lifecycle, mom-configured. `family_goals` deliberately mirrors this shape (minus visual-theme fields) so the future game modes can skin this engine rather than build a second one.
- Family Bingo square `goalType: 'family'` examples ("Everyone completes morning routine on the same day") confirm the deferred goal type named in Key Decision #12.
- Streak Evolution co-op ("ANY member continues the streak — easy mode — or ALL members — hard mode; mom configures") is the same Any/All fork as Mode A/Mode B — FD-5 is consistent with already-approved design language.
- Celebration-only framing rule (boss battles are "rescue/befriend" for young themes) → goal copy never shames; expired goals show gently or disappear, never as failure.

### From PRD-24 (parent) + `PRD-24-Cross-PRD-Impact-Addendum.md`:
- PRD-24C is the designated home for "family challenges, quest board, seasonal events" — FD-7 files this build as its practical core.
- Family Challenge Equity System: normalized task-equivalents / never raw points for family aggregation → Key Decision #7.
- Note: PRD-24's original reward tables (`gamification_rewards`, `treasure_boxes`, etc.) were superseded in the actual build by the Phase 3 Connector Layer + KIDS-REWARDS pipeline; this build grounds in the LIVE pipeline (`earned_prizes`, 100266 visibility model), not PRD-24's paper schema.

### From PRD-14D + `PRD-14D-Cross-PRD-Impact-Addendum.md`:
- `family_best_intentions` / `family_intention_iterations` are the founder-approved family-tally mechanic; personal-dashboard participation with "You: X · Family: Y" framing is the established display language — reused verbatim in My Rewards.
- Hub sections are mom-configurable (order + visibility), not collapsible, hidden when empty. The new `family_goals` section key follows all three rules.
- Family Best Intentions creation lives in Hub Settings → the Family Goals manager gets its second door there (FD-6).
- PRD-14D deliberately kept `family_best_intentions` separate from personal `best_intentions` — FD-4 extends the same separation philosophy: goals are a third, separate concept that LINKS to family intentions.

### From PRD-06:
- "Best Intentions are never 'done'" — the philosophical reason FD-4 rejected bolting targets onto intentions. A goal linked to an intention completes; the intention keeps living.
- Declaration/intention language rules don't apply to goal titles (goals are outcomes, not identity statements).

### From PRD-26 + `PRD-26-Cross-PRD-Impact-Addendum.md`:
- Play members interact via big visual surfaces with zero configuration ability. Play kids can already contribute (Hub tallies where mom set no PIN; task tile completions). Play-shell display of family goals is deferred (Hub covers the shared display for Play kids); registered stub.

### From PRD-32A + `PRD-32-32A-Cross-PRD-Impact-Addendum.md`:
- If any surface ships as a visible stub, use `<PlannedExpansionCard featureKey="..." />` — v1 needs none (deferred surfaces are simply absent, not dead-ends).

### From `PRD-31-Permission-Matrix-Addendum.md`:
- New feature key must be registered and gate via `useCanAccess()` (beta returns true). Family goals participation surfaces ride existing feature access (Hub, My Rewards); the manager is mom-only which sits above the toggle system.

### From `PRD-35-Cross-PRD-Impact-Addendum.md`:
- Universal Scheduler is mandatory for RECURRENCE. v1 goals have no recurrence (single optional end date) → scheduler not embedded. If repeating goals are ever added, they MUST use the Universal Scheduler (Convention #23).

---

## Database Changes Required

### New Tables

**`family_goals`**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK gen_random_uuid() | |
| family_id | UUID NOT NULL FK families | |
| created_by | UUID NOT NULL FK family_members | mom |
| title | TEXT NOT NULL | outcome-named |
| description | TEXT NULL | |
| participating_member_ids | UUID[] NOT NULL | PRD-14D pattern |
| earning_mode | TEXT NOT NULL CHECK IN ('shared_counter','each_member') | FD-5 |
| target_count | INTEGER NOT NULL CHECK (target_count > 0) | family total (A) / per-member (B) |
| starts_at | DATE NULL | optional window |
| ends_at | DATE NULL | optional window |
| prize_name | TEXT NOT NULL | |
| prize_text | TEXT NULL | details |
| prize_image_url | TEXT NULL | |
| prize_asset_key | TEXT NULL | |
| progress_visible | BOOLEAN NOT NULL DEFAULT true | PRD-24 treasure-box precedent |
| is_included_in_ai | BOOLEAN NOT NULL DEFAULT true | Convention #8; assembler wiring stubbed |
| status | TEXT NOT NULL DEFAULT 'active' CHECK IN ('active','completed','expired','archived') | |
| current_progress | INTEGER NOT NULL DEFAULT 0 | denormalized Mode A display; trigger-maintained |
| completed_at | TIMESTAMPTZ NULL | |
| earned_prize_id | UUID NULL FK earned_prizes | the family prize row |
| archived_at | TIMESTAMPTZ NULL | soft delete |
| created_at / updated_at | TIMESTAMPTZ | + set_updated_at trigger |

RLS: all family members SELECT (Hub render); `primary_parent` INSERT/UPDATE/DELETE. Indexes: `(family_id, status, archived_at)`.

**`family_goal_sources`** — what counts toward a goal (multi-source)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| family_id | UUID NOT NULL | |
| goal_id | UUID NOT NULL FK family_goals ON DELETE CASCADE | |
| source_kind | TEXT NOT NULL CHECK IN ('family_intention','task') | v1 kinds; extensible |
| source_id | UUID NOT NULL | FK-by-kind (family_best_intentions.id / tasks.id) |
| created_at | TIMESTAMPTZ | |

UNIQUE (goal_id, source_kind, source_id). Index `(source_kind, source_id)` — the trigger lookup path. RLS: family SELECT, mom writes.

**`family_goal_contributions`** — append-only, one row per counted action
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| family_id | UUID NOT NULL | |
| goal_id | UUID NOT NULL FK family_goals ON DELETE CASCADE | |
| member_id | UUID NOT NULL FK family_members | who acted |
| source_kind | TEXT NOT NULL | mirrors sources |
| source_ref_id | UUID NOT NULL | the iteration/completion row id |
| contributed_at | TIMESTAMPTZ NOT NULL DEFAULT now() | TIMESTAMPTZ only — Convention #257 |
| created_at | TIMESTAMPTZ | |

UNIQUE (goal_id, source_kind, source_ref_id) — a tally/completion counts once per goal, ever (idempotent under trigger re-fires). Indexes: `(goal_id, member_id)`. RLS: family SELECT; NO direct client INSERT (writes only via SECURITY DEFINER trigger functions); no UPDATE/DELETE (append-only, PRD-06 `intention_iterations` precedent).

### Modified Tables
- **`earned_prizes`**: `ALTER COLUMN family_member_id DROP NOT NULL` + `CHECK (family_member_id IS NOT NULL OR source_type = 'family_goal')` + partial unique index `(source_id) WHERE source_type='family_goal'`. **Mandatory pre-flight in the migration session: read EVERY live policy on `earned_prizes` (100266 + any later) and verify none breaks on NULL member; adjust the SELECT policy so NULL-member family-visibility rows resolve for all family members** (the 100266 `visibility='family'` arm should already cover it — verify, don't assume).
- No changes to `family_best_intentions`, `family_intention_iterations`, `tasks`, or `task_completions` schemas — the new triggers attach to the latter two tables' write events only.

### Triggers / Functions (all SECURITY DEFINER, `SET search_path = public`, 100158-style discipline)
1. `count_family_goal_contribution_from_intention()` — AFTER INSERT ON `family_intention_iterations`: find active goals sourced to this intention where member ∈ participants and now() within window (family timezone) → insert contribution → bump `current_progress` → evaluate award.
2. `count_family_goal_contribution_from_completion()` — AFTER INSERT OR UPDATE ON `task_completions`: same, keyed on `family_goal_sources(source_kind='task', source_id=task_id)`, gated by the Key-Decision-4 counting filter; UPDATE leg catches approval transitions; the UNIQUE(goal_id, source_kind, source_ref_id) makes re-fires no-ops.
3. `evaluate_family_goal_award(goal_id)` — shared: checks Mode A/B condition; status-guarded completion UPDATE; INSERT family prize into `earned_prizes` (NULL member, visibility='family', shared_with_member_ids=participants, source_type='family_goal', source_id=goal_id, prize snapshot); sets `earned_prize_id`. Never blocks the parent write on internal failure beyond its own transaction semantics (contribution counting and award are intentionally in-transaction — an award failure rolls back that contribution, surfacing loudly rather than silently dropping a prize).

### Migrations
- ONE migration file, next free number **taken at file-creation time and re-verified immediately before `supabase db push --linked`** (parallel sessions are landing migrations; 100283 was most recent at pre-build time). Idempotent SQL throughout (IF NOT EXISTS / conditional constraint guards, project pattern).
- After apply: `npm run schema:dump` regenerates `claude/live_schema.md` (Convention #244).

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `family_goals` | TBD (beta: true) | mom (manage); all members (view/participate via Hub + My Rewards) | Register in `feature_key_registry`; gate manager entry points with `useCanAccess()`. Tier decision deferred to post-beta tier chart (Convention #256). |

---

## Stubs — Do NOT Build This Phase

- [ ] **Boss Battle / Party Quest / Family Bingo visuals** (PRD-24C proper — will skin this engine)
- [ ] **"Everyone completes all their assigned things on day X" goal type** — obligations-denominator class; MUST consume `get_member_day_obligations` (Convention #271) when built
- [ ] **Money-payload family prizes** (per-member financial split undefined; #223)
- [ ] **LiLa goal suggestion/generation** (HITM flow per PRD-24A Game Modes pattern) + **NLC/Studio wizard entry** (Conventions 249/253 — wizard rides the ST-B/ST-D era catalog later)
- [ ] **Family Overview `family_goals` column section** (Convention #275 section registry — follow-up)
- [ ] **Play-shell (PlayRewards) family goal display** — Hub covers Play kids' visibility for v1
- [ ] **Reveal-animation ceremony / presentation-layer integration on award** (ContractRevealWatcher is contract-grant-keyed; family award celebration = Hub banner only in v1)
- [ ] **Notifications on award** (`notifications` category fit TBD — no 'gamification' category exists live)
- [ ] **Realtime live progress on Hub** (React Query invalidation only; any future channel obeys Convention #272)
- [ ] **Contribution rewind on task un-complete** (matches platform-wide #206 gap)
- [ ] **LiLa context assembly of family goals** (`is_included_in_ai` column ships; `_shared/context-assembler.ts` wiring later)
- [ ] **Repeating/recurring goals** (must use Universal Scheduler when built — Convention #23)
- [ ] **Victory / tracker / homework contribution source kinds** (`source_kind` CHECK is extensible by design)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Counts family intention tallies | ← | Family Best Intentions (PRD-14D) | AFTER INSERT trigger on `family_intention_iterations`; `family_goal_sources(source_kind='family_intention')` |
| Counts task completions | ← | Tasks (PRD-09A) | AFTER INSERT/UPDATE trigger on `task_completions`; `family_goal_sources(source_kind='task')`; Convention #200-mirroring filter |
| Awards family prizes | → | Kids Rewards pipeline (KIDS-REWARDS-PAGE) | `earned_prizes` row: NULL member, `visibility='family'`, `shared_with_member_ids`=participants, `source_type='family_goal'` |
| Displays/redeems prizes | → | Prize Board (`/prize-board` Prizes tab) | Family group + existing `useRedeemPrize`/`useUnredeemPrize` (FD-3: one redeem) |
| Surfaces to participants | → | My Rewards (`/my-rewards`) | New Family section, `my_rewards_sections` toggle pattern, FD-2 rule = membership in `participating_member_ids` / `shared_with_member_ids` |
| Shared display | → | Family Hub (PRD-14D) | New `'family_goals'` section key in `family_hub_configs` |
| Authored from | ← | Hub Settings + Prize Board | `FamilyGoalManager`, two doors (FD-6) |
| Deliberately NOT connected | ✗ | Contracts / godmothers / deed_firings | Key Decision #2 — NULL-member semantics collision; purpose-built engine instead |

---

## Things That Connect Back to This Feature Later

- **PRD-24C game modes** (Boss Battle HP bars, Party Quest checklists, Family Bingo cards) — visual skins over `family_goals` + `family_goal_contributions`.
- **Family Celebration (PRD-11B)** — completed family goals are natural celebration material; `family_victory_godmother` (no-op placeholder, migration 100213) may eventually consume goal completions.
- **LiLa** — goal suggestions (HITM), context assembly of active goals, "you're 3 away!" nudges.
- **Studio** — outcome-named "Family Goal" wizard tile + NLC route (`nlc-compose` catalog).
- **Family Overview** — a `family_goals` section key via `mergeSectionOrder`.
- **PRD-30 / reporting** — goal history as family-pattern data (subject to Safe-Harbor-class exclusions — none apply; goals are non-sensitive).

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate (2026-07-06)
- [x] All addenda captured above
- [x] Stubs confirmed — nothing extra will be built
- [x] Schema changes correct
- [x] Feature keys identified
- [x] **Approved to build** — with Riders 1 & 2 (see build file)

---

## Post-Build PRD Verification

> Completed 2026-07-06. Full table (every Build Item, Rider 1/2 compliance, tsc/lint/regression gates) lives in `.claude/rules/current-builds/FAMILY-GOALS-PRIZES.md` → "Post-Build Verification" (copied below). Zero Missing.

| Requirement | Status | Evidence |
|---|---|---|
| Build Item 1 — Migration: 3 new tables + RLS + triggers + earned_prizes nullable + feature key | **Wired** | Migration `00000000100284_family_goals_and_prizes.sql` applied to linked production; verification block passed |
| Pre-flight audit of every live `earned_prizes` RLS policy before altering | **Wired** | Confirmed via direct read of migration 100266's policies + `redeem_own_prize()` — zero policy rewrite needed (Convention #278) |
| Counting trigger: `count_family_goal_contribution_from_intention` | **Wired** | E2E tests 2, 5, 6 |
| Counting trigger: `count_family_goal_contribution_from_completion` (Convention #200 mirror, based on the current authoritative migration 100278 body) | **Wired** | E2E test 7 |
| Shared `evaluate_family_goal_award()` — status-guarded + partial-unique-index race safety | **Wired** | E2E test 3 concurrency probe: exactly 1 prize, always. `EXECUTE` revoked from PUBLIC/anon/authenticated |
| `npm run schema:dump` regeneration | **Wired** | `claude/live_schema.md` regenerated |
| Build Item 2 — Types + hooks + Convention #261 invalidation wiring | **Wired** | `src/types/family-goals.ts`, `src/hooks/useFamilyGoals.ts`; wired into `useLogFamilyIntentionTally`, `useCompleteTask`, `useApproveTaskCompletion` |
| Build Item 3 — `FamilyGoalManager` | **Wired** | `src/components/rewards/FamilyGoalManager.tsx`; E2E test 1; eyes-on tour |
| Build Item 4 — Prize Board Family group + strip + manager door + redeem/un-redeem | **Wired** | `src/pages/PrizeBoard.tsx`, `src/components/rewards/FamilyGoalsStrip.tsx`; E2E test 9; eyes-on tour |
| Build Item 5 — Hub `family_goals` section | **Wired** | `src/components/hub/sections/HubFamilyGoalsSection.tsx`; eyes-on tour |
| Build Item 6 — Hub Settings door | **Wired** | `src/components/hub/HubSettings.tsx`; eyes-on tour |
| Build Item 7 — My Rewards Family section | **Wired** | `src/components/rewards/MyRewards.tsx`; E2E test 8; eyes-on tour |
| Build Item 8 — Nullable-member code audit (6 readers, 2 real bugs found+fixed) | **Wired** | Full findings table in the build file |
| Build Item 9 — FeatureGuide + LiLa knowledge | **Wired** | Registry entry, help-patterns, feature-guide-knowledge PAGE_KNOWLEDGE + USE_CASE_RECIPE |
| Build Item 10 — E2E spec, DB-asserted | **Wired** | `tests/e2e/features/family-goals-prizes.spec.ts` 10/10, zero fixture residue |
| Build Item 11 — Eyes-on tour, Claude reads every screenshot | **Wired** | `family-goals-prizes-eyes-on-tour.spec.ts`, 17 screenshots, all read |
| Build Item 12 — Close-out docs | **Wired** | STUB_REGISTRY, WIRING_STATUS, CLAUDE.md #278, live_schema.md, this table |
| Rider 1 — kids-rewards slice 1-5 regression gate | **Wired** | All green on clean re-run; one transient failure traced to pre-existing stale fixtures unrelated to this build (see build file Progress Log) |
| Rider 1 — audit findings recorded | **Wired** | Table in build file |
| Rider 2 — events-not-denominators standing law | **Wired** | CLAUDE.md Convention #278 + table comment + STUB_REGISTRY entry |
| `tsc -b` / lint clean | **Wired** | Exit 0 / 0 errors |
| Regression gates: leak-pass, fo-command-center | **Wired** | Green |

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- Total requirements verified: 21
- Wired: 21
- Stubbed: 0 (13 registered Post-MVP/MVP stubs are separate deferred scope, listed in STUB_REGISTRY.md, not partial implementations of the 21 above)
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
