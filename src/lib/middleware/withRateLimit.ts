import type { Middleware } from './types';
import { createErrorResponse } from './utils';
import { getAdminClient } from '@/lib/supabase/admin';

interface RateLimitOptions {
  service: string;
  rpm: number; // max requests per minute
}

/**
 * T08 — Sliding window rate limiter backed by Supabase.
 * Uses the increment_rate_limit RPC for atomic increments.
 * Returns 429 with Retry-After header when limit exceeded.
 */
export function withRateLimit(options: RateLimitOptions): Middleware {
  return (handler) => async (request, ctx) => {
    if (!ctx.user) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Truncate to the current 1-minute window
    const now = new Date();
    const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);

    const supabase = getAdminClient();

    const { data: count, error } = await supabase.rpc('increment_rate_limit', {
      p_user_id: ctx.user.id,
      p_service: options.service,
      p_window_start: windowStart.toISOString(),
    });

    if (error) {
      // Fail open — log and allow through rather than block on infra error
      console.warn('[withRateLimit] RPC error:', error.message);
    } else if (typeof count === 'number' && count > options.rpm) {
      const retryAfter = 60 - Math.floor((now.getTime() % 60_000) / 1000);
      return createErrorResponse(
        `Rate limit exceeded for ${options.service}. Retry in ${retryAfter}s.`,
        429,
        { retryAfter, service: options.service, limit: options.rpm },
      );
    }

    const response = await handler(request, ctx);

    // Attach rate limit headers to every response
    const remaining = typeof count === 'number' ? Math.max(0, options.rpm - count) : options.rpm;
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', String(options.rpm));
    newHeaders.set('X-RateLimit-Remaining', String(remaining));
    newHeaders.set('X-RateLimit-Reset', String(Math.ceil(windowStart.getTime() / 1000) + 60));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}