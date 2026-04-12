import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // typedRoutes is now stable — no longer under experimental
  typedRoutes: true,
  serverExternalPackages: ['ws'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'finnhub.io' },
    ],
  },
};

export default nextConfig;