-- Phase 3 Worker F — Sub-task 20: Drop legacy roll_creature_for_completion RPC
-- All callers replaced by connector deed firings (migration 100219).
-- The points_godmother + gamification pipeline now handles all point/creature/page logic.

DROP FUNCTION IF EXISTS public.roll_creature_for_completion(UUID);

DO $$ BEGIN RAISE NOTICE 'migration 100221: dropped roll_creature_for_completion RPC'; END $$;
