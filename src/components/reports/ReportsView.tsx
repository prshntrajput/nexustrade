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
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all">
      <span className="font-semibold text-white text-sm">{symbol}</span>
      <button
        onClick={handleClick}
        disabled={state !== 'idle'}
        aria-label={`Run AI analysis for ${symbol}`}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
          state === 'idle' && 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30',
          state === 'loading' && 'bg-gray-800 text-gray-600 cursor-wait',
          state === 'queued' && 'bg-blue-500/10 text-blue-400 cursor-default',
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
  { label: 'All', value: '' },
  { label: 'Bullish', value: 'BULLISH' },
  { label: 'Bearish', value: 'BEARISH' },
  { label: 'Neutral', value: 'NEUTRAL' },
] as const;

const TRIGGERS = [
  { label: 'All', value: '' },
  { label: 'Alert', value: 'alert' },
  { label: 'Manual', value: 'manual' },
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
  const hasActiveFilters =
    filters.symbol || filters.sentiment || filters.trigger;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
        <Filter size={12} />
        Filters
      </div>

      {/* Symbol dropdown */}
      <select
        value={filters.symbol ?? ''}
        onChange={(e) => setFilters({ ...filters, symbol: e.target.value || undefined })}
        className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs focus:outline-none focus:border-gray-500"
      >
        <option value="">All Symbols</option>
        {symbols.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Sentiment pills */}
      <div className="flex gap-1">
        {SENTIMENTS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilters({ ...filters, sentiment: opt.value as ReportFilters['sentiment'] })}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
              (filters.sentiment ?? '') === opt.value
                ? 'bg-gray-700 text-white'
                : 'text-gray-600 hover:text-gray-300',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Trigger pills */}
      <div className="flex gap-1">
        {TRIGGERS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilters({ ...filters, trigger: opt.value as ReportFilters['trigger'] })}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
              (filters.trigger ?? '') === opt.value
                ? 'bg-gray-700 text-white'
                : 'text-gray-600 hover:text-gray-300',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => setFilters({})}
          className="flex items-center gap-1 ml-auto text-gray-600 hover:text-gray-300 text-xs transition-colors"
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
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              AI Reports
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Gemini-powered analysis — updates instantly when new reports arrive
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh reports"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm transition-all"
          >
            <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Live analyzing banner */}
        {isAnalyzing && (
          <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Radio size={14} className="text-blue-400 animate-pulse shrink-0" />
            <p className="text-blue-400 text-sm">
              AI analysis running — report will appear automatically when ready
            </p>
            <Loader2 size={13} className="text-blue-400 animate-spin ml-auto shrink-0" />
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

          {/* Left — Watchlist + analyze buttons */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-emerald-500" />
                <h2 className="text-white font-semibold text-sm">
                  Analyze Symbol
                </h2>
              </div>

              {watchlistSymbols.length === 0 ? (
                <p className="text-gray-600 text-sm py-2">
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

              <p className="text-gray-700 text-[11px] mt-4 leading-relaxed">
                Powered by Inngest + Gemini 2.0 Flash. Results appear automatically via Supabase Realtime.
              </p>
            </div>
          </div>

          {/* Right — Reports */}
          <div className="space-y-4">
            {/* Filter bar */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              symbols={watchlistSymbols}
            />

            {/* Reports list */}
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
                  filters.symbol || filters.sentiment || filters.trigger
                    ? 'No reports match your current filters. Try clearing the filters.'
                    : 'Click "Analyze" next to any symbol to generate your first AI-powered report.'
                }
                action={
                  filters.symbol || filters.sentiment || filters.trigger
                    ? { label: 'Clear filters', onClick: () => setFilters({}) }
                    : undefined
                }
              />
            ) : (
              <>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onDelete={deleteReport}
                      onClick={setSelectedReport}
                    />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={loadMore}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-all"
                    >
                      Load more reports
                    </button>
                  </div>
                )}

                <p className="text-center text-gray-800 text-xs pt-1">
                  {reports.length} report{reports.length !== 1 ? 's' : ''} shown
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Report detail slide-over */}
      <ReportDetail
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}