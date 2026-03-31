// Shared QuickCreate FAB for Mom, Adult, and Independent shells.
// Must be rendered inside NotepadProvider tree (needs useNotepadContext).

import { useState } from 'react'
import { QuickCreate } from '@/components/global/QuickCreate'
import { TrackerQuickCreateModal } from '@/components/widgets/TrackerQuickCreateModal'
import { useNotepadContext } from '@/components/notepad'

export function ShellQuickCreateFAB({ onAddTask }: { onAddTask?: () => void }) {
  const { openNotepad } = useNotepadContext()
  const [showTrackerCreate, setShowTrackerCreate] = useState(false)
  return (
    <>
      <QuickCreate
        onAddTask={onAddTask}
        onQuickNote={openNotepad}
        onLogVictory={() => { window.location.href = '/victories?new=1' }}
        onCalendarEvent={() => { window.location.href = '/calendar?new=1' }}
        onSendRequest={openNotepad}
        onTrackSomething={() => setShowTrackerCreate(true)}
        onMindSweep={() => { window.location.href = '/sweep' }}
      />
      <TrackerQuickCreateModal
        isOpen={showTrackerCreate}
        onClose={() => setShowTrackerCreate(false)}
      />
    </>
  )
}
