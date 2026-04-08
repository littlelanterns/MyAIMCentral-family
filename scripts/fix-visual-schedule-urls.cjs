require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
;(async () => {
  const { data: all, error } = await sb.from('platform_assets').select('id, feature_key, variant, size_128_url, size_512_url, size_32_url').eq('category', 'visual_schedule')
  if (error) { console.error(error); process.exit(1) }
  const broken = all.filter(r =>
    (r.size_128_url && !/\.(png|jpg|jpeg|webp)$/i.test(r.size_128_url)) ||
    (r.size_512_url && !/\.(png|jpg|jpeg|webp)$/i.test(r.size_512_url)) ||
    (r.size_32_url && !/\.(png|jpg|jpeg|webp)$/i.test(r.size_32_url))
  )
  console.log(`Found ${broken.length} rows with missing .png extension on at least one URL column`)
  let updated = 0
  for (const row of broken) {
    const patch = {}
    if (row.size_128_url && !/\.(png|jpg|jpeg|webp)$/i.test(row.size_128_url)) patch.size_128_url = row.size_128_url + '.png'
    if (row.size_512_url && !/\.(png|jpg|jpeg|webp)$/i.test(row.size_512_url)) patch.size_512_url = row.size_512_url + '.png'
    if (row.size_32_url && !/\.(png|jpg|jpeg|webp)$/i.test(row.size_32_url)) patch.size_32_url = row.size_32_url + '.png'
    const { error: upErr } = await sb.from('platform_assets').update(patch).eq('id', row.id)
    if (upErr) { console.error(`Failed ${row.feature_key}:`, upErr.message); continue }
    updated++
  }
  console.log(`Updated ${updated} / ${broken.length} rows`)
  // Re-verify
  const { data: after } = await sb.from('platform_assets').select('size_128_url').eq('category', 'visual_schedule')
  const stillBroken = after.filter(r => r.size_128_url && !/\.(png|jpg|jpeg|webp)$/i.test(r.size_128_url)).length
  console.log(`After fix: ${stillBroken} rows still missing .png on size_128_url`)
})()
