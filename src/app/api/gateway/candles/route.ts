import { z } from 'zod';
import { type NextRequest } from 'next/server';
import { SymbolSchema } from '@/lib/schemas/stock.schema';
import {
  compose,
  withAuth,
  withRateLimit,
  withValidation,
  withCache,
} from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import { getFinnhubService } from '@/lib/services/finnhub.service';
import { createSuccessResponse, createErrorResponse } from '@/lib/middleware/utils';
import { ExternalApiError } from '@/lib/errors';

// Valid resolutions supported by Finnhub
const ResolutionSchema = z.enum(['1', '5', '15', '30', '60', 'D', 'W', 'M']);

const CandlesQuerySchema = z.object({
  symbol: SymbolSchema,
  resolution: ResolutionSchema.default('D'),
  // from/to are Unix milliseconds — coerce from string URL param
  from: z.coerce
    .number()
    .optional()
    .default(() => Date.now() - 30 * 86_400_000), // default: last 30 days
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
    const data = await getFinnhubService().getCandles(symbol, resolution, from, to);
    return createSuccessResponse(data);
  } catch (err) {
    if (err instanceof ExternalApiError) {
      return createErrorResponse(err.message, 502, { provider: err.provider });
    }
    return createErrorResponse('Failed to fetch candles', 500);
  }
}

export const GET = compose(
  withAuth,
  withRateLimit({ service: 'finnhub', rpm: 55 }),
  withValidation(CandlesQuerySchema),
  withCache({ ttl: 60 }), // candle data cached for 60 seconds
  candlesHandler,
);