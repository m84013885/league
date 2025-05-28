import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/league' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/league/' : ''
};

export default nextConfig;
