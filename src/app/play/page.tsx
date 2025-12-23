'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNextHand, submitWager } from '@/app/actions';
import { createClient } from '@/lib/supabase/client'; // Auth client
import GameCard from '@/components/GameCard';
import ResultOverlay from '@/components/ResultOverlay';

export default function PlayPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [image, setImage] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  // 1. Auth & Initial Load
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        // Anonymous login for quick play
        await supabase.auth.signInAnonymously();
      }
      loadHand();
      loadBalance();
    });
  }, []);

  async function loadBalance() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('current_balance').eq('id', user.id).single();
    if (data) setBalance(data.current_balance);
  }

  async function loadHand() {
    setResult(null);
    const { image } = await getNextHand();
    setImage(image);
  }

  const handleWager = async (guess: 'real' | 'ai', tierIdx: number) => {
    const res = await submitWager(image.id, tierIdx, guess);

    if (res?.error === 'BANKRUPT') {
      router.push('/back-room');
      return;
    }

    setBalance(res.new_balance);
    setResult(res);
  };

  if (!image || balance === null) return <div className="p-10 text-neon-green font-mono">CONNECTING TO MAINFRAME...</div>;

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto flex flex-col justify-center">
      {/* HUD */}
      <div className="flex justify-between items-end border-b border-cyber-border pb-4 mb-6">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest">Balance</div>
          <div className="text-3xl font-mono text-neon-green">${balance}</div>
        </div>
      </div>

      <div className="relative">
        <GameCard src={image.url} />
        {result && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <ResultOverlay result={result} onNext={loadHand} />
          </div>
        )}
      </div>

      {!result && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <button onClick={() => handleWager('real', 1)} className="bg-green-900/20 border border-green-600 text-green-500 py-3 font-bold">REAL</button>
          <button onClick={() => handleWager('ai', 1)} className="bg-red-900/20 border border-red-600 text-red-500 py-3 font-bold">AI</button>
        </div>
      )}
    </div>
  );
}