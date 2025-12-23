'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNextHand, submitWager } from '@/app/actions';
import { createClient } from '@/lib/supabase/client'; // Auth client
import GameCard from '@/components/GameCard';
import ResultOverlay from '@/components/ResultOverlay';

export default function PlayPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [image, setImage] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loadingError, setLoadingError] = useState<string>('');

  // 1. Auth & Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.log("No user found, signing in anonymously...");
          await supabase.auth.signInAnonymously();
        }

        // Load data in parallel
        await Promise.all([loadHand(), loadBalance()]);
      } catch (err: any) {
        console.error("Init Error:", err);
        setLoadingError(err.message);
      }
    };
    init();
  }, []);

  async function loadBalance() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('current_balance')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error("Balance Load Error:", error);
      }

      // FIX: If no profile exists, default to 1000 so the game loads
      if (data) {
        setBalance(data.current_balance);
      } else {
        console.warn("No profile found. Defaulting to $1000.");
        setBalance(1000);
      }
    } catch (e) {
      setBalance(1000); // Fail-safe
    }
  }

  async function loadHand() {
    setResult(null);
    try {
      const { image, error } = await getNextHand();
      if (error) throw new Error(error);
      if (!image) throw new Error("No image returned");
      setImage(image);
    } catch (e) {
      console.error("Hand Load Error:", e);
      // Fallback image to prevent getting stuck
      setImage({ url: '/assets/game/1.jpg', id: 0, type: 'real' });
    }
  }

  const handleWager = async (guess: 'real' | 'ai', tierIdx: number) => {
    if (!image) return;

    // Optimistic UI update (optional) or loading state could go here
    const res = await submitWager(image.id, tierIdx, guess);

    if (res?.error === 'BANKRUPT') {
      router.push('/back-room');
      return;
    }

    if (res?.error) {
      alert("Error processing wager: " + res.error);
      return;
    }

    setBalance(res.new_balance);
    setResult(res);
  };

  // ERROR STATE
  if (loadingError) return <div className="p-10 text-neon-red font-mono">ERROR: {loadingError}</div>;

  // LOADING STATE
  if (!image || balance === null) {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center font-mono text-neon-green">
        <div className="animate-pulse mb-4">CONNECTING TO MAINFRAME...</div>
        <div className="text-xs text-gray-500">
          Status: {balance === null ? "Fetching Profile..." : "Ready"}
          | Asset: {image ? "Loaded" : "Downloading..."}
        </div>
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