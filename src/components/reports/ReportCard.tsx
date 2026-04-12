'use client';

import { useState } from 'react';
import { Trash2, ChevronRight, TrendingUp, TrendingDown, Minus, Clock, Zap, User, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Report } from '@/types';

const sentimentConfig = {
  BULLISH: {
    icon: TrendingUp,
    label: 'Bullish',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  },
  BEARISH: {
    icon: TrendingDown,
    label: 'Bearish',
    className: 'bg-red-500/15 text-red-400 border-red-500/20',
  },
  NEUTRAL: {
    icon: Minus,
    label: 'Neutral',
    className: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  },
} as const;

const triggerConfig = {
  alert: { icon: Zap, label: 'Alert triggered' },
  manual: { icon: User, label: 'Manual' },
  scheduled: { icon: Calendar, label: 'Scheduled' },
} as const;

interface ReportCardProps {
  report: Report;
  onDelete: (id: string) => Promise<void>;
  onClick: (report: Report) => void;
}

export function ReportCard({ report, onDelete, onClick }: ReportCardProps) {
  const [deleting, setDeleting] = useState(false);

  const sentiment = sentimentConfig[report.sentiment];
  const trigger = triggerConfig[report.trigger];
  const SentimentIcon = sentiment.icon;
  const TriggerIcon = trigger.icon;

  const timeAgo = formatDistanceToNow(new Date(report.createdAt), {
    addSuffix: true,
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className={cn(
        'group relative flex flex-col gap-3 p-5 cursor-pointer',
        'bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl',
        'transition-all duration-150',
        deleting && 'opacity-40 pointer-events-none',
      )}
    >
      {/* Top row: symbol + sentiment + time */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold text-white text-base tracking-wide">
            {report.symbol}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold tracking-wide',
              sentiment.className,
            )}
          >
            <SentimentIcon size={10} />
            {sentiment.label.toUpperCase()}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-gray-700 text-xs">
            <TriggerIcon size={10} />
            {trigger.label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-gray-700 text-xs">
            <Clock size={10} />
            {timeAgo}
          </span>
          <button
            onClick={handleDelete}
            aria-label={`Delete report for ${report.symbol}`}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-gray-700 hover:text-red-400 transition-all"
          >
            <Trash2 size={13} />
          </button>
          <ChevronRight
            size={14}
            className="text-gray-700 group-hover:text-gray-500 transition-colors"
          />
        </div>
      </div>

      {/* Summary preview */}
      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
        {report.summary}
      </p>

      {/* Bottom: risks count + opportunities count */}
      <div className="flex items-center gap-4 text-xs">
        {report.keyRisks.length > 0 && (
          <span className="text-red-500/70">
            {report.keyRisks.length} risk{report.keyRisks.length !== 1 ? 's' : ''}
          </span>
        )}
        {report.keyOpportunities.length > 0 && (
          <span className="text-emerald-500/70">
            {report.keyOpportunities.length} opportunity{report.keyOpportunities.length !== 1 ? 'ies' : 'y'}
          </span>
        )}
      </div>
    </div>
  );
}