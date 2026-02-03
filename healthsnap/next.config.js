/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for App Router
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // For audio file uploads
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
    ],
  },

  // Headers for audio recording
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'microphone=(self)',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
