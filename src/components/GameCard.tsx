/* eslint-disable @next/next/no-img-element */
export default function GameCard({ src }: { src: string }) {
  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,255,65,0.1)]">

      {/* The Image */}
      <img
        src={src}
        alt="Subject"
        className="w-full h-full object-cover opacity-90"
      />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      {/* Animated Scanner Line */}
      <div className="absolute left-0 right-0 h-[2px] bg-neon-green shadow-[0_0_15px_#00ff41] animate-scan pointer-events-none z-20"></div>

      {/* UI Elements inside the image */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-[10px] text-neon-green px-2 py-1 border border-neon-green/30">
        ANALYZING...
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/50"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/50"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/50"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/50"></div>
    </div>
  );
}