'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 0. SHARED BACKUP DATA (Source of truth if DB fails)
const BACKUP_IMAGES = [
  { id: 999, url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', type: 'real', source: 'Unsplash' },
  { id: 998, url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', type: 'ai', source: 'DeepMind' },
  { id: 997, url: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126', type: 'real', source: 'Unsplash' }
];

type WagerResult = {
  new_balance?: number;
  isCorrect?: boolean;
  profit?: number;
  source?: string;
  error?: string;
}

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

  // 1. Try DB
  const { data, error } = await supabase.rpc('get_next_hand', { p_user_id: user?.id })

  if (error || !data) {
     // 2. Fallback to constant list if DB fails
     const random = BACKUP_IMAGES[Math.floor(Math.random() * BACKUP_IMAGES.length)];
     return {
       image: {
         url: random.url,
         id: random.id,
         type: random.type,
         source: 'Backup System'
       }
     }
  }
  return { image: data }
}

export async function submitWager(imageId: number, wagerAmount: number, guess: 'real' | 'ai'): Promise<WagerResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // --- STEP 1: GET THE TRUTH (From DB or Backup) ---
  let imageType = 'real';
  let imageSource = 'Unknown';

  // Try fetching the specific image from DB
  const { data: dbImage } = await supabase.from('images').select('*').eq('id', imageId).single();

  if (dbImage) {
    imageType = dbImage.type;
    imageSource = dbImage.source;
  } else {
    // If not in DB, check our hardcoded backups (for ID 999, etc)
    const backup = BACKUP_IMAGES.find(img => img.id === imageId);
    if (backup) {
      imageType = backup.type;
      imageSource = backup.source;
    } else {
      // If we can't find the image anywhere, we can't grade the test.
      return { error: 'IMAGE_NOT_FOUND' };
    }
  }

  // --- STEP 2: GET USER BALANCE ---
  let currentBalance = 1000; // Default for visitors
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('current_balance').eq('id', user.id).single();
    if (profile) currentBalance = profile.current_balance;
  }

  // --- STEP 3: CALCULATE RESULT ---
  // Bankruptcy check
  if (currentBalance < 10) return { error: 'BANKRUPT' };

  // Core Logic
  const isCorrect = guess === imageType;
  const riskRatio = currentBalance > 0 ? (wagerAmount / currentBalance) : 0;

  // Calculate Profit/Loss
  // Win: Multiply wager based on risk. Loss: Lose the wager amount.
  const multiplier = 1.2 + (riskRatio * 0.8);
  const profit = isCorrect
    ? Math.floor(wagerAmount * (multiplier - 1))
    : -wagerAmount;

  const newBalance = currentBalance + profit;

  // --- STEP 4: SAVE TO DB (If user exists) ---
  if (user) {
    await supabase.rpc('update_balance', {
      p_user_id: user.id,
      p_new_balance: newBalance
    });
  }

  return {
    new_balance: newBalance,
    isCorrect,
    profit,
    source: imageSource
  }
}