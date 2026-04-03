import { useState, useCallback, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Settings } from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { TimerProvider } from '@/features/timer'
import { ToolLauncherProvider } from '@/components/lila/ToolLauncherProvider'
import { NotepadDrawer, NotepadProvider, useNotepadContext } from '@/components/notepad'
import { QuickTasks, QuickTasksNotepadBridgeProvider } from './QuickTasks'
import { ShellQuickCreateFAB } from './ShellQuickCreateFAB'
import { TaskCreationModal } from '@/components/tasks/TaskCreationModal'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import { useSettings } from '@/components/settings'
import { ThemeSelector } from '@/components/ThemeSelector'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

interface AdultShellProps {
  children: ReactNode
}

/**
 * Adult Shell — PRD-04/05
 * Dad/additional adults access AI tools via Vault and QuickTasks toolbar.
 * ToolLauncherProvider enables tool modals from QuickTasks buttons.
 */
export function AdultShell({ children }: AdultShellProps) {
  const { openSettings } = useSettings()
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: familyMembers } = useFamilyMembers(currentFamily?.id)
  const queryClient = useQueryClient()

  const [showTaskCreate, setShowTaskCreate] = useState(false)
  const handleCreateTask = useCallback(async (data: CreateTaskData) => {
    if (!currentFamily?.id || !currentMember?.id) return
    const taskBase = {
      family_id: currentFamily.id,
      created_by: currentMember.id,
      title: data.title,
      description: data.description || null,
      task_type: data.taskType === 'opportunity' ? 'opportunity_repeatable' : data.taskType,
      status: 'pending',
      life_area_tag: data.lifeAreaTag || null,
      duration_estimate: data.durationEstimate || null,
      incomplete_action: data.incompleteAction,
      require_approval: data.reward?.requireApproval ?? false,
      victory_flagged: data.reward?.flagAsVictory ?? false,
      source: 'manual',
    }
    const assignees = data.wholeFamily
      ? (familyMembers ?? []).filter(m => m.is_active)
      : data.assignments ?? []
    const mode = data.assignMode ?? 'each'
    if (assignees.length >= 2 && mode === 'each') {
      await supabase.from('tasks').insert(
        assignees.map(a => ({ ...taskBase, assignee_id: 'memberId' in a ? a.memberId : a.id, is_shared: false }))
      )
    } else {
      const primaryId = assignees.length > 0 ? ('memberId' in assignees[0] ? assignees[0].memberId : assignees[0].id) : null
      const { data: newTask } = await supabase.from('tasks').insert({
        ...taskBase,
        assignee_id: primaryId,
        is_shared: assignees.length >= 2,
      }).select().single()
      if (newTask && assignees.length > 0) {
        await supabase.from('task_assignments').insert(
          assignees.map(a => {
            const mid = 'memberId' in a ? a.memberId : a.id
            return { task_id: newTask.id, member_id: mid, family_member_id: mid, assigned_by: currentMember.id }
          })
        )
      }
    }
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    setShowTaskCreate(false)
  }, [currentFamily?.id, currentMember?.id, familyMembers, queryClient])

  const openTaskCreate = useCallback(() => setShowTaskCreate(true), [])

  return (
    <ToolLauncherProvider>
    <TimerProvider>
    <NotepadProvider>
    <div className="flex min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="fixed top-3 right-3 z-30 flex items-center gap-2">
          <ThemeSelector />
          <Tooltip content="Settings">
          <button
            onClick={openSettings}
            className="p-2 rounded-full"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-secondary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Settings size={20} />
          </button>
          </Tooltip>
        </div>

        <AdultNotepadBridgedQuickTasks />

        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-16">
          {children}
        </main>
      </div>

      <ShellQuickCreateFAB onAddTask={openTaskCreate} />
      <NotepadDrawer />
      <BottomNav />
      <TaskCreationModal
        isOpen={showTaskCreate}
        onClose={() => setShowTaskCreate(false)}
        onSave={handleCreateTask}
        mode="quick"
      />
    </div>
    </NotepadProvider>
    </TimerProvider>
    </ToolLauncherProvider>
  )
}

function AdultNotepadBridgedQuickTasks() {
  const { openNotepad } = useNotepadContext()
  return (
    <QuickTasksNotepadBridgeProvider openNotepad={openNotepad}>
      <QuickTasks />
    </QuickTasksNotepadBridgeProvider>
  )
}
