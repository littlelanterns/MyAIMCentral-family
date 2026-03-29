import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { LilaAvatar, getAvatarKeyForMode } from './LilaAvatar'
import type { GuidedMode } from '@/hooks/useLila'

/**
 * Mode Switcher Dropdown — PRD-05
 * Mom only. Uses a portal so the dropdown escapes the drawer's overflow-hidden.
 */

const MODE_DESCRIPTIONS: Record<string, string> = {
  general: 'Open conversation — talk about anything',
  help: 'Troubleshooting, billing, and bug reporting',
  assist: 'Feature guidance, tips, and onboarding',
  optimizer: 'Craft better prompts for any AI tool',
}

const DISPLAY_OVERRIDES: Record<string, string> = {
  general: 'General Chat',
}

/** Modes that have a working Edge Function deployed */
const BUILT_MODES = new Set([
  'general', 'help', 'assist', 'optimizer',
  'cyrano', 'higgins_say', 'higgins_navigate',
  'quality_time', 'gifts', 'observe_serve', 'words_affirmation', 'gratitude',
  'translator', 'board_of_directors', 'perspective_shifter', 'decision_guide', 'mediator',
  'task_breaker', 'task_breaker_image',
])

const GROUP_LABELS: Record<string, string> = {
  relationship_action: 'Relationship Tools',
  crew_action: 'Communication',
  personal_growth: 'Personal Growth',
  calendar_meeting: 'Calendar & Meetings',
  safe_harbor: 'Safe Harbor',
  inner_wisdom: 'ThoughtSift',
  bigplans: 'BigPlans',
  bookshelf: 'BookShelf',
  compliance: 'Compliance',
  guided_tools: 'Guided Shell Tools',
  family_context: 'Family Context',
}

interface LilaModeSwitcherProps {
  currentMode: string
  modes: GuidedMode[]
  onModeSelect: (modeKey: string) => void
}

export function LilaModeSwitcher({ currentMode, modes, onModeSelect }: LilaModeSwitcherProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target) &&
          triggerRef.current && !triggerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.left })
    }
  }, [open])

  const currentModeData = modes.find(m => m.mode_key === currentMode)
  const currentLabel = DISPLAY_OVERRIDES[currentMode] || currentModeData?.display_name || 'General Chat'
  const coreModes = modes.filter(m => ['general', 'help', 'assist', 'optimizer'].includes(m.mode_key))
  const guidedModes = modes.filter(m => !['general', 'help', 'assist', 'optimizer'].includes(m.mode_key))

  const guidedGroups = new Map<string, GuidedMode[]>()
  for (const mode of guidedModes) {
    const group = mode.parent_mode || 'Other'
    if (!guidedGroups.has(group)) guidedGroups.set(group, [])
    guidedGroups.get(group)!.push(mode)
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:opacity-80 transition-opacity"
        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
      >
        <LilaAvatar avatarKey={currentModeData?.avatar_key || getAvatarKeyForMode(currentMode)} size={14} />
        <span>{currentLabel}</span>
        <ChevronDown size={12} />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed min-w-[260px] max-h-[300px] overflow-y-auto rounded-lg shadow-xl"
          style={{
            top: `${pos.top}px`,
            left: `${pos.left}px`,
            zIndex: 9999,
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Core modes — with avatars and descriptions */}
          <div className="p-1.5">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
              Core Modes
            </p>
            {coreModes.map(mode => {
              const label = DISPLAY_OVERRIDES[mode.mode_key] || mode.display_name
              const desc = MODE_DESCRIPTIONS[mode.mode_key] || ''
              return (
                <Tooltip content={desc} disabled={!desc} key={mode.mode_key}>
                <button
                  onClick={() => { onModeSelect(mode.mode_key); setOpen(false) }}
                  className={`flex items-center gap-2.5 w-full px-2 py-2 rounded text-left hover:opacity-80 transition-opacity ${
                    mode.mode_key === currentMode ? 'font-medium' : ''
                  }`}
                  style={{
                    backgroundColor: mode.mode_key === currentMode ? 'var(--color-bg-secondary)' : 'transparent',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <LilaAvatar avatarKey={mode.avatar_key || getAvatarKeyForMode(mode.mode_key)} size={18} />
                  <div>
                    <div className="text-sm">{label}</div>
                    {desc && (
                      <div className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {desc}
                      </div>
                    )}
                  </div>
                </button>
                </Tooltip>
              )
            })}
          </div>

          {/* Guided modes — text only, grouped */}
          {guidedGroups.size > 0 && Array.from(guidedGroups.entries()).map(([group, groupModes]) => (
            <div key={group} className="border-t p-1.5" style={{ borderColor: 'var(--color-border)' }}>
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                {GROUP_LABELS[group] || group}
              </p>
              {groupModes.map(mode => {
                const isBuilt = BUILT_MODES.has(mode.mode_key)
                return (
                  <Tooltip content={isBuilt ? mode.display_name : `${mode.display_name} — coming soon`} key={mode.mode_key}>
                  <button
                    onClick={() => { if (isBuilt) { onModeSelect(mode.mode_key); setOpen(false) } }}
                    disabled={!isBuilt}
                    className={`w-full px-3 py-1.5 rounded text-sm text-left transition-opacity ${
                      mode.mode_key === currentMode ? 'font-medium' : ''
                    } ${isBuilt ? 'hover:opacity-80' : ''}`}
                    style={{
                      backgroundColor: mode.mode_key === currentMode ? 'var(--color-bg-secondary)' : 'transparent',
                      color: isBuilt ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      opacity: isBuilt ? 1 : 0.4,
                      cursor: isBuilt ? 'pointer' : 'default',
                    }}
                  >
                    {mode.display_name}
                  </button>
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
