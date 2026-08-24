// coppa-retention-rolling-sweep — PRD-40 Retention Policy, job 1 of 3.
//
// Cron-invoked daily (Convention #246), deployed --no-verify-jwt with the
// same in-code service-role bearer check as every other cron-invoked
// function in this codebase.
//
// Two independent rolling-retention sweeps, both scoped to CURRENTLY
// under_13 members (R-12: this is the platform's existing 90-day LiLa
// conversation policy, now scoped to apply regardless of consent status —
// it fires the moment a member's bracket backfills to under_13, per the
// decision file's explicit "flagged so it is not a surprise" ruling):
//
//   1. lila_conversations (+ their lila_messages) older than 90 days for
//      under-13 members — "conversation transcripts are not records of
//      record" (PRD retention table). Conversation created_at is the anchor
//      (messages "cascade with" their conversation per the PRD wording).
//   2. parental_data_exports rows whose downloaded_at is more than 90 days
//      in the past — the AUDIT ROW's own retention limit (PRD: "90 days
//      after download"), independent of the archive file's 7-day signed-URL
//      expiry (which Supabase Storage/the signed URL itself already enforces
//      — no server-side action needed for that part).
//
// Task-completion photo cleanup (180-day rolling) is a SEPARATE cron
// (coppa-storage-cleanup) per the PRD's "three scheduled jobs" structure.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const LILA_RETENTION_DAYS = 90
const EXPORT_LOG_RETENTION_DAYS = 90

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const summary = { lila_conversations_deleted: 0, lila_messages_deleted: 0, parental_data_exports_deleted: 0, warnings: [] as string[] }
  const jobRunId = crypto.randomUUID()

  try {
    const { data: under13, error: under13Error } = await admin
      .from('family_members')
      .select('id, family_id')
      .eq('coppa_age_bracket', 'under_13')
    if (under13Error) throw new Error(under13Error.message)

    const cutoff = new Date(Date.now() - LILA_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

    for (const member of under13 ?? []) {
      const { data: staleConvos, error: convoError } = await admin
        .from('lila_conversations')
        .select('id')
        .eq('member_id', member.id)
        .lt('created_at', cutoff)
      if (convoError) {
        summary.warnings.push(`lila_conversations lookup for ${member.id}: ${convoError.message}`)
        continue
      }
      if (!staleConvos || staleConvos.length === 0) continue

      const convoIds = staleConvos.map((c) => c.id as string)

      const { count: msgCount, error: msgCountError } = await admin
        .from('lila_messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', convoIds)
      if (msgCountError) summary.warnings.push(`lila_messages count for ${member.id}: ${msgCountError.message}`)

      const { error: msgDeleteError } = await admin.from('lila_messages').delete().in('conversation_id', convoIds)
      if (msgDeleteError) {
        summary.warnings.push(`lila_messages delete for ${member.id}: ${msgDeleteError.message}`)
        continue
      }
      summary.lila_messages_deleted += msgCount ?? 0

      const { error: convoDeleteError } = await admin.from('lila_conversations').delete().in('id', convoIds)
      if (convoDeleteError) {
        summary.warnings.push(`lila_conversations delete for ${member.id}: ${convoDeleteError.message}`)
        continue
      }
      summary.lila_conversations_deleted += convoIds.length

      await admin.from('retention_deletion_log').insert({
        family_id: member.family_id,
        child_member_id: member.id,
        source_table: 'lila_conversations',
        deletion_trigger: 'rolling_retention',
        row_count: convoIds.length,
        job_run_id: jobRunId,
      })
    }
  } catch (err) {
    summary.warnings.push(`lila sweep: ${err instanceof Error ? err.message : String(err)}`)
  }

  try {
    const exportCutoff = new Date(Date.now() - EXPORT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { data: staleExports, error: staleError } = await admin
      .from('parental_data_exports')
      .select('id, family_id, child_member_id')
      .not('downloaded_at', 'is', null)
      .lt('downloaded_at', exportCutoff)
    if (staleError) throw new Error(staleError.message)

    if (staleExports && staleExports.length > 0) {
      const { error: deleteError } = await admin.from('parental_data_exports').delete().in('id', staleExports.map((e) => e.id))
      if (deleteError) throw new Error(deleteError.message)
      summary.parental_data_exports_deleted = staleExports.length

      const byFamily = new Map<string, { familyId: string; childId: string; count: number }>()
      for (const row of staleExports) {
        const key = `${row.family_id}:${row.child_member_id}`
        const existing = byFamily.get(key)
        if (existing) existing.count++
        else byFamily.set(key, { familyId: row.family_id as string, childId: row.child_member_id as string, count: 1 })
      }
      const logRows = [...byFamily.values()].map((v) => ({
        family_id: v.familyId,
        child_member_id: v.childId,
        source_table: 'parental_data_exports',
        deletion_trigger: 'rolling_retention',
        row_count: v.count,
        job_run_id: jobRunId,
      }))
      if (logRows.length > 0) await admin.from('retention_deletion_log').insert(logRows)
    }
  } catch (err) {
    summary.warnings.push(`parental_data_exports sweep: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (summary.warnings.length > 0) {
    console.error('coppa-retention-rolling-sweep warnings:', JSON.stringify(summary.warnings))
  }
  console.log(`coppa-retention-rolling-sweep: ${JSON.stringify({ ...summary, warnings: undefined })}`)
  return new Response(JSON.stringify(summary), { headers: jsonHeaders })
})
