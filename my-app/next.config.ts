import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dynamic mode for API routes and server components
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
