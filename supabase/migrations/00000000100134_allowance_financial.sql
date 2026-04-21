-- ============================================================================
-- PRD-28 Sub-phase A — Allowance & Financial System
--
-- Creates:
--   1. allowance_configs — Per-child allowance configuration
--   2. financial_transactions — Append-only financial ledger (DECIMAL precision)
--   3. allowance_periods — Per-period tracking with calculation results
--   4. loans — Outstanding loans with repayment terms
--
-- Alters:
--   5. task_rewards — add 'hourly' to reward_type CHECK
--   6. tasks — add 4 tracking flag columns + 'makeup' to task_type CHECK
--      + 'allowance_makeup' to source CHECK
--   7. task_templates — add 4 tracking flag columns
--   8. roll_creature_for_completion RPC — add counts_for_gamification check
--
-- Registers:
--   9. 5 feature keys + feature_access_v2 grants
--  10. privilege_status widget type in TrackerType catalog
--  11. 2 pg_cron jobs (allowance period calculation, loan interest accrual)
-- ============================================================================


-- ============================================================================
-- 1. allowance_configs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.allowance_configs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                 UUID NOT NULL REFERENCES public.families(id),
  family_member_id          UUID NOT NULL REFERENCES public.family_members(id),
  enabled                   BOOLEAN NOT NULL DEFAULT true,
  weekly_amount             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  calculation_approach      TEXT NOT NULL DEFAULT 'dynamic'
    CHECK (calculation_approach IN ('fixed', 'dynamic', 'points_weighted')),
  -- Points-Weighted fallback weight (per-task override via tasks.allowance_points)
  default_point_value       INTEGER NOT NULL DEFAULT 1,
  -- Thresholds
  minimum_threshold         INTEGER NOT NULL DEFAULT 0,
  bonus_threshold           INTEGER NOT NULL DEFAULT 90,
  bonus_percentage          INTEGER NOT NULL DEFAULT 20,
  rounding_behavior         TEXT NOT NULL DEFAULT 'nearest_cent'
    CHECK (rounding_behavior IN ('round_up', 'round_down', 'nearest_cent')),
  -- Grace mechanisms
  grace_days_enabled        BOOLEAN NOT NULL DEFAULT true,
  makeup_window_enabled     BOOLEAN NOT NULL DEFAULT false,
  makeup_window_days        INTEGER NOT NULL DEFAULT 2,
  extra_credit_enabled      BOOLEAN NOT NULL DEFAULT false,
  -- Visibility
  child_can_see_finances    BOOLEAN NOT NULL DEFAULT false,
  -- Period config (weekly only at MVP)
  period_type               TEXT NOT NULL DEFAULT 'weekly'
    CHECK (period_type IN ('weekly')),
  period_start_day          TEXT NOT NULL DEFAULT 'sunday'
    CHECK (period_start_day IN ('sunday','monday','tuesday','wednesday','thursday','friday','saturday')),
  calculation_time          TIME NOT NULL DEFAULT '23:59:00',
  -- Loan settings
  loans_enabled             BOOLEAN NOT NULL DEFAULT false,
  loan_interest_enabled     BOOLEAN NOT NULL DEFAULT false,
  loan_default_interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  loan_interest_period      TEXT NOT NULL DEFAULT 'monthly'
    CHECK (loan_interest_period IN ('weekly', 'monthly')),
  loan_max_amount           DECIMAL(10,2),
  -- Timestamps
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One config per child
CREATE UNIQUE INDEX IF NOT EXISTS idx_allowance_configs_member
  ON public.allowance_configs (family_member_id);
CREATE INDEX IF NOT EXISTS idx_allowance_configs_family
  ON public.allowance_configs (family_id);

-- RLS
ALTER TABLE public.allowance_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ac_family_read" ON public.allowance_configs;
CREATE POLICY "ac_family_read" ON public.allowance_configs
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ac_parent_write" ON public.allowance_configs;
CREATE POLICY "ac_parent_write" ON public.allowance_configs
  FOR ALL USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
  );

-- updated_at trigger
CREATE OR REPLACE TRIGGER trg_allowance_configs_updated_at
  BEFORE UPDATE ON public.allowance_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 2. financial_transactions (append-only ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id           UUID NOT NULL REFERENCES public.families(id),
  family_member_id    UUID NOT NULL REFERENCES public.family_members(id),
  transaction_type    TEXT NOT NULL
    CHECK (transaction_type IN (
      'allowance_earned',
      'opportunity_earned',
      'payment_made',
      'purchase_deduction',
      'loan_issued',
      'loan_repayment',
      'interest_accrued',
      'adjustment'
    )),
  amount              DECIMAL(10,2) NOT NULL,
  balance_after       DECIMAL(10,2) NOT NULL,
  description         TEXT NOT NULL,
  source_type         TEXT,
  source_reference_id UUID,
  category            TEXT,
  note                TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ft_member_created
  ON public.financial_transactions (family_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ft_family_created
  ON public.financial_transactions (family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ft_member_type
  ON public.financial_transactions (family_member_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_ft_source
  ON public.financial_transactions (source_type, source_reference_id)
  WHERE source_reference_id IS NOT NULL;

-- RLS — append-only: SELECT for family, INSERT for parent, NO update/delete
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ft_family_read" ON public.financial_transactions;
CREATE POLICY "ft_family_read" ON public.financial_transactions
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ft_parent_insert" ON public.financial_transactions;
CREATE POLICY "ft_parent_insert" ON public.financial_transactions
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
  );

-- No UPDATE or DELETE policies — append-only enforced at RLS level


-- ============================================================================
-- 3. allowance_periods
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.allowance_periods (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                   UUID NOT NULL REFERENCES public.families(id),
  family_member_id            UUID NOT NULL REFERENCES public.family_members(id),
  period_start                DATE NOT NULL,
  period_end                  DATE NOT NULL,
  status                      TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'makeup_window', 'calculated', 'closed')),
  -- Counts
  total_tasks_assigned        INTEGER NOT NULL DEFAULT 0,
  grace_day_tasks_excluded    INTEGER NOT NULL DEFAULT 0,
  effective_tasks_assigned    INTEGER NOT NULL DEFAULT 0,
  tasks_completed             INTEGER NOT NULL DEFAULT 0,
  extra_credit_completed      INTEGER NOT NULL DEFAULT 0,
  effective_tasks_completed   INTEGER NOT NULL DEFAULT 0,
  completion_percentage       DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  -- Amounts
  base_amount                 DECIMAL(10,2) NOT NULL,
  calculated_amount           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  bonus_applied               BOOLEAN NOT NULL DEFAULT false,
  bonus_amount                DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_earned                DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  -- Details
  grace_days                  JSONB NOT NULL DEFAULT '[]',
  calculation_details         JSONB NOT NULL DEFAULT '{}',
  calculated_at               TIMESTAMPTZ,
  closed_at                   TIMESTAMPTZ,
  closed_early                BOOLEAN NOT NULL DEFAULT false,
  -- Timestamps
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ap_member_period
  ON public.allowance_periods (family_member_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_ap_family_status
  ON public.allowance_periods (family_id, status);
CREATE INDEX IF NOT EXISTS idx_ap_member_status
  ON public.allowance_periods (family_member_id, status);

-- RLS
ALTER TABLE public.allowance_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ap_family_read" ON public.allowance_periods;
CREATE POLICY "ap_family_read" ON public.allowance_periods
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ap_parent_write" ON public.allowance_periods;
CREATE POLICY "ap_parent_write" ON public.allowance_periods
  FOR ALL USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
  );

CREATE OR REPLACE TRIGGER trg_allowance_periods_updated_at
  BEFORE UPDATE ON public.allowance_periods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 4. loans
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.loans (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id               UUID NOT NULL REFERENCES public.families(id),
  family_member_id        UUID NOT NULL REFERENCES public.family_members(id),
  original_amount         DECIMAL(10,2) NOT NULL,
  remaining_balance       DECIMAL(10,2) NOT NULL,
  reason                  TEXT,
  repayment_mode          TEXT NOT NULL DEFAULT 'manual'
    CHECK (repayment_mode IN ('manual', 'auto_deduct')),
  auto_deduct_amount      DECIMAL(10,2),
  interest_rate           DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  interest_period         TEXT NOT NULL DEFAULT 'monthly'
    CHECK (interest_period IN ('weekly', 'monthly')),
  interest_last_accrued   DATE,
  total_interest_accrued  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status                  TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paid_off', 'forgiven')),
  issued_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_off_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loans_member_status
  ON public.loans (family_member_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_family_status
  ON public.loans (family_id, status);

-- RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loans_family_read" ON public.loans;
CREATE POLICY "loans_family_read" ON public.loans
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "loans_parent_write" ON public.loans;
CREATE POLICY "loans_parent_write" ON public.loans
  FOR ALL USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
  );

CREATE OR REPLACE TRIGGER trg_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 5. ALTER task_rewards — add 'hourly' to reward_type CHECK
-- ============================================================================
-- Table has 0 rows — safe to rebuild constraint
ALTER TABLE public.task_rewards DROP CONSTRAINT IF EXISTS task_rewards_reward_type_check;
ALTER TABLE public.task_rewards
  ADD CONSTRAINT task_rewards_reward_type_check
  CHECK (reward_type IN ('points', 'money', 'privilege', 'custom', 'hourly'));


-- ============================================================================
-- 6. ALTER tasks — add tracking flag columns + 'makeup' to task_type + source
-- ============================================================================

-- 6a. Task-level tracking flags (Founder Addition 1)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS
  counts_for_allowance BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS
  counts_for_homework BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS
  counts_for_gamification BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS
  allowance_points INTEGER;

-- 6b. Rebuild task_type CHECK to include 'makeup' (9 → 10 values)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_task_type_check
  CHECK (task_type IN (
    'task',
    'routine',
    'opportunity_repeatable',
    'opportunity_claimable',
    'opportunity_capped',
    'sequential',
    'habit',
    'guided_form',
    'list',
    'makeup'
  ));

-- 6c. Rebuild tasks_source_check to include 'allowance_makeup' (16 → 17 values)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_source_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_source_check
  CHECK (source IN (
    'manual',
    'template_deployed',
    'lila_conversation',
    'notepad_routed',
    'review_route',
    'meeting_action',
    'goal_decomposition',
    'project_planner',
    'member_request',
    'sequential_promoted',
    'recurring_generated',
    'guided_form_assignment',
    'list_batch',
    'rhythm_priority',
    'rhythm_mindsweep_lite',
    'randomizer_reveal',
    'allowance_makeup'
  ));

-- Indexes for allowance pool queries
CREATE INDEX IF NOT EXISTS idx_tasks_allowance
  ON public.tasks (assignee_id, counts_for_allowance)
  WHERE counts_for_allowance = true AND archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_homework
  ON public.tasks (assignee_id, counts_for_homework)
  WHERE counts_for_homework = true AND archived_at IS NULL;


-- ============================================================================
-- 7. ALTER task_templates — add same 4 tracking flag columns
-- ============================================================================
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS
  counts_for_allowance BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS
  counts_for_homework BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS
  counts_for_gamification BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS
  allowance_points INTEGER;


-- ============================================================================
-- 8. UPDATE roll_creature_for_completion RPC — add counts_for_gamification check
-- ============================================================================
-- Adds Step 2.5: if the completed task has counts_for_gamification = false,
-- skip the entire gamification pipeline. All existing tasks default to true,
-- so this is a non-breaking additive change with zero behavioral regression.

CREATE OR REPLACE FUNCTION public.roll_creature_for_completion(
  p_task_completion_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_completion         RECORD;
  v_task               RECORD;
  v_member             RECORD;
  v_config             RECORD;
  v_state              RECORD;
  v_existing_creature  UUID;
  v_completion_type    TEXT;
  v_points_to_award    INTEGER := 0;
  v_new_point_total    INTEGER := 0;
  v_streak_updated     BOOLEAN := false;
  v_new_streak         INTEGER := 0;
  v_streak_milestone   INTEGER := NULL;
  -- Creature earning
  v_creature_roll      INTEGER;
  v_rarity_roll        INTEGER;
  v_chosen_rarity      TEXT := NULL;
  v_creature           RECORD;
  v_creature_awarded   BOOLEAN := false;
  v_page               RECORD;
  v_page_unlocked      BOOLEAN := false;
  v_next_page_id       UUID;
  v_position_x         REAL;
  v_position_y         REAL;
  v_common_pct         INTEGER;
  v_rare_pct           INTEGER;
  -- Earning mode vars
  v_earning_mode       TEXT;
  v_should_award_creature BOOLEAN := false;
  v_segment_completed  BOOLEAN := false;
  v_segment_name       TEXT := NULL;
  v_segment_id         UUID := NULL;
  v_day_completed      BOOLEAN := false;
  -- Page earning
  v_page_earning_mode  TEXT;
  v_should_unlock_page BOOLEAN := false;
  -- Color reveal
  v_reveal             RECORD;
  v_reveal_result      JSONB;
  v_color_reveals      JSONB := '[]'::jsonb;
  v_should_advance     BOOLEAN;
  -- Return payload parts (avoids accessing uninitialized RECORD fields)
  v_creature_json      JSONB := NULL;
  v_page_json          JSONB := NULL;
BEGIN
  -- Step 1: Load task_completion + task + member context
  SELECT * INTO v_completion FROM public.task_completions WHERE id = p_task_completion_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'task_completion_not_found');
  END IF;

  SELECT * INTO v_task FROM public.tasks WHERE id = v_completion.task_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'task_not_found');
  END IF;

  -- Step 2: Check gamification opt-in flag (PRD-28 Addition)
  -- All existing tasks default to counts_for_gamification = true.
  -- This is a non-breaking additive check — zero behavioral regression.
  IF COALESCE(v_task.counts_for_gamification, true) = false THEN
    RETURN jsonb_build_object('skipped_gamification_opt_out', true);
  END IF;

  SELECT * INTO v_member FROM public.family_members WHERE id = v_completion.family_member_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'family_member_not_found');
  END IF;

  SELECT * INTO v_config FROM public.gamification_configs WHERE family_member_id = v_member.id;
  IF NOT FOUND OR v_config.enabled = false THEN
    RETURN jsonb_build_object('gamification_disabled', true);
  END IF;

  -- Step 3: Idempotency
  SELECT id INTO v_existing_creature
    FROM public.member_creature_collection
   WHERE awarded_source_id = p_task_completion_id
   LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'already_processed', true,
      'new_point_total', v_member.gamification_points,
      'new_streak', v_member.current_streak
    );
  END IF;

  -- Step 4: Filter by completion_type
  v_completion_type := COALESCE(v_completion.completion_type, 'complete');
  IF v_completion_type NOT IN ('complete', 'mastery_approved') THEN
    RETURN jsonb_build_object('skipped_completion_type', v_completion_type);
  END IF;

  -- Step 5: Calculate points
  v_points_to_award := COALESCE(v_task.points_override, v_config.base_points_per_task);
  v_new_point_total := COALESCE(v_member.gamification_points, 0) + v_points_to_award;
  UPDATE public.family_members SET gamification_points = v_new_point_total WHERE id = v_member.id;

  -- Step 6: Update streak (naive consecutive-day)
  IF v_member.last_task_completion_date IS NULL THEN
    v_new_streak := 1; v_streak_updated := true;
  ELSIF v_member.last_task_completion_date = CURRENT_DATE THEN
    v_new_streak := COALESCE(v_member.current_streak, 1); v_streak_updated := false;
  ELSIF v_member.last_task_completion_date = (CURRENT_DATE - INTERVAL '1 day')::date THEN
    v_new_streak := COALESCE(v_member.current_streak, 0) + 1; v_streak_updated := true;
  ELSE
    v_new_streak := 1; v_streak_updated := true;
  END IF;

  IF v_streak_updated THEN
    UPDATE public.family_members
       SET current_streak = v_new_streak,
           longest_streak = GREATEST(COALESCE(longest_streak, 0), v_new_streak),
           last_task_completion_date = CURRENT_DATE
     WHERE id = v_member.id;
  END IF;

  -- Step 7: Load sticker book state
  SELECT * INTO v_state FROM public.member_sticker_book_state WHERE family_member_id = v_member.id;
  IF NOT FOUND OR v_state.is_enabled = false THEN
    RETURN jsonb_build_object(
      'points_awarded', v_points_to_award, 'new_point_total', v_new_point_total,
      'creature_awarded', false, 'creature', NULL,
      'page_unlocked', false, 'page', NULL,
      'streak_updated', v_streak_updated, 'new_streak', v_new_streak,
      'streak_milestone', NULL
    );
  END IF;

  -- Step 8: Creature earning — branch on mode
  v_earning_mode := COALESCE(v_state.creature_earning_mode, 'random_per_task');

  CASE v_earning_mode
    WHEN 'random_per_task' THEN
      v_creature_roll := floor(random() * 100)::int + 1;
      IF v_creature_roll <= v_state.creature_roll_chance_per_task THEN
        v_should_award_creature := true;
      END IF;

    WHEN 'every_n_completions' THEN
      UPDATE public.member_sticker_book_state
         SET creature_earning_counter = creature_earning_counter + 1
       WHERE id = v_state.id
       RETURNING creature_earning_counter INTO v_state.creature_earning_counter;

      IF v_state.creature_earning_counter >= v_state.creature_earning_threshold THEN
        v_should_award_creature := true;
        IF v_state.creature_earning_counter_resets THEN
          UPDATE public.member_sticker_book_state SET creature_earning_counter = 0 WHERE id = v_state.id;
        END IF;
      END IF;

    WHEN 'segment_complete' THEN
      IF v_task.task_segment_id IS NOT NULL THEN
        v_segment_completed := public.check_segment_completion(v_task.id);
        IF v_segment_completed THEN
          SELECT id, segment_name INTO v_segment_id, v_segment_name
            FROM public.task_segments
           WHERE id = v_task.task_segment_id AND is_active = true;
          IF FOUND THEN
            IF array_length(v_state.creature_earning_segment_ids, 1) IS NULL
               OR v_segment_id = ANY(v_state.creature_earning_segment_ids) THEN
              IF (SELECT creature_earning_enabled FROM public.task_segments WHERE id = v_segment_id) THEN
                v_should_award_creature := true;
              END IF;
            END IF;
          END IF;
        END IF;
      END IF;

    WHEN 'complete_the_day' THEN
      v_day_completed := public.check_day_completion(v_member.id);
      IF v_day_completed THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.member_creature_collection
           WHERE family_member_id = v_member.id
             AND awarded_source_type = 'day_complete'
             AND awarded_at::date = CURRENT_DATE
        ) THEN
          v_should_award_creature := true;
        END IF;
      END IF;

  ELSE
    v_should_award_creature := false;
  END CASE;

  -- Step 9: Pick rarity + creature + insert
  IF v_should_award_creature THEN
    v_common_pct := COALESCE((v_state.rarity_weights->>'common')::int, 85);
    v_rare_pct   := COALESCE((v_state.rarity_weights->>'rare')::int, 12);
    v_rarity_roll := floor(random() * 100)::int + 1;
    IF v_rarity_roll <= v_common_pct THEN
      v_chosen_rarity := 'common';
    ELSIF v_rarity_roll <= (v_common_pct + v_rare_pct) THEN
      v_chosen_rarity := 'rare';
    ELSE
      v_chosen_rarity := 'legendary';
    END IF;

    SELECT * INTO v_creature FROM public.gamification_creatures
     WHERE theme_id = v_state.active_theme_id AND rarity = v_chosen_rarity AND is_active = true
     ORDER BY random() LIMIT 1;

    IF NOT FOUND AND v_chosen_rarity = 'legendary' THEN
      SELECT * INTO v_creature FROM public.gamification_creatures
       WHERE theme_id = v_state.active_theme_id AND rarity = 'rare' AND is_active = true
       ORDER BY random() LIMIT 1;
      IF FOUND THEN v_chosen_rarity := 'rare'; END IF;
    END IF;

    IF NOT FOUND AND v_chosen_rarity IN ('rare','legendary') THEN
      SELECT * INTO v_creature FROM public.gamification_creatures
       WHERE theme_id = v_state.active_theme_id AND rarity = 'common' AND is_active = true
       ORDER BY random() LIMIT 1;
      IF FOUND THEN v_chosen_rarity := 'common'; END IF;
    END IF;

    IF FOUND THEN
      v_position_x := random()::real * 0.85 + 0.05;
      v_position_y := random()::real * 0.85 + 0.05;
      v_creature_awarded := true;

      INSERT INTO public.member_creature_collection (
        family_id, family_member_id, creature_id,
        sticker_page_id, position_x, position_y,
        awarded_source_type, awarded_source_id
      ) VALUES (
        v_member.family_id, v_member.id, v_creature.id,
        v_state.active_page_id, v_position_x, v_position_y,
        CASE WHEN v_earning_mode = 'complete_the_day' THEN 'day_complete' ELSE 'task_completion' END,
        p_task_completion_id
      );

      UPDATE public.member_sticker_book_state
         SET creatures_earned_total = creatures_earned_total + 1
       WHERE id = v_state.id;

      v_state.creatures_earned_total := v_state.creatures_earned_total + 1;

      v_creature_json := jsonb_build_object(
        'id',           v_creature.id,
        'slug',         v_creature.slug,
        'display_name', v_creature.display_name,
        'rarity',       v_chosen_rarity,
        'description',  v_creature.description,
        'image_url',    v_creature.image_url
      );
    END IF;
  END IF;

  -- Step 10: Page earning — branch on mode
  v_page_earning_mode := COALESCE(v_state.page_earning_mode, 'every_n_creatures');

  CASE v_page_earning_mode
    WHEN 'every_n_creatures' THEN
      IF v_creature_awarded
         AND v_state.creatures_earned_total > 0
         AND v_state.creatures_earned_total % v_state.page_unlock_interval = 0 THEN
        v_should_unlock_page := true;
      END IF;

    WHEN 'every_n_completions' THEN
      UPDATE public.member_sticker_book_state
         SET page_earning_completion_counter = page_earning_completion_counter + 1
       WHERE id = v_state.id
       RETURNING page_earning_completion_counter INTO v_state.page_earning_completion_counter;

      IF v_state.page_earning_completion_counter >= v_state.page_earning_completion_threshold THEN
        v_should_unlock_page := true;
        UPDATE public.member_sticker_book_state
           SET page_earning_completion_counter = 0
         WHERE id = v_state.id;
      END IF;

    WHEN 'tracker_goal' THEN
      IF v_state.page_earning_tracker_widget_id IS NOT NULL THEN
        IF (
          SELECT count(*) FROM public.widget_data_points
           WHERE widget_id = v_state.page_earning_tracker_widget_id
             AND family_member_id = v_member.id
        ) >= COALESCE(v_state.page_earning_tracker_threshold, 5) THEN
          IF NOT EXISTS (
            SELECT 1 FROM public.member_page_unlocks
             WHERE family_member_id = v_member.id
               AND unlocked_trigger_type = 'tracker_goal'
               AND creatures_at_unlock = (
                 SELECT count(*) FROM public.widget_data_points
                  WHERE widget_id = v_state.page_earning_tracker_widget_id
                    AND family_member_id = v_member.id
               )
          ) THEN
            v_should_unlock_page := true;
          END IF;
        END IF;
      END IF;

  ELSE
    v_should_unlock_page := false;
  END CASE;

  -- Execute page unlock
  IF v_should_unlock_page THEN
    SELECT sp.* INTO v_page
      FROM public.gamification_sticker_pages sp
      LEFT JOIN public.member_page_unlocks mpu
        ON mpu.sticker_page_id = sp.id AND mpu.family_member_id = v_member.id
     WHERE sp.theme_id = v_state.active_theme_id
       AND sp.is_active = true AND mpu.id IS NULL
     ORDER BY sp.sort_order LIMIT 1;

    IF FOUND THEN
      v_page_unlocked := true;
      v_next_page_id := v_page.id;

      INSERT INTO public.member_page_unlocks (
        family_id, family_member_id, sticker_page_id,
        unlocked_trigger_type, creatures_at_unlock
      ) VALUES (
        v_member.family_id, v_member.id, v_next_page_id,
        CASE v_page_earning_mode
          WHEN 'every_n_creatures' THEN 'creature_count'
          WHEN 'every_n_completions' THEN 'task_completion'
          WHEN 'tracker_goal' THEN 'tracker_goal'
          ELSE 'creature_count'
        END,
        v_state.creatures_earned_total
      );

      UPDATE public.member_sticker_book_state
         SET pages_unlocked_total = pages_unlocked_total + 1,
             active_page_id = v_next_page_id
       WHERE id = v_state.id;

      v_page_json := jsonb_build_object(
        'id',           v_page.id,
        'slug',         v_page.slug,
        'display_name', v_page.display_name,
        'scene',        v_page.scene,
        'season',       v_page.season,
        'image_url',    v_page.image_url
      );
    END IF;
  END IF;

  -- Step 11: Advance coloring reveals
  FOR v_reveal IN
    SELECT mcr.* FROM public.member_coloring_reveals mcr
     WHERE mcr.family_member_id = v_member.id
       AND mcr.is_active = true AND mcr.is_complete = false
  LOOP
    v_should_advance := false;

    -- Phase 5: Task-linked reveals bypass earning_mode entirely
    IF v_reveal.earning_task_id IS NOT NULL THEN
      IF v_reveal.earning_task_id = v_task.id THEN
        v_should_advance := true;
      END IF;
    ELSE
      CASE v_reveal.earning_mode
        WHEN 'every_n_completions' THEN
          UPDATE public.member_coloring_reveals
             SET earning_counter = earning_counter + 1
           WHERE id = v_reveal.id
           RETURNING earning_counter INTO v_reveal.earning_counter;
          IF v_reveal.earning_counter >= v_reveal.earning_threshold THEN
            v_should_advance := true;
            UPDATE public.member_coloring_reveals SET earning_counter = 0 WHERE id = v_reveal.id;
          END IF;

        WHEN 'segment_complete' THEN
          IF v_segment_completed AND v_task.task_segment_id IS NOT NULL THEN
            IF array_length(v_reveal.earning_segment_ids, 1) IS NULL
               OR v_task.task_segment_id = ANY(v_reveal.earning_segment_ids) THEN
              v_should_advance := true;
            END IF;
          END IF;

        WHEN 'complete_the_day' THEN
          IF v_day_completed OR public.check_day_completion(v_member.id) THEN
            v_should_advance := true;
          END IF;

        WHEN 'random_per_task' THEN
          IF floor(random() * 100)::int + 1 <= 40 THEN
            v_should_advance := true;
          END IF;

      ELSE
        v_should_advance := false;
      END CASE;
    END IF;

    IF v_should_advance THEN
      v_reveal_result := public.advance_coloring_reveal(v_reveal.id);
      IF (v_reveal_result ->> 'advanced')::boolean IS TRUE THEN
        v_color_reveals := v_color_reveals || jsonb_build_object(
          'reveal_id', v_reveal.id,
          'new_step', (v_reveal_result ->> 'new_step')::int,
          'total_steps', (v_reveal_result ->> 'total_steps')::int,
          'is_complete', (v_reveal_result ->> 'is_complete')::boolean,
          'image_slug', v_reveal_result ->> 'image_slug'
        );
      END IF;
    END IF;
  END LOOP;

  -- Step 12: Return full payload
  RETURN jsonb_build_object(
    'points_awarded',    v_points_to_award,
    'new_point_total',   v_new_point_total,
    'creature_awarded',  v_creature_awarded,
    'creature',          v_creature_json,
    'page_unlocked',     v_page_unlocked,
    'page',              v_page_json,
    'streak_updated',    v_streak_updated,
    'new_streak',        v_new_streak,
    'streak_milestone',  v_streak_milestone,
    'segment_completed', CASE WHEN v_segment_completed AND v_segment_id IS NOT NULL
      THEN jsonb_build_object('segment_id', v_segment_id, 'segment_name', v_segment_name)
      ELSE NULL END,
    'coloring_reveals_advanced', v_color_reveals
  );
END;
$fn$;


-- ============================================================================
-- 9. Feature keys
-- ============================================================================
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('allowance_basic', 'Basic Allowance', 'Fixed Template approach, up to 3 children', 'PRD-28'),
  ('allowance_advanced', 'Advanced Allowance', 'All 3 approaches, Points-Weighted, bonus thresholds', 'PRD-28'),
  ('financial_tracking', 'Financial Tracking', 'Full transaction ledger, loans, purchase deductions, business work', 'PRD-28'),
  ('homeschool_subjects', 'Homework & Subjects', 'Subject configuration and time logging', 'PRD-28'),
  ('homeschool_compliance', 'Compliance Reporting', 'Compliance reporting data export (PRD-28B)', 'PRD-28B')
ON CONFLICT (feature_key) DO NOTHING;

-- Feature access grants (Essential tier for basic, Enhanced for advanced/financial/homework)
-- Get tier IDs
DO $$
DECLARE
  v_essential UUID;
  v_enhanced  UUID;
  v_full      UUID;
BEGIN
  SELECT id INTO v_essential FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;
  SELECT id INTO v_enhanced  FROM public.subscription_tiers WHERE slug = 'enhanced' LIMIT 1;
  SELECT id INTO v_full      FROM public.subscription_tiers WHERE slug = 'full-magic' LIMIT 1;

  -- allowance_basic — Essential tier, mom + dad
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  VALUES
    ('allowance_basic', 'mom', v_essential, true),
    ('allowance_basic', 'dad_adults', v_essential, true)
  ON CONFLICT DO NOTHING;

  -- allowance_advanced — Enhanced tier, mom + dad
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  VALUES
    ('allowance_advanced', 'mom', v_enhanced, true),
    ('allowance_advanced', 'dad_adults', v_enhanced, true)
  ON CONFLICT DO NOTHING;

  -- financial_tracking — Enhanced tier, mom + dad
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  VALUES
    ('financial_tracking', 'mom', v_enhanced, true),
    ('financial_tracking', 'dad_adults', v_enhanced, true)
  ON CONFLICT DO NOTHING;

  -- homeschool_subjects — Enhanced tier, mom + dad
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  VALUES
    ('homeschool_subjects', 'mom', v_enhanced, true),
    ('homeschool_subjects', 'dad_adults', v_enhanced, true)
  ON CONFLICT DO NOTHING;

  -- homeschool_compliance — Full Magic tier, mom only
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  VALUES
    ('homeschool_compliance', 'mom', v_full, true)
  ON CONFLICT DO NOTHING;
END $$;


-- ============================================================================
-- 10. RPC: calculate_running_balance
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_running_balance(
  p_member_id UUID
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_balance DECIMAL(10,2);
BEGIN
  SELECT balance_after INTO v_balance
    FROM public.financial_transactions
   WHERE family_member_id = p_member_id
   ORDER BY created_at DESC
   LIMIT 1;

  RETURN COALESCE(v_balance, 0.00);
END;
$fn$;


-- ============================================================================
-- 11. pg_cron jobs
--
--     Originally written with current_setting('app.settings.*') which is
--     permission-denied on Supabase hosted; both jobs silently failed on
--     every run for 7+ days (Scope 7 baseline). Rewritten 2026-04-20 to
--     use util.invoke_edge_function which reads from Supabase Vault.
--     Migration 100150 creates the helper and reschedules; this file is
--     kept in sync for fresh-DB rebuilds.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'util' AND p.proname = 'invoke_edge_function'
  ) THEN
    RAISE NOTICE 'util.invoke_edge_function not yet present; migration 100150 will schedule these jobs.';
    RETURN;
  END IF;

  -- Allowance period calculation — hourly at :10
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'calculate-allowance-period') THEN
    PERFORM cron.unschedule('calculate-allowance-period');
  END IF;
  PERFORM cron.schedule(
    'calculate-allowance-period',
    '10 * * * *',
    $cron$
    SELECT util.invoke_edge_function('calculate-allowance-period');
    $cron$
  );

  -- Loan interest accrual — hourly at :15
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'accrue-loan-interest') THEN
    PERFORM cron.unschedule('accrue-loan-interest');
  END IF;
  PERFORM cron.schedule(
    'accrue-loan-interest',
    '15 * * * *',
    $cron$
    SELECT util.invoke_edge_function('accrue-loan-interest');
    $cron$
  );
END $$;


-- ============================================================================
-- Verification
-- ============================================================================
DO $$ BEGIN
  RAISE NOTICE 'migration 100134: PRD-28 Sub-phase A — 4 new tables, 3 altered tables, RPC update, 5 feature keys, 2 cron jobs';
  RAISE NOTICE '  allowance_configs: %', (SELECT count(*) FROM public.allowance_configs);
  RAISE NOTICE '  financial_transactions: %', (SELECT count(*) FROM public.financial_transactions);
  RAISE NOTICE '  allowance_periods: %', (SELECT count(*) FROM public.allowance_periods);
  RAISE NOTICE '  loans: %', (SELECT count(*) FROM public.loans);
  RAISE NOTICE '  task_rewards hourly check: %', (
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.task_rewards'::regclass
      AND conname = 'task_rewards_reward_type_check'
  );
  RAISE NOTICE '  tasks.counts_for_allowance column: %', (
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'counts_for_allowance'
  );
  RAISE NOTICE '  tasks.counts_for_gamification default true: %', (
    SELECT column_default FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'counts_for_gamification'
  );
  RAISE NOTICE '  feature keys registered: %', (
    SELECT count(*) FROM public.feature_key_registry WHERE feature_key IN (
      'allowance_basic', 'allowance_advanced', 'financial_tracking',
      'homeschool_subjects', 'homeschool_compliance'
    )
  );
END $$;
