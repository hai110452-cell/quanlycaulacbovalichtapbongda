import type { NextConfig } from "next";

const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
