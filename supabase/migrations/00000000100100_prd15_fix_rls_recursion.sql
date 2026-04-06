-- PRD-15 RLS Fix: Break infinite recursion in conversation_space_members policies
--
-- The SELECT policy on conversation_space_members queries itself to check if the
-- current user is in the space. This creates infinite recursion. The fix uses a
-- SECURITY DEFINER helper function that bypasses RLS to resolve the user's
-- family_member_id(s), then a second helper to resolve their space memberships.

-- ============================================================
-- Helper function: get current user's family_member_ids (bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_member_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT array_agg(id)
  FROM public.family_members
  WHERE user_id = auth.uid();
$$;

-- ============================================================
-- Helper function: get space_ids the current user belongs to (bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_space_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT array_agg(DISTINCT csm.space_id)
  FROM public.conversation_space_members csm
  WHERE csm.family_member_id = ANY(public.get_my_member_ids());
$$;

-- ============================================================
-- Helper function: check if current user is primary_parent
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_primary_parent_of(p_family_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = auth.uid()
      AND family_id = p_family_id
      AND role = 'primary_parent'
  );
$$;


-- ============================================================
-- Fix conversation_space_members policies (the recursion source)
-- ============================================================

DROP POLICY IF EXISTS "csm_select_member" ON public.conversation_space_members;
CREATE POLICY "csm_select_member" ON public.conversation_space_members
  FOR SELECT USING (
    space_id = ANY(public.get_my_space_ids())
  );

DROP POLICY IF EXISTS "csm_insert_admin_or_parent" ON public.conversation_space_members;
CREATE POLICY "csm_insert_admin_or_parent" ON public.conversation_space_members
  FOR INSERT WITH CHECK (
    -- Space admin can add
    EXISTS (
      SELECT 1 FROM public.conversation_space_members csm2
      WHERE csm2.space_id = conversation_space_members.space_id
        AND csm2.family_member_id = ANY(public.get_my_member_ids())
        AND csm2.role = 'admin'
    )
    -- OR primary_parent of the family that owns the space
    OR EXISTS (
      SELECT 1 FROM public.conversation_spaces cs
      WHERE cs.id = conversation_space_members.space_id
        AND public.is_primary_parent_of(cs.family_id)
    )
  );

DROP POLICY IF EXISTS "csm_delete_admin_or_parent" ON public.conversation_space_members;
CREATE POLICY "csm_delete_admin_or_parent" ON public.conversation_space_members
  FOR DELETE USING (
    -- Space admin can remove
    EXISTS (
      SELECT 1 FROM public.conversation_space_members csm2
      WHERE csm2.space_id = conversation_space_members.space_id
        AND csm2.family_member_id = ANY(public.get_my_member_ids())
        AND csm2.role = 'admin'
    )
    -- OR primary_parent
    OR EXISTS (
      SELECT 1 FROM public.conversation_spaces cs
      WHERE cs.id = conversation_space_members.space_id
        AND public.is_primary_parent_of(cs.family_id)
    )
    -- OR removing yourself
    OR family_member_id = ANY(public.get_my_member_ids())
  );


-- ============================================================
-- Fix conversation_spaces policies (referenced csm which caused recursion)
-- ============================================================

DROP POLICY IF EXISTS "cs_select_member" ON public.conversation_spaces;
CREATE POLICY "cs_select_member" ON public.conversation_spaces
  FOR SELECT USING (
    id = ANY(public.get_my_space_ids())
    OR public.is_primary_parent_of(family_id)
  );

DROP POLICY IF EXISTS "cs_insert_member" ON public.conversation_spaces;
CREATE POLICY "cs_insert_member" ON public.conversation_spaces
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.id = ANY(public.get_my_member_ids())
    )
    AND created_by = ANY(public.get_my_member_ids())
  );

DROP POLICY IF EXISTS "cs_update_creator_or_parent" ON public.conversation_spaces;
CREATE POLICY "cs_update_creator_or_parent" ON public.conversation_spaces
  FOR UPDATE USING (
    created_by = ANY(public.get_my_member_ids())
    OR public.is_primary_parent_of(family_id)
  );

DROP POLICY IF EXISTS "cs_delete_parent" ON public.conversation_spaces;
CREATE POLICY "cs_delete_parent" ON public.conversation_spaces
  FOR DELETE USING (
    public.is_primary_parent_of(family_id)
  );


-- ============================================================
-- Fix conversation_threads policies
-- ============================================================

DROP POLICY IF EXISTS "ct_select_space_member" ON public.conversation_threads;
CREATE POLICY "ct_select_space_member" ON public.conversation_threads
  FOR SELECT USING (
    space_id = ANY(public.get_my_space_ids())
  );

DROP POLICY IF EXISTS "ct_insert_space_member" ON public.conversation_threads;
CREATE POLICY "ct_insert_space_member" ON public.conversation_threads
  FOR INSERT WITH CHECK (
    space_id = ANY(public.get_my_space_ids())
    AND started_by = ANY(public.get_my_member_ids())
  );

DROP POLICY IF EXISTS "ct_update_starter_or_parent" ON public.conversation_threads;
CREATE POLICY "ct_update_starter_or_parent" ON public.conversation_threads
  FOR UPDATE USING (
    started_by = ANY(public.get_my_member_ids())
    OR EXISTS (
      SELECT 1 FROM public.conversation_spaces cs
      WHERE cs.id = conversation_threads.space_id
        AND public.is_primary_parent_of(cs.family_id)
    )
  );


-- ============================================================
-- Fix messages policies
-- ============================================================

DROP POLICY IF EXISTS "msg_select_space_member" ON public.messages;
CREATE POLICY "msg_select_space_member" ON public.messages
  FOR SELECT USING (
    thread_id IN (
      SELECT ct.id FROM public.conversation_threads ct
      WHERE ct.space_id = ANY(public.get_my_space_ids())
    )
  );

DROP POLICY IF EXISTS "msg_insert_space_member" ON public.messages;
CREATE POLICY "msg_insert_space_member" ON public.messages
  FOR INSERT WITH CHECK (
    thread_id IN (
      SELECT ct.id FROM public.conversation_threads ct
      WHERE ct.space_id = ANY(public.get_my_space_ids())
    )
  );

DROP POLICY IF EXISTS "msg_update_own" ON public.messages;
CREATE POLICY "msg_update_own" ON public.messages
  FOR UPDATE USING (
    sender_member_id = ANY(public.get_my_member_ids())
    AND message_type = 'user'
  );


-- ============================================================
-- Fix remaining policies that used subqueries on family_members
-- (not recursive, but let's be consistent with the helper pattern)
-- ============================================================

DROP POLICY IF EXISTS "mrs_own" ON public.message_read_status;
CREATE POLICY "mrs_own" ON public.message_read_status
  FOR ALL USING (
    family_member_id = ANY(public.get_my_member_ids())
  );

DROP POLICY IF EXISTS "mcs_select_own_or_parent" ON public.message_coaching_settings;
CREATE POLICY "mcs_select_own_or_parent" ON public.message_coaching_settings
  FOR SELECT USING (
    family_member_id = ANY(public.get_my_member_ids())
    OR public.is_primary_parent_of(family_id)
  );

DROP POLICY IF EXISTS "mcs_write_parent" ON public.message_coaching_settings;
CREATE POLICY "mcs_write_parent" ON public.message_coaching_settings
  FOR ALL USING (
    public.is_primary_parent_of(family_id)
  );

DROP POLICY IF EXISTS "mmp_select_own_or_parent" ON public.member_messaging_permissions;
CREATE POLICY "mmp_select_own_or_parent" ON public.member_messaging_permissions
  FOR SELECT USING (
    member_id = ANY(public.get_my_member_ids())
    OR public.is_primary_parent_of(family_id)
  );

DROP POLICY IF EXISTS "mmp_write_parent" ON public.member_messaging_permissions;
CREATE POLICY "mmp_write_parent" ON public.member_messaging_permissions
  FOR ALL USING (
    public.is_primary_parent_of(family_id)
  );

DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
CREATE POLICY "notif_select_own" ON public.notifications
  FOR SELECT USING (
    recipient_member_id = ANY(public.get_my_member_ids())
  );

DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;
CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE USING (
    recipient_member_id = ANY(public.get_my_member_ids())
  );

DROP POLICY IF EXISTS "np_select_own" ON public.notification_preferences;
CREATE POLICY "np_select_own" ON public.notification_preferences
  FOR SELECT USING (
    family_member_id = ANY(public.get_my_member_ids())
  );

DROP POLICY IF EXISTS "np_write_own_or_parent" ON public.notification_preferences;
CREATE POLICY "np_write_own_or_parent" ON public.notification_preferences
  FOR ALL USING (
    family_member_id = ANY(public.get_my_member_ids())
    OR public.is_primary_parent_of(family_id)
  );

DROP POLICY IF EXISTS "fr_select_participant_or_parent" ON public.family_requests;
CREATE POLICY "fr_select_participant_or_parent" ON public.family_requests
  FOR SELECT USING (
    sender_member_id = ANY(public.get_my_member_ids())
    OR recipient_member_id = ANY(public.get_my_member_ids())
    OR public.is_primary_parent_of(family_id)
  );

DROP POLICY IF EXISTS "fr_insert_own" ON public.family_requests;
CREATE POLICY "fr_insert_own" ON public.family_requests
  FOR INSERT WITH CHECK (
    sender_member_id = ANY(public.get_my_member_ids())
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.id = ANY(public.get_my_member_ids())
    )
  );

DROP POLICY IF EXISTS "fr_update_recipient_or_parent" ON public.family_requests;
CREATE POLICY "fr_update_recipient_or_parent" ON public.family_requests
  FOR UPDATE USING (
    recipient_member_id = ANY(public.get_my_member_ids())
    OR public.is_primary_parent_of(family_id)
  );
