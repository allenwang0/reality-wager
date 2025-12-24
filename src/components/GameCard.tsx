/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useEffect } from 'react';

type GameCardProps = {
  src: string;
  onSkip: () => void;
  isActive?: boolean; // FIX: Added prop
};

export default function GameCard({ src, onSkip, isActive = false }: GameCardProps) {
  const [loading, setLoading] = useState(true);
  const [displayError, setDisplayError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Reset state when the image source changes (new round)
  useEffect(() => {
    setDisplayError(false);
    setLoading(true);
    setRetryCount(0);
  }, [src]);

  const handleImageError = () => {
    // Auto-skip logic to keep the game fast
    if (retryCount < 2) {
       console.log("Image failed, auto-skipping...");
       setRetryCount(prev => prev + 1);
       onSkip();
    } else {
       setLoading(false);
       setDisplayError(true);
    }
  };

  if (displayError) {
    return (
      <div className="relative w-full aspect-[4/3] bg-protocol-dark border border-protocol-noise/50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-protocol-noise font-mono text-4xl mb-4 animate-pulse">⚠</div>
        <h3 className="text-protocol-noise font-bold font-mono text-sm uppercase tracking-widest mb-6">Signal Terminated</h3>
        <button
          onClick={() => {
            setDisplayError(false);
            onSkip();
          }}
          className="px-6 py-2 border border-protocol-noise text-protocol-noise hover:bg-protocol-noise hover:text-black text-xs uppercase tracking-widest transition-colors"
        >
          [ Force Reconnect ]
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-protocol-black border border-protocol-gray overflow-hidden group">

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-protocol-black flex flex-col items-center justify-center font-mono">
            <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-white animate-blink"></div>
                <div className="text-xs font-bold text-white tracking-widest">DECODING STREAM</div>
            </div>
            <div className="w-32 h-1 bg-gray-800 overflow-hidden">
                <div className="h-full bg-white animate-[scan_1s_ease-in-out_infinite] w-full origin-left transform scale-x-0"></div>
            </div>
        </div>
      )}

      {/* FIX: Optimized Image Loading */}
      <img
        src={src}
        alt="Subject"
        decoding="async" // Async decode prevents main thread blocking
        loading={isActive ? "eager" : "lazy"} // Only eager load active card
        // fetchPriority is a valid attribute in React 19 / Modern Browsers,
        // but TypeScript might complain depending on version. Casting or ignoring if needed.
        // @ts-ignore
        fetchPriority={isActive ? "high" : "auto"}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
        onError={handleImageError}
      />

      {/* UI Overlay */}
      {!loading && (
        <>
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)] z-10"></div>
            <div className="scanline absolute inset-0 z-10 opacity-30"></div>

            <div className="absolute bottom-4 left-4 z-10 flex space-x-4 text-[10px] uppercase tracking-widest text-white/50 font-bold">
                <span>SRC: ENCRYPTED</span>
                <span>RES: 4K</span>
            </div>
        </>
      )}
    </div>
  );
}