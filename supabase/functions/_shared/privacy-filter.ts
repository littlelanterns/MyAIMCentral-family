/**
 * Role-asymmetric privacy filter for archive_context_items.
 *
 * Convention #76 (CLAUDE.md): `is_privacy_filtered = true` items are NEVER
 * included in non-mom context regardless of any toggle state. Primary parent
 * (mom) sees everything; all other roles are excluded from filtered rows.
 *
 * Usage:
 *   const isMom = await isPrimaryParent(supabase, requestingMemberId)
 *   const query = supabase.from('archive_context_items').select('*')
 *   const { data } = await applyPrivacyFilter(query, isMom)
 *
 * Reference: RECON_DECISIONS_RESOLVED.md Decision 6.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Returns true iff the given member's row in family_members has
 * role = 'primary_parent'. Returns false for missing/empty memberId
 * or when no matching row is found.
 */
export async function isPrimaryParent(
  supabase: SupabaseClient,
  memberId: string | null | undefined,
): Promise<boolean> {
  if (!memberId) return false

  const { data, error } = await supabase
    .from('family_members')
    .select('role')
    .eq('id', memberId)
    .maybeSingle()

  if (error || !data) return false
  return data.role === 'primary_parent'
}

/**
 * Conditionally appends .eq('is_privacy_filtered', false) to a Supabase
 * query builder. If the requester is the primary parent, returns the query
 * unchanged (mom sees everything). Otherwise excludes privacy-filtered rows.
 *
 * Type note: The generic `T` is structurally typed on `.eq()` to stay
 * permissive across Supabase's query builder chain classes
 * (PostgrestFilterBuilder, PostgrestTransformBuilder, etc.) where `.eq()`
 * may return a specific subtype rather than the exact input type. If a
 * call site needs a more precise return type, cast explicitly at the
 * call site rather than tightening the constraint here.
 */
export function applyPrivacyFilter<
  T extends { eq: (column: string, value: unknown) => T },
>(query: T, requesterIsPrimaryParent: boolean): T {
  if (requesterIsPrimaryParent) return query
  return query.eq('is_privacy_filtered', false)
}
