import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { compose, withAuth, withRateLimit, withValidation } from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/middleware/utils';
import { getWatchlistRepository } from '@/lib/repositories/watchlist.repository';
import { CreateWatchlistItemSchema } from '@/lib/schemas/watchlist.schema';
import { DatabaseError, ConflictError } from '@/lib/errors';
import { ZodAny } from 'zod';

// ─── GET /api/gateway/watchlist ───────────────────────────────────────────────

async function getWatchlistHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  try {
    const repo = getWatchlistRepository();
    const items = await repo.findByUserId(ctx.user!.id);
    return createSuccessResponse(items);
  } catch {
    return createErrorResponse('Failed to fetch watchlist', 500);
  }
}

// ─── POST /api/gateway/watchlist ──────────────────────────────────────────────

async function addToWatchlistHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const data = ctx.validatedData as z.infer<typeof CreateWatchlistItemSchema>;

  try {
    const repo = getWatchlistRepository();
    const item = await repo.create(ctx.user!.id, data);

    // T19 — Subscribe this symbol to the Finnhub WebSocket immediately
    try {
      const { WebSocketManager } = await import('@/lib/services/websocket.manager');
      WebSocketManager.getInstance().addSymbol(item.symbol);
    } catch {
      // Non-fatal — WebSocket not available in all environments
    }

    return createSuccessResponse(item, 201);
  } catch (err) {
    if (err instanceof ConflictError) {
      return createErrorResponse(err.message, 409);
    }
    if (err instanceof DatabaseError) {
      return createErrorResponse('Failed to add symbol', 500);
    }
    return createErrorResponse('Unexpected server error', 500);
  }
}

// ─── Route exports ────────────────────────────────────────────────────────────

// Replace the bottom exports section only — keep all handlers above unchanged

export async function GET(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 120 }),
    getWatchlistHandler,
  )(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 120 }),
    withValidation(CreateWatchlistItemSchema),
    addToWatchlistHandler,
  )(request);
}