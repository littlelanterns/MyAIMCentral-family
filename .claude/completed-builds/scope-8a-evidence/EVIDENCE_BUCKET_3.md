# Scope 8a — Bucket 3 (LiLa Safety Enforcement) — Evidence Report

> **Scope:** Items 8a-CL-23 through 8a-CL-31 only.
> **Author:** single-purpose evidence-gatherer worker (isolated context).
> **Working directory:** `c:\dev\MyAIMCentral-family\MyAIMCentral-family`.
> **Search tools used:** Grep + Glob + Read (per scope policy; mgrep not invoked).
> **Date:** 2026-04-20.

---

## Summary Table

| ID | Claim | Verdict | One-line evidence |
|---|---|---|---|
| 8a-CL-23 | Crisis Override in every LiLa Edge Function | **PARTIAL** | 14/15 LiLa Edge Functions import and invoke `detectCrisis` from `_shared/crisis-detection.ts`. `lila-translator` is the single gap (by explicit design in the shared helper's header comment, but CLAUDE.md #7 says "GLOBAL — applies to ALL LiLa conversations"). |
| 8a-CL-24 | `is_safe_harbor` column on `lila_conversations` | **PASS** | Column present in `claude/live_schema.md` line 304 (column 8 of `lila_conversations`), created in migration `00000000000007_lila_ai_system.sql:42`. |
| 8a-CL-25 | Safe Harbor flows built (PRD-20) | **FAIL** | None of the 3 expected tables (`safe_harbor_orientation_completions`, `safe_harbor_literacy_completions`, `safe_harbor_consent_records`) exist in live_schema.md or any migration. UI is `PlaceholderPage` only (`src/pages/placeholder/index.tsx:52-53`). STUB_REGISTRY entries at lines 200-201, 534-535 confirm PRD-20 unwired. |
| 8a-CL-26 | PRD-30 Safety Monitoring infrastructure built | **FAIL** | Zero of 7 expected PRD-30 tables exist. No `safety*` Edge Function under `supabase/functions/`. |
| 8a-CL-27 | Layer 1 keyword scanner wired | **FAIL** | `safety_keywords` table does not exist and no Edge Function code references it. `safety_scanned` column exists on `lila_messages` / `lila_conversations` but zero code sites read or write it (grep in `supabase/functions` returns no matches). STUB_REGISTRY lines 532-533 confirm. |
| 8a-CL-28 | Layer 2 async Haiku classification scheduled | **FAIL** | No `safety-classify` Edge Function exists. No `pg_cron` schedule references one. No code writes `safety_scanned`. |
| 8a-CL-29 | Monitoring scope defaults (children ON, adults OFF) | **FAIL** | Table `safety_monitoring_configs` does not exist; no seed migration is possible. |
| 8a-CL-30 | LiLa ethics auto-reject enforced at Edge Function level | **FAIL** | Ethics categories (force, coercion, manipulation, shame, withholding affection) live only inside system-prompt text (e.g., `lila-chat/index.ts:50` "You never guilt, shame, or manipulate"). No code-level post-response validator or rejection path in any `supabase/functions/**` file. PRD-40 itself acknowledges this as a recon finding from Phase 0.25 and names PRD-41 (not yet authored) as the binding prerequisite. |
| 8a-CL-31 | Mediator safety flag persisted (CLAUDE.md #96) | **PASS** | `lila-mediator/index.ts` loads `lila_conversations` on every turn (line 237), reads `context_snapshot.safety_triggered` (line 246), writes the flag on crisis detection (lines 256-258) AND on safety-pattern detection (lines 271-273) AND on AI-side `[SAFETY_TRIGGERED]` marker (lines 390-392), and feeds the flag into `buildSystemPrompt(…, safetyTriggered)` which swaps to SAFETY MODE prompt (lines 83-105, 304). Flag survives close/reopen because it is persisted in DB column, not in memory. |

Verdict distribution: 2 PASS, 1 PARTIAL, 6 FAIL.

---

## Detail — 8a-CL-23 Crisis Override per LiLa Edge Function

### Shared helper
File: `supabase/functions/_shared/crisis-detection.ts`
- Lines 4-20 define `CRISIS_KEYWORDS` (15 keywords incl. suicide, kill myself, want to die, end my life, self-harm, cutting, overdose, etc.).
- Lines 22-29 define `CRISIS_RESPONSE` with 988, Crisis Text Line, NDVH, 911.
- Lines 32-35 `detectCrisis(content: string): boolean` — case-insensitive substring check.
- Line 2 header comment: "Used by all relationship tools and ThoughtSift tools (**except Translator**)."

### Per-Edge-Function subtable

Only `lila-*` prefixed Edge Functions are scored against CLAUDE.md #7. `mindsweep-sort` contains a false-positive match on "budget crisis" (line 67) and is not a LiLa conversational function; it is excluded.

| Edge Function | Has Crisis Detection | Evidence (line anchor) | Note |
|---|---|---|---|
| `lila-chat` | ✅ YES | `supabase/functions/lila-chat/index.ts:9` (import) / `:297` (invoke) | Core LiLa |
| `lila-message-respond` | ✅ YES | `lila-message-respond/index.ts:20` / `:102` | PRD-15 LiLa-in-messages |
| `lila-cyrano` | ✅ YES | `lila-cyrano/index.ts:14` / `:197` | PRD-21 |
| `lila-higgins-say` | ✅ YES | `lila-higgins-say/index.ts:14` / `:200` | PRD-21 |
| `lila-higgins-navigate` | ✅ YES | `lila-higgins-navigate/index.ts:13` / `:198` | PRD-21 |
| `lila-quality-time` | ✅ YES | `lila-quality-time/index.ts:8` / `:101` | Love Language (PRD-21) |
| `lila-gifts` | ✅ YES | `lila-gifts/index.ts:7` / `:92` | Love Language |
| `lila-observe-serve` | ✅ YES | `lila-observe-serve/index.ts:7` / `:92` | Love Language |
| `lila-words-affirmation` | ✅ YES | `lila-words-affirmation/index.ts:7` / `:99` | Love Language |
| `lila-gratitude` | ✅ YES | `lila-gratitude/index.ts:7` / `:105` | Love Language |
| `lila-board-of-directors` | ✅ YES | `lila-board-of-directors/index.ts:10` / `:376` | ThoughtSift (PRD-34) |
| `lila-perspective-shifter` | ✅ YES | `lila-perspective-shifter/index.ts:10` / `:142` | ThoughtSift |
| `lila-decision-guide` | ✅ YES | `lila-decision-guide/index.ts:8` / `:151` | ThoughtSift |
| `lila-mediator` | ✅ YES | `lila-mediator/index.ts:11` / `:249` | ThoughtSift — also has Tier-2 safety (see CL-31) |
| `lila-translator` | ❌ NO | `lila-translator/index.ts:1-50` (no import, no invoke) | Single-turn Haiku text rewrite. Has in-prompt safety clause only: `index.ts:42-44` "CONTENT SAFETY: If the source text contains hate speech, threats, explicit sexual content, or instructions for harm, respond with: 'I can rewrite most things…'". Exempt-by-design per shared helper header. |

### Interpretation

- If the `lila-translator` exemption is interpreted strictly by CLAUDE.md #7 ("every system prompt must include crisis detection"), Translator has prompt-level content safety but no code-level `detectCrisis` — so the strict verdict is **PARTIAL**, not PASS.
- The design rationale is visible in code comments: Translator is single-turn, non-conversational text transformation where the user is typically rewriting third-party text in a chosen tone (pirate, formal, softer). A person in crisis is unlikely to route through Translator, and Translator does not save a conversation history. But this is a risk judgment, not a blanket exemption.
- Recommend orchestrator raise whether `lila-translator` should import `detectCrisis` and short-circuit when the source text contains crisis keywords (parallel to the prompt-level refusal clause for hate/explicit/harm).

### Edge Functions NOT in scope for this item

The following call AI models but are not LiLa conversational tools per feature_glossary.md / ai_patterns.md and are therefore out of scope for 8a-CL-23:
`bookshelf-*` (7 fns), `mindsweep-*` (3 fns), `curriculum-parse`, `task-breaker`, `smart-list-import`, `homework-estimate`, `describe-vs-icon`, `message-coach`, `auto-title-thread`, `scan-activity-victories`, `celebrate-victory`, `spelling-coach`, `guided-nbt-glaze`, `extract-insights`, `ai-parse`, `whisper-transcribe`, `embed`, `embed-text-admin`, `generate-query-embedding`.

Orchestrator may want to re-scope this item in a future audit to cover AI-touching Edge Functions more broadly (e.g., Task Breaker or Curriculum Parse could receive crisis text from a user). For this audit, only the LiLa-prefixed conversational set is scored.

---

## Detail — 8a-CL-24 `is_safe_harbor` column

- `claude/live_schema.md:304` — `lila_conversations` column 8 `is_safe_harbor`.
- `supabase/migrations/00000000000007_lila_ai_system.sql:42` — `is_safe_harbor BOOLEAN NOT NULL DEFAULT false,`.
- Used in the initial seed migration for default-empty Safe Harbor filter (same file lines 71, 106).
- Referenced in migration 19 (lines 503+) as a cross-PRD column note.

Verdict: **PASS** (simple existence check passes on both live_schema.md and migration SHA).

---

## Detail — 8a-CL-25 Safe Harbor flows built (PRD-20)

### Expected tables (from `claude/feature_glossary.md`)

| Table | In live_schema.md? | In migrations? | Verdict |
|---|---|---|---|
| `safe_harbor_orientation_completions` | ❌ No | ❌ No | Missing |
| `safe_harbor_literacy_completions` | ❌ No | ❌ No | Missing |
| `safe_harbor_consent_records` | ❌ No | ❌ No | Missing |

Grep `safe_harbor` in `supabase/migrations/`: 7 files, but all hits reference `lila_guided_modes` seeds (mode_key `safe_harbor`, `safe_harbor_guided`, `safe_harbor_orientation`, `safe_harbor_literacy`) or permission presets. No `CREATE TABLE safe_harbor_*` statements exist.

### UI

- `src/pages/placeholder/index.tsx:52-53` — `SafeHarborPage` returns `<PlaceholderPage title="Safe Harbor" … prd="PRD-20" featureKey="safe_harbor" />`. Placeholder only, no actual UI.
- Glob `src/**/*SafeHarbor*` → zero matches.
- Broader grep for `safe.?harbor|SafeHarbor` in `src/` returns only:
  - `help-patterns.ts` / `context-assembly.ts` — text references in help patterns / context assembly filters.
  - `ViewAsModal.tsx` / `ViewAsProvider.tsx` — `PRIVACY_EXCLUSIONS = ['safe_harbor']`.
  - `App.tsx` / `PermissionHub.tsx` / `feature_expansion_registry.ts` — routing and feature-key registration only.
  - `lanterns-path-data.ts` / `useLila.ts` — text references.

### STUB_REGISTRY confirmation
- Line 200: `Safe Harbor → Library RAG | PRD-20 | — | 📌 Post-MVP`
- Line 201: `Safe Harbor offline support | PRD-20 | PRD-33 | ⏳ Unwired (MVP)`
- Line 534: `Safe Harbor 'manage' permission preset | PRD-02 (migration 19) | PRD-20 | ⏳ Unwired (MVP) | … preset entry exists and is dormant.`
- Line 535: `Safe Harbor placeholder UI + ViewAs exclusion | PRD-04 / PRD-02 | PRD-20 | ⏳ Unwired (MVP)`.

Verdict: **FAIL**. Tables not built; UI is placeholder only; STUB_REGISTRY confirms PRD-20 unwired.

---

## Detail — 8a-CL-26 PRD-30 Safety Monitoring infrastructure

### 7-row table presence check (from `claude/feature_glossary.md`)

| Table | In live_schema.md? | In migrations? | Status |
|---|---|---|---|
| `safety_monitoring_configs` | ❌ | ❌ | Missing |
| `safety_sensitivity_configs` | ❌ | ❌ | Missing |
| `safety_notification_recipients` | ❌ | ❌ | Missing |
| `safety_flags` | ❌ | ❌ | Missing |
| `safety_keywords` | ❌ | ❌ | Missing |
| `safety_resources` | ❌ | ❌ | Missing |
| `safety_pattern_summaries` | ❌ | ❌ | Missing |

Grep for any of the 7 table names across `claude/live_schema.md` → zero matches. Grep across `supabase/migrations/` → zero matches. 0/7 present.

### Edge Function
Glob `supabase/functions/safety*` → no files. Glob `supabase/functions/*safety*` → no files. The PRD-30 spec requires a `safety-classify` Edge Function; it does not exist.

References to `safety-classify` exist ONLY in documentation / PRD / gameplan / audit files (CHECKLIST_INVENTORY.md, RECONNAISSANCE_REPORT_v1.md, `claude/architecture.md`, AI-COST-TRACKER.md, scope-5 evidence), never in source code.

Verdict: **FAIL** (0/7 tables, 0 Edge Functions).

---

## Detail — 8a-CL-27 Layer 1 keyword scanner

Prerequisite `safety_keywords` table does not exist (see CL-26), so a scanner cannot be wired to it. Independent grep for `safety_keywords` in `supabase/functions/` returns zero matches.

The related `safety_scanned` columns DO exist:
- `lila_messages.safety_scanned` — migration 7 line 86 (per STUB_REGISTRY line 532).
- `lila_conversations.safety_scanned` — migration 7 line 44 (per STUB_REGISTRY line 533).

Grep `safety_scanned` across `supabase/functions/` → **zero matches**. No Edge Function reads or writes either column.

STUB_REGISTRY corroboration:
- Line 532: "column exists in schema but no logic reads or writes it. Will be wired when PRD-30 builds its safety-scan pipeline."
- Line 533: "same pattern as the message-level column at the conversation level."

Verdict: **FAIL** (table absent; dead columns; no code path).

---

## Detail — 8a-CL-28 Layer 2 async Haiku classification

Required components:
1. `safety-classify` Edge Function — does not exist (see CL-26).
2. Scheduler (pg_cron or queue) invoking it — impossible without #1.
3. Write-back to `safety_scanned` — does not happen (see CL-27).

Grep `safety-classify` in `supabase/migrations/` → zero matches. Grep `safety_classify` → zero matches.

Verdict: **FAIL**.

---

## Detail — 8a-CL-29 Monitoring scope defaults

`safety_monitoring_configs` table does not exist (see CL-26), so no default seed migration is possible. The policy ("children default monitored ON, adults opt-in") is specified only in `claude/ai_patterns.md` §Safety Monitoring and cannot be encoded without the table.

Verdict: **FAIL**.

---

## Detail — 8a-CL-30 Ethics auto-reject at Edge Function level

### What exists (prompt-level only)
- `lila-chat/index.ts:50` — `You never guilt, shame, or manipulate.`
- `lila-mediator/index.ts:150` — safety trigger addresses "coercive control, isolation, threats IN ANY DIRECTION" inside system prompt.
- 18 other `supabase/functions/*/index.ts` files contain in-prompt directives using words force / coercion / manipulation / shame / withhold. All are inside the system-prompt string, not in code.

### What does not exist (code-level enforcement)
- Grep across `supabase/functions/` for `auto_reject`, `runtime.ethics`, `ethics.enforce`, `ethics.check`, `post.process`, `output.validation`, `reject.output`, `validate.response`, `output.filter` → **zero matches**.
- Grep for `withhold`, `shame.based`, `force.based` → zero matches.
- `supabase/functions/_shared/` contains `auth.ts`, `context-assembler.ts`, `cors.ts`, `cost-logger.ts`, `crisis-detection.ts`, `feature-guide-knowledge.ts`, `pdf-utils.ts`, `privacy-filter.ts`, `relationship-context.ts`, `streaming.ts`. None of these implements an output validator or ethics-rejection post-processor.
- There is no Edge Function that receives a raw model response as input and rejects it before user delivery.

### PRD-40 itself acknowledges this gap
`prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md`:
- Line 769: "Depends on: PRD-41 (LiLa Runtime Ethics Enforcement — not yet authored). PRD-41 will specify Edge-Function-level enforcement of the five auto-reject categories: force, coercion, manipulation, shame-based control, withholding affection."
- Line 771: "Currently these categories are prompt-specified but not enforced at the Edge Function level (a recon finding from Phase 0.25). PRD-40 names PRD-41's runtime ethics enforcement as a **binding prerequisite** for under-13 beta access."
- Line 1217, Key Decision #23: "Prompt-only ethics enforcement is insufficient when the user is a child. Edge-Function-level deterministic enforcement of the five auto-reject categories must ship before under-13 beta."

Verdict: **FAIL** (self-documented known gap; PRD-41 not authored).

---

## Detail — 8a-CL-31 Mediator safety flag persistence

Edge Function: `supabase/functions/lila-mediator/index.ts`.

### Write sites
1. **Crisis write** — lines 255-258:
   ```
   if (!safetyTriggered) {
     await supabase.from('lila_conversations').update({
       context_snapshot: { ...contextSnapshot, safety_triggered: true },
     }).eq('id', conversation_id)
   }
   ```
   Fires inside `if (detectCrisis(content))` branch (line 249).
2. **Tier-2 safety pattern write** — lines 266-274:
   ```
   if (!safetyTriggered) {
     const lowerContent = content.toLowerCase()
     if (SAFETY_TRIGGER_PATTERNS.some(p => lowerContent.includes(p))) {
       safetyTriggered = true
       await supabase.from('lila_conversations').update({
         context_snapshot: { ...contextSnapshot, safety_triggered: true },
       }).eq('id', conversation_id)
     }
   }
   ```
   Pattern list at lines 31-45 (17 phrases: "afraid of him", "threatens me", "controls everything", "hits me", "walking on eggshells", etc.).
3. **AI-side marker write** — around line 392:
   ```
   context_snapshot: { ...freshSnapshot, safety_triggered: true },
   ```
   Fires when the model response contains `[SAFETY_TRIGGERED]` marker (line 402).

### Read sites
- Line 237: `const { data: conv } = await supabase.from('lila_conversations').select('*').eq('id', conversation_id).single()` — loads the conversation record (including `context_snapshot`) at the start of every turn.
- Line 245: `const contextSnapshot = (conv.context_snapshot || {}) as Record<string, unknown>`.
- Line 246: `let safetyTriggered = contextSnapshot.safety_triggered === true` — reads the flag from DB, not from in-memory state.
- Line 304: `const systemPrompt = buildSystemPrompt(userCtx, contextMode, safetyTriggered)` — passes the flag to the prompt builder.
- Lines 83-105 (`buildSystemPrompt`): when `safetyTriggered === true`, returns the SAFETY MODE prompt that suppresses framework coaching, mediation techniques, NVC exercises, and curiosity-about-other invitations, and surfaces resources (NDVH, Crisis Text Line, Safe Harbor).

### Durability
Because the flag lives in `lila_conversations.context_snapshot` (a JSONB column), it survives close/reopen of the conversation. Every subsequent message-send re-loads it from DB at line 237. No in-memory short-circuit exists.

Verdict: **PASS** (write + read + prompt-swap + DB-backed durability all present).

---

## Unexpected findings

1. **`lila-translator` is the only LiLa Edge Function without `detectCrisis`.** Explicitly excluded in the shared helper's header comment. Has an in-prompt safety clause for hate/explicit/harm content but no crisis-keyword short-circuit. CLAUDE.md #7's language ("applies to ALL LiLa conversations") arguably contradicts this design choice. Flag to founder: should Translator import `detectCrisis` and refuse single-turn rewrites of crisis text?

2. **`mindsweep-sort/index.ts:67` contains a false-positive "crisis" match** — the string appears inside a regex for financial categorization (`budget crisis`), not a safety check. Excluded from the per-Edge-Function subtable.

3. **`safety_scanned` columns on `lila_messages` and `lila_conversations` are dead weight.** They exist in schema (migration 7 lines 44 and 86) but zero Edge Function code writes to them. STUB_REGISTRY already flags this (lines 532-533). Not a new finding but worth surfacing: shipping a non-trivial amount of PRD-30 infrastructure would clean this up as a side effect.

4. **PRD-40 self-documents the PRD-30 / PRD-41 gap** at lines 767-775, 909, 1118, 1158, 1217, 1250. The founder is already aware that:
   - PRD-30 Safety Monitoring is not built.
   - Runtime ethics enforcement is prompt-only.
   - PRD-41 "LiLa Runtime Ethics Enforcement" is not yet authored.
   - PRD-40 makes PRD-41 a binding prerequisite for under-13 beta exposure.
   The evidence here confirms the documented state; it does not reveal a new gap.

5. **`lila-mediator` is the most defensively-coded conversational Edge Function by far.** It does 3 things no other LiLa Edge Function does: (a) loads the full conversation from DB on every turn instead of trusting message-queue state, (b) has a Tier-2 "unsafe dynamics" keyword list distinct from the crisis keyword list, (c) persists a durable safety flag that flips the system prompt permanently. This is the pattern PRD-30 will need to generalize to every LiLa Edge Function.

---

## Notes for the orchestrator

- **CL-23 is the judgment call.** PASS vs PARTIAL depends on whether the Translator exemption is acceptable. Strict reading of CLAUDE.md #7 points to PARTIAL; design-intent reading (single-turn, non-conversational, in-prompt safety clause) points to PASS. Defaulted to PARTIAL since the checklist literally reads "Every LiLa Edge Function … includes crisis-keyword or crisis-detection check."
- **CL-25 through CL-30 are structural / feature-not-built FAILs.** They are not implementation bugs — they are unbuilt PRDs (PRD-20 Safe Harbor, PRD-30 Safety Monitoring, PRD-41 Runtime Ethics). Expect the SCOPE-8a.F findings to consolidate into "PRD-20/PRD-30/PRD-41 are binding prerequisites for the beta compliance gate" rather than 6 separate code-level findings.
- **CL-31 is a bright-spot PASS** — the Mediator pattern is the reference implementation of what "Crisis Override + durable safety flag" looks like when it's actually shipped. Cite it when PRD-30 / PRD-41 work begins.
- **Defer decisions:** whether Translator needs `detectCrisis` (CL-23 PARTIAL); whether the SCOPE-8a.F findings for CL-25/26/27/28/29/30 should be consolidated or emitted individually.
- **Do not commit or push.** Per founder instruction in-session, this worker writes only this one file.
