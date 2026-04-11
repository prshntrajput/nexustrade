import { z } from 'zod';

export const SymbolSchema = z
  .string()
  .min(1)
  .max(10)
  .toUpperCase()
  .regex(/^[A-Z]+$/, 'Symbol must contain only uppercase letters');

export const QuoteSchema = z.object({
  symbol: SymbolSchema,
  price: z.number().positive(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number().nonnegative(),
  high: z.number().positive(),
  low: z.number().positive(),
  open: z.number().positive(),
  previousClose: z.number().positive(),
  timestamp: z.number(),
});

export const CandleSchema = z.object({
  time: z.number(),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().nonnegative(),
});

export const CandleResponseSchema = z.object({
  symbol: SymbolSchema,
  candles: z.array(CandleSchema),
  resolution: z.string(),
});

export const StockTickSchema = z.object({
  symbol: SymbolSchema,
  price: z.number().positive(),
  volume: z.number().nonnegative(),
  timestamp: z.number(),
});

export const NewsItemSchema = z.object({
  id: z.number().or(z.string()),
  headline: z.string(),
  summary: z.string().optional(),
  source: z.string(),
  url: z.string().url(),
  datetime: z.number(),
  image: z.string().optional(),
  related: z.string().optional(),
});

export const IndicatorsSchema = z.object({
  rsi14: z.number(),
  macd: z.number(),
  signal: z.number(),
  histogram: z.number(),
  bbUpper: z.number(),
  bbMiddle: z.number(),
  bbLower: z.number(),
});

// TypeScript types — all derived from Zod, ZERO manual types
export type Symbol = z.infer<typeof SymbolSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type Candle = z.infer<typeof CandleSchema>;
export type CandleResponse = z.infer<typeof CandleResponseSchema>;
export type StockTick = z.infer<typeof StockTickSchema>;
export type NewsItem = z.infer<typeof NewsItemSchema>;
export type Indicators = z.infer<typeof IndicatorsSchema>;