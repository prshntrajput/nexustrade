import { z } from 'zod';
import { type NextRequest } from 'next/server';
import { SymbolSchema } from '@/lib/schemas/stock.schema';
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
import { getReportRepository } from '@/lib/repositories/report.repository';

// ─── GET — list reports (optional symbol filter) ──────────────────────────────

const ReportsQuerySchema = z.object({
  symbol: SymbolSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

type ReportsQuery = z.infer<typeof ReportsQuerySchema>;

async function getReportsHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const { symbol, limit } = ctx.validatedData as ReportsQuery;

  try {
    const repo = getReportRepository();
    const reports = await repo.findByUserId(ctx.user!.id, { symbol, limit });
    return createSuccessResponse(reports);
  } catch (err) {
    console.error('[GET /reports]', err);
    return createErrorResponse('Failed to fetch reports', 500);
  }
}

// ─── DELETE — delete a single report ─────────────────────────────────────────

async function deleteReportHandler(
  request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return createErrorResponse('Missing report id', 400);

  try {
    await getReportRepository().deleteById(ctx.user!.id, id);
    return createSuccessResponse({ deleted: true });
  } catch (err) {
    console.error('[DELETE /reports]', err);
    return createErrorResponse('Failed to delete report', 500);
  }
}

// ─── Route exports ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 60 }),
    withValidation(ReportsQuerySchema),
    getReportsHandler,
  )(request);
}

export async function DELETE(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 30 }),
    deleteReportHandler,
  )(request);
}