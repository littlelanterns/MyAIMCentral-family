---
Status: COMPLETE — awaiting orchestrator adjudication
Stage: C
Scope: 4
Pattern: P9 — Per-Turn Semantic Refresh
Opened: 2026-04-20
ai_patterns.md reference: L201 (pattern entry); L159–172 (applied-correctly shape + sites)
Convention anchor: CLAUDE.md Convention #105
F8 dependency: Round 4 pre-narrowed `lila-decision-guide` + `lila-board-of-directors` as F8-resolved (P4 bypass ⇒ P9 bypass by extension)
Dynamic evidence: historical `ai_usage_tracking` / `lila_messages.metadata` / `lila_conversations.context_snapshot` (read-only, founder-approved)
---

# Scope 4 — P9 Per-Turn Semantic Refresh Evidence Pass

## Worker summary

P9 (sliding 4-message detection window re-evaluated per turn) is **wired correctly at the shared implementation site and at 13 of 14 F8-applied consumers.** `_shared/context-assembler.ts` L246–266 builds the detection text from `userMessage + recentMessages.slice(-4)` on every invocation; `_shared/relationship-context.ts` L76–80 mirrors the pattern. Both helpers are stateless — every call rebuilds the detection text from scratch, re-runs `detectMentionedMembers` + `detectTopics`, re-evaluates the role-asymmetric privacy filter via `applyPrivacyFilter`, and re-queries Layer 2 sources. No cross-turn caching layer exists; `lila_conversations.context_snapshot` is used strictly as a **flag carrier** (safety_triggered, prayer_questions, involved_member_ids) per Convention #96, never as a cached context blob.

**13 of 14 F8-applied consumers pass the full sliding-4-window detection text correctly.** All 11 `loadRelationshipContext` consumers (lila-cyrano, lila-higgins-say/navigate, lila-quality-time, lila-gifts, lila-observe-serve, lila-words-affirmation, lila-gratitude, lila-mediator, lila-perspective-shifter) follow the same shape: `const recentMsgs = history.slice(-4); loadRelationshipContext(..., content, recentMsgs)`. `lila-chat` passes `recentMessages: history.slice(-4)`. `bookshelf-discuss` passes `recentMessages: conversation_history.slice(-4)` in parallel with a per-turn re-embedding of `userMessage` through `buildBookContext` (match_book_chunks + match_book_extractions both re-query per turn).

**One site (`lila-message-respond`) is a partial P9 miss:** it invokes `assembleContext` per user message (so the P9 per-turn-invocation invariant is satisfied), but it does **not** pass `recentMessages` — the detection text is effectively `[current message]` instead of `[current message + last 4 turns]`. Name or topic mentions in the preceding 4 turns won't surface Layer 2 context on the current turn unless the user repeats them. See "Net-new finding" below. This is the only P9-specific gap beyond F8's two bypass sites.

**BookShelf Discuss per-turn behavior verified:** `buildBookContext` re-embeds `userMessage` on every call via `generateEmbedding(queryText)` at L310 and re-runs `match_book_chunks` + `match_book_extractions` per turn; the retrieval is NOT cached first-turn. `get_book_extractions` (book metadata + hearted extractions) is re-queried per turn but its result set is shape-stable (hearted filters don't depend on conversation state), so refresh is semantic-invariant — appropriate and not a P9 defect.

**Historical telemetry (read-only):** `lila_messages.metadata` does not populate `loaded_sources` or `context_members` in any Edge Function (grep returned zero matches). `lila_conversations.token_usage` all-NULL per Round 4 §"loadedSources observability gap." Per-turn context variation cannot be observed directly in production telemetry. Indirect signal from Round 4: no monotonic token-rise across 30-day `lila_*` feature_key sample; `lila_general` actually dropped 58% March→April. No drift signal consistent with P9 staleness.

**Headline verdict:** P9 applied correctly at 13 of 14 F8-passing consumers + shared assembler + bookshelf-discuss. One net-new partial-miss finding for `lila-message-respond` (missing `recentMessages` parameter, ~1-line fix). F8's two bypass sites (`lila-decision-guide`, `lila-board-of-directors`) are cited as P9 miss resolved by F8 — no re-emission.

---

## `assembleContext()` per-turn behavior verification

File: [`supabase/functions/_shared/context-assembler.ts`](../supabase/functions/_shared/context-assembler.ts) (705 lines)

### Signature and per-turn-window mechanic

```ts
export async function assembleContext(
  options: ContextAssemblyOptions,
): Promise<AssembledContext>
```

Options (L32–51) accept:
- `userMessage` (current turn text) — required
- `recentMessages?` (last 2–4 messages per inline comment L37) — optional, defaulted to `[]` at L211

**Detection text construction (L246–251):**
```ts
const detectionText = [
  userMessage,
  ...recentMessages.slice(-4).map(m => m.content),
].join(' ')
```

The `.slice(-4)` guarantees a sliding window even if the caller passes more than 4 messages. Both `detectMentionedMembers(detectionText, roster)` (L254) and `detectTopics(detectionText)` (L263) operate on this per-turn-rebuilt text. No memoization, no inter-invocation cache. Every call rebuilds from scratch.

### Per-turn invariant enforcement

| Invariant | Per-turn evaluation site | Status |
|---|---|---|
| Convention #74 three-tier `is_included_in_ai` (person/folder/item) | `loadFilteredArchive` L558–625 runs all three tier queries every call | ✓ Per turn |
| Convention #76 `is_privacy_filtered` hard constraint | `isPrimaryParent` + `applyPrivacyFilter` at L613, L623 — role check re-fires per call (no memoization of `requesterIsMom`) | ✓ Per turn |
| Convention #6 Safe Harbor exemption | Upstream at conversation routing — assembler never reads `lila_conversations.is_safe_harbor`, and Safe Harbor conversations never invoke assembler | ✓ Structural (out-of-scope for P9) |
| Convention #7 Crisis Override (global) | Upstream at Edge Function entry — `detectCrisis(content)` fires BEFORE `assembleContext` in all 15 tested consumers (lila-chat L297, lila-cyrano L197, lila-mediator L248, etc.). Each turn's `content` is re-scanned | ✓ Per turn |
| Convention #105 sliding 4-message window | `recentMessages.slice(-4)` at L250 | ✓ Strict |

**No invariant is cached at conversation create time.** The only inter-turn state accessed is `lila_conversations.context_snapshot` — read by `lila-mediator` for `safety_triggered` (a single-event state machine flag, per Convention #96), `lila-higgins-say/navigate` for `involved_member_ids` (a person-list additive to caller-supplied `personIds`), and `lila-board-of-directors` for `prayer_questions` (single-event generated content). **None of these are context caches; all are flag/state carriers.** The distinction PLAN §(Step 6) warned against — diagnostic snapshot vs cache — lands firmly on "flag carrier" in every site.

### Stateless helper guarantee

`assembleContext` is a pure function of (familyId, memberId, userMessage, recentMessages, featureContext, override options). It issues fresh Supabase queries every call. No module-level cache, no conversation-scoped cache, no member-scoped cache. A second invocation with different `userMessage` or different `recentMessages` will trivially produce different `loadedSources` and different `relevantContext` — the P9 re-evaluation guarantee is **structurally enforced by the stateless function shape**, not by any explicit cache-invalidation logic.

---

## Edge Function consumer table — per-turn invocation + sliding window shape

14 of 16 LiLa Edge Functions apply P4 correctly per Round 4 F8 evidence. For P9, I checked whether each of the 14 passes the sliding 4-message window to its chosen context loader. The 2 F8 bypass sites (`lila-decision-guide`, `lila-board-of-directors`) are cited as resolved-by-F8 per PLAN guidance.

| Edge Function | Per-turn `assembleContext`/`loadRelationshipContext` call? | `recentMessages` passed? | Window shape | Verdict | Evidence (file:line) |
|---|---|---|---|---|---|
| `lila-chat` | ✓ Per user message (after crisis check) | ✓ Yes | `history.limit(20).slice(-4)` | **Applied** | [lila-chat/index.ts:374–391](../supabase/functions/lila-chat/index.ts#L374) |
| `lila-message-respond` | ✓ Per user message | **✗ No** — parameter omitted | Detection text = `[userMessage]` only (1-turn effective window) | **Partial miss — net-new finding SCOPE-4.F9** | [lila-message-respond/index.ts:159–165](../supabase/functions/lila-message-respond/index.ts#L159) |
| `bookshelf-discuss` | ✓ Per user message + parallel `buildBookContext` re-embedding | ✓ Yes | `conversation_history.slice(-4)` | **Applied** | [bookshelf-discuss/index.ts:566–572](../supabase/functions/bookshelf-discuss/index.ts#L566) |
| `lila-cyrano` | ✓ Per user message | ✓ Yes | `history.limit(30).slice(-4)` | **Applied** | [lila-cyrano/index.ts:215–216](../supabase/functions/lila-cyrano/index.ts#L215) |
| `lila-higgins-say` | ✓ Per user message | ✓ Yes | `history.slice(-4)` | **Applied** | [lila-higgins-say/index.ts:216–217](../supabase/functions/lila-higgins-say/index.ts#L216) |
| `lila-higgins-navigate` | ✓ Per user message | ✓ Yes | `history.slice(-4)` | **Applied** | [lila-higgins-navigate/index.ts:214–215](../supabase/functions/lila-higgins-navigate/index.ts#L214) |
| `lila-quality-time` | ✓ Per user message | ✓ Yes | `history.slice(-4)` | **Applied** | [lila-quality-time/index.ts:113–115](../supabase/functions/lila-quality-time/index.ts#L113) |
| `lila-gifts` | ✓ Per user message | ✓ Yes | `history.slice(-4)` | **Applied** | [lila-gifts/index.ts:103–105](../supabase/functions/lila-gifts/index.ts#L103) |
| `lila-observe-serve` | ✓ Per user message | ✓ Yes | `history.slice(-4)` | **Applied** | [lila-observe-serve/index.ts:103–105](../supabase/functions/lila-observe-serve/index.ts#L103) |
| `lila-words-affirmation` | ✓ Per user message | ✓ Yes | `history.slice(-4)` | **Applied** | [lila-words-affirmation/index.ts:110–112](../supabase/functions/lila-words-affirmation/index.ts#L110) |
| `lila-gratitude` | ✓ Per user message | ✓ Yes | `history.slice(-4)` | **Applied** | [lila-gratitude/index.ts:127–129](../supabase/functions/lila-gratitude/index.ts#L127) |
| `lila-mediator` | ✓ Per user message (3 branches, each fires fresh) | ✓ Yes (all 3 branches) | `history.slice(-4)` | **Applied** | [lila-mediator/index.ts:288, 294, 297, 300](../supabase/functions/lila-mediator/index.ts#L288) |
| `lila-perspective-shifter` | ✓ Per user message | ✓ Yes | `history.slice(-4)` | **Applied** | [lila-perspective-shifter/index.ts:174–178](../supabase/functions/lila-perspective-shifter/index.ts#L174) |
| `lila-translator` | N/A — single-turn, no conversation history per PRD-34 | N/A | N/A (Haiku single-shot rewrite, no detection window applicable) | **Applied-by-design** | [per ai_patterns.md L164](../claude/ai_patterns.md#L164) |
| `lila-decision-guide` | Own `loadDecisionContext` helper — bypasses assembler | — (no detection text built) | No window; context loaded unconditionally every call | **Miss resolved by F8** — not separately emitted | [lila-decision-guide/index.ts:25–81](../supabase/functions/lila-decision-guide/index.ts#L25) |
| `lila-board-of-directors` | Inline bulk loads — bypasses assembler | — (no detection text built) | No window; context loaded unconditionally every call | **Miss resolved by F8** — not separately emitted | [lila-board-of-directors/index.ts:420–433](../supabase/functions/lila-board-of-directors/index.ts#L420) |

**Summary:** 13 applied (sliding-4-window correctly passed); 1 partial miss (`lila-message-respond` — per-turn invocation OK but 1-turn effective detection window); 2 full misses covered by F8; 1 applied-by-design (translator).

Grep evidence for the `slice(-4)` pattern (14 hits, covering all applied consumers + assembler + relationship-context helper):

```
_shared/context-assembler.ts:250:    ...recentMessages.slice(-4).map(m => m.content),
_shared/relationship-context.ts:78:    ...(recentMessages || []).slice(-4).map(m => m.content),
lila-chat/index.ts:374:    const recentMessages = ((history || []) as ...).slice(-4)
bookshelf-discuss/index.ts:570:          recentMessages: conversation_history.slice(-4),
lila-cyrano/index.ts:215, lila-higgins-say/index.ts:216, lila-higgins-navigate/index.ts:214,
lila-quality-time/index.ts:113, lila-gifts/index.ts:103, lila-observe-serve/index.ts:103,
lila-words-affirmation/index.ts:110, lila-gratitude/index.ts:127, lila-mediator/index.ts:288,
lila-perspective-shifter/index.ts:174
```

`lila-message-respond` has **zero matches** for `slice(-4)` or `recentMessages` — confirms the parameter is omitted entirely.

---

## BookShelf Discuss per-turn context — dedicated analysis

Per ai_patterns.md L168, BookShelf Discuss has per-turn context assembly separate from `assembleContext`. PLAN §Step 3 asked three specific questions:

| Question | File:line | Behavior | P9 verdict |
|---|---|---|---|
| Does it re-embed the user's current question each turn? | [bookshelf-discuss/index.ts:308–310](../supabase/functions/bookshelf-discuss/index.ts#L308) `const queryText = userMessage ...; const queryEmbedding = await generateEmbedding(queryText)` | Fresh embedding per turn; no caching of the query vector across turns | **P9-compatible** |
| Does it re-run `match_bookshelf_chunks` per turn? | [bookshelf-discuss/index.ts:414–423](../supabase/functions/bookshelf-discuss/index.ts#L414) `match_book_chunks` RPC called inside the per-book loop using the fresh `queryEmbedding` | Per-turn semantic retrieval refresh; threshold 0.3, 8 chunks single-book / 5 chunks multi-book | **P9-compatible** |
| Cross-book semantic extraction search per turn? | [bookshelf-discuss/index.ts:451–465](../supabase/functions/bookshelf-discuss/index.ts#L451) `match_book_extractions` RPC at L452 uses the same fresh `queryEmbedding` | Per-turn refresh | **P9-compatible** |
| Does `get_book_extractions` (hearted + all) re-query per turn? | [bookshelf-discuss/index.ts:342–348](../supabase/functions/bookshelf-discuss/index.ts#L342) | Re-queries per turn. Result is shape-stable (hearted set is conversation-invariant) so refresh is semantically redundant but structurally correct | **Not a defect** — acceptable architectural cost |
| Parallel `assembleContext` call? | [bookshelf-discuss/index.ts:566–572](../supabase/functions/bookshelf-discuss/index.ts#L566) | `assembleContext` runs in `Promise.all` with `buildBookContext`; `recentMessages: conversation_history.slice(-4)` correctly passed | **Applied** |

**Verdict: BookShelf Discuss P9 applied correctly.** Per-turn re-embedding + per-turn RAG retrieval + per-turn 4-window family/user context in parallel. No cache undermines the refresh; all retrievals are fresh every user turn.

One observation worth recording (not a defect): the cost of re-running `get_book_extractions` per turn is non-zero when hearted+extraction volume per book is large (Round 4 P4 historical telemetry shows `bookshelf-discuss` is not in top feature_keys by token use during the 30-day window — not yet a measurable concern, but a future optimization could cache this per conversation and invalidate only on heart-state change).

---

## Historical telemetry — per-turn context variation

### `lila_messages.metadata.loaded_sources` — unwired

Grep `loaded_sources|context_members` across `supabase/functions/**` returned **zero matches.** The assembler's `loadedSources` array (defined at context-assembler.ts L53–58 and built up per turn at L240, L293, L323, L365, L387, L403, L428) is computed in memory but never persisted to `lila_messages.metadata`, `lila_conversations.context_snapshot`, or any ai_usage_tracking column.

**Consequence for P9 direct observability:** Cannot query production for "did loaded_sources vary across turns of the same conversation?" The first-class per-turn provenance hook that would answer P9 observably is architected-in but unwired — same gap noted in Round 1 F1 (`classified_by` field aspirational in code, never populated) and Round 4 F8 §(d) (`lila_conversations.token_usage` all-NULL).

### Indirect signal — per-feature_key token variance

Round 4 §"Month-over-month avg-token trend (lila-* keys, last 90 days)" already established no monotonic token-rise across 14 lila-* feature_keys. `lila_general` dropped 58% March→April; `lila_assist` dropped from 5,371 → 3,920; others stable. **Under P9 applied correctly, tokens should vary per turn based on what's loaded** (name detection and topic shifts change Layer 2 load); monotonic rise would signal silent bulk-loading or broken relevance filtering. Observed pattern rules that out.

### `lila_conversations.context_snapshot` usage pattern — flag carrier confirmed

Grep across `supabase/functions/**` for `context_snapshot` returned 4 files, all flag-carrier usage:

| File:line | Purpose | P9 impact |
|---|---|---|
| [lila-mediator/index.ts:245, 256–258, 271–273, 389–393](../supabase/functions/lila-mediator/index.ts#L245) | `safety_triggered` boolean flag — Convention #96 single-event state. Read per turn, written once on first trigger. | **None** — flag carrier, not context cache. Consistent with PLAN §Step 6 "safety_triggered flag persisted to context_snapshot … is a valid single-event flag use of the column, not a context cache." |
| [lila-board-of-directors/index.ts:601–603](../supabase/functions/lila-board-of-directors/index.ts#L601) | `prayer_questions` string array — generated fresh per session at session creation, read per turn. | **None** — session-lifetime content, not context cache. |
| [lila-higgins-say/index.ts:193–196](../supabase/functions/lila-higgins-say/index.ts#L193) | `involved_member_ids` array — additive to caller-supplied `personIds`. | **None** — person-list additive, not context cache. Caller-supplied `personIds` are still the primary targeting vector; metadata just supplements. |
| [lila-higgins-navigate/index.ts:191–196](../supabase/functions/lila-higgins-navigate/index.ts#L191) | Same as higgins-say | **None** |

**Zero sites use `context_snapshot` to cache context across turns.** The distinction PLAN §Step 6 asked to verify (diagnostic snapshot vs cache) lands cleanly on "flag carrier" at every site.

---

## `context_snapshot` diagnostic-vs-cache analysis

Per PLAN §Step 6: "If this JSONB is populated at conversation create and reused across turns, P9 is structurally broken (context frozen at creation)."

**Verdict: Diagnostic/flag carrier only. P9 not undermined by context_snapshot.**

Evidence:
1. **Written at conversation create:** Zero sites. Grep `context_snapshot.*insert|INSERT.*context_snapshot` returns no matches. Conversations are created by `lila_conversations` INSERTs from client code and various LiLa entry-point Edge Functions; no conversation-create site writes to `context_snapshot`.
2. **Written mid-conversation (single-event transitions):** Yes — the 4 sites above, each writing a **state flag** on a specific triggering event (safety detected, prayer seat configured, person identified from conversation content). Each write is additive/idempotent; never a bulk context dump.
3. **Read per turn and used to skip re-assembly:** **No.** The 4 sites read `context_snapshot` for their specific flag (e.g. `safetyTriggered = contextSnapshot.safety_triggered === true`) and use it to **influence** downstream behavior (enable safety response mode, augment `personIds`, insert prayer-seat content), **not** to skip the per-turn relevance evaluation. Per-turn `assembleContext`/`loadRelationshipContext` invocation still fires in full.
4. **Schema evidence:** `live_schema.md` confirms `lila_conversations.context_snapshot` is a `JSONB` column. No column-level default, no trigger writing to it. Production-sample: per Round 4 query, `lila_conversations.token_usage` is all-NULL and similar pattern expected for `context_snapshot` (but not directly queried — orchestrator may request during adjudication if needed).

**Conclusion:** `context_snapshot` is used as designed per Convention #96. It is a legitimate single-event flag channel, not a caching layer. P9 structural guarantees unaffected.

---

## Unexpected findings

1. **`lila-message-respond` omits `recentMessages` entirely (not just passes empty array).** The parameter signature in `assembleContext` has `recentMessages?: Array<...>` with a default of `[]` at L211 — so the call works, but the detection text becomes `[userMessage].join(' ')` at L248–251 (with the empty spread adding nothing). This is a **partial P9 miss**: per-turn invocation is intact (assembleContext fires every message), but the effective detection window shrinks from 5 messages (current + last 4) to 1 message (current). Symptom: if the sender mentions a family member's name or a topic keyword in an earlier turn and doesn't repeat it in the current turn, that context will NOT load on the current turn. Messaging-specific mitigation: participant IDs are correctly supplied via `alwaysIncludeMembers: participantIds.filter(id => id !== sender.id)` (L164), so the conversation participants' contexts are always loaded regardless of name detection. The miss affects **mentions of non-participant family members** (e.g., Alice messaging Bob about "yesterday Emma did X" — Emma's context only loads on the turn Emma is named).

2. **`get_book_extractions` re-query-per-turn is redundant.** In `bookshelf-discuss/buildBookContext`, the hearted+all extraction fetch does not depend on user message semantics — it's a per-book filter on hearted state + access level. Re-querying per turn is correct for data freshness (if the user hearts something mid-conversation, the next turn picks it up), but costs N RPC calls per turn on N-book discussions. Not a P9 defect; flagged as a future optimization candidate for a dedicated Scope 4 BookShelf cost-pattern pass if one is ever opened.

3. **Observability gap compounds across F1, F8, F9 (this finding).** Three separate findings in Scope 4 Rounds 1, 4, and 9 identify the same shape of latent defect: telemetry fields exist (`classified_by`, `token_usage`, implicitly now per-turn `loaded_sources`) but no writer populates them. Collectively these argue for a **bundled telemetry-hardening fix** during apply-phase sequencing — if F1 fix (a) lands `classified_by` wiring, and F8 fix (d) lands `token_usage` + `loaded_sources` wiring, F9 needs no separate observability work.

4. **`lila-translator` per ai_patterns.md L164:** confirmed correct-by-design. Translator is a single-turn Haiku text rewrite with no conversation history; per-turn refresh is semantically inapplicable because there is no "turn" in the multi-turn sense. PRD-34 §Translator specifies this shape. Recording for completeness — not a miss.

---

## Proposed consolidation

**One finding per PLAN §5.1 default.** The two F8-subsumed bypass sites are cited as resolved-by-F8 (no re-emission per PLAN §8 "Do not re-emit Scope 2 or Scope 3 findings," extended to Scope 4 intra-scope via the F8 dependency-flag protocol in Round 4).

### SCOPE-4.F9 (proposed) — `lila-message-respond` omits `recentMessages` parameter, effectively shrinking P9 sliding window from 5 messages to 1

**Anchor site:** [`supabase/functions/lila-message-respond/index.ts:159–165`](../supabase/functions/lila-message-respond/index.ts#L159)

```ts
const ctx = await assembleContext({
  familyId: sender.family_id,
  memberId: sender.id,
  userMessage: user_message_content,
  featureContext: `Family messaging conversation between: ${participantDesc}`,
  alwaysIncludeMembers: participantIds.filter(id => id !== sender.id),
  // recentMessages: <MISSING>
})
```

**Root cause:** `assembleContext` call at L159 omits the `recentMessages` option. The history fetch at L168–173 happens AFTER the assembleContext call, so even if the author intended to use it, the ordering prevents it. Detection text collapses to `[user_message_content]` only — 1-turn effective window instead of the 5-message sliding window Convention #105 mandates.

**Why the miss was easy to make:** The Edge Function supplies `alwaysIncludeMembers: participantIds...` correctly (force-loading all conversation participants' context), which papers over the P9 miss for the most common case — mentions of conversation participants. The defect surfaces only for mentions of **non-participant family members or topic keywords** that appeared in prior turns but not the current turn.

**Invariants still honored:** Assembler fires per user message (the outer P9 invariant — per-turn invocation — is intact); three-tier `is_included_in_ai` toggles, `is_privacy_filtered` hard constraint, and Safe Harbor/Crisis Override all evaluate per turn because assembleContext itself runs per turn. The defect is scoped to Layer 2 name-detection + topic-matching relevance filtering.

**Classification:** Unintentional-Fix-Code. Single-line fix — reorder the history fetch before the assembleContext call and pass `recentMessages: history.slice(-4)`.

**Severity:** Low. `lila-message-respond` is the in-conversation LiLa helper for messaging (PRD-15). Historical `ai_usage_tracking` does not break out a `lila_message_respond` feature_key (the function writes under generic messaging-context keys per current cost-logger usage), so exact call volume is not readable from the Round 4 30-day snapshot; qualitatively, messaging is low-volume in beta (4 messages in production per live_schema.md `messages` row count). No user-harm shape beyond "LiLa occasionally misses a name reference from two messages ago."

**Beta Readiness: N** per PLAN §7. No Sonnet call on a child-facing surface (messaging coaching is a distinct surface); no context-bulk-load regression; no >$5/family/month projection. One-line fix; can ship with F8 retrofit or independently.

**Fix scope:**

- (a) **Reorder and pass the window.** Move the `history` fetch (L168–173) to before the `assembleContext` call. Compute `const recentMessages = (history || []).slice(-4)` and pass it as `recentMessages: recentMessages` in the assembleContext options. Map messages to `{role, content}` shape consistent with the other consumers.
- (b) **Regression test fixture.** "lila-message-respond sliding-4-window detection: when a non-participant family member is mentioned in turn N-2 only, the assembler's `loadedSources` on turn N includes that member's archive_context." Parallels F8 test fixture for the two bypass sites.
- (c) **Convention #105 amendment sequencing.** If F8 fix (c) amends Convention #105 to "ALL context-loading LiLa Edge Functions MUST route through `_shared/context-assembler.ts` OR `_shared/relationship-context.ts`," add a companion bullet: "AND MUST pass `recentMessages: history.slice(-4)` (or equivalent sliding-4-window shape) to enable Layer 2 per-turn refresh." Closes the drift surface that let this site ship without the window.
- (d) **Observability bundling opportunity.** If F1 fix (c) + F8 fix (d) ship a bundled telemetry-hardening pass (wiring `lila_messages.metadata.loaded_sources`, `classified_by`, and `lila_conversations.token_usage`), F9 fix lands adjacent and no separate observability work is needed. Record the telemetry write in the same commit as the parameter fix to get a regression-visible signal in `loaded_sources` on the post-fix deploy.

**Cross-references:**
- **SCOPE-4.F8 (Round 4)** — F8 resolves P9 at `lila-decision-guide` + `lila-board-of-directors`; F9 is the only remaining P9-specific miss after F8 lands.
- **Convention #105** — amendment proposed alongside F8 (c).
- **PRD-15 §LiLa in conversations** — messaging spec names LiLa as a non-default participant invoked only via "Ask LiLa & Send." Fixing F9 improves the quality of LiLa's replies when mom deliberately asks her into a thread, without changing the PRD-15 invocation surface.

---

## Orchestrator adjudication

_(leave blank for founder/orchestrator to fill during walk-through)_
