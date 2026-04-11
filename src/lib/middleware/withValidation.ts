import type { ZodSchema } from 'zod';
import type { Middleware } from './types';
import { createErrorResponse } from './utils';

/**
 * T07 — Validates GET search params or POST/PUT JSON body against a Zod schema.
 * Sets ctx.validatedData on success. Returns 400 on failure.
 */
export function withValidation<T>(schema: ZodSchema<T>): Middleware {
  return (handler) => async (request, ctx) => {
    let rawData: unknown;

    if (request.method === 'GET' || request.method === 'DELETE') {
      // All URL search params are strings — schemas must use z.coerce for numbers
      const url = new URL(request.url);
      rawData = Object.fromEntries(url.searchParams.entries());
    } else {
      const contentType = request.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          rawData = await request.json();
        } catch {
          return createErrorResponse('Request body must be valid JSON', 400);
        }
      } else {
        rawData = {};
      }
    }

    const result = schema.safeParse(rawData);

    if (!result.success) {
      return createErrorResponse('Request validation failed', 400, {
        fieldErrors: result.error.flatten().fieldErrors,
      });
    }

    return handler(request, { ...ctx, validatedData: result.data });
  };
}