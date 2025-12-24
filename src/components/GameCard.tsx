/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useEffect } from 'react';

type GameCardProps = {
  src: string;
  onSkip: () => void;
};

export default function GameCard({ src, onSkip }: GameCardProps) {
  const [error, setError] = useState(false);

  // Reset error when src changes
  useEffect(() => {
    setError(false);
  }, [src]);

  if (error) {
    return (
      <div className="relative w-full aspect-[4/3] bg-gray-900 border-4 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-red-500 font-mono text-4xl mb-2">⚠</div>
        <h3 className="text-red-500 font-bold font-mono text-xl uppercase">Signal Lost</h3>

        <button
          onClick={() => {
            setError(false);
            onSkip();
          }}
          className="mt-6 bg-red-600 text-white font-mono font-bold px-6 py-3 border-2 border-white hover:bg-white hover:text-red-600 transition-colors uppercase tracking-widest"
        >
          [ Skip Subject ]
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-white border-4 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <img
        src={src}
        alt="Subject"
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}