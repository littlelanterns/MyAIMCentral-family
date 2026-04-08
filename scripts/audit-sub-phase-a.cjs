/**
 * Sub-phase A audit — verify every deliverable actually works.
 * Fast read-only sanity checks against the live DB.
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function check(label, fn) {
  try {
    const result = await fn()
    const ok = result.ok
    const detail = result.detail || ''
    console.log((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' — ' + detail : ''))
    return ok
  } catch (e) {
    console.log('FAIL ' + label + ' — threw: ' + e.message)
    return false
  }
}

async function main() {
  console.log('=== Sub-phase A Audit ===\n')

  await check('gamification_themes has Woodland Felt with both reveal videos', async () => {
    const { data } = await sb
      .from('gamification_themes')
      .select('theme_slug, creature_reveal_video_url, page_reveal_video_url')
      .eq('theme_slug', 'woodland_felt')
      .single()
    if (!data) return { ok: false, detail: 'row missing' }
    const ok = !!(data.creature_reveal_video_url && data.page_reveal_video_url)
    return { ok, detail: ok ? 'row + both URLs present' : 'missing URL(s)' }
  })

  await check('gamification_creatures seeded (expected 161)', async () => {
    const { data } = await sb.from('gamification_creatures').select('id, rarity')
    const total = data ? data.length : 0
    const byRarity = { common: 0, rare: 0, legendary: 0 }
    for (const r of data || []) byRarity[r.rarity]++
    return {
      ok: total === 161,
      detail: total + ' rows (' + byRarity.common + 'c/' + byRarity.rare + 'r/' + byRarity.legendary + 'l)',
    }
  })

  await check('gamification_sticker_pages seeded (expected 26)', async () => {
    const { count } = await sb
      .from('gamification_sticker_pages')
      .select('id', { count: 'exact', head: true })
    return { ok: count === 26, detail: count + ' rows' }
  })

  await check('gamification_creatures — all image URLs reachable', async () => {
    const { data } = await sb.from('gamification_creatures').select('slug, image_url')
    const broken = []
    for (const row of data || []) {
      if (!row.image_url) {
        broken.push(row.slug + ': NULL')
        continue
      }
      try {
        const res = await fetch(row.image_url, { method: 'HEAD' })
        if (res.status !== 200) broken.push(row.slug + ': HTTP ' + res.status)
      } catch (e) {
        broken.push(row.slug + ': ' + e.message)
      }
    }
    return {
      ok: broken.length === 0,
      detail:
        broken.length === 0
          ? 'all ' + (data ? data.length : 0) + ' reachable'
          : broken.length + ' broken: ' + broken.slice(0, 5).join(', ') + (broken.length > 5 ? '...' : ''),
    }
  })

  await check('gamification_sticker_pages — all image URLs reachable', async () => {
    const { data } = await sb.from('gamification_sticker_pages').select('slug, image_url')
    const broken = []
    for (const row of data || []) {
      if (!row.image_url) {
        broken.push(row.slug + ': NULL')
        continue
      }
      try {
        const res = await fetch(row.image_url, { method: 'HEAD' })
        if (res.status !== 200) broken.push(row.slug + ': HTTP ' + res.status)
      } catch (e) {
        broken.push(row.slug + ': ' + e.message)
      }
    }
    return {
      ok: broken.length === 0,
      detail:
        broken.length === 0
          ? 'all ' + (data ? data.length : 0) + ' reachable'
          : broken.length + ' broken: ' + broken.slice(0, 5).join(', ') + (broken.length > 5 ? '...' : ''),
    }
  })

  await check('gamification_themes reveal videos — both URLs reachable', async () => {
    const { data } = await sb
      .from('gamification_themes')
      .select('creature_reveal_video_url, page_reveal_video_url')
      .single()
    const urls = [data.creature_reveal_video_url, data.page_reveal_video_url]
    const broken = []
    for (const url of urls) {
      try {
        const res = await fetch(url, { method: 'HEAD' })
        if (res.status !== 200) broken.push(url.slice(-50) + ': HTTP ' + res.status)
      } catch (e) {
        broken.push(e.message)
      }
    }
    return { ok: broken.length === 0, detail: broken.length === 0 ? 'both reachable' : broken.join(' | ') }
  })

  await check('Every active Play member has gamification_configs', async () => {
    const { data: members } = await sb
      .from('family_members')
      .select('id, display_name')
      .eq('dashboard_mode', 'play')
      .eq('is_active', true)
    const { data: configs } = await sb
      .from('gamification_configs')
      .select('family_member_id')
      .in('family_member_id', members.map(m => m.id))
    const configured = new Set(configs.map(c => c.family_member_id))
    const missing = members.filter(m => !configured.has(m.id))
    return {
      ok: missing.length === 0,
      detail:
        members.length +
        ' Play members, ' +
        configured.size +
        ' configured' +
        (missing.length ? ', missing: ' + missing.map(m => m.display_name).join(', ') : ''),
    }
  })

  await check('Every active Play member has member_sticker_book_state', async () => {
    const { data: members } = await sb
      .from('family_members')
      .select('id, display_name')
      .eq('dashboard_mode', 'play')
      .eq('is_active', true)
    const { data: states } = await sb
      .from('member_sticker_book_state')
      .select('family_member_id')
      .in('family_member_id', members.map(m => m.id))
    const covered = new Set(states.map(s => s.family_member_id))
    const missing = members.filter(m => !covered.has(m.id))
    return {
      ok: missing.length === 0,
      detail:
        members.length +
        ' members, ' +
        covered.size +
        ' covered' +
        (missing.length ? ', missing: ' + missing.map(m => m.display_name).join(', ') : ''),
    }
  })

  await check('Every Play member has a bootstrap member_page_unlocks row', async () => {
    const { data: members } = await sb
      .from('family_members')
      .select('id, display_name')
      .eq('dashboard_mode', 'play')
      .eq('is_active', true)
    const { data: unlocks } = await sb
      .from('member_page_unlocks')
      .select('family_member_id')
      .in('family_member_id', members.map(m => m.id))
    const unlocked = new Set(unlocks.map(u => u.family_member_id))
    const missing = members.filter(m => !unlocked.has(m.id))
    return {
      ok: missing.length === 0,
      detail:
        members.length +
        ' members, ' +
        unlocked.size +
        ' with unlocks' +
        (missing.length ? ', missing: ' + missing.map(m => m.display_name).join(', ') : ''),
    }
  })

  await check('Every Play sticker_book_state has a non-null active_page_id', async () => {
    const { data } = await sb.from('member_sticker_book_state').select('family_member_id, active_page_id')
    const noPage = data.filter(r => !r.active_page_id)
    return {
      ok: noPage.length === 0,
      detail: data.length + ' states, ' + noPage.length + ' without active_page_id',
    }
  })

  await check('tasks.icon_asset_key + icon_variant + points_override columns readable', async () => {
    const { error } = await sb.from('tasks').select('id, icon_asset_key, icon_variant, points_override').limit(1)
    return { ok: !error, detail: error ? error.message : 'all three columns present' }
  })

  await check('roll_creature_for_completion RPC exists and is callable', async () => {
    const { error } = await sb.rpc('roll_creature_for_completion', {
      p_task_completion_id: '00000000-0000-0000-0000-000000000000',
    })
    const missing = error && error.message && error.message.includes('function') && error.message.includes('not exist')
    return {
      ok: !missing,
      detail: missing ? error.message : 'callable (response: ' + (error ? error.message.slice(0, 60) : 'ok') + ')',
    }
  })

  await check('platform_assets visual_schedule — all URLs have file extensions', async () => {
    const { data } = await sb
      .from('platform_assets')
      .select('feature_key, size_128_url, size_512_url, size_32_url')
      .eq('category', 'visual_schedule')
    const broken = data.filter(
      r =>
        (r.size_128_url && !/\.(png|jpg|jpeg|webp)$/i.test(r.size_128_url)) ||
        (r.size_512_url && !/\.(png|jpg|jpeg|webp)$/i.test(r.size_512_url)) ||
        (r.size_32_url && !/\.(png|jpg|jpeg|webp)$/i.test(r.size_32_url)),
    )
    return {
      ok: broken.length === 0,
      detail: data.length + ' rows, ' + broken.length + ' with missing extension',
    }
  })

  await check('platform_assets visual_schedule variant B — all have tags', async () => {
    const { data } = await sb
      .from('platform_assets')
      .select('feature_key, tags')
      .eq('category', 'visual_schedule')
      .eq('variant', 'B')
    const noTags = data.filter(r => !r.tags || (Array.isArray(r.tags) && r.tags.length === 0))
    return {
      ok: noTags.length === 0,
      detail: data.length + ' variant-B rows, ' + noTags.length + ' with empty tags',
    }
  })

  await check('platform_assets visual_schedule — rows with embeddings', async () => {
    const { count: totalCount } = await sb
      .from('platform_assets')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'visual_schedule')
    const { count: nullCount } = await sb
      .from('platform_assets')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'visual_schedule')
      .is('embedding', null)
    return {
      ok: nullCount === 0,
      detail: totalCount + ' rows, ' + nullCount + ' without embedding',
    }
  })

  await check('Sub-phase A feature keys registered in feature_key_registry', async () => {
    // These are the exact 7 keys Sub-phase A's migration 100115 inserted
    const expected = [
      'gamification_basic',
      'gamification_sticker_book',
      'play_dashboard',
      'play_reveal_tiles',
      'play_reading_support',
      'play_message_receive',
      'gamification_streak_milestones',
    ]
    const { data } = await sb
      .from('feature_key_registry')
      .select('feature_key')
      .in('feature_key', expected)
    const found = new Set((data || []).map(r => r.feature_key))
    const missing = expected.filter(k => !found.has(k))
    return {
      ok: missing.length === 0,
      detail:
        found.size +
        '/' +
        expected.length +
        ' found' +
        (missing.length ? ', missing: ' + missing.join(', ') : ''),
    }
  })

  await check('feature_access_v2 rows exist for Sub-phase A keys (5 role groups each)', async () => {
    const keys = [
      'gamification_basic',
      'gamification_sticker_book',
      'play_dashboard',
      'play_reveal_tiles',
      'play_reading_support',
      'play_message_receive',
      'gamification_streak_milestones',
    ]
    const { data } = await sb
      .from('feature_access_v2')
      .select('feature_key, role_group')
      .in('feature_key', keys)
    const byKey = new Map()
    for (const row of data || []) {
      if (!byKey.has(row.feature_key)) byKey.set(row.feature_key, new Set())
      byKey.get(row.feature_key).add(row.role_group)
    }
    const underCovered = []
    for (const k of keys) {
      const count = (byKey.get(k) || new Set()).size
      if (count < 5) underCovered.push(k + '(' + count + ')')
    }
    return {
      ok: underCovered.length === 0,
      detail: keys.length + ' keys checked' + (underCovered.length ? ', under-covered: ' + underCovered.join(', ') : ''),
    }
  })

  await check('auto_provision_member_resources trigger preserves teen branch (Build N)', async () => {
    // Check that there's an Independent teen with a rhythm_config — proof
    // that Build N's teen branch survived Sub-phase A's trigger rewrite
    const { data: teens } = await sb
      .from('family_members')
      .select('id, display_name')
      .eq('dashboard_mode', 'independent')
      .eq('is_active', true)
      .limit(10)
    if (!teens || teens.length === 0) {
      return { ok: true, detail: 'no independent teens in DB to test against' }
    }
    const { data: rhythmConfigs } = await sb
      .from('rhythm_configs')
      .select('member_id')
      .in('member_id', teens.map(t => t.id))
    const coveredTeens = new Set(rhythmConfigs.map(r => r.member_id))
    const missing = teens.filter(t => !coveredTeens.has(t.id))
    return {
      ok: missing.length === 0,
      detail:
        teens.length +
        ' teens checked, ' +
        coveredTeens.size +
        ' have rhythm_configs' +
        (missing.length ? ', missing: ' + missing.map(t => t.display_name).join(', ') : ''),
    }
  })

  await check('rarity_weights validation trigger — default weights sum to 100', async () => {
    const { data } = await sb
      .from('member_sticker_book_state')
      .select('family_member_id, rarity_weights')
    const bad = data.filter(r => {
      const w = r.rarity_weights || {}
      const sum = (w.common || 0) + (w.rare || 0) + (w.legendary || 0)
      return sum !== 100
    })
    return {
      ok: bad.length === 0,
      detail: data.length + ' states, ' + bad.length + ' with rarity_weights not summing to 100',
    }
  })

  console.log('\n=== Audit complete ===')
}

main().catch(e => {
  console.error('Audit script crashed:', e)
  process.exit(1)
})
