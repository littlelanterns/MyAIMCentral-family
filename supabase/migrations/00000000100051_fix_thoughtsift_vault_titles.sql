-- Fix ThoughtSift vault item titles: display_title = PRD tool name,
-- hook phrases move to short_description or portal_description

UPDATE public.vault_items SET
  display_title = 'Board of Directors',
  detail_title = 'Board of Directors',
  short_description = 'What if you could get advice from Benjamin Franklin, Abigail Adams, and Gandalf all at once? Assemble your own advisory panel.'
WHERE guided_mode_key = 'board_of_directors';

UPDATE public.vault_items SET
  display_title = 'Perspective Shifter',
  detail_title = 'Perspective Shifter',
  short_description = 'Same situation, different glasses. Switch between frameworks to find the angle that unlocks what you could not see on your own.'
WHERE guided_mode_key = 'perspective_shifter';

UPDATE public.vault_items SET
  display_title = 'Decision Guide',
  detail_title = 'Decision Guide',
  short_description = 'Stuck between two options? Fifteen structured frameworks to think more clearly — LiLa picks the right one for your situation.'
WHERE guided_mode_key = 'decision_guide';

UPDATE public.vault_items SET
  display_title = 'Mediator',
  detail_title = 'Mediator',
  short_description = 'Whether it is a marriage argument, a teenager slamming doors, a workplace tension, or a battle inside your own head — find clarity before you re-engage.'
WHERE guided_mode_key = 'mediator';

UPDATE public.vault_items SET
  display_title = 'Translator',
  detail_title = 'Translator',
  short_description = 'Rewrite anything as a pirate, Shakespeare, Gen Z, or eleven other styles. Also useful: soften a harsh email, simplify for a five-year-old, or go full formal.'
WHERE guided_mode_key = 'translator';
