'use client';

import { BarChart2, RefreshCw } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { AddSymbolForm } from '@/components/watchlist/AddSymbolForm';
import { WatchlistRow } from '@/components/watchlist/WatchlistRow';
import { WatchlistRowSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

export default function WatchlistContent() {
  const { watchlist, isLoading, isError, errorMessage, addSymbol, removeSymbol } =
    useWatchlist();

  const existingSymbols = watchlist.map((item) => item.symbol);

  // ─── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3">
        <WatchlistRowSkeleton />
        <WatchlistRowSkeleton />
        <WatchlistRowSkeleton />
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
          <RefreshCw size={22} className="text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">
          Failed to load watchlist
        </h3>
        <p className="text-gray-500 text-sm mb-4 max-w-xs">
          {errorMessage ?? 'Something went wrong. Please try again.'}
        </p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-5">
          <BarChart2 size={28} className="text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Your watchlist is empty
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mb-8 leading-relaxed">
          Add stock symbols to monitor live prices, set alerts, and get
          AI-powered analysis from Gemini.
        </p>
        <AddSymbolForm existingSymbols={[]} onAdd={addSymbol} />
      </div>
    );
  }

  // ─── Data state ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {watchlist.map((item) => (
        <WatchlistRow key={item.id} item={item} onRemove={removeSymbol} />
      ))}
    </div>
  );
}