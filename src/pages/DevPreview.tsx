import { Routes, Route, Navigate } from 'react-router-dom'
import { ShellProvider } from '@/components/shells/ShellProvider'
import { RoleRouter } from '@/components/shells/RoleRouter'
import { Dashboard } from './Dashboard'
import { GuidingStarsPage } from './GuidingStars'
import { BestIntentionsPage } from './BestIntentions'
import { InnerWorkingsPage } from './InnerWorkings'
import { JournalPage } from './Journal'
import { TasksPage } from './Tasks'
import { ListsPage } from './Lists'
import {
  VictoriesPage, CalendarPage, TrackersPage, LifeLanternPage,
  FamilyContextPage, ArchivesPage, MorningRhythmPage, EveningReviewPage,
} from './placeholder'

/**
 * Dev Preview — browse the entire app without authentication.
 * Navigate to /preview to see the Mom shell with all pages.
 * No data will load (Supabase queries require auth), but you can
 * see all layouts, navigation, empty states, and create forms.
 */
export function DevPreview() {
  return (
    <ShellProvider>
      <RoleRouter>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="guiding-stars" element={<GuidingStarsPage />} />
          <Route path="best-intentions" element={<BestIntentionsPage />} />
          <Route path="inner-workings" element={<InnerWorkingsPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="lists" element={<ListsPage />} />
          <Route path="victories" element={<VictoriesPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="trackers" element={<TrackersPage />} />
          <Route path="life-lantern" element={<LifeLanternPage />} />
          <Route path="family-context" element={<FamilyContextPage />} />
          <Route path="archives" element={<ArchivesPage />} />
          <Route path="rhythms/morning" element={<MorningRhythmPage />} />
          <Route path="rhythms/evening" element={<EveningReviewPage />} />
        </Routes>
      </RoleRouter>
    </ShellProvider>
  )
}
