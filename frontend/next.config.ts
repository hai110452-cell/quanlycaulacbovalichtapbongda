import type { NextConfig } from "next";
import path from "path";

// basePath chỉ áp dụng khi export cho DirectAdmin hoặc khi có biến môi trường
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: 'export',
        typescript: {
          ignoreBuildErrors: true,
        },
        experimental: {
          cpus: 1,
        },
      }
    : {}),
  ...(basePath ? { basePath } : {}),
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  ...(!isExport && basePath
    ? {
        async redirects() {
          return [
            {
              source: '/',
              destination: basePath,
              basePath: false,
              permanent: false,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
