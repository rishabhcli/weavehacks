/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => {
    // Force new build ID each time
    return `build-${Date.now()}`;
  },
};

module.exports = nextConfig;
