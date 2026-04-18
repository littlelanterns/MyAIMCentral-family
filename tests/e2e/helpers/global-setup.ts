/**
 * Global setup for Playwright E2E tests.
 * Runs once before the entire test suite.
 * Seeds "The Testworth Family" test family via Supabase service role.
 */
import { seedTestworthFamily } from './seed-testworths-complete'

export default async function globalSetup() {
  console.log('\n🧪 Running global setup: seeding test family...')

  try {
    await seedTestworthFamily()
    console.log('✅ Test family "The Testworth Family" ready\n')
  } catch (error) {
    console.error('❌ Failed to seed test family:', error)
    // Don't throw — let tests run even if seeding fails
    // Individual tests will fail with clear auth errors
    console.warn('⚠️  Tests will run but auth-dependent tests will fail\n')
  }
}
