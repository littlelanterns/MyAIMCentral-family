-- ============================================================
-- STUDIO-EXPERIENCE ST-A (finding F-04d / audit tile 24)
--
-- The Studio example tile "TSG Extra Jobs Randomizer" promises
-- "9 chore items (one-time) + 4 connection items (repeatable)" and
-- navigates to /lists?create=randomizer&template=<id> — but NO
-- list_templates row with that title ever existed, so the promised
-- 13 items had no data source anywhere and the tile opened a blank
-- randomizer (DB-verified 2026-07-04).
--
-- This seeds the missing system example row per the founder spec
-- (specs/studio-seed-templates.md, Example 5). The existing
-- Studio → /lists template hydration path (Worker 4, list-template
-- deploy: useCreateList default_items snapshot) does the rest.
--
-- Idempotent: WHERE NOT EXISTS on (title, is_example, family_id NULL),
-- the same guard shape as migration 00000000000027.
-- ============================================================

INSERT INTO public.list_templates (
  family_id, created_by,
  template_name, title, description,
  list_type, default_items,
  is_system, is_system_template, is_example,
  example_use_cases, category_label
)
SELECT
  NULL, NULL,
  'TSG Extra Jobs Randomizer', 'TSG Extra Jobs Randomizer',
  'A Randomizer list with 9 chore items (one-time, quick to medium) and 4 connection items (repeatable). Mix real work with relationship-building moments. Perfect for fair job distribution — spin to see who does what.',
  'randomizer',
  '[
    {"item_name":"Fold and put away laundry",                    "section_name":"Chores",     "is_repeatable":false},
    {"item_name":"Empty the dishwasher",                         "section_name":"Chores",     "is_repeatable":false},
    {"item_name":"Wipe down the bathroom sink",                  "section_name":"Chores",     "is_repeatable":false},
    {"item_name":"Take out the trash and recycling",             "section_name":"Chores",     "is_repeatable":false},
    {"item_name":"Sweep the kitchen floor",                      "section_name":"Chores",     "is_repeatable":false},
    {"item_name":"Dust the living room shelves",                 "section_name":"Chores",     "is_repeatable":false},
    {"item_name":"Water the plants",                             "section_name":"Chores",     "is_repeatable":false},
    {"item_name":"Sort the shoe pile by owner",                  "section_name":"Chores",     "is_repeatable":false},
    {"item_name":"Wipe the door handles and light switches",     "section_name":"Chores",     "is_repeatable":false},
    {"item_name":"Read together for 10 minutes",                 "section_name":"Connection", "is_repeatable":true},
    {"item_name":"Play a quick board game",                      "section_name":"Connection", "is_repeatable":true},
    {"item_name":"Tell each other your favorite part of today",  "section_name":"Connection", "is_repeatable":true},
    {"item_name":"Give everyone in the family a compliment",     "section_name":"Connection", "is_repeatable":true}
  ]'::jsonb,
  true, true, true,
  ARRAY['Fold and put away laundry','Empty dishwasher','Read together','Play a board game'],
  'list'
WHERE NOT EXISTS (
  SELECT 1 FROM public.list_templates
  WHERE title = 'TSG Extra Jobs Randomizer'
    AND is_example = true
    AND family_id IS NULL
);
