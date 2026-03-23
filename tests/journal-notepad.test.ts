/**
 * Journal & Smart Notepad Tests (PRD-08)
 *
 * Layer 1 tests for:
 * - Journal entries table structure, types, and visibility
 * - Notepad tabs and extracted items
 * - Routing destinations and stats
 * - Feature keys
 * - Embedding pipeline for journal
 * - RLS visibility-based policies
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { JOURNAL_ENTRY_TYPES } from '@/hooks/useJournal'
import { ROUTING_DESTINATIONS } from '@/hooks/useNotepad'

const migrationPath = join(process.cwd(), 'supabase/migrations/00000000000006_journal_notepad.sql')
const migration = readFileSync(migrationPath, 'utf-8')

describe('Journal & Smart Notepad (PRD-08)', () => {
  describe('journal_entries Table', () => {
    it('should create journal_entries table', () => {
      expect(migration).toContain('CREATE TABLE public.journal_entries')
    })

    it('should have all 11 entry types in CHECK constraint', () => {
      const expectedTypes = [
        'daily_reflection', 'gratitude', 'learning_capture', 'prayer',
        'letter', 'memory', 'goal_check_in', 'dream',
        'observation', 'free_write', 'reflection_response',
      ]
      for (const type of expectedTypes) {
        expect(migration).toContain(`'${type}'`)
      }
    })

    it('should have visibility CHECK constraint', () => {
      expect(migration).toContain("'private'")
      expect(migration).toContain("'shared_parents'")
      expect(migration).toContain("'family'")
    })

    it('should have is_included_in_ai with default true', () => {
      const jeSection = migration.split('CREATE TABLE public.journal_entries')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(jeSection).toContain('is_included_in_ai BOOLEAN NOT NULL DEFAULT true')
    })

    it('should have embedding vector for semantic search', () => {
      const jeSection = migration.split('CREATE TABLE public.journal_entries')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(jeSection).toContain('embedding vector(1536)')
    })

    it('should have tags array with empty default', () => {
      expect(migration).toContain("tags TEXT[] NOT NULL DEFAULT '{}'")
    })

    it('should have RLS with visibility-based policies', () => {
      expect(migration).toContain('ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY')
      expect(migration).toContain('je_manage_own')
      expect(migration).toContain('je_select_parent')
      expect(migration).toContain('je_select_family')
    })

    it('parent policy should check shared_parents and family visibility', () => {
      expect(migration).toContain("visibility IN ('shared_parents', 'family')")
    })

    it('family policy should check family visibility only', () => {
      expect(migration).toContain("visibility = 'family'")
    })

    it('should have embedding queue trigger', () => {
      expect(migration).toContain('trg_je_queue_embedding')
    })

    it('should have created_at DESC index for chronological display', () => {
      expect(migration).toContain('idx_je_created ON public.journal_entries(created_at DESC)')
    })
  })

  describe('notepad_tabs Table', () => {
    it('should create notepad_tabs table', () => {
      expect(migration).toContain('CREATE TABLE public.notepad_tabs')
    })

    it('should have title and content columns', () => {
      const ntSection = migration.split('CREATE TABLE public.notepad_tabs')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(ntSection).toContain('title TEXT NOT NULL')
      expect(ntSection).toContain('content TEXT')
    })

    it('should have RLS for member-only access', () => {
      expect(migration).toContain('ALTER TABLE public.notepad_tabs ENABLE ROW LEVEL SECURITY')
      expect(migration).toContain('nt_manage_own')
    })
  })

  describe('notepad_extracted_items Table', () => {
    it('should create notepad_extracted_items table', () => {
      expect(migration).toContain('CREATE TABLE public.notepad_extracted_items')
    })

    it('should reference notepad_tabs with CASCADE', () => {
      expect(migration).toMatch(
        /tab_id\s+UUID\s+NOT NULL\s+REFERENCES\s+public\.notepad_tabs\(id\)\s+ON DELETE CASCADE/
      )
    })

    it('should have status CHECK constraint', () => {
      const neiSection = migration.split('CREATE TABLE public.notepad_extracted_items')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(neiSection).toContain("'pending'")
      expect(neiSection).toContain("'routed'")
      expect(neiSection).toContain("'dismissed'")
    })

    it('should have RLS inheriting from notepad_tabs', () => {
      expect(migration).toContain('ALTER TABLE public.notepad_extracted_items ENABLE ROW LEVEL SECURITY')
      expect(migration).toContain('nei_manage_via_tab')
    })
  })

  describe('notepad_routing_stats Table', () => {
    it('should create notepad_routing_stats table', () => {
      expect(migration).toContain('CREATE TABLE public.notepad_routing_stats')
    })

    it('should track destination, count, and last_routed_at', () => {
      const nrsSection = migration.split('CREATE TABLE public.notepad_routing_stats')[1]
        ?.split('CREATE TABLE')[0] ?? migration
      expect(nrsSection).toContain('destination TEXT NOT NULL')
      expect(nrsSection).toContain('count INTEGER NOT NULL DEFAULT 0')
      expect(nrsSection).toContain('last_routed_at TIMESTAMPTZ')
    })

    it('should have RLS enabled', () => {
      expect(migration).toContain('ALTER TABLE public.notepad_routing_stats ENABLE ROW LEVEL SECURITY')
    })
  })

  describe('Feature Keys', () => {
    const requiredKeys = [
      'notepad_basic',
      'notepad_voice',
      'notepad_review_route',
      'journal_basic',
      'journal_ai_tags',
    ]

    it.each(requiredKeys)('should seed feature key: %s', (key) => {
      expect(migration).toContain(`'${key}'`)
    })

    it('should have exactly 5 feature keys for Phase 07', () => {
      let count = 0
      for (const key of requiredKeys) {
        if (migration.includes(`'${key}'`)) count++
      }
      expect(count).toBe(5)
    })
  })

  describe('Journal Entry Types (Frontend)', () => {
    it('should define exactly 11 entry types', () => {
      expect(JOURNAL_ENTRY_TYPES).toHaveLength(11)
    })

    it('should have human-readable labels', () => {
      for (const type of JOURNAL_ENTRY_TYPES) {
        expect(type.label.length).toBeGreaterThan(0)
      }
    })

    it('should include free_write as a type', () => {
      expect(JOURNAL_ENTRY_TYPES.some(t => t.value === 'free_write')).toBe(true)
    })
  })

  describe('Routing Destinations (Frontend)', () => {
    it('should define at least 7 routing destinations', () => {
      expect(ROUTING_DESTINATIONS.length).toBeGreaterThanOrEqual(7)
    })

    it('should include core destinations', () => {
      const keys = ROUTING_DESTINATIONS.map(d => d.key)
      expect(keys).toContain('tasks')
      expect(keys).toContain('calendar')
      expect(keys).toContain('journal_entry')
      expect(keys).toContain('victory')
      expect(keys).toContain('guiding_stars')
      expect(keys).toContain('best_intentions')
    })
  })

  describe('Routing', () => {
    it('journal route should be registered in App.tsx', () => {
      const appContent = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf-8')
      expect(appContent).toContain('/journal')
    })
  })

  describe('RLS on ALL tables', () => {
    const tables = ['journal_entries', 'notepad_tabs', 'notepad_extracted_items', 'notepad_routing_stats']

    it.each(tables)('%s should have RLS enabled', (table) => {
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)
    })
  })
})
