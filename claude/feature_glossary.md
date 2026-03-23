# MyAIM Central — Feature Glossary

> Authoritative reference for every feature in the platform, organized by domain.
> Each entry maps a PRD to its display name, database tables, feature keys, subscription tier, and MVP status.

---

## Foundation (PRD-01 through PRD-04)

| PRD | Feature | Key Tables | Feature Keys | Tier | Status |
|-----|---------|-----------|-------------|------|--------|
| PRD-01 | Auth & Family Setup | `families`, `family_members`, `special_adult_assignments` | (infrastructure) | Essential | MVP |
| PRD-02 | Permissions & Access Control | `member_permissions`, `feature_access_v2`, `member_feature_toggles`, `staff_permissions`, `view_as_sessions` | (infrastructure) | Essential | MVP |
| PRD-03 | Design System & Themes | (CSS/config) | (infrastructure) | Essential | MVP |
| PRD-04 | Shell Routing & Layouts | `dashboard_configs` | (infrastructure) | Essential | MVP |

---

## AI System (PRD-05, PRD-05C)

| PRD | Feature | Key Tables | Feature Keys | Tier | Status |
|-----|---------|-----------|-------------|------|--------|
| PRD-05 | LiLa Core AI System | `lila_conversations`, `lila_messages`, `lila_guided_modes`, `lila_tool_permissions` | `lila_drawer`, `lila_help`, `lila_assist`, `lila_modal_access` | Essential-Enhanced | MVP |
| PRD-05C | LiLa Optimizer | `optimizer_outputs`, `optimization_patterns`, `user_prompt_templates`, `context_presets`, `ai_usage_tracking` | `lila_optimizer`, `optimizer_templates`, `optimizer_context_presets`, `optimizer_credits` | Enhanced+ | MVP |

---

## Personal Growth (PRD-06 through PRD-13)

| PRD | Feature | Key Tables | Feature Keys | Tier | Status |
|-----|---------|-----------|-------------|------|--------|
| PRD-06 | GuidingStars & BestIntentions | `guiding_stars`, `best_intentions`, `intention_iterations` | `guiding_stars_basic`, `guiding_stars_ai_craft`, `best_intentions` | Essential-Enhanced | MVP |
| PRD-07 | InnerWorkings | `self_knowledge` | `innerworkings_basic`, `innerworkings_upload`, `innerworkings_discovery`, `innerworkings_context` | Essential-Enhanced | MVP |
| PRD-08 | Journal & Smart Notepad | `journal_entries`, `notepad_tabs`, `notepad_extracted_items` | `notepad_basic`, `notepad_voice`, `notepad_review_route`, `journal_basic`, `journal_ai_tags` | Essential-Enhanced | MVP |
| PRD-09A | Tasks, Routines & Opportunities | `tasks`, `task_assignments`, `task_completions`, `task_templates`, `task_template_sections`, `task_template_steps`, `routine_step_completions`, `sequential_collections`, `task_claims`, `task_queue`, `task_rewards` | `tasks_basic`, `tasks_views_full`, `tasks_family_assignment`, `tasks_routines`, `tasks_opportunities`, `tasks_sequential`, `tasks_task_breaker_text`, `tasks_task_breaker_image`, `tasks_templates`, `tasks_pomodoro` | Essential-Full Magic | MVP |
| PRD-09B | Lists, Studio & Templates | `lists`, `list_items`, `list_shares`, `list_templates`, `studio_queue` | (shared with PRD-09A) | Essential-Enhanced | MVP |
| PRD-10 | Widgets, Trackers & Dashboard Layout | `dashboard_widgets`, `dashboard_widget_folders`, `widget_data_points`, `widget_templates`, `coloring_image_library`, `color_reveal_progress`, `coloring_gallery` | `widgets` | TBD post-beta | MVP |
| PRD-11 | Victory Recorder & DailyCelebration | `victories`, `victory_celebrations`, `victory_voice_preferences` | `victories_basic`, `victories_auto_route`, `celebration_highlights`, `celebration_detailed`, `celebration_voice`, `victory_week_view`, `victory_life_area_tags`, `victory_custom_tags`, `victory_mom_picks` | Essential-Enhanced | MVP |
| PRD-11B | Family Celebration | `family_victory_celebrations` | `family_celebration_basic`, `family_celebration_detailed`, `family_celebration_voice`, `family_celebration_archive` | Enhanced-Full Magic | MVP |
| PRD-12A | Personal LifeLantern | `life_lantern_areas`, `life_lantern_area_snapshots`, `life_lantern_role_models`, `personal_vision_statements` | `life_lantern`, `life_lantern_voice`, `life_lantern_teen` | TBD | MVP |
| PRD-12B | Family Vision Quest | `family_vision_quests`, `vision_sections`, `vision_section_history`, `vision_section_responses`, `vision_section_discussions`, `family_vision_statements` | `family_vision_quest`, `family_vision_discussion`, `family_vision_guiding_stars` | TBD | MVP |
| PRD-13 | Archives & Context | `archive_folders`, `archive_context_items`, `archive_member_settings`, `faith_preferences`, `context_learning_dismissals` | `archives_browse`, `archives_member_folders`, `archives_family_overview`, `archives_faith_preferences`, `archives_context_learning`, `archives_context_export` | TBD | MVP |

---

## Dashboards (PRD-14 family)

| PRD | Feature | Key Tables | Feature Keys | Tier | Status |
|-----|---------|-----------|-------------|------|--------|
| PRD-14 | Personal Dashboard | `dashboard_configs` | `personal_dashboard`, `dashboard_section_reorder` | Essential | MVP |
| PRD-14B | Calendar | `calendar_events`, `event_attendees`, `event_categories`, `calendar_settings` | `calendar_basic`, `calendar_family`, `calendar_ai_intake`, `calendar_queue` | Essential-Enhanced | MVP |
| PRD-14C | Family Overview | `family_overview_configs` | `family_overview` | Enhanced | MVP |
| PRD-14D | Family Hub | `family_hub_configs`, `countdowns` | `family_hub` | Enhanced | MVP |
| PRD-14E | Family Hub TV Mode | (uses `family_hub_configs`) | `family_hub_tv_mode` | Enhanced | MVP |
| PRD-25 | Guided Dashboard | (uses `dashboard_configs`) | (guided shell) | Essential | MVP |
| PRD-26 | Play Dashboard | (uses `dashboard_configs`) | (play shell) | Essential | MVP |

---

## Communication (PRD-15 through PRD-17B)

| PRD | Feature | Key Tables | Feature Keys | Tier | Status |
|-----|---------|-----------|-------------|------|--------|
| PRD-15 | Messages, Requests & Notifications | `conversation_spaces`, `conversation_threads`, `messages`, `message_read_status`, `messaging_settings`, `member_messaging_permissions`, `family_requests`, `notifications`, `notification_preferences`, `out_of_nest_members` | `messaging_basic`, `messaging_groups`, `messaging_lila`, `messaging_coaching`, `messaging_content_corner`, `messaging_out_of_nest`, `requests_basic`, `notifications_basic` | Essential-Enhanced | MVP |
| PRD-16 | Meetings | `meetings`, `meeting_participants`, `meeting_schedules`, `meeting_templates`, `meeting_template_sections`, `meeting_agenda_items` | `meetings_basic`, `meetings_shared`, `meetings_ai`, `meetings_custom_templates` | Essential-Full Magic | MVP |
| PRD-17 | Universal Queue & Routing System | `studio_queue` (authoritative) | `studio_queue`, `queue_modal`, `queue_quick_mode`, `routing_strip`, `queue_batch_processing` | Essential-Enhanced | MVP |
| PRD-17B | MindSweep | `mindsweep_settings`, `mindsweep_holding`, `mindsweep_allowed_senders`, `mindsweep_events`, `mindsweep_approval_patterns` | `mindsweep_manual`, `mindsweep_auto`, `mindsweep_email`, `mindsweep_share`, `mindsweep_pwa` | Essential-Full Magic | MVP |

---

## Daily Life (PRD-18 through PRD-20)

| PRD | Feature | Key Tables | Feature Keys | Tier | Status |
|-----|---------|-----------|-------------|------|--------|
| PRD-18 | Rhythms & Reflections | `rhythm_configs`, `rhythm_completions`, `reflection_prompts`, `reflection_responses` | `rhythms_basic`, `rhythms_periodic`, `rhythms_custom`, `reflections_basic`, `reflections_custom` | Essential-Enhanced | MVP |
| PRD-19 | Family Context & Relationships | `member_documents`, `private_notes`, `relationship_notes`, `guided_interview_progress`, `monthly_data_aggregations`, `generated_reports` | `archives_enhanced_member`, `archives_guided_interview`, `archives_document_upload`, `archives_relationship_notes`, `archives_reports_basic` | Enhanced-Full Magic | MVP |
| PRD-20 | Safe Harbor | `safe_harbor_orientation_completions`, `safe_harbor_literacy_completions`, `safe_harbor_consent_records` | `safe_harbor`, `safe_harbor_guided` | Enhanced/Full Magic TBD | MVP |

---

## AI Vault (PRD-21 through PRD-23)

| PRD | Feature | Key Tables | Feature Keys | Tier | Status |
|-----|---------|-----------|-------------|------|--------|
| PRD-21 | Communication & Relationship Tools | `communication_drafts`, `teaching_skill_history` | `tool_quality_time`, `tool_gifts`, `tool_observe_serve`, `tool_words_affirmation`, `tool_gratitude`, `tool_cyrano`, `tool_higgins_say`, `tool_higgins_navigate` | Enhanced-Full Magic | MVP |
| PRD-21A | AI Vault Browse & Content | `vault_items`, `vault_categories`, `vault_prompt_entries`, `vault_collection_items`, `vault_user_bookmarks`, `vault_user_progress`, `vault_user_visits`, `vault_first_sightings`, `vault_tool_sessions`, `vault_copy_events`, `user_saved_prompts`, `vault_content_requests` | `vault_browse`, `vault_consume`, `vault_optimize_lila`, `vault_prompt_library`, `vault_request_content` | Essential-Enhanced | MVP |
| PRD-21B | AI Vault Admin | (uses `vault_items`, `staff_permissions`) | `vault_admin` | Admin | MVP |
| PRD-21C | AI Vault Engagement & Community | `vault_engagement`, `vault_comments`, `vault_comment_reports`, `vault_moderation_log`, `vault_satisfaction_signals`, `vault_engagement_config` | `vault_engagement_hearts`, `vault_engagement_comments` | Essential | MVP |
| PRD-22 | Settings | `member_emails`, `lila_member_preferences`, `data_exports`, `account_deletions` | `settings_basic`, `settings_family_management`, `settings_data_export`, `settings_multi_email` | Essential-Enhanced | MVP |
| PRD-23 | BookShelf | `bookshelf_items`, `bookshelf_chapters`, `bookshelf_chunks`, `bookshelf_summaries`, `bookshelf_principles`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions`, `bookshelf_discussions`, `bookshelf_discussion_messages`, `bookshelf_collections`, `bookshelf_collection_items`, `journal_prompts`, `bookshelf_member_settings`, `platform_intelligence.book_cache` | `bookshelf_browse`, `bookshelf_upload`, `bookshelf_extract`, `bookshelf_discuss`, `bookshelf_export` | Essential-Full Magic | MVP |

---

## Gamification (PRD-24 family)

| PRD | Feature | Key Tables | Feature Keys | Tier | Status |
|-----|---------|-----------|-------------|------|--------|
| PRD-24 | Gamification Foundation | `gamification_configs`, `gamification_events`, `gamification_rewards`, `reward_redemptions`, `treasure_boxes`, `treasure_box_opens`, `gamification_achievements`, `gamification_daily_summaries` | `gamification_basic`, `gamification_rewards_advanced`, `gamification_reveal_visuals`, `gamification_treasure_animations`, `gamification_leaderboard` | Essential (beta) | MVP |
| PRD-24A | Overlay Engine & Game Modes | `overlay_instances`, `overlay_collectibles`, `recipe_completions`, `dashboard_backgrounds` | `gamification_visual_worlds`, `gamification_overlays` | Enhanced-Full Magic | MVP |
| PRD-24B | Gamification Visuals & Interactions | (uses gamification tables) | `gamification_reveal_visuals` | Enhanced | MVP |

---

## Platform Complete (PRD-27 through PRD-38)

| PRD | Feature | Key Tables | Feature Keys | Tier | Status |
|-----|---------|-----------|-------------|------|--------|
| PRD-27 | Caregiver Tools | `trackable_event_categories`, `trackable_event_logs`, `shift_reports` | `caregiver_access`, `caregiver_trackable_events`, `caregiver_shift_reports`, `caregiver_custody_schedule` | Enhanced-Full Magic | MVP |
| PRD-28 | Tracking, Allowance & Financial | `allowance_configs`, `financial_transactions`, `allowance_periods`, `loans`, `homeschool_subjects`, `homeschool_configs`, `homeschool_time_logs` | `tracking_allowance`, `tracking_financial_transactions`, `tracking_homeschool_subjects`, `tracking_opportunity_earnings`, `tracking_loans_deductions`, `tracking_homeschool_time` | Essential-Full Magic | MVP |
| PRD-28B | Compliance & Progress Reporting | `homeschool_family_config`, `homeschool_student_config`, `education_standards`, `standard_evidence`, `report_templates`, `esa_invoices` | `compliance_basic_reports`, `compliance_ai_reports`, `compliance_standards_tracking`, `compliance_esa_invoice` | Essential-Full Magic | MVP |
| PRD-29 | BigPlans | `plans`, `plan_milestones`, `plan_components`, `plan_check_ins`, `friction_diagnosis_templates` | `bigplans_create`, `bigplans_ai_compile`, `bigplans_check_ins`, `bigplans_friction_detection`, `bigplans_system_design` | Enhanced-Full Magic | MVP |
| PRD-30 | Safety Monitoring | `safety_monitoring_configs`, `safety_sensitivity_configs`, `safety_notification_recipients`, `safety_flags`, `safety_keywords`, `safety_resources`, `safety_pattern_summaries` | `safety_monitoring_basic`, `safety_monitoring_ai` | Enhanced-Full Magic | MVP |
| PRD-34 | ThoughtSift | `board_personas`, `board_sessions`, `board_session_personas`, `persona_favorites`, `perspective_lenses`, `decision_frameworks` | `thoughtsift_board_of_directors`, `thoughtsift_perspective_shifter`, `thoughtsift_decision_guide`, `thoughtsift_mediator`, `thoughtsift_translator` | Enhanced-Full Magic | MVP |
| PRD-37 | Family Feeds | `family_moments`, `moment_media`, `moment_reactions`, `moment_comments`, `out_of_nest_feed_settings`, `feed_approval_settings` | `family_feed_basic`, `family_feed_portfolio`, `family_feed_bulk_summary`, `family_feed_auto_tagging`, `family_feed_out_of_nest` | Essential-Full Magic | MVP |
| PRD-38 | Blog (Cookie Dough) | `blog_posts`, `blog_engagement`, `blog_comments`, `blog_free_tools`, `blog_categories` | (public, no tier gating) | Public | MVP |

---

## Scale & Monetize (PRD-31 through PRD-33)

| PRD | Feature | Key Tables | Feature Keys | Tier | Status |
|-----|---------|-----------|-------------|------|--------|
| PRD-31 | Subscription Tier System | `feature_access_v2`, `feature_key_registry`, `member_feature_toggles`, `ai_credits`, `credit_packs`, `tier_sampling_costs`, `tier_sample_sessions`, `onboarding_milestones`, `subscription_cancellations` | (infrastructure) | Essential | MVP |
| PRD-32 | Admin Console | `feedback_submissions`, `known_issues`, `reported_threats`, `admin_notes`, `ai_usage_log`, `platform_usage_log` | (admin-gated via `staff_permissions`) | Admin | MVP |
| PRD-32A | Demand Validation Engine | `feature_demand_responses` | (embedded via PlannedExpansionCard) | Essential | MVP |
| PRD-33 | Offline / PWA | (IndexedDB, service worker) | (infrastructure) | Essential | Post-MVP |

---

## Infrastructure (PRD-35, PRD-36)

| PRD | Feature | Key Tables | Feature Keys | Tier | Status |
|-----|---------|-----------|-------------|------|--------|
| PRD-35 | Universal Scheduler | `access_schedules` (replaces `shift_schedules`) | `scheduler_basic`, `scheduler_custom`, `scheduler_advanced`, `scheduler_lila_extract` | Essential-Full Magic | MVP |
| PRD-36 | Universal Timer | `time_sessions`, `timer_configs` | `timer_basic`, `timer_advanced`, `timer_visual` | Essential-Enhanced | MVP |

---

## Pricing Reference (PRD-31 Authoritative)

| Tier | Monthly Price | Founding Rate |
|------|-------------|---------------|
| Essential | $9.99 | $7.99 |
| Enhanced | $16.99 | $13.99 |
| Full Magic | $24.99 | $20.99 |
| Creator | $39.99 | $34.99 |

- 100 founding family limit
- Growing dollar discount (the longer you stay, the more you save)
- Founding rate is lost on cancellation or non-payment past the 14-day grace period

---

## Quick Stats

- **Total PRDs:** 42 (PRD-01 through PRD-38, including sub-PRDs)
- **Total unique feature keys:** 130+
- **MVP features:** All except PRD-33 (Offline/PWA)
- **Post-MVP:** PRD-33 (Offline/PWA)
- **Tier TBD:** PRD-10 (Widgets), PRD-12A (LifeLantern), PRD-12B (Vision Quest), PRD-13 (Archives)
