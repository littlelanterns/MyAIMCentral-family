-- ============================================================================
-- 100302 — PECON-SHOP (Worker B): The Reward Shop
--          PRD-24 Point Economy Addendum §6/§7/§8.2-8.3/§9/§10
--          (rulings 6-9, dispatch pack claude/dispatch-factory/PECON.md)
--
-- Contents:
--   1. util.has_reward_rules_grant(family_id) — family-wide binary grant
--      helper (studio/reward_rules/meal_planning shape, Convention #274).
--   2. reward_shop_items — family-level catalog. Mom + reward_rules-granted
--      adults CRUD; members SELECT active+in-audience rows only.
--   3. reward_shop_purchases — purchase lifecycle (pending/approved/
--      declined/cancelled/auto_approved). RLS SELECT only — writes via the
--      three SECURITY DEFINER RPCs below (no client INSERT/UPDATE policy,
--      same posture as point_transactions).
--   4. purchase_reward_shop_item(item, member, acted_by) — validates active/
--      audience/limit-window/unlock-gate/balance, deducts via
--      record_point_transaction (race-safe row lock), auto-approves straight
--      to earned_prizes or parks pending for mom. Play ALWAYS pends.
--   5. resolve_reward_shop_purchase(purchase, action, note, processed_by) —
--      mom-only (v1). Approve → earned_prizes + kid notice. Decline →
--      refund txn + kid notice.
--   6. cancel_reward_shop_purchase(purchase) — kid "Take it back" (own
--      session, family-shadow session, or mom). Refund txn.
--   7. member_completion_percentage(member, start, end) — the #271
--      grandfathered blend (routine days via obligation_active_for_member_
--      on_date, non-routine tasks direct-counted) MINUS money math and pool
--      coupling, per addendum §6.4. NOT built by Worker A — built here.
--      0/0 assigned = 100% (ungated, allowance parity).
--   8. reward_shop feature key (feature_key_registry + feature_access_v2,
--      Essential tier, all role groups).
--
-- SECURITY (100298/100300 standing law): every new SECURITY DEFINER function
-- taking a bare row id authorizes BEFORE computing or paying anything —
-- service_role, or a family_members row in the SAME family as the referenced
-- row. purchase_reward_shop_item additionally accepts the member's own
-- session, a family-shadow session (util.is_family_shadow_of, Convention
-- #276 FDWA lesson — redeem_own_prize's missing shadow branch is the
-- documented failure NOT repeated here), or a parent/adult acting-for.
--
-- Idempotent throughout.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. util.has_reward_rules_grant — family-wide binary grant helper
--    (studio / reward_rules / meal_planning shape, Convention #274).
--    Defined FIRST — every table's RLS below calls it.
-- ============================================================================

CREATE OR REPLACE FUNCTION util.has_reward_rules_grant(p_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.member_permissions mp
      JOIN public.family_members fm
        ON fm.id = mp.granted_to
       AND fm.user_id = auth.uid()
       AND fm.family_id = p_family_id
     WHERE mp.family_id = p_family_id
       AND mp.permission_key = 'reward_rules'
       AND mp.target_member_id IS NULL
       AND COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none') <> 'none'
  );
$$;

REVOKE ALL ON FUNCTION util.has_reward_rules_grant(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.has_reward_rules_grant(UUID) TO authenticated;

COMMENT ON FUNCTION util.has_reward_rules_grant IS
  'PRD-24 Point Economy Addendum §6.1/§9: family-wide reward_rules grant '
  'check for Reward Shop management (same grant class as /contracts, '
  'Convention #274). True for an additional_adult holding a non-none '
  'family-wide reward_rules row.';

-- ============================================================================
-- 2. reward_shop_items — the catalog
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reward_shop_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by            UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  name                  TEXT NOT NULL,
  description           TEXT,
  image_url             TEXT,
  image_asset_key       TEXT,
  point_cost            INTEGER NOT NULL CHECK (point_cost > 0),
  requires_approval     BOOLEAN NOT NULL DEFAULT true,
  -- Empty array = every gamification-enabled kid (addendum §6.1).
  audience_member_ids   UUID[] NOT NULL DEFAULT '{}',
  limit_per_member      INTEGER,
  limit_period          TEXT CHECK (limit_period IN ('day', 'week', 'month')),
  -- v1 supports one rule type: {"type":"completion_pct","threshold":80,"window":"week"}
  unlock_rule           JSONB,
  notes_to_kid          TEXT,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  archived_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_shop_items_family
  ON public.reward_shop_items (family_id, is_active);

DROP TRIGGER IF EXISTS trg_reward_shop_items_updated_at ON public.reward_shop_items;
CREATE TRIGGER trg_reward_shop_items_updated_at
  BEFORE UPDATE ON public.reward_shop_items
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

COMMENT ON TABLE public.reward_shop_items IS
  'PRD-24 Point Economy Addendum §8.2: family-level Reward Shop catalog. '
  'Data, not code (Convention #252 bulk-add applies to the item editor). '
  'One point cost per item — priced in points only (D-PECON-7, never mixes '
  'with dollars).';

ALTER TABLE public.reward_shop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rsi_mom_all" ON public.reward_shop_items;
CREATE POLICY "rsi_mom_all" ON public.reward_shop_items
  FOR ALL
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "rsi_granted_adult_all" ON public.reward_shop_items;
CREATE POLICY "rsi_granted_adult_all" ON public.reward_shop_items
  FOR ALL
  USING (util.has_reward_rules_grant(family_id))
  WITH CHECK (util.has_reward_rules_grant(family_id));

-- Members: active, unarchived, in-audience (or audience empty = everyone).
DROP POLICY IF EXISTS "rsi_member_read" ON public.reward_shop_items;
CREATE POLICY "rsi_member_read" ON public.reward_shop_items
  FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    AND is_active = true
    AND archived_at IS NULL
    AND (
      COALESCE(array_length(audience_member_ids, 1), 0) = 0
      OR EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.id = ANY(audience_member_ids)
      )
    )
  );

-- ============================================================================
-- 3. reward_shop_purchases — the lifecycle. RLS SELECT only; ALL writes go
--    through the three SECURITY DEFINER RPCs below (same posture as
--    point_transactions — no client INSERT/UPDATE/DELETE policy exists).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reward_shop_purchases (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id              UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  store_item_id          UUID REFERENCES public.reward_shop_items(id) ON DELETE SET NULL,
  family_member_id       UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  item_name              TEXT NOT NULL,       -- snapshot at purchase time
  points_cost            INTEGER NOT NULL,    -- snapshot at purchase time
  status                 TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined', 'cancelled', 'auto_approved')),
  decline_note           TEXT,
  processed_by           UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  processed_at           TIMESTAMPTZ,
  spend_transaction_id   UUID REFERENCES public.point_transactions(id) ON DELETE SET NULL,
  refund_transaction_id  UUID REFERENCES public.point_transactions(id) ON DELETE SET NULL,
  earned_prize_id        UUID REFERENCES public.earned_prizes(id) ON DELETE SET NULL,
  acted_by               UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_shop_purchases_member
  ON public.reward_shop_purchases (family_member_id, status);
CREATE INDEX IF NOT EXISTS idx_reward_shop_purchases_item
  ON public.reward_shop_purchases (store_item_id, family_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_shop_purchases_family_pending
  ON public.reward_shop_purchases (family_id, status) WHERE status = 'pending';

DROP TRIGGER IF EXISTS trg_reward_shop_purchases_updated_at ON public.reward_shop_purchases;
CREATE TRIGGER trg_reward_shop_purchases_updated_at
  BEFORE UPDATE ON public.reward_shop_purchases
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

COMMENT ON TABLE public.reward_shop_purchases IS
  'PRD-24 Point Economy Addendum §8.3/§6.2: purchase lifecycle. Deduct-at-'
  'purchase (spend_transaction_id), refund-on-decline/cancel '
  '(refund_transaction_id). earned_prize_id set only at auto-approve or '
  'mom-approve (never pending) — mirrors #278 (never revoked). Writes ONLY '
  'via purchase_reward_shop_item / resolve_reward_shop_purchase / '
  'cancel_reward_shop_purchase — no client write policy exists.';

ALTER TABLE public.reward_shop_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rsp_select" ON public.reward_shop_purchases;
CREATE POLICY "rsp_select" ON public.reward_shop_purchases
  FOR SELECT
  USING (
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
    OR util.has_reward_rules_grant(family_id)
  );

-- ============================================================================
-- 4. member_completion_percentage — #271 grandfathered blend, minus money/
--    pool coupling (addendum §6.4). Built here (Worker A did NOT ship it).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.member_completion_percentage(
  p_member_id    UUID,
  p_period_start DATE,
  p_period_end   DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $fn$
DECLARE
  v_member_family    UUID;
  v_authorized       BOOLEAN := FALSE;
  v_period_days      INT;
  v_total_assigned   NUMERIC := 0;
  v_total_completed  NUMERIC := 0;
  v_task             RECORD;
  v_effective_start  DATE;
  v_effective_end    DATE;
  v_days_active      INT;
  v_pool_fraction    NUMERIC;
  v_routine_total_possible   INT;
  v_routine_actual_completed INT;
  v_routine_orphan_completed INT;
  v_routine_fraction NUMERIC;
  v_day              DATE;
  v_day_step_count   INT;
BEGIN
  SELECT family_id INTO v_member_family FROM family_members WHERE id = p_member_id;
  IF v_member_family IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM family_members caller
      WHERE caller.family_id = v_member_family
        AND caller.user_id = auth.uid()
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_period_days := (p_period_end - p_period_start) + 1;
  IF v_period_days < 1 THEN
    v_period_days := 1;
  END IF;

  FOR v_task IN
    SELECT t.id, t.task_type, t.status, t.template_id, t.created_at, t.archived_at
    FROM tasks t
    WHERE t.assignee_id = p_member_id
      AND (t.archived_at IS NULL OR t.archived_at::DATE > p_period_start)
      AND t.created_at::DATE <= p_period_end
  LOOP
    v_effective_start := GREATEST(v_task.created_at::DATE, p_period_start);
    IF v_effective_start > p_period_end THEN
      CONTINUE;
    END IF;

    IF v_task.archived_at IS NOT NULL THEN
      v_effective_end := LEAST(p_period_end, (v_task.archived_at::DATE - 1));
      IF v_effective_end < v_effective_start THEN
        CONTINUE;
      END IF;
    ELSE
      v_effective_end := p_period_end;
    END IF;

    v_days_active := (v_effective_end - v_effective_start) + 1;
    v_pool_fraction := v_days_active::NUMERIC / v_period_days;

    IF v_task.task_type = 'routine' AND v_task.template_id IS NOT NULL THEN
      v_routine_total_possible := 0;
      v_day := v_effective_start;
      WHILE v_day <= v_effective_end LOOP
        IF NOT public.obligation_active_for_member_on_date(v_task.id, p_member_id, v_day) THEN
          v_day := v_day + 1;
          CONTINUE;
        END IF;

        SELECT COALESCE(SUM(
          (SELECT COUNT(*)::INT FROM task_template_steps stp
           WHERE stp.section_id = tts.id
             AND stp.created_at::DATE <= v_day)
        ), 0)
        INTO v_day_step_count
        FROM task_template_sections tts
        WHERE tts.template_id = v_task.template_id
          AND public.section_scheduled_on_day(tts.frequency_rule, tts.frequency_days, v_day);

        v_routine_total_possible := v_routine_total_possible + COALESCE(v_day_step_count, 0);
        v_day := v_day + 1;
      END LOOP;

      SELECT COUNT(*)::INT
      INTO v_routine_actual_completed
      FROM (
        SELECT DISTINCT rsc.step_id, rsc.period_date
        FROM routine_step_completions rsc
        JOIN task_template_steps stp ON stp.id = rsc.step_id
        JOIN task_template_sections tts ON tts.id = stp.section_id
        WHERE rsc.task_id = v_task.id
          AND rsc.member_id = p_member_id
          AND rsc.period_date BETWEEN v_effective_start AND v_effective_end
          AND (
            tts.show_until_complete = TRUE
            OR public.section_scheduled_on_day(tts.frequency_rule, tts.frequency_days, rsc.period_date)
          )
          AND public.obligation_active_for_member_on_date(v_task.id, p_member_id, rsc.period_date)
      ) dedup;

      SELECT COUNT(*)::INT
      INTO v_routine_orphan_completed
      FROM routine_step_completions rsc
      WHERE rsc.task_id = v_task.id
        AND rsc.member_id = p_member_id
        AND rsc.step_id IS NULL
        AND rsc.period_date BETWEEN v_effective_start AND v_effective_end
        AND public.obligation_active_for_member_on_date(v_task.id, p_member_id, rsc.period_date);

      v_routine_actual_completed := v_routine_actual_completed + v_routine_orphan_completed;

      IF v_routine_total_possible > 0 THEN
        v_total_assigned := v_total_assigned + v_pool_fraction;
        v_routine_fraction := LEAST(
          v_routine_actual_completed::NUMERIC / v_routine_total_possible,
          1
        );
        v_total_completed := v_total_completed + (v_routine_fraction * v_pool_fraction);
      END IF;
    ELSE
      v_total_assigned := v_total_assigned + v_pool_fraction;
      IF v_task.status = 'completed' THEN
        v_total_completed := v_total_completed + v_pool_fraction;
      END IF;
    END IF;
  END LOOP;

  IF v_total_assigned = 0 THEN
    -- 0/0 = 100% — ungated (allowance parity, addendum §6.4 "framing rules").
    RETURN 100;
  END IF;

  RETURN LEAST((v_total_completed / v_total_assigned) * 100, 100);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.member_completion_percentage(UUID, DATE, DATE)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.member_completion_percentage IS
  'PRD-24 Point Economy Addendum §6.4: Reward Shop unlock-gate percentage. '
  'The SAME two-part blend calculate_allowance_progress uses (routine days '
  'gated through obligation_active_for_member_on_date, non-routine tasks '
  'direct-counted) MINUS money math and pool coupling — no allowance_configs '
  'dependency, no bonus/rounding, no grace days. 0/0 assigned = 100% '
  '(ungated). Consumed by purchase_reward_shop_item (hard gate) and the shop '
  'UI (progress display).';

-- ============================================================================
-- 5. purchase_reward_shop_item — the purchase choke point
-- ============================================================================

CREATE OR REPLACE FUNCTION public.purchase_reward_shop_item(
  p_item_id   UUID,
  p_member_id UUID,
  p_acted_by  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_item          RECORD;
  v_member        RECORD;
  v_family_id     UUID;
  v_authorized    BOOLEAN := FALSE;
  v_is_play       BOOLEAN;
  v_period_start  TIMESTAMPTZ;
  v_used_count    INTEGER;
  v_pct           NUMERIC;
  v_threshold     NUMERIC;
  v_gate_today    DATE;
  v_txn_result    JSONB;
  v_status        TEXT;
  v_purchase_id   UUID;
  v_prize_id      UUID;
  v_now           TIMESTAMPTZ := now();
BEGIN
  SELECT * INTO v_item FROM public.reward_shop_items WHERE id = p_item_id;
  IF v_item.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found', 'error_message', 'Item not found');
  END IF;

  SELECT * INTO v_member FROM public.family_members WHERE id = p_member_id;
  IF v_member.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found', 'error_message', 'Member not found');
  END IF;

  IF v_item.family_id <> v_member.family_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  v_family_id := v_item.family_id;

  -- Authorization (before anything else is computed or paid): the member's
  -- own real session, a family-shadow session of this family (Convention
  -- #276 FDWA lesson), or a parent/adult acting-for (View-As / Play assist).
  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    IF v_member.user_id = auth.uid() THEN
      v_authorized := TRUE;
    ELSIF util.is_family_shadow_of(v_family_id) THEN
      v_authorized := TRUE;
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM public.family_members caller
        WHERE caller.user_id = auth.uid()
          AND caller.family_id = v_family_id
          AND caller.role IN ('primary_parent', 'additional_adult')
      ) INTO v_authorized;
    END IF;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT v_item.is_active OR v_item.archived_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'item_unavailable', 'error_message', 'This item is no longer available.');
  END IF;

  -- Audience: empty array = every gamification-enabled kid.
  IF COALESCE(array_length(v_item.audience_member_ids, 1), 0) > 0
     AND NOT (p_member_id = ANY(v_item.audience_member_ids)) THEN
    RETURN jsonb_build_object('status', 'not_in_audience', 'error_message', 'This item is not available to you.');
  END IF;

  -- Unlock gate (framing law: never a list of misses — the caller renders
  -- warm progress from completion_percentage/threshold, never a blocker
  -- error). v1's 'week' window is the trailing 7 days ending today at the
  -- family-local day (Convention #257) — simplest correct reading of a
  -- rolling weekly rate without new calendar-week machinery.
  IF v_item.unlock_rule IS NOT NULL AND (v_item.unlock_rule ->> 'type') = 'completion_pct' THEN
    v_threshold := (v_item.unlock_rule ->> 'threshold')::NUMERIC;
    v_gate_today := public.family_today(p_member_id);
    v_pct := public.member_completion_percentage(p_member_id, v_gate_today - 6, v_gate_today);
    IF v_pct < v_threshold THEN
      RETURN jsonb_build_object(
        'status', 'gate_not_met',
        'error_message', 'Not unlocked yet.',
        'completion_percentage', v_pct,
        'threshold', v_threshold
      );
    END IF;
  END IF;

  -- Purchase limit window. Counts pending + approved + auto_approved — a
  -- pending purchase consumes the slot, cancel/decline frees it (addendum
  -- §10 edge case).
  IF v_item.limit_per_member IS NOT NULL AND v_item.limit_period IS NOT NULL THEN
    v_period_start := CASE v_item.limit_period
      WHEN 'day' THEN date_trunc('day', v_now)
      WHEN 'week' THEN date_trunc('week', v_now)
      WHEN 'month' THEN date_trunc('month', v_now)
    END;
    SELECT COUNT(*) INTO v_used_count
      FROM public.reward_shop_purchases rsp
     WHERE rsp.store_item_id = p_item_id
       AND rsp.family_member_id = p_member_id
       AND rsp.status IN ('pending', 'approved', 'auto_approved')
       AND rsp.created_at >= v_period_start;
    IF v_used_count >= v_item.limit_per_member THEN
      RETURN jsonb_build_object('status', 'limit_reached', 'error_message', 'Purchase limit reached for this period.');
    END IF;
  END IF;

  -- Play shell: EVERY purchase requires approval regardless of the item flag.
  v_is_play := (v_member.dashboard_mode = 'play');

  -- Deduct points NOW — race-safe via record_point_transaction's row lock.
  v_txn_result := public.record_point_transaction(
    v_family_id, p_member_id, -v_item.point_cost, 'spend',
    'store_purchase', p_item_id,
    format('Bought: %s', v_item.name),
    NULL, p_acted_by
  );

  IF (v_txn_result ->> 'status') = 'insufficient_balance' THEN
    RETURN jsonb_build_object(
      'status', 'insufficient_balance',
      'balance_after', (v_txn_result ->> 'balance_after')::INTEGER,
      'points_needed', v_item.point_cost
    );
  END IF;

  IF (v_txn_result ->> 'status') NOT IN ('recorded', 'already_recorded') THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error_message', COALESCE(v_txn_result ->> 'error_message', 'ledger write failed')
    );
  END IF;

  v_status := CASE WHEN v_is_play OR v_item.requires_approval THEN 'pending' ELSE 'auto_approved' END;

  INSERT INTO public.reward_shop_purchases (
    family_id, store_item_id, family_member_id,
    item_name, points_cost, status,
    spend_transaction_id, acted_by
  ) VALUES (
    v_family_id, p_item_id, p_member_id,
    v_item.name, v_item.point_cost, v_status,
    (v_txn_result ->> 'transaction_id')::UUID, p_acted_by
  )
  RETURNING id INTO v_purchase_id;

  IF v_status = 'auto_approved' THEN
    INSERT INTO public.earned_prizes (
      family_id, family_member_id,
      source_type, source_id,
      prize_type, prize_text, prize_name,
      prize_image_url, prize_asset_key,
      visibility, created_by
    ) VALUES (
      v_family_id, p_member_id,
      'store_purchase', v_purchase_id,
      CASE WHEN v_item.image_url IS NOT NULL THEN 'image'
           WHEN v_item.image_asset_key IS NOT NULL THEN 'platform_image'
           ELSE 'text' END,
      v_item.name, v_item.name,
      v_item.image_url, v_item.image_asset_key,
      'family', v_item.created_by
    )
    RETURNING id INTO v_prize_id;

    UPDATE public.reward_shop_purchases
       SET earned_prize_id = v_prize_id, processed_at = now()
     WHERE id = v_purchase_id;

    BEGIN
      INSERT INTO public.notifications (
        family_id, recipient_member_id, notification_type, category,
        title, body, source_type, source_reference_id, action_url, priority
      )
      SELECT v_family_id, fm.id, 'store_purchase_auto', 'gamification',
             format('%s got %s', v_member.display_name, v_item.name),
             format('%s point%s spent', v_item.point_cost, CASE WHEN v_item.point_cost = 1 THEN '' ELSE 's' END),
             'reward_shop_purchase', v_purchase_id, '/prize-board', 'normal'
        FROM public.family_members fm
       WHERE fm.family_id = v_family_id AND fm.role = 'primary_parent';
    EXCEPTION WHEN OTHERS THEN
      NULL; -- notification is additive, never load-bearing
    END;
  ELSE
    BEGIN
      INSERT INTO public.notifications (
        family_id, recipient_member_id, notification_type, category,
        title, body, source_type, source_reference_id, action_url, priority
      )
      SELECT v_family_id, fm.id, 'store_purchase_pending', 'requests',
             format('%s wants %s', v_member.display_name, v_item.name),
             format('%s points — waiting for your approval', v_item.point_cost),
             'reward_shop_purchase', v_purchase_id, '/prize-board', 'normal'
        FROM public.family_members fm
       WHERE fm.family_id = v_family_id AND fm.role = 'primary_parent';
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'purchase_id', v_purchase_id,
    'balance_after', (v_txn_result ->> 'balance_after')::INTEGER
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.purchase_reward_shop_item(UUID, UUID, UUID)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.purchase_reward_shop_item IS
  'PRD-24 Point Economy Addendum §6.2: the purchase choke point. Validates '
  'active/audience/limit-window/unlock-gate, deducts via '
  'record_point_transaction (race-safe row lock — the second of two '
  'concurrent purchases against one balance sees the reduced balance and '
  'fails cleanly), auto-approves straight to earned_prizes or parks pending '
  'for mom. Play ALWAYS pends regardless of the item flag. Authorizes the '
  'member''s own session, a family-shadow session, or a parent/adult '
  'acting-for BEFORE any business logic runs.';

-- ============================================================================
-- 6. resolve_reward_shop_purchase — mom approve/decline (v1: mom only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.resolve_reward_shop_purchase(
  p_purchase_id  UUID,
  p_action       TEXT,
  p_decline_note TEXT DEFAULT NULL,
  p_processed_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_purchase    RECORD;
  v_item        RECORD;
  v_authorized  BOOLEAN := FALSE;
  v_prize_id    UUID;
  v_refund      JSONB;
BEGIN
  SELECT * INTO v_purchase FROM public.reward_shop_purchases WHERE id = p_purchase_id;
  IF v_purchase.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  -- Authorization BEFORE any state change (100298/100300 standing law):
  -- service_role, or the family's primary_parent (mom-only v1 per ruling 6).
  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.family_members caller
      WHERE caller.user_id = auth.uid()
        AND caller.family_id = v_purchase.family_id
        AND caller.role = 'primary_parent'
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_purchase.status <> 'pending' THEN
    RETURN jsonb_build_object('status', 'already_resolved', 'current_status', v_purchase.status);
  END IF;

  SELECT * INTO v_item FROM public.reward_shop_items WHERE id = v_purchase.store_item_id;

  IF p_action = 'approve' THEN
    INSERT INTO public.earned_prizes (
      family_id, family_member_id,
      source_type, source_id,
      prize_type, prize_text, prize_name,
      prize_image_url, prize_asset_key,
      visibility, created_by
    ) VALUES (
      v_purchase.family_id, v_purchase.family_member_id,
      'store_purchase', v_purchase.id,
      CASE WHEN v_item.image_url IS NOT NULL THEN 'image'
           WHEN v_item.image_asset_key IS NOT NULL THEN 'platform_image'
           ELSE 'text' END,
      v_purchase.item_name, v_purchase.item_name,
      v_item.image_url, v_item.image_asset_key,
      'family', v_item.created_by
    )
    RETURNING id INTO v_prize_id;

    UPDATE public.reward_shop_purchases
       SET status = 'approved',
           earned_prize_id = v_prize_id,
           processed_by = p_processed_by,
           processed_at = now()
     WHERE id = p_purchase_id;

    BEGIN
      INSERT INTO public.notifications (
        family_id, recipient_member_id, notification_type, category,
        title, body, source_type, source_reference_id, action_url, priority
      ) VALUES (
        v_purchase.family_id, v_purchase.family_member_id, 'store_purchase_approved', 'gamification',
        format('%s is yours!', v_purchase.item_name),
        NULL, 'reward_shop_purchase', v_purchase.id, '/my-rewards', 'normal'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    RETURN jsonb_build_object('status', 'approved', 'prize_id', v_prize_id);

  ELSIF p_action = 'decline' THEN
    v_refund := public.record_point_transaction(
      v_purchase.family_id, v_purchase.family_member_id, v_purchase.points_cost, 'refund',
      'store_refund', v_purchase.id,
      format('Refund: %s', v_purchase.item_name),
      NULL, p_processed_by
    );

    UPDATE public.reward_shop_purchases
       SET status = 'declined',
           decline_note = p_decline_note,
           refund_transaction_id = (v_refund ->> 'transaction_id')::UUID,
           processed_by = p_processed_by,
           processed_at = now()
     WHERE id = p_purchase_id;

    BEGIN
      INSERT INTO public.notifications (
        family_id, recipient_member_id, notification_type, category,
        title, body, source_type, source_reference_id, action_url, priority
      ) VALUES (
        v_purchase.family_id, v_purchase.family_member_id, 'store_purchase_declined', 'gamification',
        format('Not this time: %s', v_purchase.item_name),
        p_decline_note, 'reward_shop_purchase', v_purchase.id, '/my-rewards', 'normal'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    RETURN jsonb_build_object('status', 'declined');
  ELSE
    RETURN jsonb_build_object('status', 'error', 'error_message', 'invalid action — expected approve or decline');
  END IF;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.resolve_reward_shop_purchase(UUID, TEXT, TEXT, UUID)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.resolve_reward_shop_purchase IS
  'PRD-24 Point Economy Addendum §6.2: mom approve/decline for a pending '
  'Reward Shop purchase (v1: primary_parent only, ruling 6). Approve → '
  'earned_prizes row (never pending, never revoked) + kid notice. Decline → '
  'refund transaction + kid notice with optional note. Authorization gate '
  'runs BEFORE any state mutation.';

-- ============================================================================
-- 7. cancel_reward_shop_purchase — kid "Take it back"
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cancel_reward_shop_purchase(
  p_purchase_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_purchase    RECORD;
  v_authorized  BOOLEAN := FALSE;
  v_refund      JSONB;
BEGIN
  SELECT * INTO v_purchase FROM public.reward_shop_purchases WHERE id = p_purchase_id;
  IF v_purchase.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  -- Authorization BEFORE any state change: service_role, the purchasing
  -- member's own session, a family-shadow session, or the family's mom.
  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = v_purchase.family_member_id
        AND fm.user_id = auth.uid()
    ) INTO v_authorized;

    IF NOT v_authorized THEN
      v_authorized := util.is_family_shadow_of(v_purchase.family_id);
    END IF;

    IF NOT v_authorized THEN
      SELECT EXISTS (
        SELECT 1 FROM public.family_members caller
        WHERE caller.user_id = auth.uid()
          AND caller.family_id = v_purchase.family_id
          AND caller.role = 'primary_parent'
      ) INTO v_authorized;
    END IF;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_purchase.status <> 'pending' THEN
    RETURN jsonb_build_object('status', 'already_resolved', 'current_status', v_purchase.status);
  END IF;

  v_refund := public.record_point_transaction(
    v_purchase.family_id, v_purchase.family_member_id, v_purchase.points_cost, 'refund',
    'store_refund', v_purchase.id,
    format('Refund: %s', v_purchase.item_name),
    NULL, NULL
  );

  UPDATE public.reward_shop_purchases
     SET status = 'cancelled',
         refund_transaction_id = (v_refund ->> 'transaction_id')::UUID,
         processed_at = now()
   WHERE id = p_purchase_id;

  RETURN jsonb_build_object('status', 'cancelled');
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.cancel_reward_shop_purchase(UUID)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.cancel_reward_shop_purchase IS
  'PRD-24 Point Economy Addendum §6.2: kid "Take it back" on their own '
  'pending purchase. Refunds via record_point_transaction. Authorized for '
  'the purchasing member''s own session, a family-shadow session, or mom.';

-- ============================================================================
-- 8. reward_shop feature key
-- ============================================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES (
  'reward_shop',
  'Reward Shop',
  'Family-level catalog kids buy from with points — items, purchases, mom approvals, completion-percentage unlock gates.',
  'PRD-24'
)
ON CONFLICT (feature_key) DO NOTHING;

DO $$
DECLARE
  v_essential UUID;
BEGIN
  SELECT id INTO v_essential FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;
  IF v_essential IS NOT NULL THEN
    INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
    VALUES
      ('reward_shop', 'mom',               v_essential, true),
      ('reward_shop', 'dad_adults',        v_essential, true),
      ('reward_shop', 'independent_teens', v_essential, true),
      ('reward_shop', 'guided_kids',       v_essential, true),
      ('reward_shop', 'play_kids',         v_essential, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_tables INTEGER;
  v_functions INTEGER;
  v_feature_key BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_tables
    FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('reward_shop_items', 'reward_shop_purchases');
  IF v_tables <> 2 THEN
    RAISE EXCEPTION 'migration 100302: expected 2 tables, found %', v_tables;
  END IF;

  SELECT COUNT(*) INTO v_functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE (n.nspname = 'public' AND p.proname IN (
           'purchase_reward_shop_item', 'resolve_reward_shop_purchase',
           'cancel_reward_shop_purchase', 'member_completion_percentage'
         ))
      OR (n.nspname = 'util' AND p.proname = 'has_reward_rules_grant');
  IF v_functions <> 5 THEN
    RAISE EXCEPTION 'migration 100302: expected 5 functions, found %', v_functions;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.feature_key_registry WHERE feature_key = 'reward_shop'
  ) INTO v_feature_key;
  IF NOT v_feature_key THEN
    RAISE EXCEPTION 'migration 100302: reward_shop feature key missing';
  END IF;

  RAISE NOTICE 'migration 100302: Reward Shop schema + RPCs + feature key OK';
END $$;

COMMIT;
