/* eslint-disable @next/next/no-img-element */
'use client';
import { useState } from 'react';

export default function GameCard({ src }: { src: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="relative w-full aspect-[4/3] bg-gray-900 border-4 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-red-500 font-mono text-4xl mb-2">⚠</div>
        <h3 className="text-red-500 font-bold font-mono text-xl uppercase">Data Corrupted</h3>
        <p className="text-gray-500 text-xs mt-2 font-mono">
          IMAGE STREAM INTERRUPTED.<br/>
          PLEASE SKIP TO NEXT SUBJECT.
        </p>
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