/**
 * useWizardDraftChrome — the full save-and-return UX (STUDIO-EXPERIENCE ST-C).
 *
 * Wraps useWizardDraft + useWizardDraftList into the shared close-prompt /
 * reopen-prompt / "Save & Come Back" behavior described in the Composition
 * doc §2.2. A wizard calls this once and spreads the returned `chromeProps`
 * onto <SetupWizard draftChrome={...}>, plus passes `requestClose` as
 * SetupWizard's `onClose` — SetupWizard renders the prompts and the footer
 * button itself, so no individual wizard needs to build its own confirm UI.
 *
 * Contract with the wizard:
 *  - `state`/`setState` are the wizard's own state and setter.
 *  - `getTitle()` computes a human title from current state (for the
 *    Drafts tab and the reopen-prompt list).
 *  - `hasContent()` returns true once there's something worth asking about
 *    on close — a wizard opened and immediately closed with nothing typed
 *    should just close, no prompt.
 *  - `skipReopenPrompt` should be true whenever the wizard was opened with
 *    explicit prefilled content (NLC prefill, "Use as-is", an example) —
 *    an explicit caller intent should never be interrupted by a stale
 *    "continue an old draft?" nudge.
 *  - On deploy success, call `onDeploySuccess()` instead of the old bare
 *    `clearDraft()` — it also refreshes the shared drafts list so the
 *    Studio "Drafts (N)" badge and reopen-prompts elsewhere update.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useWizardDraft, useWizardDraftList, type WizardDraftSummary } from './useWizardDraft'

export interface WizardDraftChromeOptions<T> {
  wizardType: string
  familyId: string | undefined
  memberId: string | undefined
  /** Whether the wizard modal is currently open (mounted+visible). */
  isOpen: boolean
  state: T
  setState: (state: T) => void
  getTitle: () => string
  hasContent: () => boolean
  /** True when the wizard opened with explicit prefilled content (NLC,
   *  "Use as-is", an example) — skips the reopen-prompt for this open. */
  skipReopenPrompt?: boolean
  /** Real close handler from the parent (Studio.tsx) — called once the
   *  chrome has resolved what to do (save/discard/immediate). */
  onRealClose: () => void
}

export interface WizardDraftChromeProps {
  showReopenPrompt: boolean
  pendingDrafts: WizardDraftSummary[]
  onContinueDraft: (draftId: string) => void
  onStartFresh: () => void
  showClosePrompt: boolean
  isSavingDraft: boolean
  onConfirmSaveAndClose: () => void
  onConfirmDiscardAndClose: () => void
  onCancelClosePrompt: () => void
  onSaveAndComeBack: () => void
  hasActiveDraft: boolean
}

export function useWizardDraftChrome<T>({
  wizardType,
  familyId,
  memberId,
  isOpen,
  state,
  setState,
  getTitle,
  hasContent,
  skipReopenPrompt = false,
  onRealClose,
}: WizardDraftChromeOptions<T>) {
  const draftApi = useWizardDraft<T>(wizardType, familyId, memberId)
  const { drafts: pendingDrafts, isLoading: isLoadingDrafts, refresh: refreshDrafts } =
    useWizardDraftList(familyId, wizardType)

  const [showReopenPrompt, setShowReopenPrompt] = useState(false)
  const [showClosePrompt, setShowClosePrompt] = useState(false)
  const evaluatedRef = useRef(false)

  // Evaluate the reopen-prompt exactly once per open, once the draft list
  // has finished its first load (avoids a flash where pendingDrafts is
  // still [] because the fetch hasn't resolved yet).
  useEffect(() => {
    if (!isOpen) {
      evaluatedRef.current = false
      return
    }
    if (evaluatedRef.current || isLoadingDrafts) return
    evaluatedRef.current = true
    if (!skipReopenPrompt && !draftApi.draftId && pendingDrafts.length > 0) {
      setShowReopenPrompt(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isLoadingDrafts, skipReopenPrompt])

  // Once a specific draft's state resolves (via loadDraft, triggered by
  // "Continue"), copy it into the wizard's own state.
  const lastAppliedDraftRef = useRef<unknown>(null)
  useEffect(() => {
    if (draftApi.draft && draftApi.draft !== lastAppliedDraftRef.current) {
      lastAppliedDraftRef.current = draftApi.draft
      setState(draftApi.draft)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftApi.draft])

  const onContinueDraft = useCallback(
    (draftId: string) => {
      draftApi.loadDraft(draftId)
      setShowReopenPrompt(false)
    },
    [draftApi],
  )

  const onStartFresh = useCallback(() => {
    // The existing draft is already persisted — leave it alone. The wizard
    // proceeds with whatever blank state it already has.
    setShowReopenPrompt(false)
  }, [])

  const requestClose = useCallback(() => {
    const worthAsking = hasContent() || !!draftApi.draftId
    if (!worthAsking) {
      onRealClose()
      return
    }
    setShowClosePrompt(true)
  }, [hasContent, draftApi.draftId, onRealClose])

  const onConfirmSaveAndClose = useCallback(async () => {
    await draftApi.saveDraft(state, getTitle())
    setShowClosePrompt(false)
    refreshDrafts()
    onRealClose()
  }, [draftApi, state, getTitle, refreshDrafts, onRealClose])

  const onConfirmDiscardAndClose = useCallback(async () => {
    await draftApi.clearDraft()
    setShowClosePrompt(false)
    refreshDrafts()
    onRealClose()
  }, [draftApi, refreshDrafts, onRealClose])

  const onCancelClosePrompt = useCallback(() => {
    setShowClosePrompt(false)
  }, [])

  const onSaveAndComeBack = useCallback(async () => {
    await draftApi.saveDraft(state, getTitle())
    refreshDrafts()
    onRealClose()
  }, [draftApi, state, getTitle, refreshDrafts, onRealClose])

  const onDeploySuccess = useCallback(async () => {
    await draftApi.clearDraft()
    refreshDrafts()
  }, [draftApi, refreshDrafts])

  const resetForNextOpen = useCallback(() => {
    draftApi.resetLocal()
    lastAppliedDraftRef.current = null
  }, [draftApi])

  const chromeProps: WizardDraftChromeProps = {
    showReopenPrompt,
    pendingDrafts,
    onContinueDraft,
    onStartFresh,
    showClosePrompt,
    isSavingDraft: draftApi.isSaving,
    onConfirmSaveAndClose,
    onConfirmDiscardAndClose,
    onCancelClosePrompt,
    onSaveAndComeBack,
    hasActiveDraft: !!draftApi.draftId,
  }

  return {
    requestClose,
    onDeploySuccess,
    resetForNextOpen,
    chromeProps,
  }
}
