import { getSupabase, type AppContext } from '@/backend/hono/context';

const ACCESS_TOKEN_COOKIE_KEYS = [
  'sb-access-token',
  'supabase-auth-token',
  'supabase-access-token',
] as const;

const parseCookies = (cookieHeader: string | null | undefined) => {
  if (!cookieHeader) {
    return {} as Record<string, string>;
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = decodeURIComponent(part.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());

      acc[key] = value;
      return acc;
    }, {});
};

const extractAccessTokenFromValue = (raw: string): string | null => {
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as { access_token?: string };

    if (parsed && typeof parsed.access_token === 'string') {
      return parsed.access_token;
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return decodeURIComponent(raw);
    }
  }

  return decodeURIComponent(raw || '') || null;
};

const getAccessTokenFromAuthorization = (authHeader: string | null | undefined) => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.trim().split(/\s+/u);
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1] ?? null;
  }

  return null;
};

export const resolveAccessToken = (c: AppContext): string | null => {
  const authorizationToken = getAccessTokenFromAuthorization(
    c.req.header('authorization'),
  );
  if (authorizationToken) {
    return authorizationToken;
  }

  const cookieHeader = c.req.header('cookie');
  const cookies = parseCookies(cookieHeader);

  for (const key of Object.keys(cookies)) {
    if (
      (ACCESS_TOKEN_COOKIE_KEYS as readonly string[]).includes(key) ||
      /^sb-.*-auth-token$/u.test(key)
    ) {
      const token = extractAccessTokenFromValue(cookies[key]);
      if (token) {
        return token;
      }
    }
  }

  return null;
};

export const getAuthenticatedUserId = async (
  c: AppContext,
): Promise<string | null> => {
  const supabase = getSupabase(c);
  const accessToken = resolveAccessToken(c);

  if (!accessToken) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
};

