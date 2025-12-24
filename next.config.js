/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.freepik.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'magazine.alumni.ubc.ca' },
      { protocol: 'https', hostname: 'hips.hearstapps.com' },
      // Add your Supabase storage domain here if you upload your own images
      // { protocol: 'https', hostname: 'your-project.supabase.co' },
    ],
  },
};

module.exports = nextConfig;