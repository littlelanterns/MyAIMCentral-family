/**
 * useDebounce — generic value debounce hook
 *
 * Created Build M Sub-phase B (the §16.6b hybrid hook needs it).
 * Standard pattern: returns the input value, delayed by N ms after the
 * last change. Used by useTaskIconSuggestions for the Stage 2 embedding
 * refine (500ms debounce) so OpenAI calls only fire after Mom stops typing.
 */

import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
