import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.GATSBY_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey =
  process.env.GATSBY_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type GuestbookEntry = {
  id: number
  name: string
  message: string
  created_at: string
}
