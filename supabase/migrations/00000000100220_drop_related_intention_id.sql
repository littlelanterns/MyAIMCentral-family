-- Phase 3 Worker F — Sub-task 19: Drop tasks.related_intention_id
-- Zero readers, zero writers, zero data. Superseded by connector contracts.

ALTER TABLE public.tasks DROP COLUMN IF EXISTS related_intention_id;

RAISE NOTICE 'migration 100220: dropped tasks.related_intention_id';
