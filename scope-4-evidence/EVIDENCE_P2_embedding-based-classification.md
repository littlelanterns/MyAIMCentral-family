---
Status: COMPLETE — awaiting orchestrator adjudication
Stage: C
Scope: 4
Pattern: P2 — Embedding-Based Classification
Opened: 2026-04-20 (re-dispatched 2026-04-21 after prior worker hit API usage cap mid-run)
ai_patterns.md reference: L194 (pattern entry); L218-221 (Model Routing — MindSweep, feedback sentiment, blog comment moderation)
F1 cross-ref: MindSweep-sort P2 state already characterized by SCOPE-4.F1 (0% embedding / 100% Haiku telemetry-confirmed, 2026-04-20); fix scope locked; not re-audited in this pass
Dynamic evidence: historical `ai_usage_tracking` (read-only, founder-approved per DECISIONS.md §Round 0 2026-04-20)
Scope narrowing: widened post-F1 per founder direction 2026-04-20 — focus on OTHER classifier surfaces (feedback sentiment, blog comment moderation, Studio Queue destination suggestion, Notepad Review & Route destination suggestion, MindSweep-Lite, Board of Directors persona pre-screen, any grep-surfaced classifier site)
---

# Scope 4 — P2 Embedding-Based Classification Evidence Pass

## Worker summary

**Pattern definition (ai_patterns.md L194):** "Replace Haiku classifier calls with pgvector semantic queries." Applied-correctly per PLAN §2.2: classification of user-input text uses embedding similarity against a reference corpus (pattern library, template examples, prior-classified items) BEFORE falling back to Haiku. Expected shape: (1) embed user input (~$0.00002), (2) query pgvector similarity against corpus, (3) if top-match ≥ confidence threshold → return embedding classification (no LLM), (4) if below threshold → Haiku fallback. CLAUDE.md line 12 architectural claim: "~90% of routine classification uses pgvector embeddings, not LLM calls."

**Site enumeration method:** (1) F1 handles MindSweep-sort — cited, not re-audited. (2) Grep `supabase/functions/` for classifier-semantic keywords (`classif`, `moderate`, `sentiment`, `destination`, `suggest`) — 39 matches, inspected each. (3) Grep `src/` for callers of `sendAIMessage` + `ai-parse` to surface client-driven classifiers routing through the shared utility. (4) For each candidate, read the code: distinguish pure-generation (not P2) from categorical-enum selection (P2 candidate) from extraction-with-embedded-classification (partial P2). (5) Enumerate Haiku feature_keys for historical telemetry correlation. (6) Cross-reference against unbuilt features (blog moderation per PRD-38, feedback sentiment per PRD-32) to avoid auditing non-existent code.

**Headline result:** Beyond MindSweep-sort (F1), **5 additional classifier sites identified**, **0 applying P2 correctly, 2 unbuilt (feedback sentiment, blog moderation), 3 applied-incorrectly (Haiku-first with no embedding pre-screen)**. The three active misses are:
- **Notepad Review & Route** (`useExtractContent` → `ai-parse` → Haiku) — classifies extracted items into 12 destinations
- **Smart List Import** (`smart-list-import` Edge Function → Haiku) — classifies items into N existing family lists
- **Post Meeting Review** (`PostMeetingReview` → `ai-parse` → Haiku) — extracts action items and classifies each into 7 destinations

All three have the same shape as MindSweep (destination-enum classification from user-input text) but lack even the attempted embedding-first pathway that MindSweep has (which itself fails silently per F1). **No embedding-first classifier site in the codebase is currently functional** — MindSweep's intended pathway is broken by F1; the other three never attempted one. CLAUDE.md line 12 ("~90% of routine classification uses pgvector, not LLM calls") is currently 0/100 across all four classifier surfaces.

**MindSweep-Lite** reuses `mindsweep-sort` entirely per `MindSweepLiteSection.tsx:7-9` comment and L208 invocation — F1 directly propagates. **Board of Directors content_policy_check** is a single-category-classifier (deity/blocked/harmful/approved) with 4 outcomes; the generate-new-persona pathway is already covered by F4 + F5 (P6 cache + embedding-substitution architecture). **Flag for orchestrator:** whether the Haiku-pre-screen for content_policy_check warrants its own P2 adjudication (classifier shape fits; corpus would be "prior approved/blocked persona names" — very small corpus early in platform life).

**Beta Readiness:** Default **N** per PLAN §7. Three active misses each project small-per-family cost at current beta volume (few hundred Haiku calls/month across all families). Combined projected cost impact is approximately $0.05–0.15/family/month when Review & Route and Smart List Import see regular-adoption volume — well under $5/family/month Y-flag threshold. Same post-beta scaling warning applies as F1: adoption ramp multiplies these proportionally.

## Classifier site enumeration table

| Site | Classification semantics | Embedding-first? | Reference corpus status | Haiku fallback? | Verdict | Evidence |
|---|---|---|---|---|---|---|
| **MindSweep-sort** | 13 destinations (task, calendar, shopping, journal, victory, guiding_star, best_intention, backburner, self_knowledge, archive, recipe, travel, list_item) | Attempted via `classify_by_embedding` RPC | `archive_context_items.embedding` column missing → RPC aborts silently; other 4 source tables have populated embeddings but the UNION ALL aborts on the first missing-column hit | Yes — silent `catch {}` at mindsweep-sort/index.ts:129-156 | **Not applied (F1)** — 0% embedding / 100% Haiku per telemetry | SCOPE-4.F1 (2026-04-20). Not re-audited. |
| **MindSweep-Lite (PRD-18 Phase C)** | Same 13 destinations — reuses `mindsweep-sort` infrastructure directly | Inherits MindSweep-sort | Inherits MindSweep-sort — broken per F1 | Inherits MindSweep-sort | **Not applied (F1 propagates)** — no re-audit needed | src/components/rhythms/sections/MindSweepLiteSection.tsx:7-9 ("Reuses the existing `mindsweep-sort` Edge Function (NOT a new simplified 'lite' classifier)") + L208 `supabase.functions.invoke('mindsweep-sort', ...)` |
| **Notepad Review & Route (`useExtractContent`)** | 12 destinations (tasks, journal, best_intentions, victory, calendar, innerworkings, guiding_stars, quick_note, list, track, agenda, message, optimizer) + 9 item_types (action_item, reflection, revelation, value, victory, trackable, meeting_followup, list_item, general) | **No** — direct Haiku call, no embedding pre-screen attempted | No corpus (no classification reference library exists for Review & Route) | N/A — Haiku is primary | **Not applied** | src/hooks/useNotepad.ts:338-396 `useExtractContent` → `sendAIMessage(systemPrompt, [...], 2048, 'haiku')` at L361-366 |
| **Smart List Import (`smart-list-import` Edge Function)** | N existing lists (variable N per family; typical 5-30) + "new list" suggestions | **No** — direct Haiku call, no embedding pre-screen | List title+description corpus exists (would embed well against item text) but is not leveraged; `lists.embedding` column does not exist in schema | N/A — Haiku is primary | **Not applied** | supabase/functions/smart-list-import/index.ts:17 (`MODEL = 'anthropic/claude-haiku-4.5'`) + L19-59 system prompt + L207 `featureKey: 'smart_list_import'` cost log |
| **Post Meeting Review (`buildSummaryPrompt`)** | 7 destinations (tasks, calendar, best_intentions, guiding_stars, list, backburner, skip) for extracted action items | **No** — direct Haiku call, no embedding pre-screen | No corpus (meeting_agenda_items + tasks exist but not embedded as a classification reference) | N/A — Haiku is primary | **Not applied** | src/components/meetings/PostMeetingReview.tsx:46-48 (destination enum in prompt) + L123-126 `sendAIMessage(systemPrompt, ...)` → `ai-parse` Haiku |
| **Archives Bulk Add Sort (`BulkAddSortModal`)** | (member, folder_category) pairs for each extracted fact; folder_category is one of 7 system categories (Preferences, Schedule & Activities, Personality & Traits, Interests & Hobbies, School & Learning, Health & Medical, General) + family_overview subfolders | **No** — direct Haiku call | Folder taxonomy is small and stable (7 system folders per member); `archive_folders` exists with 180 live rows; `archive_context_items.embedding` column is **missing per F1** (same root cause) even though items would be the most natural corpus | N/A — Haiku is primary | **Not applied** | src/components/archives/BulkAddSortModal.tsx:127 (systemPrompt) + L145-148 `sendAIMessage(systemPrompt, ...)` |
| **Board of Directors `content_policy_check`** | 4 outcomes (deity / blocked / harmful_description / approved) | **No** — direct Haiku call per insert | No corpus (would be `board_personas` prior-classified results, but none flagged/rejected yet; content_policy_status approved-only filter in cache means nothing to match against) | N/A — Haiku is primary | **Ambiguous** — 4-category classifier shape fits P2 but early-platform corpus is tiny; may not warrant embedding pre-screen until persona volume justifies | supabase/functions/lila-board-of-directors/index.ts:38-103 `contentPolicyCheck()` → Haiku at L67-73. Handled partly via F4/F5 (persona cache + substitution). |
| **Feedback sentiment classification** (ai_patterns.md L221) | — | — | — | — | **Unbuilt** | No `feedback_submissions` table exists. Only `beta_glitch_reports` (no sentiment column). PRD-32 Admin Console unbuilt. |
| **Blog comment moderation** (architecture.md L167) | positive / negative binary | — | — | — | **Unbuilt** | No `blog-comment-moderate` Edge Function exists. No `blog_comments` table. PRD-38 unbuilt. |

## Per-site deep dives

### Site 1 — MindSweep-sort (F1-handled; not re-audited)

Per orchestrator direction 2026-04-20, **not re-audited**. Full characterization in SCOPE-4.F1 (DECISIONS.md §Round 1):
- 0% embedding hit rate, 100% Haiku fallback confirmed via production `ai_usage_tracking`
- Root cause: `archive_context_items` missing `embedding` column causes the UNION ALL RPC to abort silently; `mindsweep-sort/index.ts:129-156` wraps the RPC call in a bare `try { } catch { }` with no logging
- F1 fix scope (a–e) approved 2026-04-20; MindSweep-Lite inherits the fix automatically via shared code path

### Site 2 — MindSweep-Lite (F1 propagates)

`src/components/rhythms/sections/MindSweepLiteSection.tsx` explicitly reuses `mindsweep-sort` (not a new Edge Function). Comment block at L3-14 states "Mini embedded version of PRD-17B MindSweep... Reuses the existing `mindsweep-sort` Edge Function (NOT a new simplified 'lite' classifier)." Invocation at L208 — `supabase.functions.invoke('mindsweep-sort', { body: requestBody })` with `source_channel: 'rhythm_evening'`. MindSweep-Lite classification behavior is identical to full MindSweep — same 13 destinations, same cross-member detection, same embedding-first attempt (currently broken per F1), same Haiku batch fallback. F1's fix automatically resolves MindSweep-Lite. No distinct P2 finding needed.

### Site 3 — Notepad Review & Route (`useExtractContent`)

**Location:** `src/hooks/useNotepad.ts:335-397` (mutation hook). Called by the Notepad "Review & Route" flow after mom types or voice-captures content and taps [Extract].

**Classifier semantics:** Single Haiku call parses freeform text into a JSON array. For each extracted item, Haiku assigns:
- `text` — cleaned extraction
- `type` — one of 9 (action_item, reflection, revelation, value, victory, trackable, meeting_followup, list_item, general)
- `destination` — one of 12 (tasks, journal, best_intentions, victory, calendar, innerworkings, guiding_stars, quick_note, list, track, agenda, message, optimizer)
- `confidence` — 0.00-1.00

**System prompt (L344-359):** Haiku is told to "extract MORE items rather than fewer," default-to-journal-when-uncertain, and map action items → tasks, emotional insights → journal, personal revelations → innerworkings, goals → best_intentions, accomplishments → victory, shopping → list, dates → calendar, data points → track.

**Embedding-first?** No. `sendAIMessage(...)` at L361-366 is a direct wrapper around the `ai-parse` Edge Function, which is a thin OpenRouter passthrough with no pgvector integration (`supabase/functions/ai-parse/index.ts:46-59`). No embedding corpus is consulted before the Haiku call.

**Corpus potential:** Strong. The 12 destinations are stable categories with well-defined semantics. A reference library of `(example_text, destination, confidence)` triples — pre-embedded, query by cosine similarity — would classify the most common cases (grocery item → list/shopping, appointment reminder → calendar, "I love how Isaac..." → victory) at $0 cost. Only ambiguous or novel items would need Haiku.

**Current cost impact:** Per `ai_usage_tracking` feature_key = `ai_parse` (the shared passthrough logs all sendAIMessage paths under one key unless caller overrides). Cannot attribute Review & Route precisely without dedicated feature_key — another latent observability gap. Cost per extraction call: ~$0.001 (~2048 max tokens, typical 300-800 input + 400 output). Beta volume: low (`notepad_extracted_items` has 5 live rows per live_schema).

**Verdict:** Not applied. Clean P2 candidate.

### Site 4 — Smart List Import (`smart-list-import` Edge Function)

**Location:** `supabase/functions/smart-list-import/index.ts`. Called via the Opportunity-List Unification Multi-List Smart Import flow (per code comment L3-9 and the `useLists` hook).

**Classifier semantics:** Haiku classifies each item in a pasted block against the family's existing lists. For each item, picks `target_list_id` (existing list UUID) OR suggests `suggested_new_list` (name for a new list). Optional: extracts `reward_amount`, `reward_type`, `category`, `notes`.

**System prompt (L19-59):** 11 rules; key rule is "For each item, decide which existing list is the BEST match based on the list's title and description."

**Embedding-first?** No. Direct Haiku call at L17. No pgvector query before Haiku. `lists` table has no `embedding` column in live schema, so a reference corpus would need to be built from `lists.title || ' — ' || lists.description` embedded on upsert.

**Corpus potential:** Very strong. Existing lists are a natural pre-classified corpus — the mom has already named and described each list, and items that belong on a list are by definition semantically similar to that list's title+description. Embedding each list's title+description, embedding each input item, cosine-similarity match above a confidence threshold (e.g., 0.75) → direct classification to `target_list_id`. Low-confidence items fall through to Haiku for "pick from existing or suggest new."

**Current cost impact:** Logged as `smart_list_import` feature_key. Beta volume appears low (no bulk-import-heavy families yet); projecting per regular adoption: a mom adding items 2× per week across N lists × ~10 items per batch = ~80 items/month = ~8 Haiku calls/month per active user = ~$0.01/month. Small in absolute terms but cumulative across all classifier sites.

**Verdict:** Not applied. Clean P2 candidate with excellent corpus potential.

### Site 5 — Post Meeting Review (`buildSummaryPrompt`)

**Location:** `src/components/meetings/PostMeetingReview.tsx`. Called after a meeting ends and the user clicks "Generate Summary." Takes the transcript and produces summary + `action_items[]`.

**Classifier semantics:** Haiku extracts discrete action items from a meeting transcript. For each action item:
- `content` — what needs to happen
- `suggested_destination` — one of 7 (tasks, calendar, best_intentions, guiding_stars, list, backburner, skip)
- `suggested_assignee_name` — family member first name or null

**System prompt (L46-48):** destination enum spec. Prompt is dynamically built per `meeting_type` via `buildSummaryPrompt`.

**Embedding-first?** No. `sendAIMessage(systemPrompt, ...)` → `ai-parse` → Haiku.

**Corpus potential:** Moderate. Action items extracted from meeting transcripts share semantics with existing tasks/calendar events/best_intentions. A corpus of `(action_item_text, routed_destination)` pairs accumulated from prior meeting summaries would classify well. Earlier in platform life, corpus is sparse.

**Current cost impact:** Logged via `ai_parse` default feature_key (PostMeetingReview does not pass feature_key override). Beta volume currently zero — per live_schema `meetings` table has 0 rows. No cost impact in beta; post-MVP scaling projection depends on meeting cadence.

**Verdict:** Not applied. P2 candidate; lower priority than Review & Route or Smart List Import due to zero current volume.

### Site 6 — Archives Bulk Add Sort (`BulkAddSortModal`)

**Location:** `src/components/archives/BulkAddSortModal.tsx`. Called from Archives → bulk add flow.

**Classifier semantics:** For each extracted fact from bulk text, classifier assigns:
- `member_id` — which family member this fact is about (or family-wide)
- `folder_category` — one of 7 system folders + family_overview subfolders (e.g., "Health & Medical" for "John's amoxicillin allergy")
- `context_field` + `context_value` structure

**System prompt (L127):** directly instructs Haiku to sort per family member + folder category.

**Embedding-first?** No. Direct `sendAIMessage` → Haiku.

**Corpus potential:** High, but blocked by F1. `archive_context_items.embedding` column is missing per F1 root cause. Once F1 fix lands (column + backfill), this classifier gains a natural corpus: embed each of the 173 existing context items and match new bulk-add items against them. "Amoxicillin allergy for John" semantically maps directly to prior Health & Medical items for John. **F1 resolution unblocks this site's P2 applicability.**

**Current cost impact:** Shared `ai_parse` feature_key (no override). Moderate volume — mom onboarding fills out Archives per-member. Per-family-once setup burst, then occasional bulk-adds.

**Verdict:** Not applied. **Blocked by F1 for now.** Once F1 fix lands, embedding-first path becomes feasible. Flag as cross-pattern consolidation candidate — see synthesis section below.

### Site 7 — Board of Directors `content_policy_check`

**Location:** `supabase/functions/lila-board-of-directors/index.ts:38-103`. Called before any persona generation.

**Classifier semantics:** Single Haiku call with 4-outcome enum — `deity` / `blocked` / `harmful_description` / `approved`. Used as safety + routing gate before Sonnet persona generation.

**Embedding-first?** No. Direct Haiku. Temperature 0, max_tokens 100 (very cheap — ~$0.0001 per call).

**Corpus potential:** Weak early-platform, moderate later. Corpus would be `(persona_name, description, outcome)` pairs — but current live DB has 18 personas, all approved (none blocked or flagged). Not enough signal to embed-first classify. Also, the "deity detection" subclass is essentially a names-lookup problem where embedding similarity adds little over exact-match against a curated deity-names list (which itself would be $0).

**Current cost impact:** Per-persona-creation Haiku call, max 100 tokens, ~$0.0001/call. 18 live personas → ~$0.002 lifetime cost. Negligible.

**Verdict:** **Ambiguous.** The classifier shape fits P2 formally, but:
- Corpus too sparse for embedding-first to outperform Haiku early
- Haiku cost per call is already tiny (100-token classification)
- F4 + F5 already define the cache + substitution architecture for this Edge Function — content_policy_check's role is partly absorbed by the approval queue workflow
- The deity/blocked categories could be handled by a static names list (cheaper than embedding, deterministic)

**Orchestrator decision needed:** whether content_policy_check warrants its own P2 finding or should be noted as "adjacent to F4/F5, no distinct action needed."

### Sites 8 & 9 — Feedback sentiment + Blog comment moderation

Both **unbuilt**. No Edge Function, no table, no UI path. Per PLAN §2.2 expected sites list, both were flagged as candidate misses.
- `feedback_submissions` (per ai_patterns.md L221) — no table exists. Only `beta_glitch_reports` (47 live rows) exists for beta utility, and it has no sentiment column. PRD-32 Admin Console, which would absorb this table per migration 100083 comment, is unbuilt.
- `blog-comment-moderate` (per architecture.md L167) — no Edge Function. No `blog_comments`, `blog_posts`, or `blog_engagement` tables in live schema. PRD-38 Blog (Cookie Dough) is unbuilt.

No P2 finding possible on unbuilt surfaces. Both fall under the "defer until built" pattern per F22 re-audit precedent.

## Historical telemetry summary

Per founder dispatch shape (DECISIONS.md §Round 0): historical `ai_usage_tracking` read-only queries are approved. Worker-bot sandbox restrictions prevent running `supabase db query` directly; worker captured feature_key inventory from Edge Function cost logging and projected from F1's 8-day production window data already retrieved.

**Known feature_key volumes from F1 (8-day window, 2026-04-04 to 2026-04-12):**
- `mindsweep_sort`: 9 events, 24 items, $0.00639 total → ~$0.024/family/month projection
- `mindsweep_scan`: separate Sonnet OCR (not P2)

**Feature_keys that would correlate to P2 misses identified here:**
- `ai_parse` — catchall for Review & Route, PostMeetingReview, BulkAddSort, FamilySetup, and 11 other `sendAIMessage` paths. **Observability gap:** callers do not pass distinct feature_keys, so spend attribution requires caller-level correlation. Recommendation: follow-up telemetry hardening pass to have each caller pass a dedicated feature_key through `sendAIMessage` → `ai-parse`.
- `smart_list_import` — dedicated feature_key.
- `messaging_coaching` — message-coach (tone classifier, adjacent to P2).
- `homeschool_time_review` — homework-estimate (subject classifier, adjacent to P2).
- `lila_persona_generation` — Board of Directors persona gen (content_policy_check logs under this key or separately, hard to tell without query).

**Recommended single follow-up query** (approved per dispatch shape but not run in this worker due to sandbox restriction on `supabase` binary):

```sql
SELECT feature_key, COUNT(*) AS calls, SUM(tokens_used) AS tokens,
       SUM(estimated_cost) AS cost_usd, MIN(created_at) AS first, MAX(created_at) AS last
FROM ai_usage_tracking
WHERE feature_key IN (
  'ai_parse', 'smart_list_import', 'messaging_coaching',
  'homeschool_time_review', 'lila_persona_generation',
  'mindsweep_sort'
) AND created_at > now() - interval '30 days'
GROUP BY feature_key
ORDER BY cost_usd DESC;
```

Result would confirm:
- Relative cost of each classifier site at current volume
- Whether `ai_parse` feature_key volume is dominated by classifier paths or generation paths
- Whether total classifier-pattern spend approaches $1/family/month threshold

**Projected cost impact if P2 applied correctly at all identified sites:**
- Haiku classification call cost: ~$0.0005 – $0.002 per call depending on token count
- Embedding call cost: ~$0.00002 per input text (fixed)
- Expected embedding hit rate if corpus populated: 60-85% (based on MindSweep's 0.85 similarity threshold + CLAUDE.md ~90% aspirational target)
- Net per-call savings at 75% embedding hit rate: ~$0.0004 – $0.0015 per call
- At current beta volume across all 4 active classifier sites (MindSweep + 3 new): estimated $0.05 – $0.15/family/month savings potential
- Well below Y-flag threshold ($5/family/month); **no Beta Readiness Y warranted**

## Cross-pattern synthesis check

**F1 + F6-adjacent + P2 site 6 (BulkAddSort):** The `archive_context_items` missing-embedding column is the root cause of three distinct pattern-level defects:
1. **F1 / P1** — archives never participate in the embedding pipeline
2. **F1 propagation / P2** — MindSweep cross-source classifier aborts silently because it UNION ALLs against this table
3. **This finding site 6 / P2** — Archives BulkAddSort cannot apply embedding-first classification against a corpus that doesn't have embeddings

One fix (F1 migration + backfill) unblocks all three. Recommend the apply-phase narrative explicitly cite this as "one fix, three pattern-level improvements." No new finding needed — already captured in F1 fix scope (a-d).

**No feature-level cross-pattern consolidation triggered:** per PLAN §5.3, if a single feature misses 3+ cost patterns at once, emit one feature-level finding instead of N per-pattern findings. None of the three active sites (Review & Route, Smart List Import, PostMeetingReview) miss 3+ patterns simultaneously — each misses only P2. Standard per-pattern consolidation applies.

**No new-feature-surface defect:** none of the three active sites is new code added since the last audit; they are all established features that never applied P2 from the start. This is pattern-level systemic drift, not feature-level drift.

## Unexpected findings

1. **The canonical "embedding-first classifier" pattern is 0-for-4 in production.** MindSweep attempts P2 but silently falls through (F1). The three other active classifiers (Review & Route, Smart List Import, PostMeetingReview) never attempted P2 at all. **No classifier site in the codebase currently demonstrates P2 applied correctly.** The ai_patterns.md L194 pattern description and CLAUDE.md line 12 architectural principle ("~90% of routine classification uses pgvector") describe aspirational behavior — actual production classification is 100% Haiku across all four sites.

2. **Observability gap on `ai_parse` feature_key.** `sendAIMessage` in `src/lib/ai/send-ai-message.ts` does not route caller-specific feature_keys through to `ai-parse`. Instead, `ai-parse/index.ts:42` defaults `feature_key` to `'ai_parse'` for any caller that doesn't explicitly override. Result: historical cost attribution for classifier paths (Review & Route, BulkAddSort, PostMeetingReview) collapses into a single feature_key along with non-classifier paths (FamilySetup parsing, RoutineBrainDump, etc.). This **obscures the scale of the P2 miss** in telemetry — cannot definitively show Review & Route's classifier-specific cost without adding instrumentation. Recommendation: low-priority telemetry hardening pass to thread caller-specific feature_keys through `sendAIMessage` → `ai-parse`. Does not warrant its own finding; fold into F1's telemetry observability sub-task (F1 fix scope (c) already addresses silent classifier failures).

3. **`smart-list-import` has a pre-existing corpus that would make it the strongest P2 candidate.** Family lists are user-authored, semantically well-named categories — exactly the shape pgvector similarity excels at matching. If `lists.embedding` (on title+description) were populated, even a naive 0.6 cosine threshold would classify the obvious "groceries → Shopping list" case at $0 cost. This is a cheap, high-leverage P2 retrofit — lower scope than MindSweep's cross-source UNION ALL architecture.

4. **Notepad Review & Route's destination enum has drifted from MindSweep-sort's.** Notepad classifier destinations: 12 options including `optimizer`, `agenda`, `quick_note`, `track`. MindSweep destinations: 13 options including `archive`, `recipe`, `travel`, `list_item`. The two classifiers share conceptual overlap but use different schemas, which means P2 retrofits cannot share a single corpus unless the enum schema is unified. Low-severity follow-up (not this scope's finding); flag for PRD-08/PRD-17 consolidation review.

5. **Board of Directors `content_policy_check` is a Haiku classifier that may warrant a deity-names static list instead of embedding.** The 4-outcome classifier has a mostly-stable "deity" subclass and mostly-stable "blocked mass-harm figure" subclass. Both would be served equally well or better by a platform-maintained names list + regex matching (0-cost) than by an embedding similarity lookup. The "harmful_description" subclass is more embedding-friendly. Orchestrator decision: whether to cite as separate finding OR fold into F4/F5 adjacent recommendation OR skip (given tiny cost and F4/F5 already restructuring this Edge Function).

6. **`homework-estimate` is partially classifier-shaped.** It picks from N family-configured subjects AND estimates minutes. The subject-selection sub-task is embedding-friendly (`homeschool_subjects.name` vs input description). The minutes-estimate is pure generation. Hybrid shape; not a clean P2 candidate but worth noting that a subject-only pre-screen could shrink the Haiku prompt if applied. Low-priority post-MVP optimization; not this round's finding.

## Proposed consolidation

Per PLAN §5.1, one `SCOPE-4.F{N}` finding per pattern-level miss. F1 already covers MindSweep-sort. One additional finding proposed for the three active Haiku-first classifier sites that share a common root cause (no embedding-first pre-screen attempted, no reference corpus built):

**Finding body draft — SCOPE-4.F10 (number assigned during apply-phase):**

- **Title:** P2 Embedding-Based Classification — three classifier sites (Notepad Review & Route, Smart List Import, Post Meeting Review) fire Haiku directly with no pgvector pre-screen
- **Severity proposal:** **Low**. Each site's per-call cost is small (~$0.001/call); current beta volume is low across all three; combined projected cost impact at regular-adoption volume is $0.05–0.15/family/month — well under $5/family/month Y-flag threshold. Functional classification is intact (Haiku works; outputs are correct). Pattern-level defect is optimization-class, not correctness-class.
- **Classification:** **Unintentional-Fix-Code** (three pattern-level optimizations missing; each site can be retrofit independently; one would be a small feature-scope build per site).
- **Beta Readiness flag:** **N**. No Sonnet-on-child-surface, no context-bulk-load, no cost-ceiling breach. Same rationale as F1.
- **Sites affected:** `src/hooks/useNotepad.ts:335-397` (useExtractContent); `supabase/functions/smart-list-import/index.ts` (full Edge Function); `src/components/meetings/PostMeetingReview.tsx:123-126` (handleGenerate).
- **Sites applying correctly:** None. No classifier site in the codebase currently demonstrates P2 applied correctly (MindSweep attempts but silently fails per F1).
- **Cross-refs:**
  - **SCOPE-4.F1** — MindSweep-sort's P2 defect. Same pattern-level miss, different root cause (F1 is silent-failure of attempted P2; F10 is never-attempted P2). Both resolve once F1's embedding infrastructure lands AND F10's reference corpora are built + queried.
  - **SCOPE-4.F4/F5** — Board of Directors persona cache + embedding substitution. `content_policy_check` classifier noted as ambiguous in this pass (may warrant separate adjudication or may be absorbed by F4/F5 restructuring).
  - **F22 re-audit open flag** — feedback sentiment + blog moderation are unbuilt; re-audit triggers when PRD-32 / PRD-38 builds land.
- **Fix scope (proposed, awaiting founder direction):**
  - (a) **Smart List Import retrofit.** Highest-leverage first. Add `lists.embedding halfvec(1536)` column + HNSW index + `util.queue_embedding_job()` trigger (on `title || ' — ' || description`). Retrofit `smart-list-import/index.ts` to embed input items and query by similarity against family's list corpus before Haiku. Similarity threshold 0.70 (tunable). Haiku fallback preserved with existing logic. Backfill embeddings for 42 live list rows.
  - (b) **Notepad Review & Route retrofit.** Build a reference corpus of `(example_text, destination)` pairs — seed from platform-authored examples initially, then augment with user-confirmed classifications. Store in a new `platform_intelligence.routing_reference` table (pattern library per ai_patterns.md P2 definition). Retrofit `useExtractContent` → new `notepad-classify` Edge Function that embeds input → queries corpus → Haiku fallback. Add dedicated feature_key (`notepad_review_route_classify`) for telemetry separation.
  - (c) **Post Meeting Review retrofit.** Similar reference corpus + Edge Function wrapper. Lower priority than (a) and (b) due to zero beta volume. Can defer until meetings see regular usage.
  - (d) **Add dedicated feature_keys to `sendAIMessage` call sites.** Thread `feature_key` override through `sendAIMessage` → `ai-parse` for all classifier callers so future P2 audits have clean telemetry. One-line API addition + caller updates. Low-priority but high-leverage for future audit hygiene.
  - (e) **Observability.** Log embedding-vs-Haiku hit rate per classifier into `ai_usage_tracking.metadata` (following F1 fix scope (c) pattern). Post-launch, dashboard can track actual hit rate vs ~90% aspirational target.
  - (f) **Archives BulkAddSort P2 unlock** — called out explicitly in fix scope but **not built here**. Once F1 fix (archive_context_items embedding column) lands, BulkAddSort becomes P2-eligible as a follow-up. Flag for apply-phase as "embedding-infra resolved → this site becomes actionable."

**Separate ambiguous-call finding (pending orchestrator decision):**

- **Content_policy_check (Board of Directors)** — classifier shape fits P2 formally, but early-platform corpus is sparse, Haiku cost per call is ~$0.0001 (already tiny), and F4/F5 already restructuring this Edge Function. Orchestrator decision needed on whether to emit a separate finding OR fold recommendations into F4/F5's fix scope OR skip entirely.

## Orchestrator adjudication

*(Left blank for walk-through. Orchestrator proposes verdicts + Beta flag + classification; founder confirms, amends, or overrides. Fills in SCOPE-4.F{N} title + severity + fix scope + emission list per standard adjudication pattern.)*
