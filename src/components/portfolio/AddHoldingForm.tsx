'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CreateHoldingSchema } from '@/lib/schemas/portfolio.schema';
import type { CreateHolding } from '@/lib/schemas/portfolio.schema';

interface AddHoldingFormProps {
  onSuccess: () => void;
}

export function AddHoldingForm({ onSuccess }: AddHoldingFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateHolding>({
    resolver: zodResolver(CreateHoldingSchema),
  });

  const onSubmit = async (data: CreateHolding) => {
    try {
      const res = await fetch('/api/gateway/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const json = (await res.json()) as
        | { success: true }
        | { success: false; error: { message: string } };

      if (!json.success) {
        toast.error(
          (json as { success: false; error: { message: string } }).error
            .message,
        );
        return;
      }

      toast.success(`${data.symbol.toUpperCase()} added to portfolio`);
      reset();
      setIsOpen(false);
      onSuccess();
    } catch {
      toast.error('Network error — please try again.');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border transition-all duration-150',
          'bg-primary/10 border-primary/30 text-primary',
          'hover:bg-primary/20 hover:border-primary/50',
        )}
      >
        <Plus size={15} />
        Add Holding
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card border border-border p-4 space-y-4"
    >
      <h3 className="text-sm font-semibold text-foreground">Add / Update Holding</h3>
      <p className="text-xs text-muted-foreground -mt-2">
        If the symbol already exists, its shares and price will be updated.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Symbol */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Symbol *
          </label>
          <input
            {...register('symbol')}
            placeholder="AAPL"
            className={cn(
              'w-full bg-secondary border px-3 py-2 text-sm uppercase',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:border-primary/50',
              'transition-colors',
              errors.symbol ? 'border-destructive' : 'border-border',
            )}
          />
          {errors.symbol && (
            <p className="text-destructive text-[11px] mt-1">
              {errors.symbol.message}
            </p>
          )}
        </div>

        {/* Shares */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Shares *
          </label>
          <input
            {...register('shares', { valueAsNumber: true })}
            type="number"
            step="0.000001"
            min="0.000001"
            placeholder="10"
            className={cn(
              'w-full bg-secondary border px-3 py-2 text-sm',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:border-primary/50',
              'transition-colors',
              errors.shares ? 'border-destructive' : 'border-border',
            )}
          />
          {errors.shares && (
            <p className="text-destructive text-[11px] mt-1">
              {errors.shares.message}
            </p>
          )}
        </div>

        {/* Avg Buy Price */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Avg Buy Price ($) *
          </label>
          <input
            {...register('avgBuyPrice', { valueAsNumber: true })}
            type="number"
            step="0.0001"
            min="0.0001"
            placeholder="150.00"
            className={cn(
              'w-full bg-secondary border px-3 py-2 text-sm',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:border-primary/50',
              'transition-colors',
              errors.avgBuyPrice ? 'border-destructive' : 'border-border',
            )}
          />
          {errors.avgBuyPrice && (
            <p className="text-destructive text-[11px] mt-1">
              {errors.avgBuyPrice.message}
            </p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          Notes (optional)
        </label>
        <input
          {...register('notes')}
          placeholder="Long-term hold, tech exposure…"
          maxLength={200}
          className={cn(
            'w-full bg-secondary border border-border px-3 py-2 text-sm',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:border-primary/50 transition-colors',
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border transition-all',
            'bg-primary/15 border-primary/30 text-primary',
            'hover:bg-primary/25 disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={() => { reset(); setIsOpen(false); }}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
