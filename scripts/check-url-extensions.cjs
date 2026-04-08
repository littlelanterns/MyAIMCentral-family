require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
;(async () => {
  const { data: all } = await sb.from('platform_assets').select('feature_key, variant, size_128_url').eq('category', 'visual_schedule')
  const withExt = all.filter(r => /\.(png|jpg|jpeg|webp)$/i.test(r.size_128_url))
  const withoutExt = all.filter(r => !/\.(png|jpg|jpeg|webp)$/i.test(r.size_128_url))
  console.log(`Total visual_schedule rows: ${all.length}`)
  console.log(`  With extension: ${withExt.length}`)
  console.log(`  WITHOUT extension (broken): ${withoutExt.length}`)
  console.log(`\nSample broken keys (first 10):`)
  withoutExt.slice(0, 10).forEach(r => console.log(`  ${r.feature_key}`))
  // Check if the broken URLs actually respond with .png appended
  console.log(`\nVerifying one broken URL + .png fallback...`)
  if (withoutExt.length > 0) {
    const broken = withoutExt[0]
    console.log(`  Key: ${broken.feature_key}`)
    console.log(`  URL:   ${broken.size_128_url}`)
    console.log(`  +.png: ${broken.size_128_url}.png`)
  }
})()
