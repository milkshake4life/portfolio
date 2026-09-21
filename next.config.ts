import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      { source: "/gallery", destination: "/coffee", permanent: true },
    ];
  },
};

export default nextConfig;
