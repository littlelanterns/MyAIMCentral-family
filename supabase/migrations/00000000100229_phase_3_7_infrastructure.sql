-- Phase 3.7 — Wizards & Seeded Templates infrastructure
-- Worker A: wizard_templates, reveal_animation_pools + members,
-- reveal_animations.tag, contracts.godmother_type CHECK fix.

-- ── 1. wizard_templates ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wizard_templates (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id               UUID REFERENCES public.families(id) ON DELETE CASCADE,
  template_type           TEXT NOT NULL,
  title                   TEXT NOT NULL,
  description             TEXT,
  template_source         TEXT NOT NULL DEFAULT 'system'
                            CHECK (template_source IN ('system', 'family', 'community')),
  is_example              BOOLEAN NOT NULL DEFAULT false,
  config                  JSONB NOT NULL DEFAULT '{}',
  cloned_from_template_id UUID REFERENCES public.wizard_templates(id) ON DELETE SET NULL,
  original_author_id      UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  tags                    JSONB NOT NULL DEFAULT '[]',
  sharing_mode            TEXT NOT NULL DEFAULT 'family',
  usage_count             INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at             TIMESTAMPTZ
);

ALTER TABLE public.wizard_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wizard_templates_select" ON public.wizard_templates
  FOR SELECT TO authenticated
  USING (
    family_id IS NULL
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid()
    )
  );

CREATE POLICY "wizard_templates_insert" ON public.wizard_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    family_id IS NOT NULL
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid()
    )
  );

CREATE POLICY "wizard_templates_update" ON public.wizard_templates
  FOR UPDATE TO authenticated
  USING (
    family_id IS NOT NULL
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid()
    )
  );

CREATE POLICY "wizard_templates_delete" ON public.wizard_templates
  FOR DELETE TO authenticated
  USING (
    family_id IS NOT NULL
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid()
    )
  );

-- ── 2. reveal_animation_pools ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reveal_animation_pools (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID REFERENCES public.families(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  sharing_mode  TEXT NOT NULL DEFAULT 'family',
  created_by    UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at   TIMESTAMPTZ
);

ALTER TABLE public.reveal_animation_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reveal_animation_pools_select" ON public.reveal_animation_pools
  FOR SELECT TO authenticated
  USING (
    family_id IS NULL
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid()
    )
  );

CREATE POLICY "reveal_animation_pools_insert" ON public.reveal_animation_pools
  FOR INSERT TO authenticated
  WITH CHECK (
    family_id IS NOT NULL
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid()
    )
  );

CREATE POLICY "reveal_animation_pools_update" ON public.reveal_animation_pools
  FOR UPDATE TO authenticated
  USING (
    family_id IS NOT NULL
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid()
    )
  );

CREATE POLICY "reveal_animation_pools_delete" ON public.reveal_animation_pools
  FOR DELETE TO authenticated
  USING (
    family_id IS NOT NULL
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
       WHERE fm.user_id = auth.uid()
    )
  );

-- ── 3. reveal_animation_pool_members ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reveal_animation_pool_members (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id               UUID NOT NULL REFERENCES public.reveal_animation_pools(id) ON DELETE CASCADE,
  reveal_animation_id   UUID NOT NULL REFERENCES public.reveal_animations(id) ON DELETE CASCADE,
  weight                INTEGER NOT NULL DEFAULT 1,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pool_id, reveal_animation_id)
);

ALTER TABLE public.reveal_animation_pool_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reveal_animation_pool_members_select" ON public.reveal_animation_pool_members
  FOR SELECT TO authenticated
  USING (
    pool_id IN (
      SELECT rap.id FROM public.reveal_animation_pools rap
       WHERE rap.family_id IS NULL
          OR rap.family_id IN (
            SELECT fm.family_id FROM public.family_members fm
             WHERE fm.user_id = auth.uid()
          )
    )
  );

CREATE POLICY "reveal_animation_pool_members_insert" ON public.reveal_animation_pool_members
  FOR INSERT TO authenticated
  WITH CHECK (
    pool_id IN (
      SELECT rap.id FROM public.reveal_animation_pools rap
       WHERE rap.family_id IS NOT NULL
         AND rap.family_id IN (
           SELECT fm.family_id FROM public.family_members fm
            WHERE fm.user_id = auth.uid()
         )
    )
  );

CREATE POLICY "reveal_animation_pool_members_update" ON public.reveal_animation_pool_members
  FOR UPDATE TO authenticated
  USING (
    pool_id IN (
      SELECT rap.id FROM public.reveal_animation_pools rap
       WHERE rap.family_id IS NOT NULL
         AND rap.family_id IN (
           SELECT fm.family_id FROM public.family_members fm
            WHERE fm.user_id = auth.uid()
         )
    )
  );

CREATE POLICY "reveal_animation_pool_members_delete" ON public.reveal_animation_pool_members
  FOR DELETE TO authenticated
  USING (
    pool_id IN (
      SELECT rap.id FROM public.reveal_animation_pools rap
       WHERE rap.family_id IS NOT NULL
         AND rap.family_id IN (
           SELECT fm.family_id FROM public.family_members fm
            WHERE fm.user_id = auth.uid()
         )
    )
  );

-- ── 4. Add tag column to reveal_animations ────────────────────────────

ALTER TABLE public.reveal_animations
  ADD COLUMN IF NOT EXISTS tag TEXT;

-- ── 5. Fix contracts.godmother_type CHECK ──────────────────────────────
-- Migration 100228 accidentally dropped recognition_godmother from the
-- CHECK. This restores the complete list of all 14 godmother types.

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_godmother_type_check;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_godmother_type_check
    CHECK (godmother_type IN (
      'allowance_godmother',
      'numerator_godmother',
      'money_godmother',
      'points_godmother',
      'prize_godmother',
      'victory_godmother',
      'family_victory_godmother',
      'custom_reward_godmother',
      'assign_task_godmother',
      'recognition_godmother',
      'creature_godmother',
      'page_unlock_godmother',
      'coloring_reveal_godmother',
      'widget_data_point_godmother'
    ));

DO $$ BEGIN RAISE NOTICE 'migration 100229: Phase 3.7 infrastructure — wizard_templates, reveal_animation_pools, tag column, godmother CHECK fix'; END $$;
