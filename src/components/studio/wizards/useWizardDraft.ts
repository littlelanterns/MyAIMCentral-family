import { useState, useEffect, useCallback, useMemo } from 'react'

const DRAFT_PREFIX = 'wizard-draft-'

export interface WizardDraftSummary {
  wizardType: string
  title: string
  draftId: string
  lastSaved: string
}

export function useWizardDraft<T>(
  wizardType: string,
  familyId: string | undefined,
  draftId?: string,
) {
  const key = familyId
    ? `${DRAFT_PREFIX}${wizardType}-${familyId}-${draftId || 'new'}`
    : null

  const [draft, setDraft] = useState<T | null>(() => {
    if (!key) return null
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return (parsed.state ?? null) as T | null
    } catch {
      return null
    }
  })

  const hasDraft = draft !== null

  const saveDraft = useCallback(
    (state: T, title?: string) => {
      if (!key) return
      const payload = {
        wizardType,
        title: title || 'Untitled',
        draftId: draftId || 'new',
        lastSaved: new Date().toISOString(),
        state,
      }
      try {
        localStorage.setItem(key, JSON.stringify(payload))
        setDraft(state)
      } catch {
        // localStorage full — silently fail
      }
    },
    [key, wizardType, draftId],
  )

  const clearDraft = useCallback(() => {
    if (!key) return
    localStorage.removeItem(key)
    setDraft(null)
  }, [key])

  return { draft, saveDraft, clearDraft, hasDraft }
}

export function useWizardDraftList(familyId: string | undefined, refreshKey?: number): {
  drafts: WizardDraftSummary[]
  refresh: () => void
} {
  const [drafts, setDrafts] = useState<WizardDraftSummary[]>([])

  const scan = useCallback(() => {
    if (!familyId) {
      setDrafts([])
      return
    }
    const suffix = `-${familyId}-`
    const results: WizardDraftSummary[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(DRAFT_PREFIX) || !k.includes(suffix)) continue
      try {
        const raw = localStorage.getItem(k)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        results.push({
          wizardType: parsed.wizardType ?? 'unknown',
          title: parsed.title ?? 'Untitled',
          draftId: parsed.draftId ?? 'new',
          lastSaved: parsed.lastSaved ?? '',
        })
      } catch {
        // skip corrupt entries
      }
    }
    results.sort((a, b) => (b.lastSaved || '').localeCompare(a.lastSaved || ''))
    setDrafts(results)
  }, [familyId])

  useEffect(() => { scan() }, [scan, refreshKey])

  return useMemo(() => ({ drafts, refresh: scan }), [drafts, scan])
}

export function clearWizardDraft(
  wizardType: string,
  familyId: string,
  draftId: string,
) {
  const key = `${DRAFT_PREFIX}${wizardType}-${familyId}-${draftId}`
  localStorage.removeItem(key)
}
