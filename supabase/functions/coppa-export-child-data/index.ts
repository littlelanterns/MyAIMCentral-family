// coppa-export-child-data — PRD-40 Parental Data Export (Screen 8's
// "[Export [Child Name]'s Data]" button).
//
// R-10 (two-door session rule): mom's REAL authenticated session only, same
// pattern as create-coppa-verification-intent — resolved via family_members
// lookup keyed on auth.user.id + role='primary_parent'. View-As does not
// change auth.uid(); "unavailable inside View-As" is enforced at the
// frontend layer (the button never renders inside the modal scope).
//
// Iterates every table in the coppa-cascade-plan.ts registry (the same
// classification data Slice 4's deletion cascade walks — one registry, two
// consumers, matching decision file §4's "one registry, two consumers"
// pattern for the enforcement layer) and exports every row where the target
// child appears in ANY of that table's member-referencing columns, bundled
// into a ZIP with a plain-language README.
//
// Addendum §(c) / D-PRD40-3: this export deliberately does NOT apply
// filterKidPrivate() — kid-private journal entries, share_with_mom=false
// self-knowledge, and lila_conversation-type journal entries are ALL
// included. The parental review right is satisfied in full on this formal
// rights surface even though daily View-As UX keeps hiding kid-private
// items from mom (Convention #39 unweakened). This query uses the
// service-role client directly (bypassing RLS and any application-layer
// filter), which is what makes that inclusion correct-by-construction here.
//
// Deployed --no-verify-jwt (config.toml) — auth is enforced in code via
// authenticateRequest, matching every other function in this codebase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { ZipWriter } from '../_shared/zip-writer.ts'
import { CASCADE_PLAN } from '../_shared/coppa-cascade-plan.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const RATE_LIMIT_DAYS = 7
const MAX_ROWS_PER_TABLE = 5000
const SIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60 // 7 days

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}

function extFromContentType(ct: string | null): string {
  if (!ct) return 'bin'
  if (ct.includes('png')) return 'png'
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('gif')) return 'gif'
  return 'bin'
}

/** Best-effort binary fetch — never throws; caller decides whether to include. */
async function tryFetchBinary(url: string): Promise<{ bytes: Uint8Array; ext: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = new Uint8Array(await res.arrayBuffer())
    return { bytes: buf, ext: extFromContentType(res.headers.get('content-type')) }
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const auth = await authenticateRequest(req)
  if (auth instanceof Response) return auth

  try {
    const body = await req.json().catch(() => ({}))
    const childMemberId = body?.child_member_id as string | undefined
    if (!childMemberId) {
      return json({ error: 'invalid_request', message: 'child_member_id is required' }, 400)
    }

    // ── R-10: caller must be the primary parent of their family ──
    const { data: parentMember, error: parentError } = await supabase
      .from('family_members')
      .select('id, family_id')
      .eq('user_id', auth.user.id)
      .eq('role', 'primary_parent')
      .maybeSingle()
    if (parentError) throw new Error(parentError.message)
    if (!parentMember) {
      return json({ error: 'not_authorized', reason: 'Only the primary parent can export a child\'s data.' }, 403)
    }
    const parentMemberId = parentMember.id as string
    const familyId = parentMember.family_id as string

    // ── Target must be a child (or aged-out former child) in mom's own family ──
    const { data: child, error: childError } = await supabase
      .from('family_members')
      .select('id, family_id, display_name, coppa_age_bracket, avatar_url')
      .eq('id', childMemberId)
      .eq('family_id', familyId)
      .maybeSingle()
    if (childError) throw new Error(childError.message)
    if (!child) {
      return json({ error: 'not_authorized', reason: 'Child not found in your family.' }, 403)
    }

    const { count: consentCount, error: consentCheckError } = await supabase
      .from('coppa_consents')
      .select('id', { count: 'exact', head: true })
      .eq('child_member_id', childMemberId)
    if (consentCheckError) throw new Error(consentCheckError.message)
    if (child.coppa_age_bracket !== 'under_13' && (consentCount ?? 0) === 0) {
      return json({ error: 'not_eligible', reason: 'This member has no COPPA consent record to export.' }, 400)
    }

    // ── Rate limit: 1 export per child per 7 days ──
    const rateLimitCutoff = new Date(Date.now() - RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount, error: recentError } = await supabase
      .from('parental_data_exports')
      .select('id', { count: 'exact', head: true })
      .eq('child_member_id', childMemberId)
      .gte('requested_at', rateLimitCutoff)
    if (recentError) throw new Error(recentError.message)
    if ((recentCount ?? 0) > 0) {
      return json(
        { error: 'rate_limited', reason: `Only one export per child every ${RATE_LIMIT_DAYS} days. Please try again later.` },
        429,
      )
    }

    // ── Record the export request (audit row, PRD schema) ──
    const forwardedFor = req.headers.get('x-forwarded-for')
    const { data: exportRow, error: insertError } = await supabase
      .from('parental_data_exports')
      .insert({
        family_id: familyId,
        child_member_id: childMemberId,
        parent_member_id: parentMemberId,
        ip_address: forwardedFor,
      })
      .select('id')
      .single()
    if (insertError) throw new Error(insertError.message)
    const exportId = exportRow.id as string

    // ── Walk the cascade-plan registry, exporting every matching row ──
    const zip = new ZipWriter()
    const summaryLines: string[] = []
    const warnings: string[] = []

    for (const spec of CASCADE_PLAN) {
      const scalarCols = [...spec.hardDeleteColumns, ...spec.scrubScalarColumns]
      const arrayCols = spec.scrubArrayColumns
      if (scalarCols.length === 0 && arrayCols.length === 0) continue

      const [schema, bareTable] = spec.table.includes('.') ? spec.table.split('.') : ['public', spec.table]
      // The service-role client only reaches the `public` schema by default
      // via PostgREST's schema switch; platform_intelligence rows (persona
      // promotion queue) are edge-case governance data with no PII payload
      // worth exporting to a parent — skipped here deliberately.
      if (schema !== 'public') continue

      let rows: Record<string, unknown>[] = []
      try {
        if (scalarCols.length > 0) {
          const orFilter = scalarCols.map((c) => `${c}.eq.${childMemberId}`).join(',')
          const { data, error } = await supabase.from(bareTable).select('*').or(orFilter).limit(MAX_ROWS_PER_TABLE)
          if (error) throw error
          rows = rows.concat(data ?? [])
        }
        for (const arrCol of arrayCols) {
          const { data, error } = await supabase.from(bareTable).select('*').contains(arrCol, [childMemberId]).limit(MAX_ROWS_PER_TABLE)
          if (error) throw error
          rows = rows.concat(data ?? [])
        }
      } catch (err) {
        warnings.push(`Could not read ${bareTable}: ${err instanceof Error ? err.message : String(err)}`)
        continue
      }

      // De-dupe (a row can match both a scalar and array filter pass).
      const seen = new Set<string>()
      const deduped = rows.filter((r) => {
        const id = String(r.id ?? JSON.stringify(r))
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })

      if (deduped.length === 0) continue
      if (rows.length >= MAX_ROWS_PER_TABLE) {
        warnings.push(`${bareTable}: truncated to the first ${MAX_ROWS_PER_TABLE} rows.`)
      }

      zip.addTextFile(`data/${bareTable}.json`, JSON.stringify(deduped, null, 2))
      summaryLines.push(`- **${bareTable}** — ${deduped.length} record${deduped.length === 1 ? '' : 's'}`)
    }

    // Include the child's own consent record — legal evidence mom should
    // see in her own export, per PRD Screen 8 review-what-you-consented-to.
    try {
      const { data: consents } = await supabase
        .from('coppa_consents')
        .select('id, consent_version, acknowledged_sections, consented_at, superseded_at, revoked_at, deletion_completed_at')
        .eq('child_member_id', childMemberId)
      if (consents && consents.length > 0) {
        zip.addTextFile('data/coppa_consents.json', JSON.stringify(consents, null, 2))
        summaryLines.push(`- **coppa_consents** — ${consents.length} record${consents.length === 1 ? '' : 's'} (your consent history for this child)`)
      }
    } catch { /* best-effort */ }

    // ── Binary assets: avatar + task/routine-step completion photos ──
    let photoCount = 0
    if (child.avatar_url) {
      const fetched = await tryFetchBinary(child.avatar_url)
      if (fetched) {
        zip.addFile(`photos/avatar.${fetched.ext}`, fetched.bytes)
        photoCount++
      }
    }
    try {
      const { data: taskPhotos } = await supabase
        .from('task_completions')
        .select('id, photo_url')
        .eq('family_member_id', childMemberId)
        .not('photo_url', 'is', null)
        .limit(500)
      for (const row of taskPhotos ?? []) {
        const url = row.photo_url as string | null
        if (!url) continue
        const fetched = await tryFetchBinary(url)
        if (fetched) {
          zip.addFile(`photos/task_completions/${row.id}.${fetched.ext}`, fetched.bytes)
          photoCount++
        }
      }
    } catch { /* best-effort */ }
    try {
      const { data: routinePhotos } = await supabase
        .from('routine_step_completions')
        .select('id, photo_url')
        .eq('family_member_id', childMemberId)
        .not('photo_url', 'is', null)
        .limit(500)
      for (const row of routinePhotos ?? []) {
        const url = row.photo_url as string | null
        if (!url) continue
        const fetched = await tryFetchBinary(url)
        if (fetched) {
          zip.addFile(`photos/routine_step_completions/${row.id}.${fetched.ext}`, fetched.bytes)
          photoCount++
        }
      }
    } catch { /* best-effort */ }

    // ── README ──
    // Convention #257: stamp the export date at the FAMILY's timezone, never
    // the server's UTC date — an evening export must not claim tomorrow.
    const { data: familyTzRow } = await supabase
      .from('families')
      .select('timezone')
      .eq('id', familyId)
      .maybeSingle()
    const exportedOn = new Intl.DateTimeFormat('en-CA', {
      timeZone: familyTzRow?.timezone || 'America/Chicago',
    }).format(new Date())
    const readme = [
      `# ${child.display_name}'s MyAIM Family Data`,
      '',
      `Everything MyAIM Family has collected about ${child.display_name}, exported ${exportedOn}.`,
      '',
      '## What is in this archive',
      '',
      'Each file in `data/` is a JSON file named after the feature it comes from — one array of records per file.',
      photoCount > 0 ? `Photos (avatar and any task/routine completion photos) are in \`photos/\`.` : '',
      '',
      '## Records included',
      '',
      ...(summaryLines.length > 0 ? summaryLines : ['(no records found in any table)']),
      '',
      ...(warnings.length > 0 ? ['## Notes', '', ...warnings.map((w) => `- ${w}`), ''] : []),
      '## Questions?',
      '',
      'Contact Three Little Lanterns LLC through the app if anything here looks wrong or you need help understanding it.',
    ].filter((l) => l !== undefined).join('\n')
    zip.addTextFile('README.md', readme)

    const zipBytes = zip.finalize()

    // ── Upload + signed URL ──
    const archivePath = `${familyId}/${childMemberId}/${exportId}.zip`
    const { error: uploadError } = await supabase.storage
      .from('coppa-exports')
      .upload(archivePath, zipBytes, { contentType: 'application/zip', upsert: true })
    if (uploadError) throw new Error(`storage upload failed: ${uploadError.message}`)

    const { data: signed, error: signError } = await supabase.storage
      .from('coppa-exports')
      .createSignedUrl(archivePath, SIGNED_URL_EXPIRY_SECONDS)
    if (signError || !signed) throw new Error(`signed URL creation failed: ${signError?.message}`)

    const { error: completeError } = await supabase
      .from('parental_data_exports')
      .update({ archive_path: archivePath, completed_at: new Date().toISOString() })
      .eq('id', exportId)
    if (completeError) throw new Error(completeError.message)

    await supabase.from('notifications').insert({
      family_id: familyId,
      recipient_member_id: parentMemberId,
      notification_type: 'coppa_export_ready',
      category: 'privacy',
      title: `${child.display_name}'s data export is ready`,
      body: `Your download link is ready and expires in 7 days.`,
      action_url: signed.signedUrl,
      priority: 'normal',
    })

    return json({
      success: true,
      export_id: exportId,
      download_url: signed.signedUrl,
      expires_in_seconds: SIGNED_URL_EXPIRY_SECONDS,
      tables_included: summaryLines.length,
      photos_included: photoCount,
      warnings,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('coppa-export-child-data error:', message)
    return json({ error: `Server error: ${message}` }, 500)
  }
})
