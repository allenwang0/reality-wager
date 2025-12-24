export type ImageCategory = 'general' | 'faces' | 'places' | 'art';

export type ImageEntry = {
  id: string;
  url: string;
  type: 'real' | 'ai';
  category: ImageCategory[];
  source: string;
};

// OPTIMIZATION FIX: Reduced width to 600px and quality to 60.
// This creates "High Stakes" artifacts (making the game harder)
// while making the "Decoding Stream" load time near-instant.
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=60`;

export const IMAGE_BANK: ImageEntry[] = [
  // =========================================================================
  // REAL IMAGES (HARD MODE)
  // Strategy: Perfect symmetry, neon lighting, or alien nature that looks CGI
  // =========================================================================

  // FACES (Real)
  { id: 'r1', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1544005313-94ddf0286df2') },
  { id: 'r2', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1534528741775-53994a69daeb') },
  { id: 'r3', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1531746020798-e6953c6e8e04') },
  { id: 'r4', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1507003211169-0a1dd7228f2d') },
  { id: 'r5', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1500648767791-00dcc994a43e') },

  // PLACES (Real - Brutalism & Neon)
  { id: 'r6', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1486334823288-b795f7dfa5ea') },
  { id: 'r7', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1477415396659-f26b5d9082e6') },
  { id: 'r8', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1493246507139-91e8fad9978e') },
  { id: 'r9', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1550684848-fac1c5b4e853') },
  { id: 'r10', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1518182177546-076619f72d8d') },
  { id: 'r11', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1504198458649-3128b932f49e') },
  { id: 'r12', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1494526585095-c41746248156') },

  // ART (Real - Abstract Photography)
  { id: 'r13', type: 'real', category: ['general', 'art'], source: 'Unsplash', url: unsplash('1518020382338-a7de69f8bf40') },
  { id: 'r14', type: 'real', category: ['general', 'art'], source: 'Unsplash', url: unsplash('1526779259212-939e64788e3c') },
  { id: 'r15', type: 'real', category: ['general', 'art'], source: 'Unsplash', url: unsplash('1550684848-fac1c5b4e853') },
  { id: 'r16', type: 'real', category: ['general', 'art'], source: 'Unsplash', url: unsplash('1547891654-e66ed7ebb968') },
  { id: 'r17', type: 'real', category: ['general', 'art'], source: 'Unsplash', url: unsplash('1463453091185-61582044d556') },

  // =========================================================================
  // AI / SIMULATED IMAGES (HARD MODE)
  // Strategy: Photorealistic rendering, 3D characters, Digital landscapes
  // =========================================================================

  // FACES (AI / 3D)
  { id: 'a1', type: 'ai', category: ['general', 'faces'], source: 'Simulated', url: unsplash('1620641782983-7f61306a9b98') },
  { id: 'a2', type: 'ai', category: ['general', 'faces'], source: 'Simulated', url: unsplash('1535295972055-1c762f4483e5') },
  { id: 'a3', type: 'ai', category: ['general', 'faces'], source: 'Simulated', url: unsplash('1632516422206-8d591e0d77d7') },
  { id: 'a4', type: 'ai', category: ['general', 'faces'], source: 'Simulated', url: unsplash('1617791160505-6f00504e35d9') },
  { id: 'a5', type: 'ai', category: ['general', 'faces'], source: 'Simulated', url: unsplash('1592610530015-8968843513b1') },

  // PLACES (AI / 3D Environments)
  { id: 'a6', type: 'ai', category: ['general', 'places'], source: 'Simulated', url: unsplash('1580927752452-89d86da3fa0a') },
  { id: 'a7', type: 'ai', category: ['general', 'places'], source: 'Simulated', url: unsplash('1614730341194-75c60764fc86') },
  { id: 'a8', type: 'ai', category: ['general', 'places'], source: 'Simulated', url: unsplash('1480796927426-f609979314bd') },
  { id: 'a9', type: 'ai', category: ['general', 'places'], source: 'Simulated', url: unsplash('1550684848-fac1c5b4e853') },
  { id: 'a10', type: 'ai', category: ['general', 'places'], source: 'Simulated', url: unsplash('1614728853975-69c960c7275ef') },

  // ART (AI / Abstract 3D)
  { id: 'a11', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1635070041078-e363dbe005cb') },
  { id: 'a12', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1618005182384-a83a8bd57fbe') },
  { id: 'a13', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1633511116631-042857f6b864') },
  { id: 'a14', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1625841097017-d2182098ba46') },
  { id: 'a15', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1611162617474-5b21e879e113') },
  { id: 'a16', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1634017839464-5c339ebe3cb4') },
  { id: 'a17', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1507146426996-ef05306b995a') },
];

export function getRandomBatch(count: number, category: ImageCategory = 'general'): ImageEntry[] {
  let pool = IMAGE_BANK;
  if (category !== 'general') {
    pool = IMAGE_BANK.filter(img => img.category.includes(category));
  }
  if (pool.length === 0) pool = IMAGE_BANK; // Fallback
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}