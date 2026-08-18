import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow uploading a business logo (small image) from /admin/business.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
