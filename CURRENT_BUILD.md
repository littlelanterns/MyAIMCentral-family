# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.

## Status: ACTIVE

---

*PRD-06 (Guiding Stars & Best Intentions) + PRD-07 (InnerWorkings repair) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-06-Guiding-Stars-Best-Intentions.md` and `claude/feature-decisions/PRD-07-InnerWorkings-repair.md`.*

*PRD-10 Phase A (Widgets, Trackers & Dashboard Layout) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-10-Widgets-Trackers-Dashboard-Layout.md`.*

*PRD-13 (Archives & Context) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-13-Archives-Context.md`. 94 requirements: 80 wired, 14 stubbed, 0 missing.*

*Bug fixes (View As modal, Hub navigation, Notepad close) completed 2026-03-25. No new stubs.*

---

## PRD Being Built

**PRD-21A — AI Vault: Browse & Content Delivery**

- PRD file: `prds/ai-vault/PRD-21A-AI-Vault-Browse-Content-Delivery.md`
- Feature decision file: `claude/feature-decisions/PRD-21A-AI-Vault-Browse.md`

### Addenda Read

1. `prds/addenda/PRD-21A-Cross-PRD-Impact-Addendum.md` — Impacts on PRD-04, 05, 05C, 10, 13, 14, 21
2. `prds/addenda/PRD-21B-Cross-PRD-Impact-Addendum.md` — Renames tool_collection → curation, adds last_published_at, storage buckets
3. `prds/addenda/PRD-21C-Cross-PRD-Impact-Addendum.md` — Adds 4 engagement columns to vault_items, shared_with_member_id to user_saved_prompts
4. `prds/addenda/PRD-21-Cross-PRD-Impact-Addendum.md` — AI Toolbox sidebar, lila_tool_permissions extensions

---

## Pre-Build Summary

### What This Feature Does

The AI Vault is the platform's front door and revenue engine — a Netflix-style browsable library of AI tutorials, interactive tools, prompt packs, workflows, and skills. It teaches moms to use AI through a natural learning ladder and delivers interactive AI tools, some powered by LiLa.

The relationship between Vault and AI Toolbox (PRD-21): Vault = browsable storefront where mom discovers content. Toolbox = personalized per-member launcher where assigned tools live. Mom browses Vault → finds tool → taps "+Add to AI Toolbox" → tool appears in member's Toolbox.

### Content Type Taxonomy (6 types)

| Content Type | `content_type` Value | Rendering | +Add to Toolbox |
|---|---|---|---|
| Tutorial | `tutorial` | Rich text/iframe content | No |
| AI Tool | `ai_tool` | Portal + launch (native/embedded/link_out) | **Yes** |
| Prompt Pack | `prompt_pack` | Gallery (image/video) or list (text/audio) | No |
| Curation | `curation` | Grid of contained Vault items | No |
| Workflow | `workflow` | Step-by-step with embedded prompts | No |
| Skill | `skill` | Platform selector + deploy actions | **Yes** (via Deploy) |

**CRITICAL:** PRD-21B addendum renamed `tool_collection` → `curation`. Use `'curation'` in CHECK constraint.

### Pages

1. **VaultBrowsePage** — Main browse: Hero Spotlight, Continue Learning (conditional), Recommended for You (conditional), Category Rows, Search & Filters
2. **VaultCategoryGridPage** — Full grid of a single category's items
3. **VaultDetailView** — Content detail modal (desktop) / full-screen (mobile), adapts by content_type
4. **UpgradeModal** — Shown for locked content: hook title + thumbnail + upgrade CTA
5. **MemberAssignmentModal** — "+Add to AI Toolbox" family member picker
6. **PersonalPromptLibraryPage** — "My Prompts" CRUD page
7. **ContentRequestForm** — "Request a Tutorial" form

### Database Schema (12 new tables + 2 modified)

**New tables:** vault_items, vault_categories, vault_prompt_entries, vault_collection_items, vault_user_bookmarks, vault_user_progress, vault_user_visits, vault_first_sightings, vault_tool_sessions, vault_copy_events, user_saved_prompts, vault_content_requests

**Future-proofing columns included:**
- vault_items: heart_count, comment_count, satisfaction_positive, satisfaction_negative (PRD-21C)
- vault_items: last_published_at (PRD-21B)
- user_saved_prompts: shared_with_member_id (PRD-21C)

**Modified tables:**
- lila_tool_permissions: add source TEXT, vault_item_id UUID, saved_prompt_id UUID
- archive_member_settings: add physical_description TEXT, reference_photos TEXT[]

### Seed Data

6 categories seeded via migration:
| slug | display_name | icon | sort_order |
|------|-------------|------|------------|
| creative-fun | Creative & Fun | Palette | 1 |
| home-management | Home Management | Home | 2 |
| ai-learning | AI Learning Path | GraduationCap | 3 |
| homeschool | Homeschool & Education | BookOpen | 4 |
| ai-skills | AI Skills | Wand2 | 5 |
| productivity | Productivity & Planning | Target | 6 |

**No vault_items pre-seeded.** Content added via CLI helper script after build.

### Feature Keys (6, all return true during beta)

vault_browse, vault_consume, vault_optimize_lila, vault_toolbox_assign, vault_prompt_library, vault_request_content

### Sidebar Navigation Changes

- Mom shell: Add "AI Vault" to "AI & Tools" section, add "My Prompts" as sub-item
- Adult shell: Add "AI Vault" (permission-gated via vault_browse)
- Independent shell: Add filtered Vault (teen_visible items only)
- Guided/Play: No Vault access

### Key Interactions

- Tap card → opens detail view (modal desktop, fullscreen mobile)
- Tap locked card → UpgradeModal
- Search → debounced full-text across display_title, detail_title, short_description, full_description, tags
- Filter chips → content type, difficulty, bookmarks; combine with AND logic
- Copy Prompt → single tap copies, toast, logged to vault_copy_events
- Bookmark → optimistic UI toggle
- "+Add to AI Toolbox" → member picker → creates lila_tool_permissions records
- "Optimize with LiLa" → launches Optimizer mode with vault item context (stub if EF not deployed)
- "Save to My Prompts" → writes to user_saved_prompts
- NEW badge → per-user first-seen tracking via vault_first_sightings, 30-day default

### Content Protection

1. No text selection on prompt content
2. Copy only via Copy button (individual per prompt, no "copy all")
3. All copies logged to vault_copy_events
4. Soft rate limit: 20 copies/60min → gentle toast (copy still works)
5. Prompt text loaded on-demand (not in initial HTML)
6. Session-based access required
7. Right-click disabled on images
8. LiLa-optimized attribution comment in personalized prompts

### Stubs Created This Phase

| Stub | Wires To | When |
|------|----------|------|
| Optimize with LiLa (full optimization flow) | PRD-05C Optimizer edge function | When Optimizer is built |
| Deploy with LiLa (skill deployment) | External Tool Registry + PRD-05C | Post-MVP |
| Embedded tool iframe delivery | External tool hosting | Post-MVP |
| LiLa proactive Vault suggestions | PRD-05 general chat enhancement | Post-MVP |
| Collaborative filtering recommendations | Recommendation engine | Post-MVP |
| Dashboard Vault Recommendations widget | PRD-10 widget rendering | Future phase |
| Session report re-import via Review & Route | PRD-08 + PRD-28 | Future phase |
| PRD-21C engagement (hearts, comments, discussions) | PRD-21C | Future phase |
| PRD-21B Admin content management UI | PRD-21B | Future phase |

### Existing Stubs Wired This Phase

| Stub | Created By | How Wired |
|------|-----------|-----------|
| AI Vault sidebar navigation | PRD-04 | Vault added to sidebar for Mom/Adult/Independent |
| AI Vault tool browsing + "+Add to AI Toolbox" | PRD-21 | Browse + MemberAssignmentModal → lila_tool_permissions |
| Library Vault tutorial links from LiLa Assist | PRD-05 | Vault content exists and is browsable |

### Sub-Phase Split

Given the scope (12 tables + 7 pages + cross-feature wiring), splitting into:
- **21A-A:** Schema migration (all 12 tables + future columns + indexes + RLS) + seed categories + sidebar routing + feature key registration + CLI helper script
- **21A-B:** Browse page (Hero, Category Rows, Search/Filters, Cards) + Detail views (all 6 content types) + empty states
- **21A-C:** Cross-feature wiring (Toolbox assignment, bookmarks, progress, copy events, content protection) + Personal Prompt Library + Content Request form

---

## Post-Build Verification

*(Completed after build)*

---
