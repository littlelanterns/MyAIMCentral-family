/**
 * GuidingStars Page — PRD-06
 * Adapted from StewardShip's Mast pattern.
 * Values, declarations, priorities with is_included_in_ai toggle per entry.
 */

import { useState } from 'react'
import { Star, Plus, Pencil, Trash2, Sparkles, Eye, EyeOff, BookOpen } from 'lucide-react'
import { FeatureGuide, FeatureIcon, Modal, BulkAddWithAI } from '@/components/shared'
// The Art of Honest Declarations article — loaded as raw text via Vite
import declarationsArticle from '../../reference/The-Art-of-Honest-Declarations.md?raw'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useGuidingStars,
  useCreateGuidingStar,
  useUpdateGuidingStar,
  useDeleteGuidingStar,
  useToggleGuidingStarAI,
} from '@/hooks/useGuidingStars'
import type { GuidingStar } from '@/hooks/useGuidingStars'

const CATEGORIES = [
  'Value', 'Declaration', 'Scripture', 'Vision', 'Priority', 'Principle', 'Custom',
]

export function GuidingStarsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: stars = [], isLoading } = useGuidingStars(member?.id)
  const createStar = useCreateGuidingStar()
  const updateStar = useUpdateGuidingStar()
  const deleteStar = useDeleteGuidingStar()
  const toggleAI = useToggleGuidingStarAI()

  const [showCreate, setShowCreate] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
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
    if (!member || !confirm('Remove this guiding star?')) return
    await deleteStar.mutateAsync({ id: star.id, memberId: member.id })
  }

  async function handleToggleAI(star: GuidingStar) {
    if (!member) return
    await toggleAI.mutateAsync({
      id: star.id,
      memberId: member.id,
      included: !star.is_included_in_ai,
    })
  }

  function startEdit(star: GuidingStar) {
    setEditingStar(star)
    setFormContent(star.content)
    setFormCategory(star.category ?? '')
    setFormDescription(star.description ?? '')
  }

  const [showInspiration, setShowInspiration] = useState(false)
  const includedCount = stars.filter(s => s.is_included_in_ai).length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <FeatureGuide featureKey="guiding_stars" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="guiding_stars" fallback={<Star size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={40} className="!w-10 !h-10 md:!w-36 md:!h-36" assetSize={512} />
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
            >
              Guiding Stars
            </h1>
            {stars.length > 0 && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {includedCount} of {stars.length} included in AI context
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-btn-primary-bg)', border: '1px solid var(--color-border)' }}
            title="Bulk add guiding stars with AI"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Bulk</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {showBulkAdd && member && family && (
        <BulkAddWithAI
          title="Bulk Add Guiding Stars"
          placeholder={'Paste or type multiple guiding stars, one per line. E.g.:\nI lead with kindness in every interaction\nFamily meals together matter more than perfection\nGrowth over comfort — always learning'}
          hint="AI will parse and categorize each entry as a Value, Declaration, Vision, Priority, Principle, or Scripture."
          categories={CATEGORIES.map(c => ({ value: c.toLowerCase(), label: c }))}
          parsePrompt='Parse the following text into individual guiding star entries. Each should be a meaningful value, declaration, priority, vision, principle, or scripture. Categorize each with one of: value, declaration, scripture, vision, priority, principle, custom. Return JSON: [{"text": "entry text", "category": "value"}, ...].'
          onSave={async (parsed) => {
            for (const item of parsed.filter(i => i.selected)) {
              await createStar.mutateAsync({
                family_id: family.id,
                member_id: member.id,
                content: item.text,
                category: item.category || undefined,
              })
            }
          }}
          onClose={() => setShowBulkAdd(false)}
        />
      )}

      {/* Create / Edit Form */}
      {(showCreate || editingStar) && (
        <div
          className="p-4 rounded-xl space-y-3"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            {editingStar ? 'Edit Guiding Star' : 'New Guiding Star'}
          </h2>

          <textarea
            placeholder="What guides you? A value, declaration, scripture, or vision statement..."
            value={formContent}
            onChange={e => setFormContent(e.target.value)}
            rows={3}
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />

          {/* Inspiration link */}
          <button
            onClick={() => setShowInspiration(true)}
            className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
            style={{ color: 'var(--color-btn-primary-bg)' }}
          >
            <BookOpen size={14} />
            For inspiration, read "The Art of Honest Declarations"
          </button>

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFormCategory(formCategory === cat ? '' : cat)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: formCategory === cat ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                  color: formCategory === cat ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Why does this matter to you? (optional)"
            value={formDescription}
            onChange={e => setFormDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />

          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Cancel
            </button>
            <button
              onClick={editingStar ? handleUpdate : handleCreate}
              disabled={!formContent.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            >
              {editingStar ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Star List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 rounded-full" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-btn-primary-bg)' }} />
        </div>
      ) : stars.length === 0 ? (
        <div className="p-8 rounded-xl text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <Sparkles size={32} className="mx-auto mb-3" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>No guiding stars yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Add your values, declarations, scriptures, or vision statements — they anchor everything LiLa does for you.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {stars.map(star => (
            <div
              key={star.id}
              className="p-4 rounded-xl transition-all"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: `1px solid ${star.is_included_in_ai ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                opacity: star.is_included_in_ai ? 1 : 0.7,
              }}
            >
              <div className="flex items-start gap-3">
                {/* AI context toggle */}
                <button
                  onClick={() => handleToggleAI(star)}
                  className="mt-0.5 p-1 rounded transition-colors flex-shrink-0"
                  title={star.is_included_in_ai ? 'Included in AI context — click to exclude' : 'Excluded from AI context — click to include'}
                  style={{
                    color: star.is_included_in_ai ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                  }}
                >
                  {star.is_included_in_ai ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
                    {star.content}
                  </p>
                  {star.category && (
                    <span
                      className="inline-block mt-1 px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)', color: 'var(--color-btn-primary-bg)' }}
                    >
                      {star.category}
                    </span>
                  )}
                  {star.description && (
                    <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {star.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(star)} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(star)} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspiration Article Modal */}
      <Modal
        open={showInspiration}
        onClose={() => setShowInspiration(false)}
        title="The Art of Honest Declarations"
        size="lg"
      >
        <div
          className="prose prose-sm max-w-none overflow-y-auto"
          style={{
            maxHeight: '70vh',
            color: 'var(--color-text-primary)',
            lineHeight: 1.7,
          }}
        >
          {declarationsArticle.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i} style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginTop: '1.5rem' }}>{line.slice(2)}</h1>
            if (line.startsWith('## ')) return <h2 key={i} style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginTop: '1.25rem' }}>{line.slice(3)}</h2>
            if (line.startsWith('### ')) return <h3 key={i} style={{ color: 'var(--color-text-heading)', fontSize: '1rem', marginTop: '1rem' }}>{line.slice(4)}</h3>
            if (line.startsWith('---')) return <hr key={i} style={{ borderColor: 'var(--color-border)', margin: '1rem 0' }} />
            if (line.startsWith('*') && line.endsWith('*')) return <p key={i} style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>{line.slice(1, -1)}</p>
            if (line.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: '3px solid var(--color-btn-primary-bg)', paddingLeft: '0.75rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: '0.75rem 0' }}>{line.slice(2)}</blockquote>
            if (line.trim() === '') return <br key={i} />
            return <p key={i} style={{ margin: '0.5rem 0' }}>{line}</p>
          })}
        </div>
      </Modal>
    </div>
  )
}
