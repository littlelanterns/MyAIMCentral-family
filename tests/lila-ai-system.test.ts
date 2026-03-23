/**
 * LiLa AI System Tests (PRD-05, PRD-05C)
 *
 * Layer 1 tests for:
 * - Conversation and message table structure
 * - 40+ guided mode seed data
 * - Crisis detection (Layer 1 keyword matching)
 * - Safe Harbor privacy (parent cannot read safe_harbor conversations)
 * - Container type per shell (drawer vs modal)
 * - Feature keys
 * - Model tier routing (Sonnet vs Haiku)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { detectCrisis, CRISIS_KEYWORDS, CRISIS_RESPONSE } from '@/hooks/useLila'

const migrationPath = join(process.cwd(), 'supabase/migrations/00000000000007_lila_ai_system.sql')
const migration = readFileSync(migrationPath, 'utf-8')

describe('LiLa AI System (PRD-05, PRD-05C)', () => {
  describe('lila_guided_modes Table', () => {
    it('should create lila_guided_modes table', () => {
      expect(migration).toContain('CREATE TABLE public.lila_guided_modes')
    })

    it('should have mode_key as UNIQUE', () => {
      expect(migration).toContain('mode_key TEXT NOT NULL UNIQUE')
    })

    it('should enforce model_tier CHECK (sonnet, haiku)', () => {
      expect(migration).toMatch(/model_tier.*CHECK.*'sonnet'.*'haiku'/)
    })

    it('should have RLS enabled', () => {
      expect(migration).toContain('ALTER TABLE public.lila_guided_modes ENABLE ROW LEVEL SECURITY')
    })
  })

  describe('lila_conversations Table', () => {
    it('should create lila_conversations table', () => {
      expect(migration).toContain('CREATE TABLE public.lila_conversations')
    })

    it('should have container_type CHECK (drawer, modal)', () => {
      expect(migration).toMatch(/container_type.*CHECK.*'drawer'.*'modal'/)
    })

    it('should have status CHECK (active, archived, deleted)', () => {
      expect(migration).toMatch(/status.*CHECK.*'active'.*'archived'.*'deleted'/)
    })

    it('should have is_safe_harbor flag', () => {
      expect(migration).toContain('is_safe_harbor BOOLEAN NOT NULL DEFAULT false')
    })

    it('should have safety_scanned flag', () => {
      expect(migration).toContain('safety_scanned BOOLEAN NOT NULL DEFAULT false')
    })

    it('parent RLS policy should exclude safe_harbor conversations', () => {
      expect(migration).toContain('is_safe_harbor = false')
    })
  })

  describe('lila_messages Table', () => {
    it('should create lila_messages table', () => {
      expect(migration).toContain('CREATE TABLE public.lila_messages')
    })

    it('should have role CHECK (user, assistant, system)', () => {
      expect(migration).toMatch(/role.*CHECK.*'user'.*'assistant'.*'system'/)
    })

    it('should have metadata JSONB for persona attribution', () => {
      expect(migration).toContain('metadata JSONB')
    })

    it('should have safety_scanned flag for Layer 2 processing', () => {
      const lmSection = migration.split('CREATE TABLE public.lila_messages')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(lmSection).toContain('safety_scanned BOOLEAN NOT NULL DEFAULT false')
    })

    it('should index unscanned messages for async processing', () => {
      expect(migration).toContain('idx_lm_safety')
      expect(migration).toContain('WHERE safety_scanned = false')
    })
  })

  describe('lila_tool_permissions Table', () => {
    it('should create lila_tool_permissions table', () => {
      expect(migration).toContain('CREATE TABLE public.lila_tool_permissions')
    })

    it('should reference lila_guided_modes.mode_key', () => {
      expect(migration).toContain('REFERENCES public.lila_guided_modes(mode_key)')
    })

    it('should have RLS for parent management', () => {
      expect(migration).toContain('ltp_manage_parent')
    })
  })

  describe('lila_member_preferences Table', () => {
    it('should create lila_member_preferences table', () => {
      expect(migration).toContain('CREATE TABLE public.lila_member_preferences')
    })

    it('should have tone CHECK (warm, professional, casual)', () => {
      expect(migration).toMatch(/tone.*CHECK.*'warm'.*'professional'.*'casual'/)
    })

    it('should have response_length CHECK (concise, balanced, detailed)', () => {
      expect(migration).toMatch(/response_length.*CHECK.*'concise'.*'balanced'.*'detailed'/)
    })

    it('should have UNIQUE constraint on (family_id, member_id)', () => {
      expect(migration).toContain('UNIQUE INDEX idx_lmp_family_member')
    })
  })

  describe('ai_usage_tracking Table', () => {
    it('should create ai_usage_tracking table', () => {
      expect(migration).toContain('CREATE TABLE public.ai_usage_tracking')
    })

    it('should track tokens_used and estimated_cost', () => {
      expect(migration).toContain('tokens_used INTEGER NOT NULL')
      expect(migration).toContain('estimated_cost DECIMAL NOT NULL')
    })
  })

  describe('Guided Mode Seeds', () => {
    // Core modes
    const coreModes = ['help', 'assist', 'optimizer', 'general']

    it.each(coreModes)('should seed core mode: %s', (mode) => {
      expect(migration).toContain(`'${mode}'`)
    })

    // Relationship modes
    const relationshipModes = [
      'quality_time', 'gifts', 'observe_serve', 'words_affirmation',
      'gratitude', 'cyrano', 'higgins_say', 'higgins_navigate',
    ]

    it.each(relationshipModes)('should seed relationship mode: %s', (mode) => {
      expect(migration).toContain(`'${mode}'`)
    })

    // Safe Harbor modes
    const safeHarborModes = [
      'safe_harbor', 'safe_harbor_guided', 'safe_harbor_orientation', 'safe_harbor_literacy',
    ]

    it.each(safeHarborModes)('should seed safe harbor mode: %s', (mode) => {
      expect(migration).toContain(`'${mode}'`)
    })

    // ThoughtSift — 5 SEPARATE tools
    const thoughtSiftModes = [
      'board_of_directors', 'perspective_shifter', 'decision_guide', 'mediator', 'translator',
    ]

    it('should have exactly 5 ThoughtSift modes (separate tools)', () => {
      let count = 0
      for (const mode of thoughtSiftModes) {
        if (migration.includes(`'${mode}'`)) count++
      }
      expect(count).toBe(5)
    })

    // BigPlans modes
    const bigPlansModes = [
      'bigplans_planning', 'bigplans_friction_finder', 'bigplans_checkin',
      'bigplans_system_design_trial', 'bigplans_deployed_component',
    ]

    it.each(bigPlansModes)('should seed BigPlans mode: %s', (mode) => {
      expect(migration).toContain(`'${mode}'`)
    })

    it('should seed at least 35 guided modes total', () => {
      const insertCount = (migration.match(/INSERT INTO public\.lila_guided_modes/g) ?? []).length
      // Count individual value tuples (lines starting with ('
      const valueLines = migration.match(/\('[a-z_]+'/g) ?? []
      expect(valueLines.length).toBeGreaterThanOrEqual(35)
    })
  })

  describe('Model Tier Routing', () => {
    it('translator should use haiku (single-turn rewrite)', () => {
      // Find the translator INSERT line
      const translatorLine = migration.split('\n').find(l => l.includes("'translator'"))
      expect(translatorLine).toContain("'haiku'")
    })

    it('safe_harbor_guided should use haiku (children)', () => {
      const line = migration.split('\n').find(l => l.includes("'safe_harbor_guided'"))
      expect(line).toContain("'haiku'")
    })

    it('safe_harbor_literacy should use haiku', () => {
      const line = migration.split('\n').find(l => l.includes("'safe_harbor_literacy'"))
      expect(line).toContain("'haiku'")
    })

    it('safe_harbor (adult) should use sonnet for ethical reasoning', () => {
      const lines = migration.split('\n').filter(l => l.includes("'safe_harbor'") && !l.includes('safe_harbor_'))
      expect(lines.some(l => l.includes("'sonnet'"))).toBe(true)
    })

    it('cyrano should use sonnet for emotional intelligence', () => {
      const line = migration.split('\n').find(l => l.includes("'cyrano'"))
      expect(line).toContain("'sonnet'")
    })
  })

  describe('Crisis Detection (Layer 1)', () => {
    it('should detect crisis keywords', () => {
      expect(detectCrisis('I want to kill myself')).toBe(true)
      expect(detectCrisis('thinking about suicide')).toBe(true)
      expect(detectCrisis('he is abusing me')).toBe(true)
      expect(detectCrisis('cutting myself')).toBe(true)
    })

    it('should not false-positive on normal messages', () => {
      expect(detectCrisis('I had a great day today')).toBe(false)
      expect(detectCrisis('The kids finished their homework')).toBe(false)
      expect(detectCrisis('What should we have for dinner?')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(detectCrisis('I WANT TO DIE')).toBe(true)
      expect(detectCrisis('SuIcIdE')).toBe(true)
    })

    it('should have crisis keywords defined', () => {
      expect(CRISIS_KEYWORDS.length).toBeGreaterThan(0)
    })

    it('crisis response should include 988 lifeline', () => {
      expect(CRISIS_RESPONSE).toContain('988')
    })

    it('crisis response should include Crisis Text Line', () => {
      expect(CRISIS_RESPONSE).toContain('741741')
    })

    it('crisis response should include NDVH', () => {
      expect(CRISIS_RESPONSE).toContain('1-800-799-7233')
    })

    it('crisis response should include 911', () => {
      expect(CRISIS_RESPONSE).toContain('911')
    })
  })

  describe('Container Type per Shell', () => {
    it('mom shell should use drawer container type', () => {
      // MomShell renders the LilaDrawer component
      const momShell = readFileSync(join(process.cwd(), 'src/components/shells/MomShell.tsx'), 'utf-8')
      expect(momShell).toContain('LilaDrawer')

      // LilaDrawer creates conversations with container_type: 'drawer'
      const lilaDrawer = readFileSync(join(process.cwd(), 'src/components/lila/LilaDrawer.tsx'), 'utf-8')
      expect(lilaDrawer).toContain("container_type: 'drawer'")
    })
  })

  describe('Feature Keys', () => {
    const requiredKeys = [
      'lila_drawer', 'lila_help', 'lila_assist', 'lila_modal_access',
      'lila_optimizer', 'optimizer_templates', 'optimizer_context_presets', 'optimizer_credits',
    ]

    it.each(requiredKeys)('should seed feature key: %s', (key) => {
      expect(migration).toContain(`'${key}'`)
    })
  })

  describe('Safe Harbor Privacy', () => {
    it('parent policy on conversations should exclude safe_harbor', () => {
      // The lc_select_parent policy should have is_safe_harbor = false
      const parentPolicy = migration.split('lc_select_parent')[1]?.split(';')[0] ?? ''
      expect(parentPolicy).toContain('is_safe_harbor = false')
    })

    it('parent policy on messages should exclude safe_harbor conversations', () => {
      // The lm_select_via_conversation policy should also check safe_harbor
      const msgPolicy = migration.split('lm_select_via_conversation')[1]?.split(';')[0] ?? ''
      expect(msgPolicy).toContain('is_safe_harbor = false')
    })
  })

  describe('RLS on ALL tables', () => {
    const tables = [
      'lila_guided_modes', 'lila_conversations', 'lila_messages',
      'lila_tool_permissions', 'lila_member_preferences', 'ai_usage_tracking',
    ]

    it.each(tables)('%s should have RLS enabled', (table) => {
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)
    })
  })
})
