'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getHandBatch, submitWager, type GameImage } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import GameCard from '@/components/GameCard';

export default function PlayPage() {
  const [balance, setBalance] = useState<number>(1000);

  // QUEUE SYSTEM
  const [deck, setDeck] = useState<GameImage[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);

  const [result, setResult] = useState<any>(null);

  // WAGER LOGIC: Fixed Percentages
  const [wagerPercent, setWagerPercent] = useState<number>(10);

  // Loading States
  const [loadingResult, setLoadingResult] = useState(false);
  const [fetchingDeck, setFetchingDeck] = useState(false);

  const [isBankrupt, setIsBankrupt] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derived Wager Amount
  const currentWagerAmount = Math.max(1, Math.floor(balance * (wagerPercent / 100)));

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { data } = await supabase.auth.signInAnonymously();
        user = data.user;
      }
      await loadBalance(user?.id);
      await fetchMoreCards(true);
    };
    init();
  }, []);

  async function fetchMoreCards(isInitial = false) {
    if (fetchingDeck) return;
    setFetchingDeck(true);
    try {
      const { images } = await getHandBatch(12);

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

  const nextCard = () => {
    setResult(null);
    setErrorMsg(null);
    setDeck(prev => {
      const finishedCard = prev[0];
      if (finishedCard) {
        setHistory(h => {
             const newHist = [...h, finishedCard.id];
             if (newHist.length > 50) return newHist.slice(newHist.length - 50);
             return newHist;
        });
      }
      return prev.slice(1);
    });
  };

  useEffect(() => {
    if (deck.length < 10 && !fetchingDeck) {
      fetchMoreCards();
    }
  }, [deck.length, fetchingDeck]);


  async function loadBalance(userId: string | undefined) {
    if (!userId) return;
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

      if (res?.error === 'RESYNC_NEEDED' || res?.error === 'INSUFFICIENT_FUNDS') {
        if (res.server_balance !== undefined) {
            setBalance(res.server_balance);
            setErrorMsg("Balance Synced. Try Again.");
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
        if (res.isCorrect) setStreak(s => s + 1);
        else setStreak(0);

        if (res.new_balance < 10) setIsBankrupt(true);
      }
    } catch (e) {
      setErrorMsg("Connection Error");
    } finally {
      setLoadingResult(false);
    }
  };

  const currentImage = deck[0];

  if (isBankrupt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center font-mono">
         <h1 className="text-6xl font-bold mb-4 text-red-600">BANKRUPT</h1>
         <p className="mb-8">YOU HAVE LOST THE SIGNAL.</p>
         <Link href="/back-room" className="bg-red-600 text-black font-bold text-2xl px-8 py-4 border-4 border-white hover:bg-white hover:text-red-600 transition-all">
           ENTER THE BACK ROOM &rarr;
         </Link>
      </div>
    )
  }

  // UPDATED: Brutalist Loading Screen
  if (!currentImage) return (
      <div className="min-h-screen flex flex-col items-center justify-center font-mono bg-white text-black p-4">
          <div className="text-4xl font-black mb-6 tracking-tighter">INITIALIZING</div>

          {/* Simple CSS Loading Bar */}
          <div className="w-64 h-8 border-4 border-black p-1 mb-2">
              <div className="h-full bg-black animate-[pulse_1.5s_ease-in-out_infinite]"></div>
          </div>

          <div className="w-64 flex justify-between text-xs font-bold">
              <span>MEM_CHECK: OK</span>
              <span>NET: CONNECTED</span>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen max-w-md mx-auto p-6 flex flex-col font-mono text-black">

      <div className="hidden">
        {deck.slice(1, 6).map(img => <img key={img.id} src={img.url} alt="preload" />)}
      </div>

      {/* HEADER */}
      <div className="comic-box p-4 mb-6 flex justify-between items-start bg-white relative">
        <div className={`absolute -top-3 -right-3 text-[10px] font-bold px-2 py-1 border-2 border-black bg-green-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
            ● LIVE SIGNAL
        </div>
        <div>
          <span className="text-xs font-bold bg-black text-white px-1">BANKROLL</span>
          <div className="text-4xl font-bold mt-1">${balance}</div>
        </div>
        <div className="text-right mt-2">
           <div className="text-xs font-bold text-gray-500 mb-1">STREAK: <span className="text-black">{streak}</span></div>
           <div className="text-2xl font-bold text-neon-red">${currentWagerAmount}</div>
        </div>
      </div>

      {/* GAME AREA */}
      <div className="relative mb-6">
        <GameCard
            key={currentImage.id}
            src={currentImage.url}
            onSkip={nextCard}
        />

        {/* OVERLAY */}
        {result && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-white/95 backdrop-blur-sm animate-in fade-in duration-200 rounded-xl">
            <div className="comic-box p-6 w-full text-center shadow-2xl">
              <div className="text-6xl font-black mb-2 uppercase italic transform -rotate-3 drop-shadow-md">
                {result.isCorrect ? <span className="text-green-600">YES!</span> : <span className="text-red-600">NO!</span>}
              </div>
              <div className="text-3xl font-bold mb-4">
                {result.profit > 0 ? '+' : ''}{result.profit}
              </div>

              <div className="text-xs text-gray-500 mb-6 border-t border-gray-200 pt-4">
                DATA SOURCE:<br/>
                <a href={result.source_url} target="_blank" className="font-bold text-blue-600 underline hover:text-blue-800">
                    {result.source} ↗
                </a>
              </div>

              <button onClick={nextCard} className="comic-button w-full bg-blue-300 py-4 font-bold text-xl hover:bg-blue-400 hover:-translate-y-1 transition-all">
                NEXT SUBJECT &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      {!result && (
        <div className="space-y-6">
          <div className="comic-box p-4 bg-yellow-100">
             <div className="flex justify-between text-xs font-bold mb-4">
               <span>RISK: {wagerPercent}%</span>
               <span>MAX: ${balance}</span>
             </div>

             <div className="grid grid-cols-4 gap-2 h-12">
                 {[10, 25, 50, 100].map((pct) => (
                    <button
                        key={pct}
                        onClick={() => setWagerPercent(pct)}
                        className={`comic-button font-bold text-xs hover:-translate-y-1 transition-transform ${wagerPercent === pct ? 'bg-black text-white' : 'bg-white text-black'}`}
                    >
                        {pct === 100 ? 'ALL IN' : `${pct}%`}
                    </button>
                 ))}
             </div>
          </div>

          {errorMsg && (
             <div className="text-center font-bold text-black bg-yellow-400 border-2 border-black p-2 animate-bounce">
                ⚠ {errorMsg}
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleWager('real')} disabled={loadingResult} className="comic-button h-24 bg-green-400 text-3xl font-black hover:bg-green-500 active:bg-green-600 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">REAL</button>
            <button onClick={() => handleWager('ai')} disabled={loadingResult} className="comic-button h-24 bg-pink-500 text-3xl font-black hover:bg-pink-600 active:bg-pink-700 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">AI</button>
          </div>
        </div>
      )}
    </div>
  );
}