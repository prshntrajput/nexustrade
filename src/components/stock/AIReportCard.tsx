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
  }[sentiment];

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold tracking-wide',
        config.className,
      )}
    >
      <Icon size={11} />
      {config.label.toUpperCase()}
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

  const Icon = type === 'risk' ? AlertTriangle : Lightbulb;
  const dotColor =
    type === 'risk' ? 'bg-red-500/60' : 'bg-emerald-500/60';
  const iconColor =
    type === 'risk' ? 'text-red-400' : 'text-emerald-400';

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className={iconColor} />
        <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
            <span
              className={cn(
                'mt-1.5 w-1.5 h-1.5 rounded-full shrink-0',
                dotColor,
              )}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Indicator Bar (RSI, MACD, etc.) ─────────────────────────────────────────

function IndicatorRow({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
      <span className="text-gray-600 text-xs">{label}</span>
      <span className="text-white text-xs font-semibold tabular-nums">
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
    alert: 'Alert triggered',
    manual: 'Manual analysis',
    scheduled: 'Scheduled digest',
  };

  const hasIndicators =
    report.indicators &&
    Object.values(report.indicators).some((v) => v !== 0);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <SentimentBadge sentiment={report.sentiment} />
            <span className="text-gray-600 text-xs">
              {triggerLabel[report.trigger]}
            </span>
          </div>
          <p className="text-gray-200 text-sm leading-relaxed">
            {report.summary}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 px-5 py-2 border-t border-gray-800 bg-gray-900/50">
        <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
          <Clock size={10} />
          {timeAgo}
        </span>
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-800 text-gray-500 hover:text-gray-300 transition-colors text-xs font-medium"
      >
        {expanded ? 'Hide details' : 'Show risks, opportunities & technicals'}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-6 border-t border-gray-800 pt-5">
          {/* Risks + Opportunities side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

          {/* Technical outlook */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={13} className="text-blue-400" />
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Technical Outlook
              </h4>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {report.technicalOutlook}
            </p>
          </div>

          {/* Indicators at time of analysis */}
          {hasIndicators && (
            <div>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Indicators at Time of Analysis
              </h4>
              <div className="bg-gray-800/50 rounded-xl px-4 py-1">
                <IndicatorRow label="RSI (14)" value={report.indicators.rsi14} />
                <IndicatorRow label="MACD" value={report.indicators.macd} />
                <IndicatorRow label="Signal" value={report.indicators.signal} />
                <IndicatorRow
                  label="Histogram"
                  value={report.indicators.histogram}
                />
                <IndicatorRow
                  label="BB Upper"
                  value={report.indicators.bbUpper}
                />
                <IndicatorRow
                  label="BB Middle"
                  value={report.indicators.bbMiddle}
                />
                <IndicatorRow
                  label="BB Lower"
                  value={report.indicators.bbLower}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}