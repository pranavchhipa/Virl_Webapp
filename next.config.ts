import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // FORCE 'zod/v3' to resolve to 'zod'
    config.resolve.alias['zod/v3'] = require.resolve('zod');
    return config;
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
