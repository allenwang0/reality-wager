/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useRef, useState } from 'react';

type GameCardProps = {
  src: string;
  onSkip: () => void;
  isActive?: boolean;
};

export default function GameCard({ src, onSkip, isActive = false }: GameCardProps) {
  // 1. Initialize State
  const [loading, setLoading] = useState(true);
  const [displayError, setDisplayError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // 2. State Derivation (The Fix)
  // We track the 'src' to detect changes BEFORE the render completes.
  // This prevents the "Flash" where the image appears before the loading state resets.
  const [prevSrc, setPrevSrc] = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoading(true);
    setDisplayError(false);
    setRetryCount(0);
  }

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // We removed the setLoading(true) from here because it caused the race condition.

    // If the image is already cached, onLoad may not fire reliably.
    // Defer one frame so the ref is attached to the new <img>.
    const raf = requestAnimationFrame(() => {
      const el = imgRef.current;
      if (el && el.complete && el.naturalWidth > 0) {
        setLoading(false);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [src]);

  // Safety timeout to avoid a permanent spinner if the browser never resolves events.
  useEffect(() => {
    if (!loading) return;

    const timer = setTimeout(() => {
      const el = imgRef.current;
      if (el && el.complete && el.naturalWidth > 0) {
        setLoading(false);
        return;
      }
      // If still not complete after timeout, treat as error.
      handleImageError();
    }, 7000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, src]);

  const handleImageError = () => {
    if (retryCount < 2) {
      setRetryCount((prev) => prev + 1);
      // Skip to keep flow fast; parent will advance deck.
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
        <h3 className="text-protocol-noise font-bold font-mono text-sm uppercase tracking-widest mb-6">
          Signal Terminated
        </h3>
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

      {/* DECODING STREAM UI */}
      {/* Only show if Active AND Loading */}
      {isActive && loading && (
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

      <img
        ref={imgRef}
        src={src}
        alt="Subject"
        decoding="async"
        loading="eager" // Always load eagerly to ensure speed
        // @ts-ignore
        fetchPriority={isActive ? 'high' : 'low'}
        className={[
          'w-full h-full object-cover',
          // CRITICAL CSS FIX:
          // 1. If loading, use 'invisible' to ensure it takes no mouse events or paint focus.
          // 2. If loading, REMOVE 'transition-opacity'. Transitions cause the "fade out" effect which looks like a glitch.
          //    We want it to vanish instantly, then fade IN slowly.
          loading ? 'opacity-0 invisible' : 'opacity-100 visible transition-opacity duration-700',
        ].join(' ')}
        onLoad={() => setLoading(false)}
        onError={handleImageError}
      />

      {/* UI Overlay (Only visible when loaded) */}
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