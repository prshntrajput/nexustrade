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
import { getYahooService } from '@/lib/services/yahoo.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/utils';
import { ExternalApiError } from '@/lib/errors';

const CandlesQuerySchema = z.object({
  symbol: SymbolSchema,
  // resolution kept for API compatibility — Yahoo always returns daily bars
  resolution: z.string().default('D'),
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
  const { symbol, from, to } = ctx.validatedData as CandlesQuery;

  if (from >= to) {
    return createErrorResponse('"from" must be earlier than "to"', 400);
  }

  try {
    const data = await getYahooService().getCandles(symbol, from, to);
    return createSuccessResponse(data);
  } catch (err) {
    if (err instanceof ExternalApiError) {
      console.error(`[GET /candles] symbol=${symbol}`, err.message);
      return createErrorResponse(err.message, 502, { provider: err.provider });
    }
    console.error(`[GET /candles] symbol=${symbol} unexpected error`, err);
    return createErrorResponse('Failed to fetch candles', 500);
  }
}

// Yahoo Finance has no tight API key limit — 100 RPM is a conservative ceiling
// to prevent abuse without restricting legitimate use
export async function GET(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'yahoo', rpm: 100 }),
    withValidation(CandlesQuerySchema),
    candlesHandler,
  )(request);
}
