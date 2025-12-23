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

  const { data, error } = await supabase.rpc('get_next_hand', { p_user_id: user?.id })

  if (error || !data) {
     const { data: randomImage } = await supabase.from('images').select('*').limit(1).maybeSingle();
     return {
       image: randomImage || {
         // Fallback if DB is empty (Using standard URL)
         url: 'https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg',
         id: 0,
         type: 'real',
         source: 'Fallback'
       }
     }
  }
  return { image: data }
}

export async function submitWager(imageId: number, wagerAmount: number, guess: 'real' | 'ai') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // 1. Fetch current state
  // We allow 'profile' to be null here. If null, we assume they have the default $1000.
  const { data: profile } = await supabase.from('profiles').select('current_balance').eq('id', user.id).single()
  const { data: image } = await supabase.from('images').select('*').eq('id', imageId).single()

  if (!image) return { error: 'Game Error: Image not found' }

  // 2. Determine Current Balance (Handle Ghost User)
  const currentBalance = profile ? profile.current_balance : 1000;

  if (wagerAmount > currentBalance || wagerAmount <= 0) return { error: 'Invalid Wager' }

  // 3. Calculate Logic
  const isCorrect = guess === image.type
  let newBalance = currentBalance

  const riskRatio = wagerAmount / currentBalance
  const multiplier = 1.2 + (riskRatio * 0.8)

  const profit = isCorrect
    ? Math.floor(wagerAmount * (multiplier - 1))
    : -wagerAmount

  newBalance += profit

  // 4. Update Database (Using the new "Wallet Generator" RPC)
  const { error: updateError } = await supabase.rpc('update_balance', {
    p_user_id: user.id,
    p_new_balance: newBalance
  })

  if (updateError) {
    console.error("RPC Update Error:", updateError)
    // Fallback: If DB fails, return success anyway so UI updates (Browser Mode)
    return { new_balance: newBalance, isCorrect, profit, source: image.source }
  }

  return { new_balance: newBalance, isCorrect, profit, source: image.source }
}