'use client';
import { useState, useEffect } from 'react';
import { getNextHand, submitWager } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import GameCard from '@/components/GameCard';

export default function PlayPage() {
  const [balance, setBalance] = useState<number>(1000);
  const [image, setImage] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [wager, setWager] = useState<number>(50);
  const [loading, setLoading] = useState(false); // New loading state

  // --- AUTH & LOAD LOGIC ---
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
    setLoading(true); // Start loading
    setResult(null);
    try {
      const { image } = await getNextHand();
      if (image) setImage(image);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false); // Stop loading
    }
  }

  const handleWager = async (guess: 'real' | 'ai') => {
    if (wager > balance || loading) return; // Prevent double clicks

    setLoading(true);
    const res = await submitWager(image.id, wager, guess);
    setLoading(false);

    if (res?.new_balance !== undefined) {
      setBalance(res.new_balance);
      setResult(res);
      if (wager > res.new_balance) setWager(Math.floor(res.new_balance / 2));
    }
  };

  const riskRatio = balance > 0 ? (wager / balance) : 0;

  if (!image) return (
    <div className="min-h-screen flex flex-col items-center justify-center font-black text-2xl text-black bg-[#fffbeb]">
      LOADING GAME...
    </div>
  );

  return (
    <div className="min-h-screen max-w-md mx-auto p-6 flex flex-col font-sans text-black">

      {/* HEADER CARD */}
      <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-4 mb-8 flex justify-between items-center">
        <div>
          <span className="text-xs font-black tracking-widest text-gray-500">BANKROLL</span>
          <div className="text-3xl font-black">${balance.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <span className="text-xs font-black tracking-widest text-gray-500">BET</span>
          <div className="text-xl font-black">${wager}</div>
        </div>
      </div>

      {/* GAME AREA */}
      <div className="relative mb-8 group">
        <GameCard src={image.url} />

        {/* CARTOON OVERLAY RESULT */}
        {result && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full text-center animate-in zoom-in duration-200">

              <div className="text-5xl font-black mb-2 uppercase italic transform -rotate-2">
                {result.isCorrect ? (
                  <span className="text-green-600 drop-shadow-[2px_2px_0px_#000]">NICE!</span>
                ) : (
                  <span className="text-red-600 drop-shadow-[2px_2px_0px_#000]">NOPE!</span>
                )}
              </div>

              <div className="text-2xl font-bold mb-6 border-b-4 border-black inline-block pb-1">
                {result.profit > 0 ? '+' : ''}{result.profit} Bucks
              </div>

              <div className="mb-6 text-sm font-bold bg-yellow-200 inline-block px-2 py-1 border-2 border-black rounded">
                Source: {result.source || "Unknown"}
              </div>

              {/* FIXED BUTTON ARROW SYNTAX HERE */}
              <button
                onClick={loadHand}
                disabled={loading}
                className="w-full bg-blue-400 border-4 border-black text-black font-black py-4 rounded-xl text-xl shadow-[4px_4px_0px_0px_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
              >
                {loading ? "LOADING..." : "NEXT ROUND →"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      {!result && (
        <div className="space-y-6">

          {/* CHUNKY SLIDER PANEL */}
          <div className="bg-yellow-100 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-4">
             <div className="flex justify-between text-xs font-black mb-2 uppercase text-black">
               <span>Risk Level: {Math.floor(riskRatio * 100)}%</span>
               <span>All In: ${balance}</span>
             </div>

             <input
                type="range"
                min="1"
                max={balance}
                value={wager}
                onChange={(e) => setWager(parseInt(e.target.value))}
                className="w-full mb-6 accent-black"
            />

             <div className="flex gap-2">
                 <button onClick={() => setWager(Math.floor(balance * 0.25))} className="flex-1 bg-white border-2 border-black font-bold text-xs py-2 rounded text-black hover:bg-gray-100">25%</button>
                 <button onClick={() => setWager(Math.floor(balance * 0.50))} className="flex-1 bg-white border-2 border-black font-bold text-xs py-2 rounded text-black hover:bg-gray-100">50%</button>
                 <button onClick={() => setWager(balance)} className="flex-1 bg-red-500 text-white border-2 border-black font-bold text-xs py-2 rounded hover:bg-red-600">ALL IN</button>
             </div>
          </div>

          {/* BIG ACTION BUTTONS - NOW WITH BLACK TEXT */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleWager('real')}
              disabled={loading}
              className="h-20 bg-green-400 border-4 border-black rounded-xl text-2xl font-black text-black shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50 disabled:translate-y-1 disabled:shadow-none"
            >
              {loading ? "..." : "REAL"}
            </button>
            <button
              onClick={() => handleWager('ai')}
              disabled={loading}
              className="h-20 bg-pink-500 border-4 border-black rounded-xl text-2xl font-black text-black shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50 disabled:translate-y-1 disabled:shadow-none"
            >
              {loading ? "..." : "AI"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}