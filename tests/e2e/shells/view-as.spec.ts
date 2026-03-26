/**
 * View As tests — mom viewing other members' shells.
 */
import { test } from '@playwright/test'

test.describe('View As Mode', () => {
  test.skip('Mom can activate View As for a family member', async () => {
    // TODO: Trigger View As, verify banner appears
  })

  test.skip('View As renders the target member shell', async () => {
    // TODO: Verify correct shell renders inside the overlay
  })

  test.skip('Exit View As returns to mom shell', async () => {
    // TODO: Click exit, verify mom shell restored
  })
})
