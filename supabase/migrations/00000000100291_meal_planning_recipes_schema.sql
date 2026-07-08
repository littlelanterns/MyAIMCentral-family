-- ============================================================================
-- 00000000100291_meal_planning_recipes_schema.sql
-- ============================================================================
-- Build: PRD-42 KitchenCompass, Phase A, Slice A1 (Schema)
-- Spec: prds/daily-life/PRD-42-Meal-Planning.md §5
-- Rulings: claude/dispatch-factory/PRD42.md (13 reconciliation rulings — LAW)
-- Build file: .claude/rules/current-builds/PRD-42-meal-planning.md
--
-- Contents:
--   1. recipes — the family Recipe Box (embedding-enabled, HITM-reviewed,
--      teen inserts forced to approval_status='suggested' at RLS)
--   2. recipe_versions — saved scaled/adapted versions
--   3. meal_plan_entries — dated plan entries; entry_date is a user-chosen
--      PLANNING date, deliberately exempt from Convention #257 trigger
--      derivation (ruling 4 — it is not "today"); mark-made fields are
--      editable by any adult/teen-cooking-their-own-entry without the
--      meal_planning grant via a field-scoped BEFORE UPDATE trigger
--      (structural fields — entry_date/meal_slot/recipe_id/servings_planned/
--      etc. — stay mom+grant only; RLS alone cannot express column-level
--      restriction, hence the trigger).
--   4. food_restrictions — hard safety constraints. Deliberately has NO
--      is_included_in_ai column: the always-include inversion (ruling 3 /
--      D-42-4), mirror image of Convention #76 Privacy Filtered. Proposed
--      as a new numbered CLAUDE.md convention at Phase B close-out.
--   5. meal_feedback — append-only positive-only signals. CHECK enforces
--      celebration-only at the schema layer (ruling 6): 'loved'|'liked'
--      are the ONLY legal values, no negative value exists in the enum.
--   6. meal_settings — one row per family (incl. standing_direction,
--      nutrition_direction, use_up_note — columns needed now even though
--      the suggestion engine consuming them is Phase B scope, since the
--      Food Profiles mom-only nutrition_direction editor is Phase A).
--   7. meal_pointers — "how WE do it" family know-how (D-42-6 rider).
--      Family-READABLE by every role, mom/grant-EDITABLE. CHECK enforces
--      exactly-one-of recipe_id / technique_tag.
--   8. embed pipeline: embedding column + HNSW index + queue trigger on
--      recipes only (100250-precedent — NULL-scan backfill, never
--      synchronous). embed Edge Function TABLE_CONFIG entry added
--      separately in supabase/functions/embed/index.ts (this migration
--      only touches SQL).
--   9. match_recipes RPC — single-table cosine-similarity search
--      (match_bookshelf_chunks precedent, migration 100066). NOT filtered
--      on is_included_in_ai (that gates LiLa context, not family search —
--      Convention #74/#75 distinction).
--  10. recipe-photos storage bucket (family_avatars-bucket precedent,
--      migration 100069).
--  11. util.has_meal_planning_grant(p_family_id) — family-wide binary grant
--      helper (studio/reward_rules/task_assignment shape, Convention #274).
--      'meal_planning' feature key registered + added to
--      apply_permission_profile's TWO exclusion lists (rewritten from the
--      CURRENT production body, migration 100264 — not a stale copy, per
--      the documented copy-stale-body failure mode) so a profile apply can
--      never wipe or silently create this explicit-grant-only key.
--  12. meals_basic / meals_ai_capture feature keys (feature_key_registry +
--      feature_access_v2, Essential tier per PRD §8.3).
--
-- Idempotent throughout.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. util.has_meal_planning_grant — family-wide binary grant helper
--    (studio / reward_rules / task_assignment shape, Convention #274).
--    Defined FIRST — every table's RLS below calls it.
-- ============================================================================

CREATE OR REPLACE FUNCTION util.has_meal_planning_grant(p_family_id UUID)
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
       AND mp.permission_key = 'meal_planning'
       AND mp.target_member_id IS NULL
       AND COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none') <> 'none'
  );
$$;

REVOKE ALL ON FUNCTION util.has_meal_planning_grant(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.has_meal_planning_grant(UUID) TO authenticated;

COMMENT ON FUNCTION util.has_meal_planning_grant IS
  'PRD-42 KitchenCompass: family-wide explicit-grant-only key (ruling 9, Convention #274 shape). Binary — any non-''none'' access_level counts as granted; ''manage'' is the canonical on-value written by the Permission Hub UI (BinaryGrantPicker). Mom herself never needs this — her RLS checks role=''primary_parent'' directly.';

-- ============================================================================
-- 1. recipes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recipes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by            UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,

  title                 TEXT NOT NULL,
  description           TEXT,

  source_type           TEXT NOT NULL DEFAULT 'manual'
                          CHECK (source_type IN ('link', 'photo', 'paste', 'went_well', 'manual', 'mindsweep')),
  source_url            TEXT,
  photo_urls            TEXT[] NOT NULL DEFAULT '{}',

  ingredients           JSONB NOT NULL DEFAULT '[]',
  instructions          JSONB NOT NULL DEFAULT '[]',

  prep_minutes          INTEGER,
  cook_minutes          INTEGER,
  total_minutes         INTEGER,
  servings_base         NUMERIC,

  effort_level          TEXT CHECK (effort_level IN ('quick', 'standard', 'project')),
  equipment_tags        TEXT[] NOT NULL DEFAULT '{}',
  tags                  TEXT[] NOT NULL DEFAULT '{}',
  tradition_tags        TEXT[] NOT NULL DEFAULT '{}',
  texture_flavor_tags   TEXT[] NOT NULL DEFAULT '{}',

  rotation              TEXT NOT NULL DEFAULT 'normal'
                          CHECK (rotation IN ('favorite', 'normal', 'rest', 'retired')),
  approval_status       TEXT NOT NULL DEFAULT 'approved'
                          CHECK (approval_status IN ('approved', 'suggested')),
  times_made            INTEGER NOT NULL DEFAULT 0,

  is_included_in_ai     BOOLEAN NOT NULL DEFAULT true,
  embedding             halfvec(1536),

  archived_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_family ON public.recipes (family_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON public.recipes (created_by);
CREATE INDEX IF NOT EXISTS idx_recipes_embedding
  ON public.recipes USING hnsw (embedding halfvec_cosine_ops);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- SELECT: family-shared, all roles (no kid-privacy affordance — standing
-- no-hiding-from-parents principle; ruling 8).
DO $$ BEGIN
  CREATE POLICY "recipes_select_family"
    ON public.recipes FOR SELECT
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: mom + additional_adult may insert with any approval_status.
-- Independent teens are FORCED to approval_status='suggested' at the WITH
-- CHECK layer (never trust the client). Guided/Play cannot insert at all —
-- neither branch below matches their role/dashboard_mode.
DO $$ BEGIN
  CREATE POLICY "recipes_insert_family"
    ON public.recipes FOR INSERT
    TO authenticated
    WITH CHECK (
      created_by IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      AND family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      AND (
        EXISTS (
          SELECT 1 FROM public.family_members fm
          WHERE fm.user_id = auth.uid() AND fm.id = created_by
            AND fm.role IN ('primary_parent', 'additional_adult')
        )
        OR (
          approval_status = 'suggested'
          AND EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.user_id = auth.uid() AND fm.id = created_by
              AND fm.dashboard_mode = 'independent'
          )
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UPDATE: mom + meal_planning grant (any change) OR the creator of a
-- still-'suggested' row (their own suggestion, before mom approves it —
-- WITH CHECK additionally forces NEW.approval_status to stay 'suggested'
-- so a teen can never self-approve).
DO $$ BEGIN
  CREATE POLICY "recipes_update_mom_grant_or_own_suggested"
    ON public.recipes FOR UPDATE
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      AND (
        EXISTS (
          SELECT 1 FROM public.family_members fm
          WHERE fm.user_id = auth.uid() AND fm.family_id = recipes.family_id
            AND fm.role = 'primary_parent'
        )
        OR util.has_meal_planning_grant(family_id)
        OR (
          approval_status = 'suggested'
          AND created_by IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
        )
      )
    )
    WITH CHECK (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      AND (
        EXISTS (
          SELECT 1 FROM public.family_members fm
          WHERE fm.user_id = auth.uid() AND fm.family_id = recipes.family_id
            AND fm.role = 'primary_parent'
        )
        OR util.has_meal_planning_grant(family_id)
        OR (
          approval_status = 'suggested'
          AND created_by IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "recipes_delete_mom_grant_or_own_suggested"
    ON public.recipes FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = recipes.family_id
          AND fm.role = 'primary_parent'
      )
      OR util.has_meal_planning_grant(family_id)
      OR (
        approval_status = 'suggested'
        AND created_by IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_recipes_updated_at ON public.recipes;
CREATE TRIGGER trg_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

DROP TRIGGER IF EXISTS trg_recipes_queue_embedding ON public.recipes;
CREATE TRIGGER trg_recipes_queue_embedding
  AFTER INSERT OR UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

COMMENT ON TABLE public.recipes IS
  'PRD-42 KitchenCompass: the family Recipe Box. Every insert goes through Human-in-the-Mix review client-side before it lands here (Convention #4) — nothing in this table is unreviewed AI output. Teen inserts forced to approval_status=''suggested'' at RLS (never trusted client-side).';
COMMENT ON COLUMN public.recipes.rotation IS
  'Mom''s quiet dial. ''retired'' is never surfaced to kids as such — no kid-facing surface in this platform ever shows a recipe as retired.';

-- ============================================================================
-- 2. recipe_versions — saved scaled/adapted versions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recipe_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  family_id     UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  scale_factor  NUMERIC,
  servings      NUMERIC,
  ingredients   JSONB NOT NULL DEFAULT '[]',
  notes         TEXT,
  created_by    UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipe_versions_recipe ON public.recipe_versions (recipe_id);

ALTER TABLE public.recipe_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "recipe_versions_select_family"
    ON public.recipe_versions FOR SELECT
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: any family member with real recipe access (mom/adult/teen — a
-- personal convenience save, not a plan-structure edit; guided/play have
-- no Recipe Box surface in Phase A so neither role reaches this).
DO $$ BEGIN
  CREATE POLICY "recipe_versions_insert_family"
    ON public.recipe_versions FOR INSERT
    TO authenticated
    WITH CHECK (
      created_by IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      AND family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.id = created_by
          AND (fm.role IN ('primary_parent', 'additional_adult') OR fm.dashboard_mode = 'independent')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "recipe_versions_update_own_or_mom"
    ON public.recipe_versions FOR UPDATE
    TO authenticated
    USING (
      created_by IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = recipe_versions.family_id
          AND fm.role = 'primary_parent'
      )
    )
    WITH CHECK (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "recipe_versions_delete_own_or_mom"
    ON public.recipe_versions FOR DELETE
    TO authenticated
    USING (
      created_by IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = recipe_versions.family_id
          AND fm.role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.recipe_versions IS
  'PRD-42 KitchenCompass: saved scaled/adapted snapshots of a recipe (e.g. "Double batch for co-op"). RLS mirrors recipes per PRD §5.2 — creator or mom can edit/delete.';

-- ============================================================================
-- 3. meal_plan_entries
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meal_plan_entries (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,

  entry_date               DATE NOT NULL,
  meal_slot                TEXT NOT NULL
                             CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack', 'custom')),
  custom_slot_label        TEXT,

  recipe_id                UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  recipe_version_id        UUID REFERENCES public.recipe_versions(id) ON DELETE SET NULL,
  title_snapshot            TEXT NOT NULL,

  status                   TEXT NOT NULL DEFAULT 'planned'
                             CHECK (status IN ('planned', 'made', 'skipped', 'moved')),
  made_at                  TIMESTAMPTZ,

  cook_member_id           UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  kids_helped_member_ids   UUID[] NOT NULL DEFAULT '{}',
  prep_task_id             UUID REFERENCES public.tasks(id) ON DELETE SET NULL,

  servings_planned         NUMERIC,
  notes                    TEXT,

  created_by               UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mpe_family_date ON public.meal_plan_entries (family_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_mpe_recipe ON public.meal_plan_entries (recipe_id);

ALTER TABLE public.meal_plan_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "mpe_select_family"
    ON public.meal_plan_entries FOR SELECT
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: mom + meal_planning grant only (plan structure). The field-scoped
-- BEFORE UPDATE trigger below is where "adults may mark-made without the
-- grant" actually lives — inserts are always a structural act (adding an
-- entry to the plan), so they stay grant-gated with no exception.
DO $$ BEGIN
  CREATE POLICY "mpe_insert_mom_or_grant"
    ON public.meal_plan_entries FOR INSERT
    TO authenticated
    WITH CHECK (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      AND (
        EXISTS (
          SELECT 1 FROM public.family_members fm
          WHERE fm.user_id = auth.uid() AND fm.family_id = meal_plan_entries.family_id
            AND fm.role = 'primary_parent'
        )
        OR util.has_meal_planning_grant(family_id)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UPDATE: broad USING clause (mom, grant, family-shadow, or any family
-- member) — the field-level restriction for non-full-edit actors is
-- enforced by the BEFORE UPDATE trigger below (RLS cannot express
-- column-level "these fields only" on its own).
DO $$ BEGIN
  CREATE POLICY "mpe_update_family_or_shadow"
    ON public.meal_plan_entries FOR UPDATE
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      OR util.is_family_shadow_of(family_id)
    )
    WITH CHECK (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      OR util.is_family_shadow_of(family_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "mpe_delete_mom_or_grant"
    ON public.meal_plan_entries FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = meal_plan_entries.family_id
          AND fm.role = 'primary_parent'
      )
      OR util.has_meal_planning_grant(family_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_mpe_updated_at ON public.meal_plan_entries;
CREATE TRIGGER trg_mpe_updated_at
  BEFORE UPDATE ON public.meal_plan_entries
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Field-scoped edit guard: mom / meal_planning-grant / a family-shadow
-- device may change anything. Everyone else (additional_adult without the
-- grant, or an independent teen) may only touch mark-made-shaped fields
-- (status/made_at/cook_member_id/kids_helped_member_ids/notes) — any
-- attempted change to a structural field (entry_date/meal_slot/
-- custom_slot_label/recipe_id/recipe_version_id/title_snapshot/
-- servings_planned/prep_task_id) is rejected. Teens are additionally
-- required to already be (or be volunteering as) the cook on the row —
-- "own-cook entries" per PRD §8.1.
CREATE OR REPLACE FUNCTION public.enforce_meal_plan_entry_edit_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor        RECORD;
  v_full_edit    BOOLEAN := false;
  v_structural   BOOLEAN;
BEGIN
  -- NOTE: the family-shadow identity IS a family_members row (role='family',
  -- Convention #273) so it is found here like any other actor. It never
  -- matches 'primary_parent'/'additional_adult'/dashboard_mode='independent'
  -- below, so it naturally falls through to the generic "mark-made fields
  -- only, no ownership check" bucket at the end of this function — exactly
  -- the desired behavior for a Hub tap-to-heart / mark-made from a family
  -- device (a family device is not "someone specific").
  SELECT fm.id, fm.role, fm.dashboard_mode
    INTO v_actor
    FROM public.family_members fm
   WHERE fm.user_id = auth.uid()
     AND fm.family_id = NEW.family_id
   LIMIT 1;

  IF v_actor.role = 'primary_parent' THEN
    v_full_edit := true;
  ELSIF v_actor.role = 'additional_adult' AND util.has_meal_planning_grant(NEW.family_id) THEN
    v_full_edit := true;
  END IF;

  IF v_full_edit THEN
    RETURN NEW;
  END IF;

  -- Structural fields must not change for a non-full-edit actor.
  v_structural := (
    NEW.entry_date          IS DISTINCT FROM OLD.entry_date OR
    NEW.meal_slot            IS DISTINCT FROM OLD.meal_slot OR
    NEW.custom_slot_label    IS DISTINCT FROM OLD.custom_slot_label OR
    NEW.recipe_id            IS DISTINCT FROM OLD.recipe_id OR
    NEW.recipe_version_id    IS DISTINCT FROM OLD.recipe_version_id OR
    NEW.title_snapshot       IS DISTINCT FROM OLD.title_snapshot OR
    NEW.servings_planned     IS DISTINCT FROM OLD.servings_planned OR
    NEW.prep_task_id         IS DISTINCT FROM OLD.prep_task_id
  );

  IF v_structural THEN
    RAISE EXCEPTION 'meal_plan_entries: structural edits require mom or the meal_planning grant';
  END IF;

  -- An independent teen may only touch entries they already cook or are
  -- volunteering to cook.
  IF v_actor.dashboard_mode = 'independent' THEN
    IF (OLD.cook_member_id IS DISTINCT FROM v_actor.id) AND (NEW.cook_member_id IS DISTINCT FROM v_actor.id) THEN
      RAISE EXCEPTION 'meal_plan_entries: teens may only update entries they are cooking';
    END IF;
    RETURN NEW;
  END IF;

  -- additional_adult without the grant, or any other authenticated family
  -- member reaching this row via RLS: mark-made fields only (already
  -- verified above), no further ownership restriction.
  IF v_actor.id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'meal_plan_entries: not permitted to update this entry';
END;
$$;

DROP TRIGGER IF EXISTS trg_mpe_enforce_edit_scope ON public.meal_plan_entries;
CREATE TRIGGER trg_mpe_enforce_edit_scope
  BEFORE UPDATE ON public.meal_plan_entries
  FOR EACH ROW EXECUTE FUNCTION public.enforce_meal_plan_entry_edit_scope();

COMMENT ON COLUMN public.meal_plan_entries.entry_date IS
  'User-chosen PLANNING date (future-facing) — deliberately EXEMPT from Convention #257 trigger derivation, it is not "today". All tonight/today reads route through family_today()/useFamilyToday per PRD-42 ruling 4.';
COMMENT ON FUNCTION public.enforce_meal_plan_entry_edit_scope IS
  'PRD-42 KitchenCompass: field-scoped edit guard. RLS alone cannot express "these columns only" — this trigger is where "adults mark-made without the grant" (PRD §8.1) is actually enforced.';

-- ============================================================================
-- 4. food_restrictions — hard-constraint table, always-include inversion
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.food_restrictions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id          UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id          UUID REFERENCES public.family_members(id) ON DELETE CASCADE,  -- NULL = whole-family rule

  restriction_type   TEXT NOT NULL
                       CHECK (restriction_type IN ('allergy', 'intolerance', 'medical_diet', 'religious', 'strong_dislike')),
  item               TEXT NOT NULL,
  severity           TEXT NOT NULL CHECK (severity IN ('life_threatening', 'avoid', 'limit')),
  notes              TEXT,

  created_by         UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_restrictions_family ON public.food_restrictions (family_id);
CREATE INDEX IF NOT EXISTS idx_food_restrictions_member ON public.food_restrictions (member_id);

ALTER TABLE public.food_restrictions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "food_restrictions_select_family"
    ON public.food_restrictions FOR SELECT
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "food_restrictions_insert_mom_or_grant"
    ON public.food_restrictions FOR INSERT
    TO authenticated
    WITH CHECK (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      AND (
        EXISTS (
          SELECT 1 FROM public.family_members fm
          WHERE fm.user_id = auth.uid() AND fm.family_id = food_restrictions.family_id
            AND fm.role = 'primary_parent'
        )
        OR util.has_meal_planning_grant(family_id)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "food_restrictions_update_mom_or_grant"
    ON public.food_restrictions FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = food_restrictions.family_id
          AND fm.role = 'primary_parent'
      )
      OR util.has_meal_planning_grant(family_id)
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = food_restrictions.family_id
          AND fm.role = 'primary_parent'
      )
      OR util.has_meal_planning_grant(family_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "food_restrictions_delete_mom_or_grant"
    ON public.food_restrictions FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = food_restrictions.family_id
          AND fm.role = 'primary_parent'
      )
      OR util.has_meal_planning_grant(family_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_food_restrictions_updated_at ON public.food_restrictions;
CREATE TRIGGER trg_food_restrictions_updated_at
  BEFORE UPDATE ON public.food_restrictions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

COMMENT ON TABLE public.food_restrictions IS
  'PRD-42 KitchenCompass: hard safety constraints (allergies/sensitivities/religious/medical diets). Deliberately has NO is_included_in_ai column — the ALWAYS-INCLUDE inversion (mirror image of Convention #76 Privacy Filtered): no toggle anywhere can remove a restriction from meal-AI context, and suggestion output is re-filtered against it as a second layer. Proposed as a new numbered CLAUDE.md convention at PRD-42 Phase B close-out.';

-- ============================================================================
-- 5. meal_feedback — append-only, positive-only signals
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meal_feedback (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  recipe_id             UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  meal_plan_entry_id    UUID REFERENCES public.meal_plan_entries(id) ON DELETE CASCADE,
  member_id             UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,

  feedback              TEXT NOT NULL CHECK (feedback IN ('loved', 'liked')),
  note                  TEXT,
  photo_url             TEXT,
  acted_by              UUID REFERENCES public.family_members(id) ON DELETE SET NULL,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_meal_feedback_entry_member
  ON public.meal_feedback (meal_plan_entry_id, member_id)
  WHERE meal_plan_entry_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meal_feedback_recipe ON public.meal_feedback (recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_feedback_family ON public.meal_feedback (family_id);

ALTER TABLE public.meal_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "meal_feedback_select_family"
    ON public.meal_feedback FOR SELECT
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: own-member, mom (on behalf of anyone), or a family-shadow
-- session (Hub tap-to-heart — Convention #276 pattern).
DO $$ BEGIN
  CREATE POLICY "meal_feedback_insert_own_mom_or_shadow"
    ON public.meal_feedback FOR INSERT
    TO authenticated
    WITH CHECK (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      AND (
        member_id IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.family_members fm
          WHERE fm.user_id = auth.uid() AND fm.family_id = meal_feedback.family_id
            AND fm.role = 'primary_parent'
        )
        OR util.is_family_shadow_of(family_id)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- No UPDATE policy — append-only signals (Convention #223 discipline).

DO $$ BEGIN
  CREATE POLICY "meal_feedback_delete_mom"
    ON public.meal_feedback FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = meal_feedback.family_id
          AND fm.role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.meal_feedback IS
  'PRD-42 KitchenCompass: kid hearts + mom''s "went well" notes/photos. CHECK enforces celebration-only at the SCHEMA layer — feedback IN (''loved'',''liked'') only, no negative value exists in the enum (PRD-42 ruling 6). Append-only: no UPDATE policy exists.';

-- ============================================================================
-- 6. meal_settings — one row per family
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meal_settings (
  family_id                     UUID PRIMARY KEY REFERENCES public.families(id) ON DELETE CASCADE,

  enabled_slots                 JSONB NOT NULL DEFAULT '["dinner"]',
  default_servings              NUMERIC,
  show_on_hub                   BOOLEAN NOT NULL DEFAULT true,
  kid_recipe_browsing           BOOLEAN NOT NULL DEFAULT false,
  prep_reminders_enabled        BOOLEAN NOT NULL DEFAULT true,
  prep_reminder_time            TIME NOT NULL DEFAULT '19:00',
  connection_prompts_enabled    BOOLEAN NOT NULL DEFAULT false,

  standing_direction            TEXT,
  nutrition_direction           TEXT,
  use_up_note                   JSONB,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "meal_settings_select_family"
    ON public.meal_settings FOR SELECT
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "meal_settings_insert_mom_or_grant"
    ON public.meal_settings FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = meal_settings.family_id
          AND fm.role = 'primary_parent'
      )
      OR util.has_meal_planning_grant(family_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "meal_settings_update_mom_or_grant"
    ON public.meal_settings FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = meal_settings.family_id
          AND fm.role = 'primary_parent'
      )
      OR util.has_meal_planning_grant(family_id)
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = meal_settings.family_id
          AND fm.role = 'primary_parent'
      )
      OR util.has_meal_planning_grant(family_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_meal_settings_updated_at ON public.meal_settings;
CREATE TRIGGER trg_meal_settings_updated_at
  BEFORE UPDATE ON public.meal_settings
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

COMMENT ON COLUMN public.meal_settings.nutrition_direction IS
  'D-42-3 rider: mom''s optional free-text nutrition/macro-flavored steer, in her own words. ALWAYS passed to meal-suggest context when set (Phase B); rendered ONLY on mom/granted-adult surfaces, NEVER on any kid-facing surface. No numbers, no tracking UI, ever.';
COMMENT ON COLUMN public.meal_settings.use_up_note IS
  'D-42-7 compromise (Phase B "Use it up" box): {text, updated_at}. Feeds suggestion context while fresh; consumer-side 14-day age-out.';

-- Auto-provision a default meal_settings row for every family (own trigger
-- — deliberately NOT folded into auto_provision_family_overview, to avoid
-- touching a shared function body concurrent sessions may also be editing).
CREATE OR REPLACE FUNCTION public.auto_provision_meal_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.meal_settings (family_id)
  VALUES (NEW.id)
  ON CONFLICT (family_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_provision_meal_settings ON public.families;
CREATE TRIGGER trg_auto_provision_meal_settings
  AFTER INSERT ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.auto_provision_meal_settings();

-- Backfill for existing families.
INSERT INTO public.meal_settings (family_id)
SELECT f.id FROM public.families f
ON CONFLICT (family_id) DO NOTHING;

-- ============================================================================
-- 7. meal_pointers — "how WE do it" family know-how (D-42-6 rider)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meal_pointers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  recipe_id        UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  technique_tag    TEXT,
  text             TEXT NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_by       UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT meal_pointers_exactly_one_target CHECK (
    (recipe_id IS NOT NULL)::int + (technique_tag IS NOT NULL AND technique_tag <> '')::int = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_meal_pointers_recipe ON public.meal_pointers (recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_pointers_technique ON public.meal_pointers (family_id, technique_tag);

ALTER TABLE public.meal_pointers ENABLE ROW LEVEL SECURITY;

-- SELECT: family-readable by EVERY role — the whole point is dad and the
-- kids can read them while cooking (D-42-6).
DO $$ BEGIN
  CREATE POLICY "meal_pointers_select_family"
    ON public.meal_pointers FOR SELECT
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "meal_pointers_insert_mom_or_grant"
    ON public.meal_pointers FOR INSERT
    TO authenticated
    WITH CHECK (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      AND (
        EXISTS (
          SELECT 1 FROM public.family_members fm
          WHERE fm.user_id = auth.uid() AND fm.family_id = meal_pointers.family_id
            AND fm.role = 'primary_parent'
        )
        OR util.has_meal_planning_grant(family_id)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "meal_pointers_update_mom_or_grant"
    ON public.meal_pointers FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = meal_pointers.family_id
          AND fm.role = 'primary_parent'
      )
      OR util.has_meal_planning_grant(family_id)
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = meal_pointers.family_id
          AND fm.role = 'primary_parent'
      )
      OR util.has_meal_planning_grant(family_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "meal_pointers_delete_mom_or_grant"
    ON public.meal_pointers FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.family_id = meal_pointers.family_id
          AND fm.role = 'primary_parent'
      )
      OR util.has_meal_planning_grant(family_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_meal_pointers_updated_at ON public.meal_pointers;
CREATE TRIGGER trg_meal_pointers_updated_at
  BEFORE UPDATE ON public.meal_pointers
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

COMMENT ON TABLE public.meal_pointers IS
  'PRD-42 KitchenCompass, D-42-6 founder rider: "how WE do it" family know-how. Family-READABLE by every role (dad/kids can read while cooking); mom/meal_planning-grant EDITABLE. Exactly one of recipe_id/technique_tag is set.';

-- ============================================================================
-- 9. meal_planning permission key registration + apply_permission_profile
--    exclusion (rewritten from the CURRENT production body, migration
--    100264 — not a stale copy)
-- ============================================================================

DO $$
DECLARE
  v_essential UUID;
BEGIN
  SELECT id INTO v_essential FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;
  IF v_essential IS NOT NULL THEN
    INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
    VALUES ('meal_planning', 'dad_adults', v_essential, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

INSERT INTO public.permission_level_profiles
  (role_group, level, feature_key, feature_enabled, default_permission_level)
SELECT 'dad_adults', lvl, 'meal_planning', false, 'none'
FROM unnest(ARRAY['light', 'balanced', 'maximum']) AS lvl
ON CONFLICT (role_group, level, feature_key) DO UPDATE
  SET feature_enabled = false, default_permission_level = 'none';

CREATE OR REPLACE FUNCTION public.apply_permission_profile(
  p_family_id UUID,
  p_member_id UUID,
  p_role_group TEXT,
  p_level TEXT
) RETURNS void AS $$
DECLARE
  v_mom_id UUID;
BEGIN
  SELECT id INTO v_mom_id
  FROM family_members
  WHERE family_id = p_family_id AND role = 'primary_parent' AND is_active = true
  LIMIT 1;

  -- Layer 2: reset toggles from profile
  DELETE FROM member_feature_toggles
  WHERE family_id = p_family_id AND member_id = p_member_id;

  INSERT INTO member_feature_toggles (
    family_id, member_id, feature_key, is_disabled, enabled,
    blocked_by_tier, applied_profile_level, disabled_by
  )
  SELECT
    p_family_id,
    p_member_id,
    plp.feature_key,
    NOT plp.feature_enabled,
    plp.feature_enabled,
    false,
    p_level,
    COALESCE(v_mom_id, p_member_id)
  FROM permission_level_profiles plp
  WHERE plp.role_group = p_role_group AND plp.level = p_level;

  -- Layer 3: reset per-kid grants from profile (adult roles only).
  -- EXPLICIT-GRANT-ONLY keys are never deleted nor created here — a profile
  -- reset must not wipe mom's finance/management/assignment/meal-planning
  -- grants (PERMISSIONS-WIRING 2026-06-09 + RR-DEPLOY-SCOPING 2026-06-10 +
  -- PRD-42 KitchenCompass 2026-07-07).
  -- settings_basic is personal-shaped and no longer gets per-kid rows.
  IF p_role_group IN ('dad_adults', 'special_adults') AND v_mom_id IS NOT NULL THEN
    DELETE FROM member_permissions
    WHERE family_id = p_family_id
      AND granted_to = p_member_id
      AND permission_key NOT IN ('financial_tracking', 'studio', 'reward_rules', 'task_assignment', 'meal_planning');

    INSERT INTO member_permissions (
      family_id, granting_member_id, granted_to, target_member_id,
      permission_key, access_level
    )
    SELECT
      p_family_id,
      v_mom_id,
      p_member_id,
      child.id,
      plp.feature_key,
      plp.default_permission_level
    FROM permission_level_profiles plp
    CROSS JOIN family_members child
    WHERE plp.role_group = p_role_group
      AND plp.level = p_level
      AND plp.feature_enabled = true
      AND plp.feature_key NOT IN ('settings_basic', 'financial_tracking', 'studio', 'reward_rules', 'task_assignment', 'meal_planning')
      AND child.family_id = p_family_id
      AND child.role = 'member'
      AND child.is_active = true
    ON CONFLICT (family_id, granted_to, target_member_id, permission_key) DO UPDATE
    SET access_level = EXCLUDED.access_level;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. meals_basic / meals_ai_capture feature keys
-- ============================================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('meals_basic', 'KitchenCompass — Recipes & Plan', 'Recipe Box, weekly meal plan, Cook View, Family Pointers, and shopping-list handoff.', 'PRD-42'),
  ('meals_ai_capture', 'KitchenCompass — AI Recipe Capture', 'Link/photo/paste/went-well AI recipe extraction with Human-in-the-Mix review.', 'PRD-42')
ON CONFLICT (feature_key) DO NOTHING;

DO $$
DECLARE
  v_essential UUID;
BEGIN
  SELECT id INTO v_essential FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;
  IF v_essential IS NOT NULL THEN
    INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
    VALUES
      ('meals_basic', 'mom', v_essential, true),
      ('meals_basic', 'dad_adults', v_essential, true),
      ('meals_basic', 'independent_teens', v_essential, true),
      ('meals_ai_capture', 'mom', v_essential, true),
      ('meals_ai_capture', 'dad_adults', v_essential, true),
      ('meals_ai_capture', 'independent_teens', v_essential, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 11. match_recipes RPC — single-table cosine-similarity search
--     (match_bookshelf_chunks precedent, migration 100066). NOT filtered on
--     is_included_in_ai — that gates LiLa context, not family search.
-- ============================================================================

CREATE OR REPLACE FUNCTION match_recipes(
  query_embedding halfvec(1536),
  p_family_id UUID,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  effort_level TEXT,
  total_minutes INTEGER,
  rotation TEXT,
  approval_status TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.effort_level,
    r.total_minutes,
    r.rotation,
    r.approval_status,
    1 - (r.embedding <=> query_embedding)::FLOAT AS similarity
  FROM recipes r
  WHERE r.family_id = p_family_id
    AND r.archived_at IS NULL
    AND r.embedding IS NOT NULL
    AND 1 - (r.embedding <=> query_embedding) > match_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

REVOKE ALL ON FUNCTION match_recipes(halfvec(1536), UUID, FLOAT, INT) FROM anon;
GRANT EXECUTE ON FUNCTION match_recipes(halfvec(1536), UUID, FLOAT, INT) TO authenticated;

-- ============================================================================
-- 12. recipe-photos storage bucket (family-avatars-bucket precedent,
--     migration 100069)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-photos', 'recipe-photos', true, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Family-scoped path prefix policy: storage path is `{family_id}/...`.
DO $$ BEGIN
  CREATE POLICY "recipe_photos_select_family"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'recipe-photos'
      AND (storage.foldername(name))[1] IN (
        SELECT fm.family_id::text FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "recipe_photos_insert_family"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'recipe-photos'
      AND (storage.foldername(name))[1] IN (
        SELECT fm.family_id::text FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "recipe_photos_delete_family"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'recipe-photos'
      AND (storage.foldername(name))[1] IN (
        SELECT fm.family_id::text FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 13. Verification
-- ============================================================================

DO $$
DECLARE
  v_tables INTEGER;
  v_bucket_ok BOOLEAN;
  v_rpc_ok BOOLEAN;
  v_feature_ok INTEGER;
  v_meal_settings_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tables
    FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('recipes', 'recipe_versions', 'meal_plan_entries', 'food_restrictions', 'meal_feedback', 'meal_settings', 'meal_pointers');
  IF v_tables <> 7 THEN
    RAISE EXCEPTION 'migration 100291: expected 7 new tables, found %', v_tables;
  END IF;

  SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'recipe-photos') INTO v_bucket_ok;
  IF NOT v_bucket_ok THEN
    RAISE EXCEPTION 'migration 100291: recipe-photos bucket missing';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'match_recipes'
  ) INTO v_rpc_ok;
  IF NOT v_rpc_ok THEN
    RAISE EXCEPTION 'migration 100291: match_recipes RPC missing';
  END IF;

  SELECT COUNT(*) INTO v_feature_ok
    FROM public.feature_key_registry WHERE feature_key IN ('meals_basic', 'meals_ai_capture');
  IF v_feature_ok <> 2 THEN
    RAISE EXCEPTION 'migration 100291: expected 2 feature keys, found %', v_feature_ok;
  END IF;

  SELECT COUNT(*) INTO v_meal_settings_rows FROM public.meal_settings;
  RAISE NOTICE 'migration 100291: all verification checks passed (7 tables, bucket, match_recipes, 2 feature keys, % meal_settings rows backfilled)', v_meal_settings_rows;
END $$;

COMMIT;
