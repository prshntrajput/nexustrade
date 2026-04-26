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
import {
  INDEX_SYMBOLS,
  SECTOR_SYMBOLS,
  SECTOR_ETF_MAP,
} from '@/lib/market-data';
import type { Quote } from '@/types';

async function indicesHandler(
  _request: NextRequest,
  _ctx: RequestContext,
): Promise<Response> {
  const finnhub = getFinnhubService();
  const allSymbols = [...INDEX_SYMBOLS, ...SECTOR_SYMBOLS];

  try {
    const results = await Promise.allSettled(
      allSymbols.map((symbol) => finnhub.getQuote(symbol)),
    );

    const quoteMap: Record<string, Quote> = {};
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        quoteMap[allSymbols[i]!] = result.value;
      } else {
        console.warn(`[market/indices] Failed to fetch ${allSymbols[i]}: ${String(result.reason)}`);
      }
    });

    const indices: Record<string, Quote> = {};
    INDEX_SYMBOLS.forEach((sym) => {
      if (quoteMap[sym]) indices[sym] = quoteMap[sym]!;
    });

    const sectors: Record<string, { name: string; quote: Quote }> = {};
    SECTOR_SYMBOLS.forEach((sym) => {
      if (quoteMap[sym]) {
        sectors[sym] = { name: SECTOR_ETF_MAP[sym]!, quote: quoteMap[sym]! };
      }
    });

    return createSuccessResponse({ indices, sectors });
  } catch (err) {
    console.error('[GET /market/indices]', err);
    return createErrorResponse('Failed to fetch market indices', 500);
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'finnhub', rpm: 30 }),
    withCache({ ttl: 30 }),
    indicesHandler,
  )(request);
}
