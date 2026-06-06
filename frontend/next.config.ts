import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.10"],
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@react-three/fiber", "@react-three/drei"],
    staleTimes: {
      dynamic: 120,
      static: 300
    }
  },
  images: {
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
