export const INDEX_ETF_LABELS: Record<string, string> = {
  SPY: 'S&P 500',
  QQQ: 'NASDAQ 100',
  DIA: 'Dow Jones',
  IWM: 'Russell 2000',
  GLD: 'Gold',
  TLT: 'US Bonds',
};

export const INDEX_SYMBOLS = Object.keys(INDEX_ETF_LABELS);

export const SECTOR_ETF_MAP: Record<string, string> = {
  XLK: 'Technology',
  XLV: 'Healthcare',
  XLF: 'Financials',
  XLE: 'Energy',
  XLY: 'Consumer Disc.',
  XLP: 'Consumer Staples',
  XLU: 'Utilities',
  XLB: 'Materials',
  XLI: 'Industrials',
  XLRE: 'Real Estate',
  XLC: 'Communication',
};

export const SECTOR_SYMBOLS = Object.keys(SECTOR_ETF_MAP);

export interface ScreenerStock {
  symbol: string;
  name: string;
  sector: string;
}

export const SCREENER_STOCKS: ScreenerStock[] = [
  // Technology
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Technology' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },
  // Healthcare
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
  { symbol: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare' },
  { symbol: 'MRK', name: 'Merck & Co.', sector: 'Healthcare' },
  // Financials
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials' },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Financials' },
  { symbol: 'WFC', name: 'Wells Fargo', sector: 'Financials' },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'Financials' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials' },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financials' },
  // Energy
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron Corp.', sector: 'Energy' },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
  // Consumer
  { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer' },
  { symbol: 'MCD', name: "McDonald's Corp.", sector: 'Consumer' },
  { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer' },
  { symbol: 'SBUX', name: 'Starbucks Corp.', sector: 'Consumer' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer' },
  { symbol: 'COST', name: 'Costco Wholesale', sector: 'Consumer' },
  // Industrials
  { symbol: 'BA', name: 'Boeing Co.', sector: 'Industrials' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials' },
  { symbol: 'GE', name: 'GE Aerospace', sector: 'Industrials' },
  { symbol: 'HON', name: 'Honeywell Intl.', sector: 'Industrials' },
  // Communication
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication' },
  { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Communication' },
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication' },
  { symbol: 'CMCSA', name: 'Comcast Corp.', sector: 'Communication' },
];

export const SCREENER_SYMBOLS = SCREENER_STOCKS.map((s) => s.symbol);

export const SCREENER_SECTORS = [
  'All',
  ...Array.from(new Set(SCREENER_STOCKS.map((s) => s.sector))),
];
