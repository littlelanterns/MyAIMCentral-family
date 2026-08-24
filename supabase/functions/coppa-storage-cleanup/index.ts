// coppa-storage-cleanup — PRD-40 Retention Policy, job 3 of 3.
//
// Cron-invoked daily (Convention #246), deployed --no-verify-jwt, same
// in-code service-role bearer check as every other cron-invoked function.
//
// Task-completion photos: "180 days rolling, auto-delete" for under-13
// members (PRD Retention Policy table) — only the STORAGE BLOB is deleted;
// the task_completions/routine_step_completions row itself is retained
// (task history, streaks, and victory tracking depend on the completion
// record surviving — only the photo's higher privacy risk is time-boxed).
// The PRD names task_completions specifically; this extends to the parallel
// routine_step_completions.photo_url column too (same feature class, same
// privacy shape — a photo attached to a completion record) rather than
// leaving one half of the pair unretired.
//
// The bucket name is deliberately NOT hardcoded — photo_url is parsed for
// its Supabase Storage public-URL shape (/storage/v1/object/public/{bucket}/
// {path}) at cleanup time, so this job stays correct regardless of which
// bucket a given photo upload flow used.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const PHOTO_RETENTION_DAYS = 180

function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  const marker = '/storage/v1/object/public/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const rest = url.slice(idx + marker.length)
  const slash = rest.indexOf('/')
  if (slash === -1) return null
  return { bucket: rest.slice(0, slash), path: decodeURIComponent(rest.slice(slash + 1)) }
}

/**
 * Resolves matching rows via TWO plain queries (under-13 member ids, then
 * table rows filtered by those ids) rather than a PostgREST embed. Both
 * task_completions and routine_step_completions carry MULTIPLE foreign keys
 * to family_members (family_member_id AND member_id), which makes an
 * implicit `family_members!inner(...)` embed ambiguous — PostgREST cannot
 * infer which FK to join on and errors with "more than one relationship was
 * found" (caught live during deploy smoke-testing, 2026-08-24). Resolving
 * the member-id set separately sidesteps the ambiguity entirely and needs
 * no per-table FK-constraint-name hint.
 */
async function sweepTable(
  table: 'task_completions' | 'routine_step_completions',
  dateColumn: string,
  under13MemberIds: Map<string, string>, // member id -> family id
  jobRunId: string,
  warnings: string[],
): Promise<number> {
  if (under13MemberIds.size === 0) return 0
  const cutoff = new Date(Date.now() - PHOTO_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: rows, error } = await admin
    .from(table)
    .select(`id, family_member_id, photo_url, ${dateColumn}`)
    .not('photo_url', 'is', null)
    .lt(dateColumn, cutoff)
    .in('family_member_id', [...under13MemberIds.keys()])

  if (error) {
    warnings.push(`${table} lookup: ${error.message}`)
    return 0
  }
  if (!rows || rows.length === 0) return 0

  let cleaned = 0
  const byFamilyChild = new Map<string, { familyId: string; childId: string; count: number }>()

  for (const row of rows as Array<Record<string, unknown>>) {
    const photoUrl = row.photo_url as string
    const parsed = parseStorageUrl(photoUrl)
    if (parsed) {
      const { error: removeError } = await admin.storage.from(parsed.bucket).remove([parsed.path])
      if (removeError) {
        warnings.push(`${table} storage remove (${row.id}): ${removeError.message}`)
        continue
      }
    }
    const { error: updateError } = await admin.from(table).update({ photo_url: null }).eq('id', row.id as string)
    if (updateError) {
      warnings.push(`${table} photo_url null (${row.id}): ${updateError.message}`)
      continue
    }
    cleaned++
    const familyId = under13MemberIds.get(row.family_member_id as string)
    if (familyId) {
      const key = `${familyId}:${row.family_member_id}`
      const existing = byFamilyChild.get(key)
      if (existing) existing.count++
      else byFamilyChild.set(key, { familyId, childId: row.family_member_id as string, count: 1 })
    }
  }

  const logRows = [...byFamilyChild.values()].map((v) => ({
    family_id: v.familyId,
    child_member_id: v.childId,
    source_table: table,
    deletion_trigger: 'storage_cleanup',
    row_count: v.count,
    job_run_id: jobRunId,
  }))
  if (logRows.length > 0) {
    const { error: logError } = await admin.from('retention_deletion_log').insert(logRows)
    if (logError) warnings.push(`retention_deletion_log insert for ${table}: ${logError.message}`)
  }

  return cleaned
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const jobRunId = crypto.randomUUID()
  const warnings: string[] = []

  const { data: under13, error: under13Error } = await admin
    .from('family_members')
    .select('id, family_id')
    .eq('coppa_age_bracket', 'under_13')
  if (under13Error) {
    return new Response(JSON.stringify({ error: under13Error.message }), { status: 500, headers: jsonHeaders })
  }
  const under13MemberIds = new Map((under13 ?? []).map((m) => [m.id as string, m.family_id as string]))

  const taskPhotosCleaned = await sweepTable('task_completions', 'completed_at', under13MemberIds, jobRunId, warnings)
  const routinePhotosCleaned = await sweepTable('routine_step_completions', 'completed_at', under13MemberIds, jobRunId, warnings)

  const summary = { task_completions_photos_cleaned: taskPhotosCleaned, routine_step_completions_photos_cleaned: routinePhotosCleaned, warnings }
  if (warnings.length > 0) console.error('coppa-storage-cleanup warnings:', JSON.stringify(warnings))
  console.log(`coppa-storage-cleanup: ${JSON.stringify({ ...summary, warnings: undefined })}`)
  return new Response(JSON.stringify(summary), { headers: jsonHeaders })
})
