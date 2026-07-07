-- Migration: 00000000100284_family_goals_and_prizes.sql
-- Build: FAMILY-GOALS-PRIZES — Family Goals, Family Prizes & Multi-Member Contribution Tracking
-- Spec: claude/feature-decisions/Family-Goals-And-Prizes.md
-- Build file: .claude/rules/current-builds/FAMILY-GOALS-PRIZES.md (founder-approved 2026-07-06,
--   Riders 1 + 2)
--
-- Contents:
--   1. family_goals — the goal container (title, participants, earning mode, target,
--      window, prize snapshot, denormalized progress, lifecycle status)
--   2. family_goal_sources — what counts toward a goal (family_intention | task, extensible)
--   3. family_goal_contributions — append-only ledger, one row per counted action
--      (Rider 2: EVENTS/numerators only — never an assigned-denominator derivation)
--   4. earned_prizes.family_member_id → nullable + CHECK guard + partial unique index,
--      so a Family Prize is exactly one ownerless earned_prizes row (Key Decision #1).
--      Pre-flight verified: the 100266 visibility='family' SELECT/UPDATE policy arms
--      already resolve correctly for a NULL family_member_id (short-circuit on
--      `visibility = 'family'` before any family_member_id comparison is reached) —
--      NO RLS policy rewrite needed on earned_prizes. redeem_own_prize() also already
--      degrades safely (fm.id = NULL never matches, kids cannot self-redeem a family
--      prize — correct per FD-3, mom redeems once for everyone).
--   5. Counting triggers (SECURITY DEFINER, 100158-style discipline):
--        count_family_goal_contribution_from_intention()  AFTER INSERT ON family_intention_iterations
--        count_family_goal_contribution_from_completion() AFTER INSERT OR UPDATE ON task_completions
--          — predicate mirrors migration 100278's award_custom_reward_for_completion
--            EXACTLY (`completion_type NOT IN ('practice','mastery_submit')`), the
--            authoritative live implementation of the Convention #200 filter — NOT the
--            dropped roll_creature_for_completion, NOT the superseded 100266/100267
--            bodies. Verified live: task_completions_completion_type_check only allows
--            ('complete','practice','mastery_submit') today — the NOT-IN-exclusion
--            framing is forward-compatible if 'mastery_approved' is ever added to that
--            CHECK without requiring a trigger rewrite.
--   6. evaluate_family_goal_award(goal_id) — shared evaluator: recomputes denormalized
--      progress, checks Mode A ('shared_counter') / Mode B ('each_member') condition,
--      status-guarded UPDATE (WHERE status='active') + prize INSERT in the SAME
--      transaction. Race-safety: the status-guarded UPDATE takes a row lock — a second
--      concurrent evaluator call blocks until the first commits, then its own guarded
--      UPDATE affects 0 rows (status already flipped) and it never reaches the INSERT.
--      The partial unique index on earned_prizes is the backstop. EXECUTE revoked from
--      PUBLIC — trigger-only, never client-RPC-callable (prevents forcing an early award).
--   7. AFTER INSERT trigger on family_goal_contributions calls the shared evaluator —
--      single composable evaluation point for every current AND future source_kind.
--   8. feature_key_registry seed: 'family_goals' (registry-only, tier deferred — mirrors
--      the my_rewards_page precedent, migration 100248; useCanAccess() returns true for
--      everything during beta per Convention #10, and this feature's real gate is Hub/
--      Prize-Board surface visibility, not a subscription tier).
--
-- NEVER routes through contracts/deed_firings/godmothers (spec Key Decision #2 —
-- contracts.family_member_id IS NULL already means "applies to each kid independently,"
-- an irreconcilable collision with "one shared family goal"). Purpose-built engine only.
--
-- Idempotent throughout.

BEGIN;

-- ============================================================================
-- 1. family_goals
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.family_goals (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                 UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by                UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,

  title                     TEXT NOT NULL,
  description               TEXT,

  participating_member_ids  UUID[] NOT NULL,
  earning_mode              TEXT NOT NULL CHECK (earning_mode IN ('shared_counter', 'each_member')),
  target_count              INTEGER NOT NULL CHECK (target_count > 0),

  starts_at                 DATE,
  ends_at                   DATE,

  prize_name                TEXT NOT NULL,
  prize_text                TEXT,
  prize_image_url           TEXT,
  prize_asset_key           TEXT,

  progress_visible          BOOLEAN NOT NULL DEFAULT true,
  is_included_in_ai         BOOLEAN NOT NULL DEFAULT true,

  status                    TEXT NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'completed', 'expired', 'archived')),
  current_progress          INTEGER NOT NULL DEFAULT 0,
  completed_at              TIMESTAMPTZ,
  earned_prize_id           UUID REFERENCES public.earned_prizes(id) ON DELETE SET NULL,

  archived_at               TIMESTAMPTZ,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_goals_family_status
  ON public.family_goals (family_id, status, archived_at);

ALTER TABLE public.family_goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "family_goals_select_family"
    ON public.family_goals FOR SELECT
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "family_goals_insert_parent"
    ON public.family_goals FOR INSERT
    TO authenticated
    WITH CHECK (
      family_id IN (
        SELECT fm.family_id FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "family_goals_update_parent"
    ON public.family_goals FOR UPDATE
    TO authenticated
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "family_goals_delete_parent"
    ON public.family_goals FOR DELETE
    TO authenticated
    USING (
      family_id IN (
        SELECT fm.family_id FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_family_goals_updated_at ON public.family_goals;
CREATE TRIGGER trg_family_goals_updated_at
  BEFORE UPDATE ON public.family_goals
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

COMMENT ON TABLE public.family_goals IS
  'FAMILY-GOALS-PRIZES: a family-level goal container. NOT routed through contracts/deed_firings (NULL-member semantics collision — see Key Decision #2). Completing a goal awards exactly one earned_prizes row with family_member_id=NULL (see earned_prizes CHECK below).';

-- ============================================================================
-- 2. family_goal_sources — what counts toward a goal
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.family_goal_sources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  goal_id      UUID NOT NULL REFERENCES public.family_goals(id) ON DELETE CASCADE,
  source_kind  TEXT NOT NULL CHECK (source_kind IN ('family_intention', 'task')),
  source_id    UUID NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_family_goal_sources UNIQUE (goal_id, source_kind, source_id)
);

CREATE INDEX IF NOT EXISTS idx_family_goal_sources_lookup
  ON public.family_goal_sources (source_kind, source_id);
CREATE INDEX IF NOT EXISTS idx_family_goal_sources_goal
  ON public.family_goal_sources (goal_id);

ALTER TABLE public.family_goal_sources ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "family_goal_sources_select_family"
    ON public.family_goal_sources FOR SELECT
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "family_goal_sources_insert_parent"
    ON public.family_goal_sources FOR INSERT
    TO authenticated
    WITH CHECK (
      family_id IN (
        SELECT fm.family_id FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "family_goal_sources_update_parent"
    ON public.family_goal_sources FOR UPDATE
    TO authenticated
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "family_goal_sources_delete_parent"
    ON public.family_goal_sources FOR DELETE
    TO authenticated
    USING (
      family_id IN (
        SELECT fm.family_id FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.family_goal_sources IS
  'FAMILY-GOALS-PRIZES: what counts toward a goal. source_kind is extensible (Rider 2 standing law: any new source_kind MUST route assigned-denominator questions through get_member_day_obligations — Convention #271 — never derive inline; this table only ever stores EVENT sources, never denominator sources).';

-- ============================================================================
-- 3. family_goal_contributions — append-only ledger
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.family_goal_contributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  goal_id        UUID NOT NULL REFERENCES public.family_goals(id) ON DELETE CASCADE,
  member_id      UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  source_kind    TEXT NOT NULL,
  source_ref_id  UUID NOT NULL,
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_family_goal_contributions UNIQUE (goal_id, source_kind, source_ref_id)
);

CREATE INDEX IF NOT EXISTS idx_family_goal_contributions_goal_member
  ON public.family_goal_contributions (goal_id, member_id);

ALTER TABLE public.family_goal_contributions ENABLE ROW LEVEL SECURITY;

-- SELECT only — family members can see the ledger (drives per-member progress
-- display). NO INSERT/UPDATE/DELETE policy exists at all: writes happen ONLY
-- via the SECURITY DEFINER trigger functions below, which run as the table
-- owner and bypass RLS (matches the PRD-06 intention_iterations append-only
-- precedent — no direct client write path).
DO $$ BEGIN
  CREATE POLICY "family_goal_contributions_select_family"
    ON public.family_goal_contributions FOR SELECT
    TO authenticated
    USING (
      family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.family_goal_contributions IS
  'FAMILY-GOALS-PRIZES: append-only ledger, one row per counted action ever (idempotent under trigger re-fires via the UNIQUE constraint). Rider 2: these are EVENTS/numerators only. No direct client write path — INSERT happens exclusively inside count_family_goal_contribution_from_intention() / count_family_goal_contribution_from_completion(), both SECURITY DEFINER.';

-- ============================================================================
-- 4. earned_prizes — nullable family_member_id for Family Prizes
-- ============================================================================

ALTER TABLE public.earned_prizes ALTER COLUMN family_member_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'earned_prizes_member_or_family_goal_check'
      AND conrelid = 'public.earned_prizes'::regclass
  ) THEN
    ALTER TABLE public.earned_prizes
      ADD CONSTRAINT earned_prizes_member_or_family_goal_check
      CHECK (family_member_id IS NOT NULL OR source_type = 'family_goal');
  END IF;
END $$;

-- One family prize per goal, ever (double-award backstop; evaluate_family_goal_award
-- also ON CONFLICTs against this exact partial index).
CREATE UNIQUE INDEX IF NOT EXISTS uq_earned_prizes_family_goal
  ON public.earned_prizes (source_id)
  WHERE source_type = 'family_goal';

COMMENT ON COLUMN public.earned_prizes.family_member_id IS
  'FAMILY-GOALS-PRIZES: nullable. NULL is legal ONLY when source_type=''family_goal'' (CHECK-enforced) — a Family Prize belongs to no single member. Verified: the 100266 visibility=''family'' SELECT/UPDATE policy arms already resolve correctly for NULL (short-circuit before any family_member_id comparison), and redeem_own_prize() already degrades safely (kids cannot self-redeem a family prize — correct, FD-3 requires mom to redeem once for everyone). No RLS rewrite was needed.';

-- ============================================================================
-- 5. Counting triggers (SECURITY DEFINER, 100158-style discipline)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 5a. count_family_goal_contribution_from_intention()
--     AFTER INSERT ON family_intention_iterations
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.count_family_goal_contribution_from_intention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source          RECORD;
  v_family_timezone TEXT;
  v_now_local       DATE;
BEGIN
  FOR v_source IN
    SELECT fgs.goal_id, fg.family_id, fg.starts_at, fg.ends_at
      FROM public.family_goal_sources fgs
      JOIN public.family_goals fg ON fg.id = fgs.goal_id
     WHERE fgs.source_kind = 'family_intention'
       AND fgs.source_id = NEW.intention_id
       AND fg.status = 'active'
       AND NEW.member_id = ANY (fg.participating_member_ids)
  LOOP
    SELECT f.timezone INTO v_family_timezone
      FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
     WHERE fm.id = NEW.member_id;

    IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
      v_family_timezone := 'America/Chicago';
    END IF;

    v_now_local := (COALESCE(NEW.created_at, now()) AT TIME ZONE v_family_timezone)::date;

    -- Not yet started — skip silently, no expiry implication.
    IF v_source.starts_at IS NOT NULL AND v_now_local < v_source.starts_at THEN
      CONTINUE;
    END IF;

    -- Past the goal's end date — lazily expire (Key Decision #9: no cron needed,
    -- expiry evaluated opportunistically at write time) and skip counting.
    IF v_source.ends_at IS NOT NULL AND v_now_local > v_source.ends_at THEN
      UPDATE public.family_goals
         SET status = 'expired'
       WHERE id = v_source.goal_id AND status = 'active';
      CONTINUE;
    END IF;

    INSERT INTO public.family_goal_contributions (
      family_id, goal_id, member_id, source_kind, source_ref_id, contributed_at
    ) VALUES (
      NEW.family_id, v_source.goal_id, NEW.member_id, 'family_intention', NEW.id,
      COALESCE(NEW.created_at, now())
    )
    ON CONFLICT (goal_id, source_kind, source_ref_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_count_family_goal_contribution_from_intention
  ON public.family_intention_iterations;
CREATE TRIGGER trg_count_family_goal_contribution_from_intention
  AFTER INSERT ON public.family_intention_iterations
  FOR EACH ROW EXECUTE FUNCTION public.count_family_goal_contribution_from_intention();

COMMENT ON FUNCTION public.count_family_goal_contribution_from_intention IS
  'FAMILY-GOALS-PRIZES: fires on every family intention tally tap (Hub, dashboard widget, family-device shadow sessions, View As) regardless of client code path. Window-checked at family timezone. Idempotent via the unique constraint on family_goal_contributions.';

-- ---------------------------------------------------------------------------
-- 5b. count_family_goal_contribution_from_completion()
--     AFTER INSERT OR UPDATE OF approval_status, completion_type ON task_completions
--     Predicate mirrors migration 100278 award_custom_reward_for_completion EXACTLY
--     (the authoritative live Convention #200 implementation).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.count_family_goal_contribution_from_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id       UUID;
  v_task            RECORD;
  v_source          RECORD;
  v_family_timezone TEXT;
  v_now_local       DATE;
BEGIN
  v_member_id := COALESCE(NEW.family_member_id, NEW.member_id);
  IF v_member_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Convention #200 mirror (migration 100278 predicate, NOT the dropped
  -- roll_creature_for_completion, NOT the superseded 100266/100267 bodies):
  -- practice / mastery-submit rows never count.
  IF NEW.completion_type IN ('practice', 'mastery_submit') THEN
    RETURN NEW;
  END IF;

  SELECT t.id, t.family_id, t.require_approval
    INTO v_task
    FROM public.tasks t
   WHERE t.id = NEW.task_id;

  IF v_task.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Approval-required tasks count only at approval (the UPDATE leg of this
  -- trigger catches the pending → approved transition).
  IF COALESCE(v_task.require_approval, false)
     AND COALESCE(NEW.approval_status, 'pending') <> 'approved' THEN
    RETURN NEW;
  END IF;

  FOR v_source IN
    SELECT fgs.goal_id, fg.starts_at, fg.ends_at
      FROM public.family_goal_sources fgs
      JOIN public.family_goals fg ON fg.id = fgs.goal_id
     WHERE fgs.source_kind = 'task'
       AND fgs.source_id = NEW.task_id
       AND fg.status = 'active'
       AND v_member_id = ANY (fg.participating_member_ids)
  LOOP
    SELECT f.timezone INTO v_family_timezone
      FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
     WHERE fm.id = v_member_id;

    IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
      v_family_timezone := 'America/Chicago';
    END IF;

    v_now_local := (COALESCE(NEW.completed_at, now()) AT TIME ZONE v_family_timezone)::date;

    IF v_source.starts_at IS NOT NULL AND v_now_local < v_source.starts_at THEN
      CONTINUE;
    END IF;

    IF v_source.ends_at IS NOT NULL AND v_now_local > v_source.ends_at THEN
      UPDATE public.family_goals
         SET status = 'expired'
       WHERE id = v_source.goal_id AND status = 'active';
      CONTINUE;
    END IF;

    INSERT INTO public.family_goal_contributions (
      family_id, goal_id, member_id, source_kind, source_ref_id, contributed_at
    ) VALUES (
      v_task.family_id, v_source.goal_id, v_member_id, 'task', NEW.id,
      COALESCE(NEW.completed_at, now())
    )
    ON CONFLICT (goal_id, source_kind, source_ref_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_count_family_goal_contribution_from_completion
  ON public.task_completions;
CREATE TRIGGER trg_count_family_goal_contribution_from_completion
  AFTER INSERT OR UPDATE OF approval_status, completion_type ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.count_family_goal_contribution_from_completion();

COMMENT ON FUNCTION public.count_family_goal_contribution_from_completion IS
  'FAMILY-GOALS-PRIZES: fires on every task/routine completion regardless of client code path. Does not conflict with the only pre-existing task_completions trigger (trg_set_task_completion_period_date, a BEFORE trigger on different columns/event scope). Approval-required tasks count at approval (UPDATE leg); everything else counts at completion (INSERT leg). Idempotent via the unique constraint on family_goal_contributions.';

-- ============================================================================
-- 6. evaluate_family_goal_award(goal_id) — shared evaluator
-- ============================================================================

CREATE OR REPLACE FUNCTION public.evaluate_family_goal_award(p_goal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal                RECORD;
  v_total_contributions INTEGER;
  v_condition_met       BOOLEAN := false;
  v_member_id           UUID;
  v_member_count        INTEGER;
  v_prize_type          TEXT;
  v_prize_id            UUID;
BEGIN
  SELECT * INTO v_goal FROM public.family_goals WHERE id = p_goal_id;
  IF v_goal.id IS NULL THEN
    RETURN jsonb_build_object('status', 'goal_not_found');
  END IF;

  -- Recompute denormalized progress (Mode A display; informational total for Mode B).
  SELECT COUNT(*) INTO v_total_contributions
    FROM public.family_goal_contributions
   WHERE goal_id = p_goal_id;

  UPDATE public.family_goals
     SET current_progress = v_total_contributions
   WHERE id = p_goal_id;

  IF v_goal.status <> 'active' THEN
    RETURN jsonb_build_object(
      'status', 'not_active',
      'goal_status', v_goal.status,
      'current_progress', v_total_contributions
    );
  END IF;

  IF v_goal.earning_mode = 'shared_counter' THEN
    v_condition_met := v_total_contributions >= v_goal.target_count;
  ELSE -- 'each_member'
    v_condition_met := true;
    FOREACH v_member_id IN ARRAY v_goal.participating_member_ids LOOP
      SELECT COUNT(*) INTO v_member_count
        FROM public.family_goal_contributions
       WHERE goal_id = p_goal_id AND member_id = v_member_id;
      IF v_member_count < v_goal.target_count THEN
        v_condition_met := false;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  IF NOT v_condition_met THEN
    RETURN jsonb_build_object('status', 'in_progress', 'current_progress', v_total_contributions);
  END IF;

  -- Status-guarded completion. Race-safety: this UPDATE takes a row lock on
  -- family_goals; a concurrent evaluator call for the same goal_id blocks here
  -- until this transaction commits, then its own guarded UPDATE affects 0 rows
  -- (status already 'completed') and it returns 'already_completed' below
  -- without ever reaching the prize INSERT.
  UPDATE public.family_goals
     SET status = 'completed', completed_at = now()
   WHERE id = p_goal_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'already_completed', 'current_progress', v_total_contributions);
  END IF;

  v_prize_type := CASE
    WHEN v_goal.prize_image_url IS NOT NULL AND v_goal.prize_image_url <> '' THEN 'image'
    WHEN v_goal.prize_asset_key IS NOT NULL AND v_goal.prize_asset_key <> '' THEN 'platform_image'
    ELSE 'text'
  END;

  -- Family Prize: family_member_id=NULL (legal only for source_type='family_goal',
  -- CHECK-enforced above), visibility='family' (all family members can see + mom
  -- can redeem via the existing, unmodified earned_prizes RLS), participants
  -- snapshotted into shared_with_member_ids (drives the My Rewards "participant"
  -- query — Build Item 7). Partial unique index on (source_id) WHERE
  -- source_type='family_goal' is the double-award backstop beneath the status guard.
  INSERT INTO public.earned_prizes (
    family_id, family_member_id,
    source_type, source_id,
    prize_type, prize_text, prize_name,
    prize_image_url, prize_asset_key,
    visibility, shared_with_member_ids, created_by
  ) VALUES (
    v_goal.family_id, NULL,
    'family_goal', v_goal.id,
    v_prize_type, v_goal.prize_text, v_goal.prize_name,
    v_goal.prize_image_url, v_goal.prize_asset_key,
    'family', v_goal.participating_member_ids, v_goal.created_by
  )
  ON CONFLICT (source_id) WHERE source_type = 'family_goal'
  DO NOTHING
  RETURNING id INTO v_prize_id;

  IF v_prize_id IS NULL THEN
    RETURN jsonb_build_object('status', 'already_awarded', 'current_progress', v_total_contributions);
  END IF;

  UPDATE public.family_goals SET earned_prize_id = v_prize_id WHERE id = p_goal_id;

  RETURN jsonb_build_object(
    'status', 'awarded',
    'prize_id', v_prize_id,
    'current_progress', v_total_contributions
  );
END;
$$;

-- Trigger-only. Never client-RPC-callable (would let anyone force an early award).
REVOKE ALL ON FUNCTION public.evaluate_family_goal_award(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.evaluate_family_goal_award(UUID) FROM anon, authenticated;

COMMENT ON FUNCTION public.evaluate_family_goal_award IS
  'FAMILY-GOALS-PRIZES: shared evaluator invoked by trg_family_goal_contribution_evaluate after every contribution insert (any current or future source_kind). EXECUTE revoked from PUBLIC/anon/authenticated — trigger-invocation only, never directly callable via RPC.';

-- ============================================================================
-- 7. AFTER INSERT trigger on family_goal_contributions → evaluate
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trg_evaluate_family_goal_after_contribution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.evaluate_family_goal_award(NEW.goal_id);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_evaluate_family_goal_after_contribution() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_evaluate_family_goal_after_contribution() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_family_goal_contribution_evaluate ON public.family_goal_contributions;
CREATE TRIGGER trg_family_goal_contribution_evaluate
  AFTER INSERT ON public.family_goal_contributions
  FOR EACH ROW EXECUTE FUNCTION public.trg_evaluate_family_goal_after_contribution();

COMMENT ON FUNCTION public.trg_evaluate_family_goal_after_contribution IS
  'FAMILY-GOALS-PRIZES: single composable evaluation point — every source_kind (family_intention, task, and any future kind) automatically gets progress recompute + award evaluation for free by inserting into family_goal_contributions.';

-- ============================================================================
-- 8. feature_key_registry seed (registry-only, tier deferred — my_rewards_page precedent)
-- ============================================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  (
    'family_goals',
    'Family Goals & Prizes',
    'Family-level goals the whole family works toward together, earning a shared Family Prize. Links to Family Best Intentions tallies and/or task completions; mom authors from the Prize Board or Hub Settings; participants see progress on the Hub and their own My Rewards page.',
    'FAMILY-GOALS-PRIZES (practical core of the never-written PRD-24C)'
  )
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================================================
-- 9. Verification
-- ============================================================================

DO $$
DECLARE
  v_tables INTEGER;
  v_nullable BOOLEAN;
  v_check_ok BOOLEAN;
  v_idx_ok BOOLEAN;
  v_feature_ok BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_tables
    FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('family_goals', 'family_goal_sources', 'family_goal_contributions');
  IF v_tables <> 3 THEN
    RAISE EXCEPTION 'migration 100284: expected 3 new tables, found %', v_tables;
  END IF;

  SELECT is_nullable = 'YES' INTO v_nullable
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'earned_prizes' AND column_name = 'family_member_id';
  IF NOT v_nullable THEN
    RAISE EXCEPTION 'migration 100284: earned_prizes.family_member_id is still NOT NULL';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'earned_prizes_member_or_family_goal_check'
      AND conrelid = 'public.earned_prizes'::regclass
  ) INTO v_check_ok;
  IF NOT v_check_ok THEN
    RAISE EXCEPTION 'migration 100284: earned_prizes_member_or_family_goal_check missing';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'uq_earned_prizes_family_goal'
  ) INTO v_idx_ok;
  IF NOT v_idx_ok THEN
    RAISE EXCEPTION 'migration 100284: uq_earned_prizes_family_goal index missing';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.feature_key_registry WHERE feature_key = 'family_goals'
  ) INTO v_feature_ok;
  IF NOT v_feature_ok THEN
    RAISE EXCEPTION 'migration 100284: family_goals feature key missing';
  END IF;

  RAISE NOTICE 'migration 100284: all verification checks passed (3 tables, nullable column, check constraint, unique index, feature key)';
END $$;

COMMIT;
