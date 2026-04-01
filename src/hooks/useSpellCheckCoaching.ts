/**
 * PRD-25 Phase B: Spell Check Coaching hook
 * 3-tier lookup: static JSON seed → DB cache → AI fallback Edge Function
 */

import { useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import seedData from '@/data/spelling-coaching-seed.json'

export interface SpellCoachingResult {
  misspelling: string
  correction: string
  explanation: string
  source: 'seed' | 'cache' | 'ai'
}

interface UseSpellCheckCoachingReturn {
  getCoaching: (misspelling: string, correction: string) => Promise<SpellCoachingResult | null>
}

// Build a lookup map from the static seed
const seedMap = new Map<string, { correction: string; explanation: string }>()
for (const entry of seedData) {
  seedMap.set(entry.misspelling.toLowerCase(), {
    correction: entry.correction,
    explanation: entry.explanation,
  })
}

export function useSpellCheckCoaching(): UseSpellCheckCoachingReturn {
  // Session-level in-memory cache to avoid repeat queries
  const sessionCache = useRef(new Map<string, SpellCoachingResult>())

  const getCoaching = useCallback(async (
    misspelling: string,
    correction: string,
  ): Promise<SpellCoachingResult | null> => {
    const key = misspelling.toLowerCase()

    // Check in-memory session cache first
    const cached = sessionCache.current.get(key)
    if (cached) return cached

    // Tier 1: Static JSON seed
    const seedEntry = seedMap.get(key)
    if (seedEntry) {
      const result: SpellCoachingResult = {
        misspelling,
        correction: seedEntry.correction,
        explanation: seedEntry.explanation,
        source: 'seed',
      }
      sessionCache.current.set(key, result)
      return result
    }

    // Tier 2: spelling_coaching_cache table
    try {
      const { data: dbEntry } = await supabase
        .from('spelling_coaching_cache')
        .select('correction, explanation')
        .ilike('misspelling', key)
        .limit(1)
        .maybeSingle()

      if (dbEntry) {
        const result: SpellCoachingResult = {
          misspelling,
          correction: dbEntry.correction,
          explanation: dbEntry.explanation,
          source: 'cache',
        }
        sessionCache.current.set(key, result)
        return result
      }
    } catch {
      // DB lookup failed — fall through to AI
    }

    // Tier 3: Edge Function → Haiku AI generates explanation → writes back to cache
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/functions/v1/spelling-coach`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ misspelling: key, correction, language: 'en' }),
      })

      if (!response.ok) return null

      const data = await response.json()
      if (data.explanation) {
        const result: SpellCoachingResult = {
          misspelling,
          correction,
          explanation: data.explanation,
          source: 'ai',
        }
        sessionCache.current.set(key, result)
        return result
      }
    } catch {
      // AI fallback failed — return null
    }

    return null
  }, [])

  return { getCoaching }
}
