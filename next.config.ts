import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  serverExternalPackages: ['pino', 'pino-pretty'],
  turbopack: {},
  webpack: (config) => {
    config.externals.push('pino-pretty', 'pino', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
