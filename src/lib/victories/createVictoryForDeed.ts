import { supabase } from '@/lib/supabase/client'

export interface CreateVictoryForDeedParams {
  familyId: string
  memberId: string
  description: string
  source: string
  sourceReferenceId: string
  lifeAreaTags?: string[]
  guidingStarId?: string
  bestIntentionId?: string
}

export async function createVictoryForDeed(params: CreateVictoryForDeedParams) {
  const { data: existing } = await supabase
    .from('victories')
    .select('id')
    .eq('family_id', params.familyId)
    .eq('family_member_id', params.memberId)
    .eq('source', params.source)
    .eq('source_reference_id', params.sourceReferenceId)
    .limit(1)

  if (existing && existing.length > 0) return existing[0]

  const { data, error } = await supabase.from('victories').insert({
    family_id: params.familyId,
    family_member_id: params.memberId,
    description: params.description,
    source: params.source,
    source_reference_id: params.sourceReferenceId,
    life_area_tags: params.lifeAreaTags ?? [],
    guiding_star_id: params.guidingStarId ?? null,
    best_intention_id: params.bestIntentionId ?? null,
    importance: 'small_win',
  }).select('id').single()

  if (error) throw error
  return data
}
