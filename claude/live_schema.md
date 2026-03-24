# Live Database Schema — MyAIM Central v2

> Auto-generated from live Supabase instance on 2026-03-24
> Regenerate: `node scripts/dump-schema.js`
> Tables found: 66 / 67

## `families`

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

## `family_members`

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `user_id` |
| 4 | `display_name` |
| 5 | `role` |
| 6 | `avatar_url` |
| 7 | `pin_hash` |
| 8 | `visual_password` |
| 9 | `login_method` |
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

## `special_adult_assignments`

*(empty table — columns exist but no sample row)*

## `member_permissions`

*(empty table — columns exist but no sample row)*

## `staff_permissions`

*(empty table — columns exist but no sample row)*

## `view_as_sessions`

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `family_id` |
| 3 | `viewer_id` |
| 4 | `viewing_as_id` |
| 5 | `started_at` |
| 6 | `ended_at` |

## `permission_presets`

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

## `access_schedules`

*(empty table — columns exist but no sample row)*

## `permission_level_profiles`

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `role_group` |
| 3 | `level` |
| 4 | `feature_key` |
| 5 | `feature_enabled` |
| 6 | `default_permission_level` |
| 7 | `created_at` |

## `subscription_tiers`

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

## `family_subscriptions`

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

## `feature_key_registry`

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `feature_key` |
| 3 | `display_name` |
| 4 | `description` |
| 5 | `prd_source` |
| 6 | `created_at` |

## `feature_access_v2`

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `feature_key` |
| 3 | `role_group` |
| 4 | `minimum_tier_id` |
| 5 | `is_enabled` |
| 6 | `created_at` |
| 7 | `updated_at` |

## `member_feature_toggles`

*(empty table — columns exist but no sample row)*

## `ai_credits`

*(empty table — columns exist but no sample row)*

## `credit_packs`

*(empty table — columns exist but no sample row)*

## `tier_sampling_costs`

*(empty table — columns exist but no sample row)*

## `tier_sample_sessions`

*(empty table — columns exist but no sample row)*

## `onboarding_milestones`

*(empty table — columns exist but no sample row)*

## `subscription_cancellations`

*(empty table — columns exist but no sample row)*

## `lila_conversations`

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

## `lila_messages`

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

## `lila_guided_modes`

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

## `lila_tool_permissions`

*(empty table — columns exist but no sample row)*

## `lila_member_preferences`

*(empty table — columns exist but no sample row)*

## `optimizer_outputs`

*(empty table — columns exist but no sample row)*

## `user_prompt_templates`

*(empty table — columns exist but no sample row)*

## `context_presets`

*(empty table — columns exist but no sample row)*

## `ai_usage_tracking`

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

## `guiding_stars`

*(empty table — columns exist but no sample row)*

## `best_intentions`

*(empty table — columns exist but no sample row)*

## `intention_iterations`

*(empty table — columns exist but no sample row)*

## `self_knowledge`

*(empty table — columns exist but no sample row)*

## `journal_entries`

*(empty table — columns exist but no sample row)*

## `notepad_tabs`

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

## `notepad_extracted_items`

*(empty table — columns exist but no sample row)*

## `notepad_routing_stats`

*(empty table — columns exist but no sample row)*

## `task_templates`

*(empty table — columns exist but no sample row)*

## `task_template_sections`

*(empty table — columns exist but no sample row)*

## `task_template_steps`

*(empty table — columns exist but no sample row)*

## `tasks`

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

## `task_assignments`

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

## `task_completions`

*(empty table — columns exist but no sample row)*

## `routine_step_completions`

*(empty table — columns exist but no sample row)*

## `sequential_collections`

*(empty table — columns exist but no sample row)*

## `task_claims`

*(empty table — columns exist but no sample row)*

## `task_rewards`

*(empty table — columns exist but no sample row)*

## `studio_queue`

*(empty table — columns exist but no sample row)*

## `lists`

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

## `list_items`

*(empty table — columns exist but no sample row)*

## `list_shares`

*(empty table — columns exist but no sample row)*

## `list_templates`

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

## `guided_form_responses`

*(empty table — columns exist but no sample row)*

## `dashboard_configs`

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

## `victories`

*(empty table — columns exist but no sample row)*

## `victory_celebrations`

*(empty table — columns exist but no sample row)*

## `victory_voice_preferences`

*(empty table — columns exist but no sample row)*

## `archive_folders`

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

## `archive_context_items`

*(empty table — columns exist but no sample row)*

## `archive_member_settings`

*(empty table — columns exist but no sample row)*

## `faith_preferences`

*(empty table — columns exist but no sample row)*

## `out_of_nest_members`

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

## `time_sessions`

*(empty table — columns exist but no sample row)*

## `timer_configs`

*(empty table — columns exist but no sample row)*

## `activity_log_entries`

*(empty table — columns exist but no sample row)*

## `platform_assets`

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

