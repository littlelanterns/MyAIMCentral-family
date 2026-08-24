/**
 * PRD-40 Slice 4 — cascade-plan / classification-registry consistency guard.
 *
 * supabase/functions/_shared/coppa-cascade-plan.ts is the EXECUTABLE twin of
 * src/lib/compliance/childDataTables.ts (Slice 1's classification registry).
 * They can't share a single source file — one runs in Deno (Edge Functions),
 * the other in the Vite/browser build — so this test is the Convention
 * #271-style guard that keeps them from silently drifting apart: every
 * hard_delete/scrub table in the registry must have a plan entry (or be one
 * of the two bespoke SPECIAL_TABLES), every plan entry must correspond to a
 * hard_delete/scrub registry table, and the shape of each plan entry must be
 * consistent with its registry classification.
 */

import { describe, it, expect } from 'vitest'
import { CHILD_DATA_TABLES } from '../src/lib/compliance/childDataTables'
import { CASCADE_PLAN, SPECIAL_TABLES, getCascadePlanEntry } from '../supabase/functions/_shared/coppa-cascade-plan'

function bareTableName(t: string): string {
  return t.includes('.') ? t.split('.')[1] : t
}

describe('PRD-40 cascade plan <-> child_data_tables registry consistency', () => {
  it('the plan itself has no duplicate table entries', () => {
    const tables = CASCADE_PLAN.map((e) => e.table)
    const dupes = tables.filter((t, i) => tables.indexOf(t) !== i)
    expect([...new Set(dupes)]).toEqual([])
  })

  it('every hard_delete/scrub registry table has a plan entry, or is a declared SPECIAL_TABLE', () => {
    const actionable = CHILD_DATA_TABLES.filter((e) => e.classification === 'hard_delete' || e.classification === 'scrub')
    const missing = actionable
      .filter((e) => !SPECIAL_TABLES.includes(bareTableName(e.table) as (typeof SPECIAL_TABLES)[number]))
      .filter((e) => !getCascadePlanEntry(e.table))
      .map((e) => e.table)

    expect(
      missing,
      `The following hard_delete/scrub tables in childDataTables.ts have NO entry in ` +
        `coppa-cascade-plan.ts. Every actionable table must either get a plan entry or ` +
        `be added to SPECIAL_TABLES with bespoke handling in the cascade function.`
    ).toEqual([])
  })

  it('every plan entry corresponds to a hard_delete or scrub table in the registry', () => {
    const registryByTable = new Map(CHILD_DATA_TABLES.map((e) => [e.table, e.classification]))
    const bad = CASCADE_PLAN
      .filter((e) => {
        const cls = registryByTable.get(e.table)
        return cls !== 'hard_delete' && cls !== 'scrub'
      })
      .map((e) => e.table)

    expect(
      bad,
      `The following coppa-cascade-plan.ts entries do not correspond to a hard_delete/scrub ` +
        `table in childDataTables.ts (missing entirely, or classified preserve/not_applicable). ` +
        `The cascade must never touch a table the registry says to leave alone.`
    ).toEqual([])
  })

  it('the two declared SPECIAL_TABLES are classified hard_delete in the registry (sanity)', () => {
    for (const t of SPECIAL_TABLES) {
      const entry = CHILD_DATA_TABLES.find((e) => bareTableName(e.table) === t)
      expect(entry, `SPECIAL_TABLE '${t}' has no childDataTables.ts entry at all`).toBeTruthy()
      expect(entry?.classification, `SPECIAL_TABLE '${t}' registry classification`).toBe('hard_delete')
      // SPECIAL_TABLES are deliberately absent from CASCADE_PLAN (bespoke handling).
      expect(getCascadePlanEntry(t), `SPECIAL_TABLE '${t}' should NOT also have a generic plan entry`).toBeUndefined()
    }
  })

  it('scrub-classified registry tables never carry hard-delete columns in the plan', () => {
    const scrubTables = new Set(
      CHILD_DATA_TABLES.filter((e) => e.classification === 'scrub').map((e) => e.table)
    )
    const violators = CASCADE_PLAN
      .filter((e) => scrubTables.has(e.table) && e.hardDeleteColumns.length > 0)
      .map((e) => e.table)

    expect(
      violators,
      `The following tables are classified 'scrub' (never row-deleted) but their plan entry ` +
        `has hardDeleteColumns set — a scrub table must never trigger a full-row delete.`
    ).toEqual([])
  })

  it('hard_delete-classified (non-special) registry tables always carry at least one hard-delete column', () => {
    const hardDeleteTables = new Set(
      CHILD_DATA_TABLES
        .filter((e) => e.classification === 'hard_delete')
        .filter((e) => !SPECIAL_TABLES.includes(bareTableName(e.table) as (typeof SPECIAL_TABLES)[number]))
        .map((e) => e.table)
    )
    const violators = CASCADE_PLAN
      .filter((e) => hardDeleteTables.has(e.table) && e.hardDeleteColumns.length === 0)
      .map((e) => e.table)

    expect(
      violators,
      `The following tables are classified 'hard_delete' but their plan entry has NO ` +
        `hardDeleteColumns — nothing would ever trigger the delete this classification promises.`
    ).toEqual([])
  })

  it('every plan entry lists at least one column across all three column lists', () => {
    for (const entry of CASCADE_PLAN) {
      const total = entry.hardDeleteColumns.length + entry.scrubScalarColumns.length + entry.scrubArrayColumns.length
      expect(total, `${entry.table} plan entry lists zero columns of any kind`).toBeGreaterThan(0)
    }
  })
})
