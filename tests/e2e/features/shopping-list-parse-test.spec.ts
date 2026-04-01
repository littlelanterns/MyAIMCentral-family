/**
 * One-shot test: feed Tenise's exact grocery dump through the AI parse
 * pipeline and report exactly how it renders — stores, items, notes, unclear.
 * Calls OpenRouter directly (same model the app uses).
 */
import { test } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY!

const INPUT = `We need 12 bags of chocolate chips from mama jeans.  We need a birthday cake from either Nothing Bundt Cake, Hy-Vee, or Sam's, Gideon's choice. From Sam's club we need 2 bags of boiled eggs, we need a box of croissant dough, it needs to stay cold on the drive home. We  need whipping cream, we need Mozzarella, we need a big bag of fiesta cheese.  From Aldi, we need 3 stuffed crust pepperoni pizzas, we need an assortment of caffeinated beverages, we need an assortment of produce, and whatever dips you wanted.`

const SYSTEM_PROMPT = `Parse the following text into individual list items. Return a JSON array. Parse natural-language shopping lists, even conversational ones. Rules:

1. STORES: Detect store names mentioned in the text (e.g., "from Mama Jeans", "at Sam's Club", "from Aldi"). Use them as the "category" to group items by store.
2. STORE CONTINUITY: Items between store mentions belong to the most recently mentioned store. For example, "From Sam's we need eggs, we need milk, we need cheese. From Aldi we need pizza" means eggs, milk, AND cheese all belong to Sam's because they appear after "From Sam's" and before "From Aldi." Only switch stores when a new store is explicitly named.
3. QUANTITIES: Keep quantities with the item (e.g., "12 bags of chocolate chips" stays as "12 bags of chocolate chips"). Keep the full quantity in the text.
4. NOTES: If the text mentions special instructions for an item (e.g., "needs to stay cold", "Gideon's choice", "whatever dips you wanted"), put them in a "note" field.
5. MULTI-STORE ITEMS: If an item could come from multiple stores (e.g., "birthday cake from either Nothing Bundt Cake, Hy-Vee, or Sam's"), set category to "" and put the store options in the "note" field (e.g., "Could get from: Nothing Bundt Cake, Hy-Vee, or Sam's").
6. VAGUE ITEMS: Keep vague descriptions as-is (e.g., "an assortment of produce" stays as one item, don't split).
7. UNCLEAR: If something is ambiguous (could be a store name, an errand, not clearly a list item), add "unclear": true.

Return objects: [{"text": "item name", "category": "Store Name", "note": "optional note"}, ...].
If no store is detected for an item, use "" as category. Never invent store names.

Return ONLY a JSON array. No other text.`

test('Parse Tenise grocery dump via OpenRouter Haiku', async () => {
  test.setTimeout(60000)

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4.5',
      max_tokens: 2048,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: INPUT },
      ],
    }),
  })

  const data = await res.json()
  const response = data.choices?.[0]?.message?.content ?? ''

  console.log('\n═══════════════════════════════════════════')
  console.log('  GROCERY DUMP PARSE TEST (Haiku)')
  console.log('═══════════════════════════════════════════\n')
  console.log('INPUT:\n' + INPUT + '\n')
  console.log('───────────────────────────────────────────')
  console.log('RAW AI RESPONSE:\n' + response + '\n')
  console.log('───────────────────────────────────────────')

  // Extract JSON from response
  let parsed: unknown[] | null = null
  try {
    parsed = JSON.parse(response)
  } catch {
    const match = response.match(/\[[\s\S]*\]/)
    if (match) parsed = JSON.parse(match[0])
  }

  if (!parsed || !Array.isArray(parsed)) {
    console.log('❌ FAILED TO PARSE JSON')
    return
  }

  // Group by store
  const byStore = new Map<string, Array<{ text: string; note?: string }>>()
  const unclear: Array<{ text: string; note?: string }> = []

  for (const raw of parsed) {
    const item = raw as Record<string, unknown>
    const text = (item.text as string) || '???'
    const category = (item.category as string) || ''
    const note = (item.note as string) || undefined
    const isUnclear = item.unclear === true

    if (isUnclear) {
      unclear.push({ text, note })
      continue
    }

    const store = category || '(Unsorted)'
    if (!byStore.has(store)) byStore.set(store, [])
    byStore.get(store)!.push({ text, note })
  }

  console.log('\n═══════════════════════════════════════════')
  console.log('  HOW THE LIST WOULD RENDER')
  console.log('═══════════════════════════════════════════\n')

  for (const [store, items] of byStore.entries()) {
    console.log(`  ${store.toUpperCase()} (${items.length} items)`)
    console.log('  ─────────────────────────────────')
    for (const item of items) {
      const noteText = item.note ? `\n       note: "${item.note}"` : ''
      console.log(`    ☐ ${item.text}${noteText}`)
    }
    console.log('')
  }

  if (unclear.length > 0) {
    console.log('  ⚠️  NEEDS CLARIFICATION:')
    for (const item of unclear) {
      console.log(`    ? "${item.text}" ${item.note ? `(${item.note})` : ''}`)
    }
    console.log('')
  }

  const totalItems = parsed.filter((i: unknown) => !(i as Record<string, unknown>).unclear).length
  const stores = [...byStore.keys()].filter(s => s !== '(Unsorted)')
  console.log('───────────────────────────────────────────')
  console.log(`TOTAL: ${totalItems} items | ${stores.length} stores: ${stores.join(', ')}`)
  if (unclear.length) console.log(`UNCLEAR: ${unclear.length} items need clarification`)
  console.log('═══════════════════════════════════════════\n')
})
