/* eslint-disable @next/next/no-img-element */
export default function GameCard({ src }: { src: string }) {
  return (
    <div className="relative w-full aspect-[4/3] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
      <img
        src={src}
        alt="Subject"
        className="w-full h-full object-cover"
      />
    </div>
  );
}