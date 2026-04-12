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

const QuoteQuerySchema = z.object({
  symbol: SymbolSchema,
});

type QuoteQuery = z.infer<typeof QuoteQuerySchema>;

async function quoteHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const { symbol } = ctx.validatedData as QuoteQuery;
  try {
    const quote = await getFinnhubService().getQuote(symbol);
    return createSuccessResponse(quote);
  } catch (err) {
    if (err instanceof ExternalApiError) {
      return createErrorResponse(err.message, 502, { provider: err.provider });
    }
    return createErrorResponse('Failed to fetch quote', 500);
  }
}

// ← explicit function declaration — Turbopack detects this immediately
export async function GET(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'finnhub', rpm: 55 }),
    withValidation(QuoteQuerySchema),
    withCache({ ttl: 15 }),
    quoteHandler,
  )(request);
}