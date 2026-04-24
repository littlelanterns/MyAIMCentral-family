import { useState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { supabase } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import type { VaultItem } from '../hooks/useVaultBrowse'

interface Props {
  open: boolean
  onClose: () => void
  item: VaultItem | null
}

interface FamilyMemberRow {
  id: string
  display_name: string
  role: string
  assigned_color: string | null
  member_color: string | null
  age: number | null
}

/**
 * "+Add to AI Toolbox" modal (PRD-21A Screen 4).
 * Family member picker → creates lila_tool_permissions records with source='vault'.
 * Only shown for ai_tool and skill content types.
 */
export function MemberAssignmentModal({ open, onClose, item }: Props) {
  const { data: family } = useFamily()
  const { data: currentMember } = useFamilyMember()
  const [members, setMembers] = useState<FamilyMemberRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [alreadyAssigned, setAlreadyAssigned] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load family members
  useEffect(() => {
    if (!family?.id || !open) return
    supabase
      .from('family_members')
      .select('id, display_name, role, assigned_color, member_color, age')
      .eq('family_id', family.id)
      .eq('is_active', true)
      .order('role')
      .then(({ data }) => {
        if (data) setMembers(data as FamilyMemberRow[])
      })
  }, [family?.id, open])

  // Check which members already have this tool assigned
  useEffect(() => {
    if (!item || !family?.id || !open) return
    supabase
      .from('lila_tool_permissions')
      .select('member_id')
      .eq('family_id', family.id)
      .eq('vault_item_id', item.id)
      .eq('source', 'vault')
      .then(({ data }) => {
        if (data) {
          const ids = new Set(data.map(d => d.member_id))
          setAlreadyAssigned(ids)
          // Pre-check current member if not already assigned
          if (currentMember?.id && !ids.has(currentMember.id)) {
            setSelected(new Set([currentMember.id]))
          }
        }
      })
  }, [item?.id, family?.id, open, currentMember?.id])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelected(new Set())
      setSaved(false)
    }
  }, [open])

  const toggleMember = (id: string) => {
    if (alreadyAssigned.has(id)) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!item || !family?.id || !currentMember?.id || selected.size === 0) return
    setSaving(true)

    const rows = Array.from(selected).map(memberId => ({
      family_id: family.id,
      member_id: memberId,
      mode_key: item.guided_mode_key || `vault_tool_${item.id.slice(0, 8)}`,
      is_enabled: true,
      source: 'vault',
      vault_item_id: item.id,
    }))

    const { error } = await supabase.from('lila_tool_permissions').insert(rows)
    setSaving(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => onClose(), 1500)
    }
  }

  if (!item) return null

  const roleLabel = (role: string) => {
    switch (role) {
      case 'primary_parent': return 'Mom'
      case 'additional_adult': return 'Adult'
      case 'special_adult': return 'Caregiver'
      case 'member': return 'Member'
      default: return role
    }
  }

  // Split into household adults/teens vs guided/play
  const adultMembers = members.filter(m => ['primary_parent', 'additional_adult', 'special_adult'].includes(m.role))
  const childMembers = members.filter(m => m.role === 'member')

  return (
    <ModalV2
      id="member-assignment-modal"
      isOpen={open}
      onClose={onClose}
      type="transient"
      size="sm"
      title="Add to AI Toolbox"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selected.size === 0 || saving || saved}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: saved ? 'var(--color-success, #22c55e)' : 'var(--color-btn-primary-bg)',
              color: saved ? '#fff' : 'var(--color-btn-primary-text)',
            }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
            {saved ? 'Added!' : 'Add to Toolbox'}
          </button>
        </div>
      }
    >
      <div className="p-4">
        {/* Tool name */}
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>
          {item.detail_title || item.display_title}
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Add this tool to family members' AI Toolboxes
        </p>

        {/* Member list */}
        <div className="space-y-1">
          {adultMembers.map(m => (
            <MemberCheckbox
              key={m.id}
              member={m}
              roleLabel={roleLabel(m.role)}
              checked={selected.has(m.id) || alreadyAssigned.has(m.id)}
              disabled={alreadyAssigned.has(m.id)}
              isSelf={m.id === currentMember?.id}
              onChange={() => toggleMember(m.id)}
            />
          ))}

          {childMembers.length > 0 && (
            <>
              <div className="pt-2 pb-1">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Children
                </span>
              </div>
              {childMembers.map(m => (
                <MemberCheckbox
                  key={m.id}
                  member={m}
                  roleLabel={m.age ? `Age ${m.age}` : 'Member'}
                  checked={selected.has(m.id) || alreadyAssigned.has(m.id)}
                  disabled={alreadyAssigned.has(m.id)}
                  onChange={() => toggleMember(m.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </ModalV2>
  )
}

function MemberCheckbox({
  member, roleLabel, checked, disabled, isSelf, onChange,
}: {
  member: FamilyMemberRow
  roleLabel: string
  checked: boolean
  disabled: boolean
  isSelf?: boolean
  onChange: () => void
}) {
  return (
    <label
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      style={{ backgroundColor: checked ? 'var(--color-bg-secondary)' : 'transparent' }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="w-4 h-4 rounded"
      />
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: getMemberColor(member) }}
      />
      <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
        {member.display_name}
        {isSelf && <span style={{ color: 'var(--color-text-secondary)' }}> (you)</span>}
      </span>
      <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
        {disabled ? '(already added)' : roleLabel}
      </span>
    </label>
  )
}
