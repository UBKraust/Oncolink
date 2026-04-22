import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createDevUser() {
  const email = 'terapeut@oncolink.ro'
  const password = 'parola1234'

  console.log(`Creating user: ${email}...`)

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('User already exists. Attempting to update password...')
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        // We'd need the ID to update, but signup failure is fine if it exists.
        'existing', 
        { password }
      ).catch(() => ({ error: { message: 'Need ID to update' } }))
      
      console.log('User already exists. You can log in with:');
    } else {
      console.error('Error creating user:', error.message)
      return
    }
  } else {
    console.log('User created successfully!')
  }

  console.log('\n--- DEV CREDENTIALS ---')
  console.log(`Email:    ${email}`)
  console.log(`Password: ${password}`)
  console.log('-----------------------\n')
}

createDevUser()
