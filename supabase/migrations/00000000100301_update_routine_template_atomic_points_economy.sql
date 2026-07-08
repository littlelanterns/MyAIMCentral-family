-- ============================================================================
-- 100301 — Point Economy Slice A3: extend update_routine_template_atomic to
--          persist per-routine points config + per-step reward columns
--
-- The routine editor (Slice A3) needs to save routine_points_mode/
-- routine_step_points/routine_completion_points (task_templates, added in
-- migration 100296) and the 5 per-step reward columns (task_template_steps,
-- also 100296) from the SAME atomic save flow that already rewrites
-- title/description/sections/steps. Rewritten from the CURRENT (100178)
-- body — verified via `grep -rl "update_routine_template_atomic"` across
-- all migrations immediately before writing this file; no later migration
-- had touched it.
--
-- Three new TRAILING parameters, all DEFAULT NULL for backward
-- compatibility with any caller still using the original 4-arg signature
-- (Postgres resolves a 4-arg call to this same function with the new
-- params defaulting): p_routine_points_mode, p_routine_step_points,
-- p_routine_completion_points. COALESCE'd against the existing column
-- value so an omitted param leaves that field untouched — the two known
-- call sites (createTaskFromData.ts editingTemplateId branch,
-- Tasks.tsx:handleEditTask) are both updated in this same slice to always
-- pass explicit values, so this is a safety net, not the primary path.
--
-- Step reward columns (reward_type/reward_amount/reward_description/
-- reward_image_url/reward_image_asset_key) are added to the p_sections[].
-- steps[] JSONB shape and the per-step INSERT — RSTP scope, ruling 4.
--
-- IMPORTANT: adding trailing parameters via a bare CREATE OR REPLACE does
-- NOT replace the original 4-arg function — Postgres treats a changed
-- argument LIST as a distinct overload, which would leave both the old
-- 4-arg (unaware of points economy) and new 7-arg functions resolvable,
-- creating an ambiguous-call trap for any 4-arg caller. The explicit DROP
-- below removes the old signature first so there is exactly one function
-- named update_routine_template_atomic after this migration.
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_routine_template_atomic(uuid, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.update_routine_template_atomic(
  p_template_id                uuid,
  p_title                      text,
  p_description                text,
  p_sections                   jsonb,
  p_routine_points_mode        text DEFAULT NULL,
  p_routine_step_points        integer DEFAULT NULL,
  p_routine_completion_points  integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_user_id    uuid := auth.uid();
  v_caller_family_id  uuid;
  v_template_family   uuid;
  v_section           jsonb;
  v_step              jsonb;
  v_new_section_id    uuid;
  v_section_count     integer := 0;
  v_step_count        integer := 0;
BEGIN
  -- ── RLS check ─────────────────────────────────────────────────
  -- The caller must belong to the family that owns the template.
  -- Service-role calls (auth.uid() IS NULL) are allowed for tooling.
  IF v_caller_user_id IS NOT NULL THEN
    SELECT family_id INTO v_caller_family_id
    FROM public.family_members
    WHERE user_id = v_caller_user_id
    LIMIT 1;

    SELECT family_id INTO v_template_family
    FROM public.task_templates
    WHERE id = p_template_id;

    IF v_template_family IS NULL THEN
      RAISE EXCEPTION 'Template not found: %', p_template_id
        USING ERRCODE = 'no_data_found';
    END IF;

    IF v_caller_family_id IS NULL OR v_caller_family_id <> v_template_family THEN
      RAISE EXCEPTION 'Permission denied: caller does not own template %', p_template_id
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- ── Step 1: update template metadata (100301: + points economy) ────
  UPDATE public.task_templates
     SET title                      = p_title,
         template_name              = p_title,
         description                = p_description,
         routine_points_mode        = COALESCE(p_routine_points_mode, routine_points_mode),
         routine_step_points        = COALESCE(p_routine_step_points, routine_step_points),
         routine_completion_points  = COALESCE(p_routine_completion_points, routine_completion_points),
         updated_at                 = now()
   WHERE id = p_template_id;

  -- ── Step 2: delete child steps (FK to sections) ────────────────
  -- Step deletes safe under c1's SET NULL FK on routine_step_completions:
  -- completion rows orphan their step_id but survive (Convention #259).
  DELETE FROM public.task_template_steps
   WHERE section_id IN (
     SELECT id FROM public.task_template_sections
      WHERE template_id = p_template_id
   );

  -- ── Step 3: delete child sections ──────────────────────────────
  DELETE FROM public.task_template_sections
   WHERE template_id = p_template_id;

  -- ── Step 4: insert new sections + steps (100301: + step rewards) ──
  IF p_sections IS NOT NULL AND jsonb_typeof(p_sections) = 'array' THEN
    FOR v_section IN SELECT * FROM jsonb_array_elements(p_sections)
    LOOP
      INSERT INTO public.task_template_sections (
        template_id,
        title,
        section_name,
        frequency_rule,
        frequency_days,
        show_until_complete,
        sort_order
      ) VALUES (
        p_template_id,
        v_section ->> 'title',
        COALESCE(v_section ->> 'section_name', v_section ->> 'title'),
        v_section ->> 'frequency_rule',
        CASE
          WHEN v_section -> 'frequency_days' IS NULL OR v_section -> 'frequency_days' = 'null'::jsonb
            THEN NULL
          ELSE ARRAY(
            SELECT (jsonb_array_elements_text(v_section -> 'frequency_days'))::integer
          )
        END,
        COALESCE((v_section ->> 'show_until_complete')::boolean, false),
        COALESCE((v_section ->> 'sort_order')::integer, 0)
      )
      RETURNING id INTO v_new_section_id;

      v_section_count := v_section_count + 1;

      IF v_section -> 'steps' IS NOT NULL AND jsonb_typeof(v_section -> 'steps') = 'array' THEN
        FOR v_step IN SELECT * FROM jsonb_array_elements(v_section -> 'steps')
        LOOP
          INSERT INTO public.task_template_steps (
            section_id,
            title,
            step_name,
            step_notes,
            instance_count,
            require_photo,
            sort_order,
            step_type,
            linked_source_id,
            linked_source_type,
            display_name_override,
            reward_type,
            reward_amount,
            reward_description,
            reward_image_url,
            reward_image_asset_key
          ) VALUES (
            v_new_section_id,
            v_step ->> 'title',
            COALESCE(v_step ->> 'step_name', v_step ->> 'title'),
            NULLIF(v_step ->> 'step_notes', ''),
            COALESCE((v_step ->> 'instance_count')::integer, 1),
            COALESCE((v_step ->> 'require_photo')::boolean, false),
            COALESCE((v_step ->> 'sort_order')::integer, 0),
            COALESCE(NULLIF(v_step ->> 'step_type', ''), 'static'),
            NULLIF(v_step ->> 'linked_source_id', '')::uuid,
            NULLIF(v_step ->> 'linked_source_type', ''),
            NULLIF(v_step ->> 'display_name_override', ''),
            NULLIF(v_step ->> 'reward_type', ''),
            NULLIF(v_step ->> 'reward_amount', '')::numeric,
            NULLIF(v_step ->> 'reward_description', ''),
            NULLIF(v_step ->> 'reward_image_url', ''),
            NULLIF(v_step ->> 'reward_image_asset_key', '')
          );
          v_step_count := v_step_count + 1;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'section_count', v_section_count,
    'step_count',    v_step_count
  );
END;
$$;

COMMENT ON FUNCTION public.update_routine_template_atomic(uuid, text, text, jsonb, text, integer, integer) IS
  'Worker ROUTINE-SAVE-FIX (c3), extended by PRD-24 Point Economy Addendum '
  '100301: atomic routine template rewrite, now including per-routine '
  'points economy (routine_points_mode/routine_step_points/'
  'routine_completion_points) and per-step reward config (reward_type/'
  'reward_amount/reward_description/reward_image_url/reward_image_asset_key '
  '— RSTP scope, ruling 4). Trailing points-economy params default to NULL '
  '(COALESCE keeps the existing value) for backward compatibility with any '
  '4-arg caller. SECURITY DEFINER + family-ownership RLS check.';

GRANT EXECUTE ON FUNCTION public.update_routine_template_atomic(uuid, text, text, jsonb, text, integer, integer)
  TO authenticated;


-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_arg_count INT;
BEGIN
  SELECT pronargs INTO v_arg_count
  FROM pg_proc
  WHERE proname = 'update_routine_template_atomic' AND pronamespace = 'public'::regnamespace;

  RAISE NOTICE 'migration 100301: update_routine_template_atomic extended for points economy';
  RAISE NOTICE '  function now takes % arguments (expected 7)', v_arg_count;
END $$;
