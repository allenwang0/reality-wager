'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getNextHand, submitWager } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import GameCard from '@/components/GameCard';

export default function PlayPage() {
  const [balance, setBalance] = useState<number>(1000);
  const [image, setImage] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [wager, setWager] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [isBankrupt, setIsBankrupt] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // NEW: DB Status Indicator
  const [dbStatus, setDbStatus] = useState<'LIVE' | 'OFFLINE'>('OFFLINE');

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { data } = await supabase.auth.signInAnonymously();
        user = data.user;
      }
      await loadBalance(user?.id);
      await loadHand();
    };
    init();
  }, []);

  async function loadBalance(userId: string | undefined) {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase.from('profiles').select('current_balance').eq('id', userId).single();
    if (data) {
      setBalance(data.current_balance);
      if (data.current_balance < 10) setIsBankrupt(true);
    }
  }

  async function loadHand() {
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    try {
      // getNextHand now returns { image, is_backup }
      const res = await getNextHand();
      if (res?.image) {
          setImage(res.image);
          setDbStatus(res.is_backup ? 'OFFLINE' : 'LIVE');
      }
    } catch (e) {
      console.error("Load Error:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleWager = async (guess: 'real' | 'ai') => {
    if (wager > balance || loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await submitWager(image.id, wager, guess);

      if (res?.error === 'BANKRUPT') {
          setIsBankrupt(true);
          return;
      }

      // FIX: Handle Funds Mismatch gracefully
      if (res?.error === 'INSUFFICIENT_FUNDS') {
        setErrorMsg("Funds mismatch! Resyncing...");
        if (res.server_balance !== undefined) {
            setBalance(res.server_balance);
            // If my wager is now impossible, force it down
            if (wager > res.server_balance) {
                setWager(res.server_balance);
            }
        }
        return;
      }

      if (res?.error) {
          setErrorMsg(res.error);
          return;
      }

      if (res?.new_balance !== undefined) {
        setBalance(res.new_balance);
        setResult(res);
        if (res.new_balance < 10) setIsBankrupt(true);
        // Ensure next wager is valid
        else if (wager > res.new_balance) setWager(Math.floor(res.new_balance / 2));
      }
    } catch (e) {
      setErrorMsg("Connection Error");
    } finally {
      setLoading(false);
    }
  };

  const riskRatio = balance > 0 ? (wager / balance) : 0;

  if (isBankrupt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center font-mono">
         <h1 className="text-6xl font-bold mb-4 text-red-600">BANKRUPT</h1>
         <div className="text-xl mb-8 border-y-2 border-red-600 py-4 max-w-md">
            YOU HAVE NO FUNDS LEFT.
         </div>
         <Link
           href="/back-room"
           className="bg-red-600 text-black font-bold text-2xl px-8 py-4 border-4 border-white hover:bg-white hover:text-red-600 transition-all"
         >
           GO TO BACK ROOM &rarr;
         </Link>
      </div>
    )
  }

  if (!image) return <div className="min-h-screen flex items-center justify-center font-bold text-2xl">LOADING...</div>;

  return (
    <div className="min-h-screen max-w-md mx-auto p-6 flex flex-col font-mono text-black">
      {/* HEADER */}
      <div className="comic-box p-4 mb-8 flex justify-between items-start bg-white relative">
        {/* CONNECTION INDICATOR */}
        <div className={`absolute -top-3 -right-3 text-[10px] font-bold px-2 py-1 border-2 border-black ${dbStatus === 'LIVE' ? 'bg-green-400' : 'bg-gray-400'}`}>
            {dbStatus === 'LIVE' ? '● LIVE DB' : '○ OFFLINE'}
        </div>

        <div>
          <span className="text-xs font-bold bg-black text-white px-1">BANKROLL</span>
          <div className="text-4xl font-bold mt-1">${balance}</div>
        </div>
        <div className="text-right mt-2">
          <span className="text-xs font-bold text-gray-500">CURRENT BET</span>
          <div className="text-2xl font-bold">${wager}</div>
        </div>
      </div>

      {/* GAME AREA */}
      <div className="relative mb-8">
        <GameCard src={image.url} />

        {/* OVERLAY */}
        {result && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm">
            <div className="comic-box p-6 w-full text-center">
              <div className="text-6xl font-black mb-2 uppercase italic transform -rotate-3 drop-shadow-md">
                {result.isCorrect ? <span className="text-green-600">YES!</span> : <span className="text-red-600">NO!</span>}
              </div>
              <div className="text-2xl font-bold mb-4">
                {result.profit > 0 ? '+' : ''}{result.profit}
              </div>

              <a href={result.source_url} target="_blank" className="block text-xs underline mb-6 text-gray-500 hover:text-black">
                Source: {result.source}
              </a>

              <button onClick={loadHand} className="comic-button w-full bg-blue-300 py-4 font-bold text-xl hover:bg-blue-400">
                NEXT &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      {!result && (
        <div className="space-y-6">
          <div className="comic-box p-4 bg-yellow-100">
             <div className="flex justify-between text-xs font-bold mb-2">
               <span>RISK: {Math.floor(riskRatio * 100)}%</span>
               <span>MAX: ${balance}</span>
             </div>

             <input
                type="range"
                min="1"
                max={balance}
                value={wager}
                onChange={(e) => setWager(Math.floor(Number(e.target.value)))}
                className="w-full mb-4 accent-black h-2 bg-black rounded-lg appearance-none"
             />

             <div className="flex gap-2">
                 <button onClick={() => setWager(Math.max(1, Math.floor(balance * 0.25)))} className="comic-button flex-1 bg-white py-2 text-xs font-bold">25%</button>
                 <button onClick={() => setWager(Math.max(1, Math.floor(balance * 0.50)))} className="comic-button flex-1 bg-white py-2 text-xs font-bold">50%</button>
                 <button onClick={() => setWager(balance)} className="comic-button flex-1 bg-red-500 text-white py-2 text-xs font-bold">ALL IN</button>
             </div>
          </div>

          {errorMsg && (
             <div className="text-center font-bold text-red-600 bg-red-100 border-2 border-red-600 p-2 animate-pulse">
                ⚠ {errorMsg}
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleWager('real')} disabled={loading} className="comic-button h-20 bg-green-400 text-2xl font-black hover:bg-green-500">REAL</button>
            <button onClick={() => handleWager('ai')} disabled={loading} className="comic-button h-20 bg-pink-500 text-2xl font-black hover:bg-pink-600">AI</button>
          </div>
        </div>
      )}
    </div>
  );
}