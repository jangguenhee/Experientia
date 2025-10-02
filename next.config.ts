import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 빌드 시 ESLint 에러로 배포 실패 방지
    ignoreDuringBuilds: true,
  },
  images: {
    // Vercel Image Optimization 관련 에러 회피
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",              // 루트 접근 시
        destination: "/campaigns", // /campaigns 로 보내기
        permanent: false,          // 308 대신 307 (브라우저 캐시 덜 강함)
      },
    ];
  },
};

export default nextConfig;