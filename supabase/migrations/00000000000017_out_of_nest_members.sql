-- ============================================================================
-- Out of Nest Members table (PRD-15)
-- Separate from family_members: different permission model, no dashboard,
-- no family tools access, email-only participation in conversation spaces.
-- Out of Nest = descendants and their spouses (below mom on the family tree).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.out_of_nest_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  relationship TEXT NOT NULL,
  avatar_url TEXT,
  invited_by UUID NOT NULL REFERENCES public.family_members(id),
  invitation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (invitation_status IN ('pending', 'accepted', 'declined')),
  user_id UUID REFERENCES auth.users(id),
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oonm_family ON public.out_of_nest_members(family_id);
CREATE INDEX idx_oonm_user ON public.out_of_nest_members(user_id) WHERE user_id IS NOT NULL;

CREATE TRIGGER trg_oonm_updated_at
  BEFORE UPDATE ON public.out_of_nest_members
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.out_of_nest_members ENABLE ROW LEVEL SECURITY;

-- Mom can manage all Out of Nest members
CREATE POLICY "oonm_manage_primary_parent" ON public.out_of_nest_members
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- Family members can read Out of Nest members (for names/avatars in conversations)
CREATE POLICY "oonm_select_family" ON public.out_of_nest_members
  FOR SELECT USING (
    family_id = public.get_my_family_id()
  );
