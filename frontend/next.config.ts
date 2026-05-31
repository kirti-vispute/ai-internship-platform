import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.10"],
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["framer-motion"]
  },
  images: {
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
