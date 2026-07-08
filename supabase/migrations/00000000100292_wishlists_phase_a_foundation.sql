-- ============================================================================
-- 00000000100292_wishlists_phase_a_foundation.sql
-- ============================================================================
-- PRD-43 WishLists — Gift Planning & In-Store Capture. Phase A foundation:
-- schema, RESTRICTIVE surprise-safe RLS, the gift_planning grant, storage.
--
-- Ecosystem position (PRD-43 §3): `lists`/`list_items` are the canonical
-- home for wishlists (list_type='wishlist'). This migration adds the mom-only
-- hidden gift-ideas list_type ('gift_ideas'), three new small tables
-- (gift_claims, wishlist_share_links, gift_history), and closes the ONE real
-- leak the pack's recon found: `lists_family_device` (migration 100262) is a
-- PERMISSIVE, family-wide-shadow-session ALL policy that would otherwise
-- expose a mom-only gift_ideas list to any kid dipping into the family
-- tablet. RESTRICTIVE policies AND over every present-and-future permissive
-- policy on lists/list_items for list_type='gift_ideas' — structural, not
-- procedural (pack ruling #3; coordination note for the not-yet-built FDWA:
-- never add gift_ideas arms to any family-device policy).
--
-- Section map:
--   1. lists.subject_member_id (+ one-per-subject partial unique index)
--   2. list_items new columns (image_url, is_included_in_ai, wishlist_state,
--      occasion_tags, added_by, excluded_from_shares)
--   3. lists.list_type CHECK rebuild — from the CURRENT (2026-07-07) live
--      15-value body (ST-0 lesson: never rebuild from a stale migration) +
--      'gift_ideas' (this PRD) + 'reward_list' (an INDEPENDENT F-21-class bug
--      found while rewriting this exact constraint — see the note in §3).
--   4. gift_claims — surprise-safe: no kid arm, no family-device arm, and
--      subject-exclusion so NOBODY (including mom) reads claims against
--      their own list. First-claim-wins partial unique index.
--   5. wishlist_share_links — token_hash SHA-256 (PIN-hashing discipline,
--      raw token shown once client-side, never stored).
--   6. gift_history — mom-curated memory-keeping, not append-only.
--   7. util.gift_planning_access() — the RESTRICTIVE-policy helper + the
--      grant-check every new table's RLS reuses. FALSE for family-shadow
--      sessions by construction (their family_members.role is 'family',
--      which matches neither branch of the OR).
--   8. RESTRICTIVE gift_ideas-exclusion policies on lists + list_items.
--   9. PERMISSIVE gift_ideas-granted-access policies (mom + gift_planning
--      grant) on lists + list_items — RESTRICTIVE policies only NARROW,
--      they never grant; without this, a granted dad would have zero
--      permissive policy admitting him to a gift_ideas row at all.
--  10. PERMISSIVE wishlist adult-default-access policy (D-43-5): a kid's
--      wishlist is visible+writable to any additional_adult by default;
--      any OTHER member's wishlist (mom's, another adult's) requires the
--      gift_planning grant — same helper, "zero extra machinery" (PRD §11
--      edge case 13).
--  11. gift_planning / wishlists_basic / wishlists_capture /
--      wishlists_share_links feature keys + feature_access_v2 + explicit-
--      grant-only profile rows for gift_planning + apply_permission_profile
--      rewrite (from its CURRENT/100264 body) adding gift_planning to both
--      exclusion lists.
--  12. Member-removal auto-revoke trigger for outstanding share links.
--  13. wishlist-images storage bucket + policies (family-avatars shape).
--  14. Verification block.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. lists.subject_member_id
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS subject_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.lists.subject_member_id IS
  'Who a gift_ideas list is FOR (mom''s hidden planning list about this member). NULL for every other list_type. PRD-43.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_lists_gift_ideas_per_subject
  ON public.lists (family_id, subject_member_id)
  WHERE list_type = 'gift_ideas';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. list_items new columns
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wishlist_state TEXT,
  ADD COLUMN IF NOT EXISTS occasion_tags TEXT[],
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS excluded_from_shares BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.list_items DROP CONSTRAINT IF EXISTS list_items_wishlist_state_check;
ALTER TABLE public.list_items
  ADD CONSTRAINT list_items_wishlist_state_check
  CHECK (wishlist_state IS NULL OR wishlist_state IN ('active', 'dormant', 'received'));

COMMENT ON COLUMN public.list_items.is_included_in_ai IS
  'Per-item Heart toggle (Convention #8), finally reaching list_items. Wishlist context loader filters on it.';
COMMENT ON COLUMN public.list_items.added_by IS
  'Attribution — the trust-loop UI renders "Mom added this" from it. PRD-43.';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. lists.list_type CHECK rebuild
-- ────────────────────────────────────────────────────────────────────────────
-- Base list from the CURRENT live constraint (queried 2026-07-07, NOT a
-- stale migration — ST-0 lesson): simple, checklist, reference, template,
-- randomizer, backburner, shopping, wishlist, expenses, packing, todo,
-- custom, guided_form, ideas, prayer (15 values).
--
-- + 'gift_ideas' — this PRD (§5.1).
--
-- + 'reward_list' — an INDEPENDENT, pre-existing F-21-class bug found while
--   rewriting this exact constraint (grep across src/ for `list_type:` writers
--   turned it up): src/components/studio/wizards/RewardsListWizard.tsx:420
--   writes `list_type: 'reward_list'` on every deploy and has done so since
--   the KIDS-REWARDS-PAGE build shipped — that literal has NEVER existed in
--   any historical version of this constraint (verified: grep across every
--   migration file for "reward_list" returns zero pre-existing hits). Every
--   RewardsListWizard deploy has been throwing a CHECK-constraint violation,
--   caught by the wizard's own try/catch, silently failing before
--   setDeployed(true) is ever reached — mom's rewards list was never created.
--   This migration restores ONLY the missing constraint value (the minimal,
--   additive F-21-precedent fix). The separately-tracked visibility gap (the
--   Lists page has no renderer for reward_list once it CAN deploy) is
--   STUDIO-EXPERIENCE finding F-19 / Slice ST-D — untouched here, coordination
--   note left in the active build file.
ALTER TABLE public.lists DROP CONSTRAINT IF EXISTS lists_list_type_check;
ALTER TABLE public.lists
  ADD CONSTRAINT lists_list_type_check
  CHECK (list_type IN (
    'simple', 'checklist', 'reference', 'template', 'randomizer', 'backburner',
    'shopping', 'wishlist', 'expenses', 'packing', 'todo', 'custom',
    'guided_form', 'ideas', 'prayer',
    'gift_ideas',
    'reward_list'
  ));

-- ────────────────────────────────────────────────────────────────────────────
-- 4. gift_claims (§5.2)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gift_claims (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  list_item_id          UUID REFERENCES public.list_items(id) ON DELETE SET NULL,
  item_title_snapshot   TEXT NOT NULL,
  claimed_by_member_id  UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  claimant_label        TEXT,
  share_link_id         UUID,
  status                TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'purchased', 'given')),
  claimed_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at           TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gift_claims_claimant_shape_check CHECK (
    (claimed_by_member_id IS NOT NULL AND claimant_label IS NULL AND share_link_id IS NULL)
    OR
    (claimed_by_member_id IS NULL AND claimant_label IS NOT NULL AND share_link_id IS NOT NULL)
  )
);

COMMENT ON TABLE public.gift_claims IS
  'Reserved/Purchased/Given marks — surprise-safe (subject-invisible, no kid read arm, no family-device arm). PRD-43 §5.2/§8.';

-- First-claim-wins: partial unique on active (unreleased) reserved/purchased claims per item.
CREATE UNIQUE INDEX IF NOT EXISTS uq_gift_claims_active_per_item
  ON public.gift_claims (list_item_id)
  WHERE status IN ('reserved', 'purchased') AND released_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gift_claims_family ON public.gift_claims (family_id);
CREATE INDEX IF NOT EXISTS idx_gift_claims_share_link ON public.gift_claims (share_link_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. wishlist_share_links (§5.3)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wishlist_share_links (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  list_id        UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  created_by     UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  token_hash     TEXT NOT NULL UNIQUE,
  label          TEXT NOT NULL,
  display_name   TEXT NOT NULL,
  scope          JSONB NOT NULL DEFAULT '{}'::jsonb,
  allow_reserve  BOOLEAN NOT NULL DEFAULT true,
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
  revoked_at     TIMESTAMPTZ,
  view_count     INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.wishlist_share_links IS
  'Tokenized, revocable, expiring gift-giver export links. token_hash is SHA-256 of a 128-bit token — raw token shown once client-side, never stored (PIN-hashing discipline). Public traffic ONLY via the wishlist-share Edge Function, never PostgREST. PRD-43 §5.3/§6.6.';
COMMENT ON COLUMN public.wishlist_share_links.scope IS
  '{occasions?: string[], item_ids?: uuid[], include_sizes: boolean, sizes_text?: string} — sizes_text is a FROZEN snapshot mom reviewed at creation; later archive edits never silently flow to an outstanding link.';

-- Now that wishlist_share_links exists, complete gift_claims.share_link_id's FK.
ALTER TABLE public.gift_claims
  DROP CONSTRAINT IF EXISTS gift_claims_share_link_id_fkey;
ALTER TABLE public.gift_claims
  ADD CONSTRAINT gift_claims_share_link_id_fkey
  FOREIGN KEY (share_link_id) REFERENCES public.wishlist_share_links(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wishlist_share_links_list ON public.wishlist_share_links (list_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_share_links_family ON public.wishlist_share_links (family_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. gift_history (§5.4)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gift_history (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id               UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id               UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  direction               TEXT NOT NULL CHECK (direction IN ('received', 'given')),
  item_title              TEXT NOT NULL,
  counterparty_label      TEXT,
  counterparty_member_id  UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  occasion                TEXT,
  given_on                DATE,
  source_list_item_id     UUID REFERENCES public.list_items(id) ON DELETE SET NULL,
  notes                   TEXT,
  photo_url               TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gift_history IS
  'Per-member gift memory-keeping (received + given), fed by claim given-transitions and manual entry. Mom-editable — NOT append-only (memory-keeping, not a financial ledger). given_on is a user-chosen DATE — Convention #257 exempt class, same as meal_plan_entries.entry_date. PRD-43 §5.4.';

CREATE INDEX IF NOT EXISTS idx_gift_history_family_member ON public.gift_history (family_id, member_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. util.gift_planning_access() — the single grant-check helper
-- ────────────────────────────────────────────────────────────────────────────
-- TRUE for the family's primary_parent, or an additional_adult holding the
-- family-wide gift_planning grant (studio/reward_rules shape — NOT per-kid;
-- 'manage' is the canonical on-value, any non-'none' counts, Permission Hub
-- binary Off/Allowed render precedent). FALSE for family-shadow sessions BY
-- CONSTRUCTION: their family_members.role is 'family', which matches neither
-- the primary_parent nor the additional_adult branch below — no explicit
-- shadow check needed, unlike util.is_family_shadow_of's own shape.

CREATE OR REPLACE FUNCTION util.gift_planning_access(p_family UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.family_id = p_family
      AND fm.role = 'primary_parent'
  )
  OR COALESCE((
    SELECT COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none')
    FROM public.family_members fm
    JOIN public.member_permissions mp
      ON mp.granted_to = fm.id
     AND mp.family_id = fm.family_id
    WHERE fm.user_id = auth.uid()
      AND fm.family_id = p_family
      AND fm.role = 'additional_adult'
      AND mp.permission_key = 'gift_planning'
      AND mp.target_member_id IS NULL
    LIMIT 1
  ), 'none') <> 'none';
$$;

REVOKE ALL ON FUNCTION util.gift_planning_access(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.gift_planning_access(UUID) TO authenticated;

COMMENT ON FUNCTION util.gift_planning_access(UUID) IS
  'Surprise-safety grant check (PRD-43): TRUE for primary_parent or a gift_planning-granted additional_adult on a REAL member session. FALSE for family-shadow sessions by construction (role=family matches neither branch). Powers the RESTRICTIVE gift_ideas policies AND the granted-access permissive policies on lists/list_items/gift_claims/wishlist_share_links/gift_history.';

-- ────────────────────────────────────────────────────────────────────────────
-- 8. RESTRICTIVE gift_ideas-exclusion policies (the structural close of the
--    lists_family_device hole — ANDs over EVERY permissive policy, present
--    and future)
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "lists_gift_ideas_restrict" ON public.lists;
CREATE POLICY "lists_gift_ideas_restrict" ON public.lists
  AS RESTRICTIVE
  FOR ALL
  USING (list_type IS DISTINCT FROM 'gift_ideas' OR util.gift_planning_access(family_id))
  WITH CHECK (list_type IS DISTINCT FROM 'gift_ideas' OR util.gift_planning_access(family_id));

COMMENT ON POLICY "lists_gift_ideas_restrict" ON public.lists IS
  'PRD-43: closes lists_family_device (migration 100262) for gift_ideas rows. RESTRICTIVE — ANDs over every present/future permissive policy, including any future FDWA family-shadow expansion. Never grants; only narrows.';

DROP POLICY IF EXISTS "li_gift_ideas_restrict" ON public.list_items;
CREATE POLICY "li_gift_ideas_restrict" ON public.list_items
  AS RESTRICTIVE
  FOR ALL
  USING (
    list_id IN (
      SELECT id FROM public.lists
      WHERE list_type IS DISTINCT FROM 'gift_ideas' OR util.gift_planning_access(family_id)
    )
  )
  WITH CHECK (
    list_id IN (
      SELECT id FROM public.lists
      WHERE list_type IS DISTINCT FROM 'gift_ideas' OR util.gift_planning_access(family_id)
    )
  );

COMMENT ON POLICY "li_gift_ideas_restrict" ON public.list_items IS
  'PRD-43: mirrors lists_gift_ideas_restrict via parent-list join. Closes li_family_device for gift_ideas item rows.';

-- ────────────────────────────────────────────────────────────────────────────
-- 9. PERMISSIVE gift_ideas granted-access policies — RESTRICTIVE policies
--    only narrow; a granted additional_adult needs an affirmative permissive
--    grant, since lists_owner_or_parent never matches him (mom owns the
--    gift_ideas list, not him).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "lists_gift_planning_granted" ON public.lists;
CREATE POLICY "lists_gift_planning_granted" ON public.lists
  FOR ALL
  USING (list_type = 'gift_ideas' AND util.gift_planning_access(family_id))
  WITH CHECK (list_type = 'gift_ideas' AND util.gift_planning_access(family_id));

DROP POLICY IF EXISTS "li_gift_planning_granted" ON public.list_items;
CREATE POLICY "li_gift_planning_granted" ON public.list_items
  FOR ALL
  USING (
    list_id IN (SELECT id FROM public.lists WHERE list_type = 'gift_ideas' AND util.gift_planning_access(family_id))
  )
  WITH CHECK (
    list_id IN (SELECT id FROM public.lists WHERE list_type = 'gift_ideas' AND util.gift_planning_access(family_id))
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 10. PERMISSIVE wishlist adult-default-access policy (D-43-5)
-- ────────────────────────────────────────────────────────────────────────────
-- A KID's wishlist (owner has role='member') is visible+writable to any
-- additional_adult in the family BY DEFAULT — the in-store trust-anchor use
-- case needs no grant. Any OTHER wishlist (mom's own, another adult's)
-- requires the gift_planning grant — "the adult-to-adult gifting loop works
-- with zero extra machinery" (PRD §11 edge case 13), reusing the exact same
-- helper as gift_ideas access. Special Adults are never matched (distinct
-- role value; this policy never checks for it).

DROP POLICY IF EXISTS "lists_wishlist_adult_access" ON public.lists;
CREATE POLICY "lists_wishlist_adult_access" ON public.lists
  FOR ALL
  USING (
    list_type = 'wishlist'
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'additional_adult'
    )
    AND (
      owner_id IN (SELECT id FROM public.family_members WHERE family_id = lists.family_id AND role = 'member')
      OR util.gift_planning_access(family_id)
    )
  )
  WITH CHECK (
    list_type = 'wishlist'
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'additional_adult'
    )
    AND (
      owner_id IN (SELECT id FROM public.family_members WHERE family_id = lists.family_id AND role = 'member')
      OR util.gift_planning_access(family_id)
    )
  );

COMMENT ON POLICY "lists_wishlist_adult_access" ON public.lists IS
  'PRD-43 D-43-5: additional_adult reads+writes kids'' wishlists by default (owner role=member); mom''s/other adults'' own wishlists need the gift_planning grant. Never matches special_adult (distinct role value).';

DROP POLICY IF EXISTS "li_wishlist_adult_access" ON public.list_items;
CREATE POLICY "li_wishlist_adult_access" ON public.list_items
  FOR ALL
  USING (
    list_id IN (
      SELECT l.id FROM public.lists l
      WHERE l.list_type = 'wishlist'
        AND l.family_id IN (
          SELECT fm.family_id FROM public.family_members fm
          WHERE fm.user_id = auth.uid() AND fm.role = 'additional_adult'
        )
        AND (
          l.owner_id IN (SELECT id FROM public.family_members WHERE family_id = l.family_id AND role = 'member')
          OR util.gift_planning_access(l.family_id)
        )
    )
  )
  WITH CHECK (
    list_id IN (
      SELECT l.id FROM public.lists l
      WHERE l.list_type = 'wishlist'
        AND l.family_id IN (
          SELECT fm.family_id FROM public.family_members fm
          WHERE fm.user_id = auth.uid() AND fm.role = 'additional_adult'
        )
        AND (
          l.owner_id IN (SELECT id FROM public.family_members WHERE family_id = l.family_id AND role = 'member')
          OR util.gift_planning_access(l.family_id)
        )
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 11. gift_claims / wishlist_share_links / gift_history RLS
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.gift_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gc_adult_access" ON public.gift_claims;
CREATE POLICY "gc_adult_access" ON public.gift_claims
  FOR ALL
  USING (
    util.gift_planning_access(family_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.list_items li
      JOIN public.lists l ON l.id = li.list_id
      JOIN public.family_members me ON me.user_id = auth.uid()
      WHERE li.id = gift_claims.list_item_id
        AND (l.owner_id = me.id OR l.subject_member_id = me.id)
    )
  )
  WITH CHECK (
    util.gift_planning_access(family_id)
    AND (claimed_by_member_id IS NULL OR claimed_by_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid()))
    AND NOT EXISTS (
      SELECT 1 FROM public.list_items li
      JOIN public.lists l ON l.id = li.list_id
      JOIN public.family_members me ON me.user_id = auth.uid()
      WHERE li.id = gift_claims.list_item_id
        AND (l.owner_id = me.id OR l.subject_member_id = me.id)
    )
  );

COMMENT ON POLICY "gc_adult_access" ON public.gift_claims IS
  'PRD-43 §5.2/§8: gift_planning-granted adults only, EXCLUDING claims on their own list (subject-exclusion — nobody, including mom, reads claims against themselves). No kid arm, no family-device arm by omission. External link-holder claims go through the wishlist-share Edge Function (service role), never PostgREST.';

ALTER TABLE public.wishlist_share_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wsl_adult_access" ON public.wishlist_share_links;
CREATE POLICY "wsl_adult_access" ON public.wishlist_share_links
  FOR ALL
  USING (util.gift_planning_access(family_id))
  WITH CHECK (util.gift_planning_access(family_id));

ALTER TABLE public.gift_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gh_adult_access" ON public.gift_history;
CREATE POLICY "gh_adult_access" ON public.gift_history
  FOR ALL
  USING (util.gift_planning_access(family_id))
  WITH CHECK (util.gift_planning_access(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 12. Feature keys, tier access, explicit-grant-only profile rows,
--     apply_permission_profile rewrite
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('gift_planning', 'Gift Planning', 'Family-wide grant: mom''s hidden gift-ideas lists, claims, share links, and gift history for every kid. Explicit-grant-only (studio/reward_rules shape) — never auto-granted by a permission profile.', 'PRD-43'),
  ('wishlists_basic', 'WishLists', 'Personal wishlist — capture, view, refine, reorder. Available to every role by default (except Special Adult).', 'PRD-43'),
  ('wishlists_capture', 'WishLists Capture', 'WishCatch capture sheet — text/voice/photo/link, ~5-second capture.', 'PRD-43'),
  ('wishlists_share_links', 'WishLists Share Links', 'Tokenized gift-giver share links.', 'PRD-43')
ON CONFLICT (feature_key) DO NOTHING;

DO $$
DECLARE
  v_essential UUID;
  v_enhanced UUID;
BEGIN
  SELECT id INTO v_essential FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;
  SELECT id INTO v_enhanced FROM public.subscription_tiers WHERE slug = 'enhanced' LIMIT 1;

  IF v_essential IS NOT NULL THEN
    INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
    VALUES
      ('wishlists_basic',       'mom',               v_essential, true),
      ('wishlists_basic',       'dad_adults',        v_essential, true),
      ('wishlists_basic',       'independent_teens', v_essential, true),
      ('wishlists_basic',       'guided_kids',       v_essential, true),
      ('wishlists_basic',       'play_kids',         v_essential, true),
      ('wishlists_capture',     'mom',               v_essential, true),
      ('wishlists_capture',     'dad_adults',        v_essential, true),
      ('wishlists_capture',     'independent_teens', v_essential, true),
      ('wishlists_capture',     'guided_kids',       v_essential, true),
      ('wishlists_share_links', 'mom',               v_essential, true),
      ('wishlists_share_links', 'dad_adults',        v_essential, true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_enhanced IS NOT NULL THEN
    INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
    VALUES ('gift_planning', 'dad_adults', v_enhanced, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- gift_planning is explicit-grant-only — profiles never auto-grant it.
INSERT INTO public.permission_level_profiles
  (role_group, level, feature_key, feature_enabled, default_permission_level)
SELECT 'dad_adults', lvl, 'gift_planning', false, 'none'
FROM unnest(ARRAY['light', 'balanced', 'maximum']) AS lvl
ON CONFLICT (role_group, level, feature_key) DO UPDATE
  SET feature_enabled = false, default_permission_level = 'none';

-- apply_permission_profile — rewritten from its CURRENT body (migration
-- 100264, confirmed the latest via grep across every migration that has ever
-- defined this function) with 'gift_planning' added to BOTH exclusion lists.
CREATE OR REPLACE FUNCTION public.apply_permission_profile(
  p_family_id UUID,
  p_member_id UUID,
  p_role_group TEXT,
  p_level TEXT
) RETURNS void AS $$
DECLARE
  v_mom_id UUID;
BEGIN
  SELECT id INTO v_mom_id
  FROM family_members
  WHERE family_id = p_family_id AND role = 'primary_parent' AND is_active = true
  LIMIT 1;

  -- Layer 2: reset toggles from profile
  DELETE FROM member_feature_toggles
  WHERE family_id = p_family_id AND member_id = p_member_id;

  INSERT INTO member_feature_toggles (
    family_id, member_id, feature_key, is_disabled, enabled,
    blocked_by_tier, applied_profile_level, disabled_by
  )
  SELECT
    p_family_id,
    p_member_id,
    plp.feature_key,
    NOT plp.feature_enabled,
    plp.feature_enabled,
    false,
    p_level,
    COALESCE(v_mom_id, p_member_id)
  FROM permission_level_profiles plp
  WHERE plp.role_group = p_role_group AND plp.level = p_level;

  -- Layer 3: reset per-kid grants from profile (adult roles only).
  -- EXPLICIT-GRANT-ONLY keys are never deleted nor created here — a profile
  -- reset must not wipe mom's finance/management/assignment/gift-planning
  -- grants (PERMISSIONS-WIRING 2026-06-09 + RR-DEPLOY-SCOPING 2026-06-10 +
  -- PRD-43 2026-07-07). settings_basic is personal-shaped and no longer gets
  -- per-kid rows.
  IF p_role_group IN ('dad_adults', 'special_adults') AND v_mom_id IS NOT NULL THEN
    DELETE FROM member_permissions
    WHERE family_id = p_family_id
      AND granted_to = p_member_id
      AND permission_key NOT IN ('financial_tracking', 'studio', 'reward_rules', 'task_assignment', 'gift_planning');

    INSERT INTO member_permissions (
      family_id, granting_member_id, granted_to, target_member_id,
      permission_key, access_level
    )
    SELECT
      p_family_id,
      v_mom_id,
      p_member_id,
      child.id,
      plp.feature_key,
      plp.default_permission_level
    FROM permission_level_profiles plp
    CROSS JOIN family_members child
    WHERE plp.role_group = p_role_group
      AND plp.level = p_level
      AND plp.feature_enabled = true
      AND plp.feature_key NOT IN ('settings_basic', 'financial_tracking', 'studio', 'reward_rules', 'task_assignment', 'gift_planning')
      AND child.family_id = p_family_id
      AND child.role = 'member'
      AND child.is_active = true
    ON CONFLICT (family_id, granted_to, target_member_id, permission_key) DO UPDATE
    SET access_level = EXCLUDED.access_level;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────────────────
-- 13. Member-removal auto-revoke for outstanding share links (PRD §11 edge
--     case 10)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.revoke_wishlist_share_links_on_member_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE public.wishlist_share_links
    SET revoked_at = now()
    WHERE revoked_at IS NULL
      AND list_id IN (SELECT id FROM public.lists WHERE owner_id = NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revoke_wishlist_share_links_on_member_removal ON public.family_members;
CREATE TRIGGER trg_revoke_wishlist_share_links_on_member_removal
  AFTER UPDATE OF is_active ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.revoke_wishlist_share_links_on_member_removal();

COMMENT ON FUNCTION public.revoke_wishlist_share_links_on_member_removal() IS
  'PRD-43 §11 edge case 10: when a member is soft-removed (is_active true→false), any outstanding share links for lists they own are revoked. Fires on the transition only, never re-fires on subsequent updates.';

-- ────────────────────────────────────────────────────────────────────────────
-- 14. wishlist-images storage bucket (family-avatars shape — public,
--     unscoped RLS; object names are unguessable UUIDs, content is non-
--     sensitive item photos that also need to render on the public share
--     page without a signed-URL round trip)
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wishlist-images', 'wishlist-images', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload wishlist images" ON storage.objects;
CREATE POLICY "Authenticated users can upload wishlist images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wishlist-images');

DROP POLICY IF EXISTS "Authenticated users can update wishlist images" ON storage.objects;
CREATE POLICY "Authenticated users can update wishlist images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'wishlist-images')
WITH CHECK (bucket_id = 'wishlist-images');

DROP POLICY IF EXISTS "Authenticated users can delete wishlist images" ON storage.objects;
CREATE POLICY "Authenticated users can delete wishlist images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'wishlist-images');

DROP POLICY IF EXISTS "Public can read wishlist images" ON storage.objects;
CREATE POLICY "Public can read wishlist images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wishlist-images');

-- ────────────────────────────────────────────────────────────────────────────
-- 15. Verification
-- ────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_gc INTEGER;
  v_wsl INTEGER;
  v_gh INTEGER;
  v_lists_policies INTEGER;
  v_li_policies INTEGER;
  v_keys INTEGER;
  v_bucket INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gc FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gift_claims';
  SELECT COUNT(*) INTO v_wsl FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wishlist_share_links';
  SELECT COUNT(*) INTO v_gh FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gift_history';
  SELECT COUNT(*) INTO v_lists_policies FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lists';
  SELECT COUNT(*) INTO v_li_policies FROM pg_policies WHERE schemaname = 'public' AND tablename = 'list_items';
  SELECT COUNT(*) INTO v_keys FROM public.feature_key_registry WHERE feature_key IN ('gift_planning', 'wishlists_basic', 'wishlists_capture', 'wishlists_share_links');
  SELECT COUNT(*) INTO v_bucket FROM storage.buckets WHERE id = 'wishlist-images';

  RAISE NOTICE '[100292] gift_claims policies: % (expected 1)', v_gc;
  RAISE NOTICE '[100292] wishlist_share_links policies: % (expected 1)', v_wsl;
  RAISE NOTICE '[100292] gift_history policies: % (expected 1)', v_gh;
  RAISE NOTICE '[100292] lists policies: % (expected 8: 4 pre-existing + restrict + granted + wishlist_adult_access, 100262''s family_device retained)', v_lists_policies;
  RAISE NOTICE '[100292] list_items policies: % (expected 6: 3 pre-existing + restrict + granted + wishlist_adult_access)', v_li_policies;
  RAISE NOTICE '[100292] PRD-43 feature keys: % (expected 4)', v_keys;
  RAISE NOTICE '[100292] wishlist-images bucket exists: %', v_bucket;
END
$$;

COMMIT;
