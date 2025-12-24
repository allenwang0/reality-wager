export type ImageEntry = {
  id: string;
  url: string;
  type: 'real' | 'ai';
  source: string;
};

// OPTIMIZATION: Request smaller images (800px) for speed but high enough quality to spot artifacts
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=75`;

export const IMAGE_BANK: ImageEntry[] = [
  // --- REAL IMAGES (Hard Mode: Includes Objects, Architecture, Imperfect Humans) ---
  { id: 'r1', type: 'real', source: 'Unsplash', url: unsplash('1544005313-94ddf0286df2') }, // Human Portrait
  { id: 'r2', type: 'real', source: 'Unsplash', url: unsplash('1518020382338-a7de69f8bf40') }, // Real Cat (Confusing texture)
  { id: 'r3', type: 'real', source: 'Unsplash', url: unsplash('1486334823288-b795f7dfa5ea') }, // Real Bird (Nature)
  { id: 'r4', type: 'real', source: 'Unsplash', url: unsplash('1506794778202-cad84cf45f1d') }, // Human
  { id: 'r5', type: 'real', source: 'Unsplash', url: unsplash('1477415396659-f26b5d9082e6') }, // Architecture (Brutalist)
  { id: 'r6', type: 'real', source: 'Unsplash', url: unsplash('1526779259212-939e64788e3c') }, // Product Shot (Watch)
  { id: 'r7', type: 'real', source: 'Unsplash', url: unsplash('1542909168-82c3e7fdca5c') }, // Human
  { id: 'r8', type: 'real', source: 'Unsplash', url: unsplash('1493246507139-91e8fad9978e') }, // Landscape
  { id: 'r9', type: 'real', source: 'Unsplash', url: unsplash('1520250497591-112f2f40a3f4') }, // Resort/Pool (often looks fake)
  { id: 'r10', type: 'real', source: 'Unsplash', url: unsplash('1535713875002-d1d0cf377fde') }, // Human

  // --- "AI" IMAGES (Hard Mode: Simulated Photorealism, Digital Art, 3D Portraits) ---
  // Using Unsplash images that have "Uncanny Valley" or "CGI" qualities to simulate AI generation
  { id: 'a1', type: 'ai', source: 'Simulated', url: unsplash('1635070041078-e363dbe005cb') }, // 3D Render
  { id: 'a2', type: 'ai', source: 'Simulated', url: unsplash('1618005182384-a83a8bd57fbe') }, // Abstract Liquid
  { id: 'a3', type: 'ai', source: 'Simulated', url: unsplash('1620641782983-7f61306a9b98') }, // 3D Human Face (Mannequin style)
  { id: 'a4', type: 'ai', source: 'Simulated', url: unsplash('1633511116631-042857f6b864') }, // 3D Abstract
  { id: 'a5', type: 'ai', source: 'Simulated', url: unsplash('1535295972055-1c762f4483e5') }, // Highly Processed Portrait (Looks AI)
  { id: 'a6', type: 'ai', source: 'Simulated', url: unsplash('1614730341194-75c60764fc86') }, // Neon 3D
  { id: 'a7', type: 'ai', source: 'Simulated', url: unsplash('1632516422206-8d591e0d77d7') }, // 3D Hand/Robot
  { id: 'a8', type: 'ai', source: 'Simulated', url: unsplash('1625841097017-d2182098ba46') }, // CGI Sphere
  { id: 'a9', type: 'ai', source: 'Simulated', url: unsplash('1580927752452-89d86da3fa0a') }, // Cyberpunk Art
  { id: 'a10', type: 'ai', source: 'Simulated', url: unsplash('1550684848-fac1c5b4e853') }, // Retrowave
];

export function getRandomBatch(count: number): ImageEntry[] {
  const shuffled = [...IMAGE_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}