import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Wand2, Check, Loader, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { FeatureGuide } from '@/components/shared'
import { useQueryClient } from '@tanstack/react-query'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'
import { MEMBER_COLORS, getContrastText } from '@/config/member_colors'

interface ParsedMember {
  id: string
  display_name: string
  relationship: 'spouse' | 'child' | 'special' | 'out_of_nest'
  role: 'additional_adult' | 'special_adult' | 'member'
  dashboard_mode: 'adult' | 'independent' | 'guided' | 'play'
  date_of_birth: string | null
  age: number | null
  member_color: string
  custom_role: string | null
  in_household: boolean
  selected: boolean          // PRD-01: include/exclude checkbox
  isDuplicate: boolean       // PRD-01: duplicate detection flag
}

function calculateAge(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

function pinFromBirthday(dob: string): string {
  if (!dob) return '0000'
  const parts = dob.split('-')
  if (parts.length === 3) return parts[1] + parts[2]
  return '0000'
}

const DASHBOARD_MODE_LABELS: Record<string, string> = {
  adult: 'Adult Dashboard',
  independent: 'Independent Mode — Full Features',
  guided: 'Guided Mode — Guided Experience',
  play: 'Play Mode — Fun & Gamified',
}

export function FamilySetup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: member } = useFamilyMember()
  const { data: _family } = useFamily()
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
      const currentYear = new Date().getFullYear()
      const systemPrompt = `You parse natural language descriptions of families into structured member data for a family management app.

For each person mentioned (NOT the user themselves), extract:
- display_name (string) — their first name
- relationship (one of: "spouse", "child", "special", "out_of_nest")
  - spouse: husband, wife, partner
  - child: son, daughter, kid, any minor living in the household
  - special: babysitter, nanny, caregiver, au pair, tutor — adult helpers who assist with the kids
  - out_of_nest: adult children who moved out, children in college, son/daughter-in-law, grandchildren and their spouses — anyone below mom on the family tree who doesn't live in the household
  - IMPORTANT: Grandparents who help with kids are "special", NOT "out_of_nest"
- date_of_birth (string "YYYY-MM-DD" or null) — extract if any birthday info is mentioned. If only age is given, use null.
- age (number or null) — extract if stated or clearly implied. If date_of_birth is given, calculate from that.
- dashboard_mode (one of: "adult", "independent", "guided", "play")
  - adult: all spouses, special adults, and out_of_nest
  - independent: teens roughly 13-17
  - guided: children roughly 6-12
  - play: children roughly 0-5
  - Use age to determine if available, otherwise infer from context
- custom_role (string or null) — for special adults: "Grandmother", "Babysitter", "Nanny", etc. For out_of_nest: "Adult Daughter", "Son-in-Law", "Grandchild", etc.
- in_household (boolean) — true for people who live in the home, false for out_of_nest and visiting caregivers

Birthday extraction rules:
- The current year is ${currentYear}.
- "Emma, age 10, birthday March 15" → date_of_birth: "${currentYear - 10}-03-15", age: 10
- "John born 5/20/2008" → date_of_birth: "2008-05-20", calculate age from that
- "Sarah turns 12 on December 1st" → date_of_birth: "${currentYear - 12}-12-01", age: 12
- If only age is given with no birthday, set date_of_birth: null and age to the number
- Always return dates as YYYY-MM-DD

General rules:
- Do NOT include the user (the person writing the description) in results
- If someone is described as "my husband" or "my wife", they are relationship "spouse"
- If someone is "moved out", "in college", "adult daughter/son", "married" → "out_of_nest"
- If someone is a babysitter, nanny, grandparent who helps → "special"
- Children living at home → "child"

Return ONLY a JSON array. Example:
[
  {"display_name": "Mark", "relationship": "spouse", "date_of_birth": "1988-06-15", "age": 38, "dashboard_mode": "adult", "custom_role": null, "in_household": true},
  {"display_name": "Emma", "relationship": "child", "date_of_birth": "2012-03-15", "age": 14, "dashboard_mode": "independent", "custom_role": null, "in_household": true},
  {"display_name": "Sarah", "relationship": "out_of_nest", "date_of_birth": null, "age": 22, "dashboard_mode": "adult", "custom_role": "Adult Daughter", "in_household": false},
  {"display_name": "Linda", "relationship": "special", "date_of_birth": null, "age": 65, "dashboard_mode": "adult", "custom_role": "Grandmother", "in_household": false}
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

      // PRD-01: Fetch existing family members for duplicate detection
      let existingNames: string[] = []
      if (member?.family_id) {
        const { data: existing } = await supabase
          .from('family_members')
          .select('display_name')
          .eq('family_id', member.family_id)
          .eq('is_active', true)
        if (existing) {
          existingNames = existing.map((m) => m.display_name.toLowerCase().trim())
        }
      }

      let colorIndex = 0
      const members: ParsedMember[] = parsed
        .filter(m => m.display_name && typeof m.display_name === 'string')
        .map(m => {
          const dob = typeof m.date_of_birth === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.date_of_birth)
            ? m.date_of_birth
            : null
          const ageFromDob = dob ? calculateAge(dob) : null
          const age = ageFromDob ?? (typeof m.age === 'number' && m.age > 0 ? m.age : null)

          const relationship = (['spouse', 'child', 'special', 'out_of_nest'].includes(m.relationship as string)
            ? m.relationship : 'child') as ParsedMember['relationship']
          const dashboardMode = (['adult', 'independent', 'guided', 'play'].includes(m.dashboard_mode as string)
            ? m.dashboard_mode : 'guided') as ParsedMember['dashboard_mode']

          // Role derives from relationship (PRD-01: 4-value role model)
          // Children are always role='member' with dashboard_mode determining their shell
          let role: ParsedMember['role']
          if (relationship === 'spouse') role = 'additional_adult'
          else if (relationship === 'special') role = 'special_adult'
          else role = 'member'

          // Auto-assign unique colors round-robin
          const member_color = MEMBER_COLORS[colorIndex % MEMBER_COLORS.length].hex
          colorIndex++

          const displayName = (m.display_name as string).trim()

          // PRD-01: Duplicate detection
          const isDuplicate = existingNames.includes(displayName.toLowerCase())

          return {
            id: crypto.randomUUID(),
            display_name: displayName,
            relationship,
            role,
            dashboard_mode: dashboardMode,
            date_of_birth: dob,
            age,
            member_color,
            custom_role: typeof m.custom_role === 'string' ? m.custom_role : null,
            in_household: relationship !== 'out_of_nest' && m.in_household !== false,
            selected: !isDuplicate, // PRD-01: auto-deselect duplicates
            isDuplicate,
          }
        })

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
    setParsedMembers((prev) => {
      const nextColor = MEMBER_COLORS[prev.length % MEMBER_COLORS.length].hex
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          display_name: '',
          relationship: 'child' as const,
          role: 'member' as const,
          dashboard_mode: 'guided' as const,
          date_of_birth: null,
          age: null,
          member_color: nextColor,
          custom_role: null,
          in_household: true,
          selected: true,
          isDuplicate: false,
        },
      ]
    })
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

    // PRD-01: Only save selected members with names
    const validMembers = parsedMembers.filter((m) => m.selected && m.display_name.trim())
    if (validMembers.length === 0) {
      setError('Please select at least one family member to add.')
      setSaving(false)
      return
    }

    try {
      // Split members into household (family_members) and out-of-nest (separate table)
      const householdMembers = validMembers.filter((m) => m.relationship !== 'out_of_nest')
      const outOfNestMembers = validMembers.filter((m) => m.relationship === 'out_of_nest')

      // Insert household members into family_members
      if (householdMembers.length > 0) {
        const inserts = householdMembers.map((m) => ({
          family_id: member.family_id,
          display_name: m.display_name.trim(),
          role: m.role,
          dashboard_mode: m.dashboard_mode,
          relationship: m.relationship,
          date_of_birth: m.date_of_birth,
          age: m.date_of_birth ? calculateAge(m.date_of_birth) : m.age,
          member_color: m.member_color,
          custom_role: m.custom_role,
          in_household: true,
          dashboard_enabled: true,
          auth_method: 'pin',
          is_active: true,
        }))

        const { data: insertedMembers, error: insertError } = await supabase
          .from('family_members')
          .insert(inserts)
          .select('id, date_of_birth')

        if (insertError) throw insertError

        // Auto-generate and hash PINs for each member (MMDD from birthday, or 0000)
        // Archive folders + dashboard_configs are auto-created by DB trigger
        if (insertedMembers) {
          await Promise.all(
            insertedMembers.map((m) => {
              const pin = pinFromBirthday(m.date_of_birth)
              return supabase.rpc('hash_member_pin', {
                p_member_id: m.id,
                p_pin: pin,
              })
            }),
          )
        }
      }

      // Insert Out of Nest members into out_of_nest_members (PRD-15)
      if (outOfNestMembers.length > 0) {
        const oonInserts = outOfNestMembers.map((m) => ({
          family_id: member.family_id,
          name: m.display_name.trim(),
          relationship: m.custom_role || 'family',
          invited_by: member.id,
          invitation_status: 'pending',
        }))

        const { error: oonError } = await supabase
          .from('out_of_nest_members')
          .insert(oonInserts)

        if (oonError) throw oonError
      }

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
    const addedCount = parsedMembers.filter((m) => m.selected).length
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
          {addedCount} member{addedCount !== 1 ? 's' : ''} added.
          PINs were auto-set from birthdays (MMDD) — you can change them in Family Members.
        </p>

        {/* PRD-01: Prompt to set up Family Login Name after bulk add */}
        <div
          className="p-4 rounded-xl space-y-3"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Set up your Family Login Name
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            This is the fun name your family types when logging in from a shared device. Make it memorable!
          </p>
          <button
            onClick={() => navigate('/family-login-name')}
            className="w-full py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
          >
            Set Up Family Login Name
          </button>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm underline"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Skip for now
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="hidden md:flex items-center gap-1 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <FeatureGuide
        featureKey="family_setup"
        title="Set Up Your Family"
        description="Describe your family in your own words — who lives with you, their ages and birthdays, and anyone who helps with the kids. We'll create accounts for everyone."
        bullets={[
          'Mention birthdays and we\'ll extract them automatically',
          'Each member gets a PIN auto-generated from their birthday (MMDD)',
          'Dashboard style is just how it looks — you choose what fits each person',
          'Special adults (grandparents, babysitters) get a focused caregiver view',
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
              placeholder={'Example: "My husband Mark (born June 15), our daughter Emma (14, birthday March 15), our son Liam (8), our youngest Sophia (born 4/2/2023), and my mom Linda who babysits on Tuesdays."'}
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
              {saving ? 'Saving...' : `Confirm & Add ${parsedMembers.filter(m => m.selected).length} Member${parsedMembers.filter(m => m.selected).length !== 1 ? 's' : ''}`}
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
      className="p-4 rounded-xl space-y-3 card-hover"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: member.isDuplicate
          ? '2px solid var(--color-warning, #f59e0b)'
          : '1px solid var(--color-border)',
        opacity: member.selected ? 1 : 0.5,
      }}
    >
      {/* PRD-01: Duplicate warning banner */}
      {member.isDuplicate && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{
            backgroundColor: 'var(--color-warning-surface, #fef3c7)',
            color: 'var(--color-warning-text, #92400e)',
          }}
        >
          A member named &quot;{member.display_name}&quot; already exists. This may be a duplicate.
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* PRD-01: Include/exclude checkbox */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={member.selected}
              onChange={(e) => onUpdate({ selected: e.target.checked })}
              className="w-4 h-4 rounded accent-current"
              style={{ accentColor: 'var(--color-sage-teal, #68a395)' }}
            />
          </label>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
            style={{ backgroundColor: member.member_color, color: getContrastText(member.member_color) }}
          >
            {member.display_name ? member.display_name.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
            {member.relationship === 'spouse' ? 'Partner/Spouse'
              : member.relationship === 'special' ? 'Special Adult'
              : member.relationship === 'out_of_nest' ? 'Out of Nest'
              : 'Child'}
          </span>
        </div>
        <button onClick={onRemove} className="p-1 rounded" style={{ color: 'var(--color-error, #b25a58)' }}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Color picker */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Settings size={12} style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }} />
          <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Color</label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MEMBER_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => onUpdate({ member_color: c.hex })}
              className="w-6 h-6 rounded-full border-0 p-0 cursor-pointer"
              style={{
                backgroundColor: c.hex,
                outline: member.member_color === c.hex ? '2px solid var(--color-text-primary)' : 'none',
                outlineOffset: '2px',
                transform: member.member_color === c.hex ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: member.member_color === c.hex ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              }}
              title={c.name}
            />
          ))}
        </div>
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
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Birthday
            {member.age != null && <span className="ml-1 opacity-70">(Age {member.age})</span>}
          </label>
          <input
            type="date"
            value={member.date_of_birth ?? ''}
            onChange={(e) => {
              const dob = e.target.value || null
              const age = dob ? calculateAge(dob) : member.age
              onUpdate({ date_of_birth: dob, age })
            }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          {!member.date_of_birth && (
            <div className="mt-1">
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
                placeholder="Or enter age"
                min={0}
                max={120}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Relationship</label>
          <select
            value={member.relationship}
            onChange={(e) => {
              const rel = e.target.value as ParsedMember['relationship']
              const isAdult = rel === 'spouse' || rel === 'special'
              const mode = isAdult ? 'adult' as const : member.dashboard_mode === 'adult' ? 'guided' as const : member.dashboard_mode
              const role = rel === 'spouse' ? 'additional_adult' as const
                : rel === 'special' ? 'special_adult' as const
                : 'member' as const
              onUpdate({
                relationship: rel,
                role,
                dashboard_mode: mode,
                in_household: rel !== 'out_of_nest',
              })
            }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="spouse">Spouse / Partner</option>
            <option value="child">Child (In Household)</option>
            <option value="special">Special Adult (Caregiver)</option>
            <option value="out_of_nest">Out of Nest (Doesn't Live Here)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {member.relationship === 'out_of_nest' ? 'Access' : 'Dashboard Style'}
            {member.relationship !== 'child' && ' (auto)'}
          </label>
          {member.relationship === 'out_of_nest' ? (
            <div
              className="w-full px-3 py-2 rounded-lg text-sm opacity-60"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Conversation spaces only
            </div>
          ) : (
            <select
              value={member.dashboard_mode}
              onChange={(e) => {
                const mode = e.target.value as ParsedMember['dashboard_mode']
                const role = 'member' as const
                onUpdate({ dashboard_mode: mode, role })
              }}
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
          )}
        </div>
      </div>

      {(member.relationship === 'special' || member.relationship === 'out_of_nest') && (
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {member.relationship === 'out_of_nest' ? 'Relationship' : 'Role Label'}
          </label>
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
            placeholder={member.relationship === 'out_of_nest'
              ? 'e.g., Adult Daughter, Son-in-Law, Grandchild'
              : 'e.g., Grandmother, Babysitter, Tutor'}
          />
        </div>
      )}
    </div>
  )
}
