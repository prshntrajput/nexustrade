'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Report } from '@/types';

// ─── Sentiment Badge ──────────────────────────────────────────────────────────

function SentimentBadge({ sentiment }: { sentiment: Report['sentiment'] }) {
  const config = {
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
  }[sentiment];

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-bold tracking-wide flex-shrink-0',
        config.className,
      )}
    >
      <Icon size={11} />
      <span className="hidden xs:inline">{config.label.toUpperCase()}</span>
    </span>
  );
}

// ─── Section: Risks & Opportunities ──────────────────────────────────────────

function ListSection({
  title,
  items,
  type,
}: {
  title: string;
  items: string[];
  type: 'risk' | 'opportunity';
}) {
  if (items.length === 0) return null;

  const Icon     = type === 'risk' ? AlertTriangle : Lightbulb;
  const dotColor = type === 'risk' ? 'bg-destructive/60' : 'bg-primary/60';
  const iconColor = type === 'risk' ? 'text-destructive' : 'text-primary';

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className={cn(iconColor, 'flex-shrink-0')} />
        <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/70">
            <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Indicator Row ────────────────────────────────────────────────────────────

function IndicatorRow({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground/60 text-xs">{label}</span>
      <span className="text-foreground text-xs font-semibold tabular-nums">
        {typeof value === 'number' ? value.toFixed(2) : value}
      </span>
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

interface AIReportCardProps {
  report: Report;
}

export function AIReportCard({ report }: AIReportCardProps) {
  const [expanded, setExpanded] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(report.createdAt), {
    addSuffix: true,
  });

  const triggerLabel: Record<Report['trigger'], string> = {
    alert:     'Alert triggered',
    manual:    'Manual analysis',
    scheduled: 'Scheduled digest',
  };

  const hasIndicators =
    report.indicators &&
    Object.values(report.indicators).some((v) => v !== 0);

  return (
    <div className="bg-card border border-border overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between p-4 sm:p-5 pb-3 sm:pb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
            <SentimentBadge sentiment={report.sentiment} />
            <span className="text-muted-foreground/60 text-xs truncate">
              {triggerLabel[report.trigger]}
            </span>
          </div>
          <p className="text-foreground/80 text-sm leading-relaxed">
            {report.summary}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 px-4 sm:px-5 py-2 border-t border-border bg-secondary/30">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
          <Clock size={10} />
          {timeAgo}
        </span>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-4 sm:px-5 py-3',
          'border-t border-border text-xs font-medium transition-colors',
          'text-muted-foreground hover:text-foreground hover:bg-secondary/40',
        )}
      >
        <span>
          {expanded ? 'Hide details' : 'Show risks, opportunities & technicals'}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-4 sm:pt-5 space-y-5 sm:space-y-6 border-t border-border">

          {/* Risks + Opportunities side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <ListSection
              title="Key Risks"
              items={report.keyRisks}
              type="risk"
            />
            <ListSection
              title="Opportunities"
              items={report.keyOpportunities}
              type="opportunity"
            />
          </div>

          {/* Technical Outlook */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={13} className="text-primary/70 flex-shrink-0" />
              <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Technical Outlook
              </h4>
            </div>
            <p className="text-foreground/70 text-sm leading-relaxed">
              {report.technicalOutlook}
            </p>
          </div>

          {/* Indicators at time of analysis */}
          {hasIndicators && (
            <div>
              <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
                Indicators at Time of Analysis
              </h4>
              <div className="bg-secondary/50 border border-border px-4 py-1">
                <IndicatorRow label="RSI (14)"  value={report.indicators.rsi14}     />
                <IndicatorRow label="MACD"      value={report.indicators.macd}      />
                <IndicatorRow label="Signal"    value={report.indicators.signal}    />
                <IndicatorRow label="Histogram" value={report.indicators.histogram} />
                <IndicatorRow label="BB Upper"  value={report.indicators.bbUpper}   />
                <IndicatorRow label="BB Middle" value={report.indicators.bbMiddle}  />
                <IndicatorRow label="BB Lower"  value={report.indicators.bbLower}   />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
