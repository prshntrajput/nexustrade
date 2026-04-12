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
  BULLISH: { label: 'Bullish', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/20' },
  BEARISH: { label: 'Bearish', icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/20' },
  NEUTRAL: { label: 'Neutral', icon: Minus, color: 'text-gray-400', bg: 'bg-gray-500/15 border-gray-500/20' },
} as const;

const triggerMap = {
  alert: { label: 'Alert triggered', icon: Zap },
  manual: { label: 'Manual analysis', icon: User },
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

  const sentiment = sentimentMap[report.sentiment];
  const trigger = triggerMap[report.trigger];
  const SentimentIcon = sentiment.icon;
  const TriggerIcon = trigger.icon;
  const hasIndicators = report.indicators && report.indicators.rsi14 !== 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`AI Report: ${report.symbol}`}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex flex-col bg-gray-950 border-l border-gray-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-white tracking-wide">
              {report.symbol}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold',
                sentiment.bg,
                sentiment.color,
              )}
            >
              <SentimentIcon size={11} />
              {sentiment.label.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close report"
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-800 bg-gray-900/50 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <TriggerIcon size={11} />
            {trigger.label}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <Clock size={11} />
            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
          </span>
          <span className="text-xs text-gray-700 ml-auto">
            {format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')}
          </span>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Summary */}
          <div>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Summary
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* Key Risks */}
          {report.keyRisks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} className="text-red-400" />
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  Key Risks
                </h3>
              </div>
              <ul className="space-y-2.5">
                {report.keyRisks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500/60 shrink-0" />
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
                <Lightbulb size={13} className="text-emerald-400" />
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  Opportunities
                </h3>
              </div>
              <ul className="space-y-2.5">
                {report.keyOpportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500/60 shrink-0" />
                    {opp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Outlook */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={13} className="text-blue-400" />
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Technical Outlook
              </h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {report.technicalOutlook}
            </p>
          </div>

          {/* Indicators at time of analysis */}
          {hasIndicators && (
            <div>
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Indicators at Analysis Time
              </h3>
              <div className="bg-gray-900 rounded-xl px-4 py-1 border border-gray-800">
                {[
                  { label: 'RSI (14)', value: report.indicators.rsi14 },
                  { label: 'MACD', value: report.indicators.macd },
                  { label: 'Signal', value: report.indicators.signal },
                  { label: 'Histogram', value: report.indicators.histogram },
                  { label: 'BB Upper', value: report.indicators.bbUpper },
                  { label: 'BB Middle', value: report.indicators.bbMiddle },
                  { label: 'BB Lower', value: report.indicators.bbLower },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                  >
                    <span className="text-gray-600 text-xs">{label}</span>
                    <span className="text-white text-xs font-semibold tabular-nums">
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