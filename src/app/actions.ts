'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type GameImage = {
  id: number;
  url: string;
  type: 'real' | 'ai';
  source: string;
  source_url: string;
};

type WagerResult = {
  new_balance?: number;
  isCorrect?: boolean;
  profit?: number;
  source?: string;
  source_url?: string;
  error?: string;
  server_balance?: number;
}

// 1. BACKUP DATA
const BACKUP_IMAGES: GameImage[] = [
  { id: 999, url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', type: 'real', source: 'Unsplash', source_url: 'https://unsplash.com' },
  { id: 998, url: 'https://img.freepik.com/premium-photo/portrait-young-woman-with-blue-eyes_1142-53644.jpg', type: 'ai', source: 'Freepik AI', source_url: 'https://freepik.com' },
  { id: 997, url: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126', type: 'real', source: 'Unsplash', source_url: 'https://unsplash.com' },
];

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

// --- UPDATED: GetNextHand with Source Flag ---
export async function getNextHand(): Promise<{ image: GameImage, is_backup: boolean }> {
  const supabase = await createClient()
  const { user } = await getUserAndBalance(supabase);

  // 1. Try DB RPC
  let { data, error } = await supabase.rpc('get_next_hand', { p_user_id: user?.id })

  if (data) {
      return { image: data, is_backup: false }; // SUCCESS: Came from DB
  }

  // 2. Fallback: Standard Select
  if (error || !data) {
     const { data: list } = await supabase.from('images').select('*').limit(50);
     if (list && list.length > 0) {
         data = list[Math.floor(Math.random() * list.length)];
         return { image: data, is_backup: false }; // SUCCESS: Came from DB
     }
  }

  // 3. Absolute Fail: Backup
  data = BACKUP_IMAGES[Math.floor(Math.random() * BACKUP_IMAGES.length)];
  return { image: data, is_backup: true }; // FAIL: Came from Backup
}

export async function submitWager(imageId: number, wagerAmount: number, guess: 'real' | 'ai'): Promise<WagerResult> {
  const supabase = await createClient()
  const { user, currentBalance } = await getUserAndBalance(supabase);

  // Ensure strict integer math
  const wager = Math.floor(wagerAmount);

  if (wager < 1) return { error: 'INVALID_WAGER' };

  if (wager > currentBalance) {
    return {
        error: 'INSUFFICIENT_FUNDS',
        server_balance: currentBalance
    };
  }

  if (currentBalance < 10) return { error: 'BANKRUPT' };

  let imageType = 'real';
  let imageSource = 'Unknown';
  let imageSourceUrl = '#';

  const { data: dbImage } = await supabase.from('images').select('*').eq('id', imageId).single();
  if (dbImage) {
    imageType = dbImage.type;
    imageSource = dbImage.source;
    imageSourceUrl = dbImage.source_url || '#';
  } else {
    const backup = BACKUP_IMAGES.find(img => img.id === imageId);
    if (!backup) return { error: 'IMAGE_NOT_FOUND' };
    imageType = backup.type;
    imageSource = backup.source;
    imageSourceUrl = backup.source_url;
  }

  const isCorrect = guess === imageType;
  const riskRatio = currentBalance > 0 ? (wager / currentBalance) : 0;
  const multiplier = 1.2 + (riskRatio * 0.8);

  // Strict Floor Math for Profit
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

// Manual Labor Function remains the same...
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