-- View As Identity-Scope Architecture (Worker 1) — `origin` column on
-- `view_as_sessions`.
--
-- Distinguishes the two flow paths that produce a View-As session:
--   * 'mom_viewing'    — Mom (or any primary_parent) opens the View-As
--                        modal from her own dashboard to inspect a child's
--                        surfaces. The auth user remains mom.
--   * 'member_session' — A family member taps their avatar on a shared
--                        family hub tablet, authenticates with their PIN
--                        through HubMemberAuthModal, and is bounced into
--                        their own surfaces. The auth user remains mom
--                        (because PIN-only members do not have Supabase
--                        user_ids today — this is a known future-migration
--                        point), but the data subject is the kid.
--
-- The `origin` column is read at modal close time to decide where to
-- return: 'mom_viewing' returns to mom's dashboard, 'member_session'
-- returns to /hub.
--
-- All 371 existing rows backfill implicitly to 'mom_viewing' via the
-- DEFAULT — that is the correct historical value because the hub-PIN
-- flow used to navigate('/dashboard') instead of producing a distinct
-- session shape.
--
-- Idempotent — safe to re-run.

ALTER TABLE public.view_as_sessions
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'mom_viewing';

-- CHECK constraint added separately so the migration is re-runnable even
-- if the column already exists (e.g. an earlier dev manually added it
-- without the constraint).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'view_as_sessions_origin_check'
      AND conrelid = 'public.view_as_sessions'::regclass
  ) THEN
    ALTER TABLE public.view_as_sessions
      ADD CONSTRAINT view_as_sessions_origin_check
      CHECK (origin IN ('mom_viewing', 'member_session'));
  END IF;
END $$;

COMMENT ON COLUMN public.view_as_sessions.origin IS
  'Flow path that produced this View-As session. ''mom_viewing'' = primary_parent opened the View-As modal from their own dashboard; ''member_session'' = a kid authenticated through HubMemberAuthModal on a shared hub tablet. Drives modal close behavior and per-flow UX affordances. Convention #39 (View As Identity-Scope Architecture).';
