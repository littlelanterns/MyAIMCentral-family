-- Migration: 00000000100266_kids_rewards_pipeline_core.sql
-- Build: KIDS-REWARDS-PAGE — Slice 1 (Reward pipeline core / Unification Principle backbone)
-- Gate authority: claude/feature-decisions/KIDS-REWARDS-PAGE-Gate-Decisions.md (Q2/Q5/Q7 + post-gate approval §11)
--
-- Contents:
--   1. Reward description + three-mode image columns on tasks / list_items / task_templates /
--      custom_reward_godmother_configs (Q5a/Q5b — three-mode picker: text-only / upload / platform image)
--   2. earned_prizes: per-reward visibility model (family/private/shared), creator attribution,
--      completion-keyed idempotency column (Build M awarded_source_id precedent)
--   3. earned_prizes RLS rewrite — query-layer visibility enforcement (never rendered-then-hidden)
--      + "personal rewards privacy" mom-grant honored via SECURITY DEFINER helper
--      (helper pattern per migration 100265 lesson: no inline cross-table policy subquery loops)
--   4. redeem_own_prize() RPC — kid-final redeem (Q2): earner redeems own prize, redeem fields only,
--      quiet notification to mom. Parents keep full UPDATE (un-redeem = clearing redeemed_at, Q2).
--   5. award_custom_reward_for_completion() RPC — the privileges/family_activities → earned_prizes
--      pipe (Q7). Idempotent, never double-awards, honors the approval-timing rule.
--   6. execute_custom_reward_godmother() updated — snapshots image + name (fixes 100214 text-only gap).
--
-- Idempotent throughout. No behavior change for existing rows: every existing/kid-earned prize
-- defaults to visibility='family' (status quo: family-scoped reads).

BEGIN;

-- ============================================================================
-- 1. Reward description + image columns (Unification Principle Q5)
--    Three-mode picker storage: reward_image_url (mom upload, gamification-assets bucket)
--    XOR reward_image_asset_key (platform_assets feature_key). Both NULL = text-only.
-- ============================================================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS reward_description     TEXT,
  ADD COLUMN IF NOT EXISTS reward_image_url       TEXT,
  ADD COLUMN IF NOT EXISTS reward_image_asset_key TEXT;

ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS reward_description     TEXT,
  ADD COLUMN IF NOT EXISTS reward_image_url       TEXT,
  ADD COLUMN IF NOT EXISTS reward_image_asset_key TEXT;

-- task_templates uses its established default_* naming for reward fields
-- (default_reward_type / default_reward_amount precedent).
ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS default_reward_description     TEXT,
  ADD COLUMN IF NOT EXISTS default_reward_image_url       TEXT,
  ADD COLUMN IF NOT EXISTS default_reward_image_asset_key TEXT;

ALTER TABLE public.custom_reward_godmother_configs
  ADD COLUMN IF NOT EXISTS reward_image_url       TEXT,
  ADD COLUMN IF NOT EXISTS reward_image_asset_key TEXT;

COMMENT ON COLUMN public.tasks.reward_description IS
  'KIDS-REWARDS-PAGE Q5/Q7: human description of a privileges/family_activities reward ("a popsicle"). Snapshotted into earned_prizes.prize_text at award time.';
COMMENT ON COLUMN public.tasks.reward_image_url IS
  'Three-mode reward image: mom-uploaded image URL (gamification-assets/reward-images/{family_id}/...). Mutually exclusive with reward_image_asset_key.';
COMMENT ON COLUMN public.tasks.reward_image_asset_key IS
  'Three-mode reward image: platform_assets feature_key (prize_type=platform_image path). Mutually exclusive with reward_image_url.';

-- ============================================================================
-- 2. earned_prizes — visibility model + creator + idempotency
-- ============================================================================

ALTER TABLE public.earned_prizes
  ADD COLUMN IF NOT EXISTS visibility             TEXT NOT NULL DEFAULT 'family',
  ADD COLUMN IF NOT EXISTS shared_with_member_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by             UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS awarded_completion_id  UUID REFERENCES public.task_completions(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'earned_prizes_visibility_check'
      AND conrelid = 'public.earned_prizes'::regclass
  ) THEN
    ALTER TABLE public.earned_prizes
      ADD CONSTRAINT earned_prizes_visibility_check
      CHECK (visibility IN ('family', 'private', 'shared'));
  END IF;
END $$;

-- One prize per task completion (double-fire backstop; Build M awarded_source_id precedent)
CREATE UNIQUE INDEX IF NOT EXISTS uq_earned_prizes_awarded_completion
  ON public.earned_prizes(awarded_completion_id)
  WHERE awarded_completion_id IS NOT NULL;

COMMENT ON COLUMN public.earned_prizes.visibility IS
  'KIDS-REWARDS-PAGE visibility convention: family (default — all kid-earned/mom-promised rewards, family-visible status quo), private (self-created reward, creator + mom unless personal_rewards_privacy grant), shared (creator + listed members + mom unless grant).';
COMMENT ON COLUMN public.earned_prizes.created_by IS
  'Who authored the promise (task creator / contract author / self-proposer). For self-rewards creator = earner.';
COMMENT ON COLUMN public.earned_prizes.awarded_completion_id IS
  'task_completions.id that produced this prize (privileges/family_activities path). UNIQUE where set — idempotency key against double-award.';

-- ============================================================================
-- 3. RLS rewrite — query-layer visibility (never rendered-then-hidden)
-- ============================================================================

-- Personal-rewards-privacy grant lives in family_members.preferences (managed from the
-- Gamification Settings "My Rewards Page" section). SECURITY DEFINER so the policy never
-- depends on family_members RLS (migration 100265 recursion lesson).
CREATE OR REPLACE FUNCTION util.personal_rewards_privacy(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT COALESCE((fm.preferences ->> 'personal_rewards_privacy')::boolean, false)
    FROM public.family_members fm
   WHERE fm.id = p_member_id
$fn$;

REVOKE ALL ON FUNCTION util.personal_rewards_privacy(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.personal_rewards_privacy(UUID) TO authenticated;

COMMENT ON FUNCTION util.personal_rewards_privacy IS
  'KIDS-REWARDS-PAGE: mom-granted per-member privacy for private self-rewards. True = that member''s private/shared self-rewards are hidden from mom too (query layer). Reversible by mom.';

-- SELECT: family scope AND visibility rules.
--   family  → any family member (status quo for all pre-existing rows)
--   private → earner, creator, or primary parent (unless privacy grant on the earner)
--   shared  → earner, creator, listed members, or primary parent (unless privacy grant)
DROP POLICY IF EXISTS "earned_prizes_select" ON public.earned_prizes;
CREATE POLICY "earned_prizes_select"
  ON public.earned_prizes FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
    AND (
      visibility = 'family'
      OR family_member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
      OR created_by IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.id = ANY (earned_prizes.shared_with_member_ids)
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.family_members fm
          WHERE fm.user_id = auth.uid()
            AND fm.family_id = earned_prizes.family_id
            AND fm.role = 'primary_parent'
        )
        AND NOT util.personal_rewards_privacy(earned_prizes.family_member_id)
      )
    )
  );

-- UPDATE: parents manage prizes they can see (redeem on behalf, un-redeem, edit-image-later);
-- adults additionally manage their own / their-created self-rewards.
-- Kid self-redeem does NOT go through this policy — it goes through redeem_own_prize() below.
DROP POLICY IF EXISTS "earned_prizes_update" ON public.earned_prizes;
CREATE POLICY "earned_prizes_update"
  ON public.earned_prizes FOR UPDATE
  USING (
    (
      family_id IN (
        SELECT fm.family_id FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.role IN ('primary_parent', 'additional_adult')
      )
      AND (
        visibility = 'family'
        OR (
          EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.user_id = auth.uid()
              AND fm.family_id = earned_prizes.family_id
              AND fm.role = 'primary_parent'
          )
          AND NOT util.personal_rewards_privacy(earned_prizes.family_member_id)
        )
      )
    )
    OR family_member_id IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role IN ('primary_parent', 'additional_adult')
    )
    OR created_by IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role IN ('primary_parent', 'additional_adult')
    )
  );

-- ============================================================================
-- 4. redeem_own_prize() — kid-final redeem with quiet mom notification (Q2)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.redeem_own_prize(p_prize_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_prize        RECORD;
  v_caller       RECORD;
  v_mom_id       UUID;
  v_display      TEXT;
BEGIN
  SELECT * INTO v_prize FROM public.earned_prizes WHERE id = p_prize_id;
  IF v_prize.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  -- Caller must be THE EARNER (own prize only). Parents redeem via the normal
  -- UPDATE policy on the Prize Board — this RPC is the kid/self path.
  SELECT fm.id, fm.role, fm.display_name INTO v_caller
    FROM public.family_members fm
   WHERE fm.user_id = auth.uid()
     AND fm.family_id = v_prize.family_id
     AND fm.id = v_prize.family_member_id
   LIMIT 1;

  IF v_caller.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_allowed');
  END IF;

  UPDATE public.earned_prizes
     SET redeemed_at = now(),
         redeemed_by = v_caller.id
   WHERE id = p_prize_id
     AND redeemed_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'already_redeemed');
  END IF;

  -- Quiet fire-and-forget notification to mom (dad-payment-notification pattern).
  -- Skip when mom redeems her own prize. Never fails the redeem.
  BEGIN
    IF v_caller.role <> 'primary_parent' THEN
      SELECT fm.id INTO v_mom_id
        FROM public.family_members fm
       WHERE fm.family_id = v_prize.family_id
         AND fm.role = 'primary_parent'
       LIMIT 1;

      IF v_mom_id IS NOT NULL THEN
        v_display := COALESCE(NULLIF(v_prize.prize_name, ''), NULLIF(v_prize.prize_text, ''), 'a reward');
        INSERT INTO public.notifications (
          family_id, recipient_member_id,
          notification_type, category,
          title, body,
          source_type, source_reference_id,
          action_url, priority
        ) VALUES (
          v_prize.family_id, v_mom_id,
          'prize_redeemed', 'gamification',
          format('%s used a reward', v_caller.display_name),
          v_display,
          'earned_prize', v_prize.id,
          '/prize-board', 'normal'
        );
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- notification is additive, never load-bearing
  END;

  RETURN jsonb_build_object(
    'status', 'redeemed',
    'prize_id', v_prize.id,
    'redeemed_by', v_caller.id
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.redeem_own_prize(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.redeem_own_prize(UUID) TO authenticated;

COMMENT ON FUNCTION public.redeem_own_prize IS
  'KIDS-REWARDS-PAGE Q2: kid-final self-redeem. Earner-only, redeem fields only, quiet mom notification. Un-redeem is a parent UPDATE (clears redeemed_at/redeemed_by) via the normal policy.';

-- ============================================================================
-- 5. award_custom_reward_for_completion() — privileges/family_activities pipe (Q7)
--    Called from the same hook sites that handle money forward-writes.
--    Approval-timing rule: require_approval tasks award at APPROVAL, others at completion.
--    Idempotent via awarded_completion_id. Never raises to the client path that calls it.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.award_custom_reward_for_completion(p_task_completion_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_completion   RECORD;
  v_task         RECORD;
  v_reward       RECORD;
  v_desc         TEXT;
  v_prize_type   TEXT;
  v_prize_id     UUID;
BEGIN
  SELECT tc.id, tc.task_id, tc.approval_status, tc.completion_type,
         COALESCE(tc.family_member_id, tc.member_id) AS earner_id
    INTO v_completion
    FROM public.task_completions tc
   WHERE tc.id = p_task_completion_id;

  IF v_completion.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  -- Practice / mastery-submit rows never award (Convention #200 parity)
  IF v_completion.completion_type IN ('practice', 'mastery_submit') THEN
    RETURN jsonb_build_object('status', 'skipped_completion_type');
  END IF;

  -- Idempotency: one prize per completion
  IF EXISTS (
    SELECT 1 FROM public.earned_prizes ep
    WHERE ep.awarded_completion_id = v_completion.id
  ) THEN
    RETURN jsonb_build_object('status', 'already_awarded');
  END IF;

  SELECT t.id, t.family_id, t.title, t.created_by, t.require_approval,
         t.reward_description, t.reward_image_url, t.reward_image_asset_key
    INTO v_task
    FROM public.tasks t
   WHERE t.id = v_completion.task_id;

  IF v_task.id IS NULL THEN
    RETURN jsonb_build_object('status', 'task_not_found');
  END IF;

  SELECT tr.reward_type, tr.reward_value INTO v_reward
    FROM public.task_rewards tr
   WHERE tr.task_id = v_task.id
   LIMIT 1;

  IF v_reward.reward_type IS NULL
     OR v_reward.reward_type NOT IN ('privileges', 'family_activities') THEN
    RETURN jsonb_build_object('status', 'skipped_reward_type');
  END IF;

  -- Q7 timing rule: approval-required items award at mom's APPROVAL only.
  IF COALESCE(v_task.require_approval, false)
     AND COALESCE(v_completion.approval_status, 'pending') <> 'approved' THEN
    RETURN jsonb_build_object('status', 'skipped_pending_approval');
  END IF;

  IF v_completion.earner_id IS NULL THEN
    RETURN jsonb_build_object('status', 'skipped_no_member');
  END IF;

  v_desc := COALESCE(
    NULLIF(v_task.reward_description, ''),
    NULLIF(v_reward.reward_value ->> 'description', ''),
    v_task.title
  );

  v_prize_type := CASE
    WHEN v_task.reward_image_url IS NOT NULL AND v_task.reward_image_url <> '' THEN 'image'
    WHEN v_task.reward_image_asset_key IS NOT NULL AND v_task.reward_image_asset_key <> '' THEN 'platform_image'
    ELSE 'text'
  END;

  INSERT INTO public.earned_prizes (
    family_id, family_member_id,
    source_type, source_id,
    prize_type, prize_text, prize_name,
    prize_image_url, prize_asset_key,
    visibility, created_by, awarded_completion_id
  ) VALUES (
    v_task.family_id, v_completion.earner_id,
    'task_completion', v_task.id,
    v_prize_type, v_desc, NULLIF(LEFT(BTRIM(v_desc), 80), ''),
    NULLIF(v_task.reward_image_url, ''), NULLIF(v_task.reward_image_asset_key, ''),
    'family', v_task.created_by, v_completion.id
  )
  ON CONFLICT (awarded_completion_id) WHERE awarded_completion_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_prize_id;

  IF v_prize_id IS NULL THEN
    RETURN jsonb_build_object('status', 'already_awarded');
  END IF;

  RETURN jsonb_build_object('status', 'awarded', 'prize_id', v_prize_id);
END;
$fn$;

REVOKE ALL ON FUNCTION public.award_custom_reward_for_completion(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.award_custom_reward_for_completion(UUID) TO authenticated;

COMMENT ON FUNCTION public.award_custom_reward_for_completion IS
  'KIDS-REWARDS-PAGE Q7: privileges/family_activities reward → earned_prizes row. Idempotent (awarded_completion_id). Approval-required tasks award at approval, others at completion. Covers tasks, routines, and opportunity claim-bridge tasks (all share task_completions).';

-- ============================================================================
-- 6. execute_custom_reward_godmother — image + name snapshot (fixes 100214 gap)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.execute_custom_reward_godmother(
  p_contract_id  UUID,
  p_deed_firing  JSONB,
  p_payload      JSONB,
  p_stroke_of    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_family_id      UUID;
  v_member_id      UUID;
  v_config_id      UUID;
  v_config         RECORD;
  v_delivery_mode  TEXT;
  v_prize_text     TEXT;
  v_list_id        UUID;
  v_list_item      RECORD;
  v_earned_id      UUID;
  v_image_url      TEXT;
  v_asset_key      TEXT;
  v_prize_type     TEXT;
  v_created_by     UUID;
BEGIN
  v_family_id := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id := (p_deed_firing ->> 'family_member_id')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'custom_reward_godmother: deed firing has no family_member_id'
    );
  END IF;

  -- Resolve config
  v_config_id := (p_payload ->> 'godmother_config_id')::uuid;
  IF v_config_id IS NOT NULL THEN
    SELECT * INTO v_config
      FROM public.custom_reward_godmother_configs
     WHERE id = v_config_id;
  END IF;

  v_delivery_mode := COALESCE(v_config.delivery_mode, 'text');

  IF v_delivery_mode = 'list_reference' THEN
    -- List reference mode: pick next unawarded item from the rewards list
    v_list_id := v_config.reward_list_id;

    IF v_list_id IS NULL THEN
      RETURN jsonb_build_object(
        'status', 'failed',
        'error_message', 'custom_reward_godmother: list_reference mode but no reward_list_id configured'
      );
    END IF;

    SELECT id, content, item_name, reward_image_url, reward_image_asset_key INTO v_list_item
      FROM public.list_items
     WHERE list_id = v_list_id
       AND checked = false
       AND (is_available IS NULL OR is_available = true)
     ORDER BY random()
     LIMIT 1;

    IF v_list_item.id IS NULL THEN
      v_prize_text := COALESCE(v_config.reward_text, 'Custom reward (list exhausted)');
    ELSE
      v_prize_text := COALESCE(v_list_item.item_name, v_list_item.content, 'Reward from list');
      -- KIDS-REWARDS-PAGE Q5: per-item reward image wins for list draws
      v_image_url := NULLIF(v_list_item.reward_image_url, '');
      v_asset_key := NULLIF(v_list_item.reward_image_asset_key, '');

      UPDATE public.list_items
         SET checked = true,
             checked_at = now(),
             checked_by = v_member_id
       WHERE id = v_list_item.id
         AND (is_repeatable IS NULL OR is_repeatable = false);

      UPDATE public.list_items
         SET period_completion_count = COALESCE(period_completion_count, 0) + 1,
             last_completed_at = now()
       WHERE id = v_list_item.id
         AND is_repeatable = true;
    END IF;
  ELSE
    v_prize_text := COALESCE(v_config.reward_text, p_payload ->> 'payload_text');
    IF v_prize_text IS NULL OR v_prize_text = '' THEN
      v_prize_text := format('Custom reward from contract %s', p_contract_id);
    END IF;
  END IF;

  -- KIDS-REWARDS-PAGE Q5a: config-level image (used when no per-item image was found)
  v_image_url := COALESCE(v_image_url, NULLIF(v_config.reward_image_url, ''));
  v_asset_key := COALESCE(v_asset_key, NULLIF(v_config.reward_image_asset_key, ''));

  v_prize_type := CASE
    WHEN v_image_url IS NOT NULL THEN 'image'
    WHEN v_asset_key IS NOT NULL THEN 'platform_image'
    ELSE 'text'
  END;

  -- Creator attribution: the contract's author
  SELECT c.created_by INTO v_created_by
    FROM public.contracts c
   WHERE c.id = p_contract_id;

  INSERT INTO public.earned_prizes (
    family_id, family_member_id,
    source_type, source_id,
    prize_type, prize_text, prize_name,
    prize_image_url, prize_asset_key,
    visibility, created_by
  ) VALUES (
    v_family_id, v_member_id,
    COALESCE(p_deed_firing ->> 'source_type', 'contract_grant'),
    COALESCE((p_deed_firing ->> 'source_id')::uuid, p_contract_id),
    v_prize_type, v_prize_text, NULLIF(LEFT(BTRIM(v_prize_text), 80), ''),
    v_image_url, v_asset_key,
    'family', v_created_by
  )
  RETURNING id INTO v_earned_id;

  RETURN jsonb_build_object(
    'status', 'granted',
    'grant_reference', v_earned_id,
    'metadata', jsonb_build_object(
      'family_member_id', v_member_id,
      'delivery_mode', v_delivery_mode,
      'prize_text', v_prize_text,
      'prize_type', v_prize_type,
      'list_item_id', CASE WHEN v_list_item.id IS NOT NULL THEN v_list_item.id ELSE NULL END
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_custom_reward_godmother IS
  'Phase 3 connector: delivers custom rewards via text or list-reference mode. '
  'Writes IOUs to earned_prizes. KIDS-REWARDS-PAGE: snapshots reward image (upload or platform asset) + prize_name; per-item list image wins over config image.';

-- ============================================================================
-- 7. Verification
-- ============================================================================

DO $$
DECLARE
  v_cols INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_cols
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND (
       (table_name = 'tasks' AND column_name IN ('reward_description', 'reward_image_url', 'reward_image_asset_key'))
       OR (table_name = 'list_items' AND column_name IN ('reward_description', 'reward_image_url', 'reward_image_asset_key'))
       OR (table_name = 'task_templates' AND column_name IN ('default_reward_description', 'default_reward_image_url', 'default_reward_image_asset_key'))
       OR (table_name = 'custom_reward_godmother_configs' AND column_name IN ('reward_image_url', 'reward_image_asset_key'))
       OR (table_name = 'earned_prizes' AND column_name IN ('visibility', 'shared_with_member_ids', 'created_by', 'awarded_completion_id'))
     );
  RAISE NOTICE 'migration 100266: % expected new columns present (want 15)', v_cols;
  IF v_cols <> 15 THEN
    RAISE EXCEPTION 'migration 100266: column count mismatch (%/15)', v_cols;
  END IF;
END $$;

COMMIT;
