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
     return { image: randomImage || { url: '/assets/game/1.jpg', id: 0, type: 'real' } }
  }
  return { image: data }
}

// NEW: Accepts exact wager amount instead of index
export async function submitWager(imageId: number, wagerAmount: number, guess: 'real' | 'ai') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // 1. Fetch current state securely
  const { data: profile } = await supabase.from('profiles').select('current_balance').eq('id', user.id).single()
  const { data: image } = await supabase.from('images').select('*').eq('id', imageId).single()

  if (!profile || !image) return { error: 'Game Error' }
  if (wagerAmount > profile.current_balance || wagerAmount <= 0) return { error: 'Invalid Wager' }

  // 2. Calculate Logic
  const isCorrect = guess === image.type
  let newBalance = profile.current_balance

  // Dynamic Multiplier:
  // 1% Bet = 1.2x Payout
  // 100% Bet = 2.0x Payout (Double or Nothing)
  const riskRatio = wagerAmount / profile.current_balance
  const multiplier = 1.2 + (riskRatio * 0.8)

  const profit = isCorrect
    ? Math.floor(wagerAmount * (multiplier - 1))
    : -wagerAmount

  newBalance += profit

  // 3. Update Database Directly
  // (We use direct update here to avoid needing new SQL RPCs)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ current_balance: newBalance })
    .eq('id', user.id)

  if (updateError) return { error: 'Database Update Failed' }

  return { new_balance: newBalance, isCorrect, profit, source: image.source }
}