'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SymbolSchema } from '@/lib/schemas/stock.schema';

const FormSchema = z.object({
  symbol: SymbolSchema,
  notes: z.string().max(500, 'Notes must be under 500 characters').optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface AddSymbolFormProps {
  existingSymbols: string[];
  onAdd: (symbol: string, notes?: string) => Promise<void>;
}

export function AddSymbolForm({ existingSymbols, onAdd }: AddSymbolFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const upper = values.symbol.toUpperCase();

    if (existingSymbols.includes(upper)) {
      setServerError(`${upper} is already in your watchlist`);
      return;
    }

    try {
      await onAdd(upper, values.notes);
      reset();
      setExpanded(false);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to add symbol');
    }
  };

  const handleCancel = () => {
    setExpanded(false);
    setServerError(null);
    reset();
  };

  if (!expanded) {
    return (
      <Button onClick={() => setExpanded(true)}>
        <Plus size={15} />
        Add Symbol
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col sm:flex-row items-start gap-3 p-4 bg-gray-900 border border-gray-700 rounded-xl"
    >
      <div className="w-full sm:w-36">
        <Input
          {...register('symbol')}
          placeholder="e.g. AAPL"
          className="uppercase"
          autoFocus
          autoComplete="off"
          maxLength={10}
          // exactOptionalPropertyTypes: only pass error when it exists
          {...(errors.symbol?.message && { error: errors.symbol.message })}
        />
      </div>

      <div className="flex-1 w-full">
        <Input
          {...register('notes')}
          placeholder="Notes (optional)"
          {...(errors.notes?.message && { error: errors.notes.message })}
        />
      </div>

      {serverError && (
        <p className="text-red-400 text-xs self-center whitespace-nowrap">
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button type="submit" isLoading={isSubmitting}>
          {!isSubmitting && 'Add'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          aria-label="Cancel"
        >
          <X size={16} />
        </Button>
      </div>
    </form>
  );
}