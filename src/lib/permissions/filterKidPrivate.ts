/**
 * filterKidPrivate — origin-keyed render-time filter for kid-private rows.
 *
 * A single, pure helper that decides whether kid-private content renders,
 * based on the active View-As origin. It generalizes the inline filter that
 * lived in Journal.tsx (`isViewingAs ? rawEntries.filter(...) : rawEntries`)
 * into a shared, testable primitive that keys on `origin` rather than the
 * coarse `isViewingAs` boolean.
 *
 * Semantics (founder-locked Q4, Convention #39):
 *
 *   - origin === 'mom_viewing'    → HIDE rows where isKidPrivate(item) is true.
 *                                    Mom is viewing the kid's surface; the kid's
 *                                    private content (private journal entries,
 *                                    LiLa conversations, self-knowledge the kid
 *                                    chose not to share with mom) must not leak.
 *   - origin === 'member_session' → SHOW everything. The kid authenticated at
 *                                    the hub and is viewing their OWN surface;
 *                                    nothing is private from themselves.
 *   - origin === null             → SHOW everything. No View-As session is
 *                                    active, so this is the data subject's own
 *                                    normal session (kid signed in directly, or
 *                                    mom viewing her own data). No filtering.
 *
 * Critical: `origin === null` means "no filtering needed," NOT "default-deny."
 * The hook `useEffectiveViewer()` returns `origin: null` outside View-As scope,
 * and `useEffectiveMember()` returns `origin: null` for the auth user's own
 * session. Both must render their full data set. This helper never hides on a
 * null origin.
 *
 * Display-only: this filter governs what a surface RENDERS. It does not change
 * underlying math, aggregation, or RLS. Privacy Filtered (Convention #76) and
 * Safe Harbor aggregation exclusion (Convention #243) are enforced elsewhere
 * (context-assembly pipeline + RLS) and are unaffected by this helper.
 *
 * Convention #39 (View As Identity-Scope Architecture).
 */

import type { ViewAsOrigin } from './ViewAsProvider'

export interface FilterKidPrivateOptions<T> {
  /** Active View-As origin, or `null` when no session is active. */
  origin: ViewAsOrigin | null
  /** Returns true when the item is private to the kid (hide from mom). */
  isKidPrivate: (item: T) => boolean
}

/**
 * Returns the subset of `items` that should render for the current viewer.
 * Only filters when `origin === 'mom_viewing'`; passes everything through for
 * `'member_session'` and `null`.
 */
export function filterKidPrivate<T>(
  items: T[],
  { origin, isKidPrivate }: FilterKidPrivateOptions<T>,
): T[] {
  // Only mom-viewing-a-kid hides kid-private rows. member_session (kid at the
  // hub viewing their own surface) and null (no View-As) render everything.
  if (origin !== 'mom_viewing') return items
  return items.filter((item) => !isKidPrivate(item))
}
