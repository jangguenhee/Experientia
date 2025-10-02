import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/constants/env";
import type { Database } from "./types";

type WritableCookieStore = Awaited<ReturnType<typeof cookies>> & {
  set?: (options: {
    name: string;
    value: string;
    path?: string;
    expires?: Date;
    maxAge?: number;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
  }) => void;
};

type CreateSupabaseServerClientOptions = {
  allowCookieMutation?: boolean;
  cookieStore?: Awaited<ReturnType<typeof cookies>>;
};

export const createSupabaseServerClient = async (
  options: CreateSupabaseServerClientOptions = {}
): Promise<
  SupabaseClient<Database>
> => {
  const rawCookieStore = (options.cookieStore ?? (await cookies())) as WritableCookieStore;
  const allowCookieMutation = Boolean(options.allowCookieMutation);

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return rawCookieStore.getAll();
        },
        setAll(cookiesToSet) {
          if (!allowCookieMutation) {
            return;
          }

          cookiesToSet.forEach(({ name, value, options }) => {
            if (typeof rawCookieStore.set !== "function") {
              return;
            }

            rawCookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );
};
