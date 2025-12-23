import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-green mb-4">
        REALITY WAGER
      </h1>
      <p className="text-gray-400 mb-12 max-w-md text-sm">
        CAN YOU DISTINGUISH THE SIGNAL FROM THE NOISE?
        <br />
        HIGH STAKES IMAGE VERIFICATION PROTOCOL.
      </p>

      <Link
        href="/play"
        className="px-10 py-4 bg-neon-green text-black font-bold text-xl hover:scale-105 transition-transform border-2 border-transparent hover:border-white"
      >
        [ ENTER PROTOCOL ]
      </Link>
    </main>
  );
}