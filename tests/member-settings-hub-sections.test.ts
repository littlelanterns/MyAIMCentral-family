import { describe, it, expect } from 'vitest'
import { getMemberSectionApplicability } from '../src/lib/family/memberSettingsHubSections'

describe('MEMBER-SETTINGS-HUB: getMemberSectionApplicability', () => {
  it('kids (role=member) get the real editors + kid-flavored safety monitoring', () => {
    const a = getMemberSectionApplicability('member')
    expect(a.isKidRole).toBe(true)
    expect(a.allowanceApplicable).toBe(true)
    expect(a.privacyApplicable).toBe(true)
    expect(a.safety).toBe('kid')
    expect(a.safetyShowsRecipientToggle).toBe(false)
  })

  it('additional_adult (dad) gets adult-flavored safety monitoring + the recipient toggle, no allowance/privacy', () => {
    const a = getMemberSectionApplicability('additional_adult')
    expect(a.isKidRole).toBe(false)
    expect(a.allowanceApplicable).toBe(false)
    expect(a.privacyApplicable).toBe(false)
    expect(a.safety).toBe('adult')
    expect(a.safetyShowsRecipientToggle).toBe(true)
  })

  it('special_adult gets no safety monitoring at all, no allowance/privacy', () => {
    const a = getMemberSectionApplicability('special_adult')
    expect(a.isKidRole).toBe(false)
    expect(a.allowanceApplicable).toBe(false)
    expect(a.privacyApplicable).toBe(false)
    expect(a.safety).toBe('none')
    expect(a.safetyShowsRecipientToggle).toBe(false)
  })

  it('an unexpected/unknown role degrades safely to the least-privileged (no) state', () => {
    const a = getMemberSectionApplicability('family')
    expect(a.isKidRole).toBe(false)
    expect(a.allowanceApplicable).toBe(false)
    expect(a.privacyApplicable).toBe(false)
    expect(a.safety).toBe('none')
    expect(a.safetyShowsRecipientToggle).toBe(false)
  })
})
