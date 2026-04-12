'use client';

import { useState } from 'react';
import {
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  MousePointerClick,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Report } from '@/types';

interface ReportCardProps {
  report: Report;
  onDelete: (id: string) => Promise<void>;
  onClick: (report: Report) => void;
}

const sentimentConfig = {
  BULLISH: {
    label: 'Bullish',
    icon: TrendingUp,
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    bar: 'bg-emerald-500',
  },
  BEARISH: {
    label: 'Bearish',
    icon: TrendingDown,
    classes: 'bg-red-500/10 text-red-400 border-red-500/20',
    bar: 'bg-red-500',
  },
  NEUTRAL: {
    label: 'Neutral',
    icon: Minus,
    classes: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    bar: 'bg-yellow-500',
  },
} as const;

const triggerConfig = {
  alert: {
    label: 'Alert triggered',
    icon: Bell,
    classes: 'bg-blue-500/10 text-blue-400',
  },
  manual: {
    label: 'Manual analysis',
    icon: MousePointerClick,
    classes: 'bg-gray-700 text-gray-400',
  },
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    classes: 'bg-purple-500/10 text-purple-400',
  },
} as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RSIBadge({ value }: { value: number }) {
  const label =
    value > 70 ? 'Overbought' : value < 30 ? 'Oversold' : 'Neutral';
  const color =
    value > 70
      ? 'text-red-400'
      : value < 30
        ? 'text-emerald-400'
        : 'text-gray-500';

  return (
    <span className="text-[11px] text-gray-600">
      RSI <span className={cn('font-semibold', color)}>{value.toFixed(1)}</span>
      <span className="text-gray-700"> · {label}</span>
    </span>
  );
}

export function ReportCard({ report, onDelete, onClick }: ReportCardProps) {
  const [deleting, setDeleting] = useState(false);
  const sentiment = sentimentConfig[report.sentiment];
  const trigger = triggerConfig[report.trigger];
  const TriggerIcon = trigger.icon;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't open detail modal
    setDeleting(true);
    try {
      await onDelete(report.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={() => onClick(report)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(report)}
      aria-label={`View ${report.symbol} analysis report`}
      className={cn(
        'relative group cursor-pointer',
        'bg-gray-900 border border-gray-800 rounded-xl p-4',
        'hover:border-gray-700 hover:bg-gray-900/80',
        'transition-all duration-150 select-none',
        deleting && 'opacity-30 scale-[0.98] pointer-events-none',
      )}
    >
      {/* Sentiment bar */}
      <div
        className={cn(
          'absolute left-0 top-4 bottom-4 w-[3px] rounded-full',
          sentiment.bar,
        )}
      />

      <div className="pl-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Symbol */}
            <span className="font-bold text-white text-[15px] tracking-wide flex-shrink-0">
              {report.symbol}
            </span>

            {/* Sentiment badge */}
            <span
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                sentiment.classes,
              )}
            >
              <sentiment.icon size={11} strokeWidth={2.5} />
              {sentiment.label}
            </span>

            {/* Trigger badge */}
            <span
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium hidden sm:flex',
                trigger.classes,
              )}
            >
              <TriggerIcon size={10} />
              {trigger.label}
            </span>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete report"
            aria-label="Delete report"
            className={cn(
              'opacity-0 group-hover:opacity-100 flex-shrink-0',
              'w-7 h-7 rounded-lg flex items-center justify-center',
              'bg-red-500/5 text-red-500/50 hover:bg-red-500/15 hover:text-red-400',
              'transition-all duration-150',
            )}
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Summary excerpt */}
        <p className="text-gray-400 text-sm mt-2 leading-relaxed line-clamp-2">
          {report.summary}
        </p>

        {/* Footer row: indicators + date */}
        <div className="flex items-center justify-between gap-4 mt-2.5">
          <div className="flex items-center gap-3">
            <RSIBadge value={report.indicators.rsi14} />
            <span className="text-[11px] text-gray-700">
              MACD{' '}
              <span
                className={cn(
                  'font-semibold',
                  report.indicators.histogram > 0
                    ? 'text-emerald-600'
                    : 'text-red-500',
                )}
              >
                {report.indicators.histogram > 0 ? '▲' : '▼'}
              </span>
            </span>
          </div>
          <span className="text-[11px] text-gray-700 flex-shrink-0">
            {formatDate(report.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}