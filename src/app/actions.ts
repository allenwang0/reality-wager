'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Helper to create server client
function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}

export async function getNextHand() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Get random image
  const { data } = await supabase.from('images').select('*').limit(1).single() // Simplified for demo
  return { image: data }
}

export async function submitWager(imageId: number, wagerIdx: number, guess: 'real' | 'ai') {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('submit_wager', {
    p_image_id: imageId,
    p_wager_idx: wagerIdx,
    p_guess: guess
  })
  return data
}