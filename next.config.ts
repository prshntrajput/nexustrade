import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // typedRoutes is now stable — no longer under experimental
  typedRoutes: true,
  // Prevents Next.js from bundling these Node-native packages —
  // they must run in the Node.js runtime, not the edge or browser bundles
  serverExternalPackages: ['ws', 'yahoo-finance2'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'finnhub.io' },
    ],
  },
};

export default nextConfig;