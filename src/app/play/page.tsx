'use client';
import { useState, useEffect } from 'react';
import { getNextHand, submitWager } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import GameCard from '@/components/GameCard';

export default function PlayPage() {
  const [balance, setBalance] = useState<number>(1000);
  const [image, setImage] = useState<any>(null);
  const [result, setResult] = useState<any>(null); // { isCorrect: boolean, profit: number }
  const [wager, setWager] = useState<number>(50);

  // --- AUTH & LOAD LOGIC (Keep existing logic) ---
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { data } = await supabase.auth.signInAnonymously();
        user = data.user;
      }
      await Promise.all([ loadHand(), loadBalance(user?.id) ]);
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
    setResult(null); // Clear previous result overlay
    try {
      const { image } = await getNextHand();
      if (image) setImage(image);
    } catch (e) {
      setImage({ url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b', id: 0, type: 'real' });
    }
  }
  // ------------------------------------------------

  const handleWager = async (guess: 'real' | 'ai') => {
    if (wager > balance) return;
    const res = await submitWager(image.id, wager, guess);
    if (res?.new_balance !== undefined) {
      setBalance(res.new_balance);
      setResult(res); // Show the overlay
    }
  };

  if (!image) return <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading...</div>;

  return (
    <div className="min-h-screen max-w-md mx-auto p-6 flex flex-col font-sans">

      {/* HEADER: Simple and Clean */}
      <div className="flex justify-between items-baseline mb-8">
        <div>
          <span className="text-zinc-500 text-xs font-semibold tracking-wider">BALANCE</span>
          <div className="text-3xl font-bold text-white">${balance.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <span className="text-zinc-500 text-xs font-semibold tracking-wider">WAGER</span>
          <div className="text-xl font-bold text-white">${wager}</div>
        </div>
      </div>

      {/* IMAGE AREA */}
      <div className="relative mb-6 group">
        <GameCard src={image.url} />

        {/* === THE OVERLAY: Fades in OVER the image === */}
        {result && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-300">
            <div className="text-4xl font-bold mb-2">
              {result.isCorrect ? (
                <span className="text-emerald-400">Correct</span>
              ) : (
                <span className="text-rose-500">Incorrect</span>
              )}
            </div>
            <div className="text-white text-lg font-medium mb-6">
              {result.profit > 0 ? '+' : ''}{result.profit} Credits
            </div>
            <button
              onClick={loadHand}
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
              Next Image
            </button>
          </div>
        )}
      </div>

      {/* CONTROLS (Hide when result is showing to reduce clutter) */}
      {!result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">

          {/* QUICK WAGER SELECTOR (No fiddly slider) */}
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setWager(Math.floor(balance * (pct/100)))}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  wager === Math.floor(balance * (pct/100))
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {pct === 100 ? 'ALL IN' : `${pct}%`}
              </button>
            ))}
          </div>

          {/* MAIN BUTTONS */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleWager('real')}
              className="h-16 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-lg"
            >
              REAL
            </button>
            <button
              onClick={() => handleWager('ai')}
              className="h-16 bg-rose-500/10 border border-rose-500/50 text-rose-400 font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-all text-lg"
            >
              AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}