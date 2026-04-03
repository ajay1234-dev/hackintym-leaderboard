import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel optimization
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
