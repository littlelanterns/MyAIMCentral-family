/**
 * Task Source Constraint Guard
 *
 * Guards against the ST-0 class of regression (finding F-21, 2026-07-04):
 * RepeatedActionChartWizard.tsx wrote `tasks.source = 'studio'`, a value that
 * had NEVER existed in any historical `tasks_source_check` definition since
 * the constraint's introduction in migration 00000000100023 — the wizard's
 * very first DB write threw on every deploy, silently caught, zero rows
 * created. Every constraint rewrite since re-enumerated the full allowed list
 * from scratch, and it is easy to drop or forget a value that a live code
 * path depends on (the "copy-stale-body" failure mode documented elsewhere
 * in this repo, e.g. KIDS-REWARDS-PAGE migrations 100266→100269).
 *
 * This test:
 *   1. Finds the migration file that most recently redefines
 *      `tasks_source_check` (by filename — migrations are zero-padded
 *      numeric prefixes, so the highest filename is the latest constraint
 *      definition) and extracts its allowed value list.
 *   2. Asserts a curated set of known task-source writers — literal +
 *      the exact file that writes it into a `tasks` insert — are BOTH
 *      present in their source file AND members of the allowed set.
 *
 * This is a deliberately curated list, not a fully automatic AST-based scan
 * of every `.insert()` call in the codebase. A fully automatic scan risks
 * false positives (many files use a `source` field for OTHER tables —
 * `list_items`, `task_completions`, `draw_source` on `randomizer_draws`,
 * `activity_log_entries.source`, etc. — which have different allowed
 * vocabularies and would make a blanket regex scan unreliable). The curated
 * list directly encodes the invariant that matters: if a future constraint
 * rewrite drops a value one of these files still writes, this test fails
 * loudly instead of the feature silently breaking in production.
 *
 * When adding a new task-writing source location: add it to
 * KNOWN_TASK_SOURCE_WRITERS below AND make sure it's in the allowed list of
 * whatever migration currently owns tasks_source_check.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

interface KnownWriter {
  /** The literal value written to tasks.source */
  literal: string
  /** File (relative to repo root) that writes it */
  file: string
  /** Regex pattern proving this file writes the literal into tasks.source */
  pattern: RegExp
}

const KNOWN_TASK_SOURCE_WRITERS: KnownWriter[] = [
  {
    literal: 'studio',
    file: 'src/components/studio/wizards/RepeatedActionChartWizard.tsx',
    pattern: /source:\s*'studio'/,
  },
  {
    literal: 'manual',
    file: 'src/utils/createTaskFromData.ts',
    pattern: /source:\s*'manual'/,
  },
  {
    literal: 'review_route',
    file: 'src/components/notepad/NotepadReviewRoute.tsx',
    pattern: /source:\s*'review_route'/,
  },
  {
    literal: 'mindsweep_auto',
    file: 'src/hooks/useMindSweep.ts',
    pattern: /source:\s*'mindsweep_auto'/,
  },
  {
    literal: 'opportunity_list_claim',
    file: 'src/hooks/useOpportunityLists.ts',
    pattern: /source:\s*'opportunity_list_claim'/,
  },
  {
    literal: 'rhythm_priority',
    file: 'src/lib/rhythm/commitTomorrowCapture.ts',
    pattern: /source:\s*'rhythm_priority'/,
  },
  {
    literal: 'reward_proposal',
    file: 'src/components/rewards/ProposalArtifactCreator.tsx',
    // Property-assignment form (data.source = '...') rather than an object
    // literal — ProposalArtifactCreator builds a shared CreateTaskData object
    // and assigns provenance onto it after the fact.
    pattern: /\.source\s*=\s*'reward_proposal'/,
  },
  {
    literal: 'icon_launcher',
    file: 'src/components/guided/GuidedActivitySection.tsx',
    pattern: /source:\s*'icon_launcher'/,
  },
  {
    literal: 'activity_list',
    file: 'src/components/studio/wizards/ActivityListWizard.tsx',
    pattern: /source:\s*'activity_list'/,
  },
  {
    literal: 'list_promotion',
    file: 'src/hooks/useLists.ts',
    pattern: /source:\s*'list_promotion'/,
  },
  {
    literal: 'rhythm_mindsweep_lite',
    file: 'src/lib/rhythm/commitMindSweepLite.ts',
    pattern: /source:\s*'rhythm_mindsweep_lite'/,
  },
]

function getMigrationsDir(): string {
  return join(process.cwd(), 'supabase/migrations')
}

/**
 * Find the migration file with the highest zero-padded numeric filename
 * prefix that redefines tasks_source_check, and return its allowed value
 * list plus the filename (for error messages).
 */
function getCurrentTasksSourceCheckAllowedValues(): { file: string; values: string[] } {
  const dir = getMigrationsDir()
  const candidates = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => {
      const content = readFileSync(join(dir, f), 'utf-8')
      return /tasks_source_check/.test(content)
    })
    .sort() // zero-padded numeric prefixes sort correctly as strings

  expect(candidates.length, 'Expected at least one migration defining tasks_source_check').toBeGreaterThan(0)

  const latestFile = candidates[candidates.length - 1]
  const content = readFileSync(join(dir, latestFile), 'utf-8')

  const match = content.match(/ADD CONSTRAINT\s+tasks_source_check\s+CHECK\s*\(\s*source IN \(([^)]+)\)/i)
  expect(
    match,
    `Could not parse the tasks_source_check value list out of ${latestFile}. ` +
      `The extraction regex in tests/task-source-constraint.test.ts may need updating ` +
      `if the constraint's SQL shape changed.`
  ).toBeTruthy()

  const values = (match as RegExpMatchArray)[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^'/, '').replace(/'$/, ''))

  return { file: latestFile, values }
}

describe('tasks.source constraint guard (finding F-21)', () => {
  it('finds a migration defining tasks_source_check and extracts a non-trivial allowed list', () => {
    const { file, values } = getCurrentTasksSourceCheckAllowedValues()
    expect(values.length, `Parsed 0 values out of ${file}`).toBeGreaterThan(0)
    // Sanity: every existing constraint definition has included 'manual' since
    // the very first version (migration 100023). If this ever fails, the
    // extraction regex broke, not the underlying data.
    expect(values).toContain('manual')
  })

  it.each(KNOWN_TASK_SOURCE_WRITERS)(
    'known writer "$literal" ($file) still writes that literal into tasks.source',
    ({ literal, file, pattern }) => {
      const fullPath = join(process.cwd(), file)
      expect(existsSync(fullPath), `Expected file to exist: ${file}`).toBe(true)
      const content = readFileSync(fullPath, 'utf-8')
      expect(
        pattern.test(content),
        `Expected ${file} to still contain a write of tasks.source = '${literal}'. ` +
          `If this file was refactored, update KNOWN_TASK_SOURCE_WRITERS in ` +
          `tests/task-source-constraint.test.ts to match the new pattern.`
      ).toBe(true)
    }
  )

  it('every known writer literal is currently allowed by tasks_source_check', () => {
    const { file, values } = getCurrentTasksSourceCheckAllowedValues()
    const allowed = new Set(values)
    const missing = KNOWN_TASK_SOURCE_WRITERS.map((w) => w.literal).filter((lit) => !allowed.has(lit))
    expect(
      missing,
      `The following tasks.source literals are written by live code but are ` +
        `NOT in the allowed list of ${file}. A tasks insert using any of ` +
        `these values will throw a CHECK-constraint violation in production ` +
        `(this is exactly the ST-0 / finding F-21 bug — 'studio' was silently ` +
        `broken for the Progress Chart wizard's entire lifetime). Add the ` +
        `missing value(s) to a new tasks_source_check migration.`
    ).toEqual([])
  })
})
