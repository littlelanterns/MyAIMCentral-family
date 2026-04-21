---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-34-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-34 (source) ↔ PRD-05 (5 guided modes), PRD-13 (Archives context — three-tier toggle + privacy filter), PRD-15 (Mediator safety), PRD-19 (relationship_notes + private_notes — Mediator Full Picture), PRD-21A (AI Vault — 5 separate items), PRD-30 (Safety Monitoring — Crisis Override + safety_triggered flag + PRD-30 Layer 2 deferred)
Provenance: Worker `a840962db935317cc` (Opus, report-only mode) ran the full evidence pass in-memory across the addendum (193 lines) + full PRD-34 body (1048 lines) + all 5 Edge Functions (`lila-board-of-directors` 667L, `lila-perspective-shifter` 243L, `lila-decision-guide` 244L, `lila-mediator` 431L, `lila-translator` 135L) + migration `00000000100049_prd34_thoughtsift_tables.sql` (784L) + migration `00000000100050_board_sessions_disclaimer.sql` + migration `00000000000007:256-260` (5 mode seeds) + migration `00000000100087` (downgrades decision_guide to haiku in DB) + `_shared/auth.ts` + `_shared/relationship-context.ts` + `live_schema.md`. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Walked the PRD-34 ThoughtSift Cross-PRD Impact Addendum end-to-end. **5 Edge Functions confirmed separate per Convention #92 — strong positive.** **Board of Directors sequential Sonnet multi-advisor pattern correctly implemented with `persona_id` attribution on `lila_messages.metadata` per Convention #93 — strong positive.** **Translator is Haiku single-turn per Convention #94 — strong positive.** **Mediator `safety_triggered` flag correctly persisted to `lila_conversations.context_snapshot` AND checked from DB on every turn per Convention #96 — strong positive, best-in-class safety implementation in the 3+8b traversal.** **Mediator `loadFullPictureContext` uses neutral author labels without attribution per Convention #95 — strong positive.** **Perspective Shifter `synthesizeFamilyContext()` transforms raw items into narrative before system prompt per Convention #98 dual enforcement — strong positive.** **Board of Directors persona caching checks by name case-insensitive before generating per Convention #99 — strong positive.** **Primary F11 direct hit**: Zero of the 5 Edge Functions check `lila_tool_permissions` server-side — any authenticated family member can POST to `lila-board-of-directors`, `lila-mediator` (including Full Picture mode!), etc. with any `conversation_id` bypassing mom's AI Toolbox grant. Fresh 8th surface for the cross-addendum F11 pattern. **Primary F11 secondary hit**: `_shared/auth.ts` authenticates the caller but NONE of the 5 Edge Functions verify the caller is a member of `conv.family_id`. An authenticated user from family A can POST with family B's `conversation_id` → Edge Function loads family B's `guiding_stars` / `best_intentions` / `self_knowledge` / `relationship_notes` / `private_notes` and synthesizes them into a system prompt sent to Sonnet (tokens logged to family A). This is a cross-family data exposure surface. **Primary HITM violation (Convention #4)**: Board of Directors persona generation writes to `board_personas` (platform intelligence table) without Edit/Approve/Regenerate/Reject. Pattern matches PRD-21 F-B HITM gap. **Primary model-tier drift (3rd surface of cross-addendum pattern)**: Migration 100087 downgrades `decision_guide.model_tier` to `haiku` in DB, but `lila-decision-guide/index.ts:17` hardcodes `MODEL = 'anthropic/claude-sonnet-4'` — runtime ignores registry.

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | **5 separate guided modes registered, NOT one ThoughtSift mode** | Addendum L11-12, Convention #92 + #105 | Migration `…000007:256-260` seeds 5 distinct rows with correct model_tier. Migration `…100049:244-294` updates each with container_preference='modal'. All 5 ThoughtSift keys present. 5 separate Edge Functions exist. | Documented (no finding) — strong positive | — | — |
| 2 | **Board of Directors sequential Sonnet calls with persona attribution** | Convention #93 | `lila-board-of-directors/index.ts:498-596` implements exactly this: `for` loop over `personas`, each advisor gets prior responses. Each advisor response persisted with `metadata.persona_id`, `persona_name`. Streams `advisor_start` / `chunk` / `advisor_end` SSE markers. | Documented (no finding) — strong positive | — | — |
| 3 | **Translator uses Haiku, single-turn transform** | Convention #94 | `lila-translator/index.ts:15` `MODEL = 'anthropic/claude-haiku-4.5'`. `messages = [system, user]` only — no history loaded. `stream: false`, one Haiku call per rewrite. | Documented (no finding) — strong positive | — | — |
| 4 | **Mediator `safety_triggered` flag persisted + checked on every turn from DB** | Convention #96 | `lila-mediator/index.ts:245-246` loads from `conv.context_snapshot` on every turn. L265-275 sets flag on pattern match AND persists to DB. L387-395 sets flag when LiLa emits `[SAFETY_TRIGGERED]` marker. **Minor leak: marker-stripping is only `startsWith`-based AND only applies to DB-persisted `full`, NOT to mid-stream SSE chunks sent to client.** Low-severity. | Documented (no finding) — strong positive | — | — |
| 5 | **Mediator Full Picture: neutral author labels** | Convention #95 | `loadFullPictureContext` correctly relabels authors as "Perspective A/B/C/Observer". System prompt `full_picture` mode at L75 reiterates "NEVER attributed by author name." | Documented (no finding) — strong positive | — | — |
| 6 | **Perspective Shifter synthesizes, never quotes** | Convention #98 | `synthesizeFamilyContext()` at L87-122 groups self-knowledge by category into narrative, archive items compressed to themes, appends explicit "INSTRUCTION: Synthesize the above...Do NOT list or quote these items back to the user." Dual enforcement confirmed (code + prompt). | Documented (no finding) — strong positive | — | — |
| 7 | **Persona caching P8 pattern** | Convention #99 | `lila-board-of-directors/index.ts:313-323` ilike-check before calling `generatePersona()`. If existing, returns `{ persona: existing, cached: true }`. | Documented (no finding) — strong positive | — | — |
| 8 | **`board_sessions.disclaimer_shown` once per session** | Convention #101 | Migration `…100050` adds column. Edge Function L491-585: `needsDisclaimer = !disclaimer_shown && some(p => p.persona_type !== 'personal_custom')`. After insert, `UPDATE board_sessions SET disclaimer_shown=true`. | Documented (no finding) — strong positive | — | — |
| 9 | **Content policy gate runs BEFORE persona generation** | Convention #102 | `contentPolicyCheck()` — separate Haiku call with 3 outcomes. Invoked as `action === 'content_policy_check'` endpoint BEFORE `action === 'create_persona'`. Frontend expected to chain; not enforced server-side. **Partial gap: if a malicious client calls `create_persona` directly without preflighting, a blocked-figure name reaches generatePersona unchecked.** | Unintentional-Fix-Code (minor) | **SCOPE-8b** Medium + **SCOPE-3** cross-ref | N |
| 10 | **All ThoughtSift conversations pass through PRD-30 safety monitoring** | Convention #104 | `lila_messages.safety_scanned` column exists but grep across the 5 Edge Functions returns ZERO matches for `safety_scanned`. No Edge Function marks its messages for scanning, no Edge Function invokes `safety-classify`. Global Crisis Override IS wired (all 5 call `detectCrisis`). PRD-30 itself is SCOPE-8a.F3 unbuilt. | Deferred-Document (PRD-30 unbuilt) | — (latent) | — |
| 11 | **`lila_tool_permissions` gates tool access per-member** | Addendum L44-48, Convention #88 | Grep `lila_tool_permissions` across `supabase/functions/` returns **ZERO matches** across all 5 ThoughtSift Edge Functions. Any authenticated family member can POST directly to any Edge Function URL and get responses. **8th confirmed surface of the cross-addendum F11 pattern.** | Unintentional-Fix-Code | **SCOPE-8b** primary + **SCOPE-3** cross-ref | **Y** (direct F11 contributor — 5 additional Edge Functions bypassable; Mediator Full Picture is particularly sensitive) |
| 12 | **Edge Function verifies caller's family ownership of conversation_id** | Implicit security requirement | `_shared/auth.ts:26-40 authenticateRequest` only verifies Bearer token resolves to a user. In all 5 Edge Functions: **the `auth.user` is never compared against `conv.family_id` or `conv.member_id`**. An authenticated user from family A can POST with family B's `conversation_id` and the Edge Function loads family B's context + synthesizes into Sonnet prompt. **Cross-family data exposure via Edge Function bypass.** Separate from seam #11 (tool permission gate) — this is conversation ownership. | Unintentional-Fix-Code | **SCOPE-8b** primary + **SCOPE-3** cross-ref | **Y** (cross-family data leakage surface — trust-violation shape. Mediator Full Picture is the highest-impact case because it loads both private_notes about multiple members AND relationship notes from all authors) |
| 13 | **HITM gate on persona generation + advisor responses + etc.** | CLAUDE.md #4 | Across all 5 Edge Functions, AI outputs are INSERTed into `lila_messages` (and `board_personas` for newly-generated personas) immediately during/after streaming with no gate. The chat-modality is PRD-05 accepted HITM exception. **BUT persona generation writes to `board_personas` (a platform intelligence table) in one shot — non-conversation persist that meets Convention #4's literal requirement.** If Sonnet hallucinates a persona with wrong philosophy, it enters the cache and amortizes across all future users. | Unintentional-Fix-Code | **SCOPE-8b** primary + **SCOPE-3** cross-ref | **Y** (matches PRD-21 F-B pattern. Platform intelligence write without user confirmation.) |
| 14 | **Board of Directors uses three-tier `is_included_in_ai` + privacy filter for context loading** | Convention #74-76 | `lila-board-of-directors/index.ts:420-428` manually queries each context table with `.eq('is_included_in_ai', true).is('archived_at', null)` — item-level only. Does NOT check `archive_member_settings.is_included_in_ai` (person-level). Does NOT call `applyPrivacyFilter()`. Does NOT use `_shared/relationship-context.ts` (the reference three-tier implementation). | Unintentional-Fix-Code (partial-wiring) | **SCOPE-3** Medium | N (only loads current-user's own data so privacy filter gap is low-impact) |
| 15 | **Decision Guide model tier drift — registry says haiku, runtime says sonnet** | Migration `…100087:5-8` downgrades `decision_guide` to `model_tier='haiku'` in DB | `lila-decision-guide/index.ts:17` `const MODEL = 'anthropic/claude-sonnet-4'`. Runtime ignores registry. **3rd surface of cross-addendum model-tier registry-vs-runtime drift pattern** (PRD-19 sonnet→haiku latent, PRD-21 `gratitude` haiku→sonnet live, PRD-34 `decision_guide` haiku→sonnet live). | Unintentional-Fix-Code | **SCOPE-3** + cross-ref Scope 4 cost-pattern | N |
| 16 | **Safe Harbor aggregation-exclusion guardrail** | Convention #243 | `lila-board-of-directors/index.ts` grep for `is_safe_harbor` returns ZERO matches. `lila-mediator/index.ts` same. Defense-in-depth gap; Convention #243 CI check is explicitly "convention text only at this stage". | Deferred-Document (latent) | — | — |

## Unexpected findings list (seams not covered in addendum)

1. **`_shared/auth.ts` only checks token validity, not conversation ownership.** The same defect exists in PRD-21 tool Edge Functions but was not surfaced there — it's actually a 9th F11 contributor pattern, NOT bounded to ThoughtSift. **Flag for orchestrator re-check of all prior evidence files: every Edge Function that accepts a `conversation_id` and doesn't re-verify `auth.user.id` matches a `family_members.user_id` WHERE `family_id = conv.family_id` is vulnerable.** This is a latent cross-cutting security gap.

2. **`lila_messages.safety_scanned` column exists but zero ThoughtSift Edge Functions mark their inserted messages for scanning.** When PRD-30 Layer 2 Haiku classification ships, the classification worker will presumably sweep `WHERE safety_scanned = false`, but these 5 Edge Functions will need to start marking `safety_scanned = false` on insert.

3. **Mediator `[SAFETY_TRIGGERED]` marker streamed to client mid-response before being stripped.** Cosmetic leak of an internal sentinel to the user's screen.

4. **Board of Directors is the only Edge Function that does NOT use `_shared/relationship-context.ts`.** It manually queries context tables with partial toggle enforcement. Drift pattern within the same PRD.

5. **Content policy gate is frontend-chained, not Edge-Function-enforced.** Architectural assumption that UI flows chain the two actions.

6. **`lila_tool_permissions` has 0 live rows (cross-reference EVIDENCE_prd21 Unexpected #1).** Even if seam #11 were fixed, no family has granted any ThoughtSift tool.

## Proposed consolidation (§5.1 + §5.2 candidates)

**§5.1 within-addendum:**

- Seams #1, #2, #3, #4, #5, #6, #7, #8 are strong positives (no finding).
- Seams #9, #14 fold into F-D "residual implementation drift" together.
- Seam #11 stands alone as primary F11 hit (tool permissions bypass).
- Seam #12 stands alone as secondary F11 hit (cross-family conversation ownership).
- Seam #13 stands alone as HITM persona-generation hit.
- Seam #15 is pure cross-addendum contributor (model-tier drift).
- Seam #10, #16 are Deferred-Document.

After §5.1: **2 SCOPE-8b primaries + 1 SCOPE-8b (HITM persona) + 1 SCOPE-3 consolidation** + 2 contributions to cross-addendum patterns.

**§5.2 cross-addendum candidates flagged for orchestrator review:**

**A. F11 server-side enforcement — PRD-34 contributes 5 fresh Edge Function surfaces (8th–12th overall).**

| Surface | Specific gap |
|---|---|
| PRD-15 | Per-pair `member_messaging_permissions` client-side only |
| PRD-17B | `classify_by_embedding` RPC trusts caller `p_family_id` |
| PRD-18 | `match_book_extractions` RPC trusts caller `p_family_id` |
| PRD-21 | `lila_tool_permissions` never checked by 8 tool Edge Functions |
| PRD-22 | `member_emails` login resolution not enforced |
| PRD-22 | `lila_member_preferences` not loaded |
| PRD-27 | Special Adult shift-window permission check reads wrong table |
| **PRD-34 (new ×5)** | **`lila_tool_permissions` never checked by 5 ThoughtSift Edge Functions** |
| **PRD-34 (additional)** | **`auth.ts` checks token but not conversation ownership across all 5 Edge Functions — cross-family data exposure** |

**Pattern now at 12+ surfaces. CROSS-ADDENDUM ESCALATE.** Recommend consolidating to ONE systemic finding: "Edge Functions bypass per-resource authorization across the platform; `authenticateRequest` validates the token but no function verifies the caller belongs to the target resource's family."

**B. Model-tier registry-vs-runtime drift — 3 surfaces confirmed.**

| Surface | Direction |
|---|---|
| PRD-19 `family_context_interview` | spec haiku, registry sonnet (no UI) |
| PRD-21 `gratitude` | registry haiku, runtime sonnet (live) |
| **PRD-34 `decision_guide`** | **registry haiku, runtime sonnet (live)** |

**Pattern at 3 surfaces — threshold reached. ESCALATE.**

**C. HITM gate cross-addendum pattern — 2 surfaces now confirmed.**

| Surface | Specific gap |
|---|---|
| PRD-21 | `communication_drafts` INSERT skips Edit/Approve/Regenerate |
| **PRD-34** | **`board_personas` INSERT on persona generation skips HITM — platform intelligence write** |

**Pattern at 2 surfaces — watch.**

## Proposed finding split

- **F-A: `lila_tool_permissions` has no server-side enforcement across 5 ThoughtSift Edge Functions** (seam #11). **SCOPE-8b primary + SCOPE-3 cross-ref. Beta Y.** Contributes 5 surfaces to the cross-addendum F11 pattern.
- **F-B: Edge Functions authenticate caller but do not verify conversation ownership** (seam #12 + Unexpected #1). **SCOPE-8b primary + SCOPE-3 cross-ref. Beta Y.** Most severe finding in this file — cross-family data leakage AND latent in every Edge Function across the platform that accepts a `conversation_id`. Strongly recommend elevating to platform-systemic finding.
- **F-C: `board_personas` generation skips HITM — platform intelligence table written without user confirmation** (seam #13). **SCOPE-8b primary + SCOPE-3 cross-ref. Beta Y.**
- **F-D: ThoughtSift implementation drift bundle** (seams #9 content policy gate frontend-chained, #14 BoD partial three-tier toggle, Unexpected #3 marker leak, Unexpected #4 shared helper inconsistency, Unexpected #2 safety_scanned not marked). **SCOPE-3 Low-Medium. Beta N.** Residual items.

## Beta Y candidates

1. **F-A (SCOPE-8b side)** — 5 more Edge Functions bypass `lila_tool_permissions`. 8th+ surface of the cross-addendum F11 pattern. Mediator Full Picture mode is the worst case.
2. **F-B** — Cross-family conversation ownership bypass. Trust-violation shape: authenticated user in family A can POST with family B's `conversation_id`, harvesting family B's Guiding Stars / Best Intentions / self-knowledge / private_notes / relationship_notes into a system prompt sent to Sonnet on family A's AI spend. **The most severe finding in the 3+8b traversal to date because it's (a) cross-tenant, (b) zero-click from the attacker side, (c) reaches both PRD-13 + PRD-19 flagship context surfaces.**
3. **F-C** — Persona generation writes `board_personas` without Edit/Approve/Regenerate. Matches the PRD-21 F-B HITM shape.

## Top 3 surprises

1. **Mediator `safety_triggered` flag is the best-in-class safety implementation in the entire Scope 3+8b traversal.** Persisted to `lila_conversations.context_snapshot`, checked from DB on every turn, survives close/reopen, prompts a dedicated SAFETY MODE system prompt that forbids framework resumption. Convention #96 honored verbatim.

2. **`auth.ts` is the weak link across the entire platform.** It only verifies Bearer token → user. Across 5 ThoughtSift Edge Functions (plus previously-confirmed 8 PRD-21 tool Edge Functions, plus PRD-17B / PRD-18 RPCs), no function re-checks that the caller belongs to the target resource's family. The F11 pattern is fundamentally "authenticate but don't authorize" — a systemic auth vs authz gap at the Edge Function boundary that would be a one-helper-function fix applied uniformly.

3. **Decision Guide's model-tier drift is a live cost hit.** Migration 100087 explicitly downgrades `decision_guide` to Haiku. Edge Function hardcodes Sonnet. The pattern now has 3+ confirmed surfaces and warrants a platform-wide remediation.

## Watch-flag hits

1. **F11 server-side enforcement:** **DIRECT HIT (Beta Y) ×2.** Seam #11 (tool permissions bypass — 5 fresh Edge Function surfaces). Seam #12 + Unexpected #1 (conversation ownership bypass — 5 additional surfaces + latent across all prior Edge Functions). **Cross-addendum F11 pattern is now at 12+ surfaces — ESCALATE TO SYSTEMIC FINDING.** Recommend renaming pattern from "F11: per-resource authorization bypass" to "F11: Edge Functions authenticate but do not authorize."
2. **Crisis Override:** **Not hit — STRONG POSITIVE.** All 5 ThoughtSift Edge Functions correctly integrate `detectCrisis(content)`. Reference-quality compliance.
3. **Convention #96 Mediator safety_triggered flag:** **Not hit — STRONG POSITIVE.** Canonical implementation.
4. **Convention #104 PRD-30 safety monitoring pipeline:** **Latent miss.** Deferred-Document; no finding emitted.
5. **F17 messaging behavior:** Not applicable.
6. **F22+F23 privacy/is_included_in_ai:** Partial hit via seam #14 (Board of Directors only checks item-level toggle). Perspective Shifter + Mediator correctly use `_shared/relationship-context.ts`.
7. **studio_queue source discipline:** Not applicable.
8. **`is_included_in_ai` three-tier propagation:** Mediator + Perspective Shifter use the reference implementation correctly (2 of 3). Board of Directors partial.
9. **HITM (Convention #4):** **DIRECT HIT (Beta Y).** Seam #13. Persona generation writes `board_personas` without Edit/Approve/Regenerate.
10. **Model-tier registry-vs-runtime drift:** **DIRECT HIT (cross-addendum).** Seam #15. 3rd surface confirmed — PATTERN ESCALATES.

## Orchestrator adjudication

(empty — pending walk-through)
