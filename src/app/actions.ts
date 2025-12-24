'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { IMAGE_BANK, getRandomBatch, ImageEntry } from '@/data/image-bank'

export type GameImage = ImageEntry;

type WagerResult = {
  new_balance?: number;
  isCorrect?: boolean;
  profit?: number;
  source?: string;
  source_url?: string;
  error?: string;
  server_balance?: number;
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

async function getUserAndBalance(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  let currentBalance = 1000;

  if (user) {
    const { data: profile, error } = await supabase.from('profiles').select('current_balance').eq('id', user.id).single();

    // 1. CRITICAL FIX: Auto-create profile if missing (common with anon auth)
    if (error || !profile) {
       console.log("Profile missing, creating default...");
       const { error: insertError } = await supabase.from('profiles').insert([{ id: user.id, current_balance: 1000 }]);
       if (!insertError) currentBalance = 1000;
    } else {
       currentBalance = profile.current_balance;
    }
  }
  return { user, currentBalance };
}

export async function getHandBatch(limit: number = 5): Promise<{ images: GameImage[], is_backup: boolean }> {
  const batch = getRandomBatch(limit);
  return { images: batch, is_backup: true };
}

export async function submitWager(imageId: string, wagerAmount: number, guess: 'real' | 'ai'): Promise<WagerResult> {
  const supabase = await createClient()
  const { user, currentBalance } = await getUserAndBalance(supabase);

  const wager = Math.floor(wagerAmount);

  if (wager < 1) return { error: 'INVALID_WAGER' };

  // Silent Resync
  if (wager > currentBalance) {
    return {
        error: 'RESYNC_NEEDED',
        server_balance: currentBalance
    };
  }

  if (currentBalance < 10) return { error: 'BANKRUPT' };

  let imageType = 'real';
  let imageSource = 'Unknown';
  let imageSourceUrl = '#';

  const bankImage = IMAGE_BANK.find(img => img.id === imageId);

  if (bankImage) {
      imageType = bankImage.type;
      imageSource = bankImage.source;
      imageSourceUrl = bankImage.url;
  } else {
      return { error: 'IMAGE_NOT_FOUND' };
  }

  const isCorrect = guess === imageType;
  const riskRatio = currentBalance > 0 ? (wager / currentBalance) : 0;

  // High stakes multiplier logic
  const multiplier = 1.2 + (riskRatio * 0.8);

  const profit = isCorrect
    ? Math.floor(wager * (multiplier - 1))
    : -wager;

  const newBalance = currentBalance + profit;

  if (user) {
    await supabase.rpc('update_balance', { p_user_id: user.id, p_new_balance: newBalance });
  }

  return {
    new_balance: newBalance,
    isCorrect,
    profit,
    source: imageSource,
    source_url: imageSourceUrl
  }
}

// 2. UX FIX: Manual Labor with Streak Multiplier
// difficulty is base wage (5), streak adds multiplier
export async function submitManualLabor(answer: number, correctAnswer: number, difficulty: number, combo: number = 0) {
  const supabase = await createClient()
  const { user, currentBalance } = await getUserAndBalance(supabase);

  if (answer !== correctAnswer) return { success: false, message: "WRONG. DEBT REMAINS." };

  // Wage Calculation: Base $5 + ($1 per streak point)
  const baseWage = 5;
  const bonus = Math.min(combo, 10); // Cap combo bonus at $10 extra
  const totalWage = baseWage + bonus;

  const newBalance = currentBalance + totalWage;

  if (user) await supabase.rpc('update_balance', { p_user_id: user.id, p_new_balance: newBalance });

  const released = newBalance >= 50;
  return { success: true, new_balance: newBalance, wage: totalWage, released };
}