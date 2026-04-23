import { type NextRequest } from 'next/server';
import {
  compose,
  withAuth,
  withRateLimit,
  withValidation,
} from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import { getPortfolioRepository } from '@/lib/repositories/portfolio.repository';
import { CreateHoldingSchema } from '@/lib/schemas/portfolio.schema';
import type { CreateHolding } from '@/lib/schemas/portfolio.schema';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/utils';
import { DatabaseError } from '@/lib/errors';

// ─── GET /api/gateway/portfolio ───────────────────────────────────────────────

async function listHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  try {
    const holdings = await getPortfolioRepository().findByUserId(ctx.user!.id);
    return createSuccessResponse(holdings);
  } catch (err) {
    console.error('[GET /portfolio]', err);
    return createErrorResponse('Failed to fetch portfolio', 500);
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  return compose(withAuth, listHandler)(request);
}

// ─── POST /api/gateway/portfolio ──────────────────────────────────────────────
// Creates or updates the holding for a given symbol (upsert by user+symbol).

async function createHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const payload = ctx.validatedData as CreateHolding;

  try {
    const holding = await getPortfolioRepository().upsert(
      ctx.user!.id,
      payload,
    );
    return createSuccessResponse(holding, 201);
  } catch (err) {
    if (err instanceof DatabaseError) {
      return createErrorResponse(err.message, 422);
    }
    console.error('[POST /portfolio]', err);
    return createErrorResponse('Failed to save holding', 500);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'portfolio_write', rpm: 60 }),
    withValidation(CreateHoldingSchema),
    createHandler,
  )(request);
}
