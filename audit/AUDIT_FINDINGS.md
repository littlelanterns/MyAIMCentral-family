> ## Why This Audit Exists
>
> Before building, we ran a comprehensive compliance audit: 97 files read by 14 parallel agents across 42 PRDs, 42 cross-PRD addenda, and 4 specification documents. This level of pre-build verification is unusual for a startup — and intentional.
>
> MyAIM Family handles children's data (COPPA compliance), disability documentation (SDS reports, ISP goals), family finances (ESA invoices, allowance tracking), and sensitive relationship context. For a platform families will trust with this information, architectural correctness isn't a nice-to-have. It's a requirement.
>
> **What the audit found:** Early build phases had been coded from a summary document that diverged from the actual PRDs, resulting in schema mismatches, missing permission boundaries, and incomplete feature implementations.
>
> **What we did about it:** We rebuilt from the PRDs directly. Working code was discarded in favor of correct code. Seven corrected reference documents were produced (see below) and now serve as the authoritative foundation for all development.
>
> **Why this matters:** This audit demonstrates that the team prioritizes architectural integrity over speed. The willingness to throw away working code and rebuild from specifications is the clearest possible signal that this platform is being built to earn family trust, not just to ship features.
>
> The detailed findings below show the depth of the analysis and the rigor of the correction process.

---

# PRD Consistency Audit — Findings Report

> **Audit Date:** 2026-03-23
> **Auditor:** Claude Opus 4.6 (1M context)
> **Scope:** All 42 PRDs, 42 addenda, 4 spec documents
> **Total Cross-PRD Action Items Found:** 813+

---

## Executive Summary

The `claude/database_schema.md` file diverges from the actual PRD definitions in **nearly every table**. The schema was clearly generated from a surface-level summary rather than a deep read of the PRDs. This audit found:

- **~165 tables referenced** across all PRDs, but database_schema.md only captures a subset
- **Column-level differences** in virtually every table (different names, missing columns, different types/defaults)
- **Missing tables entirely** from the schema reference (~20+ tables)
- **Naming inconsistencies** across PRDs (e.g., `member_id` vs `family_member_id` vs `owner_member_id`)
- **813+ cross-PRD action items** from addenda, many not yet propagated
- **Multiple table replacements** not reflected (`feature_access` → `feature_access_v2`, `shift_schedules` → `access_schedules`, `task_rewards` superseded by gamification pipeline)

**Recommendation:** The existing `claude/database_schema.md` should be treated as unreliable. The PRDs are the ONLY source of truth per CLAUDE.md rule 11. A corrected schema has been produced as `audit/CORRECTED_DATABASE_SCHEMA.md`.

---

## Category A: Cross-PRD Impact Resolution

### Summary
813+ action items were found across 31 Cross-PRD Impact Addendum files. These are organized into the following types:

| Action Type | Count (approx) |
|-------------|----------------|
| Schema changes (new columns, tables, replacements) | ~100 |
| Enum/CHECK constraint additions | ~50 |
| Feature key registrations | ~60 |
| Guided mode registrations | ~25 |
| Stub status updates (WIRED/resolved) | ~40 |
| Spec/documentation updates | ~350 |
| Build order updates | ~50 |
| UI/routing additions | ~40 |
| Verification/confirmation items | ~30 |
| Migration requirements | ~10 |

### Most Impacted Target PRDs
| Target PRD | Impact Count | Nature |
|------------|-------------|--------|
| PRD-05 (LiLa Core) | ~50 | Context assembly updates, guided mode registrations, Edge Functions, system prompt updates |
| PRD-04 (Shell Routing) | ~40 | Sidebar routes, QuickTasks additions, perspective switcher, rendering layers |
| PRD-02 (Permissions) | ~35 | Feature key registrations, permission patterns, staff permission types |
| PRD-15 (Messages/Notifications) | ~30 | Notification types, enum additions, messaging patterns |
| PRD-10 (Widgets) | ~25 | Widget type registrations, data source updates |
| PRD-22 (Settings) | ~25 | New settings categories, management screens |
| PRD-14 (Dashboard) | ~20 | Section keys, widget types, rendering layers |
| PRD-09A (Tasks) | ~20 | Source enums, schema columns, queue migration |

### Unresolved Actions
See `audit/UNRESOLVED_CROSS_PRD_ACTIONS.md` for the complete list. Key unresolved items include all 813 actions — the addenda specify changes but the target PRDs were not systematically updated to incorporate them. The addenda serve as the authoritative change record.

---

## Category B: Schema Consistency

### B.1 — Systemic Column Naming Inconsistency

The single biggest issue: PRDs use inconsistent column naming for the same concept.

| PRD Convention | Schema Convention | Tables Affected |
|---------------|-------------------|-----------------|
| `owner_member_id` | `member_id` | guiding_stars, best_intentions, self_knowledge, journal_entries, notepad_tabs |
| `family_member_id` | `member_id` | victories, dashboard_widgets, gamification_configs, life_lantern_areas |
| `auth_user_id` | `user_id` | family_members |
| `list_name` | `title` | lists |
| `template_name` | `title` | task_templates, list_templates |
| `description` (victory text) | `title` (display name) | victories |
| `statement` | `title` | best_intentions |

**Resolution:** The PRD definitions are authoritative. Each PRD defines its own column names. During build, the PRD's column names MUST be used.

### B.2 — Tables Missing from database_schema.md

The following tables are defined in PRDs but entirely missing from the schema reference:

| Missing Table | Source PRD | Notes |
|--------------|-----------|-------|
| `journal_visibility_settings` | PRD-08 | Category-level journal privacy per child |
| `family_messages` | PRD-08 | Superseded by PRD-15 `messages` (audit ruling confirmed) |
| `family_message_recipients` | PRD-08 | Superseded by PRD-15 |
| `task_queue` | PRD-09A | Superseded by PRD-09B `studio_queue` |
| `optimization_patterns` | PRD-05C | Prompt type detection patterns |
| `family_best_intentions` | PRD-14D | Family-level intentions (distinct from personal) |
| `family_intention_iterations` | PRD-14D | Tally entries for family intentions |
| `slideshow_slides` | PRD-14D | Hub slideshow content |
| `dashboard_backgrounds` | PRD-24A | Per-member background images |
| `background_library` | PRD-24A | Static background catalog |
| `bookshelf_frameworks` | PRD-23 | **ELIMINATED by Founder Ruling 2026-03-23.** `bookshelf_principles` renamed to `bookshelf_insights` (flat structure, no parent table). |
| `bookshelf_shares` | PRD-23 | Book/collection sharing |
| `permission_level_profiles` | PRD-31 Addendum | Seed data for permission presets |
| `boss_quests` | PRD-24A Game Modes Addendum | Boss battle/party quest |
| `bingo_cards` | PRD-24A Game Modes Addendum | Family bingo |
| `evolution_creatures` | PRD-24A Game Modes Addendum | Streak evolution |
| `passport_books` | PRD-24A Game Modes Addendum | Stamp passport |
| `life_area_reference_embeddings` | AI Cost Optimization Patterns | For P2 auto-tagging |
| ~14 Platform Intelligence tables | Platform Intelligence Pipeline v2 | Missing: book_extraction_cache, review_queue, meeting_section_patterns, declaration_patterns, routine_patterns, widget_configurations, question_effectiveness, etc. |

### B.3 — Table Replacement Chain Not Propagated

| Original Table | Replaced By | Source PRD | Status in Schema |
|---------------|-------------|-----------|-----------------|
| `feature_access` | `feature_access_v2` | PRD-31 | Schema has `feature_access_v2` ✓ but PRD-01 still defines `feature_access` |
| `shift_schedules` | `access_schedules` | PRD-35 | Schema has `access_schedules` ✓ but PRD-02 still defines `shift_schedules` |
| `task_rewards` | Superseded by gamification pipeline | PRD-24 | Schema still has `task_rewards` ✗ |
| `task_queue` (PRD-09A) | `studio_queue` (PRD-09B) | PRD-09B | Schema correctly has `studio_queue` ✓ |
| `member_self_insights` (PRD-05) | `self_knowledge` (PRD-07) | PRD-07 | Schema correctly has `self_knowledge` ✓ |
| `family_messages` (PRD-08) | `messages` (PRD-15) | PRD-15 | Schema correctly has `messages` system ✓ |

### B.4 — Major Per-Table Schema Differences

#### `family_members` (PRD-01 + many addenda)
- **PRD-01 defines:** `auth_user_id`, `nicknames`, `dashboard_mode`, `relationship`, `custom_role`, `age`, `date_of_birth`, `in_household`, `dashboard_enabled`, `auth_method`, `visual_password_config`, `out_of_nest`, `invite_status`, `invite_token`, `invite_expires_at`, `onboarding_completed`, `setup_completed`
- **Schema defines:** `user_id`, `login_method`, `pin_hash`, `visual_password`, `member_color`, `calendar_color`, `gamification_points`, `gamification_level`, `current_streak`, `longest_streak`, `last_task_completion_date`, `is_active`
- **Addenda add:** `assigned_color` (PRD-03), `theme_preferences` (PRD-03), `layout_preferences` (PRD-04), `calendar_color` (PRD-14B), `assigned_color_token` (PRD-10), `game_piece_shape` (PRD-10), 6 gamification columns (PRD-24)
- **Issue:** PRD-01 uses `role` enum with 4 values (`primary_parent`, `additional_adult`, `special_adult`, `member`). Schema uses 6 values (`primary_parent`, `additional_adult`, `special_adult`, `independent`, `guided`, `play`). These are fundamentally different designs — PRD-01 separates role from dashboard_mode.

#### `lila_conversations` (PRD-05)
- **PRD-05 defines:** `mode`, `guided_mode`, `guided_subtype`, `guided_mode_reference_id`, `model_used`, `context_snapshot`, `container_type`, `message_count`, `token_usage`, `page_context`
- **Schema defines:** `guided_mode`, `container_type`, `page_context`, `is_included_in_ai`, `is_safe_harbor`, `vault_item_id`, `safety_scanned`
- **Issue:** Schema adds `is_safe_harbor` (from PRD-20), `vault_item_id` (from PRD-21A), `safety_scanned` (from PRD-30) but loses PRD-05's core columns

#### `guiding_stars` (PRD-06)
- **PRD-06 defines:** `owner_type`, `owner_member_id`, `entry_type` (4 values), `title`, `source`, `source_reference_id`, `is_private`, `is_shared_with_partner`, `sort_order`, `archived_at`
- **Schema defines:** `member_id`, `content`, `category`, `description`, `source`, `is_included_in_ai`, `embedding`
- **Issue:** Completely different column sets. PRD supports family-level entries (`owner_type = 'family'`), privacy controls, multiple entry types

#### `tasks` (PRD-09A)
- **PRD-09A defines:** ~40 columns including all prioritization framework fields (`eisenhower_quadrant`, `frog_rank`, `importance_level`, `big_rock`, `ivy_lee_rank`, `abcde_category`, `moscow_category`, `impact_effort`, `kanban_status`), sequential collection fields, task breaker fields, victory flagging
- **Schema defines:** ~15 columns — basic task fields only
- **Issue:** Schema is missing 25+ columns critical for the 14 prioritization views

#### `victories` (PRD-11)
- **PRD-11 defines:** `family_member_id`, `description`, `celebration_text`, `life_area_tag` (singular), `custom_tags`, `recorder_type`, `member_type`, `importance`, `guiding_star_id`, `best_intention_id`, `is_moms_pick`, `moms_pick_note`, `moms_pick_by`, `celebration_voice`, `photo_url`, `archived_at`
- **Schema defines:** `member_id`, `title`, `description`, `source`, `source_reference_id`, `life_area_tags` (plural array), `custom_tags`
- **Issue:** Different column names, missing critical columns (importance, moms_pick, celebration_voice)

#### `life_lantern_areas` (PRD-12A)
- **PRD-12A defines:** `family_member_id`, `section_key` (13 values), `assessment_content`, `vision_content`, `gap_summary`, `assessment_last_updated`, `vision_last_updated`, `display_order`
- **Schema defines:** `member_id`, `area_name` (6 values), `current_state`, `vision`, `gap_analysis`
- **Issue:** Different column names, completely different section key enum (13 vs 6 values)

#### `archive_context_items` (PRD-13)
- **PRD-13 defines:** `context_type` (13-value enum), `is_privacy_filtered`, `source` with specific values, `added_by`, `usage_count`, `last_used_at`, `link_url`, `price_range`, `archived_at`
- **Schema defines:** `visibility`, `is_pinned`, `is_private_note`, `is_shared_with_spouse`, `share_with_family`, `sort_order`, `document_id`, `use_alias_for_external`, `embedding`
- **Issue:** Almost entirely different columns. Schema columns come from PRD-19 addendum modifications, not the base PRD-13

*(This pattern repeats for nearly every table. Full per-table analysis available in the corrected schema.)*

### B.5 — Columns Added by Later PRDs

These columns were specified in addenda but may not have been propagated:

| Column | Added To | Added By | In Schema? |
|--------|----------|----------|-----------|
| `calendar_color` | family_members | PRD-14B | ✓ |
| `sweep_email_address` | families | PRD-17B | ✓ |
| `sweep_email_enabled` | families | PRD-17B | ✓ |
| `is_safe_harbor` | lila_conversations | PRD-20 | ✓ |
| `safety_scanned` | lila_messages | PRD-30 | ✓ |
| `tags TEXT[]` | journal_entries | PRD-18 | ✓ |
| `mindsweep_confidence` | studio_queue | PRD-17B | ✓ |
| `mindsweep_event_id` | studio_queue | PRD-17B | ✓ |
| `show_on_hub` | calendar_events | PRD-14D | ✗ NOT IN SCHEMA |
| `vault_item_id` | lila_conversations | PRD-21A | ✓ |
| `related_plan_id` | journal_entries | PRD-29 | ✓ |
| `related_plan_id` | tasks | PRD-29 | ✓ |
| `points_override` | tasks | PRD-24 | ✗ NOT IN SCHEMA |
| `time_tracking_enabled` | tasks | PRD-36 | ✗ NOT IN SCHEMA |
| `time_threshold_minutes` | tasks | PRD-36 | ✗ NOT IN SCHEMA |
| `is_key_point` | bookshelf extraction tables | PRD-23 Addendum | ✗ NOT IN SCHEMA |
| `audience` | bookshelf extraction tables | PRD-23 Addendum | ✓ (partially) |
| `physical_description` | archive_member_settings | PRD-21A | ✓ |
| `reference_photos` | archive_member_settings | PRD-21A | ✓ |
| `display_name_aliases` | archive_member_settings | PRD-19 | ✓ |
| `is_private_note` | archive_context_items | PRD-19 | ✓ |
| `phone_number` | out_of_nest_members | PRD-22 | ✗ NOT IN SCHEMA |
| `notification_methods` | out_of_nest_members | PRD-22 | ✗ NOT IN SCHEMA |
| `default_reveal_type` | gamification_configs | PRD-24B | ✗ NOT IN SCHEMA |
| `reveal_type` | treasure_boxes | PRD-24B | ✓ |
| `reveal_type` | lists | PRD-24B | ✓ (as `reveal_type`) |
| `tv_config` | family_hub_configs | PRD-14E | ✗ NOT IN SCHEMA |
| `last_published_at` | vault_items | PRD-21B | ✓ |

---

## Category C: Feature Key Registry Completeness

See `audit/CORRECTED_FEATURE_KEY_REGISTRY.md` for the complete registry.

### Summary
- **Total unique feature keys found across all PRDs:** 180+
- **Keys in database_schema.md feature_key_registry:** Not enumerated (table definition only)
- **Keys with assigned tiers:** ~40%
- **Keys with TBD tiers:** ~60% (many deferred to post-beta)

### Potential Conflicts
- `gamification_visual_worlds` (PRD-24) overlaps with `gamification_dashboard_backgrounds` (PRD-24A)
- `vault_browse` appears in both PRD-21A and PRD-31 Permission Matrix with different scoping
- Multiple vault-related keys split differently between PRD-21A and PRD-31 Permission Matrix

---

## Category D: Shell Behavior Completeness

### PRDs with Complete 5-Shell Tables
PRD-09A, PRD-10, PRD-11, PRD-14B, PRD-21, PRD-22, PRD-25, PRD-26

### PRDs with Incomplete/Missing Shell Tables
| PRD | Issue |
|-----|-------|
| PRD-05 | 6-shell table present but Special Adult behavior is "No access" without detail |
| PRD-06 | Guided and Play entries say "Stubbed" or "Feature not present" |
| PRD-07 | Same as PRD-06 |
| PRD-08 | Guided/Play entries are "Not present" without explanation of lightweight alternatives |
| PRD-11B | No formal shell table; access described narratively |
| PRD-12A | Guided/Play "Not present" |
| PRD-12B | Mixed format; some roles described narratively |
| PRD-13 | Only Mom and Dad have detailed entries |
| PRD-14C | Only Mom and Dad with permission detail |
| PRD-14D | Hub is shell-independent; formal table not needed |
| PRD-23 | Guided "stub → PRD-25"; Play "Not present" |

---

## Category E: Guided Mode Registry

See `audit/CORRECTED_GUIDED_MODE_REGISTRY.md` for the complete registry.

### Summary
- **Total unique guided modes found:** 35+
- **Modes with full specifications (model, context, opening messages):** ~15
- **Modes referenced but not fully specified:** ~10
- **Mode key conflicts:** `thoughtsift` placeholder in PRD-05 → replaced by 5 specific modes in PRD-34
- **Mode supersession:** `relationship_mediation` (PRD-19) → `mediator` (PRD-34)

---

## Category F: Stub Registry

See `audit/CORRECTED_STUB_REGISTRY.md` for the complete registry.

### Summary
- **Total stubs created across all PRDs:** ~120
- **Stubs marked as WIRED:** ~60
- **Stubs still unwired (future PRDs):** ~40
- **Stubs marked as Post-MVP:** ~20
- **Orphaned stubs (no clear wiring target):** ~5

---

## Category G: Naming Consistency

### Confirmed Naming Rulings (Later PRD Wins)
| Ruling | Chosen | Rejected | Source |
|--------|--------|----------|--------|
| Self-knowledge table | `self_knowledge` | `member_self_insights` | PRD-07 supersedes PRD-05 |
| Reveal animation | `reveal_type` | `animation_template` | PRD-24B supersedes PRD-24 |
| Schedule table | `access_schedules` | `shift_schedules` | PRD-35 supersedes PRD-02 |
| Dashboard background | `dashboard_background_key` | `visual_world_theme` | PRD-24A supersedes PRD-24 |
| Book insights | `bookshelf_insights` (flat, expanded CHECK) | `bookshelf_principles` + `bookshelf_frameworks` | Founder Ruling 2026-03-23: frameworks eliminated, principles renamed to insights |
| Messaging | PRD-15 `messages` system | PRD-08 `family_messages` | PRD-15 is authoritative |
| Studio queue | PRD-09B `studio_queue` | PRD-09A `task_queue` | PRD-09B is authoritative |
| Feature access | PRD-31 `feature_access_v2` | PRD-01 `feature_access` | PRD-31 is authoritative |
| Feature name | InnerWorkings | My Foundation | PRD-07 Session Addendum |
| Daily summary column | `background_change_today` | `theme_unlocks_today` | PRD-24A |
| Randomizer visual | `reveal_type` | `reveal_visual` | PRD-24B reconciliation |
| Name Packs | REMOVED | was in PRD-03 | PRD-22 removes entirely |
| List column | `reveal_type` | `reveal_visual` | PRD-24B reconciliation over PRD-24 |

### Feature Names Requiring Compound Capitals
Verified across all PRDs:
- LifeLantern ✓
- InnerWorkings ✓
- GuidingStars ✓
- BestIntentions ✓
- BookShelf ✓
- ThoughtSift ✓
- BigPlans ✓
- MindSweep ✓
- DailyCelebration ✓
- SafeHarbor ✓

### Inconsistencies Found
- PRD-12A uses "Personal LifeLantern" (two words) in display text — acceptable as display name
- Some PRDs reference "Guiding Stars" (two words) in prose — acceptable as prose, must be `GuidingStars` in code
- `task_rewards` table from PRD-09A naming conflicts with `gamification_rewards` from PRD-24 — resolved by PRD-24 superseding

---

## Decisions Requiring Founder Input

### Decision 1: `family_members.role` Enum Design
- **PRD-01 design:** 4 roles (`primary_parent`, `additional_adult`, `special_adult`, `member`) + separate `dashboard_mode` column (`adult`, `independent`, `guided`, `play`)
- **Schema design:** 6 roles (`primary_parent`, `additional_adult`, `special_adult`, `independent`, `guided`, `play`) with no separate dashboard_mode
- **Impact:** Fundamental data model difference
- **Recommendation:** Use PRD-01 design (4 roles + dashboard_mode). It's more flexible and matches the PRD's intent that dashboard_mode is mom-assigned and changeable, while role is structural.

### Decision 2: `bookshelf_frameworks` Table — RESOLVED (Founder Ruling 2026-03-23)
- **PRD-23 defines both** `bookshelf_frameworks` (parent) and `bookshelf_principles` (child)
- **Audit ruling says** `bookshelf_principles` chosen over `bookshelf_frameworks`
- **But PRD-23 uses both** with a FK relationship
- ~~**Recommendation:** Keep both tables as PRD-23 defines them.~~
- **FOUNDER RULING:** `bookshelf_frameworks` table is ELIMINATED entirely. `bookshelf_principles` is RENAMED to `bookshelf_insights`. Tab 2 display name changed from "Principles & Frameworks" to "Insights". The `bookshelf_insights` table uses a flat structure (no parent-child, no framework_id FK) with expanded `principle_type` CHECK: 'principle', 'framework', 'mental_model', 'process', 'strategy', 'concept', 'system', 'tool_set'.

### Decision 3: `member_feature_toggles` Model
- **database_schema.md:** Sparse model (`is_disabled` boolean, rows only when DISABLED)
- **PRD-31 Permission Matrix Addendum:** Pre-populated model (`enabled` boolean, rows for EVERY member × feature + `blocked_by_tier` + `applied_profile_level`)
- **Recommendation:** Use PRD-31 addendum design. It's more recent and provides better UX for the permission hub.

### Decision 4: Embedding Column Type
- **Semantic Context Addendum:** `halfvec(1536)` (recommended for cost efficiency)
- **Some tables in schema:** `vector(1536)`
- **Recommendation:** Use `halfvec(1536)` consistently per the Semantic Context Infrastructure Addendum.

---

## Founder Rulings Applied Post-Audit

### Ruling: ESA Invoice Tier (2026-03-23)
- `compliance_esa_invoice` feature key changed from **Full Magic** to **Essential** (available at all tiers)
- Rationale: ESA invoices are zero AI cost and enable revenue. PRD-28B already specifies Essential. The audit's CORRECTED_FEATURE_KEY_REGISTRY.md previously had it at Full Magic, which conflicted with the PRD.

### Ruling: BookShelf Insights (2026-03-23)
- See Decision 2 above (marked RESOLVED).
- `bookshelf_frameworks` table ELIMINATED. `bookshelf_principles` RENAMED to `bookshelf_insights`.
- Tab 2 display name: "Insights" (was "Principles & Frameworks").
- `bookshelf_insights.principle_type` CHECK: 'principle', 'framework', 'mental_model', 'process', 'strategy', 'concept', 'system', 'tool_set'.
- Flat structure — no parent-child relationship, no framework_id FK.

---

## Next Steps

1. **Replace `claude/database_schema.md`** with `audit/CORRECTED_DATABASE_SCHEMA.md` after founder review
2. **Replace `claude/conventions.md`** with `audit/CORRECTED_CONVENTIONS.md`
3. **During build:** Always read the PRD file before implementing. Never rely solely on schema reference docs.
4. **Track addenda actions:** Use `audit/UNRESOLVED_CROSS_PRD_ACTIONS.md` as the cleanup list
5. **Seed data:** Use `audit/CORRECTED_FEATURE_KEY_REGISTRY.md` and `audit/CORRECTED_GUIDED_MODE_REGISTRY.md` for migration seeds
