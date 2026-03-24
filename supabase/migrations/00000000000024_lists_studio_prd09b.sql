-- ============================================================
-- PRD-09B: Lists, Studio & Templates
-- Migration 23 — Schema additions and seed data
-- ============================================================
-- NOTE: Never DROP/RECREATE existing tables. Only ALTER to add columns.
-- All new columns are nullable or have defaults to preserve existing data.
-- ============================================================

-- ============================================================
-- SECTION 1: ALTER lists table
-- ============================================================

-- Add PRD-09B columns to lists
ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.list_templates(id),
  ADD COLUMN IF NOT EXISTS list_name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS victory_on_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_included_in_ai BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Expand list_type CHECK constraint to include PRD-09B types
-- Must drop the old constraint by name, then add new one
ALTER TABLE public.lists
  DROP CONSTRAINT IF EXISTS lists_list_type_check;

ALTER TABLE public.lists
  ADD CONSTRAINT lists_list_type_check
    CHECK (list_type IN (
      'simple','checklist','reference','template','randomizer','backburner',
      'shopping','wishlist','expenses','packing','todo','custom','guided_form',
      'ideas','prayer'
    ));

-- Index for archived filter
CREATE INDEX IF NOT EXISTS idx_lists_archived ON public.lists(archived_at) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lists_created_by ON public.lists(created_by);

-- ============================================================
-- SECTION 2: ALTER list_items table
-- ============================================================

-- Add PRD-09B columns to list_items
ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS item_name TEXT,
  ADD COLUMN IF NOT EXISTS checked_by UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS quantity_unit TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS item_date DATE,
  ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low','medium','high','urgent')),
  ADD COLUMN IF NOT EXISTS gift_for UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS promoted_to_task BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promoted_task_id UUID REFERENCES public.tasks(id),
  ADD COLUMN IF NOT EXISTS is_repeatable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS parent_item_id UUID REFERENCES public.list_items(id);

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_li_checked_by ON public.list_items(checked_by) WHERE checked_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_li_parent ON public.list_items(parent_item_id) WHERE parent_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_li_promoted ON public.list_items(promoted_task_id) WHERE promoted_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_li_available ON public.list_items(list_id, is_available) WHERE is_available = true;

-- ============================================================
-- SECTION 3: ALTER list_templates table
-- ============================================================

-- Add PRD-09B columns to list_templates
-- family_id and created_by are nullable to support system templates (NULL = system)
ALTER TABLE public.list_templates
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS template_name TEXT,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_deployed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ensure default_items has a default if not already set
ALTER TABLE public.list_templates
  ALTER COLUMN default_items SET DEFAULT '[]'::jsonb;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_ltmpl_updated_at ON public.list_templates;
CREATE TRIGGER trg_ltmpl_updated_at
  BEFORE UPDATE ON public.list_templates
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lt_family ON public.list_templates(family_id) WHERE family_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lt_system ON public.list_templates(is_system) WHERE is_system = true;
CREATE INDEX IF NOT EXISTS idx_lt_archived ON public.list_templates(archived_at) WHERE archived_at IS NULL;

-- ============================================================
-- SECTION 4: ALTER list_shares table
-- ============================================================

-- Add PRD-09B columns to list_shares
-- PRD-09B uses member_id; existing column is shared_with. Add member_id as alias.
ALTER TABLE public.list_shares
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS is_individual_copy BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_edit BOOLEAN NOT NULL DEFAULT false;

-- Add unique constraint on (list_id, member_id) for PRD-09B pattern
-- Only add if member_id is populated; use conditional approach
CREATE UNIQUE INDEX IF NOT EXISTS idx_ls_list_member ON public.list_shares(list_id, member_id)
  WHERE member_id IS NOT NULL;

-- Index for shared_with (existing) for performance
CREATE INDEX IF NOT EXISTS idx_ls_member_id ON public.list_shares(member_id) WHERE member_id IS NOT NULL;

-- ============================================================
-- SECTION 5: ALTER task_templates table
-- ============================================================

-- Add Studio-specific columns to task_templates
ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_example BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS example_use_cases TEXT[],
  ADD COLUMN IF NOT EXISTS category_label TEXT,
  ADD COLUMN IF NOT EXISTS guided_form_subtype TEXT CHECK (guided_form_subtype IN (
    'sodas','what_if','apology_reflection','custom'
  )),
  ADD COLUMN IF NOT EXISTS guided_form_sections JSONB;

-- Allow NULL family_id and created_by for system templates
ALTER TABLE public.task_templates ALTER COLUMN family_id DROP NOT NULL;
ALTER TABLE public.task_templates ALTER COLUMN created_by DROP NOT NULL;

-- Index for studio browsing
CREATE INDEX IF NOT EXISTS idx_tt_system_template ON public.task_templates(is_system_template) WHERE is_system_template = true;
CREATE INDEX IF NOT EXISTS idx_tt_category ON public.task_templates(category_label) WHERE category_label IS NOT NULL;

-- ============================================================
-- SECTION 6: CREATE guided_form_responses table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guided_form_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id),
  section_key TEXT NOT NULL,
  response_content TEXT NOT NULL,
  response_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, family_member_id, section_key)
);

CREATE INDEX idx_gfr_task ON public.guided_form_responses(task_id);
CREATE INDEX idx_gfr_family_member ON public.guided_form_responses(family_id, family_member_id);

CREATE TRIGGER trg_gfr_updated_at
  BEFORE UPDATE ON public.guided_form_responses
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.guided_form_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gfr_select_family" ON public.guided_form_responses
  FOR SELECT USING (
    family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
  );

CREATE POLICY "gfr_insert_own" ON public.guided_form_responses
  FOR INSERT WITH CHECK (
    family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    AND family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
  );

CREATE POLICY "gfr_update_own" ON public.guided_form_responses
  FOR UPDATE USING (
    family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "gfr_delete_own" ON public.guided_form_responses
  FOR DELETE USING (
    family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- SECTION 7: Feature Key Registry — PRD-09B feature keys
-- ============================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('studio_browse',         'Studio Browse',            'Browse system and family task/list templates in Studio',          'PRD-09B'),
  ('studio_customize_tasks','Studio Customize Tasks',   'Customize and create task templates in Studio',                   'PRD-09B'),
  ('studio_customize_lists','Studio Customize Lists',   'Customize and create list templates in Studio',                   'PRD-09B'),
  ('studio_teen_access',    'Studio Teen Access',        'Independent teen access to Studio templates',                     'PRD-09B'),
  ('lists_basic',           'Lists Basic',               'Create and manage personal lists',                                'PRD-09B'),
  ('lists_sharing',         'Lists Sharing',             'Share lists with family members',                                 'PRD-09B'),
  ('lists_ai_bulk_add',     'Lists AI Bulk Add',         'Use AI to bulk-add items to a list',                             'PRD-09B'),
  ('lists_ai_organize',     'Lists AI Organize',         'Use AI to organize and categorize list items',                   'PRD-09B'),
  ('lists_victory_complete','Lists Victory on Complete', 'Auto-record a victory when all list items are checked',          'PRD-09B'),
  ('lists_guided_forms',    'Guided Form Lists',         'Use guided form templates (SODAS, decision tools) as lists',     'PRD-09B')
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================================
-- SECTION 8: Feature Access — Tier Thresholds (PRD-09B)
-- ============================================================
-- minimum_tier_id NULL = available on Essential (all tiers)
-- We reference tier slugs via subquery to stay portable.
-- During beta, useCanAccess() returns true for all — infra must still be in place.
-- ============================================================

-- studio_browse: Essential for mom/adults; Full Magic for teen
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'studio_browse', rg, NULL, true
FROM (VALUES ('mom'),('dad_adults'),('special_adults')) AS t(rg)
ON CONFLICT DO NOTHING;

INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'studio_browse', 'independent_teens',
  (SELECT id FROM public.subscription_tiers WHERE slug = 'full_magic' LIMIT 1), true
ON CONFLICT DO NOTHING;

-- studio_customize_tasks: Enhanced for mom/adults
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'studio_customize_tasks', rg,
  (SELECT id FROM public.subscription_tiers WHERE slug = 'enhanced' LIMIT 1), true
FROM (VALUES ('mom'),('dad_adults')) AS t(rg)
ON CONFLICT DO NOTHING;

-- studio_customize_lists: Essential for mom/adults
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'studio_customize_lists', rg, NULL, true
FROM (VALUES ('mom'),('dad_adults')) AS t(rg)
ON CONFLICT DO NOTHING;

-- studio_teen_access: Full Magic
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
VALUES (
  'studio_teen_access', 'independent_teens',
  (SELECT id FROM public.subscription_tiers WHERE slug = 'full_magic' LIMIT 1), true
)
ON CONFLICT DO NOTHING;

-- lists_basic: Essential for mom/adults/teens
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'lists_basic', rg, NULL, true
FROM (VALUES ('mom'),('dad_adults'),('special_adults'),('independent_teens')) AS t(rg)
ON CONFLICT DO NOTHING;

-- lists_sharing: Enhanced for mom/adults
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'lists_sharing', rg,
  (SELECT id FROM public.subscription_tiers WHERE slug = 'enhanced' LIMIT 1), true
FROM (VALUES ('mom'),('dad_adults')) AS t(rg)
ON CONFLICT DO NOTHING;

-- lists_ai_bulk_add: Enhanced for mom/adults
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'lists_ai_bulk_add', rg,
  (SELECT id FROM public.subscription_tiers WHERE slug = 'enhanced' LIMIT 1), true
FROM (VALUES ('mom'),('dad_adults')) AS t(rg)
ON CONFLICT DO NOTHING;

-- lists_ai_organize: Enhanced for mom/adults
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'lists_ai_organize', rg,
  (SELECT id FROM public.subscription_tiers WHERE slug = 'enhanced' LIMIT 1), true
FROM (VALUES ('mom'),('dad_adults')) AS t(rg)
ON CONFLICT DO NOTHING;

-- lists_victory_complete: Essential for mom/adults
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'lists_victory_complete', rg, NULL, true
FROM (VALUES ('mom'),('dad_adults'),('independent_teens')) AS t(rg)
ON CONFLICT DO NOTHING;

-- lists_guided_forms: Essential for mom/adults
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT 'lists_guided_forms', rg, NULL, true
FROM (VALUES ('mom'),('dad_adults')) AS t(rg)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SECTION 9: System List Templates (Studio)
-- ============================================================

INSERT INTO public.list_templates (
  family_id, created_by, template_name, title, description, list_type, default_items, is_system
)
VALUES

-- Shopping List Template
(
  NULL, NULL,
  'Shopping List',
  'Shopping List',
  'A flexible shopping list with sections for produce, dairy, pantry, and more. Supports quantities, units, and per-item notes.',
  'shopping',
  '[
    {"item_name": "Produce", "section_name": "Produce", "is_section_header": true},
    {"item_name": "Dairy & Eggs", "section_name": "Dairy", "is_section_header": true},
    {"item_name": "Pantry Staples", "section_name": "Pantry", "is_section_header": true},
    {"item_name": "Frozen", "section_name": "Frozen", "is_section_header": true},
    {"item_name": "Household", "section_name": "Household", "is_section_header": true}
  ]'::jsonb,
  true
),

-- Wishlist Template
(
  NULL, NULL,
  'Gift Wishlist',
  'Gift Wishlist',
  'Track gift ideas with links, prices, and who the gift is for. Great for birthdays, holidays, and special occasions.',
  'wishlist',
  '[
    {"item_name": "Add your first wish...", "notes": "Include a link if you have one!", "priority": "medium"}
  ]'::jsonb,
  true
),

-- Packing List Template
(
  NULL, NULL,
  'Travel Packing List',
  'Travel Packing List',
  'Never forget anything on your next trip. Organized sections for clothes, toiletries, documents, and gear.',
  'packing',
  '[
    {"item_name": "Clothes", "section_name": "Clothing", "is_section_header": true},
    {"item_name": "Shirts (3-5)", "section_name": "Clothing"},
    {"item_name": "Pants / Shorts (2-3)", "section_name": "Clothing"},
    {"item_name": "Underwear & Socks", "section_name": "Clothing"},
    {"item_name": "Pajamas", "section_name": "Clothing"},
    {"item_name": "Shoes", "section_name": "Clothing"},
    {"item_name": "Toiletries", "section_name": "Toiletries", "is_section_header": true},
    {"item_name": "Toothbrush & Toothpaste", "section_name": "Toiletries"},
    {"item_name": "Shampoo & Conditioner", "section_name": "Toiletries"},
    {"item_name": "Deodorant", "section_name": "Toiletries"},
    {"item_name": "Documents", "section_name": "Documents", "is_section_header": true},
    {"item_name": "ID / Passport", "section_name": "Documents"},
    {"item_name": "Tickets / Reservations", "section_name": "Documents"},
    {"item_name": "Insurance Cards", "section_name": "Documents"},
    {"item_name": "Tech & Gear", "section_name": "Tech", "is_section_header": true},
    {"item_name": "Phone Charger", "section_name": "Tech"},
    {"item_name": "Headphones", "section_name": "Tech"},
    {"item_name": "Medications", "section_name": "Health", "is_section_header": true}
  ]'::jsonb,
  true
),

-- Expenses Tracker Template
(
  NULL, NULL,
  'Expense Tracker',
  'Expense Tracker',
  'Log spending by category. Supports amount, date, and notes for each entry.',
  'expenses',
  '[
    {"item_name": "Groceries", "section_name": "Food & Home", "category": "groceries"},
    {"item_name": "Dining Out", "section_name": "Food & Home", "category": "dining"},
    {"item_name": "Gas", "section_name": "Transportation", "category": "gas"},
    {"item_name": "Subscriptions", "section_name": "Bills", "category": "subscriptions"}
  ]'::jsonb,
  true
),

-- To-Do List Template
(
  NULL, NULL,
  'To-Do List',
  'To-Do List',
  'A simple to-do list with priority levels. Items can be promoted to full tasks when needed.',
  'todo',
  '[
    {"item_name": "Add your first to-do...", "priority": "medium"}
  ]'::jsonb,
  true
),

-- Randomizer Template
(
  NULL, NULL,
  'Dinner Randomizer',
  'Dinner Randomizer',
  'Stuck on what to make for dinner? Add your family''s favorite meals and let the randomizer pick! Supports repeatable draws.',
  'randomizer',
  '[
    {"item_name": "Taco Tuesday", "is_repeatable": true},
    {"item_name": "Pasta Night", "is_repeatable": true},
    {"item_name": "Soup & Bread", "is_repeatable": true},
    {"item_name": "Stir Fry", "is_repeatable": true},
    {"item_name": "Breakfast for Dinner", "is_repeatable": true}
  ]'::jsonb,
  true
),

-- SODAS Guided Form Template
(
  NULL, NULL,
  'SODAS Decision Tool',
  'SODAS Decision Tool',
  'A structured decision-making tool using the SODAS framework: Situation, Options, Disadvantages, Advantages, Solution. Great for helping kids (and adults) think through choices.',
  'guided_form',
  '[
    {"section_key": "situation",     "section_title": "Situation",     "section_prompt": "Describe the situation or decision you are facing.",               "sort_order": 1},
    {"section_key": "options",       "section_title": "Options",       "section_prompt": "List the options you are considering (add one per line or card).",  "sort_order": 2},
    {"section_key": "disadvantages", "section_title": "Disadvantages", "section_prompt": "For each option, what are the drawbacks or challenges?",           "sort_order": 3},
    {"section_key": "advantages",    "section_title": "Advantages",    "section_prompt": "For each option, what are the benefits or good things?",            "sort_order": 4},
    {"section_key": "solution",      "section_title": "Solution",      "section_prompt": "Based on your thinking, what is your best solution or next step?", "sort_order": 5}
  ]'::jsonb,
  true
)

ON CONFLICT DO NOTHING;

-- ============================================================
-- SECTION 10: System Task Templates (Studio)
-- ============================================================
-- NOTE: task_templates has family_id NOT NULL and created_by NOT NULL.
-- System templates for Studio are flagged with is_system = true AND is_system_template = true.
-- We cannot insert with NULL family_id/created_by here.
-- The application layer handles system template browsing by joining on is_system_template = true
-- with a special sentinel approach: system task templates are seeded at first-launch time
-- when a primary_parent is available. We add the is_system_template index and category_label
-- data here, but actual system task template row insertion happens in app-level seeding logic.
--
-- This is a deliberate design choice documented here for Agent 2 and beyond.
-- STUB: System task template row seeding — wires to PRD-09A Studio UI phase
-- ============================================================

-- ============================================================
-- SECTION 11: Update existing list_templates RLS
-- ============================================================
-- Existing list_templates RLS is "Public read. Admin write."
-- PRD-09B adds family-specific templates (family_id IS NOT NULL).
-- Ensure family members can read/manage their own family templates.
-- ============================================================

-- Drop any existing broad policy and replace with nuanced ones
DROP POLICY IF EXISTS "list_templates_select" ON public.list_templates;
DROP POLICY IF EXISTS "list_templates_all" ON public.list_templates;

-- System templates: public read
CREATE POLICY "ltmpl_select_system" ON public.list_templates
  FOR SELECT USING (is_system = true OR family_id IS NULL);

-- Family templates: scoped to family
CREATE POLICY "ltmpl_select_family" ON public.list_templates
  FOR SELECT USING (
    family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
  );

-- Family members (adults/mom) can insert family templates
CREATE POLICY "ltmpl_insert_family" ON public.list_templates
  FOR INSERT WITH CHECK (
    family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    AND created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Creators can update their own family templates
CREATE POLICY "ltmpl_update_own" ON public.list_templates
  FOR UPDATE USING (
    created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Creators can delete their own non-system templates
CREATE POLICY "ltmpl_delete_own" ON public.list_templates
  FOR DELETE USING (
    is_system = false
    AND created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- SECTION 12: Ensure list_templates RLS is enabled
-- ============================================================

ALTER TABLE public.list_templates ENABLE ROW LEVEL SECURITY;
