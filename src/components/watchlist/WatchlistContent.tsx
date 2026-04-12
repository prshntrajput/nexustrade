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
      <div className="space-y-2 sm:space-y-3">
        <WatchlistRowSkeleton />
        <WatchlistRowSkeleton />
        <WatchlistRowSkeleton />
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
        <div className="w-12 h-12 bg-destructive/10 flex items-center justify-center mb-4">
          <RefreshCw size={22} className="text-destructive" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Failed to load watchlist
        </h3>
        <p className="text-muted-foreground text-sm mb-4 max-w-xs leading-relaxed">
          {errorMessage ?? 'Something went wrong. Please try again.'}
        </p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          <RefreshCw size={14} />
          Retry
        </Button>
      </div>
    );
  }

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-secondary flex items-center justify-center mb-4 sm:mb-5">
          <BarChart2 size={26} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Your watchlist is empty
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-6 sm:mb-8 leading-relaxed">
          Add stock symbols to monitor live prices, set alerts, and get
          AI-powered analysis from Gemini.
        </p>
        <AddSymbolForm existingSymbols={[]} onAdd={addSymbol} />
      </div>
    );
  }

  // ─── Data state ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-2 sm:space-y-3">
      {watchlist.map((item) => (
        <WatchlistRow key={item.id} item={item} onRemove={removeSymbol} />
      ))}
    </div>
  );
}
