// yahoo-finance2 v3 default export is a class, not a singleton instance.
// Must be instantiated with `new` before calling any methods.
import YahooFinanceClass from 'yahoo-finance2';
import { ExternalApiError } from '@/lib/errors';
import { CandleResponseSchema } from '@/lib/schemas/stock.schema';
import type { CandleResponse } from '@/types';

// chart() quote shape returned by yahoo-finance2 v3
interface YahooChartQuote {
  date: Date | string;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  adjclose?: number | null;
  volume?: number | null;
}

// Single class instance reused across all requests (one HTTP connection pool)
const yahooFinance = new YahooFinanceClass({
  // Suppress the console notice about historical() being deprecated —
  // we use chart() directly so this would never appear, but set it anyway
  suppressNotices: ['ripHistorical'],
});

export class YahooFinanceService {
  async getCandles(
    symbol: string,
    from: number,
    to: number,
  ): Promise<CandleResponse> {
    try {
      const result = await yahooFinance.chart(symbol.toUpperCase(), {
        period1: new Date(from),
        period2: new Date(to),
        interval: '1d',
      });

      const quotes: YahooChartQuote[] = result?.quotes ?? [];

      if (quotes.length === 0) {
        return { symbol: symbol.toUpperCase(), candles: [], resolution: 'D' };
      }

      // Filter out incomplete rows (trading halts, pre-IPO padding, etc.)
      const candles = quotes
        .filter(
          (q) =>
            q.open != null &&
            q.high != null &&
            q.low != null &&
            q.close != null &&
            q.close > 0,
        )
        .map((q) => ({
          time:
            q.date instanceof Date
              ? q.date.getTime()
              : new Date(q.date as string).getTime(),
          open: q.open!,
          high: q.high!,
          low: q.low!,
          close: q.close!,
          volume: q.volume ?? 0,
        }))
        .sort((a, b) => a.time - b.time); // guarantee chronological order

      const mapped = { symbol: symbol.toUpperCase(), candles, resolution: 'D' };

      const parsed = CandleResponseSchema.safeParse(mapped);
      if (!parsed.success) {
        throw new ExternalApiError(
          'Yahoo Finance candles response failed validation',
          'yahoo',
          parsed.error.issues,
        );
      }

      return parsed.data;
    } catch (err) {
      if (err instanceof ExternalApiError) throw err;

      throw new ExternalApiError(
        `Yahoo Finance fetch failed for ${symbol}: ${err instanceof Error ? err.message : String(err)}`,
        'yahoo',
        { symbol },
      );
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _service: YahooFinanceService | null = null;

export function getYahooService(): YahooFinanceService {
  if (!_service) _service = new YahooFinanceService();
  return _service;
}
