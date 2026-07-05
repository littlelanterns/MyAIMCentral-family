# SAFETY-BETA-GATE — Convention #247 Three-Layer Governance Audit

> **Status:** PRE-BUILD AUDIT COMPLETE — awaiting founder approval. No code written, no migrations reserved.
> **Date:** 2026-07-01 · **Auditor:** Fable 5 pre-build audit session
> **Authority chain:** CLAUDE.md Convention #247 → `RECON_DECISIONS_RESOLVED.md` Decision 9 → `claude/web-sync/TRIAGE_WORKSHEET.md` Rows 3/6/24/25 → `claude/feature-decisions/Safe-Harbor-Backburner-Decision.md`
> **Gate rule being enforced:** Convention #247 — "Both Layer 1 AND Layer 2 must be in place before beta user exposure. Neither is alone sufficient."

---

## 1. PRD-41 Status (Scope Item 1)

**PRD-41 does not exist as a file.** `prds/` was searched across all subdirectories; the foundation folder tops out at `prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md`. There are no PRD-41 addenda in `prds/addenda/`.

However, PRD-41's intended scope IS on the founder-resolved record and is NOT invented here:

- **`RECON_DECISIONS_RESOLVED.md` Decision 9** (the authoritative scope): create "PRD-41 LiLa Runtime Ethics Enforcement" containing (a) pre-flight content filter on all user input to LiLa (five auto-reject patterns), (b) post-generation content scan on all LiLa output (same five categories), (c) rejection logging to an auditable `lila_ethics_rejections` table, (d) red-team test suite run before every deploy, (e) graceful refusal language ("validate underlying need, redirect to healthier approach, never lecture"), (f) retrofit wiring for all existing LiLa Edge Functions. Decision 9 also rules: "PRD-41 authoring is a separate session, not Phase 0.26 fix work."
- **CLAUDE.md Convention #247** Layer 1 definition: "runs after every model response, applies to every AI surface platform-wide. Auto-reject categories (force, coercion, manipulation, shame-based control, withholding affection)... Not yet built."
- **Origin of the five categories:** Beta Readiness Gate exit criterion, `claude/web-sync/MYAIM_GAMEPLAN_v2.2.md:523` — "LiLa ethics enforcement verified at Edge Function level (not just prompt-specified)... tested with red-team prompts."
- **Sequencing (founder-locked):** PRD-41 → PRD-30 (was PRD-41 → PRD-20 → PRD-30; PRD-20 Safe Harbor backburnered 2026-06-09). `TRIAGE_WORKSHEET.md` Row 3 (amended), `CLAUDE_AI_SYNC_2026-06-09.md` §6. Note: `FIX_NOW_SEQUENCE.md`'s Wave 1 tables still show the stale 3-hop chain (doc drift, not re-adjudication).
- **COPPA coupling:** `prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md:767-769, 1158` — "Under-13 beta exposure is blocked until PRD-41 ships."
- **PRD-30 status:** consistently recorded as entirely unbuilt (verified against live code in §4 below). One doc-consistency gap: `claude/web-sync/PRODUCT_VISION.md` describes safety monitoring in present tense ("watches kids' conversations by default") — aspirational language contradicting the build record.

**Implication for this build:** Layer 1 cannot be built under Convention #11 (PRDs are the only source of truth) until PRD-41 is authored. The build plan (§6) therefore includes PRD-41 authoring as an explicit prerequisite step, with Decision 9 as the brief.

---

## 2. NEW-D Layer 2 Audit — Per-Mode System Prompt Coverage (Scope Item 2)

### 2a. Registry ground truth

Live production query (2026-07-01) + full migration reconstruction agree exactly: **43 rows in `lila_guided_modes`, 37 active, 6 inactive** (`safe_harbor` ×4 per migration `00000000100249`, `book_discussion` per `00000000100195`, `task_breaker` per `00000000100231`). `task_breaker_image` remains **active** — inconsistent with its sibling's Convention-#248 deactivation.

**Structural finding S1 — `system_prompt_key` is vestigial.** It equals `mode_key` on all 43 rows (backfill at `00000000000013_lila_schema_remediation.sql:67-68`), is selected at `supabase/functions/lila-chat/index.ts:388-392`, and is never read again. Prompt dispatch is hardcoded: `mode_key` → `MODE_PROMPTS` in `lila-chat/index.ts:61-127`, or the dedicated Edge Function the client calls. There is no DB-editable prompt text.

**Structural finding S2 — the fallback hole.** `buildSystemPrompt()` (`lila-chat/index.ts:149-150`) silently skips the mode prompt when `mode_key` is not one of the FIVE keys in `MODE_PROMPTS` (general, help, assist, optimizer, meeting). **~17 active registered modes served by lila-chat therefore run on the bare `CRISIS_OVERRIDE` + `BASE_IDENTITY` preamble with zero mode-specific guardrails**: craft_with_lila, self_discovery, life_lantern, family_vision_quest, calendar_event_create, family_context_interview, bigplans_planning, bigplans_friction_finder, bigplans_checkin, bigplans_system_design_trial, bigplans_deployed_component, homeschool_report_generation, homeschool_time_review, homeschool_bulk_summary, **guided_homework_help (kids)**, **guided_communication_coach (kids)**, task_breaker_image. This is simultaneously the NEW-C exposure (no on-task/purpose definition) and part of the NEW-D exposure (no per-mode guardrail authoring ever happened for these).

**Structural finding S3 — crisis text has drifted into 5 tiers** across prompt sites: (a) full 4-point; (b) 3-point missing "overrides ALL"; (c) 2-sentence condensed missing both "do not coach/diagnose" and "overrides ALL"; (d) none-in-prompt, code short-circuit only; (e) nothing at all (see §3).

**Structural finding S4 — orphaned drifted duplicate registry.** `src/lib/ai/system-prompts.ts` is a client-side copy of the entire prompt system, imported nowhere (repo-wide grep), and already drifted from the live server copy (its CRISIS_OVERRIDE has 5 points incl. an explicit "Do NOT diagnose or label" vs. the live 4-point version). If ever re-wired it silently reintroduces a stale safety prompt. Recommend deletion in Slice A.

**Structural finding S5 — tone rules ride two carriers.** In-house text (`lila-chat` BASE_IDENTITY `:54-59`, `lila-message-respond/index.ts:60-63`, `bookshelf-discuss/index.ts:162-166`) or the shared injection `_shared/relationship-context.ts:557` ("frame through growth and aspiration — never deficit or diagnosis... Never label... clinical terminology") used by 10 dedicated tools. `_shared/context-assembler.ts` (705 lines, full read) injects **no** safety or tone language — it is pure data loading.

### 2b. Per-mode coverage table

Legend — Crisis-in-prompt: Full = 4-point `CRISIS_OVERRIDE`; Partial = condensed/degraded variant; Code-only = no prompt text, `detectCrisis()` short-circuit only; None = neither. AR = auto-reject 5-list (force / coercion / manipulation / shame-based control / withholding affection): count of categories named as prohibitions. Tone = growth/aspiration + never-clinical-labels rules. Roles flag: **K** = reachable by guided_kids, **T** = by independent_teens (active modes only; during beta all feature keys unlock per Convention #10).

**Served by `lila-chat` (all inherit Full crisis + tone via shared preamble, `lila-chat/index.ts:40-59,146`):**

| Mode (roles) | Mode prompt? | Crisis | AR | Tone | Verdict |
|---|---|---|---|---|---|
| assist (mom) | `:68-111` | Full + restated `:95-96` | **5/5** `:104-105` | Yes | **Covered — the ONLY 5/5 prompt in the codebase** |
| general (mom) | `:62` | Full | 0/5 | Yes | Partial |
| help (mom) | `:63-67` | Full | 0/5 | Yes | Partial |
| optimizer (mom) | `:112` | Full | 0/5 | Yes | Partial |
| meeting (mom+dad) | `:113-126` | Full | 0/5 | Yes | Partial |
| **guided_homework_help (K)** | **NONE (fallback)** | Full | 0/5 | Yes | **Partial — kid mode on bare generic prompt** |
| **guided_communication_coach (K)** | **NONE (fallback)** | Full | 0/5 | Yes | **Partial — kid mode on bare generic prompt** |
| life_lantern (T) | NONE (fallback) | Full | 0/5 | Yes | Partial — emotional self-assessment surface on generic prompt |
| craft_with_lila, self_discovery, family_vision_quest, calendar_event_create, family_context_interview, bigplans_* ×5, homeschool_* ×3, task_breaker_image (mom/dad) | NONE (fallback) | Full | 0/5 | Yes | Partial — no per-mode guardrails or purpose definition (NEW-C) |

**Dedicated tool Edge Functions:**

| Mode (roles) | Function · prompt span | Crisis | AR | Tone | Verdict |
|---|---|---|---|---|---|
| cyrano (mom+dad) | `lila-cyrano/index.ts:65-152` | Full `:70-75` | 1/5 (M) `:145` | Yes (r-c inject) | Partial |
| higgins_say (mom+dad+**K**) | `lila-higgins-say/index.ts:59-157` | Full `:64-69` | 1/5 (M) `:150` | Yes (r-c) | Partial |
| higgins_navigate (mom+dad+**K**) | `lila-higgins-navigate/index.ts:32-157` | Full + Tier-3 `:123-124` | 1/5 (M) `:147` | Yes (r-c) + never diagnose/label `:147` | Partial |
| quality_time (mom+dad) | `lila-quality-time/index.ts:25-81` | Partial (3-pt) `:26-30` | 0/5 | Yes (r-c) | Partial |
| gifts (mom+dad) | `lila-gifts/index.ts:24-72` | Partial (2-sent) `:25-27` | 1/5 (M) `:66` | Yes (r-c) | Partial |
| observe_serve (mom+dad) | `lila-observe-serve/index.ts:24-72` | Partial (2-sent) | 0/5 | Yes (r-c) | Partial |
| words_affirmation (mom+dad) | `lila-words-affirmation/index.ts:24-79` | Partial (2-sent) | 0/5 | Yes (r-c) | Partial |
| gratitude (mom+dad+**K**) | `lila-gratitude/index.ts:29-85` | Partial (2-sent) | 0/5 | Yes (r-c) | Partial — kid-reachable |
| mediator (mom+dad+**T**+**K**) | `lila-mediator/index.ts:78-164` | Partial (2-sent) `:109-111`; safety-exception machinery `:31-45,149-157`; SAFETY-MODE branch resource list omits 988/911 `:97-100` (true crisis caught upstream at `:249`) | Adjacent (coercion patterns operationalized, no 5-list prohibition) | Yes (r-c) | Partial — strongest safety machinery, still no 5-list |
| perspective_shifter (mom+dad+**T**) | `lila-perspective-shifter/index.ts:28-80` | Partial (2-sent) `:33-35` | 0/5 | Yes (r-c) | Partial |
| decision_guide (mom+dad+**T**+**K**) | `lila-decision-guide/index.ts:83-125` | Partial (2-sent) `:84-86` | 0/5 | **No** (no r-c import; only "never label relationships as abusive" `:95`) | **Missing tone — kid-reachable** |
| translator (mom+dad+**T**+**K**) | `lila-translator/index.ts:24-48` | Code-only (`:77-86`; exempted per SCOPE-8a.F4) | 0/5 (own unrelated content-safety clause `:43-45`) | None | Partial — kid-reachable |
| board_of_directors (mom+dad+**T**) — advisor | `lila-board-of-directors/index.ts:450-493` | In-prompt `:464-467` + break-character + upstream gates `:64-69,970` | 0/5 | **None** | Partial |
| board_of_directors — moderator | `:495-514` | **None in prompt** (upstream code gate only) | 0/5 | None | **Missing in-prompt** |
| book_discuss / library_ask (mom+dad+**T**) | `bookshelf-discuss/index.ts:131-245` | Code-only (`:563-569`) | 0/5 | Yes in-house `:162-166` | Partial |
| (messaging "Ask LiLa & Send") | `lila-message-respond/index.ts:39-63` | Full `:39-44` | words present, no 5-list | Yes in-house `:60-63` | Partial |

**DB-stored prompt fragments** (`perspective_lenses.system_prompt_addition`, `decision_frameworks.system_prompt_addition`, seeded `00000000100049:301,369`): no crisis/AR/tone language — pure technique text. Neutral.

**Opening messages** (`opening_messages` JSONB): greeting text only, no safety language. Neutral, as expected.

### 2c. Headline Layer 2 verdict

**The five auto-reject categories exist as a prompt-level guardrail in exactly ONE of 43+ prompts** (`lila-chat` assist mode, `index.ts:104-105` — authored by the PRD-05 Concierge addendum §4e rule 10). They are absent from every relationship-advice tool they were written for (Cyrano, Higgins ×2, Mediator, the five Love Language tools, Perspective Shifter, Decision Guide, Board of Directors). NEW-D's premise ("Looks-Fine-Failure at the prompt-authoring layer") is confirmed with evidence.

---

## 3. Convention #7 Crisis Override — Call-Path Audit

Mechanism (`supabase/functions/_shared/crisis-detection.ts`, 37 lines): 15 fixed phrases (`:5-21`), case-insensitive substring match (`:32-36`), boolean return, `CRISIS_RESPONSE` resources 988 / Crisis Text Line / NDVH / 911 (`:23-30`). No word boundaries, no severity tiers, no synonym/paraphrase coverage ("I don't want to be alive anymore" does not match), no harm-to-others coverage, English only.

**Wired (input-side, pre-AI, blocking) — 16 functions:** lila-chat (`:337`, current turn only — loaded history `:465-471` never re-screened), lila-translator (`:77-86`), lila-board-of-directors (`:64-69, 970` + per-action field checks; per-advisor loop doesn't re-check), lila-message-respond (`:102-116`; crisis branch doesn't persist the triggering user message — inconsistent with lila-chat), lila-higgins-say (`:200-206`), lila-higgins-navigate (`:198-204`), lila-quality-time, lila-gifts, lila-observe-serve, lila-words-affirmation, lila-mediator (`:249-263`), lila-perspective-shifter, lila-gratitude, lila-cyrano, lila-decision-guide, bookshelf-discuss (`:563-569`, current message only). All block the model call and return resources on a hit.

**ABSENT (AI-calling functions processing user/family free text, no crisis gate of any kind):**

| Function | Why it matters | Prior finding |
|---|---|---|
| **mindsweep-sort** (`:633`) | **Teen evening MindSweep-Lite brain dumps (Conventions #180/#192) flow here.** A designed teen disclosure surface with zero crisis response. Its `SENSITIVITY_PATTERNS` (`:58-82`) cover finances/health for routing, not crisis. | NEW gap — beyond SCOPE-8b.F5's list |
| **message-coach** (`:222`) | Kids'/family members' outgoing message drafts | SCOPE-8b.F5 — **LOCKED Fix Now**, still open |
| **auto-title-thread** (`:100`) | Titles generated from unscreened message content | SCOPE-8b.F5 — LOCKED Fix Now, still open |
| mindsweep-scan (`:72,:200`) | OCR/link text re-enters MindSweep unscreened | NEW gap |
| celebrate-victory (`:261`) | User-authored victory text (incl. kids' via AIR) | NEW gap |
| extract-insights (`:205`) | Uploaded personality/self documents | NEW gap |
| calendar-extract (`:95`) | Freeform event text (authenticated) | NEW gap |
| smart-list-import (`:143`) | Pasted freeform lists | NEW gap |
| ai-parse (`:46`) | Generic passthrough (see §5) | NEW gap |
| scan-activity-victories (`:225`) | Activity-log free text | NEW gap |
| task-breaker, curriculum-parse, homework-estimate, guided-nbt-glaze, spelling-coach | Lower-risk task/utility text; still Convention #7-relevant where kid text flows (task-breaker, spelling-coach) | NEW gaps |

(bookshelf-extract/key-points/study-guide/process operate on published book text — different risk class, noted not prioritized. bookshelf-search/whisper-transcribe/embed* make no generative calls.)

**Response-side (output) validation: effectively none, platform-wide.** `_shared/streaming.ts:processOpenRouterStream()` (`:51-95`) enqueues each delta to the client immediately; `fullText` accumulates only for logging — there is no buffering point where output could be inspected pre-delivery. Non-streaming functions return `choices[0].message.content` directly. The single output-inspection mechanism in the codebase is lila-mediator's model-self-reported `[SAFETY_TRIGGERED]` marker (`:157, :387-396`), checked AFTER the stream already reached the client; it only gates future turns. This is the Layer 1 hole in its entirety.

---

## 4. PRD-30 Verification (live code)

Matches the documentary record exactly: `lila_conversations.safety_scanned` / `lila_messages.safety_scanned` exist (`00000000000007:44,86`) with a polling-shaped partial index (`:92-93`) — but **zero** reads/writes anywhere in `supabase/functions/**`; `src/**` only inserts literal `false`. No `safety_flags`/`safety_keywords`/`safety_monitoring_configs`/`safety_notification_recipients` tables in any migration. No `safety-classify` (or any `safety-*`) Edge Function. `prds/platform-complete/PRD-30-Safety-Monitoring.md:8` — Status: Not Started. PRD-30 is sequenced AFTER this gate (PRD-41 → PRD-30) and is NOT in this build's scope; recorded here because the founder summary must not imply any monitoring backstop exists today.

---

## 5. Side Finding — Unauthenticated AI Endpoints (security, beta-relevant)

`supabase/supabase/config.toml:381-393` states the platform invariant: every function is `verify_jwt = false` at the gateway BECAUSE "every Edge Function in this repo has its own auth layer via `_shared/auth.ts` → authenticateRequest(req)." **Six AI-calling functions violate the invariant — no in-code `authenticateRequest` AND gateway JWT off — making them publicly invocable:**

- **ai-parse** — worst case: accepts arbitrary caller-supplied `system_prompt` + `messages` (`InputSchema` `:22-30`) and forwards verbatim to OpenRouter on the platform key (`:46-59`). An unauthenticated, ungated, general-purpose LLM proxy: cost-abuse hole AND a bypass of every safety layer this build will add elsewhere.
- task-breaker (`config.toml:418-419`), guided-nbt-glaze (`:515-516`), homework-estimate (`:545-546`), curriculum-parse (`:509-510`), smart-list-import (`:512-513`).

(extract-insights authenticates via manual JWT-decode `:78-95` instead of the shared util — nonstandard but authenticated.)

---

## 6. Layer 1 Build Plan (Scope Item 3) — proposed, founder-approval gated

**Design constraints honored:** no per-message Sonnet calls; embedding-first cost discipline (<$1/family/month, Conventions in CLAUDE.md + P2 pattern); applies to every AI surface — category-1 LiLa modes AND category-2 utility tools (Convention #248 exempts utilities from *context assembly*, not from platform output validation, per Convention #247 Layer 1 "every AI surface platform-wide"); streaming architecture cannot block pre-delivery without adding full-response buffering latency to every LiLa reply.

**Three-tier mechanism (cheapest-first):**

- **Tier 0 — synchronous pattern guard, $0.** New `_shared/ethics-guard.ts` (sibling of crisis-detection.ts). Direction 1, input pre-flight: pattern families for the five categories checked on user input before the model call; on hit → graceful refusal (Decision 9 language: validate the underlying need, redirect to a healthier approach, never lecture), log rejection, skip the model. Direction 2, output scan: non-streaming functions scan the completed response before returning; streaming functions scan accumulated `fullText` in the existing finally-block (post-hoc — content already reached the client; see retraction below).
- **Tier 1 — async embedding classification, ~$0.01/family/month.** Every assistant output (all surfaces) enqueues a validation job (pgmq, mirroring the embedding pipeline; Convention #5 never-synchronous). New `validate-ai-output` Edge Function (dedicated per Convention #165) embeds the response (text-embedding-3-small, $0.02/M tokens) and runs pgvector similarity against a seeded `ethics_pattern_library` of per-category exemplars (P2/P6 patterns; library rows are admin-curated, HNSW-indexed). Below threshold → mark validated; above → Tier 2.
- **Tier 2 — Haiku confirmation on the flagged subset only, ~$0.0015/call.** Haiku 4.5 ($1/M in, $5/M out; ~1,250 in / 50 out per classification) classifies flagged responses with category + confidence. Confirmed violation → append `lila_ethics_rejections` row, flag the persisted message with a retraction annotation ("LiLa withdrew this response"), quiet notification hook (PRD-30-ready), exemplar candidate for the library (admin-approved before reuse, per platform-intelligence governance).

**Cost model** (generous beta assumption of 1,000 assistant messages/family/month; observed founder-family volume is ~26 assistant messages/month, so this is >30× headroom): Tier 0 = $0; Tier 1 = 1,000 × ~500 tokens × $0.02/M ≈ **$0.01**; Tier 2 at a 5% flag rate = 50 × ~$0.0015 ≈ **$0.075**. **Total ≈ $0.09/family/month worst case.** No Sonnet anywhere in the pipeline.

**Red-team suite (gameplan `:523` requirement):** fixture corpus per category ("write a script to guilt-trip my teen into obeying," withdrawal-of-affection punishments, forced-compliance scripts, etc.) run against Tier 0/1/2 as vitest fixtures + a Playwright E2E pin per surface class; runs pre-deploy. Playwright is the proof of done per model-routing policy.

**Persistence (schema intent only — migration numbers assigned at build time, NOT reserved by this audit; KIDS-REWARDS Slice 4 owns 100277+):** `lila_ethics_rejections` (append-only; family_id, member_id, surface/function, direction, tier, category, action, message ref, RLS mom-scoped) + `ethics_pattern_library` (category exemplars + embedding halfvec, admin-curated) + pgmq queue wiring.

### Build slices (dependency order)

| Slice | Scope | Migrations | Blocks beta? |
|---|---|---|---|
| **A — Layer 2 prompt remediation (NEW-D + NEW-C, paired per triage LOCK)** | Canonical `_shared/safety-preamble.ts` exporting full 4-pt crisis text + 5-category auto-reject block (assist `:104-105` wording as template) + tone rules; imported by all 22 prompt sites incl. lila-chat preamble and both Board prompts; per-mode purpose/on-task lines for specialized modes and the 17 fallback modes (NEW-C); delete orphaned `src/lib/ai/system-prompts.ts`; fix crisis-text drift (one canonical version). | None (prompts are code) | Yes — Layer 2 half of the gate |
| **B — Crisis coverage closure (Conv #7 / SCOPE-8b.F5 + new gaps)** | `detectCrisis` into: message-coach, auto-title-thread (LOCKED Fix Now), **mindsweep-sort**, mindsweep-scan, celebrate-victory, extract-insights, calendar-extract, smart-list-import, ai-parse, scan-activity-victories (+ task-breaker, spelling-coach where kid text flows); expand keyword list (harm-to-others, paraphrase variants); founder decision on conversation-history re-screen policy; align mediator SAFETY-MODE resource list or record as-designed. | None | Yes |
| **C — Auth closure** | `authenticateRequest` into the 6 open functions (§5), restoring the config.toml invariant. | None | Yes (cost abuse + safety bypass) |
| **D — PRD-41 authoring** | claude.ai session; brief = Decision 9 scope + this audit's §3/§6; founder approves the PRD. | n/a | Prerequisite for E |
| **E — Layer 1 build (PRD-41)** | ethics-guard module, tables + queue, validate-ai-output function, wiring at every AI call site, retraction UX, admin visibility, red-team suite. | Yes (numbers at build time) | Yes — Layer 1 half of the gate |

**Gate exit:** Slices A+B+C+E verified (Post-Build Verification, zero Missing), red-team suite green, founder sign-off. PRD-30 remains the next build after this gate per the locked sequence — not in scope here.

---

## 7. Founder Decisions Needed (before any build work)

1. **Interim kid exposure:** 8 active guided_kids modes + teen MindSweep-Lite are reachable today with the gaps above. Disable kid-facing modes (one `available_to_roles`/`is_active` data change) until Slices A+B land, or accept interim risk? (No beta families are live yet; founder family is.)
2. **Approve the tiered Layer 1 mechanism**, specifically post-hoc retraction semantics for streamed output (the alternative — buffer every streamed reply for pre-delivery scanning — adds visible latency to all of LiLa).
3. **Input pre-flight = reframe, never block-and-lecture** (Decision 9's graceful-refusal language). Confirm.
4. **PRD-41 authoring session** — approve dispatching to claude.ai with Decision 9 + this audit as the brief.
5. **Slice C in-gate?** Auth closure is a security fix riding along; confirm it belongs in this gate (recommended: yes — ai-parse bypasses every other slice).
6. **Slice A content depth:** minimum = safety preamble everywhere; full = also author the ~17 missing per-mode prompts (NEW-C). Recommended: full, per the triage pairing lock.
7. **task_breaker_image** — deactivate to match its sibling's Convention #248 ruling, or keep? (One-row data change; flagged, not assumed.)

## 8. Explicitly NOT in scope

- PRD-30 build (next in the locked sequence, after this gate).
- Safe Harbor anything (backburnered 2026-06-09; defensive plumbing untouched).
- PRD-40 COPPA wiring (separate gate item; this build unblocks its PRD-41 prerequisite).
- LiLa Optimizer infrastructure (SCOPE-2.F9), messaging safety sub-surfaces beyond crisis wiring (SCOPE-8b.F12).
- Migration number reservation (Slice 4 of KIDS-REWARDS-PAGE owns 100277+).

## 9. Evidence provenance

Live DB read-only queries (mode registry, usage volumes) 2026-07-01; four parallel read-only code/document audits with file:line citations throughout; load-bearing claims (MODE_PROMPTS fallback, ai-parse passthrough, config.toml verify_jwt entries, mindsweep-sort false-positive "budget crisis" match) independently re-verified in the main session. Pricing: Haiku 4.5 $1/$5 per MTok (claude-api reference, cached 2026-06-24); text-embedding-3-small $0.02/M tokens (existing pipeline).
