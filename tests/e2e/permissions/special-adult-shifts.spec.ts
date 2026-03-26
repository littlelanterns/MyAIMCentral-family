/**
 * Special Adult (Grandma) permission tests.
 * Placeholder — will be expanded as PRD-02 shift features are wired.
 */
import { test } from '@playwright/test'

test.describe('Special Adult Shift Access', () => {
  test.skip('Grandma can only see assigned children', async () => {
    // TODO: Login as grandma, verify only Alex and Jordan visible
  })

  test.skip('Grandma cannot access unassigned children', async () => {
    // TODO: Verify Casey and Riley are not accessible
  })
})
