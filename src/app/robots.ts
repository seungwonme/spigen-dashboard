import type { MetadataRoute } from "next";

// 인증 뒤 내부 대시보드 — 검색엔진·AI 크롤러 전체 차단.
// 일반 사이트와 반대 방향: 노출이 아니라 차단이 목표.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
