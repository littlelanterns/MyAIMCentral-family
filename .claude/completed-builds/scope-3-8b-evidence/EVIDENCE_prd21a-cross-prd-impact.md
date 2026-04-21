---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-20
Addendum: prds/addenda/PRD-21A-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-21A (source) ↔ PRD-04 (shell routing — Personal Prompt Library sidebar entry), PRD-05 (LiLa Core — vault_item_id metadata + tool sessions), PRD-05C (Optimizer — personalization pipeline unbuilt), PRD-10 (Widgets — Vault Recommendations widget stubbed), PRD-13 (Archives — physical_description + reference_photos), PRD-14 (Personal Dashboard), PRD-21 (Communication Tools — Vault install path broken at schema level), PRD-31 (tier enforcement — F-G cross-reference)
Provenance: Worker `add1283d99d1ffe8c` (Opus, report-only mode) ran the full evidence pass in-memory across the addendum (132 lines) + first ~1200 lines of PRD-21A-AI-Vault-Browse-Content-Delivery.md + migration `00000000100039_vault_tables.sql` (500+ lines) + `lila_tool_permissions` remediation migrations (`00000000000009`, `00000000000013`) + `useVaultBrowse` hook + `VaultContentCard` + `MemberAssignmentModal.tsx` (primary broken write path) + `AIToolDetail` + `CopyPromptButton` + `useSavedPrompts` + `SkillDetail` + grepped Edge Functions for `vault_item_id`/`physical_description`/`reference_photos`/`lila_optimization_prompt` consumption + cross-reference to PRD-31 F-G from `EVIDENCE_prd31-cross-prd-impact.md`. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Scope of this addendum's traversal: PRD-21A Cross-PRD Impact Addendum describes how AI Vault integrates with 7 existing PRDs (PRD-04 shell routing, PRD-05 LiLa Core, PRD-05C Optimizer, PRD-10 Widgets, PRD-13 Archives, PRD-14 Personal Dashboard, PRD-21 Communication Tools) plus a Build Order note. Worker read the full Cross-PRD addendum (132 lines), the first ~1200 lines of PRD-21A-AI-Vault-Browse-Content-Delivery.md in detail, the live `vault_tables` migration (00000000100039_vault_tables.sql, 500+ lines), the `lila_tool_permissions` remediation migrations (00000000000009, 00000000000013), the `useVaultBrowse` hook, `VaultContentCard`, `MemberAssignmentModal`, `AIToolDetail`, `CopyPromptButton`, `useSavedPrompts`, SkillDetail, and grepped Edge Functions for `vault_item_id`/`physical_description`/`reference_photos`/`lila_optimization_prompt` consumption. Worker also cross-referenced the closed F-G finding from EVIDENCE_prd31-cross-prd-impact.md which already covers the server-side tier-enforcement gap on all 47 Edge Functions — PRD-21A's `allowed_tiers` and `vault_consume`/`vault_optimize_lila` keys are downstream consumers of that same systemic gap.

The defining surprise: **MemberAssignmentModal.tsx writes `is_granted: true` and `granted_by: currentMember.id` to `lila_tool_permissions`**, but migration `00000000000013_lila_schema_remediation.sql` renamed `is_granted → is_enabled` and **dropped** `granted_by` entirely. Every "+Add to AI Toolbox" click against current schema produces a Postgres error on the `granted_by` column that does not exist. This is the Scope 3 wire-up primary finding for this addendum: the addendum's "fully wired" claim (line 58) is contradicted by the live code, which silently fails on the write.

A second surprise: every downstream "Optimize with LiLa" integration prescribed in the addendum (personalize with `physical_description`/`reference_photos`, inject `lila_optimization_prompt` as system guidance, pass `vault_item_id` as optimizer context) is **not consumed by any Edge Function**. The columns exist in DB (archive_member_settings, vault_items), are editable in UI (ReferencePhotosSection.tsx), and `vault_item_id` is typed on LilaConversation — but there is no `lila-optimizer` Edge Function, and the generic `optimizer` mode in `lila-chat/index.ts:72` is a one-line system prompt with zero reads of any vault-side column.

A third surprise: the Vault browse layer performs **zero role-based or tier-based filtering**. `useVaultBrowse.ts:100-108` pulls ALL `status='published'` rows without filtering by `teen_visible` for independent shell, and `VaultContentCard.tsx:40` hardcodes `isLocked = false` with comment "Will be: !userTierIncludes(item.allowed_tiers)". A teen with `vault_consume` sees the full adult Vault including communication-coaching content, mature themes, and mom-facing parenting tools. This is Scope 8b-adjacent child-data boundary drift.

A fourth surprise: `user_saved_prompts.user_id`, `vault_user_bookmarks.user_id`, `vault_user_progress.user_id`, `vault_first_sightings.user_id`, `vault_copy_events.user_id` all FK to `family_members(id)` in the migration — but the PRD schema spec says "FK → auth.users" on every one of them. Schema drift from spec, cosmetic.

A fifth surprise: `vault_recommendations` widget prescribed in addendum PRD-10/PRD-14 sections is entirely absent from `widget_starter_configs` seed and from src/. Small stub deferral.

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | "+Add to AI Toolbox" writes to `lila_tool_permissions` with correct columns | Addendum PRD-21 §, lines 57-67: creates rows with `source='vault'`, `vault_item_id` reference. Extends existing pattern. | `src/features/vault/components/MemberAssignmentModal.tsx:96-104` writes `is_granted: true` and `granted_by: currentMember.id`. Migration `00000000000013_lila_schema_remediation.sql:158-167` RENAMED `is_granted → is_enabled` and DROPPED `granted_by`. **Live writes will fail on missing `granted_by` column.** `source` and `vault_item_id` columns correctly added per migration `00000000000009:265-274`. | Unintentional-Fix-Code | SCOPE-3.F (primary — addendum says "fully wired" but code is broken) | **Y** (blocks primary Vault-Toolbox integration in beta) |
| 2 | Optimize with LiLa injects `lila_optimization_prompt` as system prompt | Addendum PRD-05C §, lines 96-106 + PRD-05 §, lines 27-37 | `supabase/functions/lila-chat/index.ts:72` defines `optimizer` mode as a one-line generic prompt. No Edge Function reads `lila_optimization_prompt`, `vault_item_id`, or any vault column. `src/features/vault/components/detail/PromptPackDetail.tsx:152` TODO comment: "When PRD-05C Optimizer is built, launch LiLa Optimizer conversation modal". | Documented (Optimizer is PRD-05C, unbuilt) | SCOPE-3.F | N |
| 3 | Image/video prompt optimization loads `physical_description` + `reference_photos` as high-priority context | Addendum PRD-13 §, lines 43-51 + PRD-05C §, lines 98-106 | Migration `00000000100039_vault_tables.sql:477-480` adds both columns. `src/components/archives/ReferencePhotosSection.tsx` + `src/pages/archives/ArchivesPage.tsx` support upload/view. **Zero Edge Function reads these columns** (`Grep` returns 0 hits across `supabase/functions/`). | Documented (Depends on unbuilt Optimizer) | SCOPE-3.F | N |
| 4 | `vault_item_id` metadata on `lila_conversations` for Vault-originated sessions | Addendum PRD-05 §, line 31 | `lila_conversations.vault_item_id` column exists. `src/hooks/useLila.ts:22` types the field. **Zero consumers:** no conversation creation path in Vault sets it (AIToolDetail.tsx:30-34 launches via `openTool(guided_mode_key)` without setting `vault_item_id`). No Edge Function reads it. | Unintentional-Fix-Code (plumbing exists at column/type level; writers + readers missing) | SCOPE-3.F | N |
| 5 | Vault browse filters by role for Independent (teen) — `teen_visible = true` only | Addendum PRD-04 §, lines 14-18 + PRD-21A Visibility table lines 712-716 | `src/features/vault/hooks/useVaultBrowse.ts:100-108` queries `from('vault_items').select('*').eq('status', 'published')` without any role filter. Independent shell shows adult Vault. Sidebar.tsx:134 routes Independent to `/vault` with `vault_consume` feature gate, but the page does not filter. `teen_visible` typed in VaultItem interface at line 30 but never used in filter logic. | Unintentional-Fix-Code (child-data boundary drift — teen sees mom-facing content) | **SCOPE-8b** primary + SCOPE-3.F cross-reference | **Y** (child-data boundary per PLAN §2.3 canonical surface) |
| 6 | Locked card per-tier treatment: faded overlay + tier badge when user's tier excludes `allowed_tiers` | Addendum PRD-21A browse spec lines 240-247 | `src/features/vault/components/VaultContentCard.tsx:40` hardcodes `const isLocked = false // Will be: !userTierIncludes(item.allowed_tiers)`. All cards render as unlocked regardless of `allowed_tiers`. | Documented (Cross-ref F-G from PRD-31 evidence; blanket beta unlock per Convention #10) | SCOPE-3.F cross-ref to SCOPE-8b F-G | N (inherits PRD-31 Beta rule) |
| 7 | AI Tool launch creates `vault_tool_sessions` record with token + expiry | Addendum PRD-05 §, lines 28-35 + PRD-21A screen 2 lines 158-165 | Migration creates the table. **No src/ code writes to `vault_tool_sessions`** (`Grep` in src/ returns zero hits). AIToolDetail.tsx:27-40 handles all three delivery methods but creates zero session record. Embedded-tool iframe launches without any token. No heartbeat/idle-timeout mechanism. `session_timeout_minutes` on vault_items column is dead data. | Unintentional-Fix-Code | SCOPE-3.F | N |
| 8 | LiLa proactive suggestion pattern in general chat | Addendum PRD-05 §, line 32 + PRD-21A §AI Integration lines 1013-1017 | `src/lib/ai/help-patterns.ts` has no vault patterns. `supabase/functions/lila-chat/index.ts` has no Vault-aware logic. PRD-21A Stubs table lines 1085-1086 explicitly lists "LiLa proactive Vault suggestions in general chat" as Stub with "Post-MVP" — expected-absent. | Intentional-Document (declared stub) | none (documented) | N |
| 9 | "Recommended for You" widget registered as dashboard widget type | Addendum PRD-10 §, lines 73-79 + PRD-14 §, lines 86-91 | `widget_starter_configs` has 39 rows. `Grep` for `vault_recommendations` in migrations and src/ returns zero hits. Widget type not registered. PRD-21A Stubs table line 1084 lists this as Stub → PRD-10 dependency. Expected-absent. | Intentional-Document (declared stub) | SCOPE-3.F (low; confirms declared stub) | N |
| 10 | Personal Prompt Library accessible from sidebar under AI Vault | Addendum PRD-04 §, lines 10-22 | Route `/vault/my-prompts` exists and renders `PersonalPromptLibraryPage` (App.tsx:143). Sidebar.tsx has AI Vault entry but **no sub-item for Personal Prompt Library** in any shell. User can only reach via typed URL. | Unintentional-Fix-Code | SCOPE-3.F (low) | N |
| 11 | Skill "Deploy with LiLa" personalizes with family context and registers in External Tool Registry | PRD-21A lines 425-550 on Skill pattern | `src/features/vault/components/detail/SkillDetail.tsx:32` stub: `alert('Deploy with LiLa — personalizes with family context. Coming soon!')`. No External Tool Registry table exists. Downstream [Download for Claude] / [Copy for ChatGPT] / [Copy for Gemini] buttons likely also stubs. | Documented (Depends on unbuilt Optimizer + unbuilt External Tool Registry) | SCOPE-3.F | N |
| 12 | `user_saved_prompts.user_id` FK to auth.users | PRD-21A line 937: "user_id UUID ... FK → auth.users" | Migration `00000000100039_vault_tables.sql:403` FKs to `family_members(id)`. Same pattern on 8 "user_id" columns. PRD spec text wrong; actual design is stricter. | Intentional-Document (PRD text drift; family_members FK is correct) | SCOPE-3.F (low — doc drift) | N |
| 13 | Copy rate limiting backed by `vault_copy_events` query | Addendum implicit via PRD-21A §Content Protection lines 652-668 | `src/features/vault/components/CopyPromptButton.tsx:62-71` uses a module-local JS array `copyTimestamps` that resets on page reload. Rate limit is purely client-side in-memory. No query against `vault_copy_events` to enforce across sessions/devices. | Unintentional-Fix-Code (rate limit bypassable via reload) | SCOPE-3.F (low — soft limit by design) | N |
| 14 | Content-type CHECK matches Convention #81 (`curation` not `tool_collection`) | Addendum lines 114-116 say `'tool_collection'` in taxonomy; Convention #81 updated to `'curation'` per PRD-21B addendum | Migration `00000000100039_vault_tables.sql:50` CHECK: `'tutorial', 'ai_tool', 'prompt_pack', 'curation', 'workflow', 'skill'`. PRD-21A addendum line 115 is stale (pre-rename). Migration correctly uses the post-rename value. | Intentional-Document (addendum text is stale but migration is correct) | none (documented — known addendum drift) | N |
| 15 | Teen assignment via MemberAssignmentModal — teens visible in list | Addendum PRD-21 §, lines 57-67 | `src/features/vault/components/MemberAssignmentModal.tsx:127-129` splits into adultMembers and childMembers. **Role filter at line 128 only matches `primary_parent`, `additional_adult`, `special_adult`**. Role 'independent'/'guided'/'play' fall into `role === 'member'` bucket. Code may misclassify shell roles. | Unintentional-Fix-Code (role classification may bypass teen/guided rows) | SCOPE-3.F (medium — roles listing gap) | N |

## Unexpected findings list

1. **lila_tool_permissions field-name breakage on Toolbox assignment** — `is_granted` → `is_enabled` rename and `granted_by` column drop invalidate MemberAssignmentModal.tsx writes. Captured as Seam 1.
2. **Vault browse does not filter by teen_visible** — Captured as Seam 5.
3. **Vault browse does not filter by allowed_tiers** — Captured as Seam 6.
4. **vault_tool_sessions table entirely unwired** — Captured as Seam 7.
5. **vault_item_id column on lila_conversations is dead data** — Captured as Seam 4.
6. **Personal Prompt Library missing from sidebar** — Captured as Seam 10.
7. **Skill "Deploy with LiLa" is a literal alert() stub** — Captured as Seam 11.
8. **Copy rate limiting is in-memory only, bypassable via refresh** — Captured as Seam 13.
9. **PRD text says FK to auth.users for 8 tables but migration FKs to family_members** — Captured as Seam 12. Cosmetic documentation drift.
10. **MemberAssignmentModal role-filtering uses stale role values** — Captured as Seam 15.
11. **No help-patterns entries for Vault FAQs** — Addendum doesn't prescribe but absence is notable.

## Proposed consolidation (§5.1 + §5.2 candidates)

### §5.1 Within-addendum consolidation

- **F-A: Vault ↔ Toolbox assignment write is broken at field-name level** — Seam 1 alone. Load-bearing primary finding.
- **F-B: Optimizer integration entirely unbuilt at server layer** — Consolidates Seams 2, 3, 4, 11. Vault→Optimizer pipeline DB-shaped, server-absent. Cross-refs F-D from PRD-31 evidence.
- **F-C: Vault browse has zero role- and tier-based filtering** — Consolidates Seams 5, 6. The teen-surface portion (Seam 5) elevates to SCOPE-8b per PLAN §2.3 child-data boundary.
- **F-D: Vault tool-session tracking unwired** — Seam 7 alone.
- **F-E: Minor wire-up polish** — Consolidates Seams 10, 13, 15. Low-priority cluster.
- **F-F: Documentation drift in PRD spec vs built schema** — Consolidates Seams 12, 14.

Final: **5 SCOPE-3 findings + 1 SCOPE-8b finding = 6 findings.**

### §5.2 Cross-addendum candidates flagged for orchestrator

- **Server-side tier enforcement gap (cross-ref F-G from PRD-31)** — Seam 6's tier-unlock stub is a downstream consumer of the same systemic gap.
- **Physical_description/reference_photos context injection** — Seam 3's pipeline is one of many "prescribed context consumers that don't exist because upstream Edge Function doesn't exist" patterns.
- **user_id FK drift (auth.users vs family_members)** — Seam 12 pattern. If this repeats in PRD-21B, PRD-21C, PRD-37, consolidate.
- **Schema rename breaking consumer writes** — Seam 1 pattern may repeat across the codebase. Worth watch-flagging for future addenda.

## Proposed finding split

- **SCOPE-8b primary count:** 1 (F-C teen-visibility portion)
- **SCOPE-3-only count:** 4 (F-A, F-B, F-D, F-E) + 1 cross-reference to PRD-31 F-G + 1 documentation (F-F)
- **Documented (no finding, declared stub):** Seams 8, 9
- **Provisional:** 0

**After consolidation: 6 total findings (5 SCOPE-3 + 1 SCOPE-8b).**

## Beta Y candidates

1. **F-A — MemberAssignmentModal writes fail on dropped `granted_by` column and renamed `is_enabled`.** The entire Vault ↔ Toolbox assignment surface is the addendum's central integration claim ("fully wired" per line 58). In-app failure on the single most important action for this addendum. Beta Y because any mom testing the Vault will hit this on first "+Add to AI Toolbox" tap. Fixable in ~5 lines.

2. **F-C (teen-visibility portion) — Vault browse shows Independent shell all adult content.** SCOPE-8b primary per PLAN §2.3 (child-data boundary). A teen in beta sees mom-facing parenting communication tools, spouse communication tools (Cyrano), mediator tools with relationship framing. Not a safety crisis per se (content is not harmful), but it's a child-data boundary violation.

All other findings default to N because they are downstream of unbuilt PRD-05C (Optimizer), unbuilt tier enforcement (PRD-31), or are doc-drift/polish-level.

## Top 3 surprises

1. **The addendum's primary claim — "+Add to AI Toolbox is fully wired" — is contradicted at the schema level.** MemberAssignmentModal writes `is_granted` and `granted_by` to a table where both were removed by a later remediation migration. Nobody noticed because the Vault likely hasn't been tested end-to-end post-remediation, or the path fails silently in the hook's `.then()` handler. This is the kind of bug the audit exists to catch.

2. **`vault_item_id` is a column on `lila_conversations` with zero writers and zero readers.** The addendum prescribes it (line 31), the type is defined in `useLila.ts:22`, the column exists in schema — but no code path actually sets it during conversation creation from a Vault surface.

3. **The entire Optimize with LiLa personalization pipeline is DB+UI complete, server-absent.** `physical_description` and `reference_photos` editable, `lila_optimization_prompt` editable in admin, `vault_item_id` on conversation typed, `enable_lila_optimization` boolean wired — but no Edge Function reads any of them. Recurring Phase 2 audit signature.

## Watch-flag hits

- **F11 — server-side per-tool-per-person enforcement:** HIT (via cross-ref to F-G from PRD-31). Beta-blocker status inherited from F-G.
- **Crisis Override duplication:** Not applicable — Vault browse is not a LiLa conversation surface.
- **F17 — PRD-08 messaging behavior-vs-intent:** Not applicable.
- **F22+F23 — PRD-19 reports × archive column drift:** Not applicable; however, physical_description / reference_photos as new archive columns share pattern lineage.
- **studio_queue handoff `source` discipline:** Not applicable.
- **`is_included_in_ai` three-tier propagation:** Not applicable to Vault's own content (admin-curated).

### Additional watch-flag candidates for orchestrator

- **Schema rename orphaning client writes** — Captured in Seam 1. Worth a standing watch-flag for future addenda.
- **"DB-shaped, server-absent" pipeline pattern** — Captured in Seams 2, 3, 4, 7 and F-G from PRD-31. Elevated to a cross-addendum observation: when infrastructure exists at storage + client-type layer but nothing on server consumes it, the feature reads as "80% built" in audit, but actually ships no user value.

## Orchestrator adjudication

(empty — pending walk-through)
