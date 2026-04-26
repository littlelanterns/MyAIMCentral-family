-- Worker ROUTINE-SAVE-FIX (c3) — atomic routine-template rewrite RPC.
--
-- Problem: createTaskFromData (src/utils/createTaskFromData.ts) and
-- Tasks.tsx:handleEditTask both rewrite a routine template via a
-- non-transactional sequence of supabase-js calls (UPDATE title → DELETE
-- old steps → DELETE old sections → INSERT new sections → INSERT new
-- steps). Partial commits are possible if any step fails mid-flow.
-- Without the SET NULL FK landed in c1 (migration 100177), the DELETE
-- step was the silent blocker that motivated this whole worker.
--
-- Fix: a single RPC that runs the whole rewrite inside one Postgres
-- transaction. Both call sites (createTaskFromData editingTemplateId
-- branch + Tasks.tsx:handleEditTask) consolidate to one path here, so
-- they cannot drift again. SECURITY DEFINER + RLS check inside the
-- function enforces that callers can only rewrite templates owned by
-- their own family.
--
-- Convention #259 compliance: the DELETE on task_template_steps now
-- runs against the SET NULL FK from c1, so completion rows orphan
-- their step_id but survive structurally.
--
-- p_sections shape:
--   [
--     {
--       "title": "Mornings",
--       "section_name": "Mornings",
--       "frequency_rule": "daily" | "weekly" | "weekdays" | "custom" | …,
--       "frequency_days": [1, 3, 5] | null,
--       "show_until_complete": false,
--       "sort_order": 0,
--       "steps": [
--         {
--           "title": "Brush teeth",
--           "step_name": "Brush teeth",
--           "step_notes": "for two minutes" | null,
--           "instance_count": 1,
--           "require_photo": false,
--           "sort_order": 0,
--           "step_type": "static" | "linked_sequential" | "linked_randomizer" | "linked_task",
--           "linked_source_id": "<uuid>" | null,
--           "linked_source_type": "sequential_collection" | "randomizer_list" | "recurring_task" | null,
--           "display_name_override": "<text>" | null
--         },
--         …
--       ]
--     },
--     …
--   ]
--
-- Returns: jsonb_build_object('section_count', N, 'step_count', M).
--
-- Frequency-rule normalization (mwf → custom+[1,3,5], t_th →
-- custom+[2,4]) is the CALLER'S responsibility — the RPC stores
-- whatever it's given. See src/utils/serializeRoutineSectionsForRpc.ts.

CREATE OR REPLACE FUNCTION public.update_routine_template_atomic(
  p_template_id   uuid,
  p_title         text,
  p_description   text,
  p_sections      jsonb
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

  -- ── Step 1: update template metadata ───────────────────────────
  UPDATE public.task_templates
     SET title         = p_title,
         template_name = p_title,
         description   = p_description,
         updated_at    = now()
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

  -- ── Step 4: insert new sections + steps ────────────────────────
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
            display_name_override
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
            NULLIF(v_step ->> 'display_name_override', '')
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

COMMENT ON FUNCTION public.update_routine_template_atomic(uuid, text, text, jsonb) IS
  'Worker ROUTINE-SAVE-FIX (c3): atomic routine template rewrite. Replaces non-transactional sequences in createTaskFromData and Tasks.tsx:handleEditTask. SECURITY DEFINER + family-ownership RLS check.';

GRANT EXECUTE ON FUNCTION public.update_routine_template_atomic(uuid, text, text, jsonb)
  TO authenticated;
