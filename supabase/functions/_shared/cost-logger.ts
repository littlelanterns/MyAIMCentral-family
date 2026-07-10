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

// ai_usage_tracking.family_id AND member_id are both NOT NULL with FKs to
// families/family_members. A missing id — or the '00000000-...' sentinel some
// callers historically passed for member-less/platform-level calls — FK-
// violates, and the old `.catch(() => {})` swallowed the failure. That is
// exactly how safety_classification and ethics_validation cost telemetry went
// blind for their entire lifetimes (0 rows in production). Skip loudly rather
// than fire a doomed insert, and warn on any real insert error so this class
// can never hide again (Silent Tooling Failure discipline).
const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

/**
 * Log AI usage cost to `ai_usage_tracking`. Fire-and-forget — never blocks the
 * main request. Callers MUST pass the real family/member ids (both are NOT
 * NULL FKs); pass a real member id or omit the log — the zero-UUID sentinel is
 * treated as "no id" and skipped with a warning.
 */
export function logAICost(params: {
  familyId: string | null
  memberId: string | null
  featureKey: string
  model: string
  inputTokens: number
  outputTokens: number
}): void {
  if (!params.familyId || !params.memberId || params.familyId === ZERO_UUID || params.memberId === ZERO_UUID) {
    console.warn(`logAICost skipped (${params.featureKey}): missing or sentinel family/member id — no cost row written`)
    return
  }

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
    // deno-lint-ignore no-explicit-any
  }).then(({ error }: any) => {
    if (error) console.warn(`logAICost insert failed (${params.featureKey}): ${error.message}`)
  }).catch((err: unknown) => console.warn(`logAICost threw (${params.featureKey}): ${(err as Error)?.message}`))
}
