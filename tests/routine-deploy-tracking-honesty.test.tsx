/**
 * RoutineDeployModal — tracking-flag honesty.
 *
 * The invariant: in create mode, the modal hydrates `counts_for_allowance`,
 * `counts_for_gamification`, `counts_for_homework`, and `allowance_points`
 * from the template's defaults AFTER the modal mounts (async fetch). The
 * bug: if mom flipped a checkbox while the fetch was still in flight, the
 * late-arriving template defaults silently overwrote her input. The fix
 * adds a `hasUserInteracted` ref — once true, the hydration bails entirely
 * and mom's visible value wins.
 *
 * This file tests the exact ref+effect+state shape that RoutineDeployModal
 * uses. A focused harness — same pattern as task-creation-modal-save-error.test.tsx
 * (which explicitly chose a harness over rendering the 2700-line modal because
 * of context-provider sprawl). Here, RoutineDeployModal pulls in 7+ hooks
 * (useFamily, useFamilyMembers, useFamilyMember, useMemberAllowancePools,
 * useRoutingToast, useQueryClient, supabase client) plus 5 child components
 * (ModalV2, MemberPillSelector, PickDatesCalendar, RoutineOverlapResolutionModal,
 * ToggleRow) — every one of which would need a mock to render. The harness
 * lets us test the actual invariant — "once mom interacts, the late fetch
 * cannot overwrite her" — without the mock-tree sprawl.
 *
 * Covers all 4 fields the prior worker fixed:
 *   - counts_for_allowance
 *   - counts_for_gamification
 *   - counts_for_homework
 *   - allowance_points
 */

import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen, act } from '@testing-library/react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Harness ────────────────────────────────────────────────────────────
//
// Mirrors RoutineDeployModal.tsx lines 134–192 exactly:
//   - 4 useState hooks (countsForAllowance/Gamification/Homework + allowancePoints)
//   - 1 useRef hook (trackingInteractedRef)
//   - 4 setter wrappers that flip the ref true
//   - 1 useEffect that fetches template defaults and only writes if !ref.current
//
// `fetchTemplate` is the async dep — tests inject a controllable promise to
// race against user interaction.

interface HarnessProps {
  templateId: string
  initialAllowance?: boolean
  initialGamification?: boolean
  initialHomework?: boolean
  initialPoints?: string
  /**
   * Returns the template defaults that the modal's effect would hydrate
   * from. Tests pass a deferred promise to race against user input.
   */
  fetchTemplate: (id: string) => Promise<{
    counts_for_allowance: boolean | null
    counts_for_gamification: boolean | null
    counts_for_homework: boolean | null
    allowance_points: number | null
  } | null>
  /** Spy hook so tests can read the current state after interactions. */
  onState: (s: {
    countsForAllowance: boolean
    countsForGamification: boolean
    countsForHomework: boolean
    allowancePoints: string
    interacted: boolean
  }) => void
}

function TrackingHarness({
  templateId,
  initialAllowance = true,
  initialGamification = true,
  initialHomework = false,
  initialPoints = '',
  fetchTemplate,
  onState,
}: HarnessProps) {
  const [countsForAllowance, setCountsForAllowance] = useState(initialAllowance)
  const [countsForGamification, setCountsForGamification] = useState(initialGamification)
  const [countsForHomework, setCountsForHomework] = useState(initialHomework)
  const [allowancePoints, setAllowancePoints] = useState<string>(initialPoints)

  const trackingInteractedRef = useRef(false)

  const handleSetCountsForAllowance = useCallback((v: boolean) => {
    trackingInteractedRef.current = true
    setCountsForAllowance(v)
  }, [])
  const handleSetCountsForGamification = useCallback((v: boolean) => {
    trackingInteractedRef.current = true
    setCountsForGamification(v)
  }, [])
  const handleSetCountsForHomework = useCallback((v: boolean) => {
    trackingInteractedRef.current = true
    setCountsForHomework(v)
  }, [])
  const handleSetAllowancePoints = useCallback((v: string) => {
    trackingInteractedRef.current = true
    setAllowancePoints(v)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const data = await fetchTemplate(templateId)
      if (cancelled || !data) return
      if (trackingInteractedRef.current) return
      if (data.counts_for_allowance != null) setCountsForAllowance(data.counts_for_allowance)
      if (data.counts_for_gamification != null) setCountsForGamification(data.counts_for_gamification)
      if (data.counts_for_homework != null) setCountsForHomework(data.counts_for_homework)
      if (data.allowance_points != null) setAllowancePoints(String(data.allowance_points))
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  // Spy out current state after every render
  useEffect(() => {
    onState({
      countsForAllowance,
      countsForGamification,
      countsForHomework,
      allowancePoints,
      interacted: trackingInteractedRef.current,
    })
  })

  return (
    <div data-testid="harness">
      <label>
        <input
          type="checkbox"
          checked={countsForAllowance}
          onChange={e => handleSetCountsForAllowance(e.target.checked)}
          aria-label="Count toward allowance"
        />
        Count toward allowance
      </label>
      <label>
        <input
          type="checkbox"
          checked={countsForGamification}
          onChange={e => handleSetCountsForGamification(e.target.checked)}
          aria-label="Count toward gamification"
        />
        Count toward gamification
      </label>
      <label>
        <input
          type="checkbox"
          checked={countsForHomework}
          onChange={e => handleSetCountsForHomework(e.target.checked)}
          aria-label="Count toward homework"
        />
        Count toward homework
      </label>
      <label>
        <input
          type="number"
          value={allowancePoints}
          onChange={e => handleSetAllowancePoints(e.target.value)}
          aria-label="Points override"
        />
      </label>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Deferred promise — lets tests resolve the template fetch on demand. */
function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('RoutineDeployModal — tracking-flag honesty (hasUserInteracted ref)', () => {
  describe('race-condition: user flips checkbox BEFORE template fetch resolves', () => {
    it('counts_for_allowance: user-off must NOT be overwritten by template-on', async () => {
      const fetchD = deferred<{
        counts_for_allowance: boolean | null
        counts_for_gamification: boolean | null
        counts_for_homework: boolean | null
        allowance_points: number | null
      } | null>()
      const stateRef = { current: null as Parameters<HarnessProps['onState']>[0] | null }

      render(
        <TrackingHarness
          templateId="t1"
          initialAllowance={true}
          fetchTemplate={() => fetchD.promise}
          onState={s => { stateRef.current = s }}
        />,
      )

      // Mom flips OFF before fetch resolves
      const allowanceBox = screen.getByLabelText('Count toward allowance') as HTMLInputElement
      expect(allowanceBox.checked).toBe(true)
      fireEvent.click(allowanceBox)
      expect(allowanceBox.checked).toBe(false)
      expect(stateRef.current?.interacted).toBe(true)

      // Now template fetch resolves with allowance=true (the would-be overwrite)
      await act(async () => {
        fetchD.resolve({
          counts_for_allowance: true,
          counts_for_gamification: true,
          counts_for_homework: true,
          allowance_points: 5,
        })
        await Promise.resolve()
        await Promise.resolve()
      })

      // Mom's OFF must still hold
      expect(allowanceBox.checked).toBe(false)
      expect(stateRef.current?.countsForAllowance).toBe(false)
    })

    it('counts_for_gamification: user-off must NOT be overwritten by template-on', async () => {
      const fetchD = deferred<{
        counts_for_allowance: boolean | null
        counts_for_gamification: boolean | null
        counts_for_homework: boolean | null
        allowance_points: number | null
      } | null>()
      const stateRef = { current: null as Parameters<HarnessProps['onState']>[0] | null }

      render(
        <TrackingHarness
          templateId="t2"
          initialGamification={true}
          fetchTemplate={() => fetchD.promise}
          onState={s => { stateRef.current = s }}
        />,
      )

      const gamificationBox = screen.getByLabelText('Count toward gamification') as HTMLInputElement
      fireEvent.click(gamificationBox)
      expect(gamificationBox.checked).toBe(false)

      await act(async () => {
        fetchD.resolve({
          counts_for_allowance: true,
          counts_for_gamification: true, // would overwrite mom's OFF
          counts_for_homework: false,
          allowance_points: null,
        })
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(gamificationBox.checked).toBe(false)
      expect(stateRef.current?.countsForGamification).toBe(false)
    })

    it('counts_for_homework: user-on must NOT be overwritten by template-off', async () => {
      const fetchD = deferred<{
        counts_for_allowance: boolean | null
        counts_for_gamification: boolean | null
        counts_for_homework: boolean | null
        allowance_points: number | null
      } | null>()
      const stateRef = { current: null as Parameters<HarnessProps['onState']>[0] | null }

      render(
        <TrackingHarness
          templateId="t3"
          initialHomework={false}
          fetchTemplate={() => fetchD.promise}
          onState={s => { stateRef.current = s }}
        />,
      )

      const homeworkBox = screen.getByLabelText('Count toward homework') as HTMLInputElement
      fireEvent.click(homeworkBox)
      expect(homeworkBox.checked).toBe(true)

      await act(async () => {
        fetchD.resolve({
          counts_for_allowance: false,
          counts_for_gamification: true,
          counts_for_homework: false, // would overwrite mom's ON
          allowance_points: null,
        })
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(homeworkBox.checked).toBe(true)
      expect(stateRef.current?.countsForHomework).toBe(true)
    })

    it('allowance_points: user value must NOT be overwritten by template default', async () => {
      const fetchD = deferred<{
        counts_for_allowance: boolean | null
        counts_for_gamification: boolean | null
        counts_for_homework: boolean | null
        allowance_points: number | null
      } | null>()
      const stateRef = { current: null as Parameters<HarnessProps['onState']>[0] | null }

      render(
        <TrackingHarness
          templateId="t4"
          initialPoints=""
          fetchTemplate={() => fetchD.promise}
          onState={s => { stateRef.current = s }}
        />,
      )

      const pointsInput = screen.getByLabelText('Points override') as HTMLInputElement
      fireEvent.change(pointsInput, { target: { value: '12' } })
      expect(pointsInput.value).toBe('12')

      await act(async () => {
        fetchD.resolve({
          counts_for_allowance: true,
          counts_for_gamification: true,
          counts_for_homework: false,
          allowance_points: 99, // would overwrite mom's 12
        })
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(pointsInput.value).toBe('12')
      expect(stateRef.current?.allowancePoints).toBe('12')
    })

    it('one-field interaction blocks hydration for ALL fields (ref is shared)', async () => {
      const fetchD = deferred<{
        counts_for_allowance: boolean | null
        counts_for_gamification: boolean | null
        counts_for_homework: boolean | null
        allowance_points: number | null
      } | null>()
      const stateRef = { current: null as Parameters<HarnessProps['onState']>[0] | null }

      render(
        <TrackingHarness
          templateId="t5"
          initialAllowance={false}
          initialGamification={false}
          initialHomework={false}
          initialPoints=""
          fetchTemplate={() => fetchD.promise}
          onState={s => { stateRef.current = s }}
        />,
      )

      // Mom only touches ONE field (allowance) — the other 3 remain at their
      // initial values. The shared ref is now true.
      const allowanceBox = screen.getByLabelText('Count toward allowance') as HTMLInputElement
      fireEvent.click(allowanceBox)
      expect(allowanceBox.checked).toBe(true)

      // Template fetch resolves with values that would override all 4 fields.
      // Because the ref is now true, NONE should be hydrated.
      await act(async () => {
        fetchD.resolve({
          counts_for_allowance: false, // would override mom's ON
          counts_for_gamification: true, // would override default OFF
          counts_for_homework: true, // would override default OFF
          allowance_points: 25, // would override default ""
        })
        await Promise.resolve()
        await Promise.resolve()
      })

      // All fields stay at the post-interaction visible state.
      expect(stateRef.current?.countsForAllowance).toBe(true) // mom's flip
      expect(stateRef.current?.countsForGamification).toBe(false) // initial, untouched
      expect(stateRef.current?.countsForHomework).toBe(false) // initial, untouched
      expect(stateRef.current?.allowancePoints).toBe('') // initial, untouched
    })
  })

  describe('happy-path: user does NOT interact before fetch — template defaults DO hydrate', () => {
    it('all 4 fields hydrate from template when ref is still false', async () => {
      const fetchD = deferred<{
        counts_for_allowance: boolean | null
        counts_for_gamification: boolean | null
        counts_for_homework: boolean | null
        allowance_points: number | null
      } | null>()
      const stateRef = { current: null as Parameters<HarnessProps['onState']>[0] | null }

      render(
        <TrackingHarness
          templateId="t6"
          initialAllowance={false}
          initialGamification={false}
          initialHomework={false}
          initialPoints=""
          fetchTemplate={() => fetchD.promise}
          onState={s => { stateRef.current = s }}
        />,
      )

      // Initial state — no interaction yet
      expect(stateRef.current?.interacted).toBe(false)

      // Template fetch resolves
      await act(async () => {
        fetchD.resolve({
          counts_for_allowance: true,
          counts_for_gamification: true,
          counts_for_homework: true,
          allowance_points: 7,
        })
        await Promise.resolve()
        await Promise.resolve()
      })

      // All 4 fields hydrated from the template
      expect(stateRef.current?.countsForAllowance).toBe(true)
      expect(stateRef.current?.countsForGamification).toBe(true)
      expect(stateRef.current?.countsForHomework).toBe(true)
      expect(stateRef.current?.allowancePoints).toBe('7')

      // After hydration, mom can still flip — but the ref didn't fire on the
      // automatic hydration writes (only on the wrapped setters).
      expect(stateRef.current?.interacted).toBe(false)
    })

    it('null fields in template do NOT clobber state (skip-when-null guard)', async () => {
      const fetchD = deferred<{
        counts_for_allowance: boolean | null
        counts_for_gamification: boolean | null
        counts_for_homework: boolean | null
        allowance_points: number | null
      } | null>()
      const stateRef = { current: null as Parameters<HarnessProps['onState']>[0] | null }

      render(
        <TrackingHarness
          templateId="t7"
          initialAllowance={true}
          initialGamification={true}
          initialHomework={true}
          initialPoints="3"
          fetchTemplate={() => fetchD.promise}
          onState={s => { stateRef.current = s }}
        />,
      )

      // Template returns null for every tracking field — defaults stay
      await act(async () => {
        fetchD.resolve({
          counts_for_allowance: null,
          counts_for_gamification: null,
          counts_for_homework: null,
          allowance_points: null,
        })
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(stateRef.current?.countsForAllowance).toBe(true)
      expect(stateRef.current?.countsForGamification).toBe(true)
      expect(stateRef.current?.countsForHomework).toBe(true)
      expect(stateRef.current?.allowancePoints).toBe('3')
    })
  })

  describe('user interaction AFTER hydration still wins (post-fetch flip)', () => {
    it('mom flips a hydrated checkbox — final state matches her flip', async () => {
      const fetchD = deferred<{
        counts_for_allowance: boolean | null
        counts_for_gamification: boolean | null
        counts_for_homework: boolean | null
        allowance_points: number | null
      } | null>()
      const stateRef = { current: null as Parameters<HarnessProps['onState']>[0] | null }

      render(
        <TrackingHarness
          templateId="t8"
          initialAllowance={false}
          fetchTemplate={() => fetchD.promise}
          onState={s => { stateRef.current = s }}
        />,
      )

      // Template fetch resolves first
      await act(async () => {
        fetchD.resolve({
          counts_for_allowance: true,
          counts_for_gamification: true,
          counts_for_homework: false,
          allowance_points: null,
        })
        await Promise.resolve()
        await Promise.resolve()
      })

      const allowanceBox = screen.getByLabelText('Count toward allowance') as HTMLInputElement
      expect(allowanceBox.checked).toBe(true) // hydrated from template

      // Mom flips OFF post-hydration
      fireEvent.click(allowanceBox)
      expect(allowanceBox.checked).toBe(false)
      expect(stateRef.current?.countsForAllowance).toBe(false)
      expect(stateRef.current?.interacted).toBe(true)
    })
  })

  describe('component unmount mid-fetch does NOT leak setState', () => {
    it('cancelled fetch does not trigger state update after unmount', async () => {
      const fetchD = deferred<{
        counts_for_allowance: boolean | null
        counts_for_gamification: boolean | null
        counts_for_homework: boolean | null
        allowance_points: number | null
      } | null>()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { unmount } = render(
        <TrackingHarness
          templateId="t9"
          fetchTemplate={() => fetchD.promise}
          onState={() => {}}
        />,
      )

      // Unmount BEFORE the fetch resolves
      unmount()

      await act(async () => {
        fetchD.resolve({
          counts_for_allowance: true,
          counts_for_gamification: true,
          counts_for_homework: true,
          allowance_points: 1,
        })
        await Promise.resolve()
        await Promise.resolve()
      })

      // The `cancelled` flag in the effect's cleanup means the post-await
      // branch should bail. React would emit a console.error if it tried to
      // setState on an unmounted component.
      const setStateWarnings = consoleErrorSpy.mock.calls.filter(call => {
        const msg = String(call[0] ?? '')
        return msg.includes('unmounted') || msg.includes('memory leak')
      })
      expect(setStateWarnings.length).toBe(0)

      consoleErrorSpy.mockRestore()
    })
  })
})
