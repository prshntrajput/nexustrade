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
import { getFinnhubService } from '@/lib/services/finnhub.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/utils';
import { ExternalApiError, RateLimitError } from '@/lib/errors';

const ResolutionSchema = z.enum(['1', '5', '15', '30', '60', 'D', 'W', 'M']);

const CandlesQuerySchema = z.object({
  symbol: SymbolSchema,
  resolution: ResolutionSchema.default('D'),
  from: z.coerce
    .number()
    .optional()
    .default(() => Date.now() - 30 * 86_400_000),
  to: z.coerce
    .number()
    .optional()
    .default(() => Date.now()),
});

type CandlesQuery = z.infer<typeof CandlesQuerySchema>;

async function candlesHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const { symbol, resolution, from, to } = ctx.validatedData as CandlesQuery;

  if (from >= to) {
    return createErrorResponse('"from" must be earlier than "to"', 400);
  }

  try {
    const data = await getFinnhubService().getCandles(
      symbol,
      resolution,
      from,
      to,
    );
    return createSuccessResponse(data);
  } catch (err) {
    // ── Finnhub free plan returns 403 for historical candles ──────────────
    // This is an expected limitation — return 200 with empty candles +
    // freePlan flag so the UI can show a graceful upgrade notice
    if (
      err instanceof ExternalApiError &&
      (err.details as { status?: number })?.status === 403
    ) {
      console.warn(
        `[GET /candles] ${symbol} — Finnhub 403 (free plan). Returning empty.`,
      );
      return createSuccessResponse({
        symbol,
        candles: [],
        resolution,
        freePlan: true,
      });
    }

    if (err instanceof RateLimitError) {
      return createErrorResponse('Finnhub rate limit exceeded — retry in 60s', 429, {
        provider: err.provider,
      });
    }

    if (err instanceof ExternalApiError) {
      console.error(`[GET /candles] symbol=${symbol}`, err);
      return createErrorResponse(err.message, 502, {
        provider: err.provider,
        details: err.details,
      });
    }

    console.error(`[GET /candles] symbol=${symbol} unexpected error`, err);
    return createErrorResponse('Failed to fetch candles', 500);
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'finnhub', rpm: 55 }),
    withValidation(CandlesQuerySchema),
    candlesHandler,
  )(request);
}