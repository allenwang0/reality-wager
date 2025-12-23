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
    src: 'https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=0.752xw:1.00xh;0.175xw,0&resize=1200:*',
    type: 'real',
    source: 'Unsplash'
  },
  {
    id: 2,
    // Use a known AI image URL
    src: 'https://magazine.alumni.ubc.ca/sites/default/files/styles/max_1300x1300/public/2023-09/AIart-1920x1080.jpg?itok=i4Yw51WT',
    type: 'ai',
    source: 'Midjourney'
  }
];