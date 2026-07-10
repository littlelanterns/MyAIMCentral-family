/**
 * Sidebar Sections — Worker 2 (View As Identity-Scope Architecture)
 *
 * Revision pass 2026-05-28: founder corrected the initial Worker 2 over-
 * pruning. The sidebar is NOT a tier ceiling. Tier limits flow through
 * `feature_access_v2` + `useCanAccess()`; per-kid Permission Hub
 * overrides flow through `member_feature_toggles` (Follow-Up Build E).
 * The sidebar surfaces what the shell could plausibly use; the layered
 * gating decides whether a given member can actually use it.
 *
 * What this test suite asserts:
 *   - Mom branch is FROZEN — all 7 sections + Studio/Prize Board/
 *     RewardRules present in Plan & Do.
 *   - Adult shell DROPS Studio, Prize Board, RewardRules (founder Q2
 *     mom-only) but RETAINS Journal, InnerWorkings, LifeLantern, AI
 *     Vault, BookShelf section.
 *   - Adult does NOT include Archives — Dad does not get Archives by
 *     default.
 *   - Independent shell DROPS Studio, Prize Board, RewardRules but
 *     RETAINS Touch Base, Shopping Mode, Journal, InnerWorkings,
 *     LifeLantern, AI Vault, BookShelf section, Family Feeds.
 *   - Independent does NOT include Archives.
 *   - My Rewards entry appears in Plan & Do (Adult/Independent) ONLY
 *     when `options.showMyRewards === true`.
 *   - Guided shell (Home + My Day + BookShelf) is unconditional in My
 *     Day for My Rewards specifically (GDCX, 2026-07) — Guided's primary
 *     bottom-nav "Progress" tab routes to /my-rewards regardless of
 *     showMyRewards (Convention #124), so this list (used only to feed
 *     View-As's allowedPaths, never rendered as a real Guided menu) must
 *     always include it too.
 *   - Play shell returns `[]`.
 *
 * Convention #39 (View As Identity-Scope Architecture).
 */

import { describe, it, expect } from 'vitest'
import { getSidebarSections } from '../src/components/shells/Sidebar'

describe('getSidebarSections — mom branch (FROZEN)', () => {
  it('renders all 7 mom sections regardless of showMyRewards', () => {
    const sections = getSidebarSections('mom')
    const titles = sections.map(s => s.title)
    expect(titles).toEqual([
      'Home',
      'AI & Tools',
      'BookShelf',
      'Capture & Reflect',
      'Plan & Do',
      'Grow',
      'Family',
    ])
  })

  it('mom Plan & Do still includes Studio, Prize Board, RewardRules', () => {
    const sections = getSidebarSections('mom')
    const plan = sections.find(s => s.title === 'Plan & Do')
    expect(plan).toBeDefined()
    const labels = plan!.items.map(i => i.label)
    expect(labels).toContain('Studio')
    expect(labels).toContain('Prize Board')
    expect(labels).toContain('RewardRules')
  })

  it('mom AI & Tools retains both AI Vault and Archives', () => {
    const sections = getSidebarSections('mom')
    const tools = sections.find(s => s.title === 'AI & Tools')
    expect(tools).toBeDefined()
    const labels = tools!.items.map(i => i.label)
    expect(labels).toContain('AI Vault')
    expect(labels).toContain('Archives')
  })

  it('mom branch ignores showMyRewards — mom does NOT see My Rewards', () => {
    const sectionsOn = getSidebarSections('mom', { showMyRewards: true })
    const sectionsOff = getSidebarSections('mom', { showMyRewards: false })
    const allLabelsOn = sectionsOn.flatMap(s => s.items.map(i => i.label))
    const allLabelsOff = sectionsOff.flatMap(s => s.items.map(i => i.label))
    expect(allLabelsOn).not.toContain('My Rewards')
    expect(allLabelsOff).not.toContain('My Rewards')
  })
})

describe('getSidebarSections — adult shell', () => {
  it('drops Studio, Prize Board, RewardRules from Plan & Do (founder Q2 mom-only)', () => {
    const sections = getSidebarSections('adult')
    const plan = sections.find(s => s.title === 'Plan & Do')
    expect(plan).toBeDefined()
    const labels = plan!.items.map(i => i.label)
    expect(labels).not.toContain('Studio')
    expect(labels).not.toContain('Prize Board')
    expect(labels).not.toContain('RewardRules')
  })

  it('Plan & Do retains Tasks, Calendar, Touch Base, Trackers, Lists, Shopping Mode', () => {
    const sections = getSidebarSections('adult')
    const plan = sections.find(s => s.title === 'Plan & Do')
    const labels = plan!.items.map(i => i.label)
    expect(labels).toContain('Tasks')
    expect(labels).toContain('Calendar')
    expect(labels).toContain('Touch Base')
    expect(labels).toContain('Trackers')
    expect(labels).toContain('Lists')
    expect(labels).toContain('Shopping Mode')
  })

  it('Capture & Reflect retains Journal, Reflections, Rhythms', () => {
    const sections = getSidebarSections('adult')
    const capture = sections.find(s => s.title === 'Capture & Reflect')
    expect(capture).toBeDefined()
    const labels = capture!.items.map(i => i.label)
    expect(labels).toContain('Journal')
    expect(labels).toContain('Reflections')
    expect(labels).toContain('Rhythms')
  })

  it('Grow retains Guiding Stars, BestIntentions, InnerWorkings, Victories, LifeLantern', () => {
    const sections = getSidebarSections('adult')
    const grow = sections.find(s => s.title === 'Grow')
    expect(grow).toBeDefined()
    const labels = grow!.items.map(i => i.label)
    expect(labels).toContain('Guiding Stars')
    expect(labels).toContain('BestIntentions')
    expect(labels).toContain('InnerWorkings')
    expect(labels).toContain('Victories')
    expect(labels).toContain('LifeLantern')
  })

  it('Family section retains Messages, People, Family Feeds', () => {
    const sections = getSidebarSections('adult')
    const family = sections.find(s => s.title === 'Family')
    expect(family).toBeDefined()
    const labels = family!.items.map(i => i.label)
    expect(labels).toContain('Messages')
    expect(labels).toContain('People')
    expect(labels).toContain('Family Feeds')
  })

  it('AI & Tools section restored with AI Vault, NO Archives', () => {
    const sections = getSidebarSections('adult')
    const tools = sections.find(s => s.title === 'AI & Tools')
    expect(tools).toBeDefined()
    const labels = tools!.items.map(i => i.label)
    expect(labels).toContain('AI Vault')
    expect(labels).not.toContain('Archives')
  })

  it('BookShelf section restored with Library, Study Guides, Journal Prompts', () => {
    const sections = getSidebarSections('adult')
    const bookshelf = sections.find(s => s.title === 'BookShelf')
    expect(bookshelf).toBeDefined()
    const labels = bookshelf!.items.map(i => i.label)
    expect(labels).toContain('Library')
    expect(labels).toContain('Study Guides')
    expect(labels).toContain('Journal Prompts')
  })

  it('does NOT expose Archives anywhere (Dad default)', () => {
    const sections = getSidebarSections('adult')
    const allLabels = sections.flatMap(s => s.items.map(i => i.label))
    expect(allLabels).not.toContain('Archives')
  })

  it('My Rewards is INVISIBLE when showMyRewards is unset', () => {
    const sections = getSidebarSections('adult')
    const allLabels = sections.flatMap(s => s.items.map(i => i.label))
    expect(allLabels).not.toContain('My Rewards')
  })

  it('My Rewards is INVISIBLE when showMyRewards is false (default)', () => {
    const sections = getSidebarSections('adult', { showMyRewards: false })
    const allLabels = sections.flatMap(s => s.items.map(i => i.label))
    expect(allLabels).not.toContain('My Rewards')
  })

  it('My Rewards appears in Plan & Do when showMyRewards is true', () => {
    const sections = getSidebarSections('adult', { showMyRewards: true })
    const plan = sections.find(s => s.title === 'Plan & Do')
    expect(plan).toBeDefined()
    const myRewards = plan!.items.find(i => i.label === 'My Rewards')
    expect(myRewards).toBeDefined()
    expect(myRewards!.path).toBe('/my-rewards')
    expect(myRewards!.featureKey).toBe('my_rewards_page')
  })
})

describe('getSidebarSections — independent shell', () => {
  it('drops Studio, Prize Board, RewardRules from Plan & Do (founder Q2 mom-only)', () => {
    const sections = getSidebarSections('independent')
    const plan = sections.find(s => s.title === 'Plan & Do')
    expect(plan).toBeDefined()
    const labels = plan!.items.map(i => i.label)
    expect(labels).not.toContain('Studio')
    expect(labels).not.toContain('Prize Board')
    expect(labels).not.toContain('RewardRules')
  })

  it('Plan & Do retains Tasks, Calendar, Touch Base, Trackers, Lists, Shopping Mode', () => {
    const sections = getSidebarSections('independent')
    const plan = sections.find(s => s.title === 'Plan & Do')
    const labels = plan!.items.map(i => i.label)
    expect(labels).toContain('Tasks')
    expect(labels).toContain('Calendar')
    expect(labels).toContain('Touch Base')
    expect(labels).toContain('Trackers')
    expect(labels).toContain('Lists')
    expect(labels).toContain('Shopping Mode')
  })

  it('Capture & Reflect retains Journal, Reflections, Rhythms', () => {
    const sections = getSidebarSections('independent')
    const capture = sections.find(s => s.title === 'Capture & Reflect')
    expect(capture).toBeDefined()
    const labels = capture!.items.map(i => i.label)
    expect(labels).toContain('Journal')
    expect(labels).toContain('Reflections')
    expect(labels).toContain('Rhythms')
  })

  it('Grow retains Guiding Stars, BestIntentions, InnerWorkings, Victories, LifeLantern (life_lantern_teen)', () => {
    const sections = getSidebarSections('independent')
    const grow = sections.find(s => s.title === 'Grow')
    expect(grow).toBeDefined()
    const labels = grow!.items.map(i => i.label)
    expect(labels).toContain('Guiding Stars')
    expect(labels).toContain('BestIntentions')
    expect(labels).toContain('InnerWorkings')
    expect(labels).toContain('Victories')
    expect(labels).toContain('LifeLantern')
    // Verify the teen-specific feature key was used.
    const lifeLantern = grow!.items.find(i => i.label === 'LifeLantern')
    expect(lifeLantern!.featureKey).toBe('life_lantern_teen')
  })

  it('Family section retains Messages and Family Feeds (PRD-32A demand-validation stub)', () => {
    const sections = getSidebarSections('independent')
    const family = sections.find(s => s.title === 'Family')
    expect(family).toBeDefined()
    const labels = family!.items.map(i => i.label)
    expect(labels).toContain('Messages')
    expect(labels).toContain('Family Feeds')
  })

  it('AI & Tools section restored with AI Vault, NO Archives', () => {
    const sections = getSidebarSections('independent')
    const tools = sections.find(s => s.title === 'AI & Tools')
    expect(tools).toBeDefined()
    const labels = tools!.items.map(i => i.label)
    expect(labels).toContain('AI Vault')
    expect(labels).not.toContain('Archives')
  })

  it('BookShelf section restored with Library, Study Guides, Journal Prompts', () => {
    const sections = getSidebarSections('independent')
    const bookshelf = sections.find(s => s.title === 'BookShelf')
    expect(bookshelf).toBeDefined()
    const labels = bookshelf!.items.map(i => i.label)
    expect(labels).toContain('Library')
    expect(labels).toContain('Study Guides')
    expect(labels).toContain('Journal Prompts')
  })

  it('does NOT expose Archives anywhere (teen default)', () => {
    const sections = getSidebarSections('independent')
    const allLabels = sections.flatMap(s => s.items.map(i => i.label))
    expect(allLabels).not.toContain('Archives')
  })

  it('My Rewards is INVISIBLE by default', () => {
    const sections = getSidebarSections('independent')
    const allLabels = sections.flatMap(s => s.items.map(i => i.label))
    expect(allLabels).not.toContain('My Rewards')
  })

  it('My Rewards appears in Plan & Do when toggled on', () => {
    const sections = getSidebarSections('independent', { showMyRewards: true })
    const plan = sections.find(s => s.title === 'Plan & Do')
    const myRewards = plan!.items.find(i => i.label === 'My Rewards')
    expect(myRewards).toBeDefined()
    expect(myRewards!.path).toBe('/my-rewards')
  })
})

describe('getSidebarSections — guided shell', () => {
  it('renders Home, My Day, BookShelf sections (existing structure preserved)', () => {
    const sections = getSidebarSections('guided')
    const titles = sections.map(s => s.title)
    expect(titles).toEqual(['Home', 'My Day', 'BookShelf'])
  })

  it('My Day items intact (Tasks, Messages, Journal, Reflections, Victories)', () => {
    const sections = getSidebarSections('guided')
    const myDay = sections.find(s => s.title === 'My Day')
    const labels = myDay!.items.map(i => i.label)
    expect(labels).toContain('Tasks')
    expect(labels).toContain('Messages')
    expect(labels).toContain('Journal')
    expect(labels).toContain('Reflections')
    expect(labels).toContain('Victories')
  })

  // GDCX (2026-07): unlike adult/independent (where "My Rewards" is a real,
  // conditionally-rendered More-menu entry gated by show_my_rewards), Guided's
  // primary bottom-nav "Progress" tab now routes to /my-rewards UNCONDITIONALLY
  // (Convention #124 — Progress is always present, alongside the other
  // unhideable tabs). This section list is never rendered as an actual Guided
  // menu — it exists solely to feed the View-As modal's allowedPaths set — so
  // /my-rewards must always be present here too, regardless of showMyRewards,
  // to match what a real Guided kid's Progress tab always does.
  it('My Rewards is present in My Day regardless of showMyRewards (feeds View-As allowedPaths for the unconditional Progress tab)', () => {
    const withoutToggle = getSidebarSections('guided')
    const withToggle = getSidebarSections('guided', { showMyRewards: true })

    for (const sections of [withoutToggle, withToggle]) {
      const myDay = sections.find(s => s.title === 'My Day')
      const myRewards = myDay!.items.find(i => i.label === 'My Rewards')
      expect(myRewards).toBeDefined()
      expect(myRewards!.path).toBe('/my-rewards')
    }
  })
})

describe('getSidebarSections — play shell', () => {
  it('returns empty array (PlayShell uses its own bottom nav)', () => {
    expect(getSidebarSections('play')).toEqual([])
  })

  it('still returns empty even with showMyRewards toggled on', () => {
    expect(getSidebarSections('play', { showMyRewards: true })).toEqual([])
  })
})
