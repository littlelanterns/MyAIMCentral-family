// PRD-43 WishLists — WishCatch capture sheet (§6.1). THE feature: open →
// pick who → type/speak/photo/link → save, in ~5 seconds. Nothing blocks the
// save. AI-derived text (photo vision, link Haiku fallback) lands as a
// confirm-required suggestion chip AFTER the item is already saved
// (Convention #279 — the confirm IS the HITM step, deferred and non-blocking).
// Deterministic link extraction (og:/JSON-LD) auto-fills with an honest
// "auto-filled — check it" label, no confirm required (the .ics-import class).

import { useState, useCallback, useEffect, useRef } from 'react'
import { Gift, Mic, MicOff, Camera, Check, Pencil, X } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import MemberPillSelector, { type MemberPillItem } from '@/components/shared/MemberPillSelector'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useCreateWishlistItem, useWishlistItems, useCreateGiftIdeaItem, useGiftIdeasItems } from '@/hooks/useWishlists'
import { supabase } from '@/lib/supabase/client'
import type { ListItem } from '@/types/lists'
import type { WishlistExtractLinkResult, WishlistExtractPhotoResult } from '@/types/wishlists'

const LAST_PERSON_KEY = 'myaim-wishcatch-last-person'
const URL_PATTERN = /^https?:\/\/\S+$/i

interface JustCaptured {
  item: ListItem
  status: 'saved' | 'extracting' | 'suggestion' | 'auto_filled' | 'done'
  suggestion?: { title: string | null; image_url?: string | null; notes?: string | null }
}

interface WishCatchModalProps {
  isOpen: boolean
  onClose: () => void
  /** Pre-select a person (e.g. opened from that member's own wishlist page). */
  defaultMemberId?: string
  /**
   * 'wishlist' (default) — captures into the person's OWN canonical wishlist,
   * person pills shown. 'gift_ideas' — captures into MOM'S hidden gift-ideas
   * list about `defaultMemberId` (required in this mode); person pills are
   * hidden and replaced with a fixed "Gift ideas for {name}" header (PRD §6.4
   * — "person pill switches to 'Gift ideas for R' context within this tab").
   */
  mode?: 'wishlist' | 'gift_ideas'
  subjectName?: string
}

function normalizeForCompare(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    return `${u.hostname.replace(/^www\./, '')}${u.pathname}`.replace(/\/$/, '').toLowerCase()
  } catch {
    return url.trim().toLowerCase()
  }
}

export function WishCatchModal({ isOpen, onClose, defaultMemberId, mode = 'wishlist', subjectName }: WishCatchModalProps) {
  const isGiftIdeasMode = mode === 'gift_ideas'
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: allMembers } = useFamilyMembers(currentFamily?.id)
  const createWishlistItem = useCreateWishlistItem()
  const createGiftIdea = useCreateGiftIdeaItem()

  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [textValue, setTextValue] = useState('')
  const [justCaptured, setJustCaptured] = useState<JustCaptured[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const voice = useVoiceInput()

  const { data: existingWishlistItems = [] } = useWishlistItems(
    !isGiftIdeasMode ? currentFamily?.id : undefined,
    !isGiftIdeasMode ? (selectedMemberId || undefined) : undefined,
  )
  const { data: existingGiftIdeas = [] } = useGiftIdeasItems(
    isGiftIdeasMode ? currentFamily?.id : undefined,
    isGiftIdeasMode ? (selectedMemberId || undefined) : undefined,
  )
  const existingItems = isGiftIdeasMode ? existingGiftIdeas : existingWishlistItems

  // Sticky person pill: last-used member, or defaultMemberId, or self.
  // Gift-ideas mode always targets defaultMemberId — never sticky, never self.
  useEffect(() => {
    if (!isOpen) return
    if (isGiftIdeasMode) {
      if (defaultMemberId) setSelectedMemberId(defaultMemberId)
      return
    }
    if (defaultMemberId) {
      setSelectedMemberId(defaultMemberId)
      return
    }
    try {
      const stored = localStorage.getItem(LAST_PERSON_KEY)
      if (stored) {
        setSelectedMemberId(stored)
        return
      }
    } catch { /* ignore */ }
    if (currentMember) setSelectedMemberId(currentMember.id)
  }, [isOpen, defaultMemberId, currentMember, isGiftIdeasMode])

  useEffect(() => {
    if (isOpen) {
      setTextValue('')
      setJustCaptured([])
    }
  }, [isOpen])

  // Voice: final transcript appends into the text field (no duplication —
  // VOICE-INPUT-REPAIR fix). Interim preview shown separately below the input.
  const lastTranscriptRef = useRef('')
  const handleMicToggle = useCallback(async () => {
    if (voice.state === 'recording') {
      const finalText = await voice.stopRecording()
      if (finalText && finalText !== lastTranscriptRef.current) {
        setTextValue((prev) => (prev ? `${prev} ${finalText}`.trim() : finalText))
      }
    } else if (voice.state === 'idle') {
      await voice.startRecording()
    }
  }, [voice])

  // PRD-43 §10: Special Adults appear in NO gift audience or picker, ever.
  const memberPills: MemberPillItem[] = [
    ...(currentMember
      ? [{ id: currentMember.id, display_name: 'Me', assigned_color: currentMember.assigned_color, calendar_color: currentMember.calendar_color, member_color: currentMember.member_color }]
      : []),
    ...(allMembers ?? [])
      .filter((m) => m.id !== currentMember?.id && m.role !== 'special_adult')
      .map((m) => ({ id: m.id, display_name: m.display_name, assigned_color: m.assigned_color, calendar_color: m.calendar_color, member_color: m.member_color })),
  ]

  const handleSelectPerson = useCallback((id: string) => {
    setSelectedMemberId(id)
    try { localStorage.setItem(LAST_PERSON_KEY, id) } catch { /* ignore */ }
  }, [])

  const selectedName = isGiftIdeasMode
    ? (subjectName ?? 'their')
    : (memberPills.find((m) => m.id === selectedMemberId)?.display_name ?? 'their')

  // Soft duplicate check — never blocks, just shown as a hint.
  const trimmed = textValue.trim()
  const isUrl = URL_PATTERN.test(trimmed)
  const duplicateHint = trimmed.length > 2 && existingItems.some((it) => {
    if (isUrl && it.resource_url) return normalizeUrl(it.resource_url) === normalizeUrl(trimmed)
    return normalizeForCompare(it.content) === normalizeForCompare(trimmed)
  })

  async function runLinkExtraction(item: ListItem, familyId: string, memberId: string) {
    setJustCaptured((prev) => prev.map((c) => (c.item.id === item.id ? { ...c, status: 'extracting' } : c)))
    try {
      const { data } = await supabase.functions.invoke('wishlist-extract', {
        body: { mode: 'link', url: item.resource_url, family_id: familyId, member_id: memberId },
      })
      const result = data as WishlistExtractLinkResult | undefined
      if (!result || result.crisis) {
        setJustCaptured((prev) => prev.map((c) => (c.item.id === item.id ? { ...c, status: 'done' } : c)))
        return
      }
      if (!result.title && !result.image_url) {
        setJustCaptured((prev) => prev.map((c) => (c.item.id === item.id ? { ...c, status: 'done' } : c)))
        return
      }
      if (result.confidence === 'meta') {
        // Deterministic — auto-fill, no confirm required (.ics-import class).
        await supabase.from('list_items').update({
          content: result.title || item.content,
          image_url: result.image_url,
          price: result.price,
          currency: result.currency ?? item.currency,
        }).eq('id', item.id)
        setJustCaptured((prev) => prev.map((c) => (c.item.id === item.id
          ? { ...c, status: 'auto_filled', item: { ...c.item, content: result.title || c.item.content, image_url: result.image_url, price: result.price } }
          : c)))
      } else if (result.confidence === 'ai') {
        setJustCaptured((prev) => prev.map((c) => (c.item.id === item.id
          ? { ...c, status: 'suggestion', suggestion: { title: result.title, image_url: result.image_url } }
          : c)))
      } else {
        setJustCaptured((prev) => prev.map((c) => (c.item.id === item.id ? { ...c, status: 'done' } : c)))
      }
    } catch {
      setJustCaptured((prev) => prev.map((c) => (c.item.id === item.id ? { ...c, status: 'done' } : c)))
    }
  }

  async function runPhotoExtraction(item: ListItem, imageBase64: string, mimeType: string, familyId: string, memberId: string) {
    setJustCaptured((prev) => prev.map((c) => (c.item.id === item.id ? { ...c, status: 'extracting' } : c)))
    try {
      const { data } = await supabase.functions.invoke('wishlist-extract', {
        body: { mode: 'photo', image_base64: imageBase64, mime_type: mimeType, family_id: familyId, member_id: memberId },
      })
      const result = data as WishlistExtractPhotoResult | undefined
      if (!result || result.crisis || !result.title) {
        setJustCaptured((prev) => prev.map((c) => (c.item.id === item.id ? { ...c, status: 'done' } : c)))
        return
      }
      setJustCaptured((prev) => prev.map((c) => (c.item.id === item.id
        ? { ...c, status: 'suggestion', suggestion: { title: result.title, notes: result.notes } }
        : c)))
    } catch {
      setJustCaptured((prev) => prev.map((c) => (c.item.id === item.id ? { ...c, status: 'done' } : c)))
    }
  }

  const handleSave = useCallback(async () => {
    if (!trimmed || !currentFamily?.id || !selectedMemberId || !currentMember?.id) return
    const familyId = currentFamily.id
    const memberId = selectedMemberId
    const addedBy = currentMember.id
    setTextValue('')

    const item = isGiftIdeasMode
      ? await createGiftIdea.mutateAsync({
          familyId, ownerId: addedBy, subjectMemberId: memberId, subjectName: selectedName,
          content: trimmed, resourceUrl: isUrl ? trimmed : null,
        })
      : await createWishlistItem.mutateAsync({
          familyId, memberId, addedBy,
          content: trimmed,
          resourceUrl: isUrl ? trimmed : null,
        })

    setJustCaptured((prev) => [{ item, status: 'saved' as const }, ...prev].slice(0, 8))

    if (isUrl) {
      void runLinkExtraction(item, familyId, memberId)
    }
  }, [trimmed, isUrl, currentFamily?.id, selectedMemberId, currentMember?.id, isGiftIdeasMode, selectedName, createWishlistItem, createGiftIdea])

  const handleCameraChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !currentFamily?.id || !selectedMemberId || !currentMember?.id) return
    const familyId = currentFamily.id
    const memberId = selectedMemberId
    const addedBy = currentMember.id

    const path = `${familyId}/${memberId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error: uploadErr } = await supabase.storage.from('wishlist-images').upload(path, file)
    let imageUrl: string | null = null
    if (!uploadErr) {
      const { data: pub } = supabase.storage.from('wishlist-images').getPublicUrl(path)
      imageUrl = pub.publicUrl
    }

    const todayLabel = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const item = isGiftIdeasMode
      ? await createGiftIdea.mutateAsync({
          familyId, ownerId: addedBy, subjectMemberId: memberId, subjectName: selectedName,
          content: `Photo wish — ${todayLabel}`, imageUrl,
        })
      : await createWishlistItem.mutateAsync({
          familyId, memberId, addedBy,
          content: `Photo wish — ${todayLabel}`,
          imageUrl,
        })
    setJustCaptured((prev) => [{ item, status: 'saved' as const }, ...prev].slice(0, 8))

    if (imageUrl) {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        if (base64) void runPhotoExtraction(item, base64, file.type || 'image/jpeg', familyId, memberId)
      }
      reader.readAsDataURL(file)
    }
  }, [currentFamily?.id, selectedMemberId, currentMember?.id, isGiftIdeasMode, selectedName, createWishlistItem, createGiftIdea])

  const acceptSuggestion = useCallback(async (capture: JustCaptured) => {
    if (!capture.suggestion) return
    const updates: Record<string, unknown> = {}
    if (capture.suggestion.title) updates.content = capture.suggestion.title
    if (capture.suggestion.image_url) updates.image_url = capture.suggestion.image_url
    if (capture.suggestion.notes) updates.notes = capture.suggestion.notes
    await supabase.from('list_items').update(updates).eq('id', capture.item.id)
    setJustCaptured((prev) => prev.map((c) => (c.item.id === capture.item.id ? { ...c, status: 'done', item: { ...c.item, ...updates } as ListItem } : c)))
  }, [])

  const rejectSuggestion = useCallback((capture: JustCaptured) => {
    setJustCaptured((prev) => prev.map((c) => (c.item.id === capture.item.id ? { ...c, status: 'done' } : c)))
  }, [])

  return (
    <ModalV2
      id="wishcatch-modal"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title="WishCatch"
      subtitle="Catch it before you forget"
      icon={Gift}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
        {/* Person pills — hidden in gift_ideas mode (fixed target, "person
            pill switches to 'Gift ideas for R' context", PRD §6.4) */}
        {isGiftIdeasMode ? (
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-heading)' }}>
            Gift ideas for {selectedName} — they'll never see this
          </p>
        ) : (
          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Whose wish is this?
            </label>
            <MemberPillSelector
              members={memberPills}
              selectedIds={selectedMemberId ? [selectedMemberId] : []}
              onToggle={handleSelectPerson}
              variant="compact"
              showSortToggle={false}
            />
          </div>
        )}

        {/* Input row */}
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSave() }}
              placeholder="Type it, paste a link, or use the mic"
              autoFocus
              style={{
                flex: 1,
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                border: '1px solid var(--color-border, #ddd)',
                background: 'var(--color-bg-input, var(--color-bg-card))',
                color: 'var(--color-text-primary)',
                fontSize: '0.9375rem',
                outline: 'none',
              }}
            />
            {voice.isSupported && (
              <button
                onClick={handleMicToggle}
                aria-label={voice.state === 'recording' ? 'Stop recording' : 'Start voice capture'}
                style={{
                  width: '2.5rem', height: '2.5rem', borderRadius: '999px', border: 'none',
                  background: voice.state === 'recording' ? 'var(--color-error, #e05d5d)' : 'var(--color-bg-secondary)',
                  color: voice.state === 'recording' ? '#fff' : 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                }}
              >
                {voice.state === 'recording' ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Take or choose a photo"
              style={{
                width: '2.5rem', height: '2.5rem', borderRadius: '999px', border: 'none',
                background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Camera size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraChange}
              style={{ display: 'none' }}
            />
          </div>

          {voice.state === 'recording' && voice.interimText && (
            <p style={{ marginTop: '0.375rem', fontSize: '0.8125rem', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
              {voice.interimText}
            </p>
          )}
          {voice.error && (
            <p style={{ marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-error, #e05d5d)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              {voice.error}
              <button onClick={voice.clearError} style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Dismiss</button>
            </p>
          )}
          {duplicateHint && (
            <p style={{ marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Looks like this might already be on {selectedName === 'Me' ? 'your' : `${selectedName}'s`} list.
            </p>
          )}

          <button
            onClick={() => void handleSave()}
            disabled={!trimmed || !selectedMemberId || createWishlistItem.isPending || createGiftIdea.isPending}
            className="btn-primary"
            style={{
              width: '100%', marginTop: '0.75rem', padding: '0.625rem 1rem',
              borderRadius: 'var(--vibe-radius-input, 8px)', border: 'none',
              background: trimmed && selectedMemberId ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-bg-secondary)',
              color: trimmed && selectedMemberId ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-secondary)',
              fontWeight: 600, cursor: trimmed && selectedMemberId ? 'pointer' : 'not-allowed',
            }}
          >
            {(createWishlistItem.isPending || createGiftIdea.isPending) ? 'Adding...' : `Add to ${selectedName === 'Me' ? 'your' : `${selectedName}'s`} list`}
          </button>
        </div>

        {/* Just-captured session list — suggestion chips render here */}
        {justCaptured.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {justCaptured.map((capture) => (
              <CapturedItemRow
                key={capture.item.id}
                capture={capture}
                onAccept={() => void acceptSuggestion(capture)}
                onReject={() => rejectSuggestion(capture)}
              />
            ))}
          </div>
        )}
      </div>
    </ModalV2>
  )
}

function CapturedItemRow({ capture, onAccept, onReject }: { capture: JustCaptured; onAccept: () => void; onReject: () => void }) {
  return (
    <div
      style={{
        padding: '0.625rem 0.75rem',
        borderRadius: 'var(--vibe-radius-input, 8px)',
        background: 'var(--color-bg-secondary)',
        display: 'flex', flexDirection: 'column', gap: '0.375rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Check size={14} style={{ color: 'var(--color-success, #4caf7a)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{capture.item.content}</span>
      </div>
      {capture.status === 'extracting' && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', paddingLeft: '1.375rem' }}>Looking it up...</p>
      )}
      {capture.status === 'auto_filled' && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', paddingLeft: '1.375rem' }}>Auto-filled from the link — check it</p>
      )}
      {capture.status === 'suggestion' && capture.suggestion?.title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1.375rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Suggested: "{capture.suggestion.title}"
          </span>
          <button onClick={onAccept} aria-label="Accept suggestion" style={{ background: 'none', border: 'none', color: 'var(--color-success, #4caf7a)', cursor: 'pointer', padding: '0.125rem' }}>
            <Check size={16} />
          </button>
          <button onClick={onReject} aria-label="Reject suggestion" style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0.125rem' }}>
            <Pencil size={14} />
          </button>
          <button onClick={onReject} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0.125rem' }}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
