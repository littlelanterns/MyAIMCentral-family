# MyAIM Central — Unified Database Schema

> **Generated for Family Platform v2**
> Total: ~165 tables across public and platform_intelligence schemas.
> All audit rulings applied: `self_knowledge`, `reveal_type`, `access_schedules`, `dashboard_background_key`, `bookshelf_insights`, PRD-15 messaging, PRD-17+17B `studio_queue`.

---

## Auth & Family (PRD-01, PRD-02)

### `families`
**PRD:** PRD-01 | **Domain:** auth_family

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| primary_parent_id | UUID | — | NO | FK auth.users |
| family_name | TEXT | — | NO | |
| family_login_name | TEXT | — | NO | UNIQUE, case-insensitive |
| family_login_name_lower | TEXT | — | NO | Auto-populated by trigger |
| is_founding_family | BOOLEAN | false | NO | |
| founding_family_rates | JSONB | — | YES | Locked pricing details |
| founding_onboarding_complete | BOOLEAN | false | NO | PRD-31 |
| founding_onboarding_grace_deadline | TIMESTAMPTZ | — | YES | PRD-31 |
| founding_family_lost_at | TIMESTAMPTZ | — | YES | PRD-31 |
| timezone | TEXT | 'America/Chicago' | NO | |
| tablet_hub_config | JSONB | — | YES | |
| tablet_hub_timeout | INTEGER | 300 | NO | Seconds |
| sweep_email_address | TEXT | — | YES | PRD-17B |
| sweep_email_enabled | BOOLEAN | false | NO | PRD-17B |
| analytics_opt_in | BOOLEAN | true | NO | PRD-22 |
| last_data_export_at | TIMESTAMPTZ | — | YES | PRD-22 |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read their own family. Only primary_parent can update.
**Indexes:** `idx_families_login_lower` ON family_login_name_lower; `idx_families_primary_parent` ON primary_parent_id
**Triggers:** `trg_families_login_lower` — BEFORE INSERT/UPDATE sets family_login_name_lower = lower(family_login_name); `trg_families_updated_at` — BEFORE UPDATE sets updated_at = now()

---

### `family_members`
**PRD:** PRD-01 | **Domain:** auth_family

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| user_id | UUID | — | YES | FK auth.users; NULL for PIN-only members |
| display_name | TEXT | — | NO | |
| role | TEXT | — | NO | CHECK: 'primary_parent','additional_adult','special_adult','independent','guided','play' |
| avatar_url | TEXT | — | YES | |
| pin_hash | TEXT | — | YES | |
| visual_password | JSONB | — | YES | |
| login_method | TEXT | — | YES | CHECK: 'email','pin','visual' |
| member_color | TEXT | — | YES | |
| calendar_color | TEXT | — | YES | PRD-14B |
| gamification_points | INTEGER | 0 | NO | PRD-24 |
| gamification_level | INTEGER | 1 | NO | PRD-24 |
| current_streak | INTEGER | 0 | NO | PRD-24 |
| longest_streak | INTEGER | 0 | NO | PRD-24 |
| last_task_completion_date | DATE | — | YES | PRD-24 |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read members of their own family. Primary parent can insert/update/deactivate.
**Indexes:** `idx_fm_family` ON family_id; `idx_fm_user` ON user_id; `idx_fm_role` ON (family_id, role)
**Triggers:** `trg_fm_updated_at` — BEFORE UPDATE sets updated_at = now()

---

### `special_adult_assignments`
**PRD:** PRD-01 | **Domain:** auth_family

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| special_adult_id | UUID | — | NO | FK family_members |
| child_id | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Special adult can read their own assignments.
**Indexes:** `idx_saa_family` ON family_id; `idx_saa_adult` ON special_adult_id; `idx_saa_child` ON child_id

---

### `member_permissions`
**PRD:** PRD-02 | **Domain:** auth_family

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| granting_member_id | UUID | — | NO | FK family_members |
| target_member_id | UUID | — | NO | FK family_members |
| permission_key | TEXT | — | NO | |
| permission_value | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent and granting member can manage. Target member can read.
**Indexes:** `idx_mp_family` ON family_id; `idx_mp_target` ON target_member_id; `idx_mp_key` ON (family_id, permission_key)
**Triggers:** `trg_mp_updated_at`

---

### `staff_permissions`
**PRD:** PRD-02 | **Domain:** auth_family

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| user_id | UUID | — | NO | FK auth.users |
| permission_type | TEXT | — | NO | CHECK: 'super_admin','vault_admin','moderation_admin','system_admin','analytics_admin','feedback_admin' |
| granted_by | UUID | — | NO | FK auth.users |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Only super_admin can manage. Staff can read own permissions.
**Indexes:** `idx_sp_user` ON user_id; `idx_sp_type` ON permission_type

---

### `view_as_sessions`
**PRD:** PRD-02 | **Domain:** auth_family

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| viewer_id | UUID | — | NO | FK family_members |
| viewing_as_id | UUID | — | NO | FK family_members |
| started_at | TIMESTAMPTZ | now() | NO | |
| ended_at | TIMESTAMPTZ | — | YES | |

**RLS:** Primary parent only.
**Indexes:** `idx_vas_family` ON family_id; `idx_vas_viewer` ON viewer_id; `idx_vas_active` ON (viewer_id) WHERE ended_at IS NULL

---

### `access_schedules`
**PRD:** PRD-35 | **Domain:** auth_family

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| schedule_type | TEXT | — | NO | CHECK: 'shift','custody','always_on' |
| recurrence_details | JSONB | — | YES | RRULE format per PRD-35 |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Scheduled member can read own.
**Indexes:** `idx_as_family` ON family_id; `idx_as_member` ON member_id; `idx_as_active` ON (family_id, is_active)
**Triggers:** `trg_as_updated_at`

---

## Subscription & Monetization (PRD-31)

### `subscription_tiers`
**PRD:** PRD-31 | **Domain:** subscription

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| name | TEXT | — | NO | |
| slug | TEXT | — | NO | UNIQUE |
| price_monthly | DECIMAL | — | NO | |
| price_yearly | DECIMAL | — | NO | |
| founding_discount | DECIMAL | — | YES | |
| monthly_ai_allotment | INTEGER | — | NO | |
| features_summary | JSONB | — | YES | |
| sort_order | INTEGER | — | NO | |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_st_slug` ON slug; `idx_st_active` ON is_active WHERE is_active = true
**Triggers:** `trg_st_updated_at`

---

### `family_subscriptions`
**PRD:** PRD-31 | **Domain:** subscription

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families, UNIQUE |
| tier_id | UUID | — | NO | FK subscription_tiers |
| status | TEXT | — | NO | CHECK: 'active','past_due','cancelled','trialing' |
| stripe_customer_id | TEXT | — | YES | |
| stripe_subscription_id | TEXT | — | YES | |
| pending_tier_id | UUID | — | YES | FK subscription_tiers |
| current_period_start | TIMESTAMPTZ | — | YES | |
| current_period_end | TIMESTAMPTZ | — | YES | |
| cancelled_at | TIMESTAMPTZ | — | YES | |
| past_due_since | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can read/update own family. Service role for Stripe webhooks.
**Indexes:** `idx_fs_family` ON family_id (unique); `idx_fs_stripe_cust` ON stripe_customer_id; `idx_fs_status` ON status
**Triggers:** `trg_fs_updated_at`

---

### `feature_key_registry`
**PRD:** PRD-31 | **Domain:** subscription

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| feature_key | TEXT | — | NO | UNIQUE |
| display_name | TEXT | — | NO | |
| description | TEXT | — | YES | |
| prd_source | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_fkr_key` ON feature_key (unique)

---

### `feature_access_v2`
**PRD:** PRD-31 | **Domain:** subscription

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| feature_key | TEXT | — | NO | FK feature_key_registry.feature_key |
| role_group | TEXT | — | NO | CHECK: 'mom','dad_adults','special_adults','independent_teens','guided_kids','play_kids' |
| minimum_tier_id | UUID | — | YES | FK subscription_tiers |
| is_enabled | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_fav2_key_role` ON (feature_key, role_group)
**Triggers:** `trg_fav2_updated_at`

---

### `member_feature_toggles`
**PRD:** PRD-31 | **Domain:** subscription

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| feature_key | TEXT | — | NO | FK feature_key_registry.feature_key |
| is_disabled | BOOLEAN | true | NO | Sparse: rows only when DISABLED |
| disabled_by | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Member can read own.
**Indexes:** `idx_mft_family_member` ON (family_id, member_id); `idx_mft_feature` ON feature_key

---

### `ai_credits`
**PRD:** PRD-31 | **Domain:** subscription

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| source | TEXT | — | NO | CHECK: 'tier_monthly_allotment','purchased','earned_onboarding','earned_promotion','tier_sample','ai_action_spent','expired','refund' |
| amount | INTEGER | — | NO | Positive for credits, negative for debits |
| balance_after | INTEGER | — | NO | |
| reference_id | UUID | — | YES | |
| expires_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read own family. NEVER UPDATE — append-only ledger.
**Indexes:** `idx_aic_family` ON family_id; `idx_aic_member` ON member_id; `idx_aic_expires` ON expires_at WHERE expires_at IS NOT NULL; `idx_aic_created` ON created_at DESC

---

### `credit_packs`
**PRD:** PRD-31 | **Domain:** subscription

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| name | TEXT | — | NO | |
| credits | INTEGER | — | NO | |
| price | DECIMAL | — | NO | |
| stripe_price_id | TEXT | — | YES | |
| is_active | BOOLEAN | true | NO | |
| sort_order | INTEGER | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_cp_active` ON is_active WHERE is_active = true

---

### `tier_sampling_costs`
**PRD:** PRD-31 | **Domain:** subscription

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| feature_key | TEXT | — | NO | FK feature_key_registry.feature_key |
| credits_per_session | INTEGER | 5 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_tsc_feature` ON feature_key

---

### `tier_sample_sessions`
**PRD:** PRD-31 | **Domain:** subscription

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| feature_key | TEXT | — | NO | FK feature_key_registry.feature_key |
| credits_spent | INTEGER | — | NO | |
| started_at | TIMESTAMPTZ | — | NO | |
| ended_at | TIMESTAMPTZ | — | YES | |

**RLS:** Family members can read own. Service role writes.
**Indexes:** `idx_tss_family_member` ON (family_id, member_id); `idx_tss_feature` ON feature_key

---

### `onboarding_milestones`
**PRD:** PRD-31 | **Domain:** subscription

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| milestone_key | TEXT | — | NO | CHECK: 'account_created','family_described','first_guiding_star','first_entry','first_task','first_archive_context','first_lila_conversation','first_best_intention','friction_finder','first_lifelantern_section' |
| completed_at | TIMESTAMPTZ | now() | NO | |
| credits_awarded | INTEGER | 5 | NO | |

**RLS:** Family members can read own family. Service role inserts.
**Indexes:** `idx_om_family` ON family_id; `idx_om_family_key` UNIQUE ON (family_id, milestone_key)

---

### `subscription_cancellations`
**PRD:** PRD-31 | **Domain:** subscription

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| reason | TEXT | — | YES | |
| feedback | TEXT | — | YES | |
| cancelled_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can insert. Admin can read.
**Indexes:** `idx_sc_family` ON family_id

---

## LiLa AI System (PRD-05, PRD-05C)

### `lila_conversations`
**PRD:** PRD-05 | **Domain:** lila_ai

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| mode | TEXT | 'general' | NO | CHECK: 'general','help','assist','optimizer' |
| guided_mode | TEXT | — | YES | FK lila_guided_modes.mode_key |
| guided_subtype | TEXT | — | YES | Specific subtype: 'cyrano', 'higgins_say', etc. |
| guided_mode_reference_id | UUID | — | YES | FK for person UUID, etc. |
| model_used | TEXT | — | YES | 'sonnet' or 'haiku' |
| context_snapshot | JSONB | '{}' | NO | Context sources when conversation started |
| title | TEXT | — | YES | AI auto-generated, user-editable |
| container_type | TEXT | 'drawer' | NO | CHECK: 'drawer','modal' |
| page_context | TEXT | — | YES | |
| is_safe_harbor | BOOLEAN | false | NO | PRD-20 |
| vault_item_id | UUID | — | YES | FK vault_items; PRD-21A |
| safety_scanned | BOOLEAN | false | NO | PRD-30 |
| status | TEXT | 'active' | NO | CHECK: 'active','archived','deleted' |
| message_count | INTEGER | 0 | NO | Denormalized count |
| token_usage | JSONB | '{"input":0,"output":0}' | NO | Cumulative token usage |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read/update own conversations. Parent can read children's (except safe_harbor).
**Indexes:** `idx_lc_family_member` ON (family_id, member_id); `idx_lc_status` ON status; `idx_lc_guided` ON guided_mode; `idx_lc_vault` ON vault_item_id WHERE vault_item_id IS NOT NULL; `idx_lc_member_status_updated` ON (member_id, status, updated_at DESC); `idx_lc_guided_subtype` ON (member_id, guided_subtype) WHERE guided_subtype IS NOT NULL
**Triggers:** `trg_lc_updated_at`

---

### `lila_messages`
**PRD:** PRD-05 | **Domain:** lila_ai

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| conversation_id | UUID | — | NO | FK lila_conversations (ON DELETE CASCADE) |
| role | TEXT | — | NO | CHECK: 'user','assistant','system' |
| content | TEXT | — | NO | |
| metadata | JSONB | '{}' | NO | Action chips, context used, teaching skill, persona attribution |
| token_count | INTEGER | — | YES | Tokens used for this message |
| safety_scanned | BOOLEAN | false | NO | PRD-30 |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from lila_conversations via conversation_id.
**Indexes:** `idx_lm_conversation` ON conversation_id; `idx_lm_created` ON created_at; `idx_lm_safety` ON (conversation_id, safety_scanned) WHERE safety_scanned = false

---

### `lila_guided_modes`
**PRD:** PRD-05 | **Domain:** lila_ai

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| mode_key | TEXT | — | NO | UNIQUE |
| display_name | TEXT | — | NO | |
| parent_mode | TEXT | — | YES | The guided_mode value on lila_conversations |
| avatar_key | TEXT | 'sitting' | NO | Which avatar: 'help','assist','optimizer','sitting', or custom |
| model_tier | TEXT | 'sonnet' | NO | CHECK: 'sonnet','haiku' |
| context_sources | TEXT[] | '{}' | NO | Array of context type keys to load |
| person_selector | BOOLEAN | false | NO | |
| opening_messages | JSONB | '[]' | NO | Array of opening message strings (min 2) |
| system_prompt_key | TEXT | — | NO | Reference to system prompt additions |
| available_to_roles | TEXT[] | '{"mom"}' | NO | |
| requires_feature_key | TEXT | — | YES | |
| sort_order | INTEGER | 0 | NO | Display ordering |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read.
**Indexes:** `idx_lgm_key` ON mode_key (unique); `idx_lgm_active_roles` ON (is_active, available_to_roles) WHERE is_active = true

---

### `lila_tool_permissions`
**PRD:** PRD-05 | **Domain:** lila_ai

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| mode_key | TEXT | — | NO | FK lila_guided_modes.mode_key |
| is_enabled | BOOLEAN | true | NO | |
| context_person_ids | UUID[] | '{}' | NO | Which people's context this member can access |
| include_family_context | BOOLEAN | false | NO | Whether family-level context is included |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Member can read own.
**Indexes:** `idx_ltp_family_member` ON (family_id, member_id); `idx_ltp_mode` ON mode_key; `idx_ltp_member_mode` UNIQUE ON (family_id, member_id, mode_key)
**Triggers:** `trg_ltp_updated_at`

---

### `lila_member_preferences`
**PRD:** PRD-22 | **Domain:** lila_ai

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| tone | TEXT | 'warm' | NO | CHECK: 'warm','professional','casual' |
| response_length | TEXT | 'balanced' | NO | CHECK: 'concise','balanced','detailed' |
| history_retention | TEXT | 'forever' | NO | CHECK: 'forever','90_days','30_days','7_days' |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Parent can read children's.
**Indexes:** `idx_lmp_family_member` UNIQUE ON (family_id, member_id)
**Triggers:** `trg_lmp_updated_at`

---

### `optimizer_outputs`
**PRD:** PRD-05C | **Domain:** lila_ai

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| conversation_id | UUID | — | NO | FK lila_conversations |
| output_content | TEXT | — | NO | |
| metadata | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from lila_conversations.
**Indexes:** `idx_oo_conversation` ON conversation_id

---

### `user_prompt_templates`
**PRD:** PRD-05C | **Domain:** lila_ai

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| template_content | TEXT | — | NO | |
| tags | TEXT[] | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_upt_family_member` ON (family_id, member_id)
**Triggers:** `trg_upt_updated_at`

---

### `context_presets`
**PRD:** PRD-05C | **Domain:** lila_ai

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| name | TEXT | — | NO | |
| preset_config | JSONB | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_cp_family_member` ON (family_id, member_id)
**Triggers:** `trg_cp_updated_at`

---

### `ai_usage_tracking`
**PRD:** PRD-05C | **Domain:** lila_ai

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| feature_key | TEXT | — | NO | |
| model | TEXT | — | NO | |
| tokens_used | INTEGER | — | NO | |
| estimated_cost | DECIMAL | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can read family. Admin can read all.
**Indexes:** `idx_aut_family` ON family_id; `idx_aut_member` ON member_id; `idx_aut_created` ON created_at DESC

---

## Personal Growth (PRD-06 through PRD-13)

### `guiding_stars`
**PRD:** PRD-06 | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| content | TEXT | — | NO | |
| category | TEXT | — | YES | |
| description | TEXT | — | YES | |
| source | TEXT | 'manual' | NO | Also 'bookshelf' per PRD-23 |
| is_included_in_ai | BOOLEAN | true | NO | |
| embedding | vector(1536) | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Parent can read children's.
**Indexes:** `idx_gs_family_member` ON (family_id, member_id); `idx_gs_embedding` USING ivfflat ON embedding WHERE embedding IS NOT NULL
**Triggers:** `trg_gs_updated_at`

---

### `best_intentions`
**PRD:** PRD-06 | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| statement | TEXT | — | NO | |
| tags | TEXT[] | — | YES | |
| source | TEXT | 'manual' | NO | Also 'bigplans' per PRD-29 |
| celebration_count | INTEGER | 0 | NO | |
| iteration_count | INTEGER | 0 | NO | |
| is_included_in_ai | BOOLEAN | true | NO | |
| embedding | vector(1536) | — | YES | |
| last_reset_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Parent can read children's.
**Indexes:** `idx_bi_family_member` ON (family_id, member_id); `idx_bi_embedding` USING ivfflat ON embedding WHERE embedding IS NOT NULL
**Triggers:** `trg_bi_updated_at`

---

### `intention_iterations`
**PRD:** PRD-06 | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| intention_id | UUID | — | NO | FK best_intentions |
| victory_reference | UUID | — | YES | FK victories |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from best_intentions.
**Indexes:** `idx_ii_intention` ON intention_id

---

### `self_knowledge`
**PRD:** PRD-07 | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| category | TEXT | — | NO | CHECK: 'personality','strengths','growth_areas','communication_style','how_i_work' |
| content | TEXT | — | NO | |
| source_type | TEXT | — | NO | CHECK: 'manual','upload','lila_guided','bulk_add' |
| share_with_mom | BOOLEAN | true | NO | |
| share_with_dad | BOOLEAN | false | NO | |
| is_included_in_ai | BOOLEAN | true | NO | |
| embedding | vector(1536) | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Parents can read if share flags allow.
**Indexes:** `idx_sk_family_member` ON (family_id, member_id); `idx_sk_category` ON category; `idx_sk_embedding` USING ivfflat ON embedding WHERE embedding IS NOT NULL
**Triggers:** `trg_sk_updated_at`

---

### `journal_entries`
**PRD:** PRD-08 | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| entry_type | TEXT | — | NO | CHECK: 'daily_reflection','gratitude','learning_capture','prayer','letter','memory','goal_check_in','dream','observation','free_write','reflection_response' |
| content | TEXT | — | NO | |
| tags | TEXT[] | '{}' | NO | PRD-18 |
| visibility | TEXT | — | NO | CHECK: 'private','shared_parents','family' |
| related_plan_id | UUID | — | YES | FK plans; PRD-29 |
| is_included_in_ai | BOOLEAN | true | NO | |
| embedding | vector(1536) | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Visibility controls parent/family access.
**Indexes:** `idx_je_family_member` ON (family_id, member_id); `idx_je_type` ON entry_type; `idx_je_created` ON created_at DESC; `idx_je_embedding` USING ivfflat ON embedding WHERE embedding IS NOT NULL
**Triggers:** `trg_je_updated_at`

---

### `notepad_tabs`
**PRD:** PRD-08 | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| content | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_nt_family_member` ON (family_id, member_id)
**Triggers:** `trg_nt_updated_at`

---

### `notepad_extracted_items`
**PRD:** PRD-08 | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| tab_id | UUID | — | NO | FK notepad_tabs |
| routing_destination | TEXT | — | NO | |
| extracted_content | TEXT | — | NO | |
| status | TEXT | — | NO | CHECK: 'pending','routed','dismissed' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from notepad_tabs.
**Indexes:** `idx_nei_tab` ON tab_id; `idx_nei_status` ON status

---

### `notepad_routing_stats`
**PRD:** PRD-08 | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| destination | TEXT | — | NO | |
| count | INTEGER | 0 | NO | |
| last_routed_at | TIMESTAMPTZ | — | YES | |

**RLS:** Member can read own.
**Indexes:** `idx_nrs_family_member` ON (family_id, member_id)

---

### `task_templates`
**PRD:** PRD-09A | **Domain:** tasks

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| created_by | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| description | TEXT | — | YES | |
| task_type | TEXT | — | NO | CHECK: 'task','routine','opportunity','habit' |
| config | JSONB | — | YES | |
| is_system | BOOLEAN | false | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read. Adults can manage.
**Indexes:** `idx_tt_family` ON family_id; `idx_tt_type` ON task_type
**Triggers:** `trg_tt_updated_at`

---

### `task_template_sections`
**PRD:** PRD-09A | **Domain:** tasks

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| template_id | UUID | — | NO | FK task_templates |
| title | TEXT | — | NO | |
| sort_order | INTEGER | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from task_templates.
**Indexes:** `idx_tts_template` ON template_id

---

### `task_template_steps`
**PRD:** PRD-09A | **Domain:** tasks

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| section_id | UUID | — | NO | FK task_template_sections |
| title | TEXT | — | NO | |
| sort_order | INTEGER | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from task_template_sections.
**Indexes:** `idx_ttst_section` ON section_id

---

### `tasks`
**PRD:** PRD-09A | **Domain:** tasks

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| created_by | UUID | — | NO | FK family_members |
| assignee_id | UUID | — | YES | FK family_members |
| template_id | UUID | — | YES | FK task_templates |
| title | TEXT | — | NO | |
| description | TEXT | — | YES | |
| task_type | TEXT | — | NO | CHECK: 'task','routine','opportunity','habit' |
| status | TEXT | — | NO | CHECK: 'pending','in_progress','completed','cancelled','paused' |
| priority | TEXT | — | YES | CHECK: 'now','next','optional','someday' |
| due_date | DATE | — | YES | |
| due_time | TIME | — | YES | |
| life_area_tag | TEXT | — | YES | |
| points_override | INTEGER | — | YES | PRD-24 |
| related_plan_id | UUID | — | YES | FK plans; PRD-29 |
| source | TEXT | 'manual' | NO | |
| recurrence_details | JSONB | — | YES | RRULE format; PRD-35 |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read own family. Assignee and creator can update. Adults can manage all.
**Indexes:** `idx_tasks_family` ON family_id; `idx_tasks_assignee` ON assignee_id; `idx_tasks_status` ON status; `idx_tasks_due` ON due_date WHERE due_date IS NOT NULL; `idx_tasks_plan` ON related_plan_id WHERE related_plan_id IS NOT NULL
**Triggers:** `trg_tasks_updated_at`

---

### `task_assignments`
**PRD:** PRD-09A | **Domain:** tasks

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| task_id | UUID | — | NO | FK tasks |
| member_id | UUID | — | NO | FK family_members |
| assigned_by | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from tasks.
**Indexes:** `idx_ta_task` ON task_id; `idx_ta_member` ON member_id

---

### `task_completions`
**PRD:** PRD-09A | **Domain:** tasks

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| task_id | UUID | — | NO | FK tasks |
| member_id | UUID | — | NO | FK family_members |
| completed_at | TIMESTAMPTZ | now() | NO | |
| evidence | JSONB | — | YES | |
| approved_by | UUID | — | YES | FK family_members |
| approval_status | TEXT | — | YES | CHECK: 'pending','approved','rejected' |

**RLS:** Inherits from tasks. Member can insert own.
**Indexes:** `idx_tc_task` ON task_id; `idx_tc_member` ON member_id; `idx_tc_completed` ON completed_at DESC

---

### `routine_step_completions`
**PRD:** PRD-09A | **Domain:** tasks

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| task_id | UUID | — | NO | FK tasks |
| step_id | UUID | — | NO | FK task_template_steps |
| member_id | UUID | — | NO | FK family_members |
| completed_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from tasks.
**Indexes:** `idx_rsc_task` ON task_id; `idx_rsc_step` ON step_id

---

### `sequential_collections`
**PRD:** PRD-09A | **Domain:** tasks

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| title | TEXT | — | NO | |
| task_ids | UUID[] | — | NO | |
| current_index | INTEGER | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read. Adults can manage.
**Indexes:** `idx_sc_family` ON family_id
**Triggers:** `trg_sc_updated_at`

---

### `task_claims`
**PRD:** PRD-09A | **Domain:** tasks

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| task_id | UUID | — | NO | FK tasks |
| member_id | UUID | — | NO | FK family_members |
| claimed_at | TIMESTAMPTZ | now() | NO | |
| status | TEXT | — | NO | CHECK: 'claimed','completed','released' |

**RLS:** Inherits from tasks. Member can manage own claims.
**Indexes:** `idx_tcl_task` ON task_id; `idx_tcl_member` ON member_id

---

### `task_rewards`
**PRD:** PRD-09A | **Domain:** tasks

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| task_id | UUID | — | NO | FK tasks |
| reward_type | TEXT | — | NO | CHECK: 'points','money','privilege','custom' |
| reward_value | JSONB | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from tasks.
**Indexes:** `idx_tr_task` ON task_id

---

### `studio_queue`
**PRD:** PRD-17 (authoritative) + PRD-17B | **Domain:** tasks

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| owner_id | UUID | — | NO | FK family_members |
| destination | TEXT | — | YES | |
| content | TEXT | — | NO | |
| content_details | JSONB | — | YES | |
| source | TEXT | — | NO | |
| source_reference_id | UUID | — | YES | |
| structure_flag | TEXT | — | YES | |
| batch_id | UUID | — | YES | |
| requester_id | UUID | — | YES | FK family_members |
| requester_note | TEXT | — | YES | |
| mindsweep_confidence | TEXT | — | YES | CHECK: 'high','medium','low'; PRD-17B |
| mindsweep_event_id | UUID | — | YES | FK mindsweep_events; PRD-17B |
| processed_at | TIMESTAMPTZ | — | YES | |
| dismissed_at | TIMESTAMPTZ | — | YES | |
| dismiss_note | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Owner can manage own items. Parent can read all family items.
**Indexes:** `idx_sq_family_owner` ON (family_id, owner_id); `idx_sq_unprocessed` ON (family_id, owner_id) WHERE processed_at IS NULL AND dismissed_at IS NULL; `idx_sq_batch` ON batch_id WHERE batch_id IS NOT NULL; `idx_sq_destination` ON destination

---

### `lists`
**PRD:** PRD-09B | **Domain:** lists

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| owner_id | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| list_type | TEXT | — | NO | CHECK: 'simple','checklist','reference','template','randomizer','backburner' |
| reveal_type | TEXT | — | YES | PRD-24B |
| max_respins_per_period | INTEGER | — | YES | |
| respin_period | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Owner can manage. Shared members per list_shares.
**Indexes:** `idx_lists_family` ON family_id; `idx_lists_owner` ON owner_id; `idx_lists_type` ON list_type
**Triggers:** `trg_lists_updated_at`

---

### `list_items`
**PRD:** PRD-09B | **Domain:** lists

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| list_id | UUID | — | NO | FK lists |
| content | TEXT | — | NO | |
| checked | BOOLEAN | false | NO | |
| section_name | TEXT | — | YES | |
| notes | TEXT | — | YES | |
| availability_mode | TEXT | — | YES | |
| max_instances | INTEGER | — | YES | |
| completed_instances | INTEGER | 0 | NO | |
| recurrence_config | JSONB | — | YES | |
| next_available_at | TIMESTAMPTZ | — | YES | |
| sort_order | INTEGER | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from lists.
**Indexes:** `idx_li_list` ON list_id; `idx_li_sort` ON (list_id, sort_order)
**Triggers:** `trg_li_updated_at`

---

### `list_shares`
**PRD:** PRD-09B | **Domain:** lists

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| list_id | UUID | — | NO | FK lists |
| shared_with | UUID | — | NO | FK family_members |
| permission | TEXT | — | NO | CHECK: 'view','edit' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Owner can manage shares.
**Indexes:** `idx_ls_list` ON list_id; `idx_ls_shared` ON shared_with

---

### `list_templates`
**PRD:** PRD-09B | **Domain:** lists

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| title | TEXT | — | NO | |
| description | TEXT | — | YES | |
| list_type | TEXT | — | NO | |
| default_items | JSONB | — | YES | |
| is_system | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_lt_type` ON list_type

---

### `dashboard_widgets`
**PRD:** PRD-10 | **Domain:** dashboards

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| widget_template_id | UUID | — | NO | FK widget_templates |
| config | JSONB | — | YES | |
| x | INTEGER | — | NO | Grid position |
| y | INTEGER | — | NO | Grid position |
| width | INTEGER | 1 | NO | |
| height | INTEGER | 1 | NO | |
| folder_id | UUID | — | YES | FK dashboard_widget_folders |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Parent can view children's.
**Indexes:** `idx_dw_family_member` ON (family_id, member_id); `idx_dw_template` ON widget_template_id; `idx_dw_folder` ON folder_id WHERE folder_id IS NOT NULL
**Triggers:** `trg_dw_updated_at`

---

### `dashboard_widget_folders`
**PRD:** PRD-10 | **Domain:** dashboards

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| sort_order | INTEGER | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_dwf_family_member` ON (family_id, member_id)

---

### `widget_data_points`
**PRD:** PRD-10 | **Domain:** dashboards

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| widget_id | UUID | — | NO | FK dashboard_widgets |
| member_id | UUID | — | NO | FK family_members |
| value | JSONB | — | NO | |
| recorded_at | TIMESTAMPTZ | now() | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from dashboard_widgets.
**Indexes:** `idx_wdp_widget` ON widget_id; `idx_wdp_recorded` ON recorded_at DESC

---

### `widget_templates`
**PRD:** PRD-10 | **Domain:** dashboards

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| name | TEXT | — | NO | |
| tracker_type | TEXT | — | NO | 19 tracker types |
| visual_variant | TEXT | — | YES | 75+ variants |
| default_config | JSONB | — | YES | 95+ configurations |
| is_system | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_wt_type` ON tracker_type; `idx_wt_system` ON is_system
**Triggers:** `trg_wt_updated_at`

---

### `coloring_image_library`
**PRD:** PRD-10 | **Domain:** dashboards

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| title | TEXT | — | NO | |
| image_url | TEXT | — | NO | |
| category | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_cil_category` ON category

---

### `color_reveal_progress`
**PRD:** PRD-10 | **Domain:** dashboards

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| widget_id | UUID | — | NO | FK dashboard_widgets |
| member_id | UUID | — | NO | FK family_members |
| progress_percent | DECIMAL | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from dashboard_widgets.
**Indexes:** `idx_crp_widget_member` ON (widget_id, member_id)
**Triggers:** `trg_crp_updated_at`

---

### `coloring_gallery`
**PRD:** PRD-10 | **Domain:** dashboards

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| member_id | UUID | — | NO | FK family_members |
| image_url | TEXT | — | NO | |
| widget_id | UUID | — | NO | FK dashboard_widgets |
| completed_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own. Family can view.
**Indexes:** `idx_cg_member` ON member_id

---

### `victories`
**PRD:** PRD-11 | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| description | TEXT | — | YES | |
| source | TEXT | — | NO | CHECK: 'manual','task_completion','best_intention_iteration','widget_milestone','family_feed' |
| source_reference_id | UUID | — | YES | |
| life_area_tags | TEXT[] | '{}' | NO | |
| custom_tags | TEXT[] | '{}' | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Parent can read children's. Family can view shared.
**Indexes:** `idx_v_family_member` ON (family_id, member_id); `idx_v_source` ON source; `idx_v_created` ON created_at DESC

---

### `victory_celebrations`
**PRD:** PRD-11 | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| celebration_type | TEXT | — | NO | CHECK: 'highlights','detailed' |
| filters_applied | JSONB | — | YES | |
| narrative | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own.
**Indexes:** `idx_vc_family_member` ON (family_id, member_id)

---

### `victory_voice_preferences`
**PRD:** PRD-11 | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| member_id | UUID | — | NO | FK family_members, UNIQUE |
| voice_key | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_vvp_member` UNIQUE ON member_id
**Triggers:** `trg_vvp_updated_at`

---

### `family_victory_celebrations`
**PRD:** PRD-11B | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| generated_by | UUID | — | NO | FK family_members |
| celebration_date | DATE | — | NO | |
| celebration_type | TEXT | — | NO | CHECK: 'highlights','detailed','individual_spotlight' |
| period_filter | TEXT | — | YES | |
| period_start | DATE | — | NO | |
| period_end | DATE | — | NO | |
| members_included | UUID[] | — | YES | |
| life_area_filters | TEXT[] | — | YES | |
| custom_tag_filters | TEXT[] | — | YES | |
| special_filter | TEXT | — | YES | |
| special_filter_id | UUID | — | YES | |
| narrative | TEXT | — | NO | |
| victory_count | INTEGER | — | NO | |
| celebration_voice | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read own family.
**Indexes:** `idx_fvc_family` ON family_id; `idx_fvc_date` ON celebration_date DESC

---

### `life_lantern_areas`
**PRD:** PRD-12A | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| area_name | TEXT | — | NO | CHECK: 'family','health','spirituality','education','community','personal_growth' |
| current_state | TEXT | — | YES | |
| vision | TEXT | — | YES | |
| gap_analysis | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Parent can read children's.
**Indexes:** `idx_lla_family_member` ON (family_id, member_id); `idx_lla_area` ON area_name
**Triggers:** `trg_lla_updated_at`

---

### `life_lantern_area_snapshots`
**PRD:** PRD-12A | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| area_id | UUID | — | NO | FK life_lantern_areas |
| snapshot_data | JSONB | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from life_lantern_areas.
**Indexes:** `idx_llas_area` ON area_id; `idx_llas_created` ON created_at DESC

---

### `life_lantern_role_models`
**PRD:** PRD-12A | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| member_id | UUID | — | NO | FK family_members |
| name | TEXT | — | NO | |
| attributes | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_llrm_member` ON member_id

---

### `personal_vision_statements`
**PRD:** PRD-12A | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| content | TEXT | — | NO | |
| version | INTEGER | 1 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_pvs_family_member` ON (family_id, member_id)

---

### `family_vision_quests`
**PRD:** PRD-12B | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| created_by | UUID | — | NO | FK family_members |
| status | TEXT | — | NO | CHECK: 'active','completed','archived' |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read. Adults can manage.
**Indexes:** `idx_fvq_family` ON family_id; `idx_fvq_status` ON status
**Triggers:** `trg_fvq_updated_at`

---

### `vision_sections`
**PRD:** PRD-12B | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| quest_id | UUID | — | NO | FK family_vision_quests |
| topic | TEXT | — | NO | |
| current_synthesis | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from family_vision_quests.
**Indexes:** `idx_vs_quest` ON quest_id
**Triggers:** `trg_vs_updated_at`

---

### `vision_section_history`
**PRD:** PRD-12B | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| section_id | UUID | — | NO | FK vision_sections |
| synthesis | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from vision_sections.
**Indexes:** `idx_vsh_section` ON section_id

---

### `vision_section_responses`
**PRD:** PRD-12B | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| section_id | UUID | — | NO | FK vision_sections |
| member_id | UUID | — | NO | FK family_members |
| response | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own responses. Family can read.
**Indexes:** `idx_vsr_section` ON section_id; `idx_vsr_member` ON member_id

---

### `vision_section_discussions`
**PRD:** PRD-12B | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| section_id | UUID | — | NO | FK vision_sections |
| audio_url | TEXT | — | YES | |
| transcript | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from vision_sections.
**Indexes:** `idx_vsd_section` ON section_id

---

### `family_vision_statements`
**PRD:** PRD-12B | **Domain:** personal_growth

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| content | TEXT | — | NO | |
| version | INTEGER | 1 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read. Adults can manage.
**Indexes:** `idx_fvs_family` ON family_id

---

### `archive_folders`
**PRD:** PRD-13 | **Domain:** archive

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | YES | FK family_members |
| folder_name | TEXT | — | NO | |
| parent_folder_id | UUID | — | YES | FK archive_folders (self-referencing) |
| folder_type | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read own family. Adults can manage.
**Indexes:** `idx_af_family` ON family_id; `idx_af_parent` ON parent_folder_id; `idx_af_member` ON member_id
**Triggers:** `trg_af_updated_at`

---

### `archive_context_items`
**PRD:** PRD-13 + PRD-19 | **Domain:** archive

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| folder_id | UUID | — | NO | FK archive_folders |
| source_table | TEXT | — | NO | |
| source_id | UUID | — | NO | |
| context_field | TEXT | — | YES | |
| context_value | TEXT | — | YES | |
| visibility | TEXT | — | NO | CHECK: 'private','shared_parents','family' |
| is_pinned | BOOLEAN | false | NO | |
| is_private_note | BOOLEAN | false | NO | PRD-19 |
| is_shared_with_spouse | BOOLEAN | false | NO | PRD-19 |
| share_with_family | BOOLEAN | false | NO | PRD-19 |
| sort_order | INTEGER | 0 | NO | PRD-19 |
| document_id | UUID | — | YES | PRD-19 |
| is_included_in_ai | BOOLEAN | true | NO | |
| use_alias_for_external | BOOLEAN | false | NO | |
| embedding | vector(1536) | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Visibility-based access. Private: author only. Shared_parents: adults. Family: all.
**Indexes:** `idx_aci_folder` ON folder_id; `idx_aci_source` ON (source_table, source_id); `idx_aci_pinned` ON (folder_id) WHERE is_pinned = true; `idx_aci_embedding` USING ivfflat ON embedding WHERE embedding IS NOT NULL
**Triggers:** `trg_aci_updated_at`

---

### `archive_member_settings`
**PRD:** PRD-13 + PRD-19 + PRD-21A | **Domain:** archive

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| display_name_aliases | TEXT[] | '{}' | NO | PRD-19 |
| external_alias | TEXT | — | YES | PRD-19 |
| use_alias_for_external | BOOLEAN | false | NO | PRD-19 |
| primary_alias | TEXT | — | YES | PRD-19 |
| physical_description | TEXT | — | YES | PRD-21A |
| reference_photos | TEXT[] | '{}' | NO | PRD-21A |
| guided_interview_progress | JSONB | — | YES | PRD-19 |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Member can read own.
**Indexes:** `idx_ams_family_member` UNIQUE ON (family_id, member_id)
**Triggers:** `trg_ams_updated_at`

---

### `faith_preferences`
**PRD:** PRD-13 | **Domain:** archive

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| tradition | TEXT | — | YES | |
| denomination | TEXT | — | YES | |
| observances | TEXT[] | '{}' | NO | |
| sacred_texts | TEXT[] | '{}' | NO | |
| response_approach | TEXT | 'prioritize_tradition' | NO | CHECK: 'prioritize_tradition','comparative','secular','educational_only' |
| tone_settings | JSONB | — | YES | |
| special_instructions | TEXT | — | YES | |
| relevance_setting | TEXT | 'automatic' | NO | CHECK: 'automatic','always_include','manual_only' |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Adults can read.
**Indexes:** `idx_fp_family` UNIQUE ON family_id
**Triggers:** `trg_fp_updated_at`

---

### `context_learning_dismissals`
**PRD:** PRD-13 | **Domain:** archive

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| suggestion_hash | TEXT | — | NO | |
| dismissed_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_cld_family_member` ON (family_id, member_id); `idx_cld_hash` ON suggestion_hash

---

## Dashboards (PRD-14 family)

### `dashboard_configs`
**PRD:** PRD-14 | **Domain:** dashboards

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | NO | FK family_members |
| dashboard_type | TEXT | — | NO | CHECK: 'personal','family_overview','family_hub','guided','play' |
| layout | JSONB | — | YES | |
| layout_mode | TEXT | — | YES | |
| decorations | JSONB | — | YES | |
| preferences | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Parent can manage children's.
**Indexes:** `idx_dc_family_member` ON (family_id, family_member_id); `idx_dc_type` ON dashboard_type
**Triggers:** `trg_dc_updated_at`

---

### `calendar_events`
**PRD:** PRD-14B | **Domain:** calendar

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| created_by | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| description | TEXT | — | YES | |
| event_date | DATE | — | NO | |
| start_time | TIME | — | YES | |
| end_time | TIME | — | YES | |
| is_all_day | BOOLEAN | false | NO | |
| location | TEXT | — | YES | |
| category | TEXT | — | YES | FK event_categories.slug |
| icon_override | TEXT | — | YES | |
| status | TEXT | 'approved' | NO | CHECK: 'pending','approved','rejected','cancelled' |
| approved_by | UUID | — | YES | FK family_members |
| approved_at | TIMESTAMPTZ | — | YES | |
| rejection_note | TEXT | — | YES | |
| recurrence_rule | TEXT | — | YES | |
| recurrence_details | JSONB | — | YES | |
| recurrence_parent_id | UUID | — | YES | FK calendar_events (self-ref) |
| leave_by_time | TIME | — | YES | |
| transportation_needed | BOOLEAN | false | NO | |
| items_to_bring | JSONB | — | YES | |
| notes | TEXT | — | YES | |
| reminder_minutes | INTEGER | — | YES | |
| source_type | TEXT | — | YES | |
| source_reference_id | UUID | — | YES | |
| source_image_url | TEXT | — | YES | |
| external_id | TEXT | — | YES | |
| external_source | TEXT | — | YES | |
| last_synced_at | TIMESTAMPTZ | — | YES | |
| is_included_in_ai | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read own family. Adults can manage. Children can insert (pending approval).
**Indexes:** `idx_ce_family` ON family_id; `idx_ce_date` ON event_date; `idx_ce_date_range` ON (family_id, event_date); `idx_ce_status` ON status; `idx_ce_recurrence_parent` ON recurrence_parent_id WHERE recurrence_parent_id IS NOT NULL; `idx_ce_external` ON (external_source, external_id) WHERE external_id IS NOT NULL
**Triggers:** `trg_ce_updated_at`

---

### `event_attendees`
**PRD:** PRD-14B | **Domain:** calendar

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| event_id | UUID | — | NO | FK calendar_events |
| family_member_id | UUID | — | NO | FK family_members |
| role | TEXT | 'attendee' | NO | |
| response_status | TEXT | 'pending' | NO | CHECK: 'accepted','declined','tentative','pending' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from calendar_events.
**Indexes:** `idx_ea_event` ON event_id; `idx_ea_member` ON family_member_id

---

### `event_categories`
**PRD:** PRD-14B | **Domain:** calendar

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | YES | FK families; NULL for system categories |
| name | TEXT | — | NO | |
| slug | TEXT | — | NO | |
| icon | TEXT | — | YES | |
| color | TEXT | — | YES | |
| is_system | BOOLEAN | false | NO | |
| sort_order | INTEGER | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** System categories public read. Family categories restricted to family.
**Indexes:** `idx_ec_family` ON family_id; `idx_ec_slug` ON slug

---

### `calendar_settings`
**PRD:** PRD-14B | **Domain:** calendar

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families, UNIQUE |
| default_drive_time_minutes | INTEGER | 15 | NO | |
| required_intake_fields | JSONB | — | YES | |
| auto_approve_members | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Family can read.
**Indexes:** `idx_cs_family` UNIQUE ON family_id
**Triggers:** `trg_cs_updated_at`

---

### `family_overview_configs`
**PRD:** PRD-14C | **Domain:** dashboards

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families, UNIQUE |
| selected_member_ids | UUID[] | — | YES | |
| column_order | JSONB | — | YES | |
| section_states | JSONB | — | YES | |
| section_order | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Adults can read.
**Indexes:** `idx_foc_family` UNIQUE ON family_id
**Triggers:** `trg_foc_updated_at`

---

### `family_hub_configs`
**PRD:** PRD-14D | **Domain:** dashboards

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families, UNIQUE |
| section_order | JSONB | — | YES | |
| visibility_settings | JSONB | — | YES | |
| preferences | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Family can read.
**Indexes:** `idx_fhc_family` UNIQUE ON family_id
**Triggers:** `trg_fhc_updated_at`

---

### `countdowns`
**PRD:** PRD-14D | **Domain:** dashboards

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| title | TEXT | — | NO | |
| target_date | DATE | — | NO | |
| emoji_icon | TEXT | — | YES | |
| scope | TEXT | — | NO | CHECK: 'family','personal' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family scope: all can read. Personal scope: member only.
**Indexes:** `idx_cd_family` ON family_id; `idx_cd_target` ON target_date

---

## Communication (PRD-15 through PRD-17B)

### `conversation_spaces`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| space_type | TEXT | — | NO | CHECK: 'direct','group','family','content_corner','out_of_nest' |
| title | TEXT | — | YES | |
| created_by | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Members of the space can read. Creator can manage.
**Indexes:** `idx_cs_family` ON family_id; `idx_cs_type` ON space_type
**Triggers:** `trg_cs_updated_at`

---

### `conversation_space_members`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| space_id | UUID | — | NO | FK conversation_spaces |
| member_id | UUID | — | NO | FK family_members |
| role | TEXT | 'member' | NO | CHECK: 'member','admin' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Space members can read. Admin can manage.
**Indexes:** `idx_csm_space` ON space_id; `idx_csm_member` ON member_id

---

### `conversation_threads`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| space_id | UUID | — | NO | FK conversation_spaces |
| title | TEXT | — | YES | |
| created_by | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from conversation_spaces.
**Indexes:** `idx_ct_space` ON space_id
**Triggers:** `trg_ct_updated_at`

---

### `messages`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| thread_id | UUID | — | NO | FK conversation_threads |
| sender_id | UUID | — | NO | FK family_members |
| message_type | TEXT | — | NO | CHECK: 'user','lila','system','content_corner_link' |
| content | TEXT | — | NO | |
| edited_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Space members can read. Sender can update (edit).
**Indexes:** `idx_msg_thread` ON thread_id; `idx_msg_sender` ON sender_id; `idx_msg_created` ON created_at DESC

---

### `message_read_status`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| thread_id | UUID | — | NO | FK conversation_threads |
| member_id | UUID | — | NO | FK family_members |
| last_read_at | TIMESTAMPTZ | — | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_mrs_thread_member` UNIQUE ON (thread_id, member_id)

---

### `messaging_settings`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families, UNIQUE |
| communication_guidelines | TEXT | — | YES | |
| content_corner_settings | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Family can read.
**Indexes:** `idx_ms_family` UNIQUE ON family_id
**Triggers:** `trg_ms_updated_at`

---

### `member_messaging_permissions`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| from_member_id | UUID | — | NO | FK family_members |
| to_member_id | UUID | — | NO | FK family_members |
| is_allowed | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Members can read own permissions.
**Indexes:** `idx_mmp_family` ON family_id; `idx_mmp_pair` ON (from_member_id, to_member_id)

---

### `message_coaching_settings`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| is_enabled | BOOLEAN | false | NO | |
| coaching_level | TEXT | 'gentle' | NO | CHECK: 'gentle','moderate','active' |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Member can read own.
**Indexes:** `idx_mcs_family_member` UNIQUE ON (family_id, member_id)
**Triggers:** `trg_mcs_updated_at`

---

### `family_requests`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| requester_id | UUID | — | NO | FK family_members |
| request_type | TEXT | — | NO | |
| title | TEXT | — | NO | |
| description | TEXT | — | YES | |
| status | TEXT | — | NO | CHECK: 'pending','approved','rejected','completed' |
| assigned_to | UUID | — | YES | FK family_members |
| resolved_by | UUID | — | YES | FK family_members |
| resolved_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read own family. Adults can manage.
**Indexes:** `idx_fr_family` ON family_id; `idx_fr_status` ON status; `idx_fr_requester` ON requester_id
**Triggers:** `trg_fr_updated_at`

---

### `notifications`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| category | TEXT | — | NO | |
| notification_type | TEXT | — | NO | |
| title | TEXT | — | NO | |
| body | TEXT | — | NO | |
| priority | TEXT | 'normal' | NO | CHECK: 'low','normal','high' |
| source_table | TEXT | — | YES | |
| source_id | UUID | — | YES | |
| is_read | BOOLEAN | false | NO | |
| read_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read/update own.
**Indexes:** `idx_n_member` ON member_id; `idx_n_unread` ON (member_id) WHERE is_read = false; `idx_n_created` ON created_at DESC

---

### `notification_preferences`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| category | TEXT | — | NO | |
| is_enabled | BOOLEAN | true | NO | |
| channel | TEXT | 'in_app' | NO | CHECK: 'in_app','push','email' |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_np_family_member` ON (family_id, member_id); `idx_np_category` ON (member_id, category)
**Triggers:** `trg_np_updated_at`

---

### `out_of_nest_members`
**PRD:** PRD-15 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| name | TEXT | — | NO | |
| email | TEXT | — | YES | |
| phone | TEXT | — | YES | |
| relationship | TEXT | — | NO | |
| invitation_status | TEXT | 'pending' | NO | CHECK: 'pending','accepted','declined' |
| user_id | UUID | — | YES | FK auth.users |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Family can read.
**Indexes:** `idx_oonm_family` ON family_id; `idx_oonm_user` ON user_id WHERE user_id IS NOT NULL
**Triggers:** `trg_oonm_updated_at`

---

### `meetings`
**PRD:** PRD-16 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| created_by | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| meeting_type | TEXT | — | NO | CHECK: 'couple','parent_child','family_council','mentor','weekly_review','monthly_review','quarterly_inventory','business','custom' |
| template_id | UUID | — | YES | FK meeting_templates |
| status | TEXT | — | NO | CHECK: 'scheduled','in_progress','completed','cancelled' |
| scheduled_at | TIMESTAMPTZ | — | YES | |
| started_at | TIMESTAMPTZ | — | YES | |
| completed_at | TIMESTAMPTZ | — | YES | |
| recurrence_details | JSONB | — | YES | |
| notes | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Participants can read. Creator can manage.
**Indexes:** `idx_m_family` ON family_id; `idx_m_status` ON status; `idx_m_scheduled` ON scheduled_at
**Triggers:** `trg_m_updated_at`

---

### `meeting_participants`
**PRD:** PRD-16 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| meeting_id | UUID | — | NO | FK meetings |
| member_id | UUID | — | NO | FK family_members |
| role | TEXT | — | NO | CHECK: 'organizer','participant','facilitator' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from meetings.
**Indexes:** `idx_mp2_meeting` ON meeting_id; `idx_mp2_member` ON member_id

---

### `meeting_schedules`
**PRD:** PRD-16 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| meeting_id | UUID | — | NO | FK meetings |
| recurrence_details | JSONB | — | NO | |
| next_occurrence | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from meetings.
**Indexes:** `idx_msc_meeting` ON meeting_id; `idx_msc_next` ON next_occurrence
**Triggers:** `trg_msc_updated_at`

---

### `meeting_templates`
**PRD:** PRD-16 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| title | TEXT | — | NO | |
| meeting_type | TEXT | — | NO | |
| sections | JSONB | — | YES | |
| is_system | BOOLEAN | false | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family can read. Adults can manage custom. System templates public read.
**Indexes:** `idx_mt2_family` ON family_id; `idx_mt2_type` ON meeting_type
**Triggers:** `trg_mt2_updated_at`

---

### `meeting_template_sections`
**PRD:** PRD-16 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| template_id | UUID | — | NO | FK meeting_templates |
| title | TEXT | — | NO | |
| section_type | TEXT | — | YES | |
| sort_order | INTEGER | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from meeting_templates.
**Indexes:** `idx_mts_template` ON template_id

---

### `meeting_agenda_items`
**PRD:** PRD-16 | **Domain:** communication

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| meeting_id | UUID | — | NO | FK meetings |
| member_id | UUID | — | NO | FK family_members |
| content | TEXT | — | NO | |
| is_discussed | BOOLEAN | false | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Participants can read/insert. Organizer can manage.
**Indexes:** `idx_mai_meeting` ON meeting_id

---

### `mindsweep_settings`
**PRD:** PRD-17B | **Domain:** mindsweep

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| aggressiveness_mode | TEXT | 'always_ask' | NO | CHECK: 'always_ask','trust_obvious','full_autopilot' |
| auto_sweep_enabled | BOOLEAN | false | NO | |
| auto_sweep_schedule | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_mss_family_member` UNIQUE ON (family_id, member_id)
**Triggers:** `trg_mss_updated_at`

---

### `mindsweep_holding`
**PRD:** PRD-17B | **Domain:** mindsweep

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| content | TEXT | — | NO | |
| source | TEXT | — | NO | CHECK: 'voice','text','scan','email','share' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_mh_family_member` ON (family_id, member_id)

---

### `mindsweep_allowed_senders`
**PRD:** PRD-17B | **Domain:** mindsweep

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| email | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage.
**Indexes:** `idx_mas_family` ON family_id; `idx_mas_email` ON email

---

### `mindsweep_events`
**PRD:** PRD-17B | **Domain:** mindsweep

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| event_type | TEXT | — | NO | |
| items_processed | INTEGER | — | NO | |
| items_routed | INTEGER | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own.
**Indexes:** `idx_me_family_member` ON (family_id, member_id)

---

### `mindsweep_approval_patterns`
**PRD:** PRD-17B | **Domain:** mindsweep

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| pattern_key | TEXT | — | NO | |
| approval_rate | DECIMAL | — | NO | |
| sample_size | INTEGER | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Service role manages. Member can read own.
**Indexes:** `idx_map_family_member` ON (family_id, member_id); `idx_map_pattern` ON pattern_key
**Triggers:** `trg_map_updated_at`

---

## Daily Life (PRD-18 through PRD-20)

### `rhythm_configs`
**PRD:** PRD-18 | **Domain:** daily_life

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| rhythm_type | TEXT | — | NO | CHECK: 'morning','evening','weekly','monthly','quarterly' |
| sections | JSONB | — | NO | |
| is_active | BOOLEAN | true | NO | |
| trigger_hours | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Parent can manage children's.
**Indexes:** `idx_rc_family_member` ON (family_id, member_id); `idx_rc_type` ON rhythm_type
**Triggers:** `trg_rc_updated_at`

---

### `rhythm_completions`
**PRD:** PRD-18 | **Domain:** daily_life

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| rhythm_type | TEXT | — | NO | |
| completion_date | DATE | — | NO | |
| status | TEXT | — | NO | CHECK: 'completed','dismissed','partial' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_rco_family_member` ON (family_id, member_id); `idx_rco_date` ON completion_date

---

### `reflection_prompts`
**PRD:** PRD-18 | **Domain:** daily_life

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | YES | FK families; NULL for system prompts |
| prompt_text | TEXT | — | NO | |
| category | TEXT | — | YES | |
| is_system | BOOLEAN | false | NO | 32 default system prompts |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** System prompts public read. Custom prompts family-scoped.
**Indexes:** `idx_rp_family` ON family_id; `idx_rp_system` ON is_system WHERE is_system = true

---

### `reflection_responses`
**PRD:** PRD-18 | **Domain:** daily_life

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| prompt_id | UUID | — | NO | FK reflection_prompts |
| response | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_rr_family_member` ON (family_id, member_id); `idx_rr_prompt` ON prompt_id

---

### `member_documents`
**PRD:** PRD-19 | **Domain:** daily_life

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members (about) |
| uploaded_by | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| file_url | TEXT | — | NO | |
| file_type | TEXT | — | NO | |
| summary | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Uploader and primary parent can manage. Subject can read if shared.
**Indexes:** `idx_md_family_member` ON (family_id, member_id); `idx_md_uploaded` ON uploaded_by

---

### `private_notes`
**PRD:** PRD-19 | **Domain:** daily_life

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| about_member_id | UUID | — | NO | FK family_members |
| author_id | UUID | — | NO | FK family_members |
| content | TEXT | — | NO | NEVER visible to subject |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Author can manage own. NEVER visible to about_member_id. Critical privacy constraint.
**Indexes:** `idx_pn_family` ON family_id; `idx_pn_about` ON about_member_id; `idx_pn_author` ON author_id
**Triggers:** `trg_pn_updated_at`

---

### `relationship_notes`
**PRD:** PRD-19 | **Domain:** daily_life

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| author_id | UUID | — | NO | FK family_members |
| person_a_id | UUID | — | NO | FK family_members |
| person_b_id | UUID | — | NO | FK family_members |
| content | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Author can manage. Primary parent can read.
**Indexes:** `idx_rn_family` ON family_id; `idx_rn_pair` ON (person_a_id, person_b_id)
**Triggers:** `trg_rn_updated_at`

---

### `guided_interview_progress`
**PRD:** PRD-19 | **Domain:** daily_life

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| questions_completed | JSONB | — | YES | |
| last_question_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Member can read own.
**Indexes:** `idx_gip_family_member` UNIQUE ON (family_id, member_id)
**Triggers:** `trg_gip_updated_at`

---

### `monthly_data_aggregations`
**PRD:** PRD-19 | **Domain:** daily_life

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | YES | FK family_members |
| period_start | DATE | — | NO | |
| period_end | DATE | — | NO | |
| aggregation_data | JSONB | — | NO | Compiled on billing day |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can read. Service role writes.
**Indexes:** `idx_mda_family` ON family_id; `idx_mda_period` ON (family_id, period_start)

---

### `generated_reports`
**PRD:** PRD-19 + PRD-28B | **Domain:** daily_life

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| template_id | UUID | — | YES | FK report_templates |
| template_type | TEXT | — | NO | |
| requested_by | UUID | — | NO | FK family_members |
| status | TEXT | — | NO | CHECK: 'pending','processing','completed','failed' |
| content | TEXT | — | YES | |
| file_url | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| completed_at | TIMESTAMPTZ | — | YES | |

**RLS:** Requester can read own. Primary parent can read all family.
**Indexes:** `idx_gr_family` ON family_id; `idx_gr_status` ON status; `idx_gr_requested` ON requested_by

---

### `safe_harbor_orientation_completions`
**PRD:** PRD-20 | **Domain:** safety

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| scenarios_completed | TEXT[] | '{}' | NO | |
| completed_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Member can read own.
**Indexes:** `idx_shoc_family_member` ON (family_id, member_id)

---

### `safe_harbor_literacy_completions`
**PRD:** PRD-20 | **Domain:** safety

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| safety_net_acknowledged | BOOLEAN | false | NO | |
| completed_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Member can read own.
**Indexes:** `idx_shlc_family_member` ON (family_id, member_id)

---

### `safe_harbor_consent_records`
**PRD:** PRD-20 | **Domain:** safety

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| granting_member_id | UUID | — | NO | FK family_members |
| teen_member_id | UUID | — | NO | FK family_members |
| agreement_version | TEXT | — | NO | |
| transparency_level | TEXT | 'fully_private' | NO | CHECK: 'usage_visible','fully_private' |
| accepted_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Teen can read own.
**Indexes:** `idx_shcr_family` ON family_id; `idx_shcr_teen` ON teen_member_id

---

## AI Vault (PRD-21 through PRD-23)

### `communication_drafts`
**PRD:** PRD-21 | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| author_id | UUID | — | NO | FK family_members |
| about_member_id | UUID | — | YES | FK family_members |
| tool_mode | TEXT | — | NO | CHECK: 'cyrano','higgins_say' |
| raw_input | TEXT | — | NO | |
| crafted_version | TEXT | — | NO | |
| final_version | TEXT | — | YES | |
| teaching_skill | TEXT | — | YES | |
| teaching_note | TEXT | — | YES | |
| status | TEXT | 'draft' | NO | CHECK: 'draft','sent','saved_for_later','discarded' |
| sent_at | TIMESTAMPTZ | — | YES | |
| sent_via | TEXT | — | YES | |
| lila_conversation_id | UUID | — | YES | FK lila_conversations |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Author can manage own.
**Indexes:** `idx_cd2_family` ON family_id; `idx_cd2_author` ON author_id; `idx_cd2_status` ON status
**Triggers:** `trg_cd2_updated_at`

---

### `teaching_skill_history`
**PRD:** PRD-21 | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| tool_mode | TEXT | — | NO | |
| skill_key | TEXT | — | NO | |
| about_member_id | UUID | — | YES | FK family_members |
| lila_conversation_id | UUID | — | YES | FK lila_conversations |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own.
**Indexes:** `idx_tsh_family_member` ON (family_id, member_id); `idx_tsh_skill` ON skill_key

---

### `vault_items`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| category_id | UUID | — | NO | FK vault_categories |
| content_type | TEXT | — | NO | CHECK: 'tutorial','ai_tool','prompt_pack','curation','workflow','skill' |
| title | TEXT | — | NO | |
| hook_title | TEXT | — | YES | |
| detail_title | TEXT | — | YES | |
| hook_description | TEXT | — | YES | |
| detail_description | TEXT | — | YES | |
| slug | TEXT | — | NO | UNIQUE |
| thumbnail_url | TEXT | — | YES | |
| content_body | TEXT | — | YES | |
| delivery_method | TEXT | — | YES | CHECK: 'native','embedded','link_out' |
| embed_url | TEXT | — | YES | |
| link_url | TEXT | — | YES | |
| target_platforms | TEXT[] | '{}' | NO | |
| prompt_format | TEXT | — | YES | CHECK: 'text_llm','image_gen','video_gen','audio_gen' |
| tags | TEXT[] | '{}' | NO | |
| difficulty_level | TEXT | — | YES | |
| estimated_time | TEXT | — | YES | |
| learning_ladder | TEXT | — | YES | |
| allowed_tiers | TEXT[] | '{}' | NO | |
| status | TEXT | 'draft' | NO | CHECK: 'draft','published','archived' |
| usage_limit | INTEGER | — | YES | |
| is_featured | BOOLEAN | false | NO | |
| sort_order | INTEGER | 0 | NO | |
| last_published_at | TIMESTAMPTZ | — | YES | PRD-21B |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Published items readable by users with tier access. Admin can manage all.
**Indexes:** `idx_vi_slug` UNIQUE ON slug; `idx_vi_category` ON category_id; `idx_vi_status` ON status; `idx_vi_content_type` ON content_type; `idx_vi_featured` ON is_featured WHERE is_featured = true
**Triggers:** `trg_vi_updated_at`

---

### `vault_categories`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| slug | TEXT | — | NO | UNIQUE |
| display_name | TEXT | — | NO | |
| description | TEXT | — | YES | |
| icon | TEXT | — | YES | |
| color | TEXT | — | YES | |
| sort_order | INTEGER | 0 | NO | |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_vc2_slug` UNIQUE ON slug; `idx_vc2_active` ON is_active WHERE is_active = true

---

### `vault_prompt_entries`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| vault_item_id | UUID | — | NO | FK vault_items |
| title | TEXT | — | NO | |
| prompt_text | TEXT | — | NO | |
| variable_placeholders | JSONB | — | YES | |
| example_outputs | JSONB | — | YES | |
| reference_images | TEXT[] | '{}' | NO | |
| tags | TEXT[] | '{}' | NO | |
| sort_order | INTEGER | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from vault_items.
**Indexes:** `idx_vpe_item` ON vault_item_id
**Triggers:** `trg_vpe_updated_at`

---

### `vault_collection_items`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| collection_id | UUID | — | NO | FK vault_items |
| item_id | UUID | — | NO | FK vault_items |
| sort_order | INTEGER | 0 | NO | |

**RLS:** Inherits from vault_items.
**Indexes:** `idx_vci_collection` ON collection_id; `idx_vci_item` ON item_id

---

### `vault_user_bookmarks`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| user_id | UUID | — | NO | FK family_members |
| vault_item_id | UUID | — | NO | FK vault_items |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_vub_user_item` UNIQUE ON (user_id, vault_item_id)

---

### `vault_user_progress`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| user_id | UUID | — | NO | FK family_members |
| vault_item_id | UUID | — | NO | FK vault_items |
| progress_status | TEXT | 'not_started' | NO | CHECK: 'not_started','in_progress','completed' |
| progress_percent | INTEGER | 0 | NO | |
| last_accessed_at | TIMESTAMPTZ | — | YES | |
| completed_at | TIMESTAMPTZ | — | YES | |

**RLS:** Member can manage own.
**Indexes:** `idx_vup_user` ON user_id; `idx_vup_item` ON vault_item_id

---

### `vault_user_visits`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| user_id | UUID | — | NO | FK family_members |
| visited_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_vuv_user` ON user_id; `idx_vuv_visited` ON visited_at DESC

---

### `vault_first_sightings`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| user_id | UUID | — | NO | FK family_members |
| vault_item_id | UUID | — | NO | FK vault_items |
| first_seen_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_vfs_user_item` UNIQUE ON (user_id, vault_item_id)

---

### `vault_tool_sessions`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| user_id | UUID | — | NO | FK family_members |
| vault_item_id | UUID | — | NO | FK vault_items |
| session_token | TEXT | — | NO | UNIQUE |
| started_at | TIMESTAMPTZ | now() | NO | |
| expires_at | TIMESTAMPTZ | — | NO | |
| last_activity_at | TIMESTAMPTZ | — | YES | |
| is_active | BOOLEAN | true | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_vts_token` UNIQUE ON session_token; `idx_vts_user` ON user_id; `idx_vts_active` ON (user_id) WHERE is_active = true

---

### `vault_copy_events`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| user_id | UUID | — | NO | FK family_members |
| vault_item_id | UUID | — | NO | FK vault_items |
| copy_type | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Service role writes. Admin reads.
**Indexes:** `idx_vce_user` ON user_id; `idx_vce_item` ON vault_item_id

---

### `user_saved_prompts`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| user_id | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| prompt_text | TEXT | — | NO | |
| source_vault_item_id | UUID | — | YES | FK vault_items |
| is_lila_optimized | BOOLEAN | false | NO | |
| tags | TEXT[] | '{}' | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_usp_user` ON user_id
**Triggers:** `trg_usp_updated_at`

---

### `vault_content_requests`
**PRD:** PRD-21A | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| user_id | UUID | — | NO | FK family_members |
| topic | TEXT | — | NO | |
| description | TEXT | — | YES | |
| category_suggestion | TEXT | — | YES | |
| priority | TEXT | 'normal' | NO | |
| status | TEXT | 'pending' | NO | CHECK: 'pending','reviewed','planned','completed' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can insert. Admin can manage.
**Indexes:** `idx_vcr_status` ON status

---

### `vault_engagement`
**PRD:** PRD-21C | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| vault_item_id | UUID | — | NO | FK vault_items |
| user_id | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Authenticated users can toggle own.
**Indexes:** `idx_ve_item_user` UNIQUE ON (vault_item_id, user_id)

---

### `vault_comments`
**PRD:** PRD-21C | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| vault_item_id | UUID | — | NO | FK vault_items |
| parent_comment_id | UUID | — | YES | FK vault_comments (self-ref) |
| user_id | UUID | — | NO | FK family_members |
| author_display_name | TEXT | — | NO | |
| content | TEXT | — | NO | |
| depth_level | INTEGER | 0 | NO | CHECK: depth_level <= 3 |
| moderation_status | TEXT | 'approved' | NO | CHECK: 'approved','flagged','hidden','removed' |
| moderation_flags | TEXT[] | '{}' | NO | |
| report_count | INTEGER | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Approved comments public read. Author can insert/update own. Moderator can manage all.
**Indexes:** `idx_vco_item` ON vault_item_id; `idx_vco_parent` ON parent_comment_id WHERE parent_comment_id IS NOT NULL; `idx_vco_moderation` ON moderation_status

---

### `vault_comment_reports`
**PRD:** PRD-21C | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| comment_id | UUID | — | NO | FK vault_comments |
| user_id | UUID | — | NO | FK family_members |
| reason | TEXT | — | NO | |
| additional_details | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Authenticated user can insert. Moderator can read.
**Indexes:** `idx_vcr2_comment` ON comment_id

---

### `vault_moderation_log`
**PRD:** PRD-21C | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| comment_id | UUID | — | NO | FK vault_comments |
| moderator_id | UUID | — | NO | FK staff_permissions.user_id |
| action | TEXT | — | NO | |
| reason | TEXT | — | YES | |
| previous_status | TEXT | — | NO | |
| new_status | TEXT | — | NO | |
| automated | BOOLEAN | false | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Moderator can read/write.
**Indexes:** `idx_vml_comment` ON comment_id; `idx_vml_moderator` ON moderator_id

---

### `vault_satisfaction_signals`
**PRD:** PRD-21C | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| vault_item_id | UUID | — | NO | FK vault_items |
| user_id | UUID | — | NO | FK family_members |
| signal | TEXT | — | NO | CHECK: 'thumbs_up','thumbs_down' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Authenticated user can toggle own.
**Indexes:** `idx_vss_item_user` UNIQUE ON (vault_item_id, user_id)

---

### `vault_engagement_config`
**PRD:** PRD-21C | **Domain:** vault

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| key | TEXT | — | NO | UNIQUE |
| value | JSONB | — | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_vec_key` UNIQUE ON key

---

### `member_emails`
**PRD:** PRD-22 | **Domain:** settings

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_member_id | UUID | — | NO | FK family_members |
| email | TEXT | — | NO | |
| is_primary | BOOLEAN | false | NO | |
| is_verified | BOOLEAN | false | NO | |
| verification_token | TEXT | — | YES | |
| verification_expires_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Primary parent can read children's.
**Indexes:** `idx_me2_member` ON family_member_id; `idx_me2_email` ON email

---

### `data_exports`
**PRD:** PRD-22 | **Domain:** settings

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| requested_by | UUID | — | NO | FK family_members |
| status | TEXT | — | NO | CHECK: 'pending','processing','completed','failed' |
| file_url | TEXT | — | YES | |
| file_expires_at | TIMESTAMPTZ | — | YES | |
| error_message | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage.
**Indexes:** `idx_de_family` ON family_id; `idx_de_status` ON status

---

### `account_deletions`
**PRD:** PRD-22 | **Domain:** settings

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | YES | FK family_members |
| deletion_type | TEXT | — | NO | CHECK: 'family','member' |
| requested_at | TIMESTAMPTZ | now() | NO | |
| grace_period_ends_at | TIMESTAMPTZ | — | NO | |
| hard_deleted_at | TIMESTAMPTZ | — | YES | |
| cancelled_at | TIMESTAMPTZ | — | YES | |
| status | TEXT | 'pending' | NO | CHECK: 'pending','completed','cancelled' |

**RLS:** Primary parent can manage.
**Indexes:** `idx_ad_family` ON family_id; `idx_ad_status` ON status; `idx_ad_grace` ON grace_period_ends_at WHERE status = 'pending'

---

### `bookshelf_items`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| uploaded_by | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| author | TEXT | — | YES | |
| genres | TEXT[] | '{}' | NO | |
| tags | TEXT[] | '{}' | NO | |
| file_type | TEXT | — | NO | CHECK: 'pdf','epub','docx','txt','image','text_note' |
| file_url | TEXT | — | YES | |
| file_size | INTEGER | — | YES | |
| summary | TEXT | — | YES | |
| folder_id | UUID | — | YES | FK archive_folders |
| processing_status | TEXT | 'uploading' | NO | CHECK: 'uploading','extracting','analyzing','embedding','classifying','complete','failed' |
| last_viewed_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read own family. Uploader can manage.
**Indexes:** `idx_bi2_family` ON family_id; `idx_bi2_status` ON processing_status; `idx_bi2_uploaded` ON uploaded_by
**Triggers:** `trg_bi2_updated_at`

---

### `bookshelf_chapters`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| bookshelf_item_id | UUID | — | NO | FK bookshelf_items |
| chapter_index | INTEGER | — | NO | |
| chapter_title | TEXT | — | NO | |
| start_chunk_index | INTEGER | — | NO | |
| end_chunk_index | INTEGER | — | NO | |

**RLS:** Inherits from bookshelf_items.
**Indexes:** `idx_bc_item` ON bookshelf_item_id

---

### `bookshelf_chunks`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| bookshelf_item_id | UUID | — | NO | FK bookshelf_items |
| chunk_index | INTEGER | — | NO | |
| text | TEXT | — | NO | |
| embedding | vector(1536) | — | YES | |
| tokens_count | INTEGER | — | NO | |

**RLS:** Inherits from bookshelf_items.
**Indexes:** `idx_bch_item` ON bookshelf_item_id; `idx_bch_embedding` USING ivfflat ON embedding WHERE embedding IS NOT NULL

---

### `bookshelf_summaries`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| bookshelf_item_id | UUID | — | NO | FK bookshelf_items |
| chapter_id | UUID | — | YES | FK bookshelf_chapters |
| content_type | TEXT | — | NO | CHECK: 'key_concept','story','quote','insight' |
| text | TEXT | — | NO | |
| is_from_go_deeper | BOOLEAN | false | NO | |
| is_key_point | BOOLEAN | false | NO | |
| audience | TEXT | — | YES | |
| is_hearted | BOOLEAN | false | NO | |
| user_note | TEXT | — | YES | |
| user_id | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** User can manage own. Family can read shared.
**Indexes:** `idx_bs_item` ON bookshelf_item_id; `idx_bs_user` ON user_id; `idx_bs_hearted` ON (user_id) WHERE is_hearted = true

---

### `bookshelf_insights`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| bookshelf_item_id | UUID | — | NO | FK bookshelf_items |
| chapter_id | UUID | — | YES | FK bookshelf_chapters |
| content_type | TEXT | — | NO | CHECK: 'principle','framework','mental_model','process','strategy','concept','system','tool_set' |
| text | TEXT | — | NO | |
| is_hearted | BOOLEAN | false | NO | |
| user_note | TEXT | — | YES | |
| user_id | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** User can manage own. Family can read shared.
**Indexes:** `idx_bi_item` ON bookshelf_item_id; `idx_bi_user` ON user_id; `idx_bi_type` ON content_type

---

### `bookshelf_declarations`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| bookshelf_item_id | UUID | — | NO | FK bookshelf_items |
| chapter_id | UUID | — | YES | FK bookshelf_chapters |
| declaration_text | TEXT | — | NO | |
| style_variant | TEXT | — | YES | |
| is_hearted | BOOLEAN | false | NO | |
| user_note | TEXT | — | YES | |
| user_id | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** User can manage own.
**Indexes:** `idx_bd_item` ON bookshelf_item_id; `idx_bd_user` ON user_id

---

### `bookshelf_action_steps`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| bookshelf_item_id | UUID | — | NO | FK bookshelf_items |
| chapter_id | UUID | — | YES | FK bookshelf_chapters |
| action_type | TEXT | — | NO | CHECK: 'exercise','practice','habit','conversation_starter' |
| text | TEXT | — | NO | |
| is_hearted | BOOLEAN | false | NO | |
| user_note | TEXT | — | YES | |
| user_id | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** User can manage own.
**Indexes:** `idx_bas_item` ON bookshelf_item_id; `idx_bas_user` ON user_id

---

### `bookshelf_questions`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| bookshelf_item_id | UUID | — | NO | FK bookshelf_items |
| chapter_id | UUID | — | YES | FK bookshelf_chapters |
| question_text | TEXT | — | NO | |
| question_type | TEXT | — | NO | CHECK: 'reflection','implementation','recognition','self_examination','discussion','scenario' |
| is_hearted | BOOLEAN | false | NO | |
| user_note | TEXT | — | YES | |
| user_id | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** User can manage own.
**Indexes:** `idx_bq_item` ON bookshelf_item_id; `idx_bq_user` ON user_id; `idx_bq_type` ON question_type

---

### `bookshelf_discussions`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| bookshelf_item_id | UUID | — | NO | FK bookshelf_items |
| member_id | UUID | — | NO | FK family_members |
| selected_book_ids | UUID[] | — | YES | |
| audience | TEXT | — | NO | CHECK: 'personal','family','teen','spouse','children' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_bdi_item` ON bookshelf_item_id; `idx_bdi_member` ON member_id

---

### `bookshelf_discussion_messages`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| discussion_id | UUID | — | NO | FK bookshelf_discussions |
| member_id | UUID | — | NO | FK family_members |
| is_lila_response | BOOLEAN | false | NO | |
| content | TEXT | — | NO | |
| rag_context | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from bookshelf_discussions.
**Indexes:** `idx_bdm_discussion` ON discussion_id

---

### `bookshelf_collections`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| creator_id | UUID | — | NO | FK family_members |
| name | TEXT | — | NO | |
| description | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family can read. Creator can manage.
**Indexes:** `idx_bcol_family` ON family_id; `idx_bcol_creator` ON creator_id

---

### `bookshelf_collection_items`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| collection_id | UUID | — | NO | FK bookshelf_collections |
| bookshelf_item_id | UUID | — | NO | FK bookshelf_items |
| sort_order | INTEGER | 0 | NO | |

**RLS:** Inherits from bookshelf_collections.
**Indexes:** `idx_bci_collection` ON collection_id

---

### `journal_prompts`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| member_id | UUID | — | NO | FK family_members |
| source | TEXT | — | NO | CHECK: 'bookshelf_question','manual' |
| source_question_id | UUID | — | YES | FK bookshelf_questions |
| prompt_text | TEXT | — | NO | |
| tags | TEXT[] | '{}' | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_jp_member` ON member_id

---

### `bookshelf_member_settings`
**PRD:** PRD-23 | **Domain:** bookshelf

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| knowledge_in_lila | TEXT | 'hearted_only' | NO | CHECK: 'hearted_only','all','principles_only','none' |
| library_sort | TEXT | — | YES | |
| library_layout | TEXT | — | YES | |
| library_group_mode | TEXT | — | YES | |
| resurfaced_item_ids | UUID[] | '{}' | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_bms_family_member` UNIQUE ON (family_id, member_id)
**Triggers:** `trg_bms_updated_at`

---

## Gamification (PRD-24 family)

### `gamification_configs`
**PRD:** PRD-24 + PRD-24A | **Domain:** gamification

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | NO | FK family_members |
| enabled | BOOLEAN | true | NO | |
| currency_name | TEXT | 'Stars' | NO | |
| currency_icon | TEXT | 'star' | NO | |
| base_points_per_task | INTEGER | 10 | NO | |
| bonus_at_three | INTEGER | 5 | NO | |
| bonus_at_five | INTEGER | 10 | NO | |
| routine_points_mode | TEXT | 'per_step' | NO | |
| streak_grace_days | INTEGER | 1 | NO | |
| streak_schedule_aware | BOOLEAN | true | NO | |
| streak_pause_enabled | BOOLEAN | false | NO | |
| visualization_mode | TEXT | 'simple' | NO | |
| level_thresholds | JSONB | — | YES | |
| default_reveal_type | TEXT | — | YES | PRD-24B |
| dashboard_background_key | TEXT | — | YES | PRD-24A |
| overlay_id | UUID | — | YES | |
| treasure_box_template | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Member can read own.
**Indexes:** `idx_gc_family_member` UNIQUE ON (family_id, family_member_id)
**Triggers:** `trg_gc_updated_at`

---

### `gamification_events`
**PRD:** PRD-24 | **Domain:** gamification

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | NO | FK family_members |
| event_type | TEXT | — | NO | |
| points_amount | INTEGER | — | NO | |
| balance_after | INTEGER | — | NO | |
| source | TEXT | — | NO | |
| source_reference_id | UUID | — | YES | |
| description | TEXT | — | YES | |
| metadata | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own. Append-only ledger.
**Indexes:** `idx_ge_family_member` ON (family_id, family_member_id); `idx_ge_type` ON event_type; `idx_ge_created` ON created_at DESC

---

### `gamification_rewards`
**PRD:** PRD-24 | **Domain:** gamification

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | NO | FK family_members |
| name | TEXT | — | NO | |
| description | TEXT | — | YES | |
| icon | TEXT | — | YES | |
| points_cost | INTEGER | — | NO | |
| approval_type | TEXT | 'manual' | NO | CHECK: 'auto','manual' |
| availability | TEXT | 'always' | NO | |
| max_redemptions | INTEGER | — | YES | |
| redemption_count | INTEGER | 0 | NO | |
| recurrence_config | JSONB | — | YES | |
| notes_to_child | TEXT | — | YES | |
| sort_order | INTEGER | 0 | NO | |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Member can read own.
**Indexes:** `idx_gre_family_member` ON (family_id, family_member_id); `idx_gre_active` ON is_active WHERE is_active = true
**Triggers:** `trg_gre_updated_at`

---

### `reward_redemptions`
**PRD:** PRD-24 | **Domain:** gamification

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | NO | FK family_members |
| reward_id | UUID | — | NO | FK gamification_rewards |
| points_cost | INTEGER | — | NO | |
| status | TEXT | 'pending' | NO | CHECK: 'pending','approved','denied','completed' |
| request_id | UUID | — | YES | |
| approved_by | UUID | — | YES | FK family_members |
| approved_at | TIMESTAMPTZ | — | YES | |
| denied_reason | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can insert own. Primary parent can approve/deny.
**Indexes:** `idx_rr2_family_member` ON (family_id, family_member_id); `idx_rr2_status` ON status; `idx_rr2_reward` ON reward_id
**Triggers:** `trg_rr2_updated_at`

---

### `treasure_boxes`
**PRD:** PRD-24 + PRD-24B | **Domain:** gamification

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | NO | FK family_members |
| name | TEXT | — | NO | |
| reveal_type | TEXT | — | YES | PRD-24B (replaces animation_template) |
| trigger_type | TEXT | — | NO | |
| trigger_config | JSONB | — | NO | |
| progress_visible | BOOLEAN | true | NO | |
| content_type | TEXT | — | NO | |
| reward_id | UUID | — | YES | FK gamification_rewards |
| randomizer_list_id | UUID | — | YES | FK lists |
| is_repeating | BOOLEAN | false | NO | |
| status | TEXT | 'locked' | NO | CHECK: 'locked','in_progress','unlocked' |
| current_progress | INTEGER | 0 | NO | |
| unlocked_at | TIMESTAMPTZ | — | YES | |
| deploy_widget | BOOLEAN | false | NO | |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Member can read own.
**Indexes:** `idx_tb_family_member` ON (family_id, family_member_id); `idx_tb_status` ON status; `idx_tb_active` ON is_active WHERE is_active = true
**Triggers:** `trg_tb_updated_at`

---

### `treasure_box_opens`
**PRD:** PRD-24 | **Domain:** gamification

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| treasure_box_id | UUID | — | NO | FK treasure_boxes |
| family_member_id | UUID | — | NO | FK family_members |
| reward_revealed | TEXT | — | YES | |
| reward_id | UUID | — | YES | FK gamification_rewards |
| randomizer_item_id | UUID | — | YES | FK list_items |
| reveal_type_used | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own.
**Indexes:** `idx_tbo_box` ON treasure_box_id; `idx_tbo_member` ON family_member_id

---

### `gamification_achievements`
**PRD:** PRD-24 | **Domain:** gamification

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | NO | FK family_members |
| achievement_type | TEXT | — | NO | |
| achievement_key | TEXT | — | NO | |
| achievement_value | JSONB | — | YES | |
| badge_icon | TEXT | — | YES | |
| badge_name | TEXT | — | YES | |
| earned_at | TIMESTAMPTZ | now() | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own. Family can view.
**Indexes:** `idx_ga_family_member` ON (family_id, family_member_id); `idx_ga_type_key` ON (achievement_type, achievement_key)

---

### `gamification_daily_summaries`
**PRD:** PRD-24 | **Domain:** gamification

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | NO | FK family_members |
| summary_date | DATE | — | NO | |
| points_earned_today | INTEGER | 0 | NO | |
| tasks_completed_today | INTEGER | 0 | NO | |
| streak_count | INTEGER | 0 | NO | |
| streak_milestone_today | BOOLEAN | false | NO | |
| level_at_end_of_day | INTEGER | — | NO | |
| treasure_boxes_opened | INTEGER | 0 | NO | |
| achievements_earned_today | JSONB | — | YES | |
| background_change_today | JSONB | — | YES | PRD-24A |
| overlay_progress_today | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own.
**Indexes:** `idx_gds_family_member_date` UNIQUE ON (family_id, family_member_id, summary_date)
**Triggers:** `trg_gds_updated_at`

---

### `overlay_instances`
**PRD:** PRD-24A | **Domain:** gamification

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | NO | FK family_members |
| overlay_config_key | TEXT | — | NO | |
| status | TEXT | — | NO | CHECK: 'active','completed','paused' |
| mapped_categories | JSONB | — | YES | |
| stage | INTEGER | 1 | NO | |
| current_progress | INTEGER | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own. Primary parent can manage.
**Indexes:** `idx_oi_family_member` ON (family_id, family_member_id); `idx_oi_status` ON status
**Triggers:** `trg_oi_updated_at`

---

### `overlay_collectibles`
**PRD:** PRD-24A | **Domain:** gamification

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | NO | FK family_members |
| overlay_instance_id | UUID | — | NO | FK overlay_instances |
| collectible_type | TEXT | — | NO | |
| collectible_image | TEXT | — | YES | |
| daily_effort_size | TEXT | — | NO | |
| date_earned | DATE | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own.
**Indexes:** `idx_oc_instance` ON overlay_instance_id; `idx_oc_date` ON date_earned

---

### `recipe_completions`
**PRD:** PRD-24A | **Domain:** gamification

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| family_member_id | UUID | — | NO | FK family_members |
| recipe_id | TEXT | — | NO | |
| ingredients_used | JSONB | — | NO | |
| reward_revealed | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own.
**Indexes:** `idx_rco2_family_member` ON (family_id, family_member_id)

---

## Platform Complete (PRD-27 through PRD-38)

### `trackable_event_categories`
**PRD:** PRD-27 | **Domain:** caregiving

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| child_id | UUID | — | NO | FK family_members |
| category_name | TEXT | — | NO | |
| icon | TEXT | — | YES | |
| sort_order | INTEGER | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Caregivers can read assigned children.
**Indexes:** `idx_tec_family_child` ON (family_id, child_id)

---

### `trackable_event_logs`
**PRD:** PRD-27 | **Domain:** caregiving

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| child_id | UUID | — | NO | FK family_members |
| category_id | UUID | — | NO | FK trackable_event_categories |
| logged_by | UUID | — | NO | FK family_members |
| note | TEXT | — | YES | |
| event_timestamp | TIMESTAMPTZ | now() | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Caregivers with access can insert. Primary parent can read all.
**Indexes:** `idx_tel_family_child` ON (family_id, child_id); `idx_tel_category` ON category_id; `idx_tel_timestamp` ON event_timestamp DESC

---

### `shift_reports`
**PRD:** PRD-27 | **Domain:** caregiving

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| caregiver_id | UUID | — | NO | FK family_members |
| report_type | TEXT | — | NO | CHECK: 'shift','custom_range' |
| period_start | TIMESTAMPTZ | — | NO | |
| period_end | TIMESTAMPTZ | — | NO | |
| content | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Caregiver can read own. Primary parent can read all.
**Indexes:** `idx_sr_family` ON family_id; `idx_sr_caregiver` ON caregiver_id

---

### `allowance_configs`
**PRD:** PRD-28 | **Domain:** finance

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| child_id | UUID | — | NO | FK family_members |
| approach | TEXT | — | NO | CHECK: 'fixed','task_based','hybrid' |
| amount | DECIMAL | — | YES | |
| frequency | TEXT | — | YES | |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Child can read own.
**Indexes:** `idx_ac_family_child` ON (family_id, child_id)
**Triggers:** `trg_ac_updated_at`

---

### `financial_transactions`
**PRD:** PRD-28 | **Domain:** finance

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| transaction_type | TEXT | — | NO | |
| amount | DECIMAL | — | NO | |
| description | TEXT | — | YES | |
| source_reference_id | UUID | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own. Primary parent can read all family.
**Indexes:** `idx_ft_family_member` ON (family_id, member_id); `idx_ft_created` ON created_at DESC

---

### `allowance_periods`
**PRD:** PRD-28 | **Domain:** finance

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| child_id | UUID | — | NO | FK family_members |
| period_start | DATE | — | NO | |
| period_end | DATE | — | NO | |
| status | TEXT | — | NO | CHECK: 'active','completed','pending' |
| amount_due | DECIMAL | — | NO | |
| amount_paid | DECIMAL | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Child can read own.
**Indexes:** `idx_ap_family_child` ON (family_id, child_id); `idx_ap_status` ON status

---

### `loans`
**PRD:** PRD-28 | **Domain:** finance

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| borrower_id | UUID | — | NO | FK family_members |
| lender_id | UUID | — | NO | FK family_members |
| amount | DECIMAL | — | NO | |
| balance | DECIMAL | — | NO | |
| terms | JSONB | — | YES | |
| status | TEXT | 'active' | NO | CHECK: 'active','paid','forgiven' |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Borrower and lender can read. Primary parent can manage.
**Indexes:** `idx_l_family` ON family_id; `idx_l_borrower` ON borrower_id; `idx_l_status` ON status
**Triggers:** `trg_l_updated_at`

---

### `homeschool_subjects`
**PRD:** PRD-28 | **Domain:** education

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| name | TEXT | — | NO | |
| color | TEXT | — | YES | |
| icon | TEXT | — | YES | |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family can read. Primary parent can manage.
**Indexes:** `idx_hs_family` ON family_id

---

### `homeschool_configs`
**PRD:** PRD-28 | **Domain:** education

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| child_id | UUID | — | NO | FK family_members |
| time_allocation_mode | TEXT | — | NO | CHECK: 'time_based','percentage_based','flexible' |
| subject_allocations | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage. Child can read own.
**Indexes:** `idx_hc_family_child` ON (family_id, child_id)
**Triggers:** `trg_hc_updated_at`

---

### `homeschool_time_logs`
**PRD:** PRD-28 | **Domain:** education

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| child_id | UUID | — | NO | FK family_members |
| subject_id | UUID | — | NO | FK homeschool_subjects |
| duration_minutes | INTEGER | — | NO | |
| log_source | TEXT | — | NO | CHECK: 'manual','timer','task','widget' |
| source_reference_id | UUID | — | YES | |
| status | TEXT | 'logged' | NO | CHECK: 'logged','verified','disputed' |
| logged_date | DATE | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Child can insert own. Primary parent can manage all.
**Indexes:** `idx_htl_family_child` ON (family_id, child_id); `idx_htl_subject` ON subject_id; `idx_htl_date` ON logged_date

---

### `homeschool_family_config`
**PRD:** PRD-28B | **Domain:** education

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families, UNIQUE |
| state | TEXT | — | NO | |
| school_year_start | DATE | — | YES | |
| school_year_end | DATE | — | YES | |
| evaluator_name | TEXT | — | YES | |
| esa_program | TEXT | — | YES | |
| reporting_schedule | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage.
**Indexes:** `idx_hfc_family` UNIQUE ON family_id
**Triggers:** `trg_hfc_updated_at`

---

### `homeschool_student_config`
**PRD:** PRD-28B | **Domain:** education

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| child_id | UUID | — | NO | FK family_members |
| grade_level | TEXT | — | YES | |
| standards_framework | TEXT | — | YES | CHECK: 'common_core','state_specific','classical','custom' |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage.
**Indexes:** `idx_hsc_family_child` ON (family_id, child_id)
**Triggers:** `trg_hsc_updated_at`

---

### `education_standards`
**PRD:** PRD-28B | **Domain:** education

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| framework | TEXT | — | NO | |
| grade_level | TEXT | — | NO | |
| subject_area | TEXT | — | NO | |
| standard_code | TEXT | — | NO | |
| standard_text | TEXT | — | NO | |
| parent_standard_id | UUID | — | YES | FK education_standards (self-ref) |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_es_framework` ON framework; `idx_es_grade_subject` ON (grade_level, subject_area); `idx_es_code` ON standard_code; `idx_es_parent` ON parent_standard_id

---

### `standard_evidence`
**PRD:** PRD-28B | **Domain:** education

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| child_id | UUID | — | NO | FK family_members |
| standard_id | UUID | — | NO | FK education_standards |
| evidence_type | TEXT | — | NO | CHECK: 'portfolio_moment','task_completion','document_upload','manual' |
| evidence_source_id | UUID | — | YES | |
| evidence_link_source | TEXT | — | NO | CHECK: 'manual','auto_task','auto_lila' |
| notes | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage.
**Indexes:** `idx_se_family_child` ON (family_id, child_id); `idx_se_standard` ON standard_id

---

### `report_templates`
**PRD:** PRD-28B | **Domain:** education

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| name | TEXT | — | NO | |
| report_category | TEXT | — | NO | CHECK: 'general','homeschool','disability','family','financial' |
| template_type | TEXT | — | NO | |
| template_config | JSONB | — | YES | |
| is_system | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_rt_category` ON report_category; `idx_rt_type` ON template_type
**Triggers:** `trg_rt_updated_at`

---

### `esa_invoices`
**PRD:** PRD-28B | **Domain:** education

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| child_id | UUID | — | NO | FK family_members |
| invoice_number | TEXT | — | NO | UNIQUE |
| period_start | DATE | — | NO | |
| period_end | DATE | — | NO | |
| items | JSONB | — | NO | |
| total_amount | DECIMAL | — | NO | |
| status | TEXT | — | NO | CHECK: 'draft','finalized','submitted' |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage.
**Indexes:** `idx_ei_family` ON family_id; `idx_ei_number` UNIQUE ON invoice_number; `idx_ei_status` ON status
**Triggers:** `trg_ei_updated_at`

---

### `plans`
**PRD:** PRD-29 | **Domain:** planning

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| title | TEXT | — | NO | |
| description | TEXT | — | YES | |
| status | TEXT | — | NO | CHECK: 'planning','active','completed','paused','archived' |
| parent_plan_id | UUID | — | YES | FK plans (self-ref) |
| completion_percentage | INTEGER | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Parent can read children's.
**Indexes:** `idx_p_family_member` ON (family_id, member_id); `idx_p_status` ON status; `idx_p_parent` ON parent_plan_id WHERE parent_plan_id IS NOT NULL
**Triggers:** `trg_p_updated_at`

---

### `plan_milestones`
**PRD:** PRD-29 | **Domain:** planning

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| plan_id | UUID | — | NO | FK plans |
| title | TEXT | — | NO | |
| due_date | DATE | — | YES | |
| status | TEXT | — | NO | CHECK: 'pending','in_progress','completed' |
| sort_order | INTEGER | — | NO | |
| completed_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from plans.
**Indexes:** `idx_pm_plan` ON plan_id; `idx_pm_status` ON status
**Triggers:** `trg_pm_updated_at`

---

### `plan_components`
**PRD:** PRD-29 | **Domain:** planning

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| plan_id | UUID | — | NO | FK plans |
| component_type | TEXT | — | NO | CHECK: 'task','widget','intention','tracker' |
| component_reference_id | UUID | — | YES | |
| config | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from plans.
**Indexes:** `idx_pc_plan` ON plan_id; `idx_pc_type` ON component_type

---

### `plan_check_ins`
**PRD:** PRD-29 | **Domain:** planning

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| plan_id | UUID | — | NO | FK plans |
| member_id | UUID | — | NO | FK family_members |
| conversation_id | UUID | — | YES | FK lila_conversations |
| notes | TEXT | — | YES | |
| progress_snapshot | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from plans.
**Indexes:** `idx_pci_plan` ON plan_id

---

### `friction_diagnosis_templates`
**PRD:** PRD-29 | **Domain:** planning

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| obstacle_pattern | TEXT | — | NO | |
| cause_pattern | TEXT | — | NO | |
| solution_pattern | TEXT | — | NO | |
| is_system | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_fdt_system` ON is_system

---

### `safety_monitoring_configs`
**PRD:** PRD-30 | **Domain:** safety

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| is_monitored | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage.
**Indexes:** `idx_smc_family_member` UNIQUE ON (family_id, member_id)
**Triggers:** `trg_smc_updated_at`

---

### `safety_sensitivity_configs`
**PRD:** PRD-30 | **Domain:** safety

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| category | TEXT | — | NO | CHECK: 'self_harm','abuse','sexual_predatory','substance','eating_disorder','bullying','profanity','other' |
| sensitivity | TEXT | — | NO | CHECK: 'low','medium','high' |
| is_locked | BOOLEAN | false | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage.
**Indexes:** `idx_ssc_family_member` ON (family_id, member_id); `idx_ssc_category` ON category
**Triggers:** `trg_ssc_updated_at`

---

### `safety_notification_recipients`
**PRD:** PRD-30 | **Domain:** safety

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage.
**Indexes:** `idx_snr_family` ON family_id

---

### `safety_flags`
**PRD:** PRD-30 | **Domain:** safety

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| flagged_member_id | UUID | — | NO | FK family_members |
| category | TEXT | — | NO | |
| severity | TEXT | — | NO | CHECK: 'concern','warning','critical' |
| context_snippet | TEXT | — | NO | |
| keywords_matched | TEXT[] | '{}' | NO | |
| classification_reasoning | TEXT | — | YES | |
| source_conversation_id | UUID | — | YES | FK lila_conversations |
| is_reviewed | BOOLEAN | false | NO | |
| reviewed_by | UUID | — | YES | FK family_members |
| reviewed_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Safety notification recipients can read. Primary parent can manage. NEVER visible to flagged member.
**Indexes:** `idx_sf_family` ON family_id; `idx_sf_member` ON flagged_member_id; `idx_sf_severity` ON severity; `idx_sf_unreviewed` ON (family_id) WHERE is_reviewed = false; `idx_sf_created` ON created_at DESC

---

### `safety_keywords`
**PRD:** PRD-30 | **Domain:** safety

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| category | TEXT | — | NO | |
| keyword | TEXT | — | NO | |
| severity_weight | TEXT | — | NO | CHECK: 'low','medium','high' |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Service role and admin only. Never exposed to users.
**Indexes:** `idx_skw_category` ON category; `idx_skw_active` ON is_active WHERE is_active = true

---

### `safety_resources`
**PRD:** PRD-30 | **Domain:** safety

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| category | TEXT | — | NO | |
| resource_type | TEXT | — | NO | CHECK: 'hotline','website','article','book' |
| title | TEXT | — | NO | |
| contact | TEXT | — | YES | |
| url | TEXT | — | YES | |
| description | TEXT | — | YES | |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_sres_category` ON category; `idx_sres_active` ON is_active WHERE is_active = true

---

### `safety_pattern_summaries`
**PRD:** PRD-30 | **Domain:** safety

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| period_start | DATE | — | NO | |
| period_end | DATE | — | NO | |
| summary_narrative | TEXT | — | NO | |
| flag_count | INTEGER | — | NO | |
| categories_flagged | TEXT[] | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Safety notification recipients can read.
**Indexes:** `idx_sps_family_member` ON (family_id, member_id); `idx_sps_period` ON (period_start, period_end)

---

### `board_personas`
**PRD:** PRD-34 | **Domain:** board_of_directors

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| name | TEXT | — | NO | |
| description | TEXT | — | YES | |
| expertise | TEXT[] | — | YES | |
| personality_traits | JSONB | — | YES | |
| system_prompt_addition | TEXT | — | YES | |
| tier | TEXT | — | NO | CHECK: 'system','community','personal' |
| family_id | UUID | — | YES | FK families; NULL for system/community |
| created_by | UUID | — | YES | FK family_members |
| is_active | BOOLEAN | true | NO | |
| moderation_status | TEXT | 'approved' | NO | CHECK: 'approved','pending','rejected' |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** System tier public read. Community tier approved read. Personal tier family-only.
**Indexes:** `idx_bpe_tier` ON tier; `idx_bpe_family` ON family_id WHERE family_id IS NOT NULL; `idx_bpe_moderation` ON moderation_status
**Triggers:** `trg_bpe_updated_at`

---

### `board_sessions`
**PRD:** PRD-34 | **Domain:** board_of_directors

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| conversation_id | UUID | — | NO | FK lila_conversations |
| topic | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_bse_family_member` ON (family_id, member_id); `idx_bse_conversation` ON conversation_id

---

### `board_session_personas`
**PRD:** PRD-34 | **Domain:** board_of_directors

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| session_id | UUID | — | NO | FK board_sessions |
| persona_id | UUID | — | NO | FK board_personas |
| seat_position | INTEGER | — | NO | CHECK: seat_position BETWEEN 1 AND 5 |
| is_prayer_seat | BOOLEAN | false | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from board_sessions.
**Indexes:** `idx_bsp_session` ON session_id

---

### `persona_favorites`
**PRD:** PRD-34 | **Domain:** board_of_directors

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| persona_id | UUID | — | NO | FK board_personas |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own.
**Indexes:** `idx_pf_member_persona` UNIQUE ON (member_id, persona_id)

---

### `perspective_lenses`
**PRD:** PRD-34 | **Domain:** board_of_directors

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| name | TEXT | — | NO | |
| lens_type | TEXT | — | NO | CHECK: 'simple_shift','named_framework','family_context','custom' |
| description | TEXT | — | YES | |
| system_prompt_addition | TEXT | — | YES | |
| tier | TEXT | — | NO | CHECK: 'system','community','personal' |
| family_id | UUID | — | YES | FK families |
| created_by | UUID | — | YES | FK family_members |
| moderation_status | TEXT | 'approved' | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** System tier public read. Personal tier family-only.
**Indexes:** `idx_pl_tier` ON tier; `idx_pl_type` ON lens_type; `idx_pl_family` ON family_id WHERE family_id IS NOT NULL

---

### `decision_frameworks`
**PRD:** PRD-34 | **Domain:** board_of_directors

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| name | TEXT | — | NO | |
| description | TEXT | — | NO | |
| system_prompt_addition | TEXT | — | NO | |
| is_system | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_df_system` ON is_system

---

### `family_moments`
**PRD:** PRD-37 | **Domain:** family_feed

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| author_id | UUID | — | NO | FK family_members |
| content | TEXT | — | YES | |
| feed_visibility | TEXT[] | '{family_life}' | NO | |
| moment_source | TEXT | — | NO | CHECK: 'direct','log_learning','bulk_summary','mindsweep','task_completed' |
| status | TEXT | 'published' | NO | CHECK: 'published','pending_approval','rejected','archived' |
| is_portfolio | BOOLEAN | false | NO | |
| portfolio_subject_id | UUID | — | YES | FK family_members |
| portfolio_subject_name | TEXT | — | YES | |
| heart_count | INTEGER | 0 | NO | |
| comment_count | INTEGER | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read published. Author can manage own. Parent approves pending.
**Indexes:** `idx_fm2_family` ON family_id; `idx_fm2_status` ON status; `idx_fm2_created` ON created_at DESC; `idx_fm2_portfolio` ON (family_id, portfolio_subject_id) WHERE is_portfolio = true
**Triggers:** `trg_fm2_updated_at`

---

### `moment_media`
**PRD:** PRD-37 | **Domain:** family_feed

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| moment_id | UUID | — | NO | FK family_moments |
| media_type | TEXT | — | NO | CHECK: 'photo','document','voice_recording' |
| file_url | TEXT | — | NO | |
| file_size | INTEGER | — | YES | |
| ttl_expires_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Inherits from family_moments.
**Indexes:** `idx_mm_moment` ON moment_id

---

### `moment_reactions`
**PRD:** PRD-37 | **Domain:** family_feed

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| moment_id | UUID | — | NO | FK family_moments |
| member_id | UUID | — | NO | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can toggle.
**Indexes:** `idx_mr_moment_member` UNIQUE ON (moment_id, member_id)

---

### `moment_comments`
**PRD:** PRD-37 | **Domain:** family_feed

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| moment_id | UUID | — | NO | FK family_moments |
| member_id | UUID | — | NO | FK family_members |
| content | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Family members can read/insert. Author can delete own.
**Indexes:** `idx_mc_moment` ON moment_id

---

### `out_of_nest_feed_settings`
**PRD:** PRD-37 | **Domain:** family_feed

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| out_of_nest_member_id | UUID | — | NO | FK out_of_nest_members |
| can_view | BOOLEAN | true | NO | |
| can_post | BOOLEAN | false | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage.
**Indexes:** `idx_onfs_family` ON family_id; `idx_onfs_member` ON out_of_nest_member_id
**Triggers:** `trg_onfs_updated_at`

---

### `feed_approval_settings`
**PRD:** PRD-37 | **Domain:** family_feed

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| requires_approval | BOOLEAN | false | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Primary parent can manage.
**Indexes:** `idx_fas_family_member` UNIQUE ON (family_id, member_id)
**Triggers:** `trg_fas_updated_at`

---

### `blog_posts`
**PRD:** PRD-38 | **Domain:** blog

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| title | TEXT | — | NO | |
| slug | TEXT | — | NO | UNIQUE |
| content | TEXT | — | NO | |
| excerpt | TEXT | — | YES | |
| category_id | UUID | — | NO | FK blog_categories |
| featured_image_url | TEXT | — | YES | |
| status | TEXT | 'draft' | NO | CHECK: 'draft','scheduled','published','archived' |
| scheduled_at | TIMESTAMPTZ | — | YES | |
| published_at | TIMESTAMPTZ | — | YES | |
| seo_title | TEXT | — | YES | |
| seo_description | TEXT | — | YES | |
| heart_count | INTEGER | 0 | NO | |
| comment_count | INTEGER | 0 | NO | |
| author_id | UUID | — | NO | FK staff_permissions.user_id |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Published posts public read. Staff can manage.
**Indexes:** `idx_bp2_slug` UNIQUE ON slug; `idx_bp2_status` ON status; `idx_bp2_published` ON published_at DESC WHERE status = 'published'; `idx_bp2_category` ON category_id
**Triggers:** `trg_bp2_updated_at`

---

### `blog_engagement`
**PRD:** PRD-38 | **Domain:** blog

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| post_id | UUID | — | NO | FK blog_posts |
| user_id | UUID | — | YES | FK auth.users |
| device_fingerprint | TEXT | — | YES | For anonymous hearts |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public insert. Admin read.
**Indexes:** `idx_be_post` ON post_id

---

### `blog_comments`
**PRD:** PRD-38 | **Domain:** blog

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| post_id | UUID | — | NO | FK blog_posts |
| user_id | UUID | — | YES | FK auth.users |
| author_display | TEXT | — | NO | |
| geo_display | TEXT | — | YES | |
| content | TEXT | — | NO | |
| moderation_status | TEXT | 'pending' | NO | CHECK: 'approved','pending','rejected' |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Approved comments public read. User can insert. Moderator can manage.
**Indexes:** `idx_bco_post` ON post_id; `idx_bco_moderation` ON moderation_status

---

### `blog_free_tools`
**PRD:** PRD-38 | **Domain:** blog

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| title | TEXT | — | NO | |
| description | TEXT | — | NO | |
| tool_type | TEXT | — | NO | CHECK: 'download','interactive','prompt_template' |
| content | JSONB | — | NO | |
| file_url | TEXT | — | YES | |
| category_id | UUID | — | YES | FK blog_categories |
| sort_order | INTEGER | 0 | NO | |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_bft_active` ON is_active WHERE is_active = true; `idx_bft_category` ON category_id
**Triggers:** `trg_bft_updated_at`

---

### `blog_categories`
**PRD:** PRD-38 | **Domain:** blog

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| name | TEXT | — | NO | |
| slug | TEXT | — | NO | UNIQUE |
| description | TEXT | — | YES | |
| icon | TEXT | — | YES | |
| color | TEXT | — | YES | |
| sort_order | INTEGER | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_bcat_slug` UNIQUE ON slug

---

## Admin & Analytics (PRD-32, PRD-32A)

### `feedback_submissions`
**PRD:** PRD-32 | **Domain:** admin

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| submission_type | TEXT | — | NO | CHECK: 'glitch','feature','praise' |
| title | TEXT | — | NO | |
| description | TEXT | — | NO | |
| screenshot_url | TEXT | — | YES | |
| diagnostics | JSONB | — | YES | |
| sentiment | TEXT | — | YES | |
| auto_triage | TEXT | — | YES | |
| status | TEXT | 'new' | NO | CHECK: 'new','triaged','in_progress','resolved','closed' |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can insert own. Admin can manage all.
**Indexes:** `idx_fbs_family` ON family_id; `idx_fbs_status` ON status; `idx_fbs_type` ON submission_type
**Triggers:** `trg_fbs_updated_at`

---

### `known_issues`
**PRD:** PRD-32 | **Domain:** admin

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| title | TEXT | — | NO | |
| description | TEXT | — | NO | |
| workaround | TEXT | — | YES | |
| keywords | TEXT[] | '{}' | NO | |
| hit_count | INTEGER | 0 | NO | |
| status | TEXT | 'active' | NO | CHECK: 'active','resolved','archived' |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Public read. Admin write.
**Indexes:** `idx_ki_status` ON status; `idx_ki_keywords` USING gin ON keywords
**Triggers:** `trg_ki_updated_at`

---

### `reported_threats`
**PRD:** PRD-32 | **Domain:** admin

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| submission_id | UUID | — | NO | FK feedback_submissions |
| reporter_id | UUID | — | NO | FK staff_permissions.user_id |
| threat_content | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Admin only.
**Indexes:** `idx_rth_submission` ON submission_id

---

### `admin_notes`
**PRD:** PRD-32 | **Domain:** admin

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| target_type | TEXT | — | NO | CHECK: 'user','family','submission' |
| target_id | UUID | — | NO | Polymorphic FK |
| author_id | UUID | — | NO | FK staff_permissions.user_id |
| content | TEXT | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Admin only.
**Indexes:** `idx_an_target` ON (target_type, target_id); `idx_an_author` ON author_id

---

### `ai_usage_log`
**PRD:** PRD-32 | **Domain:** analytics

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | YES | FK family_members |
| feature_key | TEXT | — | NO | |
| model | TEXT | — | NO | |
| tokens_input | INTEGER | — | NO | |
| tokens_output | INTEGER | — | NO | |
| estimated_cost | DECIMAL | — | NO | |
| edge_function | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Append-only. Fire-and-forget. Admin can read. Primary parent can read own family summary.
**Indexes:** `idx_aul_family` ON family_id; `idx_aul_created` ON created_at DESC; `idx_aul_feature` ON feature_key; `idx_aul_model` ON model

---

### `platform_usage_log`
**PRD:** PRD-32 | **Domain:** analytics

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| event_type | TEXT | — | NO | |
| feature_key | TEXT | — | NO | |
| metadata | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Append-only. Admin can read.
**Indexes:** `idx_pul_family` ON family_id; `idx_pul_feature` ON feature_key; `idx_pul_created` ON created_at DESC

---

### `feature_demand_responses`
**PRD:** PRD-32A | **Domain:** admin

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| feature_key | TEXT | — | NO | |
| vote | TEXT | — | NO | CHECK: 'want','dont_want','neutral' |
| note | TEXT | — | YES | |
| voted_via_view_as | BOOLEAN | false | NO | |
| actual_voter_id | UUID | — | YES | FK family_members |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can insert. Admin can read all.
**Indexes:** `idx_fdr_feature` ON feature_key; `idx_fdr_family_member` ON (family_id, member_id)

---

## Infrastructure (PRD-35, PRD-36)

### `time_sessions`
**PRD:** PRD-36 | **Domain:** infrastructure

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| mode | TEXT | — | NO | CHECK: 'clock','pomodoro','stopwatch','countdown' |
| started_at | TIMESTAMPTZ | — | NO | |
| ended_at | TIMESTAMPTZ | — | YES | |
| duration_seconds | INTEGER | — | YES | |
| task_id | UUID | — | YES | FK tasks |
| widget_id | UUID | — | YES | FK dashboard_widgets |
| list_item_id | UUID | — | YES | FK list_items |
| source_type | TEXT | — | YES | |
| source_reference_id | UUID | — | YES | |
| original_timestamps | JSONB | — | YES | |
| edit_reason | TEXT | — | YES | |
| edited_by | UUID | — | YES | FK family_members |
| deleted_at | TIMESTAMPTZ | — | YES | Soft delete |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Parent can read children's.
**Indexes:** `idx_ts_family_member` ON (family_id, member_id); `idx_ts_started` ON started_at DESC; `idx_ts_task` ON task_id WHERE task_id IS NOT NULL; `idx_ts_active` ON (member_id) WHERE ended_at IS NULL AND deleted_at IS NULL

---

### `timer_configs`
**PRD:** PRD-36 | **Domain:** infrastructure

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| default_mode | TEXT | 'clock' | NO | |
| pomodoro_focus_minutes | INTEGER | 25 | NO | |
| pomodoro_break_minutes | INTEGER | 5 | NO | |
| idle_reminder_minutes | INTEGER | 120 | NO | |
| idle_repeat_minutes | INTEGER | 60 | NO | |
| auto_pause_enabled | BOOLEAN | false | NO | |
| child_timer_visible | BOOLEAN | false | NO | |
| standalone_permitted | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can manage own. Primary parent can manage children's.
**Indexes:** `idx_tc2_family_member` UNIQUE ON (family_id, member_id)
**Triggers:** `trg_tc2_updated_at`

---

## Platform Intelligence (separate schema: `platform_intelligence`)

### `platform_intelligence.book_cache`
**PRD:** PRD-23 | **Domain:** platform_intelligence

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| title | TEXT | — | NO | |
| author | TEXT | — | YES | |
| title_author_embedding | vector(1536) | — | YES | |
| cached_chunks | JSONB | — | YES | |
| cached_extractions | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Service role only.
**Indexes:** `idx_pibc_title` ON title; `idx_pibc_embedding` USING ivfflat ON title_author_embedding WHERE title_author_embedding IS NOT NULL
**Triggers:** `trg_pibc_updated_at`

---

### `platform_intelligence.prompt_patterns`
**PRD:** Platform Intelligence | **Domain:** platform_intelligence

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| pattern_key | TEXT | — | NO | |
| pattern_data | JSONB | — | NO | |
| source_channel | TEXT | — | YES | |
| approved | BOOLEAN | false | NO | |
| approved_by | UUID | — | YES | FK staff_permissions.user_id |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Service role writes. Admin reads.
**Indexes:** `idx_pipp_key` ON pattern_key; `idx_pipp_approved` ON approved

---

### `platform_intelligence.context_effectiveness`
**PRD:** Platform Intelligence | **Domain:** platform_intelligence

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| context_type | TEXT | — | NO | |
| effectiveness_score | DECIMAL | — | NO | |
| sample_size | INTEGER | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Service role only.
**Indexes:** `idx_pice_type` ON context_type
**Triggers:** `trg_pice_updated_at`

---

### `platform_intelligence.edge_case_registry`
**PRD:** Platform Intelligence | **Domain:** platform_intelligence

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| description | TEXT | — | NO | |
| source_prd | TEXT | — | YES | |
| metadata | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Service role writes. Admin reads.
**Indexes:** `idx_piecr_source` ON source_prd

---

### `platform_intelligence.synthesized_principles`
**PRD:** Platform Intelligence | **Domain:** platform_intelligence

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| principle | TEXT | — | NO | |
| source_patterns | JSONB | — | YES | |
| approved | BOOLEAN | false | NO | |
| approved_by | UUID | — | YES | FK staff_permissions.user_id |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Service role writes. Admin reads.
**Indexes:** `idx_pisp_approved` ON approved

---

### `platform_intelligence.framework_ethics_log`
**PRD:** Platform Intelligence | **Domain:** platform_intelligence

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| framework_name | TEXT | — | NO | |
| source_book | TEXT | — | YES | |
| review_status | TEXT | — | NO | CHECK: 'approved','rejected','pending' |
| review_notes | TEXT | — | YES | |
| reviewed_by | UUID | — | YES | FK staff_permissions.user_id |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Service role writes. Admin reads.
**Indexes:** `idx_pifel_status` ON review_status; `idx_pifel_framework` ON framework_name

---

## Activity Log (Cross-Feature)

### `activity_log_entries`
**PRD:** Cross-feature | **Domain:** activity_log

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NO | PK |
| family_id | UUID | — | NO | FK families |
| member_id | UUID | — | NO | FK family_members |
| event_type | TEXT | — | NO | |
| source_table | TEXT | — | YES | |
| source_id | UUID | — | YES | |
| metadata | JSONB | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

**RLS:** Member can read own. Primary parent can read all family. Append-only.
**Indexes:** `idx_ale_family_member` ON (family_id, member_id); `idx_ale_event` ON event_type; `idx_ale_created` ON created_at DESC; `idx_ale_source` ON (source_table, source_id) WHERE source_id IS NOT NULL

---

## Global Conventions

### Default PK Pattern
All tables use `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`.

### Timestamp Columns
- `created_at TIMESTAMPTZ DEFAULT now() NOT NULL` on all tables
- `updated_at TIMESTAMPTZ DEFAULT now() NOT NULL` on mutable tables, managed by `BEFORE UPDATE` triggers

### RLS Global Policy
All tables have RLS enabled. Every query passes through `auth.uid()` to resolve the calling user, joined to `family_members` to resolve family membership and role.

### Embedding Columns
Tables with `embedding vector(1536)` use pgvector with IVFFlat indexes for similarity search. Used for semantic retrieval in LiLa AI context assembly.

### Audit Ruling Summary
| Ruling | Chosen | Rejected |
|--------|--------|----------|
| Self-knowledge table | `self_knowledge` | `member_self_insights` |
| Animation/reveal naming | `reveal_type` | `animation_template` |
| Schedule table | `access_schedules` | `shift_schedules` |
| Dashboard visual key | `dashboard_background_key` | `visual_world_theme` |
| Book wisdom table | `bookshelf_insights` | `bookshelf_frameworks`, `bookshelf_principles` |
| Messaging system | PRD-15 `messages` | PRD-08 `family_messages` |
| Studio queue authority | PRD-17 + PRD-17B `studio_queue` | conflicting definitions |
