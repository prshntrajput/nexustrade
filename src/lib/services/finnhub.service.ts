import {
  QuoteSchema,
  CandleResponseSchema,
  NewsItemSchema,
} from '@/lib/schemas/stock.schema';
import { ExternalApiError, RateLimitError } from '@/lib/errors';
import type { MarketDataProvider } from './interfaces';
import type { Quote, CandleResponse, NewsItem, StockTick } from '@/types';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// Raw shapes returned by Finnhub REST API
interface FinnhubRawQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // day high
  l: number;  // day low
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

interface FinnhubRawCandles {
  s: 'ok' | 'no_data';
  c?: number[];
  h?: number[];
  l?: number[];
  o?: number[];
  t?: number[];
  v?: number[];
}

interface FinnhubRawNewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

// ─── Exponential backoff helper ─────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1_000,
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof RateLimitError && attempt < maxRetries) {
        const jitter = Math.random() * 200;
        const delay = baseDelay * Math.pow(2, attempt) + jitter;
        await sleep(delay);
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// ─── FinnhubService ──────────────────────────────────────────────────────────

export class FinnhubService implements MarketDataProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // ─── Private fetch with auth + error handling ──────────────────────────

  private async fetchFinnhub<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${FINNHUB_BASE}${path}`);
    url.searchParams.set('token', this.apiKey);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      // Disable Next.js data cache — always fetch fresh market data
      cache: 'no-store',
    });

    if (res.status === 429) {
      throw new RateLimitError('finnhub');
    }

    if (!res.ok) {
      throw new ExternalApiError(
        `Finnhub responded with ${res.status}`,
        'finnhub',
        { status: res.status, path },
      );
    }

    return res.json() as Promise<T>;
  }

  // ─── getQuote ───────────────────────────────────────────────────────────

  async getQuote(symbol: string): Promise<Quote> {
    return withRetry(async () => {
      const raw = await this.fetchFinnhub<FinnhubRawQuote>('/quote', {
        symbol: symbol.toUpperCase(),
      });

      // Reject Finnhub's "invalid symbol" response (all zeros)
      if (raw.c === 0 && raw.t === 0) {
        throw new ExternalApiError(
          `No quote data found for symbol: ${symbol}`,
          'finnhub',
        );
      }

      const mapped = {
        symbol: symbol.toUpperCase(),
        price: raw.c,
        change: raw.d,
        changePercent: raw.dp,
        high: raw.h,
        low: raw.l,
        open: raw.o,
        previousClose: raw.pc,
        timestamp: raw.t,
      };

      const result = QuoteSchema.safeParse(mapped);
      if (!result.success) {
        throw new ExternalApiError(
          'Finnhub quote response failed validation',
          'finnhub',
          result.error.flatten(),
        );
      }

      return result.data;
    });
  }

  // ─── getCandles ─────────────────────────────────────────────────────────

  async getCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number,
  ): Promise<CandleResponse> {
    return withRetry(async () => {
      const raw = await this.fetchFinnhub<FinnhubRawCandles>('/stock/candle', {
        symbol: symbol.toUpperCase(),
        resolution,
        from: String(Math.floor(from / 1000)), // Finnhub uses Unix seconds
        to: String(Math.floor(to / 1000)),
      });

      if (raw.s === 'no_data' || !raw.t || raw.t.length === 0) {
        return { symbol: symbol.toUpperCase(), candles: [], resolution };
      }

      const candles = raw.t.map((time, i) => ({
        time: time * 1000, // convert back to milliseconds
        open: raw.o![i]!,
        high: raw.h![i]!,
        low: raw.l![i]!,
        close: raw.c![i]!,
        volume: raw.v![i] ?? 0,
      }));

      const mapped = {
        symbol: symbol.toUpperCase(),
        candles,
        resolution,
      };

      const result = CandleResponseSchema.safeParse(mapped);
      if (!result.success) {
        throw new ExternalApiError(
          'Finnhub candles response failed validation',
          'finnhub',
          result.error.flatten(),
        );
      }

      return result.data;
    });
  }

  // ─── getCompanyNews ─────────────────────────────────────────────────────

  async getCompanyNews(symbol: string, daysBack: number): Promise<NewsItem[]> {
    return withRetry(async () => {
      const to = new Date();
      const from = new Date(to.getTime() - daysBack * 86_400_000);

      const toDate = to.toISOString().split('T')[0]!;
      const fromDate = from.toISOString().split('T')[0]!;

      const raw = await this.fetchFinnhub<FinnhubRawNewsItem[]>(
        '/company-news',
        {
          symbol: symbol.toUpperCase(),
          from: fromDate,
          to: toDate,
        },
      );

      if (!Array.isArray(raw)) return [];

      // Parse and filter — skip items that fail validation
      return raw
        .map((item) =>
          NewsItemSchema.safeParse({
            id: item.id,
            headline: item.headline,
            summary: item.summary,
            source: item.source,
            url: item.url,
            datetime: item.datetime,
            image: item.image || undefined,
            related: item.related || undefined,
          }),
        )
        .filter((r) => r.success)
        .map((r) => r.data);
    });
  }

  // ─── subscribeToTicks — implemented in Phase 4 (WebSocket Manager) ─────

  subscribeToTicks(
    _symbols: string[],
    _onTick: (tick: StockTick) => void,
  ): () => void {
    // Implemented in Phase 4 via websocket.manager.ts
    console.warn('[FinnhubService] subscribeToTicks: not yet implemented');
    return () => {};
  }
}

// ─── Singleton exported for use across the app ────────────────────────────

let _finnhubService: FinnhubService | null = null;

export function getFinnhubService(): FinnhubService {
  if (_finnhubService) return _finnhubService;

  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY is not set');

  _finnhubService = new FinnhubService(key);
  return _finnhubService;
}