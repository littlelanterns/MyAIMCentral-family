-- ============================================================================
-- AUTO-INCREMENT iteration_count on best_intentions
-- ============================================================================
-- Bug: iteration_count was a denormalized counter that never got updated.
-- The "today" count worked (live query) but total iterations stayed at 0.
-- Fix: database trigger increments atomically on every intention_iterations INSERT.
-- This works regardless of which frontend version is deployed.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_intention_iteration_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.best_intentions
  SET iteration_count = iteration_count + 1
  WHERE id = NEW.intention_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to make idempotent
DROP TRIGGER IF EXISTS trg_increment_iteration_count ON public.intention_iterations;

CREATE TRIGGER trg_increment_iteration_count
AFTER INSERT ON public.intention_iterations
FOR EACH ROW
EXECUTE FUNCTION public.increment_intention_iteration_count();

-- Also sync any existing mismatched counts right now
UPDATE public.best_intentions bi
SET iteration_count = (
  SELECT COUNT(*)
  FROM public.intention_iterations ii
  WHERE ii.intention_id = bi.id
)
WHERE bi.iteration_count != (
  SELECT COUNT(*)
  FROM public.intention_iterations ii
  WHERE ii.intention_id = bi.id
);
