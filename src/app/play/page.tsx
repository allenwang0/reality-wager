'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getHandBatch, submitWager, type GameImage } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import GameCard from '@/components/GameCard';

export default function PlayPage() {
  const [balance, setBalance] = useState<number>(1000);
  const [deck, setDeck] = useState<GameImage[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [wagerPercent, setWagerPercent] = useState<number>(10);
  const [loadingResult, setLoadingResult] = useState(false);
  const [fetchingDeck, setFetchingDeck] = useState(false);
  const [isBankrupt, setIsBankrupt] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentWagerAmount = Math.max(1, Math.floor(balance * (wagerPercent / 100)));

  // Initial Load
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { data } = await supabase.auth.signInAnonymously();
        user = data.user;
      }
      if(user) await loadBalance(user.id);
      await fetchMoreCards(true);
    };
    init();
  }, []);

  // AGGRESSIVE PRELOADING LOGIC
  useEffect(() => {
    if (deck.length > 1) {
      // Force JS to fetch the next 5 images immediately
      deck.slice(1, 6).forEach((img) => {
        const i = new Image();
        i.src = img.url;
      });
    }
  }, [deck]);

  // Deck Management
  async function fetchMoreCards(isInitial = false) {
    if (fetchingDeck) return;
    setFetchingDeck(true);
    try {
      const { images } = await getHandBatch(15);

      setDeck(prev => {
        const currentIds = new Set(prev.map(i => i.id));
        let newUnique = images.filter(img => !currentIds.has(img.id) && !history.includes(img.id));

        if (newUnique.length < 3 && images.length > 0) {
             setHistory([]);
             newUnique = images.filter(img => !currentIds.has(img.id));
        }
        return [...prev, ...newUnique];
      });
    } catch (e) {
      console.error("Deck Fetch Error", e);
    } finally {
      setFetchingDeck(false);
    }
  }

  // Infinite Scroll Trigger
  useEffect(() => {
    if (deck.length < 8 && !fetchingDeck) {
      fetchMoreCards();
    }
  }, [deck.length, fetchingDeck]);

  const nextCard = () => {
    setResult(null);
    setErrorMsg(null);
    setDeck(prev => {
      const finishedCard = prev[0];
      if (finishedCard) {
        setHistory(h => {
             const newHist = [...h, finishedCard.id];
             return newHist.slice(-50);
        });
      }
      return prev.slice(1);
    });
  };

  async function loadBalance(userId: string) {
    const supabase = createClient();
    const { data } = await supabase.from('profiles').select('current_balance').eq('id', userId).single();
    if (data) {
      setBalance(data.current_balance);
      if (data.current_balance < 10) setIsBankrupt(true);
    }
  }

  const handleWager = async (guess: 'real' | 'ai') => {
    if (!deck[0]) return;
    if (currentWagerAmount > balance || loadingResult) return;

    setLoadingResult(true);
    setErrorMsg(null);

    try {
      const currentImage = deck[0];
      const res = await submitWager(currentImage.id, currentWagerAmount, guess);

      if (res?.error === 'BANKRUPT') {
          setIsBankrupt(true);
          return;
      }
      if (res?.error) {
          setErrorMsg(res.error);
          return;
      }

      if (res?.new_balance !== undefined) {
        setBalance(res.new_balance);
        setResult(res);
        if (res.isCorrect) setStreak(s => s + 1);
        else setStreak(0);
        if (res.new_balance < 10) setIsBankrupt(true);
      }
    } catch (e) {
      setErrorMsg("Network Failure");
    } finally {
      setLoadingResult(false);
    }
  };

  const currentImage = deck[0];

  if (isBankrupt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center font-mono border-4 border-red-900">
         <div className="text-red-600 text-6xl mb-4 font-bold tracking-widest animate-pulse">TERMINATED</div>
         <p className="mb-8 text-gray-400 text-sm">FUNDS DEPLETED. ASSETS FROZEN.</p>
         <Link href="/back-room" className="protocol-btn px-8 py-4 text-white border-white hover:bg-white hover:text-black transition-all">
           [ ENTER BACK ROOM ]
         </Link>
      </div>
    )
  }

  // Pre-load / Empty State
  if (!currentImage) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center font-mono bg-protocol-black text-white">
              <div className="text-xs font-bold tracking-[0.5em] mb-4 text-gray-500">ESTABLISHING UPLINK</div>
              <div className="w-48 h-px bg-gray-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white animate-[scan_1.5s_ease-in-out_infinite] transform translate-x-[-100%]"></div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-4 flex flex-col font-mono text-white">

      {/* GHOST PRELOADER
        Using opacity: 0 ensures the browser considers these "visible"
        and downloads them with high priority, unlike display: none.
      */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 }}>
        {deck.slice(1, 6).map(img => (
            <img key={img.id} src={img.url} alt="preload" decoding="sync" />
        ))}
      </div>

      {/* HEADER */}
      <div className="border-b border-protocol-gray pb-4 mb-6 flex justify-between items-end">
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Current Balance</span>
          <div className="text-3xl font-bold tracking-tighter">${balance.toLocaleString()}</div>
        </div>
        <div className="text-right">
           <div className="flex items-center justify-end space-x-2 text-[10px] text-gray-500 uppercase mb-1">
             <div className={`w-2 h-2 rounded-full ${streak > 0 ? 'bg-protocol-signal' : 'bg-gray-700'}`}></div>
             <span>Streak: {streak}</span>
           </div>
           <div className="text-xl text-protocol-highlight font-bold border border-protocol-gray px-3 py-1 bg-white/5">
             ${currentWagerAmount}
           </div>
        </div>
      </div>

      {/* GAME AREA */}
      <div className="relative mb-8 grow flex flex-col justify-center">
        <GameCard
            key={currentImage.id}
            src={currentImage.url}
            onSkip={nextCard}
        />

        {/* RESULT OVERLAY */}
        {result && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full text-center border-y border-white py-8">
              <div className="text-5xl font-black mb-2 uppercase tracking-tighter italic">
                {result.isCorrect ? <span className="text-protocol-signal">VERIFIED</span> : <span className="text-protocol-noise">ERROR</span>}
              </div>

              <div className="text-2xl font-mono mb-4 text-white">
                {result.profit > 0 ? '+' : ''}{result.profit} CREDITS
              </div>

              <div className="text-[10px] text-gray-500 mb-8 uppercase tracking-widest">
                Source: {result.source}
              </div>

              <button onClick={nextCard} className="protocol-btn w-full mx-auto max-w-[200px] py-4 font-bold">
                [ NEXT SUBJECT ]
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      {!result && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-t border-protocol-gray pt-4">
             <span className="text-[10px] text-gray-500 uppercase">Risk Level</span>
             <div className="flex space-x-1">
                 {[10, 25, 50, 100].map((pct) => (
                    <button
                        key={pct}
                        onClick={() => setWagerPercent(pct)}
                        className={`px-3 py-1 text-[10px] font-bold border transition-colors ${wagerPercent === pct ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600'}`}
                    >
                        {pct}%
                    </button>
                 ))}
             </div>
          </div>

          {errorMsg && (
             <div className="text-center text-[10px] text-protocol-noise border border-protocol-noise p-2 uppercase tracking-widest">
                ⚠ {errorMsg}
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
                onClick={() => handleWager('real')}
                disabled={loadingResult}
                className="h-20 bg-protocol-gray text-white font-bold text-xl border border-protocol-gray hover:bg-white hover:text-black hover:border-white transition-all uppercase tracking-widest disabled:opacity-50"
            >
                REAL
            </button>
            <button
                onClick={() => handleWager('ai')}
                disabled={loadingResult}
                className="h-20 bg-protocol-gray text-white font-bold text-xl border border-protocol-gray hover:bg-protocol-noise hover:text-white hover:border-protocol-noise transition-all uppercase tracking-widest disabled:opacity-50"
            >
                AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}