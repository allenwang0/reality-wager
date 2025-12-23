/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows loading images from ANY domain (Supabase, Unsplash, etc.)
      },
    ],
  },
};

module.exports = nextConfig;