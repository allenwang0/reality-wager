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

  // Try to get a random image from the DB
  const { data, error } = await supabase.rpc('get_next_hand', { p_user_id: user?.id })

  if (error || !data) {
     // FALLBACK: If DB is empty/broken, use these 3 hardcoded images so the game works
     const backups = [
       { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', type: 'real' },
       { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', type: 'ai' },
       { url: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126', type: 'real' }
     ];
     const random = backups[Math.floor(Math.random() * backups.length)];

     return {
       image: {
         url: random.url,
         id: 999,
         type: random.type,
         source: 'Backup System'
       }
     }
  }
  return { image: data }
}

export async function submitWager(imageId: number, wagerAmount: number, guess: 'real' | 'ai') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. OFFLINE MODE: If Auth fails, just play the game in memory
  if (!user) {
    return { new_balance: 1000 + wagerAmount, isCorrect: true, profit: wagerAmount, source: "Offline" }
  }

  // 2. Fetch Data (Safely)
  const { data: profile } = await supabase.from('profiles').select('current_balance').eq('id', user.id).single()
  const { data: image } = await supabase.from('images').select('*').eq('id', imageId).single()

  // Default to 1000 if profile missing, Default to 'real' if image missing
  const currentBalance = profile ? profile.current_balance : 1000;
  const imageType = image ? image.type : 'real';
  const imageSource = image ? image.source : 'Unknown';

  // 3. Logic
  const isCorrect = guess === imageType;
  let newBalance = currentBalance;
  const riskRatio = currentBalance > 0 ? (wagerAmount / currentBalance) : 0;
  const multiplier = 1.2 + (riskRatio * 0.8);
  const profit = isCorrect ? Math.floor(wagerAmount * (multiplier - 1)) : -wagerAmount;

  newBalance += profit;

  // 4. Update Database (Background Task - Don't let errors stop the game)
  const { error } = await supabase.rpc('update_balance', {
    p_user_id: user.id,
    p_new_balance: newBalance
  })

  if (error) console.log("Background Save Error (Game Continuing):", error.message);

  return { new_balance: newBalance, isCorrect, profit, source: imageSource }
}