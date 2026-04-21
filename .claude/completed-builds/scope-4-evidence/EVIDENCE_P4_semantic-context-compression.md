---
Status: COMPLETE — awaiting orchestrator adjudication
Stage: C
Scope: 4
Pattern: P4 — Semantic Context Compression / Layered Context Assembly
Opened: 2026-04-20
ai_patterns.md reference: L96–166
F11 anchor: .claude/completed-builds/scope-2-evidence/ANALYSIS_F11_CONTEXT_ARCHITECTURE_COMPARISON.md (closed; do not re-analyze)
Dynamic evidence: historical ai_usage_tracking / lila_conversations.token_usage (read-only, founder-approved)
---

# Scope 4 — P4 Semantic Context Compression Evidence Pass

## Worker summary

P4 (layered context assembly with relevance filtering) is **wired correctly at the shared implementation site** and **correctly consumed at most LiLa Edge Functions**, but **two ThoughtSift Edge Functions bypass the shared assembler with parallel bulk-load context paths.** `_shared/context-assembler.ts` structure matches [claude/ai_patterns.md](../claude/ai_patterns.md#L96) L96–166 exactly: Layer 1 always-loaded roster (L223–244), Layer 2 name detection + topic matching + three-tier toggle enforcement (L246–436), Layer 3 semantic RPC (`get_bookshelf_context` at L484) never bulk loaded. All 13 conversational LiLa Edge Functions were enumerated (14 after counting `lila-translator` which correctly loads NO context per ai_patterns.md L160). **11 of 13 context-loading LiLa Edge Functions** route through the shared 3-layer pipeline (3 via `assembleContext` directly — `lila-chat`, `lila-message-respond`, `bookshelf-discuss`; 8 via `loadRelationshipContext` in `_shared/relationship-context.ts` — all relationship tools incl. mediator + perspective-shifter). **2 bypass sites**: `lila-decision-guide` (own `loadDecisionContext` L25–81) and `lila-board-of-directors` (inline loads L420–433). Both miss Layer 1 roster, name/topic relevance filtering, and per-turn refresh. Historical telemetry (`ai_usage_tracking` 30d + 90d windows, 13 lila_* feature_keys active, zero monotonic token-rise trends, `lila_general` actually dropped 2535→960 March→April) shows P4 operating correctly where applied; both bypass sites have **zero lifetime production calls**, so the defect is latent. `lila_conversations.token_usage` is all-NULL — same observability gap previously flagged in F11 §4.3. **Headline verdict: one consolidated finding (SCOPE-4.F8) for 2 non-shared context-load paths; recommend retrofit onto `loadRelationshipContext` (not `assembleContext`) given both sites need person-targeted relationship context for a values/advisor framing.** P9 dependency flags: the same 2 bypass sites break P9 per-turn refresh by definition — pre-scoped for Round 9's worker.

## context-assembler.ts structural check

File: [`supabase/functions/_shared/context-assembler.ts`](../supabase/functions/_shared/context-assembler.ts) (705 lines)

| Spec section (ai_patterns.md) | Required behavior | Code location | Match? |
|---|---|---|---|
| L96–103 Layer 1 (~200 tokens) | Family roster + current user + feature context always loaded | L223–244 (roster) + L437–442 (return shape with `featureContext` pass-through) | ✓ Strict |
| L105–113 Layer 2 Trigger A (Name Detection) | Word-boundary regex over display_name + nicknames, case-insensitive, scans current message + last 4 history turns | `detectMentionedMembers` L148–181 + detection text build L248–251 | ✓ Strict; matches Convention #79 |
| L114–125 Layer 2 Trigger B (Topic Matching) | Keyword patterns → archive folder / source-table categories; ≥ 10 patterns; default "top 5 Guiding Stars" when no topic | `TOPIC_PATTERNS` L85–138 (13 patterns, exceeds minimum); `detectTopics` L190–198; default-baseline at L272–274 | ✓ Enhanced (13 patterns vs 10 specified, all 10 ai_patterns.md examples present) |
| L127–132 Layer 3 (Search Only) | Semantic RPCs; never bulk load | `loadBookShelfContext` at L458–538 uses `get_bookshelf_context` RPC; no bulk `.select('*').from('bookshelf_chunks')` anywhere | ✓ Strict |
| L153–164 Per-tool overrides | Each tool declares always-loaded context beyond Layer 1 | `alwaysIncludeMembers` + `alwaysIncludeCategories` options (L41–44) + `maxItemsPerMember`/`maxGuidingStars`/`maxSelfKnowledge` (L45–50) | ✓ Strict (caller-supplied) |
| L167–170 Three-tier toggles | Person → folder → item `is_included_in_ai` chain | `loadFilteredArchive` L544–647: person L558–569; folder L572–577; item-level `.eq('is_included_in_ai', true)` at every source query (guiding_stars L282, self_knowledge L312, archive items L620, faith L384, lists L669) | ✓ Strict; Convention #74 preserved |
| L170 Privacy Filtered hard constraint | `is_privacy_filtered=true` excluded for non-mom unconditionally | `applyPrivacyFilter` helper imported from `privacy-filter.ts`; invoked at L623 with role-asymmetric `requesterIsMom` per Convention #76 + RECON Decision 6 | ✓ Strict |
| L170 Safe Harbor exemption | `is_safe_harbor=true` conversations exempt from aggregation | Not assembler's responsibility — Safe Harbor conversations never call assembler; exemption is upstream at conversation routing (no Edge Function named safe-harbor; Safe Harbor flows through lila-chat with mode filter, and lila-chat's assembleContext call itself does not read `lila_conversations.is_safe_harbor` — safe). No bulk read of `lila_conversations` without `is_safe_harbor=false` filter inside context-assembler. | ✓ Strict — out-of-scope for P4 |
| `loadedSources` explainability metadata | Every load records source, member, reason, count | L53–58 interface + emission at L240, L293, L323, L365, L387, L403, L428 | ✓ Strict; matches F11 §4.1 capability inventory |

**No deviation from spec.** Structure is a pixel-perfect realization of ai_patterns.md L96–166.

---

## Edge Function consumer table

Enumerated via `Glob supabase/functions/lila-*/index.ts` + `bookshelf-discuss` + grep `assembleContext\(` and `loadRelationshipContext\(`. 15 lila-* Edge Functions + 1 bookshelf-discuss = 16 relevant functions.

| Edge Function | File:line | Loader used | Per-tool override | Verdict | Notes |
|---|---|---|---|---|---|
| `lila-chat` | [index.ts:385](../supabase/functions/lila-chat/index.ts#L385) | `assembleContext` directly | featureContext for meeting mode; name+topic detection per turn | **Applied** | Dispatches for `general`, `help`, `assist`, `optimizer`, `meeting`, and all guided modes routed through it. |
| `lila-message-respond` | [index.ts:159](../supabase/functions/lila-message-respond/index.ts#L159) | `assembleContext` directly | `alwaysIncludeMembers: participantIds.filter(id => id !== sender.id)` — other participants always loaded | **Applied** | featureContext describes messaging thread; correct shape. |
| `bookshelf-discuss` | [index.ts:566](../supabase/functions/bookshelf-discuss/index.ts#L566) | `assembleContext` directly + separate `buildBookContext` for Layer 3 book search | book metadata + hearted extractions via book-context builder running in parallel | **Applied** | Matches ai_patterns.md L160 per-tool override exactly — family/user context via assembler, book content via dedicated `buildBookContext` → Layer 3 `match_bookshelf_chunks` + `get_bookshelf_context`. |
| `lila-cyrano` | [index.ts:216](../supabase/functions/lila-cyrano/index.ts#L216) | `loadRelationshipContext` (via `_shared/relationship-context.ts`) | partner always included via `personIds` from UI selector | **Applied** | Relationship helper internally calls `detectTopics` from context-assembler. Layer 1 family roster is implicit in the loaded `members` array; topic relevance drives `guidingStarsLimit` (5 default, 20 under goals/intentions topic). Privacy filter `applyPrivacyFilter` used on archive + veto loads. |
| `lila-higgins-say` | [index.ts:217](../supabase/functions/lila-higgins-say/index.ts#L217) | `loadRelationshipContext` | multi-person via `personIds`; topic filtering | **Applied** | Same helper as Cyrano. |
| `lila-higgins-navigate` | [index.ts:215](../supabase/functions/lila-higgins-navigate/index.ts#L215) | `loadRelationshipContext` | multi-person via `personIds`; topic filtering | **Applied** | Same helper. |
| `lila-quality-time` | [index.ts:115](../supabase/functions/lila-quality-time/index.ts#L115) | `loadRelationshipContext` | partner always included | **Applied** | Love Language tool. |
| `lila-gifts` | [index.ts:105](../supabase/functions/lila-gifts/index.ts#L105) | `loadRelationshipContext` | partner always included; wishlist loaded per-person | **Applied** | Love Language. Wishlist loaded when mentioned (see `loadPersonWishlistItems` L437–477). |
| `lila-observe-serve` | [index.ts:105](../supabase/functions/lila-observe-serve/index.ts#L105) | `loadRelationshipContext` | partner always included | **Applied** | Love Language. |
| `lila-words-affirmation` | [index.ts:112](../supabase/functions/lila-words-affirmation/index.ts#L112) | `loadRelationshipContext` | partner always included | **Applied** | Love Language. |
| `lila-gratitude` | [index.ts:129](../supabase/functions/lila-gratitude/index.ts#L129) | `loadRelationshipContext` | partner always included | **Applied** | Love Language. |
| `lila-mediator` | [index.ts:294, 297, 300](../supabase/functions/lila-mediator/index.ts#L294) | `loadRelationshipContext` (+ `loadFullPictureContext` for full_picture mode) | context mode varies (8 modes); person_ids per caller | **Applied** | Three branches all use `loadRelationshipContext`. Full-picture mode adds a multi-perspective relationship-notes layer over the base context. |
| `lila-perspective-shifter` | [index.ts:178](../supabase/functions/lila-perspective-shifter/index.ts#L178) | `loadRelationshipContext` | `personIds` optional (family-context lenses synthesize family context without quoting — PRD-34 convention #98 enforced upstream) | **Applied** | Same helper. |
| `lila-translator` | n/a | **None** (single-turn text rewrite) | No family context by design — ai_patterns.md L164 does not name translator | **Applied-by-design** | Haiku single-turn; no conversation history; no context load. Matches PRD-34 §Translator. |
| `lila-decision-guide` | [index.ts:25–81](../supabase/functions/lila-decision-guide/index.ts#L25) | **Own `loadDecisionContext` helper — bypasses assembler** | Unconditional bulk load of 20 guiding_stars + 20 best_intentions + 15 self_knowledge; no Layer 1 roster; no name/topic relevance filtering; no privacy filter on self_knowledge (item-level `is_included_in_ai` honored but no `is_privacy_filtered` guard) | **Not applied** | Conversational Sonnet tool. See Finding SCOPE-4.F8 site 1. |
| `lila-board-of-directors` | [index.ts:420–433](../supabase/functions/lila-board-of-directors/index.ts#L420) | **Inline bulk loads — bypasses assembler** | Unconditional 10 guiding_stars + 10 best_intentions + 10 self_knowledge concatenated into `userContext` string; no Layer 1 roster (bypasses ai_patterns.md L96–103); no name/topic relevance filtering; no privacy filter; context string passed verbatim to every advisor's Sonnet call AND the moderator (N × Sonnet amplification). | **Not applied** | Conversational Sonnet tool with multi-advisor per turn. See Finding SCOPE-4.F8 site 2. |

**Summary:** 14 applied, 2 not applied. 0 ambiguous. Both not-applied sites are ThoughtSift tools that predate or landed alongside the 2026-04-01 refactor that migrated other LiLa functions to the shared assembler (commit 9f29ff6 per F11 §2).

---

## Bulk-load anti-pattern scan

Grep patterns: `.from('archive_context_items')`, `.from('guiding_stars')`, `.from('self_knowledge')`, `.from('best_intentions')`, `.from('archive_member_settings')`, `.from('archive_folders')`, `.from('journal_entries')`, all restricted to `supabase/functions/**`.

| Site | Disposition | Notes |
|---|---|---|
| `_shared/context-assembler.ts` L278, L308, L544+, L378 | **Legitimate** — the assembler itself. |
| `_shared/relationship-context.ts` L139, L148, L157, L282, L296, L416, L668 | **Legitimate** — helper used by 11 LiLa Edge Functions; applies the same 3-layer discipline (roster load L87–92 via `family_members`; topic relevance via `detectTopics` import; privacy filter applied at archive + veto sites). |
| `bookshelf-study-guide/index.ts:85–94` | **Legitimate non-context surface** — study guide generation is a child-specific personalization load, scoped by `target_member_id` + `is_included_in_ai=true` + privacy filter + LIMIT 10. Not a conversational LiLa tool; outside P4 scope per Gameplan line 313 ("context loading for model calls"). Already passed Scope 4 P7 round (Round 7 enumerated this site as applying P7 correctly via LIMIT). |
| `celebrate-victory/index.ts:34–70` (guiding_stars, best_intentions, self_knowledge loaders) | **Legitimate non-context surface** — one-shot victory celebration synthesis, primary-member own context only, narrow scope (`.in('category', ['strength','growth_area','personality_type'])` on self_knowledge). Not conversational; not a P4 consumer. |
| `scan-activity-victories/index.ts:83, 95` | **Legitimate non-context surface** — aggregation/scan function per Round 7 P7 pass (LIMIT 100 + period bounds). |
| `lila-decision-guide/index.ts:30, 47, 65` | **SHORTCUT — P4 not applied.** See F8 site 1. |
| `lila-board-of-directors/index.ts:420, 423, 426` | **SHORTCUT — P4 not applied.** See F8 site 2. |

`.from('journal_entries')` returned 0 hits — per ai_patterns.md L128 ("Journal entries (future: semantic search RPC)") journal content is correctly never bulk-loaded anywhere in `supabase/functions/**`. Not a gap because no Edge Function currently needs journal context and the future landing target is a Layer 3 RPC, not a bulk load.

---

## Historical telemetry

Read-only SELECTs against production `ai_usage_tracking` per Round 0 founder dispatch shape.

### Per-feature_key 30-day snapshot (2026-03-21 → 2026-04-20)

| feature_key | calls | total_tokens | avg_tokens | max_tokens | total_cost |
|---|---|---|---|---|---|
| lila_cyrano | 20 | 54,473 | 2,724 | 3,113 | $0.2114 |
| lila_general | 18 | 33,029 | 1,835 | 5,056 | $0.1592 |
| lila_assist | 4 | 18,581 | 4,645 | 5,513 | $0.0075 |
| lila_higgins_say | 9 | 18,474 | 2,053 | 2,863 | $0.0692 |
| lila_optimizer | 6 | 16,405 | 2,734 | 4,711 | $0.0749 |
| lila_higgins_navigate | 6 | 12,696 | 2,116 | 2,367 | $0.0420 |
| lila_perspective_shifter | 8 | 11,410 | 1,426 | 1,506 | $0.0532 |
| lila_gratitude | 7 | 10,514 | 1,502 | 1,588 | $0.0414 |
| lila_translator | 29 | 10,062 | 347 | 431 | $0.0040 |
| lila_mediator | 6 | 7,432 | 1,239 | 1,501 | $0.0303 |
| lila_quality_time | 2 | 3,613 | 1,807 | 1,951 | $0.0176 |
| lila_observe_serve | 2 | 3,533 | 1,767 | 1,805 | $0.0199 |
| lila_words_affirmation | 2 | 3,184 | 1,592 | 1,740 | $0.0155 |
| lila_gifts | 2 | 2,975 | 1,488 | 1,645 | $0.0143 |
| **lila_decision_guide** | **0** | — | — | — | — |
| **lila_board_of_directors** | **0** | — | — | — | — |

**lila_decision_guide and lila_board_of_directors have zero lifetime production calls** (separate query confirmed `SELECT ... FROM ai_usage_tracking WHERE feature_key IN (...) GROUP BY feature_key` returned an empty result set). Both bypass sites are latent defects with no current cost exposure. This matches F4 (Round 6) observation that Board of Directors feature is "built but unused in beta" (live_schema.md `board_sessions` = 0 rows).

### Month-over-month avg-token trend (lila-* keys, last 90 days)

No monotonic rise. Notable changes:
- `lila_general`: 2,535 (March) → 960 (April) — **58% drop**, likely reflects shorter conversations during April beta sessions, not context bloat.
- `lila_cyrano`: 2,786 → 2,672 — stable.
- `lila_higgins_say`: 2,405 → 1,952 — slight drop.
- `lila_assist`: 5,371 → 3,920 — drop.

**P4 applied-correctly signal:** If layered context were silently regressing (e.g., a new Edge Function bulk-loading), we'd expect one or more keys to show monotonic token-per-call increases as families accumulate more archive content. Observed pattern is flat-to-declining across the board. **Consistent with P4 operating correctly at all applied sites.**

### loadedSources observability gap

`lila_conversations.token_usage` column queried across all recent conversations returned all-NULL rows — the assembler's `loadedSources` metadata is captured in memory per-turn but never persisted. This matches the F11 §4.3 Scope 4 carry-forward note ("natural observability hook for any Scope 4 attempt to quantify the optimization impact") — the hook exists but isn't wired. **Not a P4 defect; is a telemetry gap.** Downstream observability hardening opportunity (same shape as F1 telemetry note about unwired `lila_messages.metadata.classified_by`). Recording here as a non-finding observation.

---

## P9 dependency flags

Per the dispatch guidance, P9 (Round 9) re-audits per-turn sliding-4-message behavior. P4 findings that also break P9 are flagged here so Round 9's worker can narrow scope:

- **`lila-decision-guide` is a P9 miss by extension.** `loadDecisionContext` runs once per turn but with no detection text, no 4-message window, and no topic-relevance gating — so there is no per-turn re-evaluation to verify. Whatever context is loaded turn 1 is identical on turns 2–N (minus trivial count-threshold changes). Round 9 does not need to separately audit this site — the bypass finding (F8) subsumes it. Fix scope for F8 (retrofit onto `loadRelationshipContext`) also resolves the P9 gap.
- **`lila-board-of-directors` is a P9 miss by extension.** Same structural defect: context loaded once per turn unconditionally, no detection window, no relevance refresh. Also subsumed by F8.
- **All 14 applied sites pass the P9 prerequisite check** (assembleContext / loadRelationshipContext both build the detection text from `userMessage + recentMessages.slice(-4)`). Round 9 can skip per-site re-verification of these sites and focus on actual turn-to-turn behavior of the 14 correctly-instrumented consumers.

---

## Unexpected findings

1. **Two context-load helpers coexist in `_shared/`:** `context-assembler.ts` (`assembleContext`) and `relationship-context.ts` (`loadRelationshipContext`). Both apply P4 correctly. They are not duplicative in purpose — assembleContext is the generic "any LiLa conversation" loader; relationship-context is specialized for PRD-21 communication tools that always have a person-target (partner, specific family member) and need connection-preference extraction (gift_ideas, meaningful_words, etc.) that generic context doesn't surface. **Not a defect.** Worth documenting alongside the F11 PRD-05 amendment: there is a two-helper architecture, each handling a distinct shape of context need.
2. **`relationship-context.ts` re-uses `detectTopics` from `context-assembler.ts` (L7 import)** but **does NOT re-use `detectMentionedMembers`** — name detection in relationship tools is purely caller-supplied via the `personIds` parameter. This is intentional: relationship tools always have a pre-selected person target from the UI; ambient name-mention in a message shouldn't change the tool's focus mid-conversation. Different-by-design. Confirms ai_patterns.md L155 per-tool override table treats Love Language tools as "Partner always included" rather than "name detection."
3. **`loadFullPictureContext` in `lila-mediator/index.ts`** (called at L293 for the primary-parent-only full_picture context mode) loads multi-perspective relationship-notes. Not inspected line-by-line for P4 but structurally it layers on top of a `loadRelationshipContext` call (L294) — Layer 2 + mode-specific augmentation. Acceptable pattern.
4. **`bookshelf-study-guide` uses a direct `archive_context_items` load** (L85–94) not routed through assembler. Scoped child-specific context for a study-guide generator (not conversational LiLa). Applies three-tier item-level filter + privacy filter + LIMIT 10. Within P4 spec as a non-conversational scoped load. No finding.
5. **`lila-message-respond` uses `alwaysIncludeMembers` to force-load conversation participants' context** — correct usage of the per-tool override mechanism for a messaging context (you always want to know who else is in the conversation). Good pattern reference for future tool implementations.

---

## Proposed consolidation

**One finding per PLAN §5.1 default.**

### SCOPE-4.F8 (proposed) — ThoughtSift Decision Guide and Board of Directors bypass the shared 3-layer context assembler

Two conversational Sonnet tools each carry their own parallel context-load path predating / alongside the 2026-04-01 shared-assembler refactor (commit 9f29ff6 per F11 §2) that migrated 14 other LiLa Edge Functions onto `_shared/context-assembler.ts`. Both remaining bypass sites miss all four invariants of the P4 architecture:

1. **No Layer 1 family roster load** — the Sonnet call cannot correctly reference other family members by name because the roster never enters the prompt. This is a correctness gap for Decision Guide when a user mentions a family member as a decision stakeholder, and for Board of Directors when an advisor persona reasons about the user's family situation.
2. **No Layer 2 name detection or topic matching** — context is loaded identically every turn, regardless of whether the conversation shifted topic or mentioned a new person. Violates Convention #105 (P9) per-turn refresh discipline.
3. **No three-tier `is_privacy_filtered` exclusion** — both sites filter on item-level `is_included_in_ai=true` but neither applies `applyPrivacyFilter`, so when a non-mom member runs these tools (decision_guide is mom-only in practice per feature_key_registry; board_of_directors is not explicitly restricted), privacy-filtered self_knowledge items could leak. Latent until the feature is used by non-mom members.
4. **Unconditional bulk load of up to 45 context items** (Decision Guide: 20+20+15; BoD: 10+10+10) regardless of conversation relevance — opposite of the "LiLa appears smarter by knowing less at the right time" principle (ai_patterns.md L10).

**Shared root cause:** Both Edge Functions appear to have been authored before or during the 2026-04-01 shared-assembler migration and never retrofitted. Diff evidence: F11 §2 notes "pre-refactor, several Edge Functions (notably lila-chat, which shed 247 lines in the commit diff) carried their own ad-hoc context loading — the 8-step PRD-05 pipeline was the design, but the de facto implementation had already fragmented per tool." These two ThoughtSift tools are the remaining fragments.

**Single fix scope for both sites:**

Both tools fit the "conversational + values-oriented + potentially person-scoped" shape served by `loadRelationshipContext`, not the generic `assembleContext`. Decision Guide needs values (guiding_stars + best_intentions) + identity (self_knowledge) + optional person context when a decision involves specific family members. Board of Directors needs the same + the persona advisor framing in the system prompt.

Recommendation (subject to founder adjudication): **retrofit both onto `loadRelationshipContext`** rather than `assembleContext`:
- Decision Guide: `loadRelationshipContext(familyId, memberId, [], 'decision_guide', content, recentMsgs)` — no default person target; names detected per turn will add person context automatically.
- Board of Directors: `loadRelationshipContext(familyId, memberId, [], 'board_of_directors', content, recentMsgs)` — same shape. The multi-advisor prompt amplification (N Sonnet calls × context tokens) becomes cheaper by definition once the context is relevance-filtered.

Alternatively, if founder prefers a narrower fix: migrate both to `assembleContext` with the current max-limit parameters (`maxGuidingStars: 20`, `maxSelfKnowledge: 20`) to preserve existing Sonnet-available info while getting Layer 1 roster + name/topic relevance + privacy filter + per-turn refresh "for free."

**Classification:** Unintentional-Fix-Code. Supersedable by the same rationale F1 is classified this way — the shared abstraction exists, these sites just never migrated to it.

**Severity:** Low. **Zero lifetime production calls** at both sites (ai_usage_tracking confirmed). No current cost exposure. No current privacy exposure (decision_guide is mom-only; BoD board_sessions = 0 rows per live_schema.md). Defect is latent until either feature sees real beta usage. Upgrade severity to Medium if either feature ships to founding families for validation testing before the fix lands.

**Beta Readiness: N** per PLAN §7 — no Sonnet call on child-facing surface (both mom-facing tools), no context bulk-load on Guided/Play shell, no >$5/family/month projection (zero current usage). Cost ceiling not breached. Fix should land before either feature graduates from "built but untested in production" state.

**Fix scope:**

- (a) **Retrofit `lila-decision-guide/index.ts` L25–81** to call `loadRelationshipContext` (or `assembleContext`). Remove the `loadDecisionContext` helper. Per-tool override for Decision Guide: detected-topic-based values loading is naturally covered by `loadRelationshipContext`'s `guidingStarsLimit` bump from 5 → 20 when `guiding_stars`/`best_intentions` topic is detected. Adjust the system-prompt template to read `ctx.userContext.selfKnowledge` + `ctx.guidingStars` + `ctx.bestIntentions` from the relationship-context result instead of the concatenated string.
- (b) **Retrofit `lila-board-of-directors/index.ts` L420–433** to call `loadRelationshipContext`. Pass the result through `formatRelationshipContextForPrompt` once, reuse the formatted string for every advisor's system prompt (already the current pattern, just with the shared helper supplying the string). Moderator call already uses the same `userContext` — retrofit is transparent to the existing multi-advisor flow.
- (c) **Add a regression test fixture** covering "Decision Guide and Board of Directors both load Layer 1 roster" + "Both respect `is_privacy_filtered` for non-mom requester" + "Both re-evaluate context per turn based on sliding 4-message window" — parallels the F4 test fixtures and the F1 classify_by_embedding visibility fixture.
- (d) **Amend CLAUDE.md Convention #105** (P9 Per-Turn Semantic Refresh) to add: "ALL context-loading LiLa Edge Functions MUST route through `_shared/context-assembler.ts` OR `_shared/relationship-context.ts`. No Edge Function may define its own context-load helper." This closes the architectural drift surface that allowed these two sites to exist.
- (e) **Observability hardening (out-of-scope for F8 but worth sequencing with it):** wire `loadedSources` metadata from assembler + equivalent telemetry from `loadRelationshipContext` into `lila_messages.metadata.loaded_sources` or `lila_conversations.context_snapshot.loaded_sources` so future Scope 4 passes can quantify optimization impact directly rather than inferring from token trends. Parallel to F1's telemetry recommendation for `classified_by`.

**Cross-references:**
- F11 (Scope 2 closed) §2 provenance timeline — commit 9f29ff6 migrated 14 Edge Functions; these 2 were missed.
- F4 (Round 6) — Board of Directors had separate findings on persona-cache tenancy. F8 is distinct from F4: F4 is about persona caching architecture; F8 is about user-context-load architecture. Both fixes touch `lila-board-of-directors/index.ts` but at different lines and with different root causes. Fixes can land independently or together.
- F11 §7 follow-up question 1 (`lila_guided_modes.context_sources` steering field) — orthogonal to F8. F8 is about *whether* the assembler runs; F11-§7-1 is about *how* the assembler is parameterized when it runs.
- Round 9 P9 — F8 subsumes the P9 miss at both sites; Round 9 does not need to separately emit.

---

## Orchestrator adjudication

_(leave blank for founder/orchestrator to fill during walk-through)_
