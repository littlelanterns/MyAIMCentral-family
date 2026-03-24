/**
 * Utility AI call — non-streaming.
 * For parsing, sorting, classifying, bulk add, and other structured AI tasks.
 * Uses the ai-parse Edge Function (Haiku by default for speed/cost).
 */

import { supabase } from '@/lib/supabase/client'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function sendAIMessage(
  systemPrompt: string,
  messages: ChatMessage[],
  maxTokens = 2048,
  modelTier: 'sonnet' | 'haiku' = 'haiku',
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({
      system_prompt: systemPrompt,
      messages,
      max_tokens: maxTokens,
      model_tier: modelTier,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`AI call failed: ${errText}`)
  }

  const data = await response.json()
  if (data.error) throw new Error(data.error)

  return data.content || ''
}

/**
 * Parse a JSON response from AI, handling markdown fences and extra text.
 */
export function extractJSON<T>(response: string): T | null {
  // Strip markdown code fences
  const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

  // Try to find JSON array or object
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
  const objectMatch = cleaned.match(/\{[\s\S]*\}/)

  const jsonStr = arrayMatch?.[0] || objectMatch?.[0]
  if (!jsonStr) return null

  try {
    return JSON.parse(jsonStr) as T
  } catch {
    return null
  }
}
