---
Status: DRAFT — awaiting orchestrator adjudication
Stage: C
Scope: 2 (PRD-to-code alignment), Batch 7 (Vault/BookShelf)
Opened: 2026-04-20
Related: [PLAN.md](PLAN.md) §3.5 Batch 7; [DECISIONS.md](DECISIONS.md) Round 7; [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §2; [EVIDENCE_BATCH_1_foundation.md](EVIDENCE_BATCH_1_foundation.md) (stylistic anchor)
---

# Scope 2 — Batch 7 Vault/BookShelf Evidence

## Worker cover paragraph

This evidence pass examined the seven Batch 7 PRDs — PRD-21 (Communication & Relationship Tools), PRD-21A (AI Vault Browse & Content Delivery), PRD-21B (AI Vault Admin Content Management), PRD-21C (AI Vault Engagement & Community), PRD-22 (Settings), PRD-23 (BookShelf), and PRD-34 (ThoughtSift) — against their code reality. Eight addenda were read in full at the start of the pass: PRD-21-Cross-PRD-Impact, PRD-21A-Cross-PRD-Impact, PRD-21B-Cross-PRD-Impact, PRD-21C-Cross-PRD-Impact, PRD-22-Cross-PRD-Impact, PRD-23-Cross-PRD-Impact, PRD-23-Session-Addendum (Phase 1b platform migration decisions), and PRD-34-Cross-PRD-Impact. Per Scope 2 PLAN §4.1 and Standing Rule 8, addendum supersessions were applied to every affected row — most materially to PRD-21B's `tool_collection → curation` rename, PRD-22's Name Packs removal, and PRD-23's `bookshelf_principles → bookshelf_insights` rename (where the addendum text still uses the older name). The three-column tables below contain **46 rows total** across the seven PRDs (PRD-21: 6, PRD-21A: 8, PRD-21B: 6, PRD-21C: 6, PRD-22: 8, PRD-23: 6, PRD-34: 6).

The headline patterns: this batch has the cleanest built surface for BookShelf (PRD-23 is largely complete post-Phase-1b platform migration, with 14 tables, 6 Edge Functions, and unified ExtractionBrowser wired) and the most unbuilt surface for admin + engagement layers (PRD-21B Admin Console Shell is entirely absent — no `/admin` route, no `AdminVault`, no Content Request Queue UI, no LiLa content suggestions, no Image Manager; PRD-21C's 6 engagement tables — `vault_engagement`, `vault_comments`, `vault_comment_reports`, `vault_moderation_log`, `vault_satisfaction_signals`, `vault_engagement_config` — are entirely absent from migrations and live_schema). PRD-22 Settings is the most surprising shape: the gear icon and `SettingsProvider` exist and work, but `openSettings()` explicitly navigates to the `/settings` **route** rather than rendering a **full-screen overlay** as PRD-22 Screen 1 specifies — and the `SettingsProvider.tsx` comment at line 6 explicitly states "Full Settings overlay conversion deferred to PRD-22 build." PRD-34 ThoughtSift has a distinctive shape: the five tool modes + Prayer Seat + persona disclaimer + Mediator `safety_triggered` persistence + Perspective Shifter `synthesizeFamilyContext` are all individually wired, but the `/thoughtsift` route itself ships a `PlannedExpansionCard` placeholder — tool access flows through the QuickTasks ThoughtSift submenu + `ToolLauncherProvider`, not through a dedicated ThoughtSift landing page as the PRD's sidebar-entry-point implies.

Three load-bearing surprises worth calling out above the row tables. First, CLAUDE.md Convention #80 (AI Vault = storefront, AI Toolbox = launcher) and PRD-21's Entry Point 2 explicitly specify an AI Toolbox sidebar section as the primary per-member tool launcher — but `src/components/shells/Sidebar.tsx:487` contains the comment "AI Toolbox removed — tools accessible via LiLa guided mode switcher." This is a material architectural supersession from PRD-21's spec, without a documented addendum authorizing it. Tools are still reachable via QuickTasks + Vault `+Add to AI Toolbox`, but the sidebar Toolbox section as mom's per-member launcher is absent. Second, Higgins display names drift at the seed layer: `lila_guided_modes` in `00000000000007_lila_ai_system.sql:233-234` seeds `higgins_say` as "What to Say" and `higgins_navigate` as "How to Navigate", while PRD-21 Screens 2 and 7-8 specify "Help Me Say Something" and "Help Me Navigate This." QuickTasks.tsx:151-152 uses the PRD-accurate labels at the submenu layer, meaning the user-visible launcher labels match PRD but the registry display_names do not — a two-layer divergence. Third, PRD-34-Cross-PRD-Impact-Addendum §"Impact on Platform Intelligence Pipeline v2" specifies a split-schema design for `board_personas` (system/community tiers in `platform_intelligence` schema, personal customs in `public` schema), but migration `00000000100049_prd34_thoughtsift_tables.sql:10` creates all `board_personas` rows in the `public` schema only — the intended schema split was not implemented.

## Per-PRD three-column discrepancy tables

### PRD-21-Communication-Relationship-Tools — three-column discrepancy table

| # | PRD spec (§/L reference) | Code reality (file:line) | Classification | Proposed finding | Notes |
|---|---|---|---|---|---|
| 1 | PRD-21 §Screens L233 specifies `communication_drafts` and `teaching_skill_history` tables with RLS + indexes | [00000000100041_prd21_communication_tools.sql:171-196](../supabase/migrations/00000000100041_prd21_communication_tools.sql#L171) creates both tables with specified columns, RLS policies, and indexes. Live schema shows `teaching_skill_history` at 29 rows, `communication_drafts` at 0 rows | Intentional-Document | no emission (wired per spec) | Tables match spec. Zero rows on `communication_drafts` indicates Cyrano/Higgins Say Save Draft paths are untested by users. |
| 2 | PRD-21 §Screen 3 Modal L162-188 + §Entry Points L70-102 specify **AI Toolbox sidebar section** as per-member curated tool launcher, visible in Mom/Adult/Independent/Guided shells | [src/components/shells/Sidebar.tsx:487](../src/components/shells/Sidebar.tsx#L487) contains the literal comment "AI Toolbox removed — tools accessible via LiLa guided mode switcher." No sidebar section renders. Tools remain reachable via QuickTasks submenu (PRD-21 Entry Point 1, still wired) | Scope-Creep-Evaluate | SCOPE-2.F{PENDING}-CANDIDATE-PRD21-AI-TOOLBOX-REMOVED | Sidebar removal is a material architectural supersession of PRD-21's Entry Point 2. No addendum authorizes this. Founder must decide: codify (remove Toolbox section from PRD-21) or restore (rebuild sidebar section). |
| 3 | PRD-21 §AI Integration L414,516 + CLAUDE.md Convention for Higgins Say display "Help Me Say Something" / Higgins Navigate "Help Me Navigate This" | [00000000000007_lila_ai_system.sql:233-234](../supabase/migrations/00000000000007_lila_ai_system.sql#L233) seeds Higgins Say as `'What to Say'` and Higgins Navigate as `'How to Navigate'` in `lila_guided_modes.display_name`. [src/components/shells/QuickTasks.tsx:151-152](../src/components/shells/QuickTasks.tsx#L151) uses PRD-accurate labels "Help Me Say Something" / "Help Me Navigate This" | Unintentional-Fix-Code | SCOPE-2.F{PENDING}-CANDIDATE-PRD21-HIGGINS-DISPLAY-NAME-DRIFT | Two-layer divergence — user-visible QuickTasks submenu matches PRD, seed registry column does not. Any surface that reads `lila_guided_modes.display_name` (conversation history, mode switcher, etc.) will show the wrong name. Fix is one-line UPDATE migration. |
| 4 | PRD-21 §Veto Memory Pattern L228-236 specifies negative-preference context saved via write-back with "AVOID suggesting" reverse-loading | [00000000100041_prd21_communication_tools.sql:161](../supabase/migrations/00000000100041_prd21_communication_tools.sql#L161) adds `is_negative_preference` to `archive_context_items`. [supabase/functions/lila-cyrano/index.ts:130](../supabase/functions/lila-cyrano/index.ts#L130) + [lila-gifts/index.ts:42](../supabase/functions/lila-gifts/index.ts#L42) + [lila-higgins-say/index.ts:144](../supabase/functions/lila-higgins-say/index.ts#L144) load and respect veto context | Intentional-Document | no emission (wired per spec) | Pattern fully wired across 3 tools. |
| 5 | PRD-21 §Tools 1-8 L410-736 register 8 guided modes with model=Sonnet, context_sources, person_selector, available_to_roles | [00000000000007_lila_ai_system.sql:227-234](../supabase/migrations/00000000000007_lila_ai_system.sql#L227) seeds 8 modes. 8 Edge Functions exist: lila-quality-time, lila-gifts, lila-observe-serve, lila-words-affirmation, lila-gratitude, lila-cyrano, lila-higgins-say, lila-higgins-navigate | Intentional-Document | no emission (wired per spec) | All 8 tools reach the user through QuickTasks submenu → ToolLauncherProvider → ToolConversationModal pipeline. |
| 6 | PRD-21 §Skill-Check Mode L658,752 specifies "after 5+ interactions, LiLa offers skill-check mode" for Cyrano and Higgins Say | Grep for "skill.check\|skillCheck\|skill_check" in supabase/functions/lila-cyrano/ + lila-higgins-say/ + lila-higgins-navigate/ returns no hits beyond rotation logic | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21-SKILL-CHECK-MODE-MISSING | Skill-check mode progression (the "make itself unnecessary" teaching flow) is a PRD-21 signature feature not implemented in any Edge Function. Core craft-first flow is wired; the 5+ interaction skill-check branch is not. No STUB_REGISTRY entry found for this gap. |

#### Classification ambiguities (PRD-21)

- Row 2 (AI Toolbox removed): Considered Intentional-Document (sidebar comment documents the removal) but no addendum authorizes the architectural change. Chose Scope-Creep-Evaluate since this is a deliberate scope reduction that founder must decide whether to codify or reverse.
- Row 3 (Higgins display name drift): Considered Intentional-Document (two names, two layers, code is partially-truth). Chose Unintentional-Fix-Code because QuickTasks labels match PRD, meaning code intent was to match PRD — the seed registry is just out of sync.

### PRD-21A-AI-Vault-Browse-Content-Delivery — three-column discrepancy table

| # | PRD spec (§/L reference) | Code reality (file:line) | Classification | Proposed finding | Notes |
|---|---|---|---|---|---|
| 1 | PRD-21A §Data Schema L732+ defines 12 tables; §Content Types specifies 6-value CHECK: 'tutorial', 'ai_tool', 'prompt_pack', 'tool_collection', 'workflow', 'skill' | [00000000100039_vault_tables.sql](../supabase/migrations/00000000100039_vault_tables.sql) creates all 12 tables. `content_type` CHECK uses `'curation'` not `'tool_collection'` per [line 50](../supabase/migrations/00000000100039_vault_tables.sql#L50) — SUPERSEDES: [PRD-21B-Cross-PRD-Impact-Addendum §Impact on PRD-21A](../prds/addenda/PRD-21B-Cross-PRD-Impact-Addendum.md) | Intentional-Document | no emission (addendum supersedes base PRD) | PRD-21A text still says `tool_collection`; code correctly uses `curation` per PRD-21B addendum's rename decision. PRD-21A text should be updated. |
| 2 | PRD-21A §Content Protection L648-668 specifies 8 measures including no text selection, copy event tracking, 20/60min rate limit, on-demand loading | [src/features/vault/components/ContentProtection.tsx:22-48](../src/features/vault/components/ContentProtection.tsx#L22) wires `userSelect:'none'` + `disableImageRightClick`. [CopyPromptButton.tsx:17](../src/features/vault/components/CopyPromptButton.tsx#L17) documents 20-copy/60-min soft rate limit. `vault_copy_events` table populated on copy | Intentional-Document | no emission (wired per spec) | Content protection appears complete. `vault_copy_events` has 0 rows in live_schema — no user copies yet. |
| 3 | PRD-21A §NEW Badge System L672-690 specifies per-user first-seen tracking via `vault_first_sightings`, default 30-day countdown | [src/features/vault/hooks/useVaultBrowse.ts:141-145](../src/features/vault/hooks/useVaultBrowse.ts#L141) queries `vault_first_sightings` and upserts on first visit per [L241](../src/features/vault/hooks/useVaultBrowse.ts#L241). [VaultContentCard.tsx:31,95](../src/features/vault/components/VaultContentCard.tsx#L31) renders NEW badge conditionally on first_seen_at window. Live schema shows 81 sightings recorded | Intentional-Document | no emission (wired per spec) | System working in production. |
| 4 | PRD-21A §Screen 5 Optimize with LiLa L294-314 + §Forward note L1011 specify `physical_description` on member Archive settings feeding image/video prompt optimization | [src/hooks/useAvatarUpload.ts:137-176](../src/hooks/useAvatarUpload.ts#L137) + [src/components/archives/ReferencePhotosSection.tsx:38](../src/components/archives/ReferencePhotosSection.tsx#L38) wire upload of up to 7 reference_photos. [src/features/vault/components/detail/PromptPackDetail.tsx:148-168](../src/features/vault/components/detail/PromptPackDetail.tsx#L148) `OptimizeButton` explicitly comments `STUB: Optimizer EF not deployed yet. Show a gentle message.` and title says "Optimize with LiLa — coming soon" | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21A-OPTIMIZER-INTEGRATION-STUB | Physical description + reference photos infrastructure fully wired on the Archives side. Optimizer Edge Function invocation from Vault is stubbed. Optimizer is PRD-05C's surface — this row flags the PRD-21A-side stub and the unmet dependency on PRD-05C Optimizer build. |
| 5 | PRD-21A §Skill Content Type L400-434 specifies "Deploy with LiLa" action that personalizes skill with family context and registers in External Tool Registry | [src/features/vault/components/detail/SkillDetail.tsx:32](../src/features/vault/components/detail/SkillDetail.tsx#L32) "Deploy with LiLa" button handler is `alert('Deploy with LiLa — personalizes with family context. Coming soon!')` — not wired to any Edge Function or registry | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21A-SKILL-DEPLOY-STUB | PRD-21A §Step 1-7 describe full deploy-with-LiLa flow including Framework + Family Context Block + Context Update Instructions. Platform download/copy buttons exist but the premium "Deploy with LiLa" action is a plain alert. No External Tool Registry infrastructure exists. |
| 6 | PRD-21A §Learning Ladder L635-645 + CLAUDE.md Convention #90 specify `ladder_position` is internal content strategy metadata, NOT user-facing filter | [00000000100039_vault_tables.sql:54](../supabase/migrations/00000000100039_vault_tables.sql#L54) adds the column. Grep for `ladder_position` in src/features/vault/ returns zero user-facing filter hits — column exists, not exposed | Intentional-Document | no emission (convention honored) | Confirmation of convention compliance. |
| 7 | PRD-21A §Member Assignment Modal L247-286 specifies multi-member checkbox picker creating `lila_tool_permissions` records with `source='vault'` and `vault_item_id` | [src/features/vault/components/MemberAssignmentModal.tsx:26,138,169](../src/features/vault/components/MemberAssignmentModal.tsx#L26) implements the flow. `lila_tool_permissions` column additions for `source`, `vault_item_id`, `saved_prompt_id` migrated per [00000000100039_vault_tables.sql:469-474](../supabase/migrations/00000000100039_vault_tables.sql#L469) | Intentional-Document | no emission (wired per spec) | |
| 8 | PRD-21A §AI Tool Delivery Methods L620-628 specifies `native` (LiLa modal via guided_mode_key), `embedded` (iframe), `link_out` (new tab) | [src/features/vault/components/detail/AIToolDetail.tsx:28-37,95,116](../src/features/vault/components/detail/AIToolDetail.tsx#L28) branches on all 3 delivery methods. Native delegates to ToolLauncherProvider which selects TranslatorModal / BoardOfDirectorsModal / ToolConversationModal by `guided_mode_key` per [ToolLauncherProvider.tsx:84-90](../src/components/lila/ToolLauncherProvider.tsx#L84). Cross-ref: SCOPE-5.F4 Finding G (Vault delivery methods reconciled) | Intentional-Document | no emission (CROSS-REF: SCOPE-5.F4 Finding G) | Delivery methods audited and reconciled in Scope 5. |

#### Classification ambiguities (PRD-21A)

- Row 4 + Row 5 (Optimizer / Deploy with LiLa stubs): Both are Deferred-Document but depend on downstream PRD-05C Optimizer work. Considered Unintentional-Fix-Code (buttons exist but are stubs). Chose Deferred-Document because the Edge Function infrastructure they'd invoke is genuinely not built; these are legitimate phase gates, not accidental omissions. STUB_REGISTRY confirmation needed.

### PRD-21B-AI-Vault-Admin-Content-Management — three-column discrepancy table

| # | PRD spec (§/L reference) | Code reality (file:line) | Classification | Proposed finding | Notes |
|---|---|---|---|---|---|
| 1 | PRD-21B §Screen 0 Admin Console Shell L74-118 specifies `/admin` route with tabbed navigation (AI Vault, Moderation, System, Analytics), gated by `staff_permissions` | Grep `"/admin"` in src/App.tsx returns only `<Route path="/admin/*">` is absent. No AdminShell, no tab navigation component. Grep `staff_permissions` in src/ returns zero hits | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21B-ADMIN-CONSOLE-UNBUILT | Entire Admin Console Shell missing. `staff_permissions` table from PRD-02 migrated but has no consumer. |
| 2 | PRD-21B §Screen 1 Content Dashboard L121-174 + §Screen 2 Content Editor L178-377 specify adaptive CRUD form for all 6 content types with sections, LiLa suggestions, status transitions | No admin-facing vault CRUD UI exists. Vault content must be managed via direct migration/SQL edits. Live schema shows 17 `vault_items` rows — all seeded via migrations | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21B-ADMIN-CONSOLE-UNBUILT | Rolls into the admin-console-unbuilt candidate. All CRUD surfaces (dashboard, editor, prompt pack entry manager, curation detail, category manager, content request queue, analytics, image manager) are absent. |
| 3 | PRD-21B §Screen 5 Content Request Queue L604-674 specifies admin queue for user-submitted content requests with `Copy All Pending` export | [src/features/vault/components/ContentRequestForm.tsx:29](../src/features/vault/components/ContentRequestForm.tsx#L29) writes `vault_content_requests` (user-submission side wired). No admin-facing queue UI. Live schema shows 0 rows | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21B-ADMIN-CONSOLE-UNBUILT | User submission works; admin triage surface does not. Consolidates with admin-console candidate. |
| 4 | PRD-21B §LiLa Content Suggestions L918-951 specifies single-API-call returning structured metadata (display_title, detail_title, tags, category, curation suggestions) | No LiLa content suggestion Edge Function exists. No admin-side invocation. | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21B-ADMIN-CONSOLE-UNBUILT | Consolidates. |
| 5 | PRD-21B §Screen 7 Image Manager L770-812 specifies orphaned image detection + bulk delete from Supabase Storage | No Image Manager UI exists. Storage buckets `vault-thumbnails` and `vault-prompt-images` exist per convention but no cleanup surface | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21B-ADMIN-CONSOLE-UNBUILT | Consolidates. |
| 6 | PRD-21B §Schema additions L852 adds `last_published_at TIMESTAMPTZ` column to `vault_items` | Live schema `vault_items` includes `last_published_at` per [claude/live_schema.md §vault_items](../claude/live_schema.md). [00000000100039_vault_tables.sql:70](../supabase/migrations/00000000100039_vault_tables.sql#L70) creates the column | Intentional-Document | no emission (wired per spec) | Column exists; no admin UI consumes it yet. |

#### Classification ambiguities (PRD-21B)

- Rows 1-5 all consolidate into one admin-console-unbuilt candidate. Considered splitting Image Manager and Content Request Queue into separate candidates. Chose consolidation because the Admin Console Shell (Screen 0) is the blocking gate for all admin surfaces — partial admin builds are not meaningful without the shell.

### PRD-21C-AI-Vault-Engagement-Community — three-column discrepancy table

| # | PRD spec (§/L reference) | Code reality (file:line) | Classification | Proposed finding | Notes |
|---|---|---|---|---|---|
| 1 | PRD-21C §Data Schema L554-681 defines 6 tables: `vault_engagement`, `vault_comments`, `vault_comment_reports`, `vault_moderation_log`, `vault_satisfaction_signals`, `vault_engagement_config` | All 6 tables flagged "not present in the live database" per [claude/live_schema.md §AI Vault](../claude/live_schema.md). Grep for any of the 6 table names in `supabase/migrations/` returns zero hits. Grep in `src/` returns zero hits | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21C-ENGAGEMENT-UNBUILT | Entire engagement layer unbuilt. No migrations, no readers, no writers. |
| 2 | PRD-21C §Additions to `vault_items` L682-690 add 4 denormalized counters `heart_count`, `comment_count`, `satisfaction_positive`, `satisfaction_negative` | All 4 columns present per [00000000100039_vault_tables.sql:3,84-88](../supabase/migrations/00000000100039_vault_tables.sql#L3) and live_schema. [useVaultBrowse.ts:55](../src/features/vault/hooks/useVaultBrowse.ts#L55) reads `heart_count` | Unintentional-Fix-Code | SCOPE-2.F{PENDING}-CANDIDATE-PRD21C-ENGAGEMENT-UNBUILT | Denormalized counters exist WITHOUT database triggers to maintain them (PRD-21C specifies triggers on `vault_engagement` insert/delete → update `vault_items.heart_count`). Counters are read-only, always 0, because their source table doesn't exist. Consolidates with engagement-unbuilt candidate. |
| 3 | PRD-21C §Screen 3 Discussion Thread L144-225 specifies threaded comments mom-only, Haiku moderation gate, report flow, auto-hide at 3+ reports | No discussion UI exists. No Haiku moderation Edge Function exists (none in supabase/functions/). No report modal. | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21C-ENGAGEMENT-UNBUILT | Consolidates. |
| 4 | PRD-21C §Screen 2 Engagement Bar L97-142 + Screen 6 My Vault Activity L315-359 specify heart button, satisfaction prompt, discussion count, usage history | Heart button, satisfaction signals, discussion count not wired. [My Vault Activity page absent — no route in App.tsx for `/vault/activity`] | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21C-ENGAGEMENT-UNBUILT | Consolidates. |
| 5 | PRD-21C §Screen 7 Recommendation Rows L363-391 specify 4 sub-rows (Popular in Category, Because You Hearted, New Since Last Visit, In Progress) replacing PRD-21A Recommended for You | Recently Viewed row exists via `last_accessed_at` sort. The 4 recommendation sub-rows are not individually implemented as named rows in browse page. | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD21C-ENGAGEMENT-UNBUILT | Partial (Recently Viewed works, 4 sub-rows do not). Consolidates. |
| 6 | PRD-21C §Additions to `user_saved_prompts` add `shared_with_member_id` + to `lila_tool_permissions` add `saved_prompt_id` | Both columns present per [00000000100039_vault_tables.sql:413,473](../supabase/migrations/00000000100039_vault_tables.sql#L413). "Share from My Prompts" UI (PRD-21C Screen 4) is not wired — no picker, no flow | Unintentional-Fix-Code | SCOPE-2.F{PENDING}-CANDIDATE-PRD21C-ENGAGEMENT-UNBUILT | Schema migrated ahead of full PRD-21C build. Toolbox rendering logic to check `saved_prompt_id` first not wired. Consolidates. |

#### Classification ambiguities (PRD-21C)

- Row 2 + Row 6 (schema columns without consumers): Could be Intentional-Document (forward-prep for PRD-21C build). Chose Unintentional-Fix-Code via the conservative classification rule — these are columns currently dead-weight in the schema, which is evidence that the PRD-21C build is incomplete, not that the PRD is stale. Consolidates with the overall engagement-unbuilt candidate.

### PRD-22-Settings — three-column discrepancy table

| # | PRD spec (§/L reference) | Code reality (file:line) | Classification | Proposed finding | Notes |
|---|---|---|---|---|---|
| 1 | PRD-22 §Screen 1 L73-151 + Decision #1 + CLAUDE.md Convention from PRD-22: "Settings is a full-screen overlay, NOT a route. No `/settings` URL exists" | [src/App.tsx:153](../src/App.tsx#L153) registers `<Route path="/settings" element={<SettingsPage />}>`. [src/components/settings/SettingsProvider.tsx:6,29-33](../src/components/settings/SettingsProvider.tsx#L6) explicitly navigates to `/settings` via `navigate('/settings')` with comment "Full Settings overlay conversion deferred to PRD-22 build" | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD22-SETTINGS-PAGE-VS-OVERLAY | Explicit deferral noted in code comment. PRD-22 Decision #1 specifies overlay pattern to preserve context; current route-based Settings loses page context on navigation. Functional alternative, not architectural equivalence. |
| 2 | PRD-22 §Screen 6 L426-464 specifies Permission Hub embedded within Settings overlay | [src/pages/SettingsPage.tsx:30-206](../src/pages/SettingsPage.tsx#L30) does not embed Permission Hub. Permission Hub is accessed via separate `/permission-hub` route (PRD-02). No Settings → Privacy → "Open Permission Hub" link | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD22-SETTINGS-EMBEDS-MISSING | Consolidates embed gap with Calendar Settings / Messaging Settings / Notification Preferences / LiLa Context Settings. |
| 3 | PRD-22 §Screen 8 L530-544 + §Screen 9 L547-560 + §Screen 5 L411-422 + §Screen 7 L467-529 specify Calendar Settings, Messaging Settings, Notification Preferences, LiLa Preferences all embedded within Settings overlay | SettingsPage.tsx does not embed any of these. Grep confirms no Calendar Settings / Messaging Settings / Notification Preferences / LiLa Context Settings component is invoked from SettingsPage | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD22-SETTINGS-EMBEDS-MISSING | Cross-refs PRD-14B Screen 7, PRD-15 Screens 6+10, PRD-05 Context Settings — all exist as separate pages but none are reached through Settings overlay. |
| 4 | PRD-22 §Screen 2 Account Settings L153-214 specifies Delete My Account with 30-day soft-delete grace period backed by `account_deletions` table | [00000000100027_prd01_repair.sql:234](../supabase/migrations/00000000100027_prd01_repair.sql#L234) creates `account_deletions` table with `grace_period_days`, `scheduled_for` columns (0 rows in live_schema). No UI surface — grep `Delete My Account`, `account_deletions`, `hard_deleted_at` in `src/` returns zero hits | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD22-ACCOUNT-LIFECYCLE-UI-MISSING | Backing infrastructure migrated, consumer absent. Cross-ref SCOPE-8a.F2 data-lifecycle scope. |
| 5 | PRD-22 §Screen 11 Data Export L605-640 specifies `[Download All Data]` button creating `data_exports` record with async ZIP generation | `data_exports` table is NOT present in migrations or live_schema. [SettingsPage.tsx:197-203](../src/pages/SettingsPage.tsx#L197) renders `Export Family Data` link that navigates to `/archives/export` — a different surface, not the PRD-22 Screen 11 ZIP export | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD22-DATA-EXPORT-MISSING | `data_exports` table entirely absent. Archives export is scoped differently (context-only export, not full family-data ZIP). Cross-ref SCOPE-8a.F2. |
| 6 | PRD-22 §Screen 2 L162-169 + §Data Schema L699-719 add `member_emails` table with multi-email-per-member support | [00000000100027_prd01_repair.sql:188-198](../supabase/migrations/00000000100027_prd01_repair.sql#L188) creates `member_emails` table. No UI wired — grep `member_emails` in `src/` returns zero hits | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD22-MULTI-EMAIL-UI-MISSING | Backing table wired in PRD-01 repair migration; Screen 2 UI to add/verify/set-primary absent. |
| 7 | PRD-22 §Screen 7 L467-526 specifies `lila_member_preferences` with tone/response_length/history_retention dropdowns and auto-archive of conversations past retention | [00000000000007_lila_ai_system.sql:157](../supabase/migrations/00000000000007_lila_ai_system.sql#L157) creates the table (0 rows in live_schema). No UI to set preferences. No auto-archive cron | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD22-LILA-PREFS-UI-MISSING | Backing table migrated; consumer UI + cron both absent. History retention + auto-archive not wired. |
| 8 | PRD-22 §CLAUDE.md Additions + Decision #5 remove Name Packs; PRD-03 references should be updated | Grep `Name Pack\|name_pack\|namePack` in src/ and prds/ returns zero code hits — feature successfully removed | Intentional-Document | no emission (cleanly removed) | Confirmation Name Packs are absent as intended. |

#### Classification ambiguities (PRD-22)

- Row 1 (Settings page vs overlay): Considered Unintentional-Fix-Code (PRD specifies overlay, code ships page). Chose Deferred-Document because `SettingsProvider.tsx:6` explicitly comments the deferral — the drift is deliberately phased, not accidental. Meets the stricter evidence bar for Deferred-Document per PLAN §4.3.2.
- Row 4 (account deletion): Shares scope boundary with SCOPE-8a.F2. Considered no-emission with cross-ref only. Chose to emit as Scope-2 finding because it's a UI gap (the account deletion UI) distinct from F2's broader lifecycle compliance scope.

### PRD-23-BookShelf — three-column discrepancy table

| # | PRD spec (§/L reference) | Code reality (file:line) | Classification | Proposed finding | Notes |
|---|---|---|---|---|---|
| 1 | PRD-23 §Data Schema L503-928 defines 14 tables. PRD-23-Cross-PRD-Impact-Addendum §Semantic Context (L157-180) references `bookshelf_principles` as the insights table name | [00000000100059_prd23_bookshelf_schema.sql:354](../supabase/migrations/00000000100059_prd23_bookshelf_schema.sql#L354) creates table `bookshelf_insights` (not `bookshelf_principles`). PRD-23 base text itself uses `bookshelf_insights` (L623-657), so base PRD and live schema align — addendum text is stale | Unintentional-Fix-PRD | SCOPE-2.F{PENDING}-CANDIDATE-PRD23-ADDENDUM-INSIGHTS-RENAME-DRIFT | Addendum references old `bookshelf_principles` name even though base PRD-23 correctly says `bookshelf_insights`. One-line addendum text amendment to close. |
| 2 | PRD-23 §Screens L83-465 + §Data Schema L503-928 specify complete BookShelf feature with 5 extraction tabs + platform cache + discussions + collections + study guides | All 14 tables migrated per [00000000100059_prd23_bookshelf_schema.sql](../supabase/migrations/00000000100059_prd23_bookshelf_schema.sql). 7 BookShelf Edge Functions exist: bookshelf-discuss, bookshelf-extract, bookshelf-key-points, bookshelf-process, bookshelf-search, bookshelf-study-guide. ~40 component files under `src/components/bookshelf/` including unified `ExtractionBrowser.tsx`. Live schema: `bookshelf_chunks` 58,379 rows; `bookshelf_insights` 24,360; `bookshelf_items` 562 | Intentional-Document | no emission (wired per spec) | Largest single built surface in this batch. Phase 1b platform-library migration confirmed (`book_cache_id` FK + platform-level chunks per PRD-23 Decision #4). |
| 3 | PRD-23-Session-Addendum §4 SemanticSearchPanel L156-226 specifies app-wide `useSemanticSearch()` hook consumed by Safe Harbor, InnerWorkings, Journal, Tasks, Family Context, LifeLantern, Meetings | [src/components/bookshelf/SemanticSearchPanel.tsx](../src/components/bookshelf/SemanticSearchPanel.tsx) exists. Grep `useSemanticSearch` in src/ outside `bookshelf/` returns zero hits. Only BookShelfLibrary.tsx and ExtractionBrowser.tsx use the panel | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD23-SEMANTIC-SEARCH-CROSS-FEATURE-STUB | Component exists with correct architecture. 8 external consumers listed in the addendum integration map are not yet wired — each is a forward-note per addendum text. Consolidates into a single cross-feature stub candidate. PATTERN-FLAG-FOR-SCOPE-3 (the seam to each consumer PRD is Scope 3 territory). |
| 4 | PRD-23-Session-Addendum §6 Apply Section L314-333 specifies **two buttons only**: Discuss Book + Study Guide (Generate Goals/Questions/Tasks + Refresh Key Points removed in favor of per-item routing) | [src/components/bookshelf/ExtractionHeader.tsx:187-214,420-426](../src/components/bookshelf/ExtractionHeader.tsx#L187) surfaces Discuss + Study Guide + OpenHistory + GoDeeper. [src/components/bookshelf/ApplyThisSheet.tsx](../src/components/bookshelf/ApplyThisSheet.tsx) handles per-item routing to Guiding Stars / Best Intentions / Tasks / Tracker / Journal Prompts | Intentional-Document | no emission (matches addendum simplification) | Per-item routing buttons handle what the removed Generate* buttons did. Matches session addendum Decision #8. |
| 5 | PRD-23 §Guided Modes L964 + §AI Integration register `book_discuss` and `library_ask` modes with Sonnet. Session Addendum §5 Study Guides uses `bookshelf-study-guide` Haiku function | [supabase/functions/bookshelf-discuss/index.ts](../supabase/functions/bookshelf-discuss/index.ts) wires `book_discuss` mode. `bookshelf-study-guide` Edge Function exists. `lila_guided_modes` seed has `book_discuss` registered | Intentional-Document | no emission (wired per spec) | Two guided modes seeded. `library_ask` presence verified (mode_key 'library_ask' surfaces via grep of lila_guided_modes seeds — included in base 00000007 seed). |
| 6 | PRD-23 §Visibility & Permissions L472-493 specifies BookShelf available to Mom (full), Adult (if granted), Independent (if granted), Guided (mom-assigned only), Play (not present) | [src/App.tsx:165](../src/App.tsx#L165) routes `/bookshelf` to BookShelfPage for authenticated users. [src/pages/BookShelfStub.tsx](../src/pages/BookShelfStub.tsx) exists as residual stub not actually routed anywhere. `bookshelf_member_settings` table seeds per-member access | Intentional-Document | no emission (wired per spec, stub residual noted) | BookShelfStub.tsx is dead code — it renders PlannedExpansionCard but no route points to it. Minor cleanup opportunity, not a Scope-2 finding. |

#### Classification ambiguities (PRD-23)

- Row 1 (addendum text drift): Considered no-emission since base PRD and code agree. Chose Unintentional-Fix-PRD because addendum stays authoritative per Standing Rule 8 and leaving it stale degrades the spec surface (same rationale as F5 in Foundation batch's shift supersession addendum ruling).

### PRD-34-ThoughtSift — three-column discrepancy table

| # | PRD spec (§/L reference) | Code reality (file:line) | Classification | Proposed finding | Notes |
|---|---|---|---|---|---|
| 1 | PRD-34 §Overview L14-22 positions ThoughtSift as 5 tools accessed via AI Vault + AI Toolbox assignment + QuickTasks. No dedicated `/thoughtsift` route specified in screens. Sidebar entry `/thoughtsift` referenced only in Convention glossary | [src/App.tsx:178](../src/App.tsx#L178) registers `<Route path="/thoughtsift" element={<ThoughtSiftPage />}>`. [src/pages/placeholder/index.tsx:62-64](../src/pages/placeholder/index.tsx#L62) `ThoughtSiftPage` renders `<PlaceholderPage ... prd="PRD-34" featureKey="thoughtsift_board_of_directors" />` with no functional surface | Deferred-Document | SCOPE-2.F{PENDING}-CANDIDATE-PRD34-THOUGHTSIFT-PAGE-STUB | `/thoughtsift` page is a PlaceholderPage with no content beyond description text. Tools are fully reachable via QuickTasks ThoughtSift submenu + ToolLauncherProvider + modal pipeline, so the stub does not block functional access — but users clicking the sidebar ThoughtSift link land on a non-functional page. Clean up by either (a) removing the route and relying on QuickTasks, or (b) building a ThoughtSift landing page that describes the 5 tools and launches them. |
| 2 | PRD-34-Cross-PRD-Impact-Addendum §Impact on Platform Intelligence Pipeline specifies `board_personas` split-schema: system/community in `platform_intelligence` schema, personal_custom in `public` schema | [00000000100049_prd34_thoughtsift_tables.sql:10](../supabase/migrations/00000000100049_prd34_thoughtsift_tables.sql#L10) creates `public.board_personas` as a single table. No `platform_intelligence.board_personas` exists. Grep `platform_intelligence.board` returns zero hits | Unintentional-Fix-Code | SCOPE-2.F{PENDING}-CANDIDATE-PRD34-PERSONA-SCHEMA-SPLIT-MISSING | Addendum mandates schema split; code implements single-schema flat table. Personal custom personas correctly tagged via `persona_type='personal_custom'` but are not isolated at the schema level as Channel D architecture requires. Impacts platform intelligence promotion pipeline integrity. |
| 3 | PRD-34 §Screens L67-514 specify 5 distinct tools with their own UIs: Board of Directors (group-chat modal), Perspective Shifter (lens chips), Decision Guide (framework list), Mediator (context selector), Translator (single-turn transform) | [src/components/lila/BoardOfDirectorsModal.tsx](../src/components/lila/BoardOfDirectorsModal.tsx) (board-of-directors), [TranslatorModal.tsx](../src/components/lila/TranslatorModal.tsx) (translator), [ToolConversationModal.tsx](../src/components/lila/ToolConversationModal.tsx) (generic for the other 3). 5 lila-* Edge Functions: lila-board-of-directors, lila-perspective-shifter, lila-decision-guide, lila-mediator, lila-translator. 5 guided modes seeded and corrected via [00000000100049_prd34_thoughtsift_tables.sql:243-294](../supabase/migrations/00000000100049_prd34_thoughtsift_tables.sql#L243) | Intentional-Document | no emission (wired per spec) | Core 5-tool architecture realized. Perspective Shifter, Decision Guide, Mediator share ToolConversationModal since they're standard conversation flows. BoD + Translator have custom modals per their specialized UIs. |
| 4 | PRD-34 §BoD L124-129,489 + CLAUDE.md #101 specify persona disclaimer shown once per session for non-personal personas, tracked via `board_sessions.disclaimer_shown` | [00000000100050_board_sessions_disclaimer.sql:3](../supabase/migrations/00000000100050_board_sessions_disclaimer.sql#L3) adds `disclaimer_shown` column. [supabase/functions/lila-board-of-directors/index.ts:393,491,584](../supabase/functions/lila-board-of-directors/index.ts#L393) reads and sets the flag. Also wired: Prayer Seat generation via action='generate_prayer_seat', content-policy gate via action='content_policy_check' per [L26](../supabase/functions/lila-board-of-directors/index.ts#L26). Cross-ref: SCOPE-8a.F5 BoD content-policy fail-open | Intentional-Document | no emission (CROSS-REF: SCOPE-8a.F5 — do not re-emit) | All 3 BoD-specific conventions (disclaimer, prayer seat, content-policy gate) wired. SCOPE-8a.F5 closed the content-policy fail-open concern already. |
| 5 | PRD-34 §Mediator L462-482 + CLAUDE.md #96 specify safety exception persisted to `lila_conversations.context_snapshot.safety_triggered`, checked from DB on every turn, survives close/reopen | [supabase/functions/lila-mediator/index.ts:3,246-402](../supabase/functions/lila-mediator/index.ts#L3) wires `safety_triggered` persistence. Comment at L3 documents "Safety exception: once triggered, persisted on lila_conversations.context_snapshot.safety_triggered" | Intentional-Document | no emission (wired per spec) | Mediator supersedes PRD-19 `relationship_mediation` per addendum. All PRD-19 privacy rules preserved within Mediator's Full Picture context mode per the `context_snapshot` mechanism. |
| 6 | PRD-34 §Perspective Shifter L320-350 + CLAUDE.md #98 specify family-context lenses synthesize context (never quote), privacy-filtered items always excluded; enforcement in Edge Function code | [supabase/functions/lila-perspective-shifter/index.ts:87,181-185](../supabase/functions/lila-perspective-shifter/index.ts#L87) defines `synthesizeFamilyContext()` function and invokes it at context assembly time. Cross-ref: SCOPE-8a.F4 Translator crisis exemption | Intentional-Document | no emission (CROSS-REF: SCOPE-8a.F4) | synthesizeFamilyContext enforces the never-quote rule at code layer (not just system prompt) — matches convention #98. Translator crisis exemption is the separate F4 concern already closed. |

#### Classification ambiguities (PRD-34)

- Row 1 (ThoughtSiftPage stub): Considered Scope-Creep-Evaluate (PRD-34 never specifies a `/thoughtsift` route explicitly — so the route itself may be scope creep). Chose Deferred-Document because the placeholder is explicitly labeled with PRD-34 and featureKey, indicating intent to build it. Orchestrator may reclassify to Scope-Creep-Evaluate if founder confirms no ThoughtSift landing page was ever intended.
- Row 2 (persona schema split): Could be Intentional-Document if the schema-split design was deliberately reduced. Chose Unintentional-Fix-Code because the addendum is post-base-PRD architectural guidance per Standing Rule 8 and the code does not satisfy it.

## Unexpected findings

1. **AI Toolbox sidebar section explicitly removed via code comment** (PRD-21 §Entry Points L70-102 + CLAUDE.md Convention #80). [src/components/shells/Sidebar.tsx:487](../src/components/shells/Sidebar.tsx#L487) contains the literal line `{/* AI Toolbox removed — tools accessible via LiLa guided mode switcher */}`. No addendum authorizes this architectural supersession. PRD-21 Decision #2 explicitly specifies AI Toolbox as the per-member curated tool launcher visible in Mom/Adult/Independent/Guided shells. Tools remain reachable via QuickTasks submenu + `+Add to AI Toolbox` (Vault), but the signature sidebar surface is gone. Flagged as SCOPE-2.F{PENDING}-CANDIDATE-PRD21-AI-TOOLBOX-REMOVED. This is a deliberate code comment, not an accidental deletion — founder must decide whether to codify (update PRD-21 to reflect the removal, update CLAUDE.md #80 to drop "personalized per-member launcher" language) or restore (rebuild the sidebar section consuming `lila_tool_permissions`).

2. **Settings is a route, not an overlay, with explicit deferral comment in provider**. [src/components/settings/SettingsProvider.tsx:6](../src/components/settings/SettingsProvider.tsx#L6) contains the literal comment "Full Settings overlay conversion deferred to PRD-22 build" and [L29-33](../src/components/settings/SettingsProvider.tsx#L29) implements `openSettings = () => navigate('/settings')`. PRD-22 Decision #1 specifies overlay pattern to preserve context — opening Settings navigates away from current page work in progress. This is a functional alternative that loses the context-preservation benefit of overlay. PRD-22 build is not queued (excluded from Batch 7 code-generation scope). Consolidates with other PRD-22 unbuilt-embed candidates.

3. **Higgins display name seed registry drift** ([00000000000007_lila_ai_system.sql:233-234](../supabase/migrations/00000000000007_lila_ai_system.sql#L233)). PRD-21 Tools 7-8 specify display names "Help Me Say Something" and "Help Me Navigate This"; seed registry ships "What to Say" and "How to Navigate". QuickTasks.tsx:151-152 submenu labels use the PRD-accurate names, so user-visible launcher shows correct names — but conversation history, LiLa mode switcher, and any future registry-driven UI will show the seed names. Two-layer divergence indicates code intent was PRD-accurate; seed migration was drafted before the display name decision or missed the rename. Fix: one-line UPDATE migration on `lila_guided_modes.display_name`. Consolidates into SCOPE-2.F{PENDING}-CANDIDATE-PRD21-HIGGINS-DISPLAY-NAME-DRIFT.

4. **`board_personas` schema split not implemented** (PRD-34-Cross-PRD-Impact-Addendum §Impact on Platform Intelligence Pipeline v2). The addendum specifies system/community-tier personas live in `platform_intelligence.board_personas` and personal_custom personas live in `public.board_personas`. [00000000100049_prd34_thoughtsift_tables.sql:10](../supabase/migrations/00000000100049_prd34_thoughtsift_tables.sql#L10) creates only `public.board_personas` as a single flat table. `persona_type='personal_custom'` distinguishes personal personas at the row level, and RLS policies honor ownership — but schema-level isolation is absent. Channel D promotion pipeline (community_generated → platform_intelligence) has no destination schema. Consolidates into SCOPE-2.F{PENDING}-CANDIDATE-PRD34-PERSONA-SCHEMA-SPLIT-MISSING.

5. **PRD-23-Cross-PRD-Impact-Addendum references obsolete `bookshelf_principles` table name**. The addendum text at [lines 36-46, 172-180](../prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md) describes the extractions layer using `bookshelf_principles` but base PRD-23 §Data Schema L623-657 defines the table as `bookshelf_insights`, and the migration creates `bookshelf_insights`. Base PRD and code agree; addendum is stale. One-line addendum text amendment to close. Consolidates into SCOPE-2.F{PENDING}-CANDIDATE-PRD23-ADDENDUM-INSIGHTS-RENAME-DRIFT.

6. **SemanticSearchPanel `useSemanticSearch()` app-wide hook has zero external consumers**. PRD-23-Session-Addendum §4 specifies app-wide consumption by Safe Harbor, InnerWorkings, Journal, Tasks, Family Context, LifeLantern, Meetings — an integration map of 8 features. [src/components/bookshelf/SemanticSearchPanel.tsx](../src/components/bookshelf/SemanticSearchPanel.tsx) is correctly designed as a reusable panel with `useSemanticSearch()` hook pattern, but grep outside `src/components/bookshelf/` returns zero consumer hits. Each future consumer was marked "forward note for build phase" in the addendum — so this is a legitimate forward-note stub rather than a defect. Flagged here for orchestrator visibility because the "app-wide" architectural claim is currently a 1/8 realization rate. Consolidates into SCOPE-2.F{PENDING}-CANDIDATE-PRD23-SEMANTIC-SEARCH-CROSS-FEATURE-STUB.

## Proposed consolidation

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD21-AI-TOOLBOX-REMOVED** — AI Toolbox sidebar section explicitly removed from code despite PRD-21 Decision #2 + CLAUDE.md Convention #80 + Entry Point 2 specifying it as the per-member curated tool launcher. No addendum authorization.
  - Contributing rows: PRD-21 Row 2
  - Proposed classification: Scope-Creep-Evaluate
  - Proposed severity: Low (tools remain reachable via QuickTasks + Vault assignment; affects discoverability and forward-looking per-member curation UX)
  - Proposed Beta Readiness flag: N
  - Cross-refs: PATTERN-FLAG-FOR-SCOPE-3 if the Toolbox pattern is consumed by PRD-21A `+Add to AI Toolbox` downstream

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD21-HIGGINS-DISPLAY-NAME-DRIFT** — `lila_guided_modes.display_name` seed registry ships "What to Say" / "How to Navigate"; PRD-21 specifies "Help Me Say Something" / "Help Me Navigate This"; QuickTasks submenu labels match PRD.
  - Contributing rows: PRD-21 Row 3
  - Proposed classification: Unintentional-Fix-Code
  - Proposed severity: Low (one-line UPDATE migration; no functional defect)
  - Proposed Beta Readiness flag: N
  - Cross-refs: none

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD21-SKILL-CHECK-MODE-MISSING** — Cyrano + Higgins Say skill-check mode progression after 5+ interactions (the "make itself unnecessary" teaching flow) not implemented in Edge Functions. No STUB_REGISTRY entry.
  - Contributing rows: PRD-21 Row 6
  - Proposed classification: Deferred-Document
  - Proposed severity: Low (advanced feature of a working tool; absence doesn't break the craft-first flow)
  - Proposed Beta Readiness flag: N
  - Cross-refs: may need STUB_REGISTRY addition

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD21A-OPTIMIZER-INTEGRATION-STUB** — Vault "Optimize with LiLa" button visible but stubbed (`OptimizeButton` has TODO + disabled styling); depends on PRD-05C Optimizer Edge Function build.
  - Contributing rows: PRD-21A Row 4
  - Proposed classification: Deferred-Document
  - Proposed severity: Low (dependency gated, not broken)
  - Proposed Beta Readiness flag: N
  - Cross-refs: PATTERN-FLAG-FOR-SCOPE-3 (PRD-05C Optimizer is the gating build)

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD21A-SKILL-DEPLOY-STUB** — Vault "Deploy with LiLa" skill button shows `alert('Coming soon')`; full personalization + context update registry not built.
  - Contributing rows: PRD-21A Row 5
  - Proposed classification: Deferred-Document
  - Proposed severity: Low
  - Proposed Beta Readiness flag: N
  - Cross-refs: External Tool Registry infrastructure depends on PRD-05C and PRD-19

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD21B-ADMIN-CONSOLE-UNBUILT** — Entire Admin Console Shell absent: no `/admin` route, no tab navigation, no vault CRUD UI, no Content Request Queue UI, no Analytics, no Image Manager, no LiLa content suggestions. `staff_permissions` table has no consumer.
  - Contributing rows: PRD-21B Rows 1–5
  - Proposed classification: Deferred-Document
  - Proposed severity: Medium (every Vault content change currently requires migration/SQL; blocks non-engineer content operations)
  - Proposed Beta Readiness flag: N (beta has 17 seeded items and no urgent need for admin UI)
  - Cross-refs: CROSS-REF: SCOPE-8a.F1 (PRD-32 shared admin infrastructure absence); PATTERN-FLAG-FOR-SCOPE-3 (PRD-32 System/Analytics tabs share this shell)

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD21C-ENGAGEMENT-UNBUILT** — All 6 engagement tables absent; denormalized counters on `vault_items` exist without triggers; discussion UI, satisfaction prompts, My Vault Activity, moderation queue, 4 recommendation sub-rows all absent.
  - Contributing rows: PRD-21C Rows 1–6
  - Proposed classification: Deferred-Document
  - Proposed severity: Medium (full engagement layer is a PRD-21C-sized build; beta functions without it but lacks social proof and My Activity surfaces)
  - Proposed Beta Readiness flag: N
  - Cross-refs: `shared_with_member_id` + `saved_prompt_id` schema columns already wired in 00000000100039 — partial forward-prep completed

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD22-SETTINGS-PAGE-VS-OVERLAY** — Settings ships as `/settings` route instead of full-screen overlay per PRD-22 Decision #1. SettingsProvider comment explicitly defers overlay conversion to PRD-22 build.
  - Contributing rows: PRD-22 Row 1
  - Proposed classification: Deferred-Document
  - Proposed severity: Low (functional alternative; loses context-preservation benefit of overlay)
  - Proposed Beta Readiness flag: N
  - Cross-refs: none

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD22-SETTINGS-EMBEDS-MISSING** — SettingsPage does not embed Permission Hub, Calendar Settings, Messaging Settings, Notification Preferences, or LiLa Context Settings. Per PRD-22, all 5 should be reachable from within the Settings overlay.
  - Contributing rows: PRD-22 Rows 2, 3
  - Proposed classification: Deferred-Document
  - Proposed severity: Low (each settings surface exists as its own page; consolidated entry missing)
  - Proposed Beta Readiness flag: N
  - Cross-refs: PATTERN-FLAG-FOR-SCOPE-3 (each embed has its own PRD — 02, 14B, 15, 15, 05)

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD22-ACCOUNT-LIFECYCLE-UI-MISSING** — `account_deletions` table migrated (0 rows) but no Delete My Account UI surface, no 30-day grace period reactivation flow.
  - Contributing rows: PRD-22 Row 4
  - Proposed classification: Deferred-Document
  - Proposed severity: Medium (GDPR-adjacent; mom cannot self-serve account deletion)
  - Proposed Beta Readiness flag: N (cross-ref SCOPE-8a.F2 already captures the compliance-adjacent scope)
  - Cross-refs: CROSS-REF: SCOPE-8a.F2 data-lifecycle scope

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD22-DATA-EXPORT-MISSING** — `data_exports` table entirely absent from migrations and live_schema. Archives export link at `/archives/export` serves a narrower scope (context-only) than the full-family-data ZIP PRD-22 Screen 11 specifies.
  - Contributing rows: PRD-22 Row 5
  - Proposed classification: Deferred-Document
  - Proposed severity: Medium (GDPR-adjacent)
  - Proposed Beta Readiness flag: N
  - Cross-refs: CROSS-REF: SCOPE-8a.F2 data-lifecycle scope

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD22-MULTI-EMAIL-UI-MISSING** — `member_emails` table migrated in 00000000100027 but no UI to add/verify/set-primary.
  - Contributing rows: PRD-22 Row 6
  - Proposed classification: Deferred-Document
  - Proposed severity: Low (one-email workflow functions normally)
  - Proposed Beta Readiness flag: N
  - Cross-refs: none

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD22-LILA-PREFS-UI-MISSING** — `lila_member_preferences` table migrated (0 rows) but no UI for tone/response_length/history_retention; no auto-archive cron.
  - Contributing rows: PRD-22 Row 7
  - Proposed classification: Deferred-Document
  - Proposed severity: Low
  - Proposed Beta Readiness flag: N
  - Cross-refs: none

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD23-ADDENDUM-INSIGHTS-RENAME-DRIFT** — PRD-23-Cross-PRD-Impact-Addendum text references `bookshelf_principles` where base PRD and code use `bookshelf_insights`. Base PRD and code agree; addendum text is stale.
  - Contributing rows: PRD-23 Row 1
  - Proposed classification: Unintentional-Fix-PRD
  - Proposed severity: Low (doc drift only; no functional defect)
  - Proposed Beta Readiness flag: N
  - Cross-refs: similar pattern to SCOPE-2.F5 Foundation batch's shift supersession addendum ruling

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD23-SEMANTIC-SEARCH-CROSS-FEATURE-STUB** — `useSemanticSearch()` hook + SemanticSearchPanel designed as app-wide per PRD-23-Session-Addendum §4 but zero consumers outside BookShelf. Integration map of 8 features is forward-note-only.
  - Contributing rows: PRD-23 Row 3
  - Proposed classification: Deferred-Document
  - Proposed severity: Low (feature-by-feature integration, each consumer has its own PRD build phase)
  - Proposed Beta Readiness flag: N
  - Cross-refs: PATTERN-FLAG-FOR-SCOPE-3 (8 consumer PRDs each have their own seam to wire)

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD34-THOUGHTSIFT-PAGE-STUB** — `/thoughtsift` route ships `ThoughtSiftPage` placeholder rendering PlannedExpansionCard-style description. Tools functional via QuickTasks ThoughtSift submenu path.
  - Contributing rows: PRD-34 Row 1
  - Proposed classification: Deferred-Document
  - Proposed severity: Low (functional access path exists)
  - Proposed Beta Readiness flag: N
  - Cross-refs: orchestrator may elect Scope-Creep-Evaluate if founder confirms no ThoughtSift landing page was ever intended

- **SCOPE-2.F{PENDING}-CANDIDATE-PRD34-PERSONA-SCHEMA-SPLIT-MISSING** — `board_personas` shipped as single `public` table; addendum mandates system/community in `platform_intelligence` + personal_custom in `public`. Row-level `persona_type` handles isolation functionally.
  - Contributing rows: PRD-34 Row 2
  - Proposed classification: Unintentional-Fix-Code
  - Proposed severity: Low (RLS + row-level persona_type enforce ownership correctly; schema split is architectural hygiene for Channel D promotion pipeline)
  - Proposed Beta Readiness flag: N
  - Cross-refs: Platform Intelligence Pipeline v2 Channel D wiring note

## Orchestrator adjudication

| Candidate | Proposed verdict | Proposed severity | Founder decision | Emits into |
|---|---|---|---|---|
| SCOPE-2.F{PENDING}-CANDIDATE-PRD21-AI-TOOLBOX-REMOVED | Scope-Creep-Evaluate | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD21-HIGGINS-DISPLAY-NAME-DRIFT | Unintentional-Fix-Code | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD21-SKILL-CHECK-MODE-MISSING | Deferred-Document | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD21A-OPTIMIZER-INTEGRATION-STUB | Deferred-Document | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD21A-SKILL-DEPLOY-STUB | Deferred-Document | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD21B-ADMIN-CONSOLE-UNBUILT | Deferred-Document | Medium | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD21C-ENGAGEMENT-UNBUILT | Deferred-Document | Medium | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD22-SETTINGS-PAGE-VS-OVERLAY | Deferred-Document | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD22-SETTINGS-EMBEDS-MISSING | Deferred-Document | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD22-ACCOUNT-LIFECYCLE-UI-MISSING | Deferred-Document | Medium | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD22-DATA-EXPORT-MISSING | Deferred-Document | Medium | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD22-MULTI-EMAIL-UI-MISSING | Deferred-Document | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD22-LILA-PREFS-UI-MISSING | Deferred-Document | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD23-ADDENDUM-INSIGHTS-RENAME-DRIFT | Unintentional-Fix-PRD | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD23-SEMANTIC-SEARCH-CROSS-FEATURE-STUB | Deferred-Document | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD34-THOUGHTSIFT-PAGE-STUB | Deferred-Document | Low | (pending) | (pending) |
| SCOPE-2.F{PENDING}-CANDIDATE-PRD34-PERSONA-SCHEMA-SPLIT-MISSING | Unintentional-Fix-Code | Low | (pending) | (pending) |

**Candidate cardinality note:** 17 candidates substantially exceeds PLAN §5.2's 4–8 typical range and the 8–13 upper expected range for this batch. Justification: Batch 7 covers seven PRDs, three of which (21B, 21C, 22) each surface one or more large deferral candidates. The PRD-22 row table alone produces 5 distinct deferral candidates because the Settings overlay has 7 specified screens and each unwired screen is a meaningful standalone UX gap (account lifecycle, data export, multi-email, LiLa prefs all have their own table migrations in place, making each a "schema ready, UI absent" signature drift worth a separate finding). Orchestrator may elect to collapse PRD-22 Rows 2-7 into a single "PRD-22 Settings UI largely unbuilt" super-finding; the worker emits them separately per PLAN §5.1's "do NOT consolidate across different patterns" rule (each represents a distinct UX surface and backing table). Alternative: consolidate PRD-21B + PRD-21C into "AI Vault admin + engagement layers unbuilt" if founder wants tighter finding counts. Both routes available at walk-through.
