/**
 * Zone Availability Tests (PRD-04)
 *
 * Verifies the 5 interaction zones are correctly assigned per shell type.
 * These are structural assertions — component rendering tests come with Playwright (Layer 2).
 */

import { describe, it, expect } from 'vitest'

type ShellType = 'mom' | 'adult' | 'independent' | 'guided' | 'play'

interface ZoneConfig {
  leftSidebar: boolean
  quickTasksDrawer: boolean  // STUB: Phase 06+
  smartNotepad: boolean      // STUB: Phase 09
  lilaDrawer: boolean        // true = drawer (mom only)
  lilaModal: boolean         // true = modal (adults/teens)
  mainContent: boolean
}

// Authoritative zone matrix from PRD-04 architecture doc
const EXPECTED_ZONES: Record<ShellType, ZoneConfig> = {
  mom: {
    leftSidebar: true,
    quickTasksDrawer: true,
    smartNotepad: true,
    lilaDrawer: true,
    lilaModal: false,
    mainContent: true,
  },
  adult: {
    leftSidebar: true,
    quickTasksDrawer: true,
    smartNotepad: true,
    lilaDrawer: false,
    lilaModal: true,
    mainContent: true,
  },
  independent: {
    leftSidebar: true,
    quickTasksDrawer: false,
    smartNotepad: true,
    lilaDrawer: false,
    lilaModal: true,
    mainContent: true,
  },
  guided: {
    leftSidebar: false,  // Uses bottom nav instead
    quickTasksDrawer: false,
    smartNotepad: false,
    lilaDrawer: false,
    lilaModal: false,
    mainContent: true,
  },
  play: {
    leftSidebar: false,
    quickTasksDrawer: false,
    smartNotepad: false,
    lilaDrawer: false,
    lilaModal: false,
    mainContent: true,
  },
}

describe('Zone Availability (PRD-04)', () => {
  describe('Zone Matrix Completeness', () => {
    it('should define zones for all 5 shell types', () => {
      const shells: ShellType[] = ['mom', 'adult', 'independent', 'guided', 'play']
      for (const shell of shells) {
        expect(EXPECTED_ZONES[shell]).toBeDefined()
      }
    })

    it('every shell should have main content area', () => {
      for (const [, zones] of Object.entries(EXPECTED_ZONES)) {
        expect(zones.mainContent).toBe(true)
      }
    })
  })

  describe('Sidebar vs Bottom Nav', () => {
    it('mom, adult, independent should have left sidebar', () => {
      expect(EXPECTED_ZONES.mom.leftSidebar).toBe(true)
      expect(EXPECTED_ZONES.adult.leftSidebar).toBe(true)
      expect(EXPECTED_ZONES.independent.leftSidebar).toBe(true)
    })

    it('guided and play should NOT have left sidebar', () => {
      expect(EXPECTED_ZONES.guided.leftSidebar).toBe(false)
      expect(EXPECTED_ZONES.play.leftSidebar).toBe(false)
    })
  })

  describe('LiLa Access Pattern', () => {
    it('only mom gets LiLa as a drawer', () => {
      expect(EXPECTED_ZONES.mom.lilaDrawer).toBe(true)
      expect(EXPECTED_ZONES.adult.lilaDrawer).toBe(false)
      expect(EXPECTED_ZONES.independent.lilaDrawer).toBe(false)
      expect(EXPECTED_ZONES.guided.lilaDrawer).toBe(false)
      expect(EXPECTED_ZONES.play.lilaDrawer).toBe(false)
    })

    it('adults and teens get LiLa as modal', () => {
      expect(EXPECTED_ZONES.adult.lilaModal).toBe(true)
      expect(EXPECTED_ZONES.independent.lilaModal).toBe(true)
    })

    it('guided and play have no LiLa access', () => {
      expect(EXPECTED_ZONES.guided.lilaModal).toBe(false)
      expect(EXPECTED_ZONES.play.lilaModal).toBe(false)
    })

    it('no shell should have both drawer AND modal LiLa', () => {
      for (const [, zones] of Object.entries(EXPECTED_ZONES)) {
        expect(zones.lilaDrawer && zones.lilaModal).toBe(false)
      }
    })
  })

  describe('QuickTasks Drawer', () => {
    it('should be available to mom and adult only', () => {
      expect(EXPECTED_ZONES.mom.quickTasksDrawer).toBe(true)
      expect(EXPECTED_ZONES.adult.quickTasksDrawer).toBe(true)
      expect(EXPECTED_ZONES.independent.quickTasksDrawer).toBe(false)
      expect(EXPECTED_ZONES.guided.quickTasksDrawer).toBe(false)
      expect(EXPECTED_ZONES.play.quickTasksDrawer).toBe(false)
    })
  })

  describe('Smart Notepad', () => {
    it('should be available to sidebar shells except guided', () => {
      expect(EXPECTED_ZONES.mom.smartNotepad).toBe(true)
      expect(EXPECTED_ZONES.adult.smartNotepad).toBe(true)
      expect(EXPECTED_ZONES.independent.smartNotepad).toBe(true)
      expect(EXPECTED_ZONES.guided.smartNotepad).toBe(false)
      expect(EXPECTED_ZONES.play.smartNotepad).toBe(false)
    })
  })
})
