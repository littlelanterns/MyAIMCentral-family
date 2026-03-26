/**
 * Cross-family isolation tests.
 * Placeholder — will verify RLS prevents cross-family data access.
 */
import { test } from '@playwright/test'

test.describe('Cross-Family Isolation', () => {
  test.skip('Family A cannot see Family B data', async () => {
    // TODO: Create a second test family, verify no data leaks
  })
})
