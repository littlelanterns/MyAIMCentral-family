/**
 * LiLa AI access tests — verifies drawer vs modal per shell.
 */
import { test } from '@playwright/test'

test.describe('LiLa Access Patterns', () => {
  test.skip('Mom gets LiLa in a bottom drawer', async () => {
    // TODO: Login as mom, trigger LiLa, verify drawer behavior
  })

  test.skip('Teen gets LiLa in a modal', async () => {
    // TODO: Login as Alex, trigger LiLa, verify modal behavior
  })

  test.skip('LiLa not available in Play shell unless configured', async () => {
    // TODO: Login as Riley, verify no LiLa trigger
  })
})
