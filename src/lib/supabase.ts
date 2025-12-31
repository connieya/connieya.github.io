import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.GATSBY_SUPABASE_URL || 'your-supabase-url'

const supabaseAnonKey =
  process.env.GATSBY_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

// Supabase URL 유효성 검사
const isValidSupabaseUrl = (url: string): boolean => {
  if (!url || url === 'your-supabase-url') {
    return false
  }
  try {
    const urlObj = new URL(url)
    return (
      urlObj.hostname.includes('supabase.co') ||
      urlObj.hostname.includes('supabase')
    )
  } catch {
    return false
  }
}

// 유효한 URL인 경우에만 클라이언트 생성
let supabaseClient: ReturnType<typeof createClient> | null = null

if (
  isValidSupabaseUrl(supabaseUrl) &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your-supabase-anon-key'
) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Failed to create Supabase client:', error)
    supabaseClient = null
  }
} else {
  console.warn('Supabase URL or key is not properly configured')
}

export const supabase = supabaseClient

export type GuestbookEntry = {
  id: number
  name: string
  message: string
  created_at: string
}
