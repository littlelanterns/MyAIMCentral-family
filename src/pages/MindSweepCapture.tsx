/**
 * MindSweepCapture — PRD-17B Quick-capture page at /sweep
 * Sprint 2: Full capture interface with text, voice, scan, link,
 * holding queue, settings, and status display.
 * Mobile-first, designed for home-screen-icon experience.
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wand2, Mic, MicOff, Loader2, Send, Clock, ScanLine, Link2,
  ArrowLeft, Settings, Inbox, X, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useVoiceInput, formatDuration } from '@/hooks/useVoiceInput'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { supabase } from '@/lib/supabase/client'
import {
  useMindSweepSettings,
  useUpdateMindSweepSettings,
  useMindSweepHolding,
  useAddToHolding,
  useDeleteHolding,
  useMarkHoldingProcessed,
  useRunSweep,
} from '@/hooks/useMindSweep'
import { FEATURE_FLAGS } from '@/config/featureFlags'
import type { AggressivenessMode, AlwaysReviewRule, MindSweepSettings } from '@/types/mindsweep'

const MODE_OPTIONS: { key: AggressivenessMode; label: string; desc: string }[] = [
  { key: 'always_ask', label: 'Always Ask', desc: 'Sort and suggest, but I\'ll review everything in my Queue.' },
  { key: 'trust_obvious', label: 'Trust the Obvious', desc: 'Auto-route high-confidence items. Everything else goes to my Queue.' },
  { key: 'full_autopilot', label: 'Full Autopilot', desc: 'Handle high and medium confidence. Only flag low-confidence and sensitive content.' },
]

const REVIEW_RULES: { key: AlwaysReviewRule; label: string }[] = [
  { key: 'emotional_children', label: 'Emotional content about children' },
  { key: 'relationship_dynamics', label: 'Family relationship observations' },
  { key: 'behavioral_notes', label: 'Behavioral notes about family members' },
  { key: 'financial', label: 'Financial discussions' },
  { key: 'health_medical', label: 'Health / medical content' },
  { key: 'outside_people', label: 'Content mentioning people outside the family' },
]

export function MindSweepCapture() {
  const navigate = useNavigate()
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id
  const memberId = member?.id
  const { data: familyMembers = [] } = useFamilyMembers(familyId)
  const { data: sweepSettings } = useMindSweepSettings(memberId)
  const updateSettings = useUpdateMindSweepSettings()
  const addToHolding = useAddToHolding()
  const deleteHolding = useDeleteHolding()
  const markProcessed = useMarkHoldingProcessed()
  const { data: holdingItems = [] } = useMindSweepHolding(familyId, memberId)
  const { run: runSweep, status: sweepStatus } = useRunSweep()
  const highAccuracy = sweepSettings?.high_accuracy_voice ?? false
  const voice = useVoiceInput({ forceHighAccuracy: highAccuracy })

  const [content, setContent] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showHolding, setShowHolding] = useState(false)
  const [scanProcessing, setScanProcessing] = useState(false)
  const [linkProcessing, setLinkProcessing] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Autofocus text field on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 300) + 'px'
    }
  }, [content])

  const hasContent = content.trim().length > 0
  const currentMode = sweepSettings?.aggressiveness || 'always_ask'
  const currentModeLabel = MODE_OPTIONS.find(o => o.key === currentMode)?.label || 'Always Ask'

  const memberNames = useMemo(() =>
    familyMembers.map(m => ({
      id: m.id,
      display_name: m.display_name,
      nicknames: m.nicknames || [],
    })),
    [familyMembers],
  )

  async function handleSweepNow() {
    if (!hasContent || !familyId || !memberId) return
    await runSweep({
      items: [{ content: content.trim(), content_type: 'text' }],
      familyId,
      memberId,
      settings: sweepSettings || null,
      sourceChannel: 'quick_capture',
      familyMemberNames: memberNames,
    })
    setContent('')
  }

  async function handleSweepAllHolding() {
    if (!familyId || !memberId || holdingItems.length === 0) return

    const items = holdingItems.map(h => ({ content: h.content, content_type: h.content_type }))
    if (hasContent) {
      items.unshift({ content: content.trim(), content_type: 'text' })
    }

    await runSweep({
      items,
      familyId,
      memberId,
      settings: sweepSettings || null,
      sourceChannel: 'quick_capture',
      familyMemberNames: memberNames,
    })

    markProcessed.mutate({
      ids: holdingItems.map(h => h.id),
      familyId,
      memberId,
    })

    setContent('')
    setShowHolding(false)
  }

  async function handleSaveForLater() {
    if (!hasContent || !familyId || !memberId) return
    addToHolding.mutate({
      family_id: familyId,
      member_id: memberId,
      content: content.trim(),
      content_type: 'text',
      source_channel: 'quick_capture',
    })
    setContent('')
  }

  // ── Voice ──
  async function handleVoiceToggle() {
    if (voice.state === 'recording') {
      const text = await voice.stopRecording()
      if (text) {
        setContent(prev => prev ? prev + '\n' + text : text)
      }
    } else if (voice.state === 'idle') {
      await voice.startRecording()
    }
  }

  // ── Scan/OCR ──
  function handleScanClick() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !familyId || !memberId) return
    // Reset input so same file can be re-selected
    e.target.value = ''

    setScanProcessing(true)
    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
      }
      const base64 = btoa(binary)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await supabase.functions.invoke('mindsweep-scan', {
        body: {
          mode: 'scan',
          image_base64: base64,
          mime_type: file.type || 'image/jpeg',
          family_id: familyId,
          member_id: memberId,
        },
      })

      if (response.error) throw response.error
      const text = (response.data as { text: string }).text
      if (text) {
        setContent(prev => prev ? prev + '\n' + text : text)
      }
    } catch (err) {
      console.error('Scan failed:', err)
    } finally {
      setScanProcessing(false)
    }
  }

  // ── Link capture ──
  async function handleLinkSubmit() {
    const url = linkInput.trim()
    if (!url || !familyId || !memberId) return

    setLinkProcessing(true)
    try {
      const response = await supabase.functions.invoke('mindsweep-scan', {
        body: {
          mode: 'link',
          url,
          family_id: familyId,
          member_id: memberId,
        },
      })

      if (response.error) throw response.error
      const text = (response.data as { text: string }).text
      if (text) {
        setContent(prev => prev ? prev + '\n' + text : text)
      }
      setLinkInput('')
      setShowLinkInput(false)
    } catch (err) {
      console.error('Link capture failed:', err)
    } finally {
      setLinkProcessing(false)
    }
  }

  function handleSettingUpdate(updates: Partial<MindSweepSettings>) {
    if (!memberId || !familyId) return
    updateSettings.mutate({ memberId, familyId, updates })
  }

  function handleDeleteHolding(id: string) {
    if (!familyId || !memberId) return
    deleteHolding.mutate({ id, familyId, memberId })
  }

  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Hidden file input for scan */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 rounded-lg"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Wand2 size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              MindSweep
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {holdingItems.length > 0 && (
            <button
              onClick={() => setShowHolding(!showHolding)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{
                backgroundColor: showHolding ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                color: showHolding ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                minHeight: 'unset',
              }}
            >
              <Inbox size={12} />
              {holdingItems.length}
            </button>
          )}
          <button
            onClick={() => { setShowSettings(!showSettings); setShowHolding(false) }}
            className="p-1.5 rounded-lg"
            style={{
              color: showSettings ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              background: 'transparent',
              minHeight: 'unset',
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <MindSweepSettingsPanel
          settings={sweepSettings}
          onUpdate={handleSettingUpdate}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Holding queue panel */}
      {showHolding && holdingItems.length > 0 && (
        <div
          className="border-b px-4 py-3 space-y-2 max-h-60 overflow-y-auto"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
              Holding Queue ({holdingItems.length} items)
            </p>
            <button
              onClick={handleSweepAllHolding}
              disabled={sweepStatus.status === 'processing'}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
                minHeight: 'unset',
              }}
            >
              <Wand2 size={10} />
              Sweep All
            </button>
          </div>
          {holdingItems.map(item => (
            <div
              key={item.id}
              className="flex items-start gap-2 px-2 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-primary)' }}
            >
              <p className="flex-1 text-xs line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                {item.content}
              </p>
              <button
                onClick={() => handleDeleteHolding(item.id)}
                className="p-0.5 shrink-0 rounded opacity-50 hover:opacity-100"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main capture area */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Text input */}
        <div
          className="relative rounded-xl"
          style={{
            backgroundColor: 'var(--color-bg-card, var(--color-bg-secondary))',
            border: '1px solid var(--color-border)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full px-4 py-3 bg-transparent outline-none resize-none text-sm"
            style={{ color: 'var(--color-text-primary)', minHeight: '120px', maxHeight: '300px' }}
          />
          {voice.state === 'recording' && voice.interimText && (
            <div
              className="px-4 py-2 text-xs italic border-t"
              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            >
              {voice.interimText}
            </div>
          )}
          {/* Scan/link processing indicator inside textarea */}
          {(scanProcessing || linkProcessing) && (
            <div className="px-4 py-2 flex items-center gap-2 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Loader2 size={12} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {scanProcessing ? 'Extracting text from image...' : 'Fetching link content...'}
              </span>
            </div>
          )}
        </div>

        {/* Capture buttons row: Voice, Scan, Link */}
        <div className="flex items-center justify-center gap-3">
          {/* Voice */}
          {FEATURE_FLAGS.ENABLE_VOICE_INPUT && (
            voice.state === 'transcribing' ? (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
              >
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Transcribing...</span>
              </div>
            ) : (
              <button
                onClick={handleVoiceToggle}
                disabled={!voice.isSupported || scanProcessing || linkProcessing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors disabled:opacity-40"
                style={{
                  backgroundColor: voice.state === 'recording' ? 'var(--color-error, #e53e3e)' : 'var(--color-bg-secondary)',
                  color: voice.state === 'recording' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                  border: voice.state === 'recording' ? 'none' : '1px solid var(--color-border)',
                  minHeight: 'unset',
                }}
              >
                {voice.state === 'recording' ? <MicOff size={16} /> : <Mic size={16} />}
                <span className="text-xs">
                  {voice.state === 'recording' ? `Stop ${formatDuration(voice.duration)}` : 'Voice'}
                </span>
              </button>
            )
          )}

          {/* Scan */}
          <button
            onClick={handleScanClick}
            disabled={scanProcessing || linkProcessing || voice.state === 'recording'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              minHeight: 'unset',
            }}
          >
            <ScanLine size={16} />
            <span className="text-xs">Scan</span>
          </button>

          {/* Link */}
          <button
            onClick={() => setShowLinkInput(!showLinkInput)}
            disabled={scanProcessing || linkProcessing || voice.state === 'recording'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl disabled:opacity-40"
            style={{
              backgroundColor: showLinkInput ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' : 'var(--color-bg-secondary)',
              color: showLinkInput ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              border: showLinkInput ? '1px solid var(--color-btn-primary-bg)' : '1px solid var(--color-border)',
              minHeight: 'unset',
            }}
          >
            <Link2 size={16} />
            <span className="text-xs">Link</span>
          </button>
        </div>

        {/* Link input row */}
        {showLinkInput && (
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="Paste URL..."
              autoFocus
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLinkSubmit() }}
            />
            <button
              onClick={handleLinkSubmit}
              disabled={!linkInput.trim() || linkProcessing}
              className="px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
                minHeight: 'unset',
              }}
            >
              {linkProcessing ? <Loader2 size={14} className="animate-spin" /> : 'Fetch'}
            </button>
            <button
              onClick={() => { setShowLinkInput(false); setLinkInput('') }}
              className="p-1.5 rounded-lg"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Auto-sort indicator */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
          >
            Auto-sort: {currentModeLabel}
            <Settings size={10} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-auto">
          {/* Sweep status */}
          {sweepStatus.status === 'processing' && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            >
              <Wand2 size={16} className="animate-pulse" style={{ color: 'var(--color-btn-primary-bg)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-heading)' }}>MindSweep sorting...</span>
            </div>
          )}

          {sweepStatus.status === 'complete' && sweepStatus.lastResult && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)' }}
            >
              <Wand2 size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-heading)' }}>
                {sweepStatus.lastResult.autoRouted > 0
                  ? `Sorted! ${sweepStatus.lastResult.autoRouted} auto-routed, ${sweepStatus.lastResult.queued} in queue`
                  : `${sweepStatus.lastResult.queued} items sent to your queue`}
              </span>
            </div>
          )}

          {sweepStatus.status === 'error' && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-error, #e53e3e) 10%, transparent)' }}
            >
              <span className="text-sm" style={{ color: 'var(--color-error, #e53e3e)' }}>Something went wrong. Try again?</span>
            </div>
          )}

          {/* Sweep Now */}
          <button
            onClick={handleSweepNow}
            disabled={!hasContent || sweepStatus.status === 'processing'}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
              minHeight: 'unset',
            }}
          >
            <Send size={16} />
            Sweep Now
          </button>

          {/* Save for Later */}
          <button
            onClick={handleSaveForLater}
            disabled={!hasContent || addToHolding.isPending}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium disabled:opacity-40 transition-opacity"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              minHeight: 'unset',
            }}
          >
            <Clock size={16} />
            Save for Later
            {holdingItems.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
              >
                {holdingItems.length}
              </span>
            )}
          </button>

          {/* Footer info */}
          <div className="flex items-center justify-between pt-1">
            {holdingItems.length > 0 && (
              <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                Holding: {holdingItems.length} items
              </span>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs ml-auto"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            >
              Open MyAIM
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Settings Panel ──

function MindSweepSettingsPanel({ settings, onUpdate, onClose }: {
  settings: MindSweepSettings | null | undefined
  onUpdate: (updates: Partial<MindSweepSettings>) => void
  onClose: () => void
}) {
  const currentMode = settings?.aggressiveness || 'always_ask'
  const reviewRules: AlwaysReviewRule[] = settings?.always_review_rules || ['emotional_children', 'relationship_dynamics', 'behavioral_notes', 'financial']
  const highAccuracy = settings?.high_accuracy_voice ?? false
  const [expandedSection, setExpandedSection] = useState<string | null>('mode')

  function toggleSection(key: string) {
    setExpandedSection(expandedSection === key ? null : key)
  }

  return (
    <div
      className="border-b overflow-y-auto"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
        maxHeight: '70vh',
      }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>MindSweep Settings</span>
        <button onClick={onClose} className="p-1" style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}>
          <X size={16} />
        </button>
      </div>

      {/* Section 1: Auto-sort mode */}
      <SettingsSection title="Auto-sort mode" sectionKey="mode" expanded={expandedSection} onToggle={toggleSection}>
        <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          How much should MindSweep handle on its own?
        </p>
        {MODE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => onUpdate({ aggressiveness: opt.key })}
            className="w-full text-left px-3 py-2 rounded-lg mb-1.5"
            style={{
              backgroundColor: currentMode === opt.key
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)'
                : 'var(--color-bg-primary)',
              border: currentMode === opt.key ? '1px solid var(--color-btn-primary-bg)' : '1px solid var(--color-border)',
              minHeight: 'unset',
            }}
          >
            <p className="text-xs font-medium" style={{
              color: currentMode === opt.key ? 'var(--color-btn-primary-bg)' : 'var(--color-text-primary)',
            }}>
              {currentMode === opt.key ? '\u25CF ' : '\u25CB '}{opt.label}
            </p>
            <p className="text-[11px] mt-0.5 ml-4" style={{ color: 'var(--color-text-secondary)' }}>{opt.desc}</p>
          </button>
        ))}
      </SettingsSection>

      {/* Section 2: Always review */}
      <SettingsSection title="Always review (regardless of mode)" sectionKey="review" expanded={expandedSection} onToggle={toggleSection}>
        {REVIEW_RULES.map(rule => {
          const checked = reviewRules.includes(rule.key)
          return (
            <label key={rule.key} className="flex items-start gap-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  const updated = checked
                    ? reviewRules.filter(r => r !== rule.key)
                    : [...reviewRules, rule.key]
                  onUpdate({ always_review_rules: updated })
                }}
                className="mt-0.5"
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{rule.label}</span>
            </label>
          )
        })}
      </SettingsSection>

      {/* Section 3: Voice */}
      <SettingsSection title="Voice" sectionKey="voice" expanded={expandedSection} onToggle={toggleSection}>
        <label className="flex items-center justify-between py-1 cursor-pointer">
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>High accuracy (all recordings)</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              {highAccuracy ? 'All recordings use premium transcription' : 'Short captures use free transcription'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={highAccuracy}
            onChange={() => onUpdate({ high_accuracy_voice: !highAccuracy })}
            className="ml-2"
            style={{ accentColor: 'var(--color-btn-primary-bg)' }}
          />
        </label>
      </SettingsSection>

      {/* Section 4: Document scanning info */}
      <SettingsSection title="Document scanning" sectionKey="scan" expanded={expandedSection} onToggle={toggleSection}>
        <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
          Scan extracts text from photos of flyers, bulletins, and screenshots.
          Images stay on your phone — MindSweep only keeps the information it reads.
        </p>
      </SettingsSection>

      {/* Section 5: Digest */}
      <SettingsSection title="Digest" sectionKey="digest" expanded={expandedSection} onToggle={toggleSection}>
        <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Include MindSweep summary in:
        </p>
        {([
          { key: 'digest_morning', label: 'Morning Rhythm' },
          { key: 'digest_evening', label: 'Evening Rhythm' },
          { key: 'digest_weekly', label: 'Weekly Review' },
        ] as const).map(d => {
          const checked = settings?.[d.key] ?? (d.key !== 'digest_weekly')
          return (
            <label key={d.key} className="flex items-center gap-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onUpdate({ [d.key]: !checked })}
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{d.label}</span>
            </label>
          )
        })}
      </SettingsSection>
    </div>
  )
}

// ── Collapsible Settings Section ──

function SettingsSection({ title, sectionKey, expanded, onToggle, children }: {
  title: string
  sectionKey: string
  expanded: string | null
  onToggle: (key: string) => void
  children: React.ReactNode
}) {
  const isOpen = expanded === sectionKey
  return (
    <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center justify-between px-4 py-2.5"
        style={{ background: 'transparent', color: 'var(--color-text-heading)', minHeight: 'unset' }}
      >
        <span className="text-xs font-medium">{title}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isOpen && (
        <div className="px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  )
}
