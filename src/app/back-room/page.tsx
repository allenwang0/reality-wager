'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BackRoom() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [task, setTask] = useState({ q: '12 + 15', a: '27' });
  const [input, setInput] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('rw_balance');
    if (saved) setBalance(parseInt(saved));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === task.a) {
      const newBal = balance + 10;
      setBalance(newBal);
      localStorage.setItem('rw_balance', newBal.toString());
      setInput('');

      const a = Math.floor(Math.random() * 50);
      const b = Math.floor(Math.random() * 50);
      setTask({ q: `${a} + ${b}`, a: (a+b).toString() });
    } else {
      alert("ERROR.");
      setInput('');
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md border border-green-800 p-8 bg-green-900/5">
        <h1 className="text-xl mb-4 border-b border-green-800 pb-2">THE BACK ROOM</h1>
        <div className="mb-8 text-sm opacity-70">
          EARN SUFFICIENT FUNDS ($50) TO RETURN TO THE TABLE.
        </div>

        <div className="text-3xl mb-4 text-white">{task.q} = ?</div>

        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            autoFocus
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="bg-black border border-green-600 p-2 flex-1 text-white focus:outline-none"
          />
          <button type="submit" className="bg-green-700 text-black px-6 font-bold">OK</button>
        </form>

        <div className="mt-8 flex justify-between items-center">
          <div>CURRENT: ${balance}</div>
          {balance >= 50 && (
             <button onClick={() => router.push('/play')} className="underline text-white">
               RETURN TO CASINO
             </button>
          )}
        </div>
      </div>
    </div>
  );
}