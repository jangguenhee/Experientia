// src/constants/env.ts
import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/** 호출 시점에 검증: import 시 바로 throw하지 않음 */
export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    // Vercel 빌드 로그를 위해 경고 남기고, 런타임에서는 명확히 실패시킵니다.
    console.error("환경 변수 검증 실패:", parsed.error.flatten().fieldErrors);

    // 빌드 파이프라인을 망치고 싶지 않다면 여기서 return을 선택할 수도 있지만
    // 현재 팀 정책이 ‘없으면 fail’이라면 throw 유지
    throw new Error("환경 변수를 확인하세요.");
  }

  return parsed.data;
}