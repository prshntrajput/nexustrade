'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Loader2, Bell, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WatchlistItem } from '@/types';

type ConditionType =
  | 'PRICE_ABOVE'
  | 'PRICE_BELOW'
  | 'RSI_ABOVE'
  | 'RSI_BELOW'
  | 'VOLUME_SPIKE'
  | '';

interface FormState {
  watchlistId: string;
  conditionType: ConditionType;
  threshold: string;
  multiplier: string;
}

interface AlertBuilderProps {
  watchlistItems: WatchlistItem[];
  onCreated: () => void;
}

const CONDITION_OPTIONS: {
  type: Exclude<ConditionType, ''>;
  label: string;
  hint: string;
  category: 'Price' | 'Technical' | 'Volume';
  categoryColor: string;
}[] = [
  {
    type: 'PRICE_ABOVE',
    label: 'Price Above',
    hint: 'Fires when price crosses above threshold',
    category: 'Price',
    categoryColor: 'bg-primary/10 text-primary',
  },
  {
    type: 'PRICE_BELOW',
    label: 'Price Below',
    hint: 'Fires when price drops below threshold',
    category: 'Price',
    categoryColor: 'bg-primary/10 text-primary',
  },
  {
    type: 'RSI_ABOVE',
    label: 'RSI Above',
    hint: 'Overbought signal — evaluated by scheduled analysis',
    category: 'Technical',
    categoryColor: 'bg-muted text-muted-foreground',
  },
  {
    type: 'RSI_BELOW',
    label: 'RSI Below',
    hint: 'Oversold signal — evaluated by scheduled analysis',
    category: 'Technical',
    categoryColor: 'bg-muted text-muted-foreground',
  },
  {
    type: 'VOLUME_SPIKE',
    label: 'Volume Spike',
    hint: 'Fires when volume exceeds normal by a set multiplier',
    category: 'Volume',
    categoryColor: 'bg-accent text-accent-foreground/80',
  },
];

function buildCondition(form: FormState): Record<string, unknown> | null {
  if (!form.conditionType) return null;

  if (form.conditionType === 'VOLUME_SPIKE') {
    const m = parseFloat(form.multiplier);
    if (isNaN(m) || m < 1.5) return null;
    return { type: 'VOLUME_SPIKE', multiplier: m };
  }

  const t = parseFloat(form.threshold);
  if (isNaN(t) || t <= 0) return null;

  if (
    (form.conditionType === 'RSI_ABOVE' || form.conditionType === 'RSI_BELOW') &&
    (t < 1 || t > 99)
  )
    return null;

  return { type: form.conditionType, threshold: t };
}

export function AlertBuilder({ watchlistItems = [], onCreated }: AlertBuilderProps) {
  const [form, setForm] = useState<FormState>({
    watchlistId: watchlistItems[0]?.id ?? '',
    conditionType: '',
    threshold: '',
    multiplier: '2',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setForm((f) => {
      if (!f.watchlistId && watchlistItems.length > 0) {
        return { ...f, watchlistId: watchlistItems[0]!.id };
      }
      return f;
    });
  }, [watchlistItems]);

  const isPrice =
    form.conditionType === 'PRICE_ABOVE' || form.conditionType === 'PRICE_BELOW';
  const isRSI =
    form.conditionType === 'RSI_ABOVE' || form.conditionType === 'RSI_BELOW';
  const isVolume = form.conditionType === 'VOLUME_SPIKE';
  const needsThreshold = isPrice || isRSI;

  const isValid =
    !!form.watchlistId &&
    !!form.conditionType &&
    (needsThreshold ? form.threshold !== '' : true) &&
    (isVolume ? form.multiplier !== '' : true);

  const handleConditionSelect = (type: Exclude<ConditionType, ''>) => {
    setForm((f) => ({
      ...f,
      conditionType: f.conditionType === type ? '' : type,
      threshold: '',
      multiplier: '2',
    }));
    setFormError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.watchlistId) {
      setFormError('Please select a symbol from your watchlist');
      return;
    }
    if (!form.conditionType) {
      setFormError('Please select an alert condition');
      return;
    }

    const condition = buildCondition(form);
    if (!condition) {
      setFormError(
        isRSI
          ? 'RSI must be between 1 and 99'
          : isVolume
            ? 'Multiplier must be at least 1.5×'
            : 'Enter a valid positive threshold',
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/gateway/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlistId: form.watchlistId, condition }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? 'Failed to create alert');
      }

      setForm({
        watchlistId: watchlistItems[0]?.id ?? '',
        conditionType: '',
        threshold: '',
        multiplier: '2',
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onCreated();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border p-4 sm:p-5 space-y-5 w-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <Bell size={16} className="text-primary" />
        </div>
        <div>
          <h2 className="text-foreground font-semibold text-[15px] leading-snug">
            Create Alert
          </h2>
          <p className="text-muted-foreground/70 text-xs mt-0.5">
            Get notified when conditions are triggered
          </p>
        </div>
      </div>

      {/* Step 1 — Symbol */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Symbol
        </label>

        {watchlistItems.length === 0 ? (
          <div className="px-3 py-3 bg-secondary border border-border">
            <p className="text-muted-foreground text-sm">
              Add symbols to your watchlist first before creating alerts.
            </p>
          </div>
        ) : (
          <div className="relative">
            <select
              value={form.watchlistId}
              onChange={(e) =>
                setForm((f) => ({ ...f, watchlistId: e.target.value }))
              }
              className={cn(
                'w-full appearance-none px-3 py-2.5 pr-8 text-sm',
                'bg-secondary border border-border text-foreground',
                'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
                'transition-all duration-150',
              )}
            >
              {watchlistItems.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                  className="bg-card text-foreground"
                >
                  {item.symbol}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        )}
      </div>

      {/* Step 2 — Condition type */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Condition
        </label>
        <div className="space-y-1.5">
          {CONDITION_OPTIONS.map((opt) => {
            const selected = form.conditionType === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleConditionSelect(opt.type)}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-3 py-2.5 border',
                  'text-left transition-all duration-150 min-h-[52px]',
                  selected
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-secondary border-border hover:border-border/70 hover:bg-muted',
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        selected ? 'text-primary' : 'text-foreground/80',
                      )}
                    >
                      {opt.label}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5',
                        opt.categoryColor,
                      )}
                    >
                      {opt.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                    {opt.hint}
                  </p>
                </div>
                {/* Selected checkmark */}
                {selected && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path
                        d="M1 4L3 6L7 2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary-foreground"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3 — Threshold input */}
      {needsThreshold && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isPrice ? 'Target Price (USD)' : 'RSI Threshold (0–100)'}
          </label>
          <input
            type="number"
            value={form.threshold}
            onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))}
            placeholder={isPrice ? 'e.g. 185.50' : 'e.g. 70'}
            min={isRSI ? 1 : 0.01}
            max={isRSI ? 99 : undefined}
            step={isPrice ? '0.01' : '1'}
            required
            className={cn(
              'w-full px-3 py-2.5 text-sm',
              'bg-secondary border border-border text-foreground',
              'placeholder:text-muted-foreground/40',
              'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
              'transition-all duration-150',
              '[appearance:textfield]',
              '[&::-webkit-outer-spin-button]:appearance-none',
              '[&::-webkit-inner-spin-button]:appearance-none',
            )}
          />
          {isRSI && (
            <p className="text-muted-foreground/50 text-xs">
              Common values: overbought = 70, oversold = 30
            </p>
          )}
        </div>
      )}

      {/* Step 3 — Volume multiplier */}
      {isVolume && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Volume Multiplier
          </label>
          <input
            type="number"
            value={form.multiplier}
            onChange={(e) => setForm((f) => ({ ...f, multiplier: e.target.value }))}
            placeholder="e.g. 2"
            min={1.5}
            step="0.5"
            required
            className={cn(
              'w-full px-3 py-2.5 text-sm',
              'bg-secondary border border-border text-foreground',
              'placeholder:text-muted-foreground/40',
              'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
              'transition-all duration-150',
              '[appearance:textfield]',
              '[&::-webkit-outer-spin-button]:appearance-none',
              '[&::-webkit-inner-spin-button]:appearance-none',
            )}
          />
          <p className="text-muted-foreground/50 text-xs">
            Minimum 1.5× — e.g., 2.0 = volume is 2× above daily average
          </p>
        </div>
      )}

      {/* Error */}
      {formError && (
        <p className="text-destructive text-xs bg-destructive/5 border border-destructive/20 px-3 py-2.5">
          {formError}
        </p>
      )}

      {/* Success */}
      {success && (
        <p className="text-primary text-xs bg-primary/5 border border-primary/20 px-3 py-2.5">
          ✓ Alert created — you&apos;ll be notified when the condition triggers
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || submitting || watchlistItems.length === 0}
        className={cn(
          'w-full flex items-center justify-center gap-2',
          'py-2.5 px-4 text-sm font-semibold transition-all duration-150',
          isValid && !submitting && watchlistItems.length > 0
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
            : 'bg-secondary text-muted-foreground/40 cursor-not-allowed',
        )}
      >
        {submitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Creating alert...
          </>
        ) : (
          <>
            <Plus size={14} />
            Create Alert
          </>
        )}
      </button>
    </form>
  );
}
