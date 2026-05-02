/**
 * evaluate-deferred-contracts — Phase 3 Connector Architecture
 *
 * Cron-invoked Edge Function that evaluates deferred contracts:
 * - end_of_day: fires at midnight per family timezone
 * - end_of_week: fires at Sunday midnight per family timezone
 * - lifecycle sweep: moves recently_deleted → archived after 48h
 *
 * Convention #246 compliant: invoked via util.invoke_edge_function().
 * Deployed with --no-verify-jwt (cron-invoked, service role bearer).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RequestBody {
  sweep_type: 'end_of_week' | 'end_of_day_and_lifecycle'
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.includes(serviceRoleKey)) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
    }

    const body: RequestBody = await req.json()
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Load all families with their timezones
    const { data: families, error: famErr } = await supabase
      .from('families')
      .select('id, timezone')

    if (famErr || !families) {
      return new Response(JSON.stringify({ error: 'failed to load families', detail: famErr }), { status: 500 })
    }

    let totalProcessed = 0
    let totalGranted = 0
    let lifecycleCleaned = 0

    for (const family of families) {
      const tz = family.timezone || 'America/New_York'
      const now = new Date()
      const familyFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        hour12: false,
      })
      const familyHour = parseInt(familyFormatter.format(now), 10)

      if (body.sweep_type === 'end_of_day_and_lifecycle') {
        // End-of-day: only process families where it's midnight (hour 0)
        if (familyHour === 0) {
          const { data: pendingGrants } = await supabase
            .from('deferred_grants')
            .select('*')
            .eq('family_id', family.id)
            .eq('status', 'pending')
            .eq('stroke_of', 'end_of_day')

          if (pendingGrants && pendingGrants.length > 0) {
            for (const grant of pendingGrants) {
              // Dispatch the godmother for this deferred grant
              const { data: dispatchResult } = await supabase.rpc('dispatch_single_grant', {
                p_deferred_grant_id: grant.id,
              })

              if (dispatchResult?.status === 'granted') {
                totalGranted++
              }
              totalProcessed++
            }
          }
        }

        // Lifecycle sweep: recently_deleted → archived after 48h (runs every hour, all families)
        const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
        const { count } = await supabase
          .from('contracts')
          .update({ status: 'archived', archived_at: now.toISOString() })
          .eq('family_id', family.id)
          .eq('status', 'recently_deleted')
          .lte('deleted_at', cutoff)
          .select('id', { count: 'exact', head: true })

        lifecycleCleaned += count ?? 0
      }

      if (body.sweep_type === 'end_of_week') {
        // End-of-week: only process on Sunday at midnight
        const dayFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          weekday: 'long',
        })
        const familyDay = dayFormatter.format(now)
        if (familyDay === 'Sunday' && familyHour === 0) {
          const { data: pendingGrants } = await supabase
            .from('deferred_grants')
            .select('*')
            .eq('family_id', family.id)
            .eq('status', 'pending')
            .eq('stroke_of', 'end_of_week')

          if (pendingGrants && pendingGrants.length > 0) {
            for (const grant of pendingGrants) {
              const { data: dispatchResult } = await supabase.rpc('dispatch_single_grant', {
                p_deferred_grant_id: grant.id,
              })

              if (dispatchResult?.status === 'granted') {
                totalGranted++
              }
              totalProcessed++
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      sweep_type: body.sweep_type,
      families_checked: families.length,
      total_processed: totalProcessed,
      total_granted: totalGranted,
      lifecycle_cleaned: lifecycleCleaned,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
