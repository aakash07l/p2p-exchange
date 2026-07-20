import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  transpilePackages: [],
  // Turbopack config (Next.js 16 default)
  turbopack: {
    root: __dirname,
  },
  // Webpack config kept for non-Turbopack environments
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
