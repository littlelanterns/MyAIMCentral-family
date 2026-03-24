import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Users, Wand2, Check, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { FeatureGuide } from '@/components/shared'
import { useQueryClient } from '@tanstack/react-query'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'

interface ParsedMember {
  id: string
  display_name: string
  relationship: 'spouse' | 'child' | 'special'
  role: 'additional_adult' | 'special_adult' | 'member'
  dashboard_mode: 'adult' | 'independent' | 'guided' | 'play'
  age: number | null
  custom_role: string | null
  in_household: boolean
}

const DASHBOARD_MODE_LABELS: Record<string, string> = {
  adult: 'Adult Experience',
  independent: 'Independent (Teen)',
  guided: 'Guided (Younger Child)',
  play: 'Play (Youngest)',
}

export function FamilySetup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const [step, setStep] = useState<'describe' | 'preview' | 'done'>('describe')
  const [familyDescription, setFamilyDescription] = useState('')
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // PRD-01: AI-powered family description parsing
  async function handleParse() {
    if (!familyDescription.trim()) return
    setLoading(true)
    setError('')

    try {
      const systemPrompt = `You parse natural language descriptions of families into structured member data for a family management app.

For each person mentioned (NOT the user themselves), extract:
- display_name (string) — their first name
- relationship (one of: "spouse", "child", "special")
  - spouse: husband, wife, partner
  - child: son, daughter, kid, any minor
  - special: grandparent, babysitter, nanny, caregiver, au pair, tutor, any non-parent adult helper
- age (number or null) — only if stated or clearly implied
- dashboard_mode (one of: "adult", "independent", "guided", "play")
  - adult: all spouses and special adults
  - independent: teens roughly 13-17
  - guided: children roughly 6-12
  - play: children roughly 0-5
  - Use age to determine if available, otherwise infer from context
- custom_role (string or null) — for special adults only: "Grandmother", "Babysitter", "Nanny", etc.
- in_household (boolean) — true for people who live in the home, false for caregivers who visit

Rules:
- Do NOT include the user (the person writing the description) in results
- If someone is described as "my husband" or "my wife", they are relationship "spouse"
- If someone is described as a grandparent, babysitter, nanny, etc., they are relationship "special"
- All other people mentioned are relationship "child" unless clearly an adult
- Birthday information can be noted but the primary output is the structured member data

Return ONLY a JSON array. Example:
[
  {"display_name": "Mark", "relationship": "spouse", "age": 38, "dashboard_mode": "adult", "custom_role": null, "in_household": true},
  {"display_name": "Emma", "relationship": "child", "age": 14, "dashboard_mode": "independent", "custom_role": null, "in_household": true},
  {"display_name": "Linda", "relationship": "special", "age": 65, "dashboard_mode": "adult", "custom_role": "Grandmother", "in_household": false}
]`

      const response = await sendAIMessage(
        systemPrompt,
        [{ role: 'user', content: familyDescription.trim() }],
        2048,
        'haiku',
      )

      const parsed = extractJSON<Array<Record<string, unknown>>>(response)

      if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
        setError('We couldn\'t find any family members in your description. Try something like: "My husband Mark, our daughter Emma (14), our son Liam (8), and my mom Linda who babysits."')
        setLoading(false)
        return
      }

      const members: ParsedMember[] = parsed
        .filter(m => m.display_name && typeof m.display_name === 'string')
        .map(m => ({
          id: crypto.randomUUID(),
          display_name: (m.display_name as string).trim(),
          relationship: (['spouse', 'child', 'special'].includes(m.relationship as string) ? m.relationship : 'child') as ParsedMember['relationship'],
          role: m.relationship === 'spouse' ? 'additional_adult' as const
            : m.relationship === 'special' ? 'special_adult' as const
            : 'member' as const,
          dashboard_mode: (['adult', 'independent', 'guided', 'play'].includes(m.dashboard_mode as string) ? m.dashboard_mode : 'guided') as ParsedMember['dashboard_mode'],
          age: typeof m.age === 'number' && m.age > 0 ? m.age : null,
          custom_role: typeof m.custom_role === 'string' ? m.custom_role : null,
          in_household: m.in_household !== false,
        }))

      if (members.length === 0) {
        setError('We couldn\'t find any family members in your description. Try being more specific with names and relationships.')
        setLoading(false)
        return
      }

      setParsedMembers(members)
      setStep('preview')
    } catch (err) {
      setError(`Something went wrong: ${err instanceof Error ? err.message : 'Please try again.'}`)
    }
    setLoading(false)
  }

  function addManualMember() {
    setParsedMembers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        display_name: '',
        relationship: 'child',
        role: 'member',
        dashboard_mode: 'guided',
        age: null,
        custom_role: null,
        in_household: true,
      },
    ])
    if (step === 'describe') setStep('preview')
  }

  function updateMember(id: string, updates: Partial<ParsedMember>) {
    setParsedMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    )
  }

  function removeMember(id: string) {
    setParsedMembers((prev) => prev.filter((m) => m.id !== id))
  }

  async function handleSave() {
    if (!member?.family_id || parsedMembers.length === 0) return
    setSaving(true)
    setError('')

    const validMembers = parsedMembers.filter((m) => m.display_name.trim())
    if (validMembers.length === 0) {
      setError('Please enter a name for at least one family member.')
      setSaving(false)
      return
    }

    try {
      const inserts = validMembers.map((m) => ({
        family_id: member.family_id,
        display_name: m.display_name.trim(),
        role: m.role,
        dashboard_mode: m.dashboard_mode,
        relationship: m.relationship,
        age: m.age,
        custom_role: m.custom_role,
        in_household: m.in_household,
        dashboard_enabled: true,
        login_method: 'pin',
        is_active: true,
      }))

      const { error: insertError } = await supabase
        .from('family_members')
        .insert(inserts)

      if (insertError) throw insertError

      // Mark family setup as completed
      await supabase
        .from('families')
        .update({ setup_completed: true })
        .eq('id', member.family_id)

      // Invalidate queries so Dashboard refreshes
      await queryClient.invalidateQueries({ queryKey: ['family-members'] })
      await queryClient.invalidateQueries({ queryKey: ['family-member'] })

      setStep('done')
    } catch (err) {
      setError(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setSaving(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
        >
          <Check size={32} className="text-white" />
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Your family is set up!
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {parsedMembers.length} member{parsedMembers.length !== 1 ? 's' : ''} added.
          You can always add more or change settings later.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 rounded-lg font-medium text-white"
          style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <FeatureGuide
        featureKey="family_setup"
        title="Set Up Your Family"
        description="Describe your family in your own words — who lives with you, their ages, and anyone who helps with the kids. We'll create accounts for everyone."
        bullets={[
          'Dashboard mode is assigned by you, not by age',
          'Special adults (grandparents, babysitters) get a focused caregiver view',
          'Everyone can be changed later in Settings',
        ]}
      />

      <h1
        className="text-2xl font-bold"
        style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
      >
        Tell us about your family
      </h1>

      {error && (
        <p
          className="text-sm p-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-error, #b25a58)' }}
        >
          {error}
        </p>
      )}

      {/* Step 1: Describe */}
      {step === 'describe' && (
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Describe your family in your own words
            </label>
            <textarea
              value={familyDescription}
              onChange={(e) => setFamilyDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl outline-none resize-none"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              placeholder={'Example: "My husband Mark, our daughter Emma (14), our son Liam (8), our youngest Sophia (3), and my mom Linda who babysits on Tuesdays."'}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleParse}
              disabled={loading || !familyDescription.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {loading ? 'Processing with AI...' : 'Parse & Preview'}
            </button>
            <button
              onClick={addManualMember}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <Plus size={16} />
              Add One at a Time
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview & Edit */}
      {step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Review and adjust each family member. Dashboard mode determines their experience.
          </p>

          {parsedMembers.map((pm) => (
            <MemberCard
              key={pm.id}
              member={pm}
              onUpdate={(updates) => updateMember(pm.id, updates)}
              onRemove={() => removeMember(pm.id)}
            />
          ))}

          <button
            onClick={addManualMember}
            className="flex items-center gap-2 w-full justify-center py-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px dashed var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Plus size={16} /> Add Another Member
          </button>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || parsedMembers.length === 0}
              className="flex-1 py-3 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
            >
              {saving ? 'Saving...' : `Confirm & Add ${parsedMembers.length} Member${parsedMembers.length !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={() => { setStep('describe'); setParsedMembers([]) }}
              className="px-4 py-3 rounded-lg font-medium"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MemberCard({
  member,
  onUpdate,
  onRemove,
}: {
  member: ParsedMember
  onUpdate: (updates: Partial<ParsedMember>) => void
  onRemove: () => void
}) {
  return (
    <div
      className="p-4 rounded-xl space-y-3"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} style={{ color: 'var(--color-sage-teal)' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
            {member.relationship === 'spouse' ? 'Partner/Spouse' : member.relationship === 'special' ? 'Special Adult' : 'Child'}
          </span>
        </div>
        <button onClick={onRemove} className="p-1 rounded" style={{ color: 'var(--color-error, #b25a58)' }}>
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
          <input
            type="text"
            value={member.display_name}
            onChange={(e) => onUpdate({ display_name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            placeholder="Name"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Age (optional)</label>
          <input
            type="number"
            value={member.age ?? ''}
            onChange={(e) => onUpdate({ age: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            placeholder="Age"
            min={0}
            max={120}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Relationship</label>
          <select
            value={member.relationship}
            onChange={(e) => {
              const rel = e.target.value as ParsedMember['relationship']
              const role = rel === 'spouse' ? 'additional_adult' : rel === 'special' ? 'special_adult' : 'member'
              const mode = rel === 'spouse' || rel === 'special' ? 'adult' : member.dashboard_mode
              onUpdate({ relationship: rel, role, dashboard_mode: mode })
            }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="spouse">Spouse / Partner</option>
            <option value="child">Child</option>
            <option value="special">Special Adult (Caregiver)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Dashboard Mode
            {member.relationship !== 'child' && ' (auto)'}
          </label>
          <select
            value={member.dashboard_mode}
            onChange={(e) => onUpdate({ dashboard_mode: e.target.value as ParsedMember['dashboard_mode'] })}
            disabled={member.relationship !== 'child'}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            {Object.entries(DASHBOARD_MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {member.relationship === 'special' && (
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Role Label</label>
          <input
            type="text"
            value={member.custom_role ?? ''}
            onChange={(e) => onUpdate({ custom_role: e.target.value || null })}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            placeholder="e.g., Grandmother, Babysitter, Tutor"
          />
        </div>
      )}
    </div>
  )
}
