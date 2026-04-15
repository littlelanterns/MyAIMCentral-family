import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  Meeting, MeetingSchedule, MeetingTemplate, MeetingTemplateSection,
  MeetingAgendaItem, MeetingParticipant, MeetingType, MeetingMode,
} from '@/types/meetings'

// ── Meetings ─────────────────────────────────────────────────

export function useMeetings(familyId: string | undefined) {
  return useQuery({
    queryKey: ['meetings', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('family_id', familyId)
        .order('started_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Meeting[]
    },
    enabled: !!familyId,
  })
}

export function useRecentMeetings(familyId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: ['meetings', familyId, 'recent', limit],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as Meeting[]
    },
    enabled: !!familyId,
  })
}

export function useActiveMeetings(familyId: string | undefined) {
  return useQuery({
    queryKey: ['meetings', familyId, 'active'],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('family_id', familyId)
        .in('status', ['in_progress', 'paused'])
        .order('started_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Meeting[]
    },
    enabled: !!familyId,
  })
}

export function useCreateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      family_id: string
      meeting_type: MeetingType
      mode: MeetingMode
      started_by: string
      template_id?: string
      custom_title?: string
      related_member_id?: string
      facilitator_member_id?: string
      schedule_id?: string
      calendar_event_id?: string
      participant_ids: string[]
    }) => {
      const { participant_ids, ...meetingData } = input
      const { data: meeting, error } = await supabase
        .from('meetings')
        .insert(meetingData)
        .select()
        .single()
      if (error) throw error

      // Add participants
      if (participant_ids.length > 0) {
        const participants = participant_ids.map(mid => ({
          meeting_id: meeting.id,
          family_member_id: mid,
          role: mid === input.facilitator_member_id ? 'facilitator' : 'participant',
        }))
        const { error: pError } = await supabase
          .from('meeting_participants')
          .insert(participants)
        if (pError) throw pError
      }

      return meeting as Meeting
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meetings', vars.family_id] })
    },
  })
}

export function useUpdateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; family_id: string } & Partial<Meeting>) => {
      const { id, family_id, ...updates } = input
      const { data, error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Meeting
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meetings', vars.family_id] })
    },
  })
}

// ── Participants ──────────────────────────────────────────────

export function useMeetingParticipants(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-participants', meetingId],
    queryFn: async () => {
      if (!meetingId) return []
      const { data, error } = await supabase
        .from('meeting_participants')
        .select('*')
        .eq('meeting_id', meetingId)
      if (error) throw error
      return (data ?? []) as MeetingParticipant[]
    },
    enabled: !!meetingId,
  })
}

// ── Schedules ────────────────────────────────────────────────

export function useMeetingSchedules(familyId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-schedules', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('meeting_schedules')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('next_due_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as MeetingSchedule[]
    },
    enabled: !!familyId,
  })
}

export function useUpsertMeetingSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<MeetingSchedule, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
      const { id, ...data } = input
      if (id) {
        const { data: row, error } = await supabase
          .from('meeting_schedules')
          .update(data)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return row as MeetingSchedule
      }
      const { data: row, error } = await supabase
        .from('meeting_schedules')
        .insert(data)
        .select()
        .single()
      if (error) throw error
      return row as MeetingSchedule
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meeting-schedules', vars.family_id] })
    },
  })
}

// ── Templates ────────────────────────────────────────────────

export function useMeetingTemplates(familyId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-templates', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('meeting_templates')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as MeetingTemplate[]
    },
    enabled: !!familyId,
  })
}

export function useCreateMeetingTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<MeetingTemplate, 'id' | 'created_at' | 'updated_at' | 'is_archived'>) => {
      const { data, error } = await supabase
        .from('meeting_templates')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as MeetingTemplate
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meeting-templates', vars.family_id] })
    },
  })
}

// ── Template Sections (Agenda) ───────────────────────────────

export function useMeetingTemplateSections(familyId: string | undefined, meetingType: MeetingType | undefined, templateId?: string) {
  return useQuery({
    queryKey: ['meeting-template-sections', familyId, meetingType, templateId],
    queryFn: async () => {
      if (!familyId || !meetingType) return []
      let query = supabase
        .from('meeting_template_sections')
        .select('*')
        .eq('family_id', familyId)
        .eq('meeting_type', meetingType)
        .eq('is_archived', false)
        .order('sort_order', { ascending: true })

      if (templateId) {
        query = query.eq('template_id', templateId)
      } else {
        query = query.is('template_id', null)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as MeetingTemplateSection[]
    },
    enabled: !!familyId && !!meetingType,
  })
}

export function useUpsertMeetingTemplateSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<MeetingTemplateSection, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
      const { id, ...data } = input
      if (id) {
        const { data: row, error } = await supabase.from('meeting_template_sections').update(data).eq('id', id).select().single()
        if (error) throw error
        return row as MeetingTemplateSection
      }
      const { data: row, error } = await supabase.from('meeting_template_sections').insert(data).select().single()
      if (error) throw error
      return row as MeetingTemplateSection
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meeting-template-sections', vars.family_id, vars.meeting_type] })
    },
  })
}

export function useSeedDefaultSections() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { family_id: string; meeting_type: MeetingType; sections: Array<{ section_name: string; prompt_text: string; sort_order: number }> }) => {
      const rows = input.sections.map(s => ({
        family_id: input.family_id,
        meeting_type: input.meeting_type,
        section_name: s.section_name,
        prompt_text: s.prompt_text,
        sort_order: s.sort_order,
        is_default: true,
      }))
      const { data, error } = await supabase
        .from('meeting_template_sections')
        .insert(rows)
        .select()
      if (error) throw error
      return data as MeetingTemplateSection[]
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meeting-template-sections', vars.family_id, vars.meeting_type] })
    },
  })
}

// ── Agenda Items ─────────────────────────────────────────────

export function useMeetingAgendaItems(familyId: string | undefined, meetingType?: MeetingType, relatedMemberId?: string) {
  return useQuery({
    queryKey: ['meeting-agenda-items', familyId, meetingType, relatedMemberId],
    queryFn: async () => {
      if (!familyId) return []
      let query = supabase
        .from('meeting_agenda_items')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (meetingType) query = query.eq('meeting_type', meetingType)
      if (relatedMemberId) query = query.eq('related_member_id', relatedMemberId)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as MeetingAgendaItem[]
    },
    enabled: !!familyId,
  })
}

export function usePendingAgendaCounts(familyId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-agenda-counts', familyId],
    queryFn: async () => {
      if (!familyId) return {}
      const { data, error } = await supabase
        .from('meeting_agenda_items')
        .select('meeting_type, related_member_id')
        .eq('family_id', familyId)
        .eq('status', 'pending')
      if (error) throw error

      const counts: Record<string, number> = {}
      for (const item of data ?? []) {
        const key = item.related_member_id
          ? `${item.meeting_type}:${item.related_member_id}`
          : item.meeting_type
        counts[key] = (counts[key] ?? 0) + 1
      }
      return counts
    },
    enabled: !!familyId,
  })
}

export function useAddAgendaItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      family_id: string
      meeting_type: MeetingType
      content: string
      added_by: string
      template_id?: string
      related_member_id?: string
      suggested_by_guided?: boolean
      source?: 'quick_add' | 'notepad_route' | 'review_route'
      source_reference_id?: string
    }) => {
      const { data, error } = await supabase
        .from('meeting_agenda_items')
        .insert({
          ...input,
          source: input.source ?? 'quick_add',
        })
        .select()
        .single()
      if (error) throw error
      return data as MeetingAgendaItem
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meeting-agenda-items', vars.family_id] })
      qc.invalidateQueries({ queryKey: ['meeting-agenda-counts', vars.family_id] })
    },
  })
}

export function useRemoveAgendaItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; family_id: string }) => {
      const { error } = await supabase
        .from('meeting_agenda_items')
        .update({ status: 'removed' })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meeting-agenda-items', vars.family_id] })
      qc.invalidateQueries({ queryKey: ['meeting-agenda-counts', vars.family_id] })
    },
  })
}

/** Mark agenda items as discussed during a live meeting */
export function useMarkAgendaDiscussed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; family_id: string; meeting_id: string }) => {
      const { error } = await supabase
        .from('meeting_agenda_items')
        .update({ status: 'discussed', discussed_in_meeting_id: input.meeting_id })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meeting-agenda-items', vars.family_id] })
      qc.invalidateQueries({ queryKey: ['meeting-agenda-counts', vars.family_id] })
    },
  })
}
