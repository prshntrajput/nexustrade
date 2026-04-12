import { z } from 'zod';
import { SymbolSchema, IndicatorsSchema } from './stock.schema';

export const ReportSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  symbol: SymbolSchema,
  alertId: z.string().uuid().nullable(),
  trigger: z.enum(['alert', 'manual', 'scheduled']),
  summary: z.string(),
  sentiment: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']),
  keyRisks: z.array(z.string()),
  keyOpportunities: z.array(z.string()),
  technicalOutlook: z.string(),
  indicators: IndicatorsSchema,
  createdAt: z.string(),
});

export const AnalyzeRequestSchema = z.object({
  symbol: SymbolSchema,
});

export type Report = z.infer<typeof ReportSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;