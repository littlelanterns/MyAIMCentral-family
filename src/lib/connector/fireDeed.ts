import { supabase } from '@/lib/supabase/client'

export interface FireDeedParams {
  familyId: string
  memberId: string
  sourceType: string
  sourceId: string
  metadata?: Record<string, unknown>
  idempotencyKey: string
}

export async function fireDeed(params: FireDeedParams): Promise<void> {
  try {
    await supabase.from('deed_firings').insert({
      family_id: params.familyId,
      family_member_id: params.memberId,
      source_type: params.sourceType,
      source_id: params.sourceId,
      metadata: params.metadata ?? {},
      idempotency_key: params.idempotencyKey,
    })
  } catch (err) {
    console.warn('[fireDeed] non-blocking error:', err)
  }
}
