import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "mojira.atlassian.net" },
    ],
  },
  experimental: {
    useCache: true,
  },
  async headers() {
    return [
      {
        source: "/:key",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=60, stale-while-revalidate=120",
          },
        ],
      },
    ];
  },
}

export default nextConfig
