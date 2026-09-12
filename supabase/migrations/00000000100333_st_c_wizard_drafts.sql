-- ============================================================================
-- STUDIO-EXPERIENCE ST-C — Real save-and-return: wizard_drafts (server-backed)
-- ============================================================================
-- Founder-confirmed 2026-09-11 (dispatch decision Q1): drafts live in their
-- own table rather than as an `is_draft` flag on each finished primitive
-- (Convention 250's literal wording). A half-built wizard isn't a list, a
-- routine, or a chart yet — it has no primitive row to carry a flag until
-- the wizard actually deploys. `wizard_drafts` is the pre-primitive home;
-- deploying a draft creates the real primitive (tasks/lists/widgets/etc.)
-- through the wizard's existing deploy path exactly as it does today, then
-- the draft row is deleted. This is a deliberate, disclosed amendment to
-- Convention 250's is_draft wording, not a silent deviation — recorded here
-- and in .claude/rules/current-builds/STUDIO-EXPERIENCE.md ("## ST-C").
--
-- Replaces the Phase 3.7 localStorage-only useWizardDraft (four wizards:
-- ListReveal, RepeatedActionChart, RewardsList, SharedTaskList) with a
-- server-backed table so drafts survive across devices and browsers, per
-- Composition doc §2.2. A client-side migration (see
-- src/components/studio/wizards/useWizardDraft.ts) upserts any existing
-- localStorage drafts into this table on first load, then clears the local
-- keys — never strands a founder-family draft.
--
-- Access model: Studio itself is gated at the route level to mom +
-- `studio`-granted additional_adults (Convention #274, `<GrantedRoute
-- grant="studio">` in App.tsx — a family-wide grant, no per-kid rows).
-- wizard_drafts therefore does NOT need family-shadow write policies (the
-- wizard_templates precedent, migration 100229, carries none either) — it
-- follows the same simple family-scoped-write pattern every Studio-adjacent
-- table uses, with an added "mom sees/manages every draft in her family"
-- clause (mom-sees-all, per CLAUDE.md's baseline RLS convention) layered on
-- top of "you always see/manage your own."
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wizard_drafts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id      UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  wizard_type    TEXT NOT NULL,
  title          TEXT NOT NULL DEFAULT 'Untitled',
  state          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_saved_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wizard_drafts_family_type
  ON public.wizard_drafts (family_id, wizard_type, last_saved_at DESC);

CREATE INDEX IF NOT EXISTS idx_wizard_drafts_member
  ON public.wizard_drafts (member_id);

ALTER TABLE public.wizard_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wizard_drafts_select" ON public.wizard_drafts;
CREATE POLICY "wizard_drafts_select" ON public.wizard_drafts
  FOR SELECT TO authenticated
  USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "wizard_drafts_insert" ON public.wizard_drafts;
CREATE POLICY "wizard_drafts_insert" ON public.wizard_drafts
  FOR INSERT TO authenticated
  WITH CHECK (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "wizard_drafts_update" ON public.wizard_drafts;
CREATE POLICY "wizard_drafts_update" ON public.wizard_drafts
  FOR UPDATE TO authenticated
  USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  )
  WITH CHECK (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "wizard_drafts_delete" ON public.wizard_drafts;
CREATE POLICY "wizard_drafts_delete" ON public.wizard_drafts
  FOR DELETE TO authenticated
  USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

COMMENT ON TABLE public.wizard_drafts IS
  'STUDIO-EXPERIENCE ST-C: server-backed Studio wizard save-and-return. One row per in-progress wizard instance; deleted when the wizard deploys or mom explicitly discards. Not family-shadow-writable by design — Studio is mom/studio-granted-adult-only (Convention #274), matching the wizard_templates precedent (migration 100229).';

-- ── Self-verification ────────────────────────────────────────────────────
DO $$
DECLARE
  v_policy_count INTEGER;
  v_rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class WHERE oid = 'public.wizard_drafts'::regclass;
  IF NOT v_rls_enabled THEN
    RAISE EXCEPTION 'wizard_drafts: RLS not enabled';
  END IF;

  SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wizard_drafts';
  IF v_policy_count <> 4 THEN
    RAISE EXCEPTION 'wizard_drafts: expected 4 policies (select/insert/update/delete), found %', v_policy_count;
  END IF;

  RAISE NOTICE 'wizard_drafts: RLS enabled, % policies present — OK', v_policy_count;
END $$;
