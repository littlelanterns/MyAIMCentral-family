-- Living Shopping List & Shopping Mode — V1 Schema
-- PRD-09B Enhancement: Always-On Lists + Store-Filtered Composed View

-- ─── New columns on lists ────────────────────────────────────────────

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS is_always_on BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_checked_visibility_hours INTEGER NOT NULL DEFAULT 48,
  ADD COLUMN IF NOT EXISTS default_purchase_history_days INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS default_auto_archive_days INTEGER NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS include_in_shopping_mode BOOLEAN NOT NULL DEFAULT false;

-- Shopping lists default to always-on + included in shopping mode.
-- Trigger sets these on INSERT when list_type = 'shopping'.
CREATE OR REPLACE FUNCTION public.set_shopping_list_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.list_type = 'shopping' THEN
    IF NEW.is_always_on IS NOT DISTINCT FROM false AND TG_OP = 'INSERT' THEN
      NEW.is_always_on := true;
    END IF;
    IF NEW.include_in_shopping_mode IS NOT DISTINCT FROM false AND TG_OP = 'INSERT' THEN
      NEW.include_in_shopping_mode := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_shopping_list_defaults ON public.lists;
CREATE TRIGGER trg_set_shopping_list_defaults
  BEFORE INSERT ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION public.set_shopping_list_defaults();

-- Backfill existing shopping lists
UPDATE public.lists
SET is_always_on = true,
    include_in_shopping_mode = true
WHERE list_type = 'shopping'
  AND is_always_on = false;

-- ─── New columns on list_items ───────────────────────────────────────

ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS store_tags TEXT[],
  ADD COLUMN IF NOT EXISTS store_category TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ─── list_section_settings table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.list_section_settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  list_id                  UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  section_name             TEXT NOT NULL,
  checked_visibility_hours INTEGER,
  purchase_history_days    INTEGER,
  auto_archive_days        INTEGER,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (list_id, section_name)
);

ALTER TABLE public.list_section_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY list_section_settings_mom_all ON public.list_section_settings
  FOR ALL
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

CREATE POLICY list_section_settings_member_read ON public.list_section_settings
  FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

-- ─── purchase_history table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.purchase_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  list_item_id    UUID NOT NULL REFERENCES public.list_items(id) ON DELETE CASCADE,
  list_id         UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  item_name       TEXT NOT NULL,
  store_section   TEXT,
  store_category  TEXT,
  quantity        NUMERIC,
  quantity_unit   TEXT,
  purchased_by    UUID NOT NULL REFERENCES public.family_members(id) ON DELETE SET NULL,
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  price_paid      NUMERIC
);

ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_history_mom_all ON public.purchase_history
  FOR ALL
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

CREATE POLICY purchase_history_member_read_own ON public.purchase_history
  FOR SELECT
  USING (
    purchased_by IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

CREATE POLICY purchase_history_member_insert ON public.purchase_history
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_purchase_history_family_store_date
  ON public.purchase_history (family_id, store_section, purchased_at);

CREATE INDEX IF NOT EXISTS idx_purchase_history_family_item_date
  ON public.purchase_history (family_id, item_name, purchased_at);

CREATE INDEX IF NOT EXISTS idx_purchase_history_family_date
  ON public.purchase_history (family_id, purchased_at);

-- ─── Auto-archive cron job ───────────────────────────────────────────
-- Runs daily at 03:10 UTC. Convention #246: uses util.invoke_edge_function.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'invoke_edge_function' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'util')) THEN
    PERFORM cron.schedule(
      'shopping-list-auto-archive',
      '10 3 * * *',
      $cron$
        SELECT util.invoke_edge_function('shopping-list-auto-archive');
      $cron$
    );
    RAISE NOTICE 'migration 100230: scheduled shopping-list-auto-archive cron job';
  ELSE
    RAISE NOTICE 'util.invoke_edge_function not yet present; cron job not scheduled';
  END IF;
END;
$$;

-- ─── Feature keys ────────────────────────────────────────────────────

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('shopping_mode', 'Shopping Mode', 'Composed cross-list shopping view filtered by store', 'PRD-09B'),
  ('lists_always_on', 'Always-On Lists', 'Lists that never complete — permanent family infrastructure', 'PRD-09B'),
  ('lists_purchase_history', 'Purchase History', 'Track purchases over time for shopping intelligence', 'PRD-09B')
ON CONFLICT (feature_key) DO NOTHING;

-- ─── Feature access (all tiers, all roles during beta) ───────────────

INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT fk.val, rg.val, st.id, true
FROM (VALUES ('shopping_mode'), ('lists_always_on'), ('lists_purchase_history')) AS fk(val)
CROSS JOIN (VALUES ('mom'), ('dad_adults'), ('independent_teens')) AS rg(val)
CROSS JOIN public.subscription_tiers st
WHERE st.slug = 'essential'
ON CONFLICT (feature_key, role_group) DO NOTHING;

DO $$ BEGIN RAISE NOTICE 'migration 100230: Living Shopping List & Shopping Mode schema complete'; END $$;
