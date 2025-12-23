export type GameImage = {
  id: number;
  src: string;
  type: 'real' | 'ai';
  source: string;
};

export const GAME_IMAGES: GameImage[] = [
  {
    id: 1,
    // Use a direct Unsplash link instead of local file
    src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    type: 'real',
    source: 'Unsplash'
  },
  {
    id: 2,
    // Use a known AI image URL
    src: 'https://cdn.midjourney.com/5c986e68-3843-41c1-90c7-18454790539c/0_0.png',
    type: 'ai',
    source: 'Midjourney'
  }
];