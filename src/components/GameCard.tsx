import Image from 'next/image';

export default function GameCard({ src }: { src: string }) {
  return (
    <div className="relative w-full aspect-[4/3] bg-cyber-black border-2 border-cyber-border rounded-lg overflow-hidden group mb-6">
      <div className="absolute inset-0 z-0">
        <Image
          src={src}
          alt="Subject"
          fill
          className="object-cover"
          priority
        />
      </div>
      {/* Glitch Overlay Effect */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none z-10"></div>
      <div className="absolute inset-0 border border-neon-blue opacity-20 z-20 pointer-events-none"></div>
    </div>
  );
}