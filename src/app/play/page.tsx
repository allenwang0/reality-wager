'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GAME_IMAGES } from '@/data/images';
import GameCard from '@/components/GameCard';
import ResultOverlay from '@/components/ResultOverlay';

export default function PlayPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(1000);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState<any>(null);

  // 1. Load Data on Mount
  useEffect(() => {
    const savedBal = localStorage.getItem('rw_balance');
    if (savedBal) setBalance(parseInt(savedBal));

    // Randomize start image if you want, or just start at 0
    setCurrentIdx(Math.floor(Math.random() * GAME_IMAGES.length));
  }, []);

  // 2. Save Balance on Change
  useEffect(() => {
    localStorage.setItem('rw_balance', balance.toString());
  }, [balance]);

  const currentImage = GAME_IMAGES[currentIdx % GAME_IMAGES.length];

  const handleWager = (guess: 'real' | 'ai', tierIdx: number) => {
    // Tiers: 0=Skeptical(1.2x), 1=Confident(1.5x), 2=AllIn(2.0x)
    const tiers = [
      { pct: 0.05, mult: 1.2 },
      { pct: 0.20, mult: 1.5 },
      { pct: 0.50, mult: 2.0 }
    ];

    const config = tiers[tierIdx];
    const wager = Math.floor(balance * config.pct);

    // Bankruptcy Check
    if (wager < 10) {
      router.push('/back-room');
      return;
    }

    const isCorrect = guess === currentImage.type;
    let profit = 0;
    let newBalance = balance;

    if (isCorrect) {
      profit = Math.floor(wager * (config.mult - 1));
      newBalance += profit;
    } else {
      profit = -wager;
      newBalance -= wager;
    }

    setBalance(newBalance);
    setResult({ isCorrect, profit, source: currentImage.source });
  };

  const nextHand = () => {
    setResult(null);
    setCurrentIdx(prev => prev + 1);
  };

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto flex flex-col justify-center">
      {/* HUD */}
      <div className="flex justify-between items-end border-b border-cyber-border pb-4 mb-6">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest">Balance</div>
          <div className="text-3xl font-mono text-neon-green">${balance}</div>
        </div>
        <div className="text-right text-xs text-gray-500">ID: {currentImage.id}</div>
      </div>

      <div className="relative">
        <GameCard src={currentImage.src} />

        {result && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <ResultOverlay result={result} onNext={nextHand} />
          </div>
        )}
      </div>

      {/* Controls */}
      {!result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center text-gray-500 mb-2">
            <span>5% RISK</span>
            <span>20% RISK</span>
            <span>50% RISK</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* REAL BUTTONS */}
             <div className="space-y-2">
                {[0, 1, 2].map((tier) => (
                  <button
                    key={`real-${tier}`}
                    onClick={() => handleWager('real', tier)}
                    className="w-full bg-green-900/20 border border-green-600 text-green-500 py-3 hover:bg-green-500 hover:text-black transition-colors uppercase text-sm font-bold"
                  >
                    REAL ({tier === 0 ? 'Low' : tier === 1 ? 'Med' : 'High'})
                  </button>
                ))}
             </div>

             {/* AI BUTTONS */}
             <div className="space-y-2">
                {[0, 1, 2].map((tier) => (
                  <button
                    key={`ai-${tier}`}
                    onClick={() => handleWager('ai', tier)}
                    className="w-full bg-red-900/20 border border-red-600 text-red-500 py-3 hover:bg-red-500 hover:text-black transition-colors uppercase text-sm font-bold"
                  >
                    AI ({tier === 0 ? 'Low' : tier === 1 ? 'Med' : 'High'})
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}