'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus, Check, ExternalLink, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMarketScreener } from '@/hooks/useMarket';
import { useWatchlist } from '@/hooks/useWatchlist';
import { SCREENER_STOCKS, SCREENER_SECTORS } from '@/lib/market-data';
import { cn } from '@/lib/utils';
import type { Quote } from '@/types';

function formatPrice(price: number): string {
  return price >= 1_000
    ? price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : price.toFixed(2);
}

function ChangeDisplay({ value }: { value: number }) {
  const isUp = value > 0;
  const isDown = value < 0;

  return (
    <span
      className={cn(
        'tabular-nums text-[13px] font-semibold',
        isUp && 'text-emerald-400',
        isDown && 'text-red-400',
        !isUp && !isDown && 'text-muted-foreground',
      )}
    >
      {isUp ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  );
}

interface ScreenerRowProps {
  symbol: string;
  name: string;
  sector: string;
  quote: Quote;
  isWatched: boolean;
  onAdd: (symbol: string) => Promise<void>;
}

function ScreenerRow({
  symbol,
  name,
  sector,
  quote,
  isWatched,
  onAdd,
}: ScreenerRowProps) {
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (adding || isWatched) return;
    setAdding(true);
    try {
      await onAdd(symbol);
      toast.success(`${symbol} added to watchlist`);
    } catch {
      toast.error(`Failed to add ${symbol}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-secondary/30 transition-colors duration-100">
      {/* Symbol + Name */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/stock/${symbol}`}
          className="inline-flex items-center gap-1.5 group"
        >
          <span className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">
            {symbol}
          </span>
          <ExternalLink
            size={11}
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </Link>
        <p className="text-[11px] text-muted-foreground truncate">{name}</p>
      </div>

      {/* Sector badge — hidden on small screens */}
      <div className="hidden sm:block flex-shrink-0 w-28">
        <span className="text-[11px] text-muted-foreground/70 bg-secondary px-2 py-0.5 truncate block text-center">
          {sector}
        </span>
      </div>

      {/* Price + Change */}
      <div className="text-right flex-shrink-0 w-32">
        <p className="text-[13px] font-bold text-foreground tabular-nums">
          ${formatPrice(quote.price)}
        </p>
        <ChangeDisplay value={quote.changePercent} />
      </div>

      {/* Watchlist action */}
      <div className="flex-shrink-0 w-24 flex justify-end">
        {isWatched ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <Check size={12} />
            Watching
          </span>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            isLoading={adding}
            aria-label={`Add ${symbol} to watchlist`}
          >
            {!adding && (
              <>
                <Plus size={12} />
                <span>Watch</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export function StockScreener() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const { quotes, isLoading: quotesLoading } = useMarketScreener();
  const { watchlist, addSymbol } = useWatchlist();

  const watchedSymbols = useMemo(
    () => new Set(watchlist.map((w) => w.symbol)),
    [watchlist],
  );

  const filteredStocks = useMemo(
    () =>
      SCREENER_STOCKS.filter((stock) => {
        const matchesSector =
          activeFilter === 'All' || stock.sector === activeFilter;
        const q = search.trim();
        const matchesSearch =
          q === '' ||
          stock.symbol.startsWith(q.toUpperCase()) ||
          stock.name.toLowerCase().includes(q.toLowerCase());
        return matchesSector && matchesSearch;
      }),
    [activeFilter, search],
  );

  // Market breadth from loaded quotes
  const { advancing, declining } = useMemo(() => {
    let adv = 0;
    let dec = 0;
    Object.values(quotes).forEach((q) => {
      if (q.changePercent > 0) adv++;
      else if (q.changePercent < 0) dec++;
    });
    return { advancing: adv, declining: dec };
  }, [quotes]);

  const loaded = Object.keys(quotes).length;

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              <h2 className="text-[13px] font-bold text-foreground uppercase tracking-wider">
                Stock Screener
              </h2>
            </div>

            {/* Market breadth indicator */}
            {loaded > 0 && (
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-emerald-400 font-semibold">
                  ▲ {advancing}
                </span>
                <span className="text-muted-foreground/50">/</span>
                <span className="text-red-400 font-semibold">
                  ▼ {declining}
                </span>
                <span className="text-muted-foreground/60">
                  ({loaded} symbols)
                </span>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-52">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol or name…"
              className={cn(
                'w-full pl-8 pr-3 py-1.5 text-[13px] bg-secondary border border-border',
                'text-foreground placeholder:text-muted-foreground/50',
                'focus:outline-none focus:border-primary/50 transition-colors',
              )}
            />
          </div>
        </div>

        {/* Sector filters */}
        <div className="flex flex-wrap gap-1.5">
          {SCREENER_SECTORS.map((sector) => (
            <button
              key={sector}
              onClick={() => setActiveFilter(sector)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-semibold transition-all duration-100',
                activeFilter === sector
                  ? 'bg-primary/15 text-primary border border-primary/40'
                  : 'bg-secondary text-muted-foreground border border-transparent hover:border-border hover:text-foreground',
              )}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-secondary/60 border-b border-border">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Symbol / Company
          </span>
        </div>
        <div className="hidden sm:block w-28 flex-shrink-0 text-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Sector
          </span>
        </div>
        <div className="w-32 flex-shrink-0 text-right">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Price / Change
          </span>
        </div>
        <div className="w-24 flex-shrink-0 text-right">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Action
          </span>
        </div>
      </div>

      {/* Rows */}
      {quotesLoading ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No stocks match your search.
          </p>
        </div>
      ) : (
        <div>
          {filteredStocks.map((stock) => {
            const quote = quotes[stock.symbol];
            if (!quote) return null;
            return (
              <ScreenerRow
                key={stock.symbol}
                symbol={stock.symbol}
                name={stock.name}
                sector={stock.sector}
                quote={quote}
                isWatched={watchedSymbols.has(stock.symbol)}
                onAdd={addSymbol}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
