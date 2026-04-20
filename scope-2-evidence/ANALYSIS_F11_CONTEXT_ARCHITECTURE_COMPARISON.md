---
Status: COMPLETE — analysis ready for founder adjudication of SCOPE-2.F11
Type: Decision-support analysis (not an audit finding)
Parent finding: SCOPE-2.F11-CANDIDATE-PRD05-CONTEXT-ASSEMBLY-LAYERED (from EVIDENCE_BATCH_2_lila.md)
Opened: 2026-04-20
Purpose: Compare PRD-05 8-step linear context-assembly pipeline vs shipped 3-layer relevance-driven architecture; identify gaps; recommend F11 disposition.
---

## 1. Executive summary

PRD-05 §Context Assembly System L430–458 describes an **8-step linear pipeline** (identify member → identify mode → identify people → apply three-tier toggles → apply permission filters → apply privacy filter → apply page context → assemble prompt). The shipped implementation in [supabase/functions/_shared/context-assembler.ts](../supabase/functions/_shared/context-assembler.ts) is a **3-layer relevance-driven architecture** (always-loaded roster / on-demand by name+topic detection / search-only via semantic RPCs), authoritatively specified in [claude/ai_patterns.md L96–166](../claude/ai_patterns.md#L96) and anchored by CLAUDE.md Convention #105 (P9 Per-Turn Semantic Refresh).

The two are not architecturally incompatible. The 3-layer is a **"when/how to load"** framework; the eight PRD-05 concepts are **"what gets applied within"** and they all still run, just distributed across the assembler, per-Edge-Function callers, and a shared privacy-filter helper. The 3-layer adds relevance-driven loading ON TOP of the three-tier toggle system — not instead of it ([ai_patterns.md:119](../claude/ai_patterns.md#L119)). No 8-step concept is missing functionally; the most visible gaps are (a) `lila_guided_modes.context_sources` as a data-driven steering field appears unused, and (b) per-tool-per-person context-sharing enforcement is distributed to the UI/caller layer rather than centralized server-side. Both are clarification surface rather than capability loss.

**Recommendation:** Option (c) — complementary. F11 stays Intentional-Document with a clarifying PRD-05 amendment that describes the wrapping relationship and cites `claude/ai_patterns.md` as authoritative for the loading framework. No code changes required.

---

## 2. Provenance and timeline

| Commit | Date | Artifact | Change |
|---|---|---|---|
| 0f2a0d8 | 2026-03-23 | `prds/personal-growth/PRD-05-LiLa-Core-AI-System.md` | Initial commit. PRD-05 ships with 8-step pipeline text at L430–458. |
| 0f2a0d8 | 2026-03-23 | `claude/ai_patterns.md` | Initial commit. Context Assembly section describes the same 8-step pipeline. P9 "Per-Turn Semantic Refresh" convention present as pattern entry only: *"Do not carry stale startup context through long conversations"* — principle, no implementation reference. |
| 0f2a0d8 | 2026-03-23 | `prds/addenda/PRD-05-Planning-Decisions-Addendum.md` | Initial commit. Describes three-tier toggle system, Privacy-Filtered category, per-tool-per-person context sharing — the "what is applied" concepts. Does not prescribe linear vs layered loading order. |
| 39a9cd4 | 2026-03-26 | Multiple | Vibeathon repo cleanup — no material change to context-assembly architecture. |
| 2abdb00 | 2026-03-28 | Addendum | gitignore cleanup — no content change. |
| 6cafb0f | 2026-04-01 | `supabase/functions/_shared/context-assembler.ts` | **Created (+483 lines).** First shipped 3-layer assembler. Co-landed with BookShelf discuss/search wiring. |
| 9f29ff6 | 2026-04-01 | Edge Functions + `claude/ai_patterns.md` | **"refactor: migrate all LiLa Edge Functions to layered context assembly"** — 14 Edge Functions migrated; ai_patterns.md Context Assembly section rewritten (8-step → 3-layer Layered Architecture). P9 entry updated from abstract to implementation-specific: *"Sliding 4-message detection window re-evaluates context relevance each turn (implemented via `assembleContext()`)"*. |
| f3bce32 | 2026-04-03 | Context-assembler + docs | Layer 2 expansion. |
| e9eb169 | 2026-04-11 | Context-assembler | BookShelf rewired onto `get_bookshelf_context` platform RPC. |
| aeae494 | 2026-04-14 | Context-assembler | Wishlist Layer 2 addition. |
| 6760ad1 | 2026-04-17 | Context-assembler + `privacy-filter.ts` | Role-asymmetric privacy filter (RECON Decision 6). |

**Shape:** strict supersession. The 8-step pipeline was the original design (2026-03-23). The 3-layer architecture was designed, implemented, and documented in a single coordinated refactor on 2026-04-01 (commits 6cafb0f + 9f29ff6), with `ai_patterns.md` rewritten in the same commit that migrated all 14 Edge Functions. PRD-05 text was never amended to reflect the supersession. The Planning-Decisions-Addendum — which would have been the natural place to capture the architectural shift — was not touched after 2026-03-28. P9 was a stated principle from day 1; the 3-layer is the shipped realization of it.

The 9f29ff6 commit message is explicit about the migration intent: *"All 14 LiLa Edge Functions now use the shared context-assembler module with three-layer relevance filtering ... Replaces per-function ad-hoc context loading with consistent pipeline."* The refactor was motivated by pipeline consistency across tools, not just cost optimization. Pre-refactor, several Edge Functions (notably `lila-chat`, which shed 247 lines in the commit diff) carried their own ad-hoc context loading — the 8-step PRD-05 pipeline was the design, but the de facto implementation had already fragmented per tool. The 3-layer is the re-unification.

Worth noting: the addendum was never closed out with a "now obsolete" or "see ai_patterns.md" pointer. The Planning-Decisions-Addendum continues to read as current guidance but is silent on the loading framework that actually runs. This is the exact drift shape PRD-05 Row 6 in [EVIDENCE_BATCH_2_lila.md](EVIDENCE_BATCH_2_lila.md) identifies.

---

## 3. Step-by-step coverage table

The 8 steps in PRD-05 L430–458 are strictly ordered as a linear procedure. The 3-layer architecture reorganizes them into a loading-time framework (Layers 1/2/3) plus a set of applied-at-query-time concerns (toggles, privacy filter, permissions) plus a prompt-assembly output step. Each row below pairs one PRD-05 step with where that concept now lives, citing the specific file + line range in the shipped code.

| 8-step pipeline step (PRD-05 L430–458) | 3-layer coverage | Coverage assessment |
|---|---|---|
| 1. Identify the member | Layer 1 roster loaded for every turn; `memberId` is a required `ContextAssemblyOptions` field ([context-assembler.ts:33](../supabase/functions/_shared/context-assembler.ts#L33)); current user tagged `[current user]` in roster at [L236–237](../supabase/functions/_shared/context-assembler.ts#L236). | Strict-equivalent |
| 2. Identify the mode | No `modeKey` parameter on `assembleContext()`. Mode selection is handled at the Edge Function boundary — each of the 14 LiLa Edge Functions ([lila-chat, lila-cyrano, lila-higgins-*, etc.](../supabase/functions/)) is its own mode entry point and passes mode-specific `featureContext` + `alwaysIncludeMembers` + `alwaysIncludeCategories` into the assembler. Mode registry metadata (`lila_guided_modes.context_sources`) is not consulted server-side. | Reordered-but-present (see §4.2 for `context_sources` gap) |
| 3. Identify the people | Layer 2 does this via two channels: dynamic name detection at [context-assembler.ts:148–181](../supabase/functions/_shared/context-assembler.ts#L148) (`detectMentionedMembers`) scanning `userMessage` + last 4 history turns for `display_name`/`nicknames`; and caller-supplied `alwaysIncludeMembers` for tools that pre-select persons via UI (Cyrano partner, Higgins selector). | Enhanced (dynamic detection is a capability the 8-step did not specify) |
| 4. Apply three-tier toggles | Enforced at every load site: person-level via `archive_member_settings.is_included_in_ai` at [context-assembler.ts:558–569](../supabase/functions/_shared/context-assembler.ts#L558); folder-level at [L572–577](../supabase/functions/_shared/context-assembler.ts#L572); item-level via `.eq('is_included_in_ai', true)` on every source-table query (guiding_stars L282, self_knowledge L311, archive_context_items L620, faith_preferences L384, wishlist-backing lists L669). | Strict-equivalent |
| 5. Apply permission filters (non-mom → only what mom shared for this tool) | Distributed across three layers: (a) tool-level access gated client-side via `lila_tool_permissions` ([src/hooks/useLila.ts:386](../src/hooks/useLila.ts#L386)); (b) per-tool-per-person context sharing gated by the Edge Function caller — the client passes `personIds` into tools with person selectors, so mom's grant is enforced in the UI; (c) privacy-filtered exclusion server-side via `applyPrivacyFilter` at [context-assembler.ts:623](../supabase/functions/_shared/context-assembler.ts#L623). Server-side enforcement of mom's explicit per-member context-sharing grant is not centralized — it is implicit in caller behavior. | Reordered-but-present (see §4.2 for enforcement distribution concern) |
| 6. Apply privacy filter | `applyPrivacyFilter()` helper at [privacy-filter.ts:51–56](../supabase/functions/_shared/privacy-filter.ts#L51) with role-asymmetric check per Convention #76 + RECON Decision 6. Mom sees everything; all other roles get `is_privacy_filtered = false` appended. Invoked in `loadFilteredArchive`. | Enhanced (cleaner — single reusable helper; role-asymmetric correctness per Phase 0.26 S3 fix) |
| 7. Apply page context | Handled at the Edge Function boundary rather than inside the assembler. `assembleContext()` accepts a `featureContext` string parameter ([context-assembler.ts:39](../supabase/functions/_shared/context-assembler.ts#L39)) which each Edge Function populates (e.g., `lila-chat` at [L376–391](../supabase/functions/lila-chat/index.ts#L376) passes meeting feature context). The `conversation.page_context` column is consumed by `buildSystemPrompt()` at [lila-chat/index.ts:398](../supabase/functions/lila-chat/index.ts#L398), not the assembler. | Reordered-but-present |
| 8. Assemble the prompt | `AssembledContext` result shape ([context-assembler.ts:60–69](../supabase/functions/_shared/context-assembler.ts#L60)) returns `familyRoster`, `featureContext`, `relevantContext`, `loadedSources` — three labelled context sections plus explainability metadata, consumed by the per-Edge-Function system-prompt builder. | Strict-equivalent (plus `loadedSources` metadata is new) |

**No row assessed as "Not-covered."** Every 8-step concept is live in the running system. Rows marked "Reordered-but-present" reflect that some operations moved from the assembler to the caller or to a shared helper.

Follow-up notes on the three Reordered-but-present rows:

- **Step 2 (mode identification).** The 8-step treated mode as an input to the pipeline. The 3-layer treats mode as the pipeline selector — mode selection IS the Edge Function dispatch. PRD-05's design rationale still holds: different modes need different context shapes. The implementation realization is "one Edge Function per mode, each with its own `assembleContext()` call shape" rather than "one pipeline that switches on mode." The `lila_guided_modes.container_preference`, `avatar_key`, and `system_prompt_key` fields are consulted client-side for UI; `model_tier` is read server-side by each Edge Function for model routing. The only mode-registry field that appears to have lost runtime usage in the refactor is `context_sources` — see §4.2.

- **Step 5 (permission filters).** Distributed enforcement: (a) tool gate via `lila_tool_permissions` at UI layer, (b) person-selection gate at caller layer, (c) privacy-filter gate at assembler layer via `applyPrivacyFilter`. Each layer enforces one slice of what the 8-step packaged as "apply permission filters." Correctness is preserved; centralization is not.

- **Step 7 (page context).** The assembler accepts page context as a pass-through `featureContext` string. It does not use page context to steer Layer 2 loading. The consuming Edge Function (lila-chat) reads `conversation.page_context` directly in `buildSystemPrompt()`. Functionally the page context reaches the model; architecturally it skirts the assembler.

---

## 4. Capability delta both directions

This section is structured so a reader can answer two questions independently: "did the refactor add things that matter?" (§4.1) and "did the refactor drop things that mattered?" (§4.2). The answer to (1) is yes, seven named capabilities. The answer to (2) is no functional drops, two clarification items.

### 4.1 What the 3-layer adds that the 8-step did not specify

- **Name detection with sliding window** ([context-assembler.ts:148–181](../supabase/functions/_shared/context-assembler.ts#L148), codified as CLAUDE.md Convention #79). Scans current message plus last 4 turns for `display_name` and `nicknames` via word-boundary regex. Makes LiLa feel like she "knows" the family without mom pre-declaring every person per conversation. The 8-step had "identify the people" as a static step; the 3-layer makes it dynamic per turn. Accuracy win.
- **13 topic-matching patterns** at [context-assembler.ts:85–138](../supabase/functions/_shared/context-assembler.ts#L85). Maps conversation text to archive folder names and source-table categories. The 8-step had no equivalent — it implied loading all opted-in sources. Cost win: archive items and self-knowledge are skipped entirely when no topic or person triggers them.
- **Layer 3 semantic RPCs** — `get_bookshelf_context`, `match_bookshelf_chunks`, `match_bookshelf_extractions`. Deep grounding for BookShelf and (planned) journal search is never bulk-loaded; only fetched on explicit feature need. Cost + accuracy win.
- **P9 per-turn refresh discipline** — the sliding 4-message window means the assembler re-evaluates relevance every turn. Prevents stale startup context dominating long conversations. Implementation of the principle stated in ai_patterns.md L201.
- **Per-tool overrides table** ([ai_patterns.md:153–164](../claude/ai_patterns.md#L153)). Each LiLa tool declares its always-loaded context (Cyrano: partner; BookShelf Discuss: book metadata + hearted extractions; Safe Harbor: minimal, privacy-first). The 8-step had no such tool-by-tool differentiation.
- **`loadedSources` explainability** ([context-assembler.ts:53–58](../supabase/functions/_shared/context-assembler.ts#L53)). Every context load records source, member, reason, and item count. Available for logging, debug surfaces, and future "why did LiLa reference X" features. The 8-step did not surface provenance.
- **Baseline fallback** — when no topic matches, the assembler still loads the current user's top 5 Guiding Stars at [context-assembler.ts:274](../supabase/functions/_shared/context-assembler.ts#L274) as soft context. The 8-step had no equivalent "when nothing triggers" rule; ambiguity would have meant either empty context or full opted-in context.
- **Cost scale claim.** CLAUDE.md preamble cites "< $1.00/family/month" total AI cost; the 3-layer is the operational mechanism behind that claim — Layer 2 skips entire source-table reads per turn where the 8-step would have loaded everything opted-in every time.

### 4.2 What the 8-step specified that may not be fully covered

- **`lila_guided_modes.context_sources` as a data-driven steering field.** PRD-05 L433 states: *"The mode's `context_sources` field determines which types of context to query."* The live schema has this field populated ([live_schema.md `lila_guided_modes` row 5](../claude/live_schema.md#L368)). The 3-layer architecture does not consult it server-side — each Edge Function instead hard-codes its overrides in the `assembleContext` call. If the field is intentionally retired as a runtime switch and kept as registry documentation only, the code is correct and the PRD + schema comment need amendment. If the field was supposed to remain the steering mechanism, this is a drift. Status: **unclear — follow-up question for founder/orchestrator (§7).** No functional gap observed for the 14 shipped Edge Functions because hard-coding per-tool overrides achieves equivalent effect.
- **Server-side enforcement of per-tool-per-person context sharing.** PRD-05 L436 + Planning-Decisions-Addendum §Mom-Controlled Context Sharing L46–52 state that mom grants context-access per tool, per person (e.g., "dad gets Higgins with context for kids only"). In the 3-layer, this is enforced by the Edge Function caller passing the correct `personIds`/`alwaysIncludeMembers`; the assembler itself has no awareness of whether mom granted the requesting member permission to see that person's context for this specific tool. Grep confirms no `lila_tool_permissions` or `context_person_ids` read in [supabase/functions/](../supabase/functions/). **Coverage assessment: distributed (UI is the gate), not missing.** But it is a weaker enforcement posture than a server-side check. This is adjacent-scope (closer to RLS/permission audit in Scope 3-8b) than a 3-layer-vs-8-step architectural gap, but worth flagging.
- **Page context feeding the assembler vs. the prompt builder.** Step 7 of the 8-step implied page context flows through context assembly. In the 3-layer, `featureContext` is a pass-through string (not used to steer Layer 2 loading), and `conversation.page_context` is consumed by `buildSystemPrompt()` outside the assembler. Functionally equivalent — the context reaches the model either way — but re-organized. Not a gap.

### 4.3 Functional-impact summary

Nothing that the 8-step pipeline enabled has been removed from the running system. Every PRD-05 concept — member identity, mode differentiation, person scoping, three-tier toggles, privacy filtering, page context, prompt assembly — is materially operational, verifiable in the file references cited in §3. The 3-layer refactor is net additive: it introduces relevance-driven loading, per-tool overrides, explainability metadata, baseline fallback, and semantic search as Layer 3. The two items in §4.2 are clarification surface, not capability loss.

### Scope 4 carry-forward note

The cost-optimization claim embedded in the 3-layer architecture (Layer 2 skipping source loads unless triggered) is the anchor for P9 auditing. This analysis documents the claim; actual cost-pattern auditing belongs to Scope 4. The `loadedSources` metadata at [context-assembler.ts:53–58](../supabase/functions/_shared/context-assembler.ts#L53) would be the natural observability hook for any Scope 4 attempt to quantify the optimization impact.

---

## 5. Recommendation

**Option (c) — Complementary.** The 3-layer is a "when/how to load" framework that wraps the 8 PRD-05 concepts, which all still run in distributed form. Relevance filtering runs ON TOP of the three-tier toggle system, not instead of it (ai_patterns.md L119 makes this explicit).

Justification:

- §3 shows every PRD-05 step is either Strict-equivalent, Reordered-but-present, or Enhanced in the 3-layer. Zero steps are Not-covered. The shipped code materially runs each of the 8 concepts; they just live in different files.
- §4.1 shows the 3-layer adds seven named capabilities beyond the 8-step (dynamic name detection, topic matching, Layer 3 semantic RPCs, per-turn refresh discipline, per-tool overrides, explainability metadata, baseline fallback). These are additive — the 8-step did not forbid them, nor did it specify them.
- §4.2 identifies two items worth clarifying (the `context_sources` field status and the distribution of per-tool-per-person permission enforcement) but neither rises to "functionality dropped." The first is a documentation decision awaiting founder input; the second is enforcement architecture that works as distributed but is not centrally server-side.
- The Planning-Decisions-Addendum §Three-Tier Context Toggle System and §Privacy-Filtered Category describe the "what is applied" concepts — toggles, privacy filter, per-tool sharing grants. These concepts survive intact in the 3-layer code. The addendum is therefore still correct guidance for the *what*; only the loading *framework* shifted. This is additional evidence that the two architectures are complementary rather than in competition.

**F11 disposition:** stays Intentional-Document. The action is a PRD-05 §Context Assembly System amendment that (a) describes the wrapping relationship (3-layer framework + 8 concepts applied within), (b) cites `claude/ai_patterns.md §Context Assembly Pipeline — Layered Architecture` as authoritative for loading mechanics, (c) cites CLAUDE.md Convention #105 (P9) as the governing optimization pattern, (d) notes the `context_sources` field status once the founder answers §7.

Rebuttals considered:

- Reject option (a) ("strict improvement, update PRD text to cite the 3-layer and close") because it understates the relationship — the 8 concepts are still materially present; they are not replaced by the 3-layer but wrapped by it. Adopting (a) would risk losing the "what is applied" side of the architecture from PRD-05's spec surface, which is still the correct design intent.
- Reject option (b) ("8-step had concepts the 3-layer missed; add them back") because §3 shows full coverage and neither §4.2 item is a "missed concept." The `context_sources` field is a documentation/retirement question, not a missing capability. The per-tool-per-person permission is enforced, just distributed to the UI/caller.

---

## 6. Action items

Not populated as a code queue — §5 is option (c) and requires no implementation work. For completeness, the single documentation action is:

- PRD-05 §Context Assembly System (L430–458) amendment: replace the 8-step prose with (1) a one-paragraph description of the 3-layer wrapping framework, (2) preservation of the 8 concepts as "what is applied within each layer," (3) pointer to `claude/ai_patterns.md §Context Assembly Pipeline — Layered Architecture` as authoritative for loading mechanics, (4) pointer to CLAUDE.md Convention #105 (P9 Per-Turn Semantic Refresh) as the governing pattern. Complexity: trivial (prose edit, no schema or code touched).

This action is the standard Intentional-Document remediation path for F11 and is not blocking any other Scope 2 work.

---

## 7. Follow-up questions for orchestrator/founder

1. **`lila_guided_modes.context_sources` field intent.** The field is populated in the schema and described in PRD-05 L433 as the mode's context-steering mechanism, but the 3-layer assembler does not read it — per-tool steering is hard-coded in each Edge Function. Is this (i) an intentional retirement of the field as a runtime switch (keep for registry documentation only, amend PRD), or (ii) an unintended drift where data-driven steering was always meant to survive the refactor? If (i), the amendment in §5 gets one extra sentence. If (ii), a small follow-up finding is warranted to wire the field into the assembler.

2. **Per-tool-per-person context-sharing enforcement posture.** Mom's grant is currently enforced at the UI/caller layer (client chooses which `personIds` to submit) rather than server-side in the assembler. This is beta-safe for current usage patterns but is a weaker posture than the Planning-Decisions-Addendum L46–52 envisioned. Should a server-side check in the assembler be added to Scope 3-8b RLS/seams review, or is UI enforcement considered adequate?

---

## 8. Out-of-scope items noted during analysis

Two observations surfaced during the read that are adjacent to F11 but belong to other scopes. Recording here so they are not lost:

- **Crisis Override text duplication between `src/lib/ai/system-prompts.ts:14–31` and `supabase/functions/lila-chat/index.ts:39–44`.** Already flagged in EVIDENCE_BATCH_2_lila.md §Unexpected findings #1; cited here only because crisis override interacts with context assembly (§Invariants in ai_patterns.md L166–171). Disposition for Scope 3+8b's walk-through.
- **`lila_tool_permissions` has 0 rows in production** despite being wired end-to-end. Already flagged in EVIDENCE_BATCH_2_lila.md §Unexpected findings #2. Relevant to §4.2 item 2 above: the UI-layer enforcement path has not yet been exercised by any real user assignment, which makes the "UI is the gate" argument untestable in production telemetry.

Neither affects F11 adjudication.
