'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 0. EXPANDED BACKUP DATA (So you have more to play with immediately)
const BACKUP_IMAGES = [
  { id: 999, url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', type: 'real', source: 'Unsplash' },
  { id: 998, url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', type: 'ai', source: 'DeepMind' },
  { id: 997, url: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126', type: 'real', source: 'Unsplash' },
  { id: 996, url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', type: 'real', source: 'Unsplash' },
  { id: 995, url: 'https://cdn.pixabay.com/photo/2023/01/29/15/26/ai-generated-7753696_1280.jpg', type: 'ai', source: 'Midjourney' },
  { id: 994, url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', type: 'real', source: 'Unsplash' },
  { id: 993, url: 'https://img.freepik.com/premium-photo/cyberpunk-girl-neon-city-digital-art-generative-ai_934475-654.jpg', type: 'ai', source: 'Stable Diffusion' },
  { id: 992, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', type: 'real', source: 'Unsplash' },
  { id: 991, url: 'https://img.freepik.com/free-photo/portrait-young-woman-with-blue-eyes_1142-53644.jpg?w=1380', type: 'ai', source: 'DALL-E 3' },
  { id: 990, url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d', type: 'real', source: 'Unsplash' }
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

  // 1. Try DB RPC (Smart Random)
  let { data, error } = await supabase.rpc('get_next_hand', { p_user_id: user?.id })

  // 2. Fallback: Try basic DB fetch if RPC fails but DB is connected
  if (error || !data) {
     const { data: simpleData } = await supabase.from('images').select('*').limit(1).maybeSingle();
     // If we found a real row, use it (Note: this isn't random, but proves DB connection)
     if (simpleData) data = simpleData;
  }

  // 3. Final Fallback: Use Hardcoded List
  if (!data) {
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

  // --- STEP 1: GET THE TRUTH ---
  let imageType = 'real';
  let imageSource = 'Unknown';

  const { data: dbImage } = await supabase.from('images').select('*').eq('id', imageId).single();

  if (dbImage) {
    imageType = dbImage.type;
    imageSource = dbImage.source;
  } else {
    // Check backups
    const backup = BACKUP_IMAGES.find(img => img.id === imageId);
    if (backup) {
      imageType = backup.type;
      imageSource = backup.source;
    } else {
      return { error: 'IMAGE_NOT_FOUND' };
    }
  }

  // --- STEP 2: GET USER BALANCE ---
  let currentBalance = 1000;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('current_balance').eq('id', user.id).single();
    if (profile) currentBalance = profile.current_balance;
  }

  // --- STEP 3: BANKRUPTCY CHECK ---
  // If balance is too low, STOP immediately.
  if (currentBalance < 10) return { error: 'BANKRUPT' };

  // --- STEP 4: LOGIC ---
  const isCorrect = guess === imageType;
  const riskRatio = currentBalance > 0 ? (wagerAmount / currentBalance) : 0;
  const multiplier = 1.2 + (riskRatio * 0.8);
  const profit = isCorrect
    ? Math.floor(wagerAmount * (multiplier - 1))
    : -wagerAmount;

  const newBalance = currentBalance + profit;

  // --- STEP 5: SAVE ---
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