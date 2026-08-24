import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Wand2, Check, Loader, Settings, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { FeatureGuide } from '@/components/shared'
import { useQueryClient } from '@tanstack/react-query'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'
import { MEMBER_COLORS, getContrastText } from '@/config/member_colors'
import { CoppaConsentFlow } from '@/components/coppa/CoppaConsentFlow'
import { CoppaAcknowledgeModal } from '@/components/coppa/CoppaAcknowledgeModal'
import { CoppaDormantCard } from '@/components/coppa/CoppaDormantCard'
import { CoppaLearnMoreModal } from '@/components/coppa/CoppaLearnMoreModal'
import {
  deriveBracket,
  bracketNeedsConfirmation,
  isValidBracket,
  BRACKET_LABELS,
  CONSENT_SECTION_KEYS,
  type CoppaAgeBracket,
} from '@/lib/coppa/brackets'
import {
  useActiveConsentTemplate,
  useParentVerification,
  fetchActiveConsentTemplate,
  fetchParentVerification,
  fetchIsFoundingFamily,
  commitConsentedMembers,
  type CommitMemberInput,
  type CoppaConsentTemplate,
  type ParentVerification,
} from '@/lib/coppa/useCoppaGate'

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
  coppa_age_bracket: CoppaAgeBracket // PRD-40: canonical under-13 source
  bracket_touched: boolean   // PRD-40: mom explicitly picked — stop auto-deriving
}

// PRD-40 Slice 3: consent-gate state for the save action. The batch AND the
// resolved template/verification are captured at gate-fire time (resolved
// imperatively — never from possibly-still-loading hook state), so nothing
// downstream depends on query timing and the version mom sees is the
// version she consents to (mid-flow-retire edge case).
type CoppaGateState =
  | { kind: 'none' }
  | { kind: 'dormant'; batch: ParsedMember[]; under13Names: string[] }
  | { kind: 'consent_flow'; batch: ParsedMember[]; under13Names: string[]; template: CoppaConsentTemplate }
  | {
      kind: 'acknowledge'
      batch: ParsedMember[]
      under13Names: string[]
      index: number
      template: CoppaConsentTemplate
      verification: ParentVerification
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

// Display-only formatting of the verification timestamp (Screen 7 copy).
function formatVerifiedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return iso
  }
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
  const { data: family } = useFamily()
  const { data: consentTemplate } = useActiveConsentTemplate()
  const { data: parentVerification } = useParentVerification()
  const [step, setStep] = useState<'describe' | 'preview' | 'done'>('describe')
  const [familyDescription, setFamilyDescription] = useState('')
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [coppaGate, setCoppaGate] = useState<CoppaGateState>({ kind: 'none' })

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
- coppa_age_bracket (one of: "under_13", "13_to_17", "adult") — REQUIRED for every member:
  - If the parsed age is explicitly under 13 → "under_13"
  - If the parsed age is 13-17 → "13_to_17"
  - If the parsed age is 18+ OR the member is clearly an adult (spouse, parent, grandparent, caregiver, out_of_nest) → "adult"
  - If age is missing or ambiguous → "adult" (the app will ask the parent to confirm)

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
  {"display_name": "Mark", "relationship": "spouse", "date_of_birth": "1988-06-15", "age": 38, "dashboard_mode": "adult", "custom_role": null, "in_household": true, "coppa_age_bracket": "adult"},
  {"display_name": "Emma", "relationship": "child", "date_of_birth": "2012-03-15", "age": 14, "dashboard_mode": "independent", "custom_role": null, "in_household": true, "coppa_age_bracket": "13_to_17"},
  {"display_name": "Liam", "relationship": "child", "date_of_birth": null, "age": 8, "dashboard_mode": "guided", "custom_role": null, "in_household": true, "coppa_age_bracket": "under_13"},
  {"display_name": "Sarah", "relationship": "out_of_nest", "date_of_birth": null, "age": 22, "dashboard_mode": "adult", "custom_role": "Adult Daughter", "in_household": false, "coppa_age_bracket": "adult"},
  {"display_name": "Linda", "relationship": "special", "date_of_birth": null, "age": 65, "dashboard_mode": "adult", "custom_role": "Grandmother", "in_household": false, "coppa_age_bracket": "adult"}
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
          .neq('role', 'family')
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

          // PRD-40: AI-inferred bracket, sanity-checked against the age we
          // actually resolved; falls back to age-based derivation. Adults
          // can never be bracketed as minors.
          const aiBracket = isValidBracket(m.coppa_age_bracket) ? m.coppa_age_bracket : null
          const derived = deriveBracket(age, relationship)
          const coppaBracket: CoppaAgeBracket =
            relationship !== 'child' ? 'adult'
              : age != null ? derived
              : (aiBracket ?? derived)

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
            coppa_age_bracket: coppaBracket,
            bracket_touched: false,
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
          coppa_age_bracket: 'adult' as const, // PRD-40 safety default — mom confirms via the radio
          bracket_touched: false,
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

  // ── PRD-40 Slice 3: shared post-insert pipeline pieces ──────────────────
  // Auto-generate and hash PINs (MMDD from birthday, or 0000) + create the
  // member's login account. Archive folders + dashboard_configs are
  // auto-created by the auto_provision_member_resources DB trigger on
  // INSERT — identical for the direct path and the consent-gated RPC path.
  async function provisionPins(inserted: Array<{ id: string; date_of_birth: string | null }>) {
    const pinResults = await Promise.allSettled(
      inserted.map(async (m) => {
        const pin = pinFromBirthday(m.date_of_birth ?? '')
        const { error } = await supabase.rpc('hash_member_pin', {
          p_member_id: m.id,
          p_pin: pin,
        })
        if (error) {
          console.error(`PIN hash failed for member ${m.id}:`, error.message)
          throw error
        }
        // Also create the member's login account so the auto-assigned
        // PIN can actually sign them in on their own device
        // (Family-Auth-Two-Door Phase 4 — closes the historic gap where
        // PINs verified but couldn't create sessions)
        const { data: syncData, error: syncError } = await supabase.functions.invoke(
          'family-auth-admin',
          { body: { action: 'ensure_pin_shadow_account', member_id: m.id, pin } },
        )
        if (syncError || !syncData?.success) {
          console.warn(`PIN login account sync failed for member ${m.id} — re-set their PIN in Family Members to fix`)
        }
      }),
    )
    const failures = pinResults.filter(r => r.status === 'rejected')
    if (failures.length > 0) {
      console.warn(`${failures.length} PIN(s) failed to hash — members will need PINs set manually`)
    }
  }

  // Insert Out of Nest members into out_of_nest_members (PRD-15).
  // Out-of-nest people are adults by definition — never consent-gated.
  async function insertOutOfNest(oonMembers: ParsedMember[]) {
    if (!member || oonMembers.length === 0) return
    const oonInserts = oonMembers.map((m) => ({
      family_id: member.family_id,
      name: m.display_name.trim(),
      relationship: m.custom_role || 'family',
      invited_by: member.id,
      invitation_status: 'pending',
    }))
    const { error: oonError } = await supabase.from('out_of_nest_members').insert(oonInserts)
    if (oonError) throw oonError
  }

  // Mark setup complete + refresh caches (shared tail of both commit paths).
  async function finishSave() {
    if (!member) return
    await supabase.from('families').update({ setup_completed: true }).eq('id', member.family_id)
    await queryClient.invalidateQueries({ queryKey: ['family-members'] })
    await queryClient.invalidateQueries({ queryKey: ['family-member'] })
  }

  // Direct-insert commit — the pre-PRD-40 path, used when the batch has no
  // under-13 members (or for the 13+ remainder behind the dormant card).
  async function directCommit(membersToSave: ParsedMember[]) {
    if (!member) return
    const householdMembers = membersToSave.filter((m) => m.relationship !== 'out_of_nest')
    const outOfNestMembers = membersToSave.filter((m) => m.relationship === 'out_of_nest')

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
        coppa_age_bracket: m.coppa_age_bracket,
      }))

      const { data: insertedMembers, error: insertError } = await supabase
        .from('family_members')
        .insert(inserts)
        .select('id, date_of_birth')

      if (insertError) throw insertError
      if (insertedMembers) await provisionPins(insertedMembers)
    }

    await insertOutOfNest(outOfNestMembers)
    await finishSave()
  }

  function toCommitInput(m: ParsedMember): CommitMemberInput {
    return {
      display_name: m.display_name.trim(),
      role: m.role,
      dashboard_mode: m.dashboard_mode,
      relationship: m.relationship as 'spouse' | 'child' | 'special',
      date_of_birth: m.date_of_birth,
      age: m.date_of_birth ? calculateAge(m.date_of_birth) : m.age,
      member_color: m.member_color,
      custom_role: m.custom_role,
      coppa_age_bracket: m.coppa_age_bracket,
    }
  }

  // Consent-gated commit (ruling R-13): the whole household batch — under-13
  // AND 13+ siblings — commits atomically through commit_consented_members,
  // which also writes the coppa_consents rows. The PIN/shadow pipeline then
  // resumes exactly as on the direct path.
  async function commitViaConsentRpc(
    batch: ParsedMember[],
    template: CoppaConsentTemplate,
    verificationId: string,
    ackSections: string[],
  ) {
    const householdMembers = batch.filter((m) => m.relationship !== 'out_of_nest')
    const outOfNestMembers = batch.filter((m) => m.relationship === 'out_of_nest')

    const result = await commitConsentedMembers({
      verification_id: verificationId,
      consent_version: template.version,
      acknowledged_sections: ackSections,
      members: householdMembers.map(toCommitInput),
    })
    await provisionPins(result.members)
    await insertOutOfNest(outOfNestMembers)
    await finishSave()
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

    // ── PRD-40 consent gate (Flows: bulk add / manual add save action) ──
    // (a) does the batch include any under-13 household member?
    // (b) does mom have an active parent verification?
    const under13 = validMembers.filter(
      (m) => m.relationship !== 'out_of_nest' && m.coppa_age_bracket === 'under_13',
    )

    if (under13.length > 0) {
      const under13Names = under13.map((m) => m.display_name.trim())

      try {
        // Resolve the gate inputs IMPERATIVELY — hook state may still be
        // loading at click time, and branching on undefined would wrongly
        // send a founding mom to the dormant card.
        const template = consentTemplate !== undefined ? consentTemplate : await fetchActiveConsentTemplate()
        const founding = family ? !!family.is_founding_family : await fetchIsFoundingFamily(member.family_id)

        // R-8 dormancy: no lawyer-approved template → non-founding families
        // are warmly blocked; founding families are exempt (backfill posture).
        if (!template || (!template.lawyer_approved_at && !founding)) {
          setCoppaGate({ kind: 'dormant', batch: validMembers, under13Names })
          setSaving(false)
          return
        }

        const verification =
          parentVerification !== undefined ? parentVerification : await fetchParentVerification(member.id)

        if (verification) {
          // Screen 7: lightweight per-child acknowledgment, no new charge.
          setCoppaGate({ kind: 'acknowledge', batch: validMembers, under13Names, index: 0, template, verification })
        } else {
          // Screens 1–5: full consent flow + $1 verification.
          setCoppaGate({ kind: 'consent_flow', batch: validMembers, under13Names, template })
        }
      } catch (err) {
        setError(`Couldn't check consent status: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
      setSaving(false)
      return
    }

    try {
      await directCommit(validMembers)
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

      {/* ── PRD-40 Slice 3: consent-gate surfaces. Cancel on any of these
             returns mom here with her preview intact — nothing committed,
             nothing charged (PRD edge case "Mom cancels mid-flow"). ── */}
      {coppaGate.kind === 'dormant' && (
        <CoppaDormantCard
          isOpen
          childNames={coppaGate.under13Names}
          otherCount={coppaGate.batch.length - coppaGate.under13Names.length}
          onCancel={() => setCoppaGate({ kind: 'none' })}
          onContinueWithoutThem={async () => {
            // R-8: the rest of the batch commits normally; under-13 members
            // are held back until the consent flow opens.
            const remainder = coppaGate.batch.filter(
              (m) => !(m.relationship !== 'out_of_nest' && m.coppa_age_bracket === 'under_13'),
            )
            setCoppaGate({ kind: 'none' })
            setSaving(true)
            try {
              await directCommit(remainder)
              setStep('done')
            } catch (err) {
              setError(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`)
              setSaving(false)
            }
          }}
        />
      )}

      {coppaGate.kind === 'consent_flow' && (
        <CoppaConsentFlow
          isOpen
          template={coppaGate.template}
          childNames={coppaGate.under13Names}
          onCancel={() => setCoppaGate({ kind: 'none' })}
          onVerified={async (verificationId, ackSections) => {
            await commitViaConsentRpc(coppaGate.batch, coppaGate.template, verificationId, ackSections)
            await queryClient.invalidateQueries({ queryKey: ['coppa-parent-verification'] })
          }}
          onDone={() => {
            setCoppaGate({ kind: 'none' })
            setStep('done')
          }}
        />
      )}

      {coppaGate.kind === 'acknowledge' && (
        <CoppaAcknowledgeModal
          isOpen
          childName={coppaGate.under13Names[coppaGate.index]}
          verifiedAtLabel={formatVerifiedDate(coppaGate.verification.verified_at)}
          template={coppaGate.template}
          progress={{ current: coppaGate.index + 1, total: coppaGate.under13Names.length }}
          onCancel={() => setCoppaGate({ kind: 'none' })}
          onAcknowledge={async () => {
            // Screen 7: one modal per child, sequentially; all rows commit
            // together after the last acknowledgment.
            if (coppaGate.index + 1 < coppaGate.under13Names.length) {
              setCoppaGate({ ...coppaGate, index: coppaGate.index + 1 })
              return
            }
            const { batch, template, verification } = coppaGate
            setCoppaGate({ kind: 'none' })
            setSaving(true)
            try {
              await commitViaConsentRpc(batch, template, verification.id, [...CONSENT_SECTION_KEYS])
              setStep('done')
            } catch (err) {
              setError(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`)
              setSaving(false)
            }
          }}
        />
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
  const [learnMoreOpen, setLearnMoreOpen] = useState(false)

  // PRD-40: age edits re-derive the bracket until mom explicitly picks one.
  function bracketAfterAgeChange(age: number | null): Partial<ParsedMember> {
    if (member.bracket_touched) return {}
    return { coppa_age_bracket: deriveBracket(age, member.relationship) }
  }

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
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
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
              onUpdate({ date_of_birth: dob, age, ...bracketAfterAgeChange(age) })
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
                onChange={(e) => {
                  const age = e.target.value ? parseInt(e.target.value) : null
                  onUpdate({ age, ...bracketAfterAgeChange(age) })
                }}
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
                // PRD-40: adults can never carry a minor bracket; children
                // re-derive from age unless mom already picked explicitly.
                coppa_age_bracket:
                  rel !== 'child' ? 'adult'
                    : member.bracket_touched ? member.coppa_age_bracket
                    : deriveBracket(member.age, rel),
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

      {/* PRD-40: required age-bracket radio for children (AI-inferred,
          mom-correctable before save). Adults are always 'adult'. */}
      {member.relationship === 'child' && (
        <div data-testid="coppa-bracket-selector">
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Age bracket
          </label>
          {bracketNeedsConfirmation(member.age, member.relationship) && !member.bracket_touched && (
            <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              We weren&rsquo;t sure of {member.display_name || 'this child'}&rsquo;s age — is this
              child under 13?
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {(['under_13', '13_to_17', 'adult'] as const).map((bracket) => (
              <label key={bracket} className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--color-text-primary)', minHeight: '28px' }}>
                <input
                  type="radio"
                  name={`bracket-${member.id}`}
                  value={bracket}
                  checked={member.coppa_age_bracket === bracket}
                  onChange={() => onUpdate({ coppa_age_bracket: bracket, bracket_touched: true })}
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                {BRACKET_LABELS[bracket]}
              </label>
            ))}
          </div>
          {member.coppa_age_bracket === 'under_13' && (
            <div
              className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              data-testid="coppa-under13-indicator"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <ShieldCheck size={14} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} />
              <span>
                Under 13 — COPPA Consent required.{' '}
                <button
                  type="button"
                  onClick={() => setLearnMoreOpen(true)}
                  className="underline font-medium"
                  style={{ color: 'var(--color-btn-primary-bg)' }}
                >
                  Learn what this means
                </button>
              </span>
            </div>
          )}
          <CoppaLearnMoreModal
            isOpen={learnMoreOpen}
            childName={member.display_name || 'this child'}
            onClose={() => setLearnMoreOpen(false)}
          />
        </div>
      )}

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
