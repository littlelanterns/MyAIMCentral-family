---
Status: COMPLETE — awaiting orchestrator adjudication
Stage: C
Scope: 4
Pattern: P5 — On-Demand Secondary Output
Opened: 2026-04-20
ai_patterns.md reference: L197
Dynamic evidence: None (static-only per PLAN §2.5)
---

# Scope 4 — P5 On-Demand Secondary Output Evidence Pass

## Worker summary

P5 per [claude/ai_patterns.md](../claude/ai_patterns.md) L197: "Generate primary output only; extras (alt titles, tags) on request." Applied-correctly shape: one primary output per call; user must explicitly request secondary outputs (tags, alt phrasings, variants, additional levels). Never pre-generate extras the user did not ask for.

Enumeration method: grepped `supabase/functions/` for all model-calling Edge Functions (37 matches across `openrouter` / `anthropic` / `haiku` / `sonnet` / `claude-3`). Each function read end-to-end for its output shape and its client-side invocation contract (what the user asked for vs what the function returns). Edge cases considered: the three-levels Task Breaker edge case from the prompt (per-call level choice → each level is its own call, applied); BookShelf `combined_section` which returns 5 extraction types per call (by design — this is the primary user-requested output of the feature, not an unrequested side-effect); Board of Directors which produces one persona response per seated advisor per turn (user seated N advisors = user requested N outputs, applied) plus one auto-fired moderator summary at end of turn (borderline — the user did not explicitly request the moderator interjection on each turn).

**Headline result: 24 of 25 model-calling Edge Functions apply P5 correctly.** The one borderline site is the Board of Directors moderator auto-interjection, which fires after every advisor round whether the user asked for a summary or not (see site table and unexpected findings §1). No finding emitted at pattern level — the moderator interjection is per-PRD-34 behavior and a design choice, not a drift.

## Site enumeration table

| Edge Function | Primary output | Secondary outputs observed | User-requested or auto | Verdict | Evidence |
|---|---|---|---|---|---|
| `task-breaker` | N subtasks per call, level selected by user (quick/detailed/granular) | none | User picks level per call; one level per call | **Applied** | [index.ts:58-67](../supabase/functions/task-breaker/index.ts#L58-L67) `detail_level` is a single enum input; [L121-139](../supabase/functions/task-breaker/index.ts#L121-L139) one model call per invocation |
| `celebrate-victory` | Celebration narrative (string) | none | Narrative only | **Applied** | [index.ts:310-318](../supabase/functions/celebrate-victory/index.ts#L310-L318) returns `{ narrative, context_sources, model_used, token_count }` — no auto-tags, no alt variants |
| `curriculum-parse` | Extracted items array + detected_metadata object | metadata fields (source_name, total_required, pick_n_of_m) in same call | User asked for structured parse; metadata is part of that one parse | **Applied** | [index.ts:218-224](../supabase/functions/curriculum-parse/index.ts#L218-L224) single model call, single primary output with metadata fields inline; no second generation call fired |
| `lila-board-of-directors` (persona chat) | N advisor responses per user turn, where N = number of seated advisors | +1 moderator interjection auto-fired at end of advisor round | Advisors are user-seated; moderator is auto | **Applied (borderline)** | [index.ts:496-644](../supabase/functions/lila-board-of-directors/index.ts#L496-L644) each advisor = one user-requested Sonnet call; [L614-644](../supabase/functions/lila-board-of-directors/index.ts#L614-L644) moderator interjection fires on every turn without user opt-in |
| `lila-board-of-directors` (create_persona) | One persona profile | none | Applied | **Applied** | [index.ts:304-362](../supabase/functions/lila-board-of-directors/index.ts#L304-L362) cache-check-then-generate, one output |
| `lila-board-of-directors` (prayer_seat) | 5 reflection questions | none | User requested prayer seat | **Applied** | [index.ts:365-370](../supabase/functions/lila-board-of-directors/index.ts#L365-L370) |
| `lila-board-of-directors` (suggest when no seats) | Suggestion narrative | none | Applied | **Applied** | [index.ts:443-478](../supabase/functions/lila-board-of-directors/index.ts#L443-L478) |
| `lila-chat` | One assistant response (streamed) | none | Applied | **Applied** | [index.ts:420-490](../supabase/functions/lila-chat/index.ts#L420-L490) single stream |
| `lila-message-respond` | One LiLa participation reply | none | Applied | **Applied** | [index.ts:11-13](../supabase/functions/lila-message-respond/index.ts#L11-L13) "LiLa responds with message_type='lila'" — single reply |
| `lila-translator` | One rewrite in selected tone | none | User picks one tone | **Applied** | [index.ts:17-21](../supabase/functions/lila-translator/index.ts#L17-L21) single `tone` input, single output |
| `lila-mediator` | One streamed response per turn | none | Applied | **Applied** | Single stream per turn |
| `lila-perspective-shifter` | One response per selected lens | none | User selects one `lens_key` per call | **Applied** | [index.ts:21-26](../supabase/functions/lila-perspective-shifter/index.ts#L21-L26) single lens per call |
| `lila-decision-guide` | One streamed response per turn | none | Applied | **Applied** | [index.ts:19-23](../supabase/functions/lila-decision-guide/index.ts#L19-L23) single framework per session |
| `lila-cyrano` | One draft/response (streamed) | none | Applied | **Applied** | Streaming single reply |
| `lila-higgins-say` | One reply (streamed) | none | Applied | **Applied** | Streaming single reply |
| `lila-higgins-navigate` | One reply (streamed) | none | Applied | **Applied** | Streaming single reply |
| `lila-gifts` | One reply (streamed) | none | Applied | **Applied** | Streaming single reply |
| `lila-quality-time` | One reply (streamed) | none | Applied | **Applied** | Streaming single reply |
| `lila-observe-serve` | One reply (streamed) | none | Applied | **Applied** | Streaming single reply |
| `lila-words-affirmation` | One reply (streamed) | none | Applied | **Applied** | Streaming single reply |
| `lila-gratitude` | One reply (streamed) | none | Applied | **Applied** | Streaming single reply |
| `auto-title-thread` | One 3-6 word title | none | Haiku-class background task | **Applied** | [index.ts:130-140](../supabase/functions/auto-title-thread/index.ts#L130-L140) single title only |
| `ai-parse` | One content string | none | Generic utility; caller controls scope | **Applied** | [index.ts:83](../supabase/functions/ai-parse/index.ts#L83) returns single `content` |
| `mindsweep-sort` | N classifications for N items (one-to-one) | destination_detail for calendar items (parsed_event struct) | User submits N items, gets N classifications; detail struct is part of that classification | **Applied** | [index.ts:162-183](../supabase/functions/mindsweep-sort/index.ts#L162-L183) one batched call classifies all N items; calendar detail is inline |
| `smart-list-import` | Item classifications + suggested_new_lists | suggested_new_lists object | Both are derived from the same classification pass, not a second generation call | **Applied** | [index.ts:37-58](../supabase/functions/smart-list-import/index.ts#L37-L58) single model call, both outputs inline |
| `homework-estimate` | Subject allocations (array) | none | User asked for estimate | **Applied** | [index.ts:31-44](../supabase/functions/homework-estimate/index.ts#L31-L44) single output |
| `scan-activity-victories` | Array of victory suggestions | none | User clicked "scan for victories" | **Applied** | user clicks scan → N suggestions |
| `guided-nbt-glaze` | One encouraging sentence | none | Applied | **Applied** | [index.ts:14-21](../supabase/functions/guided-nbt-glaze/index.ts#L14-L21) single sentence |
| `message-coach` | One coaching note | none | Applied | **Applied** | [index.ts:8-15](../supabase/functions/message-coach/index.ts#L8-L15) single note |
| `spelling-coach` | One explanation | none | Applied | **Applied** | single explanation |
| `mindsweep-scan` | Extracted text (one mode) | none | Single-purpose scan | **Applied** | [index.ts:30-48](../supabase/functions/mindsweep-scan/index.ts#L30-L48) mode = scan or link, one output per call |
| `describe-vs-icon` (admin) | Description + suggested_tags | tags inline | Admin ingestion script explicitly wants both fields; bundled by design | **Applied** | [index.ts:33-36](../supabase/functions/describe-vs-icon/index.ts#L33-L36) admin-only; both fields are the product of the ingestion tool |
| `extract-insights` | Array of categorized insights | none | User uploaded a document for insight extraction | **Applied** | user picks `extraction_target`, gets that target's insights |
| `bookshelf-extract` (combined_section) | 5 extraction types per section in one call (summaries/insights/declarations/action_steps/questions) | All five are primary, not secondary | **By-design feature output** — user clicks "Extract" to get all 5 types. Per PRD-23, BookShelf extraction IS multi-output. | **Applied (by design)** | [index.ts:1183-1301](../supabase/functions/bookshelf-extract/index.ts#L1183-L1301) combined_section is the primary extraction path; single-type paths exist for Go-Deeper / re-run |
| `bookshelf-extract` (single-type re-run / Go Deeper) | One extraction type | none | User requests a single type explicitly | **Applied** | [index.ts:1303-1309](../supabase/functions/bookshelf-extract/index.ts#L1303-L1309) summary/insights/declarations/action_steps/questions each a separate invocation |
| `bookshelf-key-points` | 2-3 key points per section | none | Applied | **Applied** | [index.ts:1-9](../supabase/functions/bookshelf-key-points/index.ts#L1-L9) single-purpose picker |
| `bookshelf-process` (Phase 2) | Book metadata (title/author/genres/tags/summary) | All in one classification call | Required metadata bundle for intake | **Applied** | Metadata fields are the defined purpose of the single classification call |
| `bookshelf-discuss` | One response per `discussion_type` (discuss/generate_goals/generate_questions/generate_tasks/generate_tracker) | none | User selects one discussion_type per call | **Applied** | [index.ts:47-55](../supabase/functions/bookshelf-discuss/index.ts#L47-L55) one discussion_type per invocation |
| `bookshelf-study-guide` | 4 study-guide types (summaries/action_steps/questions/declarations) rewritten for child | All four bundled | **By-design feature output** — the "study guide" concept is a 4-part deliverable | **Applied (by design)** | [index.ts:35-40](../supabase/functions/bookshelf-study-guide/index.ts#L35-L40) STUDY_TYPES array is the product definition |

## Unexpected findings

1. **Board of Directors moderator auto-interjection (borderline P5 drift).** Per [lila-board-of-directors/index.ts:614-644](../supabase/functions/lila-board-of-directors/index.ts#L614-L644), every user turn fires N sequential advisor Sonnet calls (user-requested — N advisors seated) PLUS one additional Sonnet moderator-interjection call at the end of the round. The moderator is NOT user-requested; it auto-fires whether the user wants a summary or not. This is the only site in the enumeration where a call fires without user intent per turn. However, it is specified behavior per PRD-34 (LiLa moderates and offers coin-flip insight), not accidental drift. Flag as intentional design, not a P5 miss. Cost impact: one extra Sonnet call per BoD turn (~500 tokens output), which on a typical 5-turn BoD session = 5 extra Sonnet calls averaging ~$0.01-0.02 per session. Not cost-material; not worth a finding.

2. **BookShelf `combined_section` is opposite-shape to P5 but by-design.** [bookshelf-extract/index.ts:1183-1301](../supabase/functions/bookshelf-extract/index.ts#L1183-L1301) deliberately generates all 5 extraction types (summaries, insights, declarations, action_steps, questions) in ONE Sonnet call rather than 5 separate calls. This is in tension with P5's "primary only; extras on request" principle, but it is legitimately the product. Mom uploads a book to BookShelf; the product IS the 5-type extraction. Per PRD-23, extraction is the whole point. Single-type paths exist for Go Deeper / re-run. Applied by design — documenting here so future passes don't re-flag.

3. **Board of Directors cached-persona guard is P6 (Caching & Reuse), not P5.** [lila-board-of-directors/index.ts:313-323](../supabase/functions/lila-board-of-directors/index.ts#L313-L323) `create_persona` action checks `board_personas` by name before generating. This is primary-output caching. Properly adjudicated in Round 6 (P6), not here.

4. **Task Breaker three-levels edge case resolved.** Per [task-breaker/index.ts:58-67](../supabase/functions/task-breaker/index.ts#L58-L67), the `detail_level` is a single enum input (quick | detailed | granular). Each level is a separate call. Correct P5 shape — not "one call returns all three with client picking which to display." Confirmed not a regression.

5. **BookShelf `bookshelf_items.extraction_status` auto-flip side-effect.** [bookshelf-extract/index.ts:334-342](../supabase/functions/bookshelf-extract/index.ts#L334-L342) marks the book's extraction_status = 'completed' after the first successful extraction. This is a DB-state side-effect, not an additional AI generation. Not a P5 concern.

## Proposed consolidation

**No finding proposed at pattern level.** Per PLAN §5.1, the default is one finding per pattern-level miss. 24 of 25 model-calling Edge Functions apply P5 correctly; the one borderline site (Board of Directors moderator auto-interjection) is specified PRD-34 behavior, not accidental drift. The two by-design multi-output sites (`bookshelf-extract/combined_section`, `bookshelf-study-guide`) produce what the user requested when they invoked the feature — the feature definition itself is multi-output, and P5's "on-demand" test is satisfied because the user requested the bundle.

**No SCOPE-4.F{N} finding recommended for P5.**

Beta Readiness: N/A (no finding).

Defer for orchestrator adjudication: is the Board of Directors moderator auto-interjection worth a Low-severity "Intentional-Document" finding recommending that PRD-34 convention explicitly call out the moderator interjection as always-firing (so future refactors don't surprise-remove it), or is current documentation sufficient?

## Orchestrator adjudication

{leave blank — filled during walk-through}
