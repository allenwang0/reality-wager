export type ImageCategory = 'general' | 'faces' | 'places' | 'art';

export type ImageEntry = {
  id: string;
  url: string;
  type: 'real' | 'ai';
  category: ImageCategory[]; // Images can belong to multiple categories
  source: string;
};

// OPTIMIZATION: Request smaller images (800px) for speed but high enough quality to spot artifacts
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=75`;

export const IMAGE_BANK: ImageEntry[] = [
  // --- REAL IMAGES ---
  { id: 'r1', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1544005313-94ddf0286df2') },
  { id: 'r2', type: 'real', category: ['general', 'art'], source: 'Unsplash', url: unsplash('1518020382338-a7de69f8bf40') }, // Cat/Texture
  { id: 'r3', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1486334823288-b795f7dfa5ea') }, // Bird/Nature
  { id: 'r4', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1506794778202-cad84cf45f1d') },
  { id: 'r5', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1477415396659-f26b5d9082e6') }, // Architecture
  { id: 'r6', type: 'real', category: ['general', 'art'], source: 'Unsplash', url: unsplash('1526779259212-939e64788e3c') }, // Product
  { id: 'r7', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1542909168-82c3e7fdca5c') },
  { id: 'r8', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1493246507139-91e8fad9978e') }, // Landscape
  { id: 'r9', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1520250497591-112f2f40a3f4') }, // Resort
  { id: 'r10', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1535713875002-d1d0cf377fde') },

  // --- NEW REAL PLACEHOLDERS (Places/Art) ---
  { id: 'r11', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1470071459604-3b5ec3a7fe05') }, // Foggy Forest
  { id: 'r12', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1449824913935-59a10b8d2000') }, // Urban City
  { id: 'r13', type: 'real', category: ['general', 'art'], source: 'Unsplash', url: unsplash('1547891654-e66ed7ebb968') }, // Abstract Paint

  // --- AI / SIMULATED IMAGES ---
  { id: 'a1', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1635070041078-e363dbe005cb') }, // 3D Render
  { id: 'a2', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1618005182384-a83a8bd57fbe') }, // Liquid
  { id: 'a3', type: 'ai', category: ['general', 'faces'], source: 'Simulated', url: unsplash('1620641782983-7f61306a9b98') }, // 3D Face
  { id: 'a4', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1633511116631-042857f6b864') }, // Abstract
  { id: 'a5', type: 'ai', category: ['general', 'faces'], source: 'Simulated', url: unsplash('1535295972055-1c762f4483e5') }, // Processed Portrait
  { id: 'a6', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1614730341194-75c60764fc86') }, // Neon
  { id: 'a7', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1632516422206-8d591e0d77d7') }, // Robot Hand
  { id: 'a8', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1625841097017-d2182098ba46') }, // Sphere
  { id: 'a9', type: 'ai', category: ['general', 'places'], source: 'Simulated', url: unsplash('1580927752452-89d86da3fa0a') }, // Cyberpunk City
  { id: 'a10', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1550684848-fac1c5b4e853') }, // Retrowave

  // --- NEW AI PLACEHOLDERS ---
  { id: 'a11', type: 'ai', category: ['general', 'places'], source: 'Simulated', url: unsplash('1480796927426-f609979314bd') }, // Asian City (Lookalike)
  { id: 'a12', type: 'ai', category: ['general', 'faces'], source: 'Simulated', url: unsplash('1531746020798-e6953c6e8e04') }, // Abstract Portrait
];

export function getRandomBatch(count: number, category: ImageCategory = 'general'): ImageEntry[] {
  let pool = IMAGE_BANK;

  // Filter if not general
  if (category !== 'general') {
    pool = IMAGE_BANK.filter(img => img.category.includes(category));
  }

  // Safety fallback: if specific category runs out or has no images, return general pool
  if (pool.length === 0) {
    console.warn(`Category ${category} is empty. Falling back to general.`);
    pool = IMAGE_BANK;
  }

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}