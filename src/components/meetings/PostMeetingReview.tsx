// PRD-16 Phase D: PostMeetingReview
// Opens after a meeting ends. Three sections: editable summary, personal impressions,
// and AI-extracted action items with compact routing strip + member selector.

import { useState, useEffect, useCallback } from 'react'
import { Loader, CheckCircle2, SkipForward, User, FileText, Sparkles, Save } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { RoutingStrip } from '@/components/shared/RoutingStrip'
import type { MemberPillItem } from '@/components/shared/MemberPillSelector'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember, useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { useMeetingParticipants } from '@/hooks/useMeetings'
import { useLilaMessages } from '@/hooks/useLila'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'
import type { Meeting, MeetingType } from '@/types/meetings'
import { MEETING_TYPE_LABELS } from '@/types/meetings'

// ── Types ────────────────────────────────────────────────────────

export interface ActionItem {
  id: string
  content: string
  suggestedDestination: string
  assigneeMemberId: string | null
  routed: boolean
  routedDestination: string | null
  skipped: boolean
  showRouting: boolean
}

interface PostMeetingReviewProps {
  isOpen: boolean
  onClose: () => void
  meeting: Meeting
  onSaveComplete: () => void
}

// ── Summary generation prompt ────────────────────────────────────

function buildSummaryPrompt(meetingType: MeetingType): string {
  return `You are summarizing a family meeting conversation. This was a ${MEETING_TYPE_LABELS[meetingType]}.

Produce a JSON object with two fields:
1. "summary": A warm, concise summary (2-5 paragraphs) organized by the topics discussed. Use second person ("You discussed..."). Capture the tone — if it was emotional, note that. If decisions were made, state them clearly.
2. "action_items": An array of objects, each with:
   - "content": What needs to happen (string)
   - "suggested_destination": One of "tasks", "calendar", "best_intentions", "guiding_stars", "list", "backburner", "skip"
   - "suggested_assignee_name": The family member's first name this applies to, or null if unclear

Extract every actionable commitment from the conversation. When someone says "I'll do X" or "let's X" or "we need to X" — that's an action item. Be generous in extraction — better to capture too many than miss one.

Return ONLY valid JSON. No markdown fences.`
}

// ── Component ────────────────────────────────────────────────────

export function PostMeetingReview({ isOpen, onClose, meeting, onSaveComplete }: PostMeetingReviewProps) {
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()
  const { data: members = [] } = useFamilyMembers(family?.id)
  const { data: participants = [] } = useMeetingParticipants(meeting.id)
  const { data: messages = [] } = useLilaMessages(meeting.lila_conversation_id ?? undefined)

  const [summary, setSummary] = useState(meeting.summary ?? '')
  const [impressions, setImpressions] = useState(meeting.impressions ?? '')
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const displayTitle = meeting.custom_title ?? MEETING_TYPE_LABELS[meeting.meeting_type as MeetingType]

  // Map participant member IDs for filtering
  const participantMemberIds = participants.map(p => p.family_member_id)
  const participantMembers: MemberPillItem[] = members
    .filter((m: FamilyMember) => participantMemberIds.includes(m.id))
    .map((m: FamilyMember) => ({
      id: m.id,
      display_name: m.display_name,
      calendar_color: m.calendar_color ?? null,
      assigned_color: m.assigned_color ?? null,
      member_color: m.member_color ?? null,
    }))

  // All family adults for assignment
  const adultMembers: MemberPillItem[] = members
    .filter((m: FamilyMember) => m.role === 'primary_parent' || m.role === 'additional_adult')
    .map((m: FamilyMember) => ({
      id: m.id,
      display_name: m.display_name,
      calendar_color: m.calendar_color ?? null,
      assigned_color: m.assigned_color ?? null,
      member_color: m.member_color ?? null,
    }))

  const assignableMembers = participantMembers.length > 0 ? participantMembers : adultMembers

  // Resolve member name to ID
  const resolveMemberByName = useCallback((name: string | null): string | null => {
    if (!name) return null
    const lower = name.toLowerCase()
    const found = members.find((m: FamilyMember) =>
      m.display_name.toLowerCase() === lower ||
      m.display_name.toLowerCase().startsWith(lower)
    )
    return found?.id ?? null
  }, [members])

  // Generate summary + action items from the conversation
  const generateSummary = useCallback(async () => {
    if (messages.length === 0) return

    setIsGenerating(true)
    setGenerateError(null)

    try {
      // Build transcript from messages
      const transcript = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'Mom' : 'LiLa'}: ${m.content}`)
        .join('\n\n')

      const systemPrompt = buildSummaryPrompt(meeting.meeting_type as MeetingType)
      const result = await sendAIMessage(
        systemPrompt,
        [{ role: 'user', content: `Here is the meeting transcript:\n\n${transcript}` }],
        4096,
        'sonnet',
      )

      const parsed = extractJSON<{ summary: string; action_items: Array<{ content: string; suggested_destination: string; suggested_assignee_name?: string | null }> }>(result)

      if (parsed?.summary) {
        setSummary(parsed.summary)
      }

      if (parsed?.action_items && Array.isArray(parsed.action_items)) {
        setActionItems(parsed.action_items.map((item, i) => ({
          id: `ai-${i}-${Date.now()}`,
          content: item.content,
          suggestedDestination: item.suggested_destination || 'tasks',
          assigneeMemberId: resolveMemberByName(item.suggested_assignee_name ?? null) ?? member?.id ?? null,
          routed: false,
          routedDestination: null,
          skipped: false,
          showRouting: false,
        })))
      }
    } catch (err) {
      console.error('Summary generation failed:', err)
      setGenerateError('Summary generation failed — you can still write your own below.')
    } finally {
      setIsGenerating(false)
    }
  }, [messages, meeting.meeting_type, resolveMemberByName, member?.id])

  // Auto-generate on open when we have messages
  useEffect(() => {
    if (isOpen && messages.length > 0 && !summary && !isGenerating && actionItems.length === 0) {
      generateSummary()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, messages.length])

  const handleRouteItem = (itemId: string, destination: string) => {
    setActionItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, routed: true, routedDestination: destination, showRouting: false } : item
    ))
  }

  const handleSkipItem = (itemId: string) => {
    setActionItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, skipped: true, showRouting: false } : item
    ))
  }

  const handleToggleRouting = (itemId: string) => {
    setActionItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, showRouting: !item.showRouting } : item
    ))
  }

  const handleAssigneeChange = (itemId: string, memberId: string) => {
    setActionItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, assigneeMemberId: memberId } : item
    ))
  }

  const allItemsProcessed = actionItems.length === 0 || actionItems.every(item => item.routed || item.skipped)

  const handleSave = async () => {
    if (!family || !member) return
    setIsSaving(true)
    try {
      // Import the complete meeting hook dynamically to avoid circular deps
      const { completeMeeting } = await import('@/lib/meetings/completeMeeting')
      await completeMeeting({
        meeting,
        summary,
        impressions,
        actionItems: actionItems.filter(item => !item.skipped),
        familyId: family.id,
        memberId: member.id,
        participants,
      })
      onSaveComplete()
    } catch (err) {
      console.error('Failed to save meeting review:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const getMemberName = (id: string) => members.find((m: FamilyMember) => m.id === id)?.display_name ?? ''

  return (
    <ModalV2
      id="post-meeting-review"
      isOpen={isOpen}
      onClose={onClose}
      type="persistent"
      size="lg"
      title="Meeting Review"
      subtitle={displayTitle}
      icon={FileText}
      hasUnsavedChanges={summary.length > 0 || impressions.length > 0}
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary px-6 py-2 text-sm rounded-md flex items-center gap-2"
          >
            {isSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            Save & Close
          </button>
        </div>
      }
    >
      <div className="space-y-6 px-1">
        {/* ── Summary ─────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              Summary
            </h3>
            {messages.length > 0 && (
              <button
                onClick={generateSummary}
                disabled={isGenerating}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded-md hover:opacity-80"
                style={{ color: 'var(--color-btn-primary-bg)' }}
              >
                <Sparkles size={12} /> {isGenerating ? 'Generating...' : 'Regenerate'}
              </button>
            )}
          </div>

          {isGenerating && !summary ? (
            <div className="flex items-center gap-2 py-8 justify-center" style={{ color: 'var(--color-text-tertiary)' }}>
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">LiLa is summarizing your meeting...</span>
            </div>
          ) : (
            <>
              {generateError && (
                <p className="text-xs mb-2" style={{ color: 'var(--color-warning)' }}>{generateError}</p>
              )}
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Write a summary of what was discussed..."
                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                style={{
                  background: 'var(--color-surface-primary)',
                  border: '1px solid var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                  minHeight: '120px',
                }}
                rows={5}
              />
            </>
          )}
        </section>

        {/* ── Impressions (personal) ─────────────────── */}
        <section>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-heading)' }}>
            Personal Impressions
          </h3>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
            Just for you — never shared with other participants.
          </p>
          <textarea
            value={impressions}
            onChange={e => setImpressions(e.target.value)}
            placeholder="How did it go? Anything on your mind?"
            className="w-full rounded-lg px-3 py-2 text-sm resize-none"
            style={{
              background: 'var(--color-surface-primary)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-primary)',
              minHeight: '80px',
            }}
            rows={3}
          />
        </section>

        {/* ── Action Items ──────────────────────────── */}
        <section>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
            Action Items
          </h3>

          {isGenerating && actionItems.length === 0 ? (
            <div className="flex items-center gap-2 py-6 justify-center" style={{ color: 'var(--color-text-tertiary)' }}>
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">Extracting action items...</span>
            </div>
          ) : actionItems.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
              No action items extracted. You can still save the summary.
            </p>
          ) : (
            <div className="space-y-3">
              {actionItems.map(item => (
                <ActionItemCard
                  key={item.id}
                  item={item}
                  members={assignableMembers}
                  getMemberName={getMemberName}
                  onToggleRouting={() => handleToggleRouting(item.id)}
                  onRoute={(dest) => handleRouteItem(item.id, dest)}
                  onSkip={() => handleSkipItem(item.id)}
                  onAssigneeChange={(memberId) => handleAssigneeChange(item.id, memberId)}
                />
              ))}

              {allItemsProcessed && actionItems.length > 0 && (
                <div className="flex items-center gap-2 py-2 justify-center" style={{ color: 'var(--color-success)' }}>
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-medium">All action items processed</span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </ModalV2>
  )
}

// ── Action Item Card ─────────────────────────────────────────────

function ActionItemCard({
  item,
  members,
  getMemberName,
  onToggleRouting,
  onRoute,
  onSkip,
  onAssigneeChange,
}: {
  item: ActionItem
  members: MemberPillItem[]
  getMemberName: (id: string) => string
  onToggleRouting: () => void
  onRoute: (destination: string) => void
  onSkip: () => void
  onAssigneeChange: (memberId: string) => void
}) {
  if (item.routed) {
    return (
      <div
        className="rounded-lg px-3 py-2 flex items-center gap-2"
        style={{ background: 'color-mix(in srgb, var(--color-success) 10%, var(--color-surface-secondary))', border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)' }}
      >
        <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
        <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
          {item.content}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-tertiary)', color: 'var(--color-text-secondary)' }}>
          → {item.routedDestination}
          {item.assigneeMemberId && ` (${getMemberName(item.assigneeMemberId)})`}
        </span>
      </div>
    )
  }

  if (item.skipped) {
    return (
      <div
        className="rounded-lg px-3 py-2 flex items-center gap-2 opacity-50"
        style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}
      >
        <SkipForward size={14} style={{ color: 'var(--color-text-tertiary)' }} />
        <span className="text-sm flex-1 line-through" style={{ color: 'var(--color-text-tertiary)' }}>
          {item.content}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Skipped</span>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}
    >
      <div className="px-3 py-2">
        <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>{item.content}</p>

        {/* Assignee selector */}
        <div className="flex items-center gap-2 mb-2">
          <User size={12} style={{ color: 'var(--color-text-tertiary)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>For:</span>
          <div className="flex gap-1 flex-wrap">
            {members.map(m => {
              const isSelected = m.id === item.assigneeMemberId
              return (
                <button
                  key={m.id}
                  onClick={() => onAssigneeChange(m.id)}
                  className="text-xs px-2 py-0.5 rounded-full transition-colors"
                  style={{
                    background: isSelected ? 'var(--color-accent)' : 'transparent',
                    color: isSelected ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                    border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
                  }}
                >
                  {m.display_name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick route buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRouting}
            className="text-xs px-3 py-1 rounded-md flex items-center gap-1"
            style={{ background: 'var(--color-btn-primary-bg)', color: 'var(--color-text-on-primary)' }}
          >
            Route →
          </button>
          <button
            onClick={onSkip}
            className="text-xs px-3 py-1 rounded-md flex items-center gap-1"
            style={{ background: 'var(--color-surface-tertiary)', color: 'var(--color-text-secondary)' }}
          >
            <SkipForward size={10} /> Skip
          </button>
          {item.suggestedDestination && item.suggestedDestination !== 'skip' && (
            <button
              onClick={() => onRoute(item.suggestedDestination)}
              className="text-xs px-2 py-1 rounded-md"
              style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, var(--color-surface-secondary))', color: 'var(--color-text-secondary)' }}
            >
              Quick: {item.suggestedDestination}
            </button>
          )}
        </div>
      </div>

      {/* Expanded routing strip */}
      {item.showRouting && (
        <div style={{ borderTop: '1px solid var(--color-border-default)' }}>
          <RoutingStrip
            context="meeting_action"
            onRoute={(dest) => onRoute(dest)}
            onCancel={() => onToggleRouting()}
          />
        </div>
      )}
    </div>
  )
}
