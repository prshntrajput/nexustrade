import { createServerClient } from '@supabase/ssr';
import type { Middleware } from './types';
import { createErrorResponse } from './utils';
import {
  createDemoUser,
  DEMO_MODE_COOKIE,
  isDemoModeCookie,
} from '@/lib/demo';

/**
 * T06 — Validates the Supabase JWT from cookies.
 * Sets ctx.user. Rejects with 401 if unauthenticated.
 */
export const withAuth: Middleware = (handler) => async (request, ctx) => {
  if (isDemoModeCookie(request.cookies.get(DEMO_MODE_COOKIE)?.value)) {
    return handler(request, { ...ctx, user: createDemoUser(), isDemo: true });
  }

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
