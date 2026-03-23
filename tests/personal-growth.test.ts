/**
 * Personal Growth Foundation Tests (PRD-06, PRD-07)
 *
 * Layer 1 tests for:
 * - GuidingStars data model and feature keys
 * - BestIntentions with iteration tracking
 * - InnerWorkings (self_knowledge) categories and sharing
 * - Embedding pipeline trigger registration
 * - is_included_in_ai pattern compliance
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  SELF_KNOWLEDGE_CATEGORIES,
} from '@/hooks/useSelfKnowledge'

// Read the migration to verify table structure
const migrationPath = join(process.cwd(), 'supabase/migrations/00000000000005_personal_growth_foundation.sql')
const migration = readFileSync(migrationPath, 'utf-8')

describe('Personal Growth Foundation (PRD-06, PRD-07)', () => {
  describe('GuidingStars Table (PRD-06)', () => {
    it('should create guiding_stars table', () => {
      expect(migration).toContain('CREATE TABLE public.guiding_stars')
    })

    it('should have is_included_in_ai column with default true', () => {
      expect(migration).toMatch(/is_included_in_ai\s+BOOLEAN\s+NOT NULL\s+DEFAULT true/)
    })

    it('should have embedding vector column for semantic search', () => {
      expect(migration).toContain('embedding vector(1536)')
    })

    it('should have RLS enabled', () => {
      expect(migration).toContain('ALTER TABLE public.guiding_stars ENABLE ROW LEVEL SECURITY')
    })

    it('should have embedding queue trigger', () => {
      expect(migration).toContain('trg_gs_queue_embedding')
      expect(migration).toContain('util.queue_embedding_job()')
    })

    it('should allow member to manage own and parent to read', () => {
      expect(migration).toContain('gs_manage_own')
      expect(migration).toContain('gs_select_parent')
    })

    it('should have source column with manual default', () => {
      expect(migration).toMatch(/source\s+TEXT\s+NOT NULL\s+DEFAULT\s+'manual'/)
    })
  })

  describe('BestIntentions Table (PRD-06)', () => {
    it('should create best_intentions table', () => {
      expect(migration).toContain('CREATE TABLE public.best_intentions')
    })

    it('should track celebration_count and iteration_count', () => {
      expect(migration).toContain('celebration_count INTEGER NOT NULL DEFAULT 0')
      expect(migration).toContain('iteration_count INTEGER NOT NULL DEFAULT 0')
    })

    it('should have tags array column', () => {
      expect(migration).toContain('tags TEXT[]')
    })

    it('should have embedding and is_included_in_ai', () => {
      // Check both tables have the pattern
      const biSection = migration.split('CREATE TABLE public.best_intentions')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(biSection).toContain('is_included_in_ai BOOLEAN NOT NULL DEFAULT true')
      expect(biSection).toContain('embedding vector(1536)')
    })

    it('should have last_reset_at for periodic resets', () => {
      expect(migration).toContain('last_reset_at TIMESTAMPTZ')
    })
  })

  describe('IntentionIterations Table (PRD-06)', () => {
    it('should create intention_iterations table', () => {
      expect(migration).toContain('CREATE TABLE public.intention_iterations')
    })

    it('should reference best_intentions with CASCADE delete', () => {
      expect(migration).toMatch(
        /intention_id\s+UUID\s+NOT NULL\s+REFERENCES\s+public\.best_intentions\(id\)\s+ON DELETE CASCADE/
      )
    })

    it('should have optional victory_reference', () => {
      expect(migration).toContain('victory_reference UUID')
    })

    it('should have RLS inheriting from best_intentions', () => {
      expect(migration).toContain('ALTER TABLE public.intention_iterations ENABLE ROW LEVEL SECURITY')
      expect(migration).toContain('ii_select_via_intention')
    })
  })

  describe('SelfKnowledge Table (PRD-07)', () => {
    it('should create self_knowledge table', () => {
      expect(migration).toContain('CREATE TABLE public.self_knowledge')
    })

    it('should enforce valid categories via CHECK constraint', () => {
      expect(migration).toContain("'personality'")
      expect(migration).toContain("'strengths'")
      expect(migration).toContain("'growth_areas'")
      expect(migration).toContain("'communication_style'")
      expect(migration).toContain("'how_i_work'")
    })

    it('should have sharing controls (share_with_mom, share_with_dad)', () => {
      expect(migration).toContain('share_with_mom BOOLEAN NOT NULL DEFAULT true')
      expect(migration).toContain('share_with_dad BOOLEAN NOT NULL DEFAULT false')
    })

    it('should enforce source_type CHECK constraint', () => {
      expect(migration).toContain("'manual'")
      expect(migration).toContain("'upload'")
      expect(migration).toContain("'lila_guided'")
      expect(migration).toContain("'bulk_add'")
    })

    it('should have RLS with visibility-based policies', () => {
      expect(migration).toContain('sk_manage_own')
      expect(migration).toContain('sk_select_mom')
      expect(migration).toContain('sk_select_dad')
    })

    it('mom RLS policy should check share_with_mom flag', () => {
      expect(migration).toContain('share_with_mom = true')
    })

    it('dad RLS policy should check share_with_dad flag and role', () => {
      expect(migration).toContain('share_with_dad = true')
      expect(migration).toContain("role = 'additional_adult'")
    })
  })

  describe('Feature Keys (PRD-06, PRD-07)', () => {
    const requiredKeys = [
      'guiding_stars_basic',
      'guiding_stars_ai_craft',
      'best_intentions',
      'innerworkings_basic',
      'innerworkings_upload',
      'innerworkings_discovery',
      'innerworkings_context',
    ]

    it.each(requiredKeys)('should seed feature key: %s', (key) => {
      expect(migration).toContain(`'${key}'`)
    })

    it('should have exactly 7 feature keys for Phase 06', () => {
      let count = 0
      for (const key of requiredKeys) {
        if (migration.includes(`'${key}'`)) count++
      }
      expect(count).toBe(7)
    })
  })

  describe('Self Knowledge Categories (Frontend)', () => {
    it('should define exactly 5 categories', () => {
      expect(SELF_KNOWLEDGE_CATEGORIES).toHaveLength(5)
    })

    it('should include all required categories', () => {
      const values = SELF_KNOWLEDGE_CATEGORIES.map(c => c.value)
      expect(values).toContain('personality')
      expect(values).toContain('strengths')
      expect(values).toContain('growth_areas')
      expect(values).toContain('communication_style')
      expect(values).toContain('how_i_work')
    })

    it('should have human-readable labels for each category', () => {
      for (const cat of SELF_KNOWLEDGE_CATEGORIES) {
        expect(cat.label).toBeTruthy()
        expect(cat.label.length).toBeGreaterThan(0)
      }
    })
  })

  describe('is_included_in_ai Pattern Compliance', () => {
    const tablesWithAIToggle = ['guiding_stars', 'best_intentions', 'self_knowledge']

    it.each(tablesWithAIToggle)('%s should have is_included_in_ai column', (table) => {
      const tableSection = migration.split(`CREATE TABLE public.${table}`)[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(tableSection).toContain('is_included_in_ai')
    })
  })

  describe('Embedding Pipeline', () => {
    const tablesWithEmbedding = ['guiding_stars', 'best_intentions', 'self_knowledge']

    it.each(tablesWithEmbedding)('%s should have embedding queue trigger', (table) => {
      expect(migration).toContain(`ON public.${table}`)
      expect(migration).toContain('util.queue_embedding_job()')
    })

    it('should use vector(1536) for OpenAI text-embedding-3-small', () => {
      const matches = migration.match(/vector\(1536\)/g)
      // 3 tables with embeddings
      expect(matches?.length).toBeGreaterThanOrEqual(3)
    })

    it('should have IVFFlat indexes on embedding columns', () => {
      expect(migration).toContain('USING ivfflat')
    })
  })

  describe('Routing', () => {
    it('guiding-stars route should match sidebar nav', () => {
      // Sidebar.tsx references /guiding-stars path
      // App.tsx should register this route
      const appContent = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf-8')
      expect(appContent).toContain('/guiding-stars')
    })

    it('inner-workings route should match sidebar nav', () => {
      const appContent = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf-8')
      expect(appContent).toContain('/inner-workings')
    })
  })
})
