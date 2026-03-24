import { useState } from 'react'
import { Target, Plus, Pencil, RotateCcw, Sparkles } from 'lucide-react'
import { FeatureIcon, BulkAddWithAI } from '@/components/shared'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useBestIntentions, useCreateBestIntention, useUpdateBestIntention } from '@/hooks/useBestIntentions'
import type { BestIntention } from '@/hooks/useBestIntentions'

export function BestIntentionsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: intentions = [], isLoading } = useBestIntentions(member?.id)
  const createIntention = useCreateBestIntention()
  const updateIntention = useUpdateBestIntention()

  const [showCreate, setShowCreate] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [editing, setEditing] = useState<BestIntention | null>(null)
  const [formStatement, setFormStatement] = useState('')

  function resetForm() {
    setFormStatement('')
    setShowCreate(false)
    setEditing(null)
  }

  async function handleCreate() {
    if (!member || !family || !formStatement.trim()) return
    await createIntention.mutateAsync({
      family_id: family.id,
      member_id: member.id,
      statement: formStatement.trim(),
    })
    resetForm()
  }

  async function handleUpdate() {
    if (!editing || !formStatement.trim()) return
    await updateIntention.mutateAsync({ id: editing.id, statement: formStatement.trim() })
    resetForm()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="best_intentions" fallback={<Target size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={32} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
            BestIntentions
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-btn-primary-bg)', border: '1px solid var(--color-border)' }}
            title="Bulk add intentions with AI"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Bulk</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
          >
            <Plus size={16} /> Add Intention
          </button>
        </div>
      </div>

      {showBulkAdd && member && family && (
        <BulkAddWithAI
          title="Bulk Add Intentions"
          placeholder={'Paste or type multiple intentions, one per line. E.g.:\nI intend to be more present with my kids\nI intend to move my body every morning\nI intend to respond instead of react'}
          hint="AI will parse your text into individual intention statements."
          parsePrompt='Parse the following text into individual intention statements. Each should be a clear, personal statement (often starting with "I intend to..." but not required). Return a JSON array of strings: ["intention1", "intention2", ...].'
          onSave={async (parsed) => {
            for (const item of parsed.filter(i => i.selected)) {
              await createIntention.mutateAsync({
                family_id: family.id,
                member_id: member.id,
                statement: item.text,
              })
            }
          }}
          onClose={() => setShowBulkAdd(false)}
        />
      )}

      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        This is a Ta-Da list, not a to-do list. Celebrate every iteration.
      </p>

      {(showCreate || editing) && (
        <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <input
            type="text"
            placeholder="I intend to..."
            value={formStatement}
            onChange={(e) => setFormStatement(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (editing ? handleUpdate() : handleCreate())}
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button
              onClick={editing ? handleUpdate : handleCreate}
              disabled={!formStatement.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            >
              {editing ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : intentions.length === 0 ? (
        <div className="p-8 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <Target size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>No intentions yet. What do you intend to bring into your life?</p>
        </div>
      ) : (
        <div className="space-y-3">
          {intentions.map(intention => (
            <div key={intention.id} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>{intention.statement}</p>
                  <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <span><RotateCcw size={12} className="inline mr-1" />{intention.iteration_count} iterations</span>
                    <span>{intention.celebration_count} celebrations</span>
                  </div>
                </div>
                <button
                  onClick={() => { setEditing(intention); setFormStatement(intention.statement) }}
                  className="p-1.5 rounded"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
