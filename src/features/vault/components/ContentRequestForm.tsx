import { useState } from 'react'
import { Send, Check } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * "Request a Tutorial" form (PRD-21A Screen 7).
 * Simple form → vault_content_requests.
 */
export function ContentRequestForm({ open, onClose }: Props) {
  const { data: member } = useFamilyMember()
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!topic.trim() || !member?.id) return
    setSubmitting(true)

    await supabase.from('vault_content_requests').insert({
      user_id: member.id,
      topic: topic.trim(),
      description: description.trim() || null,
      category_suggestion: category.trim() || null,
      priority,
    })

    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => {
      onClose()
      // Reset after close animation
      setTimeout(() => {
        setTopic('')
        setDescription('')
        setCategory('')
        setPriority('medium')
        setSubmitted(false)
      }, 300)
    }, 1500)
  }

  return (
    <ModalV2
      id="vault-content-request"
      isOpen={open}
      onClose={onClose}
      type="transient"
      title="Request a Tutorial or Tool"
      size="sm"
    >
      <div className="p-4">
        {submitted ? (
          <div className="text-center py-8">
            <Check size={32} className="mx-auto mb-3" style={{ color: 'var(--color-success, #22c55e)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
              Thanks! We review all requests.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {/* Topic */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  What topic or tool are you looking for? *
                </label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g., AI meal planning, custom coloring pages..."
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Tell us more (optional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What would you like it to cover? What problem does it solve for you?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Category suggestion */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Category suggestion (optional)
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="">Not sure</option>
                  <option value="creative-fun">Creative & Fun</option>
                  <option value="home-management">Home Management</option>
                  <option value="ai-learning">AI Learning Path</option>
                  <option value="homeschool">Homeschool & Education</option>
                  <option value="ai-skills">AI Skills</option>
                  <option value="productivity">Productivity & Planning</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  How important is this to you?
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
                      style={{
                        backgroundColor: priority === p ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                        color: priority === p ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                        border: `1px solid ${priority === p ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!topic.trim() || submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                <Send size={14} />
                Submit Request
              </button>
            </div>
          </>
        )}
      </div>
    </ModalV2>
  )
}
