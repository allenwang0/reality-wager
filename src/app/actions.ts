'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

  // 1. Try to get a random image from the DB
  const { data, error } = await supabase.rpc('get_next_hand', { p_user_id: user?.id })

  if (error || !data) {
     console.error("DB Error:", error); // Check your server terminal if this happens
     // Only show Dog if DB is truly broken
     return {
       image: {
         url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80',
         id: 0,
         type: 'real',
         source: 'System Error'
       }
     }
  }
  return { image: data }
}

export async function submitWager(imageId: number, wagerAmount: number, guess: 'real' | 'ai') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // 1. Get Real Data from DB
  const { data: profile } = await supabase.from('profiles').select('current_balance').eq('id', user.id).single()
  const { data: image } = await supabase.from('images').select('*').eq('id', imageId).single()

  // Handle "Ghost Users" (Auto-create balance if missing)
  const currentBalance = profile ? profile.current_balance : 1000;

  // If image not found (e.g. ID 0 from the dog), assume it was Real
  const imageType = image ? image.type : 'real';
  const imageSource = image ? image.source : 'Unknown';

  if (wagerAmount > currentBalance) return { error: 'Invalid Wager' }

  // 2. Real Logic (No random coin flip)
  const isCorrect = guess === imageType;
  let newBalance = currentBalance;

  const riskRatio = currentBalance > 0 ? (wagerAmount / currentBalance) : 0;
  const multiplier = 1.2 + (riskRatio * 0.8);

  const profit = isCorrect
    ? Math.floor(wagerAmount * (multiplier - 1))
    : -wagerAmount

  newBalance += profit

  // 3. Update DB
  await supabase.rpc('update_balance', {
    p_user_id: user.id,
    p_new_balance: newBalance
  })

  return { new_balance: newBalance, isCorrect, profit, source: imageSource }
}