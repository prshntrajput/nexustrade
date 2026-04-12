'use client';

import { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Loader2,
  FileText,
  Zap,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReports } from '@/hooks/useReports';
import { useWatchlist } from '@/hooks/useWatchlist';
import { ReportCard } from './ReportCard';
import { ReportDetail } from './ReportDetail';
import type { Report } from '@/types';

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
      // Reset button after 60s (matches polling window)
      setTimeout(() => setState('idle'), 60_000);
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
          state === 'idle' &&
            'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30',
          state === 'loading' && 'bg-gray-800 text-gray-600 cursor-wait',
          state === 'queued' && 'bg-blue-500/10 text-blue-400 cursor-default',
        )}
      >
        {state === 'loading' ? (
          <>
            <Loader2 size={11} className="animate-spin" />
            Queuing…
          </>
        ) : state === 'queued' ? (
          <>
            <Zap size={11} />
            Running…
          </>
        ) : (
          <>
            <Sparkles size={11} />
            Analyze
          </>
        )}
      </button>
    </div>
  );
}

function EmptyState({ hasWatchlist }: { hasWatchlist: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-gray-900 border border-gray-800 rounded-2xl">
      <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-5">
        <FileText size={22} className="text-gray-600" />
      </div>
      <h3 className="text-white font-semibold text-[15px] mb-2">
        No analysis reports yet
      </h3>
      <p className="text-gray-600 text-sm max-w-[260px] leading-relaxed">
        {hasWatchlist
          ? 'Click "Analyze" next to any symbol to generate your first AI report.'
          : 'Add symbols to your watchlist, then run an analysis to get started.'}
      </p>
    </div>
  );
}

export function ReportsView() {
  const { reports, isLoading, mutate, deleteReport, triggerAnalysis, isAnalyzing } =
    useReports();
  const { items: watchlistItems = [] } = useWatchlist();

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
              Gemini-powered technical analysis of your watchlist symbols
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh reports"
            aria-label="Refresh reports"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm transition-all"
          >
            <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Live analyzing banner — shows while Inngest is running */}
        {isAnalyzing && (
          <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Radio size={14} className="text-blue-400 animate-pulse shrink-0" />
            <p className="text-blue-400 text-sm">
              AI analysis running — report will appear automatically in ~15 seconds
            </p>
            <Loader2 size={13} className="text-blue-400 animate-spin ml-auto shrink-0" />
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

          {/* Left — Watchlist symbols */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-emerald-500" />
                <h2 className="text-white font-semibold text-sm">
                  Analyze Symbol
                </h2>
              </div>

              {watchlistItems.length === 0 ? (
                <p className="text-gray-600 text-sm py-2">
                  Add symbols to your watchlist first.
                </p>
              ) : (
                <div className="space-y-2">
                  {watchlistItems.map((item) => (
                    <AnalyzeButton
                      key={item.id}
                      symbol={item.symbol}
                      onAnalyze={triggerAnalysis}
                    />
                  ))}
                </div>
              )}

              <p className="text-gray-700 text-[11px] mt-4 leading-relaxed">
                Runs via Inngest + Gemini in the background. Page updates automatically.
              </p>
            </div>
          </div>

          {/* Right — Reports list */}
          <div>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-[110px] bg-gray-900 border border-gray-800 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <EmptyState hasWatchlist={watchlistItems.length > 0} />
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onDelete={deleteReport}
                    onClick={setSelectedReport}
                  />
                ))}
                <p className="text-center text-gray-800 text-xs pt-2">
                  {reports.length} report{reports.length !== 1 ? 's' : ''} — most recent first
                </p>
              </div>
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