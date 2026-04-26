'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMarketIndices } from '@/hooks/useMarket';
import { INDEX_ETF_LABELS } from '@/lib/market-data';
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

function IndexTile({
  symbol,
  label,
  quote,
}: {
  symbol: string;
  label: string;
  quote: Quote;
}) {
  const isUp = quote.changePercent > 0;
  const isDown = quote.changePercent < 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 p-3.5 bg-card border border-border min-w-[150px] flex-shrink-0',
        'hover:border-primary/30 transition-colors duration-150',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-foreground tracking-widest uppercase">
          {symbol}
        </span>
        <span
          className={cn(
            'flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5',
            isUp && 'text-emerald-400 bg-emerald-500/10',
            isDown && 'text-red-400 bg-red-500/10',
            !isUp && !isDown && 'text-muted-foreground bg-secondary',
          )}
        >
          {isUp ? (
            <TrendingUp size={10} />
          ) : isDown ? (
            <TrendingDown size={10} />
          ) : (
            <Minus size={10} />
          )}
          {isUp ? '+' : ''}
          {quote.changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="text-[17px] font-bold text-foreground tracking-tight tabular-nums">
        ${formatPrice(quote.price)}
      </div>
      <div className="text-[11px] text-muted-foreground/70 truncate">{label}</div>
    </div>
  );
}

export function IndicesBar() {
  const { indices, isLoading } = useMarketIndices();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[82px] min-w-[150px] flex-shrink-0" />
        ))}
      </div>
    );
  }

  const entries = Object.entries(INDEX_ETF_LABELS).filter(
    ([sym]) => !!indices[sym],
  );

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Market data unavailable — check back during market hours.
      </p>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {entries.map(([symbol, label]) => (
        <IndexTile
          key={symbol}
          symbol={symbol}
          label={label}
          quote={indices[symbol]!}
        />
      ))}
    </div>
  );
}
