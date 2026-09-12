/**
 * useWizardDraft — server-backed Studio wizard save-and-return (STUDIO-EXPERIENCE ST-C).
 *
 * Replaces the Phase 3.7 localStorage-only implementation. Drafts live in
 * `wizard_drafts` (migration 100333) so they survive across devices/browsers,
 * per Composition doc §2.2. `migrateLocalStorageWizardDrafts()` upserts any
 * pre-existing local drafts into the table once per family, then clears the
 * local keys — call it once near the top of Studio.tsx.
 *
 * API shape deliberately mirrors the old hook (`draft`, `saveDraft`,
 * `clearDraft`, `hasDraft`) so individual wizards need minimal changes.
 * `useWizardDraftChrome` (companion file) wraps this + `useWizardDraftList`
 * into the full close/reopen-prompt UX most wizards should use instead of
 * calling this hook directly.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface WizardDraftSummary {
  id: string
  wizardType: string
  title: string
  lastSaved: string
  state: unknown
}

interface DraftRow {
  id: string
  wizard_type: string
  title: string
  state: unknown
  last_saved_at: string
}

function rowToSummary(row: DraftRow): WizardDraftSummary {
  return {
    id: row.id,
    wizardType: row.wizard_type,
    title: row.title,
    lastSaved: row.last_saved_at,
    state: row.state,
  }
}

/**
 * Manages ONE draft instance for a wizard. `draftId` starts unset — the
 * first `saveDraft()` call creates the row and captures its id; subsequent
 * calls update that same row. `loadDraft(id)` switches this instance onto
 * an existing row (used by the reopen-prompt "Continue" action).
 */
export function useWizardDraft<T>(
  wizardType: string,
  familyId: string | undefined,
  memberId: string | undefined,
) {
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null)
  const [draft, setDraft] = useState<T | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)

  const loadDraft = useCallback(async (id: string) => {
    setIsLoadingDraft(true)
    try {
      const { data, error } = await supabase
        .from('wizard_drafts')
        .select('state')
        .eq('id', id)
        .maybeSingle()
      if (error || !data) {
        console.error('Failed to load wizard draft:', error)
        return
      }
      setDraft(data.state as T)
      setActiveDraftId(id)
    } finally {
      setIsLoadingDraft(false)
    }
  }, [])

  const saveDraft = useCallback(
    async (state: T, title?: string) => {
      if (!familyId || !memberId) return
      setIsSaving(true)
      try {
        const payload = {
          title: title || 'Untitled',
          state: state as unknown as Record<string, unknown>,
          last_saved_at: new Date().toISOString(),
        }
        if (activeDraftId) {
          const { error } = await supabase
            .from('wizard_drafts')
            .update(payload)
            .eq('id', activeDraftId)
          if (error) console.error('Failed to update wizard draft:', error)
        } else {
          const { data, error } = await supabase
            .from('wizard_drafts')
            .insert({
              family_id: familyId,
              member_id: memberId,
              wizard_type: wizardType,
              ...payload,
            })
            .select('id')
            .single()
          if (error) {
            console.error('Failed to create wizard draft:', error)
          } else if (data) {
            setActiveDraftId(data.id)
          }
        }
      } finally {
        setIsSaving(false)
      }
    },
    [activeDraftId, familyId, memberId, wizardType],
  )

  const clearDraft = useCallback(async () => {
    const idToDelete = activeDraftId
    setActiveDraftId(null)
    setDraft(null)
    if (idToDelete) {
      const { error } = await supabase.from('wizard_drafts').delete().eq('id', idToDelete)
      if (error) console.error('Failed to delete wizard draft:', error)
    }
  }, [activeDraftId])

  /** Reset local instance state (e.g. when the wizard closes) without
   *  touching the server row — used so the NEXT open starts fresh unless
   *  the reopen-prompt explicitly loads a draft again. */
  const resetLocal = useCallback(() => {
    setActiveDraftId(null)
    setDraft(null)
  }, [])

  return {
    draft,
    draftId: activeDraftId,
    saveDraft,
    clearDraft,
    loadDraft,
    resetLocal,
    hasDraft: draft !== null,
    isSaving,
    isLoadingDraft,
  }
}

/**
 * Lists drafts for a family, optionally filtered to one wizard type.
 * Used by the Studio Drafts tab (all types) and by each wizard's own
 * reopen-prompt (one type).
 */
export function useWizardDraftList(
  familyId: string | undefined,
  wizardType?: string,
  refreshKey?: number,
): { drafts: WizardDraftSummary[]; isLoading: boolean; refresh: () => void } {
  const [drafts, setDrafts] = useState<WizardDraftSummary[]>([])
  // Lazy-initialized to true when a fetch is about to happen (familyId
  // already known at mount): consumers like useWizardDraftChrome gate a
  // one-time check on "the initial load has resolved," and if this started
  // false, the FIRST synchronous render (before scan()'s own setIsLoading
  // (true) round-trips through React) would read isLoading=false + drafts=[]
  // and lock in a false negative before the real fetch ever resolves.
  const [isLoading, setIsLoading] = useState(() => !!familyId)

  const scan = useCallback(async () => {
    if (!familyId) {
      setDrafts([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      let query = supabase
        .from('wizard_drafts')
        .select('id, wizard_type, title, state, last_saved_at')
        .eq('family_id', familyId)
        .order('last_saved_at', { ascending: false })
      if (wizardType) query = query.eq('wizard_type', wizardType)
      const { data, error } = await query
      if (error) {
        console.error('Failed to list wizard drafts:', error)
        setDrafts([])
        return
      }
      setDrafts((data as DraftRow[] ?? []).map(rowToSummary))
    } finally {
      setIsLoading(false)
    }
  }, [familyId, wizardType])

  useEffect(() => {
    scan()
  }, [scan, refreshKey])

  return { drafts, isLoading, refresh: scan }
}

/** Delete a draft by id directly — used by the Drafts tab's Discard action. */
export async function deleteWizardDraftById(draftId: string): Promise<void> {
  const { error } = await supabase.from('wizard_drafts').delete().eq('id', draftId)
  if (error) console.error('Failed to delete wizard draft:', error)
}

const LOCAL_DRAFT_PREFIX = 'wizard-draft-'
const MIGRATION_FLAG_PREFIX = 'wizard-drafts-migrated-'

/**
 * One-time migration: upserts any pre-existing localStorage drafts for this
 * family into `wizard_drafts`, then clears the local keys. Idempotent per
 * family (flagged via a localStorage marker) so it's cheap to call on every
 * Studio mount. Never strands a founder-family draft — on any write failure
 * the local keys are left in place so a later load can retry.
 */
export async function migrateLocalStorageWizardDrafts(
  familyId: string,
  memberId: string,
): Promise<void> {
  const flagKey = `${MIGRATION_FLAG_PREFIX}${familyId}`
  if (localStorage.getItem(flagKey)) return

  const suffix = `-${familyId}-`
  const keysToRemove: string[] = []
  const rowsToInsert: Array<{
    family_id: string
    member_id: string
    wizard_type: string
    title: string
    state: unknown
    last_saved_at: string
  }> = []

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith(LOCAL_DRAFT_PREFIX) || !k.includes(suffix)) continue
    try {
      const raw = localStorage.getItem(k)
      if (!raw) {
        keysToRemove.push(k)
        continue
      }
      const parsed = JSON.parse(raw)
      if (parsed?.state === undefined || parsed?.state === null) {
        keysToRemove.push(k)
        continue
      }
      rowsToInsert.push({
        family_id: familyId,
        member_id: memberId,
        wizard_type: parsed.wizardType ?? 'unknown',
        title: parsed.title ?? 'Untitled',
        state: parsed.state,
        last_saved_at: parsed.lastSaved || new Date().toISOString(),
      })
      keysToRemove.push(k)
    } catch {
      // Corrupt entry — drop it, don't let it block migration forever.
      keysToRemove.push(k)
    }
  }

  if (rowsToInsert.length > 0) {
    const { error } = await supabase.from('wizard_drafts').insert(rowsToInsert)
    if (error) {
      console.error('Wizard draft localStorage migration failed, will retry next load:', error)
      return
    }
  }

  keysToRemove.forEach((k) => localStorage.removeItem(k))
  localStorage.setItem(flagKey, '1')
}

/** Hook wrapper so components can fire the migration once on mount without
 *  duplicating the async-effect boilerplate. */
export function useMigrateLocalStorageWizardDrafts(
  familyId: string | undefined,
  memberId: string | undefined,
) {
  const ranRef = useRef(false)
  useEffect(() => {
    if (ranRef.current || !familyId || !memberId) return
    ranRef.current = true
    migrateLocalStorageWizardDrafts(familyId, memberId)
  }, [familyId, memberId])
}
