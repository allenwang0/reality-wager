'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper to create server client
async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
      },
    }
  )
}

export async function getNextHand() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Try to use the RPC if it exists, otherwise fallback to direct table query
  const { data, error } = await supabase.rpc('get_next_hand', { p_user_id: user?.id })

  // If RPC fails or returns nothing (e.g., function not created), fetch manually
  if (error || !data) {
     // Fetch ANY image from the images table
     const { data: randomImage } = await supabase
       .from('images')
       .select('*')
       .limit(1)
       .maybeSingle();

     // Fallback if DB is completely empty
     return {
       image: randomImage || {
         url: 'https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg',
         id: 0,
         type: 'real'
       }
     }
  }
  return { image: data }
}

export async function submitWager(imageId: number, wagerAmount: number, guess: 'real' | 'ai') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // 1. Fetch current state securely
  const { data: profile } = await supabase.from('profiles').select('current_balance').eq('id', user.id).single()
  const { data: image } = await supabase.from('images').select('*').eq('id', imageId).single()

  if (!profile || !image) return { error: 'Game Error: Missing Profile or Image' }
  if (wagerAmount > profile.current_balance || wagerAmount <= 0) return { error: 'Invalid Wager' }

  // 2. Calculate Logic
  const isCorrect = guess === image.type
  let newBalance = profile.current_balance

  // Dynamic Multiplier Calculation
  const riskRatio = wagerAmount / profile.current_balance
  const multiplier = 1.2 + (riskRatio * 0.8)

  const profit = isCorrect
    ? Math.floor(wagerAmount * (multiplier - 1))
    : -wagerAmount

  newBalance += profit

  // 3. Update Database using the SECURE ADMIN FUNCTION (Bypasses RLS)
  const { error: updateError } = await supabase.rpc('update_balance', {
    p_user_id: user.id,
    p_new_balance: newBalance
  })

  if (updateError) {
    console.error("RPC Update Error:", updateError)
    return { error: 'Database Update Failed' }
  }

  return { new_balance: newBalance, isCorrect, profit, source: image.source }
}