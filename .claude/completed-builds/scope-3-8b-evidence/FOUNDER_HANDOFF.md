---
Status: COMPLETE — founder adjudication delivered 2026-04-21 from claude.ai web session
Stage: C (post-synthesis, pre-DECISIONS.md population, pre-apply-phase)
Scope: 3 + 8b
Source: Founder verdicts on SYNTHESIS.md §6 decision prompts 1–15 + 3 structural pushbacks + 3 post-audit recommendations
---

# Scope 3+8b Orchestrator Handoff — Founder Adjudication Complete

**From:** Founder (via claude.ai web adjudication session, 2026-04-21)
**To:** Scope 3+8b orchestrator (fresh Claude Code session)
**Purpose:** Capture founder verdicts on all 15 Decision prompts in SYNTHESIS.md §6, three structural pushbacks that reshape the synthesis, and three post-audit recommendations for CLAUDE.md conventions. Use this to populate DECISIONS.md rounds and generate the apply-phase worker prompt.

---

## Pre-amble: Three structural pushbacks that reshape the synthesis

Before Decision-by-Decision verdicts, three pushbacks from the founder adjudication session that change how SYNTHESIS.md's patterns consolidate. Apply these to §7.1 and §7.2 emission mappings, then use the Decision-by-Decision section below to finalize.

### Pushback A: Decision 1 collapses from split (1A + 1B) to one consolidated Blocking finding

SYNTHESIS.md recommended two SCOPE-8b findings: `F1` systemic (12 surfaces, High) + `F2` Mediator Full Picture standalone (Blocking). Founder verdict: **one finding, Blocking severity, 12+ cross-refs, Mediator Full Picture as the lede paragraph's concrete example.**

Rationale: same root cause, same fix (shared `authorizeForFamily(user, family_id)` helper in `_shared/auth.ts` called after `authenticateRequest`, plus `auth.uid()` membership check inside SECURITY DEFINER RPCs). Splitting creates an optics problem — Mediator gets Blocking because its data payload is worst, but the other 11 surfaces are functionally equally exploitable. A user who can POST another family's `conversation_id` to Mediator can also POST another family's `family_id` to `classify_by_embedding` and get semantic matches across that family's journal entries. Same Blocking. One finding.

Impact on §7.1 emission table: **F1 and F2 merge. New consolidated title: "Edge Functions authenticate but do not authorize (12+ surfaces including cross-family Mediator Full Picture data leakage)."** SCOPE-8b count drops from 15 to 14.

### Pushback B: Decision 5 cleanly separates pattern from PRD-14B .ics runtime violation

SYNTHESIS.md recommended "escalate PRD-14B seam #6 as standalone High AND keep in pattern 2A." Founder verdict: **two separate findings, no overlap.**

- Pattern 2A (Source/enum discipline drift, 7+ surfaces freeform TEXT with missing CHECKs) remains a Low-to-Medium SCOPE-3, Beta N, Fix Next Build, case-by-case Intentional-Update-Doc vs. Unintentional-Fix-Code remediation.
- PRD-14B seam #6 (`.ics` import CHECK violation) emits as standalone High SCOPE-8b, Beta Y, Fix Now. This is a runtime-throwing CHECK violation on a marquee import feature — categorically different from the documentation-drift pattern. Remediation is a one-line migration.

Rationale: equivocating on "in pattern AND standalone" muddies the report. Different severity, different remediation timing, different finding class. Two separate findings cleanly.

### Pushback C: PRD-22 `history_retention` restored to Pattern 1D (Decision 3)

SYNTHESIS.md Pattern 1D originally included `history_retention` as a 4th surface, then footnoted "reclassifies — degrades to cross-ref of F-C." Founder verdict: **restore to Pattern 1D.**

Rationale: Searching founder conversation history from the PRD-22 design session (2026-03-19) confirms `history_retention` is part of `lila_member_preferences` and was explicitly specced to trigger auto-archiving of `lila_conversations` older than the retention period — with fallback logic for kids inheriting mom's default. This is not "feature never built"; this is "feature specced, DB column exists, consumers missing." That shape IS Pattern 1D (documented user-controlled privacy/accountability mechanism silently unenforceable at runtime).

The COPPA PRD (PRD-40) builds on this with more aggressive retention rules for under-13 children — which means the cron infrastructure created for `history_retention` can also serve COPPA retention sweeps. Same remediation architecture, different retention windows per member type.

Remediation per surface:
- Add Settings UI for retention selector (`forever` / `90_days` / `30_days` / `7_days`)
- Add scheduled cron job that archives `lila_conversations` past retention period (soft-archive, not hard-delete; excluded from conversation list queries)
- Add fallback logic: kid's preference → mom's default → system default

---

## Decision-by-Decision verdicts (Decisions 1–15)

### Decision 1 — F11 Authenticate-not-authorize pattern

**Verdict:** ONE consolidated Blocking SCOPE-8b finding. 12+ cross-refs. Mediator Full Picture as lede example. (Per Pushback A.)

**Remediation scope:** Shared `authorizeForFamily(user, family_id)` helper added to `_shared/auth.ts`. Every Edge Function that currently calls `authenticateRequest` then also calls `authorizeForFamily` with the resource's family_id. SECURITY DEFINER RPCs (`classify_by_embedding`, `match_book_extractions`, etc.) rewritten to add `auth.uid()` membership check inside the function body. This rewrite also picks up the privacy-filter joins that Pattern 1F identified — `is_safe_harbor`, `is_included_in_ai`, `is_privacy_filtered` enforced inside the RPC, not just at context-assembler level.

**Timing:** One build. Founder confirmed no rush for beta; doing it right in one pass is preferred over staging. The shared helper rollout is mechanical once the helper exists — PRD-34 F-B (Mediator) can ship first as the proof-of-pattern, then the other 11 surfaces roll through in a tight sequence.

**Resolution tag:** Fix Now (Mediator as proof), Fix Next Build (remaining 11 surfaces + RPC rewrites) — but functionally "one cohesive build."

### Decision 2 — HITM on non-conversation AI writes

**Verdict:** 2 standalone Beta-Y findings. High severity each. Fix Next Build.

**Surfaces:**
- PRD-21 `communication_drafts` — UX addition: "Preview / Regenerate / Save" gate between stream-complete and DB insert. Mom's tap on "Save Draft" should go through an Edit/Approve/Regenerate/Reject cycle before persistence.
- PRD-34 `board_personas` — review step before platform-intelligence cache write. Hallucinated personas cannot amortize across all future users.

**Not consolidated** because remediation UX is genuinely different per surface (message-draft Edit-Approve cycle vs. persona-generation review-before-cache).

### Decision 3 — Pattern 1D (Documented opt-out silently bypassed)

**Verdict:** Consolidate as ONE systemic SCOPE-8b finding, High severity, Beta Y, Fix Next Build. **5 surfaces total** after founder adjudication:

1. **PRD-14D** — `family_best_intentions.require_pin_to_tally` (PIN-per-intention captured in Settings, never checked at tally time)
2. **PRD-19** — `is_available_for_mediation` on `relationship_notes` (Decision 18 per-author opt-out — column doesn't exist in live schema)
3. **PRD-22** — `analytics_opt_in` BOOLEAN default TRUE (no UI toggle, no consumer-side check before anonymized event writes)
4. **PRD-22** — `history_retention` on `lila_member_preferences` (restored per Pushback C — specced auto-archive with no Settings UI and no cron consumer)
5. **PRD-14D** — `family_best_intentions.is_included_in_ai` (folded in from Decision 10 — same trust-violation shape)

**Finding body framing:** Single pattern description — "Mom's mental model is 'I flipped this, it works.' Runtime enforcement is absent. Whether the control is a PIN, a toggle, a heart icon, or a dropdown preference doesn't matter — what matters is that the UI promises control that the runtime doesn't deliver. Once one beta user discovers a setting that doesn't do what it says, confidence in every other setting degrades."

**Remediation timing:** Each surface's fix is surgical (1–3 files each); bundle them into one "user-control enforcement sweep" build.

### Decision 4 — Crisis Override missing in 3 Edge Functions

**Verdict:** Consolidate as ONE systemic SCOPE-8b finding, **Blocking severity**, Beta Y, Fix Now.

**Surfaces:** `message-coach`, `auto-title-thread`, `bookshelf-discuss`. Each Edge Function needs `import { detectCrisis, CRISIS_RESPONSE } from '_shared/crisis-detection.ts'` + `detectCrisis(content)` call before any Sonnet/Haiku invocation.

**Ship with:** The Decision 1 shared-helper rollout if possible — same `_shared/` directory, same class of fix, same commit cycle.

**Rationale for Blocking:** Convention #7 is non-negotiable. Crisis Override isn't a feature, it's a safety substrate.

### Decision 5 — Source/enum discipline drift (Pattern 2A) + PRD-14B .ics CHECK violation

**Verdict (split per Pushback B):**

- **Pattern 2A** — Consolidated Medium SCOPE-3, Beta N, Fix Next Build. 7+ surfaces. Case-by-case remediation: columns that should have CHECK constraints per addendum intent → add CHECK + migrate enum values. Columns where the pattern is "addendum spec drifted" → update spec (Intentional-Update-Doc).

- **PRD-14B seam #6** — Standalone High SCOPE-8b, Beta Y, Fix Now. One-line migration:
  ```sql
  ALTER TABLE calendar_events DROP CONSTRAINT calendar_events_source_type_check;
  ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_source_type_check
    CHECK (source_type IN ([existing 7 values], 'ics_import', 'mindsweep'));
  ```

### Decision 6 — PRD-35 schedule vocabulary drift

**Verdict:** Standalone Medium SCOPE-3, Beta N, Fix Next Build.

**Remediation sequencing (founder-specified):**
1. First: amend PRD-35 spec to match shipped code (lower-risk; migrations and schema have landed)
2. Then: fix PRD-27 F-A shift bifurcation by consolidating the two `RecurrenceDetails` TypeScript contracts (`src/components/scheduling/types.ts` vs. `src/lib/scheduling/scheduleUtils.ts`) into one canonical type. The `parseRecurrenceDetails` silently-returning-null is the root cause of PRD-27 F-A; fixing the type consolidation fixes the shift permission check cascade.

**Cross-ref:** PRD-27 F-A stays as its own standalone Beta-Y High finding (Decision 15 / §3E) but its remediation depends on PRD-35 type consolidation landing first. Apply-phase worker should document this sequencing dependency in the finding body.

### Decision 7 — Model-tier registry drift — SCOPE EXPANDED

**Verdict:** **Medium SCOPE-3 (upgraded from Low).** Beta N. Fix Next Build. **Remediation scope expanded beyond orchestrator's original proposal.**

**Founder-specified architectural requirement:** Not just "read model_tier string from DB at runtime." Founder wants:
1. Consolidated location for model assignments
2. Multi-provider capability (Anthropic, OpenAI, Google, OpenRouter-routed, future providers)
3. Easy response to pricing/capability changes as the AI landscape shifts

**Proposed architecture for the finding body:**

Expand `lila_guided_modes` table to include:
- `provider` TEXT — e.g., `'anthropic'`, `'openai'`, `'google'`, `'openrouter'`
- `model_id` TEXT — provider-specific model string (e.g., `'claude-haiku-4-5-20251001'`, `'gpt-4-turbo'`, `'gemini-pro'`)
- `fallback_provider` TEXT NULL — optional outage-fallback
- `fallback_model_id` TEXT NULL — optional outage-fallback
- `max_tokens` INTEGER NULL — per-mode default
- `temperature` NUMERIC NULL — per-mode default

Build shared helper `invokeAI(mode_name, messages, options?)` in `_shared/ai-invoke.ts` that:
- Reads the mode's registry row
- Dispatches to the correct provider SDK (or parameterizes the OpenRouter call with `model_id` from the registry since founder already uses OpenRouter)
- Returns a normalized response shape
- Handles fallback logic on provider outage
- Logs the actually-used provider+model for cost audit visibility

All Edge Functions migrate from hardcoded MODEL strings to `invokeAI(mode_name, messages)`. Model/provider changes become DB migrations, not code changes.

**Additional convention-worthy aspect (see §Post-Audit Recommendations below):** This pattern should become a CLAUDE.md convention — "AI model selection is registry-driven, never hardcoded in Edge Functions."

**Rationale for Medium severity (upgrade from Low):** Not just cost drift. This is architectural flexibility founder explicitly wants. Two Edge Functions are already drifting live (gratitude + decision_guide running Sonnet despite registry saying Haiku = live cost hit today). Plus one latent landmine (family_context_interview registered Sonnet, PRD specs Haiku — will hit when mode ships).

**Cross-ref:** This finding feeds Scope 4 (cost-pattern audit). Scope 4 should formally adopt the `invokeAI()` pattern as enforceable convention.

### Decision 8 — Build M supersession (2D) + Pre-pivot addendum drift (2F)

**Verdict:** Keep as TWO separate findings. Both Intentional-Update-Doc. Beta N.

- **2D (Build M supersession)** — Medium SCOPE-3. Specific to PRD-24 family architectural pivot (PRD-24 + PRD-24A + PRD-24B addenda). Remediation: amend each affected addendum with `> **Superseded by Build M 2026-04-13 — see .claude/completed-builds/2026-04/build-m-*.md**` tag or equivalent.
- **2F (Addendum self-reporting drift)** — Low SCOPE-3. Broader pattern (PRD-21C, PRD-29 differ in shape from PRD-24). Remediation: amend the 3 addenda to correct their completion-status claims.

### Decision 9 — Reusable visual primitive library — REFRAMED

**Verdict (reframed per founder's Lego architecture):** Intentional-Document Low SCOPE-3. Beta N. **Not "Fix Next Build per-component."**

**Finding body reframing (founder-specified language):**

> "Reusable animation/visual primitive library (9+ components) intentionally unassigned to production consumers per Lego/surge-protector architecture (MYAIM_GAMEPLAN v2.2, Phase 1 CLAUDE.md convention addition). Components ship as a primitive library for attachment to Lists, Tasks, Routines, Rewards, Consequences, and other configurable surfaces. Each list/task/routine can be configured with connectors like reward reveals, scratch card reveals, treasure box, sticker charts, tallies that open a reveal every N iterations, etc. — a deliberately configurable library of connection-ready primitives. `GamificationShowcase.tsx` (`/dev/gamification`) serves as the internal preview surface. Production wiring happens incrementally as each consuming feature is built."

**Components covered:**
- PRD-24: `TreasureBoxIdle`
- PRD-24A: `BackgroundCelebration`, `ReadabilityGradient`
- PRD-24B: 4 CSS reveals (`CardFlipReveal`, `ThreeDoorsReveal`, `SpinnerWheelReveal`, `ScratchOffReveal`) + `PointsPopup`, `StreakFire`, `LevelUpBurst`, `StarChartAnimation`

**Carve-outs (NOT part of this Intentional-Document finding):**
- **PRD-36 `TimerConfigPanel`** (509 lines orphaned from SettingsPage) — goes to Pattern 2H (Settings nav missing)
- **PRD-36 `LogLearningModal` "Use Timer" button** (no onClick handler) — goes to Pattern 2H OR standalone Low SCOPE-3

These two are NOT Lego primitives waiting for consumers. They are specific surfaces that were described in addenda as wired and aren't. Different shape, different remediation.

**Prerequisite for any future wire-up of these components:** Before a consumer wires a Lego component, the component's header comment / STUB_REGISTRY entry must be updated to declare its expected consumers and the connection shape (see Post-Audit Recommendation #1 below).

### Decision 10 — `is_included_in_ai` consumer no-op — SPLIT

**Verdict (two surfaces, different fates):**

- **PRD-14 `dashboard_widgets.is_included_in_ai`** — **DROP the column and the Settings UI toggle.** Emit as Intentional-Update-PRD Low SCOPE-3. Rationale: widgets *display* data from source tables (guiding_stars, victories, family_best_intentions, etc.). Those source tables have (or should have) their own `is_included_in_ai` controls. The widget-level toggle is redundant double-control. Simplify the spec: context inclusion is controlled at source-table level, not at display-widget level.

- **PRD-14D `family_best_intentions.is_included_in_ai`** — **Fold into Pattern 1D (Decision 3) as the 5th surface.** Rationale: `family_best_intentions` is its own source table with its own data. Mom should be able to say "LiLa, don't reference this specific intention right now" — meaningful, non-redundant control. Wire the consumer. Same trust-violation shape as the other Pattern 1D surfaces.

### Decision 11 — Settings nav + TimerConfigPanel overlap

**Verdict:** Primary assignment to Pattern 2H (Settings missing nav entry points). Cross-reference from Decision 9's reframed Lego finding. Low SCOPE-3. Beta N. Fix Next Build.

**2H surfaces:**
- PRD-22 — 4 cross-PRD nav entries missing from SettingsPage (Calendar Settings, Messaging Settings, Notification Preferences, Faith Preferences)
- PRD-36 — `TimerConfigPanel` orphaned from SettingsPage
- PRD-36 — `LogLearningModal` "Use Timer" button no onClick

### Decision 12 — Event dispatched to void

**Verdict:** 2 standalone Low SCOPE-3 findings. Beta N. Fix Next Build.

**Surfaces:**
- PRD-24 `useUncompleteTask` stub comment (Build M shipped but comment remains stale)
- PRD-36 `time_session_completed` + `time_session_modified` events — zero listeners

**PRD-36 specific wiring recommendation for the finding body:** These events should be consumed by the gamification pipeline (Build M) for creature-roll triggers on time-based tasks. Not just "add listeners" — wire to the specific Build M hooks that listen for completion events.

### Decision 13 — Stub-socket-as-WIRED terminology (PRD-29)

**Verdict:** Hold as PRD-29 standalone Low SCOPE-3. Beta N. Intentional-Update-Doc. Watch for 3rd occurrence before escalating to pattern.

Include in Post-Audit Recommendation #2's addendum-writing-habits bundle.

### Decision 14 — Add PRD-27 + PRD-29 to Deferred-to-Gate-4

**Verdict:** Yes. Add both to DECISIONS.md Round 0 Deferred-to-Gate-4 table alongside PRD-20, PRD-30, PRD-32/32A, PRD-37/PRD-28B.

**Impact:** EVIDENCE_prd27 F-B and EVIDENCE_prd29 F-A collapse to one-line cross-references rather than standalone findings. Saves ~10 finding emissions.

### Decision 15 — §3 high-severity standalones

**Verdict:** All 8 emit as standalone Beta-Y findings with severity per row:

| Finding | Severity | Beta | Resolution |
|---|---|---|---|
| 3A PRD-17B auto-sweep silently no-op | High SCOPE-8b | Y | Fix Next Build |
| 3B PRD-14B .ics CHECK violation | High SCOPE-8b | Y | Fix Now |
| 3C PRD-22 account_deletions GDPR unenforced | High SCOPE-8b | Y | Fix Next Build |
| 3D PRD-16 meeting impressions privacy | High SCOPE-8b | Y | Fix Next Build |
| 3D PRD-16 dad meeting permission gate | High SCOPE-8b | Y | Fix Next Build |
| 3E PRD-27 shift_sessions/time_sessions bifurcation | High SCOPE-8b | Y | Fix Now (sequenced after Decision 6 type consolidation) |
| 3F PRD-28 first allowance_periods row never created | High SCOPE-3 | Y | Fix Next Build |
| 3G PRD-14D PIN-per-intention | **Folded into Decision 3 / Pattern 1D — no separate emission** | — | — |
| 3H PRD-15 messaging safety (consolidated 4 sub-surfaces) | High SCOPE-8b | Y | Fix Next Build |

---

## Revised emission counts (post-adjudication)

- **SCOPE-8b:** 14 findings (was 15; F1+F2 merged per Pushback A)
- **SCOPE-3:** ~35–40 post-consolidation (down from pre-consolidation ~120 seam-level rows)
- **Beta Readiness queue growth from Scope 3+8b:** ~17 entries (was 19 per SYNTHESIS.md §7.4)
- **Deferred-to-Gate-4 additions:** PRD-27 + PRD-29 added to Round 0 table

---

## Post-Audit Recommendations — Three CLAUDE.md Convention Proposals

Founder's preference on all three: **C (both)** — emit in Scope 3+8b for audit-trail continuity, AND hand off to dedicated CLAUDE.md convention session for numbering/text drafting.

### Post-Audit Recommendation #1: Lego Connector Documentation Convention

**Proposed convention (draft language):**

> **CLAUDE.md Convention #XXX — Lego Primitive Connector Documentation**
>
> Every component/table/feature that serves as a Lego primitive in the surge-protector architecture must declare its expected consumers. Format:
>
> 1. **Component header comment block** — immediately below imports, before the component definition:
>    ```tsx
>    /**
>     * Lego Primitive: [component name]
>     * Expected consumers: [list of PRDs / surfaces / features]
>     * Connection shape: [brief description of the prop/hook contract]
>     * Wired consumers: [list with date and commit SHA as they come online]
>     */
>    ```
> 2. **STUB_REGISTRY.md entry** — new category "Lego Primitives Awaiting Consumers" with the same information.
> 3. **On wire-up:** When a consumer is wired, add to "Wired consumers" list, remove from "Expected consumers" list, cross-reference the wire-up in CLAUDE.md build log.
>
> This prevents future builders from mistaking Lego primitives for dead code and provides discoverability when building consumer features.

### Post-Audit Recommendation #2: AI Model Selection is Registry-Driven

**Proposed convention (draft language):**

> **CLAUDE.md Convention #XXX — AI Model Selection is Registry-Driven**
>
> AI model selection is registry-driven, never hardcoded in Edge Functions. All LiLa guided modes, tool invocations, and ad-hoc AI calls select their model/provider by reading `lila_guided_modes` (or equivalent registry) at runtime via the shared `invokeAI(mode_name, messages, options?)` helper in `_shared/ai-invoke.ts`.
>
> Model or provider changes are DB migrations, not code changes. This pattern supports:
> 1. Multi-provider capability (Anthropic, OpenAI, Google, OpenRouter-routed, future providers)
> 2. Per-mode fallback on provider outage
> 3. Cost/capability response as the AI landscape shifts
> 4. Centralized visibility for cost audit (actually-used provider+model logged per invocation)
>
> Edge Functions that hardcode MODEL strings fail CI pre-deploy check (new CI rule to be added).

**Cross-reference:** Scope 4 (cost-pattern audit) should formally adopt the `invokeAI()` pattern as enforceable convention. If Scope 4 orchestrator is still in flight, founder may want to scope-move Decision 7 remediation entirely to Scope 4.

### Post-Audit Recommendation #3: PRD-22 `history_retention` Restored (correction, not new convention)

**Footnote in the Pattern 1D finding body:** "PRD-22 `history_retention` was initially triaged as 'never built' during pre-synthesis evidence pass; founder adjudication restored it as a specced-but-unwired consumer based on PRD-22 design session 2026-03-19 artifacts. Future evidence passes should treat columns with corresponding PRD spec text as 'consumer missing,' not 'feature never built.'"

**Plus addendum-writing-habits note for Habit 9 (future):** "When a DB column exists and a PRD section specs it, the audit default is 'consumer missing,' not 'feature never built.' Verify against PRD text before classifying."

---

## Additional items flagged during adjudication — for orchestrator awareness

1. **Decision 3 PIN-per-intention (3G) folded into Pattern 1D.** No separate §3 emission.
2. **Decision 6 remediation has a sequencing dependency.** PRD-35 spec amendment ships before PRD-27 F-A type consolidation. Apply-phase worker should document this dependency in both findings' bodies.
3. **Decision 1 shared-helper rollout and Decision 4 Crisis Override ship in the same commit cycle** if possible. Both touch `_shared/` directory, both are safety substrate.
4. **Decision 10 drop-the-column for PRD-14 dashboard_widgets `is_included_in_ai`** requires migration. Coordinate with Pattern 1D's wire-the-consumer work on PRD-14D `family_best_intentions.is_included_in_ai` — same convention area (heart-icon / context-inclusion), opposite fates, needs clear distinction in the respective PRD amendments.
5. **Scope 4 handoff implication:** Decision 7 (multi-provider `invokeAI()`) feeds Scope 4 directly. If Scope 4 orchestrator is still in flight, recommend orchestrator flag this to founder for a sequencing decision before apply-phase.
6. **Global-addenda process-hygiene recommendations** (per SYNTHESIS.md §9 note #5): keep as Appendix notes in AUDIT_REPORT, not standalone findings.

---

## Apply-phase worker input checklist

After orchestrator ingests this handoff and populates DECISIONS.md rounds, apply-phase worker prompt should include:

- [ ] §7.1 emission table regenerated with 14 SCOPE-8b findings (F1+F2 merged)
- [ ] §7.2 emission table regenerated with consolidated SCOPE-3 findings reflecting:
  - Pattern 1D = 5 surfaces (PIN, is_available_for_mediation, analytics_opt_in, history_retention, family_best_intentions.is_included_in_ai)
  - PRD-14 dashboard_widgets.is_included_in_ai → Intentional-Update-PRD (drop column)
  - Decision 7 expanded scope → Medium severity + multi-provider remediation
  - Decision 9 reframed → Intentional-Document Lego library
  - PRD-14B .ics CHECK violation → standalone High SCOPE-8b (separate from Pattern 2A)
- [ ] Deferred-to-Gate-4 table updated with PRD-27 + PRD-29
- [ ] Remediation sequencing notes embedded in:
  - Decision 1 + Decision 4 (ship together)
  - Decision 6 + PRD-27 F-A (PRD-35 amendment precedes type consolidation)
  - Decision 7 (flag for potential Scope 4 scope-move before apply-phase commits)
- [ ] Appendix C (Beta Readiness) regenerated with ~17 entries from Scope 3+8b
- [ ] Three Post-Audit Recommendations emitted per founder's "C (both)" choices
- [ ] Global-addenda process-hygiene observations noted in AUDIT_REPORT Appendix

---

## Archive + push protocol

Per established Phase 2 audit pattern (Scope 5, Scope 8a, Scope 2 precedent):

1. Orchestrator populates DECISIONS.md rounds based on this handoff
2. Orchestrator drafts apply-phase worker prompt
3. Founder reviews apply-phase prompt before dispatch
4. Apply-phase worker emits findings into AUDIT_REPORT_v1.md
5. Archive evidence files to `.claude/completed-builds/scope-3-8b-evidence/`
6. Commit + push on founder approval (stagger ~30min from Scope 4 apply-phase commit per the cron-fix handoff doc guidance to avoid AUDIT_REPORT_v1.md merge conflicts)

---

## Founder sign-off

All 15 Decisions adjudicated. Three structural pushbacks applied. Three post-audit recommendations authorized for documentation per "C (both)" preferences throughout. Orchestrator has everything needed to populate DECISIONS.md and draft apply-phase worker prompt.

Proceed.
