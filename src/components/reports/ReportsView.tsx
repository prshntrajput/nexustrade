'use client';

import { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Loader2,
  FileText,
  Radio,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReports, type ReportFilters } from '@/hooks/useReports';
import { useWatchlist } from '@/hooks/useWatchlist';
import { ReportCard } from './ReportCard';
import { ReportDetail } from './ReportDetail';
import { ReportCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Report } from '@/types';

// ─── Analyze Button ───────────────────────────────────────────────────────────

function AnalyzeButton({
  symbol,
  onAnalyze,
}: {
  symbol: string;
  onAnalyze: (symbol: string) => Promise<void>;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'queued'>('idle');

  const handleClick = async () => {
    setState('loading');
    try {
      await onAnalyze(symbol);
      setState('queued');
      setTimeout(() => setState('idle'), 90_000);
    } catch {
      setState('idle');
    }
  };

  return (
    <div className="flex items-center justify-between py-2.5 px-3 bg-secondary border border-border hover:border-primary/30 transition-all">
      <span className="font-semibold text-foreground text-sm truncate mr-2">
        {symbol}
      </span>
      <button
        onClick={handleClick}
        disabled={state !== 'idle'}
        aria-label={`Run AI analysis for ${symbol}`}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 flex-shrink-0 whitespace-nowrap',
          state === 'idle'    && 'bg-primary/15 text-primary hover:bg-primary/25',
          state === 'loading' && 'bg-muted text-muted-foreground cursor-wait',
          state === 'queued'  && 'bg-primary/10 text-primary/70 cursor-default',
        )}
      >
        {state === 'loading' ? (
          <><Loader2 size={11} className="animate-spin" />Queuing…</>
        ) : state === 'queued' ? (
          <><Radio size={11} className="animate-pulse" />Running…</>
        ) : (
          <><Sparkles size={11} />Analyze</>
        )}
      </button>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const SENTIMENTS = [
  { label: 'All',     value: ''       },
  { label: 'Bullish', value: 'BULLISH'},
  { label: 'Bearish', value: 'BEARISH'},
  { label: 'Neutral', value: 'NEUTRAL'},
] as const;

const TRIGGERS = [
  { label: 'All',       value: ''          },
  { label: 'Alert',     value: 'alert'     },
  { label: 'Manual',    value: 'manual'    },
  { label: 'Scheduled', value: 'scheduled' },
] as const;

function FilterBar({
  filters,
  setFilters,
  symbols,
}: {
  filters: ReportFilters;
  setFilters: (f: ReportFilters) => void;
  symbols: string[];
}) {
  const hasActiveFilters = filters.symbol ?? filters.sentiment ?? filters.trigger;

  const setSymbol = (value: string) => {
    const next: ReportFilters = { ...filters };
    if (value) { next.symbol = value; } else { delete next.symbol; }
    setFilters(next);
  };

  const setSentiment = (value: string) => {
    const next: ReportFilters = { ...filters };
    if (value) { next.sentiment = value as NonNullable<ReportFilters['sentiment']>; } else { delete next.sentiment; }
    setFilters(next);
  };

  const setTrigger = (value: string) => {
    const next: ReportFilters = { ...filters };
    if (value) { next.trigger = value as NonNullable<ReportFilters['trigger']>; } else { delete next.trigger; }
    setFilters(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-card border border-border">
      {/* Label */}
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
        <Filter size={12} />
        <span className="hidden sm:inline">Filters</span>
      </div>

      {/* Symbol dropdown */}
      <select
        value={filters.symbol ?? ''}
        onChange={(e) => setSymbol(e.target.value)}
        className={cn(
          'px-2.5 py-1.5 bg-secondary border border-border text-foreground/80 text-xs',
          'focus:outline-none focus:border-primary transition-all',
        )}
      >
        <option value="">All Symbols</option>
        {symbols.map((s) => (
          <option key={s} value={s} className="bg-card text-foreground">
            {s}
          </option>
        ))}
      </select>

      {/* Sentiment pills */}
      <div className="flex gap-1 flex-wrap">
        {SENTIMENTS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSentiment(opt.value)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium transition-all',
              (filters.sentiment ?? '') === opt.value
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Trigger pills */}
      <div className="flex gap-1 flex-wrap">
        {TRIGGERS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTrigger(opt.value)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium transition-all',
              (filters.trigger ?? '') === opt.value
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={() => setFilters({})}
          className="flex items-center gap-1 ml-auto text-muted-foreground/60 hover:text-foreground text-xs transition-colors"
        >
          <X size={11} />
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function ReportsView() {
  const {
    reports,
    isLoading,
    isAnalyzing,
    hasMore,
    filters,
    setFilters,
    loadMore,
    mutate,
    deleteReport,
    triggerAnalysis,
  } = useReports();

  const { watchlist } = useWatchlist();
  const watchlistSymbols = watchlist.map((w) => w.symbol);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8 border-b border-border pb-5">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              AI Reports
            </h1>
            <p className="text-muted-foreground text-sm mt-1 leading-snug">
              Gemini-powered analysis — updates instantly when new reports arrive
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh reports"
            className={cn(
              'flex items-center gap-2 px-3 py-2 flex-shrink-0',
              'bg-secondary border border-border text-muted-foreground',
              'hover:text-foreground hover:bg-muted transition-all text-sm',
            )}
          >
            <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Live analyzing banner */}
        {isAnalyzing && (
          <div className="flex items-center gap-3 px-4 py-3 mb-5 sm:mb-6 bg-primary/10 border border-primary/20">
            <Radio size={14} className="text-primary animate-pulse shrink-0" />
            <p className="text-primary/80 text-sm leading-snug">
              AI analysis running — report will appear automatically when ready
            </p>
            <Loader2 size={13} className="text-primary animate-spin ml-auto shrink-0" />
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 sm:gap-6 items-start">

          {/* Left — Watchlist + analyze buttons */}
          <div className="lg:sticky lg:top-6 space-y-3 w-full">
            <div className="bg-card border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-primary" />
                <h2 className="text-foreground font-semibold text-sm">
                  Analyze Symbol
                </h2>
              </div>

              {watchlistSymbols.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2">
                  Add symbols to your watchlist first.
                </p>
              ) : (
                <div className="space-y-2">
                  {watchlistSymbols.map((symbol) => (
                    <AnalyzeButton
                      key={symbol}
                      symbol={symbol}
                      onAnalyze={triggerAnalysis}
                    />
                  ))}
                </div>
              )}

              <p className="text-muted-foreground/40 text-[11px] mt-4 leading-relaxed">
               
              </p>
            </div>
          </div>

          {/* Right — Reports */}
          <div className="space-y-3 sm:space-y-4 min-w-0">
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              symbols={watchlistSymbols}
            />

            {isLoading ? (
              <div className="space-y-3">
                <ReportCardSkeleton />
                <ReportCardSkeleton />
                <ReportCardSkeleton />
              </div>
            ) : reports.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No reports found"
                description={
                  filters.symbol ?? filters.sentiment ?? filters.trigger
                    ? 'No reports match your current filters. Try clearing the filters.'
                    : 'Click "Analyze" next to any symbol to generate your first AI-powered report.'
                }
                {...((filters.symbol ?? filters.sentiment ?? filters.trigger) && {
                  action: { label: 'Clear filters', onClick: () => setFilters({}) },
                })}
              />
            ) : (
              <>
                <div className="space-y-2 sm:space-y-3">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onDelete={deleteReport}
                      onClick={setSelectedReport}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={loadMore}
                      className={cn(
                        'flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all',
                        'bg-secondary border border-border text-muted-foreground',
                        'hover:bg-muted hover:text-foreground',
                      )}
                    >
                      Load more reports
                    </button>
                  </div>
                )}

                <p className="text-center text-muted-foreground/30 text-xs pt-1">
                  {reports.length} report{reports.length !== 1 ? 's' : ''} shown
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <ReportDetail
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}
