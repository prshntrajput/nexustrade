import type { NextRequest } from 'next/server';
import { compose, withAuth, withRateLimit } from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/utils';
import { getReportRepository } from '@/lib/repositories/report.repository';
import { DatabaseError, NotFoundError } from '@/lib/errors';

// GET /api/gateway/reports/[id] — single report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 120 }),
    async (_req: NextRequest, ctx: RequestContext): Promise<Response> => {
      try {
        const repo = getReportRepository();
        const report = await repo.findById(id, ctx.user!.id);

        if (!report) {
          return createErrorResponse('Report not found', 404);
        }

        return createSuccessResponse(report);
      } catch (err) {
        if (err instanceof DatabaseError) {
          return createErrorResponse(err.message, 500);
        }
        return createErrorResponse('Failed to fetch report', 500);
      }
    },
  )(request);
}

// DELETE /api/gateway/reports/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 60 }),
    async (_req: NextRequest, ctx: RequestContext): Promise<Response> => {
      try {
        const repo = getReportRepository();
        await repo.delete(id, ctx.user!.id);
        return createSuccessResponse({ deleted: true, id });
      } catch (err) {
        if (err instanceof NotFoundError) {
          return createErrorResponse('Report not found', 404);
        }
        if (err instanceof DatabaseError) {
          return createErrorResponse('Failed to delete report', 500);
        }
        return createErrorResponse('Unexpected error', 500);
      }
    },
  )(request);
}