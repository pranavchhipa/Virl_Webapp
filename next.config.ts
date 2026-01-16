import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // FORCE 'zod/v3' to resolve to 'zod'
    config.resolve.alias['zod/v3'] = require.resolve('zod');
    return config;
  },
};

export default nextConfig;
