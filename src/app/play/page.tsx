'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getHandBatch, submitWager, type GameImage } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import GameCard from '@/components/GameCard';

export default function PlayPage() {
  const [balance, setBalance] = useState<number>(1000);

  // QUEUE SYSTEM
  const [deck, setDeck] = useState<GameImage[]>([]);
  const [history, setHistory] = useState<string[]>([]); // To prevent immediate repeats

  const [result, setResult] = useState<any>(null);
  const [wager, setWager] = useState<number>(50);

  // Loading States
  const [loadingResult, setLoadingResult] = useState(false); // Waiting for bet result
  const [fetchingDeck, setFetchingDeck] = useState(false); // Waiting for new images

  const [isBankrupt, setIsBankrupt] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { data } = await supabase.auth.signInAnonymously();
        user = data.user;
      }
      await loadBalance(user?.id);
      await fetchMoreCards(true); // Initial fetch
    };
    init();
  }, []);

  // --- QUEUE LOGIC ---
  async function fetchMoreCards(isInitial = false) {
    if (fetchingDeck) return;
    setFetchingDeck(true);
    try {
      const { images } = await getHandBatch(8);

      setDeck(prev => {
        // Filter out images we've just seen or are already in the deck
        const currentIds = new Set(prev.map(i => i.id));
        const newUnique = images.filter(img => !currentIds.has(img.id) && !history.includes(img.id));
        return [...prev, ...newUnique];
      });

    } catch (e) {
      console.error("Deck Fetch Error", e);
    } finally {
      setFetchingDeck(false);
    }
  }

  // Called when we finish a round
  const nextCard = () => {
    setResult(null);
    setErrorMsg(null);

    setDeck(prev => {
      const finishedCard = prev[0];
      // Add to history to avoid repeat soon
      if (finishedCard) {
        setHistory(h => [...h.slice(-20), finishedCard.id]);
      }
      return prev.slice(1); // Remove the first card
    });
  };

  // Monitor deck size, refuel if low
  useEffect(() => {
    if (deck.length < 4 && !fetchingDeck) {
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
    if (wager > balance || loadingResult) return;

    setLoadingResult(true);
    setErrorMsg(null);

    try {
      const currentImage = deck[0];
      const res = await submitWager(currentImage.id, wager, guess);

      // Handle Bankrupt
      if (res?.error === 'BANKRUPT') {
          setIsBankrupt(true);
          return;
      }

      // 3. FIX: Handle Resync Silently
      if (res?.error === 'RESYNC_NEEDED' || res?.error === 'INSUFFICIENT_FUNDS') {
        if (res.server_balance !== undefined) {
            setBalance(res.server_balance);
            // Auto-adjust wager
            if (wager > res.server_balance) setWager(Math.floor(res.server_balance));
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
        if (res.new_balance < 10) setIsBankrupt(true);
        else if (wager > res.new_balance) setWager(Math.floor(res.new_balance / 2));
      }
    } catch (e) {
      setErrorMsg("Connection Error");
    } finally {
      setLoadingResult(false);
    }
  };

  const riskRatio = balance > 0 ? (wager / balance) : 0;
  const currentImage = deck[0];

  if (isBankrupt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center font-mono">
         <h1 className="text-6xl font-bold mb-4 text-red-600">BANKRUPT</h1>
         <Link href="/back-room" className="bg-red-600 text-black font-bold text-2xl px-8 py-4 border-4 border-white hover:bg-white hover:text-red-600 transition-all">
           GO TO BACK ROOM &rarr;
         </Link>
      </div>
    )
  }

  if (!currentImage) return <div className="min-h-screen flex items-center justify-center font-bold text-2xl animate-pulse">ESTABLISHING UPLINK...</div>;

  return (
    <div className="min-h-screen max-w-md mx-auto p-6 flex flex-col font-mono text-black">

      {/* 4. PRELOADER: Hidden images for the next 2 items in queue */}
      <div className="hidden">
        {deck.slice(1, 4).map(img => <img key={img.id} src={img.url} alt="preload" />)}
      </div>

      {/* HEADER */}
      <div className="comic-box p-4 mb-8 flex justify-between items-start bg-white relative">
        <div className={`absolute -top-3 -right-3 text-[10px] font-bold px-2 py-1 border-2 border-black bg-green-400`}>
            ● LIVE SIGNAL
        </div>
        <div>
          <span className="text-xs font-bold bg-black text-white px-1">BANKROLL</span>
          <div className="text-4xl font-bold mt-1">${balance}</div>
        </div>
        <div className="text-right mt-2">
          <span className="text-xs font-bold text-gray-500">QUEUE: {deck.length}</span>
          <div className="text-2xl font-bold">${wager}</div>
        </div>
      </div>

      {/* GAME AREA */}
      <div className="relative mb-8">
        {/* We key by ID to force a fresh remount on change, clearing error states */}
        <GameCard
            key={currentImage.id}
            src={currentImage.url}
            onSkip={nextCard}
        />

        {/* OVERLAY */}
        {result && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-white/95 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="comic-box p-6 w-full text-center shadow-2xl">
              <div className="text-6xl font-black mb-2 uppercase italic transform -rotate-3 drop-shadow-md">
                {result.isCorrect ? <span className="text-green-600">YES!</span> : <span className="text-red-600">NO!</span>}
              </div>
              <div className="text-3xl font-bold mb-4">
                {result.profit > 0 ? '+' : ''}{result.profit}
              </div>

              <div className="text-xs text-gray-500 mb-6 border-t border-gray-200 pt-4">
                DATA SOURCE:<br/>
                <span className="font-bold text-black">{result.source}</span>
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
             <div className="flex justify-between text-xs font-bold mb-2">
               <span>RISK: {Math.floor(riskRatio * 100)}%</span>
               <span>MAX: ${balance}</span>
             </div>
             <input
                type="range" min="1" max={balance} value={wager}
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
             <div className="text-center font-bold text-black bg-yellow-400 border-2 border-black p-2 animate-bounce">
                ⚠ {errorMsg}
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleWager('real')} disabled={loadingResult} className="comic-button h-24 bg-green-400 text-3xl font-black hover:bg-green-500 active:bg-green-600 transition-colors">REAL</button>
            <button onClick={() => handleWager('ai')} disabled={loadingResult} className="comic-button h-24 bg-pink-500 text-3xl font-black hover:bg-pink-600 active:bg-pink-700 transition-colors">AI</button>
          </div>
        </div>
      )}
    </div>
  );
}