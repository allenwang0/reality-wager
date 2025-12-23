'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNextHand, submitWager } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import GameCard from '@/components/GameCard';
import ResultOverlay from '@/components/ResultOverlay';

export default function PlayPage() {
  const router = useRouter();
  // SAFEGUARD 1: Initialize balance to 1000 immediately so UI shows up.
  // We will update it to the "Real" database balance a second later.
  const [balance, setBalance] = useState<number>(1000);
  const [image, setImage] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState("Booting...");

  // 1. Auth & Data Load
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();

      // A. Ensure we are logged in
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingMsg("Creating Anonymous ID...");
        const { data } = await supabase.auth.signInAnonymously();
        user = data.user;
      }

      // B. Load Data
      setLoadingMsg("Syncing Database...");
      await Promise.all([
        loadHand(),
        loadBalance(user?.id)
      ]);

      setLoadingMsg("Ready");
    };
    init();
  }, []);

  async function loadBalance(userId: string | undefined) {
    if (!userId) return; // Should not happen given logic above

    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('current_balance')
      .eq('id', userId)
      .single();

    // SAFEGUARD 2: If DB has a value, use it. If not (ghost user), keep the default 1000.
    if (data) {
      setBalance(data.current_balance);
    } else {
      console.log("New user detected. Starting with $1000.");
    }
  }

  async function loadHand() {
    setResult(null);
    try {
      const { image } = await getNextHand();
      if (image) setImage(image);
    } catch (e) {
      console.error(e);
      // SAFEGUARD 3: Fallback image if DB fails
      setImage({ url: '/assets/game/1.jpg', id: 0, type: 'real' });
    }
  }

  const handleWager = async (guess: 'real' | 'ai', tierIdx: number) => {
    // Optimistic Update: Don't wait for server to show the click
    const res = await submitWager(image.id, tierIdx, guess);

    if (res?.error === 'BANKRUPT') {
      router.push('/back-room');
      return;
    }

    // Server might return error if "Ghost User" (missing profile row)
    // We handle that by just updating local state for now
    if (res?.new_balance !== undefined) {
      setBalance(res.new_balance);
      setResult(res);
    } else {
      // Fallback if server failed to write to DB
      alert("Database Error: Using Offline Calculation");
      // You could add offline math here, but usually this means Supabase RLS is blocking
    }
  };

  // Only show loading screen if we are missing the IMAGE.
  // We no longer block on balance since we default to 1000.
  if (!image) {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center font-mono text-neon-green">
        <div className="animate-pulse mb-4">CONNECTING TO MAINFRAME...</div>
        <div className="text-xs text-gray-500">Status: {loadingMsg}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto flex flex-col justify-center">
      {/* HUD */}
      <div className="flex justify-between items-end border-b border-cyber-border pb-4 mb-6">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest">Balance</div>
          <div className="text-3xl font-mono text-neon-green">${balance}</div>
        </div>
        <div className="text-right text-xs text-gray-500">ID: {image.id}</div>
      </div>

      <div className="relative">
        <GameCard src={image.url} />
        {result && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <ResultOverlay result={result} onNext={loadHand} />
          </div>
        )}
      </div>

      {!result && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <button onClick={() => handleWager('real', 1)} className="bg-green-900/20 border border-green-600 text-green-500 py-3 font-bold hover:bg-green-500 hover:text-black transition-colors">REAL</button>
          <button onClick={() => handleWager('ai', 1)} className="bg-red-900/20 border border-red-600 text-red-500 py-3 font-bold hover:bg-red-500 hover:text-black transition-colors">AI</button>
        </div>
      )}
    </div>
  );
}