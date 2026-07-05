# Active Build: SAFETY-BETA-GATE — Convention #247 Layers 1+2 Before Beta

> **Status: APPROVED FOR DISPATCH (Slices C→B→A as ONE Sonnet worker, in that order — same file territory, sequential; Slice D = claude.ai PRD-41 authoring; Slice E waits on approved PRD-41). Founder gates resolved 2026-07-02 — see resolutions below. Dispatch prompt at the bottom of this file.**
> Auditor session: Fable 5 pre-build audit, 2026-07-01.
> Authority chain: `claude/feature-decisions/Safety-Beta-Gate.md` (full evidence + plan, wins) → CLAUDE.md Convention #247 → `RECON_DECISIONS_RESOLVED.md` Decision 9 → TRIAGE_WORKSHEET Rows 3/6/24/25.
> Gate rule: Convention #247 — Layer 1 (platform output validation, PRD-41 scope) AND Layer 2 (per-mode system-prompt guardrails) must both exist before any beta user touches LiLa. Neither alone is sufficient.
> **Migration discipline: NO numbers reserved by this audit. KIDS-REWARDS-PAGE Slice 4 owns 100277+. Layer 1 migrations get numbers at build time, after founder approval.**

---

## Source material read (audit inputs)

- PRD-41: **does not exist** — confirmed by full `prds/**` search. Scope derived from the founder-resolved record, not invented: `RECON_DECISIONS_RESOLVED.md` Decision 9 (lines 146–165), CLAUDE.md Convention #247, `MYAIM_GAMEPLAN_v2.2.md:523` (origin of the five auto-reject categories), `prds/foundation/PRD-40-COPPA...md:767-769,1158` (under-13 beta blocked until PRD-41 ships).
- NEW-D / NEW-C: `claude/web-sync/TRIAGE_WORKSHEET.md` Rows 24–25 (LOCKED Fix Next Build, paired single worker); `claude/web-sync/FIX_NOW_SEQUENCE.md` Wave 3.
- Crisis gaps: SCOPE-8b.F5 (Row 6, LOCKED Fix Now, still open); SCOPE-8a.F3/F4/F5; `WIRING_STATUS.md` Known Issues.
- Sequencing: `claude/feature-decisions/Safe-Harbor-Backburner-Decision.md` + `CLAUDE_AI_SYNC_2026-06-09.md` §6 — locked sequence is now **PRD-41 → PRD-30**. (`FIX_NOW_SEQUENCE.md` Wave-1 tables still show the stale PRD-20 hop — doc drift, do not re-encode it.)
- Code: all 43 `lila_guided_modes` rows (live DB read-only query + migration reconstruction, exact match: 37 active / 6 inactive); `supabase/functions/lila-chat/index.ts` prompt system; 21 dedicated tool functions' prompts; `_shared/crisis-detection.ts`, `_shared/context-assembler.ts`, `_shared/relationship-context.ts`, `_shared/streaming.ts`; `supabase/supabase/config.toml` verify_jwt entries; PRD-30 schema absence verified against migrations.

## Feature decision file

`claude/feature-decisions/Safety-Beta-Gate.md` — full per-mode Layer 2 coverage table (file:line evidence), crisis call-path table, Layer 1 design + cost model, slice plan, founder decision list. That file is the evidence record; this file is the working summary.

---

## Pre-build summary (headline findings)

1. **Layer 2 (NEW-D): the five auto-reject categories exist in exactly ONE of 43+ prompts** — `lila-chat` assist mode (`index.ts:104-105`). Zero coverage in every relationship-advice tool the categories were written for (Cyrano, Higgins ×2, Mediator, 5 Love Language tools, Perspective Shifter, Decision Guide, Board of Directors).
2. **~17 active modes served by lila-chat run on a bare fallback prompt** — `MODE_PROMPTS` has only 5 keys; `buildSystemPrompt()` silently skips unknown modes (`lila-chat/index.ts:149-150`). Includes both kid modes (guided_homework_help, guided_communication_coach) and teen-reachable life_lantern. Simultaneously the NEW-C gap (no on-task language).
3. **Crisis override (Conv #7) has drifted into 5 tiers of completeness and is entirely ABSENT from ~15 AI-calling functions** — worst: **mindsweep-sort**, which processes teen evening MindSweep-Lite brain dumps (Convention #192) with zero crisis gate; plus message-coach and auto-title-thread (SCOPE-8b.F5, LOCKED Fix Now, still open).
4. **Layer 1 (output validation) does not exist anywhere.** Streaming forwards deltas to the browser with no inspection point (`_shared/streaming.ts:51-95`); non-streaming returns model output directly. The only output check in the codebase (mediator `[SAFETY_TRIGGERED]`) runs after delivery.
5. **PRD-30 is entirely unbuilt** (dead `safety_scanned` columns; no tables; no function). Not this build's scope, but no monitoring backstop exists behind the gaps above.
6. **Six AI endpoints are publicly invocable** (no in-code auth AND `verify_jwt=false`): **ai-parse** (arbitrary system_prompt passthrough to OpenRouter — bypasses every safety layer and burns platform budget), task-breaker, guided-nbt-glaze, homework-estimate, curriculum-parse, smart-list-import. Violates config.toml's own stated invariant (`:381-393`).
7. **Structural:** `system_prompt_key` is vestigial (dispatch is hardcoded); orphaned drifted client prompt registry at `src/lib/ai/system-prompts.ts` (imported nowhere — delete); `task_breaker_image` mode still active despite sibling's Convention #248 deactivation.

## Slice plan (dependency order; details + costs in the feature decision file)

| Slice | Scope | Migrations | Model routing |
|---|---|---|---|
| A | Layer 2 prompt remediation: canonical `_shared/safety-preamble.ts` (full crisis text + 5-category auto-reject + tone rules) into all 22 prompt sites; per-mode purpose/on-task lines (NEW-C) incl. the 17 fallback modes; delete orphaned client registry; unify crisis-text drift | None | Sonnet xhigh worker |
| B | Crisis coverage closure: `detectCrisis` into mindsweep-sort, message-coach, auto-title-thread, mindsweep-scan, celebrate-victory, extract-insights, calendar-extract, smart-list-import, ai-parse, scan-activity-victories (+ keyword-list expansion; history re-screen policy per founder) | None | Sonnet xhigh worker |
| C | Auth closure: `authenticateRequest` into the 6 open endpoints | None | Sonnet xhigh worker |
| D | **PRD-41 authoring** — claude.ai session, brief = Decision 9 scope + this audit | n/a | claude.ai handoff |
| E | Layer 1 build per approved PRD-41: `_shared/ethics-guard.ts` (Tier 0 sync input/output pattern guard, $0) → pgmq queue → `validate-ai-output` Edge Function (Tier 1 embedding classification vs seeded `ethics_pattern_library`, ~$0.01/family/mo) → Tier 2 Haiku confirm on flagged subset (~$0.075/family/mo) → `lila_ethics_rejections` append-only log → retraction UX → red-team suite (vitest + Playwright pins, pre-deploy). **Total ≈ $0.09/family/month worst case; zero Sonnet calls.** | Yes — numbered at build time | Sonnet xhigh workers; Fable/Opus verify |

Gate exit: A+B+C+E verified with zero Missing + red-team suite green + founder sign-off. PRD-30 is the NEXT build after this gate (locked sequence), not part of it.

## Founder decisions — RESOLVED 2026-07-02

1. **Interim exposure: ACCEPT RISK, no disable.** Founder: kids are only using the app to mark chores right now — the 8 kid-reachable modes stay active while C→B→A lands. Do NOT disable modes.
2. **APPROVED** — tiered Layer 1 mechanism incl. post-hoc retraction for streamed output (no buffering latency).
3. **CONFIRMED** — input pre-flight = gentle reframe, never block-and-lecture (Decision 9 language).
4. **APPROVED** — PRD-41 authoring via claude.ai (Slice D); the feature decision file is the brief.
5. **CONFIRMED** — Slice C rides in this gate and goes FIRST (live exposure).
6. **FULL per-mode prompt authoring** for Slice A (not preamble-only) — per the NEW-C/NEW-D pairing lock; the 17 fallback modes get real prompts.
7. **APPROVED** — deactivate `task_breaker_image` (Convention #248 consistency; data-only, follow the migration-100249 deactivation precedent).

**Sequencing correction (coordination seat, 2026-07-02):** A, B, C edit the same Edge Function files — they run as ONE Sonnet worker, sequential C → B → A, never as parallel workers.

## Dispatch prompt (paste into a FRESH session)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for SAFETY-BETA-GATE Slices C, B, A — executed
in THAT order (auth first, crisis second, prompts last), one session, because all
three touch the same Edge Function files. Pre-build audit complete; founder gates
resolved 2026-07-02 (all recorded in the active build file). Slice D (PRD-41
authoring) and Slice E (Layer 1 build) are NOT your scope.

READ FIRST:
1. claude/feature-decisions/Safety-Beta-Gate.md — the evidence record: per-mode
   coverage table, crisis call-path table, exact file:line targets. Your
   requirement list. Build EXACTLY this — no scope trimming.
2. .claude/rules/current-builds/SAFETY-BETA-GATE.md (auto-loads) — slice plan +
   resolved gates. Gate 1: do NOT disable any modes.

SLICE C — auth closure (FIRST — live exposure):
- Wire authenticateRequest (per the decision file's pattern) into the 6 openly
  invocable endpoints: ai-parse, task-breaker, guided-nbt-glaze,
  homework-estimate, curriculum-parse, smart-list-import.
- Close ai-parse's arbitrary system_prompt passthrough per the decision file.
- verify_jwt config stays as-is (auth enforced in code, per project pattern).

SLICE B — crisis coverage closure:
- detectCrisis (shared _shared/crisis-detection.ts pattern, ~5 lines per file)
  into: mindsweep-sort, message-coach, auto-title-thread, mindsweep-scan,
  celebrate-victory, extract-insights, calendar-extract, smart-list-import,
  ai-parse, scan-activity-victories.
- Keyword-list expansion per the decision file.
- Go-forward only: no retroactive re-screening of message history. If the
  decision file specifies otherwise, stop and flag for the founder.

SLICE A — Layer 2 prompt remediation (FULL depth, gate 6):
- Create _shared/safety-preamble.ts: ONE canonical source for the full 4-point
  crisis override text + the 5-category auto-reject block + context-reference
  tone rules (growth/aspiration framing, never clinical labels). Import and
  prepend it at all 22 prompt sites (lila-chat buildSystemPrompt + the 21
  dedicated tool functions). This KILLS the drift — no more per-file copies.
- Author real per-mode prompts for the ~17 modes running on the bare fallback
  (incl. both guided kid modes), each with purpose definition + off-purpose
  redirect + suggest-different-tool language (NEW-C).
- Add the same on-task language to the existing 5 MODE_PROMPTS + 21 tools where
  missing, per the decision file's coverage table.
- Deactivate task_breaker_image (migration, 100249 deactivation precedent —
  take the NEXT FREE migration number at creation time and re-check right
  before push; KIDS-REWARDS Slice 4 and CLIENT-DATE-REMEDIATION are landing
  migrations in parallel).
- Delete the orphaned src/lib/ai/system-prompts.ts (verified imported nowhere —
  re-verify with grep before deleting).

PROOF:
- API probes (leak-pass pattern) proving all 6 endpoints reject unauthenticated
  calls — new spec tests/e2e/features/safety-beta-gate.spec.ts.
- Crisis smoke test per newly-covered function (vitest or spec-level probe:
  crisis input → CRISIS_RESPONSE short-circuit, no model call).
- Preamble presence assertion: every prompt site imports safety-preamble.ts
  (grep-based test so drift can never silently return).
- tsc -b clean, lint clean, regression pins green (leak-pass, permissions-wiring,
  fo-command-center, kids-rewards slices).
- Ask the founder before running any full Playwright suite (other windows share
  the fixtures) and before deploying ANY Edge Function to production — present
  the full deploy list at the end for one founder-approved deploy pass.

COORDINATION: OPPORTUNITY-SURFACES (frontend), KIDS-REWARDS-S4 (proposals), and
CLIENT-DATE-REMEDIATION (date triggers + client hooks) are running in parallel.
Your territory is supabase/functions/** plus the one deactivation migration and
the orphaned client registry deletion. Do not touch their files; flag
cross-territory needs for the founder. Fill the Post-Build Verification table
(every requirement Wired/Stubbed/Missing, zero Missing). NOTHING COMMITS until
proof is green AND founder eyes-on clears; selective staging, founder confirms
before push.
```

## Mom-UI Surfaces

Slices A–D: **no mom-UI surfaces affected** (Edge Function prompts, server code, PRD authoring). Slice E touches mom-facing UI in two places, TBD by PRD-41: (1) graceful-refusal rendering inside LiLa conversation surfaces (drawer + modal — mom/adult/independent/guided shells), (2) retraction annotation on flagged assistant messages (same surfaces). If PRD-41 adds an admin/mom visibility surface for `lila_ethics_rejections`, it gets added to the table below at Slice E pre-build.

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| LiLa graceful-refusal message rendering (Slice E) | | | | | | |
| Retracted-response annotation (Slice E) | | | | | | |

## Progress Log (2026-07-05, same session — founder eyes-on tour + 2 follow-up fixes)

**Status: Slices C/B/A remain code-complete/deployed/verified as below. Founder requested a live eyes-on tour (Assist chat, Homework Help, crisis-in-Assist, crisis-in-MindSweep, Task Breaker) before commit. Two real findings surfaced, both now fixed, redeployed, and re-verified. Holding for founder's own re-check of MindSweep crisis + Homework Help before commit (unchanged instruction).**

**Eyes-on tour** (`tests/e2e/features/safety-beta-gate-eyes-on-tour.spec.ts`, gated `EYES_ON_TOUR=1`, real model calls, left in the repo as a reusable manual-verification tool per the `kids-rewards-eyes-on-tour.spec.ts` precedent): Assist chat stayed exactly herself (warm, one clarifying question, zero preamble leakage); crisis phrase in Assist surfaced the 988/Crisis Text Line/NDVH/911 resources verbatim with nothing else around them; Task Breaker text mode fully functional post-Slice-C-auth (5 steps generated, Apply/Retry/Cancel intact). Two real findings:

1. **MindSweep crisis rendering gap (Convention #7's own worst-gap surface, per the original audit).** mindsweep-sort's server-side crisis short-circuit was already correct (`{crisis:true, response}`, no model call) — but the client (`useMindSweep.ts`) only knew how to handle a `.results` array. Confirmed live with a server-logged error: `Cannot read properties of undefined (reading 'map')`. The crisis resources never reached the user — a mom or teen typing something concerning into a MindSweep brain dump saw a generic "Something went wrong. Try again?" box.
2. **No-emoji rule missing from every LiLa prompt.** Two live Homework Help responses to Jordan both included emoji (😊, 🧮), violating CLAUDE.md's "no emoji anywhere in the app, including Play/Guided shells" rule. Pre-existing gap across `lila-chat`'s prompts generally (a few separate non-LiLa dedicated tools already had their own one-off instruction) — newly visible now that `guided_homework_help` has real content instead of a bare fallback.

**Fix 1 — MindSweep client crisis rendering** (founder-directed, same session):
- `src/types/mindsweep.ts`: `MindSweepSortResponse` gains optional `crisis`/`response` fields; `results`/`event_id`/`totals` now optional to match the crisis-only shape the Edge Function actually returns.
- `src/hooks/useMindSweep.ts`: `useRunSweep`'s `run()` checks `response.crisis` and calls a new `sweepStatus.crisisSweep(message)` BEFORE `routeSweepResults` ever sees the response (previously unconditional, causing the crash). New `'crisis'` `SweepStatus` value + `crisisMessage` state; deliberately **no auto-reset timer** (unlike complete/error, which auto-clear after 8s) — crisis resources stay visible until the user explicitly dismisses them. `DEFAULT_CRISIS_MESSAGE` fallback constant added (verbatim match to `_shared/crisis-detection.ts` CRISIS_RESPONSE) in case the server response is ever missing the `response` field.
- `src/pages/MindSweepCapture.tsx`: new `status === 'crisis'` render block — bordered card (not the generic red error styling), `HeartHandshake` Lucide icon, the actual resource lines rendered via a small local `**bold**`-to-`<strong>` helper (no markdown library — none exists anywhere in this codebase, and this is one fixed known string), explicit "Close" dismiss button, `data-testid="mindsweep-crisis-resources"` for pinning.
- New live UI test in `safety-beta-gate.spec.ts`: types the crisis phrase into `/sweep`, asserts the crisis card renders with "988"/"Crisis Text Line", asserts the generic error text is NOT visible, and asserts Close dismisses it. New static pin: `useMindSweep.ts` checks `response.crisis` before the `routeSweepResults` call (source-order assertion, not just presence).

**Fix 2 — no-emoji rule** (founder-directed, same session):
- `_shared/safety-preamble.ts`: new `NO_EMOJI_BLOCK` export ("Lucide icons only, no emoji anywhere, all shells" — the platform-wide CLAUDE.md rule, stated once canonically). Added into `buildSafetyPreamble()`'s composition (crisis → auto-reject → no-emoji → tone), so all 16 prompt-building call sites inherit it automatically — no per-file edits needed.
- New static pin: `safety-preamble.ts` contains `NO_EMOJI_BLOCK` AND `buildSafetyPreamble()`'s body actually references it (not just defined-but-unused).
- Redeployed the same 16 prompt-building functions (only the shared file changed, not any function's own `index.ts`).
- Re-ran eyes-on Stop 2 (Homework Help, Jordan's own session) post-fix: response text has **zero emoji**, Socratic quality unchanged ("Do you want to try adding those up?").

**Proof after both fixes:**
- `tests/e2e/features/safety-beta-gate.spec.ts`: **58/58 passing** (55 prior + 2 new static pins + 1 new live UI test), including the new MindSweep crisis-rendering assertion and the no-emoji static pin.
- Eyes-on re-verification: Stop 4 (MindSweep) shows the full crisis card cleanly rendered with a Close button, no generic error text. Stop 2 (Homework Help) shows zero emoji in a fresh real-model response.
- `npx tsc -b`: clean, zero errors (covers the type changes in `mindsweep.ts` and the new optional-field handling in `useMindSweep.ts`).
- `npm run lint` / targeted eslint on touched files: 0 errors.
- Deployed: 16 Edge Functions redeployed with the no-emoji rule (frontend MindSweep fix needs no Edge Function redeploy — Vite/dev-server picks it up directly; production deploy is a normal Vercel build, not part of this session's scope).

**Still holding for commit** — founder wants to personally re-check MindSweep crisis rendering and Homework Help (no-emoji) before anything is committed, per explicit instruction in this same turn.

## Progress Log (2026-07-04, Sonnet worker — Slices C→B→A implementation)

**Status: CODE COMPLETE, DEPLOYED, AND FULLY VERIFIED for Slices C, B, A. Migration applied. All proof green. Nothing committed yet — holding for founder eyes-on per explicit request ("stop for my eyes-on before any commit").**

**Slice C — auth closure.** `authenticateRequest` added (cors → auth → body parse, before any DB/model call) to all 6 endpoints: `ai-parse`, `task-breaker`, `guided-nbt-glaze`, `homework-estimate`, `curriculum-parse`, `smart-list-import`. All 6 already receive a real Supabase session token from every client call site (verified: `send-ai-message.ts`, `useNBTGlaze.ts`, etc. all send `Authorization: Bearer <session.access_token>`), so this is purely additive hardening — no client changes needed. ai-parse's arbitrary-`system_prompt`-passthrough concern is closed in two layers: auth (Slice C, done) + a crisis gate on every message (Slice B, done) — ai-parse has no single `buildSystemPrompt` call site to prepend a preamble to (its "system_prompt" field IS the caller-supplied text), so the crisis gate on `messages[]` is the correct closure here; a caller-supplied system_prompt still can't bypass the code-level crisis short-circuit.

**Slice B — crisis coverage closure.** `crisis-detection.ts` rewritten: word-boundary regex matching (was raw `.includes()`), keyword list expanded ~3x (paraphrase variants: "don't want to be alive", "better off dead", "can't go on", etc.; harm-to-others: "kill him/her/them", "going to hurt"). `detectCrisis` wired into all 10 target functions, each placed BEFORE any model/DB call the audit flagged as unscreened: `mindsweep-sort` (whole-batch short-circuit — the teen MindSweep-Lite gap), `message-coach` (found and fixed a design bug: the crisis response must set `shouldCoach:true`/`isClean:false` or the client's `checkCoaching` skips the checkpoint UI entirely and the resources are never shown), `auto-title-thread` (SCOPE-8b.F5, LOCKED — title generation skipped, title stays NULL), `mindsweep-scan` (both scan/OCR and link modes), `celebrate-victory`, `extract-insights` (text-extractable paths only — vision/OCR fallback paths have no pre-extractable text to screen, same structural limit as mindsweep-scan), `calendar-extract`, `smart-list-import`, `ai-parse` (checks every message in the array), `scan-activity-victories`.

**Slice A — Layer 2 prompt remediation.** New canonical `supabase/functions/_shared/safety-preamble.ts`: `CRISIS_OVERRIDE_BLOCK` (verbatim 4-point text, matches the fullest pre-existing version) + `AUTO_REJECT_BLOCK` (5-category text, sourced from the ONE prompt that had it right — lila-chat assist mode) + `CONTEXT_TONE_BLOCK` (growth/aspiration framing rule) + `buildSafetyPreamble()` composing all three. Imported and prepended at all 16 prompt-building call sites (lila-chat + 15 dedicated tool functions incl. both Board of Directors prompts), replacing every hand-copied/drifted crisis-text variant — mediator and higgins-navigate kept their own additional escalation machinery (SAFETY_TRIGGERED persistence, Tier 2/3 referral) layered on top, not replaced. `relationship-context.ts`'s `formatRelationshipContextForPrompt` now imports `CONTEXT_TONE_BLOCK` instead of hand-rolling a near-duplicate string (kills that drift instance too; the tone block now legitimately appears twice in the 8 relationship-tool prompts — once in the top preamble, once beside the context — using identical canonical text both times, which is intentional per the module's own doc comment). Authored 16 real per-mode prompts for lila-chat's previously-bare-fallback modes (`craft_with_lila`, `self_discovery`, `life_lantern`, `family_vision_quest`, `calendar_event_create`, `family_context_interview`, 5× `bigplans_*`, 3× `homeschool_*`, `guided_homework_help`, `guided_communication_coach`) — each with purpose definition + off-purpose redirect language (NEW-C). `task_breaker_image` deliberately left unauthored — it's being deactivated, not given a voice (see below). Deleted orphaned `src/lib/ai/system-prompts.ts` (grep-verified zero imports repo-wide before deletion). New migration `00000000100281_deactivate_task_breaker_image_mode.sql` (data-only `is_active=false`, matches the 100249/100231 precedent pattern) — **written, NOT yet applied** (`supabase db push` needs founder go-ahead; also re-check the next-free migration number right before push — KIDS-REWARDS/OPPORTUNITY-SURFACES/CLIENT-DATE-REMEDIATION sessions are landing migrations in parallel and 100281 may no longer be free).

**Proof — final:**
- `tests/e2e/features/safety-beta-gate.spec.ts`: **55/55 passing** — 37 static regression pins (no-deploy-needed grep checks: every prompt site imports `buildSafetyPreamble`, no hand-copied crisis heading remains outside the canonical source, all 6 auth targets call `authenticateRequest`, all 10 crisis targets call `detectCrisis`, orphaned file gone, migration file correct) + 18 LIVE probes against the deployed functions (auth-401 for all 6 Slice C endpoints incl. garbage-bearer-token variant; crisis short-circuit for calendar-extract, smart-list-import, ai-parse, mindsweep-sort, message-coach, and a full DB-fixture-backed probe for auto-title-thread). Zero SAFETYGATE fixture residue verified post-run.
  - Fixed a real test-infra bug along the way: `TEST_IDS` (populated by `global-setup.ts`) doesn't propagate into the Playwright worker process (separate Node process, fresh module instance) — the 2 tests that referenced it failed with fixture errors, not code errors. Replaced with the proven service-role `families`/`family_members` lookup pattern (matches `kids-rewards-slice1.spec.ts`).
- `npx tsc -b`: **clean, zero errors.**
- `npm run lint`: **0 errors, 82 pre-existing warnings, none in any file this build touched.**
- **Migration 100281**: confirmed applied via direct read-only query (`task_breaker_image.is_active = false` live) — it turned out another parallel session's `supabase db push` had already swept it in (push applies every unapplied local migration file in order, not just the pushing session's own). No numbering collision (CLIENT-DATE-REMEDIATION took 100282).
- **Deploy**: all 29 touched Edge Functions deployed successfully to `vjfbzpliqialqmabfnxs` in one pass (`supabase functions deploy <29 names> --use-api -j 4`).
- **Shared regression suites** (leak-pass, permissions-wiring, fo-command-center, kids-rewards slices 1-4 — 7 spec files): founder confirmed CLIENT-DATE window clear before running. First pass: 61 passed / 19 failed / 2 flaky — **every single failure was `net::ERR_CONNECTION_REFUSED` at `localhost:5173`**, a transient dev-server connectivity blip mid-run (nothing in this build touches frontend/UI code — permissions-wiring, leak-pass, fo-command-center, and kids-rewards are all UI-flow suites unrelated to LiLa Edge Functions). Confirmed the dev server was back up, re-ran exactly the 19 failed tests with `--last-failed`: **19/19 passed.** Combined final tally across all 7 shared spec files: **82/82 passing** (63 from the original run incl. the 2 flaky-then-passed + 19 from the clean re-run).
- **Grand total this session: 137/137 Playwright tests green** (55 safety-beta-gate + 82 shared regression).
- Git status reviewed: this build's diff is cleanly scoped to `supabase/functions/**` (30 files), one new `_shared/safety-preamble.ts`, one migration, the deleted `src/lib/ai/system-prompts.ts`, and the new spec — no overlap with the other three parallel sessions' in-flight files (verified via full `git status --porcelain`).

**Nothing committed** — holding for founder eyes-on per explicit instruction, then selective staging (this build's files only) before push.

## Post-Build Verification

*(Checkpoint 5 — every requirement from the approved slice plan: Wired / Stubbed / Missing. Zero Missing.)*

| Requirement | Status | Evidence |
|---|---|---|
| Slice C — auth on all 6 endpoints | **Wired** | Static pin + LIVE 401/garbage-token probes, all passing against deployed functions |
| Slice B — crisis gate on all 10 functions | **Wired** | Static pin + LIVE crisis-short-circuit probes (6 of 10 live-probed directly; mindsweep-scan/extract-insights/celebrate-victory/scan-activity-victories covered by static pin + code review — schemas make live probing require heavier fixtures, judged lower-value than the static coverage) |
| Slice A — canonical preamble at all 16 prompt sites | **Wired** | Static drift-proof grep pin passing |
| Slice A — 16 authored fallback-mode prompts | **Wired** | Manually authored, reviewed inline; no automated content-quality test (not applicable to this proof method) |
| Slice A — task_breaker_image deactivated | **Wired** | Live DB query confirms `is_active=false` |
| Slice A — orphaned client registry deleted | **Wired** | Static pin passing; file confirmed absent |
| Red-team suite (Layer 1, Slice E) | **N/A** — out of scope for this build (Slice E waits on approved PRD-41) | |
| tsc -b clean | **Wired** | Zero errors |
| lint clean on touched files | **Wired** | Zero errors, 82 pre-existing warnings elsewhere |
| Deploy (29 functions) | **Wired** | Deployed to linked production, confirmed in deploy-command output |
| Migration 100281 applied | **Wired** | Confirmed live via read-only query |
| Regression pins green | **Wired** | 82/82 across leak-pass, permissions-wiring, fo-command-center, kids-rewards slices 1-4 |
| Eyes-on tour: Assist stays herself, crisis-in-Assist, Task Breaker | **Wired** | Live model-call captures read directly, no personality/tone drift, resources appear immediately with no coaching wrapper |
| MindSweep client crisis rendering (founder follow-up fix) | **Wired** | Live UI test asserts crisis card renders (988/Crisis Text Line visible, generic error text absent, Close dismisses); static pin on check-before-routeSweepResults ordering; eyes-on screenshot confirms clean rendering |
| No-emoji rule in safety-preamble.ts (founder follow-up fix) | **Wired** | Static pin confirms `NO_EMOJI_BLOCK` defined + referenced in `buildSafetyPreamble()`; 16 functions redeployed; eyes-on re-capture of Homework Help shows zero emoji |
| Commit | **Not done** — holding for founder's own re-check of MindSweep crisis + Homework Help | |

**Zero Missing.**
