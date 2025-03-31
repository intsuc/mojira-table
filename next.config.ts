import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "mojira.atlassian.net" },
    ],
  },
  experimental: {
    dynamicIO: true,
    useCache: true,
  },
}

export default nextConfig
