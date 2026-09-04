import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Default Server Action body limit is 1MB — too small for gallery photo
  // uploads (see uploadGalleryImages, which caps each file at 20MB; this
  // covers a multi-file batch of several near-max-size photos at once).
  experimental: {
    serverActions: {
      bodySizeLimit: "80mb",
    },
  },
  async redirects() {
    return [
      { source: "/products", destination: "/items-for-rent", permanent: true },
      { source: "/products/:id", destination: "/items-for-rent/:id", permanent: true },
    ];
  },
};

export default nextConfig;
