/**
 * PRD-40 Slice 5 — COPPA RESTRICTIVE write-gate generator.
 *
 * Generates the migration SQL that layers `AS RESTRICTIVE` INSERT/UPDATE
 * policies onto every hard_delete-classified table in the child-data
 * registry. The gates all delegate to ONE predicate —
 * `util.coppa_write_allowed(<subject column>)` (migration 100327) — which is
 * inert for every member except (a) members suspended for deletion (Slice 4
 * revocation grace) and (b) under-13 members without active consent ONCE a
 * lawyer-approved consent template exists (ruling R-8 dormancy: while no
 * approved template exists, valid consent legally cannot exist, so the
 * unconsented-under-13 rule is dormant — the founder's own under-13 kids are
 * byte-identically unaffected today).
 *
 * MECHANICAL GENERATION — DO NOT HAND-EDIT THE OUTPUT MIGRATION.
 *   - Table set:      childDataTables.ts entries classified 'hard_delete'
 *                     (the registry — CLAUDE.md's "its RLS policies MUST
 *                     include the active-consent check" convention).
 *   - Subject columns: coppa-cascade-plan.ts `hardDeleteColumns` (the
 *                     registry's test-guarded executable twin — the SAME
 *                     columns whose match deletes the row at cascade time
 *                     identify the row's data subject at write time).
 *                     Scrub/actor columns (created_by, acted_by, …) are
 *                     deliberately NOT gated: gating them would block
 *                     SIBLINGS' legitimate writes to shared rows that merely
 *                     reference the child (the same sibling-preservation
 *                     rule the cascade follows).
 *   - SPECIAL_TABLES (earned_prizes, contracts) have no generic plan entry
 *                     (their cascade hard-delete is conditional); their
 *                     subject column is family_member_id, declared here with
 *                     the same NULL-passes semantics (family-level rows with
 *                     a NULL owner are never child-subject rows).
 *
 * Regenerate:  npm run coppa:gates
 * Drift pin:   tests/coppa-write-gates-consistency.test.ts fails CI when a
 *              registry change isn't reflected in a checked-in migration.
 * Rollback:    scripts/coppa-write-gates-rollback.sql (generated alongside —
 *              the single documented DROP path).
 */

import { CHILD_DATA_TABLES } from '../src/lib/compliance/childDataTables'
import { CASCADE_PLAN, SPECIAL_TABLES } from '../supabase/functions/_shared/coppa-cascade-plan'

export interface WriteGate {
  /** Bare public-schema table name. */
  table: string
  /** Subject (data-owner) columns — every one must pass util.coppa_write_allowed(). */
  subjectColumns: string[]
}

/** Subject columns for the two bespoke-cascade tables (see header). */
const SPECIAL_SUBJECT_COLUMNS: Record<string, string[]> = {
  earned_prizes: ['family_member_id'],
  contracts: ['family_member_id'],
}

export const INSERT_POLICY_NAME = 'coppa_write_gate_ins'
export const UPDATE_POLICY_NAME = 'coppa_write_gate_upd'

/** The current expected gate set, derived mechanically from the registry + plan. */
export function expectedGates(): WriteGate[] {
  const planByTable = new Map(CASCADE_PLAN.map((e) => [e.table, e]))
  const gates: WriteGate[] = []

  for (const entry of CHILD_DATA_TABLES) {
    if (entry.classification !== 'hard_delete') continue

    if (entry.table.includes('.')) {
      throw new Error(
        `coppa-write-gates: hard_delete table '${entry.table}' is not in the public schema — ` +
          `non-public gated tables need explicit handling before generation can proceed.`,
      )
    }

    if ((SPECIAL_TABLES as readonly string[]).includes(entry.table)) {
      const cols = SPECIAL_SUBJECT_COLUMNS[entry.table]
      if (!cols?.length) {
        throw new Error(`coppa-write-gates: SPECIAL_TABLE '${entry.table}' has no declared subject columns.`)
      }
      gates.push({ table: entry.table, subjectColumns: [...cols] })
      continue
    }

    const plan = planByTable.get(entry.table)
    if (!plan) {
      throw new Error(
        `coppa-write-gates: hard_delete table '${entry.table}' has no coppa-cascade-plan.ts entry — ` +
          `the consistency test should have caught this (tests/coppa-cascade-plan-consistency.test.ts).`,
      )
    }
    if (plan.hardDeleteColumns.length === 0) {
      throw new Error(
        `coppa-write-gates: hard_delete table '${entry.table}' has EMPTY hardDeleteColumns in the plan — ` +
          `a hard_delete table must have at least one subject column.`,
      )
    }
    gates.push({ table: entry.table, subjectColumns: [...plan.hardDeleteColumns] })
  }

  // Deterministic output — regeneration must be byte-stable.
  gates.sort((a, b) => a.table.localeCompare(b.table))
  return gates
}

/** The WITH CHECK expression for one gate (canonical form the drift pin asserts on). */
export function gateExpression(gate: WriteGate): string {
  return gate.subjectColumns.map((c) => `util.coppa_write_allowed(${c})`).join(' AND ')
}

/** One table's idempotent DDL block. */
export function gateDdl(gate: WriteGate): string {
  const expr = gateExpression(gate)
  const t = gate.table
  return `-- ${t} (subject: ${gate.subjectColumns.join(', ')})
DO $do$
BEGIN
  IF to_regclass('public.${t}') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.${t} absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS ${INSERT_POLICY_NAME} ON public.${t}';
    EXECUTE 'CREATE POLICY ${INSERT_POLICY_NAME} ON public.${t} AS RESTRICTIVE FOR INSERT WITH CHECK (${expr.replace(/'/g, "''")})';
    EXECUTE 'DROP POLICY IF EXISTS ${UPDATE_POLICY_NAME} ON public.${t}';
    EXECUTE 'CREATE POLICY ${UPDATE_POLICY_NAME} ON public.${t} AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (${expr.replace(/'/g, "''")})';
  END IF;
END $do$;`
}

export function generateMigrationSql(): string {
  const gates = expectedGates()
  const blocks = gates.map(gateDdl).join('\n\n')
  return `-- ============================================================================
-- Migration: PRD-40 Slice 5 — COPPA RESTRICTIVE write gates (GENERATED)
-- ============================================================================
-- ⚠ GENERATED FILE — do not hand-edit. Regenerate with:  npm run coppa:gates
-- Generator:  scripts/coppa-write-gates.ts
-- Source:     src/lib/compliance/childDataTables.ts (hard_delete class)
--             supabase/functions/_shared/coppa-cascade-plan.ts (subject cols)
-- Drift pin:  tests/coppa-write-gates-consistency.test.ts
-- Rollback:   scripts/coppa-write-gates-rollback.sql (single documented DROP
--             path — drops every gate policy, leaves util.coppa_write_allowed
--             in place)
--
-- Each gated table gains two AS RESTRICTIVE policies (they AND onto the
-- existing permissive policies; they can only ever NARROW access):
--   ${INSERT_POLICY_NAME}: FOR INSERT WITH CHECK (util.coppa_write_allowed(<subject cols>))
--   ${UPDATE_POLICY_NAME}: FOR UPDATE USING (true) WITH CHECK (same)
--     (USING (true) — deliberately no row-visibility restriction: mom must
--      still SEE and manage a suspended child's existing rows; only NEW
--      row-values naming the child as data subject are gated.)
-- SELECT and DELETE are deliberately ungated: reading and REMOVING a child's
-- data are never "collection"; the revocation grace period must leave mom
-- able to review, and the cascade able to delete.
--
-- util.coppa_write_allowed (migration 100327) is inert today for every
-- production member: zero suspended members exist, and R-8 dormancy holds
-- until a lawyer-approved consent template exists. SECURITY DEFINER write
-- paths (RPCs, triggers owned by postgres) and service-role Edge Functions
-- BYPASS RLS and therefore these gates — the Edge-layer check in
-- supabase/functions/_shared/coppa-consent.ts is the companion gate for
-- those paths (PRD-40 "defense in depth" — here the layers are inverted:
-- RLS gates client writes, the Edge check gates service-role writes).
--
-- ${gates.length} gated tables, ${gates.length * 2} policies.
-- Idempotent throughout (DROP POLICY IF EXISTS + CREATE, table-existence
-- guarded).
-- ============================================================================

${blocks}

-- ============================================================================
-- Verification (runs at apply time; raises on failure)
-- ============================================================================
DO $verify$
DECLARE
  v_expected INTEGER := ${gates.length * 2};
  v_actual INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_actual
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname IN ('${INSERT_POLICY_NAME}', '${UPDATE_POLICY_NAME}');
  IF v_actual <> v_expected THEN
    RAISE EXCEPTION 'coppa write gates: expected % policies, found %', v_expected, v_actual;
  END IF;
  RAISE NOTICE 'coppa write gates: % policies in place across % tables', v_actual, v_expected / 2;
END $verify$;
`
}

export function generateRollbackSql(): string {
  const gates = expectedGates()
  const blocks = gates
    .map(
      (g) => `DO $do$
BEGIN
  IF to_regclass('public.${g.table}') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS ${INSERT_POLICY_NAME} ON public.${g.table}';
    EXECUTE 'DROP POLICY IF EXISTS ${UPDATE_POLICY_NAME} ON public.${g.table}';
  END IF;
END $do$;`,
    )
    .join('\n')
  return `-- ============================================================================
-- PRD-40 Slice 5 — COPPA write-gate ROLLBACK (GENERATED — the single
-- documented DROP path for every coppa_write_gate_* policy).
-- Regenerate with:  npm run coppa:gates
-- Does NOT drop util.coppa_write_allowed (harmless standalone predicate) or
-- touch the roster-suspension filters (migration 100327) — those are
-- hand-reverted if ever needed.
-- Apply via:  supabase db query --linked -f scripts/coppa-write-gates-rollback.sql
-- (founder-gated, like every production-touching action).
-- ============================================================================
${blocks}

DO $verify$
DECLARE v_left INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_left FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname IN ('${INSERT_POLICY_NAME}', '${UPDATE_POLICY_NAME}');
  IF v_left <> 0 THEN
    RAISE EXCEPTION 'coppa write-gate rollback: % gate policies still present', v_left;
  END IF;
  RAISE NOTICE 'coppa write-gate rollback complete — 0 gate policies remain';
END $verify$;
`
}

// ── CLI ─────────────────────────────────────────────────────────────────────
// npx tsx scripts/coppa-write-gates.ts --write <migration path>
// Writes the migration to the given path and the rollback script to
// scripts/coppa-write-gates-rollback.sql. With no args, prints a summary.

const isCli = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/coppa-write-gates.ts')
if (isCli) {
  const { writeFileSync } = await import('node:fs')
  const { fileURLToPath } = await import('node:url')
  const { dirname, join } = await import('node:path')
  const here = dirname(fileURLToPath(import.meta.url))

  const writeIdx = process.argv.indexOf('--write')
  const gates = expectedGates()
  if (writeIdx !== -1) {
    const target = process.argv[writeIdx + 1]
    if (!target) {
      console.error('Usage: npx tsx scripts/coppa-write-gates.ts --write supabase/migrations/<file>.sql')
      process.exit(1)
    }
    writeFileSync(join(here, '..', target), generateMigrationSql())
    writeFileSync(join(here, 'coppa-write-gates-rollback.sql'), generateRollbackSql())
    console.log(`✓ wrote ${target} (${gates.length} tables, ${gates.length * 2} policies)`)
    console.log('✓ wrote scripts/coppa-write-gates-rollback.sql')
  } else {
    console.log(`coppa-write-gates: ${gates.length} hard_delete tables would be gated:`)
    for (const g of gates) console.log(`  ${g.table} ← ${g.subjectColumns.join(', ')}`)
  }
}
