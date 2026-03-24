import { Trophy, Calendar, BarChart3, Compass, Users, Archive, Sun, Moon, Settings } from 'lucide-react'
import { PlaceholderPage } from './PlaceholderPage'

export function VictoriesPage() {
  return <PlaceholderPage title="Victories" description="Celebrate your wins. This is a Ta-Da list — no punishment, only celebration." icon={Trophy} prd="PRD-11" />
}

export function CalendarPage() {
  return <PlaceholderPage title="Calendar" description="Family calendar with event intake, attendees, and schedule integration." icon={Calendar} prd="PRD-14B" />
}

export function TrackersPage() {
  return <PlaceholderPage title="Trackers" description="Dashboard widgets and visual trackers for habits, goals, and progress." icon={BarChart3} prd="PRD-10" />
}

export function LifeLanternPage() {
  return <PlaceholderPage title="LifeLantern" description="Personal life assessment across 6 areas: family, health, spirituality, education, community, personal growth." icon={Compass} prd="PRD-12A" />
}

export function FamilyContextPage() {
  return <PlaceholderPage title="People" description="Family context, relationships, documents, and guided interview progress." icon={Users} prd="PRD-19" />
}

export function ArchivesPage() {
  return <PlaceholderPage title="Archives" description="Context items, documents, and family knowledge organized by folder." icon={Archive} prd="PRD-13" />
}

export function MorningRhythmPage() {
  return <PlaceholderPage title="Morning Rhythm" description="Start your day with intention. Configurable morning routine with reflections." icon={Sun} prd="PRD-18" />
}

export function EveningReviewPage() {
  return <PlaceholderPage title="Evening Review" description="Reflect on your day. Gratitude, wins, and tomorrow's intentions." icon={Moon} prd="PRD-18" />
}

export function SettingsPage() {
  return <PlaceholderPage title="Settings" description="Account management, family settings, LiLa preferences, data export, and subscription management." icon={Settings} prd="PRD-22" />
}
