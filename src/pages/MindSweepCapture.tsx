/**
 * MindSweepCapture — PRD-17B Quick-capture page at /sweep
 * Sprint 2: Full capture interface with text, voice, scan, link,
 * holding queue, settings, and status display.
 * Mobile-first, designed for home-screen-icon experience.
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Wand2, Mic, MicOff, Loader2, Send, Clock, ImagePlus, Link2,
  ArrowLeft, Settings, Inbox, X, Trash2, CalendarDays, HelpCircle,
} from 'lucide-react'
import { MindSweepSettingsPanel, MODE_OPTIONS } from '@/components/mindsweep/MindSweepSettingsPanel'
import { useCanAccess } from '@/lib/permissions/useCanAccess'
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
import { parseICS, isICSContent, formatParseResultMessage } from '@/lib/icsParser'
import { useImportCalendarEvents } from '@/hooks/useMindSweep'
import type { MindSweepSettings } from '@/types/mindsweep'

/** Resize an image file to fit within maxDim pixels (longest side) and return base64 JPEG.
 *  If already small enough, returns the original file as base64 without re-encoding.
 *  This lets users upload 10MB+ phone photos without hitting Edge Function body limits. */
function resizeImageForOCR(file: File, maxDim: number): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img

      // If image is already small enough and file is under 3MB, skip resize
      if (width <= maxDim && height <= maxDim && file.size <= 3 * 1024 * 1024) {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          // Strip "data:image/jpeg;base64," prefix
          const commaIdx = dataUrl.indexOf(',')
          resolve({ base64: dataUrl.slice(commaIdx + 1), mimeType: file.type || 'image/jpeg' })
        }
        reader.onerror = () => reject(new Error('Failed to read image'))
        reader.readAsDataURL(file)
        return
      }

      // Scale down proportionally
      const scale = Math.min(maxDim / width, maxDim / height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // JPEG at 0.85 quality — good for OCR, small file size
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      const commaIdx = dataUrl.indexOf(',')
      resolve({ base64: dataUrl.slice(commaIdx + 1), mimeType: 'image/jpeg' })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}

export function MindSweepCapture() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
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

  // Feature key gating (beta: all return true per convention #10)
  const canScan = useCanAccess('mindsweep_scan')
  const canLink = useCanAccess('mindsweep_link')

  const [content, setContent] = useState('')
  // Track content origin so sweep knows not to split OCR/link output
  const [contentSource, setContentSource] = useState<'text' | 'scan_extracted' | 'link'>('text')
  const [showSettings, setShowSettings] = useState(false)
  const [showHolding, setShowHolding] = useState(false)
  const [scanProcessing, setScanProcessing] = useState(false)
  const [linkProcessing, setLinkProcessing] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [calendarProcessing, setCalendarProcessing] = useState(false)
  const [calendarResult, setCalendarResult] = useState<string | null>(null)
  const [showCalendarHelp, setShowCalendarHelp] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const calendarFileRef = useRef<HTMLInputElement>(null)
  const importCalendar = useImportCalendarEvents()

  // Handle share-to-app via Web Share Target API (manifest.json share_target)
  // Shared content arrives as URL params: ?title=...&text=...&url=...
  useEffect(() => {
    const sharedTitle = searchParams.get('title')
    const sharedText = searchParams.get('text')
    const sharedUrl = searchParams.get('url')
    if (sharedTitle || sharedText || sharedUrl) {
      const parts = [sharedTitle, sharedText, sharedUrl].filter(Boolean)
      setContent(parts.join('\n'))
      // Clear params so refresh doesn't re-populate
      setSearchParams({}, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    const result = await runSweep({
      items: [{ content: content.trim(), content_type: contentSource }],
      familyId,
      memberId,
      settings: sweepSettings || null,
      sourceChannel: 'quick_capture',
      familyMemberNames: memberNames,
    })
    if (result) {
      setContent('')
      setContentSource('text')
    }
  }

  async function handleSweepAllHolding() {
    if (!familyId || !memberId || holdingItems.length === 0) return

    const items = holdingItems.map(h => ({ content: h.content, content_type: h.content_type }))
    if (hasContent) {
      items.unshift({ content: content.trim(), content_type: 'text' })
    }

    const result = await runSweep({
      items,
      familyId,
      memberId,
      settings: sweepSettings || null,
      sourceChannel: 'quick_capture',
      familyMemberNames: memberNames,
    })

    // Only mark holding items processed and clear UI if sweep succeeded
    if (result) {
      await markProcessed.mutateAsync({
        ids: holdingItems.map(h => h.id),
        familyId,
        memberId,
      })

      setContent('')
      setShowHolding(false)
    }
  }

  async function handleSaveForLater() {
    if (!hasContent || !familyId || !memberId) return
    addToHolding.mutate({
      family_id: familyId,
      member_id: memberId,
      content: content.trim(),
      content_type: contentSource,
      source_channel: 'quick_capture',
    })
    setContent('')
    setContentSource('text')
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
    setScanError(null)
    try {
      // Resize large images client-side before sending to Edge Function.
      // OCR only needs readable text — 1600px wide is plenty of resolution.
      // This handles 10MB+ phone photos transparently.
      const { base64, mimeType } = await resizeImageForOCR(file, 1600)

      console.log('[MindSweep] Image resized — base64 length:', base64.length, 'mimeType:', mimeType)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await supabase.functions.invoke('mindsweep-scan', {
        body: {
          mode: 'scan',
          image_base64: base64,
          mime_type: mimeType,
          family_id: familyId,
          member_id: memberId,
        },
      })

      console.log('[MindSweep] Edge Function response:', { error: response.error, dataKeys: response.data ? Object.keys(response.data) : null, data: response.data })

      if (response.error) {
        const detail = (response.data as { error?: string } | null)?.error
        throw new Error(detail || response.error.message || 'Image processing failed')
      }
      const text = (response.data as { text: string }).text
      if (text) {
        setContent(prev => prev ? prev + '\n' + text : text)
        setContentSource('scan_extracted')
      }
    } catch (err) {
      console.error('Scan failed:', err)
      const msg = err instanceof Error ? err.message : 'Could not extract text from image'
      setScanError(msg)
      setTimeout(() => setScanError(null), 5000)
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
        setContentSource('link')
      }
      setLinkInput('')
      setShowLinkInput(false)
    } catch (err) {
      console.error('Link capture failed:', err)
    } finally {
      setLinkProcessing(false)
    }
  }

  // ── Calendar file import ──
  function handleCalendarClick() {
    calendarFileRef.current?.click()
  }

  async function handleCalendarFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !familyId || !memberId) return
    e.target.value = ''

    setCalendarProcessing(true)
    setCalendarResult(null)
    try {
      const text = await file.text()

      // Validate it looks like calendar data
      if (!isICSContent(text)) {
        setCalendarResult('This file doesn\'t appear to be a calendar file. Try exporting from Google Calendar or Apple Calendar.')
        return
      }

      const result = parseICS(text)
      if (result.events.length === 0) {
        setCalendarResult('No events found in this file.')
        return
      }

      await importCalendar.mutateAsync({
        events: result.events,
        familyId,
        memberId,
      })

      const msg = formatParseResultMessage(result)
      setCalendarResult(`${msg}. Check your Review Queue to approve them.`)
    } catch (err) {
      console.error('Calendar import failed:', err)
      setCalendarResult('Something went wrong importing the calendar file.')
    } finally {
      setCalendarProcessing(false)
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
        className="hidden"
        onChange={handleFileSelected}
      />
      {/* Hidden file input for calendar import */}
      <input
        ref={calendarFileRef}
        type="file"
        accept=".ics,.ical,.ifb,text/calendar"
        className="hidden"
        onChange={handleCalendarFileSelected}
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
          {/* Scan error message */}
          {scanError && (
            <div className="px-4 py-2 flex items-center gap-2 border-t"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-error, #e53e3e) 10%, transparent)' }}
            >
              <span className="text-xs" style={{ color: 'var(--color-error, #e53e3e)' }}>
                {scanError}
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
          {canScan.allowed && (
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
            <ImagePlus size={16} />
            <span className="text-xs">Photo</span>
          </button>
          )}

          {/* Link */}
          {canLink.allowed && (
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
          )}

          {/* Calendar import */}
          <button
            onClick={handleCalendarClick}
            disabled={calendarProcessing || scanProcessing || linkProcessing || voice.state === 'recording'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              minHeight: 'unset',
            }}
          >
            <CalendarDays size={16} />
            <span className="text-xs">Calendar</span>
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

        {/* Calendar import status */}
        {calendarProcessing && (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-heading)' }}>Reading calendar file...</span>
          </div>
        )}

        {calendarResult && !calendarProcessing && (
          <div className="flex items-center gap-2 py-3 px-4 rounded-xl"
            style={{
              backgroundColor: calendarResult.includes('Review Queue')
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)'
                : 'color-mix(in srgb, var(--color-error, #e53e3e) 10%, transparent)',
            }}
          >
            <CalendarDays size={14} style={{
              color: calendarResult.includes('Review Queue')
                ? 'var(--color-btn-primary-bg)'
                : 'var(--color-error, #e53e3e)',
            }} />
            <span className="text-sm flex-1" style={{ color: 'var(--color-text-heading)' }}>
              {calendarResult}
            </span>
            <button
              onClick={() => setCalendarResult(null)}
              className="p-0.5 rounded shrink-0"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Calendar import help */}
        {showCalendarHelp && (
          <div
            className="rounded-xl p-3 space-y-2"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                Bring your calendar into MyAIM
              </p>
              <button
                onClick={() => setShowCalendarHelp(false)}
                className="p-0.5 rounded"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              >
                <X size={12} />
              </button>
            </div>
            <div className="space-y-1.5" style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
              <p><strong style={{ color: 'var(--color-text-primary)' }}>Upload a calendar file</strong> — Export from Google Calendar, Apple Calendar, or Outlook and tap the Calendar button above.</p>
              <p><strong style={{ color: 'var(--color-text-primary)' }}>Screenshot it</strong> — See event details on your screen? Use Scan to grab the info.</p>
              <p><strong style={{ color: 'var(--color-text-primary)' }}>Paste a link</strong> — Have a link to event details or a registration page? Use Link and we'll read it.</p>
              <p><strong style={{ color: 'var(--color-text-primary)' }}>Just type it</strong> — Type something like "Soccer practice Tuesdays 4-5:30pm at Riverside Park" and Sweep will route it to your calendar.</p>
            </div>
            <div
              className="rounded-lg p-2 mt-1"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)' }}
            >
              <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                <strong>How to export Google Calendar:</strong> Open Google Calendar on your computer, click the gear icon, then Settings, then "Import & Export" on the left, then "Export." Upload the downloaded file here.
              </p>
            </div>
          </div>
        )}

        {/* Help toggle + Auto-sort indicator */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setShowCalendarHelp(!showCalendarHelp)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{
              color: showCalendarHelp ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              background: 'transparent',
              minHeight: 'unset',
            }}
          >
            <HelpCircle size={10} />
            Calendar import help
          </button>
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

