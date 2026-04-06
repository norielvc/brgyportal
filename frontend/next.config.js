/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 3600,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/((?!qr-scans|scan-events|residents|portal|officials|health).*):path*', // Don't proxy migrated/native routes
        destination: 'http://localhost:5005/api/:path*',
      },
    ];
  },

};

module.exports = nextConfig;
