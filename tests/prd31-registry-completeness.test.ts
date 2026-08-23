/**
 * PRD-31 Slice 1 — feature-access registry completeness pin.
 *
 * Guards the tier-chart invariants established by migration 100316 against
 * future drift (ruling record R31-2/R31-3, chart §N):
 *   1. Every feature_access_v2 key exists in feature_key_registry — a build
 *      that seeds access rows for an unregistered key fails here.
 *   2. Zero NULL minimum_tier_id rows — a build that seeds a row without a
 *      tier fails here (that bug class shipped 45 rows before Slice 1).
 *   3. Retired/merged keys never come back (chart §N merge directions).
 *   4. The OD-31-A principle holds: zero ENABLED non-mom Essential cells
 *      (Essential is mom-only; founder-marked exceptions would be encoded
 *      as an allowlist here when she makes them).
 *
 * This is a LIVE-DB test (the seeds live in production, not in one parseable
 * migration). It reads .env.local like the Playwright helpers do and skips
 * with a loud warning when credentials are absent (e.g. clean CI checkout).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const haveCreds = Boolean(supabaseUrl && serviceRoleKey)

if (!haveCreds) {
  console.warn(
    '[prd31-registry-completeness] VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — live-DB registry pins SKIPPED. ' +
      'Run with .env.local present (pre-push machines have it) for the real check.'
  )
}

const RETIRED_KEYS = ['smart_notepad', 'duration_tracking', 'tasks_teen_studio', 'tasks_pomodoro']

describe.skipIf(!haveCreds)('PRD-31 feature-access registry completeness', () => {
  let db: SupabaseClient
  let accessRows: { feature_key: string; role_group: string; minimum_tier_id: string | null; is_enabled: boolean }[]
  let registryKeys: Set<string>
  let essentialTierId: string

  beforeAll(async () => {
    db = createClient(supabaseUrl!, serviceRoleKey!)

    const { data: tiers, error: tierErr } = await db
      .from('subscription_tiers')
      .select('id, slug')
    if (tierErr) throw tierErr
    essentialTierId = tiers!.find((t) => t.slug === 'essential')!.id

    const { data: access, error: accessErr } = await db
      .from('feature_access_v2')
      .select('feature_key, role_group, minimum_tier_id, is_enabled')
      .limit(5000)
    if (accessErr) throw accessErr
    accessRows = access!

    const { data: registry, error: regErr } = await db
      .from('feature_key_registry')
      .select('feature_key')
      .limit(5000)
    if (regErr) throw regErr
    registryKeys = new Set(registry!.map((r) => r.feature_key))

    // Sanity: the tables are non-trivially populated (a broken query returning
    // zero rows must never masquerade as a passing completeness check).
    expect(accessRows.length).toBeGreaterThan(300)
    expect(registryKeys.size).toBeGreaterThan(200)
  })

  it('every feature_access_v2 key is registered in feature_key_registry', () => {
    const unregistered = [...new Set(accessRows.map((r) => r.feature_key))].filter(
      (k) => !registryKeys.has(k)
    )
    expect(unregistered, `Unregistered keys carrying access rows: ${unregistered.join(', ')}`).toEqual([])
  })

  it('zero NULL minimum_tier_id rows', () => {
    const nullTier = accessRows
      .filter((r) => r.minimum_tier_id === null)
      .map((r) => `${r.feature_key}:${r.role_group}`)
    expect(nullTier, `NULL-tier rows (repair in a migration, per chart Rule 2): ${nullTier.join(', ')}`).toEqual([])
  })

  it('retired keys stay retired (chart §N merges)', () => {
    const resurrectedAccess = accessRows
      .filter((r) => RETIRED_KEYS.includes(r.feature_key))
      .map((r) => `${r.feature_key}:${r.role_group}`)
    expect(resurrectedAccess, 'Retired keys carrying access rows again').toEqual([])

    const resurrectedRegistry = RETIRED_KEYS.filter((k) => registryKeys.has(k))
    expect(resurrectedRegistry, 'Retired keys re-registered').toEqual([])
  })

  it('OD-31-A holds: no ENABLED non-mom cell sits at Essential', () => {
    // Founder-marked exceptions to the Essential-is-mom-only story get added
    // to this allowlist as she makes them (living-draft chart / Screen 4).
    const FOUNDER_EXCEPTIONS: string[] = []
    const violations = accessRows
      .filter(
        (r) =>
          r.role_group !== 'mom' &&
          r.is_enabled &&
          r.minimum_tier_id === essentialTierId &&
          !FOUNDER_EXCEPTIONS.includes(`${r.feature_key}:${r.role_group}`)
      )
      .map((r) => `${r.feature_key}:${r.role_group}`)
    expect(violations, `Non-mom Essential cells outside the founder-exception allowlist: ${violations.join(', ')}`).toEqual([])
  })
})
