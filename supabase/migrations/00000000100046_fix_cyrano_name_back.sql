-- Fix: Cyrano display name is just "Cyrano" in MyAIM (not "Cyrano Me" — that was StewardShip)
UPDATE public.vault_items SET display_title = 'Cyrano' WHERE guided_mode_key = 'cyrano';
UPDATE public.lila_guided_modes SET display_name = 'Cyrano' WHERE mode_key = 'cyrano';
