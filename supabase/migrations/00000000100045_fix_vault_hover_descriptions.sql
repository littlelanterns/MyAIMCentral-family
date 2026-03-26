-- ============================================================================
-- Fix vault tool short descriptions (hover text) and Cyrano display name
-- Short descriptions per founder spec. Cyrano Me is the correct display name.
-- ============================================================================

-- Quality Time
UPDATE public.vault_items SET
  short_description = 'Plan meaningful time together'
WHERE guided_mode_key = 'quality_time';

-- Gifts
UPDATE public.vault_items SET
  short_description = 'Thoughtful gift ideas'
WHERE guided_mode_key = 'gifts';

-- Observe & Serve
UPDATE public.vault_items SET
  short_description = 'Notice and meet needs'
WHERE guided_mode_key = 'observe_serve';

-- Words of Affirmation
UPDATE public.vault_items SET
  short_description = 'See and say what matters'
WHERE guided_mode_key = 'words_affirmation';

-- Gratitude
UPDATE public.vault_items SET
  short_description = 'Go deeper in thankfulness'
WHERE guided_mode_key = 'gratitude';

-- Cyrano Me (corrected name)
UPDATE public.vault_items SET
  display_title = 'Cyrano Me',
  short_description = 'Help me say what I feel'
WHERE guided_mode_key = 'cyrano';

-- Higgins Say — keep existing short description but tighten
UPDATE public.vault_items SET
  short_description = 'Craft the right words for any conversation'
WHERE guided_mode_key = 'higgins_say';

-- Higgins Navigate — keep existing short description but tighten
UPDATE public.vault_items SET
  short_description = 'Process a situation and find your path forward'
WHERE guided_mode_key = 'higgins_navigate';

-- Also update the guided mode display name for Cyrano
UPDATE public.lila_guided_modes SET
  display_name = 'Cyrano Me'
WHERE mode_key = 'cyrano';
