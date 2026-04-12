import { z } from 'zod';
import { SymbolSchema } from './stock.schema';

export const AlertConditionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PRICE_ABOVE'),
    threshold: z.number().positive('Threshold must be a positive number'),
  }),
  z.object({
    type: z.literal('PRICE_BELOW'),
    threshold: z.number().positive('Threshold must be a positive number'),
  }),
  z.object({
    type: z.literal('RSI_ABOVE'),
    threshold: z.number().min(0).max(100, 'RSI must be between 0 and 100'),
  }),
  z.object({
    type: z.literal('RSI_BELOW'),
    threshold: z.number().min(0).max(100, 'RSI must be between 0 and 100'),
  }),
  z.object({
    type: z.literal('VOLUME_SPIKE'),
    multiplier: z.number().min(1.5, 'Multiplier must be at least 1.5×'),
  }),
]);

export const CreateAlertSchema = z.object({
  watchlistId: z.string().uuid('Invalid watchlist ID'),
  condition: AlertConditionSchema,
});

export const UpdateAlertSchema = z.object({
  isActive: z.boolean(),
});

export const AlertSchema = z.object({
  id: z.string().uuid(),
  watchlistId: z.string().uuid(),
  userId: z.string().uuid(),
  conditionType: z.enum([
    'PRICE_ABOVE',
    'PRICE_BELOW',
    'RSI_ABOVE',
    'RSI_BELOW',
    'VOLUME_SPIKE',
  ]),
  threshold: z.number().nullable(),
  multiplier: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

// Returned by GET — includes symbol from watchlist join
export const AlertWithSymbolSchema = AlertSchema.extend({
  symbol: SymbolSchema,
});

export const AlertFiredEventSchema = z.object({
  userId: z.string().uuid(),
  symbol: SymbolSchema,
  alertId: z.string().uuid(),
  trigger: z.enum(['alert', 'manual', 'scheduled']),
  conditionType: z.string(),
  firedAt: z.number(),
});

export type AlertCondition = z.infer<typeof AlertConditionSchema>;
export type CreateAlert = z.infer<typeof CreateAlertSchema>;
export type UpdateAlert = z.infer<typeof UpdateAlertSchema>;
export type Alert = z.infer<typeof AlertSchema>;
export type AlertWithSymbol = z.infer<typeof AlertWithSymbolSchema>;
export type AlertFiredEvent = z.infer<typeof AlertFiredEventSchema>;