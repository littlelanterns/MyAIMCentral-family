-- Migration: Add guided_kids to available_to_roles for Higgins + Gratitude tools
-- These tools are appropriate for Guided shell members (ages 8-12)

-- Higgins Say — communication coaching: what to say
UPDATE public.lila_guided_modes SET
  available_to_roles = array_append(available_to_roles, 'guided_kids')
WHERE mode_key = 'higgins_say'
  AND NOT ('guided_kids' = ANY(available_to_roles));

-- Higgins Navigate — communication coaching: how to handle a situation
UPDATE public.lila_guided_modes SET
  available_to_roles = array_append(available_to_roles, 'guided_kids')
WHERE mode_key = 'higgins_navigate'
  AND NOT ('guided_kids' = ANY(available_to_roles));

-- Gratitude — help expressing gratitude to someone
UPDATE public.lila_guided_modes SET
  available_to_roles = array_append(available_to_roles, 'guided_kids')
WHERE mode_key = 'gratitude'
  AND NOT ('guided_kids' = ANY(available_to_roles));
