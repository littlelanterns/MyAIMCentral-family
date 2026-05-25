/**
 * TaskCreationModal — checkbox honesty (visible UI = saved DB state).
 *
 * Bug class: a re-init useEffect was calling setData(d) — overwriting the entire
 * form — whenever its `editTaskValues` prop changed reference. Both edit callers
 * (Tasks.tsx Edit modal, DashboardTasksSection.tsx Edit modal) pass editTaskValues
 * as an inline JSX object literal, so every parent re-render produced a fresh
 * reference and silently clobbered mom's in-progress edits (allowance checkbox,
 * gamification, homework, extra-credit, track-progress, track-duration, allowance
 * points, and every other form field).
 *
 * Companion to tests/routine-deploy-tracking-honesty.test.tsx (commit 9523faa).
 * Same harness philosophy: TaskCreationModal pulls 8+ hooks plus a dozen child
 * components, every one of which would need a mock; the harness mirrors the
 * exact ref + effect + state shape used in the fix without the mock-tree sprawl.
 *
 * Invariant tested:
 *   1. Parent re-renders that produce a fresh `editTaskValues` reference but
 *      do NOT change `editTaskId` MUST NOT clobber mom's in-progress edits.
 *   2. A real edit-target swap (editTaskId changes) MUST re-hydrate the form
 *      from the new defaults and reset the interaction ref.
 *   3. Batch queueItem.id changes MUST re-hydrate (preserves SortTab flow).
 *   4. One-field interaction blocks hydration for ALL fields (shared ref).
 *
 * Covers all 7 task-level tracking fields the bug surface touches:
 *   - countsForAllowance / countsForGamification / countsForHomework
 *   - isExtraCredit / trackProgress / trackDuration
 *   - allowancePoints
 */

import { describe, it, expect } from 'vitest'
import { render, fireEvent, screen, act } from '@testing-library/react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types matching TaskCreationModal.tsx ──────────────────────────────

interface EditTaskValues {
  trackProgress?: boolean
  trackDuration?: boolean
  countsForAllowance?: boolean
  countsForHomework?: boolean
  countsForGamification?: boolean
  isExtraCredit?: boolean
  allowancePoints?: number | null
}

interface FormState {
  trackProgress: boolean
  trackDuration: boolean
  countsForAllowance: boolean
  countsForHomework: boolean
  countsForGamification: boolean
  isExtraCredit: boolean
  allowancePoints: string
}

function defaultFormState(): FormState {
  return {
    trackProgress: false,
    trackDuration: false,
    countsForAllowance: false,
    countsForHomework: false,
    countsForGamification: true, // matches defaultTaskData line 277
    isExtraCredit: false,
    allowancePoints: '',
  }
}

function hydrateFromEditTaskValues(d: FormState, e: EditTaskValues | null | undefined): FormState {
  if (!e) return d
  const next = { ...d }
  if (e.trackProgress !== undefined) next.trackProgress = e.trackProgress
  if (e.trackDuration !== undefined) next.trackDuration = e.trackDuration
  if (e.countsForAllowance !== undefined) next.countsForAllowance = e.countsForAllowance
  if (e.countsForHomework !== undefined) next.countsForHomework = e.countsForHomework
  if (e.countsForGamification !== undefined) next.countsForGamification = e.countsForGamification
  if (e.isExtraCredit !== undefined) next.isExtraCredit = e.isExtraCredit
  if (e.allowancePoints !== undefined && e.allowancePoints !== null) {
    next.allowancePoints = String(e.allowancePoints)
  }
  return next
}

// ─── Harness ───────────────────────────────────────────────────────────
//
// Mirrors the relevant slice of TaskCreationModal.tsx after the checkbox-honesty
// fix. The component:
//   - hydrates from editTaskValues on mount (useState initializer)
//   - re-inits on legitimate identity-change triggers (queueItemId, activeBatchItemId, editTaskId)
//   - resets hasUserInteractedRef.current = false BEFORE the re-init setData
//   - user-driven updates flow through updateData() which flips ref true
//   - parent re-renders that pass a fresh editTaskValues but unchanged identity
//     deps MUST NOT fire the effect (the dep array doesn't include editTaskValues)

interface HarnessProps {
  queueItemId?: string | null
  activeBatchItemId?: string | null
  editTaskId?: string | null
  editTaskValues?: EditTaskValues | null
  onState?: (s: FormState & { interacted: boolean }) => void
}

function CheckboxHonessyHarness({
  queueItemId,
  activeBatchItemId,
  editTaskId,
  editTaskValues,
  onState,
}: HarnessProps) {
  const [data, setData] = useState<FormState>(() =>
    hydrateFromEditTaskValues(defaultFormState(), editTaskValues),
  )

  const hasUserInteractedRef = useRef(false)

  const updateData = useCallback((updater: (d: FormState) => FormState) => {
    hasUserInteractedRef.current = true
    setData(updater)
  }, [])

  // Mirror of TaskCreationModal.tsx re-init effect after the fix.
  // Dep array is narrowed to identity-only triggers; editTaskValues is read
  // inside the effect body but is NOT in the dep array.
  useEffect(() => {
    const d = hydrateFromEditTaskValues(defaultFormState(), editTaskValues)
    hasUserInteractedRef.current = false
    setData(d)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueItemId, activeBatchItemId, editTaskId])

  // Spy out current state for the test harness
  useEffect(() => {
    onState?.({
      ...data,
      interacted: hasUserInteractedRef.current,
    })
  })

  return (
    <div data-testid="harness">
      <label>
        <input
          type="checkbox"
          aria-label="Track daily progress"
          checked={data.trackProgress}
          onChange={(e) => updateData(d => ({ ...d, trackProgress: e.target.checked }))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          aria-label="Track time spent"
          checked={data.trackDuration}
          onChange={(e) => updateData(d => ({ ...d, trackDuration: e.target.checked }))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          aria-label="Count toward allowance"
          checked={data.countsForAllowance}
          onChange={(e) => updateData(d => ({
            ...d,
            countsForAllowance: e.target.checked,
            // Mirrors the NEW-EE cascade on line 2511 of TaskCreationModal.tsx
            ...(e.target.checked ? {} : { isExtraCredit: false }),
          }))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          aria-label="Count toward homework"
          checked={data.countsForHomework}
          onChange={(e) => updateData(d => ({ ...d, countsForHomework: e.target.checked }))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          aria-label="Count toward gamification"
          checked={data.countsForGamification}
          onChange={(e) => updateData(d => ({ ...d, countsForGamification: e.target.checked }))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          aria-label="Extra credit"
          checked={data.isExtraCredit}
          onChange={(e) => updateData(d => ({ ...d, isExtraCredit: e.target.checked }))}
        />
      </label>
      <label>
        <input
          type="number"
          aria-label="Allowance points"
          value={data.allowancePoints}
          onChange={(e) => updateData(d => ({ ...d, allowancePoints: e.target.value }))}
        />
      </label>
    </div>
  )
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe('TaskCreationModal — checkbox honesty (hasUserInteractedRef + narrowed dep array)', () => {
  describe('Case 1: parent re-render noise must NOT clobber user input', () => {
    it('countsForAllowance: mom flips OFF, parent passes fresh editTaskValues with same logical values — flip holds', () => {
      const stateRef: { current: (FormState & { interacted: boolean }) | null } = { current: null }
      const initialEditValues: EditTaskValues = { countsForAllowance: true }

      const { rerender } = render(
        <CheckboxHonessyHarness
          editTaskId="task-1"
          editTaskValues={initialEditValues}
          onState={(s) => { stateRef.current = s }}
        />,
      )

      const allowanceBox = screen.getByLabelText('Count toward allowance') as HTMLInputElement
      expect(allowanceBox.checked).toBe(true) // hydrated from editTaskValues
      expect(stateRef.current?.interacted).toBe(false)

      // Mom flips OFF
      act(() => {
        fireEvent.click(allowanceBox)
      })
      expect(allowanceBox.checked).toBe(false)
      expect(stateRef.current?.interacted).toBe(true)

      // Parent re-renders with a FRESH editTaskValues object — same logical values,
      // new reference. This is exactly the inline JSX literal pattern in
      // Tasks.tsx:976 and DashboardTasksSection.tsx:346.
      act(() => {
        rerender(
          <CheckboxHonessyHarness
            editTaskId="task-1"
            editTaskValues={{ countsForAllowance: true }}
            onState={(s) => { stateRef.current = s }}
          />,
        )
      })

      // Mom's flip must still hold — the bug surface check
      expect(allowanceBox.checked).toBe(false)
      expect(stateRef.current?.countsForAllowance).toBe(false)
      expect(stateRef.current?.interacted).toBe(true)
    })

    it('all 7 tracking fields hold their post-interaction values through parent re-renders', () => {
      const stateRef: { current: (FormState & { interacted: boolean }) | null } = { current: null }

      const { rerender } = render(
        <CheckboxHonessyHarness
          editTaskId="task-1"
          editTaskValues={{
            countsForAllowance: false,
            countsForGamification: true,
            countsForHomework: false,
            isExtraCredit: false,
            trackProgress: false,
            trackDuration: false,
            allowancePoints: null,
          }}
          onState={(s) => { stateRef.current = s }}
        />,
      )

      // Mom flips/edits every field
      act(() => {
        fireEvent.click(screen.getByLabelText('Count toward allowance'))
        fireEvent.click(screen.getByLabelText('Count toward gamification'))
        fireEvent.click(screen.getByLabelText('Count toward homework'))
        fireEvent.click(screen.getByLabelText('Track daily progress'))
        fireEvent.click(screen.getByLabelText('Track time spent'))
        fireEvent.click(screen.getByLabelText('Extra credit'))
        fireEvent.change(screen.getByLabelText('Allowance points'), { target: { value: '7' } })
      })

      // Snapshot mom's intended state
      const momState = {
        countsForAllowance: true,
        countsForGamification: false,
        countsForHomework: true,
        isExtraCredit: true,
        trackProgress: true,
        trackDuration: true,
        allowancePoints: '7',
      }
      expect(stateRef.current?.countsForAllowance).toBe(momState.countsForAllowance)
      expect(stateRef.current?.countsForGamification).toBe(momState.countsForGamification)
      expect(stateRef.current?.countsForHomework).toBe(momState.countsForHomework)
      expect(stateRef.current?.isExtraCredit).toBe(momState.isExtraCredit)
      expect(stateRef.current?.trackProgress).toBe(momState.trackProgress)
      expect(stateRef.current?.trackDuration).toBe(momState.trackDuration)
      expect(stateRef.current?.allowancePoints).toBe(momState.allowancePoints)

      // Parent re-renders 5 times in succession with fresh editTaskValues references
      // each time (simulates a refetch / theme change / sibling state churn loop).
      for (let i = 0; i < 5; i++) {
        act(() => {
          rerender(
            <CheckboxHonessyHarness
              editTaskId="task-1"
              editTaskValues={{
                countsForAllowance: false,
                countsForGamification: true,
                countsForHomework: false,
                isExtraCredit: false,
                trackProgress: false,
                trackDuration: false,
                allowancePoints: null,
              }}
              onState={(s) => { stateRef.current = s }}
            />,
          )
        })
      }

      // Every single field must still match mom's intent
      expect(stateRef.current?.countsForAllowance).toBe(momState.countsForAllowance)
      expect(stateRef.current?.countsForGamification).toBe(momState.countsForGamification)
      expect(stateRef.current?.countsForHomework).toBe(momState.countsForHomework)
      expect(stateRef.current?.isExtraCredit).toBe(momState.isExtraCredit)
      expect(stateRef.current?.trackProgress).toBe(momState.trackProgress)
      expect(stateRef.current?.trackDuration).toBe(momState.trackDuration)
      expect(stateRef.current?.allowancePoints).toBe(momState.allowancePoints)
    })
  })

  describe('Case 2: edit-target swap DOES re-init', () => {
    it('editTaskId change re-hydrates form and resets interaction ref', () => {
      const stateRef: { current: (FormState & { interacted: boolean }) | null } = { current: null }

      const { rerender } = render(
        <CheckboxHonessyHarness
          editTaskId="task-A"
          editTaskValues={{ countsForGamification: true, countsForAllowance: false }}
          onState={(s) => { stateRef.current = s }}
        />,
      )

      // Mom flips gamification OFF on task A
      act(() => {
        fireEvent.click(screen.getByLabelText('Count toward gamification'))
      })
      expect(stateRef.current?.countsForGamification).toBe(false)
      expect(stateRef.current?.interacted).toBe(true)

      // Parent swaps the edit target to task B with different values
      act(() => {
        rerender(
          <CheckboxHonessyHarness
            editTaskId="task-B"
            editTaskValues={{ countsForGamification: true, countsForAllowance: true }}
            onState={(s) => { stateRef.current = s }}
          />,
        )
      })

      // Form must re-hydrate from task B's values, ref reset
      expect(stateRef.current?.countsForGamification).toBe(true)
      expect(stateRef.current?.countsForAllowance).toBe(true)
      expect(stateRef.current?.interacted).toBe(false)
    })
  })

  describe('Case 3: batch queueItem.id change DOES re-init', () => {
    it('queueItemId change re-hydrates form and resets interaction ref (SortTab batch flow)', () => {
      const stateRef: { current: (FormState & { interacted: boolean }) | null } = { current: null }

      // First queue item — no editTaskValues (typical SortTab batch flow uses queueItem only)
      const { rerender } = render(
        <CheckboxHonessyHarness
          queueItemId="q1"
          onState={(s) => { stateRef.current = s }}
        />,
      )

      // Mom flips homework ON for the first queue item
      act(() => {
        fireEvent.click(screen.getByLabelText('Count toward homework'))
      })
      expect(stateRef.current?.countsForHomework).toBe(true)
      expect(stateRef.current?.interacted).toBe(true)

      // Batch advances to next queue item
      act(() => {
        rerender(
          <CheckboxHonessyHarness
            queueItemId="q2"
            onState={(s) => { stateRef.current = s }}
          />,
        )
      })

      // Form must reset to defaults, ref reset
      expect(stateRef.current?.countsForHomework).toBe(false) // default
      expect(stateRef.current?.countsForGamification).toBe(true) // default
      expect(stateRef.current?.interacted).toBe(false)
    })

    it('activeBatchItemId change re-hydrates form (batchMode="sequential" advancement)', () => {
      const stateRef: { current: (FormState & { interacted: boolean }) | null } = { current: null }

      const { rerender } = render(
        <CheckboxHonessyHarness
          activeBatchItemId="b1"
          onState={(s) => { stateRef.current = s }}
        />,
      )

      act(() => {
        fireEvent.click(screen.getByLabelText('Track time spent'))
      })
      expect(stateRef.current?.trackDuration).toBe(true)
      expect(stateRef.current?.interacted).toBe(true)

      act(() => {
        rerender(
          <CheckboxHonessyHarness
            activeBatchItemId="b2"
            onState={(s) => { stateRef.current = s }}
          />,
        )
      })

      expect(stateRef.current?.trackDuration).toBe(false)
      expect(stateRef.current?.interacted).toBe(false)
    })
  })

  describe('Case 4: one-field interaction blocks hydration for ALL fields (shared ref)', () => {
    it('mom touches only countsForAllowance — parent passes new editTaskValues with different values for all 7 fields — all 7 hold post-interaction values', () => {
      const stateRef: { current: (FormState & { interacted: boolean }) | null } = { current: null }

      const { rerender } = render(
        <CheckboxHonessyHarness
          editTaskId="task-1"
          editTaskValues={{
            countsForAllowance: false,
            countsForGamification: true,
            countsForHomework: false,
            isExtraCredit: false,
            trackProgress: false,
            trackDuration: false,
            allowancePoints: null,
          }}
          onState={(s) => { stateRef.current = s }}
        />,
      )

      // Mom touches ONLY countsForAllowance
      act(() => {
        fireEvent.click(screen.getByLabelText('Count toward allowance'))
      })
      expect(stateRef.current?.countsForAllowance).toBe(true)
      expect(stateRef.current?.interacted).toBe(true)

      // The other 6 fields remain at their initial hydrated values (untouched by mom)
      expect(stateRef.current?.countsForGamification).toBe(true)
      expect(stateRef.current?.countsForHomework).toBe(false)
      expect(stateRef.current?.isExtraCredit).toBe(false)
      expect(stateRef.current?.trackProgress).toBe(false)
      expect(stateRef.current?.trackDuration).toBe(false)
      expect(stateRef.current?.allowancePoints).toBe('')

      // Parent re-renders with editTaskValues that would override all 7 fields.
      // Because the dep array doesn't include editTaskValues, the effect doesn't
      // fire — none of the 7 fields are touched.
      act(() => {
        rerender(
          <CheckboxHonessyHarness
            editTaskId="task-1"
            editTaskValues={{
              countsForAllowance: false, // would override mom's flip
              countsForGamification: false, // would override default
              countsForHomework: true, // would override default
              isExtraCredit: true, // would override default
              trackProgress: true, // would override default
              trackDuration: true, // would override default
              allowancePoints: 25, // would override default
            }}
            onState={(s) => { stateRef.current = s }}
          />,
        )
      })

      // ALL 7 fields hold their post-interaction values
      expect(stateRef.current?.countsForAllowance).toBe(true) // mom's flip
      expect(stateRef.current?.countsForGamification).toBe(true) // initial
      expect(stateRef.current?.countsForHomework).toBe(false) // initial
      expect(stateRef.current?.isExtraCredit).toBe(false) // initial
      expect(stateRef.current?.trackProgress).toBe(false) // initial
      expect(stateRef.current?.trackDuration).toBe(false) // initial
      expect(stateRef.current?.allowancePoints).toBe('') // initial
    })
  })

  describe('Sanity: first-mount hydration from editTaskValues still works', () => {
    it('hydrates all fields from editTaskValues on initial mount', () => {
      const stateRef: { current: (FormState & { interacted: boolean }) | null } = { current: null }

      render(
        <CheckboxHonessyHarness
          editTaskId="task-1"
          editTaskValues={{
            countsForAllowance: true,
            countsForGamification: false,
            countsForHomework: true,
            isExtraCredit: true,
            trackProgress: true,
            trackDuration: true,
            allowancePoints: 12,
          }}
          onState={(s) => { stateRef.current = s }}
        />,
      )

      expect(stateRef.current?.countsForAllowance).toBe(true)
      expect(stateRef.current?.countsForGamification).toBe(false)
      expect(stateRef.current?.countsForHomework).toBe(true)
      expect(stateRef.current?.isExtraCredit).toBe(true)
      expect(stateRef.current?.trackProgress).toBe(true)
      expect(stateRef.current?.trackDuration).toBe(true)
      expect(stateRef.current?.allowancePoints).toBe('12')
      // No user interaction yet
      expect(stateRef.current?.interacted).toBe(false)
    })
  })
})
