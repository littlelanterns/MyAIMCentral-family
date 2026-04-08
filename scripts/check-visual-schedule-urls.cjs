/**
 * Probes every platform_assets visual_schedule size_128_url via HEAD
 * to see if the actual image file exists in Supabase Storage.
 * Reports broken keys so we can either fix or delete the orphan rows.
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const CONCURRENCY = 10

async function main() {
  const { data } = await sb
    .from('platform_assets')
    .select('id, feature_key, variant, size_128_url, size_512_url, size_32_url')
    .eq('category', 'visual_schedule')

  console.log('Probing ' + data.length + ' visual_schedule rows...')

  const broken = []
  let checked = 0

  // Simple concurrency limiter
  const queue = [...data]
  async function worker() {
    while (queue.length) {
      const row = queue.shift()
      if (!row) return
      try {
        const res = await fetch(row.size_128_url, { method: 'HEAD' })
        if (res.status !== 200) {
          broken.push({
            feature_key: row.feature_key,
            variant: row.variant,
            status: res.status,
            url: row.size_128_url,
          })
        }
      } catch (e) {
        broken.push({
          feature_key: row.feature_key,
          variant: row.variant,
          status: 'ERR',
          url: row.size_128_url,
          error: e.message,
        })
      }
      checked++
      if (checked % 50 === 0) {
        console.log('  checked ' + checked + '/' + data.length)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  console.log('\n=== Results ===')
  console.log('Total rows: ' + data.length)
  console.log('Broken (HEAD != 200): ' + broken.length)
  if (broken.length > 0) {
    console.log('\nBroken feature keys:')
    for (const b of broken) {
      console.log('  ' + b.feature_key + ' (' + b.variant + ') HTTP ' + b.status)
    }
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
