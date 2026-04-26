/**
 * Worker ROUTINE-PROPAGATION (c5) — ScheduledStartBadge.
 *
 * Renders only when dtstart > today. Same-day or past dtstart returns
 * null. NULL/undefined dtstart returns null.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ScheduledStartBadge } from '@/components/templates/ScheduledStartBadge'

// Freeze "today" to 2026-05-15 for deterministic comparisons.
beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 4, 15, 12, 0, 0)) // 2026-05-15 12:00 local
})
afterAll(() => {
  vi.useRealTimers()
})

describe('ScheduledStartBadge', () => {
  it('renders nothing when dtstart is null', () => {
    const { container } = render(<ScheduledStartBadge dtstart={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when dtstart is undefined', () => {
    const { container } = render(<ScheduledStartBadge dtstart={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when dtstart equals today', () => {
    const { container } = render(<ScheduledStartBadge dtstart="2026-05-15" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when dtstart is in the past', () => {
    const { container } = render(<ScheduledStartBadge dtstart="2026-04-01" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the badge when dtstart is in the future', () => {
    const { container, getByTitle } = render(
      <ScheduledStartBadge dtstart="2026-06-15" />,
    )
    expect(container.firstChild).not.toBeNull()
    // Title attr always reads "Starts [Date]" regardless of size.
    expect(getByTitle(/Starts/)).toBeTruthy()
  })

  it('full size shows "Scheduled to start [date]"', () => {
    const { getByText } = render(
      <ScheduledStartBadge dtstart="2026-06-15" size="full" />,
    )
    expect(getByText(/Scheduled to start/i)).toBeTruthy()
  })

  it('compact size shows just the date', () => {
    const { container } = render(
      <ScheduledStartBadge dtstart="2026-06-15" size="compact" />,
    )
    expect(container.textContent).not.toMatch(/Scheduled to start/)
  })

  it('handles full ISO timestamps with T', () => {
    const { container } = render(
      <ScheduledStartBadge dtstart="2026-06-15T08:00:00Z" />,
    )
    expect(container.firstChild).not.toBeNull()
  })
})
