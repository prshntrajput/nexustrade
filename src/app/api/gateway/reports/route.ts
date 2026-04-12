import type { NextRequest } from 'next/server';
import { compose, withAuth, withRateLimit, withCache } from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/utils';
import { getReportRepository } from '@/lib/repositories/report.repository';
import { DatabaseError } from '@/lib/errors';

async function getReportsHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  try {
    const repo = getReportRepository();
    const reports = await repo.findByUserId(ctx.user!.id, 50);
    return createSuccessResponse(reports);
  } catch (err) {
    if (err instanceof DatabaseError) {
      return createErrorResponse(err.message, 500);
    }
    return createErrorResponse('Failed to fetch reports', 500);
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 60 }),
    withCache({ ttl: 30 }), // reports cached 30s — Inngest may write a new one
    getReportsHandler,
  )(request);
}