import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for VPS deployment
  output: "standalone",

  // Disable image optimization for simpler deployment
  images: {
    unoptimized: true,
  },

  // Server configuration
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
