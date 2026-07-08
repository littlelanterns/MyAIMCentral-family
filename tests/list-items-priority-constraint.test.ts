/**
 * list_items.priority Constraint Guard
 *
 * F-21-class bug found LIVE during the PRD-43 Convention #277 eyes-on tour
 * (not by static analysis this time — a direct production INSERT probe
 * threw 23514). `ListItemPriority` in src/types/lists.ts has declared
 * 'must_have' | 'would_love' | 'nice_to_have' as valid values since before
 * this build (the type comment already documented "Must-Have / Would-Love /
 * Nice-to-Have chips map onto it"), but the live list_items_priority_check
 * constraint only ever allowed ('low','medium','high','urgent'). Every
 * WishlistItemDetailSheet priority pick would have thrown at the DB layer.
 * Fixed additively in migration 00000000100297.
 *
 * This test guards the TS type ⊆ live constraint invariant directly
 * (simpler than the writer-curation pattern in list-type-constraint.test.ts
 * since ListItemPriority has no other consumers to enumerate — every value
 * in the type must be DB-legal, full stop).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const DECLARED_PRIORITY_VALUES = ['low', 'medium', 'high', 'urgent', 'must_have', 'would_love', 'nice_to_have']

function getCurrentPriorityCheckAllowedValues(): { file: string; values: string[] } {
  const dir = join(process.cwd(), 'supabase/migrations')
  const candidates = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => /list_items_priority_check/.test(readFileSync(join(dir, f), 'utf-8')))
    .sort()

  expect(candidates.length, 'Expected at least one migration defining list_items_priority_check').toBeGreaterThan(0)

  const latestFile = candidates[candidates.length - 1]
  const content = readFileSync(join(dir, latestFile), 'utf-8')
  const match = content.match(/ADD CONSTRAINT\s+list_items_priority_check\s+CHECK\s*\(([^;]+)\)\s*;/i)
  expect(match, `Could not parse list_items_priority_check out of ${latestFile}`).toBeTruthy()

  const body = (match as RegExpMatchArray)[1]
  const values = [...body.matchAll(/'([a-z_]+)'/g)].map((m) => m[1])
  return { file: latestFile, values }
}

describe('list_items.priority constraint guard (PRD-43 live-probe finding)', () => {
  it('every ListItemPriority TS value is allowed by the live constraint', () => {
    const { file, values } = getCurrentPriorityCheckAllowedValues()
    const allowed = new Set(values)
    const missing = DECLARED_PRIORITY_VALUES.filter((v) => !allowed.has(v))
    expect(
      missing,
      `The following ListItemPriority (src/types/lists.ts) values are NOT allowed by ` +
        `${file}'s list_items_priority_check. Any UI setting one of these will throw a ` +
        `CHECK-constraint violation in production (this is exactly the F-21 bug class — ` +
        `'must_have'/'would_love'/'nice_to_have' were silently broken until a live INSERT ` +
        `probe during the PRD-43 eyes-on tour caught it). Add the missing value(s) to a new ` +
        `list_items_priority_check migration.`
    ).toEqual([])
  })
})
