// Centralized AI cost logging for all Edge Functions.
// Single place to update model pricing when costs change.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

/** Pricing per million tokens — update here when model costs change */
export const MODEL_PRICING: Record<string, { input_per_million: number; output_per_million: number }> = {
  'anthropic/claude-sonnet-4': { input_per_million: 3.0, output_per_million: 15.0 },
  'anthropic/claude-haiku-4.5': { input_per_million: 0.25, output_per_million: 1.25 },
  'anthropic/claude-haiku-4-5-20251001': { input_per_million: 0.8, output_per_million: 4.0 },
  'whisper-1': { input_per_million: 0, output_per_million: 0 }, // TODO: Add Whisper pricing (per-minute, not per-token)
  'text-embedding-3-small': { input_per_million: 0.02, output_per_million: 0 }, // TODO: Verify embedding pricing
}

/**
 * Log AI usage cost to `ai_usage_tracking`. Fire-and-forget — never blocks
 * the main request and silently swallows errors.
 */
export function logAICost(params: {
  familyId: string
  memberId: string
  featureKey: string
  model: string
  inputTokens: number
  outputTokens: number
}): void {
  const pricing = MODEL_PRICING[params.model] || { input_per_million: 0, output_per_million: 0 }
  const estimatedCost = (
    params.inputTokens * pricing.input_per_million +
    params.outputTokens * pricing.output_per_million
  ) / 1_000_000

  supabase.from('ai_usage_tracking').insert({
    family_id: params.familyId,
    member_id: params.memberId,
    feature_key: params.featureKey,
    model: params.model,
    tokens_used: params.inputTokens + params.outputTokens,
    estimated_cost: estimatedCost,
  }).then(() => {}).catch(() => {})
}
