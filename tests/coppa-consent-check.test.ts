/**
 * PRD-40 Slice 5 — unit pin on the Edge-side consent check
 * (supabase/functions/_shared/coppa-consent.ts), the TS twin of
 * util.coppa_write_allowed (migration 100327).
 *
 * The SQL side is proven live by the migration's own verification block +
 * the enforcement probe script + rls-verifier; this pin proves the TS twin
 * walks the identical decision ladder — especially THE INERTNESS INVARIANT:
 * under R-8 dormancy an unconsented under-13 member (the founder's own kids
 * today) is ALLOWED, and 13+/adult members never even reach the template
 * lookup.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  checkCoppaWriteAllowed,
  getCoppaConsentStatus,
} from '../supabase/functions/_shared/coppa-consent'

interface MockRow {
  [k: string]: unknown
}

/** Minimal chainable mock: resolves per-table fixtures for maybeSingle()/order(). */
function mockSupabase(fixtures: {
  member?: MockRow | null
  approvedTemplate?: boolean
  activeConsent?: boolean
  consents?: MockRow[]
  failOn?: string
}) {
  const from = vi.fn((table: string) => {
    const chain: Record<string, unknown> = {}
    const self = () => chain
    for (const m of ['select', 'eq', 'is', 'not', 'limit', 'neq']) chain[m] = vi.fn(self)
    chain.maybeSingle = vi.fn(async () => {
      if (fixtures.failOn === table) return { data: null, error: new Error(`boom:${table}`) }
      if (table === 'family_members') return { data: fixtures.member ?? null, error: null }
      if (table === 'coppa_consent_templates') {
        return { data: fixtures.approvedTemplate ? { version: '1.0.0' } : null, error: null }
      }
      if (table === 'coppa_consents') {
        return { data: fixtures.activeConsent ? { id: 'consent-1' } : null, error: null }
      }
      return { data: null, error: null }
    })
    chain.order = vi.fn(async () => {
      if (table === 'coppa_consents') return { data: fixtures.consents ?? [], error: null }
      return { data: [], error: null }
    })
    return chain
  })
  return { from, _from: from }
}

const under13 = { coppa_age_bracket: 'under_13', is_suspended_for_deletion: false }
const teen = { coppa_age_bracket: '13_to_17', is_suspended_for_deletion: false }
const adult = { coppa_age_bracket: 'adult', is_suspended_for_deletion: false }
const suspended = { coppa_age_bracket: 'under_13', is_suspended_for_deletion: true }

describe('checkCoppaWriteAllowed — the decision ladder (twin of util.coppa_write_allowed)', () => {
  it('no member id → allowed, not_applicable', async () => {
    const sb = mockSupabase({})
    expect(await checkCoppaWriteAllowed(sb, null)).toEqual({ allowed: true, status: 'not_applicable' })
    expect(await checkCoppaWriteAllowed(sb, undefined)).toEqual({ allowed: true, status: 'not_applicable' })
  })

  it('unknown member id → allowed (defensive)', async () => {
    const sb = mockSupabase({ member: null })
    expect(await checkCoppaWriteAllowed(sb, 'm1')).toEqual({ allowed: true, status: 'not_applicable' })
  })

  it('suspended member → BLOCKED, regardless of dormancy (Screen-9 revocation grace)', async () => {
    const sb = mockSupabase({ member: suspended, approvedTemplate: false })
    expect(await checkCoppaWriteAllowed(sb, 'm1')).toEqual({ allowed: false, status: 'suspended_for_deletion' })
  })

  it('13-17 and adult members → allowed without ever consulting templates or consents', async () => {
    for (const member of [teen, adult]) {
      const sb = mockSupabase({ member })
      expect(await checkCoppaWriteAllowed(sb, 'm1')).toEqual({ allowed: true, status: 'not_applicable' })
      const tables = sb._from.mock.calls.map((c: unknown[]) => c[0])
      expect(tables).not.toContain('coppa_consent_templates')
      expect(tables).not.toContain('coppa_consents')
    }
  })

  it('THE INERTNESS INVARIANT: unconsented under-13 under R-8 dormancy → allowed', async () => {
    const sb = mockSupabase({ member: under13, approvedTemplate: false })
    expect(await checkCoppaWriteAllowed(sb, 'm1')).toEqual({ allowed: true, status: 'missing' })
  })

  it('enforcement active + active consent → allowed', async () => {
    const sb = mockSupabase({ member: under13, approvedTemplate: true, activeConsent: true })
    expect(await checkCoppaWriteAllowed(sb, 'm1')).toEqual({ allowed: true, status: 'active' })
  })

  it('enforcement active + no consent → BLOCKED with the precise status', async () => {
    const missing = mockSupabase({ member: under13, approvedTemplate: true, activeConsent: false, consents: [] })
    expect(await checkCoppaWriteAllowed(missing, 'm1')).toEqual({ allowed: false, status: 'missing' })

    const revoked = mockSupabase({
      member: under13, approvedTemplate: true, activeConsent: false,
      consents: [{ revoked_at: '2026-08-01', superseded_at: null, consented_at: '2026-07-01' }],
    })
    expect(await checkCoppaWriteAllowed(revoked, 'm1')).toEqual({ allowed: false, status: 'revoked' })
  })

  it('prefetched member skips the family_members query (lila-chat piggyback)', async () => {
    const sb = mockSupabase({ approvedTemplate: false })
    const result = await checkCoppaWriteAllowed(sb, 'm1', under13)
    expect(result.allowed).toBe(true)
    const tables = sb._from.mock.calls.map((c: unknown[]) => c[0])
    expect(tables).not.toContain('family_members')
  })

  it('fails OPEN (loudly) on unexpected errors — never takes LiLa down platform-wide', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const sb = mockSupabase({ member: under13, failOn: 'coppa_consent_templates' })
    expect((await checkCoppaWriteAllowed(sb, 'm1')).allowed).toBe(true)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('getCoppaConsentStatus — the PRD-02 hook ladder (server twin of useCoppaConsent)', () => {
  it('walks suspended → not_applicable → active → revoked/superseded → missing', async () => {
    expect(await getCoppaConsentStatus(mockSupabase({ member: suspended }), 'm1')).toBe('suspended_for_deletion')
    expect(await getCoppaConsentStatus(mockSupabase({ member: adult }), 'm1')).toBe('not_applicable')
    expect(await getCoppaConsentStatus(mockSupabase({ member: under13, consents: [] }), 'm1')).toBe('missing')
    expect(
      await getCoppaConsentStatus(
        mockSupabase({ member: under13, consents: [{ revoked_at: null, superseded_at: null, consented_at: '2026-07-01' }] }),
        'm1',
      ),
    ).toBe('active')
    expect(
      await getCoppaConsentStatus(
        mockSupabase({ member: under13, consents: [{ revoked_at: null, superseded_at: '2026-08-01', consented_at: '2026-07-01' }] }),
        'm1',
      ),
    ).toBe('superseded')
  })
})
