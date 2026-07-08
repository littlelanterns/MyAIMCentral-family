/**
 * lists.list_type Constraint Guard
 *
 * Mirrors tests/task-source-constraint.test.ts (finding F-21 precedent) for
 * lists.list_type. PRD-43 WishLists pack ruling #12: "list_type CHECK
 * extension follows the ST-0 lesson: rebuild from the CURRENT production
 * constraint body, never a stale migration; ship the enumeration regression
 * vitest (constraint values ⊇ every literal the code writes)."
 *
 * While rewriting this exact constraint (migration 00000000100292) two
 * independent findings turned up:
 *   1. 'gift_ideas' — PRD-43's own new value.
 *   2. 'reward_list' — RewardsListWizard.tsx has written this literal since
 *      the KIDS-REWARDS-PAGE build shipped, but it had NEVER existed in any
 *      historical version of lists_list_type_check (verified: zero
 *      pre-existing hits across every migration file). Every deploy threw a
 *      CHECK-constraint violation, silently caught by the wizard's own
 *      try/catch — an F-21-class bug found independently while touching this
 *      constraint for an unrelated reason. Fixed in the same migration.
 *
 * This test:
 *   1. Finds the migration file that most recently redefines
 *      lists_list_type_check (highest zero-padded numeric filename prefix)
 *      and extracts its allowed value list.
 *   2. Asserts a curated set of known list_type writers — literal + the
 *      exact file/pattern that writes it — are BOTH present in their source
 *      file AND members of the allowed set.
 *
 * When adding a new list_type writer: add it to KNOWN_LIST_TYPE_WRITERS
 * below AND make sure it's in the allowed list of whatever migration
 * currently owns lists_list_type_check.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

interface KnownWriter {
  /** The literal value written to lists.list_type */
  literal: string
  /** File (relative to repo root) that writes it */
  file: string
  /** Regex pattern proving this file writes the literal into lists.list_type */
  pattern: RegExp
}

const KNOWN_LIST_TYPE_WRITERS: KnownWriter[] = [
  {
    literal: 'custom',
    file: 'src/components/lists/SmartImportModal.tsx',
    pattern: /list_type:\s*'custom'/,
  },
  {
    literal: 'custom',
    file: 'src/components/queue/ListPickerModal.tsx',
    pattern: /list_type:\s*'custom'/,
  },
  {
    literal: 'custom',
    file: 'src/components/studio/wizards/ActivityListWizard.tsx',
    pattern: /list_type:\s*'custom'/,
  },
  {
    literal: 'reward_list',
    file: 'src/components/studio/wizards/RewardsListWizard.tsx',
    pattern: /list_type:\s*'reward_list'/,
  },
  {
    literal: 'todo',
    file: 'src/components/studio/wizards/SharedTaskListWizard.tsx',
    pattern: /list_type:\s*'todo'/,
  },
  {
    literal: 'wishlist',
    file: 'src/hooks/useWishlists.ts',
    pattern: /list_type:\s*'wishlist'/,
  },
  {
    literal: 'gift_ideas',
    file: 'src/hooks/useWishlists.ts',
    pattern: /list_type:\s*'gift_ideas'/,
  },
  {
    literal: 'wishlist',
    file: 'src/lib/queue/deployQueueItem.ts',
    pattern: /list_type:\s*'wishlist'/,
  },
]

function getMigrationsDir(): string {
  return join(process.cwd(), 'supabase/migrations')
}

/**
 * Find the migration file with the highest zero-padded numeric filename
 * prefix that redefines lists_list_type_check, and return its allowed value
 * list plus the filename (for error messages).
 */
function getCurrentListTypeCheckAllowedValues(): { file: string; values: string[] } {
  const dir = getMigrationsDir()
  const candidates = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => {
      const content = readFileSync(join(dir, f), 'utf-8')
      return /lists_list_type_check/.test(content)
    })
    .sort() // zero-padded numeric prefixes sort correctly as strings

  expect(candidates.length, 'Expected at least one migration defining lists_list_type_check').toBeGreaterThan(0)

  const latestFile = candidates[candidates.length - 1]
  const content = readFileSync(join(dir, latestFile), 'utf-8')

  const match = content.match(/ADD CONSTRAINT\s+lists_list_type_check\s+CHECK\s*\(\s*list_type IN \(([^)]+)\)/i)
  expect(
    match,
    `Could not parse the lists_list_type_check value list out of ${latestFile}. ` +
      `The extraction regex in tests/list-type-constraint.test.ts may need updating ` +
      `if the constraint's SQL shape changed.`
  ).toBeTruthy()

  const values = (match as RegExpMatchArray)[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^'/, '').replace(/'$/, ''))

  return { file: latestFile, values }
}

describe('lists.list_type constraint guard (PRD-43 ruling #12, F-21 precedent)', () => {
  it('finds a migration defining lists_list_type_check and extracts a non-trivial allowed list', () => {
    const { file, values } = getCurrentListTypeCheckAllowedValues()
    expect(values.length, `Parsed 0 values out of ${file}`).toBeGreaterThan(0)
    // Sanity: 'wishlist' has existed since the original PRD-09B constraint.
    // If this ever fails, the extraction regex broke, not the underlying data.
    expect(values).toContain('wishlist')
    expect(values).toContain('gift_ideas')
  })

  it.each(KNOWN_LIST_TYPE_WRITERS)(
    'known writer "$literal" ($file) still writes that literal into lists.list_type',
    ({ literal, file, pattern }) => {
      const fullPath = join(process.cwd(), file)
      expect(existsSync(fullPath), `Expected file to exist: ${file}`).toBe(true)
      const content = readFileSync(fullPath, 'utf-8')
      expect(
        pattern.test(content),
        `Expected ${file} to still contain a write of lists.list_type = '${literal}'. ` +
          `If this file was refactored, update KNOWN_LIST_TYPE_WRITERS in ` +
          `tests/list-type-constraint.test.ts to match the new pattern.`
      ).toBe(true)
    }
  )

  it('every known writer literal is currently allowed by lists_list_type_check', () => {
    const { file, values } = getCurrentListTypeCheckAllowedValues()
    const allowed = new Set(values)
    const missing = [...new Set(KNOWN_LIST_TYPE_WRITERS.map((w) => w.literal))].filter((lit) => !allowed.has(lit))
    expect(
      missing,
      `The following lists.list_type literals are written by live code but are ` +
        `NOT in the allowed list of ${file}. A lists insert using any of ` +
        `these values will throw a CHECK-constraint violation in production ` +
        `(this is exactly the ST-0 / finding F-21 bug class — 'reward_list' was ` +
        `silently broken for RewardsListWizard's entire lifetime until PRD-43 ` +
        `found it). Add the missing value(s) to a new lists_list_type_check migration.`
    ).toEqual([])
  })
})
