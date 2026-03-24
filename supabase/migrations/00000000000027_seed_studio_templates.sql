-- ============================================================
-- Migration 027: Seed Studio Templates
-- PRD-09A + PRD-09B — Task templates, guided forms, list templates
-- Authoritative source: specs/studio-seed-templates.md
-- ============================================================
-- Idempotent: ON CONFLICT DO NOTHING throughout.
-- Safe to re-run at any time.
-- ============================================================

-- ============================================================
-- SECTION 1: Expand template_type CHECK on task_templates
-- Migration 023 added CHECK ('task','routine','opportunity_*','sequential','habit')
-- but did not include 'guided_form' or 'randomizer' which Studio requires.
-- ============================================================

ALTER TABLE public.task_templates
  DROP CONSTRAINT IF EXISTS task_templates_template_type_check;

ALTER TABLE public.task_templates
  ADD CONSTRAINT task_templates_template_type_check
  CHECK (template_type IN (
    'task',
    'routine',
    'opportunity_repeatable',
    'opportunity_claimable',
    'opportunity_capped',
    'sequential',
    'habit',
    'guided_form',
    'randomizer'
  ));

-- ============================================================
-- SECTION 1B: Fix RLS policies so system templates (family_id IS NULL)
-- are readable by all authenticated users.
--
-- Migration 008 created tt_select_family which requires family_id IN (...)
-- — this blocks NULL family_id rows entirely.
-- We replace it with a policy that also allows is_system_template = true.
--
-- task_template_sections and task_template_steps chain through template_id;
-- their policies will naturally allow system rows once the parent policy is fixed.
-- ============================================================

-- task_templates: allow system templates + family-scoped templates
DROP POLICY IF EXISTS "tt_select_family"    ON public.task_templates;
DROP POLICY IF EXISTS "tt_select_system"    ON public.task_templates;

CREATE POLICY "tt_select_system" ON public.task_templates
  FOR SELECT USING (
    is_system_template = true
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- task_template_sections: allow sections belonging to system templates
DROP POLICY IF EXISTS "tts_via_template"    ON public.task_template_sections;
DROP POLICY IF EXISTS "tts_via_template_v2" ON public.task_template_sections;

CREATE POLICY "tts_via_template_v2" ON public.task_template_sections
  FOR ALL USING (
    template_id IN (
      SELECT id FROM public.task_templates
      WHERE is_system_template = true
         OR family_id IN (
           SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
         )
    )
  );

-- task_template_steps: allow steps belonging to system template sections
DROP POLICY IF EXISTS "ttst_via_section"    ON public.task_template_steps;
DROP POLICY IF EXISTS "ttst_via_section_v2" ON public.task_template_steps;

CREATE POLICY "ttst_via_section_v2" ON public.task_template_steps
  FOR ALL USING (
    section_id IN (
      SELECT tts.id FROM public.task_template_sections tts
      JOIN public.task_templates tt ON tt.id = tts.template_id
      WHERE tt.is_system_template = true
         OR tt.family_id IN (
           SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
         )
    )
  );

-- ============================================================
-- SECTION 2: Add is_system_template and is_example to list_templates
-- live_schema.md confirms these columns do NOT yet exist.
-- ============================================================

ALTER TABLE public.list_templates
  ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_example         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS example_use_cases  TEXT[],
  ADD COLUMN IF NOT EXISTS category_label     TEXT;

-- Index for Studio browsing
CREATE INDEX IF NOT EXISTS idx_ltmpl_system_template ON public.list_templates(is_system_template) WHERE is_system_template = true;
CREATE INDEX IF NOT EXISTS idx_ltmpl_example         ON public.list_templates(is_example)         WHERE is_example = true;

-- ============================================================
-- SECTION 3: Backfill existing system list templates
-- Migration 024 seeded 7 list_templates with is_system=true.
-- Mark them is_system_template=true as well for Studio UI consistency.
-- ============================================================

UPDATE public.list_templates
  SET is_system_template = true
  WHERE is_system = true
    AND is_system_template = false;

-- ============================================================
-- SECTION 4: System task templates — blank formats (8 templates)
-- family_id=NULL, created_by=NULL (nullability unlocked in migration 024)
-- is_system=true, is_system_template=true, is_example=false
--
-- Idempotency: unique on (template_name, family_id IS NULL, is_system_template=true).
-- We use WHERE NOT EXISTS checks keyed on template_name + is_system_template.
-- ============================================================

-- ── 1. Simple Task ──────────────────────────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  config
)
SELECT
  NULL, NULL,
  'Simple Task', 'Simple Task',
  'A one-time or recurring task assigned to one or more family members. Add a name, optionally set a due date, reward, and completion approval. The most flexible format.',
  'task', 'task',
  true, true, false,
  ARRAY['Take out the trash','Return library books','Call the dentist','Help dad with yard work'],
  'task_chore',
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'Simple Task'
    AND is_system_template = true
    AND family_id IS NULL
);

-- ── 2. Routine Checklist ────────────────────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  config
)
SELECT
  NULL, NULL,
  'Routine Checklist', 'Routine Checklist',
  'Multi-step checklist with sections on different schedules — Daily, MWF, Weekly, or custom. Each section has its own frequency. Build once, deploy to any child. Resets fresh each period with no guilt carry-forward.',
  'routine', 'routine',
  true, true, false,
  ARRAY['Morning routine','Bedroom clean-up','Kitchen duties','After-school checklist','Bathroom deep clean'],
  'task_chore',
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'Routine Checklist'
    AND is_system_template = true
    AND family_id IS NULL
);

-- ── 3. Opportunity Board ────────────────────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  config
)
SELECT
  NULL, NULL,
  'Opportunity Board', 'Opportunity Board',
  'Optional jobs kids can browse and earn from. Each job has its own reward (dollars, stars, or both). Three sub-types: Claimable (first to claim, locked with timer, auto-releases), Repeatable (do it over and over, optional caps), Capped (limited total completions). Mom selects which family members can see each board.',
  'opportunity', 'opportunity_claimable',
  true, true, false,
  ARRAY['Extra House Jobs board','Ruthie''s practice tasks','Bonus school tasks','Summer earning opportunities'],
  'task_chore',
  '{"opportunity_subtype":"claimable","board_scope":"shared","claim_visibility":"show_names","completion_approval_required":true}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'Opportunity Board'
    AND is_system_template = true
    AND family_id IS NULL
);

-- ── 4. Sequential Collection ────────────────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  config
)
SELECT
  NULL, NULL,
  'Sequential Collection', 'Sequential Collection',
  'Ordered list of tasks that feeds one at a time. Task N+1 unlocks only when Task N is complete. Reuse year after year by deploying to new student.',
  'task', 'sequential',
  true, true, false,
  ARRAY['Math textbook chapters','YouTube tutorial series','Piano lesson progression','Nature study unit'],
  'task_chore',
  '{"sequential_active_count":1,"sequential_promotion":"immediate"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'Sequential Collection'
    AND is_system_template = true
    AND family_id IS NULL
);

-- ── 5. Guided Form (blank canvas) ───────────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  guided_form_subtype, guided_form_sections,
  config
)
SELECT
  NULL, NULL,
  'Guided Form', 'Guided Form',
  'Structured thinking worksheet mom assigns to a child. Mom defines sections, fills setup prompt, assigns. Child completes on dashboard. Mom reviews. LiLa assistance configurable (default OFF). Printable as paper worksheet.',
  'task', 'guided_form',
  true, true, false,
  ARRAY['Custom decision-making exercise','Goal reflection','Pre-trip planning form','Reading response questions'],
  'guided_form',
  'custom',
  '[]'::jsonb,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'Guided Form'
    AND is_system_template = true
    AND family_id IS NULL
);

-- ── 6. SODAS ────────────────────────────────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  guided_form_subtype, guided_form_sections,
  config
)
SELECT
  NULL, NULL,
  'SODAS', 'SODAS',
  'Gold standard structured thinking from Teaching Self-Government (Nicholeen Peck). Mom fills Situation. Child works through Options (3+) → Disadvantages (each option) → Advantages (each option, including bad choices) → Solution (best and why). More honest than pros/cons because it requires acknowledging advantages in every option.',
  'task', 'guided_form',
  true, true, false,
  ARRAY['Sibling conflict','What to do when angry','Spending birthday money','Friend situation'],
  'guided_form',
  'sodas',
  '[
    {"section_key":"situation",     "section_title":"Situation",     "section_prompt":"Describe the situation.",                                                  "filled_by":"mom",   "sort_order":1},
    {"section_key":"options",       "section_title":"Options",       "section_prompt":"List the options you are considering (at least 3).",                       "filled_by":"child", "sort_order":2},
    {"section_key":"disadvantages", "section_title":"Disadvantages", "section_prompt":"For each option, what are the drawbacks or challenges?",                   "filled_by":"child", "sort_order":3},
    {"section_key":"advantages",    "section_title":"Advantages",    "section_prompt":"For each option — including the bad ones — what are the good things?",     "filled_by":"child", "sort_order":4},
    {"section_key":"solution",      "section_title":"Solution",      "section_prompt":"Based on your thinking, what is your best solution and why?",              "filled_by":"child", "sort_order":5}
  ]'::jsonb,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'SODAS'
    AND is_system_template = true
    AND family_id IS NULL
);

-- ── 7. What-If Game ─────────────────────────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  guided_form_subtype, guided_form_sections,
  config
)
SELECT
  NULL, NULL,
  'What-If Game', 'What-If Game',
  'Lighter, faster version of SODAS for pre-teaching before situations arise. Mom poses scenario, child thinks it through before they''re in the heat of the moment. From Teaching Self-Government. Works for kids as young as Guided shell age.',
  'task', 'guided_form',
  true, true, false,
  ARRAY['Friend asking to do something wrong','Someone mean at co-op','Finished work early','Feeling angry at sibling'],
  'guided_form',
  'what_if',
  '[
    {"section_key":"scenario",         "section_title":"The Scenario",       "section_prompt":"Describe the what-if situation.",                              "filled_by":"mom",   "sort_order":1},
    {"section_key":"options",          "section_title":"My Options",         "section_prompt":"What could you do in this situation?",                         "filled_by":"child", "sort_order":2},
    {"section_key":"what_might_happen","section_title":"What Might Happen",  "section_prompt":"For each option, what might happen as a result?",              "filled_by":"child", "sort_order":3},
    {"section_key":"what_i_would_do",  "section_title":"What I Would Do",    "section_prompt":"Which option would you choose and why?",                       "filled_by":"child", "sort_order":4},
    {"section_key":"what_i_learned",   "section_title":"What I Learned",     "section_prompt":"What did you learn from thinking this through?",               "filled_by":"child", "sort_order":5}
  ]'::jsonb,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'What-If Game'
    AND is_system_template = true
    AND family_id IS NULL
);

-- ── 8. Apology Reflection ───────────────────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  guided_form_subtype, guided_form_sections,
  config
)
SELECT
  NULL, NULL,
  'Apology Reflection', 'Apology Reflection',
  'Deeper than "say sorry." Child thinks through what happened, who was affected, why it mattered, what they''d do differently, how to make it right. Restorative tone, not punitive. Mom reviews and uses as springboard for conversation.',
  'task', 'guided_form',
  true, true, false,
  ARRAY['After a sibling fight','When a rule was broken','After a hurtful comment','Any conflict needing repair'],
  'guided_form',
  'apology_reflection',
  '[
    {"section_key":"what_happened",        "section_title":"What Happened",              "section_prompt":"In your own words, describe what happened.",                           "filled_by":"child", "sort_order":1},
    {"section_key":"who_was_affected",     "section_title":"Who Was Affected and How",   "section_prompt":"Who was hurt or affected by what happened, and how did it affect them?","filled_by":"child", "sort_order":2},
    {"section_key":"why_it_mattered",      "section_title":"Why It Mattered",            "section_prompt":"Why do you think this mattered to them?",                             "filled_by":"child", "sort_order":3},
    {"section_key":"what_i_wish",          "section_title":"What I Wish I''d Done",      "section_prompt":"Looking back, what would you do differently?",                        "filled_by":"child", "sort_order":4},
    {"section_key":"make_it_right",        "section_title":"How I Want to Make It Right","section_prompt":"What could you do to help repair the situation?",                     "filled_by":"child", "sort_order":5},
    {"section_key":"what_i_remember",      "section_title":"What I Want to Remember",    "section_prompt":"What is one thing you want to carry with you from this?",             "filled_by":"child", "sort_order":6}
  ]'::jsonb,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'Apology Reflection'
    AND is_system_template = true
    AND family_id IS NULL
);

-- ============================================================
-- SECTION 5: Example task templates (is_example=true)
-- Seeded with real content from the spec.
-- Sections/steps for routines stored in task_template_sections
-- and task_template_steps after inserting the parent.
-- ============================================================

-- ── Example 1: Morning Routine ──────────────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  config
)
SELECT
  NULL, NULL,
  'Morning Routine', 'Morning Routine',
  'A ready-to-use morning routine with three sections: Every Morning (6 steps for daily basics), School Days Only (3 steps for school-specific prep), and Every Sunday (2 steps for weekly reset). Customize steps and schedules for your child.',
  'routine', 'routine',
  true, true, true,
  ARRAY['Brush teeth & wash face','Make bed','Get dressed','Breakfast','Pack backpack'],
  'task_chore',
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'Morning Routine'
    AND is_example = true
    AND family_id IS NULL
);

-- Sections and steps for Morning Routine
-- We use CTEs to get the template id, then insert sections, then steps.
DO $$
DECLARE
  v_template_id   UUID;
  v_section1_id   UUID;
  v_section2_id   UUID;
  v_section3_id   UUID;
BEGIN
  SELECT id INTO v_template_id
  FROM public.task_templates
  WHERE template_name = 'Morning Routine'
    AND is_example = true
    AND family_id IS NULL
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RETURN; -- Template not found; skip (should not happen)
  END IF;

  -- Section 1: Every Morning
  IF NOT EXISTS (
    SELECT 1 FROM public.task_template_sections
    WHERE template_id = v_template_id AND title = 'Every Morning'
  ) THEN
    INSERT INTO public.task_template_sections (template_id, title, section_name, sort_order)
    VALUES (v_template_id, 'Every Morning', 'Every Morning', 1)
    RETURNING id INTO v_section1_id;

    INSERT INTO public.task_template_steps (section_id, title, step_name, sort_order) VALUES
      (v_section1_id, 'Wake up and make bed', 'Wake up and make bed', 1),
      (v_section1_id, 'Brush teeth and wash face', 'Brush teeth and wash face', 2),
      (v_section1_id, 'Get dressed', 'Get dressed', 3),
      (v_section1_id, 'Eat breakfast', 'Eat breakfast', 4),
      (v_section1_id, 'Put dishes away', 'Put dishes away', 5),
      (v_section1_id, 'Personal devotions / quiet time', 'Personal devotions / quiet time', 6);
  END IF;

  -- Section 2: School Days Only
  IF NOT EXISTS (
    SELECT 1 FROM public.task_template_sections
    WHERE template_id = v_template_id AND title = 'School Days Only'
  ) THEN
    INSERT INTO public.task_template_sections (template_id, title, section_name, sort_order)
    VALUES (v_template_id, 'School Days Only', 'School Days Only', 2)
    RETURNING id INTO v_section2_id;

    INSERT INTO public.task_template_steps (section_id, title, step_name, sort_order) VALUES
      (v_section2_id, 'Pack backpack', 'Pack backpack', 1),
      (v_section2_id, 'Review today''s schedule', 'Review today''s schedule', 2),
      (v_section2_id, 'Get to school on time', 'Get to school on time', 3);
  END IF;

  -- Section 3: Every Sunday
  IF NOT EXISTS (
    SELECT 1 FROM public.task_template_sections
    WHERE template_id = v_template_id AND title = 'Every Sunday'
  ) THEN
    INSERT INTO public.task_template_sections (template_id, title, section_name, sort_order)
    VALUES (v_template_id, 'Every Sunday', 'Every Sunday', 3)
    RETURNING id INTO v_section3_id;

    INSERT INTO public.task_template_steps (section_id, title, step_name, sort_order) VALUES
      (v_section3_id, 'Pick out clothes for the week', 'Pick out clothes for the week', 1),
      (v_section3_id, 'Prep school bag', 'Prep school bag', 2);
  END IF;

END $$;

-- ── Example 2: Bedroom Clean-Up ─────────────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  config
)
SELECT
  NULL, NULL,
  'Bedroom Clean-Up', 'Bedroom Clean-Up',
  'A tiered bedroom cleaning routine. Daily tasks keep the basics tidy, weekly deep-clean steps show until complete before rotating to the next day, and monthly tasks tackle the deeper organization.',
  'routine', 'routine',
  true, true, true,
  ARRAY['Pick up floor','Make bed','Wipe down surfaces','Vacuum','Organize closet'],
  'task_chore',
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'Bedroom Clean-Up'
    AND is_example = true
    AND family_id IS NULL
);

DO $$
DECLARE
  v_template_id  UUID;
  v_section1_id  UUID;
  v_section2_id  UUID;
  v_section3_id  UUID;
BEGIN
  SELECT id INTO v_template_id
  FROM public.task_templates
  WHERE template_name = 'Bedroom Clean-Up'
    AND is_example = true
    AND family_id IS NULL
  LIMIT 1;

  IF v_template_id IS NULL THEN RETURN; END IF;

  -- Section 1: Daily
  IF NOT EXISTS (
    SELECT 1 FROM public.task_template_sections
    WHERE template_id = v_template_id AND title = 'Daily'
  ) THEN
    INSERT INTO public.task_template_sections (template_id, title, section_name, sort_order)
    VALUES (v_template_id, 'Daily', 'Daily', 1)
    RETURNING id INTO v_section1_id;

    INSERT INTO public.task_template_steps (section_id, title, step_name, sort_order) VALUES
      (v_section1_id, 'Pick up floor and put things away', 'Pick up floor and put things away', 1),
      (v_section1_id, 'Make bed', 'Make bed', 2),
      (v_section1_id, 'Put dirty clothes in hamper', 'Put dirty clothes in hamper', 3);
  END IF;

  -- Section 2: Weekly (show until complete)
  IF NOT EXISTS (
    SELECT 1 FROM public.task_template_sections
    WHERE template_id = v_template_id AND title = 'Weekly'
  ) THEN
    INSERT INTO public.task_template_sections (template_id, title, section_name, sort_order)
    VALUES (v_template_id, 'Weekly', 'Weekly', 2)
    RETURNING id INTO v_section2_id;

    INSERT INTO public.task_template_steps (section_id, title, step_name, sort_order) VALUES
      (v_section2_id, 'Vacuum floor', 'Vacuum floor', 1),
      (v_section2_id, 'Wipe down surfaces', 'Wipe down surfaces', 2),
      (v_section2_id, 'Clean mirror and windows', 'Clean mirror and windows', 3),
      (v_section2_id, 'Empty trash can', 'Empty trash can', 4);
  END IF;

  -- Section 3: Monthly
  IF NOT EXISTS (
    SELECT 1 FROM public.task_template_sections
    WHERE template_id = v_template_id AND title = 'Monthly'
  ) THEN
    INSERT INTO public.task_template_sections (template_id, title, section_name, sort_order)
    VALUES (v_template_id, 'Monthly', 'Monthly', 3)
    RETURNING id INTO v_section3_id;

    INSERT INTO public.task_template_steps (section_id, title, step_name, sort_order) VALUES
      (v_section3_id, 'Organize closet and drawers', 'Organize closet and drawers', 1),
      (v_section3_id, 'Rotate seasonal items', 'Rotate seasonal items', 2),
      (v_section3_id, 'Deep clean under bed', 'Deep clean under bed', 3),
      (v_section3_id, 'Donate or discard unused items', 'Donate or discard unused items', 4);
  END IF;

END $$;

-- ── Example 3: Extra House Jobs Board ───────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  config
)
SELECT
  NULL, NULL,
  'Extra House Jobs Board', 'Extra House Jobs Board',
  'A ready-to-use Claimable Opportunity Board with 8 real chore jobs ($1–$3 per job, 30-min to 3-hr locks) and 2 connection items (5 stars, repeatable, no lock). Mix of quick, medium, big, and connection categories. Shows kids what they can earn and lets them pick what fits their day.',
  'opportunity', 'opportunity_claimable',
  true, true, true,
  ARRAY['Vacuum living room ($1, 30 min)','Deep clean bathroom ($3, 2 hr)','Help with dinner ($1.50)','Write a letter to grandma (5 stars)'],
  'task_chore',
  '{
    "opportunity_subtype": "claimable",
    "board_scope": "shared",
    "claim_visibility": "show_names",
    "completion_approval_required": true,
    "jobs": [
      {"job_name": "Vacuum living room",           "reward_dollars": 1.00, "reward_stars": null, "claim_lock_duration": "30 minutes", "category": "quick",      "is_repeatable": false, "sort_order": 1},
      {"job_name": "Sweep and mop kitchen floor",  "reward_dollars": 1.50, "reward_stars": null, "claim_lock_duration": "45 minutes", "category": "quick",      "is_repeatable": false, "sort_order": 2},
      {"job_name": "Wipe down kitchen counters",   "reward_dollars": 1.00, "reward_stars": null, "claim_lock_duration": "30 minutes", "category": "quick",      "is_repeatable": false, "sort_order": 3},
      {"job_name": "Help with dinner prep",        "reward_dollars": 1.50, "reward_stars": null, "claim_lock_duration": "1 hour",     "category": "medium",     "is_repeatable": false, "sort_order": 4},
      {"job_name": "Clean both bathrooms",         "reward_dollars": 3.00, "reward_stars": null, "claim_lock_duration": "2 hours",    "category": "big",        "is_repeatable": false, "sort_order": 5},
      {"job_name": "Fold and put away laundry",    "reward_dollars": 2.00, "reward_stars": null, "claim_lock_duration": "1 hour",     "category": "medium",     "is_repeatable": false, "sort_order": 6},
      {"job_name": "Wash windows (inside)",        "reward_dollars": 2.00, "reward_stars": null, "claim_lock_duration": "1 hour",     "category": "medium",     "is_repeatable": false, "sort_order": 7},
      {"job_name": "Deep clean the garage area",   "reward_dollars": 3.00, "reward_stars": null, "claim_lock_duration": "3 hours",    "category": "big",        "is_repeatable": false, "sort_order": 8},
      {"job_name": "Write a letter to grandma",    "reward_dollars": null, "reward_stars": 5,    "claim_lock_duration": null,         "category": "connection", "is_repeatable": true,  "sort_order": 9},
      {"job_name": "Read aloud to a younger sibling","reward_dollars": null,"reward_stars": 5,   "claim_lock_duration": null,         "category": "connection", "is_repeatable": true,  "sort_order": 10}
    ]
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'Extra House Jobs Board'
    AND is_example = true
    AND family_id IS NULL
);

-- ── Example 4: Curriculum Chapter Sequence ──────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  config
)
SELECT
  NULL, NULL,
  'Curriculum Chapter Sequence', 'Curriculum Chapter Sequence',
  'A ready-to-use sequential collection with 5 sample chapters demonstrating auto-advance on completion and weekday-only scheduling. Perfect template starting point for any textbook or tutorial series.',
  'task', 'sequential',
  true, true, true,
  ARRAY['Math curriculum chapters','History unit lessons','Language arts program','Science textbook sections'],
  'task_chore',
  '{
    "sequential_active_count": 1,
    "sequential_promotion": "immediate",
    "schedule_weekdays_only": true,
    "items": [
      {"title": "Chapter 1 — Introduction",    "description": "Read and complete exercises for Chapter 1.", "sort_order": 1},
      {"title": "Chapter 2 — Core Concepts",   "description": "Read and complete exercises for Chapter 2.", "sort_order": 2},
      {"title": "Chapter 3 — Application",     "description": "Read and complete exercises for Chapter 3.", "sort_order": 3},
      {"title": "Chapter 4 — Practice",        "description": "Read and complete exercises for Chapter 4.", "sort_order": 4},
      {"title": "Chapter 5 — Review & Test",   "description": "Complete chapter review and unit test.",     "sort_order": 5}
    ]
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'Curriculum Chapter Sequence'
    AND is_example = true
    AND family_id IS NULL
);

-- ── Example 5: SODAS Sibling Conflict ───────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  guided_form_subtype, guided_form_sections,
  config
)
SELECT
  NULL, NULL,
  'SODAS Sibling Conflict', 'SODAS Sibling Conflict',
  'A ready-to-assign SODAS worksheet with the Situation section pre-filled. Child sections are blank for their independent thinking.',
  'task', 'guided_form',
  true, true, true,
  ARRAY['Sibling argument','Conflict over shared space','Taking each other''s things'],
  'guided_form',
  'sodas',
  '[
    {"section_key":"situation",     "section_title":"Situation",     "section_prompt":"Describe the situation.",                                                "filled_by":"mom",   "prefill_content":"Yesterday you and your sibling had a disagreement. Let''s think it through together so we can understand what happened and figure out what to do next. Take your time — there are no wrong answers here.", "sort_order":1},
    {"section_key":"options",       "section_title":"Options",       "section_prompt":"List the options you are considering (at least 3).",                     "filled_by":"child", "sort_order":2},
    {"section_key":"disadvantages", "section_title":"Disadvantages", "section_prompt":"For each option, what are the drawbacks or challenges?",                 "filled_by":"child", "sort_order":3},
    {"section_key":"advantages",    "section_title":"Advantages",    "section_prompt":"For each option — including the bad ones — what are the good things?",   "filled_by":"child", "sort_order":4},
    {"section_key":"solution",      "section_title":"Solution",      "section_prompt":"Based on your thinking, what is your best solution and why?",            "filled_by":"child", "sort_order":5}
  ]'::jsonb,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'SODAS Sibling Conflict'
    AND is_example = true
    AND family_id IS NULL
);

-- ── Example 6: What-If: Friend Pressure ─────────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  guided_form_subtype, guided_form_sections,
  config
)
SELECT
  NULL, NULL,
  'What-If: Friend Pressure', 'What-If: Friend Pressure',
  'A ready-to-assign What-If Game with a scenario about peer pressure pre-filled. Child sections are blank for their thinking.',
  'task', 'guided_form',
  true, true, true,
  ARRAY['Peer pressure discussion','Saying no to friends','Making wise choices'],
  'guided_form',
  'what_if',
  '[
    {"section_key":"scenario",          "section_title":"The Scenario",       "section_prompt":"Describe the what-if situation.",                             "filled_by":"mom",   "prefill_content":"Imagine a friend dares you to do something you know isn''t right — maybe taking something that doesn''t belong to you, or going somewhere you''re not supposed to go. What would you do?", "sort_order":1},
    {"section_key":"options",           "section_title":"My Options",         "section_prompt":"What could you do in this situation?",                        "filled_by":"child", "sort_order":2},
    {"section_key":"what_might_happen", "section_title":"What Might Happen",  "section_prompt":"For each option, what might happen as a result?",             "filled_by":"child", "sort_order":3},
    {"section_key":"what_i_would_do",   "section_title":"What I Would Do",    "section_prompt":"Which option would you choose and why?",                      "filled_by":"child", "sort_order":4},
    {"section_key":"what_i_learned",    "section_title":"What I Learned",     "section_prompt":"What did you learn from thinking this through?",              "filled_by":"child", "sort_order":5}
  ]'::jsonb,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'What-If: Friend Pressure'
    AND is_example = true
    AND family_id IS NULL
);

-- ── Example 7: Apology Reflection (General) ─────────────────

INSERT INTO public.task_templates (
  family_id, created_by,
  title, template_name, description,
  task_type, template_type,
  is_system, is_system_template, is_example,
  example_use_cases, category_label,
  guided_form_subtype, guided_form_sections,
  config
)
SELECT
  NULL, NULL,
  'Apology Reflection (General)', 'Apology Reflection (General)',
  'A ready-to-assign Apology Reflection with a warm intro note pre-filled. Restorative framing that invites reflection rather than shame. Child sections are blank.',
  'task', 'guided_form',
  true, true, true,
  ARRAY['After any conflict','When trust was broken','After hurtful words'],
  'guided_form',
  'apology_reflection',
  '[
    {"section_key":"intro_note",           "section_title":"A Note from Mom",            "section_prompt":"",                                                                                "filled_by":"mom",   "prefill_content":"I''m not asking you to do this as punishment — I''m asking because I believe you are a good person who is capable of making things right. Take your time, be honest, and know that I love you through all of it.", "sort_order":0, "display_only":true},
    {"section_key":"what_happened",        "section_title":"What Happened",              "section_prompt":"In your own words, describe what happened.",                                       "filled_by":"child", "sort_order":1},
    {"section_key":"who_was_affected",     "section_title":"Who Was Affected and How",   "section_prompt":"Who was hurt or affected by what happened, and how did it affect them?",           "filled_by":"child", "sort_order":2},
    {"section_key":"why_it_mattered",      "section_title":"Why It Mattered",            "section_prompt":"Why do you think this mattered to them?",                                         "filled_by":"child", "sort_order":3},
    {"section_key":"what_i_wish",          "section_title":"What I Wish I''d Done",      "section_prompt":"Looking back, what would you do differently?",                                    "filled_by":"child", "sort_order":4},
    {"section_key":"make_it_right",        "section_title":"How I Want to Make It Right","section_prompt":"What could you do to help repair the situation?",                                 "filled_by":"child", "sort_order":5},
    {"section_key":"what_i_remember",      "section_title":"What I Want to Remember",    "section_prompt":"What is one thing you want to carry with you from this?",                         "filled_by":"child", "sort_order":6}
  ]'::jsonb,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_templates
  WHERE template_name = 'Apology Reflection (General)'
    AND is_example = true
    AND family_id IS NULL
);

-- ============================================================
-- SECTION 6: Example list templates (is_example=true)
-- Uses WHERE NOT EXISTS keyed on (title, is_example, family_id IS NULL).
-- ============================================================

-- ── Example List 1: Weekly Grocery List ─────────────────────

INSERT INTO public.list_templates (
  family_id, created_by,
  template_name, title, description,
  list_type, default_items,
  is_system, is_system_template, is_example,
  example_use_cases, category_label
)
SELECT
  NULL, NULL,
  'Weekly Grocery List', 'Weekly Grocery List',
  'A ready-to-use shopping list with 7 category sections. Pre-filled with common items to get you started. Customize sections and items for your family''s habits.',
  'shopping',
  '[
    {"item_name":"— Produce —",             "section_name":"Produce",    "is_section_header":true},
    {"item_name":"Apples",                  "section_name":"Produce",    "quantity":6,  "quantity_unit":"ct"},
    {"item_name":"Bananas",                 "section_name":"Produce",    "quantity":1,  "quantity_unit":"bunch"},
    {"item_name":"Salad greens",            "section_name":"Produce",    "quantity":1,  "quantity_unit":"bag"},
    {"item_name":"Broccoli",                "section_name":"Produce"},
    {"item_name":"— Dairy & Eggs —",        "section_name":"Dairy",      "is_section_header":true},
    {"item_name":"Milk",                    "section_name":"Dairy",      "quantity":1,  "quantity_unit":"gallon"},
    {"item_name":"Eggs",                    "section_name":"Dairy",      "quantity":1,  "quantity_unit":"dozen"},
    {"item_name":"Shredded cheese",         "section_name":"Dairy",      "quantity":2,  "quantity_unit":"cups"},
    {"item_name":"Butter",                  "section_name":"Dairy",      "quantity":1,  "quantity_unit":"lb"},
    {"item_name":"— Meat & Protein —",      "section_name":"Meat",       "is_section_header":true},
    {"item_name":"Chicken breast",          "section_name":"Meat",       "quantity":2,  "quantity_unit":"lbs"},
    {"item_name":"Ground beef",             "section_name":"Meat",       "quantity":1,  "quantity_unit":"lb"},
    {"item_name":"— Pantry —",              "section_name":"Pantry",     "is_section_header":true},
    {"item_name":"Pasta",                   "section_name":"Pantry",     "quantity":2,  "quantity_unit":"boxes"},
    {"item_name":"Canned tomatoes",         "section_name":"Pantry",     "quantity":2,  "quantity_unit":"cans"},
    {"item_name":"Olive oil",               "section_name":"Pantry"},
    {"item_name":"— Frozen —",              "section_name":"Frozen",     "is_section_header":true},
    {"item_name":"Frozen peas",             "section_name":"Frozen",     "quantity":1,  "quantity_unit":"bag"},
    {"item_name":"Frozen waffles",          "section_name":"Frozen"},
    {"item_name":"— Household —",           "section_name":"Household",  "is_section_header":true},
    {"item_name":"Paper towels",            "section_name":"Household"},
    {"item_name":"Dish soap",               "section_name":"Household"},
    {"item_name":"Laundry detergent",       "section_name":"Household"},
    {"item_name":"— Other —",               "section_name":"Other",      "is_section_header":true}
  ]'::jsonb,
  true, true, true,
  ARRAY['Weekly grocery run','Costco trip','Farmer''s market'],
  'list'
WHERE NOT EXISTS (
  SELECT 1 FROM public.list_templates
  WHERE title = 'Weekly Grocery List'
    AND is_example = true
    AND family_id IS NULL
);

-- ── Example List 2: Family Road Trip Packing ────────────────

INSERT INTO public.list_templates (
  family_id, created_by,
  template_name, title, description,
  list_type, default_items,
  is_system, is_system_template, is_example,
  example_use_cases, category_label
)
SELECT
  NULL, NULL,
  'Family Road Trip Packing', 'Family Road Trip Packing',
  'A ready-to-use road trip packing list with 5 categories. Pre-filled with common items. Share with the whole family before departure.',
  'packing',
  '[
    {"item_name":"— Clothing —",               "section_name":"Clothing",      "is_section_header":true},
    {"item_name":"T-shirts (per person × days)","section_name":"Clothing"},
    {"item_name":"Pants / shorts",             "section_name":"Clothing"},
    {"item_name":"Underwear & socks",          "section_name":"Clothing"},
    {"item_name":"Pajamas",                    "section_name":"Clothing"},
    {"item_name":"Shoes (2 pairs)",            "section_name":"Clothing"},
    {"item_name":"Swimwear",                   "section_name":"Clothing"},
    {"item_name":"Light jacket or hoodie",     "section_name":"Clothing"},
    {"item_name":"— Toiletries —",             "section_name":"Toiletries",    "is_section_header":true},
    {"item_name":"Toothbrushes & toothpaste",  "section_name":"Toiletries"},
    {"item_name":"Shampoo & conditioner",      "section_name":"Toiletries"},
    {"item_name":"Deodorant",                  "section_name":"Toiletries"},
    {"item_name":"Sunscreen",                  "section_name":"Toiletries"},
    {"item_name":"Medications",                "section_name":"Toiletries"},
    {"item_name":"— Electronics —",            "section_name":"Electronics",   "is_section_header":true},
    {"item_name":"Phone chargers",             "section_name":"Electronics"},
    {"item_name":"Headphones",                 "section_name":"Electronics"},
    {"item_name":"Portable battery bank",      "section_name":"Electronics"},
    {"item_name":"Tablet / kids device",       "section_name":"Electronics"},
    {"item_name":"Car charger / adapter",      "section_name":"Electronics"},
    {"item_name":"— Snacks & Drinks —",        "section_name":"Snacks",        "is_section_header":true},
    {"item_name":"Water bottles (one each)",   "section_name":"Snacks"},
    {"item_name":"Trail mix or granola bars",  "section_name":"Snacks"},
    {"item_name":"Fruit (apples, grapes)",     "section_name":"Snacks"},
    {"item_name":"Crackers & cheese",          "section_name":"Snacks"},
    {"item_name":"Cooler with ice",            "section_name":"Snacks"},
    {"item_name":"— Entertainment —",          "section_name":"Entertainment", "is_section_header":true},
    {"item_name":"Books or audiobook list",    "section_name":"Entertainment"},
    {"item_name":"Travel games or activity kit","section_name":"Entertainment"},
    {"item_name":"Coloring books & crayons",   "section_name":"Entertainment"},
    {"item_name":"Car bingo / road trip games","section_name":"Entertainment"}
  ]'::jsonb,
  true, true, true,
  ARRAY['Road trip','Vacation prep','Long weekend'],
  'list'
WHERE NOT EXISTS (
  SELECT 1 FROM public.list_templates
  WHERE title = 'Family Road Trip Packing'
    AND is_example = true
    AND family_id IS NULL
);

-- ── Example List 3: Birthday Wishlist (Child) ────────────────

INSERT INTO public.list_templates (
  family_id, created_by,
  template_name, title, description,
  list_type, default_items,
  is_system, is_system_template, is_example,
  example_use_cases, category_label
)
SELECT
  NULL, NULL,
  'Birthday Wishlist (Child)', 'Birthday Wishlist (Child)',
  'A ready-to-use birthday wishlist with 5 sample items demonstrating URLs, estimated prices, size/color notes, and gift priority. Shows your child how to fill in a wishlist that actually helps gift-givers.',
  'wishlist',
  '[
    {"item_name":"LEGOs — City Police Station set", "url":"https://www.lego.com",         "price":79.99, "notes":"The big one with the helicopter — set #60246",     "priority":"high"},
    {"item_name":"Sneakers",                        "url":"",                              "price":55.00, "notes":"Size 6 youth, prefer navy blue or gray",           "priority":"high"},
    {"item_name":"Minecraft Dungeons (Switch)",     "url":"https://www.nintendo.com",      "price":29.99, "notes":"Digital download is fine",                         "priority":"medium"},
    {"item_name":"Art supply set",                  "url":"https://www.amazon.com",        "price":25.00, "notes":"Watercolors or colored pencils — no crayons",       "priority":"medium"},
    {"item_name":"Anything from the \"Adventure\" series books", "url":"",                "price":10.00, "notes":"I have #1-3 already — need #4 or higher",           "priority":"low"}
  ]'::jsonb,
  true, true, true,
  ARRAY['Birthday','Holiday wishlist','Gift ideas for grandparents'],
  'list'
WHERE NOT EXISTS (
  SELECT 1 FROM public.list_templates
  WHERE title = 'Birthday Wishlist (Child)'
    AND is_example = true
    AND family_id IS NULL
);

-- ── Example List 4: Homeschool Curriculum Budget ─────────────

INSERT INTO public.list_templates (
  family_id, created_by,
  template_name, title, description,
  list_type, default_items,
  is_system, is_system_template, is_example,
  example_use_cases, category_label
)
SELECT
  NULL, NULL,
  'Homeschool Curriculum Budget', 'Homeschool Curriculum Budget',
  'A ready-to-use expense tracker with 5 sample curriculum purchases showing amount, category, vendor, and notes. Running total helps stay on budget for the school year.',
  'expenses',
  '[
    {"item_name":"Math curriculum — Saxon Math 5/4",          "price":89.95, "category":"Math",           "notes":"Full set: Student textbook + solutions manual. Vendor: Rainbow Resource."},
    {"item_name":"Language Arts — All About Reading Level 3",  "price":59.95, "category":"Language Arts",  "notes":"Kit includes teacher guide + activity sheets. Vendor: All About Learning Press."},
    {"item_name":"History — Story of the World Vol. 2",        "price":19.99, "category":"History",        "notes":"Audio CD version. Vendor: Peace Hill Press."},
    {"item_name":"Science — Apologia Exploring Creation",      "price":55.00, "category":"Science",        "notes":"Used copy found on Facebook Marketplace. Saved $30."},
    {"item_name":"Art supplies — watercolor set + sketchbooks","price":28.00, "category":"Art",            "notes":"Michaels 40% off coupon used. Covers both kids."}
  ]'::jsonb,
  true, true, true,
  ARRAY['Curriculum purchases','School year budget','ESA tracking'],
  'list'
WHERE NOT EXISTS (
  SELECT 1 FROM public.list_templates
  WHERE title = 'Homeschool Curriculum Budget'
    AND is_example = true
    AND family_id IS NULL
);

-- ============================================================
-- SECTION 7: Verification comments (not executable — reference only)
-- Expected row counts after this migration runs on a fresh DB:
--   task_templates:         15 rows (8 blank system + 7 example)
--   task_template_sections:  6 rows (3 Morning Routine + 3 Bedroom Clean-Up)
--   task_template_steps:    22 rows (11 Morning Routine: 6+3+2; 11 Bedroom: 3+4+4)
--   list_templates:         11 rows (7 from migration 024 + 4 new examples)
-- ============================================================
