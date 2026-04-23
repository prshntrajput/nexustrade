'use client';

import { BarChart2, RefreshCw } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { AddSymbolForm } from '@/components/watchlist/AddSymbolForm';
import { WatchlistRow } from '@/components/watchlist/WatchlistRow';
import { WatchlistRowSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

export default function WatchlistContent() {
  const {
    watchlist,
    isLoading,
    isError,
    errorMessage,
    addSymbol,
    removeSymbol,
  } = useWatchlist();

  const existingSymbols = watchlist.map((item) => item.symbol);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="space-y-2 sm:space-y-3"
        aria-busy="true"
        aria-label="Loading watchlist"
      >
        <WatchlistRowSkeleton />
        <WatchlistRowSkeleton />
        <WatchlistRowSkeleton />
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center"
        role="alert"
      >
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-destructive/10 flex items-center justify-center mb-4">
          <RefreshCw size={20} className="text-destructive" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-1">
          Failed to load watchlist
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
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
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary flex items-center justify-center mb-4 sm:mb-5">
          <BarChart2 size={26} className="text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Your watchlist is empty
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs sm:max-w-sm mb-6 sm:mb-8 leading-relaxed">
          Add stock symbols to monitor live prices, set alerts, and get
          AI-powered analysis.
        </p>
        {/* Form takes full width on mobile */}
        <div className="w-full max-w-sm">
          <AddSymbolForm existingSymbols={[]} onAdd={addSymbol} />
        </div>
      </div>
    );
  }

  // ─── Data (non-empty list) ────────────────────────────────────────────────
  return (
    <div className="space-y-3 sm:space-y-4">

      {/*
        Toolbar — stacks vertically on mobile so the AddSymbolForm
        (collapsed = button, expanded = full form) always has full
        width and never gets squeezed against the count text.
      */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{watchlist.length}</span>{' '}
          {watchlist.length === 1 ? 'symbol' : 'symbols'} tracked
        </p>
        {/* Full-width on mobile, auto-width on sm+ */}
        <div className="w-full sm:w-auto">
          <AddSymbolForm existingSymbols={existingSymbols} onAdd={addSymbol} />
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 sm:space-y-3">
        {watchlist.map((item) => (
          <WatchlistRow key={item.id} item={item} onRemove={removeSymbol} />
        ))}
      </div>

      {/* Capacity hint — Finnhub WebSocket limit is 50 symbols */}
      {watchlist.length >= 45 && (
        <p className="text-center text-yellow-500/80 text-xs py-2 px-4 leading-relaxed">
          ⚠️ Approaching the 50 symbol live-feed limit. Some symbols may not
          receive real-time ticks.
        </p>
      )}
    </div>
  );
}
