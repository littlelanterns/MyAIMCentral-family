-- Migration: 00000000100280_consume_opportunity_list_item.sql
-- Build: OPPORTUNITY-SURFACES — claimed-board-job → list-item write-back
--        (founder-approved 2026-07-02, number confirmed by founder)
--
-- Completing a claimed opportunity-board job never consumed the source list
-- item (completed_instances / is_available / last_completed_at). Two stacked
-- root causes:
--   1. useCompleteOpportunityTask — the only code that wrote those fields —
--      was exported but never called (client fix: opportunityListWriteBack.ts
--      wired at all six completion/approval/uncomplete sites).
--   2. Even when called, kid PERSONAL sessions have no list_items write path:
--      the only write policy is li_via_list (migration 000008 — list owner /
--      primary parent / list_shares). Opportunity boards are mom-owned with no
--      shares, so a kid's UPDATE was silently filtered to 0 rows. Migration
--      100141 opened SELECT for exactly this reason; writes were never opened.
--      li_family_device (100262) covers family-shadow devices only.
--
-- Surgical fix (the 100275 place_member_creature / Slice 1 redeem_own_prize
-- pattern): ONE SECURITY DEFINER RPC. Every written value is derived
-- server-side from the claim-bridge task and its source item — the caller
-- supplies only the task id and a direction. Kids get no general write access
-- to board items: rewards, names, availability of siblings' items all stay
-- behind the untouched li_via_list policy.
--
-- Authorization: the task's assignee (the kid who claimed it), a parent
-- (primary_parent / additional_adult — covers approvals and View As), or a
-- family-shadow session (family devices, Convention #276). Non-assignee
-- siblings are rejected.

BEGIN;

CREATE OR REPLACE FUNCTION public.consume_opportunity_list_item(
  p_task_id UUID,
  p_direction TEXT  -- 'complete' | 'uncomplete'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, util
AS $fn$
DECLARE
  v_task RECORD;
  v_item RECORD;
  v_list_default TEXT;
  v_subtype TEXT;
  v_new_count INTEGER;
  v_available BOOLEAN;
BEGIN
  IF p_direction NOT IN ('complete', 'uncomplete') THEN
    RETURN jsonb_build_object('status', 'bad_direction');
  END IF;

  -- 1. Only claim-bridge tasks participate
  SELECT id, family_id, assignee_id, source, source_reference_id
    INTO v_task
    FROM public.tasks
   WHERE id = p_task_id;
  IF v_task.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF v_task.source IS DISTINCT FROM 'opportunity_list_claim'
     OR v_task.source_reference_id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_bridge_task');
  END IF;

  -- 2. Authorization: assignee, parent, or family-shadow of the task's family
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.family_members fm
       WHERE fm.user_id = auth.uid()
         AND fm.family_id = v_task.family_id
         AND (fm.id = v_task.assignee_id
              OR fm.role IN ('primary_parent', 'additional_adult'))
    )
    OR util.is_family_shadow_of(v_task.family_id)
  ) THEN
    RETURN jsonb_build_object('status', 'not_allowed');
  END IF;

  -- 3. Load the source item; subtype resolution mirrors useClaimOpportunityItem
  SELECT id, list_id, opportunity_subtype, completed_instances, max_instances
    INTO v_item
    FROM public.list_items
   WHERE id = v_task.source_reference_id;
  IF v_item.id IS NULL THEN
    RETURN jsonb_build_object('status', 'item_not_found');
  END IF;

  SELECT default_opportunity_subtype INTO v_list_default
    FROM public.lists
   WHERE id = v_item.list_id;

  v_subtype := COALESCE(v_item.opportunity_subtype, v_list_default, 'one_time');

  IF p_direction = 'complete' THEN
    v_new_count := COALESCE(v_item.completed_instances, 0) + 1;
    -- one_time items are consumed by their single completion; capped items
    -- exit the pool when max_instances is reached
    v_available := NOT (
      v_subtype = 'one_time'
      OR (v_item.max_instances IS NOT NULL AND v_new_count >= v_item.max_instances)
    );

    UPDATE public.list_items
       SET completed_instances = v_new_count,
           last_completed_at   = now(),
           is_available        = CASE WHEN v_available THEN is_available ELSE false END
     WHERE id = v_item.id;
  ELSE
    -- Uncomplete: the claim-release in the uncomplete paths already returns
    -- the job to the pool — the counter/availability follow. last_completed_at
    -- is deliberately untouched (clearing it could erase an older legitimate
    -- cooldown window).
    v_new_count := GREATEST(0, COALESCE(v_item.completed_instances, 0) - 1);

    UPDATE public.list_items
       SET completed_instances = v_new_count,
           is_available        = CASE
             WHEN v_item.max_instances IS NULL OR v_new_count < v_item.max_instances
               THEN true
             ELSE is_available
           END
     WHERE id = v_item.id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'ok',
    'list_id', v_item.list_id,
    'list_item_id', v_item.id
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.consume_opportunity_list_item(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.consume_opportunity_list_item(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.consume_opportunity_list_item IS
  'OPPORTUNITY-SURFACES: consume/restore the source list item behind an '
  'opportunity claim-bridge task (completed_instances / is_available / '
  'last_completed_at only — all values server-derived). Task assignee, '
  'parents, or family-shadow only.';

COMMIT;
