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
import type { Quote } from '@/types';

// Accepts: ?symbols=AAPL,MSFT,GOOGL (max 20 symbols)
const QuotesQuerySchema = z.object({
  symbols: z
    .string()
    .min(1)
    .transform((s) =>
      s
        .split(',')
        .map((x) => x.trim().toUpperCase())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(SymbolSchema)
        .min(1, 'At least one symbol is required')
        .max(20, 'Maximum 20 symbols per request'),
    ),
});

type QuotesQuery = z.infer<typeof QuotesQuerySchema>;

async function quotesHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const { symbols } = ctx.validatedData as QuotesQuery;
  const finnhub = getFinnhubService();

  try {
    // Fetch all quotes concurrently — Finnhub free tier supports /quote for all symbols
    const results = await Promise.allSettled(
      symbols.map((symbol) => finnhub.getQuote(symbol)),
    );

    // Build a map of symbol → quote, silently dropping failed fetches
    const quoteMap: Record<string, Quote> = {};
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        quoteMap[symbols[i]!] = result.value;
      } else {
        console.warn(
          `[GET /quotes] Failed to fetch ${symbols[i]}: ${String(result.reason)}`,
        );
      }
    });

    return createSuccessResponse(quoteMap);
  } catch (err) {
    console.error('[GET /quotes]', err);
    return createErrorResponse('Failed to fetch quotes', 500);
  }
}

// Rate limit at Finnhub's RPM / typical max symbols so a single batch call
// does not exhaust the per-minute budget for the rest of the app
export async function GET(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'finnhub', rpm: 55 }),
    withValidation(QuotesQuerySchema),
    quotesHandler,
  )(request);
}
