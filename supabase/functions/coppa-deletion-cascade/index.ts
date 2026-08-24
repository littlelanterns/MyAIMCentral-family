// coppa-deletion-cascade — PRD-40 Screen 9's scheduled deletion job.
//
// Cron-invoked daily (Convention #246, util.invoke_edge_function), deployed
// --no-verify-jwt with the same in-code service-role bearer check used by
// reconcile-coppa-verifications / safety-weekly-digest.
//
// For every coppa_consents row past its scheduled_deletion_at with no
// deletion_completed_at yet: tears down the child's two-door shadow auth
// account (addendum §(b), ordered BEFORE the family_members row delete),
// walks the CASCADE_PLAN registry (hard-delete / scrub-scalar / scrub-array,
// see _shared/coppa-cascade-plan.ts for the algorithm), handles the two
// SPECIAL_TABLES (earned_prizes, contracts — conditional hard-delete on a
// nullable owner column), recomputes family_goal_contributions-affected
// active goals (Convention #278), deletes the child's family_members row and
// avatar Storage object, writes one retention_deletion_log row per table
// touched, and marks the consent row's deletion_completed_at +
// deletion_completion_notes (PRD's per-table audit summary).
//
// Never-throws-per-child (Convention #199 precedent): one family's failure
// must never block every other family's scheduled deletion from running.
// A child whose cascade errors mid-way is simply retried on the next daily
// run (deletion_completed_at stays NULL until the WHOLE cascade for that
// child succeeds) — partial per-table failures within a single child's run
// are logged as warnings and do not abort that child's cascade (the PRD's
// own "warnings" language in deletion_completion_notes anticipates this;
// the load-bearing guarantee is sibling-row preservation, not table-by-table
// atomicity).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonHeaders } from '../_shared/cors.ts'
import { CASCADE_PLAN } from '../_shared/coppa-cascade-plan.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const NOT_NULL_VIOLATION = '23502'

interface TableNote {
  hard_deleted: number
  scrubbed_nulled: number
  scrubbed_reassigned: number
  array_scrubbed: number
  warnings: string[]
}

function newNote(): TableNote {
  return { hard_deleted: 0, scrubbed_nulled: 0, scrubbed_reassigned: 0, array_scrubbed: 0, warnings: [] }
}

function bump(notes: Record<string, TableNote>, table: string): TableNote {
  if (!notes[table]) notes[table] = newNote()
  return notes[table]
}

/** ANY match on `columns` deletes the whole row. Returns rows deleted. */
async function hardDeleteByColumns(table: string, columns: string[], childId: string): Promise<number> {
  if (columns.length === 0) return 0
  const orFilter = columns.map((c) => `${c}.eq.${childId}`).join(',')
  const { count } = await admin.from(table).select('id', { count: 'exact', head: true }).or(orFilter)
  if (!count) return 0
  const { error } = await admin.from(table).delete().or(orFilter)
  if (error) throw new Error(`${table} hard-delete failed: ${error.message}`)
  return count
}

/**
 * Null the column; on a not-null violation, REASSIGN to the family's
 * primary_parent (mom) instead. Returns {nulled, reassigned}.
 *
 * Deleting the row on a not-null violation (the original design) was found
 * live to be a real correctness bug: `tasks.created_by` is NOT NULL, so a
 * sibling's OWN task (assignee_id = sibling, created_by = the departing
 * child) was hard-deleted outright instead of scrubbed — destroying content
 * that unambiguously belongs to the surviving sibling, in direct violation
 * of the load-bearing sibling-preservation guarantee (caught by
 * tests/e2e/features/coppa-rights-lifecycle.spec.ts, 2026-08-24).
 * Reassigning authorship/actor-type columns (created_by, started_by,
 * acted_by, approved_by, etc. — the overwhelming majority of this
 * codebase's scrub-scalar columns) to mom is always safe: it never destroys
 * anyone else's data, and it still satisfies COPPA's actual requirement —
 * the departing child's id no longer appears anywhere on the row.
 */
async function scrubScalarColumn(table: string, column: string, childId: string, momMemberId: string): Promise<{ nulled: number; reassigned: number }> {
  const { count } = await admin.from(table).select('id', { count: 'exact', head: true }).eq(column, childId)
  if (!count) return { nulled: 0, reassigned: 0 }

  const { error: nullError } = await admin.from(table).update({ [column]: null }).eq(column, childId)
  if (!nullError) return { nulled: count, reassigned: 0 }

  if (nullError.code === NOT_NULL_VIOLATION) {
    const { error: reassignError } = await admin.from(table).update({ [column]: momMemberId }).eq(column, childId)
    if (reassignError) throw new Error(`${table}.${column} scrub-fallback reassign-to-mom failed: ${reassignError.message}`)
    return { nulled: 0, reassigned: count }
  }

  throw new Error(`${table}.${column} scrub failed: ${nullError.message}`)
}

/** array_remove(column, childId) via fetch-then-update (PostgREST has no array_remove update expression). */
async function scrubArrayColumn(table: string, column: string, childId: string): Promise<number> {
  const { data, error } = await admin.from(table).select(`id, ${column}`).contains(column, [childId])
  if (error) throw new Error(`${table}.${column} array-scrub read failed: ${error.message}`)
  if (!data || data.length === 0) return 0

  let touched = 0
  for (const row of data as Array<Record<string, unknown>>) {
    const current = (row[column] as string[] | null) ?? []
    const filtered = current.filter((v) => v !== childId)
    const { error: updateError } = await admin.from(table).update({ [column]: filtered }).eq('id', row.id as string)
    if (updateError) throw new Error(`${table}.${column} array-scrub update failed: ${updateError.message}`)
    touched++
  }
  return touched
}

async function processGenericTable(spec: (typeof CASCADE_PLAN)[number], childId: string, momMemberId: string, notes: Record<string, TableNote>) {
  const [schema, bareTable] = spec.table.includes('.') ? spec.table.split('.') : ['public', spec.table]
  if (schema !== 'public') return // platform_intelligence rows: governance-only, no per-family cascade target
  const note = bump(notes, bareTable)

  try {
    const deleted = await hardDeleteByColumns(bareTable, spec.hardDeleteColumns, childId)
    note.hard_deleted += deleted
  } catch (err) {
    note.warnings.push(err instanceof Error ? err.message : String(err))
  }

  for (const col of spec.scrubScalarColumns) {
    try {
      const { nulled, reassigned } = await scrubScalarColumn(bareTable, col, childId, momMemberId)
      note.scrubbed_nulled += nulled
      note.scrubbed_reassigned += reassigned
    } catch (err) {
      note.warnings.push(err instanceof Error ? err.message : String(err))
    }
  }

  for (const col of spec.scrubArrayColumns) {
    try {
      note.array_scrubbed += await scrubArrayColumn(bareTable, col, childId)
    } catch (err) {
      note.warnings.push(err instanceof Error ? err.message : String(err))
    }
  }
}

/** earned_prizes: hard-delete only when family_member_id = child (non-null). Family prizes (NULL) scrub only. */
async function processEarnedPrizes(childId: string, momMemberId: string, notes: Record<string, TableNote>) {
  const note = bump(notes, 'earned_prizes')
  try {
    const { count } = await admin.from('earned_prizes').select('id', { count: 'exact', head: true }).eq('family_member_id', childId)
    if (count) {
      const { error } = await admin.from('earned_prizes').delete().eq('family_member_id', childId)
      if (error) throw new Error(error.message)
      note.hard_deleted += count
    }
    const scrubbedCreated = await scrubScalarColumn('earned_prizes', 'created_by', childId, momMemberId)
    note.scrubbed_nulled += scrubbedCreated.nulled
    note.scrubbed_reassigned += scrubbedCreated.reassigned
    const scrubbedRedeemed = await scrubScalarColumn('earned_prizes', 'redeemed_by', childId, momMemberId)
    note.scrubbed_nulled += scrubbedRedeemed.nulled
    note.scrubbed_reassigned += scrubbedRedeemed.reassigned
    note.array_scrubbed += await scrubArrayColumn('earned_prizes', 'shared_with_member_ids', childId)
  } catch (err) {
    note.warnings.push(err instanceof Error ? err.message : String(err))
  }
}

/** contracts: hard-delete only when family_member_id = child (non-null). NULL = family-wide, never touched by hard-delete. */
async function processContracts(childId: string, momMemberId: string, notes: Record<string, TableNote>) {
  const note = bump(notes, 'contracts')
  try {
    const { count } = await admin.from('contracts').select('id', { count: 'exact', head: true }).eq('family_member_id', childId)
    if (count) {
      const { error } = await admin.from('contracts').delete().eq('family_member_id', childId)
      if (error) throw new Error(error.message)
      note.hard_deleted += count
    }
    const scrubbed = await scrubScalarColumn('contracts', 'created_by', childId, momMemberId)
    note.scrubbed_nulled += scrubbed.nulled
    note.scrubbed_reassigned += scrubbed.reassigned
  } catch (err) {
    note.warnings.push(err instanceof Error ? err.message : String(err))
  }
}

/** Parses the storage bucket + object path out of a Supabase public Storage URL. Returns null if unrecognized. */
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  const marker = '/storage/v1/object/public/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const rest = url.slice(idx + marker.length)
  const slash = rest.indexOf('/')
  if (slash === -1) return null
  return { bucket: rest.slice(0, slash), path: decodeURIComponent(rest.slice(slash + 1)) }
}

async function runCascadeForChild(consentId: string, childMemberId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const notes: Record<string, TableNote> = {}
  const warnings: string[] = []

  const { data: child, error: childError } = await admin
    .from('family_members')
    .select('id, family_id, user_id, auth_method, avatar_url')
    .eq('id', childMemberId)
    .maybeSingle()

  if (childError) return { ok: false, error: `child lookup failed: ${childError.message}` }

  if (!child) {
    // Row already gone (e.g. a prior partial run). Mark the consent complete
    // with a note rather than retrying forever against a nonexistent target.
    await admin.from('coppa_consents').update({
      deletion_completed_at: new Date().toISOString(),
      deletion_completion_notes: { note: 'family_members row was already absent when the cascade ran.' },
    }).eq('id', consentId)
    return { ok: true }
  }

  const familyId = child.family_id as string

  // Mom's member id — the reassignment target for scrub columns that can't
  // be nulled (a NOT NULL authorship/actor column). Resolved once per child;
  // falls back to a warning (columns stay un-reassigned, logged) rather than
  // aborting the whole cascade if a family somehow has no primary_parent row.
  const { data: momRow, error: momError } = await admin
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('role', 'primary_parent')
    .maybeSingle()
  if (momError || !momRow) {
    return { ok: false, error: `could not resolve primary_parent for family ${familyId} (required as the scrub-fallback reassignment target): ${momError?.message ?? 'no primary_parent row'}` }
  }
  const momMemberId = momRow.id as string

  // ── Pre-pass: capture active goals this child's contributions will affect,
  //    BEFORE the generic walk deletes family_goal_contributions rows. ────
  let affectedActiveGoalIds: string[] = []
  try {
    const { data: contribRows } = await admin
      .from('family_goal_contributions')
      .select('goal_id')
      .eq('member_id', childMemberId)
    const goalIds = [...new Set((contribRows ?? []).map((r) => r.goal_id as string))]
    if (goalIds.length > 0) {
      const { data: activeGoals } = await admin
        .from('family_goals')
        .select('id')
        .in('id', goalIds)
        .eq('status', 'active')
      affectedActiveGoalIds = (activeGoals ?? []).map((g) => g.id as string)
    }
  } catch (err) {
    warnings.push(`family_goals pre-pass: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── Generic registry walk ──
  for (const spec of CASCADE_PLAN) {
    await processGenericTable(spec, childMemberId, momMemberId, notes)
  }

  // ── Bespoke SPECIAL_TABLES ──
  await processEarnedPrizes(childMemberId, momMemberId, notes)
  await processContracts(childMemberId, momMemberId, notes)

  // ── Recompute active family goals touched by this child's now-deleted
  //    contributions (Convention #278 — never re-award, just re-derive
  //    current_progress off the surviving contribution rows). ──────────
  for (const goalId of affectedActiveGoalIds) {
    try {
      await admin.rpc('evaluate_family_goal_award', { p_goal_id: goalId })
    } catch (err) {
      warnings.push(`family_goals recompute (${goalId}): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ── Avatar Storage cleanup (best-effort) ──
  if (child.avatar_url) {
    const parsed = parseStorageUrl(child.avatar_url as string)
    if (parsed) {
      try {
        await admin.storage.from(parsed.bucket).remove([parsed.path])
      } catch (err) {
        warnings.push(`avatar storage cleanup: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  // ── retention_deletion_log: one row per table actually touched. MUST be
  //    written BEFORE the family_members row delete below — its
  //    child_member_id column is an FK to family_members(id) and Postgres
  //    validates that reference at INSERT time regardless of the FK's ON
  //    DELETE action (migration 100326 makes surviving rows go to NULL when
  //    the referenced row is later deleted, but a brand-new INSERT still
  //    requires the referenced row to exist right now). row_count is rows
  //    genuinely DELETED (PRD schema: "how many rows were deleted in this
  //    job run") — scrub reassignment/nulling/array-removal edits a
  //    surviving row rather than deleting it, so those counts live only in
  //    deletion_completion_notes.tables, not in this audit table's count. ──
  const jobRunId = crypto.randomUUID()
  const logRows = Object.entries(notes)
    .filter(([, note]) => note.hard_deleted + note.scrubbed_nulled + note.scrubbed_reassigned + note.array_scrubbed > 0)
    .map(([table, note]) => ({
      family_id: familyId,
      child_member_id: childMemberId,
      source_table: table,
      deletion_trigger: 'consent_revocation',
      row_count: note.hard_deleted,
      job_run_id: jobRunId,
    }))
  if (logRows.length > 0) {
    const { error: logError } = await admin.from('retention_deletion_log').insert(logRows)
    if (logError) warnings.push(`retention_deletion_log insert: ${logError.message}`)
  }

  // ── Mark the consent row complete — ALSO before the family_members row
  //    delete, for the same reason (belt-and-suspenders; migration 100326's
  //    ON DELETE SET NULL means this would still work if done after, but
  //    grouping all record-keeping before the actual member removal keeps
  //    the ordering easy to reason about). ─────────────────────────────
  const allWarnings = [...warnings, ...Object.values(notes).flatMap((n) => n.warnings)]
  const { error: completeError } = await admin
    .from('coppa_consents')
    .update({
      deletion_completed_at: new Date().toISOString(),
      deletion_completion_notes: { job_run_id: jobRunId, tables: notes, warnings: allWarnings },
    })
    .eq('id', consentId)
  if (completeError) return { ok: false, error: `could not mark deletion_completed_at: ${completeError.message}` }

  // ── family_members row itself, LAST — after every other write that
  //    needed it to still exist (retention_deletion_log insert's FK check,
  //    and simply because "remove the member" is the final step of "their
  //    data is gone"). Migration 100326 makes coppa_consents and
  //    retention_deletion_log survive this delete (ON DELETE SET NULL,
  //    not CASCADE) — found live, 2026-08-24: the ORIGINAL schema had both
  //    as ON DELETE CASCADE, which silently destroyed the very audit rows
  //    this function had just written, the moment this DELETE ran. See
  //    migration 100326's own comment for the full account. ─────────────
  const { error: memberDeleteError } = await admin.from('family_members').delete().eq('id', childMemberId)
  if (memberDeleteError) {
    warnings.push(`family_members row delete: ${memberDeleteError.message}`)
  }

  // ── Two-door shadow-account teardown (addendum §(b)). auth_method IN
  //    ('pin','visual_password') means user_id points to a shadow account
  //    this platform created — never an email-invited real account, which
  //    is 'full_login' and is intentionally left untouched (detach only,
  //    per addendum item 1). Both admin API calls return {error} rather
  //    than throwing — checked explicitly, not just try/caught. Ordering
  //    relative to the family_members delete does not matter for THIS
  //    step (soft-delete is a plain UPDATE on auth.users, not a delete that
  //    any FK could block either direction) — placed after purely to keep
  //    "remove the member" and "tear down their login" adjacent in the log.
  //
  //    KNOWN PLATFORM LIMITATION (found live, 2026-08-24): HARD delete
  //    (`deleteUser(id)` / `deleteUser(id, false)`) fails on this Supabase
  //    project for EVERY auth user tested — including a brand-new user with
  //    zero references anywhere, ruling out any FK/RLS cause in this
  //    codebase's own tables. GoTrue returns a generic 500
  //    "Database error deleting user" (unexpected_failure) with no further
  //    detail available from the client API. This is an infrastructure-
  //    level issue, not something an Edge Function can work around.
  //    SOFT delete (`deleteUser(id, true)`) succeeds cleanly and sets
  //    `deleted_at`, which — combined with the global sign-out immediately
  //    before it — makes the shadow account permanently unable to
  //    authenticate. This is the best achievable mitigation today: the
  //    consent copy's promise ("it's plumbing... it gets deleted with
  //    everything else if you ever revoke") is satisfied FUNCTIONALLY (the
  //    account can never be used again) but not LITERALLY (the auth.users
  //    row persists, soft-deleted) until the underlying platform issue is
  //    resolved. The shadow account's email is a synthetic
  //    `{member_id}@pin.myaimcentral.app` string carrying no real PII, and
  //    its password is an HMAC-derived secret, never the family's data —
  //    but this gap should be investigated with Supabase support (or via
  //    direct SQL against auth.users, which is out of an Edge Function's
  //    reach) before cohort-2 opens. Flagged prominently for founder
  //    review rather than silently treated as equivalent to "deleted."
  if (child.user_id && (child.auth_method === 'pin' || child.auth_method === 'visual_password')) {
    const signOutResult = await admin.auth.admin.signOut(child.user_id as string, 'global')
    if (signOutResult.error) warnings.push(`shadow account sign-out: ${signOutResult.error.message}`)

    const deleteResult = await admin.auth.admin.deleteUser(child.user_id as string, true)
    if (deleteResult.error) {
      warnings.push(`shadow account soft-delete: ${deleteResult.error.message}`)
    } else {
      warnings.push('shadow account SOFT-deleted (hard delete fails platform-wide on this project — known limitation, see code comment; sign-out + soft-delete prevents any future authentication)')
    }
  }

  // ── Notify mom (in-app; email lands once PRD-30 SM-C's sender exists — OD-3) ──
  try {
    const { data: parentRow } = await admin.from('family_members').select('id').eq('family_id', familyId).eq('role', 'primary_parent').maybeSingle()
    if (parentRow) {
      await admin.from('notifications').insert({
        family_id: familyId,
        recipient_member_id: parentRow.id,
        notification_type: 'coppa_deletion_completed',
        category: 'privacy',
        title: 'Deletion complete',
        body: 'The 14-day grace period has ended and the data has been permanently deleted, as you requested.',
        priority: 'normal',
      })
    }
  } catch { /* best-effort, never blocks completion */ }

  return { ok: true }
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: due, error: dueError } = await admin
    .from('coppa_consents')
    .select('id, child_member_id')
    .lte('scheduled_deletion_at', new Date().toISOString())
    .is('deletion_completed_at', null)
    .not('scheduled_deletion_at', 'is', null)

  if (dueError) {
    console.error('coppa-deletion-cascade: could not query due consents:', dueError.message)
    return new Response(JSON.stringify({ error: dueError.message }), { status: 500, headers: jsonHeaders })
  }

  const results: Array<{ consent_id: string; child_member_id: string; ok: boolean; error?: string }> = []

  for (const row of due ?? []) {
    try {
      const outcome = await runCascadeForChild(row.id as string, row.child_member_id as string)
      results.push({ consent_id: row.id as string, child_member_id: row.child_member_id as string, ok: outcome.ok, error: outcome.ok ? undefined : outcome.error })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`coppa-deletion-cascade: uncaught error for consent ${row.id}:`, message)
      results.push({ consent_id: row.id as string, child_member_id: row.child_member_id as string, ok: false, error: message })
    }
  }

  console.log(`coppa-deletion-cascade: processed ${results.length}, ${results.filter((r) => r.ok).length} succeeded`)
  return new Response(JSON.stringify({ processed: results.length, results }), { headers: jsonHeaders })
})
