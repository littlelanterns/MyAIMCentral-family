/**
 * fire-painted-schedules — Worker 5 (Painter / Universal Scheduler Upgrade)
 *
 * Called by pg_cron hourly at :20 via util.invoke_edge_function.
 * For each family, checks whether the current hour in the family's
 * local timezone matches a painted schedule's firing window. If so,
 * writes deed_firings rows for each painted date that arrived today.
 *
 * Firing rules:
 *   - If active_start_time is set: fire when local hour === start hour
 *   - If no active_start_time: fire at local midnight (hour === 0)
 *   - One firing per assignee on each painted date
 *   - Idempotency key prevents double-firing from hourly re-runs
 *
 * Sources checked:
 *   - tasks.recurrence_details where schedule_type = 'painted'
 *   - lists.schedule_config where schedule_type = 'painted'
 *
 * Deed firings use source_type = 'scheduled_occurrence_active'
 * (verb-form locked per Coordination Brief §2.10).
 *
 * Auth: service role only. Deployed with --no-verify-jwt per
 * Convention #246 (cron-invoked functions).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ScheduleConfig {
  schedule_type?: string
  rdates?: string[]
  exdates?: string[]
  assignee_map?: Record<string, string[]> | null
  active_start_time?: string | null
  active_end_time?: string | null
  instantiation_mode?: string | null
}

interface PaintedSource {
  id: string
  family_id: string
  source_table: 'tasks' | 'lists'
  schedule: ScheduleConfig
  assignee_id?: string | null
}

interface ProcessingStats {
  families_checked: number
  families_processed: number
  sources_found: number
  firings_written: number
  firings_skipped_idempotent: number
  errors: string[]
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(serviceRoleKey)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const stats: ProcessingStats = {
    families_checked: 0,
    families_processed: 0,
    sources_found: 0,
    firings_written: 0,
    firings_skipped_idempotent: 0,
    errors: [],
  }

  try {
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, timezone')

    if (familiesError) throw familiesError
    if (!families?.length) {
      return jsonResponse(stats)
    }

    stats.families_checked = families.length
    const now = new Date()

    for (const family of families) {
      const timezone = family.timezone || 'America/Chicago'

      let currentLocalHour: number
      try {
        currentLocalHour = parseInt(
          new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: timezone,
          }).format(now)
        )
      } catch {
        continue
      }

      const localDateStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone,
      }).format(now)

      const sources = await loadPaintedSources(supabase, family.id)
      if (sources.length === 0) continue

      const sourcesToFire = sources.filter(src => {
        const startTime = src.schedule.active_start_time
        if (startTime) {
          const startHour = parseInt(startTime.split(':')[0])
          return currentLocalHour === startHour
        }
        return currentLocalHour === 0
      })

      if (sourcesToFire.length === 0) continue

      stats.families_processed++

      for (const src of sourcesToFire) {
        const schedule = src.schedule
        const rdates = schedule.rdates ?? []
        const exdates = schedule.exdates ?? []

        if (!rdates.includes(localDateStr)) continue
        if (exdates.includes(localDateStr)) continue

        stats.sources_found++

        const assigneeIds = resolveAssignees(
          schedule,
          localDateStr,
          src.assignee_id,
        )

        for (const memberId of assigneeIds) {
          const idempotencyKey = `scheduled_occurrence_active:${src.id}:${memberId ?? 'family'}:${localDateStr}`

          const { error: insertError } = await supabase
            .from('deed_firings')
            .insert({
              family_id: family.id,
              family_member_id: memberId,
              source_type: 'scheduled_occurrence_active',
              source_id: src.id,
              fired_at: now.toISOString(),
              idempotency_key: idempotencyKey,
              metadata: {
                painted_date: localDateStr,
                source_table: src.source_table,
                active_start_time: schedule.active_start_time ?? null,
                active_end_time: schedule.active_end_time ?? null,
                instantiation_mode: schedule.instantiation_mode ?? null,
                schedule_type: 'painted',
              },
            })

          if (insertError) {
            if (insertError.code === '23505') {
              stats.firings_skipped_idempotent++
            } else {
              stats.errors.push(
                `${src.source_table}:${src.id}:${memberId}: ${insertError.message}`
              )
            }
          } else {
            stats.firings_written++
          }
        }
      }
    }
  } catch (err) {
    stats.errors.push(`top-level: ${(err as Error).message}`)
    return jsonResponse(stats, 500)
  }

  return jsonResponse(stats)
})

async function loadPaintedSources(
  supabase: ReturnType<typeof createClient>,
  familyId: string,
): Promise<PaintedSource[]> {
  const sources: PaintedSource[] = []

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, family_id, assignee_id, recurrence_details')
    .eq('family_id', familyId)
    .is('archived_at', null)
    .not('recurrence_details', 'is', null)

  if (tasks) {
    for (const task of tasks) {
      const rd = task.recurrence_details as ScheduleConfig | null
      if (rd?.schedule_type === 'painted') {
        sources.push({
          id: task.id,
          family_id: task.family_id,
          source_table: 'tasks',
          schedule: rd,
          assignee_id: task.assignee_id,
        })
      }
    }
  }

  const { data: lists } = await supabase
    .from('lists')
    .select('id, family_id, schedule_config')
    .eq('family_id', familyId)
    .is('archived_at', null)
    .not('schedule_config', 'is', null)

  if (lists) {
    for (const list of lists) {
      const sc = list.schedule_config as ScheduleConfig | null
      if (sc?.schedule_type === 'painted') {
        sources.push({
          id: list.id,
          family_id: list.family_id,
          source_table: 'lists',
          schedule: sc,
          assignee_id: null,
        })
      }
    }
  }

  return sources
}

function resolveAssignees(
  schedule: ScheduleConfig,
  dateIso: string,
  taskAssigneeId: string | null,
): (string | null)[] {
  const assigneeMap = schedule.assignee_map
  if (assigneeMap && assigneeMap[dateIso]?.length) {
    return assigneeMap[dateIso]
  }

  if (taskAssigneeId) {
    return [taskAssigneeId]
  }

  return [null]
}

function jsonResponse(data: ProcessingStats, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
