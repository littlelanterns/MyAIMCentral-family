# MyAIM Central — CORRECTED Database Schema (PRD-Authoritative)

> **Purpose:** This document corrects the `claude/database_schema.md` file, which was found to have significant inaccuracies. Nearly every table had different column names, missing columns, incorrect types, or fabricated columns compared to the actual PRD definitions.
>
> **Rule:** PRDs are the ONLY source of truth. If this document conflicts with `claude/database_schema.md`, this document wins. If two PRDs conflict, the newer one wins (per CLAUDE.md rule #11).
>
> **Generated:** 2026-03-23
> **Source:** Full PRD corpus (PRD-01 through PRD-38 + all addenda)

---

## Table-Level Index

### Auth & Family (PRD-01, PRD-02)

| Table | Defining PRD | Status vs `database_schema.md` |
|-------|-------------|-------------------------------|
| `families` | PRD-01 | CORRECTED — `tablet_hub_timeout` is TEXT not INTEGER, missing `setup_completed` |
| `family_members` | PRD-01 | CORRECTED — major differences: `auth_user_id` not `user_id`, `dashboard_mode`, `relationship`, `nicknames`, `custom_role`, `age`, `date_of_birth`, `in_household`, `dashboard_enabled`, `auth_method` not `login_method`, `visual_password_config` not `visual_password`, `out_of_nest`, invite columns, `onboarding_completed`. Role enum is 4 values not 6. |
| `special_adult_assignments` | PRD-01 | CORRECTED — uses `assigned_member_id` not `child_id` |
| `subscription_tiers` | PRD-01 (base), PRD-31 (authoritative) | CORRECTED — PRD-01 has `display_name`, `description`, no `slug`, no `founding_discount`, no `monthly_ai_allotment`, no `features_summary`, no `sort_order` |
| `family_subscriptions` | PRD-01 (base), PRD-31 (authoritative) | CORRECTED — PRD-01 has `is_founding_family`, `founding_rate_monthly`, `founding_rate_yearly`, no `stripe_*`, no `pending_tier_id` |
| `feature_access` | PRD-01 | NOTE — superseded by `feature_access_v2` (PRD-31) |
| `member_permissions` | PRD-02 | CORRECTED — PRD-02 has `granted_by`, `granted_to`, `target_member_id`, `feature_key`, `access_level`. Schema has `granting_member_id` and `permission_key`/`permission_value` |
| `view_as_permissions` | PRD-02 | MISSING from schema — schema has `view_as_sessions` instead |
| `mom_self_restrictions` | PRD-02 | MISSING from schema entirely |
| `special_adult_permissions` | PRD-02 | MISSING from schema entirely |
| `shift_sessions` | PRD-02 | MISSING from schema entirely |
| `shift_schedules` | PRD-02 | NOTE — superseded by `access_schedules` (PRD-35) |
| `teen_sharing_overrides` | PRD-02 | MISSING from schema entirely |
| `permission_presets` | PRD-02 | MISSING from schema entirely |

### LiLa AI System (PRD-05, PRD-05C)

| Table | Defining PRD | Status vs `database_schema.md` |
|-------|-------------|-------------------------------|
| `lila_conversations` | PRD-05 | CORRECTED — missing `mode`, `guided_subtype`, `guided_mode_reference_id`, `model_used`, `context_snapshot`, `message_count`, `token_usage` |
| `lila_messages` | PRD-05 | CORRECTED — missing `token_count`, metadata default differs |
| `lila_guided_modes` | PRD-05 | CORRECTED — missing `parent_mode`, `avatar_key`, `opening_messages`, `system_prompt_key`, `sort_order`, `is_active` |
| `lila_tool_permissions` | PRD-05 | CORRECTED — uses `is_enabled` not `is_granted`, missing `context_person_ids`, `include_family_context` |
| `member_self_insights` | PRD-05 | DEFERRED — superseded by `self_knowledge` (PRD-07) |
| `optimizer_outputs` | PRD-05C | CORRECTED — missing `family_id`, `message_id`, `original_request`, `prompt_type`, `prompt_category`, many tracking columns |
| `optimization_patterns` | PRD-05C | MISSING from schema entirely |
| `user_prompt_templates` | PRD-05C | CORRECTED — different column names throughout |
| `context_presets` | PRD-05C | CORRECTED — different column names throughout |
| `ai_usage_tracking` | PRD-05C | CORRECTED — different columns entirely |

### Personal Growth (PRD-06 through PRD-13)

| Table | Defining PRD | Status vs `database_schema.md` |
|-------|-------------|-------------------------------|
| `guiding_stars` | PRD-06 | CORRECTED — missing `owner_type`, `owner_member_id` (uses `member_id`), `entry_type`, `title`, `source_reference_id`, `is_private`, `is_shared_with_partner`, `sort_order`, `archived_at`. Schema fabricated `description`, `embedding`. |
| `best_intentions` | PRD-06 | CORRECTED — missing `owner_member_id`, `title`, `description`, `source_reference_id`, `related_member_ids`, `tracker_style`, `is_active`, `is_private`, `is_shared_with_partner`, `sort_order`, `archived_at`. Schema fabricated `statement`, `celebration_count`, `iteration_count`, `embedding`, `last_reset_at`. |
| `intention_iterations` | PRD-06 | CORRECTED — missing `family_id`, `member_id`, `recorded_at`, `day_date`. Schema fabricated `victory_reference`. |
| `self_knowledge` | PRD-07 | CORRECTED — uses `owner_member_id` not `member_id`, `source` is freeform TEXT not CHECK enum, `source_type` has different values, missing `source_reference_id`, `file_storage_path`, `is_private`, `is_shared_with_mom`, `sort_order`, `archived_at`. Schema fabricated `share_with_mom`/`share_with_dad` naming. |
| `journal_entries` | PRD-08 | CORRECTED — uses `owner_member_id`, `text` not `content`, `life_area_tags` not `tags`, different `entry_type` enum (11 values), different `source` values, missing `routed_to`, `routed_reference_ids`, `mood_tag`, `audio_file_path`, `archived_at`, `is_shared_with_mom/dad`, `is_private`. Schema fabricated `visibility` column. |
| `notepad_tabs` | PRD-08 | CORRECTED — uses `owner_member_id`, missing `status`, `routed_to`, `routed_reference_id`, `source_type`, `source_reference_id`, `is_auto_named`, `archived_at` |
| `notepad_extracted_items` | PRD-08 | CORRECTED — uses `extracted_text` not `extracted_content`, `item_type` not just routing, `suggested_destination`, `actual_destination`, `confidence`, different `status` enum |
| `notepad_routing_stats` | PRD-08 | CORRECTED — uses `owner_member_id`, `route_count` not `count`, `last_used_at` not `last_routed_at` |
| `journal_visibility_settings` | PRD-08 | MISSING from schema entirely |
| `family_messages` | PRD-08 | NOTE — superseded by PRD-15 `messages` table |
| `family_message_recipients` | PRD-08 | NOTE — superseded by PRD-15 messaging system |
| `task_templates` | PRD-09A | CORRECTED — uses `template_name` not `title`, `template_type` with 7 values not `task_type` with 4, many missing columns |
| `task_template_sections` | PRD-09A | CORRECTED — uses `section_name` not `title`, missing `frequency_rule`, `frequency_days`, `show_until_complete` |
| `task_template_steps` | PRD-09A | CORRECTED — uses `step_name` not `title`, missing `step_notes`, `instance_count`, `require_photo` |
| `tasks` | PRD-09A | CORRECTED — ~20 missing columns including all methodology fields |
| `task_assignments` | PRD-09A | CORRECTED — uses `family_member_id` not `member_id`, missing `start_date`, `end_date`, `rotation_position`, `is_active` |
| `task_completions` | PRD-09A | CORRECTED — uses `family_member_id`, missing `completion_note`, `photo_url`, `rejected`, `rejection_note`, `period_date`. Schema fabricated `evidence` JSONB. |
| `routine_step_completions` | PRD-09A | CORRECTED — uses `family_member_id`, missing `instance_number`, `period_date`, `photo_url` |
| `sequential_collections` | PRD-09A | CORRECTED — missing `template_id`, `total_items`, `active_count`, `promotion_timing`, `life_area_tag`, `reward_per_item_*`. Schema fabricated `task_ids`, `current_index`. |
| `task_claims` | PRD-09A | CORRECTED — uses `claimed_by` not `member_id`, missing `expires_at`, `completed`, `released`, `released_at`. Schema fabricated `status` enum. |
| `task_queue` | PRD-09A | NOTE — superseded by `studio_queue` (PRD-17 authoritative) |
| `task_rewards` | PRD-09A | CORRECTED — uses `reward_amount` not `reward_value` JSONB, missing `bonus_threshold`, `bonus_percentage` |
| `activity_log_entries` | PRD-09A | CORRECTED — uses `family_member_id`, missing `display_text`, `description`, `photo_url`, `source`, `shift_session_id`, `hidden` |
| `lists` | PRD-09B | CORRECTED — uses `created_by`/`list_name`, different `list_type` enum, missing `template_id`, `description`, `is_shared`, `victory_on_complete`, `archived_at`. Schema fabricated `owner_id`, `reveal_type`, `max_respins_per_period`, `respin_period`. |
| `list_items` | PRD-09B | CORRECTED — uses `item_name` not `content`, many missing columns: `checked_by`, `checked_at`, `url`, `quantity`, `quantity_unit`, `price`, `currency`, `category`, `item_date`, `priority`, `gift_for`, `promoted_to_task`, `promoted_task_id`, `is_repeatable`, `is_available`, `parent_item_id` |
| `list_shares` | PRD-09B | CORRECTED — uses `member_id` not `shared_with`, missing `is_individual_copy`, uses `can_edit` not `permission` enum |
| `list_templates` | PRD-09B | CORRECTED — uses `template_name`, missing `created_by`, `description`, `usage_count`, `last_deployed_at`, `archived_at`. Schema uses `is_system` and `default_items` differently. |
| `studio_queue` | PRD-17 (authoritative) | CORRECTED — PRD-17 is authoritative, differences from schema in columns and CHECK values |
| `victories` | PRD-11 | CORRECTED — uses `family_member_id`, `description` not `title`, missing `celebration_text`, `recorder_type`, `member_type`, `importance`, `guiding_star_id`, `best_intention_id`, `is_moms_pick`, `moms_pick_note`, `moms_pick_by`, `celebration_voice`, `photo_url`, `archived_at`. Schema fabricated `title`, `life_area_tags` (plural). |
| `victory_celebrations` | PRD-11 | CORRECTED — uses `family_member_id`, `celebration_date`, `mode`, `period`, `victory_ids`, `victory_count`, `celebration_voice`, `context_sources`. Schema has entirely different structure. |
| `victory_voice_preferences` | PRD-11 | CORRECTED — missing `family_id`, uses `selected_voice` not `voice_key` |
| `family_victory_celebrations` | PRD-11B | CORRECTED — minor column differences |
| `life_lantern_areas` | PRD-12A | CORRECTED — uses `section_key` (13 values) not `area_name` (6 values), uses `family_member_id`, `assessment_content`/`vision_content` not `current_state`/`vision`, missing `assessment_last_updated`, `vision_last_updated`, `display_order` |
| `life_lantern_area_snapshots` | PRD-12A | CORRECTED — uses `life_lantern_area_id`, different structure with `content_type`, `content`, `snapshot_name` |
| `life_lantern_role_models` | PRD-12A | CORRECTED — uses `family_member_id`, missing `family_id`, `life_lantern_area_id`, `is_fictional`, `traits`, `notes`. Schema fabricated `attributes` JSONB. |
| `personal_vision_statements` | PRD-12A | CORRECTED — missing `is_active`, `statement_text`, `version_name`, `generated_by`, `area_snapshot`, `is_included_in_ai`, `visibility`, `visible_to_members`, `created_by`. Schema fabricated `content`/`version`. |
| `family_vision_quests` | PRD-12B | CORRECTED — missing `sections_included`, `launched_at`, `completed_at` |
| `vision_sections` | PRD-12B | CORRECTED — uses `section_key` enum, `current_content`, missing `last_generated_at`, `last_edited_at`, `is_current`. Schema fabricated `quest_id`, `topic`, `current_synthesis`. |
| `vision_section_history` | PRD-12B | CORRECTED — uses `vision_section_id`, missing `family_id`, `version_name`, `saved_by`. Schema fabricated `section_id`, `synthesis`. |
| `vision_section_responses` | PRD-12B | CORRECTED — uses `quest_id`, `section_key`, `responding_member_id`, missing `captured_by_member_id`, `captured_by_mom`, `voice_recording_url`, `lila_assisted`, `answered_at`. Schema fabricated `response`. |
| `vision_section_discussions` | PRD-12B | CORRECTED — uses `quest_id`, `section_key`, missing `lila_summary`, `transcript_chunks`, `recorded_at`. Schema fabricated `audio_url`. |
| `family_vision_statements` | PRD-12B | CORRECTED — missing `is_active`, `statement_text`, `version_name`, `generated_by`, `section_snapshot`, `generated_at`, `created_by`. Schema fabricated `content`/`version`. |
| `archive_folders` | PRD-13 | CORRECTED — missing `icon`, `color_hex`, `description`, `is_system`, `is_included_in_ai`, `sort_order`. Different `folder_type` enum. |
| `archive_context_items` | PRD-13 | CORRECTED — missing `member_id`, `context_type`, `is_privacy_filtered`, `source`, `source_conversation_id`, `added_by`, `usage_count`, `last_used_at`, `link_url`, `price_range`, `archived_at`. Schema fabricated many columns. |
| `archive_member_settings` | PRD-13 | CORRECTED — missing `is_included_in_ai`, `overview_card_content`, `overview_card_updated_at`. Schema fabricated `display_name_aliases`, `external_alias`, etc. |
| `faith_preferences` | PRD-13 | CORRECTED — uses `faith_tradition`, boolean approach flags instead of `response_approach` enum, many missing booleans |
| `context_learning_dismissals` | PRD-13 | CORRECTED — uses `content_hash` not `suggestion_hash`, missing `conversation_id`, uses `family_id` (no `member_id`) |

### Remaining Domains (Summary)

Tables in the Communication, Daily Life, AI Vault, Gamification, Platform Complete, Infrastructure, and Admin domains also have significant differences. These are documented in the detailed sections below where PRD data was available.

---

## Detailed Table Definitions

---

## 1. Auth & Family (PRD-01)

### `families`

**PRD:** PRD-01 | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| primary_parent_id | UUID | — | NOT NULL | FK auth.users |
| family_name | TEXT | — | NOT NULL | Display name (e.g., "The Smith Family") |
| family_login_name | TEXT | null | NULL | Unique, case-insensitive login identifier. Nullable until set. |
| family_login_name_lower | TEXT | null | NULL | Lowercase version. Auto-set via trigger. |
| is_founding_family | BOOLEAN | false | NOT NULL | |
| founding_family_rates | JSONB | null | NULL | Per-tier special pricing |
| timezone | TEXT | 'America/Chicago' | NOT NULL | Family default timezone |
| tablet_hub_config | JSONB | '{"widgets": [], "layout": []}' | NOT NULL | Widget configuration for hub view |
| tablet_hub_timeout | TEXT | 'never' | NOT NULL | **PRD says TEXT enum: 'never', '15min', '30min', '1hr', '4hr'. Schema incorrectly had INTEGER.** |
| setup_completed | BOOLEAN | false | NOT NULL | **Missing from schema.** Whether family members have been added. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Key differences from `database_schema.md`:**
- `tablet_hub_timeout`: PRD-01 defines as TEXT with enum values, schema had INTEGER with default 300
- `setup_completed`: Present in PRD-01, missing from schema entirely
- Schema fabricated: `founding_onboarding_complete`, `founding_onboarding_grace_deadline`, `founding_family_lost_at`, `sweep_email_address`, `sweep_email_enabled`, `analytics_opt_in`, `last_data_export_at` — these may come from later PRDs (PRD-31, PRD-17B, PRD-22)

**Later PRD additions (confirmed):**
- PRD-05C adds: `ai_credit_balance` INTEGER, `preferred_platform` TEXT, `optimizer_mode_default` TEXT (on families or family_settings)
- PRD-17B adds: `sweep_email_address` TEXT, `sweep_email_enabled` BOOLEAN
- PRD-22 adds: `analytics_opt_in` BOOLEAN, `last_data_export_at` TIMESTAMPTZ
- PRD-31 adds: `founding_onboarding_complete` BOOLEAN, `founding_onboarding_grace_deadline` TIMESTAMPTZ, `founding_family_lost_at` TIMESTAMPTZ

---

### `family_members`

**PRD:** PRD-01 | **Status:** CORRECTED — Major differences

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| auth_user_id | UUID | null | NULL | **PRD uses `auth_user_id`, schema uses `user_id`.** FK auth.users. NULL for PIN-only members. |
| display_name | TEXT | — | NOT NULL | |
| nicknames | TEXT[] | '{}' | NOT NULL | **Missing from schema.** Alternative names for AI context. |
| role | TEXT | — | NOT NULL | **PRD-01 enum: 'primary_parent', 'additional_adult', 'special_adult', 'member'. Schema incorrectly has 6 values including 'independent', 'guided', 'play'.** |
| dashboard_mode | TEXT | null | NULL | **Missing from schema.** Enum: 'adult', 'independent', 'guided', 'play'. Separate from role — describes UI shell. |
| relationship | TEXT | — | NOT NULL | **Missing from schema.** Enum: 'self', 'spouse', 'child', 'special' |
| custom_role | TEXT | null | NULL | **Missing from schema.** Free text for special adults. |
| age | INTEGER | null | NULL | **Missing from schema.** |
| date_of_birth | DATE | null | NULL | **Missing from schema.** |
| in_household | BOOLEAN | true | NOT NULL | **Missing from schema.** Lives in household vs. context-only. |
| dashboard_enabled | BOOLEAN | true | NOT NULL | **Missing from schema.** Whether member appears in login selection. |
| auth_method | TEXT | 'pin' | NOT NULL | **PRD uses `auth_method`, schema uses `login_method`.** Enum: 'full_login', 'pin', 'visual_password', 'none'. |
| pin_hash | TEXT | null | NULL | |
| visual_password_config | JSONB | null | NULL | **PRD uses `visual_password_config`, schema uses `visual_password`.** |
| avatar_url | TEXT | null | NULL | |
| out_of_nest | BOOLEAN | false | NOT NULL | **Missing from schema.** Adult child who has left home. |
| invite_status | TEXT | null | NULL | **Missing from schema.** 'pending', 'accepted', 'expired'. |
| invite_token | TEXT | null | NULL | **Missing from schema.** Unique invite token. |
| invite_expires_at | TIMESTAMPTZ | null | NULL | **Missing from schema.** |
| onboarding_completed | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Later PRD additions (confirmed):**
- PRD-03 adds: `assigned_color` TEXT, `theme_preferences` JSONB
- PRD-04 adds: `layout_preferences` JSONB
- PRD-14B adds: `calendar_color` TEXT
- PRD-24 adds: `gamification_points` INTEGER, `gamification_level` INTEGER, `current_streak` INTEGER, `longest_streak` INTEGER, `last_task_completion_date` DATE, `member_color` TEXT (may overlap with `assigned_color`)

**Schema fabricated columns not in PRD-01:** `member_color`, `calendar_color`, `gamification_points`, `gamification_level`, `current_streak`, `longest_streak`, `last_task_completion_date`, `is_active` — most of these are from later PRDs but the schema incorrectly omits the PRD-01 base columns.

---

### `special_adult_assignments`

**PRD:** PRD-01 | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| special_adult_id | UUID | — | NOT NULL | FK family_members |
| assigned_member_id | UUID | — | NOT NULL | **PRD uses `assigned_member_id`, schema uses `child_id`.** FK family_members |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

---

## 2. Permissions & Access Control (PRD-02)

### `member_permissions`

**PRD:** PRD-02 | **Status:** CORRECTED — Different column names and structure

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| granted_by | UUID | — | NOT NULL | **PRD uses `granted_by`. Schema uses `granting_member_id`.** FK family_members (typically mom) |
| granted_to | UUID | — | NOT NULL | **Missing from schema.** FK family_members (typically dad) |
| target_member_id | UUID | — | NOT NULL | FK family_members (the kid whose data is accessed) |
| feature_key | TEXT | — | NOT NULL | **PRD uses `feature_key`. Schema uses `permission_key`.** |
| access_level | TEXT | 'none' | NOT NULL | **Missing from schema.** Enum: 'none', 'view', 'contribute', 'manage'. Schema has `permission_value` JSONB instead. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Unique constraint:** `(family_id, granted_to, target_member_id, feature_key)`

---

### `view_as_permissions`

**PRD:** PRD-02 | **Status:** MISSING from schema (schema has `view_as_sessions` with different purpose)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| viewer_id | UUID | — | NOT NULL | FK family_members |
| target_member_id | UUID | — | NOT NULL | FK family_members |
| enabled | BOOLEAN | true | NOT NULL | Master toggle |
| excluded_features | JSONB | '[]' | NOT NULL | Feature keys excluded from View As |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

---

### `mom_self_restrictions`

**PRD:** PRD-02 | **Status:** MISSING from schema entirely

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| primary_parent_id | UUID | — | NOT NULL | FK family_members (mom) |
| target_member_id | UUID | — | NOT NULL | FK family_members (the kid) |
| feature_key | TEXT | — | NOT NULL | Feature being restricted |
| restriction_type | TEXT | 'full' | NOT NULL | Enum: 'full', 'tag' |
| restricted_tags | TEXT[] | '{}' | NOT NULL | If restriction_type = 'tag', which tags are hidden |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

---

### `special_adult_permissions`

**PRD:** PRD-02 | **Status:** MISSING from schema entirely

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| assignment_id | UUID | — | NOT NULL | FK special_adult_assignments |
| feature_key | TEXT | — | NOT NULL | Feature category |
| access_level | TEXT | 'none' | NOT NULL | Enum: 'none', 'view', 'contribute' (never 'manage') |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

---

### `shift_sessions`

**PRD:** PRD-02 | **Status:** MISSING from schema entirely

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| special_adult_id | UUID | — | NOT NULL | FK family_members |
| started_at | TIMESTAMPTZ | now() | NOT NULL | |
| ended_at | TIMESTAMPTZ | null | NULL | NULL = currently active |
| started_by | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'scheduled', 'mom' |
| ended_by | TEXT | null | NULL | Same enum |
| summary_compiled | BOOLEAN | false | NOT NULL | |
| summary_text | TEXT | null | NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

---

### `shift_schedules`

**PRD:** PRD-02 | **Status:** Superseded by `access_schedules` (PRD-35)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| special_adult_id | UUID | — | NOT NULL | FK family_members |
| day_of_week | INTEGER | — | NOT NULL | 0=Sunday through 6=Saturday |
| start_time | TIME | — | NOT NULL | |
| end_time | TIME | — | NOT NULL | |
| is_active | BOOLEAN | true | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

---

### `teen_sharing_overrides`

**PRD:** PRD-02 | **Status:** MISSING from schema entirely

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| member_id | UUID | — | NOT NULL | FK family_members (the teen) |
| feature_key | TEXT | — | NOT NULL | |
| resource_id | UUID | — | NOT NULL | FK to feature table |
| original_visibility | TEXT | — | NOT NULL | |
| new_visibility | TEXT | — | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

---

### `permission_presets`

**PRD:** PRD-02 | **Status:** MISSING from schema entirely

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| created_by | UUID | — | NOT NULL | FK family_members (mom) |
| preset_name | TEXT | — | NOT NULL | |
| target_role | TEXT | — | NOT NULL | Enum: 'additional_adult', 'special_adult' |
| permissions_config | JSONB | — | NOT NULL | Full permissions snapshot |
| is_system_preset | BOOLEAN | false | NOT NULL | True for built-in presets |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

---

## 3. LiLa AI System (PRD-05)

### `lila_conversations`

**PRD:** PRD-05 | **Status:** CORRECTED — many missing columns

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| member_id | UUID | — | NOT NULL | FK family_members |
| title | TEXT | null | NULL | AI auto-generated, user-editable |
| mode | TEXT | 'general' | NOT NULL | **Missing from schema.** Core mode: 'general', 'help', 'assist', 'optimizer' |
| guided_mode | TEXT | null | NULL | If in guided mode: 'first_mate_action', etc. |
| guided_subtype | TEXT | null | NULL | **Missing from schema.** Specific subtype: 'cyrano', 'higgins_say', etc. |
| guided_mode_reference_id | UUID | null | NULL | **Missing from schema.** FK for person UUID, etc. |
| model_used | TEXT | null | NULL | **Missing from schema.** 'sonnet', 'haiku' |
| context_snapshot | JSONB | '{}' | NOT NULL | **Missing from schema.** Context sources when conversation started |
| container_type | TEXT | 'drawer' | NOT NULL | CHECK: 'drawer', 'modal' |
| status | TEXT | 'active' | NOT NULL | CHECK: 'active', 'archived', 'deleted' |
| message_count | INTEGER | 0 | NOT NULL | **Missing from schema.** Denormalized count |
| token_usage | JSONB | '{"input": 0, "output": 0}' | NOT NULL | **Missing from schema.** Cumulative token usage |
| page_context | TEXT | null | NULL | Which page was active |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Later PRD additions:**
- PRD-20 adds: `is_safe_harbor` BOOLEAN DEFAULT false
- PRD-21A adds: `vault_item_id` UUID (FK vault_items)
- PRD-30 adds: `safety_scanned` BOOLEAN DEFAULT false

**Schema columns NOT in PRD-05:** `is_included_in_ai` — this is not on conversations in PRD-05

---

### `lila_messages`

**PRD:** PRD-05 | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| conversation_id | UUID | — | NOT NULL | FK lila_conversations (ON DELETE CASCADE) |
| role | TEXT | — | NOT NULL | CHECK: 'user', 'assistant', 'system' |
| content | TEXT | — | NOT NULL | Message text |
| metadata | JSONB | '{}' | NOT NULL | **Default is '{}' not NULL.** Action chips, context used, teaching skill, etc. |
| token_count | INTEGER | null | NULL | **Missing from schema.** Tokens used for this message |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**Later PRD additions:**
- PRD-30 adds: `safety_scanned` BOOLEAN DEFAULT false

**Schema columns NOT in PRD-05:** `message_type` — not defined in PRD-05

---

### `lila_guided_modes`

**PRD:** PRD-05 | **Status:** CORRECTED — different columns

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| mode_key | TEXT | — | NOT NULL | UNIQUE. Identifier |
| display_name | TEXT | — | NOT NULL | |
| parent_mode | TEXT | null | NULL | **Missing from schema.** The guided_mode value |
| avatar_key | TEXT | 'sitting' | NOT NULL | **Missing from schema (schema has `avatar_set`).** Which avatar to use |
| model_tier | TEXT | 'sonnet' | NOT NULL | CHECK: 'sonnet', 'haiku' |
| context_sources | TEXT[] | '{}' | NOT NULL | |
| person_selector | BOOLEAN | false | NOT NULL | |
| opening_messages | JSONB | '[]' | NOT NULL | **Missing from schema.** Array of opening message strings |
| system_prompt_key | TEXT | — | NOT NULL | **Missing from schema.** Reference to system prompt |
| available_to_roles | TEXT[] | '{"mom"}' | NOT NULL | **Default is '{"mom"}' not NULL.** |
| requires_feature_key | TEXT | null | NULL | |
| sort_order | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| is_active | BOOLEAN | true | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

---

### `lila_tool_permissions`

**PRD:** PRD-05 | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| member_id | UUID | — | NOT NULL | FK family_members |
| mode_key | TEXT | — | NOT NULL | FK lila_guided_modes.mode_key |
| is_enabled | BOOLEAN | true | NOT NULL | **PRD uses `is_enabled`, schema uses `is_granted`.** |
| context_person_ids | UUID[] | '{}' | NOT NULL | **Missing from schema.** Which people's context this member can access |
| include_family_context | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Schema fabricated:** `granted_by` — not in PRD-05.

---

## 4. LiLa Optimizer (PRD-05C)

### `optimizer_outputs`

**PRD:** PRD-05C | **Status:** CORRECTED — significantly different

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | **Missing from schema.** |
| conversation_id | UUID | — | NOT NULL | FK lila_conversations |
| message_id | UUID | — | NOT NULL | **Missing from schema.** FK lila_messages |
| original_request | TEXT | — | NOT NULL | **Missing from schema.** Mom's original input |
| prompt_type | TEXT | 'general' | NOT NULL | **Missing from schema.** Detected prompt type |
| prompt_category | TEXT | 'text' | NOT NULL | **Missing from schema.** text, conversation_flow, image, search |
| optimized_prompt | TEXT | — | NOT NULL | **PRD uses `optimized_prompt`, schema uses `output_content`.** |
| context_snapshot | JSONB | '{}' | NOT NULL | **Missing from schema.** |
| context_preset_used | TEXT | 'auto_detect' | NOT NULL | **Missing from schema.** |
| optimization_method | TEXT | 'template' | NOT NULL | **Missing from schema.** 'template' or 'ai' |
| was_copied | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| was_edited | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| was_saved_as_template | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| tokens_used | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

---

### `optimization_patterns`

**PRD:** PRD-05C | **Status:** MISSING from schema entirely

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| prompt_type | TEXT | — | NOT NULL | UNIQUE |
| prompt_category | TEXT | 'text' | NOT NULL | |
| detection_keywords | TEXT[] | '{}' | NOT NULL | |
| detection_patterns | TEXT[] | '{}' | NOT NULL | Regex patterns |
| required_context | TEXT[] | '{}' | NOT NULL | |
| optional_context | TEXT[] | '{}' | NOT NULL | |
| clarifying_questions | JSONB | '[]' | NOT NULL | |
| template | TEXT | — | NOT NULL | Prompt template with placeholders |
| optimization_rules | JSONB | '{}' | NOT NULL | |
| is_active | BOOLEAN | true | NOT NULL | |
| sort_order | INTEGER | 0 | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

---

### `user_prompt_templates`

**PRD:** PRD-05C | **Status:** CORRECTED — different column names

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| template_name | TEXT | — | NOT NULL | **PRD uses `template_name`, schema uses `title`.** |
| template_description | TEXT | — | YES | **Missing from schema.** |
| prompt_type | TEXT | 'general' | NOT NULL | **Missing from schema.** |
| prompt_category | TEXT | 'text' | NOT NULL | **Missing from schema.** |
| template_text | TEXT | — | NOT NULL | **PRD uses `template_text`, schema uses `template_content`.** |
| placeholder_map | JSONB | '{}' | NOT NULL | **Missing from schema.** |
| context_preset | TEXT | 'auto_detect' | NOT NULL | **Missing from schema.** |
| usage_count | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| last_used_at | TIMESTAMPTZ | — | YES | **Missing from schema.** |
| sort_order | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Schema fabricated:** `member_id`, `tags` — not in PRD-05C.

---

### `context_presets`

**PRD:** PRD-05C | **Status:** CORRECTED — different column names

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| preset_key | TEXT | — | NOT NULL | **PRD uses `preset_key`, schema uses `name`.** |
| display_name | TEXT | — | NOT NULL | **Missing from schema.** |
| is_enabled | BOOLEAN | true | NOT NULL | **Missing from schema.** |
| sort_order | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| context_categories | JSONB | '{}' | NOT NULL | **PRD uses `context_categories`, schema uses `preset_config`.** |
| is_system | BOOLEAN | true | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Schema fabricated:** `member_id` — PRD-05C scopes presets to family, not member.

---

### `ai_usage_tracking`

**PRD:** PRD-05C | **Status:** CORRECTED — different columns

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| usage_type | TEXT | — | NOT NULL | **PRD uses `usage_type`, schema uses `feature_key`.** |
| tokens_consumed | INTEGER | 0 | NOT NULL | **PRD uses `tokens_consumed`, schema uses `tokens_used`.** |
| optimization_method | TEXT | — | NOT NULL | **Missing from schema.** 'template' or 'ai' |
| billing_period | TEXT | — | NOT NULL | **Missing from schema.** 'YYYY-MM' format |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**NOTE:** PRD-31 Cross-PRD Impact Addendum says to remove the `ai_usage_tracking` table from PRD-05C and use the `ai_credits` ledger plus `ai_usage_log` (PRD-32) instead. This is a conflict between PRDs — PRD-31 (newer) wins.

---

## 5. Personal Growth — Guiding Stars & Best Intentions (PRD-06)

### `guiding_stars`

**PRD:** PRD-06 | **Status:** CORRECTED — major differences

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| owner_type | TEXT | 'member' | NOT NULL | **Missing from schema.** Enum: 'member', 'family' |
| owner_member_id | UUID | — | NULL | **PRD uses `owner_member_id`, schema uses `member_id`.** NULL when owner_type = 'family'. |
| entry_type | TEXT | — | NOT NULL | **Missing from schema.** Enum: 'value', 'declaration', 'scripture_quote', 'vision' |
| title | TEXT | — | NULL | **Missing from schema.** Optional short title |
| content | TEXT | — | NOT NULL | Full text of the entry |
| category | TEXT | — | NULL | Optional user-created grouping tag |
| source | TEXT | 'manual' | NOT NULL | **Different enum values from schema.** Enum: 'manual', 'lila_crafted', 'content_extraction', 'lifelantern', 'hatch_routed', 'review_route' |
| source_reference_id | UUID | — | NULL | **Missing from schema.** FK to source record |
| is_included_in_ai | BOOLEAN | true | NOT NULL | |
| is_private | BOOLEAN | false | NOT NULL | **Missing from schema.** For teen entries |
| is_shared_with_partner | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| sort_order | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| archived_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Schema fabricated columns NOT in PRD-06:** `description`, `embedding` — neither defined in PRD-06.

---

### `best_intentions`

**PRD:** PRD-06 | **Status:** CORRECTED — major differences

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| owner_member_id | UUID | — | NOT NULL | **PRD uses `owner_member_id`, schema uses `member_id`.** |
| title | TEXT | — | NOT NULL | **Missing from schema.** The intention statement |
| description | TEXT | — | NULL | **Missing from schema.** Additional context for AI |
| source | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'lila_crafted', 'hatch_routed', 'review_route' |
| source_reference_id | UUID | — | NULL | **Missing from schema.** |
| related_member_ids | UUID[] | — | NULL | **Missing from schema.** Members this intention relates to |
| tags | TEXT[] | — | NULL | Freeform tags for LiLa context filtering |
| tracker_style | TEXT | 'counter' | NOT NULL | **Missing from schema.** Enum: 'counter', 'bar_graph', 'streak' |
| is_active | BOOLEAN | true | NOT NULL | **Missing from schema.** Active = shows in widgets |
| is_included_in_ai | BOOLEAN | true | NOT NULL | |
| is_private | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| is_shared_with_partner | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| sort_order | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| archived_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Schema fabricated columns NOT in PRD-06:** `statement`, `celebration_count`, `iteration_count`, `embedding`, `last_reset_at` — none defined in PRD-06.

---

### `intention_iterations`

**PRD:** PRD-06 | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| intention_id | UUID | — | NOT NULL | FK best_intentions |
| family_id | UUID | — | NOT NULL | **Missing from schema.** Denormalized for RLS |
| member_id | UUID | — | NOT NULL | **Missing from schema.** Denormalized for RLS |
| recorded_at | TIMESTAMPTZ | now() | NOT NULL | **Missing from schema.** When the tap happened |
| day_date | DATE | CURRENT_DATE | NOT NULL | **Missing from schema.** Denormalized for daily aggregation |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**Schema fabricated columns NOT in PRD-06:** `victory_reference` — not defined in PRD-06. No UPDATE or DELETE allowed.

---

## 6. InnerWorkings (PRD-07)

### `self_knowledge`

**PRD:** PRD-07 | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| owner_member_id | UUID | — | NOT NULL | **PRD uses `owner_member_id`, schema uses `member_id`.** |
| category | TEXT | — | NOT NULL | **PRD enum: 'personality_type', 'trait_tendency', 'strength', 'growth_area', 'general'. Schema enum: 'personality', 'strengths', 'growth_areas', 'communication_style', 'how_i_work'.** |
| content | TEXT | — | NOT NULL | |
| source | TEXT | — | NULL | **PRD: freeform TEXT label. Schema treats as CHECK enum.** |
| source_type | TEXT | 'manual' | NOT NULL | **PRD enum: 'manual', 'file_upload', 'lila_discovery', 'bulk_add', 'content_extraction', 'log_routed'. Schema: 'manual', 'upload', 'lila_guided', 'bulk_add'.** |
| source_reference_id | UUID | — | NULL | **Missing from schema.** FK to source record |
| file_storage_path | TEXT | — | NULL | **Missing from schema.** Path for uploaded files |
| is_included_in_ai | BOOLEAN | true | NOT NULL | |
| is_private | BOOLEAN | false | NOT NULL | **Missing from schema.** For teen entries |
| is_shared_with_mom | BOOLEAN | false | NOT NULL | **PRD uses `is_shared_with_mom`, schema uses `share_with_mom`.** |
| is_shared_with_dad | BOOLEAN | false | NOT NULL | **PRD uses `is_shared_with_dad`, schema uses `share_with_dad`.** |
| sort_order | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| archived_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Schema fabricated:** `embedding` — not defined in PRD-07.

---

## 7. Journal & Smart Notepad (PRD-08)

### `journal_entries`

**PRD:** PRD-08 | **Status:** CORRECTED — significant differences

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| owner_member_id | UUID | — | NOT NULL | **PRD uses `owner_member_id`, schema uses `member_id`.** |
| entry_type | TEXT | 'journal_entry' | NOT NULL | **PRD enum (11 values): 'journal_entry', 'gratitude', 'reflection', 'quick_note', 'commonplace', 'kid_quips', 'meeting_notes', 'transcript', 'lila_conversation', 'brain_dump', 'custom'. Schema enum differs.** |
| text | TEXT | — | NOT NULL | **PRD uses `text`, schema uses `content`.** |
| life_area_tags | TEXT[] | '{}' | NOT NULL | **PRD uses `life_area_tags`, schema uses `tags`.** AI auto-applied, user-editable. |
| source | TEXT | 'manual_text' | NOT NULL | **PRD enum: 'manual_text', 'voice_transcription', 'lila_conversation', 'meeting_framework', 'hatch_routed', 'review_route', 'reflection_prompt', 'commonplace_prompt'. Schema uses different values.** |
| source_reference_id | UUID | null | NULL | FK to source record |
| is_included_in_ai | BOOLEAN | false | NOT NULL | **Default is FALSE in PRD-08.** |
| is_shared_with_mom | BOOLEAN | false | NOT NULL | **Missing from schema.** Per-entry sharing toggle |
| is_shared_with_dad | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| is_private | BOOLEAN | false | NOT NULL | **Missing from schema.** Per-entry privacy override |
| routed_to | TEXT[] | '{}' | NOT NULL | **Missing from schema.** Destinations this entry has been routed to |
| routed_reference_ids | JSONB | '{}' | NOT NULL | **Missing from schema.** Maps route types to record IDs |
| mood_tag | TEXT | null | NULL | **Missing from schema.** Optional mood indicator |
| audio_file_path | TEXT | null | NULL | **Missing from schema.** Supabase Storage path for voice entries |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |
| archived_at | TIMESTAMPTZ | null | NULL | **Missing from schema.** Soft delete |

**Later PRD additions:**
- PRD-18 adds: `tags TEXT[]` (general tags for rhythm system)
- PRD-29 adds: `related_plan_id UUID`

**Schema fabricated:** `visibility` TEXT enum, `embedding` — not defined in PRD-08.

---

### `journal_visibility_settings`

**PRD:** PRD-08 | **Status:** MISSING from schema entirely

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| parent_member_id | UUID | — | NOT NULL | FK family_members (parent configuring) |
| child_member_id | UUID | — | NOT NULL | FK family_members (child being configured) |
| entry_type | TEXT | — | NOT NULL | Which entry type this controls |
| is_visible_to_parent | BOOLEAN | false | NOT NULL | |
| is_included_in_ai_default | BOOLEAN | false | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

---

### `notepad_tabs`

**PRD:** PRD-08 | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| owner_member_id | UUID | — | NOT NULL | **PRD uses `owner_member_id`, schema uses `member_id`.** |
| title | TEXT | 'New Tab' | NOT NULL | |
| content | TEXT | '' | NOT NULL | |
| status | TEXT | 'active' | NOT NULL | **Missing from schema.** Enum: 'active', 'routed', 'archived' |
| routed_to | TEXT | null | YES | **Missing from schema.** |
| routed_reference_id | UUID | null | YES | **Missing from schema.** |
| source_type | TEXT | 'manual' | NOT NULL | **Missing from schema.** Enum: 'manual', 'voice', 'edit_in_notepad', 'lila_optimizer' |
| source_reference_id | UUID | null | YES | **Missing from schema.** |
| is_auto_named | BOOLEAN | true | NOT NULL | **Missing from schema.** |
| sort_order | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |
| archived_at | TIMESTAMPTZ | null | YES | **Missing from schema.** Soft delete |

---

### `notepad_extracted_items`

**PRD:** PRD-08 | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | **Missing from schema.** |
| tab_id | UUID | — | NOT NULL | FK notepad_tabs. CASCADE. |
| extracted_text | TEXT | — | NOT NULL | **PRD uses `extracted_text`, schema uses `extracted_content`.** |
| item_type | TEXT | — | NOT NULL | **Missing from schema.** Enum: 'action_item', 'reflection', 'revelation', 'value', 'victory', 'trackable', 'meeting_followup', 'list_item', 'general' |
| suggested_destination | TEXT | — | NOT NULL | **PRD uses `suggested_destination`, schema uses `routing_destination`.** |
| actual_destination | TEXT | null | YES | **Missing from schema.** |
| confidence | NUMERIC(3,2) | — | NOT NULL | **Missing from schema.** 0.00-1.00 |
| status | TEXT | 'pending' | NOT NULL | **PRD enum: 'pending', 'routed', 'skipped'. Schema: 'pending', 'routed', 'dismissed'.** |
| routed_reference_id | UUID | null | YES | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

---

## 8. Tasks, Routines & Opportunities (PRD-09A)

### `tasks`

**PRD:** PRD-09A | **Status:** CORRECTED — ~20 missing columns

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| created_by | UUID | — | NOT NULL | FK family_members |
| template_id | UUID | — | NULL | FK task_templates |
| task_type | TEXT | 'task' | NOT NULL | **PRD enum (7 values): 'task', 'routine', 'opportunity_repeatable', 'opportunity_claimable', 'opportunity_capped', 'sequential', 'habit'. Schema has only 4.** |
| title | TEXT | — | NOT NULL | |
| description | TEXT | — | NULL | |
| status | TEXT | 'pending' | NOT NULL | **PRD enum: 'pending', 'in_progress', 'completed', 'pending_approval', 'cancelled'. Schema: 'pending', 'in_progress', 'completed', 'cancelled', 'paused'.** |
| due_date | DATE | — | NULL | |
| recurrence_rule | TEXT | — | NULL | **Missing from schema.** Enum: 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'custom' |
| recurrence_details | JSONB | — | NULL | Complex patterns |
| life_area_tag | TEXT | — | NULL | |
| duration_estimate | TEXT | — | NULL | **Missing from schema.** |
| incomplete_action | TEXT | 'auto_reschedule' | NOT NULL | **Missing from schema.** Enum: 'fresh_reset', 'auto_reschedule', 'drop_after_date', 'reassign_until_complete', 'require_decision', 'escalate_to_parent' |
| require_approval | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| is_shared | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| parent_task_id | UUID | — | NULL | **Missing from schema.** For subtasks from Task Breaker |
| task_breaker_level | TEXT | — | NULL | **Missing from schema.** Enum: 'quick', 'detailed', 'granular' |
| sequential_collection_id | UUID | — | NULL | **Missing from schema.** FK sequential_collections |
| sequential_position | INTEGER | — | NULL | **Missing from schema.** |
| sequential_is_active | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| max_completions | INTEGER | — | NULL | **Missing from schema.** |
| claim_lock_duration | INTEGER | — | NULL | **Missing from schema.** |
| claim_lock_unit | TEXT | — | NULL | **Missing from schema.** |
| eisenhower_quadrant | TEXT | — | NULL | **Missing from schema.** |
| frog_rank | INTEGER | — | NULL | **Missing from schema.** |
| importance_level | TEXT | — | NULL | **Missing from schema.** |
| big_rock | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| ivy_lee_rank | INTEGER | — | NULL | **Missing from schema.** |
| abcde_category | TEXT | — | NULL | **Missing from schema.** |
| moscow_category | TEXT | — | NULL | **Missing from schema.** |
| impact_effort | TEXT | — | NULL | **Missing from schema.** |
| kanban_status | TEXT | 'to_do' | NULL | **Missing from schema.** |
| sort_order | INTEGER | 0 | NOT NULL | |
| image_url | TEXT | — | NULL | **Missing from schema.** |
| victory_flagged | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| completion_note | TEXT | — | NULL | **Missing from schema.** |
| completed_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** |
| source | TEXT | 'manual' | NOT NULL | **PRD has 11 values. Schema has fewer.** |
| source_reference_id | UUID | — | NULL | **Missing from schema.** |
| related_plan_id | UUID | — | NULL | FK plans (PRD-29) |
| related_intention_id | UUID | — | NULL | **Missing from schema.** FK best_intentions |
| focus_time_seconds | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| archived_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Later PRD additions:**
- PRD-24 adds: `points_override` INTEGER
- PRD-36 adds: `time_tracking_enabled` BOOLEAN, `time_threshold_minutes` INTEGER

**Schema columns NOT in PRD-09A:** `assignee_id`, `due_time`, `priority` (as defined in schema). PRD-09A uses `task_assignments` table for assignees, not a single `assignee_id` column.

---

### `task_completions`

**PRD:** PRD-09A | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| task_id | UUID | — | NOT NULL | FK tasks |
| family_member_id | UUID | — | NOT NULL | **PRD uses `family_member_id`, schema uses `member_id`.** |
| completed_at | TIMESTAMPTZ | now() | NOT NULL | |
| completion_note | TEXT | — | NULL | **Missing from schema.** |
| photo_url | TEXT | — | NULL | **Missing from schema.** |
| approved_by | UUID | — | NULL | FK family_members |
| approved_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** |
| rejected | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| rejection_note | TEXT | — | NULL | **Missing from schema.** |
| period_date | DATE | — | NOT NULL | **Missing from schema.** Which day this completion is for |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**Schema fabricated:** `evidence` JSONB, `approval_status` TEXT — not in PRD-09A. PRD-09A uses separate `rejected`/`rejection_note` booleans.

---

## 9. Victories (PRD-11)

### `victories`

**PRD:** PRD-11 | **Status:** CORRECTED — major differences

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| family_member_id | UUID | — | NOT NULL | **PRD uses `family_member_id`, schema uses `member_id`.** |
| description | TEXT | — | NOT NULL | **PRD uses `description`, schema uses `title`.** |
| celebration_text | TEXT | — | NULL | **Missing from schema.** AI-generated narrative |
| life_area_tag | TEXT | — | NULL | **PRD uses singular `life_area_tag`, schema uses plural `life_area_tags` TEXT[].** |
| custom_tags | TEXT[] | '{}' | NOT NULL | |
| source | TEXT | 'manual' | NOT NULL | **PRD enum (10 values): 'manual', 'task_completed', 'tracker_entry', 'intention_iteration', 'widget_milestone', 'lila_conversation', 'notepad_routed', 'reflection_routed', 'list_item_completed', 'routine_completion'. Schema differs.** |
| source_reference_id | UUID | — | NULL | |
| recorder_type | TEXT | 'myaim' | NOT NULL | **Missing from schema.** Enum: 'myaim', 'stewardship' |
| member_type | TEXT | — | NOT NULL | **Missing from schema.** Enum: 'adult', 'teen', 'guided', 'play' |
| importance | TEXT | 'standard' | NOT NULL | **Missing from schema.** Enum: 'small_win', 'standard', 'big_win', 'major_achievement' |
| guiding_star_id | UUID | — | NULL | **Missing from schema.** FK guiding_stars |
| best_intention_id | UUID | — | NULL | **Missing from schema.** FK best_intentions |
| is_moms_pick | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| moms_pick_note | TEXT | — | NULL | **Missing from schema.** |
| moms_pick_by | UUID | — | NULL | **Missing from schema.** FK family_members |
| celebration_voice | TEXT | — | NULL | **Missing from schema.** |
| photo_url | TEXT | — | NULL | **Missing from schema.** |
| archived_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

---

### `victory_celebrations`

**PRD:** PRD-11 | **Status:** CORRECTED — entirely different structure

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| family_member_id | UUID | — | NOT NULL | **PRD uses `family_member_id`, schema uses `member_id`.** |
| celebration_date | DATE | CURRENT_DATE | NOT NULL | **Missing from schema.** |
| mode | TEXT | 'individual' | NOT NULL | **Missing from schema.** Enum: 'individual', 'review', 'collection' |
| period | TEXT | — | NULL | **Missing from schema.** 'today', 'this_week', 'this_month', 'custom' |
| narrative | TEXT | — | NOT NULL | |
| victory_ids | UUID[] | — | NULL | **Missing from schema.** Array of victory IDs |
| victory_count | INTEGER | — | NOT NULL | **Missing from schema.** |
| celebration_voice | TEXT | — | NULL | **Missing from schema.** |
| context_sources | JSONB | '{}' | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**Schema fabricated:** `celebration_type` TEXT enum, `filters_applied` JSONB — not in PRD-11.

---

## 10. LifeLantern (PRD-12A)

### `life_lantern_areas`

**PRD:** PRD-12A | **Status:** CORRECTED — significantly different

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| family_member_id | UUID | — | NOT NULL | **PRD uses `family_member_id`, schema uses `member_id`.** |
| section_key | TEXT | — | NOT NULL | **PRD uses `section_key` with 13+ values. Schema uses `area_name` with only 6 values.** |
| assessment_content | TEXT | — | NULL | **PRD uses `assessment_content`, schema uses `current_state`.** |
| vision_content | TEXT | — | NULL | **PRD uses `vision_content`, schema uses `vision`.** |
| gap_summary | TEXT | — | NULL | **PRD uses `gap_summary`, schema uses `gap_analysis`.** |
| assessment_last_updated | TIMESTAMPTZ | — | NULL | **Missing from schema.** |
| vision_last_updated | TIMESTAMPTZ | — | NULL | **Missing from schema.** |
| is_included_in_ai | BOOLEAN | true | NOT NULL | **Missing from schema.** |
| display_order | INTEGER | — | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Unique constraint:** `(family_member_id, section_key)`

**PRD-12A section_key values (13):** 'physical_health', 'mental_health', 'emotional_health', 'marriage_partnership', 'parenting', 'family_relationships', 'friendships_social', 'faith_spiritual', 'career_professional', 'finances', 'home_environment', 'personal_growth', 'fun_recreation'

---

### `personal_vision_statements`

**PRD:** PRD-12A | **Status:** CORRECTED — entirely different structure

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| family_member_id | UUID | — | NOT NULL | **PRD uses `family_member_id`, schema uses `member_id`.** |
| is_active | BOOLEAN | false | NOT NULL | **Missing from schema.** Only one active per member |
| statement_text | TEXT | — | NOT NULL | **PRD uses `statement_text`, schema uses `content`.** |
| version_name | TEXT | — | NULL | **Missing from schema.** |
| generated_by | TEXT | 'lila' | NOT NULL | **Missing from schema.** Enum: 'lila', 'manual' |
| area_snapshot | JSONB | — | NULL | **Missing from schema.** Per-area vision snapshot |
| is_included_in_ai | BOOLEAN | true | NOT NULL | **Missing from schema.** |
| visibility | TEXT | 'private' | NOT NULL | **Missing from schema.** Enum: 'private', 'shared' |
| visible_to_members | UUID[] | — | NULL | **Missing from schema.** |
| generated_at | TIMESTAMPTZ | now() | NOT NULL | **Missing from schema.** |
| created_by | UUID | — | NOT NULL | **Missing from schema.** FK family_members |

**Schema fabricated:** `version` INTEGER — not in PRD-12A.

---

## 11. Family Vision Quest (PRD-12B)

### `vision_sections`

**PRD:** PRD-12B | **Status:** CORRECTED — different structure

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| section_key | TEXT | — | NOT NULL | **PRD uses `section_key` enum (11 values). Schema uses `topic` TEXT and fabricated `quest_id` FK.** |
| current_content | TEXT | — | NULL | **PRD uses `current_content`, schema uses `current_synthesis`.** |
| last_generated_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** |
| last_edited_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** |
| is_current | BOOLEAN | true | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | |

**PRD-12B section_key values:** 'home_feels', 'treat_each_other', 'standards_responsibilities', 'learning_growing', 'use_talents_helping', 'faith_spiritual', 'sabbath_sacred', 'fun_play_recreation', 'entertainment_media', 'traditions_culture', 'work_business_creating'

---

## 12. Archives & Context (PRD-13)

### `archive_folders`

**PRD:** PRD-13 | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| parent_folder_id | UUID | — | NULL | FK self-referencing |
| member_id | UUID | — | NULL | FK family_members. NULL for family-level folders. |
| folder_name | TEXT | — | NOT NULL | |
| folder_type | TEXT | 'custom' | NOT NULL | **PRD enum: 'member_root', 'family_overview', 'system_category', 'wishlist', 'custom'. Schema has different/missing values.** |
| icon | TEXT | — | NULL | **Missing from schema.** |
| color_hex | TEXT | — | NULL | **Missing from schema.** |
| description | TEXT | — | NULL | **Missing from schema.** |
| is_system | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| is_included_in_ai | BOOLEAN | true | NOT NULL | **Missing from schema.** Category-level toggle |
| sort_order | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

---

### `archive_context_items`

**PRD:** PRD-13 | **Status:** CORRECTED — very different structure

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| folder_id | UUID | — | NOT NULL | FK archive_folders |
| member_id | UUID | — | NULL | **Missing from schema.** Which member this item is about |
| context_field | TEXT | — | NOT NULL | Short label/title |
| context_value | TEXT | — | NOT NULL | Actual content |
| context_type | TEXT | 'general' | NOT NULL | **Missing from schema.** CHECK: 'preference', 'schedule', 'personality', 'interest', 'academic', 'medical', 'wishlist_item', 'family_personality', 'family_rhythm', 'family_focus', 'faith_context', 'meeting_note', 'general' |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Item-level toggle |
| is_privacy_filtered | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| source | TEXT | 'manual' | NOT NULL | **Missing from schema.** CHECK: 'manual', 'lila_detected', 'review_route', 'list_shared' |
| source_conversation_id | UUID | — | NULL | **Missing from schema.** FK lila_conversations |
| source_reference_id | UUID | — | NULL | **Missing from schema.** General FK |
| added_by | UUID | — | NOT NULL | **Missing from schema.** FK family_members |
| usage_count | INTEGER | 0 | NOT NULL | **Missing from schema.** |
| last_used_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** |
| link_url | TEXT | — | NULL | **Missing from schema.** |
| price_range | TEXT | — | NULL | **Missing from schema.** |
| archived_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Schema fabricated columns NOT in PRD-13:** `source_table`, `source_id`, `visibility` enum, `is_pinned`, `is_private_note`, `is_shared_with_spouse`, `share_with_family`, `document_id`, `use_alias_for_external`, `embedding` — none of these are defined in PRD-13.

---

### `faith_preferences`

**PRD:** PRD-13 | **Status:** CORRECTED — different approach flags

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families. UNIQUE. |
| faith_tradition | TEXT | — | NULL | **PRD uses `faith_tradition`, schema uses `tradition`.** |
| denomination | TEXT | — | NULL | |
| observances | TEXT[] | '{}' | NOT NULL | |
| sacred_texts | TEXT[] | '{}' | NOT NULL | |
| prioritize_tradition | BOOLEAN | false | NOT NULL | **PRD uses individual booleans, not `response_approach` enum.** |
| include_comparative | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| include_secular | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| educational_only | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| use_our_terminology | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| respect_but_dont_assume | BOOLEAN | true | NOT NULL | **Missing from schema.** |
| avoid_conflicting | BOOLEAN | true | NOT NULL | **Missing from schema.** |
| acknowledge_diversity | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| minority_views | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| diversity_notes | TEXT | — | NULL | **Missing from schema.** |
| special_instructions | TEXT | — | NULL | |
| relevance_setting | TEXT | 'automatic' | NOT NULL | CHECK: 'automatic', 'always', 'manual' |
| is_included_in_ai | BOOLEAN | true | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Schema fabricated:** `response_approach` TEXT enum, `tone_settings` JSONB — these consolidate the individual booleans from PRD-13, but PRD-13 defines them individually.

---

## 13. Lists (PRD-09B)

### `lists`

**PRD:** PRD-09B | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| created_by | UUID | — | NOT NULL | **PRD uses `created_by`, schema uses `owner_id`.** |
| template_id | UUID | — | NULL | **Missing from schema.** FK list_templates |
| list_name | TEXT | — | NOT NULL | **PRD uses `list_name`, schema uses `title`.** |
| list_type | TEXT | — | NOT NULL | **PRD enum: 'shopping', 'wishlist', 'expenses', 'packing', 'todo', 'randomizer', 'custom'. Schema enum differs.** |
| description | TEXT | — | NULL | **Missing from schema.** |
| is_shared | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| victory_on_complete | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| is_included_in_ai | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| archived_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Later PRD additions:**
- PRD-24 adds: `reveal_type` TEXT, `max_respins_per_period` INTEGER, `respin_period` TEXT

---

### `list_items`

**PRD:** PRD-09B | **Status:** CORRECTED — many missing columns

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| list_id | UUID | — | NOT NULL | FK lists |
| item_name | TEXT | — | NOT NULL | **PRD uses `item_name`, schema uses `content`.** |
| checked | BOOLEAN | false | NOT NULL | |
| checked_by | UUID | — | NULL | **Missing from schema.** FK family_members |
| checked_at | TIMESTAMPTZ | — | NULL | **Missing from schema.** |
| section_name | TEXT | — | NULL | |
| notes | TEXT | — | NULL | |
| url | TEXT | — | NULL | **Missing from schema.** For wishlists |
| quantity | DECIMAL | — | NULL | **Missing from schema.** |
| quantity_unit | TEXT | — | NULL | **Missing from schema.** |
| price | DECIMAL | — | NULL | **Missing from schema.** |
| currency | TEXT | 'USD' | NOT NULL | **Missing from schema.** |
| category | TEXT | — | NULL | **Missing from schema.** For expenses |
| item_date | DATE | — | NULL | **Missing from schema.** |
| priority | TEXT | — | NULL | **Missing from schema.** |
| gift_for | TEXT | — | NULL | **Missing from schema.** |
| promoted_to_task | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| promoted_task_id | UUID | — | NULL | **Missing from schema.** FK tasks |
| is_repeatable | BOOLEAN | true | NOT NULL | **Missing from schema.** For Randomizer lists |
| is_available | BOOLEAN | true | NOT NULL | **Missing from schema.** |
| parent_item_id | UUID | — | NULL | **Missing from schema.** One level of nesting |
| sort_order | INTEGER | 0 | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Later PRD additions:**
- PRD-24 adds: `availability_mode`, `max_instances`, `completed_instances`, `recurrence_config`, `next_available_at`

---

## 14. Studio Queue (PRD-17 — Authoritative)

### `studio_queue`

**PRD:** PRD-17 (authoritative) | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| owner_id | UUID | — | NOT NULL | FK family_members |
| destination | TEXT | 'task' | NOT NULL | CHECK: 'task', 'list', 'widget', 'tracker' |
| content | TEXT | — | NOT NULL | Raw content/title |
| content_details | JSONB | '{}' | NOT NULL | Structured data from source |
| source | TEXT | — | NOT NULL | CHECK: 'notepad_routed', 'review_route', 'lila_conversation', 'meeting_action', 'goal_decomposition', 'project_planner', 'member_request', 'list_promoted' |
| source_reference_id | UUID | — | NULL | FK to source record |
| structure_flag | TEXT | — | NULL | From PRD-08: 'single', 'individual', 'ai_sort', 'sequential', 'chronological' |
| batch_id | UUID | — | NULL | Groups items from same source action |
| requester_id | UUID | — | NULL | FK family_members. For member_request source. |
| requester_note | TEXT | — | NULL | |
| processed_at | TIMESTAMPTZ | — | NULL | NULL = still in queue |
| dismissed_at | TIMESTAMPTZ | — | NULL | |
| dismiss_note | TEXT | — | NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**Later PRD additions:**
- PRD-17B adds: `mindsweep_confidence` TEXT CHECK: 'high', 'medium', 'low', `mindsweep_event_id` UUID FK mindsweep_events

---

## 15. Activity Log (PRD-09A)

### `activity_log_entries`

**PRD:** PRD-09A | **Status:** CORRECTED

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| family_member_id | UUID | — | NOT NULL | **PRD uses `family_member_id`, schema uses `member_id`.** |
| event_type | TEXT | — | NOT NULL | |
| display_text | TEXT | — | NOT NULL | **Missing from schema.** |
| description | TEXT | — | NULL | **Missing from schema.** |
| photo_url | TEXT | — | NULL | **Missing from schema.** |
| source | TEXT | — | NOT NULL | **Missing from schema.** |
| source_reference_id | UUID | — | NULL | **Missing from schema (schema uses `source_id`).** |
| shift_session_id | UUID | — | NULL | **Missing from schema.** FK shift_sessions |
| hidden | BOOLEAN | false | NOT NULL | **Missing from schema.** |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**Schema fabricated:** `source_table` TEXT, `metadata` JSONB — not defined in PRD-09A for this table.

---

## Tables Not Yet Fully Audited (Reference Only)

The following domains have tables that also need correction. The corrections follow the same patterns: PRD column names differ from schema, columns are missing, or schema fabricated columns not in the PRD.

### Communication (PRD-15, PRD-16, PRD-17B)
- `conversation_spaces`, `conversation_space_members`, `conversation_threads`, `messages`, `message_read_status`, `messaging_settings`, `member_messaging_permissions`, `message_coaching_settings`, `family_requests`, `notifications`, `notification_preferences`, `out_of_nest_members` — all defined in PRD-15
- `meetings`, `meeting_participants`, `meeting_schedules`, `meeting_templates`, `meeting_template_sections`, `meeting_agenda_items` — all defined in PRD-16
- `mindsweep_settings`, `mindsweep_holding`, `mindsweep_allowed_senders`, `mindsweep_events`, `mindsweep_approval_patterns` — all defined in PRD-17B

### Daily Life (PRD-18, PRD-19, PRD-20)
- `rhythm_configs`, `rhythm_completions`, `reflection_prompts`, `reflection_responses` — PRD-18
- `member_documents`, `private_notes`, `relationship_notes`, `guided_interview_progress`, `monthly_data_aggregations`, `generated_reports` — PRD-19
- `safe_harbor_orientation_completions`, `safe_harbor_literacy_completions`, `safe_harbor_consent_records` — PRD-20

### Dashboards (PRD-10, PRD-14 family)
- `dashboard_widgets`, `dashboard_widget_folders`, `widget_data_points`, `dashboard_configs`, `widget_templates`, `coloring_image_library`, `color_reveal_progress`, `coloring_gallery` — PRD-10
- `calendar_events`, `event_attendees`, `event_categories`, `calendar_settings` — PRD-14B
- `family_overview_configs` — PRD-14C
- `family_hub_configs`, `countdowns` — PRD-14D (also adds `family_best_intentions`, `family_intention_iterations`, `slideshow_slides` — MISSING from schema)

### AI Vault (PRD-21 through PRD-23)
- All vault tables, bookshelf tables — PRD-21A, PRD-21C, PRD-23
- **Founder Ruling (2026-03-23):** `bookshelf_frameworks` table ELIMINATED. `bookshelf_principles` RENAMED to `bookshelf_insights`. Tab 2 is now "Insights" (was "Principles & Frameworks"). `bookshelf_insights.principle_type` CHECK updated to: 'principle', 'framework', 'mental_model', 'process', 'strategy', 'concept', 'system', 'tool_set'. Flat structure (no parent-child, no framework_id FK).

### Gamification (PRD-24 family)
- PRD-24A Game Modes Addendum adds 4 tables: `boss_quests`, `bingo_cards`, `evolution_creatures`, `passport_books` — all MISSING from schema

### Subscription (PRD-31)
- `subscription_tiers`, `family_subscriptions`, `feature_key_registry`, `feature_access_v2`, `member_feature_toggles`, `ai_credits`, `credit_packs`, `tier_sampling_costs`, `tier_sample_sessions`, `onboarding_milestones`, `subscription_cancellations` — all defined in PRD-31
- PRD-31 supersedes PRD-01's `subscription_tiers`, `family_subscriptions`, and `feature_access` definitions

### Admin & Analytics (PRD-32)
- `feedback_submissions`, `known_issues`, `reported_threats`, `admin_notes`, `ai_usage_log`, `platform_usage_log` — PRD-32
- `feature_demand_responses` — PRD-32A

### Platform Complete (PRD-27 through PRD-38)
- All remaining tables in these PRDs need individual column-level auditing against the schema

---

## Key Systematic Differences

The following patterns of error recur throughout `database_schema.md`:

### 1. Column Name Mismatches (PRD name -> Schema name)
| PRD Column | Schema Column | Affected Tables |
|-----------|---------------|----------------|
| `auth_user_id` | `user_id` | `family_members` |
| `owner_member_id` | `member_id` | `guiding_stars`, `best_intentions`, `self_knowledge`, `journal_entries`, `notepad_tabs` |
| `family_member_id` | `member_id` | `task_completions`, `victories`, `victory_celebrations`, `life_lantern_areas`, `activity_log_entries` |
| `auth_method` | `login_method` | `family_members` |
| `visual_password_config` | `visual_password` | `family_members` |
| `granted_by`/`granted_to` | `granting_member_id` | `member_permissions` |
| `is_enabled` | `is_granted` | `lila_tool_permissions` |
| `template_name` | `title` | `task_templates`, `user_prompt_templates` |
| `list_name` | `title` | `lists` |
| `item_name` | `content` | `list_items` |
| `section_key` | `area_name`/`topic` | `life_lantern_areas`, `vision_sections` |
| `statement_text` | `content` | `personal_vision_statements`, `family_vision_statements` |
| `selected_voice` | `voice_key` | `victory_voice_preferences` |

### 2. Missing Columns (present in PRDs, absent from schema)
- Soft delete via `archived_at`: present on most PRD tables, often missing from schema
- `is_private`: present on guiding_stars, best_intentions, self_knowledge, journal_entries — missing from schema
- `is_shared_with_partner`/`is_shared_with_mom`/`is_shared_with_dad`: sharing toggles present in PRDs, missing or renamed in schema
- `source_reference_id`: traceability FK present in most PRDs, inconsistently present in schema
- Methodology columns on `tasks`: ~15 columns for Eisenhower, Frog, Ivy Lee, etc. — all missing from schema
- `dashboard_mode` on `family_members`: the shell selector column — missing from schema

### 3. Fabricated Columns (present in schema, absent from PRDs)
- `embedding vector(1536)`: added to many tables in schema but NOT defined in most PRDs
- `visibility` enum: added to tables where PRDs use individual sharing booleans
- `evidence` JSONB: on `task_completions` — PRD uses individual `completion_note`, `photo_url`, `rejected` columns
- Various `_id` pattern changes where schema consolidates or renames

### 4. Missing Tables (defined in PRDs, absent from schema)
- `view_as_permissions` (PRD-02) — schema has `view_as_sessions` with different purpose
- `mom_self_restrictions` (PRD-02)
- `special_adult_permissions` (PRD-02)
- `shift_sessions` (PRD-02)
- `teen_sharing_overrides` (PRD-02)
- `permission_presets` (PRD-02)
- `optimization_patterns` (PRD-05C)
- `journal_visibility_settings` (PRD-08)
- `task_queue` (PRD-09A) — superseded by `studio_queue` (PRD-17)
- `family_best_intentions` (PRD-14D)
- `family_intention_iterations` (PRD-14D)
- `slideshow_slides` (PRD-14D)
- `boss_quests` (PRD-24A Game Modes Addendum)
- `bingo_cards` (PRD-24A Game Modes Addendum)
- `evolution_creatures` (PRD-24A Game Modes Addendum)
- `passport_books` (PRD-24A Game Modes Addendum)
- `bookshelf_frameworks` (PRD-23) — **ELIMINATED by Founder Ruling 2026-03-23.** `bookshelf_principles` renamed to `bookshelf_insights` with expanded content_type enum and flat structure.
- `bookshelf_shares` (PRD-23)

### 5. Enum Value Differences
- `family_members.role`: PRD-01 has 4 values ('primary_parent', 'additional_adult', 'special_adult', 'member'). Schema has 6 values. The UI shell is determined by `dashboard_mode`, not `role`.
- `tasks.task_type`: PRD-09A has 7 values. Schema has 4.
- `tasks.status`: PRD-09A has 5 values including 'pending_approval'. Schema has different 5.
- `self_knowledge.category`: PRD-07 has 5 values. Schema has different 5.
- `journal_entries.entry_type`: PRD-08 has 11 values. Schema has different values.

---

## Appendix: PRD Supersession Chain

When two PRDs define the same table, the later/authoritative PRD wins:

| Table | Original PRD | Authoritative PRD | Notes |
|-------|-------------|-------------------|-------|
| `studio_queue` | PRD-09B | **PRD-17** | PRD-17 is the authoritative definition |
| `feature_access` | PRD-01 | **PRD-31** (`feature_access_v2`) | PRD-31 replaces with new structure |
| `subscription_tiers` | PRD-01 | **PRD-31** | PRD-31 adds columns |
| `family_subscriptions` | PRD-01 | **PRD-31** | PRD-31 adds Stripe columns |
| `shift_schedules` | PRD-02 | **PRD-35** (`access_schedules`) | PRD-35 generalizes with RRULE |
| `member_self_insights` | PRD-05 | **PRD-07** (`self_knowledge`) | PRD-07 supersedes entirely |
| `family_messages` | PRD-08 | **PRD-15** (`messages`) | PRD-15 messaging system supersedes |
| `task_queue` | PRD-09A | **PRD-17** (`studio_queue`) | Renamed and restructured |
| `ai_usage_tracking` | PRD-05C | **PRD-31/PRD-32** | PRD-31 addendum removes this table |
