-- Migration: 00000000100277_starter_creature_unlocked_page_fix.sql
-- Build: KIDS-REWARDS-PAGE — Slice 3 hotfix (2026-06-13)
--
-- Founder report: a Play member's creature page showed an empty background and
-- "0 to place" even though she had a starter creature.
--
-- Root cause: a pre-existing Build M data anomaly — `member_sticker_book_state
-- .active_page_id` can point at a page the member has NOT unlocked
-- (member_page_unlocks). The creature swipe strip only renders UNLOCKED pages,
-- so a creature placed on the (non-unlocked) active page is stranded and never
-- appears. 100276's starter award trusted active_page_id, so the starter landed
-- on the stranded page.
--
-- This migration:
--   1. Hardens award_starter_creature() to place on active_page_id ONLY when it
--      is actually unlocked, else the member's first unlocked page.
--   2. Realigns any enabled member whose active_page_id is not an unlocked page
--      to their first unlocked page (so future earned creatures land correctly).
--   3. Relocates any starter creature stranded on a non-unlocked page onto the
--      member's first unlocked page (keeping its position).

BEGIN;

-- 1. Harden the award function: only use active_page_id if it's unlocked.
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

  IF v_state.family_id IS NULL OR NOT v_state.is_enabled OR v_state.active_theme_id IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.member_creature_collection
     WHERE family_member_id = p_member_id
  ) THEN
    RETURN; -- idempotent: starter is only for an empty collection
  END IF;

  -- Place on the active page ONLY if it is actually unlocked; otherwise the
  -- first unlocked page. Never a page the member hasn't unlocked (it would be
  -- invisible in the swipe strip).
  v_page := NULL;
  IF v_state.active_page_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.member_page_unlocks
     WHERE family_member_id = p_member_id
       AND sticker_page_id = v_state.active_page_id
  ) THEN
    v_page := v_state.active_page_id;
  END IF;
  IF v_page IS NULL THEN
    SELECT sticker_page_id INTO v_page
      FROM public.member_page_unlocks
     WHERE family_member_id = p_member_id
     ORDER BY unlocked_at
     LIMIT 1;
  END IF;
  IF v_page IS NULL THEN
    RETURN; -- no unlocked page yet — wait
  END IF;

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
    RETURN;
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

-- 2. Data fix: realign active_page_id where it points at a non-unlocked page.
UPDATE public.member_sticker_book_state s
   SET active_page_id = (
     SELECT u.sticker_page_id FROM public.member_page_unlocks u
      WHERE u.family_member_id = s.family_member_id
      ORDER BY u.unlocked_at
      LIMIT 1
   )
 WHERE s.is_enabled = true
   AND s.active_page_id IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.member_page_unlocks u
      WHERE u.family_member_id = s.family_member_id
        AND u.sticker_page_id = s.active_page_id
   )
   AND EXISTS (
     SELECT 1 FROM public.member_page_unlocks u
      WHERE u.family_member_id = s.family_member_id
   );

-- 3. Data fix: relocate starter creatures stranded on a non-unlocked page.
UPDATE public.member_creature_collection c
   SET sticker_page_id = (
     SELECT u.sticker_page_id FROM public.member_page_unlocks u
      WHERE u.family_member_id = c.family_member_id
      ORDER BY u.unlocked_at
      LIMIT 1
   )
 WHERE c.awarded_source_type = 'manual_award'
   AND c.sticker_page_id IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.member_page_unlocks u
      WHERE u.family_member_id = c.family_member_id
        AND u.sticker_page_id = c.sticker_page_id
   )
   AND EXISTS (
     SELECT 1 FROM public.member_page_unlocks u
      WHERE u.family_member_id = c.family_member_id
   );

COMMIT;
