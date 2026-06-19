-- Migration: 00000000100275_creature_self_write_rpcs.sql
-- Build: KIDS-REWARDS-PAGE — Slice 3 (Creature pages)
--
-- The creature page lets a member arrange THEIR OWN creatures (place / move /
-- carry between backgrounds / return to tray) and remembers their swipe
-- position. But member_creature_collection + member_sticker_book_state only
-- have *_mom_write (ALL, primary-parent) policies — a kid on their own session
-- (Casey/Independent) or a Play family device cannot write, so every placement
-- silently reverted (RLS-blocked). That breaks the core founder feature ("kids
-- place earned creatures wherever they want", gate Pillar 2 / §13).
--
-- Surgical fix (the redeem_own_prize / Slice 1 pattern): two SECURITY DEFINER
-- RPCs that allow ONLY the safe self-arrangement writes — creature position +
-- sticker_page_id, and last_viewed_page_id — for the owning member, the family
-- primary parent (covers View As), or a family-shadow session (Play device,
-- Convention #276). Award fields, creature_id, active_page_id, is_enabled, and
-- every other column stay mom-only via the untouched *_mom_write policies.

BEGIN;

-- ── Shared authorization: may the caller arrange this member's sticker book? ──
CREATE OR REPLACE FUNCTION util.can_arrange_member_stickers(
  p_family_id UUID,
  p_member_id UUID
) RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, util
AS $fn$
  SELECT
    EXISTS (
      SELECT 1 FROM public.family_members fm
       WHERE fm.user_id = auth.uid()
         AND fm.family_id = p_family_id
         AND (fm.id = p_member_id OR fm.role = 'primary_parent')
    )
    OR util.is_family_shadow_of(p_family_id);
$fn$;

REVOKE ALL ON FUNCTION util.can_arrange_member_stickers(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.can_arrange_member_stickers(UUID, UUID) TO authenticated;

-- ── place_member_creature: position + (optionally) which background ──────────
-- p_set_page=false → reposition on the current page only.
-- p_set_page=true  → set sticker_page_id = p_sticker_page_id (NULL = return to
--                    the unplaced tray).
CREATE OR REPLACE FUNCTION public.place_member_creature(
  p_creature_collection_id UUID,
  p_position_x REAL,
  p_position_y REAL,
  p_sticker_page_id UUID,
  p_set_page BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, util
AS $fn$
DECLARE
  v_row RECORD;
BEGIN
  SELECT * INTO v_row
    FROM public.member_creature_collection
   WHERE id = p_creature_collection_id;
  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  IF NOT util.can_arrange_member_stickers(v_row.family_id, v_row.family_member_id) THEN
    RETURN jsonb_build_object('status', 'not_allowed');
  END IF;

  -- A target page (when setting) must belong to the same family-member's
  -- unlocked set — never let an arbitrary page id be written.
  IF p_set_page AND p_sticker_page_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.member_page_unlocks mpu
       WHERE mpu.family_member_id = v_row.family_member_id
         AND mpu.sticker_page_id = p_sticker_page_id
    ) THEN
      RETURN jsonb_build_object('status', 'page_not_unlocked');
    END IF;
  END IF;

  UPDATE public.member_creature_collection
     SET position_x = p_position_x,
         position_y = p_position_y,
         sticker_page_id = CASE WHEN p_set_page THEN p_sticker_page_id ELSE sticker_page_id END
   WHERE id = p_creature_collection_id;

  RETURN jsonb_build_object('status', 'ok');
END;
$fn$;

REVOKE ALL ON FUNCTION public.place_member_creature(UUID, REAL, REAL, UUID, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.place_member_creature(UUID, REAL, REAL, UUID, BOOLEAN) TO authenticated;

COMMENT ON FUNCTION public.place_member_creature IS
  'KIDS-REWARDS-PAGE Slice 3: self-arrange a creature (position + sticker_page_id, '
  'NULL page = return to tray). Owner / primary parent / family-shadow only; '
  'award fields untouched.';

-- ── set_member_last_viewed_page: remember the swipe position (R5) ────────────
CREATE OR REPLACE FUNCTION public.set_member_last_viewed_page(
  p_member_id UUID,
  p_page_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, util
AS $fn$
DECLARE
  v_family UUID;
BEGIN
  SELECT family_id INTO v_family
    FROM public.member_sticker_book_state
   WHERE family_member_id = p_member_id;
  IF v_family IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  IF NOT util.can_arrange_member_stickers(v_family, p_member_id) THEN
    RETURN jsonb_build_object('status', 'not_allowed');
  END IF;

  UPDATE public.member_sticker_book_state
     SET last_viewed_page_id = p_page_id
   WHERE family_member_id = p_member_id;

  RETURN jsonb_build_object('status', 'ok');
END;
$fn$;

REVOKE ALL ON FUNCTION public.set_member_last_viewed_page(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_member_last_viewed_page(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.set_member_last_viewed_page IS
  'KIDS-REWARDS-PAGE Slice 3 (R5): persist the creature swipe position. '
  'Owner / primary parent / family-shadow only; touches last_viewed_page_id only '
  '(active_page_id award semantics untouched).';

COMMIT;
