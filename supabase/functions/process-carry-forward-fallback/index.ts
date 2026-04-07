/**
 * process-carry-forward-fallback — PRD-18 Enhancement 5
 *
 * Called by pg_cron (migration 100110) via pg_net. Runs hourly at :05.
 * For each family, checks whether the current hour in the family's
 * local timezone is 0 (first hour of local midnight). If so, processes
 * every member of that family by reading their carry-forward fallback
 * preference and applying it to their overdue tasks.
 *
 * Fallback behaviors:
 *   stay          no-op. Task stays as-is (ADHD-friendly default).
 *   roll_forward  UPDATE due_date = CURRENT_DATE for tasks with
 *                 due_date < CURRENT_DATE AND status IN ('pending','in_progress').
 *   expire        UPDATE status = 'cancelled', archived_at = NOW() for
 *                 the same filter. Task disappears from active lists.
 *   backburner    For tasks overdue by more than `backburner_days`
 *                 (default 14), copy the title into the member's
 *                 backburner list and soft-delete the task. Reuses
 *                 the MindSweep pattern at useMindSweep.ts:382-410.
 *
 * Per-task override: if tasks.carry_forward_override IS NOT NULL,
 * use that value instead of the member default. Added in 100110.
 *
 * Backlog threshold prompt side effect: if a member has
 * ≥ carry_forward_backlog_threshold tasks older than 14 days, mark
 * the next pending evening rhythm_completions row with
 * metadata.backlog_prompt_pending=true. The evening rhythm reads this
 * flag and surfaces a gentle one-time sweep prompt. Enforced max
 * once-per-week via metadata.last_backlog_prompt_at.
 *
 * Auth: service role only. pg_net uses the service role key when it
 * calls this function, and we verify the Authorization header matches.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

type FallbackBehavior = 'stay' | 'roll_forward' | 'expire' | 'backburner'
type BacklogFrequency = 'weekly' | 'daily'

interface MemberPreferences {
  carry_forward_fallback?: FallbackBehavior
  carry_forward_backburner_days?: number
  carry_forward_backlog_threshold?: number
  carry_forward_backlog_prompt_max_frequency?: BacklogFrequency
}

const DEFAULTS: Required<MemberPreferences> = {
  carry_forward_fallback: 'stay',
  carry_forward_backburner_days: 14,
  carry_forward_backlog_threshold: 10,
  carry_forward_backlog_prompt_max_frequency: 'weekly',
}

interface TaskRow {
  id: string
  title: string
  due_date: string | null
  status: string
  carry_forward_override: FallbackBehavior | null
}

interface ProcessingStats {
  families_checked: number
  families_at_midnight: number
  members_processed: number
  tasks_rolled_forward: number
  tasks_expired: number
  tasks_backburnered: number
  members_with_backlog_prompt: number
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // Only accept POST (from pg_net)
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Verify service role authorization (pg_net uses service role key)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(serviceRoleKey)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const stats: ProcessingStats = {
    families_checked: 0,
    families_at_midnight: 0,
    members_processed: 0,
    tasks_rolled_forward: 0,
    tasks_expired: 0,
    tasks_backburnered: 0,
    members_with_backlog_prompt: 0,
  }

  try {
    // 1. Load all families with their timezones
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, timezone')

    if (familiesError) throw familiesError
    if (!families || families.length === 0) {
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    stats.families_checked = families.length
    const now = new Date()

    // 2. For each family, check if it's currently the first hour
    //    of local midnight (local hour === 0). Only process families
    //    whose local midnight falls inside this cron invocation.
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
      } catch (_err) {
        // Bad timezone value on this family row — skip, don't break
        continue
      }

      if (currentLocalHour !== 0) continue
      stats.families_at_midnight++

      // 3. Load this family's active members (excluding play kids
      //    since they don't have tasks and their fallback doesn't
      //    apply). Read preferences JSONB for fallback settings.
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('id, preferences, dashboard_mode')
        .eq('family_id', family.id)
        .eq('is_active', true)

      if (membersError) {
        console.error('[carry-forward] members load error', family.id, membersError)
        continue
      }
      if (!members) continue

      // Today's date string in the family's local timezone (YYYY-MM-DD).
      // We compare tasks.due_date (a DATE column, tz-agnostic) against
      // this local date. The cron fires at local midnight so "today"
      // is the date that just started in the family's timezone.
      const localDateStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone,
      }).format(now) // en-CA yields YYYY-MM-DD

      for (const member of members) {
        // Skip play kids (no task workflow)
        if (member.dashboard_mode === 'play') continue

        const prefs = (member.preferences ?? {}) as MemberPreferences
        const fallback =
          prefs.carry_forward_fallback ?? DEFAULTS.carry_forward_fallback
        const backburnerDays =
          prefs.carry_forward_backburner_days ?? DEFAULTS.carry_forward_backburner_days
        const backlogThreshold =
          prefs.carry_forward_backlog_threshold ?? DEFAULTS.carry_forward_backlog_threshold
        const backlogFrequency =
          prefs.carry_forward_backlog_prompt_max_frequency ??
          DEFAULTS.carry_forward_backlog_prompt_max_frequency

        stats.members_processed++

        // 4. Load overdue tasks assigned to this member
        const { data: overdueTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, due_date, status, carry_forward_override')
          .eq('family_id', family.id)
          .eq('assignee_id', member.id)
          .in('status', ['pending', 'in_progress'])
          .lt('due_date', localDateStr)
          .is('archived_at', null)

        if (tasksError) {
          console.error('[carry-forward] tasks load error', member.id, tasksError)
          continue
        }

        const tasks: TaskRow[] = (overdueTasks ?? []) as TaskRow[]

        // 5. Apply fallback behavior to each task. Per-task override
        //    takes precedence over member default.
        for (const task of tasks) {
          const effective: FallbackBehavior =
            task.carry_forward_override ?? fallback

          if (effective === 'stay') continue

          if (effective === 'roll_forward') {
            const { error } = await supabase
              .from('tasks')
              .update({ due_date: localDateStr })
              .eq('id', task.id)
            if (!error) stats.tasks_rolled_forward++
            continue
          }

          if (effective === 'expire') {
            const { error } = await supabase
              .from('tasks')
              .update({
                status: 'cancelled',
                archived_at: now.toISOString(),
              })
              .eq('id', task.id)
            if (!error) stats.tasks_expired++
            continue
          }

          if (effective === 'backburner') {
            // Only backburner tasks older than backburnerDays.
            // Newer overdue tasks stay on the list.
            if (!task.due_date) continue
            const ageDays = ageInDays(task.due_date, localDateStr)
            if (ageDays < backburnerDays) continue

            // Find or create the member's backburner list
            let { data: backburnerList } = await supabase
              .from('lists')
              .select('id')
              .eq('family_id', family.id)
              .eq('owner_id', member.id)
              .eq('list_type', 'backburner')
              .is('archived_at', null)
              .limit(1)
              .maybeSingle()

            if (!backburnerList) {
              const { data: created, error: createError } = await supabase
                .from('lists')
                .insert({
                  family_id: family.id,
                  owner_id: member.id,
                  title: 'Backburner',
                  list_type: 'backburner',
                })
                .select('id')
                .single()
              if (createError) {
                console.error('[carry-forward] backburner create error', member.id, createError)
                continue
              }
              backburnerList = created
            }

            if (!backburnerList) continue

            // Insert item
            const { error: insertError } = await supabase
              .from('list_items')
              .insert({
                list_id: backburnerList.id,
                content: task.title,
              })
            if (insertError) {
              console.error('[carry-forward] backburner insert error', task.id, insertError)
              continue
            }

            // Soft-delete the task
            const { error: deleteError } = await supabase
              .from('tasks')
              .update({
                status: 'cancelled',
                archived_at: now.toISOString(),
              })
              .eq('id', task.id)
            if (!deleteError) stats.tasks_backburnered++
          }
        }

        // 6. Backlog threshold prompt side effect. Count tasks older
        //    than 14 days still sitting in pending/in_progress.
        const backlogCutoffDate = addDays(localDateStr, -14)
        const { count: backlogCount } = await supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', family.id)
          .eq('assignee_id', member.id)
          .in('status', ['pending', 'in_progress'])
          .lt('due_date', backlogCutoffDate)
          .is('archived_at', null)

        if ((backlogCount ?? 0) < backlogThreshold) continue

        // Check when the last backlog prompt was shown to this member.
        // Read the most recent evening rhythm_completions for this
        // member. If metadata.last_backlog_prompt_at is within the
        // frequency window, skip. Otherwise mark the most recent
        // pending evening completion with backlog_prompt_pending=true.
        const minGapDays = backlogFrequency === 'daily' ? 1 : 7
        const gapThreshold = new Date(
          now.getTime() - minGapDays * 24 * 60 * 60 * 1000
        ).toISOString()

        const { data: recentEvenings } = await supabase
          .from('rhythm_completions')
          .select('id, status, metadata, completed_at')
          .eq('family_id', family.id)
          .eq('member_id', member.id)
          .eq('rhythm_key', 'evening')
          .order('created_at', { ascending: false })
          .limit(5)

        const shownRecently = (recentEvenings ?? []).some(row => {
          const last = (row.metadata as Record<string, unknown> | null)
            ?.last_backlog_prompt_at as string | undefined
          return last && last > gapThreshold
        })

        if (shownRecently) continue

        // Mark the most recent pending evening completion OR insert a
        // new pending row if none exists. The evening rhythm UI reads
        // this on open and surfaces the banner.
        const pending = (recentEvenings ?? []).find(r => r.status === 'pending')
        if (pending) {
          const { error: updateError } = await supabase
            .from('rhythm_completions')
            .update({
              metadata: {
                ...((pending.metadata as Record<string, unknown>) ?? {}),
                backlog_prompt_pending: true,
                backlog_prompt_task_count: backlogCount ?? 0,
              },
            })
            .eq('id', pending.id)
          if (!updateError) stats.members_with_backlog_prompt++
        } else {
          // Create a new pending evening completion for today's period.
          // Idempotent via the unique constraint; if one already
          // exists for today, fall through silently.
          const { error: insertError } = await supabase
            .from('rhythm_completions')
            .upsert(
              {
                family_id: family.id,
                member_id: member.id,
                rhythm_key: 'evening',
                period: localDateStr,
                status: 'pending',
                metadata: {
                  backlog_prompt_pending: true,
                  backlog_prompt_task_count: backlogCount ?? 0,
                },
              },
              { onConflict: 'family_id,member_id,rhythm_key,period' }
            )
          if (!insertError) stats.members_with_backlog_prompt++
        }
      }
    }

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[carry-forward] fatal error', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'unknown error',
        stats,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Difference in whole days between two YYYY-MM-DD strings.
 * Positive if `later` is after `earlier`.
 */
function ageInDays(earlier: string, later: string): number {
  const a = new Date(earlier + 'T00:00:00Z').getTime()
  const b = new Date(later + 'T00:00:00Z').getTime()
  return Math.floor((b - a) / (24 * 60 * 60 * 1000))
}

/**
 * Add N days to a YYYY-MM-DD string, returning YYYY-MM-DD.
 * N may be negative.
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
