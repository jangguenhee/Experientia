const assertNonEmpty = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`환경 변수가 설정되지 않았습니다: ${key}`);
  }

  return value;
};

const ensureUrl = (value: string, key: string) => {
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    throw new Error(`환경 변수 ${key}는 올바른 URL이어야 합니다.`);
  }
};

const NEXT_PUBLIC_SUPABASE_URL_RAW = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY_RAW = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const nextPublicSupabaseUrl = ensureUrl(
  assertNonEmpty(NEXT_PUBLIC_SUPABASE_URL_RAW, "NEXT_PUBLIC_SUPABASE_URL"),
  "NEXT_PUBLIC_SUPABASE_URL"
);

const nextPublicSupabaseAnonKey = assertNonEmpty(
  NEXT_PUBLIC_SUPABASE_ANON_KEY_RAW,
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
);

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: nextPublicSupabaseUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: nextPublicSupabaseAnonKey,
} as const;
