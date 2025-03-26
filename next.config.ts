import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/mojira",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
