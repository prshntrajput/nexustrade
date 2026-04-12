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
    categoryColor: 'bg-blue-500/10 text-blue-400',
  },
  {
    type: 'PRICE_BELOW',
    label: 'Price Below',
    hint: 'Fires when price drops below threshold',
    category: 'Price',
    categoryColor: 'bg-blue-500/10 text-blue-400',
  },
  {
    type: 'RSI_ABOVE',
    label: 'RSI Above',
    hint: 'Overbought signal — evaluated by scheduled analysis',
    category: 'Technical',
    categoryColor: 'bg-purple-500/10 text-purple-400',
  },
  {
    type: 'RSI_BELOW',
    label: 'RSI Below',
    hint: 'Oversold signal — evaluated by scheduled analysis',
    category: 'Technical',
    categoryColor: 'bg-purple-500/10 text-purple-400',
  },
  {
    type: 'VOLUME_SPIKE',
    label: 'Volume Spike',
    hint: 'Fires when volume exceeds normal by a set multiplier',
    category: 'Volume',
    categoryColor: 'bg-orange-500/10 text-orange-400',
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

// ← default prop = [] so watchlistItems is NEVER undefined on first render
export function AlertBuilder({ watchlistItems = [], onCreated }: AlertBuilderProps) {
  const [form, setForm] = useState<FormState>({
    // Safe now — watchlistItems defaults to [] so [0] is just undefined, not a crash
    watchlistId: watchlistItems[0]?.id ?? '',
    conditionType: '',
    threshold: '',
    multiplier: '2',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ← Auto-select first watchlist item once SWR loads (initial state was '' because SWR was loading)
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
      className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Bell size={16} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-[15px] leading-snug">
            Create Alert
          </h2>
          <p className="text-gray-600 text-xs mt-0.5">
            Get notified when conditions are triggered
          </p>
        </div>
      </div>

      {/* Step 1 — Symbol */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Symbol
        </label>

        {watchlistItems.length === 0 ? (
          <div className="px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg">
            <p className="text-gray-600 text-sm">
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
                'w-full appearance-none px-3 py-2.5 pr-8 rounded-lg text-sm',
                'bg-gray-800 border border-gray-700 text-white',
                'focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30',
                'transition-all duration-150',
              )}
            >
              {watchlistItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.symbol}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        )}
      </div>

      {/* Step 2 — Condition type */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                  'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border',
                  'text-left transition-all duration-150',
                  selected
                    ? 'bg-emerald-500/10 border-emerald-600/40'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600',
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        selected ? 'text-emerald-400' : 'text-gray-300',
                      )}
                    >
                      {opt.label}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                        opt.categoryColor,
                      )}
                    >
                      {opt.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">{opt.hint}</p>
                </div>
                {selected && (
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path
                        d="M1 4L3 6L7 2"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3 — Dynamic parameter (discriminated union) */}
      {needsThreshold && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
              'w-full px-3 py-2.5 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700 text-white placeholder-gray-600',
              'focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30',
              'transition-all duration-150',
              '[appearance:textfield]',
              '[&::-webkit-outer-spin-button]:appearance-none',
              '[&::-webkit-inner-spin-button]:appearance-none',
            )}
          />
          {isRSI && (
            <p className="text-gray-700 text-xs">
              Common values: overbought = 70, oversold = 30
            </p>
          )}
        </div>
      )}

      {isVolume && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
              'w-full px-3 py-2.5 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700 text-white placeholder-gray-600',
              'focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30',
              'transition-all duration-150',
              '[appearance:textfield]',
              '[&::-webkit-outer-spin-button]:appearance-none',
              '[&::-webkit-inner-spin-button]:appearance-none',
            )}
          />
          <p className="text-gray-700 text-xs">
            Minimum 1.5× — e.g., 2.0 = volume is 2× above daily average
          </p>
        </div>
      )}

      {/* Error */}
      {formError && (
        <p className="text-red-400 text-xs bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2.5">
          {formError}
        </p>
      )}

      {/* Success */}
      {success && (
        <p className="text-emerald-400 text-xs bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2.5">
          ✓ Alert created — you&apos;ll be notified when the condition triggers
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || submitting || watchlistItems.length === 0}
        className={cn(
          'w-full flex items-center justify-center gap-2',
          'py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-150',
          isValid && !submitting && watchlistItems.length > 0
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed',
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