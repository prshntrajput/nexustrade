import { type NextRequest } from 'next/server';
import {
  compose,
  withAuth,
  withRateLimit,
  withCache,
} from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import { getFinnhubService } from '@/lib/services/finnhub.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/utils';
import { SCREENER_SYMBOLS } from '@/lib/market-data';
import type { Quote } from '@/types';

async function screenerHandler(
  _request: NextRequest,
  _ctx: RequestContext,
): Promise<Response> {
  const finnhub = getFinnhubService();

  try {
    const results = await Promise.allSettled(
      SCREENER_SYMBOLS.map((symbol) => finnhub.getQuote(symbol)),
    );

    const quoteMap: Record<string, Quote> = {};
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        quoteMap[SCREENER_SYMBOLS[i]!] = result.value;
      } else {
        console.warn(`[market/screener] Failed to fetch ${SCREENER_SYMBOLS[i]}: ${String(result.reason)}`);
      }
    });

    return createSuccessResponse(quoteMap);
  } catch (err) {
    console.error('[GET /market/screener]', err);
    return createErrorResponse('Failed to fetch screener data', 500);
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'finnhub', rpm: 10 }),
    withCache({ ttl: 60 }),
    screenerHandler,
  )(request);
}
