-- ============================================================================
-- Migration 00000000100109: cs_select_member — creator-can-see-own-space fix
-- ============================================================================
--
-- Problem:
--   PostgREST's pattern of `.insert(...).select('*').single()` runs TWO
--   consecutive policy checks:
--     1. INSERT check (WITH CHECK clause) — passes for Jordan after 100108
--     2. SELECT check (USING clause) — runs on the returned row
--
--   The SELECT policy `cs_select_member` requires the caller to already be a
--   member of the space (`id = ANY(get_my_space_ids())`), but at this exact
--   moment no membership row exists yet — `findOrCreateDirectSpace` and
--   `useCreateSpace` insert the space FIRST, then insert the membership rows.
--   So the return-the-row SELECT fires 42501 and the entire flow bails out,
--   manifesting as "Jordan clicks Send and nothing happens".
--
--   This is why mom works — `is_primary_parent_of(family_id)` short-circuits
--   the SELECT check for her. Kids have no such branch.
--
-- Fix:
--   Add a third OR branch to `cs_select_member`: the creator of a space can
--   always read it. This is semantically obvious (you just made it) and
--   unblocks the create-space-then-return-the-row flow for non-parent users.
--
--   No data exposure — a kid can only see their OWN created spaces this way,
--   same as any other row they insert.
-- ============================================================================

DROP POLICY IF EXISTS "cs_select_member" ON public.conversation_spaces;

CREATE POLICY "cs_select_member" ON public.conversation_spaces
  FOR SELECT USING (
    -- Existing: user is a member of the space
    id = ANY(public.get_my_space_ids())
    -- Existing: user is primary_parent of the family
    OR public.is_primary_parent_of(family_id)
    -- NEW: user is the creator of this space (lets `.insert().select()` return
    -- the new row to the caller before membership rows are inserted).
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.id = conversation_spaces.created_by
    )
  );
