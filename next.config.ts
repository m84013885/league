import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  basePath: '/league',
  assetPrefix: '/league/'
};

export default nextConfig;
