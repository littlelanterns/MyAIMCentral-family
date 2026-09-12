/**
 * BETA-COHORT hotfix (migration 100339) — COALESCE guard for
 * raw_user_meta_data-derived booleans in handle_new_user().
 *
 * Root cause of the P0 (found live by rls-verifier, 2026-09-12): migration
 * 100338 derived a boolean via
 *   v_is_test_family := (NEW.raw_user_meta_data->>'is_test_family' = 'true')
 * `->>` on an ABSENT key returns SQL NULL, not an empty string — and
 * `NULL = 'true'` evaluates to NULL (three-valued logic), not false. That
 * NULL was then INSERTed into `families.is_test_family`, a NOT NULL column
 * — every real signup (which never sends this key) hit a 23502 and rolled
 * back the entire family-creation transaction. Fixed in 100339 by wrapping
 * the extraction in COALESCE(..., 'false') before the comparison.
 *
 * This is specifically about ASSIGNMENT (`:=`) into a PL/pgSQL variable
 * later used somewhere a NULL cannot be tolerated (a NOT NULL column, an
 * arithmetic comparison, etc.) — NOT about every use of the metadata-flag
 * pattern anywhere in the function. The pre-existing
 *   IF ... OR NEW.raw_user_meta_data->>'skip_auto_family' = 'true' THEN
 * guard is a CONDITIONAL, not an assignment: PL/pgSQL treats a NULL IF
 * condition as false (skip the branch), which is exactly the desired
 * behavior when the key is absent — that pattern is safe today and this
 * test deliberately does not flag it. Flagging it anyway would be a false
 * positive against a pattern that has been correct since migration 100075.
 *
 * Scope: only the LATEST migration that redefines handle_new_user() (by
 * filename — migrations are zero-padded numeric prefixes, so the highest
 * filename is the current live definition) is scanned. Older, superseded
 * definitions are historical record, not live risk.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations')

function findLatestHandleNewUserMigration(): { file: string; content: string } {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort() // zero-padded numeric prefixes sort correctly as strings
  const matches = files.filter((f) => {
    const content = readFileSync(join(MIGRATIONS_DIR, f), 'utf8')
    return /CREATE OR REPLACE FUNCTION public\.handle_new_user\(\)/.test(content)
  })
  if (matches.length === 0) throw new Error('No migration defines public.handle_new_user() — has it been renamed/moved?')
  const latest = matches[matches.length - 1]
  return { file: latest, content: readFileSync(join(MIGRATIONS_DIR, latest), 'utf8') }
}

/** Extract the function body between its dollar-quote tags (tag varies across migrations — $$ vs $function$). */
function extractFunctionBody(content: string): string {
  const declIndex = content.indexOf('CREATE OR REPLACE FUNCTION public.handle_new_user()')
  if (declIndex === -1) throw new Error('handle_new_user() declaration not found')
  const asDollarMatch = /AS\s+(\$[A-Za-z_]*\$)/.exec(content.slice(declIndex))
  if (!asDollarMatch) throw new Error('Could not find the opening dollar-quote tag after the function declaration')
  const tag = asDollarMatch[1]
  const bodyStart = declIndex + asDollarMatch.index + asDollarMatch[0].length
  const bodyEndRelative = content.slice(bodyStart).indexOf(tag)
  if (bodyEndRelative === -1) throw new Error(`Could not find the closing dollar-quote tag (${tag}) for handle_new_user()`)
  return content.slice(bodyStart, bodyStart + bodyEndRelative)
}

/**
 * Split into PL/pgSQL statements on `;` — a pragmatic heuristic (this
 * function body has no nested string literals containing semicolons and no
 * dollar-quoted sub-blocks), matching the "not a full parser, good enough
 * for a controlled codebase" style already established by
 * tests/task-source-constraint.test.ts and tests/coppa-write-gates-*.
 */
function splitStatements(body: string): string[] {
  return body.split(';').map((s) => s.trim()).filter(Boolean)
}

const META_BOOLEAN_ASSIGNMENT_RE = /:=[^;]*raw_user_meta_data\s*->>\s*'[A-Za-z_]+'\s*[^;]*=\s*'/

describe('BETA-COHORT: handle_new_user() never derives a boolean from raw_user_meta_data without COALESCE', () => {
  it('every metadata-derived boolean ASSIGNMENT is COALESCE-wrapped', () => {
    const { file, content } = findLatestHandleNewUserMigration()
    const body = extractFunctionBody(content)
    const statements = splitStatements(body)

    const violations = statements.filter((stmt) => {
      const looksLikeMetaBooleanAssignment = META_BOOLEAN_ASSIGNMENT_RE.test(stmt)
      if (!looksLikeMetaBooleanAssignment) return false
      // Must COALESCE the raw_user_meta_data extraction itself, not merely
      // contain the word COALESCE somewhere unrelated in the statement.
      return !/COALESCE\(\s*NEW\.raw_user_meta_data\s*->>/.test(stmt)
    })

    if (violations.length > 0) {
      throw new Error(
        `handle_new_user() in ${file} assigns a boolean from raw_user_meta_data->>'...' without ` +
          `wrapping it in COALESCE(NEW.raw_user_meta_data->>'key', 'false'). ->> on an absent key ` +
          `returns NULL, and NULL = 'true' is NULL (not false) — assigning that into a variable ` +
          `later written to a NOT NULL column rolls back the whole signup (migration 100338's ` +
          `is_test_family bug, hotfixed in 100339). Violating statement(s):\n` +
          violations.map((v) => `  ${v};`).join('\n'),
      )
    }

    // Sanity check the detector actually recognizes the known-fixed pattern
    // (a scanner that silently matches nothing is worse than none at all).
    expect(body).toContain("COALESCE(NEW.raw_user_meta_data->>'is_test_family', 'false')")
  })
})
