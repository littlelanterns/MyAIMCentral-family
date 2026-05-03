-- Phase 3 Connector Architecture — Sub-task 5
-- Supporting tables for deferred stroke_of evaluation + audit trail.
-- Cron schedules for end_of_day, end_of_week, and lifecycle sweep.

-- ── deferred_grants ──────────────────────────────────────────────────
-- Queue for non-immediate stroke_of values. Cron sweepers pick these up
-- and invoke the godmother when the timing condition is met.

CREATE TABLE IF NOT EXISTS public.deferred_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  contract_id     UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  deed_firing_id  UUID NOT NULL REFERENCES public.deed_firings(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  stroke_of       TEXT NOT NULL,
  stroke_of_time  TIME,
  scheduled_for   TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'granted', 'expired', 'cancelled')),
  granted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deferred_grants_pending_idx
  ON public.deferred_grants (family_id, stroke_of, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS deferred_grants_member_idx
  ON public.deferred_grants (family_member_id, status)
  WHERE status = 'pending';

-- ── contract_grant_log ───────────────────────────────────────────────
-- Append-only audit trail of all grants. Idempotency enforced by
-- UNIQUE on (deed_firing_id, contract_id) — no double-grants.

CREATE TABLE IF NOT EXISTS public.contract_grant_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  deed_firing_id  UUID NOT NULL REFERENCES public.deed_firings(id) ON DELETE CASCADE,
  contract_id     UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  godmother_type  TEXT NOT NULL,
  status          TEXT NOT NULL
                    CHECK (status IN ('granted', 'no_op', 'failed', 'deferred')),
  grant_reference UUID,
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS contract_grant_log_idempotency_idx
  ON public.contract_grant_log (deed_firing_id, contract_id);

CREATE INDEX IF NOT EXISTS contract_grant_log_family_idx
  ON public.contract_grant_log (family_id, created_at DESC);

-- ── allowance_dispatch_audit ─────────────────────────────────────────
-- Dual-logging for migration verification (INV 14). Compares legacy
-- allowance calculation with connector-layer calculation side by side.

CREATE TABLE IF NOT EXISTS public.allowance_dispatch_audit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  period_id       UUID REFERENCES public.allowance_periods(id) ON DELETE SET NULL,
  legacy_completion_percentage DECIMAL,
  legacy_calculated_amount DECIMAL,
  legacy_bonus_applied BOOLEAN,
  legacy_bonus_amount DECIMAL,
  legacy_total_earned DECIMAL,
  connector_completion_percentage DECIMAL,
  connector_calculated_amount DECIMAL,
  connector_bonus_applied BOOLEAN,
  connector_bonus_amount DECIMAL,
  connector_total_earned DECIMAL,
  match_status    TEXT NOT NULL DEFAULT 'pending'
                    CHECK (match_status IN ('pending', 'match', 'mismatch')),
  mismatch_details JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS allowance_dispatch_audit_member_idx
  ON public.allowance_dispatch_audit (family_member_id, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────

ALTER TABLE public.deferred_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_grant_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowance_dispatch_audit ENABLE ROW LEVEL SECURITY;

-- Mom full access
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'deferred_grants',
    'contract_grant_log',
    'allowance_dispatch_audit'
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

-- ── Cron schedules ───────────────────────────────────────────────────
-- Convention #246: all cron → Edge Function via util.invoke_edge_function()

-- :25 weekly — evaluate end_of_week contracts (Sunday midnight per family TZ)
SELECT cron.schedule(
  'contract-week-end-sweep',
  '25 0 * * 0',
  $cron$ SELECT util.invoke_edge_function('evaluate-deferred-contracts', '{"sweep_type": "end_of_week"}'::jsonb); $cron$
);

-- :30 hourly — evaluate end_of_day contracts + lifecycle sweep
SELECT cron.schedule(
  'contract-lifecycle-sweep',
  '30 * * * *',
  $cron$ SELECT util.invoke_edge_function('evaluate-deferred-contracts', '{"sweep_type": "end_of_day_and_lifecycle"}'::jsonb); $cron$
);

DO $$ BEGIN RAISE NOTICE 'migration 100205: deferred_grants + contract_grant_log + allowance_dispatch_audit + cron schedules'; END $$;
