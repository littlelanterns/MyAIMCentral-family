/**
 * Tasks feature — cross-shell behavior tests.
 */
import { test } from '@playwright/test'

test.describe('Tasks Cross-Shell', () => {
  test.skip('Mom sees all family tasks', async () => {
    // TODO: Login as mom, verify tasks for all members visible
  })

  test.skip('Teen sees only own tasks', async () => {
    // TODO: Login as Alex, verify only Alex tasks visible
  })

  test.skip('Guided child sees simplified task view', async () => {
    // TODO: Login as Jordan, verify guided task UI
  })
})
