import { describe, it, expect } from 'vitest'

describe('Supabase Connection', () => {
  it('should have VITE_SUPABASE_URL pattern in env template', async () => {
    const fs = await import('fs')
    const template = fs.readFileSync('.env.template', 'utf-8')
    expect(template).toContain('VITE_SUPABASE_URL')
    expect(template).toContain('VITE_SUPABASE_ANON_KEY')
  })

  it('should have migration files', async () => {
    const fs = await import('fs')
    const files = fs.readdirSync('supabase/migrations')
    expect(files.length).toBeGreaterThanOrEqual(2)
    expect(files.some(f => f.includes('extensions_and_infrastructure'))).toBe(true)
    expect(files.some(f => f.includes('auth_family_setup'))).toBe(true)
  })
})
