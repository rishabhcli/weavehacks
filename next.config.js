/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => {
    // Force new build ID each time
    return `build-${Date.now()}`;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Exclude Stagehand from webpack bundling - it needs native Node.js resolution
  experimental: {
    serverComponentsExternalPackages: ['@browserbasehq/stagehand', 'playwright', 'playwright-core'],
  },
};

module.exports = nextConfig;
