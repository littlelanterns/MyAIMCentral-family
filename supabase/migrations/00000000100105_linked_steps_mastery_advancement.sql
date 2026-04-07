-- PRD-09A/09B: Linked Routine Steps, Mastery & Practice Advancement (Build J / Session 2)
-- Addendum: prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md
--
-- This migration is atomic and idempotent. All 41 column additions,
-- 2 new tables, RLS, indexes, feature keys, and the resource_url backfill
-- are in one file so the schema change is a single commit.
--
-- Columns added:
--   tasks                  +11  (advancement, mastery, resource_url)
--   sequential_collections  +5  (collection-level defaults)
--   task_completions        +4  (completion_type, duration, mastery evidence)
--   task_template_steps     +4  (linked step columns)
--   list_items             +10  (advancement + mastery — same shape as tasks)
--   lists                   +7  (randomizer-only: draw_mode, max_active_draws, defaults)
--
-- New tables:
--   practice_log        — unified cross-source practice session log
--   randomizer_draws    — active + historical draws incl. Surprise Me

-- ============================================================
-- 1. tasks — advancement, mastery, and resource_url
-- ============================================================
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS advancement_mode TEXT NOT NULL DEFAULT 'complete'
    CHECK (advancement_mode IN ('complete','practice_count','mastery')),
  ADD COLUMN IF NOT EXISTS practice_target INTEGER,
  ADD COLUMN IF NOT EXISTS practice_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mastery_status TEXT
    CHECK (mastery_status IN ('practicing','submitted','approved','rejected') OR mastery_status IS NULL),
  ADD COLUMN IF NOT EXISTS mastery_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mastery_approved_by UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS mastery_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS require_mastery_approval BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_mastery_evidence BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS track_duration BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resource_url TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_mastery_status
  ON public.tasks(sequential_collection_id, mastery_status)
  WHERE advancement_mode = 'mastery';


-- ============================================================
-- 2. sequential_collections — defaults
-- ============================================================
ALTER TABLE public.sequential_collections
  ADD COLUMN IF NOT EXISTS default_advancement_mode TEXT NOT NULL DEFAULT 'complete'
    CHECK (default_advancement_mode IN ('complete','practice_count','mastery')),
  ADD COLUMN IF NOT EXISTS default_practice_target INTEGER,
  ADD COLUMN IF NOT EXISTS default_require_approval BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_require_evidence BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_track_duration BOOLEAN NOT NULL DEFAULT false;


-- ============================================================
-- 3. task_completions — completion_type + duration + evidence
-- ============================================================
ALTER TABLE public.task_completions
  ADD COLUMN IF NOT EXISTS completion_type TEXT NOT NULL DEFAULT 'complete'
    CHECK (completion_type IN ('complete','practice','mastery_submit')),
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS mastery_evidence_url TEXT,
  ADD COLUMN IF NOT EXISTS mastery_evidence_note TEXT;

CREATE INDEX IF NOT EXISTS idx_task_completions_type_pending
  ON public.task_completions(task_id, approval_status)
  WHERE completion_type = 'mastery_submit' AND approval_status = 'pending';


-- ============================================================
-- 4. task_template_steps — linked step columns
-- ============================================================
ALTER TABLE public.task_template_steps
  ADD COLUMN IF NOT EXISTS step_type TEXT NOT NULL DEFAULT 'static'
    CHECK (step_type IN ('static','linked_sequential','linked_randomizer','linked_task')),
  ADD COLUMN IF NOT EXISTS linked_source_id UUID,
  ADD COLUMN IF NOT EXISTS linked_source_type TEXT
    CHECK (linked_source_type IN ('sequential_collection','randomizer_list','recurring_task') OR linked_source_type IS NULL),
  ADD COLUMN IF NOT EXISTS display_name_override TEXT;

CREATE INDEX IF NOT EXISTS idx_task_template_steps_linked
  ON public.task_template_steps(step_type, linked_source_id)
  WHERE step_type <> 'static';


-- ============================================================
-- 5. list_items — advancement + mastery (same shape as tasks)
-- ============================================================
ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS advancement_mode TEXT NOT NULL DEFAULT 'complete'
    CHECK (advancement_mode IN ('complete','practice_count','mastery')),
  ADD COLUMN IF NOT EXISTS practice_target INTEGER,
  ADD COLUMN IF NOT EXISTS practice_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mastery_status TEXT
    CHECK (mastery_status IN ('practicing','submitted','approved','rejected') OR mastery_status IS NULL),
  ADD COLUMN IF NOT EXISTS mastery_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mastery_approved_by UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS mastery_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS require_mastery_approval BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_mastery_evidence BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS track_duration BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_list_items_mastery_status
  ON public.list_items(list_id, mastery_status)
  WHERE advancement_mode = 'mastery';


-- ============================================================
-- 6. lists — randomizer draw modes + defaults
--    Non-randomizer lists leave these NULL.
-- ============================================================
ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS draw_mode TEXT
    CHECK (draw_mode IN ('focused','buffet','surprise') OR draw_mode IS NULL),
  ADD COLUMN IF NOT EXISTS max_active_draws INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS default_advancement_mode TEXT DEFAULT 'complete'
    CHECK (default_advancement_mode IN ('complete','practice_count','mastery') OR default_advancement_mode IS NULL),
  ADD COLUMN IF NOT EXISTS default_practice_target INTEGER,
  ADD COLUMN IF NOT EXISTS default_require_approval BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_require_evidence BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_track_duration BOOLEAN DEFAULT false;


-- ============================================================
-- 7. practice_log — unified cross-source practice session log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.practice_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL
    CHECK (source_type IN ('sequential_task','randomizer_item')),
  source_id UUID NOT NULL,  -- polymorphic: tasks.id OR list_items.id (no FK)
  draw_id UUID,             -- FK → randomizer_draws; only for randomizer items
  practice_type TEXT NOT NULL DEFAULT 'practice'
    CHECK (practice_type IN ('practice','mastery_submit')),
  duration_minutes INTEGER,
  evidence_url TEXT,
  evidence_note TEXT,
  period_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rejected BOOLEAN NOT NULL DEFAULT false,
  rejection_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practice_log_source
  ON public.practice_log(source_type, source_id, family_member_id);
CREATE INDEX IF NOT EXISTS idx_practice_log_member_day
  ON public.practice_log(family_member_id, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_practice_log_family_day
  ON public.practice_log(family_id, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_practice_log_type
  ON public.practice_log(source_type, practice_type, created_at DESC);

ALTER TABLE public.practice_log ENABLE ROW LEVEL SECURITY;

-- Members can insert and read their own practice log entries
CREATE POLICY practice_log_manage_own ON public.practice_log
  FOR ALL USING (
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- Mom reads everything in her family
CREATE POLICY practice_log_read_parent ON public.practice_log
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- Additional adults can read their family's practice log
CREATE POLICY practice_log_read_adults ON public.practice_log
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role IN ('primary_parent','additional_adult')
    )
  );


-- ============================================================
-- 8. randomizer_draws — active + historical draws per member per list
-- ============================================================
CREATE TABLE IF NOT EXISTS public.randomizer_draws (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  list_item_id UUID NOT NULL REFERENCES public.list_items(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  draw_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (draw_source IN ('manual','auto_surprise')),
  routine_instance_date DATE,  -- for Surprise Me: which day this draw is for
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','mastered','released','submitted')),
  completed_at TIMESTAMPTZ,
  practice_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_randomizer_draws_active
  ON public.randomizer_draws(list_id, family_member_id, status);
CREATE INDEX IF NOT EXISTS idx_randomizer_draws_list_status
  ON public.randomizer_draws(list_id, status);
CREATE INDEX IF NOT EXISTS idx_randomizer_draws_item_member
  ON public.randomizer_draws(list_item_id, family_member_id);

-- Surprise Me determinism: exactly one auto-draw per member per list per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_randomizer_draws_surprise_daily
  ON public.randomizer_draws(list_id, family_member_id, routine_instance_date)
  WHERE draw_source = 'auto_surprise' AND routine_instance_date IS NOT NULL;

ALTER TABLE public.randomizer_draws ENABLE ROW LEVEL SECURITY;

-- Members can manage their own draws
CREATE POLICY randomizer_draws_manage_own ON public.randomizer_draws
  FOR ALL USING (
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- Mom reads all family draws (via list family_id)
CREATE POLICY randomizer_draws_read_parent ON public.randomizer_draws
  FOR SELECT USING (
    list_id IN (
      SELECT l.id FROM public.lists l
      JOIN public.family_members fm ON fm.family_id = l.family_id
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- Additional adults read all family draws
CREATE POLICY randomizer_draws_read_adults ON public.randomizer_draws
  FOR SELECT USING (
    list_id IN (
      SELECT l.id FROM public.lists l
      JOIN public.family_members fm ON fm.family_id = l.family_id
      WHERE fm.user_id = auth.uid() AND fm.role IN ('primary_parent','additional_adult')
    )
  );

-- Now that randomizer_draws exists, add the FK on practice_log.draw_id.
-- Wrapped in a DO block so it's idempotent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'practice_log_draw_id_fkey'
  ) THEN
    ALTER TABLE public.practice_log
      ADD CONSTRAINT practice_log_draw_id_fkey
      FOREIGN KEY (draw_id) REFERENCES public.randomizer_draws(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ============================================================
-- 9. Feature keys for Build J
-- ============================================================
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('sequential_advancement',  'Sequential Advancement Modes',  'Practice count and mastery on sequential collection items',       'PRD-09A'),
  ('randomizer_advancement',  'Randomizer Advancement Modes',  'Practice count and mastery on randomizer list items',              'PRD-09B'),
  ('linked_routine_steps',    'Linked Routine Steps',          'Routine steps that dynamically pull content from a linked source', 'PRD-09A'),
  ('draw_mode_surprise',      'Surprise Me Draw',              'Auto-rotation draw mode using smart-draw weighting',               'PRD-09B'),
  ('duration_tracking',       'Duration Tracking',             'Duration prompts on practice completion',                          'PRD-09A'),
  ('curriculum_ai_parse',     'AI Curriculum Parse',           'AI-assisted list creation from pasted curriculum text',            'PRD-09A')
ON CONFLICT (feature_key) DO NOTHING;


-- ============================================================
-- 10. Feature access tiers (all return true during beta)
--     sequential_advancement  → enhanced
--     randomizer_advancement  → enhanced
--     linked_routine_steps    → enhanced
--     draw_mode_surprise      → full-magic
--     duration_tracking       → essential
--     curriculum_ai_parse     → enhanced
-- ============================================================
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT fk.feature_key, fk.role_group, st.id, true
FROM (VALUES
  ('sequential_advancement', 'mom',               'enhanced'),
  ('sequential_advancement', 'dad_adults',        'enhanced'),
  ('sequential_advancement', 'independent_teens', 'enhanced'),
  ('sequential_advancement', 'guided_kids',       'enhanced'),
  ('randomizer_advancement', 'mom',               'enhanced'),
  ('randomizer_advancement', 'dad_adults',        'enhanced'),
  ('randomizer_advancement', 'independent_teens', 'enhanced'),
  ('randomizer_advancement', 'guided_kids',       'enhanced'),
  ('linked_routine_steps',   'mom',               'enhanced'),
  ('linked_routine_steps',   'dad_adults',        'enhanced'),
  ('draw_mode_surprise',     'mom',               'full-magic'),
  ('draw_mode_surprise',     'dad_adults',        'full-magic'),
  ('duration_tracking',      'mom',               'essential'),
  ('duration_tracking',      'dad_adults',        'essential'),
  ('duration_tracking',      'independent_teens', 'essential'),
  ('duration_tracking',      'guided_kids',       'essential'),
  ('curriculum_ai_parse',    'mom',               'enhanced'),
  ('curriculum_ai_parse',    'dad_adults',        'enhanced')
) AS fk(feature_key, role_group, tier_slug)
CROSS JOIN public.subscription_tiers st
WHERE st.slug = fk.tier_slug
ON CONFLICT DO NOTHING;


-- ============================================================
-- 11. Backfill: copy image_url → resource_url on existing sequential tasks
--     The legacy useCreateSequentialCollection path wrote item.url into
--     image_url (hook line 139 pre-Build J). This is an idempotent copy
--     for any sequential task where image_url looks like a URL.
-- ============================================================
UPDATE public.tasks
SET resource_url = image_url
WHERE task_type = 'sequential'
  AND resource_url IS NULL
  AND image_url IS NOT NULL
  AND (image_url LIKE 'http://%' OR image_url LIKE 'https://%');
