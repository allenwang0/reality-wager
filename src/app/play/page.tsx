'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNextHand, submitWager } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import GameCard from '@/components/GameCard';
import ResultOverlay from '@/components/ResultOverlay';
import { cn } from '@/lib/utils';

export default function PlayPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(1000);
  const [image, setImage] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState("INITIALIZING PROTOCOL...");
  const [wager, setWager] = useState<number>(50);

  // Auth & Load Logic (Same as before)
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingMsg("ESTABLISHING ANONYMOUS CONNECTION...");
        const { data } = await supabase.auth.signInAnonymously();
        user = data.user;
      }
      setLoadingMsg("SYNCING NEURAL NET...");
      await Promise.all([ loadHand(), loadBalance(user?.id) ]);
      setLoadingMsg("READY");
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
      setImage({ url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b', id: 0, type: 'real' });
    }
  }

  const handleWager = async (guess: 'real' | 'ai') => {
    if (wager > balance) { alert("INSUFFICIENT CREDITS"); return; }
    const res = await submitWager(image.id, wager, guess);

    if (res?.error) {
       console.error(res.error);
       return;
    }

    if (res?.new_balance !== undefined) {
      setBalance(res.new_balance);
      setResult(res);
      if (wager > res.new_balance) setWager(Math.floor(res.new_balance / 2));
    }
  };

  // UI Helper Calculations
  const riskRatio = balance > 0 ? (wager / balance) : 0;
  const multiplier = (1.2 + (riskRatio * 0.8)).toFixed(2);
  const potentialWin = Math.floor(wager * (parseFloat(multiplier) - 1));

  // Dynamic Color based on Risk
  const getRiskColor = () => {
    if (riskRatio < 0.3) return "text-neon-blue";
    if (riskRatio < 0.7) return "text-neon-yellow";
    return "text-neon-red drop-shadow-[0_0_8px_rgba(255,0,60,0.8)]";
  };

  const getSliderColor = () => {
    if (riskRatio < 0.3) return "accent-neon-blue";
    if (riskRatio < 0.7) return "accent-neon-yellow";
    return "accent-neon-red";
  };

  if (!image) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono tracking-widest text-neon-green">
        <div className="animate-spin mb-8 w-12 h-12 border-4 border-neon-green border-t-transparent rounded-full"></div>
        <div className="animate-pulse">{loadingMsg}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-center max-w-md mx-auto p-4 font-mono z-10">
      {/* Background Scanlines */}
      <div className="bg-scanlines"></div>

      {/* TOP HUD */}
      <div className="flex justify-between items-end mb-6 border-b border-white/20 pb-2 relative">
        <div className="absolute -bottom-[1px] left-0 w-1/3 h-[2px] bg-neon-green shadow-[0_0_10px_#00ff41]"></div>
        <div>
          <div className="text-[10px] text-gray-400 mb-1 tracking-widest">NET WORTH</div>
          <div className="text-4xl text-white font-bold tracking-tight animate-flicker">
            ${balance.toLocaleString()}
          </div>
        </div>
        <div className="text-right">
           <div className="text-[10px] text-gray-400 mb-1 tracking-widest">POTENTIAL</div>
           <div className={cn("text-xl font-bold", getRiskColor())}>
             +${potentialWin}
           </div>
        </div>
      </div>

      {/* GAME AREA */}
      <div className="relative mb-6">
        <GameCard src={image.url} />
        {result && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <ResultOverlay result={result} onNext={loadHand} />
          </div>
        )}
      </div>

      {/* CONTROLS (Only visible if not playing result) */}
      {!result && (
        <div className="space-y-6">

          {/* BETTING SLIDER PANEL */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-hidden group">
            {/* Ambient Glow */}
            <div className={cn("absolute top-0 left-0 w-1 h-full opacity-50 transition-colors duration-300", riskRatio > 0.5 ? "bg-neon-red" : "bg-neon-blue")}></div>

            <div className="flex justify-between items-center mb-4 text-xs font-bold tracking-widest">
              <span className="text-white">WAGER AMOUNT</span>
              <span className={cn("transition-colors duration-300", getRiskColor())}>
                {Math.floor(riskRatio * 100)}% RISK
              </span>
            </div>

            <div className="flex items-end gap-2 mb-4">
               <span className="text-2xl text-white font-bold">${wager}</span>
               <span className="text-xs text-gray-400 mb-1">x {multiplier}</span>
            </div>

            <input
                type="range"
                min="1"
                max={balance}
                value={wager}
                onChange={(e) => setWager(parseInt(e.target.value))}
                className={cn("w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer transition-all duration-300", getSliderColor())}
            />

            <div className="flex justify-between mt-4 gap-2">
                {[10, 25, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setWager(Math.floor(balance * (pct/100)))}
                      className="flex-1 bg-black/40 border border-white/10 hover:border-white/50 text-[10px] py-2 text-gray-300 transition-all hover:bg-white/10"
                    >
                      {pct === 100 ? "MAX" : `${pct}%`}
                    </button>
                ))}
            </div>
          </div>

          {/* DECISION BUTTONS */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleWager('real')}
              className="group relative h-16 bg-black/40 border border-neon-green/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-neon-green/10 group-hover:bg-neon-green/20 transition-all"></div>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neon-green shadow-[0_0_15px_#00ff41]"></div>
              <span className="relative z-10 text-neon-green font-bold text-xl tracking-widest group-hover:scale-110 transition-transform block">
                REAL
              </span>
            </button>

            <button
              onClick={() => handleWager('ai')}
              className="group relative h-16 bg-black/40 border border-neon-red/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-neon-red/10 group-hover:bg-neon-red/20 transition-all"></div>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neon-red shadow-[0_0_15px_#ff003c]"></div>
              <span className="relative z-10 text-neon-red font-bold text-xl tracking-widest group-hover:scale-110 transition-transform block">
                AI
              </span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}