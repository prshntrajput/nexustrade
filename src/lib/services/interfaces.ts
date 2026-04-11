import type { Quote, CandleResponse, NewsItem, StockTick } from '@/types';

/**
 * LSP — All market data providers implement this interface.
 * FinnhubProvider and MockProvider (for tests) are interchangeable.
 */
export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number,
  ): Promise<CandleResponse>;
  getCompanyNews(symbol: string, daysBack: number): Promise<NewsItem[]>;
  subscribeToTicks(
    symbols: string[],
    onTick: (tick: StockTick) => void,
  ): () => void; // returns unsubscribe fn
}

/**
 * ISP — AI analysis is a separate, focused interface.
 */
export interface AIAnalysisProvider {
  analyze(prompt: string): Promise<{
    summary: string;
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    keyRisks: string[];
    keyOpportunities: string[];
    technicalOutlook: string;
  }>;
}