-- MyAIM Central v2 — LiLa Opening Messages Refresh + Task Breaker Modes (PRD-05)
-- Migration 13 seeded opening_messages for the 4 core modes.
-- This migration updates them to the canonical final strings and adds task_breaker modes.

-- ============================================================
-- 1. Update opening messages for the 4 core modes (canonical final copy)
-- ============================================================

UPDATE public.lila_guided_modes
  SET opening_messages = '["Hey! I''m LiLa Help — happy to help with anything. What''s going on?", "Hi there! Having trouble with something, or just have a question? I''m here.", "Welcome! I can help with account stuff, features, or troubleshooting — whatever you need."]'::jsonb
  WHERE mode_key = 'help';

UPDATE public.lila_guided_modes
  SET opening_messages = '["Hi! I''m here to help you get the most out of MyAIM. Want to explore something new, or need guidance on a feature?", "Hey! Ready to discover something? I know every corner of this app. What are you working on?", "Welcome! Whether you''re setting up something new or want to level up a feature, I''m here to guide you."]'::jsonb
  WHERE mode_key = 'assist';

UPDATE public.lila_guided_modes
  SET opening_messages = '["Hey. What''s on your mind?", "Hi there. I''m here whenever you''re ready — no rush.", "Hey! Want to think something through, or just need to talk?"]'::jsonb
  WHERE mode_key = 'general';

UPDATE public.lila_guided_modes
  SET opening_messages = '["Ready to craft the perfect prompt? Tell me what you''re trying to create and which AI tool you''re using.", "Hey! Let''s optimize. Paste a prompt you want to improve, or describe what you''re trying to get an AI to do.", "Prompt workshop time! What are you working with — text, images, or something else?"]'::jsonb
  WHERE mode_key = 'optimizer';

-- ============================================================
-- 2. Upsert task_breaker and task_breaker_image guided modes
-- ============================================================

INSERT INTO public.lila_guided_modes (
  mode_key, display_name, parent_mode, avatar_key, model_tier,
  context_sources, person_selector, opening_messages, system_prompt_key,
  available_to_roles, sort_order, is_active
)
VALUES
  (
    'task_breaker',
    'Task Breaker',
    'assist',
    'sitting',
    'sonnet',
    '{}',
    false,
    '["Got a big task? Let''s break it down into manageable steps. What needs to get done?", "Task Breaker mode! Describe the task and I''ll help you split it into bite-sized pieces.", "What''s the task? I''ll help you figure out the steps to get it done."]'::jsonb,
    'task_breaker',
    '{"mom","additional_adult","independent"}',
    10,
    true
  ),
  (
    'task_breaker_image',
    'Visual Task Breaker',
    'assist',
    'sitting',
    'sonnet',
    '{}',
    false,
    '["Send me a photo of what needs to be done and I''ll create a step-by-step plan!", "Visual mode! Snap a photo of the mess, the project, or the instructions and I''ll break it down.", "Show me what you''re working with — a photo helps me create better steps."]'::jsonb,
    'task_breaker_image',
    '{"mom"}',
    11,
    true
  )
ON CONFLICT (mode_key) DO UPDATE
  SET opening_messages = EXCLUDED.opening_messages;
