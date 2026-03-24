# Claude Code Prompt — platform_assets Auto-Embed Edge Function

## Context

The `platform_assets` table stores all illustrated images for the MyAIMCentral platform (app feature icons and vault thumbnails). Each row has an `embedding vector(1536)` column populated with an OpenAI `text-embedding-3-small` embedding for semantic search via the `match_assets()` RPC function.

This edge function automates embedding generation — any new row inserted or updated will automatically get an embedding without manual intervention.

---

## What to Build

Create: `supabase/functions/embed-platform-asset/index.ts`

Triggered by a Supabase Database Webhook on the `platform_assets` table for INSERT and UPDATE events.

### Embedding source text format
```
{display_name}. {description}. Tags: {tags joined with ", "}
```

### Logic
1. Receive webhook payload (new/updated row)
2. Skip if embedding already exists AND description/tags are unchanged
3. Build embedding text from `display_name`, `description`, `tags`
4. Call OpenAI `text-embedding-3-small` → 1536-dim vector
5. Update the row's `embedding` column via service role client
6. Return `{ success: true, feature_key, variant }`

---

## Edge Function Code

```typescript
// supabase/functions/embed-platform-asset/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record
    const oldRecord = payload.old_record

    // Skip if embedding already exists and description/tags unchanged
    if (
      record.embedding &&
      oldRecord &&
      record.description === oldRecord.description &&
      JSON.stringify(record.tags) === JSON.stringify(oldRecord.tags)
    ) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'embedding up to date' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build embedding source text
    const displayName = record.display_name || record.feature_key || ''
    const description = record.description || ''
    const tags = Array.isArray(record.tags) ? record.tags.join(', ') : ''
    const embeddingText = `${displayName}. ${description}. Tags: ${tags}`

    // Call OpenAI embeddings
    const openaiRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: embeddingText,
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.text()
      throw new Error(`OpenAI error: ${err}`)
    }

    const openaiData = await openaiRes.json()
    const embedding = openaiData.data[0].embedding

    // Update the row in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await supabase
      .from('platform_assets')
      .update({ embedding })
      .eq('id', record.id)

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        feature_key: record.feature_key,
        variant: record.variant,
        embedding_dims: embedding.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('embed-platform-asset error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Supabase Secrets Required

```bash
supabase secrets set OPENAI_API_KEY=<your-real-openai-key>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> **Important:** Use your real OpenAI API key — the Manus proxy key does not support the embeddings endpoint.

`SUPABASE_URL` is automatically available in all edge functions.

---

## Database Webhook Setup

After deploying the function, configure in Supabase Dashboard → Database → Webhooks:

- **Name:** `embed-platform-asset`
- **Table:** `platform_assets`
- **Events:** INSERT, UPDATE
- **URL:** `https://<your-project-ref>.supabase.co/functions/v1/embed-platform-asset`
- **HTTP Method:** POST
- **Headers:** `{ "Authorization": "Bearer <your-anon-key>" }`

---

## Testing

```sql
-- Insert a test row without embedding
INSERT INTO platform_assets (feature_key, variant, category, display_name, description, tags, status)
VALUES ('test_asset', 'A', 'app_icon', 'Test Asset — A',
        'A test image to verify auto-embedding works correctly',
        '["test","embedding","verification"]', 'draft');

-- Wait ~2 seconds, then verify embedding was generated:
SELECT feature_key, variant, embedding IS NOT NULL as has_embedding
FROM platform_assets WHERE feature_key = 'test_asset';

-- Clean up:
DELETE FROM platform_assets WHERE feature_key = 'test_asset';
```

---

## Notes

- Cost: ~$0.00002 per embedding (1000 new images ≈ $0.02 total).
- The function is idempotent — re-running only updates if description/tags changed.
- For bulk backfill of existing rows, use the Manus pipeline script `myaim-assets/generate_embeddings.py`.
- All 144 existing rows already have embeddings as of March 2026.
