-- Phase 3 Connector Architecture — Sub-task 3
-- Per-godmother config tables for godmothers that need richer config
-- than inline payload_* columns on contracts.
--
-- Godmothers that use inline payload only (no config table):
--   numerator_godmother  — payload_amount = boost weight
--   money_godmother      — payload_amount = dollar amount
--   victory_godmother    — payload_text = victory description (or NULL for auto)
--   family_victory_godmother — no-op, no config needed

-- ── allowance_godmother_configs ──────────────────────────────────────
-- Pool assignment and calculation overrides for the allowance godmother.
-- Phase 3.5 will add pool_name to support multi-pool allowance.

CREATE TABLE IF NOT EXISTS public.allowance_godmother_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  pool_name       TEXT DEFAULT 'default',
  weight_override DECIMAL,
  include_in_denominator BOOLEAN NOT NULL DEFAULT true,
  is_extra_credit BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── points_godmother_configs ─────────────────────────────────────────
-- Base points, streak bonuses, and creature roll configuration.

CREATE TABLE IF NOT EXISTS public.points_godmother_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  base_points     INTEGER NOT NULL DEFAULT 10,
  streak_bonus_enabled BOOLEAN NOT NULL DEFAULT false,
  streak_bonus_at INTEGER,
  streak_bonus_amount INTEGER,
  trigger_creature_roll BOOLEAN NOT NULL DEFAULT true,
  creature_roll_chance INTEGER DEFAULT 30,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── prize_godmother_configs ──────────────────────────────────────────
-- Prize type, pool reference, IOU text, and expiry for the prize godmother.

CREATE TABLE IF NOT EXISTS public.prize_godmother_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  prize_mode      TEXT NOT NULL DEFAULT 'fixed'
                    CHECK (prize_mode IN ('fixed', 'from_pool', 'from_list')),
  prize_text      TEXT,
  prize_image_url TEXT,
  prize_pool_id   UUID,
  prize_list_id   UUID REFERENCES public.lists(id) ON DELETE SET NULL,
  iou_text        TEXT,
  expires_in_days INTEGER,
  reveal_animation_id UUID REFERENCES public.reveal_animations(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── assign_task_godmother_configs ────────────────────────────────────
-- Template reference, assignment mode, and due date logic for auto-assigning tasks.

CREATE TABLE IF NOT EXISTS public.assign_task_godmother_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  task_title      TEXT,
  task_description TEXT,
  assignment_mode TEXT NOT NULL DEFAULT 'to_doer'
                    CHECK (assignment_mode IN ('to_doer', 'to_specific', 'to_all')),
  specific_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  due_date_offset_days INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── custom_reward_godmother_configs ──────────────────────────────────
-- Delivery mode (text, list reference) and display configuration.

CREATE TABLE IF NOT EXISTS public.custom_reward_godmother_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  delivery_mode   TEXT NOT NULL DEFAULT 'text'
                    CHECK (delivery_mode IN ('text', 'list_reference')),
  reward_text     TEXT,
  reward_list_id  UUID REFERENCES public.lists(id) ON DELETE SET NULL,
  display_icon    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── RLS for all config tables ────────────────────────────────────────

ALTER TABLE public.allowance_godmother_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_godmother_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_godmother_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assign_task_godmother_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_reward_godmother_configs ENABLE ROW LEVEL SECURITY;

-- Mom full access on all config tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'allowance_godmother_configs',
    'points_godmother_configs',
    'prize_godmother_configs',
    'assign_task_godmother_configs',
    'custom_reward_godmother_configs'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY %I_mom_all ON public.%I
         FOR ALL
         USING (family_id IN (
           SELECT fm.family_id FROM public.family_members fm
           WHERE fm.user_id = auth.uid() AND fm.role = ''primary_parent''
         ))
         WITH CHECK (family_id IN (
           SELECT fm.family_id FROM public.family_members fm
           WHERE fm.user_id = auth.uid() AND fm.role = ''primary_parent''
         ))',
      t, t
    );

    EXECUTE format(
      'CREATE POLICY %I_member_read ON public.%I
         FOR SELECT
         USING (family_id IN (
           SELECT fm.family_id FROM public.family_members fm
           WHERE fm.user_id = auth.uid()
         ))',
      t, t
    );
  END LOOP;
END $$;

DO $$ BEGIN RAISE NOTICE 'migration 100203: 5 godmother config tables created with RLS'; END $$;
