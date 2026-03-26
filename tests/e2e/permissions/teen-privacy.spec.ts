/**
 * Teen privacy tests.
 * Placeholder — will verify journal privacy, safe harbor isolation, etc.
 */
import { test } from '@playwright/test'

test.describe('Teen Privacy Controls', () => {
  test.skip('Casey private journal entries not visible to mom', async () => {
    // TODO: Casey has journal privacy granted
  })

  test.skip('Alex journal entries visible to mom', async () => {
    // TODO: Alex does NOT have journal privacy
  })

  test.skip('Teen cannot see other members tasks', async () => {
    // TODO: Alex should only see own tasks
  })
})
