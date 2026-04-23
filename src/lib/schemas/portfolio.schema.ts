import { z } from 'zod';
import { SymbolSchema } from './stock.schema';

export const HoldingSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  symbol: SymbolSchema,
  shares: z.number().positive(),
  avgBuyPrice: z.number().positive(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateHoldingSchema = z.object({
  symbol: SymbolSchema,
  shares: z.number().positive('Shares must be a positive number'),
  avgBuyPrice: z.number().positive('Average buy price must be a positive number'),
  notes: z.string().max(200).optional(),
});

export const UpdateHoldingSchema = z
  .object({
    shares: z.number().positive('Shares must be a positive number').optional(),
    avgBuyPrice: z
      .number()
      .positive('Average buy price must be a positive number')
      .optional(),
    notes: z.string().max(200).optional(),
  })
  .refine(
    (data) =>
      data.shares !== undefined ||
      data.avgBuyPrice !== undefined ||
      data.notes !== undefined,
    { message: 'At least one field must be provided for update' },
  );

export type Holding = z.infer<typeof HoldingSchema>;
export type CreateHolding = z.infer<typeof CreateHoldingSchema>;
export type UpdateHolding = z.infer<typeof UpdateHoldingSchema>;
