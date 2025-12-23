export type GameImage = {
  id: number;
  src: string;
  type: 'real' | 'ai';
  source: string; // The URL to prove it's real/ai
};

export const GAME_IMAGES: GameImage[] = [
  {
    id: 1,
    src: '/assets/game/1.jpg',
    type: 'real',
    source: 'https://unsplash.com/photos/example-1'
  },
  {
    id: 2,
    src: '/assets/game/2.jpg',
    type: 'ai',
    source: 'Midjourney Job #99420'
  }
];