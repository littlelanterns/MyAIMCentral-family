/**
 * Build M Sub-phase B (§16 addendum item 4) — extractTaskIconTags
 *
 * Pure utility that turns a task title (and optional category) into a
 * SHORT array of high-priority tags suitable for `searchVisualScheduleAssets`.
 *
 * The existing `searchVisualScheduleAssets` function uses `.contains('tags', tags)`
 * which is the JSONB `@>` operator — STRICT match (every tag must be present).
 * To get any results, we need to extract just the most semantically loaded
 * keyword(s), not the full tokenized title.
 *
 * Strategy:
 *   1. Lowercase + strip punctuation
 *   2. Tokenize on whitespace
 *   3. Strip stopwords ("your", "the", "a", "to", "with", etc.)
 *   4. Apply synonym/canonical map ("brush" + "teeth" → "teeth"; "lunch" → "lunch")
 *   5. Boost category-relevant tags (life_area_tag mapping)
 *   6. Return up to 3 high-priority tags as a string array
 *
 * The Stage 2 embedding refine in `useTaskIconSuggestions` handles cases where
 * the strict tag match returns nothing — semantic similarity catches the rest.
 *
 * Wherever this util gets a request that doesn't map cleanly, the result will
 * be empty or sparse, the embedding refine kicks in, and Mom still sees results.
 * This is the design.
 */

/* ─────────────────────────────────────────────────────────────────────
 * Stopwords — small focused list
 * ───────────────────────────────────────────────────────────────────── */

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'your',
  'my',
  'our',
  'their',
  'his',
  'her',
  'its',
  'to',
  'of',
  'for',
  'with',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'by',
  'from',
  'into',
  'is',
  'are',
  'be',
  'been',
  'do',
  'does',
  'did',
  'have',
  'has',
  'had',
  'go',
  'goes',
  'going',
  'get',
  'gets',
  'getting',
  'put',
  'puts',
  'make',
  'makes',
  'time',
  'now',
  'today',
  'tomorrow',
  'please',
  'just',
])

/* ─────────────────────────────────────────────────────────────────────
 * Canonical synonym map
 *
 * Each key is a token that might appear in a task title; the value is
 * the canonical visual_schedule tag we want to match against. The
 * library's tags are semantic phrases like "teeth", "potty", "dress",
 * "meal", "bath", "hair", "handwash", "clean", "face", "feed", "tidy",
 * "water", "pack", "sleep", "play", "read", "music", "art", etc.
 *
 * Multi-word phrases ("brush teeth") collapse to the most specific
 * noun ("teeth") because the library catalogs by object, not action.
 * ───────────────────────────────────────────────────────────────────── */

const CANONICAL: Record<string, string> = {
  // Hygiene — teeth
  brush: 'teeth',
  brushing: 'teeth',
  teeth: 'teeth',
  tooth: 'teeth',
  toothbrush: 'teeth',
  // Hygiene — bath / shower
  bath: 'bath',
  bathtime: 'bath',
  bathing: 'bath',
  shower: 'bath',
  wash: 'handwash',
  washing: 'handwash',
  hands: 'handwash',
  handwash: 'handwash',
  // Hygiene — face
  face: 'face',
  // Hygiene — hair
  hair: 'hair',
  comb: 'hair',
  brush_hair: 'hair',
  // Toilet
  potty: 'potty',
  toilet: 'potty',
  bathroom: 'potty',
  // Dressing
  dress: 'dress',
  dressed: 'dress',
  dressing: 'dress',
  clothes: 'dress',
  outfit: 'dress',
  pajamas: 'dress',
  pjs: 'dress',
  // Meals
  eat: 'meal',
  eating: 'meal',
  meal: 'meal',
  breakfast: 'meal',
  lunch: 'meal',
  dinner: 'meal',
  snack: 'meal',
  food: 'meal',
  feed: 'feed',
  // Sleep
  sleep: 'sleep',
  sleeping: 'sleep',
  bed: 'sleep',
  bedtime: 'sleep',
  nap: 'sleep',
  rest: 'sleep',
  // Cleaning + tidying
  clean: 'clean',
  cleaning: 'clean',
  tidy: 'tidy',
  tidying: 'tidy',
  pickup: 'tidy',
  pickups: 'tidy',
  declutter: 'tidy',
  toys: 'tidy',
  room: 'tidy',
  // Packing
  pack: 'pack',
  packing: 'pack',
  backpack: 'pack',
  bag: 'pack',
  // Reading + books
  read: 'book',
  reading: 'book',
  book: 'book',
  books: 'book',
  story: 'book',
  // Drawing + art
  draw: 'art',
  drawing: 'art',
  art: 'art',
  paint: 'art',
  painting: 'art',
  craft: 'art',
  color: 'art',
  coloring: 'art',
  // Music
  music: 'music',
  piano: 'music',
  violin: 'music',
  sing: 'music',
  song: 'music',
  // Outdoor + activity
  walk: 'walk',
  walking: 'walk',
  exercise: 'exercise',
  bike: 'biking',
  biking: 'biking',
  ride: 'biking',
  swim: 'swimming',
  swimming: 'swimming',
  run: 'exercise',
  running: 'exercise',
  // Plants
  water_plants: 'water',
  plants: 'plant',
  plant: 'plant',
  // Pets
  pet: 'feed',
  dog: 'feed',
  cat: 'feed',
  // Help / chores
  help: 'help',
  helping: 'help',
  chore: 'tidy',
  chores: 'tidy',
}

/* ─────────────────────────────────────────────────────────────────────
 * Category → tag boost map
 *
 * If a task carries a life_area_tag (e.g. 'school', 'health'), we add
 * a category-relevant canonical tag to the result so the search has
 * a chance even when the title is generic ("Get ready").
 * ───────────────────────────────────────────────────────────────────── */

const CATEGORY_BOOST: Record<string, string> = {
  health: 'handwash',
  hygiene: 'handwash',
  school: 'pack',
  learning: 'book',
  homeschool: 'book',
  meals: 'meal',
  food: 'meal',
  sleep: 'sleep',
  bedtime: 'sleep',
  morning: 'teeth',
  evening: 'sleep',
  chores: 'tidy',
  cleaning: 'clean',
  outdoor: 'walk',
  exercise: 'exercise',
  art: 'art',
  music: 'music',
  reading: 'book',
}

/* ─────────────────────────────────────────────────────────────────────
 * The function
 * ───────────────────────────────────────────────────────────────────── */

/**
 * Extract a small list of high-priority canonical tags for searching
 * `platform_assets` (visual_schedule). Returns at most 3 tags.
 *
 * Returns an empty array when no tokens match — callers should treat
 * that as "no auto-suggestions; render Browse all" (and the Stage 2
 * embedding refine takes over).
 */
export function extractTaskIconTags(
  taskTitle: string,
  category?: string | null,
): string[] {
  if (!taskTitle || taskTitle.trim().length === 0) return []

  // 1. Normalize
  const normalized = taskTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // 2. Tokenize + strip stopwords
  const tokens = normalized.split(' ').filter(t => t && !STOPWORDS.has(t))

  // 3. Map each token to its canonical tag (if any)
  const canonicalTags = new Set<string>()
  for (const token of tokens) {
    const canonical = CANONICAL[token]
    if (canonical) canonicalTags.add(canonical)
  }

  // 4. Category boost — only add if we have <2 tags so far AND the
  //    category maps to something the library catalogs
  if (canonicalTags.size < 2 && category) {
    const boost = CATEGORY_BOOST[category.toLowerCase()]
    if (boost) canonicalTags.add(boost)
  }

  // 5. Cap at 3 tags. If we still have nothing, return empty so the
  //    embedding refine gets the spotlight.
  return Array.from(canonicalTags).slice(0, 3)
}
