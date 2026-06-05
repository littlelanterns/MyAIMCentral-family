/**
 * useEffectiveViewer — exposes "who is physically pressing the buttons"
 * signals for the current render.
 *
 * This is distinct from both `useFamilyMember()` (the auth user) and
 * `useEffectiveMember()` (the data subject). It answers a third
 * question: is the real human at the device the same person as the
 * data subject?
 *
 *   - 'mom_viewing'    flow: mom IS the auth user. Mom is viewing as a
 *                            kid. realHumanIsTarget = FALSE (mom is
 *                            the real human, the kid is the data
 *                            subject). UI affordances should still
 *                            feel like mom is in control (e.g. show
 *                            "Manage tasks for [kid]" shortcuts; the
 *                            View-As banner remains visible; some
 *                            kid-only affordances stay hidden).
 *   - 'member_session' flow: kid authenticated at the hub. Mom is
 *                            still technically the auth user (PIN-only
 *                            kids have no Supabase user_id today), but
 *                            the kid IS the real human pressing the
 *                            buttons. realHumanIsTarget = TRUE. UI
 *                            affordances should feel like the kid's
 *                            own surface (e.g. hide mom-y shortcuts,
 *                            show kid-private content, allow PIN
 *                            entry as the kid not as mom).
 *
 * Consumed by `filterKidPrivate()` (Worker 5) to decide whether
 * kid-private rows render. Also consumed by the View-As banner
 * (Worker 5) to flip the "Manage Tasks" button visibility based on
 * origin.
 *
 * Migration-point note: when per-kid Supabase auth lands, `member_session`
 * flows will involve a real auth swap and the `realHumanIsTarget`
 * concept collapses into "is the auth user the data subject?" This
 * hook is designed so call sites become no-ops at that point — same
 * truth signal, simpler underlying derivation.
 *
 * Convention #39 (View As Identity-Scope Architecture).
 */

import { useViewAs, type ViewAsOrigin } from '@/lib/permissions/ViewAsProvider'

export interface UseEffectiveViewerResult {
  /**
   * TRUE when the real human at the device IS the data subject (kid
   * authenticated at the hub). FALSE in normal mom-viewing flows AND
   * when no View-As session is active (the user IS themselves, but
   * the question is only meaningful inside a View-As context — outside,
   * the answer is trivially "yes" for the auth user / "n/a" for
   * anyone else, so we return FALSE to preserve the "is this a
   * kid-driven session?" semantics that call sites care about).
   */
  realHumanIsTarget: boolean
  /** Origin of the active session, or `null` when not in View-As. */
  origin: ViewAsOrigin | null
  /** Convenience flag — whether a View-As session is active at all. */
  isViewingAs: boolean
}

export function useEffectiveViewer(): UseEffectiveViewerResult {
  const { isViewingAs, origin } = useViewAs()

  return {
    realHumanIsTarget: origin === 'member_session',
    origin,
    isViewingAs,
  }
}
