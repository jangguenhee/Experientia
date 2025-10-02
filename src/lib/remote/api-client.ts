import axios, { AxiosHeaders, isAxiosError } from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const resolveAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/browser-client");
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to resolve Supabase session for API client", error);
    }
    return null;
  }
};

apiClient.interceptors.request.use(async (config) => {
  const token = await resolveAccessToken();

  if (token) {
    const headers = AxiosHeaders.from(config.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

type ErrorPayload = {
  error?: {
    message?: string;
  };
  message?: string;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "API request failed."
) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ErrorPayload | undefined;

    if (typeof payload?.error?.message === "string") {
      return payload.error.message;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export { apiClient, isAxiosError };
