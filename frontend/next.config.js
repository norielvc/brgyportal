/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    formats: ["image/webp"],
    minimumCacheTTL: 3600,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-DNS-Prefetch-Control", value: "on" }],
      },
    ];
  },
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
