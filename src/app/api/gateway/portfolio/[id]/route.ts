import { type NextRequest } from 'next/server';
import {
  compose,
  withAuth,
  withRateLimit,
  withValidation,
} from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import { getPortfolioRepository } from '@/lib/repositories/portfolio.repository';
import { UpdateHoldingSchema } from '@/lib/schemas/portfolio.schema';
import type { UpdateHolding } from '@/lib/schemas/portfolio.schema';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/utils';
import { DatabaseError, NotFoundError } from '@/lib/errors';

// ─── PUT /api/gateway/portfolio/[id] ─────────────────────────────────────────

async function updateHandler(
  request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const id = request.nextUrl.pathname.split('/').at(-1) ?? '';
  const payload = ctx.validatedData as UpdateHolding;

  try {
    const updated = await getPortfolioRepository().updateById(
      ctx.user!.id,
      id,
      payload,
    );
    return createSuccessResponse(updated);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return createErrorResponse('Holding not found', 404);
    }
    if (err instanceof DatabaseError) {
      return createErrorResponse(err.message, 422);
    }
    console.error('[PUT /portfolio/:id]', err);
    return createErrorResponse('Failed to update holding', 500);
  }
}

export async function PUT(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'portfolio_write', rpm: 60 }),
    withValidation(UpdateHoldingSchema),
    updateHandler,
  )(request);
}

// ─── DELETE /api/gateway/portfolio/[id] ──────────────────────────────────────

async function deleteHandler(
  request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const id = request.nextUrl.pathname.split('/').at(-1) ?? '';

  try {
    await getPortfolioRepository().deleteById(ctx.user!.id, id);
    return createSuccessResponse({ deleted: true });
  } catch (err) {
    if (err instanceof DatabaseError) {
      return createErrorResponse(err.message, 422);
    }
    console.error('[DELETE /portfolio/:id]', err);
    return createErrorResponse('Failed to delete holding', 500);
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'portfolio_write', rpm: 60 }),
    deleteHandler,
  )(request);
}
