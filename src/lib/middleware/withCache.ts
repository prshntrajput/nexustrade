import type { Middleware } from './types';

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

interface CacheOptions {
  ttl: number; // seconds
}

// Module-level singleton — persists for the lifetime of the server instance
const cache = new Map<string, CacheEntry>();

// Evict expired entries every 60 seconds (runs in Node.js runtime, not edge)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt <= now) cache.delete(key);
    }
  }, 60_000).unref?.(); // .unref() prevents this from blocking process exit
}

/**
 * T09 — In-memory TTL cache, keyed by userId + full URL.
 * Must be placed AFTER withAuth in the compose chain so ctx.user is available.
 */
export function withCache(options: CacheOptions): Middleware {
  return (handler) => async (request, ctx) => {
    const url = new URL(request.url);
    const cacheKey = `${ctx.user?.id ?? 'anon'}:${url.pathname}:${url.searchParams.toString()}`;

    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return Response.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': `max-age=${Math.floor((cached.expiresAt - Date.now()) / 1000)}`,
        },
      });
    }

    const response = await handler(request, ctx);

    if (response.ok) {
      // Clone before reading — original body stream is consumed only once
      const cloned = response.clone();
      try {
        const data = await cloned.json();
        cache.set(cacheKey, {
          data,
          expiresAt: Date.now() + options.ttl * 1000,
        });
      } catch {
        // Non-JSON response — skip caching
      }
    }

    // Add cache-miss header to original response
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Cache', 'MISS');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}