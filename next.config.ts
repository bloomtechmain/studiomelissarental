import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      { source: "/products", destination: "/items-for-rent", permanent: true },
      { source: "/products/:id", destination: "/items-for-rent/:id", permanent: true },
    ];
  },
};

export default nextConfig;
