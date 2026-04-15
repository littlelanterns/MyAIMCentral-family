// PRD-16 Phase C: MeetingConversationView
// Full-screen meeting view wrapping LiLa conversation with agenda sidebar + controls.
// Supports Live Mode (real-time facilitation) and Record After (retrospective capture).

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Pause, Play, Square, CheckCircle2, Circle, ChevronRight, ChevronDown, Loader } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useFamilyMember, useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useLilaMessages,
  useCreateConversation,
  streamLilaChat,
  detectCrisis,
  CRISIS_RESPONSE,
} from '@/hooks/useLila'
import type { LilaConversation } from '@/hooks/useLila'
import { LilaMessageBubble } from '@/components/lila/LilaMessageBubble'
import { LilaAvatar } from '@/components/lila/LilaAvatar'
import {
  useMeetingTemplateSections,
  useMeetingAgendaItems,
  useMarkAgendaDiscussed,
  useUpdateMeeting,
} from '@/hooks/useMeetings'
import type { Meeting, MeetingType, MeetingTemplateSection, MeetingAgendaItem } from '@/types/meetings'
import { MEETING_TYPE_LABELS } from '@/types/meetings'
import { supabase } from '@/lib/supabase/client'

interface MeetingConversationViewProps {
  meeting: Meeting
  onEnd: (meetingId: string) => void
  onClose: () => void
}

export function MeetingConversationView({ meeting, onEnd, onClose }: MeetingConversationViewProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: members = [] } = useFamilyMembers(family?.id)
  const queryClient = useQueryClient()

  const [conversation, setConversation] = useState<LilaConversation | null>(null)
  const { data: messages = [] } = useLilaMessages(conversation?.id)
  const { data: sections = [] } = useMeetingTemplateSections(family?.id, meeting.meeting_type as MeetingType)
  const { data: agendaItems = [] } = useMeetingAgendaItems(family?.id, meeting.meeting_type as MeetingType, meeting.related_member_id ?? undefined)

  const createConversation = useCreateConversation()
  const markDiscussed = useMarkAgendaDiscussed()
  const updateMeeting = useUpdateMeeting()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [openingMessage, setOpeningMessage] = useState<string | null>(null)
  const [agendaSidebarOpen, setAgendaSidebarOpen] = useState(true)
  const [isPaused, setIsPaused] = useState(meeting.status === 'paused')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isRecordAfter = meeting.mode === 'record_after'
  const displayTitle = meeting.custom_title ?? MEETING_TYPE_LABELS[meeting.meeting_type as MeetingType]

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Create the LiLa conversation on mount
  useEffect(() => {
    if (conversation || !member || !family) return

    async function initConversation() {
      try {
        const conv = await createConversation.mutateAsync({
          family_id: family!.id,
          member_id: member!.id,
          mode: 'general',
          guided_mode: 'meeting',
          guided_subtype: 'meeting',
          guided_mode_reference_id: meeting.id,
          container_type: 'modal',
          page_context: '/meetings',
          model_used: 'sonnet',
        })
        setConversation(conv)

        // Link the conversation to the meeting
        await supabase
          .from('meetings')
          .update({ lila_conversation_id: conv.id })
          .eq('id', meeting.id)

        // Set opening message based on mode
        if (isRecordAfter) {
          setOpeningMessage(
            `I'd love to hear about your ${displayTitle.toLowerCase()}. Tell me about what you discussed — I'll help organize it into a summary.`
          )
        } else {
          const sectionNames = sections.map(s => s.section_name).join(', ')
          setOpeningMessage(
            `Welcome to your ${displayTitle.toLowerCase()}! I'll guide us through ${sectionNames ? `your agenda: ${sectionNames}` : 'the conversation'}. Let's get started — how is everyone doing?`
          )
        }
      } catch (err) {
        console.error('Failed to create meeting conversation:', err)
      }
    }

    initConversation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member, family])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !conversation || isStreaming || isPaused) return

    const messageText = input.trim()
    setInput('')

    if (detectCrisis(messageText)) {
      setStreamingContent(CRISIS_RESPONSE)
      return
    }

    setIsStreaming(true)
    setStreamingContent('')

    await streamLilaChat(
      conversation.id,
      messageText,
      (chunk) => setStreamingContent(prev => prev + chunk),
      () => {
        setIsStreaming(false)
        setStreamingContent('')
        queryClient.invalidateQueries({ queryKey: ['lila-messages', conversation.id] })
      },
      (error) => {
        console.error('Meeting chat error:', error)
        setIsStreaming(false)
        setStreamingContent('I had trouble with that. Want to try again?')
      },
    )
  }, [input, conversation, isStreaming, isPaused, queryClient])

  const handlePause = async () => {
    setIsPaused(true)
    await updateMeeting.mutateAsync({
      id: meeting.id,
      family_id: meeting.family_id,
      status: 'paused',
    })
  }

  const handleResume = async () => {
    setIsPaused(false)
    await updateMeeting.mutateAsync({
      id: meeting.id,
      family_id: meeting.family_id,
      status: 'in_progress',
    })
  }

  const handleEndMeeting = async () => {
    await updateMeeting.mutateAsync({
      id: meeting.id,
      family_id: meeting.family_id,
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_minutes: Math.round((Date.now() - new Date(meeting.started_at).getTime()) / 60000),
    })
    onEnd(meeting.id)
  }

  const handleToggleDiscussed = (item: MeetingAgendaItem) => {
    if (item.status === 'discussed') return
    markDiscussed.mutate({
      id: item.id,
      family_id: meeting.family_id,
      meeting_id: meeting.id,
    })
  }

  const getMemberName = (id: string) => members.find((m: FamilyMember) => m.id === id)?.display_name ?? ''

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Main conversation area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border-default)', background: 'var(--color-surface-secondary)' }}
        >
          <div className="flex items-center gap-3">
            <LilaAvatar avatarKey="sitting" size={24} />
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {displayTitle}
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {isRecordAfter ? 'Recording what was discussed' : 'Live meeting in progress'}
                {isPaused && ' — Paused'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Pause/Resume */}
            {!isRecordAfter && (
              <button
                onClick={isPaused ? handleResume : handlePause}
                className="p-2 rounded-md hover:opacity-80"
                style={{ color: 'var(--color-text-secondary)' }}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
              </button>
            )}
            {/* End Meeting */}
            <button
              onClick={handleEndMeeting}
              className="px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5"
              style={{ background: 'var(--color-error)', color: '#fff' }}
              disabled={isStreaming}
            >
              <Square size={14} /> End Meeting
            </button>
            {/* Agenda toggle (mobile) */}
            <button
              onClick={() => setAgendaSidebarOpen(!agendaSidebarOpen)}
              className="md:hidden p-2 rounded-md"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <ChevronRight size={18} className={agendaSidebarOpen ? 'rotate-180' : ''} />
            </button>
            {/* Close (without ending) */}
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:opacity-80"
              style={{ color: 'var(--color-text-tertiary)' }}
              title="Minimize (meeting stays active)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Opening message */}
          {messages.length === 0 && openingMessage && !isStreaming && (
            <div className="flex gap-2">
              <LilaAvatar avatarKey="sitting" size={16} className="mt-1 shrink-0" />
              <div
                className="rounded-lg px-3 py-2 text-sm max-w-[80%]"
                style={{
                  backgroundColor: 'var(--color-surface-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-default)',
                }}
              >
                <p>{openingMessage}</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <LilaMessageBubble
              key={msg.id}
              message={msg}
              avatarKey="sitting"
              isLatestAssistant={msg.role === 'assistant' && i === messages.length - 1 && !isStreaming}
              hideHumanInTheMix={true}
              onRegenerate={() => {}}
              onReject={() => {}}
            />
          ))}

          {isStreaming && streamingContent && (
            <LilaMessageBubble
              message={{
                id: 'streaming',
                conversation_id: conversation?.id ?? '',
                role: 'assistant',
                content: streamingContent,
                metadata: {},
                token_count: null,
                safety_scanned: false,
                created_at: new Date().toISOString(),
              }}
              avatarKey="sitting"
              isLatestAssistant={false}
              hideHumanInTheMix={true}
              onRegenerate={() => {}}
              onReject={() => {}}
            />
          )}

          {isStreaming && !streamingContent && (
            <div className="flex gap-2 items-center">
              <LilaAvatar avatarKey="sitting" size={16} className="shrink-0" />
              <Loader size={16} className="animate-spin" style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--color-border-default)', background: 'var(--color-surface-secondary)' }}
        >
          {isPaused ? (
            <div className="text-center py-2">
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                Meeting paused — tap Resume to continue
              </p>
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={isRecordAfter ? 'Tell me what you discussed...' : 'Type your response...'}
                className="flex-1 resize-none rounded-lg px-3 py-2 text-sm"
                style={{
                  background: 'var(--color-surface-primary)',
                  border: '1px solid var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                  minHeight: '40px',
                  maxHeight: '120px',
                }}
                rows={1}
                disabled={isStreaming}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="p-2.5 rounded-lg shrink-0 disabled:opacity-40"
                style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-primary)' }}
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Agenda sidebar */}
      <div
        className={`${agendaSidebarOpen ? 'w-72 border-l' : 'w-0 overflow-hidden'} transition-all duration-200 shrink-0 flex flex-col`}
        style={{ borderColor: 'var(--color-border-default)', background: 'var(--color-surface-secondary)' }}
      >
        {agendaSidebarOpen && (
          <>
            <div className="px-3 py-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Agenda
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
              {/* Sections checklist */}
              {sections.length > 0 && (
                <AgendaSectionsChecklist sections={sections} />
              )}

              {/* Pending agenda items */}
              {agendaItems.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    Items to Discuss
                  </h4>
                  <div className="space-y-1.5">
                    {agendaItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleToggleDiscussed(item)}
                        className="w-full text-left flex items-start gap-2 py-1 group"
                      >
                        {item.status === 'discussed' ? (
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-success)' }} />
                        ) : (
                          <Circle size={14} className="mt-0.5 shrink-0 group-hover:opacity-70" style={{ color: 'var(--color-text-tertiary)' }} />
                        )}
                        <div>
                          <p
                            className={`text-xs ${item.status === 'discussed' ? 'line-through' : ''}`}
                            style={{ color: item.status === 'discussed' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}
                          >
                            {item.content}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {getMemberName(item.added_by)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sections.length === 0 && agendaItems.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
                  No agenda items yet
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Collapsible sections checklist for the agenda sidebar */
function AgendaSectionsChecklist({ sections }: { sections: MeetingTemplateSection[] }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id)
  }

  const toggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCompletedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <h4 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
        Sections
      </h4>
      <div className="space-y-0.5">
        {sections.map((s, i) => {
          const isDone = completedSections.has(s.id)
          const isExpanded = expandedSection === s.id
          return (
            <div key={s.id}>
              <button
                onClick={() => toggleSection(s.id)}
                className="w-full text-left flex items-center gap-2 py-1.5 px-1 rounded hover:opacity-80"
              >
                <button
                  onClick={(e) => toggleComplete(s.id, e)}
                  className="shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <Circle size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                  )}
                </button>
                <span
                  className={`text-xs flex-1 ${isDone ? 'line-through' : ''}`}
                  style={{ color: isDone ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}
                >
                  {i + 1}. {s.section_name}
                </span>
                {s.prompt_text && (
                  isExpanded ? <ChevronDown size={12} style={{ color: 'var(--color-text-tertiary)' }} /> : <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                )}
              </button>
              {isExpanded && s.prompt_text && (
                <p className="text-xs pl-7 pb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {s.prompt_text}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
