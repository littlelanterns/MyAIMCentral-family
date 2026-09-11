/**
 * STUDIO-EXPERIENCE ST-A — unit pins for the pure logic the shelf-truth
 * cleanup introduced.
 *
 * 1. isChildMember() — the ONE member-classification predicate (F-20).
 *    MeetingSetupWizard used to key on `relationship === 'child'` alone and
 *    silently dropped every kid step when relationship was NULL; the
 *    ListReveal wizard used to offer Special Adults on kids' earning boards
 *    (rider (b)). These cases pin both failure modes.
 *
 * 2. normalizeRestate() — the NLC restate grammar fix ("It sounds like you
 *    want to Mom wants to track…" — B1 audit finding).
 */
import { describe, it, expect } from 'vitest'
import { isChildMember, isOptInAdult } from '../src/lib/members/isChildMember'
import { normalizeRestate } from '../src/components/studio/NaturalLanguageComposition'

describe('isChildMember', () => {
  it('accepts relationship=child (authoritative signal)', () => {
    expect(isChildMember({ id: '1', relationship: 'child', role: 'member' })).toBe(true)
  })

  it('accepts a NULL-relationship kid via the role fallback (the F-20 silent-loss case)', () => {
    expect(isChildMember({ id: '1', relationship: null, role: 'member' })).toBe(true)
  })

  it('accepts a NULL-relationship kid via dashboard_mode fallback', () => {
    expect(isChildMember({ id: '1', relationship: null, role: undefined, dashboard_mode: 'guided' })).toBe(true)
    expect(isChildMember({ id: '1', relationship: null, dashboard_mode: 'play' })).toBe(true)
    expect(isChildMember({ id: '1', relationship: null, dashboard_mode: 'independent' })).toBe(true)
  })

  it('NEVER classifies Special Adults as children, regardless of other fields', () => {
    expect(isChildMember({ id: '1', role: 'special_adult', relationship: null })).toBe(false)
    expect(isChildMember({ id: '1', role: 'special_adult', dashboard_mode: 'guided' })).toBe(false)
    expect(isChildMember({ id: '1', role: 'member', relationship: 'special' })).toBe(false)
  })

  it('never classifies parents / the hidden family identity as children', () => {
    expect(isChildMember({ id: '1', role: 'primary_parent' })).toBe(false)
    expect(isChildMember({ id: '1', role: 'additional_adult' })).toBe(false)
    expect(isChildMember({ id: '1', role: 'family' })).toBe(false)
    expect(isChildMember({ id: '1', role: 'member', relationship: 'spouse' })).toBe(false)
  })

  it('excludes inactive and out-of-nest members', () => {
    expect(isChildMember({ id: '1', relationship: 'child', is_active: false })).toBe(false)
    expect(isChildMember({ id: '1', relationship: 'child', out_of_nest: true })).toBe(false)
  })
})

describe('isOptInAdult', () => {
  it('allows mom and additional adults as explicit board opt-ins', () => {
    expect(isOptInAdult({ id: '1', role: 'primary_parent' })).toBe(true)
    expect(isOptInAdult({ id: '1', role: 'additional_adult' })).toBe(true)
  })

  it('NEVER allows Special Adults — not even as opt-ins (rider (b))', () => {
    expect(isOptInAdult({ id: '1', role: 'special_adult' })).toBe(false)
  })

  it('never allows kids or the family identity', () => {
    expect(isOptInAdult({ id: '1', role: 'member' })).toBe(false)
    expect(isOptInAdult({ id: '1', role: 'family' })).toBe(false)
  })
})

describe('normalizeRestate', () => {
  it('strips the audited "Mom wants to" third-person lead-in', () => {
    expect(normalizeRestate('Mom wants to track potty trips for Ruthie'))
      .toBe('track potty trips for Ruthie')
  })

  it('strips "She wants to" and "You want to" variants', () => {
    expect(normalizeRestate('She wants to set up a morning routine'))
      .toBe('set up a morning routine')
    expect(normalizeRestate('You want to create a chore board'))
      .toBe('create a chore board')
  })

  it('leaves a clean verb phrase untouched (except case)', () => {
    expect(normalizeRestate('track potty trips with a sticker chart'))
      .toBe('track potty trips with a sticker chart')
    expect(normalizeRestate('Create a shared grocery list'))
      .toBe('create a shared grocery list')
  })

  // ST-B eyes-on tour finding (2026-09-11): on the none_confident path the
  // router answered the ROUTING question in this field, rendering the
  // mom-facing sentence "you want to this phrase doesn't match any family
  // management wizard. Please describe...". The frame must never break.
  it('falls back to mom\'s own words when the model returns meta-commentary', () => {
    const momText = 'xylophone tuesday sandwich protocol'
    expect(
      normalizeRestate(
        "This phrase doesn't match any family management wizard. Please describe what you'd like to set up.",
        momText,
      ),
    ).toBe(momText)
  })

  it('rejects multi-sentence and over-long descriptions in favour of mom\'s words', () => {
    expect(normalizeRestate('Set up a chart. Then assign it to a child.', 'a potty chart'))
      .toBe('a potty chart')
    expect(normalizeRestate('x'.repeat(200), 'a potty chart')).toBe('a potty chart')
  })

  it('still returns the model phrase when it is a usable verb phrase', () => {
    expect(normalizeRestate('track potty trips for Ruthie', 'some raw mom text'))
      .toBe('track potty trips for Ruthie')
  })

  it('degrades safely when there is no mom text to fall back to', () => {
    expect(normalizeRestate("this doesn't match any wizard", '')).toBe("this doesn't match any wizard")
  })
})
