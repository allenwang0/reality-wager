'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateProblem, submitManualLabor } from '@/app/actions';

export default function BackRoomPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [problem, setProblem] = useState({ q: "Initializing...", hash: "" });
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [released, setReleased] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadBalance();
    fetchNewProblem();
  }, []);

  async function loadBalance() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('current_balance').eq('id', user.id).single();
      if (data) {
        setBalance(data.current_balance);
        if (data.current_balance >= 50) setReleased(true);
      }
    }
  }

  async function fetchNewProblem() {
      const p = await generateProblem();
      setProblem({ q: p.question, hash: p.hash });
      setUserAnswer("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseInt(userAnswer);
    if (isNaN(val)) return;

    // Send answer AND hash to server for verification
    const res = await submitManualLabor(val, problem.hash, streak);

    if (res.success) {
      setBalance(res.new_balance || balance);
      const bonusText = streak > 0 ? ` (+${streak} BONUS)` : '';
      setFeedback(`EARNED $${res.wage}${bonusText}`);
      setStreak(s => s + 1);

      if (res.released) setReleased(true);
      fetchNewProblem();
    } else {
      setFeedback(res.message || "ERROR");
      setStreak(0);
    }
  }

  if (released) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8 border-8 border-black font-mono">
        <h1 className="text-4xl font-bold mb-6">DEBT CLEARED</h1>
        <p className="mb-8">YOU ARE FREE TO WAGER AGAIN.</p>
        <button
          onClick={() => router.push('/play')}
          className="text-2xl px-8 py-4 bg-green-400 text-black border-4 border-black font-bold hover:translate-x-1 hover:translate-y-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          RETURN TO CASINO
        </button>
      </div>
    );
  }

  // Calculate remaining work
  const wage = 5 + Math.min(streak, 10);
  const remaining = Math.max(0, Math.ceil((50 - balance) / wage));
  const progressPercent = Math.min(100, Math.max(0, (balance / 50) * 100));

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md bg-black border-4 border-gray-600 p-8 shadow-2xl relative overflow-hidden">

        {/* Striped Background Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#333_10px,#333_20px)]"></div>

        <div className="mb-8 text-center border-b border-gray-600 pb-4 relative z-10">
          <h1 className="text-red-500 font-bold tracking-widest text-xl mb-2">THE BACK ROOM</h1>
          <p className="text-gray-400 text-xs">WORK OFF YOUR DEBT. TARGET: $50</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 bg-gray-800 border border-gray-600 mb-8 relative">
            <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
            ></div>
        </div>

        <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="text-gray-400 text-sm">CURRENT FUNDS</div>
            <div className="text-3xl font-bold text-red-500 font-mono">${balance}</div>
        </div>

        <div className="bg-gray-900 p-6 border-2 border-gray-700 mb-6 text-center relative z-10">
            <div className="flex justify-between items-center mb-4">
                <div className="text-gray-500 text-xs">TASK: SOLVE</div>
                <div className="text-xs font-bold text-yellow-400">COMBO: x{streak + 1}</div>
            </div>
            <div className="text-4xl font-bold">{problem.q} = ?</div>
            <div className="text-[10px] text-gray-500 mt-2">Est. Remaining Tasks: {remaining}</div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-4 relative z-10">
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full bg-black border-2 border-white p-4 text-xl text-center focus:outline-none focus:border-red-500"
            placeholder="Answer"
            autoFocus
          />
          <button
            type="submit"
            className="bg-white text-black font-bold px-6 border-2 border-gray-400 hover:bg-gray-200"
          >
            SUBMIT
          </button>
        </form>

        <div className="h-8 mt-4 text-center text-green-400 font-bold animate-pulse relative z-10">
          {feedback}
        </div>
      </div>
    </div>
  );
}