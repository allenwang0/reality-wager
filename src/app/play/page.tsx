'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getHandBatch, submitWager, type GameImage } from '@/app/actions';
import { ImageCategory } from '@/data/image-bank';
import { createClient } from '@/lib/supabase/client';
import GameCard from '@/components/GameCard';

// ONBOARDING COMPONENT
function ProtocolBriefing({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="max-w-lg w-full border-2 border-protocol-signal p-6 bg-black relative">
        <h2 className="text-2xl font-bold text-protocol-signal mb-4 uppercase tracking-widest border-b border-gray-800 pb-2">
          Protocol V.2.0
        </h2>
        <div className="space-y-4 text-sm font-mono text-gray-300 mb-8">
          <p>
            <span className="text-white font-bold">1. SIGNAL VS NOISE:</span><br/>
            You will be shown imagery. <span className="text-protocol-signal">REAL</span> = Photography (Humans, Objects, Nature). <span className="text-protocol-noise">AI</span> = Generated, 3D Rendered, or Simulated.
          </p>
          <p>
            <span className="text-white font-bold">2. RISK ASSESSMENT:</span><br/>
            Payouts scale with risk. Betting 100% of your bankroll yields 2.0x returns. Betting safe yields lower multipliers.
          </p>
          <p>
            <span className="text-white font-bold">3. INSOLVENCY:</span><br/>
            Drop below $10 and your clearance is revoked. You will be sent to the Back Room for manual labor.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-protocol-signal text-black font-bold py-3 hover:bg-white transition-colors uppercase tracking-widest"
        >
          [ Acknowledge & Begin ]
        </button>
      </div>
    </div>
  );
}

export default function PlayPage() {
  const [balance, setBalance] = useState<number>(1000);
  const [deck, setDeck] = useState<GameImage[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [result, setResult] = useState<any>(null);

  // Game Mode State
  const [category, setCategory] = useState<ImageCategory>('general');

  // Wager State
  const [wagerMode, setWagerMode] = useState<'percent' | 'custom'>('percent');
  const [wagerPercent, setWagerPercent] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>("");

  const [loadingResult, setLoadingResult] = useState(false);
  const [fetchingDeck, setFetchingDeck] = useState(false);
  const [isBankrupt, setIsBankrupt] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Calculate Wager & Profit Potential
  const currentWagerAmount = wagerMode === 'percent'
    ? Math.max(1, Math.floor(balance * (wagerPercent / 100)))
    : Math.min(balance, Math.max(1, parseInt(customAmount) || 0));

  const riskRatio = balance > 0 ? currentWagerAmount / balance : 0;
  const estMultiplier = 1.2 + (riskRatio * 0.8);
  const potentialProfit = Math.floor(currentWagerAmount * (estMultiplier - 1));

  // Initial Load & Tutorial Check
  useEffect(() => {
    const init = async () => {
      const hasSeenTutorial = localStorage.getItem('reality_wager_tutorial');
      if (!hasSeenTutorial) setShowTutorial(true);

      const supabase = createClient();
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { data } = await supabase.auth.signInAnonymously();
        user = data.user;
      }
      if(user) await loadBalance(user.id);
      await fetchMoreCards(true, 'general');
    };
    init();
  }, []);

  const closeTutorial = () => {
    localStorage.setItem('reality_wager_tutorial', 'true');
    setShowTutorial(false);
  }

  // AGGRESSIVE PRELOADING LOGIC
  useEffect(() => {
    if (deck.length > 1) {
      deck.slice(1, 6).forEach((img) => {
        const i = new Image();
        i.src = img.url;
      });
    }
  }, [deck]);

  // Deck Management
  async function fetchMoreCards(isInitial = false, forceCategory?: ImageCategory) {
    if (fetchingDeck) return;
    setFetchingDeck(true);
    try {
      // Pass the current category (or forced one) to the server action
      const targetCategory = forceCategory || category;
      const { images } = await getHandBatch(15, targetCategory);

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

  // Handle Category Change
  const handleCategoryChange = (newCat: string) => {
    const cat = newCat as ImageCategory;
    if (cat === category) return;

    // 1. Set State
    setCategory(cat);

    // 2. Clear deck to force loading state/refresh
    setDeck([]);
    setHistory([]);
    setResult(null);

    // 3. Fetch new cards with new category immediately
    fetchMoreCards(false, cat);
  };

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
    if (currentWagerAmount <= 0) {
      setErrorMsg("INVALID WAGER");
      return;
    }

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

  if (!currentImage) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center font-mono bg-protocol-black text-white">
              <div className="text-xs font-bold tracking-[0.5em] mb-4 text-gray-500">TUNING FREQUENCY...</div>
              <div className="w-48 h-px bg-gray-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white animate-[scan_1.5s_ease-in-out_infinite] transform translate-x-[-100%]"></div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col font-mono text-white max-w-6xl mx-auto">
      {showTutorial && <ProtocolBriefing onClose={closeTutorial} />}

      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 }}>
        {deck.slice(1, 6).map(img => <img key={img.id} src={img.url} alt="preload" decoding="sync" />)}
      </div>

      {/* DESKTOP HEADER */}
      <div className="flex justify-between items-end border-b border-protocol-gray pb-4 mb-6">
        <div>
           <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Operator Funds</div>
           <div className="text-3xl font-bold tracking-tighter">${balance.toLocaleString()}</div>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
              <div className="text-xs text-gray-500 uppercase">Streak</div>
              <div className="text-xl font-bold text-protocol-signal">{streak}</div>
           </div>
           <div className="text-right">
              <div className="text-xs text-gray-500 uppercase">Latency</div>
              <div className="text-xl font-bold text-gray-600">12ms</div>
           </div>
        </div>
      </div>

      {/* RESPONSIVE LAYOUT GRID */}
      <div className="grow grid grid-cols-1 md:grid-cols-[1fr_350px] gap-6 md:gap-12">

        {/* LEFT COL: IMAGE */}
        <div className="relative flex flex-col justify-center">
          <div className="relative aspect-[4/3] md:aspect-auto md:h-[600px] w-full">
            <GameCard
                key={currentImage.id}
                src={currentImage.url}
                onSkip={nextCard}
            />
            {result && (
              <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 border border-white/20">
                <div className="w-full text-center py-8">
                  <div className="text-6xl font-black mb-4 uppercase tracking-tighter italic">
                    {result.isCorrect ? <span className="text-protocol-signal">VERIFIED</span> : <span className="text-protocol-noise">ERROR</span>}
                  </div>
                  <div className="text-3xl font-mono mb-2 text-white">
                    {result.profit > 0 ? '+' : ''}{result.profit} CREDITS
                  </div>
                  <div className="text-[10px] text-gray-500 mb-8 uppercase tracking-widest">
                    Source: {result.source}
                  </div>
                  <button onClick={nextCard} className="protocol-btn px-8 py-4 font-bold mx-auto border-white text-white hover:bg-white hover:text-black">
                    [ NEXT SUBJECT ]
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COL: CONTROL PANEL */}
        {!result && (
          <div className="flex flex-col justify-center space-y-6">

            {/* NEW FEATURE: Signal Frequency Selector */}
            <div className="bg-protocol-dark border border-protocol-gray p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Signal Frequency</div>
              <div className="grid grid-cols-4 gap-2">
                {['general', 'faces', 'places', 'art'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`text-[10px] uppercase py-2 border transition-colors ${
                      category === cat
                      ? 'bg-protocol-white text-black border-white'
                      : 'text-gray-500 border-gray-800 hover:border-gray-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Wager Controls */}
            <div className="bg-protocol-dark border border-protocol-gray p-4">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest">Wager Input</span>
                 <div className="flex space-x-2">
                    <button
                      onClick={() => setWagerMode('percent')}
                      className={`text-[10px] uppercase ${wagerMode === 'percent' ? 'text-white underline' : 'text-gray-600'}`}
                    >Percent</button>
                    <button
                      onClick={() => setWagerMode('custom')}
                      className={`text-[10px] uppercase ${wagerMode === 'custom' ? 'text-white underline' : 'text-gray-600'}`}
                    >Custom</button>
                 </div>
               </div>

               {wagerMode === 'percent' ? (
                 <div className="grid grid-cols-4 gap-2 mb-4">
                   {[10, 25, 50, 100].map((pct) => (
                      <button
                          key={pct}
                          onClick={() => setWagerPercent(pct)}
                          className={`py-2 text-xs font-bold border transition-all ${wagerPercent === pct ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}
                      >
                          {pct}%
                      </button>
                   ))}
                 </div>
               ) : (
                  <div className="mb-4 relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter Amount"
                      className="w-full bg-black border border-gray-600 p-2 pl-6 text-white font-mono focus:border-protocol-signal focus:outline-none"
                    />
                  </div>
               )}

               <div className="border-t border-gray-800 pt-3">
                 <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Total Wager:</span>
                    <span className="text-white font-bold">${currentWagerAmount}</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Potential Return:</span>
                    <span className="text-protocol-signal font-bold">+${potentialProfit}</span>
                 </div>
               </div>
            </div>

            {errorMsg && (
               <div className="text-center text-[10px] text-protocol-noise border border-protocol-noise p-2 uppercase tracking-widest animate-pulse">
                  ⚠ {errorMsg}
               </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                  onClick={() => handleWager('real')}
                  disabled={loadingResult}
                  className="h-24 bg-transparent text-white font-bold text-2xl border border-gray-600 hover:bg-white hover:text-black hover:border-white transition-all uppercase tracking-widest disabled:opacity-50"
              >
                  REAL
              </button>
              <button
                  onClick={() => handleWager('ai')}
                  disabled={loadingResult}
                  className="h-24 bg-transparent text-white font-bold text-2xl border border-gray-600 hover:bg-protocol-noise hover:text-white hover:border-protocol-noise transition-all uppercase tracking-widest disabled:opacity-50"
              >
                  AI
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}