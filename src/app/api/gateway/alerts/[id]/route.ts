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
import { UpdateAlertSchema } from '@/lib/schemas/alert.schema';
import type { UpdateAlert } from '@/types';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { AlertEvaluator } from '@/lib/alert.evaluator';

// ─── PATCH /api/gateway/alerts/[id] — toggle isActive ────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 120 }),
    withValidation(UpdateAlertSchema),
    async (_req: NextRequest, ctx: RequestContext): Promise<Response> => {
      const { isActive } = ctx.validatedData as UpdateAlert;

      try {
        const repo = getAlertRepository();
        const alert = await repo.updateActive(id, ctx.user!.id, isActive);

        // Refresh evaluator cache
        void AlertEvaluator.getInstance().syncAlerts();

        return createSuccessResponse(alert);
      } catch (err) {
        if (err instanceof NotFoundError) {
          return createErrorResponse('Alert not found', 404);
        }
        if (err instanceof DatabaseError) {
          return createErrorResponse('Failed to update alert', 500);
        }
        return createErrorResponse('Unexpected error', 500);
      }
    },
  )(request);
}

// ─── DELETE /api/gateway/alerts/[id] ─────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 120 }),
    async (_req: NextRequest, ctx: RequestContext): Promise<Response> => {
      try {
        const repo = getAlertRepository();
        await repo.delete(id, ctx.user!.id);

        // Refresh evaluator cache
        void AlertEvaluator.getInstance().syncAlerts();

        return createSuccessResponse({ deleted: true, id });
      } catch (err) {
        if (err instanceof NotFoundError) {
          return createErrorResponse('Alert not found', 404);
        }
        if (err instanceof DatabaseError) {
          return createErrorResponse('Failed to delete alert', 500);
        }
        return createErrorResponse('Unexpected error', 500);
      }
    },
  )(request);
}