# PRD-05C + PRD-21C + PRD-38 — Vault-Family Recon Brief (Sonnet reader, 2026-07-04)

> Archived condensed with citations. Consumed by `PRD05C.md`, `PRD21C.md`, `PRD38.md`.
> Corroboration: `.claude/completed-builds/scope-3-8b-evidence/EVIDENCE_prd21c-cross-prd-impact.md`
> (2026-04-21 Opus pass) independently reached the same 21C conclusions.

## PRD-05C — verdict 0% built, with MISLEADING live plumbing
9-step pipeline (cross-mode check → request-type → preset → 3-tier context → question filtering → 80/20 → template(free ~80%)/Sonnet(~20%) → prompt card → Haiku context-learning); Quick vs Walk-Me-Through modes; prompt types text+conversation_flow MVP; Prompt Card (Copy/Edit-in-Notepad/Save-as-Template/What-did-I-add); user+starter templates w/ [PLACEHOLDER]; 7 system context presets + auto-detect; copy/paste delivery ONLY — **PRD says no direct API, no BYOK** (L476-498); usage thermometer + credit packs; mom-only per PRD text.
Exists: `optimizer` mode REGISTERED (mig 007:223, **context_sources = NULL** — neither #248 category shape); `lila_optimizer` key + tier plumbing + DAD PROFILE ROWS (mig 011/012 — dad ✓ at Maximum per Permission Matrix L109, **contradicting the PRD's "mom-only no exceptions"**); mode LIVE in the picker (`LilaModeSwitcher.tsx:16,33`) w/ a one-line stub prompt (lila-chat:99) → **silently falls through to bare chat — STUB:116 "MISLEADING UI"**; "Optimize with LiLa" buttons say coming-soon (PromptPackDetail:148-166, SkillDetail:31). Tables optimizer_outputs/optimization_patterns/user_prompt_templates/context_presets ABSENT. Live `ai_usage_tracking` (679 rows) is the GENERIC cost logger — different shape than 05C's spec'd table; PRD-31 addendum's "superseded by ai_credits/ai_usage_log" never executed (neither exists — though the PRD31 pack now builds ai_credits). `user_saved_prompts.is_lila_optimized` exists, never set. PRD-19 alias columns absent (the PRD19 pack ships them). **ai_patterns.md says "BYOK support" — conflicts with the PRD's own no-BYOK text.**

## PRD-21C — verdict 0% built; pre-seeded columns dead
Scope: engagement overlay (hearts w/ <5 hidden threshold, progress indicators); satisfaction prompt (≥60s, once/user/item); mom-ONLY discussion threads (depth 3, Haiku approve/flag/reject moderation, report modal, auto-hide at 3 reports); Share sheet (+Toolbox, share-from-My-Prompts via saved_prompt_id, external copy); My Vault Activity; 4 rule-based recommendation rows (no ML); Admin Screens 8-10 (Moderation tab /admin/moderation w/ moderation_admin, Content Policy config, Engagement Analytics). 6 tables + 4 vault_items counters + 2 cross-table columns.
Exists: **the 4 vault_items counter columns are LIVE, hardcoded 0 forever** (no source tables); `user_saved_prompts.shared_with_member_id` + `lila_tool_permissions.saved_prompt_id` live, zero readers/writers; `moderation_admin` enum reserved (mig 002:48), never granted/checked; NO moderation EF anywhere; admin console = 2 tabs (Approvals/Personas) — **Screens 8-10 have no host until the PRD32 pack's console expansion ships**; keys vault_engagement/share_external/share_toolbox unregistered. 21C addendum's "completed (Wave 2)" claim is FALSE vs live DB. Comments mom-only consistent w/ Permission Matrix (L330-346).

## PRD-38 — verdict 0% built, cleanest absence
Scope: public aimagicformoms.com blog on the SAME codebase via hostname routing (App.tsx has ZERO hostname branching today); routes /blog[/...]; masonry home + 7 seeded categories + hearts (anonymous device-fingerprint, NO threshold) + sticky CTA (config flag); article page w/ showcase_feature CTA + full SEO (OG/JSON-LD); free-tools pages; admin Screens 4-5 = sub-nav inside the VAULT ADMIN TAB (PRD32-pack host); anonymous comments — IP→geo→DISCARD (never stored), Haiku classify, negative/spam silently "held" (drain = PRD32 Moderation tab "Blog Comments" filter), 3/IP/10min rate limit; blog_posts/engagement/comments/free_tools/categories tables; blog-images + blog-tool-files buckets; blog-comment-moderate + blog-publish-scheduled EFs (architecture.md lists them ASPIRATIONALLY — they don't exist); zero tier gating (public). Stubs: landing /, /about, /pricing (→PRD31), threading/search/RSS/newsletter/Pinterest/analytics/rich-editor.
Exists: ONLY a feature_expansion_registry entry (L296-301) that **no page renders** (even the demand card is dark). STUB_REGISTRY tracks only the 4 post-MVP sub-items — no top-level "blog unbuilt" row. Supersessions SETTLED by the PRD: "Strategies & Snippets" renamed; PRD-32's dual-publish toggle REPLACED by showcase_feature. Content playbook ready (29+ article ideas, `specs/Content-Marketing-Pinterest-Strategy.md`).

## Conflicts (named)
1. 05C mom-only vs Permission-Matrix dad-at-Maximum (production profiles already seed dad rows).
2. #256: 05C's hardcoded tier table → route through the chart at build.
3. #247/#248: optimizer's context_sources NULL = uncategorized row; 05C is clearly category-1 — declare at build.
4. 21C's UGC moderation ≠ #258 three-tier ≠ LiLa layers — needs its own governance naming line.
5. architecture.md's EF table lists blog-comment-moderate as if real — aspirational-row honesty.
6. PRD-31 addendum's ai_usage_tracking-supersession stale; factory ruling D-PRD31-4 (ONE pipeline: extend ai_usage_tracking; ai_credits ships with PRD31) resolves the fork for 05C.
7. ai_patterns.md "BYOK support" vs PRD's explicit no-BYOK.
8. STUB_REGISTRY missing a PRD-38 top-level row.

## Open questions (absorbed into packs)
05C dad access; metering/credits home; hide the misleading picker entry NOW; PRD-21B/console prerequisite ordering; aimagicformoms.com DNS/Vercel state; dead-column disposition; STUB top-level row.
