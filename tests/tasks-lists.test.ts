/**
 * Tasks, Lists & Studio Queue Tests (PRD-09A, PRD-09B, PRD-17)
 *
 * Layer 1 tests for:
 * - 15 table structures (tasks, templates, completions, claims, lists, shares, studio_queue)
 * - Task types, statuses, priorities
 * - List types and sharing permissions
 * - Studio queue intake funnel
 * - Feature keys
 * - RLS on all tables
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const migrationPath = join(process.cwd(), 'supabase/migrations/00000000000008_tasks_lists.sql')
const migration = readFileSync(migrationPath, 'utf-8')

describe('Tasks, Lists & Studio Queue (PRD-09A, PRD-09B, PRD-17)', () => {
  describe('tasks Table (Core)', () => {
    it('should create tasks table', () => {
      expect(migration).toContain('CREATE TABLE public.tasks')
    })

    it('should have task_type CHECK (task, routine, opportunity, habit)', () => {
      const tasksSection = migration.split('CREATE TABLE public.tasks')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(tasksSection).toContain("'task'")
      expect(tasksSection).toContain("'routine'")
      expect(tasksSection).toContain("'opportunity'")
      expect(tasksSection).toContain("'habit'")
    })

    it('should have status CHECK (pending, in_progress, completed, cancelled, paused)', () => {
      const tasksSection = migration.split('CREATE TABLE public.tasks')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(tasksSection).toContain("'pending'")
      expect(tasksSection).toContain("'in_progress'")
      expect(tasksSection).toContain("'completed'")
      expect(tasksSection).toContain("'cancelled'")
      expect(tasksSection).toContain("'paused'")
    })

    it('should have priority CHECK (now, next, optional, someday)', () => {
      expect(migration).toMatch(/priority.*CHECK.*'now'.*'next'.*'optional'.*'someday'/)
    })

    it('should have recurrence_details JSONB for RRULE', () => {
      const tasksSection = migration.split('CREATE TABLE public.tasks')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(tasksSection).toContain('recurrence_details JSONB')
    })

    it('should have related_plan_id for BigPlans linkage', () => {
      expect(migration).toContain('related_plan_id UUID')
    })

    it('should have source column for origin tracking', () => {
      const tasksSection = migration.split('CREATE TABLE public.tasks')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(tasksSection).toContain("source TEXT NOT NULL DEFAULT 'manual'")
    })
  })

  describe('task_completions Table', () => {
    it('should create task_completions table', () => {
      expect(migration).toContain('CREATE TABLE public.task_completions')
    })

    it('should have approval_status CHECK', () => {
      expect(migration).toMatch(/approval_status.*CHECK.*'pending'.*'approved'.*'rejected'/)
    })

    it('should have evidence JSONB', () => {
      expect(migration).toContain('evidence JSONB')
    })

    it('should have separate insert and approve RLS policies', () => {
      expect(migration).toContain('tc_insert_own')
      expect(migration).toContain('tc_approve_parent')
    })
  })

  describe('Task Templates', () => {
    it('should create task_templates table', () => {
      expect(migration).toContain('CREATE TABLE public.task_templates')
    })

    it('should create task_template_sections table', () => {
      expect(migration).toContain('CREATE TABLE public.task_template_sections')
    })

    it('should create task_template_steps table', () => {
      expect(migration).toContain('CREATE TABLE public.task_template_steps')
    })

    it('template_sections should reference templates with CASCADE', () => {
      expect(migration).toMatch(
        /template_id\s+UUID\s+NOT NULL\s+REFERENCES\s+public\.task_templates\(id\)\s+ON DELETE CASCADE/
      )
    })

    it('template_steps should reference sections with CASCADE', () => {
      expect(migration).toMatch(
        /section_id\s+UUID\s+NOT NULL\s+REFERENCES\s+public\.task_template_sections\(id\)\s+ON DELETE CASCADE/
      )
    })
  })

  describe('Task Claims (Opportunities)', () => {
    it('should create task_claims table', () => {
      expect(migration).toContain('CREATE TABLE public.task_claims')
    })

    it('should have status CHECK (claimed, completed, released)', () => {
      const claimsSection = migration.split('CREATE TABLE public.task_claims')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(claimsSection).toContain("'claimed'")
      expect(claimsSection).toContain("'completed'")
      expect(claimsSection).toContain("'released'")
    })
  })

  describe('Lists (PRD-09B)', () => {
    it('should create lists table', () => {
      expect(migration).toContain('CREATE TABLE public.lists')
    })

    it('should have 6 list types', () => {
      const listsSection = migration.split('CREATE TABLE public.lists')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(listsSection).toContain("'simple'")
      expect(listsSection).toContain("'checklist'")
      expect(listsSection).toContain("'reference'")
      expect(listsSection).toContain("'template'")
      expect(listsSection).toContain("'randomizer'")
      expect(listsSection).toContain("'backburner'")
    })

    it('should have reveal_type for gamification visuals', () => {
      expect(migration).toContain('reveal_type TEXT')
    })
  })

  describe('List Items', () => {
    it('should create list_items table', () => {
      expect(migration).toContain('CREATE TABLE public.list_items')
    })

    it('should have section_name for grouping', () => {
      expect(migration).toContain('section_name TEXT')
    })

    it('should have sort_order for manual ordering', () => {
      expect(migration).toContain('sort_order INTEGER NOT NULL DEFAULT 0')
    })

    it('should have checked boolean with default false', () => {
      const liSection = migration.split('CREATE TABLE public.list_items')[1]
        ?.split('CREATE TABLE')[0] ?? ''
      expect(liSection).toContain('checked BOOLEAN NOT NULL DEFAULT false')
    })
  })

  describe('List Shares', () => {
    it('should create list_shares table', () => {
      expect(migration).toContain('CREATE TABLE public.list_shares')
    })

    it('should have permission CHECK (view, edit)', () => {
      expect(migration).toMatch(/permission.*CHECK.*'view'.*'edit'/)
    })
  })

  describe('Studio Queue (PRD-17)', () => {
    it('should create studio_queue table', () => {
      expect(migration).toContain('CREATE TABLE public.studio_queue')
    })

    it('should have destination for routing', () => {
      expect(migration).toContain('destination TEXT')
    })

    it('should have source for origin tracking', () => {
      const sqSection = migration.split('CREATE TABLE public.studio_queue')[1]
        ?.split('CREATE TABLE')[0] ?? migration
      expect(sqSection).toContain('source TEXT NOT NULL')
    })

    it('should have mindsweep_confidence CHECK (PRD-17B)', () => {
      expect(migration).toMatch(/mindsweep_confidence.*CHECK.*'high'.*'medium'.*'low'/)
    })

    it('should have batch_id for batch processing', () => {
      expect(migration).toContain('batch_id UUID')
    })

    it('should have processed_at and dismissed_at for status tracking', () => {
      expect(migration).toContain('processed_at TIMESTAMPTZ')
      expect(migration).toContain('dismissed_at TIMESTAMPTZ')
    })

    it('should index unprocessed items for queue modal', () => {
      expect(migration).toContain('idx_sq_unprocessed')
      expect(migration).toContain('WHERE processed_at IS NULL AND dismissed_at IS NULL')
    })
  })

  describe('Feature Keys', () => {
    const taskKeys = [
      'tasks_basic', 'tasks_views_full', 'tasks_family_assignment',
      'tasks_routines', 'tasks_opportunities', 'tasks_sequential',
      'tasks_task_breaker_text', 'tasks_task_breaker_image',
      'tasks_templates', 'tasks_pomodoro',
    ]

    const queueKeys = [
      'studio_queue', 'queue_modal', 'queue_quick_mode',
      'routing_strip', 'queue_batch_processing',
    ]

    it.each(taskKeys)('should seed task feature key: %s', (key) => {
      expect(migration).toContain(`'${key}'`)
    })

    it.each(queueKeys)('should seed queue feature key: %s', (key) => {
      expect(migration).toContain(`'${key}'`)
    })

    it('should have at least 15 feature keys', () => {
      const allKeys = [...taskKeys, ...queueKeys]
      let count = 0
      for (const key of allKeys) {
        if (migration.includes(`'${key}'`)) count++
      }
      expect(count).toBe(15)
    })
  })

  describe('Routes', () => {
    it('tasks route should be registered', () => {
      const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf-8')
      expect(app).toContain('/tasks')
    })

    it('lists route should be registered', () => {
      const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf-8')
      expect(app).toContain('/lists')
    })
  })

  describe('RLS on ALL 15 tables', () => {
    const tables = [
      'task_templates', 'task_template_sections', 'task_template_steps',
      'tasks', 'task_assignments', 'task_completions', 'routine_step_completions',
      'sequential_collections', 'task_claims', 'task_rewards',
      'lists', 'list_items', 'list_shares', 'list_templates', 'studio_queue',
    ]

    it.each(tables)('%s should have RLS enabled', (table) => {
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)
    })

    it('should have RLS on exactly 15 tables', () => {
      let count = 0
      for (const table of tables) {
        if (migration.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)) count++
      }
      expect(count).toBe(15)
    })
  })
})
