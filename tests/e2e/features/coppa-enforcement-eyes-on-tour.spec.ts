/**
 * PRD-40 Slice 5 — Convention #277 eyes-on tour.
 *
 * This slice ships almost no visible UI by design — its one VISIBLE behavior
 * is a negative: a suspended-for-deletion member disappears from every
 * roster surface while remaining manageable on Screen 8 (Pending Deletion).
 * The tour proves exactly that, as mom, at desktop + mobile:
 *
 *   1. seed a COPPATEST under-13 child, revoke-shape their consent
 *      (revoked_at + scheduled_deletion_at + is_suspended_for_deletion)
 *   2. Family Members page — the child is ABSENT
 *   3. Settings -> Privacy & Consent — the child IS present under Pending
 *      Deletion with the Undo action
 *   4. mobile (375px) variants of both
 *
 * Gated on EYES_ON_TOUR=1; screenshots to eyes-on-tour/coppa-s5-*.png
 * (gitignored). Claude reads the shots and fills the Mom-UI table.
 * Fixtures swept in afterAll, loud failures.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { loginAsMom } from '../helpers/auth'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const sr = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const KID_NAME = 'COPPATEST S5 Tour Kid'
let familyId = ''
let momId = ''
let kidId = ''
let verificationId: string | null = null

test.describe.configure({ mode: 'serial' })
test.skip(process.env.EYES_ON_TOUR !== '1', 'EYES_ON_TOUR=1 to run the Convention #277 tour')

async function sweep() {
  const warn = (label: string, err: { message: string } | null) => {
    if (err) console.warn(`tour sweep: ${label} failed:`, err.message)
  }
  const { data: kids } = await sr.from('family_members').select('id').like('display_name', 'COPPATEST S5 Tour%')
  const ids = (kids ?? []).map((k) => k.id)
  if (ids.length) {
    warn('coppa_consents', (await sr.from('coppa_consents').delete().in('child_member_id', ids)).error)
    for (const [table, col] of [
      ['lists', 'owner_id'], ['archive_folders', 'member_id'], ['dashboard_configs', 'family_member_id'],
      ['archive_member_settings', 'member_id'], ['dashboard_widgets', 'family_member_id'],
    ] as const) {
      warn(table, (await sr.from(table).delete().in(col, ids)).error)
    }
    warn('family_members', (await sr.from('family_members').delete().in('id', ids)).error)
  }
  if (verificationId) {
    warn('parent_verifications', (await sr.from('parent_verifications').delete().eq('id', verificationId)).error)
    verificationId = null
  }
}

test.beforeAll(async () => {
  const { data: fam } = await sr.from('families').select('id').eq('family_name', 'The Testworth Family').single()
  if (!fam) throw new Error('Testworth family not found')
  familyId = fam.id
  const { data: mom } = await sr.from('family_members').select('id').eq('family_id', familyId).eq('role', 'primary_parent').single()
  momId = mom!.id
  await sweep()

  const { data: kid, error } = await sr.from('family_members').insert({
    family_id: familyId, display_name: KID_NAME, role: 'member', dashboard_mode: 'guided',
    relationship: 'child', age: 8, in_household: true, dashboard_enabled: true,
    is_active: true, coppa_age_bracket: 'under_13', member_color: '#68a395',
  }).select('id').single()
  if (error || !kid) throw new Error(`seed kid failed: ${error?.message}`)
  kidId = kid.id

  const { data: pv } = await sr.from('parent_verifications').select('id').eq('parent_member_id', momId).is('revoked_at', null).maybeSingle()
  let vid = pv?.id
  if (!vid) {
    const { data: created, error: vErr } = await sr.from('parent_verifications').insert({
      family_id: familyId, parent_member_id: momId, verification_method: 'stripe_charge',
      stripe_payment_intent_id: `pi_COPPATEST_S5T_${Date.now()}`, amount_charged_cents: 100, currency: 'USD',
    }).select('id').single()
    if (vErr || !created) throw new Error(`seed verification failed: ${vErr?.message}`)
    verificationId = created.id
    vid = created.id
  }
  // Revoked-shape consent + suspension = the full Pending Deletion state
  const { error: cErr } = await sr.from('coppa_consents').insert({
    family_id: familyId, child_member_id: kidId, parent_member_id: momId, verification_id: vid,
    consent_version: '1.0.0',
    acknowledged_sections: ['what_we_collect', 'how_lila_uses', 'who_sees_it', 'your_rights', 'parent_affirmation'],
    revoked_at: new Date().toISOString(),
    scheduled_deletion_at: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    revocation_reason: 'no_longer_want_ai',
  })
  if (cErr) throw new Error(`seed revoked consent failed: ${cErr.message}`)
  const { error: sErr } = await sr.from('family_members').update({ is_suspended_for_deletion: true }).eq('id', kidId)
  if (sErr) throw new Error(`suspend failed: ${sErr.message}`)
})

test.afterAll(async () => {
  await sweep()
})

for (const [label, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 375, height: 812 }],
] as const) {
  test(`tour (${label}): suspended child hidden from Family Members, present on Privacy & Consent`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await loginAsMom(page)

    await page.goto('/family-members')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2500)
    await expect(page.getByText(KID_NAME)).toHaveCount(0)
    await page.screenshot({ path: `eyes-on-tour/coppa-s5-${label}-1-family-members-hidden.png`, fullPage: true })

    await page.goto('/settings/privacy-consent')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2500)
    await expect(page.getByText(KID_NAME).first()).toBeVisible()
    await expect(page.getByText(/pending deletion/i).first()).toBeVisible()
    await page.screenshot({ path: `eyes-on-tour/coppa-s5-${label}-2-pending-deletion.png`, fullPage: true })
  })
}
