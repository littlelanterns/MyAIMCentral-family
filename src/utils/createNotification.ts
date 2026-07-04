import { supabase } from '@/lib/supabase/client'
import type { CreateNotificationData } from '@/types/messaging'

/**
 * createNotification — Insert a notification record into Supabase.
 *
 * Used by calendar approve/reject, request lifecycle, messaging, reward
 * proposals, and any other feature that needs to notify a family member.
 *
 * Fire-and-forget by default — errors are logged, not thrown.
 * Pass throwOnError: true to propagate errors to the caller.
 *
 * IMPORTANT (KIDS-REWARDS-PAGE Slice 4 fix, 2026-07-01): this insert must NOT
 * chain .select() — PostgREST turns that into INSERT ... RETURNING, and
 * Postgres applies the SELECT policy (notif_select_own: recipient-only) to the
 * returned row. A sender is almost never the recipient, so EVERY client-side
 * cross-member notification (kid→mom request received, mom→kid outcomes,
 * calendar approvals, meeting completions, dad-payment pings) was failing RLS
 * 42501 at the RETURNING step and being silently swallowed by the
 * fire-and-forget catch. The INSERT policy itself (any authenticated) passes
 * fine without RETURNING. No caller consumed the returned id.
 */
export async function createNotification(
  data: CreateNotificationData,
  options?: { throwOnError?: boolean }
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      family_id: data.family_id,
      recipient_member_id: data.recipient_member_id,
      notification_type: data.notification_type,
      category: data.category,
      title: data.title,
      body: data.body ?? null,
      source_type: data.source_type ?? null,
      source_reference_id: data.source_reference_id ?? null,
      action_url: data.action_url ?? null,
      priority: data.priority ?? 'normal',
      delivery_method: 'in_app',
    })

  if (error) {
    console.error('[createNotification] Failed:', error.message)
    if (options?.throwOnError) throw error
    return false
  }

  return true
}
