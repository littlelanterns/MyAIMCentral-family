/**
 * MessagingSettings — PRD-15 Phase E (Screen 6)
 *
 * Mom-only settings page for family messaging configuration.
 * 7 sections: Guidelines, Coaching, Permissions, Groups, Ask LiLa,
 * Content Corner, Out of Nest.
 *
 * Accessible from Messages home gear icon and Settings area.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { ArrowLeft, Save, MessageCircleHeart, Shield, Users, Bot, PlayCircle, ExternalLink } from 'lucide-react'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import {
  useMessagingSettings,
  useUpdateMessagingSettings,
  useAllCoachingSettings,
  useUpsertCoachingSetting,
  useAllMessagingPermissions,
  useToggleMessagingPermission,
} from '@/hooks/useMessagingSettings'
import { toDatetimeLocalInput } from '@/utils/dates'

interface MessagingSettingsProps {
  onClose: () => void
}

export function MessagingSettings({ onClose }: MessagingSettingsProps) {
  const { data: currentMember } = useFamilyMember()
  const familyId = currentMember?.family_id
  const { data: members } = useFamilyMembers(familyId)
  const { data: settings } = useMessagingSettings()
  const updateSettings = useUpdateMessagingSettings()
  const { data: coachingSettings } = useAllCoachingSettings()
  const upsertCoaching = useUpsertCoachingSetting()
  const { data: permissions } = useAllMessagingPermissions()
  const togglePermission = useToggleMessagingPermission()

  const [guidelines, setGuidelines] = useState('')
  const [guidelinesDirty, setGuidelinesDirty] = useState(false)
  const [viewingMode, setViewingMode] = useState<'browse' | 'locked'>('browse')
  const [lockedUntil, setLockedUntil] = useState('')

  // Sync from server
  useEffect(() => {
    if (settings) {
      setGuidelines(settings.communication_guidelines || '')
      setViewingMode(settings.content_corner_viewing_mode as 'browse' | 'locked' || 'browse')
      setLockedUntil(settings.content_corner_locked_until
        ? toDatetimeLocalInput(settings.content_corner_locked_until)
        : '')
    }
  }, [settings])

  // Non-adult members (kids/teens for coaching & permissions)
  const nonAdultMembers = useMemo(() =>
    (members ?? []).filter(m =>
      m.role === 'member' && m.id !== currentMember?.id,
    ),
  [members, currentMember])

  const allMembers = useMemo(() =>
    (members ?? []).filter(m => m.id !== currentMember?.id),
  [members, currentMember])

  // Coaching map: memberId → settings
  const coachingMap = useMemo(() => {
    const map = new Map<string, { is_enabled: boolean; custom_prompt: string | null }>()
    for (const cs of coachingSettings ?? []) {
      map.set(cs.family_member_id, { is_enabled: cs.is_enabled, custom_prompt: cs.custom_prompt })
    }
    return map
  }, [coachingSettings])

  // Permission set: "fromId:toId"
  const permSet = useMemo(() => {
    const set = new Set<string>()
    for (const p of permissions ?? []) {
      set.add(`${p.member_id}:${p.can_message_member_id}`)
    }
    return set
  }, [permissions])

  const handleSaveGuidelines = useCallback(() => {
    updateSettings.mutate({ communication_guidelines: guidelines })
    setGuidelinesDirty(false)
  }, [guidelines, updateSettings])

  const handleSaveContentCorner = useCallback(() => {
    updateSettings.mutate({
      content_corner_viewing_mode: viewingMode,
      content_corner_locked_until: viewingMode === 'locked' && lockedUntil
        ? new Date(lockedUntil).toISOString()
        : null,
    })
  }, [viewingMode, lockedUntil, updateSettings])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-primary)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            padding: '0.25rem',
            display: 'flex',
          }}
          aria-label="Close settings"
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
          Messaging Settings
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 600 }}>

          {/* 1. Family Communication Guidelines */}
          <Section icon={<MessageCircleHeart size={16} />} title="Family Communication Guidelines">
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Define your family&apos;s communication values. LiLa references these when coaching
              messages and responding in conversations.
            </p>
            <textarea
              value={guidelines}
              onChange={e => { setGuidelines(e.target.value); setGuidelinesDirty(true) }}
              placeholder="Example: We speak to each other with kindness and respect. We assume the best intentions. We ask clarifying questions before reacting..."
              rows={4}
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--vibe-radius-input, 6px)',
                padding: '0.5rem 0.625rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-primary)',
                backgroundColor: 'var(--color-bg-secondary)',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
            {guidelinesDirty && (
              <button
                onClick={handleSaveGuidelines}
                disabled={updateSettings.isPending}
                style={{
                  marginTop: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--vibe-radius-input, 6px)',
                  border: 'none',
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-text-on-primary, #fff)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  alignSelf: 'flex-end',
                }}
              >
                <Save size={13} />
                Save
              </button>
            )}
          </Section>

          {/* 2. Message Coaching */}
          <Section icon={<Shield size={16} />} title="Message Coaching">
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              When enabled, LiLa gently checks messages before they&apos;re sent. Coaching
              never blocks — members can always send as-is.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {nonAdultMembers.map(m => {
                const cs = coachingMap.get(m.id)
                const enabled = cs?.is_enabled ?? false
                return (
                  <CoachingRow
                    key={m.id}
                    memberName={m.display_name}
                    memberAge={m.age}
                    enabled={enabled}
                    customPrompt={cs?.custom_prompt ?? null}
                    onToggle={(val) => upsertCoaching.mutate({ memberId: m.id, isEnabled: val })}
                    onUpdatePrompt={(prompt) => upsertCoaching.mutate({
                      memberId: m.id,
                      isEnabled: enabled,
                      customPrompt: prompt,
                    })}
                  />
                )
              })}
              {nonAdultMembers.length === 0 && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No children or teens in the family yet.
                </p>
              )}
            </div>
          </Section>

          {/* 3. Messaging Permissions */}
          <Section icon={<Users size={16} />} title="Messaging Permissions">
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Control who can message whom. Parents can always message everyone.
              Toggle permissions for children and teens.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {nonAdultMembers.map(sender => (
                <div key={sender.id}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {sender.display_name} can message:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                    {allMembers
                      .filter(m => m.id !== sender.id)
                      .map(recipient => {
                        const isParent = recipient.role === 'primary_parent' || recipient.role === 'additional_adult'
                        const key = `${sender.id}:${recipient.id}`
                        const allowed = isParent || permSet.has(key)

                        return (
                          <button
                            key={recipient.id}
                            onClick={() => {
                              if (isParent) return // Parents always allowed
                              togglePermission.mutate({
                                memberId: sender.id,
                                canMessageMemberId: recipient.id,
                                allowed: !allowed,
                              })
                            }}
                            disabled={isParent}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: 'var(--vibe-radius-input, 6px)',
                              border: `1px solid ${allowed ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                              backgroundColor: allowed
                                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)'
                                : 'var(--color-bg-secondary)',
                              color: allowed
                                ? 'var(--color-text-primary)'
                                : 'var(--color-text-muted)',
                              fontSize: '0.75rem',
                              cursor: isParent ? 'default' : 'pointer',
                              opacity: isParent ? 0.7 : 1,
                            }}
                          >
                            {recipient.display_name}
                            {isParent && ' (always)'}
                          </button>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 4. Ask LiLa */}
          <Section icon={<Bot size={16} />} title="Ask LiLa in Conversations">
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              When enabled, family members can tap &quot;Ask LiLa &amp; Send&quot; to invite LiLa into
              a conversation. LiLa reads the conversation context and responds as a helpful guide.
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              This feature is available to all members during beta.
            </p>
          </Section>

          {/* 5. Content Corner */}
          <Section icon={<PlayCircle size={16} />} title="Content Corner">
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Family members can share links to videos, articles, and reels. Control when they can view shared content.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="ccMode"
                  checked={viewingMode === 'browse'}
                  onChange={() => setViewingMode('browse')}
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                  Browse anytime
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="ccMode"
                  checked={viewingMode === 'locked'}
                  onChange={() => setViewingMode('locked')}
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                  Locked until date/time
                </span>
              </label>
              {viewingMode === 'locked' && (
                <input
                  type="datetime-local"
                  value={lockedUntil}
                  onChange={e => setLockedUntil(e.target.value)}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--vibe-radius-input, 6px)',
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    marginLeft: '1.5rem',
                    width: 'fit-content',
                  }}
                />
              )}
              <button
                onClick={handleSaveContentCorner}
                disabled={updateSettings.isPending}
                style={{
                  marginTop: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--vibe-radius-input, 6px)',
                  border: 'none',
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-text-on-primary, #fff)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                <Save size={13} />
                Save
              </button>
            </div>
          </Section>

          {/* 6. Out of Nest */}
          <Section icon={<ExternalLink size={16} />} title="Out of Nest Members">
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Out of Nest members (grandparents, adult children) can participate in designated
              conversation spaces and receive email notifications.
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Manage Out of Nest members in Family Settings.
            </p>
          </Section>

        </div>
      </div>
    </div>
  )
}

// ── Section wrapper ──

function Section({ icon, title, children }: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--vibe-radius-card, 8px)',
        padding: '0.875rem',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

// ── Coaching row per member ──

function CoachingRow({ memberName, memberAge, enabled, customPrompt, onToggle, onUpdatePrompt }: {
  memberName: string
  memberAge: number | null
  enabled: boolean
  customPrompt: string | null
  onToggle: (val: boolean) => void
  onUpdatePrompt: (prompt: string | null) => void
}) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptText, setPromptText] = useState(customPrompt || '')

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--vibe-radius-input, 6px)',
        padding: '0.5rem 0.625rem',
        backgroundColor: 'var(--color-bg-secondary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {memberName}
          </span>
          {memberAge !== null && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginLeft: '0.375rem' }}>
              (age {memberAge})
            </span>
          )}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => onToggle(e.target.checked)}
            style={{ accentColor: 'var(--color-btn-primary-bg)' }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            {enabled ? 'On' : 'Off'}
          </span>
        </label>
      </div>

      {enabled && (
        <div style={{ marginTop: '0.375rem' }}>
          {showPrompt ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <textarea
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                placeholder="Optional coaching focus for this member..."
                rows={2}
                style={{
                  width: '100%',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--vibe-radius-input, 6px)',
                  padding: '0.375rem 0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-bg-primary)',
                  fontFamily: 'inherit',
                  resize: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { onUpdatePrompt(promptText || null); setShowPrompt(false) }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--vibe-radius-input, 6px)',
                    border: 'none',
                    backgroundColor: 'var(--color-btn-primary-bg)',
                    color: 'var(--color-text-on-primary, #fff)',
                    fontSize: '0.6875rem',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPrompt(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.6875rem',
                color: 'var(--color-text-muted)',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              {customPrompt ? 'Edit coaching focus' : 'Add coaching focus'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
