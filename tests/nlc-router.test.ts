/**
 * STUDIO-EXPERIENCE ST-B — nlc-compose router behavior pin.
 *
 * This is a LIVE-MODEL test: it calls OpenRouter directly with the EXACT
 * system prompt module the deployed `nlc-compose` Edge Function imports
 * (`supabase/functions/_shared/nlc-router-prompt.ts`), so the router and
 * this pin can never silently drift onto two different prompts — the same
 * shared-module discipline `_shared/json-extract.ts` and `_shared/
 * crisis-detection.ts` already use for their own red-team pins.
 *
 * 28 real mom descriptions, including the four Composition-doc §2.9 audit
 * probe phrases (chore board with money, potty chart for a named kid,
 * shared grocery list with a spouse, morning routine) that the old 6-outcome
 * router either hard-failed or mis-routed on (STUDIO-EXPERIENCE F-01).
 *
 * Skips loudly when OPENROUTER_API_KEY is absent (clean CI checkout) —
 * same pattern as tests/prd31-registry-completeness.test.ts for
 * SUPABASE_SERVICE_ROLE_KEY. Non-deterministic-model tolerance: each case
 * asserts against the EXACT wizardType it should choose — flakiness here is
 * itself a signal the prompt needs sharpening, not a reason to loosen it.
 */
import { describe, it, expect } from 'vitest'
import dotenv from 'dotenv'
import path from 'path'
import { buildNLCSystemPrompt, type NLCWizardType } from '../supabase/functions/_shared/nlc-router-prompt'

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') })

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const haveKey = Boolean(OPENROUTER_API_KEY)

if (!haveKey) {
  console.warn(
    '[nlc-router] OPENROUTER_API_KEY missing — live router pins SKIPPED. ' +
      'Run with .env.local present (pre-push machines have it) for the real check.',
  )
}

const FAMILY_MEMBER_NAMES = ['Mom', 'Dad', 'Ruthie', 'Casey', 'Alex', 'Jordan']

interface RouterCase {
  text: string
  expected: NLCWizardType
  /** Optional: assert a specific preFill field/value too, when the phrase should reliably extract it. */
  expectPreFill?: (preFill: Record<string, unknown> | undefined) => void
}

// The four Composition doc §2.9 audit probe phrases lead the list — these
// are the exact cases STUDIO-EXPERIENCE F-01 documented as broken.
const CASES: RouterCase[] = [
  {
    text: 'I want a chore board where kids earn money for doing extra jobs',
    expected: 'list_reveal_assignment_opportunity',
  },
  {
    text: 'set up a potty chart for Ruthie',
    expected: 'repeated_action_chart',
    expectPreFill: (pf) => expect(String(pf?.memberName ?? '').toLowerCase()).toContain('ruthie'),
  },
  {
    text: 'a shared grocery list with my husband',
    expected: 'universal_list',
    expectPreFill: (pf) => expect(pf?.sharedWithRelationship).toBe('spouse'),
  },
  {
    text: 'help me set up a morning routine',
    expected: 'routine_builder',
  },
  // Rewards / prizes
  { text: 'a list of prizes for the treasure box', expected: 'rewards_list' },
  { text: 'I need rewards Casey can pick from when she fills her sticker chart', expected: 'rewards_list' },
  // Repeated action chart
  { text: 'track how many times Alex practices piano with a sticker chart', expected: 'repeated_action_chart' },
  { text: 'a star chart for brushing teeth every night', expected: 'repeated_action_chart' },
  // Opportunity board
  { text: 'extra earning jobs the kids can claim for cash', expected: 'list_reveal_assignment_opportunity' },
  { text: 'a bonus chore board with payouts', expected: 'list_reveal_assignment_opportunity' },
  // Draw / spinner
  { text: 'a consequence spinner for when the kids argue', expected: 'list_reveal_assignment_draw' },
  { text: 'a random activity picker wheel for family game night', expected: 'list_reveal_assignment_draw' },
  // Activity list
  { text: 'a homeschool activity list for reading with a daily minimum', expected: 'activity_list_wizard' },
  { text: 'subject activities for science with at least one a day', expected: 'activity_list_wizard' },
  // Shared task list
  { text: 'a honey-do list for household projects Dad and I can both claim', expected: 'shared_task_list_wizard' },
  { text: 'a shared to-do list for the garage cleanout project', expected: 'shared_task_list_wizard' },
  // Universal list (non-shopping variants)
  { text: 'a packing list for our beach trip', expected: 'universal_list' },
  { text: 'a wishlist for my birthday', expected: 'universal_list' },
  { text: 'an expense tracker for the kitchen remodel', expected: 'universal_list' },
  { text: 'just a simple to-do list for me', expected: 'universal_list' },
  // Routine builder
  { text: 'I want to set up a bedtime routine for the kids', expected: 'routine_builder' },
  { text: 'a cleaning routine for the kitchen every day', expected: 'routine_builder' },
  // Sequential creator
  { text: 'a curriculum sequence for our math chapters, one unlocking after the next', expected: 'sequential_creator' },
  { text: 'an ordered book series list where each book unlocks after the last', expected: 'sequential_creator' },
  // Star chart (vaguer than repeated_action_chart)
  { text: 'I want a star chart for Casey', expected: 'star_chart' },
  // Meeting setup
  { text: 'help me set up regular family meetings and 1:1 time with the kids', expected: 'meeting_setup' },
  // Get to know
  { text: 'I want to record what Jordan likes for gift ideas', expected: 'get_to_know' },
  // Gamification
  { text: 'set up the points and sticker book rewards for Alex', expected: 'gamification_setup' },
  // Task quick create
  { text: 'remind Alex to call the dentist next week', expected: 'task_quick_create' },
]

interface NLCResponse {
  wizardType: NLCWizardType
  confidence: 'high' | 'medium' | 'low'
  description: string
  preFill?: Record<string, unknown>
}

async function callRouter(text: string): Promise<NLCResponse> {
  const systemPrompt = buildNLCSystemPrompt(FAMILY_MEMBER_NAMES)
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://myaimcentral.com',
      'X-Title': 'MyAIM Central (test)',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4.5',
      provider: { data_collection: 'deny' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      max_tokens: 1024,
      // Must mirror nlc-compose/index.ts exactly — this pin only means
      // something if it calls the router the way the deployed function does.
      temperature: 0,
    }),
  })
  if (!res.ok) {
    throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`)
  }
  const data = await res.json()
  const content: string = (data.choices?.[0]?.message?.content || '').trim()
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No JSON object found in router response: ${content}`)
  }
  return JSON.parse(content.slice(start, end + 1)) as NLCResponse
}

describe.skipIf(!haveKey)('nlc-compose router — real mom descriptions', () => {
  for (const c of CASES) {
    it(`"${c.text}" → ${c.expected}`, async () => {
      const result = await callRouter(c.text)
      expect(result.wizardType).toBe(c.expected)
      if (c.expectPreFill) c.expectPreFill(result.preFill)
    }, 20_000)
  }
})
