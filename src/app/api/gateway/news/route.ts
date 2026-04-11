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

// Schema — days is a string in URL params, z.coerce converts it to number
const NewsQuerySchema = z.object({
  symbol: SymbolSchema,
  days: z.coerce.number().int().min(1).max(30).default(7),
});

type NewsQuery = z.infer<typeof NewsQuerySchema>;

async function newsHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const { symbol, days } = ctx.validatedData as NewsQuery;

  try {
    const news = await getFinnhubService().getCompanyNews(symbol, days);
    return createSuccessResponse({ symbol, news, count: news.length });
  } catch (err) {
    if (err instanceof ExternalApiError) {
      return createErrorResponse(err.message, 502, { provider: err.provider });
    }
    return createErrorResponse('Failed to fetch news', 500);
  }
}

export const GET = compose(
  withAuth,
  withRateLimit({ service: 'finnhub', rpm: 55 }),
  withValidation(NewsQuerySchema),
  withCache({ ttl: 300 }), // news is cached for 5 minutes
  newsHandler,
);