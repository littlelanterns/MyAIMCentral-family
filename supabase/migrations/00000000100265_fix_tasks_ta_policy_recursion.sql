-- ─────────────────────────────────────────────────────────────────────────────
-- 00000000100265_fix_tasks_ta_policy_recursion.sql
--
-- P0 fix: "infinite recursion detected in policy for relation tasks" (42P17)
-- on EVERY authenticated tasks UPDATE since migration 100262/100263.
--
-- The cycle:
--   tasks UPDATE → policy "tasks_update_assigned_member" USING subqueries
--   task_assignments → its policy "ta_family_device" (FOR ALL, so its USING
--   applies to that read) subqueries tasks → tasks policies → loop.
--
-- Found by the founder pressing [Return] on a claimed opportunity from the
-- Family Overview (FO-COMMAND-CENTER unclaim = UPDATE tasks SET
-- status='cancelled'), but the blast radius was every task edit by every
-- logged-in user. Service role was unaffected (bypasses RLS), which is why
-- server-side probes succeeded.
--
-- Fix: break the cycle with the established SECURITY DEFINER helper pattern
-- (util.is_family_shadow_of / util.finance_grant_level precedent). The
-- helper's internal read of tasks runs as the function owner, so tasks RLS
-- is not re-entered and the loop disappears. Semantics are IDENTICAL to the
-- old inline subquery: "this assignment's task belongs to a family whose
-- shadow account is the caller."
--
-- Idempotent: CREATE OR REPLACE + DROP POLICY IF EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION util.task_in_shadow_family(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.family_members fm ON fm.family_id = t.family_id
    WHERE t.id = p_task_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'family'
  );
$$;

REVOKE ALL ON FUNCTION util.task_in_shadow_family(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.task_in_shadow_family(UUID) TO authenticated;

COMMENT ON FUNCTION util.task_in_shadow_family(UUID) IS
  'True when the given task belongs to a family whose family-shadow account (role=family) is the caller. SECURITY DEFINER so policy evaluation does not re-enter tasks RLS — breaks the tasks↔task_assignments policy recursion (fix 100265).';

DROP POLICY IF EXISTS "ta_family_device" ON public.task_assignments;
CREATE POLICY "ta_family_device" ON public.task_assignments
  FOR ALL
  USING (util.task_in_shadow_family(task_id))
  WITH CHECK (util.task_in_shadow_family(task_id));

COMMENT ON POLICY "ta_family_device" ON public.task_assignments IS
  'Family-device write restoration (Convention #273/#276) — rebuilt on util.task_in_shadow_family() in 100265 to break the tasks↔task_assignments RLS recursion. Same semantics as the 100262 inline subquery.';
