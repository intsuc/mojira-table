import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "mojira.atlassian.net" },
    ],
  },
  outputFileTracingIncludes: {
    "/issue/\\[key\\]": ["./assets/*"],
  },
  experimental: {
    useCache: true,
  },
}

export default nextConfig
