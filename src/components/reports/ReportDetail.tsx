'use client';

import { useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  BarChart2,
  Zap,
  User,
  Calendar,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Report } from '@/types';

interface ReportDetailProps {
  report: Report | null;
  onClose: () => void;
}

const sentimentMap = {
  BULLISH: {
    label: 'Bullish',
    icon: TrendingUp,
    color: 'text-primary',
    bg: 'bg-primary/15 border-primary/20',
  },
  BEARISH: {
    label: 'Bearish',
    icon: TrendingDown,
    color: 'text-destructive',
    bg: 'bg-destructive/15 border-destructive/20',
  },
  NEUTRAL: {
    label: 'Neutral',
    icon: Minus,
    color: 'text-muted-foreground',
    bg: 'bg-muted border-border',
  },
} as const;

const triggerMap = {
  alert:     { label: 'Alert triggered',  icon: Zap      },
  manual:    { label: 'Manual analysis',  icon: User     },
  scheduled: { label: 'Scheduled digest', icon: Calendar },
} as const;

export function ReportDetail({ report, onClose }: ReportDetailProps) {
  // Escape key closes the panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (report) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [report]);

  if (!report) return null;

  const sentiment    = sentimentMap[report.sentiment];
  const trigger      = triggerMap[report.trigger];
  const SentimentIcon = sentiment.icon;
  const TriggerIcon   = trigger.icon;
  const hasIndicators = report.indicators && report.indicators.rsi14 !== 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/75 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel — full-screen on mobile, max-lg on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`AI Report: ${report.symbol}`}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex flex-col overflow-hidden',
          'w-full sm:max-w-md lg:max-w-lg',
          'bg-background border-l border-border shadow-2xl',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg sm:text-xl font-bold text-foreground tracking-wide truncate">
              {report.symbol}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 border text-[11px] font-bold flex-shrink-0',
                sentiment.bg,
                sentiment.color,
              )}
            >
              <SentimentIcon size={11} />
              <span className="hidden xs:inline">{sentiment.label.toUpperCase()}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close report"
            className={cn(
              'p-2 flex-shrink-0 ml-2',
              'text-muted-foreground hover:text-foreground hover:bg-secondary transition-all',
            )}
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2.5 border-b border-border bg-card shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <TriggerIcon size={11} />
            {trigger.label}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Clock size={11} />
            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
          </span>
          <span className="text-xs text-muted-foreground/40 sm:ml-auto">
            {format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')}
          </span>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">

          {/* Summary */}
          <div>
            <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
              Summary
            </h3>
            <p className="text-foreground/80 text-sm leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* Key Risks */}
          {report.keyRisks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} className="text-destructive flex-shrink-0" />
                <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Key Risks
                </h3>
              </div>
              <ul className="space-y-2.5">
                {report.keyRisks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/70">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive/60 shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Opportunities */}
          {report.keyOpportunities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={13} className="text-primary flex-shrink-0" />
                <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Opportunities
                </h3>
              </div>
              <ul className="space-y-2.5">
                {report.keyOpportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/70">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                    {opp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Outlook */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={13} className="text-primary/70 flex-shrink-0" />
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Technical Outlook
              </h3>
            </div>
            <p className="text-foreground/70 text-sm leading-relaxed">
              {report.technicalOutlook}
            </p>
          </div>

          {/* Indicators at time of analysis */}
          {hasIndicators && (
            <div>
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
                Indicators at Analysis Time
              </h3>
              <div className="bg-card border border-border px-4 py-1">
                {[
                  { label: 'RSI (14)',   value: report.indicators.rsi14     },
                  { label: 'MACD',       value: report.indicators.macd      },
                  { label: 'Signal',     value: report.indicators.signal    },
                  { label: 'Histogram',  value: report.indicators.histogram },
                  { label: 'BB Upper',   value: report.indicators.bbUpper   },
                  { label: 'BB Middle',  value: report.indicators.bbMiddle  },
                  { label: 'BB Lower',   value: report.indicators.bbLower   },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-muted-foreground/60 text-xs">{label}</span>
                    <span className="text-foreground text-xs font-semibold tabular-nums">
                      {typeof value === 'number' ? value.toFixed(4) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
