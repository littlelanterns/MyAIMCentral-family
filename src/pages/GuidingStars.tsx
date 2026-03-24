import { useState } from 'react'
import { Star, Plus, Pencil, Trash2, Sparkles } from 'lucide-react'
import { FeatureIcon } from '@/components/shared'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useGuidingStars,
  useCreateGuidingStar,
  useUpdateGuidingStar,
  useDeleteGuidingStar,
} from '@/hooks/useGuidingStars'
import type { GuidingStar } from '@/hooks/useGuidingStars'

export function GuidingStarsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: stars = [], isLoading } = useGuidingStars(member?.id)
  const createStar = useCreateGuidingStar()
  const updateStar = useUpdateGuidingStar()
  const deleteStar = useDeleteGuidingStar()

  const [showCreate, setShowCreate] = useState(false)
  const [editingStar, setEditingStar] = useState<GuidingStar | null>(null)
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')

  function resetForm() {
    setFormContent('')
    setFormCategory('')
    setFormDescription('')
    setShowCreate(false)
    setEditingStar(null)
  }

  async function handleCreate() {
    if (!member || !family || !formContent.trim()) return
    await createStar.mutateAsync({
      family_id: family.id,
      member_id: member.id,
      content: formContent.trim(),
      category: formCategory.trim() || undefined,
      description: formDescription.trim() || undefined,
    })
    resetForm()
  }

  async function handleUpdate() {
    if (!editingStar || !formContent.trim()) return
    await updateStar.mutateAsync({
      id: editingStar.id,
      content: formContent.trim(),
      category: formCategory.trim() || null,
      description: formDescription.trim() || null,
    })
    resetForm()
  }

  async function handleDelete(star: GuidingStar) {
    if (!member) return
    await deleteStar.mutateAsync({ id: star.id, memberId: member.id })
  }

  function startEdit(star: GuidingStar) {
    setEditingStar(star)
    setFormContent(star.content)
    setFormCategory(star.category ?? '')
    setFormDescription(star.description ?? '')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="guiding_stars" fallback={<Star size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={32} />
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            GuidingStars
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          <Plus size={16} />
          Add Star
        </button>
      </div>

      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Your values and direction. GuidingStars illuminate what matters most to you.
      </p>

      {/* STUB: Craft with LiLa button — wires to PRD-06 AI craft mode */}

      {/* Create / Edit Form */}
      {(showCreate || editingStar) && (
        <div
          className="p-4 rounded-lg space-y-3"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <h2
            className="text-lg font-medium"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {editingStar ? 'Edit Guiding Star' : 'New Guiding Star'}
          </h2>
          <input
            type="text"
            placeholder="What guides you?"
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <input
            type="text"
            placeholder="Category (optional)"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <textarea
            placeholder="Description (optional)"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={editingStar ? handleUpdate : handleCreate}
              disabled={!formContent.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {editingStar ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Star List */}
      {isLoading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : stars.length === 0 ? (
        <div
          className="p-8 rounded-lg text-center"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <Sparkles size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No guiding stars yet. Add your first star to define what matters most.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {stars.map((star) => (
            <div
              key={star.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
                    {star.content}
                  </p>
                  {star.category && (
                    <span
                      className="inline-block mt-1 px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                    >
                      {star.category}
                    </span>
                  )}
                  {star.description && (
                    <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {star.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(star)}
                    className="p-1.5 rounded"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(star)}
                    className="p-1.5 rounded"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
