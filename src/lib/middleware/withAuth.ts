import { createServerClient } from '@supabase/ssr';
import type { Middleware } from './types';
import { createErrorResponse } from './utils';

/**
 * T06 — Validates the Supabase JWT from cookies.
 * Sets ctx.user. Rejects with 401 if unauthenticated.
 */
export const withAuth: Middleware = (handler) => async (request, ctx) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Route handlers cannot set cookies — no-op is correct here
        setAll() {},
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error ?? !user) {
    return createErrorResponse('Unauthorized — valid session required', 401);
  }

  return handler(request, { ...ctx, user });
};