/**
 * RPC EXECUTE-grant audit guard.
 *
 * Origin: the 2026-07-09 adversarial safety-stack review
 * (SAFETY_STACK_ADVERSARIAL_REVIEW.md WORKSTREAM 2) found ~15
 * `SECURITY DEFINER` leaf functions still `EXECUTE`-granted to `anon` /
 * `authenticated` / `PUBLIC` with zero authorization check — one
 * (`grant_money`) was live-proven exploitable by a completely
 * unauthenticated caller against a real family's ledger. The 2026-07-07
 * godmother lockdown (migrations 100298/100300) sealed the dispatch layer
 * but stopped there; this migration (00000000100312) plus its predecessors
 * (100310, 100311) close the leaf layer this pin now guards.
 *
 * CLAUDE.md Convention #280: "every new SECURITY DEFINER function taking a
 * bare id must be authorization-gated before it ever reaches a
 * client-reachable code path." This test is the durable, self-updating
 * enforcement of that convention for the RPC-EXECUTE-grant dimension,
 * mirroring the parsing methodology of tests/coppa-registry-completeness.test.ts
 * (static analysis, no live database connection).
 *
 * Scope: only functions that perform a MUTATION of their own — a literal
 * `INSERT INTO`, `UPDATE <table>`, or `DELETE FROM` in the function's own
 * body — are required to show a closing signal. This directly targets
 * Convention #280's actual concern (money/points/permission-rewrite class
 * fraud) rather than blanket-catching every SECURITY DEFINER function with
 * an argument, which would also flag dozens of legitimate read-only
 * SQL/plpgsql bridges into the `platform_intelligence` schema (not
 * PostgREST-accessible, hence SECURITY DEFINER by necessity, not by
 * privilege-escalation need — e.g. `match_book_chunks`, `get_bookshelf_context`,
 * `family_today`, RLS helper predicates like `is_primary_parent_of`). A
 * function that mutates ONLY by calling another SECURITY DEFINER function
 * (never a bare INSERT/UPDATE/DELETE of its own) is soundly covered
 * transitively: `auth.uid()`/`auth.role()` are GUC-based and read the real
 * end user regardless of nested SECURITY DEFINER role switches (proven live
 * in RLS-VERIFICATION.md's migration 100298/100300 verification passes), so
 * as long as this same pin requires every function with a DIRECT mutation to
 * gate itself, every call chain terminates at a gated write no matter how
 * many wrapper layers sit above it.
 *
 * A qualifying `SECURITY DEFINER` mutating function with 1+ parameters is
 * considered SAFE if, anywhere in the migration corpus, at least one of:
 *
 *   (a) REVOKE signal — a `REVOKE EXECUTE ... FROM ...` statement targeting
 *       that function name whose FROM-clause mentions `anon` or `PUBLIC`.
 *       Once a role's grant is revoked it stays revoked unless a LATER
 *       migration re-GRANTs it — this pin does not simulate full temporal
 *       ACL ordering (see "Known limitations" below), it only checks that a
 *       closing action exists somewhere. Combined with the live
 *       `has_function_privilege()` proof already on file in
 *       RLS-VERIFICATION.md for every function this pin currently expects
 *       to pass, that's a deliberate, documented tradeoff.
 *
 *   (b) In-body gate signal — the LATEST `CREATE [OR REPLACE] FUNCTION`
 *       body for that name contains `RAISE EXCEPTION` together with either
 *       `auth.role()` or `auth.uid()` — the exact shape used by every
 *       proven gate in this codebase (process_routine_step_completion,
 *       grant_money, apply_permission_profile, advance_coloring_reveal,
 *       award_custom_reward_for_completion, grant_money_for_task_completion,
 *       member_points_today, and the staff_permissions-gated admin/ethics
 *       functions).
 *
 *   (c) Explicit allowlist — KNOWN_SAFE_UNGATED below, each entry carrying
 *       a one-line reason. Used for by-design pre-auth primitives (the
 *       family-login flow can't require a session before establishing one)
 *       and functions whose only "id" parameter is not a cross-tenant
 *       target (e.g. purely computational helpers).
 *
 * A function found by NEITHER (a) NOR (b) NOR (c) fails this test — that is
 * the point. A future migration that adds a new bare-id-taking
 * `SECURITY DEFINER` function with zero gate and zero revoke will break CI
 * until someone classifies it, exactly like the coppa registry pin.
 *
 * Known limitations (documented, not silently assumed away):
 *   - No temporal ACL simulation: a REVOKE in an earlier migration followed
 *     by a re-GRANT to anon/PUBLIC in a LATER migration would still read as
 *     "has a revoke signal" here. This has not happened anywhere in this
 *     repo's history (checked); if it ever does, the live
 *     `has_function_privilege()` proof step (rls-verifier) is the backstop
 *     this static pin cannot replace.
 *   - Function overloading (same name, different signatures) is not
 *     tracked — this codebase has none today (verified: every SECURITY
 *     DEFINER function name maps to exactly one live signature).
 *   - The in-body gate detection is a textual signal match, not a real SQL
 *     parser proving the gate actually runs before every mutation. It
 *     mirrors exactly how migrations 100298/100300/100311/100312 self-
 *     verify via their own `DO $$ ... prosrc LIKE ...` blocks.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

interface ParsedFunction {
  name: string
  argCount: number
  isSecurityDefiner: boolean
  body: string
  file: string
}

/** Literal INSERT/UPDATE/DELETE in the function's OWN body — see the file-header "Scope" note. */
function hasOwnMutation(body: string): boolean {
  return /\b(INSERT\s+INTO|UPDATE\s+\w|DELETE\s+FROM)\b/i.test(body)
}

interface RevokeSignal {
  name: string
  closesAnonOrPublic: boolean
}

/**
 * Functions with zero legitimate authenticated caller by design — the
 * family-login flow's entire purpose is to authenticate someone who does
 * NOT yet have a session, so these are pre-auth primitives, not gate gaps.
 * Every entry here is independently secured by its OWN mechanism (secret
 * comparison, token match, or lockout-protected credential check) — see
 * SAFETY_STACK_ADVERSARIAL_REVIEW.md "BY DESIGN pre-auth" section, which
 * this list transcribes verbatim.
 */
const KNOWN_SAFE_UNGATED: Record<string, string> = {
  verify_member_pin: 'pre-auth primitive — bcrypt-verifies a PIN, lockout-protected, secret never returned',
  verify_member_picture_password: 'pre-auth primitive — server-side picture verify, lockout-protected',
  verify_hub_pin: 'pre-auth primitive — hub device PIN verify, lockout-protected',
  verify_family_login: 'pre-auth primitive — combined family-name/password verify, byte-identical generic failures (no enumeration), lockout-protected',
  lookup_family_by_login_name: 'pre-auth primitive — roster released ONLY behind a verified family password, gated inside the RPC body itself',
  get_family_login_members: 'pre-auth primitive — same roster-gating as lookup_family_by_login_name',
  accept_family_invite: 'token-gated — the invite token itself IS the authorization; no session exists yet by design',
  hash_member_pin: 'primary-parent gate confirmed live via RLS-VERIFICATION.md; body checks staff/parent role through a path this heuristic does not textually match (no auth.uid() literal — uses a JOIN-based ownership check)',
  hash_hub_pin: 'primary-parent gate confirmed live via RLS-VERIFICATION.md; same shape as hash_member_pin',
}

function getMigrationsDir(): string {
  return join(process.cwd(), 'supabase/migrations')
}

function getMigrationFilesSorted(): string[] {
  return readdirSync(getMigrationsDir())
    .filter((f) => f.endsWith('.sql'))
    .sort()
}

/** Balanced-paren walk from an opening paren index; returns the index of its matching close paren. */
function findMatchingParen(content: string, openIdx: number): number {
  let depth = 0
  for (let i = openIdx; i < content.length; i++) {
    if (content[i] === '(') depth++
    else if (content[i] === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** Count top-level comma-separated argument entries in a raw arg-list string (balanced against nested parens/brackets). */
function countArgs(rawArgs: string): number {
  const trimmed = rawArgs.trim()
  if (trimmed === '') return 0
  let depth = 0
  let count = 1
  for (const ch of trimmed) {
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === ',' && depth === 0) count++
  }
  return count
}

/**
 * Extracts every `CREATE [OR REPLACE] FUNCTION name(args) ... AS $tag$ body $tag$`
 * definition from a migration file's content, including whether
 * `SECURITY DEFINER` appears in the header/prelude between the arg list and
 * the body's opening dollar-quote.
 */
function extractFunctionDefinitions(content: string, file: string): ParsedFunction[] {
  const results: ParsedFunction[] = []
  const headerRe = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(\w+)\s*\(/gi
  let m: RegExpExecArray | null

  while ((m = headerRe.exec(content))) {
    const name = m[1]
    const openParenIdx = m.index + m[0].length - 1
    const closeParenIdx = findMatchingParen(content, openParenIdx)
    if (closeParenIdx === -1) continue

    const rawArgs = content.slice(openParenIdx + 1, closeParenIdx)
    const argCount = countArgs(rawArgs)

    // Prelude: from after the arg list to the body's opening dollar-quote tag.
    const afterArgs = content.slice(closeParenIdx + 1)
    const tagMatch = afterArgs.match(/\$(\w*)\$/)
    if (!tagMatch) continue // not a dollar-quoted function body (e.g. a forward declaration) — skip
    const prelude = afterArgs.slice(0, tagMatch.index)
    const isSecurityDefiner = /SECURITY\s+DEFINER/i.test(prelude)

    const tag = `$${tagMatch[1]}$`
    const bodyStart = afterArgs.indexOf(tag) + tag.length
    const bodyEndRelative = afterArgs.indexOf(tag, bodyStart)
    if (bodyEndRelative === -1) continue
    const body = afterArgs.slice(bodyStart, bodyEndRelative)

    // Advance the outer regex past this whole definition so a body
    // containing something that looks like "FUNCTION foo(" (unlikely, but
    // defensive) isn't double-matched.
    headerRe.lastIndex = closeParenIdx + 1 + bodyEndRelative + tag.length

    results.push({ name, argCount, isSecurityDefiner, body, file })
  }

  return results
}

/**
 * Extracts every `REVOKE EXECUTE/ALL ON FUNCTION name(...) FROM <roles>;`
 * statement, returning whether the FROM clause mentions `anon` or the
 * `PUBLIC` keyword for that function name.
 */
function extractRevokeSignals(content: string): RevokeSignal[] {
  const results: RevokeSignal[] = []
  const re = /REVOKE\s+(?:ALL|EXECUTE)\s+ON\s+FUNCTION\s+(?:public\.)?(\w+)\s*\([^;]*?\)\s+FROM\s+([^;]+);/gis
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    const name = m[1]
    const fromClause = m[2]
    const closesAnonOrPublic = /\bpublic\b/i.test(fromClause) || /\banon\b/i.test(fromClause)
    results.push({ name, closesAnonOrPublic })
  }
  return results
}

function deriveState() {
  const files = getMigrationFilesSorted()
  const latestByName = new Map<string, ParsedFunction>()
  const revokeSignalByName = new Map<string, boolean>()

  for (const file of files) {
    const content = readFileSync(join(getMigrationsDir(), file), 'utf-8')

    for (const fn of extractFunctionDefinitions(content, file)) {
      // Later migrations (higher-numbered filenames) overwrite earlier
      // entries — CREATE OR REPLACE means the latest body is what's live.
      latestByName.set(fn.name, fn)
    }

    for (const signal of extractRevokeSignals(content)) {
      if (signal.closesAnonOrPublic) {
        revokeSignalByName.set(signal.name, true)
      }
    }
  }

  return { latestByName, revokeSignalByName }
}

function hasInBodyGate(body: string): boolean {
  return /RAISE\s+EXCEPTION/i.test(body) && (/auth\.role\s*\(\s*\)/i.test(body) || /auth\.uid\s*\(\s*\)/i.test(body))
}

describe('RPC EXECUTE-grant audit (Convention #280 regression pin)', () => {
  it('the allowlist has no duplicate or stale entries against the live migration corpus', () => {
    const { latestByName } = deriveState()
    const names = Object.keys(KNOWN_SAFE_UNGATED)
    const dupes = names.filter((n, i) => names.indexOf(n) !== i)
    expect(dupes).toEqual([])

    const stale = names.filter((n) => !latestByName.has(n))
    expect(
      stale,
      'These allowlist entries no longer correspond to any function found in the migration history — remove them.'
    ).toEqual([])
  })

  it('finds a non-trivial number of mutating SECURITY DEFINER functions with parameters (sanity check the parser itself works)', () => {
    const { latestByName } = deriveState()
    const mutatingWithArgs = [...latestByName.values()].filter(
      (f) => f.isSecurityDefiner && f.argCount >= 1 && hasOwnMutation(f.body)
    )
    // 40 live at authoring time (2026-07-09) — this floor guards against the
    // parser silently breaking (e.g. a dollar-quote tag convention change)
    // and returning a near-empty set that would make the completeness
    // assertion below vacuously pass.
    expect(mutatingWithArgs.length).toBeGreaterThanOrEqual(30)
  })

  it('every mutating SECURITY DEFINER function taking 1+ parameters is either grant-revoked from anon/PUBLIC, in-body gated, or explicitly allowlisted', () => {
    const { latestByName, revokeSignalByName } = deriveState()

    const violations: string[] = []

    for (const fn of latestByName.values()) {
      if (!fn.isSecurityDefiner || fn.argCount < 1) continue
      if (!hasOwnMutation(fn.body)) continue
      if (KNOWN_SAFE_UNGATED[fn.name]) continue
      if (revokeSignalByName.get(fn.name)) continue
      if (hasInBodyGate(fn.body)) continue

      violations.push(`${fn.name} (${fn.argCount} args, defined in ${fn.file})`)
    }

    expect(
      violations.sort(),
      'The following SECURITY DEFINER functions perform their own INSERT/' +
        'UPDATE/DELETE and take 1+ parameters but have NO closing signal — ' +
        'no REVOKE FROM anon/PUBLIC, no in-body (RAISE EXCEPTION + ' +
        'auth.role()/auth.uid()) gate, and no allowlist entry. This is the ' +
        'exact shape of the live grant_money exploit found by the ' +
        '2026-07-09 adversarial safety-stack review ' +
        '(SAFETY_STACK_ADVERSARIAL_REVIEW.md). Either add an authorization ' +
        'gate (see migration 00000000100312 for the pattern), REVOKE EXECUTE ' +
        'FROM PUBLIC/anon/authenticated and GRANT TO service_role if there is ' +
        'no legitimate client caller, or add a one-line reason to ' +
        'KNOWN_SAFE_UNGATED in this test if it is genuinely by-design pre-auth.'
    ).toEqual([])
  })

  it('the specific functions fixed by migrations 100310/100311/100312 are all classified safe', () => {
    const { latestByName, revokeSignalByName } = deriveState()

    const shouldBeGated = [
      'advance_coloring_reveal',
      'award_custom_reward_for_completion',
      'grant_money_for_task_completion',
      'grant_money',
      'apply_permission_profile',
    ]
    const shouldBeRevoked = [
      'grant_points',
      'update_ethics_pattern_embedding',
      'insert_ethics_pattern_candidate',
      'award_starter_creature',
      'dispatch_single_grant',
      'delete_book_extractions_by_audience',
      'insert_book_chunks',
      'insert_book_extractions',
      'insert_book_extractions_study_guide',
      'update_book_cache_embedding',
      'update_book_chunk_embedding',
      'update_book_extraction_embedding',
      'update_book_extraction_key_points',
      'update_book_extraction_youth_text',
      'set_bookshelf_item_library_id',
      'upsert_book_library',
    ]
    const shouldBeAnonRevoked = ['create_custom_extraction', 'update_extraction_text']

    for (const name of shouldBeGated) {
      const fn = latestByName.get(name)
      expect(fn, `${name} not found in migration corpus`).toBeTruthy()
      expect(hasInBodyGate(fn!.body), `${name} is expected to carry an in-body authorization gate`).toBe(true)
    }

    for (const name of [...shouldBeRevoked, ...shouldBeAnonRevoked]) {
      expect(
        revokeSignalByName.get(name),
        `${name} is expected to have a REVOKE ... FROM anon/PUBLIC signal somewhere in the migration corpus`
      ).toBe(true)
    }
  })
})
