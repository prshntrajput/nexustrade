import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { compose, withAuth, withRateLimit, withValidation } from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/middleware/utils';
import { getWatchlistRepository } from '@/lib/repositories/watchlist.repository';
import { CreateWatchlistItemSchema } from '@/lib/schemas/watchlist.schema';
import { DatabaseError, ConflictError } from '@/lib/errors';

// ─── GET /api/gateway/watchlist ───────────────────────────────────────────────

async function getWatchlistHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  try {
    const repo = getWatchlistRepository();
    const items = await repo.findByUserId(ctx.user!.id);
    return createSuccessResponse(items);
  } catch (err) {
    if (err instanceof DatabaseError) {
      return createErrorResponse('Failed to fetch watchlist', 500);
    }
    return createErrorResponse('Unexpected server error', 500);
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

export const GET = compose(
  withAuth,
  withRateLimit({ service: 'database', rpm: 120 }),
  getWatchlistHandler,
);

export const POST = compose(
  withAuth,
  withRateLimit({ service: 'database', rpm: 120 }),
  withValidation(CreateWatchlistItemSchema),
  addToWatchlistHandler,
);