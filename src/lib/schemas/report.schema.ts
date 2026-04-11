import { z } from 'zod';
import { SymbolSchema, IndicatorsSchema } from './stock.schema';

export const ReportSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  symbol: SymbolSchema,
  triggeredBy: z.enum(['alert', 'manual', 'scheduled']),
  indicators: IndicatorsSchema,
  newsCount: z.number().int().nonnegative().nullable(),
  aiSummary: z.string(),
  sentiment: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']).nullable(),
  keyRisks: z.array(z.string()),
  keyOpportunities: z.array(z.string()),
  technicalOutlook: z.string().nullable(),
  createdAt: z.string(),
});

export const GeminiResponseSchema = z.object({
  summary: z.string(),
  sentiment: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']),
  keyRisks: z.array(z.string()),
  keyOpportunities: z.array(z.string()),
  technicalOutlook: z.string(),
});

export type Report = z.infer<typeof ReportSchema>;
export type GeminiResponse = z.infer<typeof GeminiResponseSchema>;