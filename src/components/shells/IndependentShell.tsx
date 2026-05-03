import { useState, useCallback, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Settings } from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { TimerProvider } from '@/features/timer'
import { RewardRevealProvider } from '@/components/reward-reveals/RewardRevealProvider'
import { ContractRevealWatcher } from '@/components/reward-reveals/ContractRevealWatcher'
import { ToolLauncherProvider } from '@/components/lila/ToolLauncherProvider'
import { NotepadDrawer, NotepadProvider, useNotepadContext } from '@/components/notepad'
import { QuickTasks, QuickTasksNotepadBridgeProvider } from './QuickTasks'
import { ShellQuickCreateFAB } from './ShellQuickCreateFAB'
import { TaskCreationModal } from '@/components/tasks/TaskCreationModal'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import { useSettings } from '@/components/settings'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { ThemeSelector } from '@/components/ThemeSelector'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { createTaskFromData } from '@/utils/createTaskFromData'

interface IndependentShellProps {
  children: ReactNode
}

/**
 * Independent Shell — PRD-04/05
 * Teens access AI tools via AI Vault and QuickTasks toolbar.
 * ToolLauncherProvider enables tool modals from QuickTasks buttons.
 */
export function IndependentShell({ children }: IndependentShellProps) {
  const { openSettings } = useSettings()
  const { isViewingAs } = useViewAs()
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: familyMembers } = useFamilyMembers(currentFamily?.id)
  const queryClient = useQueryClient()

  const [showTaskCreate, setShowTaskCreate] = useState(false)
  const handleCreateTask = useCallback(async (data: CreateTaskData) => {
    if (!currentFamily?.id || !currentMember?.id) return
    await createTaskFromData(supabase, data, currentFamily.id, currentMember.id, familyMembers ?? [])
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['task-assignments-member'] })
    setShowTaskCreate(false)
  }, [currentFamily?.id, currentMember?.id, familyMembers, queryClient])

  const openTaskCreate = useCallback(() => setShowTaskCreate(true), [])

  return (
    <ToolLauncherProvider>
    <TimerProvider>
    <RewardRevealProvider>
    <ContractRevealWatcher memberId={currentMember?.id} familyId={currentFamily?.id} />
    <NotepadProvider>
    <div className="flex min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className={`fixed ${isViewingAs ? 'top-12' : 'top-3'} right-3 z-30 flex items-center gap-2 transition-[top] duration-200`}>
          <NotificationBell />
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

        <IndependentNotepadBridgedQuickTasks />

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
    </RewardRevealProvider>
    </TimerProvider>
    </ToolLauncherProvider>
  )
}

function IndependentNotepadBridgedQuickTasks() {
  const { openNotepad } = useNotepadContext()
  return (
    <QuickTasksNotepadBridgeProvider openNotepad={openNotepad}>
      <QuickTasks />
    </QuickTasksNotepadBridgeProvider>
  )
}
