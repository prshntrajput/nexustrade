import type { NextRequest } from 'next/server';
import type { Middleware, RouteHandler } from './types';

/**
 * Composes middlewares + a final handler into a single Next.js route function.
 *
 * FIX: Changed from [...Middleware[], RouteHandler] variadic tuple to
 * Array<Middleware | RouteHandler> — the tuple type confused Turbopack's
 * static analysis and caused "No HTTP methods exported" 405 errors.
 *
 * Usage: export const GET = compose(withAuth, withValidation(Schema), handler);
 */
export function compose(
  ...args: Array<Middleware | RouteHandler>
): (request: NextRequest) => Promise<Response> {
  // Last arg is always the final route handler
  const middlewares = args.slice(0, -1) as Middleware[];
  const finalHandler = args[args.length - 1] as RouteHandler;

  const composed: RouteHandler = middlewares.reduceRight(
    (next: RouteHandler, mw: Middleware) => mw(next),
    finalHandler,
  );

  // Strip context param — Next.js route handlers only receive (request)
  return (request: NextRequest) => composed(request, {});
}