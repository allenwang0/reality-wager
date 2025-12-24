'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { IMAGE_BANK, getRandomBatch, ImageEntry } from '@/data/image-bank'

// Use the Type from the bank, mapped to match legacy id type if needed
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
    const { data: profile } = await supabase.from('profiles').select('current_balance').eq('id', user.id).single();
    if (profile) currentBalance = profile.current_balance;
  }
  return { user, currentBalance };
}

// --- NEW: Get Batch of Images ---
export async function getHandBatch(limit: number = 5): Promise<{ images: GameImage[], is_backup: boolean }> {
  // 1. Try DB (Mocked for now to use Image Bank directly for stability)
  // In a real app, you would query Supabase here.
  // For this fix, we are prioritizing the stable IMAGE_BANK to stop 404s.

  const batch = getRandomBatch(limit);
  return { images: batch, is_backup: true };
}

export async function submitWager(imageId: string, wagerAmount: number, guess: 'real' | 'ai'): Promise<WagerResult> {
  const supabase = await createClient()
  const { user, currentBalance } = await getUserAndBalance(supabase);

  const wager = Math.floor(wagerAmount);

  if (wager < 1) return { error: 'INVALID_WAGER' };

  // 1. FIX: Silent Resync logic
  // If user thinks they have money but server disagrees, send back the real balance
  // but don't count it as a "loss", just a reset.
  if (wager > currentBalance) {
    return {
        error: 'RESYNC_NEEDED',
        server_balance: currentBalance
    };
  }

  if (currentBalance < 10) return { error: 'BANKRUPT' };

  // 2. Lookup Image
  let imageType = 'real';
  let imageSource = 'Unknown';
  let imageSourceUrl = '#';

  const bankImage = IMAGE_BANK.find(img => img.id === imageId);

  if (bankImage) {
      imageType = bankImage.type;
      imageSource = bankImage.source;
      imageSourceUrl = bankImage.url;
  } else {
      // Fallback for legacy ID types if they exist
      return { error: 'IMAGE_NOT_FOUND' };
  }

  const isCorrect = guess === imageType;
  const riskRatio = currentBalance > 0 ? (wager / currentBalance) : 0;
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

// Manual Labor
export async function submitManualLabor(answer: number, correctAnswer: number, difficulty: number) {
  const supabase = await createClient()
  const { user, currentBalance } = await getUserAndBalance(supabase);
  if (answer !== correctAnswer) return { success: false, message: "WRONG. WORK HARDER." };
  const wage = difficulty * 5;
  const newBalance = currentBalance + wage;
  if (user) await supabase.rpc('update_balance', { p_user_id: user.id, p_new_balance: newBalance });
  const released = newBalance >= 50;
  return { success: true, new_balance: newBalance, wage, released };
}