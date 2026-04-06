import { supabase } from '@/lib/supabase/client'
import type { CreateNotificationData } from '@/types/messaging'

/**
 * createNotification — Insert a notification record into Supabase.
 *
 * Used by calendar approve/reject, request lifecycle, messaging,
 * and any other feature that needs to notify a family member.
 *
 * Fire-and-forget by default — errors are logged, not thrown.
 * Pass throwOnError: true to propagate errors to the caller.
 */
export async function createNotification(
  data: CreateNotificationData,
  options?: { throwOnError?: boolean }
): Promise<string | null> {
  const { data: row, error } = await supabase
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
    .select('id')
    .single()

  if (error) {
    console.error('[createNotification] Failed:', error.message)
    if (options?.throwOnError) throw error
    return null
  }

  return row.id
}
