/**
 * PlannedViewStub — PRD-09A + PRD-32A
 *
 * Shown when a user taps a view that is on the roadmap but not yet built.
 * Each stubbed view shows PlannedExpansionCard with view name and description.
 *
 * Stubbed views: Big Rocks, Ivy Lee, ABCDE Method, MoSCoW, Impact/Effort,
 * Now/Next/Optional (handled directly), By Member, Pomodoro
 */

import { PlannedExpansionCard, FeatureGuide } from '@/components/shared'
import type { TaskViewKey } from '../ViewCarousel'

// STUB: wires to feature_expansion_registry — entries added below
const VIEW_FEATURE_KEYS: Record<string, string> = {
  big_rocks: 'task_view_big_rocks',
  ivy_lee: 'task_view_ivy_lee',
  abcde: 'task_view_abcde',
  moscow: 'task_view_moscow',
  impact_effort: 'task_view_impact_effort',
  by_member: 'task_view_by_member',
}

const VIEW_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  big_rocks: {
    title: 'Big Rocks View',
    description:
      'Inspired by Stephen Covey\'s time management principle: put the big rocks in first. See your tasks split into 2-3 major priorities (Big Rocks) and everything else (Gravel). Big rocks get full visual emphasis. Never let gravel crowd out what actually matters.',
  },
  ivy_lee: {
    title: 'Ivy Lee Method',
    description:
      'The $25,000 method that transformed the steel industry. At the end of each day, write your 6 most important tasks for tomorrow in order of priority. Work on #1 until done, then #2. Move what\'s unfinished to tomorrow\'s list. Ruthless focus. Remarkable results.',
  },
  abcde: {
    title: 'ABCDE Priority Method',
    description:
      'Brian Tracy\'s A-B-C-D-E system: A tasks must be done (serious consequences if skipped), B tasks should be done (mild consequences), C tasks are nice to do, D tasks get delegated, E tasks get eliminated entirely. The "D" category even suggests which family member might take it.',
  },
  moscow: {
    title: 'MoSCoW Prioritization',
    description:
      'Project management\'s classic framework adapted for family life: Must Do, Should Do, Could Do, Won\'t Do (this cycle). Excellent for planning curriculum weeks, family projects, and anything where trade-offs need to be explicit.',
  },
  impact_effort: {
    title: 'Impact / Effort Matrix',
    description:
      'See your tasks in a 2×2 grid: Quick Wins (high impact, low effort), Major Projects (high impact, high effort), Fill-Ins (low impact, low effort), and Thankless Tasks (high effort, low impact). Start with Quick Wins, schedule Major Projects, batch Fill-Ins, and seriously reconsider the Thankless Tasks.',
  },
  by_member: {
    title: 'By Member View',
    description:
      'See your whole family\'s task load at a glance — every family member\'s tasks grouped in their own column. Instantly spot who\'s overloaded, who needs more to do, and how the balance looks across the family. Only visible on the Family Overview.',
  },
}

interface PlannedViewStubProps {
  viewKey: TaskViewKey
}

export function PlannedViewStub({ viewKey }: PlannedViewStubProps) {
  const featureKey = VIEW_FEATURE_KEYS[viewKey]
  const info = VIEW_DESCRIPTIONS[viewKey]

  if (!featureKey || !info) return null

  return (
    <div className="max-w-lg mx-auto space-y-4 py-4">
      <FeatureGuide
        featureKey={`task_view_intro_${viewKey}`}
        title={info.title}
        description={info.description}
      />
      <PlannedExpansionCard featureKey={featureKey} />
    </div>
  )
}
