-- Migration: 00000000100276_starter_creature.sql
-- Build: KIDS-REWARDS-PAGE — Slice 3 founder addition (2026-06-13)
--
-- Founder request: "each account that has the background/creature feature should
-- start with one random starter creature — so they can see what it does."
--
-- An empty creature page teaches nothing. Every member whose sticker book is
-- enabled gets ONE starter creature, placed on their bootstrap background, so the
-- first time they open the page they SEE a creature in their world and can drag
-- it / send it to the tray and back — discovering the whole interaction.
--
-- award_starter_creature() is idempotent (only when the member has ZERO
-- creatures) and only fires once a background exists to place it on, so the
-- starter always lands ON a page (never stranded in an empty tray):
--   - existing members         → the backfill at the bottom
--   - newly provisioned members → the AFTER-UPDATE trigger fires when
--     auto_provision_member_resources sets active_page_id on the bootstrap page
--   - members enabled later     → the trigger fires when is_enabled flips true
--                                  (active_page already present)
--
-- A starter is a 'manual_award' (the only on-theme value in the source_type
-- CHECK), random but biased to a 'common' rarity (a starter shouldn't be a
-- legendary). It bumps creatures_earned_total for display; it deliberately does
-- NOT run the page-unlock pipeline (the bootstrap page already exists).

BEGIN;

CREATE OR REPLACE FUNCTION public.award_starter_creature(p_member_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_state    RECORD;
  v_page     UUID;
  v_creature UUID;
BEGIN
  SELECT family_id, active_theme_id, active_page_id, is_enabled
    INTO v_state
    FROM public.member_sticker_book_state
   WHERE family_member_id = p_member_id;

  -- Only enabled sticker books with a theme.
  IF v_state.family_id IS NULL OR NOT v_state.is_enabled OR v_state.active_theme_id IS NULL THEN
    RETURN;
  END IF;

  -- Idempotent: a starter is only for an empty collection.
  IF EXISTS (
    SELECT 1 FROM public.member_creature_collection
     WHERE family_member_id = p_member_id
  ) THEN
    RETURN;
  END IF;

  -- Place on the active page, else the first unlocked page. No page yet → wait
  -- (the trigger re-fires when the bootstrap page sets active_page_id).
  v_page := v_state.active_page_id;
  IF v_page IS NULL THEN
    SELECT sticker_page_id INTO v_page
      FROM public.member_page_unlocks
     WHERE family_member_id = p_member_id
     ORDER BY unlocked_at
     LIMIT 1;
  END IF;
  IF v_page IS NULL THEN
    RETURN;
  END IF;

  -- A random common creature from the active theme (fall back to any rarity).
  SELECT id INTO v_creature
    FROM public.gamification_creatures
   WHERE theme_id = v_state.active_theme_id
     AND is_active = true
     AND rarity = 'common'
   ORDER BY random()
   LIMIT 1;
  IF v_creature IS NULL THEN
    SELECT id INTO v_creature
      FROM public.gamification_creatures
     WHERE theme_id = v_state.active_theme_id
       AND is_active = true
     ORDER BY random()
     LIMIT 1;
  END IF;
  IF v_creature IS NULL THEN
    RETURN; -- theme has no creatures — nothing to award
  END IF;

  INSERT INTO public.member_creature_collection (
    family_id, family_member_id, creature_id, sticker_page_id,
    position_x, position_y, awarded_source_type, awarded_source_id
  ) VALUES (
    v_state.family_id, p_member_id, v_creature, v_page,
    0.25 + random() * 0.5, 0.25 + random() * 0.5, 'manual_award', gen_random_uuid()
  );

  UPDATE public.member_sticker_book_state
     SET creatures_earned_total = creatures_earned_total + 1
   WHERE family_member_id = p_member_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.award_starter_creature(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.award_starter_creature(UUID) TO authenticated;

COMMENT ON FUNCTION public.award_starter_creature IS
  'KIDS-REWARDS-PAGE Slice 3: grant ONE starter creature (placed on the bootstrap '
  'background) to an enabled sticker book with zero creatures. Idempotent. So '
  'every member sees what the creature page does from day one.';

-- ── Trigger: award once a background exists to place the starter on ──────────
CREATE OR REPLACE FUNCTION public.trg_award_starter_creature()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  PERFORM public.award_starter_creature(NEW.family_member_id);
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_starter_creature ON public.member_sticker_book_state;
CREATE TRIGGER trg_starter_creature
  AFTER INSERT OR UPDATE OF is_enabled, active_page_id
  ON public.member_sticker_book_state
  FOR EACH ROW
  WHEN (NEW.is_enabled = true AND NEW.active_page_id IS NOT NULL)
  EXECUTE FUNCTION public.trg_award_starter_creature();

-- ── Backfill: every currently-enabled member with zero creatures ─────────────
DO $backfill$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT family_member_id
      FROM public.member_sticker_book_state
     WHERE is_enabled = true
  LOOP
    PERFORM public.award_starter_creature(r.family_member_id);
  END LOOP;
END;
$backfill$;

COMMIT;
