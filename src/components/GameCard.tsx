/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useEffect } from 'react';

type GameCardProps = {
  src: string;
  onSkip: () => void;
};

export default function GameCard({ src, onSkip }: GameCardProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reset state when the image source changes (new round)
  useEffect(() => {
    setError(false);
    setLoading(true);
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
      {/* 1. UPDATED: Brutalist/Noise Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 bg-[#e5e5e5] flex flex-col items-center justify-center font-mono overflow-hidden">
            {/* Simple CSS "Static" Effect */}
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#000,#000_1px,transparent_1px,transparent_4px)]"></div>

            <div className="z-10 bg-black text-white px-4 py-2 text-xl font-bold animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                [ DECODING... ]
            </div>
        </div>
      )}

      {/* 2. Image */}
      <img
        src={src}
        alt="Subject"
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
        onError={() => {
            setLoading(false);
            setError(true);
        }}
      />

      {/* 3. Scanline Effect (Visual Polish) */}
      {!loading && !error && (
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,6px_100%]"></div>
      )}
    </div>
  );
}