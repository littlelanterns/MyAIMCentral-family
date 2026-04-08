require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
;(async () => {
  const { data } = await sb.from('platform_assets').select('feature_key, variant, size_128_url, size_512_url').eq('category', 'visual_schedule').eq('variant', 'B').filter('tags', 'cs', JSON.stringify(['teeth'])).limit(3)
  console.log(JSON.stringify(data, null, 2))
})()
