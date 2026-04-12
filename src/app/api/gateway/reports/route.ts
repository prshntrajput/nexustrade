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
import type { ReportFilters } from '@/lib/repositories/report.repository';

// ─── GET ──────────────────────────────────────────────────────────────────────

const ReportsQuerySchema = z.object({
  symbol: SymbolSchema.optional(),
  sentiment: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']).optional(),
  trigger: z.enum(['alert', 'manual', 'scheduled']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

type ReportsQuery = z.infer<typeof ReportsQuerySchema>;

async function getReportsHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const { symbol, sentiment, trigger, limit, offset } =
    ctx.validatedData as ReportsQuery;

  // exactOptionalPropertyTypes: true means we cannot pass `undefined` values
  // explicitly — build the filters object conditionally instead
  const filters: ReportFilters = { limit, offset };
  if (symbol !== undefined) filters.symbol = symbol;
  if (sentiment !== undefined) filters.sentiment = sentiment;
  if (trigger !== undefined) filters.trigger = trigger;

  try {
    const reports = await getReportRepository().findByUserId(
      ctx.user!.id,
      filters,
    );
    return createSuccessResponse(reports);
  } catch (err) {
    console.error('[GET /reports]', err);
    return createErrorResponse('Failed to fetch reports', 500);
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

const DeleteQuerySchema = z.object({
  id: z.string().uuid('Invalid report ID'),
});

async function deleteReportHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const { id } = ctx.validatedData as { id: string };

  try {
    await getReportRepository().deleteById(ctx.user!.id, id);
    return createSuccessResponse({ deleted: true });
  } catch (err) {
    console.error('[DELETE /reports]', err);
    return createErrorResponse('Failed to delete report', 500);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

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
    withValidation(DeleteQuerySchema),
    deleteReportHandler,
  )(request);
}