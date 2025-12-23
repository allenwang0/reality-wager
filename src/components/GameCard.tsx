/* eslint-disable @next/next/no-img-element */
export default function GameCard({ src }: { src: string }) {
  return (
    <div className="relative w-full aspect-[4/3] bg-white border-4 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <img
        src={src}
        alt="Subject"
        className="w-full h-full object-cover"
      />
    </div>
  );
}