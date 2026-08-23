-- ============================================================================
-- PRD-31 Slice 1 — Subscription Tier System: schema completion, seed repairs,
-- registry hygiene. NO Stripe, NO UI, NO metering logic (later slices).
--
-- Authority: claude/feature-decisions/PRD-31-Subscription-Tiers.md (R31-1..12,
-- OD-31-A..D resolved 2026-07-08) + claude/feature-decisions/
-- PRD-31-Tier-Chart-DRAFT.md (§N repairs, approved default rules) +
-- prds/scale-monetize/PRD-31-Subscription-Tier-System.md §Data Schema.
--
-- Contents:
--   1. Six new tables: ai_credits (append-only), credit_packs (+3 seeds),
--      tier_sampling_costs, tier_sample_sessions, onboarding_milestones,
--      subscription_cancellations — all RLS-enabled, zero client writes.
--   2. family_subscriptions founding-rate columns + is_founding_family mirror.
--   3. feature_key_registry: category / is_lite_version / lite_version_of
--      columns; categories from the tier chart's section headers; lite
--      metadata (guided_write_drawer, bookshelf_teen).
--   4. feature_access_v2 hygiene: dedup + UNIQUE (feature_key, role_group);
--      key merges (smart_notepad→notepad_basic, duration_tracking→
--      task_duration_tracking); retirements (tasks_pomodoro,
--      tasks_teen_studio); 45 NULL-tier repairs; register meal_planning +
--      quicktasks; new addendum keys vault_hearts / vault_comments_post /
--      vault_comments_read (comments mom-only — the platform's FIRST explicit
--      is_enabled=false 'Never' rows, per R31-2 semantics).
--   5. OD-31-A sweep: every non-mom Essential cell → Enhanced (mechanical;
--      founder marks exceptions later via the living-draft chart / Screen 4).
--   6. OD-31-D: safety_monitoring_basic mom cell Enhanced → Essential.
--   7. Display-name collision fix (task_assignment vs tasks_family_assignment)
--      + R31-9 access-semantics notes on ambiguous keys.
--   8. handle_new_user(): seeds the 'account_created' onboarding milestone
--      (credits_awarded=0 during beta; award logic is Slice 3/6 scope).
--
-- Semantics documented here per R31-2 (and in the chart file header):
--   * A feature_access_v2 row with is_enabled=false means NEVER available to
--     that role group at any tier. minimum_tier_id is retained but inert on
--     disabled rows. Screen 4's "never" cell writes is_enabled=false — rows
--     are never deleted to express Never.
--   * An ABSENT row means NOT-YET-ASSIGNED, and the activation default for
--     absent rows is UNGATED (allowed) — flipping the tier switch must never
--     silently remove a feature because a seed row was missing (Rule 1).
--
-- Idempotent throughout. No SECURITY DEFINER functions taking bare ids are
-- introduced (Convention #280 — handle_new_user is a trigger on auth.users,
-- not client-callable with a caller-supplied id).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1a. ai_credits — append-only AI-action ledger (Convention #223 pattern:
--     the fourth append-only ledger sibling; NEVER flows through
--     record_point_transaction — R31-5 points/credits firewall)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN (
    'tier_monthly_allotment', 'purchased', 'earned_onboarding',
    'earned_promotion', 'tier_sample', 'ai_action_spent', 'expired', 'refund'
  )),
  description TEXT,
  feature_key TEXT,
  expires_at TIMESTAMPTZ,
  stripe_payment_id TEXT,
  milestone_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_credits_family_created
  ON public.ai_credits (family_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_credits_family_expires
  ON public.ai_credits (family_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_credits_family_source
  ON public.ai_credits (family_id, source);

ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

-- Mom (primary parent) reads her family's ledger. NO client write policies —
-- ever. Balances are always computed from the ledger sum; Edge Functions
-- (service role) are the only writers. Belt-and-suspenders REVOKE below.
DROP POLICY IF EXISTS ai_credits_mom_read ON public.ai_credits;
CREATE POLICY ai_credits_mom_read ON public.ai_credits
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = ai_credits.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'primary_parent'
  ));

REVOKE INSERT, UPDATE, DELETE ON public.ai_credits FROM authenticated, anon;

-- ----------------------------------------------------------------------------
-- 1b. credit_packs — admin-configured pack definitions (global, no family_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ai_actions INTEGER NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  stripe_price_id TEXT,
  sort_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_credit_packs_updated_at ON public.credit_packs;
CREATE TRIGGER trg_credit_packs_updated_at
  BEFORE UPDATE ON public.credit_packs
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

-- Anyone signed in may read pack definitions (Screen 2 renders them for mom;
-- reading prices is harmless). Writes: service role / future tier_admin only.
DROP POLICY IF EXISTS credit_packs_read ON public.credit_packs;
CREATE POLICY credit_packs_read ON public.credit_packs
  FOR SELECT TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.credit_packs FROM authenticated, anon;

INSERT INTO public.credit_packs (name, ai_actions, price_usd, sort_order)
SELECT v.name, v.ai_actions, v.price_usd, v.sort_order
FROM (VALUES
  ('Starter', 25, 1.99::DECIMAL(10,2), 1),
  ('Bundle', 100, 4.99::DECIMAL(10,2), 2),
  ('Power', 300, 12.99::DECIMAL(10,2), 3)
) AS v(name, ai_actions, price_usd, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.credit_packs cp WHERE cp.name = v.name);

-- ----------------------------------------------------------------------------
-- 1c. tier_sampling_costs — per-feature credit cost for tier-sampling
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tier_sampling_costs (
  feature_key TEXT PRIMARY KEY
    REFERENCES public.feature_key_registry(feature_key) ON DELETE CASCADE,
  credit_cost INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_tier_sampling_costs_updated_at ON public.tier_sampling_costs;
CREATE TRIGGER trg_tier_sampling_costs_updated_at
  BEFORE UPDATE ON public.tier_sampling_costs
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.tier_sampling_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tier_sampling_costs_read ON public.tier_sampling_costs;
CREATE POLICY tier_sampling_costs_read ON public.tier_sampling_costs
  FOR SELECT TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.tier_sampling_costs FROM authenticated, anon;

-- ----------------------------------------------------------------------------
-- 1d. tier_sample_sessions — sampling usage analytics
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tier_sample_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  credits_spent INTEGER NOT NULL,
  session_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tier_sample_sessions_family
  ON public.tier_sample_sessions (family_id, session_started_at);

ALTER TABLE public.tier_sample_sessions ENABLE ROW LEVEL SECURITY;

-- Any member of the family may read their family's sampling history
-- (PRD: "User READ own family"). Writes: service role only.
DROP POLICY IF EXISTS tier_sample_sessions_family_read ON public.tier_sample_sessions;
CREATE POLICY tier_sample_sessions_family_read ON public.tier_sample_sessions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = tier_sample_sessions.family_id
      AND fm.user_id = auth.uid()
  ));

REVOKE INSERT, UPDATE, DELETE ON public.tier_sample_sessions FROM authenticated, anon;

-- ----------------------------------------------------------------------------
-- 1e. onboarding_milestones — per-family milestone completion (earned credits
--     + founding-status tracking). 10 milestone keys per PRD-31.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.onboarding_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  milestone_key TEXT NOT NULL CHECK (milestone_key IN (
    'account_created', 'family_described', 'first_guiding_star',
    'first_entry', 'first_task', 'first_archive_context',
    'first_lila_conversation', 'first_best_intention',
    'friction_finder', 'first_lifelantern_section'
  )),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  credits_awarded INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_onboarding_milestones_family_key UNIQUE (family_id, milestone_key)
);

ALTER TABLE public.onboarding_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS onboarding_milestones_mom_read ON public.onboarding_milestones;
CREATE POLICY onboarding_milestones_mom_read ON public.onboarding_milestones
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = onboarding_milestones.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'primary_parent'
  ));

REVOKE INSERT, UPDATE, DELETE ON public.onboarding_milestones FROM authenticated, anon;

-- ----------------------------------------------------------------------------
-- 1f. subscription_cancellations — churn feedback (service INSERT, staff READ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  tier_at_cancellation TEXT NOT NULL,
  reasons TEXT[] NOT NULL DEFAULT '{}',
  freeform_feedback TEXT,
  was_founding_family BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_cancellations_family
  ON public.subscription_cancellations (family_id);

ALTER TABLE public.subscription_cancellations ENABLE ROW LEVEL SECURITY;

-- Staff-only read (any staff_permissions row; Slice 6 narrows to tier_admin
-- when that permission type is added alongside the admin tab — R31-7).
DROP POLICY IF EXISTS subscription_cancellations_staff_read ON public.subscription_cancellations;
CREATE POLICY subscription_cancellations_staff_read ON public.subscription_cancellations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.staff_permissions sp WHERE sp.user_id = auth.uid()
  ));

REVOKE INSERT, UPDATE, DELETE ON public.subscription_cancellations FROM authenticated, anon;

-- ----------------------------------------------------------------------------
-- 2. family_subscriptions — founding-rate columns + mirror backfill
-- ----------------------------------------------------------------------------
ALTER TABLE public.family_subscriptions
  ADD COLUMN IF NOT EXISTS is_founding_family BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_rate_monthly DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS founding_rate_yearly DECIMAL(10,2);

UPDATE public.family_subscriptions fs
SET is_founding_family = true
FROM public.families f
WHERE f.id = fs.family_id
  AND f.is_founding_family = true
  AND fs.is_founding_family = false;

-- ----------------------------------------------------------------------------
-- 3. feature_key_registry — new columns + categories + lite metadata
-- ----------------------------------------------------------------------------
ALTER TABLE public.feature_key_registry
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS is_lite_version BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lite_version_of TEXT
    REFERENCES public.feature_key_registry(feature_key);

-- Categories = the tier chart's section headers
-- (claude/feature-decisions/PRD-31-Tier-Chart-DRAFT.md §A–§M).
-- Explicit placements first (chart overrides), then prefix rules.
UPDATE public.feature_key_registry SET category = CASE
  -- §M Management Grants (Convention #274/#276 grant keys)
  WHEN feature_key IN ('financial_tracking','studio','reward_rules','task_assignment','gift_planning','meal_planning')
    THEN 'Management Grants'
  -- §G explicit placements that prefix rules would misfile
  WHEN feature_key IN ('play_reveal_tiles','task_segments','coloring_reveal_basic','coloring_reveal_print','reward_shop','family_goals')
    THEN 'Gamification & Rewards'
  WHEN feature_key LIKE 'gamification\_%' OR feature_key LIKE 'reward\_reveals\_%'
    THEN 'Gamification & Rewards'
  -- §I Safety
  WHEN feature_key LIKE 'safety\_monitoring\_%'
    THEN 'Safety'
  -- §H Tracking, Financial & Homeschool
  WHEN feature_key LIKE 'allowance\_%' OR feature_key LIKE 'homeschool\_%'
       OR feature_key IN ('tracking_allowance_multi_pool','compliance_esa_invoice')
    THEN 'Tracking, Financial & Homeschool'
  -- §J Meals & WishLists
  WHEN feature_key LIKE 'meals\_%' OR feature_key LIKE 'wishlists\_%' OR feature_key = 'wishlist_ai_context'
    THEN 'Meals & WishLists'
  -- §K Scheduling & Timers
  WHEN feature_key LIKE 'scheduler\_%' OR feature_key LIKE 'timer\_%'
    THEN 'Scheduling & Timers'
  -- §L Settings, Permissions, Archives & System
  WHEN feature_key LIKE 'settings\_%' OR feature_key LIKE 'archives\_%'
       OR feature_key LIKE 'coppa\_consent\_%'
       OR feature_key IN ('granular_permissions','custom_permission_presets','mom_self_restrictions','view_as_mode','shift_scheduling','special_adult_shifts')
    THEN 'Settings, Permissions, Archives & System'
  -- §F BookShelf & Vault
  WHEN feature_key LIKE 'bookshelf\_%' OR feature_key LIKE 'vault\_%' OR feature_key = 'ai_toolbox_browse'
    THEN 'BookShelf & Vault'
  -- §E LiLa & AI Tools
  WHEN feature_key LIKE 'lila\_%' OR feature_key LIKE 'optimizer\_%'
       OR feature_key LIKE 'mindsweep\_%' OR feature_key LIKE 'safe\_harbor%'
       OR feature_key LIKE 'thoughtsift\_%' OR feature_key LIKE 'tool\_%'
    THEN 'LiLa & AI Tools'
  -- §D Communication
  WHEN feature_key LIKE 'messaging\_%' OR feature_key LIKE 'notifications\_%'
       OR feature_key LIKE 'requests\_%' OR feature_key LIKE 'meetings\_%'
    THEN 'Communication'
  -- §C Calendar, Dashboards, Hub & Shells
  WHEN feature_key LIKE 'calendar\_%' OR feature_key LIKE 'family\_hub%'
       OR feature_key LIKE 'family\_overview%' OR feature_key LIKE 'guided\_%'
       OR feature_key LIKE 'play\_%'
       OR feature_key IN ('family_dashboards','family_login','member_account_invites','special_adult_access','tablet_hub','my_rewards_page','teen_transparency_panel','quicktasks')
    THEN 'Calendar, Dashboards, Hub & Shells'
  -- §B Tasks, Studio & Lists
  WHEN feature_key LIKE 'tasks\_%' OR feature_key LIKE 'task\_%'
       OR feature_key LIKE 'lists\_%' OR feature_key LIKE 'studio\_%'
       OR feature_key LIKE 'queue\_%' OR feature_key LIKE 'sequential\_%'
       OR feature_key IN ('opportunity_lists','linked_routine_steps','curriculum_ai_parse','draw_mode_surprise','randomizer_advancement','shopping_mode','routing_strip','activity_list_wizard','shared_task_list_wizard','icon_launcher_widget','duration_tracking')
    THEN 'Tasks, Studio & Lists'
  -- §A Personal Growth
  WHEN feature_key LIKE 'guiding\_stars%' OR feature_key LIKE 'best\_intentions%'
       OR feature_key LIKE 'innerworkings\_%' OR feature_key LIKE 'journal\_%'
       OR feature_key LIKE 'notepad\_%' OR feature_key LIKE 'victory\_%'
       OR feature_key LIKE 'reflections\_%' OR feature_key LIKE 'rhythm%'
       OR feature_key IN ('connection_preferences','daily_celebration')
    THEN 'Personal Growth'
  ELSE category
END
WHERE category IS NULL;

-- Lite-version metadata (the chart's two named lite variants)
UPDATE public.feature_key_registry
SET is_lite_version = true, lite_version_of = 'notepad_basic'
WHERE feature_key = 'guided_write_drawer'
  AND (is_lite_version = false OR lite_version_of IS DISTINCT FROM 'notepad_basic');

UPDATE public.feature_key_registry
SET is_lite_version = true, lite_version_of = 'bookshelf_adult'
WHERE feature_key = 'bookshelf_teen'
  AND (is_lite_version = false OR lite_version_of IS DISTINCT FROM 'bookshelf_adult');

-- ----------------------------------------------------------------------------
-- 4a. feature_access_v2 hygiene — dedup then UNIQUE (feature_key, role_group)
--     (the PRD's unique constraint was never created; needed for upserts)
-- ----------------------------------------------------------------------------
DELETE FROM public.feature_access_v2
WHERE id IN (
  SELECT id FROM (
    SELECT id, row_number() OVER (
      PARTITION BY feature_key, role_group
      ORDER BY (minimum_tier_id IS NULL), created_at, id
    ) AS rn
    FROM public.feature_access_v2
  ) x
  WHERE x.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_access_v2_key_role
  ON public.feature_access_v2 (feature_key, role_group);

-- ----------------------------------------------------------------------------
-- 4b. Register the two legitimate unregistered keys (chart §N)
-- ----------------------------------------------------------------------------
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source, category)
SELECT v.feature_key, v.display_name, v.description, v.prd_source, v.category
FROM (VALUES
  ('meal_planning', 'Meal Planning Grant (adults)',
   'Convention #274 explicit-grant key: mom grants KitchenCompass management to additional adults. Tier gates whether the grant system exists for the family; the grant itself stays mom''s choice (grant x tier compose as AND — tier changes never auto-grant or auto-revoke).',
   'PRD-42 / Convention #274', 'Management Grants'),
  ('quicktasks', 'QuickTasks Strip',
   'The horizontal quick-action pill strip at the top of Mom/Adult/Independent shells.',
   'PRD-04', 'Calendar, Dashboards, Hub & Shells')
) AS v(feature_key, display_name, description, prd_source, category)
ON CONFLICT (feature_key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4c. Key merges + retirements (chart §N)
--     smart_notepad → notepad_basic: notepad_basic already covers every cell
--     smart_notepad had (mom/dad/teen at E) — verified live 2026-08-23; the
--     guard below makes the merge self-healing anyway.
--     duration_tracking → task_duration_tracking: superset coverage confirmed.
--     tasks_teen_studio → studio_teen_access: zero live rows to migrate.
--     tasks_pomodoro: retired (timer keys own pomodoro per PRD-36).
-- ----------------------------------------------------------------------------
-- Ensure merge targets cover every cell the retired keys had, then delete.
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'notepad_basic', fa.role_group, fa.minimum_tier_id, fa.is_enabled
FROM public.feature_access_v2 fa
WHERE fa.feature_key = 'smart_notepad'
ON CONFLICT (feature_key, role_group) DO NOTHING;

INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'task_duration_tracking', fa.role_group, fa.minimum_tier_id, fa.is_enabled
FROM public.feature_access_v2 fa
WHERE fa.feature_key = 'duration_tracking'
ON CONFLICT (feature_key, role_group) DO NOTHING;

INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'studio_teen_access', fa.role_group, fa.minimum_tier_id, fa.is_enabled
FROM public.feature_access_v2 fa
WHERE fa.feature_key = 'tasks_teen_studio'
ON CONFLICT (feature_key, role_group) DO NOTHING;

DELETE FROM public.feature_access_v2
WHERE feature_key IN ('smart_notepad', 'duration_tracking', 'tasks_teen_studio', 'tasks_pomodoro');

DELETE FROM public.member_feature_toggles
WHERE feature_key IN ('smart_notepad', 'duration_tracking', 'tasks_teen_studio', 'tasks_pomodoro');

DELETE FROM public.feature_key_registry
WHERE feature_key IN ('duration_tracking', 'tasks_teen_studio', 'tasks_pomodoro');
-- (smart_notepad was never registered — nothing to delete there)

-- ----------------------------------------------------------------------------
-- 4d. 45 NULL-tier repairs (chart §N Rule 2 — pre-sweep values; the OD-31-A
--     sweep in step 5 then lifts non-mom Essential cells to Enhanced, so
--     repairs follow the approved principle automatically)
-- ----------------------------------------------------------------------------
-- Essential repairs (sibling-key default)
UPDATE public.feature_access_v2 fa
SET minimum_tier_id = (SELECT id FROM public.subscription_tiers WHERE slug = 'essential')
WHERE fa.minimum_tier_id IS NULL
  AND (fa.feature_key, fa.role_group) IN (
    -- coloring_reveal_basic / coloring_reveal_print / gamification_earning_modes /
    -- task_segments: all 6 role groups each, matching gamification_basic
    ('coloring_reveal_basic','mom'),('coloring_reveal_basic','dad_adults'),('coloring_reveal_basic','special_adults'),('coloring_reveal_basic','independent_teens'),('coloring_reveal_basic','guided_kids'),('coloring_reveal_basic','play_kids'),
    ('coloring_reveal_print','mom'),('coloring_reveal_print','dad_adults'),('coloring_reveal_print','special_adults'),('coloring_reveal_print','independent_teens'),('coloring_reveal_print','guided_kids'),('coloring_reveal_print','play_kids'),
    ('gamification_earning_modes','mom'),('gamification_earning_modes','dad_adults'),('gamification_earning_modes','special_adults'),('gamification_earning_modes','independent_teens'),('gamification_earning_modes','guided_kids'),('gamification_earning_modes','play_kids'),
    ('task_segments','mom'),('task_segments','dad_adults'),('task_segments','special_adults'),('task_segments','independent_teens'),('task_segments','guided_kids'),('task_segments','play_kids'),
    ('lists_basic','special_adults'),
    ('lists_guided_forms','mom'),
    ('lists_victory_complete','mom'),('lists_victory_complete','dad_adults'),('lists_victory_complete','independent_teens'),
    ('studio_browse','dad_adults'),('studio_browse','special_adults'),
    ('vault_browse','dad_adults'),
    ('vault_consume','dad_adults'),('vault_consume','independent_teens'),
    ('vault_prompt_library','mom'),('vault_prompt_library','dad_adults'),
    ('vault_request_content','mom')
  );

-- Enhanced repairs (chart-noted suggestions)
UPDATE public.feature_access_v2 fa
SET minimum_tier_id = (SELECT id FROM public.subscription_tiers WHERE slug = 'enhanced')
WHERE fa.minimum_tier_id IS NULL
  AND (fa.feature_key, fa.role_group) IN (
    ('homeschool_compliance','mom'),
    ('lists_guided_forms','dad_adults'),
    ('studio_customize_lists','mom'),('studio_customize_lists','dad_adults'),
    ('vault_optimize_lila','mom'),('vault_optimize_lila','dad_adults'),
    ('vault_toolbox_assign','mom'),
    ('vault_request_content','dad_adults')
  );

-- vault_request_content is mom-only per the Permission-Matrix Addendum —
-- the dad row becomes an explicit Never (is_enabled=false; tier inert).
UPDATE public.feature_access_v2
SET is_enabled = false
WHERE feature_key = 'vault_request_content'
  AND role_group = 'dad_adults'
  AND is_enabled = true;

-- ----------------------------------------------------------------------------
-- 5. OD-31-A sweep — every ENABLED non-mom Essential cell → Enhanced
--    ("Essential = mom-only" story kept; founder marks exceptions later
--    via the living-draft chart / Screen 4 grid)
-- ----------------------------------------------------------------------------
UPDATE public.feature_access_v2 fa
SET minimum_tier_id = (SELECT id FROM public.subscription_tiers WHERE slug = 'enhanced')
WHERE fa.role_group <> 'mom'
  AND fa.is_enabled = true
  AND fa.minimum_tier_id = (SELECT id FROM public.subscription_tiers WHERE slug = 'essential');

-- ----------------------------------------------------------------------------
-- 6. OD-31-D — safety_monitoring_basic mom cell moves DOWN to Essential
--    ("basic 'mom knows' is floor-level safety, not a premium").
--    Dad cell stays Enhanced (A-principle: dads only exist at Enhanced+).
--    safety_monitoring_ai untouched (stays Full Magic).
-- ----------------------------------------------------------------------------
UPDATE public.feature_access_v2
SET minimum_tier_id = (SELECT id FROM public.subscription_tiers WHERE slug = 'essential')
WHERE feature_key = 'safety_monitoring_basic'
  AND role_group = 'mom'
  AND minimum_tier_id IS DISTINCT FROM (SELECT id FROM public.subscription_tiers WHERE slug = 'essential');

-- ----------------------------------------------------------------------------
-- 7. New Permission-Matrix Addendum vault keys (post-sweep final values).
--    vault_comments_* non-mom rows are the platform's FIRST explicit
--    is_enabled=false 'Never' rows (R31-2). minimum_tier_id on disabled
--    rows is inert — set to essential for uniformity.
-- ----------------------------------------------------------------------------
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source, category)
SELECT v.feature_key, v.display_name, v.description, v.prd_source, v.category
FROM (VALUES
  ('vault_hearts', 'Vault Hearts',
   'Heart/favorite AI Vault items. Follows vault_browse access — anyone who can browse can heart.',
   'PRD-21C / PRD-31 Permission-Matrix Addendum', 'BookShelf & Vault'),
  ('vault_comments_post', 'Vault Comments — Post',
   'Post comments/discussions on AI Vault items. Mom-only: explicitly Never for all other role groups (Permission-Matrix Addendum decision).',
   'PRD-21C / PRD-31 Permission-Matrix Addendum', 'BookShelf & Vault'),
  ('vault_comments_read', 'Vault Comments — Read',
   'Read others'' comments on AI Vault items. Mom-only: explicitly Never for all other role groups (Permission-Matrix Addendum decision).',
   'PRD-21C / PRD-31 Permission-Matrix Addendum', 'BookShelf & Vault')
) AS v(feature_key, display_name, description, prd_source, category)
ON CONFLICT (feature_key) DO NOTHING;

INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT v.feature_key, v.role_group,
       (SELECT id FROM public.subscription_tiers WHERE slug = v.tier_slug),
       v.is_enabled
FROM (VALUES
  -- hearts follow vault_browse's assigned cells (mom E; dad En post-sweep)
  ('vault_hearts', 'mom', 'essential', true),
  ('vault_hearts', 'dad_adults', 'enhanced', true),
  -- comments: mom-only; every other role group is an explicit Never
  ('vault_comments_post', 'mom', 'essential', true),
  ('vault_comments_post', 'dad_adults', 'essential', false),
  ('vault_comments_post', 'special_adults', 'essential', false),
  ('vault_comments_post', 'independent_teens', 'essential', false),
  ('vault_comments_post', 'guided_kids', 'essential', false),
  ('vault_comments_post', 'play_kids', 'essential', false),
  ('vault_comments_read', 'mom', 'essential', true),
  ('vault_comments_read', 'dad_adults', 'essential', false),
  ('vault_comments_read', 'special_adults', 'essential', false),
  ('vault_comments_read', 'independent_teens', 'essential', false),
  ('vault_comments_read', 'guided_kids', 'essential', false),
  ('vault_comments_read', 'play_kids', 'essential', false)
) AS v(feature_key, role_group, tier_slug, is_enabled)
ON CONFLICT (feature_key, role_group) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. Display-name collision fix (chart §N) + R31-9 access-semantics notes
-- ----------------------------------------------------------------------------
UPDATE public.feature_key_registry
SET display_name = 'Task Assignment Grant (adults)'
WHERE feature_key = 'task_assignment'
  AND display_name IS DISTINCT FROM 'Task Assignment Grant (adults)';

UPDATE public.feature_key_registry
SET display_name = 'Assign Tasks to Family'
WHERE feature_key = 'tasks_family_assignment'
  AND display_name IS DISTINCT FROM 'Assign Tasks to Family';

-- R31-9: one-line "whose access this checks" notes on the ambiguous keys.
-- Idempotent: only appends when the marker is absent.
UPDATE public.feature_key_registry
SET description = COALESCE(description || ' ', '') || 'Access semantics: gates mom''s coaching CONFIGURATION; coaching fires on kids'' messages regardless of the kid''s own row.'
WHERE feature_key = 'messaging_coaching'
  AND (description IS NULL OR description NOT LIKE '%Access semantics:%');

UPDATE public.feature_key_registry
SET description = COALESCE(description || ' ', '') || 'Access semantics: gates allowance CONFIGURATION by the checking adult; kids receive payouts and see them via My Rewards regardless of their own row.'
WHERE feature_key = 'allowance_basic'
  AND (description IS NULL OR description NOT LIKE '%Access semantics:%');

UPDATE public.feature_key_registry
SET description = COALESCE(description || ' ', '') || 'Access semantics: gates reveal AUTHORING by the checking adult; kids always see reveals authored for them.'
WHERE feature_key IN ('reward_reveals_basic', 'reward_reveals_library', 'reward_reveals_media')
  AND (description IS NULL OR description NOT LIKE '%Access semantics:%');

UPDATE public.feature_key_registry
SET description = COALESCE(description || ' ', '') || 'Access semantics: gates routine AUTHORING; family members experience deployed routines via tasks_basic regardless of their own row.'
WHERE feature_key = 'tasks_routines'
  AND (description IS NULL OR description NOT LIKE '%Access semantics:%');

UPDATE public.feature_key_registry
SET description = COALESCE(description || ' ', '') || 'Access semantics: gates linked-step AUTHORING; kids render linked steps in deployed routines regardless of their own row.'
WHERE feature_key = 'linked_routine_steps'
  AND (description IS NULL OR description NOT LIKE '%Access semantics:%');

-- ----------------------------------------------------------------------------
-- 9. handle_new_user — seed the 'account_created' milestone row from account
--    one (credits_awarded=0 during beta; award logic is Slice 3/6 scope).
--    Everything else preserved verbatim from migration 100254, including
--    both shadow-account skips (Convention #273).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
  new_member_id UUID;
  tier_id UUID;
  user_name TEXT;
  user_tz TEXT;
BEGIN
  -- Skip auto-family creation for shadow auth accounts:
  -- {member_id}@pin.myaimcentral.app (member PIN sessions) and
  -- {family_id}@family.myaimcentral.app (family identity sessions)
  IF NEW.email LIKE '%@pin.myaimcentral.app'
     OR NEW.email LIKE '%@family.myaimcentral.app' THEN
    RETURN NEW;
  END IF;

  user_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Mom');
  user_tz := COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Chicago');

  -- Create family
  INSERT INTO public.families (primary_parent_id, family_name, timezone)
  VALUES (NEW.id, user_name || '''s Family', user_tz)
  RETURNING id INTO new_family_id;

  -- Create primary parent member with PRD-01 required defaults
  INSERT INTO public.family_members (
    family_id, user_id, display_name, role, dashboard_mode,
    relationship, auth_method, dashboard_enabled, in_household
  )
  VALUES (
    new_family_id, NEW.id, user_name, 'primary_parent',
    'adult',
    'self',
    'full_login',
    true, true
  )
  RETURNING id INTO new_member_id;

  -- Create subscription (Essential tier default)
  SELECT id INTO tier_id FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;

  IF tier_id IS NOT NULL THEN
    INSERT INTO public.family_subscriptions (family_id, tier_id, status)
    VALUES (new_family_id, tier_id, 'active');
  END IF;

  -- PRD-31: seed the first onboarding milestone. The ROW exists from account
  -- one; credit awards (0 during beta) are computed by later PRD-31 slices.
  INSERT INTO public.onboarding_milestones (family_id, milestone_key, completed_at, credits_awarded)
  VALUES (new_family_id, 'account_created', now(), 0)
  ON CONFLICT (family_id, milestone_key) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 10. Semantics documentation on the table itself
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.feature_access_v2 IS
  'Tier-access matrix (PRD-31). Row semantics (R31-2): is_enabled=false = NEVER available to that role group at any tier (minimum_tier_id retained but inert); ABSENT row = not-yet-assigned, and the activation default for absent rows is UNGATED/allowed (chart Rule 1) — nothing silently disappears at switch-flip because a seed row was missing. Role-group vocabulary is the live PLURAL set (R31-1). Grant keys (Convention #274/#276) compose with tiers as AND: tier gates whether the grant system exists for the family; the mom-issued grant decides whether a specific adult has it (OD-31-B).';

-- ----------------------------------------------------------------------------
-- 11. Verification — fail loudly if any repair didn't land
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_count INTEGER;
  v_essential UUID;
BEGIN
  SELECT id INTO v_essential FROM public.subscription_tiers WHERE slug = 'essential';

  -- (a) zero NULL-tier rows remain
  SELECT count(*) INTO v_count FROM public.feature_access_v2 WHERE minimum_tier_id IS NULL;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'PRD-31 S1 verify (a): % NULL minimum_tier_id rows remain', v_count;
  END IF;

  -- (b) zero unregistered keys carry rows
  SELECT count(*) INTO v_count
  FROM public.feature_access_v2 fa
  LEFT JOIN public.feature_key_registry r ON r.feature_key = fa.feature_key
  WHERE r.feature_key IS NULL;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'PRD-31 S1 verify (b): % feature_access_v2 rows reference unregistered keys', v_count;
  END IF;

  -- (c) retired keys fully gone
  SELECT count(*) INTO v_count FROM public.feature_access_v2
  WHERE feature_key IN ('smart_notepad','duration_tracking','tasks_teen_studio','tasks_pomodoro');
  IF v_count > 0 THEN
    RAISE EXCEPTION 'PRD-31 S1 verify (c): retired keys still carry % access rows', v_count;
  END IF;
  SELECT count(*) INTO v_count FROM public.feature_key_registry
  WHERE feature_key IN ('duration_tracking','tasks_teen_studio','tasks_pomodoro');
  IF v_count > 0 THEN
    RAISE EXCEPTION 'PRD-31 S1 verify (c2): retired keys still registered (%)', v_count;
  END IF;

  -- (d) OD-31-A: zero ENABLED non-mom Essential cells remain
  SELECT count(*) INTO v_count FROM public.feature_access_v2
  WHERE role_group <> 'mom' AND is_enabled = true AND minimum_tier_id = v_essential;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'PRD-31 S1 verify (d): % enabled non-mom Essential cells survived the sweep', v_count;
  END IF;

  -- (e) OD-31-D: safety_monitoring_basic mom = essential
  SELECT count(*) INTO v_count FROM public.feature_access_v2
  WHERE feature_key = 'safety_monitoring_basic' AND role_group = 'mom'
    AND minimum_tier_id = v_essential AND is_enabled = true;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'PRD-31 S1 verify (e): safety_monitoring_basic mom cell not at Essential';
  END IF;

  -- (f) the 11 explicit Never rows exist (10 vault_comments_* + vault_request_content dad)
  SELECT count(*) INTO v_count FROM public.feature_access_v2 WHERE is_enabled = false;
  IF v_count <> 11 THEN
    RAISE EXCEPTION 'PRD-31 S1 verify (f): expected 11 explicit Never rows, found %', v_count;
  END IF;

  -- (g) the six new tables exist
  SELECT count(*) INTO v_count FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('ai_credits','credit_packs','tier_sampling_costs',
                       'tier_sample_sessions','onboarding_milestones','subscription_cancellations');
  IF v_count <> 6 THEN
    RAISE EXCEPTION 'PRD-31 S1 verify (g): expected 6 new tables, found %', v_count;
  END IF;

  -- (h) family_subscriptions founding columns exist
  SELECT count(*) INTO v_count FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'family_subscriptions'
    AND column_name IN ('is_founding_family','founding_rate_monthly','founding_rate_yearly');
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'PRD-31 S1 verify (h): family_subscriptions founding columns missing';
  END IF;

  -- (i) credit packs seeded
  SELECT count(*) INTO v_count FROM public.credit_packs WHERE name IN ('Starter','Bundle','Power');
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'PRD-31 S1 verify (i): expected 3 seeded credit packs, found %', v_count;
  END IF;

  RAISE NOTICE 'PRD-31 Slice 1 verification passed.';
END $$;
