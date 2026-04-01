import { Trophy, Calendar, BarChart3, Compass, Users, Archive, Sun, Moon, Settings, MessageCircle, Shield, Video, Map, Brain, Rss, StickyNote } from 'lucide-react'
import { PlaceholderPage } from './PlaceholderPage'
import { GuidedVictories } from '@/pages/GuidedVictories'
import { GuidedProgress } from '@/pages/GuidedProgress'
import { useShell } from '@/components/shells/ShellProvider'

export function VictoriesPage() {
  const { shell } = useShell()
  if (shell === 'guided') return <GuidedVictories />
  return <PlaceholderPage title="Victories" description="Celebrate your wins. This is a Ta-Da list — no punishment, only celebration." icon={Trophy} prd="PRD-11" featureKey="victories" />
}

export function CalendarPage() {
  return <PlaceholderPage title="Calendar" description="Family calendar with event intake, attendees, and schedule integration." icon={Calendar} prd="PRD-14B" featureKey="calendar" />
}

export function TrackersPage() {
  const { shell } = useShell()
  if (shell === 'guided') return <GuidedProgress />
  return <PlaceholderPage title="Trackers" description="Dashboard widgets and visual trackers for habits, goals, and progress." icon={BarChart3} prd="PRD-10" featureKey="widgets" />
}

export function LifeLanternPage() {
  return <PlaceholderPage title="LifeLantern" description="Personal life assessment across 6 areas: family, health, spirituality, education, community, personal growth." icon={Compass} prd="PRD-12A" featureKey="life_lantern" />
}

export function FamilyContextPage() {
  return <PlaceholderPage title="People" description="Family context, relationships, documents, and guided interview progress." icon={Users} prd="PRD-19" featureKey="family_context" />
}

export function ArchivesPage() {
  return <PlaceholderPage title="Archives" description="Context items, documents, and family knowledge organized by folder." icon={Archive} prd="PRD-13" featureKey="archives" />
}

export function MorningRhythmPage() {
  return <PlaceholderPage title="Morning Rhythm" description="Start your day with intention. Configurable morning routine with reflections." icon={Sun} prd="PRD-18" featureKey="rhythms" />
}

export function EveningReviewPage() {
  return <PlaceholderPage title="Evening Review" description="Reflect on your day. Gratitude, wins, and tomorrow's intentions." icon={Moon} prd="PRD-18" featureKey="rhythms" />
}

export function SettingsPage() {
  return <PlaceholderPage title="Settings" description="Account management, family settings, LiLa preferences, data export, and subscription management." icon={Settings} prd="PRD-22" featureKey="settings" />
}

export function MessagesPage() {
  return <PlaceholderPage title="Messages" description="Family conversations, content corner, and out-of-nest messaging. Safe, mom-monitored communication for the whole family." icon={MessageCircle} prd="PRD-15" featureKey="messaging_basic" />
}

export function SafeHarborPage() {
  return <PlaceholderPage title="Safe Harbor" description="A private, protected space for emotional processing. LiLa helps you work through hard things with care and safety." icon={Shield} prd="PRD-20" featureKey="safe_harbor" />
}

export function MeetingsPage() {
  return <PlaceholderPage title="Meetings" description="Structured family meetings — couple check-ins, family councils, weekly reviews. Templates, agenda items, and LiLa facilitation." icon={Video} prd="PRD-16" featureKey="meetings_basic" />
}

export function BigPlansPage() {
  return <PlaceholderPage title="BigPlans" description="Project planning with milestones, friction detection, and LiLa-powered check-ins. Break big goals into manageable steps." icon={Map} prd="PRD-29" featureKey="bigplans_create" />
}

export function ThoughtSiftPage() {
  return <PlaceholderPage title="ThoughtSift" description="Five powerful thinking tools: Board of Directors, Perspective Shifter, Decision Guide, Mediator, and Translator. AI-powered clarity for life's complex decisions." icon={Brain} prd="PRD-34" featureKey="thoughtsift_board_of_directors" />
}

export function FamilyFeedPage() {
  return <PlaceholderPage title="Family Feed" description="Shared family moments, learning captures, and portfolio entries. A warm, private feed celebrating your family's journey." icon={Rss} prd="PRD-37" featureKey="family_feed_basic" />
}

export function NotepadPage() {
  return <PlaceholderPage title="Notepad" description="Quick-capture workspace with tabs, auto-save, and AI-powered routing. Send notes to tasks, journal, lists, and more." icon={StickyNote} prd="PRD-08" featureKey="notepad" />
}
