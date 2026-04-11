import { z } from 'zod';
import { SymbolSchema } from './stock.schema';

export const WatchlistItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  symbol: SymbolSchema,
  addedAt: z.string(),
  notes: z.string().nullable(),
});

export const CreateWatchlistItemSchema = z.object({
  symbol: SymbolSchema,
  notes: z.string().max(500).optional(),
});

export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;
export type CreateWatchlistItem = z.infer<typeof CreateWatchlistItemSchema>;