'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNextHand, submitWager } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import GameCard from '@/components/GameCard';
import ResultOverlay from '@/components/ResultOverlay';

export default function PlayPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(1000);
  const [image, setImage] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState("Booting...");

  // Wager State
  const [wager, setWager] = useState<number>(50);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingMsg("Creating Anonymous ID...");
        const { data } = await supabase.auth.signInAnonymously();
        user = data.user;
      }

      setLoadingMsg("Syncing Database...");
      await Promise.all([ loadHand(), loadBalance(user?.id) ]);
      setLoadingMsg("Ready");
    };
    init();
  }, []);

  async function loadBalance(userId: string | undefined) {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase.from('profiles').select('current_balance').eq('id', userId).single();
    if (data) setBalance(data.current_balance);
  }

  async function loadHand() {
    setResult(null);
    try {
      const { image } = await getNextHand();
      if (image) setImage(image);
    } catch (e) {
      setImage({ url: '/assets/game/1.jpg', id: 0, type: 'real' });
    }
  }

  const handleWager = async (guess: 'real' | 'ai') => {
    if (wager > balance) { alert("Insufficient Funds"); return; }

    const res = await submitWager(image.id, wager, guess);

    // ERROR HANDLING
    if (res?.error) {
      console.error(res.error);
      if (res.error === 'BANKRUPT') { router.push('/back-room'); return; }
      // Fallback: If DB permissions fail, just let them play in browser memory
      alert("⚠️ Database Permission Error: Check Supabase SQL Policies.");
      return;
    }

    if (res?.new_balance !== undefined) {
      setBalance(res.new_balance);
      setResult(res);
      if (wager > res.new_balance) setWager(Math.floor(res.new_balance / 2));
    }
  };

  // UI CALCULATIONS
  const riskRatio = balance > 0 ? (wager / balance) : 0;
  const multiplier = (1.2 + (riskRatio * 0.8)).toFixed(2);
  const potentialWin = Math.floor(wager * (parseFloat(multiplier) - 1));

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
        <div className="text-right">
            <div className="text-xs text-gray-500">POTENTIAL PROFIT</div>
            <div className="text-xl font-mono text-neon-blue">+${potentialWin} <span className="text-xs text-gray-400">({multiplier}x)</span></div>
        </div>
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
        <div className="space-y-6 mt-4">
          {/* SLIDER CONTROLS - HIGH VISIBILITY UPDATE */}
          <div className="bg-cyber-gray p-6 rounded border border-cyber-border">
            <div className="flex justify-between text-sm mb-4 text-neon-blue font-mono font-bold">
                <span>WAGER: ${wager}</span>
                <span>{Math.floor(riskRatio * 100)}% RISK</span>
            </div>

            {/* LARGE SLIDER */}
            <input
                type="range"
                min="1"
                max={balance}
                value={wager}
                onChange={(e) => setWager(parseInt(e.target.value))}
                className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
            />

            <div className="flex justify-between mt-4 gap-2">
                <button onClick={() => setWager(Math.floor(balance * 0.25))} className="flex-1 bg-black border border-gray-700 py-2 text-gray-400 hover:text-white text-xs">25%</button>
                <button onClick={() => setWager(Math.floor(balance * 0.5))} className="flex-1 bg-black border border-gray-700 py-2 text-gray-400 hover:text-white text-xs">50%</button>
                <button onClick={() => setWager(balance)} className="flex-1 bg-red-900/30 border border-red-900 py-2 text-red-500 hover:bg-red-900 hover:text-white font-bold text-xs">ALL IN</button>
            </div>
          </div>

          {/* BET BUTTONS (NOW SUBMIT BUTTONS) */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleWager('real')} className="bg-green-900/20 border border-green-600 text-green-500 py-4 font-bold text-xl hover:bg-green-500 hover:text-black transition-all hover:scale-[1.02]">
                REAL
            </button>
            <button onClick={() => handleWager('ai')} className="bg-red-900/20 border border-red-600 text-red-500 py-4 font-bold text-xl hover:bg-red-500 hover:text-black transition-all hover:scale-[1.02]">
                AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}