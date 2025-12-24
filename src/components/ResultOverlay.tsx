type Props = {
  result: {
    isCorrect: boolean;
    profit: number;
    source: string;
    source_url?: string;
  };
  onNext: () => void;
};

export default function ResultOverlay({ result, onNext }: Props) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm text-center border-y border-white py-8">
        <div className="text-6xl font-black mb-4 uppercase tracking-tighter italic">
          {result.isCorrect ? <span className="text-protocol-signal">VERIFIED</span> : <span className="text-protocol-noise">ERROR</span>}
        </div>

        <div className="text-3xl font-mono mb-2 text-white">
          {result.profit > 0 ? '+' : ''}{result.profit} CREDITS
        </div>

        <div className="text-[10px] text-gray-500 mb-8 uppercase tracking-widest">
          Source: {result.source}
        </div>

        {/* Link to source if available */}
        {result.source_url && (
             <a href={result.source_url} target="_blank" rel="noreferrer" className="block text-[10px] text-gray-600 underline mb-4 hover:text-white">
                 [ View Source Data ]
             </a>
        )}

        <button onClick={onNext} className="protocol-btn px-8 py-4 font-bold mx-auto border-white text-white hover:bg-white hover:text-black">
          [ NEXT SUBJECT ]
        </button>
      </div>
    </div>
  );
}