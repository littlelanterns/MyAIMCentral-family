-- ============================================================================
-- 00000000100297_list_items_priority_wishlist_values.sql
-- ============================================================================
-- PRD-43 WishLists §6.2/§6.3: Must-Have / Would-Love / Nice-to-Have priority
-- chips map onto the existing list_items.priority column.
--
-- F-21-class bug found live during the Convention #277 eyes-on tour: the TS
-- type `ListItemPriority` has declared 'must_have' | 'would_love' |
-- 'nice_to_have' as valid values (predating this build — the type comment
-- in src/types/lists.ts already documented the mapping intent), but the
-- LIVE list_items_priority_check constraint only ever allowed
-- ('low','medium','high','urgent') — verified via a direct INSERT probe
-- against production, which threw 23514. Every attempt to set a wishlist
-- item's priority through the app would have thrown at the DB layer. This
-- migration restores the missing three values additively (todo-list
-- priority usage of low/medium/high/urgent is untouched).
-- ============================================================================

BEGIN;

ALTER TABLE public.list_items DROP CONSTRAINT IF EXISTS list_items_priority_check;
ALTER TABLE public.list_items
  ADD CONSTRAINT list_items_priority_check
  CHECK (priority IS NULL OR priority = ANY (ARRAY[
    'low', 'medium', 'high', 'urgent',
    'must_have', 'would_love', 'nice_to_have'
  ]));

COMMIT;
