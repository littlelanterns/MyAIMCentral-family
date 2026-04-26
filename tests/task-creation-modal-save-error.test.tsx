/**
 * Worker ROUTINE-SAVE-FIX (c2) — error-toast surfacing on save failure.
 *
 * Three layers of verification:
 *
 * 1. UndoToast variant='error' rendering — confirms the error variant
 *    uses role='alert' + aria-live='assertive', shows the alert icon,
 *    and auto-dismisses at 10s (success default is 5s).
 *
 * 2. RoutingToastProvider end-to-end — confirms `routingToast.show({
 *    message, variant: 'error' })` reaches the DOM as an error toast.
 *
 * 3. Save-handler catch contract — TaskCreationModal's handleSave,
 *    handleSaveToStudio, and handleEditConfirm all share a catch
 *    block that (a) console.errors the original error, (b) fires an
 *    error toast with the exact user-facing copy, and (c) does NOT
 *    close the modal. Rather than rendering the 2700-line modal
 *    (which depends on many context providers), we exercise the
 *    contract via a focused harness that mirrors the catch shape
 *    exactly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  RoutingToastProvider,
  useRoutingToast,
} from '@/components/shared/RoutingToastProvider'
import { UndoToast } from '@/components/shared/UndoToast'
import { useCallback, useState } from 'react'

// ─── Layer 1: UndoToast variant='error' rendering ───────────────────────

describe('UndoToast variant', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("default 'success' variant uses role='status' and primary border", () => {
    render(
      <MemoryRouter>
        <UndoToast message="Saved" onDismiss={() => {}} />
      </MemoryRouter>,
    )
    const toast = screen.getByRole('status')
    expect(toast).toBeInTheDocument()
    expect(toast.getAttribute('aria-live')).toBe('polite')
  })

  it("variant='error' uses role='alert' + aria-live='assertive' + alert icon", () => {
    const { container } = render(
      <MemoryRouter>
        <UndoToast
          message="Save failed"
          variant="error"
          onDismiss={() => {}}
        />
      </MemoryRouter>,
    )
    const toast = screen.getByRole('alert')
    expect(toast).toBeInTheDocument()
    expect(toast.getAttribute('aria-live')).toBe('assertive')
    // AlertTriangle icon renders as an svg inside the toast container
    expect(container.querySelector('svg.lucide-triangle-alert, svg.lucide-alert-triangle')).toBeTruthy()
  })

  it('error variant defaults to 10s dwell (vs 5s for success)', () => {
    const dismissSpy = vi.fn()
    render(
      <MemoryRouter>
        <UndoToast message="Save failed" variant="error" onDismiss={dismissSpy} />
      </MemoryRouter>,
    )
    // Advance 5s — success-toast duration. Should NOT have dismissed.
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(dismissSpy).not.toHaveBeenCalled()

    // Advance to 10s total. Should have dismissed by now.
    act(() => {
      vi.advanceTimersByTime(5_500)
    })
    expect(dismissSpy).toHaveBeenCalled()
  })

  it('explicit duration prop overrides variant default', () => {
    const dismissSpy = vi.fn()
    render(
      <MemoryRouter>
        <UndoToast
          message="custom"
          variant="error"
          duration={2_000}
          onDismiss={dismissSpy}
        />
      </MemoryRouter>,
    )
    act(() => {
      vi.advanceTimersByTime(2_500)
    })
    expect(dismissSpy).toHaveBeenCalled()
  })
})

// ─── Layer 2: RoutingToastProvider end-to-end ───────────────────────────

function ToastTrigger({ message }: { message: string }) {
  const toast = useRoutingToast()
  return (
    <button onClick={() => toast.show({ message, variant: 'error' })}>
      Trigger
    </button>
  )
}

describe('RoutingToastProvider variant threading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('routingToast.show({ variant: "error" }) renders an error toast', () => {
    render(
      <MemoryRouter>
        <RoutingToastProvider>
          <ToastTrigger message="Couldn't save changes." />
        </RoutingToastProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('Trigger'))
    const toast = screen.getByRole('alert')
    expect(toast).toBeInTheDocument()
    expect(toast.textContent).toContain("Couldn't save changes.")
  })
})

// ─── Layer 3: Save-handler catch contract harness ───────────────────────
//
// SaveHarness mirrors TaskCreationModal.handleSave's catch shape exactly.
// On reject, it must:
//   1. console.error the original error
//   2. fire an error toast with the exact user-facing copy
//   3. NOT close the modal (modalOpen stays true)
//
// This is the same try { … } catch { … } block that's added to
// handleSave, handleSaveToStudio, and handleEditConfirm in this commit.

const ERROR_COPY = "Couldn't save changes. Please try again or contact support."

interface SaveHarnessProps {
  onSave: () => Promise<void>
  onClose: () => void
}

function SaveHarness({ onSave, onClose }: SaveHarnessProps) {
  const routingToast = useRoutingToast()
  const showErrorToast = useCallback(
    (message: string) => {
      routingToast.show({ message, variant: 'error' })
    },
    [routingToast],
  )
  const [loading, setLoading] = useState(false)

  const handleSave = useCallback(async () => {
    setLoading(true)
    try {
      await onSave()
      onClose()
    } catch (err) {
      console.error('Routine save failed:', err)
      showErrorToast(ERROR_COPY)
    } finally {
      setLoading(false)
    }
  }, [onSave, onClose, showErrorToast])

  return (
    <div data-testid="modal">
      <button onClick={handleSave} disabled={loading}>
        Save Changes
      </button>
    </div>
  )
}

describe('save-handler catch contract', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('on reject: fires error toast with exact user-facing copy', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('test failure'))
    const onClose = vi.fn()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <MemoryRouter>
        <RoutingToastProvider>
          <SaveHarness onSave={onSave} onClose={onClose} />
        </RoutingToastProvider>
      </MemoryRouter>,
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'))
      // Flush the rejected promise's microtask queue.
      await Promise.resolve()
      await Promise.resolve()
    })

    const toast = screen.getByRole('alert')
    expect(toast.textContent).toContain(ERROR_COPY)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Routine save failed:',
      expect.any(Error),
    )
    const errorArg = consoleErrorSpy.mock.calls[0][1] as Error
    expect(errorArg.message).toBe('test failure')
  })

  it('on reject: modal stays open (onClose NOT called)', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('test failure'))
    const onClose = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <MemoryRouter>
        <RoutingToastProvider>
          <SaveHarness onSave={onSave} onClose={onClose} />
        </RoutingToastProvider>
      </MemoryRouter>,
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('on success: NO error toast, modal closes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()

    render(
      <MemoryRouter>
        <RoutingToastProvider>
          <SaveHarness onSave={onSave} onClose={onClose} />
        </RoutingToastProvider>
      </MemoryRouter>,
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.queryByRole('alert')).toBeNull()
    expect(onClose).toHaveBeenCalledOnce()
  })
})
