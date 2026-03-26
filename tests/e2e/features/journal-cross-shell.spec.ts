/**
 * Journal feature — cross-shell behavior tests.
 */
import { test } from '@playwright/test'

test.describe('Journal Cross-Shell', () => {
  test.skip('Mom can access journal page', async () => {
    // TODO: Login as mom, verify journal renders
  })

  test.skip('Teen can write journal entries', async () => {
    // TODO: Login as Alex, verify journal page accessible
  })

  test.skip('Journal entries respect visibility settings', async () => {
    // TODO: Verify private/shared/family visibility
  })
})
