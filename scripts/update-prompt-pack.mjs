/**
 * Upload the replacement prompt pack HTML to Supabase Storage
 * and update the vault_items record to use the new interactive version.
 *
 * Run: node scripts/update-prompt-pack.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = 'https://vjfbzpliqialqmabfnxs.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const BUCKET = 'vault-content'
const STORAGE_PATH = 'prompt-pack/prompt-pack-interactive.html'
const LOCAL_FILE = resolve(process.cwd(), 'vault-tutorials/prompt_pack_interactive.html')

async function main() {
  console.log('Reading file...')
  const fileData = readFileSync(LOCAL_FILE)
  console.log(`File size: ${(fileData.length / 1024 / 1024).toFixed(1)} MB`)

  // Upload to storage (upsert to replace if exists)
  console.log(`Uploading to ${BUCKET}/${STORAGE_PATH}...`)
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(STORAGE_PATH, fileData, {
      contentType: 'text/html',
      upsert: true,
    })

  if (uploadErr) {
    console.error('Upload failed:', uploadErr.message)
    // Try creating bucket first
    console.log('Trying to create bucket...')
    await supabase.storage.createBucket(BUCKET, { public: true })
    const { error: retryErr } = await supabase.storage
      .from(BUCKET)
      .upload(STORAGE_PATH, fileData, {
        contentType: 'text/html',
        upsert: true,
      })
    if (retryErr) {
      console.error('Upload failed after bucket create:', retryErr.message)
      process.exit(1)
    }
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(STORAGE_PATH)
  const publicUrl = urlData.publicUrl
  console.log('Public URL:', publicUrl)

  // Find the prompt pack vault item
  const { data: items, error: findErr } = await supabase
    .from('vault_items')
    .select('id, display_title, content_type, content_url')
    .eq('content_type', 'prompt_pack')
    .limit(5)

  if (findErr) {
    console.error('Failed to find prompt pack items:', findErr.message)
    process.exit(1)
  }

  if (!items || items.length === 0) {
    console.log('No prompt_pack vault items found. The HTML is uploaded but no DB record to update.')
    console.log('Storage URL ready to use:', publicUrl)
    return
  }

  console.log('\nFound prompt pack items:')
  items.forEach(i => console.log(`  [${i.id}] "${i.display_title}" — current URL: ${i.content_url || '(none)'}`))

  // Update each prompt_pack item to point to the new interactive HTML
  for (const item of items) {
    console.log(`\nUpdating "${item.display_title}" content_url...`)
    const { error: updateErr } = await supabase
      .from('vault_items')
      .update({ content_url: publicUrl })
      .eq('id', item.id)

    if (updateErr) {
      console.error(`  Failed: ${updateErr.message}`)
    } else {
      console.log('  Updated successfully.')
    }
  }

  console.log('\nDone! Prompt pack now points to the interactive HTML version.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
