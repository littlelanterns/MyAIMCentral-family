# Build Order — MyAIM Central v2

Master build sequence. Each phase includes PRD references, tables created, dependencies, complexity, and extraction needs.

## Phase 00: Project Setup & Infrastructure
- **PRDs:** None (infrastructure only)
- **Tables:** None (extensions + schema setup)
- **Dependencies:** None
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Vite + React 19 project scaffold, Supabase project creation, pgvector/pgmq/pg_net/pg_cron extensions, platform_intelligence schema, embed Edge Function, Vercel deployment, CI/CD pipeline, TypeScript config, Tailwind setup, testing framework

## Phase 01: Auth & Family Setup
- **PRDs:** PRD-01
- **Tables:** families, family_members, special_adult_assignments
- **Dependencies:** Phase 00
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Account creation, family setup, member roles, PIN/visual password auth, tablet hub, member invitations, Supabase Auth integration

## Phase 02: Permissions & Access Control
- **PRDs:** PRD-02
- **Tables:** member_permissions, staff_permissions, view_as_sessions
- **Dependencies:** Phase 01
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Role-based access, RLS policies, PermissionGate component, useCanAccess hook, View As system, permission hub, transparency panel

## Phase 03: Design System & Themes
- **PRDs:** PRD-03
- **Tables:** None (CSS/config)
- **Dependencies:** Phase 01
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Theme system, vibe system, CSS custom properties, 50+ color themes, gradient toggle, dark mode, responsive foundation, Lucide icon setup

## Phase 04: Shell Routing & Layouts
- **PRDs:** PRD-04
- **Tables:** dashboard_configs
- **Dependencies:** Phase 02, 03
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Five shell layouts (Mom/Adult/Independent/Guided/Play), sidebar navigation, five interaction zones, routing guards, perspective switcher, QuickTasks drawer, breathing glow convention

## Phase 05: Universal Scheduler & Timer
- **PRDs:** PRD-35, PRD-36
- **Tables:** access_schedules, time_sessions, timer_configs
- **Dependencies:** Phase 04
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** UniversalScheduler component (RRULE-based), UniversalTimer component (clock/pomodoro/stopwatch/countdown), floating timer bubble, Play mode visual timers

## Phase 06: LiLa Core AI System
- **PRDs:** PRD-05
- **Tables:** lila_conversations, lila_messages, lila_guided_modes, lila_tool_permissions
- **Dependencies:** Phase 04
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** LiLa conversation engine, drawer/modal UI, guided mode registry, context assembly pipeline, 4 core modes (Help/Assist/Optimizer/General), crisis override, streaming responses

## Phase 07: GuidingStars & BestIntentions
- **PRDs:** PRD-06
- **Tables:** guiding_stars, best_intentions, intention_iterations
- **Dependencies:** Phase 06
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** GuidingStars page, BestIntentions page, Craft with LiLa, iteration tracking, confetti celebration, context assembly integration

## Phase 08: InnerWorkings
- **PRDs:** PRD-07
- **Tables:** self_knowledge
- **Dependencies:** Phase 06
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** InnerWorkings page, 5 categories, manual/upload/bulk add/LiLa guided input paths, sharing model, context integration

## Phase 09: Journal & Smart Notepad
- **PRDs:** PRD-08
- **Tables:** journal_entries, notepad_tabs, notepad_extracted_items, notepad_routing_stats
- **Dependencies:** Phase 06
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Smart Notepad (right drawer, tabs, autosave), Journal (timeline, tags, filtering), Review & Route extraction, 9 routing destinations, voice-to-text

## Phase 10: Tasks, Lists, Studio & Templates
- **PRDs:** PRD-09A, PRD-09B
- **Tables:** task_templates, task_template_sections, task_template_steps, tasks, task_assignments, task_completions, routine_step_completions, sequential_collections, task_claims, task_rewards, lists, list_items, list_shares, list_templates
- **Dependencies:** Phase 05, 09
- **Complexity:** Very Large
- **Extraction Pull:** None
- **What it delivers:** Task engine (14 views), routines, opportunities, Task Breaker AI, Focus Timer integration, Studio template workshop, Lists page, task approval workflows

## Phase 11: Widgets, Trackers & Dashboard Layout
- **PRDs:** PRD-10
- **Tables:** dashboard_widgets, dashboard_widget_folders, widget_data_points, widget_templates, coloring_image_library, color_reveal_progress, coloring_gallery
- **Dependencies:** Phase 10
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Widget Template Library (19 types, 75+ variants), dashboard grid layout, Track This flow, multiplayer widgets, Color-Reveal tracker

## Phase 12: Victory Recorder & Family Celebration
- **PRDs:** PRD-11, PRD-11B
- **Tables:** victories, victory_celebrations, victory_voice_preferences, family_victory_celebrations
- **Dependencies:** Phase 07, 10, 11
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Quick victory capture, AIR (auto-routing from tasks/intentions/trackers), celebration narrative generation, voice selection, family celebration mode, archive

## Phase 13: Archives & Context
- **PRDs:** PRD-13
- **Tables:** archive_folders, archive_context_items, archive_member_settings, faith_preferences, context_learning_dismissals
- **Dependencies:** Phase 07, 08, 09
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Archive folder hierarchy, context management, three-tier toggles, faith preferences, context learning write-back, Privacy Filtered category, context export

## Phase 14: Personal Dashboard & Calendar
- **PRDs:** PRD-14, PRD-14B
- **Tables:** calendar_events, event_attendees, event_categories, calendar_settings
- **Dependencies:** Phase 05, 10, 11
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Personal dashboard (hybrid section/widget layout), Calendar (event CRUD, approval queue, OCR intake, Universal Queue Modal)

## Phase 15: Family Overview, Hub & TV Mode
- **PRDs:** PRD-14C, PRD-14D, PRD-14E
- **Tables:** family_overview_configs, family_hub_configs, countdowns
- **Dependencies:** Phase 14
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Family Overview (aggregated view), Family Hub (shared coordination), TV Mode (landscape PWA), countdowns, slideshow frame

## Phase 16: Messages, Requests & Notifications
- **PRDs:** PRD-15
- **Tables:** conversation_spaces, conversation_space_members, conversation_threads, messages, message_read_status, messaging_settings, member_messaging_permissions, message_coaching_settings, family_requests, notifications, notification_preferences, out_of_nest_members
- **Dependencies:** Phase 06
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Messaging system (spaces/threads/messages), message coaching, Content Corner, Out of Nest, requests, notification infrastructure

## Phase 17: Meetings
- **PRDs:** PRD-16
- **Tables:** meetings, meeting_participants, meeting_schedules, meeting_templates, meeting_template_sections, meeting_agenda_items
- **Dependencies:** Phase 10, 16
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Meeting management, agenda system, LiLa facilitation, action item routing, meeting summaries to journal

## Phase 18: Universal Queue & MindSweep
- **PRDs:** PRD-17, PRD-17B
- **Tables:** studio_queue (authoritative), mindsweep_settings, mindsweep_holding, mindsweep_allowed_senders, mindsweep_events, mindsweep_approval_patterns
- **Dependencies:** Phase 10, 16
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Universal Queue Modal (tabs), RoutingStrip, Sort tab, batch processing, MindSweep capture (voice/text/scan/email), auto-routing, email forwarding

## Phase 19: Rhythms & Reflections
- **PRDs:** PRD-18
- **Tables:** rhythm_configs, rhythm_completions, reflection_prompts, reflection_responses
- **Dependencies:** Phase 07, 09, 12, 14
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Morning/Evening/Periodic rhythms, 26+ section types, reflection prompts, DailyCelebration for guided children

## Phase 20: Family Context & Relationships
- **PRDs:** PRD-19
- **Tables:** member_documents, private_notes, relationship_notes, guided_interview_progress, monthly_data_aggregations, generated_reports
- **Dependencies:** Phase 13
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Enhanced Archives with context prioritization, guided interview, document upload, private notes, relationship notes, monthly aggregation, alias system, AI Toolbox page

## Phase 21: Safe Harbor
- **PRDs:** PRD-20
- **Tables:** safe_harbor_orientation_completions, safe_harbor_literacy_completions, safe_harbor_consent_records
- **Dependencies:** Phase 06, 13, 20
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Safe Harbor landing/history, conversation modes, orientation (6 scenarios), teen AI literacy module, hold harmless, guided child "Help Me Talk to Someone", safety concern protocol

## Phase 22: LifeLantern & Family Vision Quest
- **PRDs:** PRD-12A, PRD-12B
- **Tables:** life_lantern_areas, life_lantern_area_snapshots, life_lantern_role_models, personal_vision_statements, family_vision_quests, vision_sections, vision_section_history, vision_section_responses, vision_section_discussions, family_vision_statements
- **Dependencies:** Phase 07, 08, 13
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Personal LifeLantern (6 life areas, assessment, vision, goals), Family Vision Quest (async survey, synthesis, Family Vision Statement)

## Phase 23: LiLa Optimizer
- **PRDs:** PRD-05C
- **Tables:** optimizer_outputs, user_prompt_templates, context_presets, ai_usage_tracking
- **Dependencies:** Phase 06, 13
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Prompt optimization engine, context presets, user templates, BYOK support, credit tracking

## Phase 24: Communication & Relationship Tools
- **PRDs:** PRD-21
- **Tables:** communication_drafts, teaching_skill_history
- **Dependencies:** Phase 06, 20
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Love Languages tools (5), Cyrano, Higgins Say/Navigate, AI Toolbox integration, person pill selector, Skill-Check mode

## Phase 25: AI Vault Browse & Admin
- **PRDs:** PRD-21A, PRD-21B
- **Tables:** vault_items, vault_categories, vault_prompt_entries, vault_collection_items, vault_user_bookmarks, vault_user_progress, vault_user_visits, vault_first_sightings, vault_tool_sessions, vault_copy_events, user_saved_prompts, vault_content_requests
- **Dependencies:** Phase 06, 23
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** AI Vault browse/consume, 6 content types, tier gating, NEW badges, content protection, admin content management (CRUD, categories, prompt pack editor)

## Phase 26: AI Vault Engagement & Community
- **PRDs:** PRD-21C
- **Tables:** vault_engagement, vault_comments, vault_comment_reports, vault_moderation_log, vault_satisfaction_signals, vault_engagement_config
- **Dependencies:** Phase 25
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Hearts, comments (threaded), Haiku auto-moderation, community reports, satisfaction signals, moderation queue, recommendation rows

## Phase 27: Settings
- **PRDs:** PRD-22
- **Tables:** member_emails, lila_member_preferences, data_exports, account_deletions
- **Dependencies:** Phase 04, 16
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Settings overlay (10 categories), account management, family management, appearance, notifications, privacy, LiLa preferences, data export, account deletion with 30-day grace

## Phase 28: BookShelf
- **PRDs:** PRD-23
- **Tables:** bookshelf_items, bookshelf_chapters, bookshelf_chunks, bookshelf_summaries, bookshelf_principles, bookshelf_declarations, bookshelf_action_steps, bookshelf_questions, bookshelf_discussions, bookshelf_discussion_messages, bookshelf_collections, bookshelf_collection_items, journal_prompts, bookshelf_member_settings, platform_intelligence.book_cache
- **Dependencies:** Phase 06, 13, 25
- **Complexity:** Very Large
- **Extraction Pull:** Yes — StewardShip book extraction data for seed content
- **What it delivers:** Book upload/processing, 5 extraction tabs, chapter-based organization, multi-book discussions with RAG, collections, hearted items, LiLa knowledge control, platform book cache

## Phase 29: Gamification
- **PRDs:** PRD-24, PRD-24A, PRD-24B
- **Tables:** gamification_configs, gamification_events, gamification_rewards, reward_redemptions, treasure_boxes, treasure_box_opens, gamification_achievements, gamification_daily_summaries, overlay_instances, overlay_collectibles, recipe_completions
- **Dependencies:** Phase 10, 12
- **Complexity:** Very Large
- **Extraction Pull:** None
- **What it delivers:** Points/streaks/levels, rewards, treasure boxes (8 reveal types), overlay engine (visual worlds, game modes), dashboard backgrounds, daily celebration pipeline, achievement badges

## Phase 30: Guided & Play Dashboards
- **PRDs:** PRD-25, PRD-26
- **Tables:** (uses dashboard_configs)
- **Dependencies:** Phase 14, 29
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Guided shell dashboard (simplified, prompted), Play shell dashboard (visual, sticker-based, emoji), DailyCelebration integration, gamification prominence

## Phase 31: Caregiver Tools
- **PRDs:** PRD-27
- **Tables:** trackable_event_categories, trackable_event_logs, shift_reports
- **Dependencies:** Phase 02, 05
- **Complexity:** Lean-Medium
- **Extraction Pull:** None
- **What it delivers:** CaregiverLayout (single-page, two-view), trackable events, shift reports, co-parent experience, custody schedule integration

## Phase 32: Tracking, Allowance & Compliance
- **PRDs:** PRD-28, PRD-28B
- **Tables:** allowance_configs, financial_transactions, allowance_periods, loans, homeschool_subjects, homeschool_configs, homeschool_time_logs, homeschool_family_config, homeschool_student_config, education_standards, standard_evidence, report_templates, esa_invoices
- **Dependencies:** Phase 05, 10, 11
- **Complexity:** Very Large
- **Extraction Pull:** None
- **What it delivers:** Allowance system, financial transactions, homeschool time tracking, compliance reporting (templates), standards tracking, ESA invoicing

## Phase 33: BigPlans
- **PRDs:** PRD-29
- **Tables:** plans, plan_milestones, plan_components, plan_check_ins, friction_diagnosis_templates
- **Dependencies:** Phase 06, 10, 12
- **Complexity:** Medium
- **Extraction Pull:** Yes — bigplans_condensed_intelligence.md for friction templates
- **What it delivers:** Project planning, milestone tracking, LiLa check-ins, friction detection, system design trial, deployed components

## Phase 34: Safety Monitoring
- **PRDs:** PRD-30
- **Tables:** safety_monitoring_configs, safety_sensitivity_configs, safety_notification_recipients, safety_flags, safety_keywords, safety_resources, safety_pattern_summaries
- **Dependencies:** Phase 06, 16
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Two-layer detection (keyword + Haiku), safety flags, weekly pattern summaries, admin keyword management, 3 locked categories

## Phase 35: ThoughtSift
- **PRDs:** PRD-34
- **Tables:** board_personas, board_sessions, board_session_personas, persona_favorites, perspective_lenses, decision_frameworks
- **Dependencies:** Phase 06, 20
- **Complexity:** Large
- **Extraction Pull:** Yes — thoughtsift_condensed_intelligence.md for persona/lens library seed
- **What it delivers:** 5 separate tools (Board of Directors, Perspective Shifter, Decision Guide, Mediator, Translator), persona library (3-tier), 15 decision frameworks

## Phase 36: Family Feeds
- **PRDs:** PRD-37
- **Tables:** family_moments, moment_media, moment_reactions, moment_comments, out_of_nest_feed_settings, feed_approval_settings
- **Dependencies:** Phase 09, 15, 16
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Family feed, portfolio tagging, media uploads, Out of Nest access, bulk summary mode, Log Learning widget

## Phase 37: Blog (Cookie Dough)
- **PRDs:** PRD-38
- **Tables:** blog_posts, blog_engagement, blog_comments, blog_free_tools, blog_categories
- **Dependencies:** Phase 03, 26
- **Complexity:** Medium
- **Extraction Pull:** None
- **What it delivers:** Public blog (aimagicformoms.com), Haiku comment moderation, geo-display, Showcase Feature pattern, free tools, dual-domain routing

## Phase 38: Subscription Tier System
- **PRDs:** PRD-31
- **Tables:** subscription_tiers, family_subscriptions (extended), feature_key_registry, feature_access_v2, member_feature_toggles, ai_credits, credit_packs, tier_sampling_costs, tier_sample_sessions, onboarding_milestones, subscription_cancellations
- **Dependencies:** Phase 02, 27
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Stripe integration, 4 tiers ($9.99/$16.99/$24.99/$39.99), founding family program, AI credit system, tier sampling, onboarding milestones (10 × 5 credits), subscription lifecycle

## Phase 39: Admin Console & Demand Validation
- **PRDs:** PRD-32, PRD-32A
- **Tables:** feedback_submissions, known_issues, reported_threats, admin_notes, ai_usage_log, platform_usage_log, feature_demand_responses
- **Dependencies:** Phase 25, 34, 38
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** Admin console (5 tabs), feedback system, AI cost monitoring, platform analytics, demand validation engine, PlannedExpansionCard component

## Phase 40: Offline / PWA
- **PRDs:** PRD-33
- **Tables:** None (IndexedDB, service worker)
- **Dependencies:** All phases
- **Complexity:** Large
- **Extraction Pull:** None
- **What it delivers:** 5 PWA entry points, IndexedDB sync, service worker, offline capture/queue, conflict resolution, visual indicators

## Phase 41: Tier Assignment Review
- **PRDs:** PRD-31 (seed data)
- **Tables:** None (data seeding)
- **Dependencies:** Phase 38
- **Complexity:** Small
- **Extraction Pull:** None
- **What it delivers:** Final tier assignment for all TBD feature keys based on actual AI costs and value assessment

---

## Summary

| Metric | Count |
|--------|-------|
| Total Build Phases | 42 (00-41) |
| Total PRDs Covered | 52+ |
| Total Database Tables | ~165 |
| Phases Needing Extraction | 3 (Phases 28, 33, 35) |
| Very Large Phases | 4 (Phases 10, 28, 29, 32) |
| Large Phases | 12 |
| Medium Phases | 17 |
| Small/Lean Phases | 9 |
