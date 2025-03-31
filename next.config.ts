import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "mojira.atlassian.net" },
    ]
  }
}

export default nextConfig
