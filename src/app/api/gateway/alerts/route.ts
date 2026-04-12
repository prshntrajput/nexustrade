import type { NextRequest } from 'next/server';
import {
  compose,
  withAuth,
  withRateLimit,
  withValidation,
} from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/utils';
import { getAlertRepository } from '@/lib/repositories/alert.repository';
import { CreateAlertSchema } from '@/lib/schemas/alert.schema';
import type { CreateAlert } from '@/types';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { AlertEvaluator } from '@/lib/alert.evaluator';

// ─── GET handler ──────────────────────────────────────────────────────────────

async function getAlertsHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  try {
    const repo = getAlertRepository();
    const alerts = await repo.findByUserId(ctx.user!.id);
    return createSuccessResponse(alerts);
  } catch (err) {
    console.error('[GET /alerts]', err);
    return createErrorResponse('Failed to fetch alerts', 500);
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

async function createAlertHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const body = ctx.validatedData as CreateAlert;
  const { watchlistId, condition } = body;

  // Flatten discriminated union → DB columns
  const conditionType = condition.type;
  const threshold = 'threshold' in condition ? condition.threshold : null;
  const multiplier = 'multiplier' in condition ? condition.multiplier : null;

  try {
    const repo = getAlertRepository();
    const alert = await repo.create(ctx.user!.id, {
      watchlistId,
      conditionType,
      threshold,
      multiplier,
    });

    // Refresh in-memory evaluator cache so alert is active immediately
    void AlertEvaluator.getInstance().syncAlerts();

    return createSuccessResponse(alert, 201);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return createErrorResponse('Watchlist item not found — check watchlistId', 404);
    }
    if (err instanceof DatabaseError) {
      return createErrorResponse(err.message, 500);
    }
    return createErrorResponse('Failed to create alert', 500);
  }
}

// ─── Route exports ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 120 }),
    getAlertsHandler,
  )(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 120 }),
    withValidation(CreateAlertSchema),
    createAlertHandler,
  )(request);
}