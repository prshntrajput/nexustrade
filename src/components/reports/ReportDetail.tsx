'use client';

import { useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  Lightbulb,
  BarChart2,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Report } from '@/types';

interface ReportDetailProps {
  report: Report | null;
  onClose: () => void;
}

const sentimentConfig = {
  BULLISH: {
    label: 'Bullish',
    icon: TrendingUp,
    classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  },
  BEARISH: {
    label: 'Bearish',
    icon: TrendingDown,
    classes: 'bg-red-500/10 text-red-400 border border-red-500/20',
  },
  NEUTRAL: {
    label: 'Neutral',
    icon: Minus,
    classes: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  },
} as const;

function RSIGauge({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const pct = clamped;
  const label =
    value > 70 ? 'Overbought' : value < 30 ? 'Oversold' : 'Neutral';
  const color =
    value > 70
      ? 'bg-red-500'
      : value < 30
        ? 'bg-emerald-500'
        : 'bg-yellow-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">RSI(14)</span>
        <span
          className={cn(
            'font-bold',
            value > 70
              ? 'text-red-400'
              : value < 30
                ? 'text-emerald-400'
                : 'text-yellow-500',
          )}
        >
          {value.toFixed(2)} — {label}
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-700">
        <span>0 (Oversold)</span>
        <span>30</span>
        <span>70</span>
        <span>100 (Overbought)</span>
      </div>
    </div>
  );
}

function IndicatorRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span
        className={cn(
          'text-sm font-mono font-medium',
          positive === undefined
            ? 'text-white'
            : positive
              ? 'text-emerald-400'
              : 'text-red-400',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function ReportDetail({ report, onClose }: ReportDetailProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (report) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [report]);

  if (!report) return null;

  const sentiment = sentimentConfig[report.sentiment];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-in panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${report.symbol} Analysis Report`}
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50',
          'w-full max-w-[600px]',
          'bg-gray-950 border-l border-gray-800',
          'overflow-y-auto',
          'animate-in slide-in-from-right duration-300',
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-lg">{report.symbol}</span>
            <span
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                sentiment.classes,
              )}
            >
              <sentiment.icon size={12} strokeWidth={2.5} />
              {sentiment.label}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close report"
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-7">
          {/* Summary */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Summary
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {report.summary}
            </p>
          </section>

          {/* Technical Outlook */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={13} className="text-gray-600" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Technical Outlook
              </h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed bg-gray-900 rounded-xl p-4 border border-gray-800">
              {report.technicalOutlook}
            </p>
          </section>

          {/* Indicators */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={13} className="text-gray-600" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Indicators
              </h3>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-5">
              {/* RSI Gauge */}
              <RSIGauge value={report.indicators.rsi14} />

              {/* MACD + BB values */}
              <div className="space-y-0">
                <IndicatorRow
                  label="MACD"
                  value={report.indicators.macd.toFixed(4)}
                  positive={report.indicators.macd > 0}
                />
                <IndicatorRow
                  label="Signal"
                  value={report.indicators.signal.toFixed(4)}
                />
                <IndicatorRow
                  label="Histogram"
                  value={report.indicators.histogram.toFixed(4)}
                  positive={report.indicators.histogram > 0}
                />
                <IndicatorRow
                  label="BB Upper"
                  value={`$${report.indicators.bbUpper.toFixed(2)}`}
                />
                <IndicatorRow
                  label="BB Middle (SMA 20)"
                  value={`$${report.indicators.bbMiddle.toFixed(2)}`}
                />
                <IndicatorRow
                  label="BB Lower"
                  value={`$${report.indicators.bbLower.toFixed(2)}`}
                />
              </div>
            </div>
          </section>

          {/* Key Risks */}
          {report.keyRisks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={13} className="text-red-500/70" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Key Risks
                </h3>
              </div>
              <ul className="space-y-2">
                {report.keyRisks.map((risk, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-gray-400"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500/60 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Key Opportunities */}
          {report.keyOpportunities.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={13} className="text-emerald-500/70" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Key Opportunities
                </h3>
              </div>
              <ul className="space-y-2">
                {report.keyOpportunities.map((opp, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-gray-400"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500/60 flex-shrink-0" />
                    {opp}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-700 pt-2 border-t border-gray-800 space-y-1">
            <p>Trigger: {report.trigger}</p>
            <p>
              Generated:{' '}
              {new Date(report.createdAt).toLocaleString('en-IN', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
            {report.alertId && <p>Alert ID: {report.alertId}</p>}
          </div>
        </div>
      </div>
    </>
  );
}