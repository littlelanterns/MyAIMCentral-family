import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { todayLocalIso } from '@/utils/dates'
loadEnv({ path: '.env.local' })
const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

async function main() {
  const today = todayLocalIso()
  const dowToday = new Date(today + 'T12:00:00Z').getUTCDay()
  console.log(`\n=== MOSIAH ROUTINE VISIBILITY AUDIT — today is ${today} (${DAYS[dowToday]}) ===\n`)

  const { data: mosiah } = await sb
    .from('family_members')
    .select('id, display_name, family_id')
    .eq('display_name', 'Mosiah')
    .single()
  if (!mosiah) { console.log('Mosiah not found'); return }

  // All routines counts_for_allowance + general routines
  const { data: tasks } = await sb
    .from('tasks')
    .select('id, title, task_type, template_id, status, counts_for_allowance')
    .eq('assignee_id', mosiah.id)
    .eq('task_type', 'routine')
    .is('archived_at', null)
  console.log(`Routine tasks: ${tasks?.length ?? 0}`)
  for (const t of tasks ?? []) {
    console.log(`\n--- "${t.title}" (status=${t.status}, counts_for_allowance=${t.counts_for_allowance}) ---`)

    // Sections
    const { data: sections } = await sb
      .from('task_template_sections')
      .select('id, section_name, frequency_rule, frequency_days, show_until_complete')
      .eq('template_id', t.template_id)
      .order('sort_order')
    console.log(`  ${sections?.length ?? 0} sections:`)
    for (const s of sections ?? []) {
      const dayLabels = (s.frequency_days as string[]).map(d => DAYS[Number(d)]).join(', ')
      const stays = s.show_until_complete ? 'STAYS until complete' : 'cleared at end of day'
      console.log(`    "${s.section_name}" — ${s.frequency_rule} [${dayLabels}] — ${stays}`)
    }

    // Period
    const { data: period } = await sb
      .from('allowance_periods')
      .select('period_start, period_end, grace_days')
      .eq('family_member_id', mosiah.id)
      .in('status', ['active', 'makeup_window'])
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!period) continue

    // Daily breakdown
    console.log(`  Period: ${period.period_start} → ${period.period_end}`)
    const start = new Date(period.period_start + 'T12:00:00Z')
    const end = new Date(period.period_end + 'T12:00:00Z')
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      // eslint-disable-next-line no-restricted-syntax -- d is explicitly UTC-constructed via 'T12:00:00Z' + setUTCDate; UTC slice is correct here
      const iso = d.toISOString().slice(0, 10)
      const dow = d.getUTCDay()
      const isFuture = iso > today
      // Steps scheduled this dow
      let scheduledSteps = 0
      const sectionsWithSteps: Array<{ name: string; count: number }> = []
      for (const s of sections ?? []) {
        if (!(s.frequency_days as string[]).includes(String(dow))) continue
        const { count } = await sb
          .from('task_template_steps')
          .select('id', { count: 'exact', head: true })
          .eq('section_id', s.id)
        sectionsWithSteps.push({ name: s.section_name as string, count: count ?? 0 })
        scheduledSteps += count ?? 0
      }
      // Completions for this date
      const { data: completions } = await sb
        .from('routine_step_completions')
        .select('step_id')
        .eq('task_id', t.id)
        .eq('member_id', mosiah.id)
        .eq('period_date', iso)
      const uniqueCompleted = new Set((completions ?? []).map(c => c.step_id)).size
      const flag = isFuture ? '(future)' : iso === today ? '(TODAY)' : '(past)'
      console.log(`    ${iso} ${DAYS[dow]} ${flag} — ${uniqueCompleted}/${scheduledSteps} done [${sectionsWithSteps.map(s => `${s.name}:${s.count}`).join(' / ')}]`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
