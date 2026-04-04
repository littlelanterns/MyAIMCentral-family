/**
 * mindsweep-auto-sweep — PRD-17B Scheduled Auto-Sweep
 *
 * Called by pg_cron via pg_net. Checks each member's holding queue
 * and auto_sweep_time setting. If the current hour matches their
 * configured sweep time and they have unprocessed holding items,
 * triggers mindsweep-sort for those items.
 *
 * Runs every hour via pg_cron. Only processes members whose
 * auto_sweep_time hour matches the current hour in the family's timezone.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS
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

  try {
    // 1. Find all members with unprocessed holding items
    const { data: holdingGroups, error: holdingError } = await supabase
      .from('mindsweep_holding')
      .select('family_id, member_id')
      .is('processed_at', null)

    if (holdingError) throw holdingError
    if (!holdingGroups || holdingGroups.length === 0) {
      return new Response(JSON.stringify({ processed: 0, reason: 'no_pending_items' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Deduplicate member/family pairs
    const memberFamilyPairs = new Map<string, { familyId: string; memberId: string }>()
    for (const row of holdingGroups) {
      memberFamilyPairs.set(row.member_id, { familyId: row.family_id, memberId: row.member_id })
    }

    let processed = 0
    const skipped: string[] = []

    for (const { familyId, memberId } of memberFamilyPairs.values()) {
      // 2. Check member's auto_sweep_time vs current time in family timezone
      const { data: family } = await supabase
        .from('families')
        .select('timezone')
        .eq('id', familyId)
        .single()

      const timezone = family?.timezone || 'America/Chicago'
      const now = new Date()
      const currentHour = parseInt(
        new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: timezone }).format(now)
      )

      const { data: settings } = await supabase
        .from('mindsweep_settings')
        .select('auto_sweep_time')
        .eq('member_id', memberId)
        .maybeSingle()

      // Default sweep time is 20:00
      const sweepHour = settings?.auto_sweep_time
        ? parseInt(settings.auto_sweep_time.split(':')[0])
        : 20

      if (currentHour !== sweepHour) {
        skipped.push(memberId)
        continue
      }

      // 3. Get the actual holding items
      const { data: items } = await supabase
        .from('mindsweep_holding')
        .select('id, content, content_type')
        .eq('family_id', familyId)
        .eq('member_id', memberId)
        .is('processed_at', null)

      if (!items || items.length === 0) continue

      // 4. Get family member names for cross-member detection
      const { data: familyMembers } = await supabase
        .from('family_members')
        .select('id, display_name, nicknames')
        .eq('family_id', familyId)
        .eq('is_active', true)

      // 5. Get member settings for aggressiveness
      const { data: fullSettings } = await supabase
        .from('mindsweep_settings')
        .select('aggressiveness, always_review_rules, custom_review_rules')
        .eq('member_id', memberId)
        .maybeSingle()

      // 6. Call mindsweep-sort
      const { error: sortError } = await supabase.functions.invoke('mindsweep-sort', {
        body: {
          items: items.map(i => ({
            id: i.id,
            content: i.content,
            content_type: i.content_type || 'text',
          })),
          family_id: familyId,
          member_id: memberId,
          aggressiveness: fullSettings?.aggressiveness || 'always_ask',
          always_review_rules: fullSettings?.always_review_rules || ['emotional_children', 'relationship_dynamics', 'behavioral_notes', 'financial'],
          custom_review_rules: fullSettings?.custom_review_rules || [],
          source_channel: 'auto_sweep',
          input_type: 'mixed',
          family_member_names: (familyMembers || []).map(m => ({
            id: m.id,
            display_name: m.display_name,
            nicknames: m.nicknames || [],
          })),
        },
      })

      if (sortError) {
        console.error(`Auto-sweep failed for member ${memberId}:`, sortError)
        continue
      }

      // 7. Mark holding items as processed
      await supabase
        .from('mindsweep_holding')
        .update({ processed_at: new Date().toISOString() })
        .in('id', items.map(i => i.id))

      processed++
    }

    return new Response(JSON.stringify({
      processed,
      skipped: skipped.length,
      total_members_with_items: memberFamilyPairs.size,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Auto-sweep error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
