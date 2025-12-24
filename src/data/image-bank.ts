export type ImageEntry = {
  id: string;
  url: string;
  type: 'real' | 'ai';
  source: string;
};

// Helper to generate Unsplash URLs reliably
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

export const IMAGE_BANK: ImageEntry[] = [
  // --- REAL IMAGES (Unsplash Portraits/Humans) ---
  { id: 'r1', type: 'real', source: 'Unsplash', url: unsplash('1544005313-94ddf0286df2') },
  { id: 'r2', type: 'real', source: 'Unsplash', url: unsplash('1507003211169-0a1dd7228f2d') },
  { id: 'r3', type: 'real', source: 'Unsplash', url: unsplash('1506794778202-cad84cf45f1d') },
  { id: 'r4', type: 'real', source: 'Unsplash', url: unsplash('1534528741775-53994a69daeb') },
  { id: 'r5', type: 'real', source: 'Unsplash', url: unsplash('1531123897727-8f129e1688ce') },
  { id: 'r6', type: 'real', source: 'Unsplash', url: unsplash('1521119989659-a83faa488558') },
  { id: 'r7', type: 'real', source: 'Unsplash', url: unsplash('1542909168-82c3e7fdca5c') },
  { id: 'r8', type: 'real', source: 'Unsplash', url: unsplash('1494790108377-be9c29b29330') },
  { id: 'r9', type: 'real', source: 'Unsplash', url: unsplash('1500648767791-00dcc994a43e') },
  { id: 'r10', type: 'real', source: 'Unsplash', url: unsplash('1535713875002-d1d0cf377fde') },
  { id: 'r11', type: 'real', source: 'Unsplash', url: unsplash('1524504388940-b1c1722653e1') },
  { id: 'r12', type: 'real', source: 'Unsplash', url: unsplash('1438761681033-6461ffad8d80') },
  { id: 'r13', type: 'real', source: 'Unsplash', url: unsplash('1463453091185-61582044d556') },
  { id: 'r14', type: 'real', source: 'Unsplash', url: unsplash('1501196354995-cbb51c65aaea') },
  { id: 'r15', type: 'real', source: 'Unsplash', url: unsplash('1488426862026-3ee34a7d66df') },

  // --- "AI" IMAGES (Simulated using Unsplash 3D/Abstract/CGI) ---
  // Using reliable Unsplash hosting but classifying them as AI for the game logic
  { id: 'a1', type: 'ai', source: 'Simulation', url: unsplash('1618005182384-a83a8bd57fbe') }, // Abstract Liquid
  { id: 'a2', type: 'ai', source: 'Simulation', url: unsplash('1635070041078-e363dbe005cb') }, // 3D Render
  { id: 'a3', type: 'ai', source: 'Simulation', url: unsplash('1634017839464-5c339ebe3cb4') }, // 3D Crystal
  { id: 'a4', type: 'ai', source: 'Simulation', url: unsplash('1507146426996-ef05306b995a') }, // Surreal
  { id: 'a5', type: 'ai', source: 'Simulation', url: unsplash('1633511116631-042857f6b864') }, // 3D Abstract
  { id: 'a6', type: 'ai', source: 'Simulation', url: unsplash('1614730341194-75c60764fc86') }, // Neon 3D
  { id: 'a7', type: 'ai', source: 'Simulation', url: unsplash('1614728853975-69c960c7275ef') }, // Digital Art
  { id: 'a8', type: 'ai', source: 'Simulation', url: unsplash('1625841097017-d2182098ba46') }, // CGI Sphere
  { id: 'a9', type: 'ai', source: 'Simulation', url: unsplash('1617791160505-6f00504e35d9') }, // 3D Character like
  { id: 'a10', type: 'ai', source: 'Simulation', url: unsplash('1550684848-fac1c5b4e853') }, // Retrowave
  { id: 'a11', type: 'ai', source: 'Simulation', url: unsplash('1542475143-228589f2a41d') }, // Glitch Art
  { id: 'a12', type: 'ai', source: 'Simulation', url: unsplash('1592610530015-8968843513b1') }, // 3D Face
  { id: 'a13', type: 'ai', source: 'Simulation', url: unsplash('1592610530057-047c34b6f79d') }, // 3D Face
  { id: 'a14', type: 'ai', source: 'Simulation', url: unsplash('1514902167664-8848d6174154') }, // Surreal
  { id: 'a15', type: 'ai', source: 'Simulation', url: unsplash('1611162617474-5b21e879e113') }, // 3D Shape
];

// Helper to get random batch
export function getRandomBatch(count: number): ImageEntry[] {
  const shuffled = [...IMAGE_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}