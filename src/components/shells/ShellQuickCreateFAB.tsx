// Shared QuickCreate FAB for Mom, Adult, and Independent shells.
// Must be rendered inside NotepadProvider tree (needs useNotepadContext).

import { useState } from 'react'
import { QuickCreate } from '@/components/global/QuickCreate'
import { TrackerQuickCreateModal } from '@/components/widgets/TrackerQuickCreateModal'
import { QuickRequestModal } from '@/components/requests/QuickRequestModal'
import { useNotepadContext } from '@/components/notepad'

export function ShellQuickCreateFAB({ onAddTask }: { onAddTask?: () => void }) {
  const { openNotepad } = useNotepadContext()
  const [showTrackerCreate, setShowTrackerCreate] = useState(false)
  const [showQuickRequest, setShowQuickRequest] = useState(false)
  return (
    <>
      <QuickCreate
        onAddTask={onAddTask}
        onQuickNote={openNotepad}
        onLogVictory={() => { window.location.href = '/victories?new=1' }}
        onCalendarEvent={() => { window.location.href = '/calendar?new=1' }}
        onSendRequest={() => setShowQuickRequest(true)}
        onTrackSomething={() => setShowTrackerCreate(true)}
        onMindSweep={() => { window.location.href = '/sweep' }}
      />
      <TrackerQuickCreateModal
        isOpen={showTrackerCreate}
        onClose={() => setShowTrackerCreate(false)}
      />
      <QuickRequestModal
        isOpen={showQuickRequest}
        onClose={() => setShowQuickRequest(false)}
      />
    </>
  )
}
