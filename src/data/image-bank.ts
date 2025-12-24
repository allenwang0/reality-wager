export type ImageCategory = 'general' | 'faces' | 'places' | 'art';

export type ImageEntry = {
  id: string;
  url: string;
  type: 'real' | 'ai';
  category: ImageCategory[];
  source: string;
};

// OPTIMIZATION: 600px/60q for speed.
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=60`;

export const IMAGE_BANK: ImageEntry[] = [
  // --- REAL IMAGES (Photography) ---
  { id: 'r1', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1544005313-94ddf0286df2') },
  { id: 'r2', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1534528741775-53994a69daeb') },
  { id: 'r3', type: 'real', category: ['general', 'faces'], source: 'Unsplash', url: unsplash('1507003211169-0a1dd7228f2d') },
  { id: 'r4', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1477415396659-f26b5d9082e6') }, // Architecture
  { id: 'r5', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1493246507139-91e8fad9978e') }, // Landscape
  { id: 'r6', type: 'real', category: ['general', 'art'], source: 'Unsplash', url: unsplash('1518020382338-a7de69f8bf40') }, // Abstract Texture
  { id: 'r7', type: 'real', category: ['general', 'art'], source: 'Unsplash', url: unsplash('1526779259212-939e64788e3c') }, // Product
  { id: 'r8', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1518182177546-076619f72d8d') }, // Snow
  { id: 'r9', type: 'real', category: ['general', 'places'], source: 'Unsplash', url: unsplash('1504198458649-3128b932f49e') }, // Symmetry

  // --- "AI" IMAGES (3D Renders / Digital Art) ---
  // NOTE: These are Unsplash images tagged as 3D/CGI/Render to simulate AI generation.
  // IDs must be unique from the Real set.
  { id: 'a1', type: 'ai', category: ['general', 'faces'], source: 'Simulated', url: unsplash('1620641782983-7f61306a9b98') }, // Mannequin
  { id: 'a2', type: 'ai', category: ['general', 'faces'], source: 'Simulated', url: unsplash('1617791160505-6f00504e35d9') }, // 3D Char
  { id: 'a3', type: 'ai', category: ['general', 'faces'], source: 'Simulated', url: unsplash('1592610530015-8968843513b1') }, // Digital Face
  { id: 'a4', type: 'ai', category: ['general', 'places'], source: 'Simulated', url: unsplash('1580927752452-89d86da3fa0a') }, // Cyberpunk
  { id: 'a5', type: 'ai', category: ['general', 'places'], source: 'Simulated', url: unsplash('1614730341194-75c60764fc86') }, // Neon
  { id: 'a6', type: 'ai', category: ['general', 'places'], source: 'Simulated', url: unsplash('1550684848-fac1c5b4e853') }, // Retrowave
  { id: 'a7', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1635070041078-e363dbe005cb') }, // 3D Crystal
  { id: 'a8', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1618005182384-a83a8bd57fbe') }, // Liquid
  { id: 'a9', type: 'ai', category: ['general', 'art'], source: 'Simulated', url: unsplash('1633511116631-042857f6b864') }, // Abstract Shape
];

export function getRandomBatch(count: number, category: ImageCategory = 'general'): ImageEntry[] {
  let pool = IMAGE_BANK;
  if (category !== 'general') {
    pool = IMAGE_BANK.filter(img => img.category.includes(category));
  }
  // Fallback to prevent empty deck crash
  if (pool.length === 0) pool = IMAGE_BANK;

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}