export type ImageEntry = {
  id: string;
  url: string;
  type: 'real' | 'ai';
  source: string;
};

// Helper to generate Unsplash URLs reliably
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

export const IMAGE_BANK: ImageEntry[] = [
  // --- REAL IMAGES (Unsplash IDs) ---
  { id: 'r1', type: 'real', source: 'Unsplash', url: unsplash('1544005313-94ddf0286df2') }, // Portrait
  { id: 'r2', type: 'real', source: 'Unsplash', url: unsplash('1507003211169-0a1dd7228f2d') }, // Portrait
  { id: 'r3', type: 'real', source: 'Unsplash', url: unsplash('1506794778202-cad84cf45f1d') }, // Portrait
  { id: 'r4', type: 'real', source: 'Unsplash', url: unsplash('1534528741775-53994a69daeb') }, // Portrait
  { id: 'r5', type: 'real', source: 'Unsplash', url: unsplash('1531123897727-8f129e1688ce') }, // Portrait
  { id: 'r6', type: 'real', source: 'Unsplash', url: unsplash('1521119989659-a83faa488558') }, // Portrait
  { id: 'r7', type: 'real', source: 'Unsplash', url: unsplash('1542909168-82c3e7fdca5c') }, // Face
  { id: 'r8', type: 'real', source: 'Unsplash', url: unsplash('1494790108377-be9c29b29330') }, // Face
  { id: 'r9', type: 'real', source: 'Unsplash', url: unsplash('1500648767791-00dcc994a43e') }, // Face
  { id: 'r10', type: 'real', source: 'Unsplash', url: unsplash('1535713875002-d1d0cf377fde') }, // Face
  { id: 'r11', type: 'real', source: 'Unsplash', url: unsplash('1524504388940-b1c1722653e1') },
  { id: 'r12', type: 'real', source: 'Unsplash', url: unsplash('1438761681033-6461ffad8d80') },
  { id: 'r13', type: 'real', source: 'Unsplash', url: unsplash('1463453091185-61582044d556') },
  { id: 'r14', type: 'real', source: 'Unsplash', url: unsplash('1501196354995-cbb51c65aaea') },
  { id: 'r15', type: 'real', source: 'Unsplash', url: unsplash('1488426862026-3ee34a7d66df') },
  { id: 'r16', type: 'real', source: 'Unsplash', url: unsplash('1492446845049-9c50cc313f00') },
  { id: 'r17', type: 'real', source: 'Unsplash', url: unsplash('1530268729831-4b0b9e170218') },
  { id: 'r18', type: 'real', source: 'Unsplash', url: unsplash('1517841905240-472988babdf9') },
  { id: 'r19', type: 'real', source: 'Unsplash', url: unsplash('1529626455594-4ff0802cfb7e') },
  { id: 'r20', type: 'real', source: 'Unsplash', url: unsplash('1489424731084-a5d8b8197c1c') },

  // --- AI IMAGES (Stable URLs) ---
  // Using specific known AI examples or highly processed images that look AI
  { id: 'a1', type: 'ai', source: 'Freepik AI', url: 'https://img.freepik.com/free-photo/digital-art-portrait-person_23-2151137452.jpg' },
  { id: 'a2', type: 'ai', source: 'Midjourney', url: 'https://img.freepik.com/free-photo/ultra-detailed-nebula-abstract-wallpaper-4_1562-749.jpg' },
  { id: 'a3', type: 'ai', source: 'DALL-E', url: 'https://img.freepik.com/premium-photo/futuristic-woman-with-cyberpunk-concept_23-2149363065.jpg' },
  { id: 'a4', type: 'ai', source: 'Stable Diffusion', url: 'https://img.freepik.com/free-photo/cyberpunk-urban-scenery_23-2150712285.jpg' },
  { id: 'a5', type: 'ai', source: 'Midjourney', url: 'https://img.freepik.com/free-photo/portrait-anime-character_23-2151555502.jpg' },
  { id: 'a6', type: 'ai', source: 'AI Gen', url: 'https://img.freepik.com/premium-photo/android-female-robot-with-internal-technology-gears_130727-249.jpg' },
  { id: 'a7', type: 'ai', source: 'AI Gen', url: 'https://img.freepik.com/free-photo/view-3d-future-tech-robot_23-2150833118.jpg' },
  { id: 'a8', type: 'ai', source: 'AI Gen', url: 'https://img.freepik.com/premium-photo/bioluminescent-portrait-woman_23-2150898517.jpg' },
  { id: 'a9', type: 'ai', source: 'AI Gen', url: 'https://img.freepik.com/free-photo/androgynous-avatar-active-user_23-2151134125.jpg' },
  { id: 'a10', type: 'ai', source: 'AI Gen', url: 'https://img.freepik.com/free-photo/3d-rendering-biorobots-concept_23-2149524401.jpg' },
  { id: 'a11', type: 'ai', source: 'AI Gen', url: 'https://img.freepik.com/free-photo/lifestyle-scene-with-virtual-human-character_23-2151351114.jpg' },
  { id: 'a12', type: 'ai', source: 'AI Gen', url: 'https://img.freepik.com/free-photo/portrait-young-woman-with-intricate-detailed-hair_23-2151137453.jpg' },
  { id: 'a13', type: 'ai', source: 'AI Gen', url: 'https://img.freepik.com/premium-photo/cyberpunk-city-street-night-with-neon-lights_692702-2313.jpg' },
  { id: 'a14', type: 'ai', source: 'AI Gen', url: 'https://img.freepik.com/free-photo/photorealistic-view-futuristic-urban-environment_23-2151101886.jpg' },
  { id: 'a15', type: 'ai', source: 'AI Gen', url: 'https://img.freepik.com/premium-photo/concept-art-futuristic-cityscape_931878-43394.jpg' },
];

// Helper to get random batch
export function getRandomBatch(count: number): ImageEntry[] {
  const shuffled = [...IMAGE_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}