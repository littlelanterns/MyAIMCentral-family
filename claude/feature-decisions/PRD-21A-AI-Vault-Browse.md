# Feature Decision File: PRD-21A — AI Vault Browse & Content Delivery

> **Created:** 2026-03-25
> **PRD:** `prds/ai-vault/PRD-21A-AI-Vault-Browse-Content-Delivery.md`
> **Addenda read:**
>   - `prds/addenda/PRD-21A-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-21B-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-21C-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-21-Cross-PRD-Impact-Addendum.md`
> **Founder approved:** pending

---

## What Is Being Built

The AI Vault is a Netflix-style browsable library of AI tutorials, interactive tools, prompt packs, workflows, and skills. Mom browses and discovers content organized by categories, can search and filter, consume tutorials, copy prompts, personalize content with LiLa, assign AI tools to family members' Toolboxes, and save prompts to a personal library. Content is tier-gated with a two-layer title system (hook titles visible to all, detail titles to subscribers).

**Scope note:** We are NOT building PRD-21B (Admin Content Management) yet. Content will be added through Claude Code CLI after the build. The Vault launches with 6 seeded categories and no pre-seeded content items. A helper script enables content insertion.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| VaultBrowsePage | Main page: Hero Spotlight (Section A), Continue Learning (Section B, conditional), Recommended For You (Section C, conditional), Category Rows (Section D), Search & Filters (Section E) |
| VaultCategoryGridPage | Full grid view when tapping "See All" on a category |
| VaultDetailView (modal/fullscreen) | Desktop = large modal overlay. Mobile = full-screen with back button. Adapts layout by content_type |
| Tutorial detail | Rich text/iframe content, progress tracking, bookmark, Optimize with LiLa |
| AI Tool detail | Portal page with Launch Tool (native/embedded/link_out delivery) |
| Prompt Pack detail - Gallery | Masonry grid for image_gen/video_gen packs. Hover/tap reveals overlay with copy/save/optimize |
| Prompt Pack detail - List | Expandable cards for text_llm/audio_gen packs |
| Curation detail | Grid of contained vault items (renamed from tool_collection per PRD-21B addendum) |
| Workflow detail | Step-by-step with embedded copyable prompts |
| Skill detail | Platform selector, Deploy with LiLa, Download/Copy per platform |
| UpgradeModal | Shown for locked (tier-gated) content: hook title + thumbnail + short description + upgrade CTA |
| MemberAssignmentModal | "+Add to AI Toolbox": family member picker → creates lila_tool_permissions with source='vault' |
| PersonalPromptLibraryPage | "My Prompts" — CRUD for user_saved_prompts. Search, tags, re-optimize |
| ContentRequestForm | "Request a Tutorial" simple form → vault_content_requests |
| VaultContentCard | Reusable card: thumbnail, hook title, content type badge, difficulty badge, tier lock overlay, NEW badge, bookmark |
| VaultCategoryRow | Horizontal-scrolling row with category label and "See All" link |
| VaultHeroSpotlight | Large featured content carousel (1-3 items) |
| VaultSearchBar | Sticky search with filter chips |
| PromptGallery | Masonry grid for image/video prompt packs |
| PromptList | Expandable card list for text/audio prompt packs |
| CopyPromptButton | Single-tap copy with toast + copy event logging |
| OptimizeWithLilaButton | Launches LiLa Optimizer mode with vault item context (stub if Optimizer EF not deployed) |
| ContentProtection | Wrapper disabling text selection, right-click on images, logs copy events |
| Empty state (no content) | Warm welcome message when Vault has categories but no content yet |
| Empty state (no search results) | "No results for [query]..." |
| Empty state (no progress) | Continue Learning row doesn't appear |

---

## Key PRD Decisions (Easy to Miss)

1. **`tool_collection` renamed to `curation`** per PRD-21B addendum. The content_type CHECK value is `'curation'`, NOT `'tool_collection'`. Display name = "Curation." The vault_collection_items join table name is unchanged.
2. **Two-layer titles:** `display_title` (hook, visible to ALL including non-subscribers) + `detail_title` (clear, only for tier-authorized users). Hook titles sell the outcome; detail titles reveal the method.
3. **Two-layer descriptions:** `short_description` (visible on card) + `full_description` (detail view, tier-gated).
4. **Prompt format determines rendering:** `image_gen`/`video_gen` → gallery (masonry grid), `text_llm`/`audio_gen` → list (expandable cards).
5. **"+Add to AI Toolbox" appears ONLY on `ai_tool` items.** Not on tutorials, prompt packs, workflows, or curations.
6. **Skills are a distinct content type** — deployable AI instruction sets (Claude Skills, Custom GPTs, Gemini Gems). NOT prompt collections. "Deploy with LiLa" personalizes with family context.
7. **NEW badge is per-user first-seen tracking,** NOT upload date. `vault_first_sightings` records first-seen timestamp. Default 30-day countdown.
8. **Content protection:** No text selection on prompt content. Copy ONLY via Copy button. All copies logged. Rate limited (20/60min, soft). Prompt text loaded on-demand (not in initial HTML). Right-click disabled on images.
9. **Locked cards:** Visible in browse with faded overlay + tier badge. Hook title and short_description always visible. Tapping opens UpgradeModal, not detail view.
10. **Learning ladder is internal** — `fun_creative`/`practical`/`creator` is admin metadata, NOT a user-facing filter. Not connected to tiers.
11. **`vault_user_bookmarks.user_id` and other user FKs** — PRD schema says FK → auth.users, but our pattern uses family_members.id as user_id. Need to decide: use auth.users (allows bookmarks before family setup) or family_members (consistent with rest of app). **Decision: use family_members.id** to stay consistent with the rest of the app.
12. **PRD-21C future columns on vault_items:** heart_count, comment_count, satisfaction_positive, satisfaction_negative — include in migration to avoid future ALTER TABLE.
13. **PRD-21B future column:** last_published_at on vault_items.
14. **PRD-21C future column on user_saved_prompts:** shared_with_member_id.
15. **Seasonal tags and gift_idea_tags** are TEXT arrays on vault_items. During tagged seasons, seasonal content is surfaced automatically.
16. **Detail view: modal on desktop (800-960px), full-screen on mobile.** User does NOT navigate away from browse page on desktop.
17. **Gallery masonry grid** paginates at 30 entries with "Load More" for large packs (100+).
18. **Copy rate limiting** is soft (not a hard block) — copy still works after 20/60min, just shows a gentle toast.

---

## Addendum Rulings

### From PRD-21A-Cross-PRD-Impact-Addendum.md:
- Add `vault_item_id` as optional metadata on `lila_conversations` (already exists in live schema)
- Add `physical_description` TEXT and `reference_photos` TEXT[] to `archive_member_settings` (stub — field addition needed for image prompt personalization)
- AI Toolbox sidebar section queries `lila_tool_permissions` for both `source = 'default'` AND `source = 'vault'`
- Register `vault_recommendations` as a widget type (stub registration only)

### From PRD-21B-Cross-PRD-Impact-Addendum.md:
- **CRITICAL: `tool_collection` renamed to `curation`** — update CHECK constraint
- Add `last_published_at` TIMESTAMPTZ to vault_items
- Supabase Storage buckets: `vault-thumbnails`, `vault-prompt-images`

### From PRD-21C-Cross-PRD-Impact-Addendum.md:
- Add 4 denormalized columns to vault_items: heart_count, comment_count, satisfaction_positive, satisfaction_negative (all INTEGER DEFAULT 0)
- Add shared_with_member_id UUID to user_saved_prompts
- Section B "Continue Learning" refined to "Recently Viewed" (but PRD-21C is future — we build per PRD-21A's spec for now)
- Section C expanded to 4 sub-rows (also future — build per PRD-21A's simple version)

### From PRD-21-Cross-PRD-Impact-Addendum.md:
- AI Toolbox is a sidebar section for Mom, Adult, Independent, Guided (not Play)
- `lila_tool_permissions` needs `source` TEXT column (CHECK: 'default', 'vault') and `vault_item_id` UUID column
- Vault-assigned native tools launch in conversation modals using same infrastructure as relationship tools

---

## Database Changes Required

### New Tables (12)
1. `vault_items` — Main content table (50+ columns including PRD-21B/21C future columns)
2. `vault_categories` — Admin-managed categories (seeded with 6 initial categories)
3. `vault_prompt_entries` — Child entries within prompt packs
4. `vault_collection_items` — Join table for curations (formerly tool_collection)
5. `vault_user_bookmarks` — User bookmarks (UNIQUE on user_id, vault_item_id)
6. `vault_user_progress` — Per-user progress tracking (UNIQUE on user_id, vault_item_id)
7. `vault_user_visits` — Visit timestamps for NEW badge
8. `vault_first_sightings` — First-seen per user per item (UNIQUE on user_id, vault_item_id)
9. `vault_tool_sessions` — Session tokens for embedded tools
10. `vault_copy_events` — Content protection copy logging
11. `user_saved_prompts` — Personal prompt library
12. `vault_content_requests` — User content requests

### Modified Tables
- `lila_tool_permissions` — Add `source` TEXT (CHECK: 'default', 'vault'), `vault_item_id` UUID (FK → vault_items), `saved_prompt_id` UUID (FK → user_saved_prompts, from PRD-21C)
- `archive_member_settings` — Add `physical_description` TEXT, `reference_photos` TEXT[] (PRD-21A addendum impact on PRD-13)

### Migrations
- Single migration: `00000000100039_vault_tables.sql`
- Includes all 12 tables, RLS policies, indexes, triggers, seed data for 6 categories
- Includes ALTER TABLE for lila_tool_permissions and archive_member_settings

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| vault_browse | TBD (beta = true) | mom, dad_adults | Access to browse AI Vault |
| vault_consume | TBD (beta = true) | mom, dad_adults, independent_teens | Open and consume content |
| vault_optimize_lila | TBD (beta = true) | mom, dad_adults | Optimize with LiLa |
| vault_toolbox_assign | TBD (beta = true) | mom | +Add to AI Toolbox |
| vault_prompt_library | TBD (beta = true) | mom, dad_adults | Personal prompt library |
| vault_request_content | TBD (beta = true) | mom, dad_adults | Submit content requests |

---

## Stubs — Do NOT Build This Phase

- [ ] PRD-21B Admin Content Management UI (use CLI script instead)
- [ ] PRD-21C Engagement & Community (hearts, comments, discussions, moderation)
- [ ] Collaborative filtering recommendations (use simple category-based recs)
- [ ] Semantic/vector search (use full-text search only)
- [ ] Learning paths (structured multi-item sequences)
- [ ] Creator tier user-submitted tools
- [ ] Tool marketplace / revenue sharing
- [ ] Unauthenticated public browse
- [ ] Audio preview playback for audio_gen packs
- [ ] Full External Tool Registry / context update pipeline (Deploy with LiLa = stub)
- [ ] Session report re-import via Review & Route (structured data parsing)
- [ ] LiLa proactive Vault suggestions in general chat
- [ ] Dashboard "Recommended for You" widget rendering (register type only)
- [ ] Platform variant switching on prompt entries
- [ ] Vault content versioning

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Vault items browsable | ← | PRD-21B admin adds content | vault_items INSERT (via CLI script for now) |
| +Add to AI Toolbox | → | PRD-21 AI Toolbox | lila_tool_permissions (source='vault', vault_item_id) |
| Optimize with LiLa | → | PRD-05/05C LiLa Optimizer | lila_conversations with vault_item_id in context |
| Image prompt personalization | ← | PRD-13 Archives | archive_member_settings.physical_description |
| Native tool launch | → | PRD-05 LiLa conversation modal | guided_mode_key on vault_items → lila_guided_modes |
| Sidebar navigation | → | PRD-04 Shell Routing | Sidebar.tsx adds Vault + My Prompts nav items |
| Tier gating | ← | PRD-01/31 Subscription | allowed_tiers on vault_items, useCanAccess for feature keys |
| Progress tracking | → | PRD-14 Dashboard (future) | vault_recommendations widget type registration |
| Content requests | → | PRD-21B Admin queue | vault_content_requests table |

---

## Things That Connect Back to This Feature Later

- PRD-21B: Admin content management UI replaces CLI helper script
- PRD-21C: Hearts, comments, discussions, satisfaction signals added to cards and detail views
- PRD-28: Session report data from Skills consumed by homeschool tracking
- PRD-10 Phase B: Dashboard widget rendering for vault_recommendations
- PRD-05 enhancement: LiLa proactive Vault suggestions in general chat
- PRD-13: physical_description and reference_photos fields used by image prompt optimization

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> Completed after build, before declaring the phase done.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | PRD §/ Addendum | Wired / Stubbed / Missing | |

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- Total requirements verified:
- Wired:
- Stubbed:
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
