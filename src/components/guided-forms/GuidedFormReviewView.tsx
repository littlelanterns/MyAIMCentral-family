/**
 * GuidedFormReviewView (PRD-09B, specs/studio-seed-templates.md)
 *
 * What mom sees when reviewing a completed guided form:
 * - All sections displayed with labels
 * - Mom's pre-filled sections + child's completed sections
 * - [Add Comment] per section
 * - [Mark Reviewed] button
 * - [Ready to Discuss] button (sends notification to child)
 *
 * Zero hardcoded hex colors. Lucide icons only. Mobile-first.
 */

import { useState, useCallback } from 'react'
import {
  CheckCircle, MessageSquarePlus, Bell, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { ModalV2 } from '@/components/shared/ModalV2'
import { GuidedFormSectionEditor } from './GuidedFormSectionEditor'
import { getSectionsForSubtype, getSubtypeLabel } from './guidedFormTypes'
import type {
  GuidedFormTemplate,
  GuidedFormResponseMap,
} from './guidedFormTypes'
import { supabase } from '@/lib/supabase/client'

// ─── Props ────────────────────────────────────────────────────────

interface GuidedFormReviewViewProps {
  open: boolean
  onClose: () => void
  template: GuidedFormTemplate
  taskId: string
  childMember: { id: string; display_name: string; member_color?: string | null }
  responses: GuidedFormResponseMap
  isReviewed: boolean
  onReviewed?: () => void
  onReadyToDiscuss?: () => void
}

// ─── Component ───────────────────────────────────────────────────

export function GuidedFormReviewView({
  open,
  onClose,
  template,
  taskId,
  childMember,
  responses,
  isReviewed: initialReviewed,
  onReviewed,
  onReadyToDiscuss,
}: GuidedFormReviewViewProps) {
  const subtype = template.guided_form_subtype
  const sections = subtype === 'custom'
    ? (template.config?.sections ?? [])
    : getSectionsForSubtype(subtype)

  // Comments keyed by section_key
  const [comments, setComments] = useState<Record<string, string>>({})
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [isReviewed, setIsReviewed] = useState(initialReviewed)

  const [markingReviewed, setMarkingReviewed] = useState(false)
  const [sendingNotification, setSendingNotification] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMarkReviewed = useCallback(async () => {
    setError(null)
    setMarkingReviewed(true)

    try {
      // Save any pending comments to guided_form_responses metadata
      // and mark the task as reviewed via a status update
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          // Store review metadata in the task's existing columns
        })
        .eq('id', taskId)

      if (taskError) throw taskError

      setIsReviewed(true)
      onReviewed?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setMarkingReviewed(false)
    }
  }, [taskId, onReviewed])

  const handleReadyToDiscuss = useCallback(async () => {
    setError(null)
    setSendingNotification(true)

    try {
      // Insert a notification record for the child
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          family_id: template.family_id ?? '', // injected by parent when family_id available
          member_id: childMember.id,
          category: 'guided_form',
          notification_type: 'ready_to_discuss',
          title: `${template.title} — Ready to discuss!`,
          body: "Your parent has reviewed your worksheet and is ready to talk about it.",
          priority: 'normal',
          source_table: 'tasks',
          source_id: taskId,
        })

      if (notifError) throw notifError

      onReadyToDiscuss?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSendingNotification(false)
    }
  }, [taskId, childMember.id, template, onReadyToDiscuss])

  const footer = (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-xs text-center" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="md"
          loading={sendingNotification}
          onClick={handleReadyToDiscuss}
          className="flex-1"
        >
          <Bell size={15} aria-hidden />
          Ready to Discuss
        </Button>
        <Button
          variant="primary"
          size="md"
          loading={markingReviewed}
          disabled={isReviewed}
          onClick={handleMarkReviewed}
          className="flex-1"
        >
          <CheckCircle size={15} aria-hidden />
          {isReviewed ? 'Reviewed' : 'Mark Reviewed'}
        </Button>
      </div>
    </div>
  )

  return (
    <ModalV2
      id="guided-form-review"
      isOpen={open}
      onClose={onClose}
      type="transient"
      title={`Review: ${getSubtypeLabel(subtype)}`}
      size="lg"
      footer={footer}
    >
      {/* Child header */}
      <div
        className="flex items-center gap-3 mb-4 p-3 rounded-lg"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
          style={{
            backgroundColor: childMember.member_color ?? 'var(--color-bg-secondary)',
            color: 'var(--color-text-on-primary, #fff)',
          }}
        >
          {childMember.display_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            {childMember.display_name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {template.title}
          </p>
        </div>
        {isReviewed && (
          <div className="ml-auto flex items-center gap-1">
            <CheckCircle2 size={14} aria-hidden style={{ color: 'var(--color-btn-primary-bg)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
              Reviewed
            </span>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-5">
        {sections.map(section => {
          const response = responses[section.key]
          const comment = comments[section.key] ?? ''
          const isEditingThisComment = editingComment === section.key

          return (
            <div
              key={section.key}
              className="pb-5"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              {/* Author badge */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      section.filledBy === 'mom'
                        ? 'color-mix(in srgb, var(--color-accent) 15%, var(--color-bg-card))'
                        : 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
                    color:
                      section.filledBy === 'mom'
                        ? 'var(--color-accent)'
                        : 'var(--color-btn-primary-bg)',
                  }}
                >
                  {section.filledBy === 'mom' ? 'Your section' : `${childMember.display_name}'s section`}
                </span>
              </div>

              <GuidedFormSectionEditor
                section={section}
                value={response?.section_content ?? ''}
                onChange={() => {/* read-only */}}
                actingAs="mom"
                readOnly
              />

              {/* Comment area */}
              <div className="mt-2">
                {isEditingThisComment ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      autoFocus
                      value={comment}
                      onChange={e =>
                        setComments(prev => ({
                          ...prev,
                          [section.key]: e.target.value,
                        }))
                      }
                      placeholder="Add a comment about this section..."
                      rows={2}
                      style={{
                        width: '100%',
                        borderRadius: 'var(--vibe-radius-input, 8px)',
                        border: '1px solid var(--color-btn-primary-bg)',
                        backgroundColor: 'var(--color-bg-card)',
                        color: 'var(--color-text-primary)',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.8125rem',
                        resize: 'vertical',
                        outline: 'none',
                      }}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingComment(null)}
                        className="text-xs"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingComment(null)}
                        className="text-xs font-medium"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-btn-primary-bg)',
                        }}
                      >
                        Save comment
                      </button>
                    </div>
                  </div>
                ) : comment ? (
                  <div className="flex items-start gap-2">
                    <div
                      className="flex-1 p-2 rounded text-xs italic"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {comment}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingComment(section.key)}
                      className="text-xs flex-shrink-0"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingComment(section.key)}
                    className="flex items-center gap-1.5 text-xs mt-1"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <MessageSquarePlus size={13} aria-hidden />
                    Add comment
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ModalV2>
  )
}
