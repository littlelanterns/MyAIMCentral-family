/**
 * PRD-40 Slice 5 — write-gate / registry drift pin.
 *
 * Migration 00000000100328_coppa_write_gates_generated.sql is GENERATED from
 * the child-data registry (scripts/coppa-write-gates.ts). Applied migrations
 * are immutable, so a LATER registry change (new hard_delete table, changed
 * subject columns) must ship as a NEW *coppa_write_gates* migration — this
 * test fails CI until it does:
 *
 *   - every currently-expected gate's canonical DDL must appear in the
 *     concatenation of all checked-in *coppa_write_gates* migrations
 *     (append-friendly: regenerating into a new migration file satisfies it),
 *   - the predicate function migration must exist,
 *   - the generated rollback script must cover every gated table.
 *
 * This is the durable form of "the generation must be mechanical" — the
 * registry-completeness vitest catches unclassified NEW tables; this one
 * catches classified-but-ungated ones.
 */

import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  expectedGates,
  gateExpression,
  INSERT_POLICY_NAME,
  UPDATE_POLICY_NAME,
} from '../scripts/coppa-write-gates'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations')

function gatesMigrationText(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.includes('coppa_write_gates') && f.endsWith('.sql'))
  expect(files.length, 'at least one coppa_write_gates migration must exist').toBeGreaterThan(0)
  return files.map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8')).join('\n')
}

describe('PRD-40 Slice 5 — COPPA write gates stay in lockstep with the registry', () => {
  const gates = expectedGates()
  const migrationText = gatesMigrationText()

  it('derives a sane gate set (134 hard_delete tables at authoring time; never shrinks silently)', () => {
    expect(gates.length).toBeGreaterThanOrEqual(134)
    const tables = gates.map((g) => g.table)
    expect(new Set(tables).size).toBe(tables.length)
  })

  it('every expected gate has its INSERT and UPDATE policy DDL in a checked-in migration', () => {
    const missing: string[] = []
    for (const g of gates) {
      const expr = gateExpression(g)
      const ins = `CREATE POLICY ${INSERT_POLICY_NAME} ON public.${g.table} AS RESTRICTIVE FOR INSERT WITH CHECK (${expr})`
      const upd = `CREATE POLICY ${UPDATE_POLICY_NAME} ON public.${g.table} AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (${expr})`
      if (!migrationText.includes(ins)) missing.push(`${g.table} [INSERT: ${expr}]`)
      if (!migrationText.includes(upd)) missing.push(`${g.table} [UPDATE: ${expr}]`)
    }
    expect(
      missing,
      `Registry/plan changed without regenerating the write gates. Run \`npm run coppa:gates\` ` +
        `targeting a NEW migration number (applied migrations are immutable) and get it applied ` +
        `through the founder gate. Missing:`,
    ).toEqual([])
  })

  it('the util.coppa_write_allowed predicate migration exists', () => {
    expect(existsSync(join(MIGRATIONS_DIR, '00000000100327_coppa_write_allowed_and_roster_suspension.sql'))).toBe(true)
    const fn = readFileSync(join(MIGRATIONS_DIR, '00000000100327_coppa_write_allowed_and_roster_suspension.sql'), 'utf8')
    expect(fn).toContain('CREATE OR REPLACE FUNCTION util.coppa_write_allowed(p_member_id UUID)')
    expect(fn).toContain('SECURITY DEFINER')
    // The inertness pillars stay pinned: NULL passes, suspension blocks
    // unconditionally, dormancy suspends the consent requirement.
    expect(fn).toContain('IF p_member_id IS NULL THEN')
    expect(fn).toContain('IF v_suspended THEN')
    expect(fn).toContain('lawyer_approved_at IS NOT NULL')
  })

  it('the generated rollback script covers every gated table (the single documented DROP path)', () => {
    const rollbackPath = join(ROOT, 'scripts', 'coppa-write-gates-rollback.sql')
    expect(existsSync(rollbackPath)).toBe(true)
    const rollback = readFileSync(rollbackPath, 'utf8')
    const uncovered = gates
      .filter((g) => !rollback.includes(`DROP POLICY IF EXISTS ${INSERT_POLICY_NAME} ON public.${g.table}`))
      .map((g) => g.table)
    expect(uncovered, 'regenerate the rollback via `npm run coppa:gates`').toEqual([])
  })

  it('actor/scrub columns are never gated (sibling-preservation rule)', () => {
    // The canonical hazard from the Slice-4 lesson: gating tasks.created_by
    // would block a SIBLING completing a shared task the child created.
    const tasks = gates.find((g) => g.table === 'tasks')
    expect(tasks?.subjectColumns).toEqual(['assignee_id'])
    const completions = gates.find((g) => g.table === 'task_completions')
    expect(completions?.subjectColumns).not.toContain('acted_by')
    expect(completions?.subjectColumns).not.toContain('approved_by')
  })
})
