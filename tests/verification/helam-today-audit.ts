import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const today = new Date().toISOString().slice(0, 10)
  console.log(`\n=== HELAM TODAY AUDIT (${today}) ===\n`)

  const { data: helam } = await sb
    .from('family_members')
    .select('id, display_name, family_id')
    .eq('display_name', 'Helam')
    .single()
  if (!helam) { console.log('Helam not found'); return }

  // Allowance config
  const { data: cfg } = await sb
    .from('allowance_configs')
    .select('weekly_amount, calculation_approach, grace_days_enabled, period_start_day')
    .eq('family_member_id', helam.id)
    .single()
  console.log(`Allowance config: $${cfg?.weekly_amount}/wk, ${cfg?.calculation_approach}, period_start=${cfg?.period_start_day}, grace_enabled=${cfg?.grace_days_enabled}`)

  // Active period
  const { data: period } = await sb
    .from('allowance_periods')
    .select('id, period_start, period_end, status, grace_days')
    .eq('family_member_id', helam.id)
    .in('status', ['active', 'makeup_window'])
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle()
  console.log(`Active period: ${period?.period_start} → ${period?.period_end}, status=${period?.status}`)
  console.log(`  grace_days: ${JSON.stringify(period?.grace_days)}`)

  // Tasks counted for allowance
  const { data: tasks } = await sb
    .from('tasks')
    .select('id, title, task_type, template_id, status, counts_for_allowance, is_extra_credit, created_at')
    .eq('assignee_id', helam.id)
    .eq('counts_for_allowance', true)
    .is('archived_at', null)
  console.log(`\nTasks counts_for_allowance=true: ${tasks?.length ?? 0}`)
  for (const t of tasks ?? []) {
    console.log(`  - "${t.title}" (${t.task_type}) status=${t.status} ec=${t.is_extra_credit} created=${t.created_at?.slice(0,10)}`)
  }

  // For each routine task, count today's scheduled steps
  console.log(`\nToday is ${today} — DOW=${new Date(today + 'T12:00:00Z').getUTCDay()} (0=Sun..6=Sat)`)
  for (const t of tasks ?? []) {
    if (t.task_type !== 'routine' || !t.template_id) continue
    const { data: sections } = await sb
      .from('task_template_sections')
      .select('id, section_name, frequency_days')
      .eq('template_id', t.template_id)
    let todayStepCount = 0
    const dow = String(new Date(today + 'T12:00:00Z').getUTCDay())
    for (const s of sections ?? []) {
      if (!(s.frequency_days as string[])?.includes(dow)) continue
      const { count } = await sb
        .from('task_template_steps')
        .select('id', { count: 'exact', head: true })
        .eq('section_id', s.id)
      todayStepCount += count ?? 0
    }
    console.log(`  "${t.title}": ${todayStepCount} steps scheduled for today`)
  }

  // Completions for today
  const { data: completions } = await sb
    .from('routine_step_completions')
    .select('id, task_id, step_id, period_date, completed_at')
    .eq('member_id', helam.id)
    .eq('period_date', today)
    .order('completed_at', { ascending: true })
  console.log(`\nrouting_step_completions for today: ${completions?.length ?? 0}`)
  // Show duplicates per (step_id, period_date) — bug indicator
  const stepCounts = new Map<string, number>()
  for (const c of completions ?? []) {
    stepCounts.set(c.step_id, (stepCounts.get(c.step_id) ?? 0) + 1)
  }
  const dupes = Array.from(stepCounts.entries()).filter(([, n]) => n > 1)
  console.log(`  unique steps: ${stepCounts.size}`)
  console.log(`  duplicate (step_id, today) groups: ${dupes.length}`)
  if (dupes.length > 0) {
    for (const [stepId, n] of dupes) console.log(`    step=${stepId} → ${n} rows`)
  }

  // Call RPC for today (1-day window)
  console.log(`\n=== RPC: today-only window ===`)
  const { data: todayRows } = await sb.rpc('calculate_allowance_progress', {
    p_member_id: helam.id,
    p_period_start: today,
    p_period_end: today,
    p_grace_days: period?.grace_days ?? null,
  })
  const t1 = todayRows?.[0]
  if (t1) {
    console.log(`  effective_assigned: ${t1.effective_tasks_assigned}`)
    console.log(`  effective_completed: ${t1.effective_tasks_completed}`)
    console.log(`  completion_percentage: ${t1.completion_percentage}%`)
    console.log(`  base_amount (uses weekly_amount!): $${t1.base_amount}`)
    console.log(`  calculated_amount: $${t1.calculated_amount}  ← this is what widget shows as "Earned"`)
    console.log(`  total_earned: $${t1.total_earned}`)
    console.log(`  raw_steps_completed: ${t1.raw_steps_completed}`)
    console.log(`  raw_steps_available: ${t1.raw_steps_available}`)
  }

  // Call RPC for full week window
  console.log(`\n=== RPC: full-week window ===`)
  const { data: weekRows } = await sb.rpc('calculate_allowance_progress', {
    p_member_id: helam.id,
    p_period_start: period?.period_start,
    p_period_end: period?.period_end,
    p_grace_days: period?.grace_days ?? null,
  })
  const w1 = weekRows?.[0]
  if (w1) {
    console.log(`  effective_assigned: ${w1.effective_tasks_assigned}`)
    console.log(`  effective_completed: ${w1.effective_tasks_completed}`)
    console.log(`  completion_percentage: ${w1.completion_percentage}%`)
    console.log(`  calculated_amount: $${w1.calculated_amount}`)
    console.log(`  total_earned: $${w1.total_earned}`)
    console.log(`  raw_steps_completed: ${w1.raw_steps_completed}`)
    console.log(`  raw_steps_available: ${w1.raw_steps_available}`)
  }

  console.log(`\n=== SANITY CHECK ===`)
  console.log(`Widget shows "Today" + "9 / 31 steps" + "30%" + "$5.10"`)
  console.log(`30% × $17/wk = $5.10 ✓ — that's the math`)
  console.log(`The "Earned" line in Today view is computing as 30% × FULL weekly amount.`)
  console.log(`That overstates today's $ if mom expects "what did kid earn just today"`)
  console.log(`(would be 30% × $17/7 = $0.73 instead).`)
}

main().catch(e => { console.error(e); process.exit(1) })
