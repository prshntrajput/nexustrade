import type { NextRequest } from 'next/server';
import type { Middleware, RouteHandler } from './types';

/**
 * Composes middlewares + a final handler into a single Next.js route function.
 * Usage: export const GET = compose(withAuth, withValidation(Schema), handler);
 */
export function compose(
  ...args: [...Middleware[], RouteHandler]
): (request: NextRequest) => Promise<Response> {
  const middlewares = args.slice(0, -1) as Middleware[];
  const finalHandler = args[args.length - 1] as RouteHandler;

  const composed: RouteHandler = middlewares.reduceRight(
    (next: RouteHandler, mw: Middleware) => mw(next),
    finalHandler,
  );

  // Strip the ctx parameter — Next.js route handlers only receive (request)
  return (request: NextRequest) => composed(request, {});
}