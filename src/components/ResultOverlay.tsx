type Props = {
  result: {
    isCorrect: boolean;
    profit: number;
    source: string;
  };
  onNext: () => void;
};

export default function ResultOverlay({ result, onNext }: Props) {
  return (
    <div className="p-6 border border-white/20 bg-cyber-gray/90 backdrop-blur-md rounded text-center animate-in fade-in zoom-in duration-300">
      <h2 className={`text-3xl font-bold mb-2 ${result.isCorrect ? 'text-neon-green' : 'text-neon-red'}`}>
        {result.isCorrect ? 'ANALYSIS VERIFIED' : 'CRITICAL FAILURE'}
      </h2>

      <div className="text-xl font-mono mb-6">
        {result.profit > 0 ? '+' : ''}{result.profit} CREDITS
      </div>

      {!result.isCorrect && (
        <a
          href={result.source}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-gray-400 underline hover:text-white mb-6 block"
        >
          [ VIEW SOURCE DATA ]
        </a>
      )}

      <button
        onClick={onNext}
        className="w-full bg-neon-blue text-black font-bold py-3 uppercase hover:bg-white transition-colors"
      >
        Next Subject
      </button>
    </div>
  );
}