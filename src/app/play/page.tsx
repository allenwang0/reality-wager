'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getHandBatch, submitWager, type GameImage } from '@/app/actions';
import { ImageCategory } from '@/data/image-bank';
import { createClient } from '@/lib/supabase/client';
import GameCard from '@/components/GameCard';
import ResultOverlay from '@/components/ResultOverlay';

// ... Keep ProtocolBriefing component as is ...
function ProtocolBriefing({ onClose }: { onClose: () => void }) {
  // ... existing code ...
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="max-w-md w-full border-2 border-protocol-signal p-6 bg-black relative shadow-[0_0_50px_rgba(0,255,50,0.1)]">
        <h2 className="text-xl font-bold text-protocol-signal mb-6 uppercase tracking-widest border-b border-gray-800 pb-2">
          Operator Briefing
        </h2>
        <div className="space-y-6 text-sm font-mono text-gray-300 mb-8">
          <div><strong className="text-white block mb-1">1. IDENTIFY</strong><p>Real (Photo) vs AI (Generated).</p></div>
          <div><strong className="text-white block mb-1">2. WAGER</strong><p>High Wager = High Multiplier.</p></div>
          <div><strong className="text-white block mb-1">3. CONSEQUENCE</strong><p>Debt leads to manual labor.</p></div>
        </div>
        <button onClick={onClose} className="w-full bg-protocol-signal text-black font-bold py-4 hover:bg-white transition-colors uppercase tracking-widest text-sm">[ I Understand ]</button>
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

  // Refs to prevent closure staleness
  const historyRef = useRef<string[]>([]);
  useEffect(() => { historyRef.current = history; }, [history]);

  // Game Settings
  const [category, setCategory] = useState<ImageCategory>('general');
  const [wagerMode, setWagerMode] = useState<'percent' | 'custom'>('percent');
  const [wagerPercent, setWagerPercent] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [showWagerPanel, setShowWagerPanel] = useState(false);

  const [loadingResult, setLoadingResult] = useState(false);
  const [fetchingDeck, setFetchingDeck] = useState(false);
  const [isBankrupt, setIsBankrupt] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Derived Values
  const currentWagerAmount = wagerMode === 'percent'
    ? Math.max(1, Math.floor(balance * (wagerPercent / 100)))
    : Math.min(balance, Math.max(1, parseInt(customAmount) || 0));

  const riskRatio = balance > 0 ? currentWagerAmount / balance : 0;
  const potentialProfit = Math.floor(currentWagerAmount * (1.2 + (riskRatio * 0.8) - 1));

  // Init
  useEffect(() => {
    const init = async () => {
      const hasSeen = localStorage.getItem('reality_wager_tutorial');
      if (!hasSeen) setShowTutorial(true);
      const supabase = createClient();
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { data } = await supabase.auth.signInAnonymously();
        user = data.user;
      }
      if (user) loadBalance(user.id);
      fetchMoreCards(true, 'general');
    };
    init();
  }, []);

  const closeTutorial = () => {
    localStorage.setItem('reality_wager_tutorial', 'true');
    setShowTutorial(false);
  }

  // --- FETCHING LOGIC ---
  async function fetchMoreCards(isInitial = false, forceCategory?: ImageCategory) {
    if (fetchingDeck) return;
    setFetchingDeck(true);
    try {
      const targetCategory = forceCategory || category;
      const { images } = await getHandBatch(15, targetCategory);

      setDeck(prev => {
        const currentIds = new Set(prev.map(i => i.id));
        const hist = historyRef.current;
        let newUnique = images.filter(img => !currentIds.has(img.id) && !hist.includes(img.id));

        // Fallback if we run out of unique images
        if (newUnique.length === 0 && images.length > 0) {
           setHistory([]);
           newUnique = images;
        }
        return [...prev, ...newUnique];
      });
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingDeck(false);
    }
  }

  // Infinite Scroll Trigger
  useEffect(() => {
    if (deck.length < 5 && !fetchingDeck) fetchMoreCards();
  }, [deck.length, fetchingDeck]);

  const handleCategoryChange = (newCat: string) => {
    const cat = newCat as ImageCategory;
    if (cat === category) return;
    setCategory(cat);
    setDeck([]);
    setHistory([]);
    setResult(null);
    fetchMoreCards(false, cat);
  };

  const nextCard = () => {
    setResult(null);
    setErrorMsg(null);
    setDeck(prev => {
      const finishedCard = prev[0];
      if (finishedCard) {
        setHistory(h => [...h, finishedCard.id].slice(-50));
      }
      return prev.slice(1); // This promotes index 1 to index 0 instantly
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
    if (!deck[0] || loadingResult) return;
    if (currentWagerAmount > balance) { setErrorMsg("FUNDS LOW"); return; }
    if (currentWagerAmount <= 0) { setErrorMsg("INVALID WAGER"); return; }

    setLoadingResult(true);
    setErrorMsg(null);

    try {
      const res = await submitWager(deck[0].id, currentWagerAmount, guess);

      if (res?.error === 'BANKRUPT') { setIsBankrupt(true); return; }
      if (res?.error) { setErrorMsg(res.error); return; }

      if (res?.new_balance !== undefined) {
        setBalance(res.new_balance);
        setResult(res);
        if (res.isCorrect) setStreak(s => s + 1);
        else setStreak(0);
        if (res.new_balance < 10) setIsBankrupt(true);
      }
    } catch (e) {
      setErrorMsg("Connection Lost");
    } finally {
      setLoadingResult(false);
    }
  };

  if (isBankrupt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center font-mono border-4 border-red-900">
         <div className="text-red-600 text-6xl mb-4 font-bold tracking-widest animate-pulse">TERMINATED</div>
         <p className="mb-8 text-gray-400 text-sm">FUNDS DEPLETED. ASSETS FROZEN.</p>
         <Link href="/back-room" className="protocol-btn px-8 py-4 text-white border-white hover:bg-white hover:text-black transition-all">[ ENTER BACK ROOM ]</Link>
      </div>
    )
  }

  if (deck.length === 0) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center font-mono bg-protocol-black text-white">
              <div className="text-xs font-bold tracking-[0.5em] mb-4 text-gray-500">TUNING FREQUENCY...</div>
              <div className="w-48 h-px bg-gray-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white animate-[scan_1.5s_ease-in-out_infinite] transform translate-x-[-100%]"></div>
              </div>
          </div>
      );
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col font-mono text-white max-w-6xl mx-auto">
      {showTutorial && <ProtocolBriefing onClose={closeTutorial} />}

      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-protocol-gray pb-4 mb-4 z-20 relative bg-black/50 backdrop-blur-sm">
        <div className="flex items-end gap-4">
           <div>
             <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Funds</div>
             <div className="text-2xl md:text-3xl font-bold tracking-tighter">${balance.toLocaleString()}</div>
           </div>
           <button onClick={() => setShowTutorial(true)} className="mb-1 text-[10px] text-protocol-signal border border-protocol-signal px-2 py-1 hover:bg-protocol-signal hover:text-black">[?] HELP</button>
        </div>
        <div className="text-right">
           <div className="text-[10px] text-gray-500 uppercase">Streak</div>
           <div className="text-xl font-bold text-protocol-signal">{streak}</div>
        </div>
      </div>

      <div className="grow grid grid-cols-1 md:grid-cols-[1fr_350px] gap-6">

        {/* --- IMAGE STACK (THE FIX) --- */}
        <div className="relative flex flex-col justify-center min-h-[400px]">
          <div className="relative aspect-[4/3] md:aspect-auto md:h-[600px] w-full isolate">

            {/* We render the first 2 cards. Index 0 is visible. Index 1 is hidden behind but loading. */}
            {deck.slice(0, 2).reverse().map((image, index, array) => {
               // Logic: If array length is 2, index 0 is the NEXT card (bottom), index 1 is CURRENT (top).
               // If array length is 1, index 0 is CURRENT.
               const isTopCard = index === array.length - 1;

               return (
                 <div
                    key={image.id}
                    className={`absolute inset-0 transition-all duration-300 ${isTopCard ? 'z-10' : 'z-0 scale-95 opacity-50'}`}
                 >
                    <GameCard
                      src={image.url}
                      onSkip={nextCard}
                      isActive={isTopCard}
                    />
                    {isTopCard && result && (
                      <div className="absolute inset-0 z-30">
                        <ResultOverlay result={result} onNext={nextCard} />
                      </div>
                    )}
                 </div>
               )
            })}
          </div>
        </div>

        {/* CONTROLS */}
        {!result && (
          <div className="flex flex-col space-y-4 z-20">
            <button onClick={() => setShowWagerPanel(!showWagerPanel)} className="md:hidden w-full py-2 bg-gray-900 border border-gray-700 text-xs text-gray-400 uppercase tracking-widest">
                {showWagerPanel ? 'Hide Settings' : 'Adjust Settings'}
            </button>

            <div className={`${showWagerPanel ? 'block' : 'hidden'} md:block space-y-4`}>
                <div className="bg-protocol-dark border border-protocol-gray p-3">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Frequency</div>
                    <div className="grid grid-cols-4 gap-1">
                        {['general', 'faces', 'places', 'art'].map((cat) => (
                        <button key={cat} onClick={() => handleCategoryChange(cat)} className={`text-[9px] uppercase py-2 border ${category === cat ? 'bg-white text-black' : 'text-gray-500 border-gray-800'}`}>{cat}</button>
                        ))}
                    </div>
                </div>

                <div className="bg-protocol-dark border border-protocol-gray p-3">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] text-gray-500 uppercase">Wager</span>
                        <div className="flex space-x-2">
                            <button onClick={() => setWagerMode('percent')} className={`text-[10px] ${wagerMode === 'percent' ? 'text-white' : 'text-gray-600'}`}>%</button>
                            <button onClick={() => setWagerMode('custom')} className={`text-[10px] ${wagerMode === 'custom' ? 'text-white' : 'text-gray-600'}`}>$</button>
                        </div>
                    </div>
                    {wagerMode === 'percent' ? (
                        <div className="grid grid-cols-4 gap-1 mb-3">
                        {[10, 25, 50, 100].map((pct) => (
                            <button key={pct} onClick={() => setWagerPercent(pct)} className={`py-2 text-[10px] font-bold border ${wagerPercent === pct ? 'bg-white text-black' : 'border-gray-700 text-gray-500'}`}>{pct}%</button>
                        ))}
                        </div>
                    ) : (
                        <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Amount" className="w-full bg-black border border-gray-600 p-2 text-white font-mono mb-3" />
                    )}
                    <div className="flex justify-between text-[10px] border-t border-gray-800 pt-2">
                        <span className="text-gray-500">Risk: ${currentWagerAmount}</span>
                        <span className="text-protocol-signal">Potential: +${potentialProfit}</span>
                    </div>
                </div>
            </div>

            {errorMsg && <div className="text-center text-[10px] text-protocol-noise border border-protocol-noise p-2">{errorMsg}</div>}

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <button onClick={() => handleWager('real')} disabled={loadingResult} className="h-20 md:h-24 bg-transparent text-white font-bold text-xl border border-gray-600 hover:bg-white hover:text-black transition-all">REAL</button>
              <button onClick={() => handleWager('ai')} disabled={loadingResult} className="h-20 md:h-24 bg-transparent text-white font-bold text-xl border border-gray-600 hover:bg-protocol-noise hover:text-white transition-all">AI</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}