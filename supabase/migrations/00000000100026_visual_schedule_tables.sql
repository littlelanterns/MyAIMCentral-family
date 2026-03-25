-- Visual schedule assets extend the existing platform_assets table
-- The visual_schedule category is already supported via the CHECK constraint
-- No changes needed to platform_assets table

-- Routines table — stores the 10 pre-built routines and any mom-created custom routines
CREATE TABLE IF NOT EXISTS visual_schedule_routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  routine_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon_asset_key TEXT, -- references platform_assets.feature_key
  icon_variant TEXT DEFAULT 'B',
  is_system_routine BOOLEAN DEFAULT false, -- true for the 10 pre-built routines
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine steps — ordered steps within a routine
CREATE TABLE IF NOT EXISTS visual_schedule_routine_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID REFERENCES visual_schedule_routines(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  asset_key TEXT NOT NULL, -- references platform_assets.feature_key
  variant TEXT DEFAULT 'B' CHECK (variant IN ('A', 'B', 'C')),
  custom_label TEXT, -- mom can override the default label
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member routine assignments — which routines are assigned to which family members
CREATE TABLE IF NOT EXISTS visual_schedule_member_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES visual_schedule_routines(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  display_order INTEGER DEFAULT 0,
  UNIQUE(family_member_id, routine_id)
);

-- Member task assignments — standalone tasks assigned to a member (not part of a routine)
CREATE TABLE IF NOT EXISTS visual_schedule_member_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  asset_key TEXT NOT NULL, -- references platform_assets.feature_key
  variant TEXT DEFAULT 'B' CHECK (variant IN ('A', 'B', 'C')),
  custom_label TEXT,
  is_complete BOOLEAN DEFAULT false,
  scheduled_date DATE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_routine_steps_routine_id ON visual_schedule_routine_steps(routine_id, step_order);
CREATE INDEX IF NOT EXISTS idx_member_assignments_member ON visual_schedule_member_assignments(family_member_id);
CREATE INDEX IF NOT EXISTS idx_member_tasks_member ON visual_schedule_member_tasks(family_member_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_system_routines ON visual_schedule_routines(is_system_routine) WHERE is_system_routine = true;

-- RLS
ALTER TABLE visual_schedule_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_schedule_routine_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_schedule_member_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_schedule_member_tasks ENABLE ROW LEVEL SECURITY;

-- System routines readable by all authenticated users
CREATE POLICY "System routines readable by all"
  ON visual_schedule_routines FOR SELECT
  TO authenticated
  USING (is_system_routine = true OR family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));

-- Family routines manageable by primary parent
CREATE POLICY "Family routines manageable by primary parent"
  ON visual_schedule_routines FOR ALL
  TO authenticated
  USING (family_id IN (
    SELECT family_id FROM family_members
    WHERE user_id = auth.uid() AND role = 'primary_parent'
  ));

-- Steps follow routine access
CREATE POLICY "Routine steps follow routine access"
  ON visual_schedule_routine_steps FOR SELECT
  TO authenticated
  USING (routine_id IN (
    SELECT id FROM visual_schedule_routines
  ));

-- Steps manageable by primary parent
CREATE POLICY "Routine steps manageable by primary parent"
  ON visual_schedule_routine_steps FOR ALL
  TO authenticated
  USING (routine_id IN (
    SELECT id FROM visual_schedule_routines WHERE family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  ));

-- Member assignments scoped to family
CREATE POLICY "Member assignments scoped to family"
  ON visual_schedule_member_assignments FOR ALL
  TO authenticated
  USING (family_member_id IN (
    SELECT id FROM family_members WHERE family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  ));

-- Member tasks scoped to family
CREATE POLICY "Member tasks scoped to family"
  ON visual_schedule_member_tasks FOR ALL
  TO authenticated
  USING (family_member_id IN (
    SELECT id FROM family_members WHERE family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  ));

COMMENT ON TABLE visual_schedule_routines IS
  'Visual schedule routines — both system pre-built (10) and mom-created custom routines.
   System routines have family_id = null and is_system_routine = true.
   When a family assigns a system routine, a copy is created for their family_id.';

COMMENT ON TABLE visual_schedule_routine_steps IS
  'Ordered steps within a visual schedule routine.
   Each step references a platform_assets record by feature_key.
   custom_label overrides the default asset description for this family.';

COMMENT ON TABLE visual_schedule_member_assignments IS
  'Which routines are assigned to which family members.
   Mom assigns routines to children from the visual schedule builder.';

COMMENT ON TABLE visual_schedule_member_tasks IS
  'Standalone task assignments — individual visual schedule items
   not part of a routine. Mom can assign these directly to any member.';

-- Seed the 10 pre-built system routines
INSERT INTO visual_schedule_routines
  (routine_key, display_name, description, icon_asset_key, icon_variant, is_system_routine, sort_order)
VALUES
  ('morning_routine', 'Morning Routine', 'Start the day right', 'vs_seq_wake_up', 'B', true, 1),
  ('bedtime_routine', 'Bedtime Routine', 'Wind down for sleep', 'vs_rest_bedtime', 'B', true, 2),
  ('potty_routine', 'Potty Routine', 'Step by step potty success', 'vs_potty_sit', 'B', true, 3),
  ('getting_dressed', 'Getting Dressed', 'Clothes on from start to finish', 'vs_dress_shirt', 'B', true, 4),
  ('handwashing', 'Handwashing', 'Clean hands every time', 'vs_potty_hand_wash', 'B', true, 5),
  ('brushing_teeth', 'Brushing Teeth', 'Healthy smile routine', 'vs_teeth_brush_top', 'B', true, 6),
  ('bath_time', 'Bath Time', 'Clean from head to toe', 'vs_bath_get_in_tub', 'B', true, 7),
  ('after_school', 'After School Routine', 'Unpack, snack, and get ready for tomorrow', 'vs_school_unpack_backpack', 'B', true, 8),
  ('mealtime', 'Mealtime', 'Sit, eat, and clean up', 'vs_meal_dinner', 'B', true, 9),
  ('calm_down', 'Calm Down Routine', 'Feelings are okay — here is what to do', 'vs_calm_deep_breath', 'B', true, 10)
ON CONFLICT DO NOTHING;

-- Seed routine steps
DO $$
DECLARE
  morning_id UUID;
  bedtime_id UUID;
  potty_id UUID;
  dressed_id UUID;
  hands_id UUID;
  teeth_id UUID;
  bath_id UUID;
  school_id UUID;
  meal_id UUID;
  calm_id UUID;
BEGIN
  SELECT id INTO morning_id FROM visual_schedule_routines WHERE routine_key = 'morning_routine' AND is_system_routine = true;
  SELECT id INTO bedtime_id FROM visual_schedule_routines WHERE routine_key = 'bedtime_routine' AND is_system_routine = true;
  SELECT id INTO potty_id FROM visual_schedule_routines WHERE routine_key = 'potty_routine' AND is_system_routine = true;
  SELECT id INTO dressed_id FROM visual_schedule_routines WHERE routine_key = 'getting_dressed' AND is_system_routine = true;
  SELECT id INTO hands_id FROM visual_schedule_routines WHERE routine_key = 'handwashing' AND is_system_routine = true;
  SELECT id INTO teeth_id FROM visual_schedule_routines WHERE routine_key = 'brushing_teeth' AND is_system_routine = true;
  SELECT id INTO bath_id FROM visual_schedule_routines WHERE routine_key = 'bath_time' AND is_system_routine = true;
  SELECT id INTO school_id FROM visual_schedule_routines WHERE routine_key = 'after_school' AND is_system_routine = true;
  SELECT id INTO meal_id FROM visual_schedule_routines WHERE routine_key = 'mealtime' AND is_system_routine = true;
  SELECT id INTO calm_id FROM visual_schedule_routines WHERE routine_key = 'calm_down' AND is_system_routine = true;

  -- Morning Routine steps
  INSERT INTO visual_schedule_routine_steps (routine_id, step_order, asset_key, variant, custom_label) VALUES
    (morning_id, 1, 'vs_seq_wake_up', 'B', 'Wake up'),
    (morning_id, 2, 'vs_potty_sit', 'B', 'Go potty'),
    (morning_id, 3, 'vs_teeth_brush_top', 'B', 'Brush teeth'),
    (morning_id, 4, 'vs_face_wash', 'B', 'Wash face'),
    (morning_id, 5, 'vs_dress_shirt', 'B', 'Get dressed'),
    (morning_id, 6, 'vs_meal_breakfast', 'B', 'Eat breakfast'),
    (morning_id, 7, 'vs_school_pack_backpack', 'B', 'Pack backpack');

  -- Bedtime Routine steps
  INSERT INTO visual_schedule_routine_steps (routine_id, step_order, asset_key, variant, custom_label) VALUES
    (bedtime_id, 1, 'vs_bath_get_in_tub', 'B', 'Bath time'),
    (bedtime_id, 2, 'vs_dress_pajamas', 'B', 'Put on pajamas'),
    (bedtime_id, 3, 'vs_teeth_brush_top', 'B', 'Brush teeth'),
    (bedtime_id, 4, 'vs_rest_story_time', 'B', 'Story time'),
    (bedtime_id, 5, 'vs_rest_prayers', 'B', 'Prayers'),
    (bedtime_id, 6, 'vs_rest_goodnight_hugs', 'B', 'Goodnight hugs'),
    (bedtime_id, 7, 'vs_rest_turn_off_lights', 'B', 'Lights out');

  -- Potty Routine steps
  INSERT INTO visual_schedule_routine_steps (routine_id, step_order, asset_key, variant, custom_label) VALUES
    (potty_id, 1, 'vs_seq_potty_walk_to_bathroom', 'B', 'Walk to bathroom'),
    (potty_id, 2, 'vs_potty_pull_down_pants', 'B', 'Pull down pants'),
    (potty_id, 3, 'vs_potty_sit', 'B', 'Sit on potty'),
    (potty_id, 4, 'vs_potty_wipe', 'B', 'Wipe'),
    (potty_id, 5, 'vs_potty_pull_up_pants', 'B', 'Pull up pants'),
    (potty_id, 6, 'vs_potty_hand_wash', 'B', 'Wash hands');

  -- Getting Dressed steps
  INSERT INTO visual_schedule_routine_steps (routine_id, step_order, asset_key, variant, custom_label) VALUES
    (dressed_id, 1, 'vs_dress_underwear', 'B', 'Underwear'),
    (dressed_id, 2, 'vs_dress_shirt', 'B', 'Shirt'),
    (dressed_id, 3, 'vs_dress_pants', 'B', 'Pants'),
    (dressed_id, 4, 'vs_dress_socks', 'B', 'Socks'),
    (dressed_id, 5, 'vs_dress_shoes_velcro', 'B', 'Shoes'),
    (dressed_id, 6, 'vs_dress_jacket', 'B', 'Jacket');

  -- Handwashing steps
  INSERT INTO visual_schedule_routine_steps (routine_id, step_order, asset_key, variant, custom_label) VALUES
    (hands_id, 1, 'vs_potty_soap', 'B', 'Get soap'),
    (hands_id, 2, 'vs_potty_hand_wash', 'B', 'Scrub hands'),
    (hands_id, 3, 'vs_potty_rinse', 'B', 'Rinse'),
    (hands_id, 4, 'vs_potty_dry_hands', 'B', 'Dry hands'),
    (hands_id, 5, 'vs_seq_handwash_done', 'B', 'All done!');

  -- Brushing Teeth steps
  INSERT INTO visual_schedule_routine_steps (routine_id, step_order, asset_key, variant, custom_label) VALUES
    (teeth_id, 1, 'vs_teeth_get_toothbrush', 'B', 'Get toothbrush'),
    (teeth_id, 2, 'vs_teeth_put_toothpaste', 'B', 'Add toothpaste'),
    (teeth_id, 3, 'vs_teeth_brush_top', 'B', 'Brush teeth'),
    (teeth_id, 4, 'vs_teeth_spit', 'B', 'Spit and rinse'),
    (teeth_id, 5, 'vs_teeth_put_away', 'B', 'Put away');

  -- Bath Time steps
  INSERT INTO visual_schedule_routine_steps (routine_id, step_order, asset_key, variant, custom_label) VALUES
    (bath_id, 1, 'vs_seq_bath_get_undressed', 'B', 'Get undressed'),
    (bath_id, 2, 'vs_bath_get_in_tub', 'B', 'Get in tub'),
    (bath_id, 3, 'vs_bath_wash_body', 'B', 'Wash body'),
    (bath_id, 4, 'vs_bath_wash_hair', 'B', 'Wash hair'),
    (bath_id, 5, 'vs_bath_get_out', 'B', 'Get out'),
    (bath_id, 6, 'vs_bath_dry_off', 'B', 'Dry off');

  -- After School steps
  INSERT INTO visual_schedule_routine_steps (routine_id, step_order, asset_key, variant, custom_label) VALUES
    (school_id, 1, 'vs_laundry_take_off_shoes', 'B', 'Take off shoes'),
    (school_id, 2, 'vs_school_unpack_backpack', 'B', 'Unpack backpack'),
    (school_id, 3, 'vs_meal_snack', 'B', 'Have a snack'),
    (school_id, 4, 'vs_learn_homework', 'B', 'Homework'),
    (school_id, 5, 'vs_play_free_play', 'B', 'Free play'),
    (school_id, 6, 'vs_seq_afterschool_ready_tomorrow', 'B', 'Get ready for tomorrow');

  -- Mealtime steps
  INSERT INTO visual_schedule_routine_steps (routine_id, step_order, asset_key, variant, custom_label) VALUES
    (meal_id, 1, 'vs_table_set_table', 'B', 'Set the table'),
    (meal_id, 2, 'vs_meal_stay_seated', 'B', 'Sit down'),
    (meal_id, 3, 'vs_meal_use_fork', 'B', 'Eat'),
    (meal_id, 4, 'vs_table_clear_plate', 'B', 'Clear plate'),
    (meal_id, 5, 'vs_table_push_in_chair', 'B', 'Push in chair');

  -- Calm Down steps
  INSERT INTO visual_schedule_routine_steps (routine_id, step_order, asset_key, variant, custom_label) VALUES
    (calm_id, 1, 'vs_calm_take_a_break', 'B', 'Notice your feeling'),
    (calm_id, 2, 'vs_calm_deep_breath', 'B', 'Take a deep breath'),
    (calm_id, 3, 'vs_calm_count_to_ten', 'B', 'Count to 10'),
    (calm_id, 4, 'vs_calm_calm_corner', 'B', 'Go to calm corner'),
    (calm_id, 5, 'vs_calm_feelings_words', 'B', 'Use your words');

END $$;
