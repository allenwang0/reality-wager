'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper to create server client (NOW ASYNC)
async function createClient() {
  const cookieStore = await cookies() // <--- FIXED: Added await here

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignored
          }
        },
      },
    }
  )
}

export async function getNextHand() {
  const supabase = await createClient() // <--- FIXED: Added await here

  const { data: { user } } = await supabase.auth.getUser()

  // If no user, just return a random image (Anonymous play)
  // In a real app, you might want to force login here

  // Get random image
  const { data, error } = await supabase.rpc('get_next_hand', {
    p_user_id: user?.id
  })

  // Fallback for anonymous users or if RPC fails (Just grab from images table directly)
  if (error || !data) {
     const { data: randomImage } = await supabase
       .from('images')
       .select('*')
       .limit(1)
       .maybeSingle(); // Use maybeSingle to prevent crashes if DB is empty

     return { image: randomImage || { url: '/assets/game/1.jpg', id: 0 } }
  }

  return { image: data }
}

export async function submitWager(imageId: number, wagerIdx: number, guess: 'real' | 'ai') {
  const supabase = await createClient() // <--- FIXED: Added await here

  const { data, error } = await supabase.rpc('submit_wager', {
    p_image_id: imageId,
    p_wager_idx: wagerIdx,
    p_guess: guess
  })

  if (error) {
    console.error("RPC Error:", error)
    return { error: 'Transaction Failed' }
  }

  return data
}