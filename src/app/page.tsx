import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-black">

      {/* Ambient Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="z-10 flex flex-col items-center max-w-2xl">
        <div className="border border-protocol-gray bg-black/50 backdrop-blur-sm p-2 mb-8 animate-fade-in">
           <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Protocol V.2.0</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-white mix-blend-difference">
          REALITY<br />WAGER
        </h1>

        <div className="h-px w-32 bg-protocol-gray mb-10"></div>

        {/* SIMPLIFIED INSTRUCTIONS */}
        <div className="grid gap-6 mb-12 text-sm font-mono text-gray-400">
          <div className="flex flex-col items-center">
            <span className="text-white font-bold tracking-widest mb-1">[ 1. ANALYZE ]</span>
            <p>Distinguish Signal (Real) from Noise (AI).</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white font-bold tracking-widest mb-1">[ 2. WAGER ]</span>
            <p>Bet Credits. High risk = High reward.</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white font-bold tracking-widest mb-1">[ 3. SURVIVE ]</span>
            <p>Bankruptcy leads to the Back Room.</p>
          </div>
        </div>

        <Link
          href="/play"
          className="group relative px-16 py-5 bg-protocol-white text-black font-bold text-lg tracking-widest overflow-hidden transition-all hover:bg-protocol-signal hover:text-black"
        >
          <span className="relative z-10">[ ENTER PROTOCOL ]</span>
          <div className="absolute inset-0 bg-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-in-out"></div>
        </Link>

        <div className="mt-16 text-[10px] text-gray-600 uppercase tracking-widest">
          Secure Uplink Established
        </div>
      </div>
    </main>
  );
}