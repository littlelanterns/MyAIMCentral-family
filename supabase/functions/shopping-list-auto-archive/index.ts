/**
 * shopping-list-auto-archive — PRD-09B Living Shopping List
 *
 * Called daily at 03:10 UTC by pg_cron (migration 100230) via
 * util.invoke_edge_function('shopping-list-auto-archive').
 *
 * For each family's always-on shopping lists, finds checked items whose
 * checked_at timestamp is older than the effective auto_archive_days
 * threshold. The effective threshold is:
 *   1. list_section_settings.auto_archive_days (if a row exists for
 *      that list+section and the value is non-NULL), else
 *   2. lists.default_auto_archive_days.
 *
 * Qualifying items are soft-archived by setting archived_at = now().
 * No hard deletes.
 *
 * Auth: service role only. Convention #246 compliant — deploy with
 * --no-verify-jwt. The function validates the service role bearer token
 * in the Authorization header.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AlwaysOnList {
  id: string
  family_id: string
  default_auto_archive_days: number
}

interface SectionSetting {
  section_name: string
  auto_archive_days: number | null
}

interface CheckedItem {
  id: string
  section_name: string | null
  checked_at: string
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Verify service role authorization
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(serviceRoleKey)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const now = new Date()

  let listsProcessed = 0
  let itemsArchived = 0

  try {
    // 1. Load all always-on lists (shopping lists default to is_always_on=true)
    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select('id, family_id, default_auto_archive_days')
      .eq('is_always_on', true)
      .is('archived_at', null)

    if (listsError) throw listsError
    if (!lists || lists.length === 0) {
      return new Response(
        JSON.stringify({ lists_processed: 0, items_archived: 0 }),
        { status: 200, headers: jsonHeaders },
      )
    }

    for (const list of lists as AlwaysOnList[]) {
      listsProcessed++
      const listDefault = list.default_auto_archive_days ?? 90

      // 2. Load per-section overrides for this list
      const { data: sectionSettings } = await supabase
        .from('list_section_settings')
        .select('section_name, auto_archive_days')
        .eq('list_id', list.id)

      const sectionOverrides = new Map<string, number>()
      if (sectionSettings) {
        for (const ss of sectionSettings as SectionSetting[]) {
          if (ss.auto_archive_days != null) {
            sectionOverrides.set(ss.section_name, ss.auto_archive_days)
          }
        }
      }

      // 3. Load all checked items that have NOT already been archived
      const { data: checkedItems, error: itemsError } = await supabase
        .from('list_items')
        .select('id, section_name, checked_at')
        .eq('list_id', list.id)
        .eq('checked', true)
        .is('archived_at', null)
        .not('checked_at', 'is', null)

      if (itemsError) {
        console.error('[shopping-auto-archive] items load error', list.id, itemsError)
        continue
      }
      if (!checkedItems || checkedItems.length === 0) continue

      // 4. Determine which items are past the archive threshold
      const toArchive: string[] = []

      for (const item of checkedItems as CheckedItem[]) {
        if (!item.checked_at) continue

        const effectiveDays = item.section_name
          ? (sectionOverrides.get(item.section_name) ?? listDefault)
          : listDefault

        const checkedAt = new Date(item.checked_at).getTime()
        const thresholdMs = effectiveDays * 24 * 60 * 60 * 1000
        const elapsed = now.getTime() - checkedAt

        if (elapsed >= thresholdMs) {
          toArchive.push(item.id)
        }
      }

      if (toArchive.length === 0) continue

      // 5. Batch archive in chunks of 100
      for (let i = 0; i < toArchive.length; i += 100) {
        const batch = toArchive.slice(i, i + 100)
        const { error: archiveError } = await supabase
          .from('list_items')
          .update({ archived_at: now.toISOString() })
          .in('id', batch)

        if (archiveError) {
          console.error('[shopping-auto-archive] archive error', list.id, archiveError)
        } else {
          itemsArchived += batch.length
        }
      }
    }

    console.log(`[shopping-auto-archive] done: ${listsProcessed} lists, ${itemsArchived} items archived`)

    return new Response(
      JSON.stringify({ lists_processed: listsProcessed, items_archived: itemsArchived }),
      { status: 200, headers: jsonHeaders },
    )
  } catch (error) {
    console.error('[shopping-auto-archive] fatal error', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'unknown error',
        lists_processed: listsProcessed,
        items_archived: itemsArchived,
      }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
