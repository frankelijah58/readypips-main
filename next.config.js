/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  serverExternalPackages: ['mongodb'],
  devIndicators: {
    buildActivity: false,
  },
};

module.exports = nextConfig;
