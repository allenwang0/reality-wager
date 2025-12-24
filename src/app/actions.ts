'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { IMAGE_BANK, getRandomBatch, ImageEntry, ImageCategory } from '@/data/image-bank'
import crypto from 'crypto';

export type GameImage = ImageEntry;

const MATH_SECRET = process.env.MATH_SECRET || 'local-dev-secret-do-not-use-in-prod';

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

    if (error || !profile) {
       // Auto-create profile if missing (common with anon auth)
       const { error: insertError } = await supabase.from('profiles').insert([{ id: user.id, current_balance: 1000 }]);
       if (!insertError) currentBalance = 1000;
    } else {
       currentBalance = profile.current_balance;
    }
  }
  return { user, currentBalance };
}

// --- GAMEPLAY ACTIONS ---

export async function getHandBatch(limit: number = 5, category: ImageCategory = 'general'): Promise<{ images: GameImage[] }> {
  // We don't expose labels here if we were being strict, but for this architecture
  // we send the whole object. In a real secure app, strip 'type' field here.
  const batch = getRandomBatch(limit, category);
  return { images: batch };
}

export async function submitWager(imageId: string, wagerAmount: number, guess: 'real' | 'ai'): Promise<WagerResult> {
  const supabase = await createClient()
  const { user, currentBalance } = await getUserAndBalance(supabase);

  const wager = Math.floor(wagerAmount);
  if (wager < 1) return { error: 'INVALID_WAGER' };
  if (wager > currentBalance) return { error: 'RESYNC_NEEDED', server_balance: currentBalance };
  if (currentBalance < 10) return { error: 'BANKRUPT' };

  // Lookup Image
  const bankImage = IMAGE_BANK.find(img => img.id === imageId);
  if (!bankImage) return { error: 'IMAGE_NOT_FOUND' };

  // Determine Outcome
  const isCorrect = guess === bankImage.type;

  // Dynamic Multiplier: The more of your bankroll you bet, the higher the multiplier.
  // Max Multiplier (All In) = 2.0x
  // Min Multiplier (Safe Bet) = 1.2x
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
    source: bankImage.source,
    source_url: bankImage.url
  }
}

// --- BACK ROOM ACTIONS (SECURE) ---

export async function generateProblem() {
  const a = Math.floor(Math.random() * 20) + 10;
  const b = Math.floor(Math.random() * 20) + 1;
  const op = Math.random() > 0.5 ? '+' : '-';
  const question = `${a} ${op} ${b}`;
  const answer = op === '+' ? a + b : a - b;

  // Sign the answer so client can't cheat
  const hash = crypto.createHmac('sha256', MATH_SECRET).update(answer.toString()).digest('hex');

  return { question, hash };
}

export async function submitManualLabor(userAnswer: number, validationHash: string, combo: number = 0) {
  const supabase = await createClient()
  const { user, currentBalance } = await getUserAndBalance(supabase);

  // 1. Verify Answer Integrity
  const expectedHash = crypto.createHmac('sha256', MATH_SECRET).update(userAnswer.toString()).digest('hex');

  if (expectedHash !== validationHash) {
    return { success: false, message: "INCORRECT. WORK HARDER." };
  }

  // 2. Calculate Wage
  const baseWage = 5;
  const bonus = Math.min(combo, 10); // Cap combo bonus
  const totalWage = baseWage + bonus;

  const newBalance = currentBalance + totalWage;

  if (user) {
    await supabase.rpc('update_balance', { p_user_id: user.id, p_new_balance: newBalance });
  }

  const released = newBalance >= 50;
  return { success: true, new_balance: newBalance, wage: totalWage, released };
}