# Live Database Schema — MyAIM Central v2

> Auto-generated from live Supabase on 2026-05-02
> Script: `node scripts/full-schema-dump.cjs`
>
> **Two-pass capture:**
> 1. **API-exposed tables** — columns from the PostgREST OpenAPI spec, row counts via `supabase-js` HEAD queries.
> 2. **Migration-only tables** — tables that exist in the database but are not in the PostgREST schema cache. Columns and row counts come from direct SQL against `information_schema` + dynamic `COUNT(*)` via `supabase db query --linked`.
>
> Both `public` and `platform_intelligence` schemas are captured in pass 2.

---

## Auth & Family (PRD-01, PRD-02)

### `families` — 3 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `primary_parent_id` |
| 3 | `family_name` |
| 4 | `family_login_name` |
| 5 | `family_login_name_lower` |
| 6 | `is_founding_family` |
| 7 | `founding_family_rates` |
| 8 | `founding_onboarding_complete` |
| 9 | `founding_onboarding_grace_deadline` |
| 10 | `founding_family_lost_at` |
| 11 | `timezone` |
| 12 | `tablet_hub_config` |
| 13 | `tablet_hub_timeout` |
| 14 | `sweep_email_address` |
| 15 | `sweep_email_enabled` |
| 16 | `analytics_opt_in` |
| 17 | `last_data_export_at` |
| 18 | `created_at` |
| 19 | `updated_at` |
| 20 | `setup_completed` |
| 21 | `hub_config` |
| 22 | `family_photo_url` |

### `family_members` — 18 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `user_id` |
| 4 | `display_name` |
| 5 | `role` |
| 6 | `avatar_url` |
| 7 | `pin_hash` |
| 8 | `visual_password_config` |
| 9 | `auth_method` |
| 10 | `member_color` |
| 11 | `calendar_color` |
| 12 | `gamification_points` |
| 13 | `gamification_level` |
| 14 | `current_streak` |
| 15 | `longest_streak` |
| 16 | `last_task_completion_date` |
| 17 | `is_active` |
| 18 | `created_at` |
| 19 | `updated_at` |
| 20 | `dashboard_mode` |
| 21 | `nicknames` |
| 22 | `relationship` |
| 23 | `custom_role` |
| 24 | `age` |
| 25 | `date_of_birth` |
| 26 | `in_household` |
| 27 | `dashboard_enabled` |
| 28 | `out_of_nest` |
| 29 | `invite_status` |
| 30 | `invite_token` |
| 31 | `invite_expires_at` |
| 32 | `onboarding_completed` |
| 33 | `assigned_color` |
| 34 | `theme_preferences` |
| 35 | `layout_preferences` |
| 36 | `assigned_color_token` |
| 37 | `game_piece_shape` |
| 38 | `streak_grace_used_today` |
| 39 | `preferences` |
| 40 | `pin_failed_attempts` |
| 41 | `pin_locked_until` |
| 42 | `emergency_locked` |

### `special_adult_assignments` — 2 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `special_adult_id` |
| 4 | `child_id` |
| 5 | `created_at` |

### `member_permissions` — 168 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `granting_member_id` |
| 4 | `target_member_id` |
| 5 | `permission_key` |
| 6 | `permission_value` |
| 7 | `created_at` |
| 8 | `updated_at` |
| 9 | `granted_to` |
| 10 | `access_level` |

### `staff_permissions` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `user_id` |
| 3 | `permission_type` |
| 4 | `granted_by` |
| 5 | `created_at` |

### `view_as_sessions` — 310 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `viewer_id` |
| 4 | `viewing_as_id` |
| 5 | `started_at` |
| 6 | `ended_at` |

### `view_as_feature_exclusions` — 204 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `session_id` |
| 3 | `feature_key` |
| 4 | `created_at` |

### `permission_presets` — 6 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `created_by` |
| 4 | `preset_name` |
| 5 | `target_role` |
| 6 | `permissions_config` |
| 7 | `is_system_preset` |
| 8 | `created_at` |
| 9 | `updated_at` |

### `access_schedules` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `schedule_type` |
| 5 | `recurrence_details` |
| 6 | `is_active` |
| 7 | `created_at` |
| 8 | `updated_at` |
| 9 | `schedule_name` |
| 10 | `start_time` |
| 11 | `end_time` |

### `permission_level_profiles` — 164 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `role_group` |
| 3 | `level` |
| 4 | `feature_key` |
| 5 | `feature_enabled` |
| 6 | `default_permission_level` |
| 7 | `created_at` |

---

## Subscription & Monetization (PRD-31)

### `subscription_tiers` — 4 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `name` |
| 3 | `slug` |
| 4 | `price_monthly` |
| 5 | `price_yearly` |
| 6 | `founding_discount` |
| 7 | `monthly_ai_allotment` |
| 8 | `features_summary` |
| 9 | `sort_order` |
| 10 | `is_active` |
| 11 | `created_at` |
| 12 | `updated_at` |

### `family_subscriptions` — 2 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `tier_id` |
| 4 | `status` |
| 5 | `stripe_customer_id` |
| 6 | `stripe_subscription_id` |
| 7 | `pending_tier_id` |
| 8 | `current_period_start` |
| 9 | `current_period_end` |
| 10 | `cancelled_at` |
| 11 | `past_due_since` |
| 12 | `created_at` |
| 13 | `updated_at` |

### `feature_key_registry` — 200 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `feature_key` |
| 3 | `display_name` |
| 4 | `description` |
| 5 | `prd_source` |
| 6 | `created_at` |

### `feature_access_v2` — 350 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `feature_key` |
| 3 | `role_group` |
| 4 | `minimum_tier_id` |
| 5 | `is_enabled` |
| 6 | `created_at` |
| 7 | `updated_at` |

### `member_feature_toggles` — 24 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `feature_key` |
| 5 | `is_disabled` |
| 6 | `disabled_by` |
| 7 | `created_at` |
| 8 | `enabled` |
| 9 | `blocked_by_tier` |
| 10 | `applied_profile_level` |
| 11 | `updated_at` |

### `ai_credits`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `credit_packs`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `tier_sampling_costs`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `tier_sample_sessions`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `onboarding_milestones`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `subscription_cancellations`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

---

## LiLa AI System (PRD-05)

### `lila_conversations` — 74 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `guided_mode` |
| 5 | `title` |
| 6 | `container_type` |
| 7 | `page_context` |
| 8 | `is_safe_harbor` |
| 9 | `vault_item_id` |
| 10 | `safety_scanned` |
| 11 | `status` |
| 12 | `created_at` |
| 13 | `updated_at` |
| 14 | `mode` |
| 15 | `guided_subtype` |
| 16 | `guided_mode_reference_id` |
| 17 | `model_used` |
| 18 | `context_snapshot` |
| 19 | `message_count` |
| 20 | `token_usage` |

### `lila_messages` — 156 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `conversation_id` |
| 3 | `role` |
| 4 | `content` |
| 5 | `metadata` |
| 6 | `safety_scanned` |
| 7 | `created_at` |
| 8 | `token_count` |

### `lila_guided_modes` — 43 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `mode_key` |
| 3 | `display_name` |
| 4 | `model_tier` |
| 5 | `context_sources` |
| 6 | `person_selector` |
| 7 | `available_to_roles` |
| 8 | `requires_feature_key` |
| 9 | `created_at` |
| 10 | `parent_mode` |
| 11 | `avatar_key` |
| 12 | `opening_messages` |
| 13 | `system_prompt_key` |
| 14 | `sort_order` |
| 15 | `is_active` |
| 16 | `container_preference` |

### `lila_tool_permissions` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `mode_key` |
| 5 | `is_enabled` |
| 6 | `created_at` |
| 7 | `updated_at` |
| 8 | `context_person_ids` |
| 9 | `include_family_context` |
| 10 | `source` |
| 11 | `vault_item_id` |
| 12 | `saved_prompt_id` |

### `lila_member_preferences` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `tone` |
| 5 | `response_length` |
| 6 | `history_retention` |
| 7 | `created_at` |
| 8 | `updated_at` |

### `optimizer_outputs`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `user_prompt_templates`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `context_presets`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `ai_usage_tracking` — 622 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `feature_key` |
| 5 | `model` |
| 6 | `tokens_used` |
| 7 | `estimated_cost` |
| 8 | `created_at` |

---

## Personal Growth (PRD-06 to PRD-08)

### `guiding_stars` — 27 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `content` |
| 5 | `category` |
| 6 | `description` |
| 7 | `source` |
| 8 | `is_included_in_ai` |
| 9 | `embedding` |
| 10 | `created_at` |
| 11 | `updated_at` |
| 12 | `owner_type` |
| 13 | `entry_type` |
| 14 | `title` |
| 15 | `source_reference_id` |
| 16 | `is_private` |
| 17 | `is_shared_with_partner` |
| 18 | `sort_order` |
| 19 | `archived_at` |

### `best_intentions` — 11 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `statement` |
| 5 | `tags` |
| 6 | `source` |
| 7 | `celebration_count` |
| 8 | `iteration_count` |
| 9 | `is_included_in_ai` |
| 10 | `embedding` |
| 11 | `last_reset_at` |
| 12 | `created_at` |
| 13 | `updated_at` |
| 14 | `description` |
| 15 | `source_reference_id` |
| 16 | `related_member_ids` |
| 17 | `tracker_style` |
| 18 | `is_active` |
| 19 | `is_private` |
| 20 | `is_shared_with_partner` |
| 21 | `sort_order` |
| 22 | `archived_at` |
| 23 | `color` |

### `intention_iterations` — 31 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `intention_id` |
| 3 | `victory_reference` |
| 4 | `created_at` |
| 5 | `family_id` |
| 6 | `member_id` |
| 7 | `recorded_at` |
| 8 | `day_date` |
| 9 | `acted_by` |

### `self_knowledge` — 141 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `category` |
| 5 | `content` |
| 6 | `source_type` |
| 7 | `share_with_mom` |
| 8 | `share_with_dad` |
| 9 | `is_included_in_ai` |
| 10 | `embedding` |
| 11 | `created_at` |
| 12 | `updated_at` |
| 13 | `source` |
| 14 | `source_reference_id` |
| 15 | `file_storage_path` |
| 16 | `is_private` |
| 17 | `sort_order` |
| 18 | `archived_at` |

### `journal_entries` — 58 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `entry_type` |
| 5 | `content` |
| 6 | `tags` |
| 7 | `visibility` |
| 8 | `related_plan_id` |
| 9 | `is_included_in_ai` |
| 10 | `embedding` |
| 11 | `created_at` |
| 12 | `updated_at` |
| 13 | `life_area_tags` |
| 14 | `source` |
| 15 | `source_reference_id` |
| 16 | `is_shared_with_mom` |
| 17 | `is_shared_with_dad` |
| 18 | `is_private` |
| 19 | `routed_to` |
| 20 | `routed_reference_ids` |
| 21 | `mood_tag` |
| 22 | `audio_file_path` |
| 23 | `archived_at` |
| 24 | `entry_category` |

### `notepad_tabs` — 21 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `title` |
| 5 | `content` |
| 6 | `created_at` |
| 7 | `updated_at` |
| 8 | `status` |
| 9 | `routed_to` |
| 10 | `routed_reference_id` |
| 11 | `source_type` |
| 12 | `source_reference_id` |
| 13 | `is_auto_named` |
| 14 | `sort_order` |
| 15 | `archived_at` |

### `notepad_extracted_items` — 7 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `tab_id` |
| 3 | `routing_destination` |
| 4 | `extracted_content` |
| 5 | `status` |
| 6 | `created_at` |
| 7 | `family_id` |
| 8 | `item_type` |
| 9 | `confidence` |
| 10 | `routed_reference_id` |
| 11 | `suggested_destination` |
| 12 | `actual_destination` |

### `notepad_routing_stats` — 2 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `destination` |
| 5 | `count` |
| 6 | `last_routed_at` |

---

## Tasks & Studio (PRD-09A, PRD-09B, PRD-17)

### `task_templates` — 21 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `created_by` |
| 4 | `title` |
| 5 | `description` |
| 6 | `task_type` |
| 7 | `config` |
| 8 | `is_system` |
| 9 | `created_at` |
| 10 | `updated_at` |
| 11 | `template_name` |
| 12 | `template_type` |
| 13 | `duration_estimate` |
| 14 | `life_area_tag` |
| 15 | `default_reward_type` |
| 16 | `default_reward_amount` |
| 17 | `default_bonus_threshold` |
| 18 | `require_approval` |
| 19 | `incomplete_action` |
| 20 | `image_url` |
| 21 | `max_completions` |
| 22 | `claim_lock_duration` |
| 23 | `claim_lock_unit` |
| 24 | `sequential_active_count` |
| 25 | `sequential_promotion` |
| 26 | `display_mode` |
| 27 | `usage_count` |
| 28 | `last_deployed_at` |
| 29 | `archived_at` |
| 30 | `is_system_template` |
| 31 | `is_example` |
| 32 | `example_use_cases` |
| 33 | `category_label` |
| 34 | `guided_form_subtype` |
| 35 | `guided_form_sections` |
| 36 | `counts_for_allowance` |
| 37 | `counts_for_homework` |
| 38 | `counts_for_gamification` |
| 39 | `allowance_points` |
| 40 | `homework_subject_ids` |
| 41 | `is_extra_credit` |
| 42 | `life_area_tags` |

### `task_template_sections` — 52 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `template_id` |
| 3 | `title` |
| 4 | `sort_order` |
| 5 | `created_at` |
| 6 | `section_name` |
| 7 | `frequency_rule` |
| 8 | `frequency_days` |
| 9 | `show_until_complete` |
| 10 | `updated_at` |

### `task_template_steps` — 228 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `section_id` |
| 3 | `title` |
| 4 | `sort_order` |
| 5 | `created_at` |
| 6 | `step_name` |
| 7 | `step_notes` |
| 8 | `instance_count` |
| 9 | `require_photo` |
| 10 | `updated_at` |
| 11 | `step_type` |
| 12 | `linked_source_id` |
| 13 | `linked_source_type` |
| 14 | `display_name_override` |

### `tasks` — 94 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `created_by` |
| 4 | `assignee_id` |
| 5 | `template_id` |
| 6 | `title` |
| 7 | `description` |
| 8 | `task_type` |
| 9 | `status` |
| 10 | `priority` |
| 11 | `due_date` |
| 12 | `due_time` |
| 13 | `life_area_tag` |
| 14 | `points_override` |
| 15 | `related_plan_id` |
| 16 | `source` |
| 17 | `recurrence_details` |
| 18 | `created_at` |
| 19 | `updated_at` |
| 20 | `recurrence_rule` |
| 21 | `duration_estimate` |
| 22 | `incomplete_action` |
| 23 | `require_approval` |
| 24 | `is_shared` |
| 25 | `parent_task_id` |
| 26 | `task_breaker_level` |
| 27 | `sequential_collection_id` |
| 28 | `sequential_position` |
| 29 | `sequential_is_active` |
| 30 | `max_completions` |
| 31 | `claim_lock_duration` |
| 32 | `claim_lock_unit` |
| 33 | `eisenhower_quadrant` |
| 34 | `frog_rank` |
| 35 | `importance_level` |
| 36 | `big_rock` |
| 37 | `ivy_lee_rank` |
| 38 | `abcde_category` |
| 39 | `moscow_category` |
| 40 | `impact_effort` |
| 41 | `kanban_status` |
| 42 | `sort_order` |
| 43 | `image_url` |
| 44 | `victory_flagged` |
| 45 | `completion_note` |
| 46 | `completed_at` |
| 47 | `source_reference_id` |
| 48 | `related_intention_id` |
| 49 | `focus_time_seconds` |
| 50 | `archived_at` |
| 51 | `time_tracking_enabled` |
| 52 | `time_threshold_minutes` |
| 53 | `linked_list_id` |
| 54 | `list_delivery_mode` |
| 55 | `advancement_mode` |
| 56 | `practice_target` |
| 57 | `practice_count` |
| 58 | `mastery_status` |
| 59 | `mastery_submitted_at` |
| 60 | `mastery_approved_by` |
| 61 | `mastery_approved_at` |
| 62 | `require_mastery_approval` |
| 63 | `require_mastery_evidence` |
| 64 | `track_duration` |
| 65 | `resource_url` |
| 66 | `carry_forward_override` |
| 67 | `icon_asset_key` |
| 68 | `icon_variant` |
| 69 | `task_segment_id` |
| 70 | `counts_for_allowance` |
| 71 | `counts_for_homework` |
| 72 | `counts_for_gamification` |
| 73 | `allowance_points` |
| 74 | `homework_subject_ids` |
| 75 | `is_extra_credit` |
| 76 | `track_progress` |
| 77 | `in_progress_member_id` |
| 78 | `instantiation_mode` |
| 79 | `collaboration_mode` |
| 80 | `life_area_tags` |

### `task_assignments` — 35 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `task_id` |
| 3 | `member_id` |
| 4 | `assigned_by` |
| 5 | `created_at` |
| 6 | `family_member_id` |
| 7 | `assigned_at` |
| 8 | `start_date` |
| 9 | `end_date` |
| 10 | `rotation_position` |
| 11 | `is_active` |
| 12 | `updated_at` |

### `task_completions` — 34 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `task_id` |
| 3 | `member_id` |
| 4 | `completed_at` |
| 5 | `evidence` |
| 6 | `approved_by` |
| 7 | `approval_status` |
| 8 | `family_member_id` |
| 9 | `completion_note` |
| 10 | `photo_url` |
| 11 | `approved_at` |
| 12 | `rejected` |
| 13 | `rejection_note` |
| 14 | `period_date` |
| 15 | `acted_by` |
| 16 | `completion_type` |
| 17 | `duration_minutes` |
| 18 | `mastery_evidence_url` |
| 19 | `mastery_evidence_note` |

### `routine_step_completions` — 483 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `task_id` |
| 3 | `step_id` |
| 4 | `member_id` |
| 5 | `completed_at` |
| 6 | `family_member_id` |
| 7 | `instance_number` |
| 8 | `period_date` |
| 9 | `photo_url` |

### `sequential_collections` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `title` |
| 4 | `task_ids` |
| 5 | `current_index` |
| 6 | `created_at` |
| 7 | `updated_at` |
| 8 | `template_id` |
| 9 | `total_items` |
| 10 | `active_count` |
| 11 | `promotion_timing` |
| 12 | `life_area_tag` |
| 13 | `reward_per_item_type` |
| 14 | `reward_per_item_amount` |
| 15 | `default_advancement_mode` |
| 16 | `default_practice_target` |
| 17 | `default_require_approval` |
| 18 | `default_require_evidence` |
| 19 | `default_track_duration` |
| 20 | `life_area_tags` |

### `task_claims` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `task_id` |
| 3 | `member_id` |
| 4 | `claimed_at` |
| 5 | `status` |
| 6 | `claimed_by` |
| 7 | `expires_at` |
| 8 | `completed` |
| 9 | `released` |
| 10 | `released_at` |

### `task_rewards` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `task_id` |
| 3 | `reward_type` |
| 4 | `reward_value` |
| 5 | `created_at` |

### `studio_queue` — 27 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `owner_id` |
| 4 | `destination` |
| 5 | `content` |
| 6 | `content_details` |
| 7 | `source` |
| 8 | `source_reference_id` |
| 9 | `structure_flag` |
| 10 | `batch_id` |
| 11 | `requester_id` |
| 12 | `requester_note` |
| 13 | `mindsweep_confidence` |
| 14 | `mindsweep_event_id` |
| 15 | `processed_at` |
| 16 | `dismissed_at` |
| 17 | `dismiss_note` |
| 18 | `created_at` |

### `lists` — 42 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `owner_id` |
| 4 | `title` |
| 5 | `list_type` |
| 6 | `reveal_type` |
| 7 | `max_respins_per_period` |
| 8 | `respin_period` |
| 9 | `created_at` |
| 10 | `updated_at` |
| 11 | `created_by` |
| 12 | `template_id` |
| 13 | `list_name` |
| 14 | `description` |
| 15 | `is_shared` |
| 16 | `victory_on_complete` |
| 17 | `is_included_in_ai` |
| 18 | `archived_at` |
| 19 | `is_shared_to_archive` |
| 20 | `archive_member_id` |
| 21 | `archive_folder_id` |
| 22 | `pool_mode` |
| 23 | `eligible_members` |
| 24 | `tags` |
| 25 | `victory_mode` |
| 26 | `draw_mode` |
| 27 | `max_active_draws` |
| 28 | `default_advancement_mode` |
| 29 | `default_practice_target` |
| 30 | `default_require_approval` |
| 31 | `default_require_evidence` |
| 32 | `default_track_duration` |
| 33 | `is_opportunity` |
| 34 | `default_opportunity_subtype` |
| 35 | `default_reward_type` |
| 36 | `default_reward_amount` |
| 37 | `default_claim_lock_duration` |
| 38 | `default_claim_lock_unit` |
| 39 | `schedule_config` |
| 40 | `default_track_progress` |
| 41 | `instantiation_mode` |
| 42 | `collaboration_mode` |

### `list_items` — 116 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `list_id` |
| 3 | `content` |
| 4 | `checked` |
| 5 | `section_name` |
| 6 | `notes` |
| 7 | `availability_mode` |
| 8 | `max_instances` |
| 9 | `completed_instances` |
| 10 | `recurrence_config` |
| 11 | `next_available_at` |
| 12 | `sort_order` |
| 13 | `created_at` |
| 14 | `updated_at` |
| 15 | `item_name` |
| 16 | `checked_by` |
| 17 | `checked_at` |
| 18 | `resource_url` |
| 19 | `quantity` |
| 20 | `quantity_unit` |
| 21 | `price` |
| 22 | `currency` |
| 23 | `category` |
| 24 | `item_date` |
| 25 | `priority` |
| 26 | `gift_for` |
| 27 | `promoted_to_task` |
| 28 | `promoted_task_id` |
| 29 | `is_repeatable` |
| 30 | `is_available` |
| 31 | `parent_item_id` |
| 32 | `frequency_min` |
| 33 | `frequency_max` |
| 34 | `frequency_period` |
| 35 | `cooldown_hours` |
| 36 | `last_completed_at` |
| 37 | `period_completion_count` |
| 38 | `reward_amount` |
| 39 | `victory_flagged` |
| 40 | `advancement_mode` |
| 41 | `practice_target` |
| 42 | `practice_count` |
| 43 | `mastery_status` |
| 44 | `mastery_submitted_at` |
| 45 | `mastery_approved_by` |
| 46 | `mastery_approved_at` |
| 47 | `require_mastery_approval` |
| 48 | `require_mastery_evidence` |
| 49 | `track_duration` |
| 50 | `opportunity_subtype` |
| 51 | `reward_type` |
| 52 | `claim_lock_duration` |
| 53 | `claim_lock_unit` |
| 54 | `track_progress` |
| 55 | `life_area_tags` |
| 56 | `in_progress_member_id` |

### `list_shares` — 1 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `list_id` |
| 3 | `shared_with` |
| 4 | `permission` |
| 5 | `created_at` |
| 6 | `member_id` |
| 7 | `is_individual_copy` |
| 8 | `can_edit` |

### `list_templates` — 12 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `title` |
| 3 | `description` |
| 4 | `list_type` |
| 5 | `default_items` |
| 6 | `is_system` |
| 7 | `created_at` |
| 8 | `family_id` |
| 9 | `created_by` |
| 10 | `template_name` |
| 11 | `usage_count` |
| 12 | `last_deployed_at` |
| 13 | `archived_at` |
| 14 | `updated_at` |
| 15 | `is_system_template` |
| 16 | `is_example` |
| 17 | `example_use_cases` |
| 18 | `category_label` |

### `guided_form_responses` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `task_id` |
| 4 | `family_member_id` |
| 5 | `section_key` |
| 6 | `response_content` |
| 7 | `response_metadata` |
| 8 | `created_at` |
| 9 | `updated_at` |

---

## Dashboards & Calendar (PRD-14 family)

### `dashboard_configs` — 22 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `dashboard_type` |
| 5 | `layout` |
| 6 | `layout_mode` |
| 7 | `decorations` |
| 8 | `preferences` |
| 9 | `created_at` |
| 10 | `updated_at` |
| 11 | `grid_columns` |

### `dashboard_widgets` — 48 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `template_type` |
| 5 | `visual_variant` |
| 6 | `title` |
| 7 | `size` |
| 8 | `position_x` |
| 9 | `position_y` |
| 10 | `folder_id` |
| 11 | `sort_order` |
| 12 | `widget_config` |
| 13 | `data_source_type` |
| 14 | `data_source_ids` |
| 15 | `assigned_member_id` |
| 16 | `is_active` |
| 17 | `is_on_dashboard` |
| 18 | `is_included_in_ai` |
| 19 | `multiplayer_enabled` |
| 20 | `multiplayer_participants` |
| 21 | `multiplayer_config` |
| 22 | `linked_widget_id` |
| 23 | `view_mode` |
| 24 | `created_at` |
| 25 | `updated_at` |
| 26 | `archived_at` |

### `dashboard_widget_folders` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `name` |
| 5 | `position_x` |
| 6 | `position_y` |
| 7 | `sort_order` |
| 8 | `created_at` |
| 9 | `updated_at` |

### `widget_data_points` — 67 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `widget_id` |
| 4 | `family_member_id` |
| 5 | `recorded_at` |
| 6 | `recorded_date` |
| 7 | `value` |
| 8 | `value_type` |
| 9 | `metadata` |
| 10 | `recorded_by_member_id` |
| 11 | `created_at` |

### `widget_templates` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `template_type` |
| 5 | `category` |
| 6 | `name` |
| 7 | `description` |
| 8 | `default_config` |
| 9 | `thumbnail_config` |
| 10 | `is_system` |
| 11 | `created_at` |
| 12 | `updated_at` |

### `widget_starter_configs` — 39 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `tracker_type` |
| 3 | `visual_variant` |
| 4 | `config_name` |
| 5 | `description` |
| 6 | `category` |
| 7 | `default_config` |
| 8 | `is_example` |
| 9 | `sort_order` |
| 10 | `created_at` |
| 11 | `updated_at` |

### `calendar_events` — 37 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `created_by` |
| 4 | `title` |
| 5 | `description` |
| 6 | `location` |
| 7 | `event_date` |
| 8 | `end_date` |
| 9 | `start_time` |
| 10 | `end_time` |
| 11 | `is_all_day` |
| 12 | `event_type` |
| 13 | `category_id` |
| 14 | `priority` |
| 15 | `color` |
| 16 | `icon_override` |
| 17 | `source_type` |
| 18 | `source_reference_id` |
| 19 | `source_image_url` |
| 20 | `external_id` |
| 21 | `external_source` |
| 22 | `last_synced_at` |
| 23 | `recurrence_rule` |
| 24 | `recurrence_details` |
| 25 | `recurrence_parent_id` |
| 26 | `status` |
| 27 | `rejection_note` |
| 28 | `approved_by` |
| 29 | `approved_at` |
| 30 | `transportation_needed` |
| 31 | `transportation_notes` |
| 32 | `items_to_bring` |
| 33 | `leave_by_time` |
| 34 | `notes` |
| 35 | `reminder_minutes` |
| 36 | `is_included_in_ai` |
| 37 | `created_at` |
| 38 | `updated_at` |
| 39 | `acted_by` |
| 40 | `show_on_hub` |
| 41 | `option_group_id` |
| 42 | `option_group_title` |
| 43 | `calendar_subtype` |

### `event_attendees` — 68 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `event_id` |
| 3 | `family_member_id` |
| 4 | `attendee_role` |
| 5 | `response_status` |
| 6 | `created_at` |

### `event_categories` — 12 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `name` |
| 4 | `slug` |
| 5 | `icon` |
| 6 | `color` |
| 7 | `is_system` |
| 8 | `sort_order` |
| 9 | `created_at` |

### `calendar_settings` — 3 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `default_drive_time_minutes` |
| 4 | `required_intake_fields` |
| 5 | `auto_approve_members` |
| 6 | `week_start_day` |
| 7 | `created_at` |
| 8 | `updated_at` |

### `family_overview_configs` — 1 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `selected_member_ids` |
| 5 | `column_order` |
| 6 | `section_order` |
| 7 | `section_states` |
| 8 | `calendar_collapsed` |
| 9 | `preferences` |
| 10 | `created_at` |
| 11 | `updated_at` |

---

## Family Hub (PRD-14D)

### `family_hub_configs` — 1 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `hub_title` |
| 4 | `theme_override` |
| 5 | `section_order` |
| 6 | `section_visibility` |
| 7 | `victory_settings` |
| 8 | `slideshow_config` |
| 9 | `tv_config` |
| 10 | `hub_pin` |
| 11 | `preferences` |
| 12 | `created_at` |
| 13 | `updated_at` |

### `family_best_intentions` — 1 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `created_by_member_id` |
| 4 | `title` |
| 5 | `description` |
| 6 | `participating_member_ids` |
| 7 | `require_pin_to_tally` |
| 8 | `is_active` |
| 9 | `is_included_in_ai` |
| 10 | `sort_order` |
| 11 | `archived_at` |
| 12 | `created_at` |
| 13 | `updated_at` |

### `family_intention_iterations` — 4 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `intention_id` |
| 4 | `member_id` |
| 5 | `day_date` |
| 6 | `created_at` |

### `countdowns` — 1 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `created_by_member_id` |
| 4 | `title` |
| 5 | `emoji` |
| 6 | `target_date` |
| 7 | `show_on_target_day` |
| 8 | `is_active` |
| 9 | `recurring_annually` |
| 10 | `created_at` |
| 11 | `updated_at` |

---

## Victories (PRD-11)

### `victories` — 13 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `description` |
| 5 | `celebration_text` |
| 6 | `life_area_tag` |
| 7 | `custom_tags` |
| 8 | `source` |
| 9 | `source_reference_id` |
| 10 | `recorder_type` |
| 11 | `member_type` |
| 12 | `importance` |
| 13 | `guiding_star_id` |
| 14 | `best_intention_id` |
| 15 | `is_moms_pick` |
| 16 | `moms_pick_note` |
| 17 | `moms_pick_by` |
| 18 | `celebration_voice` |
| 19 | `photo_url` |
| 20 | `archived_at` |
| 21 | `created_at` |
| 22 | `updated_at` |
| 23 | `life_area_tags` |

### `victory_celebrations` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `celebration_date` |
| 5 | `mode` |
| 6 | `period` |
| 7 | `narrative` |
| 8 | `victory_ids` |
| 9 | `victory_count` |
| 10 | `celebration_voice` |
| 11 | `context_sources` |
| 12 | `created_at` |

### `victory_voice_preferences` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `selected_voice` |
| 5 | `updated_at` |

### `family_victory_celebrations`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

---

## Archives & Context (PRD-13)

### `archive_folders` — 180 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `folder_name` |
| 5 | `parent_folder_id` |
| 6 | `folder_type` |
| 7 | `created_at` |
| 8 | `updated_at` |
| 9 | `icon` |
| 10 | `color_hex` |
| 11 | `description` |
| 12 | `is_system` |
| 13 | `is_included_in_ai` |
| 14 | `sort_order` |

### `archive_context_items` — 173 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `folder_id` |
| 4 | `member_id` |
| 5 | `context_field` |
| 6 | `context_value` |
| 7 | `context_type` |
| 8 | `is_included_in_ai` |
| 9 | `is_privacy_filtered` |
| 10 | `source` |
| 11 | `source_conversation_id` |
| 12 | `source_reference_id` |
| 13 | `added_by` |
| 14 | `usage_count` |
| 15 | `last_used_at` |
| 16 | `link_url` |
| 17 | `price_range` |
| 18 | `archived_at` |
| 19 | `created_at` |
| 20 | `updated_at` |
| 21 | `is_negative_preference` |

### `archive_member_settings` — 18 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `is_included_in_ai` |
| 5 | `overview_card_content` |
| 6 | `overview_card_updated_at` |
| 7 | `created_at` |
| 8 | `updated_at` |
| 9 | `physical_description` |
| 10 | `reference_photos` |
| 11 | `display_name_aliases` |

### `faith_preferences` — 1 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `faith_tradition` |
| 4 | `denomination` |
| 5 | `observances` |
| 6 | `sacred_texts` |
| 7 | `prioritize_tradition` |
| 8 | `include_comparative` |
| 9 | `include_secular` |
| 10 | `educational_only` |
| 11 | `use_our_terminology` |
| 12 | `respect_but_dont_assume` |
| 13 | `avoid_conflicting` |
| 14 | `acknowledge_diversity` |
| 15 | `minority_views` |
| 16 | `diversity_notes` |
| 17 | `special_instructions` |
| 18 | `relevance_setting` |
| 19 | `is_included_in_ai` |
| 20 | `created_at` |
| 21 | `updated_at` |

### `context_learning_dismissals` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `content_hash` |
| 4 | `conversation_id` |
| 5 | `dismissed_at` |

---

## Communication (PRD-15)

### `conversation_spaces` — 11 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `space_type` |
| 4 | `name` |
| 5 | `created_by` |
| 6 | `is_pinned` |
| 7 | `metadata` |
| 8 | `created_at` |
| 9 | `updated_at` |

### `conversation_space_members` — 40 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `space_id` |
| 3 | `family_member_id` |
| 4 | `role` |
| 5 | `notifications_muted` |
| 6 | `joined_at` |

### `conversation_threads` — 3 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `space_id` |
| 3 | `title` |
| 4 | `started_by` |
| 5 | `is_archived` |
| 6 | `is_pinned` |
| 7 | `source_type` |
| 8 | `source_reference_id` |
| 9 | `last_message_at` |
| 10 | `created_at` |

### `messages` — 4 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `thread_id` |
| 3 | `sender_member_id` |
| 4 | `message_type` |
| 5 | `content` |
| 6 | `metadata` |
| 7 | `reply_to_id` |
| 8 | `is_edited` |
| 9 | `edited_at` |
| 10 | `created_at` |

### `message_read_status` — 4 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `thread_id` |
| 3 | `family_member_id` |
| 4 | `last_read_message_id` |
| 5 | `last_read_at` |

### `messaging_settings` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `communication_guidelines` |
| 4 | `content_corner_viewing_mode` |
| 5 | `content_corner_locked_until` |
| 6 | `content_corner_who_can_add` |
| 7 | `created_at` |
| 8 | `updated_at` |

### `member_messaging_permissions` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `can_message_member_id` |
| 5 | `created_at` |

### `message_coaching_settings` — 4 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `is_enabled` |
| 5 | `custom_prompt` |
| 6 | `created_at` |
| 7 | `updated_at` |

### `family_requests` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `sender_member_id` |
| 4 | `recipient_member_id` |
| 5 | `title` |
| 6 | `details` |
| 7 | `when_text` |
| 8 | `status` |
| 9 | `routed_to` |
| 10 | `routed_reference_id` |
| 11 | `decline_note` |
| 12 | `snoozed_until` |
| 13 | `discussion_thread_id` |
| 14 | `source` |
| 15 | `source_reference_id` |
| 16 | `processed_at` |
| 17 | `processed_by` |
| 18 | `created_at` |
| 19 | `updated_at` |

### `notifications` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `recipient_member_id` |
| 4 | `notification_type` |
| 5 | `category` |
| 6 | `title` |
| 7 | `body` |
| 8 | `source_type` |
| 9 | `source_reference_id` |
| 10 | `action_url` |
| 11 | `is_read` |
| 12 | `read_at` |
| 13 | `is_dismissed` |
| 14 | `delivery_method` |
| 15 | `delivered_at` |
| 16 | `email_sent_at` |
| 17 | `priority` |
| 18 | `created_at` |

### `notification_preferences` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `category` |
| 5 | `in_app_enabled` |
| 6 | `push_enabled` |
| 7 | `do_not_disturb` |
| 8 | `created_at` |
| 9 | `updated_at` |

### `out_of_nest_members` — 4 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `name` |
| 4 | `email` |
| 5 | `phone` |
| 6 | `relationship` |
| 7 | `avatar_url` |
| 8 | `invited_by` |
| 9 | `invitation_status` |
| 10 | `user_id` |
| 11 | `last_active_at` |
| 12 | `created_at` |
| 13 | `updated_at` |

---

## ThoughtSift (PRD-34)

### `board_personas` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `persona_name` |
| 3 | `persona_type` |
| 4 | `personality_profile` |
| 5 | `source_references` |
| 6 | `bookshelf_enriched` |
| 7 | `category` |
| 8 | `icon_emoji` |
| 9 | `content_policy_status` |
| 10 | `is_public` |
| 11 | `created_by` |
| 12 | `family_id` |
| 13 | `usage_count` |
| 14 | `embedding` |
| 15 | `created_at` |
| 16 | `updated_at` |

### `board_sessions` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `conversation_id` |
| 3 | `family_id` |
| 4 | `member_id` |
| 5 | `created_at` |
| 6 | `disclaimer_shown` |

### `board_session_personas` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `board_session_id` |
| 3 | `persona_id` |
| 4 | `seat_order` |
| 5 | `is_prayer_seat` |
| 6 | `seated_at` |
| 7 | `removed_at` |
| 8 | `platform_persona_id` |

### `persona_favorites` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `member_id` |
| 3 | `persona_id` |
| 4 | `created_at` |
| 5 | `platform_persona_id` |

### `perspective_lenses` — 17 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `lens_key` |
| 3 | `display_name` |
| 4 | `description` |
| 5 | `lens_type` |
| 6 | `system_prompt_addition` |
| 7 | `icon_emoji` |
| 8 | `is_system` |
| 9 | `is_public` |
| 10 | `created_by` |
| 11 | `sort_order` |
| 12 | `is_active` |
| 13 | `created_at` |

### `decision_frameworks` — 15 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `framework_key` |
| 3 | `display_name` |
| 4 | `description` |
| 5 | `best_for` |
| 6 | `system_prompt_addition` |
| 7 | `sort_order` |
| 8 | `is_active` |
| 9 | `created_at` |

---

## BookShelf (PRD-23)

### `bookshelf_items` — 562 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `uploaded_by_member_id` |
| 4 | `title` |
| 5 | `author` |
| 6 | `isbn` |
| 7 | `file_type` |
| 8 | `file_name` |
| 9 | `storage_path` |
| 10 | `text_content` |
| 11 | `file_size_bytes` |
| 12 | `genres` |
| 13 | `tags` |
| 14 | `folder_group` |
| 15 | `processing_status` |
| 16 | `processing_detail` |
| 17 | `extraction_status` |
| 18 | `chunk_count` |
| 19 | `intake_completed` |
| 20 | `ai_summary` |
| 21 | `toc` |
| 22 | `discovered_sections` |
| 23 | `book_cache_id` |
| 24 | `title_author_embedding` |
| 25 | `parent_bookshelf_item_id` |
| 26 | `part_number` |
| 27 | `part_count` |
| 28 | `last_viewed_at` |
| 29 | `archived_at` |
| 30 | `created_at` |
| 31 | `updated_at` |
| 32 | `folder_id` |
| 33 | `book_library_id` |

### `bookshelf_chapters` — 1 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `bookshelf_item_id` |
| 3 | `chapter_index` |
| 4 | `chapter_title` |
| 5 | `start_chunk_index` |
| 6 | `end_chunk_index` |
| 7 | `created_at` |

### `bookshelf_chunks` — 58379 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `book_cache_id` |
| 3 | `chunk_index` |
| 4 | `chunk_text` |
| 5 | `token_count` |
| 6 | `chapter_title` |
| 7 | `chapter_index` |
| 8 | `embedding` |
| 9 | `metadata` |
| 10 | `created_at` |

### `bookshelf_summaries` — 21538 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `bookshelf_item_id` |
| 5 | `section_title` |
| 6 | `section_index` |
| 7 | `content_type` |
| 8 | `text` |
| 9 | `sort_order` |
| 10 | `audience` |
| 11 | `is_key_point` |
| 12 | `is_hearted` |
| 13 | `is_deleted` |
| 14 | `is_from_go_deeper` |
| 15 | `user_note` |
| 16 | `is_included_in_ai` |
| 17 | `embedding` |
| 18 | `created_at` |
| 19 | `updated_at` |

### `bookshelf_insights` — 24360 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `bookshelf_item_id` |
| 5 | `section_title` |
| 6 | `section_index` |
| 7 | `content_type` |
| 8 | `text` |
| 9 | `sort_order` |
| 10 | `audience` |
| 11 | `is_key_point` |
| 12 | `is_user_added` |
| 13 | `is_hearted` |
| 14 | `is_deleted` |
| 15 | `is_from_go_deeper` |
| 16 | `user_note` |
| 17 | `is_included_in_ai` |
| 18 | `embedding` |
| 19 | `created_at` |
| 20 | `updated_at` |

### `bookshelf_declarations` — 16931 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `bookshelf_item_id` |
| 5 | `section_title` |
| 6 | `section_index` |
| 7 | `value_name` |
| 8 | `declaration_text` |
| 9 | `style_variant` |
| 10 | `richness` |
| 11 | `sort_order` |
| 12 | `audience` |
| 13 | `is_key_point` |
| 14 | `is_hearted` |
| 15 | `is_deleted` |
| 16 | `is_from_go_deeper` |
| 17 | `sent_to_guiding_stars` |
| 18 | `guiding_star_id` |
| 19 | `user_note` |
| 20 | `is_included_in_ai` |
| 21 | `embedding` |
| 22 | `created_at` |
| 23 | `updated_at` |

### `bookshelf_action_steps` — 16396 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `bookshelf_item_id` |
| 5 | `section_title` |
| 6 | `section_index` |
| 7 | `content_type` |
| 8 | `text` |
| 9 | `sort_order` |
| 10 | `audience` |
| 11 | `is_key_point` |
| 12 | `is_hearted` |
| 13 | `is_deleted` |
| 14 | `is_from_go_deeper` |
| 15 | `sent_to_tasks` |
| 16 | `task_id` |
| 17 | `user_note` |
| 18 | `is_included_in_ai` |
| 19 | `embedding` |
| 20 | `created_at` |
| 21 | `updated_at` |

### `bookshelf_questions` — 10168 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `bookshelf_item_id` |
| 5 | `section_title` |
| 6 | `section_index` |
| 7 | `content_type` |
| 8 | `text` |
| 9 | `sort_order` |
| 10 | `audience` |
| 11 | `is_key_point` |
| 12 | `is_hearted` |
| 13 | `is_deleted` |
| 14 | `is_from_go_deeper` |
| 15 | `sent_to_prompts` |
| 16 | `journal_prompt_id` |
| 17 | `sent_to_tasks` |
| 18 | `task_id` |
| 19 | `user_note` |
| 20 | `is_included_in_ai` |
| 21 | `embedding` |
| 22 | `created_at` |
| 23 | `updated_at` |

### `bookshelf_discussions` — 4 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `bookshelf_item_ids` |
| 5 | `audience` |
| 6 | `title` |
| 7 | `created_at` |
| 8 | `updated_at` |
| 9 | `discussion_type` |

### `bookshelf_discussion_messages` — 9 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `discussion_id` |
| 3 | `role` |
| 4 | `content` |
| 5 | `metadata` |
| 6 | `created_at` |

### `bookshelf_collections` — 15 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `created_by_member_id` |
| 4 | `name` |
| 5 | `description` |
| 6 | `sort_order` |
| 7 | `archived_at` |
| 8 | `created_at` |
| 9 | `updated_at` |

### `bookshelf_collection_items` — 83 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `collection_id` |
| 3 | `bookshelf_item_id` |
| 4 | `sort_order` |
| 5 | `created_at` |

### `bookshelf_shares` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `shared_by_member_id` |
| 4 | `shared_with_member_id` |
| 5 | `share_type` |
| 6 | `bookshelf_item_id` |
| 7 | `collection_id` |
| 8 | `created_at` |

### `bookshelf_member_settings` — 4 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `book_knowledge_access` |
| 5 | `library_sort` |
| 6 | `library_layout` |
| 7 | `library_group_mode` |
| 8 | `resurfaced_item_ids` |
| 9 | `created_at` |
| 10 | `updated_at` |
| 11 | `reading_positions` |

### `journal_prompts` — 2 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `prompt_text` |
| 5 | `source` |
| 6 | `source_reference_id` |
| 7 | `source_book_title` |
| 8 | `source_chapter_title` |
| 9 | `tags` |
| 10 | `archived_at` |
| 11 | `created_at` |
| 12 | `updated_at` |

### `bookshelf_user_state` — 62 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `extraction_id` |
| 5 | `is_hearted` |
| 6 | `user_note` |
| 7 | `is_included_in_ai` |
| 8 | `sent_to_guiding_stars` |
| 9 | `guiding_star_id` |
| 10 | `sent_to_tasks` |
| 11 | `task_id` |
| 12 | `sent_to_prompts` |
| 13 | `journal_prompt_id` |
| 14 | `created_at` |
| 15 | `updated_at` |
| 16 | `is_hidden` |

---

## AI Vault (PRD-21A/B/C)

### `vault_items` — 17 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `display_title` |
| 3 | `detail_title` |
| 4 | `short_description` |
| 5 | `full_description` |
| 6 | `content_type` |
| 7 | `prompt_format` |
| 8 | `delivery_method` |
| 9 | `category_id` |
| 10 | `ladder_position` |
| 11 | `difficulty` |
| 12 | `tags` |
| 13 | `thumbnail_url` |
| 14 | `preview_image_url` |
| 15 | `content_body` |
| 16 | `content_url` |
| 17 | `tool_url` |
| 18 | `guided_mode_key` |
| 19 | `platform` |
| 20 | `target_platforms` |
| 21 | `auth_provider` |
| 22 | `requires_auth` |
| 23 | `enable_lila_optimization` |
| 24 | `lila_optimization_prompt` |
| 25 | `allowed_tiers` |
| 26 | `status` |
| 27 | `is_featured` |
| 28 | `is_new` |
| 29 | `first_seen_tracking` |
| 30 | `new_badge_duration_days` |
| 31 | `teen_visible` |
| 32 | `seasonal_tags` |
| 33 | `gift_idea_tags` |
| 34 | `seasonal_priority` |
| 35 | `portal_description` |
| 36 | `portal_tips` |
| 37 | `prerequisites_text` |
| 38 | `learning_outcomes` |
| 39 | `estimated_minutes` |
| 40 | `enable_usage_limits` |
| 41 | `usage_limit_type` |
| 42 | `usage_limit_amount` |
| 43 | `session_timeout_minutes` |
| 44 | `display_order` |
| 45 | `view_count` |
| 46 | `created_by` |
| 47 | `created_at` |
| 48 | `updated_at` |
| 49 | `last_published_at` |
| 50 | `heart_count` |
| 51 | `comment_count` |
| 52 | `satisfaction_positive` |
| 53 | `satisfaction_negative` |
| 54 | `fts_document` |

### `vault_categories` — 8 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `slug` |
| 3 | `display_name` |
| 4 | `description` |
| 5 | `icon` |
| 6 | `color` |
| 7 | `sort_order` |
| 8 | `is_active` |
| 9 | `created_at` |
| 10 | `updated_at` |

### `vault_prompt_entries` — 4 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `vault_item_id` |
| 3 | `title` |
| 4 | `prompt_text` |
| 5 | `variable_placeholders` |
| 6 | `example_outputs` |
| 7 | `reference_images` |
| 8 | `tags` |
| 9 | `sort_order` |
| 10 | `created_at` |
| 11 | `updated_at` |

### `vault_collection_items` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `collection_id` |
| 3 | `item_id` |
| 4 | `sort_order` |
| 5 | `created_at` |

### `vault_user_bookmarks` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `user_id` |
| 3 | `vault_item_id` |
| 4 | `created_at` |

### `vault_user_progress` — 15 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `user_id` |
| 3 | `vault_item_id` |
| 4 | `progress_status` |
| 5 | `progress_percent` |
| 6 | `last_accessed_at` |
| 7 | `completed_at` |
| 8 | `created_at` |
| 9 | `updated_at` |

### `vault_user_visits` — 232 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `user_id` |
| 3 | `visited_at` |

### `vault_first_sightings` — 100 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `user_id` |
| 3 | `vault_item_id` |
| 4 | `first_seen_at` |

### `vault_tool_sessions` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `user_id` |
| 3 | `vault_item_id` |
| 4 | `session_token` |
| 5 | `started_at` |
| 6 | `expires_at` |
| 7 | `last_activity_at` |
| 8 | `is_active` |

### `vault_copy_events` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `user_id` |
| 3 | `vault_item_id` |
| 4 | `prompt_entry_id` |
| 5 | `copied_at` |

### `user_saved_prompts` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `user_id` |
| 3 | `title` |
| 4 | `prompt_text` |
| 5 | `source_vault_item_id` |
| 6 | `source_prompt_entry_id` |
| 7 | `is_lila_optimized` |
| 8 | `tags` |
| 9 | `created_at` |
| 10 | `updated_at` |
| 11 | `shared_with_member_id` |

### `vault_content_requests` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `user_id` |
| 3 | `topic` |
| 4 | `description` |
| 5 | `category_suggestion` |
| 6 | `priority` |
| 7 | `status` |
| 8 | `admin_notes` |
| 9 | `created_at` |
| 10 | `updated_at` |

### `vault_engagement`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `vault_comments`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `vault_comment_reports`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `vault_moderation_log`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `vault_satisfaction_signals`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `vault_engagement_config`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

---

## Communication Tools (PRD-21)

### `communication_drafts` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `author_id` |
| 4 | `about_member_id` |
| 5 | `tool_mode` |
| 6 | `raw_input` |
| 7 | `crafted_version` |
| 8 | `final_version` |
| 9 | `teaching_skill` |
| 10 | `teaching_note` |
| 11 | `status` |
| 12 | `sent_at` |
| 13 | `sent_via` |
| 14 | `lila_conversation_id` |
| 15 | `created_at` |
| 16 | `updated_at` |

### `teaching_skill_history` — 29 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `tool_mode` |
| 5 | `skill_key` |
| 6 | `about_member_id` |
| 7 | `lila_conversation_id` |
| 8 | `created_at` |

---

## MindSweep (PRD-17B)

### `mindsweep_settings` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `aggressiveness` |
| 5 | `always_review_rules` |
| 6 | `custom_review_rules` |
| 7 | `auto_sweep_shared` |
| 8 | `auto_sweep_time` |
| 9 | `email_process_immediately` |
| 10 | `high_accuracy_voice` |
| 11 | `digest_morning` |
| 12 | `digest_evening` |
| 13 | `digest_weekly` |
| 14 | `created_at` |
| 15 | `updated_at` |

### `mindsweep_holding` — 1 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `content` |
| 5 | `content_type` |
| 6 | `source_channel` |
| 7 | `audio_blob_local` |
| 8 | `link_url` |
| 9 | `captured_at` |
| 10 | `processed_at` |
| 11 | `sweep_event_id` |
| 12 | `created_at` |

### `mindsweep_allowed_senders` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `email_address` |
| 4 | `added_by` |
| 5 | `created_at` |

### `mindsweep_events` — 10 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `source_channel` |
| 5 | `input_type` |
| 6 | `raw_content_preview` |
| 7 | `items_extracted` |
| 8 | `items_auto_routed` |
| 9 | `items_queued` |
| 10 | `items_direct_routed` |
| 11 | `aggressiveness_at_time` |
| 12 | `processing_cost_cents` |
| 13 | `created_at` |

### `mindsweep_approval_patterns` — 21 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `content_category` |
| 5 | `action_taken` |
| 6 | `suggested_destination` |
| 7 | `actual_destination` |
| 8 | `created_at` |

---

## Infrastructure (PRD-36)

### `time_sessions` — 1 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `started_by` |
| 5 | `task_id` |
| 6 | `widget_id` |
| 7 | `list_item_id` |
| 8 | `source_type` |
| 9 | `source_reference_id` |
| 10 | `timer_mode` |
| 11 | `started_at` |
| 12 | `ended_at` |
| 13 | `duration_minutes` |
| 14 | `is_standalone` |
| 15 | `standalone_label` |
| 16 | `pomodoro_interval_number` |
| 17 | `pomodoro_config` |
| 18 | `countdown_target_minutes` |
| 19 | `auto_paused` |
| 20 | `edited` |
| 21 | `edited_by` |
| 22 | `edited_at` |
| 23 | `original_timestamps` |
| 24 | `edit_reason` |
| 25 | `deleted_at` |
| 26 | `metadata` |
| 27 | `created_at` |

### `timer_configs` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `timer_visible` |
| 5 | `idle_reminder_minutes` |
| 6 | `idle_repeat_minutes` |
| 7 | `auto_pause_minutes` |
| 8 | `pomodoro_focus_minutes` |
| 9 | `pomodoro_short_break_minutes` |
| 10 | `pomodoro_long_break_minutes` |
| 11 | `pomodoro_intervals_before_long` |
| 12 | `pomodoro_break_required` |
| 13 | `can_start_standalone` |
| 14 | `visual_timer_style` |
| 15 | `show_time_as_numbers` |
| 16 | `bubble_position` |
| 17 | `created_at` |
| 18 | `updated_at` |

---

## Activity, Analytics & Admin (PRD-32)

### `activity_log_entries` — 184 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `event_type` |
| 5 | `source_table` |
| 6 | `source_id` |
| 7 | `metadata` |
| 8 | `created_at` |
| 9 | `display_text` |
| 10 | `description` |
| 11 | `photo_url` |
| 12 | `source` |
| 13 | `source_reference_id` |
| 14 | `shift_session_id` |
| 15 | `hidden` |

### `ai_usage_log`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `platform_usage_log`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `feedback_submissions`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `known_issues`

*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*

### `feature_demand_responses` — 1 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `feature_key` |
| 5 | `vote` |
| 6 | `freeform_note` |
| 7 | `voted_via_view_as` |
| 8 | `actual_voter_id` |
| 9 | `responded_at` |
| 10 | `created_at` |

---

## Platform Assets

### `platform_assets` — 622 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `feature_key` |
| 3 | `variant` |
| 4 | `category` |
| 5 | `size_512_url` |
| 6 | `size_128_url` |
| 7 | `size_32_url` |
| 8 | `description` |
| 9 | `generation_prompt` |
| 10 | `tags` |
| 11 | `vibe_compatibility` |
| 12 | `created_at` |
| 13 | `display_name` |
| 14 | `embedding` |
| 15 | `assigned_to` |
| 16 | `status` |

---

## API-exposed tables (not yet grouped into a domain)

*Live `public` tables that PostgREST exposes but that no DOMAIN_ORDER entry claims. They may belong in an existing section or deserve their own — update `scripts/full-schema-dump.cjs` DOMAIN_ORDER to resolve. Columns come from the OpenAPI spec; row counts from live HEAD queries.*

### `account_deletions` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `requested_by` |
| 4 | `deletion_type` |
| 5 | `status` |
| 6 | `scheduled_for` |
| 7 | `grace_period_days` |
| 8 | `created_at` |
| 9 | `completed_at` |

### `allowance_configs` — 4 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `enabled` |
| 5 | `weekly_amount` |
| 6 | `calculation_approach` |
| 7 | `default_point_value` |
| 8 | `minimum_threshold` |
| 9 | `bonus_threshold` |
| 10 | `bonus_percentage` |
| 11 | `rounding_behavior` |
| 12 | `grace_days_enabled` |
| 13 | `makeup_window_enabled` |
| 14 | `makeup_window_days` |
| 15 | `extra_credit_enabled` |
| 16 | `child_can_see_finances` |
| 17 | `period_type` |
| 18 | `period_start_day` |
| 19 | `calculation_time` |
| 20 | `loans_enabled` |
| 21 | `loan_interest_enabled` |
| 22 | `loan_default_interest_rate` |
| 23 | `loan_interest_period` |
| 24 | `loan_max_amount` |
| 25 | `created_at` |
| 26 | `updated_at` |
| 27 | `bonus_type` |
| 28 | `bonus_flat_amount` |

### `allowance_periods` — 10 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `period_start` |
| 5 | `period_end` |
| 6 | `status` |
| 7 | `total_tasks_assigned` |
| 8 | `grace_day_tasks_excluded` |
| 9 | `effective_tasks_assigned` |
| 10 | `tasks_completed` |
| 11 | `extra_credit_completed` |
| 12 | `effective_tasks_completed` |
| 13 | `completion_percentage` |
| 14 | `base_amount` |
| 15 | `calculated_amount` |
| 16 | `bonus_applied` |
| 17 | `bonus_amount` |
| 18 | `total_earned` |
| 19 | `grace_days` |
| 20 | `calculation_details` |
| 21 | `calculated_at` |
| 22 | `closed_at` |
| 23 | `closed_early` |
| 24 | `created_at` |
| 25 | `updated_at` |

### `beta_glitch_reports` — 65 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `created_at` |
| 3 | `user_id` |
| 4 | `family_id` |
| 5 | `family_member_id` |
| 6 | `shell_type` |
| 7 | `display_name` |
| 8 | `what_doing` |
| 9 | `what_tried` |
| 10 | `what_happened` |
| 11 | `what_expected` |
| 12 | `user_image_url` |
| 13 | `screenshot_data_url` |
| 14 | `current_route` |
| 15 | `browser_info` |
| 16 | `console_errors` |
| 17 | `recent_routes` |
| 18 | `status` |
| 19 | `admin_notes` |
| 20 | `resolved_at` |

### `bookshelf_search_history` — 15 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `query` |
| 5 | `mode` |
| 6 | `scope` |
| 7 | `result_count` |
| 8 | `created_at` |

### `color_reveal_progress` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `widget_id` |
| 3 | `color_zone_index` |
| 4 | `color_hex` |
| 5 | `color_name` |
| 6 | `revealed_at` |
| 7 | `revealed_by_member_id` |
| 8 | `achievement_count` |
| 9 | `created_at` |

### `coloring_gallery` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `widget_id` |
| 5 | `coloring_image_id` |
| 6 | `image_name` |
| 7 | `completed_image_url` |
| 8 | `completed_at` |
| 9 | `total_achievements` |
| 10 | `achievement_description` |
| 11 | `is_favorite` |
| 12 | `display_order` |
| 13 | `created_at` |

### `coloring_image_library` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `color_image_url` |
| 3 | `grayscale_image_url` |
| 4 | `line_art_url` |
| 5 | `thumbnail_url` |
| 6 | `image_name` |
| 7 | `theme_category` |
| 8 | `gamification_theme` |
| 9 | `color_zones` |
| 10 | `total_color_zones` |
| 11 | `recommended_min_achievements` |
| 12 | `recommended_max_achievements` |
| 13 | `supports_gradient_reveals` |
| 14 | `complexity_level` |
| 15 | `age_group` |
| 16 | `keywords` |
| 17 | `is_available_for_print` |
| 18 | `is_active` |
| 19 | `created_at` |

### `coloring_reveal_library` — 32 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `theme_id` |
| 3 | `slug` |
| 4 | `display_name` |
| 5 | `subject_category` |
| 6 | `color_zones` |
| 7 | `reveal_sequences` |
| 8 | `zone_count` |
| 9 | `sort_order` |
| 10 | `is_active` |
| 11 | `created_at` |

### `congratulations_messages` — 20 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `message_text` |
| 3 | `category` |
| 4 | `is_system` |
| 5 | `family_id` |
| 6 | `sort_order` |
| 7 | `created_at` |

### `daily_holidays` — 1502 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `name` |
| 3 | `description` |
| 4 | `date_month` |
| 5 | `date_day` |
| 6 | `date_type` |
| 7 | `floating_rule` |
| 8 | `tags` |
| 9 | `is_kid_friendly` |
| 10 | `silliness_score` |
| 11 | `obscurity_score` |
| 12 | `is_excluded` |
| 13 | `source` |
| 14 | `created_at` |

### `deed_firings` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `source_type` |
| 5 | `source_id` |
| 6 | `fired_at` |
| 7 | `metadata` |
| 8 | `idempotency_key` |
| 9 | `created_at` |

### `earned_prizes` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `reward_reveal_id` |
| 5 | `attachment_id` |
| 6 | `source_type` |
| 7 | `source_id` |
| 8 | `prize_type` |
| 9 | `prize_text` |
| 10 | `prize_name` |
| 11 | `prize_image_url` |
| 12 | `prize_asset_key` |
| 13 | `animation_slug` |
| 14 | `earned_at` |
| 15 | `redeemed_at` |
| 16 | `redeemed_by` |
| 17 | `created_at` |

### `feature_discovery_dismissals` — 2 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `feature_key` |
| 5 | `dismissed_at` |

### `feature_expansion_dismissals` — 2 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `feature_key` |
| 5 | `dismissed_at` |
| 6 | `dismissed_via_view_as` |
| 7 | `actual_dismisser_id` |

### `financial_transactions` — 4 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `transaction_type` |
| 5 | `amount` |
| 6 | `balance_after` |
| 7 | `description` |
| 8 | `source_type` |
| 9 | `source_reference_id` |
| 10 | `category` |
| 11 | `note` |
| 12 | `metadata` |
| 13 | `created_at` |

### `gamification_configs` — 18 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `enabled` |
| 5 | `currency_name` |
| 6 | `currency_icon` |
| 7 | `base_points_per_task` |
| 8 | `bonus_at_three` |
| 9 | `bonus_at_five` |
| 10 | `routine_points_mode` |
| 11 | `streak_grace_days` |
| 12 | `streak_schedule_aware` |
| 13 | `streak_pause_enabled` |
| 14 | `streak_paused` |
| 15 | `streak_paused_at` |
| 16 | `visualization_mode` |
| 17 | `level_thresholds` |
| 18 | `created_at` |
| 19 | `updated_at` |

### `gamification_creatures` — 161 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `theme_id` |
| 3 | `slug` |
| 4 | `display_name` |
| 5 | `rarity` |
| 6 | `tags` |
| 7 | `description` |
| 8 | `image_url` |
| 9 | `sort_order` |
| 10 | `is_active` |
| 11 | `created_at` |

### `gamification_sticker_pages` — 26 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `theme_id` |
| 3 | `slug` |
| 4 | `display_name` |
| 5 | `scene` |
| 6 | `season` |
| 7 | `image_url` |
| 8 | `sort_order` |
| 9 | `is_active` |
| 10 | `created_at` |

### `gamification_themes` — 1 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `theme_slug` |
| 3 | `display_name` |
| 4 | `description` |
| 5 | `creature_reveal_video_url` |
| 6 | `page_reveal_video_url` |
| 7 | `thumbnail_image_url` |
| 8 | `is_active` |
| 9 | `sort_order` |
| 10 | `created_at` |

### `homeschool_configs` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `time_allocation_mode` |
| 5 | `allow_subject_overlap` |
| 6 | `subject_hour_overrides` |
| 7 | `school_year_start` |
| 8 | `school_year_end` |
| 9 | `term_breaks` |
| 10 | `created_at` |
| 11 | `updated_at` |

### `homeschool_subjects` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `name` |
| 4 | `default_weekly_hours` |
| 5 | `icon_key` |
| 6 | `sort_order` |
| 7 | `is_active` |
| 8 | `created_at` |
| 9 | `updated_at` |

### `homeschool_time_logs` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `subject_id` |
| 5 | `task_id` |
| 6 | `log_date` |
| 7 | `minutes_logged` |
| 8 | `allocation_mode_used` |
| 9 | `source` |
| 10 | `source_reference_id` |
| 11 | `status` |
| 12 | `description` |
| 13 | `approved_by` |
| 14 | `approved_at` |
| 15 | `created_at` |
| 16 | `updated_at` |

### `journal_visibility_settings` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `parent_member_id` |
| 4 | `child_member_id` |
| 5 | `entry_type` |
| 6 | `is_visible_to_parent` |
| 7 | `is_included_in_ai_default` |
| 8 | `created_at` |
| 9 | `updated_at` |

### `list_item_member_tracking` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `list_item_id` |
| 3 | `family_member_id` |
| 4 | `last_completed_at` |
| 5 | `period_completion_count` |
| 6 | `lifetime_completion_count` |
| 7 | `created_at` |
| 8 | `updated_at` |

### `loans` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `original_amount` |
| 5 | `remaining_balance` |
| 6 | `reason` |
| 7 | `repayment_mode` |
| 8 | `auto_deduct_amount` |
| 9 | `interest_rate` |
| 10 | `interest_period` |
| 11 | `interest_last_accrued` |
| 12 | `total_interest_accrued` |
| 13 | `status` |
| 14 | `issued_at` |
| 15 | `paid_off_at` |
| 16 | `created_at` |
| 17 | `updated_at` |

### `meeting_agenda_items` — 10 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `meeting_type` |
| 4 | `template_id` |
| 5 | `related_member_id` |
| 6 | `content` |
| 7 | `added_by` |
| 8 | `suggested_by_guided` |
| 9 | `status` |
| 10 | `discussed_in_meeting_id` |
| 11 | `source` |
| 12 | `source_reference_id` |
| 13 | `created_at` |
| 14 | `updated_at` |

### `meeting_participants` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `meeting_id` |
| 3 | `family_member_id` |
| 4 | `role` |
| 5 | `notified_at` |
| 6 | `created_at` |

### `meeting_schedules` — 9 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `meeting_type` |
| 4 | `template_id` |
| 5 | `related_member_id` |
| 6 | `recurrence_rule` |
| 7 | `recurrence_details` |
| 8 | `next_due_date` |
| 9 | `last_completed_date` |
| 10 | `calendar_event_id` |
| 11 | `is_active` |
| 12 | `created_by` |
| 13 | `created_at` |
| 14 | `updated_at` |

### `meeting_template_sections` — 31174 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `meeting_type` |
| 4 | `template_id` |
| 5 | `section_name` |
| 6 | `prompt_text` |
| 7 | `sort_order` |
| 8 | `is_default` |
| 9 | `is_archived` |
| 10 | `created_at` |
| 11 | `updated_at` |

### `meeting_templates` — 11 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `name` |
| 4 | `participant_type` |
| 5 | `default_partner_id` |
| 6 | `default_participant_ids` |
| 7 | `created_by` |
| 8 | `is_archived` |
| 9 | `created_at` |
| 10 | `updated_at` |

### `meetings` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `meeting_type` |
| 4 | `template_id` |
| 5 | `custom_title` |
| 6 | `related_member_id` |
| 7 | `status` |
| 8 | `mode` |
| 9 | `facilitator_member_id` |
| 10 | `started_by` |
| 11 | `summary` |
| 12 | `impressions` |
| 13 | `lila_conversation_id` |
| 14 | `schedule_id` |
| 15 | `calendar_event_id` |
| 16 | `started_at` |
| 17 | `completed_at` |
| 18 | `duration_minutes` |
| 19 | `created_at` |
| 20 | `updated_at` |

### `member_coloring_reveals` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `coloring_image_id` |
| 5 | `reveal_step_count` |
| 6 | `current_step` |
| 7 | `revealed_zone_ids` |
| 8 | `earning_mode` |
| 9 | `earning_threshold` |
| 10 | `earning_counter` |
| 11 | `earning_segment_ids` |
| 12 | `earning_tracker_widget_id` |
| 13 | `earning_tracker_threshold` |
| 14 | `lineart_preference` |
| 15 | `is_complete` |
| 16 | `completed_at` |
| 17 | `printed_at` |
| 18 | `is_active` |
| 19 | `created_at` |
| 20 | `updated_at` |
| 21 | `earning_task_id` |

### `member_creature_collection` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `creature_id` |
| 5 | `sticker_page_id` |
| 6 | `position_x` |
| 7 | `position_y` |
| 8 | `awarded_source_type` |
| 9 | `awarded_source_id` |
| 10 | `awarded_at` |

### `member_emails` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_member_id` |
| 3 | `email` |
| 4 | `is_primary` |
| 5 | `is_verified` |
| 6 | `verification_token` |
| 7 | `verification_expires_at` |
| 8 | `created_at` |

### `member_page_unlocks` — 18 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `sticker_page_id` |
| 5 | `unlocked_at` |
| 6 | `unlocked_trigger_type` |
| 7 | `creatures_at_unlock` |

### `member_sticker_book_state` — 18 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `active_theme_id` |
| 5 | `active_page_id` |
| 6 | `page_unlock_mode` |
| 7 | `page_unlock_interval` |
| 8 | `rarity_weights` |
| 9 | `creature_roll_chance_per_task` |
| 10 | `is_enabled` |
| 11 | `creatures_earned_total` |
| 12 | `pages_unlocked_total` |
| 13 | `created_at` |
| 14 | `updated_at` |
| 15 | `creature_earning_mode` |
| 16 | `creature_earning_threshold` |
| 17 | `creature_earning_counter` |
| 18 | `creature_earning_counter_resets` |
| 19 | `creature_earning_segment_ids` |
| 20 | `page_earning_mode` |
| 21 | `page_earning_completion_threshold` |
| 22 | `page_earning_completion_counter` |
| 23 | `page_earning_tracker_widget_id` |
| 24 | `page_earning_tracker_threshold` |
| 25 | `randomizer_reveal_style` |

### `mom_self_restrictions` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `primary_parent_id` |
| 4 | `target_member_id` |
| 5 | `feature_key` |
| 6 | `restriction_type` |
| 7 | `restricted_tags` |
| 8 | `created_at` |
| 9 | `updated_at` |

### `morning_insight_questions` — 35 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `audience` |
| 4 | `category` |
| 5 | `question_text` |
| 6 | `is_active` |
| 7 | `sort_order` |
| 8 | `created_at` |

### `pending_changes` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `source_type` |
| 4 | `source_id` |
| 5 | `change_category` |
| 6 | `change_payload` |
| 7 | `trigger_mode` |
| 8 | `trigger_at` |
| 9 | `affected_deployment_ids` |
| 10 | `affected_member_ids` |
| 11 | `created_by` |
| 12 | `created_at` |
| 13 | `updated_at` |
| 14 | `applied_at` |
| 15 | `cancelled_at` |
| 16 | `batch_id` |

### `practice_log` — 10 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `source_type` |
| 5 | `source_id` |
| 6 | `draw_id` |
| 7 | `practice_type` |
| 8 | `duration_minutes` |
| 9 | `evidence_url` |
| 10 | `evidence_note` |
| 11 | `period_date` |
| 12 | `rejected` |
| 13 | `rejection_note` |
| 14 | `created_at` |

### `private_notes` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `about_member_id` |
| 4 | `author_id` |
| 5 | `content` |
| 6 | `is_included_in_ai` |
| 7 | `created_at` |
| 8 | `updated_at` |

### `randomizer_draws` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `list_id` |
| 3 | `list_item_id` |
| 4 | `family_member_id` |
| 5 | `drawn_at` |
| 6 | `draw_source` |
| 7 | `routine_instance_date` |
| 8 | `status` |
| 9 | `completed_at` |
| 10 | `practice_count` |
| 11 | `created_at` |

### `reflection_prompts` — 320 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `prompt_text` |
| 5 | `original_text` |
| 6 | `category` |
| 7 | `source` |
| 8 | `is_ephemeral` |
| 9 | `sort_order` |
| 10 | `archived_at` |
| 11 | `created_at` |
| 12 | `updated_at` |

### `reflection_responses` — 53 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `prompt_id` |
| 5 | `response_text` |
| 6 | `response_date` |
| 7 | `source_context` |
| 8 | `journal_entry_id` |
| 9 | `routed_destinations` |
| 10 | `created_at` |

### `relationship_notes` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `author_id` |
| 4 | `person_a_id` |
| 5 | `person_b_id` |
| 6 | `content` |
| 7 | `is_included_in_ai` |
| 8 | `created_at` |
| 9 | `updated_at` |

### `reveal_animations` — 33 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `slug` |
| 3 | `display_name` |
| 4 | `description` |
| 5 | `style_category` |
| 6 | `reveal_type` |
| 7 | `video_url` |
| 8 | `css_component` |
| 9 | `thumbnail_url` |
| 10 | `duration_seconds` |
| 11 | `sort_order` |
| 12 | `is_active` |
| 13 | `created_at` |

### `reward_reveal_attachments` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `reward_reveal_id` |
| 4 | `source_type` |
| 5 | `source_id` |
| 6 | `family_member_id` |
| 7 | `is_repeating` |
| 8 | `reveal_trigger_mode` |
| 9 | `reveal_trigger_n` |
| 10 | `times_revealed` |
| 11 | `last_revealed_at` |
| 12 | `is_active` |
| 13 | `created_at` |
| 14 | `updated_at` |

### `reward_reveals` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `created_by` |
| 4 | `name` |
| 5 | `animation_ids` |
| 6 | `animation_rotation` |
| 7 | `prize_mode` |
| 8 | `prize_type` |
| 9 | `prize_text` |
| 10 | `prize_name` |
| 11 | `prize_image_url` |
| 12 | `prize_asset_key` |
| 13 | `prize_randomizer_list_id` |
| 14 | `prize_pool` |
| 15 | `is_active` |
| 16 | `created_at` |
| 17 | `updated_at` |

### `rhythm_completions` — 17 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `rhythm_key` |
| 5 | `period` |
| 6 | `status` |
| 7 | `mood_triage` |
| 8 | `snoozed_until` |
| 9 | `metadata` |
| 10 | `completed_at` |
| 11 | `dismissed_at` |
| 12 | `created_at` |

### `rhythm_configs` — 68 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `rhythm_key` |
| 5 | `display_name` |
| 6 | `rhythm_type` |
| 7 | `enabled` |
| 8 | `sections` |
| 9 | `section_order_locked` |
| 10 | `timing` |
| 11 | `auto_open` |
| 12 | `reflection_guideline_count` |
| 13 | `source_template_id` |
| 14 | `archived_at` |
| 15 | `created_at` |
| 16 | `updated_at` |

### `shift_sessions` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `special_adult_id` |
| 4 | `started_at` |
| 5 | `ended_at` |
| 6 | `started_by` |
| 7 | `ended_by` |
| 8 | `summary_compiled` |
| 9 | `summary_text` |
| 10 | `is_co_parent_session` |
| 11 | `created_at` |

### `slideshow_slides` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `slide_type` |
| 4 | `image_url` |
| 5 | `text_body` |
| 6 | `source_guiding_star_id` |
| 7 | `sort_order` |
| 8 | `is_active` |
| 9 | `created_at` |

### `special_adult_permissions` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `assignment_id` |
| 4 | `feature_key` |
| 5 | `access_level` |
| 6 | `created_at` |
| 7 | `updated_at` |

### `spelling_coaching_cache` — 30 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `misspelling` |
| 3 | `correction` |
| 4 | `explanation` |
| 5 | `source` |
| 6 | `language` |
| 7 | `usage_count` |
| 8 | `created_at` |
| 9 | `updated_at` |

### `task_segments` — 8 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `family_member_id` |
| 4 | `segment_name` |
| 5 | `icon_key` |
| 6 | `sort_order` |
| 7 | `day_filter` |
| 8 | `creature_earning_enabled` |
| 9 | `segment_complete_celebration` |
| 10 | `randomizer_reveal_style` |
| 11 | `theme_override_id` |
| 12 | `is_active` |
| 13 | `created_at` |
| 14 | `updated_at` |

### `teen_sharing_overrides` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `member_id` |
| 4 | `feature_key` |
| 5 | `resource_id` |
| 6 | `original_visibility` |
| 7 | `new_visibility` |
| 8 | `created_at` |

### `view_as_permissions` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `viewer_id` |
| 4 | `target_member_id` |
| 5 | `enabled` |
| 6 | `excluded_features` |
| 7 | `created_at` |
| 8 | `updated_at` |

### `visual_schedule_member_assignments` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_member_id` |
| 3 | `routine_id` |
| 4 | `assigned_at` |
| 5 | `display_order` |

### `visual_schedule_member_tasks` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_member_id` |
| 3 | `asset_key` |
| 4 | `variant` |
| 5 | `custom_label` |
| 6 | `is_complete` |
| 7 | `scheduled_date` |
| 8 | `display_order` |
| 9 | `created_at` |
| 10 | `updated_at` |

### `visual_schedule_routine_steps` — 58 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `routine_id` |
| 3 | `step_order` |
| 4 | `asset_key` |
| 5 | `variant` |
| 6 | `custom_label` |
| 7 | `is_active` |
| 8 | `created_at` |

### `visual_schedule_routines` — 10 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `routine_key` |
| 4 | `display_name` |
| 5 | `description` |
| 6 | `icon_asset_key` |
| 7 | `icon_variant` |
| 8 | `is_system_routine` |
| 9 | `is_active` |
| 10 | `sort_order` |
| 11 | `created_at` |
| 12 | `updated_at` |

---

## Platform Intelligence Schema (`platform_intelligence.*`)

*Separate PostgreSQL schema — not queryable via PostgREST. Columns and row counts come from `information_schema`.*

### `platform_intelligence.board_personas` — 18 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `persona_name` |
| 3 | `persona_type` |
| 4 | `personality_profile` |
| 5 | `source_references` |
| 6 | `bookshelf_enriched` |
| 7 | `category` |
| 8 | `icon_emoji` |
| 9 | `content_policy_status` |
| 10 | `is_public` |
| 11 | `family_id` |
| 12 | `created_by` |
| 13 | `usage_count` |
| 14 | `embedding` |
| 15 | `created_at` |
| 16 | `updated_at` |

### `platform_intelligence.book_chunks` — 56964 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `book_library_id` |
| 3 | `chunk_index` |
| 4 | `chapter_index` |
| 5 | `chapter_title` |
| 6 | `text` |
| 7 | `embedding` |
| 8 | `tokens_count` |
| 9 | `created_at` |

### `platform_intelligence.book_extractions` — 89966 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `book_library_id` |
| 3 | `extraction_type` |
| 4 | `text` |
| 5 | `guided_text` |
| 6 | `independent_text` |
| 7 | `content_type` |
| 8 | `declaration_text` |
| 9 | `style_variant` |
| 10 | `value_name` |
| 11 | `richness` |
| 12 | `section_title` |
| 13 | `section_index` |
| 14 | `sort_order` |
| 15 | `audience` |
| 16 | `is_key_point` |
| 17 | `is_from_go_deeper` |
| 18 | `is_deleted` |
| 19 | `created_at` |
| 20 | `updated_at` |
| 21 | `source_part_number` |
| 22 | `embedding` |

### `platform_intelligence.book_library` — 583 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `title` |
| 3 | `author` |
| 4 | `isbn` |
| 5 | `genres` |
| 6 | `tags` |
| 7 | `ai_summary` |
| 8 | `toc` |
| 9 | `chunk_count` |
| 10 | `title_author_embedding` |
| 11 | `ethics_gate_status` |
| 12 | `created_at` |
| 13 | `updated_at` |
| 14 | `extraction_status` |
| 15 | `extraction_count` |
| 16 | `discovered_sections` |

### `platform_intelligence.persona_promotion_queue` — 0 rows

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `requested_persona_name` |
| 3 | `submitted_by_family_id` |
| 4 | `submitted_by_member_id` |
| 5 | `promoted_from_personal_id` |
| 6 | `proposed_personality_profile` |
| 7 | `source_references` |
| 8 | `category` |
| 9 | `icon_emoji` |
| 10 | `classifier_confidence` |
| 11 | `classifier_signals` |
| 12 | `classifier_reasoning` |
| 13 | `content_policy_pre_screen_status` |
| 14 | `embedding` |
| 15 | `status` |
| 16 | `reviewer_id` |
| 17 | `decided_at` |
| 18 | `admin_notes` |
| 19 | `approved_persona_id` |
| 20 | `created_at` |
| 21 | `updated_at` |

---

> **Summary:** 126 API-exposed tables in domain sections | 62 API-exposed but uncatalogued | 0 migration-only (`public`) tables | 5 `platform_intelligence` tables | 20 DOMAIN_ORDER entries missing from live database
>
> **Migration-only tables** exist in the database but aren't in the PostgREST schema cache. They are accessible from Edge Functions and direct SQL. To expose them via the REST API, add the schema/table to the API grant.
>
> **DOMAIN_ORDER missing entries** are tables that `scripts/full-schema-dump.cjs` expects to see but that don't exist in the live database. Most common cause: the owning PRD was planned but the migration hasn't been built yet. Each is flagged inline in its domain section.
>
> **Pending function-only migrations (not yet applied):** 100207–100210 create/replace SQL functions (`execute_allowance_godmother`, `execute_numerator_godmother`, `execute_money_godmother`, `execute_points_godmother`, `grant_money`, `grant_points`, upgraded `dispatch_godmothers`). No new tables or columns. Run `npm run schema:dump` after applying to refresh this file.
