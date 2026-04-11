import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

export interface RequestContext {
  user?: User;
  validatedData?: unknown;
}

// The final handler at the end of the middleware chain
export type RouteHandler = (
  request: NextRequest,
  ctx: RequestContext,
) => Promise<Response>;

// A middleware wraps a RouteHandler and returns a RouteHandler
export type Middleware = (handler: RouteHandler) => RouteHandler;