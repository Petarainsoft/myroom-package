import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  swcMinify: false,
  experimental: {
    forceSwcTransforms: false,
  },
};

export default nextConfig;
