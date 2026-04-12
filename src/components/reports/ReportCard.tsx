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
    className: 'bg-primary/15 text-primary border-primary/20',
  },
  BEARISH: {
    icon: TrendingDown,
    label: 'Bearish',
    className: 'bg-destructive/15 text-destructive border-destructive/20',
  },
  NEUTRAL: {
    icon: Minus,
    label: 'Neutral',
    className: 'bg-muted text-muted-foreground border-border',
  },
} as const;

const triggerConfig = {
  alert:     { icon: Zap,      label: 'Alert triggered' },
  manual:    { icon: User,     label: 'Manual'          },
  scheduled: { icon: Calendar, label: 'Scheduled'       },
} as const;

interface ReportCardProps {
  report: Report;
  onDelete: (id: string) => Promise<void>;
  onClick: (report: Report) => void;
}

export function ReportCard({ report, onDelete, onClick }: ReportCardProps) {
  const [deleting, setDeleting] = useState(false);

  const sentiment  = sentimentConfig[report.sentiment];
  const trigger    = triggerConfig[report.trigger];
  const SentimentIcon = sentiment.icon;
  const TriggerIcon   = trigger.icon;

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
        'group relative flex flex-col gap-3 p-4 sm:p-5 cursor-pointer',
        'bg-card border border-border hover:border-primary/30',
        'transition-all duration-150',
        deleting && 'opacity-40 pointer-events-none',
      )}
    >
      {/* Top row: symbol + sentiment + time */}
      <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">

        {/* Left — symbol + badges */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="font-bold text-foreground text-base tracking-wide">
            {report.symbol}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 border text-[11px] font-bold tracking-wide flex-shrink-0',
              sentiment.className,
            )}
          >
            <SentimentIcon size={10} />
            {sentiment.label.toUpperCase()}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-muted-foreground/50 text-xs flex-shrink-0">
            <TriggerIcon size={10} />
            {trigger.label}
          </span>
        </div>

        {/* Right — time + actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <span className="flex items-center gap-1 text-muted-foreground/50 text-xs whitespace-nowrap">
            <Clock size={10} />
            <span className="hidden xs:inline sm:inline">{timeAgo}</span>
          </span>
          <button
            onClick={handleDelete}
            aria-label={`Delete report for ${report.symbol}`}
            className={cn(
              'p-1.5 text-muted-foreground/40 transition-all duration-150',
              'hover:bg-destructive/10 hover:text-destructive',
              'opacity-0 group-hover:opacity-100 focus:opacity-100',
            )}
          >
            <Trash2 size={13} />
          </button>
          <ChevronRight
            size={14}
            className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0"
          />
        </div>
      </div>

      {/* Summary preview */}
      <p className="text-foreground/60 text-sm leading-relaxed line-clamp-2">
        {report.summary}
      </p>

      {/* Bottom: risks + opportunities counts */}
      <div className="flex items-center gap-3 sm:gap-4 text-xs flex-wrap">
        {report.keyRisks.length > 0 && (
          <span className="text-destructive/60">
            {report.keyRisks.length} risk{report.keyRisks.length !== 1 ? 's' : ''}
          </span>
        )}
        {report.keyOpportunities.length > 0 && (
          <span className="text-primary/60">
            {report.keyOpportunities.length}{' '}
            opportunit{report.keyOpportunities.length !== 1 ? 'ies' : 'y'}
          </span>
        )}
      </div>
    </div>
  );
}
