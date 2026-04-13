-- Task Breaker AI Vault Entry
-- PRD-09A: Single vault item for Task Breaker (text + image modes combined)
-- Tier assignment deferred to post-beta — allowed_tiers left empty

INSERT INTO public.vault_items (
  display_title, detail_title, short_description, full_description,
  content_type, delivery_method, guided_mode_key,
  category_id, difficulty, tags, status, is_featured, teen_visible,
  portal_description, portal_tips,
  allowed_tiers,
  created_by
) SELECT
  'Break Any Task Into Steps',
  'Task Breaker',
  'Give AI any overwhelming task and get back a clear, step-by-step action plan.',
  'Task Breaker takes any task — from "clean the garage" to "plan the birthday party" — and breaks it into practical, actionable steps your family can actually follow. Three detail levels (Quick, Detailed, Granular) let you choose how fine-grained the steps get. It considers who''s in your family and suggests which member should handle each step based on their age and current workload. You can also snap a photo of a messy room or a project and get steps based on what it sees.',
  'ai_tool', 'native', 'task_breaker',
  (SELECT id FROM public.vault_categories WHERE slug = 'productivity'),
  'beginner',
  ARRAY['tasks', 'productivity', 'decomposition', 'planning', 'subtasks', 'delegation', 'family', 'photo'],
  'published', true, true,
  'Describe a task or snap a photo of what needs to be done. Task Breaker analyzes it and generates a step-by-step plan. Choose Quick (3-5 steps), Detailed (5-10), or Granular (10-20 micro-steps). Review, edit, reorder, then save — the steps become real subtasks on your task list.',
  ARRAY[
    'Start with a clear task name — "Clean the garage" works better than "garage stuff"',
    'Add a description for better results — constraints, deadlines, or who''s involved',
    'Use Granular mode when you need to hand tasks to younger kids who need very specific steps',
    'Snap a photo of a messy room or project for steps based on what AI sees'
  ],
  ARRAY[]::text[], -- tier assignment deferred to post-beta
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.vault_items WHERE guided_mode_key = 'task_breaker');
