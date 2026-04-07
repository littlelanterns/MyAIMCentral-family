import { localIso } from '@/utils/dates'

/**
 * PRD-18: Date-seeded deterministic PRNG for rhythm rotation.
 *
 * The same (memberId, date, rhythm_key) inputs always produce the same
 * output. Critical for user trust — re-opening a rhythm during the same
 * day must show the same Guiding Star, the same Scripture, the same
 * 3 reflection questions.
 *
 * Uses mulberry32 — a simple 32-bit PRNG with great distribution for
 * small selection problems. Seed is hashed from the input string with
 * a cheap djb2 hash, which is fine for non-cryptographic shuffling.
 */

function djb2Hash(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  // Force unsigned 32-bit
  return hash >>> 0
}

/**
 * mulberry32 — small, fast, well-distributed PRNG.
 * Returns a generator function that yields a float in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function rand() {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Build a deterministic seed string from rotation context.
 * Defaults to today's date — caller can pass a Date if needed.
 *
 * Uses the caller's LOCAL date (not UTC) — a user in Central time opening
 * rhythms at 9 PM still sees the same content they saw at 6 PM. Without
 * this, rotation would "tick" at UTC midnight instead of local midnight.
 */
export function rhythmSeed(
  memberId: string,
  rhythmKey: string,
  date: Date = new Date(),
  saltKey?: string
): number {
  const dateKey = localIso(date)
  const salt = saltKey ?? ''
  return djb2Hash(`${memberId}|${rhythmKey}|${dateKey}|${salt}`)
}

/**
 * Pick a single deterministic item from an array. Returns undefined
 * if the array is empty. Same seed → same pick.
 */
export function pickOne<T>(items: T[], seed: number): T | undefined {
  if (items.length === 0) return undefined
  const rand = mulberry32(seed)
  const idx = Math.floor(rand() * items.length)
  return items[idx]
}

/**
 * Pick N deterministic distinct items from an array. Order is stable
 * for the same seed. Returns fewer than N if the array is smaller.
 */
export function pickN<T>(items: T[], n: number, seed: number): T[] {
  if (items.length === 0 || n <= 0) return []
  if (items.length <= n) return [...items]

  const rand = mulberry32(seed)
  // Fisher-Yates partial shuffle
  const arr = [...items]
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rand() * (arr.length - i))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, n)
}

/**
 * Pick N items, prioritizing entries that satisfy a predicate.
 * Used by reflection rotation to prefer unanswered prompts before
 * recycling answered ones — same seed, same selection.
 */
export function pickNPrioritized<T>(
  items: T[],
  n: number,
  preferred: (item: T) => boolean,
  seed: number
): T[] {
  if (items.length === 0 || n <= 0) return []
  const pref = items.filter(preferred)
  if (pref.length >= n) return pickN(pref, n, seed)
  // Take all preferred, fill the rest from the non-preferred bucket
  const taken = [...pref]
  const remaining = items.filter(i => !preferred(i))
  const filler = pickN(remaining, n - pref.length, seed ^ 0xa5a5a5a5)
  return [...taken, ...filler]
}
