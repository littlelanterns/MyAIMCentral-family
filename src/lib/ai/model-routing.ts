/**
 * Model Routing — PRD-05 LiLaEdge
 *
 * Maps guided mode model_tier to OpenRouter model IDs.
 * Sonnet: emotional intelligence, complex reasoning, nuanced conversation
 * Haiku: utilitarian tasks, FAQ, pattern matching, structured extraction
 */

export const OPENROUTER_MODELS = {
  sonnet: 'anthropic/claude-sonnet-4',
  haiku: 'anthropic/claude-haiku-4.5',
} as const

export type ModelTier = keyof typeof OPENROUTER_MODELS

export function getModelId(tier: ModelTier): string {
  return OPENROUTER_MODELS[tier]
}

/**
 * Per PRD-05 model routing table:
 * - General chat, Marriage Toolbox, Cyrano, Higgins, ThoughtSift → Sonnet
 * - Help mode (FAQ), Assist mode (guidance), task breakdown → Haiku
 */
export function getModelForMode(modeKey: string, modelTier: ModelTier): string {
  return getModelId(modelTier)
}

/** Estimate cost for token usage (rough, for tracking) */
export function estimateCost(modelTier: ModelTier, inputTokens: number, outputTokens: number): number {
  // Approximate pricing per 1M tokens (as of 2026)
  const pricing: Record<ModelTier, { input: number; output: number }> = {
    sonnet: { input: 3.0, output: 15.0 },
    haiku: { input: 0.25, output: 1.25 },
  }

  const p = pricing[modelTier]
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000
}
