// PRD-16: Meetings — TypeScript types

export type MeetingType = 'couple' | 'parent_child' | 'mentor' | 'family_council' | 'custom'
export type MeetingStatus = 'in_progress' | 'paused' | 'completed' | 'cancelled'
export type MeetingMode = 'live' | 'record_after'
export type ParticipantRole = 'participant' | 'facilitator' | 'observer'
export type AgendaItemStatus = 'pending' | 'discussed' | 'removed'
export type AgendaItemSource = 'quick_add' | 'notepad_route' | 'review_route'
export type TemplateParticipantType = 'personal' | 'two_person' | 'group'

export interface Meeting {
  id: string
  family_id: string
  meeting_type: MeetingType
  template_id: string | null
  custom_title: string | null
  related_member_id: string | null
  status: MeetingStatus
  mode: MeetingMode
  facilitator_member_id: string | null
  started_by: string
  summary: string | null
  impressions: string | null
  lila_conversation_id: string | null
  schedule_id: string | null
  calendar_event_id: string | null
  started_at: string
  completed_at: string | null
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export interface MeetingParticipant {
  id: string
  meeting_id: string
  family_member_id: string
  role: ParticipantRole
  notified_at: string | null
  created_at: string
}

export interface MeetingSchedule {
  id: string
  family_id: string
  meeting_type: MeetingType
  template_id: string | null
  related_member_id: string | null
  recurrence_rule: string
  recurrence_details: Record<string, unknown>
  next_due_date: string | null
  last_completed_date: string | null
  calendar_event_id: string | null
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface MeetingTemplate {
  id: string
  family_id: string
  name: string
  participant_type: TemplateParticipantType
  default_partner_id: string | null
  default_participant_ids: string[] | null
  created_by: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface MeetingTemplateSection {
  id: string
  family_id: string
  meeting_type: MeetingType
  template_id: string | null
  section_name: string
  prompt_text: string | null
  sort_order: number
  is_default: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface MeetingAgendaItem {
  id: string
  family_id: string
  meeting_type: MeetingType
  template_id: string | null
  related_member_id: string | null
  content: string
  added_by: string
  suggested_by_guided: boolean
  status: AgendaItemStatus
  discussed_in_meeting_id: string | null
  source: AgendaItemSource
  source_reference_id: string | null
  created_at: string
  updated_at: string
}

// --- Display helpers ---

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  couple: 'Couple Meeting',
  parent_child: 'Parent-Child Meeting',
  mentor: 'Mentor Meeting',
  family_council: 'Family Council',
  custom: 'Custom Meeting',
}

export const MEETING_TYPE_ICONS: Record<MeetingType, string> = {
  couple: 'Heart',
  parent_child: 'Users',
  mentor: 'GraduationCap',
  family_council: 'UsersRound',
  custom: 'MessageSquare',
}

// --- Built-in agenda section defaults (lazy-seeded on first editor access) ---

export interface BuiltInSection {
  section_name: string
  prompt_text: string
  sort_order: number
}

export const BUILT_IN_AGENDAS: Partial<Record<MeetingType, BuiltInSection[]>> = {
  couple: [
    { section_name: 'Check-In', prompt_text: 'Ask both participants how they\'re doing — personally, emotionally, physically. Listen for what\'s beneath the surface.', sort_order: 0 },
    { section_name: 'Relationship Temperature', prompt_text: 'Gently explore how each person is feeling about the relationship. Are we connected? Is anything creating distance?', sort_order: 1 },
    { section_name: 'Parenting Alignment', prompt_text: 'Discuss any parenting topics where alignment is needed. Are we on the same page with the kids?', sort_order: 2 },
    { section_name: 'Calendar & Logistics', prompt_text: 'Review the upcoming week. What events, commitments, or logistics need coordination?', sort_order: 3 },
    { section_name: 'Dreams & Goals', prompt_text: 'What are we working toward together? Any personal or shared goals to check in on?', sort_order: 4 },
    { section_name: 'Appreciation', prompt_text: 'Each person shares something they appreciate about the other. End on a warm note.', sort_order: 5 },
  ],
  mentor: [
    { section_name: 'Celebration', prompt_text: 'Start with what\'s going well. Celebrate recent wins, growth, or efforts — however small.', sort_order: 0 },
    { section_name: 'Challenges', prompt_text: 'What\'s been hard? Listen without rushing to fix. Ask follow-up questions.', sort_order: 1 },
    { section_name: 'Goals Check-In', prompt_text: 'How are their goals coming along? Any progress, setbacks, or adjustments needed?', sort_order: 2 },
    { section_name: 'Agenda Items', prompt_text: 'Go through the things queued up to discuss. Both sides get to bring topics.', sort_order: 3 },
    { section_name: 'Next Steps', prompt_text: 'What are we both going to work on before next time? Keep it concrete and achievable.', sort_order: 4 },
  ],
  parent_child: [
    { section_name: 'How Are You?', prompt_text: 'Check in on how the child is doing. Open-ended, warm, no agenda yet.', sort_order: 0 },
    { section_name: 'Wins & Growth', prompt_text: 'Celebrate recent accomplishments — tasks completed, character shown, skills developed.', sort_order: 1 },
    { section_name: 'Discussion Items', prompt_text: 'Cover the topics from the agenda. Both parent and child have items to bring.', sort_order: 2 },
    { section_name: 'Problem-Solving', prompt_text: 'Work through any challenges together. Guide, don\'t lecture. Ask the child for ideas first.', sort_order: 3 },
    { section_name: 'Commitments', prompt_text: 'What are we each going to do? Parent commitments matter as much as child commitments.', sort_order: 4 },
  ],
  family_council: [
    { section_name: 'Opening', prompt_text: 'Welcome everyone and set the tone. Remind the family that everyone gets to be heard.', sort_order: 0 },
    { section_name: 'Old Business', prompt_text: 'Follow up on action items from the last meeting. What got done? What still needs attention?', sort_order: 1 },
    { section_name: 'New Business', prompt_text: 'Go through the agenda items. Let each person speak to their items.', sort_order: 2 },
    { section_name: 'Family Calendar', prompt_text: 'Review upcoming events and logistics. Who needs to be where, when?', sort_order: 3 },
    { section_name: 'Appreciation Circle', prompt_text: 'Each person appreciates another family member. Specific, genuine, out loud.', sort_order: 4 },
    { section_name: 'Closing', prompt_text: 'Summarize decisions and action items. End with a unifying statement or family motto.', sort_order: 5 },
  ],
}

// --- Upcoming meeting urgency ---

export type MeetingUrgency = 'overdue' | 'due_today' | 'upcoming'

export function getMeetingUrgency(nextDueDate: string | null): MeetingUrgency | null {
  if (!nextDueDate) return null
  // Compare using local dates to avoid UTC timezone off-by-one
  const now = new Date()
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const due = new Date(nextDueDate)
  const dueLocal = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diffDays = Math.round((dueLocal.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'due_today'
  return 'upcoming'
}
