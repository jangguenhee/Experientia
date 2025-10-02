// middleware.ts — Edge-safe, no throws, Supabase cookie adapter fixed
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types"; // type-only import (OK on Edge)

const LOGIN_PATH = "/auth/login";
const PUBLIC_PATHS = new Set<string>(["/", LOGIN_PATH, "/auth/signup"]);
const PUBLIC_PREFIXES = ["/_next", "/api", "/favicon", "/static", "/docs", "/images"];

/** env 읽기: 없으면 미들웨어는 no-op 통과 (절대 throw 하지 않음) */
const URL_ENV = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON_ENV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** 공개 경로 판별 (간단/순수 함수) */
function isPublicPath(pathname: string) {
  const normalized = pathname.toLowerCase();
  if (PUBLIC_PATHS.has(normalized)) return true;
  return PUBLIC_PREFIXES.some((p) => normalized.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // ✅ env 누락 시: 크래시 대신 통과 (배포 환경 설정 전에도 사이트는 열리게)
  if (!URL_ENV || !ANON_ENV) return res;

  // 보호 경로만 체크
  const { pathname } = new URL(req.url);
  if (isPublicPath(pathname)) return res;

  // ✅ Edge-safe cookie adapter: get / set / remove 만 사용
  const supabase = createServerClient<Database>(URL_ENV, ANON_ENV, {
    cookies: {
      get: (name) => req.cookies.get(name)?.value,
      set: (name, value, options) => {
        res.cookies.set({ name, value, ...options, sameSite: "lax" });
      },
      remove: (name, options) => {
        res.cookies.set({ name, value: "", ...options, maxAge: 0, sameSite: "lax" });
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error) return res; // 절대 throw 금지

  if (!data?.user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl); // 별도 cookie copy 불필요
  }

  return res;
}

// ✅ 정적 리소스 간섭 최소화를 위해 matcher는 꼭 필요한 범위로
export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};