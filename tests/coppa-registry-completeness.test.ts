/**
 * PRD-40 child_data_tables registry completeness guard.
 *
 * CLAUDE.md convention (this PRD's own requirement, decision file R-6): "every
 * new child-scoped table MUST be registered in the child_data_tables registry
 * ... No exceptions — this is a legal requirement." This test is the durable,
 * self-updating enforcement of that convention: it parses every migration
 * file for tables carrying a family_members-referencing column (mirroring the
 * exact methodology used to derive src/lib/compliance/childDataTables.ts —
 * an information_schema walk for FK references to family_members, plus a
 * naming-convention fallback for columns that reference family_members
 * without an explicit FK) and fails when any such table is missing from the
 * registry. A future PRD that adds a new child-scoped table WILL break this
 * test until someone classifies it — that's the point.
 *
 * Static analysis, no live database connection (matches every other
 * migration-parsing vitest in this repo — see tests/list-type-constraint.test.ts
 * and tests/task-source-constraint.test.ts for the precedent pattern).
 *
 * Two independent detection signals, unioned (this mirrors exactly how the
 * registry was originally derived from two live SQL queries):
 *   1. Explicit FK: a column definition containing
 *      `REFERENCES [public.]family_members` within a CREATE TABLE body or an
 *      ALTER TABLE ... ADD COLUMN statement.
 *   2. Naming convention: a column named `member_id`, or ending in
 *      `_member_id` / `_member_ids`, within a CREATE TABLE body or an
 *      ALTER TABLE ... ADD COLUMN statement (catches columns that reference
 *      family_members without a formal FK constraint — common in this
 *      schema; e.g. dozens of `member_id UUID` columns with no REFERENCES
 *      clause at all).
 *
 * Known, deliberate non-matches (documented so a future maintainer doesn't
 * "fix" this test to catch them): `families.primary_parent_id` REFERENCES
 * auth.users(id) directly, not family_members — it is correctly excluded by
 * both signals above and is NOT a registry entry.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { CHILD_DATA_TABLES } from '../src/lib/compliance/childDataTables'

const MEMBER_COLUMN_NAME = /^(member_id|\w*_member_id|\w*_member_ids)$/i

function getMigrationsDir(): string {
  return join(process.cwd(), 'supabase/migrations')
}

/** Extract every top-level CREATE TABLE body, matched by balanced-paren walking (not regex greediness — CHECK(...) clauses nest parens). */
function extractCreateTableBodies(content: string): Array<{ table: string; body: string }> {
  const results: Array<{ table: string; body: string }> = []
  const re = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:public\.|platform_intelligence\.)?(\w+)\s*\(/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    const table = m[1]
    const openParenIdx = m.index + m[0].length - 1
    let depth = 0
    let i = openParenIdx
    for (; i < content.length; i++) {
      if (content[i] === '(') depth++
      else if (content[i] === ')') {
        depth--
        if (depth === 0) break
      }
    }
    results.push({ table, body: content.slice(openParenIdx + 1, i) })
  }
  return results
}

/** Extract every ALTER TABLE ... statement's full text up to its terminating semicolon (captures ADD COLUMN clauses added after the table's original creation). */
function extractAlterTableStatements(content: string): Array<{ table: string; body: string }> {
  const results: Array<{ table: string; body: string }> = []
  const re = /ALTER TABLE\s+(?:IF EXISTS\s+)?(?:public\.|platform_intelligence\.)?(\w+)\s+([\s\S]*?);/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    results.push({ table: m[1], body: m[2] })
  }
  return results
}

/** Column identifiers appearing as `<name>  <TYPE...>` at the start of a comma/newline-delimited clause. */
function extractColumnNamesFromBody(body: string): string[] {
  const names: string[] = []
  // Split on commas that are not inside a nested paren (CHECK(...), etc.) —
  // approximate by tracking paren depth while scanning for top-level commas.
  let depth = 0
  let clauseStart = 0
  const clauses: string[] = []
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) {
      clauses.push(body.slice(clauseStart, i))
      clauseStart = i + 1
    }
  }
  clauses.push(body.slice(clauseStart))

  for (const clause of clauses) {
    const trimmed = clause.trim()
    // Skip table-level constraint clauses (UNIQUE(...), CHECK(...), PRIMARY KEY(...), FOREIGN KEY(...)).
    if (/^(UNIQUE|CHECK|PRIMARY KEY|FOREIGN KEY|CONSTRAINT)\b/i.test(trimmed)) continue
    // ADD COLUMN [IF NOT EXISTS] <name> <type...>
    const addColMatch = trimmed.match(/^ADD COLUMN\s+(?:IF NOT EXISTS\s+)?(\w+)\s+/i)
    if (addColMatch) {
      names.push(addColMatch[1])
      continue
    }
    // Plain column definition: <name> <type...>
    const plainMatch = trimmed.match(/^(\w+)\s+/)
    if (plainMatch) {
      names.push(plainMatch[1])
    }
  }
  return names
}

function tableHasExplicitFkReference(body: string): boolean {
  return /REFERENCES\s+(?:public\.)?family_members\b/i.test(body)
}

function deriveMemberReferencingTablesFromMigrations(): Set<string> {
  const dir = getMigrationsDir()
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql'))
  const found = new Set<string>()

  for (const file of files) {
    const content = readFileSync(join(dir, file), 'utf-8')

    for (const { table, body } of extractCreateTableBodies(content)) {
      if (table === 'family_members') continue // the referenced table itself, not a referencing one
      const columnNames = extractColumnNamesFromBody(body)
      const hasNamedMemberColumn = columnNames.some((c) => MEMBER_COLUMN_NAME.test(c))
      if (hasNamedMemberColumn || tableHasExplicitFkReference(body)) {
        found.add(table)
      }
    }

    for (const { table, body } of extractAlterTableStatements(content)) {
      if (table === 'family_members') continue
      if (!/ADD COLUMN/i.test(body)) continue
      const columnNames = extractColumnNamesFromBody(body)
      const hasNamedMemberColumn = columnNames.some((c) => MEMBER_COLUMN_NAME.test(c))
      if (hasNamedMemberColumn || tableHasExplicitFkReference(body)) {
        found.add(table)
      }
    }
  }

  return found
}

describe('PRD-40 child_data_tables registry completeness', () => {
  it('the registry itself has no duplicate table entries', () => {
    const tables = CHILD_DATA_TABLES.map((e) => e.table)
    const dupes = tables.filter((t, i) => tables.indexOf(t) !== i)
    expect([...new Set(dupes)]).toEqual([])
  })

  it('every table in the registry has a non-empty classification and notes', () => {
    for (const entry of CHILD_DATA_TABLES) {
      expect(entry.classification, `${entry.table} is missing a classification`).toBeTruthy()
      expect(entry.notes?.length ?? 0, `${entry.table} is missing rationale notes`).toBeGreaterThan(0)
      expect(entry.memberColumns.length, `${entry.table} lists no member-referencing columns`).toBeGreaterThan(0)
    }
  })

  it('finds a non-trivial number of member-referencing tables across the migration history (sanity check the parser itself works)', () => {
    const derived = deriveMemberReferencingTablesFromMigrations()
    // 170 at PRD-40 Slice 1 authoring time (2026-07-08) — this floor guards
    // against the parser silently breaking (e.g. a migration file rename
    // pattern change) and returning a near-empty set that would make the
    // completeness assertion below vacuously pass.
    expect(derived.size).toBeGreaterThanOrEqual(150)
  })

  it('every member-referencing table found in migrations is classified in CHILD_DATA_TABLES', () => {
    const derived = deriveMemberReferencingTablesFromMigrations()
    // The parser matches on bare table name (it doesn't track which schema a
    // CREATE TABLE landed in), so normalize schema-qualified registry entries
    // (e.g. 'platform_intelligence.persona_promotion_queue') the same way.
    const registered = new Set(CHILD_DATA_TABLES.map((e) => (e.table.includes('.') ? e.table.split('.')[1] : e.table)))

    const missing = [...derived].filter((t) => !registered.has(t)).sort()

    expect(
      missing,
      `The following tables carry a family_members-referencing column but are NOT ` +
        `classified in src/lib/compliance/childDataTables.ts. This is a COPPA legal ` +
        `requirement (CLAUDE.md convention, decision file R-6) — every child-scoped ` +
        `table must be registered as hard_delete / scrub / preserve / not_applicable ` +
        `before it ships. Add an entry for each table above to CHILD_DATA_TABLES.`
    ).toEqual([])
  })

  it('the registry never claims a table that no longer exists in any migration (stale-entry guard)', () => {
    const derived = deriveMemberReferencingTablesFromMigrations()
    const registered = CHILD_DATA_TABLES.map((e) => e.table)
    // platform_intelligence.* entries aren't found by the public-schema-only
    // derivation walk in the same namespace — strip the schema prefix for
    // this comparison since the parser matches on bare table name.
    const bareNames = registered.map((t) => (t.includes('.') ? t.split('.')[1] : t))
    const stale = bareNames.filter((t) => !derived.has(t))
    expect(
      stale,
      `The following registry entries no longer correspond to any table found in ` +
        `the migration history. If a table was renamed or dropped, update or remove ` +
        `its childDataTables.ts entry.`
    ).toEqual([])
  })
})
