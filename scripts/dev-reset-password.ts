import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function reset() {
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find(u => u.email === 'dev@myaimcentral.test')

  if (!user) {
    console.error('User not found')
    process.exit(1)
  }

  console.log('User found:', user.id)
  console.log('Email confirmed:', user.email_confirmed_at ? 'yes' : 'NO')

  // Force update password and confirm email
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: 'devtest123',
    email_confirm: true,
  })

  if (error) {
    console.error('Failed:', error.message)
    process.exit(1)
  }

  console.log('Password reset and email confirmed.')
  console.log('\nSign in with:')
  console.log('  Email:    dev@myaimcentral.test')
  console.log('  Password: devtest123')
}

reset().catch(console.error)
